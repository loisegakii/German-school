import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Intersection hook ────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  blue:    '#3B82F6',
  navy:    '#1B3A6B',
  gold:    '#F59E0B',
  green:   '#10B981',
  bg:      '#06090F',
  surface: 'rgba(255,255,255,0.03)',
  border:  'rgba(255,255,255,0.07)',
  muted:   'rgba(255,255,255,0.4)',
  faint:   'rgba(255,255,255,0.06)',
}

// ─── FadeIn ───────────────────────────────────────────────────────────────────
const FadeIn = ({ children, delay = 0, y = 20, style = {} }) => {
  const [ref, inView] = useInView()
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : `translateY(${y}px)`,
      transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function useCounter(target, duration = 1800, startDelay = 500) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now()
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        setVal(Math.round(ease * target))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, startDelay)
    return () => clearTimeout(t)
  }, [target, duration, startDelay])
  return val
}

// ─── FLAGS — unchanged ────────────────────────────────────────────────────────
const KenyanFlag = ({ size = 100, tilt = 0 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
    <svg width={size} height={Math.round(size * 0.667)} viewBox="0 0 900 600"
      style={{ borderRadius: '6px', boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)', transform: `rotate(${tilt}deg)` }}>
      <rect width="900" height="200" y="0"   fill="#000" />
      <rect width="900" height="30"  y="200" fill="#fff" />
      <rect width="900" height="140" y="230" fill="#BB0000" />
      <rect width="900" height="30"  y="370" fill="#fff" />
      <rect width="900" height="200" y="400" fill="#006600" />
      <ellipse cx="450" cy="300" rx="75" ry="112" fill="#fff" />
      <ellipse cx="450" cy="300" rx="55" ry="90"  fill="#BB0000" />
      <rect x="442" y="188" width="16" height="224" fill="#000" rx="3" />
      <line x1="390" y1="175" x2="510" y2="425" stroke="#8B6914" strokeWidth="9" />
      <line x1="510" y1="175" x2="390" y2="425" stroke="#8B6914" strokeWidth="9" />
    </svg>
    <div style={{ display: 'flex', gap: '4px' }}>
      {['#000', '#BB0000', '#006600'].map(c => (
        <div key={c} style={{ width: '16px', height: '3px', background: c, borderRadius: '2px', opacity: 0.6 }} />
      ))}
    </div>
  </div>
)

const GermanFlag = ({ size = 100, tilt = 0 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
    <svg width={size} height={Math.round(size * 0.6)} viewBox="0 0 5 3"
      style={{ borderRadius: '6px', boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)', transform: `rotate(${tilt}deg)` }}>
      <rect width="5" height="1" y="0" fill="#111" />
      <rect width="5" height="1" y="1" fill="#C41E3A" />
      <rect width="5" height="1" y="2" fill="#F5C800" />
    </svg>
    <div style={{ display: 'flex', gap: '4px' }}>
      {['#111', '#C41E3A', '#F5C800'].map(c => (
        <div key={c} style={{ width: '16px', height: '3px', background: c, borderRadius: '2px', opacity: 0.6 }} />
      ))}
    </div>
  </div>
)

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ scrolled, navigate, setPage }) {
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300, height: '66px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 56px',
      background: scrolled ? 'rgba(6,9,15,0.97)' : 'transparent',
      backdropFilter: scrolled ? 'blur(28px) saturate(180%)' : 'none',
      borderBottom: scrolled ? `1px solid ${T.border}` : 'none',
      transition: 'background 0.45s ease, backdrop-filter 0.45s ease, border-color 0.45s ease',
    }}>

      {/* Wordmark */}
      <div onClick={() => setPage('home')} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ width: '37px', height: '37px', borderRadius: '9px', background: `linear-gradient(135deg, ${T.navy} 0%, ${T.blue} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px rgba(59,130,246,0.28), 0 0 0 1px rgba(59,130,246,0.2)`, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: '800', fontSize: '19px', color: '#fff', lineHeight: 1 }}>G</span>
        </div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '15px', color: '#fff', letterSpacing: '-0.3px' }}>German School</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9.5px', fontWeight: '700', color: T.blue, letterSpacing: '2.5px', textTransform: 'uppercase' }}>Online · Nairobi</div>
        </div>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {[['Levels', 'levels'], ['Exams', 'exams'], ['Pricing', 'pricing']].map(([label, id]) => (
          <button key={label} onClick={() => scrollTo(id)}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: '500', color: T.muted, background: 'transparent', border: 'none', padding: '7px 15px', borderRadius: '8px', cursor: 'pointer', transition: 'color 0.18s, background 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = T.faint }}
            onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.background = 'transparent' }}>
            {label}
          </button>
        ))}
        <button onClick={() => setPage('about')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: '500', color: T.muted, background: 'transparent', border: 'none', padding: '7px 15px', borderRadius: '8px', cursor: 'pointer', transition: 'color 0.18s, background 0.18s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = T.faint }}
          onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.background = 'transparent' }}>
          About
        </button>
      </div>

      {/* Auth */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={() => navigate('/login')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: '500', color: T.muted, background: 'transparent', border: `1px solid ${T.border}`, padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'color 0.18s, border-color 0.18s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)' }}
          onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border }}>
          Sign In
        </button>
        <button onClick={() => navigate('/register')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: '700', color: '#fff', background: `linear-gradient(135deg, ${T.navy}, ${T.blue})`, border: 'none', padding: '9px 22px', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 0 22px rgba(59,130,246,0.32)', transition: 'box-shadow 0.25s, transform 0.2s', whiteSpace: 'nowrap' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 36px rgba(59,130,246,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 22px rgba(59,130,246,0.32)'; e.currentTarget.style.transform = 'translateY(0)' }}>
          Start Free Trial →
        </button>
      </div>
    </nav>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero({ navigate }) {
  const [vis, setVis] = useState(false)
  const passRate = useCounter(82, 1800, 650)
  const students = useCounter(340, 2000, 700)

  useEffect(() => { setTimeout(() => setVis(true), 80) }, [])

  const a = (d = 0) => ({
    opacity: vis ? 1 : 0,
    transform: vis ? 'translateY(0)' : 'translateY(26px)',
    transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${d}s, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${d}s`,
  })

  return (
    <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 56px 80px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>

      {/* Atmospheric layers */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(27,58,107,0.55), transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,58,107,0.5), transparent)', left: '-8%', top: '-8%', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,102,0,0.08), transparent)', right: '5%', bottom: '20%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* Credential pill — replaces plain eyebrow */}
      <div style={{ ...a(0), marginBottom: '36px', display: 'inline-flex' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, borderRadius: '100px', overflow: 'hidden' }}>
          {[
            { dot: T.blue,  text: 'Goethe-Zertifikat Preparation' },
            { dot: T.gold,  text: 'TELC Certified' },
            { dot: T.green, text: 'Nairobi, Kenya' },
          ].map((item, i) => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 18px', borderRight: i < 2 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: item.dot, boxShadow: `0 0 6px ${item.dot}` }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Flags + headline — unchanged structure */}
      <div style={{ ...a(0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '52px', marginBottom: '28px', width: '100%', maxWidth: '960px' }}>
        <div style={{ flexShrink: 0, animation: vis ? 'flagFloat 4s ease-in-out infinite alternate' : 'none' }}>
          <KenyanFlag size={100} tilt={-4} />
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 5.5vw, 80px)', fontWeight: '800', lineHeight: '1.04', color: '#fff', letterSpacing: '-1.5px', margin: 0, flex: 1 }}>
          Master German.<br />
          <span style={{ background: `linear-gradient(135deg, #93C5FD 0%, ${T.blue} 50%, ${T.navy} 100%)`, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmer 5s linear infinite' }}>
            Master your Future.
          </span>
        </h1>
        <div style={{ flexShrink: 0, animation: vis ? 'flagFloat 4s ease-in-out infinite alternate-reverse' : 'none' }}>
          <GermanFlag size={100} tilt={4} />
        </div>
      </div>

      {/* Subheadline */}
      <p style={{ ...a(0.2), fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(15px, 1.8vw, 18px)', color: 'rgba(255,255,255,0.5)', maxWidth: '500px', lineHeight: '1.9', marginBottom: '40px' }}>
        Structured, exam-focused German learning — A1 to C2. Based in Nairobi.{' '}
        <strong style={{ color: 'rgba(255,255,255,0.78)', fontWeight: '600' }}>Start A1 completely free.</strong>
      </p>

      {/* CTAs */}
      <div style={{ ...a(0.28), display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '60px' }}>
        <button onClick={() => navigate('/placement-test')}
          style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.blue})`, color: '#fff', border: 'none', padding: '17px 44px', borderRadius: '100px', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 0 40px rgba(59,130,246,0.4)', transition: 'transform 0.25s, box-shadow 0.25s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 52px rgba(59,130,246,0.55)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(59,130,246,0.4)' }}>
          Take the Free Placement Test →
        </button>
        <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
          style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: `1px solid rgba(255,255,255,0.14)`, padding: '17px 44px', borderRadius: '100px', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', fontWeight: '500', cursor: 'pointer', transition: 'border-color 0.22s, color 0.22s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.32)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}>
          View Pricing
        </button>
      </div>

      {/* Stats strip — live animated counters */}
      <div style={{ ...a(0.42), display: 'flex', gap: '1px', background: T.border, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${T.border}`, maxWidth: '740px', width: '100%' }}>
        {[
          { val: `${passRate}%`, label: 'Exam Pass Rate',   sub: 'Simulation-track students' },
          { val: 'A1 → C2',     label: 'Full CEFR Path',   sub: '5 levels, 10 modules'      },
          { val: 'Goethe & TELC', label: 'Exams Covered',  sub: 'Both major providers'      },
          { val: 'Live Zoom',   label: 'Custom Plan',       sub: '1-on-1 with instructor'    },
        ].map(({ val, label, sub }) => (
          <div key={label} style={{ flex: 1, background: T.bg, padding: '22px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '5px', lineHeight: 1 }}>{val}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', color: T.blue, marginBottom: '3px' }}>{label}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: T.muted }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div style={{ position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)', opacity: 0.28, animation: 'scrollBounce 2s ease-in-out infinite', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: '#fff', letterSpacing: '2px', textTransform: 'uppercase' }}>Scroll</span>
        <div style={{ width: '1px', height: '28px', background: 'linear-gradient(#fff, transparent)' }} />
      </div>
    </section>
  )
}

// ─── LEVELS — editorial strip ─────────────────────────────────────────────────
function Levels() {
  const [active, setActive] = useState(2)

  const levels = [
    { code: 'A1', label: 'Beginner',          dur: '8–10 wks',  color: '#10B981', exam: 'Goethe A1 · TELC A1',  examNote: 'Required for family reunification visa', headline: 'Your first words in German.', summary: 'Build essential vocabulary, navigate everyday situations, and establish the foundation every other level rests on.', skills: ['Greet, introduce yourself, and use daily phrases', 'Handle transactions — shops, transport, offices', 'Understand simple written notices and signs', 'Ask and answer basic questions with confidence'], grammar: ['Present tense (Präsens)', 'Personal pronouns & articles', 'Negation: nicht / kein', 'Basic sentence structure'] },
    { code: 'A2', label: 'Elementary',         dur: '10–12 wks', color: '#34D399', exam: 'Goethe A2 · TELC A2',  examNote: 'Useful for integration courses', headline: 'Daily German, done well.', summary: 'Talk about the past, handle workplace basics, and communicate reliably in all routine situations.', skills: ['Describe past events and daily routines', 'Understand short texts, emails, and notices', 'Write simple messages and fill in forms', 'Talk about your work, home, and immediate world'], grammar: ['Simple past (Perfekt)', 'Modal verbs: können, müssen, dürfen', 'Accusative & dative cases', 'Comparative adjectives'] },
    { code: 'B1', label: 'Intermediate',       dur: '12–16 wks', color: '#3B82F6', exam: 'Goethe B1 · TELC B1',  examNote: 'Required for German citizenship application', headline: 'Work, live, and belong in Germany.', summary: 'B1 is the threshold of independence — you can handle most daily and professional situations without difficulty.', skills: ['Express opinions, argue a position, give reasons', 'Handle work situations and travel independently', 'Understand standard input on familiar topics', 'Write coherent texts on personal and work topics'], grammar: ['Konjunktiv II (basics)', 'Relative clauses', 'Passive voice (Passiv)', 'Two-way prepositions'] },
    { code: 'B2', label: 'Upper-Intermediate', dur: '16–20 wks', color: '#6366F1', exam: 'Goethe B2 · TELC B2',  examNote: 'Required for many professional licensing processes', headline: 'Professional fluency within reach.', summary: 'B2 makes German a professional tool — complex discussions, formal writing, and demanding workplace communication.', skills: ['Participate in meetings and professional discussions', 'Write reports, formal emails, and correspondence', 'Understand complex media — news, podcasts, lectures', 'Negotiate and express nuanced professional positions'], grammar: ['Extended participial phrases', 'Infinitive clauses with zu', 'Advanced Konjunktiv II', 'Discourse connectors for formal writing'] },
    { code: 'C1', label: 'Advanced',           dur: '20–24 wks', color: '#8B5CF6', exam: 'Goethe C1',            examNote: 'Accepted by German universities and regulated professions', headline: 'Speak with precision. Write with authority.', summary: 'At C1 you express yourself fluently and spontaneously, adapting your register to any professional or academic context.', skills: ['Produce clear, detailed texts on complex subjects', 'Communicate spontaneously with no searching for words', 'Understand demanding texts including implicit meaning', 'Operate confidently in academic and senior professional roles'], grammar: ['Nominalisation (Nominalisierung)', 'Advanced passive constructions', 'Extended modifier chains', 'Register and stylistic variation'] },
    { code: 'C2', label: 'Mastery',            dur: '24–30 wks', color: '#F59E0B', exam: 'Goethe C2 · GDS',     examNote: 'The highest internationally recognised German qualification', headline: 'Native-level command of German.', summary: 'C2 is complete mastery — you understand virtually everything, summarise complex sources effortlessly, and write with full stylistic authority.', skills: ['Read and produce academic, literary, and technical texts', 'Conduct high-level debates and expert-level presentations', 'Understand regional accents and idiomatic usage', 'Write with stylistic precision in any register or context'], grammar: ['Full stylistic and rhetorical command', 'Archaic and formal register', 'Complex clause architecture', 'Idiomatic and figurative language mastery'] },
  ]
  const lv = levels[active]

  return (
    <section id="levels" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${T.blue}44, transparent)` }} />

      {/* Section header */}
      <FadeIn style={{ maxWidth: '1200px', margin: '0 auto', padding: '96px 56px 52px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: T.muted, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '20px', height: '1px', background: T.muted }} />
              Curriculum · A1 to C2
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px, 4vw, 52px)', fontWeight: '800', color: '#fff', lineHeight: 1.06, letterSpacing: '-1px' }}>
              Six levels.<br />
              <em style={{ color: T.muted, fontWeight: '400' }}>One unbroken path.</em>
            </h2>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: T.muted, maxWidth: '340px', lineHeight: '1.85' }}>
            Every level is designed around the corresponding Goethe or TELC exam. Click a level to see the full syllabus, grammar scope, and exam details.
          </p>
        </div>
      </FadeIn>

      {/* Level selector strip */}
      <div style={{ display: 'flex', borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        {levels.map((l, i) => (
          <button key={l.code} onClick={() => setActive(i)}
            style={{ flex: 1, padding: '24px 8px', position: 'relative', background: active === i ? `${l.color}0C` : 'transparent', borderRight: i < 5 ? `1px solid ${T.border}` : 'none', border: 'none', cursor: 'pointer', transition: 'background 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2.5px', borderRadius: '0 0 2px 2px', background: active === i ? l.color : 'transparent', boxShadow: active === i ? `0 0 12px ${l.color}88` : 'none', transition: 'all 0.3s' }} />
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(16px, 2vw, 24px)', fontWeight: '800', color: active === i ? l.color : 'rgba(255,255,255,0.22)', transition: 'color 0.25s', lineHeight: 1 }}>{l.code}</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '600', color: active === i ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.16)', transition: 'color 0.25s' }}>{l.label}</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', color: active === i ? l.color : 'rgba(255,255,255,0.12)', transition: 'color 0.25s' }}>{l.dur}</span>
          </button>
        ))}
      </div>

      {/* Detail panel */}
      <div key={active} style={{ borderBottom: `1px solid ${T.border}`, background: `linear-gradient(150deg, ${lv.color}08 0%, transparent 50%)` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 56px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '52px' }}>

          {/* Col 1 — Overview */}
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '700', color: lv.color, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '14px' }}>Level {lv.code} · {lv.label}</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(18px, 2vw, 26px)', fontWeight: '800', color: '#fff', lineHeight: 1.2, marginBottom: '14px' }}>{lv.headline}</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.9', marginBottom: '28px' }}>{lv.summary}</p>
            <div style={{ background: `${lv.color}0D`, border: `1px solid ${lv.color}25`, borderLeft: `3px solid ${lv.color}`, borderRadius: '10px', padding: '18px 20px' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9.5px', fontWeight: '700', color: lv.color, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '7px' }}>Target Exam</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '5px' }}>{lv.exam}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.36)', lineHeight: '1.6' }}>{lv.examNote}</div>
            </div>
          </div>

          {/* Col 2 — Skills */}
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '700', color: T.muted, textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: '22px' }}>What You'll Be Able To Do</div>
            {lv.skills.map((s, j) => (
              <div key={s} style={{ display: 'flex', gap: '16px', padding: '14px 0', borderBottom: j < 3 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', fontWeight: '800', color: lv.color, flexShrink: 0, width: '22px', textAlign: 'right', paddingTop: '2px' }}>
                  {String(j + 1).padStart(2, '0')}
                </div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: 'rgba(255,255,255,0.66)', lineHeight: '1.7' }}>{s}</span>
              </div>
            ))}
          </div>

          {/* Col 3 — Grammar + enrol */}
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '700', color: T.muted, textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: '18px' }}>Grammar Scope</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '36px' }}>
              {lv.grammar.map(g => (
                <span key={g} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.62)', background: `${lv.color}0C`, border: `1px solid ${lv.color}20`, borderRadius: '6px', padding: '5px 11px' }}>{g}</span>
              ))}
            </div>
            <div style={{ height: '1px', background: T.border, marginBottom: '20px' }} />
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: T.muted, marginBottom: '18px', lineHeight: '1.7' }}>
              Duration: <strong style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>{lv.dur}</strong>
              <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>3–4 sessions per week recommended.
            </div>
            <button
              onClick={() => navigate(`/register?level=${lv.code}`)}
              style={{ display: 'block', width: '100%', padding: '15px', borderRadius: '10px', background: lv.color, border: 'none', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'opacity 0.2s, transform 0.2s', boxShadow: `0 0 24px ${lv.color}30` }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}>
              Enrol at {lv.code} →
            </button>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: T.muted, textAlign: 'center', marginTop: '10px' }}>
              {lv.code === 'A1' ? '7-day free trial — no card required' : 'Not sure? Take the free placement test first.'}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── EXAM PROVIDERS ───────────────────────────────────────────────────────────
function ExamProviders() {
  const [active, setActive] = useState(0)

  const providers = [
    {
      name: 'Goethe-Institut', logo: 'G', color: T.blue,
      subtitle: "Germany's official language certification — accepted worldwide",
      description: "The Goethe-Zertifikat is issued by Germany's official cultural institute and recognised in 100+ countries by immigration authorities, universities, and professional licensing bodies. It carries no expiry date and is the gold standard for German certification.",
      levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      uses: [
        { label: 'Family Reunification Visa', level: 'A1' },
        { label: 'Integration Course Completion', level: 'A2' },
        { label: 'German Citizenship Application', level: 'B1' },
        { label: 'University Admission', level: 'C1' },
        { label: 'Highest Academic Qualification', level: 'C2' },
      ],
      note: 'Our full curriculum is structured around the official Goethe exam format at every level.',
    },
    {
      name: 'TELC Deutsch', logo: 'T', color: T.gold,
      subtitle: 'Trusted for healthcare, integration, and professional licensing',
      description: 'TELC (The European Language Certificates) is widely accepted by German immigration authorities and the preferred pathway for healthcare workers, integration programmes, and vocational training. TELC is offered A1 through C1.',
      levels: ['A1', 'A2', 'B1', 'B2', 'C1'],
      uses: [
        { label: 'Nursing & Healthcare Licensing', level: 'B2' },
        { label: 'Integration & Naturalisation', level: 'B1' },
        { label: 'Vocational Training (Ausbildung)', level: 'A2–B1' },
        { label: 'Employer Verification', level: 'B2' },
        { label: 'Academic Entry (select programmes)', level: 'C1' },
      ],
      note: 'We prepare students for TELC exams on request — tell us your target and we align your learning plan.',
    },
  ]
  const p = providers[active]

  return (
    <section id="exams" style={{ padding: '96px 0', position: 'relative', background: 'rgba(255,255,255,0.012)' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${T.blue}55, transparent)` }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 56px' }}>

        <FadeIn style={{ marginBottom: '52px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: T.muted, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '20px', height: '1px', background: T.muted }} />
                Exam Preparation
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 50px)', fontWeight: '800', color: '#fff', lineHeight: 1.08, letterSpacing: '-0.5px' }}>
                Which exam are you<br />preparing for?
              </h2>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: T.muted, maxWidth: '360px', lineHeight: '1.85' }}>
              We prepare students for both Goethe-Zertifikat and TELC Deutsch. Tell us your target and we align your entire learning path accordingly.
            </p>
          </div>
        </FadeIn>

        {/* Provider tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '32px' }}>
          {providers.map((pv, i) => (
            <button key={pv.name} onClick={() => setActive(i)}
              style={{ padding: '11px 36px', borderRadius: '10px', border: `1.5px solid ${active === i ? pv.color : T.border}`, background: active === i ? `${pv.color}10` : T.surface, cursor: 'pointer', transition: 'all 0.25s', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', color: active === i ? '#fff' : T.muted }}>
              {pv.name}
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', background: `${p.color}06`, border: `1px solid ${p.color}20`, borderRadius: '20px', padding: '44px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', background: p.color }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: `linear-gradient(135deg, ${T.navy}, ${p.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontWeight: '800', fontSize: '20px', color: '#fff', boxShadow: `0 0 18px ${p.color}28`, flexShrink: 0 }}>{p.logo}</div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '800', color: '#fff', lineHeight: 1.1 }}>{p.name}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: p.color, marginTop: '2px' }}>{p.subtitle}</div>
              </div>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.9', marginBottom: '24px' }}>{p.description}</p>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '700', color: T.muted, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Available Levels</div>
            <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
              {p.levels.map(l => (
                <span key={l} style={{ fontFamily: "'Playfair Display', serif", fontSize: '12px', fontWeight: '800', color: p.color, background: `${p.color}14`, border: `1px solid ${p.color}28`, borderRadius: '7px', padding: '4px 10px' }}>{l}</span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '700', color: T.muted, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '18px' }}>Common Use Cases</div>
            {p.uses.map((uc, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: i < p.uses.length - 1 ? `1px solid ${T.border}` : 'none', gap: '12px' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: 'rgba(255,255,255,0.62)' }}>{uc.label}</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', fontWeight: '800', color: p.color, background: `${p.color}14`, border: `1px solid ${p.color}28`, borderRadius: '6px', padding: '3px 9px', flexShrink: 0 }}>{uc.level}</span>
              </div>
            ))}
            <div style={{ marginTop: '20px', padding: '14px 16px', background: `${p.color}07`, border: `1px solid ${p.color}18`, borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.44)', lineHeight: 1.75 }}>
              {p.note}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── PRICING SVGs — Goethe-style, 100% preserved ─────────────────────────────
const GfxA = () => (
  <svg viewBox="0 0 480 260" width="100%" style={{ display: 'block' }}>
    <rect width="480" height="260" fill="#F5C800" />
    <polygon points="0,68 312,68 374,130 312,192 0,192 62,130" fill="#D4AA00" transform="translate(10,9)" />
    <polygon points="0,65 312,65 378,130 312,195 0,195 62,130" fill="#1B3A6B" />
    <text x="190" y="133" textAnchor="middle" dominantBaseline="middle"
      fontFamily="'DM Sans',Arial,sans-serif" fontWeight="900" fontSize="64" fill="#fff" letterSpacing="1">A1 | A2</text>
  </svg>
)
const GfxB = () => (
  <svg viewBox="0 0 480 260" width="100%" style={{ display: 'block' }}>
    <rect width="480" height="260" fill="#1B3A6B" />
    <polygon points="170,-20 338,130 170,280   2,130" fill="#E8734A" />
    <polygon points="310,-20 478,130 310,280 142,130" fill="#E8734A" />
    <text x="240" y="133" textAnchor="middle" dominantBaseline="middle"
      fontFamily="'DM Sans',Arial,sans-serif" fontWeight="900" fontSize="64" fill="#1B3A6B" letterSpacing="1">B1 | B2</text>
  </svg>
)
const GfxC = () => (
  <svg viewBox="0 0 480 260" width="100%" style={{ display: 'block' }}>
    <rect width="480" height="260" fill="#F5C800" />
    <polygon points="170,-20 338,130 170,280   2,130" fill="#22C4DC" />
    <polygon points="310,-20 478,130 310,280 142,130" fill="#22C4DC" />
    <text x="240" y="133" textAnchor="middle" dominantBaseline="middle"
      fontFamily="'DM Sans',Arial,sans-serif" fontWeight="900" fontSize="64" fill="#1B3A6B" letterSpacing="1">C1 | C2</text>
  </svg>
)

// ─── PRICING ──────────────────────────────────────────────────────────────────
function PricingCard({ mod, isHov, onEnter, onLeave, navigate }) {
  const Gfx = mod.gfx
  return (
    <FadeIn delay={mod.delay}>
      <div onMouseEnter={onEnter} onMouseLeave={onLeave}
        style={{ borderRadius: '16px', overflow: 'hidden', cursor: 'default', transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)', transform: isHov ? 'translateY(-10px)' : 'translateY(0)', boxShadow: isHov ? `0 32px 60px rgba(0,0,0,0.65), 0 0 0 1.5px ${mod.accent}` : '0 4px 24px rgba(0,0,0,0.38)' }}>

        {/* SVG header — Goethe-style, preserved */}
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <Gfx />
          {mod.trialBadge && (
            <div style={{ position: 'absolute', top: '14px', right: '14px', background: T.green, color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '800', padding: '5px 13px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 4px 14px rgba(16,185,129,0.45)' }}>
              {mod.trialBadge}
            </div>
          )}
        </div>

        {/* Card body */}
        <div style={{ background: '#0C1220', borderTop: `2px solid ${mod.accent}`, padding: '22px 22px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{mod.label}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: T.muted, marginTop: '4px' }}>{mod.sublabel}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '800', color: mod.priceCol, lineHeight: 1 }}>${mod.price}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', color: T.muted, marginTop: '3px' }}>{mod.trialBadge ? 'First 7 days free' : 'per module'}</div>
            </div>
          </div>

          {/* Sub-module chips */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            {mod.chips.map(s => (
              <div key={s} style={{ flex: 1, padding: '9px 4px', borderRadius: '9px', textAlign: 'center', background: mod.chipBg, border: `1px solid ${mod.chipBorder}` }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '800', color: mod.accent }}>{s}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: T.muted, marginTop: '2px' }}>2 months</div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: T.border, marginBottom: '14px' }} />

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.44)', lineHeight: '1.75', marginBottom: '14px' }}>{mod.desc}</p>

          <div style={{ marginBottom: '18px' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '600', color: mod.accent, background: mod.chipBg, border: `1px solid ${mod.chipBorder}`, borderRadius: '6px', padding: '3px 10px' }}>{mod.exam}</span>
          </div>

          <button onClick={() => navigate(`/register?level=${mod.id}`)}
            style={{ width: '100%', padding: '14px 10px', borderRadius: '10px', border: 'none', background: mod.btnBg, color: mod.btnColor, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '800', cursor: 'pointer', transition: 'opacity 0.2s', opacity: isHov ? 1 : 0.9 }}>
            {mod.cta}
          </button>
          {mod.ctaSub && (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: T.muted, textAlign: 'center', marginTop: '9px' }}>{mod.ctaSub}</div>
          )}
        </div>
      </div>
    </FadeIn>
  )
}

