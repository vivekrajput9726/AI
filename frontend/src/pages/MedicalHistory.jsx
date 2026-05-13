import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Brain, Calendar, FlaskConical, Activity, TrendingUp,
  Heart, Droplets, Weight, Clock, CheckCircle, AlertTriangle,
  FileText, Stethoscope, ChevronRight, Download, Eye,
  BarChart2, Shield, User, Star, Video, Phone, MapPin, Mail,
  ClipboardList, Zap
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, Cell, LineChart, Line
} from 'recharts'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import { formatDate, getStatusColor } from '../utils/helpers'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'overview', label: 'Overview', icon: ClipboardList },
  { id: 'ai', label: 'AI Insights', icon: Brain },
  { id: 'consultations', label: 'Consultations', icon: Calendar },
  { id: 'reports', label: 'Lab Reports', icon: FlaskConical },
  { id: 'tracking', label: 'Health Tracking', icon: TrendingUp },
]

const TYPE_ICONS = {
  video: <Video size={13} />,
  voice: <Phone size={13} />,
  'in-person': <MapPin size={13} />,
  email: <Mail size={13} />,
}

const HEALTH_METRICS = [
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', icon: Heart, color: '#ef4444', bg: 'bg-red-50', normal: '60-100', value: 72 },
  { key: 'bloodPressure', label: 'Blood Pressure', unit: 'mmHg', icon: Activity, color: '#3b82f6', bg: 'bg-blue-50', normal: '90/60-120/80', value: '120/80' },
  { key: 'bloodSugar', label: 'Blood Sugar', unit: 'mg/dL', icon: Droplets, color: '#f97316', bg: 'bg-orange-50', normal: '70-100', value: 98 },
  { key: 'weight', label: 'Weight', unit: 'kg', icon: Weight, color: '#22c55e', bg: 'bg-green-50', normal: 'BMI 18.5-24.9', value: 65 },
  { key: 'spo2', label: 'SpO2', unit: '%', icon: Zap, color: '#8b5cf6', bg: 'bg-purple-50', normal: '95-100', value: 98 },
  { key: 'temperature', label: 'Temperature', unit: '°F', icon: TrendingUp, color: '#14b8a6', bg: 'bg-teal-50', normal: '97-99', value: 98.4 },
]

// Mock trend data (in real app, store these with dates)
const heartRateTrend = [
  { date: 'Jan', value: 78 }, { date: 'Feb', value: 75 },
  { date: 'Mar', value: 80 }, { date: 'Apr', value: 72 },
  { date: 'May', value: 74 }, { date: 'Jun', value: 72 },
]
const sugarTrend = [
  { date: 'Jan', value: 105 }, { date: 'Feb', value: 98 },
  { date: 'Mar', value: 102 }, { date: 'Apr', value: 95 },
  { date: 'May', value: 100 }, { date: 'Jun', value: 98 },
]
const radarData = [
  { subject: 'Heart', score: 85 }, { subject: 'Lungs', score: 90 },
  { subject: 'Liver', score: 78 }, { subject: 'Kidneys', score: 88 },
  { subject: 'Blood', score: 82 }, { subject: 'Immunity', score: 75 },
]

// ── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({ metric }) {
  const Icon = metric.icon
  return (
    <div className={`${metric.bg} rounded-2xl p-4 border border-white`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
          <Icon size={18} style={{ color: metric.color }} />
        </div>
        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Normal</span>
      </div>
      <p className="text-2xl font-extrabold text-gray-900">{metric.value}
        <span className="text-sm font-normal text-gray-400 ml-1">{metric.unit}</span>
      </p>
      <p className="text-xs font-medium text-gray-600 mt-0.5">{metric.label}</p>
      <p className="text-xs text-gray-400 mt-0.5">Normal: {metric.normal}</p>
    </div>
  )
}

