import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Activity, Calendar, Stethoscope, Brain, ChevronRight,
  MessageCircle, FileSearch, Video, X, Star, Heart,
  Droplets, Weight, TrendingUp, MapPin, Pill, ArrowRight,
  Clock, CheckCircle, FileText, CalendarPlus, Plus
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Chat from '../components/common/Chat'
import api from '../services/api'
import { DiseaseBarChart } from '../components/common/Charts'
import { fetchMyAppointments } from '../redux/slices/appointmentSlice'
import { fetchDoctors } from '../redux/slices/doctorSlice'
import { formatDate, getStatusColor } from '../utils/helpers'
import toast from 'react-hot-toast'

// ── Rating Modal ──────────────────────────────────────────────────────────────
function RatingModal({ appointment, onClose, onSubmit }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!rating) return toast.error('Please select a star rating')
    setSubmitting(true)
    await onSubmit(appointment.id, rating, review)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Rate Your Consultation</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl"><X size={16} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">How was your consultation with <strong>{appointment.doctor_name}</strong>?</p>
        <div className="flex justify-center gap-2 mb-5">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)} className="transition-transform hover:scale-110">
              <Star size={36} className={`transition-colors ${s <= (hovered || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
            </button>
          ))}
        </div>
        <textarea value={review} onChange={e => setReview(e.target.value)} placeholder="Share your experience (optional)..." className="input-field h-20 resize-none text-sm mb-4" />
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Skip</button>
          <button onClick={handleSubmit} disabled={!rating || submitting} className="btn-primary flex-1">{submitting ? 'Submitting...' : 'Submit Rating'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Health Metric Card ────────────────────────────────────────────────────────
function HealthCard({ icon: Icon, label, value, unit, status, color, bg }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
          <Icon size={18} className={color} />
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status === 'Normal' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{status}</span>
      </div>
      <p className="text-2xl font-extrabold text-gray-900">{value} <span className="text-sm font-normal text-gray-400">{unit}</span></p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

// ── Quick Action Card ─────────────────────────────────────────────────────────
function QuickAction({ icon, label, desc, color, bg, onClick }) {
  return (
    <button onClick={onClick} className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-left group flex items-start gap-3">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <span className={color}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{desc}</p>
      </div>
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
function PatientDashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const { list: appointments, loading: aptLoading } = useSelector(s => s.appointments)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatRoom, setChatRoom] = useState(null)
  const [chatName, setChatName] = useState('')
  const [activeMeeting, setActiveMeeting] = useState(null)
  const [ratingApt, setRatingApt] = useState(null)
  const [healthTips, setHealthTips] = useState([])
  const pollRef = useRef(null)

  const submitRating = async (appointmentId, rating, review) => {
    try {
      await api.post(`/appointments/${appointmentId}/rate`, { rating, review })
      toast.success('Thank you for your feedback!')
      setRatingApt(null)
      dispatch(fetchMyAppointments())
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to submit rating')
    }
  }

  const openChat = (appointment) => {
    setChatRoom(`appointment_${appointment.id}`)
    setChatName(appointment.doctor_name)
    setChatOpen(true)
  }

  const dismissMeeting = async () => {
    if (activeMeeting) await api.patch(`/meetings/${activeMeeting.id}/end`).catch(() => {})
    setActiveMeeting(null)
  }

  useEffect(() => {
    dispatch(fetchMyAppointments())
    dispatch(fetchDoctors({ limit: 4 }))
    api.get('/extras/health-tips').then(r => setHealthTips(r.data.tips || [])).catch(() => {})

    const poll = async () => {
      try {
        const res = await api.get('/meetings/active')
        setActiveMeeting(res.data || null)
      } catch { }
    }
    poll()
    pollRef.current = setInterval(poll, 10000)
    return () => clearInterval(pollRef.current)
  }, [dispatch])

  const upcomingApt = appointments.find(a => a.status === 'confirmed') || appointments.find(a => a.status === 'pending')
  const recentReports = appointments.filter(a => a.status === 'completed').slice(0, 2)
  const firstName = user?.full_name?.split(' ')[0] || 'there'

  const quickActions = [
    { icon: <Brain size={18} />, label: 'AI Symptom Checker', desc: 'Check your symptoms', color: 'text-blue-600', bg: 'bg-blue-50', path: '/patient/symptoms' },
    { icon: <Calendar size={18} />, label: 'Book Appointment', desc: 'Find & book doctors', color: 'text-green-600', bg: 'bg-green-50', path: '/patient/doctors' },
    { icon: <FileText size={18} />, label: 'Health Records', desc: 'View your reports', color: 'text-purple-600', bg: 'bg-purple-50', path: '/patient/records' },
    { icon: <Pill size={18} />, label: 'Medicine Reminder', desc: 'Never miss a dose', color: 'text-orange-600', bg: 'bg-orange-50', path: '/patient/medicines' },
    { icon: <MessageCircle size={18} />, label: 'Chat with Doctor', desc: 'Talk to doctors', color: 'text-teal-600', bg: 'bg-teal-50', path: '/patient/doctors' },
    { icon: <MapPin size={18} />, label: 'Nearby Hospitals', desc: 'Find hospitals near you', color: 'text-red-600', bg: 'bg-red-50', path: '/patient/nearby' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">

        {/* ── Instant Meeting Banner ── */}
        {activeMeeting && (
          <div className="relative bg-green-600 text-white rounded-2xl p-4 flex items-center gap-4 shadow-lg">
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <Video size={20} className="text-white" />
              </div>
              <span className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold">Dr. {activeMeeting.doctor_name} is calling!</p>
              <p className="text-green-100 text-sm">Your doctor has started an instant meeting.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <a href={activeMeeting.meeting_link} target="_blank" rel="noopener noreferrer"
                className="bg-white text-green-700 font-semibold text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
                <Video size={14} /> Join Now
              </a>
              <button onClick={dismissMeeting} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl"><X size={14} /></button>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Good Morning, {firstName} 👋</h1>
            <p className="text-gray-400 text-sm mt-0.5">Take care of your health today!</p>
          </div>
          <button onClick={() => navigate('/patient/doctors')} className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={15} /> Book Appointment
          </button>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* ── Left 2/3 ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Quick Actions</h2>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {quickActions.map(({ icon, label, desc, color, bg, path }) => (
                  <QuickAction key={label} icon={icon} label={label} desc={desc} color={color} bg={bg} onClick={() => navigate(path)} />
                ))}
              </div>
            </div>

            {/* Health Summary */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Health Summary</h2>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <HealthCard icon={Heart} label="Heart Rate" value="72" unit="bpm" status="Normal" color="text-red-500" bg="bg-red-50" />
                <HealthCard icon={Activity} label="Blood Pressure" value="120/80" unit="" status="Normal" color="text-blue-500" bg="bg-blue-50" />
                <HealthCard icon={Droplets} label="Blood Sugar" value="98" unit="mg/dl" status="Normal" color="text-orange-500" bg="bg-orange-50" />
                <HealthCard icon={TrendingUp} label="Weight" value="65" unit="kg" status="Normal" color="text-green-500" bg="bg-green-50" />
              </div>
            </div>

            {/* Recent Appointments */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Recent Appointments</h2>
                <button onClick={() => navigate('/patient/doctors')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  View all <ArrowRight size={12} />
                </button>
              </div>
              {aptLoading ? (
                <div className="py-6 flex justify-center"><LoadingSpinner /></div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Calendar size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No appointments yet</p>
                  <button onClick={() => navigate('/patient/doctors')} className="mt-3 text-blue-600 text-sm font-medium hover:underline">Book your first appointment</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {appointments.slice(0, 4).map(apt => (
                    <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-700 font-bold text-sm">
                        {apt.doctor_name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{apt.doctor_name}</p>
                        <p className="text-xs text-gray-400">{formatDate(apt.appointment_date)} · {apt.appointment_time}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`${getStatusColor(apt.status)} capitalize text-xs`}>{apt.status}</span>
                        <button onClick={() => openChat(apt)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                          <MessageCircle size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right 1/3 ── */}
          <div className="space-y-5">

            {/* Upcoming Appointment */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Upcoming Appointment</h2>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
              {upcomingApt ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {upcomingApt.doctor_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{upcomingApt.doctor_name}</p>
                      <p className="text-xs text-gray-400">Specialist</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 mb-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar size={13} className="text-blue-500" />
                      <span>{formatDate(upcomingApt.appointment_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock size={13} className="text-blue-500" />
                      <span>{upcomingApt.appointment_time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`${getStatusColor(upcomingApt.status)} capitalize`}>{upcomingApt.status}</span>
                    </div>
                  </div>
                  {upcomingApt.status === 'confirmed' && upcomingApt.meeting_link && (
                    <a href={upcomingApt.meeting_link} target="_blank" rel="noopener noreferrer"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                      <Video size={14} /> Join Call
                    </a>
                  )}
                  {upcomingApt.status === 'confirmed' && (
                    <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Doctor - ' + upcomingApt.doctor_name)}&dates=${upcomingApt.appointment_date?.replace(/-/g, '')}T090000/${upcomingApt.appointment_date?.replace(/-/g, '')}T100000`}
                      target="_blank" rel="noopener noreferrer"
                      className="mt-2 w-full border border-blue-200 text-blue-600 text-xs font-medium py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-colors">
                      <CalendarPlus size={13} /> Add to Calendar
                    </a>
                  )}
                  <p className="text-xs text-blue-500 text-center mt-3 cursor-pointer hover:underline" onClick={() => navigate('/patient/doctors')}>View all appointments →</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No upcoming appointments</p>
                  <button onClick={() => navigate('/patient/doctors')} className="mt-3 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">Book Now</button>
                </div>
              )}
            </div>

            {/* Recent Reports */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Recent Reports</h2>
                <button onClick={() => navigate('/patient/records')} className="text-xs text-blue-600 hover:underline">View all →</button>
              </div>
              {recentReports.length > 0 ? (
                <div className="space-y-3">
                  {recentReports.map(apt => (
                    <div key={apt.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">Consultation Report</p>
                        <p className="text-xs text-gray-400">{formatDate(apt.appointment_date)}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Blood Test Report', date: '12 May 2024', icon: '🩸' },
                    { label: 'X-Ray Chest', date: '10 May 2024', icon: '🦴' },
                  ].map(({ label, date, icon }) => (
                    <div key={label} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('/patient/laboratory')}>
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">{icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{label}</p>
                        <p className="text-xs text-gray-400">{date}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => navigate('/patient/report-analyzer')} className="mt-3 w-full text-xs text-blue-600 font-medium hover:underline text-center block">View all reports →</button>
            </div>
          </div>
        </div>
      </div>

      {/* Health Tips */}
      {healthTips.length > 0 && (
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-5 border border-teal-100">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-lg">💡</span> Today's Health Tips
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {healthTips.slice(0,4).map((tip, i) => (
              <div key={i} className="bg-white rounded-xl p-3 flex gap-3 shadow-sm">
                <span className="text-xl flex-shrink-0">{tip.icon}</span>
                <div>
                  <p className="text-xs font-bold text-teal-600">{tip.category}</p>
                  <p className="text-xs text-gray-700 mt-0.5">{tip.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {chatOpen && chatRoom && <Chat roomId={chatRoom} otherPersonName={chatName} onClose={() => setChatOpen(false)} />}
      {ratingApt && <RatingModal appointment={ratingApt} onClose={() => setRatingApt(null)} onSubmit={submitRating} />}
    </DashboardLayout>
  )
}

export default PatientDashboard
