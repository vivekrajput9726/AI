import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Stethoscope, Calendar, User,
  Heart, LogOut, Shield, Activity, FolderOpen, Pill,
  MapPin, FlaskConical, MessageCircle, AlertTriangle,
  FileText, Settings, Plus, ChevronRight, ClipboardList,
  Microscope, Users, Brain, Zap
} from 'lucide-react'
// Shield and Activity already imported above
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'

const patientLinks = [
  { to: '/patient/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patient/doctors', icon: Calendar, label: 'Appointments' },
  { to: '/patient/symptoms', icon: Activity, label: 'AI Symptom Checker' },
  { to: '/patient/my-records', icon: FolderOpen, label: 'My Records' },
  { to: '/patient/medicines', icon: Pill, label: 'Medicine Reminder' },
  { to: '/patient/laboratory', icon: FlaskConical, label: 'Laboratory' },
  { to: '/patient/ai-analyzer', icon: Microscope, label: 'AI Health Analyzer' },
  { to: '/patient/nearby', icon: MapPin, label: 'Nearby Hospitals' },
  { to: '/patient/wellness', icon: Heart, label: 'Wellness Hub' },
  { to: '/patient/drug-checker', icon: Pill, label: 'Drug Checker' },
  { to: '/patient/emergency', icon: AlertTriangle, label: 'Emergency SOS' },
  { to: '/patient/prescription-pdf', icon: FileText, label: 'Prescription PDF' },
  { to: '/patient/bmi', icon: Activity, label: 'BMI Calculator' },
  { to: '/patient/diary', icon: ClipboardList, label: 'Symptom Diary' },
  { to: '/patient/vaccines', icon: Shield, label: 'Vaccination Tracker' },
  { to: '/patient/profile', icon: User, label: 'Profile' },
]

const doctorLinks = [
  { to: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/doctor/profile', icon: User, label: 'Profile' },
]

const adminLinks = [
  { to: '/admin', icon: Shield, label: 'Admin Panel' },
]

function Sidebar({ isOpen, onClose }) {
  const { user } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const links = user?.role === 'doctor' ? doctorLinks : user?.role === 'admin' ? adminLinks : patientLinks

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-40 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center shadow">
              <Plus size={18} className="text-white" strokeWidth={3} />
            </div>
            <div>
              <p className="font-extrabold text-gray-900">Synora <span className="text-blue-600">Health</span></p>
              <p className="text-xs text-gray-400 capitalize">{user?.role} Portal</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {links.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={17} className={isActive ? 'text-white' : 'text-gray-400'} />
                      <span className="flex-1">{label}</span>
                      {isActive && <ChevronRight size={14} className="text-white/70" />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom — Settings + Logout */}
        <div className="p-3 border-t border-gray-100 space-y-0.5">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 w-full transition-colors">
            <Settings size={17} className="text-gray-400" /> Settings
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut size={17} className="text-red-400" /> Logout
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
