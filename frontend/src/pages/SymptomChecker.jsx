import { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Send, Brain, AlertCircle, AlertTriangle, CheckCircle,
  Stethoscope, ChevronRight, RefreshCw, User, Bot,
  Upload, FileText, ChevronDown, ChevronUp, X, Loader
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import DoctorCard from '../components/common/DoctorCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { analyzeSymptoms, addChatMessage, clearAnalysis } from '../redux/slices/aiSlice'
import { sendChatMessage } from '../redux/slices/aiSlice'
import { severityColor } from '../utils/helpers'
import api from '../services/api'
import toast from 'react-hot-toast'

const QUICK_SYMPTOMS = [
  'Fever, headache, body pain',
  'Chest pain and shortness of breath',
  'Stomach pain and nausea',
  'Joint pain and swelling',
  'Skin rash and itching',
  'Cough and sore throat',
]

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-blue-600' : 'bg-gray-100'}`}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-gray-600" />}
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${isUser ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'}`}>
        {message.content}
      </div>
    </div>
  )
}

function SymptomChecker() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const { analysis, loading, chatHistory, chatLoading } = useSelector(s => s.ai)
  const [mode, setMode] = useState('analyze') // analyze | chat
  const [symptoms, setSymptoms] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Report attachment state
  const [reportOpen, setReportOpen] = useState(false)
  const [reportMode, setReportMode] = useState('text') // text | image
  const [reportText, setReportText] = useState('')
  const [reportImageBase64, setReportImageBase64] = useState(null)
  const [reportImagePreview, setReportImagePreview] = useState(null)
  const [reportAnalysis, setReportAnalysis] = useState(null) // analyzed result
  const [reportAnalyzing, setReportAnalyzing] = useState(false)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => { setReportImageBase64(ev.target.result); setReportImagePreview(ev.target.result) }
    reader.readAsDataURL(file)
  }

  const analyzeReport = async () => {
    setReportAnalyzing(true)
    try {
      let res
      if (reportMode === 'image' && reportImageBase64) {
        res = await api.post('/ai/analyze-report', { image_base64: reportImageBase64 })
      } else if (reportMode === 'text' && reportText.trim()) {
        res = await api.post('/ai/analyze-report-text', {
          description: reportText.trim(),
          patient_age: age ? parseInt(age) : undefined,
          patient_gender: gender || undefined,
        })
      }
      if (res?.data?.success) {
        setReportAnalysis(res.data.data)
        toast.success('Report attached! AI will use it in the analysis.')
      } else {
        toast.error(res?.data?.error || 'Could not analyze report')
      }
    } catch {
      toast.error('Report analysis failed')
    } finally {
      setReportAnalyzing(false)
    }
  }

  const clearReport = () => {
    setReportText(''); setReportImageBase64(null); setReportImagePreview(null)
    setReportAnalysis(null); setReportOpen(false)
  }

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return
    dispatch(analyzeSymptoms({
      symptoms,
      patient_age: age ? parseInt(age) : null,
      patient_gender: gender || null,
      report_context: reportAnalysis ? JSON.stringify(reportAnalysis) : null,
    }))
  }

  const handleChat = async () => {
    if (!chatInput.trim()) return
    const userMsg = { role: 'user', content: chatInput }
    dispatch(addChatMessage(userMsg))
    const input = chatInput
    setChatInput('')
    dispatch(sendChatMessage({
      message: input,
      history: chatHistory,
      patient_age: age ? parseInt(age) : null,
      patient_gender: gender || null,
      report_context: reportAnalysis ? JSON.stringify(reportAnalysis) : null,
    }))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      mode === 'chat' ? handleChat() : handleAnalyze()
    }
  }

  const getSeverityIcon = (level) => {
    if (level === 'Emergency') return <AlertTriangle size={16} className="text-red-600" />
    if (level === 'Severe') return <AlertCircle size={16} className="text-orange-600" />
    return <CheckCircle size={16} className="text-green-600" />
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain size={24} className="text-blue-600" />
            AI Symptom Checker
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Describe your symptoms in natural language and get AI-powered health insights.</p>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            <strong>Disclaimer:</strong> This is not a medical diagnosis. AI analysis is for informational purposes only.
            Always consult a qualified doctor for proper medical advice, diagnosis, and treatment.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setMode('analyze')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'analyze' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
          >
            Symptom Analysis
          </button>
          <button
            onClick={() => setMode('chat')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'chat' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
          >
            AI Health Chat
          </button>
        </div>

        {/* Patient Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Your Age (optional)</label>
            <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 28" className="input-field" min="1" max="120" />
          </div>
          <div>
            <label className="label">Gender (optional)</label>
            <select value={gender} onChange={e => setGender(e.target.value)} className="input-field">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {mode === 'analyze' ? (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Describe Your Symptoms</h2>
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Quick select:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_SYMPTOMS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSymptoms(s)}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. I have a high fever of 102°F, severe headache, body aches, and fatigue for the past 2 days. I also have a slight cough..."
              className="input-field h-32 resize-none mb-4"
            />

            {/* Report Attachment Section */}
            <div className="mb-4 border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setReportOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
              >
                <span className="flex items-center gap-2 font-medium text-gray-700">
                  <FileText size={15} className="text-teal-600" />
                  Attach Medical Report
                  {reportAnalysis && (
                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">Attached</span>
                  )}
                  <span className="text-xs text-gray-400 font-normal">(Optional — improves AI accuracy)</span>
                </span>
                {reportOpen ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
              </button>

              {reportOpen && (
                <div className="p-4 space-y-3">
                  {reportAnalysis ? (
                    <div className="flex items-start gap-3 bg-teal-50 rounded-xl p-3">
                      <CheckCircle size={16} className="text-teal-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-teal-800">Report attached</p>
                        <p className="text-xs text-teal-600 mt-0.5 truncate">{reportAnalysis.report_type || 'Medical Report'} · {reportAnalysis.overall_summary?.slice(0, 80)}…</p>
                      </div>
                      <button onClick={clearReport} className="text-teal-500 hover:text-red-500 transition-colors flex-shrink-0">
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Mode toggle */}
                      <div className="flex gap-1.5 p-1 bg-gray-100 rounded-lg w-fit">
                        {['text', 'image'].map(m => (
                          <button key={m} onClick={() => setReportMode(m)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${reportMode === m ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500'}`}>
                            {m === 'text' ? 'Describe / Paste' : 'Upload Image'}
                          </button>
                        ))}
                      </div>

                      {reportMode === 'text' ? (
                        <textarea
                          value={reportText}
                          onChange={e => setReportText(e.target.value)}
                          placeholder={"Paste or type your report values:\ne.g. Hemoglobin: 9.5 g/dL (low), Blood Sugar: 126 mg/dL, WBC: 11,000..."}
                          className="input-field h-24 resize-none text-sm"
                        />
                      ) : (
                        <div>
                          <div onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors">
                            {reportImagePreview
                              ? <img src={reportImagePreview} alt="Report" className="max-h-28 mx-auto rounded-lg object-contain" />
                              : <><Upload size={22} className="mx-auto text-gray-300 mb-1" /><p className="text-xs text-gray-500">Click to upload report image (JPG/PNG, max 5MB)</p></>
                            }
                          </div>
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </div>
                      )}

                      <button
                        onClick={analyzeReport}
                        disabled={reportAnalyzing || (reportMode === 'text' ? !reportText.trim() : !reportImageBase64)}
                        className="btn-primary text-sm py-2 flex items-center gap-2 w-full justify-center"
                      >
                        {reportAnalyzing
                          ? <><Loader size={14} className="animate-spin" /> Analyzing Report...</>
                          : <><FileText size={14} /> Attach & Analyze Report</>}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {analysis && (
                <button
                  onClick={() => { dispatch(clearAnalysis()); setSymptoms('') }}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Reset
                </button>
              )}
              <button
                onClick={handleAnalyze}
                disabled={loading || !symptoms.trim()}
                className="btn-primary flex items-center gap-2 flex-1 justify-center"
              >
                {loading ? <LoadingSpinner size="sm" /> : <><Brain size={16} /> {reportAnalysis ? 'Analyze with Report' : 'Analyze Symptoms'}</>}
              </button>
            </div>
          </div>
        ) : (
          <div className="card flex flex-col" style={{ height: '400px' }}>
            <h2 className="font-semibold text-gray-900 mb-4">AI Health Assistant</h2>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
              {chatHistory.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Bot size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Ask me anything about your health concerns</p>
                </div>
              )}
              {chatHistory.map((msg, i) => <MessageBubble key={i} message={msg} />)}
              {chatLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Bot size={14} className="text-gray-600" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2 border-t border-gray-100 pt-4">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your health question..."
                className="input-field flex-1"
              />
              <button
                onClick={handleChat}
                disabled={chatLoading || !chatInput.trim()}
                className="btn-primary p-3 flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        {/* AI Analysis Results */}
        {analysis && mode === 'analyze' && (
          <div className="space-y-4 animate-slide-up">
            {/* Emergency Warning */}
            {analysis.emergency_warning && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex gap-3">
                <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">⚠️ Emergency Warning!</p>
                  <p className="text-sm text-red-700 mt-1">Your symptoms may indicate a serious condition. Please seek emergency medical care immediately or call emergency services.</p>
                </div>
              </div>
            )}

            {/* Severity & Specialist */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card">
                <p className="text-xs text-gray-400 mb-2">Severity Level</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${severityColor(analysis.severity_level)}`}>
                  {getSeverityIcon(analysis.severity_level)}
                  {analysis.severity_level}
                </div>
              </div>
              <div className="card">
                <p className="text-xs text-gray-400 mb-2">Recommended Specialist</p>
                <div className="flex items-center gap-2">
                  <Stethoscope size={16} className="text-blue-600" />
                  <span className="font-semibold text-gray-900 text-sm">{analysis.specialist_type}</span>
                </div>
              </div>
            </div>

            {/* Possible Conditions */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Possible Conditions</h3>
                {analysis.confidence_score && (
                  <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full">
                    AI Confidence: {analysis.confidence_score}%
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {analysis.possible_conditions?.map((cond, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm text-gray-900">{cond.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        cond.probability === 'High' ? 'bg-red-100 text-red-700' :
                        cond.probability === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{cond.probability}</span>
                    </div>
                    {cond.confidence && (
                      <div className="mb-1.5">
                        <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                          <span>Match probability</span>
                          <span>{cond.confidence}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${
                            cond.confidence > 70 ? 'bg-red-500' :
                            cond.confidence > 40 ? 'bg-yellow-500' : 'bg-green-500'
                          }`} style={{ width: `${cond.confidence}%` }} />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">{cond.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SHAP / LIME Insights */}
            {analysis.shap_insights?.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-1">
                  <Brain size={16} className="text-purple-600" />
                  <h3 className="font-semibold text-gray-900">AI Explainability (SHAP Insights)</h3>
                </div>
                <p className="text-xs text-gray-400 mb-4">Shows which symptoms contributed most to the AI's diagnosis</p>
                <div className="space-y-3">
                  {analysis.shap_insights.map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            item.impact === 'positive' ? 'bg-red-500' : 'bg-blue-400'
                          }`} />
                          <span className="text-sm font-medium text-gray-800 capitalize">{item.symptom}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-600">{item.importance}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            item.impact === 'positive' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                            'bg-gradient-to-r from-blue-400 to-blue-600'
                          }`}
                          style={{ width: `${item.importance}%` }}
                        />
                      </div>
                      {item.explanation && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> High contribution</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> Moderate contribution</span>
                </div>
              </div>
            )}

            {/* Risk Factors */}
            {analysis.risk_factors?.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle size={15} className="text-orange-500" /> Risk Factors
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.risk_factors.map((rf, i) => (
                    <span key={i} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-full font-medium">
                      {rf}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Precautions */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Precautions & Recommendations</h3>
              <ul className="space-y-2">
                {analysis.precautions?.map((p, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Doctors */}
            {analysis.recommended_doctors?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Recommended Doctors</h3>
                  <button
                    onClick={() => navigate('/patient/doctors')}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View all <ChevronRight size={14} />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {analysis.recommended_doctors.slice(0, 4).map(doc => (
                    <DoctorCard key={doc.id} doctor={doc} />
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-700 font-medium">{analysis.disclaimer}</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default SymptomChecker
