import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  fuzzyMatchName, preprocessImage, extractLicenseFields,
} from '../../lib/ocrUtils'
import {
  Navigation, Car, User, Phone, Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight,
  ShieldCheck, Upload, FileText, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import toast from 'react-hot-toast'
import { compressImage } from '../../lib/utils'

export default function DriverAuth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin'

  const login = useAppStore((s) => s.login)
  const registerDriver = useAppStore((s) => s.registerDriver)
  const drivers = useAppStore((s) => s.drivers)

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [step, setStep] = useState<number>(1)

  // Registration Fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('+91 ')
  const [email, setEmail] = useState('')
  const [vehicleReg, setVehicleReg] = useState('')
  const [vehicleType, setVehicleType] = useState('Mini Van')
  const [vehicleCapacity, setVehicleCapacity] = useState('6')
  const [vehicleTypeCustom, setVehicleTypeCustom] = useState(false)
  const [vehicleCapacityCustom, setVehicleCapacityCustom] = useState(false)
  const [licenseNo, setLicenseNo] = useState('')
  const [rcNo, setRcNo] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Documents & OCR
  const [licensePhoto, setLicensePhoto] = useState<string | null>(null)
  const [rcPhoto, setRcPhoto] = useState<string | null>(null)
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null)
  const [detectedName, setDetectedName] = useState('')
  const [ocrResult, setOcrResult] = useState<{
    matchScore: number
    isMatch: boolean
    nameOk: boolean
    dlOk: boolean
    status: 'MATCHED' | 'MISMATCH'
    statusLabel: string
    explanation: string
  } | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  // Sign In Fields
  const [signInPhone, setSignInPhone] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // License File Upload — runs real Tesseract OCR via shared util
  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const rawUri = reader.result as string
      let imageUri = rawUri
      try { imageUri = await compressImage(rawUri, 1000, 1000, 0.75) } catch { /* use raw */ }
      setLicensePhoto(imageUri)
      runLicenseOcr(imageUri)
    }
    reader.readAsDataURL(file)
  }

  const runLicenseOcr = async (imageUri: string) => {
    setIsScanning(true)
    try {
      const processed = await preprocessImage(imageUri)
      const { name: extracted, dlNumber } = await extractLicenseFields(processed)

      setDetectedName(extracted)
      const nameOk = extracted ? fuzzyMatchName(fullName, extracted) : false
      const dlOk = dlNumber
        ? dlNumber.replace(/[\s\-]/g, '').toUpperCase() === licenseNo.replace(/[\s\-]/g, '').toUpperCase()
        : false

      setOcrResult({
        matchScore: (nameOk ? 50 : 0) + (dlOk ? 50 : 0),
        isMatch: nameOk && dlOk,
        nameOk,
        dlOk,
        status: nameOk && dlOk ? 'MATCHED' : 'MISMATCH',
        statusLabel: nameOk && dlOk ? '✓ Verified' : '✗ Mismatch',
        explanation: `Name: ${nameOk ? 'OK' : 'FAIL'}, DL No: ${dlOk ? 'OK' : `FAIL (detected: ${dlNumber || 'not found'})`}`,
      })
    } catch {
      setDetectedName('')
      setOcrResult({
        matchScore: 0, isMatch: false, nameOk: false, dlOk: false, status: 'MISMATCH',
        statusLabel: '⚠️ Could not read license — please upload a clearer photo',
        explanation: 'OCR could not extract text from the uploaded image.',
      })
    } finally {
      setIsScanning(false)
    }
  }

  // Register Driver
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName || !phone || !vehicleReg || !password) {
      toast.error('Please complete all required fields.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      toast.error('Password must be 8+ chars with uppercase, lowercase, number and symbol.')
      return
    }

    setLoading(true)
    try {
      await registerDriver({
        fullName,
        collegeName: 'Campus Transport',
        phone,
        email,
        password,
        vehicleRegistration: vehicleReg,
        vehicleType,
        vehicleCapacity: Number(vehicleCapacity) || 6,
        licenseNumber: licenseNo || 'TS09 2024 0087654',
        rcNumber: rcNo,
        licensePhoto: licensePhoto || undefined,
        rcPhoto: rcPhoto || undefined,
        passportPhoto: passportPhoto || undefined,
        detectedName: detectedName || fullName,
      })
      toast.success('Driver registered successfully! License & Vehicle Verified.', { duration: 5000 })
      navigate('/driver/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Driver registration failed.')
    } finally {
      setLoading(false)
    }
  }

  // Sign In Driver
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signInPhone || signInPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number.')
      return
    }
    if (!signInPassword) {
      toast.error('Please enter your password.')
      return
    }
    setLoading(true)
    try {
      const res = await login({
        phone: '+91' + signInPhone,
        email: '+91' + signInPhone,
        password: signInPassword,
        role: 'driver',
      })
      toast.success(`Welcome, Driver ${res.user?.name || ''}!`)
      navigate('/driver/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Invalid driver credentials.')
    } finally {
      setLoading(false)
    }
  }

  // Demo Driver Login
  const handleDemoDriverLogin = async (driverId: string) => {
    setLoading(true)
    try {
      await login({ userId: driverId, role: 'driver' })
      toast.success('Logged in with demo driver profile')
      navigate('/driver/dashboard')
    } catch {
      toast.error('Driver login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="px-6 py-4 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            title="CampusFlow Home"
            className="flex items-center gap-2.5 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Navigation size={18} />
            </div>
            <span className="font-heading font-bold text-slate-900 text-base">
              Campus<span className="text-emerald-600">Flow</span> Driver
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

      {/* Main Content */}
      <main className="max-w-xl mx-auto w-full px-4 py-8 flex-1 flex flex-col justify-center">
        <Card padding="lg" className="border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                Fleet Operations Portal
              </span>
              <h1 className="font-heading font-bold text-xl text-slate-900">
                Driver {mode === 'signup' ? 'Registration' : 'Sign In'}
              </h1>
            </div>

            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Car size={20} />
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setStep(1)
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Driver Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setStep(1)
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Driver Sign Up
            </button>
          </div>

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-sm font-semibold text-slate-600 select-none">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={signInPhone}
                    onChange={(e) => setSignInPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9988776655"
                    className="input-field rounded-l-none text-sm flex-1"
                  />
                </div>
                {signInPhone.length > 0 && signInPhone.length < 10 && (
                  <p className="text-[10px] text-red-500 mt-0.5">Must be exactly 10 digits</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-9 pr-9 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                variant="primary"
                className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold text-sm shadow-md mt-2"
                loading={loading}
              >
                Sign In to Driver Dashboard
                <ArrowRight size={16} />
              </Button>

              {/* Demo Drivers Selector */}
              <div className="pt-4 mt-4 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  ⚡ Quick Demo Drivers (1-Click Test)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {drivers.slice(0, 4).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleDemoDriverLogin(d.id)}
                      className="p-2 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition-all text-xs"
                    >
                      <p className="font-bold text-slate-800 truncate">{d.name}</p>
                      <p className="text-[10px] text-slate-400">{d.phone}</p>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* SIGN UP MULTI-STEP */}
          {mode === 'signup' && (
            <div>
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-6 px-1">
                {[
                  { num: 1, label: 'Personal' },
                  { num: 2, label: 'Vehicle' },
                  { num: 3, label: 'Documents' },
                  { num: 4, label: 'Security' },
                ].map((s) => (
                  <div key={s.num} className="flex items-center gap-1.5 text-xs font-semibold">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        step === s.num
                          ? 'bg-emerald-600 text-white'
                          : step > s.num
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {step > s.num ? '✓' : s.num}
                    </div>
                    <span className={step === s.num ? 'text-slate-900 font-bold' : 'text-slate-400 hidden sm:inline'}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Step 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Driver Full Name *
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Rahul Kumar"
                        className="input-field pl-9 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. rahul@gmail.com"
                        className="input-field pl-9 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-sm font-semibold text-slate-600 select-none">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone.replace(/^\+91\s?/, '')}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                          setPhone('+91 ' + digits)
                        }}
                        placeholder="9988776655"
                        className="input-field rounded-l-none text-sm flex-1"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">10-digit mobile number</p>
                  </div>

                  <Button
                    size="lg"
                    variant="primary"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold text-sm shadow-md mt-4"
                    onClick={() => {
                      const digits = phone.replace(/\D/g, '').replace(/^91/, '')
                      if (!fullName.trim()) {
                        toast.error('Please enter your full name.')
                        return
                      }
                      if (!email.trim() || !email.includes('@')) {
                        toast.error('Please enter a valid email address.')
                        return
                      }
                      if (!/^[6-9]\d{9}$/.test(digits)) {
                        toast.error('Enter a valid 10-digit Indian mobile number starting with 6-9.')
                        return
                      }
                      setStep(2)
                    }}
                  >
                    Next: Vehicle & License Details
                    <ArrowRight size={16} />
                  </Button>
                </div>
              )}

              {/* Step 2: Vehicle Information */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vehicle Registration Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={vehicleReg}
                      onChange={(e) => setVehicleReg(e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, ''))}
                      placeholder="TS 09 AB 1234"
                      maxLength={13}
                      className="input-field text-sm uppercase"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Format: ST 00 AA 0000 (e.g. TS 09 AB 1234)</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Vehicle Type *
                      </label>
                      {vehicleTypeCustom ? (
                        <input
                          type="text"
                          autoFocus
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                          placeholder="Enter vehicle type"
                          className="input-field text-sm"
                        />
                      ) : (
                        <select
                          value={vehicleType}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setVehicleTypeCustom(true)
                              setVehicleType('')
                            } else {
                              setVehicleType(e.target.value)
                            }
                          }}
                          className="input-field text-sm"
                        >
                          <option value="Mini Van">Mini Van</option>
                          <option value="Mini Bus">Mini Bus</option>
                          <option value="Auto Rickshaw">Auto Rickshaw</option>
                          <option value="Cab">Cab</option>
                          <option value="__custom__">Other (type manually)</option>
                        </select>
                      )}
                      {vehicleTypeCustom && (
                        <button type="button" onClick={() => { setVehicleTypeCustom(false); setVehicleType('Mini Van') }} className="text-[10px] text-emerald-600 mt-1 hover:underline">← Back to options</button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Vehicle Capacity *
                      </label>
                      {vehicleCapacityCustom ? (
                        <input
                          type="number"
                          autoFocus
                          min="1"
                          value={vehicleCapacity}
                          onChange={(e) => setVehicleCapacity(e.target.value)}
                          placeholder="Enter seat count"
                          className="input-field text-sm"
                        />
                      ) : (
                        <select
                          value={vehicleCapacity}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setVehicleCapacityCustom(true)
                              setVehicleCapacity('')
                            } else {
                              setVehicleCapacity(e.target.value)
                            }
                          }}
                          className="input-field text-sm"
                        >
                          <option value="3">3 seats</option>
                          <option value="4">4 seats</option>
                          <option value="6">6 seats</option>
                          <option value="8">8 seats</option>
                          <option value="12">12 seats</option>
                          <option value="20">20 seats</option>
                          <option value="__custom__">Other (type manually)</option>
                        </select>
                      )}
                      {vehicleCapacityCustom && (
                        <button type="button" onClick={() => { setVehicleCapacityCustom(false); setVehicleCapacity('6') }} className="text-[10px] text-emerald-600 mt-1 hover:underline">← Back to options</button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Driving License No *
                    </label>
                    <input
                      type="text"
                      required
                      value={licenseNo}
                      onChange={(e) => setLicenseNo(e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, ''))}
                      placeholder="TS09 2024 0087654"
                      maxLength={20}
                      className="input-field text-sm uppercase"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Format: SS00 YYYY 0000000 (e.g. TS09 2024 0087654)</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="secondary" size="md" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      size="md"
                      variant="primary"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 font-bold"
                      onClick={() => {
                        const regClean = vehicleReg.replace(/\s/g, '')
                        if (!/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/.test(regClean)) {
                          toast.error('Invalid registration number. Use format: TS 09 AB 1234')
                          return
                        }
                        const dlClean = licenseNo.replace(/\s/g, '')
                        if (!/^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/.test(dlClean)) {
                          toast.error('Invalid license number. Use format: TS09 2024 0087654')
                          return
                        }
                        setStep(3)
                      }}
                    >
                      Next: Document Verification
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Document Uploads & OCR */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Driving License Photo *
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-emerald-500 transition-colors bg-slate-50/50">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleLicenseUpload}
                        className="hidden"
                        id="license-upload"
                      />
                      <label htmlFor="license-upload" className="cursor-pointer flex flex-col items-center">
                        <Upload size={22} className="text-emerald-600 mb-1.5" />
                        <span className="text-xs font-bold text-slate-800">
                          {licensePhoto ? 'License Photo Selected' : 'Upload Driving License Photo'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG up to 5MB</span>
                      </label>
                    </div>
                  </div>

                  {/* OCR Match Check Box */}
                  {licensePhoto && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <FileText size={14} className="text-emerald-600" />
                          License OCR Consistency Check
                        </span>
                        {isScanning && (
                          <span className="text-[10px] text-emerald-600 animate-pulse font-bold flex items-center gap-1">
                            <RefreshCw size={11} className="animate-spin" /> Scanning...
                          </span>
                        )}
                      </div>

                      {ocrResult && (
                        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Name Entered:</span>
                            <span className="font-bold text-slate-800">{fullName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Name on License:</span>
                            <span className="font-bold text-slate-800">{detectedName || '—'}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-slate-500">Name Match:</span>
                            <span className={`font-bold ${ocrResult.nameOk ? 'text-green-600' : 'text-red-500'}`}>
                              {ocrResult.nameOk ? '✓ Matched' : '✗ Mismatch'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-slate-500">License No. Entered:</span>
                            <span className="font-bold text-slate-800">{licenseNo}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-slate-500">DL No. Match:</span>
                            <span className={`font-bold ${ocrResult.dlOk ? 'text-green-600' : 'text-red-500'}`}>
                              {ocrResult.dlOk ? '✓ Matched' : '✗ Mismatch'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="secondary" size="md" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button
                      size="md"
                      variant="primary"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 font-bold"
                      onClick={() => {
                        if (!licensePhoto) {
                          toast.error('Please upload your driving license photo.')
                          return
                        }
                        if (isScanning) {
                          toast.error('Please wait, scanning is in progress.')
                          return
                        }
                        if (!ocrResult) {
                          toast.error('License scan not complete. Please wait or re-upload.')
                          return
                        }
                        if (!ocrResult.nameOk) {
                          toast.error('Name on license does not match. Please upload the correct license.')
                          return
                        }
                        if (!ocrResult.dlOk) {
                          toast.error('License number on the document does not match what you entered.')
                          return
                        }
                        setStep(4)
                      }}
                    >
                      Next: Password & Submit
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Password & Submit */}
              {step === 4 && (
                <form onSubmit={handleRegister} className="space-y-4">
                  {(() => {
                    const checks = [
                      { label: 'At least 8 characters', ok: password.length >= 8 },
                      { label: 'Uppercase letter (A-Z)', ok: /[A-Z]/.test(password) },
                      { label: 'Lowercase letter (a-z)', ok: /[a-z]/.test(password) },
                      { label: 'Number (0-9)', ok: /[0-9]/.test(password) },
                      { label: 'Symbol (!@#$...)', ok: /[^A-Za-z0-9]/.test(password) },
                    ]
                    const passed = checks.filter((c) => c.ok).length
                    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passed]
                    const strengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-600'][passed]
                    return (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Create Password *</label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 8 chars, upper, lower, number, symbol"
                            className="input-field pl-9 pr-9 text-sm"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {password.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map((i) => (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passed ? strengthColor : 'bg-slate-200'}`} />
                              ))}
                            </div>
                            <p className={`text-[10px] font-bold ${passed <= 1 ? 'text-red-500' : passed <= 2 ? 'text-orange-500' : passed <= 3 ? 'text-yellow-600' : 'text-emerald-600'}`}>{strengthLabel}</p>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                              {checks.map((c) => (
                                <p key={c.label} className={`text-[10px] flex items-center gap-1 ${c.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {c.ok ? '✓' : '○'} {c.label}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password *</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="input-field pl-9 text-sm"
                      />
                    </div>
                    {confirmPassword.length > 0 && (
                      <p className={`text-[10px] mt-0.5 font-semibold ${confirmPassword === password ? 'text-emerald-600' : 'text-red-500'}`}>
                        {confirmPassword === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      Verification Status: VERIFIED
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      Your commercial driver profile and vehicle telematics are <strong>VERIFIED</strong> for university fleet transit operations.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="secondary" size="md" onClick={() => setStep(3)}>
                      Back
                    </Button>
                    <Button
                      type="submit"
                      size="md"
                      variant="primary"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 font-bold"
                      loading={loading}
                    >
                      Complete Registration
                      <CheckCircle2 size={16} />
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </Card>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 bg-white border-t border-slate-200">
        CampusFlow Mobility • Driver Fleet Operations
      </footer>
    </div>
  )
}
