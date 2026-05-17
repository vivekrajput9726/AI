import { useState, useRef, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  LogOut, Menu, X, Plus, Bell, Search, Settings, User,
  Moon, Sun, Globe, CheckCircle, MessageCircle, Pill, Calendar,
  FileText, ChevronDown, Clock, AlertCircle
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { logout } from '../../redux/slices/authSlice'
import { getInitials } from '../../utils/helpers'
import api from '../../services/api'

const LANGUAGES = [
  { code: 'en',    label: 'English',            flag: '🇺🇸' },
  { code: 'hi',    label: 'हिंदी (Hindi)',        flag: '🇮🇳' },
  { code: 'bn',    label: 'বাংলা (Bengali)',      flag: '🇧🇩' },
  { code: 'te',    label: 'తెలుగు (Telugu)',      flag: '🇮🇳' },
  { code: 'ta',    label: 'தமிழ் (Tamil)',        flag: '🇮🇳' },
  { code: 'mr',    label: 'मराठी (Marathi)',      flag: '🇮🇳' },
  { code: 'gu',    label: 'ગુજરાતી (Gujarati)',   flag: '🇮🇳' },
  { code: 'pa',    label: 'ਪੰਜਾਬੀ (Punjabi)',     flag: '🇮🇳' },
  { code: 'ur',    label: 'اردو (Urdu)',          flag: '🇵🇰' },
  { code: 'ar',    label: 'العربية (Arabic)',      flag: '🇸🇦' },
  { code: 'zh-CN', label: '中文 (Chinese)',        flag: '🇨🇳' },
  { code: 'ja',    label: '日本語 (Japanese)',     flag: '🇯🇵' },
  { code: 'ko',    label: '한국어 (Korean)',       flag: '🇰🇷' },
  { code: 'es',    label: 'Español (Spanish)',    flag: '🇪🇸' },
  { code: 'fr',    label: 'Français (French)',    flag: '🇫🇷' },
  { code: 'de',    label: 'Deutsch (German)',     flag: '🇩🇪' },
  { code: 'pt',    label: 'Português (Portuguese)',flag: '🇧🇷' },
  { code: 'ru',    label: 'Русский (Russian)',    flag: '🇷🇺' },
  { code: 'it',    label: 'Italiano (Italian)',   flag: '🇮🇹' },
  { code: 'tr',    label: 'Türkçe (Turkish)',     flag: '🇹🇷' },
  { code: 'vi',    label: 'Tiếng Việt (Vietnamese)', flag: '🇻🇳' },
  { code: 'th',    label: 'ภาษาไทย (Thai)',       flag: '🇹🇭' },
  { code: 'id',    label: 'Bahasa Indonesia',     flag: '🇮🇩' },
  { code: 'ms',    label: 'Bahasa Melayu',        flag: '🇲🇾' },
  { code: 'sw',    label: 'Kiswahili (Swahili)',  flag: '🇰🇪' },
]

function changeLanguage(code) {
  if (code === 'en') {
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/`
  } else {
    const val = `/en/${code}`
    document.cookie = `googtrans=${val}; path=/`
    document.cookie = `googtrans=${val}; domain=${window.location.hostname}; path=/`
  }
  window.location.reload()
}

function getCurrentLang() {
  const match = document.cookie.match(/googtrans=\/en\/([^;]+)/)
  return match ? match[1] : 'en'
}

function Navbar({ onMenuToggle, sidebarOpen }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [showDropdown, setShowDropdown]           = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showLangMenu, setShowLangMenu]           = useState(false)
  const [currentLang, setCurrentLang]             = useState(getCurrentLang)
  const [langSearch, setLangSearch]               = useState('')
  const [rawNotifs, setRawNotifs]                 = useState([])
  const [readIds, setReadIds]                     = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('notif_read') || '[]')) }
    catch { return new Set() }
  })
  const langRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (langRef.current && !langRef.current.contains(e.target)) setShowLangMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const res = await api.get('/notifications/')
      setRawNotifs(res.data || [])
    } catch { /* silent */ }
  }, [user])

  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, 30000)
    return () => clearInterval(id)
  }, [fetchNotifications])

  // Re-fetch when bell is opened
  const handleBellClick = () => {
    setShowNotifications(n => !n)
    setShowDropdown(false)
    setShowLangMenu(false)
    fetchNotifications()
  }

  const TYPE_META = {
    appointment_confirmed:  { icon: <CheckCircle size={14} className="text-green-500"/>,  bg: 'bg-green-50'  },
    appointment_pending:    { icon: <Clock size={14} className="text-yellow-500"/>,        bg: 'bg-yellow-50' },
    appointment_cancelled:  { icon: <AlertCircle size={14} className="text-red-500"/>,     bg: 'bg-red-50'    },
    new_appointment:        { icon: <Calendar size={14} className="text-teal-500"/>,       bg: 'bg-teal-50'   },
    medicine_reminder:      { icon: <Pill size={14} className="text-orange-500"/>,         bg: 'bg-orange-50' },
    health_record:          { icon: <FileText size={14} className="text-blue-500"/>,       bg: 'bg-blue-50'   },
    unread_message:         { icon: <MessageCircle size={14} className="text-purple-500"/>,bg: 'bg-purple-50' },
  }

  const notifications = rawNotifs.map(n => ({
    ...n,
    ...(TYPE_META[n.type] || { icon: <Bell size={14} className="text-gray-500"/>, bg: 'bg-gray-50' }),
  }))

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  const markRead = (id) => {
    setReadIds(prev => {
      const next = new Set([...prev, id])
      localStorage.setItem('notif_read', JSON.stringify([...next]))
      return next
    })
  }
  const markAllRead = () => {
    const next = new Set(notifications.map(n => n.id))
    setReadIds(next)
    localStorage.setItem('notif_read', JSON.stringify([...next]))
  }

  const { dark, toggle } = useTheme()

  const handleLogout = () => { dispatch(logout()); navigate('/') }
  const profilePath = user?.role === 'doctor' ? '/doctor/profile' : '/patient/profile'

  const activeLang = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0]
  const filteredLangs = LANGUAGES.filter(l =>
    l.label.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.code.toLowerCase().includes(langSearch.toLowerCase())
  )

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
              placeholder="Search doctors, symptoms, tests..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 flex-shrink-0">

          {/* ── Language Selector (All Languages) ── */}
          <div className="relative hidden sm:block" ref={langRef}>
            <button
              onClick={() => { setShowLangMenu(v => !v); setShowDropdown(false); setShowNotifications(false); }}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl hover:bg-gray-100 transition-colors text-sm text-gray-600 font-medium"
              title="Change language">
              <Globe size={16} className="text-gray-500" />
              <span className="text-base leading-none">{activeLang.flag}</span>
              <ChevronDown size={13} className="text-gray-400" />
            </button>
            {showLangMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-700 mb-2">Select Language</p>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search language..."
                    value={langSearch}
                    onChange={e => setLangSearch(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {filteredLangs.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setCurrentLang(lang.code); setShowLangMenu(false); setLangSearch(''); changeLanguage(lang.code) }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left ${currentLang === lang.code ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}>
                      <span className="text-base flex-shrink-0">{lang.flag}</span>
                      <span className="flex-1 truncate">{lang.label}</span>
                      {currentLang === lang.code && <CheckCircle size={13} className="text-blue-600 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dark Mode */}
          <button onClick={toggle} className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors" title={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-gray-500" />}
          </button>

          {/* ── Notifications Bell ── */}
          <div className="relative">
            <button
              onClick={handleBellClick}
              className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell size={18} className="text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <p className="font-bold text-gray-900 text-sm">Notifications</p>
                  {unreadCount > 0
                    ? <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">{unreadCount} new</span>
                    : <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold">All read</span>
                  }
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0
                    ? <div className="py-8 text-center text-gray-400">
                        <Bell size={24} className="mx-auto mb-2 opacity-30"/>
                        <p className="text-sm font-medium">No notifications</p>
                      </div>
                    : notifications.map((n) => {
                        const isRead = readIds.has(n.id)
                        return (
                          <button key={n.id}
                            onClick={() => { markRead(n.id); setShowNotifications(false) }}
                            className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left ${isRead ? 'opacity-60' : ''}`}>
                            <div className={`w-8 h-8 ${n.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>{n.icon}</div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold ${isRead ? 'text-gray-500' : 'text-gray-800'}`}>{n.title}</p>
                              <p className="text-xs text-gray-500 truncate">{n.sub}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className="text-xs text-gray-400">{n.time}</span>
                              {!isRead && <span className="w-2 h-2 bg-blue-500 rounded-full"/>}
                            </div>
                          </button>
                        )
                      })
                  }
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{unreadCount} unread</span>
                  <button onClick={markAllRead}
                    className="text-xs text-blue-600 font-semibold hover:underline disabled:opacity-40"
                    disabled={unreadCount === 0}>
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative ml-1">
            <button
              onClick={() => { setShowDropdown(!showDropdown); setShowNotifications(false); setShowLangMenu(false) }}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user?.profile_image
                  ? <img src={user.profile_image} alt="" className="w-full h-full rounded-full object-cover" />
                  : getInitials(user?.full_name)
                }
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900 leading-none">{user?.full_name?.split(' ')[0] || 'User'}</p>
                <p className="text-xs text-gray-400 capitalize mt-0.5">
                  {user?.specialization || user?.role || 'View Profile'}
                </p>
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {getInitials(user?.full_name)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-tight">{user?.full_name}</p>
                      <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                    </div>
                  </div>
                </div>

                <Link to={profilePath} onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                    <User size={14} className="text-blue-600" />
                  </div>
                  Profile
                </Link>

                <Link to={profilePath} onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center">
                    <Settings size={14} className="text-gray-500" />
                  </div>
                  Settings
                </Link>

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button onClick={handleLogout}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors">
                    <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
                      <LogOut size={14} className="text-red-500" />
                    </div>
                    Sign Out
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
