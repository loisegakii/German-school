/**
 * Register.jsx
 *
 * DEPENDENCIES TO INSTALL:
 *   npm install @react-oauth/google
 *
 * BACKEND REQUIREMENTS:
 *   POST /api/auth/google/              — accepts { access_token } (Google token), returns same shape as /api/auth/register/
 *   POST /api/auth/send-welcome-email/ — accepts { email, name, module, goal } → triggers email via SendGrid/Resend/etc.
 *
 * WRAP YOUR APP (e.g. main.jsx / App.jsx):
 *   import { GoogleOAuthProvider } from '@react-oauth/google'
 *   <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
 *     <App />
 *   </GoogleOAuthProvider>
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import {
  GraduationCap, ClipboardList, User, Mail, Lock,
  PlayCircle, CheckCircle, BarChart2, Target, ChevronDown,
  ArrowRight, ChevronLeft, Check, AlertTriangle,
  Briefcase, Plane, MessageSquare, BookOpen, Phone, CreditCard,
  Shield, Smartphone, Zap,
} from 'lucide-react'
import { authAPI } from '../../services/api'
import { saveTokens } from '../../services/auth'
import { useAuthStore } from '../../store/authStore'

// ─── Currency config ───────────────────────────────────────────────────────────
const USD_TO_KES = 130
const formatPrice = (usd, currency) => {
  if (usd === 0) return 'Free'
  if (currency === 'USD') return `$${usd.toLocaleString()}`
  return `KES ${Math.round(usd * USD_TO_KES).toLocaleString()}`
}
const getRawKes = (usd) => Math.round(usd * USD_TO_KES)

// ─── Pricing data ─────────────────────────────────────────────────────────────
const LEVEL_PRICES = {
  'A1 — Complete Beginner':                 { usdPrice: 0,   usdAfterTrial: 250, label: 'Free Trial', period: '7 days free, then $250/module' },
  'A2 — Elementary':                        { usdPrice: 300, label: 'A2 Module',  period: 'per module (~2 months)' },
  'B1 — Intermediate':                      { usdPrice: 350, label: 'B1 Module',  period: 'per module (~2 months)' },
  'B2 — Upper-Intermediate':                { usdPrice: 400, label: 'B2 Module',  period: 'per module (~2 months)' },
  'C1 — Advanced':                          { usdPrice: 450, label: 'C1 Module',  period: 'per module (~2 months)' },
  'C2 — Mastery':                           { usdPrice: 500, label: 'C2 Module',  period: 'per module (~2 months)' },
  "I'm not sure — take the placement test": { usdPrice: 0,   label: 'Free',       period: 'placement test first' },
}
const CEFR_LEVELS = Object.keys(LEVEL_PRICES)

const GOALS = [
  { id: 'goethe',   label: 'Goethe-Institut Exam', icon: <GraduationCap size={18} strokeWidth={1.8} /> },
  { id: 'telc',     label: 'TELC Certification',   icon: <ClipboardList  size={18} strokeWidth={1.8} /> },
  { id: 'testdaf',  label: 'TestDaF Exam',          icon: <BookOpen       size={18} strokeWidth={1.8} /> },
  { id: 'work',     label: 'Work in Germany',       icon: <Briefcase      size={18} strokeWidth={1.8} /> },
  { id: 'relocate', label: 'Relocation / Visa',     icon: <Plane          size={18} strokeWidth={1.8} /> },
  { id: 'general',  label: 'General Fluency',       icon: <MessageSquare  size={18} strokeWidth={1.8} /> },
]

const FEATURES = [
  { icon: <PlayCircle  size={18} strokeWidth={1.8} />, color: '#3B82F6', title: 'HD Video Lessons',   desc: 'Native-quality video with German & English subtitles'     },
  { icon: <CheckCircle size={18} strokeWidth={1.8} />, color: '#10B981', title: 'Exam Simulations',   desc: 'Replicated Goethe, TELC & TestDaF exam structure'          },
  { icon: <BarChart2   size={18} strokeWidth={1.8} />, color: '#F59E0B', title: 'Progress Analytics', desc: 'Track grammar accuracy, listening scores & exam readiness' },
  { icon: <Target      size={18} strokeWidth={1.8} />, color: '#8B5CF6', title: 'Placement Test',     desc: 'Know your level in 15 minutes with adaptive questions'     },
]

// ─── Utilities ────────────────────────────────────────────────────────────────
const formatCard   = val => val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
const formatExpiry = val => { const d = val.replace(/\D/g, '').slice(0, 4); return d.length >= 3 ? `${d.slice(0,2)}/${d.slice(2)}` : d }

// ─── Fire-and-forget helpers ──────────────────────────────────────────────────
const sendWelcomeEmail = async ({ email, name, module: mod, goal }) => {
  try {
    await fetch('/api/auth/send-welcome-email/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, module: mod, goal }),
    })
  } catch { /* never block user */ }
}

