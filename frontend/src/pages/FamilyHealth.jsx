import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Edit2, X, Heart, Calendar, Droplets, User, ChevronRight } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

const RELATIONS = ['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Other']
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const COLORS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']

const EMPTY = { name: '', relation: 'Father', date_of_birth: '', blood_group: '', gender: '', allergies: '', medical_conditions: '', emergency_contact: '' }

export default function FamilyHealth() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api.get('/family/').then(r => setMembers(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const openAdd = () => { setForm(EMPTY); setEditing(null); setShowForm(true) }
  const openEdit = (m) => { setForm({...m}); setEditing(m.id); setShowForm(true) }

  const save = async () => {
    if (!form.name) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      if (editing) {
        const res = await api.put(`/family/${editing}`, form)
        setMembers(m => m.map(x => x.id === editing ? res.data : x))
      } else {
        const res = await api.post('/family/', form)
        setMembers(m => [res.data, ...m])
      }
      toast.success(editing ? 'Updated!' : 'Member added!')
      setShowForm(false)
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const remove = async (id) => {
    try {
      await api.delete(`/family/${id}`)
      setMembers(m => m.filter(x => x.id !== id))
      if (selected?.id === id) setSelected(null)
      toast.success('Removed')
    } catch { toast.error('Failed to delete') }
  }

  const getAge = (dob) => {
    if (!dob) return null
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold">Family Health</h1>
                <p className="text-blue-200 text-xs">Manage health for your entire family</p>
              </div>
            </div>
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-white text-blue-700 text-sm font-bold px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors">
              <Plus size={15}/> Add Member
            </button>
          </div>
        </div>

        {/* Members Grid */}
        {loading ? (
          <div className="py-12 flex justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>
        ) : members.length === 0 ? (
          <div className="card text-center py-14">
            <Users size={40} className="mx-auto text-gray-200 mb-3"/>
            <p className="text-gray-500 font-medium">No family members added</p>
            <p className="text-gray-400 text-sm mt-1">Add your family members to track their health</p>
            <button onClick={openAdd} className="mt-4 btn-primary text-sm inline-flex items-center gap-2"><Plus size={14}/> Add First Member</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {members.map((m, i) => (
              <div key={m.id} onClick={() => setSelected(selected?.id === m.id ? null : m)}
                className={`card cursor-pointer hover:shadow-md transition-all border-2 ${selected?.id === m.id ? 'border-blue-400' : 'border-transparent'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 ${COLORS[i % COLORS.length]} rounded-2xl flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0`}>
                    {m.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.relation}{getAge(m.date_of_birth) ? ` · ${getAge(m.date_of_birth)} yrs` : ''}</p>
                    {m.blood_group && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold mt-1 inline-block">
                        {m.blood_group}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={e => { e.stopPropagation(); openEdit(m) }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={13}/></button>
                    <button onClick={e => { e.stopPropagation(); remove(m.id) }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13}/></button>
                  </div>
                </div>

                {/* Expanded details */}
                {selected?.id === m.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    {m.medical_conditions && (
                      <div><p className="text-xs text-gray-400 font-medium">Medical Conditions</p><p className="text-sm text-gray-700">{m.medical_conditions}</p></div>
                    )}
                    {m.allergies && (
                      <div><p className="text-xs text-gray-400 font-medium">Allergies</p><p className="text-sm text-red-600">{m.allergies}</p></div>
                    )}
                    {m.emergency_contact && (
                      <div><p className="text-xs text-gray-400 font-medium">Emergency Contact</p><p className="text-sm text-gray-700">{m.emergency_contact}</p></div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Member' : 'Add Family Member'}</h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-xl"><X size={16}/></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="label">Full Name *</label><input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Name" className="input-field"/></div>
                  <div>
                    <label className="label">Relation</label>
                    <select value={form.relation} onChange={e => setForm(f => ({...f, relation: e.target.value}))} className="input-field">
                      {RELATIONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Gender</label>
                    <select value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))} className="input-field">
                      <option value="">Select</option>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div><label className="label">Date of Birth</label><input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({...f, date_of_birth: e.target.value}))} className="input-field"/></div>
                  <div>
                    <label className="label">Blood Group</label>
                    <select value={form.blood_group} onChange={e => setForm(f => ({...f, blood_group: e.target.value}))} className="input-field">
                      <option value="">Select</option>
                      {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2"><label className="label">Medical Conditions</label><input value={form.medical_conditions} onChange={e => setForm(f => ({...f, medical_conditions: e.target.value}))} placeholder="e.g. Diabetes, Hypertension" className="input-field"/></div>
                  <div className="col-span-2"><label className="label">Allergies</label><input value={form.allergies} onChange={e => setForm(f => ({...f, allergies: e.target.value}))} placeholder="e.g. Penicillin, Dust" className="input-field"/></div>
                  <div className="col-span-2"><label className="label">Emergency Contact</label><input value={form.emergency_contact} onChange={e => setForm(f => ({...f, emergency_contact: e.target.value}))} placeholder="+91 98765 43210" className="input-field"/></div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : editing ? 'Update' : 'Add Member'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
