import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, Award, CreditCard, BarChart2,
  Settings, LogOut, ChevronLeft, ChevronRight, Bell, Search,
  MoreVertical, TrendingUp, TrendingDown, Shield, Download, Plus,
  Edit2, Trash2, Eye, Lock, Unlock, UserCheck, UserX, RefreshCw,
  Activity, Server, X, Check, DollarSign, GraduationCap, Flag,
  Clock, FileText, Mail, AlertTriangle, CheckCircle, Database,
  Globe, Send, Cpu, HardDrive, UserPlus, Save, Menu
} from 'lucide-react'
import API, { adminAPI } from '../../services/api'
import { clearTokens } from '../../services/auth'
import { useAuthStore } from '../../store/authStore'

// ─── Static nav ───────────────────────────────────────────────────────────────

const navItems = [
  { icon: LayoutDashboard, label: 'Overview',        id: 'overview'      },
  { icon: Users,           label: 'User Management', id: 'users'         },
  { icon: BookOpen,        label: 'Course Control',  id: 'courses'       },
  { icon: Award,           label: 'Certificates',    id: 'certificates'  },
  { icon: CreditCard,      label: 'Subscriptions',   id: 'subscriptions' },
  { icon: BarChart2,       label: 'Analytics',       id: 'analytics'     },
  { icon: Server,          label: 'System',          id: 'system'        },
]

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SYSTEM_HEALTH = [
  { label: 'API Response', value: '98ms',   status: 'good',    icon: Activity  },
  { label: 'CPU Usage',    value: '34%',    status: 'good',    icon: Cpu       },
  { label: 'Storage',      value: '61%',    status: 'warning', icon: HardDrive },
  { label: 'Database',     value: 'Stable', status: 'good',    icon: Database  },
]

const MOCK_ACTIVITY = [
  { text: 'New course submitted for review: C1 TestDaF Mastery', time: '5h ago',  icon: BookOpen,      color: 'text-blue-500'   },
  { text: 'Carlos Romero flagged for suspicious login activity',  time: '6h ago',  icon: Flag,          color: 'text-red-500'    },
  { text: '3 certificates ready to issue — awaiting approval',   time: '1d ago',  icon: Award,         color: 'text-purple-500' },
  { text: 'Storage at 61% — consider expanding plan',            time: '1d ago',  icon: AlertTriangle, color: 'text-amber-500'  },
  { text: 'Anna Köhler uploaded 4 new lesson videos',            time: '2d ago',  icon: CheckCircle,   color: 'text-green-500'  },
  { text: '143 new user registrations this week',                time: '2d ago',  icon: Users,         color: 'text-blue-500'   },
]

const MOCK_PLATFORM_TOGGLES = [
  { label: 'Open Registration',       desc: 'Allow new users to sign up',  on: true  },
  { label: 'Placement Test Required', desc: 'Force test before enrolment', on: true  },
  { label: 'Certificate Auto-Issue',  desc: 'Skip manual approval',        on: false },
  { label: 'Maintenance Mode',        desc: 'Take platform offline',       on: false },
  { label: 'AI Grammar Correction',   desc: 'Enable AI essay feedback',    on: true  },
]

// ─── Style helpers ────────────────────────────────────────────────────────────

const levelColors = {
  A1: 'bg-slate-100 text-slate-600',
  A2: 'bg-blue-100 text-blue-700',
  B1: 'bg-green-100 text-green-700',
  B2: 'bg-amber-100 text-amber-700',
  C1: 'bg-purple-100 text-purple-700',
  C2: 'bg-red-100 text-red-700',
  '': 'bg-slate-100 text-slate-500',
}

const roleColors = {
  student:    'bg-blue-50 text-blue-700',
  instructor: 'bg-purple-50 text-purple-700',
  admin:      'bg-red-50 text-red-700',
}

