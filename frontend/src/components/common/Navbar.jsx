import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, Menu, X, Heart, Bell } from 'lucide-react'
import { logout } from '../../redux/slices/authSlice'
import { getInitials } from '../../utils/helpers'

function Navbar({ onMenuToggle, sidebarOpen }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  const profilePath = user?.role === 'doctor' ? '/doctor/profile' : '/patient/profile'

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors lg:hidden"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
              <Heart size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 hidden md:block">AI Healthcare</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors relative">
            <Bell size={18} className="text-gray-600" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
                {user?.profile_image ? (
                  <img src={user.profile_image} alt="" className="w-full h-full rounded-lg object-cover" />
                ) : (
                  getInitials(user?.full_name)
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-none">{user?.full_name?.split(' ')[0]}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <Link
                  to={profilePath}
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
