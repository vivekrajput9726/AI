import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Heart, Eye, EyeOff, Mail, Lock, User, Phone, Stethoscope, ShieldCheck, RefreshCw } from 'lucide-react'
import { loginUser, logout } from '../redux/slices/authSlice'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Register() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { user }  = useSelector(s => s.auth)

  // ── All hooks declared first (React rules) ───────────────────────
  const [step,             setStep]             = useState(1)
  const [loading,          setLoading]          = useState(false)
  const [form,             setForm]             = useState({ full_name: '', email: '', password: '', phone: '', role: 'patient' })
  const [showPassword,     setShowPassword]     = useState(false)
  const [confirmPassword,  setConfirmPassword]  = useState('')
  const [error,            setError]            = useState('')
  const [alreadyRegistered,setAlreadyRegistered]= useState(false)
  const [otp,              setOtp]              = useState(['', '', '', '', '', ''])
  const [demoOtp,          setDemoOtp]          = useState(null)
  const [otpChannel,       setOtpChannel]       = useState(null)
  const [phoneHint,        setPhoneHint]        = useState(null)
  const [resending,        setResending]        = useState(false)
  const otpRefs = useRef([])

  // ── Already logged in ────────────────────────────────────────────
  if (user) {
    const dashPath = user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart size={26} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Already signed in</h2>
          <p className="text-gray-500 text-sm mb-5">
            You're logged in as <strong>{user.full_name}</strong> ({user.role}).<br/>
            Log out to create a new account.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => navigate(dashPath)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
              Go to Dashboard
            </button>
            <button onClick={() => { dispatch(logout()); navigate('/register') }}
              className="w-full py-3 border border-red-200 text-red-500 hover:bg-red-50 font-medium rounded-xl transition-colors text-sm">
              Log out & Register New Account
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Email already registered ─────────────────────────────────────
  if (alreadyRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={26} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account already exists</h2>
          <p className="text-gray-500 text-sm mb-1">
            <strong>{form.email}</strong> is already registered.
          </p>
          <p className="text-gray-400 text-xs mb-6">Log in with your existing account, or use a different email to create a new one.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => navigate('/login', { state: { email: form.email } })}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
              Login to My Account
            </button>
            <button onClick={() => { setAlreadyRegistered(false); setForm(f => ({ ...f, email: '' })) }}
              className="w-full py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-xl transition-colors text-sm">
              Use a Different Email
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 1: Send OTP ──────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 8)          { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/send-otp', form)
      const { demo_otp, otp_sent_via, phone_hint } = res.data
      setOtpChannel(otp_sent_via)
      setPhoneHint(phone_hint || null)
      if (demo_otp) {
        setDemoOtp(demo_otp)
        toast.success('Demo mode — OTP shown below (configure Twilio for real SMS)', { duration: 8000 })
      } else {
        setDemoOtp(null)
        const dest = otp_sent_via === 'sms'
          ? `your phone ending ${phone_hint}`
          : `${form.email}`
        toast.success(`Verification code sent to ${dest}`)
      }
      setStep(2)
    } catch (err) {
      const detail = err.response?.data?.detail || ''
      if (detail.toLowerCase().includes('already registered')) {
        setAlreadyRegistered(true)
      } else {
        setError(detail || 'Failed to send OTP')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────
  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) { setError('Enter the 6-digit OTP'); return }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/verify-otp', { email: form.email, otp: code })
      // Auto-login after successful registration
      const loginRes = await dispatch(loginUser({ email: form.email, password: form.password }))
      if (loginRes.meta.requestStatus === 'fulfilled') {
        toast.success('Account created & email verified!')
        const role = loginRes.payload.user.role
        navigate(role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
    if (!val && i > 0) otpRefs.current[i - 1]?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
    if (e.key === 'Enter') handleVerify()
  }

  const resendOtp = async () => {
    setResending(true)
    setOtp(['', '', '', '', '', ''])
    setDemoOtp(null)
    setError('')
    try {
      const res = await api.post('/auth/send-otp', form)
      const { demo_otp, otp_sent_via, phone_hint } = res.data
      setOtpChannel(otp_sent_via)
      setPhoneHint(phone_hint || null)
      if (demo_otp) {
        setDemoOtp(demo_otp)
        toast.success('New OTP generated', { duration: 8000 })
      } else {
        const dest = otp_sent_via === 'sms' ? `phone ending ${phone_hint}` : form.email
        toast.success(`New code sent to ${dest}`)
      }
    } catch { toast.error('Failed to resend OTP') }
    finally { setResending(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
              <Heart size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Synora Health</span>
          </Link>
          {step === 1 ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
              <p className="text-gray-500 mt-1">Join thousands managing their health smarter</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">
                {otpChannel === 'sms' ? 'Verify your phone' : 'Verify your email'}
              </h1>
              <p className="text-gray-500 mt-1">
                {otpChannel === 'sms'
                  ? <>We sent a 6-digit code to your phone <strong>ending {phoneHint}</strong></>
                  : <>We sent a 6-digit code to <strong>{form.email}</strong></>}
              </p>
            </>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > s ? 'bg-green-500 text-white' : step === s ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`text-xs font-medium ${step === s ? 'text-blue-600' : 'text-gray-400'}`}>
                {s === 1 ? 'Details' : (otpChannel === 'sms' ? 'Verify Phone' : 'Verify OTP')}
              </span>
              {s < 2 && <div className={`w-8 h-0.5 ${step > s ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card">

          {/* ── STEP 1: Registration Form ── */}
          {step === 1 && (
            <>
              {/* Role Selector */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
                {['patient', 'doctor'].map(r => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${form.role === r ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {r === 'patient' ? <User size={15}/> : <Stethoscope size={15}/>}
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                      placeholder="Your full name" className="input-field pl-10" required/>
                  </div>
                </div>

                <div>
                  <label className="label">
                    Email Address
                    <span className="text-xs text-blue-500 ml-1 font-normal">(OTP will be sent here)</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      placeholder="you@example.com" className="input-field pl-10" required/>
                  </div>
                </div>

                <div>
                  <label className="label">
                    Mobile Number
                    <span className="text-xs text-blue-500 ml-1 font-normal">(OTP sent here if provided)</span>
                  </label>
                  <div className="relative flex">
                    <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-600 font-medium whitespace-nowrap">
                      <Phone size={14} className="mr-1.5 text-gray-400"/> +91
                    </span>
                    <input type="tel" value={form.phone}
                      onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                      placeholder="9876543210" className="input-field rounded-l-none flex-1"
                      maxLength={10} inputMode="numeric"/>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Enter 10-digit number — OTP will come as SMS</p>
                </div>

                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type={showPassword ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm({...form, password: e.target.value})}
                      placeholder="Min. 8 characters" className="input-field pl-10 pr-10" required/>
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password" className="input-field pl-10" required/>
                  </div>
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <button type="submit" disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                  {loading ? 'Sending verification code...' : 'Send Verification Code'}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === 2 && (
            <div className="space-y-6">

              {/* Info banner — SMS or email */}
              {!demoOtp && otpChannel === 'sms' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <Phone size={18} className="text-green-600 flex-shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-sm font-semibold text-green-800">SMS sent to your phone</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      A 6-digit OTP was sent to your number ending <strong>{phoneHint}</strong>
                    </p>
                    <p className="text-xs text-green-400 mt-1">Valid for 10 minutes. Do not share with anyone.</p>
                  </div>
                </div>
              )}
              {!demoOtp && otpChannel === 'email' && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                  <Mail size={18} className="text-blue-600 flex-shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Check your inbox</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      A 6-digit code was sent to <strong>{form.email}</strong>
                    </p>
                    <p className="text-xs text-blue-400 mt-1">Also check your spam / junk folder.</p>
                  </div>
                </div>
              )}

              {/* Dev mode — shown when SMTP is not configured */}
              {demoOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-xs font-semibold text-amber-700 mb-1">
                    Email not configured — use this code to continue
                  </p>
                  <p className="text-3xl font-extrabold text-amber-700 tracking-widest mt-2">{demoOtp}</p>
                  <p className="text-xs text-amber-500 mt-2">
                    Configure SMTP in <code className="bg-amber-100 px-1 rounded">.env</code> to send real emails
                  </p>
                </div>
              )}

              {/* 6-digit OTP input */}
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-3 text-center">
                  Enter 6-digit verification code
                </label>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all
                        ${digit ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-900'}
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-100`}
                    />
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg text-center">{error}</p>}

              <button onClick={handleVerify} disabled={loading || otp.join('').length < 6}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50">
                {loading ? 'Verifying...' : <><ShieldCheck size={16}/> Verify & Create Account</>}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button onClick={() => { setStep(1); setError(''); setOtp(['','','','','','']); setDemoOtp(null) }}
                  className="text-gray-500 hover:text-gray-700 font-medium">
                  ← Change Details
                </button>
                <button onClick={resendOtp} disabled={resending}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                  {resending
                    ? <><RefreshCw size={13} className="animate-spin"/> Resending...</>
                    : 'Resend Code'}
                </button>
              </div>

            </div>
          )}

        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
