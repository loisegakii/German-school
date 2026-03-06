"""
M-Pesa Daraja API Adapter

This module provides integration with Safaricom's M-Pesa Daraja API.
Based on the e-commerce implementation with MOCK support for testing.
"""

import base64
import json
import logging
from datetime import datetime
from urllib import error, request

from django.conf import settings

logger = logging.getLogger(__name__)


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
        logger.error(f'[MPesa] HTTP {exc.code} error from {url}: {message}')
        print(f'[MPesa] HTTP {exc.code} error from {url}: {message}')
        raise PaymentGatewayError(f'Gateway error {exc.code}: {message}') from exc
    except error.URLError as exc:
        logger.error(f'[MPesa] Network error reaching {url}: {exc.reason}')
        print(f'[MPesa] Network error reaching {url}: {exc.reason}')
        raise PaymentGatewayError(f'Network error: {exc.reason}') from exc


def _mpesa_base_url():
    """Get the M-Pesa base URL based on environment"""
    environment = getattr(settings, 'MPESA_ENVIRONMENT', 'sandbox').lower()
    if environment == 'production':
        return 'https://api.safaricom.co.ke'
    return 'https://sandbox.safaricom.co.ke'


def _get_mpesa_access_token():
    """Get OAuth access token from M-Pesa"""
    consumer_key    = getattr(settings, 'MPESA_CONSUMER_KEY', '').strip()
    consumer_secret = getattr(settings, 'MPESA_CONSUMER_SECRET', '').strip()

    if not consumer_key or not consumer_secret:
        raise PaymentGatewayError('M-Pesa consumer credentials are not configured')

    logger.info(f'[MPesa] Getting access token. Key starts with: {consumer_key[:6]}...')
    print(f'[MPesa] Getting access token. Key starts with: {consumer_key[:6]}...')

    credentials = f'{consumer_key}:{consumer_secret}'.encode('utf-8')
    encoded     = base64.b64encode(credentials).decode('utf-8')
    endpoint    = f'{_mpesa_base_url()}/oauth/v1/generate?grant_type=client_credentials'

    req = request.Request(endpoint, method='GET')
    req.add_header('Authorization', f'Basic {encoded}')

    try:
        with request.urlopen(req, timeout=20) as response:
            payload = json.loads(response.read().decode('utf-8'))
            token   = payload.get('access_token', '')
            if not token:
                raise PaymentGatewayError(f'No access_token in response: {payload}')
            logger.info('[MPesa] Access token obtained successfully.')
            print('[MPesa] Access token obtained successfully.')
            return token
    except error.HTTPError as exc:
        message = exc.read().decode('utf-8')
        logger.error(f'[MPesa] Token HTTP {exc.code}: {message}')
        print(f'[MPesa] Token HTTP {exc.code}: {message}')
        raise PaymentGatewayError(f'Token error {exc.code}: {message}') from exc
    except Exception as exc:
        logger.error(f'[MPesa] Token error: {exc}')
        print(f'[MPesa] Token error: {exc}')
        raise PaymentGatewayError(f'Unable to obtain M-Pesa access token: {exc}') from exc


def initiate_mpesa_stk_push(phone_number, amount, account_reference, callback_url=None):
    """
    Initiate STK Push payment

    Args:
        phone_number:      Customer phone number (format: 254XXXXXXXXX)
        amount:            Amount to charge
        account_reference: Reference for the transaction
        callback_url:      URL for Safaricom to send payment confirmation

    Returns:
        Dict with CheckoutRequestID, MerchantRequestID, ResponseCode, ResponseDescription
    """
    shortcode    = getattr(settings, 'MPESA_SHORTCODE', '').strip()
    passkey      = getattr(settings, 'MPESA_PASSKEY', '').strip()
    callback_url = (callback_url or getattr(settings, 'MPESA_CALLBACK_URL', '')).strip()

    logger.info(f'[MPesa] STK Push — phone={phone_number} amount={amount} ref={account_reference}')
    logger.info(f'[MPesa] Config — shortcode={shortcode} env={getattr(settings, "MPESA_ENVIRONMENT", "sandbox")}')
    logger.info(f'[MPesa] Callback URL — {callback_url}')
    print(f'CALLBACK USED -> {callback_url}')
    print(f'[MPesa] shortcode={shortcode!r} passkey_set={bool(passkey)} callback={callback_url!r}')

    # ── Check configuration ───────────────────────────────────────────────────
    if not shortcode or not passkey or not callback_url:
        missing = [k for k, v in {'shortcode': shortcode, 'passkey': passkey, 'callback_url': callback_url}.items() if not v]
        logger.error(f'[MPesa] Missing config: {missing}')
        print(f'[MPesa] Missing config: {missing}')

        if getattr(settings, 'PAYMENTS_ALLOW_MOCK', False):
            return {
                'CheckoutRequestID':  f'mpesa_mock_checkout_{account_reference}',
                'MerchantRequestID':  f'mpesa_mock_merchant_{account_reference}',
                'ResponseCode':       '0',
                'ResponseDescription': 'Success. Mock STK push initiated.',
            }
        raise PaymentGatewayError(f'M-Pesa STK push is not fully configured. Missing: {missing}')

    # ── Generate password ─────────────────────────────────────────────────────
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password  = base64.b64encode(
        f'{shortcode}{passkey}{timestamp}'.encode('utf-8')
    ).decode('utf-8')

    # ── Get access token ──────────────────────────────────────────────────────
    try:
        token = _get_mpesa_access_token()
    except PaymentGatewayError as e:
        logger.error(f'[MPesa] Token fetch failed: {e}')
        print(f'[MPesa] Token fetch failed: {e}')
        if getattr(settings, 'PAYMENTS_ALLOW_MOCK', False):
            return {
                'CheckoutRequestID':  f'mpesa_mock_checkout_{account_reference}',
                'MerchantRequestID':  f'mpesa_mock_merchant_{account_reference}',
                'ResponseCode':       '0',
                'ResponseDescription': 'Success. Mock STK push initiated.',
            }
        raise

    # ── Build STK Push payload ────────────────────────────────────────────────
    payload = {
        'BusinessShortCode': shortcode,
        'Password':          password,
        'Timestamp':         timestamp,
        'TransactionType':   'CustomerPayBillOnline',
        'Amount':            int(amount),
        'PartyA':            phone_number,
        'PartyB':            shortcode,
        'PhoneNumber':       phone_number,
        'CallBackURL':       callback_url,
        'AccountReference':  str(account_reference),
        'TransactionDesc':   f'Payment for {account_reference}',
    }

    endpoint = f'{_mpesa_base_url()}/mpesa/stkpush/v1/processrequest'
    logger.info(f'[MPesa] Sending STK Push to {endpoint}')
    print(f'[MPesa] Sending STK Push to {endpoint}')

    try:
        response = _post_json(endpoint, payload, headers={'Authorization': f'Bearer {token}'})
        logger.info(f'[MPesa] STK Push response: {response}')
        print(f'[MPesa] STK Push response: {response}')
        return {
            'CheckoutRequestID':  response.get('CheckoutRequestID', ''),
            'MerchantRequestID':  response.get('MerchantRequestID', ''),
            'ResponseCode':       response.get('ResponseCode', ''),
            'ResponseDescription': response.get('ResponseDescription', ''),
        }
    except PaymentGatewayError as e:
        logger.error(f'[MPesa] STK Push failed: {e}')
        print(f'[MPesa] STK Push failed: {e}')
        if getattr(settings, 'PAYMENTS_ALLOW_MOCK', False):
            return {
                'CheckoutRequestID':  f'mpesa_mock_checkout_{account_reference}',
                'MerchantRequestID':  f'mpesa_mock_merchant_{account_reference}',
                'ResponseCode':       '0',
                'ResponseDescription': 'Success. Mock STK push initiated.',
            }
        raise


