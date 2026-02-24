# 🇩🇪 German School Online

A full-stack web platform for learning German — from complete beginner (A1) to mastery (C2) — with structured CEFR modules, exam preparation, M-Pesa & card payments, Google sign-in, and a real-time admin dashboard.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Google OAuth Setup](#google-oauth-setup)
- [Features](#features)
- [Pricing & Modules](#pricing--modules)
- [Payment Integration](#payment-integration)
- [Email Notifications](#email-notifications)
- [User Roles](#user-roles)
- [API Endpoints](#api-endpoints)
- [Admin Dashboard](#admin-dashboard)
- [Deployment](#deployment)

---

## Overview

German School Online is a React + Django REST Framework application targeting German language learners in Kenya and beyond. Users can register, choose their CEFR level, pay via M-Pesa STK Push or card, and immediately access their course content. Admins receive real-time registration activity data for every sign-up.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router v6, Vite |
| Auth | JWT (access + refresh tokens), Google OAuth 2.0 |
| Styling | Inline styles with custom CSS animations (no CSS framework) |
| State | Zustand (`useAuthStore`) |
| Backend | Django + Django REST Framework |
| Payments | M-Pesa Daraja STK Push, Card (Stripe / Flutterwave) |
| Email | SendGrid / Resend (configurable) |
| Google Login | `@react-oauth/google` |
| Fonts | Playfair Display + DM Sans (Google Fonts) |

---

## Project Structure

```
src/
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx          ← Multi-step registration + Google OAuth + payments
│   ├── student/
│   │   ├── Dashboard.jsx
│   │   ├── LessonPage.jsx
│   │   ├── CoursesPage.jsx
│   │   ├── CertificatesPage.jsx
│   │   ├── StudentProfile.jsx
│   │   └── ProgressPage.jsx
│   ├── instructor/
│   │   ├── Dashboard.jsx
│   │   ├── TestBuilder.jsx
│   │   ├── VideoUpload.jsx
│   │   └── CourseEditor.jsx
│   ├── admin/
│   │   └── AdminPanel.jsx
│   ├── LandingPage.jsx
│   ├── PlacementTest.jsx
│   └── PricingPage.jsx
├── services/
│   ├── api.js                    ← Axios instance + all API calls
│   └── auth.js                   ← Token save/clear helpers
├── store/
│   └── authStore.js              ← Zustand auth state
└── App.jsx                       ← Routes + GoogleOAuthProvider wrapper
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Python 3.10+ (for the Django backend)

### Frontend

```bash
# Clone the repo
git clone https://github.com/your-org/german-school-online.git
cd german-school-online

# Install dependencies
npm install

# Install Google OAuth library
npm install @react-oauth/google

# Copy environment file and fill in your values
cp .env.example .env

# Start development server
npm run dev
```

The app runs at `http://localhost:5173` by default.

### Backend

```bash
cd backend/
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Google OAuth — get from Google Cloud Console
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Backend API base URL
VITE_API_BASE_URL=http://localhost:8000/api
```

> **Never commit `.env` to version control.** It's listed in `.gitignore`.

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services → Credentials**
3. Click **Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   https://yourdomain.com
   ```
6. Copy the **Client ID** into your `.env` as `VITE_GOOGLE_CLIENT_ID`

The `GoogleOAuthProvider` is already wired in `App.jsx` and reads the Client ID automatically.

---

## Features

### Registration Flow (3 steps)

| Step | Description |
|------|-------------|
| 1 — Account | Name, email, password **or** one-click Google sign-up |
| 2 — Goals | Select CEFR level + learning goal; live price preview in KES or USD |
| 3 — Payment | M-Pesa STK Push or Visa/Mastercard card; free trial bypasses payment |

- **Password strength meter** — checks length, uppercase, and numbers in real time
- **KES / USD currency toggle** — available on every pricing surface; 1 USD ≈ 130 KES
- **Welcome email** — fired immediately after successful registration (both manual and Google)
- **In-app email toast** — animated slide-up confirmation that the welcome email was sent
- **Admin activity log** — every registration POSTs metadata to `/api/admin/registration-activity/`

### Student Features

- CEFR-structured video lessons (A1 → C2)
- Placement test to discover starting level
- Progress tracking with grammar accuracy and exam readiness scores
- Certificates on module completion
- Profile management

### Instructor Features

- Course editor (create and edit modules)
- Video upload with lesson builder
- Test / quiz builder for exam simulation

### Admin Features

- Full admin panel with registration activity feed
- Per-user module selection, payment status, exam goals
- Pricing and course management

---

## Pricing & Modules

All prices are USD-based; KES equivalent shown at checkout using a configurable exchange rate (`USD_TO_KES` constant in `Register.jsx`).

| Module | Level | Price | Duration |
|--------|-------|-------|----------|
| A1 | Complete Beginner | **Free** (7-day trial, then $250) | ~2 months |
| A2 | Elementary | $300 | ~2 months |
| B1 | Intermediate | $350 | ~2 months |
| B2 | Upper-Intermediate | $400 | ~2 months |
| C1 | Advanced | $450 | ~2 months |
| C2 | Mastery | $500 | ~2 months |

To update the exchange rate, change the constant at the top of `Register.jsx`:

```js
const USD_TO_KES = 130  // update as needed
```

---

## Payment Integration

### M-Pesa (Safaricom STK Push)

- Accepts `07XX`, `01XX`, `+2547XX`, and `+2541XX` number formats
- Backend calls the **Daraja API** (`/mpesa/stkpush/`) with the amount and phone number
- User receives a PIN prompt on their phone; backend polls or listens for a callback to confirm

**Required backend endpoints:**
```
POST /api/payments/mpesa/initiate/   → triggers STK push
POST /api/payments/mpesa/callback/   → Safaricom webhook (payment confirmation)
```

### Card (Visa / Mastercard)

- Card details are validated client-side before submission
- Backend processes via Stripe or Flutterwave (configure in backend settings)

```
POST /api/payments/card/charge/
```

---

## Email Notifications

On successful registration, the frontend immediately calls:

```
POST /api/auth/send-welcome-email/
Body: { email, name, module, goal }
```

This is **fire-and-forget** — it never blocks navigation or shows an error to the user if it fails. The backend should send a branded welcome email using your preferred provider.

### Recommended providers

| Provider | Free tier | Notes |
|----------|-----------|-------|
| [Resend](https://resend.com) | 3,000 emails/month | Simple API, great DX |
| [SendGrid](https://sendgrid.com) | 100 emails/day | Battle-tested |
| [Mailgun](https://mailgun.com) | 5,000 emails/month (trial) | Good deliverability |

### Django example (using Resend)

```python
# views.py
import resend

def send_welcome_email(request):
    data = request.data
    resend.api_key = settings.RESEND_API_KEY
    resend.Emails.send({
        "from": "German School Online <noreply@yourdomain.com>",
        "to": data["email"],
        "subject": f"Welcome to German School Online, {data['name']}! 🎉",
        "html": f"<p>You're enrolled in <strong>{data['module']}</strong>. Let's start learning!</p>",
    })
    return Response({"status": "sent"})
```

---

## User Roles

| Role | Default redirect after login |
|------|------------------------------|
| `student` | `/placement-test` (first login) → `/student/dashboard` |
| `instructor` | `/instructor/dashboard` |
| `admin` | `/admin/dashboard` |

Roles are returned by the backend in the JWT payload and stored in Zustand (`useAuthStore`).

---

## API Endpoints

All endpoints are prefixed with `/api/`. The frontend reads the base URL from `VITE_API_BASE_URL`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register/` | Manual registration |
| POST | `/auth/google/` | Google OAuth registration / login |
| POST | `/auth/login/` | Email + password login |
| POST | `/auth/token/refresh/` | Refresh JWT access token |
| POST | `/auth/send-welcome-email/` | Trigger welcome email |
| POST | `/admin/registration-activity/` | Log registration event for admin |
| POST | `/payments/mpesa/initiate/` | Trigger M-Pesa STK push |
| POST | `/payments/mpesa/callback/` | Safaricom payment confirmation webhook |
| POST | `/payments/card/charge/` | Process card payment |
| GET | `/courses/` | List all courses |
| GET | `/courses/:id/lessons/` | List lessons for a course |
| GET | `/students/progress/` | Student progress data |

---

## Admin Dashboard

Every registration fires a POST to `/api/admin/registration-activity/` with:

```json
{
  "event": "user_registration",
  "timestamp": "2026-02-24T10:30:00Z",
  "user_email": "student@example.com",
  "user_name": "Anna Müller",
  "selected_module": "B1 — Intermediate",
  "module_label": "B1 Module",
  "exam_goal": "goethe",
  "price_usd": 350,
  "price_kes": 45500,
  "is_free_trial": false,
  "payment_currency": "KES",
  "via_google": false
}
```

The **AdminPanel** page (`/admin/dashboard`) consumes this feed to give administrators a real-time view of who signed up, which module they selected, their exam goal, and what they paid.

---

## Deployment

### Frontend (Vite)

```bash
npm run build
# Output is in dist/ — deploy to Vercel, Netlify, or any static host
```

Set environment variables on your hosting platform:
```
VITE_GOOGLE_CLIENT_ID=...
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

Remember to add your production domain to the **Authorized JavaScript origins** in Google Cloud Console.

### Backend (Django)

```bash
python manage.py collectstatic
gunicorn backend.wsgi:application
```

Recommended: deploy on **Railway**, **Render**, or a VPS with **Nginx + Gunicorn**.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a pull request

---

## License

MIT © German School Online
