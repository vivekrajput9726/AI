import { useState, useEffect, useRef } from 'react'
import { Plus, FileText, Trash2, Download, X, Upload, Stethoscope, FlaskConical, ClipboardList, FolderOpen } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import api from '../services/api'
import toast from 'react-hot-toast'

const RECORD_TYPES = [
  { value: 'prescription', label: 'Prescription', icon: '💊', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { value: 'lab_report', label: 'Lab Report', icon: '🧪', color: 'bg-green-50 text-green-700 border-green-100' },
  { value: 'diagnosis', label: 'Diagnosis', icon: '🩺', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  { value: 'other', label: 'Other', icon: '📁', color: 'bg-gray-50 text-gray-700 border-gray-100' },
]

function HealthRecords() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ title: '', record_type: 'prescription', description: '', doctor_name: '', date: '', file_data: '' })
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => { loadRecords() }, [])

  const loadRecords = async () => {
    try {
      const res = await api.get('/health-records/')
      setRecords(res.data)
    } catch {
      toast.error('Failed to load records')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = () => setForm(f => ({ ...f, file_data: reader.result }))
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Please enter a title'); return }
    setSaving(true)
    try {
      const res = await api.post('/health-records/', form)
      setRecords(prev => [res.data, ...prev])
      setShowModal(false)
      setForm({ title: '', record_type: 'prescription', description: '', doctor_name: '', date: '', file_data: '' })
      toast.success('Record saved!')
    } catch {
      toast.error('Failed to save record')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/health-records/${id}`)
      setRecords(prev => prev.filter(r => r.id !== id))
      toast.success('Record deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filtered = filter === 'all' ? records : records.filter(r => r.record_type === filter)
  const getType = (type) => RECORD_TYPES.find(t => t.value === type) || RECORD_TYPES[3]

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Health Records</h1>
            <p className="text-gray-500 text-sm mt-1">Store and manage your medical documents</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Record
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
            All ({records.length})
          </button>
          {RECORD_TYPES.map(t => (
            <button key={t.value} onClick={() => setFilter(t.value)} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filter === t.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
              {t.icon} {t.label} ({records.filter(r => r.record_type === t.value).length})
            </button>
          ))}
        </div>

        {/* Records */}
        {loading ? (
          <div className="py-16 flex justify-center"><LoadingSpinner text="Loading records..." /></div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <FolderOpen size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No records found</p>
            <p className="text-gray-400 text-sm mt-1">Click "Add Record" to store your first health document</p>
            <button onClick={() => setShowModal(true)} className="mt-4 btn-primary text-sm inline-flex items-center gap-2">
              <Plus size={14} /> Add Record
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(record => {
              const type = getType(record.record_type)
              return (
                <div key={record.id} className={`border rounded-2xl p-5 hover:shadow-md transition-all ${type.color}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{type.icon}</span>
                      <span className="text-xs font-medium capitalize">{type.label}</span>
                    </div>
                    <button onClick={() => handleDelete(record.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{record.title}</h3>
                  {record.doctor_name && <p className="text-xs text-gray-500 mb-1">Dr. {record.doctor_name}</p>}
                  {record.date && <p className="text-xs text-gray-400 mb-2">{record.date}</p>}
                  {record.description && <p className="text-sm text-gray-600 line-clamp-2">{record.description}</p>}
                  {record.file_data && (
                    <a href={record.file_data} download={record.title} className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                      <Download size={12} /> Download File
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">Add Health Record</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Record Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {RECORD_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, record_type: t.value }))}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center gap-2 ${form.record_type === t.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}
                    >
                      <span>{t.icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Blood Test Report" className="input-field" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Doctor Name</label>
                  <input type="text" value={form.doctor_name} onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))} placeholder="Dr. Name" className="input-field" />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field" />
                </div>
              </div>

              <div>
                <label className="label">Notes / Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Any additional notes..." className="input-field h-20 resize-none" />
              </div>

              <div>
                <label className="label">Upload File (optional)</label>
                <button type="button" onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-500 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                  <Upload size={16} />
                  {form.file_data ? '✅ File selected' : 'Click to upload (PDF, Image — max 5MB)'}
                </button>
                <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} className="hidden" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <LoadingSpinner size="sm" /> : <><Plus size={14} /> Save Record</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default HealthRecords
