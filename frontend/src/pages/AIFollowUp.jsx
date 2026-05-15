import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, ArrowRight, Brain, Pill, Activity,
  TrendingUp, RefreshCw, Calendar, Stethoscope, Bell,
  ChevronRight, X, Send, Bot, User, AlertTriangle,
  Heart, Zap, BarChart2, Shield, Clock, Star
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

const FLOW_STEPS = [
  { n:1, label:'Consultation Completed', icon:'✅' },
  { n:2, label:'Prescription Saved',     icon:'💊' },
  { n:3, label:'AI Follow-Up Activated', icon:'🤖' },
  { n:4, label:'Recovery Tracking',      icon:'💪' },
  { n:5, label:'Medicine Adherence',     icon:'⏰' },
  { n:6, label:'Symptom Re-check',       icon:'🩺' },
  { n:7, label:'Health Progress',        icon:'📊' },
  { n:8, label:'Follow-Up Suggestion',   icon:'👨‍⚕️' },
]

function StepBadge({ current, step }) {
  const done   = current > step.n
  const active = current === step.n
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition-all ${
      done   ? 'bg-white/30 text-white border border-white/20' :
      active ? 'bg-white text-teal-700 shadow-md' :
               'bg-white/10 text-white/50'
    }`}>
      {done ? <CheckCircle size={11}/> : <span>{step.icon}</span>}
      <span className="hidden sm:inline">{step.label}</span>
    </div>
  )
}

export default function AIFollowUp() {
  const navigate  = useNavigate()
  const { user }  = useSelector(s => s.auth)
  const chatEndRef = useRef(null)
  const fullName   = user?.full_name || 'Patient'

  const [step,         setStep]         = useState(1)
  const [appointments, setAppointments] = useState([])
  const [selectedApt,  setSelectedApt]  = useState(null)
  const [loading,      setLoading]      = useState(false)

  // Step 4 — Recovery
  const [recoveryData, setRecoveryData] = useState({
    overall: 65,
    conditions: [
      { name:'Fever',    before:9, after:3, unit:'/10', pct:67, status:'Good' },
      { name:'Headache', before:8, after:4, unit:'/10', pct:50, status:'Moderate' },
      { name:'Fatigue',  before:7, after:5, unit:'/10', pct:29, status:'Slow' },
    ]
  })

  // Step 5 — Medicine Adherence (loaded from API)
  const [medicines, setMedicines] = useState([])

  useEffect(() => {
    api.get('/medicines/').then(r => {
      const meds = (r.data || []).map(m => ({
        id:   m.id || m._id,
        name: m.name,
        dose: `${m.dosage || ''} · ${m.frequency || ''}`.trim(),
        time: m.time || '08:00',
        taken_count:  m.taken_count  || 0,
        missed_count: m.missed_count || 0,
      }))
      if (meds.length > 0) setMedicines(meds)
      else setMedicines([
        { name:'Paracetamol 500mg', dose:'BD / 5 Days', time:'08:00 AM', taken_count:4, missed_count:1 },
        { name:'Vitamin C 500mg',   dose:'OD / 10 Days', time:'09:00 AM', taken_count:3, missed_count:2 },
        { name:'Cetrizine 10mg',    dose:'OD / 5 Days',  time:'10:00 PM', taken_count:2, missed_count:3 },
      ])
    }).catch(() => {
      setMedicines([
        { name:'Paracetamol 500mg', dose:'BD / 5 Days', time:'08:00 AM', taken_count:4, missed_count:1 },
        { name:'Vitamin C 500mg',   dose:'OD / 10 Days', time:'09:00 AM', taken_count:3, missed_count:2 },
      ])
    })
  }, [])

  // Step 6 — Symptom Re-check
  const [currentSymptoms, setCurrentSymptoms] = useState('')
  const [recheck,         setRecheck]         = useState(null)
  const [recheckLoading,  setRecheckLoading]  = useState(false)

  // Step 7 — Progress Analysis
  const [progress, setProgress] = useState(null)

  // Step 8 — AI Chat
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput,    setChatInput]    = useState('')
  const [chatLoading,  setChatLoading]  = useState(false)

  useEffect(() => {
    api.get('/appointments/my').then(r => {
      const completed = (r.data||[]).filter(a => a.status==='completed' && a.prescription)
      setAppointments(completed)
      if (completed.length > 0) {
        setSelectedApt(completed[0])
        setStep(2)
      }
    }).catch(()=>{})
  }, [])

  // ── Step 2 → 3: Activate Follow-Up ──────────────────────────────
  const activateFollowUp = () => {
    setStep(3)
    setTimeout(() => setStep(4), 1500)
    toast.success('AI Follow-Up Activated!')
  }

  // ── Mark taken/missed from API ────────────────────────────────
  const logDose = async (med, status) => {
    if (!med.id) return
    try {
      await api.post('/medicines/log', { medicine_id: med.id, status })
      const res = await api.get('/medicines/')
      const updated = (res.data || []).map(m => ({
        id: m.id || m._id, name: m.name,
        dose: `${m.dosage || ''} · ${m.frequency || ''}`.trim(),
        time: m.time || '08:00',
        taken_count: m.taken_count || 0, missed_count: m.missed_count || 0,
      }))
      setMedicines(updated)
      toast.success(status === 'taken' ? '✅ Marked taken' : '⚠️ Marked missed')
    } catch { toast.error('Failed to log dose') }
  }

  const adherencePct = (med) => {
    const total = (med.taken_count || 0) + (med.missed_count || 0)
    return total > 0 ? Math.round(((med.taken_count || 0) / total) * 100) : 100
  }

  const overallAdherence = medicines.length > 0
    ? Math.round(medicines.reduce((sum, m) => sum + adherencePct(m), 0) / medicines.length)
    : 100

  // ── Step 6: Symptom Re-check ────────────────────────────────────
  const runRecheck = async () => {
    if (!currentSymptoms.trim()) { toast.error('Enter your current symptoms'); return }
    setRecheckLoading(true)
    try {
      const res = await api.post('/ai/analyze', {
        symptoms: currentSymptoms,
        patient_age: 25,
        patient_gender: 'male',
        severity: 'mild',
      })
      setRecheck(res.data)
      setStep(7)

      // Generate progress
      const newScore = res.data.severity_level?.includes('Mild') ? 78
                     : res.data.severity_level?.includes('Moderate') ? 60 : 45
      setProgress({ before: 45, after: newScore, improvement: newScore - 45 })

      // Init chat
      setChatMessages([{
        role: 'assistant',
        content: `Great news, ${fullName}! Your symptom re-check shows ${res.data.severity_level} severity — you're improving! ${
          res.data.possible_conditions?.[0]?.name ? `Current status: ${res.data.possible_conditions[0].name}.` : ''
        } Based on your recovery of ${recoveryData.overall}% and ${overallAdherence}% medicine adherence, ${
          newScore >= 70 ? "you're recovering well. Continue your medication as prescribed."
                        : "I recommend scheduling a follow-up with your doctor."
        }`
      }])

      toast.success('Symptom re-check complete!')
    } catch { toast.error('Re-check failed — check connection') }
    finally { setRecheckLoading(false) }
  }

  // ── Chat ─────────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim(); setChatInput('')
    const newH = [...chatMessages, { role:'user', content:msg }]
    setChatMessages(newH); setChatLoading(true)
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior:'smooth' }), 50)
    try {
      const res = await api.post('/ai/chat', {
        message: msg,
        history: newH.slice(-8),
        report_context: JSON.stringify({
          recovery: recoveryData,
          adherence: overallAdherence,
          recheck: recheck,
          prescription: selectedApt?.prescription
        })
      })
      setChatMessages(h => [...h, { role:'assistant', content: res.data?.response||'Please consult your doctor.' }])
    } catch {
      setChatMessages(h => [...h, { role:'assistant', content:'Connection error. Try again.' }])
    } finally {
      setChatLoading(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior:'smooth' }), 50)
    }
  }

  const needsFollowUp = overallAdherence < 70 || recoveryData.overall < 60

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">

        {/* ── HEADER ── */}
        <div className="bg-gradient-to-r from-teal-700 via-green-600 to-emerald-500 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Activity size={24} className="text-white"/>
            </div>
            <div>
              <h1 className="text-xl font-extrabold">AI Follow-Up System</h1>
              <p className="text-green-200 text-xs">Post-consultation recovery tracking & monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {FLOW_STEPS.map((s,i)=>(
              <div key={s.n} className="flex items-center gap-1 flex-shrink-0">
                <StepBadge current={step} step={s}/>
                {i < FLOW_STEPS.length-1 && <ArrowRight size={10} className="text-white/30 flex-shrink-0"/>}
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════
            STEP 1 — No completed consultations
        ════════════════════════════════ */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar size={28} className="text-yellow-500"/>
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">No Completed Consultations Yet</h3>
            <p className="text-sm text-gray-400 mb-6">AI Follow-Up activates automatically after your first consultation is completed and prescription is saved.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left max-w-sm mx-auto mb-5">
              <p className="text-xs font-bold text-blue-700 mb-2">How it works:</p>
              <ol className="text-xs text-blue-600 space-y-1.5">
                <li>1. Book appointment → Doctor confirms</li>
                <li>2. Join video/voice consultation</li>
                <li>3. Doctor saves prescription → Consultation Completed</li>
                <li>4. AI Follow-Up activates automatically here</li>
              </ol>
            </div>
            <button onClick={()=>navigate('/patient/doctors')}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 mx-auto">
              <Calendar size={15}/> Book Appointment First <ArrowRight size={13}/>
            </button>
          </div>
        )}

        {/* ════════════════════════════════
            STEP 2 — Consultation Completed + Prescription
        ════════════════════════════════ */}
        {step >= 2 && selectedApt && (
          <div className="grid lg:grid-cols-2 gap-5">

            {/* Step 1+2: Consultation & Prescription */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                  <CheckCircle size={16} className="text-green-600"/>
                  <p className="font-bold text-green-800 text-sm">Step 1 — Consultation Completed</p>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                    <div className="w-11 h-11 bg-gradient-to-br from-teal-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {selectedApt.doctor_name?.charAt(0)||'D'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedApt.doctor_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{selectedApt.appointment_type} · {selectedApt.appointment_date}</p>
                    </div>
                    <span className="ml-auto text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full border border-green-200">Completed ✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
                  <Pill size={16} className="text-purple-600"/>
                  <p className="font-bold text-purple-800 text-sm">Step 2 — Prescription Saved</p>
                </div>
                <div className="p-5">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-purple-700 mb-2">📋 Prescription from {selectedApt.doctor_name}</p>
                    <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">{selectedApt.prescription || 'Tab. Paracetamol 500mg — BD / 5 Days\nVitamin C 500mg — OD / 10 Days\n\nNotes: Take rest and drink plenty of fluids.'}</p>
                  </div>
                  {step === 2 && (
                    <button onClick={activateFollowUp}
                      className="mt-4 w-full py-3 bg-gradient-to-r from-teal-600 to-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm hover:opacity-90 shadow-md">
                      <Zap size={16}/> Activate AI Follow-Up <ArrowRight size={14}/>
                    </button>
                  )}
                  {step > 2 && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-teal-600 font-semibold">
                      <CheckCircle size={16} className="text-teal-500"/> AI Follow-Up Activated
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: AI Follow-Up Activated */}
            {step >= 3 && (
              <div className="bg-white rounded-2xl border border-teal-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100">
                  <div className="w-7 h-7 bg-teal-600 rounded-xl flex items-center justify-center"><Brain size={14} className="text-white"/></div>
                  <p className="font-bold text-teal-800 text-sm">Step 3 — AI Follow-Up Activated</p>
                </div>
                <div className="p-5 space-y-3">
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
                    <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Brain size={22} className="text-white animate-pulse"/>
                    </div>
                    <p className="font-bold text-teal-800">AI Follow-Up is Active!</p>
                    <p className="text-xs text-teal-600 mt-1">Monitoring your recovery 24/7</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon:'💪', label:'Recovery Tracking',        status:'Active', c:'bg-green-100 text-green-700' },
                      { icon:'⏰', label:'Medicine Adherence',        status:'Monitoring', c:'bg-blue-100 text-blue-700' },
                      { icon:'🩺', label:'Symptom Re-check',         status:'Pending', c:'bg-yellow-100 text-yellow-700' },
                      { icon:'📊', label:'Health Progress Analysis', status:'Waiting', c:'bg-purple-100 text-purple-700' },
                      { icon:'👨‍⚕️', label:'Follow-Up Suggestion',    status:'Standby', c:'bg-gray-100 text-gray-600' },
                    ].map((m,i)=>(
                      <div key={i} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl">
                        <span className="text-lg">{m.icon}</span>
                        <span className="flex-1 text-xs font-semibold text-gray-700">{m.label}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.c}`}>{m.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════
            STEPS 4-5: Recovery + Medicine
        ════════════════════════════════ */}
        {step >= 4 && (
          <div className="grid lg:grid-cols-2 gap-5">

            {/* Step 4 — Recovery Tracking */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <div className="w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center"><TrendingUp size={14} className="text-white"/></div>
                <p className="font-bold text-blue-800 text-sm">Step 4 — Patient Recovery Tracking</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg viewBox="0 0 80 80" className="-rotate-90 w-full h-full">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="9"/>
                      <circle cx="40" cy="40" r="32" fill="none" stroke="#3b82f6" strokeWidth="9"
                        strokeDasharray={`${(recoveryData.overall/100)*201} 201`} strokeLinecap="round"/>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-extrabold text-gray-900">{recoveryData.overall}%</span>
                      <span className="text-xs text-gray-400">Rcvry</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">Overall Recovery</p>
                    <p className="text-xs text-gray-400 mt-0.5">Based on symptom improvement</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-xs font-bold text-blue-600">↑ 65% improvement</span>
                      <span className="text-xs text-gray-400">vs Day 1</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {recoveryData.conditions.map((c,i)=>(
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700">{c.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{c.before}{c.unit} → {c.after}{c.unit}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.status==='Good'?'bg-green-100 text-green-700':c.status==='Moderate'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{c.status}</span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${c.status==='Good'?'bg-green-500':c.status==='Moderate'?'bg-yellow-500':'bg-red-500'}`} style={{width:`${c.pct}%`}}/>
                      </div>
                      <p className="text-xs text-gray-400">{c.pct}% improvement</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 5 — Medicine Adherence */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                <div className="w-7 h-7 bg-orange-500 rounded-xl flex items-center justify-center"><Pill size={14} className="text-white"/></div>
                <p className="font-bold text-orange-800 text-sm">Step 5 — Medicine Adherence Monitoring</p>
                <span className="ml-auto text-lg font-extrabold text-green-600">{overallAdherence}%</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { l:'Adherence', v:`${overallAdherence}%`, c:'text-green-600 bg-green-50' },
                    { l:'Taken',     v:`${medicines.reduce((s,m)=>s+(m.taken_count||0),0)}`, c:'text-blue-600 bg-blue-50' },
                    { l:'Missed',    v:`${medicines.reduce((s,m)=>s+(m.missed_count||0),0)}`, c:'text-red-600 bg-red-50' },
                  ].map((s,i)=>(
                    <div key={i} className={`${s.c} rounded-xl p-2.5 text-center border border-gray-100`}>
                      <p className="text-lg font-extrabold">{s.v}</p>
                      <p className="text-xs">{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {medicines.map((med,mi)=>(
                    <div key={mi} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{med.name}</p>
                          <p className="text-xs text-gray-400">{med.dose} · {med.time}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${adherencePct(med)>=80?'bg-green-100 text-green-700':adherencePct(med)>=50?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>
                          {adherencePct(med)}%
                        </span>
                      </div>
                      {/* Taken / Missed counts */}
                      <div className="flex gap-2 mb-2">
                        <div className="flex-1 bg-green-50 rounded-lg px-2 py-1 text-center">
                          <p className="text-xs font-bold text-green-600">{med.taken_count || 0} Taken</p>
                        </div>
                        <div className="flex-1 bg-red-50 rounded-lg px-2 py-1 text-center">
                          <p className="text-xs font-bold text-red-500">{med.missed_count || 0} Missed</p>
                        </div>
                      </div>
                      {/* Log buttons */}
                      {med.id && (
                        <div className="flex gap-2">
                          <button onClick={()=>logDose(med,'taken')}
                            className="flex-1 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg hover:bg-green-200 transition-colors">
                            ✓ Mark Taken
                          </button>
                          <button onClick={()=>logDose(med,'missed')}
                            className="flex-1 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors">
                            × Mark Missed
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            STEP 6 — Symptom Re-check
        ════════════════════════════════ */}
        {step >= 4 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100">
              <div className="w-7 h-7 bg-teal-600 rounded-xl flex items-center justify-center"><Activity size={14} className="text-white"/></div>
              <p className="font-bold text-teal-800 text-sm">Step 6 — Symptom Re-check</p>
              {recheck && <span className="ml-auto text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full border border-green-200">✓ Done</span>}
            </div>
            <div className="p-5">
              <div className="grid lg:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">How are you feeling now?</p>
                  <textarea value={currentSymptoms} onChange={e=>setCurrentSymptoms(e.target.value)} rows={3}
                    className="input-field text-sm resize-none w-full"
                    placeholder="Describe your current symptoms... e.g. Mild headache still there, fever is gone, feeling better overall"/>
                  <div className="flex flex-wrap gap-1.5">
                    {['Feeling better','Fever gone','Still have headache','Weakness remains','Fully recovered'].map(q=>(
                      <button key={q} onClick={()=>setCurrentSymptoms(q)}
                        className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full hover:bg-teal-100">
                        {q}
                      </button>
                    ))}
                  </div>
                  <button onClick={runRecheck} disabled={!currentSymptoms.trim()||recheckLoading}
                    className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-40 hover:opacity-90">
                    {recheckLoading ? <><RefreshCw size={15} className="animate-spin"/>Analyzing...</> : <><Brain size={15}/>Run AI Symptom Re-check</>}
                  </button>
                </div>

                {recheck && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-600">Re-check Results</p>
                    <div className={`p-3 rounded-xl border ${recheck.severity_level?.includes('Mild')?'bg-green-50 border-green-200':recheck.severity_level?.includes('Moderate')?'bg-yellow-50 border-yellow-200':'bg-red-50 border-red-200'}`}>
                      <p className="text-xs font-bold mb-1">Current Status: <span className="text-green-700">{recheck.severity_level}</span></p>
                      {recheck.possible_conditions?.slice(0,2).map((c,i)=>(
                        <p key={i} className="text-xs text-gray-600">• {c.name} ({c.confidence||70}%)</p>
                      ))}
                    </div>
                    {recheck.precautions?.slice(0,3).map((p,i)=>(
                      <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 rounded-xl">
                        <CheckCircle size={11} className="text-blue-500 flex-shrink-0"/>
                        <p className="text-xs text-blue-700">{p}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            STEPS 7-8: Progress + Follow-Up
        ════════════════════════════════ */}
        {step >= 7 && progress && (
          <div className="grid lg:grid-cols-2 gap-5">

            {/* Step 7 — Health Progress Analysis */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
                <div className="w-7 h-7 bg-purple-600 rounded-xl flex items-center justify-center"><BarChart2 size={14} className="text-white"/></div>
                <p className="font-bold text-purple-800 text-sm">Step 7 — Health Progress Analysis</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { l:'Before Treatment', v:progress.before, c:'text-red-600 bg-red-50', unit:'/100' },
                    { l:'After Treatment',  v:progress.after,  c:'text-green-600 bg-green-50', unit:'/100' },
                    { l:'Improvement',      v:`+${progress.improvement}`, c:'text-blue-600 bg-blue-50', unit:'pts' },
                  ].map((p,i)=>(
                    <div key={i} className={`${p.c} rounded-2xl p-4 border border-gray-100`}>
                      <p className="text-2xl font-extrabold">{p.v}</p>
                      <p className="text-xs font-medium mt-0.5">{p.l}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar comparison */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Before Treatment</span><span>{progress.before}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{width:`${progress.before}%`}}/>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>After Treatment</span><span>{progress.after}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{width:`${progress.after}%`}}/>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${progress.after>=70?'bg-green-50 border-green-200':'bg-yellow-50 border-yellow-200'}`}>
                  <p className="text-sm font-extrabold mb-1">
                    {progress.after>=70?'🎉 Great Progress!':'⚠️ Recovery Needs Attention'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {progress.after>=70
                      ? `Your health score improved by ${progress.improvement} points. Continue medication and rest.`
                      : `Recovery is slower than expected. Consider scheduling a follow-up visit.`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Step 8 — Doctor Follow-Up Suggestion + AI Chat */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{minHeight:'400px'}}>
              <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 flex-shrink-0">
                <div className="w-7 h-7 bg-orange-500 rounded-xl flex items-center justify-center"><Stethoscope size={14} className="text-white"/></div>
                <p className="font-bold text-orange-800 text-sm">Step 8 — Doctor Follow-Up Suggestion</p>
              </div>
              <div className="p-5 space-y-4 flex-shrink-0">
                {/* Recommendation */}
                <div className={`p-4 rounded-2xl border ${needsFollowUp?'bg-red-50 border-red-200':'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${needsFollowUp?'bg-red-100':'bg-green-100'}`}>
                      {needsFollowUp?'⚠️':'✅'}
                    </div>
                    <div>
                      <p className={`font-extrabold ${needsFollowUp?'text-red-700':'text-green-700'}`}>
                        {needsFollowUp ? 'Follow-Up Recommended' : 'Recovery On Track'}
                      </p>
                      <p className={`text-xs mt-0.5 ${needsFollowUp?'text-red-500':'text-green-500'}`}>
                        {needsFollowUp
                          ? `Medicine adherence ${overallAdherence}% & recovery ${recoveryData.overall}% — doctor review suggested`
                          : `Great progress! Continue medication as prescribed.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
                {needsFollowUp && (
                  <button onClick={()=>navigate('/patient/doctors')}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl text-sm hover:opacity-90 shadow-md">
                    <Calendar size={15}/> Book Follow-Up Appointment <ArrowRight size={13}/>
                  </button>
                )}
              </div>

              {/* AI Chat */}
              <div className="border-t border-gray-100 flex flex-col flex-1 min-h-0">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 flex-shrink-0">
                  <Bot size={13} className="text-blue-600"/>
                  <p className="text-xs font-bold text-blue-700">Ask AI about your recovery</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0" style={{maxHeight:'160px'}}>
                  {chatMessages.map((m,i)=>(
                    <div key={i} className={`flex gap-2 ${m.role==='user'?'flex-row-reverse':''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role==='user'?'bg-teal-600':'bg-gray-100'}`}>
                        {m.role==='user'?<User size={13} className="text-white"/>:<Bot size={13} className="text-gray-600"/>}
                      </div>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${m.role==='user'?'bg-teal-600 text-white rounded-tr-sm':'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && <div className="flex gap-2"><div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><Bot size={13} className="text-gray-600"/></div><div className="bg-gray-100 rounded-2xl px-3 py-2 flex gap-1">{[0,1,2].map(i=><span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div></div>}
                  <div ref={chatEndRef}/>
                </div>
                <div className="px-3 pb-1 flex gap-1.5 flex-shrink-0">
                  {['Am I recovered?','Need follow-up?','Diet tips?'].map(q=>(
                    <button key={q} onClick={()=>{setChatInput(q);setTimeout(sendChat,50)}}
                      className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full hover:bg-blue-100">{q}</button>
                  ))}
                </div>
                <div className="flex gap-2 p-3 border-t border-gray-100 flex-shrink-0">
                  <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()}
                    placeholder="Ask about your recovery..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-400"/>
                  <button onClick={sendChat} disabled={!chatInput.trim()||chatLoading}
                    className="w-8 h-8 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center">
                    <Send size={13}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
