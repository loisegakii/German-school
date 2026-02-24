import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, PlayCircle, ClipboardList, Award,
  BarChart2, Settings, LogOut, Bell, ChevronRight, ChevronLeft,
  Download, Share2, Eye, CheckCircle, Clock, AlertTriangle,
  RefreshCw, Trophy, GraduationCap, Star, X, Shield
} from 'lucide-react'
import { studentAPI } from '../../services/api'
import { clearTokens } from '../../services/auth'
import { useAuthStore } from '../../store/authStore'

// ── Nav ───────────────────────────────────────────────────────────────────────

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',    path: '/student/dashboard'     },
  { icon: BookOpen,        label: 'My Courses',   path: '/student/courses'       },
  { icon: PlayCircle,      label: 'Lessons',      path: '/student/lesson'        },
  { icon: ClipboardList,   label: 'Tests',        path: '/student/tests'         },
  { icon: Award,           label: 'Certificates', path: '/student/certificates'  },
  { icon: BarChart2,       label: 'Progress',     path: '/student/progress'      },
]

const LEVEL_COLORS = {
  A1: 'from-emerald-400 to-emerald-600',
  A2: 'from-teal-400 to-teal-600',
  B1: 'from-blue-400 to-blue-600',
  B2: 'from-indigo-400 to-indigo-600',
  C1: 'from-purple-400 to-purple-600',
  C2: 'from-amber-400 to-amber-600',
}

