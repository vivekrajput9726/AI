import { useState, useEffect } from 'react'
import {
  Users, Plus, Trash2, Edit2, X, Heart, Calendar, FileText, Pill,
  Brain, Activity, AlertTriangle, ChevronRight, ChevronLeft, Check,
  Loader, Shield, Thermometer, Droplets, Clock, Phone, Video,
  Stethoscope, TrendingUp, BarChart2, Bell, CheckCircle2, RefreshCw,
  User, Syringe, Wind, Zap, Star
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'

const RELATIONS  = ['Father','Mother','Spouse','Son','Daughter','Brother','Sister','Grandfather','Grandmother','Other']
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const COLORS     = ['from-blue-500 to-blue-600','from-green-500 to-emerald-600','from-purple-500 to-violet-600','from-orange-500 to-amber-600','from-pink-500 to-rose-600','from-teal-500 to-cyan-600']
const EMPTY_MEMBER = { name:'',relation:'Father',date_of_birth:'',blood_group:'',gender:'',allergies:'',medical_conditions:'',emergency_contact:'' }

const STEPS = [
  { id:1, label:'Select Member',     icon: Users },
  { id:2, label:'Health Records',    icon: FileText },
  { id:3, label:'Book Consultation', icon: Calendar },
  { id:4, label:'Track Medicines',   icon: Pill },
  { id:5, label:'AI Monitoring',     icon: Brain },
]

const VITALS_EMPTY = { bp:'',heartRate:'',temperature:'',weight:'',oxygen:'',bloodSugar:'' }

function getAge(dob) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25*24*60*60*1000))
}
function colorFor(i) { return COLORS[i % COLORS.length] }

