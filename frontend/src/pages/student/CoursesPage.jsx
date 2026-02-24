import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, PlayCircle, ClipboardList, Award,
  BarChart2, Settings, LogOut, Bell, ChevronRight, Search,
  Filter, Users, Clock, Star, Lock, CheckCircle, RefreshCw,
  TrendingUp, AlertTriangle, X, ChevronLeft, Zap
} from 'lucide-react'
import { courseAPI } from '../../services/api'
import { clearTokens } from '../../services/auth'
import { useAuthStore } from '../../store/authStore'

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',    path: '/student/dashboard' },
  { icon: BookOpen,        label: 'My Courses',   path: '/student/courses'   },
  { icon: PlayCircle,      label: 'Lessons',      path: '/student/lesson'    },
  { icon: ClipboardList,   label: 'Tests',        path: '/student/tests'     },
  { icon: Award,           label: 'Certificates', path: '/student/certificates' },
  { icon: BarChart2,       label: 'Progress',     path: '/student/progress'  },
]

const LEVEL_COLORS = {
  A1: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  A2: { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    dot: 'bg-teal-400'    },
  B1: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-400'    },
  B2: { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  dot: 'bg-indigo-400'  },
  C1: { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  dot: 'bg-purple-400'  },
  C2: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400'   },
}

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']

// ── Course Card ───────────────────────────────────────────────────────────────

function CourseCard({ course, onEnroll, enrolling }) {
  const navigate = useNavigate()
  const lc = LEVEL_COLORS[course.level] || LEVEL_COLORS['B1']
  const isPublished = course.status === 'published'
  const isFree = !course.price || course.price === '0.00' || course.price === 0

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="relative h-44 bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden shrink-0">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-90" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
              <BookOpen size={26} className="text-white/60" />
            </div>
            <span className="text-white/30 text-xs font-medium">No thumbnail</span>
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${lc.bg} ${lc.text} ${lc.border}`}>
            {course.level}
          </span>
          {isFree && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-500 text-white">
              Free
            </span>
          )}
        </div>
        {!isPublished && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
              <Lock size={13} className="text-white/70" />
              <span className="text-white/70 text-xs font-medium">Coming Soon</span>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-slate-800 font-semibold text-base leading-snug mb-2 line-clamp-2">{course.title}</h3>

        {course.description && (
          <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">{course.description}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 mb-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Users size={12} /> {course.student_count ?? 0} students
          </span>
          <span className="flex items-center gap-1.5">
            <PlayCircle size={12} /> {course.lesson_count ?? 0} lessons
          </span>
          {course.instructor && (
            <span className="flex items-center gap-1.5 truncate">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              {course.instructor.full_name || `${course.instructor.first_name || ''} ${course.instructor.last_name || ''}`.trim()}
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-3 mt-auto">
          <div>
            {isFree ? (
              <span className="text-green-600 font-bold text-base">Free</span>
            ) : (
              <span className="text-slate-800 font-bold text-base">€{course.price}</span>
            )}
          </div>
          {isPublished ? (
            <button
              onClick={() => onEnroll(course)}
              disabled={enrolling === course.id}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              {enrolling === course.id
                ? <><RefreshCw size={13} className="animate-spin" /> Enrolling…</>
                : <><Zap size={13} /> Enrol Now</>
              }
            </button>
          ) : (
            <span className="text-slate-400 text-xs">Not available</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── ROOT ──────────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const navigate = useNavigate()
  const logout   = useAuthStore(s => s.logout)
  const authUser = useAuthStore(s => s.user)

  const [collapsed, setCollapsed] = useState(false)
  const [courses,   setCourses]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [search,    setSearch]    = useState('')
  const [levelFilter, setLevelFilter] = useState('All')
  const [enrolling, setEnrolling] = useState(null)   // course id being enrolled
  const [toast,     setToast]     = useState(null)   // { message, type }

  const initials = authUser
    ? `${(authUser.first_name || '')[0] || ''}${(authUser.last_name || '')[0] || ''}`.toUpperCase()
    : '?'
  const fullName = authUser
    ? `${authUser.first_name || ''} ${authUser.last_name || ''}`.trim()
    : 'Student'

  const handleLogout = () => { clearTokens(); logout?.(); navigate('/login') }
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    courseAPI.list()
      .then(res => {
        const d = res.data?.results ?? res.data
        setCourses(Array.isArray(d) ? d : [])
      })
      .catch(() => setError('Failed to load courses. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  // ── Enrol ─────────────────────────────────────────────────────────────────
  const handleEnroll = async (course) => {
    setEnrolling(course.id)
    try {
      await courseAPI.enroll(course.id)
      showToast(`Enrolled in "${course.title}" successfully!`)
      // Navigate to the lesson page for this course
      setTimeout(() => navigate(`/student/lesson/${course.id}/first`), 1200)
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error
      if (msg?.toLowerCase().includes('already')) {
        showToast('Already enrolled — taking you there…')
        setTimeout(() => navigate(`/student/lesson/${course.id}/first`), 1200)
      } else {
        showToast(msg || 'Enrolment failed. Please try again.', 'error')
      }
    } finally {
      setEnrolling(null)
    }
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = courses.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    const matchLevel  = levelFilter === 'All' || c.level === levelFilter
    return matchSearch && matchLevel
  })

  const published = filtered.filter(c => c.status === 'published')
  const other     = filtered.filter(c => c.status !== 'published')

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
                ${path === '/student/courses' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:text-white hover:bg-white/8'}`}>
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
            <h1 className="text-slate-800 font-semibold text-lg">Browse Courses</h1>
            <p className="text-slate-400 text-sm">{courses.length} course{courses.length !== 1 ? 's' : ''} available</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell size={20} className="text-slate-500 cursor-pointer hover:text-slate-700" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* Search + filter */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search courses…"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <div className="flex gap-1.5">
                {LEVELS.map(lv => (
                  <button key={lv} onClick={() => setLevelFilter(lv)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                      ${levelFilter === lv ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'}`}>
                    {lv}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="grid grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="h-44 bg-slate-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen size={28} className="text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mb-1">No courses found</p>
              <p className="text-slate-400 text-sm">Try a different search or level filter</p>
              <button onClick={() => { setSearch(''); setLevelFilter('All') }}
                className="mt-4 text-blue-600 text-sm font-medium hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Published courses */}
              {published.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={15} className="text-green-500" />
                    <h2 className="text-slate-700 font-semibold text-sm">Available Now</h2>
                    <span className="text-slate-400 text-xs">({published.length})</span>
                  </div>
                  <div className="grid grid-cols-3 gap-5">
                    {published.map(c => (
                      <CourseCard key={c.id} course={c} onEnroll={handleEnroll} enrolling={enrolling} />
                    ))}
                  </div>
                </div>
              )}

              {/* Draft / review courses */}
              {other.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={15} className="text-slate-400" />
                    <h2 className="text-slate-700 font-semibold text-sm">Coming Soon</h2>
                    <span className="text-slate-400 text-xs">({other.length})</span>
                  </div>
                  <div className="grid grid-cols-3 gap-5">
                    {other.map(c => (
                      <CourseCard key={c.id} course={c} onEnroll={handleEnroll} enrolling={enrolling} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
          {toast.message}
        </div>
      )}
    </div>
  )
}