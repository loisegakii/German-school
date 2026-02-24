import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, User, Mail, Lock, Bell, Globe, CreditCard, Shield,
  Camera, Check, X, Eye, EyeOff, ChevronRight, Award, BookOpen,
  Clock, Target, Flame, TrendingUp, Download, Trash2, AlertTriangle,
  CheckCircle, Info, Edit2, Save, RefreshCw, LogOut, Moon, Sun,
  Volume2, Languages, Smartphone, Monitor, Key, UserX
} from 'lucide-react'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CEFR_LEVELS  = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const LEVEL_COLORS = {
  A1: 'bg-slate-100 text-slate-600',
  A2: 'bg-blue-100 text-blue-700',
  B1: 'bg-green-100 text-green-700',
  B2: 'bg-amber-100 text-amber-700',
  C1: 'bg-purple-100 text-purple-700',
  C2: 'bg-red-100 text-red-700',
}

const certificates = [
  { title: 'German A1 Foundation',      date: 'Nov 2025', score: 91, level: 'A1' },
  { title: 'German A2 Everyday German', date: 'Jan 2026',  score: 84, level: 'A2' },
]

const activityLog = [
  { action: 'Completed lesson: Nominative Case',        time: '2h ago',  type: 'lesson'  },
  { action: 'Passed B1 Module 2 Test — 78%',            time: '1d ago',  type: 'test'    },
  { action: 'Started module: Case System',              time: '2d ago',  type: 'module'  },
  { action: 'Vocabulary session — 24 words reviewed',   time: '3d ago',  type: 'vocab'   },
  { action: 'Completed lesson: Der Die Das — Articles', time: '4d ago',  type: 'lesson'  },
  { action: 'Enrolled in B1 — Goethe Prep course',     time: '1wk ago', type: 'enroll'  },
]

const ACTIVITY_COLORS = {
  lesson:  'bg-blue-100 text-blue-600',
  test:    'bg-green-100 text-green-600',
  module:  'bg-purple-100 text-purple-600',
  vocab:   'bg-amber-100 text-amber-600',
  enroll:  'bg-slate-100 text-slate-600',
}

const ACTIVITY_ICONS = {
  lesson:  BookOpen,
  test:    CheckCircle,
  module:  Target,
  vocab:   Languages,
  enroll:  Award,
}

const SIDEBAR_SECTIONS = [
  { id: 'profile',        label: 'Profile',           icon: User        },
  { id: 'learning',       label: 'Learning Goals',    icon: Target      },
  { id: 'security',       label: 'Password & Security', icon: Lock      },
  { id: 'notifications',  label: 'Notifications',     icon: Bell        },
  { id: 'preferences',    label: 'Preferences',       icon: Globe       },
  { id: 'subscription',   label: 'Subscription',      icon: CreditCard  },
  { id: 'activity',       label: 'Activity Log',      icon: Clock       },
  { id: 'danger',         label: 'Danger Zone',       icon: AlertTriangle},
]

// ─── Reusable components ──────────────────────────────────────────────────────

