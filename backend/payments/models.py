<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 4817196 (Add backend requirements.txt and local changes)
from django.db import models

class MpesaTransaction(models.Model):
    STATUS = [("pending","Pending"),("completed","Completed"),("failed","Failed"),("cancelled","Cancelled")]

    user                = models.ForeignKey("auth.User", on_delete=models.SET_NULL, null=True)
    checkout_request_id = models.CharField(max_length=100, unique=True, db_index=True)
    merchant_request_id = models.CharField(max_length=100)
    phone               = models.CharField(max_length=20)
    amount              = models.DecimalField(max_digits=10, decimal_places=2)
    account_ref         = models.CharField(max_length=50)   # e.g. "B1-MODULE"
    status              = models.CharField(max_length=20, choices=STATUS, default="pending")
    mpesa_receipt       = models.CharField(max_length=50, blank=True)  # e.g. "QKB7T...RY0"
    result_desc         = models.TextField(blank=True)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    def __str__(self):
<<<<<<< HEAD
        return f"{self.phone} | {self.amount} KES | {self.status}"
=======
from django.db import models
from django.conf import settings
from lms.models import Course


class Payment(models.Model):
    """Model to track all payment transactions"""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('initiated', 'Initiated'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_TYPE_CHOICES = [
        ('stk_push', 'STK Push'),
        ('b2c', 'B2C Refund'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    
    # M-Pesa specific fields
    phone_number = models.CharField(max_length=20)
    checkout_request_id = models.CharField(max_length=100, blank=True, null=True)
    mpesa_receipt_number = models.CharField(max_length=50, blank=True, null=True)
    transaction_date = models.DateTimeField(blank=True, null=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='stk_push')
    
    # Additional details
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment {self.id} - {self.user.email} - {self.amount} {self.currency}"


class PaymentCallback(models.Model):
    """Model to store M-Pesa payment callback data"""

    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='callbacks'
    )
    
    # Callback data
    merchant_request_id = models.CharField(max_length=100)
    checkout_request_id = models.CharField(max_length=100)
    result_code = models.IntegerField()
    result_desc = models.TextField()
    
    # M-Pesa response data
    mpesa_receipt_number = models.CharField(max_length=50, blank=True, null=True)
    phone_number = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Raw callback data
    raw_data = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Callback {self.id} - Receipt: {self.mpesa_receipt_number}"


class MpesaConfiguration(models.Model):
    """Store M-Pesa API configuration and credentials"""

    ENVIRONMENT_CHOICES = [
        ('sandbox', 'Sandbox'),
        ('production', 'Production'),
    ]

    name = models.CharField(max_length=100, unique=True)
    environment = models.CharField(max_length=20, choices=ENVIRONMENT_CHOICES, default='sandbox')
    
    # Credentials
    consumer_key = models.CharField(max_length=200)
    consumer_secret = models.CharField(max_length=200)
    shortcode = models.CharField(max_length=20)
    passkey = models.CharField(max_length=200)
    
    # Callback URLs
    callback_url = models.URLField(max_length=500)
    validation_url = models.URLField(max_length=500, blank=True)
    confirmation_url = models.URLField(max_length=500, blank=True)
    
    # B2C settings
    b2c_shortcode = models.CharField(max_length=20, blank=True)
    b2c_initiator_name = models.CharField(max_length=100, blank=True)
    b2c_initiator_password = models.CharField(max_length=200, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'M-Pesa Configuration'
        verbose_name_plural = 'M-Pesa Configurations'

    def __str__(self):
        return f"M-Pesa Config: {self.name} ({self.environment})"
>>>>>>> 77cb46cef5c804655b1de1f6594bb68686953203
=======
        return f"{self.phone} | {self.amount} KES | {self.status}"
>>>>>>> 4817196 (Add backend requirements.txt and local changes)
