import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Video, ClipboardList, Users, BarChart2,
  Settings, LogOut, ChevronLeft, ChevronRight, Bell, Upload, Plus,
  Search, Filter, MoreVertical, Play, Eye, Edit2, Trash2, CheckCircle,
  XCircle, AlertTriangle, TrendingUp, TrendingDown, Award, Clock,
  FileText, Mic, PenTool, Star, Download, ChevronDown, Menu, X,
  UserCheck, Target, Activity, Layers, MessageSquare, ThumbsUp, Flag,
  RefreshCw, GripVertical, Zap, BarChart, Globe, Lock, Send, GraduationCap,
  Calendar, Video as VideoIcon, Link, CheckSquare, XSquare
} from 'lucide-react'
import { instructorAPI } from '../../services/api'
import API from '../../services/api'
import { clearTokens } from '../../services/auth'
import { useAuthStore } from '../../store/authStore'

// ── Static nav ────────────────────────────────────────────────────────────────

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',        id: 'dashboard'        },
  { icon: BookOpen,        label: 'My Courses',       id: 'courses'          },
  { icon: Video,           label: 'Video Library',    id: 'videos'           },
  { icon: ClipboardList,   label: 'Test Builder',     id: 'tests'            },
  { icon: Users,           label: 'Students',         id: 'students'         },
  { icon: BarChart2,       label: 'Analytics',        id: 'analytics'        },
  { icon: GraduationCap,   label: 'Exam Requests',    id: 'exam-requests'    },
  { icon: Calendar,        label: 'Lesson Requests',  id: 'lesson-requests'  },
]

// ── Mock data (no endpoints yet) ──────────────────────────────────────────────

const MOCK_ACTIVITY = [
  { text: 'Priya Nair passed B2 Mock Exam with 92%', time: '30m ago', icon: Award,         color: 'text-green-500' },
  { text: 'Kwame Asante submitted Essay Task 3',      time: '2h ago',  icon: FileText,      color: 'text-blue-500'  },
  { text: 'James Okonkwo inactive for 3 days',       time: '3d ago',  icon: AlertTriangle, color: 'text-amber-500' },
  { text: '14 students completed A1 Module 2',       time: '1d ago',  icon: CheckCircle,   color: 'text-green-500' },
]

const MOCK_VIDEOS = [
  { title: 'Dativ & Akkusativ Explained', duration: '12:34', course: 'B1 Grammar Intensive', views: 241, uploaded: '3d ago'  },
  { title: 'Perfekt vs. Präteritum',      duration: '09:17', course: 'A2 Foundation',         views: 189, uploaded: '1w ago'  },
  { title: 'German Word Order Rules',     duration: '15:02', course: 'B2 Advanced Grammar',   views: 312, uploaded: '2w ago'  },
  { title: 'Modal Verbs Deep Dive',       duration: '11:45', course: 'B1 Grammar Intensive',  views: 178, uploaded: '3w ago'  },
]

// ── Style helpers ─────────────────────────────────────────────────────────────

const levelColors = {
  A1: 'bg-slate-100 text-slate-600',
  A2: 'bg-blue-100 text-blue-700',
  B1: 'bg-green-100 text-green-700',
  B2: 'bg-amber-100 text-amber-700',
  C1: 'bg-purple-100 text-purple-700',
  C2: 'bg-red-100 text-red-700',
}

const courseStatusStyle = {
  published: 'bg-green-100 text-green-700',
  review:    'bg-amber-100 text-amber-700',
  draft:     'bg-slate-100 text-slate-500',
}
const courseStatusLabel = { published: 'Live', review: 'In Review', draft: 'Draft' }

const lessonRequestStatusConfig = {
  pending:   { label: 'Pending',   color: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400'  },
  confirmed: { label: 'Confirmed', color: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500'  },
  rejected:  { label: 'Rejected',  color: 'bg-red-50 text-red-700 border-red-200',         dot: 'bg-red-500'    },
  completed: { label: 'Completed', color: 'bg-blue-50 text-blue-700 border-blue-200',      dot: 'bg-blue-500'   },
}

function deriveStudentStatus(s) {
  if (s.status === 'inactive') return 'at-risk'
  if (s.readiness >= 75)       return 'excelling'
  if (s.readiness >= 50)       return 'on-track'
  return 'at-risk'
}

const statusConfig = {
  'on-track':  { label: 'On Track',  color: 'text-green-600 bg-green-50', dot: 'bg-green-500' },
  'at-risk':   { label: 'At Risk',   color: 'text-red-600 bg-red-50',     dot: 'bg-red-500'   },
  'excelling': { label: 'Excelling', color: 'text-blue-600 bg-blue-50',   dot: 'bg-blue-500'  },
}

// ── Primitives ────────────────────────────────────────────────────────────────

function ProgressBar({ value, color = 'blue', height = 'h-2' }) {
  const colorMap = { blue: 'bg-blue-500', green: 'bg-green-500', amber: 'bg-amber-400', red: 'bg-red-500', purple: 'bg-purple-500' }
  return (
    <div className={`w-full bg-gray-100 rounded-full ${height}`}>
      <div className={`${colorMap[color]} ${height} rounded-full transition-all duration-700`} style={{ width: `${Math.min(value ?? 0, 100)}%` }} />
    </div>
  )
}

function ScoreRing({ value, size = 56, stroke = 5, color = '#3B82F6' }) {
  const r    = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ - (value / 100) * circ}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  )
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-slate-800 font-semibold text-lg">{title}</h2>
        {subtitle && <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium
      ${type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
      {type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} className="text-green-400" />}
      {message}
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  )
}

// ── Tab panels ────────────────────────────────────────────────────────────────

