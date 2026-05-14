import { useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { FileText, Download, Plus, Trash2, Printer, CheckCircle } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import toast from 'react-hot-toast'

export default function PrescriptionPDF() {
  const { user } = useSelector(s => s.auth)
  const printRef = useRef(null)

  const [form, setForm] = useState({
    doctorName: '', doctorDeg: '', hospital: '', date: new Date().toISOString().split('T')[0],
    patientName: '', patientAge: '', patientGender: '', diagnosis: '', notes: ''
  })
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  const [generated, setGenerated] = useState(false)

  const addMedicine = () => setMedicines(m => [...m, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  const removeMedicine = (i) => setMedicines(m => m.filter((_, idx) => idx !== i))
  const updateMedicine = (i, field, val) => setMedicines(m => m.map((med, idx) => idx === i ? { ...med, [field]: val } : med))

  const handlePrint = () => {
    if (!form.patientName || !form.doctorName) { toast.error('Please fill Doctor and Patient name'); return }
    setGenerated(true)
    setTimeout(() => window.print(), 300)
  }

  const f = (v) => v || '—'

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold">Digital Prescription</h1>
              <p className="text-green-200 text-xs">Generate & print professional prescription PDF</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card space-y-5">
          <h2 className="font-bold text-gray-900">Doctor Details</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label">Doctor Name *</label><input value={form.doctorName} onChange={e => setForm(f => ({...f, doctorName: e.target.value}))} placeholder="Dr. Arjun Sharma" className="input-field" /></div>
            <div><label className="label">Qualification</label><input value={form.doctorDeg} onChange={e => setForm(f => ({...f, doctorDeg: e.target.value}))} placeholder="MBBS, MD" className="input-field" /></div>
            <div><label className="label">Hospital / Clinic</label><input value={form.hospital} onChange={e => setForm(f => ({...f, hospital: e.target.value}))} placeholder="Apollo Hospital, Mumbai" className="input-field" /></div>
            <div><label className="label">Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="input-field" /></div>
          </div>

          <h2 className="font-bold text-gray-900 pt-2 border-t border-gray-100">Patient Details</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2"><label className="label">Patient Name *</label><input value={form.patientName} onChange={e => setForm(f => ({...f, patientName: e.target.value}))} placeholder="Patient full name" className="input-field" /></div>
            <div><label className="label">Age</label><input value={form.patientAge} onChange={e => setForm(f => ({...f, patientAge: e.target.value}))} placeholder="25" className="input-field" /></div>
          </div>

          <div>
            <label className="label">Diagnosis</label>
            <input value={form.diagnosis} onChange={e => setForm(f => ({...f, diagnosis: e.target.value}))} placeholder="e.g. Viral Fever, Hypertension" className="input-field" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">Medicines</h2>
              <button onClick={addMedicine} className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 hover:bg-green-100 font-semibold px-3 py-1.5 rounded-xl transition-colors">
                <Plus size={14} /> Add Medicine
              </button>
            </div>
            <div className="space-y-3">
              {medicines.map((med, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500">Medicine {i + 1}</p>
                    {medicines.length > 1 && (
                      <button onClick={() => removeMedicine(i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="col-span-2"><input value={med.name} onChange={e => updateMedicine(i, 'name', e.target.value)} placeholder="Medicine name" className="input-field text-sm" /></div>
                    <div><input value={med.dosage} onChange={e => updateMedicine(i, 'dosage', e.target.value)} placeholder="Dosage (mg)" className="input-field text-sm" /></div>
                    <div><input value={med.duration} onChange={e => updateMedicine(i, 'duration', e.target.value)} placeholder="7 days" className="input-field text-sm" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={med.frequency} onChange={e => updateMedicine(i, 'frequency', e.target.value)} placeholder="1-0-1 (Morning-Noon-Night)" className="input-field text-sm" />
                    <input value={med.instructions} onChange={e => updateMedicine(i, 'instructions', e.target.value)} placeholder="After food / Before food" className="input-field text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Additional Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Follow-up instructions, diet advice..." className="input-field h-20 resize-none" />
          </div>

          <button onClick={handlePrint} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-base">
            <Printer size={18} /> Generate & Print Prescription
          </button>
        </div>

        {/* Print Preview — hidden until generated, shows on print */}
        {generated && (
          <div className="card border-2 border-green-200" ref={printRef} id="prescription-print">
            <div className="print-only">
              {/* Header */}
              <div className="border-b-2 border-green-600 pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-extrabold text-green-700">{f(form.doctorName)}</h2>
                    <p className="text-sm text-gray-600">{f(form.doctorDeg)}</p>
                    <p className="text-sm text-gray-500">{f(form.hospital)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Date: <strong>{form.date}</strong></p>
                    <p className="text-xs text-gray-400 mt-1">Synora Health Platform</p>
                  </div>
                </div>
              </div>

              {/* Patient */}
              <div className="bg-green-50 rounded-xl p-3 mb-4 flex gap-6">
                <div><p className="text-xs text-gray-400">Patient Name</p><p className="font-bold text-gray-900">{f(form.patientName)}</p></div>
                {form.patientAge && <div><p className="text-xs text-gray-400">Age</p><p className="font-bold text-gray-900">{form.patientAge} yrs</p></div>}
              </div>

              {/* Diagnosis */}
              {form.diagnosis && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-500 mb-1">DIAGNOSIS</p>
                  <p className="text-sm font-semibold text-gray-800 bg-blue-50 px-3 py-2 rounded-xl">{form.diagnosis}</p>
                </div>
              )}

              {/* Rx */}
              <div className="mb-4">
                <p className="text-2xl font-bold text-green-700 mb-3">℞</p>
                <div className="space-y-3">
                  {medicines.filter(m => m.name).map((med, i) => (
                    <div key={i} className="flex gap-3 p-3 border border-gray-100 rounded-xl">
                      <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i+1}</div>
                      <div>
                        <p className="font-bold text-gray-900">{med.name} {med.dosage && `(${med.dosage})`}</p>
                        {med.frequency && <p className="text-sm text-gray-600">Frequency: {med.frequency}</p>}
                        {med.duration && <p className="text-sm text-gray-600">Duration: {med.duration}</p>}
                        {med.instructions && <p className="text-xs text-blue-600 mt-0.5">{med.instructions}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {form.notes && (
                <div className="bg-amber-50 rounded-xl p-3 mb-4">
                  <p className="text-xs font-bold text-amber-700 mb-1">INSTRUCTIONS</p>
                  <p className="text-sm text-gray-700">{form.notes}</p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 flex justify-between items-end">
                <p className="text-xs text-gray-400">Generated via Synora Health · Not valid without doctor signature</p>
                <div className="text-center">
                  <div className="w-32 border-b border-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">Doctor's Signature</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body > * { display: none !important; }
          #prescription-print { display: block !important; }
        }
      `}</style>
    </DashboardLayout>
  )
}
