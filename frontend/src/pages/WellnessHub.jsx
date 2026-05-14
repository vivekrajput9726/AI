import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  Users, Brain, Plus, Trash2, Edit2, X, Heart,
  ChevronRight, CheckCircle, RefreshCw, AlertTriangle, Zap
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────
const RELATIONS   = ['Father','Mother','Spouse','Son','Daughter','Brother','Sister','Grandfather','Grandmother','Other']
const BLOOD_GROUPS= ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const COLORS      = ['bg-blue-500','bg-green-500','bg-purple-500','bg-orange-500','bg-pink-500','bg-teal-500']
const EMPTY_MEM   = { name:'',relation:'Father',date_of_birth:'',blood_group:'',gender:'',allergies:'',medical_conditions:'',emergency_contact:'' }

const ASSESSMENTS = {
  depression: {
    label:'Depression (PHQ-9)', color:'bg-blue-600', badge:'bg-blue-100 text-blue-700',
    questions:[
      'Little interest or pleasure in doing things?',
      'Feeling down, depressed, or hopeless?',
      'Trouble falling or staying asleep, or sleeping too much?',
      'Feeling tired or having little energy?',
      'Poor appetite or overeating?',
      'Feeling bad about yourself or feeling like a failure?',
      'Trouble concentrating on things like reading or watching TV?',
      'Moving or speaking slowly — or being unusually fidgety?',
      'Thoughts that you would be better off dead or hurting yourself?',
    ],
    levels:[
      {max:4,  level:'Minimal',            color:'bg-green-100 text-green-700',  advice:'Your mood appears stable. Keep up healthy habits like exercise, sleep, and social connections.'},
      {max:9,  level:'Mild',               color:'bg-yellow-100 text-yellow-700', advice:'Mild symptoms. Talk to someone you trust, exercise regularly, and try mindfulness.'},
      {max:14, level:'Moderate',           color:'bg-orange-100 text-orange-700', advice:'Consider speaking with a mental health professional or counselor.'},
      {max:19, level:'Moderately Severe',  color:'bg-red-100 text-red-700',       advice:'Please consult a psychiatrist. Professional help is strongly recommended.'},
      {max:27, level:'Severe',             color:'bg-red-200 text-red-800',       advice:'Severe symptoms. Please seek professional help immediately. You are not alone.'},
    ]
  },
  anxiety: {
    label:'Anxiety (GAD-7)', color:'bg-purple-600', badge:'bg-purple-100 text-purple-700',
    questions:[
      'Feeling nervous, anxious, or on edge?',
      'Not being able to stop or control worrying?',
      'Worrying too much about different things?',
      'Trouble relaxing?',
      'Being so restless that it is hard to sit still?',
      'Becoming easily annoyed or irritable?',
      'Feeling afraid as if something awful might happen?',
    ],
    levels:[
      {max:4,  level:'Minimal Anxiety', color:'bg-green-100 text-green-700',  advice:'Anxiety levels appear low. Practice deep breathing and mindfulness daily.'},
      {max:9,  level:'Mild Anxiety',    color:'bg-yellow-100 text-yellow-700', advice:'Mild anxiety. Try relaxation techniques and reduce caffeine intake.'},
      {max:14, level:'Moderate Anxiety',color:'bg-orange-100 text-orange-700', advice:'Consider speaking with a counselor. Therapy and relaxation help significantly.'},
      {max:21, level:'Severe Anxiety',  color:'bg-red-100 text-red-700',       advice:'Please consult a mental health professional. Effective treatments are available.'},
    ]
  },
  stress: {
    label:'Stress (PSS-10)', color:'bg-teal-600', badge:'bg-teal-100 text-teal-700',
    questions:[
      'Been upset because of something unexpected?',
      'Felt unable to control important things in your life?',
      'Felt nervous and stressed?',
      'Felt difficulties piling up so high you cannot overcome them?',
      'Been angered by things outside your control?',
      'Found you could not cope with all the things you had to do?',
      'Been unable to control irritations in your life?',
      'Felt that you were on top of things? (less often = more stress)',
      'Been able to control irritations? (less often = more stress)',
      'Felt confident about your ability to handle problems? (less often = more stress)',
    ],
    levels:[
      {max:13, level:'Low Stress',      color:'bg-green-100 text-green-700',  advice:'Good stress management! Keep your current lifestyle and coping strategies.'},
      {max:26, level:'Moderate Stress', color:'bg-yellow-100 text-yellow-700', advice:'Moderate stress. Take breaks, exercise regularly, and talk to supportive people.'},
      {max:40, level:'High Stress',     color:'bg-red-100 text-red-700',       advice:'High stress detected. Consider speaking to a counselor and reviewing your routine.'},
    ]
  }
}

