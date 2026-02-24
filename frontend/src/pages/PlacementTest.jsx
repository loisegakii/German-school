import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Target, Clock, HelpCircle, BarChart2, Lightbulb, ArrowRight,
  SkipForward, CheckCircle, ChevronRight, RotateCcw, X,
  BookOpen, PenTool, AlertTriangle, TrendingUp, RefreshCw
} from 'lucide-react'
import { studentAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'

// ── Data ──────────────────────────────────────────────────────────────────────

const QUESTIONS = [
  { id: 1,  level: 'A1', category: 'Vocabulary', question: 'What does "Hallo" mean in English?',                                                         type: 'mcq', options: ['Goodbye', 'Hello', 'Thank you', 'Please'],                                                                      answer: 1 },
  { id: 2,  level: 'A1', category: 'Grammar',    question: 'Complete: "Ich ___ Student."',                                                                type: 'mcq', options: ['bin', 'bist', 'ist', 'sind'],                                                                                   answer: 0 },
  { id: 3,  level: 'A1', category: 'Vocabulary', question: 'Which word means "house"?',                                                                   type: 'mcq', options: ['Hund', 'Haus', 'Hand', 'Hals'],                                                                                 answer: 1 },
  { id: 4,  level: 'A2', category: 'Grammar',    question: 'Choose the correct article: "___ Buch ist interessant."',                                     type: 'mcq', options: ['Der', 'Die', 'Das', 'Den'],                                                                                     answer: 2 },
  { id: 5,  level: 'A2', category: 'Vocabulary', question: '"Ich fahre ___ Bus zur Arbeit." Which preposition fits?',                                     type: 'mcq', options: ['mit', 'dem', 'mit dem', 'auf dem'],                                                                             answer: 2 },
  { id: 6,  level: 'A2', category: 'Grammar',    question: 'What is the past tense of "gehen" (to go)?',                                                  type: 'mcq', options: ['gegangen', 'gegeht', 'gingen', 'gegehen'],                                                                      answer: 0 },
  { id: 7,  level: 'B1', category: 'Grammar',    question: 'Which sentence uses the Dativ correctly?',                                                    type: 'mcq', options: ['Ich helfe den Mann.', 'Ich helfe dem Mann.', 'Ich helfe der Mann.', 'Ich helfe die Mann.'],                     answer: 1 },
  { id: 8,  level: 'B1', category: 'Vocabulary', question: '"Trotzdem" is best translated as:',                                                           type: 'mcq', options: ['therefore', 'however', 'nevertheless', 'furthermore'],                                                         answer: 2 },
  { id: 9,  level: 'B1', category: 'Grammar',    question: 'Complete with Konjunktiv II: "Wenn ich Zeit hätte, ___ ich reisen."',                         type: 'mcq', options: ['würde', 'wäre', 'hätte', 'könnte'],                                                                             answer: 0 },
  { id: 10, level: 'B2', category: 'Grammar',    question: 'Identify the correct Passiv construction:',                                                   type: 'mcq', options: ['Das Buch wird gelesen.', 'Das Buch ist lesen.', 'Das Buch hat gelesen.', 'Das Buch wurde lesen.'],             answer: 0 },
  { id: 11, level: 'B2', category: 'Vocabulary', question: '"Infolgedessen" means:',                                                                      type: 'mcq', options: ['in contrast', 'as a result', 'in addition', 'despite this'],                                                   answer: 1 },
  { id: 12, level: 'B2', category: 'Grammar',    question: 'Which is a correct Relativsatz?',                                                             type: 'mcq', options: ['Der Mann, der ich kenne.', 'Der Mann, den ich kenne.', 'Der Mann, dem ich kenne.', 'Der Mann, das ich kenne.'], answer: 1 },
  { id: 13, level: 'C1', category: 'Grammar',    question: 'Choose the correct Partizip II used as adjective: "Das ___ Problem wurde gelöst."',           type: 'mcq', options: ['gelösende', 'gelöste', 'lösende', 'gelösten'],                                                                  answer: 1 },
  { id: 14, level: 'C1', category: 'Vocabulary', question: '"Ungeachtet" is closest in meaning to:',                                                      type: 'mcq', options: ['regardless of', 'because of', 'in spite of being', 'following from'],                                          answer: 0 },
  { id: 15, level: 'C1', category: 'Grammar',    question: 'Which sentence correctly uses the Genitive?',                                                 type: 'mcq', options: ['Das Auto von meinem Vaters.', 'Das Auto meines Vaters.', 'Das Auto meinem Vater.', 'Das Auto meinen Vaters.'],  answer: 1 },
  { id: 16, level: 'C2', category: 'Vocabulary', question: '"Gleichwohl" is best rendered as:',                                                           type: 'mcq', options: ['simultaneously', 'nonetheless', 'equivalently', 'comparably'],                                                  answer: 1 },
  { id: 17, level: 'C2', category: 'Grammar',    question: 'Which Konjunktiv I form is correct for "er sagt, er ___." (haben)?',                          type: 'mcq', options: ['hätte', 'hat', 'habe', 'hatte'],                                                                                answer: 2 },
  { id: 18, level: 'C2', category: 'Vocabulary', question: '"Lapidar" describes a statement that is:',                                                    type: 'mcq', options: ['verbose and detailed', 'terse and blunt', 'poetic and ornate', 'ambiguous and vague'],                          answer: 1 },
]

const LEVEL_ORDER  = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const LEVEL_COLORS = { A1: '#10B981', A2: '#34D399', B1: '#3B82F6', B2: '#6366F1', C1: '#8B5CF6', C2: '#F59E0B' }
const LEVEL_WEEKS  = { A1: '8–10 weeks', A2: '10–12 weeks', B1: '12–16 weeks', B2: '16–20 weeks', C1: '20–24 weeks', C2: '24–30 weeks' }
const LEVEL_DESC   = {
  A1: 'You are a complete beginner. We will start from scratch — greetings, numbers, basic phrases and present tense.',
  A2: 'You have basic knowledge. Your program covers daily routines, simple past, travel and shopping vocabulary.',
  B1: 'You are at intermediate level. Your program focuses on workplace German, opinion expression and the Goethe B1 exam.',
  B2: 'You are upper-intermediate. Your program covers academic German, complex grammar and professional fluency.',
  C1: 'You are advanced. Your program focuses on nuanced expression, TestDaF and Goethe C1 certification.',
  C2: 'You are at mastery level. Your program targets full academic and professional fluency in German.',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeResult(answers) {
  const levelScores = {}
  LEVEL_ORDER.forEach(l => { levelScores[l] = { correct: 0, total: 0 } })
  QUESTIONS.forEach((q, i) => {
    levelScores[q.level].total++
    if (answers[i] === q.answer) levelScores[q.level].correct++
  })
  let resultLevel = 'A1'
  for (const lv of LEVEL_ORDER) {
    const { correct, total } = levelScores[lv]
    if (correct / total >= 0.5) resultLevel = lv
    else break
  }
  const totalCorrect = QUESTIONS.filter((q, i) => answers[i] === q.answer).length
  const pct = Math.round((totalCorrect / QUESTIONS.length) * 100)
  return { level: resultLevel, levelScores, totalCorrect, pct }
}

// ── Primitives ────────────────────────────────────────────────────────────────

const FloatingOrb = ({ size, x, y, color, blur, duration }) => (
  <div style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', background: color, left: x, top: y, filter: `blur(${blur})`, animation: `float ${duration} ease-in-out infinite alternate`, pointerEvents: 'none' }} />
)

function ProgressBar({ current, total }) {
  const pct = (current / total) * 100
  return (
    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #1B3A6B, #3B82F6)', borderRadius: '2px', transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)' }} />
    </div>
  )
}

function LevelBadge({ level }) {
  return (
    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', letterSpacing: '1px', padding: '3px 12px', borderRadius: '100px', background: `${LEVEL_COLORS[level]}18`, border: `1px solid ${LEVEL_COLORS[level]}40`, color: LEVEL_COLORS[level] }}>
      {level}
    </span>
  )
}

// ── SCREEN: Intro ─────────────────────────────────────────────────────────────

function IntroScreen({ onStart }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', padding: '0 24px' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #1B3A6B, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 0 48px rgba(59,130,246,0.35)' }}>
        <Target size={36} color="#fff" strokeWidth={1.5} />
      </div>

      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', letterSpacing: '3px', color: '#3B82F6', textTransform: 'uppercase', fontWeight: '700', marginBottom: '16px' }}>Placement Test</div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: '800', color: '#fff', lineHeight: '1.1', marginBottom: '20px' }}>
        Find your German<br />
        <span style={{ background: 'linear-gradient(135deg, #93C5FD, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>level in 15 minutes</span>
      </h1>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.85', marginBottom: '48px' }}>
        18 adaptive questions covering vocabulary and grammar across all CEFR levels. Answer honestly — this personalizes your entire learning path.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '36px' }}>
        {[
          { icon: <Clock size={22} color="#3B82F6" strokeWidth={1.5} />, val: '~15 min', label: 'Estimated time' },
          { icon: <HelpCircle size={22} color="#8B5CF6" strokeWidth={1.5} />, val: '18', label: 'Questions' },
          { icon: <BarChart2 size={22} color="#10B981" strokeWidth={1.5} />, val: 'A1–C2', label: 'Levels covered' },
        ].map(({ icon, val, label }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>{icon}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>{val}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: '14px', padding: '20px 24px', marginBottom: '40px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', color: '#93C5FD', marginBottom: '12px' }}>
          <Lightbulb size={15} color="#93C5FD" strokeWidth={2} /> Tips for accurate results
        </div>
        {["Don't use a dictionary — answer from memory.", "If you're unsure, make your best guess.", "Skipping is allowed if you truly don't know."].map(t => (
          <div key={t} style={{ display: 'flex', gap: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '7px', alignItems: 'flex-start' }}>
            <ChevronRight size={14} color="#3B82F6" style={{ flexShrink: 0, marginTop: '2px' }} />{t}
          </div>
        ))}
      </div>

      <button onClick={onStart} style={{ width: '100%', maxWidth: '360px', padding: '18px', background: 'linear-gradient(135deg, #1B3A6B, #3B82F6)', border: 'none', borderRadius: '14px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '17px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 8px 36px rgba(59,130,246,0.35)', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', margin: '0 auto' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
        Start Placement Test <ArrowRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  )
}

// ── SCREEN: Question ──────────────────────────────────────────────────────────

function QuestionScreen({ question, index, total, selected, onSelect, onNext, onSkip, timeLeft }) {
  const q = question
  const timePct   = (timeLeft / 30) * 100
  const timeColor = timeLeft <= 10 ? '#EF4444' : timeLeft <= 20 ? '#F59E0B' : '#10B981'
  const catIcon   = q.category === 'Grammar' ? <BookOpen size={13} strokeWidth={2} /> : <PenTool size={13} strokeWidth={2} />

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LevelBadge level={q.level} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {catIcon} {q.category}
          </span>
        </div>
        <div style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="44" height="44" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <circle cx="22" cy="22" r="18" fill="none" stroke={timeColor} strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 18}`}
              strokeDashoffset={`${2 * Math.PI * 18 * (1 - timePct / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
          </svg>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', color: timeColor, position: 'relative', zIndex: 1 }}>{timeLeft}</span>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <ProgressBar current={index} total={total} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Question {index + 1} of {total}</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{Math.round((index / total) * 100)}% complete</span>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '32px', marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: '700', color: '#fff', lineHeight: '1.55' }}>{q.question}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
        {q.options.map((opt, i) => {
          const isSelected = selected === i
          return (
            <div key={i} onClick={() => onSelect(i)}
              style={{ padding: '17px 22px', borderRadius: '14px', border: `1px solid ${isSelected ? 'rgba(59,130,246,0.65)' : 'rgba(255,255,255,0.08)'}`, background: isSelected ? 'rgba(59,130,246,0.11)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s' }}
              onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' } }}
              onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' } }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${isSelected ? '#3B82F6' : 'rgba(255,255,255,0.15)'}`, background: isSelected ? '#3B82F6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                {isSelected
                  ? <CheckCircle size={16} color="#fff" strokeWidth={2.5} />
                  : <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)' }}>{['A','B','C','D'][i]}</span>}
              </div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: isSelected ? '600' : '400', transition: 'all 0.2s' }}>{opt}</span>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onSkip} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}>
          <SkipForward size={15} strokeWidth={2} /> Skip
        </button>
        <button onClick={onNext} disabled={selected === null}
          style={{ flex: 2, padding: '14px', background: selected !== null ? 'linear-gradient(135deg, #1B3A6B, #3B82F6)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: selected !== null ? '#fff' : 'rgba(255,255,255,0.2)', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '700', cursor: selected !== null ? 'pointer' : 'not-allowed', transition: 'all 0.3s', boxShadow: selected !== null ? '0 6px 24px rgba(59,130,246,0.28)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {index === total - 1 ? 'See My Results' : 'Next Question'} <ArrowRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

// ── SCREEN: Result ────────────────────────────────────────────────────────────

function ResultScreen({ result, navigate, saveStatus }) {
  const { level, levelScores, totalCorrect, pct } = result
  const color    = LEVEL_COLORS[level]
  const nextLevel = LEVEL_ORDER[LEVEL_ORDER.indexOf(level) + 1]
  const [animPct, setAnimPct] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => {
      let current = 0
      const interval = setInterval(() => {
        current += 2
        if (current >= pct) { setAnimPct(pct); clearInterval(interval) }
        else setAnimPct(current)
      }, 18)
      return () => clearInterval(interval)
    }, 400)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px' }}>
      {/* Save status banner */}
      {saveStatus === 'saving' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '12px', padding: '10px 20px', marginBottom: '24px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#93C5FD' }}>
          <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving your results…
        </div>
      )}
      {saveStatus === 'saved' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '10px 20px', marginBottom: '24px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#10B981' }}>
          <CheckCircle size={13} /> Results saved to your profile
        </div>
      )}
      {saveStatus === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '10px 20px', marginBottom: '24px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#FCA5A5' }}>
          <AlertTriangle size={13} /> Couldn't save results — they're still shown below
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '100px', padding: '8px 20px', marginBottom: '28px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#10B981', fontWeight: '600' }}>
          <CheckCircle size={14} strokeWidth={2.5} /> Test Complete
        </div>

        <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto 28px' }}>
          <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle cx="80" cy="80" r="68" fill="none" stroke={color} strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 68}`}
              strokeDashoffset={`${2 * Math.PI * 68 * (1 - animPct / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.05s linear', filter: `drop-shadow(0 0 10px ${color})` }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '42px', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{level}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{animPct}% score</div>
          </div>
        </div>

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: '800', color: '#fff', lineHeight: '1.1', marginBottom: '16px' }}>
          You are currently <span style={{ color }}>{level} level</span>
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.8', maxWidth: '520px', margin: '0 auto 14px' }}>
          {LEVEL_DESC[level]}
        </p>
        {nextLevel && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            <TrendingUp size={15} color="#F59E0B" strokeWidth={2} />
            Estimated <strong style={{ color: '#fff', margin: '0 4px' }}>{LEVEL_WEEKS[level]}</strong> to reach {nextLevel}
          </div>
        )}
      </div>

      {/* Breakdown */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '22px' }}>
          <BarChart2 size={15} strokeWidth={2} /> Score Breakdown by Level
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {LEVEL_ORDER.map(lv => {
            const { correct, total } = levelScores[lv]
            const lvPct = Math.round((correct / total) * 100)
            const isResult = lv === level
            return (
              <div key={lv}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LevelBadge level={lv} />
                    {isResult && (
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: LEVEL_COLORS[lv], fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Target size={11} strokeWidth={2.5} /> Your Level
                      </span>
                    )}
                  </div>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', color: lvPct >= 50 ? '#10B981' : 'rgba(255,255,255,0.35)' }}>{correct}/{total} correct</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${lvPct}%`, background: lvPct >= 50 ? LEVEL_COLORS[lv] : 'rgba(255,255,255,0.12)', borderRadius: '3px', transition: 'width 1s ease', boxShadow: lvPct >= 50 ? `0 0 8px ${LEVEL_COLORS[lv]}55` : 'none' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[[`${totalCorrect}/${QUESTIONS.length}`, 'Total Correct', <CheckCircle size={16} color="#10B981" strokeWidth={2} />],
          [`${pct}%`, 'Overall Score', <BarChart2 size={16} color="#3B82F6" strokeWidth={2} />],
          [LEVEL_WEEKS[level], 'Est. to Next Level', <Clock size={16} color="#F59E0B" strokeWidth={2} />]
        ].map(([val, label, icon]) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>{val}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={() => navigate('/student/dashboard')}
          style={{ width: '100%', padding: '18px', background: 'linear-gradient(135deg, #1B3A6B, #3B82F6)', border: 'none', borderRadius: '14px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '17px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 8px 36px rgba(59,130,246,0.35)', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          Start {level} Program <ArrowRight size={18} strokeWidth={2.5} />
        </button>
        <button onClick={() => window.location.reload()}
          style={{ width: '100%', padding: '15px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'rgba(255,255,255,0.45)', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.25s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}>
          <RotateCcw size={15} strokeWidth={2} /> Retake the placement test
        </button>
      </div>
    </div>
  )
}

// ── ROOT ──────────────────────────────────────────────────────────────────────

export default function PlacementTest() {
  const navigate   = useNavigate()
  const setUser    = useAuthStore(s => s.setUser)

  const [screen,     setScreen]     = useState('intro')
  const [index,      setIndex]      = useState(0)
  const [answers,    setAnswers]    = useState({})
  const [selected,   setSelected]   = useState(null)
  const [timeLeft,   setTimeLeft]   = useState(30)
  const [result,     setResult]     = useState(null)
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'saved' | 'error'
  const timerRef = useRef(null)

  useEffect(() => {
    if (screen !== 'test') return
    setTimeLeft(30)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); advance(true); return 30 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [index, screen])

  // ── Save result to backend ──────────────────────────────────────────────────
  const saveResult = async (computedResult) => {
    setSaveStatus('saving')
    try {
      const res = await studentAPI.placementSave({ level: computedResult.level, score: computedResult.pct })
      // Backend returns updated user — update auth store so level shows everywhere
      if (res.data?.user) setUser(res.data.user)
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }

  const advance = (auto = false) => {
    clearInterval(timerRef.current)
    setAnswers(prev => {
      const updated = { ...prev }
      if (!auto && selected !== null) updated[index] = selected
      if (index + 1 >= QUESTIONS.length) {
        const computed = computeResult(updated)
        setResult(computed)
        setScreen('result')
        saveResult(computed)   // ← fire & forget, status shown in ResultScreen
      } else {
        setIndex(i => i + 1)
        setSelected(null)
      }
      return updated
    })
    if (auto) setSelected(null)
  }

  const handleStart = () => { setScreen('test'); setIndex(0); setAnswers({}); setSelected(null) }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #06090F; color: #fff; }
        @keyframes float  { from { transform: translateY(0px);    } to { transform: translateY(-22px); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        .fade-up { animation: fadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #06090F; }
        ::-webkit-scrollbar-thumb { background: #1B3A6B; border-radius: 3px; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#06090F', position: 'relative', overflow: 'hidden' }}>
        <FloatingOrb size="600px" x="-10%" y="-5%"  color="radial-gradient(circle, rgba(27,58,107,0.5), transparent)"  blur="90px" duration="9s"  />
        <FloatingOrb size="400px" x="70%"  y="50%"  color="radial-gradient(circle, rgba(59,130,246,0.15), transparent)" blur="80px" duration="11s" />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none' }} />

        {/* Nav */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', background: 'rgba(6,9,15,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg, #1B3A6B, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontWeight: '800', fontSize: '18px', color: '#fff' }}>D</div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '18px', color: '#fff' }}>DeutschSchule</span>
          </div>
          {screen === 'test' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{index + 1} / {QUESTIONS.length}</span>
              <div style={{ width: '120px' }}><ProgressBar current={index} total={QUESTIONS.length} /></div>
            </div>
          )}
          <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', padding: '8px 18px', color: 'rgba(255,255,255,0.45)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}>
            <X size={13} strokeWidth={2} /> Exit
          </button>
        </div>

        {/* Content */}
        <div className="fade-up" style={{ paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '100%' }}>
            {screen === 'intro'  && <IntroScreen onStart={handleStart} />}
            {screen === 'test'   && (
              <QuestionScreen
                question={QUESTIONS[index]}
                index={index}
                total={QUESTIONS.length}
                selected={selected}
                onSelect={setSelected}
                onNext={() => advance(false)}
                onSkip={() => advance(true)}
                timeLeft={timeLeft}
              />
            )}
            {screen === 'result' && result && <ResultScreen result={result} navigate={navigate} saveStatus={saveStatus} />}
          </div>
        </div>
      </div>
    </>
  )
}