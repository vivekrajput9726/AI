import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Target, TrendingUp, Brain, CheckCircle, Plus, X,
  ArrowRight, Zap, RefreshCw, Star, Trophy, ChevronRight,
  Activity, Heart, Moon, Droplets, Weight, Flame,
  Calendar, BarChart2, AlertCircle, Edit2, Trash2
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

const FLOW_STEPS = [
  { n:1, label:'Set Goal',         icon:'🎯' },
  { n:2, label:'Track Health Data',icon:'📊' },
  { n:3, label:'Progress Monitor', icon:'📈' },
  { n:4, label:'AI Suggestions',   icon:'🤖' },
  { n:5, label:'Achievement',      icon:'🏆' },
]

const GOAL_TEMPLATES = [
  { id:'weight',    icon:'⚖️', label:'Lose Weight',         unit:'kg',  target:10, color:'from-orange-500 to-amber-500',  bg:'bg-orange-50', text:'text-orange-700', border:'border-orange-200' },
  { id:'sleep',     icon:'🌙', label:'Improve Sleep',       unit:'hrs', target:8,  color:'from-purple-500 to-violet-500', bg:'bg-purple-50', text:'text-purple-700', border:'border-purple-200' },
  { id:'steps',     icon:'👟', label:'Daily Steps',         unit:'k',   target:10, color:'from-blue-500 to-cyan-500',     bg:'bg-blue-50',   text:'text-blue-700',   border:'border-blue-200' },
  { id:'water',     icon:'💧', label:'Drink More Water',    unit:'L',   target:3,  color:'from-cyan-500 to-teal-500',     bg:'bg-cyan-50',   text:'text-cyan-700',   border:'border-cyan-200' },
  { id:'sugar',     icon:'🩸', label:'Control Blood Sugar', unit:'mg/dL',target:100,color:'from-red-500 to-rose-500',    bg:'bg-red-50',    text:'text-red-700',    border:'border-red-200' },
  { id:'exercise',  icon:'🏃', label:'Exercise Daily',      unit:'min', target:30, color:'from-green-500 to-emerald-500', bg:'bg-green-50',  text:'text-green-700',  border:'border-green-200' },
  { id:'heartrate', icon:'❤️', label:'Healthy Heart Rate',  unit:'bpm', target:72, color:'from-pink-500 to-rose-500',    bg:'bg-pink-50',   text:'text-pink-700',   border:'border-pink-200' },
  { id:'calories',  icon:'🔥', label:'Burn Calories',       unit:'kcal',target:500,color:'from-yellow-500 to-orange-500',bg:'bg-yellow-50', text:'text-yellow-700', border:'border-yellow-200' },
]

