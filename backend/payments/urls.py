<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 4817196 (Add backend requirements.txt and local changes)
from django.urls import path
from .views import InitiateMpesaView, MpesaCallbackView, MpesaStatusView

urlpatterns = [
    path("mpesa/initiate/",         InitiateMpesaView.as_view()),
    path("mpesa/callback/",         MpesaCallbackView.as_view()),
    path("mpesa/status/<str:checkout_request_id>/", MpesaStatusView.as_view()),
<<<<<<< HEAD
]
=======
from django.urls import path
from . import views

urlpatterns = [
    # Payment initiation
    path('initiate/', views.InitiatePaymentView.as_view(), name='initiate-payment'),
    
    # Payment callback (M-Pesa webhook)
    path('callback/', views.PaymentCallbackView.as_view(), name='payment-callback'),
    
    # Payment status
    path('<int:payment_id>/status/', views.PaymentStatusView.as_view(), name='payment-status'),
    
    # User payments
    path('my/', views.MyPaymentsView.as_view(), name='my-payments'),
    
    # Admin payments
    path('admin/', views.AdminPaymentListView.as_view(), name='admin-payments'),
    
    # B2C payments (refunds)
    path('b2c/', views.B2CPaymentView.as_view(), name='b2c-payment'),
    
    # M-Pesa validation & confirmation (required for B2C)
    path('validate/', views.MpesaValidationView.as_view(), name='mpesa-validation'),
    path('confirm/', views.MpesaConfirmationView.as_view(), name='mpesa-confirmation'),
]
>>>>>>> 77cb46cef5c804655b1de1f6594bb68686953203
=======
]
>>>>>>> 4817196 (Add backend requirements.txt and local changes)
