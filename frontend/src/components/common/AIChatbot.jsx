import { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Bot, X, Send, Minimize2, Maximize2, User, Trash2 } from 'lucide-react'
import api from '../../services/api'

const PATIENT_QUICK = [
  'I have a headache and fever since 2 days',
  'What foods should I avoid for high blood pressure?',
  'How do I read my blood sugar report?',
  'I feel very tired and sleepy all the time',
  'What are early signs of diabetes?',
  'How much water should I drink daily?',
]

const DOCTOR_QUICK = [
  'Suggest differential diagnosis for fever + rash in a child',
  'Drug interaction: Metformin and Amlodipine',
  'Treatment guidelines for Type 2 Diabetes',
  'Red flags to watch for in chest pain patients',
  'Antibiotic choice for UTI in elderly patient',
  'When to refer hypertension to a cardiologist?',
]

// Render markdown-like text: **bold**, *italic*, bullet points, line breaks
function MessageContent({ text }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1"/>

        // Bullet line
        const isBullet = /^[•\-\*]\s/.test(line.trim())
        const content = isBullet ? line.trim().replace(/^[•\-\*]\s/, '') : line

        // Parse **bold** and *italic* inline
        const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
        const rendered = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**'))
            return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>
          if (part.startsWith('*') && part.endsWith('*'))
            return <em key={j}>{part.slice(1, -1)}</em>
          return <span key={j}>{part}</span>
        })

        if (isBullet) {
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-60"/>
              <span>{rendered}</span>
            </div>
          )
        }
        return <p key={i}>{rendered}</p>
      })}
    </div>
  )
}

export default function AIChatbot() {
  const { user } = useSelector(s => s.auth)
  const isDoctor = user?.role === 'doctor'
  const QUICK    = isDoctor ? DOCTOR_QUICK : PATIENT_QUICK

  const greeting = isDoctor
    ? `Hi Dr. ${user?.full_name?.split(' ')[0] || ''}! 👨‍⚕️ I'm **Synora AI**, your clinical assistant.\n\nI can help with differential diagnoses, drug interactions, treatment guidelines, and clinical decision support.`
    : `Hi${user?.full_name ? ` ${user.full_name.split(' ')[0]}` : ''}! 👋 I'm **Synora AI**, your personal health assistant.\n\nAsk me anything — symptoms, medicines, diet tips, reading your lab reports, or how to use the Synora platform.`

  const [open, setOpen]       = useState(false)
  const [big, setBig]         = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', content: greeting }])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const endRef              = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Reset greeting when user changes
  useEffect(() => {
    setMessages([{ role: 'assistant', content: greeting }])
  }, [user?.id])

  const send = async (text) => {
    const msg = (text !== undefined ? text : input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const historyToSend = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const res = await api.post('/ai/chat', {
        message: msg,
        history: historyToSend,
        patient_name: user?.full_name || null,
        patient_age:  user?.date_of_birth ? Math.floor((Date.now() - new Date(user.date_of_birth)) / 31557600000) : null,
        patient_gender: user?.gender || null,
      })
      const reply = res.data?.response || 'Sorry, I could not generate a response. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const errMsg = err.response?.status === 401
        ? 'Please log in to use the AI assistant.'
        : 'Connection error. Please check your internet and try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => setMessages([{ role: 'assistant', content: isDoctor ? `Dr. ${user?.full_name?.split(' ')[0] || ''}! Chat cleared. How can I assist you clinically?` : `Chat cleared! What health question can I help you with?` }])

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className={`fixed bottom-6 right-6 z-50 w-14 h-14 ${isDoctor ? 'bg-violet-600 hover:bg-violet-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95`}>
      <Bot size={26} />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
    </button>
  )

  return (
    <div className={`fixed z-50 bottom-6 right-6 bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-200 ${big ? 'w-[440px] h-[620px]' : 'w-80 h-[500px]'}`}>

      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${isDoctor ? 'from-violet-600 to-indigo-600' : 'from-blue-600 to-indigo-600'} rounded-t-3xl flex-shrink-0`}>
        <div className="relative">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={18} className="text-white"/>
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 ${isDoctor ? 'border-violet-600' : 'border-blue-600'}`}/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">Synora AI {isDoctor ? '— Clinical' : ''}</p>
          <p className={`${isDoctor ? 'text-violet-200' : 'text-blue-200'} text-xs`}>{isDoctor ? 'Clinical Decision Support · Always available' : 'Health Assistant · Always available'}</p>
        </div>
        <button onClick={clearChat} title="Clear chat" className="p-1.5 text-white/60 hover:text-white transition-colors">
          <Trash2 size={13}/>
        </button>
        <button onClick={() => setBig(b => !b)} className="p-1.5 text-white/60 hover:text-white transition-colors">
          {big ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}
        </button>
        <button onClick={() => setOpen(false)} className="p-1.5 text-white/60 hover:text-white transition-colors">
          <X size={14}/>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${m.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
              {m.role === 'user'
                ? (user?.profile_image
                    ? <img src={user.profile_image} className="w-full h-full rounded-full object-cover" alt=""/>
                    : <User size={13} className="text-white"/>)
                : <Bot size={13} className="text-white"/>
              }
            </div>
            <div className={`max-w-[83%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm'
            }`}>
              <MessageContent text={m.content}/>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Bot size={13} className="text-white"/>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              {[0,1,2].map(i => (
                <span key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.18}s`}}/>
              ))}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Quick suggestions — show only at start */}
      {messages.length === 1 && (
        <div className="px-3 pb-2">
          <p className="text-[10px] text-gray-400 font-semibold mb-1.5 px-1">QUICK QUESTIONS</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK.slice(0, big ? 6 : 4).map(q => (
              <button key={q} onClick={() => send(q)}
                className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 px-2.5 py-1.5 rounded-xl transition-colors font-medium leading-tight text-left">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-gray-100 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
          placeholder="Ask a health question..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 transition-colors"
        />
        <button onClick={() => send(input)} disabled={!input.trim() || loading}
          className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
          <Send size={15}/>
        </button>
      </div>
    </div>
  )
}
