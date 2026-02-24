import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, CheckCircle, BookOpen, Headphones,
  PenTool, Play, Pause, Volume2, VolumeX, Maximize2,
  Subtitles, Clock, BarChart2, Download, Bookmark, BookMarked,
  AlertTriangle, ArrowRight, RotateCcw, X, List,
  FileText, Star, Lock, PlayCircle, Activity,
  ChevronDown, ChevronUp, Check, Mic
} from 'lucide-react'
import { lessonAPI, courseAPI } from '../../services/api'
import { clearTokens } from '../../services/auth'

// ── Convert any YouTube URL to embed format ───────────────────────────────────
const getEmbedUrl = (url) => {
  if (!url) return null

  // Already an embed URL — use as-is
  if (url.includes('youtube.com/embed/')) return url

  // Convert watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/)
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0&modestbranding=1`

  // Convert short URL: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?]+)/)
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0&modestbranding=1`

  // Not a YouTube URL — return as-is (direct video file, Vimeo, etc.)
  return url
}

const isYouTube = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'))

const ProgressBar = ({ pct, color = '#3B82F6', height = 4 }) => (
  <div style={{ width: '100%', height, background: 'rgba(255,255,255,0.08)', borderRadius: height }}>
    <div style={{ height: '100%', width: `${Math.min(pct,100)}%`, background: color, borderRadius: height, transition: 'width 0.6s ease' }} />
  </div>
)

const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: `2px solid ${active ? '#3B82F6' : 'transparent'}`, color: active ? '#fff' : 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: active ? '700' : '500', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
    {children}
  </button>
)

const Skeleton = ({ w = '100%', h = '16px', radius = '6px' }) => (
  <div style={{ width: w, height: h, borderRadius: radius, background: 'rgba(255,255,255,0.07)', animation: 'pulse 1.5s ease-in-out infinite' }} />
)

