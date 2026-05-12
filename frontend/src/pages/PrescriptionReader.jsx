import { useState, useRef } from 'react'
import { Upload, Scan, FileText, Pill, User, Calendar, AlertCircle, CheckCircle, X, Loader, ClipboardList } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

const TABS = [
  { value: 'prescription', label: 'Prescription Reader', icon: '💊' },
  { value: 'report', label: 'Health Report Analyzer', icon: '🧪' },
]

function PrescriptionReader() {
  const [activeTab, setActiveTab] = useState('prescription')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = () => {
      setImage(reader.result)
      setImagePreview(reader.result)
      setResult(null)
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!image) { toast.error('Please upload an image first'); return }
    setLoading(true)
    setResult(null)
    try {
      const endpoint = activeTab === 'prescription' ? '/ai/read-prescription' : '/ai/analyze-report'
      const res = await api.post(endpoint, { image_base64: image })
      if (res.data.success) {
        setResult(res.data.data)
        toast.success('Analysis complete!')
      } else {
        toast.error(res.data.error || 'Analysis failed')
      }
    } catch {
      toast.error('Failed to analyze. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const clearAll = () => {
    setImage(null)
    setImagePreview(null)
    setResult(null)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Medical Reader</h1>
          <p className="text-gray-500 text-sm mt-1">Upload prescription or health report — AI will extract all information instantly</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); clearAll() }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.value ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">
                {activeTab === 'prescription' ? '📋 Upload Prescription' : '🧪 Upload Health Report'}
              </h3>

              {!imagePreview ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <Upload size={40} className="mx-auto text-gray-300 group-hover:text-blue-400 mb-3 transition-colors" />
                  <p className="text-gray-500 font-medium">Click to upload image</p>
                  <p className="text-gray-400 text-sm mt-1">JPG, PNG — max 5MB</p>
                  <p className="text-blue-500 text-xs mt-3">📸 Take a clear photo of the document</p>
                </button>
              ) : (
                <div className="relative">
                  <img src={imagePreview} alt="Uploaded" className="w-full rounded-xl object-contain max-h-64 bg-gray-50" />
                  <button
                    onClick={clearAll}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

              {imagePreview && (
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <><Loader size={16} className="animate-spin" /> Analyzing with AI...</>
                  ) : (
                    <><Scan size={16} /> Analyze with AI</>
                  )}
                </button>
              )}
            </div>

            {/* Tips */}
            <div className="card bg-blue-50 border-blue-100">
              <h4 className="font-semibold text-blue-900 text-sm mb-2">📸 Tips for best results</h4>
              <ul className="space-y-1 text-xs text-blue-700">
                <li>• Take photo in good lighting</li>
                <li>• Make sure text is clearly visible</li>
                <li>• Avoid blurry or tilted images</li>
                <li>• Include the full document in frame</li>
              </ul>
            </div>
          </div>

          {/* Results Section */}
          <div>
            {!result && !loading && (
              <div className="card text-center py-16 h-full flex flex-col items-center justify-center">
                <Scan size={48} className="text-gray-200 mb-3" />
                <p className="text-gray-400 font-medium">AI results will appear here</p>
                <p className="text-gray-300 text-sm mt-1">Upload an image and click Analyze</p>
              </div>
            )}

            {loading && (
              <div className="card text-center py-16 h-full flex flex-col items-center justify-center">
                <Loader size={48} className="text-blue-400 animate-spin mb-3" />
                <p className="text-gray-600 font-medium">AI is reading your document...</p>
                <p className="text-gray-400 text-sm mt-1">This may take 10-15 seconds</p>
              </div>
            )}

            {/* Prescription Results */}
            {result && activeTab === 'prescription' && (
              <div className="space-y-4">
                {/* Doctor Info */}
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User size={16} className="text-blue-600" /> Doctor Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    {result.doctor_name && <p><span className="text-gray-400">Doctor:</span> <span className="font-medium">{result.doctor_name}</span></p>}
                    {result.hospital && <p><span className="text-gray-400">Hospital:</span> <span className="font-medium">{result.hospital}</span></p>}
                    {result.patient_name && <p><span className="text-gray-400">Patient:</span> <span className="font-medium">{result.patient_name}</span></p>}
                    {result.date && <p><span className="text-gray-400">Date:</span> <span className="font-medium">{result.date}</span></p>}
                    {result.diagnosis && <p><span className="text-gray-400">Diagnosis:</span> <span className="font-medium text-red-600">{result.diagnosis}</span></p>}
                  </div>
                </div>

                {/* Medicines */}
                {result.medicines?.length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Pill size={16} className="text-green-600" /> Medicines ({result.medicines.length})
                    </h3>
                    <div className="space-y-3">
                      {result.medicines.map((med, i) => (
                        <div key={i} className="bg-green-50 rounded-xl p-3 border border-green-100">
                          <p className="font-semibold text-gray-900 text-sm">{med.name}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {med.dosage && <span className="text-xs bg-white text-green-700 px-2 py-0.5 rounded-full border border-green-200">{med.dosage}</span>}
                            {med.frequency && <span className="text-xs bg-white text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">{med.frequency}</span>}
                            {med.duration && <span className="text-xs bg-white text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">{med.duration}</span>}
                          </div>
                          {med.instructions && <p className="text-xs text-gray-500 mt-1">⚠️ {med.instructions}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {(result.notes || result.follow_up) && (
                  <div className="card">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <ClipboardList size={16} className="text-purple-600" /> Notes
                    </h3>
                    {result.notes && <p className="text-sm text-gray-600">{result.notes}</p>}
                    {result.follow_up && <p className="text-sm text-blue-600 mt-1">📅 Follow-up: {result.follow_up}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Health Report Results */}
            {result && activeTab === 'report' && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="card bg-blue-50 border-blue-100">
                  <h3 className="font-semibold text-blue-900 mb-2">📊 {result.report_type}</h3>
                  {result.date && <p className="text-xs text-blue-600 mb-2">Date: {result.date}</p>}
                  <p className="text-sm text-blue-800">{result.overall_summary}</p>
                </div>

                {/* Parameters */}
                {result.parameters?.length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold text-gray-900 mb-3">Test Results</h3>
                    <div className="space-y-2">
                      {result.parameters.map((param, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{param.name}</p>
                            <p className="text-xs text-gray-400">{param.normal_range && `Normal: ${param.normal_range}`}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">{param.value} {param.unit}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              param.status === 'normal' ? 'bg-green-100 text-green-700' :
                              param.status === 'high' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {param.status === 'normal' ? '✅ Normal' : param.status === 'high' ? '⬆️ High' : '⬇️ Low'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Concerns */}
                {result.concerns?.length > 0 && (
                  <div className="card border-red-100">
                    <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <AlertCircle size={16} /> Concerns
                    </h3>
                    <ul className="space-y-1">
                      {result.concerns.map((c, i) => (
                        <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                          <span>⚠️</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations?.length > 0 && (
                  <div className="card border-green-100">
                    <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle size={16} /> Recommendations
                    </h3>
                    <ul className="space-y-1">
                      {result.recommendations.map((r, i) => (
                        <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                          <span>✅</span> {r}
                        </li>
                      ))}
                    </ul>
                    {result.doctor_to_consult && (
                      <p className="text-sm text-blue-600 mt-2">👨‍⚕️ Consult: {result.doctor_to_consult}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            This AI analysis is for informational purposes only and is not a substitute for professional medical advice. Always consult a qualified doctor for proper diagnosis and treatment.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PrescriptionReader
