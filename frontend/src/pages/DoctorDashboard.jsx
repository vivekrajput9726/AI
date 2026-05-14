import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, Clock, CheckCircle, XCircle, User, Video,
  FileText, MessageCircle, Plus, Trash2, Edit2,
  ToggleLeft, ToggleRight, Users, Phone, Mail, Activity,
  ChevronRight, X, Stethoscope, Zap, Copy, ExternalLink
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Chat from '../components/common/Chat'
import api from '../services/api'
import { formatDate, getStatusColor } from '../utils/helpers'
import toast from 'react-hot-toast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const EMPTY_SLOT = { day: 'Monday', start_time: '09:00', end_time: '17:00', is_available: true }

// ─── Revenue Tab ──────────────────────────────────────────────────────────────
function RevenueTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/extras/doctor-revenue').then(r => setData(r.data)).catch(() => toast.error('Failed to load revenue')).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-10 flex justify-center"><LoadingSpinner text="Loading revenue..." /></div>
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', value: `₹${(data.total_revenue||0).toLocaleString('en-IN')}`, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Completed', value: data.completed, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending', value: data.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Total Appointments', value: data.total_appointments, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`card ${bg}`}>
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-extrabold ${color} mt-0.5`}>{value}</p>
          </div>
        ))}
      </div>

      {data.monthly?.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-1">Monthly Revenue</h3>
          <p className="text-xs text-gray-400 mb-4">Last 6 months earnings (₹)</p>
          <div className="space-y-2">
            {data.monthly.map(({ month, revenue }) => (
              <div key={month} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-14">{month}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div className="h-3 rounded-full bg-green-500 transition-all"
                    style={{ width: `${Math.min(100, (revenue / Math.max(...data.monthly.map(m=>m.revenue))) * 100)}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-700 w-16 text-right">₹{revenue.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.by_type?.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-3">Revenue by Consultation Type</h3>
          <div className="space-y-2">
            {data.by_type.map(({ type, revenue }) => (
              <div key={type} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-700 capitalize font-medium">{type}</span>
                <span className="text-sm font-bold text-green-600">₹{revenue.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.total_revenue === 0 && (
        <div className="card text-center py-10">
          <p className="text-gray-400 text-sm">No revenue yet. Complete appointments to see earnings.</p>
        </div>
      )}
    </div>
  )
}

// ─── Availability Section ──────────────────────────────────────────────────

function AvailabilitySection() {
  const [slots, setSlots] = useState([])
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [editIndex, setEditIndex] = useState(null)
  const [newSlot, setNewSlot] = useState({ ...EMPTY_SLOT })

  useEffect(() => {
    api.get('/doctors/profile/me')
      .then(res => setSlots(res.data.availability || []))
      .catch(() => toast.error('Could not load availability'))
      .finally(() => setLoadingProfile(false))
  }, [])

  const saveSlots = async (updatedSlots) => {
    setSaving(true)
    try {
      await api.put('/doctors/profile/update', { availability: updatedSlots })
      setSlots(updatedSlots)
      toast.success('Availability saved!')
    } catch {
      toast.error('Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSlot = () => {
    if (slots.some(s => s.day === newSlot.day)) { toast.error(`${newSlot.day} already exists`); return }
    if (newSlot.start_time >= newSlot.end_time) { toast.error('End time must be after start time'); return }
    saveSlots([...slots, { ...newSlot }])
    setAddModal(false)
    setNewSlot({ ...EMPTY_SLOT })
  }

  const handleDelete = (idx) => saveSlots(slots.filter((_, i) => i !== idx))
  const handleToggle = (idx) => saveSlots(slots.map((s, i) => i === idx ? { ...s, is_available: !s.is_available } : s))
  const handleEditSave = () => {
    const slot = slots[editIndex]
    if (slot.start_time >= slot.end_time) { toast.error('End time must be after start time'); return }
    saveSlots([...slots])
    setEditIndex(null)
  }
  const updateSlotField = (idx, field, value) =>
    setSlots(slots.map((s, i) => i === idx ? { ...s, [field]: value } : s))

  const dayOrder = Object.fromEntries(DAYS.map((d, i) => [d, i]))
  const sorted = [...slots].sort((a, b) => (dayOrder[a.day] ?? 7) - (dayOrder[b.day] ?? 7))

  if (loadingProfile) return <div className="card py-8 flex justify-center"><LoadingSpinner text="Loading..." /></div>

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Availability Schedule</h2>
          <p className="text-xs text-gray-400 mt-0.5">Days and hours when patients can book with you.</p>
        </div>
        <button onClick={() => setAddModal(true)} className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4">
          <Plus size={15} /> Add Day
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Calendar size={36} className="mx-auto mb-3 opacity-25" />
          <p className="text-sm">No availability set yet.</p>
          <p className="text-xs mt-1">Click "Add Day" to set your working hours.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((slot) => {
            const idx = slots.indexOf(slot)
            const isEditing = editIndex === idx
            return (
              <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${slot.is_available ? 'border-green-100 bg-green-50/40' : 'border-gray-100 bg-gray-50/60'}`}>
                <div className="w-24 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${slot.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
                    {slot.day.slice(0, 3).toUpperCase()}
                  </span>
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="time" value={slot.start_time} onChange={e => updateSlotField(idx, 'start_time', e.target.value)} className="input-field py-1 text-sm w-32" />
                    <span className="text-gray-400 text-xs">to</span>
                    <input type="time" value={slot.end_time} onChange={e => updateSlotField(idx, 'end_time', e.target.value)} className="input-field py-1 text-sm w-32" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 flex-1">
                    <Clock size={13} className={slot.is_available ? 'text-green-600' : 'text-gray-400'} />
                    <span className={`text-sm font-medium ${slot.is_available ? 'text-gray-800' : 'text-gray-400'}`}>{slot.start_time} — {slot.end_time}</span>
                    {!slot.is_available && <span className="text-xs text-gray-400 ml-1">(Off)</span>}
                  </div>
                )}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isEditing ? (
                    <>
                      <button onClick={handleEditSave} disabled={saving} className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
                        <Save size={12} /> {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditIndex(null)} className="text-xs text-gray-500 px-2 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleToggle(idx)} className="p-1.5 rounded-lg hover:bg-white transition-colors" title={slot.is_available ? 'Mark unavailable' : 'Mark available'}>
                        {slot.is_available ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} className="text-gray-400" />}
                      </button>
                      <button onClick={() => setEditIndex(idx)} className="p-1.5 rounded-lg hover:bg-white text-blue-500" title="Edit times"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(idx)} className="p-1.5 rounded-lg hover:bg-white text-red-400" title="Remove"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {addModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-semibold text-gray-900 mb-4">Add Availability</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Day of the week</label>
                <select value={newSlot.day} onChange={e => setNewSlot(s => ({ ...s, day: e.target.value }))} className="input-field">
                  {DAYS.filter(d => !slots.some(s => s.day === d)).map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Start time</label>
                  <input type="time" value={newSlot.start_time} onChange={e => setNewSlot(s => ({ ...s, start_time: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End time</label>
                  <input type="time" value={newSlot.end_time} onChange={e => setNewSlot(s => ({ ...s, end_time: e.target.value }))} className="input-field" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newSlot.is_available} onChange={e => setNewSlot(s => ({ ...s, is_available: e.target.checked }))} className="w-4 h-4 accent-green-600" />
                <span className="text-sm text-gray-700">Available on this day</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setAddModal(false); setNewSlot({ ...EMPTY_SLOT }) }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleAddSlot} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                <Plus size={15} /> {saving ? 'Saving…' : 'Add Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Patient Detail Modal ──────────────────────────────────────────────────

function PatientModal({ data, onClose, onStartChat, onStartVideo }) {
  const { patient, appointments, total_appointments, has_confirmed } = data
  const confirmedApt = appointments.find(a => a.status === 'confirmed')
  const [connecting, setConnecting] = useState(false)
  const [instantMeeting, setInstantMeeting] = useState(null)
  const [healthRecords, setHealthRecords] = useState([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [showRecords, setShowRecords] = useState(false)

  const loadHealthRecords = async () => {
    if (showRecords) { setShowRecords(false); return }
    setLoadingRecords(true)
    try {
      const res = await api.get(`/health-records/patient/${patient.id}`)
      setHealthRecords(res.data)
      setShowRecords(true)
    } catch {
      toast.error('Could not load health records')
    } finally {
      setLoadingRecords(false)
    }
  }

  const handleConnectNow = async () => {
    setConnecting(true)
    try {
      const res = await api.post('/meetings/instant', {
        patient_id: patient.id,
        patient_name: patient.full_name,
      })
      setInstantMeeting(res.data)
      toast.success(`Meeting room created! Share the link with ${patient.full_name}.`)
    } catch {
      toast.error('Could not create meeting room')
    } finally {
      setConnecting(false)
    }
  }

  const handleEndInstantMeeting = async () => {
    if (!instantMeeting) return
    await api.patch(`/meetings/${instantMeeting.id}/end`).catch(() => {})
    setInstantMeeting(null)
    toast.success('Meeting ended')
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-5 border-b border-gray-100">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <User size={24} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-lg">{patient.full_name}</h2>
            <p className="text-sm text-gray-400">{total_appointments} appointment{total_appointments !== 1 ? 's' : ''} with you</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} className="text-gray-500" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-3">
            {patient.email && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <Mail size={14} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm text-gray-700 truncate">{patient.email}</p>
                </div>
              </div>
            )}
            {patient.phone && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <Phone size={14} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm text-gray-700">{patient.phone}</p>
                </div>
              </div>
            )}
            {patient.gender && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <User size={14} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Gender</p>
                  <p className="text-sm text-gray-700 capitalize">{patient.gender}</p>
                </div>
              </div>
            )}
            {patient.date_of_birth && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Date of Birth</p>
                  <p className="text-sm text-gray-700">{patient.date_of_birth}</p>
                </div>
              </div>
            )}
          </div>

          {/* Instant Connect */}
          {instantMeeting ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <p className="font-semibold text-green-800 text-sm">Meeting room is live</p>
              </div>
              <p className="text-xs text-green-700">
                {patient.full_name} will see a notification to join. Share the link if needed.
              </p>
              <div className="bg-white border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
                <p className="text-xs text-gray-600 truncate flex-1">{instantMeeting.meeting_link}</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(instantMeeting.meeting_link); toast.success('Copied!') }}
                  className="flex-shrink-0 text-green-600 hover:text-green-700"
                  title="Copy link"
                >
                  <Copy size={14} />
                </button>
              </div>
              <div className="flex gap-2">
                <a
                  href={instantMeeting.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm py-2.5 rounded-xl font-medium transition-colors"
                >
                  <Video size={15} /> Join Now
                </a>
                <button
                  onClick={handleEndInstantMeeting}
                  className="px-4 bg-red-50 hover:bg-red-100 text-red-600 text-sm py-2.5 rounded-xl font-medium transition-colors"
                >
                  End
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleConnectNow}
                disabled={connecting}
                className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                {connecting
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating room…</>
                  : <><Zap size={16} /> Connect Now (Instant Meeting)</>
                }
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onStartChat(appointments[0])}
                  className="flex items-center justify-center gap-2 p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium text-sm transition-colors"
                >
                  <MessageCircle size={15} /> Message
                </button>
                {has_confirmed && confirmedApt?.meeting_link ? (
                  <a
                    href={confirmedApt.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors"
                  >
                    <Video size={15} /> Apt. Call
                  </a>
                ) : (
                  <button disabled className="flex items-center justify-center gap-2 p-2.5 bg-gray-100 text-gray-400 rounded-xl text-sm cursor-not-allowed">
                    <Video size={15} /> No Apt. Call
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Appointment History */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Activity size={15} className="text-blue-500" /> Appointment History
            </h3>
            <div className="space-y-2">
              {appointments.map(apt => (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{formatDate(apt.appointment_date)}</p>
                    <p className="text-xs text-gray-400">{apt.appointment_time} · {apt.appointment_type}</p>
                    {apt.symptoms && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">Symptoms: {apt.symptoms}</p>}
                  </div>
                  <span className={`${getStatusColor(apt.status)} capitalize text-xs`}>{apt.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Health Records */}
          <div>
            <button
              onClick={loadHealthRecords}
              className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
            >
              <span className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                <FileText size={15} className="text-blue-500" /> Patient Lab Reports & Health Records
              </span>
              <span className="text-xs text-blue-500">{showRecords ? 'Hide ▲' : 'View ▼'}</span>
            </button>

            {loadingRecords && (
              <div className="py-4 flex justify-center">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {showRecords && (
              <div className="mt-2 space-y-2">
                {healthRecords.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-xl">
                    <FileText size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">No health records uploaded yet</p>
                  </div>
                ) : (
                  healthRecords.map(record => (
                    <div key={record.id} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center gap-3 shadow-sm">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
                        {record.record_type === 'lab_report' ? '🧪' :
                         record.record_type === 'prescription' ? '💊' : '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{record.title}</p>
                        <p className="text-xs text-gray-400">{record.date}</p>
                        {record.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{record.description}</p>
                        )}
                      </div>
                      {record.file_data && (
                        <a href={record.file_data} target="_blank" rel="noopener noreferrer"
                          className="flex-shrink-0 text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                          View
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── My Patients Tab ───────────────────────────────────────────────────────

function MyPatientsTab({ onStartChat, onStartVideo }) {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [quickConnecting, setQuickConnecting] = useState(null) // patient_id being connected

  const handleQuickConnect = async (e, patient) => {
    e.stopPropagation()
    setQuickConnecting(patient.id)
    try {
      const res = await api.post('/meetings/instant', {
        patient_id: patient.id,
        patient_name: patient.full_name,
      })
      toast.success('Meeting room created!')
      window.open(res.data.meeting_link, '_blank')
    } catch {
      toast.error('Could not create meeting room')
    } finally {
      setQuickConnecting(null)
    }
  }

  useEffect(() => {
    api.get('/doctors/my-patients')
      .then(res => setPatients(res.data))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-16 flex justify-center"><LoadingSpinner text="Loading patients..." /></div>

  if (patients.length === 0) return (
    <div className="text-center py-16 text-gray-400">
      <Users size={44} className="mx-auto mb-3 opacity-25" />
      <p className="font-medium text-gray-500">No patients yet</p>
      <p className="text-sm mt-1">Patients will appear here once they book appointments with you.</p>
    </div>
  )

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map(({ patient, total_appointments, last_appointment, has_confirmed, appointments }) => (
          <div
            key={patient.id}
            onClick={() => setSelected({ patient, appointments, total_appointments, has_confirmed })}
            className="card cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all border border-transparent hover:border-blue-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{patient.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{patient.email || 'No email'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1"><Calendar size={11} /> {total_appointments} visit{total_appointments !== 1 ? 's' : ''}</span>
              {last_appointment?.appointment_date && (
                <span>Last: {formatDate(last_appointment.appointment_date)}</span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className={`${getStatusColor(last_appointment?.status || 'pending')} capitalize text-xs`}>
                {last_appointment?.status || '—'}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={e => { e.stopPropagation(); onStartChat({ id: last_appointment?.id, patient_name: patient.full_name }) }}
                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                  title="Message patient"
                >
                  <MessageCircle size={13} />
                </button>
                <button
                  onClick={e => handleQuickConnect(e, patient)}
                  disabled={quickConnecting === patient.id}
                  className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors disabled:opacity-50"
                  title="Connect Now — instant meeting"
                >
                  {quickConnecting === patient.id
                    ? <div className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin" />
                    : <Zap size={13} />}
                </button>
                <span className="p-1.5 text-gray-400"><ChevronRight size={13} /></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <PatientModal
          data={selected}
          onClose={() => setSelected(null)}
          onStartChat={(apt) => { setSelected(null); onStartChat(apt) }}
          onStartVideo={(apt) => { setSelected(null); onStartVideo(apt) }}
        />
      )}
    </>
  )
}

// ─── Appointments Tab ──────────────────────────────────────────────────────

function AppointmentsTab({ appointments, loading, onStatusUpdate, onPrescription, onStartChat }) {
  const [callState, setCallState] = useState({})

  const handleVideoCall = async (apt) => {
    // If meeting link already exists on the appointment, open it directly
    if (apt.meeting_link) {
      window.open(apt.meeting_link, '_blank')
      return
    }

    // If we already created a room for this appointment this session, reuse it
    if (callState[apt.id]?.link) {
      window.open(callState[apt.id].link, '_blank')
      return
    }

    // Create a fresh instant meeting — patient gets the notification banner
    setCallState(s => ({ ...s, [apt.id]: { calling: true } }))
    try {
      const res = await api.post('/meetings/instant', {
        patient_id: apt.patient_id,
        patient_name: apt.patient_name,
      })
      const link = res.data.meeting_link
      setCallState(s => ({ ...s, [apt.id]: { link, calling: false } }))
      toast.success(`Calling ${apt.patient_name} — patient is being notified!`)
      window.open(link, '_blank')
    } catch {
      setCallState(s => ({ ...s, [apt.id]: { calling: false } }))
      toast.error('Could not start video call')
    }
  }

  const handleEndCall = async (apt) => {
    setCallState(s => ({ ...s, [apt.id]: { link: null, calling: false } }))
    toast('Call ended')
  }

  return loading ? (
    <div className="py-12 flex justify-center"><LoadingSpinner text="Loading appointments..." /></div>
  ) : appointments.length === 0 ? (
    <div className="text-center py-12 text-gray-400">
      <Calendar size={40} className="mx-auto mb-3 opacity-30" />
      <p>No appointments yet</p>
    </div>
  ) : (
    <div className="space-y-3">
      {appointments.map(apt => {
        const cs = callState[apt.id] || {}
        const activeMeetingLink = apt.meeting_link || cs.link || null

        return (
        <div key={apt.id} className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{apt.patient_name}</p>
                <p className="text-sm text-gray-400">{formatDate(apt.appointment_date)} · {apt.appointment_time}</p>
                {apt.symptoms && <p className="text-xs text-gray-500 mt-1 line-clamp-1">Symptoms: {apt.symptoms}</p>}
              </div>
            </div>

            {/* Video call icon always visible for confirmed */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {apt.status === 'confirmed' && (
                <button
                  onClick={() => handleVideoCall(apt)}
                  disabled={cs.calling}
                  title="Start video call — patient will be notified"
                  className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${
                    cs.calling
                      ? 'bg-blue-100 text-blue-400 cursor-wait'
                      : activeMeetingLink
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {cs.calling
                    ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    : <Video size={16} />}
                  {/* green dot when call is live */}
                  {activeMeetingLink && !cs.calling && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>
              )}
              <span className={`${getStatusColor(apt.status)} capitalize`}>{apt.status}</span>
            </div>
          </div>

          {/* Active call banner */}
          {apt.status === 'confirmed' && activeMeetingLink && (
            <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              <p className="text-xs text-blue-700 flex-1 truncate">Patient is being notified · <span className="font-medium">{activeMeetingLink}</span></p>
              <button
                onClick={() => { navigator.clipboard.writeText(activeMeetingLink); toast.success('Copied!') }}
                className="text-blue-500 hover:text-blue-700 flex-shrink-0" title="Copy link"
              ><Copy size={13} /></button>
              <button
                onClick={() => handleEndCall(apt)}
                className="text-red-400 hover:text-red-600 flex-shrink-0 ml-1" title="End call"
              ><X size={13} /></button>
            </div>
          )}

          {apt.status === 'pending' && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <button onClick={() => onStatusUpdate(apt.id, 'confirmed')} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1">
                <CheckCircle size={14} /> Confirm
              </button>
              <button onClick={() => onStatusUpdate(apt.id, 'cancelled')} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1">
                <XCircle size={14} /> Decline
              </button>
            </div>
          )}

          {apt.status === 'confirmed' && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleVideoCall(apt)}
                disabled={cs.calling}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 font-medium"
              >
                {cs.calling
                  ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Calling…</>
                  : <><Video size={14} /> {activeMeetingLink ? 'Rejoin Call' : 'Start Video Call'}</>}
              </button>
              <button onClick={() => onStartChat(apt)} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1">
                <MessageCircle size={14} /> Chat
              </button>
              <button onClick={() => onPrescription(apt.id)} className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1">
                <FileText size={14} /> Prescription
              </button>
            </div>
          )}

          {apt.prescription && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1">Prescription:</p>
              <p className="text-sm text-gray-700 bg-green-50 p-2 rounded-lg">{apt.prescription}</p>
            </div>
          )}
        </div>
        )
      })}
    </div>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────────────────

function DoctorDashboard() {
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0 })
  const [activeTab, setActiveTab] = useState('appointments') // appointments | patients | availability
  const [prescriptionModal, setPrescriptionModal] = useState(null)
  const [prescription, setPrescription] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatRoom, setChatRoom] = useState(null)
  const [chatName, setChatName] = useState('')

  const handleStartChat = (appointment) => {
    setChatRoom(`appointment_${appointment.id}`)
    setChatName(appointment.patient_name)
    setChatOpen(true)
  }

  const handleStartVideo = (appointment) => {
    navigate(`/doctor/video/${appointment.id}`)
  }

  useEffect(() => { loadAppointments() }, [])

  const loadAppointments = async () => {
    try {
      const res = await api.get('/appointments/my')
      setAppointments(res.data)
      const d = res.data
      setStats({
        total: d.length,
        pending: d.filter(a => a.status === 'pending').length,
        confirmed: d.filter(a => a.status === 'confirmed').length,
        completed: d.filter(a => a.status === 'completed').length,
      })
    } catch { toast.error('Failed to load appointments') }
    finally { setLoading(false) }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: newStatus })
      toast.success(`Appointment ${newStatus}!`)
      loadAppointments()
    } catch { toast.error('Update failed') }
  }

  const handlePrescription = async () => {
    if (!prescription.trim()) return
    try {
      await api.patch(`/appointments/${prescriptionModal}/status`, { prescription, status: 'completed' })
      toast.success('Prescription saved & appointment completed!')
      setPrescriptionModal(null)
      setPrescription('')
      loadAppointments()
    } catch { toast.error('Failed to save prescription') }
  }

  const TABS = [
    { key: 'appointments', label: 'Appointments', icon: Calendar },
    { key: 'patients', label: 'My Patients', icon: Users },
    { key: 'availability', label: 'Availability', icon: Clock },
    { key: 'revenue', label: 'Revenue', icon: Activity },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-white">
          <p className="text-green-100 text-sm">Doctor Portal</p>
          <h1 className="text-2xl font-bold mt-1">Welcome, {user?.full_name?.split(' ')[0]} 👨‍⚕️</h1>
          <p className="text-green-100 text-sm mt-1">Manage your appointments, patients and schedule.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'bg-blue-500', icon: Calendar },
            { label: 'Pending', value: stats.pending, color: 'bg-yellow-400', icon: Clock },
            { label: 'Confirmed', value: stats.confirmed, color: 'bg-green-500', icon: CheckCircle },
            { label: 'Completed', value: stats.completed, color: 'bg-purple-500', icon: FileText },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <div className={`w-11 h-11 rounded-2xl ${color} flex items-center justify-center`}>
                  <Icon size={20} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pending Approval Banner */}
        {stats.pending > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-yellow-800">
                {stats.pending} Appointment{stats.pending > 1 ? 's' : ''} Awaiting Your Approval
              </p>
              <p className="text-sm text-yellow-600">Review and confirm or cancel pending requests from patients.</p>
            </div>
            <button
              onClick={() => setActiveTab('appointments')}
              className="flex-shrink-0 bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Review Now
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === key ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={15} /> {label}
              {key === 'appointments' && stats.pending > 0 && (
                <span className="bg-yellow-400 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{stats.pending}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'appointments' && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">All Appointments</h2>
            <AppointmentsTab
              appointments={appointments}
              loading={loading}
              onStatusUpdate={handleStatusUpdate}
              onPrescription={setPrescriptionModal}
              onStartChat={handleStartChat}
            />
          </div>
        )}

        {activeTab === 'patients' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">My Patients</h2>
              <p className="text-xs text-gray-400">Click a patient to view their history and connect</p>
            </div>
            <MyPatientsTab onStartChat={handleStartChat} onStartVideo={handleStartVideo} />
          </div>
        )}

        {activeTab === 'availability' && <AvailabilitySection />}

        {activeTab === 'revenue' && <RevenueTab />}
      </div>

      {/* Chat overlay */}
      {chatOpen && chatRoom && (
        <Chat roomId={chatRoom} otherPersonName={chatName} onClose={() => setChatOpen(false)} />
      )}

      {/* Prescription Modal */}
      {prescriptionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-semibold text-gray-900 mb-4">Add Prescription</h3>
            <textarea
              value={prescription}
              onChange={e => setPrescription(e.target.value)}
              placeholder="Enter prescription details, medicines, dosage, instructions..."
              className="input-field h-32 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setPrescriptionModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handlePrescription} className="btn-primary flex-1">Save & Complete</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default DoctorDashboard
