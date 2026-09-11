import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navigation, Shield, Lock, Mail, ArrowLeft, ArrowRight, Eye, EyeOff, AlertCircle, Zap } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'

export default function DispatcherAuth() {
  const navigate = useNavigate()
  const login = useAppStore((s) => s.login)

  const [username, setUsername] = useState('dispatcher@campusflow.io')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      toast.error('Please enter dispatcher username and password.')
      return
    }

    setLoading(true)
    try {
      await login({
        username,
        email: username,
        password,
        role: 'dispatcher',
      })
      toast.success('Access granted to Dispatch Command Center.')
      navigate('/admin/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Invalid dispatcher credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemoAdmin = async () => {
    setLoading(true)
    try {
      await login({
        username: 'dispatcher@campusflow.io',
        password: 'CampusFlowAdmin2026!',
        role: 'dispatcher',
      })
      toast.success('Authenticated as Campus Dispatcher (Demo)')
      navigate('/admin/dashboard')
    } catch {
      toast.error('Dispatcher login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-primary-500 selection:text-white">
      {/* Top Bar */}
      <header className="px-6 py-4 bg-white border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            title="CampusFlow Home"
            className="flex items-center gap-2.5 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-sm">
              <Navigation size={18} />
            </div>
            <span className="font-heading font-bold text-slate-900 text-base">
              Campus<span className="text-primary-600">Flow</span>
            </span>
          </button>

          <button
            onClick={() => navigate('/auth/portal')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Change Portal
          </button>
        </div>
      </header>

      {/* Main Card */}
      <main className="max-w-md mx-auto w-full px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider block">
                Administrative Access
              </span>
              <h1 className="font-heading font-bold text-xl text-slate-900">
                Dispatcher Sign In
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Central Fleet Telematics & Operations</p>
            </div>

            <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-200 text-primary-600 flex items-center justify-center shadow-xs">
              <Shield size={20} />
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl mb-5 text-xs text-blue-900 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-primary-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Dispatcher is a restricted operational role with full network dispatch authority. Public registration is disabled.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispatcher Username / Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="dispatcher@campusflow.io"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="primary"
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm shadow-md mt-2 cursor-pointer flex items-center justify-center gap-2"
              loading={loading}
            >
              Authenticate & Open Command Center
              <ArrowRight size={16} />
            </Button>

            {/* Quick Demo Dispatcher Login */}
            <div className="pt-4 mt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={handleQuickDemoAdmin}
                disabled={loading}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-primary-50/60 border border-slate-200 hover:border-primary-300 text-xs font-bold text-primary-700 hover:text-primary-800 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
              >
                <Zap size={14} className="text-amber-500 fill-amber-400" />
                Quick Demo Dispatcher Sign In (Judges 1-Click)
              </button>
            </div>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Lock size={12} />
              <span>256-bit TLS Encrypted Administrative Clearance</span>
            </div>
          </form>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white">
        CampusFlow Mobility Control • Restricted Administrative Portal
      </footer>
    </div>
  )
}
