import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

import Landing from './pages/Landing'
import SplashScreen from './pages/SplashScreen'
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
import HealthRecords from './pages/HealthRecords'
import MedicineReminder from './pages/MedicineReminder'
import NearbyPlaces from './pages/NearbyPlaces'
import Laboratory from './pages/Laboratory'
import AIHealthCopilot from './pages/AIHealthCopilot'
import MyRecords from './pages/MyRecords'
import EmergencySOS from './pages/EmergencySOS'
import SymptomDiary from './pages/SymptomDiary'
import VaccinationTracker from './pages/VaccinationTracker'
import HealthGoals from './pages/HealthGoals'
import FamilyHealth from './pages/FamilyHealth'
import PatientJourney from './pages/PatientJourney'
import SmartReport from './pages/SmartReport'
import Insurance from './pages/Insurance'
import AIChatbot from './components/common/AIChatbot'
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
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/login" element={user ? <Navigate to={getDashboardPath()} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={getDashboardPath()} /> : <Register />} />

        <Route path="/patient/dashboard" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
        <Route path="/patient/symptoms"  element={<ProtectedRoute roles={['patient']}><SymptomChecker /></ProtectedRoute>} />
        <Route path="/patient/doctors"   element={<ProtectedRoute roles={['patient']}><DoctorListing /></ProtectedRoute>} />
        <Route path="/patient/book/:doctorId" element={<ProtectedRoute roles={['patient']}><AppointmentBooking /></ProtectedRoute>} />
        <Route path="/patient/video/:appointmentId" element={<ProtectedRoute roles={['patient','doctor']}><VideoConsultation /></ProtectedRoute>} />
        <Route path="/patient/profile"   element={<ProtectedRoute roles={['patient']}><Profile /></ProtectedRoute>} />
        <Route path="/patient/records"   element={<ProtectedRoute roles={['patient']}><HealthRecords /></ProtectedRoute>} />
        <Route path="/patient/my-records"element={<ProtectedRoute roles={['patient']}><MyRecords /></ProtectedRoute>} />
        <Route path="/patient/medicines" element={<ProtectedRoute roles={['patient']}><MedicineReminder /></ProtectedRoute>} />
        <Route path="/patient/nearby"    element={<ProtectedRoute roles={['patient']}><NearbyPlaces /></ProtectedRoute>} />
        <Route path="/patient/laboratory"element={<ProtectedRoute roles={['patient']}><Laboratory /></ProtectedRoute>} />
        <Route path="/patient/copilot"    element={<ProtectedRoute roles={['patient']}><AIHealthCopilot /></ProtectedRoute>} />
        <Route path="/patient/emergency" element={<ProtectedRoute roles={['patient']}><EmergencySOS /></ProtectedRoute>} />
        <Route path="/patient/diary"     element={<ProtectedRoute roles={['patient']}><SymptomDiary /></ProtectedRoute>} />
        <Route path="/patient/vaccines"  element={<ProtectedRoute roles={['patient']}><VaccinationTracker /></ProtectedRoute>} />
        <Route path="/patient/goals"      element={<ProtectedRoute roles={['patient']}><HealthGoals /></ProtectedRoute>} />
        <Route path="/patient/family"    element={<ProtectedRoute roles={['patient']}><FamilyHealth /></ProtectedRoute>} />
        <Route path="/patient/journey"      element={<ProtectedRoute roles={['patient']}><PatientJourney /></ProtectedRoute>} />
        <Route path="/patient/smart-report" element={<ProtectedRoute roles={['patient']}><SmartReport /></ProtectedRoute>} />
        <Route path="/patient/insurance"   element={<ProtectedRoute roles={['patient']}><Insurance /></ProtectedRoute>} />

        <Route path="/doctor/dashboard"  element={<ProtectedRoute roles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/profile"    element={<ProtectedRoute roles={['doctor']}><Profile /></ProtectedRoute>} />
        <Route path="/doctor/video/:appointmentId" element={<ProtectedRoute roles={['doctor']}><VideoConsultation /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && <AIChatbot />}
    </BrowserRouter>
  )
}

export default App
