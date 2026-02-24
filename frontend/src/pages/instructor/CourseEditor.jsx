import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Save,
  Check, Settings, BookOpen, Video, GripVertical, Edit2,
  Eye, Send, AlertTriangle, CheckCircle, RefreshCw, X,
  Clock, Users, BarChart2, Upload, Link, FileText,
  ChevronRight, Layers, Globe, Lock, Star, ImageOff
} from 'lucide-react'
import API from '../../services/api'

// ─── API helpers ──────────────────────────────────────────────────────────────

const instructorCourseAPI = {
  list:         ()           => API.get('/instructor/courses/'),
  create:       (data)       => API.post('/instructor/courses/', data),
  get:          (id)         => API.get(`/instructor/courses/${id}/`),
  update:       (id, data)   => API.patch(`/instructor/courses/${id}/`, data),
  delete:       (id)         => API.delete(`/instructor/courses/${id}/`),
  submit:       (id)         => API.post(`/instructor/courses/${id}/submit/`),
  getModules:   (id)         => API.get(`/instructor/courses/${id}/modules/`),
  addModule:    (id, data)   => API.post(`/instructor/courses/${id}/modules/`, data),
  updateModule: (mid, data)  => API.patch(`/instructor/modules/${mid}/`, data),
  deleteModule: (mid)        => API.delete(`/instructor/modules/${mid}/`),
  addLesson:    (mid, data)  => API.post(`/instructor/modules/${mid}/lessons/`, data),
  updateLesson: (lid, data)  => API.patch(`/instructor/lessons/${lid}/`, data),
  deleteLesson: (lid)        => API.delete(`/instructor/lessons/${lid}/`),
}

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const LEVEL_COLORS = {
  A1: 'bg-emerald-100 text-emerald-700', A2: 'bg-teal-100 text-teal-700',
  B1: 'bg-blue-100 text-blue-700',       B2: 'bg-indigo-100 text-indigo-700',
  C1: 'bg-purple-100 text-purple-700',   C2: 'bg-amber-100 text-amber-700',
}

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     bg: 'bg-slate-100', text: 'text-slate-600', icon: Lock  },
  review:    { label: 'In Review', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  published: { label: 'Published', bg: 'bg-green-100', text: 'text-green-700', icon: Globe },
}

const LEVEL_LABELS = {
  A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate',
  B2: 'Upper Intermediate', C1: 'Advanced', C2: 'Mastery',
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium
      ${type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}>
      {type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle size={14} className="text-green-400" />}
      {message}
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X size={13} /></button>
    </div>
  )
}

// ─── Thumbnail Uploader ───────────────────────────────────────────────────────

function ThumbnailUploader({ preview, onChange, onRemove }) {
  const fileRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please select an image file (JPG or PNG)'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return }
    onChange(file, URL.createObjectURL(file))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const fakeEvent = { target: { files: [file] } }
      handleFile(fakeEvent)
    }
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />

      {preview ? (
        /* ── Preview state ── */
        <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
          <img
            src={preview}
            alt="Course thumbnail"
            className="w-full h-44 object-cover"
          />
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 bg-white text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow"
            >
              <Upload size={13} /> Replace
            </button>
            <button
              onClick={onRemove}
              className="flex items-center gap-2 bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-red-700 transition-colors shadow"
            >
              <X size={13} /> Remove
            </button>
          </div>
          {/* Bottom label */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
            <p className="text-white text-xs font-medium">Thumbnail · hover to change</p>
          </div>
        </div>
      ) : (
        /* ── Empty / drop zone ── */
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-slate-200 rounded-xl p-7 text-center
            hover:border-blue-400 hover:bg-blue-50/40 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-slate-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
            <Upload size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <p className="text-slate-700 text-sm font-semibold">Upload thumbnail</p>
          <p className="text-slate-400 text-xs mt-1">Drag & drop or click to browse</p>
          <p className="text-slate-300 text-xs mt-0.5">JPG, PNG, WebP · Max 5MB · 1280×720px recommended</p>
        </div>
      )}
    </div>
  )
}