const OPTIONS = [
  {value:0, label:'Not at all'},
  {value:1, label:'Several days'},
  {value:2, label:'More than half the days'},
  {value:3, label:'Nearly every day'},
]

// ─── Family Tab ───────────────────────────────────────────────────────────────
function FamilyTab() {
  const [members, setMembers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY_MEM)
  const [saving, setSaving]     = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api.get('/family/').then(r => setMembers(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const openAdd  = () => { setForm(EMPTY_MEM); setEditing(null); setShowForm(true) }
  const openEdit = (m) => { setForm({...m}); setEditing(m.id); setShowForm(true) }

  const save = async () => {
    if (!form.name) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      if (editing) {
        const res = await api.put(`/family/${editing}`, form)
        setMembers(m => m.map(x => x.id === editing ? res.data : x))
      } else {
        const res = await api.post('/family/', form)
        setMembers(m => [res.data, ...m])
      }
      toast.success(editing ? 'Updated!' : 'Member added!')
      setShowForm(false)
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const remove = async (id) => {
    try {
      await api.delete(`/family/${id}`)
      setMembers(m => m.filter(x => x.id !== id))
      if (selected?.id === id) setSelected(null)
      toast.success('Removed')
    } catch { toast.error('Failed to delete') }
  }

  const getAge = (dob) => {
    if (!dob) return null
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25*24*60*60*1000))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{members.length} family member{members.length !== 1 ? 's' : ''}</p>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors">
          <Plus size={15}/> Add Member
        </button>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center"><div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>
      ) : members.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={36} className="mx-auto text-gray-200 mb-3"/>
          <p className="text-gray-500 font-medium">No family members added</p>
          <button onClick={openAdd} className="mt-4 btn-primary text-sm inline-flex items-center gap-2"><Plus size={14}/> Add First Member</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {members.map((m, i) => (
            <div key={m.id} onClick={() => setSelected(selected?.id === m.id ? null : m)}
              className={`card cursor-pointer hover:shadow-md transition-all border-2 ${selected?.id === m.id ? 'border-blue-400' : 'border-transparent'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 ${COLORS[i % COLORS.length]} rounded-2xl flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0`}>
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.relation}{getAge(m.date_of_birth) ? ` · ${getAge(m.date_of_birth)} yrs` : ''}</p>
                  {m.blood_group && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold mt-1 inline-block">{m.blood_group}</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={e=>{e.stopPropagation();openEdit(m)}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={13}/></button>
                  <button onClick={e=>{e.stopPropagation();remove(m.id)}} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13}/></button>
                </div>
              </div>
              {selected?.id === m.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                  {m.medical_conditions && <div><p className="text-xs text-gray-400">Conditions</p><p className="text-sm text-gray-700">{m.medical_conditions}</p></div>}
                  {m.allergies && <div><p className="text-xs text-gray-400">Allergies</p><p className="text-sm text-red-600">{m.allergies}</p></div>}
                  {m.emergency_contact && <div><p className="text-xs text-gray-400">Emergency</p><p className="text-sm text-gray-700">{m.emergency_contact}</p></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Member' : 'Add Family Member'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-xl"><X size={16}/></button>
            </div>
            <div className="space-y-3">
              <div><label className="label">Full Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Name" className="input-field"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Relation</label>
                  <select value={form.relation} onChange={e=>setForm(f=>({...f,relation:e.target.value}))} className="input-field">
                    {RELATIONS.map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
                <div><label className="label">Gender</label>
                  <select value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))} className="input-field">
                    <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div><label className="label">Date of Birth</label><input type="date" value={form.date_of_birth} onChange={e=>setForm(f=>({...f,date_of_birth:e.target.value}))} className="input-field"/></div>
                <div><label className="label">Blood Group</label>
                  <select value={form.blood_group} onChange={e=>setForm(f=>({...f,blood_group:e.target.value}))} className="input-field">
                    <option value="">Select</option>{BLOOD_GROUPS.map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="label">Medical Conditions</label><input value={form.medical_conditions} onChange={e=>setForm(f=>({...f,medical_conditions:e.target.value}))} placeholder="e.g. Diabetes, Hypertension" className="input-field"/></div>
              <div><label className="label">Allergies</label><input value={form.allergies} onChange={e=>setForm(f=>({...f,allergies:e.target.value}))} placeholder="e.g. Penicillin, Dust" className="input-field"/></div>
              <div><label className="label">Emergency Contact</label><input value={form.emergency_contact} onChange={e=>setForm(f=>({...f,emergency_contact:e.target.value}))} placeholder="+91 98765 43210" className="input-field"/></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving?'Saving...':editing?'Update':'Add Member'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Mental Health Tab ────────────────────────────────────────────────────────
function MentalTab() {
  const [selected, setSelected] = useState(null)
  const [step, setStep]         = useState(0)
  const [answers, setAnswers]   = useState([])
  const [result, setResult]     = useState(null)

  const assessment = selected ? ASSESSMENTS[selected] : null

  const start = (key) => { setSelected(key); setStep(0); setAnswers([]); setResult(null) }

  const answer = (val) => {
    const next = [...answers, val]
    setAnswers(next)
    if (next.length < assessment.questions.length) {
      setStep(s => s+1)
    } else {
      const score = next.reduce((a,b)=>a+b,0)
      const level = assessment.levels.find(l=>score<=l.max) || assessment.levels[assessment.levels.length-1]
      setResult({score,...level})
      api.post('/wellness/mental-assessment',{
        assessment_type:selected, score, level:level.level,
        answers:next.map((v,i)=>({question:assessment.questions[i],answer:v}))
      }).catch(()=>{})
    }
  }

  const progress = assessment ? Math.round((answers.length/assessment.questions.length)*100) : 0

  if (!selected) return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">Choose a screening test:</p>
      {Object.entries(ASSESSMENTS).map(([key,a])=>(
        <button key={key} onClick={()=>start(key)}
          className="w-full card flex items-center gap-4 hover:shadow-md transition-all text-left border-2 border-transparent hover:border-purple-200">
          <div className={`w-11 h-11 ${a.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
            <Brain size={20} className="text-white"/>
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">{a.label}</p>
            <p className="text-xs text-gray-400">{a.questions.length} questions · 2-3 min</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.badge}`}>{key}</span>
          <ChevronRight size={16} className="text-gray-300"/>
        </button>
      ))}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
        <Heart size={13} className="text-blue-500 flex-shrink-0 mt-0.5"/>
        <p className="text-xs text-blue-700">Screening tools only — not a diagnosis. iCall Helpline: <strong>9152987821</strong></p>
      </div>
    </div>
  )

  if (result) return (
    <div className="space-y-4 animate-fade-in">
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Brain size={28} className="text-purple-600"/>
        </div>
        <p className="text-xs text-gray-400">{assessment.label} Score</p>
        <p className="text-4xl font-extrabold text-gray-900">{result.score}</p>
      </div>
      <div className={`rounded-xl p-4 text-center font-extrabold text-base ${result.color}`}>{result.level}</div>
      <div className="bg-blue-50 rounded-xl p-3">
        <p className="text-xs font-bold text-blue-700 mb-1">What this means</p>
        <p className="text-sm text-blue-800">{result.advice}</p>
      </div>
      {(result.level.includes('Severe')||result.level.includes('Moderate')) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
          <AlertTriangle size={13} className="text-red-500 mt-0.5 flex-shrink-0"/>
          <p className="text-xs text-red-700">iCall: <strong>9152987821</strong> · Vandrevala: <strong>1860-2662-345</strong></p>
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={()=>setSelected(null)} className="btn-secondary flex-1 flex items-center justify-center gap-1.5"><RefreshCw size={14}/> Other Test</button>
        <button onClick={()=>start(selected)} className="btn-primary flex-1">Retake</button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>{assessment.label}</span>
          <span>Q {step+1} / {assessment.questions.length}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="h-2 rounded-full bg-purple-500 transition-all" style={{width:`${progress}%`}}/>
        </div>
      </div>
      <div className="bg-purple-50 rounded-2xl p-4">
        <p className="text-xs text-purple-500 font-medium mb-1">Over the last 2 weeks, how often have you been bothered by:</p>
        <p className="text-base font-bold text-gray-900">{assessment.questions[step]}</p>
      </div>
      <div className="space-y-2">
        {OPTIONS.map(opt=>(
          <button key={opt.value} onClick={()=>answer(opt.value)}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left group">
            <div className="w-7 h-7 rounded-full border-2 border-gray-300 group-hover:border-purple-500 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:text-purple-600 flex-shrink-0">{opt.value}</div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">{opt.label}</span>
          </button>
        ))}
      </div>
      <button onClick={()=>setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600">← Back to tests</button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WellnessHub() {
  const [tab, setTab] = useState('family')

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Heart size={20} className="text-white"/>
            </div>
            <div>
              <h1 className="text-lg font-extrabold">Wellness Hub</h1>
              <p className="text-blue-200 text-xs">Family Health · Mental Health Assessments</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
          <button onClick={()=>setTab('family')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab==='family'?'bg-white text-blue-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
            <Users size={15}/> Family Health
          </button>
          <button onClick={()=>setTab('mental')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab==='mental'?'bg-white text-purple-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
            <Brain size={15}/> Mental Health
          </button>
        </div>

        {/* Content */}
        {tab === 'family' && <FamilyTab />}
        {tab === 'mental' && <MentalTab />}
      </div>
    </DashboardLayout>
  )
}
