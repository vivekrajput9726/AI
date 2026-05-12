import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Calendar, Clock, CheckCircle, XCircle, User, Video, FileText, MessageCircle } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Chat from '../components/common/Chat'
import api from '../services/api'
import { formatDate, getStatusColor } from '../utils/helpers'
import toast from 'react-hot-toast'

function DoctorDashboard() {
  const { user } = useSelector(s => s.auth)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0 })
  const [prescriptionModal, setPrescriptionModal] = useState(null)
  const [prescription, setPrescription] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatRoom, setChatRoom] = useState(null)
  const [chatName, setChatName] = useState('')

  const openChat = (appointment) => {
    setChatRoom(`appointment_${appointment.id}`)
    setChatName(appointment.patient_name)
    setChatOpen(true)
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      const res = await api.get('/appointments/my')
      setAppointments(res.data)
      const data = res.data
      setStats({
        total: data.length,
        pending: data.filter(a => a.status === 'pending').length,
        confirmed: data.filter(a => a.status === 'confirmed').length,
        completed: data.filter(a => a.status === 'completed').length,
      })
    } catch (e) {
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: newStatus })
      toast.success(`Appointment ${newStatus}!`)
      loadAppointments()
    } catch {
      toast.error('Update failed')
    }
  }

  const handlePrescription = async () => {
    if (!prescription.trim()) return
    try {
      await api.patch(`/appointments/${prescriptionModal}/status`, { prescription, status: 'completed' })
      toast.success('Prescription saved & appointment completed!')
      setPrescriptionModal(null)
      setPrescription('')
      loadAppointments()
    } catch {
      toast.error('Failed to save prescription')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-white">
          <p className="text-green-100 text-sm">Doctor Portal</p>
          <h1 className="text-2xl font-bold mt-1">Welcome, {user?.full_name?.split(' ')[0]} 👨‍⚕️</h1>
          <p className="text-green-100 text-sm mt-1">Manage your appointments and patient consultations.</p>
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

        {/* Appointments Table */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">All Appointments</h2>
          {loading ? (
            <div className="py-12 flex justify-center"><LoadingSpinner text="Loading appointments..." /></div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p>No appointments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map(apt => (
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
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`${getStatusColor(apt.status)} capitalize`}>{apt.status}</span>
                    </div>
                  </div>

                  {apt.status === 'pending' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                        className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={14} /> Confirm
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <XCircle size={14} /> Decline
                      </button>
                    </div>
                  )}

                  {apt.status === 'confirmed' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <a
                        href={`/doctor/video/${apt.id}`}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Video size={14} /> Start Video Call
                      </a>
                      <button
                        onClick={() => openChat(apt)}
                        className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <MessageCircle size={14} /> Chat
                      </button>
                      <button
                        onClick={() => setPrescriptionModal(apt.id)}
                        className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
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
              ))}
            </div>
          )}
        </div>
      </div>

      {chatOpen && chatRoom && (
        <Chat
          roomId={chatRoom}
          otherPersonName={chatName}
          onClose={() => setChatOpen(false)}
        />
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
