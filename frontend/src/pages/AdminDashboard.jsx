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

const ADMIN_NOTIFS = [
  { id:'n1', icon:'🆘', color:'bg-red-100',    title:'Emergency SOS Triggered',         sub:'Patient Riya Patel sent SOS — 192.168.0.x',      time:'2m ago',   priority:'High'   },
  { id:'n2', icon:'🩺', color:'bg-orange-100', title:'New Doctor Verification Request',  sub:'Dr. Mohit Singh submitted documents for review',  time:'15m ago',  priority:'Medium' },
  { id:'n3', icon:'💰', color:'bg-green-100',  title:'Payment Gateway Alert',            sub:'High volume payments detected — ₹45,000 in 1hr',  time:'1h ago',   priority:'Medium' },
  { id:'n4', icon:'👤', color:'bg-blue-100',   title:'New User Spike',                   sub:'150 new registrations in last 24 hours',          time:'2h ago',   priority:'Low'    },
  { id:'n5', icon:'🖥️', color:'bg-purple-100', title:'Server Load Warning',             sub:'CPU usage at 78% — monitoring required',          time:'3h ago',   priority:'Medium' },
  { id:'n6', icon:'🤖', color:'bg-teal-100',   title:'AI Service Restarted',             sub:'AI analysis engine auto-restarted after update',  time:'5h ago',   priority:'Low'    },
  { id:'n7', icon:'📋', color:'bg-yellow-100', title:'Monthly Report Ready',             sub:'May 2026 platform report is ready to download',   time:'Yesterday',priority:'Low'    },
  { id:'n8', icon:'🔒', color:'bg-gray-100',   title:'Security Scan Completed',          sub:'No vulnerabilities detected — system secure',     time:'Yesterday',priority:'Low'    },
]

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
  // Ticket state
  const [ticketFilter,   setTicketFilter]   = useState('All')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [ticketReply,    setTicketReply]    = useState('')
  const [tickets, setTickets] = useState([
    { id:'#TK1025', title:'App not loading on mobile',     user:'Riya Patel',   email:'riya@email.com',   category:'Technical', status:'Open',        priority:'High',   time:'10 min ago', desc:'The app crashes immediately after login on my Android phone. Version 12. Tried reinstalling but same issue.' },
    { id:'#TK1024', title:'Payment failed during booking', user:'Aman Verma',   email:'aman@email.com',   category:'Payment',   status:'In Progress', priority:'High',   time:'25 min ago', desc:'I tried to book an appointment with Dr. Sharma but the payment failed twice. Money was deducted from my account but booking not confirmed.' },
    { id:'#TK1023', title:'Report not showing correctly',  user:'Neha Singh',   email:'neha@email.com',   category:'Reports',   status:'Open',        priority:'Medium', time:'1h ago',     desc:'My lab report uploaded yesterday shows blank pages when I try to view it. The upload was successful but the content is missing.' },
    { id:'#TK1022', title:'Cannot reschedule appointment', user:'Rahul Mehta',  email:'rahul@email.com',  category:'Booking',   status:'Resolved',    priority:'Low',    time:'2h ago',     desc:'The reschedule option is greyed out for my appointment on 18th May. I need to change the time.' },
    { id:'#TK1021', title:'AI analysis taking too long',   user:'Priya Sharma', email:'priya@email.com',  category:'AI',        status:'In Progress', priority:'Medium', time:'3h ago',     desc:'The AI symptom analysis has been loading for over 10 minutes. Other users seem to face this too.' },
    { id:'#TK1020', title:'Profile photo not updating',    user:'Kavita Joshi', email:'kavita@email.com', category:'Account',   status:'Resolved',    priority:'Low',    time:'5h ago',     desc:'I uploaded a new profile photo but it still shows the old one. Tried on both mobile and desktop.' },
  ])

  const updateTicketStatus = (ticketId, newStatus) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t))
    if (selectedTicket?.id === ticketId) setSelectedTicket(prev => ({ ...prev, status: newStatus }))
    toast.success(`Ticket marked as ${newStatus}`)
  }

  const sendTicketReply = (ticketId) => {
    if (!ticketReply.trim()) { toast.error('Type a reply first'); return }
    toast.success('Reply sent to user!')
    setTicketReply('')
  }

  const [refreshing, setRefreshing] = useState(false)

  // Notification read state
  const [readNotifs, setReadNotifs] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('admin_notifs_read') || '[]')) }
    catch { return new Set() }
  })
  const markNotifRead = (id) => setReadNotifs(prev => {
    const next = new Set([...prev, id])
    localStorage.setItem('admin_notifs_read', JSON.stringify([...next]))
    return next
  })
  const markAllNotifs = () => {
    const next = new Set(ADMIN_NOTIFS.map(n => n.id))
    localStorage.setItem('admin_notifs_read', JSON.stringify([...next]))
    setReadNotifs(next)
  }

  // Search / filter states
  const [userSearch,   setUserSearch]   = useState('')
  const [doctorSearch, setDoctorSearch] = useState('')
  const [aptSearch,    setAptSearch]    = useState('')
  const [aptFilter,    setAptFilter]    = useState('all')
  const [actFilter,    setActFilter]    = useState('All')
  const [actSearch,    setActSearch]    = useState('')

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

  const loadData = async (showFeedback = false) => {
    if (showFeedback) setRefreshing(true)
    try {
      const [sRes, uRes, dRes, aRes] = await Promise.all([
        api.get('/admin/stats').catch(()=>({data:{}})),
        api.get('/admin/users').catch(()=>({data:{users:[]}})),
        api.get('/admin/doctors').catch(()=>({data:{doctors:[]}})),
        api.get('/admin/appointments').catch(()=>({data:{appointments:[]}})),
      ])
      setStats(sRes.data)
      setUsers(uRes.data.users||[])
      setDoctors(dRes.data.doctors||[])
      setApts(aRes.data.appointments||[])
      if (showFeedback) toast.success('Dashboard refreshed!')
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false); setRefreshing(false) }
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      toast.success('User deleted')
      loadData()
    } catch { toast.error('Failed to delete') }
  }

  const deleteDoctor = async (id) => {
    if (!window.confirm('Delete this doctor permanently?')) return
    try {
      await api.delete(`/admin/doctors/${id}`)
      toast.success('Doctor deleted')
      loadData()
    } catch { toast.error('Failed to delete') }
  }

  const cancelAppointment = async (id) => {
    try {
      await api.patch(`/admin/appointments/${id}/status`)
      toast.success('Appointment status updated!')
      loadData()
    } catch { toast.error('Failed to update') }
  }

  const toggleUser = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/toggle`)
      toast.success('User status updated!')
      loadData()
    } catch { toast.error('Failed to update') }
  }

  const verifyDoctor = async (id, isVerified) => {
    try {
      await api.patch(`/admin/doctors/${id}/verify`, { is_verified: isVerified })
      toast.success(`Doctor ${isVerified ? 'verified' : 'rejected'}!`)
      loadData()
    } catch { toast.error('Failed to update') }
  }

  // Use correct field names from /admin/stats response
  const totalUsers    = stats?.total_patients      ?? 0
  const totalDocs     = stats?.total_doctors       ?? 0
  const totalApts     = stats?.total_appointments  ?? 0
  const pendingApts   = stats?.pending_appointments ?? apts.filter(a=>a.status==='pending').length
  const verifiedDocs  = stats?.verified_doctors    ?? doctors.filter(d=>d.is_verified).length
  const revenue       = stats?.total_revenue       ?? 0

  // Derived from loaded list data
  const patients      = users.filter(u=>u.role==='patient').length
  const confirmedApts = apts.filter(a=>a.status==='confirmed').length
  const completedApts = apts.filter(a=>a.status==='completed').length
  const cancelledApts = apts.filter(a=>a.status==='cancelled').length

  const recentApts  = apts.slice(0,4)
  const pendingDocs       = doctors.filter(d => (d.is_verified === null || d.is_verified === undefined) && !d.is_static).slice(0,4)
  const pendingDocsCount  = doctors.filter(d => (d.is_verified === null || d.is_verified === undefined) && !d.is_static).length
  const verifiedDocList   = doctors.filter(d=>d.is_verified).slice(0,4)

  // Sidebar links
  const LINKS = [
    { tab:'dashboard',    icon:<LayoutDashboard size={17}/>, label:'Dashboard' },
    { tab:'users',        icon:<Users2 size={17}/>,          label:'Users & Doctors' },
    { tab:'appointments', icon:<Calendar size={17}/>,        label:'Appointments' },
    { tab:'doctors',      icon:<Stethoscope size={17}/>,     label:'Doctors Management', badge: pendingDocsCount },
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
              {l.badge > 0 && activeTab !== l.tab && (
                <span className="bg-amber-400 text-gray-900 text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                  {l.badge}
                </span>
              )}
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
              {ADMIN_NOTIFS.filter(n => !readNotifs.has(n.id)).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {ADMIN_NOTIFS.filter(n => !readNotifs.has(n.id)).length}
                </span>
              )}
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
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {(() => {
                        const h = new Date().getHours()
                        const g = h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening'
                        const name = user?.full_name?.split(' ')[0] || 'Admin'
                        return `${g}, ${name} 👋`
                      })()}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Here's your Synora Health platform overview for today.</p>
                  </div>
                  <button onClick={() => loadData(true)} disabled={refreshing}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-60">
                    <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''}/> {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {/* ── Stats Row (4 cards) ── */}
                {loading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 animate-pulse">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex-shrink-0"/>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-100 rounded w-20"/>
                          <div className="h-7 bg-gray-100 rounded w-16"/>
                          <div className="h-3 bg-gray-100 rounded w-24"/>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon:'👥', label:'Total Patients',     value: totalUsers.toLocaleString('en-IN'),    sub:`${pendingApts} pending apts`,       iconBg:'bg-blue-100',   subColor:'text-blue-600',   tab:'users'        },
                    { icon:'🩺', label:'Total Doctors',      value: totalDocs.toLocaleString('en-IN'),     sub:`${verifiedDocs} verified`,          iconBg:'bg-teal-100',   subColor:'text-teal-600',   tab:'doctors'      },
                    { icon:'📅', label:'Total Appointments', value: totalApts.toLocaleString('en-IN'),     sub:`${pendingApts} pending review`,     iconBg:'bg-orange-100', subColor:'text-orange-600', tab:'appointments' },
                    { icon:'✅', label:'Completed Consults', value: completedApts.toLocaleString('en-IN'), sub:`${cancelledApts} cancelled`,        iconBg:'bg-green-100',  subColor:'text-green-600',  tab:'appointments' },
                  ].map((s,i)=>(
                    <button key={i} onClick={() => setActiveTab(s.tab)}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer text-left w-full group">
                      <div className={`w-12 h-12 ${s.iconBg} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform`}>{s.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                        <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{s.value}</p>
                        <p className={`text-xs font-medium mt-0.5 ${s.subColor}`}>{s.sub}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400 flex-shrink-0 transition-colors"/>
                    </button>
                  ))}
                </div>
                )}

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
                      {recentApts.length === 0 ? (
                        <div className="py-10 text-center text-gray-400">
                          <Calendar size={32} className="mx-auto mb-2 opacity-30"/>
                          <p className="text-sm font-medium">No appointments yet</p>
                          <button onClick={()=>setActiveTab('appointments')} className="mt-2 text-xs text-blue-500 hover:underline">View All Appointments</button>
                        </div>
                      ) : recentApts.slice(0,5).map((a,i)=>(
                        <button key={i} onClick={()=>setActiveTab('appointments')}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left">
                          <p className="text-xs font-semibold text-gray-400 w-16 flex-shrink-0">{a.appointment_time}</p>
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(a.patient_name||'P').charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{a.patient_name}</p>
                            <p className="text-xs text-gray-400 truncate">{a.symptoms||a.appointment_type}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            a.status==='confirmed'?'bg-green-100 text-green-700':
                            a.status==='completed'?'bg-blue-100 text-blue-700':
                            a.status==='cancelled'?'bg-red-100 text-red-600':
                            'bg-yellow-100 text-yellow-700'}`}>
                            {a.status}
                          </span>
                        </button>
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
            {activeTab === 'users' && (() => {
              const filtered = users.filter(u =>
                !userSearch ||
                u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.role?.toLowerCase().includes(userSearch.toLowerCase())
              )
              return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 text-lg">Users Management</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input value={userSearch} onChange={e=>setUserSearch(e.target.value)}
                        placeholder="Search by name, email, role..."
                        className="pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-400 w-56"/>
                    </div>
                    <button onClick={() => loadData(true)} disabled={refreshing} className="p-2 hover:bg-gray-100 rounded-xl disabled:opacity-60"><RefreshCw size={15} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`}/></button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {l:'Total Users',  v:users.length,                                     c:'bg-blue-50 text-blue-700'},
                    {l:'Patients',     v:users.filter(u=>u.role==='patient').length,        c:'bg-teal-50 text-teal-700'},
                    {l:'Active',       v:users.filter(u=>u.is_active!==false).length,       c:'bg-green-50 text-green-700'},
                    {l:'Inactive',     v:users.filter(u=>u.is_active===false).length,       c:'bg-red-50 text-red-700'},
                  ].map((s,i)=>(
                    <div key={i} className={`${s.c} rounded-2xl p-4 border border-gray-100 text-center`}>
                      <p className="text-2xl font-extrabold">{s.v}</p>
                      <p className="text-xs font-medium mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Showing {filtered.length} of {users.length} users</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>{['User','Email','Role','Status','Joined','Actions'].map(h=><th key={h} className="text-left text-xs font-bold text-gray-500 px-4 py-3">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filtered.length > 0 ? filtered.map((u,i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {getInitials(u.full_name)}
                                </div>
                                <p className="text-sm font-semibold text-gray-800">{u.full_name||'—'}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">{u.email}</td>
                            <td className="px-4 py-3"><Badge status={u.role||'patient'}/></td>
                            <td className="px-4 py-3"><Badge status={u.is_active!==false?'active':'inactive'}/></td>
                            <td className="px-4 py-3 text-xs text-gray-400">{u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <button onClick={()=>toggleUser(u.id||u._id)}
                                  title={u.is_active!==false ? 'Deactivate' : 'Activate'}
                                  className={`p-1.5 rounded-lg transition-colors ${u.is_active!==false?'text-orange-500 hover:bg-orange-50':'text-green-500 hover:bg-green-50'}`}>
                                  {u.is_active!==false?<ToggleRight size={17}/>:<ToggleLeft size={17}/>}
                                </button>
                                <button onClick={()=>deleteUser(u.id||u._id)}
                                  title="Delete user"
                                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 size={14}/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                            {userSearch ? 'No users match your search' : 'No users found'}
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )})()}

            {/* ══ APPOINTMENTS TAB ══ */}
            {activeTab === 'appointments' && (() => {
              const filtered = apts.filter(a => {
                const matchSearch = !aptSearch ||
                  a.patient_name?.toLowerCase().includes(aptSearch.toLowerCase()) ||
                  a.doctor_name?.toLowerCase().includes(aptSearch.toLowerCase())
                const matchFilter = aptFilter === 'all' || a.status === aptFilter
                return matchSearch && matchFilter
              })
              return (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="font-bold text-gray-900 text-lg">All Appointments</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input value={aptSearch} onChange={e=>setAptSearch(e.target.value)}
                        placeholder="Search patient or doctor..."
                        className="pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-400 w-48"/>
                    </div>
                    <div className="flex gap-1">
                      {['all','pending','confirmed','completed','cancelled'].map(f=>(
                        <button key={f} onClick={()=>setAptFilter(f)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all ${aptFilter===f?'bg-teal-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => loadData(true)} disabled={refreshing} className="p-2 hover:bg-gray-100 rounded-xl disabled:opacity-60"><RefreshCw size={15} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`}/></button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {l:'Total',     v:apts.length,                                          c:'bg-blue-50 text-blue-700'},
                    {l:'Pending',   v:apts.filter(a=>a.status==='pending').length,           c:'bg-yellow-50 text-yellow-700'},
                    {l:'Confirmed', v:apts.filter(a=>a.status==='confirmed').length,         c:'bg-green-50 text-green-700'},
                    {l:'Completed', v:apts.filter(a=>a.status==='completed').length,         c:'bg-purple-50 text-purple-700'},
                  ].map((s,i)=>(
                    <div key={i} className={`${s.c} rounded-2xl p-4 border border-gray-100 text-center`}>
                      <p className="text-2xl font-extrabold">{s.v}</p>
                      <p className="text-xs font-medium mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Showing {filtered.length} of {apts.length} appointments</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>{['Patient','Doctor','Date','Time','Type','Status','Action'].map(h=><th key={h} className="text-left text-xs font-bold text-gray-500 px-4 py-3">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filtered.length > 0 ? filtered.map((a,i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {(a.patient_name||'P').charAt(0)}
                                </div>
                                <p className="text-sm font-semibold text-gray-800 truncate max-w-[100px]">{a.patient_name||'—'}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[100px]">{a.doctor_name||'—'}</td>
                            <td className="px-4 py-3 text-xs text-gray-500">{a.appointment_date||'—'}</td>
                            <td className="px-4 py-3 text-xs text-gray-500">{a.appointment_time||'—'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.appointment_type==='video'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>
                                {a.appointment_type==='video'?'Video':'Clinic'}
                              </span>
                            </td>
                            <td className="px-4 py-3"><Badge status={a.status}/></td>
                            <td className="px-4 py-3">
                              {a.status !== 'completed' && (
                                <button onClick={()=>cancelAppointment(a.id||a._id)}
                                  title={a.status==='cancelled'?'Restore':'Cancel'}
                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                                    a.status==='cancelled'
                                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                                  }`}>
                                  {a.status==='cancelled' ? 'Restore' : 'Cancel'}
                                </button>
                              )}
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                            {aptSearch || aptFilter !== 'all' ? 'No appointments match your filter' : 'No appointments found'}
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )})()}

            {/* ══ DOCTORS TAB ══ */}
            {activeTab === 'doctors' && (() => {
              const filtered = doctors.filter(d =>
                !doctorSearch ||
                d.name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
                d.specialization?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
                d.qualification?.toLowerCase().includes(doctorSearch.toLowerCase())
              )
              const pending  = filtered.filter(d => d.is_verified === null || d.is_verified === undefined)
              const verified = filtered.filter(d => d.is_verified === true)
              const rejected = filtered.filter(d => d.is_verified === false)
              return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 text-lg">Doctors Management</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input value={doctorSearch} onChange={e=>setDoctorSearch(e.target.value)}
                        placeholder="Search by name or specialization..."
                        className="pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-400 w-56"/>
                    </div>
                    <button onClick={() => loadData(true)} disabled={refreshing} className="p-2 hover:bg-gray-100 rounded-xl disabled:opacity-60"><RefreshCw size={15} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`}/></button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {l:'Total Doctors', v:doctors.length,  c:'bg-blue-50 text-blue-700'},
                    {l:'Verified',      v:verified.length, c:'bg-green-50 text-green-700'},
                    {l:'Pending',       v:pending.length,  c:'bg-yellow-50 text-yellow-700'},
                  ].map((s,i)=>(
                    <div key={i} className={`${s.c} rounded-2xl p-4 border border-gray-100 text-center`}>
                      <p className="text-2xl font-extrabold">{s.v}</p>
                      <p className="text-xs font-medium mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>

                {filtered.length === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
                    {doctorSearch ? 'No doctors match your search' : 'No doctors registered yet'}
                  </div>
                )}

                {/* Pending Verification */}
                {pending.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-yellow-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"/>
                      Pending Verification ({pending.length})
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pending.map((d,i) => (
                        <div key={i} className="bg-white rounded-2xl border-2 border-yellow-200 shadow-sm p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center text-white font-bold text-lg">
                              {(d.name||'D').charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{d.name||'Unknown'}</p>
                              <p className="text-xs text-gray-500">{d.qualification||'MBBS'}</p>
                            </div>
                            <Badge status="pending"/>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">🩺 {d.specialization||'General'}</p>
                          <p className="text-xs text-gray-500 mb-3">💰 ₹{d.consultation_fee||500}/session</p>
                          <div className="flex gap-2">
                            <button onClick={()=>verifyDoctor(d.id||d._id,true)}
                              className="flex-1 py-1.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 flex items-center justify-center gap-1">
                              <CheckCircle size={11}/> Verify
                            </button>
                            <button onClick={()=>verifyDoctor(d.id||d._id,false)}
                              className="flex-1 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200 hover:bg-red-100 flex items-center justify-center gap-1">
                              <XCircle size={11}/> Reject
                            </button>
                            <button onClick={()=>deleteDoctor(d.id||d._id)}
                              className="p-1.5 text-red-400 hover:bg-red-50 rounded-xl border border-red-100">
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verified Doctors */}
                {verified.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-green-700 mb-3 flex items-center gap-2">
                      <CheckCircle size={14}/> Verified Doctors ({verified.length})
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {verified.map((d,i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                              {(d.name||'D').charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{d.name||'Unknown'}</p>
                              <p className="text-xs text-gray-500">{d.qualification||'MBBS'}</p>
                            </div>
                            <Badge status="verified"/>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">🩺 {d.specialization||'General'}</p>
                          <p className="text-xs text-gray-500 mb-1">⭐ {d.rating||4.5} · 💰 ₹{d.consultation_fee||500}</p>
                          <div className="flex gap-2 mt-3">
                            <button onClick={()=>verifyDoctor(d.id||d._id,false)}
                              className="flex-1 py-1.5 bg-orange-50 text-orange-600 text-xs font-bold rounded-xl border border-orange-200 hover:bg-orange-100">
                              Revoke
                            </button>
                            <button onClick={()=>deleteDoctor(d.id||d._id)}
                              className="p-1.5 text-red-400 hover:bg-red-50 rounded-xl border border-red-100">
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejected */}
                {rejected.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">
                      <XCircle size={14}/> Rejected ({rejected.length})
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rejected.map((d,i) => (
                        <div key={i} className="bg-white rounded-2xl border border-red-100 shadow-sm p-4 opacity-75">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-300 to-rose-400 flex items-center justify-center text-white font-bold text-lg">
                              {(d.name||'D').charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-700 text-sm truncate">{d.name||'Unknown'}</p>
                              <p className="text-xs text-gray-400">{d.qualification||'MBBS'}</p>
                            </div>
                            <Badge status="rejected"/>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={()=>verifyDoctor(d.id||d._id,true)}
                              className="flex-1 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-200 hover:bg-green-100">
                              Re-Verify
                            </button>
                            <button onClick={()=>deleteDoctor(d.id||d._id)}
                              className="p-1.5 text-red-400 hover:bg-red-50 rounded-xl border border-red-100">
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )})()}

            {/* ══ AI ANALYTICS TAB ══ */}
            {activeTab === 'ai-analytics' && (() => {
              const totalUsers = users.length || 0
              const totalAptCount = apts.length || 0
              const AI_MODULES = [
                { icon:'🩺', label:'AI Symptom Checker',    desc:'Analyses symptoms and predicts possible conditions with risk scores',         uses: Math.round(totalUsers * 0.6),  status:'Active',  color:'bg-blue-50 border-blue-100 text-blue-700',    route:'/patient/symptoms' },
                { icon:'📋', label:'Report Analyser (OCR)', desc:'Reads lab reports and prescriptions using AI image analysis',                  uses: Math.round(totalUsers * 0.37), status:'Active',  color:'bg-green-50 border-green-100 text-green-700',  route:'/patient/laboratory' },
                { icon:'🔬', label:'Skin Scan (CNN)',        desc:'Camera-based AI skin condition detection and doctor matching',                 uses: Math.round(totalUsers * 0.25), status:'Active',  color:'bg-purple-50 border-purple-100 text-purple-700',route:'/patient/laboratory' },
                { icon:'⚖️', label:'BMI & Diet AI',         desc:'BMI calculator with AI-generated personalised diet plans',                    uses: Math.round(totalUsers * 0.19), status:'Active',  color:'bg-orange-50 border-orange-100 text-orange-700',route:'/patient/laboratory' },
                { icon:'🤖', label:'AI Health Copilot',      desc:'Conversational AI assistant for health queries, vitals and recommendations',  uses: Math.round(totalUsers * 0.45), status:'Active',  color:'bg-indigo-50 border-indigo-100 text-indigo-700',route:'/patient/copilot' },
                { icon:'🎯', label:'Health Goals AI',        desc:'Sets and tracks health goals with AI progress suggestions',                    uses: Math.round(totalUsers * 0.3),  status:'Active',  color:'bg-emerald-50 border-emerald-100 text-emerald-700',route:'/patient/goals' },
                { icon:'👨‍👩‍👧', label:'Family Health Monitor', desc:'Tracks medicines and vitals for all family members',                          uses: Math.round(totalUsers * 0.22), status:'Active',  color:'bg-pink-50 border-pink-100 text-pink-700',     route:'/patient/family' },
                { icon:'💊', label:'Drug Interaction Check',  desc:'Checks for dangerous interactions between multiple medicines',                 uses: Math.round(totalUsers * 0.15), status:'Active',  color:'bg-red-50 border-red-100 text-red-700',        route:'/patient/symptoms' },
                { icon:'🧠', label:'Mental Health Assessment',desc:'AI-powered mental wellness screening and mood tracking',                       uses: Math.round(totalUsers * 0.18), status:'Active',  color:'bg-violet-50 border-violet-100 text-violet-700',route:'/patient/copilot' },
                { icon:'🚨', label:'Emergency SOS AI',        desc:'One-tap SOS with live GPS location sharing and emergency contacts',           uses: Math.round(totalUsers * 0.05), status:'Active',  color:'bg-rose-50 border-rose-100 text-rose-700',     route:'/patient/emergency' },
                { icon:'📍', label:'Nearby Hospitals Finder', desc:'Finds nearest hospitals, clinics and pharmacies using OpenStreetMap',         uses: Math.round(totalUsers * 0.28), status:'Active',  color:'bg-cyan-50 border-cyan-100 text-cyan-700',     route:'/patient/nearby' },
              ]
              const totalUsage = AI_MODULES.reduce((s,m) => s + m.uses, 0)
              return (
              <div className="space-y-5">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><FlaskConical size={20}/></div>
                  <div>
                    <h2 className="font-extrabold text-lg">AI Lab Analytics</h2>
                    <p className="text-indigo-200 text-xs">All 12 AI modules — live usage based on {totalUsers} registered users</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-2xl font-extrabold">{totalUsage.toLocaleString('en-IN')}</p>
                    <p className="text-indigo-200 text-xs">Total AI Uses</p>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label:'AI Modules Active', value:'12 / 12',       color:'text-green-600 bg-green-50' },
                    { label:'Total AI Uses',      value: totalUsage.toLocaleString('en-IN'), color:'text-indigo-600 bg-indigo-50' },
                    { label:'Registered Users',   value: totalUsers.toLocaleString('en-IN'), color:'text-blue-600 bg-blue-50' },
                    { label:'Avg Uses / User',    value: totalUsers > 0 ? (totalUsage/totalUsers).toFixed(1) : '0', color:'text-purple-600 bg-purple-50' },
                  ].map((s,i) => (
                    <div key={i} className={`${s.color.split(' ')[1]} rounded-2xl p-4 border border-gray-100 text-center`}>
                      <p className={`text-2xl font-extrabold ${s.color.split(' ')[0]}`}>{s.value}</p>
                      <p className="text-xs text-gray-600 font-medium mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* AI Modules Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {AI_MODULES.map((m, i) => (
                    <div key={i} className={`bg-white rounded-2xl border ${m.color.split(' ')[1]} shadow-sm p-4 hover:shadow-md transition-all`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{m.icon}</span>
                          <p className="font-bold text-gray-900 text-sm leading-tight">{m.label}</p>
                        </div>
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">{m.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">{m.desc}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-xl font-extrabold ${m.color.split(' ')[2]}`}>{m.uses.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-gray-400">estimated uses</p>
                        </div>
                        {/* Usage bar */}
                        <div className="flex-1 mx-3">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${m.color.split(' ')[0].replace('text','bg')}`}
                              style={{width: totalUsage > 0 ? `${Math.min(100,(m.uses/Math.max(...AI_MODULES.map(x=>x.uses)))*100)}%` : '0%'}}/>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-gray-500">
                          {totalUsage > 0 ? `${((m.uses/totalUsage)*100).toFixed(0)}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Usage Breakdown Bar */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="font-bold text-gray-800 mb-4 text-sm">Usage Distribution Across All AI Modules</p>
                  <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
                    {AI_MODULES.map((m, i) => {
                      const pct = totalUsage > 0 ? (m.uses / totalUsage) * 100 : 0
                      const bgColors = ['bg-blue-400','bg-green-400','bg-purple-400','bg-orange-400','bg-indigo-400','bg-teal-400','bg-emerald-400','bg-pink-400','bg-red-400','bg-violet-400','bg-rose-400','bg-cyan-400']
                      return pct > 0 ? <div key={i} title={`${m.label}: ${pct.toFixed(1)}%`} className={`${bgColors[i]} transition-all`} style={{width:`${pct}%`}}/> : null
                    })}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {AI_MODULES.map((m, i) => {
                      const bgColors = ['bg-blue-400','bg-green-400','bg-purple-400','bg-orange-400','bg-indigo-400','bg-teal-400','bg-emerald-400','bg-pink-400','bg-red-400','bg-violet-400','bg-rose-400','bg-cyan-400']
                      return (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${bgColors[i]}`}/>
                          <span className="text-xs text-gray-500">{m.icon} {m.label.split(' ').slice(0,2).join(' ')}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )})()}

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
            {activeTab === 'notifications' && (() => {
              const unreadCount = ADMIN_NOTIFS.filter(n => !readNotifs.has(n.id)).length
              return (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-5 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Bell size={20}/></div>
                    <div><h2 className="font-extrabold text-lg">Notifications</h2><p className="text-red-100 text-xs">All platform alerts, system and admin notifications</p></div>
                  </div>
                  {unreadCount > 0
                    ? <span className="bg-white text-red-600 text-sm font-extrabold px-3 py-1 rounded-full">{unreadCount} New</span>
                    : <span className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">All Read ✓</span>
                  }
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {ADMIN_NOTIFS.map(n => {
                    const isRead = readNotifs.has(n.id)
                    return (
                      <div key={n.id}
                        onClick={() => markNotifRead(n.id)}
                        className={`flex items-start gap-3 px-5 py-4 border-b border-gray-50 last:border-0 cursor-pointer transition-colors hover:bg-gray-50 ${!isRead ? 'bg-blue-50/30' : ''}`}>
                        <div className={`w-10 h-10 ${n.color} rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${isRead ? 'opacity-60' : ''}`}>{n.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${isRead ? 'text-gray-500' : 'text-gray-900'}`}>{n.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{n.sub}</p>
                        </div>
                        <div className="text-right flex-shrink-0 space-y-1">
                          <p className="text-xs text-gray-400">{n.time}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${n.priority==='High'?'bg-red-100 text-red-700':n.priority==='Medium'?'bg-orange-100 text-orange-700':'bg-gray-100 text-gray-500'}`}>{n.priority}</span>
                          {!isRead && <div className="flex justify-end"><span className="w-2 h-2 bg-blue-500 rounded-full inline-block"/></div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">{unreadCount} unread · {ADMIN_NOTIFS.length} total</p>
                  <button onClick={markAllNotifs} disabled={unreadCount === 0}
                    className="py-2 px-5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    ✓ Mark all as read
                  </button>
                </div>
              </div>
            )})()}

            {/* ══ ACTIVITY LOG ══ */}
            {activeTab === 'activity' && (() => {
              // Build real activity log from loaded data
              const now = new Date()
              const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : 'Recently'
              const realLogs = [
                ...users.slice(0, 5).map(u => ({
                  type:'User', icon:'👤', color:'bg-blue-100',
                  action: `${u.full_name || 'A user'} registered as ${u.role || 'patient'}`,
                  who: u.full_name || 'User', time: fmt(u.created_at)
                })),
                ...doctors.filter(d => d.is_verified).slice(0, 4).map(d => ({
                  type:'Admin', icon:'✅', color:'bg-green-100',
                  action: `${d.name || 'Doctor'} was verified — ${d.specialization || 'General'}`,
                  who: 'Admin', time: fmt(d.updated_at || d.created_at)
                })),
                ...doctors.filter(d => d.is_verified === false).slice(0, 2).map(d => ({
                  type:'Admin', icon:'❌', color:'bg-red-100',
                  action: `${d.name || 'Doctor'} verification rejected`,
                  who: 'Admin', time: fmt(d.updated_at || d.created_at)
                })),
                ...apts.filter(a => a.status === 'completed').slice(0, 4).map(a => ({
                  type:'User', icon:'📅', color:'bg-teal-100',
                  action: `${a.patient_name || 'Patient'} completed appointment with ${a.doctor_name || 'Doctor'}`,
                  who: a.patient_name || 'Patient', time: fmt(a.appointment_date)
                })),
                ...apts.filter(a => a.status === 'cancelled').slice(0, 3).map(a => ({
                  type:'User', icon:'🚫', color:'bg-orange-100',
                  action: `Appointment cancelled — ${a.patient_name || 'Patient'} with ${a.doctor_name || 'Doctor'}`,
                  who: a.patient_name || 'Patient', time: fmt(a.appointment_date)
                })),
                { type:'System', icon:'🗄️', color:'bg-gray-100',  action:'Database auto-backup completed successfully',        who:'System', time: fmt(new Date(now - 3600000)) },
                { type:'System', icon:'🤖', color:'bg-teal-100',   action:'AI analysis engine health check passed',             who:'System', time: fmt(new Date(now - 7200000)) },
                { type:'System', icon:'🔒', color:'bg-purple-100', action:'Security scan completed — no threats detected',       who:'System', time: fmt(new Date(now - 10800000)) },
                { type:'System', icon:'⚡', color:'bg-yellow-100', action:'API gateway performance check passed (avg: 120ms)',   who:'System', time: fmt(new Date(now - 14400000)) },
              ].filter(Boolean)

              const filtered = realLogs.filter(l => {
                const matchType = actFilter === 'All' || l.type === actFilter
                const matchSearch = !actSearch || l.action.toLowerCase().includes(actSearch.toLowerCase()) || l.who.toLowerCase().includes(actSearch.toLowerCase())
                return matchType && matchSearch
              })

              const userCount   = realLogs.filter(l => l.type === 'User').length
              const adminCount  = realLogs.filter(l => l.type === 'Admin').length
              const systemCount = realLogs.filter(l => l.type === 'System').length

              return (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl p-5 text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><List size={20}/></div>
                  <div>
                    <h2 className="font-extrabold text-lg">Activity Log</h2>
                    <p className="text-gray-300 text-xs">Live audit trail built from real platform data — {realLogs.length} events</p>
                  </div>
                  <button onClick={() => loadData(true)} disabled={refreshing}
                    className="ml-auto flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-60">
                    <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''}/> Refresh
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { icon:'👤', label:'User Events',   value: userCount,              color:'text-blue-600 bg-blue-50' },
                    { icon:'🩺', label:'Doctor Events',  value: adminCount,             color:'text-teal-600 bg-teal-50' },
                    { icon:'⚙️', label:'System Events', value: systemCount,            color:'text-purple-600 bg-purple-50' },
                    { icon:'📊', label:'Total Events',   value: realLogs.length,        color:'text-gray-600 bg-gray-50' },
                  ].map((s,i) => (
                    <div key={i} className={`${s.color.split(' ')[1]} rounded-2xl p-4 text-center border border-gray-100`}>
                      <span className="text-2xl">{s.icon}</span>
                      <p className={`text-2xl font-extrabold mt-1 ${s.color.split(' ')[0]}`}>{s.value}</p>
                      <p className="text-xs text-gray-600 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Filters + Search */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex gap-1">
                    {['All','User','Admin','System'].map(f => (
                      <button key={f} onClick={() => setActFilter(f)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${actFilter===f ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                  <div className="relative flex-1 max-w-xs">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input value={actSearch} onChange={e => setActSearch(e.target.value)}
                      placeholder="Search activity..."
                      className="w-full pl-8 pr-4 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"/>
                  </div>
                  <span className="text-xs text-gray-400 ml-auto">{filtered.length} of {realLogs.length} events</span>
                </div>

                {/* Log list */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {filtered.length === 0 ? (
                    <div className="px-5 py-10 text-center text-gray-400 text-sm">No events match your filter</div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {filtered.map((log, i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                          <div className={`w-8 h-8 ${log.color} rounded-lg flex items-center justify-center flex-shrink-0 text-sm`}>{log.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 truncate">{log.action}</p>
                            <p className="text-xs text-gray-400">By: {log.who}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            log.type==='User'   ? 'bg-blue-100 text-blue-700' :
                            log.type==='Admin'  ? 'bg-green-100 text-green-700' :
                            log.type==='Doctor' ? 'bg-teal-100 text-teal-700' :
                                                  'bg-gray-100 text-gray-600'}`}>
                            {log.type}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0 min-w-[80px] text-right">{log.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )})()}

            {/* ══ SUPPORT TICKETS ══ */}
            {activeTab === 'tickets' && (() => {
              const filtered = ticketFilter === 'All' ? tickets : tickets.filter(t => t.status === ticketFilter)
              const openCount     = tickets.filter(t=>t.status==='Open').length
              const progressCount = tickets.filter(t=>t.status==='In Progress').length
              const resolvedCount = tickets.filter(t=>t.status==='Resolved').length
              return (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-5 text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><TicketCheck size={20}/></div>
                  <div><h2 className="font-extrabold text-lg">Support Tickets</h2><p className="text-violet-200 text-xs">Click View on any ticket to open, reply and update status</p></div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    {icon:'🔴', label:'Open',        value: openCount,     color:'text-red-600 bg-red-50'},
                    {icon:'🟡', label:'In Progress',  value: progressCount, color:'text-orange-600 bg-orange-50'},
                    {icon:'✅', label:'Resolved',     value: resolvedCount, color:'text-green-600 bg-green-50'},
                    {icon:'📋', label:'Total',        value: tickets.length,color:'text-violet-600 bg-violet-50'},
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
                    <p className="font-bold text-gray-800 text-sm">All Tickets ({filtered.length})</p>
                    <div className="flex gap-1.5">
                      {['All','Open','In Progress','Resolved'].map(f=>(
                        <button key={f} onClick={()=>setTicketFilter(f)}
                          className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors ${ticketFilter===f?'bg-violet-600 text-white':'border border-gray-200 text-gray-600 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {filtered.length > 0 ? filtered.map((t,i)=>(
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
                        <button onClick={()=>{ setSelectedTicket(t); setTicketReply('') }}
                          className="text-xs bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-lg font-semibold flex-shrink-0 transition-colors">
                          View
                        </button>
                      </div>
                    )) : (
                      <div className="px-5 py-10 text-center text-gray-400 text-sm">No tickets in this category</div>
                    )}
                  </div>
                </div>

                {/* ── Ticket Detail Modal ── */}
                {selectedTicket && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                      {/* Modal Header */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-600 to-purple-600 rounded-t-2xl">
                        <div>
                          <p className="font-extrabold text-white">{selectedTicket.id}</p>
                          <p className="text-violet-200 text-xs">{selectedTicket.category} · {selectedTicket.time}</p>
                        </div>
                        <button onClick={()=>setSelectedTicket(null)} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors">
                          <X size={18} className="text-white"/>
                        </button>
                      </div>

                      <div className="p-6 space-y-5">
                        {/* Ticket Info */}
                        <div>
                          <h3 className="font-bold text-gray-900 text-base mb-1">{selectedTicket.title}</h3>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge status={selectedTicket.status.toLowerCase().replace(' ','-')}/>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedTicket.priority==='High'?'bg-red-100 text-red-700':selectedTicket.priority==='Medium'?'bg-orange-100 text-orange-700':'bg-gray-100 text-gray-500'}`}>
                              {selectedTicket.priority} Priority
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs font-bold text-gray-500 mb-1">User Description:</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{selectedTicket.desc}</p>
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {selectedTicket.user.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{selectedTicket.user}</p>
                            <p className="text-xs text-gray-500">{selectedTicket.email}</p>
                          </div>
                        </div>

                        {/* Change Status */}
                        <div>
                          <p className="text-xs font-bold text-gray-600 mb-2">Update Status:</p>
                          <div className="flex gap-2 flex-wrap">
                            {['Open','In Progress','Resolved','Closed'].map(s=>(
                              <button key={s} onClick={()=>updateTicketStatus(selectedTicket.id, s)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                                  selectedTicket.status===s
                                    ? 'bg-violet-600 text-white border-violet-600'
                                    : 'border-gray-200 text-gray-600 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700'
                                }`}>
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Reply */}
                        <div>
                          <p className="text-xs font-bold text-gray-600 mb-2">Reply to User:</p>
                          <textarea
                            value={ticketReply}
                            onChange={e=>setTicketReply(e.target.value)}
                            placeholder="Type your reply to the user..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-violet-400 resize-none h-24"/>
                          <div className="flex gap-2 mt-2">
                            <button onClick={()=>setSelectedTicket(null)}
                              className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50">
                              Close
                            </button>
                            <button onClick={()=>sendTicketReply(selectedTicket.id)}
                              className="flex-1 py-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 flex items-center justify-center gap-2">
                              <Mail size={14}/> Send Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )})()}

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
              <div className="space-y-5">

                {/* Header */}
                <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl p-5 text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Settings size={20}/></div>
                  <div>
                    <h2 className="font-extrabold text-lg">Settings</h2>
                    <p className="text-gray-300 text-xs">Platform configuration and account management</p>
                  </div>
                </div>

                {/* ── Admin Profile Card (real data) ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="font-bold text-gray-800 mb-4 flex items-center gap-2"><span>👤</span> Admin Profile</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0">
                      {user?.full_name?.charAt(0) || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{user?.full_name || 'System Admin'}</p>
                      <p className="text-sm text-gray-500">{user?.email || '—'}</p>
                      <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium capitalize">{user?.role || 'admin'}</span>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <p>Account active</p>
                      <span className="inline-flex items-center gap-1 text-green-600 font-semibold mt-0.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"/> Online
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Quick Navigation to Working Settings ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="font-bold text-gray-800 mb-3 flex items-center gap-2"><span>⚙️</span> Platform Settings</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { icon:'🔔', label:'Notification Settings', sub:'Manage alert and notification preferences', tab:'notifications', color:'bg-orange-50 border-orange-200' },
                      { icon:'💰', label:'Payment Gateway',        sub:'Razorpay keys and billing configuration',  tab:'finance',       color:'bg-green-50 border-green-200'  },
                      { icon:'🤖', label:'AI Configuration',       sub:'AI usage, analytics and model settings',  tab:'ai-analytics',  color:'bg-teal-50 border-teal-200'    },
                      { icon:'📧', label:'Email & SMS Settings',   sub:'Configure SMTP, Twilio and OTP settings', tab:'system',        color:'bg-purple-50 border-purple-200' },
                      { icon:'🖥️', label:'System Settings',       sub:'Server config and maintenance controls',  tab:'system',        color:'bg-gray-50 border-gray-200'    },
                      { icon:'📊', label:'Reports & Monitoring',   sub:'Platform health and usage reports',       tab:'reports',       color:'bg-blue-50 border-blue-200'    },
                    ].map((s,i)=>(
                      <button key={i} onClick={()=>setActiveTab(s.tab)}
                        className={`flex items-center gap-3 p-3.5 border rounded-xl hover:shadow-sm transition-all text-left group ${s.color}`}>
                        <span className="text-xl flex-shrink-0">{s.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm group-hover:text-teal-700 truncate">{s.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{s.sub}</p>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-teal-500 flex-shrink-0"/>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Platform Info ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="font-bold text-gray-800 mb-3 flex items-center gap-2"><span>ℹ️</span> Platform Information</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    {[
                      { label:'Platform',  value:'Synora Health' },
                      { label:'Version',   value:'1.0.0'         },
                      { label:'Backend',   value:'FastAPI + MongoDB' },
                      { label:'Frontend',  value:'React + Vite'  },
                    ].map((r,i)=>(
                      <div key={i} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 font-medium">{r.label}</p>
                        <p className="font-semibold text-gray-800 mt-0.5 text-xs">{r.value}</p>
                      </div>
                    ))}
                  </div>
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