function SectionCard({ title, description, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-50">
        <h2 className="font-semibold text-slate-800 text-base">{title}</h2>
        {description && <p className="text-slate-400 text-sm mt-0.5">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{ width: 40, height: 22, backgroundColor: on ? '#3B82F6' : '#E2E8F0' }}
      className="rounded-full relative transition-colors shrink-0"
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${on ? 'left-5' : 'left-0.5'}`} />
    </button>
  )
}

function SaveBar({ visible, onSave, onDiscard, saving }) {
  if (!visible) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0F1B35] text-white rounded-2xl shadow-2xl px-6 py-3.5 flex items-center gap-4">
      <span className="text-sm text-slate-300">You have unsaved changes</span>
      <button onClick={onDiscard} className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-1.5">
        <X size={14} /> Discard
      </button>
      <button
        onClick={onSave}
        className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
      >
        {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
        Save Changes
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentProfile() {
  const [activeSection, setActiveSection] = useState('profile')
  const [dirty,   setDirty]   = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  // Profile fields
  const [profile, setProfile] = useState({
    firstName:   'Maria',
    lastName:    'Schmidt',
    email:       'maria.schmidt@email.com',
    phone:       '+49 151 234 5678',
    country:     'Germany',
    city:        'Berlin',
    profession:  'Civil Engineer',
    bio:         'Engineer relocating from Lagos to Berlin. Preparing for the Goethe B1 exam.',
    avatar:      null,
  })

  // Learning goals
  const [learning, setLearning] = useState({
    currentLevel:   'B1',
    targetLevel:    'B2',
    targetExam:     'Goethe-Zertifikat B2',
    examDate:       '2026-06-15',
    weeklyGoal:     5,
    studyReminder:  true,
    reminderTime:   '19:00',
    relocating:     true,
    destination:    'Berlin, Germany',
  })

  // Security
  const [pwForm, setPwForm]       = useState({ current: '', next: '', confirm: '' })
  const [showPw,  setShowPw]      = useState({ current: false, next: false, confirm: false })
  const [sessions] = useState([
    { device: 'Chrome on Windows', location: 'Berlin, DE',   last: 'Now',    current: true  },
    { device: 'Safari on iPhone',  location: 'Nairobi, KE',  last: '2d ago', current: false },
  ])

  // Notifications
  const [notifs, setNotifs] = useState({
    lessonReminders:  true,
    testResults:      true,
    weeklyDigest:     true,
    newContent:       false,
    examCountdown:    true,
    instructorMessages: true,
    emailNotifs:      true,
    pushNotifs:       false,
  })

  // Preferences
  const [prefs, setPrefs] = useState({
    language:       'en',
    theme:          'light',
    subtitles:      'both',
    playbackSpeed:  '1.0',
    autoplay:       true,
    soundEffects:   true,
  })

  const avatarRef = useRef()

  const markDirty = () => setDirty(true)

  const updateProfile  = (f, v) => { setProfile(p  => ({ ...p, [f]: v })); markDirty() }
  const updateLearning = (f, v) => { setLearning(p => ({ ...p, [f]: v })); markDirty() }
  const updateNotif    = (f, v) => { setNotifs(p   => ({ ...p, [f]: v })); markDirty() }
  const updatePref     = (f, v) => { setPrefs(p    => ({ ...p, [f]: v })); markDirty() }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 900))
    setSaving(false)
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const initials = `${profile.firstName[0]}${profile.lastName[0]}`

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Top bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/student/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <div className="w-px h-5 bg-slate-200" />
          <h1 className="text-slate-800 font-semibold text-base">Profile & Settings</h1>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 px-4 py-2 rounded-xl border border-green-200">
            <CheckCircle size={15} />
            Changes saved
          </div>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-6">

        {/* ── Sidebar ── */}
        <aside className="w-56 shrink-0 space-y-1 sticky top-24 self-start">

          {/* Avatar summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4 text-center">
            <div className="relative w-16 h-16 mx-auto mb-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {initials}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                <Camera size={11} className="text-white" />
              </button>
            </div>
            <p className="text-slate-800 font-semibold text-sm">{profile.firstName} {profile.lastName}</p>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${LEVEL_COLORS[learning.currentLevel]}`}>
              {learning.currentLevel} · {learning.targetExam.split(' ')[0]}
            </span>
          </div>

          {/* Nav */}
          <nav className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 space-y-0.5">
            {SIDEBAR_SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                  ${activeSection === id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : id === 'danger'
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
              >
                <Icon size={15} className="shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* ── Profile ── */}
          {activeSection === 'profile' && (
            <>
              <SectionCard title="Personal Information" description="Update your name, contact details, and bio">
                {/* Avatar upload */}
                <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                      {initials}
                    </div>
                    <button
                      onClick={() => avatarRef.current.click()}
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center border-2 border-white transition-colors shadow-md"
                    >
                      <Camera size={13} className="text-white" />
                    </button>
                    <input ref={avatarRef} type="file" accept="image/*" className="hidden" />
                  </div>
                  <div>
                    <p className="text-slate-800 font-medium text-sm">{profile.firstName} {profile.lastName}</p>
                    <p className="text-slate-400 text-xs mt-0.5 mb-3">{profile.email}</p>
                    <div className="flex gap-2">
                      <button onClick={() => avatarRef.current.click()} className="text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        Upload photo
                      </button>
                      <button className="text-xs text-red-500 hover:text-red-700 transition-colors">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'First Name',  field: 'firstName',  type: 'text', placeholder: 'First name'   },
                    { label: 'Last Name',   field: 'lastName',   type: 'text', placeholder: 'Last name'    },
                    { label: 'Email',       field: 'email',      type: 'email',placeholder: 'Email address' },
                    { label: 'Phone',       field: 'phone',      type: 'tel',  placeholder: '+49 ...'      },
                    { label: 'Country',     field: 'country',    type: 'text', placeholder: 'Country'      },
                    { label: 'City',        field: 'city',       type: 'text', placeholder: 'City'         },
                    { label: 'Profession',  field: 'profession', type: 'text', placeholder: 'Your job title'},
                  ].map(({ label, field, type, placeholder }) => (
                    <div key={field}>
                      <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1.5">{label}</label>
                      <input
                        type={type}
                        value={profile[field]}
                        onChange={e => updateProfile(field, e.target.value)}
                        placeholder={placeholder}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                      />
                    </div>
                  ))}

                  <div className="col-span-2">
                    <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1.5">Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={e => updateProfile('bio', e.target.value)}
                      placeholder="Tell us a bit about yourself and your language learning goals..."
                      rows={3}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Certificates */}
              <SectionCard title="My Certificates" description="Certificates earned from completed courses">
                {certificates.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-6">No certificates yet — keep studying!</p>
                ) : (
                  <div className="space-y-3">
                    {certificates.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-blue-100 hover:bg-blue-50/20 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shrink-0">
                            <Award size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="text-slate-800 text-sm font-medium">{c.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${LEVEL_COLORS[c.level]}`}>{c.level}</span>
                              <span className="text-slate-400 text-xs">{c.date}</span>
                              <span className="text-green-600 text-xs font-semibold">{c.score}%</span>
                            </div>
                          </div>
                        </div>
                        <button className="flex items-center gap-1.5 text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                          <Download size={12} />
                          Download PDF
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </>
          )}

          {/* ── Learning Goals ── */}
          {activeSection === 'learning' && (
            <SectionCard title="Learning Goals" description="Set your CEFR target, exam date, and weekly study goals">
              <div className="space-y-6">

                {/* Level progression */}
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-3">Current Level</label>
                  <div className="flex gap-2">
                    {CEFR_LEVELS.map(l => (
                      <button
                        key={l}
                        onClick={() => updateLearning('currentLevel', l)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all
                          ${learning.currentLevel === l
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-3">Target Level</label>
                  <div className="flex gap-2">
                    {CEFR_LEVELS.map(l => (
                      <button
                        key={l}
                        onClick={() => updateLearning('targetLevel', l)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all
                          ${learning.targetLevel === l
                            ? 'bg-green-600 text-white border-green-600'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1.5">Target Exam</label>
                    <select
                      value={learning.targetExam}
                      onChange={e => updateLearning('targetExam', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-800"
                    >
                      {['Goethe-Zertifikat A1','Goethe-Zertifikat A2','Goethe-Zertifikat B1','Goethe-Zertifikat B2','TELC Deutsch B1','TELC Deutsch B2','TestDaF','DSH'].map(e => (
                        <option key={e}>{e}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1.5">Exam Date</label>
                    <input
                      type="date"
                      value={learning.examDate}
                      onChange={e => updateLearning('examDate', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800"
                    />
                  </div>
                </div>

                {/* Weekly goal */}
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-3">
                    Weekly Study Goal: <span className="text-blue-600 normal-case font-bold">{learning.weeklyGoal} days / week</span>
                  </label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5,6,7].map(d => (
                      <button
                        key={d}
                        onClick={() => updateLearning('weeklyGoal', d)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all
                          ${learning.weeklyGoal >= d
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-slate-200 text-slate-400 hover:border-slate-300'
                          }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {learning.weeklyGoal <= 2 ? 'Casual pace — great for maintenance'
                      : learning.weeklyGoal <= 4 ? 'Steady pace — good for exam preparation'
                      : 'Intensive pace — fastest path to your exam'}
                  </p>
                </div>

                {/* Study reminder */}
                <div className="flex items-center justify-between py-3 border-t border-slate-100">
                  <div>
                    <p className="text-slate-800 text-sm font-medium">Daily study reminder</p>
                    <p className="text-slate-400 text-xs mt-0.5">Get a push notification to keep your streak</p>
                  </div>
                  <Toggle on={learning.studyReminder} onChange={v => updateLearning('studyReminder', v)} />
                </div>

                {learning.studyReminder && (
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1.5">Reminder Time</label>
                    <input
                      type="time"
                      value={learning.reminderTime}
                      onChange={e => updateLearning('reminderTime', e.target.value)}
                      className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800"
                    />
                  </div>
                )}

                {/* Relocation */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-slate-800 text-sm font-medium">I am relocating to Germany</p>
                      <p className="text-slate-400 text-xs mt-0.5">Personalises your learning track for professional relocation</p>
                    </div>
                    <Toggle on={learning.relocating} onChange={v => updateLearning('relocating', v)} />
                  </div>
                  {learning.relocating && (
                    <input
                      value={learning.destination}
                      onChange={e => updateLearning('destination', e.target.value)}
                      placeholder="Destination city, e.g. Berlin, Germany"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800"
                    />
                  )}
                </div>
              </div>
            </SectionCard>
          )}

          {/* ── Security ── */}
          {activeSection === 'security' && (
            <>
              <SectionCard title="Change Password" description="Use a strong password you don't use elsewhere">
                <div className="space-y-4 max-w-sm">
                  {[
                    { label: 'Current Password', field: 'current' },
                    { label: 'New Password',      field: 'next'    },
                    { label: 'Confirm Password',  field: 'confirm' },
                  ].map(({ label, field }) => (
                    <div key={field}>
                      <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1.5">{label}</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPw[field] ? 'text' : 'password'}
                          value={pwForm[field]}
                          onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                          onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPw[field] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}

                  {pwForm.next && (
                    <div className="space-y-1.5">
                      {[
                        { label: 'At least 8 characters', ok: pwForm.next.length >= 8 },
                        { label: 'Contains uppercase',    ok: /[A-Z]/.test(pwForm.next) },
                        { label: 'Contains a number',     ok: /\d/.test(pwForm.next) },
                        { label: 'Passwords match',       ok: pwForm.next === pwForm.confirm && pwForm.confirm.length > 0 },
                      ].map(({ label, ok }) => (
                        <div key={label} className={`flex items-center gap-2 text-xs ${ok ? 'text-green-600' : 'text-slate-400'}`}>
                          {ok ? <CheckCircle size={12} /> : <Circle size={12} />}
                          {label}
                        </div>
                      ))}
                    </div>
                  )}

                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 mt-2">
                    <Key size={14} />
                    Update Password
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Active Sessions" description="Devices currently signed in to your account">
                <div className="space-y-3">
                  {sessions.map((s, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${s.current ? 'border-green-200 bg-green-50/40' : 'border-slate-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.current ? 'bg-green-100' : 'bg-slate-100'}`}>
                          {s.device.includes('iPhone') ? <Smartphone size={16} className="text-slate-500" /> : <Monitor size={16} className="text-slate-500" />}
                        </div>
                        <div>
                          <p className="text-slate-800 text-sm font-medium">{s.device}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{s.location} · {s.last}</p>
                        </div>
                      </div>
                      {s.current
                        ? <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">This device</span>
                        : <button className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Sign out</button>
                      }
                    </div>
                  ))}
                </div>
                <button className="mt-4 text-sm text-red-500 hover:text-red-700 font-medium transition-colors flex items-center gap-1.5">
                  <LogOut size={13} />
                  Sign out of all other devices
                </button>
              </SectionCard>
            </>
          )}

          {/* ── Notifications ── */}
          {activeSection === 'notifications' && (
            <SectionCard title="Notification Preferences" description="Choose what you want to be notified about">
              <div className="space-y-1">
                {[
                  { field: 'lessonReminders',    label: 'Lesson reminders',          desc: 'Daily nudges to keep your streak going'         },
                  { field: 'testResults',         label: 'Test results',              desc: 'Immediate notification when your test is graded' },
                  { field: 'weeklyDigest',        label: 'Weekly progress digest',    desc: 'Summary of your week every Sunday'              },
                  { field: 'newContent',          label: 'New content alerts',        desc: 'When new lessons are added to your course'      },
                  { field: 'examCountdown',       label: 'Exam countdown reminders',  desc: '30, 14, 7, and 1 day before your exam date'     },
                  { field: 'instructorMessages',  label: 'Instructor messages',       desc: 'When your instructor sends you feedback'        },
                ].map(({ field, label, desc }) => (
                  <div key={field} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-slate-800 text-sm font-medium">{label}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                    </div>
                    <Toggle on={notifs[field]} onChange={v => updateNotif(field, v)} />
                  </div>
                ))}

                <div className="pt-4 mt-2 border-t border-slate-100">
                  <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-3">Delivery Channels</p>
                  {[
                    { field: 'emailNotifs', label: 'Email notifications', icon: Mail    },
                    { field: 'pushNotifs',  label: 'Push notifications',  icon: Bell    },
                  ].map(({ field, label, icon: Icon }) => (
                    <div key={field} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-slate-400" />
                        <span className="text-slate-700 text-sm">{label}</span>
                      </div>
                      <Toggle on={notifs[field]} onChange={v => updateNotif(field, v)} />
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          {/* ── Preferences ── */}
          {activeSection === 'preferences' && (
            <SectionCard title="App Preferences" description="Customise your learning experience">
              <div className="space-y-5">

                {/* Theme */}
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-3">Theme</label>
                  <div className="flex gap-3">
                    {[
                      { val: 'light', label: 'Light', icon: Sun  },
                      { val: 'dark',  label: 'Dark',  icon: Moon },
                    ].map(({ val, label, icon: Icon }) => (
                      <button
                        key={val}
                        onClick={() => updatePref('theme', val)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all
                          ${prefs.theme === val ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >
                        <Icon size={15} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interface language */}
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1.5">Interface Language</label>
                  <select
                    value={prefs.language}
                    onChange={e => updatePref('language', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-800"
                  >
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                {/* Subtitle preference */}
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-3">Video Subtitles</label>
                  <div className="flex gap-2">
                    {[
                      { val: 'off',  label: 'Off'          },
                      { val: 'de',   label: 'German'        },
                      { val: 'en',   label: 'English'       },
                      { val: 'both', label: 'Both'          },
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        onClick={() => updatePref('subtitles', val)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all
                          ${prefs.subtitles === val ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Playback speed */}
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-3">Default Playback Speed</label>
                  <div className="flex gap-2">
                    {['0.75', '1.0', '1.25', '1.5', '1.75'].map(s => (
                      <button
                        key={s}
                        onClick={() => updatePref('playbackSpeed', s)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all
                          ${prefs.playbackSpeed === s ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                {[
                  { field: 'autoplay',     label: 'Autoplay next lesson',  desc: 'Automatically start the next lesson when one ends'  },
                  { field: 'soundEffects', label: 'Sound effects',          desc: 'Play sounds for correct answers and achievements'   },
                ].map(({ field, label, desc }) => (
                  <div key={field} className="flex items-center justify-between py-3 border-t border-slate-100">
                    <div>
                      <p className="text-slate-800 text-sm font-medium">{label}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                    </div>
                    <Toggle on={prefs[field]} onChange={v => updatePref(field, v)} />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ── Subscription ── */}
          {activeSection === 'subscription' && (
            <SectionCard title="Subscription & Billing" description="Manage your plan and payment details">
              {/* Current plan */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white mb-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Current Plan</p>
                    <h3 className="text-white text-2xl font-bold">Pro</h3>
                    <p className="text-blue-200 text-sm mt-0.5">$29 / month · Renews 19 Mar 2026</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-2.5">
                    <CreditCard size={20} className="text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'All A1–C2 courses', ok: true  },
                    { label: 'Mock exams',         ok: true  },
                    { label: 'AI feedback',        ok: true  },
                    { label: 'Certificate download',ok: true },
                    { label: 'Offline access',     ok: false },
                    { label: 'Corporate invoice',  ok: false },
                  ].map(({ label, ok }) => (
                    <div key={label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-white' : 'text-blue-400 line-through'}`}>
                      {ok ? <Check size={11} /> : <X size={11} />}
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <button className="flex-1 border border-slate-200 text-slate-700 text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-colors font-medium">
                  Change Plan
                </button>
                <button className="flex-1 border border-red-200 text-red-600 text-sm py-2.5 rounded-xl hover:bg-red-50 transition-colors font-medium">
                  Cancel Subscription
                </button>
              </div>

              {/* Payment method */}
              <div className="border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-7 bg-slate-800 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">VISA</span>
                  </div>
                  <div>
                    <p className="text-slate-800 text-sm font-medium">Visa ending in 4242</p>
                    <p className="text-slate-400 text-xs mt-0.5">Expires 08/27</p>
                  </div>
                </div>
                <button className="text-blue-600 text-xs font-medium hover:underline">Update</button>
              </div>
            </SectionCard>
          )}

          {/* ── Activity Log ── */}
          {activeSection === 'activity' && (
            <SectionCard title="Activity Log" description="Your recent learning activity across the platform">
              <div className="space-y-3">
                {activityLog.map((a, i) => {
                  const Icon = ACTIVITY_ICONS[a.type]
                  return (
                    <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${ACTIVITY_COLORS[a.type]}`}>
                        <Icon size={15} />
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-800 text-sm">{a.action}</p>
                      </div>
                      <span className="text-slate-400 text-xs shrink-0">{a.time}</span>
                    </div>
                  )
                })}
              </div>
              <button className="mt-4 text-blue-600 text-sm font-medium hover:underline">
                Load more activity
              </button>
            </SectionCard>
          )}

          {/* ── Danger Zone ── */}
          {activeSection === 'danger' && (
            <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-red-100 bg-red-50/50">
                <h2 className="font-semibold text-red-700 text-base flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Danger Zone
                </h2>
                <p className="text-red-500 text-sm mt-0.5">These actions are irreversible. Please proceed carefully.</p>
              </div>
              <div className="p-6 space-y-4">
                {[
                  {
                    title:  'Export my data',
                    desc:   'Download a full copy of your account data including progress, scores, and certificates.',
                    action: 'Export Data',
                    icon:   Download,
                    style:  'border border-slate-200 text-slate-700 hover:bg-slate-50',
                  },
                  {
                    title:  'Reset my progress',
                    desc:   'Clear all lesson progress and test scores. Your account and certificates are preserved.',
                    action: 'Reset Progress',
                    icon:   RefreshCw,
                    style:  'border border-amber-300 text-amber-700 hover:bg-amber-50',
                  },
                  {
                    title:  'Delete my account',
                    desc:   'Permanently delete your account, all progress, and all personal data. This cannot be undone.',
                    action: 'Delete Account',
                    icon:   UserX,
                    style:  'border border-red-300 text-red-700 hover:bg-red-50',
                  },
                ].map(({ title, desc, action, icon: Icon, style }) => (
                  <div key={title} className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                    <div className="flex-1 mr-4">
                      <p className="text-slate-800 text-sm font-medium">{title}</p>
                      <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                    <button className={`shrink-0 text-sm px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${style}`}>
                      <Icon size={13} />
                      {action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating save bar */}
      <SaveBar visible={dirty} onSave={handleSave} onDiscard={() => setDirty(false)} saving={saving} />
    </div>
  )
}

// tiny Circle helper for password checks
function Circle({ size }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', border: '1.5px solid #CBD5E1', flexShrink: 0 }} />
}