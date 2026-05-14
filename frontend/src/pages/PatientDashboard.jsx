import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Heart, Calendar, FileText, Pill, Brain, MapPin,
  AlertTriangle, TrendingUp, ChevronRight, Bell,
  Activity, Moon, Video, X, Star, Plus, ArrowRight,
  RefreshCw, Shield, Phone, Microscope, BarChart2,
  Zap, MessageCircle, Clock, CheckCircle, Upload,
  ArrowUpRight, User, Droplets, Target, Users,
  Watch, Utensils, Share2, Navigation, Wifi
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import { fetchMyAppointments } from '../redux/slices/appointmentSlice'
import { formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

// ── Mini components ────────────────────────────────
function ScoreRing({ score, size = 80, color = '#0d9488' }) {
  const r = size/2-7, circ = 2*Math.PI*r, dash = (score/100)*circ
  return (
    <div className="relative flex-shrink-0" style={{width:size,height:size}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="7"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-extrabold text-gray-900" style={{fontSize:size*0.22}}>{score}</span>
        <span className="text-gray-400" style={{fontSize:size*0.12}}>/100</span>
      </div>
    </div>
  )
}

function SectionCard({ title, badge, children, action, onAction, color='bg-white' }) {
  return (
    <div className={`${color} rounded-2xl border border-gray-100 shadow-sm overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <p className="font-bold text-gray-800 text-xs uppercase tracking-wide">{title}</p>
          {badge && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge==='NEW'?'bg-green-100 text-green-700':badge==='BETA'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'}`}>{badge}</span>}
        </div>
        {action && <button onClick={onAction} className="text-xs text-teal-600 font-semibold hover:underline flex items-center gap-1">{action} <ArrowRight size={10}/></button>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
export default function PatientDashboard() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { user }  = useSelector(s => s.auth)
  const { list: appointments = [] } = useSelector(s => s.appointments || { list: [] })

  const [mood,       setMood]      = useState(null)
  const [followUp,   setFollowUp]  = useState(null)
  const [goals,      setGoals]     = useState([
    { label:'Lose Weight',    current:4.5, target:10,  unit:'kg',      pct:45, icon:'⚖️', color:'text-orange-600' },
    { label:'Improve Sleep',  current:5.5, target:8,   unit:'hrs/8hrs',pct:68, icon:'🌙', color:'text-purple-600' },
    { label:'Control Sugar',  current:98,  target:120, unit:'mg/dL',   pct:70, icon:'🩸', color:'text-red-600' },
  ])
  const [records,    setRecords]   = useState([])
  const [aiInsight,  setAiInsight] = useState('')
  const [insLoading, setInsLoad]   = useState(false)

  useEffect(() => {
    dispatch(fetchMyAppointments())
    api.get('/health-records/my').then(r=>setRecords(r.data||[])).catch(()=>{})
  }, [dispatch])

  const firstName   = user?.full_name?.split(' ')[0] || 'there'
  const fullName    = user?.full_name || 'User'
  const upcomingApt = appointments.find(a=>a.status==='confirmed') || appointments.find(a=>a.status==='pending')
  const recentApts  = appointments.filter(a=>['confirmed','pending'].includes(a.status)).slice(0,3)
  const h = new Date().getHours()
  const greeting = h<12?'Good Morning':h<17?'Good Afternoon':'Good Evening'

  const generateInsight = async () => {
    setInsLoad(true)
    try {
      const res = await api.post('/ai/chat', {
        message: `Give me 3 short personalized health insights for a patient named ${fullName} based on: sleep quality decreased, blood sugar improved, hydration needs improvement. Format as bullet points.`,
        history: []
      })
      setAiInsight(res.data?.response || '')
    } catch { toast.error('Could not generate insights') }
    finally { setInsLoad(false) }
  }

  const MOODS = [
    { emoji:'😄', label:'Great',    color:'bg-green-100 border-green-300' },
    { emoji:'🙂', label:'Good',     color:'bg-blue-100 border-blue-300' },
    { emoji:'😐', label:'Okay',     color:'bg-yellow-100 border-yellow-300' },
    { emoji:'😔', label:'Low',      color:'bg-orange-100 border-orange-300' },
    { emoji:'😢', label:'Bad',      color:'bg-red-100 border-red-300' },
  ]

  const doctors = [
    { name:'Dr. Arjun Sharma',  spec:'Cardiologist',    status:'Online',  wait:'5 mins',  avail:true },
    { name:'Dr. Neha Verma',    spec:'Dermatologist',   status:'Online',  wait:'10 mins', avail:true },
    { name:'Dr. Rohit Mehta',   spec:'General Physician',status:'Busy',   wait:'20 mins', avail:false },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">

        {/* ── GREETING ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">{greeting}, {fullName} 👋</h1>
            <p className="text-gray-400 text-sm">Here's your personalized health overview</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            ROW 1: Features 1-4
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* 1. AI Health Copilot */}
          <SectionCard title="AI Health Copilot" badge="BETA">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Brain size={18} className="text-white"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 mb-1">{greeting}, {firstName}! ☀️</p>
                <p className="text-xs text-gray-500 leading-relaxed">Your sleep quality decreased this week. Consider improving hydration and sleep timing.</p>
                <p className="text-xs text-green-600 font-semibold mt-1.5">Your blood sugar trend improved by 12% compared to last month.</p>
              </div>
            </div>
            <button onClick={()=>navigate('/patient/laboratory')} className="mt-3 text-xs text-violet-600 font-semibold hover:underline flex items-center gap-1">
              See full insights <ArrowRight size={10}/>
            </button>
          </SectionCard>

          {/* 2. Live Health Risk Monitor */}
          <SectionCard title="Live Health Risk Monitor">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">Current Risk Status</p>
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-2 mb-3">
                <CheckCircle size={18} className="text-green-600"/>
                <span className="text-lg font-extrabold text-green-700">Low Risk</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">You are doing great! Keep maintaining your healthy lifestyle.</p>
              {/* Risk gauge */}
              <div className="relative">
                <div className="w-full h-3 rounded-full overflow-hidden flex">
                  <div className="w-1/3 bg-green-400 rounded-l-full"/>
                  <div className="w-1/3 bg-yellow-400"/>
                  <div className="w-1/3 bg-red-500 rounded-r-full"/>
                </div>
                <div className="absolute top-0 h-3 flex items-center" style={{left:'15%'}}>
                  <div className="w-3.5 h-3.5 bg-white border-2 border-gray-700 rounded-full shadow -mt-0.5"/>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Low</span><span>Moderate</span><span>High</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* 3. AI Preventive Healthcare */}
          <SectionCard title="AI Preventive Healthcare" badge="NEW" action="View All" onAction={()=>navigate('/patient/laboratory')}>
            <div className="space-y-2.5">
              {[
                { icon:'🩸', text:"You haven't done a Blood Test in 6 months.", btn:'Book Test', color:'text-red-600' },
                { icon:'⚖️', text:'Your BMI trend is increasing. Recommended: Weight Check', btn:'View', color:'text-orange-600' },
                { icon:'🦷', text:'Your last dental checkup was 1 year ago.', btn:'Book Now', color:'text-blue-600' },
              ].map((s,i)=>(
                <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-xl">
                  <span className="text-base flex-shrink-0 mt-0.5">{s.icon}</span>
                  <p className="text-xs text-gray-600 flex-1 leading-relaxed">{s.text}</p>
                  <button className={`text-xs font-bold flex-shrink-0 underline ${s.color}`}>{s.btn}</button>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 4. Smart Health Journey Timeline */}
          <SectionCard title="Smart Health Journey Timeline" action="View Full Journey" onAction={()=>navigate('/patient/my-records')}>
            <div className="space-y-2">
              {[
                { step:'Symptoms', date:'12 May', note:'Fever, Headache', icon:'🤒', done:true },
                { step:'AI Analysis', date:'12 May', note:'Risk: Low', icon:'🤖', done:true },
                { step:'Consultation', date:'13 May', note:'Dr. Arjun Sharma', icon:'👨‍⚕️', done:true },
                { step:'Prescription', date:'13 May', note:'Medication', icon:'💊', done:true },
                { step:'Recovery', date:'', note:'In Progress', icon:'💪', done:false },
              ].map((s,i,arr)=>(
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${s.done?'bg-teal-100':'bg-gray-100'}`}>{s.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${s.done?'text-gray-800':'text-gray-400'}`}>{s.step}</p>
                    <p className="text-xs text-gray-400">{s.date} {s.note}</p>
                  </div>
                  {s.done && <CheckCircle size={12} className="text-teal-500 flex-shrink-0"/>}
                  {!s.done && <Clock size={12} className="text-gray-300 flex-shrink-0"/>}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ══════════════════════════════════════════════
            ROW 2: Features 5-9
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

          {/* 5. AI Recovery Tracker */}
          <SectionCard title="AI Recovery Tracker">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 64 64" className="-rotate-90 w-full h-full">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#0d9488" strokeWidth="8"
                    strokeDasharray={`${(70/100)*163} 163`} strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-extrabold text-gray-900">70%</span>
                  <span className="text-xs text-gray-400">Rcvry</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-700 mb-1">Recovery Progress</p>
                <p className="text-xs text-gray-400">Based on last consultation</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {[
                { l:'Fever',    pct:70, c:'bg-green-500',  badge:'Good',     bc:'bg-green-100 text-green-700' },
                { l:'Headache', pct:50, c:'bg-orange-500', badge:'Moderate', bc:'bg-orange-100 text-orange-700' },
                { l:'Weakness', pct:30, c:'bg-red-500',    badge:'Slow',     bc:'bg-red-100 text-red-700' },
              ].map((r,i)=>(
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-16 flex-shrink-0">{r.l}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${r.c} rounded-full`} style={{width:`${r.pct}%`}}/>
                  </div>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${r.bc}`}>{r.badge}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 6. Smart Daily Health Score */}
          <SectionCard title="Smart Daily Health Score">
            <div className="text-center mb-2">
              <p className="text-xs text-gray-400 mb-1">Today's Health Score</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-extrabold text-gray-900">84</span>
                <span className="text-gray-400 text-sm">/100</span>
              </div>
              <p className="text-xs font-bold text-green-600 mt-0.5">Good</p>
              <p className="text-xs text-green-500 flex items-center justify-center gap-1 mt-1"><ArrowUpRight size={11}/>12% vs yesterday</p>
            </div>
            <svg viewBox="0 0 120 30" className="w-full h-8">
              <polyline points="0,28 17,22 34,18 51,20 68,12 85,8 102,10 120,6" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
              {[0,17,34,51,68,85,102,120].map((x,i)=>(
                <circle key={i} cx={x} cy={[28,22,18,20,12,8,10,6][i]} r="2.5" fill="#22c55e"/>
              ))}
            </svg>
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><span key={d}>{d}</span>)}
            </div>
          </SectionCard>

          {/* 7. AI Emotion / Stress Insights */}
          <SectionCard title="AI Emotion / Stress Insights">
            <p className="text-xs font-semibold text-gray-700 mb-3">How are you feeling today?</p>
            <div className="flex gap-1.5 mb-4">
              {MOODS.map((m,i)=>(
                <button key={i} onClick={()=>{ setMood(i); toast.success(`Mood recorded: ${m.label}`) }}
                  className={`flex-1 flex flex-col items-center gap-0.5 p-1.5 rounded-xl border-2 transition-all ${mood===i?m.color:'border-transparent hover:bg-gray-50'}`}>
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-xs text-gray-500 leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <p className="text-xs font-bold text-orange-700">Your Stress Level</p>
              <p className="text-sm font-extrabold text-orange-600 mt-0.5">Slightly Elevated</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{width:'65%'}}/>
                </div>
                <span className="text-xs font-bold text-orange-600">65%</span>
              </div>
              <p className="text-xs text-orange-500 mt-1.5">Try meditation or a short walk.</p>
            </div>
          </SectionCard>

          {/* 8. Real-Time Health Alerts */}
          <SectionCard title="Real-Time Health Alerts" action="View All">
            <div className="space-y-2.5">
              {[
                { icon:'🔴', msg:'High blood pressure trend detected in last 3 days.', time:'2m ago', c:'bg-red-50 border-red-200' },
                { icon:'🟡', msg:'Medicine skipped 3 times this week.', time:'1h ago', c:'bg-yellow-50 border-yellow-200' },
                { icon:'🟠', msg:'Your sleep quality is below average.', time:'3h ago', c:'bg-orange-50 border-orange-200' },
              ].map((a,i)=>(
                <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl border ${a.c}`}>
                  <span className="text-base flex-shrink-0 mt-0.5">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-relaxed">{a.msg}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 9. Smart AI Follow-Up Engine */}
          <SectionCard title="Smart AI Follow-Up Engine">
            <p className="text-xs font-semibold text-gray-700 mb-3">How are you feeling after the treatment?</p>
            <div className="space-y-2">
              {[
                { l:'Much Better', icon:'😊', c:'hover:bg-green-50 hover:border-green-300' },
                { l:'Better',      icon:'🙂', c:'hover:bg-blue-50 hover:border-blue-300' },
                { l:'Same',        icon:'😐', c:'hover:bg-yellow-50 hover:border-yellow-300' },
                { l:'Worse',       icon:'😔', c:'hover:bg-red-50 hover:border-red-300' },
              ].map((o,i)=>(
                <button key={i} onClick={()=>{ setFollowUp(i); toast.success(`Response recorded: ${o.l}`) }}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left transition-all ${followUp===i?'bg-teal-50 border-teal-400':'border-gray-100 bg-gray-50 '+o.c}`}>
                  <span className="text-xl">{o.icon}</span>
                  <span className={`text-sm font-semibold ${followUp===i?'text-teal-700':'text-gray-700'}`}>{o.l}</span>
                  {followUp===i && <CheckCircle size={14} className="text-teal-600 ml-auto"/>}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">AI will customize your next steps based on this.</p>
          </SectionCard>
        </div>

        {/* ══════════════════════════════════════════════
            ROW 3: Features 10-14
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

          {/* 10. Digital Health Passport */}
          <SectionCard title="Digital Health Passport" action="View All">
            <div className="space-y-2">
              {[
                { icon:'🩸', label:'Blood Group', value:'B+' },
                { icon:'⚠️', label:'Allergies', value:'Peanuts, Pollen' },
                { icon:'💊', label:'Chronic Conditions', value:'None' },
                { icon:'📞', label:'Emergency Contact', value:'+91 98765 43210' },
                { icon:'🛡️', label:'Insurance Provider', value:'Star Health Insurance' },
              ].map((p,i)=>(
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                  <span className="text-sm flex-shrink-0">{p.icon}</span>
                  <span className="text-xs text-gray-500 flex-1 min-w-0 truncate">{p.label}</span>
                  <span className="text-xs font-bold text-gray-800 text-right flex-shrink-0">{p.value}</span>
                </div>
              ))}
            </div>
            <button className="mt-3 w-full py-2 bg-gradient-to-r from-teal-600 to-cyan-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1">
              <Share2 size={12}/> Share Passport
            </button>
          </SectionCard>

          {/* 11. Family Health Management */}
          <SectionCard title="Family Health Management" action="View Family Dashboard" onAction={()=>navigate('/patient/diary')}>
            <p className="text-xs text-gray-400 mb-3">Manage family health in one place</p>
            <div className="space-y-2.5">
              {[
                { name:fullName,        relation:'You',       score:82, color:'bg-teal-100 text-teal-700' },
                { name:'Arav (Son)',    relation:'12 Y',      score:76, color:'bg-blue-100 text-blue-700' },
                { name:'Neha (Mother)',  relation:'45 Y',     score:71, color:'bg-purple-100 text-purple-700' },
                { name:'Rajesh (Father)',relation:'48 Y',     score:68, color:'bg-orange-100 text-orange-700' },
              ].map((f,i)=>(
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${f.color}`}>{f.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{f.name}</p>
                    <p className="text-xs text-gray-400">{f.relation}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-extrabold text-gray-800">{f.score}</p>
                    <p className="text-xs text-gray-400">Health Score</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 12. AI Health Goals System */}
          <SectionCard title="AI Health Goals System" action="View Goal Progress" onAction={()=>navigate('/patient/diary')}>
            <p className="text-xs text-gray-400 mb-3">Track your progress</p>
            <div className="space-y-3">
              {goals.map((g,i)=>(
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{g.icon}</span>
                      <span className="text-xs font-bold text-gray-700">{g.label}</span>
                    </div>
                    <span className={`text-xs font-bold ${g.color}`}>{g.pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all" style={{width:`${g.pct}%`}}/>
                  </div>
                  <p className="text-xs text-gray-400">{g.current} / {g.target} {g.unit}</p>
                </div>
              ))}
              <button onClick={()=>navigate('/patient/diary')} className="w-full py-1.5 border border-dashed border-teal-300 text-teal-600 text-xs font-semibold rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1">
                <Plus size={11}/> Add Goal
              </button>
            </div>
          </SectionCard>

          {/* 13. Smart Medicine Adherence */}
          <SectionCard title="Smart Medicine Adherence" action="View History" onAction={()=>navigate('/patient/medicines')}>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 64 64" className="-rotate-90 w-full h-full">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#22c55e" strokeWidth="8"
                    strokeDasharray={`${(92/100)*163} 163`} strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-extrabold text-green-600">92%</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-700">Medicine Adherence</p>
                <p className="text-xs text-gray-400">This Month</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { l:'Taken',   v:56, c:'text-green-600 bg-green-50' },
                { l:'Skipped', v:5,  c:'text-red-600 bg-red-50' },
                { l:'On Time', v:'92%',c:'text-blue-600 bg-blue-50' },
              ].map((s,i)=>(
                <div key={i} className={`${s.c} rounded-xl p-2 text-center`}>
                  <p className="text-lg font-extrabold">{s.v}</p>
                  <p className="text-xs">{s.l}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 14. Real-Time Doctor Status */}
          <SectionCard title="Real-Time Doctor Status" action="View All" onAction={()=>navigate('/patient/doctors')}>
            <p className="text-xs text-gray-400 mb-3">Find Doctors · Live availability</p>
            <div className="space-y-2.5">
              {doctors.map((d,i)=>(
                <div key={i} className="flex items-center gap-2.5">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-300 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{d.name.charAt(3)}</div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${d.avail?'bg-green-500':'bg-orange-400'}`}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{d.name}</p>
                    <p className="text-xs text-gray-400">{d.spec}</p>
                    <p className={`text-xs font-medium ${d.avail?'text-green-500':'text-orange-500'}`}>
                      {d.avail?`● Available in ${d.wait}`:'● Busy'}
                    </p>
                  </div>
                  <button onClick={()=>navigate('/patient/doctors')} className="text-xs bg-teal-600 text-white px-2.5 py-1 rounded-lg font-bold hover:bg-teal-700 flex-shrink-0">
                    Consult
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ══════════════════════════════════════════════
            ROW 4: Features 15-18
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* 15. Wearable Device Integration */}
          <SectionCard title="Wearable Device Integration">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center"><Watch size={14} className="text-white"/></div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Synora Smart Watch</p>
                  <p className="text-xs text-green-500 flex items-center gap-1"><Wifi size={9}/>Connected</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-700">78%</p>
                <p className="text-xs text-gray-400">Battery</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-3">Last synced: 2 mins ago</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon:'👟', l:'Steps', v:'6,842', u:'/10,000' },
                { icon:'❤️', l:'Heart Rate', v:'72', u:'bpm' },
                { icon:'🌙', l:'Sleep', v:'6h 45m', u:'' },
              ].map((s,i)=>(
                <div key={i} className="bg-gray-50 rounded-xl p-2 text-center">
                  <span className="text-base">{s.icon}</span>
                  <p className="text-sm font-extrabold text-gray-900 mt-0.5">{s.v}</p>
                  <p className="text-xs text-gray-400">{s.u||s.l}</p>
                </div>
              ))}
            </div>
            <button className="mt-3 w-full text-xs text-teal-600 font-semibold hover:underline flex items-center justify-center gap-1">
              View All Device Data <ArrowRight size={10}/>
            </button>
          </SectionCard>

          {/* 16. AI Food & Diet Recommendation */}
          <SectionCard title="AI Food & Diet Recommendation">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-700 mb-1">Today's Diet Recommendation</p>
                <p className="text-xs text-gray-400">Based on your health data</p>
              </div>
              <span className="text-3xl">🥗</span>
            </div>
            <div className="space-y-2">
              {[
                { icon:'✅', text:'Low sugar diet recommended', c:'text-green-600' },
                { icon:'✅', text:'Increase protein intake', c:'text-green-600' },
                { icon:'❌', text:'Reduce oily & processed food', c:'text-red-600' },
              ].map((d,i)=>(
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                  <span className="text-sm flex-shrink-0">{d.icon}</span>
                  <p className={`text-xs font-medium ${d.c}`}>{d.text}</p>
                </div>
              ))}
            </div>
            <button onClick={()=>navigate('/patient/laboratory')} className="mt-3 text-xs text-teal-600 font-semibold hover:underline flex items-center gap-1">
              View Full Diet Plan <ArrowRight size={10}/>
            </button>
          </SectionCard>

          {/* 17. Emergency Mode */}
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border-2 border-red-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-red-100">
              <p className="font-bold text-red-700 text-xs uppercase tracking-wide">Emergency Mode</p>
            </div>
            <div className="p-4 text-center">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Shield size={22} className="text-white"/>
              </div>
              <p className="text-sm font-bold text-red-700 mb-1">Emergency Mode</p>
              <p className="text-xs text-red-500 mb-4">We are here to help you</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { icon:'🆘', label:'Call SOS',          onClick:()=>navigate('/patient/emergency') },
                  { icon:'🏥', label:'Nearest Hospitals',  onClick:()=>navigate('/patient/nearby') },
                  { icon:'📍', label:'Share Location',     onClick:()=>toast.success('Location shared!') },
                ].map((e,i)=>(
                  <button key={i} onClick={e.onClick} className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-xl border border-red-200 hover:bg-red-50 transition-all">
                    <span className="text-xl">{e.icon}</span>
                    <span className="text-xs font-semibold text-red-600 text-center leading-tight">{e.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={()=>navigate('/patient/emergency')}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md">
                <Phone size={14}/> Call Emergency
              </button>
              <button onClick={()=>navigate('/patient/emergency')} className="mt-2 text-xs text-red-500 hover:underline">View Emergency Profile →</button>
            </div>
          </div>

          {/* 18. AI Health Insight Engine */}
          <SectionCard title="AI Health Insight Engine" badge="New" action="View All Insights" onAction={()=>navigate('/patient/laboratory')}>
            <p className="text-xs font-bold text-gray-700 mb-3">AI Health Insights · Personalized insights just for you</p>
            {aiInsight ? (
              <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line mb-3">{aiInsight}</div>
            ) : (
              <div className="space-y-2 mb-3">
                {[
                  { icon:'🌙', text:'Your sleep improved by 18% this week.', c:'text-purple-600 bg-purple-50' },
                  { icon:'💧', text:'Hydration level is low. Drink more water.', c:'text-blue-600 bg-blue-50' },
                  { icon:'⚖️', text:'Weight is stable. Good job!', c:'text-green-600 bg-green-50' },
                  { icon:'🩸', text:'Sugar level improving consistently.', c:'text-red-600 bg-red-50' },
                ].map((ins,i)=>(
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-xl ${ins.c.split(' ')[1]}`}>
                    <span className="text-sm flex-shrink-0">{ins.icon}</span>
                    <p className={`text-xs font-medium ${ins.c.split(' ')[0]}`}>{ins.text}</p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={generateInsight} disabled={insLoading}
              className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${insLoading?'bg-gray-100 text-gray-400':'bg-gradient-to-r from-teal-600 to-cyan-500 text-white hover:opacity-90'}`}>
              {insLoading?<><RefreshCw size={11} className="animate-spin"/>Generating...</>:<><Zap size={11}/>Generate AI Insights</>}
            </button>
          </SectionCard>
        </div>

        {/* ══════════════════════════════════════════════
            BOTTOM: Upcoming Appointments + Records + Medicines
        ══════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-800 text-sm">Upcoming Appointments</p>
              <button onClick={()=>navigate('/patient/doctors')} className="text-xs text-teal-600 hover:underline">View All</button>
            </div>
            <div className="space-y-2.5">
              {recentApts.length>0 ? recentApts.map((apt,i)=>(
                <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{apt.doctor_name?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{apt.doctor_name}</p>
                    <p className="text-xs text-gray-400">{formatDate(apt.appointment_date)} · {apt.appointment_time}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${apt.appointment_type==='video'?'bg-blue-100 text-blue-700':'bg-teal-100 text-teal-700'}`}>
                    {apt.appointment_type==='video'?'Video Call':'Visit'}
                  </span>
                </div>
              )) : [
                {name:'Dr. Arjun Sharma', time:'19 May · 10:30 AM', type:'Video Call',  bg:'bg-blue-100 text-blue-700'},
                {name:'Dr. Neha Verma',   time:'24 May · 04:00 PM', type:'Clinic Visit', bg:'bg-teal-100 text-teal-700'},
                {name:'Dr. Rohit Mehta',  time:'28 May · 11:00 AM', type:'Follow Up',    bg:'bg-green-100 text-green-700'},
              ].map((a,i)=>(
                <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">{a.name.charAt(3)}</div>
                  <div className="flex-1 min-w-0"><p className="text-xs font-bold text-gray-900 truncate">{a.name}</p><p className="text-xs text-gray-400">{a.time}</p></div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${a.bg}`}>{a.type}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>navigate('/patient/doctors')} className="mt-3 w-full py-2 border border-teal-400 text-teal-600 text-xs font-bold rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1">
              Book New Appointment <ArrowRight size={11}/>
            </button>
          </div>

          {/* Recent Health Records */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-800 text-sm">Recent Health Records</p>
              <button onClick={()=>navigate('/patient/my-records')} className="text-xs text-teal-600 hover:underline">View All</button>
            </div>
            <div className="space-y-2.5">
              {(records.length>0?records:[
                {title:'Blood Test Report',    date:'14 May 2025', source:'City Lab',       status:'Normal'},
                {title:'Chest X-Ray',         date:'10 May 2025', source:'City Hospital',   status:'Normal'},
                {title:'Prescription',        date:'07 May 2025', source:'Dr. Arjun Sharma',status:'View'},
                {title:'Skin Analysis Report',date:'02 May 2025', source:'AI Skin Scan',    status:'Mild Risk'},
              ]).slice(0,4).map((r,i)=>(
                <div key={i} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0"><FileText size={14} className="text-blue-600"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400">{r.date} · {r.source}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${r.status==='Normal'?'bg-green-100 text-green-700':r.status==='View'?'bg-blue-100 text-blue-700':'bg-orange-100 text-orange-700'}`}>{r.status||'View'}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>navigate('/patient/laboratory')} className="mt-3 w-full py-2 border border-teal-400 text-teal-600 text-xs font-bold rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1">
              <Upload size={11}/> Upload New Report
            </button>
          </div>

          {/* Medicine Reminders */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-800 text-sm">Medicine Reminder</p>
              <button onClick={()=>navigate('/patient/medicines')} className="text-xs text-teal-600 hover:underline">View All</button>
            </div>
            <div className="space-y-2.5">
              {[
                {name:'Paracetamol 500mg',   dose:'1 Tab · After Breakfast',  time:'08:00 AM'},
                {name:'Vitamin D3 60000 IU', dose:'1 Cap · Weekly Once',      time:'09:00 AM'},
                {name:'Calcium Tablet',      dose:'1 Tab · After Lunch',      time:'01:00 PM'},
              ].map((m,i)=>(
                <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0"><Pill size={14} className="text-teal-600"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.dose}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-gray-700">{m.time}</p>
                    <Bell size={11} className="text-gray-400 ml-auto mt-0.5"/>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={()=>navigate('/patient/medicines')} className="mt-3 w-full py-2 border border-teal-400 text-teal-600 text-xs font-bold rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1">
              <Plus size={11}/> Add New Medicine
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