const statusConfig = {
  active:   { label: 'Active',   dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50'  },
  inactive: { label: 'Inactive', dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100' },
  flagged:  { label: 'Flagged',  dot: 'bg-red-500',   text: 'text-red-700',   bg: 'bg-red-50'    },
}

const courseStatusConfig = {
  published: { label: 'Published', color: 'bg-green-100 text-green-700' },
  review:    { label: 'In Review', color: 'bg-amber-100 text-amber-700' },
  draft:     { label: 'Draft',     color: 'bg-slate-100 text-slate-500' },
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function ProgressBar({ value, color = 'blue' }) {
  const c = { blue: 'bg-blue-500', green: 'bg-green-500', amber: 'bg-amber-400', purple: 'bg-purple-500', red: 'bg-red-500' }[color]
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5">
      <div className={`${c} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [])
  return (
    <div className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
      ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
      {message}
      <button onClick={onClose} className="ml-auto opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  )
}

// ─── Create / Edit User Modal ─────────────────────────────────────────────────

function UserFormModal({ user, onClose, onSaved }) {
  const isEdit = !!user
  const [step,   setStep]   = useState('form')
  const [form,   setForm]   = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    email:      user?.email      || '',
    password:   '',
    role:       user?.role       || 'student',
    level:      user?.level      || 'A1',
    exam_date:  user?.exam_date  || '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleReview = () => {
    if (!form.first_name || !form.last_name || !form.email) {
      setError('First name, last name and email are required.'); return
    }
    if (!isEdit && !form.password) {
      setError('Password is required for new users.'); return
    }
    setError('')
    setStep('confirm')
  }

  const handleConfirm = async () => {
    setSaving(true); setError('')
    try {
      const payload = { ...form }
      if (isEdit && !payload.password) delete payload.password
      if (isEdit) { await adminAPI.updateUser(user.id, payload) }
      else        { await adminAPI.createUser(payload)          }
      onSaved()
    } catch (err) {
      const msg = err.response?.data
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg) || 'Failed to save user.')
      setStep('form')
    } finally {
      setSaving(false)
    }
  }

  const changes = isEdit ? Object.entries(form).filter(([k, v]) => {
    if (k === 'password') return !!v
    return String(v) !== String(user[k] ?? '')
  }) : []

  const roleLabel  = { student: 'Student', instructor: 'Instructor', admin: 'Admin' }
  const inputCls   = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
  const labelCls   = "text-slate-700 text-xs font-semibold uppercase tracking-wide block mb-1.5"
  const fieldLabel = { first_name: 'First Name', last_name: 'Last Name', email: 'Email', password: 'Password', role: 'Role', level: 'Level', exam_date: 'Exam Date' }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-[#0a1628] px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center">
              <UserPlus size={16} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">
                {step === 'confirm' ? 'Confirm Changes' : isEdit ? 'Edit User' : 'Create New User'}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                {step === 'confirm'
                  ? isEdit ? 'Review before saving' : 'Review before creating'
                  : isEdit ? `Editing ${user.email}` : 'All roles supported'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto">
          {step === 'form' && (
            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertTriangle size={14} /> {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First Name</label>
                  <input className={inputCls} value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Maria" />
                </div>
                <div>
                  <label className={labelCls}>Last Name</label>
                  <input className={inputCls} value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Schmidt" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Email Address</label>
                <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="user@example.com" />
              </div>
              {!isEdit && (
                <div>
                  <label className={labelCls}>Password</label>
                  <input className={inputCls} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Role</label>
                  <select className={inputCls} value={form.role} onChange={e => set('role', e.target.value)}>
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>CEFR Level</label>
                  <select className={inputCls} value={form.level} onChange={e => set('level', e.target.value)}>
                    {['A1','A2','B1','B2','C1','C2'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Exam Date (optional)</label>
                <input className={inputCls} type="date" value={form.exam_date} onChange={e => set('exam_date', e.target.value)} />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleReview} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2">
                  <Eye size={14} /> Review & Confirm
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertTriangle size={14} /> {error}
                </div>
              )}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                {isEdit ? (
                  <>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-3">Changes to be saved</p>
                    {changes.length === 0 ? (
                      <p className="text-slate-400 text-sm">No changes detected.</p>
                    ) : changes.map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{fieldLabel[k] || k}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 line-through text-xs">{k === 'password' ? '••••••••' : String(user[k] ?? '—')}</span>
                          <span className="text-slate-300">→</span>
                          <span className="text-slate-800 font-medium">{k === 'password' ? '(new password)' : k === 'role' ? roleLabel[v] : String(v)}</span>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-3">New user details</p>
                    {[
                      ['Name',  `${form.first_name} ${form.last_name}`],
                      ['Email', form.email],
                      ['Role',  roleLabel[form.role]],
                      ['Level', form.level],
                      ...(form.exam_date ? [['Exam Date', form.exam_date]] : []),
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{label}</span>
                        <span className="text-slate-800 font-medium capitalize">{value}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
              {isEdit && form.role !== user.role && (
                <div className="flex items-start gap-2.5 px-3 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500" />
                  <span>Changing role from <strong className="capitalize">{user.role}</strong> to <strong className="capitalize">{form.role}</strong> will affect what this user can access immediately.</span>
                </div>
              )}
              {form.role === 'admin' && user?.role !== 'admin' && (
                <div className="flex items-start gap-2.5 px-3 py-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                  <Shield size={15} className="shrink-0 mt-0.5 text-red-500" />
                  <span>Granting <strong>Admin</strong> access gives full platform control including user management and course approval.</span>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setStep('form')} className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={handleConfirm} disabled={saving || (isEdit && changes.length === 0)}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2">
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  {saving ? 'Saving…' : isEdit ? 'Confirm & Save' : 'Confirm & Create'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ user, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const handleDelete = async () => {
    setDeleting(true)
    try { await adminAPI.deleteUser(user.id); onDeleted() }
    catch { setDeleting(false) }
  }
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl p-6">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-red-600" />
        </div>
        <h3 className="text-slate-800 font-semibold text-center mb-2">Delete User?</h3>
        <p className="text-slate-500 text-sm text-center mb-6">
          This will permanently delete <strong>{user.first_name} {user.last_name}</strong> and all their data. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2">
            {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Goethe Admin API ─────────────────────────────────────────────────────────

const goetheAdminAPI = {
  requests:      ()         => API.get('/goethe/requests/'),
  actionRequest: (id, data) => API.patch(`/goethe/requests/${id}/action/`, data),
  exams:         ()         => API.get('/goethe/admin/exams/'),
  createExam:    (data)     => API.post('/goethe/admin/exams/', data),
  updateExam:    (id, data) => API.patch(`/goethe/admin/exams/${id}/`, data),
  deleteExam:    (id)       => API.delete(`/goethe/admin/exams/${id}/`),
}

// ─── Goethe Admin Panel ───────────────────────────────────────────────────────

function GoetheAdminPanel({ showToast }) {
  const [requests,   setRequests]   = useState([])
  const [exams,      setExams]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [acting,     setActing]     = useState(null)
  const [noteMap,    setNoteMap]    = useState({})
  const [subTab,     setSubTab]     = useState('requests')
  const [examForm,   setExamForm]   = useState(null)
  const [examData,   setExamData]   = useState({
    level: 'B1', location: '', exam_date_start: '', exam_date_end: '',
    reg_open: '', reg_close: '', price_full: '', price_reduced: '',
    price_module: '', official_url: 'https://www.goethe.de/ins/ke/en/spr/prf.html',
    notes: '', is_active: true,
  })
  const [savingExam, setSavingExam] = useState(false)

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const fmtKES  = (n) => n ? `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}` : '—'

  const loadAll = () => {
    setLoading(true)
    Promise.all([goetheAdminAPI.requests(), goetheAdminAPI.exams()])
      .then(([r, e]) => {
        setRequests(r.data?.results ?? r.data ?? [])
        setExams(e.data?.results ?? e.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [])

  const handleAction = async (req, action) => {
    setActing(req.id)
    try {
      await goetheAdminAPI.actionRequest(req.id, { action, note: noteMap[req.id] || '' })
      showToast?.(action === 'approve' ? 'Approved — student notified' : 'Request denied')
      setRequests(prev => prev.filter(r => r.id !== req.id))
    } catch {
      showToast?.('Action failed', 'error')
    } finally { setActing(null) }
  }

  const handleSaveExam = async () => {
    if (!examData.location || !examData.exam_date_start || !examData.reg_open || !examData.reg_close || !examData.price_full) {
      showToast?.('Location, exam date, registration window and full price are required', 'error'); return
    }
    setSavingExam(true)
    try {
      if (examForm === 'new') { await goetheAdminAPI.createExam(examData) }
      else                    { await goetheAdminAPI.updateExam(examForm.id, examData) }
      showToast?.(examForm === 'new' ? 'Exam date added' : 'Exam date updated')
      setExamForm(null)
      loadAll()
    } catch { showToast?.('Failed to save exam date', 'error') }
    finally  { setSavingExam(false) }
  }

  const handleDeleteExam = async (exam) => {
    if (!window.confirm(`Delete ${exam.level} exam on ${fmtDate(exam.exam_date_start)}?`)) return
    try {
      await goetheAdminAPI.deleteExam(exam.id)
      showToast?.('Exam date deleted')
      loadAll()
    } catch { showToast?.('Failed to delete', 'error') }
  }

  const LEVELS = ['A1','A2','B1','B2','C1','C2']

  const bookingBadge = (status) => ({
    expired:  { label: 'Closed',   cls: 'bg-red-50 text-red-600'      },
    upcoming: { label: 'Upcoming', cls: 'bg-slate-100 text-slate-500'  },
    open:     { label: 'Open',     cls: 'bg-green-50 text-green-700'   },
  }[status] || { label: status, cls: 'bg-slate-100 text-slate-500' })

  const inp = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
  const lbl = "text-slate-600 text-xs font-semibold uppercase tracking-wide block mb-1"

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {[
            { id: 'requests', label: `Pending (${requests.length})` },
            { id: 'dates',    label: 'Exam Dates'                   },
          ].map(t => (
            <button key={t.id} onClick={() => setSubTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                ${subTab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        {subTab === 'dates' && (
          <button
            onClick={() => {
              setExamData({ level:'B1', location:'', exam_date_start:'', exam_date_end:'',
                reg_open:'', reg_close:'', price_full:'', price_reduced:'',
                price_module:'', official_url:'https://www.goethe.de/ins/ke/en/spr/prf.html',
                notes:'', is_active:true })
              setExamForm('new')
            }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap">
            <Plus size={14} /> Add Exam Date
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-400 text-sm">
          <RefreshCw size={15} className="animate-spin" /> Loading…
        </div>
      ) : (
        <>
          {subTab === 'requests' && (
            requests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={24} className="text-green-400" />
                </div>
                <p className="text-slate-600 font-medium mb-1">No pending requests</p>
                <p className="text-slate-400 text-sm">Requests will appear here once students submit and instructors forward them.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(req => (
                  <div key={req.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-5 py-3.5 flex items-center justify-between border-b border-slate-100 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center text-red-700 text-xs font-bold shrink-0">
                          {(req.student?.full_name || `${req.student?.first_name||''} ${req.student?.last_name||''}`.trim() || '?')
                            .split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-slate-800 text-sm font-semibold">
                            {req.student?.full_name || `${req.student?.first_name||''} ${req.student?.last_name||''}`.trim()}
                          </p>
                          <p className="text-slate-400 text-xs">{req.student?.email}</p>
                        </div>
                      </div>
                      <span className="text-slate-400 text-xs">Forwarded · {fmtDate(req.updated_at)}</span>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Exam</p>
                          <p className="text-slate-800 font-bold text-sm">Goethe {req.exam?.level}</p>
                          <p className="text-slate-500 text-xs">📍 {req.exam?.location}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Date</p>
                          <p className="text-slate-800 text-sm font-medium">{fmtDate(req.exam?.exam_date_start)}</p>
                          <p className="text-slate-500 text-xs">Reg closes: {fmtDate(req.exam?.reg_close)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Price</p>
                          <p className="text-slate-800 text-sm font-semibold">{fmtKES(req.exam?.price_full)}</p>
                          {req.exam?.price_reduced && <p className="text-green-600 text-xs">{fmtKES(req.exam?.price_reduced)} reduced</p>}
                        </div>
                      </div>
                      {req.student_note && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
                          <p className="text-slate-400 text-xs font-semibold mb-1">Student's note</p>
                          <p className="text-slate-700 text-sm italic">"{req.student_note}"</p>
                        </div>
                      )}
                      {req.instructor_note && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-3">
                          <p className="text-slate-400 text-xs font-semibold mb-1">Instructor's note</p>
                          <p className="text-slate-700 text-sm">{req.instructor_note}</p>
                        </div>
                      )}
                      <div className="mb-4">
                        <label className="text-slate-600 text-xs font-semibold uppercase tracking-wide block mb-1.5">
                          Note to student <span className="font-normal text-slate-400 normal-case">(optional)</span>
                        </label>
                        <textarea
                          value={noteMap[req.id] || ''}
                          onChange={e => setNoteMap(m => ({ ...m, [req.id]: e.target.value }))}
                          placeholder="Optional message to the student…"
                          rows={2}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => handleAction(req, 'approve')} disabled={acting === req.id}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm px-5 py-2.5 rounded-xl font-medium transition-colors">
                          {acting === req.id ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                          Approve
                        </button>
                        <button onClick={() => handleAction(req, 'deny')} disabled={acting === req.id}
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm px-5 py-2.5 rounded-xl font-medium transition-colors">
                          <X size={14} /> Deny
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {subTab === 'dates' && (
            exams.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                <p className="text-slate-500 font-medium mb-1">No exam dates yet</p>
                <p className="text-slate-400 text-sm">Click "Add Exam Date" to create the first one.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 text-xs text-slate-500 font-medium">
                        <th className="text-left px-5 py-3">Level</th>
                        <th className="text-left px-3 py-3">Location</th>
                        <th className="text-left px-3 py-3">Exam Date</th>
                        <th className="text-left px-3 py-3">Registration</th>
                        <th className="text-left px-3 py-3">Full Price</th>
                        <th className="text-left px-3 py-3">Status</th>
                        <th className="px-3 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {exams.map(exam => {
                        const badge = bookingBadge(exam.booking_status)
                        return (
                          <tr key={exam.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3.5">
                              <span className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white text-xs font-black inline-flex">
                                {exam.level}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-slate-700 text-sm">{exam.location}</td>
                            <td className="px-3 py-3.5 text-slate-700 text-sm">{fmtDate(exam.exam_date_start)}</td>
                            <td className="px-3 py-3.5 text-slate-500 text-xs">{fmtDate(exam.reg_open)} – {fmtDate(exam.reg_close)}</td>
                            <td className="px-3 py-3.5 text-slate-800 text-sm font-semibold">{fmtKES(exam.price_full)}</td>
                            <td className="px-3 py-3.5">
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                            </td>
                            <td className="px-3 py-3.5">
                              <div className="flex items-center gap-1">
                                <button onClick={() => { setExamData({ ...exam }); setExamForm(exam) }}
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                  <Edit2 size={13} />
                                </button>
                                <button onClick={() => handleDeleteExam(exam)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </>
      )}

      {examForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0a1628] px-6 py-5 flex items-center justify-between shrink-0">
              <div>
                <p className="text-red-300 text-xs font-semibold uppercase tracking-wider mb-1">Admin · Goethe Dates</p>
                <h3 className="text-white font-semibold">{examForm === 'new' ? 'Add Exam Date' : 'Edit Exam Date'}</h3>
              </div>
              <button onClick={() => setExamForm(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>CEFR Level</label>
                  <select className={inp} value={examData.level} onChange={e => setExamData(d => ({ ...d, level: e.target.value }))}>
                    {LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Location</label>
                  <input className={inp} value={examData.location} onChange={e => setExamData(d => ({ ...d, location: e.target.value }))} placeholder="e.g. Nairobi" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Exam Date (start)</label>
                  <input className={inp} type="date" value={examData.exam_date_start} onChange={e => setExamData(d => ({ ...d, exam_date_start: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Exam Date (end, optional)</label>
                  <input className={inp} type="date" value={examData.exam_date_end || ''} onChange={e => setExamData(d => ({ ...d, exam_date_end: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Registration Opens</label>
                  <input className={inp} type="date" value={examData.reg_open} onChange={e => setExamData(d => ({ ...d, reg_open: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Registration Closes</label>
                  <input className={inp} type="date" value={examData.reg_close} onChange={e => setExamData(d => ({ ...d, reg_close: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Full Price (KES)</label>
                  <input className={inp} type="number" value={examData.price_full} onChange={e => setExamData(d => ({ ...d, price_full: e.target.value }))} placeholder="26000" />
                </div>
                <div>
                  <label className={lbl}>Reduced Price (KES, optional)</label>
                  <input className={inp} type="number" value={examData.price_reduced || ''} onChange={e => setExamData(d => ({ ...d, price_reduced: e.target.value }))} placeholder="20000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Module Price (KES, optional)</label>
                  <input className={inp} type="number" value={examData.price_module || ''} onChange={e => setExamData(d => ({ ...d, price_module: e.target.value }))} placeholder="6500" />
                </div>
                <div>
                  <label className={lbl}>Official Registration URL</label>
                  <input className={inp} value={examData.official_url} onChange={e => setExamData(d => ({ ...d, official_url: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={lbl}>Notes (internal)</label>
                <textarea className={inp} rows={2} value={examData.notes} onChange={e => setExamData(d => ({ ...d, notes: e.target.value }))} placeholder="Additional notes…" style={{ resize: 'none' }} />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setExamData(d => ({ ...d, is_active: !d.is_active }))}
                  className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${examData.is_active ? 'bg-green-500' : 'bg-slate-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${examData.is_active ? 'left-5' : 'left-0.5'}`} />
                </button>
                <span className="text-sm text-slate-700">Visible to students</span>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setExamForm(null)} className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5 rounded-xl hover:bg-slate-50">Cancel</button>
                <button onClick={handleSaveExam} disabled={savingExam}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm py-2.5 rounded-xl font-medium flex items-center justify-center gap-2">
                  {savingExam ? <><RefreshCw size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> {examForm === 'new' ? 'Add Date' : 'Save Changes'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const navigate = useNavigate()
  const logout   = useAuthStore(s => s.logout)

  const [collapsed,       setCollapsed]       = useState(false)
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false)
  const [activeTab,       setActiveTab]       = useState('users')
  const [toast,           setToast]           = useState(null)

  const [stats,           setStats]           = useState(null)
  const [users,           setUsers]           = useState([])
  const [courses,         setCourses]         = useState([])
  const [pendingCerts,    setPendingCerts]    = useState([])
  const [loading,         setLoading]         = useState({ stats: true, users: true, courses: true, certs: true })
  const [error,           setError]           = useState('')

  const [searchQuery,     setSearchQuery]     = useState('')
  const [userFormModal,   setUserFormModal]   = useState(null)
  const [deleteModal,     setDeleteModal]     = useState(null)
  const [userDetailModal, setUserDetailModal] = useState(null)
  const [certModal,       setCertModal]       = useState(null)
  const [announceModal,   setAnnounceModal]   = useState(false)
  const [announceForm,    setAnnounceForm]    = useState({ subject: '', message: '', audience: 'All Users' })
  const [sendingAnnounce, setSendingAnnounce] = useState(false)
  const [toggles,         setToggles]         = useState(MOCK_PLATFORM_TOGGLES.map(t => ({ ...t })))

  const user     = useAuthStore(s => s.user)
  const initials = user ? `${(user.first_name||'')[0]||''}${(user.last_name||'')[0]||''}`.toUpperCase() : 'SA'
  const fullName = user ? `${user.first_name||''} ${user.last_name||''}`.trim() : 'Super Admin'
  const email    = user?.email || 'admin@deutschpro.com'
  const today    = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const handleLogout = () => { clearTokens(); logout?.(); navigate('/login') }
  const showToast    = (message, type = 'success') => setToast({ message, type })
  const setLoad      = (key, val) => setLoading(l => ({ ...l, [key]: val }))

  const fetchStats   = () => adminAPI.stats().then(r => setStats(r.data)).catch(() => {}).finally(() => setLoad('stats', false))
  const fetchUsers   = () => adminAPI.users().then(r => { const d = r.data?.results ?? r.data; setUsers(Array.isArray(d) ? d : []) }).catch(() => {}).finally(() => setLoad('users', false))
  const fetchCourses = () => adminAPI.courses().then(r => { const d = r.data?.results ?? r.data; setCourses(Array.isArray(d) ? d : []) }).catch(() => {}).finally(() => setLoad('courses', false))
  const fetchCerts   = () => adminAPI.certificates('pending').then(r => { const d = r.data?.results ?? r.data; setPendingCerts(Array.isArray(d) ? d : []) }).catch(() => {}).finally(() => setLoad('certs', false))

  useEffect(() => {
    fetchStats(); fetchUsers(); fetchCourses(); fetchCerts()
  }, [])

  const platformStats = [
    { label: 'Total Users',        value: stats ? stats.total_users.toLocaleString()        : '…', change: `${stats?.total_students||0} students`,         icon: Users,        color: 'blue'   },
    { label: 'Active Courses',      value: stats ? String(stats.published_courses)            : '…', change: `${stats?.pending_courses||0} pending review`,  icon: BookOpen,     color: 'amber'  },
    { label: 'Total Enrollments',   value: stats ? stats.total_enrollments.toLocaleString()  : '…', change: 'active enrolments',                            icon: GraduationCap,color: 'green'  },
    { label: 'Certificates Issued', value: stats ? stats.total_certificates.toLocaleString() : '…', change: `${stats?.pending_certs||0} pending approval`,  icon: Award,        color: 'purple' },
  ]

  const handleSuspend = async (u) => {
    try {
      await adminAPI.suspendUser(u.id)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x))
      showToast(`${u.first_name} ${u.is_active ? 'suspended' : 'activated'} successfully`)
    } catch { showToast('Failed to update user status', 'error') }
  }

  const handleUserSaved = () => {
    setUserFormModal(null)
    fetchUsers()
    showToast(userFormModal === 'create' ? 'User created successfully' : 'User updated successfully')
  }

  const handleUserDeleted = () => {
    setDeleteModal(null)
    fetchUsers()
    showToast('User deleted successfully')
  }

  const handleCourseReview = async (courseId, action) => {
    try {
      await adminAPI.reviewCourse(courseId, action)
      fetchCourses()
      showToast(`Course ${action === 'approve' ? 'published' : 'sent back to draft'}`)
    } catch { showToast('Failed to update course', 'error') }
  }

  const handleIssueCert = async (certId) => {
    try {
      await adminAPI.issueCertificate(certId)
      setCertModal(null)
      fetchCerts()
      fetchStats()
      showToast('Certificate issued successfully')
    } catch { showToast('Failed to issue certificate', 'error') }
  }

  const handleSendAnnouncement = async () => {
    if (!announceForm.subject || !announceForm.message) {
      showToast('Subject and message are required', 'error'); return
    }
    setSendingAnnounce(true)
    try {
      await adminAPI.sendAnnouncement({ title: announceForm.subject, message: announceForm.message, audience: announceForm.audience })
      setAnnounceModal(false)
      setAnnounceForm({ subject: '', message: '', audience: 'All Users' })
      showToast('Announcement sent successfully')
    } catch { showToast('Failed to send announcement', 'error') }
    finally { setSendingAnnounce(false) }
  }

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase()
    return !q || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q)
  })

  const userStatus = (u) => !u.is_active ? 'inactive' : 'active'

  // Detect desktop vs mobile using JS (avoids Tailwind responsive class issues)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const handleTabChange = (id) => {
    setActiveTab(id)
    setMobileMenuOpen(false)
  }

  const sidebarVisible = isDesktop || mobileMenuOpen
  const sidebarWidth   = isDesktop && collapsed ? 64 : 240

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', overflow: 'hidden', fontFamily: 'sans-serif' }}>

      {/* ── Mobile backdrop ── */}
      {mobileMenuOpen && !isDesktop && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 30 }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        position: isDesktop ? 'relative' : 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 40,
        width: `${sidebarWidth}px`,
        background: '#0a1628',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease, width 0.3s ease',
        transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {!(isDesktop && collapsed) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, background: '#ef4444', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={14} color="white" />
              </div>
              <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>Admin Panel</span>
            </div>
          )}
          {isDesktop ? (
            <button onClick={() => setCollapsed(!collapsed)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,1)', marginLeft: 'auto' }}>
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          ) : (
            <button onClick={() => setMobileMenuOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,1)', marginLeft: 'auto' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {!(isDesktop && collapsed) && (
          <div style={{ margin: '16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={13} color="#f87171" />
            <span style={{ color: '#fca5a5', fontSize: 12, fontWeight: 500 }}>Administrator</span>
          </div>
        )}

        <nav style={{ flex: 1, padding: '16px 8px', overflowY: 'auto' }}>
          {navItems.map(({ icon: Icon, label, id }) => (
            <button key={id} onClick={() => handleTabChange(id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                marginBottom: 4, fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
                background: activeTab === id ? '#dc2626' : 'transparent',
                color: activeTab === id ? 'white' : 'rgba(148,163,184,1)',
              }}>
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!(isDesktop && collapsed) && <span>{label}</span>}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: 12 }}>
          <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(148,163,184,1)', fontSize: 14, marginBottom: 4 }}>
            <Settings size={18} style={{ flexShrink: 0 }} />
            {!(isDesktop && collapsed) && <span>Settings</span>}
          </button>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(148,163,184,1)', fontSize: 14 }}>
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!(isDesktop && collapsed) && <span>Sign Out</span>}
          </button>
          {!(isDesktop && collapsed) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ color: 'white', fontSize: 12, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</p>
                <p style={{ color: 'rgba(100,116,139,1)', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Topbar */}
        <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {!isDesktop && (
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', flexShrink: 0 }}
                onClick={() => setMobileMenuOpen(true)}>
                <Menu size={22} />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-slate-800 font-semibold text-base sm:text-lg truncate">Platform Administration</h1>
              <p style={{ color: "#94a3b8", fontSize: 12, display: isDesktop ? "block" : "none" }}>DeutschPro · {today}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setAnnounceModal(true)}
              style={{ display: isDesktop ? "flex" : "none", alignItems: "center", gap: 8, border: "1px solid #e2e8f0", color: "#475569", fontSize: 14, padding: "8px 16px", borderRadius: 8, background: "white", cursor: "pointer" }}>
              <Send size={14} /> Announce
            </button>
            <button style={{ display: isDesktop ? "flex" : "none", alignItems: "center", gap: 8, background: "#dc2626", color: "white", fontSize: 14, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer" }}>
              <Download size={14} /> Export
            </button>
            {/* Mobile announce button */}
            <button onClick={() => setAnnounceModal(true)} style={{ display: isDesktop ? "none" : "flex", background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 8 }}>
              <Send size={18} />
            </button>
            <div className="relative">
              <Bell size={20} className="text-slate-500 cursor-pointer hover:text-slate-700" />
              {stats?.pending_certs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {stats.pending_certs}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">

          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {/* ── Platform Stats — 2 cols mobile, 4 cols desktop ── */}
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(4,1fr)" : "repeat(2,1fr)", gap: 12 }}>
            {platformStats.map(({ label, value, change, icon: Icon, color }) => {
              const bg = { blue: 'bg-blue-50', green: 'bg-green-50', amber: 'bg-amber-50', purple: 'bg-purple-50' }[color]
              const ic = { blue: 'text-blue-500', green: 'text-green-500', amber: 'text-amber-500', purple: 'text-purple-500' }[color]
              return (
                <div key={label} className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 ${bg} rounded-lg flex items-center justify-center`}>
                      <Icon size={16} className={ic} />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800">{value}</p>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{label}</p>
                  <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 4, display: isDesktop ? "block" : "none" }}>{change}</p>
                </div>
              )
            })}
          </div>

          {/* ── Tab nav — horizontally scrollable on mobile ── */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
            {[
              { id: 'users',   label: 'Users',      icon: Users         },
              { id: 'courses', label: 'Courses',     icon: BookOpen      },
              { id: 'certs',   label: 'Certs',       icon: Award         },
              { id: 'goethe',  label: 'Goethe',      icon: GraduationCap },
              { id: 'system',  label: 'System',      icon: Server        },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap
                  ${activeTab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* ── Tab: Users ── */}
          {activeTab === 'users' && (
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3,1fr)" : "1fr", gap: 16 }}>
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-50 gap-3 flex-wrap">
                  <h2 className="font-semibold text-slate-800 text-sm">
                    All Users
                    <span className="ml-2 text-slate-400 font-normal text-xs">({users.length})</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input placeholder="Search…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400 w-32 sm:w-44" />
                    </div>
                    <button onClick={() => setUserFormModal('create')}
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap">
                      <Plus size={12} /> Add
                    </button>
                  </div>
                </div>

                {loading.users ? (
                  <div className="px-5 py-12 text-center text-slate-400 text-sm">Loading users…</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="px-5 py-12 text-center text-slate-400 text-sm">No users found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-50 text-xs text-slate-500 font-medium">
                          <th className="text-left px-4 sm:px-5 py-3">User</th>
                          <th className="text-left px-3 py-3">Role</th>
                          <th className="text-left px-3 py-3 hidden sm:table-cell">Level</th>
                          <th className="text-left px-3 py-3">Status</th>
                          <th className="px-3 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => {
                          const st  = statusConfig[userStatus(u)] || statusConfig.active
                          const lvl = u.level || ''
                          return (
                            <tr key={u.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                              <td className="px-4 sm:px-5 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                                    {`${(u.first_name||'')[0]||''}${(u.last_name||'')[0]||''}`.toUpperCase() || '?'}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-slate-800 text-sm font-medium truncate">{u.first_name} {u.last_name}</p>
                                    <p className="text-slate-400 text-xs truncate hidden sm:block">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleColors[u.role] || 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                              </td>
                              <td className="px-3 py-3 hidden sm:table-cell">
                                {lvl ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${levelColors[lvl]}`}>{lvl}</span> : <span className="text-slate-300 text-xs">—</span>}
                              </td>
                              <td className="px-3 py-3">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${st.bg} ${st.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                                  <span className="hidden sm:inline">{st.label}</span>
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => setUserDetailModal(u)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={13} /></button>
                                  <button onClick={() => setUserFormModal(u)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors hidden sm:block"><Edit2 size={13} /></button>
                                  <button onClick={() => handleSuspend(u)} className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors hidden sm:block">
                                    {u.is_active ? <Lock size={13} /> : <Unlock size={13} />}
                                  </button>
                                  <button onClick={() => setDeleteModal(u)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                  <h2 className="font-semibold text-slate-800 text-sm mb-4">User Breakdown</h2>
                  <div className="space-y-3">
                    {[
                      { label: 'Students',    count: stats?.total_students    || 0, pct: stats ? Math.round((stats.total_students    / stats.total_users) * 100) : 0, color: 'blue'   },
                      { label: 'Instructors', count: stats?.total_instructors || 0, pct: stats ? Math.round((stats.total_instructors / stats.total_users) * 100) : 0, color: 'purple' },
                      { label: 'Admins',      count: (stats?.total_users||0)-(stats?.total_students||0)-(stats?.total_instructors||0), pct: 2, color: 'red' },
                    ].map(r => (
                      <div key={r.label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-700 font-medium">{r.label}</span>
                          <span className="text-slate-400">{r.count.toLocaleString()}</span>
                        </div>
                        <ProgressBar value={r.pct || 1} color={r.color} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                  <h2 className="font-semibold text-slate-800 text-sm mb-3">Quick Actions</h2>
                  <div className="space-y-2">
                    {[
                      { label: 'Create New User',  icon: UserPlus, action: () => setUserFormModal('create'), color: 'text-red-600 hover:bg-red-50 border-red-100'  },
                      { label: 'Export User List', icon: Download,  action: () => {},                        color: 'text-slate-600 hover:bg-slate-50'             },
                      { label: 'Send Newsletter',  icon: Mail,      action: () => setAnnounceModal(true),    color: 'text-blue-600 hover:bg-blue-50'               },
                      { label: 'Flag Review',      icon: Flag,      action: () => {},                        color: 'text-red-600 hover:bg-red-50'                 },
                    ].map(({ label, icon: Icon, action, color }) => (
                      <button key={label} onClick={action}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm border border-slate-100 transition-colors ${color}`}>
                        <Icon size={14} /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Courses ── */}
          {activeTab === 'courses' && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                <h2 className="font-semibold text-slate-800 text-sm">Course Management</h2>
              </div>
              {loading.courses ? (
                <div className="px-5 py-12 text-center text-slate-400 text-sm">Loading courses…</div>
              ) : courses.length === 0 ? (
                <div className="px-5 py-12 text-center text-slate-400 text-sm">No courses found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-50 text-xs text-slate-500 font-medium">
                        <th className="text-left px-5 py-3">Course</th>
                        <th className="text-left px-3 py-3 hidden sm:table-cell">Instructor</th>
                        <th className="text-left px-3 py-3">Level</th>
                        <th className="text-left px-3 py-3 hidden sm:table-cell">Students</th>
                        <th className="text-left px-3 py-3">Status</th>
                        <th className="px-3 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((c) => {
                        const cs = courseStatusConfig[c.status] || courseStatusConfig.draft
                        return (
                          <tr key={c.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-4"><p className="text-slate-800 text-sm font-medium">{c.title}</p></td>
                            <td className="px-3 py-4 hidden sm:table-cell">
                              <span className="text-slate-600 text-sm">
                                {c.instructor ? `${c.instructor.first_name||''} ${c.instructor.last_name||''}`.trim() : '—'}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${levelColors[c.level] || levelColors['']}`}>{c.level || '—'}</span>
                            </td>
                            <td className="px-3 py-4 hidden sm:table-cell"><span className="text-slate-700 text-sm">{c.student_count ?? 0}</span></td>
                            <td className="px-3 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cs.color}`}>{cs.label}</span></td>
                            <td className="px-3 py-4">
                              <div className="flex items-center gap-1">
                                {c.status === 'review' && (
                                  <>
                                    <button onClick={() => handleCourseReview(c.id, 'approve')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Check size={13} /></button>
                                    <button onClick={() => handleCourseReview(c.id, 'reject')}  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={13} /></button>
                                  </>
                                )}
                                <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={13} /></button>
                                <button className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors hidden sm:block"><Edit2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Certificates ── */}
          {activeTab === 'certs' && (
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3,1fr)" : "1fr", gap: 16 }}>
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-slate-800 text-sm">Pending Certificates</h2>
                    <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">{pendingCerts.length}</span>
                  </div>
                </div>
                {loading.certs ? (
                  <div className="px-5 py-12 text-center text-slate-400 text-sm">Loading certificates…</div>
                ) : pendingCerts.length === 0 ? (
                  <div className="px-5 py-12 text-center text-slate-400 text-sm">No pending certificates.</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {pendingCerts.map((cert) => (
                      <div key={cert.id} className="px-4 sm:px-5 py-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors flex-wrap">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center text-purple-700 text-xs font-bold shrink-0">
                            {`${(cert.student?.first_name||'')[0]||''}${(cert.student?.last_name||'')[0]||''}`.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-slate-800 text-sm font-medium">{cert.student?.first_name} {cert.student?.last_name}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{cert.course?.title || '—'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400">Score:</span>
                              <span className={`text-xs font-bold ${cert.score >= 80 ? 'text-green-600' : 'text-amber-600'}`}>{cert.score}%</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => setCertModal(cert)}
                          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-2 rounded-lg transition-colors font-medium">
                          <Award size={12} /> Issue
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h2 className="font-semibold text-slate-800 text-sm mb-4">Certificate Stats</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Total Issued',   value: stats?.total_certificates ?? '—', color: 'text-slate-800' },
                    { label: 'Pending Review', value: stats?.pending_certs       ?? '—', color: 'text-amber-600' },
                  ].map(s => (
                    <div key={s.label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                      <span className="text-slate-500 text-sm">{s.label}</span>
                      <span className={`font-bold text-sm ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Goethe ── */}
          {activeTab === 'goethe' && <GoetheAdminPanel showToast={showToast} />}

          {/* ── Tab: System ── */}
          {activeTab === 'system' && (
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3,1fr)" : "1fr", gap: 16 }}>
              <div className="lg:col-span-2 space-y-4 sm:space-y-5">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                  <h2 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
                    <Activity size={15} className="text-green-500" /> System Health
                  </h2>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {MOCK_SYSTEM_HEALTH.map(({ label, value, status, icon: Icon }) => (
                      <div key={label} className={`rounded-xl p-3 sm:p-4 border ${status === 'good' ? 'border-green-100 bg-green-50/50' : 'border-amber-100 bg-amber-50/50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <Icon size={16} className={status === 'good' ? 'text-green-600' : 'text-amber-600'} />
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status === 'good' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {status === 'good' ? 'Healthy' : 'Warning'}
                          </span>
                        </div>
                        <p className="text-slate-800 font-bold text-base sm:text-lg">{value}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                  <h2 className="font-semibold text-slate-800 text-sm mb-4">Platform Settings</h2>
                  <div className="space-y-3">
                    {toggles.map((toggle, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 gap-4">
                        <div className="min-w-0">
                          <p className="text-slate-800 text-sm font-medium">{toggle.label}</p>
                          <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">{toggle.desc}</p>
                        </div>
                        <button
                          onClick={() => setToggles(prev => prev.map((t, j) => j === i ? { ...t, on: !t.on } : t))}
                          className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${toggle.on ? 'bg-green-500' : 'bg-slate-200'}`}>
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${toggle.on ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h2 className="font-semibold text-slate-800 text-sm mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {MOCK_ACTIVITY.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <a.icon size={13} className={a.color} />
                      </div>
                      <div>
                        <p className="text-slate-700 text-xs leading-relaxed">{a.text}</p>
                        <p className="text-slate-400 text-xs mt-1">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Modals ── */}

      {userFormModal && (
        <UserFormModal
          user={userFormModal === 'create' ? null : userFormModal}
          onClose={() => setUserFormModal(null)}
          onSaved={handleUserSaved}
        />
      )}

      {deleteModal && (
        <DeleteModal user={deleteModal} onClose={() => setDeleteModal(null)} onDeleted={handleUserDeleted} />
      )}

      {userDetailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden">
            <div className="bg-[#0a1628] px-6 py-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {`${(userDetailModal.first_name||'')[0]||''}${(userDetailModal.last_name||'')[0]||''}`.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{userDetailModal.first_name} {userDetailModal.last_name}</h3>
                  <p className="text-slate-400 text-sm">{userDetailModal.email}</p>
                </div>
              </div>
              <button onClick={() => setUserDetailModal(null)} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Role',   value: userDetailModal.role,                                    cap: true  },
                  { label: 'Level',  value: userDetailModal.level || '—',                            cap: false },
                  { label: 'Status', value: userDetailModal.is_active ? 'Active' : 'Inactive',       cap: false },
                  { label: 'Joined', value: userDetailModal.date_joined ? new Date(userDetailModal.date_joined).toLocaleDateString() : '—', cap: false },
                ].map(f => (
                  <div key={f.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-slate-400 text-xs mb-1">{f.label}</p>
                    <p className={`text-slate-800 text-sm font-semibold ${f.cap ? 'capitalize' : ''}`}>{f.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setUserDetailModal(null); setUserFormModal(userDetailModal) }}
                  className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-600 text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <Edit2 size={14} /> Edit
                </button>
                <button onClick={() => { handleSuspend(userDetailModal); setUserDetailModal(null) }}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm py-2.5 rounded-xl transition-colors font-medium">
                  <Lock size={14} /> {userDetailModal.is_active ? 'Suspend' : 'Activate'}
                </button>
                <button onClick={() => { setUserDetailModal(null); setDeleteModal(userDetailModal) }}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2.5 rounded-xl transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {certModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-purple-700 to-purple-900 px-6 py-6 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award size={28} className="text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg">Issue Certificate</h3>
              <p className="text-purple-200 text-sm mt-1">This cannot be undone</p>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2">
                {[
                  ['Student', `${certModal.student?.first_name} ${certModal.student?.last_name}`],
                  ['Course',  certModal.course?.title || '—'],
                  ['Score',   `${certModal.score}%`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-slate-800 font-medium text-right max-w-[200px]">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCertModal(null)} className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={() => handleIssueCert(certModal.id)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2">
                  <Check size={14} /> Confirm & Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {announceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Send Announcement</h3>
              <button onClick={() => setAnnounceModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-slate-700 text-sm font-medium block mb-1.5">Send To</label>
                <div className="flex gap-2 flex-wrap">
                  {['All Users', 'Students Only', 'Instructors Only'].map(opt => (
                    <button key={opt} onClick={() => setAnnounceForm(f => ({ ...f, audience: opt }))}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors
                        ${announceForm.audience === opt ? 'border-red-400 bg-red-50 text-red-600' : 'border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-slate-700 text-sm font-medium block mb-1.5">Subject</label>
                <input value={announceForm.subject} onChange={e => setAnnounceForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="Announcement subject..." />
              </div>
              <div>
                <label className="text-slate-700 text-sm font-medium block mb-1.5">Message</label>
                <textarea value={announceForm.message} onChange={e => setAnnounceForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  rows={4} placeholder="Write your announcement..." />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setAnnounceModal(false)} className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleSendAnnouncement} disabled={sendingAnnounce}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2">
                  {sendingAnnounce ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  {sendingAnnounce ? 'Sending…' : 'Send Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}