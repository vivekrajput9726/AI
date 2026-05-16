import { useState, useEffect, useRef } from 'react'
import { Plus, FileText, Trash2, Download, X, Upload, FolderOpen } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import api from '../services/api'
import toast from 'react-hot-toast'

const RECORD_TYPES = [
  { value: 'prescription', label: 'Prescription', icon: '💊', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { value: 'lab_report',   label: 'Lab Report',   icon: '🧪', color: 'bg-green-50 text-green-700 border-green-100' },
  { value: 'diagnosis',    label: 'Diagnosis',    icon: '🩺', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  { value: 'other',        label: 'Other',        icon: '📁', color: 'bg-gray-50 text-gray-700 border-gray-100' },
]

const LAB_TEST_TYPES = ['Blood Test', 'Urine Test', 'X-Ray', 'MRI', 'CT Scan', 'ECG', 'Ultrasound', 'Biopsy', 'Other']
const SEVERITIES     = ['Mild', 'Moderate', 'Severe', 'Critical']

const EMPTY = {
  title: '', record_type: 'prescription', date: '', file_data: '',
  // prescription
  doctor_name: '', medicines: '', dosage_notes: '',
  // lab report
  lab_name: '', test_type: '', key_findings: '',
  // diagnosis
  hospital: '', condition: '', severity: '', treatment_plan: '',
  // other
  category: '', description: '',
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function PrescriptionForm({ form, setForm }) {
  return (
    <>
      <Field label="Title" required>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Dr. Sharma's Prescription – May 2025" className="input-field" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Doctor Name" required>
          <input value={form.doctor_name} onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))}
            placeholder="Dr. Full Name" className="input-field" />
        </Field>
        <Field label="Prescription Date">
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="input-field" />
        </Field>
      </div>
      <Field label="Medicines Prescribed" required>
        <textarea value={form.medicines} onChange={e => setForm(f => ({ ...f, medicines: e.target.value }))}
          placeholder="e.g. Paracetamol 500mg, Amoxicillin 250mg, Vitamin D3..."
          className="input-field h-20 resize-none" />
      </Field>
      <Field label="Dosage Instructions / Notes">
        <textarea value={form.dosage_notes} onChange={e => setForm(f => ({ ...f, dosage_notes: e.target.value }))}
          placeholder="e.g. Take Paracetamol after meals, twice daily for 5 days..."
          className="input-field h-16 resize-none" />
      </Field>
    </>
  )
}

function LabReportForm({ form, setForm }) {
  return (
    <>
      <Field label="Report Title" required>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Complete Blood Count – June 2025" className="input-field" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Lab / Hospital Name">
          <input value={form.lab_name} onChange={e => setForm(f => ({ ...f, lab_name: e.target.value }))}
            placeholder="e.g. Apollo Diagnostics" className="input-field" />
        </Field>
        <Field label="Test Date" required>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="input-field" />
        </Field>
      </div>
      <Field label="Test Type" required>
        <select value={form.test_type} onChange={e => setForm(f => ({ ...f, test_type: e.target.value }))}
          className="input-field">
          <option value="">Select test type</option>
          {LAB_TEST_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Key Findings / Results">
        <textarea value={form.key_findings} onChange={e => setForm(f => ({ ...f, key_findings: e.target.value }))}
          placeholder="e.g. Hb: 11.2 g/dL (Low), WBC: 8200/μL (Normal), Platelet: 2.1 L (Normal)..."
          className="input-field h-20 resize-none" />
      </Field>
    </>
  )
}

function DiagnosisForm({ form, setForm }) {
  return (
    <>
      <Field label="Diagnosis Title" required>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Type 2 Diabetes Diagnosis" className="input-field" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Doctor Name" required>
          <input value={form.doctor_name} onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))}
            placeholder="Dr. Full Name" className="input-field" />
        </Field>
        <Field label="Date of Diagnosis" required>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="input-field" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Hospital / Clinic">
          <input value={form.hospital} onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))}
            placeholder="e.g. Apollo Hospital" className="input-field" />
        </Field>
        <Field label="Severity" required>
          <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
            className="input-field">
            <option value="">Select severity</option>
            {SEVERITIES.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Condition / Diagnosis Details">
        <textarea value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
          placeholder="Describe the diagnosed condition..."
          className="input-field h-16 resize-none" />
      </Field>
      <Field label="Treatment Plan">
        <textarea value={form.treatment_plan} onChange={e => setForm(f => ({ ...f, treatment_plan: e.target.value }))}
          placeholder="e.g. Metformin 500mg daily, low-carb diet, exercise 30 min/day..."
          className="input-field h-16 resize-none" />
      </Field>
    </>
  )
}

function OtherForm({ form, setForm }) {
  return (
    <>
      <Field label="Title" required>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Vaccination Certificate, Discharge Summary..." className="input-field" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            placeholder="e.g. Vaccination, Surgery..." className="input-field" />
        </Field>
        <Field label="Date">
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="input-field" />
        </Field>
      </div>
      <Field label="Description / Notes">
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Any additional details about this record..."
          className="input-field h-20 resize-none" />
      </Field>
    </>
  )
}

