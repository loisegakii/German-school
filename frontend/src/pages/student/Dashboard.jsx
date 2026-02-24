import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, PlayCircle, ClipboardList, Award,
  BarChart2, Settings, LogOut, Bell, ChevronRight, TrendingUp,
  AlertTriangle, Clock, CheckCircle, Mic, Target, Calendar,
  Download, Menu, Flame, ArrowRight, BookMarked, Headphones,
  Activity, Search, X, Users, GraduationCap, Star, Plus, Video,
  RotateCcw, ThumbsUp, ThumbsDown, ChevronLeft, Zap, Trophy
} from 'lucide-react'
import { studentAPI, courseAPI } from '../../services/api'
import API from '../../services/api'
import { clearTokens } from '../../services/auth'
import { useAuthStore } from '../../store/authStore'

const goetheAPI = {
  exams:         ()     => API.get('/goethe/exams/'),
  myRequests:    ()     => API.get('/goethe/requests/'),
  createRequest: (data) => API.post('/goethe/requests/', data),
}

const lessonRequestAPI = {
  create: (data) => API.post('/student/lesson-requests/', data),
}

function fmtDate(d) {
  if (!d) return '\u2014'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtKES(n) {
  return n ? `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}` : '\u2014'
}

const LEVEL_COLORS = {
  A1: '#64748B', A2: '#3B82F6', B1: '#10B981', B2: '#F59E0B', C1: '#8B5CF6', C2: '#EF4444'
}
const EXAM_LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const LESSON_TOPICS = [
  'Grammar \u2014 Noun Cases (Nominativ, Akkusativ, Dativ)',
  'Grammar \u2014 Verb Conjugation & Tenses',
  'Grammar \u2014 Word Order & Sentence Structure',
  'Grammar \u2014 Konjunktiv II & Subjunctive',
  'Grammar \u2014 Modal Verbs',
  'Vocabulary \u2014 Thematic Expansion',
  'Speaking \u2014 Conversational Practice',
  'Speaking \u2014 Pronunciation & Intonation',
  'Writing \u2014 Essay & Report Structure',
  'Listening \u2014 Comprehension Practice',
  'Exam Preparation \u2014 Goethe Zertifikat',
  'Exam Preparation \u2014 TestDaF / DSH',
  'Reading \u2014 Text Analysis',
  'Other / Custom topic',
]
const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
]

const VOCAB_DECKS = {
  A1: [
    { de: 'Hallo',      en: 'Hello',        example: 'Hallo! Wie geht es dir?' },
    { de: 'Danke',      en: 'Thank you',     example: 'Danke sch\u00f6n!' },
    { de: 'Bitte',      en: 'Please / You\'re welcome', example: 'Bitte gib mir das Buch.' },
    { de: 'Das Haus',   en: 'The house',     example: 'Das Haus ist gro\u00df.' },
    { de: 'Der Hund',   en: 'The dog',       example: 'Der Hund ist schwarz.' },
    { de: 'Die Katze',  en: 'The cat',       example: 'Meine Katze schl\u00e4ft gern.' },
    { de: 'Essen',      en: 'To eat / food', example: 'Ich esse gern Brot.' },
    { de: 'Trinken',    en: 'To drink',      example: 'Sie trinkt Wasser.' },
    { de: 'Schlafen',   en: 'To sleep',      example: 'Er schl\u00e4ft um 10 Uhr.' },
    { de: 'Die Schule', en: 'The school',    example: 'Die Schule beginnt um 8 Uhr.' },
  ],
  A2: [
    { de: 'Kaufen',       en: 'To buy',             example: 'Ich kaufe ein neues Buch.' },
    { de: 'Verkaufen',    en: 'To sell',             example: 'Er verkauft sein Auto.' },
    { de: 'Wohnen',       en: 'To live / reside',    example: 'Wo wohnst du?' },
    { de: 'Die Wohnung',  en: 'The apartment',       example: 'Meine Wohnung ist gem\u00fctlich.' },
    { de: 'Fahren',       en: 'To drive / travel',   example: 'Wir fahren morgen nach Berlin.' },
    { de: 'Der Bahnhof',  en: 'The train station',   example: 'Der Bahnhof ist in der Stadtmitte.' },
    { de: 'Arbeiten',     en: 'To work',             example: 'Sie arbeitet in einem Krankenhaus.' },
    { de: 'Das B\u00fcro',en: 'The office',           example: 'Das B\u00fcro ist im zweiten Stock.' },
    { de: 'Verstehen',    en: 'To understand',       example: 'Ich verstehe das nicht.' },
    { de: 'Erkl\u00e4ren',en: 'To explain',          example: 'Kannst du das erkl\u00e4ren?' },
  ],
  B1: [
    { de: 'Vorschlagen',   en: 'To suggest',          example: 'Ich schlage vor, morgen zu treffen.' },
    { de: 'Entscheiden',   en: 'To decide',           example: 'Wir m\u00fcssen uns bald entscheiden.' },
    { de: 'Unterscheiden', en: 'To distinguish',      example: 'Man muss zwischen beiden unterscheiden.' },
    { de: 'Die Meinung',   en: 'The opinion',         example: 'Was ist deine Meinung dazu?' },
    { de: 'Begr\u00fcnden',en: 'To justify',          example: 'Bitte begr\u00fcnde deine Antwort.' },
    { de: 'Behaupten',     en: 'To claim',            example: 'Er behauptet, die Wahrheit zu sagen.' },
    { de: 'Der Nachteil',  en: 'The disadvantage',    example: 'Ein Nachteil ist der Preis.' },
    { de: 'Der Vorteil',   en: 'The advantage',       example: 'Ein Vorteil ist die schnelle Lieferung.' },
    { de: 'Obwohl',        en: 'Although',            example: 'Obwohl es regnet, gehe ich spazieren.' },
    { de: 'Deshalb',       en: 'Therefore',           example: 'Es regnet, deshalb bleibe ich zu Hause.' },
  ],
  B2: [
    { de: 'Analysieren',    en: 'To analyse',         example: 'Der Forscher analysiert die Daten.' },
    { de: 'Widersprechen',  en: 'To contradict',      example: 'Ich muss dir widersprechen.' },
    { de: 'Aufgrund',       en: 'Due to',             example: 'Aufgrund des Wetters blieb er zu Hause.' },
    { de: 'Infolgedessen',  en: 'As a result',        example: 'Infolgedessen mussten wir umplanen.' },
    { de: 'Dennoch',        en: 'Nevertheless',       example: 'Dennoch wollte er versuchen.' },
    { de: 'Hinweisen',      en: 'To point out',       example: 'Ich m\u00f6chte darauf hinweisen, dass...' },
    { de: 'Er\u00f6rtern',  en: 'To discuss',         example: 'Wir er\u00f6rtern das Problem gemeinsam.' },
    { de: 'Voraussetzen',   en: 'To presuppose',      example: 'Das setzt gute Kenntnisse voraus.' },
    { de: 'Ber\u00fccksichtigen', en: 'To consider',  example: 'Wir m\u00fcssen alle Faktoren ber\u00fccksichtigen.' },
    { de: 'Abw\u00e4gen',   en: 'To weigh up',        example: 'Man muss die Konsequenzen abw\u00e4gen.' },
  ],
  C1: [
    { de: 'Manifestieren',    en: 'To manifest',      example: 'Das Problem manifestiert sich t\u00e4glich.' },
    { de: 'Hervorrufen',      en: 'To evoke / cause', example: 'Das ruft Erinnerungen hervor.' },
    { de: 'Gew\u00e4hrleisten', en: 'To guarantee',   example: 'Das Gesetz gew\u00e4hrleistet die Rechte.' },
    { de: 'Einwenden',        en: 'To object',        example: 'Ich habe nichts einzuwenden.' },
    { de: 'Einschr\u00e4nken', en: 'To restrict',     example: 'Die Ma\u00dfnahmen schr\u00e4nken die Freiheit ein.' },
    { de: 'Veranschaulichen', en: 'To illustrate',    example: 'Das Beispiel veranschaulicht den Punkt.' },
    { de: 'Aufrechterhalten', en: 'To uphold',        example: 'Sie wollen den Frieden aufrechterhalten.' },
    { de: 'Zugrunde liegen',  en: 'To underlie',      example: 'Was liegt dieser Entscheidung zugrunde?' },
    { de: 'Verf\u00fcgen \u00fcber', en: 'To have at disposal', example: 'Sie verf\u00fcgt \u00fcber gro\u00dfe Erfahrung.' },
    { de: 'Abw\u00e4gen',     en: 'To weigh carefully', example: 'Man muss die Argumente sorgf\u00e4ltig abw\u00e4gen.' },
  ],
}

