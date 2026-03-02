"""
M-Pesa Daraja API Adapter

This module provides integration with Safaricom's M-Pesa Daraja API.
Based on the e-commerce implementation with MOCK support for testing.
"""

import base64
import json
from datetime import datetime
from urllib import error, request

from django.conf import settings


class PaymentGatewayError(Exception):
    """Custom exception for M-Pesa payment errors"""
    pass


def _post_json(url, payload, headers=None, timeout=20):
    """Helper function to make POST JSON requests"""
    data = json.dumps(payload).encode('utf-8')
    req = request.Request(url, data=data, method='POST')
    req.add_header('Content-Type', 'application/json')
    for key, value in (headers or {}).items():
        req.add_header(key, value)

    try:
        with request.urlopen(req, timeout=timeout) as response:
            return json.loads(response.read().decode('utf-8'))
    except error.HTTPError as exc:
        message = exc.read().decode('utf-8')
        raise PaymentGatewayError(f'Gateway error: {message}') from exc
    except error.URLError as exc:
        raise PaymentGatewayError(f'Network error: {exc.reason}') from exc


def _mpesa_base_url():
    """Get the M-Pesa base URL based on environment"""
    environment = getattr(settings, 'MPESA_ENVIRONMENT', 'sandbox').lower()
    if environment == 'production':
        return 'https://api.safaricom.co.ke'
    return 'https://sandbox.safaricom.co.ke'


def _get_mpesa_access_token():
    """Get OAuth access token from M-Pesa"""
    consumer_key = getattr(settings, 'MPESA_CONSUMER_KEY', '')
    consumer_secret = getattr(settings, 'MPESA_CONSUMER_SECRET', '')
    if not consumer_key or not consumer_secret:
        raise PaymentGatewayError('M-Pesa consumer credentials are not configured')

    credentials = f'{consumer_key}:{consumer_secret}'.encode('utf-8')
    encoded = base64.b64encode(credentials).decode('utf-8')
    endpoint = f'{_mpesa_base_url()}/oauth/v1/generate?grant_type=client_credentials'
    req = request.Request(endpoint, method='GET')
    req.add_header('Authorization', f'Basic {encoded}')

    try:
        with request.urlopen(req, timeout=20) as response:
            payload = json.loads(response.read().decode('utf-8'))
            return payload['access_token']
    except Exception as exc:
        raise PaymentGatewayError('Unable to obtain M-Pesa access token') from exc


def initiate_mpesa_stk_push(phone_number, amount, account_reference):
    """
    Initiate STK Push payment
    
    Args:
        phone_number: Customer phone number (format: 254XXXXXXXXX)
        amount: Amount to charge
        account_reference: Reference for the transaction
        
    Returns:
        Dict with checkout_request_id, merchant_request_id, response_code, response_description
    """
    shortcode = getattr(settings, 'MPESA_SHORTCODE', '')
    passkey = getattr(settings, 'MPESA_PASSKEY', '')
    callback_url = getattr(settings, 'MPESA_CALLBACK_URL', '')
    print('CALLBACK USED ->',callback_url)
    # Check if M-Pesa is properly configured
    if not shortcode or not passkey or not callback_url:
        # Use MOCK mode if enabled
        if getattr(settings, 'PAYMENTS_ALLOW_MOCK', False):
            return {
                'CheckoutRequestID': f'mpesa_mock_checkout_{account_reference}',
                'MerchantRequestID': f'mpesa_mock_merchant_{account_reference}',
                'ResponseCode': '0',
                'ResponseDescription': 'Success. Mock STK push initiated.',
            }
        raise PaymentGatewayError('M-Pesa STK push is not fully configured')

    # Generate password
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = base64.b64encode(f'{shortcode}{passkey}{timestamp}'.encode('utf-8')).decode('utf-8')
    
    # Get access token
    try:
        token = _get_mpesa_access_token()
    except PaymentGatewayError as e:
        # Fall back to MOCK if token generation fails
        if getattr(settings, 'PAYMENTS_ALLOW_MOCK', False):
            return {
                'CheckoutRequestID': f'mpesa_mock_checkout_{account_reference}',
                'MerchantRequestID': f'mpesa_mock_merchant_{account_reference}',
                'ResponseCode': '0',
                'ResponseDescription': 'Success. Mock STK push initiated.',
            }
        raise e

    # Build payload
    payload = {
        'BusinessShortCode': shortcode,
        'Password': password,
        'Timestamp': timestamp,
        'TransactionType': 'CustomerPayBillOnline',
        'Amount': int(amount),
        'PartyA': phone_number,
        'PartyB': shortcode,
        'PhoneNumber': phone_number,
        'CallBackURL': callback_url,
        'AccountReference': str(account_reference),
        'TransactionDesc': f'Payment for {account_reference}',
    }
    
    endpoint = f'{_mpesa_base_url()}/mpesa/stkpush/v1/processrequest'
    
    try:
        response = _post_json(endpoint, payload, headers={'Authorization': f'Bearer {token}'})
        return {
            'CheckoutRequestID': response.get('CheckoutRequestID', ''),
            'MerchantRequestID': response.get('MerchantRequestID', ''),
            'ResponseCode': response.get('ResponseCode', ''),
            'ResponseDescription': response.get('ResponseDescription', ''),
        }
    except PaymentGatewayError as e:
        # Fall back to MOCK on error
        if getattr(settings, 'PAYMENTS_ALLOW_MOCK', False):
            return {
                'CheckoutRequestID': f'mpesa_mock_checkout_{account_reference}',
                'MerchantRequestID': f'mpesa_mock_merchant_{account_reference}',
                'ResponseCode': '0',
                'ResponseDescription': 'Success. Mock STK push initiated.',
            }
        raise e