function buildPayload(form) {
  const base = { title: form.title, record_type: form.record_type, date: form.date, file_data: form.file_data }

  if (form.record_type === 'prescription') {
    const parts = []
    if (form.medicines)    parts.push(`Medicines: ${form.medicines}`)
    if (form.dosage_notes) parts.push(`Instructions: ${form.dosage_notes}`)
    return { ...base, doctor_name: form.doctor_name, description: parts.join('\n') }
  }

  if (form.record_type === 'lab_report') {
    const parts = []
    if (form.test_type)    parts.push(`Test Type: ${form.test_type}`)
    if (form.lab_name)     parts.push(`Lab: ${form.lab_name}`)
    if (form.key_findings) parts.push(`Findings: ${form.key_findings}`)
    return { ...base, doctor_name: form.lab_name, description: parts.join('\n') }
  }

  if (form.record_type === 'diagnosis') {
    const parts = []
    if (form.hospital)      parts.push(`Hospital: ${form.hospital}`)
    if (form.severity)      parts.push(`Severity: ${form.severity}`)
    if (form.condition)     parts.push(`Condition: ${form.condition}`)
    if (form.treatment_plan)parts.push(`Treatment Plan: ${form.treatment_plan}`)
    return { ...base, doctor_name: form.doctor_name, description: parts.join('\n') }
  }

  // other
  const parts = []
  if (form.category)    parts.push(`Category: ${form.category}`)
  if (form.description) parts.push(form.description)
  return { ...base, description: parts.join('\n') }
}

function isFormValid(form) {
  if (!form.title.trim()) return false
  if (form.record_type === 'prescription') return !!form.doctor_name.trim() && !!form.medicines.trim()
  if (form.record_type === 'lab_report')   return !!form.date && !!form.test_type
  if (form.record_type === 'diagnosis')    return !!form.doctor_name.trim() && !!form.date && !!form.severity
  return true
}

function HealthRecords() {
  const [records,   setRecords]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter,    setFilter]    = useState('all')
  const [form,      setForm]      = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)
  const fileRef = useRef(null)

  useEffect(() => { loadRecords() }, [])

  const loadRecords = async () => {
    try {
      const res = await api.get('/health-records/')
      setRecords(res.data)
    } catch { toast.error('Failed to load records') }
    finally { setLoading(false) }
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
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (form.record_type === 'prescription' && !form.doctor_name.trim()) { toast.error('Doctor name is required'); return }
    if (form.record_type === 'prescription' && !form.medicines.trim()) { toast.error('Medicines are required'); return }
    if (form.record_type === 'lab_report' && !form.test_type) { toast.error('Test type is required'); return }
    if (form.record_type === 'lab_report' && !form.date) { toast.error('Test date is required'); return }
    if (form.record_type === 'diagnosis' && !form.doctor_name.trim()) { toast.error('Doctor name is required'); return }
    if (form.record_type === 'diagnosis' && !form.date) { toast.error('Diagnosis date is required'); return }
    if (form.record_type === 'diagnosis' && !form.severity) { toast.error('Severity is required'); return }

    setSaving(true)
    try {
      const res = await api.post('/health-records/', buildPayload(form))
      setRecords(prev => [res.data, ...prev])
      setShowModal(false)
      setForm(EMPTY)
      toast.success('Record saved!')
    } catch { toast.error('Failed to save record') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/health-records/${id}`)
      setRecords(prev => prev.filter(r => r.id !== id))
      toast.success('Record deleted')
    } catch { toast.error('Failed to delete') }
  }

  const closeModal = () => { setShowModal(false); setForm(EMPTY) }

  const filtered = filter === 'all' ? records : records.filter(r => r.record_type === filter)
  const getType  = (type) => RECORD_TYPES.find(t => t.value === type) || RECORD_TYPES[3]

  const selectedType = RECORD_TYPES.find(t => t.value === form.record_type)

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
          <button onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
            All ({records.length})
          </button>
          {RECORD_TYPES.map(t => (
            <button key={t.value} onClick={() => setFilter(t.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filter === t.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
              {t.icon} {t.label} ({records.filter(r => r.record_type === t.value).length})
            </button>
          ))}
        </div>

        {/* Records Grid */}
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
                    <button onClick={() => handleDelete(record.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{record.title}</h3>
                  {record.doctor_name && <p className="text-xs text-gray-500 mb-1">Dr. {record.doctor_name}</p>}
                  {record.date && <p className="text-xs text-gray-400 mb-2">{record.date}</p>}
                  {record.description && <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-line">{record.description}</p>}
                  {record.file_data && (
                    <a href={record.file_data} download={record.title}
                      className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                      <Download size={12} /> Download File
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Add Record Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh]">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                {selectedType && <span className="text-xl">{selectedType.icon}</span>}
                <h3 className="font-bold text-gray-900 text-lg">
                  Add {selectedType?.label || 'Health Record'}
                </h3>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Record Type Selector */}
            <div className="px-6 pt-4 flex-shrink-0">
              <label className="label mb-2 block">Record Type</label>
              <div className="grid grid-cols-4 gap-2">
                {RECORD_TYPES.map(t => (
                  <button key={t.value} type="button"
                    onClick={() => setForm(f => ({ ...EMPTY, record_type: t.value }))}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                      form.record_type === t.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:bg-blue-50'
                    }`}>
                    <span className="text-lg">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type-specific Form Fields */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              {form.record_type === 'prescription' && <PrescriptionForm form={form} setForm={setForm} />}
              {form.record_type === 'lab_report'   && <LabReportForm    form={form} setForm={setForm} />}
              {form.record_type === 'diagnosis'    && <DiagnosisForm    form={form} setForm={setForm} />}
              {form.record_type === 'other'        && <OtherForm        form={form} setForm={setForm} />}

              {/* File Upload — common to all types */}
              <div>
                <label className="label">Upload Document <span className="text-gray-400 font-normal">(optional)</span></label>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-500 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                  <Upload size={16} />
                  {form.file_data ? '✅ File selected — click to change' : 'Click to upload (PDF, Image — max 5MB)'}
                </button>
                <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} className="hidden" />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving || !isFormValid(form)}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40">
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