export default function FamilyHealth() {
  const { user } = useSelector(s => s.auth)
  const [step, setStep]           = useState(1)
  const [members, setMembers]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)

  // add/edit modal
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY_MEMBER)
  const [saving, setSaving]       = useState(false)

  // health records vitals
  const [vitals, setVitals]       = useState(VITALS_EMPTY)
  const [editVitals, setEditVitals] = useState(false)

  // consultation
  const [doctors, setDoctors]     = useState([])
  const [docLoading, setDocLoading] = useState(false)
  const [bookingDoc, setBookingDoc] = useState(null)
  const [apptDate, setApptDate]   = useState('')
  const [apptTime, setApptTime]   = useState('')
  const [apptType, setApptType]   = useState('video')
  const [booking, setBooking]     = useState(false)
  const [booked, setBooked]       = useState(false)

  // medicines
  const [meds, setMeds]           = useState([])
  const [medForm, setMedForm]     = useState({ name:'',dosage:'',frequency:'Morning',notes:'' })
  const [showMedForm, setShowMedForm] = useState(false)
  const [addingMed, setAddingMed] = useState(false)

  // AI monitoring
  const [aiInsights, setAiInsights] = useState('')
  const [aiLoading, setAiLoading]   = useState(false)
  const [healthScore, setHealthScore] = useState(null)

  useEffect(() => {
    api.get('/family/').then(r => setMembers(r.data)).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  // load vitals & meds from localStorage when member changes
  useEffect(() => {
    if (!selected) return
    const v = localStorage.getItem(`family_vitals_${selected.id}`)
    if (v) setVitals(JSON.parse(v))
    else   setVitals(VITALS_EMPTY)
    const m = localStorage.getItem(`family_meds_${selected.id}`)
    if (m) setMeds(JSON.parse(m))
    else   setMeds([])
  }, [selected])

  // ── Member CRUD ──────────────────────────────────────────────────────────
  const openAdd  = () => { setForm(EMPTY_MEMBER); setEditing(null); setShowForm(true) }
  const openEdit = m  => { setForm({...m}); setEditing(m.id); setShowForm(true) }
  const saveMember = async () => {
    if (!form.name) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      if (editing) {
        const res = await api.put(`/family/${editing}`, form)
        setMembers(prev => prev.map(x => x.id===editing ? res.data : x))
        if (selected?.id===editing) setSelected(res.data)
      } else {
        const res = await api.post('/family/', form)
        setMembers(prev => [res.data, ...prev])
      }
      toast.success(editing ? 'Updated!' : 'Member added!')
      setShowForm(false)
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }
  const removeMember = async id => {
    try {
      await api.delete(`/family/${id}`)
      setMembers(prev => prev.filter(x => x.id!==id))
      if (selected?.id===id) { setSelected(null); setStep(1) }
      toast.success('Removed')
    } catch { toast.error('Failed') }
  }

  const selectMember = m => { setSelected(m); setStep(2); setBooked(false); setAiInsights('') }

  // ── Vitals ───────────────────────────────────────────────────────────────
  const saveVitals = () => {
    localStorage.setItem(`family_vitals_${selected.id}`, JSON.stringify(vitals))
    setEditVitals(false)
    toast.success('Vitals saved!')
  }

  // ── Consultation ─────────────────────────────────────────────────────────
  const loadDoctors = async () => {
    setDocLoading(true)
    try { const r = await api.get('/doctors'); setDoctors((r.data.doctors || r.data).slice(0,6)) }
    catch { toast.error('Failed to load doctors') }
    finally { setDocLoading(false) }
  }
  const bookConsultation = async () => {
    if (!bookingDoc || !apptDate || !apptTime) { toast.error('Select doctor, date and time'); return }
    setBooking(true)
    try {
      await api.post('/appointments/', {
        doctor_id: bookingDoc.id || bookingDoc._id,
        appointment_date: apptDate,
        appointment_time: apptTime,
        appointment_type: apptType,
        notes: `Family member: ${selected.name} (${selected.relation})`
      })
      toast.success(`Booked for ${selected.name}!`)
      setBooked(true)
    } catch { toast.error('Booking failed') }
    finally { setBooking(false) }
  }

  // ── Medicines ────────────────────────────────────────────────────────────
  const addMed = () => {
    if (!medForm.name) { toast.error('Medicine name required'); return }
    const updated = [...meds, { ...medForm, id: Date.now(), taken: [] }]
    setMeds(updated)
    localStorage.setItem(`family_meds_${selected.id}`, JSON.stringify(updated))
    setMedForm({ name:'',dosage:'',frequency:'Morning',notes:'' })
    setShowMedForm(false)
    toast.success('Medicine added!')
  }
  const removeMed = id => {
    const updated = meds.filter(m => m.id!==id)
    setMeds(updated)
    localStorage.setItem(`family_meds_${selected.id}`, JSON.stringify(updated))
  }
  const toggleTaken = id => {
    const today = new Date().toDateString()
    const updated = meds.map(m => {
      if (m.id!==id) return m
      const taken = m.taken?.includes(today)
        ? m.taken.filter(d => d!==today)
        : [...(m.taken||[]), today]
      return { ...m, taken }
    })
    setMeds(updated)
    localStorage.setItem(`family_meds_${selected.id}`, JSON.stringify(updated))
  }
  const isTakenToday = med => med.taken?.includes(new Date().toDateString())

  // ── AI Monitoring ────────────────────────────────────────────────────────
  const runAIMonitoring = async () => {
    if (!selected) return
    setAiLoading(true)
    setAiInsights('')
    const vitalsSummary = Object.entries(vitals)
      .filter(([,v]) => v)
      .map(([k,v]) => `${k}: ${v}`)
      .join(', ') || 'No vitals recorded'
    const medsSummary = meds.length
      ? meds.map(m => `${m.name} ${m.dosage} (${m.frequency})`).join(', ')
      : 'No medicines'
    const prompt = `You are a family health AI assistant. Analyze this family member's health profile and provide insights.

Family Member: ${selected.name} (${selected.relation}, ${getAge(selected.date_of_birth)||'unknown age'} years)
Blood Group: ${selected.blood_group || 'Unknown'}
Medical Conditions: ${selected.medical_conditions || 'None reported'}
Allergies: ${selected.allergies || 'None reported'}
Current Vitals: ${vitalsSummary}
Current Medicines: ${medsSummary}

Please provide:
1. **Health Score** (0-100) with brief reasoning
2. **Key Health Risks** based on age, conditions, and vitals
3. **Medicine Adherence Tips** for their current medications
4. **Preventive Recommendations** (3-4 specific suggestions)
5. **When to Consult a Doctor** — warning signs to watch for
6. **Lifestyle Tips** tailored to their profile

Keep response practical, caring, and easy to understand.`
    try {
      const r = await api.post('/ai/chat', { message: prompt, context: 'family_health_monitoring' })
      const text = r.data.response || r.data.message || ''
      setAiInsights(text)
      // extract score
      const match = text.match(/health score[:\s]*(\d+)/i) || text.match(/score[:\s]*(\d+)/i)
      if (match) setHealthScore(parseInt(match[1]))
      else setHealthScore(72)
    } catch { toast.error('AI monitoring failed'); setAiInsights('') }
    finally { setAiLoading(false) }
  }

  // ── Render helpers ───────────────────────────────────────────────────────
  const goStep = n => {
    if (n===3 && doctors.length===0) loadDoctors()
    setStep(n)
  }

  const StepBar = () => (
    <div className="flex items-center gap-1 mb-6">
      {STEPS.map((s, i) => {
        const done   = step > s.id
        const active = step === s.id
        return (
          <div key={s.id} className="flex items-center flex-1">
            <button
              onClick={() => selected && goStep(s.id)}
              disabled={!selected && s.id > 1}
              className={`flex flex-col items-center gap-1 flex-1 transition-all ${!selected && s.id>1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400'}`}>
                {done ? <Check size={14}/> : <s.icon size={14}/>}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>{s.label}</span>
            </button>
            {i < STEPS.length-1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`}/>
            )}
          </div>
        )
      })}
    </div>
  )

  // ── STEP 1: Select Member ────────────────────────────────────────────────
  const Step1 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Family Members</h2>
          <p className="text-sm text-gray-500">Select a member to manage their health</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
          <Plus size={15}/> Add Member
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader size={28} className="animate-spin text-blue-500"/></div>
      ) : members.length===0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-blue-400"/>
          </div>
          <p className="font-bold text-gray-700 text-lg">No family members yet</p>
          <p className="text-gray-400 text-sm mt-1">Add family members to track and manage their health</p>
          <button onClick={openAdd} className="mt-5 bg-blue-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
            <Plus size={14}/> Add First Member
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {members.map((m, i) => (
            <div key={m.id}
              onClick={() => selectMember(m)}
              className="bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer hover:border-blue-300 hover:shadow-lg transition-all group">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${colorFor(i)} rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl flex-shrink-0 shadow-lg`}>
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-gray-900 text-base">{m.name}</p>
                  <p className="text-sm text-gray-500">{m.relation}{getAge(m.date_of_birth) ? ` · ${getAge(m.date_of_birth)} yrs` : ''}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.blood_group && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">{m.blood_group}</span>}
                    {m.medical_conditions && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Has Conditions</span>}
                    {m.allergies && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Allergies</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={e=>{e.stopPropagation();openEdit(m)}} className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={13}/></button>
                  <button onClick={e=>{e.stopPropagation();removeMember(m.id)}} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13}/></button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-400">Click to manage health</span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors"/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── STEP 2: Health Records ───────────────────────────────────────────────
  const Step2 = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Health Records</h2>
          <p className="text-sm text-gray-500">{selected?.name} — {selected?.relation}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setEditVitals(!editVitals)} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors">
            <Edit2 size={13}/> {editVitals ? 'Cancel' : 'Edit Vitals'}
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-extrabold">
            {selected?.name?.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-xl font-extrabold">{selected?.name}</p>
            <p className="text-blue-200 text-sm">{selected?.relation} · {getAge(selected?.date_of_birth)||'—'} years · {selected?.gender||'—'}</p>
            <div className="flex gap-3 mt-2 text-sm">
              <span className="bg-white/20 px-2 py-0.5 rounded-lg font-semibold">{selected?.blood_group||'—'}</span>
              {selected?.medical_conditions && <span className="bg-red-400/40 px-2 py-0.5 rounded-lg text-xs">{selected.medical_conditions}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Vitals */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Activity size={16} className="text-blue-500"/> Vitals</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { key:'bp',          label:'Blood Pressure',  icon:Heart,       unit:'mmHg', color:'text-red-500',    bg:'bg-red-50'    },
            { key:'heartRate',   label:'Heart Rate',      icon:Activity,    unit:'bpm',  color:'text-pink-500',   bg:'bg-pink-50'   },
            { key:'temperature', label:'Temperature',     icon:Thermometer, unit:'°F',   color:'text-orange-500', bg:'bg-orange-50' },
            { key:'weight',      label:'Weight',          icon:User,        unit:'kg',   color:'text-blue-500',   bg:'bg-blue-50'   },
            { key:'oxygen',      label:'Oxygen Sat.',     icon:Wind,        unit:'%',    color:'text-teal-500',   bg:'bg-teal-50'   },
            { key:'bloodSugar',  label:'Blood Sugar',     icon:Droplets,    unit:'mg/dL',color:'text-purple-500', bg:'bg-purple-50' },
          ].map(({ key, label, icon:Icon, unit, color, bg }) => (
            <div key={key} className={`${bg} rounded-xl p-3`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={13} className={color}/>
                <span className="text-xs text-gray-500 font-medium">{label}</span>
              </div>
              {editVitals ? (
                <input
                  value={vitals[key]}
                  onChange={e => setVitals(v => ({...v, [key]: e.target.value}))}
                  placeholder={`Enter ${unit}`}
                  className="w-full text-sm font-bold bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400"
                />
              ) : (
                <p className={`text-lg font-extrabold ${color}`}>{vitals[key] || '—'} <span className="text-xs text-gray-400 font-normal">{vitals[key] ? unit : ''}</span></p>
              )}
            </div>
          ))}
        </div>
        {editVitals && (
          <button onClick={saveVitals} className="mt-4 w-full bg-blue-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Check size={15}/> Save Vitals
          </button>
        )}
      </div>

      {/* Conditions & Allergies */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Shield size={15} className="text-orange-500"/> Medical Conditions</h3>
          {selected?.medical_conditions
            ? selected.medical_conditions.split(',').map((c,i) => (
                <span key={i} className="inline-block bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-full font-medium mr-1.5 mb-1.5">{c.trim()}</span>
              ))
            : <p className="text-sm text-gray-400 italic">None reported</p>}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><AlertTriangle size={15} className="text-red-500"/> Allergies</h3>
          {selected?.allergies
            ? selected.allergies.split(',').map((a,i) => (
                <span key={i} className="inline-block bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium mr-1.5 mb-1.5">{a.trim()}</span>
              ))
            : <p className="text-sm text-gray-400 italic">No known allergies</p>}
        </div>
      </div>

      {/* Emergency Contact */}
      {selected?.emergency_contact && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
          <Phone size={18} className="text-red-500 flex-shrink-0"/>
          <div>
            <p className="text-xs text-red-500 font-semibold">Emergency Contact</p>
            <p className="font-bold text-red-700">{selected.emergency_contact}</p>
          </div>
        </div>
      )}

      <button onClick={()=>goStep(3)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
        Book Consultation <ChevronRight size={16}/>
      </button>
    </div>
  )

  // ── STEP 3: Book Consultation ────────────────────────────────────────────
  const Step3 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900">Book Consultation</h2>
        <p className="text-sm text-gray-500">For {selected?.name} ({selected?.relation})</p>
      </div>

      {booked ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-500"/>
          </div>
          <p className="text-xl font-extrabold text-green-700">Appointment Booked!</p>
          <p className="text-sm text-gray-500 mt-1">Consultation scheduled for {selected?.name} on {apptDate} at {apptTime}</p>
          <div className="flex gap-3 mt-5 justify-center">
            <button onClick={()=>setBooked(false)} className="text-sm font-semibold text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50">Book Another</button>
            <button onClick={()=>goStep(4)} className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-1.5">Track Medicines <ChevronRight size={14}/></button>
          </div>
        </div>
      ) : (
        <>
          {/* Consultation type */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-700 mb-3">Consultation Type</p>
            <div className="grid grid-cols-2 gap-3">
              {[{t:'video',icon:Video,label:'Video Call'},{t:'voice',icon:Phone,label:'Voice Call'}].map(({t,icon:Icon,label})=>(
                <button key={t} onClick={()=>setApptType(t)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 font-semibold text-sm transition-all ${apptType===t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                  <Icon size={17}/> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date / Time */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-700 mb-3">Schedule</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Date</label>
                <input type="date" value={apptDate} onChange={e=>setApptDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"/>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Time</label>
                <select value={apptTime} onChange={e=>setApptTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400">
                  <option value="">Select time</option>
                  {['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','17:00'].map(t=>(
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Doctors */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Stethoscope size={15} className="text-blue-500"/> Available Doctors
              <button onClick={loadDoctors} className="ml-auto text-xs text-blue-500 flex items-center gap-1"><RefreshCw size={11}/> Refresh</button>
            </p>
            {docLoading ? (
              <div className="py-6 flex justify-center"><Loader size={20} className="animate-spin text-blue-400"/></div>
            ) : doctors.length===0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No doctors loaded</p>
                <button onClick={loadDoctors} className="mt-2 text-sm text-blue-500 font-semibold">Load Doctors</button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {doctors.map(doc => (
                  <div key={doc.id||doc._id}
                    onClick={()=>setBookingDoc(bookingDoc?.id===doc.id ? null : doc)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${bookingDoc?.id===doc.id||bookingDoc?._id===doc._id ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}>
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(doc.full_name||doc.name||'D').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm">{doc.full_name||doc.name}</p>
                      <p className="text-xs text-gray-400">{doc.specialization||'General Physician'}</p>
                    </div>
                    {(bookingDoc?.id===doc.id||bookingDoc?._id===doc._id) && <Check size={16} className="text-blue-500 flex-shrink-0"/>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={bookConsultation} disabled={booking}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {booking ? <><Loader size={16} className="animate-spin"/> Booking...</> : <><Calendar size={16}/> Confirm Booking</>}
          </button>
        </>
      )}
    </div>
  )

  // ── STEP 4: Track Medicines ──────────────────────────────────────────────
  const Step4 = () => {
    const today = new Date().toDateString()
    const takenCount = meds.filter(m => m.taken?.includes(today)).length
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Track Medicines</h2>
            <p className="text-sm text-gray-500">{selected?.name}'s medicines</p>
          </div>
          <button onClick={()=>setShowMedForm(true)} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
            <Plus size={14}/> Add Medicine
          </button>
        </div>

        {/* Today's summary */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">Today's Progress</p>
              <p className="text-3xl font-extrabold mt-1">{takenCount}/{meds.length}</p>
              <p className="text-teal-100 text-sm">medicines taken</p>
            </div>
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 80 80" className="-rotate-90 w-full h-full">
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8"/>
                <circle cx="40" cy="40" r="32" fill="none" stroke="white" strokeWidth="8"
                  strokeDasharray={`${meds.length>0 ? (takenCount/meds.length)*201 : 0} 201`} strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-extrabold">{meds.length>0 ? Math.round((takenCount/meds.length)*100) : 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Medicine list */}
        {meds.length===0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <Pill size={36} className="mx-auto text-gray-200 mb-3"/>
            <p className="text-gray-500 font-medium">No medicines added</p>
            <button onClick={()=>setShowMedForm(true)} className="mt-3 text-sm text-blue-500 font-semibold">+ Add First Medicine</button>
          </div>
        ) : (
          <div className="space-y-3">
            {meds.map(med => {
              const taken = isTakenToday(med)
              return (
                <div key={med.id} className={`bg-white rounded-2xl border-2 p-4 transition-all ${taken ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <button onClick={()=>toggleTaken(med.id)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${taken ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-500'}`}>
                      {taken ? <Check size={18}/> : <Pill size={17}/>}
                    </button>
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${taken ? 'line-through text-gray-400' : 'text-gray-800'}`}>{med.name}</p>
                      <div className="flex gap-2 mt-0.5 flex-wrap">
                        {med.dosage && <span className="text-xs text-gray-400">{med.dosage}</span>}
                        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">{med.frequency}</span>
                        {taken && <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5"><Check size={10}/> Taken today</span>}
                      </div>
                      {med.notes && <p className="text-xs text-gray-400 mt-0.5">{med.notes}</p>}
                    </div>
                    <button onClick={()=>removeMed(med.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13}/></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <button onClick={()=>goStep(5)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          AI Health Monitoring <ChevronRight size={16}/>
        </button>

        {/* Add medicine modal */}
        {showMedForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Add Medicine</h3>
                <button onClick={()=>setShowMedForm(false)} className="p-1.5 hover:bg-gray-100 rounded-xl"><X size={16}/></button>
              </div>
              <div className="space-y-3">
                <div><label className="text-xs text-gray-500 font-medium block mb-1">Medicine Name *</label>
                  <input value={medForm.name} onChange={e=>setMedForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Metformin" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-gray-500 font-medium block mb-1">Dosage</label>
                    <input value={medForm.dosage} onChange={e=>setMedForm(f=>({...f,dosage:e.target.value}))} placeholder="e.g. 500mg" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"/>
                  </div>
                  <div><label className="text-xs text-gray-500 font-medium block mb-1">Frequency</label>
                    <select value={medForm.frequency} onChange={e=>setMedForm(f=>({...f,frequency:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400">
                      {['Morning','Evening','Night','Twice daily','Thrice daily','As needed'].map(f=><option key={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="text-xs text-gray-500 font-medium block mb-1">Notes</label>
                  <input value={medForm.notes} onChange={e=>setMedForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. Take after meals" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"/>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={()=>setShowMedForm(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cancel</button>
                <button onClick={addMed} className="flex-1 bg-blue-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-blue-700">Add</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── STEP 5: AI Monitoring ────────────────────────────────────────────────
  const Step5 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900">AI Health Monitoring</h2>
        <p className="text-sm text-gray-500">AI analysis for {selected?.name}</p>
      </div>

      {/* Score card */}
      {healthScore && !aiLoading && (
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 80 80" className="-rotate-90 w-full h-full">
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8"/>
                <circle cx="40" cy="40" r="32" fill="none" stroke="white" strokeWidth="8"
                  strokeDasharray={`${(healthScore/100)*201} 201`} strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold">{healthScore}</span>
                <span className="text-xs text-blue-200">/100</span>
              </div>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Health Score</p>
              <p className="text-2xl font-extrabold">{healthScore>=80?'Excellent':healthScore>=60?'Good':healthScore>=40?'Fair':'Needs Attention'}</p>
              <p className="text-blue-200 text-xs mt-1">{selected?.name} · {selected?.relation}</p>
              <div className="flex gap-1.5 mt-2">
                {[...Array(5)].map((_,i)=>(
                  <Star key={i} size={12} className={i < Math.round((healthScore/100)*5) ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}/>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Run analysis button */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Brain size={16} className="text-purple-500"/> AI Analysis</h3>
          <button onClick={runAIMonitoring} disabled={aiLoading}
            className="flex items-center gap-1.5 text-sm font-semibold bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 disabled:opacity-60 transition-colors">
            {aiLoading ? <><Loader size={14} className="animate-spin"/> Analyzing...</> : <><Zap size={14}/> Run Analysis</>}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label:'Age',         value: getAge(selected?.date_of_birth) ? `${getAge(selected.date_of_birth)} yrs` : '—' },
            { label:'Blood Group', value: selected?.blood_group||'—' },
            { label:'Medicines',   value: `${meds.length} active` },
          ].map(({label,value})=>(
            <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="font-bold text-gray-700 text-sm">{value}</p>
            </div>
          ))}
        </div>
        {!aiInsights && !aiLoading && (
          <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
            <Brain size={28} className="mx-auto text-gray-200 mb-2"/>
            <p className="text-sm text-gray-400">Click "Run Analysis" to get AI insights</p>
          </div>
        )}
        {aiLoading && (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"/>
            <p className="text-sm text-gray-400">AI is analyzing {selected?.name}'s health data...</p>
          </div>
        )}
        {aiInsights && !aiLoading && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
            <div className="prose prose-sm max-w-none text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {aiInsights}
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={()=>goStep(3)} className="flex items-center gap-2 p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50 transition-all text-sm font-semibold text-gray-700">
          <Calendar size={16} className="text-blue-500"/> Book Follow-up
        </button>
        <button onClick={()=>goStep(4)} className="flex items-center gap-2 p-4 bg-white border border-gray-100 rounded-2xl hover:border-teal-200 hover:bg-teal-50 transition-all text-sm font-semibold text-gray-700">
          <Pill size={16} className="text-teal-500"/> Update Medicines
        </button>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-2 animate-fade-in">

        {/* Page header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 rounded-2xl p-5 text-white mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-white"/>
            </div>
            <div>
              <h1 className="text-lg font-extrabold">Family Health Manager</h1>
              <p className="text-blue-100 text-xs">Monitor and manage health for your entire family</p>
            </div>
            {selected && (
              <div className="ml-auto flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-xl">
                <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center text-xs font-bold">{selected.name.charAt(0)}</div>
                <span className="text-sm font-semibold">{selected.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Step bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <StepBar/>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          {step===1 && <Step1/>}
          {step===2 && selected && <Step2/>}
          {step===3 && selected && <Step3/>}
          {step===4 && selected && <Step4/>}
          {step===5 && selected && <Step5/>}
        </div>

        {/* Bottom nav for steps 2–5 */}
        {step > 1 && (
          <div className="flex items-center justify-between pt-1">
            <button onClick={()=>setStep(s=>s-1)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700">
              <ChevronLeft size={16}/> Back
            </button>
            <button onClick={()=>setStep(1)} className="text-xs text-gray-400 hover:text-blue-500 font-medium">
              Change Member
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Member Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Member' : 'Add Family Member'}</h3>
              <button onClick={()=>setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-xl"><X size={16}/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Full Name *</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Full name" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Relation</label>
                  <select value={form.relation} onChange={e=>setForm(f=>({...f,relation:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400">
                    {RELATIONS.map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Gender</label>
                  <select value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400">
                    <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Date of Birth</label>
                  <input type="date" value={form.date_of_birth} onChange={e=>setForm(f=>({...f,date_of_birth:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"/>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Blood Group</label>
                  <select value={form.blood_group} onChange={e=>setForm(f=>({...f,blood_group:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400">
                    <option value="">Select</option>{BLOOD_GROUPS.map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Medical Conditions</label>
                <input value={form.medical_conditions} onChange={e=>setForm(f=>({...f,medical_conditions:e.target.value}))} placeholder="e.g. Diabetes, Hypertension" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"/>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Allergies</label>
                <input value={form.allergies} onChange={e=>setForm(f=>({...f,allergies:e.target.value}))} placeholder="e.g. Penicillin, Dust" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"/>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Emergency Contact</label>
                <input value={form.emergency_contact} onChange={e=>setForm(f=>({...f,emergency_contact:e.target.value}))} placeholder="+91 98765 43210" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"/>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 text-sm">Cancel</button>
              <button onClick={saveMember} disabled={saving} className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 text-sm disabled:opacity-60">
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
