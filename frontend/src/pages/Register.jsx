import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Heart, Eye, EyeOff, Mail, Lock, User, Phone, Stethoscope } from 'lucide-react'
import { registerUser } from '../redux/slices/authSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'

function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector(s => s.auth)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', role: 'patient' })
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    const result = await dispatch(registerUser(form))
    if (result.meta.requestStatus === 'fulfilled') {
      const role = result.payload.user.role
      if (role === 'doctor') navigate('/doctor/dashboard')
      else navigate('/patient/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
              <Heart size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">AI Healthcare</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Join thousands of users managing their health smarter</p>
        </div>

        <div className="card">
          {/* Role Selector */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'patient' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
                ${form.role === 'patient' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <User size={15} /> Patient
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'doctor' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
                ${form.role === 'doctor' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Stethoscope size={15} /> Doctor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Dr. John Doe"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Phone (optional)</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  className="input-field pl-10 pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : `Create ${form.role === 'doctor' ? 'Doctor' : 'Patient'} Account`}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
