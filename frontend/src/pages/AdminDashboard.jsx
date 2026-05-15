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

  // Chart dropdowns
  const [growthPeriod,    setGrowthPeriod]    = useState('This Week')
  const [showGrowthDrop,  setShowGrowthDrop]  = useState(false)
  const [distPeriod,      setDistPeriod]      = useState('This Month')
  const [showDistDrop,    setShowDistDrop]    = useState(false)

  // Chart data per period
  const GROWTH_DATA = {
    'This Week':  { pts:[[20,90],[80,75],[140,68],[200,58],[260,45],[320,32],[380,18]], labels:['May 9','May 10','May 11','May 12','May 13','May 14','May 15'] },
    'This Month': { pts:[[20,88],[60,78],[100,70],[140,65],[180,55],[220,48],[260,40],[300,32],[340,25],[380,18]], labels:['May 1','May 5','May 8','May 11','May 13','May 15','May 17','May 20','May 25','May 30'] },
    'This Year':  { pts:[[20,85],[60,75],[100,70],[140,62],[180,55],[220,48],[260,40],[300,32],[340,25],[380,15]], labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Dec'] },
  }

  const DIST_DATA = {
    'This Month':  [{label:'Patients',pct:82,color:'#3b82f6'},{label:'Doctors',pct:15,color:'#22c55e'},{label:'Admins',pct:3,color:'#8b5cf6'}],
    'Last Month':  [{label:'Patients',pct:80,color:'#3b82f6'},{label:'Doctors',pct:17,color:'#22c55e'},{label:'Admins',pct:3,color:'#8b5cf6'}],
    'This Year':   [{label:'Patients',pct:79,color:'#3b82f6'},{label:'Doctors',pct:18,color:'#22c55e'},{label:'Admins',pct:3,color:'#8b5cf6'}],
  }

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
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors" title="Notifications">
              <Bell size={18} className="text-gray-500"/>
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors" title="Settings">
              <Settings size={18} className="text-gray-500"/>
            </button>
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
              <div className="space-y-5 pb-6">

                {/* Header */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Good Morning, Admin 👋</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Here's your Synora Health platform overview for today.</p>
                </div>

                {/* ── Stats Row (4 cards) ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon:'👥', label:'Total Users',         value: totalUsers.toLocaleString('en-IN'), sub:'+18.6% this month', iconBg:'bg-blue-100' },
                    { icon:'🩺', label:'Total Doctors',       value: totalDocs.toLocaleString('en-IN'),  sub:'+12.4% this month', iconBg:'bg-teal-100' },
                    { icon:'📅', label:'Total Appointments',  value: totalApts.toLocaleString('en-IN'),  sub:'+15.3% this month', iconBg:'bg-orange-100' },
                    { icon:'💰', label:'Revenue This Month',  value:`₹${(revenue/100000).toFixed(1)}L`, sub:'+26.4% vs last month', iconBg:'bg-green-100' },
                  ].map((s,i)=>(
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                      <div className={`w-12 h-12 ${s.iconBg} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0`}>{s.icon}</div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                        <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{s.value}</p>
                        <p className="text-xs text-green-600 font-medium mt-0.5">{s.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── MAIN 3-COLUMN ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                  {/* Today's Appointments */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <div>
                        <p className="font-bold text-gray-900">Today's Appointments</p>
                        <p className="text-xs text-teal-600 font-semibold mt-0.5">{new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                      </div>
                      <button onClick={()=>setActiveTab('appointments')} className="text-xs text-blue-600 font-semibold hover:underline">View All</button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {(recentApts.length>0?recentApts:[
                        {patient_name:'Riya Patel',   appointment_time:'10:00 AM', symptoms:'Chest Pain',       appointment_type:'in-person', status:'pending'},
                        {patient_name:'Aman Verma',   appointment_time:'11:30 AM', symptoms:'Regular Checkup',  appointment_type:'video',     status:'confirmed'},
                        {patient_name:'Neha Singh',   appointment_time:'01:00 PM', symptoms:'Follow-up',        appointment_type:'in-person', status:'confirmed'},
                        {patient_name:'Rahul Mehta',  appointment_time:'04:00 PM', symptoms:'ECG Review',       appointment_type:'video',     status:'pending'},
                        {patient_name:'Kavita Joshi', appointment_time:'05:00 PM', symptoms:'Blood Pressure',   appointment_type:'in-person', status:'confirmed'},
                      ]).slice(0,5).map((a,i)=>(
                        <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                          <p className="text-xs font-semibold text-gray-400 w-16 flex-shrink-0">{a.appointment_time}</p>
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(a.patient_name||'P').charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{a.patient_name}</p>
                            <p className="text-xs text-gray-400 truncate">{a.symptoms||a.appointment_type}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${a.appointment_type==='video'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>
                            {a.appointment_type==='video'?'Video':'Clinic'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 py-3 border-t border-gray-100">
                      <button onClick={()=>setActiveTab('appointments')}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 font-semibold hover:bg-gray-50 rounded-xl border border-gray-200">
                        <Calendar size={14}/> View Full Schedule
                      </button>
                    </div>
                  </div>

                  {/* Platform Overview */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <p className="font-bold text-gray-900">Platform Overview</p>
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">Live</span>
                    </div>
                    <div className="p-5">
                      <div className="flex flex-col items-center gap-3 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-blue-100 rounded-full flex items-center justify-center">
                          <Shield size={30} className="text-teal-600"/>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-gray-900">Synora Health 🏥</p>
                          <p className="text-xs text-gray-500 mt-0.5">All systems operational</p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        {[
                          { icon:'🤖', label:'AI Services',    status:'Operational', color:'text-green-600 bg-green-50' },
                          { icon:'🗄️', label:'Database',       status:'Healthy',     color:'text-green-600 bg-green-50' },
                          { icon:'🖥️', label:'Server',         status:'Running',     color:'text-green-600 bg-green-50' },
                          { icon:'💾', label:'Storage',        status:'72% Used',    color:'text-orange-600 bg-orange-50' },
                        ].map((s,i)=>(
                          <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-xl">
                            <span className="text-base flex-shrink-0">{s.icon}</span>
                            <span className="text-xs font-medium text-gray-700 flex-1">{s.label}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.status}</span>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { icon:'👥', label:'Manage Users',    tab:'users' },
                          { icon:'🩺', label:'Verify Doctors',  tab:'doctors' },
                          { icon:'📊', label:'Analytics',       tab:'ai-analytics' },
                          { icon:'🎫', label:'Support Tickets', tab:'tickets' },
                        ].map((a,i)=>(
                          <button key={i} onClick={()=>setActiveTab(a.tab)}
                            className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-teal-50 border border-gray-100 hover:border-teal-200 rounded-xl text-sm font-medium text-gray-700 transition-all">
                            <span className="text-base">{a.icon}</span>{a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="space-y-4">

                    {/* Doctor Verifications */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-gray-900 text-sm">Doctor Verifications</p>
                        <button onClick={()=>setActiveTab('doctors')} className="text-xs text-blue-600 font-semibold hover:underline">View All</button>
                      </div>
                      <div className="space-y-2.5">
                        {(pendingDocs.length>0?pendingDocs:[
                          {name:'Dr. Rohit Verma', qualification:'MBBS, DNB',is_verified:null},
                          {name:'Dr. Mohit Singh', qualification:'MBBS, Neuro',is_verified:null},
                          {name:'Dr. Priya Mehta', qualification:'MBBS, MD',is_verified:true},
                        ]).slice(0,3).map((d,i)=>(
                          <div key={i} className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {(d.name||'D').split(' ').pop()?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{d.name}</p>
                              <p className="text-xs text-gray-400 truncate">{d.qualification||'MBBS'}</p>
                            </div>
                            <Badge status={d.is_verified===true?'verified':d.is_verified===false?'rejected':'pending'}/>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-gray-900 text-sm">Recent Activity</p>
                        <button onClick={()=>setActiveTab('activity')} className="text-xs text-blue-600 font-semibold hover:underline">View All</button>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          { icon:'👤', color:'bg-blue-100',   text:'New user registered',              time:'2m ago' },
                          { icon:'✅', color:'bg-green-100',  text:'Doctor Priya Sharma verified',     time:'10m ago' },
                          { icon:'💰', color:'bg-teal-100',   text:'Payment ₹500 received',            time:'25m ago' },
                          { icon:'🚨', color:'bg-red-100',    text:'Emergency SOS triggered',          time:'1h ago' },
                        ].map((a,i)=>(
                          <div key={i} className="flex items-start gap-2.5">
                            <div className={`w-7 h-7 ${a.color} rounded-lg flex items-center justify-center flex-shrink-0 text-sm`}>{a.icon}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700 leading-snug">{a.text}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 flex-shrink-0">{a.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <p className="font-bold text-gray-900 text-sm mb-3">Quick Actions</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { icon:'🩺', label:'Add Doctor',   tab:'doctors' },
                          { icon:'👥', label:'Add User',     tab:'users' },
                          { icon:'📊', label:'Reports',      tab:'reports' },
                          { icon:'⚙️', label:'Settings',     tab:'settings' },
                        ].map((a,i)=>(
                          <button key={i} onClick={()=>setActiveTab(a.tab)}
                            className="flex flex-col items-center gap-1.5 p-2 bg-gray-50 hover:bg-teal-50 rounded-xl border border-gray-100 hover:border-teal-200 transition-all">
                            <span className="text-xl">{a.icon}</span>
                            <p className="text-[10px] text-gray-600 font-medium text-center leading-tight">{a.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── CHARTS ROW ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  {/* Platform Growth Chart */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-bold text-gray-900">Platform Growth</p>
                      <div className="relative">
                        <button onClick={()=>{ setShowGrowthDrop(v=>!v); setShowDistDrop(false) }}
                          className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium transition-colors">
                          {growthPeriod}
                          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 3.5L5 6.5L8 3.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                        </button>
                        {showGrowthDrop && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden w-32">
                            {['This Week','This Month','This Year'].map(opt=>(
                              <button key={opt} onClick={()=>{ setGrowthPeriod(opt); setShowGrowthDrop(false) }}
                                className={`w-full px-3 py-2 text-xs text-left transition-colors ${growthPeriod===opt?'bg-teal-50 text-teal-700 font-semibold':'text-gray-700 hover:bg-gray-50'}`}>
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {(()=>{
                      const d = GROWTH_DATA[growthPeriod] || GROWTH_DATA['This Week']
                      const pts = d.pts
                      const minX = pts[0][0], maxX = pts[pts.length-1][0]
                      const pathD = pts.map(([x,y],i)=>`${i===0?'M':'L'}${x},${y}`).join(' ')
                      const areaD = pathD + ` L${maxX},100 L${minX},100 Z`
                      return (
                        <>
                          <svg viewBox="0 0 400 110" className="w-full h-28">
                            <defs>
                              <linearGradient id="adminGrad2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25"/>
                                <stop offset="100%" stopColor="#0d9488" stopOpacity="0"/>
                              </linearGradient>
                            </defs>
                            {[20,40,60,80].map(y=><line key={y} x1="10" y1={y} x2="395" y2={y} stroke="#f3f4f6" strokeWidth="1"/>)}
                            <path d={areaD} fill="url(#adminGrad2)"/>
                            <path d={pathD} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            {pts.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3" fill="#0d9488"/>)}
                          </svg>
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
                            {d.labels.map(l=><span key={l}>{l}</span>)}
                          </div>
                        </>
                      )
                    })()}
                  </div>

                  {/* User Distribution Donut */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-bold text-gray-900">User Distribution</p>
                      <div className="relative">
                        <button onClick={()=>{ setShowDistDrop(v=>!v); setShowGrowthDrop(false) }}
                          className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium transition-colors">
                          {distPeriod}
                          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 3.5L5 6.5L8 3.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                        </button>
                        {showDistDrop && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden w-32">
                            {['This Month','Last Month','This Year'].map(opt=>(
                              <button key={opt} onClick={()=>{ setDistPeriod(opt); setShowDistDrop(false) }}
                                className={`w-full px-3 py-2 text-xs text-left transition-colors ${distPeriod===opt?'bg-teal-50 text-teal-700 font-semibold':'text-gray-700 hover:bg-gray-50'}`}>
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {(()=>{
                      const distItems = DIST_DATA[distPeriod] || DIST_DATA['This Month']
                      const circ = 2 * Math.PI * 48
                      let offset = 0
                      return (
                        <div className="flex items-center gap-6">
                          <div className="relative flex-shrink-0">
                            <svg viewBox="0 0 120 120" width="120" height="120">
                              <circle cx="60" cy="60" r="48" fill="none" stroke="#f3f4f6" strokeWidth="18"/>
                              {distItems.map((d,i)=>{
                                const dash = (d.pct/100)*circ
                                const seg = (
                                  <circle key={i} cx="60" cy="60" r="48" fill="none"
                                    stroke={d.color} strokeWidth="18"
                                    strokeDasharray={`${dash} ${circ-dash}`}
                                    strokeDashoffset={-offset}
                                    transform="rotate(-90 60 60)"/>
                                )
                                offset += dash
                                return seg
                              })}
                              <text x="60" y="56" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#111827">{(totalUsers/1000).toFixed(1)}K</text>
                              <text x="60" y="68" textAnchor="middle" fontSize="8" fill="#6b7280">Users</text>
                            </svg>
                          </div>
                          <div className="space-y-2.5 flex-1">
                            {distItems.map((d,i)=>(
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor:d.color}}/>
                                <span className="text-xs text-gray-600 flex-1">{d.label}</span>
                                <span className="text-xs font-bold text-gray-800">{d.pct}%</span>
                              </div>
                            ))}
                            <div className="pt-2 border-t border-gray-100 space-y-1.5">
                              {[
                                { label:'Total Appointments', value: totalApts.toLocaleString('en-IN'), color:'text-orange-600' },
                                { label:'Revenue This Month', value:`₹${(revenue/100000).toFixed(1)}L`, color:'text-green-600' },
                              ].map((s,i)=>(
                                <div key={i} className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">{s.label}</span>
                                  <span className={`text-xs font-bold ${s.color}`}>{s.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* ── QUICK MANAGEMENT TILES ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="font-bold text-gray-800 mb-4 text-sm">System Management</p>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {[
                      { icon:'🗄️', label:'Database\nBackup',    tab:'system' },
                      { icon:'🔒', label:'Security\nSettings',   tab:'settings' },
                      { icon:'👤', label:'User Roles\n& Perms',  tab:'users' },
                      { icon:'🖥️', label:'Service\nManagement', tab:'system' },
                      { icon:'⚡', label:'API\nManagement',      tab:'system' },
                      { icon:'📧', label:'Email\nTemplates',     tab:'settings' },
                      { icon:'📋', label:'System\nLogs',         tab:'activity' },
                      { icon:'⚙️', label:'Maintenance\nMode',   tab:'settings' },
                    ].map((m,i)=>(
                      <button key={i} onClick={()=>setActiveTab(m.tab)}
                        className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-teal-50 rounded-2xl hover:shadow-md hover:scale-105 transition-all border border-gray-100 hover:border-teal-200">
                        <span className="text-2xl">{m.icon}</span>
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

            {/* ══ REPORTS & MONITORING ══ */}
            {activeTab === 'reports' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><BarChart2 size={20}/></div>
                  <div><h2 className="font-extrabold text-lg">Reports & Monitoring</h2><p className="text-blue-200 text-xs">Platform analytics, system logs and performance monitoring</p></div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {icon:'📊',label:'Total Reports Generated',value:'12,458',color:'text-blue-600 bg-blue-50'},
                    {icon:'✅',label:'Successful Analyses',    value:'11,890',color:'text-green-600 bg-green-50'},
                    {icon:'⚠️',label:'Warnings Triggered',     value:'324',  color:'text-orange-600 bg-orange-50'},
                    {icon:'🔴',label:'Critical Errors',        value:'12',   color:'text-red-600 bg-red-50'},
                  ].map((s,i)=>(
                    <div key={i} className={`${s.color.split(' ')[1]} rounded-2xl p-4 text-center border border-gray-100`}>
                      <span className="text-2xl">{s.icon}</span>
                      <p className={`text-2xl font-extrabold mt-1 ${s.color.split(' ')[0]}`}>{s.value}</p>
                      <p className="text-xs text-gray-600 font-medium mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-bold text-gray-800 text-sm">System Log — Real Time</p>
                    <button onClick={loadData} className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"><RefreshCw size={11}/> Refresh</button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {[
                      {time:'10:30 AM',level:'INFO',   msg:'AI Service started successfully',        source:'AI Engine',  color:'bg-blue-100 text-blue-700'},
                      {time:'10:28 AM',level:'INFO',   msg:'New user registered — Priya Patel',      source:'Auth',       color:'bg-blue-100 text-blue-700'},
                      {time:'10:25 AM',level:'SUCCESS',msg:'Payment ₹500 received — Appointment #123',source:'Payment',   color:'bg-green-100 text-green-700'},
                      {time:'10:20 AM',level:'WARNING',msg:'Appointment cancelled by Aman Verma',    source:'Booking',    color:'bg-yellow-100 text-yellow-700'},
                      {time:'10:15 AM',level:'ERROR',  msg:'High risk patient alert — Riya Patel',  source:'AI Monitor', color:'bg-red-100 text-red-700'},
                      {time:'10:10 AM',level:'INFO',   msg:'Database backup completed successfully', source:'System',     color:'bg-blue-100 text-blue-700'},
                      {time:'10:05 AM',level:'INFO',   msg:'Doctor Rohit Verma verification pending',source:'Admin',     color:'bg-blue-100 text-blue-700'},
                      {time:'10:00 AM',level:'SUCCESS',msg:'Server health check passed',             source:'Monitor',    color:'bg-green-100 text-green-700'},
                    ].map((log,i)=>(
                      <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 font-mono text-xs">
                        <span className="text-gray-400 w-16 flex-shrink-0">{log.time}</span>
                        <span className={`px-2 py-0.5 rounded font-bold flex-shrink-0 ${log.color}`}>{log.level}</span>
                        <span className="text-gray-700 flex-1 truncate">{log.msg}</span>
                        <span className="text-gray-400 flex-shrink-0">[{log.source}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ NOTIFICATIONS ══ */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-5 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Bell size={20}/></div>
                    <div><h2 className="font-extrabold text-lg">Notifications</h2><p className="text-red-100 text-xs">All platform alerts, system and admin notifications</p></div>
                  </div>
                  <span className="bg-white text-red-600 text-sm font-extrabold px-3 py-1 rounded-full">3 New</span>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {[
                    {icon:'🆘',color:'bg-red-100',    title:'Emergency SOS Triggered',         sub:'Patient Riya Patel sent SOS — 192.168.0.x',      time:'2m ago',  unread:true,  priority:'High'},
                    {icon:'🩺',color:'bg-orange-100', title:'New Doctor Verification Request',  sub:'Dr. Mohit Singh submitted documents for review',  time:'15m ago', unread:true,  priority:'Medium'},
                    {icon:'💰',color:'bg-green-100',  title:'Payment Gateway Alert',            sub:'High volume payments detected — ₹45,000 in 1hr',  time:'1h ago',  unread:true,  priority:'Medium'},
                    {icon:'👤',color:'bg-blue-100',   title:'New User Spike',                   sub:'150 new registrations in last 24 hours',          time:'2h ago',  unread:false, priority:'Low'},
                    {icon:'🖥️',color:'bg-purple-100', title:'Server Load Warning',             sub:'CPU usage at 78% — monitoring required',          time:'3h ago',  unread:false, priority:'Medium'},
                    {icon:'🤖',color:'bg-teal-100',   title:'AI Service Restarted',             sub:'AI analysis engine auto-restarted after update',  time:'5h ago',  unread:false, priority:'Low'},
                    {icon:'📋',color:'bg-yellow-100', title:'Monthly Report Ready',             sub:'May 2026 platform report is ready to download',   time:'Yesterday',unread:false,priority:'Low'},
                    {icon:'🔒',color:'bg-gray-100',   title:'Security Scan Completed',          sub:'No vulnerabilities detected — system secure',     time:'Yesterday',unread:false,priority:'Low'},
                  ].map((n,i)=>(
                    <div key={i} className={`flex items-start gap-3 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 ${n.unread?'bg-blue-50/20':''}`}>
                      <div className={`w-10 h-10 ${n.color} rounded-xl flex items-center justify-center flex-shrink-0 text-lg`}>{n.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${n.unread?'text-gray-900':'text-gray-600'}`}>{n.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.sub}</p>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-1">
                        <p className="text-xs text-gray-400">{n.time}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${n.priority==='High'?'bg-red-100 text-red-700':n.priority==='Medium'?'bg-orange-100 text-orange-700':'bg-gray-100 text-gray-500'}`}>{n.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full py-2.5 border border-gray-200 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-50">Mark all as read</button>
              </div>
            )}

            {/* ══ ACTIVITY LOG ══ */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl p-5 text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><List size={20}/></div>
                  <div><h2 className="font-extrabold text-lg">Activity Log</h2><p className="text-gray-300 text-xs">Complete audit trail of all platform actions</p></div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    {icon:'👤',label:'User Actions',  value:'3,241', color:'text-blue-600 bg-blue-50'},
                    {icon:'🩺',label:'Doctor Actions', value:'856',   color:'text-teal-600 bg-teal-50'},
                    {icon:'⚙️',label:'System Events', value:'1,204', color:'text-purple-600 bg-purple-50'},
                    {icon:'🔒',label:'Security Events',value:'43',   color:'text-red-600 bg-red-50'},
                  ].map((s,i)=>(
                    <div key={i} className={`${s.color.split(' ')[1]} rounded-2xl p-4 text-center border border-gray-100`}>
                      <span className="text-2xl">{s.icon}</span>
                      <p className={`text-2xl font-extrabold mt-1 ${s.color.split(' ')[0]}`}>{s.value}</p>
                      <p className="text-xs text-gray-600 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <p className="font-bold text-gray-800 text-sm">Recent Activity</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {[
                      {who:'Admin',    action:'Verified Dr. Priya Sharma',           type:'Admin',   time:'10:30 AM', icon:'✅', color:'bg-green-100'},
                      {who:'Patient',  action:'Riya Patel registered account',        type:'User',    time:'10:25 AM', icon:'👤', color:'bg-blue-100'},
                      {who:'Doctor',   action:'Dr. Amit created prescription #P456',  type:'Doctor',  time:'10:20 AM', icon:'💊', color:'bg-purple-100'},
                      {who:'System',   action:'Auto-backup completed successfully',   type:'System',  time:'10:15 AM', icon:'🗄️', color:'bg-gray-100'},
                      {who:'Patient',  action:'Aman Verma booked appointment',        type:'User',    time:'10:10 AM', icon:'📅', color:'bg-blue-100'},
                      {who:'Admin',    action:'Rejected Dr. Rohit Verma documents',   type:'Admin',   time:'10:05 AM', icon:'❌', color:'bg-red-100'},
                      {who:'System',   action:'AI analysis completed — 45 reports',   type:'System',  time:'10:00 AM', icon:'🤖', color:'bg-teal-100'},
                      {who:'Patient',  action:'Neha Singh uploaded lab report',       type:'User',    time:'09:55 AM', icon:'📋', color:'bg-orange-100'},
                    ].map((log,i)=>(
                      <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                        <div className={`w-8 h-8 ${log.color} rounded-lg flex items-center justify-center flex-shrink-0 text-sm`}>{log.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">{log.action}</p>
                          <p className="text-xs text-gray-400">By: {log.who}</p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0">{log.type}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ SUPPORT TICKETS ══ */}
            {activeTab === 'tickets' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-5 text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><TicketCheck size={20}/></div>
                  <div><h2 className="font-extrabold text-lg">Support Tickets</h2><p className="text-violet-200 text-xs">Manage customer support requests and issues</p></div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    {icon:'🔴',label:'Open',       value:32,  color:'text-red-600 bg-red-50'},
                    {icon:'🟡',label:'In Progress', value:18,  color:'text-orange-600 bg-orange-50'},
                    {icon:'✅',label:'Resolved',    value:215, color:'text-green-600 bg-green-50'},
                    {icon:'⬛',label:'Closed',      value:456, color:'text-gray-600 bg-gray-50'},
                  ].map((s,i)=>(
                    <div key={i} className={`${s.color.split(' ')[1]} rounded-2xl p-4 text-center border border-gray-100`}>
                      <span className="text-2xl">{s.icon}</span>
                      <p className={`text-2xl font-extrabold mt-1 ${s.color.split(' ')[0]}`}>{s.value}</p>
                      <p className="text-xs text-gray-600 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-bold text-gray-800 text-sm">All Tickets</p>
                    <div className="flex gap-2">
                      {['All','Open','In Progress','Resolved'].map(f=>(
                        <button key={f} className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-600 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 transition-colors">{f}</button>
                      ))}
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {[
                      {id:'#TK1025',title:'App not loading on mobile',    user:'Riya Patel',   category:'Technical', status:'Open',        priority:'High',   time:'10 min ago'},
                      {id:'#TK1024',title:'Payment failed during booking', user:'Aman Verma',   category:'Payment',   status:'In Progress', priority:'High',   time:'25 min ago'},
                      {id:'#TK1023',title:'Report not showing correctly',  user:'Neha Singh',   category:'Reports',   status:'Open',        priority:'Medium', time:'1h ago'},
                      {id:'#TK1022',title:'Cannot reschedule appointment', user:'Rahul Mehta',  category:'Booking',   status:'Resolved',    priority:'Low',    time:'2h ago'},
                      {id:'#TK1021',title:'AI analysis taking too long',   user:'Priya Sharma', category:'AI',        status:'In Progress', priority:'Medium', time:'3h ago'},
                      {id:'#TK1020',title:'Profile photo not updating',    user:'Kavita Joshi', category:'Account',   status:'Resolved',    priority:'Low',    time:'5h ago'},
                    ].map((t,i)=>(
                      <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs text-gray-400 font-mono">{t.id}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{t.category}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate">{t.title}</p>
                          <p className="text-xs text-gray-400">By: {t.user} · {t.time}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${t.priority==='High'?'bg-red-100 text-red-700':t.priority==='Medium'?'bg-orange-100 text-orange-700':'bg-gray-100 text-gray-500'}`}>{t.priority}</span>
                        <Badge status={t.status.toLowerCase().replace(' ','-')}/>
                        <button className="text-xs bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-1.5 rounded-lg font-semibold flex-shrink-0">View</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ SYSTEM MANAGEMENT ══ */}
            {activeTab === 'system' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-5 text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Server size={20}/></div>
                  <div><h2 className="font-extrabold text-lg">System Management</h2><p className="text-gray-300 text-xs">Server health, database, services and infrastructure</p></div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {icon:'🖥️',label:'Server Status', value:'Operational', sub:'CPU: 45% · RAM: 62%', color:'text-green-600 bg-green-50'},
                    {icon:'🗄️',label:'Database',      value:'Healthy',     sub:'Response: 12ms',     color:'text-blue-600 bg-blue-50'},
                    {icon:'💾',label:'Storage',       value:'72% Used',    sub:'1.4TB / 2TB',         color:'text-orange-600 bg-orange-50'},
                    {icon:'🤖',label:'AI Services',   value:'Running',     sub:'Model: GPT-4o-mini',  color:'text-teal-600 bg-teal-50'},
                  ].map((s,i)=>(
                    <div key={i} className={`${s.color.split(' ')[1]} rounded-2xl p-4 border border-gray-100`}>
                      <span className="text-2xl">{s.icon}</span>
                      <p className={`text-base font-extrabold mt-1 ${s.color.split(' ')[0]}`}>{s.value}</p>
                      <p className="text-xs text-gray-600 font-medium">{s.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                    </div>
                  ))}
                </div>
                <div className="grid lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="font-bold text-gray-800 mb-4 text-sm">System Controls</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {icon:'🗄️',label:'Database Backup',      action:'Run Backup',     color:'bg-blue-50 border-blue-100 text-blue-700'},
                        {icon:'🔒',label:'Security Scan',         action:'Run Scan',       color:'bg-red-50 border-red-100 text-red-700'},
                        {icon:'🔄',label:'Restart Services',      action:'Restart',        color:'bg-orange-50 border-orange-100 text-orange-700'},
                        {icon:'🧹',label:'Clear Cache',           action:'Clear',          color:'bg-purple-50 border-purple-100 text-purple-700'},
                        {icon:'📧',label:'Test Email Service',    action:'Send Test',      color:'bg-green-50 border-green-100 text-green-700'},
                        {icon:'⚡',label:'Flush API Cache',       action:'Flush',          color:'bg-yellow-50 border-yellow-100 text-yellow-700'},
                      ].map((c,i)=>(
                        <button key={i} onClick={()=>toast.success(`${c.label} triggered!`)}
                          className={`flex items-center gap-2 p-3 border rounded-xl ${c.color} hover:opacity-80 transition-all text-left`}>
                          <span className="text-xl flex-shrink-0">{c.icon}</span>
                          <div>
                            <p className="text-xs font-bold">{c.label}</p>
                            <p className="text-[10px] opacity-70">{c.action}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="font-bold text-gray-800 mb-4 text-sm">Service Status</p>
                    <div className="space-y-3">
                      {[
                        {name:'Authentication Service', status:'Running',  uptime:'99.9%'},
                        {name:'Payment Gateway',        status:'Running',  uptime:'99.7%'},
                        {name:'AI Analysis Engine',     status:'Running',  uptime:'98.5%'},
                        {name:'SMS/Email Service',      status:'Running',  uptime:'99.2%'},
                        {name:'File Storage Service',   status:'Running',  uptime:'100%'},
                        {name:'WebSocket Server',       status:'Running',  uptime:'99.8%'},
                      ].map((s,i)=>(
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                          <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"/>
                          <p className="text-sm text-gray-700 flex-1">{s.name}</p>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{s.status}</span>
                          <span className="text-xs text-gray-400">{s.uptime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ SETTINGS ══ */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl p-5 text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Settings size={20}/></div>
                  <div><h2 className="font-extrabold text-lg">Settings</h2><p className="text-gray-300 text-xs">Platform configuration, preferences and account settings</p></div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {icon:'👤',label:'Admin Profile',       sub:'Update your name, email and photo',   action:()=>toast.success('Go to profile page'),         color:'bg-blue-50 border-blue-100'},
                    {icon:'🔒',label:'Security Settings',   sub:'Change password and 2FA settings',    action:()=>toast.success('Security settings opened'),    color:'bg-red-50 border-red-100'},
                    {icon:'🔔',label:'Notification Settings',sub:'Manage alert preferences',           action:()=>setActiveTab('notifications'),                  color:'bg-orange-50 border-orange-100'},
                    {icon:'💰',label:'Payment Settings',    sub:'Payment gateway configuration',       action:()=>setActiveTab('finance'),                       color:'bg-green-50 border-green-100'},
                    {icon:'🤖',label:'AI Configuration',    sub:'API keys, model settings',            action:()=>setActiveTab('ai-analytics'),                  color:'bg-teal-50 border-teal-100'},
                    {icon:'📧',label:'Email / SMS Settings',sub:'Configure SMTP and Twilio',           action:()=>setActiveTab('system'),                        color:'bg-purple-50 border-purple-100'},
                    {icon:'🌐',label:'Language & Region',   sub:'Platform language and timezone',      action:()=>toast.success('Language settings opened'),     color:'bg-indigo-50 border-indigo-100'},
                    {icon:'🎨',label:'Branding Settings',   sub:'Logo, colors and platform name',      action:()=>toast.success('Branding settings opened'),     color:'bg-pink-50 border-pink-100'},
                    {icon:'⚙️',label:'System Settings',    sub:'Server config and maintenance mode',   action:()=>setActiveTab('system'),                        color:'bg-gray-50 border-gray-200'},
                  ].map((s,i)=>(
                    <button key={i} onClick={s.action}
                      className={`flex items-center gap-4 p-4 border rounded-2xl hover:shadow-md transition-all text-left group ${s.color}`}>
                      <span className="text-3xl">{s.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-teal-700">{s.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-teal-500 flex-shrink-0"/>
                    </button>
                  ))}
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-red-700 text-sm">Danger Zone</p>
                    <p className="text-xs text-red-500 mt-0.5">These actions are irreversible. Proceed with caution.</p>
                  </div>
                  <button onClick={()=>toast.error('This action requires super admin confirmation')}
                    className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700">
                    Reset Platform Data
                  </button>
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