def query_stk_status(checkout_request_id):
    """Query the status of an STK Push transaction"""
    shortcode = getattr(settings, 'MPESA_SHORTCODE', '')
    passkey = getattr(settings, 'MPESA_PASSKEY', '')
    
    if not shortcode or not passkey:
        raise PaymentGatewayError('M-Pesa is not configured')

    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = base64.b64encode(f'{shortcode}{passkey}{timestamp}'.encode('utf-8')).decode('utf-8')
    
    try:
        token = _get_mpesa_access_token()
    except PaymentGatewayError:
        if getattr(settings, 'PAYMENTS_ALLOW_MOCK', False):
            return {'ResultCode': 0, 'ResultDesc': 'Success'}
        raise

    payload = {
        'BusinessShortCode': shortcode,
        'Password': password,
        'Timestamp': timestamp,
        'CheckoutRequestID': checkout_request_id
    }
    
    endpoint = f'{_mpesa_base_url()}/mpesa/stkpushquery/v1/query'
    
    try:
        response = _post_json(endpoint, payload, headers={'Authorization': f'Bearer {token}'})
        return response
    except PaymentGatewayError as e:
        if getattr(settings, 'PAYMENTS_ALLOW_MOCK', False):
            return {'ResultCode': 0, 'ResultDesc': 'Success'}
        raise e


def format_phone_number(phone):
    """Format phone number to M-Pesa format (254XXXXXXXXX)"""
    # Remove any whitespace and special characters
    phone = ''.join(filter(str.isdigit, phone))
    
    # Check if it starts with country code
    if phone.startswith('254'):
        return phone
    # Check if it starts with 0
    elif phone.startswith('0'):
        return '254' + phone[1:]
    # Assume it's already without country code
    elif len(phone) == 9:
        return '254' + phone
    else:
        return phone


# Backwards compatibility - keep the old class for existing code
class MpesaDaraja:
    """Legacy class for backwards compatibility"""
    
    def __init__(self, **kwargs):
        pass
    
    @staticmethod
    def format_phone_number(phone):
        return format_phone_number(phone)
    
    def initiate_stk_push(self, phone_number, amount, account_reference, transaction_desc=None, callback_url=None):
        return initiate_mpesa_stk_push(phone_number, amount, account_reference)
    
    def query_stk_status(self, checkout_request_id):
        return query_stk_status(checkout_request_id)
    
    def validate_callback(self, raw_data):
        # Parse callback data
        stk_callback = raw_data.get('Body', {}).get('stkCallback', {})
        return {
            'result_code': stk_callback.get('ResultCode'),
            'result_desc': stk_callback.get('ResultDesc'),
            'checkout_request_id': stk_callback.get('CheckoutRequestID'),
            'merchant_request_id': stk_callback.get('MerchantRequestID'),
            'mpesa_receipt_number': None,
            'phone_number': None,
            'amount': None,
            'transaction_date': None
        }


class MpesaException(PaymentGatewayError):
    """Legacy exception class for backwards compatibility"""
    pass


def get_mpesa_adapter():
    """Get MpesaDaraja instance (legacy compatibility)"""
    return MpesaDaraja()