function Pricing({ navigate }) {
  const [hovered, setHovered] = useState(null)

  const LEVELS = [
    { id: 'A1', label: 'A1', sublabel: 'Beginner',           gfx: GfxA, chips: ['A1-1','A1-2'], price: 200, trialBadge: '7-Day Free Trial', priceCol: '#1B3A6B', accent: '#1B3A6B', chipBg: 'rgba(27,58,107,0.14)',   chipBorder: 'rgba(27,58,107,0.3)',   btnBg: '#1B3A6B', btnColor: '#F5C800', exam: 'Goethe · TELC A1', desc: 'Greetings, numbers, daily phrases — the perfect foundation for your German journey.',               cta: 'Begin Your Journey — Free', ctaSub: 'First 7 days free · then $200/module', delay: 0    },
    { id: 'A2', label: 'A2', sublabel: 'Elementary',          gfx: GfxA, chips: ['A2-1','A2-2'], price: 250, trialBadge: null,               priceCol: '#E8734A', accent: '#E8734A', chipBg: 'rgba(232,115,74,0.12)', chipBorder: 'rgba(232,115,74,0.28)', btnBg: '#E8734A', btnColor: '#fff',    exam: 'Goethe · TELC A2', desc: 'Past tense, daily routines, workplace basics, and simple reading comprehension.',              cta: 'Enrol in A2 →',              ctaSub: null,                           delay: 0.08 },
    { id: 'B1', label: 'B1', sublabel: 'Intermediate',        gfx: GfxB, chips: ['B1-1','B1-2'], price: 300, trialBadge: null,               priceCol: '#3B82F6', accent: '#3B82F6', chipBg: 'rgba(59,130,246,0.12)', chipBorder: 'rgba(59,130,246,0.28)', btnBg: '#3B82F6', btnColor: '#fff',    exam: 'Goethe · TELC B1', desc: 'Express opinions fluently — required for German citizenship. Work-ready German.',             cta: 'Enrol in B1 →',              ctaSub: null,                           delay: 0.16 },
    { id: 'B2', label: 'B2', sublabel: 'Upper-Intermediate',  gfx: GfxB, chips: ['B2-1','B2-2'], price: 350, trialBadge: null,               priceCol: '#E8734A', accent: '#E8734A', chipBg: 'rgba(232,115,74,0.12)', chipBorder: 'rgba(232,115,74,0.28)', btnBg: '#1B3A6B', btnColor: '#fff',    exam: 'Goethe · TELC B2', desc: 'Complex discussions, professional German, healthcare & nursing exam pathway.',                 cta: 'Enrol in B2 →',              ctaSub: null,                           delay: 0.24 },
    { id: 'C',  label: 'C1 / C2', sublabel: 'Advanced · Mastery', gfx: GfxC, chips: ['C1','C2'], price: 400, trialBadge: null,               priceCol: '#22C4DC', accent: '#22C4DC', chipBg: 'rgba(34,196,220,0.1)',  chipBorder: 'rgba(34,196,220,0.25)', btnBg: '#22C4DC', btnColor: '#1B3A6B', exam: 'Goethe C1 · C2',    desc: 'Academic and near-native German — university admission and elite professional roles.',            cta: 'Enrol in C1 / C2 →',        ctaSub: null,                           delay: 0.32 },
  ]

  return (
    <section id="pricing" style={{ padding: '96px 0 80px', position: 'relative', background: T.bg }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 56px' }}>

        {/* Header — now includes context and trust tags */}
        <FadeIn style={{ marginBottom: '52px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '28px' }}>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: T.muted, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '20px', height: '1px', background: T.muted }} />
                Pricing
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px, 4vw, 52px)', fontWeight: '800', color: '#fff', lineHeight: 1.06, letterSpacing: '-0.5px' }}>
                Pay per level.<br />
                <em style={{ color: T.muted, fontWeight: '400' }}>Progress at your pace.</em>
              </h2>
            </div>
            <div style={{ maxWidth: '360px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: T.muted, lineHeight: '1.85', marginBottom: '16px' }}>
                Each level is two modules of structured study. Pay for what you need, then continue when you're ready. Add live instructor sessions to any module at any time.
              </p>
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                {['A1 trial — free', 'Cancel any time', 'Invoice available'].map(tag => (
                  <span key={tag} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '600', color: T.green, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', padding: '4px 11px' }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Cards row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
          {LEVELS.slice(0, 3).map(mod => (
            <PricingCard key={mod.id} mod={mod} isHov={hovered === mod.id}
              onEnter={() => setHovered(mod.id)} onLeave={() => setHovered(null)} navigate={navigate} />
          ))}
        </div>

        {/* Cards row 2 — centred */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', maxWidth: '808px', margin: '0 auto 36px' }}>
          {LEVELS.slice(3).map(mod => (
            <PricingCard key={mod.id} mod={mod} isHov={hovered === mod.id}
              onEnter={() => setHovered(mod.id)} onLeave={() => setHovered(null)} navigate={navigate} />
          ))}
        </div>

        {/* Custom Plan — premium treatment */}
        <FadeIn delay={0.42}>
          <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.015))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '18px', overflow: 'hidden' }}>
            <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent 0%, #F59E0B 25%, #FBBF24 75%, transparent 100%)' }} />
            <div style={{ padding: '36px 44px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '44px', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '800', color: T.gold, letterSpacing: '3px', textTransform: 'uppercase' }}>Custom Plan</div>
                  <div style={{ height: '1px', width: '18px', background: T.gold, opacity: 0.35 }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(245,158,11,0.65)' }}>Add-on to any level module</span>
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(18px, 2vw, 24px)', fontWeight: '800', color: '#fff', lineHeight: 1.25, marginBottom: '12px' }}>
                  Live 1-on-1 Zoom sessions with a certified German instructor.
                </h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: T.muted, lineHeight: '1.82', maxWidth: '540px', marginBottom: '18px' }}>
                  Your instructor personalises your pace, runs speaking exam simulations, gives real-time feedback, and keeps you accountable week to week. Sessions are flexibly scheduled across East Africa time zones.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Speaking exam prep', 'Personalised study plan', 'Direct instructor messaging', 'Session recordings', 'Flexible scheduling'].map(f => (
                    <span key={f} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(245,158,11,0.7)', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: '6px', padding: '4px 11px' }}>{f}</span>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: 'center', flexShrink: 0, minWidth: '210px' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '700', color: T.muted, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Starting from</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '52px', fontWeight: '800', color: T.gold, lineHeight: 1, marginBottom: '4px' }}>$149</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: T.muted, marginBottom: '22px' }}>/ month · billed alongside your module</div>
                <button onClick={() => navigate('/register?plan=custom')}
                  style={{ width: '100%', padding: '14px 20px', borderRadius: '10px', border: `1.5px solid ${T.gold}`, background: 'transparent', color: T.gold, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.22s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.gold; e.currentTarget.style.color = '#1A0D00' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.gold }}>
                  Request Custom Plan →
                </button>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: T.muted, marginTop: '10px' }}>Instructor matched within 24 hours</div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Trust row */}
        <FadeIn delay={0.5} style={{ display: 'flex', justifyContent: 'center', gap: '28px', flexWrap: 'wrap', marginTop: '28px', paddingTop: '24px', borderTop: `1px solid ${T.border}` }}>
          {['🔒 Secure checkout', '↩ Cancel any time', '🎓 A1 — 7-day free trial', '💳 No card for trial', '📩 Invoice on request'].map(item => (
            <div key={item} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: T.muted }}>{item}</div>
          ))}
        </FadeIn>
      </div>
    </section>
  )
}

