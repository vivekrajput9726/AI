import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Video, Mic, MicOff, PhoneOff, Phone, MapPin,
  AlertCircle, Loader, Copy, CheckCircle, ExternalLink,
  User, Clock, Calendar, IndianRupee, ArrowLeft,
  Maximize2, Minimize2
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

// ── Type Config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  video: {
    label: 'Video Consultation',
    icon: Video,
    color: 'bg-blue-600',
    light: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700',
  },
  voice: {
    label: 'Voice Call',
    icon: Phone,
    color: 'bg-green-600',
    light: 'bg-green-50 border-green-200',
    textColor: 'text-green-700',
  },
  'in-person': {
    label: 'In-Person Visit',
    icon: MapPin,
    color: 'bg-orange-500',
    light: 'bg-orange-50 border-orange-200',
    textColor: 'text-orange-700',
  },
}

// ── Step Badge ────────────────────────────────────────────────────────────────
function Step({ n, label, done }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
        {done ? <CheckCircle size={14} /> : n}
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function VideoConsultation() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [joining, setJoining] = useState(false)
  const [inRoom, setInRoom] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const isDoctor = user?.role === 'doctor'

  useEffect(() => {
    api.get(`/appointments/${appointmentId}`)
      .then(r => setAppointment(r.data))
      .catch(() => toast.error('Could not load appointment'))
      .finally(() => setLoading(false))
  }, [appointmentId])

  const copyLink = () => {
    if (!appointment?.meeting_link) return
    navigator.clipboard.writeText(appointment.meeting_link)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoin = () => {
    if (appointment?.meeting_link) {
      setJoining(true)
      setTimeout(() => {
        window.open(appointment.meeting_link, '_blank')
        setJoining(false)
      }, 500)
    }
  }

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500">Loading consultation details...</p>
        </div>
      </div>
    </DashboardLayout>
  )

  if (!appointment) return (
    <DashboardLayout>
      <div className="max-w-md mx-auto text-center py-16">
        <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
        <p className="text-gray-600 font-medium">Appointment not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 btn-secondary">Go Back</button>
      </div>
    </DashboardLayout>
  )

  const aptType = appointment.appointment_type || 'video'
  const config = TYPE_CONFIG[aptType] || TYPE_CONFIG.video
  const Icon = config.icon
  const otherPerson = isDoctor ? appointment.patient_name : appointment.doctor_name
  const hasLink = !!appointment.meeting_link
  const isConfirmed = appointment.status === 'confirmed'

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-8">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft size={15} /> Back
        </button>

        {/* Header Card */}
        <div className={`rounded-2xl p-5 border-2 ${config.light}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 ${config.color} rounded-2xl flex items-center justify-center`}>
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900">{config.label}</h1>
              <p className={`text-sm font-medium ${config.textColor}`}>
                {isDoctor ? `Patient: ${otherPerson}` : `Doctor: ${otherPerson}`}
              </p>
            </div>
            <div className="ml-auto">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                isConfirmed ? 'bg-green-100 text-green-700' :
                appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              } capitalize`}>{appointment.status}</span>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Calendar, label: 'Date', value: appointment.appointment_date },
              { icon: Clock, label: 'Time', value: appointment.appointment_time },
              { icon: User, label: isDoctor ? 'Patient' : 'Doctor', value: otherPerson },
              { icon: IndianRupee, label: 'Fee', value: `₹${appointment.consultation_fee}` },
            ].map(({ icon: I, label, value }) => (
              <div key={label} className="bg-white/60 rounded-xl p-3 flex items-center gap-2">
                <I size={14} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── VIDEO CALL ── */}
        {aptType === 'video' && (
          <>
            {/* Not yet in room — show info */}
            {!inRoom && (
              <div className="card space-y-5">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Video size={18} className="text-blue-600" /> Video Consultation Room
                </h2>

                <div className="space-y-3">
                  {isDoctor ? (
                    <>
                      <Step n={1} label="Confirm the appointment from your Appointments tab" done={isConfirmed} />
                      <Step n={2} label="Meeting room is auto-created on confirmation" done={hasLink} />
                      <Step n={3} label='Click "Start Video Call" — room opens inside the app' done={false} />
                    </>
                  ) : (
                    <>
                      <Step n={1} label="Wait for doctor to confirm your appointment" done={isConfirmed} />
                      <Step n={2} label="Meeting room is ready once confirmed" done={hasLink} />
                      <Step n={3} label='Click "Join Video Call" — room opens inside the app' done={false} />
                    </>
                  )}
                </div>

                {!isConfirmed && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
                    <AlertCircle size={15} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-800">Appointment not confirmed yet</p>
                      <p className="text-xs text-yellow-600 mt-0.5">
                        {isDoctor
                          ? 'Go to Dashboard → Appointments → click Confirm to generate the room.'
                          : 'Doctor needs to confirm your appointment first.'}
                      </p>
                    </div>
                  </div>
                )}

                {hasLink && (
                  <>
                    {/* Room link row */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                      <Video size={14} className="text-gray-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500 truncate flex-1 font-mono">{appointment.meeting_link}</p>
                      <button onClick={copyLink}
                        className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                        {copied ? <><CheckCircle size={12}/> Copied!</> : <><Copy size={12}/> Copy</>}
                      </button>
                    </div>

                    {/* Main join button — type-aware */}
                    <button onClick={() => setInRoom(true)}
                      className={`w-full active:scale-95 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 text-base transition-all shadow-lg ${aptType === 'voice' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {aptType === 'voice' ? <Phone size={22}/> : <Video size={22}/>}
                      {aptType === 'voice'
                        ? (isDoctor ? 'Start Voice Call' : 'Join Voice Call')
                        : (isDoctor ? 'Start Video Call' : 'Join Video Call')}
                    </button>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                      <span>{aptType === 'voice' ? '🎙️ Voice Only — Camera will be OFF' : '📹 Video + Audio — Camera will be ON'}</span>
                    </div>

                    {/* Open in new tab fallback */}
                    <a href={appointment.meeting_link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-blue-600 transition-colors">
                      <ExternalLink size={12}/> Open in new tab instead
                    </a>
                  </>
                )}

                {!hasLink && isConfirmed && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                    <Loader size={15} className="text-blue-500 animate-spin flex-shrink-0 mt-0.5"/>
                    <p className="text-sm text-blue-700">Generating meeting room… please refresh.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── EMBEDDED JITSI ROOM ── */}
            {inRoom && hasLink && (
              <div className={`transition-all ${fullscreen ? 'fixed inset-0 z-50 bg-black' : 'relative'}`}>
                {/* Top bar */}
                <div className={`flex items-center justify-between px-4 py-2 ${fullscreen ? 'bg-gray-900' : 'bg-gray-900 rounded-t-2xl'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"/>
                    <span className="text-white text-sm font-semibold">
                      {isDoctor ? `Consulting: ${appointment.patient_name}` : `Dr. ${appointment.doctor_name}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setFullscreen(f => !f)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                      title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                      {fullscreen ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
                    </button>
                    <button onClick={() => { setInRoom(false); setFullscreen(false) }}
                      className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
                      <PhoneOff size={14}/> End Call
                    </button>
                  </div>
                </div>

                {/* Jitsi iframe — video ON for video calls, OFF for voice */}
                <iframe
                  src={`${appointment.meeting_link}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=${aptType === 'voice' ? 'true' : 'false'}&config.toolbarButtons=["microphone","camera","chat","fullscreen","hangup"]&userInfo.displayName=${encodeURIComponent(user?.full_name || 'User')}`}
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                  className={`w-full border-0 ${fullscreen ? 'h-screen' : 'rounded-b-2xl'}`}
                  style={{ height: fullscreen ? '100vh' : '580px' }}
                  title={aptType === 'voice' ? 'Voice Consultation' : 'Video Consultation'}
                />

                {!fullscreen && (
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400 px-1">
                    <span className="flex items-center gap-1"><CheckCircle size={11} className="text-green-500"/> End-to-end encrypted</span>
                    <span>Allow camera & microphone in browser if prompted</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── VOICE CALL ── */}
        {aptType === 'voice' && (
          <div className="card space-y-5">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Phone size={18} className="text-green-600" /> Voice Call Instructions
            </h2>

            <div className="space-y-3">
              {isDoctor ? (
                <>
                  <Step n={1} label="Confirm the appointment from your dashboard" done={isConfirmed} />
                  <Step n={2} label="At the scheduled time, call the patient's registered phone number" done={false} />
                  <Step n={3} label="Or start a Jitsi voice-only session using the link below" done={false} />
                </>
              ) : (
                <>
                  <Step n={1} label="Doctor confirms your appointment" done={isConfirmed} />
                  <Step n={2} label="At scheduled time, the doctor will call your registered phone number" done={false} />
                  <Step n={3} label="Or join the voice session using the link below" done={false} />
                </>
              )}
            </div>

            {!isConfirmed && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
                <AlertCircle size={15} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700">
                  {isDoctor ? 'Confirm the appointment first to proceed.' : 'Waiting for doctor to confirm your appointment.'}
                </p>
              </div>
            )}

            {/* Phone call option */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-3">
              <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                <Phone size={26} className="text-white" />
              </div>
              <p className="font-bold text-gray-900">Phone Call</p>
              <p className="text-sm text-gray-500">
                {isDoctor
                  ? `Call the patient at their registered phone number at ${appointment.appointment_time} on ${appointment.appointment_date}.`
                  : `The doctor will call you at your registered phone number at ${appointment.appointment_time} on ${appointment.appointment_date}. Keep your phone available.`}
              </p>
            </div>

            {/* OR Jitsi voice embedded */}
            {hasLink && !inRoom && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">OR join voice session online</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <button onClick={() => setInRoom(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 text-base transition-all shadow-lg">
                  <Phone size={20} /> {isDoctor ? 'Start Voice Session' : 'Join Voice Session'}
                </button>
              </>
            )}

            {inRoom && hasLink && (
              <div className="rounded-2xl overflow-hidden border border-gray-200">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"/>
                    <span className="text-white text-sm font-semibold">Voice Session Live</span>
                  </div>
                  <button onClick={() => setInRoom(false)}
                    className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
                    <PhoneOff size={14}/> End
                  </button>
                </div>
                <iframe
                  src={`${appointment.meeting_link}#config.prejoinPageEnabled=false&config.startWithVideoMuted=true&config.startWithAudioMuted=false&userInfo.displayName=${encodeURIComponent(user?.full_name || 'User')}`}
                  allow="camera; microphone; fullscreen; autoplay"
                  className="w-full border-0"
                  style={{ height: '500px' }}
                  title="Voice Consultation"
                />
              </div>
            )}
          </div>
        )}

        {/* ── IN-PERSON ── */}
        {aptType === 'in-person' && (
          <div className="card space-y-5">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <MapPin size={18} className="text-orange-500" /> In-Person Visit Instructions
            </h2>

            <div className="space-y-3">
              {isDoctor ? (
                <>
                  <Step n={1} label="Confirm the appointment from your dashboard" done={isConfirmed} />
                  <Step n={2} label="Patient will visit your clinic at the scheduled time" done={false} />
                  <Step n={3} label="After consultation, write prescription & mark as completed" done={false} />
                </>
              ) : (
                <>
                  <Step n={1} label="Wait for doctor to confirm your appointment" done={isConfirmed} />
                  <Step n={2} label="Visit the clinic at the scheduled date and time" done={false} />
                  <Step n={3} label="Carry your health records and previous prescriptions" done={false} />
                </>
              )}
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900">Clinic Location</p>
                  <p className="text-sm text-gray-600 mt-0.5">{appointment.doctor_name}</p>
                  <p className="text-sm text-gray-500">Please arrive 10 minutes early with your appointment details.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                <Clock size={14} className="text-orange-400" />
                <p className="text-sm text-gray-700"><strong>{appointment.appointment_date}</strong> at <strong>{appointment.appointment_time}</strong></p>
              </div>
            </div>

            {!isConfirmed && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
                <AlertCircle size={15} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700">
                  {isDoctor ? 'Confirm this appointment from the Appointments tab.' : 'Waiting for doctor to confirm. You will receive an email/SMS notification.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Common Footer Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <AlertCircle size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Important Notes:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Both doctor and patient must join at the scheduled time</li>
              <li>For video/voice calls, allow microphone & camera in your browser</li>
              <li>Use Chrome or Firefox for best performance</li>
              <li>After consultation, doctor adds prescription and marks it complete</li>
            </ul>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
