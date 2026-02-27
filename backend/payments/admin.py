<<<<<<< HEAD
from django.contrib import admin

# Register your models here.
=======
from django.contrib import admin
from .models import Payment, PaymentCallback, MpesaConfiguration


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'course', 'amount', 'currency',
        'phone_number', 'status', 'payment_type', 'created_at'
    ]
    list_filter = ['status', 'payment_type', 'currency', 'created_at']
    search_fields = ['user__email', 'course__title', 'mpesa_receipt_number']
    readonly_fields = [
        'checkout_request_id', 'mpesa_receipt_number',
        'transaction_date', 'created_at', 'updated_at'
    ]
    ordering = ['-created_at']


@admin.register(PaymentCallback)
class PaymentCallbackAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'payment', 'result_code', 'mpesa_receipt_number',
        'phone_number', 'amount', 'created_at'
    ]
    list_filter = ['result_code', 'created_at']
    search_fields = ['mpesa_receipt_number', 'phone_number', 'checkout_request_id']
    readonly_fields = ['payment', 'merchant_request_id', 'checkout_request_id',
                      'result_code', 'result_desc', 'mpesa_receipt_number',
                      'phone_number', 'amount', 'raw_data', 'created_at']


@admin.register(MpesaConfiguration)
class MpesaConfigurationAdmin(admin.ModelAdmin):
    list_display = ['name', 'environment', 'shortcode', 'is_active', 'created_at']
    list_filter = ['environment', 'is_active']
    search_fields = ['name', 'shortcode']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'environment', 'is_active')
        }),
        ('API Credentials', {
            'fields': ('consumer_key', 'consumer_secret', 'shortcode', 'passkey'),
            'classes': ('collapse',),
        }),
        ('Callback URLs', {
            'fields': ('callback_url', 'validation_url', 'confirmation_url'),
            'classes': ('collapse',),
        }),
        ('B2C Settings', {
            'fields': ('b2c_shortcode', 'b2c_initiator_name', 'b2c_initiator_password'),
            'classes': ('collapse',),
        }),
    )
>>>>>>> 77cb46cef5c804655b1de1f6594bb68686953203
