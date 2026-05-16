import { useState, useEffect, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { MessageCircle, X, ChevronDown, ChevronUp, Stethoscope, Users } from 'lucide-react'
import api from '../../services/api'
import Chat from './Chat'

export default function ChatInbox() {
  const { user } = useSelector(s => s.auth)
  const isDoctor  = user?.role === 'doctor'
  const isPatient = user?.role === 'patient'

  const [rooms,       setRooms]       = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open,        setOpen]        = useState(false)
  const [activeRoom,  setActiveRoom]  = useState(null)
  const prevUnread = useRef(0)

  const fetchRooms = useCallback(async () => {
    try {
      const res  = await api.get('/chat/rooms')
      const data = res.data || []
      setRooms(data)
      const count = data.filter(r => r.unread).length
      // Auto-open only when a NEW unread appears
      if (count > prevUnread.current) setOpen(true)
      prevUnread.current = count
      setUnreadCount(count)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (!isDoctor && !isPatient) return
    fetchRooms()
    const id = setInterval(fetchRooms, 15000)
    return () => clearInterval(id)
  }, [fetchRooms, isDoctor, isPatient])

  if (!user || (!isDoctor && !isPatient)) return null

  // ── Active chat window ──
  if (activeRoom) {
    return (
      <Chat
        roomId={activeRoom.room_id}
        otherPersonName={activeRoom.name}
        onClose={() => { setActiveRoom(null); fetchRooms() }}
      />
    )
  }

  const accentFrom = isDoctor ? 'from-violet-600' : 'from-teal-600'
  const accentTo   = isDoctor ? 'to-indigo-500'   : 'to-cyan-500'
  const hoverFrom  = isDoctor ? 'hover:from-violet-700' : 'hover:from-teal-700'
  const hoverTo    = isDoctor ? 'hover:to-indigo-600'   : 'hover:to-cyan-600'
  const dotColor   = isDoctor ? 'bg-violet-500' : 'bg-teal-500'
  const hoverBg    = isDoctor ? 'hover:bg-violet-50' : 'hover:bg-teal-50'

  const label      = isDoctor ? 'Patient Replies' : 'Doctor Messages'
  const emptyText  = isDoctor ? 'No patient replies yet' : 'No doctor messages yet'

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">

      {/* Inbox panel */}
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-72 overflow-hidden">
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r ${accentFrom} ${accentTo}`}>
            <div className="flex items-center gap-2">
              {isDoctor ? <Users size={15} className="text-white" /> : <Stethoscope size={15} className="text-white" />}
              <span className="text-white font-bold text-sm">{label}</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <X size={15} />
            </button>
          </div>

          {/* Room list */}
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
            {rooms.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <MessageCircle size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">{emptyText}</p>
              </div>
            ) : rooms.map(room => {
              const displayName = isDoctor
                ? (room.patient_name || 'Patient')
                : `Dr. ${(room.doctor_name || 'Doctor').replace(/^Dr\.?\s*/i, '')}`
              const nameForChat = isDoctor
                ? (room.patient_name || 'Patient')
                : (room.doctor_name || 'Doctor')

              return (
                <button key={room.room_id}
                  onClick={() => { setOpen(false); setActiveRoom({ room_id: room.room_id, name: nameForChat }) }}
                  className={`w-full flex items-start gap-3 px-4 py-3 ${hoverBg} transition-colors text-left`}>
                  <div className={`w-9 h-9 bg-gradient-to-br ${accentFrom} ${accentTo} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                      {room.unread && <span className={`w-2.5 h-2.5 ${dotColor} rounded-full flex-shrink-0`} />}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{room.last_message}</p>
                    {room.last_timestamp && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(room.last_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button onClick={() => setOpen(o => !o)}
        className={`relative flex items-center gap-2 bg-gradient-to-r ${accentFrom} ${accentTo} ${hoverFrom} ${hoverTo} text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95`}>
        {isDoctor ? <Users size={18} /> : <Stethoscope size={18} />}
        <span className="text-sm font-bold">{label}</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
        {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
    </div>
  )
}
