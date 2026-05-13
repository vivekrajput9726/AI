import { Star, MapPin, Clock, IndianRupee, Award, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getInitials } from '../../utils/helpers'

const DOCTOR_IMAGES = [
  'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&h=100&fit=crop&crop=face',
]

function getAvailability(doctor) {
  const days = doctor.availability?.filter(a => a.is_available) || []
  if (days.length === 0) return { label: 'Schedule TBD', color: 'bg-gray-100 text-gray-500' }
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'long' })
  if (days.find(d => d.day === today)) return { label: 'Available Today', color: 'bg-green-100 text-green-700' }
  if (days.find(d => d.day === tomorrow)) return { label: 'Available Tomorrow', color: 'bg-blue-100 text-blue-700' }
  return { label: `${days.length} days/week`, color: 'bg-purple-100 text-purple-700' }
}

function DoctorCard({ doctor, showBookButton = true }) {
  const navigate = useNavigate()
  const availability = getAvailability(doctor)
  const fallbackImg = DOCTOR_IMAGES[Math.abs(doctor.name?.charCodeAt(0) || 0) % DOCTOR_IMAGES.length]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 flex flex-col">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          {doctor.profile_image ? (
            <img src={doctor.profile_image} alt={doctor.name} className="w-14 h-14 rounded-2xl object-cover" onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
          ) : null}
          <div className={`w-14 h-14 rounded-2xl overflow-hidden ${doctor.profile_image ? 'hidden' : 'block'}`}>
            <img src={fallbackImg} alt={doctor.name} className="w-full h-full object-cover" onError={e => { e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">${getInitials(doctor.name)}</div>` }} />
          </div>
          {doctor.is_verified && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
              <CheckCircle size={10} className="text-white fill-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm truncate">{doctor.name}</h3>
          <p className="text-blue-600 text-xs font-medium">{doctor.specialization}</p>
          {doctor.subspecialty && <p className="text-gray-400 text-xs">{doctor.subspecialty}</p>}
          <p className="text-gray-400 text-xs mt-0.5">{doctor.experience_years}+ Years Experience</p>
        </div>
      </div>

      {/* Rating + Availability */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1">
          <Star size={13} className="text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-bold text-gray-900">{doctor.rating}</span>
          <span className="text-xs text-gray-400">({doctor.total_reviews})</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${availability.color}`}>{availability.label}</span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
        <MapPin size={11} className="flex-shrink-0" />
        <span className="truncate">{doctor.hospital}, {doctor.location}</span>
      </div>

      {/* Fee + Book */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Consultation Fee</p>
          <div className="flex items-center gap-0.5">
            <IndianRupee size={13} className="text-gray-900" />
            <span className="font-extrabold text-gray-900">{doctor.consultation_fee}</span>
          </div>
        </div>
        {showBookButton && (
          <button onClick={() => navigate(`/patient/book/${doctor.id}`)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors shadow-sm">
            Book Now
          </button>
        )}
      </div>
    </div>
  )
}

export default DoctorCard
