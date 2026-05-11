import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const analyzeSymptoms = createAsyncThunk('ai/analyze', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/ai/analyze', data)
    return res.data
  } catch (err) {
    toast.error(err.response?.data?.detail || 'Analysis failed')
    return rejectWithValue(err.response?.data)
  }
})

export const sendChatMessage = createAsyncThunk('ai/chat', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/ai/chat', data)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const fetchAIHistory = createAsyncThunk('ai/history', async () => {
  const res = await api.get('/ai/history')
  return res.data
})

const aiSlice = createSlice({
  name: 'ai',
  initialState: {
    analysis: null,
    chatHistory: [],
    aiHistory: [],
    loading: false,
    chatLoading: false,
    error: null,
  },
  reducers: {
    clearAnalysis(state) { state.analysis = null },
    addChatMessage(state, action) { state.chatHistory.push(action.payload) },
    clearChat(state) { state.chatHistory = [] },
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeSymptoms.pending, (state) => { state.loading = true; state.error = null })
      .addCase(analyzeSymptoms.fulfilled, (state, action) => {
        state.loading = false
        state.analysis = action.payload
      })
      .addCase(analyzeSymptoms.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(sendChatMessage.pending, (state) => { state.chatLoading = true })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.chatLoading = false
        state.chatHistory.push({ role: 'assistant', content: action.payload.response })
      })
      .addCase(sendChatMessage.rejected, (state) => { state.chatLoading = false })
      .addCase(fetchAIHistory.fulfilled, (state, action) => {
        state.aiHistory = action.payload
      })
  }
})

export const { clearAnalysis, addChatMessage, clearChat } = aiSlice.actions
export default aiSlice.reducer
