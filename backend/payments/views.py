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