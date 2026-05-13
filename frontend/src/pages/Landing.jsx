import { useNavigate, Link } from 'react-router-dom'
import {
  Heart, Brain, Calendar, Video, Shield, ArrowRight, CheckCircle,
  Activity, Star, Stethoscope, MessageCircle, ChevronRight, Bot,
  FileText, Pill, Phone, Plus, Users
} from 'lucide-react'

const specializations = [
  { name: 'Cardiologist', icon: '❤️' },
  { name: 'Neurologist', icon: '🧠' },
  { name: 'Dermatologist', icon: '🧴' },
  { name: 'Orthopedist', icon: '🦴' },
  { name: 'Gynecologist', icon: '👩‍⚕️' },
  { name: 'Psychiatrist', icon: '🧘' },
  { name: 'Pediatrician', icon: '👶' },
  { name: 'ENT Specialist', icon: '👂' },
  { name: 'Ophthalmologist', icon: '👁️' },
  { name: 'Endocrinologist', icon: '💉' },
  { name: 'Pulmonologist', icon: '🫁' },
  { name: 'Gastroenterologist', icon: '🩺' },
]

const features = [
  { icon: Brain, title: 'AI Symptom Checker', desc: 'Get instant AI-powered health insights and diagnosis', color: 'bg-blue-50 text-blue-600' },
  { icon: Video, title: 'Video Consultation', desc: 'Consult top doctors from the comfort of your home', color: 'bg-purple-50 text-purple-600' },
  { icon: Calendar, title: 'Easy Booking', desc: 'Book appointments in seconds, anytime anywhere', color: 'bg-green-50 text-green-600' },
  { icon: FileText, title: 'Report Analyzer', desc: 'Upload lab reports and get AI explanations', color: 'bg-teal-50 text-teal-600' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your health data is fully encrypted and protected', color: 'bg-red-50 text-red-600' },
  { icon: Pill, title: 'Medicine Reminder', desc: 'Never miss a dose with smart reminders', color: 'bg-orange-50 text-orange-600' },
]

const testimonials = [
  { name: 'Priya Sharma', role: 'Patient', text: 'The AI symptom checker helped me understand my condition before my appointment. Amazing platform!', rating: 5 },
  { name: 'Rahul Mehta', role: 'Patient', text: 'Booked an appointment in under 2 minutes. The video call quality was excellent!', rating: 5 },
  { name: 'Anita Patel', role: 'Patient', text: 'Very easy to use. The doctors are professional and the platform is smooth.', rating: 5 },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-400 rounded-xl flex items-center justify-center shadow">
              <Plus size={20} className="text-white" strokeWidth={3} />
            </div>
            <div className="leading-tight">
              <p className="font-extrabold text-gray-900 text-lg">Synora Health</p>
              <p className="text-xs text-gray-400">Smart Healthcare. Powered by AI.</p>
            </div>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium">
            <a href="#" className="text-blue-600 font-semibold">Home</a>
            <a href="#specializations" className="text-gray-600 hover:text-blue-600 transition-colors">Doctors</a>
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">AI Tools</a>
            <a href="#specializations" className="text-gray-600 hover:text-blue-600 transition-colors">Specializations</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-blue-600 border border-blue-300 hover:bg-blue-50 px-5 py-2 rounded-xl transition-colors">Login</Link>
            <Link to="/register" className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl transition-colors shadow">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pt-16 min-h-screen flex items-center" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 50%, #f0fafa 100%)' }}>

        {/* Background decorative blobs */}
        <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #60a5fa 0%, #2dd4bf 100%)', filter: 'blur(60px)' }} />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full opacity-10" style={{ background: '#3b82f6', filter: 'blur(60px)' }} />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full py-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">

            {/* ── Left Text ── */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full">
                <span className="text-blue-500">✦</span> AI-Powered Healthcare Platform
              </div>

              {/* Heading */}
              <div>
                <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                  Smarter Healthcare,
                </h1>
                <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight" style={{ background: 'linear-gradient(90deg, #2563eb, #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Powered by AI
                </h1>
              </div>

              {/* Subtitle */}
              <p className="text-gray-500 text-lg leading-relaxed max-w-md">
                Consult top doctors, analyze symptoms with AI, and manage your health records – anytime, anywhere.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3">
                <button onClick={() => navigate('/register')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-7 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 text-base">
                  Get Started <ArrowRight size={18} />
                </button>
                <button onClick={() => navigate('/register')} className="flex items-center gap-2 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300 text-gray-700 font-semibold py-3.5 px-7 rounded-xl transition-all text-base">
                  <Bot size={16} className="text-blue-500" /> Try AI Symptom Checker
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-5 text-sm text-gray-500 pt-1">
                <span className="flex items-center gap-1.5"><Brain size={15} className="text-blue-500" /> AI Symptom Analysis</span>
                <span className="flex items-center gap-1.5"><CheckCircle size={15} className="text-green-500" /> Verified Doctors</span>
                <span className="flex items-center gap-1.5"><Shield size={15} className="text-blue-400" /> Secure & Private</span>
              </div>
            </div>

            {/* ── Right Visual ── */}
            <div className="relative flex items-center justify-center" style={{ height: 560 }}>

              {/* Large circular blue gradient background */}
              <div className="absolute rounded-full" style={{
                width: 440, height: 440,
                background: 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 40%, #5eead4 100%)',
                top: '50%', left: '55%',
                transform: 'translate(-50%, -50%)',
                zIndex: 0
              }} />

              {/* Female Doctor Image */}
              <div className="absolute overflow-hidden" style={{
                bottom: 0, left: '18%',
                width: 210, height: 470,
                zIndex: 2
              }}>
                <img
                  src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&h=500&fit=crop&crop=top"
                  alt="Female Doctor"
                  className="w-full h-full object-cover object-top"
                  onError={e => {
                    e.target.src = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=500&fit=crop&crop=top'
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-20" style={{ background: 'linear-gradient(to top, #f0f7ff, transparent)' }} />
              </div>

              {/* Male Doctor Image */}
              <div className="absolute overflow-hidden" style={{
                bottom: 0, left: '48%',
                width: 210, height: 470,
                zIndex: 2
              }}>
                <img
                  src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=500&fit=crop&crop=top"
                  alt="Male Doctor"
                  className="w-full h-full object-cover object-top"
                  onError={e => {
                    e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=500&fit=crop&crop=top'
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-20" style={{ background: 'linear-gradient(to top, #f0f7ff, transparent)' }} />
              </div>

              {/* ── Floating Card: AI Health Analysis ── */}
              <div className="absolute bg-white rounded-2xl shadow-xl p-4 w-52 border border-gray-100"
                style={{ top: 20, right: -10, zIndex: 10 }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bot size={14} className="text-blue-600" />
                  </div>
                  <p className="text-xs font-bold text-gray-800">AI Health Analysis</p>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-gray-400">Risk Level</p>
                </div>
                <p className="text-sm font-bold text-green-600 mb-2">Low Risk</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Precautions</p>
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={12} className="text-green-600" />
                  </div>
                </div>
              </div>

              {/* ── Floating Card: Upcoming Appointment ── */}
              <div className="absolute bg-white rounded-2xl shadow-xl p-4 w-56 border border-gray-100"
                style={{ bottom: 60, right: -20, zIndex: 10 }}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-blue-600" />
                  <p className="text-xs font-bold text-gray-800">Upcoming Appointment</p>
                </div>
                <p className="text-xs text-gray-400 mb-2">Today, 5:00 PM</p>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Dr. Ananya Sharma</p>
                    <p className="text-xs text-gray-400">Cardiologist</p>
                  </div>
                </div>
                <button className="w-full bg-blue-600 text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5">
                  <Video size={11} /> Join Video Call
                </button>
              </div>

              {/* ── Floating Card: Heart Rate ── */}
              <div className="absolute bg-white rounded-2xl shadow-xl p-4 w-40 border border-gray-100"
                style={{ top: '38%', left: -10, transform: 'translateY(-50%)', zIndex: 10 }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Heart size={14} className="text-red-500 fill-red-500" />
                  <p className="text-xs font-bold text-gray-800">Heart Rate</p>
                </div>
                <p className="text-3xl font-extrabold text-gray-900">72</p>
                <p className="text-xs text-gray-400 -mt-1 mb-2">bpm</p>
                {/* ECG Line */}
                <svg viewBox="0 0 80 24" className="w-full mb-2" fill="none">
                  <polyline
                    points="0,12 12,12 17,4 22,20 27,12 38,12 44,4 50,20 55,12 80,12"
                    stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">Normal</span>
              </div>

            </div>
          </div>

          {/* ── Stats Row ── */}
          <div className="mt-14 flex flex-wrap gap-10">
            {[
              { icon: '👥', value: '20K+', label: 'Happy Patients' },
              { icon: '📅', value: '10K+', label: 'Consultations' },
              { icon: '⭐', value: '4.8/5', label: 'Average Rating' },
            ].map(({ icon, value, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-3xl">{icon}</span>
                <div>
                  <p className="text-2xl font-extrabold text-gray-900">{value}</p>
                  <p className="text-sm text-gray-400">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trusted By ─── */}
      <section className="py-8 border-y border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-sm text-gray-400 mb-5">Trusted by thousands of patients</p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {['Google', 'Practo', 'Apollo', 'Fortis', 'Cloudnine'].map(p => (
              <span key={p} className="text-gray-300 font-bold text-xl tracking-wide">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Quick Actions ─── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">What do you need?</h2>
          <p className="text-gray-400 text-sm text-center mb-8">Everything you need for better healthcare in one place</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🩺', title: 'Consult a Doctor', desc: 'Online consultation', bg: 'bg-blue-50', border: 'border-blue-100 hover:border-blue-300' },
              { icon: '🧠', title: 'AI Symptom Check', desc: 'Get health insights', bg: 'bg-purple-50', border: 'border-purple-100 hover:border-purple-300' },
              { icon: '💊', title: 'Medicine Reminder', desc: 'Never miss a dose', bg: 'bg-green-50', border: 'border-green-100 hover:border-green-300' },
              { icon: '📋', title: 'Health Records', desc: 'View your reports', bg: 'bg-orange-50', border: 'border-orange-100 hover:border-orange-300' },
            ].map(({ icon, title, desc, bg, border }) => (
              <button key={title} onClick={() => navigate('/register')} className={`${bg} border-2 ${border} rounded-2xl p-5 text-left transition-all group hover:shadow-md`}>
                <div className="text-3xl mb-3">{icon}</div>
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-gray-400 text-xs mt-1">{desc}</p>
                <ChevronRight size={14} className="text-gray-300 mt-2 group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Specializations ─── */}
      <section id="specializations" className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Browse by Specialization</h2>
            <p className="text-gray-400 text-sm mt-2">Find the right specialist for every health concern</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {specializations.map(({ name, icon }) => (
              <button key={name} onClick={() => navigate('/register')} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm transition-all group">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-medium text-gray-600 text-center leading-tight group-hover:text-blue-700">{name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-14 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Everything in One App</h2>
            <p className="text-gray-400 text-sm mt-2">A complete AI-powered healthcare platform for all your needs</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100">
                <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">How It Works</h2>
          <p className="text-gray-400 text-sm mb-10">Get a consultation in 3 simple steps</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', icon: '📝', title: 'Describe Symptoms', desc: 'Enter your symptoms. Our AI analyzes them and suggests possible conditions instantly.' },
              { step: '2', icon: '🤖', title: 'Get AI Analysis', desc: 'Receive conditions, severity assessment, specialist recommendations and precautions.' },
              { step: '3', icon: '👨‍⚕️', title: 'Consult Doctor', desc: 'Book an appointment and connect via video, voice, or in-person visit.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-6 text-left border border-blue-100">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mb-4">{step}</div>
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">What Patients Say</h2>
            <p className="text-gray-400 text-sm mt-2">Trusted by thousands of patients across India</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map(({ name, role, text, rating }) => (
              <div key={name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: rating }).map((_, i) => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-sm">{name.charAt(0)}</div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{name}</p>
                    <p className="text-gray-400 text-xs">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0891b2 100%)' }}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Plus size={28} className="text-white" strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Start Your Health Journey Today</h2>
          <p className="text-blue-200 mb-8">Join thousands of patients getting smarter healthcare with AI</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/register')} className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-3.5 px-10 rounded-xl shadow-lg inline-flex items-center gap-2">
              Get Started Free <ArrowRight size={18} />
            </button>
            <Link to="/login" className="border-2 border-white/30 hover:border-white text-white font-semibold py-3.5 px-8 rounded-xl inline-flex items-center justify-center gap-2 transition-colors">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer id="contact" className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-400 rounded-xl flex items-center justify-center">
                  <Plus size={16} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-white font-bold text-lg">Synora Health</span>
              </div>
              <p className="text-sm leading-relaxed">Smart Healthcare. Powered by AI. Consult top doctors and manage your health from anywhere.</p>
            </div>
            <div>
              <p className="text-white font-semibold mb-3">Platform</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">AI Tools</a></li>
                <li><a href="#specializations" className="hover:text-white transition-colors">Find Doctors</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-3">Account</p>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-3">Contact</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><MessageCircle size={14} /> support@synorahealth.com</li>
                <li className="flex items-center gap-2"><Phone size={14} /> +91 98765 43210</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
            <p>© 2026 Synora Health. All rights reserved.</p>
            <p className="text-xs text-gray-600">Not a substitute for professional medical advice.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
