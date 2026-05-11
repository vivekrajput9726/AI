import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

function ProtectedRoute({ children, roles }) {
  const { user } = useSelector((state) => state.auth)

  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />
    return <Navigate to="/patient/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
