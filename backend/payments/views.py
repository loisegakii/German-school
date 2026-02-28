import logging
from datetime import datetime

from django.conf import settings
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from lms.models import Course, Enrollment
from .models import Payment, PaymentCallback
from .serializers import (
    PaymentInitiateSerializer,
    PaymentSerializer,
    PaymentStatusSerializer,
    PaymentListSerializer,
    B2CPaymentSerializer,
)
from adapters.payments.mpesa import MpesaDaraja, MpesaException, get_mpesa_adapter

logger = logging.getLogger(__name__)


class InitiatePaymentView(APIView):
    """
    POST /api/payments/mpesa/initiate/

    Initiates an M-Pesa STK Push for course enrollment.

    FIX: Changed permission to AllowAny — payment happens BEFORE the user
    account is created, so no JWT token exists at this point in the
    registration flow.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PaymentInitiateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        course_id    = serializer.validated_data['course_id']
        phone_number = serializer.validated_data['phone_number']
        amount       = serializer.validated_data['amount']  # USD

        # ── Look up course ────────────────────────────────────────────────────
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response(
                {'error': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if course.price <= 0:
            return Response(
                {'error': 'This course is free — no payment required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Format phone number ───────────────────────────────────────────────
        formatted_phone = MpesaDaraja.format_phone_number(phone_number)

        # ── Convert USD → KES for Safaricom ──────────────────────────────────
        USD_TO_KES  = getattr(settings, 'USD_TO_KES_RATE', 130)
        amount_kes  = round(float(amount) * USD_TO_KES, 2)

        # ── Create pending payment record ─────────────────────────────────────
        # Attach to request.user only when already authenticated (e.g. buying
        # a second module). For pre-registration the user field is null —
        # the registration view links the payment after the account is created.
        payment = Payment.objects.create(
            user=request.user if request.user.is_authenticated else None,
            course=course,
            amount_usd=amount,       # original USD value from frontend
            amount=amount_kes,       # KES value sent to Safaricom
            currency='KES',
            phone_number=formatted_phone,
            status='pending',
            description=f"Enrollment for {course.title}",
        )

        # ── Initiate STK Push ─────────────────────────────────────────────────
        try:
            mpesa = get_mpesa_adapter()

            response = mpesa.initiate_stk_push(
                phone_number=formatted_phone,
                amount=amount_kes,           # Safaricom requires KES
                account_reference=f"PAY{payment.id}",
                transaction_desc=f"Enrollment: {course.title}",
                callback_url=getattr(settings, 'MPESA_CALLBACK_URL', None),
            )

            checkout_request_id = response.get('CheckoutRequestID')
            payment.checkout_request_id = checkout_request_id
            payment.status   = 'initiated'
            payment.metadata = {
                'merchant_request_id': response.get('MerchantRequestID'),
                'response_code':       response.get('ResponseCode'),
                'response_desc':       response.get('ResponseDescription'),
            }
            payment.save()

            logger.info(f"STK Push initiated — payment {payment.id}")

            return Response({
                'message':             'Payment initiated successfully.',
                'payment_id':          payment.id,
                'checkout_request_id': checkout_request_id,
                'amount_usd':          str(amount),
                'amount_kes':          str(amount_kes),
                'phone_number':        formatted_phone,
            }, status=status.HTTP_200_OK)

        except MpesaException as e:
            payment.status   = 'failed'
            payment.metadata = {'error': str(e)}
            payment.save()

            logger.error(f"STK Push failed: {e}")
            return Response(
                {'error': f'Payment initiation failed: {e}'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class MpesaStatusView(APIView):
    """
    GET /api/payments/mpesa/status/<checkout_request_id>/

    Polled by the frontend every 3 s while waiting for the user to enter
    their M-Pesa PIN.  Returns the current payment status so the UI can
    advance the moment Safaricom confirms the transaction.

    Possible status values:
        pending   — payment record created, STK push not yet sent
        initiated — STK push sent, waiting for PIN entry
        completed — PIN accepted, payment confirmed  ← frontend advances
        cancelled — user dismissed the prompt
        failed    — wrong PIN / insufficient balance / other Safaricom error
    """
    permission_classes = [AllowAny]  # no token exists during registration

    def get(self, request, checkout_request_id):
        try:
            payment = Payment.objects.get(checkout_request_id=checkout_request_id)
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            PaymentStatusSerializer(payment).data,
            status=status.HTTP_200_OK,
        )


class PaymentCallbackView(APIView):
    """
    POST /api/payments/callback/

    M-Pesa webhook called by Safaricom after the user enters their PIN.
    Updates payment status and auto-enrolls the student on success.
    """
    permission_classes = [AllowAny]  # M-Pesa sends no auth headers

    @transaction.atomic
    def post(self, request):
        try:
            raw_data = request.data
            logger.info(f"M-Pesa callback received: {raw_data}")

            mpesa  = get_mpesa_adapter()
            parsed = mpesa.validate_callback(raw_data)

            checkout_request_id = parsed.get('checkout_request_id')
            payment = Payment.objects.filter(
                checkout_request_id=checkout_request_id
            ).first()

            if not payment:
                logger.warning(
                    f"No payment found for checkout_request_id: {checkout_request_id}"
                )
                return Response({'status': 'ignored'}, status=status.HTTP_200_OK)

            # ── Record raw callback ───────────────────────────────────────────
            PaymentCallback.objects.create(
                payment=payment,
                merchant_request_id  = parsed.get('merchant_request_id', ''),
                checkout_request_id  = checkout_request_id,
                result_code          = parsed.get('result_code', 0),
                result_desc          = parsed.get('result_desc', ''),
                mpesa_receipt_number = parsed.get('mpesa_receipt_number'),
                phone_number         = parsed.get('phone_number', ''),
                amount               = parsed.get('amount', 0),
                raw_data             = raw_data,
            )

            # ── Update payment status ─────────────────────────────────────────
            if parsed.get('result_code') == 0:
                payment.status               = 'completed'
                payment.mpesa_receipt_number = parsed.get('mpesa_receipt_number')
                payment.transaction_date     = parsed.get('transaction_date')
                payment.metadata             = {
                    **payment.metadata,
                    'callback_processed': True,
                    'receipt_number':     parsed.get('mpesa_receipt_number'),
                }
                payment.save()

                # Auto-enroll if payment is already linked to a registered account.
                # If user is still null (pre-registration flow), enrollment is
                # triggered later via payment.link_user(user) once the account
                # is created — see Payment.link_user() in models.py.
                if payment.user:
                    enrollment, created = Enrollment.objects.get_or_create(
                        student=payment.user,
                        course=payment.course,
                        defaults={'is_active': True},
                    )
                    if not created and not enrollment.is_active:
                        enrollment.is_active = True
                        enrollment.save()

                logger.info(f"Payment {payment.id} completed.")

            else:
                payment.status   = 'failed'
                payment.metadata = {
                    **payment.metadata,
                    'callback_processed': True,
                    'failure_reason':     parsed.get('result_desc'),
                }
                payment.save()
                logger.warning(
                    f"Payment {payment.id} failed: {parsed.get('result_desc')}"
                )

            return Response({'status': 'received'}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Callback processing error: {e}")
            return Response(
                {'error': 'Callback processing failed.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PaymentStatusView(APIView):
    """
    GET /api/payments/<payment_id>/status/

    Check status by internal payment ID (authenticated users only).
    Queries Safaricom directly if the payment is still pending/initiated.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, payment_id):
        try:
            payment = Payment.objects.get(pk=payment_id, user=request.user)
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if payment.status in ['pending', 'initiated'] and payment.checkout_request_id:
            try:
                mpesa  = get_mpesa_adapter()
                result = mpesa.query_stk_status(payment.checkout_request_id)

                if result.get('ResultCode') == 0:
                    payment.status   = 'completed'
                    payment.metadata = {
                        **payment.metadata,
                        'queried':     True,
                        'result_code': result.get('ResultCode'),
                    }
                    payment.save()

                    Enrollment.objects.get_or_create(
                        student=payment.user,
                        course=payment.course,
                        defaults={'is_active': True},
                    )
            except MpesaException as e:
                logger.error(f"Status query failed: {e}")

        return Response(PaymentSerializer(payment).data)


