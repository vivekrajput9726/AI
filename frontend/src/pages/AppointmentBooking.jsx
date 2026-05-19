import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Video, MapPin, Star, IndianRupee, ArrowLeft, CheckCircle,
  Phone, CreditCard, Smartphone, Building2, Wallet,
  ShieldCheck, Lock, MessageCircle, CalendarPlus, Clock, Calendar,
  X, ChevronRight
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { fetchDoctorById } from '../redux/slices/doctorSlice'
import { bookAppointment } from '../redux/slices/appointmentSlice'
import { generateTimeSlots } from '../utils/helpers'
import api from '../services/api'
import toast from 'react-hot-toast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const TYPES = [
  { type: 'video',      label: 'Video Call', icon: <Video size={20} />, desc: 'Face-to-face online' },
  { type: 'voice',      label: 'Voice Call', icon: <Phone size={20} />, desc: 'Audio consultation'  },
  { type: 'in-person',  label: 'In-Person',  icon: <MapPin size={20} />, desc: 'Visit the clinic'  },
]

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'GPay, PhonePe, Paytm' },
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', label: 'Net Banking', icon: Building2, desc: 'All major banks' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, desc: 'Paytm, MobiKwik' },
]

const STEPS = [
  { n: 1, label: 'Type' },
  { n: 2, label: 'Date & Time' },
  { n: 3, label: 'Details' },
  { n: 4, label: 'Confirm' },
  { n: 5, label: 'Payment' },
]

