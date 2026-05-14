import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2, X, TrendingUp, Smile, Frown, Meh, Zap, Thermometer } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

const MOODS = [
  { value: 5, label: 'Great',  emoji: '😄', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 4, label: 'Good',   emoji: '🙂', color: 'bg-teal-100 text-teal-700 border-teal-300' },
  { value: 3, label: 'Okay',   emoji: '😐', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 2, label: 'Bad',    emoji: '😕', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 1, label: 'Awful',  emoji: '😞', color: 'bg-red-100 text-red-700 border-red-300' },
]

const EMPTY = { date: new Date().toISOString().split('T')[0], symptoms: '', mood: 3, pain_level: 0, energy_level: 3, notes: '', temperature: '', weight: '' }

export default function SymptomDiary() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState('list')

  useEffect(() => {
    api.get('/extras/diary').then(r => setEntries(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    if (!form.symptoms) { toast.error('Please describe your symptoms'); return }
    setSaving(true)
    try {
      const res = await api.post('/extras/diary', { ...form, temperature: form.temperature ? parseFloat(form.temperature) : null, weight: form.weight ? parseFloat(form.weight) : null })
      setEntries(e => [res.data, ...e])
      setShowForm(false)
      setForm(EMPTY)
      toast.success('Entry saved!')
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const remove = async (id) => {
    try { await api.delete(`/extras/diary/${id}`); setEntries(e => e.filter(x => x.id !== id)); toast.success('Deleted') }
    catch { toast.error('Failed to delete') }
  }

  const moodData  = entries.slice(0,14).reverse().map(e => ({ date: e.date?.slice(5), mood: e.mood_level || e.mood, pain: e.pain_level }))
  const getMood   = v => MOODS.find(m => m.value === v) || MOODS[2]

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><BookOpen size={20} className="text-white"/></div>
              <div>
                <h1 className="text-lg font-extrabold">Symptom Diary</h1>
                <p className="text-indigo-200 text-xs">Daily health log with mood, symptoms & vitals</p>
              </div>
            </div>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-white text-indigo-700 text-sm font-bold px-3 py-2 rounded-xl hover:bg-indigo-50 transition-colors">
              <Plus size={15}/> Log Today
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {['list','chart'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${view===v?'bg-white text-indigo-700 shadow-sm':'text-gray-500'}`}>
              {v === 'list' ? '📋 Log' : '📊 Charts'}
            </button>
          ))}
        </div>

        {/* Charts View */}
        {view === 'chart' && entries.length > 1 && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-1">Mood Trend</h3>
              <p className="text-xs text-gray-400 mb-3">Last 14 days (1=Awful, 5=Great)</p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={moodData}>
                  <defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="date" tick={{fontSize:11}}/><YAxis domain={[1,5]} tick={{fontSize:11}}/>
                  <Tooltip contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
                  <Area type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={2} fill="url(#mg)" name="Mood"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-1">Pain Level</h3>
              <p className="text-xs text-gray-400 mb-3">Last 14 days (0=None, 10=Severe)</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="date" tick={{fontSize:11}}/><YAxis domain={[0,10]} tick={{fontSize:11}}/>
                  <Tooltip contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
                  <Line type="monotone" dataKey="pain" stroke="#ef4444" strokeWidth={2} dot={{r:3,fill:'#ef4444'}} name="Pain"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          loading ? <div className="py-10 flex justify-center"><div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/></div>
          : entries.length === 0 ? (
            <div className="card text-center py-12">
              <BookOpen size={36} className="mx-auto text-gray-200 mb-3"/>
              <p className="text-gray-500 font-medium">No diary entries yet</p>
              <button onClick={() => setShowForm(true)} className="mt-4 btn-primary text-sm inline-flex items-center gap-2"><Plus size={14}/> Log Today</button>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map(e => {
                const mood = getMood(e.mood_level || e.mood)
                return (
                  <div key={e.id} className="card">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{mood.emoji}</span>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{e.date}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${mood.color}`}>{mood.label}</span>
                        </div>
                      </div>
                      <button onClick={() => remove(e.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13}/></button>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{e.symptoms}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full">Pain: {e.pain_level}/10</span>
                      <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">Energy: {e.energy_level}/5</span>
                      {e.temperature && <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full">🌡 {e.temperature}°F</span>}
                      {e.weight && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">⚖ {e.weight}kg</span>}
                    </div>
                    {e.notes && <p className="text-xs text-gray-400 mt-2">{e.notes}</p>}
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Add Entry Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-lg">Log Today's Health</h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-xl"><X size={16}/></button>
              </div>
              <div className="space-y-4">
                <div><label className="label">Date</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="input-field"/></div>
                <div><label className="label">Symptoms *</label><textarea value={form.symptoms} onChange={e=>setForm(f=>({...f,symptoms:e.target.value}))} placeholder="Describe how you feel today..." className="input-field h-20 resize-none"/></div>

                <div>
                  <label className="label">Mood</label>
                  <div className="flex gap-2">
                    {MOODS.map(m => (
                      <button key={m.value} onClick={() => setForm(f=>({...f,mood:m.value}))}
                        className={`flex-1 py-2 rounded-xl border-2 text-center transition-all ${form.mood===m.value?m.color:'border-gray-200'}`}>
                        <span className="text-xl block">{m.emoji}</span>
                        <span className="text-xs font-medium">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Pain Level: {form.pain_level}/10</label>
                  <input type="range" min="0" max="10" value={form.pain_level} onChange={e=>setForm(f=>({...f,pain_level:parseInt(e.target.value)}))} className="w-full accent-red-500"/>
                  <div className="flex justify-between text-xs text-gray-400"><span>No pain</span><span>Severe</span></div>
                </div>

                <div>
                  <label className="label">Energy Level: {form.energy_level}/5</label>
                  <input type="range" min="1" max="5" value={form.energy_level} onChange={e=>setForm(f=>({...f,energy_level:parseInt(e.target.value)}))} className="w-full accent-yellow-500"/>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Temperature (°F)</label><input type="number" value={form.temperature} onChange={e=>setForm(f=>({...f,temperature:e.target.value}))} placeholder="98.6" className="input-field"/></div>
                  <div><label className="label">Weight (kg)</label><input type="number" value={form.weight} onChange={e=>setForm(f=>({...f,weight:e.target.value}))} placeholder="70" className="input-field"/></div>
                </div>

                <div><label className="label">Notes</label><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Any additional observations..." className="input-field h-16 resize-none"/></div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving} className="btn-primary flex-1 bg-indigo-600 hover:bg-indigo-700">{saving?'Saving...':'Save Entry'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