def query_stk_status(checkout_request_id):
    """Query the status of an STK Push transaction"""
    shortcode = getattr(settings, 'MPESA_SHORTCODE', '').strip()
    passkey   = getattr(settings, 'MPESA_PASSKEY', '').strip()

    if not shortcode or not passkey:
        raise PaymentGatewayError('M-Pesa is not configured')

    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password  = base64.b64encode(
        f'{shortcode}{passkey}{timestamp}'.encode('utf-8')
    ).decode('utf-8')

    try:
        token = _get_mpesa_access_token()
    except PaymentGatewayError:
        if getattr(settings, 'PAYMENTS_ALLOW_MOCK', False):
            return {'ResultCode': 0, 'ResultDesc': 'Success'}
        raise

    payload = {
        'BusinessShortCode': shortcode,
        'Password':          password,
        'Timestamp':         timestamp,
        'CheckoutRequestID': checkout_request_id,
    }

    endpoint = f'{_mpesa_base_url()}/mpesa/stkpushquery/v1/query'

    try:
        response = _post_json(endpoint, payload, headers={'Authorization': f'Bearer {token}'})
        logger.info(f'[MPesa] Status query response: {response}')
        return response
    except PaymentGatewayError as e:
        logger.error(f'[MPesa] Status query failed: {e}')
        if getattr(settings, 'PAYMENTS_ALLOW_MOCK', False):
            return {'ResultCode': 0, 'ResultDesc': 'Success'}
        raise


def format_phone_number(phone):
    """Format phone number to M-Pesa format (254XXXXXXXXX)"""
    phone = ''.join(filter(str.isdigit, phone))

    if phone.startswith('254'):
        return phone
    elif phone.startswith('0'):
        return '254' + phone[1:]
    elif len(phone) == 9:
        return '254' + phone
    else:
        return phone


# ── Backwards-compatible class ────────────────────────────────────────────────

class MpesaDaraja:
    """Legacy class for backwards compatibility"""

    def __init__(self, **kwargs):
        pass

    @staticmethod
    def format_phone_number(phone):
        return format_phone_number(phone)

    def initiate_stk_push(self, phone_number, amount, account_reference,
                          transaction_desc=None, callback_url=None):
        # Now correctly passes callback_url through
        return initiate_mpesa_stk_push(
            phone_number=phone_number,
            amount=amount,
            account_reference=account_reference,
            callback_url=callback_url,
        )

    def query_stk_status(self, checkout_request_id):
        return query_stk_status(checkout_request_id)

    def validate_callback(self, raw_data):
        stk_callback      = raw_data.get('Body', {}).get('stkCallback', {})
        items             = {}
        callback_metadata = stk_callback.get('CallbackMetadata', {})

        for item in callback_metadata.get('Item', []):
            items[item.get('Name')] = item.get('Value')

        return {
            'result_code':          stk_callback.get('ResultCode'),
            'result_desc':          stk_callback.get('ResultDesc'),
            'checkout_request_id':  stk_callback.get('CheckoutRequestID'),
            'merchant_request_id':  stk_callback.get('MerchantRequestID'),
            'mpesa_receipt_number': items.get('MpesaReceiptNumber'),
            'phone_number':         str(items.get('PhoneNumber', '')),
            'amount':               items.get('Amount'),
            'transaction_date':     items.get('TransactionDate'),
        }


class MpesaException(PaymentGatewayError):
    """Legacy exception class for backwards compatibility"""
    pass


def get_mpesa_adapter():
    """Get MpesaDaraja instance (legacy compatibility)"""
    return MpesaDaraja()