function CoursesPanel({ courses, loading, navigate }) {
  return (
    <div>
      <SectionHeader
        title="My Courses"
        subtitle="Manage, edit and publish your courses"
        action={
          <button onClick={() => navigate('/instructor/courses/new')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors">
            <Plus size={14} /> New Course
          </button>
        }
      />
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse h-40" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <BookOpen size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium mb-1">No courses yet</p>
          <p className="text-slate-400 text-sm mb-5">Create your first course to get started</p>
          <button onClick={() => navigate('/instructor/courses/new')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2.5 rounded-xl font-medium transition-colors mx-auto">
            <Plus size={14} /> Create Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {courses.map((c, i) => (
            <div key={c.id ?? i} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-slate-800 font-semibold text-sm truncate mb-1">{c.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${courseStatusStyle[c.status] || courseStatusStyle.draft}`}>
                      {courseStatusLabel[c.status] || 'Draft'}
                    </span>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${levelColors[c.level] || 'bg-slate-100 text-slate-500'}`}>
                      {c.level}
                    </span>
                  </div>
                </div>
                <button onClick={() => navigate(`/instructor/courses/${c.id}/edit`)}
                  className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0 ml-2">
                  <Edit2 size={14} />
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                <span className="flex items-center gap-1"><Users size={11} /> {c.student_count ?? 0} students</span>
                <span className="flex items-center gap-1"><Video size={11} /> {c.lesson_count ?? 0} lessons</span>
              </div>
              <ProgressBar value={0} color="blue" />
              <div className="flex gap-2 mt-4">
                <button onClick={() => navigate(`/instructor/courses/${c.id}/edit`)}
                  className="flex-1 text-xs border border-slate-200 text-slate-600 py-1.5 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                  Edit
                </button>
                {c.status === 'draft' && (
                  <button className="flex-1 text-xs bg-blue-600 text-white py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-1">
                    <Send size={11} /> Submit
                  </button>
                )}
                {c.status === 'published' && (
                  <button className="flex-1 text-xs bg-green-50 text-green-700 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 cursor-default">
                    <Globe size={11} /> Live
                  </button>
                )}
                {c.status === 'review' && (
                  <button className="flex-1 text-xs bg-amber-50 text-amber-700 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 cursor-default">
                    <Clock size={11} /> In Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function VideosPanel({ navigate }) {
  return (
    <div>
      <SectionHeader
        title="Video Library"
        subtitle="All uploaded lesson videos"
        action={
          <button onClick={() => navigate('/instructor/video-upload')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors">
            <Upload size={14} /> Upload Video
          </button>
        }
      />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 font-medium">
              <th className="text-left px-5 py-3">Title</th>
              <th className="text-left px-3 py-3">Course</th>
              <th className="text-left px-3 py-3">Duration</th>
              <th className="text-left px-3 py-3">Views</th>
              <th className="text-left px-3 py-3">Uploaded</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {MOCK_VIDEOS.map((v, i) => (
              <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Play size={14} className="text-blue-500 ml-0.5" />
                    </div>
                    <span className="text-slate-800 text-sm font-medium">{v.title}</span>
                  </div>
                </td>
                <td className="px-3 py-3.5"><span className="text-slate-500 text-xs">{v.course}</span></td>
                <td className="px-3 py-3.5"><span className="text-slate-500 text-xs flex items-center gap-1"><Clock size={11} />{v.duration}</span></td>
                <td className="px-3 py-3.5"><span className="text-slate-500 text-xs">{v.views}</span></td>
                <td className="px-3 py-3.5"><span className="text-slate-400 text-xs">{v.uploaded}</span></td>
                <td className="px-3 py-3.5">
                  <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-4 border-t border-slate-50 text-center">
          <p className="text-slate-400 text-xs italic">Showing sample data — upload real videos to populate this library</p>
        </div>
      </div>
    </div>
  )
}

function TestsPanel({ navigate }) {
  return (
    <div>
      <SectionHeader
        title="Test Builder"
        subtitle="Create and manage assessments for your students"
        action={
          <button onClick={() => navigate('/instructor/test-builder')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors">
            <Plus size={14} /> New Test
          </button>
        }
      />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Tests',    value: '—', icon: ClipboardList, color: 'blue'  },
          { label: 'Avg. Pass Rate', value: '—', icon: CheckCircle,   color: 'green' },
          { label: 'Pending Grading',value: '—', icon: PenTool,       color: 'amber' },
        ].map(({ label, value, icon: Icon, color }) => {
          const bg = { blue: 'bg-blue-50', green: 'bg-green-50', amber: 'bg-amber-50' }[color]
          const ic = { blue: 'text-blue-500', green: 'text-green-500', amber: 'text-amber-500' }[color]
          return (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={16} className={ic} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{label}</p>
            </div>
          )
        })}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
        <ClipboardList size={32} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium mb-1">No tests yet</p>
        <p className="text-slate-400 text-sm mb-5">Build your first test to assess your students</p>
        <button onClick={() => navigate('/instructor/test-builder')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2.5 rounded-xl font-medium transition-colors mx-auto">
          <Plus size={14} /> Open Test Builder
        </button>
      </div>
    </div>
  )
}

function StudentsPanel({ students, studentsLoading, studentSearch, setStudentSearch, studentFilter, setStudentFilter }) {
  const filtered = students
    .map(s => ({ ...s, _status: deriveStudentStatus(s) }))
    .filter(s => {
      const matchSearch = !studentSearch ||
        (s.name  || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(studentSearch.toLowerCase())
      const matchFilter = studentFilter === 'all' || s._status === studentFilter
      return matchSearch && matchFilter
    })

  return (
    <div>
      <SectionHeader
        title="Students"
        subtitle={studentsLoading ? 'Loading…' : `${students.length} enrolled students`}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                placeholder="Search students…"
                className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
            </div>
            <select value={studentFilter} onChange={e => setStudentFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All</option>
              <option value="excelling">Excelling</option>
              <option value="on-track">On Track</option>
              <option value="at-risk">At Risk</option>
            </select>
          </div>
        }
      />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {studentsLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
            <RefreshCw size={15} className="animate-spin" /> Loading students…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            {students.length === 0 ? 'No students enrolled yet.' : 'No students match your filter.'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 font-medium">
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-left px-3 py-3">Level</th>
                <th className="text-left px-3 py-3 w-32">Progress</th>
                <th className="text-left px-3 py-3">Readiness</th>
                <th className="text-left px-3 py-3">Last Active</th>
                <th className="text-left px-3 py-3">Status</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const st        = statusConfig[s._status]
                const progress  = Math.round(s.progress  ?? 0)
                const readiness = Math.round(s.readiness ?? 0)
                const readColor = readiness >= 75 ? 'text-green-600' : readiness >= 55 ? 'text-amber-600' : 'text-red-600'
                const nameInit  = (s.name || s.email || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                const lastActive = s.last_active
                  ? new Date(s.last_active).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  : '—'
                return (
                  <tr key={s.id ?? i} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">{nameInit}</div>
                        <div className="min-w-0">
                          <p className="text-slate-800 text-sm font-medium truncate">{s.name || '—'}</p>
                          <p className="text-slate-400 text-xs truncate">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${levelColors[s.level] || 'bg-slate-100 text-slate-500'}`}>{s.level || '—'}</span>
                    </td>
                    <td className="px-3 py-3.5 w-32">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={progress} color={progress >= 70 ? 'green' : progress >= 40 ? 'blue' : 'amber'} />
                        <span className="text-xs text-slate-500 shrink-0">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <ScoreRing value={readiness} size={32} stroke={3} color={readiness >= 75 ? '#10B981' : readiness >= 55 ? '#F59E0B' : '#EF4444'} />
                        <span className={`text-sm font-semibold ${readColor}`}>{readiness}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5"><span className="text-slate-400 text-xs">{lastActive}</span></td>
                    <td className="px-3 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {st.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <button className="text-slate-400 hover:text-slate-600 transition-colors"><MoreVertical size={15} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function AnalyticsPanel({ weakAreas, weakAreasLoading }) {
  return (
    <div>
      <SectionHeader title="Analytics" subtitle="Class performance and weak area insights" />
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Class Weak Areas</h3>
          </div>
          {weakAreasLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-400 text-sm">
              <RefreshCw size={14} className="animate-spin" /> Loading…
            </div>
          ) : weakAreas.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle size={24} className="text-green-400 mx-auto mb-2" />
              <p className="text-slate-500 text-sm font-medium">No weak areas detected yet</p>
              <p className="text-slate-400 text-xs mt-1">Add topics to questions in Django admin, then student answers will populate this automatically.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {weakAreas.map((w, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-slate-700 text-xs font-medium">{w.area}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs">{w.students} students</span>
                      <span className={`text-xs font-bold ${w.avgScore < 50 ? 'text-red-600' : 'text-amber-600'}`}>{w.avgScore}%</span>
                    </div>
                  </div>
                  <ProgressBar value={w.avgScore} color={w.avgScore < 50 ? 'red' : 'amber'} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart size={16} className="text-blue-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Score Distribution</h3>
          </div>
          <div className="flex items-end justify-between gap-2 h-36 px-2">
            {[
              { range: '0–20',   pct: 5  },
              { range: '21–40',  pct: 12 },
              { range: '41–60',  pct: 28 },
              { range: '61–80',  pct: 42 },
              { range: '81–100', pct: 35 },
            ].map(({ range, pct }) => (
              <div key={range} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-600">{pct}%</span>
                <div className="w-full bg-blue-100 rounded-t-lg" style={{ height: `${(pct / 50) * 100}%`, minHeight: 4 }} />
                <span className="text-slate-400 text-xs">{range}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-xs mt-5 italic">Sample data — analytics endpoint coming soon</p>
        </div>

        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {MOCK_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                  <a.icon size={14} className={a.color} />
                </div>
                <p className="text-slate-700 text-sm flex-1">{a.text}</p>
                <span className="text-slate-400 text-xs shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Goethe Exam Requests Panel ────────────────────────────────────────────────

const goetheInstructorAPI = {
  myRequests:    () => API.get('/goethe/requests/'),
  actionRequest: (id, data) => API.patch(`/goethe/requests/${id}/action/`, data),
}

function ExamRequestsPanel({ showToast }) {
  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [acting,   setActing]   = useState(null)
  const [noteMap,  setNoteMap]  = useState({})

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const fmtKES  = (n) => n ? `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}` : '—'

  const loadRequests = () => {
    setLoading(true)
    goetheInstructorAPI.myRequests()
      .then(r => setRequests(r.data?.results ?? r.data ?? []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadRequests() }, [])

  const handleForward = async (req) => {
    setActing(req.id)
    try {
      await goetheInstructorAPI.actionRequest(req.id, { action: 'forward', note: noteMap[req.id] || '' })
      showToast?.('Request forwarded to admin')
      setRequests(prev => prev.filter(r => r.id !== req.id))
    } catch {
      showToast?.('Failed to forward request', 'error')
    } finally { setActing(null) }
  }

  return (
    <div>
      <SectionHeader
        title="Exam Requests"
        subtitle="Students requesting Goethe-Zertifikat exam access — review and forward to admin"
      />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-400 text-sm">
          <RefreshCw size={15} className="animate-spin" /> Loading requests…
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={24} className="text-green-400" />
          </div>
          <p className="text-slate-600 font-medium mb-1">No pending exam requests</p>
          <p className="text-slate-400 text-sm">Student Goethe exam access requests will appear here for you to review and forward to admin.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                    {`${(req.student?.full_name || req.student?.first_name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}`}
                  </div>
                  <div>
                    <p className="text-slate-800 text-sm font-semibold">{req.student?.full_name || `${req.student?.first_name || ''} ${req.student?.last_name || ''}`.trim() || req.student?.email}</p>
                    <p className="text-slate-400 text-xs">{req.student?.email}</p>
                  </div>
                </div>
                <span className="text-slate-400 text-xs">Requested {fmtDate(req.created_at)}</span>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Exam</p>
                    <p className="text-slate-800 font-bold text-sm">Goethe-Zertifikat {req.exam?.level}</p>
                    <p className="text-slate-500 text-xs mt-1">📍 {req.exam?.location}</p>
                    <p className="text-slate-500 text-xs mt-0.5">📅 {fmtDate(req.exam?.exam_date_start)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Registration & Price</p>
                    <p className="text-slate-700 text-xs font-medium">{fmtDate(req.exam?.reg_open)} – {fmtDate(req.exam?.reg_close)}</p>
                    <p className="text-slate-800 text-xs mt-1 font-semibold">{fmtKES(req.exam?.price_full)}</p>
                    {req.exam?.price_reduced && <p className="text-green-600 text-xs">{fmtKES(req.exam?.price_reduced)} reduced</p>}
                  </div>
                </div>

                {req.student_note && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">Student's Note</p>
                    <p className="text-slate-700 text-sm italic">"{req.student_note}"</p>
                  </div>
                )}

                <div className="mb-4">
                  <label className="text-slate-600 text-xs font-semibold uppercase tracking-wide block mb-1.5">
                    Note to admin <span className="font-normal text-slate-400 normal-case">(optional)</span>
                  </label>
                  <textarea
                    value={noteMap[req.id] || ''}
                    onChange={e => setNoteMap(m => ({ ...m, [req.id]: e.target.value }))}
                    placeholder="Add context for admin (e.g. student readiness, attendance)…"
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleForward(req)}
                    disabled={acting === req.id}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm px-5 py-2.5 rounded-xl font-medium transition-colors">
                    {acting === req.id
                      ? <><RefreshCw size={14} className="animate-spin" /> Forwarding…</>
                      : <><Send size={14} /> Forward to Admin</>}
                  </button>
                  <p className="text-slate-400 text-xs">Forwarding sends this to admin who will approve and email the student.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Lesson Requests Panel ─────────────────────────────────────────────────────

const lessonRequestAPI = {
  list:   (params) => API.get('/instructor/lesson-requests/', { params }),
  update: (id, data) => API.patch(`/instructor/lesson-requests/${id}/`, data),
}

function LessonRequestsPanel({ showToast }) {
  const [requests,    setRequests]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [statusFilter,setStatusFilter]= useState('pending')
  const [actionModal, setActionModal] = useState(null) // { req, mode: 'confirm'|'reject' }
  const [zoomLink,    setZoomLink]    = useState('')
  const [note,        setNote]        = useState('')
  const [submitting,  setSubmitting]  = useState(false)

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'
  const fmtTime = (t) => {
    if (!t) return '—'
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  }

  const loadRequests = (filter) => {
    setLoading(true)
    lessonRequestAPI.list(filter !== 'all' ? { status: filter } : {})
      .then(r => setRequests(r.data?.results ?? r.data ?? []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadRequests(statusFilter) }, [statusFilter])

  const openModal = (req, mode) => {
    setActionModal({ req, mode })
    setZoomLink('')
    setNote('')
  }

  const handleSubmit = async () => {
    if (!actionModal) return
    const { req, mode } = actionModal

    if (mode === 'confirm' && !zoomLink.trim()) {
      showToast('Please enter a Zoom link before confirming.', 'error')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        status: mode === 'confirm' ? 'confirmed' : 'rejected',
        ...(zoomLink.trim()  && { zoom_link:       zoomLink.trim()  }),
        ...(note.trim()      && { instructor_note: note.trim()      }),
      }
      const { data } = await lessonRequestAPI.update(req.id, payload)

      setRequests(prev => prev.map(r => r.id === req.id ? data : r).filter(r =>
        statusFilter === 'all' || r.status === statusFilter
      ))
      showToast(mode === 'confirm' ? 'Lesson confirmed — student has been notified.' : 'Request rejected.')
      setActionModal(null)
    } catch {
      showToast('Something went wrong. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkComplete = async (req) => {
    try {
      const { data } = await lessonRequestAPI.update(req.id, { status: 'completed' })
      setRequests(prev => prev.map(r => r.id === req.id ? data : r).filter(r =>
        statusFilter === 'all' || r.status === statusFilter
      ))
      showToast('Lesson marked as completed.')
    } catch {
      showToast('Failed to update status.', 'error')
    }
  }

  const nameInit = (name) =>
    (name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div>
      <SectionHeader
        title="Lesson Requests"
        subtitle="Personal lesson requests from your students"
        action={
          <div className="flex items-center gap-2">
            {['pending', 'confirmed', 'completed', 'rejected', 'all'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-colors
                  ${statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'}`}>
                {s}
              </button>
            ))}
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-400 text-sm">
          <RefreshCw size={15} className="animate-spin" /> Loading requests…
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar size={24} className="text-blue-400" />
          </div>
          <p className="text-slate-600 font-medium mb-1">
            No {statusFilter !== 'all' ? statusFilter : ''} lesson requests
          </p>
          <p className="text-slate-400 text-sm">
            When students book a personal lesson, the requests will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => {
            const sc = lessonRequestStatusConfig[req.status] || lessonRequestStatusConfig.pending
            const initials = nameInit(req.student_name)
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* Card header */}
                <div className="bg-slate-50 px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="text-slate-800 text-sm font-semibold">{req.student_name || '—'}</p>
                      <p className="text-slate-400 text-xs">{req.student_email || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${sc.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-3 gap-4 mb-4">

                    {/* Topic */}
                    <div className="col-span-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl px-4 py-3">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Topic</p>
                      <p className="text-slate-800 font-semibold text-sm">{req.topic}</p>
                    </div>

                    {/* Preferred date/time */}
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">Preferred</p>
                      <p className="text-slate-700 text-xs font-medium">{fmtDate(req.preferred_date)}</p>
                      <p className="text-slate-600 text-xs mt-0.5">{fmtTime(req.preferred_time)}</p>
                    </div>

                    {/* Alt date/time */}
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">Alternative</p>
                      {req.alt_date ? (
                        <>
                          <p className="text-slate-700 text-xs font-medium">{fmtDate(req.alt_date)}</p>
                          <p className="text-slate-600 text-xs mt-0.5">{fmtTime(req.alt_time)}</p>
                        </>
                      ) : (
                        <p className="text-slate-400 text-xs italic">Not provided</p>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">Duration</p>
                      <p className="text-slate-700 text-xs font-medium flex items-center gap-1">
                        <Clock size={11} className="text-slate-400" />
                        {req.duration_minutes} minutes
                      </p>
                    </div>
                  </div>

                  {/* Student message */}
                  {req.student_message && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">Student's Message</p>
                      <p className="text-slate-700 text-sm italic">"{req.student_message}"</p>
                    </div>
                  )}

                  {/* Zoom link — show if confirmed */}
                  {req.zoom_link && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-4">
                      <VideoIcon size={14} className="text-green-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-green-700 text-xs font-semibold mb-0.5">Zoom Link</p>
                        <a href={req.zoom_link} target="_blank" rel="noopener noreferrer"
                          className="text-green-700 text-xs underline truncate block">{req.zoom_link}</a>
                      </div>
                    </div>
                  )}

                  {/* Instructor note — show if set */}
                  {req.instructor_note && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-4">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Your Note</p>
                      <p className="text-slate-600 text-sm">{req.instructor_note}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => openModal(req, 'confirm')}
                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors">
                        <CheckSquare size={14} /> Confirm & Send Zoom Link
                      </button>
                      <button onClick={() => openModal(req, 'reject')}
                        className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-sm px-4 py-2 rounded-xl font-medium transition-colors">
                        <XSquare size={14} /> Decline
                      </button>
                    </div>
                  )}

                  {req.status === 'confirmed' && (
                    <button onClick={() => handleMarkComplete(req)}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors">
                      <CheckCircle size={14} /> Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Action Modal ── */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

            <div className={`px-6 py-5 flex items-start justify-between ${actionModal.mode === 'confirm' ? 'bg-green-600' : 'bg-red-600'}`}>
              <div>
                <h3 className="text-white font-semibold text-base">
                  {actionModal.mode === 'confirm' ? 'Confirm Lesson' : 'Decline Request'}
                </h3>
                <p className="text-white/70 text-sm mt-0.5">
                  {actionModal.req.student_name} · {actionModal.req.topic}
                </p>
              </div>
              <button onClick={() => setActionModal(null)} className="text-white/60 hover:text-white mt-0.5">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* Quick date recap */}
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600">
                <span className="font-medium">Preferred: </span>
                {fmtDate(actionModal.req.preferred_date)} at {fmtTime(actionModal.req.preferred_time)}
                {actionModal.req.alt_date && (
                  <><br /><span className="font-medium">Alternative: </span>
                  {fmtDate(actionModal.req.alt_date)} at {fmtTime(actionModal.req.alt_time)}</>
                )}
              </div>

              {/* Zoom link — required for confirm */}
              {actionModal.mode === 'confirm' && (
                <div>
                  <label className="text-slate-700 text-xs font-semibold uppercase tracking-wide block mb-1.5">
                    Zoom Meeting Link <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={zoomLink}
                      onChange={e => setZoomLink(e.target.value)}
                      placeholder="https://zoom.us/j/..."
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  <p className="text-slate-400 text-xs mt-1">This link will be shared with the student immediately.</p>
                </div>
              )}

              {/* Optional note */}
              <div>
                <label className="text-slate-700 text-xs font-semibold uppercase tracking-wide block mb-1.5">
                  Note to Student <span className="text-slate-400 font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  placeholder={actionModal.mode === 'confirm'
                    ? 'E.g. "Looking forward to it! Please join 5 minutes early."'
                    : 'E.g. "Unfortunately I\'m unavailable — please suggest a different date."'}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button onClick={() => setActionModal(null)}
                  className="text-slate-500 text-sm hover:text-slate-700">Cancel</button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || (actionModal.mode === 'confirm' && !zoomLink.trim())}
                  className={`flex items-center gap-2 text-white text-sm px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50
                    ${actionModal.mode === 'confirm' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {submitting
                    ? <><RefreshCw size={14} className="animate-spin" /> Saving…</>
                    : actionModal.mode === 'confirm'
                      ? <><Send size={14} /> Confirm & Notify Student</>
                      : <><XCircle size={14} /> Decline Request</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ROOT ──────────────────────────────────────────────────────────────────────

export default function InstructorDashboard() {
  const navigate = useNavigate()
  const logout   = useAuthStore((s) => s.logout)
  const user     = useAuthStore((s) => s.user)

  const [collapsed,        setCollapsed]        = useState(false)
  const [activeNav,        setActiveNav]        = useState('dashboard')
  const [gradingModal,     setGradingModal]     = useState(null)
  const [rubricScores,     setRubricScores]     = useState({ content: 7, grammar: 6, vocabulary: 8, structure: 7 })
  const [loading,          setLoading]          = useState(true)
  const [studentsLoading,  setStudentsLoading]  = useState(true)
  const [weakAreasLoading, setWeakAreasLoading] = useState(true)
  const [error,            setError]            = useState('')
  const [dashData,         setDashData]         = useState(null)
  const [students,         setStudents]         = useState([])
  const [weakAreas,        setWeakAreas]        = useState([])
  const [pendingList,      setPendingList]      = useState([])
  const [studentSearch,    setStudentSearch]    = useState('')
  const [studentFilter,    setStudentFilter]    = useState('all')
  const [gradeFeedback,    setGradeFeedback]    = useState('')
  const [gradeSubmitting,  setGradeSubmitting]  = useState(false)
  const [toast,            setToast]            = useState(null) // { message, type }

  const showToast = (message, type = 'success') => setToast({ message, type })

  const rubricTotal = Object.values(rubricScores).reduce((a, b) => a + b, 0)
  const rubricMax   = 40
  const rubricPct   = Math.round((rubricTotal / rubricMax) * 100)

  useEffect(() => {
    instructorAPI.dashboard()
      .then(({ data }) => { setDashData(data); setLoading(false) })
      .catch(err => {
        if (err.response?.status === 401) { clearTokens(); navigate('/login') }
        else { setError('Failed to load dashboard.'); setLoading(false) }
      })
  }, [])

  useEffect(() => {
    instructorAPI.students()
      .then(({ data }) => setStudents(Array.isArray(data) ? data : (data.results ?? [])))
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false))
  }, [])

  useEffect(() => {
    instructorAPI.weakAreas()
      .then(({ data }) => setWeakAreas(Array.isArray(data) ? data : []))
      .catch(() => setWeakAreas([]))
      .finally(() => setWeakAreasLoading(false))
  }, [])

  useEffect(() => {
    instructorAPI.pendingGrading()
      .then(({ data }) => setPendingList(Array.isArray(data) ? data : []))
      .catch(() => setPendingList([]))
  }, [])

  const handleLogout = () => { clearTokens(); logout?.(); navigate('/login') }

  const handleGradeSubmit = async () => {
    if (!gradingModal?.answer_id) { setGradingModal(null); return }
    setGradeSubmitting(true)
    try {
      await instructorAPI.grade(gradingModal.answer_id, {
        points_awarded: (rubricTotal / rubricMax) * 10,
        feedback: gradeFeedback,
      })
      setPendingList(prev => prev.filter(p => p.answer_id !== gradingModal.answer_id))
      setDashData(prev => prev ? { ...prev, pending_grading: Math.max(0, (prev.pending_grading || 1) - 1) } : prev)
      setGradingModal(null)
      setGradeFeedback('')
    } catch {
      // keep modal open on error
    } finally {
      setGradeSubmitting(false)
    }
  }

  const totalStudents  = dashData?.total_students   ?? '—'
  const pendingCount   = dashData?.pending_grading  ?? '—'
  const avgReadiness   = dashData?.avg_readiness    != null ? `${Math.round(dashData.avg_readiness)}%` : '—'
  const completionRate = dashData?.completion_rate  != null ? `${Math.round(dashData.completion_rate)}%` : '—'
  const courses        = dashData?.courses ?? []

  const initials = user ? `${(user.first_name||'')[0]||''}${(user.last_name||'')[0]||''}`.toUpperCase() : 'IN'
  const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Instructor'
  const today    = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const stats = [
    { label: 'Active Students',     value: loading ? '…' : String(totalStudents), icon: Users,       color: 'blue',  onClick: () => setActiveNav('students') },
    { label: 'Avg. Exam Readiness', value: loading ? '…' : avgReadiness,          icon: Target,      color: 'green', onClick: null },
    { label: 'Completion Rate',     value: loading ? '…' : completionRate,        icon: CheckCircle, color: 'amber', onClick: null },
    { label: 'Pending Grading',     value: loading ? '…' : String(pendingCount),  icon: PenTool,     color: 'red',   onClick: () => setActiveNav('tests') },
  ]

  const topbarActions = {
    dashboard:        [
      { label: 'New Course',   icon: Plus,   bg: 'bg-green-600 hover:bg-green-700', onClick: () => navigate('/instructor/courses/new') },
      { label: 'Upload Video', icon: Upload, bg: 'bg-blue-600 hover:bg-blue-700',   onClick: () => navigate('/instructor/video-upload') },
    ],
    courses:          [{ label: 'New Course',   icon: Plus,   bg: 'bg-blue-600 hover:bg-blue-700', onClick: () => navigate('/instructor/courses/new') }],
    videos:           [{ label: 'Upload Video', icon: Upload, bg: 'bg-blue-600 hover:bg-blue-700', onClick: () => navigate('/instructor/video-upload') }],
    tests:            [{ label: 'New Test',     icon: Plus,   bg: 'bg-blue-600 hover:bg-blue-700', onClick: () => navigate('/instructor/test-builder') }],
    students:         [],
    analytics:        [],
    'exam-requests':  [],
    'lesson-requests':[],
  }

  const filteredStudents = students
    .map(s => ({ ...s, _status: deriveStudentStatus(s) }))
    .filter(s => {
      const matchSearch = !studentSearch ||
        (s.name  || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(studentSearch.toLowerCase())
      const matchFilter = studentFilter === 'all' || s._status === studentFilter
      return matchSearch && matchFilter
    })

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-[#0F1B35] flex flex-col transition-all duration-300 shrink-0`}>
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">DE</span>
              </div>
              <span className="text-white font-semibold text-sm tracking-wide">DeutschPro</span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-white transition-colors ml-auto">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {!collapsed && (
          <div className="mx-4 mt-4 mb-2 bg-blue-500/15 border border-blue-500/25 rounded-lg px-3 py-2 flex items-center gap-2">
            <UserCheck size={14} className="text-blue-400" />
            <span className="text-blue-300 text-xs font-medium">Instructor View</span>
          </div>
        )}

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, id }) => (
            <button key={id} onClick={() => setActiveNav(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium
                ${activeNav === id
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
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-xs font-medium truncate">{fullName}</p>
                <p className="text-slate-500 text-xs truncate">Instructor</p>
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
            <h1 className="text-slate-800 font-semibold text-lg">
              {navItems.find(n => n.id === activeNav)?.label ?? 'Dashboard'}
            </h1>
            <p className="text-slate-400 text-sm">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            {(topbarActions[activeNav] ?? []).map(({ label, icon: Icon, bg, onClick }) => (
              <button key={label} onClick={onClick}
                className={`flex items-center gap-2 ${bg} text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors`}>
                <Icon size={15} /> {label}
              </button>
            ))}
            <div className="relative ml-1">
              <Bell size={20} className="text-slate-500 cursor-pointer hover:text-slate-700" />
              {typeof pendingCount === 'number' && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto p-6">

          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">
              <AlertTriangle size={16} /> {error}
              <button onClick={() => window.location.reload()} className="ml-auto text-red-600 underline text-xs">Retry</button>
            </div>
          )}

          {/* ══ DASHBOARD ══ */}
          {activeNav === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {stats.map(({ label, value, icon: Icon, color, onClick }) => {
                  const bg = { blue:'bg-blue-50', green:'bg-green-50', amber:'bg-amber-50', red:'bg-red-50' }[color]
                  const ic = { blue:'text-blue-500', green:'text-green-500', amber:'text-amber-500', red:'text-red-500' }[color]
                  return (
                    <div key={label}
                      className={`bg-white rounded-xl p-5 border border-slate-100 shadow-sm transition-shadow ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
                      onClick={onClick ?? undefined}>
                      <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                        <Icon size={18} className={ic} />
                      </div>
                      <p className="text-2xl font-bold text-slate-800">{value}</p>
                      <p className="text-slate-500 text-sm mt-0.5">{label}</p>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                    <div>
                      <h2 className="font-semibold text-slate-800 text-sm">Student Performance</h2>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {studentsLoading ? 'Loading…' : `${filteredStudents.length} of ${students.length} students`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search…"
                          className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36" />
                      </div>
                      <select value={studentFilter} onChange={e => setStudentFilter(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-600 focus:outline-none">
                        <option value="all">All</option>
                        <option value="excelling">Excelling</option>
                        <option value="on-track">On Track</option>
                        <option value="at-risk">At Risk</option>
                      </select>
                      <button onClick={() => setActiveNav('students')} className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap">View All</button>
                    </div>
                  </div>
                  {studentsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-sm"><RefreshCw size={15} className="animate-spin" /> Loading…</div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-sm">{students.length === 0 ? 'No students enrolled yet.' : 'No students match.'}</div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 text-xs text-slate-500 font-medium">
                          <th className="text-left px-5 py-3">Student</th>
                          <th className="text-left px-3 py-3">Level</th>
                          <th className="text-left px-3 py-3 w-24">Progress</th>
                          <th className="text-left px-3 py-3">Readiness</th>
                          <th className="text-left px-3 py-3">Last Active</th>
                          <th className="text-left px-3 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.slice(0, 5).map((s, i) => {
                          const st        = statusConfig[s._status]
                          const progress  = Math.round(s.progress  ?? 0)
                          const readiness = Math.round(s.readiness ?? 0)
                          const readColor = readiness >= 75 ? 'text-green-600' : readiness >= 55 ? 'text-amber-600' : 'text-red-600'
                          const nameInit  = (s.name || s.email || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                          const lastActive = s.last_active ? new Date(s.last_active).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'
                          return (
                            <tr key={s.id ?? i} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">{nameInit}</div>
                                  <div className="min-w-0">
                                    <p className="text-slate-800 text-xs font-medium truncate">{s.name || '—'}</p>
                                    <p className="text-slate-400 text-xs truncate">{s.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3"><span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${levelColors[s.level] || 'bg-slate-100 text-slate-500'}`}>{s.level || '—'}</span></td>
                              <td className="px-3 py-3 w-24">
                                <div className="flex items-center gap-1.5">
                                  <ProgressBar value={progress} color={progress >= 70 ? 'green' : progress >= 40 ? 'blue' : 'amber'} />
                                  <span className="text-xs text-slate-500 shrink-0">{progress}%</span>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1.5">
                                  <ScoreRing value={readiness} size={28} stroke={3} color={readiness >= 75 ? '#10B981' : readiness >= 55 ? '#F59E0B' : '#EF4444'} />
                                  <span className={`text-xs font-semibold ${readColor}`}>{readiness}%</span>
                                </div>
                              </td>
                              <td className="px-3 py-3"><span className="text-slate-400 text-xs">{lastActive}</span></td>
                              <td className="px-3 py-3">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${st.color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                  {filteredStudents.length > 5 && (
                    <div className="px-5 py-3 border-t border-slate-50">
                      <button onClick={() => setActiveNav('students')} className="text-blue-600 text-xs font-medium hover:underline">
                        View all {filteredStudents.length} students →
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <h2 className="font-semibold text-slate-800 text-sm">Class Weak Areas</h2>
                  </div>
                  {weakAreasLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-slate-400 text-sm">
                      <RefreshCw size={14} className="animate-spin" /> Loading…
                    </div>
                  ) : weakAreas.length === 0 ? (
                    <div className="py-6 text-center">
                      <CheckCircle size={22} className="text-green-400 mx-auto mb-2" />
                      <p className="text-slate-500 text-xs font-medium">No weak areas yet</p>
                      <p className="text-slate-400 text-xs mt-1">Add topics to questions in Django admin to enable this.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {weakAreas.slice(0, 5).map((w, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-slate-700 text-xs font-medium">{w.area}</span>
                            <span className={`text-xs font-bold ${w.avgScore < 50 ? 'text-red-600' : 'text-amber-600'}`}>{w.avgScore}%</span>
                          </div>
                          <ProgressBar value={w.avgScore} color={w.avgScore < 50 ? 'red' : 'amber'} />
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setActiveNav('analytics')} className="mt-5 w-full text-xs text-blue-600 border border-blue-200 rounded-lg py-2 hover:bg-blue-50 transition-colors font-medium">
                    View Full Analytics →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                    <h2 className="font-semibold text-slate-800 text-sm">My Courses</h2>
                    <button onClick={() => setActiveNav('courses')} className="text-blue-600 text-xs font-medium hover:underline">View All</button>
                  </div>
                  {loading ? (
                    <div className="px-5 py-8 text-center text-slate-400 text-sm">Loading…</div>
                  ) : courses.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-slate-400 text-sm mb-3">No courses yet</p>
                      <button onClick={() => navigate('/instructor/courses/new')}
                        className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50">
                        + Create Course
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {courses.slice(0, 4).map((c, i) => (
                        <div key={c.id ?? i} className="px-5 py-3 hover:bg-slate-50/50 transition-colors group flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-slate-800 text-xs font-medium truncate">{c.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${courseStatusStyle[c.status] || courseStatusStyle.draft}`}>{courseStatusLabel[c.status] || 'Draft'}</span>
                              <span className="text-slate-400 text-xs">{c.student_count ?? 0} students</span>
                            </div>
                          </div>
                          <button onClick={() => navigate(`/instructor/courses/${c.id}/edit`)}
                            className="p-1 text-slate-300 hover:text-blue-600 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2">
                            <Edit2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-slate-800 text-sm">Pending Grading</h2>
                      <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {loading ? '…' : pendingCount}
                      </span>
                    </div>
                    <button onClick={() => setActiveNav('tests')} className="text-blue-600 text-xs font-medium hover:underline">View All</button>
                  </div>
                  {pendingList.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <CheckCircle size={22} className="text-green-400 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">All caught up!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {pendingList.slice(0, 3).map((item, i) => (
                        <div key={item.answer_id ?? i} className="px-5 py-3 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-slate-800 text-xs font-medium truncate">{item.task}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-slate-400 text-xs">
                                <span className={`font-semibold px-1 rounded ${levelColors[item.level] || 'bg-slate-100 text-slate-500'}`}>{item.level}</span>
                                <span>·</span><span>{item.student}</span>
                              </div>
                            </div>
                            <button onClick={() => { setGradingModal(item); setGradeFeedback('') }}
                              className="ml-2 shrink-0 bg-blue-600 text-white text-xs px-2.5 py-1 rounded-lg hover:bg-blue-700 transition-colors">
                              Grade
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                    <h2 className="font-semibold text-slate-800 text-sm mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'New Course',      icon: BookOpen,  color: 'green',  action: () => navigate('/instructor/courses/new')  },
                        { label: 'Upload Video',    icon: Upload,    color: 'blue',   action: () => navigate('/instructor/video-upload') },
                        { label: 'New Test',        icon: Plus,      color: 'purple', action: () => navigate('/instructor/test-builder') },
                        { label: 'Lesson Requests', icon: Calendar,  color: 'amber',  action: () => setActiveNav('lesson-requests')      },
                      ].map(({ label, icon: Icon, color, action }) => {
                        const cls = { green:'bg-green-50 text-green-600 hover:bg-green-100', blue:'bg-blue-50 text-blue-600 hover:bg-blue-100', purple:'bg-purple-50 text-purple-600 hover:bg-purple-100', amber:'bg-amber-50 text-amber-600 hover:bg-amber-100' }[color]
                        return (
                          <button key={label} onClick={action} className={`flex flex-col items-center gap-2 py-3 rounded-xl text-xs font-medium transition-colors ${cls}`}>
                            <Icon size={18} />{label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                    <h2 className="font-semibold text-slate-800 text-sm mb-3">Recent Activity</h2>
                    <div className="space-y-3">
                      {MOCK_ACTIVITY.map((a, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <a.icon size={13} className={`${a.color} shrink-0 mt-0.5`} />
                          <div>
                            <p className="text-slate-700 text-xs">{a.text}</p>
                            <p className="text-slate-400 text-xs mt-0.5">{a.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeNav === 'courses'          && <CoursesPanel  courses={courses} loading={loading} navigate={navigate} />}
          {activeNav === 'videos'           && <VideosPanel   navigate={navigate} />}
          {activeNav === 'tests'            && <TestsPanel    navigate={navigate} />}
          {activeNav === 'students'         && (
            <StudentsPanel
              students={students}
              studentsLoading={studentsLoading}
              studentSearch={studentSearch}
              setStudentSearch={setStudentSearch}
              studentFilter={studentFilter}
              setStudentFilter={setStudentFilter}
            />
          )}
          {activeNav === 'analytics'        && <AnalyticsPanel weakAreas={weakAreas} weakAreasLoading={weakAreasLoading} />}
          {activeNav === 'exam-requests'    && <ExamRequestsPanel showToast={showToast} />}
          {activeNav === 'lesson-requests'  && <LessonRequestsPanel showToast={showToast} />}
        </main>
      </div>

      {/* ── Grading Modal ── */}
      {gradingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#0F1B35] px-6 py-5 flex items-start justify-between">
              <div>
                <p className="text-blue-300 text-xs font-medium mb-1 flex items-center gap-1.5">
                  {gradingModal.type === 'essay' ? <FileText size={12} /> : <Mic size={12} />}
                  {gradingModal.type === 'short_answer' ? 'Short Answer' : gradingModal.type === 'audio' ? 'Speaking' : gradingModal.type} · {gradingModal.level || '—'}
                </p>
                <h3 className="text-white font-semibold text-base">{gradingModal.task}</h3>
                <p className="text-slate-400 text-sm mt-1">{gradingModal.student}</p>
              </div>
              <button onClick={() => setGradingModal(null)} className="text-slate-400 hover:text-white mt-1"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Submission</p>
                  <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed min-h-32 border border-slate-100">
                    {gradingModal.response || <span className="text-slate-400 italic">No response recorded.</span>}
                  </div>
                </div>
                <div>
                  <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Rubric</p>
                  <div className="space-y-3">
                    {Object.entries(rubricScores).map(([key, val]) => (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-700 text-xs capitalize font-medium">{key}</span>
                          <span className="text-blue-600 text-xs font-bold">{val}/10</span>
                        </div>
                        <input type="range" min={0} max={10} value={val}
                          onChange={e => setRubricScores(p => ({ ...p, [key]: +e.target.value }))}
                          className="w-full accent-blue-600 h-1.5 rounded-full cursor-pointer" />
                      </div>
                    ))}
                    <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between mt-2">
                      <span className="text-slate-600 text-sm font-medium">Total</span>
                      <div>
                        <span className="text-blue-700 text-xl font-bold">{rubricTotal}</span>
                        <span className="text-slate-400 text-sm">/{rubricMax}</span>
                        <span className={`ml-2 text-sm font-semibold ${rubricPct >= 70 ? 'text-green-600' : 'text-red-500'}`}>({rubricPct}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Feedback</p>
                <textarea value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3} placeholder="Add feedback for the student..." />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {['Good grammar', 'Vocabulary needs work', 'Excellent structure', 'Review Dative'].map(c => (
                    <button key={c} onClick={() => setGradeFeedback(prev => prev ? `${prev} ${c}` : c)}
                      className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors">+ {c}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button onClick={() => setGradingModal(null)} className="text-slate-500 text-sm hover:text-slate-700">Cancel</button>
                <button onClick={handleGradeSubmit} disabled={gradeSubmitting}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors">
                  {gradeSubmitting
                    ? <><RefreshCw size={13} className="animate-spin" /> Submitting…</>
                    : <><CheckCircle size={14} /> Submit Grade</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}