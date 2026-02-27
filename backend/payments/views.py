<<<<<<< HEAD
import json
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import MpesaTransaction
from services.mpesa import stk_push

def normalize_phone(phone: str) -> str:
    """Convert 07XX or +2547XX → 2547XXXXXXXX"""
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("+"):
        phone = phone[1:]
    if phone.startswith("0"):
        phone = "254" + phone[1:]
    return phone


class InitiateMpesaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        phone   = request.data.get("phone", "")
        amount  = request.data.get("amount")   # KES integer
        level   = request.data.get("level", "MODULE")

        if not phone or not amount:
            return Response({"error": "phone and amount are required"}, status=400)

        phone_normalized = normalize_phone(phone)
        account_ref      = f"GSO-{level.replace(' ', '-')[:20]}"

        try:
            result = stk_push(
                phone       = phone_normalized,
                amount      = int(amount),
                account_ref = account_ref,
                description = f"German School — {level}",
            )
        except Exception as e:
            return Response({"error": str(e)}, status=502)

        # Save a pending transaction
        tx = MpesaTransaction.objects.create(
            user                = request.user,
            checkout_request_id = result["CheckoutRequestID"],
            merchant_request_id = result["MerchantRequestID"],
            phone               = phone_normalized,
            amount              = amount,
            account_ref         = account_ref,
        )

        return Response({
            "checkout_request_id": tx.checkout_request_id,
            "message": "STK push sent — please check your phone",
        })


class MpesaCallbackView(APIView):
    """Safaricom POSTs here after user enters PIN (or cancels)."""
    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        try:
            body    = request.data
            stk     = body["Body"]["stkCallback"]
            cid     = stk["CheckoutRequestID"]
            code    = stk["ResultCode"]   # 0 = success
            desc    = stk["ResultDesc"]

            tx = MpesaTransaction.objects.get(checkout_request_id=cid)

            if code == 0:
                items   = {i["Name"]: i["Value"] for i in stk["CallbackMetadata"]["Item"] if "Value" in i}
                tx.status        = "completed"
                tx.mpesa_receipt = items.get("MpesaReceiptNumber", "")
            else:
                tx.status = "cancelled" if code == 1032 else "failed"

            tx.result_desc = desc
            tx.save()

            # TODO: Grant course access here
            # activate_course_access(tx.user, tx.account_ref)

        except Exception as e:
            # Always return 200 to Safaricom or they'll retry
            pass

        return Response({"ResultCode": 0, "ResultDesc": "Accepted"})


class MpesaStatusView(APIView):
    """Frontend polls this to know if payment completed."""
    permission_classes = [IsAuthenticated]

    def get(self, request, checkout_request_id):
        try:
            tx = MpesaTransaction.objects.get(
                checkout_request_id = checkout_request_id,
                user                = request.user,
            )
            return Response({"status": tx.status, "receipt": tx.mpesa_receipt})
        except MpesaTransaction.DoesNotExist:
            return Response({"error": "Transaction not found"}, status=404)
=======
import logging
from datetime import datetime

from django.conf import settings
from django.db import transaction
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from lms.models import Course, Enrollment
from .models import Payment, PaymentCallback
from .serializers import (
    PaymentInitiateSerializer,
    PaymentSerializer,
    PaymentListSerializer,
    B2CPaymentSerializer,
)
from adapters.payments.mpesa import MpesaDaraja, MpesaException, get_mpesa_adapter

logger = logging.getLogger(__name__)


class InitiatePaymentView(APIView):
    """
    POST /api/payments/initiate/
    
    Initiate STK Push payment for course enrollment
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = PaymentInitiateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Get validated data
        course_id = serializer.validated_data['course_id']
        phone_number = serializer.validated_data['phone_number']
        amount = serializer.validated_data['amount']
        
        # Get course
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response(
                {'error': 'Course not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify price matches
        if course.price <= 0:
            return Response(
                {'error': 'This course is free'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Format phone number
        formatted_phone = MpesaDaraja.format_phone_number(phone_number)
        
        # Create payment record
        payment = Payment.objects.create(
            user=request.user,
            course=course,
            amount=amount,
            phone_number=formatted_phone,
            status='pending',
            description=f"Enrollment for {course.title}"
        )
        
        # Initiate M-Pesa STK Push
        try:
            mpesa = get_mpesa_adapter()
            
            response = mpesa.initiate_stk_push(
                phone_number=formatted_phone,
                amount=float(amount),
                account_reference=f"PAY{payment.id}",
                transaction_desc=f"Enrollment: {course.title}",
                callback_url=getattr(settings, 'MPESA_CALLBACK_URL', None)
            )
            
            # Update payment with checkout request ID
            checkout_request_id = response.get('CheckoutRequestID')
            payment.checkout_request_id = checkout_request_id
            payment.status = 'initiated'
            payment.metadata = {
                'merchant_request_id': response.get('MerchantRequestID'),
                'response_code': response.get('ResponseCode'),
                'response_desc': response.get('ResponseDescription')
            }
            payment.save()
            
            logger.info(f"STK Push initiated for payment {payment.id}")
            
            return Response({
                'message': 'Payment initiated successfully',
                'payment_id': payment.id,
                'checkout_request_id': checkout_request_id,
                'amount': str(amount),
                'phone_number': formatted_phone
            }, status=status.HTTP_200_OK)
            
        except MpesaException as e:
            payment.status = 'failed'
            payment.metadata = {'error': str(e)}
            payment.save()
            
            logger.error(f"STK Push failed: {str(e)}")
            return Response(
                {'error': f'Payment initiation failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class PaymentCallbackView(APIView):
    """
    POST /api/payments/callback/
    
    M-Pesa callback URL - handles payment completion notifications
    """
    permission_classes = [AllowAny]  # M-Pesa doesn't send auth
    
    @transaction.atomic
    def post(self, request):
        try:
            raw_data = request.data
            logger.info(f"M-Pesa callback received: {raw_data}")
            
            # Parse and validate callback
            mpesa = get_mpesa_adapter()
            parsed = mpesa.validate_callback(raw_data)
            
            # Find payment by checkout request ID
            checkout_request_id = parsed.get('checkout_request_id')
            payment = Payment.objects.filter(
                checkout_request_id=checkout_request_id
            ).first()
            
            if not payment:
                logger.warning(f"No payment found for checkout_request_id: {checkout_request_id}")
                return Response({'status': 'ignored'}, status=status.HTTP_200_OK)
            
            # Create callback record
            callback = PaymentCallback.objects.create(
                payment=payment,
                merchant_request_id=parsed.get('merchant_request_id', ''),
                checkout_request_id=checkout_request_id,
                result_code=parsed.get('result_code', 0),
                result_desc=parsed.get('result_desc', ''),
                mpesa_receipt_number=parsed.get('mpesa_receipt_number'),
                phone_number=parsed.get('phone_number', ''),
                amount=parsed.get('amount', 0),
                raw_data=raw_data
            )
            
            # Update payment based on result
            if parsed.get('result_code') == 0:
                # Success
                payment.status = 'completed'
                payment.mpesa_receipt_number = parsed.get('mpesa_receipt_number')
                payment.transaction_date = parsed.get('transaction_date')
                payment.metadata = {
                    **payment.metadata,
                    'callback_processed': True,
                    'receipt_number': parsed.get('mpesa_receipt_number')
                }
                payment.save()
                
                # Auto-enroll user in course
                enrollment, created = Enrollment.objects.get_or_create(
                    student=payment.user,
                    course=payment.course,
                    defaults={'is_active': True}
                )
                if not created and not enrollment.is_active:
                    enrollment.is_active = True
                    enrollment.save()
                
                logger.info(f"Payment {payment.id} completed - user enrolled")
                
            else:
                # Failed
                payment.status = 'failed'
                payment.metadata = {
                    **payment.metadata,
                    'callback_processed': True,
                    'failure_reason': parsed.get('result_desc')
                }
                payment.save()
                
                logger.warning(f"Payment {payment.id} failed: {parsed.get('result_desc')}")
            
            return Response({'status': 'received'}, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Callback processing error: {str(e)}")
            return Response(
                {'error': 'Callback processing failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaymentStatusView(APIView):
    """
    GET /api/payments/<payment_id>/status/
    
    Check payment status
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, payment_id):
        try:
            payment = Payment.objects.get(pk=payment_id, user=request.user)
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # If payment is still pending/initiated, query M-Pesa
        if payment.status in ['pending', 'initiated'] and payment.checkout_request_id:
            try:
                mpesa = get_mpesa_adapter()
                result = mpesa.query_stk_status(payment.checkout_request_id)
                
                result_code = result.get('ResultCode')
                if result_code == 0:
                    # Payment successful
                    payment.status = 'completed'
                    payment.metadata = {
                        **payment.metadata,
                        'queried': True,
                        'result_code': result_code
                    }
                    payment.save()
                    
                    # Auto-enroll
                    enrollment, created = Enrollment.objects.get_or_create(
                        student=payment.user,
                        course=payment.course,
                        defaults={'is_active': True}
                    )
                    
            except MpesaException as e:
                logger.error(f"Status query failed: {str(e)}")
        
        return Response(PaymentSerializer(payment).data)


class MyPaymentsView(APIView):
    """
    GET /api/payments/my/
    
    List current user's payments
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        payments = Payment.objects.filter(user=request.user).select_related('course')
        return Response(PaymentListSerializer(payments, many=True).data)


class AdminPaymentListView(APIView):
    """
    GET /api/payments/admin/
    
    List all payments (admin only)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Add admin permission check here if needed
        payments = Payment.objects.select_related('user', 'course').order_by('-created_at')
        
        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter:
            payments = payments.filter(status=status_filter)
        
        # Filter by user
        user_id = request.query_params.get('user_id')
        if user_id:
            payments = payments.filter(user_id=user_id)
        
        # Filter by course
        course_id = request.query_params.get('course_id')
        if course_id:
            payments = payments.filter(course_id=course_id)
        
        return Response(PaymentListSerializer(payments, many=True).data)


class B2CPaymentView(APIView):
    """
    POST /api/payments/b2c/
    
    Send B2C payment (for refunds)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = B2CPaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        phone_number = serializer.validated_data['phone_number']
        amount = serializer.validated_data['amount']
        occasion = serializer.validated_data.get('occasion', 'Refund')
        
        # Format phone number
        formatted_phone = MpesaDaraja.format_phone_number(phone_number)
        
        try:
            mpesa = get_mpesa_adapter()
            response = mpesa.send_b2c_payment(
                phone_number=formatted_phone,
                amount=float(amount),
                occasion=occasion
            )
            
            # Optionally create a payment record for B2C
            payment = None
            payment_id = serializer.validated_data.get('payment_id')
            if payment_id:
                try:
                    payment = Payment.objects.get(pk=payment_id)
                    payment.payment_type = 'b2c'
                    payment.status = 'completed'
                    payment.metadata = {
                        **payment.metadata,
                        'b2c_response': response
                    }
                    payment.save()
                except Payment.DoesNotExist:
                    pass
            
            return Response({
                'message': 'B2C payment initiated',
                'conversation_id': response.get('ConversationID'),
                'response_code': response.get('ResponseCode')
            }, status=status.HTTP_200_OK)
            
        except MpesaException as e:
            logger.error(f"B2C payment failed: {str(e)}")
            return Response(
                {'error': f'B2C payment failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


# ─── Webhook Validation (M-Pesa Requirements) ─────────────────────────────────

class MpesaValidationView(APIView):
    """
    POST /api/payments/validate/
    
    M-Pesa validation endpoint (required for B2C)
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Process validation request
        # Return appropriate response for M-Pesa
        return Response({
            'ResultCode': 0,
            'ResultDesc': 'Accepted'
        })


class MpesaConfirmationView(APIView):
    """
    POST /api/payments/confirm/
    
    M-Pesa confirmation endpoint (required for B2C)
    """
    permission_classes = [AllowAny]
    
    @transaction.atomic
    def post(self, request):
        raw_data = request.data
        logger.info(f"M-Pesa confirmation received: {raw_data}")
        
        # Process confirmation - similar to callback
        # This is for B2C and other transaction types
        
        return Response({
            'ResultCode': 0,
            'ResultDesc': 'Confirmed'
        })
>>>>>>> 77cb46cef5c804655b1de1f6594bb68686953203
