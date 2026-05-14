import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Stethoscope, Calendar, User,
  Heart, LogOut, Shield, Activity, FolderOpen, Pill,
  MapPin, FlaskConical, MessageCircle, AlertTriangle,
  FileText, Settings, Plus, ChevronRight, ClipboardList,
  Microscope, Users, Brain, BarChart2, DollarSign, Zap, TrendingUp, Target
} from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import { getInitials } from '../../utils/helpers'

const patientLinks = [
  { to: '/patient/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patient/copilot',    icon: Brain,           label: 'AI Health Copilot',    badge: 'NEW' },
  { to: '/patient/laboratory', icon: FlaskConical,    label: 'AI Health Lab' },
  { to: '/patient/doctors',    icon: Calendar,        label: 'Appointments' },
  { to: '/patient/my-records', icon: FolderOpen,      label: 'Health Records' },
  { to: '/patient/medicines',  icon: Pill,            label: 'Medicine Tracker' },
  { to: '/patient/follow-up',  icon: Activity,        label: 'AI Follow-Up' },
  { to: '/patient/goals',      icon: Target,          label: 'Health Goals',         badge: 'NEW' },
  { to: '/patient/family',     icon: Users,           label: 'Family Health' },
  { to: '/patient/journey',    icon: ClipboardList,   label: 'Health Journey',       badge: 'NEW' },
  { to: '/patient/smart-report',icon: BarChart2,       label: 'Smart Report',         badge: 'NEW' },
  { to: '/patient/emergency',  icon: AlertTriangle,   label: 'Emergency' },
  { to: '/patient/nearby',     icon: Shield,          label: 'Insurance' },
]

