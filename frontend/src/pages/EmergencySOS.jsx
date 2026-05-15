import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, Phone, Plus, Trash2, MapPin, X, CheckCircle,
         Users, Shield, Navigation, PhoneCall, Copy, ExternalLink } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

const RELATIONS = ['Father', 'Mother', 'Spouse', 'Sibling', 'Child', 'Friend', 'Doctor', 'Other']

const EMERGENCY_NUMBERS = [
  { label: 'Ambulance', number: '108', icon: '🚑', color: 'bg-red-600 hover:bg-red-700' },
  { label: 'Police',    number: '100', icon: '🚔', color: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'Emergency', number: '112', icon: '🆘', color: 'bg-orange-500 hover:bg-orange-600' },
]

export default function EmergencySOS() {
  const [contacts,   setContacts]   = useState([])
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState({ name: '', phone: '', relation: 'Father' })
  const [saving,     setSaving]     = useState(false)
  const [sosSent,    setSosSent]    = useState(false)
  const [notified,   setNotified]   = useState(0)
  const [sosLoading, setSosLoading] = useState(false)

  // Live location
  const [location,  setLocation]  = useState(null)
  const [locStatus, setLocStatus] = useState('detecting')
  const watchRef    = useRef(null)

  // Countdown
  const [countdown,  setCountdown]  = useState(null)
  const countdownRef = useRef(null)

  // Call modal (for desktop)
  const [callModal, setCallModal] = useState(null)  // { label, number }

  // ── Live GPS ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setLocStatus('denied'); return }
    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocStatus('live')
      },
      () => setLocStatus('denied'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
    api.get('/emergency/contacts').then(r => setContacts(r.data || [])).catch(() => {})
    return () => navigator.geolocation.clearWatch(watchRef.current)
  }, [])

  // ── Countdown ─────────────────────────────────────────────────────
  const startCountdown = () => {
    if (contacts.length === 0) { toast.error('Add emergency contacts first!'); return }
    setCountdown(3)
  }
  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) { setCountdown(null); sendSOS(); return }
    countdownRef.current = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(countdownRef.current)
  }, [countdown])

  const cancelCountdown = () => {
    clearTimeout(countdownRef.current); setCountdown(null)
    toast('SOS cancelled', { icon: '✋' })
  }

  // ── Send SOS ──────────────────────────────────────────────────────
  const sendSOS = async () => {
    setSosLoading(true)
    try {
      const res = await api.post('/emergency/sos', {
        latitude: location?.lat, longitude: location?.lng,
        message: 'I need emergency medical help! Please call me or send help immediately.',
      })
      setNotified(res.data.contacts_notified)
      setSosSent(true)
      toast.success(`🚨 SOS sent to ${res.data.contacts_notified} contact(s)!`, { duration: 6000 })
    } catch { toast.error('Failed to send SOS — check your connection') }
    finally { setSosLoading(false) }
  }

  // ── Contacts CRUD ─────────────────────────────────────────────────
  const saveContacts = async (updated) => {
    setSaving(true)
    try {
      await api.post('/emergency/contacts', updated)
      setContacts(updated); toast.success('Contact saved!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }
  const addContact = () => {
    if (!form.name || !form.phone) { toast.error('Name and phone required'); return }
    saveContacts([...contacts, { ...form }])
    setForm({ name: '', phone: '', relation: 'Father' })
    setShowForm(false)
  }
  const removeContact = (idx) => saveContacts(contacts.filter((_, i) => i !== idx))

  // ── Call ─────────────────────────────────────────────────────────
  const handleCall = (label, number) => {
    // Try tel: — works on mobile natively
    const a = document.createElement('a')
    a.href = `tel:${number}`
    a.click()
    // Also show modal so desktop users can see the number clearly
    setCallModal({ label, number })
  }

  const mapUrl  = location ? `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=16&output=embed` : null
  const mapsLink = location ? `https://maps.google.com/?q=${location.lat},${location.lng}` : null

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4 pb-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-500 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield size={20} className="text-white"/>
              </div>
              <div>
                <h1 className="text-lg font-extrabold">Emergency SOS</h1>
                <p className="text-red-200 text-xs">One tap alert with live location</p>
              </div>
            </div>
            {/* GPS status */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              locStatus === 'live'   ? 'bg-green-500/30 text-green-100' :
              locStatus === 'denied' ? 'bg-red-900/40 text-red-200' :
                                       'bg-white/10 text-white/60'
            }`}>
              <Navigation size={11} className={locStatus === 'live' ? 'animate-pulse' : ''}/>
              {locStatus === 'live' ? 'Live GPS' : locStatus === 'denied' ? 'GPS Off' : 'Detecting...'}
            </div>
          </div>
        </div>

        {/* ── Emergency Call Numbers ── */}
        <div className="grid grid-cols-3 gap-3">
          {EMERGENCY_NUMBERS.map((e) => (
            <button key={e.number} onClick={() => handleCall(e.label, e.number)}
              className={`${e.color} text-white rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-all shadow-md`}>
              <span className="text-2xl">{e.icon}</span>
              <p className="text-sm font-bold">{e.label}</p>
              <p className="text-base font-extrabold">📞 {e.number}</p>
              <p className="text-[10px] opacity-75">Tap to Call</p>
            </button>
          ))}
        </div>

        {/* ── Live Map ── */}
        {locStatus === 'live' && mapUrl && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-red-500 animate-pulse"/>
                <p className="text-sm font-bold text-gray-800">Your Live Location</p>
              </div>
              <a href={mapsLink} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline">
                <ExternalLink size={12}/> Open in Maps
              </a>
            </div>
            <iframe
              src={mapUrl}
              width="100%" height="260"
              style={{ border: 0 }}
              allowFullScreen loading="lazy"
              title="Live Location Map"
            />
            <div className="px-4 py-2 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <span>📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
              <button onClick={() => {
                navigator.clipboard.writeText(`https://maps.google.com/?q=${location.lat},${location.lng}`)
                toast.success('Location link copied!')
              }} className="flex items-center gap-1 text-blue-600 font-medium hover:underline">
                <Copy size={11}/> Copy Link
              </button>
            </div>
          </div>
        )}

        {locStatus === 'denied' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
            <MapPin size={16} className="text-yellow-600 mt-0.5 flex-shrink-0"/>
            <div>
              <p className="text-sm font-bold text-yellow-700">Location Access Required</p>
              <p className="text-xs text-yellow-600 mt-0.5">Allow location permission in your browser settings so your location can be shared in an emergency.</p>
            </div>
          </div>
        )}

        {locStatus === 'detecting' && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-center gap-2 text-xs text-blue-600">
            <Navigation size={13} className="animate-spin"/>
            Detecting your GPS location...
          </div>
        )}

        {/* ── SOS Button ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          {sosSent ? (
            <div className="space-y-3">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-green-600"/>
              </div>
              <p className="text-xl font-extrabold text-gray-900">SOS Sent!</p>
              <p className="text-sm text-gray-500">Alert sent to <strong>{notified}</strong> contact(s) with your live location.</p>
              {mapsLink && (
                <a href={mapsLink} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline">
                  <MapPin size={12}/> View your location on map
                </a>
              )}
              <div className="space-y-1.5 mt-2">
                {contacts.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                    <CheckCircle size={14} className="text-green-600 flex-shrink-0"/>
                    <span className="text-sm font-medium text-gray-800 flex-1">{c.name} ({c.relation})</span>
                    <span className="text-xs text-gray-400">{c.phone}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setSosSent(false)}
                className="mt-3 px-5 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Reset
              </button>
            </div>

          ) : countdown !== null ? (
            <div className="space-y-4">
              <div className="relative w-32 h-32 mx-auto">
                <svg viewBox="0 0 128 128" className="-rotate-90 w-full h-full">
                  <circle cx="64" cy="64" r="56" fill="none" stroke="#fee2e2" strokeWidth="8"/>
                  <circle cx="64" cy="64" r="56" fill="none" stroke="#dc2626" strokeWidth="8"
                    strokeDasharray={`${((3 - countdown) / 3) * 352} 352`}
                    strokeLinecap="round" className="transition-all duration-1000"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-red-600 leading-none">{countdown}</span>
                  <span className="text-xs text-red-400 font-bold mt-1">SENDING</span>
                </div>
              </div>
              <p className="text-base font-bold text-gray-800">SOS sending in {countdown} second{countdown !== 1 ? 's' : ''}...</p>
              <p className="text-xs text-gray-400">SMS + live location link → {contacts.length} contact(s)</p>
              <button onClick={cancelCountdown}
                className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm">
                ✋ Cancel SOS
              </button>
            </div>

          ) : (
            <div className="space-y-4">
              <button onClick={startCountdown} disabled={sosLoading}
                className="w-36 h-36 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full flex flex-col items-center justify-center mx-auto shadow-2xl shadow-red-200 transition-all disabled:opacity-60 border-4 border-red-400">
                <AlertTriangle size={44}/>
                <span className="text-sm font-extrabold mt-1">SOS</span>
              </button>
              <p className="text-sm font-semibold text-gray-700">Tap to send emergency SMS alert</p>
              <p className="text-xs text-gray-400">3-second countdown — tap cancel if accidental</p>
              {location && (
                <a href={mapsLink} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-green-600 font-semibold hover:underline">
                  <MapPin size={12} className="animate-pulse"/> Location ready — {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── Emergency Contacts ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Users size={16} className="text-red-500"/>
              Emergency Contacts
              <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">{contacts.length}</span>
            </h2>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 font-semibold px-3 py-2 rounded-xl">
              <Plus size={15}/> Add
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <Phone size={32} className="mx-auto text-gray-200 mb-2"/>
              <p className="text-sm text-gray-400">No emergency contacts yet</p>
              <button onClick={() => setShowForm(true)}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700">
                Add First Contact
              </button>
            </div>
          ) : contacts.map((c, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                <p className="text-xs text-gray-500">{c.relation} · {c.phone}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => handleCall(c.name, c.phone)}
                  className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-xl" title="Call">
                  <PhoneCall size={15}/>
                </button>
                <button onClick={() => removeContact(i)}
                  className="p-2 text-red-400 hover:bg-red-100 rounded-xl">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0"/>
          <div className="text-xs text-amber-700 space-y-1">
            <p><strong>SOS SMS:</strong> Sends location link to all saved contacts automatically.</p>
            <p><strong>Call buttons:</strong> On mobile — opens phone dialer directly. On PC — shows number to dial manually.</p>
          </div>
        </div>
      </div>

      {/* ── Add Contact Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Add Emergency Contact</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-xl"><X size={16}/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Contact name" className="input-field w-full"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Phone Number *</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" className="input-field w-full"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Relation</label>
                <select value={form.relation} onChange={e => setForm(f => ({ ...f, relation: e.target.value }))} className="input-field w-full">
                  {RELATIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={addContact} disabled={saving}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold">
                {saving ? 'Saving...' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Call Modal (for desktop users) ── */}
      {callModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PhoneCall size={30} className="text-green-600"/>
            </div>
            <p className="text-xs text-gray-400 mb-1">Calling</p>
            <p className="text-lg font-extrabold text-gray-900">{callModal.label}</p>
            <p className="text-3xl font-black text-green-600 tracking-widest my-3">{callModal.number}</p>
            <p className="text-xs text-gray-400 mb-4">
              📱 <strong>On mobile:</strong> Your phone dialer should open automatically.<br/>
              🖥️ <strong>On PC:</strong> Dial the number above manually.
            </p>
            <div className="flex gap-3">
              <a href={`tel:${callModal.number}`}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5">
                <PhoneCall size={14}/> Call Now
              </a>
              <button onClick={() => {
                navigator.clipboard.writeText(callModal.number)
                toast.success('Number copied!')
              }} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-1.5">
                <Copy size={14}/> Copy
              </button>
            </div>
            <button onClick={() => setCallModal(null)} className="mt-3 text-xs text-gray-400 hover:text-gray-600 w-full">Dismiss</button>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}