class MyPaymentsView(APIView):
    """
    GET /api/payments/my/

    Returns all payments for the current authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        payments = Payment.objects.filter(
            user=request.user
        ).select_related('course')
        return Response(PaymentListSerializer(payments, many=True).data)


class AdminPaymentListView(APIView):
    """
    GET /api/payments/admin/

    Returns all payments. Supports filtering via query params:
        ?status=completed
        ?user_id=5
        ?course_id=2
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        payments = Payment.objects.select_related(
            'user', 'course'
        ).order_by('-created_at')

        status_filter = request.query_params.get('status')
        if status_filter:
            payments = payments.filter(status=status_filter)

        user_id = request.query_params.get('user_id')
        if user_id:
            payments = payments.filter(user_id=user_id)

        course_id = request.query_params.get('course_id')
        if course_id:
            payments = payments.filter(course_id=course_id)

        return Response(PaymentListSerializer(payments, many=True).data)


class B2CPaymentView(APIView):
    """
    POST /api/payments/b2c/

    Sends a B2C payment (e.g. refund) to a Safaricom number.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = B2CPaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone_number = serializer.validated_data['phone_number']
        amount       = serializer.validated_data['amount']
        occasion     = serializer.validated_data.get('occasion', 'Refund')

        formatted_phone = MpesaDaraja.format_phone_number(phone_number)

        try:
            mpesa    = get_mpesa_adapter()
            response = mpesa.send_b2c_payment(
                phone_number=formatted_phone,
                amount=float(amount),
                occasion=occasion,
            )

            payment_id = serializer.validated_data.get('payment_id')
            if payment_id:
                try:
                    payment              = Payment.objects.get(pk=payment_id)
                    payment.payment_type = 'b2c'
                    payment.status       = 'completed'
                    payment.metadata     = {**payment.metadata, 'b2c_response': response}
                    payment.save()
                except Payment.DoesNotExist:
                    pass

            return Response({
                'message':         'B2C payment initiated.',
                'conversation_id': response.get('ConversationID'),
                'response_code':   response.get('ResponseCode'),
            }, status=status.HTTP_200_OK)

        except MpesaException as e:
            logger.error(f"B2C payment failed: {e}")
            return Response(
                {'error': f'B2C payment failed: {e}'},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ─── M-Pesa Webhook Validation & Confirmation (required for B2C) ──────────────

class MpesaValidationView(APIView):
    """POST /api/payments/validate/"""
    permission_classes = [AllowAny]

    def post(self, request):
        return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})


class MpesaConfirmationView(APIView):
    """POST /api/payments/confirm/"""
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        logger.info(f"M-Pesa confirmation received: {request.data}")
        return Response({'ResultCode': 0, 'ResultDesc': 'Confirmed'})