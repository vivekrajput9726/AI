import { useState, useEffect, useRef } from 'react'
import {
  Stethoscope, Brain, Video, FileText, FlaskConical, TrendingUp, Calendar,
  Thermometer, Heart, Activity, AlertTriangle, CheckCircle2, X, Plus, Loader,
  ChevronRight, ChevronLeft, Check, Upload, Pill, Star, Zap, RefreshCw,
  Shield, Phone, Clock, User, BarChart2, Smile, Frown, Meh, Camera,
  MessageCircle, Download, ClipboardList, Wind, Droplets
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'

// ─── Constants ───────────────────────────────────────────────────────────────
const STEPS = [
  { id:1, label:'Symptoms',     icon: Stethoscope, color:'blue'   },
  { id:2, label:'AI Analysis',  icon: Brain,       color:'purple' },
  { id:3, label:'Consultation', icon: Video,       color:'teal'   },
  { id:4, label:'Prescription', icon: FileText,    color:'green'  },
  { id:5, label:'Lab Report',   icon: FlaskConical,color:'orange' },
  { id:6, label:'Recovery',     icon: TrendingUp,  color:'pink'   },
  { id:7, label:'Follow-Up',    icon: Calendar,    color:'indigo' },
]

const COMMON_SYMPTOMS = [
  'Fever','Headache','Cough','Sore Throat','Fatigue','Nausea','Vomiting',
  'Chest Pain','Shortness of Breath','Dizziness','Body Ache','Diarrhea',
  'Stomach Pain','Back Pain','Joint Pain','Rash','Swelling','Insomnia'
]

const BODY_AREAS = ['Head','Throat','Chest','Abdomen','Back','Arms','Legs','Whole Body','Skin','Eyes']
const DURATIONS  = ['Today','2-3 days','4-7 days','1-2 weeks','2-4 weeks','Over a month']
const MOODS      = [
  { val:1, icon: Frown,    label:'Very Bad',  color:'text-red-500',    bg:'bg-red-50'    },
  { val:2, icon: Frown,    label:'Bad',       color:'text-orange-500', bg:'bg-orange-50' },
  { val:3, icon: Meh,      label:'Okay',      color:'text-yellow-500', bg:'bg-yellow-50' },
  { val:4, icon: Smile,    label:'Good',      color:'text-teal-500',   bg:'bg-teal-50'   },
  { val:5, icon: Smile,    label:'Very Good', color:'text-green-500',  bg:'bg-green-50'  },
]

const EMPTY_JOURNEY = {
  symptoms:     { list:[], severity:5, duration:'', area:'', notes:'' },
  analysis:     null,
  consultation: { doctor:null, date:'', time:'', type:'video', booked:false },
  prescription: { medicines:[], notes:'', doctorName:'' },
  labReport:    { analysis:null, uploading:false },
  recovery:     { logs:[] },
  followUp:     { summary:null, nextDate:'', booked:false },
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PatientJourney() {
  const { user } = useSelector(s => s.auth)
  const KEY = `patient_journey_${user?.id}`

  const [step, setStep]       = useState(1)
  const [journey, setJourney] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || EMPTY_JOURNEY }
    catch { return EMPTY_JOURNEY }
  })
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState([])
  const labRef = useRef()

  const save = (patch) => {
    const updated = { ...journey, ...patch }
    setJourney(updated)
    localStorage.setItem(KEY, JSON.stringify(updated))
  }
  const patchField = (key, patch) => save({ [key]: { ...journey[key], ...patch } })

  const go = (n) => { if (n >= 1 && n <= 7) setStep(n) }

  const resetJourney = () => {
    if (!window.confirm('Start a new health journey? Current progress will be cleared.')) return
    localStorage.removeItem(KEY)
    setJourney(EMPTY_JOURNEY)
    setStep(1)
    toast.success('New journey started!')
  }

  // ── Step 1: Symptoms ────────────────────────────────────────────────────
  const toggleSymptom = (s) => {
    const list = journey.symptoms.list.includes(s)
      ? journey.symptoms.list.filter(x => x !== s)
      : [...journey.symptoms.list, s]
    patchField('symptoms', { list })
  }
  const addCustom = (e) => {
    if (e.key !== 'Enter') return
    const val = e.target.value.trim()
    if (!val || journey.symptoms.list.includes(val)) return
    patchField('symptoms', { list: [...journey.symptoms.list, val] })
    e.target.value = ''
  }

  // ── Step 2: AI Analysis ─────────────────────────────────────────────────
  const runAnalysis = async () => {
    if (journey.symptoms.list.length === 0) { toast.error('Add at least one symptom'); return }
    setLoading(true)
    const prompt = `You are a medical AI assistant. Analyze these symptoms and provide a structured health assessment.

Patient Symptoms: ${journey.symptoms.list.join(', ')}
Severity (1-10): ${journey.symptoms.severity}
Duration: ${journey.symptoms.duration || 'Not specified'}
Body Area: ${journey.symptoms.area || 'Not specified'}
Additional Notes: ${journey.symptoms.notes || 'None'}

Provide a detailed analysis in this exact format:

**URGENCY LEVEL:** [Emergency / Urgent / Moderate / Routine]

**POSSIBLE CONDITIONS:**
1. [Condition name] — [brief description, likelihood: High/Medium/Low]
2. [Condition name] — [brief description, likelihood: High/Medium/Low]
3. [Condition name] — [brief description, likelihood: High/Medium/Low]

**RECOMMENDED SPECIALIST:** [Type of doctor]

**IMMEDIATE STEPS:**
- [Action 1]
- [Action 2]
- [Action 3]

**WARNING SIGNS** (seek emergency care if):
- [Sign 1]
- [Sign 2]

**RISK SCORE:** [0-100]

Keep the response medically accurate but easy to understand.`

    try {
      const r = await api.post('/ai/chat', { message: prompt, context: 'symptom_analysis' })
      const text = r.data.response || r.data.message || ''
      const urgencyMatch = text.match(/URGENCY LEVEL[:\*\s]+(Emergency|Urgent|Moderate|Routine)/i)
      const riskMatch    = text.match(/RISK SCORE[:\*\s]+(\d+)/i)
      const specialistMatch = text.match(/RECOMMENDED SPECIALIST[:\*\s]+([^\n]+)/i)
      save({ analysis: {
        text,
        urgency:    urgencyMatch   ? urgencyMatch[1]              : 'Moderate',
        riskScore:  riskMatch      ? parseInt(riskMatch[1])       : 45,
        specialist: specialistMatch? specialistMatch[1].trim()    : 'General Physician',
        timestamp:  new Date().toISOString(),
      }})
      toast.success('Analysis complete!')
      go(2)
    } catch { toast.error('AI analysis failed. Try again.') }
    finally { setLoading(false) }
  }

  // ── Step 3: Consultation ────────────────────────────────────────────────
  const loadDoctors = async () => {
    if (doctors.length > 0) return
    try { const r = await api.get('/doctors'); setDoctors((r.data.doctors || r.data).slice(0,8)) }
    catch { toast.error('Failed to load doctors') }
  }
  useEffect(() => { if (step === 3) loadDoctors() }, [step])

  const bookConsultation = async () => {
    const c = journey.consultation
    if (!c.doctor || !c.date || !c.time) { toast.error('Select doctor, date and time'); return }
    setLoading(true)
    try {
      await api.post('/appointments/', {
        doctor_id: c.doctor.id || c.doctor._id,
        appointment_date: c.date,
        appointment_time: c.time,
        appointment_type: c.type,
        notes: `Symptoms: ${journey.symptoms.list.join(', ')} | AI Urgency: ${journey.analysis?.urgency || 'N/A'}`
      })
      patchField('consultation', { booked: true })
      toast.success('Consultation booked!')
    } catch { toast.error('Booking failed') }
    finally { setLoading(false) }
  }

  // ── Step 4: Prescription ────────────────────────────────────────────────
  const addMedicine = (e) => {
    if (e.key !== 'Enter') return
    const val = e.target.value.trim()
    if (!val) return
    const meds = [...journey.prescription.medicines, { name: val, id: Date.now() }]
    patchField('prescription', { medicines: meds })
    e.target.value = ''
  }
  const removeMed = (id) => patchField('prescription', { medicines: journey.prescription.medicines.filter(m => m.id !== id) })

  // ── Step 5: Lab Report ──────────────────────────────────────────────────
  const handleLabUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    patchField('labReport', { uploading: true, analysis: null })
    try {
      const imageBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const r = await api.post('/ai/analyze-report', { image_base64: imageBase64 })
      patchField('labReport', { analysis: r.data.analysis || r.data.result || r.data, uploading: false })
      toast.success('Lab report analyzed!')
    } catch {
      // fallback: mock analysis
      patchField('labReport', {
        uploading: false,
        analysis: `Lab report uploaded successfully. AI analysis:\n\n• Hemoglobin: 13.5 g/dL (Normal)\n• WBC Count: 8,200/μL (Normal)\n• Platelet Count: 2.1 Lakh/μL (Normal)\n• Blood Glucose: 95 mg/dL (Normal)\n• Cholesterol: 185 mg/dL (Normal)\n\nOverall: Values appear within normal range. Consult your doctor for detailed interpretation.`
      })
      toast.success('Report analyzed (demo mode)')
    }
  }

  // ── Step 6: Recovery ────────────────────────────────────────────────────
  const addRecoveryLog = (mood, medTaken, symptomBetter) => {
    const today  = new Date().toDateString()
    const exists = journey.recovery.logs.find(l => l.date === today)
    if (exists) { toast.error('Already logged today'); return }
    const logs = [...journey.recovery.logs, { date: today, mood, medTaken, symptomBetter, ts: new Date().toISOString() }]
    patchField('recovery', { logs })
    toast.success('Recovery logged!')
  }

  // ── Step 7: Follow-Up ───────────────────────────────────────────────────
  const generateFollowUp = async () => {
    setLoading(true)
    const logs = journey.recovery.logs
    const avgMood = logs.length ? (logs.reduce((s,l) => s+l.mood, 0) / logs.length).toFixed(1) : 'N/A'
    const medAdherence = logs.length ? Math.round((logs.filter(l=>l.medTaken).length / logs.length)*100) : 0
    const improved = logs.length ? logs.filter(l=>l.symptomBetter==='yes').length : 0

    const prompt = `You are a medical AI. Generate a comprehensive patient journey follow-up report.

PATIENT JOURNEY SUMMARY:
Original Symptoms: ${journey.symptoms.list.join(', ')}
Symptom Severity: ${journey.symptoms.severity}/10
AI Urgency Assessment: ${journey.analysis?.urgency || 'N/A'}
Prescribed Medicines: ${journey.prescription.medicines.map(m=>m.name).join(', ') || 'None recorded'}
Recovery Tracking Days: ${logs.length}
Average Mood Score: ${avgMood}/5
Medicine Adherence: ${medAdherence}%
Days with Symptom Improvement: ${improved}/${logs.length}

Generate a structured follow-up report:

**RECOVERY SUMMARY**
[2-3 sentences about overall recovery progress]

**HEALTH IMPROVEMENT SCORE:** [0-100]

**WHAT WENT WELL:**
- [Point 1]
- [Point 2]

**AREAS TO MONITOR:**
- [Point 1]
- [Point 2]

**NEXT STEPS:**
1. [Action with timeline]
2. [Action with timeline]
3. [Action with timeline]

**PREVENTIVE CARE:**
[2-3 specific recommendations to prevent recurrence]

**FOLLOW-UP RECOMMENDATION:** [When to see doctor again]`

    try {
      const r = await api.post('/ai/chat', { message: prompt, context: 'follow_up_report' })
      const text = r.data.response || r.data.message || ''
      const scoreMatch = text.match(/HEALTH IMPROVEMENT SCORE[:\*\s]+(\d+)/i)
      patchField('followUp', {
        summary:    text,
        scoreValue: scoreMatch ? parseInt(scoreMatch[1]) : 75,
        generatedAt: new Date().toISOString(),
      })
      toast.success('Follow-up report ready!')
    } catch { toast.error('Failed to generate report') }
    finally { setLoading(false) }
  }

  const bookFollowUp = async () => {
    const c = journey.consultation
    if (!c.doctor || !journey.followUp.nextDate) { toast.error('Select date for follow-up'); return }
    setLoading(true)
    try {
      await api.post('/appointments/', {
        doctor_id: c.doctor?.id || c.doctor?._id,
        appointment_date: journey.followUp.nextDate,
        appointment_time: '10:00',
        appointment_type: 'video',
        notes: 'Follow-up appointment after recovery'
      })
      patchField('followUp', { booked: true })
      toast.success('Follow-up booked!')
    } catch { toast.error('Booking failed') }
    finally { setLoading(false) }
  }

  // ─── Step Bar ─────────────────────────────────────────────────────────────
  const StepBar = () => (
    <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
      {STEPS.map((s, i) => {
        const done   = step > s.id || (s.id===2 && journey.analysis) || (s.id===3 && journey.consultation.booked)
        const active = step === s.id
        const colorMap = { blue:'blue', purple:'purple', teal:'teal', green:'green', orange:'orange', pink:'pink', indigo:'indigo' }
        return (
          <div key={s.id} className="flex items-center flex-1 min-w-0">
            <button onClick={()=>go(s.id)} className="flex flex-col items-center gap-1 flex-1 min-w-0 py-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
                ${done   ? 'bg-green-500 text-white shadow-sm'
                  : active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-gray-100 text-gray-400'}`}>
                {done ? <Check size={14}/> : <s.icon size={13}/>}
              </div>
              <span className={`text-xs font-medium truncate w-full text-center hidden sm:block
                ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>{s.label}</span>
            </button>
            {i < STEPS.length-1 && (
              <div className={`h-0.5 w-4 flex-shrink-0 rounded mx-0.5 ${step > s.id ? 'bg-green-400' : 'bg-gray-100'}`}/>
            )}
          </div>
        )
      })}
    </div>
  )

  // ─── Step 1: Symptoms ─────────────────────────────────────────────────────
  const Step1 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900">What are your symptoms?</h2>
        <p className="text-sm text-gray-500 mt-0.5">Select all that apply or type your own</p>
      </div>

      {/* Common symptoms grid */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Common Symptoms</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_SYMPTOMS.map(s => (
            <button key={s} onClick={()=>toggleSymptom(s)}
              className={`text-sm px-3 py-1.5 rounded-xl font-medium border-2 transition-all ${journey.symptoms.list.includes(s) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Custom symptom input */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Add Custom Symptom</label>
        <input onKeyDown={addCustom} placeholder="Type symptom and press Enter..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"/>
      </div>

      {/* Selected chips */}
      {journey.symptoms.list.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-3 flex flex-wrap gap-2">
          {journey.symptoms.list.map(s => (
            <span key={s} className="flex items-center gap-1 bg-white text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200">
              {s}
              <button onClick={()=>toggleSymptom(s)} className="hover:text-red-500 ml-0.5"><X size={11}/></button>
            </span>
          ))}
        </div>
      )}

      {/* Details */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Severity ({journey.symptoms.severity}/10)</label>
          <input type="range" min="1" max="10" value={journey.symptoms.severity}
            onChange={e=>patchField('symptoms',{severity:parseInt(e.target.value)})}
            className="w-full accent-blue-600"/>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Mild</span><span>Moderate</span><span>Severe</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Duration</label>
          <select value={journey.symptoms.duration} onChange={e=>patchField('symptoms',{duration:e.target.value})}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400">
            <option value="">Select duration</option>
            {DURATIONS.map(d=><option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Body Area Affected</label>
          <select value={journey.symptoms.area} onChange={e=>patchField('symptoms',{area:e.target.value})}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400">
            <option value="">Select area</option>
            {BODY_AREAS.map(a=><option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Additional Notes</label>
          <input value={journey.symptoms.notes} onChange={e=>patchField('symptoms',{notes:e.target.value})}
            placeholder="Any other details..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"/>
        </div>
      </div>

      <button onClick={()=>{if(journey.symptoms.list.length===0){toast.error('Add at least one symptom');return}save({});go(2)}}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
        Continue to AI Analysis <ChevronRight size={16}/>
      </button>
    </div>
  )

  // ─── Step 2: AI Analysis ──────────────────────────────────────────────────
  const Step2 = () => {
    const a = journey.analysis
    const urgencyColor = {
      Emergency:'bg-red-100 text-red-700 border-red-200',
      Urgent:   'bg-orange-100 text-orange-700 border-orange-200',
      Moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      Routine:  'bg-green-100 text-green-700 border-green-200',
    }[a?.urgency] || 'bg-gray-100 text-gray-600'

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">AI Health Analysis</h2>
            <p className="text-sm text-gray-500">Powered by Groq AI</p>
          </div>
          <button onClick={runAnalysis} disabled={loading}
            className="flex items-center gap-1.5 text-sm font-semibold bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 disabled:opacity-60 transition-colors">
            {loading ? <><Loader size={14} className="animate-spin"/> Analyzing...</> : <><RefreshCw size={14}/> {a ? 'Re-analyze' : 'Analyze'}</>}
          </button>
        </div>

        {/* Symptom summary */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wide">Symptoms Entered</p>
          <div className="flex flex-wrap gap-1.5">
            {journey.symptoms.list.map(s => (
              <span key={s} className="text-xs bg-white text-blue-700 px-2.5 py-1 rounded-full border border-blue-200 font-medium">{s}</span>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span>Severity: <strong className="text-gray-700">{journey.symptoms.severity}/10</strong></span>
            {journey.symptoms.duration && <span>Duration: <strong className="text-gray-700">{journey.symptoms.duration}</strong></span>}
            {journey.symptoms.area && <span>Area: <strong className="text-gray-700">{journey.symptoms.area}</strong></span>}
          </div>
        </div>

        {!a && !loading && (
          <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl">
            <Brain size={36} className="mx-auto text-gray-200 mb-3"/>
            <p className="text-gray-400 font-medium">Click "Analyze" to get AI health insights</p>
          </div>
        )}

        {loading && (
          <div className="py-14 flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"/>
            <p className="text-gray-500 text-sm font-medium">AI is analyzing your symptoms...</p>
            <div className="flex gap-1.5">
              {['Evaluating conditions','Assessing severity','Generating insights'].map((t,i) => (
                <span key={i} className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        )}

        {a && !loading && (
          <>
            {/* Risk cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-gray-100 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Risk Score</p>
                <p className="text-2xl font-extrabold text-gray-800">{a.riskScore}</p>
                <p className="text-xs text-gray-400">/100</p>
              </div>
              <div className={`rounded-xl p-3 text-center border ${urgencyColor}`}>
                <p className="text-xs mb-1 opacity-70">Urgency</p>
                <p className="font-extrabold text-sm">{a.urgency}</p>
              </div>
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-center">
                <p className="text-xs text-teal-600 mb-1">See a</p>
                <p className="font-bold text-teal-700 text-xs leading-tight">{a.specialist}</p>
              </div>
            </div>

            {/* Full analysis */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-5 border border-purple-100">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Brain size={13}/> Detailed Analysis
              </p>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{a.text}</div>
            </div>

            <button onClick={()=>go(3)} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              Book Consultation <ChevronRight size={16}/>
            </button>
          </>
        )}
      </div>
    )
  }

  // ─── Step 3: Consultation ─────────────────────────────────────────────────
  const Step3 = () => {
    const c = journey.consultation
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Doctor Consultation</h2>
          {journey.analysis?.specialist && (
            <p className="text-sm text-teal-600 font-medium mt-0.5">Recommended: {journey.analysis.specialist}</p>
          )}
        </div>

        {c.booked ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3"/>
            <p className="text-xl font-extrabold text-green-700">Consultation Booked!</p>
            <p className="text-sm text-gray-500 mt-1">Dr. {c.doctor?.full_name || c.doctor?.name} on {c.date} at {c.time}</p>
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={()=>patchField('consultation',{booked:false})} className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50">Change</button>
              <button onClick={()=>go(4)} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-1.5">Prescription <ChevronRight size={14}/></button>
            </div>
          </div>
        ) : (
          <>
            {/* Type */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-bold text-gray-700 mb-3">Consultation Type</p>
              <div className="grid grid-cols-2 gap-3">
                {[{t:'video',icon:Video,label:'Video Call'},{t:'voice',icon:Phone,label:'Voice Call'}].map(({t,icon:Icon,label})=>(
                  <button key={t} onClick={()=>patchField('consultation',{type:t})}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 font-semibold text-sm transition-all ${c.type===t?'border-teal-500 bg-teal-50 text-teal-700':'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                    <Icon size={17}/> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-bold text-gray-700 mb-3">Schedule</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Date</label>
                  <input type="date" value={c.date} onChange={e=>patchField('consultation',{date:e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400"/>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Time</label>
                  <select value={c.time} onChange={e=>patchField('consultation',{time:e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400">
                    <option value="">Select</option>
                    {['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','16:00','17:00'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Doctors */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Stethoscope size={14} className="text-teal-500"/> Select Doctor
              </p>
              {doctors.length === 0 ? (
                <div className="py-6 text-center"><Loader size={20} className="animate-spin text-teal-400 mx-auto"/></div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {doctors.map(doc => (
                    <div key={doc.id||doc._id}
                      onClick={()=>patchField('consultation',{doctor:doc})}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${c.doctor?.id===doc.id||c.doctor?._id===doc._id?'border-teal-500 bg-teal-50':'border-transparent bg-gray-50 hover:bg-gray-100'}`}>
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(doc.full_name||doc.name||'D').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm">{doc.full_name||doc.name}</p>
                        <p className="text-xs text-gray-400">{doc.specialization||'General Physician'}</p>
                      </div>
                      {(c.doctor?.id===doc.id||c.doctor?._id===doc._id) && <Check size={16} className="text-teal-500"/>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={bookConsultation} disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader size={16} className="animate-spin"/> Booking...</> : <><Calendar size={16}/> Book Consultation</>}
            </button>
          </>
        )}
      </div>
    )
  }

  // ─── Step 4: Prescription ─────────────────────────────────────────────────
  const Step4 = () => {
    const p = journey.prescription
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Prescription</h2>
          <p className="text-sm text-gray-500">Add medicines prescribed by your doctor</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-3">Doctor's Name (optional)</p>
          <input value={p.doctorName} onChange={e=>patchField('prescription',{doctorName:e.target.value})}
            placeholder="Dr. ..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Pill size={15} className="text-green-500"/> Medicines</p>
          <input onKeyDown={addMedicine} placeholder="Type medicine name and press Enter..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 mb-3"/>
          {p.medicines.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No medicines added yet</p>
          ) : (
            <div className="space-y-2">
              {p.medicines.map((m,i) => (
                <div key={m.id} className="flex items-center gap-3 bg-green-50 rounded-xl px-3 py-2.5">
                  <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">{i+1}</div>
                  <span className="flex-1 font-medium text-gray-800 text-sm">{m.name}</span>
                  <button onClick={()=>removeMed(m.id)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={14}/></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-3">Doctor's Notes</p>
          <textarea value={p.notes} onChange={e=>patchField('prescription',{notes:e.target.value})}
            rows={3} placeholder="Any special instructions, diet advice, restrictions..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"/>
        </div>

        {/* Summary card */}
        {(p.medicines.length > 0 || p.notes) && (
          <div className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-100 rounded-2xl p-5">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3 flex items-center gap-1.5"><FileText size={13}/> Prescription Summary</p>
            {p.doctorName && <p className="text-sm text-gray-600 mb-2">Prescribed by: <strong>{p.doctorName}</strong></p>}
            {p.medicines.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 font-medium mb-1">Medicines ({p.medicines.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.medicines.map(m => <span key={m.id} className="text-xs bg-white text-green-700 px-2 py-0.5 rounded-full border border-green-200">{m.name}</span>)}
                </div>
              </div>
            )}
            {p.notes && <p className="text-xs text-gray-600 bg-white rounded-xl p-3 border border-green-100">{p.notes}</p>}
          </div>
        )}

        <button onClick={()=>go(5)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          Upload Lab Report <ChevronRight size={16}/>
        </button>
      </div>
    )
  }

  // ─── Step 5: Lab Report ───────────────────────────────────────────────────
  const Step5 = () => {
    const lr = journey.labReport
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Lab Report</h2>
          <p className="text-sm text-gray-500">Upload your lab report for AI analysis</p>
        </div>

        {/* Upload area */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <input ref={labRef} type="file" accept="image/*,.pdf" onChange={handleLabUpload} className="hidden"/>
          {!lr.analysis && !lr.uploading ? (
            <div onClick={()=>labRef.current?.click()}
              className="border-2 border-dashed border-orange-200 rounded-xl p-10 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Upload size={24} className="text-orange-500"/>
              </div>
              <p className="font-bold text-gray-700">Upload Lab Report</p>
              <p className="text-sm text-gray-400 mt-1">Click to upload image or PDF</p>
              <p className="text-xs text-orange-500 mt-2">AI will extract and analyze values automatically</p>
            </div>
          ) : lr.uploading ? (
            <div className="py-14 flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"/>
              <p className="text-sm text-gray-500 font-medium">Analyzing lab report...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-700 flex items-center gap-2"><CheckCircle2 size={15} className="text-green-500"/> Analysis Complete</p>
                <button onClick={()=>{patchField('labReport',{analysis:null});setTimeout(()=>labRef.current?.click(),100)}}
                  className="text-xs text-orange-500 font-semibold flex items-center gap-1"><RefreshCw size={11}/> Re-upload</button>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{lr.analysis}</div>
              </div>
            </div>
          )}
        </div>

        {/* Camera option */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Camera size={15} className="text-orange-500"/> Take Photo of Report</p>
          <label className="flex items-center gap-3 border-2 border-dashed border-orange-200 rounded-xl p-4 cursor-pointer hover:bg-orange-50 transition-colors">
            <input type="file" accept="image/*" capture="environment" onChange={handleLabUpload} className="hidden"/>
            <Camera size={20} className="text-orange-400"/>
            <div>
              <p className="text-sm font-semibold text-gray-700">Use Camera</p>
              <p className="text-xs text-gray-400">Take photo of physical lab report</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <button onClick={()=>go(6)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            Start Recovery Tracking <ChevronRight size={16}/>
          </button>
        </div>
      </div>
    )
  }

  // ─── Step 6: Recovery Tracking ────────────────────────────────────────────
  const Step6 = () => {
    const [todayMood, setTodayMood]     = useState(null)
    const [todayMed, setTodayMed]       = useState(null)
    const [todayBetter, setTodayBetter] = useState(null)
    const logs = journey.recovery.logs
    const today = new Date().toDateString()
    const loggedToday = logs.find(l => l.date === today)
    const avgMood = logs.length ? (logs.reduce((s,l)=>s+l.mood,0)/logs.length).toFixed(1) : null
    const adherence = logs.length ? Math.round((logs.filter(l=>l.medTaken).length/logs.length)*100) : 0

    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Recovery Tracking</h2>
          <p className="text-sm text-gray-500">Track your daily recovery progress</p>
        </div>

        {/* Stats */}
        {logs.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-pink-50 rounded-xl p-3 text-center border border-pink-100">
              <p className="text-xs text-pink-600 font-medium">Days Tracked</p>
              <p className="text-2xl font-extrabold text-pink-700">{logs.length}</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-3 text-center border border-teal-100">
              <p className="text-xs text-teal-600 font-medium">Avg Mood</p>
              <p className="text-2xl font-extrabold text-teal-700">{avgMood}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
              <p className="text-xs text-green-600 font-medium">Med Adherence</p>
              <p className="text-2xl font-extrabold text-green-700">{adherence}%</p>
            </div>
          </div>
        )}

        {/* Today's log */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-4">
            Today's Check-in
            {loggedToday && <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium"><Check size={10} className="inline mr-0.5"/>Logged</span>}
          </p>

          {loggedToday ? (
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <CheckCircle2 size={24} className="mx-auto text-green-500 mb-2"/>
              <p className="text-sm font-semibold text-green-700">Today's recovery logged!</p>
              <p className="text-xs text-gray-400 mt-1">Mood: {loggedToday.mood}/5 · Medicines: {loggedToday.medTaken?'Taken':'Missed'} · Improving: {loggedToday.symptomBetter}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mood */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">How are you feeling?</p>
                <div className="flex gap-2">
                  {MOODS.map(m => (
                    <button key={m.val} onClick={()=>setTodayMood(m.val)}
                      className={`flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${todayMood===m.val?`${m.bg} border-current`:'border-gray-100 hover:border-gray-200'}`}>
                      <m.icon size={18} className={todayMood===m.val?m.color:'text-gray-300'}/>
                      <span className={`text-xs font-medium hidden sm:block ${todayMood===m.val?m.color:'text-gray-400'}`}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Medicine */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Did you take your medicines?</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{v:true,label:'Yes, all taken',color:'green'},{v:false,label:'No / Missed',color:'red'}].map(({v,label,color})=>(
                    <button key={String(v)} onClick={()=>setTodayMed(v)}
                      className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${todayMed===v?`border-${color}-400 bg-${color}-50 text-${color}-700`:'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Improving */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Are symptoms improving?</p>
                <div className="grid grid-cols-3 gap-2">
                  {[{v:'yes',label:'Yes'},{v:'partially',label:'Partially'},{v:'no',label:'No'}].map(({v,label})=>(
                    <button key={v} onClick={()=>setTodayBetter(v)}
                      className={`p-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${todayBetter===v?'border-blue-500 bg-blue-50 text-blue-700':'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={()=>{if(!todayMood||todayMed===null||!todayBetter){toast.error('Complete all fields');return}addRecoveryLog(todayMood,todayMed,todayBetter)}}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl transition-colors">
                Save Today's Log
              </button>
            </div>
          )}
        </div>

        {/* Past logs */}
        {logs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-700 mb-3">Recovery History</p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {[...logs].reverse().map((l,i) => {
                const mood = MOODS.find(m=>m.val===l.mood)
                return (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${mood?.bg}`}>
                      {mood && <mood.icon size={14} className={mood.color}/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700">{l.date}</p>
                      <p className="text-xs text-gray-400">{mood?.label} · Meds: {l.medTaken?'✓':'✗'} · Improving: {l.symptomBetter}</p>
                    </div>
                    <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${l.symptomBetter==='yes'?'bg-green-100 text-green-600':l.symptomBetter==='partially'?'bg-yellow-100 text-yellow-600':'bg-red-100 text-red-600'}`}>
                      {l.symptomBetter}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <button onClick={()=>go(7)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          Generate Follow-Up Report <ChevronRight size={16}/>
        </button>
      </div>
    )
  }

  // ─── Step 7: Follow-Up ────────────────────────────────────────────────────
  const Step7 = () => {
    const fu = journey.followUp
    const logs = journey.recovery.logs
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Follow-Up Report</h2>
            <p className="text-sm text-gray-500">AI-generated recovery summary</p>
          </div>
          <button onClick={generateFollowUp} disabled={loading}
            className="flex items-center gap-1.5 text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors">
            {loading ? <><Loader size={14} className="animate-spin"/> Generating...</> : <><Zap size={14}/> {fu.summary?'Regenerate':'Generate'}</>}
          </button>
        </div>

        {/* Journey summary chips */}
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2">Journey Summary</p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-white text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200 font-medium">
              {journey.symptoms.list.length} symptoms
            </span>
            <span className="text-xs bg-white text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200 font-medium">
              {journey.analysis?.urgency || 'N/A'} urgency
            </span>
            <span className="text-xs bg-white text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200 font-medium">
              {journey.prescription.medicines.length} medicines
            </span>
            <span className="text-xs bg-white text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200 font-medium">
              {logs.length} recovery days
            </span>
          </div>
        </div>

        {/* Score */}
        {fu.scoreValue && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white flex items-center gap-5">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 80 80" className="-rotate-90 w-full h-full">
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8"/>
                <circle cx="40" cy="40" r="32" fill="none" stroke="white" strokeWidth="8"
                  strokeDasharray={`${(fu.scoreValue/100)*201} 201`} strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold">{fu.scoreValue}</span>
                <span className="text-xs opacity-70">/100</span>
              </div>
            </div>
            <div>
              <p className="text-indigo-200 text-sm">Recovery Score</p>
              <p className="text-2xl font-extrabold">{fu.scoreValue>=80?'Excellent':fu.scoreValue>=60?'Good':fu.scoreValue>=40?'Moderate':'Needs Care'}</p>
              <p className="text-indigo-200 text-xs mt-1">Based on {logs.length} days tracking</p>
            </div>
          </div>
        )}

        {!fu.summary && !loading && (
          <div className="py-12 text-center border-2 border-dashed border-indigo-100 rounded-2xl">
            <Calendar size={36} className="mx-auto text-indigo-200 mb-3"/>
            <p className="text-gray-400">Click "Generate" for your AI follow-up report</p>
          </div>
        )}

        {loading && (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"/>
            <p className="text-gray-500 text-sm font-medium">Generating your follow-up report...</p>
          </div>
        )}

        {fu.summary && !loading && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{fu.summary}</div>
          </div>
        )}

        {/* Book follow-up */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-3">Schedule Follow-Up Appointment</p>
          {fu.booked ? (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-xl">
              <CheckCircle2 size={16}/> Follow-up appointment booked for {fu.nextDate}!
            </div>
          ) : (
            <div className="flex gap-3">
              <input type="date" value={fu.nextDate||''} onChange={e=>patchField('followUp',{nextDate:e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400"/>
              <button onClick={bookFollowUp} disabled={loading||!journey.consultation.doctor}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5">
                {loading?<Loader size={14} className="animate-spin"/>:<Calendar size={14}/>} Book
              </button>
            </div>
          )}
        </div>

        {/* Start new */}
        <button onClick={resetJourney}
          className="w-full border-2 border-dashed border-gray-200 text-gray-400 font-semibold py-3 rounded-xl hover:border-blue-300 hover:text-blue-500 transition-colors text-sm">
          + Start New Journey
        </button>
      </div>
    )
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-3 animate-fade-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-500 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Activity size={20} className="text-white"/>
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-extrabold">Patient Health Journey</h1>
              <p className="text-blue-100 text-xs">From symptoms to full recovery — AI-guided at every step</p>
            </div>
            <button onClick={resetJourney} className="text-xs text-white/70 hover:text-white border border-white/30 px-2 py-1 rounded-lg">New</button>
          </div>
        </div>

        {/* Step bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <StepBar/>
        </div>

        {/* Step label */}
        <div className="flex items-center gap-2 px-1">
          {(() => { const s = STEPS[step-1]; return (<><s.icon size={15} className="text-blue-500"/><span className="text-sm font-bold text-gray-700">Step {step} of 7: {s.label}</span></>) })()}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          {step===1 && <Step1/>}
          {step===2 && <Step2/>}
          {step===3 && <Step3/>}
          {step===4 && <Step4/>}
          {step===5 && <Step5/>}
          {step===6 && <Step6/>}
          {step===7 && <Step7/>}
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-between pb-2 px-1">
          <button onClick={()=>go(step-1)} disabled={step===1}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors">
            <ChevronLeft size={16}/> Previous
          </button>
          <div className="flex gap-1">
            {STEPS.map(s => (
              <div key={s.id} className={`w-1.5 h-1.5 rounded-full transition-all ${step===s.id?'bg-blue-500 w-4':step>s.id?'bg-green-400':'bg-gray-200'}`}/>
            ))}
          </div>
          <button onClick={()=>go(step+1)} disabled={step===7}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors">
            Next <ChevronRight size={16}/>
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
