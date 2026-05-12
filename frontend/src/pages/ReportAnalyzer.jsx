import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, Send, Bot, User, Loader, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  high: 'text-red-600 bg-red-50 border-red-200',
  low: 'text-blue-600 bg-blue-50 border-blue-200',
  normal: 'text-green-600 bg-green-50 border-green-200',
  unknown: 'text-gray-600 bg-gray-50 border-gray-200',
}

const SEVERITY_COLORS = {
  'Normal': 'bg-green-100 text-green-800',
  'Mild Concern': 'bg-yellow-100 text-yellow-800',
  'Moderate Concern': 'bg-orange-100 text-orange-800',
  'Urgent': 'bg-red-100 text-red-800',
}

function ParameterCard({ param }) {
  const color = STATUS_COLORS[param.status] || STATUS_COLORS.unknown
  return (
    <div className={`border rounded-xl p-3 ${color}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{param.name}</p>
          {param.value && (
            <p className="text-lg font-bold mt-0.5">
              {param.value} <span className="text-xs font-normal opacity-70">{param.unit}</span>
            </p>
          )}
          {param.normal_range && (
            <p className="text-xs opacity-70 mt-0.5">Normal: {param.normal_range}</p>
          )}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/60 capitalize flex-shrink-0">
          {param.status}
        </span>
      </div>
      {param.interpretation && (
        <p className="text-xs mt-2 opacity-80 border-t border-current/20 pt-2">{param.interpretation}</p>
      )}
    </div>
  )
}

function ChatBubble({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isUser ? 'bg-blue-600' : 'bg-green-600'}`}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
        isUser ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
      }`}>
        {content}
      </div>
    </div>
  )
}

export default function ReportAnalyzer() {
  const [mode, setMode] = useState('text') // 'text' | 'image'
  const [description, setDescription] = useState('')
  const [imageBase64, setImageBase64] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [patientAge, setPatientAge] = useState('')
  const [patientGender, setPatientGender] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [showParams, setShowParams] = useState(true)

  const [chatHistory, setChatHistory] = useState([])
  const [chatMessage, setChatMessage] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImageBase64(ev.target.result)
      setImagePreview(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (mode === 'text' && !description.trim()) {
      toast.error('Please describe your report')
      return
    }
    if (mode === 'image' && !imageBase64) {
      toast.error('Please upload a report image')
      return
    }
    setAnalyzing(true)
    setAnalysisResult(null)
    setChatHistory([])
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
        setAnalysisResult(res.data.data)
        setChatHistory([{
          role: 'assistant',
          content: `I've analyzed your ${res.data.data.report_type || 'medical report'}. ${res.data.data.overall_summary} Feel free to ask me anything about your results!`
        }])
        toast.success('Report analyzed!')
      } else {
        toast.error(res.data.error || 'Analysis failed')
      }
    } catch (e) {
      toast.error('Failed to analyze report')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleChat = async () => {
    if (!chatMessage.trim() || chatLoading) return
    const userMsg = chatMessage.trim()
    setChatMessage('')
    const newHistory = [...chatHistory, { role: 'user', content: userMsg }]
    setChatHistory(newHistory)
    setChatLoading(true)
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    try {
      const res = await api.post('/ai/chat', {
        message: userMsg,
        history: newHistory.slice(-10),
        patient_age: patientAge ? parseInt(patientAge) : undefined,
        patient_gender: patientGender || undefined,
        report_context: analysisResult ? JSON.stringify(analysisResult) : undefined,
      })
      const reply = res.data.response
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I could not process your question. Please try again.'
      }])
    } finally {
      setChatLoading(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  const handleReset = () => {
    setAnalysisResult(null)
    setDescription('')
    setImageBase64(null)
    setImagePreview(null)
    setChatHistory([])
    setPatientAge('')
    setPatientGender('')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-6 text-white">
          <p className="text-teal-100 text-sm">AI-Powered</p>
          <h1 className="text-2xl font-bold mt-1">Medical Report Analyzer</h1>
          <p className="text-teal-100 text-sm mt-1">Upload your lab report or describe it — our AI will explain every value in plain language and answer your questions.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-4">
            <div className="card">
              {/* Mode Switch */}
              <div className="flex gap-2 mb-5 p-1 bg-gray-100 rounded-xl">
                {['text', 'image'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      mode === m ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {m === 'text' ? 'Describe Report' : 'Upload Image'}
                  </button>
                ))}
              </div>

              {/* Patient Info */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Age (optional)</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={e => setPatientAge(e.target.value)}
                    placeholder="e.g. 35"
                    className="input-field"
                  />
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

              {mode === 'text' ? (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Describe your report values</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={`Example:\nHemoglobin: 9.5 g/dL (low)\nWBC: 11,000 (high)\nBlood Sugar (Fasting): 126 mg/dL\nCreatinine: 1.1 mg/dL\n\nOr paste the text from your report here...`}
                    className="input-field h-44 resize-none text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Upload report image (JPG/PNG, max 5MB)</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Report" className="max-h-40 mx-auto rounded-lg object-contain" />
                    ) : (
                      <>
                        <Upload size={28} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">Click to upload your report image</p>
                        <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG</p>
                      </>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {analyzing ? <><Loader size={16} className="animate-spin" /> Analyzing...</> : <><FileText size={16} /> Analyze Report</>}
                </button>
                {analysisResult && (
                  <button onClick={handleReset} className="btn-secondary flex items-center gap-1 px-3">
                    <RotateCcw size={14} /> Reset
                  </button>
                )}
              </div>

              <div className="mt-3 p-3 bg-amber-50 rounded-xl flex gap-2.5">
                <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">AI analysis is for educational purposes only. Always consult a qualified doctor for diagnosis and treatment.</p>
              </div>
            </div>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="card space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle size={18} className="text-teal-600" />
                    Analysis Results
                  </h2>
                  {analysisResult.severity && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${SEVERITY_COLORS[analysisResult.severity] || 'bg-gray-100 text-gray-700'}`}>
                      {analysisResult.severity}
                    </span>
                  )}
                </div>

                {analysisResult.report_type && (
                  <div className="bg-teal-50 rounded-xl px-4 py-2.5">
                    <p className="text-xs text-teal-600 font-medium">Report Type</p>
                    <p className="text-sm font-semibold text-teal-800 mt-0.5">{analysisResult.report_type}</p>
                  </div>
                )}

                {analysisResult.overall_summary && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Summary</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{analysisResult.overall_summary}</p>
                  </div>
                )}

                {analysisResult.parameters?.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowParams(p => !p)}
                      className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2"
                    >
                      {showParams ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      Parameters ({analysisResult.parameters.length})
                    </button>
                    {showParams && (
                      <div className="grid gap-2">
                        {analysisResult.parameters.map((p, i) => <ParameterCard key={i} param={p} />)}
                      </div>
                    )}
                  </div>
                )}

                {analysisResult.concerns?.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-red-700 mb-1.5">Concerns</p>
                    <ul className="space-y-1">
                      {analysisResult.concerns.map((c, i) => (
                        <li key={i} className="text-xs text-red-600 flex gap-1.5"><span className="mt-0.5">•</span>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.recommendations?.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-green-700 mb-1.5">Recommendations</p>
                    <ul className="space-y-1">
                      {analysisResult.recommendations.map((r, i) => (
                        <li key={i} className="text-xs text-green-600 flex gap-1.5"><span className="mt-0.5">✓</span>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.doctor_to_consult && (
                  <div className="bg-blue-50 rounded-xl px-4 py-2.5">
                    <p className="text-xs text-blue-600 font-medium">Recommended Specialist</p>
                    <p className="text-sm font-semibold text-blue-800 mt-0.5">{analysisResult.doctor_to_consult}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Chat Panel */}
          <div className="card flex flex-col" style={{ minHeight: '520px' }}>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">AI Health Assistant</p>
                <p className="text-xs text-gray-400">
                  {analysisResult ? 'Knows your report — ask anything!' : 'Analyze a report to unlock report-aware answers'}
                </p>
              </div>
              {analysisResult && (
                <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">Report Loaded</span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ maxHeight: '380px' }}>
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 text-gray-400">
                  <Bot size={40} className="mb-3 opacity-20" />
                  <p className="text-sm">Analyze your report first, then ask me anything about your results.</p>
                  <p className="text-xs mt-2 opacity-70">I'll explain values in plain language and suggest next steps.</p>
                </div>
              ) : (
                chatHistory.map((msg, i) => <ChatBubble key={i} role={msg.role} content={msg.content} />)
              )}
              {chatLoading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
                placeholder={analysisResult ? 'Ask about your report results...' : 'Analyze a report to start chatting...'}
                disabled={!analysisResult}
                className="input-field flex-1 text-sm"
              />
              <button
                onClick={handleChat}
                disabled={!chatMessage.trim() || chatLoading || !analysisResult}
                className="btn-primary px-4 py-2.5 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