// ─── FINAL CTA ────────────────────────────────────────────────────────────────
function FinalCTA({ navigate }) {
  return (
    <section style={{ padding: '100px 56px', textAlign: 'center', background: 'rgba(27,58,107,0.08)', borderTop: `1px solid rgba(59,130,246,0.12)`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: '900px', height: '900px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,58,107,0.5), transparent)', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', filter: 'blur(110px)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <FadeIn>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: T.muted, marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <div style={{ width: '20px', height: '1px', background: T.muted }} />
            Begin Today — It's Free
            <div style={{ width: '20px', height: '1px', background: T.muted }} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 5.5vw, 68px)', fontWeight: '800', color: '#fff', lineHeight: 1.04, marginBottom: '18px', letterSpacing: '-1px' }}>
            Find your level.<br />Build your future.
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '17px', color: T.muted, maxWidth: '400px', margin: '0 auto 44px', lineHeight: '1.85' }}>
            15-minute placement test. Personalised path. No credit card required.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/placement-test')}
              style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.blue})`, color: '#fff', border: 'none', padding: '18px 50px', borderRadius: '100px', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 0 44px rgba(59,130,246,0.4)', transition: 'transform 0.25s, box-shadow 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 56px rgba(59,130,246,0.55)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 44px rgba(59,130,246,0.4)' }}>
              Take the Free Placement Test →
            </button>
            <button onClick={() => navigate('/login')}
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.65)', border: `1px solid rgba(255,255,255,0.14)`, padding: '18px 50px', borderRadius: '100px', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', fontWeight: '500', cursor: 'pointer', transition: 'border-color 0.22s, color 0.22s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}>
              I have an account
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({ navigate, setPage }) {
  return (
    <footer style={{ borderTop: `1px solid ${T.border}`, padding: '60px 56px 36px', background: T.bg }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px', marginBottom: '48px' }}>
        <div>
          <div onClick={() => setPage('home')} style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '16px', cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: `linear-gradient(135deg, ${T.navy}, ${T.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: '800', fontSize: '17px', color: '#fff' }}>G</span>
            </div>
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '14px', fontWeight: '700', color: '#fff', letterSpacing: '-0.2px' }}>German School Online</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9.5px', fontWeight: '700', color: T.blue, letterSpacing: '2px', textTransform: 'uppercase' }}>Nairobi · Kenya</div>
            </div>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: T.muted, lineHeight: '1.85', maxWidth: '225px', marginBottom: '18px' }}>
            Exam-focused German learning — preparing students across East Africa for Goethe and TELC certifications.
          </p>
          <div style={{ display: 'flex', gap: '3px' }}>
            {['#111', '#C41E3A', '#F59E0B'].map(c => <div key={c} style={{ width: '18px', height: '4px', background: c, borderRadius: '2px' }} />)}
          </div>
        </div>

        {[
          { title: 'Platform', items: ['Courses', 'Placement Test', 'Exam Prep', 'Pricing'] },
          { title: 'Exams',    items: ['Goethe-Institut', 'TELC Deutsch', 'A1 → C2 Path', 'Exam Dates'] },
          { title: 'Company',  items: [{ label: 'About Us', action: () => setPage('about') }, { label: 'Contact', action: null }, { label: 'Privacy', action: null }, { label: 'Terms', action: null }] },
        ].map(col => (
          <div key={col.title}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: '16px' }}>{col.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {col.items.map(item => {
                const label  = typeof item === 'string' ? item : item.label
                const action = typeof item === 'object' ? item.action : null
                return (
                  <span key={label} onClick={action}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: T.muted, cursor: action ? 'pointer' : 'default', transition: 'color 0.18s' }}
                    onMouseEnter={e => { if (action) e.target.style.color = '#fff' }}
                    onMouseLeave={e => e.target.style.color = T.muted}>
                    {label}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.18)' }}>© 2026 German School Online. All rights reserved.</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.18)' }}>Goethe-Zertifikat & TELC preparation · Nairobi, Kenya</div>
      </div>
    </footer>
  )
}

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────
function AboutPage({ navigate, setPage }) {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingTop: '80px' }}>
      <section style={{ padding: '72px 56px 56px', maxWidth: '980px', margin: '0 auto', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(27,58,107,0.4), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '26px' }}>
            {['#111', '#C41E3A', '#F59E0B'].map(c => <div key={c} style={{ width: '18px', height: '3px', background: c, borderRadius: '2px' }} />)}
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: T.muted, marginLeft: '6px' }}>About Us</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: '800', color: '#fff', lineHeight: 1.04, marginBottom: '24px', letterSpacing: '-1px' }}>
            German School Online.<br />
            <em style={{ color: T.muted, fontWeight: '400' }}>Built to get you certified.</em>
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: 'rgba(255,255,255,0.52)', lineHeight: '1.9', maxWidth: '600px', borderLeft: `3px solid ${T.blue}`, paddingLeft: '22px' }}>
            German School Online is a structured, exam-focused learning programme preparing students across Kenya and East Africa to pass internationally recognised German language certifications — primarily the <strong style={{ color: 'rgba(255,255,255,0.82)' }}>Goethe-Zertifikat</strong> and <strong style={{ color: 'rgba(255,255,255,0.82)' }}>TELC Deutsch</strong>.
          </p>
        </div>
      </section>

      <section style={{ padding: '0 56px 80px', maxWidth: '980px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          {[
            { color: T.blue, label: 'Our Mission', title: 'One goal: help every student pass their German exam.', body: 'Every curriculum decision, every lesson structure, every exercise — is built with one outcome in mind: your certification. We do not teach German casually. We prepare you deliberately.' },
            { color: T.gold, label: 'Our Approach', title: 'Module by module. Exam by exam.', body: 'Students progress through structured modules — two per level, A1 through C2. Each module builds directly toward the corresponding exam, with mock tests, graded exercises, and live instructor support at every stage.' },
          ].map(card => (
            <div key={card.label} style={{ background: `${card.color}07`, border: `1px solid ${card.color}18`, borderRadius: '16px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: card.color }} />
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '700', color: card.color, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '14px' }}>{card.label}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: '#fff', lineHeight: 1.2, marginBottom: '14px' }}>{card.title}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.85' }}>{card.body}</p>
            </div>
          ))}
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '40px', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: '800', color: '#fff', marginBottom: '30px', letterSpacing: '-0.3px' }}>How It Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '28px' }}>
            {[
              { n: '01', title: 'Take the Placement Test', desc: 'A free 15-minute test places you at A1, A2, B1, or higher — wherever you genuinely belong.' },
              { n: '02', title: 'Choose Your Module',      desc: 'Select A1-1, A1-2, A2-1, etc. A1 students start with a 7-day free trial, no card required.' },
              { n: '03', title: 'Study with Purpose',      desc: 'Video lessons, graded exercises, and mock exams structured around the real exam format.' },
              { n: '04', title: 'Sit Your Exam',           desc: 'We guide you to register for Goethe or TELC — whichever certification you are targeting.' },
            ].map(s => (
              <div key={s.n}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '800', color: T.blue, opacity: 0.28, marginBottom: '11px', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>{s.title}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: T.muted, lineHeight: '1.78' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(27,58,107,0.12)', border: `1px solid rgba(59,130,246,0.16)`, borderRadius: '16px' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>Ready to start your German journey?</div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: T.muted, marginBottom: '26px' }}>Take the free placement test and we'll build your personalised path.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={() => navigate('/placement-test')}
              style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.blue})`, color: '#fff', border: 'none', padding: '14px 38px', borderRadius: '100px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 0 28px rgba(59,130,246,0.35)' }}>
              Take the Placement Test →
            </button>
            <button onClick={() => setPage('home')}
              style={{ background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, padding: '14px 38px', borderRadius: '100px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', cursor: 'pointer', transition: 'all 0.22s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border }}>
              ← Back to Home
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [page, setPage] = useState('home')

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [page])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,800;1,400;1,700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: #06090F; color: #fff; overflow-x: hidden; }
        @keyframes shimmer      { 0%   { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes scrollBounce { 0%,100% { transform: translateX(-50%) translateY(0);    opacity: 0.28; }
                                  50%      { transform: translateX(-50%) translateY(10px); opacity: 0.48; } }
        @keyframes flagFloat    { 0% { transform: translateY(0); } 100% { transform: translateY(-8px); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #06090F; }
        ::-webkit-scrollbar-thumb { background: #1B3A6B; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #3B82F6; }
        ::selection { background: rgba(59,130,246,0.3); color: #fff; }
      `}</style>

      <Navbar scrolled={scrolled} navigate={navigate} setPage={setPage} />

      {page === 'home' && (
        <>
          <Hero navigate={navigate} />
          <Levels />
          <ExamProviders />
          <Pricing navigate={navigate} />
          <FinalCTA navigate={navigate} />
        </>
      )}
      {page === 'about' && <AboutPage navigate={navigate} setPage={setPage} />}

      <Footer navigate={navigate} setPage={setPage} />
    </>
  )
}