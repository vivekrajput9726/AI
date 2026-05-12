import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Send, X, MessageCircle } from 'lucide-react'
import api from '../../services/api'

function Chat({ roomId, otherPersonName, onClose }) {
  const { user, accessToken } = useSelector(s => s.auth)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const ws = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    // Load chat history
    api.get(`/chat/history/${roomId}`).then(res => {
      setMessages(res.data)
    }).catch(() => {})

    // Connect WebSocket
    const wsUrl = `ws://localhost:8000/api/chat/ws/${roomId}?token=${accessToken}`
    ws.current = new WebSocket(wsUrl)

    ws.current.onopen = () => setConnected(true)

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMessages(prev => [...prev, data])
    }

    ws.current.onclose = () => setConnected(false)

    return () => {
      ws.current?.close()
    }
  }, [roomId, accessToken])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim() || !connected) return
    ws.current.send(JSON.stringify({ message: input.trim() }))
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-white" />
          <span className="text-white font-semibold text-sm">{otherPersonName || 'Chat'}</span>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-300' : 'bg-gray-300'}`} />
        </div>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 h-72">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">No messages yet. Say hello!</p>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === user?.id
          return (
            <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                isMine
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}>
                <p>{msg.message}</p>
                <p className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-100">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={sendMessage}
          disabled={!connected || !input.trim()}
          className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

export default Chat