function GoalCard({ goal, onUpdate, onDelete }) {
  const pct    = Math.min(100, Math.round((goal.current / goal.target) * 100))
  const tmpl   = GOAL_TEMPLATES.find(t => t.id === goal.id) || GOAL_TEMPLATES[0]
  const done   = pct >= 100
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(goal.current))

  const save = () => {
    const n = parseFloat(val)
    if (!isNaN(n)) onUpdate(goal.id, n)
    setEditing(false)
  }

  return (
    <div className={`bg-white rounded-2xl border-2 ${done ? 'border-yellow-400 shadow-yellow-100' : tmpl.border} shadow-sm overflow-hidden transition-all hover:shadow-md`}>
      {done && (
        <div className="bg-gradient-to-r from-yellow-400 to-amber-400 py-1.5 text-center">
          <p className="text-xs font-extrabold text-white flex items-center justify-center gap-1"><Trophy size={12}/>Goal Achieved!</p>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-11 h-11 bg-gradient-to-br ${tmpl.color} rounded-2xl flex items-center justify-center text-xl shadow-sm`}>
              {tmpl.icon}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{goal.label}</p>
              <p className="text-xs text-gray-400">Target: {goal.target} {goal.unit}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={()=>setEditing(true)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Edit2 size={13}/></button>
            <button onClick={()=>onDelete(goal.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13}/></button>
          </div>
        </div>

        {/* Progress ring + value */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg viewBox="0 0 56 56" className="-rotate-90 w-full h-full">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="6"/>
              <circle cx="28" cy="28" r="22" fill="none"
                stroke={done?'#f59e0b':'#0d9488'} strokeWidth="6"
                strokeDasharray={`${(pct/100)*138} 138`} strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-extrabold text-gray-900 leading-none">{pct}%</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {editing ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <input type="number" value={val} onChange={e=>setVal(e.target.value)}
                    className="w-20 text-sm font-bold border border-teal-400 rounded-lg px-2 py-1 focus:outline-none"
                    onKeyDown={e=>e.key==='Enter'&&save()} autoFocus/>
                  <span className="text-xs text-gray-400">{goal.unit}</span>
                  <button onClick={save} className="text-xs bg-teal-600 text-white px-2 py-1 rounded-lg font-bold">Save</button>
                </div>
              ) : (
                <>
                  <span className="text-2xl font-extrabold text-gray-900">{goal.current}</span>
                  <span className="text-sm text-gray-400">/ {goal.target} {goal.unit}</span>
                </>
              )}
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${done?'bg-yellow-400':'bg-teal-500'}`} style={{width:`${pct}%`}}/>
            </div>
            <p className={`text-xs font-semibold mt-1 ${done?'text-yellow-600':'text-gray-500'}`}>
              {done ? '🏆 Completed!' : `${goal.target - goal.current} ${goal.unit} to go`}
            </p>
          </div>
        </div>

        {/* Quick update buttons */}
        {!done && !editing && (
          <div className="flex gap-1.5">
            {[0.5, 1, 2].map(inc=>(
              <button key={inc} onClick={()=>onUpdate(goal.id, goal.current + inc)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl ${tmpl.bg} ${tmpl.text} border ${tmpl.border} hover:opacity-80 transition-all`}>
                +{inc}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function HealthGoals() {
  const navigate   = useNavigate()
  const { user }   = useSelector(s => s.auth)
  const fullName   = user?.full_name || 'Patient'

  const [step,       setStep]       = useState(1)
  const [goals,      setGoals]      = useState([])
  const [showAdd,    setShowAdd]    = useState(false)
  const [newGoal,    setNewGoal]    = useState({ id:'weight', label:'', target:'', current:'0', unit:'' })
  const [suggestions,setSuggestions]= useState([])
  const [sugLoading, setSugLoading] = useState(false)
  const [insights,   setInsights]   = useState([])
  const [insLoading, setInsLoading] = useState(false)

  // Load goals from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`health_goals_${user?.id}`)
    if (saved) {
      const g = JSON.parse(saved)
      setGoals(g)
      if (g.length > 0) setStep(2)
    }
  }, [user?.id])

  const saveGoals = (g) => {
    localStorage.setItem(`health_goals_${user?.id}`, JSON.stringify(g))
    setGoals(g)
  }

  // ── Add Goal ──────────────────────────────────────────────────────
  const addGoal = () => {
    const tmpl = GOAL_TEMPLATES.find(t => t.id === newGoal.id) || GOAL_TEMPLATES[0]
    const goal = {
      id:      newGoal.id + '_' + Date.now(),
      baseId:  newGoal.id,
      label:   newGoal.label || tmpl.label,
      target:  parseFloat(newGoal.target) || tmpl.target,
      current: parseFloat(newGoal.current) || 0,
      unit:    newGoal.unit || tmpl.unit,
      created: new Date().toISOString().split('T')[0],
    }
    const updated = [...goals, goal]
    saveGoals(updated)
    setShowAdd(false)
    setNewGoal({ id:'weight', label:'', target:'', current:'0', unit:'' })
    setStep(2)
    toast.success('Goal added!')
  }

  // ── Update Goal ───────────────────────────────────────────────────
  const updateGoal = (id, newValue) => {
    const updated = goals.map(g => g.id===id ? {...g, current: Math.min(g.target, Math.max(0, newValue))} : g)
    saveGoals(updated)
    const g = updated.find(g=>g.id===id)
    if (g && g.current >= g.target) toast.success(`🏆 Goal achieved: ${g.label}!`)
  }

  const deleteGoal = (id) => {
    const updated = goals.filter(g => g.id !== id)
    saveGoals(updated)
    toast.success('Goal removed')
  }

  // ── Get AI Suggestions ────────────────────────────────────────────
  const getAISuggestions = async () => {
    setSugLoading(true)
    setStep(4)
    try {
      const goalsContext = goals.map(g => `${g.label}: ${g.current}/${g.target} ${g.unit} (${Math.round(g.current/g.target*100)}%)`).join(', ')
      const res = await api.post('/ai/chat', {
        message: `Based on these health goals for patient ${fullName}: ${goalsContext}. Give 4 specific, actionable AI suggestions to help achieve these goals faster. Format as JSON array: [{"goal":"goal name","tip":"specific actionable tip","priority":"High/Medium/Low","emoji":"relevant emoji"}]`,
        history: [],
      })
      const text = res.data?.response || ''
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        setSuggestions(JSON.parse(match[0]))
      } else {
        setSuggestions([
          { goal:'Weight Loss', tip:'Walk 30 mins daily before breakfast for faster fat burn', priority:'High', emoji:'🚶' },
          { goal:'Sleep',       tip:'Put phone away 1 hour before sleep, keep room cool', priority:'High', emoji:'🌙' },
          { goal:'Water',       tip:'Keep a 1L bottle at your desk, drink every 2 hours', priority:'Medium', emoji:'💧' },
          { goal:'Exercise',    tip:'Start with 15 min yoga each morning, build gradually', priority:'Medium', emoji:'🧘' },
        ])
      }
      toast.success('AI suggestions ready!')
    } catch {
      toast.error('Could not get AI suggestions')
      setStep(3)
    } finally { setSugLoading(false) }
  }

  // ── Get AI Achievement Insights ──────────────────────────────────
  const getInsights = async () => {
    setInsLoading(true)
    setStep(5)
    try {
      const achieved = goals.filter(g => g.current >= g.target)
      const inProgress = goals.filter(g => g.current < g.target)
      const avgPct = goals.length > 0 ? Math.round(goals.reduce((s,g) => s + Math.min(100,(g.current/g.target)*100), 0) / goals.length) : 0

      const res = await api.post('/ai/chat', {
        message: `Patient ${fullName} has ${achieved.length} goals achieved and ${inProgress.length} in progress. Average goal completion: ${avgPct}%. Achieved: ${achieved.map(g=>g.label).join(', ')||'none'}. In progress: ${inProgress.map(g=>`${g.label} ${Math.round(g.current/g.target*100)}%`).join(', ')||'none'}. Give a motivational health achievement insight summary in 3 sentences.`,
        history: [],
      })
      setInsights([res.data?.response || `You're making great progress on your health goals! Keep up the consistency and you'll achieve all your targets soon. Remember, every small step counts towards a healthier you.`])
      toast.success('Achievement insights ready!')
    } catch {
      setInsights([`You're making great progress! Keep tracking your goals daily for best results. Consistency is the key to achieving your health targets.`])
    } finally { setInsLoading(false) }
  }

  const completedGoals = goals.filter(g => g.current >= g.target)
  const avgProgress    = goals.length > 0
    ? Math.round(goals.reduce((s,g) => s + Math.min(100,(g.current/g.target)*100), 0) / goals.length)
    : 0

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">

        {/* ── HEADER ── */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Target size={24} className="text-white"/>
            </div>
            <div>
              <h1 className="text-xl font-extrabold">AI Health Goals</h1>
              <p className="text-emerald-200 text-xs">Set goals • Track progress • Get AI guidance • Achieve results</p>
            </div>
            {goals.length > 0 && (
              <div className="ml-auto text-right">
                <p className="text-2xl font-extrabold">{avgProgress}%</p>
                <p className="text-emerald-200 text-xs">Avg Progress</p>
              </div>
            )}
          </div>
          {/* Flow steps */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {FLOW_STEPS.map((s,i)=>(
              <div key={s.n} className="flex items-center gap-1.5 flex-shrink-0">
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  step > s.n  ? 'bg-white/30 text-white' :
                  step === s.n ? 'bg-white text-teal-700 shadow-md' :
                                'bg-white/10 text-white/50'
                }`}>
                  {step > s.n ? <CheckCircle size={11}/> : <span>{s.icon}</span>}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < FLOW_STEPS.length-1 && <ArrowRight size={10} className="text-white/30 flex-shrink-0"/>}
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════
            STEP 1 — Set Goals
        ════════════════════════ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-emerald-600"/>
              <p className="font-bold text-emerald-800 text-sm">Step 1 — Patient Sets Goal</p>
              {goals.length > 0 && <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{goals.length} active</span>}
            </div>
            <button onClick={()=>setShowAdd(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
              <Plus size={13}/> Add Goal
            </button>
          </div>

          {/* Goal Templates */}
          {goals.length === 0 && !showAdd && (
            <div className="p-5">
              <p className="text-sm font-semibold text-gray-700 mb-4">Choose a health goal to get started:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {GOAL_TEMPLATES.map(tmpl=>(
                  <button key={tmpl.id}
                    onClick={()=>{setNewGoal({id:tmpl.id,label:tmpl.label,target:String(tmpl.target),current:'0',unit:tmpl.unit});setShowAdd(true)}}
                    className={`flex flex-col items-center gap-2 p-4 ${tmpl.bg} rounded-2xl border ${tmpl.border} hover:shadow-md hover:scale-105 transition-all`}>
                    <span className="text-3xl">{tmpl.icon}</span>
                    <p className={`text-xs font-bold ${tmpl.text} text-center leading-tight`}>{tmpl.label}</p>
                    <p className="text-xs text-gray-400">Target: {tmpl.target} {tmpl.unit}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add Goal Form */}
          {showAdd && (
            <div className="p-5">
              <p className="font-bold text-gray-800 mb-4">New Health Goal</p>
              <div className="grid lg:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-2 block">Goal Type</label>
                    <div className="grid grid-cols-4 gap-2">
                      {GOAL_TEMPLATES.map(t=>(
                        <button key={t.id} onClick={()=>setNewGoal(g=>({...g,id:t.id,label:t.label,target:String(t.target),unit:t.unit}))}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${newGoal.id===t.id?`bg-gradient-to-br ${t.color} border-transparent`:'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                          <span className="text-xl">{t.icon}</span>
                          <span className={`text-xs font-bold leading-tight text-center ${newGoal.id===t.id?'text-white':'text-gray-600'}`}>{t.label.split(' ').slice(0,2).join(' ')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1 block">Target</label>
                      <input type="number" value={newGoal.target} onChange={e=>setNewGoal(g=>({...g,target:e.target.value}))} className="input-field text-sm"/>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1 block">Current</label>
                      <input type="number" value={newGoal.current} onChange={e=>setNewGoal(g=>({...g,current:e.target.value}))} className="input-field text-sm"/>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1 block">Unit</label>
                      <input value={newGoal.unit} onChange={e=>setNewGoal(g=>({...g,unit:e.target.value}))} placeholder="kg" className="input-field text-sm"/>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-end gap-3">
                  <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-4">
                    <p className="text-xs font-bold text-teal-700 mb-2">Goal Preview</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{GOAL_TEMPLATES.find(t=>t.id===newGoal.id)?.icon||'🎯'}</span>
                      <div>
                        <p className="font-bold text-gray-900">{newGoal.label || GOAL_TEMPLATES.find(t=>t.id===newGoal.id)?.label}</p>
                        <p className="text-xs text-gray-500">Target: {newGoal.target} {newGoal.unit}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={()=>setShowAdd(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                    <button onClick={addGoal} disabled={!newGoal.target} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-40">
                      <Target size={14}/> Set This Goal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ════════════════════════
            STEP 2+3 — Goals Grid + Progress
        ════════════════════════ */}
        {goals.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 size={16} className="text-teal-600"/>
                <p className="font-bold text-gray-800">Step 2 & 3 — Track Data & Progress Monitoring</p>
              </div>
              <button onClick={()=>setShowAdd(true)} className="text-xs text-teal-600 font-semibold hover:underline flex items-center gap-1"><Plus size={12}/>Add More</button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {goals.map(goal => (
                <GoalCard key={goal.id} goal={goal} onUpdate={updateGoal} onDelete={deleteGoal}/>
              ))}
            </div>

            {/* Overall Progress Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="font-bold text-gray-800 mb-4 text-sm">Overall Progress Summary</p>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { l:'Total Goals',  v:goals.length,             c:'text-teal-600 bg-teal-50' },
                  { l:'Completed',    v:completedGoals.length,    c:'text-green-600 bg-green-50' },
                  { l:'In Progress',  v:goals.length - completedGoals.length, c:'text-blue-600 bg-blue-50' },
                  { l:'Avg Progress', v:`${avgProgress}%`,        c:'text-purple-600 bg-purple-50' },
                ].map((s,i)=>(
                  <div key={i} className={`${s.c} rounded-2xl p-3 text-center border border-gray-100`}>
                    <p className="text-2xl font-extrabold">{s.v}</p>
                    <p className="text-xs font-medium mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {goals.map(g=>{
                  const pct = Math.min(100, Math.round((g.current/g.target)*100))
                  const tmpl = GOAL_TEMPLATES.find(t=>t.id===g.baseId) || GOAL_TEMPLATES[0]
                  return (
                    <div key={g.id} className="flex items-center gap-3">
                      <span className="text-base w-6 text-center flex-shrink-0">{tmpl.icon}</span>
                      <span className="text-xs text-gray-600 w-28 flex-shrink-0 truncate">{g.label}</span>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${tmpl.color}`} style={{width:`${pct}%`}}/>
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-10 text-right flex-shrink-0">{pct}%</span>
                      {pct>=100 && <Trophy size={13} className="text-yellow-500 flex-shrink-0"/>}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Navigate to steps 4+5 */}
            <div className="grid sm:grid-cols-2 gap-4">
              <button onClick={getAISuggestions} disabled={sugLoading}
                className="flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl text-sm hover:opacity-90 shadow-md transition-all disabled:opacity-50">
                {sugLoading ? <><RefreshCw size={17} className="animate-spin"/>Getting Suggestions...</> : <><Brain size={17}/>Step 4 — Get AI Suggestions</>}
              </button>
              <button onClick={getInsights} disabled={insLoading}
                className="flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold rounded-2xl text-sm hover:opacity-90 shadow-md transition-all disabled:opacity-50">
                {insLoading ? <><RefreshCw size={17} className="animate-spin"/>Generating Insights...</> : <><Trophy size={17}/>Step 5 — Achievement Insights</>}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════
            STEP 4 — AI Suggestions
        ════════════════════════ */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-violet-100">
              <div className="w-7 h-7 bg-violet-600 rounded-xl flex items-center justify-center"><Brain size={14} className="text-white"/></div>
              <p className="font-bold text-violet-800 text-sm">Step 4 — AI Suggestions</p>
              <span className="ml-auto text-xs text-violet-500">Personalized for {fullName}</span>
            </div>
            <div className="p-5 grid sm:grid-cols-2 gap-3">
              {suggestions.map((s,i)=>(
                <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-100">
                  <span className="text-2xl flex-shrink-0">{s.emoji||'💡'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-bold text-violet-800">{s.goal}</p>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${s.priority==='High'?'bg-red-100 text-red-600':s.priority==='Medium'?'bg-orange-100 text-orange-600':'bg-blue-100 text-blue-600'}`}>{s.priority}</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{s.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════
            STEP 5 — Achievement Insights
        ════════════════════════ */}
        {insights.length > 0 && (
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl border-2 border-yellow-300 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-400 to-amber-400">
              <Trophy size={18} className="text-white"/>
              <p className="font-extrabold text-white">Step 5 — Goal Achievement Insights</p>
            </div>
            <div className="p-5 space-y-4">
              {/* AI insight text */}
              <div className="bg-white/70 rounded-2xl p-4 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <span className="text-3xl flex-shrink-0">🏆</span>
                  <p className="text-sm text-gray-700 leading-relaxed">{insights[0]}</p>
                </div>
              </div>

              {/* Achievement badges */}
              {completedGoals.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-yellow-800 mb-3">🎉 Goals Achieved</p>
                  <div className="flex flex-wrap gap-2">
                    {completedGoals.map((g,i)=>{
                      const tmpl = GOAL_TEMPLATES.find(t=>t.id===g.baseId) || GOAL_TEMPLATES[0]
                      return (
                        <div key={i} className="flex items-center gap-2 bg-white border-2 border-yellow-400 rounded-2xl px-3 py-2 shadow-sm">
                          <span className="text-xl">{tmpl.icon}</span>
                          <div>
                            <p className="text-xs font-extrabold text-gray-900">{g.label}</p>
                            <p className="text-xs text-yellow-600">{g.target} {g.unit} ✓</p>
                          </div>
                          <Trophy size={14} className="text-yellow-500 ml-1"/>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Next steps */}
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { icon:'📅', label:'Book Check-up', sub:'Track with your doctor', onClick:()=>navigate('/patient/doctors'), c:'bg-blue-50 border-blue-200 text-blue-700' },
                  { icon:'🤖', label:'AI Copilot', sub:'Full health analysis', onClick:()=>navigate('/patient/copilot'), c:'bg-violet-50 border-violet-200 text-violet-700' },
                  { icon:'💊', label:'Medicine Tracker', sub:'Stay consistent', onClick:()=>navigate('/patient/medicines'), c:'bg-green-50 border-green-200 text-green-700' },
                ].map((a,i)=>(
                  <button key={i} onClick={a.onClick}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${a.c} hover:opacity-80 transition-all text-left`}>
                    <span className="text-2xl">{a.icon}</span>
                    <div>
                      <p className="text-xs font-bold">{a.label}</p>
                      <p className="text-xs opacity-70">{a.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {goals.length === 0 && !showAdd && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <Target size={48} className="mx-auto text-gray-200 mb-4"/>
            <h3 className="font-bold text-gray-700 text-lg mb-2">Set Your First Health Goal</h3>
            <p className="text-sm text-gray-400 mb-6">AI will track your progress, give personalized suggestions, and celebrate your achievements</p>
            <button onClick={()=>setShowAdd(true)}
              className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 mx-auto hover:opacity-90 shadow-md">
              <Plus size={16}/> Add Your First Goal <ArrowRight size={14}/>
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
