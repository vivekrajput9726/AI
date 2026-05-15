import { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Calendar, Clock, CheckCircle, XCircle, User, Video,
  FileText, MessageCircle, Plus, Users, Phone, Activity,
  ChevronRight, X, Brain, TrendingUp, DollarSign,
  Printer, Pill, AlertCircle, Bell, BarChart2, FolderOpen,
  ArrowRight, RefreshCw, Send, Scale, Scan, Shield,
  Stethoscope, ClipboardList, Download, Copy, Mail, Share2, Save, Mic,
  CheckSquare, HelpCircle, Settings, CreditCard, UserPlus, Trash2
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Chat from '../components/common/Chat'
import api from '../services/api'
import { formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

// ── Task & Reminders component ──────────────────────────────────────────────
function TaskRemindersSection({ appointments, navigate }) {
  const [tasks, setTasks] = useState([
    { id:1, text:'Review lab reports for today\'s patients', done:false, priority:'High',   time:'9:00 AM' },
    { id:2, text:'Call Priya Patel for follow-up',           done:false, priority:'High',   time:'10:30 AM' },
    { id:3, text:'Update prescription for Amit Verma',       done:true,  priority:'Medium', time:'11:00 AM' },
    { id:4, text:'Check blood test results — Rohit Mehta',   done:false, priority:'Medium', time:'2:00 PM' },
    { id:5, text:'Submit monthly earnings report',           done:false, priority:'Low',    time:'5:00 PM' },
  ])
  const [newTask, setNewTask] = useState('')

  const toggle = id => setTasks(t => t.map(x => x.id===id ? {...x, done:!x.done} : x))
  const del    = id => setTasks(t => t.filter(x => x.id!==id))
  const add    = () => {
    if (!newTask.trim()) return
    setTasks(t => [...t, { id:Date.now(), text:newTask.trim(), done:false, priority:'Medium', time:'Now' }])
    setNewTask('')
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Total',     value:tasks.length,                color:'text-blue-600 bg-blue-50' },
          { label:'Pending',   value:tasks.filter(t=>!t.done).length, color:'text-orange-600 bg-orange-50' },
          { label:'Completed', value:tasks.filter(t=>t.done).length,  color:'text-green-600 bg-green-50' },
        ].map((s,i)=>(
          <div key={i} className={`${s.color.split(' ')[1]} rounded-2xl p-3 text-center border border-gray-100`}>
            <p className={`text-2xl font-extrabold ${s.color.split(' ')[0]}`}>{s.value}</p>
            <p className="text-xs text-gray-600 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add task */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex gap-2">
          <input value={newTask} onChange={e=>setNewTask(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&add()}
            placeholder="Add new task... (press Enter)"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"/>
          <button onClick={add}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 flex items-center gap-1.5">
            <Plus size={14}/> Add
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="font-bold text-gray-800 text-sm">Today's Tasks</p>
        </div>
        <div className="divide-y divide-gray-50">
          {tasks.map(task=>(
            <div key={task.id} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors ${task.done?'opacity-60':''}`}>
              <button onClick={()=>toggle(task.id)}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${task.done?'bg-green-500 border-green-500':'border-gray-300 hover:border-green-400'}`}>
                {task.done && <CheckCircle size={12} className="text-white"/>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.done?'line-through text-gray-400':'text-gray-800'}`}>{task.text}</p>
                <p className="text-xs text-gray-400">{task.time}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                task.priority==='High'?'bg-red-100 text-red-600':task.priority==='Medium'?'bg-yellow-100 text-yellow-600':'bg-gray-100 text-gray-500'
              }`}>{task.priority}</span>
              <button onClick={()=>del(task.id)}
                className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 size={13}/>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Appointment reminders */}
      {appointments.filter(a=>a.status==='confirmed').length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="font-bold text-blue-800 text-sm mb-3 flex items-center gap-2"><Bell size={14}/>Appointment Reminders</p>
          <div className="space-y-2">
            {appointments.filter(a=>a.status==='confirmed').slice(0,3).map((apt,i)=>(
              <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5">
                <Bell size={13} className="text-blue-500 flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{apt.patient_name}</p>
                  <p className="text-xs text-gray-400">{apt.appointment_date} · {apt.appointment_time}</p>
                </div>
                <button onClick={()=>navigate('/doctor/dashboard?tab=appointments')}
                  className="text-xs text-blue-600 font-semibold hover:underline flex-shrink-0">View</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

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
  const [showCal,       setShowCal]       = useState(false)
  const [calMonth,      setCalMonth]      = useState(now.getMonth())
  const [calYear,       setCalYear]       = useState(now.getFullYear())
  const [chartPeriod,   setChartPeriod]   = useState('This Week')
  const [showChartDrop, setShowChartDrop] = useState(false)
  const [diagPeriod,    setDiagPeriod]    = useState('This Month')
  const [showDiagDrop,  setShowDiagDrop]  = useState(false)

  // Chart data per period
  const CHART_DATA = {
    'This Week':  { pts:[[20,90],[80,70],[140,80],[200,45],[260,40],[320,20],[380,15]], labels:['May 9','May 10','May 11','May 12','May 13','May 14','May 15'] },
    'This Month': { pts:[[20,85],[60,75],[100,65],[140,70],[180,55],[220,50],[260,45],[300,35],[340,30],[380,20]], labels:['May 1','May 5','May 8','May 11','May 13','May 15','May 17','May 20','May 25','May 30'] },
    'This Year':  { pts:[[20,80],[60,70],[100,75],[140,60],[180,50],[220,55],[260,40],[300,35],[340,25],[380,15]], labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Dec'] },
  }
  const DIAG_DATA = {
    'This Month': [{label:'Hypertension',pct:35,color:'#3b82f6'},{label:'Heart Disease',pct:25,color:'#8b5cf6'},{label:'Diabetes',pct:20,color:'#f59e0b'},{label:'Thyroid',pct:10,color:'#6b7280'},{label:'Other',pct:10,color:'#e5e7eb'}],
    'Last Month': [{label:'Diabetes',pct:30,color:'#f59e0b'},{label:'Hypertension',pct:28,color:'#3b82f6'},{label:'Heart Disease',pct:22,color:'#8b5cf6'},{label:'Asthma',pct:12,color:'#10b981'},{label:'Other',pct:8,color:'#e5e7eb'}],
    'This Year':  [{label:'Hypertension',pct:32,color:'#3b82f6'},{label:'Diabetes',pct:26,color:'#f59e0b'},{label:'Heart Disease',pct:20,color:'#8b5cf6'},{label:'Thyroid',pct:12,color:'#6b7280'},{label:'Other',pct:10,color:'#e5e7eb'}],
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5 pb-6">
            {/* ══════ STATS ROW ══════ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label:"Today's Appointments", value: todayApts.length || 12,  sub:'4 Upcoming',         icon:'📅', iconBg:'bg-blue-100',   val:'text-gray-900' },
                { label:'Total Patients',        value: stats.total || 1248,     sub:'+18 This Week',      icon:'👥', iconBg:'bg-teal-100',   val:'text-gray-900' },
                { label:'Consultations',         value: stats.completed || 856,  sub:'+22 This Week',      icon:'🩺', iconBg:'bg-orange-100', val:'text-gray-900' },
                { label:'Earnings This Month',   value:'₹2,48,500',              sub:'+16% vs Last Month', icon:'💰', iconBg:'bg-purple-100', val:'text-gray-900' },
              ].map((s,i)=>(
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                  <div className={`w-12 h-12 ${s.iconBg} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0`}>{s.icon}</div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.val} leading-tight mt-0.5`}>{s.value}</p>
                    <p className="text-xs text-green-600 font-medium mt-0.5">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ══════ MAIN 3-COLUMN ══════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* ── Today's Schedule ── */}
              <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <p className="font-bold text-gray-900">Today's Schedule</p>
                    <p className="text-xs text-green-600 font-semibold mt-0.5">{todayShort}</p>
                  </div>
                  <button onClick={()=>navigate('/doctor/dashboard?tab=appointments')}
                    className="text-xs text-blue-600 font-semibold hover:underline">View All</button>
                </div>
                <div className="divide-y divide-gray-50">
                  {loading ? <div className="py-6 flex justify-center"><LoadingSpinner/></div>
                  : (todayApts.length === 0 ? [
                      {patient_name:'Priya Patel',  info:'34 · Female', appointment_time:'10:00 AM', symptoms:'Chest Pain',      appointment_type:'in-person'},
                      {patient_name:'Amit Verma',   info:'45 · Male',   appointment_time:'10:30 AM', symptoms:'Regular Checkup', appointment_type:'video'},
                      {patient_name:'Neha Singh',   info:'28 · Female', appointment_time:'11:00 AM', symptoms:'Follow-up',       appointment_type:'in-person'},
                      {patient_name:'Rohit Mehta',  info:'52 · Male',   appointment_time:'11:30 AM', symptoms:'ECG Review',      appointment_type:'video'},
                      {patient_name:'Kavita Joshi', info:'40 · Female', appointment_time:'12:00 PM', symptoms:'Blood Pressure',  appointment_type:'in-person'},
                    ] : todayApts).slice(0,5).map((apt,i)=>(
                    <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                      <p className="text-xs font-semibold text-gray-500 w-16 flex-shrink-0">{apt.appointment_time||apt.time}</p>
                      <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(apt.patient_name||apt.name||'P').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{apt.patient_name||apt.name}</p>
                        <p className="text-xs text-gray-400">{apt.info||''}</p>
                      </div>
                      <p className="text-xs text-gray-500 hidden sm:block flex-shrink-0 truncate max-w-20">{apt.symptoms||apt.appointment_type}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${apt.appointment_type==='video'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>
                        {apt.appointment_type==='video'?'Video Call':'In Clinic'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-gray-100">
                  <button onClick={()=>navigate('/doctor/dashboard?tab=appointments')}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 font-semibold hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors">
                    <Calendar size={14}/> View Full Schedule
                  </button>
                </div>
              </div>

              {/* ── AI Assistant ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <p className="font-bold text-gray-900">AI Assistant</p>
                  <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">New</span>
                </div>
                <div className="p-5 flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-teal-100 rounded-full flex items-center justify-center">
                    <Brain size={32} className="text-green-600"/>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Hello Dr. {firstName} 👋</p>
                    <p className="text-xs text-gray-500 mt-0.5">How can I help you today?</p>
                  </div>
                  <div className="w-full space-y-2 mt-1">
                    {[
                      { icon:'🔍', label:'Suggest Diagnosis',      tab:'ai-assistant' },
                      { icon:'💊', label:'Drug Interaction Check',  tab:'ai-assistant' },
                      { icon:'📋', label:'Treatment Guidelines',    tab:'ai-assistant' },
                      { icon:'📊', label:'Patient Risk Analysis',   tab:'patients'     },
                    ].map((a,i)=>(
                      <button key={i} onClick={()=>navigate(`/doctor/dashboard?tab=${a.tab}`)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 rounded-xl text-sm font-medium text-gray-700 transition-all text-left">
                        <span className="text-base">{a.icon}</span>{a.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={()=>navigate('/doctor/dashboard?tab=ai-assistant')}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                    <Brain size={15}/> Ask AI Assistant
                  </button>
                </div>
              </div>

              {/* ── Right Column ── */}
              <div className="space-y-4">

                {/* Upcoming Appointments */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-gray-900 text-sm">Upcoming Appointments</p>
                    <button onClick={()=>navigate('/doctor/dashboard?tab=appointments')}
                      className="text-xs text-blue-600 font-semibold hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                    {(appointments.filter(a=>a.status==='confirmed').length>0
                      ? appointments.filter(a=>a.status==='confirmed')
                      : [
                          {patient_name:'Sanjay Kumar', appointment_time:'02:00 PM', symptoms:'Consultation'},
                          {patient_name:'Meera Iyer',   appointment_time:'02:30 PM', symptoms:'Follow-up'},
                          {patient_name:'Arjun Nair',   appointment_time:'03:00 PM', symptoms:'ECG Review'},
                          {patient_name:'Pooja Sharma', appointment_time:'03:30 PM', symptoms:'Consultation'},
                        ]
                    ).slice(0,4).map((apt,i)=>(
                      <div key={i} className="flex items-center gap-2.5">
                        <p className="text-xs text-gray-500 font-medium w-14 flex-shrink-0">{apt.appointment_time}</p>
                        <div className="w-7 h-7 bg-gradient-to-br from-teal-300 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(apt.patient_name||'P').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{apt.patient_name}</p>
                          <p className="text-xs text-gray-400 truncate">{apt.symptoms||apt.appointment_type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-gray-900 text-sm">Recent Activity</p>
                    <button onClick={()=>navigate('/doctor/dashboard?tab=appointments')}
                      className="text-xs text-blue-600 font-semibold hover:underline">View All</button>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { icon:'💊', color:'bg-blue-100',   text:'Prescription created for Priya Patel',    time:'10:15 AM' },
                      { icon:'🧪', color:'bg-green-100',  text:'Lab report uploaded by Amit Verma',       time:'09:45 AM' },
                      { icon:'📅', color:'bg-orange-100', text:'Follow-up scheduled for Neha Singh',      time:'09:30 AM' },
                      { icon:'📋', color:'bg-purple-100', text:'New appointment booked by Kavita Joshi',  time:'08:50 AM' },
                    ].map((a,i)=>(
                      <div key={i} className="flex items-start gap-2.5">
                        <div className={`w-7 h-7 ${a.color} rounded-lg flex items-center justify-center flex-shrink-0 text-sm`}>{a.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 leading-snug">{a.text}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <p className="font-bold text-gray-900 text-sm mb-3">Quick Actions</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { icon:'💊', label:'New Prescription', tab:'prescription' },
                      { icon:'👤', label:'Add Patient',      tab:'patients'     },
                      { icon:'📅', label:'Book Appointment', tab:'appointments' },
                      { icon:'📁', label:'Upload Report',    tab:'patients'     },
                    ].map((a,i)=>(
                      <button key={i} onClick={()=>navigate(`/doctor/dashboard?tab=${a.tab}`)}
                        className="flex flex-col items-center gap-1.5 p-2 bg-gray-50 hover:bg-green-50 rounded-xl border border-gray-100 hover:border-green-200 transition-all">
                        <span className="text-xl">{a.icon}</span>
                        <p className="text-[10px] text-gray-600 font-medium text-center leading-tight">{a.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ══════ CHARTS ROW ══════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Patient Overview Chart */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-gray-900">Patient Overview</p>
                  {/* Working dropdown */}
                  <div className="relative">
                    <button onClick={()=>{ setShowChartDrop(v=>!v); setShowDiagDrop(false) }}
                      className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      {chartPeriod}
                      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 3.5L5 6.5L8 3.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                    </button>
                    {showChartDrop && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden w-32">
                        {['This Week','This Month','This Year'].map(opt=>(
                          <button key={opt} onClick={()=>{ setChartPeriod(opt); setShowChartDrop(false) }}
                            className={`w-full px-3 py-2 text-xs text-left transition-colors ${chartPeriod===opt?'bg-green-50 text-green-700 font-semibold':'text-gray-700 hover:bg-gray-50'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Dynamic chart */}
                {(()=>{
                  const d = CHART_DATA[chartPeriod] || CHART_DATA['This Week']
                  const pts = d.pts
                  const minX=pts[0][0], maxX=pts[pts.length-1][0]
                  const pathD = pts.map(([x,y],i)=>`${i===0?'M':'L'}${x},${y}`).join(' ')
                  const areaD = pathD + ` L${maxX},100 L${minX},100 Z`
                  return (
                    <>
                      <svg viewBox="0 0 400 110" className="w-full h-28">
                        <defs>
                          <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25"/>
                            <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        {[20,40,60,80].map(y=><line key={y} x1="10" y1={y} x2="395" y2={y} stroke="#f3f4f6" strokeWidth="1"/>)}
                        {[{y:20,v:80},{y:40,v:60},{y:60,v:40},{y:80,v:20}].map(l=>(
                          <text key={l.y} x="0" y={l.y+3} fontSize="7" fill="#d1d5db">{l.v}</text>
                        ))}
                        <path d={areaD} fill="url(#cg2)"/>
                        <path d={pathD} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        {pts.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3" fill="#22c55e"/>)}
                      </svg>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
                        {d.labels.map(l=><span key={l}>{l}</span>)}
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Top Diagnoses Donut */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-gray-900">Top Diagnoses</p>
                  {/* Working dropdown */}
                  <div className="relative">
                    <button onClick={()=>{ setShowDiagDrop(v=>!v); setShowChartDrop(false) }}
                      className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      {diagPeriod}
                      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 3.5L5 6.5L8 3.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                    </button>
                    {showDiagDrop && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden w-32">
                        {['This Month','Last Month','This Year'].map(opt=>(
                          <button key={opt} onClick={()=>{ setDiagPeriod(opt); setShowDiagDrop(false) }}
                            className={`w-full px-3 py-2 text-xs text-left transition-colors ${diagPeriod===opt?'bg-green-50 text-green-700 font-semibold':'text-gray-700 hover:bg-gray-50'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Dynamic donut */}
                {(()=>{
                  const diagItems = DIAG_DATA[diagPeriod] || DIAG_DATA['This Month']
                  const circ = 2 * Math.PI * 48  // ~301.6
                  let offset = 0
                  return (
                    <div className="flex items-center gap-6">
                      <div className="relative flex-shrink-0">
                        <svg viewBox="0 0 120 120" width="120" height="120">
                          <circle cx="60" cy="60" r="48" fill="none" stroke="#f3f4f6" strokeWidth="18"/>
                          {diagItems.map((d,i)=>{
                            const dash = (d.pct/100)*circ
                            const seg = (
                              <circle key={i} cx="60" cy="60" r="48" fill="none"
                                stroke={d.color} strokeWidth="18"
                                strokeDasharray={`${dash} ${circ-dash}`}
                                strokeDashoffset={-offset}
                                transform="rotate(-90 60 60)"/>
                            )
                            offset += dash
                            return seg
                          })}
                          <text x="60" y="56" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#111827">
                            {stats.completed||856}
                          </text>
                          <text x="60" y="68" textAnchor="middle" fontSize="8" fill="#6b7280">Total</text>
                        </svg>
                      </div>
                      <div className="space-y-2 flex-1">
                        {diagItems.map((d,i)=>(
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor:d.color}}/>
                            <span className="text-xs text-gray-600 flex-1">{d.label}</span>
                            <span className="text-xs font-bold text-gray-800">{d.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
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

        {/* ── MESSAGES ── */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><MessageCircle size={20}/></div>
              <div>
                <h2 className="font-extrabold text-lg">Messages</h2>
                <p className="text-blue-200 text-xs">Patient conversations & chats</p>
              </div>
            </div>

            {appointments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <MessageCircle size={40} className="mx-auto text-gray-200 mb-3"/>
                <p className="text-gray-500 font-medium">No conversations yet</p>
                <p className="text-gray-400 text-sm mt-1">Start a consultation to begin chatting with patients</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <p className="font-bold text-gray-800 text-sm">Patient Conversations ({appointments.length})</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {appointments.slice(0, 8).map((apt, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => { setChatRoom(`appointment_${apt.id || apt._id}`); setChatName(apt.patient_name); setChatOpen(true) }}>
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {apt.patient_name?.charAt(0) || 'P'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{apt.patient_name}</p>
                        <p className="text-xs text-gray-400 truncate">{apt.symptoms || apt.appointment_type || 'Click to start chat'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">{apt.appointment_date}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                          {apt.status}
                        </span>
                      </div>
                      <div className="w-8 h-8 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                        <MessageCircle size={15} className="text-blue-600"/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
              <MessageCircle size={15} className="text-blue-600 mt-0.5 flex-shrink-0"/>
              <p className="text-xs text-blue-700">Click on any patient to open real-time chat. Chats are linked to their appointment for easy reference.</p>
            </div>
          </div>
        )}

        {/* ── FOLLOW-UPS ── */}
        {activeTab === 'follow-ups' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-teal-600 to-green-600 rounded-2xl p-5 text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Activity size={20}/></div>
              <div>
                <h2 className="font-extrabold text-lg">Follow-Ups</h2>
                <p className="text-teal-200 text-xs">Patient recovery & follow-up tracking</p>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Due Today',     value: appointments.filter(a => a.status === 'confirmed').length || 2,  color: 'text-red-600 bg-red-50',    icon: '🔴' },
                { label: 'This Week',     value: appointments.filter(a => a.status === 'pending').length || 5,    color: 'text-orange-600 bg-orange-50', icon: '⏰' },
                { label: 'Completed',     value: appointments.filter(a => a.status === 'completed').length || 12, color: 'text-green-600 bg-green-50',  icon: '✅' },
              ].map((s, i) => (
                <div key={i} className={`${s.color.split(' ')[1]} rounded-2xl p-4 text-center border border-gray-100`}>
                  <span className="text-2xl">{s.icon}</span>
                  <p className={`text-2xl font-extrabold mt-1 ${s.color.split(' ')[0]}`}>{s.value}</p>
                  <p className="text-xs text-gray-600 font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Follow-up list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="font-bold text-gray-800 text-sm">Follow-Up Appointments</p>
                <button onClick={() => navigate('/doctor/dashboard?tab=appointments')} className="text-xs text-teal-600 hover:underline font-semibold">View All</button>
              </div>
              {appointments.length === 0 ? (
                <div className="py-12 text-center">
                  <Activity size={36} className="mx-auto text-gray-200 mb-3"/>
                  <p className="text-gray-500 text-sm">No follow-ups scheduled</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {appointments.slice(0, 6).map((apt, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {apt.patient_name?.charAt(0) || 'P'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{apt.patient_name}</p>
                        <p className="text-xs text-gray-400">{apt.appointment_date} · {apt.appointment_time}</p>
                        {apt.symptoms && <p className="text-xs text-teal-600 mt-0.5 truncate">{apt.symptoms}</p>}
                      </div>
                      <StatusBadge status={apt.status}/>
                      <div className="flex gap-2 flex-shrink-0">
                        {apt.status === 'pending' && (
                          <button onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700">
                            Confirm
                          </button>
                        )}
                        <button onClick={() => handleStartChat(apt)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 flex items-center gap-1">
                          <MessageCircle size={11}/> Chat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MEDICAL RECORDS ── */}
        {activeTab === 'medical-records' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><FolderOpen size={20}/></div>
              <div>
                <h2 className="font-extrabold text-lg">Medical Records</h2>
                <p className="text-orange-100 text-xs">Patient health records & reports</p>
              </div>
            </div>

            {/* Records from patients */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="font-bold text-gray-800 text-sm">Patient Health Records</p>
              </div>
              {appointments.length === 0 ? (
                <div className="py-12 text-center">
                  <FolderOpen size={36} className="mx-auto text-gray-200 mb-3"/>
                  <p className="text-gray-500 text-sm">No records available</p>
                  <p className="text-gray-400 text-xs mt-1">Records will appear after consultations</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {appointments.filter(a => a.prescription || a.ai_analysis).slice(0, 6).concat(
                    appointments.slice(0, 4)
                  ).slice(0, 6).map((apt, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText size={18} className="text-orange-500"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{apt.patient_name}</p>
                        <p className="text-xs text-gray-400">{apt.appointment_type} · {apt.appointment_date}</p>
                        {apt.symptoms && <p className="text-xs text-gray-500 mt-0.5 truncate">{apt.symptoms}</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {apt.prescription && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Rx</span>
                        )}
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${apt.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3">
              <FolderOpen size={15} className="text-orange-600 mt-0.5 flex-shrink-0"/>
              <p className="text-xs text-orange-700">Medical records are automatically saved after each consultation and prescription.</p>
            </div>
          </div>
        )}

        {/* ── PAYMENTS ── */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><DollarSign size={20}/></div>
              <div><h2 className="font-extrabold text-lg">Payments</h2><p className="text-emerald-200 text-xs">View payment history of consultations and transactions</p></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label:'Total Earned',   value:`₹${(stats.completed||12)*500}`,  color:'text-green-600 bg-green-50',   icon:'💰' },
                { label:'This Month',     value:'₹2,48,500',                      color:'text-blue-600 bg-blue-50',     icon:'📅' },
                { label:'Pending Payout', value:'₹12,000',                        color:'text-orange-600 bg-orange-50', icon:'⏳' },
              ].map((s,i)=>(
                <div key={i} className={`${s.color.split(' ')[1]} rounded-2xl p-4 text-center border border-gray-100`}>
                  <span className="text-2xl">{s.icon}</span>
                  <p className={`text-xl font-extrabold mt-1 ${s.color.split(' ')[0]}`}>{s.value}</p>
                  <p className="text-xs text-gray-600 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100"><p className="font-bold text-gray-800 text-sm">Transaction History</p></div>
              <div className="divide-y divide-gray-50">
                {(appointments.filter(a=>a.status==='completed').length>0 ? appointments.filter(a=>a.status==='completed') : [
                  {patient_name:'Priya Patel',  appointment_date:'2026-05-15', consultation_fee:500, appointment_type:'video'},
                  {patient_name:'Amit Verma',   appointment_date:'2026-05-14', consultation_fee:500, appointment_type:'in-person'},
                  {patient_name:'Neha Singh',   appointment_date:'2026-05-13', consultation_fee:500, appointment_type:'video'},
                  {patient_name:'Rohit Mehta',  appointment_date:'2026-05-12', consultation_fee:500, appointment_type:'in-person'},
                ]).slice(0,8).map((apt,i)=>(
                  <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                    <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <DollarSign size={16} className="text-green-600"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{apt.patient_name}</p>
                      <p className="text-xs text-gray-400">{apt.appointment_type} · {apt.appointment_date}</p>
                    </div>
                    <span className="text-sm font-bold text-green-600">+₹{apt.consultation_fee||500}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Paid</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Bell size={20}/></div>
                <div><h2 className="font-extrabold text-lg">Notifications</h2><p className="text-red-100 text-xs">All alerts, appointment updates and system notifications</p></div>
              </div>
              <span className="bg-white text-red-600 text-sm font-extrabold px-3 py-1 rounded-full">8 New</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {[
                { icon:'📅', color:'bg-blue-100',   title:'New Appointment Booked',          sub:'Priya Patel booked for 16 May · 10:00 AM', time:'2m ago',   unread:true },
                { icon:'✅', color:'bg-green-100',  title:'Appointment Confirmed',            sub:'Amit Verma confirmed for today · 11:30 AM', time:'15m ago',  unread:true },
                { icon:'💊', color:'bg-purple-100', title:'Prescription Acknowledged',        sub:'Neha Singh viewed her prescription',        time:'1h ago',   unread:true },
                { icon:'🔴', color:'bg-red-100',    title:'High Risk Patient Alert',          sub:'Rohit Mehta — Blood pressure elevated',    time:'2h ago',   unread:true },
                { icon:'📋', color:'bg-orange-100', title:'Lab Report Uploaded',              sub:'New blood test report from City Lab',       time:'3h ago',   unread:true },
                { icon:'⭐', color:'bg-yellow-100', title:'New Patient Review',               sub:'4.8 ★ — Kavita Joshi left a review',        time:'5h ago',   unread:false },
                { icon:'📹', color:'bg-teal-100',   title:'Video Consultation Reminder',      sub:'Consultation in 30 minutes with Raj Kumar', time:'Yesterday',unread:false },
                { icon:'💬', color:'bg-indigo-100', title:'New Message',                      sub:'Sunita Sharma sent you a message',          time:'Yesterday',unread:false },
              ].map((n,i)=>(
                <div key={i} className={`flex items-start gap-3 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer ${n.unread?'bg-blue-50/30':''}`}>
                  <div className={`w-10 h-10 ${n.color} rounded-xl flex items-center justify-center flex-shrink-0 text-lg`}>{n.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${n.unread?'text-gray-900':'text-gray-600'}`}>{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.sub}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{n.time}</p>
                    {n.unread && <span className="w-2 h-2 bg-blue-500 rounded-full block ml-auto mt-1"/>}
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-2.5 border border-gray-200 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-50">
              Mark all as read
            </button>
          </div>
        )}

        {/* ── REFERRALS ── */}
        {activeTab === 'referrals' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-5 text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Users size={20}/></div>
              <div><h2 className="font-extrabold text-lg">Referrals</h2><p className="text-violet-200 text-xs">Refer patients to other specialists and manage referral requests</p></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label:'Sent',     value:'12', color:'text-blue-600 bg-blue-50',   icon:'📤' },
                { label:'Received', value:'5',  color:'text-green-600 bg-green-50', icon:'📥' },
                { label:'Pending',  value:'3',  color:'text-orange-600 bg-orange-50',icon:'⏳' },
              ].map((s,i)=>(
                <div key={i} className={`${s.color.split(' ')[1]} rounded-2xl p-4 text-center border border-gray-100`}>
                  <span className="text-2xl">{s.icon}</span>
                  <p className={`text-2xl font-extrabold mt-1 ${s.color.split(' ')[0]}`}>{s.value}</p>
                  <p className="text-xs text-gray-600 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-gray-800 text-sm">Recent Referrals</p>
                <button onClick={()=>navigate('/doctor/dashboard?tab=patients')} className="text-xs text-violet-600 font-semibold hover:underline">New Referral</button>
              </div>
              {[
                { patient:'Priya Patel',  from:'Dr. {firstName} (You)',  to:'Dr. Ananya Sharma',  spec:'Cardiologist',   date:'May 15', status:'Accepted' },
                { patient:'Rohit Mehta',  from:'Dr. {firstName} (You)',  to:'Dr. Vikram Singh',   spec:'Neurologist',    date:'May 13', status:'Pending' },
                { patient:'Kavita Joshi', from:'Dr. Raj Kumar',          to:'Dr. {firstName}',    spec:'General',        date:'May 12', status:'Accepted' },
              ].map((r,i)=>(
                <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center text-sm font-bold text-violet-600 flex-shrink-0">
                    {r.patient.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{r.patient}</p>
                    <p className="text-xs text-gray-400">→ {r.to} ({r.spec}) · {r.date}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.status==='Accepted'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TASK & REMINDERS ── */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-5 text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><CheckSquare size={20}/></div>
              <div><h2 className="font-extrabold text-lg">Task & Reminders</h2><p className="text-cyan-200 text-xs">Manage daily tasks, pending work and important reminders</p></div>
            </div>
            <TaskRemindersSection appointments={appointments} navigate={navigate}/>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl p-5 text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Settings size={20}/></div>
              <div><h2 className="font-extrabold text-lg">Settings</h2><p className="text-gray-300 text-xs">Update profile, change password, preferences and account settings</p></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon:'👤', label:'Edit Profile',         sub:'Update your name, photo, bio',           action:()=>navigate('/doctor/profile') },
                { icon:'🔒', label:'Change Password',      sub:'Update your account password',           action:()=>navigate('/doctor/profile') },
                { icon:'🔔', label:'Notification Settings',sub:'Manage alerts and reminders',            action:()=>navigate('/doctor/dashboard?tab=notifications') },
                { icon:'📅', label:'Availability Settings',sub:'Set working hours and slots',            action:()=>navigate('/doctor/dashboard?tab=schedule') },
                { icon:'💰', label:'Payment Settings',     sub:'Manage consultation fees',               action:()=>navigate('/doctor/dashboard?tab=payments') },
                { icon:'🌐', label:'Language & Region',    sub:'Change language preferences',            action:()=>{} },
              ].map((s,i)=>(
                <button key={i} onClick={s.action}
                  className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50 text-left transition-all shadow-sm group">
                  <span className="text-3xl">{s.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-700">{s.label}</p>
                    <p className="text-xs text-gray-400">{s.sub}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 ml-auto flex-shrink-0"/>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── HELP & SUPPORT ── */}
        {activeTab === 'help' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><HelpCircle size={20}/></div>
              <div><h2 className="font-extrabold text-lg">Help & Support</h2><p className="text-blue-200 text-xs">Get help, raise support tickets and contact support team</p></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon:'📚', label:'Documentation',    sub:'Read guides and how-to articles',  color:'bg-blue-50 border-blue-100' },
                { icon:'🎥', label:'Video Tutorials',  sub:'Watch feature walkthrough videos', color:'bg-purple-50 border-purple-100' },
                { icon:'💬', label:'Live Chat',        sub:'Chat with our support team',       color:'bg-green-50 border-green-100' },
                { icon:'📧', label:'Email Support',    sub:'support@synorahealth.com',         color:'bg-orange-50 border-orange-100' },
              ].map((h,i)=>(
                <div key={i} className={`flex items-center gap-4 p-4 border rounded-2xl shadow-sm ${h.color}`}>
                  <span className="text-3xl">{h.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{h.label}</p>
                    <p className="text-xs text-gray-500">{h.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="font-bold text-gray-800 mb-4 text-sm">Raise a Support Ticket</p>
              <div className="space-y-3">
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400">
                  <option>Select issue type</option>
                  <option>Appointment issue</option>
                  <option>Payment problem</option>
                  <option>Technical bug</option>
                  <option>Account issue</option>
                  <option>Other</option>
                </select>
                <textarea rows={3} placeholder="Describe your issue..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 resize-none"/>
                <button className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-colors">
                  Submit Ticket
                </button>
              </div>
            </div>
          </div>
        )}

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
