import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Upload, Video, FileText, X, Check, CheckCircle,
  Clock, HardDrive, Eye, Edit2, Trash2, Play, MoreVertical,
  ChevronDown, AlertCircle, Plus, Search, Filter, Grid,
  List, BookOpen, Layers, Globe, Lock, RefreshCw, Download,
  Subtitles, Languages, Info, Film, Mic, Image
} from 'lucide-react'

// ─── Mock existing videos ─────────────────────────────────────────────────────

const existingVideos = [
  { id: 1, title: 'Introduction to German Articles',    course: 'A1 Foundation',     duration: '12:34', size: '245 MB', status: 'published', views: 843,  thumb: null, level: 'A1', uploaded: '3d ago'  },
  { id: 2, title: 'Nominative vs Accusative Case',      course: 'B1 Goethe Prep',    duration: '18:22', size: '412 MB', status: 'published', views: 1204, thumb: null, level: 'B1', uploaded: '5d ago'  },
  { id: 3, title: 'Konjunktiv II — Wishes & Regrets',  course: 'B2 Advanced',       duration: '22:11', size: '508 MB', status: 'processing',views: 0,    thumb: null, level: 'B2', uploaded: '1h ago'  },
  { id: 4, title: 'Listening: Airport Announcements',  course: 'B1 Goethe Prep',    duration: '08:45', size: '184 MB', status: 'published', views: 672,  thumb: null, level: 'B1', uploaded: '1wk ago' },
  { id: 5, title: 'TestDaF Speaking Section Walkthrough', course: 'C1 TestDaF',     duration: '31:07', size: '720 MB', status: 'draft',     views: 0,    thumb: null, level: 'C1', uploaded: '2d ago'  },
  { id: 6, title: 'Dative Case in Everyday Speech',    course: 'A2 Everyday German',duration: '15:58', size: '367 MB', status: 'published', views: 529,  thumb: null, level: 'A2', uploaded: '2wk ago' },
]

const LEVEL_COLORS = {
  A1: 'bg-slate-100 text-slate-600',
  A2: 'bg-blue-100 text-blue-700',
  B1: 'bg-green-100 text-green-700',
  B2: 'bg-amber-100 text-amber-700',
  C1: 'bg-purple-100 text-purple-700',
  C2: 'bg-red-100 text-red-700',
}

