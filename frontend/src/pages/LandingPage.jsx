import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Intersection observer hook ───────────────────────────────────────────────
function useInView(threshold = 0.1) {
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

// ─── Animated counter ─────────────────────────────────────────────────────────
function useCounter(target, duration = 1800, startDelay = 600) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now()
      const tick = now => {
        const p = Math.min((now - start) / duration, 1)
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * target))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, startDelay)
    return () => clearTimeout(t)
  }, [target, duration, startDelay])
  return val
}

// ─── Design tokens — DARK NAVY THEME ─────────────────────────────────────────
const T = {
  // Background layers (dark navy palette)
  bg:          '#0D1F3C',      // deepest navy — main page bg
  bgAlt:       '#122244',      // slightly lighter navy for alternating sections
  bgCard:      '#1B3A6B',      // card surface (matches old FinalCTA)
  bgCardHigh:  '#1e4080',      // slightly elevated card
  bgNavy:      '#0A1828',      // darkest — footer

  // Text
  ink:         '#F0F4FF',      // near-white primary text
  inkMid:      '#B8C9E8',      // medium muted text
  inkLight:    '#6E89B5',      // dimmed text

  // Brand blues
  navy:        '#1B3A6B',
  blue:        '#3B82F6',      // brighter blue for dark bg
  blueLight:   'rgba(59,130,246,0.12)',
  blueBorder:  'rgba(59,130,246,0.25)',

  // Accents
  gold:        '#F59E0B',
  goldLight:   'rgba(245,158,11,0.12)',
  goldBorder:  'rgba(245,158,11,0.28)',
  green:       '#10B981',
  greenLight:  'rgba(16,185,129,0.12)',
  greenBorder: 'rgba(16,185,129,0.28)',
  coral:       '#F97316',
  cyan:        '#22D3EE',

  // Borders
  border:      'rgba(255,255,255,0.07)',
  borderMid:   'rgba(255,255,255,0.14)',
}

