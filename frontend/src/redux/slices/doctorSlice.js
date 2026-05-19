import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchDoctors = createAsyncThunk('doctors/fetchAll', async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const res = await api.get(`/doctors/?${query}`)
  return res.data
})

export const fetchDoctorById = createAsyncThunk('doctors/fetchOne', async (id) => {
  const res = await api.get(`/doctors/${id}`)
  return res.data
})

export const fetchSpecializations = createAsyncThunk('doctors/fetchSpecializations', async () => {
  const res = await api.get('/doctors/specializations/')
  return res.data.specializations
})

const doctorSlice = createSlice({
  name: 'doctors',
  initialState: {
    list: [],
    selected: null,
    specializations: [],
    total: 0,
    page: 1,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelected(state) { state.selected = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctors.pending, (state) => { state.loading = true })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.doctors
        state.total = action.payload.total
        state.page = action.payload.page
      })
      .addCase(fetchDoctors.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(fetchDoctorById.fulfilled, (state, action) => {
        state.selected = action.payload
      })
      .addCase(fetchSpecializations.fulfilled, (state, action) => {
        state.specializations = action.payload
      })
  }
})

export const { clearSelected } = doctorSlice.actions
export default doctorSlice.reducer
