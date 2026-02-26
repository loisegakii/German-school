"""
M-Pesa Daraja API Adapter

This module provides integration with Safaricom's M-Pesa Daraja API.
Supports STK Push, B2C payments, and callback handling.

API Documentation: https://developer.safaricom.co.ke/docs
"""

import base64
import hashlib
import json
import logging
import time
from datetime import datetime
from typing import Optional, Dict, Any

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class MpesaDaraja:
    """
    M-Pesa Daraja API Integration Class
    
    Provides methods for:
    - OAuth token generation
    - STK Push (Lipa Na M-Pesa Online)
    - B2C (Business to Customer) payments
    - Payment status query
    - Callback URL generation
    """
    
    # API Endpoints
    SANDBOX_BASE_URL = "https://sandbox.safaricom.co.ke"
    PRODUCTION_BASE_URL = "https://api.safaricom.co.ke"
    
    # Token endpoints
    OAUTH_ENDPOINT = "/oauth/v1/generate?grant_type=client_credentials"
    
    # STK Push endpoints
    STK_PUSH_ENDPOINT = "/mpesa/stkpush/v1/processrequest"
    STK_PUSH_QUERY_ENDPOINT = "/mpesa/stkpushquery/v1/query"
    
    # B2C endpoints
    B2C_ENDPOINT = "/mpesa/b2c/v1/paymentrequest"
    
    def __init__(
        self,
        consumer_key: str = None,
        consumer_secret: str = None,
        shortcode: str = None,
        passkey: str = None,
        callback_url: str = None,
        environment: str = 'sandbox'
    ):
        """
        Initialize M-Pesa Daraja adapter
        
        Args:
            consumer_key: M-Pesa API consumer key
            consumer_secret: M-Pesa API consumer secret
            shortcode: M-Pesa shortcode (business paybill/till number)
            passkey: M-Pesa passkey for STK Push
            callback_url: URL for payment callbacks
            environment: 'sandbox' or 'production'
        """
        # Try to get from settings first, fall back to parameters
        self.consumer_key = consumer_key or getattr(settings, 'MPESA_CONSUMER_KEY', '')
        self.consumer_secret = consumer_secret or getattr(settings, 'MPESA_CONSUMER_SECRET', '')
        self.shortcode = shortcode or getattr(settings, 'MPESA_SHORTCODE', '')
        self.passkey = passkey or getattr(settings, 'MPESA_PASSKEY', '')
        self.callback_url = callback_url or getattr(settings, 'MPESA_CALLBACK_URL', '')
        self.environment = environment
        
        self.base_url = (
            self.PRODUCTION_BASE_URL if environment == 'production' 
            else self.SANDBOX_BASE_URL
        )
        
        self._access_token = None
        self._token_expiry = 0
    
    @property
    def access_token(self) -> str:
        """Get current access token, refreshing if necessary"""
        current_time = time.time()
        
        if self._access_token and current_time < self._token_expiry:
            return self._access_token
        
        self._generate_token()
        return self._access_token
    
    def _generate_token(self) -> Dict[str, Any]:
        """
        Generate OAuth access token from M-Pesa API
        
        Returns:
            Dict containing access_token and expires_in
            
        Raises:
            MpesaException: If token generation fails
        """
        url = f"{self.base_url}{self.OAUTH_ENDPOINT}"
        
        # Create authorization header
        credentials = f"{self.consumer_key}:{self.consumer_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            'Authorization': f'Basic {encoded_credentials}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            self._access_token = data.get('access_token')
            # Set expiry with 60 seconds buffer
            expires_in = data.get('expires_in', 3600)
            self._token_expiry = time.time() + expires_in - 60
            
            logger.info("M-Pesa OAuth token generated successfully")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to generate M-Pesa token: {str(e)}")
            raise MpesaException(f"Token generation failed: {str(e)}")
    
    def _get_auth_header(self) -> Dict[str, str]:
        """Get authorization header with current token"""
        return {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
    
    def _generate_password(self) -> str:
        """
        Generate password for STK Push
        
        The password is a base64 encoded string of:
        Shortcode + Passkey + Timestamp
        """
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_string = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_string.encode()).decode()
        return password, timestamp
    
    def initiate_stk_push(
        self,
        phone_number: str,
        amount: float,
        account_reference: str,
        transaction_desc: str = "Payment",
        callback_url: str = None
    ) -> Dict[str, Any]:
        """
        Initiate STK Push Payment (Lipa Na M-Pesa Online)
        
        Args:
            phone_number: Customer's phone number (format: 254XXXXXXXXX)
            amount: Amount to charge
            account_reference: Reference for the transaction (e.g., order ID)
            transaction_desc: Description of the transaction
            callback_url: Override default callback URL
            
        Returns:
            Dict containing checkout_request_id and response code
            
        Raises:
            MpesaException: If the request fails
        """
        url = f"{self.base_url}{self.STK_PUSH_ENDPOINT}"
        
        password, timestamp = self._generate_password()
        
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),  # M-Pesa requires integer
            "PartyA": phone_number,
            "PartyB": self.shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": callback_url or self.callback_url,
            "AccountReference": str(account_reference),
            "TransactionDesc": transaction_desc
        }
        
        headers = self._get_auth_header()
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            logger.info(f"STK Push initiated: CheckoutRequestID={data.get('CheckoutRequestID')}")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"STK Push failed: {str(e)}")
            
            # Try to get error details from response
            try:
                error_data = response.json()
                error_message = error_data.get('errorMessage', str(e))
            except:
                error_message = str(e)
            
            raise MpesaException(f"STK Push failed: {error_message}")
    
    def query_stk_status(self, checkout_request_id: str) -> Dict[str, Any]:
        """
        Query the status of an STK Push transaction
        
        Args:
            checkout_request_id: The checkout request ID from initiate_stk_push
            
        Returns:
            Dict containing the transaction status
        """
        url = f"{self.base_url}{self.STK_PUSH_QUERY_ENDPOINT}"
        
        password, timestamp = self._generate_password()
        
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id
        }
        
        headers = self._get_auth_header()
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"STK Query result: {data.get('ResultCode')}")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"STK Query failed: {str(e)}")
            raise MpesaException(f"STK Query failed: {str(e)}")
    
    def send_b2c_payment(
        self,
        phone_number: str,
        amount: float,
        command_id: str = "BusinessPayment",
        occasion: str = "Refund",
        callback_url: str = None
    ) -> Dict[str, Any]:
        """
        Send Business to Customer (B2C) payment
        
        Used for:
        - Refunds
        - Salary payments
        - Promotional payments
        
        Args:
            phone_number: Customer's phone number (format: 254XXXXXXXXX)
            amount: Amount to send
            command_id: Type of B2C transaction
            occasion: Optional description/occasion
            callback_url: Override default callback URL
            
        Returns:
            Dict containing the transaction response
        """
        url = f"{self.base_url}{self.B2C_ENDPOINT}"
        
        # Get B2C credentials from settings or use defaults
        initiator_name = getattr(settings, 'MPESA_B2C_INITIATOR_NAME', '')
        initiator_password = getattr(settings, 'MPESA_B2C_INITIATOR_PASSWORD', '')
        
        if not initiator_name or not initiator_password:
            logger.warning("B2C initiator credentials not configured")
        
        payload = {
            "InitiatorName": initiator_name,
            "SecurityCredential": initiator_password,
            "CommandID": command_id,
            "Amount": int(amount),
            "PartyA": self.shortcode,
            "PartyB": phone_number,
            "Remarks": occasion,
            "QueueTimeOutURL": callback_url or self.callback_url,
            "ResultURL": callback_url or self.callback_url,
            "Occasion": occasion
        }
        
        headers = self._get_auth_header()
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"B2C payment initiated: {data.get('ConversationID')}")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"B2C payment failed: {str(e)}")
            raise MpesaException(f"B2C payment failed: {str(e)}")
    
    def validate_callback(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate and parse M-Pesa callback data
        
        Args:
            raw_data: The raw callback data from M-Pesa
            
        Returns:
            Parsed callback data
        """
        try:
            # Extract the relevant data from callback
            stk_callback = raw_data.get('Body', {}).get('stkCallback', {})
            
            result_code = stk_callback.get('ResultCode')
            result_desc = stk_callback.get('ResultDesc')
            checkout_request_id = stk_callback.get('CheckoutRequestID')
            merchant_request_id = stk_callback.get('MerchantRequestID')
            
            # Extract callback metadata (contains payment details)
            callback_metadata = stk_callback.get('CallbackMetadata', {})
            items = callback_metadata.get('Item', [])
            
            # Parse metadata items
            parsed_data = {
                'result_code': result_code,
                'result_desc': result_desc,
                'checkout_request_id': checkout_request_id,
                'merchant_request_id': merchant_request_id,
                'mpesa_receipt_number': None,
                'phone_number': None,
                'amount': None,
                'transaction_date': None
            }
            
            for item in items:
                name = item.get('Name')
                value = item.get('Value')
                
                if name == 'MpesaReceiptNumber':
                    parsed_data['mpesa_receipt_number'] = value
                elif name == 'PhoneNumber':
                    parsed_data['phone_number'] = value
                elif name == 'Amount':
                    parsed_data['amount'] = value
                elif name == 'TransactionDate':
                    # Format: YYYYMMDDHHMMSS
                    date_str = str(value)
                    try:
                        parsed_data['transaction_date'] = datetime.strptime(
                            date_str, '%Y%m%d%H%M%S'
                        )
                    except:
                        parsed_data['transaction_date'] = value
            
            logger.info(f"Callback parsed: {parsed_data}")
            return parsed_data
            
        except Exception as e:
            logger.error(f"Callback validation failed: {str(e)}")
            raise MpesaException(f"Callback validation failed: {str(e)}")
    
    @staticmethod
    def format_phone_number(phone: str) -> str:
        """
        Format phone number to M-Pesa format (254XXXXXXXXX)
        
        Args:
            phone: Phone number in various formats
            
        Returns:
            Formatted phone number
        """
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


class MpesaException(Exception):
    """Custom exception for M-Pesa API errors"""
    
    def __init__(self, message: str, code: int = None):
        self.message = message
        self.code = code
        super().__init__(self.message)
    
    def __str__(self):
        if self.code:
            return f"MpesaException({self.code}): {self.message}"
        return f"MpesaException: {self.message}"


# Convenience function to get MpesaDaraja instance
def get_mpesa_adapter() -> MpesaDaraja:
    """Get a configured MpesaDaraja instance"""
    return MpesaDaraja(
        consumer_key=getattr(settings, 'MPESA_CONSUMER_KEY', ''),
        consumer_secret=getattr(settings, 'MPESA_CONSUMER_SECRET', ''),
        shortcode=getattr(settings, 'MPESA_SHORTCODE', ''),
        passkey=getattr(settings, 'MPESA_PASSKEY', ''),
        callback_url=getattr(settings, 'MPESA_CALLBACK_URL', ''),
        environment=getattr(settings, 'MPESA_ENVIRONMENT', 'sandbox')
    )