// ── Calendar Picker ───────────────────────────────────────────────────────────
function CalendarPicker({ selectedDate, onSelect, minDate, maxDate, availableDays }) {
  const [viewDate, setViewDate] = useState(new Date())
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const isSelectable = (day) => {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    const str = `${year}-${m}-${d}`
    if (str < minDate || str > maxDate) return false
    const dayName = new Date(year, month, day).toLocaleDateString('en-US', { weekday: 'long' })
    return availableDays.includes(dayName)
  }

  const toDateStr = (day) => {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-4 select-none">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setViewDate(new Date(year, month - 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-gray-500 font-bold text-lg">‹</button>
        <p className="font-bold text-gray-800 text-sm">{monthName}</p>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-gray-500 font-bold text-lg">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map(d => <p key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</p>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const ds = toDateStr(day)
          const ok = isSelectable(day)
          const sel = ds === selectedDate
          return (
            <button type="button" key={day} disabled={!ok} onClick={() => onSelect(ds)}
              className={`h-9 w-full rounded-xl text-xs font-semibold transition-all
                ${sel ? 'bg-blue-600 text-white shadow-sm' :
                  ok ? 'hover:bg-blue-100 text-gray-800 cursor-pointer' :
                    'text-gray-300 cursor-not-allowed'}`}>
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Demo Payment Modal (mimics Razorpay UI) ───────────────────────────────────
function DemoPaymentModal({ amount, doctorName, onSuccess, onClose }) {
  const [tab,        setTab]        = useState('upi')   // upi | card | netbank
  const [upiId,      setUpiId]      = useState('')
  const [cardNum,    setCardNum]    = useState('')
  const [cardExp,    setCardExp]    = useState('')
  const [cardCvv,    setCardCvv]    = useState('')
  const [cardName,   setCardName]   = useState('')
  const [processing, setProcessing] = useState(false)
  const [result,     setResult]     = useState(null)    // null | 'success' | 'fail'

  const TABS = [
    { id:'upi',     icon:'📱', label:'UPI'         },
    { id:'card',    icon:'💳', label:'Card'        },
    { id:'netbank', icon:'🏦', label:'Net Banking' },
  ]

  const handlePay = async () => {
    // basic validation
    if (tab === 'upi' && !upiId.trim())     { toast.error('Enter UPI ID'); return }
    if (tab === 'card' && !cardNum.trim())  { toast.error('Enter card number'); return }
    setProcessing(true)

    // Simulate 2-second processing
    await new Promise(r => setTimeout(r, 2000))

    // Determine success/failure from test credentials
    const fail =
      upiId === 'failure@razorpay' ||
      cardNum.replace(/\s/g,'') === '4000000000000002'

    setProcessing(false)
    setResult(fail ? 'fail' : 'success')
    if (!fail) setTimeout(() => onSuccess(), 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header — Razorpay-style blue bar */}
        <div className="bg-[#2962FF] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-extrabold text-xs">S</div>
            <div>
              <p className="text-white font-bold text-sm">Synora Health</p>
              <p className="text-blue-200 text-xs">Test Payment · ₹{amount}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18}/></button>
        </div>

        {/* Amount */}
        <div className="px-5 pt-4 pb-2">
          <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">Amount to pay</span>
            <span className="text-xl font-extrabold text-blue-700">₹{amount}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-center">{doctorName} consultation</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 mt-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold rounded-xl border-2 transition-all ${
                tab === t.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="px-5 py-4 space-y-3">
          {tab === 'upi' && (
            <>
              <input value={upiId} onChange={e => setUpiId(e.target.value)}
                placeholder="Enter UPI ID (e.g. success@razorpay)"
                className="input-field text-sm" autoFocus/>
              <div className="flex gap-2 flex-wrap">
                {['GPay','PhonePe','Paytm','BHIM'].map(app => (
                  <button key={app} onClick={() => setUpiId('success@razorpay')}
                    className="flex-1 py-2 text-xs font-semibold bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all min-w-[60px]">
                    {app}
                  </button>
                ))}
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                🧪 Test: <code className="font-mono">success@razorpay</code> or <code className="font-mono">failure@razorpay</code>
              </p>
            </>
          )}

          {tab === 'card' && (
            <>
              <input value={cardNum}
                onChange={e => setCardNum(e.target.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim())}
                placeholder="Card number" className="input-field text-sm" maxLength={19}/>
              <div className="grid grid-cols-2 gap-2">
                <input value={cardExp}
                  onChange={e => {
                    let v = e.target.value.replace(/\D/g,'')
                    if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2,4)
                    setCardExp(v)
                  }}
                  placeholder="MM/YY" className="input-field text-sm" maxLength={5}/>
                <input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g,'').slice(0,3))}
                  placeholder="CVV" className="input-field text-sm" maxLength={3} type="password"/>
              </div>
              <input value={cardName} onChange={e => setCardName(e.target.value)}
                placeholder="Name on card" className="input-field text-sm"/>
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                🧪 Test: <code className="font-mono">4111 1111 1111 1111</code> — any name, any future date, any CVV
              </p>
            </>
          )}

          {tab === 'netbank' && (
            <div className="grid grid-cols-2 gap-2">
              {['SBI','HDFC','ICICI','Axis','Kotak','PNB'].map(bank => (
                <button key={bank} onClick={() => { setTab('upi'); setUpiId('success@razorpay') }}
                  className="py-3 text-sm font-semibold bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all">
                  {bank}
                </button>
              ))}
              <p className="col-span-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-center">
                🧪 Clicking any bank redirects to UPI test flow
              </p>
            </div>
          )}

          {/* Result */}
          {result === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <CheckCircle size={28} className="mx-auto text-green-500 mb-1"/>
              <p className="font-bold text-green-700">Payment Successful!</p>
              <p className="text-xs text-green-500">Booking your appointment...</p>
            </div>
          )}
          {result === 'fail' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <X size={28} className="mx-auto text-red-400 mb-1"/>
              <p className="font-bold text-red-700">Payment Failed</p>
              <p className="text-xs text-red-500 mt-0.5">Try <code>success@razorpay</code> or card <code>4111 1111 1111 1111</code></p>
              <button onClick={() => setResult(null)} className="mt-2 text-xs text-blue-600 underline">Try again</button>
            </div>
          )}

          {!result && (
            <button onClick={handlePay} disabled={processing}
              className="w-full py-3 bg-[#2962FF] hover:bg-[#1e4fd8] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
              {processing
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Processing...</>
                : <><ShieldCheck size={15}/> Pay ₹{amount} <ChevronRight size={14}/></>}
            </button>
          )}
        </div>

        <div className="px-5 pb-4 flex items-center justify-center gap-1 text-xs text-gray-400">
          <Lock size={10}/> Secured by <span className="font-bold text-[#2962FF]">Razorpay</span>
          <span className="text-amber-500 ml-1">(Test Mode)</span>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
