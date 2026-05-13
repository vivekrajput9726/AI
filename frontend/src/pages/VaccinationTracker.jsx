import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2, X, CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

const COMMON_VACCINES = [
  'COVID-19 (Covaxin)', 'COVID-19 (Covishield)', 'Hepatitis B', 'Tetanus (TT)',
  'Influenza (Flu)', 'Typhoid', 'Hepatitis A', 'MMR', 'Varicella (Chickenpox)',
  'HPV', 'Pneumococcal', 'Meningococcal', 'Rabies', 'Yellow Fever', 'Polio (IPV)'
]

const STATUS_CONFIG = {
  taken:    { color: 'bg-green-100 text-green-700 border-green-200',  icon: CheckCircle,    label: 'Taken' },
  due:      { color: 'bg-red-100 text-red-700 border-red-200',        icon: AlertTriangle,  label: 'Due Now' },
  upcoming: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock,          label: 'Upcoming' },
}

const EMPTY = { name: '', date_taken: '', next_due: '', provider: '', notes: '', status: 'taken' }

export default function VaccinationTracker() {
  const [vaccines, setVaccines]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [filter, setFilter]       = useState('all')

  useEffect(() => {
    api.get('/extras/vaccines').then(r => setVaccines(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    if (!form.name) { toast.error('Vaccine name required'); return }
    setSaving(true)
    try {
      const res = await api.post('/extras/vaccines', form)
      setVaccines(v => [res.data, ...v])
      setShowForm(false); setForm(EMPTY)
      toast.success('Vaccine record saved!')
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const remove = async (id) => {
    try { await api.delete(`/extras/vaccines/${id}`); setVaccines(v => v.filter(x => x.id !== id)); toast.success('Removed') }
    catch { toast.error('Failed') }
  }

  const filtered = filter === 'all' ? vaccines : vaccines.filter(v => v.status === filter)
  const counts = { all: vaccines.length, taken: vaccines.filter(v=>v.status==='taken').length, due: vaccines.filter(v=>v.status==='due').length, upcoming: vaccines.filter(v=>v.status==='upcoming').length }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

        <div className="bg-gradient-to-r from-teal-600 to-green-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Shield size={20} className="text-white"/></div>
              <div>
                <h1 className="text-lg font-extrabold">Vaccination Tracker</h1>
                <p className="text-teal-100 text-xs">Track all your vaccines and upcoming doses</p>
              </div>
            </div>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-white text-teal-700 text-sm font-bold px-3 py-2 rounded-xl hover:bg-teal-50 transition-colors">
              <Plus size={15}/> Add Vaccine
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'taken',    label: 'Taken',    color: 'text-green-600' },
            { key: 'due',      label: 'Due Now',  color: 'text-red-600' },
            { key: 'upcoming', label: 'Upcoming', color: 'text-yellow-600' },
          ].map(({ key, label, color }) => (
            <div key={key} className="card text-center py-3">
              <p className={`text-2xl font-extrabold ${color}`}>{counts[key]}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {['all','taken','due','upcoming'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize ${filter===f?'bg-teal-600 text-white border-teal-600':'bg-white text-gray-600 border-gray-200 hover:border-teal-300'}`}>
              {f} ({counts[f]||counts.all})
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? <div className="py-10 flex justify-center"><div className="w-7 h-7 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"/></div>
        : filtered.length === 0 ? (
          <div className="card text-center py-12">
            <Shield size={36} className="mx-auto text-gray-200 mb-3"/>
            <p className="text-gray-500 font-medium">No vaccination records</p>
            <button onClick={() => setShowForm(true)} className="mt-4 btn-primary text-sm inline-flex items-center gap-2"><Plus size={14}/> Add Vaccine</button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(v => {
              const sc = STATUS_CONFIG[v.status] || STATUS_CONFIG.taken
              const Icon = sc.icon
              return (
                <div key={v.id} className="card flex items-start gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield size={18} className="text-teal-600"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-900 text-sm">{v.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 flex items-center gap-1 ${sc.color}`}>
                        <Icon size={11}/> {sc.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {v.date_taken && <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={10}/> Taken: {v.date_taken}</span>}
                      {v.next_due   && <span className="text-xs text-orange-500 flex items-center gap-1"><Clock size={10}/> Due: {v.next_due}</span>}
                      {v.provider   && <span className="text-xs text-gray-400">Provider: {v.provider}</span>}
                    </div>
                    {v.notes && <p className="text-xs text-gray-400 mt-1">{v.notes}</p>}
                  </div>
                  <button onClick={() => remove(v.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"><Trash2 size={13}/></button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-lg">Add Vaccine Record</h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-xl"><X size={16}/></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="label">Vaccine Name *</label>
                  <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Search or type..." list="vaccines-list" className="input-field"/>
                  <datalist id="vaccines-list">{COMMON_VACCINES.map(v=><option key={v} value={v}/>)}</datalist>
                </div>
                <div>
                  <label className="label">Status</label>
                  <div className="flex gap-2">
                    {['taken','due','upcoming'].map(s => (
                      <button key={s} onClick={() => setForm(f=>({...f,status:s}))}
                        className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold capitalize transition-all ${form.status===s?STATUS_CONFIG[s].color:'border-gray-200 text-gray-500'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Date Taken</label><input type="date" value={form.date_taken} onChange={e=>setForm(f=>({...f,date_taken:e.target.value}))} className="input-field"/></div>
                  <div><label className="label">Next Due</label><input type="date" value={form.next_due} onChange={e=>setForm(f=>({...f,next_due:e.target.value}))} className="input-field"/></div>
                </div>
                <div><label className="label">Provider / Hospital</label><input value={form.provider} onChange={e=>setForm(f=>({...f,provider:e.target.value}))} placeholder="Apollo Hospital" className="input-field"/></div>
                <div><label className="label">Notes</label><input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Batch no, side effects..." className="input-field"/></div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving} className="btn-primary flex-1 bg-teal-600 hover:bg-teal-700">{saving?'Saving...':'Save'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
