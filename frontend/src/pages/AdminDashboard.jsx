import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Users, Stethoscope, Calendar, CheckCircle, Shield, XCircle, ToggleLeft, ToggleRight, TrendingUp, IndianRupee, BarChart2, Bot, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { PlatformStatsChart, SpecializationPieChart, WeeklyAppointmentChart, MonthlyTrendChart, RevenueChart, AppointmentTypeDonutChart, TopSpecializationsChart } from '../components/common/Charts'
import api from '../services/api'
import { formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

function AdminDashboard() {
  const { user } = useSelector(s => s.auth)
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [users, setUsers] = useState([])
  const [doctors, setDoctors] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [statsRes, usersRes, doctorsRes, analyticsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/doctors'),
        api.get('/admin/analytics'),
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data.users)
      setDoctors(doctorsRes.data.doctors)
      setAnalytics(analyticsRes.data)
    } catch {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const toggleUser = async (userId) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/toggle`)
      setUsers(prev => prev.map(u => u.id === userId ? res.data : u))
      toast.success('User status updated')
    } catch {
      toast.error('Failed to update user')
    }
  }

  const verifyDoctor = async (doctorId) => {
    try {
      const res = await api.patch(`/admin/doctors/${doctorId}/verify`)
      setDoctors(prev => prev.map(d => d.id === doctorId ? res.data : d))
      toast.success('Doctor verified!')
    } catch {
      toast.error('Failed to verify doctor')
    }
  }

  if (loading) return (
    <DashboardLayout>
      <div className="py-16 flex justify-center"><LoadingSpinner text="Loading admin panel..." /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={20} />
            <span className="text-purple-100 text-sm">Admin Panel</span>
          </div>
          <h1 className="text-2xl font-bold">Platform Overview</h1>
          <p className="text-purple-100 text-sm mt-1">Manage users, doctors, and platform settings.</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Total Patients', value: stats.total_patients, icon: Users, color: 'bg-blue-500' },
              { label: 'Total Doctors', value: stats.total_doctors, icon: Stethoscope, color: 'bg-green-500' },
              { label: 'Total Appointments', value: stats.total_appointments, icon: Calendar, color: 'bg-purple-500' },
              { label: 'Pending Appointments', value: stats.pending_appointments, icon: Calendar, color: 'bg-yellow-400' },
              { label: 'Verified Doctors', value: stats.verified_doctors, icon: CheckCircle, color: 'bg-emerald-500' },
              { label: 'Unverified Doctors', value: stats.unverified_doctors, icon: XCircle, color: 'bg-red-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
                  </div>
                  <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                    <Icon size={18} className="text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {['overview', 'analytics', 'users', 'doctors'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">All Users ({users.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Name</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Email</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Role</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Joined</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium text-gray-900">{u.full_name}</td>
                      <td className="py-3 px-2 text-gray-500">{u.email}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'doctor' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{u.role}</span>
                      </td>
                      <td className="py-3 px-2 text-gray-400">{formatDate(u.created_at)}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => toggleUser(u.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {u.is_active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Doctors Tab */}
        {tab === 'doctors' && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">All Doctors ({doctors.length})</h2>
            <div className="space-y-3">
              {doctors.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-gray-200">
                  <div className="flex items-center gap-3">
                    {doc.profile_image ? (
                      <img src={doc.profile_image} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Stethoscope size={16} className="text-blue-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-400">{doc.specialization} · {doc.hospital}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {doc.is_verified ? (
                      <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle size={12} /> Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => verifyDoctor(doc.id)}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full transition-colors"
                      >
                        Verify Doctor
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {tab === 'analytics' && analytics && (
          <div className="space-y-4 animate-fade-in">
            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: `₹${analytics.total_revenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-green-500', sub: 'from completed consults' },
                { label: 'New Patients', value: `+${analytics.new_patients_this_month}`, icon: TrendingUp, color: 'bg-blue-500', sub: 'this month' },
                { label: 'New Doctors', value: `+${analytics.new_doctors_this_month}`, icon: Stethoscope, color: 'bg-purple-500', sub: 'this month' },
                { label: 'Appt Types', value: analytics.appointment_types.length, icon: BarChart2, color: 'bg-orange-500', sub: 'consultation modes' },
              ].map(({ label, value, icon: Icon, color, sub }) => (
                <div key={label} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-400">{label}</p>
                    <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center`}>
                      <Icon size={15} className="text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* AI Insights Panel */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={18} />
                <span className="font-semibold">AI Insights</span>
                <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Auto-generated</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/15 rounded-xl p-3">
                  <p className="text-emerald-100 text-xs mb-1">Completion Rate</p>
                  <p className="font-bold text-lg">
                    {stats?.total_appointments > 0
                      ? `${Math.round(((analytics.monthly_trends.reduce((s, m) => s + m.completed, 0)) / Math.max(analytics.monthly_trends.reduce((s, m) => s + m.total, 0), 1)) * 100)}%`
                      : '0%'}
                  </p>
                  <p className="text-emerald-200 text-xs">of appointments completed</p>
                </div>
                <div className="bg-white/15 rounded-xl p-3">
                  <p className="text-emerald-100 text-xs mb-1">Avg Revenue / Appt</p>
                  <p className="font-bold text-lg">
                    ₹{stats?.total_appointments > 0 ? Math.round(analytics.total_revenue / Math.max(stats.total_appointments, 1)).toLocaleString('en-IN') : 0}
                  </p>
                  <p className="text-emerald-200 text-xs">per consultation</p>
                </div>
                <div className="bg-white/15 rounded-xl p-3">
                  <p className="text-emerald-100 text-xs mb-1">Doctor Verification</p>
                  <p className="font-bold text-lg">
                    {stats?.total_doctors > 0 ? `${Math.round((stats.verified_doctors / stats.total_doctors) * 100)}%` : '0%'}
                  </p>
                  <p className="text-emerald-200 text-xs">doctors verified</p>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid md:grid-cols-2 gap-4">
              <WeeklyAppointmentChart data={analytics.weekly_appointments} />
              <AppointmentTypeDonutChart data={analytics.appointment_types} />
            </div>

            {/* Charts Row 2 */}
            <div className="grid md:grid-cols-2 gap-4">
              <MonthlyTrendChart data={analytics.monthly_trends} />
              <RevenueChart data={analytics.monthly_trends} />
            </div>

            {/* Top Specializations */}
            {analytics.top_specializations.length > 0 && (
              <TopSpecializationsChart data={analytics.top_specializations} />
            )}
          </div>
        )}

        {/* Overview Tab */}
        {tab === 'overview' && (
          <>
          <div className="grid md:grid-cols-2 gap-4">
            <PlatformStatsChart stats={stats} />
            <SpecializationPieChart data={
              [...new Set(doctors.map(d => d.specialization))].slice(0, 6).map(spec => ({
                name: spec?.length > 12 ? spec.slice(0, 12) + '...' : spec,
                value: doctors.filter(d => d.specialization === spec).length
              }))
            } />
          </div>
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Platform Summary</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Users</h3>
                <div className="space-y-2">
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                        {u.full_name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                        <p className="text-xs text-gray-400 capitalize">{u.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Top Doctors</h3>
                <div className="space-y-2">
                  {doctors.slice(0, 5).map(d => (
                    <div key={d.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-700">
                        {d.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{d.name}</p>
                        <p className="text-xs text-gray-400">{d.specialization}</p>
                      </div>
                      {d.is_verified && <CheckCircle size={14} className="text-green-500 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