const logAdminActivity = async (payload) => {
  try {
    await fetch('/api/admin/registration-activity/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'user_registration', timestamp: new Date().toISOString(), ...payload }),
    })
  } catch { /* never block user */ }
}

// ─── Welcome Email Toast ──────────────────────────────────────────────────────
function EmailToast({ email, onDone }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 60)
    const t2 = setTimeout(() => setExiting(true), 4200)
    const t3 = setTimeout(() => onDone(), 5000)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
      transform: visible && !exiting ? 'translateY(0) scale(1)' : 'translateY(100px) scale(0.95)',
      opacity: visible && !exiting ? 1 : 0,
      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '14px',
        background: 'rgba(6, 9, 15, 0.92)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(16,185,129,0.4)',
        borderRadius: '18px', padding: '18px 22px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(16,185,129,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
        minWidth: '320px', maxWidth: '380px',
      }}>
        {/* Envelope icon with glow */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #059669, #10B981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 8px 24px rgba(16,185,129,0.45)',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: '700', color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Welcome email sent! <span style={{ fontSize: '15px' }}>🎉</span>
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.55' }}>
            Check your inbox at{' '}
            <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '600', wordBreak: 'break-all' }}>{email}</span>
          </div>
          {/* shrinking progress bar */}
          <div style={{ marginTop: '12px', height: '2px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #059669, #10B981)', borderRadius: '2px', animation: 'shrink 4.2s linear forwards' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Shared primitives ────────────────────────────────────────────────────────
const FloatingOrb = ({ size, x, y, color, blur, duration }) => (
  <div style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', background: color, left: x, top: y, filter: `blur(${blur})`, animation: `float ${duration} ease-in-out infinite alternate`, pointerEvents: 'none' }} />
)

const CurrencyToggle = ({ currency, onChange }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '3px' }}>
    {['KES', 'USD'].map(c => (
      <button key={c} onClick={() => onChange(c)} style={{ padding: '5px 13px', borderRadius: '7px', border: 'none', background: currency === c ? (c === 'USD' ? '#3B82F6' : '#059669') : 'transparent', color: currency === c ? '#fff' : 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.22s', letterSpacing: '0.3px' }}>
        {c === 'USD' ? '$ USD' : 'KSh'}
      </button>
    ))}
  </div>
)

const InputField = ({ label, type = 'text', value, onChange, placeholder, icon, error, hint, maxLength }) => {
  const [focused, setFocused] = useState(false)
  const [show,    setShow]    = useState(false)
  const isPassword = type === 'password'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      {label && <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.3px' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', opacity: 0.4 }}>{icon}</span>}
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value} onChange={onChange} maxLength={maxLength}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{ width: '100%', padding: `13px ${isPassword ? '44px' : '16px'} 13px ${icon ? '44px' : '16px'}`, background: focused ? 'rgba(59,130,246,0.07)' : 'rgba(255,255,255,0.04)', border: `1px solid ${error ? '#EF4444' : focused ? 'rgba(59,130,246,0.55)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', outline: 'none', transition: 'all 0.25s', boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none' }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', display: 'flex', padding: 0 }}>
            {show
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
          </button>
        )}
      </div>
      {error && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#EF4444' }}>{error}</span>}
      {hint && !error && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{hint}</span>}
    </div>
  )
}

const PasswordStrength = ({ password }) => {
  const checks = [{ label: '8+ chars', pass: password.length >= 8 }, { label: 'Uppercase', pass: /[A-Z]/.test(password) }, { label: 'Number', pass: /[0-9]/.test(password) }]
  const strength = checks.filter(c => c.pass).length
  const colors = ['#EF4444', '#F59E0B', '#10B981']
  const labels = ['Weak', 'Fair', 'Strong']
  if (!password) return null
  return (
    <div style={{ marginTop: '2px' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '7px' }}>
        {[0,1,2].map(i => <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i < strength ? colors[strength-1] : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {checks.map(c => (
            <span key={c.label} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: c.pass ? '#10B981' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {c.pass ? <Check size={10} strokeWidth={3} color="#10B981" /> : <span style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.2)', display: 'inline-block' }} />}
              {c.label}
            </span>
          ))}
        </div>
        {strength > 0 && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', color: colors[strength-1] }}>{labels[strength-1]}</span>}
      </div>
    </div>
  )
}

const StepIndicator = ({ current, total, labels }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '28px' }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i < current ? '#10B981' : i === current ? '#3B82F6' : 'rgba(255,255,255,0.07)', border: `2px solid ${i < current ? '#10B981' : i === current ? '#3B82F6' : 'rgba(255,255,255,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.35s', flexShrink: 0 }}>
            {i < current ? <Check size={13} color="#fff" strokeWidth={3} /> : <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', color: i === current ? '#fff' : 'rgba(255,255,255,0.28)' }}>{i+1}</span>}
          </div>
          {labels && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9.5px', fontWeight: '600', color: i === current ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.22)', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{labels[i]}</span>}
        </div>
        {i < total-1 && <div style={{ width: '36px', height: '2px', background: i < current ? '#10B981' : 'rgba(255,255,255,0.08)', transition: 'background 0.35s', borderRadius: '1px', marginBottom: labels ? '14px' : '0' }} />}
      </div>
    ))}
  </div>
)

const MpesaLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#00A651" />
    <text x="24" y="32" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="13" fill="#fff">M-PESA</text>
  </svg>
)

// ─── Google Sign-Up Button ─────────────────────────────────────────────────────
function GoogleSignUpButton({ onSuccess, onError, loading }) {
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Fetch the user's Google profile using the access token
        const res  = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
        if (!res.ok) throw new Error('Failed to fetch profile')
        const userInfo = await res.json()
        onSuccess({ tokenResponse, userInfo })
      } catch {
        onError('Failed to retrieve your Google profile. Please try again.')
      }
    },
    onError: () => onError('Google sign-in was cancelled or blocked. Please try again.'),
  })

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      disabled={loading}
      style={{
        width: '100%', padding: '13px',
        background: loading ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: '12px', color: '#fff',
        fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        marginBottom: '18px', transition: 'all 0.22s',
        opacity: loading ? 0.65 : 1,
      }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.24)' } }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
    >
      {loading
        ? <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        : <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z"/>
          </svg>
      }
      {loading ? 'Signing in with Google…' : 'Sign up with Google'}
    </button>
  )
}

// ─── Payment Step ──────────────────────────────────────────────────────────────
function PaymentStep({ level, currency, onCurrencyChange, onSuccess, onBack }) {
  const pricing      = LEVEL_PRICES[level] ?? { usdPrice: 0, label: 'Free', period: '' }
  const isFree       = pricing.usdPrice === 0
  const [method,     setMethod]     = useState(isFree ? 'free' : 'mpesa')
  const [mpesa,      setMpesa]      = useState({ phone: '' })
  const [card,       setCard]       = useState({ number: '', expiry: '', cvv: '', name: '' })
  const [mpesaState, setMpesaState] = useState('idle')
  const [cardState,  setCardState]  = useState('idle')
  const [errors,     setErrors]     = useState({})
  const [timer,      setTimer]      = useState(0)
  const displayPrice = formatPrice(pricing.usdPrice, currency)

  const sendMpesa = () => {
    const e = {}
    const raw = mpesa.phone.replace(/\s/g, '')
    if (!raw) e.phone = 'Phone number is required'
    else if (!/^(07|01|2547|2541)\d{8}$/.test(raw.replace('+', ''))) e.phone = 'Enter a valid Safaricom number'
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setMpesaState('pushed')
    let t = 60; setTimer(t)
    const iv = setInterval(() => { t -= 1; setTimer(t); if (t <= 0) { clearInterval(iv); setMpesaState('idle') } }, 1000)
    setTimeout(() => { clearInterval(iv); setMpesaState('done'); setTimeout(onSuccess, 1200) }, 4000)
  }

  const processCard = () => {
    const e = {}
    if (!card.name.trim())                          e.cardName   = 'Cardholder name required'
    if (card.number.replace(/\s/g,'').length < 16) e.cardNumber = 'Enter a valid 16-digit card number'
    if (!card.expiry || card.expiry.length < 5)    e.cardExpiry = 'Enter expiry MM/YY'
    if (!card.cvv || card.cvv.length < 3)          e.cardCvv    = 'Enter CVV'
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setCardState('processing')
    setTimeout(() => { setCardState('done'); setTimeout(onSuccess, 1000) }, 2800)
  }

  if (isFree) {
    const afterTrialDisplay = formatPrice(pricing.usdAfterTrial ?? 250, currency)
    return (
      <div className="fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '700', color: '#fff' }}>You're all set.</div>
          <CurrencyToggle currency={currency} onChange={onCurrencyChange} />
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>A1 is completely free for your first 7 days.</p>
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: '16px', padding: '28px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #10B981, transparent)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '700', color: '#10B981', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '6px' }}>7-Day Free Trial</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: '#fff' }}>A1 — Complete Beginner</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: '800', color: '#10B981', lineHeight: 1 }}>Free</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '3px' }}>No card required</div>
            </div>
          </div>
          {['Full A1 curriculum access for 7 days', 'Video lessons, grammar exercises & quizzes', 'Access to the placement test', 'Continue with A1 or upgrade after trial'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(16,185,129,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={10} color="#10B981" strokeWidth={3} /></div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.62)' }}>{f}</span>
            </div>
          ))}
          <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '9px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.38)', lineHeight: '1.6' }}>
            After 7 days: <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{afterTrialDisplay}/module</strong> — or stay free and take the placement test anytime.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onBack} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.55)', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <ChevronLeft size={16} strokeWidth={2} /> Back
          </button>
          <button onClick={onSuccess} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #059669, #10B981)', border: 'none', borderRadius: '12px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 8px 28px rgba(16,185,129,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Check size={15} strokeWidth={2.5} /> Activate Free Trial
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '700', color: '#fff' }}>Secure Checkout</div>
        <CurrencyToggle currency={currency} onChange={onCurrencyChange} />
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>Complete payment to activate your course access</p>

      {/* Order summary */}
      <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: '14px', padding: '18px 20px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>{pricing.label}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: 'rgba(255,255,255,0.7)' }}>{level} · {pricing.period}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{displayPrice}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>
              {currency === 'USD' ? `≈ KES ${getRawKes(pricing.usdPrice).toLocaleString()}` : `≈ $${pricing.usdPrice}`}
            </div>
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>Payment Method</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[{ id: 'mpesa', label: 'M-Pesa', sub: 'Safaricom STK Push', icon: <MpesaLogo size={28} /> }, { id: 'card', label: 'Card', sub: 'Visa / Mastercard', icon: <CreditCard size={24} color="#60A5FA" strokeWidth={1.8} /> }].map(m => (
            <div key={m.id} onClick={() => { setMethod(m.id); setErrors({}); setMpesaState('idle'); setCardState('idle') }}
              style={{ padding: '14px 16px', borderRadius: '12px', border: `1.5px solid ${method === m.id ? (m.id === 'mpesa' ? '#00A651' : '#3B82F6') : 'rgba(255,255,255,0.09)'}`, background: method === m.id ? (m.id === 'mpesa' ? 'rgba(0,166,81,0.08)' : 'rgba(59,130,246,0.07)') : 'rgba(255,255,255,0.025)', cursor: 'pointer', transition: 'all 0.22s', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flexShrink: 0 }}>{m.icon}</div>
              <div><div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', color: '#fff' }}>{m.label}</div><div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.38)' }}>{m.sub}</div></div>
              <div style={{ marginLeft: 'auto', width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${method === m.id ? (m.id === 'mpesa' ? '#00A651' : '#3B82F6') : 'rgba(255,255,255,0.2)'}`, background: method === m.id ? (m.id === 'mpesa' ? '#00A651' : '#3B82F6') : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.22s', flexShrink: 0 }}>
                {method === m.id && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* M-Pesa */}
      {method === 'mpesa' && (
        <div style={{ marginBottom: '20px' }}>
          {mpesaState === 'idle' && (
            <>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>Safaricom Number</div>
              <InputField label="" type="tel" value={mpesa.phone} onChange={e => { setMpesa({ phone: e.target.value }); setErrors({}) }} placeholder="07XX XXX XXX or 01XX XXX XXX" icon={<Phone size={15} strokeWidth={2} />} error={errors.phone} hint="We'll send an STK push to this number" />
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[{ n: '1', text: 'Enter your Safaricom number above' }, { n: '2', text: "You'll receive an M-Pesa prompt on your phone" }, { n: '3', text: 'Enter your M-Pesa PIN to confirm payment' }].map(s => (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,166,81,0.15)', border: '1px solid rgba(0,166,81,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '800', color: '#00A651' }}>{s.n}</span>
                    </div>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: 'rgba(255,255,255,0.45)' }}>{s.text}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {mpesaState === 'pushed' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0,166,81,0.12)', border: '2px solid rgba(0,166,81,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <Smartphone size={28} color="#00A651" strokeWidth={1.5} />
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Check your phone</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.75', maxWidth: '280px', margin: '0 auto 18px' }}>
                An M-Pesa prompt has been sent to <strong style={{ color: '#fff' }}>{mpesa.phone}</strong>. Enter your PIN to confirm <strong style={{ color: '#fff' }}>{displayPrice}</strong>.
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', background: 'rgba(0,166,81,0.08)', border: '1px solid rgba(0,166,81,0.2)', borderRadius: '100px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00A651', animation: 'ping 1s ease-in-out infinite' }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#00A651', fontWeight: '600' }}>Waiting · {timer}s</span>
              </div>
            </div>
          )}
          {mpesaState === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Check size={26} color="#10B981" strokeWidth={2.5} />
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: '#10B981' }}>Payment Confirmed</div>
            </div>
          )}
        </div>
      )}

      {/* Card */}
      {method === 'card' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '13px', marginBottom: '20px' }}>
          {cardState === 'idle' && (
            <>
              <InputField label="Cardholder name" value={card.name} onChange={e => { setCard(c => ({ ...c, name: e.target.value })); setErrors({}) }} placeholder="As it appears on the card" icon={<User size={15} strokeWidth={2} />} error={errors.cardName} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>Card number</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, display: 'flex' }}><CreditCard size={15} strokeWidth={2} /></span>
                  <input value={formatCard(card.number)} onChange={e => { setCard(c => ({ ...c, number: e.target.value })); setErrors({}) }} placeholder="1234 5678 9012 3456" maxLength={19} style={{ width: '100%', padding: '13px 16px 13px 44px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${errors.cardNumber ? '#EF4444' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', outline: 'none', letterSpacing: '2px', transition: 'all 0.25s' }} />
                </div>
                {errors.cardNumber && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#EF4444' }}>{errors.cardNumber}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>Expiry</label>
                  <input value={formatExpiry(card.expiry)} onChange={e => { setCard(c => ({ ...c, expiry: e.target.value })); setErrors({}) }} placeholder="MM / YY" maxLength={5} style={{ padding: '13px 16px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${errors.cardExpiry ? '#EF4444' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', outline: 'none', transition: 'all 0.25s' }} />
                  {errors.cardExpiry && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#EF4444' }}>{errors.cardExpiry}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>CVV</label>
                  <input value={card.cvv} onChange={e => { setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g,'').slice(0,4) })); setErrors({}) }} placeholder="•••" maxLength={4} type="password" style={{ padding: '13px 16px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${errors.cardCvv ? '#EF4444' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', outline: 'none', transition: 'all 0.25s' }} />
                  {errors.cardCvv && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#EF4444' }}>{errors.cardCvv}</span>}
                </div>
              </div>
            </>
          )}
          {cardState === 'processing' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', border: '2px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <div style={{ width: '24px', height: '24px', border: '2.5px solid rgba(59,130,246,0.3)', borderTop: '2.5px solid #3B82F6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>Processing payment…</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.38)' }}>Please do not close this window</div>
            </div>
          )}
          {cardState === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Check size={26} color="#10B981" strokeWidth={2.5} />
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: '#10B981' }}>Payment Confirmed</div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: '9px', marginBottom: '18px' }}>
        <Shield size={14} color="rgba(255,255,255,0.35)" strokeWidth={1.8} />
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.5' }}>256-bit SSL encrypted · PCI-DSS compliant · Your data is never stored</span>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onBack} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.55)', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ChevronLeft size={16} strokeWidth={2} /> Back
        </button>
        {method === 'mpesa' && mpesaState === 'idle' && (
          <button onClick={sendMpesa} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #007A3D, #00A651)', border: 'none', borderRadius: '12px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 8px 28px rgba(0,166,81,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Zap size={15} strokeWidth={2.5} /> Send STK Push · {displayPrice}
          </button>
        )}
        {method === 'card' && cardState === 'idle' && (
          <button onClick={processCard} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #1B3A6B, #3B82F6)', border: 'none', borderRadius: '12px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 8px 28px rgba(59,130,246,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <CreditCard size={15} strokeWidth={2.5} /> Pay {displayPrice}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function Register() {
  const navigate    = useNavigate()
  const loginStore  = useAuthStore((s) => s.login)

  const [step,       setStep]       = useState(1)
  const [loading,    setLoading]    = useState(false)
  const [googleLoad, setGoogleLoad] = useState(false)
  const [errors,     setErrors]     = useState({})
  const [apiError,   setApiError]   = useState('')
  const [currency,   setCurrency]   = useState('KES')
  const [showToast,  setShowToast]  = useState(false)
  const [toastEmail, setToastEmail] = useState('')

  const [form, setForm] = useState({
    role: 'student', firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '', cefrLevel: '', goal: '', agreeTerms: false,
  })

  const update = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
    setApiError('')
  }

  const pricing    = LEVEL_PRICES[form.cefrLevel]
  const isFree     = !pricing || pricing.usdPrice === 0
  const stepLabels = ['Account', 'Goals', isFree ? 'Free Trial' : 'Payment']

  // ── Shared post-registration actions ─────────────────────────────────────────
  const onRegistered = (data, { firstName, lastName, cefrLevel, goal, isGoogle = false }) => {
    const fullName        = `${firstName} ${lastName}`.trim()
    const selectedPricing = LEVEL_PRICES[cefrLevel]
    const usdPrice        = selectedPricing?.usdPrice ?? 0

    saveTokens(data.tokens.access, data.tokens.refresh)
    loginStore({
      email: data.user.email,
      name:  `${data.user.first_name} ${data.user.last_name}`.trim(),
      role:  data.user.role,
      level: data.user.current_level ?? null,
    })

    // 📧 Trigger welcome email immediately
    sendWelcomeEmail({ email: data.user.email, name: fullName, module: cefrLevel, goal })

    // 🔔 Show in-app toast
    setToastEmail(data.user.email)
    setShowToast(true)

    // 📊 Admin log
    logAdminActivity({
      user_email:      data.user.email,
      user_name:       fullName,
      selected_module: cefrLevel,
      module_label:    selectedPricing?.label ?? 'N/A',
      exam_goal:       goal,
      price_usd:       usdPrice,
      price_kes:       getRawKes(usdPrice),
      is_free_trial:   usdPrice === 0,
      payment_currency: currency,
      via_google:      isGoogle,
    })

    // Navigate after brief pause (so toast is visible)
    setTimeout(() => {
      if (data.user.role === 'instructor') navigate('/instructor/dashboard')
      else if (data.user.role === 'admin') navigate('/admin/dashboard')
      else navigate('/placement-test')
    }, 1800)
  }

  // ── Google sign-up ────────────────────────────────────────────────────────────
  const handleGoogleSuccess = async ({ tokenResponse, userInfo }) => {
    setGoogleLoad(true)
    setApiError('')
    try {
      const { data } = await authAPI.googleRegister({
        access_token:  tokenResponse.access_token,
        first_name:    userInfo.given_name  ?? '',
        last_name:     userInfo.family_name ?? '',
        email:         userInfo.email,
        role:          'student',
        current_level: form.cefrLevel || null,
        exam_goal:     form.goal || 'general',
        registration_meta: {
          selected_module:  form.cefrLevel,
          exam_goal:        form.goal,
          price_usd:        LEVEL_PRICES[form.cefrLevel]?.usdPrice ?? 0,
          price_kes:        getRawKes(LEVEL_PRICES[form.cefrLevel]?.usdPrice ?? 0),
          is_free_trial:    (LEVEL_PRICES[form.cefrLevel]?.usdPrice ?? 0) === 0,
          payment_currency: currency,
          via_google:       true,
          registered_at:    new Date().toISOString(),
        },
      })
      onRegistered(data, {
        firstName: userInfo.given_name  ?? '',
        lastName:  userInfo.family_name ?? '',
        cefrLevel: form.cefrLevel,
        goal:      form.goal || 'general',
        isGoogle:  true,
      })
    } catch (err) {
      const detail = err.response?.data
      setApiError(detail?.detail || detail?.email?.[0] || 'Google sign-up failed. Please try again.')
    } finally {
      setGoogleLoad(false)
    }
  }

  // ── Manual payment success ────────────────────────────────────────────────────
  const handlePaymentSuccess = async () => {
    setLoading(true)
    setApiError('')
    try {
      const usdPrice = LEVEL_PRICES[form.cefrLevel]?.usdPrice ?? 0
      const { data } = await authAPI.register({
        first_name:    form.firstName,
        last_name:     form.lastName,
        email:         form.email,
        password:      form.password,
        role:          form.role,
        current_level: form.cefrLevel || null,
        exam_goal:     form.goal,
        registration_meta: {
          selected_module:  form.cefrLevel,
          module_label:     LEVEL_PRICES[form.cefrLevel]?.label ?? 'N/A',
          exam_goal:        form.goal,
          price_usd:        usdPrice,
          price_kes:        getRawKes(usdPrice),
          is_free_trial:    usdPrice === 0,
          payment_currency: currency,
          via_google:       false,
          registered_at:    new Date().toISOString(),
        },
      })
      onRegistered(data, { firstName: form.firstName, lastName: form.lastName, cefrLevel: form.cefrLevel, goal: form.goal })
    } catch (err) {
      const detail = err.response?.data
      if (detail?.email)         setErrors({ email: detail.email[0] })
      else if (detail?.password) setErrors({ password: detail.password[0] })
      else setApiError(detail?.detail || 'Something went wrong. Please try again.')
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  const validateStep = () => {
    const e = {}
    if (step === 1) {
      if (!form.firstName.trim()) e.firstName = 'First name is required'
      if (!form.lastName.trim())  e.lastName  = 'Last name is required'
      if (!form.email)            e.email     = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
      if (!form.password)         e.password  = 'Password is required'
      else if (form.password.length < 8) e.password = 'Minimum 8 characters'
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    }
    if (step === 2) { if (!form.goal) e.goal = 'Please select your learning goal' }
    return e
  }

  const next = () => {
    const e = validateStep()
    if (Object.keys(e).length) { setErrors(e); return }
    if (step < 2) { setStep(s => s + 1); return }
    if (!form.agreeTerms) { setErrors({ agreeTerms: 'You must agree to continue' }); return }
    setStep(3)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,800;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #06090F; color: #fff; }
        @keyframes float  { from { transform: translateY(0px); } to { transform: translateY(-24px); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes ping   { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
        @keyframes shrink { from { width: 100%; } to { width: 0%; } }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        input::placeholder { color: rgba(255,255,255,0.22); }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0px 1000px #0d1424 inset !important; -webkit-text-fill-color: #fff !important; }
        select { appearance: none; }
        select option { background: #0d1424; color: #fff; }
      `}</style>

      {/* 📧 Realtime welcome email toast */}
      {showToast && <EmailToast email={toastEmail} onDone={() => setShowToast(false)} />}

      <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>

        {/* LEFT PANEL */}
        <div style={{ position: 'relative', background: 'linear-gradient(145deg, #06090F 0%, #0D1B35 60%, #06090F 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', overflow: 'hidden' }}>
          <FloatingOrb size="500px" x="-20%" y="-15%" color="radial-gradient(circle, rgba(27,58,107,0.65), transparent)" blur="80px" duration="9s" />
          <FloatingOrb size="350px" x="45%"  y="35%"  color="radial-gradient(circle, rgba(59,130,246,0.18), transparent)" blur="70px" duration="12s" />
          <FloatingOrb size="250px" x="5%"   y="70%"  color="radial-gradient(circle, rgba(16,185,129,0.12), transparent)" blur="60px" duration="8s" />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)', backgroundSize: '56px 56px', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #1B3A6B, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontWeight: '800', fontSize: '20px', color: '#fff' }}>G</div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '20px', color: '#fff' }}>German School Online</span>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 2.8vw, 42px)', fontWeight: '800', color: '#fff', lineHeight: '1.12', marginBottom: '32px' }}>
              Everything you need<br />
              <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #93C5FD, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>to pass your exam.</em>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${f.color}18`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '3px' }}>{f.title}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.38)', lineHeight: '1.5' }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing table */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '2px' }}>Module Pricing</span>
              <CurrencyToggle currency={currency} onChange={setCurrency} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[
                { level: 'A1', label: 'Complete Beginner',  usd: 0,   note: '7-day free' },
                { level: 'A2', label: 'Elementary',         usd: 300 },
                { level: 'B1', label: 'Intermediate',       usd: 350 },
                { level: 'B2', label: 'Upper-Intermediate', usd: 400 },
                { level: 'C1', label: 'Advanced',           usd: 450 },
                { level: 'C2', label: 'Mastery',            usd: 500 },
              ].map(p => (
                <div key={p.level} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.025)' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}><strong style={{ color: '#fff' }}>{p.level}</strong> — {p.label}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', color: p.usd === 0 ? '#10B981' : '#93C5FD' }}>{p.usd === 0 ? (p.note ?? 'Free') : formatPrice(p.usd, currency)}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', color: 'rgba(255,255,255,0.25)', textAlign: 'right' }}>Rate: 1 USD ≈ {USD_TO_KES} KES</div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ background: '#06090F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', overflowY: 'auto' }}>
          <div className="fade-up" style={{ width: '100%', maxWidth: '448px' }}>

            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '30px', fontWeight: '800', color: '#fff', marginBottom: '7px' }}>Create your account</h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                Already have an account?{' '}
                <span onClick={() => navigate('/login')} style={{ color: '#3B82F6', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Sign in</span>
              </p>
            </div>

            <StepIndicator current={step - 1} total={3} labels={stepLabels} />

            {apiError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', marginBottom: '20px' }}>
                <AlertTriangle size={15} color="#EF4444" strokeWidth={2} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#EF4444' }}>{apiError}</span>
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <div className="fade-up">
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '5px' }}>Personal details</div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: 'rgba(255,255,255,0.38)', marginBottom: '22px' }}>Create your secure account</p>

                {/* ✅ Real Google OAuth */}
                <GoogleSignUpButton
                  onSuccess={handleGoogleSuccess}
                  onError={(msg) => setApiError(msg)}
                  loading={googleLoad}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>or fill in manually</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '13px', marginBottom: '13px' }}>
                  <InputField label="First name" value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="Anna"   icon={<User size={15} strokeWidth={2} />} error={errors.firstName} />
                  <InputField label="Last name"  value={form.lastName}  onChange={e => update('lastName',  e.target.value)} placeholder="Müller" icon={<User size={15} strokeWidth={2} />} error={errors.lastName}  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
                  <InputField label="Email address"    type="email"    value={form.email}           onChange={e => update('email',           e.target.value)} placeholder="you@example.com"         icon={<Mail size={15} strokeWidth={2} />} error={errors.email} />
                  <InputField label="Password"         type="password" value={form.password}        onChange={e => update('password',        e.target.value)} placeholder="Create a strong password" icon={<Lock size={15} strokeWidth={2} />} error={errors.password} />
                  {form.password && <PasswordStrength password={form.password} />}
                  <InputField label="Confirm password" type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="Repeat your password"     icon={<Lock size={15} strokeWidth={2} />} error={errors.confirmPassword} />
                </div>

                <button onClick={next} style={{ width: '100%', padding: '14px', marginTop: '24px', background: 'linear-gradient(135deg, #1B3A6B, #3B82F6)', border: 'none', borderRadius: '12px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 8px 28px rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Continue <ArrowRight size={15} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="fade-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '700', color: '#fff' }}>Your learning goal</div>
                  <CurrencyToggle currency={currency} onChange={setCurrency} />
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: 'rgba(255,255,255,0.38)', marginBottom: '22px' }}>We'll tailor your curriculum accordingly</p>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '8px' }}>Current German level (optional)</label>
                  <div style={{ position: 'relative' }}>
                    <select value={form.cefrLevel} onChange={e => update('cefrLevel', e.target.value)} style={{ width: '100%', padding: '13px 40px 13px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: form.cefrLevel ? '#fff' : 'rgba(255,255,255,0.25)', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                      <option value="">Select your level...</option>
                      {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.3)', display: 'flex' }}><ChevronDown size={15} strokeWidth={2} /></span>
                  </div>
                  {form.cefrLevel && pricing && (
                    <div style={{ marginTop: '8px', padding: '10px 14px', background: pricing.usdPrice === 0 ? 'rgba(16,185,129,0.07)' : 'rgba(59,130,246,0.07)', border: `1px solid ${pricing.usdPrice === 0 ? 'rgba(16,185,129,0.22)' : 'rgba(59,130,246,0.22)'}`, borderRadius: '9px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{pricing.period}</span>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '800', color: pricing.usdPrice === 0 ? '#10B981' : '#fff' }}>
                          {pricing.usdPrice === 0 ? 'Free' : formatPrice(pricing.usdPrice, currency)}
                        </span>
                      </div>
                      {pricing.usdPrice > 0 && (
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.28)', marginTop: '3px', textAlign: 'right' }}>
                          {currency === 'USD' ? `≈ KES ${getRawKes(pricing.usdPrice).toLocaleString()}` : `≈ $${pricing.usdPrice}`}
                        </div>
                      )}
                      {pricing.usdPrice === 0 && pricing.usdAfterTrial && (
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
                          After 7 days: {formatPrice(pricing.usdAfterTrial, currency)}/module
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '10px' }}>Primary goal <span style={{ color: '#EF4444' }}>*</span></label>
                  {errors.goal && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#EF4444', marginBottom: '8px' }}>{errors.goal}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                    {GOALS.map(g => (
                      <div key={g.id} onClick={() => update('goal', g.id)} style={{ padding: '13px', borderRadius: '11px', border: `1px solid ${form.goal === g.id ? 'rgba(59,130,246,0.55)' : 'rgba(255,255,255,0.08)'}`, background: form.goal === g.id ? 'rgba(59,130,246,0.09)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '9px', transition: 'all 0.2s' }}>
                        <span style={{ color: form.goal === g.id ? '#3B82F6' : 'rgba(255,255,255,0.32)', flexShrink: 0 }}>{g.icon}</span>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: form.goal === g.id ? '#fff' : 'rgba(255,255,255,0.52)' }}>{g.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div onClick={() => update('agreeTerms', !form.agreeTerms)} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '4px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${errors.agreeTerms ? '#EF4444' : form.agreeTerms ? '#3B82F6' : 'rgba(255,255,255,0.2)'}`, background: form.agreeTerms ? '#3B82F6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0, marginTop: '1px' }}>
                    {form.agreeTerms && <Check size={12} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.42)', lineHeight: '1.6' }}>
                    I agree to the <span style={{ color: '#3B82F6', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Terms of Service</span> and <span style={{ color: '#3B82F6', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Privacy Policy</span>
                  </span>
                </div>
                {errors.agreeTerms && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#EF4444', marginTop: '4px', marginLeft: '32px' }}>{errors.agreeTerms}</div>}

                <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                  <button onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.55)', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <ChevronLeft size={16} strokeWidth={2} /> Back
                  </button>
                  <button onClick={next} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #1B3A6B, #3B82F6)', border: 'none', borderRadius: '12px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 8px 28px rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {isFree ? <><Check size={15} strokeWidth={2.5} /> Confirm — No Payment</> : <><CreditCard size={15} strokeWidth={2} /> Continue to Payment</>}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <PaymentStep
                level={form.cefrLevel}
                currency={currency}
                onCurrencyChange={setCurrency}
                onSuccess={handlePaymentSuccess}
                onBack={() => setStep(2)}
              />
            )}

          </div>
        </div>
      </div>
    </>
  )
}