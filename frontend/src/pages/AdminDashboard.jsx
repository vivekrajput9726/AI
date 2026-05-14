import { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Users, Stethoscope, Calendar, CheckCircle, Shield, XCircle,
  TrendingUp, IndianRupee, BarChart2, Bot, ArrowUpRight,
  Bell, Settings, LogOut, Activity, FileText, AlertTriangle,
  Database, Server, HardDrive, Cloud, TicketCheck, Plus,
  Search, Menu, X, ChevronRight, Clock, Mail, Zap,
  UserCheck, RefreshCw, Eye, Edit2, Trash2, Lock,
  LayoutDashboard, Users2, Microscope, FlaskConical,
  DollarSign, AlertCircle, MessageSquare, List, ToggleLeft, ToggleRight
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import api from '../services/api'
import { formatDate, getInitials } from '../utils/helpers'
import toast from 'react-hot-toast'
import { logout } from '../redux/slices/authSlice'

// ── Stat Card ─────────────────────────────────────
function StatCard({ icon, label, value, growth, color, bg }) {
  const isPositive = parseFloat(growth) >= 0
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>{icon}</div>
        <span className={`text-xs font-bold flex items-center gap-0.5 ${isPositive?'text-green-600':'text-red-500'}`}>
          <ArrowUpRight size={12}/>{growth}
        </span>
      </div>
      <p className={`text-2xl font-extrabold ${color} mt-1`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      <p className="text-xs text-gray-300 mt-0.5">vs last month</p>
    </div>
  )
}

// ── Status Badge ───────────────────────────────────
function Badge({ status }) {
  const s = {
    pending:    'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed:  'bg-green-100 text-green-700 border-green-200',
    completed:  'bg-blue-100 text-blue-700 border-blue-200',
    cancelled:  'bg-red-100 text-red-700 border-red-200',
    verified:   'bg-green-100 text-green-700 border-green-200',
    rejected:   'bg-red-100 text-red-700 border-red-200',
    active:     'bg-green-100 text-green-700 border-green-200',
    inactive:   'bg-gray-100 text-gray-600 border-gray-200',
    open:       'bg-red-100 text-red-700 border-red-200',
    'in progress': 'bg-orange-100 text-orange-700 border-orange-200',
    resolved:   'bg-green-100 text-green-700 border-green-200',
    closed:     'bg-gray-100 text-gray-600 border-gray-200',
  }
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${s[status?.toLowerCase()]||s.pending}`}>{status}</span>
}

// ── Mini Line Chart (SVG) ──────────────────────────
function MiniChart({ data, color = '#0d9488' }) {
  if (!data?.length) return null
  const max = Math.max(...data), min = Math.min(...data)
  const w = 100, h = 32
  const pts = data.map((v,i) => {
    const x = (i/(data.length-1))*w
    const y = h - ((v-min)/(max-min||1))*(h-4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{height:32}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Main Admin Dashboard ───────────────────────────
export default function AdminDashboard() {
  const { user }   = useSelector(s => s.auth)
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats,   setStats]   = useState(null)
  const [users,   setUsers]   = useState([])
  const [doctors, setDoctors] = useState([])
  const [apts,    setApts]    = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const now     = new Date()
  const dateStr = now.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric',weekday:'long'})

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [sRes, uRes, dRes, aRes] = await Promise.all([
        api.get('/admin/stats').catch(()=>({data:{}})),
        api.get('/admin/users').catch(()=>({data:{users:[]}})),
        api.get('/admin/doctors').catch(()=>({data:{doctors:[]}})),
        api.get('/appointments/my').catch(()=>({data:[]})),
      ])
      setStats(sRes.data)
      setUsers(uRes.data.users||[])
      setDoctors(dRes.data.doctors||[])
      setApts(Array.isArray(aRes.data)?aRes.data:[])
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  const toggleUser = async (id, active) => {
    try {
      await api.patch(`/admin/users/${id}`, { is_active: !active })
      toast.success('User status updated!')
      loadData()
    } catch { toast.error('Failed to update') }
  }

  const verifyDoctor = async (id, status) => {
    try {
      await api.patch(`/admin/doctors/${id}/verify`, { is_verified: status })
      toast.success(`Doctor ${status?'verified':'rejected'}!`)
      loadData()
    } catch { toast.error('Failed to update') }
  }

  const totalUsers  = stats?.total_users  || users.length || 12458
  const totalDocs   = stats?.total_doctors|| doctors.length || 568
  const totalApts   = stats?.total_appointments || apts.length || 2854
  const revenue     = stats?.total_revenue || 845230
  const patients    = users.filter(u=>u.role==='patient').length || 10243
  const pendingApts = apts.filter(a=>a.status==='pending').length
  const confirmedApts= apts.filter(a=>a.status==='confirmed').length
  const completedApts= apts.filter(a=>a.status==='completed').length
  const cancelledApts= apts.filter(a=>a.status==='cancelled').length

  const recentApts  = apts.slice(0,4)
  const pendingDocs = doctors.filter(d=>!d.is_verified && !d.is_static).slice(0,4)
  const verifiedDocs= doctors.filter(d=>d.is_verified).slice(0,4)

  // Sidebar links
  const LINKS = [
    { tab:'dashboard',    icon:<LayoutDashboard size={17}/>, label:'Dashboard' },
    { tab:'users',        icon:<Users2 size={17}/>,          label:'Users & Doctors' },
    { tab:'appointments', icon:<Calendar size={17}/>,        label:'Appointments' },
    { tab:'doctors',      icon:<Stethoscope size={17}/>,     label:'Doctors Management' },
    { tab:'ai-analytics', icon:<FlaskConical size={17}/>,    label:'AI Lab Analytics' },
    { tab:'reports',      icon:<FileText size={17}/>,        label:'Reports & Monitoring' },
    { tab:'emergency',    icon:<AlertTriangle size={17}/>,   label:'Emergency Alerts',  highlight:true },
    { tab:'finance',      icon:<DollarSign size={17}/>,      label:'Finance & Billing' },
    { tab:'system',       icon:<Server size={17}/>,          label:'System Management' },
    { tab:'notifications',icon:<Bell size={17}/>,            label:'Notifications' },
    { tab:'activity',     icon:<List size={17}/>,            label:'Activity Log' },
    { tab:'tickets',      icon:<TicketCheck size={17}/>,     label:'Support Tickets' },
    { tab:'settings',     icon:<Settings size={17}/>,        label:'Settings' },
  ]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Admin Sidebar ── */}
      <aside className={`bg-[#1a2744] flex-shrink-0 flex flex-col z-40 transition-all duration-300 ${sidebarOpen?'w-60':'w-0 overflow-hidden'} lg:w-60`}>
        {/* Logo */}
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Shield size={17} className="text-white"/>
            </div>
            <div>
              <p className="font-extrabold text-white text-sm">Synora <span className="text-teal-400">Health</span></p>
              <p className="text-gray-400 text-xs">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Admin Profile */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {user?.profile_image
              ? <img src={user.profile_image} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-teal-400"/>
              : <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-base border-2 border-teal-400">
                  {getInitials(user?.full_name||'Admin')}
                </div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{user?.full_name||'Admin User'}</p>
              <p className="text-teal-400 text-xs">Super Admin</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/>
                <span className="text-green-400 text-xs">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          {LINKS.map(l=>(
            <button key={l.tab} onClick={()=>setActiveTab(l.tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab===l.tab
                  ? 'bg-teal-600 text-white shadow-md'
                  : l.highlight
                    ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                    : 'text-gray-400 hover:bg-white/8 hover:text-white'
              }`}>
              {l.icon}
              <span className="flex-1 text-left">{l.label}</span>
              {activeTab===l.tab && <ChevronRight size={13} className="text-white/50"/>}
            </button>
          ))}
        </nav>

        {/* Security Badge */}
        <div className="mx-3 mb-4 p-3 bg-gradient-to-br from-teal-900/50 to-blue-900/50 rounded-2xl border border-teal-800/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-teal-600/30 rounded-xl flex items-center justify-center"><Shield size={16} className="text-teal-400"/></div>
            <p className="text-white text-xs font-bold">Secure Healthcare</p>
          </div>
          <p className="text-gray-400 text-xs leading-tight">All systems are secure and monitored 24/7</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
            <span className="text-green-400 text-xs font-semibold">All Systems Operational</span>
          </div>
        </div>

        {/* Logout */}
        <div className="px-3 pb-4">
          <button onClick={()=>{dispatch(logout());navigate('/')}}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all">
            <LogOut size={16}/> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-100 flex items-center gap-4 px-5 h-14 flex-shrink-0">
          <button onClick={()=>setSidebarOpen(s=>!s)} className="p-2 hover:bg-gray-100 rounded-xl lg:hidden"><Menu size={18}/></button>
          <div className="flex-1 relative max-w-lg">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input placeholder="Search anything..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"/>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2.5 hover:bg-gray-100 rounded-xl">
              <Bell size={18} className="text-gray-500"/>
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
            </button>
            <button className="p-2.5 hover:bg-gray-100 rounded-xl"><Settings size={18} className="text-gray-500"/></button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-5">

          {loading ? (
            <div className="flex items-center justify-center h-64"><LoadingSpinner/></div>
          ) : (

          <div className="space-y-5">

            {/* ══ DASHBOARD TAB ══ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-extrabold text-gray-900">Dashboard Overview</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Welcome back, Admin! Here's what's happening on Synora Health.</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
                    <span>{dateStr}</span>
                    <Calendar size={16} className="text-teal-600"/>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                  <StatCard icon={<Users size={18} className="text-blue-600"/>}    label="Total Users"           value={totalUsers.toLocaleString('en-IN')}    growth="18.6%" color="text-blue-700"   bg="bg-blue-50"/>
                  <StatCard icon={<Stethoscope size={18} className="text-teal-600"/>} label="Total Doctors"      value={totalDocs.toLocaleString('en-IN')}    growth="12.4%" color="text-teal-700"   bg="bg-teal-50"/>
                  <StatCard icon={<Calendar size={18} className="text-orange-600"/>}  label="Appointments"       value={totalApts.toLocaleString('en-IN')}    growth="15.3%" color="text-orange-700" bg="bg-orange-50"/>
                  <StatCard icon={<IndianRupee size={18} className="text-green-600"/>}label="Revenue This Month" value={`₹${(revenue/100000).toFixed(2)}L`}  growth="26.4%" color="text-green-700"  bg="bg-green-50"/>
                  <StatCard icon={<Activity size={18} className="text-purple-600"/>}  label="Active Consultations"value="156"                                growth="11.2%" color="text-purple-700" bg="bg-purple-50"/>
                  <StatCard icon={<Bot size={18} className="text-indigo-600"/>}       label="AI Analyses"        value="1,850"                               growth="19.8%" color="text-indigo-700" bg="bg-indigo-50"/>
                </div>

                {/* Row 2 — Charts + Status */}
                <div className="grid lg:grid-cols-4 gap-4">
                  {/* Appointments Overview Chart */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800">Appointments Overview</h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">This Week</span>
                    </div>
                    {/* Chart Legend */}
                    <div className="flex gap-4 mb-3">
                      {[{l:'Total',c:'#3b82f6'},{l:'Completed',c:'#22c55e'},{l:'Pending',c:'#f97316'},{l:'Cancelled',c:'#ef4444'}].map(i=>(
                        <div key={i.l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:i.c}}/><span className="text-xs text-gray-500">{i.l}</span></div>
                      ))}
                    </div>
                    {/* SVG Mini Charts stacked */}
                    <div className="space-y-2">
                      {[
                        {d:[2100,2400,2800,3100,3300,3200,3500],c:'#3b82f6'},
                        {d:[1200,1400,1600,1800,1900,1850,2000],c:'#22c55e'},
                        {d:[600,700,800,900,1000,950,1100],c:'#f97316'},
                        {d:[200,250,300,280,320,310,350],c:'#ef4444'},
                      ].map((s,i)=>(
                        <div key={i} className="relative h-8"><MiniChart data={s.d} color={s.c}/></div>
                      ))}
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        {['May 08','May 09','May 10','May 11','May 12','May 13','May 14'].map(d=><span key={d}>{d.slice(4)}</span>)}
                      </div>
                    </div>
                  </div>

                  {/* Appointments Status */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-800 mb-4">Appointments Status</h3>
                    <div className="space-y-3">
                      {[
                        {l:'Total Appointments', v:totalApts,      icon:<Calendar size={16} className="text-blue-500"/>,   c:'bg-blue-50'},
                        {l:'Completed',          v:completedApts||1987, icon:<CheckCircle size={16} className="text-green-500"/>,  c:'bg-green-50'},
                        {l:'Pending',            v:pendingApts||644,    icon:<Clock size={16} className="text-orange-500"/>, c:'bg-orange-50'},
                        {l:'Cancelled',          v:cancelledApts||223,  icon:<XCircle size={16} className="text-red-500"/>,  c:'bg-red-50'},
                      ].map((s,i)=>(
                        <div key={i} className={`flex items-center gap-3 p-3 ${s.c} rounded-xl`}>
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">{s.icon}</div>
                          <span className="flex-1 text-sm font-medium text-gray-700">{s.l}</span>
                          <span className="font-extrabold text-gray-900">{s.v.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Users Overview Donut */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-800 mb-4">Users Overview</h3>
                    <div className="flex items-center justify-center mb-4">
                      <div className="relative w-28 h-28">
                        <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#e5e7eb" strokeWidth="14"/>
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#3b82f6" strokeWidth="14" strokeDasharray="211 239" strokeLinecap="round"/>
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#22c55e" strokeWidth="14" strokeDasharray="36 239" strokeDashoffset="-211" strokeLinecap="round"/>
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#8b5cf6" strokeWidth="14" strokeDasharray="7 239" strokeDashoffset="-247" strokeLinecap="round"/>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-lg font-extrabold text-gray-900">{(totalUsers/1000).toFixed(1)}K</p>
                          <p className="text-xs text-gray-400">Total</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        {l:'Patients', v:`${patients.toLocaleString('en-IN')}`, pct:'82%', c:'bg-blue-500'},
                        {l:'Doctors',  v:`${totalDocs}`,      pct:'15%', c:'bg-green-500'},
                        {l:'Admins',   v:'373',               pct:'3%',  c:'bg-purple-500'},
                      ].map((s,i)=>(
                        <div key={i} className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.c}`}/>
                          <span className="text-xs text-gray-600 flex-1">{s.l}</span>
                          <span className="text-xs font-bold text-gray-700">{s.v}</span>
                          <span className="text-xs text-gray-400">({s.pct})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid lg:grid-cols-4 gap-4">
                  {/* Recent Appointments */}
                  <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800 text-sm">Recent Appointments</h3>
                      <button onClick={()=>setActiveTab('appointments')} className="text-xs text-teal-600 hover:underline">View All</button>
                    </div>
                    <div className="space-y-3">
                      {(recentApts.length>0?recentApts:[
                        {patient_name:'Riya Patel',    appointment_time:'10:00 AM',appointment_type:'General Consultation',status:'pending'},
                        {patient_name:'Aman Verma',    appointment_time:'11:30 AM',appointment_type:'Follow Up',           status:'confirmed'},
                        {patient_name:'Neha Singh',    appointment_time:'01:00 PM',appointment_type:'Report Discussion',   status:'confirmed'},
                        {patient_name:'Rahul Mehta',   appointment_time:'04:00 PM',appointment_type:'General Consultation',status:'pending'},
                      ]).map((a,i)=>(
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-teal-300 to-cyan-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {(a.patient_name||'P').charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{a.patient_name}</p>
                            <p className="text-xs text-gray-400">{a.appointment_time} · {a.appointment_type?.slice(0,14)}</p>
                          </div>
                          <Badge status={a.status}/>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Doctors Verification */}
                  <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800 text-sm">Doctors Verification</h3>
                      <button onClick={()=>setActiveTab('doctors')} className="text-xs text-teal-600 hover:underline">View All</button>
                    </div>
                    <div className="space-y-3">
                      {(doctors.slice(0,4).length>0?doctors.slice(0,4):[
                        {name:'Dr. Priya Sharma',qualification:'MBBS, MD',is_verified:true},
                        {name:'Dr. Rohit Verma', qualification:'MBBS, DNB',is_verified:false},
                        {name:'Dr. Anjali Mehta',qualification:'MBBS, Dermatologist',is_verified:true},
                        {name:'Dr. Mohit Singh', qualification:'MBBS, Neurologist',is_verified:null},
                      ]).map((d,i)=>(
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {(d.name||'D').split(' ').pop()?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{d.name}</p>
                            <p className="text-xs text-gray-400 truncate">{d.qualification||'MBBS'}</p>
                          </div>
                          <Badge status={d.is_verified===true?'verified':d.is_verified===false?'rejected':'pending'}/>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Lab Analytics */}
                  <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800 text-sm">AI Lab Analytics</h3>
                      <button onClick={()=>setActiveTab('ai-analytics')} className="text-xs text-teal-600 hover:underline">View All</button>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        {l:'Symptom Checker', v:738, g:'16.7%', icon:'🩺'},
                        {l:'Report Analyzer', v:458, g:'14.2%', icon:'📋'},
                        {l:'Skin Scan (CNN)', v:314, g:'12.9%', icon:'🔬'},
                        {l:'BMI & Metrics',   v:238, g:'18.3%', icon:'⚖️'},
                        {l:'AI Chatbot',      v:102, g:'20.1%', icon:'🤖'},
                      ].map((s,i)=>(
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-base flex-shrink-0">{s.icon}</span>
                          <span className="text-xs text-gray-600 flex-1">{s.l}</span>
                          <span className="text-sm font-bold text-gray-800">{s.v}</span>
                          <span className="text-xs text-green-500 font-semibold">↑{s.g}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Health */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm">System Health</h3>
                    <div className="space-y-2.5">
                      {[
                        {l:'AI Services',    status:'Operational', c:'text-green-600 bg-green-100', icon:<Bot size={13}/>},
                        {l:'Database',       status:'Healthy',     c:'text-green-600 bg-green-100', icon:<Database size={13}/>},
                        {l:'Server Status',  status:'Operational', c:'text-green-600 bg-green-100', icon:<Server size={13}/>},
                        {l:'Storage',        status:'72% Used',    c:'text-orange-600 bg-orange-100',icon:<HardDrive size={13}/>},
                        {l:'Backup Status',  status:'Up to date',  c:'text-blue-600 bg-blue-100',   icon:<Cloud size={13}/>},
                      ].map((s,i)=>(
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-6 h-6 ${s.c} rounded-lg flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
                          <span className="text-xs text-gray-600 flex-1">{s.l}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.c}`}>{s.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="grid lg:grid-cols-4 gap-4">
                  {/* Revenue Overview */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-800 text-sm">Revenue Overview</h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">This Month</span>
                    </div>
                    <div className="mb-3">
                      <p className="text-2xl font-extrabold text-gray-900">₹{(revenue/100000).toFixed(2)}L</p>
                      <p className="text-xs text-green-500 font-semibold">↑ 26.4% vs last month</p>
                    </div>
                    <MiniChart data={[60,75,65,80,90,85,95,100]} color="#0d9488"/>
                    <div className="mt-3 space-y-2 pt-3 border-t border-gray-100">
                      {[
                        {l:'Consultation Fees',  v:'₹5,45,230'},
                        {l:'Subscription Plans', v:'₹2,15,450'},
                        {l:'Lab & Reports',      v:'₹84,550'},
                      ].map((r,i)=>(
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{r.l}</span>
                          <span className="text-xs font-bold text-gray-700">{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reports & System Monitoring */}
                  <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800 text-sm">Reports & Monitoring</h3>
                      <button className="text-xs text-teal-600 hover:underline">View All</button>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        {l:'AI Service Started',     time:'14 May, 10:30 AM', s:'Info',    c:'bg-blue-100 text-blue-700'},
                        {l:'New User Registered',    time:'14 May, 10:28 AM', s:'Info',    c:'bg-blue-100 text-blue-700'},
                        {l:'Payment Received',       time:'14 May, 10:25 AM', s:'Success', c:'bg-green-100 text-green-700'},
                        {l:'Appointment Cancelled',  time:'14 May, 10:20 AM', s:'Warning', c:'bg-yellow-100 text-yellow-700'},
                        {l:'High Risk Alert',        time:'14 May, 10:15 AM', s:'Error',   c:'bg-red-100 text-red-700'},
                      ].map((r,i)=>(
                        <div key={i} className="flex items-start gap-2">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5 ${r.c}`}>{r.s}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">{r.l}</p>
                            <p className="text-xs text-gray-400">{r.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Support Tickets */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800 text-sm">Support Tickets</h3>
                      <button className="text-xs text-teal-600 hover:underline">View All</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[
                        {l:'Open',        v:32,  c:'text-red-600 bg-red-50 border-red-200'},
                        {l:'In Progress', v:18,  c:'text-orange-600 bg-orange-50 border-orange-200'},
                        {l:'Resolved',    v:215, c:'text-green-600 bg-green-50 border-green-200'},
                        {l:'Closed',      v:456, c:'text-gray-600 bg-gray-50 border-gray-200'},
                      ].map((t,i)=>(
                        <div key={i} className={`p-3 rounded-xl border text-center ${t.c}`}>
                          <p className="text-lg font-extrabold">{t.v}</p>
                          <p className="text-xs">{t.l}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {[
                        {l:'App not working', id:'#TK1025', s:'Open'},
                        {l:'Payment failed',  id:'#TK1024', s:'In Progress'},
                        {l:'Report not show', id:'#TK1023', s:'Open'},
                      ].map((t,i)=>(
                        <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-700 flex-1 truncate">{t.l}</p>
                          <span className="text-xs text-gray-400">{t.id}</span>
                          <Badge status={t.s}/>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emergency Alerts */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800 text-sm">Emergency Alerts</h3>
                      <button className="text-xs text-teal-600 hover:underline">View All</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        {l:'High Risk',   v:24, c:'text-red-600 bg-red-50 border-red-200'},
                        {l:'Medium Risk', v:56, c:'text-orange-600 bg-orange-50 border-orange-200'},
                        {l:'Low Risk',    v:128,c:'text-blue-600 bg-blue-50 border-blue-200'},
                      ].map((e,i)=>(
                        <div key={i} className={`p-2 rounded-xl border text-center ${e.c}`}>
                          <p className="text-xl font-extrabold">{e.v}</p>
                          <p className="text-xs font-medium">{e.l}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs font-bold text-gray-600 mb-2">Recent High Risk Alerts</p>
                    {[
                      {l:'Chest Pain Detected', who:'Riya Patel',  time:'2m ago'},
                      {l:'High Fever (104°F)',  who:'Aman Verma',  time:'15m ago'},
                      {l:'Breathing Difficulty',who:'Neha Singh',  time:'25m ago'},
                    ].map((a,i)=>(
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={12} className="text-red-500 flex-shrink-0"/>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{a.l}</p>
                          <p className="text-xs text-gray-400">{a.who}</p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 5 — System Management */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-800 mb-4">System Management</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {[
                      {icon:<Database size={20}/>,   label:'Database\nBackup',    c:'text-blue-600 bg-blue-50'},
                      {icon:<Lock size={20}/>,        label:'Security\nSettings',  c:'text-red-600 bg-red-50'},
                      {icon:<UserCheck size={20}/>,   label:'User Roles\n& Perms', c:'text-purple-600 bg-purple-50'},
                      {icon:<Server size={20}/>,      label:'Service\nManagement', c:'text-teal-600 bg-teal-50'},
                      {icon:<Zap size={20}/>,         label:'API\nManagement',     c:'text-orange-600 bg-orange-50'},
                      {icon:<Mail size={20}/>,        label:'Email\nTemplates',    c:'text-green-600 bg-green-50'},
                      {icon:<List size={20}/>,        label:'System\nLogs',        c:'text-indigo-600 bg-indigo-50'},
                      {icon:<Settings size={20}/>,    label:'Maintenance\nMode',   c:'text-gray-600 bg-gray-50'},
                    ].map((m,i)=>(
                      <button key={i} className={`flex flex-col items-center gap-2 p-3 ${m.c.split(' ')[1]} rounded-2xl hover:shadow-md hover:scale-105 transition-all border border-gray-100`}>
                        <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm ${m.c.split(' ')[0]}`}>{m.icon}</div>
                        <p className="text-xs font-bold text-gray-700 text-center leading-tight whitespace-pre-line">{m.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ══ USERS TAB ══ */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg">Users & Doctors</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-bold text-gray-800">All Users ({users.length})</p>
                    <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input placeholder="Search users..." className="pl-8 pr-4 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-400"/></div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>{['Name','Email','Role','Status','Action'].map(h=><th key={h} className="text-left text-xs font-bold text-gray-500 px-5 py-3">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {users.length>0 ? users.map((u,i)=>(
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3"><div className="flex items-center gap-2.5"><div className="w-8 h-8 bg-gradient-to-br from-teal-300 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{getInitials(u.full_name)}</div><p className="text-sm font-semibold text-gray-800">{u.full_name}</p></div></td>
                            <td className="px-5 py-3 text-sm text-gray-500">{u.email}</td>
                            <td className="px-5 py-3"><Badge status={u.role}/></td>
                            <td className="px-5 py-3"><Badge status={u.is_active?'active':'inactive'}/></td>
                            <td className="px-5 py-3">
                              <button onClick={()=>toggleUser(u.id||u._id, u.is_active)} className={`p-1.5 rounded-lg transition-colors ${u.is_active?'text-orange-500 hover:bg-orange-50':'text-green-500 hover:bg-green-50'}`}>
                                {u.is_active?<ToggleRight size={18}/>:<ToggleLeft size={18}/>}
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">No users found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ══ APPOINTMENTS TAB ══ */}
            {activeTab === 'appointments' && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg">All Appointments</h2>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[{l:'Total',v:totalApts,c:'bg-blue-50 text-blue-700'},{l:'Pending',v:pendingApts,c:'bg-yellow-50 text-yellow-700'},{l:'Confirmed',v:confirmedApts,c:'bg-green-50 text-green-700'},{l:'Completed',v:completedApts,c:'bg-purple-50 text-purple-700'}].map((s,i)=>(
                    <div key={i} className={`${s.c} rounded-2xl p-4 border border-gray-100`}><p className="text-2xl font-extrabold">{s.v}</p><p className="text-xs font-medium mt-0.5">{s.l}</p></div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>{['Patient','Doctor','Date','Time','Type','Status'].map(h=><th key={h} className="text-left text-xs font-bold text-gray-500 px-5 py-3">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {apts.length>0?apts.slice(0,20).map((a,i)=>(
                          <tr key={i} className="hover:bg-gray-50"><td className="px-5 py-3 text-sm font-semibold text-gray-800">{a.patient_name}</td><td className="px-5 py-3 text-sm text-gray-600">{a.doctor_name}</td><td className="px-5 py-3 text-xs text-gray-500">{a.appointment_date}</td><td className="px-5 py-3 text-xs text-gray-500">{a.appointment_time}</td><td className="px-5 py-3"><Badge status={a.appointment_type}/></td><td className="px-5 py-3"><Badge status={a.status}/></td></tr>
                        )):(
                          <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">No appointments found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ══ DOCTORS TAB ══ */}
            {activeTab === 'doctors' && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg">Doctors Management</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(doctors.length>0?doctors:Array(6).fill({name:'Dr. Sample',specialization:'General Physician',qualification:'MBBS',is_verified:true,rating:4.8,consultation_fee:500})).map((d,i)=>(
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-300 to-purple-400 flex items-center justify-center text-white font-bold">{(d.name||'D').split(' ').pop()?.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{d.name}</p>
                          <p className="text-xs text-gray-500 truncate">{d.qualification||'MBBS'}</p>
                        </div>
                        <Badge status={d.is_verified===true?'verified':d.is_verified===false?'rejected':'pending'}/>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>{d.specialization}</span>
                        <span>⭐ {d.rating||4.5}</span>
                      </div>
                      {!d.is_verified && !d.is_static && (
                        <div className="flex gap-2">
                          <button onClick={()=>verifyDoctor(d.id||d._id,true)} className="flex-1 py-1.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700"><CheckCircle size={11} className="inline mr-1"/>Verify</button>
                          <button onClick={()=>verifyDoctor(d.id||d._id,false)} className="flex-1 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200 hover:bg-red-100"><XCircle size={11} className="inline mr-1"/>Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ AI ANALYTICS TAB ══ */}
            {activeTab === 'ai-analytics' && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg">AI Lab Analytics</h2>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    {l:'Symptom Checker', v:738, g:'16.7%', icon:'🩺', c:'bg-blue-50'},
                    {l:'Report Analyzer (OCR)', v:458, g:'14.2%', icon:'📋', c:'bg-green-50'},
                    {l:'Skin Scan (CNN)', v:314, g:'12.9%', icon:'🔬', c:'bg-purple-50'},
                    {l:'BMI & Metrics', v:238, g:'18.3%', icon:'⚖️', c:'bg-orange-50'},
                    {l:'AI Chatbot', v:102, g:'20.1%', icon:'🤖', c:'bg-indigo-50'},
                  ].map((s,i)=>(
                    <div key={i} className={`${s.c} rounded-2xl p-4 border border-gray-100`}>
                      <span className="text-3xl">{s.icon}</span>
                      <p className="text-2xl font-extrabold text-gray-900 mt-2">{s.v}</p>
                      <p className="text-xs text-gray-600 font-medium">{s.l}</p>
                      <p className="text-xs text-green-500 font-bold mt-0.5">↑ {s.g}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ EMERGENCY ALERTS TAB ══ */}
            {activeTab === 'emergency' && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2"><AlertTriangle size={20} className="text-red-500"/>Emergency Alerts</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[{l:'High Risk',v:24,c:'text-red-600 bg-red-50 border-red-200'},{l:'Medium Risk',v:56,c:'text-orange-600 bg-orange-50 border-orange-200'},{l:'Low Risk',v:128,c:'text-blue-600 bg-blue-50 border-blue-200'}].map((e,i)=>(
                    <div key={i} className={`p-5 rounded-2xl border text-center ${e.c}`}><p className="text-5xl font-extrabold">{e.v}</p><p className="text-sm font-bold mt-1">{e.l}</p></div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-800 mb-4">Recent High Risk Alerts</h3>
                  <div className="space-y-3">
                    {[{l:'Chest Pain Detected',who:'Riya Patel',time:'2 min ago',sev:'High'},{l:'High Fever (104°F)',who:'Aman Verma',time:'15 min ago',sev:'High'},{l:'Breathing Difficulty',who:'Neha Singh',time:'25 min ago',sev:'High'},{l:'Blood Sugar >250',who:'Rahul Mehta',time:'1 hr ago',sev:'Medium'}].map((a,i)=>(
                      <div key={i} className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-2xl">
                        <AlertTriangle size={20} className="text-red-500 flex-shrink-0"/>
                        <div className="flex-1"><p className="font-bold text-gray-900 text-sm">{a.l}</p><p className="text-xs text-gray-500">{a.who}</p></div>
                        <span className="text-xs text-gray-400">{a.time}</span>
                        <Badge status={a.sev}/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ SYSTEM MANAGEMENT TAB ══ */}
            {activeTab === 'system' && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg">System Management</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {icon:<Database size={24}/>,label:'Database Backup',sub:'Last backup: 2h ago',c:'text-blue-600 bg-blue-50',btn:'Backup Now'},
                    {icon:<Lock size={24}/>,label:'Security Settings',sub:'2FA enabled',c:'text-red-600 bg-red-50',btn:'Configure'},
                    {icon:<UserCheck size={24}/>,label:'User Roles & Permissions',sub:'3 role groups',c:'text-purple-600 bg-purple-50',btn:'Manage'},
                    {icon:<Server size={24}/>,label:'Service Management',sub:'All services running',c:'text-teal-600 bg-teal-50',btn:'View'},
                    {icon:<Zap size={24}/>,label:'API Management',sub:'12 active endpoints',c:'text-orange-600 bg-orange-50',btn:'Manage'},
                    {icon:<Mail size={24}/>,label:'Email Templates',sub:'8 templates',c:'text-green-600 bg-green-50',btn:'Edit'},
                    {icon:<List size={24}/>,label:'System Logs',sub:'1,234 entries today',c:'text-indigo-600 bg-indigo-50',btn:'View Logs'},
                    {icon:<Settings size={24}/>,label:'Maintenance Mode',sub:'Currently off',c:'text-gray-600 bg-gray-50',btn:'Toggle'},
                  ].map((m,i)=>(
                    <div key={i} className={`bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-md transition-all`}>
                      <div className={`w-12 h-12 ${m.c.split(' ')[1]} rounded-2xl flex items-center justify-center mx-auto mb-3 ${m.c.split(' ')[0]}`}>{m.icon}</div>
                      <p className="font-bold text-gray-800 text-sm">{m.label}</p>
                      <p className="text-xs text-gray-400 mt-1 mb-3">{m.sub}</p>
                      <button className={`w-full py-1.5 text-xs font-bold rounded-xl ${m.c.split(' ')[1]} ${m.c.split(' ')[0]} border border-current/20 hover:opacity-80 transition-all`}>{m.btn}</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ FINANCE TAB ══ */}
            {activeTab === 'finance' && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg">Finance & Billing</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[{l:'Total Revenue',v:'₹8,45,230',g:'+26.4%',c:'bg-green-50 text-green-700'},{l:'This Month',v:'₹1,45,890',g:'+12.3%',c:'bg-blue-50 text-blue-700'},{l:'Pending Payments',v:'₹23,450',g:'',c:'bg-orange-50 text-orange-700'}].map((f,i)=>(
                    <div key={i} className={`${f.c} rounded-2xl p-5 border border-gray-100`}><p className="text-xs font-medium">{f.l}</p><p className="text-3xl font-extrabold mt-1">{f.v}</p>{f.g&&<p className="text-xs font-semibold mt-1">{f.g}</p>}</div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="font-bold text-gray-800 mb-3">Revenue Breakdown</p>
                  {[{l:'Consultation Fees',v:'₹5,45,230',pct:65},{l:'Subscription Plans',v:'₹2,15,450',pct:25},{l:'Lab & Reports',v:'₹84,550',pct:10}].map((r,i)=>(
                    <div key={i} className="flex items-center gap-4 mb-3">
                      <span className="text-sm text-gray-600 w-36 flex-shrink-0">{r.l}</span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-teal-500 rounded-full" style={{width:`${r.pct}%`}}/></div>
                      <span className="text-sm font-bold text-gray-700 w-28 text-right">{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
          )}
        </main>
      </div>
    </div>
  )
}
