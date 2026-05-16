import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Brain, Calendar, FileText, Pill, MapPin, Activity,
  CheckCircle, ArrowRight, Upload, Heart, Droplets,
  Moon, ChevronDown, Target, Users, Clock, Video,
  Stethoscope, MessageSquare, Plus, Shield, Pencil, RefreshCw,
  AlertCircle, XCircle
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import { fetchMyAppointments } from '../redux/slices/appointmentSlice'
import { formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

// ── Health Score Ring ──────────────────────────────
function ScoreRing({ score = 84, label = 'Good' }) {
  const size = 150, sw = 13, r = size / 2 - sw
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const ringColor = label === 'Good' ? '#22c55e' : label === 'Fair' ? '#eab308' : '#ef4444'
  const trackColor = label === 'Good' ? '#f0fdf4' : label === 'Fair' ? '#fefce8' : '#fef2f2'
  const labelColor = label === 'Good' ? 'text-green-500' : label === 'Fair' ? 'text-yellow-500' : 'text-red-500'
  return (
    <div className="relative flex-shrink-0 mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ringColor} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gray-900 leading-none">{score}</span>
        <span className="text-gray-400 text-xs">/100</span>
        <span className={`font-semibold text-sm mt-0.5 ${labelColor}`}>{label}</span>
      </div>
    </div>
  )
}

export default function PatientDashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const { list: appointments = [] } = useSelector(s => s.appointments || { list: [] })
  const [records, setRecords]       = useState([])
  const [timePeriod, setTimePeriod] = useState('This Week')
  const [showPeriod, setShowPeriod] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [healthScore, setHealthScore]   = useState(null)
  const [healthLoading, setHealthLoading] = useState(true)

  const [vitals, setVitals] = useState(() => {
    try {
      const s = localStorage.getItem('synora_vitals')
      return s ? JSON.parse(s) : { heartRate: '72', bloodPressure: '120/80', bloodSugar: '98' }
    } catch { return { heartRate: '72', bloodPressure: '120/80', bloodSugar: '98' } }
  })
  const [editingVital, setEditingVital] = useState(null)
  const [editValue, setEditValue]       = useState('')

  function startEdit(key) { setEditingVital(key); setEditValue(vitals[key]) }
  function saveEdit(key) {
    if (!editValue.trim()) { setEditingVital(null); return }
    const updated = { ...vitals, [key]: editValue.trim() }
    setVitals(updated)
    localStorage.setItem('synora_vitals', JSON.stringify(updated))
    setEditingVital(null)
    toast.success('Vital updated!')
  }

  const loadData = async (showFeedback = false) => {
    if (showFeedback) setRefreshing(true)
    try {
      await Promise.all([
        dispatch(fetchMyAppointments()),
        api.get('/health-records/').then(r => setRecords(r.data || [])).catch(() => {}),
        api.get('/users/me/health-score')
           .then(r => setHealthScore(r.data))
           .catch(() => setHealthScore(null))
           .finally(() => setHealthLoading(false)),
      ])
      if (showFeedback) toast.success('Dashboard refreshed!')
    } finally {
      if (showFeedback) setRefreshing(false)
    }
  }

  useEffect(() => { loadData() }, [dispatch])

  // Re-fetch health score whenever vitals change in Redux (e.g. after updating in Profile)
  useEffect(() => {
    api.get('/users/me/health-score')
      .then(r => { setHealthScore(r.data); setHealthLoading(false) })
      .catch(() => setHealthLoading(false))
  }, [
    user?.weight_kg,
    user?.height_cm,
    user?.heart_rate_bpm,
    user?.blood_pressure_systolic,
    user?.blood_pressure_diastolic,
    user?.blood_sugar_mg_dl,
  ])

  const firstName   = user?.full_name?.split(' ')[0] || 'there'
  const h           = new Date().getHours()
  const greeting    = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'
  const upcomingApt = appointments.find(a => a.status === 'confirmed') || appointments[0]

  const quickActions = [
    { icon: Stethoscope,  label: 'AI Symptom\nChecker',   bg: 'bg-blue-100',   text: 'text-blue-600',   path: '/patient/symptoms' },
    { icon: Calendar,     label: 'Book\nAppointment',      bg: 'bg-green-100',  text: 'text-green-600',  path: '/patient/doctors' },
    { icon: Upload,       label: 'Upload\nReports',        bg: 'bg-purple-100', text: 'text-purple-600', path: '/patient/laboratory' },
    { icon: Pill,         label: 'Medicine\nReminder',     bg: 'bg-orange-100', text: 'text-orange-500', path: '/patient/medicines' },
    { icon: MessageSquare,label: 'Chat with\nAI Copilot',  bg: 'bg-teal-100',   text: 'text-teal-600',   path: '/patient/copilot' },
    { icon: MapPin,       label: 'Find Nearby\nHospitals', bg: 'bg-red-100',    text: 'text-red-500',    path: '/patient/nearby' },
  ]

  const vitalDefs = [
    { key: 'heartRate',     icon: Heart,    label: 'Heart Rate',     unit: 'bpm',   iconColor: 'text-red-500',  bg: 'bg-red-50',  placeholder: 'e.g. 72' },
    { key: 'bloodPressure', icon: Activity, label: 'Blood Pressure', unit: 'mmHg',  iconColor: 'text-blue-500', bg: 'bg-blue-50', placeholder: 'e.g. 120/80' },
    { key: 'bloodSugar',    icon: Droplets, label: 'Blood Sugar',    unit: 'mg/dL', iconColor: 'text-cyan-500', bg: 'bg-cyan-50', placeholder: 'e.g. 98' },
  ]

  return (
    <DashboardLayout>
      <div className="flex gap-5 min-h-0">

        {/* ══════════════ MAIN CONTENT ══════════════ */}
        <div className="flex-1 min-w-0 space-y-5 pb-8">

          {/* Greeting */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName} 👋</h1>
              <p className="text-sm text-gray-500 mt-0.5">Here's your health overview for today.</p>
            </div>
            <button onClick={() => loadData(true)} disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-60">
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''}/> {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* ── Quick Actions ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {quickActions.map((a, i) => (
                <button key={i} onClick={() => navigate(a.path)}
                  className="flex flex-col items-center gap-2 group">
                  <div className={`w-14 h-14 ${a.bg} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
                    <a.icon size={22} className={a.text} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-600 text-center leading-tight whitespace-pre-line">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── AI Copilot | Health Score | Risk Status ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* AI Health Copilot */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="font-bold text-gray-800 mb-4">AI Health Copilot</p>
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2.5">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-xs text-blue-700 leading-relaxed">Your sleep quality improved by 18% this week.</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                    <p className="text-xs text-orange-700 leading-relaxed">Hydration level is low. Drink more water.</p>
                  </div>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Brain size={30} className="text-indigo-500" />
                </div>
              </div>
              <button onClick={() => navigate('/patient/copilot')}
                className="mt-4 text-sm text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                Chat with AI Copilot <ArrowRight size={13} />
              </button>
            </div>

            {/* Health Score + Risk Status — gated on vitals completeness */}
            {healthLoading ? (
              <>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4" />
                  <div className="grid grid-cols-3 gap-2">
                    {[0,1,2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                  <div className="h-10 bg-gray-100 rounded-xl mb-3" />
                  <div className="h-3 bg-gray-200 rounded-full mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </>
            ) : !healthScore?.vitals_complete ? (
              <div className="lg:col-span-2 bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertCircle size={28} className="text-amber-500" />
                </div>
                <p className="font-bold text-gray-900 text-base">Complete Your Health Profile</p>
                <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                  Your health score and risk status can't be calculated yet.
                  Add your weight and height to see real-time insights.
                </p>
                <button onClick={() => navigate('/patient/profile#vitals')}
                  className="mt-1 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2">
                  <Plus size={14} /> Add Health Vitals
                </button>
              </div>
            ) : (
              <>
                {/* Health Score (dynamic) */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="font-bold text-gray-800 mb-3">Health Score</p>
                  <div className="flex justify-center mb-4">
                    <ScoreRing
                      score={healthScore.score}
                      label={healthScore.score >= 80 ? 'Good' : healthScore.score >= 60 ? 'Fair' : 'Poor'}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {vitalDefs.map((m) => (
                      <div key={m.key}
                        className={`${m.bg} rounded-xl p-2.5 text-center relative group cursor-pointer`}
                        onClick={() => editingVital !== m.key && startEdit(m.key)}
                        title="Click to update locally">
                        <m.icon size={14} className={`${m.iconColor} mx-auto mb-1`} />
                        {editingVital === m.key ? (
                          <input autoFocus value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => saveEdit(m.key)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(m.key); if (e.key === 'Escape') setEditingVital(null) }}
                            onClick={e => e.stopPropagation()}
                            placeholder={m.placeholder}
                            className="w-full text-xs font-bold text-center bg-white border border-blue-300 rounded-lg px-1 py-0.5 focus:outline-none" />
                        ) : (
                          <p className="text-xs font-bold text-gray-900">{vitals[m.key]}</p>
                        )}
                        <p className="text-[10px] text-gray-500 leading-tight">{m.unit}</p>
                        {editingVital !== m.key && (
                          <Pencil size={8} className="absolute top-1 right-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 text-center mt-2">Click any vital to update</p>
                </div>

                {/* Health Risk Status (dynamic) */}
                {(() => {
                  const risk = healthScore.risk_level
                  const isLow = risk === 'Low'
                  const isMod = risk === 'Moderate'
                  const RiskIcon = isLow ? CheckCircle : isMod ? AlertCircle : XCircle
                  const riskColor = isLow ? 'text-green-600' : isMod ? 'text-yellow-600' : 'text-red-600'
                  const riskBg    = isLow ? 'bg-green-100'  : isMod ? 'bg-yellow-100'  : 'bg-red-100'
                  const riskMsg   = isLow
                    ? 'Keep maintaining your healthy lifestyle.'
                    : isMod
                    ? 'Some vitals are outside normal ranges. Consider consulting a doctor.'
                    : 'Multiple vitals are elevated. Please consult a healthcare provider.'
                  const needlePos = isLow ? '14%' : isMod ? '50%' : '86%'
                  return (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <p className="font-bold text-gray-800 mb-4">Health Risk Status</p>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-11 h-11 ${riskBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <RiskIcon size={24} className={riskColor} />
                        </div>
                        <span className={`text-xl font-bold ${riskColor}`}>{risk} Risk</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-5 leading-relaxed">{riskMsg}</p>
                      <div className="relative mb-1">
                        <div className="w-full h-3 rounded-full overflow-hidden flex">
                          <div className="flex-1 bg-green-400 rounded-l-full" />
                          <div className="flex-1 bg-yellow-400" />
                          <div className="flex-1 bg-red-500 rounded-r-full" />
                        </div>
                        <div className="absolute -top-0.5 w-4 h-4 bg-white border-2 border-gray-700 rounded-full shadow" style={{ left: needlePos }} />
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-400 mt-2 mb-3">
                        <span>Low</span><span>Moderate</span><span>High</span>
                      </div>
                      <button onClick={() => navigate('/patient/laboratory')}
                        className="text-sm text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                        View Full Analysis <ArrowRight size={13} />
                      </button>
                    </div>
                  )
                })()}
              </>
            )}
          </div>

          {/* ── Health Overview ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gray-800">Health Overview</p>
              <div className="relative">
                <button onClick={() => setShowPeriod(v => !v)}
                  className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  {timePeriod} <ChevronDown size={14} />
                </button>
                {showPeriod && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden w-36">
                    {['This Week', 'This Month', 'This Year'].map(opt => (
                      <button key={opt} onClick={() => { setTimePeriod(opt); setShowPeriod(false) }}
                        className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${timePeriod === opt ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { emoji: '🚶', label: 'Steps',        value: '6,842',  sub: '/10,000', subColor: 'text-gray-400' },
                { emoji: '🌙', label: 'Sleep',        value: '6h 45m', sub: 'Good',    subColor: 'text-green-500' },
                { emoji: '💧', label: 'Water Intake', value: '5/8',    sub: 'Glasses', subColor: 'text-blue-400' },
                { emoji: '🔥', label: 'Calories',     value: '1,450',  sub: 'kcal',    subColor: 'text-orange-400' },
                { emoji: '⚖️', label: 'Weight',       value: '65 kg',  sub: 'Normal',  subColor: 'text-green-500' },
                { emoji: '📊', label: 'BMI',          value: '22.5',   sub: 'Normal',  subColor: 'text-green-500' },
              ].map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-2xl">
                  <span className="text-2xl mb-0.5">{m.emoji}</span>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{m.value}</p>
                  <p className={`text-[11px] font-medium ${m.subColor}`}>{m.sub}</p>
                  <p className="text-[10px] text-gray-400">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🎯', title: 'Health Goals',    count: '3 Goals Active',   desc: 'Track your goals',              link: 'View Goals',     path: '/patient/goals',     color: 'text-blue-600',   bg: 'from-blue-50 to-indigo-50' },
              { icon: '👨‍👩‍👧', title: 'Family Health', count: '4 Members',         desc: 'Manage family health',          link: 'View Family',    path: '/patient/family',    color: 'text-green-600',  bg: 'from-green-50 to-teal-50' },
              { icon: '📋', title: 'Health Timeline', count: '23 Activities',     desc: 'View your health history',      link: 'View Timeline',  path: '/patient/journey',   color: 'text-purple-600', bg: 'from-purple-50 to-pink-50' },
              { icon: '🔄', title: 'AI Follow-Up',    count: '2 Follow-Ups Due', desc: 'Check recovery progress',       link: 'View Follow-ups', path: '/patient/follow-up', color: 'text-orange-600', bg: 'from-orange-50 to-amber-50' },
            ].map((c, i) => (
              <div key={i} className={`bg-gradient-to-br ${c.bg} rounded-2xl border border-gray-100 shadow-sm p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{c.icon}</span>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{c.title}</p>
                    <p className={`text-xs font-semibold ${c.color}`}>{c.count}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">{c.desc}</p>
                <button onClick={() => navigate(c.path)}
                  className={`text-xs font-semibold ${c.color} flex items-center gap-1 hover:underline`}>
                  {c.link} <ArrowRight size={11} />
                </button>
              </div>
            ))}
          </div>

          {/* ── Stay Protected ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">Stay Protected!</p>
                <p className="text-xs text-gray-500">Complete your profile and health records for better AI analysis and recommendations.</p>
              </div>
            </div>
            <button onClick={() => navigate('/patient/profile')}
              className="flex-shrink-0 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap">
              Complete Profile
            </button>
          </div>


        </div>

        {/* ══════════════ RIGHT SIDEBAR ══════════════ */}
        <div className="w-72 xl:w-80 flex-shrink-0 hidden lg:flex flex-col gap-4 pb-8">

          {/* Upcoming Appointment */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gray-800">Upcoming Appointment</p>
              <button onClick={() => navigate('/patient/doctors')} className="text-xs text-blue-600 font-medium hover:underline">View All</button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {upcomingApt ? upcomingApt.doctor_name?.charAt(0) : 'A'}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{upcomingApt?.doctor_name || 'Dr. Ananya Sharma'}</p>
                <p className="text-xs text-gray-500">Cardiologist</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Calendar size={13} className="text-gray-400 flex-shrink-0" />
                {upcomingApt ? formatDate(upcomingApt.appointment_date) : '16 May 2024'}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Clock size={13} className="text-gray-400 flex-shrink-0" />
                {upcomingApt?.appointment_time || '10:30 AM'}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Video size={13} className="text-gray-400 flex-shrink-0" />
                Video Consultation
              </div>
            </div>
            <button onClick={() => navigate('/patient/doctors')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors">
              Join Call
            </button>
            <button onClick={() => navigate('/patient/doctors')}
              className="mt-3 text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
              See all appointments <ArrowRight size={11} />
            </button>
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gray-800">Recent Reports</p>
              <button onClick={() => navigate('/patient/my-records')} className="text-xs text-blue-600 font-medium hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {(records.length > 0 ? records.slice(0, 3) : [
                { title: 'Blood Test Report', date: '12 May 2024' },
                { title: 'X-Ray Chest',       date: '10 May 2024' },
                { title: 'ECG Report',         date: '05 May 2024' },
              ]).map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={15} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.title || r.name || 'Report'}</p>
                    <p className="text-xs text-gray-400">{r.date || r.created_at || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gray-800">Quick Tips</p>
              <button onClick={() => navigate('/patient/diary')} className="text-xs text-blue-600 font-medium hover:underline">View All</button>
            </div>
            <div className="space-y-2.5">
              {[
                { icon: '💧', text: 'Drink at least 8 glasses of water daily.',  bg: 'bg-blue-50' },
                { icon: '🚶', text: 'Take a 10 min walk after meals.',            bg: 'bg-green-50' },
                { icon: '🌙', text: 'Try to sleep 7-8 hours every night.',        bg: 'bg-purple-50' },
                { icon: '🥗', text: 'Reduce sugar and processed food.',           bg: 'bg-orange-50' },
              ].map((tip, i) => (
                <div key={i} className={`flex items-start gap-2.5 p-2.5 ${tip.bg} rounded-xl`}>
                  <span className="text-base flex-shrink-0 leading-none mt-0.5">{tip.icon}</span>
                  <p className="text-xs text-gray-600 leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
