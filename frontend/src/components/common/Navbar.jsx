import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LogOut, Menu, X, Plus, Bell, MessageCircle, Search, Settings, User, Moon, Sun, Languages } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const LANG_KEY = 'synora_lang'
import { logout } from '../../redux/slices/authSlice'
import { getInitials } from '../../utils/helpers'

function Navbar({ onMenuToggle, sidebarOpen }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [showDropdown, setShowDropdown] = useState(false)

  const { dark, toggle } = useTheme()
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'en')

  const toggleLang = () => {
    const next = lang === 'en' ? 'hi' : 'en'
    setLang(next)
    localStorage.setItem(LANG_KEY, next)
    window.dispatchEvent(new Event('langchange'))
    toast.success(next === 'hi' ? 'हिंदी भाषा चुनी गई' : 'English selected')
  }

  const requestNotifications = async () => {
    if (!('Notification' in window)) { toast.error('Notifications not supported'); return }
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      toast.success('Notifications enabled!')
      new Notification('Synora Health', { body: 'You will now receive health reminders!', icon: '/favicon.ico' })
    } else {
      toast.error('Notification permission denied')
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  const profilePath = user?.role === 'doctor' ? '/doctor/profile' : '/patient/profile'

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 md:px-6 h-16 gap-4">

        {/* Left — Logo + Mobile Toggle */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={onMenuToggle} className="p-2 rounded-xl hover:bg-gray-100 transition-colors lg:hidden">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center shadow">
              <Plus size={16} className="text-white" strokeWidth={3} />
            </div>
            <span className="font-extrabold text-gray-900 hidden md:block">Synora <span className="text-blue-600">Health</span></span>
          </Link>
        </div>

        {/* Center — Search */}
        <div className="flex-1 max-w-lg hidden sm:block">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search doctors, symptoms, etc..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>
        </div>

        {/* Right — Actions + Profile */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Hindi/English toggle */}
          <button onClick={toggleLang} className="hidden sm:flex items-center gap-1 p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-xs font-bold text-gray-500" title="Toggle language">
            <Languages size={16}/> {lang === 'en' ? 'हिं' : 'EN'}
          </button>

          {/* Push Notifications */}
          <button onClick={requestNotifications} className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors" title="Enable notifications">
            <Bell size={18} className="text-gray-500" />
          </button>

          {/* Dark Mode */}
          <button onClick={toggle} className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors" title={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-gray-500" />}
          </button>

          {/* Bell */}
          <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
            <Bell size={18} className="text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Message */}
          <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
            <MessageCircle size={18} className="text-gray-500" />
          </button>

          {/* Profile */}
          <div className="relative ml-1">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user?.profile_image
                  ? <img src={user.profile_image} alt="" className="w-full h-full rounded-full object-cover" />
                  : getInitials(user?.full_name)
                }
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900 leading-none">{user?.full_name?.split(' ')[0] || 'User'}</p>
                <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.role}</p>
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                </div>
                <Link to={profilePath} onClick={() => setShowDropdown(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <User size={15} className="text-gray-400" /> Profile Settings
                </Link>
                <Link to="/patient/profile" onClick={() => setShowDropdown(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings size={15} className="text-gray-400" /> Settings
                </Link>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button onClick={handleLogout} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors">
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