// ─── FadeIn ───────────────────────────────────────────────────────────────────
const FadeIn = ({ children, delay = 0, y = 18, style = {} }) => {
  const [ref, inView] = useInView()
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'none' : `translateY(${y}px)`,
      transition: `opacity .7s cubic-bezier(.16,1,.3,1) ${delay}s, transform .7s cubic-bezier(.16,1,.3,1) ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── FLAGS ────────────────────────────────────────────────────────────────────
const KenyanFlag = ({ size = 100, tilt = 0 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <svg width={size} height={Math.round(size * .667)} viewBox="0 0 900 600"
      style={{ borderRadius: 6, boxShadow: '0 6px 24px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.08)', transform: `rotate(${tilt}deg)`, display: 'block' }}>
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
    <div style={{ display: 'flex', gap: 3 }}>
      {['#000','#BB0000','#006600'].map(c => (
        <div key={c} style={{ width: 14, height: 3, background: c, borderRadius: 2, opacity: .55 }} />
      ))}
    </div>
  </div>
)

const GermanFlag = ({ size = 100, tilt = 0 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <svg width={size} height={Math.round(size * .6)} viewBox="0 0 5 3"
      style={{ borderRadius: 6, boxShadow: '0 6px 24px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.08)', transform: `rotate(${tilt}deg)`, display: 'block' }}>
      <rect width="5" height="1" y="0" fill="#222" />
      <rect width="5" height="1" y="1" fill="#C41E3A" />
      <rect width="5" height="1" y="2" fill="#F5C800" />
    </svg>
    <div style={{ display: 'flex', gap: 3 }}>
      {['#222','#C41E3A','#F5C800'].map(c => (
        <div key={c} style={{ width: 14, height: 3, background: c, borderRadius: 2, opacity: .55 }} />
      ))}
    </div>
  </div>
)

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ scrolled, navigate, setPage }) {
  const [open, setOpen] = useState(false)
  const scrollTo = id => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setOpen(false) }

  const linkStyle = (base = {}) => ({
    fontFamily: "'DM Sans',sans-serif",
    fontSize: 13.5,
    fontWeight: 600,
    color: T.inkLight,
    background: 'transparent',
    border: 'none',
    padding: '7px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'color .25s, background .25s',
    ...base,
  })

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300, height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px,4vw,52px)',
        background: scrolled ? 'rgba(13,31,60,.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(18px) saturate(180%)' : 'none',
        borderBottom: scrolled ? `1px solid ${T.border}` : 'none',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,.3)' : 'none',
        transition: 'all .4s',
      }}>

        {/* Wordmark */}
        <div onClick={() => { setPage('home'); setOpen(false) }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg,${T.blue},#60A5FA)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 16px rgba(59,130,246,.4)', flexShrink: 0 }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 18, color: '#fff' }}>G</span>
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 14, color: T.ink, letterSpacing: '-.2px' }}>German School</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, color: T.blue, letterSpacing: '2px', textTransform: 'uppercase' }}>Online · Nairobi</div>
          </div>
        </div>

        {/* Desktop nav links */}
        <div className="gsol-desktop" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[['Levels','levels'],['Exams','exams'],['Pricing','pricing']].map(([l, id]) => (
            <button key={l} onClick={() => scrollTo(id)} style={linkStyle()}
              onMouseEnter={e => { e.currentTarget.style.color = T.ink; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.color = T.inkLight; e.currentTarget.style.background = 'transparent' }}>
              {l}
            </button>
          ))}
          <button onClick={() => { setPage('about'); setOpen(false) }} style={linkStyle()}
            onMouseEnter={e => { e.currentTarget.style.color = T.ink; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = T.inkLight; e.currentTarget.style.background = 'transparent' }}>
            About
          </button>
        </div>

        {/* Desktop auth */}
        <div className="gsol-desktop" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => navigate('/login')}
            style={linkStyle({ border: `1px solid ${T.borderMid}`, color: T.inkMid, padding: '8px 18px' })}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.color = T.ink }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderMid; e.currentTarget.style.color = T.inkMid }}>
            Sign In
          </button>
          <button onClick={() => navigate('/register')}
            style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, fontWeight: 700, color: '#fff', background: `linear-gradient(135deg,${T.blue},#60A5FA)`, border: 'none', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 16px rgba(59,130,246,.4)', transition: 'transform .25s, box-shadow .25s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(59,130,246,.55)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(59,130,246,.4)' }}>
            Start Free Trial →
          </button>
        </div>

        {/* Hamburger */}
        <button className="gsol-mobile" onClick={() => setOpen(v => !v)} aria-label="Menu"
          style={{ background: 'transparent', border: `1px solid ${T.borderMid}`, borderRadius: 8, width: 40, height: 40, cursor: 'pointer', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 0, flexShrink: 0 }}>
          {[0,1,2].map(i => (
            <span key={i} style={{ display: 'block', width: 18, height: 2, background: T.ink, borderRadius: 2, transition: 'all .28s',
              transform: open&&i===0?'rotate(45deg) translate(4px,5px)':open&&i===1?'scaleX(0)':open&&i===2?'rotate(-45deg) translate(4px,-5px)':'none',
              opacity: open&&i===1?0:1,
            }} />
          ))}
        </button>
      </nav>

      {/* Mobile drawer */}
      <div style={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 299, background: '#0D1F3C', borderBottom: `1px solid ${T.border}`, boxShadow: '0 8px 32px rgba(0,0,0,.3)', transform: open?'translateY(0)':'translateY(-8px)', opacity: open?1:0, pointerEvents: open?'auto':'none', transition: 'transform .3s cubic-bezier(.16,1,.3,1), opacity .3s', padding: '8px 20px 20px' }}>
        {[['Levels','levels'],['Exams','exams'],['Pricing','pricing']].map(([l, id]) => (
          <button key={l} onClick={() => scrollTo(id)}
            style={{ display: 'block', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 600, color: T.inkMid, background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, padding: '15px 0', cursor: 'pointer' }}>
            {l}
          </button>
        ))}
        <button onClick={() => { setPage('about'); setOpen(false) }}
          style={{ display: 'block', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 600, color: T.inkMid, background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, padding: '15px 0', cursor: 'pointer' }}>
          About
        </button>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={() => { navigate('/login'); setOpen(false) }}
            style={{ flex: 1, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, color: T.inkMid, background: 'transparent', border: `1px solid ${T.borderMid}`, padding: 12, borderRadius: 8, cursor: 'pointer' }}>
            Sign In
          </button>
          <button onClick={() => { navigate('/register'); setOpen(false) }}
            style={{ flex: 2, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: '#fff', background: `linear-gradient(135deg,${T.blue},#60A5FA)`, border: 'none', padding: 12, borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 12px rgba(59,130,246,.4)' }}>
            Start Free Trial →
          </button>
        </div>
      </div>
    </>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero({ navigate }) {
  const [vis, setVis] = useState(false)
  const passRate = useCounter(82, 1800, 700)
  useEffect(() => { setTimeout(() => setVis(true), 80) }, [])

  const a = d => ({
    opacity: vis ? 1 : 0,
    transform: vis ? 'none' : 'translateY(24px)',
    transition: `opacity .9s cubic-bezier(.16,1,.3,1) ${d}s, transform .9s cubic-bezier(.16,1,.3,1) ${d}s`,
  })

  return (
    <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(96px,12vw,128px) clamp(20px,5vw,56px) clamp(64px,8vw,96px)', position: 'relative', overflow: 'hidden', textAlign: 'center', background: T.bg }}>

      {/* Grid dot texture */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(59,130,246,.12) 1px,transparent 1px)', backgroundSize: '34px 34px', pointerEvents: 'none' }} />
      {/* Radial glow top-center */}
      <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '90vw', height: '70vh', background: 'radial-gradient(ellipse,rgba(59,130,246,.18) 0%,transparent 68%)', pointerEvents: 'none' }} />
      {/* Bottom-right accent glow */}
      <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: 'min(400px,60vw)', height: 'min(400px,60vw)', background: 'radial-gradient(circle,rgba(34,211,238,.07),transparent)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      {/* Bottom-left accent glow */}
      <div style={{ position: 'absolute', bottom: '5%', left: '5%', width: 'min(300px,50vw)', height: 'min(300px,50vw)', background: 'radial-gradient(circle,rgba(245,158,11,.05),transparent)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      {/* Credential pill */}
      <div style={{ ...a(0), marginBottom: 32, display: 'inline-flex' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, borderRadius: 100, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.2)', flexWrap: 'wrap', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          {[{dot:T.blue,text:'Goethe-Zertifikat Prep'},{dot:T.gold,text:'TELC Certified'},{dot:T.green,text:'Nairobi, Kenya'}].map((item, i) => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: 'clamp(6px,1.5vw,8px) clamp(10px,2vw,18px)', borderRight: i < 2 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: item.dot, flexShrink: 0, boxShadow: `0 0 8px ${item.dot}` }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 'clamp(10px,1.5vw,11px)', fontWeight: 600, color: T.inkMid, whiteSpace: 'nowrap' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Flags + headline */}
      <div style={{ ...a(.09), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(14px,4vw,52px)', marginBottom: 24, width: '100%', maxWidth: 960 }}>
        <div style={{ flexShrink: 0, animation: vis ? 'gsol-float 4s ease-in-out infinite alternate' : 'none' }}>
          <KenyanFlag size={Math.max(56, Math.min(96, typeof window !== 'undefined' ? window.innerWidth * .1 : 80))} tilt={-4} />
        </div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(30px,5.5vw,78px)', fontWeight: 800, lineHeight: 1.05, color: '#fff', letterSpacing: '-1.5px', margin: 0, flex: 1 }}>
          Master German.<br />
          <span style={{ background: `linear-gradient(135deg,${T.blue} 0%,#93C5FD 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Master your Future.
          </span>
        </h1>
        <div style={{ flexShrink: 0, animation: vis ? 'gsol-float 4s ease-in-out infinite alternate-reverse' : 'none' }}>
          <GermanFlag size={Math.max(56, Math.min(96, typeof window !== 'undefined' ? window.innerWidth * .1 : 80))} tilt={4} />
        </div>
      </div>

      {/* Subheadline */}
      <p style={{ ...a(.19), fontFamily: "'DM Sans',sans-serif", fontSize: 'clamp(15px,1.8vw,18px)', color: T.inkMid, maxWidth: 500, lineHeight: 1.9, marginBottom: 38 }}>
        Structured, exam-focused German learning — A1 to C2. Based in Nairobi.{' '}
        <strong style={{ color: T.ink, fontWeight: 600 }}>Start A1 completely free.</strong>
      </p>

      {/* CTAs */}
      <div style={{ ...a(.28), display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 52 }}>
        <button onClick={() => navigate('/placement-test')}
          style={{ background: '#fff', color: '#0D1F3C', border: 'none', padding: 'clamp(14px,2.5vw,17px) clamp(22px,4vw,42px)', borderRadius: 100, fontFamily: "'DM Sans',sans-serif", fontSize: 'clamp(14px,1.5vw,16px)', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 28px rgba(255,255,255,.15)', transition: 'transform .25s, box-shadow .25s', whiteSpace: 'nowrap' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,255,255,.28)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 28px rgba(255,255,255,.15)' }}>
          Take the Free Placement Test →
        </button>
        <button onClick={() => navigate('/register')}
          style={{ background: 'transparent', color: T.inkMid, border: `1.5px solid ${T.borderMid}`, padding: 'clamp(14px,2.5vw,17px) clamp(22px,4vw,42px)', borderRadius: 100, fontFamily: "'DM Sans',sans-serif", fontSize: 'clamp(14px,1.5vw,16px)', fontWeight: 500, cursor: 'pointer', transition: 'all .25s', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.4)'; e.currentTarget.style.color = T.ink; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderMid; e.currentTarget.style.color = T.inkMid; e.currentTarget.style.transform = 'translateY(0)' }}>
          Join Us Today
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ ...a(.4), width: '100%', maxWidth: 740, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
        <div style={{ display: 'flex', minWidth: 480, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,.2)', overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
          {[
            { val: `${passRate}%`, label: 'Exam Pass Rate',  sub: 'Simulation-track students' },
            { val: 'A1 → C2',     label: 'Full CEFR Path',  sub: '5 levels, 10 modules'      },
            { val: 'Goethe & TELC', label: 'Exams Covered', sub: 'Both major providers'       },
            { val: '7-Day Trial', label: 'A1 Module',        sub: 'No card required'           },
          ].map(({ val, label, sub }, i) => (
            <div key={label} style={{ flex: 1, padding: '20px 10px', textAlign: 'center', borderRight: i < 3 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 4, lineHeight: 1 }}>{val}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: T.blue, marginBottom: 3 }}>{label}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: T.inkLight }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', opacity: .3, animation: 'gsol-bounce 2s ease-in-out infinite', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: T.inkLight, letterSpacing: '2px', textTransform: 'uppercase' }}>Scroll</span>
        <div style={{ width: 1, height: 24, background: `linear-gradient(${T.inkLight},transparent)` }} />
      </div>
    </section>
  )
}

// ─── LEVELS ───────────────────────────────────────────────────────────────────
function Levels() {
  const [active, setActive] = useState(2)

  const levels = [
    { code:'A1', label:'Beginner',          dur:'8–10 wks',  color:'#10B981', light:'rgba(16,185,129,0.1)', border:'rgba(16,185,129,0.25)', exam:'Goethe A1 · TELC A1',  examNote:'Required for family reunification visa',                    headline:'Your first words in German.',             summary:'Build essential vocabulary, navigate everyday situations, and establish the foundation every other level rests on.',          skills:['Greet, introduce yourself, use daily phrases','Handle transactions — shops, transport, offices','Understand simple written notices and signs','Ask and answer basic questions with confidence'],                 grammar:['Present tense (Präsens)','Personal pronouns & articles','Negation: nicht / kein','Basic sentence structure'] },
    { code:'A2', label:'Elementary',         dur:'10–12 wks', color:'#34D399', light:'rgba(52,211,153,0.1)',  border:'rgba(52,211,153,0.25)',  exam:'Goethe A2 · TELC A2',  examNote:'Useful for integration courses',                             headline:'Daily German, done well.',                summary:'Talk about the past, handle workplace basics, and communicate reliably in all routine situations.',                          skills:['Describe past events and daily routines','Understand short texts, emails, and notices','Write simple messages and fill in forms','Talk about your work, home, and immediate world'],                             grammar:['Simple past (Perfekt)','Modal verbs: können, müssen, dürfen','Accusative & dative cases','Comparative adjectives'] },
    { code:'B1', label:'Intermediate',       dur:'12–16 wks', color:T.blue,   light:'rgba(59,130,246,0.1)', border:'rgba(59,130,246,0.25)', exam:'Goethe B1 · TELC B1', examNote:'Required for German citizenship application',               headline:'Work, live, and belong in Germany.',      summary:'B1 is the threshold of independence — you can handle most daily and professional situations without difficulty.',              skills:['Express opinions, argue a position, give reasons','Handle work situations and travel independently','Understand standard input on familiar topics','Write coherent texts on personal and work topics'],              grammar:['Konjunktiv II (basics)','Relative clauses','Passive voice (Passiv)','Two-way prepositions'] },
    { code:'B2', label:'Upper-Intermediate', dur:'16–20 wks', color:'#818CF8', light:'rgba(129,140,248,0.1)', border:'rgba(129,140,248,0.25)', exam:'Goethe B2 · TELC B2',  examNote:'Required for many professional licensing processes',         headline:'Professional fluency within reach.',      summary:'B2 makes German a professional tool — complex discussions, formal writing, and demanding workplace communication.',           skills:['Participate in meetings and professional discussions','Write reports, formal emails, and correspondence','Understand complex media — news, podcasts, lectures','Negotiate and express nuanced professional positions'], grammar:['Extended participial phrases','Infinitive clauses with zu','Advanced Konjunktiv II','Discourse connectors for formal writing'] },
    { code:'C1', label:'Advanced',           dur:'20–24 wks', color:'#A78BFA', light:'rgba(167,139,250,0.1)', border:'rgba(167,139,250,0.25)', exam:'Goethe C1',             examNote:'Accepted by German universities and regulated professions', headline:'Speak with precision. Write with authority.', summary:'At C1 you express yourself fluently and spontaneously, adapting your register to any professional or academic context.', skills:['Produce clear, detailed texts on complex subjects','Communicate spontaneously with no searching for words','Understand demanding texts including implicit meaning','Operate confidently in academic and senior professional roles'], grammar:['Nominalisation (Nominalisierung)','Advanced passive constructions','Extended modifier chains','Register and stylistic variation'] },
    { code:'C2', label:'Mastery',            dur:'24–30 wks', color:T.gold,   light:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.25)', exam:'Goethe C2 · GDS', examNote:'The highest internationally recognised German qualification', headline:'Native-level command of German.',          summary:'C2 is complete mastery — you understand virtually everything, summarise complex sources effortlessly, and write with full stylistic authority.', skills:['Read and produce academic, literary, and technical texts','Conduct high-level debates and expert-level presentations','Understand regional accents and idiomatic usage','Write with stylistic precision in any register or context'], grammar:['Full stylistic and rhetorical command','Archaic and formal register','Complex clause architecture','Idiomatic and figurative language mastery'] },
  ]
  const lv = levels[active]

  return (
    <section id="levels" style={{ background: T.bgAlt, borderTop: `1px solid ${T.border}` }}>

      <FadeIn style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(48px,7vw,88px) clamp(20px,5vw,56px) clamp(28px,4vw,44px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: T.inkLight, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 18, height: 1.5, background: T.inkLight }} />Curriculum · A1 to C2
            </div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(26px,4vw,50px)', fontWeight: 800, color: T.ink, lineHeight: 1.06, letterSpacing: '-1px' }}>
              Six levels.<br /><em style={{ color: T.inkLight, fontWeight: 400 }}>One unbroken path.</em>
            </h2>
          </div>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.inkLight, maxWidth: 340, lineHeight: 1.85 }}>
            Every level is designed around the corresponding Goethe or TELC exam. Select a level to explore the full syllabus and grammar scope.
          </p>
        </div>
      </FadeIn>

      {/* Level tab strip */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', minWidth: 360 }}>
          {levels.map((l, i) => (
            <button key={l.code} onClick={() => setActive(i)}
              style={{ flex: '1 0 60px', padding: 'clamp(14px,3vw,22px) 6px', position: 'relative', background: active===i ? l.light : 'transparent', borderRight: i < 5 ? `1px solid ${T.border}` : 'none', border: 'none', cursor: 'pointer', transition: 'background .28s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 60 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: active===i ? l.color : 'transparent', transition: 'background .28s' }} />
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(14px,2.5vw,22px)', fontWeight: 800, color: active===i ? l.color : T.inkLight, transition: 'color .22s', lineHeight: 1 }}>{l.code}</span>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 'clamp(9px,1.2vw,10px)', fontWeight: 600, color: active===i ? T.inkMid : T.inkLight, whiteSpace: 'nowrap' }}>{l.label}</span>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 'clamp(8px,1vw,9px)', color: active===i ? l.color : T.inkLight, opacity: active===i ? 1 : 0.4, whiteSpace: 'nowrap' }}>{l.dur}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div key={active} style={{ background: l => l.light, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ background: lv.light }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(28px,5vw,52px) clamp(20px,5vw,56px) clamp(36px,5vw,56px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 'clamp(24px,4vw,48px)' }}>
          <div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: lv.color, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>Level {lv.code} · {lv.label}</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(17px,2vw,24px)', fontWeight: 800, color: T.ink, lineHeight: 1.2, marginBottom: 12 }}>{lv.headline}</h3>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.inkMid, lineHeight: 1.9, marginBottom: 22 }}>{lv.summary}</p>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${lv.border}`, borderLeft: `3px solid ${lv.color}`, borderRadius: 10, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, fontWeight: 700, color: lv.color, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 6 }}>Target Exam</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{lv.exam}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkLight, lineHeight: 1.65 }}>{lv.examNote}</div>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: T.inkLight, textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: 18 }}>What You'll Be Able To Do</div>
            {lv.skills.map((s, j) => (
              <div key={j} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: j < 3 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 11, fontWeight: 800, color: lv.color, flexShrink: 0, width: 22, textAlign: 'right', paddingTop: 2 }}>{String(j+1).padStart(2,'0')}</div>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: T.inkMid, lineHeight: 1.7 }}>{s}</span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: T.inkLight, textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: 14 }}>Grammar Scope</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 28 }}>
              {lv.grammar.map(g => (
                <span key={g} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, background: 'rgba(255,255,255,0.06)', border: `1px solid ${lv.border}`, borderRadius: 6, padding: '5px 11px', boxShadow: '0 1px 3px rgba(0,0,0,.1)' }}>{g}</span>
              ))}
            </div>
            <div style={{ height: 1, background: T.border, marginBottom: 18 }} />
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkLight, marginBottom: 16, lineHeight: 1.7 }}>
              Duration: <strong style={{ color: T.ink, fontWeight: 600 }}>{lv.dur}</strong><span style={{ margin: '0 6px', opacity: .3 }}>·</span>3–4 sessions / week
            </div>
            <button
              style={{ display: 'block', width: '100%', padding: 14, borderRadius: 10, background: lv.color, border: 'none', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'transform .25s, box-shadow .25s', boxShadow: `0 4px 18px ${lv.color}40` }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${lv.color}60` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 18px ${lv.color}40` }}>
              Enrol at {lv.code} →
            </button>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.inkLight, textAlign: 'center', marginTop: 10 }}>
              {lv.code==='A1' ? '7-day free trial — no card required' : 'Not sure? Take the free placement test first.'}
            </div>
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
    { name:'Goethe-Institut', logo:'G', color:T.blue, light:'rgba(59,130,246,0.1)', border:'rgba(59,130,246,0.25)',
      subtitle:"Germany's official language certification — accepted worldwide",
      description:"The Goethe-Zertifikat is issued by Germany's official cultural institute and recognised in 100+ countries by immigration authorities, universities, and professional licensing bodies. It carries no expiry date and is the gold standard for German certification.",
      levels:['A1','A2','B1','B2','C1','C2'],
      uses:[{label:'Family Reunification Visa',level:'A1'},{label:'Integration Course Completion',level:'A2'},{label:'German Citizenship Application',level:'B1'},{label:'University Admission',level:'C1'},{label:'Highest Academic Qualification',level:'C2'}],
      note:'Our full curriculum is structured around the official Goethe exam format at every level.',
    },
    { name:'TELC Deutsch', logo:'T', color:T.gold, light:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.25)',
      subtitle:'Trusted for healthcare, integration, and professional licensing',
      description:'TELC (The European Language Certificates) is widely accepted by German immigration authorities and the preferred pathway for healthcare workers, integration programmes, and vocational training. TELC is offered A1 through C1.',
      levels:['A1','A2','B1','B2','C1'],
      uses:[{label:'Nursing & Healthcare Licensing',level:'B2'},{label:'Integration & Naturalisation',level:'B1'},{label:'Vocational Training (Ausbildung)',level:'A2–B1'},{label:'Employer Verification',level:'B2'},{label:'Academic Entry (select programmes)',level:'C1'}],
      note:'We prepare students for TELC exams on request — tell us your target and we align your learning plan.',
    },
  ]
  const p = providers[active]

  return (
    <section id="exams" style={{ padding: 'clamp(52px,7vw,88px) 0', background: T.bg, borderTop: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(20px,5vw,56px)' }}>

        <FadeIn style={{ marginBottom: 'clamp(30px,5vw,48px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: T.inkLight, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 18, height: 1.5, background: T.inkLight }} />Exam Preparation
              </div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(24px,4vw,48px)', fontWeight: 800, color: T.ink, lineHeight: 1.08, letterSpacing: '-.5px' }}>
                Ready for your<br />German Exam?
              </h2>
            </div>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.inkLight, maxWidth: 360, lineHeight: 1.85 }}>
              We prepare students for both Goethe-Zertifikat and TELC Deutsch. Tell us your target and we align your entire learning path accordingly.
            </p>
          </div>
        </FadeIn>

        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {providers.map((pv, i) => (
            <button key={pv.name} onClick={() => setActive(i)}
              style={{ padding: '10px 28px', borderRadius: 10, border: `1.5px solid ${active===i ? pv.color : T.borderMid}`, background: active===i ? pv.light : 'rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all .25s', fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: active===i ? pv.color : T.inkLight, boxShadow: active===i ? `0 2px 12px ${pv.color}22` : 'none' }}>
              {pv.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 'clamp(22px,4vw,36px)', background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${p.border}`, borderRadius: 20, padding: 'clamp(24px,4vw,40px)', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 30px rgba(0,0,0,.2)', backdropFilter: 'blur(10px)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: p.color }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg,rgba(27,58,107,.8),${p.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 20, color: '#fff', boxShadow: `0 4px 18px ${p.color}40`, flexShrink: 0, border: `1px solid ${p.border}` }}>{p.logo}</div>
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 800, color: T.ink }}>{p.name}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: p.color, marginTop: 2 }}>{p.subtitle}</div>
              </div>
            </div>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.inkMid, lineHeight: 1.9, marginBottom: 22 }}>{p.description}</p>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: T.inkLight, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>Available Levels</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {p.levels.map(l => (
                <span key={l} style={{ fontFamily: "'Playfair Display',serif", fontSize: 12, fontWeight: 800, color: p.color, background: p.light, border: `1px solid ${p.border}`, borderRadius: 7, padding: '4px 10px' }}>{l}</span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: T.inkLight, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>Common Use Cases</div>
            {p.uses.map((uc, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < p.uses.length-1 ? `1px solid ${T.border}` : 'none', gap: 12 }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: T.inkMid }}>{uc.label}</span>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 11, fontWeight: 800, color: p.color, background: p.light, border: `1px solid ${p.border}`, borderRadius: 6, padding: '3px 9px', flexShrink: 0 }}>{uc.level}</span>
              </div>
            ))}
            <div style={{ marginTop: 18, padding: '13px 15px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkLight, lineHeight: 1.75 }}>{p.note}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── PRICING ──────────────────────────────────────────────────────────────────
const GfxA = () => (
  <svg viewBox="0 0 480 260" width="100%" style={{ display: 'block' }}>
    <rect width="480" height="260" fill="#0D2D5A" />
    <polygon points="0,68 312,68 374,130 312,192 0,192 62,130" fill="#0a2348" transform="translate(10,9)" />
    <polygon points="0,65 312,65 378,130 312,195 0,195 62,130" fill="#1B3A6B" />
    <text x="190" y="133" textAnchor="middle" dominantBaseline="middle" fontFamily="'DM Sans',Arial,sans-serif" fontWeight="900" fontSize="64" fill="#F59E0B" letterSpacing="1">A1 | A2</text>
  </svg>
)
const GfxB = () => (
  <svg viewBox="0 0 480 260" width="100%" style={{ display: 'block' }}>
    <rect width="480" height="260" fill="#0A1828" />
    <polygon points="170,-20 338,130 170,280 2,130" fill="#1B3A6B" />
    <polygon points="310,-20 478,130 310,280 142,130" fill="#1B3A6B" />
    <text x="240" y="133" textAnchor="middle" dominantBaseline="middle" fontFamily="'DM Sans',Arial,sans-serif" fontWeight="900" fontSize="64" fill="#3B82F6" letterSpacing="1">B1 | B2</text>
  </svg>
)
const GfxC = () => (
  <svg viewBox="0 0 480 260" width="100%" style={{ display: 'block' }}>
    <rect width="480" height="260" fill="#0D2D5A" />
    <polygon points="170,-20 338,130 170,280 2,130" fill="#0e3870" />
    <polygon points="310,-20 478,130 310,280 142,130" fill="#0e3870" />
    <text x="240" y="133" textAnchor="middle" dominantBaseline="middle" fontFamily="'DM Sans',Arial,sans-serif" fontWeight="900" fontSize="64" fill="#22D3EE" letterSpacing="1">C1 | C2</text>
  </svg>
)

function PricingCard({ mod, isHov, onEnter, onLeave, navigate }) {
  const Gfx = mod.gfx
  return (
    <FadeIn delay={mod.delay}>
      <div onMouseEnter={onEnter} onMouseLeave={onLeave}
        style={{ borderRadius: 16, overflow: 'hidden', transition: 'all .32s cubic-bezier(.16,1,.3,1)', transform: isHov?'translateY(-8px)':'translateY(0)', boxShadow: isHov?`0 24px 56px rgba(0,0,0,.35),0 0 0 2px ${mod.accent}`:'0 2px 16px rgba(0,0,0,.25)', border: `1px solid ${T.border}` }}>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <Gfx />
          {mod.trialBadge && (
            <div style={{ position: 'absolute', top: 14, right: 14, background: T.green, color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 800, padding: '5px 13px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '.5px', boxShadow: '0 4px 12px rgba(16,185,129,.5)' }}>{mod.trialBadge}</div>
          )}
        </div>
        <div style={{ background: T.bgCard, borderTop: `2.5px solid ${mod.accent}`, padding: '20px 20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 25, fontWeight: 800, color: T.ink, lineHeight: 1 }}>{mod.label}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkLight, marginTop: 4 }}>{mod.sublabel}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 27, fontWeight: 800, color: mod.accent, lineHeight: 1 }}>${mod.price}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10.5, color: T.inkLight, marginTop: 3 }}>{mod.trialBadge?'First 7 days free':'per module'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {mod.chips.map(s => (
              <div key={s} style={{ flex: 1, padding: '9px 4px', borderRadius: 9, textAlign: 'center', background: mod.chipBg, border: `1px solid ${mod.chipBorder}` }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 800, color: mod.accent }}>{s}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: T.inkLight, marginTop: 2 }}>2 months</div>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: T.border, marginBottom: 13 }} />
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkLight, lineHeight: 1.75, marginBottom: 14 }}>{mod.desc}</p>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color: mod.accent, background: mod.chipBg, border: `1px solid ${mod.chipBorder}`, borderRadius: 6, padding: '3px 10px' }}>{mod.exam}</span>
          </div>
          <button onClick={() => navigate(`/register?level=${mod.id}`)}
            style={{ width: '100%', padding: '13px 10px', borderRadius: 10, border: 'none', background: mod.btnBg, color: mod.btnColor, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'transform .25s, box-shadow .25s, opacity .2s', boxShadow: `0 4px 14px ${mod.accent}30` }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 28px ${mod.accent}50`; e.currentTarget.style.opacity = '.93' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 14px ${mod.accent}30`; e.currentTarget.style.opacity = '1' }}>
            {mod.cta}
          </button>
          {mod.ctaSub && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.inkLight, textAlign: 'center', marginTop: 9 }}>{mod.ctaSub}</div>}
        </div>
      </div>
    </FadeIn>
  )
}

function Pricing({ navigate }) {
  const [hovered, setHovered] = useState(null)

  const LEVELS = [
    { id:'A1', label:'A1',      sublabel:'Beginner',          gfx:GfxA, chips:['A1-1','A1-2'], price:200, trialBadge:'7-Day Free Trial', accent:T.gold,    chipBg:'rgba(245,158,11,0.12)',   chipBorder:'rgba(245,158,11,0.28)',   btnBg:T.gold,    btnColor:'#0A1828', exam:'Goethe · TELC A1', desc:'Greetings, numbers, daily phrases — the perfect foundation for your German journey.',              cta:'Begin Your Journey — Free', ctaSub:'First 7 days free · then $200/module', delay:0    },
    { id:'A2', label:'A2',      sublabel:'Elementary',         gfx:GfxA, chips:['A2-1','A2-2'], price:250, trialBadge:null,               accent:T.coral,   chipBg:'rgba(249,115,22,0.12)',   chipBorder:'rgba(249,115,22,0.25)',   btnBg:T.coral,   btnColor:'#fff',    exam:'Goethe · TELC A2', desc:'Past tense, daily routines, workplace basics, and simple reading comprehension.',             cta:'Enrol in A2 →',             ctaSub:null,                                   delay:.08  },
    { id:'B1', label:'B1',      sublabel:'Intermediate',       gfx:GfxB, chips:['B1-1','B1-2'], price:300, trialBadge:null,               accent:T.blue,    chipBg:'rgba(59,130,246,0.12)',   chipBorder:'rgba(59,130,246,0.25)',   btnBg:T.blue,    btnColor:'#fff',    exam:'Goethe · TELC B1', desc:'Express opinions fluently — required for German citizenship. Work-ready German.',            cta:'Enrol in B1 →',             ctaSub:null,                                   delay:.16  },
    { id:'B2', label:'B2',      sublabel:'Upper-Intermediate', gfx:GfxB, chips:['B2-1','B2-2'], price:350, trialBadge:null,               accent:'#818CF8', chipBg:'rgba(129,140,248,0.12)', chipBorder:'rgba(129,140,248,0.25)', btnBg:'#1B3A6B', btnColor:'#fff',    exam:'Goethe · TELC B2', desc:'Complex discussions, professional German, healthcare & nursing exam pathway.',                cta:'Enrol in B2 →',             ctaSub:null,                                   delay:.24  },
    { id:'C',  label:'C1 / C2', sublabel:'Advanced · Mastery', gfx:GfxC, chips:['C1','C2'],    price:400, trialBadge:null,               accent:T.cyan,    chipBg:'rgba(34,211,238,0.1)',    chipBorder:'rgba(34,211,238,0.25)',   btnBg:T.cyan,    btnColor:'#0A1828', exam:'Goethe C1 · C2',   desc:'Academic and near-native German — university admission and elite professional roles.',           cta:'Enrol in C1 / C2 →',        ctaSub:null,                                   delay:.32  },
  ]

  return (
    <section id="pricing" style={{ padding: 'clamp(52px,7vw,88px) 0 clamp(44px,6vw,76px)', background: T.bgAlt, borderTop: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(20px,5vw,56px)' }}>

        <FadeIn style={{ marginBottom: 'clamp(28px,5vw,48px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: T.inkLight, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 18, height: 1.5, background: T.inkLight }} />Pricing
              </div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(26px,4vw,50px)', fontWeight: 800, color: T.ink, lineHeight: 1.06, letterSpacing: '-.5px' }}>
                Pay per level.<br /><em style={{ color: T.inkLight, fontWeight: 400 }}>Progress at your pace.</em>
              </h2>
            </div>
            <div style={{ maxWidth: 340 }}>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.inkLight, lineHeight: 1.85, marginBottom: 14 }}>
                Each level is two modules of structured study. Pay for what you need, continue when you're ready.
              </p>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {['A1 trial — free','Cancel any time','Invoice available'].map(tag => (
                  <span key={tag} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color: T.green, background: 'rgba(16,185,129,0.12)', border: `1px solid rgba(16,185,129,0.28)`, borderRadius: 6, padding: '4px 11px' }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))', gap: 18, marginBottom: 18 }}>
          {LEVELS.slice(0,3).map(mod => (
            <PricingCard key={mod.id} mod={mod} isHov={hovered===mod.id} onEnter={() => setHovered(mod.id)} onLeave={() => setHovered(null)} navigate={navigate} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))', gap: 18, maxWidth: 596, margin: '0 auto 30px' }}>
          {LEVELS.slice(3).map(mod => (
            <PricingCard key={mod.id} mod={mod} isHov={hovered===mod.id} onEnter={() => setHovered(mod.id)} onLeave={() => setHovered(null)} navigate={navigate} />
          ))}
        </div>

        {/* Custom Plan */}
        <FadeIn delay={.42}>
          <div style={{ background: 'rgba(245,158,11,0.05)', border: `1.5px solid rgba(245,158,11,0.28)`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 30px rgba(0,0,0,.2)' }}>
            <div style={{ height: 2.5, background: `linear-gradient(90deg,transparent,${T.gold},transparent)` }} />
            <div style={{ padding: 'clamp(24px,4vw,36px) clamp(20px,4vw,44px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 'clamp(24px,4vw,44px)', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 800, color: T.gold, letterSpacing: '3px', textTransform: 'uppercase' }}>Custom Plan</div>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.inkLight }}>Add-on to any level</span>
                </div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(17px,2vw,23px)', fontWeight: 800, color: T.ink, lineHeight: 1.25, marginBottom: 10 }}>
                  Live 1-on-1 Zoom sessions with a certified German instructor.
                </h3>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: T.inkLight, lineHeight: 1.82, marginBottom: 16 }}>
                  Your instructor personalises your pace, runs speaking exam simulations, gives real-time feedback, and keeps you accountable. Flexibly scheduled across East Africa time zones.
                </p>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {['Speaking exam prep','Personalised plan','Direct messaging','Session recordings','Flexible scheduling'].map(f => (
                    <span key={f} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.gold, background: 'rgba(245,158,11,0.1)', border: `1px solid rgba(245,158,11,0.28)`, borderRadius: 6, padding: '4px 10px' }}>{f}</span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: T.inkLight, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 }}>Starting from</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 52, fontWeight: 800, color: T.gold, lineHeight: 1, marginBottom: 4 }}>$149</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkLight, marginBottom: 20 }}>/ month · billed alongside your module</div>
                <button onClick={() => navigate('/register?plan=custom')}
                  style={{ width: '100%', padding: '13px 20px', borderRadius: 10, border: `1.5px solid ${T.gold}`, background: 'transparent', color: T.gold, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'background .25s, color .25s, transform .25s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.gold; e.currentTarget.style.color = '#0A1828'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.gold; e.currentTarget.style.transform = 'translateY(0)' }}>
                  Request Custom Plan →
                </button>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.inkLight, marginTop: 10 }}>Instructor matched within 24 hours</div>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={.5} style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(12px,3vw,28px)', flexWrap: 'wrap', marginTop: 24, paddingTop: 22, borderTop: `1px solid ${T.border}` }}>
          {['🔒 Secure checkout','↩ Cancel any time','🎓 A1 — 7-day free trial','💳 No card for trial','📩 Invoice on request'].map(item => (
            <div key={item} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkLight }}>{item}</div>
          ))}
        </FadeIn>
      </div>
    </section>
  )
}

// ─── FINAL CTA ────────────────────────────────────────────────────────────────
function FinalCTA({ navigate }) {
  return (
    <section style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,56px)', textAlign: 'center', background: T.bgNavy, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '80vw', maxWidth: 600, background: 'radial-gradient(circle,rgba(59,130,246,.3),transparent)', filter: 'blur(70px)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <FadeIn>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: 18, height: 1, background: 'rgba(255,255,255,.3)' }} />Begin Today — It's Free<div style={{ width: 18, height: 1, background: 'rgba(255,255,255,.3)' }} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(30px,5.5vw,66px)', fontWeight: 800, color: '#fff', lineHeight: 1.05, marginBottom: 16, letterSpacing: '-1px' }}>
            Find your level.<br />Build your future.
          </h2>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 'clamp(15px,1.8vw,17px)', color: 'rgba(255,255,255,.52)', maxWidth: 400, margin: '0 auto 40px', lineHeight: 1.85 }}>
            15-minute placement test. Personalised path. No credit card required.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/placement-test')}
              style={{ background: '#fff', color: T.bgNavy, border: 'none', padding: 'clamp(14px,2.5vw,17px) clamp(26px,5vw,48px)', borderRadius: 100, fontFamily: "'DM Sans',sans-serif", fontSize: 'clamp(14px,1.5vw,16px)', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 22px rgba(0,0,0,.22)', transition: 'transform .25s, box-shadow .25s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,.32)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 22px rgba(0,0,0,.22)' }}>
              Take the Free Placement Test →
            </button>
            <button onClick={() => navigate('/login')}
              style={{ background: 'transparent', color: 'rgba(255,255,255,.7)', border: '1.5px solid rgba(255,255,255,.22)', padding: 'clamp(14px,2.5vw,17px) clamp(26px,5vw,48px)', borderRadius: 100, fontFamily: "'DM Sans',sans-serif", fontSize: 'clamp(14px,1.5vw,16px)', fontWeight: 500, cursor: 'pointer', transition: 'all .25s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.55)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.22)'; e.currentTarget.style.color = 'rgba(255,255,255,.7)'; e.currentTarget.style.transform = 'translateY(0)' }}>
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
    <footer style={{
      background: T.bgNavy,
      borderTop: `1px solid rgba(255,255,255,0.08)`,
      padding: 'clamp(44px,6vw,60px) clamp(20px,5vw,56px) clamp(24px,4vw,36px)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 'clamp(28px,4vw,48px)', marginBottom: 'clamp(32px,5vw,44px)' }}>

        {/* Brand */}
        <div style={{ gridColumn: 'span 2' }}>
          <div onClick={() => setPage('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 16, color: '#fff' }}>G</span>
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: '#fff' }}>German School Online</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '2px', textTransform: 'uppercase' }}>Nairobi · Kenya</div>
            </div>
          </div>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.85, maxWidth: 220, marginBottom: 16 }}>
            Exam-focused German learning — preparing students across East Africa for Goethe and TELC certifications.
          </p>
          <div style={{ display: 'flex', gap: 3 }}>
            {['#222','#C41E3A','#F5C800'].map(c => (
              <div key={c} style={{ width: 18, height: 4, background: c, borderRadius: 2 }} />
            ))}
          </div>
        </div>

        {[
          { title: 'Platform', items: ['Courses','Placement Test','Exam Prep','Pricing'] },
          { title: 'Exams',    items: ['Goethe-Institut','TELC Deutsch','A1 → C2 Path','Exam Dates'] },
          { title: 'Company',  items: [{label:'About Us',action:()=>setPage('about')},{label:'Contact',action:null},{label:'Privacy',action:null},{label:'Terms',action:null}] },
        ].map(col => (
          <div key={col.title}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: 14 }}>{col.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {col.items.map(item => {
                const label  = typeof item === 'string' ? item : item.label
                const action = typeof item === 'object' ? item.action : null
                return (
                  <span key={label} onClick={action}
                    style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', cursor: action ? 'pointer' : 'default', transition: 'color .22s, text-decoration .22s', textDecoration: 'none' }}
                    onMouseEnter={e => { if (action) { e.target.style.color = '#fff'; e.target.style.textDecoration = 'underline'; e.target.style.textUnderlineOffset = '3px' } }}
                    onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.5)'; e.target.style.textDecoration = 'none' }}>
                    {label}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>© 2026 German School Online. All rights reserved.</div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Goethe-Zertifikat & TELC preparation · Nairobi, Kenya</div>
      </div>
    </footer>
  )
}

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────
function AboutPage({ navigate, setPage }) {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingTop: 64 }}>
      <section style={{ padding: 'clamp(48px,7vw,72px) clamp(20px,5vw,56px) clamp(36px,5vw,52px)', maxWidth: 980, margin: '0 auto', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320, background: `linear-gradient(180deg,rgba(59,130,246,0.12) 0%,transparent 100%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            {['#222','#C41E3A','#F5C800'].map(c => <div key={c} style={{ width: 18, height: 3, background: c, borderRadius: 2 }} />)}
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10.5, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: T.inkLight, marginLeft: 6 }}>About Us</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(30px,5vw,58px)', fontWeight: 800, color: T.ink, lineHeight: 1.04, marginBottom: 22, letterSpacing: '-1px' }}>
            German School Online.<br /><em style={{ color: T.inkLight, fontWeight: 400 }}>Built to get you certified.</em>
          </h1>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 'clamp(15px,1.8vw,18px)', color: T.inkMid, lineHeight: 1.9, maxWidth: 600, borderLeft: `3px solid ${T.blue}`, paddingLeft: 22 }}>
            German School Online is a structured, exam-focused learning programme preparing students across Kenya and East Africa to pass internationally recognised German language certifications — primarily the <strong style={{ color: T.ink }}>Goethe-Zertifikat</strong> and <strong style={{ color: T.ink }}>TELC Deutsch</strong>.
          </p>
        </div>
      </section>

      <section style={{ padding: '0 clamp(20px,5vw,56px) clamp(52px,7vw,80px)', maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18, marginBottom: 20 }}>
          {[
            { color:T.blue, light:'rgba(59,130,246,0.1)', border:'rgba(59,130,246,0.25)', label:'Our Mission', title:'One goal: help every student pass their German exam.', body:'Every curriculum decision, every lesson structure, every exercise — is built with one outcome in mind: your certification. We do not teach German casually. We prepare you deliberately.' },
            { color:T.gold, light:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.28)', label:'Our Approach', title:'Module by module. Exam by exam.', body:'Students progress through structured modules — two per level, A1 through C2. Each module builds directly toward the corresponding exam, with mock tests, graded exercises, and live instructor support at every stage.' },
          ].map(card => (
            <div key={card.label} style={{ background: card.light, border: `1.5px solid ${card.border}`, borderRadius: 16, padding: 'clamp(20px,3vw,30px)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: card.color }} />
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: card.color, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>{card.label}</div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(17px,2vw,22px)', fontWeight: 800, color: T.ink, lineHeight: 1.2, marginBottom: 12 }}>{card.title}</h3>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.inkMid, lineHeight: 1.85 }}>{card.body}</p>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, borderRadius: 16, padding: 'clamp(24px,4vw,38px)', marginBottom: 20, boxShadow: '0 2px 16px rgba(0,0,0,.2)' }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, color: T.ink, marginBottom: 28, letterSpacing: '-.3px' }}>How It Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 'clamp(20px,3vw,28px)' }}>
            {[
              { n:'01', title:'Take the Placement Test', desc:'A free 15-minute test places you at A1, A2, B1, or higher — wherever you genuinely belong.' },
              { n:'02', title:'Choose Your Module',      desc:'Select A1-1, A1-2, A2-1, etc. A1 students start with a 7-day free trial, no card required.' },
              { n:'03', title:'Study with Purpose',      desc:'Video lessons, graded exercises, and mock exams structured around the real exam format.' },
              { n:'04', title:'Sit Your Exam',           desc:'We guide you to register for Goethe or TELC — whichever certification you are targeting.' },
            ].map(s => (
              <div key={s.n}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 800, color: T.blue, opacity: .35, marginBottom: 10, lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkLight, lineHeight: 1.78 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: 'clamp(28px,4vw,40px)', background: 'rgba(59,130,246,0.1)', border: `1.5px solid rgba(59,130,246,0.25)`, borderRadius: 16 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(19px,3vw,25px)', fontWeight: 800, color: T.ink, marginBottom: 10 }}>Ready to start your German journey?</div>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.inkMid, marginBottom: 24 }}>Take the free placement test and we'll build your personalised path.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/placement-test')}
              style={{ background: '#fff', color: T.bg, border: 'none', padding: 'clamp(12px,2vw,14px) clamp(22px,4vw,36px)', borderRadius: 100, fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 18px rgba(255,255,255,.15)', transition: 'transform .25s, box-shadow .25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(255,255,255,.25)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(255,255,255,.15)' }}>
              Take the Placement Test →
            </button>
            <button onClick={() => setPage('home')}
              style={{ background: 'transparent', color: T.inkMid, border: `1px solid ${T.borderMid}`, padding: 'clamp(12px,2vw,14px) clamp(22px,4vw,36px)', borderRadius: 100, fontFamily: "'DM Sans',sans-serif", fontSize: 15, cursor: 'pointer', transition: 'all .25s' }}
              onMouseEnter={e => { e.currentTarget.style.color = T.ink; e.currentTarget.style.borderColor = 'rgba(255,255,255,.35)' }}
              onMouseLeave={e => { e.currentTarget.style.color = T.inkMid; e.currentTarget.style.borderColor = T.borderMid }}>
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
  const navigate   = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [page,     setPage]     = useState('home')

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
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{background:#0D1F3C;color:#F0F4FF;overflow-x:hidden}

        .gsol-desktop{display:flex}
        .gsol-mobile{display:none!important}
        @media(max-width:768px){
          .gsol-desktop{display:none!important}
          .gsol-mobile{display:flex!important}
        }

        @keyframes gsol-float  {0%{transform:translateY(0)}100%{transform:translateY(-8px)}}
        @keyframes gsol-bounce {0%,100%{transform:translateX(-50%) translateY(0);opacity:.28}50%{transform:translateX(-50%) translateY(9px);opacity:.48}}

        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#0D1F3C}
        ::-webkit-scrollbar-thumb{background:rgba(59,130,246,0.4);border-radius:2px}
        ::-webkit-scrollbar-thumb:hover{background:#3B82F6}
        ::selection{background:rgba(59,130,246,.3);color:#fff}
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