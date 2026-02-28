from django.db import models
from django.conf import settings
from lms.models import Course


class Payment(models.Model):
    """
    Tracks every payment transaction — both pre-registration (guest) and
    post-registration (authenticated user).

    CHANGES FROM PREVIOUS VERSION:
      1. `user` is now nullable (null=True, blank=True, on_delete=SET_NULL).
         During the registration flow the user account does not exist yet
         when payment is initiated, so we cannot attach a user at that point.
         The view links the payment to the user after the account is created.

      2. `amount_usd` added — stores the original USD amount sent by the
         frontend. `amount` (KES) is kept for M-Pesa which requires KES.

      3. 'cancelled' was already in STATUS_CHOICES — confirmed and kept.

      4. `checkout_request_id` indexed for fast polling lookups.
    """

    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('initiated', 'Initiated'),
        ('completed', 'Completed'),
        ('failed',    'Failed'),
        ('cancelled', 'Cancelled'),   # user dismissed the STK prompt
    ]

    PAYMENT_TYPE_CHOICES = [
        ('stk_push', 'STK Push'),
        ('b2c',      'B2C Refund'),
    ]

    # ── Relationships ─────────────────────────────────────────────────────────
    #
    # FIX: user is nullable.
    #   - NULL during pre-registration payment (no account exists yet).
    #   - Populated by the registration view after the account is created.
    #   - SET_NULL preserves payment history if the user is ever deleted.
    #
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='payments',
        null=True,
        blank=True,
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='payments',
    )

    # ── Amount fields ─────────────────────────────────────────────────────────
    #
    # `amount_usd` — the USD value received from the frontend.
    # `amount`     — the KES value actually sent to Safaricom.
    #
    # The view is responsible for converting USD → KES before saving.
    # Keeping both makes reconciliation and receipts much cleaner.
    #
    amount_usd = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Original amount in USD as received from the frontend.",
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Amount in KES sent to Safaricom (amount_usd × exchange rate).",
    )
    currency = models.CharField(max_length=3, default='KES')

    # ── M-Pesa specific fields ────────────────────────────────────────────────
    phone_number         = models.CharField(max_length=20)
    checkout_request_id  = models.CharField(
        max_length=100, blank=True, null=True, db_index=True,
        help_text="Returned by Safaricom on STK Push. Used for status polling.",
    )
    mpesa_receipt_number = models.CharField(max_length=50, blank=True, null=True)
    transaction_date     = models.DateTimeField(blank=True, null=True)

    # ── Status & type ─────────────────────────────────────────────────────────
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES,       default='pending')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES,  default='stk_push')

    # ── Extra detail ──────────────────────────────────────────────────────────
    description = models.TextField(blank=True)
    metadata    = models.JSONField(default=dict, blank=True)

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        user_label = self.user.email if self.user else 'guest'
        return f"Payment {self.id} — {user_label} — {self.amount} {self.currency}"

    # ── Helpers ───────────────────────────────────────────────────────────────
    @property
    def is_successful(self):
        return self.status == 'completed'

    @property
    def display_amount(self):
        """Human-readable amount string showing both currencies when available."""
        if self.amount_usd:
            return f"${self.amount_usd} / KES {self.amount}"
        return f"KES {self.amount}"


class PaymentCallback(models.Model):
    """Stores the raw M-Pesa callback payload for every Safaricom notification."""

    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='callbacks',
    )

    # Callback identifiers
    merchant_request_id = models.CharField(max_length=100)
    checkout_request_id = models.CharField(max_length=100)
    result_code         = models.IntegerField()
    result_desc         = models.TextField()

    # Transaction details
    mpesa_receipt_number = models.CharField(max_length=50, blank=True, null=True)
    phone_number         = models.CharField(max_length=20)
    amount               = models.DecimalField(max_digits=10, decimal_places=2)

    # Full raw payload — keep for debugging and auditing
    raw_data = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Callback {self.id} — Receipt: {self.mpesa_receipt_number}"


class MpesaConfiguration(models.Model):
    """Stores M-Pesa API credentials and callback URLs."""

    ENVIRONMENT_CHOICES = [
        ('sandbox',    'Sandbox'),
        ('production', 'Production'),
    ]

    name        = models.CharField(max_length=100, unique=True)
    environment = models.CharField(
        max_length=20, choices=ENVIRONMENT_CHOICES, default='sandbox'
    )

    # Credentials
    consumer_key    = models.CharField(max_length=200)
    consumer_secret = models.CharField(max_length=200)
    shortcode       = models.CharField(max_length=20)
    passkey         = models.CharField(max_length=200)

    # Callback URLs
    callback_url     = models.URLField(max_length=500)
    validation_url   = models.URLField(max_length=500, blank=True)
    confirmation_url = models.URLField(max_length=500, blank=True)

    # B2C settings
    b2c_shortcode          = models.CharField(max_length=20,  blank=True)
    b2c_initiator_name     = models.CharField(max_length=100, blank=True)
    b2c_initiator_password = models.CharField(max_length=200, blank=True)

    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'M-Pesa Configuration'
        verbose_name_plural = 'M-Pesa Configurations'

    def __str__(self):
        return f"M-Pesa Config: {self.name} ({self.environment})"