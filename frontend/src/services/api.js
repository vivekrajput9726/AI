import axios from 'axios'
import { logout, setTokens } from '../redux/slices/authSlice'

let store
export const injectStore = (_store) => { store = _store }

const BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api'
    : `http://${window.location.hostname}:8000/api`)

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const state = store.getState()
  const token = state.auth?.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }
      originalRequest._retry = true
      isRefreshing = true
      const state = store.getState()
      const refreshToken = state.auth?.refreshToken
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
          const { access_token, refresh_token } = res.data
          store.dispatch(setTokens({ access_token, refresh_token }))
          processQueue(null, access_token)
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          store.dispatch(logout())
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      } else {
        store.dispatch(logout())
      }
    }
    return Promise.reject(error)
  }
)

export default api
