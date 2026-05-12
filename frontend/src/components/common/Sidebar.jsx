import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Stethoscope, Users, Calendar, Video, User, Settings,
  Heart, LogOut, Shield, Activity, FolderOpen, Pill, MapPin, ScanLine
} from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../redux/slices/authSlice'

const patientLinks = [
  { to: '/patient/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patient/symptoms', icon: Activity, label: 'Symptom Checker' },
  { to: '/patient/doctors', icon: Stethoscope, label: 'Find Doctors' },
  { to: '/patient/records', icon: FolderOpen, label: 'Health Records' },
  { to: '/patient/medicines', icon: Pill, label: 'Medicine Reminder' },
  { to: '/patient/nearby', icon: MapPin, label: 'Nearby Places' },
  { to: '/patient/ai-reader', icon: ScanLine, label: 'AI Reader' },
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
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-40 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
              <Heart size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">AI Healthcare</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role} Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {links.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
