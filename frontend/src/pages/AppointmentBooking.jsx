import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Calendar, Clock, Video, MapPin, Star, IndianRupee, ArrowLeft, CheckCircle } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { fetchDoctorById } from '../redux/slices/doctorSlice'
import { bookAppointment } from '../redux/slices/appointmentSlice'
import { generateTimeSlots } from '../utils/helpers'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function AppointmentBooking() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { selected: doctor } = useSelector(s => s.doctors)
  const { bookingLoading } = useSelector(s => s.appointments)

  const [step, setStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [appointmentType, setAppointmentType] = useState('video')
  const [symptoms, setSymptoms] = useState('')
  const [notes, setNotes] = useState('')
  const [booked, setBooked] = useState(false)

  useEffect(() => {
    dispatch(fetchDoctorById(doctorId))
  }, [doctorId, dispatch])

  const getMinDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  const getMaxDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  }

  const availableDays = doctor?.availability?.filter(a => a.is_available).map(a => a.day) || DAYS

  const isDateAvailable = (dateStr) => {
    const day = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' })
    return availableDays.includes(day)
  }

  const handleBook = async () => {
    const result = await dispatch(bookAppointment({
      doctor_id: doctorId,
      appointment_date: selectedDate,
      appointment_time: selectedTime,
      appointment_type: appointmentType,
      symptoms,
      notes,
    }))
    if (result.meta.requestStatus === 'fulfilled') {
      setBooked(true)
    }
  }

  if (booked) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto text-center py-16 animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked!</h2>
          <p className="text-gray-500 mb-2">Your appointment with <strong>{doctor?.name}</strong> has been scheduled.</p>
          <p className="text-sm text-gray-400 mb-8">
            {selectedDate} at {selectedTime} · {appointmentType === 'video' ? 'Video Call' : 'In-Person'}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/patient/dashboard')} className="btn-secondary">Dashboard</button>
            <button onClick={() => navigate('/patient/doctors')} className="btn-primary">Find More Doctors</button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!doctor) return (
    <DashboardLayout>
      <div className="py-16 flex justify-center"><LoadingSpinner text="Loading doctor..." /></div>
    </DashboardLayout>
  )

  const timeSlots = generateTimeSlots()

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Doctor Info Card */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            {doctor.profile_image ? (
              <img src={doctor.profile_image} alt={doctor.name} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                {doctor.name?.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-bold text-gray-900">{doctor.name}</h2>
              <p className="text-blue-600 text-sm">{doctor.specialization}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-yellow-400" />{doctor.rating}</span>
                <span>{doctor.experience_years} yrs exp</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-700 font-bold">
                <IndianRupee size={14} />{doctor.consultation_fee}
              </div>
              <span className="text-xs text-gray-400">per consult</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1 text-sm text-gray-500">
            <MapPin size={13} />{doctor.hospital}, {doctor.location}
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {step > s ? <CheckCircle size={16} /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 transition-colors ${step > s ? 'bg-blue-600' : 'bg-gray-100'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Date & Time */}
        {step === 1 && (
          <div className="card space-y-5 animate-slide-up">
            <h3 className="font-semibold text-gray-900">Select Date & Time</h3>

            <div>
              <label className="label">Consultation Type</label>
              <div className="grid grid-cols-2 gap-3">
                {['video', 'in-person'].map(type => (
                  <button
                    key={type}
                    onClick={() => setAppointmentType(type)}
                    className={`p-3 rounded-xl border-2 transition-colors text-sm font-medium flex items-center justify-center gap-2 ${appointmentType === type ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}
                  >
                    {type === 'video' ? <Video size={16} /> : <MapPin size={16} />}
                    {type === 'video' ? 'Video Call' : 'In-Person'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label flex items-center gap-2"><Calendar size={14} /> Appointment Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
                className="input-field"
              />
              {selectedDate && !isDateAvailable(selectedDate) && (
                <p className="text-xs text-red-500 mt-1">Doctor is not available on this day. Available: {availableDays.join(', ')}</p>
              )}
            </div>

            <div>
              <label className="label flex items-center gap-2"><Clock size={14} /> Select Time Slot</label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${selectedTime === slot ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!selectedDate || !selectedTime || !isDateAvailable(selectedDate)}
              className="btn-primary w-full disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Symptoms */}
        {step === 2 && (
          <div className="card space-y-5 animate-slide-up">
            <h3 className="font-semibold text-gray-900">Describe Your Concern</h3>
            <div>
              <label className="label">Symptoms (optional but recommended)</label>
              <textarea
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms so the doctor can prepare for the consultation..."
                className="input-field h-28 resize-none"
              />
            </div>
            <div>
              <label className="label">Additional Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any medical history, allergies, or other information..."
                className="input-field h-20 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
              <button onClick={() => setStep(3)} className="btn-primary flex-1">Continue</button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="card space-y-5 animate-slide-up">
            <h3 className="font-semibold text-gray-900">Confirm Appointment</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              {[
                { label: 'Doctor', value: doctor.name },
                { label: 'Specialization', value: doctor.specialization },
                { label: 'Date', value: selectedDate },
                { label: 'Time', value: selectedTime },
                { label: 'Type', value: appointmentType === 'video' ? 'Video Consultation' : 'In-Person' },
                { label: 'Fee', value: `₹${doctor.consultation_fee}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
            {symptoms && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Your symptoms:</p>
                <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-xl">{symptoms}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
              <button
                onClick={handleBook}
                disabled={bookingLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {bookingLoading ? <LoadingSpinner size="sm" /> : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AppointmentBooking