const doctorLinks = [
  { tab: 'dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { tab: 'appointments',  icon: Calendar,        label: 'Appointments',     badge: true },
  { tab: 'patients',      icon: Users,           label: 'Patients' },
  { tab: 'consultation',  icon: Stethoscope,     label: 'Consultation Room' },
  { tab: 'ai-assistant',  icon: Brain,           label: 'AI Assistant' },
  { tab: 'prescription',  icon: FileText,        label: 'Prescriptions' },
  { tab: 'schedule',      icon: ClipboardList,   label: 'Schedule' },
  { tab: 'earnings',      icon: DollarSign,      label: 'Earnings' },
  { tab: 'analytics',     icon: BarChart2,       label: 'Analytics' },
]

const adminLinks = [
  { to: '/admin', icon: Shield, label: 'Admin Panel' },
]

function Sidebar({ isOpen, onClose }) {
  const { user }  = useSelector(s => s.auth)
  const aptState  = useSelector(s => s.appointments)
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const location  = useLocation()

  const pendingCount = aptState?.list?.filter(a => a.status === 'pending')?.length || 0
  const currentTab   = new URLSearchParams(location.search).get('tab') || 'dashboard'
  const isDoctor     = user?.role === 'doctor'
  const isAdmin      = user?.role === 'admin'

  const handleLogout = () => { dispatch(logout()); navigate('/') }

  const patientSidebar = (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose}/>}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-40 flex flex-col transform transition-transform duration-300 ${isOpen?'translate-x-0':'-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center shadow">
              <Plus size={18} className="text-white" strokeWidth={3}/>
            </div>
            <div>
              <p className="font-extrabold text-gray-900">Synora <span className="text-blue-600">Health</span></p>
              <p className="text-xs text-gray-400 capitalize">{user?.role} Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {patientLinks.map(({ to, icon: Icon, label, badge }) => (
              <li key={to+label}>
                <NavLink to={to} onClick={onClose}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive?'bg-blue-600 text-white shadow-sm':'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  {({ isActive }) => (<>
                    <Icon size={17} className={isActive?'text-white':'text-gray-400'}/>
                    <span className="flex-1">{label}</span>
                    {badge && <span className="text-xs bg-teal-500 text-white px-1.5 py-0.5 rounded-full font-bold leading-tight">{badge}</span>}
                    {isActive && <ChevronRight size={14} className="text-white/70"/>}
                  </>)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {/* Health Score Card */}
        {user?.role === 'patient' && (
          <div className="mx-3 mb-3 p-4 bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-100 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-700">Health Score</p>
              <Zap size={12} className="text-teal-600"/>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative w-14 h-14">
                <svg viewBox="0 0 56 56" className="-rotate-90 w-full h-full">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="6"/>
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#0d9488" strokeWidth="6"
                    strokeDasharray={`${(82/100)*138} 138`} strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-extrabold text-gray-900 leading-none">82</span>
                  <span className="text-xs text-gray-400">/100</span>
                </div>
              </div>
              <div>
                <p className="font-bold text-green-600 text-sm">Good</p>
                <p className="text-xs text-gray-400 leading-tight">Keep it up! You're doing great.</p>
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors">
              <TrendingUp size={11}/> Improve Score
            </button>
          </div>
        )}

        <div className="p-3 border-t border-gray-100 space-y-0.5">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 w-full">
            <Settings size={17} className="text-gray-400"/> Settings
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 w-full">
            <MessageCircle size={17} className="text-gray-400"/> Help & Support
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full">
            <LogOut size={17} className="text-red-400"/> Logout
          </button>
        </div>
      </aside>
    </>
  )

  const doctorSidebar = (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose}/>}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-900 z-40 flex flex-col transform transition-transform duration-300 ${isOpen?'translate-x-0':'-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>

        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-400 rounded-xl flex items-center justify-center shadow">
              <Plus size={15} className="text-white" strokeWidth={3}/>
            </div>
            <div>
              <p className="font-extrabold text-white text-sm">Synora <span className="text-teal-400">Health</span></p>
              <p className="text-xs text-gray-500">Doctor Panel</p>
            </div>
          </div>
        </div>

        {/* Doctor Profile */}
        <div className="px-4 py-5 border-b border-gray-800">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              {user?.profile_image ? (
                <img src={user.profile_image} alt="" className="w-16 h-16 rounded-full object-cover border-3 border-teal-500 shadow-lg"/>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg border-2 border-teal-400">
                  {getInitials(user?.full_name || 'Doctor')}
                </div>
              )}
              {/* Online dot */}
              <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900"/>
            </div>
            <p className="text-white font-bold text-sm leading-tight">{user?.full_name || 'Dr. Arjun Sharma'}</p>
            <p className="text-teal-400 text-xs mt-0.5">General Physician</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
              <span className="text-green-400 text-xs font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {doctorLinks.map(({ tab, icon: Icon, label, badge }) => {
              const active = currentTab === tab
              return (
                <li key={tab}>
                  <button
                    onClick={() => { navigate(`/doctor/dashboard?tab=${tab}`); onClose?.() }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active?'bg-teal-600 text-white shadow-md':'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                    <Icon size={16} className={active?'text-white':'text-gray-500'}/>
                    <span className="flex-1 text-left">{label}</span>
                    {badge && pendingCount > 0 && (
                      <span className="bg-yellow-400 text-gray-900 text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center">{pendingCount}</span>
                    )}
                    {active && <ChevronRight size={13} className="text-white/60"/>}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-800 space-y-0.5">
          <NavLink to="/doctor/profile" onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white w-full">
            <User size={16} className="text-gray-500"/> Profile
          </NavLink>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white w-full">
            <Settings size={16} className="text-gray-500"/> Settings
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/30 hover:text-red-300 w-full">
            <LogOut size={16} className="text-red-500"/> Logout
          </button>
        </div>
      </aside>
    </>
  )

  const adminSidebar = (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose}/>}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-40 flex flex-col transform transition-transform duration-300 ${isOpen?'translate-x-0':'-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center shadow"><Plus size={18} className="text-white" strokeWidth={3}/></div>
            <div><p className="font-extrabold text-gray-900">Synora <span className="text-blue-600">Health</span></p><p className="text-xs text-gray-400">Admin Panel</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {adminLinks.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={onClose}
              className={({isActive})=>`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive?'bg-blue-600 text-white':'text-gray-600 hover:bg-gray-50'}`}>
              {({isActive})=>(<><Icon size={17} className={isActive?'text-white':'text-gray-400'}/><span>{label}</span></>)}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full">
            <LogOut size={17}/> Logout
          </button>
        </div>
      </aside>
    </>
  )

  if (isDoctor) return doctorSidebar
  if (isAdmin)  return adminSidebar
  return patientSidebar
}

export default Sidebar