function VideoPlayer({ lesson, onProgress }) {
  const [playing,    setPlaying]    = useState(false)
  const [muted,      setMuted]      = useState(false)
  const [subtitles,  setSubtitles]  = useState(true)
  const [speed,      setSpeed]      = useState(1)
  const [showSpeed,  setShowSpeed]  = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [watchPct,   setWatchPct]   = useState(lesson?.watch_pct || 0)
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]

  useEffect(() => {
    if (!playing) return
    const interval = setInterval(() => {
      setWatchPct(p => {
        const next = Math.min(p + 0.5, 100)
        if (next % 10 === 0) onProgress?.(next)
        return next
      })
    }, 500)
    return () => clearInterval(interval)
  }, [playing])

  const durationMin  = lesson?.duration || 0
  const embedUrl     = getEmbedUrl(lesson?.video_url)
  const isYT         = isYouTube(lesson?.video_url || '')

  return (
    <div style={{ position: 'relative', background: '#000', borderRadius: '14px', overflow: 'hidden', aspectRatio: '16/9', width: '100%' }}>

      {embedUrl ? (
        // ── Video exists ────────────────────────────────────────────────────────
        <iframe
          key={embedUrl}
          src={embedUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          title={lesson?.title || 'Lesson video'}
        />
      ) : (
        // ── No video uploaded yet ───────────────────────────────────────────────
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0D1B35 0%, #06090F 50%, #0D2451 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)', border: '2px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', cursor: 'pointer', transition: 'all 0.25s' }}
              onClick={() => setPlaying(p => !p)}>
              {playing
                ? <Pause size={28} color="#fff" strokeWidth={1.5} />
                : <Play  size={28} color="#fff" strokeWidth={1.5} style={{ marginLeft: '3px' }} />}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              {playing ? 'Simulating playback...' : 'No video uploaded yet'}
            </div>
          </div>
          {subtitles && playing && lesson?.transcript && (
            <div style={{ position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.75)', padding: '8px 20px', borderRadius: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#fff', whiteSpace: 'nowrap', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {lesson.transcript.slice(0, 80)}...
            </div>
          )}
        </div>
      )}

      {/* Controls overlay — only show for non-YouTube videos (YouTube has its own controls) */}
      {!isYT && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', padding: '32px 16px 14px' }}>
          <div style={{ marginBottom: '10px' }}>
            <ProgressBar pct={watchPct} color="#3B82F6" height={3} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button onClick={() => setPlaying(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', padding: 0 }}>
                {playing ? <Pause size={18} strokeWidth={2} /> : <Play size={18} strokeWidth={2} style={{ marginLeft: '2px' }} />}
              </button>
              <button onClick={() => setMuted(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', padding: 0 }}>
                {muted ? <VolumeX size={16} strokeWidth={2} /> : <Volume2 size={16} strokeWidth={2} />}
              </button>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                {Math.floor(watchPct * durationMin / 100)} / {durationMin} min
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowSpeed(s => !s)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '5px', padding: '3px 8px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  {speed}x
                </button>
                {showSpeed && (
                  <div style={{ position: 'absolute', bottom: '32px', right: 0, background: '#0D1B35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden', zIndex: 10 }}>
                    {speeds.map(s => (
                      <div key={s} onClick={() => { setSpeed(s); setShowSpeed(false) }}
                        style={{ padding: '7px 18px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: speed === s ? '#3B82F6' : 'rgba(255,255,255,0.7)', cursor: 'pointer', background: speed === s ? 'rgba(59,130,246,0.1)' : 'transparent', fontWeight: speed === s ? '700' : '400' }}>
                        {s}x
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setSubtitles(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtitles ? '#3B82F6' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', padding: 0 }}>
                <Subtitles size={16} strokeWidth={2} />
              </button>
              <button onClick={() => setBookmarked(b => !b)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: bookmarked ? '#F59E0B' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', padding: 0 }}>
                {bookmarked ? <BookMarked size={16} strokeWidth={2} /> : <Bookmark size={16} strokeWidth={2} />}
              </button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', padding: 0 }}>
                <Maximize2 size={15} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TranscriptTab({ transcript }) {
  if (!transcript) return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <FileText size={36} color="rgba(255,255,255,0.2)" strokeWidth={1.2} style={{ marginBottom: '12px' }} />
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>No transcript available for this lesson.</div>
    </div>
  )
  return (
    <div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '14px' }}>Lesson Transcript</div>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '24px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.9', whiteSpace: 'pre-wrap' }}>
        {transcript}
      </div>
    </div>
  )
}

function NotesTab() {
  return (
    <div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '14px' }}>PDF Notes — This Lesson</div>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '32px', textAlign: 'center' }}>
        <FileText size={36} color="rgba(255,255,255,0.2)" strokeWidth={1.2} style={{ marginBottom: '12px' }} />
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>Download the PDF notes for this lesson to study offline.</div>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', background: 'linear-gradient(135deg,#1B3A6B,#3B82F6)', border: 'none', borderRadius: '10px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
          <Download size={15} strokeWidth={2} /> Download Notes PDF
        </button>
      </div>
    </div>
  )
}

export default function LessonPage() {
  const navigate = useNavigate()
  const { lessonId, courseId } = useParams()

  const [lesson,      setLesson]      = useState(null)
  const [modules,     setModules]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [completed,   setCompleted]   = useState(false)
  const [completing,  setCompleting]  = useState(false)
  const [tab,         setTab]         = useState('transcript')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const allLessons = modules.flatMap(m => m.lessons || [])
  const currentIdx = allLessons.findIndex(l => String(l.id) === String(lessonId))
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

  useEffect(() => {
    if (!lessonId) { setError('No lesson ID provided.'); setLoading(false); return }

    const fetchAll = async () => {
      try {
        // ── Handle "first" keyword ───────────────────────────────────────────────
        if (lessonId === 'first') {
          if (!courseId) { setError('No course specified.'); setLoading(false); return }
          const modulesRes = await courseAPI.myModules(courseId)
          const rawModules = modulesRes.data?.results ?? modulesRes.data
          const firstLesson = Array.isArray(rawModules) ? rawModules?.[0]?.lessons?.[0] : null
          if (firstLesson) {
            navigate(`/student/lesson/${courseId}/${firstLesson.id}`, { replace: true })
          } else {
            setError('No lessons found in this course yet.')
            setLoading(false)
          }
          return
        }

        // ── Normal lesson load ───────────────────────────────────────────────────
        const [lessonRes, modulesRes] = await Promise.all([
          lessonAPI.detail(lessonId),
          courseId ? courseAPI.myModules(courseId) : Promise.resolve({ data: [] }),
        ])
        setLesson(lessonRes.data)
        setCompleted(lessonRes.data.completed || false)
        const rawModules = modulesRes.data?.results ?? modulesRes.data
        setModules(Array.isArray(rawModules) ? rawModules : [])
      } catch (err) {
        if (err.response?.status === 401) { clearTokens(); navigate('/login') }
        else setError('Failed to load lesson. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [lessonId, courseId])

  const handleMarkComplete = async () => {
    if (completed || completing) return
    setCompleting(true)
    try {
      await lessonAPI.complete(lessonId)
      setCompleted(true)
    } catch { /* silent */ } finally {
      setCompleting(false)
    }
  }

  const handleProgress = async (pct) => {
    try { await lessonAPI.progress({ lesson_id: lessonId, watch_pct: pct }) } catch { /* silent */ }
  }

  const goToLesson = (l) => {
    if (!l) return
    navigate(`/student/lesson/${courseId}/${l.id}`)
  }

  const tabs = [
    { key: 'transcript', label: 'Transcript', icon: <FileText size={14} strokeWidth={2} /> },
    { key: 'notes',      label: 'Notes',      icon: <Download size={14} strokeWidth={2} /> },
  ]

  if (loading) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
        *,*::before,*::after { margin:0; padding:0; box-sizing:border-box; }
        body { background:#06090F; color:#fff; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#06090F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid rgba(59,130,246,0.3)', borderTop: '2px solid #3B82F6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>Loading lesson...</span>
      </div>
    </>
  )

  if (error) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap'); *{margin:0;padding:0;box-sizing:border-box;} body{background:#06090F;color:#fff;}`}</style>
      <div style={{ minHeight: '100vh', background: '#06090F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle size={36} color="#EF4444" strokeWidth={1.5} style={{ marginBottom: '16px' }} />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#EF4444', marginBottom: '20px' }}>{error}</div>
          <button onClick={() => navigate('/student/dashboard')} style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#1B3A6B,#3B82F6)', border: 'none', borderRadius: '10px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </>
  )

  const currentModule = modules.find(m => m.lessons?.some(l => String(l.id) === String(lessonId)))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #06090F; color: #fff; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin  { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#06090F', display: 'flex', flexDirection: 'column' }}>

        {/* Top Nav */}
        <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,9,15,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate('/student/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}>
              <ChevronLeft size={16} strokeWidth={2} /> Dashboard
            </button>
            <div style={{ height: '16px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{currentModule?.title || lesson?.description || '—'}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', color: '#fff' }}>{lesson?.title || '—'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              <Clock size={13} strokeWidth={2} /> {lesson?.duration ?? '—'} min
            </div>
            <div style={{ width: '100px' }}>
              <ProgressBar pct={lesson?.watch_pct || 0} color="#3B82F6" height={4} />
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#3B82F6', fontWeight: '700' }}>{lesson?.watch_pct || 0}%</span>
            <button onClick={() => setSidebarOpen(s => !s)}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}>
              <List size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Main Column */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            <div style={{ marginBottom: '24px' }}>
              <VideoPlayer lesson={lesson} onProgress={handleProgress} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{lesson?.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{currentModule?.title || lesson?.description}</span>
                    {lesson?.completion_pct != null && (
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', padding: '2px 10px', borderRadius: '100px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#93C5FD' }}>{lesson.completion_pct}% to complete</span>
                    )}
                    {lesson?.duration && (
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} strokeWidth={2} /> {lesson.duration} min
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={handleMarkComplete}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: completed ? 'rgba(16,185,129,0.15)' : completing ? 'rgba(59,130,246,0.15)' : 'linear-gradient(135deg,#1B3A6B,#3B82F6)', border: completed ? '1px solid rgba(16,185,129,0.35)' : 'none', borderRadius: '10px', color: completed ? '#10B981' : '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', cursor: completed || completing ? 'default' : 'pointer', transition: 'all 0.3s', opacity: completing ? 0.7 : 1 }}>
                  {completed ? <><CheckCircle size={14} strokeWidth={2.5} /> Completed</> : completing ? <>Saving...</> : <><Check size={14} strokeWidth={2.5} /> Mark as Complete</>}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '4px', marginBottom: '24px', overflowX: 'auto' }}>
              {tabs.map(t => (
                <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{t.icon}{t.label}</span>
                </TabBtn>
              ))}
            </div>

            {tab === 'transcript' && <TranscriptTab transcript={lesson?.transcript} />}
            {tab === 'notes'      && <NotesTab />}

            {/* Prev / Next */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={() => goToLesson(prevLesson)} disabled={!prevLesson}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: prevLesson ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', cursor: prevLesson ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                <ChevronLeft size={16} strokeWidth={2} /> Previous Lesson
              </button>
              <button onClick={() => goToLesson(nextLesson)} disabled={!nextLesson}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: nextLesson ? 'linear-gradient(135deg,#1B3A6B,#3B82F6)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', color: nextLesson ? '#fff' : 'rgba(255,255,255,0.2)', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', cursor: nextLesson ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                Next Lesson <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Lesson Sidebar */}
          {sidebarOpen && (
            <div style={{ width: '280px', borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)', overflowY: 'auto', flexShrink: 0 }}>
              {currentModule && (
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '4px' }}>Current Module</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>{currentModule.title}</div>
                  {currentModule.description && (
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' }}>{currentModule.description}</div>
                  )}
                </div>
              )}
              {modules.length === 0 ? (
                <div style={{ padding: '24px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>No course structure loaded.</div>
              ) : (
                modules.map(mod => (
                  <div key={mod.id}>
                    <div style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.55)' }}>{mod.title}</div>
                    </div>
                    {(mod.lessons || []).map(l => {
                      const isActive = String(l.id) === String(lessonId)
                      return (
                        <div key={l.id} onClick={() => !isActive && goToLesson(l)}
                          style={{ padding: '12px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px', background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent', borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent', cursor: isActive ? 'default' : 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: l.completed ? 'rgba(16,185,129,0.15)' : isActive ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.07)', border: `1.5px solid ${l.completed ? 'rgba(16,185,129,0.4)' : isActive ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                            {l.completed
                              ? <CheckCircle size={13} color="#10B981" strokeWidth={2.5} />
                              : isActive
                                ? <PlayCircle  size={13} color="#3B82F6"  strokeWidth={2}   />
                                : <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.4)' }}>{l.order || '•'}</span>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: isActive ? '700' : '500', color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', lineHeight: '1.4', marginBottom: '3px' }}>{l.title}</div>
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={10} strokeWidth={2} /> {l.duration ?? '—'} min
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}