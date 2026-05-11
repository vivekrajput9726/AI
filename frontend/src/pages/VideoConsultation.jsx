import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, MessageSquare, Send,
  Monitor, AlertCircle, Loader
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

function VideoConsultation() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerRef = useRef(null)
  const streamRef = useRef(null)

  const [session, setSession] = useState(null)
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [callState, setCallState] = useState('waiting') // waiting | connecting | connected | ended
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    initSession()
    return () => cleanup()
  }, [appointmentId])

  const initSession = async () => {
    try {
      const aptRes = await api.get(`/appointments/${appointmentId}`)
      setAppointment(aptRes.data)

      const sessionRes = await api.post(`/video/session/${appointmentId}`)
      setSession(sessionRes.data)

      if (sessionRes.data.room_url) {
        setCallState('ready_external')
      } else {
        await startLocalMedia()
        setCallState('waiting')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initialize video session')
    } finally {
      setLoading(false)
    }
  }

  const startLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
    } catch (err) {
      toast.error('Camera/microphone access denied')
      setError('Please allow camera and microphone access to start the consultation.')
    }
  }

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
      setVideoEnabled(prev => !prev)
    }
  }

  const toggleAudio = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
      setAudioEnabled(prev => !prev)
    }
  }

  const endCall = async () => {
    cleanup()
    if (session) {
      await api.patch(`/video/session/${session.id}/end`).catch(() => {})
    }
    setCallState('ended')
    toast.success('Call ended')
    setTimeout(() => navigate(-1), 2000)
  }

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    if (peerRef.current) {
      peerRef.current.close()
    }
  }

  const sendChatMsg = () => {
    if (!chatInput.trim()) return
    setMessages(prev => [...prev, { from: user?.full_name, text: chatInput, time: new Date().toLocaleTimeString() }])
    setChatInput('')
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-gray-500">Setting up video session...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (callState === 'ended') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PhoneOff size={28} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Call Ended</h2>
            <p className="text-gray-500">Redirecting you back...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (session?.room_url) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900">Video Consultation</h1>
            {appointment && (
              <p className="text-gray-500 text-sm">
                {user?.role === 'doctor' ? `Patient: ${appointment.patient_name}` : `Doctor: ${appointment.doctor_name}`}
              </p>
            )}
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg" style={{ height: '600px' }}>
            <iframe
              src={session.room_url}
              allow="camera; microphone; fullscreen; speaker; display-capture"
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Video Consultation"
            />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Video Consultation</h1>
          {appointment && (
            <p className="text-gray-500 text-sm">
              {user?.role === 'doctor' ? `Patient: ${appointment.patient_name}` : `Doctor: ${appointment.doctor_name}`}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex gap-3">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          {/* Video Area */}
          <div className="flex-1">
            <div className="bg-gray-900 rounded-2xl overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Waiting overlay */}
              {callState === 'waiting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-center text-white">
                    <div className="w-20 h-20 rounded-full bg-blue-600/20 border-2 border-blue-400 flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
                      <Video size={32} className="text-blue-400" />
                    </div>
                    <p className="font-medium">Waiting for the other participant...</p>
                    <p className="text-gray-400 text-sm mt-1">Share the session link to invite them</p>
                  </div>
                </div>
              )}

              {/* Local video (picture-in-picture) */}
              <div className="absolute bottom-4 right-4 w-36 aspect-video bg-gray-700 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
                {!videoEnabled && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <VideoOff size={20} className="text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={toggleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${audioEnabled ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-red-500 text-white'}`}
                title={audioEnabled ? 'Mute' : 'Unmute'}
              >
                {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              <button
                onClick={toggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${videoEnabled ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-red-500 text-white'}`}
                title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </button>

              <button
                onClick={() => setChatOpen(!chatOpen)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${chatOpen ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                <MessageSquare size={20} />
              </button>

              <button
                onClick={endCall}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg"
                title="End call"
              >
                <PhoneOff size={22} />
              </button>
            </div>
          </div>

          {/* Chat Panel */}
          {chatOpen && (
            <div className="w-72 card flex flex-col animate-slide-up">
              <h3 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Session Chat</h3>
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-48">
                {messages.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No messages yet</p>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium text-blue-600">{msg.from}: </span>
                      <span className="text-gray-700">{msg.text}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMsg()}
                  placeholder="Type a message..."
                  className="input-field text-sm flex-1 py-2"
                />
                <button onClick={sendChatMsg} className="btn-primary p-2 flex-shrink-0">
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            This video consultation is private and secure. All sessions are end-to-end encrypted.
          </p>
        </div>
      </div>

      <style>{`.mirror { transform: scaleX(-1); }`}</style>
    </DashboardLayout>
  )
}

export default VideoConsultation
