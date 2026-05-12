import { useNavigate, Link } from 'react-router-dom'
import { Heart, Brain, Calendar, Video, Shield, ArrowRight, CheckCircle, Activity, Star, Phone, Clock, Users, Stethoscope, MessageCircle, ChevronRight } from 'lucide-react'

const specializations = [
  { name: 'Cardiologist', icon: '❤️' },
  { name: 'Neurologist', icon: '🧠' },
  { name: 'Dermatologist', icon: '🧴' },
  { name: 'Orthopedist', icon: '🦴' },
  { name: 'Gynecologist', icon: '👩‍⚕️' },
  { name: 'Psychiatrist', icon: '🧘' },
  { name: 'Gastroenterologist', icon: '🫁' },
  { name: 'Pulmonologist', icon: '🫀' },
  { name: 'Pediatrician', icon: '👶' },
  { name: 'ENT Specialist', icon: '👂' },
  { name: 'Ophthalmologist', icon: '👁️' },
  { name: 'Endocrinologist', icon: '💉' },
]

const features = [
  { icon: Brain, title: 'AI Symptom Checker', desc: 'Get instant AI-powered health insights', color: 'bg-blue-50 text-blue-600' },
  { icon: Video, title: 'Video Consultation', desc: 'Consult doctors from home', color: 'bg-purple-50 text-purple-600' },
  { icon: Calendar, title: 'Easy Booking', desc: 'Book appointments in seconds', color: 'bg-green-50 text-green-600' },
  { icon: MessageCircle, title: 'Chat with Doctor', desc: 'Real-time messaging', color: 'bg-orange-50 text-orange-600' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your data is protected', color: 'bg-red-50 text-red-600' },
  { icon: Activity, title: 'Health Tracking', desc: 'Track your health history', color: 'bg-teal-50 text-teal-600' },
]

const testimonials = [
  { name: 'Priya Sharma', role: 'Patient', text: 'The AI symptom checker helped me understand my condition before my appointment. Amazing platform!', rating: 5 },
  { name: 'Rahul Mehta', role: 'Patient', text: 'Booked an appointment in under 2 minutes. The video call quality was excellent!', rating: 5 },
  { name: 'Anita Patel', role: 'Patient', text: 'Very easy to use. The doctors are professional and the platform is very smooth.', rating: 5 },
]

function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-md">
              <Heart size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">AI <span className="text-blue-600">Healthcare</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#specializations" className="hover:text-blue-600 transition-colors">Specializations</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2">Sign In</Link>
            <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-5 rounded-xl transition-colors shadow-md">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium mb-6">
              <Brain size={14} />
              AI-Powered Healthcare Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Doctor Consultation
              <span className="block text-blue-200">At Your Fingertips</span>
            </h1>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Consult top doctors online, get AI-powered health insights, and manage your health — anytime, anywhere.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto bg-white text-blue-700 hover:bg-blue-50 font-bold py-3.5 px-8 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 text-base"
              >
                Consult a Doctor <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-3.5 px-8 rounded-xl transition-colors border border-white/20 text-base"
              >
                Sign In
              </button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-blue-200">
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-400" /> Free Registration</span>
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-400" /> 20+ Specialists</span>
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-400" /> AI Health Analysis</span>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="max-w-4xl mx-auto px-4 mt-14">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 border border-white/20">
            {[
              { value: '20+', label: 'Expert Doctors', icon: Stethoscope },
              { value: '10K+', label: 'Consultations', icon: Calendar },
              { value: '4.8★', label: 'Average Rating', icon: Star },
              { value: '15+', label: 'Specializations', icon: Activity },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white mb-1">{value}</p>
                <p className="text-blue-200 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions — like MFine */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">What do you need?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🩺', title: 'Consult a Doctor', desc: 'Online consultation', color: 'bg-blue-50 border-blue-100' },
              { icon: '🧠', title: 'AI Symptom Check', desc: 'Get health insights', color: 'bg-purple-50 border-purple-100' },
              { icon: '💊', title: 'Medicine Reminder', desc: 'Never miss a dose', color: 'bg-green-50 border-green-100' },
              { icon: '📋', title: 'Health Records', desc: 'View your reports', color: 'bg-orange-50 border-orange-100' },
            ].map(({ icon, title, desc, color }) => (
              <button
                key={title}
                onClick={() => navigate('/register')}
                className={`${color} border rounded-2xl p-5 text-left hover:shadow-md transition-all group`}
              >
                <div className="text-3xl mb-3">{icon}</div>
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-gray-400 text-xs mt-1">{desc}</p>
                <ChevronRight size={14} className="text-gray-400 mt-2 group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Specializations */}
      <section id="specializations" className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Browse by Specialization</h2>
            <p className="text-gray-500 text-sm mt-2">Find the right specialist for every health concern</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {specializations.map(({ name, icon }) => (
              <button
                key={name}
                onClick={() => navigate('/register')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight group-hover:text-blue-700">{name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-14 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Everything in One App</h2>
            <p className="text-gray-500 text-sm mt-2">A complete healthcare platform for all your needs</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">How It Works</h2>
          <p className="text-gray-500 text-sm mb-10">Get a consultation in 3 simple steps</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', icon: '📝', title: 'Describe Symptoms', desc: 'Enter your symptoms. Our AI analyzes them instantly and suggests possible conditions.' },
              { step: '2', icon: '🔍', title: 'Get AI Analysis', desc: 'Receive possible conditions, severity assessment, and specialist recommendations.' },
              { step: '3', icon: '👨‍⚕️', title: 'Consult Doctor', desc: 'Book an appointment and connect with your doctor via video call or chat.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="relative">
                <div className="bg-blue-50 rounded-2xl p-6 text-left">
                  <div className="text-3xl mb-3">{icon}</div>
                  <div className="text-xs font-bold text-blue-600 mb-1">STEP {step}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">What Patients Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map(({ name, role, text, rating }) => (
              <div key={name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm mb-4">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                    {name.charAt(0)}
                  </div>
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

      {/* CTA */}
      <section className="py-14 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Your Health Journey Today</h2>
          <p className="text-blue-200 mb-8">Join thousands of patients getting better healthcare with AI</p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-3.5 px-10 rounded-xl transition-colors shadow-lg inline-flex items-center gap-2 text-base"
          >
            Get Started Free <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <Heart size={16} className="text-white" />
              </div>
              <span className="text-white font-bold">AI Healthcare</span>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#specializations" className="hover:text-white transition-colors">Specializations</a>
              <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
              <Link to="/register" className="hover:text-white transition-colors">Register</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm">
            <p>© 2026 AI Healthcare Platform. All rights reserved.</p>
            <p className="text-xs mt-1 text-gray-600">Not a substitute for professional medical advice.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
