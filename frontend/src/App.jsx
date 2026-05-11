import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import PatientDashboard from './pages/PatientDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import SymptomChecker from './pages/SymptomChecker'
import DoctorListing from './pages/DoctorListing'
import AppointmentBooking from './pages/AppointmentBooking'
import VideoConsultation from './pages/VideoConsultation'
import Profile from './pages/Profile'
import ProtectedRoute from './routes/ProtectedRoute'

function App() {
  const { user } = useSelector((state) => state.auth)

  const getDashboardPath = () => {
    if (!user) return '/login'
    if (user.role === 'admin') return '/admin'
    if (user.role === 'doctor') return '/doctor/dashboard'
    return '/patient/dashboard'
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={user ? <Navigate to={getDashboardPath()} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={getDashboardPath()} /> : <Register />} />

        <Route path="/patient/dashboard" element={
          <ProtectedRoute roles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        } />
        <Route path="/patient/symptoms" element={
          <ProtectedRoute roles={['patient']}>
            <SymptomChecker />
          </ProtectedRoute>
        } />
        <Route path="/patient/doctors" element={
          <ProtectedRoute roles={['patient']}>
            <DoctorListing />
          </ProtectedRoute>
        } />
        <Route path="/patient/book/:doctorId" element={
          <ProtectedRoute roles={['patient']}>
            <AppointmentBooking />
          </ProtectedRoute>
        } />
        <Route path="/patient/video/:appointmentId" element={
          <ProtectedRoute roles={['patient', 'doctor']}>
            <VideoConsultation />
          </ProtectedRoute>
        } />
        <Route path="/patient/profile" element={
          <ProtectedRoute roles={['patient']}>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/doctor/dashboard" element={
          <ProtectedRoute roles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/doctor/profile" element={
          <ProtectedRoute roles={['doctor']}>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/doctor/video/:appointmentId" element={
          <ProtectedRoute roles={['doctor']}>
            <VideoConsultation />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
