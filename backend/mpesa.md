# M-Pesa Daraja Integration Guide

This document explains how to integrate M-Pesa Daraja API with your Django LMS application for accepting course payments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [M-Pesa Developer Portal Setup](#m-pesa-developer-portal-setup)
3. [Configuration](#configuration)
4. [Running Migrations](#running-migrations)
5. [API Endpoints](#api-endpoints)
6. [Testing with Sandbox](#testing-with-sandbox)
7. [Going Live (Production)](#going-live-production)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- ✅ Django project with the payments app installed
- ✅ Python 3.8+ with virtual environment
- ✅ PostgreSQL database running
- ✅ Ngrok (for local testing callbacks)

---

## M-Pesa Developer Portal Setup

### Step 1: Create Developer Account

1. Go to [M-Pesa Developer Portal](https://developer.safaricom.co.ke/)
2. Click "Sign Up" / "Create Account"
3. Fill in your details:
   - First Name, Last Name
   - Email address
   - Phone number
   - Password
4. Verify your email

### Step 2: Create an App

1. Log in to the portal
2. Navigate to "My Apps" → "Create App"
3. Fill in the details:
   - **App Name**: `German School LMS` (or your preferred name)
   - **Description**: Payment integration for German language school
4. Click "Create App"
5. Note down your credentials:
   - `Consumer Key`
   - `Consumer Secret`

### Step 3: Get Test Credentials (Sandbox)

1. Go to "API Sandbox" → "Test Credentials"
2. Find and note:
   - **Business Shortcode**: `174379` (default test shortcode)
   - **Passkey**: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72e1b1f430820`
   - **Test Phone Number**: Use `254700000000` format (replace with a valid test number)

---

## Configuration

### Step 1: Update Environment Variables

Edit your `.env` file in the backend root:

```
env
# Django Settings
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_PORT=5432

# M-Pesa Daraja Configuration
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72e1b1f430820
MPESA_CALLBACK_URL=http://localhost:8000/api/payments/callback/
MPESA_ENVIRONMENT=sandbox

# B2C Settings (for refunds)
MPESA_B2C_INITIATOR_NAME=your_initiator_name
MPESA_B2C_INITIATOR_PASSWORD=your_initiator_password
```

### Step 2: Update .env.example

Add the template for other developers:

```
env
# M-Pesa Daraja Configuration
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=
MPESA_ENVIRONMENT=sandbox

# B2C Settings
MPESA_B2C_INITIATOR_NAME=
MPESA_B2C_INITIATOR_PASSWORD=
```

---

## Running Migrations

### Step 1: Ensure Database is Running

Make sure PostgreSQL is running and accessible.

### Step 2: Run Migrations

```
bash
cd backend

# Activate virtual environment
source .venv/Scripts/activate  # Windows
# source .venv/bin/activate   # Linux/Mac

# Make migrations
python manage.py makemigrations payments

# Run migrations
python manage.py migrate
```

### Step 3: Verify Models

```
bash
python manage.py shell
```

```
python
from payments.models import Payment, MpesaConfiguration
print(Payment.objects.count())
print(MpesaConfiguration.objects.count())
```

---

## API Endpoints

### 1. Initiate STK Push Payment

**Endpoint**: `POST /api/payments/initiate/`

**Request**:
```
json
{
    "phone": "254700000000",
    "amount": 5000,
    "course_id": 1,
    "account_reference": "COURSE-1",
    "transaction_desc": "Payment for German A1 Course"
}
```

**Response** (Success):
```
json
{
    "success": true,
    "message": "STK Push initiated successfully",
    "checkout_request_id": "ws_co_123456789",
    "merchant_request_id": "ws_co_987654321"
}
```

**cURL**:
```
bash
curl -X POST http://localhost:8000/api/payments/initiate/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"phone": "254700000000", "amount": 5000, "course_id": 1}'
```

---

### 2. Payment Callback (Webhook)

**Endpoint**: `POST /api/payments/callback/`

This endpoint is called by M-Pesa when payment is complete. No manual testing needed - M-Pesa calls this automatically.

**Expected Payload** (from M-Pesa):
```
json
{
    "Body": {
        "stkCallback": {
            "MerchantRequestID": "29115-34620561-1",
            "CheckoutRequestID": "ws_co_123456789",
            "ResultCode": 0,
            "ResultDesc": "The service request is processed successfully.",
            "CallbackMetadata": {
                "Item": [
                    {"Name": "Amount", "Value": 5000.0},
                    {"Name": "MpesaReceiptNumber", "Value": "NJ25AY2XK2"},
                    {"Name": "PhoneNumber", "Value": "254700000000"}
                ]
            }
        }
    }
}
```

---

### 3. Check Payment Status

**Endpoint**: `GET /api/payments/<payment_id>/status/`

**Response**:
```
json
{
    "id": 1,
    "checkout_request_id": "ws_co_123456789",
    "amount": "5000",
    "status": "completed",
    "phone": "254700000000",
    "mpesa_receipt": "NJ25AY2XK2",
    "created_at": "2025-01-15T10:30:00Z"
}
```

---

### 4. User Payment History

**Endpoint**: `GET /api/payments/my/`

**Response**:
```
json
[
    {
        "id": 1,
        "course": "German A1",
        "amount": "5000",
        "status": "completed",
        "created_at": "2025-01-15T10:30:00Z"
    }
]
```

---

### 5. Admin - All Payments

**Endpoint**: `GET /api/payments/admin/`

Requires admin authentication.

---

## Testing with Sandbox

### Option 1: Using Postman/cURL

1. **Start your Django server**:
```
bash
cd backend
python manage.py runserver
```

2. **Get JWT Token**:
```
bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "yourpassword"}'
```

3. **Initiate Payment**:
```
bash
curl -X POST http://localhost:8000/api/payments/initiate/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "phone": "254700000000",
    "amount": 100,
    "course_id": 1,
    "account_reference": "TEST-001",
    "transaction_desc": "Test payment"
  }'
```

4. **Check your phone** - You should receive an STK Push prompt

5. **Complete the payment** on your phone with PIN `1234`

6. **Check payment status**:
```
bash
curl http://localhost:8000/api/payments/1/status/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Option 2: Using Ngrok for Local Callback Testing

Since M-Pesa cannot call localhost, use ngrok:

1. **Install ngrok** (if not installed):
```bash
# Windows (using chocolatey)
choco install ngrok

# Or download from https://ngrok.com/download
```

2. **Start ngrok**:
```
bash
ngrok http 8000
```

3. **Copy your ngrok URL** (e.g., `https://abc123.ngrok-free.app`)

4. **Update .env**:
```
env
MPESA_CALLBACK_URL=https://abc123.ngrok-free.app/api/payments/callback/
```

5. **Restart Django server**

6. **Test payment** - M-Pesa will now be able to send callbacks to your local server!

---

### Option 3: Simulate Callback (for testing without real payment)

You can manually trigger the callback processing:

```
bash
python manage.py shell
```

```
python
from payments.models import Payment
from payments.views import MpesaCallbackView
import json

# Create a pending payment
payment = Payment.objects.create(
    user_id=1,
    course_id=1,
    amount=100,
    phone="254700000000",
    checkout_request_id="ws_co_test123",
    status="pending"
)

# Simulate successful callback data
callback_data = {
    "Body": {
        "stkCallback": {
            "MerchantRequestID": "29115-34620561-1",
            "CheckoutRequestID": "ws_co_test123",
            "ResultCode": 0,
            "ResultDesc": "The service request is processed successfully.",
            "CallbackMetadata": {
                "Item": [
                    {"Name": "Amount", "Value": 100.0},
                    {"Name": "MpesaReceiptNumber", "Value": "TEST123456"},
                    {"Name": "PhoneNumber", "Value": "254700000000"}
                ]
            }
        }
    }
}

# Process callback
view = MpesaCallbackView()
response = view.post(None, json.dumps(callback_data))
print(f"Status: {response.status_code}")
print(f"Payment status: {payment.refresh_from_db().status}")
```

---

## Going Live (Production)

### Step 1: Get Production Credentials

1. Go to M-Pesa Developer Portal
2. Apply for production access
3. Get production credentials:
   - Consumer Key & Secret
   - Business Shortcode
   - Passkey

### Step 2: Update Environment

```
env
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_SHORTCODE=your_business_shortcode
MPESA_PASSKEY=your_production_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/callback/
```

### Step 3: Security Checklist

- [ ] Use HTTPS for callback URL
- [ ] Verify callback signatures
- [ ] Implement idempotency (prevent duplicate processing)
- [ ] Set up proper logging
- [ ] Configure proper database backup
- [ ] Use environment variables, never hardcode credentials

---

## Troubleshooting

### Common Issues

#### 1. "Invalid credentials" Error

**Problem**: M-Pesa returns 401 Unauthorized

**Solution**:
- Verify Consumer Key and Secret are correct
- Check that you're using the right environment (sandbox vs production)
- Ensure Shortcode matches the environment

#### 2. "Phone number invalid" Error

**Problem**: STK Push fails with invalid phone

**Solution**:
- Use format: `2547XXXXXXXX` (country code + number without +)
- Ensure phone number is registered with M-Pesa

#### 3. Callback Not Received

**Problem**: Payment completes but no callback

**Solution**:
- Verify callback URL is publicly accessible (use ngrok for testing)
- Check Django server logs
- Ensure firewall allows incoming requests on port 8000
- Implement a status check endpoint as fallback

#### 4. Duplicate Payments

**Problem**: Same payment processed multiple times

**Solution**:
- Use `checkout_request_id` as unique identifier
- Check if payment exists before processing
- Use database transactions

#### 5. Database Connection Error

**Problem**: Cannot connect to PostgreSQL

**Solution**:
- Verify PostgreSQL is running
- Check DATABASE config in settings.py
- Ensure credentials are correct in .env

---

## Testing Checklist

Use this checklist to verify your integration:

- [ ] Can initiate STK Push payment
- [ ] Receive STK Push on phone
- [ ] Complete payment with PIN
- [ ] Receive callback from M-Pesa
- [ ] Payment status updates to "completed"
- [ ] User gets enrolled in course
- [ ] Can check payment status via API
- [ ] Can view payment history

---

## API Reference Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/payments/initiate/` | POST | ✅ | Start STK Push |
| `/api/payments/callback/` | ❌ | M-Pesa webhook |
| `/api/payments/<id>/status/` | GET | ✅ | Check status |
| `/api/payments/my/` | GET | ✅ | User payments |
| `/api/payments/admin/` | GET | Admin | All payments |
| `/api/payments/b2c/` | POST | Admin | Send refund |

---

## Support

- **M-Pesa Docs**: https://developer.safaricom.co.ke/docs
- **Django REST Framework**: https://www.django-rest-framework.org/
- **Your LMS Project**: https://github.com/your-repo

---

*Last Updated: January 2025*
