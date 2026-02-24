import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ArrowRight, BookOpen, Award, Globe, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authAPI } from '../../services/api'
import { saveTokens } from '../../services/auth'

const ROLE_HOME = {
  student:    '/student/dashboard',
  instructor: '/instructor/dashboard',
  admin:      '/admin/dashboard',
}

export default function Login() {
  const navigate = useNavigate()
  const login    = useAuthStore((s) => s.login)

  const [form,         setForm]         = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await authAPI.login({
        email:    form.email,
        password: form.password,
      })

      // Persist JWT tokens in localStorage
      saveTokens(data.tokens.access, data.tokens.refresh)

      // Save user to global auth store
      login({
        email: data.user.email,
        name:  `${data.user.first_name} ${data.user.last_name}`.trim(),
        role:  data.user.role,
        level: data.user.current_level ?? null,
      })

      // Redirect to the correct dashboard based on role
      navigate(ROLE_HOME[data.user.role] ?? '/student/dashboard')

    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Invalid email or password. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Left branding panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0F1B35] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">DE</span>
          </div>
          <span className="text-white font-semibold text-lg">DeutschPro</span>
        </div>

        <div>
          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            Pass Your German Exam.<br />
            <span className="text-blue-400">Relocate with Confidence.</span>
          </h2>
          <p className="text-slate-400 text-base mb-8">
            A1 to C2 — structured for working professionals
            sitting Goethe, TELC, and TestDaF.
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { icon: BookOpen, label: 'A1–C2 CEFR Aligned'     },
              { icon: Award,    label: 'Goethe · TELC · TestDaF' },
              { icon: Globe,    label: '4,800+ Professionals'    },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white/10 text-slate-300 text-sm px-3 py-2 rounded-lg">
                <Icon size={14} className="text-blue-400" />
                {label}
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-sm">© 2026 DeutschPro. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <h1 className="text-slate-800 text-2xl font-bold mb-1">Welcome back</h1>
            <p className="text-slate-500">Sign in to continue your German journey</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-red-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-700 text-sm font-medium">Password</label>
                <button type="button" className="text-blue-600 text-xs hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <> Sign In <ArrowRight size={16} /> </>
              }
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-slate-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Sign up free
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}