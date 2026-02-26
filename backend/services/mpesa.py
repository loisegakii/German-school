import base64
import requests
from datetime import datetime
from django.conf import settings

SANDBOX_URL = "https://sandbox.safaricom.co.ke"
LIVE_URL    = "https://api.safaricom.co.ke"

def _base_url():
    return SANDBOX_URL if settings.MPESA_ENV == "sandbox" else LIVE_URL

def get_access_token():
    url = f"{_base_url()}/oauth/v1/generate?grant_type=client_credentials"
    r = requests.get(url, auth=(settings.MPESA_CONSUMER_KEY, settings.MPESA_CONSUMER_SECRET))
    r.raise_for_status()
    return r.json()["access_token"]

def generate_password(shortcode, passkey, timestamp):
    raw = f"{shortcode}{passkey}{timestamp}"
    return base64.b64encode(raw.encode()).decode()

def stk_push(phone: str, amount: int, account_ref: str, description: str):
    """
    phone: Kenyan number in format 2547XXXXXXXX
    amount: integer KES amount
    """
    token     = get_access_token()
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password  = generate_password(settings.MPESA_SHORTCODE, settings.MPESA_PASSKEY, timestamp)

    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password":          password,
        "Timestamp":         timestamp,
        "TransactionType":   "CustomerPayBillOnline",  # or "CustomerBuyGoodsOnline" for till
        "Amount":            amount,
        "PartyA":            phone,
        "PartyB":            settings.MPESA_SHORTCODE,
        "PhoneNumber":       phone,
        "CallBackURL":       settings.MPESA_CALLBACK_URL,
        "AccountReference":  account_ref,  # e.g. "GSO-B1-MODULE"
        "TransactionDesc":   description,
    }

    url = f"{_base_url()}/mpesa/stkpush/v1/processrequest"
    r   = requests.post(url, json=payload, headers={"Authorization": f"Bearer {token}"})
    r.raise_for_status()
    return r.json()  # contains CheckoutRequestID