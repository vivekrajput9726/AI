import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen, Plus, Trash2, Download, X, Upload,
  ClipboardList, Brain, Calendar, FlaskConical,
  FileText, Clock, CheckCircle, AlertTriangle,
  Stethoscope, ChevronRight, Eye, Star,
  Video, Phone, MapPin, Mail, BarChart2, Shield,
  TrendingUp, Heart, Droplets, Weight, Zap
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, LineChart, Line
} from 'recharts'
import DashboardLayout from '../layouts/DashboardLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import api from '../services/api'
import { formatDate, getStatusColor } from '../utils/helpers'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────
const RECORD_TYPES = [
  { value: 'prescription', label: 'Prescription', icon: '💊', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { value: 'lab_report',   label: 'Lab Report',   icon: '🧪', color: 'bg-green-50 text-green-700 border-green-100' },
  { value: 'diagnosis',    label: 'Diagnosis',    icon: '🩺', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  { value: 'other',        label: 'Other',        icon: '📁', color: 'bg-gray-50 text-gray-700 border-gray-100' },
]

const TABS = [
  { id: 'records',   label: 'Health Records',  icon: FolderOpen },
  { id: 'history',   label: 'Medical History', icon: ClipboardList },
  { id: 'ai',        label: 'AI Insights',     icon: Brain },
  { id: 'tracking',  label: 'Health Tracking', icon: TrendingUp },
]

const TYPE_ICONS = {
  video: <Video size={12} />, voice: <Phone size={12} />,
  'in-person': <MapPin size={12} />, email: <Mail size={12} />,
}

const HEALTH_METRICS = [
  { label: 'Heart Rate',      unit: 'bpm',   icon: Heart,      color: '#ef4444', bg: 'bg-red-50',    normal: '60–100',      value: 72 },
  { label: 'Blood Pressure',  unit: 'mmHg',  icon: TrendingUp, color: '#3b82f6', bg: 'bg-blue-50',   normal: '90/60–120/80', value: '120/80' },
  { label: 'Blood Sugar',     unit: 'mg/dL', icon: Droplets,   color: '#f97316', bg: 'bg-orange-50', normal: '70–100',      value: 98 },
  { label: 'Weight',          unit: 'kg',    icon: Weight,     color: '#22c55e', bg: 'bg-green-50',  normal: 'BMI 18.5–24.9', value: 65 },
]

const heartTrend  = [{ m:'Jan',v:78},{ m:'Feb',v:75},{ m:'Mar',v:80},{ m:'Apr',v:72},{ m:'May',v:74},{ m:'Jun',v:72}]
const sugarTrend  = [{ m:'Jan',v:105},{ m:'Feb',v:98},{ m:'Mar',v:102},{ m:'Apr',v:95},{ m:'May',v:100},{ m:'Jun',v:98}]
const radarData   = [
  {s:'Heart',v:85},{s:'Lungs',v:90},{s:'Liver',v:78},{s:'Kidneys',v:88},{s:'Blood',v:82},{s:'Immunity',v:75}
]

// ─── Timeline Item ─────────────────────────────────────────────────────────────
function TItem({ icon: Icon, bg, title, sub, date, badge, badgeColor }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon size={14} className="text-white" />
        </div>
        <div className="w-0.5 bg-gray-100 flex-1 mt-2" />
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
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

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MCard({ m }) {
  const Icon = m.icon
  return (
    <div className={`${m.bg} rounded-2xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
          <Icon size={16} style={{ color: m.color }} />
        </div>
        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Normal</span>
      </div>
      <p className="text-xl font-extrabold text-gray-900">{m.value} <span className="text-xs font-normal text-gray-400">{m.unit}</span></p>
      <p className="text-xs font-medium text-gray-600">{m.label}</p>
      <p className="text-xs text-gray-400">Normal: {m.normal}</p>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MyRecords() {
  const { user } = useSelector(s => s.auth)
  const navigate = useNavigate()
  const [tab, setTab] = useState('records')

  // Health Records state
  const [records, setRecords] = useState([])
  const [recLoading, setRecLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title:'', record_type:'prescription', description:'', doctor_name:'', date:'', file_data:'' })
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  // History state
  const [appointments, setAppointments] = useState([])
  const [aiHistory, setAiHistory] = useState([])
  const [histLoading, setHistLoading] = useState(true)

  useEffect(() => {
    api.get('/health-records/').then(r => setRecords(r.data)).catch(() => toast.error('Failed to load records')).finally(() => setRecLoading(false))
    Promise.all([api.get('/appointments/my'), api.get('/ai/history')])
      .then(([a, ai]) => { setAppointments(a.data || []); setAiHistory(ai.data || []) })
      .catch(() => {})
      .finally(() => setHistLoading(false))
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 5*1024*1024) { toast.error('File must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = () => setForm(f => ({ ...f, file_data: reader.result }))
    reader.readAsDataURL(file)
  }
  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Please enter a title'); return }
    setSaving(true)
    try {
      const res = await api.post('/health-records/', form)
      setRecords(p => [res.data, ...p])
      setShowModal(false)
      setForm({ title:'', record_type:'prescription', description:'', doctor_name:'', date:'', file_data:'' })
      toast.success('Record saved!')
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }
  const handleDelete = async (id) => {
    try { await api.delete(`/health-records/${id}`); setRecords(p => p.filter(r => r.id !== id)); toast.success('Deleted') }
    catch { toast.error('Failed to delete') }
  }

  const filtered = filter === 'all' ? records : records.filter(r => r.record_type === filter)
  const getType  = t => RECORD_TYPES.find(x => x.value === t) || RECORD_TYPES[3]
  const labReports    = records.filter(r => r.record_type === 'lab_report')
  const prescriptions = records.filter(r => r.record_type === 'prescription')
  const completed     = appointments.filter(a => a.status === 'completed')

  const aptByMonth = appointments.reduce((acc, a) => {
    const m = a.appointment_date?.slice(5,7) || '??'; acc[m] = (acc[m]||0)+1; return acc
  }, {})
  const aptTrend = Object.entries(aptByMonth).slice(-6).map(([m,c]) => ({ month: m, count: c }))

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl">
                {user?.full_name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-lg font-extrabold">My Records</h1>
                <p className="text-blue-200 text-xs mt-0.5">Health Records · Medical History · AI Insights · Tracking</p>
              </div>
            </div>
            <div className="hidden sm:flex gap-3">
              {[
                { label: 'Records', value: records.length },
                { label: 'Consultations', value: completed.length },
                { label: 'AI Analyses', value: aiHistory.length },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/15 rounded-xl px-3 py-2 text-center">
                  <p className="text-lg font-extrabold">{value}</p>
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

        {/* ════════════════════════════════════════════════════════
            TAB 1 — HEALTH RECORDS
        ════════════════════════════════════════════════════════ */}
        {tab === 'records' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{records.length} total records</p>
              <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={15} /> Add Record
              </button>
            </div>

            {/* Filter chips */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filter==='all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                All ({records.length})
              </button>
              {RECORD_TYPES.map(t => (
                <button key={t.value} onClick={() => setFilter(t.value)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filter===t.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {t.icon} {t.label} ({records.filter(r=>r.record_type===t.value).length})
                </button>
              ))}
            </div>

            {recLoading ? <div className="py-12 flex justify-center"><LoadingSpinner text="Loading..." /></div>
            : filtered.length === 0 ? (
              <div className="card text-center py-14">
                <FolderOpen size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-500 font-medium">No records found</p>
                <button onClick={() => setShowModal(true)} className="mt-4 btn-primary text-sm inline-flex items-center gap-2"><Plus size={14}/> Add Record</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(record => {
                  const type = getType(record.record_type)
                  return (
                    <div key={record.id} className={`border rounded-2xl p-4 hover:shadow-md transition-all ${type.color}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{type.icon}</span>
                          <span className="text-xs font-semibold capitalize">{type.label}</span>
                        </div>
                        <button onClick={() => handleDelete(record.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm mb-1">{record.title}</h3>
                      {record.doctor_name && <p className="text-xs text-gray-500">Dr. {record.doctor_name}</p>}
                      {record.date && <p className="text-xs text-gray-400">{record.date}</p>}
                      {record.description && <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{record.description}</p>}
                      {record.file_data && (
                        <a href={record.file_data} download={record.title} className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
                          <Download size={11} /> Download
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB 2 — MEDICAL HISTORY
        ════════════════════════════════════════════════════════ */}
        {tab === 'history' && (
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Timeline */}
            <div className="lg:col-span-2 card">
              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><Clock size={15} className="text-blue-500"/> Activity Timeline</h2>
              {histLoading ? <div className="py-8 flex justify-center"><LoadingSpinner/></div> : (
                <div>
                  {appointments.slice(0,5).map(apt => (
                    <TItem key={apt.id} icon={Calendar} bg="bg-blue-500"
                      title={`Consultation — ${apt.doctor_name}`}
                      sub={`${apt.appointment_type} · ${apt.appointment_time}`}
                      date={formatDate(apt.appointment_date)}
                      badge={apt.status} badgeColor={getStatusColor(apt.status)} />
                  ))}
                  {aiHistory.slice(0,3).map((a,i) => (
                    <TItem key={i} icon={Brain} bg="bg-purple-500"
                      title="AI Symptom Analysis"
                      sub={a.symptoms?.slice(0,55)+'...'}
                      date={formatDate(a.created_at)}
                      badge="AI Analysis" badgeColor="bg-purple-100 text-purple-700" />
                  ))}
                  {labReports.slice(0,3).map(r => (
                    <TItem key={r.id} icon={FlaskConical} bg="bg-teal-500"
                      title={r.title} sub={r.description?.slice(0,50)||'Lab Report'}
                      date={r.date} badge="Lab Report" badgeColor="bg-teal-100 text-teal-700" />
                  ))}
                  {appointments.length===0 && aiHistory.length===0 && labReports.length===0 && (
                    <div className="text-center py-10 text-gray-400">
                      <ClipboardList size={36} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No history yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="space-y-3">
              {[
                { icon: Calendar,    bg:'bg-blue-500',   label:'Total Appointments', value:appointments.length,  sub:`${completed.length} completed` },
                { icon: Brain,       bg:'bg-purple-500', label:'AI Analyses',        value:aiHistory.length,      sub:'Symptom checks' },
                { icon: FlaskConical,bg:'bg-teal-500',   label:'Lab Reports',        value:labReports.length,     sub:`${prescriptions.length} prescriptions` },
                { icon: FileText,    bg:'bg-green-500',  label:'Prescriptions',      value:prescriptions.length,  sub:'Saved by doctors' },
              ].map(({ icon:Icon, bg, label, value, sub }) => (
                <div key={label} className="card flex items-center gap-3 py-3">
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}><Icon size={17} className="text-white"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-xl font-extrabold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB 3 — AI INSIGHTS
        ════════════════════════════════════════════════════════ */}
        {tab === 'ai' && (
          <div className="space-y-4">
            {histLoading ? <div className="py-12 flex justify-center"><LoadingSpinner/></div>
            : aiHistory.length === 0 ? (
              <div className="card text-center py-14">
                <Brain size={40} className="mx-auto text-gray-200 mb-3"/>
                <p className="text-gray-500 font-medium">No AI analyses yet</p>
                <button onClick={() => navigate('/patient/symptoms')} className="mt-4 btn-primary text-sm">Start Symptom Check</button>
              </div>
            ) : aiHistory.map((report, idx) => (
              <div key={idx} className="card space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Brain size={16} className="text-purple-600"/>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">AI Analysis #{aiHistory.length - idx}</p>
                      <p className="text-xs text-gray-400">{formatDate(report.created_at)}</p>
                    </div>
                  </div>
                  {report.ai_analysis?.severity_level && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      report.ai_analysis.severity_level === 'Emergency' ? 'bg-red-100 text-red-700' :
                      report.ai_analysis.severity_level === 'Severe' ? 'bg-orange-100 text-orange-700' :
                      report.ai_analysis.severity_level === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'}`}>{report.ai_analysis.severity_level}</span>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium mb-1">Symptoms</p>
                  <p className="text-sm text-gray-700">{report.symptoms}</p>
                </div>

                {report.ai_analysis?.brief_assessment && (
                  <p className="text-sm text-gray-600 leading-relaxed">{report.ai_analysis.brief_assessment}</p>
                )}

                {report.ai_analysis?.possible_conditions?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {report.ai_analysis.possible_conditions.map((c,i) => (
                      <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        c.probability==='High'?'bg-red-100 text-red-700':c.probability==='Medium'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'
                      }`}>{c.name} ({c.probability})</span>
                    ))}
                  </div>
                )}

                {report.ai_analysis?.shap_insights?.length > 0 && (
                  <div className="bg-purple-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-1"><BarChart2 size={12}/> SHAP Explainability</p>
                    <div className="space-y-1.5">
                      {report.ai_analysis.shap_insights.map((s,i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="font-medium text-gray-700 capitalize">{s.symptom}</span>
                            <span className="text-gray-500">{s.importance}%</span>
                          </div>
                          <div className="w-full bg-purple-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-purple-600" style={{width:`${s.importance}%`}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1"><Stethoscope size={12} className="text-blue-500"/> <strong>{report.ai_analysis?.specialist_type}</strong></span>
                  {report.ai_analysis?.confidence_score && (
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Confidence: {report.ai_analysis.confidence_score}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB 4 — HEALTH TRACKING
        ════════════════════════════════════════════════════════ */}
        {tab === 'tracking' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {HEALTH_METRICS.map(m => <MCard key={m.label} m={m}/>)}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-1">Heart Rate Trend</h3>
                <p className="text-xs text-gray-400 mb-3">Last 6 months (bpm)</p>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={heartTrend}>
                    <defs>
                      <linearGradient id="hr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="m" tick={{fontSize:11}}/>
                    <YAxis tick={{fontSize:11}} domain={[60,100]}/>
                    <Tooltip contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
                    <Area type="monotone" dataKey="v" stroke="#ef4444" strokeWidth={2} fill="url(#hr)" name="bpm"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h3 className="font-bold text-gray-900 mb-1">Blood Sugar Trend</h3>
                <p className="text-xs text-gray-400 mb-3">Last 6 months (mg/dL)</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={sugarTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="m" tick={{fontSize:11}}/>
                    <YAxis tick={{fontSize:11}} domain={[80,120]}/>
                    <Tooltip contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
                    <Line type="monotone" dataKey="v" stroke="#f97316" strokeWidth={2} dot={{r:3,fill:'#f97316'}} name="mg/dL"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 className="font-bold text-gray-900 mb-1">Organ Health Score</h3>
              <p className="text-xs text-gray-400 mb-4">AI-estimated based on your reports</p>
              <div className="grid md:grid-cols-2 gap-5 items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb"/>
                    <PolarAngleAxis dataKey="s" tick={{fontSize:12}}/>
                    <Radar dataKey="v" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Health"/>
                    <Tooltip contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
                  </RadarChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {radarData.map(({s,v}) => (
                    <div key={s}>
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="font-medium text-gray-700">{s}</span>
                        <span className={`font-bold ${v>=85?'text-green-600':v>=70?'text-yellow-600':'text-red-600'}`}>{v}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${v>=85?'bg-green-500':v>=70?'bg-yellow-500':'bg-red-500'}`} style={{width:`${v}%`}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0"/>
              <p className="text-xs text-amber-700">Tracking metrics are estimates based on uploaded reports. Always consult your doctor for accurate readings.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Record Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">Add Health Record</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Record Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {RECORD_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => setForm(f => ({...f,record_type:t.value}))}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center gap-2 ${form.record_type===t.value?'border-blue-500 bg-blue-50 text-blue-700':'border-gray-200 hover:border-blue-300'}`}>
                      <span>{t.icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Title *</label>
                <input type="text" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Blood Test Report" className="input-field"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Doctor Name</label>
                  <input type="text" value={form.doctor_name} onChange={e=>setForm(f=>({...f,doctor_name:e.target.value}))} placeholder="Dr. Name" className="input-field"/>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="input-field"/>
                </div>
              </div>
              <div>
                <label className="label">Notes / Description</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Any additional notes..." className="input-field h-20 resize-none"/>
              </div>
              <div>
                <label className="label">Upload File (optional)</label>
                <button type="button" onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-500 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                  <Upload size={15}/> {form.file_data ? '✅ File selected' : 'Click to upload (PDF, Image — max 5MB)'}
                </button>
                <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} className="hidden"/>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <LoadingSpinner size="sm"/> : <><Plus size={14}/> Save Record</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
