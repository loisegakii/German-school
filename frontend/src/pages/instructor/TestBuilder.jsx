import { useState } from 'react'
import {
  ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  Save, Eye, Settings, CheckCircle, Circle, Type, List,
  ToggleLeft, Mic, Clock, Award, BookOpen, AlertTriangle,
  Copy, MoveUp, MoveDown, X, Check, Info, Layers, PenTool,
  Hash, AlignLeft, Volume2, HelpCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_TYPES = [
  { id: 'multiple_choice', label: 'Multiple Choice',    icon: List,       desc: 'A, B, C, D options with one correct answer'         },
  { id: 'fill_blank',      label: 'Fill in the Blank',  icon: Type,       desc: 'Student types the missing word or phrase'            },
  { id: 'true_false',      label: 'True / False',       icon: ToggleLeft, desc: 'Simple binary correct/incorrect question'            },
  { id: 'short_answer',    label: 'Short Answer',       icon: AlignLeft,  desc: 'Open-ended written response, manually graded'        },
  { id: 'audio',           label: 'Audio Question',     icon: Volume2,    desc: 'Attach an audio clip for listening comprehension'    },
]

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const LEVEL_COLORS = {
  A1: 'bg-slate-100 text-slate-600 border-slate-200',
  A2: 'bg-blue-100 text-blue-700 border-blue-200',
  B1: 'bg-green-100 text-green-700 border-green-200',
  B2: 'bg-amber-100 text-amber-700 border-amber-200',
  C1: 'bg-purple-100 text-purple-700 border-purple-200',
  C2: 'bg-red-100 text-red-700 border-red-200',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeQuestion = (type = 'multiple_choice') => ({
  id: Date.now() + Math.random(),
  type,
  text: '',
  points: 1,
  level: 'B1',
  explanation: '',
  options: type === 'multiple_choice'
    ? [
        { id: 1, text: '', correct: true  },
        { id: 2, text: '', correct: false },
        { id: 3, text: '', correct: false },
        { id: 4, text: '', correct: false },
      ]
    : type === 'true_false'
    ? [
        { id: 1, text: 'True',  correct: true  },
        { id: 2, text: 'False', correct: false },
      ]
    : [],
  correctAnswer: '',
  expanded: true,
})

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeBadge({ type }) {
  const t = QUESTION_TYPES.find(q => q.id === type)
  if (!t) return null
  const Icon = t.icon
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
      <Icon size={11} />
      {t.label}
    </span>
  )
}

function QuestionCard({ question, index, total, onChange, onDelete, onMove, onDuplicate }) {
  const [showTypePicker, setShowTypePicker] = useState(false)

  const updateField = (field, value) => onChange({ ...question, [field]: value })

  const updateOption = (optId, field, value) => {
    const updated = question.options.map(o => o.id === optId ? { ...o, [field]: value } : o)
    onChange({ ...question, options: updated })
  }

  const setCorrect = (optId) => {
    const updated = question.options.map(o => ({ ...o, correct: o.id === optId }))
    onChange({ ...question, options: updated })
  }

  const addOption = () => {
    if (question.options.length >= 6) return
    onChange({
      ...question,
      options: [...question.options, { id: Date.now(), text: '', correct: false }]
    })
  }

  const removeOption = (optId) => {
    if (question.options.length <= 2) return
    onChange({ ...question, options: question.options.filter(o => o.id !== optId) })
  }

  const toggleExpand = () => updateField('expanded', !question.expanded)

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all duration-200 ${question.expanded ? 'border-blue-200 shadow-md shadow-blue-50' : 'border-slate-100 shadow-sm'}`}>

      {/* Card Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="text-slate-300 cursor-grab active:cursor-grabbing shrink-0">
          <GripVertical size={18} />
        </div>

        <div className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white text-xs font-bold rounded-lg shrink-0">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          {question.expanded ? (
            <p className="text-slate-400 text-sm">Editing question {index + 1}</p>
          ) : (
            <p className="text-slate-700 text-sm font-medium truncate">
              {question.text || <span className="text-slate-400 italic">Untitled question</span>}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <TypeBadge type={question.type} />

          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${LEVEL_COLORS[question.level]}`}>
            {question.level}
          </span>

          <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
            {question.points} pt{question.points !== 1 ? 's' : ''}
          </span>

          <div className="flex items-center gap-1 ml-1">
            <button onClick={() => onMove(index, -1)} disabled={index === 0} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors">
              <MoveUp size={13} />
            </button>
            <button onClick={() => onMove(index, 1)} disabled={index === total - 1} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors">
              <MoveDown size={13} />
            </button>
            <button onClick={() => onDuplicate(index)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <Copy size={13} />
            </button>
            <button onClick={() => onDelete(index)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 size={13} />
            </button>
            <button onClick={toggleExpand} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-1">
              {question.expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Body */}
      {question.expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-slate-100 pt-4">

          {/* Question meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Type picker */}
            <div className="relative">
              <button
                onClick={() => setShowTypePicker(!showTypePicker)}
                className="flex items-center gap-2 text-sm border border-slate-200 rounded-xl px-3 py-2 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
              >
                <Layers size={14} className="text-blue-500" />
                <span className="text-slate-700 font-medium">{QUESTION_TYPES.find(t => t.id === question.type)?.label}</span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>
              {showTypePicker && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 w-72 p-1.5">
                  {QUESTION_TYPES.map(t => {
                    const Icon = t.icon
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          onChange(makeQuestion(t.id))
                          setShowTypePicker(false)
                        }}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-blue-50 transition-colors ${question.type === t.id ? 'bg-blue-50' : ''}`}
                      >
                        <Icon size={15} className="text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-slate-800 text-sm font-medium">{t.label}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{t.desc}</p>
                        </div>
                        {question.type === t.id && <Check size={14} className="text-blue-500 ml-auto mt-0.5" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* CEFR level */}
            <select
              value={question.level}
              onChange={e => updateField('level', e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-700"
            >
              {CEFR_LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>

            {/* Points */}
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
              <Award size={13} className="text-amber-500" />
              <span className="text-slate-500 text-sm">Points:</span>
              <input
                type="number"
                min={1}
                max={10}
                value={question.points}
                onChange={e => updateField('points', +e.target.value)}
                className="w-10 text-sm font-semibold text-slate-800 focus:outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Question text */}
          <div>
            <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
              Question Text
            </label>
            <textarea
              value={question.text}
              onChange={e => updateField('text', e.target.value)}
              placeholder={
                question.type === 'fill_blank'
                  ? 'Use ___ to mark the blank. E.g. Ich ___ jeden Tag Deutsch.'
                  : question.type === 'audio'
                  ? 'Write the question students will answer after listening...'
                  : 'Write your question here...'
              }
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            {question.type === 'fill_blank' && (
              <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
                <Info size={11} />
                Use ___ (three underscores) to mark where the blank goes
              </p>
            )}
          </div>

          {/* Audio upload */}
          {question.type === 'audio' && (
            <div className="border-2 border-dashed border-blue-200 rounded-xl p-5 text-center bg-blue-50/40">
              <Volume2 size={24} className="text-blue-400 mx-auto mb-2" />
              <p className="text-slate-600 text-sm font-medium mb-1">Upload Audio File</p>
              <p className="text-slate-400 text-xs mb-3">MP3 or WAV · Max 10MB</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg transition-colors font-medium">
                Choose File
              </button>
            </div>
          )}

          {/* Multiple Choice options */}
          {question.type === 'multiple_choice' && (
            <div>
              <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
                Answer Options <span className="text-slate-400 normal-case font-normal">(click circle to mark correct)</span>
              </label>
              <div className="space-y-2">
                {question.options.map((opt, oi) => (
                  <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${opt.correct ? 'border-green-300 bg-green-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
                    <button onClick={() => setCorrect(opt.id)} className="shrink-0">
                      {opt.correct
                        ? <CheckCircle size={20} className="text-green-500" />
                        : <Circle size={20} className="text-slate-300 hover:text-slate-400 transition-colors" />
                      }
                    </button>
                    <span className="shrink-0 w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <input
                      value={opt.text}
                      onChange={e => updateOption(opt.id, 'text', e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                      className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                    {opt.correct && (
                      <span className="text-xs text-green-600 font-semibold shrink-0">Correct</span>
                    )}
                    <button onClick={() => removeOption(opt.id)} className="shrink-0 text-slate-300 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              {question.options.length < 6 && (
                <button
                  onClick={addOption}
                  className="mt-2 flex items-center gap-2 text-blue-600 text-sm hover:text-blue-700 transition-colors font-medium"
                >
                  <Plus size={14} />
                  Add Option
                </button>
              )}
            </div>
          )}

          {/* True / False */}
          {question.type === 'true_false' && (
            <div>
              <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
                Correct Answer
              </label>
              <div className="flex gap-3">
                {question.options.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setCorrect(opt.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                      opt.correct
                        ? opt.text === 'True'
                          ? 'border-green-400 bg-green-50 text-green-700'
                          : 'border-red-400 bg-red-50 text-red-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {opt.correct
                      ? opt.text === 'True' ? <Check size={15} /> : <X size={15} />
                      : <Circle size={15} />
                    }
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fill in blank / Short answer */}
          {(question.type === 'fill_blank' || question.type === 'short_answer') && (
            <div>
              <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
                {question.type === 'fill_blank' ? 'Correct Answer(s)' : 'Model Answer (for reference)'}
              </label>
              <input
                value={question.correctAnswer}
                onChange={e => updateField('correctAnswer', e.target.value)}
                placeholder={
                  question.type === 'fill_blank'
                    ? 'e.g. lerne (separate multiple with commas)'
                    : 'Write the ideal answer for your reference when grading...'
                }
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {question.type === 'fill_blank' && (
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <Info size={11} />
                  Separate accepted answers with commas — all will be marked correct
                </p>
              )}
              {question.type === 'short_answer' && (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={11} />
                  Short answer questions require manual grading
                </p>
              )}
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
              Explanation <span className="text-slate-400 normal-case font-normal">(shown to student after answering)</span>
            </label>
            <textarea
              value={question.explanation}
              onChange={e => updateField('explanation', e.target.value)}
              placeholder="Explain why the correct answer is right. This helps students learn from mistakes..."
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TestBuilder() {
  const [testMeta, setTestMeta] = useState({
    title:        '',
    description:  '',
    course:       'German B1 — Goethe Prep',
    module:       '',
    level:        'B1',
    timeLimit:    30,
    passingScore: 70,
    maxAttempts:  2,
    shuffleQ:     false,
    shuffleA:     false,
    showAnswers:  true,
  })

  const [questions, setQuestions] = useState([makeQuestion('multiple_choice')])
  const [activePanel, setActivePanel] = useState('questions') // questions | settings | preview
  const [saved, setSaved] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
  const autoGraded  = questions.filter(q => q.type !== 'short_answer').length
  const manualGraded = questions.filter(q => q.type === 'short_answer').length

  const addQuestion = (type) => {
    setQuestions(prev => [...prev, makeQuestion(type)])
    setShowAddMenu(false)
  }

  const updateQuestion = (index, updated) => {
    setQuestions(prev => prev.map((q, i) => i === index ? updated : q))
  }

  const deleteQuestion = (index) => {
    if (questions.length === 1) return
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const moveQuestion = (index, dir) => {
    const next = index + dir
    if (next < 0 || next >= questions.length) return
    setQuestions(prev => {
      const arr = [...prev]
      ;[arr[index], arr[next]] = [arr[next], arr[index]]
      return arr
    })
  }

  const duplicateQuestion = (index) => {
    const copy = { ...questions[index], id: Date.now() + Math.random() }
    setQuestions(prev => [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)])
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const updateMeta = (field, value) => setTestMeta(prev => ({ ...prev, [field]: value }))

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/instructor/dashboard"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <div className="w-px h-5 bg-slate-200" />
          <div>
            <h1 className="text-slate-800 font-semibold text-base leading-tight">
              {testMeta.title || 'Untitled Test'}
            </h1>
            <p className="text-slate-400 text-xs">{testMeta.course} · {testMeta.level}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats pills */}
          <div className="flex items-center gap-2 mr-2">
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <HelpCircle size={12} />
              {questions.length} questions
            </span>
            <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Award size={12} />
              {totalPoints} points total
            </span>
            <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Clock size={12} />
              {testMeta.timeLimit} min
            </span>
          </div>

          <button
            onClick={() => setActivePanel('preview')}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            <Eye size={15} />
            Preview
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Test</>}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">

        {/* ── Left: Questions ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Panel tabs */}
          <div className="flex gap-1 bg-white border border-slate-100 p-1 rounded-xl w-fit shadow-sm">
            {[
              { id: 'questions', label: 'Questions', icon: HelpCircle },
              { id: 'settings', label: 'Test Settings', icon: Settings },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActivePanel(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${activePanel === id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Questions panel */}
          {activePanel === 'questions' && (
            <>
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={i}
                    total={questions.length}
                    onChange={(updated) => updateQuestion(i, updated)}
                    onDelete={deleteQuestion}
                    onMove={moveQuestion}
                    onDuplicate={duplicateQuestion}
                  />
                ))}
              </div>

              {/* Add question button */}
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30 transition-all font-medium text-sm"
                >
                  <Plus size={18} />
                  Add Question
                </button>

                {showAddMenu && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 p-2">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider px-3 py-2">Choose Question Type</p>
                    <div className="grid grid-cols-2 gap-1">
                      {QUESTION_TYPES.map(t => {
                        const Icon = t.icon
                        return (
                          <button
                            key={t.id}
                            onClick={() => addQuestion(t.id)}
                            className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-blue-50 text-left transition-colors"
                          >
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                              <Icon size={15} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-slate-800 text-sm font-medium">{t.label}</p>
                              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{t.desc}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Settings panel */}
          {activePanel === 'settings' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              <h2 className="font-semibold text-slate-800">Test Settings</h2>

              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Test Title</label>
                  <input
                    value={testMeta.title}
                    onChange={e => updateMeta('title', e.target.value)}
                    placeholder="e.g. B1 Module 3 Grammar Test"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={testMeta.description}
                    onChange={e => updateMeta('description', e.target.value)}
                    placeholder="Brief description shown to students before they start..."
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">CEFR Level</label>
                  <select
                    value={testMeta.level}
                    onChange={e => updateMeta('level', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    {CEFR_LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={testMeta.timeLimit}
                    onChange={e => updateMeta('timeLimit', +e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={testMeta.passingScore}
                    onChange={e => updateMeta('passingScore', +e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
                    Max Attempts Allowed
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={testMeta.maxAttempts}
                    onChange={e => updateMeta('maxAttempts', +e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h3 className="text-slate-700 font-medium text-sm">Behaviour Options</h3>
                {[
                  { field: 'shuffleQ',   label: 'Shuffle question order',       desc: 'Questions appear in random order for each student' },
                  { field: 'shuffleA',   label: 'Shuffle answer options',        desc: 'Multiple choice options are randomised'            },
                  { field: 'showAnswers',label: 'Show correct answers after',    desc: 'Student sees correct answers and explanations when done' },
                ].map(({ field, label, desc }) => (
                  <div key={field} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-slate-800 text-sm font-medium">{label}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => updateMeta(field, !testMeta[field])}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ml-4 ${testMeta[field] ? 'bg-blue-500' : 'bg-slate-200'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${testMeta[field] ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview panel */}
          {activePanel === 'preview' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-[#0F1B35] px-6 py-5">
                <p className="text-blue-300 text-xs font-medium mb-1 flex items-center gap-1.5">
                  <Eye size={12} />
                  Student Preview
                </p>
                <h2 className="text-white font-semibold text-lg">{testMeta.title || 'Untitled Test'}</h2>
                <div className="flex items-center gap-4 mt-2 text-slate-400 text-xs">
                  <span className="flex items-center gap-1"><HelpCircle size={11} />{questions.length} questions</span>
                  <span className="flex items-center gap-1"><Clock size={11} />{testMeta.timeLimit} min</span>
                  <span className="flex items-center gap-1"><Award size={11} />{totalPoints} points</span>
                  <span className="flex items-center gap-1"><CheckCircle size={11} />Pass at {testMeta.passingScore}%</span>
                </div>
              </div>
              <div className="p-6 space-y-5">
                {questions.map((q, i) => (
                  <div key={q.id} className="border border-slate-100 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center justify-center shrink-0">{i + 1}</span>
                        <TypeBadge type={q.type} />
                      </div>
                      <span className="text-xs text-slate-400">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-slate-800 text-sm font-medium mb-4">{q.text || <span className="text-slate-400 italic">No question text yet</span>}</p>

                    {q.type === 'multiple_choice' && (
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <div key={opt.id} className="flex items-center gap-3 border border-slate-100 rounded-xl px-4 py-2.5 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all">
                            <Circle size={16} className="text-slate-300 shrink-0" />
                            <span className="text-xs font-bold text-slate-400 w-4">{String.fromCharCode(65 + oi)}</span>
                            <span className="text-sm text-slate-700">{opt.text || `Option ${String.fromCharCode(65 + oi)}`}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <div className="flex gap-3">
                        <div className="flex-1 flex items-center justify-center gap-2 border border-slate-100 rounded-xl py-3 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all">
                          <Check size={15} className="text-slate-400" />
                          <span className="text-sm text-slate-700">True</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-2 border border-slate-100 rounded-xl py-3 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all">
                          <X size={15} className="text-slate-400" />
                          <span className="text-sm text-slate-700">False</span>
                        </div>
                      </div>
                    )}

                    {(q.type === 'fill_blank' || q.type === 'short_answer' || q.type === 'audio') && (
                      <input
                        placeholder={q.type === 'short_answer' ? 'Student writes answer here...' : 'Type your answer...'}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-400 bg-slate-50"
                        readOnly
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Summary sidebar ── */}
        <div className="w-72 shrink-0 space-y-4">

          {/* Test summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sticky top-24">
            <h3 className="font-semibold text-slate-800 text-sm mb-4">Test Summary</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Questions', value: questions.length,           icon: HelpCircle, color: 'text-blue-500'   },
                { label: 'Total Points',    value: totalPoints,                icon: Award,      color: 'text-amber-500'  },
                { label: 'Time Limit',      value: `${testMeta.timeLimit} min`,icon: Clock,      color: 'text-slate-500'  },
                { label: 'Passing Score',   value: `${testMeta.passingScore}%`,icon: CheckCircle,color: 'text-green-500'  },
                { label: 'Max Attempts',    value: testMeta.maxAttempts,       icon: PenTool,    color: 'text-purple-500' },
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

            {/* Question type breakdown */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">By Type</p>
              <div className="space-y-2">
                {QUESTION_TYPES.map(t => {
                  const count = questions.filter(q => q.type === t.id).length
                  if (count === 0) return null
                  const Icon = t.icon
                  return (
                    <div key={t.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-600">{t.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {manualGraded > 0 && (
              <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-amber-700 text-xs font-medium flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  {manualGraded} question{manualGraded > 1 ? 's' : ''} require manual grading
                </p>
              </div>
            )}

            <button
              onClick={handleSave}
              className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
                saved ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Test</>}
            </button>

            <button className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              <BookOpen size={14} />
              Assign to Module
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}