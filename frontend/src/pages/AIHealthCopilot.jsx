import { useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Brain, Activity, Zap, Stethoscope, Video, Heart,
  AlertTriangle, ChevronRight, CheckCircle, ArrowRight,
  Loader, RefreshCw, User, Calendar, Shield, TrendingUp,
  Target, Bell, X, Send, Bot, Phone, BarChart2
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

// ── Flow steps definition ─────────────────────────────────────────
const FLOW_STEPS = [
  { n:1, label:'Patient Login',         icon:'👤', done: true },
  { n:2, label:'Copilot Dashboard',     icon:'🤖', done: true },
  { n:3, label:'Collect Health Data',   icon:'📋', done: false },
  { n:4, label:'AI Analysis Engine',    icon:'🧠', done: false },
  { n:5, label:'Insights & Risk Score', icon:'📊', done: false },
  { n:6, label:'Doctor Recommendation', icon:'👨‍⚕️', done: false },
  { n:7, label:'Consultation Support',  icon:'🎥', done: false },
  { n:8, label:'Recovery Tracking',     icon:'💪', done: false },
  { n:9, label:'Preventive Alerts',     icon:'🛡️', done: false },
]

// ── Risk color helper ─────────────────────────────────────────────
function riskStyle(level) {
  const l = level?.toLowerCase() || ''
  if (l.includes('high') || l.includes('severe') || l.includes('emergency')) return { bg:'bg-red-50', border:'border-red-300', text:'text-red-700', badge:'bg-red-100 text-red-700', color:'#ef4444' }
  if (l.includes('moderate') || l.includes('medium')) return { bg:'bg-orange-50', border:'border-orange-300', text:'text-orange-700', badge:'bg-orange-100 text-orange-700', color:'#f97316' }
  if (l.includes('mild') || l.includes('low')) return { bg:'bg-yellow-50', border:'border-yellow-200', text:'text-yellow-700', badge:'bg-yellow-100 text-yellow-700', color:'#eab308' }
  return { bg:'bg-green-50', border:'border-green-300', text:'text-green-700', badge:'bg-green-100 text-green-700', color:'#22c55e' }
}

function ScoreRing({ score, size=96, color='#0d9488' }) {
  const r = size/2-8, circ=2*Math.PI*r, dash=(score/100)*circ
  return (
    <div className="relative flex-shrink-0" style={{width:size,height:size}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="8"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-extrabold text-gray-900" style={{fontSize:size*0.21}}>{score}</span>
        <span className="text-gray-400" style={{fontSize:size*0.12}}>/100</span>
      </div>
    </div>
  )
}

export default function AIHealthCopilot() {
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const fullName = user?.full_name || 'Patient'
  const chatEndRef = useRef(null)

  // Step state
  const [currentStep, setCurrentStep] = useState(2) // 1=done (login), 2=dashboard

  // Step 3 — Collect Data
  const [symptoms,  setSymptoms]  = useState('')
  const [age,       setAge]       = useState('')
  const [gender,    setGender]    = useState('male')
  const [vitals, setVitals] = useState({ bp: '', sugar: '', weight: '', sleep: '' })
  const [duration,  setDuration]  = useState('')
  const [severity,  setSeverity]  = useState('moderate')

  // Step 4-9 results
  const [loading,   setLoading]   = useState(false)
  const [analysis,  setAnalysis]  = useState(null)
  const [riskScore, setRiskScore] = useState(null)
  const [recovery,  setRecovery]  = useState(null)

  // Chat
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput,    setChatInput]    = useState('')
  const [chatLoading,  setChatLoading]  = useState(false)

  const QUICK_SYMPTOMS = ['Fever & Headache','Chest Pain','Stomach Ache','Cold & Cough','Back Pain','Fatigue']

  // ── Step 3→4: Run full AI analysis ───────────────────────────────
  const runAnalysis = async () => {
    if (!symptoms.trim()) { toast.error('Please enter your symptoms first'); return }
    if (!age) { toast.error('Please enter your age for accurate AI analysis'); return }
    setLoading(true)
    setCurrentStep(4)

    try {
      // Step 4: AI Analysis Engine
      const res = await api.post('/ai/analyze', {
        symptoms: `${symptoms}. Vitals - BP: ${vitals.bp}, Blood Sugar: ${vitals.sugar} mg/dL, Weight: ${vitals.weight}kg, Sleep: ${vitals.sleep}hrs. Duration: ${duration||'not specified'}`,
        patient_age: parseInt(age),
        patient_gender: gender,
        severity: severity,
      })

      const data = res.data

      // Calculate risk score from analysis
      const sevLevel = data.severity_level || 'Mild'
      const score = sevLevel.includes('Emergency') ? 20
                  : sevLevel.includes('Severe')    ? 35
                  : sevLevel.includes('Moderate')  ? 60
                  : 82

      setAnalysis(data)
      setRiskScore(score)

      // Step 5 done, move to 6
      setCurrentStep(6)

      // Set recovery data
      setRecovery({
        conditions: data.possible_conditions?.slice(0,2) || [],
        precautions: data.precautions?.slice(0,3) || [],
        specialist: data.specialist_type || 'General Physician',
      })

      // Add copilot intro message to chat
      setChatMessages([{
        role: 'assistant',
        content: `✅ Analysis complete for ${fullName}! Your health score is ${score}/100 — ${sevLevel} level. I detected possible: ${data.possible_conditions?.[0]?.name||'General Health Issue'}. I recommend seeing a ${data.specialist_type||'General Physician'}. Ask me anything about your results!`
      }])

      toast.success('AI Analysis complete!')
    } catch (e) {
      toast.error('Analysis failed — check connection')
      setCurrentStep(3)
    } finally {
      setLoading(false)
    }
  }

  // ── Chat with copilot ─────────────────────────────────────────────
  const sendChat = async (forcedMsg) => {
    const msg = (forcedMsg ?? chatInput).trim()
    if (!msg || chatLoading) return
    if (!forcedMsg) setChatInput('')
    const newHistory = [...chatMessages, { role:'user', content:msg }]
    setChatMessages(newHistory)
    setChatLoading(true)
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior:'smooth' }), 50)
    try {
      const res = await api.post('/ai/chat', {
        message: msg,
        history: newHistory.slice(-8),
        report_context: analysis ? JSON.stringify({ analysis, vitals, symptoms }) : undefined
      })
      setChatMessages(h => [...h, { role:'assistant', content: res.data?.response || 'Please consult your doctor.' }])
    } catch {
      setChatMessages(h => [...h, { role:'assistant', content: 'Connection error. Please try again.' }])
    } finally {
      setChatLoading(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior:'smooth' }), 50)
    }
  }

  const risk = analysis ? riskStyle(analysis.severity_level) : riskStyle('normal')

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">

        {/* ── HEADER ── */}
        <div className="bg-gradient-to-r from-violet-700 via-indigo-600 to-teal-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Brain size={24} className="text-white"/>
            </div>
            <div>
              <h1 className="text-xl font-extrabold">AI Health Copilot</h1>
              <p className="text-indigo-200 text-xs">Your AI-powered personal health assistant</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
              <span className="text-white text-xs font-semibold">Active</span>
            </div>
          </div>

          {/* Flow Steps */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {FLOW_STEPS.map((s,i)=>(
              <div key={s.n} className="flex items-center gap-1 flex-shrink-0">
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentStep > s.n  ? 'bg-white/30 text-white'       :
                  currentStep === s.n ? 'bg-white text-indigo-700 shadow-md' :
                  'bg-white/10 text-white/50'
                }`}>
                  {currentStep > s.n ? <CheckCircle size={11}/> : <span>{s.icon}</span>}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < FLOW_STEPS.length-1 && <ArrowRight size={10} className="text-white/30 flex-shrink-0"/>}
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════
            STEP 2 — COPILOT DASHBOARD (always shown)
        ════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Welcome card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Brain size={26} className="text-white"/>
                </div>
                <div>
                  <h2 className="font-extrabold text-gray-900 text-lg">Good day, {fullName}! 👋</h2>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">Your AI Health Copilot is ready. I will guide you through a complete health analysis — from collecting your symptoms to recommending the right doctor and tracking your recovery.</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {['Symptom Analysis','Risk Assessment','Doctor Match','Recovery Plan'].map((t,i)=>(
                      <span key={i} className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={()=>setCurrentStep(3)}
                className="mt-5 w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg text-sm">
                <Zap size={18}/> Start AI Health Analysis <ArrowRight size={16}/>
              </button>
            </div>

            {/* Flow overview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="font-bold text-gray-800 mb-4 text-sm">Copilot Workflow</p>
              <div className="space-y-2.5">
                {FLOW_STEPS.slice(2).map((s,i)=>(
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${i===0?'bg-violet-100':'bg-gray-100'}`}>{s.icon}</div>
                    <div className="flex-1">
                      <p className={`text-xs font-bold ${i===0?'text-violet-700':'text-gray-600'}`}>{s.label}</p>
                    </div>
                    {i===0 && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">Next</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            STEP 3 — COLLECT PATIENT HEALTH DATA
        ════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-indigo-100 flex items-center gap-2">
                <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center"><Activity size={16} className="text-white"/></div>
                <div>
                  <p className="font-bold text-violet-800">Step 3 — Collect Health Data</p>
                  <p className="text-xs text-violet-500">Tell me about your current health</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-2 block">Describe Your Symptoms *</label>
                  <textarea value={symptoms} onChange={e=>setSymptoms(e.target.value)} rows={4}
                    className="input-field text-sm resize-none w-full"
                    placeholder="e.g. I have fever for 2 days, headache, body pain, feeling very tired..."/>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {QUICK_SYMPTOMS.map(s=>(
                      <button key={s} onClick={()=>setSymptoms(s)}
                        className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-full hover:bg-violet-100 transition-colors font-medium">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                      Age <span className="text-red-500">*</span>
                      <span className="text-xs font-normal text-gray-400">(required)</span>
                    </label>
                    <input
                      type="number" min="1" max="120"
                      value={age} onChange={e=>setAge(e.target.value)}
                      placeholder="e.g. 25"
                      className={`input-field ${!age ? 'border-red-300 focus:border-red-400' : 'border-green-300'}`}
                    />
                    {!age && <p className="text-xs text-red-500 mt-1 flex items-center gap-1">⚠ Age required for age-specific diagnosis</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Gender</label>
                    <select value={gender} onChange={e=>setGender(e.target.value)} className="input-field">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Duration</label>
                    <input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="e.g. 2 days" className="input-field text-sm"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Severity</label>
                    <select value={severity} onChange={e=>setSeverity(e.target.value)} className="input-field">
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-teal-50 border-b border-blue-100 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center"><Heart size={16} className="text-white"/></div>
                  <p className="font-bold text-blue-800 text-sm">Current Vitals (Optional)</p>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3">
                  {[
                    { k:'bp',     label:'Blood Pressure', ph:'120/80', u:'mmHg' },
                    { k:'sugar',  label:'Blood Sugar',    ph:'98',     u:'mg/dL' },
                    { k:'weight', label:'Weight',         ph:'65',     u:'kg' },
                    { k:'sleep',  label:'Sleep (hrs)',    ph:'7',      u:'hrs' },
                  ].map(v=>(
                    <div key={v.k}>
                      <label className="text-xs text-gray-500 mb-1 block">{v.label}</label>
                      <div className="relative">
                        <input value={vitals[v.k]} onChange={e=>setVitals(p=>({...p,[v.k]:e.target.value}))}
                          placeholder={v.ph} className="input-field pr-10 text-sm"/>
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">{v.u}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-violet-700 mb-2">What AI will analyze:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {['Symptom patterns','Risk level assessment','Possible conditions','SHAP explainability','Specialist recommendation','Precautions & next steps'].map((t,i)=>(
                    <p key={i} className="text-xs text-violet-600 flex items-center gap-1.5"><CheckCircle size={10} className="text-violet-500 flex-shrink-0"/>{t}</p>
                  ))}
                </div>
              </div>

              <button onClick={runAnalysis} disabled={!symptoms.trim() || !age}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-extrabold rounded-2xl flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-lg text-sm">
                <Brain size={20}/> Run AI Analysis Engine <ArrowRight size={16}/>
              </button>
              {!age && symptoms.trim() && (
                <p className="text-center text-xs text-red-500 font-semibold">Enter your age to enable analysis</p>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            STEP 4 — LOADING / ANALYZING
        ════════════════════════════════════════════ */}
        {(loading || currentStep === 4) && loading && (
          <div className="bg-white rounded-2xl border border-indigo-100 p-10 text-center">
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 border-4 border-violet-200 rounded-full animate-ping opacity-40"/>
              <div className="w-full h-full bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center">
                <Brain size={30} className="text-white animate-pulse"/>
              </div>
            </div>
            <p className="font-extrabold text-gray-900 text-lg mb-2">AI Analysis Engine Running...</p>
            <p className="text-sm text-indigo-600 mb-5">Analyzing symptoms • Calculating risk • Finding patterns</p>
            <div className="space-y-2 max-w-sm mx-auto text-left">
              {['Step 3: Health data collected ✅','Step 4: AI analyzing symptoms...','Step 5: Generating risk scores...','Step 6: Matching doctors...'].map((s,i)=>(
                <div key={i} className={`flex items-center gap-2 text-xs ${i===1?'text-violet-700 font-bold animate-pulse':i<1?'text-green-600':'text-gray-300'}`}>
                  <div className={`w-2 h-2 rounded-full ${i===1?'bg-violet-500 animate-pulse':i<1?'bg-green-500':'bg-gray-200'}`}/>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            STEPS 5-9 — RESULTS (after analysis)
        ════════════════════════════════════════════ */}
        {analysis && !loading && (
          <div className="space-y-5">

            {/* ── STEP 5: Insights & Risk Score ── */}
            <div className={`rounded-2xl border-2 p-5 ${risk.bg} ${risk.border}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-white rounded-xl flex items-center justify-center shadow-sm"><BarChart2 size={15} style={{color:risk.color}}/></div>
                <p className="font-bold text-gray-800 text-sm">Step 5 — AI Insights & Risk Score</p>
                <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${risk.badge}`}>{analysis.severity_level}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {riskScore !== null && (
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <ScoreRing score={riskScore} size={100} color={risk.color}/>
                    <p className="text-xs font-bold" style={{color:risk.color}}>Health Score</p>
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  {/* Possible conditions */}
                  {analysis.possible_conditions?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-700 mb-2">Possible Conditions</p>
                      <div className="space-y-2">
                        {analysis.possible_conditions.slice(0,3).map((c,i)=>(
                          <div key={i} className="flex items-center gap-3 bg-white/70 rounded-xl px-3 py-2">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i===0?'bg-red-400':i===1?'bg-orange-400':'bg-yellow-400'}`}/>
                            <span className="text-sm font-semibold text-gray-800 flex-1">{c.name}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-violet-500 rounded-full" style={{width:`${c.confidence||70}%`}}/>
                              </div>
                              <span className="text-xs text-gray-500 w-8">{c.confidence||70}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SHAP insights */}
                  {analysis.shap_insights?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-700 mb-2">AI Explainability (SHAP)</p>
                      <div className="space-y-1.5">
                        {analysis.shap_insights.slice(0,3).map((s,i)=>(
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-24 flex-shrink-0 truncate">{s.symptom}</span>
                            <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500 rounded-full" style={{width:`${s.importance}%`}}/>
                            </div>
                            <span className="text-xs font-bold text-gray-600 w-8">{s.importance}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── STEPS 6+7+8+9 in grid ── */}
            <div className="grid lg:grid-cols-2 gap-5">

              {/* Step 6 — Doctor Recommendation */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                  <div className="w-7 h-7 bg-orange-500 rounded-xl flex items-center justify-center"><Stethoscope size={14} className="text-white"/></div>
                  <p className="font-bold text-orange-800 text-sm">Step 6 — Doctor Recommendation</p>
                </div>
                <div className="p-5 space-y-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {analysis.specialist_type?.charAt(0)||'D'}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Based on your analysis, consult a</p>
                      <p className="font-extrabold text-gray-900 text-base">{analysis.specialist_type||'General Physician'}</p>
                      {analysis.brief_assessment && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{analysis.brief_assessment}</p>}
                    </div>
                  </div>
                  {analysis.precautions?.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                      <p className="text-xs font-bold text-yellow-700 mb-2">Immediate Precautions</p>
                      {analysis.precautions.slice(0,3).map((p,i)=>(
                        <p key={i} className="text-xs text-yellow-700 flex gap-1.5 mb-1"><span>•</span>{p}</p>
                      ))}
                    </div>
                  )}

                  {/* ── Suggested Tests ── */}
                  {analysis.suggested_tests?.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1.5">
                        🧪 Suggested Tests
                      </p>
                      <div className="space-y-2">
                        {analysis.suggested_tests.slice(0,4).map((t,i)=>(
                          <div key={i} className="flex items-start gap-2 bg-white/70 rounded-lg p-2">
                            <span className="text-sm flex-shrink-0">
                              {t.type==='Blood'?'🩸':t.type==='Imaging'?'🫁':t.type==='ECG'?'💓':t.type==='Urine'?'🔬':'🧪'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-800">{t.name}</p>
                              <p className="text-xs text-gray-500 leading-tight">{t.reason}</p>
                            </div>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                              t.urgency==='Urgent' ? 'bg-red-100 text-red-700' :
                              t.urgency==='Soon'   ? 'bg-orange-100 text-orange-700' :
                                                     'bg-green-100 text-green-700'
                            }`}>{t.urgency}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={()=>navigate('/patient/doctors')}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl text-sm hover:opacity-90 shadow-md">
                    <Calendar size={15}/> Book Appointment <ArrowRight size={13}/>
                  </button>
                </div>
              </div>

              {/* Step 7 — Consultation Support (AI Chat) */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{maxHeight:'380px'}}>
                <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex-shrink-0">
                  <div className="w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center"><Bot size={14} className="text-white"/></div>
                  <div>
                    <p className="font-bold text-blue-800 text-sm">Step 7 — Consultation Support</p>
                    <p className="text-xs text-blue-400">AI copilot knows your full analysis</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">
                      <Bot size={28} className="mx-auto mb-2 opacity-30"/>
                      <p className="text-xs">Run analysis first to activate AI chat</p>
                    </div>
                  ) : chatMessages.map((m,i)=>(
                    <div key={i} className={`flex gap-2 ${m.role==='user'?'flex-row-reverse':''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role==='user'?'bg-indigo-600':'bg-gray-100'}`}>
                        {m.role==='user'?<User size={13} className="text-white"/>:<Bot size={13} className="text-gray-600"/>}
                      </div>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${m.role==='user'?'bg-indigo-600 text-white rounded-tr-sm':'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && <div className="flex gap-2"><div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><Bot size={13} className="text-gray-600"/></div><div className="bg-gray-100 rounded-2xl px-3 py-2 flex gap-1">{[0,1,2].map(i=><span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div></div>}
                  <div ref={chatEndRef}/>
                </div>
                {chatMessages.length > 0 && (
                  <div className="px-3 pb-1 flex flex-wrap gap-1 flex-shrink-0">
                    {['What should I eat?','How serious is this?','Any home remedies?'].map(q=>(
                      <button key={q} onClick={()=>sendChat(q)}
                        className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full font-medium">{q}</button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 p-3 border-t border-gray-100 flex-shrink-0">
                  <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()}
                    placeholder={analysis?"Ask about your results...":"Run analysis first..."}
                    disabled={!analysis}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-400 disabled:opacity-50"/>
                  <button onClick={sendChat} disabled={!chatInput.trim()||chatLoading||!analysis}
                    className="w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center">
                    <Send size={13}/>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 8 + 9 */}
            <div className="grid lg:grid-cols-2 gap-5">

              {/* Step 8 — Recovery Tracking */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                  <div className="w-7 h-7 bg-green-600 rounded-xl flex items-center justify-center"><TrendingUp size={14} className="text-white"/></div>
                  <p className="font-bold text-green-800 text-sm">Step 8 — Recovery Tracking</p>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-16 h-16">
                      <svg viewBox="0 0 64 64" className="-rotate-90 w-full h-full">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                        <circle cx="32" cy="32" r="26" fill="none" stroke="#22c55e" strokeWidth="8" strokeDasharray="98 163" strokeLinecap="round"/>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-sm font-extrabold text-green-600">60%</span></div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Recovery Started</p>
                      <p className="text-xs text-gray-400">Based on your analysis</p>
                    </div>
                  </div>
                  {recovery?.conditions?.length > 0 && (
                    <div className="space-y-2">
                      {recovery.conditions.map((c,i)=>(
                        <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                          <span className="text-sm">💊</span>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-gray-800">{c.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{width:`${40+i*15}%`}}/></div>
                              <span className="text-xs text-green-600 font-bold">{40+i*15}%</span>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${i===0?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{i===0?'Good':'Moderate'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {recovery?.precautions?.length > 0 && (
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                      <p className="text-xs font-bold text-teal-700 mb-1.5">Recovery Tips</p>
                      {recovery.precautions.map((p,i)=><p key={i} className="text-xs text-teal-600 mb-1">✓ {p}</p>)}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 9 — Preventive Healthcare Alerts */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
                  <div className="w-7 h-7 bg-purple-600 rounded-xl flex items-center justify-center"><Shield size={14} className="text-white"/></div>
                  <p className="font-bold text-purple-800 text-sm">Step 9 — Preventive Healthcare Alerts</p>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { icon:'🩸', title:'Blood Test Due',          desc:'Your last test was 6+ months ago',  btn:'Book Test',  color:'bg-red-50 border-red-200 text-red-700',    urgent:true },
                    { icon:'💉', title:'Vaccination Reminder',    desc:'Annual flu vaccine recommended',     btn:'Schedule',   color:'bg-blue-50 border-blue-200 text-blue-700',   urgent:false },
                    { icon:'👁️',  title:'Eye Check-Up',           desc:'Annual eye exam recommended',       btn:'Book Now',   color:'bg-orange-50 border-orange-200 text-orange-700', urgent:false },
                    { icon:'🦷', title:'Dental Check-Up',        desc:'6-month check-up overdue',          btn:'Book Now',   color:'bg-yellow-50 border-yellow-200 text-yellow-700', urgent:true },
                  ].map((a,i)=>(
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${a.color}`}>
                      <span className="text-xl flex-shrink-0">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold">{a.title}{a.urgent&&<span className="ml-1 text-xs bg-red-100 text-red-600 px-1 rounded">Urgent</span>}</p>
                        <p className="text-xs opacity-70">{a.desc}</p>
                      </div>
                      <button onClick={()=>navigate('/patient/doctors')} className="text-xs font-bold underline flex-shrink-0">{a.btn}</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Restart button */}
            <div className="text-center">
              <button onClick={()=>{setCurrentStep(3);setAnalysis(null);setRiskScore(null);setChatMessages([]);setSymptoms('')}}
                className="flex items-center gap-2 mx-auto text-sm text-violet-600 font-semibold hover:underline">
                <RefreshCw size={14}/> Start New Analysis
              </button>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
