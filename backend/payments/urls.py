from django.urls import path
from . import views

urlpatterns = [

    # ── M-Pesa STK Push ───────────────────────────────────────────────────────
    #
    # POST  /api/payments/mpesa/initiate/
    #   Sends the STK Push to the user's phone.
    #   AllowAny — called before the user account is created.
    #
    # GET   /api/payments/mpesa/status/<checkout_request_id>/
    #   Polled by the frontend every 3 s to check PIN confirmation.
    #   AllowAny — same reason as above.
    #
    path(
        'mpesa/initiate/',
        views.InitiatePaymentView.as_view(),
        name='mpesa-initiate',
    ),
    path(
        'mpesa/status/<str:checkout_request_id>/',
        views.MpesaStatusView.as_view(),
        name='mpesa-status',
    ),

    # ── M-Pesa Webhook (Safaricom → backend) ──────────────────────────────────
    #
    # POST  /api/payments/callback/
    #   Safaricom calls this after the user enters their PIN.
    #   AllowAny — Safaricom sends no auth headers.
    #
    path(
        'callback/',
        views.PaymentCallbackView.as_view(),
        name='payment-callback',
    ),

    # ── Authenticated payment actions ─────────────────────────────────────────
    #
    # GET   /api/payments/<payment_id>/status/
    #   Check status by internal ID (queries Safaricom if still pending).
    #   IsAuthenticated.
    #
    # GET   /api/payments/my/
    #   List all payments belonging to the current user.
    #
    # GET   /api/payments/admin/
    #   List all payments (admin use). Supports ?status= ?user_id= ?course_id=
    #
    # POST  /api/payments/b2c/
    #   Send a B2C payment (refund) to a Safaricom number.
    #
    path(
        '<int:payment_id>/status/',
        views.PaymentStatusView.as_view(),
        name='payment-status',
    ),
    path(
        'my/',
        views.MyPaymentsView.as_view(),
        name='my-payments',
    ),
    path(
        'admin/',
        views.AdminPaymentListView.as_view(),
        name='admin-payments',
    ),
    path(
        'b2c/',
        views.B2CPaymentView.as_view(),
        name='b2c-payment',
    ),

    # ── M-Pesa Validation & Confirmation (required for B2C) ───────────────────
    path(
        'validate/',
        views.MpesaValidationView.as_view(),
        name='mpesa-validation',
    ),
    path(
        'confirm/',
        views.MpesaConfirmationView.as_view(),
        name='mpesa-confirmation',
    ),
]