function AppointmentBooking() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { selected: doctor } = useSelector(s => s.doctors)
  const { bookingLoading } = useSelector(s => s.appointments)

  const [step, setStep] = useState(1)
  const [appointmentType, setAppointmentType] = useState('video')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod]   = useState('upi')
  const [upiId,         setUpiId]           = useState('')
  const [paying,        setPaying]          = useState(false)
  const [booked,        setBooked]          = useState(false)
  const [rzpMode,       setRzpMode]         = useState(null) // null | 'live' | 'demo'
  const [showDemoModal, setShowDemoModal]   = useState(false)

  useEffect(() => { dispatch(fetchDoctorById(doctorId)) }, [doctorId, dispatch])

  // Pre-check Razorpay mode when step 5 opens so the banner shows correctly
  useEffect(() => {
    if (step === 5) {
      api.get('/payments/key')
        .then(r => setRzpMode(r.data?.key_id ? 'live' : 'demo'))
        .catch(() => setRzpMode('demo'))
    }
  }, [step])

  const toLocalDateStr = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const getMinDate = () => { const d = new Date(); d.setDate(d.getDate() + 1); return toLocalDateStr(d) }
  const getMaxDate = () => { const d = new Date(); d.setDate(d.getDate() + 30); return toLocalDateStr(d) }

  const availableDays = doctor?.availability?.length
    ? doctor.availability.filter(a => a.is_available !== false).map(a => a.day)
    : DAYS

  const isDateAvailable = (ds) => {
    const [y, m, day] = ds.split('-').map(Number)
    const d = new Date(y, m - 1, day) // local timezone — no UTC shift
    return availableDays.includes(d.toLocaleDateString('en-US', { weekday: 'long' }))
  }

  const typeLabel = (t) => ({ video: 'Video Call', voice: 'Voice Call', 'in-person': 'In-Person' }[t] || t)

  const bookAppointmentData = {
    doctor_id:        doctorId,
    appointment_date: selectedDate,
    appointment_time: selectedTime,
    appointment_type: appointmentType,
    symptoms,
    notes,
  }

  // ── Load Razorpay script lazily ───────────────────────────────────────────
  const loadRazorpay = () =>
    new Promise(resolve => {
      if (window.Razorpay) { resolve(true); return }
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      s.onload  = () => resolve(true)
      s.onerror = () => resolve(false)
      document.body.appendChild(s)
    })

  // Called by DemoPaymentModal on successful demo payment
  const handleDemoSuccess = async () => {
    setShowDemoModal(false)
    setPaying(true)
    try {
      const result = await dispatch(bookAppointment(bookAppointmentData))
      if (result.meta.requestStatus === 'fulfilled') {
        setBooked(true)
      } else {
        toast.error(result.payload?.detail || 'Booking failed. Please try again.')
      }
    } catch (err) {
      toast.error(err?.message || 'Booking failed.')
    } finally {
      setPaying(false)
    }
  }

  const handlePayAndBook = async () => {
    if (paying) return

    // If still checking config, wait and retry once
    if (rzpMode === null) {
      toast('Checking payment config...', { duration: 1000 })
      await new Promise(r => setTimeout(r, 1000))
    }

    // Demo mode — open visual modal
    if (rzpMode !== 'live') {
      setShowDemoModal(true)
      return
    }

    // ── Live Razorpay ─────────────────────────────────────────────────────
    setPaying(true)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) { toast.error('Could not load Razorpay. Check your internet.'); return }

      const orderRes = await api.post('/payments/create-order', {
        amount: doctor.consultation_fee, doctor_id: doctorId, appointment_type: appointmentType,
      })
      const { order_id, amount: amt, currency, key_id } = orderRes.data

      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: key_id, amount: amt, currency, order_id,
          name: 'Synora Health', description: `Consultation with ${doctor.name}`,
          theme: { color: '#2563eb' },
          handler: async (response) => {
            try {
              const vr = await api.post('/payments/verify', {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                appointment_data:    bookAppointmentData,
              })
              vr.data?.success ? (setBooked(true), resolve()) : (toast.error('Booking failed after payment.'), reject())
            } catch (e) { toast.error(e?.response?.data?.detail || 'Verification failed.'); reject(e) }
          },
          modal: { ondismiss: () => { toast.error('Payment cancelled.'); reject(new Error('dismissed')) } },
        })
        rzp.open()
      })
    } catch (err) {
      if (err?.message !== 'dismissed')
        toast.error(err?.response?.data?.detail || err?.message || 'Something went wrong. Try again.')
    } finally {
      setPaying(false)
    }
  }

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (booked) {
    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Dr. ' + doctor?.name)}&dates=${selectedDate?.replace(/-/g, '')}T090000/${selectedDate?.replace(/-/g, '')}T100000`
    const waMsg = encodeURIComponent(`🏥 Appointment booked!\n👨‍⚕️ ${doctor?.name}\n📅 ${selectedDate} at ${selectedTime}\n📋 ${typeLabel(appointmentType)}\n💰 ₹${doctor?.consultation_fee}`)

    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto text-center py-12 animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked!</h2>
          <p className="text-gray-500 mb-1">Your appointment with <strong>{doctor?.name}</strong> is confirmed.</p>
          <p className="text-sm text-gray-400 mb-6">{selectedDate} at {selectedTime} · {typeLabel(appointmentType)}</p>
          <div className="flex flex-col gap-2 mb-6">
            <a href={calUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-blue-50 border border-blue-200 text-blue-700 font-medium py-3 rounded-xl hover:bg-blue-100 transition-colors text-sm">
              <CalendarPlus size={15} /> Add to Google Calendar
            </a>
            <a href={`https://wa.me/?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-50 border border-green-200 text-green-700 font-medium py-3 rounded-xl hover:bg-green-100 transition-colors text-sm">
              <MessageCircle size={15} /> Share on WhatsApp
            </a>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/patient/dashboard')} className="btn-secondary">Dashboard</button>
            <button onClick={() => navigate('/patient/doctors')} className="btn-primary">Book Another</button>
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

  // Use doctor's specific slots for the selected day, or fall back to default generation
  const selectedDayName = selectedDate
    ? new Date(...selectedDate.split('-').map((v, i) => i === 1 ? Number(v) - 1 : Number(v))).toLocaleDateString('en-US', { weekday: 'long' })
    : null
  const doctorDaySlots = selectedDayName
    ? doctor?.availability?.find(a => a.day === selectedDayName)?.slots
    : null
  const timeSlots = doctorDaySlots?.length ? doctorDaySlots : generateTimeSlots()

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto animate-fade-in pb-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-5 text-sm">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Doctor Card */}
        <div className="card mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden">
              {doctor.profile_image
                ? <img src={doctor.profile_image} alt={doctor.name} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; e.target.parentElement.innerHTML = `<span class="text-white font-bold text-xl">${doctor.name?.charAt(0)}</span>` }} />
                : doctor.name?.charAt(0)
              }
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900">{doctor.name}</h2>
              <p className="text-blue-600 text-sm">{doctor.specialization}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Star size={11} className="text-yellow-400 fill-yellow-400" />{doctor.rating}</span>
                <span>{doctor.experience_years} yrs exp</span>
                <span className="flex items-center gap-1"><MapPin size={11} />{doctor.hospital}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-0.5 text-green-700 font-bold">
                <IndianRupee size={14} />{doctor.consultation_fee}
              </div>
              <span className="text-xs text-gray-400">per consult</span>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center mb-4">
          {STEPS.map(({ n, label }) => (
            <div key={n} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${step > n ? 'bg-blue-600 text-white' :
                    step === n ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                      'bg-gray-100 text-gray-400'}`}>
                  {step > n ? <CheckCircle size={14} /> : n}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${step === n ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
              </div>
              {n < 5 && <div className={`flex-1 h-0.5 mx-1 mb-4 ${step > n ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Selected Type Badge — visible on steps 2–5 */}
        {step > 1 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
              {appointmentType === 'video' ? <Video size={14} /> :
               appointmentType === 'voice' ? <Phone size={14} /> :
               <MapPin size={14} />}
            </div>
            <span className="text-sm font-semibold text-blue-700">{typeLabel(appointmentType)}</span>
            <span className="text-xs text-blue-400 ml-1">selected</span>
            <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs text-blue-500 hover:text-blue-700 underline font-medium">
              Change
            </button>
          </div>
        )}

        {/* ── Step 1: Consultation Type ── */}
        {step === 1 && (
          <div className="card space-y-5">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Select Consultation Type</h3>
              <p className="text-sm text-gray-400 mt-0.5">Choose how you want to consult the doctor</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map(({ type, label, icon, desc }) => {
                const isSelected = appointmentType === type
                return (
                  <button key={type} type="button" onClick={() => setAppointmentType(type)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-3 relative
                      ${isSelected
                        ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'}`}>
                    {/* Selected checkmark top-right */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <CheckCircle size={12} className="text-white" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
                      ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {icon}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Selected type summary */}
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
              <CheckCircle size={15} className="text-green-500" />
              <span className="text-sm text-gray-600">Selected: <strong className="text-blue-700">{typeLabel(appointmentType)}</strong></span>
            </div>

            <button type="button" onClick={() => setStep(2)} className="btn-primary w-full text-base py-3">
              Continue with {typeLabel(appointmentType)} →
            </button>
          </div>
        )}

        {/* ── Step 2: Date & Time ── */}
        {step === 2 && (
          <div className="card space-y-4">
            <h3 className="font-bold text-gray-900">Select Date & Time</h3>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Calendar size={14} className="text-blue-500" /> Pick a Date</p>
                <CalendarPicker
                  selectedDate={selectedDate}
                  onSelect={(d) => { setSelectedDate(d); setSelectedTime('') }}
                  minDate={getMinDate()}
                  maxDate={getMaxDate()}
                  availableDays={availableDays}
                />
                {selectedDate && !isDateAvailable(selectedDate) && (
                  <p className="text-xs text-red-500 mt-2">Doctor unavailable. Available: {availableDays.join(', ')}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-500" /> Available Slots
                  {selectedDate && timeSlots.length > 0 && (
                    <span className="ml-auto text-xs font-normal text-gray-400">{timeSlots.length} slots</span>
                  )}
                </p>
                {!selectedDate ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
                    <Clock size={24} className="mx-auto text-blue-300 mb-2" />
                    <p className="text-blue-400 text-sm font-medium">Pick a date first</p>
                    <p className="text-blue-300 text-xs mt-0.5">Available slots will appear here</p>
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
                    <p className="text-gray-400 text-sm">No slots available for this date</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto pr-1">
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map(slot => {
                        const [h, m] = slot.split(':').map(Number)
                        const ampm  = h >= 12 ? 'PM' : 'AM'
                        const h12   = h % 12 || 12
                        const label = `${h12}:${String(m).padStart(2,'0')}`
                        const isSelected = selectedTime === slot
                        return (
                          <button type="button" key={slot} onClick={() => setSelectedTime(slot)}
                            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all
                              ${isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700'}`}>
                            <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>{label}</span>
                            <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>{ampm}</span>
                            {isSelected && <span className="text-[10px] text-blue-200 mt-0.5">Selected ✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {selectedTime && (
                  <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                    <Clock size={13} className="text-blue-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-blue-700">Selected: {selectedTime}</span>
                    <button onClick={() => setSelectedTime('')} className="ml-auto text-blue-400 hover:text-blue-600 text-xs">✕ Clear</button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
              <button type="button" onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime || !isDateAvailable(selectedDate)}
                className="btn-primary flex-1 disabled:opacity-40">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Details ── */}
        {step === 3 && (
          <div className="card space-y-4">
            <h3 className="font-bold text-gray-900">Describe Your Concern</h3>
            <div>
              <label className="label">Symptoms <span className="text-gray-400 font-normal">(optional but recommended)</span></label>
              <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms so the doctor can prepare..."
                className="input-field h-28 resize-none" />
            </div>
            <div>
              <label className="label">Additional Notes <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Medical history, allergies, or other information..."
                className="input-field h-20 resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
              <button type="button" onClick={() => setStep(4)} className="btn-primary flex-1">Continue</button>
            </div>
          </div>
        )}

        {/* ── Step 4: Confirm ── */}
        {step === 4 && (
          <div className="card space-y-4">
            <h3 className="font-bold text-gray-900">Confirm Appointment</h3>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              {[
                { label: 'Doctor', value: doctor.name },
                { label: 'Specialization', value: doctor.specialization },
                { label: 'Type', value: typeLabel(appointmentType) },
                { label: 'Date', value: selectedDate },
                { label: 'Time', value: selectedTime },
                { label: 'Fee', value: `₹${doctor.consultation_fee}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
            {appointmentType === 'voice' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                📞 The doctor will call your registered phone number at the scheduled time.
              </div>
            )}
            {symptoms && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Your symptoms:</p>
                <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-xl">{symptoms}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(3)} className="btn-secondary flex-1">Back</button>
              <button type="button" onClick={() => setStep(5)} className="btn-primary flex-1">Proceed to Payment</button>
            </div>
          </div>
        )}

        {/* ── Step 5: Payment ── */}
        {step === 5 && (
          <div className="card space-y-4">

            {/* Header */}
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-green-600" />
              <h3 className="font-bold text-gray-900">Secure Payment</h3>
              <span className="ml-auto flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium">
                <ShieldCheck size={12} /> SSL Secured
              </span>
            </div>

            {/* Demo mode banner — same as SMS OTP demo box */}
            {rzpMode === 'demo' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧪</span>
                  <div>
                    <p className="text-sm font-bold text-amber-800">Test / Demo Mode</p>
                    <p className="text-xs text-amber-600">Razorpay not configured — use test credentials below</p>
                  </div>
                  <span className="ml-auto text-[10px] bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded-full">DEMO</span>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="bg-white rounded-xl p-3 border border-amber-100">
                    <p className="font-bold text-amber-700 mb-1.5">💳 Test Cards</p>
                    {[
                      { label:'Success (Visa)',   num:'4111 1111 1111 1111', exp:'Any future', cvv:'Any 3 digits' },
                      { label:'Success (Master)', num:'5200 0000 0000 1096', exp:'Any future', cvv:'Any 3 digits' },
                      { label:'Failure card',     num:'4000 0000 0000 0002', exp:'Any future', cvv:'Any 3 digits' },
                    ].map(c => (
                      <div key={c.num} className="flex items-center gap-2 mb-1.5 last:mb-0">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.label.includes('Fail') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                          {c.label.includes('Fail') ? 'FAIL' : 'PASS'}
                        </span>
                        <code className="text-amber-800 font-mono">{c.num}</code>
                        <span className="text-amber-500">· {c.exp} · {c.cvv}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-amber-100">
                    <p className="font-bold text-amber-700 mb-1.5">📱 Test UPI IDs</p>
                    {[
                      { id:'success@razorpay', label:'PASS' },
                      { id:'failure@razorpay', label:'FAIL' },
                    ].map(u => (
                      <div key={u.id} className="flex items-center gap-2 mb-1 last:mb-0">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${u.label === 'FAIL' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                          {u.label}
                        </span>
                        <code className="text-amber-800 font-mono">{u.id}</code>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-amber-500 text-center">
                  Add <code className="bg-amber-100 px-1 rounded">RAZORPAY_KEY_ID</code> + <code className="bg-amber-100 px-1 rounded">RAZORPAY_KEY_SECRET</code> to <code className="bg-amber-100 px-1 rounded">.env</code> for live payments
                </p>
              </div>
            )}

            {/* Live Razorpay banner */}
            {rzpMode === 'live' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2">
                <ShieldCheck size={15} className="text-blue-600 flex-shrink-0"/>
                <div>
                  <p className="text-xs font-bold text-blue-800">Powered by Razorpay</p>
                  <p className="text-xs text-blue-500">Secure checkout will open — supports UPI, Cards, Net Banking</p>
                </div>
              </div>
            )}

            {/* Amount card */}
            <div className="bg-blue-50 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-500 font-medium">Consultation Fee</p>
                <div className="flex items-center gap-1 text-blue-800 font-extrabold text-2xl">
                  <IndianRupee size={18} />{doctor.consultation_fee}
                </div>
                <p className="text-xs text-blue-400 mt-0.5">{doctor.name} · {typeLabel(appointmentType)}</p>
              </div>
              <div className="text-right text-xs text-blue-400">
                <p>{selectedDate}</p>
                <p>{selectedTime}</p>
              </div>
            </div>

            {/* Payment method selector (shown in demo mode for selection practice) */}
            <div className="space-y-2">
              {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => (
                <button type="button" key={id} onClick={() => setPaymentMethod(id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all
                    ${paymentMethod === id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${paymentMethod === id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon size={17} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-semibold ${paymentMethod === id ? 'text-blue-700' : 'text-gray-700'}`}>{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                    {rzpMode === 'demo' && paymentMethod === id && id === 'upi' && (
                      <p className="text-[10px] text-amber-600 mt-0.5">Demo: use <code>success@razorpay</code></p>
                    )}
                    {rzpMode === 'demo' && paymentMethod === id && id === 'card' && (
                      <p className="text-[10px] text-amber-600 mt-0.5">Demo: use <code>4111 1111 1111 1111</code></p>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                    ${paymentMethod === id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                    {paymentMethod === id && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>

            {paymentMethod === 'upi' && (
              <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)}
                placeholder={rzpMode === 'demo' ? 'Test: success@razorpay' : 'Enter UPI ID (e.g. name@upi)'}
                className="input-field" />
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(4)} disabled={paying} className="btn-secondary flex-1">Back</button>
              <button type="button" onClick={handlePayAndBook} disabled={paying || bookingLoading}
                className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm
                  ${rzpMode === 'demo'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                {paying || bookingLoading
                  ? <><LoadingSpinner size="sm" /> Processing...</>
                  : rzpMode === 'demo'
                    ? <>🧪 Pay ₹{doctor.consultation_fee} (Demo)</>
                    : <><ShieldCheck size={15} /> Pay ₹{doctor.consultation_fee}</>}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
              {rzpMode === 'demo'
                ? <><span className="text-amber-500">🧪</span> Demo mode — no real money charged</>
                : <><ShieldCheck size={11} className="text-green-500"/> Secured by Razorpay · 256-bit SSL</>}
            </p>
          </div>
        )}
      </div>

      {/* Demo Payment Modal */}
      {showDemoModal && (
        <DemoPaymentModal
          amount={doctor?.consultation_fee}
          doctorName={doctor?.name}
          onSuccess={handleDemoSuccess}
          onClose={() => setShowDemoModal(false)}
        />
      )}
    </DashboardLayout>
  )
}

export default AppointmentBooking
