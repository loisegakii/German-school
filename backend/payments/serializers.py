from rest_framework import serializers
from .models import Payment, PaymentCallback, MpesaConfiguration


class PaymentInitiateSerializer(serializers.Serializer):
    """Serializer for initiating a payment"""
    
    course_id = serializers.IntegerField()
    phone_number = serializers.CharField(max_length=20)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    def validate_phone_number(self, value):
        """Format phone number"""
        # Remove any whitespace
        value = value.strip().replace(' ', '')
        
        # Validate basic format
        if not value:
            raise serializers.ValidationError("Phone number is required")
        
        return value


class PaymentCallbackSerializer(serializers.Serializer):
    """Serializer for payment callback data"""
    
    checkout_request_id = serializers.CharField()
    merchant_request_id = serializers.CharField()
    result_code = serializers.IntegerField()
    result_desc = serializers.CharField()
    mpesa_receipt_number = serializers.CharField(required=False, allow_null=True)
    phone_number = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'user_email', 'course', 'course_title',
            'amount', 'currency', 'phone_number', 'checkout_request_id',
            'mpesa_receipt_number', 'transaction_date', 'status',
            'payment_type', 'description', 'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'checkout_request_id', 'mpesa_receipt_number',
            'transaction_date', 'status', 'created_at', 'updated_at'
        ]


class PaymentListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing payments"""
    
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'user_name', 'course_title', 'amount', 'currency',
            'status', 'payment_type', 'mpesa_receipt_number', 'created_at'
        ]


class MpesaConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for M-Pesa configuration"""
    
    class Meta:
        model = MpesaConfiguration
        fields = [
            'id', 'name', 'environment', 'consumer_key', 'consumer_secret',
            'shortcode', 'passkey', 'callback_url', 'validation_url',
            'confirmation_url', 'b2c_shortcode', 'b2c_initiator_name',
            'b2c_initiator_password', 'is_active', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'consumer_secret': {'write_only': True},
            'passkey': {'write_only': True},
            'b2c_initiator_password': {'write_only': True},
        }
    
    def validate(self, data):
        """Validate configuration data"""
        if data.get('environment') == 'production':
            if not data.get('consumer_key') or not data.get('consumer_secret'):
                raise serializers.ValidationError(
                    "Consumer key and secret are required for production"
                )
        return data


class B2CPaymentSerializer(serializers.Serializer):
    """Serializer for B2C payment requests"""
    
    phone_number = serializers.CharField(max_length=20)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    occasion = serializers.CharField(max_length=100, required=False, default="Refund")
    payment_id = serializers.IntegerField(required=False)
