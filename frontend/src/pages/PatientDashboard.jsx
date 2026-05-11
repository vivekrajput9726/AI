import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Activity, Calendar, Clock, Stethoscope, Brain, ChevronRight, AlertCircle } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import DoctorCard from '../components/common/DoctorCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { fetchMyAppointments } from '../redux/slices/appointmentSlice'
import { fetchDoctors } from '../redux/slices/doctorSlice'
import { formatDate, getStatusColor } from '../utils/helpers'

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`card hover:shadow-md transition-all cursor-pointer ${onClick ? 'hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  )
}

function PatientDashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const { list: appointments, loading: aptLoading } = useSelector(s => s.appointments)
  const { list: doctors, loading: docLoading } = useSelector(s => s.doctors)

  useEffect(() => {
    dispatch(fetchMyAppointments())
    dispatch(fetchDoctors({ limit: 4 }))
  }, [dispatch])

  const pending = appointments.filter(a => a.status === 'pending').length
  const confirmed = appointments.filter(a => a.status === 'confirmed').length
  const completed = appointments.filter(a => a.status === 'completed').length
  const recentAppointments = appointments.slice(0, 5)

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 text-white">
          <p className="text-blue-100 text-sm mb-1">Good morning 👋</p>
          <h1 className="text-2xl font-bold mb-3">Hello, {user?.full_name?.split(' ')[0]}!</h1>
          <p className="text-blue-100 text-sm mb-4">How are you feeling today? Describe your symptoms to get an AI health analysis.</p>
          <button
            onClick={() => navigate('/patient/symptoms')}
            className="bg-white text-blue-700 hover:bg-blue-50 font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            <Brain size={16} />
            Check Symptoms Now
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Calendar} label="Total Appointments" value={appointments.length} color="bg-blue-500" onClick={() => navigate('/patient/profile')} />
          <StatCard icon={Clock} label="Pending" value={pending} color="bg-yellow-400" />
          <StatCard icon={Activity} label="Confirmed" value={confirmed} color="bg-green-500" />
          <StatCard icon={Stethoscope} label="Completed" value={completed} color="bg-purple-500" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Appointments */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recent Appointments</h2>
            </div>
            {aptLoading ? (
              <div className="py-8 flex justify-center"><LoadingSpinner /></div>
            ) : recentAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No appointments yet</p>
                <button onClick={() => navigate('/patient/doctors')} className="mt-3 text-blue-600 text-sm hover:underline">
                  Find a doctor
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAppointments.map(apt => (
                  <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{apt.doctor_name}</p>
                      <p className="text-xs text-gray-400">{formatDate(apt.appointment_date)} · {apt.appointment_time}</p>
                    </div>
                    <span className={getStatusColor(apt.status) + ' capitalize'}>
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { icon: Brain, label: 'AI Symptom Checker', desc: 'Get instant health insights', path: '/patient/symptoms', color: 'bg-blue-50 text-blue-700' },
                { icon: Stethoscope, label: 'Find Doctors', desc: 'Browse 20+ specialists', path: '/patient/doctors', color: 'bg-green-50 text-green-700' },
                { icon: Calendar, label: 'Book Appointment', desc: 'Schedule a consultation', path: '/patient/doctors', color: 'bg-purple-50 text-purple-700' },
              ].map(({ icon: Icon, label, desc, path, color }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 bg-amber-50 rounded-xl flex gap-3">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">AI analysis is not a substitute for professional medical advice. Always consult a qualified doctor.</p>
            </div>
          </div>
        </div>

        {/* Featured Doctors */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Top Doctors</h2>
            <button onClick={() => navigate('/patient/doctors')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight size={14} />
            </button>
          </div>
          {docLoading ? (
            <div className="py-8 flex justify-center"><LoadingSpinner /></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {doctors.slice(0, 4).map(doc => (
                <DoctorCard key={doc.id} doctor={doc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PatientDashboard
