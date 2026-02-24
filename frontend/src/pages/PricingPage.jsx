import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check, X, ArrowRight, Shield, Zap, Building2, ChevronDown,
  ChevronUp, Star, Award, BookOpen, Video, ClipboardList, Mic,
  Users, Globe, Download, Clock, Target, TrendingUp, MessageSquare,
  CreditCard, Lock, RefreshCw, HelpCircle, ChevronRight, Sparkles
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id:       'basic',
    name:     'Level Bundle',
    icon:     BookOpen,
    tagline:  'One level at a time',
    monthly:  9,
    annual:   7,
    color:    'slate',
    popular:  false,
    features: [
      { text: 'Access to 1 CEFR level',             ok: true  },
      { text: 'Video lessons for that level',        ok: true  },
      { text: 'Grammar & vocabulary tests',          ok: true  },
      { text: 'Progress tracking',                   ok: true  },
      { text: 'Certificate on completion',           ok: true  },
      { text: 'Mock exam practice',                  ok: false },
      { text: 'AI grammar correction',               ok: false },
      { text: 'Speaking exercises',                  ok: false },
      { text: 'All A1–C2 levels',                   ok: false },
      { text: 'Priority support',                    ok: false },
    ],
  },
  {
    id:       'pro',
    name:     'Full Track',
    icon:     Zap,
    tagline:  'Complete A1 to C2 journey',
    monthly:  29,
    annual:   22,
    color:    'blue',
    popular:  true,
    features: [
      { text: 'All A1–C2 levels unlocked',          ok: true  },
      { text: 'Video lessons for all levels',        ok: true  },
      { text: 'Grammar & vocabulary tests',          ok: true  },
      { text: 'Progress tracking & analytics',       ok: true  },
      { text: 'Certificate on each level',           ok: true  },
      { text: 'Mock exam practice (Goethe/TELC/TestDaF)', ok: true },
      { text: 'AI grammar correction',               ok: true  },
      { text: 'Speaking exercises & recording',      ok: true  },
      { text: 'Placement test included',             ok: true  },
      { text: 'Priority support',                    ok: false },
    ],
  },
  {
    id:       'corporate',
    name:     'Corporate',
    icon:     Building2,
    tagline:  'For teams & organisations',
    monthly:  null,
    annual:   null,
    color:    'slate',
    popular:  false,
    features: [
      { text: 'Everything in Full Track',            ok: true  },
      { text: 'Up to 50 seats (custom above)',       ok: true  },
      { text: 'Admin dashboard & reporting',         ok: true  },
      { text: 'Bulk progress exports',               ok: true  },
      { text: 'Custom invoice & payment terms',      ok: true  },
      { text: 'Dedicated account manager',           ok: true  },
      { text: 'Custom onboarding session',           ok: true  },
      { text: 'SLA & uptime guarantee',              ok: true  },
      { text: 'White-label option',                  ok: true  },
      { text: '24/7 priority support',               ok: true  },
    ],
  },
]

const FAQS = [
  {
    q: 'Can I switch plans later?',
    a: 'Yes — you can upgrade or downgrade at any time. When upgrading, you are charged the prorated difference. When downgrading, the change takes effect at the end of your billing cycle.',
  },
  {
    q: 'Is there a free trial?',
    a: 'We offer a free Placement Test and access to the first lesson of each level so you can experience the platform before committing. No credit card required.',
  },
  {
    q: 'What exams does the Full Track prepare me for?',
    a: 'The Full Track covers Goethe-Zertifikat (A1–C2), TELC Deutsch (A1–C1), and TestDaF. Each level includes specific mock exams aligned to those certifications.',
  },
  {
    q: 'What happens when my subscription ends?',
    a: 'Your account and all earned certificates remain accessible. You will lose access to video lessons and tests, but you can resubscribe at any time and your progress will be exactly where you left off.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'We offer a 7-day money-back guarantee on all plans, no questions asked. After 7 days, subscriptions are non-refundable but you may cancel anytime to stop future billing.',
  },
  {
    q: 'Can my employer pay for my subscription?',
    a: 'Yes. The Corporate plan supports custom invoicing. For individual learners, you can request a PDF invoice from your billing settings to submit for reimbursement.',
  },
]

