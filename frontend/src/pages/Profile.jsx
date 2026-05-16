import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit3, Save, X, Camera, Activity, Heart, Droplets, AlertCircle } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { updateProfile } from '../redux/slices/authSlice'
import { getInitials } from '../utils/helpers'
import api from '../services/api'
import toast from 'react-hot-toast'

function Profile() {
  const { user, loading } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const [editing, setEditing] = useState(false)
  const [editingVitals, setEditingVitals] = useState(false)
  const [vitalsLoading, setVitalsLoading] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      setPhotoUploading(true)
      try {
        await dispatch(updateProfile({ profile_image: reader.result }))
        toast.success('Profile photo updated!')
      } catch {
        toast.error('Failed to upload photo')
      } finally {
        setPhotoUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
    address: user?.address || '',
    weight_kg: user?.weight_kg ?? '',
    height_cm: user?.height_cm ?? '',
    blood_pressure_systolic: user?.blood_pressure_systolic ?? '',
    blood_pressure_diastolic: user?.blood_pressure_diastolic ?? '',
    blood_sugar_mg_dl: user?.blood_sugar_mg_dl ?? '',
    heart_rate_bpm: user?.heart_rate_bpm ?? '',
  })

  // Sync form with Redux user whenever user updates (e.g. after save), but only when not actively editing
  useEffect(() => {
    if (!editing && !editingVitals) {
      setForm({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
        date_of_birth: user?.date_of_birth || '',
        gender: user?.gender || '',
        address: user?.address || '',
        weight_kg: user?.weight_kg ?? '',
        height_cm: user?.height_cm ?? '',
        blood_pressure_systolic: user?.blood_pressure_systolic ?? '',
        blood_pressure_diastolic: user?.blood_pressure_diastolic ?? '',
        blood_sugar_mg_dl: user?.blood_sugar_mg_dl ?? '',
        heart_rate_bpm: user?.heart_rate_bpm ?? '',
      })
    }
  }, [user])

  const handleSave = async () => {
    const numericFields = ['weight_kg', 'height_cm', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'blood_sugar_mg_dl', 'heart_rate_bpm']
    const payload = { ...form }
    numericFields.forEach(f => {
      if (payload[f] !== '' && payload[f] !== null && payload[f] !== undefined) {
        payload[f] = parseFloat(payload[f])
      } else {
        delete payload[f]
      }
    })
    const result = await dispatch(updateProfile(payload))
    if (result.meta.requestStatus === 'fulfilled') {
      setEditing(false)
    }
  }

  const handleCancel = () => {
    setForm({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      date_of_birth: user?.date_of_birth || '',
      gender: user?.gender || '',
      address: user?.address || '',
      weight_kg: user?.weight_kg ?? '',
      height_cm: user?.height_cm ?? '',
      blood_pressure_systolic: user?.blood_pressure_systolic ?? '',
      blood_pressure_diastolic: user?.blood_pressure_diastolic ?? '',
      blood_sugar_mg_dl: user?.blood_sugar_mg_dl ?? '',
      heart_rate_bpm: user?.heart_rate_bpm ?? '',
    })
    setEditing(false)
  }

  const handleSaveVitals = async () => {
    const numericFields = ['weight_kg', 'height_cm', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'blood_sugar_mg_dl', 'heart_rate_bpm']
    const payload = {}
    numericFields.forEach(f => {
      if (form[f] !== '' && form[f] !== null && form[f] !== undefined) {
        payload[f] = parseFloat(form[f])
      }
    })
    setVitalsLoading(true)
    const result = await dispatch(updateProfile(payload))
    setVitalsLoading(false)
    if (result.meta.requestStatus === 'fulfilled') {
      setEditingVitals(false)
      toast.success('Health vitals saved!')
    }
  }

  const handleCancelVitals = () => {
    setForm(prev => ({
      ...prev,
      weight_kg: user?.weight_kg ?? '',
      height_cm: user?.height_cm ?? '',
      blood_pressure_systolic: user?.blood_pressure_systolic ?? '',
      blood_pressure_diastolic: user?.blood_pressure_diastolic ?? '',
      blood_sugar_mg_dl: user?.blood_sugar_mg_dl ?? '',
      heart_rate_bpm: user?.heart_rate_bpm ?? '',
    }))
    setEditingVitals(false)
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2 text-sm">
              <Edit3 size={14} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancel} className="btn-secondary flex items-center gap-2 text-sm">
                <X size={14} /> Cancel
              </button>
              <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
                {loading ? <LoadingSpinner size="sm" /> : <><Save size={14} /> Save Changes</>}
              </button>
            </div>
          )}
        </div>

        {/* Avatar Section */}
        <div className="card text-center">
          {/* Photo upload area */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-4xl font-bold overflow-hidden border-4 border-blue-100 shadow-lg">
                {user?.profile_image ? (
                  <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials(user?.full_name)
                )}
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {photoUploading
                  ? <LoadingSpinner size="sm" />
                  : <>
                      <Camera size={20} className="text-white"/>
                      <p className="text-white text-[10px] font-bold mt-1">Change Photo</p>
                    </>
                }
              </div>
              {/* Camera badge */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow">
                <Camera size={14} className="text-white"/>
              </div>
            </div>

            {/* Upload buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                {photoUploading ? <LoadingSpinner size="sm"/> : <Camera size={14}/>}
                {photoUploading ? 'Uploading...' : 'Upload Photo'}
              </button>
              {/* Camera capture for mobile */}
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                <Camera size={14}/> Take Photo
                <input type="file" accept="image/*" capture="user" onChange={handlePhotoUpload} className="hidden"/>
              </label>
            </div>
            <p className="text-xs text-gray-400">JPG, PNG · Max 2MB · Click photo or use buttons above</p>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </div>

          <h2 className="font-bold text-xl text-gray-900">{user?.full_name}</h2>
          <p className="text-gray-500 text-sm capitalize">{user?.specialization || user?.role} Account</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user?.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {user?.is_active ? 'Active' : 'Inactive'}
            </span>
            {user?.is_verified && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                <Shield size={10} /> Verified
              </span>
            )}
          </div>
        </div>

        {/* Profile Fields */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-5">Personal Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-1.5"><User size={13} /> Full Name</label>
                {editing ? (
                  <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="input-field" />
                ) : (
                  <p className="text-gray-900 py-2.5 px-4 bg-gray-50 rounded-xl text-sm">{user?.full_name || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Mail size={13} /> Email</label>
                <p className="text-gray-500 py-2.5 px-4 bg-gray-50 rounded-xl text-sm">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-1.5"><Phone size={13} /> Phone</label>
                {editing ? (
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" className="input-field" />
                ) : (
                  <p className="text-gray-900 py-2.5 px-4 bg-gray-50 rounded-xl text-sm">{user?.phone || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="label">Gender</label>
                {editing ? (
                  <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="input-field">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900 py-2.5 px-4 bg-gray-50 rounded-xl text-sm capitalize">{user?.gender || 'Not set'}</p>
                )}
              </div>
            </div>

            <div>
              <label className="label flex items-center gap-1.5"><Calendar size={13} /> Date of Birth</label>
              {editing ? (
                <input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} className="input-field" />
              ) : (
                <p className="text-gray-900 py-2.5 px-4 bg-gray-50 rounded-xl text-sm">{user?.date_of_birth || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="label flex items-center gap-1.5"><MapPin size={13} /> Address</label>
              {editing ? (
                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Your full address" className="input-field h-20 resize-none" />
              ) : (
                <p className="text-gray-900 py-2.5 px-4 bg-gray-50 rounded-xl text-sm">{user?.address || 'Not set'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Health Vitals */}
        <div id="vitals" className="card">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Activity size={17} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">Health Vitals</h3>
            </div>
            {!editingVitals ? (
              <button onClick={() => setEditingVitals(true)} className="btn-secondary flex items-center gap-2 text-sm">
                <Edit3 size={14} /> {user?.weight_kg ? 'Edit Vitals' : 'Add Vitals'}
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleCancelVitals} className="btn-secondary flex items-center gap-2 text-sm">
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleSaveVitals} disabled={vitalsLoading} className="btn-primary flex items-center gap-2 text-sm">
                  {vitalsLoading ? <LoadingSpinner size="sm" /> : <><Save size={14} /> Save Vitals</>}
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-5">Used to calculate your real-time health score and risk status on the dashboard.</p>

          {/* Completeness banner */}
          {!user?.weight_kg && !user?.height_cm && !editingVitals && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <AlertCircle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">Weight and height are required to activate your health score. Click <strong>Add Vitals</strong> to get started.</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Row 1: Weight + Height */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-1.5"><Activity size={12} /> Weight (kg)</label>
                {editingVitals ? (
                  <input type="number" min="20" max="300" step="0.1" value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })} placeholder="e.g. 70" className="input-field" autoFocus />
                ) : (
                  <p className="text-gray-900 py-2.5 px-4 bg-gray-50 rounded-xl text-sm">{user?.weight_kg ? `${user.weight_kg} kg` : 'Not set'}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">Normal BMI: 18.5 – 24.9</p>
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Activity size={12} /> Height (cm)</label>
                {editingVitals ? (
                  <input type="number" min="50" max="250" step="0.1" value={form.height_cm} onChange={e => setForm({ ...form, height_cm: e.target.value })} placeholder="e.g. 170" className="input-field" />
                ) : (
                  <p className="text-gray-900 py-2.5 px-4 bg-gray-50 rounded-xl text-sm">{user?.height_cm ? `${user.height_cm} cm` : 'Not set'}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">Used to compute BMI</p>
              </div>
            </div>

            {/* Row 2: Systolic + Diastolic BP */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-1.5"><Heart size={12} /> Systolic BP (mmHg)</label>
                {editingVitals ? (
                  <input type="number" min="60" max="200" value={form.blood_pressure_systolic} onChange={e => setForm({ ...form, blood_pressure_systolic: e.target.value })} placeholder="e.g. 120" className="input-field" />
                ) : (
                  <p className="text-gray-900 py-2.5 px-4 bg-gray-50 rounded-xl text-sm">{user?.blood_pressure_systolic ? `${user.blood_pressure_systolic} mmHg` : 'Not set'}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">Normal: 90 – 120 mmHg</p>
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Heart size={12} /> Diastolic BP (mmHg)</label>
                {editingVitals ? (
                  <input type="number" min="40" max="130" value={form.blood_pressure_diastolic} onChange={e => setForm({ ...form, blood_pressure_diastolic: e.target.value })} placeholder="e.g. 80" className="input-field" />
                ) : (
                  <p className="text-gray-900 py-2.5 px-4 bg-gray-50 rounded-xl text-sm">{user?.blood_pressure_diastolic ? `${user.blood_pressure_diastolic} mmHg` : 'Not set'}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">Normal: 60 – 80 mmHg</p>
              </div>
            </div>

            {/* Row 3: Blood Sugar + Heart Rate */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-1.5"><Droplets size={12} /> Blood Sugar (mg/dL)</label>
                {editingVitals ? (
                  <input type="number" min="40" max="400" step="0.1" value={form.blood_sugar_mg_dl} onChange={e => setForm({ ...form, blood_sugar_mg_dl: e.target.value })} placeholder="e.g. 95" className="input-field" />
                ) : (
                  <p className="text-gray-900 py-2.5 px-4 bg-gray-50 rounded-xl text-sm">{user?.blood_sugar_mg_dl ? `${user.blood_sugar_mg_dl} mg/dL` : 'Not set'}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">Normal fasting: 70 – 100 mg/dL</p>
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Heart size={12} /> Heart Rate (bpm)</label>
                {editingVitals ? (
                  <input type="number" min="30" max="220" value={form.heart_rate_bpm} onChange={e => setForm({ ...form, heart_rate_bpm: e.target.value })} placeholder="e.g. 72" className="input-field" />
                ) : (
                  <p className="text-gray-900 py-2.5 px-4 bg-gray-50 rounded-xl text-sm">{user?.heart_rate_bpm ? `${user.heart_rate_bpm} bpm` : 'Not set'}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">Normal: 60 – 100 bpm</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Account Type', value: user?.role, capitalize: true },
              { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
              { label: 'Account Status', value: user?.is_active ? 'Active' : 'Inactive' },
            ].map(({ label, value, capitalize }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-500">{label}</span>
                <span className={`font-medium text-gray-900 ${capitalize ? 'capitalize' : ''}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Profile