// ── Shared UI
const Ring = ({ pct, size = 80, stroke = 7, color = '#3B82F6', children }) => {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color}88)` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
    </div>
  )
}
const ProgressBar = ({ pct, color = '#3B82F6', height = 6 }) => (
  <div style={{ width: '100%', height, background: 'rgba(255,255,255,0.07)', borderRadius: height }}>
    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: height, boxShadow: `0 0 8px ${color}55`, transition: 'width 0.8s ease' }} />
  </div>
)
const Card = ({ children, style = {} }) => (
  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '24px', ...style }}>{children}</div>
)
const SectionLabel = ({ children }) => (
  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '16px' }}>{children}</div>
)

// ── Personal Lesson Request Modal
function PersonalLessonModal({ onClose, student }) {
  const [step, setStep] = useState(1)
  const [topic, setTopic] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(60)
  const [altDate, setAltDate] = useState('')
  const [altTime, setAltTime] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const finalTopic = topic === 'Other / Custom topic' ? customTopic : topic
  const canProceed = finalTopic.trim() && date && time

  const handleSubmit = async () => {
    setSubmitting(true); setError('')
    try {
      await lessonRequestAPI.create({ topic: finalTopic, preferred_date: date, preferred_time: time, alt_date: altDate || null, alt_time: altTime || null, duration_minutes: duration, student_message: message })
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit — please try again.')
    } finally { setSubmitting(false) }
  }

  const fmtD = (d) => d ? new Date(d + 'T12:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(14px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#080D1A', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '28px', width: '100%', maxWidth: '560px', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.7)' }}>
        <div style={{ background: 'linear-gradient(135deg, #0c1a35 0%, #162d5e 60%, #0c1e40 100%)', padding: '28px 30px 22px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', filter: 'blur(50px)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Video size={17} color="#60a5fa" strokeWidth={2} />
                </div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Zoom Session</span>
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: '#fff', lineHeight: 1.2 }}>Request a Personal Lesson</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>Your instructor will confirm within 24 hours</div>
            </div>
            <button onClick={onClose} style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
              <X size={16} strokeWidth={2} />
            </button>
          </div>
          {step < 3 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', position: 'relative' }}>
              {[{ n: 1, label: 'Details' }, { n: 2, label: 'Confirm' }].map((s, i) => (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {i > 0 && <div style={{ width: '32px', height: '1px', background: step > 1 ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)' }} />}
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', transition: 'all 0.3s',
                    background: step >= s.n ? '#3B82F6' : 'rgba(255,255,255,0.07)', color: step >= s.n ? '#fff' : 'rgba(255,255,255,0.3)', border: step >= s.n ? 'none' : '1px solid rgba(255,255,255,0.12)' }}>
                    {step > s.n ? '\u2713' : s.n}
                  </div>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: step >= s.n ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)', fontWeight: step === s.n ? '700' : '400' }}>{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '24px 30px 28px', maxHeight: '65vh', overflowY: 'auto' }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '12px' }}>Topic <span style={{ color: '#EF4444' }}>*</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                  {LESSON_TOPICS.map(t => (
                    <button key={t} onClick={() => setTopic(t)}
                      style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: topic === t ? '700' : '500', textAlign: 'left', lineHeight: 1.4, transition: 'all 0.15s',
                        background: topic === t ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)', borderColor: topic === t ? 'rgba(59,130,246,0.55)' : 'rgba(255,255,255,0.07)', color: topic === t ? '#93c5fd' : 'rgba(255,255,255,0.5)' }}>
                      {t}
                    </button>
                  ))}
                </div>
                {topic === 'Other / Custom topic' && (
                  <input value={customTopic} onChange={e => setCustomTopic(e.target.value)} placeholder="Describe your topic..."
                    style={{ marginTop: '10px', width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                )}
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '12px' }}>Session Duration</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {DURATIONS.map(d => (
                    <button key={d.value} onClick={() => setDuration(d.value)}
                      style={{ flex: 1, padding: '11px 8px', borderRadius: '10px', border: '1px solid', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: duration === d.value ? '700' : '500', transition: 'all 0.15s',
                        background: duration === d.value ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', borderColor: duration === d.value ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.07)', color: duration === d.value ? '#34d399' : 'rgba(255,255,255,0.4)' }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '12px' }}>Preferred Date & Time <span style={{ color: '#EF4444' }}>*</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', color: date ? '#fff' : 'rgba(255,255,255,0.25)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', outline: 'none', colorScheme: 'dark', width: '100%', boxSizing: 'border-box' }} />
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', color: time ? '#fff' : 'rgba(255,255,255,0.25)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', outline: 'none', colorScheme: 'dark', width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '12px' }}>Alternative Date & Time <span style={{ fontWeight: '400', textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.2)' }}>(optional)</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="date" min={today} value={altDate} onChange={e => setAltDate(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '11px 14px', color: altDate ? '#fff' : 'rgba(255,255,255,0.2)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', outline: 'none', colorScheme: 'dark', width: '100%', boxSizing: 'border-box' }} />
                  <input type="time" value={altTime} onChange={e => setAltTime(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '11px 14px', color: altTime ? '#fff' : 'rgba(255,255,255,0.2)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', outline: 'none', colorScheme: 'dark', width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '12px' }}>Message to Instructor <span style={{ fontWeight: '400', textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.2)' }}>(optional)</span></div>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="e.g. I'm struggling with Konjunktiv II before my B2 exam..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
              </div>
              <button onClick={() => canProceed && setStep(2)} disabled={!canProceed}
                style={{ width: '100%', padding: '14px', borderRadius: '13px', border: 'none', cursor: canProceed ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700',
                  background: canProceed ? 'linear-gradient(135deg, #1B3A6B, #3B82F6)' : 'rgba(255,255,255,0.05)', color: canProceed ? '#fff' : 'rgba(255,255,255,0.25)', boxShadow: canProceed ? '0 8px 24px rgba(59,130,246,0.25)' : 'none' }}>
                Review Request \u2192
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', overflow: 'hidden' }}>
                {[['Topic', finalTopic], ['Duration', `${duration} minutes via Zoom`], ['Preferred Date', fmtD(date)], ['Preferred Time', time || '\u2014'], ['Alternative Date', altDate ? fmtD(altDate) : 'None provided'], ['Alternative Time', altTime || '\u2014']].map(([label, val], i, arr) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '13px 18px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', gap: '16px' }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600', color: '#fff', textAlign: 'right' }}>{val}</span>
                  </div>
                ))}
                {message && (
                  <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>Your message</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontStyle: 'italic' }}>"{message}"</div>
                  </div>
                )}
              </div>
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '12px', padding: '13px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(147,197,253,0.8)', lineHeight: 1.7 }}>
                \u2139\ufe0f Your instructor will send a Zoom link to your email once confirmed within 24 hours.
              </div>
              {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '11px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#f87171' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.6)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', padding: '13px', cursor: 'pointer' }}>\u2190 Back</button>
                <button onClick={handleSubmit} disabled={submitting}
                  style={{ flex: 2, background: submitting ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #1B3A6B, #3B82F6)', border: 'none', borderRadius: '12px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', padding: '13px', cursor: submitting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {submitting ? (<><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Submitting...</>) : (<><Video size={15} strokeWidth={2} />Send Request</>)}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle size={34} color="#10B981" strokeWidth={2} />
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>Request Sent!</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '24px' }}>
                Your instructor will confirm your Zoom session within <strong style={{ color: 'rgba(255,255,255,0.8)' }}>24 hours</strong>. Check your email for the link.
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>Topic</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '12px' }}>{finalTopic}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>Requested for</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#60a5fa' }}>{fmtD(date)} at {time}</div>
              </div>
              <button onClick={onClose} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #1B3A6B, #3B82F6)', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Vocabulary Trainer Tab
function VocabularyTab({ student }) {
  const studentLevel = student?.level || 'A1'
  const defaultDeck = Object.keys(VOCAB_DECKS).includes(studentLevel) ? studentLevel : 'A1'
  const [selectedLevel, setSelectedLevel] = useState(defaultDeck)
  const [mode, setMode] = useState('browse')
  const [cards, setCards] = useState([])
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(new Set())
  const [unknown, setUnknown] = useState(new Set())
  const [quizAnswer, setQuizAnswer] = useState(null)
  const [quizOptions, setQuizOptions] = useState([])
  const [sessionDone, setSessionDone] = useState(false)

  const initDeck = useCallback((level) => {
    const raw = [...(VOCAB_DECKS[level] || [])]
    for (let i = raw.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [raw[i], raw[j]] = [raw[j], raw[i]]
    }
    setCards(raw); setCardIndex(0); setFlipped(false)
    setKnown(new Set()); setUnknown(new Set()); setSessionDone(false); setQuizAnswer(null)
  }, [])

  useEffect(() => { initDeck(selectedLevel) }, [selectedLevel, initDeck])

  const currentCard = cards[cardIndex]

  const buildQuizOptions = useCallback((card) => {
    const all = VOCAB_DECKS[selectedLevel] || []
    const wrong = all.filter(c => c.de !== card.de).sort(() => Math.random() - 0.5).slice(0, 3)
    setQuizOptions([...wrong.map(c => c.en), card.en].sort(() => Math.random() - 0.5))
    setQuizAnswer(null)
  }, [selectedLevel])

  useEffect(() => { if (mode === 'quiz' && currentCard) buildQuizOptions(currentCard) }, [cardIndex, mode, currentCard, buildQuizOptions])

  const advance = () => { if (cardIndex < cards.length - 1) { setCardIndex(i => i + 1); setFlipped(false); setQuizAnswer(null) } else { setSessionDone(true) } }
  const handleKnown   = () => { setKnown(p => new Set([...p, cardIndex])); advance() }
  const handleUnknown = () => { setUnknown(p => new Set([...p, cardIndex])); advance() }
  const knownPct = cards.length ? Math.round((known.size / cards.length) * 100) : 0
  const deckLevels = Object.keys(VOCAB_DECKS)

  if (mode === 'browse') {
    const deck = VOCAB_DECKS[selectedLevel] || []
    return (
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: '#fff' }}>Vocabulary Trainer</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{deck.length} words · {selectedLevel} level</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setMode('flashcard'); initDeck(selectedLevel) }}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '11px', border: 'none', background: 'linear-gradient(135deg, #1B3A6B, #3B82F6)', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              <Zap size={13} strokeWidth={2.5} /> Flashcard Mode
            </button>
            <button onClick={() => { setMode('quiz'); initDeck(selectedLevel) }}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '11px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              <Trophy size={13} strokeWidth={2.5} /> Quiz Mode
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {deckLevels.map(l => {
            const lc = LEVEL_COLORS[l] || '#3B82F6'
            return (
              <button key={l} onClick={() => setSelectedLevel(l)}
                style={{ padding: '7px 18px', borderRadius: '10px', border: '1px solid', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                  background: selectedLevel === l ? lc + '22' : 'rgba(255,255,255,0.03)', borderColor: selectedLevel === l ? lc + '66' : 'rgba(255,255,255,0.08)', color: selectedLevel === l ? lc : 'rgba(255,255,255,0.4)' }}>
                {l}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {deck.map((word, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px 18px', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: '#fff' }}>{word.de}</div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '700', color: LEVEL_COLORS[selectedLevel], background: LEVEL_COLORS[selectedLevel] + '18', border: '1px solid ' + LEVEL_COLORS[selectedLevel] + '33', borderRadius: '5px', padding: '2px 7px', flexShrink: 0, marginLeft: '8px' }}>{selectedLevel}</span>
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', color: '#60a5fa', marginBottom: '8px' }}>{word.en}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, fontStyle: 'italic' }}>"{word.example}"</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (sessionDone) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ textAlign: 'center', maxWidth: '420px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>&#127881;</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>Session Complete!</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '28px' }}>You went through all {cards.length} {selectedLevel} words.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '14px', padding: '18px' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '800', color: '#10B981', marginBottom: '4px' }}>{known.size}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>I knew these</div>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '14px', padding: '18px' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '800', color: '#EF4444', marginBottom: '4px' }}>{unknown.size}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Still learning</div>
            </div>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <ProgressBar pct={knownPct} color="#10B981" height={8} />
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>{knownPct}% mastery this session</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={() => initDeck(selectedLevel)}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '11px 22px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #1B3A6B, #3B82F6)', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              <RotateCcw size={14} strokeWidth={2.5} /> Try Again
            </button>
            <button onClick={() => setMode('browse')}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '11px 22px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Browse Words
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'flashcard' && currentCard) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <button onClick={() => setMode('browse')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '13px' }}>
            <ChevronLeft size={16} strokeWidth={2} /> Back
          </button>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{cardIndex + 1} / {cards.length}</div>
          <div style={{ display: 'flex', gap: '12px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px' }}>
            <span style={{ color: '#10B981' }}>&#10003; {known.size}</span>
            <span style={{ color: '#EF4444' }}>&#10007; {unknown.size}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '32px' }}>
          {cards.map((_, i) => (
            <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', transition: 'background 0.3s',
              background: known.has(i) ? '#10B981' : unknown.has(i) ? '#EF4444' : i === cardIndex ? '#3B82F6' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
        <div onClick={() => setFlipped(f => !f)}
          style={{ cursor: 'pointer', minHeight: '260px', background: flipped ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)', border: '1px solid ' + (flipped ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'), borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', textAlign: 'center', transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)', userSelect: 'none', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: flipped ? 'linear-gradient(90deg,#3B82F6,#8B5CF6)' : 'transparent', borderRadius: '24px 24px 0 0' }} />
          {!flipped ? (
            <>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '20px' }}>Deutsch</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '42px', fontWeight: '800', color: '#fff', marginBottom: '16px', lineHeight: 1.1 }}>{currentCard.de}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>Tap to reveal</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(99,179,237,0.6)', textTransform: 'uppercase', marginBottom: '12px' }}>English</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '700', color: '#60a5fa', marginBottom: '16px' }}>{currentCard.en}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, fontStyle: 'italic', maxWidth: '360px' }}>"{currentCard.example}"</div>
            </>
          )}
        </div>
        {flipped && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button onClick={handleUnknown}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
              <ThumbsDown size={17} strokeWidth={2} /> Still learning
            </button>
            <button onClick={handleKnown}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', color: '#34d399', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.08)'}>
              <ThumbsUp size={17} strokeWidth={2} /> I know this!
            </button>
          </div>
        )}
        {!flipped && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button onClick={advance} style={{ padding: '10px 28px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Skip</button>
          </div>
        )}
      </div>
    )
  }

  if (mode === 'quiz' && currentCard) {
    const isAnswered = quizAnswer !== null
    return (
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <button onClick={() => setMode('browse')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '13px' }}>
            <ChevronLeft size={16} strokeWidth={2} /> Back
          </button>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Question {cardIndex + 1} / {cards.length}</div>
          <div style={{ display: 'flex', gap: '12px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px' }}>
            <span style={{ color: '#10B981' }}>&#10003; {known.size}</span>
            <span style={{ color: '#EF4444' }}>&#10007; {unknown.size}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '32px' }}>
          {cards.map((_, i) => (
            <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', transition: 'background 0.3s',
              background: known.has(i) ? '#10B981' : unknown.has(i) ? '#EF4444' : i === cardIndex ? '#F59E0B' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '20px', padding: '36px 40px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(245,158,11,0.6)', textTransform: 'uppercase', marginBottom: '14px' }}>What does this mean?</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '44px', fontWeight: '800', color: '#fff' }}>{currentCard.de}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {quizOptions.map((opt, i) => {
            const isCorrect = opt === currentCard.en
            let bg = 'rgba(255,255,255,0.03)', bdr = 'rgba(255,255,255,0.08)', clr = 'rgba(255,255,255,0.7)'
            if (isAnswered) {
              if (isCorrect)               { bg = 'rgba(16,185,129,0.12)';  bdr = 'rgba(16,185,129,0.4)';  clr = '#34d399' }
              else if (opt === quizAnswer) { bg = 'rgba(239,68,68,0.12)';   bdr = 'rgba(239,68,68,0.4)';   clr = '#f87171' }
              else                         { bg = 'rgba(255,255,255,0.01)'; bdr = 'rgba(255,255,255,0.04)'; clr = 'rgba(255,255,255,0.3)' }
            }
            return (
              <button key={i} disabled={isAnswered}
                onClick={() => { setQuizAnswer(opt); if (opt === currentCard.en) setKnown(p => new Set([...p, cardIndex])); else setUnknown(p => new Set([...p, cardIndex])) }}
                style={{ padding: '16px 18px', borderRadius: '14px', border: '1px solid ' + bdr, background: bg, color: clr, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', cursor: isAnswered ? 'default' : 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                {isAnswered && isCorrect && <span style={{ marginRight: '8px' }}>&#10003;</span>}
                {isAnswered && opt === quizAnswer && !isCorrect && <span style={{ marginRight: '8px' }}>&#10007;</span>}
                {opt}
              </button>
            )
          })}
        </div>
        {isAnswered && (
          <div>
            <div style={{ padding: '13px 16px', background: quizAnswer === currentCard.en ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: '1px solid ' + (quizAnswer === currentCard.en ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'), borderRadius: '12px', marginBottom: '16px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: quizAnswer === currentCard.en ? '#34d399' : '#f87171' }}>
              {quizAnswer === currentCard.en ? 'Correct!' : 'Correct answer: "' + currentCard.en + '"'}
              <div style={{ marginTop: '5px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>"{currentCard.example}"</div>
            </div>
            <button onClick={advance} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #1B3A6B, #3B82F6)', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Next</button>
          </div>
        )}
      </div>
    )
  }
  return null
}

// ── Course Discovery Modal
function CourseModal({ onClose, enrolledIds, onEnrolled }) {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevel] = useState('All')
  const [enrolling, setEnrolling] = useState(null)
  const [enrolled, setEnrolled] = useState(new Set(enrolledIds))
  const [toast, setToast] = useState('')

  useEffect(() => {
    courseAPI.list()
      .then(({ data }) => { const r = data?.results ?? data ?? []; setCourses(Array.isArray(r) ? r : []) })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = courses.filter(c => {
    const ms = c.title?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
    return ms && (levelFilter === 'All' || c.level === levelFilter)
  })

  const handleEnroll = async (course) => {
    if (enrolled.has(course.id)) { navigate('/student/lesson/' + course.id + '/first'); onClose(); return }
    setEnrolling(course.id)
    try {
      await courseAPI.enroll(course.id)
      setEnrolled(prev => new Set([...prev, course.id]))
      setToast('Enrolled in ' + course.title + '!')
      onEnrolled?.()
      setTimeout(() => setToast(''), 3000)
    } catch (err) {
      setToast(err.response?.data?.detail || 'Enrollment failed')
      setTimeout(() => setToast(''), 3000)
    } finally { setEnrolling(null) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth: '860px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '28px 32px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>Browse Courses</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{courses.length} courses available</div>
          </div>
          <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div style={{ padding: '20px 32px', display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} color="rgba(255,255,255,0.3)" strokeWidth={2} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 14px 10px 38px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['All','A1','A2','B1','B2','C1','C2'].map(lvl => (
              <button key={lvl} onClick={() => setLevel(lvl)}
                style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                  background: levelFilter === lvl ? (LEVEL_COLORS[lvl] || '#3B82F6') : 'rgba(255,255,255,0.04)',
                  borderColor: levelFilter === lvl ? (LEVEL_COLORS[lvl] || '#3B82F6') : 'rgba(255,255,255,0.08)',
                  color: levelFilter === lvl ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                {lvl}
              </button>
            ))}
          </div>
        </div>
        {toast && (
          <div style={{ margin: '0 32px 16px', padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={14} strokeWidth={2.5} /> {toast}
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 28px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[1,2,3,4].map(i => <div key={i} style={{ height: '140px', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.3)' }}>
              <GraduationCap size={40} strokeWidth={1.2} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px' }}>No courses found</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {filtered.map(course => {
                const isEnrolled = enrolled.has(course.id)
                const levelColor = LEVEL_COLORS[course.level] || '#3B82F6'
                return (
                  <div key={course.id}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid ' + (isEnrolled ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'), borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = isEnrolled ? 'rgba(16,185,129,0.4)' : 'rgba(59,130,246,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = isEnrolled ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', color: levelColor, background: levelColor + '18', border: '1px solid ' + levelColor + '40', borderRadius: '6px', padding: '2px 8px' }}>{course.level}</span>
                        {isEnrolled && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', color: '#10B981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '6px', padding: '2px 8px' }}>Enrolled</span>}
                      </div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: '700', color: '#fff', lineHeight: 1.3, marginBottom: '4px' }}>{course.title}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.description}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '14px' }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={11} strokeWidth={2} /> {course.student_count || 0}</span>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}><BookOpen size={11} strokeWidth={2} /> {course.lesson_count || 0} lessons</span>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#10B981', fontWeight: '700' }}>{course.price == 0 ? 'Free' : '\u20ac' + course.price}</span>
                      </div>
                      <button onClick={() => handleEnroll(course)} disabled={enrolling === course.id}
                        style={{ padding: '7px 16px', borderRadius: '10px', border: 'none', cursor: enrolling === course.id ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700',
                          background: isEnrolled ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg,#1B3A6B,#3B82F6)', color: isEnrolled ? '#10B981' : '#fff' }}>
                        {enrolling === course.id ? '...' : isEnrolled ? 'Continue' : 'Enroll'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sidebar
function Sidebar({ collapsed, setCollapsed, navigate, onLogout, activeTab, setActiveTab, onLessonRequest }) {
  const NAV_ITEMS = [
    { icon: <LayoutDashboard size={18} strokeWidth={1.8} />, label: 'Dashboard',    tab: 'dashboard'    },
    { icon: <BookOpen        size={18} strokeWidth={1.8} />, label: 'My Courses',   tab: 'courses'      },
    { icon: <ClipboardList   size={18} strokeWidth={1.8} />, label: 'Exams',        tab: 'exams'        },
    { icon: <BookMarked      size={18} strokeWidth={1.8} />, label: 'Vocabulary',   tab: 'vocabulary'   },
    { icon: <BarChart2       size={18} strokeWidth={1.8} />, label: 'Progress',     tab: 'progress'     },
    { icon: <Award           size={18} strokeWidth={1.8} />, label: 'Certificates', tab: 'certificates' },
  ]
  return (
    <aside style={{ width: collapsed ? '72px' : '240px', minHeight: '100vh', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1)', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
      <div style={{ padding: collapsed ? '24px 0' : '24px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#1B3A6B,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontWeight: '800', fontSize: '18px', color: '#fff', flexShrink: 0, marginLeft: collapsed ? 'auto' : 0, marginRight: collapsed ? 'auto' : 0 }}>D</div>
        {!collapsed && <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '17px', color: '#fff', whiteSpace: 'nowrap' }}>DeutschSchule</span>}
      </div>
      <nav style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map(item => {
          const isActive = activeTab === item.tab
          return (
            <div key={item.tab} onClick={() => setActiveTab(item.tab)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: collapsed ? '12px 0' : '12px 20px', justifyContent: collapsed ? 'center' : 'flex-start', cursor: 'pointer', background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent', borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent', color: isActive ? '#fff' : 'rgba(255,255,255,0.45)', transition: 'all 0.2s' }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' } }}>
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: isActive ? '700' : '500', whiteSpace: 'nowrap' }}>{item.label}</span>}
            </div>
          )
        })}
        <div style={{ padding: collapsed ? '8px 0' : '8px 12px', marginTop: '4px' }}>
          <button onClick={onLessonRequest}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '12px 0' : '11px 14px', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.08)', color: '#60a5fa', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.15)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)' }}>
            <Video size={17} strokeWidth={2} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>Book Personal Lesson</span>}
          </button>
        </div>
      </nav>
      <div style={{ padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div onClick={() => navigate('/student/profile')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: collapsed ? '10px 0' : '10px 20px', justifyContent: collapsed ? 'center' : 'flex-start', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
          <Settings size={18} strokeWidth={1.8} />
          {!collapsed && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '500' }}>Settings</span>}
        </div>
        <div onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: collapsed ? '10px 0' : '10px 20px', justifyContent: collapsed ? 'center' : 'flex-start', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
          <LogOut size={18} strokeWidth={1.8} />
          {!collapsed && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '500' }}>Sign Out</span>}
        </div>
      </div>
    </aside>
  )
}

// ── TopBar
function TopBar({ collapsed, setCollapsed, student, streak, examDaysLeft, onLessonRequest }) {
  const firstName  = student?.first_name || student?.name?.split(' ')[0] || '...'
  const examTarget = student?.target_exam || 'your exam'
  const initials   = student ? ((student.first_name || '')[0] || '') + ((student.last_name || '')[0] || '') : '?'
  const hour       = new Date().getHours()
  const greeting   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  return (
    <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,9,15,0.6)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => setCollapsed(c => !c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
          <Menu size={20} strokeWidth={1.8} />
        </button>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '700', color: '#fff' }}>{greeting}, {firstName}</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
            {examDaysLeft != null ? examDaysLeft + ' days until your ' + examTarget + ' exam' : 'Welcome to ' + examTarget}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '100px', padding: '6px 14px' }}>
            <Flame size={14} color="#F59E0B" strokeWidth={2} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', color: '#F59E0B' }}>{streak} day streak</span>
          </div>
        )}
        <button onClick={onLessonRequest}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.18)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)' }}>
          <Video size={14} strokeWidth={2} /> Book Pesonal Lesson
        </button>
        <div style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Bell size={17} color="rgba(255,255,255,0.6)" strokeWidth={1.8} />
          <div style={{ position: 'absolute', top: '8px', right: '8px', width: '7px', height: '7px', borderRadius: '50%', background: '#EF4444', border: '1.5px solid #06090F' }} />
        </div>
        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#1B3A6B,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '15px', color: '#fff', cursor: 'pointer' }}>
          {initials.toUpperCase()}
        </div>
      </div>
    </div>
  )
}

// ── Tab views
function CoursesTab({ enrollments, navigate, onBrowse }) {
  const modules = enrollments.map((enr, i) => ({
    id: i+1, title: enr.course?.title || 'Course ' + (i+1), courseId: enr.course?.id,
    level: enr.course?.level, lessons: enr.course?.lesson_count || 0,
    progress: enr.completion_percentage || 0, completed: enr.completed,
  }))
  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: '#fff' }}>My Courses</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{modules.length} enrolled</div>
        </div>
        <button onClick={onBrowse} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,#1B3A6B,#3B82F6)', border: 'none', borderRadius: '12px', padding: '10px 20px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
          <Plus size={15} strokeWidth={2.5} /> Browse Courses
        </button>
      </div>
      {modules.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 32px' }}>
          <GraduationCap size={48} color="rgba(255,255,255,0.15)" strokeWidth={1.2} style={{ marginBottom: '16px' }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>No courses yet</div>
          <button onClick={onBrowse} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,#1B3A6B,#3B82F6)', border: 'none', borderRadius: '12px', padding: '12px 28px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '16px' }}>
            Find a Course <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {modules.map(mod => {
            const lc = LEVEL_COLORS[mod.level] || '#3B82F6'
            return (
              <Card key={mod.id} style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => navigate('/student/lesson/' + mod.courseId + '/first')}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.35)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', color: lc, background: lc + '18', border: '1px solid ' + lc + '40', borderRadius: '6px', padding: '2px 8px' }}>{mod.level}</span>
                      {mod.completed && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', color: '#10B981', background: 'rgba(16,185,129,0.1)', borderRadius: '6px', padding: '2px 8px', border: '1px solid rgba(16,185,129,0.25)' }}>Completed</span>}
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '17px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{mod.title}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{mod.lessons} lessons</div>
                  </div>
                  <ChevronRight size={16} color="rgba(255,255,255,0.3)" strokeWidth={2} />
                </div>
                <ProgressBar pct={mod.progress} color={lc} height={5} />
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>{mod.progress}% complete</div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CertificatesTab({ certificates }) {
  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: '#fff' }}>Certificates</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{certificates.filter(c => c.status === 'issued').length} earned</div>
      </div>
      {certificates.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 32px' }}>
          <Award size={48} color="rgba(139,92,246,0.3)" strokeWidth={1.2} style={{ marginBottom: '16px' }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>No certificates yet</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>Complete a course to earn your first certificate.</div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          {certificates.map(cert => (
            <Card key={cert.id} style={{ background: cert.status === 'issued' ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)', border: '1px solid ' + (cert.status === 'issued' ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.07)') }}>
              <Award size={28} color={cert.status === 'issued' ? '#8B5CF6' : 'rgba(255,255,255,0.2)'} strokeWidth={1.5} style={{ marginBottom: '12px' }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{cert.course?.title}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>Score: {cert.score}%</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '6px', background: cert.status === 'issued' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: cert.status === 'issued' ? '#10B981' : '#F59E0B', border: '1px solid ' + (cert.status === 'issued' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)') }}>
                  {cert.status === 'issued' ? 'Issued' : 'Pending'}
                </span>
                {cert.status === 'issued' && <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600' }}><Download size={13} strokeWidth={2} /> Download</button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function ProgressTab({ data }) {
  const { recent_scores = [] } = data
  const ANALYTICS = [
    { label: 'Grammar',    pct: 64, color: '#3B82F6' },
    { label: 'Vocabulary', pct: 81, color: '#10B981' },
    { label: 'Listening',  pct: 52, color: '#F59E0B' },
    { label: 'Writing',    pct: 70, color: '#8B5CF6' },
  ]
  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: '24px' }}><div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: '#fff' }}>Your Progress</div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card>
          <SectionLabel>Skill Breakdown</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {ANALYTICS.map(a => (
              <div key={a.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>{a.label}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', color: a.color }}>{a.pct}%</span>
                </div>
                <ProgressBar pct={a.pct} color={a.color} height={6} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionLabel>Recent Test Scores</SectionLabel>
          {recent_scores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}>No test attempts yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recent_scores.slice(0, 6).map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#fff' }}>Test {i+1}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '800', color: s.passed ? '#10B981' : '#EF4444' }}>{Math.round(s.score || 0)}%</span>
                    {s.passed ? <CheckCircle size={13} color="#10B981" strokeWidth={2.5} /> : <AlertTriangle size={13} color="#EF4444" strokeWidth={2.5} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// ── Goethe Exam Tab
function GoetheTab() {
  const [activeLevel, setActiveLevel] = useState('All')
  const [exams, setExams] = useState([])
  const [examsLoading, setExamsLoading] = useState(true)
  const [myRequests, setMyRequests] = useState([])
  const [requestModal, setRequestModal] = useState(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ msg: '', type: 'info' })
  const [view, setView] = useState('schedule')

  useEffect(() => {
    setExamsLoading(true)
    Promise.all([goetheAPI.exams(), goetheAPI.myRequests()])
      .then(([er, rr]) => { setExams(er.data?.results ?? er.data ?? []); setMyRequests(rr.data?.results ?? rr.data ?? []) })
      .catch(() => {})
      .finally(() => setExamsLoading(false))
  }, [])

  const filtered   = activeLevel === 'All' ? exams : exams.filter(e => e.level === activeLevel)
  const myReqFor   = (id) => myRequests.find(r => r.exam?.id === id || r.exam_id === id)
  const REQ_STATUS = {
    pending_instructor: { label: 'Awaiting Instructor Review', dot: '#f59e0b' },
    pending_admin:      { label: 'Awaiting Admin Approval',    dot: '#3b82f6' },
    approved:           { label: 'Approved',                   dot: '#10b981' },
    denied:             { label: 'Not Approved',               dot: '#ef4444' },
  }
  const showToast = (msg, type = 'info') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'info' }), 4500) }

  const handleRequest = async () => {
    if (!requestModal) return
    setSubmitting(true)
    try {
      await goetheAPI.createRequest({ exam_id: requestModal.id, student_note: note })
      const r = await goetheAPI.myRequests()
      setMyRequests(r.data?.results ?? r.data ?? [])
      setRequestModal(null); setNote('')
      showToast('Request submitted. Your instructor will review it shortly.', 'success')
      setView('myrequests')
    } catch (err) { showToast(err.response?.data?.detail || 'Something went wrong.', 'error') }
    finally { setSubmitting(false) }
  }

  const TOAST_STYLE = {
    success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', txt: '#34d399' },
    error:   { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  txt: '#f87171' },
    info:    { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', txt: '#93c5fd' },
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: '#fff' }}>Goethe-Zertifikat Exams</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Official German certification · Kenya exam schedule</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[{ id: 'schedule', label: 'Exam Schedule' }, { id: 'myrequests', label: myRequests.length > 0 ? 'My Requests (' + myRequests.length + ')' : 'My Requests' }].map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              style={{ padding: '8px 18px', borderRadius: '10px', border: '1px solid', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', background: view === t.id ? '#3B82F6' : 'rgba(255,255,255,0.04)', borderColor: view === t.id ? '#3B82F6' : 'rgba(255,255,255,0.1)', color: view === t.id ? '#fff' : 'rgba(255,255,255,0.5)' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px', padding: '14px 18px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '14px', display: 'flex', gap: '12px' }}>
        <span style={{ fontSize: '16px', flexShrink: 0 }}>&#128226;</span>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
          <span style={{ fontWeight: '700', color: '#fbbf24' }}>Registration Period Policy: </span>
          Registration periods are <strong style={{ color: '#fff' }}>2 days</strong>. Payment must be completed within this window. Registrations open at <strong style={{ color: '#fff' }}>9:00 AM</strong>.
        </div>
      </div>

      {toast.msg && <div style={{ marginBottom: '16px', padding: '12px 16px', background: TOAST_STYLE[toast.type].bg, border: '1px solid ' + TOAST_STYLE[toast.type].border, borderRadius: '12px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: TOAST_STYLE[toast.type].txt }}>{toast.msg}</div>}

      {view === 'schedule' && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {EXAM_LEVELS.map(l => (
              <button key={l} onClick={() => setActiveLevel(l)}
                style={{ padding: '7px 16px', borderRadius: '9px', border: '1px solid', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeLevel === l ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)', borderColor: activeLevel === l ? 'rgba(59,130,246,0.55)' : 'rgba(255,255,255,0.08)', color: activeLevel === l ? '#93c5fd' : 'rgba(255,255,255,0.5)' }}>
                {l}
              </button>
            ))}
          </div>
          {examsLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[1,2,3,4].map(i => <div key={i} style={{ height: '200px', background: 'rgba(255,255,255,0.03)', borderRadius: '18px', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '60px 32px' }}>
              <div style={{ fontSize: '40px', marginBottom: '14px' }}>&#128197;</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>No exams scheduled yet</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Check back soon.</div>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {filtered.map(exam => {
                const myReq = myReqFor(exam.id); const reqSt = myReq ? REQ_STATUS[myReq.status] : null; const lc = LEVEL_COLORS[exam.level] || '#3B82F6'
                return (
                  <div key={exam.id} style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '18px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(27,58,107,0.7)', border: '1px solid ' + lc + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: '900', fontSize: '13px', color: lc }}>{exam.level}</span>
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '15px', color: '#fff' }}>Goethe-Zertifikat {exam.level}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>&#128205; {exam.location}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 12px' }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '5px' }}>Exam Date</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', color: '#fff' }}>{fmtDate(exam.exam_date_start)}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 12px' }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '5px' }}>Registration</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600', color: '#fff' }}>{fmtDate(exam.reg_open)} – {fmtDate(exam.reg_close)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '800', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 10px', color: '#fff' }}>{fmtKES(exam.price_full)}</span>
                      {exam.price_reduced && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', color: '#34d399', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '4px 10px' }}>{fmtKES(exam.price_reduced)} *</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {myReq ? (
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '7px', color: 'rgba(255,255,255,0.7)' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: reqSt?.dot, display: 'inline-block' }} />{reqSt?.label}
                        </span>
                      ) : (
                        <button onClick={() => setRequestModal(exam)} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', background: 'linear-gradient(135deg,#1B3A6B,#3B82F6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 18px', cursor: 'pointer' }}>
                          Request to Sit Exam
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ marginTop: '20px', padding: '14px 18px', background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: '14px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
            * Reduced price for Goethe members. Verify at <a href="https://www.goethe.de/ins/ke/en/spr/prf.html" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>goethe.de/ke</a>.
          </div>
        </>
      )}

      {view === 'myrequests' && (
        myRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px' }}>
            <div style={{ fontSize: '42px', marginBottom: '14px' }}>&#128203;</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>No requests yet</div>
            <button onClick={() => setView('schedule')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', background: 'linear-gradient(135deg,#1B3A6B,#3B82F6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 24px', cursor: 'pointer', marginTop: '16px' }}>
              Browse Exam Schedule
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {myRequests.map((req, i) => {
              const st = REQ_STATUS[req.status] || REQ_STATUS.pending_instructor
              return (
                <div key={req.id ?? i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '17px', color: '#fff' }}>Goethe-Zertifikat {req.exam?.level}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>&#128205; {req.exam?.location} · {fmtDate(req.exam?.exam_date_start)}</div>
                    </div>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: st.dot, display: 'inline-block' }} />{st.label}
                    </span>
                  </div>
                  {req.status === 'approved' && (
                    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px' }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', color: '#34d399', marginBottom: '8px' }}>Access Approved!</div>
                      <a href="https://www.goethe.de/ins/ke/en/spr/prf.html" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '8px', padding: '7px 14px', textDecoration: 'none', display: 'inline-block' }}>Register on Goethe Website</a>
                    </div>
                  )}
                  {req.status === 'denied' && req.admin_note && (
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px' }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#f87171' }}>Reason: {req.admin_note}</div>
                    </div>
                  )}
                  {req.student_note && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginBottom: '6px' }}>Your note: "{req.student_note}"</div>}
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>Submitted {fmtDate(req.created_at)}</div>
                </div>
              )
            })}
          </div>
        )
      )}

      {requestModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth: '480px', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#0f1f3d,#1a3a6b)', padding: '26px 30px' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '6px' }}>Exam Access Request</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '21px', fontWeight: '800', color: '#fff' }}>Goethe-Zertifikat {requestModal.level}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '5px' }}>&#128205; {requestModal.location} · {fmtDate(requestModal.exam_date_start)}</div>
            </div>
            <div style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {[['Registration Window', fmtDate(requestModal.reg_open) + ' – ' + fmtDate(requestModal.reg_close)], ['Full Price', fmtKES(requestModal.price_full)], ['Reduced Price', fmtKES(requestModal.price_reduced)]].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', gap: '12px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                    <span style={{ color: '#fff', fontWeight: '600', textAlign: 'right' }}>{val}</span>
                  </div>
                ))}
              </div>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Optional message to your instructor..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 14px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setRequestModal(null); setNote('') }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.6)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', padding: '12px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleRequest} disabled={submitting} style={{ flex: 2, background: 'linear-gradient(135deg,#1B3A6B,#3B82F6)', border: 'none', borderRadius: '12px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', padding: '12px', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Dashboard Main Content
function DashboardContent({ navigate, data, onBrowse, onLessonRequest }) {
  const { user, enrollments = [], recent_scores = [], certificates = [], streak = 0, exam_days_left } = data
  const level           = user?.level || '—'
  const examTarget      = user?.target_exam || 'Goethe B1'
  const examDate        = user?.exam_date ? new Date(user.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null
  const weeklyGoal      = user?.weekly_goal || 5
  const overallProgress = enrollments[0]?.completion_percentage || 0
  const examReadiness   = recent_scores.length ? Math.round(recent_scores.reduce((s, r) => s + (r.score || 0), 0) / recent_scores.length) : 0
  const firstCourseId   = enrollments[0]?.course?.id
  const resumePath      = firstCourseId ? '/student/lesson/' + firstCourseId + '/first' : '/student/courses'
  const lastLesson      = enrollments[0] ? { title: enrollments[0].course?.title || 'Continue your course', module: enrollments[0].course?.description || '', progress: enrollments[0].completion_percentage || 0 } : null
  const modules         = enrollments.map((enr, i) => ({ id: i+1, title: enr.course?.title || 'Course ' + (i+1), courseId: enr.course?.id, lessons: enr.course?.lesson_count || 0, completed: Math.round(((enr.completion_percentage || 0) / 100) * (enr.course?.lesson_count || 0)) }))
  const recentScores    = recent_scores.slice(0, 4).map(a => ({ label: a.test?.toString() || 'Test', score: Math.round(a.score || 0), passed: a.passed }))
  const ANALYTICS = [
    { label: 'Grammar',    pct: 64, color: '#3B82F6' },
    { label: 'Vocabulary', pct: 81, color: '#10B981' },
    { label: 'Listening',  pct: 52, color: '#F59E0B' },
    { label: 'Writing',    pct: 70, color: '#8B5CF6' },
  ]

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <Card style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Ring pct={overallProgress} size={72} stroke={6} color="#3B82F6">
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '800', color: '#fff' }}>{level}</span>
          </Ring>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Current Level</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: '#fff' }}>{level}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#3B82F6', marginTop: '2px' }}>{overallProgress}% complete</div>
          </div>
        </Card>
        <Card style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Ring pct={examReadiness} size={72} stroke={6} color={examReadiness >= 70 ? '#10B981' : '#F59E0B'}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '800', color: '#fff' }}>{examReadiness}%</span>
          </Ring>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Exam Readiness</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '800', color: '#fff' }}>{examTarget}</div>
            {examDate && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><Calendar size={11} color="#F59E0B" strokeWidth={2} /><span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#F59E0B' }}>{examDate}</span></div>}
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Weekly Goal</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: '#fff' }}>—/{weeklyGoal} <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>days</span></div>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '6px' }}><Target size={18} color="#10B981" strokeWidth={2} /></div>
          </div>
          <ProgressBar pct={0} color="#10B981" />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '8px' }}>Keep learning to hit your goal</div>
        </Card>
        <Card style={{ background: 'rgba(27,58,107,0.2)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Exam Countdown</div>
            <Clock size={16} color="#3B82F6" strokeWidth={2} />
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '42px', fontWeight: '800', color: '#fff', lineHeight: 1, marginBottom: '6px' }}>{exam_days_left ?? '—'}</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>days until {examTarget}</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <Card style={{ gridColumn: 'span 2', background: 'rgba(27,58,107,0.15)', border: '1px solid rgba(59,130,246,0.18)' }}>
          <SectionLabel>Continue Where You Left Off</SectionLabel>
          {lastLesson ? (
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ width: '120px', height: '80px', borderRadius: '12px', background: 'linear-gradient(135deg,#1B3A6B,#0D2451)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(59,130,246,0.2)' }}>
                <PlayCircle size={32} color="rgba(255,255,255,0.7)" strokeWidth={1.5} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>{lastLesson.module}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>{lastLesson.title}</div>
                <div style={{ marginBottom: '10px' }}><ProgressBar pct={lastLesson.progress} color="#3B82F6" height={5} /></div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#3B82F6' }}>{lastLesson.progress}% complete</span>
                  <button onClick={() => navigate(resumePath)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg,#1B3A6B,#3B82F6)', border: 'none', borderRadius: '100px', padding: '8px 18px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    Resume <ArrowRight size={13} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <BookOpen size={32} color="rgba(255,255,255,0.2)" strokeWidth={1.2} style={{ marginBottom: '12px' }} />
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>You have not enrolled in a course yet.</div>
              <button onClick={onBrowse} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,#1B3A6B,#3B82F6)', border: 'none', borderRadius: '10px', padding: '10px 22px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                Browse Courses <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </Card>
        <Card style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <SectionLabel>Certificates</SectionLabel>
          {certificates.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {certificates.slice(0, 2).map(cert => (
                <div key={cert.id} style={{ padding: '12px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{cert.course?.title}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#C4B5FD' }}>Score: {cert.score}%</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Award size={28} color="rgba(139,92,246,0.4)" strokeWidth={1.2} style={{ marginBottom: '8px' }} />
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Complete a course to earn your first certificate.</div>
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <SectionLabel>My Courses</SectionLabel>
            <button onClick={onBrowse} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '4px 10px', color: '#3B82F6', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>+ Enroll</button>
          </div>
          {modules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '12px' }}>No courses enrolled yet.</div>
              <button onClick={onBrowse} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Browse Courses</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {modules.map(mod => (
                <div key={mod.id} onClick={() => mod.courseId && navigate('/student/lesson/' + mod.courseId + '/first')}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><BookOpen size={12} color="#3B82F6" strokeWidth={2} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.title}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{mod.completed}/{mod.lessons} lessons</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <SectionLabel>Skill Breakdown</SectionLabel>
            <Activity size={15} color="rgba(255,255,255,0.3)" strokeWidth={2} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {ANALYTICS.map(a => (
              <div key={a.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>{a.label}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', color: a.color }}>{a.pct}%</span>
                </div>
                <ProgressBar pct={a.pct} color={a.color} height={6} />
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <SectionLabel>Recent Scores</SectionLabel>
            {recentScores.length === 0 ? (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '12px 0' }}>No test attempts yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentScores.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600', color: '#fff' }}>{s.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '800', color: s.passed ? '#10B981' : '#EF4444' }}>{s.score}%</span>
                      {s.passed ? <CheckCircle size={13} color="#10B981" strokeWidth={2.5} /> : <AlertTriangle size={13} color="#EF4444" strokeWidth={2.5} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionLabel>Quick Access</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { icon: <BookMarked size={15} strokeWidth={2} />, label: 'Vocabulary Trainer',   color: '#10B981', highlight: false, action: () => {} },
                { icon: <Headphones size={15} strokeWidth={2} />, label: 'Practice Listening',   color: '#3B82F6', highlight: false, action: () => navigate(resumePath) },
                { icon: <Video      size={15} strokeWidth={2} />, label: 'Book a Zoom Lesson',   color: '#60a5fa', highlight: true,  action: onLessonRequest },
                { icon: <Download   size={15} strokeWidth={2} />, label: 'Download Certificate', color: '#F59E0B', highlight: false, action: () => navigate('/student/certificates') },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: item.highlight ? 'rgba(59,130,246,0.07)' : 'rgba(255,255,255,0.02)', border: '1px solid ' + (item.highlight ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)'), borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = item.highlight ? 'rgba(59,130,246,0.07)' : 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = item.highlight ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)' }}>
                  <span style={{ color: item.color }}>{item.icon}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: item.highlight ? '#60a5fa' : 'rgba(255,255,255,0.7)' }}>{item.label}</span>
                  <ChevronRight size={13} color="rgba(255,255,255,0.25)" strokeWidth={2} style={{ marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ── Root Component
export default function StudentDashboard() {
  const navigate = useNavigate()
  const logout   = useAuthStore((s) => s.logout)
  const [collapsed,       setCollapsed]       = useState(false)
  const [activeTab,       setActiveTab]       = useState('dashboard')
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState('')
  const [dashData,        setDashData]        = useState(null)
  const [showModal,       setShowModal]       = useState(false)
  const [showLessonModal, setShowLessonModal] = useState(false)

  const fetchDashboard = () => {
    setLoading(true)
    studentAPI.dashboard()
      .then(({ data }) => { setDashData(data); setLoading(false) })
      .catch(err => {
        if (err.response?.status === 401) { clearTokens(); navigate('/login') }
        else { setError('Failed to load dashboard. Please refresh.'); setLoading(false) }
      })
  }

  useEffect(() => { fetchDashboard() }, [])

  const handleLogout = () => { clearTokens(); logout?.(); navigate('/login') }
  const enrolledIds  = dashData?.enrollments?.map(e => e.course?.id).filter(Boolean) || []
  const openLesson   = () => setShowLessonModal(true)

  const renderTab = () => {
    if (!dashData) return null
    switch (activeTab) {
      case 'dashboard':    return <DashboardContent navigate={navigate} data={dashData} onBrowse={() => setShowModal(true)} onLessonRequest={openLesson} />
      case 'courses':      return <CoursesTab enrollments={dashData.enrollments || []} navigate={navigate} onBrowse={() => setShowModal(true)} />
      case 'certificates': return <CertificatesTab certificates={dashData.certificates || []} />
      case 'progress':     return <ProgressTab data={dashData} />
      case 'exams':        return <GoetheTab />
      case 'vocabulary':   return <VocabularyTab student={dashData?.user} />
      default:             return <DashboardContent navigate={navigate} data={dashData} onBrowse={() => setShowModal(true)} onLessonRequest={openLesson} />
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #06090F; color: #fff; overflow: hidden; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin  { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:focus { border-color: rgba(59,130,246,0.4) !important; }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
      `}</style>

      {showModal && <CourseModal onClose={() => setShowModal(false)} enrolledIds={enrolledIds} onEnrolled={fetchDashboard} />}
      {showLessonModal && <PersonalLessonModal onClose={() => setShowLessonModal(false)} student={dashData?.user} />}

      <div style={{ display: 'flex', height: '100vh', background: '#06090F', overflow: 'hidden' }}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} navigate={navigate} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} onLessonRequest={openLesson} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TopBar collapsed={collapsed} setCollapsed={setCollapsed} student={dashData?.user} streak={dashData?.streak || 0} examDaysLeft={dashData?.exam_days_left} onLessonRequest={openLesson} />
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && (
              <div style={{ padding: '28px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  {[1,2,3,4].map(i => <div key={i} style={{ height: '100px', background: 'rgba(255,255,255,0.03)', borderRadius: '18px', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '12px' }}>
                  <div style={{ width: '20px', height: '20px', border: '2px solid rgba(59,130,246,0.3)', borderTop: '2px solid #3B82F6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>Loading your dashboard...</span>
                </div>
              </div>
            )}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 24px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px' }}>
                  <AlertTriangle size={18} color="#EF4444" strokeWidth={2} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#EF4444' }}>{error}</span>
                </div>
              </div>
            )}
            {!loading && !error && dashData && renderTab()}
          </div>
        </div>
      </div>
    </>
  )
}