import { Star, MapPin, Clock, IndianRupee, Award } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getInitials } from '../../utils/helpers'

function DoctorCard({ doctor, showBookButton = true }) {
  const navigate = useNavigate()

  return (
    <div className="card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          {doctor.profile_image ? (
            <img
              src={doctor.profile_image}
              alt={doctor.name}
              className="w-16 h-16 rounded-2xl object-cover"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
            />
          ) : null}
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg ${doctor.profile_image ? 'hidden' : 'flex'}`}
          >
            {getInitials(doctor.name)}
          </div>
          {doctor.is_verified && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base truncate">{doctor.name}</h3>
          <p className="text-blue-600 text-sm font-medium">{doctor.specialization}</p>
          {doctor.subspecialty && (
            <p className="text-gray-400 text-xs">{doctor.subspecialty}</p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="font-medium">{doctor.rating}</span>
            <span className="text-gray-400">({doctor.total_reviews})</span>
          </div>
          <div className="flex items-center gap-1">
            <Award size={14} className="text-blue-400" />
            <span>{doctor.experience_years} yrs exp</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin size={13} className="flex-shrink-0" />
          <span className="truncate">{doctor.hospital}, {doctor.location}</span>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock size={13} />
          <span className="text-xs">{doctor.availability?.length > 0 ? `${doctor.availability.length} days/week` : 'Schedule TBD'}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <IndianRupee size={14} className="text-green-600" />
          <span className="font-semibold text-gray-900">{doctor.consultation_fee}</span>
          <span className="text-xs text-gray-400">/consult</span>
        </div>
        {showBookButton && (
          <button
            onClick={() => navigate(`/patient/book/${doctor.id}`)}
            className="btn-primary text-sm py-2 px-4"
          >
            Book Now
          </button>
        )}
      </div>
    </div>
  )
}

export default DoctorCard