// ── Timeline Item ─────────────────────────────────────────────────────────────
function TimelineItem({ icon: Icon, color, title, subtitle, date, badge, badgeColor }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon size={16} className="text-white" />
        </div>
        <div className="w-0.5 bg-gray-100 flex-1 mt-2" />
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400">{date}</p>
            {badge && <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${badgeColor}`}>{badge}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MedicalHistory() {
  const { user } = useSelector(s => s.auth)
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [appointments, setAppointments] = useState([])
  const [healthRecords, setHealthRecords] = useState([])
  const [aiHistory, setAiHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [aptRes, recRes, aiRes] = await Promise.all([
          api.get('/appointments/my'),
          api.get('/health-records/'),
          api.get('/ai/history'),
        ])
        setAppointments(aptRes.data || [])
        setHealthRecords(recRes.data || [])
        setAiHistory(aiRes.data || [])
      } catch {
        toast.error('Failed to load medical history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const labReports = healthRecords.filter(r => r.record_type === 'lab_report')
  const prescriptions = healthRecords.filter(r => r.record_type === 'prescription')
  const completed = appointments.filter(a => a.status === 'completed')
  const aptByMonth = appointments.reduce((acc, a) => {
    const m = a.appointment_date?.slice(0, 7) || 'Unknown'
    acc[m] = (acc[m] || 0) + 1
    return acc
  }, {})
  const aptTrend = Object.entries(aptByMonth).slice(-6).map(([month, count]) => ({
    month: month.slice(5), count
  }))

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                {user?.full_name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-extrabold">{user?.full_name}</h1>
                <p className="text-blue-200 text-sm mt-0.5">Digital Medical History</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-blue-200">
                  <span className="flex items-center gap-1"><Calendar size={11} /> Member since 2024</span>
                  <span className="flex items-center gap-1"><Shield size={11} /> Verified Patient</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Consultations', value: completed.length },
                { label: 'Lab Reports', value: labReports.length },
                { label: 'AI Analyses', value: aiHistory.length },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/15 rounded-xl px-4 py-2">
                  <p className="text-xl font-extrabold">{value}</p>
                  <p className="text-blue-200 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-1 justify-center
                ${tab === id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ══ OVERVIEW ══════════════════════════════════════════════════ */}
            {tab === 'overview' && (
              <div className="grid lg:grid-cols-3 gap-5">
                {/* Timeline */}
                <div className="lg:col-span-2 card">
                  <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <Clock size={16} className="text-blue-500" /> Activity Timeline
                  </h2>
                  <div className="space-y-0">
                    {appointments.slice(0, 5).map(apt => (
                      <TimelineItem key={apt.id}
                        icon={Calendar} color="bg-blue-500"
                        title={`Consultation with ${apt.doctor_name}`}
                        subtitle={`${apt.appointment_type} · ${apt.appointment_time}`}
                        date={formatDate(apt.appointment_date)}
                        badge={apt.status} badgeColor={getStatusColor(apt.status)}
                      />
                    ))}
                    {aiHistory.slice(0, 3).map((a, i) => (
                      <TimelineItem key={i}
                        icon={Brain} color="bg-purple-500"
                        title="AI Symptom Analysis"
                        subtitle={a.symptoms?.slice(0, 50) + '...'}
                        date={formatDate(a.created_at)}
                        badge="AI Analysis" badgeColor="bg-purple-100 text-purple-700"
                      />
                    ))}
                    {labReports.slice(0, 3).map(r => (
                      <TimelineItem key={r.id}
                        icon={FlaskConical} color="bg-teal-500"
                        title={r.title}
                        subtitle={r.description?.slice(0, 60) || 'Lab Report'}
                        date={r.date}
                        badge="Lab Report" badgeColor="bg-teal-100 text-teal-700"
                      />
                    ))}
                    {appointments.length === 0 && aiHistory.length === 0 && labReports.length === 0 && (
                      <div className="text-center py-10 text-gray-400">
                        <ClipboardList size={36} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No medical history yet</p>
                        <button onClick={() => navigate('/patient/symptoms')} className="mt-3 text-blue-600 text-sm font-medium hover:underline">Start AI Symptom Check</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="space-y-4">
                  {[
                    { icon: Calendar, color: 'bg-blue-500', label: 'Total Appointments', value: appointments.length, sub: `${completed.length} completed`, onClick: () => setTab('consultations') },
                    { icon: Brain, color: 'bg-purple-500', label: 'AI Analyses Done', value: aiHistory.length, sub: 'Symptom checks', onClick: () => setTab('ai') },
                    { icon: FlaskConical, color: 'bg-teal-500', label: 'Lab Reports', value: labReports.length, sub: `${prescriptions.length} prescriptions`, onClick: () => setTab('reports') },
                    { icon: FileText, color: 'bg-green-500', label: 'Prescriptions', value: prescriptions.length, sub: 'Saved by doctors', onClick: () => setTab('reports') },
                  ].map(({ icon: Icon, color, label, value, sub, onClick }) => (
                    <button key={label} onClick={onClick} className="w-full card flex items-center gap-4 hover:shadow-md transition-all text-left">
                      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon size={19} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="text-xl font-extrabold text-gray-900">{value}</p>
                        <p className="text-xs text-gray-400">{sub}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ══ AI INSIGHTS ═══════════════════════════════════════════════ */}
            {tab === 'ai' && (
              <div className="space-y-4">
                {aiHistory.length === 0 ? (
                  <div className="card text-center py-14">
                    <Brain size={40} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-500 font-medium">No AI analyses yet</p>
                    <button onClick={() => navigate('/patient/symptoms')} className="mt-4 btn-primary text-sm">
                      Start Symptom Check
                    </button>
                  </div>
                ) : aiHistory.map((report, idx) => (
                  <div key={idx} className="card space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Brain size={18} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">AI Symptom Analysis #{aiHistory.length - idx}</p>
                          <p className="text-xs text-gray-400">{formatDate(report.created_at)}</p>
                        </div>
                      </div>
                      {report.ai_analysis?.severity_level && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          report.ai_analysis.severity_level === 'Emergency' ? 'bg-red-100 text-red-700' :
                          report.ai_analysis.severity_level === 'Severe' ? 'bg-orange-100 text-orange-700' :
                          report.ai_analysis.severity_level === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>{report.ai_analysis.severity_level}</span>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 font-medium mb-1">Symptoms described</p>
                      <p className="text-sm text-gray-700">{report.symptoms}</p>
                    </div>

                    {report.ai_analysis?.brief_assessment && (
                      <p className="text-sm text-gray-600 leading-relaxed">{report.ai_analysis.brief_assessment}</p>
                    )}

                    {/* Conditions */}
                    {report.ai_analysis?.possible_conditions?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Possible Conditions</p>
                        <div className="flex flex-wrap gap-2">
                          {report.ai_analysis.possible_conditions.map((c, i) => (
                            <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              c.probability === 'High' ? 'bg-red-100 text-red-700' :
                              c.probability === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>{c.name} ({c.probability})</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SHAP Insights */}
                    {report.ai_analysis?.shap_insights?.length > 0 && (
                      <div className="bg-purple-50 rounded-xl p-4">
                        <p className="text-xs font-bold text-purple-700 mb-3 flex items-center gap-1.5">
                          <BarChart2 size={13} /> SHAP Explainability — Symptom Contributions
                        </p>
                        <div className="space-y-2">
                          {report.ai_analysis.shap_insights.map((s, i) => (
                            <div key={i}>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="font-medium text-gray-700 capitalize">{s.symptom}</span>
                                <span className="text-gray-500">{s.importance}%</span>
                              </div>
                              <div className="w-full bg-purple-100 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
                                  style={{ width: `${s.importance}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Stethoscope size={13} className="text-blue-500" />
                        <span>Recommended: <strong>{report.ai_analysis?.specialist_type}</strong></span>
                      </div>
                      {report.ai_analysis?.confidence_score && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                          Confidence: {report.ai_analysis.confidence_score}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ══ CONSULTATIONS ═════════════════════════════════════════════ */}
            {tab === 'consultations' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total', value: appointments.length, color: 'bg-blue-600' },
                    { label: 'Completed', value: completed.length, color: 'bg-green-600' },
                    { label: 'Pending', value: appointments.filter(a => a.status === 'pending').length, color: 'bg-yellow-500' },
                    { label: 'Cancelled', value: appointments.filter(a => a.status === 'cancelled').length, color: 'bg-red-500' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="card text-center py-4">
                      <p className={`text-2xl font-extrabold ${color.replace('bg-', 'text-')}`}>{value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {aptTrend.length > 0 && (
                  <div className="card">
                    <h3 className="font-bold text-gray-900 mb-4">Appointment Trends</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={aptTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {appointments.length === 0 ? (
                  <div className="card text-center py-14">
                    <Calendar size={40} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-500">No consultations yet</p>
                    <button onClick={() => navigate('/patient/doctors')} className="mt-4 btn-primary text-sm">Book a Consultation</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map(apt => (
                      <div key={apt.id} className="card flex items-start gap-4">
                        <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-lg">
                          {apt.doctor_name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{apt.doctor_name}</p>
                              <p className="text-xs text-gray-400">{formatDate(apt.appointment_date)} · {apt.appointment_time}</p>
                            </div>
                            <span className={`${getStatusColor(apt.status)} capitalize text-xs flex-shrink-0`}>{apt.status}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              {TYPE_ICONS[apt.appointment_type]} {apt.appointment_type}
                            </span>
                            <span className="text-xs text-gray-400">₹{apt.consultation_fee}</span>
                          </div>
                          {apt.symptoms && <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">Symptoms: {apt.symptoms}</p>}
                          {apt.prescription && (
                            <div className="mt-2 bg-green-50 rounded-lg px-3 py-2">
                              <p className="text-xs font-semibold text-green-700 mb-0.5">Prescription</p>
                              <p className="text-xs text-green-600 line-clamp-2">{apt.prescription}</p>
                            </div>
                          )}
                          {apt.rating && (
                            <div className="flex items-center gap-1 mt-2">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={11} className={s <= apt.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                              ))}
                              <span className="text-xs text-gray-400 ml-1">Your rating</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ LAB REPORTS ═══════════════════════════════════════════════ */}
            {tab === 'reports' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Lab Reports', value: labReports.length, color: 'text-teal-600', icon: FlaskConical },
                    { label: 'Prescriptions', value: prescriptions.length, color: 'text-blue-600', icon: FileText },
                    { label: 'All Records', value: healthRecords.length, color: 'text-purple-600', icon: ClipboardList },
                  ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className="card text-center py-4">
                      <Icon size={20} className={`mx-auto mb-1 ${color}`} />
                      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                      <p className="text-xs text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>

                {healthRecords.length === 0 ? (
                  <div className="card text-center py-14">
                    <FlaskConical size={40} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-500">No lab reports yet</p>
                    <button onClick={() => navigate('/patient/laboratory')} className="mt-4 btn-primary text-sm">Upload Lab Report</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {healthRecords.map(record => (
                      <div key={record.id} className="card flex items-start gap-4">
                        <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                          {record.record_type === 'lab_report' ? '🧪' :
                           record.record_type === 'prescription' ? '💊' :
                           record.record_type === 'diagnosis' ? '🩺' : '📋'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-gray-900 text-sm">{record.title}</p>
                            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0">
                              {record.record_type?.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{record.date}</p>
                          {record.doctor_name && <p className="text-xs text-gray-500 mt-0.5">Dr. {record.doctor_name}</p>}
                          {record.description && <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{record.description}</p>}
                          {record.file_data && (
                            <a href={record.file_data} target="_blank" rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline">
                              <Eye size={12} /> View Report
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ HEALTH TRACKING ═══════════════════════════════════════════ */}
            {tab === 'tracking' && (
              <div className="space-y-5">
                {/* Current Metrics */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Current Health Metrics</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {HEALTH_METRICS.map(m => <MetricCard key={m.key} metric={m} />)}
                  </div>
                </div>

                {/* Charts */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="card">
                    <h3 className="font-bold text-gray-900 mb-1">Heart Rate Trend</h3>
                    <p className="text-xs text-gray-400 mb-4">Last 6 months (bpm)</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={heartRateTrend}>
                        <defs>
                          <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} domain={[60, 100]} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} fill="url(#hrGrad)" name="Heart Rate" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card">
                    <h3 className="font-bold text-gray-900 mb-1">Blood Sugar Trend</h3>
                    <p className="text-xs text-gray-400 mb-4">Last 6 months (mg/dL)</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={sugarTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} domain={[80, 120]} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                        <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={{ r: 4, fill: '#f97316' }} name="Blood Sugar" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Organ Health Radar */}
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-1">Overall Health Score</h3>
                  <p className="text-xs text-gray-400 mb-4">AI-estimated organ health based on your reports</p>
                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                        <Radar name="Health" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {radarData.map(({ subject, score }) => (
                        <div key={subject}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">{subject} Health</span>
                            <span className={`font-bold ${score >= 85 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{score}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className={`h-2 rounded-full ${score >= 85 ? 'bg-green-500' : score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${score}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">Health tracking metrics are estimates based on your uploaded reports and AI analysis. Always consult your doctor for accurate measurements.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
