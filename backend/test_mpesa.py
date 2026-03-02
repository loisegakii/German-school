"""
Standalone M-Pesa Daraja API Test Script

Tests the M-Pesa integration WITHOUT Django - directly tests the adapter functions.
Uses python-decouple like the e-commerce project.
"""

import os
import sys
import base64
import json
from datetime import datetime

# Add the project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables using python-decouple
from decouple import config

# Get settings using python-decouple
MPESA_ENVIRONMENT = config('MPESA_ENVIRONMENT', default='sandbox')
MPESA_CONSUMER_KEY = config('MPESA_CONSUMER_KEY', default='')
MPESA_CONSUMER_SECRET = config('MPESA_CONSUMER_SECRET', default='')
MPESA_SHORTCODE = config('MPESA_SHORTCODE', default='174379')  # Default sandbox shortcode
MPESA_PASSKEY = config('MPESA_PASSKEY', default='bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72e1f46c90344')  # Default sandbox passkey
MPESA_CALLBACK_URL = config('MPESA_CALLBACK_URL', default='https://localhost:8000/api/payments/callback/')
PAYMENTS_ALLOW_MOCK = config('PAYMENTS_ALLOW_MOCK', default='1') == '1'

# Mock settings object for the adapter to use
class MockSettings:
    MPESA_ENVIRONMENT = MPESA_ENVIRONMENT
    MPESA_CONSUMER_KEY = MPESA_CONSUMER_KEY
    MPESA_CONSUMER_SECRET = MPESA_CONSUMER_SECRET
    MPESA_SHORTCODE = MPESA_SHORTCODE if MPESA_SHORTCODE != '174379' else ''
    MPESA_PASSKEY = MPESA_PASSKEY if MPESA_PASSKEY != 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72e1f46c90344' else ''
    MPESA_CALLBACK_URL = MPESA_CALLBACK_URL if MPESA_CALLBACK_URL != 'https://localhost:8000/api/payments/callback/' else ''
    PAYMENTS_ALLOW_MOCK = PAYMENTS_ALLOW_MOCK

# Import the adapter functions (without Django)
import base64
import json
from datetime import datetime
from urllib import error, request


class PaymentGatewayError(Exception):
    pass


def _mpesa_base_url():
    environment = MockSettings.MPESA_ENVIRONMENT.lower()
    if environment == 'production':
        return 'https://api.safaricom.co.ke'
    return 'https://sandbox.safaricom.co.ke'


def _get_mpesa_access_token():
    consumer_key = MockSettings.MPESA_CONSUMER_KEY
    consumer_secret = MockSettings.MPESA_CONSUMER_SECRET
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
    shortcode = MockSettings.MPESA_SHORTCODE
    passkey = MockSettings.MPESA_PASSKEY
    callback_url = MockSettings.MPESA_CALLBACK_URL

    # Check if M-Pesa is properly configured
    if not shortcode or not passkey or not callback_url:
        if MockSettings.PAYMENTS_ALLOW_MOCK:
            return {
                'CheckoutRequestID': f'mpesa_mock_checkout_{account_reference}',
                'MerchantRequestID': f'mpesa_mock_merchant_{account_reference}',
                'ResponseCode': '0',
                'ResponseDescription': 'Success. Mock STK push initiated.',
            }
        raise PaymentGatewayError('M-Pesa STK push is not fully configured')

    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = base64.b64encode(f'{shortcode}{passkey}{timestamp}'.encode('utf-8')).decode('utf-8')
    
    try:
        token = _get_mpesa_access_token()
    except PaymentGatewayError as e:
        if MockSettings.PAYMENTS_ALLOW_MOCK:
            return {
                'CheckoutRequestID': f'mpesa_mock_checkout_{account_reference}',
                'MerchantRequestID': f'mpesa_mock_merchant_{account_reference}',
                'ResponseCode': '0',
                'ResponseDescription': 'Success. Mock STK push initiated.',
            }
        raise e

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
    
    data = json.dumps(payload).encode('utf-8')
    req = request.Request(endpoint, data=data, method='POST')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Authorization', f'Bearer {token}')
    
    try:
        with request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
            return {
                'CheckoutRequestID': result.get('CheckoutRequestID', ''),
                'MerchantRequestID': result.get('MerchantRequestID', ''),
                'ResponseCode': result.get('ResponseCode', ''),
                'ResponseDescription': result.get('ResponseDescription', ''),
            }
    except Exception as e:
        if MockSettings.PAYMENTS_ALLOW_MOCK:
            return {
                'CheckoutRequestID': f'mpesa_mock_checkout_{account_reference}',
                'MerchantRequestID': f'mpesa_mock_merchant_{account_reference}',
                'ResponseCode': '0',
                'ResponseDescription': 'Success. Mock STK push initiated.',
            }
        raise PaymentGatewayError(f'STK Push failed: {e}')


def format_phone_number(phone):
    """Format phone number to M-Pesa format (254XXXXXXXXX)"""
    phone = ''.join(filter(str.isdigit, phone))
    if phone.startswith('254'):
        return phone
    elif phone.startswith('0'):
        return '254' + phone[1:]
    elif len(phone) == 9:
        return '254' + phone
    return phone


# Run tests
if __name__ == '__main__':
    print("=" * 60)
    print("M-PESA CONFIGURATION (from .env)")
    print("=" * 60)
    print(f"Environment: {MPESA_ENVIRONMENT}")
    print(f"Consumer Key: {MPESA_CONSUMER_KEY[:20]}..." if MPESA_CONSUMER_KEY else "Consumer Key: NOT SET")
    print(f"Consumer Secret: {'SET' if MPESA_CONSUMER_SECRET else 'NOT SET'}")
    print(f"Shortcode: {MPESA_SHORTCODE or 'NOT SET'}")
    print(f"Passkey: {'SET' if MPESA_PASSKEY else 'NOT SET'}")
    print(f"Callback URL: {MPESA_CALLBACK_URL or 'NOT SET'}")
    print(f"Allow Mock: {PAYMENTS_ALLOW_MOCK}")
    print("=" * 60)
    
    # Test phone number formatting
    print("\n📱 Phone Number Formatting Test:")
    test_phones = ['254799626531', '0799626531', '+254799626531', '0799626531']
    for phone in test_phones:
        formatted = format_phone_number(phone)
        print(f"  {phone} -> {formatted}")
    
    # Test STK Push
    print("\n💳 Testing STK Push:")
    try:
        result = initiate_mpesa_stk_push(
            phone_number='254799626531',
            amount=10,
            account_reference='TEST-001'
        )
        
        print(f"\n✅ STK Push Result:")
        print(f"  Checkout Request ID: {result.get('CheckoutRequestID', 'N/A')}")
        print(f"  Merchant Request ID: {result.get('MerchantRequestID', 'N/A')}")
        print(f"  Response Code: {result.get('ResponseCode', 'N/A')}")
        print(f"  Response Description: {result.get('ResponseDescription', 'N/A')}")
        
        if 'mock' in result.get('CheckoutRequestID', ''):
            print("\n⚠️  Note: This was a MOCK response (not a real M-Pesa transaction)")
            print("   To test with real M-Pesa, configure your .env with valid credentials")
            
    except PaymentGatewayError as e:
        print(f"\n❌ Payment Error: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")
