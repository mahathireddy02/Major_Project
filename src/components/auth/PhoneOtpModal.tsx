import React, { useState, useEffect } from 'react'
import { Phone, KeyRound, ArrowRight, RotateCw, CheckCircle2, Shield, X, AlertCircle } from 'lucide-react'
import { api } from '../../services/api'
import { useAppStore } from '../../store/appStore'
import toast from 'react-hot-toast'

interface PhoneOtpModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: any) => void
  role: 'student' | 'faculty' | 'driver'
  initialPhone?: string
}

export const PhoneOtpModal: React.FC<PhoneOtpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  role,
  initialPhone = '',
}) => {
  const login = useAppStore((s) => s.login)
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE')
  const [phone, setPhone] = useState(initialPhone)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null)

  useEffect(() => {
    if (initialPhone) setPhone(initialPhone)
  }, [initialPhone])

  useEffect(() => {
    let timer: any
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [resendCooldown])

  if (!isOpen) return null

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanPhone = phone.trim()
    if (!cleanPhone) {
      toast.error('Please enter your mobile phone number.')
      return
    }

    setLoading(true)
    setDevOtpHint(null)
    try {
      const res = await api.sendOtp(cleanPhone)
      toast.success(res.message || 'OTP sent successfully to your phone!', { icon: '📱' })
      if (res.data?.devOtp) {
        setDevOtpHint(res.data.devOtp)
      }
      setStep('OTP')
      setResendCooldown(45)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP. Please check the phone number.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanOtp = otp.trim()
    if (!cleanOtp) {
      toast.error('Please enter the 6-digit OTP code.')
      return
    }

    setLoading(true)
    try {
      // Direct login with verified OTP
      const res = await login({
        phone: phone.trim(),
        otp: cleanOtp,
        role,
      })

      toast.success(`Verified successfully! Welcome, ${res.user?.name || 'User'}.`, { icon: '🎉' })
      onSuccess(res.user)
      onClose()
    } catch (err: any) {
      toast.error(err?.message || 'Invalid or expired OTP code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-primary-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-white">Twilio OTP Verification</h3>
              <p className="text-xs text-blue-100 capitalize">{role} Instant Phone Sign-In</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {step === 'PHONE' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Accepts 10-digit Indian numbers (e.g. 9876543210) or international format with country code (+91).
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'SENDING OTP...' : 'REQUEST SECURE OTP'}
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Enter Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep('PHONE')}
                    className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Change Phone
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit OTP code"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm tracking-widest font-mono text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  SMS sent to <span className="font-semibold text-slate-700">{phone}</span>. (Master test code:{' '}
                  <span className="font-mono font-bold text-blue-600">2026</span>)
                </p>
              </div>

              {devOtpHint && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-amber-600" />
                  <span>
                    Dev / Local Simulation Code: <strong className="font-mono font-bold">{devOtpHint}</strong>
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !otp.trim()}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                {loading ? 'VERIFYING CODE...' : 'VERIFY & SIGN IN'}
              </button>

              <div className="flex items-center justify-center pt-2">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={() => handleSendOtp()}
                  className="text-xs font-semibold text-slate-500 hover:text-blue-600 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
                  <span>
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP via SMS'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}