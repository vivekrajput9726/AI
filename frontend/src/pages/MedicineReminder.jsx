import { useState, useEffect } from 'react'
import { Plus, Bell, Trash2, X, Pill, Clock, Check, CheckCircle, XCircle, Activity } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Every 6 hours', 'Every 8 hours', 'Weekly']
const MEAL_TIMES  = ['Before meal', 'After meal', 'With meal', 'Empty stomach']

function MedicineReminder() {
  const [reminders,  setReminders]  = useState([])
  const [adherence,  setAdherence]  = useState({ adherence_pct: 100, taken: 0, missed: 0 })
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [form, setForm] = useState({ name: '', dosage: '', frequency: 'Once daily', time: '08:00', meal: 'After meal', notes: '', active: true })

  const load = async () => {
    try {
      const [medsRes, adhRes] = await Promise.all([
        api.get('/medicines/'),
        api.get('/medicines/adherence'),
      ])
      setReminders(medsRes.data || [])
      setAdherence(adhRes.data || { adherence_pct: 100, taken: 0, missed: 0 })
    } catch { toast.error('Failed to load medicines') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // Browser reminder alerts every minute
  useEffect(() => {
    const check = () => {
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      reminders.filter(r => r.active && r.time === currentTime).forEach(r => {
        toast(`💊 Time to take ${r.name} - ${r.dosage}`, { duration: 10000, icon: '⏰' })
        if ('Notification' in window && Notification.permission === 'granted')
          new Notification('Medicine Reminder', { body: `Time to take ${r.name} - ${r.dosage}` })
      })
    }
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [reminders])

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(perm => {
        perm === 'granted' ? toast.success('Notifications enabled!') : toast.error('Please allow notifications')
      })
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Please enter medicine name'); return }
    try {
      await api.post('/medicines/', form)
      toast.success('Medicine added!')
      setShowModal(false)
      setForm({ name: '', dosage: '', frequency: 'Once daily', time: '08:00', meal: 'After meal', notes: '', active: true })
      load()
    } catch { toast.error('Failed to add medicine') }
  }

  const toggleActive = async (med) => {
    try {
      await api.put(`/medicines/${med.id}`, { ...med, active: !med.active })
      load()
    } catch { toast.error('Failed to update') }
  }

  const deleteReminder = async (id) => {
    try {
      await api.delete(`/medicines/${id}`)
      toast.success('Deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  const logDose = async (id, status) => {
    try {
      await api.post('/medicines/log', { medicine_id: id, status })
      toast.success(status === 'taken' ? '✅ Marked as taken!' : '⚠️ Marked as missed')
      load()
    } catch { toast.error('Failed to log') }
  }

  const active   = reminders.filter(r => r.active)
  const inactive = reminders.filter(r => !r.active)

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Medicine Reminder</h1>
            <p className="text-gray-500 text-sm mt-1">Never miss your medications</p>
          </div>
          <div className="flex gap-2">
            <button onClick={requestNotificationPermission} className="btn-secondary text-sm flex items-center gap-2">
              <Bell size={14} /> Enable Alerts
            </button>
            <button onClick={() => setShowModal(true)} className="btn-primary text-sm flex items-center gap-2">
              <Plus size={14} /> Add Medicine
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-600">{reminders.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Medicines</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">{active.length}</p>
            <p className="text-xs text-gray-500 mt-1">Active</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-teal-600">{adherence.adherence_pct}%</p>
            <p className="text-xs text-gray-500 mt-1">Adherence</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-red-400">{adherence.missed}</p>
            <p className="text-xs text-gray-500 mt-1">Missed</p>
          </div>
        </div>

        {/* Active Reminders */}
        {reminders.length === 0 ? (
          <div className="card text-center py-16">
            <Pill size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No medicine reminders</p>
            <p className="text-gray-400 text-sm mt-1">Add your first medicine to get reminders</p>
            <button onClick={() => setShowModal(true)} className="mt-4 btn-primary text-sm inline-flex items-center gap-2">
              <Plus size={14} /> Add Medicine
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900">Your Medicines</h2>
            {reminders.map(reminder => (
              <div key={reminder.id} className={`rounded-2xl p-4 border transition-all ${reminder.active ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${reminder.active ? 'bg-blue-50' : 'bg-gray-100'}`}>
                      <Pill size={22} className={reminder.active ? 'text-blue-600' : 'text-gray-400'} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{reminder.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {reminder.dosage && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{reminder.dosage}</span>}
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10} /> {reminder.time}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{reminder.frequency}</span>
                        <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{reminder.meal}</span>
                      </div>
                      {reminder.notes && <p className="text-xs text-gray-400 mt-1">{reminder.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => logDose(reminder.id, 'taken')}
                      className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-colors" title="Mark Taken">
                      <CheckCircle size={16} />
                    </button>
                    <button onClick={() => logDose(reminder.id, 'missed')}
                      className="p-2 bg-red-50 text-red-400 hover:bg-red-100 rounded-xl transition-colors" title="Mark Missed">
                      <XCircle size={16} />
                    </button>
                    <button onClick={() => toggleActive(reminder)}
                      className={`p-2 rounded-xl transition-colors ${reminder.active ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                      title={reminder.active ? 'Deactivate' : 'Activate'}>
                      <Check size={16} />
                    </button>
                    <button onClick={() => deleteReminder(reminder.id)} className="p-2 bg-red-50 text-red-400 hover:bg-red-100 rounded-xl transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">Add Medicine</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Medicine Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Paracetamol 500mg" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Dosage</label>
                  <input type="text" value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 1 tablet" className="input-field" />
                </div>
                <div>
                  <label className="label">Reminder Time</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div>
                <label className="label">Frequency</label>
                <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} className="input-field">
                  {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="label">When to take</label>
                <select value={form.meal} onChange={e => setForm(f => ({ ...f, meal: e.target.value }))} className="input-field">
                  {MEAL_TIMES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions..." className="input-field" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Plus size={14} /> Add Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default MedicineReminder
