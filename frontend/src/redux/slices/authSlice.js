import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data)
    toast.success('Account created successfully!')
    return res.data
  } catch (err) {
    toast.error(err.response?.data?.detail || 'Registration failed')
    return rejectWithValue(err.response?.data)
  }
})

export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', data)
    toast.success(`Welcome back, ${res.data.user.full_name}!`)
    return res.data
  } catch (err) {
    toast.error(err.response?.data?.detail || 'Login failed')
    return rejectWithValue(err.response?.data)
  }
})

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await api.put('/users/me', data)
    toast.success('Profile updated!')
    return res.data
  } catch (err) {
    toast.error(err.response?.data?.detail || 'Update failed')
    return rejectWithValue(err.response?.data)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      toast.success('Logged out successfully')
    },
    setTokens(state, action) {
      state.accessToken = action.payload.access_token
      state.refreshToken = action.payload.refresh_token
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase('persist/REHYDRATE', (state) => { state.loading = false; state.error = null })
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.accessToken = action.payload.access_token
        state.refreshToken = action.payload.refresh_token
      })
      .addCase(registerUser.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.accessToken = action.payload.access_token
        state.refreshToken = action.payload.refresh_token
      })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload }
      })
  }
})

export const { logout, setTokens } = authSlice.actions
export default authSlice.reducer
