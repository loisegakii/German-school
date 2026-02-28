from rest_framework import serializers
from .models import Payment, PaymentCallback, MpesaConfiguration


class PaymentInitiateSerializer(serializers.Serializer):
    """
    Serializer for initiating a payment.

    FIX: Accepts the three fields the frontend actually sends:
        - phone_number  (was 'phone')
        - course_id     (was missing)
        - amount        (USD decimal — backend converts to KES if needed)
    """
    course_id    = serializers.IntegerField()
    phone_number = serializers.CharField(max_length=20)
    amount       = serializers.DecimalField(max_digits=10, decimal_places=2)

    def validate_phone_number(self, value):
        """Strip whitespace and validate Safaricom format."""
        value = value.strip().replace(' ', '')

        if not value:
            raise serializers.ValidationError("Phone number is required.")

        # Accept: 07XXXXXXXX  01XXXXXXXX  2547XXXXXXXX  2541XXXXXXXX  (+254…)
        import re
        normalised = value.lstrip('+')
        if not re.match(r'^(07|01|2547|2541)\d{8}$', normalised):
            raise serializers.ValidationError(
                "Enter a valid Safaricom number — e.g. 0712345678 or 254712345678."
            )

        return value

    def validate_amount(self, value):
        """Amount must be positive."""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value


class PaymentCallbackSerializer(serializers.Serializer):
    """Serializer for M-Pesa callback data."""

    checkout_request_id  = serializers.CharField()
    merchant_request_id  = serializers.CharField()
    result_code          = serializers.IntegerField()
    result_desc          = serializers.CharField()
    mpesa_receipt_number = serializers.CharField(required=False, allow_null=True)
    phone_number         = serializers.CharField()
    amount               = serializers.DecimalField(max_digits=10, decimal_places=2)


class PaymentSerializer(serializers.ModelSerializer):
    """Full serializer for a Payment instance."""

    user_email   = serializers.CharField(source='user.email',  read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model  = Payment
        fields = [
            'id', 'user', 'user_email', 'course', 'course_title',
            'amount', 'currency', 'phone_number', 'checkout_request_id',
            'mpesa_receipt_number', 'transaction_date', 'status',
            'payment_type', 'description', 'metadata', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'checkout_request_id', 'mpesa_receipt_number',
            'transaction_date', 'status', 'created_at', 'updated_at',
        ]


class PaymentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer used for listing payments."""

    user_name    = serializers.CharField(source='user.full_name', read_only=True)
    course_title = serializers.CharField(source='course.title',   read_only=True)

    class Meta:
        model  = Payment
        fields = [
            'id', 'user_name', 'course_title', 'amount', 'currency',
            'status', 'payment_type', 'mpesa_receipt_number', 'created_at',
        ]


class PaymentStatusSerializer(serializers.ModelSerializer):
    """
    Minimal serializer returned by the status-polling endpoint.
    The frontend only needs `status` and `checkout_request_id`.
    """

    class Meta:
        model  = Payment
        fields = [
            'id', 'checkout_request_id', 'status',
            'mpesa_receipt_number', 'updated_at',
        ]


class MpesaConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for M-Pesa configuration (admin use)."""

    class Meta:
        model  = MpesaConfiguration
        fields = [
            'id', 'name', 'environment', 'consumer_key', 'consumer_secret',
            'shortcode', 'passkey', 'callback_url', 'validation_url',
            'confirmation_url', 'b2c_shortcode', 'b2c_initiator_name',
            'b2c_initiator_password', 'is_active', 'created_at', 'updated_at',
        ]
        extra_kwargs = {
            'consumer_secret':        {'write_only': True},
            'passkey':                {'write_only': True},
            'b2c_initiator_password': {'write_only': True},
        }

    def validate(self, data):
        if data.get('environment') == 'production':
            if not data.get('consumer_key') or not data.get('consumer_secret'):
                raise serializers.ValidationError(
                    "Consumer key and secret are required for production."
                )
        return data


class B2CPaymentSerializer(serializers.Serializer):
    """Serializer for B2C payment (refund) requests."""

    phone_number = serializers.CharField(max_length=20)
    amount       = serializers.DecimalField(max_digits=10, decimal_places=2)
    occasion     = serializers.CharField(max_length=100, required=False, default='Refund')
    payment_id   = serializers.IntegerField(required=False)