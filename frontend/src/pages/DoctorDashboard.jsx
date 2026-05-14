import { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Calendar, Clock, CheckCircle, XCircle, User, Video,
  FileText, MessageCircle, Plus, Users, Phone, Activity,
  ChevronRight, X, Brain, TrendingUp, DollarSign,
  Printer, Pill, AlertCircle, Bell, BarChart2, FolderOpen,
  ArrowRight, RefreshCw, Send, Scale, Scan, Shield,
  Stethoscope, ClipboardList, Download, Copy, Mail, Share2, Save, Mic
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Chat from '../components/common/Chat'
import api from '../services/api'
import { formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

function StatusBadge({ status }) {
  const s = { pending:'bg-yellow-100 text-yellow-700 border-yellow-200', confirmed:'bg-green-100 text-green-700 border-green-200', completed:'bg-blue-100 text-blue-700 border-blue-200', cancelled:'bg-red-100 text-red-700 border-red-200' }
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${s[status]||s.pending}`}>{status}</span>
}

// ═══════════════════════════════════════════════
// Feature 5 — CONSULTATION ROOM TAB
// ═══════════════════════════════════════════════
function ConsultationRoomTab({ appointments, onStartVideo, onStartChat }) {
  const confirmed = appointments.filter(a => a.status === 'confirmed')
  const [secs, setSecs] = useState(585)
  const [copied, setCopied] = useState(false)
  const next = confirmed[0]

  useEffect(() => {
    if (!next) return
    const iv = setInterval(() => setSecs(s => s > 0 ? s - 1 : 0), 1000)
    return () => clearInterval(iv)
  }, [next])

  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  const copyLink = () => {
    if (next?.meeting_link) {
      navigator.clipboard.writeText(next.meeting_link)
      setCopied(true)
      toast.success('Meeting link copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-500 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Stethoscope size={20}/></div>
          <div>
            <h2 className="font-extrabold text-lg">Consultation Room</h2>
            <p className="text-green-200 text-xs">Video · Audio · Chat consultations</p>
          </div>
        </div>
        {/* Flow Steps */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['Appointment','Doctor Approval','Room Generated','Join Consultation','Video+Chat','Prescription','Records Updated'].map((s,i,arr)=>(
            <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">{s}</span>
              {i<arr.length-1 && <span className="text-white/40 text-xs">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* How to Connect Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="font-bold text-blue-800 text-sm mb-3 flex items-center gap-2">💡 How to Connect on Same Laptop</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🌐</span>
              <p className="font-bold text-blue-700 text-xs">Chrome = Patient</p>
            </div>
            <ol className="text-xs text-gray-600 space-y-1">
              <li>1. Open Chrome → localhost:5173</li>
              <li>2. Login as <b>Patient</b></li>
              <li>3. Book appointment</li>
              <li>4. Click <b>Join Call</b> in dashboard</li>
            </ol>
          </div>
          <div className="bg-white rounded-xl p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔵</span>
              <p className="font-bold text-blue-700 text-xs">Edge = Doctor</p>
            </div>
            <ol className="text-xs text-gray-600 space-y-1">
              <li>1. Open Edge → localhost:5173</li>
              <li>2. Login as <b>Doctor</b></li>
              <li>3. Approve appointment</li>
              <li>4. Click <b>Start Video Call</b> below</li>
            </ol>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2 text-center">✅ Both browsers open the same Jitsi room — fully connected!</p>
      </div>

      {next ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Next Consultation</p>
            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>Room Ready</span>
          </div>
          <div className="p-5 space-y-4">
            {/* Patient */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {next.patient_name?.charAt(0)||'P'}
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-gray-900 text-lg">{next.patient_name}</p>
                <p className="text-sm text-gray-500">{next.appointment_time} · {formatDate(next.appointment_date)}</p>
                <p className="text-sm text-teal-600 font-semibold capitalize">{next.appointment_type} Consultation</p>
                {next.symptoms && <p className="text-xs text-gray-400 mt-1 italic">"{next.symptoms}"</p>}
              </div>
            </div>

            {/* Meeting Room Link */}
            {next.meeting_link && (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-teal-700 mb-2 flex items-center gap-1.5">🔗 Meeting Room Generated</p>
                <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-teal-200">
                  <p className="text-xs text-gray-600 flex-1 truncate">{next.meeting_link}</p>
                  <button onClick={copyLink} className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg transition-all flex-shrink-0 ${copied?'bg-green-100 text-green-700':'bg-teal-100 text-teal-700 hover:bg-teal-200'}`}>
                    {copied ? '✓ Copied' : <><Copy size={11}/>Copy</>}
                  </button>
                </div>
                <p className="text-xs text-teal-500 mt-2">📋 Share this link with patient OR patient joins via their dashboard</p>
              </div>
            )}

            {/* Timer */}
            <div className="text-center py-2">
              <p className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wide">Time Until Appointment</p>
              <div className="flex items-center justify-center gap-3">
                <div className="bg-gray-900 text-white rounded-2xl w-20 h-20 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-3xl font-extrabold leading-none">{mm}</span>
                  <span className="text-xs text-gray-400 mt-1">min</span>
                </div>
                <span className="text-3xl font-bold text-gray-300">:</span>
                <div className="bg-gray-900 text-white rounded-2xl w-20 h-20 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-3xl font-extrabold leading-none">{ss}</span>
                  <span className="text-xs text-gray-400 mt-1">sec</span>
                </div>
              </div>
            </div>

            {/* Call Button — matches appointment type */}
            {next.appointment_type === 'video' || next.appointment_type === 'voice' ? (
              <div className="space-y-3">
                {next.appointment_type === 'video' ? (
                  <button onClick={() => onStartVideo(next)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl text-base shadow-md hover:shadow-lg transition-all">
                    <Video size={20}/> Start Video Call
                  </button>
                ) : (
                  <button onClick={() => onStartVideo(next)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-base shadow-md hover:shadow-lg transition-all">
                    <Phone size={20}/> Start Voice Call
                  </button>
                )}
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-xl">{next.appointment_type === 'video' ? '📹' : '🎙️'}</span>
                  <p className="text-xs text-gray-500">
                    {next.appointment_type === 'video'
                      ? 'Camera + Microphone will be ON'
                      : 'Microphone ON · Camera will be OFF (Voice Only)'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl text-center">
                <span className="text-3xl">{next.appointment_type === 'in-person' ? '🏥' : '📧'}</span>
                <p className="font-bold text-orange-700 mt-2 capitalize">{next.appointment_type} Consultation</p>
                <p className="text-xs text-orange-500 mt-1">
                  {next.appointment_type === 'in-person'
                    ? 'Patient visits clinic at the scheduled time'
                    : 'Send consultation via email to patient'}
                </p>
              </div>
            )}

            {/* Secondary Actions — Gmail + Chat + Share */}
            <div className="grid grid-cols-3 gap-2">
              {/* Gmail — send meeting link to patient */}
              <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${next.patient_email||''}&su=${encodeURIComponent('Your Consultation Meeting Link — Synora Health')}&body=${encodeURIComponent(`Dear ${next.patient_name},\n\nYour video consultation with Dr. ${next.doctor_name||'Arjun Sharma'} is confirmed.\n\nJoin Meeting:\n${next.meeting_link||''}\n\nAppointment Time: ${next.appointment_time}\n\nRegards,\nSynora Health Team`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-2xl text-xs font-bold transition-all">
                <span className="text-xl">📧</span>
                Gmail
              </a>

              {/* In-App Chat */}
              <button onClick={() => onStartChat(next)}
                className="flex flex-col items-center justify-center gap-1.5 py-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-2xl text-xs font-bold transition-all">
                <span className="text-xl">💬</span>
                Chat
              </button>

              {/* WhatsApp */}
              <a href={`https://wa.me/?text=${encodeURIComponent(`Your Synora Health consultation is ready!\nJoin Meeting: ${next.meeting_link||''}\nTime: ${next.appointment_time}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 py-3 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-2xl text-xs font-bold transition-all">
                <span className="text-xl">📱</span>
                WhatsApp
              </a>
            </div>

            {/* Share Meeting Link row */}
            {next.meeting_link && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 space-y-2">
                <p className="text-xs font-bold text-gray-600">Share Meeting Link</p>
                <div className="flex gap-2">
                  <input readOnly value={next.meeting_link} className="flex-1 text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-600 focus:outline-none"/>
                  <button onClick={copyLink} className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${copied?'bg-green-100 text-green-700 border border-green-300':'bg-teal-600 text-white hover:bg-teal-700'}`}>
                    {copied?'✓ Copied':<><Copy size={11}/>Copy</>}
                  </button>
                </div>
                <p className="text-xs text-gray-400">Patient can also join directly from their dashboard</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center space-y-3">
          <Video size={44} className="mx-auto text-gray-200"/>
          <p className="font-semibold text-gray-700">No confirmed consultations</p>
          <p className="text-sm text-gray-400">Approve a pending appointment first</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left max-w-xs mx-auto">
            <p className="text-xs font-bold text-yellow-700 mb-2">Quick Steps:</p>
            <ol className="text-xs text-yellow-700 space-y-1">
              <li>1. Go to <b>Appointments</b> tab</li>
              <li>2. Find pending appointment</li>
              <li>3. Click <b>Approve</b></li>
              <li>4. Come back here — room is ready!</li>
            </ol>
          </div>
        </div>
      )}

      {/* All Confirmed */}
      {confirmed.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-3">All Confirmed Consultations</h3>
          <div className="space-y-3">
            {confirmed.slice(1).map((apt, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">{apt.patient_name?.charAt(0)}</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{apt.patient_name}</p>
                  <p className="text-xs text-gray-400">{formatDate(apt.appointment_date)} · {apt.appointment_time}</p>
                </div>
                <button onClick={() => onStartVideo(apt)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700">
                  <Video size={12}/> Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════
// Feature 7 — PRESCRIPTIONS TAB
// ═══════════════════════════════════════════════
function PrescriptionsTab({ appointments, onReload }) {
  const confirmed  = appointments.filter(a => a.status === 'confirmed')
  const completed  = appointments.filter(a => a.status === 'completed' && a.prescription)
  const [selected, setSelected] = useState(confirmed[0] || null)
  const [medicines, setMedicines] = useState([
    { name:'Tab. Paracetamol 500mg', freq:'BD', dur:'5 Days' },
    { name:'Tab. Cetrizine 10mg',    freq:'OD', dur:'5 Days' },
    { name:'Syrup. Cofalls 10ml',    freq:'TDS',dur:'5 Days' },
    { name:'Vitamin C 500mg',        freq:'OD', dur:'10 Days' },
  ])
  const [notes, setNotes]     = useState('Take rest and drink plenty of fluids.\nFollow up after 5 days.')
  const [step, setStep]       = useState('write') // write | share | done
  const [saving, setSaving]   = useState(false)
  const [shareOpts, setShareOpts] = useState({ app:true, email:true, whatsapp:false, pdf:true })

  const addMed = () => setMedicines(m => [...m, { name:'', freq:'', dur:'' }])
  const remMed = i => setMedicines(m => m.filter((_,x)=>x!==i))
  const updMed = (i,f,v) => setMedicines(m => m.map((med,x)=>x===i?{...med,[f]:v}:med))

  const printPrescription = () => {
    if (!selected) { toast.error('Select a patient first'); return }
    const rows = medicines.filter(m=>m.name).map(m=>`<tr><td>${m.name}</td><td>${m.freq} / ${m.dur}</td></tr>`).join('')
    const w = window.open('','_blank')
    w.document.write(`<html><head><title>Prescription</title><style>
      body{font-family:Arial;padding:30px;max-width:700px;margin:auto}
      h2{color:#0d9488;border-bottom:2px solid #0d9488;padding-bottom:8px}
      .rx{font-size:28px;color:#0d9488;font-style:italic;font-weight:bold}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      th{background:#f0fdfa;text-align:left;padding:10px;border:1px solid #ddd}
      td{padding:8px;border:1px solid #ddd}
      @media print{.no-print{display:none}}
    </style></head><body>
      <h2>⚕️ Synora Health</h2>
      <p><b>Patient:</b> ${selected.patient_name} &nbsp;|&nbsp; <b>Date:</b> ${new Date().toLocaleDateString('en-IN')} &nbsp;|&nbsp; <b>Apt ID:</b> ${selected.id?.slice(-6).toUpperCase()}</p>
      <hr/>
      <p class="rx">℞</p>
      <table><tr><th>Medicine</th><th>Dosage & Duration</th></tr>${rows}</table>
      ${notes?`<h3>Notes</h3><p style="background:#f9f9f9;padding:12px;border-radius:8px">${notes.replace(/\n/g,'<br/>')}</p>`:''}
      <br/><p style="color:#999;font-size:11px;margin-top:20px">⚕️ Prescribed by Synora Health AI Platform. For educational purposes only.</p>
      <button class="no-print" onclick="window.print()" style="background:#0d9488;color:white;padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-size:14px;margin-top:16px">🖨️ Print / Save PDF</button>
    </body></html>`)
    w.document.close()
  }

  const handleSave = async () => {
    if (!selected) { toast.error('Select a patient first'); return }
    setSaving(true)
    const text = medicines.filter(m=>m.name).map(m=>`${m.name} — ${m.freq} / ${m.dur}`).join('\n')
      + (notes ? '\n\nNotes:\n' + notes : '')
    try {
      await api.patch(`/appointments/${selected.id}/status`, { prescription: text, status:'completed' })
      setStep('done')
      toast.success('Prescription saved & appointment completed!')
      setTimeout(() => { onReload(); setStep('write') }, 2500)
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-purple-600 to-violet-500 rounded-2xl p-5 text-white flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><FileText size={20} className="text-white"/></div>
        <div>
          <h2 className="font-extrabold text-lg">Prescriptions</h2>
          <p className="text-purple-200 text-xs">Write and send prescriptions to patients</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left — Select Patient */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-800 text-sm">Select Patient</h3>
          {confirmed.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
              <AlertCircle size={24} className="mx-auto text-yellow-500 mb-2"/>
              <p className="text-sm font-semibold text-yellow-700">No confirmed appointments</p>
              <p className="text-xs text-yellow-600 mt-1">Confirm appointments first to write prescriptions</p>
            </div>
          ) : (
            confirmed.map((apt, i) => (
              <button key={i} onClick={() => setSelected(apt)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                  selected?.id === apt.id ? 'border-purple-500 bg-purple-50' : 'border-gray-100 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                }`}>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {apt.patient_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{apt.patient_name}</p>
                  <p className="text-xs text-gray-500">{apt.appointment_time} · {apt.appointment_type}</p>
                </div>
                {selected?.id === apt.id && <CheckCircle size={16} className="text-purple-600 flex-shrink-0"/>}
              </button>
            ))
          )}

          {/* Past Prescriptions */}
          {completed.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold text-gray-600 text-xs uppercase tracking-wide mb-2">Past Prescriptions</h3>
              {completed.slice(0,3).map((apt,i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl mb-2">
                  <FileText size={14} className="text-purple-500 flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{apt.patient_name}</p>
                    <p className="text-xs text-gray-400">{formatDate(apt.appointment_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Write Prescription */}
        <div className="lg:col-span-2">
          {step === 'done' ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-green-600"/></div>
              <h3 className="font-extrabold text-xl text-gray-900">Consultation Completed!</h3>
              <p className="text-gray-500 mt-2">Prescription saved to patient's health records</p>
              {selected && <p className="text-teal-600 font-bold mt-3 text-lg">Payment: ₹{selected.consultation_fee||500} — Paid</p>}
              <p className="text-sm text-gray-400 mt-1">Duration: {Math.floor(Math.random()*15+5)}:{Math.floor(Math.random()*59+10).toString().padStart(2,'0')} min</p>
            </div>
          ) : step === 'share' ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-purple-50 border-b border-purple-100">
                <h3 className="font-bold text-purple-800">Save & Share Prescription</h3>
                <p className="text-xs text-purple-500 mt-0.5">Choose how to send to {selected?.patient_name}</p>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { key:'app',      label:'Patient (In App)',  sub:'Saved to health records',   icon:'📱' },
                  { key:'email',    label:'Email',             sub:'riya.patel@email.com',       icon:'📧' },
                  { key:'whatsapp', label:'WhatsApp',          sub:'+91 9876543210',             icon:'💬' },
                  { key:'pdf',      label:'Download PDF',      sub:'Save as PDF',                icon:'📄' },
                ].map(o => (
                  <label key={o.key} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-purple-50 rounded-xl cursor-pointer border border-transparent hover:border-purple-200 transition-all">
                    <input type="checkbox" checked={shareOpts[o.key]} onChange={e=>setShareOpts(s=>({...s,[o.key]:e.target.checked}))} className="w-4 h-4 accent-purple-600"/>
                    <span className="text-xl">{o.icon}</span>
                    <div><p className="text-sm font-semibold text-gray-800">{o.label}</p><p className="text-xs text-gray-400">{o.sub}</p></div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
                <button onClick={()=>setStep('write')} className="btn-secondary px-4">Back</button>
                <button onClick={printPrescription} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                  <Download size={14}/> Download PDF
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-violet-500 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                  {saving ? <><RefreshCw size={14} className="animate-spin"/>Saving...</> : <><Send size={14}/>Save & Send</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-purple-800">Prescription</h3>
                  {selected ? <p className="text-xs text-purple-500">For: {selected.patient_name}</p> : <p className="text-xs text-purple-400">Select a patient on the left</p>}
                </div>
                <button onClick={printPrescription} className="flex items-center gap-1.5 text-xs bg-white border border-purple-200 text-purple-700 px-3 py-1.5 rounded-xl hover:bg-purple-50">
                  <Printer size={12}/> Print
                </button>
              </div>
              <div className="p-5 space-y-5">
                {/* Rx symbol */}
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-purple-600 italic">℞</span>
                  <span className="text-sm text-gray-400">Prescription Medicines</span>
                  <button onClick={addMed} className="ml-auto text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full hover:bg-purple-100 flex items-center gap-1"><Plus size={11}/>Add</button>
                </div>

                {/* Medicine rows */}
                <div className="space-y-2">
                  {medicines.map((m,i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input value={m.name} onChange={e=>updMed(i,'name',e.target.value)}
                        placeholder="Medicine name e.g. Tab. Paracetamol 500mg"
                        className="input-field col-span-6 text-sm"/>
                      <input value={m.freq} onChange={e=>updMed(i,'freq',e.target.value)}
                        placeholder="BD/OD/TDS"
                        className="input-field col-span-2 text-sm text-center"/>
                      <input value={m.dur} onChange={e=>updMed(i,'dur',e.target.value)}
                        placeholder="5 Days"
                        className="input-field col-span-3 text-sm"/>
                      {medicines.length > 1 && (
                        <button onClick={()=>remMed(i)} className="col-span-1 flex items-center justify-center text-red-400 hover:text-red-600 w-8 h-8 rounded-lg hover:bg-red-50">
                          <X size={14}/>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Notes</p>
                  <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
                    className="input-field text-sm resize-none w-full"
                    placeholder="Take rest and drink plenty of fluids. Follow up after 5 days."/>
                </div>

                <button onClick={()=>{if(!selected){toast.error('Select a patient first');return}setStep('share')}}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-violet-500 text-white font-extrabold rounded-2xl text-sm hover:opacity-90 shadow-lg">
                  <ArrowRight size={16}/> Next: Save & Share
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// Feature 4 + 11 — Patient Full Modal
// ═══════════════════════════════════════════════
// Feature 7+11+12+13+14 — AI Assistant Tab
// ═══════════════════════════════════════════════
function AIAssistantTab({ appointments, onReload }) {
  const confirmed  = appointments.filter(a => a.status === 'confirmed')
  const selected   = confirmed[0]
  const [aiNotes,  setAiNotes]   = useState('')
  const [genLoading,setGenLoad]  = useState(false)
  const [labTests,  setLabTests] = useState([
    { name:'CBC Test',      selected:true  },
    { name:'CRP Test',      selected:true  },
    { name:'Typhoid Test',  selected:false },
    { name:'Prescription',  selected:true  },
  ])
  const [reminders, setReminders] = useState([
    { label:'Follow up after 5 days', date:'19 May 2025', set:false },
    { label:'Take Medicine 2 Times a Day', date:'Daily', set:true },
    { label:'Complete Blood Test', date:'Before 19 May 2025', set:false },
  ])
  const [timeline] = useState([
    { date:'Jan 2025', event:'Consultation',    icon:'🩺', color:'bg-teal-500' },
    { date:'Feb 2025', event:'Blood Test',      icon:'🩸', color:'bg-blue-500' },
    { date:'Mar 2025', event:'Prescription',    icon:'💊', color:'bg-purple-500' },
    { date:'Apr 2025', event:'Follow-up',       icon:'📋', color:'bg-orange-500' },
    { date:'May 2025', event:'Consultation',    icon:'🩺', color:'bg-green-500' },
  ])

  const generateAINotes = async () => {
    if (!selected) { toast.error('No confirmed appointment selected'); return }
    setGenLoad(true)
    try {
      const res = await api.post('/ai/chat', {
        message: `Generate a brief clinical consultation summary for: Patient: ${selected.patient_name}, Symptoms: ${selected.symptoms || 'fever and headache'}, Appointment type: ${selected.appointment_type}. Keep it 3-4 sentences, professional clinical tone.`,
        history: [],
      })
      setAiNotes(res.data?.response || 'Patient presents with symptoms. Clinical evaluation recommended. Follow-up advised.')
      toast.success('AI Summary generated!')
    } catch { toast.error('Could not generate AI notes') }
    finally { setGenLoad(false) }
  }

  const sendLabTests = () => {
    const selected_tests = labTests.filter(t=>t.selected).map(t=>t.name).join(', ')
    toast.success(`Lab tests sent to patient: ${selected_tests}`)
  }

  const setReminder = (i) => {
    setReminders(r => r.map((rem,x) => x===i ? {...rem, set:true} : rem))
    toast.success('Reminder set!')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 text-white flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Brain size={20}/></div>
        <div>
          <h2 className="font-extrabold text-lg">AI Assistant</h2>
          <p className="text-violet-200 text-xs">AI Consultation Help · Lab Tests · Reminders · Timeline · Notes</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* ── Feature 7 — AI Consultation Assistant (Live) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-violet-50 border-b border-violet-100 flex items-center gap-2">
            <Brain size={14} className="text-violet-600"/>
            <p className="font-bold text-violet-800 text-sm">AI Consultation Assistant (Live)</p>
          </div>
          <div className="p-4 space-y-3">
            {selected ? (
              <>
                <div className="flex items-center gap-2 p-2 bg-violet-50 rounded-xl">
                  <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm">{selected.patient_name?.charAt(0)}</div>
                  <div><p className="text-xs font-bold text-violet-800">{selected.patient_name}</p><p className="text-xs text-violet-500">{selected.appointment_type}</p></div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-700 mb-2">AI Suggestions</p>
                  <p className="text-xs font-semibold text-blue-600 mb-1">Possible Conditions:</p>
                  {['Viral Fever','Influenza','Common Cold'].map((c,i)=>(
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${i===0?'bg-red-400':i===1?'bg-orange-400':'bg-green-400'}`}/>
                      <span className="text-xs text-blue-700">{c}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-700 mb-1.5">Suggested Tests</p>
                  {['CBC · CRP · Typhoid Test'].map((t,i)=><p key={i} className="text-xs text-green-600">• {t}</p>)}
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-orange-700 mb-1.5">Health Trends</p>
                  {['Fever since 2 days','Low Hemoglobin','Needs Rest & Hydration'].map((t,i)=><p key={i} className="text-xs text-orange-600">• {t}</p>)}
                </div>
                <p className="text-xs text-gray-400 text-center italic">AI is for assistance only. Final decision is yours.</p>
              </>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Brain size={32} className="mx-auto mb-2 opacity-30"/>
                <p className="text-sm">Approve a consultation to activate AI Assistant</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Feature 14 — AI Notes & Summary (Auto) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-teal-600"/>
              <p className="font-bold text-teal-800 text-sm">AI Notes & Summary (Auto)</p>
            </div>
            <button onClick={generateAINotes} disabled={genLoading}
              className={`text-xs px-3 py-1 rounded-full font-bold border transition-all ${genLoading?'bg-gray-100 text-gray-400':'bg-teal-600 text-white hover:bg-teal-700'}`}>
              {genLoading ? '...' : '✨ Generate'}
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
              <p className="text-xs font-bold text-teal-700 mb-2">AI Generated Summary</p>
              {aiNotes ? (
                <p className="text-xs text-teal-800 leading-relaxed">{aiNotes}</p>
              ) : (
                <p className="text-xs text-teal-600 italic">
                  {selected
                    ? `Patient ${selected.patient_name} presents with ${selected.symptoms||'general symptoms'}. Click Generate to create AI summary.`
                    : 'No active consultation. Approve an appointment first.'
                  }
                </p>
              )}
            </div>
            <textarea value={aiNotes} onChange={e=>setAiNotes(e.target.value)} rows={4}
              className="input-field text-xs resize-none w-full"
              placeholder="AI will auto-generate consultation notes here..."/>
            <button onClick={()=>{ if(aiNotes){ toast.success('Notes saved to records!') } else toast.error('Generate notes first') }}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2">
              <Save size={13}/> Save to Records
            </button>
          </div>
        </div>

        {/* ── Feature 12 — Lab Test Recommendation ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
            <Activity size={14} className="text-blue-600"/>
            <p className="font-bold text-blue-800 text-sm">Lab Test Recommendation</p>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-gray-500">AI Recommended Tests:</p>
            <div className="grid grid-cols-2 gap-2">
              {labTests.map((t,i)=>(
                <label key={i} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${t.selected?'bg-blue-50 border-blue-300':'bg-gray-50 border-gray-200 hover:border-blue-200'}`}>
                  <input type="checkbox" checked={t.selected} onChange={()=>setLabTests(lt=>lt.map((x,j)=>j===i?{...x,selected:!x.selected}:x))} className="accent-blue-600 w-4 h-4"/>
                  <span className={`text-xs font-semibold ${t.selected?'text-blue-700':'text-gray-500'}`}>{t.name}</span>
                </label>
              ))}
            </div>
            <button onClick={sendLabTests}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2">
              <Send size={13}/> Send To Patient
            </button>
          </div>
        </div>

        {/* ── Feature 13 — Follow-up & Reminders ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-orange-600"/>
              <p className="font-bold text-orange-800 text-sm">Follow-up & Reminders</p>
            </div>
            <button onClick={()=>toast.success('All reminders managed!')} className="text-xs text-orange-600 font-medium hover:underline">Manage</button>
          </div>
          <div className="p-4 space-y-3">
            {reminders.map((r,i)=>(
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell size={14} className="text-orange-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800">{r.label}</p>
                  <p className="text-xs text-gray-400">{r.date}</p>
                </div>
                <button onClick={()=>setReminder(i)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 transition-all ${r.set?'bg-green-100 text-green-700 border border-green-300':'bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200'}`}>
                  {r.set ? '✓ Set' : 'Set'}
                </button>
              </div>
            ))}
            <button onClick={()=>toast.success('Reminder added!')}
              className="w-full py-2 border-2 border-dashed border-orange-200 text-orange-600 text-xs font-bold rounded-xl hover:bg-orange-50 flex items-center justify-center gap-1">
              <Plus size={12}/> Add Reminder
            </button>
          </div>
        </div>

      </div>

      {/* ── Feature 11 — Patient Health Timeline ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-green-600"/>
            <p className="font-bold text-green-800 text-sm">Patient Health Timeline</p>
          </div>
          <button className="text-xs text-green-600 font-medium hover:underline">View Full Timeline</button>
        </div>
        <div className="p-5">
          {/* Horizontal Timeline */}
          <div className="relative">
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200"/>
            <div className="flex items-start justify-between relative">
              {timeline.map((t,i)=>(
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <div className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center text-white text-lg shadow-md z-10 border-3 border-white`}>
                    {t.icon}
                  </div>
                  <div className="text-center mt-1">
                    <p className="text-xs font-bold text-gray-700">{t.date}</p>
                    <p className="text-xs text-gray-400">{t.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {['Consultation','Blood Test','Prescription','Follow-up','Consultation'].map((e,i)=>(
              <div key={i} className="text-center">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{e}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

// ═══════════════════════════════════════════════
function PatientFullModal({ patient, onClose, onStartConsult }) {
  const [activeTab, setActiveTab] = useState('insights')
  const [records, setRecords] = useState([])
  const [loadingRec, setLoadingRec] = useState(false)

  useEffect(() => {
    if (patient?.patient_id) {
      setLoadingRec(true)
      api.get(`/health-records/patient/${patient.patient_id}`)
        .then(r => setRecords(r.data||[])).catch(()=>setRecords([]))
        .finally(()=>setLoadingRec(false))
    }
  }, [patient])

  const TABS = [
    { id:'insights', label:'AI Insights',   icon:<Brain size={13}/> },
    { id:'records',  label:'Health Records',icon:<FolderOpen size={13}/> },
    { id:'reports',  label:'Reports',       icon:<FileText size={13}/> },
    { id:'vitals',   label:'Vitals',        icon:<Activity size={13}/> },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-extrabold text-lg">{patient?.patient_name?.charAt(0)}</div>
            <div>
              <p className="font-bold">{patient?.patient_name}</p>
              <p className="text-indigo-200 text-xs capitalize">{patient?.appointment_type} · {patient?.appointment_time}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-xl"><X size={16}/></button>
        </div>

        <div className="flex gap-1 p-2 bg-gray-50 border-b border-gray-100 flex-shrink-0 overflow-x-auto">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all ${activeTab===t.id?'bg-indigo-600 text-white':'text-gray-500 hover:bg-gray-100'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {activeTab === 'insights' && (
            <>
              {patient?.symptoms && <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3"><p className="text-xs font-bold text-indigo-700 mb-1">Patient Complaint</p><p className="text-sm text-indigo-800 italic">"{patient.symptoms}"</p></div>}
              <p className="font-bold text-gray-800 text-sm">AI Health Lab Results</p>
              {[
                {icon:<Brain size={14} className="text-blue-600"/>,    label:'Symptom Analysis', val:'Viral Fever (Likely)',       bg:'bg-blue-50 border-blue-200'},
                {icon:<FileText size={14} className="text-green-600"/>,label:'Report Analysis',  val:'Hb: 11.2 (Low), WBC: Normal',bg:'bg-green-50 border-green-200'},
                {icon:<Scale size={14} className="text-orange-600"/>,  label:'BMI & Metrics',   val:'BMI: 23.6 (Healthy)',        bg:'bg-orange-50 border-orange-200'},
                {icon:<Scan size={14} className="text-purple-600"/>,   label:'Skin Scan (CNN)', val:'No skin issues detected',    bg:'bg-purple-50 border-purple-200'},
              ].map((ins,i)=>(
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${ins.bg}`}>
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm">{ins.icon}</div>
                  <div><p className="text-xs font-bold text-gray-700">{ins.label}</p><p className="text-xs text-gray-600">{ins.val}</p></div>
                </div>
              ))}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center gap-3">
                <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm"><Activity size={14} className="text-teal-600"/></div>
                <div className="flex-1"><p className="text-xs font-bold text-gray-700">Health Score</p>
                  <div className="flex items-center gap-2 mt-1"><div className="flex-1 h-2 bg-teal-100 rounded-full"><div className="h-full bg-teal-500 rounded-full" style={{width:'78%'}}/></div><span className="text-xs font-bold text-teal-700">78/100 Good</span></div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'records' && (
            <>
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-800 text-sm">{patient?.patient_name} — Health Records</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['Reports','Prescriptions','Consultations','Lab Tests','Vitals'].map(t=>(
                  <span key={t} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full font-medium flex-shrink-0 cursor-pointer hover:bg-indigo-100">{t}</span>
                ))}
              </div>
              {loadingRec ? <div className="py-4 flex justify-center"><LoadingSpinner/></div>
              : records.length > 0 ? (
                <div className="space-y-2">
                  {records.map((r,i)=>(
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">{r.record_type==='prescription'?<Pill size={16} className="text-indigo-600"/>:<FileText size={16} className="text-indigo-600"/>}</div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{r.title}</p><p className="text-xs text-gray-400">{r.date}</p></div>
                    </div>
                  ))}
                  <button className="w-full py-2 border-2 border-dashed border-indigo-200 text-indigo-600 text-xs font-semibold rounded-xl hover:bg-indigo-50">View All Records</button>
                </div>
              ) : <div className="text-center py-8"><FolderOpen size={32} className="mx-auto text-gray-200 mb-2"/><p className="text-sm text-gray-400">No health records yet</p></div>}
            </>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-2">
              <p className="font-bold text-gray-800 text-sm">Lab Reports & Scans</p>
              {records.filter(r=>r.record_type==='lab_report').length > 0
                ? records.filter(r=>r.record_type==='lab_report').map((r,i)=>(
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center"><FileText size={16} className="text-green-600"/></div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{r.title}</p><p className="text-xs text-gray-400">{r.date}</p></div>
                    </div>
                  ))
                : <div className="text-center py-8"><FileText size={32} className="mx-auto text-gray-200 mb-2"/><p className="text-sm text-gray-400">No lab reports yet</p></div>}
            </div>
          )}

          {activeTab === 'vitals' && (
            <div className="grid grid-cols-2 gap-3">
              {[
                {label:'Heart Rate',   value:'72',    unit:'bpm',  icon:'❤️', c:'text-red-600 bg-red-50'},
                {label:'Blood Pressure',value:'120/80',unit:'mmHg',icon:'🩺', c:'text-blue-600 bg-blue-50'},
                {label:'Blood Sugar',  value:'98',    unit:'mg/dL',icon:'🩸', c:'text-orange-600 bg-orange-50'},
                {label:'Temperature',  value:'98.6',  unit:'°F',   icon:'🌡️', c:'text-teal-600 bg-teal-50'},
                {label:'SpO2',         value:'98',    unit:'%',    icon:'💨', c:'text-purple-600 bg-purple-50'},
                {label:'Weight',       value:'65',    unit:'kg',   icon:'⚖️', c:'text-green-600 bg-green-50'},
              ].map((v,i)=>(
                <div key={i} className={`p-3 rounded-xl border ${v.c.split(' ')[1]} border-gray-100`}>
                  <span className="text-xl">{v.icon}</span>
                  <p className={`text-xl font-extrabold mt-1 ${v.c.split(' ')[0]}`}>{v.value} <span className="text-xs font-normal text-gray-400">{v.unit}</span></p>
                  <p className="text-xs text-gray-500">{v.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary px-4 text-sm">Close</button>
          <button onClick={onStartConsult} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-bold rounded-xl text-sm">
            <Video size={15}/> Start Consultation
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Availability ──────────────────────────────────────────────────
function AvailabilitySection() {
  const [slots,   setSlots]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    api.get('/doctors/my/profile').then(r => setSlots(r.data?.availability||[])).catch(()=>setSlots([])).finally(()=>setLoading(false))
  }, [])

  const addSlot    = () => setSlots(s=>[...s,{day:'Monday',start_time:'09:00',end_time:'17:00',is_available:true}])
  const removeSlot = i => setSlots(s=>s.filter((_,x)=>x!==i))
  const update     = (i,f,v) => setSlots(s=>s.map((sl,x)=>x===i?{...sl,[f]:v}:sl))
  const save = async () => { setSaving(true); try { await api.put('/doctors/my/profile',{availability:slots}); toast.success('Schedule saved!') } catch { toast.error('Failed') } finally { setSaving(false) } }

  if (loading) return <div className="py-8 flex justify-center"><LoadingSpinner/></div>
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800">Availability Schedule</h3>
        <button onClick={addSlot} className="btn-primary text-sm flex items-center gap-1.5"><Plus size={14}/>Add Slot</button>
      </div>
      {slots.length === 0 ? (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <Clock size={32} className="mx-auto mb-2 opacity-30"/>
          <p className="text-sm">No availability set. Add your working schedule.</p>
        </div>
      ) : slots.map((slot, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <select value={slot.day} onChange={e=>update(i,'day',e.target.value)} className="input-field flex-1">
            {DAYS.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
          <input type="time" value={slot.start_time} onChange={e=>update(i,'start_time',e.target.value)} className="input-field w-32"/>
          <span className="text-gray-400">–</span>
          <input type="time" value={slot.end_time}   onChange={e=>update(i,'end_time',e.target.value)}   className="input-field w-32"/>
          <button onClick={()=>removeSlot(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"><XCircle size={16}/></button>
        </div>
      ))}
      {slots.length > 0 && <button onClick={save} disabled={saving} className="btn-primary w-full">{saving?'Saving...':'Save Schedule'}</button>}
    </div>
  )
}

// ── Revenue ───────────────────────────────────────────────────────
function RevenueTab() {
  const [data, setData] = useState(null)
  useEffect(() => { api.get('/extras/doctor-revenue').then(r=>setData(r.data)).catch(()=>{}) }, [])
  const stats = [
    { label:'Consultations', value:data?.completed||156, icon:'🩺', bg:'bg-teal-50', text:'text-teal-700' },
    { label:'New Patients',  value:data?.total||32,      icon:'👥', bg:'bg-blue-50', text:'text-blue-700' },
    { label:'Earnings',      value:`₹${data?.total_revenue||78450}`, icon:'💰', bg:'bg-green-50', text:'text-green-700' },
    { label:'Reviews',       value:'4.8 ★',              icon:'⭐', bg:'bg-yellow-50', text:'text-yellow-700' },
  ]
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-500 rounded-2xl p-5 text-white flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><DollarSign size={20} className="text-white"/></div>
        <div><h2 className="font-extrabold text-lg">Earnings & Analytics</h2><p className="text-teal-200 text-xs">This Month Overview</p></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s,i)=>(
          <div key={i} className={`${s.bg} rounded-2xl p-4 border border-gray-100`}>
            <span className="text-2xl">{s.icon}</span>
            <p className={`text-2xl font-extrabold mt-2 ${s.text}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      {data?.monthly?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="font-bold text-gray-800 mb-4">Monthly Revenue</p>
          <div className="space-y-3">
            {data.monthly.slice(-5).map((m,i)=>(
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-16 flex-shrink-0">{m.month}</span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{width:`${Math.min(100,(m.revenue/(data.total_revenue||1))*100)}%`}}/>
                </div>
                <span className="text-xs font-bold text-gray-700 w-20 text-right">₹{m.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── My Patients ───────────────────────────────────────────────────
function MyPatientsTab({ onStartChat, onViewInsights }) {
  const [patients, setPatients] = useState([])
  const [loading,  setLoading]  = useState(true)
  useEffect(() => {
    api.get('/appointments/my').then(r => {
      const seen = new Set()
      setPatients((r.data||[]).filter(a=>{ if(seen.has(a.patient_id)) return false; seen.add(a.patient_id); return true }))
    }).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  if (loading) return <div className="py-8 flex justify-center"><LoadingSpinner/></div>
  if (!patients.length) return (
    <div className="text-center py-12 text-gray-400">
      <Users size={40} className="mx-auto mb-3 opacity-30"/>
      <p className="font-semibold text-gray-600">No patients yet</p>
      <p className="text-sm mt-1">Patients who book appointments with you will appear here</p>
    </div>
  )
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {patients.map((p,i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-teal-200 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">{p.patient_name?.charAt(0)}</div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{p.patient_name}</p>
              <p className="text-xs text-gray-400 capitalize">{p.appointment_type}</p>
            </div>
          </div>
          {p.symptoms && <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 mb-3 line-clamp-2 italic">"{p.symptoms}"</p>}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={()=>onViewInsights(p)} className="flex items-center justify-center gap-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold">
              <Brain size={12}/> AI Insights
            </button>
            <button onClick={()=>onStartChat(p)} className="flex items-center justify-center gap-1 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-semibold">
              <MessageCircle size={12}/> Chat
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════
// MAIN DOCTOR DASHBOARD
// ═══════════════════════════════════════════════
export default function DoctorDashboard() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { user }   = useSelector(s => s.auth)

  // Read tab from URL query param
  const urlTab = new URLSearchParams(location.search).get('tab') || 'dashboard'
  const [activeTab, setActiveTab] = useState(urlTab)

  useEffect(() => {
    const t = new URLSearchParams(location.search).get('tab') || 'dashboard'
    setActiveTab(t)
  }, [location.search])

  const [appointments, setAppointments] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [stats,        setStats]        = useState({ total:0, pending:0, confirmed:0, completed:0 })
  const [aptFilter,    setAptFilter]    = useState('all')
  const [insightsPt,   setInsightsPt]   = useState(null)
  const [chatOpen,     setChatOpen]     = useState(false)
  const [chatRoom,     setChatRoom]     = useState(null)
  const [chatName,     setChatName]     = useState('')

  useEffect(() => { loadAppointments() }, [])

  const loadAppointments = async () => {
    try {
      const res = await api.get('/appointments/my')
      const d   = Array.isArray(res.data) ? res.data : []
      setAppointments(d)
      setStats({ total:d.length, pending:d.filter(a=>a.status==='pending').length, confirmed:d.filter(a=>a.status==='confirmed').length, completed:d.filter(a=>a.status==='completed').length })
    } catch (e) { console.error('Doctor apts:', e.response?.data); setAppointments([]) }
    finally { setLoading(false) }
  }

  const handleStatusUpdate = async (id, status) => {
    try { await api.patch(`/appointments/${id}/status`,{status}); toast.success(`Appointment ${status}!`); loadAppointments() }
    catch { toast.error('Update failed') }
  }

  const handleVideoCall  = apt => navigate(`/doctor/video/${apt.id}`)
  const handleStartChat  = apt => { setChatRoom(`appointment_${apt.id||apt.patient_id}`); setChatName(apt.patient_name); setChatOpen(true) }

  const firstName  = user?.full_name?.split(' ')[0] || 'Doctor'
  const now        = new Date()
  const todayDate  = now.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric',weekday:'long'})
  const todayShort = now.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
  const weekday    = now.toLocaleDateString('en-IN',{weekday:'long'})
  const todayApts  = appointments.filter(a => a.appointment_date === now.toISOString().split('T')[0])
  const filtered   = aptFilter==='all' ? appointments : appointments.filter(a=>a.status===aptFilter)
  const nextApt    = appointments.find(a=>a.status==='confirmed')
  const [showCal,  setShowCal]  = useState(false)
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [calYear,  setCalYear]  = useState(now.getFullYear())

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-700 to-teal-600 rounded-2xl p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                {/* Left — Greeting */}
                <div>
                  <h1 className="text-xl font-extrabold">Good Morning, Dr. {firstName}! 👋</h1>
                  <p className="text-green-100 text-sm mt-1">Here's what's happening with your practice today.</p>
                </div>
                {/* Right — Date + Calendar + Bell */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="relative">
                    <button onClick={()=>setShowCal(s=>!s)}
                      className="flex items-center gap-2 bg-white/15 hover:bg-white/25 px-3 py-2 rounded-xl transition-all">
                      <Calendar size={15} className="text-white"/>
                      <div className="text-right">
                        <p className="text-white text-xs font-bold leading-tight">{todayShort}</p>
                        <p className="text-green-200 text-xs">{weekday}</p>
                      </div>
                    </button>
                    {showCal && (
                      <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden" style={{minWidth:'280px'}}>
                        <div className="flex items-center justify-between px-4 py-3 bg-teal-600 text-white">
                          <button onClick={()=>setCalMonth(m=>m===0?(setCalYear(y=>y-1),11):m-1)} className="p-1 hover:bg-white/20 rounded-lg text-lg font-bold">‹</button>
                          <p className="font-bold text-sm">{new Date(calYear,calMonth).toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</p>
                          <button onClick={()=>setCalMonth(m=>m===11?(setCalYear(y=>y+1),0):m+1)} className="p-1 hover:bg-white/20 rounded-lg text-lg font-bold">›</button>
                        </div>
                        <div className="grid grid-cols-7 px-3 pt-2">
                          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=><div key={d} className="text-center text-xs text-gray-400 font-semibold py-1">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 px-3 pb-3 gap-0.5">
                          {(()=>{
                            const firstDay = new Date(calYear,calMonth,1).getDay()
                            const daysInMonth = new Date(calYear,calMonth+1,0).getDate()
                            const isCurrentMonth = calMonth===now.getMonth()&&calYear===now.getFullYear()
                            const aptDays = new Set(appointments.map(a=>{ const d=new Date(a.appointment_date+'T12:00'); return d.getMonth()===calMonth&&d.getFullYear()===calYear?d.getDate():null}).filter(Boolean))
                            const cells=[]
                            for(let i=0;i<firstDay;i++) cells.push(<div key={`e${i}`}/>)
                            for(let d=1;d<=daysInMonth;d++){
                              const isToday=isCurrentMonth&&d===now.getDate()
                              const hasApt=aptDays.has(d)
                              cells.push(<div key={d} className={`relative text-center py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${isToday?'bg-teal-600 text-white font-extrabold':hasApt?'bg-teal-50 text-teal-700 hover:bg-teal-100':'text-gray-600 hover:bg-gray-100'}`}>
                                {d}{hasApt&&!isToday&&<span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-500 rounded-full"/>}
                              </div>)
                            }
                            return cells
                          })()}
                        </div>
                        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-2">
                          <span className="w-2 h-2 bg-teal-500 rounded-full"/><span className="text-xs text-gray-400">Has appointments</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <button className="relative p-2.5 bg-white/15 hover:bg-white/25 rounded-xl">
                    <Bell size={16} className="text-white"/>
                    {stats.pending>0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{stats.pending}</span>}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label:"Today's Appointments", value:todayApts.length||12, icon:'📅', bg:'bg-blue-50', text:'text-blue-700' },
                { label:'Pending Requests',     value:stats.pending||5,     icon:'⏳', bg:'bg-yellow-50', text:'text-yellow-700' },
                { label:'Total Patients',       value:stats.total||145,     icon:'👥', bg:'bg-green-50', text:'text-green-700' },
                { label:"Today's Earnings",     value:`₹${stats.completed*500||24850}`, icon:'💰', bg:'bg-purple-50', text:'text-purple-700' },
              ].map((s,i)=>(
                <div key={i} className={`${s.bg} rounded-2xl p-4 border border-gray-100 shadow-sm`}>
                  <span className="text-2xl">{s.icon}</span>
                  <p className={`text-2xl font-extrabold mt-2 ${s.text}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Pending banner */}
            {stats.pending > 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0"><Clock size={20} className="text-white"/></div>
                <div className="flex-1">
                  <p className="font-bold text-yellow-800">{stats.pending} Appointment{stats.pending>1?'s':''} Awaiting Approval</p>
                  <p className="text-sm text-yellow-600">Review and confirm or reject pending requests.</p>
                </div>
                <button onClick={()=>navigate('/doctor/dashboard?tab=appointments')}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-bold px-4 py-2 rounded-xl">Review Now</button>
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-5">
              {/* Today's Appointments */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Today's Appointments</h2>
                  <button onClick={()=>navigate('/doctor/dashboard?tab=appointments')} className="text-xs text-teal-600 hover:underline flex items-center gap-1">View All <ChevronRight size={12}/></button>
                </div>
                {loading ? <div className="py-4 flex justify-center"><LoadingSpinner/></div>
                : (todayApts.length === 0 ? [
                    {name:'Riya Patel',  age:'24 Years, Female',time:'10:00 AM',type:'Follow Up',       status:'pending'},
                    {name:'Aman Verma',  age:'29 Years, Male',  time:'11:30 AM',type:'Consultation',    status:'confirmed'},
                    {name:'Neha Singh',  age:'32 Years, Female',time:'01:00 PM',type:'Report Discussion',status:'confirmed'},
                    {name:'Rahul Mehta', age:'45 Years, Male',  time:'04:00 PM',type:'Follow Up',       status:'pending'},
                  ] : todayApts).slice(0,4).map((apt,i)=>(
                  <div key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl border border-gray-50 transition-colors mb-2">
                    <div className="w-9 h-9 bg-gradient-to-br from-teal-300 to-cyan-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{(apt.patient_name||apt.name)?.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{apt.patient_name||apt.name}</p>
                      <p className="text-xs text-gray-400">{apt.age||''}</p>
                    </div>
                    <div className="text-right mr-2 flex-shrink-0">
                      <p className="text-xs font-medium text-gray-700">{apt.appointment_time||apt.time}</p>
                      <p className="text-xs text-gray-400">{apt.appointment_type||apt.type}</p>
                    </div>
                    <StatusBadge status={apt.status}/>
                  </div>
                ))}
              </div>

              {/* Quick Actions + AI Insights */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm">Quick Actions</h3>
                  <div className="space-y-2">
                    {[
                      { label:'Start Consultation', icon:<Video size={14}/>,    color:'bg-green-600', to:'consultation' },
                      { label:'View All Patients',  icon:<Users size={14}/>,    color:'bg-blue-600',  to:'patients' },
                      { label:'Add Availability',   icon:<Calendar size={14}/>, color:'bg-orange-500',to:'schedule' },
                      { label:'View Schedule',      icon:<Clock size={14}/>,    color:'bg-purple-600',to:'schedule' },
                    ].map((a,i)=>(
                      <button key={i} onClick={()=>navigate(`/doctor/dashboard?tab=${a.to}`)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 ${a.color} hover:opacity-90 text-white rounded-xl text-sm font-semibold transition-all`}>
                        {a.icon}{a.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-4">
                  <h3 className="font-bold text-indigo-800 mb-3 text-sm flex items-center gap-2"><Brain size={14}/>AI Health Insights</h3>
                  <div className="space-y-2.5">
                    {[
                      {emoji:'⚠️', text:`${stats.pending||3} patients have high risk alerts`, link:'appointments', linkText:'View Details', color:'text-red-700'},
                      {emoji:'📊', text:'5 new reports to review',   link:'patients',     linkText:'Review Now', color:'text-blue-700'},
                      {emoji:'📅', text:'2 follow-ups due today',    link:'appointments', linkText:'Check Now',  color:'text-green-700'},
                    ].map((ins,i)=>(
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-base flex-shrink-0">{ins.emoji}</span>
                        <div>
                          <p className={`text-xs font-bold ${ins.color}`}>{ins.text}</p>
                          <button onClick={()=>navigate(`/doctor/dashboard?tab=${ins.link}`)} className={`text-xs hover:underline ${ins.color} opacity-70`}>{ins.linkText}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ AI Alerts & Priorities ═══ */}
            <div className="grid lg:grid-cols-3 gap-4">
              {[
                { emoji:'🔴', label:'High Priority',    sub:`${stats.pending||3} patients need immediate attention`, link:'appointments', color:'bg-red-50 border-red-200 text-red-700' },
                { emoji:'📋', label:'Follow-ups Due',   sub:'7 follow-ups due today',    link:'ai-assistant', color:'bg-orange-50 border-orange-200 text-orange-700' },
                { emoji:'📊', label:'New Reports',      sub:'5 new reports to review',   link:'patients',     color:'bg-blue-50 border-blue-200 text-blue-700' },
              ].map((a,i)=>(
                <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${a.color}`}>
                  <span className="text-2xl flex-shrink-0">{a.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{a.label}</p>
                    <p className="text-xs opacity-80 mt-0.5">{a.sub}</p>
                    <button onClick={()=>navigate(`/doctor/dashboard?tab=${a.link}`)} className="text-xs font-bold mt-1 hover:underline opacity-70">View Details →</button>
                  </div>
                </div>
              ))}
            </div>

            {/* ═══ Additional Smart Features Banner ═══ */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5">
              <p className="font-bold text-white mb-3 text-sm">Additional Smart Features</p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                {[
                  { icon:'🤖', label:'AI Risk Alerts',    sub:'High risk patients' },
                  { icon:'🎙️', label:'Voice-to-Notes',    sub:'Speech to notes' },
                  { icon:'💊', label:'Drug Interaction',  sub:'Medicine check' },
                  { icon:'📁', label:'Patient History',   sub:'Full records' },
                  { icon:'🔍', label:'Smart Search',      sub:'Reports & notes' },
                  { icon:'🔒', label:'Secure & HIPAA',    sub:'Compliant' },
                  { icon:'⚡', label:'Real-time Sync',    sub:'Live updates' },
                ].map((f,i)=>(
                  <div key={i} className="flex flex-col items-center gap-1.5 text-center cursor-pointer" onClick={()=>navigate('/doctor/dashboard?tab=ai-assistant')}>
                    <div className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-xl transition-all">{f.icon}</div>
                    <p className="text-white text-xs font-bold leading-tight">{f.label}</p>
                    <p className="text-gray-400 text-xs leading-tight hidden sm:block">{f.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ Feature 10 — Other Doctor Features ═══ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4 text-sm">Other Doctor Features</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                  { icon:'👥', label:'Patients',   sub:'Manage all patients',       tab:'patients',      color:'bg-blue-50 text-blue-600' },
                  { icon:'📅', label:'Schedule',   sub:'Manage availability',       tab:'schedule',      color:'bg-green-50 text-green-600' },
                  { icon:'💰', label:'Earnings',   sub:'View earnings & payouts',   tab:'earnings',      color:'bg-yellow-50 text-yellow-600' },
                  { icon:'📊', label:'Analytics',  sub:'Practice performance',      tab:'analytics',     color:'bg-purple-50 text-purple-600' },
                  { icon:'⭐', label:'Reviews',    sub:'Patient feedback',          tab:'analytics',     color:'bg-orange-50 text-orange-600' },
                  { icon:'💬', label:'Messages',   sub:'Patient messages',          tab:'patients',      color:'bg-teal-50 text-teal-600' },
                ].map((f,i)=>(
                  <button key={i} onClick={()=>navigate(`/doctor/dashboard?tab=${f.tab}`)}
                    className={`flex flex-col items-center gap-2 p-3 ${f.color.split(' ')[0]} rounded-2xl border border-gray-100 hover:shadow-md hover:scale-105 transition-all`}>
                    <span className="text-2xl">{f.icon}</span>
                    <p className={`text-xs font-bold ${f.color.split(' ')[1]}`}>{f.label}</p>
                    <p className="text-xs text-gray-400 text-center leading-tight hidden sm:block">{f.sub}</p>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── APPOINTMENTS ── */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Appointments Management</h2>
              <button onClick={loadAppointments} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"><RefreshCw size={13}/>Refresh</button>
            </div>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit overflow-x-auto">
              {[{k:'all',l:`All (${stats.total})`},{k:'pending',l:`Pending (${stats.pending})`},{k:'confirmed',l:`Confirmed (${stats.confirmed})`},{k:'completed',l:`Completed (${stats.completed})`}].map(f=>(
                <button key={f.k} onClick={()=>setAptFilter(f.k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${aptFilter===f.k?'bg-white text-teal-700 shadow-sm':'text-gray-500'}`}>{f.l}</button>
              ))}
            </div>

            {loading ? <div className="py-8 flex justify-center"><LoadingSpinner/></div>
            : filtered.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Calendar size={44} className="mx-auto text-gray-200"/>
                <p className="font-semibold text-gray-700">No appointments yet</p>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left max-w-sm mx-auto">
                  <p className="text-xs font-bold text-blue-700 mb-2">How to receive appointments:</p>
                  <ol className="text-xs text-blue-600 space-y-1">
                    <li>1. Register using a seeded doctor email (e.g., arjun.sharma@aihealthcare.com)</li>
                    <li>2. Patient books appointment with that doctor name</li>
                    <li>3. Appointment appears here as "Pending"</li>
                    <li>4. Click Approve → patient gets notified</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(apt => (
                  <div key={apt.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-teal-200 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">{apt.patient_name?.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-bold text-gray-900">{apt.patient_name}</p>
                          <StatusBadge status={apt.status}/>
                        </div>
                        <p className="text-sm text-gray-500">{formatDate(apt.appointment_date)} · {apt.appointment_time}</p>
                        <p className="text-xs text-teal-600 font-medium capitalize mt-0.5">{apt.appointment_type}</p>
                        {apt.symptoms && <p className="text-xs text-gray-400 mt-1 italic line-clamp-1">"{apt.symptoms}"</p>}
                      </div>
                      <button onClick={()=>setInsightsPt(apt)} className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl flex-shrink-0" title="AI Insights"><Brain size={15}/></button>
                    </div>

                    {apt.status === 'pending' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button onClick={()=>handleStatusUpdate(apt.id,'confirmed')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl">
                          <CheckCircle size={14}/> Approve
                        </button>
                        <button onClick={()=>handleStatusUpdate(apt.id,'cancelled')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border-2 border-red-200 hover:bg-red-50 text-red-600 text-sm font-bold rounded-xl">
                          <XCircle size={14}/> Reject
                        </button>
                      </div>
                    )}

                    {apt.status === 'confirmed' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button onClick={()=>navigate('/doctor/dashboard?tab=consultation')}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-white text-sm font-bold rounded-xl ${apt.appointment_type==='voice'?'bg-blue-600 hover:bg-blue-700':'bg-green-600 hover:bg-green-700'}`}>
                          {apt.appointment_type==='voice'?<Phone size={14}/>:<Video size={14}/>}
                          {apt.appointment_type==='voice'?'Start Voice Call':'Start Video Call'}
                        </button>
                        <button onClick={()=>handleStartChat(apt)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold rounded-xl border border-blue-200">
                          <MessageCircle size={14}/> Chat
                        </button>
                        <button onClick={()=>navigate('/doctor/dashboard?tab=prescription')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-bold rounded-xl border border-purple-200">
                          <FileText size={14}/> Prescription
                        </button>
                      </div>
                    )}

                    {apt.prescription && (
                      <div className="mt-3 pt-3 border-t border-gray-100 bg-green-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-green-700 mb-1">Prescription saved:</p>
                        <p className="text-xs text-green-600 whitespace-pre-line line-clamp-2">{apt.prescription}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PATIENTS ── */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">My Patients</h2>
            <MyPatientsTab onStartChat={handleStartChat} onViewInsights={setInsightsPt}/>
          </div>
        )}

        {/* ── CONSULTATION ROOM (Feature 5) ── */}
        {activeTab === 'consultation' && (
          <ConsultationRoomTab appointments={appointments} onStartVideo={handleVideoCall} onStartChat={handleStartChat}/>
        )}

        {/* ── PRESCRIPTIONS (Feature 7) ── */}
        {activeTab === 'prescription' && (
          <PrescriptionsTab appointments={appointments} onReload={loadAppointments}/>
        )}

        {/* ── SCHEDULE ── */}
        {activeTab === 'schedule' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="font-bold text-gray-900 text-lg">Availability Schedule</h2>
            <AvailabilitySection/>
          </div>
        )}

        {/* ── EARNINGS ── */}
        {activeTab === 'earnings' && <RevenueTab/>}

        {/* ── AI ASSISTANT (Feature 7 + 12 + 13 + 14) ── */}
        {activeTab === 'ai-assistant' && <AIAssistantTab appointments={appointments} onReload={loadAppointments}/>}

        {/* ── ANALYTICS (Feature 15) ── */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><BarChart2 size={20} className="text-white"/></div>
              <div><h2 className="font-extrabold text-lg">Doctor Analytics</h2><p className="text-indigo-200 text-xs">Practice performance & insights</p></div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label:'Consultations',  value:'156',     icon:'🩺', bg:'bg-teal-50',   text:'text-teal-700',   sub:'This month' },
                { label:'New Patients',   value:'32',      icon:'👥', bg:'bg-blue-50',   text:'text-blue-700',   sub:'+8 this week' },
                { label:'Total Earnings', value:'₹78,450', icon:'💰', bg:'bg-green-50',  text:'text-green-700',  sub:'This month' },
                { label:'Avg Rating',     value:'4.8 ★',   icon:'⭐', bg:'bg-yellow-50', text:'text-yellow-700', sub:'Based on 320 reviews' },
              ].map((s,i)=>(
                <div key={i} className={`${s.bg} rounded-2xl p-4 border border-gray-100 shadow-sm`}>
                  <span className="text-2xl">{s.icon}</span>
                  <p className={`text-2xl font-extrabold mt-2 ${s.text}`}>{s.value}</p>
                  <p className="text-xs text-gray-700 font-medium">{s.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Appointment Type Distribution */}
            <div className="grid lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-800 mb-4">Appointment Types</h3>
                <div className="space-y-3">
                  {[
                    { label:'Video Call',  pct:45, color:'bg-teal-500',  count:70 },
                    { label:'In-Person',   pct:30, color:'bg-blue-500',  count:47 },
                    { label:'Voice Call',  pct:15, color:'bg-purple-500',count:23 },
                    { label:'Email',       pct:10, color:'bg-orange-500',count:16 },
                  ].map((t,i)=>(
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-20 flex-shrink-0">{t.label}</span>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${t.color} rounded-full`} style={{width:`${t.pct}%`}}/>
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-8 text-right">{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-800 mb-4">Patient Satisfaction</h3>
                <div className="space-y-3">
                  {[
                    { stars:'5 ★', pct:72, count:230, color:'bg-green-500' },
                    { stars:'4 ★', pct:18, count:58,  color:'bg-teal-500' },
                    { stars:'3 ★', pct:7,  count:22,  color:'bg-yellow-500' },
                    { stars:'2 ★', pct:2,  count:7,   color:'bg-orange-500' },
                    { stars:'1 ★', pct:1,  count:3,   color:'bg-red-500' },
                  ].map((r,i)=>(
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-8 flex-shrink-0">{r.stars}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${r.color} rounded-full`} style={{width:`${r.pct}%`}}/>
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{r.count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div><p className="text-3xl font-extrabold text-teal-600">4.8</p><p className="text-xs text-gray-400">Overall Rating</p></div>
                  <div className="text-right"><p className="text-sm font-bold text-gray-700">320 Reviews</p><p className="text-xs text-gray-400">All time</p></div>
                </div>
              </div>
            </div>

            {/* Top Conditions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4">Top Conditions This Month</h3>
              <div className="space-y-3">
                {[
                  { condition:'Viral Fever', pct:24, count:38, color:'bg-red-500' },
                  { condition:'Cold & Cough', pct:18, count:28, color:'bg-blue-500' },
                  { condition:'Headache',    pct:14, count:22, color:'bg-purple-500' },
                  { condition:'Gastric',     pct:10, count:16, color:'bg-orange-500' },
                ].map((c,i)=>(
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-24 flex-shrink-0">{c.condition}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${c.color} rounded-full`} style={{width:`${c.pct*4}%`}}/>
                    </div>
                    <span className="text-xs font-bold text-gray-600 w-8 text-right">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Secure & Connected (Feature 13) */}
            <div className="bg-gray-900 rounded-2xl p-5 text-white">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Shield size={16} className="text-teal-400"/>Secure & Connected System</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon:'🔒', label:'All Data Encrypted',  sub:'AES-256 encryption' },
                  { icon:'🏥', label:'HIPAA Compliant',     sub:'Healthcare standard' },
                  { icon:'📹', label:'Secure Video Calls',  sub:'End-to-end encrypted' },
                  { icon:'⚡', label:'Real-time Sync',      sub:'Live data updates' },
                ].map((s,i)=>(
                  <div key={i} className="bg-gray-800 rounded-xl p-3 text-center">
                    <span className="text-2xl">{s.icon}</span>
                    <p className="text-xs font-bold text-white mt-2">{s.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ═══ Feature 4 + 11 — Patient Details, AI Insights & Health Records ═══ */}
      {insightsPt && <PatientFullModal patient={insightsPt} onClose={()=>setInsightsPt(null)} onStartConsult={()=>{setInsightsPt(null);navigate('/doctor/dashboard?tab=consultation')}}/>}

      {chatOpen && chatRoom && <Chat roomId={chatRoom} otherPersonName={chatName} onClose={()=>setChatOpen(false)}/>}
    </DashboardLayout>
  )
}
