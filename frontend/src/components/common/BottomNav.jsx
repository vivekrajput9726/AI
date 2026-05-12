import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Stethoscope, Activity, User, Shield, FolderOpen, Pill } from 'lucide-react'
import { useSelector } from 'react-redux'

function BottomNav() {
  const { user } = useSelector(s => s.auth)

  const patientLinks = [
    { to: '/patient/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/patient/symptoms', icon: Activity, label: 'Symptoms' },
    { to: '/patient/doctors', icon: Stethoscope, label: 'Doctors' },
    { to: '/patient/records', icon: FolderOpen, label: 'Records' },
    { to: '/patient/medicines', icon: Pill, label: 'Medicines' },
  ]

  const doctorLinks = [
    { to: '/doctor/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/doctor/profile', icon: User, label: 'Profile' },
  ]

  const adminLinks = [
    { to: '/admin', icon: Shield, label: 'Admin' },
  ]

  const links = user?.role === 'doctor' ? doctorLinks : user?.role === 'admin' ? adminLinks : patientLinks

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNav
