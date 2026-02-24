import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, BookOpen, CheckCircle, Clock, Play, Award,
  TrendingUp, ChevronRight, RefreshCw, AlertTriangle,
  Target, Flame, Calendar, BarChart2, Lock, Star
} from 'lucide-react'
import { studentAPI, courseAPI } from '../../services/api'

// ── CEFR config ───────────────────────────────────────────────────────────────

const LEVEL_CONFIG = {
  A1: { label: 'Beginner',          ring: '#10B981', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-400' },
  A2: { label: 'Elementary',        ring: '#14B8A6', bg: 'bg-teal-50',    badge: 'bg-teal-100 text-teal-700',       bar: 'bg-teal-400'    },
  B1: { label: 'Intermediate',      ring: '#3B82F6', bg: 'bg-blue-50',    badge: 'bg-blue-100 text-blue-700',       bar: 'bg-blue-400'    },
  B2: { label: 'Upper-Intermediate',ring: '#6366F1', bg: 'bg-indigo-50',  badge: 'bg-indigo-100 text-indigo-700',   bar: 'bg-indigo-400'  },
  C1: { label: 'Advanced',          ring: '#8B5CF6', bg: 'bg-purple-50',  badge: 'bg-purple-100 text-purple-700',   bar: 'bg-purple-400'  },
  C2: { label: 'Mastery',           ring: '#F59E0B', bg: 'bg-amber-50',   badge: 'bg-amber-100 text-amber-700',     bar: 'bg-amber-400'   },
}

const DEFAULT_LEVEL = { label: 'Unknown', ring: '#94A3B8', bg: 'bg-slate-50', badge: 'bg-slate-100 text-slate-600', bar: 'bg-slate-400' }

// ── Circular progress ring ────────────────────────────────────────────────────

function Ring({ pct = 0, color = '#3B82F6', size = 96, stroke = 8, children }) {
  const r    = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(pct, 100) / 100) * circ
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// ── Thin progress bar ─────────────────────────────────────────────────────────

function Bar({ pct, colorClass }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5">
      <div className={`${colorClass} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
      <div className="flex items-start gap-5">
        <div className="w-24 h-24 rounded-full bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="h-2 bg-slate-100 rounded w-full mt-4" />
        </div>
      </div>
    </div>
  )
}

// ── Course progress card ──────────────────────────────────────────────────────

function CourseCard({ enrollment, onContinue }) {
  const course  = enrollment.course
  const pct     = Math.round(enrollment.completion_percentage ?? 0)
  const level   = course?.level || 'B1'
  const cfg     = LEVEL_CONFIG[level] || DEFAULT_LEVEL
  const lessons = course?.lesson_count ?? 0
  const done    = Math.round(lessons * pct / 100)

  const statusLabel = pct === 100 ? 'Completed' : pct > 0 ? 'In Progress' : 'Not Started'
  const statusColor = pct === 100 ? 'text-green-600 bg-green-50' : pct > 0 ? 'text-blue-600 bg-blue-50' : 'text-slate-500 bg-slate-50'
  const statusIcon  = pct === 100 ? CheckCircle : pct > 0 ? Play : Lock

  const StatusIcon = statusIcon

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group`}>
      {/* Level color bar */}
      <div className={`h-1 ${cfg.bar} w-full`} />

      <div className="p-6">
        <div className="flex items-start gap-5">
          {/* Ring */}
          <div className="shrink-0">
            <Ring pct={pct} color={cfg.ring} size={88} stroke={7}>
              <span className="text-lg font-bold text-slate-800">{pct}%</span>
            </Ring>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-slate-800 font-semibold text-base leading-snug line-clamp-2">
                {course?.title || 'Untitled Course'}
              </h3>
              <span className={`shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
                <StatusIcon size={11} />
                {statusLabel}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                {level}
              </span>
              <span className="text-slate-400 text-xs">{cfg.label}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <BookOpen size={11} />
                {done} / {lessons} lessons
              </span>
            </div>

            <Bar pct={pct} colorClass={cfg.bar} />

            <div className="flex items-center justify-between mt-4">
              <span className="text-slate-400 text-xs">
                {pct === 100
                  ? 'Course complete 🎉'
                  : pct === 0
                  ? 'Start your first lesson'
                  : `${lessons - done} lesson${lessons - done !== 1 ? 's' : ''} remaining`}
              </span>
              <button
                onClick={() => onContinue(enrollment)}
                disabled={pct === 100}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all
                  ${pct === 100
                    ? 'text-green-600 bg-green-50 cursor-default'
                    : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700 group-hover:translate-x-0.5'}`}>
                {pct === 100 ? (
                  <><CheckCircle size={12} /> Done</>
                ) : (
                  <>Continue <ChevronRight size={13} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ROOT ──────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const navigate = useNavigate()

  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [enrollments, setEnrollments] = useState([])
  const [user,        setUser]        = useState(null)
  const [streak,      setStreak]      = useState(0)
  const [filter,      setFilter]      = useState('all') // all | in-progress | completed | not-started

  useEffect(() => {
    studentAPI.dashboard()
      .then(({ data }) => {
        setUser(data.user)
        setStreak(data.streak ?? 0)
        // Enrollments come with nested course data from EnrollmentSerializer
        setEnrollments(data.enrollments ?? [])
      })
      .catch(err => {
        if (err.response?.status === 401) navigate('/login')
        else setError('Failed to load progress data.')
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Derived stats ──────────────────────────────────────────────────────────
  const total     = enrollments.length
  const completed = enrollments.filter(e => Math.round(e.completion_percentage ?? 0) === 100).length
  const inProg    = enrollments.filter(e => { const p = Math.round(e.completion_percentage ?? 0); return p > 0 && p < 100 }).length
  const notStart  = enrollments.filter(e => Math.round(e.completion_percentage ?? 0) === 0).length
  const avgPct    = total > 0
    ? Math.round(enrollments.reduce((s, e) => s + (e.completion_percentage ?? 0), 0) / total)
    : 0

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = enrollments.filter(e => {
    const p = Math.round(e.completion_percentage ?? 0)
    if (filter === 'completed')    return p === 100
    if (filter === 'in-progress')  return p > 0 && p < 100
    if (filter === 'not-started')  return p === 0
    return true
  })

  const handleContinue = (enrollment) => {
    const courseId = enrollment.course?.id
    if (courseId) navigate(`/student/lesson/${courseId}/first`)
  }

  const FILTERS = [
    { id: 'all',         label: 'All Courses',  count: total    },
    { id: 'in-progress', label: 'In Progress',  count: inProg   },
    { id: 'completed',   label: 'Completed',    count: completed },
    { id: 'not-started', label: 'Not Started',  count: notStart  },
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/student/dashboard')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors">
              <ArrowLeft size={16} /> Dashboard
            </button>
            <div className="w-px h-5 bg-slate-200" />
            <div>
              <h1 className="text-slate-800 font-semibold text-base">My Progress</h1>
              {user && <p className="text-slate-400 text-xs mt-0.5">{user.first_name} {user.last_name}</p>}
            </div>
          </div>

          {streak > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-700 text-sm font-semibold px-3 py-1.5 rounded-full">
              <Flame size={14} className="text-amber-500" />
              {streak} day streak
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertTriangle size={16} /> {error}
            <button onClick={() => window.location.reload()} className="ml-auto underline text-xs">Retry</button>
          </div>
        )}

        {/* ── Overview stats ── */}
        {!loading && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Enrolled',    value: total,     icon: BookOpen,   color: 'blue'  },
              { label: 'Completed',   value: completed, icon: CheckCircle,color: 'green' },
              { label: 'In Progress', value: inProg,    icon: Play,       color: 'indigo'},
              { label: 'Avg. Progress', value: `${avgPct}%`, icon: TrendingUp, color: 'amber' },
            ].map(({ label, value, icon: Icon, color }) => {
              const cfg = {
                blue:   { bg: 'bg-blue-50',   ic: 'text-blue-500',   val: 'text-blue-700'   },
                green:  { bg: 'bg-green-50',  ic: 'text-green-500',  val: 'text-green-700'  },
                indigo: { bg: 'bg-indigo-50', ic: 'text-indigo-500', val: 'text-indigo-700' },
                amber:  { bg: 'bg-amber-50',  ic: 'text-amber-500',  val: 'text-amber-700'  },
              }[color]
              return (
                <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className={`w-9 h-9 ${cfg.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon size={17} className={cfg.ic} />
                  </div>
                  <p className={`text-2xl font-bold ${cfg.val}`}>{value}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{label}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Overall ring ── */}
        {!loading && total > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-8">
            <Ring pct={avgPct} color="#3B82F6" size={112} stroke={9}>
              <span className="text-2xl font-bold text-slate-800">{avgPct}%</span>
              <span className="text-slate-400 text-xs">overall</span>
            </Ring>
            <div className="flex-1">
              <h2 className="text-slate-800 font-semibold text-base mb-1">Overall Progress</h2>
              <p className="text-slate-400 text-sm mb-4">
                {completed === total && total > 0
                  ? 'Amazing — you\'ve completed all your courses! 🎉'
                  : `You've completed ${completed} of ${total} course${total !== 1 ? 's' : ''}.`}
              </p>
              {/* Mini breakdown bars */}
              <div className="space-y-2.5">
                {[
                  { label: 'Completed',   count: completed, total, color: 'bg-green-400'  },
                  { label: 'In Progress', count: inProg,    total, color: 'bg-blue-400'   },
                  { label: 'Not Started', count: notStart,  total, color: 'bg-slate-200'  },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs w-24 shrink-0">{label}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div className={`${color} h-1.5 rounded-full transition-all duration-700`}
                        style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }} />
                    </div>
                    <span className="text-slate-500 text-xs w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Filter tabs ── */}
        {!loading && total > 0 && (
          <div className="flex gap-2">
            {FILTERS.map(({ id, label, count }) => (
              <button key={id} onClick={() => setFilter(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${filter === id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'}`}>
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                  ${filter === id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── Course list ── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : total === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-blue-400" />
            </div>
            <h3 className="text-slate-700 font-semibold mb-1">No courses yet</h3>
            <p className="text-slate-400 text-sm mb-5">Enrol in a course to start tracking your progress</p>
            <button onClick={() => navigate('/student/courses')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2.5 rounded-xl font-medium transition-colors mx-auto">
              Browse Courses <ChevronRight size={14} />
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
            No courses match this filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((enr, i) => (
              <CourseCard key={enr.id ?? i} enrollment={enr} onContinue={handleContinue} />
            ))}
          </div>
        )}

        {/* ── Browse more CTA ── */}
        {!loading && total > 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-base">Ready for more?</p>
              <p className="text-blue-100 text-sm mt-0.5">Browse new courses and keep building your German</p>
            </div>
            <button onClick={() => navigate('/student/courses')}
              className="flex items-center gap-2 bg-white text-blue-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-colors shrink-0">
              Browse Courses <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}