import { useState, useEffect } from 'react'
import { AlertTriangle, Phone, Plus, Trash2, MapPin, X, CheckCircle, Users, Shield } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

const RELATIONS = ['Father', 'Mother', 'Spouse', 'Sibling', 'Child', 'Friend', 'Doctor', 'Other']

export default function EmergencySOS() {
  const [contacts, setContacts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', relation: 'Father' })
  const [saving, setSaving] = useState(false)
  const [sosActive, setSosActive] = useState(false)
  const [sosLoading, setSosLoading] = useState(false)
  const [sosSent, setSosSent] = useState(false)
  const [location, setLocation] = useState(null)

  useEffect(() => {
    api.get('/emergency/contacts').then(r => setContacts(r.data)).catch(() => {})
    navigator.geolocation?.getCurrentPosition(pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }))
  }, [])

  const saveContacts = async (updated) => {
    setSaving(true)
    try {
      await api.post('/emergency/contacts', updated)
      setContacts(updated)
      toast.success('Contacts saved!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const addContact = () => {
    if (!form.name || !form.phone) { toast.error('Name and phone required'); return }
    const updated = [...contacts, { ...form }]
    saveContacts(updated)
    setForm({ name: '', phone: '', relation: 'Father' })
    setShowForm(false)
  }

  const removeContact = (idx) => saveContacts(contacts.filter((_, i) => i !== idx))

  const triggerSOS = async () => {
    if (contacts.length === 0) { toast.error('Add emergency contacts first!'); return }
    setSosLoading(true)
    try {
      const res = await api.post('/emergency/sos', {
        latitude: location?.lat,
        longitude: location?.lng,
        message: 'I need emergency medical help!'
      })
      setSosSent(true)
      toast.success(`🚨 SOS sent to ${res.data.contacts_notified} contact(s)!`)
    } catch { toast.error('Failed to send SOS') }
    finally { setSosLoading(false); setSosActive(false) }
  }

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-5 animate-fade-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold">Emergency SOS</h1>
              <p className="text-red-200 text-xs">One tap sends alert to all your emergency contacts</p>
            </div>
          </div>
        </div>

        {/* SOS Button */}
        <div className="card text-center py-8">
          {sosSent ? (
            <div className="space-y-3">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={44} className="text-green-600" />
              </div>
              <p className="text-xl font-extrabold text-gray-900">SOS Sent!</p>
              <p className="text-sm text-gray-500">Your emergency contacts have been notified.</p>
              <button onClick={() => setSosSent(false)} className="btn-secondary text-sm">Reset</button>
            </div>
          ) : sosActive ? (
            <div className="space-y-4">
              <div className="w-28 h-28 bg-red-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <AlertTriangle size={52} className="text-red-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">Confirm Emergency?</p>
              <p className="text-sm text-gray-500">This will send an alert to {contacts.length} contact(s)</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setSosActive(false)} className="btn-secondary px-6">Cancel</button>
                <button onClick={triggerSOS} disabled={sosLoading}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-colors">
                  {sosLoading ? 'Sending...' : '🚨 YES, SEND SOS'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button onClick={() => setSosActive(true)}
                className="w-36 h-36 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full flex flex-col items-center justify-center mx-auto shadow-2xl shadow-red-200 transition-all">
                <AlertTriangle size={44} />
                <span className="text-sm font-extrabold mt-1">SOS</span>
              </button>
              <p className="text-sm text-gray-500">Press & hold to send emergency alert</p>
              {location && (
                <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                  <MapPin size={12} /> Location detected
                </div>
              )}
            </div>
          )}
        </div>

        {/* Emergency Contacts */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Users size={16} className="text-red-500"/> Emergency Contacts</h2>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 font-semibold px-3 py-2 rounded-xl transition-colors">
              <Plus size={15} /> Add
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <Phone size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No emergency contacts yet</p>
              <p className="text-xs text-gray-400 mt-1">Add contacts to use the SOS feature</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.relation} · {c.phone}</p>
                  </div>
                  <button onClick={() => removeContact(i)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Contact Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Add Emergency Contact</h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-xl"><X size={16} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="label">Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Contact name" className="input-field" />
                </div>
                <div>
                  <label className="label">Phone Number *</label>
                  <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+91 98765 43210" className="input-field" />
                </div>
                <div>
                  <label className="label">Relation</label>
                  <select value={form.relation} onChange={e => setForm(f => ({...f, relation: e.target.value}))} className="input-field">
                    {RELATIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={addContact} disabled={saving} className="btn-primary flex-1 bg-red-600 hover:bg-red-700">
                  {saving ? 'Saving...' : 'Add Contact'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">SOS sends an SMS with your location to all emergency contacts. Make sure contacts have valid phone numbers. For life-threatening emergencies always call <strong>112</strong>.</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
