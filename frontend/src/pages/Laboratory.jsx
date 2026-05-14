import { useState, useRef, useEffect } from 'react'
import {
  Upload, Bot, Loader, X, Save, CheckCircle, AlertCircle,
  Send, User, Calendar, Stethoscope, Heart, TrendingUp,
  TrendingDown, Minus, ArrowRight, Brain, Zap, RefreshCw,
  Scale, Camera, ChevronRight, Star, FolderOpen, FileText,
  Activity, Scan, BarChart2, MessageSquare, Microscope
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

// ── Helpers ───────────────────────────────────────────────────────
function compressImage(base64, maxWidth = 1600, quality = 0.92) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidth) { height = Math.round(height * maxWidth / width); width = maxWidth }
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = base64
  })
}

const STATUS_STYLE = {
  high:    { cls: 'bg-red-50 border-red-200 text-red-700',      icon: <TrendingUp size={11}/>,   label: 'HIGH' },
  low:     { cls: 'bg-blue-50 border-blue-200 text-blue-700',   icon: <TrendingDown size={11}/>, label: 'LOW' },
  normal:  { cls: 'bg-green-50 border-green-200 text-green-700',icon: <Minus size={11}/>,        label: 'NORMAL' },
  unknown: { cls: 'bg-gray-50 border-gray-200 text-gray-600',   icon: <Minus size={11}/>,        label: '–' },
}

const BMI_RANGES = [
  { max: 18.5, label: 'Underweight',  color: '#3b82f6', text: 'text-blue-600' },
  { max: 24.9, label: 'Normal',       color: '#22c55e', text: 'text-green-600' },
  { max: 29.9, label: 'Overweight',   color: '#f97316', text: 'text-orange-600' },
  { max: 999,  label: 'Obese',        color: '#ef4444', text: 'text-red-600' },
]

function calcBMI(w, h, age, gender) {
  const hm = h / 100, bmi = w / (hm * hm)
  const range = BMI_RANGES.find(r => bmi <= r.max) || BMI_RANGES[3]
  const bmr = gender === 'male' ? Math.round(88.36 + 13.4*w + 4.8*h - 5.7*age) : Math.round(447.6 + 9.2*w + 3.1*h - 4.3*age)
  const idealLow = Math.round(18.5*hm*hm*10)/10, idealHigh = Math.round(24.9*hm*hm*10)/10
  const bodyFat = gender === 'male' ? Math.round((1.20*bmi + 0.23*age - 16.2)*10)/10 : Math.round((1.20*bmi + 0.23*age - 5.4)*10)/10
  return { bmi: bmi.toFixed(1), range, bmr, idealRange: `${idealLow}–${idealHigh}`, bodyFat }
}

function calcScore(data) {
  if (!data?.parameters?.length) return 72
  const ok = data.parameters.filter(p => p.status === 'normal').length
  const base = Math.round((ok / data.parameters.length) * 100)
  const sev = data.severity || ''
  return Math.max(10, Math.min(100, base - (sev.includes('Urgent')?30:sev.includes('Moderate')?15:sev.includes('Mild')?8:0)))
}

// ── Health Score Circle ───────────────────────────────────────────
function ScoreCircle({ score, size = 96 }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'
  const label = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Low'
  const r = size/2 - 8, circ = 2*Math.PI*r, dash = (score/100)*circ
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{width:size,height:size}}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="8"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-extrabold text-gray-900" style={{fontSize:size*0.22}}>{score}%</span>
        </div>
      </div>
      <span className="text-xs font-bold mt-1" style={{color}}>{label}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// TAB 1 — SYMPTOM CHECKER
