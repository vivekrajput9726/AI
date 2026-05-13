import { useState } from 'react'
import { Pill, Plus, X, AlertTriangle, CheckCircle, Search, Loader } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

const SEVERITY_CONFIG = {
  None: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'No Interaction' },
  Minor: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertTriangle, label: 'Minor' },
  Moderate: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle, label: 'Moderate' },
  Major: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle, label: 'Major — Use Caution' },
  Contraindicated: { color: 'bg-red-200 text-red-800 border-red-300', icon: X, label: 'CONTRAINDICATED — Do Not Use Together' },
  Unknown: { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Search, label: 'Unknown' },
}

const COMMON = ['Aspirin', 'Paracetamol', 'Ibuprofen', 'Metformin', 'Amlodipine', 'Atorvastatin', 'Omeprazole', 'Clopidogrel', 'Warfarin', 'Lisinopril']

export default function DrugChecker() {
  const [medicines, setMedicines] = useState(['', ''])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const addField = () => setMedicines(m => [...m, ''])
  const remove = (i) => setMedicines(m => m.filter((_, idx) => idx !== i))
  const update = (i, v) => setMedicines(m => m.map((x, idx) => idx === i ? v : x))
  const addCommon = (name) => {
    const empty = medicines.findIndex(m => !m.trim())
    if (empty !== -1) update(empty, name)
    else setMedicines(m => [...m, name])
  }

  const check = async () => {
    const filled = medicines.filter(m => m.trim())
    if (filled.length < 2) { toast.error('Enter at least 2 medicines'); return }
    setLoading(true); setResult(null)
    try {
      const res = await api.post('/wellness/drug-interaction', { medicines: filled })
      setResult(res.data)
    } catch { toast.error('Failed to check interactions') }
    finally { setLoading(false) }
  }

  const sev = result ? (SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.Unknown) : null
  const SevIcon = sev?.icon

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-5 animate-fade-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Pill size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold">Drug Interaction Checker</h1>
              <p className="text-orange-100 text-xs">AI checks if your medicines are safe together</p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="card space-y-4">
          <h2 className="font-bold text-gray-900">Enter Medicines</h2>
          <div className="space-y-2">
            {medicines.map((med, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-7 h-10 flex items-center justify-center flex-shrink-0">
                  <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">{i+1}</span>
                </div>
                <input value={med} onChange={e => update(i, e.target.value)}
                  placeholder={`Medicine ${i+1} name`} className="input-field flex-1" />
                {medicines.length > 2 && (
                  <button onClick={() => remove(i)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={16}/></button>
                )}
              </div>
            ))}
          </div>

          <button onClick={addField} className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium">
            <Plus size={15}/> Add another medicine
          </button>

          {/* Common medicines */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Quick add common medicines:</p>
            <div className="flex flex-wrap gap-2">
              {COMMON.map(d => (
                <button key={d} onClick={() => addCommon(d)}
                  className="text-xs bg-gray-100 hover:bg-orange-100 hover:text-orange-700 text-gray-600 px-2.5 py-1.5 rounded-full transition-colors font-medium">
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button onClick={check} disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
            {loading ? <><Loader size={16} className="animate-spin"/> Checking with AI...</> : <><Search size={16}/> Check Interactions</>}
          </button>
        </div>

        {/* Result */}
        {result && sev && (
          <div className="card space-y-4 animate-fade-in">
            {/* Severity Badge */}
            <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${sev.color}`}>
              <SevIcon size={22} />
              <div>
                <p className="font-extrabold text-base">{sev.label}</p>
                <p className="text-xs opacity-80">Severity: {result.severity}</p>
              </div>
            </div>

            {/* Interactions */}
            {result.interactions?.length > 0 && (
              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">Interactions Found:</p>
                <div className="space-y-2">
                  {result.interactions.map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{item.drugs?.join(' + ')}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{item.effect}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                        item.severity === 'Major' ? 'bg-red-100 text-red-700' :
                        item.severity === 'Moderate' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'}`}>{item.severity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.recommendation && (
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs font-bold text-blue-700 mb-1">Recommendation</p>
                <p className="text-sm text-blue-800">{result.recommendation}</p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <AlertTriangle size={13} className="text-amber-600 mt-0.5 flex-shrink-0"/>
              <p className="text-xs text-amber-700">{result.disclaimer}</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