const STATUS_CONFIG = {
  published:  { label: 'Published',  dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50'  },
  processing: { label: 'Processing', dot: 'bg-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50'   },
  draft:      { label: 'Draft',      dot: 'bg-slate-400',  text: 'text-slate-600',  bg: 'bg-slate-100' },
  failed:     { label: 'Failed',     dot: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-50'    },
}

// ─── Upload stages ────────────────────────────────────────────────────────────

const STAGES = [
  { id: 'upload',   label: 'Upload File'   },
  { id: 'details',  label: 'Add Details'   },
  { id: 'settings', label: 'Settings'      },
  { id: 'publish',  label: 'Publish'       },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function StageIndicator({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STAGES.map((s, i) => {
        const done    = i < STAGES.findIndex(x => x.id === current)
        const active  = s.id === current
        const isLast  = i === STAGES.length - 1
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${done   ? 'bg-green-500 text-white'
                : active ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                :          'bg-slate-100 text-slate-400'}`}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all ${done ? 'bg-green-400' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({ onFile }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) onFile(file)
  }, [onFile])

  const handleDrag = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)
  const handleChange = (e) => { const f = e.target.files[0]; if (f) onFile(f) }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDrag}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current.click()}
      className={`relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-200
        ${dragging
          ? 'border-blue-400 bg-blue-50 scale-[1.01]'
          : 'border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30'
        }`}
    >
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleChange} />

      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all
        ${dragging ? 'bg-blue-100' : 'bg-white border border-slate-200 shadow-sm'}`}
      >
        <Film size={36} className={dragging ? 'text-blue-500' : 'text-slate-400'} />
      </div>

      <h3 className="text-slate-700 font-semibold text-lg mb-2">
        {dragging ? 'Drop it here!' : 'Drag & drop your video'}
      </h3>
      <p className="text-slate-400 text-sm mb-6">or click to browse from your computer</p>

      <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
        {[
          { icon: Film, label: 'MP4, MOV, AVI, MKV' },
          { icon: HardDrive, label: 'Max 4 GB per file' },
          { icon: Clock, label: 'Any duration' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon size={13} className="text-slate-300" />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Upload Progress ──────────────────────────────────────────────────────────

function UploadProgress({ file, progress, onCancel }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
          <Video size={22} className="text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-800 font-semibold truncate">{file.name}</p>
          <p className="text-slate-400 text-sm mt-0.5">{formatBytes(file.size)}</p>
        </div>
        {progress < 100 && (
          <button onClick={onCancel} className="text-slate-400 hover:text-red-500 transition-colors">
            <X size={18} />
          </button>
        )}
        {progress === 100 && <CheckCircle size={22} className="text-green-500 shrink-0" />}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 font-medium">
            {progress < 100 ? 'Uploading...' : 'Upload complete'}
          </span>
          <span className="text-blue-600 font-semibold">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-400 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress < 100 && (
          <p className="text-slate-400 text-xs">
            {Math.round(file.size * progress / 100 / 1024 / 1024 * 10) / 10} MB of {formatBytes(file.size)} uploaded
          </p>
        )}
      </div>

      {progress === 100 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Generating thumbnail', done: true  },
            { label: 'Processing video',     done: true  },
            { label: 'Extracting captions',  done: false },
          ].map(({ label, done }) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
              ${done ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-600'}`}
            >
              {done
                ? <CheckCircle size={12} />
                : <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
              }
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VideoUpload() {
  const [stage, setStage]           = useState('upload')
  const [file, setFile]             = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading]   = useState(false)
  const [viewMode, setViewMode]     = useState('grid')
  const [search, setSearch]         = useState('')

  const [details, setDetails] = useState({
    title:       '',
    description: '',
    course:      'German B1 — Goethe Prep',
    module:      'Module 3 — Case System',
    level:       'B1',
    language:    'de',
    thumbnail:   null,
  })

  const [settings, setSettings] = useState({
    visibility:       'enrolled',
    allowDownload:    false,
    enableSubtitles:  true,
    subtitleLang:     'both',
    enableChapters:   false,
    enableNotes:      true,
    completionPct:    80,
  })

  const [published, setPublished] = useState(false)

  // Simulate upload
  const handleFile = (f) => {
    setFile(f)
    setUploading(true)
    let p = 0
    const iv = setInterval(() => {
      p += Math.random() * 12 + 3
      if (p >= 100) { p = 100; clearInterval(iv); setUploading(false) }
      setUploadProgress(Math.min(Math.round(p), 100))
    }, 200)
  }

  const filteredVideos = existingVideos.filter(v =>
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.course.toLowerCase().includes(search.toLowerCase())
  )

  const updateDetail  = (f, v) => setDetails(p => ({ ...p, [f]: v }))
  const updateSetting = (f, v) => setSettings(p => ({ ...p, [f]: v }))

  const canProceedFromUpload = uploadProgress === 100 && !uploading

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Top bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/instructor/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <div className="w-px h-5 bg-slate-200" />
          <h1 className="text-slate-800 font-semibold text-base">Video Library</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
            <HardDrive size={12} />
            <span>14.2 GB of 50 GB used</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── Upload Section ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">Upload New Video</h2>
              <p className="text-slate-400 text-sm mt-0.5">Add a lesson video to your library</p>
            </div>
            {file && (
              <button
                onClick={() => { setFile(null); setUploadProgress(0); setStage('upload'); setPublished(false) }}
                className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw size={13} />
                Start over
              </button>
            )}
          </div>

          <div className="p-6">
            {/* Stage indicator — only show when file selected */}
            {file && <StageIndicator current={stage} />}

            {/* Stage: Upload */}
            {stage === 'upload' && (
              <>
                {!file
                  ? <UploadZone onFile={handleFile} />
                  : <UploadProgress file={file} progress={uploadProgress} onCancel={() => { setFile(null); setUploadProgress(0) }} />
                }
                {canProceedFromUpload && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setStage('details')}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                      Continue to Details
                      <ArrowLeft size={14} className="rotate-180" />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Stage: Details */}
            {stage === 'details' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  {/* Left: form fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Video Title</label>
                      <input
                        value={details.title}
                        onChange={e => updateDetail('title', e.target.value)}
                        placeholder="e.g. Introduction to Dative Case"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Description</label>
                      <textarea
                        value={details.description}
                        onChange={e => updateDetail('description', e.target.value)}
                        placeholder="What will students learn in this video? Include key grammar points or vocabulary covered..."
                        rows={3}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Course</label>
                        <select
                          value={details.course}
                          onChange={e => updateDetail('course', e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                        >
                          {['German A1 Foundation', 'German B1 — Goethe Prep', 'B2 Advanced Grammar', 'C1 TestDaF Mastery'].map(c => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Module</label>
                        <select
                          value={details.module}
                          onChange={e => updateDetail('module', e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                        >
                          {['Module 1 — Basics', 'Module 2 — Vocabulary', 'Module 3 — Case System', 'Module 4 — Verbs'].map(m => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">CEFR Level</label>
                      <div className="flex gap-2 flex-wrap">
                        {['A1','A2','B1','B2','C1','C2'].map(l => (
                          <button
                            key={l}
                            onClick={() => updateDetail('level', l)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                              ${details.level === l
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-slate-200 text-slate-600 hover:border-blue-300'
                              }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: thumbnail + file info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Thumbnail</label>
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all">
                        <Image size={28} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm font-medium">Upload thumbnail</p>
                        <p className="text-slate-400 text-xs mt-1">JPG or PNG · 1280×720 recommended</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">File Info</p>
                      {[
                        { label: 'Filename', value: file?.name || '—' },
                        { label: 'Size',     value: formatBytes(file?.size) },
                        { label: 'Type',     value: file?.type || '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between text-sm">
                          <span className="text-slate-400">{label}</span>
                          <span className="text-slate-700 font-medium truncate max-w-40 text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <button onClick={() => setStage('upload')} className="text-slate-500 text-sm hover:text-slate-700 flex items-center gap-1.5 transition-colors">
                    <ArrowLeft size={14} />
                    Back
                  </button>
                  <button
                    onClick={() => setStage('settings')}
                    disabled={!details.title}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
                  >
                    Continue to Settings
                    <ArrowLeft size={14} className="rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {/* Stage: Settings */}
            {stage === 'settings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Visibility */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-3">Visibility</label>
                    <div className="space-y-2">
                      {[
                        { val: 'enrolled', label: 'Enrolled students only', icon: Lock,   desc: 'Only students enrolled in the course' },
                        { val: 'public',   label: 'Public (preview)',        icon: Globe,  desc: 'Anyone can view as a course preview'  },
                        { val: 'draft',    label: 'Draft — hidden',          icon: Eye,    desc: 'Not visible to any students yet'      },
                      ].map(opt => {
                        const Icon = opt.icon
                        return (
                          <button
                            key={opt.val}
                            onClick={() => updateSetting('visibility', opt.val)}
                            className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all
                              ${settings.visibility === opt.val
                                ? 'border-blue-400 bg-blue-50/50'
                                : 'border-slate-100 hover:border-slate-200'
                              }`}
                          >
                            <Icon size={16} className={`mt-0.5 shrink-0 ${settings.visibility === opt.val ? 'text-blue-500' : 'text-slate-400'}`} />
                            <div>
                              <p className={`text-sm font-medium ${settings.visibility === opt.val ? 'text-blue-700' : 'text-slate-700'}`}>{opt.label}</p>
                              <p className="text-slate-400 text-xs mt-0.5">{opt.desc}</p>
                            </div>
                            {settings.visibility === opt.val && <Check size={14} className="text-blue-500 ml-auto mt-0.5 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Subtitles & options */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-3">Subtitle Options</label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <Languages size={14} className="text-slate-400" />
                            <span className="text-slate-700 text-sm">Enable subtitles</span>
                          </div>
                          <button
                            onClick={() => updateSetting('enableSubtitles', !settings.enableSubtitles)}
                            className={`w-10 h-5.5 rounded-full relative transition-colors ${settings.enableSubtitles ? 'bg-blue-500' : 'bg-slate-200'}`}
                            style={{ height: '22px', width: '40px' }}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings.enableSubtitles ? 'left-5' : 'left-0.5'}`} />
                          </button>
                        </div>

                        {settings.enableSubtitles && (
                          <div>
                            <label className="block text-slate-500 text-xs mb-2">Subtitle language</label>
                            <div className="flex gap-2">
                              {[
                                { val: 'de',   label: 'German only'         },
                                { val: 'en',   label: 'English only'        },
                                { val: 'both', label: 'Both (recommended)'  },
                              ].map(opt => (
                                <button
                                  key={opt.val}
                                  onClick={() => updateSetting('subtitleLang', opt.val)}
                                  className={`flex-1 text-xs py-2 rounded-lg border font-medium transition-all
                                    ${settings.subtitleLang === opt.val
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'border-slate-200 text-slate-600 hover:border-blue-200'
                                    }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-3">Completion Settings</label>
                      <div className="space-y-3">
                        {[
                          { field: 'allowDownload', label: 'Allow video download', icon: Download },
                          { field: 'enableNotes',   label: 'Enable student notes', icon: FileText },
                          { field: 'enableChapters',label: 'Enable chapters',      icon: Layers   },
                        ].map(({ field, label, icon: Icon }) => (
                          <div key={field} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                            <div className="flex items-center gap-2">
                              <Icon size={13} className="text-slate-400" />
                              <span className="text-slate-700 text-sm">{label}</span>
                            </div>
                            <button
                              onClick={() => updateSetting(field, !settings[field])}
                              className={`relative transition-colors rounded-full`}
                              style={{ width: '40px', height: '22px', backgroundColor: settings[field] ? '#3B82F6' : '#E2E8F0' }}
                            >
                              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings[field] ? 'left-5' : 'left-0.5'}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
                        Completion Threshold: <span className="text-blue-600">{settings.completionPct}%</span>
                      </label>
                      <input
                        type="range" min={50} max={100} value={settings.completionPct}
                        onChange={e => updateSetting('completionPct', +e.target.value)}
                        className="w-full accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>50%</span>
                        <span className="text-slate-500">Student must watch at least {settings.completionPct}% to mark complete</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <button onClick={() => setStage('details')} className="text-slate-500 text-sm hover:text-slate-700 flex items-center gap-1.5 transition-colors">
                    <ArrowLeft size={14} />
                    Back
                  </button>
                  <button
                    onClick={() => setStage('publish')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
                  >
                    Review & Publish
                    <ArrowLeft size={14} className="rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {/* Stage: Publish */}
            {stage === 'publish' && (
              <div className="space-y-5">
                {!published ? (
                  <>
                    <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                      <h3 className="font-semibold text-slate-800 text-sm mb-4">Review Before Publishing</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Title',       value: details.title       },
                          { label: 'Course',      value: details.course      },
                          { label: 'Module',      value: details.module      },
                          { label: 'Level',       value: details.level       },
                          { label: 'Visibility',  value: settings.visibility },
                          { label: 'Subtitles',   value: settings.enableSubtitles ? settings.subtitleLang : 'Off' },
                          { label: 'Completion',  value: `Watch ${settings.completionPct}%` },
                          { label: 'Download',    value: settings.allowDownload ? 'Allowed' : 'Not allowed' },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-white rounded-xl p-3 border border-slate-100">
                            <p className="text-slate-400 text-xs mb-1">{label}</p>
                            <p className="text-slate-800 text-sm font-semibold capitalize">{value || '—'}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                      <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-blue-700 text-sm">
                        Publishing will make this video immediately available to enrolled students in <strong>{details.course}</strong>. You can change visibility at any time from your video library.
                      </p>
                    </div>

                    <div className="flex justify-between pt-2 border-t border-slate-100">
                      <button onClick={() => setStage('settings')} className="text-slate-500 text-sm hover:text-slate-700 flex items-center gap-1.5 transition-colors">
                        <ArrowLeft size={14} />
                        Back
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPublished(true)}
                          className="border border-slate-200 text-slate-600 text-sm px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                        >
                          Save as Draft
                        </button>
                        <button
                          onClick={() => setPublished(true)}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
                        >
                          <Globe size={14} />
                          Publish Now
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                      <CheckCircle size={40} className="text-green-500" />
                    </div>
                    <h3 className="text-slate-800 font-bold text-xl mb-2">Video Published!</h3>
                    <p className="text-slate-500 text-sm mb-6">
                      <strong>{details.title || 'Your video'}</strong> is now live in <strong>{details.course}</strong>
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => { setFile(null); setUploadProgress(0); setStage('upload'); setPublished(false); setDetails({ title: '', description: '', course: 'German B1 — Goethe Prep', module: 'Module 3 — Case System', level: 'B1', language: 'de', thumbnail: null }) }}
                        className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                      >
                        <Upload size={14} />
                        Upload Another
                      </button>
                      <Link
                        to="/instructor/dashboard"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2.5 rounded-xl font-medium transition-colors"
                      >
                        Go to Dashboard
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Video Library ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">Video Library</h2>
              <p className="text-slate-400 text-sm mt-0.5">{existingVideos.length} videos · 14.2 GB used</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search videos..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 w-48"
                />
              </div>
              <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Grid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Grid view */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-3 gap-4 p-5">
              {filteredVideos.map(v => {
                const st = STATUS_CONFIG[v.status]
                return (
                  <div key={v.id} className="group border border-slate-100 rounded-xl overflow-hidden hover:border-blue-200 hover:shadow-md transition-all">
                    {/* Thumbnail */}
                    <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 aspect-video flex items-center justify-center">
                      <Film size={32} className="text-slate-600" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                          <Play size={16} className="text-slate-800 ml-0.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                        {v.duration}
                      </span>
                      <span className={`absolute top-2 left-2 text-xs font-semibold px-1.5 py-0.5 rounded-full ${LEVEL_COLORS[v.level]}`}>
                        {v.level}
                      </span>
                    </div>

                    <div className="p-3">
                      <p className="text-slate-800 text-sm font-medium line-clamp-2 leading-snug mb-2">{v.title}</p>
                      <p className="text-slate-400 text-xs mb-2 flex items-center gap-1">
                        <BookOpen size={10} />
                        {v.course}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1.5 ${st.bg} ${st.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 size={12} />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* List view */}
          {viewMode === 'list' && (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 font-medium">
                  <th className="text-left px-5 py-3">Video</th>
                  <th className="text-left px-3 py-3">Course</th>
                  <th className="text-left px-3 py-3">Level</th>
                  <th className="text-left px-3 py-3">Duration</th>
                  <th className="text-left px-3 py-3">Size</th>
                  <th className="text-left px-3 py-3">Views</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="text-left px-3 py-3">Uploaded</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredVideos.map(v => {
                  const st = STATUS_CONFIG[v.status]
                  return (
                    <tr key={v.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-9 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                            <Film size={14} className="text-slate-500" />
                          </div>
                          <p className="text-slate-800 text-sm font-medium max-w-48 truncate">{v.title}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3"><span className="text-slate-600 text-sm">{v.course}</span></td>
                      <td className="px-3 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[v.level]}`}>{v.level}</span></td>
                      <td className="px-3 py-3"><span className="text-slate-600 text-sm font-mono">{v.duration}</span></td>
                      <td className="px-3 py-3"><span className="text-slate-500 text-sm">{v.size}</span></td>
                      <td className="px-3 py-3"><span className="text-slate-700 text-sm">{v.views.toLocaleString()}</span></td>
                      <td className="px-3 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit ${st.bg} ${st.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${v.status === 'processing' ? 'animate-pulse' : ''}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-3 py-3"><span className="text-slate-400 text-xs">{v.uploaded}</span></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={13} /></button>
                          <button className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Edit2 size={13} /></button>
                          <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}