// ─── Lesson Form Modal ────────────────────────────────────────────────────────

function LessonModal({ lesson, moduleId, onClose, onSaved }) {
  const isEdit = !!lesson
  const [form, setForm] = useState({
    title:          lesson?.title        || '',
    description:    lesson?.description  || '',
    video_url:      lesson?.video_url    || '',
    duration:       lesson?.duration     || '',
    transcript:     lesson?.transcript   || '',
    is_preview:     lesson?.is_preview   || false,
    completion_pct: lesson?.completion_pct ?? 80,
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [tab,    setTab]    = useState('details')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true); setError('')
    try {
      // Coerce empty strings → numbers so Django's integer fields don't 500
      const payload = {
        ...form,
        duration:       form.duration       === '' ? 0  : Number(form.duration),
        completion_pct: form.completion_pct === '' ? 80 : Number(form.completion_pct),
      }
      if (isEdit) { await instructorCourseAPI.updateLesson(lesson.id, payload) }
      else        { await instructorCourseAPI.addLesson(moduleId, payload)      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to save lesson')
    } finally { setSaving(false) }
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-800"
  const labelCls = "block text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1.5"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="bg-[#0f1b35] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Video size={16} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{isEdit ? 'Edit Lesson' : 'Add Lesson'}</h3>
              <p className="text-slate-400 text-xs mt-0.5">{isEdit ? lesson.title : 'New lesson'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="flex border-b border-slate-100">
          {[{ id: 'details', label: 'Details', icon: FileText }, { id: 'content', label: 'Video & Content', icon: Video }].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors
                ${tab === id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {tab === 'details' && (
            <>
              <div>
                <label className={labelCls}>Lesson Title *</label>
                <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Introduction to the Dativ" />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea className={inputCls} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What will students learn?" style={{ resize: 'none' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Duration (minutes)</label>
                  <input className={inputCls} type="number" min={1} value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="15" />
                </div>
                <div>
                  <label className={labelCls}>Completion threshold (%)</label>
                  <input className={inputCls} type="number" min={50} max={100} value={form.completion_pct} onChange={e => set('completion_pct', +e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border border-slate-100 rounded-xl px-4">
                <div>
                  <p className="text-slate-800 text-sm font-medium">Free Preview</p>
                  <p className="text-slate-400 text-xs mt-0.5">Non-enrolled students can watch this lesson</p>
                </div>
                <button onClick={() => set('is_preview', !form.is_preview)}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${form.is_preview ? 'bg-blue-500' : 'bg-slate-200'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${form.is_preview ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </>
          )}

          {tab === 'content' && (
            <>
              <div>
                <label className={labelCls}>Video URL</label>
                <div className="relative">
                  <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className={`${inputCls} pl-9`} value={form.video_url} onChange={e => set('video_url', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                </div>
                <p className="text-slate-400 text-xs mt-1.5">YouTube, Vimeo, or direct MP4 URL</p>
              </div>
              <div>
                <label className={labelCls}>Transcript / Notes</label>
                <textarea className={inputCls} rows={5} value={form.transcript} onChange={e => set('transcript', e.target.value)} placeholder="Paste the lesson transcript here…" style={{ resize: 'vertical' }} />
              </div>
            </>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-2">
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2">
            {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> {isEdit ? 'Save Changes' : 'Add Lesson'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Module Row ───────────────────────────────────────────────────────────────

function ModuleRow({ module, courseId, onUpdated, onDeleted, showToast }) {
  const [expanded,    setExpanded]    = useState(true)
  const [editing,     setEditing]     = useState(false)
  const [title,       setTitle]       = useState(module.title)
  const [savingTitle, setSavingTitle] = useState(false)
  const [lessonModal, setLessonModal] = useState(null)
  const [deleting,    setDeleting]    = useState(false)

  const saveTitle = async () => {
    if (!title.trim()) return
    setSavingTitle(true)
    try { await instructorCourseAPI.updateModule(module.id, { title }); setEditing(false); onUpdated() }
    catch { showToast('Failed to update module', 'error') }
    finally { setSavingTitle(false) }
  }

  const deleteModule = async () => {
    if (!window.confirm(`Delete module "${module.title}" and all its lessons?`)) return
    setDeleting(true)
    try { await instructorCourseAPI.deleteModule(module.id); onDeleted(); showToast('Module deleted') }
    catch { showToast('Failed to delete module', 'error'); setDeleting(false) }
  }

  const deleteLesson = async (lesson) => {
    if (!window.confirm(`Delete lesson "${lesson.title}"?`)) return
    try { await instructorCourseAPI.deleteLesson(lesson.id); onUpdated(); showToast('Lesson deleted') }
    catch { showToast('Failed to delete lesson', 'error') }
  }

  const lessons = module.lessons || []

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 bg-slate-50/80">
        <div className="text-slate-300 cursor-grab shrink-0"><GripVertical size={16} /></div>
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <Layers size={13} className="text-white" />
        </div>
        {editing ? (
          <div className="flex items-center gap-2 flex-1">
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitle(module.title); setEditing(false) } }}
              className="flex-1 border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <button onClick={saveTitle} disabled={savingTitle} className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              {savingTitle ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
            </button>
            <button onClick={() => { setTitle(module.title); setEditing(false) }} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><X size={13} /></button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-slate-800 font-semibold text-sm truncate">{module.title}</span>
            <span className="text-slate-400 text-xs shrink-0">({lessons.length} lesson{lessons.length !== 1 ? 's' : ''})</span>
          </div>
        )}
        {!editing && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setEditing(true)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={13} /></button>
            <button onClick={deleteModule} disabled={deleting} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              {deleting ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
            <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-1">
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="divide-y divide-slate-50">
          {lessons.length === 0 ? (
            <div className="px-5 py-5 text-center text-slate-400 text-sm">No lessons yet — add one below</div>
          ) : lessons.map((lesson, li) => (
            <div key={lesson.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">
              <div className="text-slate-200 group-hover:text-slate-300 cursor-grab shrink-0"><GripVertical size={14} /></div>
              <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">{li + 1}</div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Video size={13} className="text-slate-400 shrink-0" />
                <span className="text-slate-700 text-sm truncate">{lesson.title}</span>
                {lesson.is_preview && (
                  <span className="shrink-0 text-xs bg-green-50 text-green-600 border border-green-100 px-1.5 py-0.5 rounded-full font-medium">Free</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 text-xs text-slate-400">
                {lesson.duration ? <span className="flex items-center gap-1"><Clock size={11} />{lesson.duration}m</span> : null}
                {lesson.video_url
                  ? <span className="text-green-500 flex items-center gap-1"><CheckCircle size={11} /> Video</span>
                  : <span className="text-amber-400 flex items-center gap-1"><AlertTriangle size={11} /> No video</span>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => setLessonModal(lesson)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={12} /></button>
                <button onClick={() => deleteLesson(lesson)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          <div className="px-5 py-3">
            <button onClick={() => setLessonModal('new')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
              <Plus size={14} /> Add Lesson
            </button>
          </div>
        </div>
      )}

      {lessonModal && (
        <LessonModal
          lesson={lessonModal === 'new' ? null : lessonModal}
          moduleId={module.id}
          onClose={() => setLessonModal(null)}
          onSaved={() => { setLessonModal(null); onUpdated(); showToast(lessonModal === 'new' ? 'Lesson added' : 'Lesson updated') }}
        />
      )}
    </div>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function CourseEditor() {
  const navigate     = useNavigate()
  const { courseId } = useParams()
  const isNew        = !courseId

  const [course,       setCourse]       = useState(null)
  const [modules,      setModules]      = useState([])
  const [loading,      setLoading]      = useState(!isNew)
  const [activeTab,    setActiveTab]    = useState('details')
  const [toast,        setToast]        = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [addingModule, setAddingModule] = useState(false)

  // ── Thumbnail state ───────────────────────────────────────────────────────
  const [thumbnailFile,    setThumbnailFile]    = useState(null)   // File object waiting to be saved
  const [thumbnailPreview, setThumbnailPreview] = useState(null)   // URL for <img> preview

  const handleThumbnailChange = (file, previewUrl) => {
    setThumbnailFile(file)
    setThumbnailPreview(previewUrl)
  }

  const handleThumbnailRemove = () => {
    setThumbnailFile(null)
    setThumbnailPreview(null)
    // If already saved on server, patch thumbnail to null
    if (course?.thumbnail) {
      const fd = new FormData()
      fd.append('thumbnail', '')
      API.patch(`/instructor/courses/${course.id}/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(res => setCourse(res.data)).catch(() => {})
    }
  }

  const [form, setForm] = useState({ title: '', description: '', level: 'B1', price: '' })
  const showToast = (message, type = 'success') => setToast({ message, type })
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Load existing course ──────────────────────────────────────────────────
  useEffect(() => {
    if (isNew) return
    Promise.all([
      instructorCourseAPI.get(courseId),
      instructorCourseAPI.getModules(courseId),
    ]).then(([cRes, mRes]) => {
      const c = cRes.data
      setCourse(c)
      setForm({ title: c.title, description: c.description || '', level: c.level || 'B1', price: c.price || '' })
      if (c.thumbnail) setThumbnailPreview(c.thumbnail)
      const d = mRes.data?.results ?? mRes.data
      setModules(Array.isArray(d) ? d : [])
    }).catch(() => showToast('Failed to load course', 'error'))
      .finally(() => setLoading(false))
  }, [courseId])

  const refreshModules = () => {
    if (isNew || !course) return
    instructorCourseAPI.getModules(course.id).then(res => {
      const d = res.data?.results ?? res.data
      setModules(Array.isArray(d) ? d : [])
    })
  }

  // ── Create new course ─────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.title.trim()) { showToast('Course title is required', 'error'); return }
    setSaving(true)
    try {
      // If thumbnail selected at creation time, use FormData
      let res
      if (thumbnailFile) {
        const fd = new FormData()
        Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
        fd.append('thumbnail', thumbnailFile)
        res = await API.post('/instructor/courses/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        res = await instructorCourseAPI.create(form)
      }
      const created = res.data
      setCourse(created)
      setThumbnailFile(null)
      if (created.thumbnail) setThumbnailPreview(created.thumbnail)
      showToast('Course created!')
      navigate(`/instructor/courses/${created.id}/edit`, { replace: true })
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create course', 'error')
    } finally { setSaving(false) }
  }

  // ── Save course details ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) { showToast('Course title is required', 'error'); return }
    setSaving(true)
    try {
      if (thumbnailFile) {
        // Send as multipart when a new image is selected
        const fd = new FormData()
        Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
        fd.append('thumbnail', thumbnailFile)
        const res = await API.patch(`/instructor/courses/${course.id}/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setCourse(res.data)
        setThumbnailFile(null)
        if (res.data.thumbnail) setThumbnailPreview(res.data.thumbnail)
      } else {
        // Normal JSON patch for text fields only
        const res = await instructorCourseAPI.update(course.id, form)
        setCourse(res.data)
      }
      showToast('Changes saved')
    } catch { showToast('Failed to save', 'error') }
    finally { setSaving(false) }
  }

  // ── Submit for review ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!course) return
    if (modules.length === 0) { showToast('Add at least one module before submitting', 'error'); return }
    const totalLessons = modules.reduce((s, m) => s + (m.lessons?.length || 0), 0)
    if (totalLessons === 0) { showToast('Add at least one lesson before submitting', 'error'); return }
    setSubmitting(true)
    try {
      await instructorCourseAPI.submit(course.id)
      setCourse(c => ({ ...c, status: 'review' }))
      showToast('Course submitted for admin review!')
    } catch (err) {
      showToast(err.response?.data?.error || 'Submit failed', 'error')
    } finally { setSubmitting(false) }
  }

  // ── Add module ────────────────────────────────────────────────────────────
  const handleAddModule = async () => {
    if (!course) { showToast('Save course details first', 'error'); return }
    setAddingModule(true)
    try {
      await instructorCourseAPI.addModule(course.id, { title: `Module ${modules.length + 1}` })
      await refreshModules()
      showToast('Module added')
    } catch { showToast('Failed to add module', 'error') }
    finally { setAddingModule(false) }
  }

  const statusCfg    = STATUS_CONFIG[course?.status || 'draft']
  const StatusIcon   = statusCfg.icon
  const totalLessons = modules.reduce((s, m) => s + (m.lessons?.length || 0), 0)
  const inputCls     = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-800"
  const labelCls     = "block text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1.5"

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-500">
        <RefreshCw size={18} className="animate-spin" />
        <span className="text-sm">Loading course…</span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/instructor/dashboard')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors font-medium">
            <ArrowLeft size={16} /> Dashboard
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <div>
            <h1 className="text-slate-800 font-semibold text-base leading-tight">
              {form.title || 'Untitled Course'}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1.5">
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                <StatusIcon size={10} /> {statusCfg.label}
              </span>
              {!isNew && <span>· {modules.length} modules · {totalLessons} lessons</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Layers size={11} /> {modules.length} modules
              </span>
              <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Video size={11} /> {totalLessons} lessons
              </span>
              {course?.student_count > 0 && (
                <span className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Users size={11} /> {course.student_count} students
                </span>
              )}
            </div>
          )}

          {isNew ? (
            <button onClick={handleCreate} disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? 'Creating…' : 'Create Course'}
            </button>
          ) : (
            <>
              <button onClick={handleSave} disabled={saving}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium transition-all
                  ${saving ? 'bg-slate-200 text-slate-500' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving…' : thumbnailFile ? 'Save with Thumbnail' : 'Save'}
              </button>
              {course?.status === 'draft' && (
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors">
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  {submitting ? 'Submitting…' : 'Submit for Review'}
                </button>
              )}
              {course?.status === 'review' && (
                <span className="flex items-center gap-2 bg-amber-50 text-amber-700 text-sm px-4 py-2 rounded-xl font-medium border border-amber-200">
                  <Clock size={14} /> Awaiting Review
                </span>
              )}
              {course?.status === 'published' && (
                <span className="flex items-center gap-2 bg-green-50 text-green-700 text-sm px-4 py-2 rounded-xl font-medium border border-green-200">
                  <Globe size={14} /> Published
                </span>
              )}
            </>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-6">

        {/* ── Left: Tabs + Content ── */}
        <div className="flex-1 min-w-0 space-y-5">

          <div className="flex gap-1 bg-white border border-slate-100 p-1 rounded-xl w-fit shadow-sm">
            {[
              { id: 'details',    label: 'Course Details', icon: Settings },
              { id: 'curriculum', label: 'Curriculum',     icon: BookOpen },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeTab === id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* ── Details tab ── */}
          {activeTab === 'details' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <div>
                <label className={labelCls}>Course Title *</label>
                <input className={inputCls} value={form.title} onChange={e => setF('title', e.target.value)} placeholder="e.g. German B1 — Goethe Exam Preparation" />
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea className={inputCls} rows={4} value={form.description} onChange={e => setF('description', e.target.value)}
                  placeholder="Describe what students will learn, who it's for, and what makes it great…" style={{ resize: 'vertical' }} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>CEFR Level</label>
                  <select className={inputCls} value={form.level} onChange={e => setF('level', e.target.value)}>
                    {CEFR.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Price (€)</label>
                  <input className={inputCls} type="number" min={0} step={0.01} value={form.price} onChange={e => setF('price', e.target.value)} placeholder="0 for free" />
                </div>
              </div>

              {/* ── Thumbnail uploader ── */}
              <div>
                <label className={labelCls}>
                  Course Thumbnail
                  {thumbnailFile && (
                    <span className="ml-2 text-blue-500 normal-case font-normal">· unsaved — click Save to upload</span>
                  )}
                </label>
                <ThumbnailUploader
                  preview={thumbnailPreview}
                  onChange={handleThumbnailChange}
                  onRemove={handleThumbnailRemove}
                />
              </div>

              {isNew && (
                <div className="flex justify-end pt-2">
                  <button onClick={handleCreate} disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm px-6 py-2.5 rounded-xl font-medium transition-colors">
                    {saving ? <><RefreshCw size={14} className="animate-spin" /> Creating…</> : <><Plus size={14} /> Create Course</>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Curriculum tab ── */}
          {activeTab === 'curriculum' && (
            <div className="space-y-4">
              {isNew || !course ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={24} className="text-blue-400" />
                  </div>
                  <p className="text-slate-600 font-medium mb-1">Create the course first</p>
                  <p className="text-slate-400 text-sm">Fill in the details tab and click "Create Course" before adding modules</p>
                  <button onClick={() => setActiveTab('details')}
                    className="mt-4 flex items-center gap-2 text-blue-600 text-sm font-medium mx-auto hover:underline">
                    <ChevronRight size={14} /> Go to Details
                  </button>
                </div>
              ) : modules.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Layers size={24} className="text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium mb-1">No modules yet</p>
                  <p className="text-slate-400 text-sm mb-5">Modules group related lessons — add your first one below</p>
                  <button onClick={handleAddModule} disabled={addingModule}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2.5 rounded-xl font-medium transition-colors mx-auto">
                    {addingModule ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                    Add First Module
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {modules.map(m => (
                      <ModuleRow key={m.id} module={m} courseId={course.id}
                        onUpdated={refreshModules} onDeleted={refreshModules} showToast={showToast} />
                    ))}
                  </div>
                  <button onClick={handleAddModule} disabled={addingModule}
                    className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30 transition-all font-medium text-sm">
                    {addingModule ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                    {addingModule ? 'Adding…' : 'Add Module'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-64 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sticky top-24">
            <h3 className="font-semibold text-slate-800 text-sm mb-4">Course Summary</h3>

            {/* Thumbnail mini-preview in sidebar */}
            {thumbnailPreview && (
              <div className="mb-4 rounded-xl overflow-hidden border border-slate-100">
                <img src={thumbnailPreview} alt="" className="w-full h-24 object-cover" />
              </div>
            )}

            <div className="space-y-3">
              {[
                { label: 'Status',  value: statusCfg.label,                         icon: StatusIcon, color: statusCfg.text },
                { label: 'Level',   value: form.level || '—',                        icon: Star,       color: 'text-amber-500' },
                { label: 'Modules', value: modules.length,                           icon: Layers,     color: 'text-blue-500' },
                { label: 'Lessons', value: totalLessons,                             icon: Video,      color: 'text-purple-500' },
                { label: 'Price',   value: form.price ? `€${form.price}` : 'Free',  icon: BarChart2,  color: 'text-green-500' },
                ...(course?.student_count > 0 ? [{ label: 'Students', value: course.student_count, icon: Users, color: 'text-slate-500' }] : []),
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <Icon size={13} className={color} />
                    <span className="text-slate-500 text-xs">{label}</span>
                  </div>
                  <span className="text-slate-800 text-sm font-semibold">{value}</span>
                </div>
              ))}
            </div>

            {form.level && (
              <div className={`mt-4 text-center py-2 rounded-xl text-xs font-bold ${LEVEL_COLORS[form.level] || 'bg-slate-100 text-slate-600'}`}>
                {form.level} · {LEVEL_LABELS[form.level]}
              </div>
            )}

            {!isNew && course?.status === 'draft' && (
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-blue-700 text-xs leading-relaxed">
                  Add modules and lessons, then submit for admin review to publish.
                </p>
              </div>
            )}
          </div>

          {!isNew && course && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-3">Quick Actions</p>
              <button onClick={() => setActiveTab('curriculum')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 border border-slate-100 transition-colors">
                <Plus size={14} className="text-blue-500" /> Add Module
              </button>
              <button onClick={() => navigate('/instructor/test-builder')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 border border-slate-100 transition-colors">
                <FileText size={14} className="text-purple-500" /> Build a Test
              </button>
              <button onClick={() => navigate('/instructor/dashboard')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 border border-slate-100 transition-colors">
                <Eye size={14} className="text-slate-400" /> Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}