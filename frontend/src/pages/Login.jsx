import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Heart, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { loginUser } from '../redux/slices/authSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'

function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector(s => s.auth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(loginUser(form))
    if (result.meta.requestStatus === 'fulfilled') {
      const role = result.payload.user.role
      if (role === 'admin') navigate('/admin')
      else if (role === 'doctor') navigate('/doctor/dashboard')
      else navigate('/patient/dashboard')
    }
  }

  const fillDemo = (role) => {
    if (role === 'admin')   setForm({ email: 'admin@aihealthcare.com', password: 'Admin@123' })
    else if (role === 'doctor')  setForm({ email: 'doctor@demo.com',  password: 'Demo@1234' })
    else if (role === 'patient') setForm({ email: 'patient@demo.com', password: 'Demo@1234' })
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
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your account to continue</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
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
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">Quick Demo Login</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => fillDemo('patient')}
                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 py-2.5 px-2 rounded-xl transition-colors font-medium"
              >
                🧑‍⚕️ Patient
              </button>
              <button
                onClick={() => fillDemo('doctor')}
                className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 py-2.5 px-2 rounded-xl transition-colors font-medium"
              >
                🩺 Doctor
              </button>
              <button
                onClick={() => fillDemo('admin')}
                className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 py-2.5 px-2 rounded-xl transition-colors font-medium"
              >
                🛡️ Admin
              </button>
            </div>
            <p className="text-[10px] text-gray-300 text-center mt-2">Click a role to auto-fill credentials</p>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
