import { useState, useRef } from 'react'
import {
  Camera, RefreshCw, Scan, AlertCircle, CheckCircle, Bot, X,
  Upload, FileText, Pill, ClipboardList, Loader, RotateCcw,
  Send, User, ChevronDown, ChevronUp, Microscope, FlaskConical
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

const TOOLS = [
  {
    id: 'scanner',
    label: 'AI Health Scanner',
    icon: Camera,
    emoji: '📷',
    desc: 'Use your camera for instant AI health scan',
    color: 'bg-blue-600',
    light: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'prescription',
    label: 'Prescription Reader',
    icon: Pill,
    emoji: '💊',
    desc: 'Upload prescription image — AI reads & explains',
    color: 'bg-green-600',
    light: 'bg-green-50 text-green-700 border-green-200',
  },
  {
    id: 'report',
    label: 'Report Analyzer',
    icon: FileText,
    emoji: '🧪',
    desc: 'Upload lab report image — AI explains every value',
    color: 'bg-purple-600',
    light: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'fullreport',
    label: 'Full Report Analyzer',
    icon: FlaskConical,
    emoji: '🔬',
    desc: 'Describe or upload report + AI chat follow-up',
    color: 'bg-teal-600',
    light: 'bg-teal-50 text-teal-700 border-teal-200',
  },
]

const STATUS_COLORS = {
  high: 'text-red-600 bg-red-50 border-red-200',
  low: 'text-blue-600 bg-blue-50 border-blue-200',
  normal: 'text-green-600 bg-green-50 border-green-200',
  unknown: 'text-gray-600 bg-gray-50 border-gray-200',
}

// ── Shared Result Panel ───────────────────────────────────────────────────────
function ResultPanel({ result, toolId }) {
  const [showParams, setShowParams] = useState(true)

  if (toolId === 'prescription') {
    return (
      <div className="space-y-4 animate-fade-in">
        {result.patient_name && (
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-blue-500 font-medium">Patient</p>
            <p className="text-sm font-bold text-blue-800">{result.patient_name}</p>
          </div>
        )}
        {result.doctor_name && (
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs text-green-500 font-medium">Prescribed by</p>
            <p className="text-sm font-bold text-green-800">{result.doctor_name}</p>
          </div>
        )}
        {result.medications?.length > 0 && (
          <div>
            <p className="text-sm font-bold text-gray-800 mb-2">Medications</p>
            <div className="space-y-2">
              {result.medications.map((med, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3 bg-white shadow-sm">
                  <p className="font-semibold text-gray-900 text-sm">{med.name}</p>
                  {med.dosage && <p className="text-xs text-gray-500 mt-0.5">Dosage: {med.dosage}</p>}
                  {med.frequency && <p className="text-xs text-gray-500">Frequency: {med.frequency}</p>}
                  {med.duration && <p className="text-xs text-gray-500">Duration: {med.duration}</p>}
                  {med.instructions && <p className="text-xs text-blue-600 mt-1 bg-blue-50 rounded-lg px-2 py-1">{med.instructions}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        {result.instructions?.length > 0 && (
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-xs font-bold text-amber-700 mb-2">General Instructions</p>
            <ul className="space-y-1">
              {result.instructions.map((ins, i) => (
                <li key={i} className="text-xs text-amber-700 flex gap-1.5"><span>•</span>{ins}</li>
              ))}
            </ul>
          </div>
        )}
        {result.follow_up && (
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-xs text-purple-600 font-medium">Follow-up</p>
            <p className="text-sm text-purple-800">{result.follow_up}</p>
          </div>
        )}
      </div>
    )
  }

  // Report / Scanner result
  return (
    <div className="space-y-4 animate-fade-in">
      {result.report_type && (
        <div className="bg-teal-50 rounded-xl p-3">
          <p className="text-xs text-teal-500 font-medium">Detected Type</p>
          <p className="text-sm font-bold text-teal-800">{result.report_type}</p>
        </div>
      )}
      {result.overall_summary && (
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1">Summary</p>
          <p className="text-sm text-gray-700 leading-relaxed">{result.overall_summary}</p>
        </div>
      )}
      {result.parameters?.length > 0 && (
        <div>
          <button onClick={() => setShowParams(p => !p)}
            className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-2">
            {showParams ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            Parameters ({result.parameters.length})
          </button>
          {showParams && (
            <div className="grid sm:grid-cols-2 gap-2">
              {result.parameters.map((p, i) => (
                <div key={i} className={`border rounded-xl p-3 ${STATUS_COLORS[p.status] || STATUS_COLORS.unknown}`}>
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-semibold text-sm">{p.name}</p>
                    <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-white/60 font-bold flex-shrink-0">{p.status}</span>
                  </div>
                  {p.value && <p className="text-base font-extrabold mt-0.5">{p.value} <span className="text-xs font-normal opacity-70">{p.unit}</span></p>}
                  {p.normal_range && <p className="text-xs opacity-70">Normal: {p.normal_range}</p>}
                  {p.interpretation && <p className="text-xs mt-1.5 opacity-80 border-t border-current/20 pt-1.5">{p.interpretation}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {result.concerns?.length > 0 && (
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-xs font-bold text-red-700 mb-1.5">Concerns</p>
          <ul className="space-y-1">{result.concerns.map((c, i) => <li key={i} className="text-xs text-red-600 flex gap-1.5"><span>•</span>{c}</li>)}</ul>
        </div>
      )}
      {result.recommendations?.length > 0 && (
        <div className="bg-green-50 rounded-xl p-3">
          <p className="text-xs font-bold text-green-700 mb-1.5">Recommendations</p>
          <ul className="space-y-1">{result.recommendations.map((r, i) => <li key={i} className="text-xs text-green-600 flex gap-1.5"><span>✓</span>{r}</li>)}</ul>
        </div>
      )}
      {result.doctor_to_consult && (
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs text-blue-500 font-medium">Recommended Specialist</p>
          <p className="text-sm font-bold text-blue-800">{result.doctor_to_consult}</p>
        </div>
      )}
    </div>
  )
}

// ── Camera Scanner Tool ───────────────────────────────────────────────────────
function CameraScannerTool() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [captured, setCaptured] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      setCameraActive(true); setCaptured(null); setResult(null)
    } catch { toast.error('Camera access denied. Please allow camera permission.') }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null; setCameraActive(false)
  }

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    setCaptured(canvas.toDataURL('image/jpeg', 0.85))
    stopCamera()
  }

  const analyze = async () => {
    if (!captured) return
    setScanning(true); setResult(null); setProgress(0)
    const iv = setInterval(() => setProgress(p => p >= 90 ? (clearInterval(iv), 90) : p + 10), 200)
    try {
      const res = await api.post('/ai/analyze-report', { image_base64: captured })
      clearInterval(iv); setProgress(100)
      if (res.data.success) setResult(res.data.data)
      else toast.error(res.data.error || 'Scan failed')
    } catch { toast.error('Failed to analyze') }
    finally { setScanning(false) }
  }

  const reset = () => { setCaptured(null); setResult(null); setProgress(0); stopCamera() }

  return (
    <div className="space-y-4">
      {/* Camera/Preview */}
      <div className="relative bg-gray-900 rounded-2xl overflow-hidden" style={{ minHeight: 260 }}>
        <video ref={videoRef} className={`w-full rounded-2xl object-cover ${cameraActive ? 'block' : 'hidden'}`} style={{ maxHeight: 320 }} muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
        {captured && !cameraActive && (
          <img src={captured} alt="Captured" className="w-full rounded-2xl object-cover" style={{ maxHeight: 320 }} />
        )}
        {scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-2xl">
            <div className="relative w-20 h-20 mb-3">
              <div className="absolute inset-0 border-4 border-blue-400 rounded-full animate-ping opacity-40" />
              <div className="w-full h-full flex items-center justify-center">
                <Bot size={32} className="text-blue-400 animate-pulse" />
              </div>
            </div>
            <p className="text-white font-bold">AI Scanning... {Math.round(progress)}%</p>
            <div className="w-40 bg-gray-700 rounded-full h-2 mt-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        {!cameraActive && !captured && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <Camera size={40} className="mb-2 opacity-30" />
            <p className="text-sm">Camera preview here</p>
          </div>
        )}
        {cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-blue-400/60 rounded-2xl" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!cameraActive && !captured && (
          <button onClick={startCamera} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Camera size={16} /> Start Camera
          </button>
        )}
        {cameraActive && (
          <>
            <button onClick={stopCamera} className="btn-secondary flex-1 flex items-center justify-center gap-2"><X size={15} /> Cancel</button>
            <button onClick={capture} className="btn-primary flex-1 flex items-center justify-center gap-2"><Scan size={15} /> Capture</button>
          </>
        )}
        {captured && !scanning && !result && (
          <>
            <button onClick={reset} className="btn-secondary flex items-center gap-1.5 px-4"><RefreshCw size={14} /> Retake</button>
            <button onClick={analyze} className="btn-primary flex-1 flex items-center justify-center gap-2"><Bot size={15} /> Analyze with AI</button>
          </>
        )}
        {result && (
          <button onClick={reset} className="btn-secondary flex-1 flex items-center justify-center gap-2"><RefreshCw size={14} /> New Scan</button>
        )}
      </div>

      {result && <ResultPanel result={result} toolId="scanner" />}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
        <AlertCircle size={13} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700">AI scan is for educational awareness only. Always consult a doctor.</p>
      </div>
    </div>
  )
}

// ── Upload Tool (Prescription + Report) ──────────────────────────────────────
function UploadTool({ toolId }) {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = () => { setImage(reader.result); setPreview(reader.result); setResult(null) }
    reader.readAsDataURL(file)
  }

  const analyze = async () => {
    if (!image) { toast.error('Please upload an image first'); return }
    setLoading(true); setResult(null)
    try {
      const endpoint = toolId === 'prescription' ? '/ai/read-prescription' : '/ai/analyze-report'
      const res = await api.post(endpoint, { image_base64: image })
      if (res.data.success) setResult(res.data.data)
      else toast.error(res.data.error || 'Analysis failed')
    } catch { toast.error('Failed to analyze') }
    finally { setLoading(false) }
  }

  const reset = () => { setImage(null); setPreview(null); setResult(null) }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onClick={() => !image && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${image ? 'border-gray-200' : 'border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30'}`}
      >
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="Uploaded" className="max-h-52 mx-auto rounded-xl object-contain" />
            <button onClick={(e) => { e.stopPropagation(); reset() }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
              <X size={12} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500 font-medium">Click to upload</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 5MB</p>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <div className="flex gap-2">
        {image && !result && (
          <button onClick={() => { fileRef.current?.click() }} className="btn-secondary flex items-center gap-1.5 px-4">
            <RefreshCw size={14} /> Change
          </button>
        )}
        <button onClick={analyze} disabled={!image || loading}
          className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40">
          {loading ? <><Loader size={15} className="animate-spin" /> Analyzing...</> : <><Bot size={15} /> Analyze</>}
        </button>
        {result && (
          <button onClick={reset} className="btn-secondary flex items-center gap-1.5 px-4">
            <RotateCcw size={14} /> Reset
          </button>
        )}
      </div>

      {result && <ResultPanel result={result} toolId={toolId} />}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
        <AlertCircle size={13} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700">AI analysis is for educational purposes only. Always consult a qualified doctor.</p>
      </div>
    </div>
  )
}

// ── Full Report Analyzer (text + image + chat) ────────────────────────────────
function FullReportTool() {
  const [mode, setMode] = useState('text')
  const [description, setDescription] = useState('')
  const [imageBase64, setImageBase64] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [patientAge, setPatientAge] = useState('')
  const [patientGender, setPatientGender] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [chatMsg, setChatMsg] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [showParams, setShowParams] = useState(true)
  const chatEndRef = useRef(null)
  const fileRef = useRef(null)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => { setImageBase64(ev.target.result); setImagePreview(ev.target.result) }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (mode === 'text' && !description.trim()) { toast.error('Please describe your report'); return }
    if (mode === 'image' && !imageBase64) { toast.error('Please upload a report image'); return }
    setAnalyzing(true); setResult(null); setChatHistory([])
    try {
      let res
      if (mode === 'image') {
        res = await api.post('/ai/analyze-report', { image_base64: imageBase64 })
      } else {
        res = await api.post('/ai/analyze-report-text', {
          description: description.trim(),
          patient_age: patientAge ? parseInt(patientAge) : undefined,
          patient_gender: patientGender || undefined,
        })
      }
      if (res.data.success) {
        setResult(res.data.data)
        setChatHistory([{ role: 'assistant', content: `I've analyzed your ${res.data.data.report_type || 'report'}. ${res.data.data.overall_summary} Ask me anything!` }])
        toast.success('Report analyzed!')
      } else { toast.error(res.data.error || 'Analysis failed') }
    } catch { toast.error('Failed to analyze report') }
    finally { setAnalyzing(false) }
  }

  const handleChat = async () => {
    if (!chatMsg.trim() || chatLoading) return
    const userMsg = chatMsg.trim(); setChatMsg('')
    const newHistory = [...chatHistory, { role: 'user', content: userMsg }]
    setChatHistory(newHistory); setChatLoading(true)
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    try {
      const res = await api.post('/ai/chat', {
        message: userMsg, history: newHistory.slice(-10),
        patient_age: patientAge ? parseInt(patientAge) : undefined,
        patient_gender: patientGender || undefined,
        report_context: result ? JSON.stringify(result) : undefined,
      })
      setChatHistory(p => [...p, { role: 'assistant', content: res.data.response }])
    } catch {
      setChatHistory(p => [...p, { role: 'assistant', content: 'Sorry, could not process your question. Please try again.' }])
    } finally {
      setChatLoading(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  const reset = () => { setResult(null); setDescription(''); setImageBase64(null); setImagePreview(null); setChatHistory([]) }

  return (
    <div className="space-y-4">
      {/* Mode Switch */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {['text', 'image'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {m === 'text' ? '📝 Describe Report' : '📷 Upload Image'}
          </button>
        ))}
      </div>

      {/* Patient Info */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Age (optional)</label>
          <input type="number" value={patientAge} onChange={e => setPatientAge(e.target.value)} placeholder="e.g. 35" className="input-field" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Gender (optional)</label>
          <select value={patientGender} onChange={e => setPatientGender(e.target.value)} className="input-field">
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Input */}
      {mode === 'text' ? (
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder={`Paste your report values here:\nHemoglobin: 9.5 g/dL\nBlood Sugar: 126 mg/dL\n...`}
          className="input-field h-36 resize-none text-sm" />
      ) : (
        <div onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors">
          {imagePreview
            ? <img src={imagePreview} alt="Report" className="max-h-36 mx-auto rounded-lg object-contain" />
            : <><Upload size={24} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Click to upload report image</p></>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={handleAnalyze} disabled={analyzing}
          className="flex-1 btn-primary flex items-center justify-center gap-2">
          {analyzing ? <><Loader size={15} className="animate-spin"/> Analyzing...</> : <><Bot size={15}/> Analyze Report</>}
        </button>
        {result && <button onClick={reset} className="btn-secondary px-4 flex items-center gap-1"><RotateCcw size={14}/> Reset</button>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3 border-t border-gray-100 pt-4">
          {result.report_type && (
            <div className="bg-teal-50 rounded-xl px-4 py-2.5">
              <p className="text-xs text-teal-600 font-medium">Report Type</p>
              <p className="text-sm font-bold text-teal-800">{result.report_type}</p>
            </div>
          )}
          {result.overall_summary && <p className="text-sm text-gray-700 leading-relaxed">{result.overall_summary}</p>}
          {result.parameters?.length > 0 && (
            <div>
              <button onClick={() => setShowParams(p => !p)} className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-2">
                {showParams ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} Parameters ({result.parameters.length})
              </button>
              {showParams && (
                <div className="grid sm:grid-cols-2 gap-2">
                  {result.parameters.map((p, i) => (
                    <div key={i} className={`border rounded-xl p-3 ${STATUS_COLORS[p.status] || STATUS_COLORS.unknown}`}>
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-semibold text-sm">{p.name}</p>
                        <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-white/60 font-bold">{p.status}</span>
                      </div>
                      {p.value && <p className="text-base font-extrabold">{p.value} <span className="text-xs font-normal opacity-70">{p.unit}</span></p>}
                      {p.normal_range && <p className="text-xs opacity-70">Normal: {p.normal_range}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {result.concerns?.length > 0 && (
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-xs font-bold text-red-700 mb-1.5">Concerns</p>
              <ul className="space-y-1">{result.concerns.map((c,i) => <li key={i} className="text-xs text-red-600 flex gap-1.5"><span>•</span>{c}</li>)}</ul>
            </div>
          )}
          {result.recommendations?.length > 0 && (
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs font-bold text-green-700 mb-1.5">Recommendations</p>
              <ul className="space-y-1">{result.recommendations.map((r,i) => <li key={i} className="text-xs text-green-600 flex gap-1.5"><span>✓</span>{r}</li>)}</ul>
            </div>
          )}
          {result.doctor_to_consult && (
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-blue-500 font-medium">Recommended Specialist</p>
              <p className="text-sm font-bold text-blue-800">{result.doctor_to_consult}</p>
            </div>
          )}
        </div>
      )}

      {/* AI Chat */}
      {chatHistory.length > 0 && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5"><Bot size={13} className="text-teal-600"/> Ask AI about your results</p>
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-teal-600' : 'bg-gray-200'}`}>
                  {msg.role === 'user' ? <User size={13} className="text-white"/> : <Bot size={13} className="text-gray-600"/>}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center"><Bot size={13} className="text-gray-600"/></div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 flex gap-1">
                  {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}
                </div>
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>
          <div className="flex gap-2">
            <input type="text" value={chatMsg} onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
              placeholder="Ask about your report results..."
              className="input-field flex-1 text-sm"/>
            <button onClick={handleChat} disabled={!chatMsg.trim() || chatLoading}
              className="btn-primary px-4 disabled:opacity-50"><Send size={15}/></button>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
        <AlertCircle size={13} className="text-amber-600 mt-0.5 flex-shrink-0"/>
        <p className="text-xs text-amber-700">AI analysis is for educational purposes only. Always consult a qualified doctor.</p>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AIHealthAnalyzer() {
  const [activeTool, setActiveTool] = useState('scanner')
  const tool = TOOLS.find(t => t.id === activeTool)

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Microscope size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold">AI Health Analyzer</h1>
              <p className="text-blue-200 text-xs">Camera Scan · Prescription Reader · Report Analyzer</p>
            </div>
          </div>
        </div>

        {/* Tool Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TOOLS.map(({ id, label, emoji, desc, color, light }) => (
            <button key={id} onClick={() => setActiveTool(id)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                activeTool === id
                  ? `${light} border-current shadow-sm`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}>
              <span className="text-2xl block mb-2">{emoji}</span>
              <p className={`text-xs font-bold leading-tight ${activeTool === id ? '' : 'text-gray-700'}`}>{label}</p>
              <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{desc}</p>
            </button>
          ))}
        </div>

        {/* Active Tool */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
            <div className={`w-8 h-8 ${tool.color} rounded-xl flex items-center justify-center`}>
              <tool.icon size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{tool.label}</p>
              <p className="text-xs text-gray-400">{tool.desc}</p>
            </div>
          </div>

          {activeTool === 'scanner' && <CameraScannerTool />}
          {activeTool === 'prescription' && <UploadTool toolId="prescription" />}
          {activeTool === 'report' && <UploadTool toolId="report" />}
          {activeTool === 'fullreport' && <FullReportTool />}
        </div>
      </div>
    </DashboardLayout>
  )
}
