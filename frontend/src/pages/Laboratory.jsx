import { useState, useRef } from 'react'
import { FlaskConical, Upload, Trash2, Bot, Loader, ChevronDown, ChevronRight, AlertCircle, CheckCircle, X, FileText, Save, FolderOpen } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

const LAB_CATEGORIES = [
  { id: 'blood', label: 'Blood Report', icon: '🩸', color: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', btn: 'text-red-600 border-red-200 hover:bg-red-50' },
  { id: 'xray', label: 'X-Ray', icon: '🦴', color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', btn: 'text-blue-600 border-blue-200 hover:bg-blue-50' },
  { id: 'diabetes', label: 'Diabetes', icon: '🩺', color: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', btn: 'text-orange-600 border-orange-200 hover:bg-orange-50' },
  { id: 'ecg', label: 'ECG / Heart', icon: '❤️', color: 'bg-pink-50 border-pink-200', badge: 'bg-pink-100 text-pink-700', btn: 'text-pink-600 border-pink-200 hover:bg-pink-50' },
  { id: 'urine', label: 'Urine Test', icon: '🧪', color: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', btn: 'text-yellow-600 border-yellow-200 hover:bg-yellow-50' },
  { id: 'mri', label: 'MRI / Scan', icon: '🧠', color: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700', btn: 'text-purple-600 border-purple-200 hover:bg-purple-50' },
  { id: 'thyroid', label: 'Thyroid', icon: '🔬', color: 'bg-teal-50 border-teal-200', badge: 'bg-teal-100 text-teal-700', btn: 'text-teal-600 border-teal-200 hover:bg-teal-50' },
  { id: 'cholesterol', label: 'Cholesterol', icon: '💊', color: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', btn: 'text-green-600 border-green-200 hover:bg-green-50' },
]

const STATUS_COLORS = {
  high: 'text-red-600 bg-red-50 border-red-200',
  low: 'text-blue-600 bg-blue-50 border-blue-200',
  normal: 'text-green-600 bg-green-50 border-green-200',
  unknown: 'text-gray-600 bg-gray-50 border-gray-200',
}

function loadReports() {
  try { return JSON.parse(localStorage.getItem('lab_reports') || '{}') } catch { return {} }
}
function saveReports(data) { localStorage.setItem('lab_reports', JSON.stringify(data)) }

function AnalysisModal({ result, onClose, onSave, saved }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-teal-600" />
            <h3 className="font-bold text-gray-900">AI Analysis Result</h3>
            {result.severity && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ml-2 ${
                result.severity === 'Normal' ? 'bg-green-100 text-green-700' :
                result.severity === 'Mild Concern' ? 'bg-yellow-100 text-yellow-700' :
                result.severity === 'Moderate Concern' ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'}`}>
                {result.severity}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {saved ? (
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-xl font-medium border border-green-200">
                <CheckCircle size={13} /> Saved to Records
              </span>
            ) : (
              <button onClick={onSave} className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-medium transition-colors">
                <Save size={13} /> Save to Health Records
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
          </div>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {result.report_type && (
            <div className="bg-teal-50 rounded-xl px-4 py-2.5">
              <p className="text-xs text-teal-600 font-medium">Report Type</p>
              <p className="text-sm font-semibold text-teal-800">{result.report_type}</p>
            </div>
          )}
          {result.overall_summary && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Summary</p>
              <p className="text-sm text-gray-700 leading-relaxed">{result.overall_summary}</p>
            </div>
          )}
          {result.parameters?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Parameters</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {result.parameters.map((p, i) => (
                  <div key={i} className={`border rounded-xl p-3 ${STATUS_COLORS[p.status] || STATUS_COLORS.unknown}`}>
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-medium text-sm">{p.name}</p>
                      <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-white/60 font-semibold flex-shrink-0">{p.status}</span>
                    </div>
                    {p.value && <p className="text-base font-bold mt-0.5">{p.value} <span className="text-xs font-normal opacity-70">{p.unit}</span></p>}
                    {p.normal_range && <p className="text-xs opacity-70">Normal: {p.normal_range}</p>}
                    {p.interpretation && <p className="text-xs mt-1.5 opacity-80 border-t border-current/20 pt-1.5">{p.interpretation}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.concerns?.length > 0 && (
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-red-700 mb-1.5">Concerns</p>
              <ul className="space-y-1">{result.concerns.map((c, i) => <li key={i} className="text-xs text-red-600 flex gap-1.5"><span>•</span>{c}</li>)}</ul>
            </div>
          )}
          {result.recommendations?.length > 0 && (
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-green-700 mb-1.5">Recommendations</p>
              <ul className="space-y-1">{result.recommendations.map((r, i) => <li key={i} className="text-xs text-green-600 flex gap-1.5"><span>✓</span>{r}</li>)}</ul>
            </div>
          )}
          {result.doctor_to_consult && (
            <div className="bg-blue-50 rounded-xl px-4 py-2.5">
              <p className="text-xs text-blue-600 font-medium">Recommended Specialist</p>
              <p className="text-sm font-semibold text-blue-800">{result.doctor_to_consult}</p>
            </div>
          )}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2.5">
            <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">AI analysis is for educational purposes only. Always consult a qualified doctor.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FolderCard({ category, reports, onUpload, onDelete, onAnalyze }) {
  const [open, setOpen] = useState(false)
  const fileRef = useRef(null)
  const catReports = reports[category.id] || []

  return (
    <div className={`border-2 rounded-2xl overflow-hidden ${category.color}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-4 hover:bg-white/40 transition-colors">
        <span className="text-3xl">{category.icon}</span>
        <div className="flex-1 text-left">
          <p className="font-semibold text-gray-900">{category.label}</p>
          <p className="text-xs text-gray-500">{catReports.length} file{catReports.length !== 1 ? 's' : ''}</p>
        </div>
        {catReports.length > 0 && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${category.badge}`}>{catReports.length}</span>}
        {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-current/10 bg-white/60 p-4 space-y-3">
          {catReports.length === 0 ? (
            <div className="text-center py-6">
              <FileText size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No files yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {catReports.map(report => (
                <div key={report.id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3 shadow-sm">
                  {report.isImage
                    ? <img src={report.data} alt={report.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><FileText size={20} className="text-gray-400" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{report.name}</p>
                    <p className="text-xs text-gray-400">{report.date}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onAnalyze(report, category)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 bg-white border ${category.btn} transition-colors`}
                    >
                      <Bot size={12} /> Analyze
                    </button>
                    <button onClick={() => onDelete(category.id, report.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Upload size={15} /> Upload {category.label}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={e => { onUpload(e, category.id); e.target.value = '' }} />
        </div>
      )}
    </div>
  )
}

export default function Laboratory() {
  const [reports, setReports] = useState(loadReports)
  const [analyzing, setAnalyzing] = useState(false)
  const [activeReport, setActiveReport] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [savedToRecords, setSavedToRecords] = useState(false)

  const handleUpload = (e, categoryId) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const newReport = {
        id: Date.now().toString(),
        name: file.name,
        data: reader.result,
        isImage: file.type.startsWith('image/'),
        date: new Date().toLocaleDateString('en-IN'),
      }
      const updated = { ...reports, [categoryId]: [...(reports[categoryId] || []), newReport] }
      setReports(updated)
      saveReports(updated)
      toast.success('File uploaded!')
    }
    reader.readAsDataURL(file)
  }

  const handleDelete = (categoryId, reportId) => {
    const updated = { ...reports, [categoryId]: (reports[categoryId] || []).filter(r => r.id !== reportId) }
    setReports(updated)
    saveReports(updated)
    toast.success('File removed')
  }

  const handleAnalyze = async (report, category) => {
    if (!report.isImage) {
      toast.error('AI analysis supports image files (JPG/PNG). For PDF use the Report Analyzer page.')
      return
    }
    setActiveReport({ ...report, categoryLabel: category.label })
    setAnalyzing(true)
    setAnalysisResult(null)
    setSavedToRecords(false)
    try {
      const res = await api.post('/ai/analyze-report', { image_base64: report.data })
      if (res.data.success) {
        setAnalysisResult(res.data.data)
        // Auto-save file to Health Records in background
        autoSaveToHealthRecords(report, category, res.data.data)
      } else {
        toast.error(res.data.error || 'Analysis failed')
      }
    } catch {
      toast.error('Failed to analyze. Check your connection.')
    } finally {
      setAnalyzing(false)
    }
  }

  const autoSaveToHealthRecords = async (report, category, result) => {
    try {
      await api.post('/health-records/', {
        title: `${category.label} - ${report.name}`,
        record_type: 'lab_report',
        description: result.overall_summary || `${category.label} report analyzed by AI. Severity: ${result.severity || 'Unknown'}`,
        file_data: report.data,
        date: new Date().toISOString().split('T')[0],
      })
      setSavedToRecords(true)
    } catch {
      // Silent fail — user can manually save
    }
  }

  const handleManualSave = async () => {
    if (!activeReport || !analysisResult) return
    try {
      const category = LAB_CATEGORIES.find(c => c.id === activeReport.id?.split('_')[0]) || { label: activeReport.categoryLabel }
      await api.post('/health-records/', {
        title: `${activeReport.categoryLabel} - ${activeReport.name}`,
        record_type: 'lab_report',
        description: analysisResult.overall_summary || 'Lab report analyzed by AI',
        file_data: activeReport.data,
        date: new Date().toISOString().split('T')[0],
      })
      setSavedToRecords(true)
      toast.success('Saved to Health Records!')
    } catch {
      toast.error('Failed to save to Health Records')
    }
  }

  const totalFiles = Object.values(reports).reduce((s, arr) => s + arr.length, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-1">
            <FlaskConical size={22} />
            <p className="text-purple-200 text-sm">AI-Powered</p>
          </div>
          <h1 className="text-2xl font-bold">Laboratory</h1>
          <p className="text-purple-200 text-sm mt-1">Upload and organize reports by category. Click "Analyze" for instant AI insights.</p>
          {totalFiles > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-sm font-medium">
              <CheckCircle size={14} /> {totalFiles} report{totalFiles !== 1 ? 's' : ''} stored
            </div>
          )}
        </div>

        {/* Analyzing overlay */}
        {analyzing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
              <Loader size={36} className="text-purple-600 animate-spin" />
              <div className="text-center">
                <p className="font-semibold text-gray-900">Analyzing {activeReport?.name}</p>
                <p className="text-sm text-gray-500 mt-1">AI is reading your {activeReport?.categoryLabel} report...</p>
              </div>
            </div>
          </div>
        )}

        {analysisResult && (
          <AnalysisModal
            result={analysisResult}
            onClose={() => { setAnalysisResult(null); setSavedToRecords(false) }}
            onSave={handleManualSave}
            saved={savedToRecords}
          />
        )}

        {/* Folder Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {LAB_CATEGORIES.map(cat => (
            <FolderCard key={cat.id} category={cat} reports={reports} onUpload={handleUpload} onDelete={handleDelete} onAnalyze={handleAnalyze} />
          ))}
        </div>

        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700">
            <p className="font-medium">Tips for best results</p>
            <ul className="mt-1 space-y-0.5 text-xs list-disc list-inside">
              <li>Upload clear, well-lit images of your reports (JPG or PNG) for AI analysis</li>
              <li>PDF files can be uploaded for storage but use the Report Analyzer for AI analysis</li>
              <li>Files are stored on your device only</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
