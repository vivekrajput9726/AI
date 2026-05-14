import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function SplashScreen() {
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const [progress, setProgress] = useState(0)
  const [text, setText] = useState('Initializing...')

  useEffect(() => {
    const msgs = ['Loading AI Models...', 'Connecting to Health Data...', 'Securing your data...', 'Ready!']
    let step = 0
    const iv = setInterval(() => {
      step++
      setProgress(step * 25)
      setText(msgs[step - 1] || 'Ready!')
      if (step >= 4) {
        clearInterval(iv)
        setTimeout(() => {
          if (user) {
            const path = user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'
            navigate(path, { replace: true })
          } else {
            navigate('/login', { replace: true })
          }
        }, 400)
      }
    }, 500)
    return () => clearInterval(iv)
  }, [navigate, user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-500 flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="flex flex-col items-center mb-12">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6 relative overflow-hidden">
          <svg viewBox="0 0 80 80" width="60" height="60">
            <path d="M10 40 Q20 20 30 40 Q40 60 50 40 Q60 20 70 40" fill="none" stroke="#0d9488" strokeWidth="4" strokeLinecap="round"
              className="animate-pulse"/>
            <circle cx="40" cy="40" r="6" fill="#0d9488"/>
          </svg>
          {/* Pulse rings */}
          <div className="absolute inset-0 rounded-3xl border-4 border-teal-200 animate-ping opacity-30"/>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Synora</h1>
        <p className="text-teal-200 text-lg font-medium mt-1">Health</p>
        <p className="text-teal-300 text-sm mt-2">AI-Powered Healthcare</p>
      </div>

      {/* ECG line animation */}
      <div className="w-64 mb-10 overflow-hidden">
        <svg viewBox="0 0 256 40" width="256" height="40" className="animate-pulse">
          <path d="M0 20 L30 20 L40 5 L50 35 L60 15 L70 25 L80 20 L110 20 L120 5 L130 35 L140 15 L150 25 L160 20 L256 20"
            fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Progress */}
      <div className="w-64 space-y-3">
        <div className="w-full bg-white/20 rounded-full h-1.5">
          <div className="bg-white h-1.5 rounded-full transition-all duration-500" style={{width:`${progress}%`}}/>
        </div>
        <p className="text-center text-teal-200 text-sm">{text}</p>
      </div>

      {/* Bottom tagline */}
      <p className="absolute bottom-8 text-teal-300/60 text-xs">Your Health, Our Priority</p>
    </div>
  )
}