const TESTIMONIALS = [
  { name: 'Priya Nair',      role: 'Software Engineer · Relocated to Munich',  level: 'B2', text: 'I passed my Goethe B2 on the first attempt. The mock exams were almost identical to the real thing.',      rating: 5 },
  { name: 'Kwame Asante',    role: 'Nurse · Applying for German recognition',   level: 'B1', text: 'The relocation track understood exactly what I needed. Grammar explanations are clearer than any textbook.', rating: 5 },
  { name: 'Maria Schmidt',   role: 'Civil Engineer · Berlin',                   level: 'C1', text: 'Went from A2 to C1 in 11 months while working full-time. The daily reminders kept me consistent.',         rating: 5 },
]

const LEVEL_COLORS = {
  A1: 'bg-slate-100 text-slate-600',
  A2: 'bg-blue-100 text-blue-700',
  B1: 'bg-green-100 text-green-700',
  B2: 'bg-amber-100 text-amber-700',
  C1: 'bg-purple-100 text-purple-700',
  C2: 'bg-red-100 text-red-700',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlanCard({ plan, billing, current }) {
  const price     = billing === 'monthly' ? plan.monthly : plan.annual
  const savings   = plan.monthly && plan.annual ? Math.round((1 - plan.annual / plan.monthly) * 100) : 0
  const isCurrent = current === plan.id
  const isBlue    = plan.color === 'blue'

  return (
    <div className={`relative rounded-3xl overflow-hidden transition-all duration-200 flex flex-col
      ${plan.popular
        ? 'bg-[#0F1B35] shadow-2xl shadow-blue-900/30 scale-105 border-2 border-blue-500/40'
        : 'bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5'
      }`}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute top-0 left-0 right-0 bg-blue-500 py-1.5 text-center">
          <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles size={11} />
            Most Popular
            <Sparkles size={11} />
          </span>
        </div>
      )}

      <div className={`p-7 flex flex-col flex-1 ${plan.popular ? 'pt-10' : ''}`}>

        {/* Plan header */}
        <div className="mb-6">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4
            ${plan.popular ? 'bg-blue-500/20' : 'bg-slate-100'}`}
          >
            <plan.icon size={20} className={plan.popular ? 'text-blue-400' : 'text-slate-500'} />
          </div>

          <h3 className={`text-xl font-bold mb-1 ${plan.popular ? 'text-white' : 'text-slate-800'}`}>
            {plan.name}
          </h3>
          <p className={`text-sm ${plan.popular ? 'text-blue-300' : 'text-slate-400'}`}>
            {plan.tagline}
          </p>
        </div>

        {/* Pricing */}
        <div className="mb-6">
          {price !== null ? (
            <>
              <div className="flex items-end gap-1.5">
                <span className={`text-4xl font-black ${plan.popular ? 'text-white' : 'text-slate-800'}`}>
                  ${price}
                </span>
                <span className={`text-sm mb-1.5 ${plan.popular ? 'text-blue-300' : 'text-slate-400'}`}>
                  / month
                </span>
              </div>
              {billing === 'annual' && savings > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs line-through ${plan.popular ? 'text-blue-400' : 'text-slate-400'}`}>
                    ${plan.monthly}/mo
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                    Save {savings}%
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-end gap-1.5">
              <span className={`text-3xl font-black ${plan.popular ? 'text-white' : 'text-slate-800'}`}>
                Custom
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        {isCurrent ? (
          <div className="w-full py-3.5 rounded-2xl border-2 border-green-400 bg-green-50 text-green-700 text-sm font-bold text-center mb-6 flex items-center justify-center gap-2">
            <Check size={16} />
            Current Plan
          </div>
        ) : plan.id === 'corporate' ? (
          <button className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition-colors mb-6 flex items-center justify-center gap-2">
            <MessageSquare size={15} />
            Contact Sales
          </button>
        ) : (
          <button className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all mb-6 flex items-center justify-center gap-2
            ${plan.popular
              ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            {plan.id === 'basic' ? 'Choose Level' : 'Get Started'}
            <ArrowRight size={15} />
          </button>
        )}

        {/* Divider */}
        <div className={`border-t mb-5 ${plan.popular ? 'border-white/10' : 'border-slate-100'}`} />

        {/* Features */}
        <ul className="space-y-3 flex-1">
          {plan.features.map(({ text, ok }, i) => (
            <li key={i} className={`flex items-start gap-3 text-sm ${
              ok
                ? plan.popular ? 'text-slate-200' : 'text-slate-700'
                : plan.popular ? 'text-slate-600' : 'text-slate-400'
            }`}>
              <span className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center
                ${ok
                  ? plan.popular ? 'bg-blue-500/30 text-blue-300' : 'bg-green-100 text-green-600'
                  : plan.popular ? 'bg-white/5 text-slate-600'    : 'bg-slate-100 text-slate-300'
                }`}
              >
                {ok ? <Check size={10} /> : <X size={10} />}
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${open ? 'border-blue-200 shadow-sm' : 'border-slate-100'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        <span className="text-slate-800 text-sm font-semibold pr-4">{q}</span>
        {open
          ? <ChevronUp size={16} className="text-blue-500 shrink-0" />
          : <ChevronDown size={16} className="text-slate-400 shrink-0" />
        }
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [billing, setBilling] = useState('annual')
  const [current] = useState('pro') // mock current plan

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-sm">DE</span>
          </div>
          <span className="text-slate-800 font-bold text-lg tracking-tight">DeutschPro</span>
        </div>
        <div className="flex items-center gap-6">
          {['Courses', 'Exams', 'For Teams', 'Pricing'].map(item => (
            <a key={item} href="#" className={`text-sm font-medium transition-colors ${item === 'Pricing' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-slate-600 text-sm font-medium hover:text-slate-800 transition-colors">
            Sign in
          </Link>
          <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            Start Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-[#0F1B35] py-20 px-6 text-center relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-500/25 text-blue-300 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Shield size={12} />
            7-day money-back guarantee · No credit card to start
          </div>

          <h1 className="text-white text-5xl font-black leading-tight mb-4">
            Invest in Your<br />
            <span className="text-blue-400">German Future</span>
          </h1>
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">
            From A1 to fluency — structured plans for professionals relocating to Germany.
            Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-white/10 rounded-2xl p-1.5 gap-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${billing === 'monthly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2
                ${billing === 'annual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Annual
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                Save 25%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Plans ── */}
      <section className="max-w-5xl mx-auto px-6 -mt-8 pb-16">
        <div className="grid grid-cols-3 gap-5 items-start">
          {PLANS.map(plan => (
            <PlanCard key={plan.id} plan={plan} billing={billing} current={current} />
          ))}
        </div>

        {/* Trust row */}
        <div className="mt-10 flex items-center justify-center gap-8 flex-wrap">
          {[
            { icon: Lock,       label: 'SSL encrypted payments'         },
            { icon: RefreshCw,  label: '7-day money-back guarantee'     },
            { icon: Shield,     label: 'Cancel anytime, no penalties'   },
            { icon: CreditCard, label: 'Visa, Mastercard, PayPal'       },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-slate-400 text-xs">
              <Icon size={13} className="text-slate-300" />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature comparison table ── */}
      <section className="bg-white border-y border-slate-100 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-slate-800 text-3xl font-black text-center mb-2">Compare Plans</h2>
          <p className="text-slate-400 text-center text-sm mb-10">Every feature, side by side</p>

          <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-100">
              <div className="px-5 py-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Feature</div>
              {PLANS.map(p => (
                <div key={p.id} className={`px-5 py-4 text-center ${p.popular ? 'bg-blue-600' : ''}`}>
                  <p className={`text-sm font-bold ${p.popular ? 'text-white' : 'text-slate-800'}`}>{p.name}</p>
                  <p className={`text-xs mt-0.5 ${p.popular ? 'text-blue-200' : 'text-slate-400'}`}>
                    {p.monthly ? `$${billing === 'monthly' ? p.monthly : p.annual}/mo` : 'Custom'}
                  </p>
                </div>
              ))}
            </div>

            {/* Table rows */}
            {[
              { label: 'CEFR Levels',               basic: '1 level',   pro: 'All A1–C2', corp: 'All A1–C2' },
              { label: 'Video Lessons',              basic: true,        pro: true,         corp: true         },
              { label: 'Grammar & Vocab Tests',      basic: true,        pro: true,         corp: true         },
              { label: 'Progress Tracking',          basic: true,        pro: true,         corp: true         },
              { label: 'Certificates',               basic: true,        pro: true,         corp: true         },
              { label: 'Mock Exams',                 basic: false,       pro: true,         corp: true         },
              { label: 'AI Grammar Correction',      basic: false,       pro: true,         corp: true         },
              { label: 'Speaking Exercises',         basic: false,       pro: true,         corp: true         },
              { label: 'Placement Test',             basic: false,       pro: true,         corp: true         },
              { label: 'Team Admin Dashboard',       basic: false,       pro: false,        corp: true         },
              { label: 'Bulk Reporting & Export',    basic: false,       pro: false,        corp: true         },
              { label: 'Custom Invoice & Payment',   basic: false,       pro: false,        corp: true         },
              { label: 'Dedicated Account Manager',  basic: false,       pro: false,        corp: true         },
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-4 border-b border-slate-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                <div className="px-5 py-3.5 text-slate-700 text-sm">{row.label}</div>
                {[row.basic, row.pro, row.corp].map((val, j) => (
                  <div key={j} className={`px-5 py-3.5 text-center ${j === 1 ? 'bg-blue-600/5' : ''}`}>
                    {typeof val === 'boolean' ? (
                      val
                        ? <Check size={16} className="text-green-500 mx-auto" />
                        : <X size={16} className="text-slate-200 mx-auto" />
                    ) : (
                      <span className="text-slate-700 text-sm font-semibold">{val}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-[#0F1B35] py-14 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-6 text-center">
          {[
            { value: '4,800+', label: 'Professionals enrolled',     icon: Users       },
            { value: '82%',    label: 'First-attempt exam pass rate', icon: Target     },
            { value: 'A1–C2',  label: 'Full CEFR coverage',          icon: BookOpen   },
            { value: '6',      label: 'Exam formats supported',       icon: ClipboardList },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label}>
              <div className="w-10 h-10 bg-blue-500/15 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon size={18} className="text-blue-400" />
              </div>
              <p className="text-white text-3xl font-black mb-1">{value}</p>
              <p className="text-slate-400 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-slate-800 text-3xl font-black text-center mb-2">What Our Students Say</h2>
          <p className="text-slate-400 text-center text-sm mb-10">Real professionals. Real results.</p>

          <div className="grid grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, si) => (
                    <Star key={si} size={13} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>

                <p className="text-slate-700 text-sm leading-relaxed mb-5">"{t.text}"</p>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-slate-800 text-sm font-semibold">{t.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{t.role}</p>
                  </div>
                  <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${LEVEL_COLORS[t.level]}`}>
                    {t.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-6 bg-white border-t border-slate-100">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-slate-800 text-3xl font-black mb-2">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm">Can't find your answer? <a href="#" className="text-blue-600 hover:underline">Chat with us</a></p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-[#0F1B35] py-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-xl mx-auto">
          <div className="w-14 h-14 bg-blue-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Award size={28} className="text-blue-400" />
          </div>
          <h2 className="text-white text-4xl font-black mb-4 leading-tight">
            Start Your German<br />Journey Today
          </h2>
          <p className="text-slate-400 text-base mb-8 leading-relaxed">
            Take the free placement test — no credit card required.<br />
            See exactly where you stand in 15 minutes.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/placement-test"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 py-3.5 rounded-2xl transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/40"
            >
              Take Free Placement Test
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/register"
              className="border border-white/20 text-white font-semibold px-6 py-3.5 rounded-2xl hover:bg-white/10 transition-colors text-sm"
            >
              View All Plans
            </Link>
          </div>
          <p className="text-slate-500 text-xs mt-6">
            7-day money-back guarantee · Cancel anytime · No hidden fees
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#080f1e] py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">DE</span>
            </div>
            <span className="text-slate-400 text-sm">DeutschPro © 2026</span>
          </div>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Contact'].map(l => (
              <a key={l} href="#" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}