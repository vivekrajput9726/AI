import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const fetchMyAppointments = createAsyncThunk('appointments/fetchMy', async (status) => {
  const query = status ? `?status=${status}` : ''
  const res = await api.get(`/appointments/my${query}`)
  return res.data
})

export const bookAppointment = createAsyncThunk('appointments/book', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/appointments', data)
    toast.success('Appointment booked successfully!')
    return res.data
  } catch (err) {
    toast.error(err.response?.data?.detail || 'Booking failed')
    return rejectWithValue(err.response?.data)
  }
})

export const updateAppointmentStatus = createAsyncThunk('appointments/updateStatus', async ({ id, status, prescription }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/appointments/${id}/status`, { status, prescription })
    toast.success('Appointment updated!')
    return res.data
  } catch (err) {
    toast.error(err.response?.data?.detail || 'Update failed')
    return rejectWithValue(err.response?.data)
  }
})

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState: {
    list: [],
    loading: false,
    error: null,
    bookingLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAppointments.pending, (state) => { state.loading = true })
      .addCase(fetchMyAppointments.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchMyAppointments.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(bookAppointment.pending, (state) => { state.bookingLoading = true })
      .addCase(bookAppointment.fulfilled, (state, action) => {
        state.bookingLoading = false
        state.list.unshift(action.payload)
      })
      .addCase(bookAppointment.rejected, (state) => { state.bookingLoading = false })
      .addCase(updateAppointmentStatus.fulfilled, (state, action) => {
        const idx = state.list.findIndex(a => a.id === action.payload.id)
        if (idx !== -1) state.list[idx] = action.payload
      })
  }
})

export default appointmentSlice.reducer