// ═══════════════════════════════════════════════════
function SymptomsTab() {
  const navigate = useNavigate()
  const [symptoms, setSymptoms] = useState('')
  const [age, setAge]           = useState('')
  const [gender, setGender]     = useState('male')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const QUICK = ['Fever, cough, headache','Chest pain, shortness of breath','Stomach pain, nausea','Joint pain, fatigue']

  const analyze = async () => {
    if (!symptoms.trim()) { toast.error('Enter your symptoms'); return }
    setLoading(true); setResult(null)
    try {
      const res = await api.post('/ai/analyze', { symptoms, patient_age: parseInt(age)||25, patient_gender: gender })
      setResult(res.data)
      toast.success('AI Analysis complete!')
    } catch { toast.error('Analysis failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><Activity size={15} className="text-teal-600"/>Enter Symptoms</h3>
        <textarea value={symptoms} onChange={e=>setSymptoms(e.target.value)} rows={3}
          className="input-field text-sm resize-none" placeholder="Describe your symptoms... e.g. Fever, cough, headache"/>
        <div className="flex flex-wrap gap-2">
          {QUICK.map(q=><button key={q} onClick={()=>setSymptoms(q)}
            className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full hover:bg-teal-100 transition-colors">{q}</button>)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Age</label>
            <input type="number" value={age} onChange={e=>setAge(e.target.value)} placeholder="25" className="input-field"/>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Gender</label>
            <select value={gender} onChange={e=>setGender(e.target.value)} className="input-field">
              <option value="male">Male</option><option value="female">Female</option>
            </select>
          </div>
        </div>
        <button onClick={analyze} disabled={!symptoms.trim()||loading}
          className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
          {loading ? <><Loader size={15} className="animate-spin"/>Analyzing...</> : <><Zap size={15}/>Analyze</>}
        </button>
      </div>

      {result && (
        <div className="space-y-3">
          <div className={`bg-white rounded-2xl border-2 p-4 ${result.severity_level==='Emergency'?'border-red-300':result.severity_level==='Severe'?'border-orange-300':result.severity_level==='Moderate'?'border-yellow-300':'border-green-300'}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-800 text-sm">AI Prediction</p>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${result.severity_level==='Emergency'?'bg-red-100 text-red-700':result.severity_level==='Severe'?'bg-orange-100 text-orange-700':result.severity_level==='Moderate'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>
                {result.severity_level}
              </span>
            </div>
            {result.possible_conditions?.slice(0,3).map((c,i)=>(
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${i===0?'bg-teal-500':i===1?'bg-blue-400':'bg-gray-300'}`}/>
                  <span className="text-sm font-medium text-gray-800">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{width:`${c.confidence||60}%`}}/>
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{c.confidence||60}%</span>
                </div>
              </div>
            ))}
          </div>

          {result.shap_insights?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-blue-700 mb-2">AI Insights (SHAP)</p>
              {result.shap_insights.slice(0,3).map((s,i)=>(
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs text-blue-600 w-28 truncate">{s.symptom}</span>
                  <div className="flex-1 h-1.5 bg-blue-100 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{width:`${s.importance}%`}}/></div>
                  <span className="text-xs text-blue-600 w-8 text-right">{s.importance}%</span>
                </div>
              ))}
            </div>
          )}

          {result.precautions?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-700 mb-1">Recommended</p>
              {result.precautions.slice(0,3).map((p,i)=><p key={i} className="text-xs text-amber-700">• {p}</p>)}
            </div>
          )}

          <button onClick={()=>navigate('/patient/doctors')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-bold rounded-xl text-sm">
            <Stethoscope size={15}/> View Doctors <ArrowRight size={14}/>
          </button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// TAB 2 — REPORT ANALYZER
// ═══════════════════════════════════════════════════
function ReportsTab() {
  const navigate  = useNavigate()
  const [image,   setImage]   = useState(null)
  const [preview, setPreview] = useState(null)
  const [textVal, setTextVal] = useState('')
  const [mode,    setMode]    = useState('image')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [score,   setScore]   = useState(null)
  const [saved,   setSaved]   = useState(false)
  const [chat,    setChat]    = useState([])
  const [chatMsg, setChatMsg] = useState('')
  const [chatL,   setChatL]   = useState(false)
  const chatRef = useRef(null)

  const handleFile = e => {
    const f = e.target.files[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = ev => { setImage(ev.target.result); setPreview(ev.target.result); setResult(null); setSaved(false); setChat([]) }
    reader.readAsDataURL(f)
  }

  const analyze = async () => {
    setLoading(true); setResult(null); setScore(null); setSaved(false); setChat([])
    try {
      let data
      if (mode === 'image') {
        const comp = await compressImage(image)
        const res = await api.post('/ai/analyze-report', { image_base64: comp }, { timeout: 60000 })
        if (res.data.success) data = res.data.data
        else { toast.error(res.data.error||'Failed'); setLoading(false); return }
      } else {
        const res = await api.post('/ai/analyze-report-text', { description: textVal }, { timeout: 30000 })
        if (res.data.success) data = res.data.data
        else { toast.error('Failed'); setLoading(false); return }
      }
      setResult(data); setScore(calcScore(data))
      setChat([{ role:'assistant', content:`✅ ${data.report_type||'Report'} analyzed! Score: ${calcScore(data)}/100. ${data.overall_summary||''} Ask me anything!` }])
      toast.success('Analysis complete!')
    } catch { toast.error('Failed — check connection') }
    finally { setLoading(false) }
  }

  const sendChat = async () => {
    if (!chatMsg.trim()||chatL) return
    const msg = chatMsg.trim(); setChatMsg('')
    const newH = [...chat, {role:'user',content:msg}]; setChat(newH); setChatL(true)
    setTimeout(()=>chatRef.current?.scrollIntoView({behavior:'smooth'}),50)
    try {
      const res = await api.post('/ai/chat', { message:msg, history:newH.slice(-10), report_context: result?JSON.stringify(result):undefined })
      setChat(h=>[...h,{role:'assistant',content:res.data.response||'Please consult your doctor.'}])
    } catch { setChat(h=>[...h,{role:'assistant',content:'Error. Try again.'}]) }
    finally { setChatL(false); setTimeout(()=>chatRef.current?.scrollIntoView({behavior:'smooth'}),50) }
  }

  const save = async () => {
    try {
      await api.post('/health-records/', { title:result?.report_type||'Lab Report', record_type:'lab_report',
        description:[result?.overall_summary, score?`Score: ${score}/100`:''].filter(Boolean).join('\n'),
        file_data:image||null, date:new Date().toISOString().split('T')[0] })
      setSaved(true); toast.success('Saved to Health Records!')
    } catch { toast.error('Could not save') }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {[{id:'image',label:'📷 Upload Report'},{id:'text',label:'📝 Enter Values'}].map(t=>(
            <button key={t.id} onClick={()=>setMode(t.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode===t.id?'bg-white shadow text-teal-700':'text-gray-500'}`}>{t.label}</button>
          ))}
        </div>

        {mode==='image' ? (
          <>
            <label className={`block border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${preview?'border-teal-400':'border-gray-200 hover:border-teal-400'}`}>
              {preview ? (
                <div className="relative inline-block">
                  <img src={preview} alt="Report" className="max-h-36 mx-auto rounded-xl object-contain"/>
                  <button onClick={e=>{e.preventDefault();setImage(null);setPreview(null)}} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow"><X size={11}/></button>
                </div>
              ) : <><Upload size={24} className="mx-auto text-teal-400 mb-2"/><p className="text-sm text-gray-500">Upload blood test, ECG, etc.</p></>}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile}/>
            </label>
            <label className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-gray-200 hover:border-teal-400 text-gray-500 text-xs cursor-pointer transition-all">
              <Camera size={13}/> Take Photo
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile}/>
            </label>
          </>
        ) : (
          <textarea value={textVal} onChange={e=>setTextVal(e.target.value)} rows={5} className="input-field text-sm resize-none"
            placeholder={`Hemoglobin: 9.5 g/dL\nBlood Sugar: 126 mg/dL\nWBC: 7200\n...`}/>
        )}

        <button onClick={analyze} disabled={mode==='image'?!image:!textVal.trim()||loading}
          className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 text-sm">
          {loading?<><Loader size={15} className="animate-spin"/>AI Analyzing...</>:<><Microscope size={15}/>AI Analyze Report</>}
        </button>
      </div>

      {result && (
        <div className="space-y-3">
          {/* Score + Parameters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex gap-4 items-start">
              {score!==null && <ScoreCircle score={score} size={80}/>}
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-500 mb-1">{result.report_type}</p>
                {result.overall_summary && <p className="text-xs text-gray-600 leading-relaxed mb-2">{result.overall_summary}</p>}
                <div className="grid grid-cols-2 gap-1.5">
                  {result.parameters?.slice(0,4).map((p,i)=>{
                    const s=STATUS_STYLE[p.status]||STATUS_STYLE.unknown
                    return (
                      <div key={i} className={`border rounded-xl p-2 ${s.cls}`}>
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-semibold text-xs truncate">{p.name}</p>
                          <span className="text-xs font-bold px-1 py-0.5 rounded bg-white/60 flex-shrink-0">{s.label}</span>
                        </div>
                        {p.value && <p className="font-extrabold text-sm">{p.value} <span className="text-xs font-normal opacity-60">{p.unit}</span></p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          {(result.concerns?.length>0||result.recommendations?.length>0) && (
            <div className="grid grid-cols-2 gap-2">
              {result.concerns?.length>0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-700 mb-1">⚠️ AI Insights</p>
                  {result.concerns.slice(0,2).map((c,i)=><p key={i} className="text-xs text-red-600">• {c}</p>)}
                </div>
              )}
              {result.recommendations?.length>0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-700 mb-1">✓ Recommended</p>
                  {result.recommendations.slice(0,2).map((r,i)=><p key={i} className="text-xs text-green-600">• {r}</p>)}
                </div>
              )}
            </div>
          )}

          {/* Mini Chat */}
          {chat.length>0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                <Bot size={14} className="text-blue-600"/><p className="text-xs font-bold text-blue-700">Ask AI about results</p>
              </div>
              <div className="p-3 max-h-40 overflow-y-auto space-y-2">
                {chat.slice(-4).map((m,i)=>(
                  <div key={i} className={`flex gap-1.5 ${m.role==='user'?'flex-row-reverse':''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${m.role==='user'?'bg-teal-600':'bg-gray-100'}`}>
                      {m.role==='user'?<User size={11} className="text-white"/>:<Bot size={11} className="text-gray-600"/>}
                    </div>
                    <div className={`max-w-[78%] rounded-xl px-2.5 py-1.5 text-xs ${m.role==='user'?'bg-teal-600 text-white':'bg-gray-100 text-gray-800'}`}>{m.content}</div>
                  </div>
                ))}
                {chatL && <div className="flex gap-1.5"><div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"><Bot size={11} className="text-gray-600"/></div><div className="bg-gray-100 rounded-xl px-2.5 py-1.5 flex gap-0.5">{[0,1,2].map(i=><span key={i} className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div></div>}
                <div ref={chatRef}/>
              </div>
              <div className="flex gap-2 p-2 border-t border-gray-100">
                <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()}
                  placeholder="Ask anything..." className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"/>
                <button onClick={sendChat} disabled={!chatMsg.trim()||chatL} className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center disabled:opacity-40"><Send size={12} className="text-white"/></button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {result.doctor_to_consult && (
              <button onClick={()=>navigate('/patient/doctors')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold">
                <Stethoscope size={13}/> {result.doctor_to_consult}
              </button>
            )}
            <button onClick={save} disabled={saved} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold ${saved?'bg-green-100 text-green-700 border border-green-300':'bg-teal-600 text-white'}`}>
              {saved?<><CheckCircle size={13}/>Saved</>:<><Save size={13}/>Save Report</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// TAB 3 — SKIN SCAN (CNN)
// ═══════════════════════════════════════════════════
const SKIN_PROMPT = `You are a dermatology AI. Analyze this skin image carefully.
Return ONLY valid JSON (no markdown):
{
  "condition": "Most likely skin condition name",
  "confidence": 87,
  "risk_level": "Low or Medium or High",
  "description": "Brief plain-language description of what you see",
  "symptoms": ["visible symptom 1", "visible symptom 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "doctor_to_consult": "Dermatologist or General Physician",
  "urgency": "Routine or Soon or Urgent"
}`

function SkinScanTab() {
  const navigate  = useNavigate()
  const [image,   setImage]   = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)

  const handleFile = e => {
    const f = e.target.files[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = ev => { setImage(ev.target.result); setPreview(ev.target.result); setResult(null) }
    reader.readAsDataURL(f)
  }

  const analyze = async () => {
    if (!image) { toast.error('Upload a skin image'); return }
    setLoading(true); setResult(null)
    try {
      const comp = await compressImage(image, 1024, 0.88)
      const res = await api.post('/ai/analyze-report', { image_base64: comp }, { timeout: 60000 })
      if (res.data.success) {
        const d = res.data.data
        setResult({
          condition: d.report_type || 'Skin Condition',
          confidence: d.parameters?.[0]?.value || 88,
          risk_level: d.severity?.includes('Urgent')?'High':d.severity?.includes('Moderate')?'Medium':'Low',
          description: d.overall_summary || '',
          recommendations: d.recommendations || [],
          doctor_to_consult: d.doctor_to_consult || 'Dermatologist',
          urgency: d.severity?.includes('Urgent')?'Urgent':'Routine',
        })
        toast.success('Skin analysis complete!')
      } else toast.error(res.data.error||'Analysis failed')
    } catch { toast.error('Analysis failed') }
    finally { setLoading(false) }
  }

  const riskColor = { Low:'text-green-600 bg-green-50 border-green-200', Medium:'text-orange-600 bg-orange-50 border-orange-200', High:'text-red-600 bg-red-50 border-red-200' }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><Scan size={15} className="text-purple-600"/>Upload Skin Image</h3>
        <label className={`block border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${preview?'border-purple-400':'border-gray-200 hover:border-purple-400'}`}>
          {preview ? (
            <div className="relative inline-block">
              <img src={preview} alt="Skin" className="max-h-40 mx-auto rounded-xl object-contain"/>
              <button onClick={e=>{e.preventDefault();setImage(null);setPreview(null)}} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow"><X size={11}/></button>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 bg-purple-50 border-2 border-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-2"><Scan size={20} className="text-purple-500"/></div>
              <p className="text-sm font-semibold text-gray-700">Upload skin photo</p>
              <p className="text-xs text-gray-400 mt-0.5">Rash, wound, mole, skin condition</p>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile}/>
        </label>
        <label className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-gray-200 hover:border-purple-400 text-gray-500 text-xs cursor-pointer transition-all">
          <Camera size={13}/> Take Photo of Skin
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile}/>
        </label>
        <button onClick={analyze} disabled={!image||loading}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-violet-500 text-white font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 text-sm">
          {loading?<><Loader size={15} className="animate-spin"/>AI Analyzing Skin...</>:<><Scan size={15}/>Analyze Image</>}
        </button>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-2.5 text-xs text-purple-600">
          💡 AI uses CNN model to detect skin conditions like eczema, psoriasis, acne, rashes, and more.
        </div>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-800">Prediction</p>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${riskColor[result.risk_level]||riskColor.Low}`}>Risk: {result.risk_level}</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <p className="font-extrabold text-gray-900 text-lg">{result.condition}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full"><div className="h-full bg-purple-500 rounded-full" style={{width:`${result.confidence}%`}}/></div>
                  <span className="text-xs text-gray-500">Confidence: {result.confidence}%</span>
                </div>
              </div>
            </div>
            {result.description && <p className="text-xs text-gray-600 bg-gray-50 rounded-xl p-2.5">{result.description}</p>}
          </div>

          {result.recommendations?.length>0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-purple-700 mb-2">Recommended</p>
              {result.recommendations.map((r,i)=><p key={i} className="text-xs text-purple-600 mb-1">• {r}</p>)}
            </div>
          )}

          <div className="flex gap-2">
            <span className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border ${riskColor[result.urgency==='Urgent'?'High':result.urgency==='Soon'?'Medium':'Low']}`}>
              {result.urgency === 'Urgent' ? '🚨' : result.urgency === 'Soon' ? '⚠️' : '✅'} {result.urgency}
            </span>
            <button onClick={()=>navigate('/patient/doctors')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold">
              <Stethoscope size={13}/> Consult {result.doctor_to_consult}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// TAB 4 — BMI & METRICS
// ═══════════════════════════════════════════════════
function BMITab() {
  const [w, setW] = useState(''), [h, setH] = useState(''), [age, setAge] = useState(''), [gender, setGender] = useState('male')
  const [result, setResult] = useState(null)
  const [advice, setAdvice] = useState(null)
  const [loading, setLoading] = useState(false)

  const calculate = async () => {
    if (!w||!h) { toast.error('Enter weight and height'); return }
    const data = calcBMI(parseFloat(w), parseFloat(h), parseInt(age)||25, gender)
    setResult(data); setAdvice(null); setLoading(true)
    try {
      const res = await api.post('/extras/bmi-advice', { bmi:parseFloat(data.bmi), category:data.range.label, bmr:data.bmr, age:parseInt(age)||25, gender, weight_kg:parseFloat(w), height_cm:parseFloat(h) })
      if (res.data.success) setAdvice(res.data.data)
    } catch {} finally { setLoading(false) }
  }

  const bmiPct = result ? Math.min(100, Math.max(0, ((parseFloat(result.bmi)-10)/30)*100)) : 0

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><Scale size={15} className="text-green-600"/>BMI & Health Calculator</h3>
        <div className="grid grid-cols-2 gap-3">
          {[{label:'Height (cm)',val:h,set:setH,ph:'165'},{label:'Weight (kg)',val:w,set:setW,ph:'68'},{label:'Age',val:age,set:setAge,ph:'24'}].map((f,i)=>(
            <div key={i} className={i===2?'col-span-2':''}><label className="text-xs text-gray-500 mb-1 block">{f.label}</label><input type="number" value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} className="input-field"/></div>
          ))}
          <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Gender</label>
            <div className="flex gap-2">{['male','female'].map(g=><button key={g} onClick={()=>setGender(g)} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${gender===g?'bg-green-600 border-green-600 text-white':'border-gray-200 text-gray-500 hover:border-green-300'}`}>{g.charAt(0).toUpperCase()+g.slice(1)}</button>)}</div>
          </div>
        </div>
        <button onClick={calculate} disabled={!w||!h}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 text-sm">
          <Scale size={15}/> Calculate
        </button>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-4 mb-3">
              <div className="text-center">
                <p className="text-4xl font-extrabold text-gray-900">{result.bmi}</p>
                <p className={`text-sm font-bold ${result.range.text}`}>{result.range.label}</p>
              </div>
              <div className="flex-1">
                <div className="w-full h-3 rounded-full overflow-hidden flex mb-1">
                  <div className="w-[25%] bg-blue-400 rounded-l-full"/><div className="w-[25%] bg-green-400"/><div className="w-[25%] bg-orange-400"/><div className="w-[25%] bg-red-500 rounded-r-full"/>
                </div>
                <div className="relative h-3">
                  <div className="absolute -top-1 transition-all" style={{left:`calc(${bmiPct}% - 8px)`}}><div className="w-4 h-4 bg-white border-2 border-gray-700 rounded-full shadow"/></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Under</span><span>Normal</span><span>Over</span><span>Obese</span></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[{l:'BMR',v:`${result.bmr}`,u:'kcal'},{l:'Ideal',v:result.idealRange,u:'kg'},{l:'Body Fat',v:`${result.bodyFat}%`,u:'est.'}].map((m,i)=>(
                <div key={i} className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-gray-400">{m.l}</p>
                  <p className="font-bold text-gray-800 text-sm">{m.v} <span className="text-xs font-normal text-gray-400">{m.u}</span></p>
                </div>
              ))}
            </div>
          </div>

          {loading && <div className="flex items-center justify-center gap-2 py-4 text-sm text-purple-600"><Loader size={15} className="animate-spin"/>Getting AI advice...</div>}

          {advice && (
            <div className="space-y-2">
              {advice.goal && <div className="bg-purple-50 border border-purple-200 rounded-xl p-3"><p className="text-xs font-bold text-purple-600 mb-0.5">🎯 Goal</p><p className="text-sm text-purple-900">{advice.goal}</p></div>}
              <div className="grid grid-cols-2 gap-2">
                {advice.diet?.length>0 && <div className="bg-green-50 border border-green-200 rounded-xl p-3"><p className="text-xs font-bold text-green-700 mb-1">🥗 Diet</p>{advice.diet.slice(0,3).map((t,i)=><p key={i} className="text-xs text-green-600">• {t}</p>)}</div>}
                {advice.exercise?.length>0 && <div className="bg-blue-50 border border-blue-200 rounded-xl p-3"><p className="text-xs font-bold text-blue-700 mb-1">🏃 Exercise</p>{advice.exercise.map((t,i)=><p key={i} className="text-xs text-blue-600">• {t}</p>)}</div>}
              </div>
              {advice.motivational && <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-center"><p className="text-sm font-semibold text-teal-700 italic">"{advice.motivational}"</p></div>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// TAB 5 — AI CHATBOT
// ═══════════════════════════════════════════════════
function ChatbotTab() {
  const [messages, setMessages] = useState([{role:'assistant',content:'Hi! 👋 I am your AI Health Assistant. Ask me about symptoms, medicines, diet, or any health question!'}])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const endRef = useRef(null)
  const QUICK = ['Why is my hemoglobin low?','What does high blood sugar mean?','How to lower cholesterol?','Is my BMI healthy?']

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  const send = async (text) => {
    const msg = (text||input).trim(); if (!msg||loading) return; setInput('')
    setMessages(p=>[...p,{role:'user',content:msg}]); setLoading(true)
    try {
      const history = messages.slice(-8).map(m=>({role:m.role,content:m.content}))
      const res = await api.post('/ai/chat', { message:msg, history })
      setMessages(p=>[...p,{role:'assistant',content:res.data?.response||'Please consult a doctor.'}])
    } catch {
      setMessages(p=>[...p,{role:'assistant',content:'Connection error. Please try again.'}])
    } finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{height:'520px'}}>
      <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 flex-shrink-0">
        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center"><Bot size={18} className="text-white"/></div>
        <div>
          <p className="text-white font-bold text-sm">AI Health Assistant</p>
          <p className="text-blue-200 text-xs">Always available · Ask anything</p>
        </div>
        <span className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m,i)=>(
          <div key={i} className={`flex gap-2 ${m.role==='user'?'flex-row-reverse':''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role==='user'?'bg-blue-600':'bg-gray-100'}`}>
              {m.role==='user'?<User size={13} className="text-white"/>:<Bot size={13} className="text-gray-600"/>}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role==='user'?'bg-blue-600 text-white rounded-tr-sm':'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>{m.content}</div>
          </div>
        ))}
        {loading && <div className="flex gap-2"><div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><Bot size={13} className="text-gray-600"/></div><div className="bg-gray-100 rounded-2xl px-3 py-2 flex gap-1">{[0,1,2].map(i=><span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div></div>}
        <div ref={endRef}/>
      </div>

      {messages.length===1 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
          {QUICK.map(q=><button key={q} onClick={()=>send(q)} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-full font-medium">{q}</button>)}
        </div>
      )}

      <div className="flex gap-2 p-3 border-t border-gray-100 flex-shrink-0">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
          placeholder="Ask anything..." className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"/>
        <button onClick={()=>send()} disabled={!input.trim()||loading}
          className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center"><Send size={15}/></button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════
const TABS = [
  { id:'symptoms', label:'Symptoms',      icon: <Activity size={16}/>,      color:'text-teal-600',   bg:'bg-teal-600' },
  { id:'reports',  label:'Reports',       icon: <FileText size={16}/>,       color:'text-blue-600',   bg:'bg-blue-600' },
  { id:'skin',     label:'Skin Scan (CNN)',icon: <Scan size={16}/>,           color:'text-purple-600', bg:'bg-purple-600' },
  { id:'bmi',      label:'BMI & Metrics', icon: <BarChart2 size={16}/>,      color:'text-green-600',  bg:'bg-green-600' },
  { id:'chatbot',  label:'AI Chatbot',    icon: <MessageSquare size={16}/>,  color:'text-indigo-600', bg:'bg-indigo-600' },
]

export default function Laboratory() {
  const [activeTab, setActiveTab] = useState('symptoms')
  const tab = TABS.find(t=>t.id===activeTab)

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-500 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center"><Microscope size={22} className="text-white"/></div>
            <div>
              <h1 className="text-xl font-extrabold">AI Health Lab</h1>
              <p className="text-teal-200 text-xs">AI-Powered Health Analysis · Diagnosis · Recommendations</p>
            </div>
          </div>

          {/* 5 Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all ${
                  activeTab===t.id ? 'bg-white text-teal-700 shadow-md' : 'bg-white/15 text-white hover:bg-white/25'
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Tab Content */}
        <div className="max-w-2xl mx-auto">
          {activeTab === 'symptoms' && <SymptomsTab/>}
          {activeTab === 'reports'  && <ReportsTab/>}
          {activeTab === 'skin'     && <SkinScanTab/>}
          {activeTab === 'bmi'      && <BMITab/>}
          {activeTab === 'chatbot'  && <ChatbotTab/>}
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 max-w-2xl mx-auto">
          <AlertCircle size={13} className="text-amber-600 mt-0.5 flex-shrink-0"/>
          <p className="text-xs text-amber-700">AI Health Lab is for educational purposes only. Always consult a qualified doctor for medical diagnosis and treatment.</p>
        </div>

      </div>
    </DashboardLayout>
  )
}
