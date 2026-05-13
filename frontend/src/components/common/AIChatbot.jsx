import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Minimize2, Maximize2, User } from 'lucide-react'
import api from '../../services/api'

const QUICK = ['What are symptoms of diabetes?', 'How to reduce blood pressure?', 'Is my BMI healthy?', 'When should I see a doctor?']

export default function AIChatbot() {
  const [open, setOpen]       = useState(false)
  const [big, setBig]         = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hi! 👋 I am your AI Health Assistant. Ask me any health question — symptoms, medicines, diet, or anything health related!' }])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const endRef                = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text) => {
    const msg = (text !== undefined ? text : input).trim()
    if (!msg || loading) return
    setInput('')

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    try {
      // Send history WITHOUT the current message (backend appends it separately)
      const historyToSend = messages.slice(-8).map(m => ({ role: m.role, content: m.content }))
      const res = await api.post('/ai/chat', {
        message: msg,
        history: historyToSend,
      })
      const reply = res.data?.response || res.data?.message || 'I received your question but could not generate a response.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const errMsg = err.response?.status === 401
        ? 'Please log in to use the AI assistant.'
        : err.response?.status === 500
        ? 'AI service is temporarily unavailable. Please try again.'
        : 'Connection error. Please check your internet and try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }])
    } finally {
      setLoading(false)
    }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95">
      <Bot size={26} />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
    </button>
  )

  return (
    <div className={`fixed z-50 bottom-6 right-6 bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col transition-all ${big ? 'w-[420px] h-[600px]' : 'w-80 h-[480px]'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-t-3xl flex-shrink-0">
        <div className="relative">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center"><Bot size={18} className="text-white"/></div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-600"/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">AI Health Assistant</p>
          <p className="text-blue-200 text-xs">Always available · Ask anything</p>
        </div>
        <button onClick={() => setBig(b => !b)} className="p-1.5 text-white/70 hover:text-white transition-colors">
          {big ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}
        </button>
        <button onClick={() => setOpen(false)} className="p-1.5 text-white/70 hover:text-white transition-colors">
          <X size={15}/>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role==='user'?'flex-row-reverse':''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${m.role==='user'?'bg-blue-600':'bg-gray-100'}`}>
              {m.role==='user' ? <User size={13} className="text-white"/> : <Bot size={13} className="text-gray-600"/>}
            </div>
            <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role==='user'?'bg-blue-600 text-white rounded-tr-sm':'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"><Bot size={13} className="text-gray-600"/></div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 flex gap-1">
              {[0,1,2].map(i=><span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Quick Suggestions */}
      {messages.length === 1 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {QUICK.map(q => (
            <button key={q} onClick={() => { setInput(q); send(q) }}
              className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1.5 rounded-full transition-colors font-medium">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-gray-100 flex-shrink-0">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(input) } }}
          placeholder="Ask a health question..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 transition-colors"/>
        <button onClick={()=>send(input)} disabled={!input.trim()||loading}
          className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
          <Send size={15}/>
        </button>
      </div>
    </div>
  )
}