const STATUS_CONFIG = {
  issued:  { label: 'Issued',    bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-400'  },
  pending: { label: 'Pending',   bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400'  },
  revoked: { label: 'Revoked',   bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-400'    },
}

// ── Certificate Card ──────────────────────────────────────────────────────────

function CertCard({ cert, onView }) {
  const level    = cert.course?.level || 'B1'
  const gradient = LEVEL_COLORS[level] || LEVEL_COLORS['B1']
  const status   = STATUS_CONFIG[cert.status] || STATUS_CONFIG['pending']
  const isIssued = cert.status === 'issued'
  const date     = cert.issued_at
    ? new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Pending issuance'

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${!isIssued ? 'opacity-75' : ''}`}>
      {/* Certificate visual header */}
      <div className={`relative h-36 bg-gradient-to-br ${gradient} overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute top-4 right-4 w-10 h-10 bg-white/15 rounded-full flex items-center justify-center">
          <Shield size={18} className="text-white/80" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
            <Award size={28} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-wider uppercase">Certificate</span>
          <span className="text-white/75 text-xs">{level} Level</span>
        </div>

        {/* Status badge */}
        <div className={`absolute top-3 left-3 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.bg} ${status.text} ${status.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="text-slate-800 font-semibold text-sm leading-snug mb-1 line-clamp-2">
          {cert.course?.title || 'Unknown Course'}
        </h3>
        <div className="flex items-center gap-1.5 mb-4">
          {isIssued
            ? <CheckCircle size={12} className="text-green-500" />
            : <Clock size={12} className="text-amber-400" />
          }
          <span className="text-slate-400 text-xs">{date}</span>
        </div>

        {/* Score */}
        {cert.score != null && (
          <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5 mb-4">
            <span className="text-slate-500 text-xs font-medium">Final Score</span>
            <div className="flex items-center gap-1.5">
              <Star size={12} className={cert.score >= 80 ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} />
              <span className={`text-sm font-bold ${cert.score >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
                {cert.score}%
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onView(cert)}
            className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-600 text-xs font-medium py-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Eye size={12} /> View
          </button>
          {isIssued && (
            <>
              <button className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-xl transition-colors">
                <Download size={12} /> Download
              </button>
              <button className="flex items-center justify-center p-2 border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-colors">
                <Share2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Certificate Detail Modal ──────────────────────────────────────────────────

function CertModal({ cert, onClose }) {
  const level    = cert.course?.level || 'B1'
  const gradient = LEVEL_COLORS[level] || LEVEL_COLORS['B1']
  const isIssued = cert.status === 'issued'
  const date     = cert.issued_at
    ? new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Certificate Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Certificate preview */}
        <div className={`relative h-52 bg-gradient-to-br ${gradient} mx-6 mt-6 rounded-2xl overflow-hidden`}>
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-10 -left-6 w-36 h-36 bg-white/10 rounded-full" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/40">
              <Award size={32} className="text-white" />
            </div>
            <div className="text-center">
              <p className="text-white/75 text-xs uppercase tracking-widest mb-1">Certificate of Completion</p>
              <p className="text-white font-bold text-lg leading-tight px-8 text-center">{cert.course?.title}</p>
              <p className="text-white/70 text-sm mt-1">{level} Level · {cert.score != null ? `${cert.score}%` : 'Score pending'}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Status',    value: cert.status ? cert.status.charAt(0).toUpperCase() + cert.status.slice(1) : '—' },
              { label: 'Score',     value: cert.score != null ? `${cert.score}%` : '—'  },
              { label: 'Issued',    value: date || 'Pending'                             },
              { label: 'Level',     value: level                                         },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs mb-1">{label}</p>
                <p className="text-slate-800 text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {!isIssued && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <Clock size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-amber-700 text-xs">
                Your certificate is awaiting review by the platform team. You'll be notified once it's issued.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              Close
            </button>
            {isIssued && (
              <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 rounded-xl transition-colors font-medium">
                <Download size={14} /> Download PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ROOT ──────────────────────────────────────────────────────────────────────

export default function CertificatesPage() {
  const navigate = useNavigate()
  const logout   = useAuthStore(s => s.logout)
  const authUser = useAuthStore(s => s.user)

  const [collapsed,   setCollapsed]   = useState(false)
  const [certs,       setCerts]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [viewModal,   setViewModal]   = useState(null)

  const initials = authUser
    ? `${(authUser.first_name || '')[0] || ''}${(authUser.last_name || '')[0] || ''}`.toUpperCase()
    : '?'
  const fullName = authUser
    ? `${authUser.first_name || ''} ${authUser.last_name || ''}`.trim()
    : 'Student'

  const handleLogout = () => { clearTokens(); logout?.(); navigate('/login') }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    studentAPI.certificates()
      .then(res => {
        const d = res.data?.results ?? res.data
        setCerts(Array.isArray(d) ? d : [])
      })
      .catch(() => setError('Failed to load certificates.'))
      .finally(() => setLoading(false))
  }, [])

  // ── Derived ───────────────────────────────────────────────────────────────
  const issued  = certs.filter(c => c.status === 'issued')
  const pending = certs.filter(c => c.status === 'pending')
  const avgScore = issued.length
    ? Math.round(issued.reduce((s, c) => s + (c.score || 0), 0) / issued.length)
    : null

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-[#0a1628] flex flex-col transition-all duration-300 shrink-0`}>
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">D</div>
              <span className="text-white font-semibold text-sm">DeutschPro</span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-white transition-colors ml-auto">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV.map(({ icon: Icon, label, path }) => (
            <button key={path} onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium
                ${path === '/student/certificates'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'}`}>
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 text-sm transition-all">
            <Settings size={18} className="shrink-0" />
            {!collapsed && <span>Settings</span>}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 text-sm transition-all">
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-3 mt-2 border-t border-white/10">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{initials}</div>
              <div className="overflow-hidden">
                <p className="text-white text-xs font-medium truncate">{fullName}</p>
                <p className="text-slate-500 text-xs truncate">{authUser?.email || ''}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-slate-800 font-semibold text-lg">My Certificates</h1>
            <p className="text-slate-400 text-sm">{issued.length} earned · {pending.length} pending</p>
          </div>
          <Bell size={20} className="text-slate-500 cursor-pointer hover:text-slate-700" />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {/* Stats row */}
          {!loading && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Certificates Earned', value: issued.length,   icon: Award,          color: 'text-purple-500', bg: 'bg-purple-50' },
                { label: 'Pending Review',       value: pending.length,  icon: Clock,          color: 'text-amber-500',  bg: 'bg-amber-50'  },
                { label: 'Average Score',        value: avgScore != null ? `${avgScore}%` : '—', icon: Star, color: 'text-blue-500', bg: 'bg-blue-50' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon size={20} className={color} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{value}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading skeletons */}
          {loading ? (
            <div className="grid grid-cols-3 gap-5">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="h-36 bg-slate-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-8 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : certs.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                  <Trophy size={40} className="text-purple-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center border-2 border-white">
                  <GraduationCap size={16} className="text-amber-500" />
                </div>
              </div>
              <h3 className="text-slate-700 font-semibold text-lg mb-2">No certificates yet</h3>
              <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                Complete a course and pass the final exam to earn your first certificate. They'll appear here once issued.
              </p>
              <button onClick={() => navigate('/student/courses')}
                className="mt-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                <BookOpen size={14} /> Browse Courses
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Issued */}
              {issued.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle size={15} className="text-green-500" />
                    <h2 className="text-slate-700 font-semibold text-sm">Earned Certificates</h2>
                    <span className="text-slate-400 text-xs">({issued.length})</span>
                  </div>
                  <div className="grid grid-cols-3 gap-5">
                    {issued.map(c => (
                      <CertCard key={c.id} cert={c} onView={setViewModal} />
                    ))}
                  </div>
                </div>
              )}

              {/* Pending */}
              {pending.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={15} className="text-amber-400" />
                    <h2 className="text-slate-700 font-semibold text-sm">Awaiting Review</h2>
                    <span className="text-slate-400 text-xs">({pending.length})</span>
                  </div>
                  <div className="grid grid-cols-3 gap-5">
                    {pending.map(c => (
                      <CertCard key={c.id} cert={c} onView={setViewModal} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Certificate detail modal */}
      {viewModal && (
        <CertModal cert={viewModal} onClose={() => setViewModal(null)} />
      )}
    </div>
  )
}