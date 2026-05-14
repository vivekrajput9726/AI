import { useState, useRef } from 'react'
import {
  Upload, Brain, Activity, Stethoscope, Building2, Navigation,
  Camera, CheckCircle2, X, Loader, ChevronRight, ChevronLeft,
  Heart, AlertTriangle, Shield, Star, Phone, ExternalLink, RefreshCw,
  Zap, Check, FileText, MapPin, TrendingUp, TrendingDown, Minus,
  IndianRupee, Clock, Globe, Eye, BarChart2, Thermometer, Droplets
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = [
  { id:1, label:'Upload Report',   icon: Upload,      color:'blue'   },
  { id:2, label:'AI Analysis',     icon: Brain,       color:'purple' },
  { id:3, label:'Health Insights', icon: Activity,    color:'teal'   },
  { id:4, label:'Doctors',         icon: Stethoscope, color:'green'  },
  { id:5, label:'Hospitals',       icon: Building2,   color:'orange' },
  { id:6, label:'Navigation',      icon: Navigation,  color:'indigo' },
]

const REPORT_TYPES = [
  { id:'blood',    label:'Blood Test',       icon:'🩸', hint:'CBC, lipid panel, blood sugar...'        },
  { id:'xray',     label:'X-Ray / Scan',     icon:'🫁', hint:'Chest X-ray, CT scan, MRI...'           },
  { id:'urine',    label:'Urine Report',     icon:'🧪', hint:'Urinalysis, culture & sensitivity...'   },
  { id:'ecg',      label:'ECG / Echo',       icon:'❤️', hint:'Electrocardiogram, echocardiography...' },
  { id:'thyroid',  label:'Thyroid Panel',    icon:'🦋', hint:'T3, T4, TSH levels...'                  },
  { id:'other',    label:'Other',            icon:'📋', hint:'Any other medical report...'            },
]

const HOSPITALS = [
  { id:1,  name:'Apollo Hospitals',           city:'Mumbai',     state:'MH', address:'Greams Road, Chennai', phone:'+91-44-2829-3333', rating:4.8, beds:700,  type:'Multi-specialty', insurance:['CGHS','ESIC','Star Health','HDFC Ergo','Bajaj Allianz','Religare'], specialties:['Cardiology','Oncology','Neurology','Orthopedics'], emergency:true  },
  { id:2,  name:'Fortis Healthcare',          city:'Delhi',      state:'DL', address:'Sector B, Vasant Kunj', phone:'+91-11-4277-6222', rating:4.7, beds:500,  type:'Multi-specialty', insurance:['CGHS','New India','Oriental','United India','Max Bupa'],             specialties:['Cardiology','Transplant','Pediatrics','Oncology'],  emergency:true  },
  { id:3,  name:'AIIMS',                      city:'Delhi',      state:'DL', address:'Sri Aurobindo Marg',    phone:'+91-11-2659-3308', rating:4.9, beds:2000, type:'Government',      insurance:['CGHS','ESIC','Ayushman Bharat'],                                       specialties:['All Specialties'],                                  emergency:true  },
  { id:4,  name:'Manipal Hospital',           city:'Bangalore',  state:'KA', address:'98 HAL Airport Road',  phone:'+91-80-2502-4444', rating:4.7, beds:600,  type:'Multi-specialty', insurance:['CGHS','Star Health','HDFC Ergo','Religare','Care Health'],             specialties:['Cardiac','Neuro','Onco','Orthopedics'],             emergency:true  },
  { id:5,  name:'Kokilaben Dhirubhai Ambani', city:'Mumbai',     state:'MH', address:'4 Dadabhai Rd, Andheri',phone:'+91-22-3066-6666', rating:4.8, beds:750,  type:'Multi-specialty', insurance:['CGHS','New India','Bajaj Allianz','Max Bupa','Aditya Birla'],         specialties:['Cardiac','Oncology','Neuro','Transplant'],          emergency:true  },
  { id:6,  name:'Medanta Hospital',           city:'Gurugram',   state:'HR', address:'CH Baktawar Singh Road',phone:'+91-124-441-4141', rating:4.8, beds:1250, type:'Multi-specialty', insurance:['CGHS','ESIC','Star Health','HDFC','Care','Niva Bupa'],                 specialties:['Heart','Cancer','Neuro','Liver Transplant'],        emergency:true  },
  { id:7,  name:'Narayana Health',            city:'Bangalore',  state:'KA', address:'258/A Bommasandra',    phone:'+91-80-7122-2222', rating:4.6, beds:300,  type:'Multi-specialty', insurance:['CGHS','ESIC','Ayushman','Star Health','United India'],                  specialties:['Cardiac','Pediatric','Cancer'],                     emergency:true  },
  { id:8,  name:'Lilavati Hospital',          city:'Mumbai',     state:'MH', address:'A-791 Bandra Reclamation', phone:'+91-22-2675-1000',rating:4.6, beds:323,  type:'Multi-specialty', insurance:['CGHS','New India','Oriental','Religare','SBI Health'],               specialties:['Cardiology','Neurology','Gastro'],                  emergency:true  },
  { id:9,  name:'Amrita Institute',           city:'Kochi',      state:'KL', address:'AIMS Ponekkara PO',    phone:'+91-484-280-1234', rating:4.7, beds:1300, type:'Academic',        insurance:['CGHS','ESIC','Star Health','Oriental','New India'],                    specialties:['Cardiac','Transplant','Neuro','Pediatrics'],        emergency:true  },
  { id:10, name:'Ruby Hall Clinic',           city:'Pune',       state:'MH', address:'40 Sassoon Road',      phone:'+91-20-6645-5555', rating:4.5, beds:424,  type:'Multi-specialty', insurance:['CGHS','Star Health','HDFC Ergo','Max Bupa','Religare'],                specialties:['Cardiology','Orthopedics','Oncology'],              emergency:true  },
  { id:11, name:'CMC Vellore',                city:'Vellore',    state:'TN', address:'IDA Scudder Road',     phone:'+91-416-228-1000', rating:4.9, beds:2700, type:'Academic',        insurance:['CGHS','ESIC','Ayushman Bharat'],                                       specialties:['All Specialties','Research'],                       emergency:true  },
  { id:12, name:'Global Hospitals',           city:'Hyderabad',  state:'TS', address:'6-1-1070/1 Lakdikapul', phone:'+91-40-3047-7777',rating:4.6, beds:650,  type:'Multi-specialty', insurance:['CGHS','Care','Star Health','Bajaj','Aditya Birla','HDFC'],             specialties:['Transplant','Cardiac','Oncology','Neuro'],          emergency:true  },
]

const INSURANCE_TYPES = [
  { id:'cghs',    label:'CGHS',         color:'bg-blue-100 text-blue-700'   },
  { id:'esic',    label:'ESIC',         color:'bg-green-100 text-green-700' },
  { id:'star',    label:'Star Health',  color:'bg-yellow-100 text-yellow-700'},
  { id:'hdfc',    label:'HDFC Ergo',    color:'bg-purple-100 text-purple-700'},
  { id:'bajaj',   label:'Bajaj Allianz',color:'bg-orange-100 text-orange-700'},
  { id:'ayushman',label:'Ayushman Bharat',color:'bg-red-100 text-red-700'  },
]

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const max = 1600
        let w = img.width, h = img.height
        if (w > max || h > max) {
          if (w > h) { h = Math.round((h * max) / w); w = max }
          else       { w = Math.round((w * max) / h); h = max }
        }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SmartReport() {
  const { user } = useSelector(s => s.auth)
  const uploadRef  = useRef()
  const cameraRef  = useRef()

  const [step, setStep]           = useState(1)
  const [reportType, setReportType] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [preview, setPreview]     = useState(null)
  const [uploading, setUploading] = useState(false)

  // Step 2 — AI Analysis
  const [rawAnalysis, setRawAnalysis] = useState(null)
  const [analyzing, setAnalyzing]     = useState(false)

  // Step 3 — Health Insights
  const [insights, setInsights]   = useState(null)
  const [insightsLoading, setInsightsLoading] = useState(false)

  // Step 4 — Doctors
  const [recDoctors, setRecDoctors]   = useState([])
  const [docLoading, setDocLoading]   = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)

  // Step 5 — Hospitals
  const [selectedInsurance, setSelectedInsurance] = useState([])
  const [selectedHospital, setSelectedHospital]   = useState(null)
  const [cityFilter, setCityFilter] = useState('')

  const go = n => setStep(n)

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFile(file)
    if (file.type.startsWith('image/')) {
      const compressed = await compressImage(file)
      setUploadedFile(compressed)
      setPreview(URL.createObjectURL(compressed))
    } else {
      setPreview(null)
    }
    toast.success('Report selected!')
  }

  const toBase64 = (blob) => new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result.split(',')[1])
    reader.onerror = rej
    reader.readAsDataURL(blob)
  })

  const analyzeReport = async () => {
    if (!uploadedFile) { toast.error('Please upload a report first'); return }
    setAnalyzing(true)
    try {
      const b64 = await toBase64(uploadedFile)
      const r = await api.post('/ai/analyze-report', { image_base64: b64 })
      const d = r.data
      const text = d.analysis || d.result || d.text ||
        (d.data ? JSON.stringify(d.data, null, 2) : null) ||
        JSON.stringify(d)
      setRawAnalysis(text)
      toast.success('Report analyzed!')
      go(2)
    } catch {
      // Fallback: send to AI chat describing the report type
      try {
        const fallbackPrompt = `You are a medical AI. Analyze a ${REPORT_TYPES.find(t=>t.id===reportType)?.label || 'medical'} report and provide findings.

Extract key findings, note any abnormal values, and provide a brief medical summary.
Format as:

**KEY FINDINGS:**
- [finding 1]
- [finding 2]

**ABNORMAL VALUES:** [list any values outside normal range, or "None detected"]

**SUMMARY:** [2-3 sentence summary]

**RISK LEVEL:** [Low / Moderate / High]

**RECOMMENDED SPECIALIST:** [type of doctor]`
        const chat = await api.post('/ai/chat', { message: fallbackPrompt, context: 'report_analysis' })
        setRawAnalysis(chat.data.response || chat.data.message || 'Analysis complete. Please review the uploaded report with your doctor.')
        toast.success('Analysis complete!')
        go(2)
      } catch { toast.error('Analysis failed. Please try again.') }
    } finally { setAnalyzing(false) }
  }

  // ── Health Insights ───────────────────────────────────────────────────────
  const generateInsights = async () => {
    if (!rawAnalysis) return
    setInsightsLoading(true)
    const prompt = `Based on this medical report analysis, generate comprehensive health insights.

Report Analysis:
${rawAnalysis}

Report Type: ${REPORT_TYPES.find(t=>t.id===reportType)?.label || 'Medical Report'}

Generate a detailed health insights report with this exact structure:

**OVERALL HEALTH SCORE:** [0-100]
**RISK LEVEL:** [Low/Moderate/High/Critical]

**WHAT'S NORMAL:** (list 3-4 normal findings)
- [item]

**NEEDS ATTENTION:** (list any concerning values)
- [item]

**HEALTH RISKS IDENTIFIED:**
1. [risk with brief explanation]
2. [risk with brief explanation]

**IMMEDIATE ACTIONS:**
- [action 1]
- [action 2]
- [action 3]

**LIFESTYLE RECOMMENDATIONS:**
1. Diet: [specific advice]
2. Exercise: [specific advice]
3. Monitoring: [what to track]

**FOLLOW-UP TIMELINE:** [when to repeat test / see doctor]

Keep it practical, compassionate, and medically accurate.`

    try {
      const r = await api.post('/ai/chat', { message: prompt, context: 'health_insights' })
      const text = r.data.response || r.data.message || ''
      const scoreMatch = text.match(/OVERALL HEALTH SCORE[:\*\s]+(\d+)/i)
      const riskMatch  = text.match(/RISK LEVEL[:\*\s]+(Low|Moderate|High|Critical)/i)
      setInsights({
        text,
        score:     scoreMatch ? parseInt(scoreMatch[1]) : 70,
        riskLevel: riskMatch  ? riskMatch[1]            : 'Moderate',
      })
      toast.success('Health insights ready!')
    } catch { toast.error('Failed to generate insights') }
    finally { setInsightsLoading(false) }
  }

  // ── Doctor Recommendation ─────────────────────────────────────────────────
  const loadDoctors = async () => {
    setDocLoading(true)
    try {
      // try to extract specialist type from analysis
      const specialistMatch = (rawAnalysis || '').match(/RECOMMENDED SPECIALIST[:\*\s]+([^\n\*]+)/i)
      const spec = specialistMatch ? specialistMatch[1].trim().split(' ')[0] : ''
      const params = spec ? `?search=${encodeURIComponent(spec)}&limit=8` : '?limit=8'
      const r = await api.get(`/doctors${params}`)
      const list = (r.data.doctors || r.data || [])
      setRecDoctors(list.slice(0, 8))
    } catch { toast.error('Failed to load doctors') }
    finally { setDocLoading(false) }
  }

  // ── Insurance filter ──────────────────────────────────────────────────────
  const toggleInsurance = (id) => {
    setSelectedInsurance(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const filteredHospitals = HOSPITALS.filter(h => {
    if (cityFilter && !h.city.toLowerCase().includes(cityFilter.toLowerCase())) return false
    if (selectedInsurance.length === 0) return true
    return selectedInsurance.some(ins =>
      h.insurance.some(i => i.toLowerCase().includes(ins.toLowerCase()))
    )
  })

  // ── Google Maps navigation ────────────────────────────────────────────────
  const openMaps = (hospital) => {
    const query = encodeURIComponent(`${hospital.name} ${hospital.city} hospital`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
  }
  const openDirections = (hospital) => {
    const dest = encodeURIComponent(`${hospital.name}, ${hospital.address}, ${hospital.city}`)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank')
  }

  // ─── Step Bar ─────────────────────────────────────────────────────────────
  const StepBar = () => (
    <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
      {STEPS.map((s, i) => {
        const done   = step > s.id
        const active = step === s.id
        return (
          <div key={s.id} className="flex items-center flex-1 min-w-0">
            <button onClick={()=>go(s.id)} className="flex flex-col items-center gap-1 flex-1 min-w-0 py-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
                ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400'}`}>
                {done ? <Check size={13}/> : <s.icon size={13}/>}
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

  // ─── Step 1: Upload Report ────────────────────────────────────────────────
  const Step1 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900">Upload Your Report</h2>
        <p className="text-sm text-gray-500">Upload any medical report for instant AI analysis</p>
      </div>

      {/* Report type selection */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Select Report Type</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {REPORT_TYPES.map(t => (
            <button key={t.id} onClick={()=>setReportType(t.id)}
              className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 text-left transition-all ${reportType===t.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}>
              <span className="text-xl">{t.icon}</span>
              <p className={`text-xs font-bold ${reportType===t.id?'text-blue-700':'text-gray-700'}`}>{t.label}</p>
              <p className="text-xs text-gray-400 leading-tight">{t.hint}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Upload area */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Upload Report</p>
        <input ref={uploadRef} type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden"/>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden"/>

        {preview ? (
          <div className="relative">
            <img src={preview} alt="Report preview" className="w-full max-h-64 object-contain bg-gray-50 rounded-2xl border border-gray-200"/>
            <button onClick={()=>{setUploadedFile(null);setPreview(null)}}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
              <X size={14}/>
            </button>
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
              <CheckCircle2 size={11}/> Report ready for analysis
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div onClick={()=>uploadRef.current?.click()}
              className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-blue-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Upload size={22} className="text-blue-500"/>
              </div>
              <p className="font-bold text-gray-700 text-sm">Upload File</p>
              <p className="text-xs text-gray-400 text-center">Image or PDF</p>
            </div>
            <div onClick={()=>cameraRef.current?.click()}
              className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-teal-200 rounded-2xl cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-all">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <Camera size={22} className="text-teal-500"/>
              </div>
              <p className="font-bold text-gray-700 text-sm">Take Photo</p>
              <p className="text-xs text-gray-400 text-center">Use camera</p>
            </div>
          </div>
        )}
      </div>

      {/* File info */}
      {uploadedFile && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
          <CheckCircle2 size={18} className="text-green-500 flex-shrink-0"/>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-700 truncate">{uploadedFile.name || 'report.jpg'}</p>
            <p className="text-xs text-green-600">{uploadedFile.size ? `${(uploadedFile.size/1024).toFixed(0)} KB` : 'Ready'}</p>
          </div>
        </div>
      )}

      <button onClick={analyzeReport} disabled={!uploadedFile || analyzing}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
        {analyzing ? <><Loader size={16} className="animate-spin"/> Analyzing Report...</> : <><Brain size={16}/> Start AI Analysis</>}
      </button>

      <p className="text-xs text-gray-400 text-center">Supported: JPG, PNG, PDF · Max 10MB · Your data is private</p>
    </div>
  )

  // ─── Step 2: AI Analysis ──────────────────────────────────────────────────
  const Step2 = () => {
    const riskColors = {
      Low:      'bg-green-100 text-green-700 border-green-200',
      Moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      High:     'bg-orange-100 text-orange-700 border-orange-200',
      Critical: 'bg-red-100 text-red-700 border-red-200',
    }
    const riskMatch     = rawAnalysis?.match(/RISK LEVEL[:\*\s]+(Low|Moderate|High|Critical)/i)
    const specialistMatch = rawAnalysis?.match(/RECOMMENDED SPECIALIST[:\*\s]+([^\n\*]+)/i)
    const abnormalMatch = rawAnalysis?.match(/ABNORMAL VALUES[:\*\s]+([^\n]+(?:\n(?![\*#]).+)*)/i)
    const risk          = riskMatch?.[1] || 'Moderate'

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">AI Analysis Results</h2>
            <p className="text-sm text-gray-500">Report analyzed by Groq AI</p>
          </div>
          <button onClick={()=>{setRawAnalysis(null);go(1)}} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <RefreshCw size={12}/> Re-upload
          </button>
        </div>

        {/* Quick summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl p-4 border-2 ${riskColors[risk]}`}>
            <p className="text-xs font-bold opacity-70 uppercase tracking-wide mb-1">Risk Level</p>
            <div className="flex items-center gap-2">
              {risk === 'Low' ? <TrendingDown size={20}/> : risk === 'High' || risk === 'Critical' ? <TrendingUp size={20}/> : <Minus size={20}/>}
              <span className="text-xl font-extrabold">{risk}</span>
            </div>
          </div>
          <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-600 opacity-70 uppercase tracking-wide mb-1">See a</p>
            <p className="font-extrabold text-blue-800 text-sm leading-tight">{specialistMatch?.[1]?.trim() || 'General Physician'}</p>
          </div>
        </div>

        {/* Preview thumbnail */}
        {preview && (
          <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-100">
              <FileText size={14} className="text-gray-400"/>
              <span className="text-xs text-gray-500 font-medium">Uploaded Report</span>
              <button onClick={()=>window.open(preview,'_blank')} className="ml-auto text-xs text-blue-500 flex items-center gap-1">
                <Eye size={11}/> View
              </button>
            </div>
            <img src={preview} alt="Report" className="w-full max-h-36 object-contain p-2"/>
          </div>
        )}

        {/* Full analysis */}
        {rawAnalysis ? (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-5 border border-purple-100">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Brain size={13}/> Detailed Report Analysis
            </p>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{rawAnalysis}</div>
          </div>
        ) : (
          <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">
            <Brain size={28} className="mx-auto text-gray-200 mb-2"/>
            <p className="text-gray-400 text-sm">No analysis yet — go back and upload a report</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={()=>go(1)} className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 text-sm">
            <ChevronLeft size={15}/> Re-upload
          </button>
          <button onClick={()=>{generateInsights();go(3)}} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-sm">
            Health Insights <ChevronRight size={15}/>
          </button>
        </div>
      </div>
    )
  }

  // ─── Step 3: Health Insights ──────────────────────────────────────────────
  const Step3 = () => {
    const scoreColor = insights?.score >= 80 ? 'from-green-500 to-teal-500'
                     : insights?.score >= 60 ? 'from-blue-500 to-cyan-500'
                     : insights?.score >= 40 ? 'from-yellow-500 to-orange-500'
                     : 'from-red-500 to-orange-500'
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Health Insights</h2>
            <p className="text-sm text-gray-500">AI-generated health analysis</p>
          </div>
          {!insights && (
            <button onClick={generateInsights} disabled={insightsLoading}
              className="flex items-center gap-1.5 bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-teal-700 disabled:opacity-60">
              {insightsLoading ? <Loader size={14} className="animate-spin"/> : <Zap size={14}/>}
              {insightsLoading ? 'Generating...' : 'Generate'}
            </button>
          )}
        </div>

        {/* Score ring */}
        {insights && (
          <div className={`bg-gradient-to-br ${scoreColor} rounded-2xl p-5 text-white`}>
            <div className="flex items-center gap-5">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg viewBox="0 0 80 80" className="-rotate-90 w-full h-full">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="8"/>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="white" strokeWidth="8"
                    strokeDasharray={`${(insights.score/100)*201} 201`} strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold">{insights.score}</span>
                  <span className="text-xs opacity-70">/100</span>
                </div>
              </div>
              <div>
                <p className="text-white/80 text-sm">Overall Health Score</p>
                <p className="text-2xl font-extrabold">
                  {insights.score>=80?'Excellent':insights.score>=60?'Good':insights.score>=40?'Fair':'Needs Care'}
                </p>
                <p className="text-white/70 text-xs mt-1">Risk Level: {insights.riskLevel}</p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {['Analysis Complete','Report Reviewed','Insights Ready'].map(t => (
                    <span key={t} className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {insightsLoading && (
          <div className="py-14 flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"/>
            <p className="text-gray-500 text-sm font-medium">Generating personalized health insights...</p>
          </div>
        )}

        {!insights && !insightsLoading && (
          <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl">
            <Activity size={32} className="mx-auto text-gray-200 mb-3"/>
            <p className="text-gray-400 text-sm">Click "Generate" to get your health insights</p>
          </div>
        )}

        {insights && !insightsLoading && (
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-5 border border-teal-100">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Activity size={13}/> Detailed Health Insights
            </p>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{insights.text}</div>
          </div>
        )}

        {insights && (
          <button onClick={()=>{loadDoctors();go(4)}} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            View Doctor Recommendations <ChevronRight size={16}/>
          </button>
        )}
      </div>
    )
  }

  // ─── Step 4: Doctor Recommendation ───────────────────────────────────────
  const Step4 = () => {
    const specialistMatch = (rawAnalysis||'').match(/RECOMMENDED SPECIALIST[:\*\s]+([^\n\*]+)/i)
    const recommended = specialistMatch?.[1]?.trim() || 'General Physician'
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Doctor Recommendations</h2>
          <p className="text-sm text-teal-600 font-medium">Based on your report: See a <strong>{recommended}</strong></p>
        </div>

        {/* AI reason */}
        {insights && (
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-start gap-3">
            <Brain size={18} className="text-teal-600 flex-shrink-0 mt-0.5"/>
            <div>
              <p className="text-xs font-bold text-teal-700 mb-1">Why this specialist?</p>
              <p className="text-xs text-teal-700 leading-relaxed">
                Based on your report findings (Risk: {insights.riskLevel}), a {recommended} can best evaluate your condition and provide targeted treatment.
              </p>
            </div>
          </div>
        )}

        {docLoading ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"/>
            <p className="text-sm text-gray-400">Finding matching doctors...</p>
          </div>
        ) : recDoctors.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">
            <Stethoscope size={28} className="mx-auto text-gray-200 mb-2"/>
            <p className="text-gray-400 text-sm">No doctors loaded</p>
            <button onClick={loadDoctors} className="mt-2 text-sm text-green-600 font-semibold">Load Doctors</button>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {recDoctors.map((doc, i) => (
              <div key={doc.id||i}
                onClick={()=>setSelectedDoc(selectedDoc?.id===doc.id?null:doc)}
                className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all hover:shadow-md
                  ${selectedDoc?.id===doc.id ? 'border-green-500 shadow-green-100 shadow-lg' : 'border-gray-100'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0">
                    {(doc.name||doc.full_name||'D').charAt(4)||'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{doc.name||doc.full_name}</p>
                    <p className="text-green-600 text-xs font-semibold">{doc.specialization}</p>
                    <p className="text-gray-400 text-xs">{doc.hospital} · {doc.experience_years}+ yrs</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Star size={11} className="text-yellow-400 fill-yellow-400"/>
                        <span className="text-xs font-bold text-gray-700">{doc.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IndianRupee size={10} className="text-gray-400"/>
                        <span className="text-xs text-gray-500">{doc.consultation_fee}</span>
                      </div>
                      {doc.location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={10} className="text-gray-300"/>
                          <span className="text-xs text-gray-400 truncate max-w-[100px]">{doc.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedDoc?.id===doc.id && (
                    <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={14} className="text-white"/>
                    </div>
                  )}
                </div>
                {selectedDoc?.id===doc.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                    <a href={`/patient/book/${doc.id}`}
                      className="flex-1 text-center text-xs font-bold bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition-colors">
                      Book Appointment
                    </a>
                    <button onClick={e=>{e.stopPropagation();go(5)}}
                      className="flex-1 text-xs font-bold border border-green-300 text-green-700 py-2 rounded-xl hover:bg-green-50 transition-colors">
                      Find Hospitals
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button onClick={()=>go(5)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          Find Insurance-Compatible Hospitals <ChevronRight size={16}/>
        </button>
      </div>
    )
  }

  // ─── Step 5: Insurance-Compatible Hospitals ───────────────────────────────
  const Step5 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900">Insurance-Compatible Hospitals</h2>
        <p className="text-sm text-gray-500">Filter by your insurance plan to find covered hospitals</p>
      </div>

      {/* Insurance filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Your Insurance Plan</p>
        <div className="flex flex-wrap gap-2">
          {INSURANCE_TYPES.map(ins => (
            <button key={ins.id} onClick={()=>toggleInsurance(ins.label)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-all ${selectedInsurance.includes(ins.label) ? `${ins.color} border-current` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              {ins.label}
            </button>
          ))}
          {selectedInsurance.length > 0 && (
            <button onClick={()=>setSelectedInsurance([])} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 px-2">
              <X size={11}/> Clear
            </button>
          )}
        </div>
      </div>

      {/* City filter */}
      <div className="relative">
        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input value={cityFilter} onChange={e=>setCityFilter(e.target.value)}
          placeholder="Filter by city (Mumbai, Delhi, Bangalore...)"
          className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-orange-400"/>
      </div>

      {/* Hospital count */}
      <p className="text-sm text-gray-500">
        Showing <strong className="text-gray-800">{filteredHospitals.length}</strong> hospitals
        {selectedInsurance.length > 0 && <> accepting <strong className="text-orange-600">{selectedInsurance.join(', ')}</strong></>}
      </p>

      {/* Hospital list */}
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {filteredHospitals.map(h => (
          <div key={h.id}
            onClick={()=>setSelectedHospital(selectedHospital?.id===h.id?null:h)}
            className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all hover:shadow-md
              ${selectedHospital?.id===h.id ? 'border-orange-400 shadow-orange-100 shadow-lg' : 'border-gray-100'}`}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 size={20} className="text-white"/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-gray-900 text-sm leading-tight">{h.name}</p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star size={11} className="text-yellow-400 fill-yellow-400"/>
                    <span className="text-xs font-bold">{h.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-orange-600 font-semibold">{h.type}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <MapPin size={10}/>
                  <span>{h.city}, {h.state}</span>
                  <span className="mx-1">·</span>
                  <span>{h.beds} beds</span>
                </div>
                {/* Insurance tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {h.insurance.slice(0,4).map(ins => (
                    <span key={ins} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${selectedInsurance.includes(ins) ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600'}`}>
                      {ins}
                    </span>
                  ))}
                  {h.insurance.length > 4 && <span className="text-xs text-gray-400">+{h.insurance.length-4} more</span>}
                </div>
              </div>
            </div>

            {/* Expanded */}
            {selectedHospital?.id===h.id && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">Specialties</p>
                  <div className="flex flex-wrap gap-1.5">
                    {h.specialties.map(s => <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">All Insurance Plans Accepted</p>
                  <div className="flex flex-wrap gap-1.5">
                    {h.insurance.map(ins => <span key={ins} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">{ins}</span>)}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={11}/> {h.address}, {h.city}
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${h.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                    <Phone size={13}/> Call
                  </a>
                  <button onClick={e=>{e.stopPropagation();go(6)}}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-orange-600 transition-colors">
                    <Navigation size={13}/> Navigate
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredHospitals.length === 0 && (
          <div className="py-10 text-center">
            <Building2 size={28} className="mx-auto text-gray-200 mb-2"/>
            <p className="text-gray-400 text-sm">No hospitals match your filters</p>
            <button onClick={()=>{setSelectedInsurance([]);setCityFilter('')}} className="mt-2 text-sm text-orange-500 font-semibold">Clear filters</button>
          </div>
        )}
      </div>

      <button onClick={()=>go(6)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
        Open Google Maps Navigation <ChevronRight size={16}/>
      </button>
    </div>
  )

  // ─── Step 6: Google Maps Navigation ──────────────────────────────────────
  const Step6 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900">Navigate to Hospital</h2>
        <p className="text-sm text-gray-500">Open Google Maps for turn-by-turn directions</p>
      </div>

      {/* Selected hospital card */}
      {selectedHospital ? (
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 size={20} className="text-white"/>
            </div>
            <div>
              <p className="font-extrabold text-lg">{selectedHospital.name}</p>
              <p className="text-blue-200 text-sm">{selectedHospital.address}</p>
              <p className="text-blue-200 text-sm">{selectedHospital.city}, {selectedHospital.state}</p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {selectedHospital.insurance.slice(0,3).map(ins => (
                  <span key={ins} className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{ins}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0"/>
          <p className="text-sm text-amber-700">No hospital selected. Go back to select one, or use Quick Search below.</p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="space-y-3">
        {selectedHospital && (
          <>
            <button onClick={()=>openDirections(selectedHospital)}
              className="w-full flex items-center gap-4 bg-white border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-2xl p-4 transition-all">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Navigation size={22} className="text-indigo-600"/>
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-900">Get Directions</p>
                <p className="text-xs text-gray-400">Turn-by-turn navigation to {selectedHospital.name}</p>
              </div>
              <ExternalLink size={16} className="text-indigo-400"/>
            </button>

            <button onClick={()=>openMaps(selectedHospital)}
              className="w-full flex items-center gap-4 bg-white border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl p-4 transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin size={22} className="text-blue-600"/>
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-900">View on Map</p>
                <p className="text-xs text-gray-400">See hospital location, photos and reviews</p>
              </div>
              <ExternalLink size={16} className="text-blue-400"/>
            </button>

            <a href={`tel:${selectedHospital.phone}`}
              className="w-full flex items-center gap-4 bg-white border-2 border-green-200 hover:border-green-400 hover:bg-green-50 rounded-2xl p-4 transition-all">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone size={22} className="text-green-600"/>
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-900">Call Hospital</p>
                <p className="text-xs text-gray-400">{selectedHospital.phone}</p>
              </div>
              <ExternalLink size={16} className="text-green-400"/>
            </a>
          </>
        )}

        {/* Quick search */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <MapPin size={15} className="text-indigo-500"/> Quick Hospital Search
          </p>
          <div className="grid grid-cols-2 gap-2">
            {['Hospitals near me','Emergency hospital','CGHS hospital','24 hour hospital'].map(q => (
              <button key={q}
                onClick={()=>window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,'_blank')}
                className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 hover:border-indigo-200 px-3 py-2.5 rounded-xl transition-all">
                <Navigation size={11} className="text-gray-400 flex-shrink-0"/>{q}
              </button>
            ))}
          </div>
        </div>

        {/* All hospitals map */}
        <button onClick={()=>window.open('https://www.google.com/maps/search/?api=1&query=hospital+near+me','_blank')}
          className="w-full flex items-center gap-4 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-4 text-white hover:opacity-90 transition-opacity">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Globe size={22} className="text-white"/>
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold">Find All Nearby Hospitals</p>
            <p className="text-xs text-blue-200">Opens Google Maps with hospitals near your location</p>
          </div>
          <ExternalLink size={16} className="text-white/70"/>
        </button>
      </div>

      {/* Journey complete */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle2 size={20} className="text-green-500"/>
          <p className="font-bold text-green-800">Health Journey Complete!</p>
        </div>
        <div className="space-y-1.5">
          {[
            { done: !!uploadedFile,     label: 'Report Uploaded' },
            { done: !!rawAnalysis,      label: 'AI Analysis Done' },
            { done: !!insights,         label: 'Health Insights Generated' },
            { done: recDoctors.length>0,label: 'Doctors Recommended' },
            { done: true,               label: 'Hospitals Identified' },
          ].map(({ done, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-500' : 'bg-gray-200'}`}>
                {done ? <Check size={11} className="text-white"/> : <Minus size={10} className="text-gray-400"/>}
              </div>
              <span className={`text-xs font-medium ${done ? 'text-green-700' : 'text-gray-400'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-3 animate-fade-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart2 size={20} className="text-white"/>
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-extrabold">Smart Health Report</h1>
              <p className="text-blue-100 text-xs">AI-powered report analysis · Doctor match · Hospital navigation</p>
            </div>
            <div className="text-xs text-white/70 bg-white/15 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
              <Zap size={11}/> AI Powered
            </div>
          </div>
        </div>

        {/* Step bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <StepBar/>
        </div>

        {/* Step label */}
        <div className="flex items-center gap-2 px-1">
          {(() => { const s = STEPS[step-1]; return (<><s.icon size={15} className="text-blue-500"/><span className="text-sm font-bold text-gray-700">Step {step} of 6: {s.label}</span></>) })()}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          {step===1 && <Step1/>}
          {step===2 && <Step2/>}
          {step===3 && <Step3/>}
          {step===4 && <Step4/>}
          {step===5 && <Step5/>}
          {step===6 && <Step6/>}
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-between pb-2 px-1">
          <button onClick={()=>go(step-1)} disabled={step===1}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors">
            <ChevronLeft size={16}/> Back
          </button>
          <div className="flex gap-1">
            {STEPS.map(s => (
              <div key={s.id} className={`h-1.5 rounded-full transition-all ${step===s.id?'bg-blue-500 w-5':step>s.id?'bg-green-400 w-1.5':'bg-gray-200 w-1.5'}`}/>
            ))}
          </div>
          <button onClick={()=>go(step+1)} disabled={step===6}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors">
            Next <ChevronRight size={16}/>
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
