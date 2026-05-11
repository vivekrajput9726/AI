import { useNavigate, Link } from 'react-router-dom'
import { Heart, Brain, Calendar, Video, Shield, Star, ArrowRight, CheckCircle, Activity } from 'lucide-react'

const features = [
  { icon: Brain, title: 'AI Symptom Analysis', desc: 'Describe your symptoms and get instant AI-powered health insights with possible conditions and severity assessment.' },
  { icon: Heart, title: 'Expert Doctors', desc: 'Connect with 20+ verified specialists across all medical fields for professional consultations.' },
  { icon: Calendar, title: 'Easy Scheduling', desc: 'Book appointments at your convenience with real-time availability and instant confirmation.' },
  { icon: Video, title: 'Video Consultations', desc: 'Consult from the comfort of your home with secure, HD video calls with your doctor.' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your health data is protected with enterprise-grade encryption and strict privacy controls.' },
  { icon: Activity, title: 'Health Tracking', desc: 'Track your consultation history, prescriptions, and health reports in one place.' },
]

const stats = [
  { value: '20+', label: 'Expert Doctors' },
  { value: '10K+', label: 'Consultations' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '15+', label: 'Specializations' },
]

const specializations = [
  'Cardiologist', 'Neurologist', 'Dermatologist', 'Orthopedist',
  'Gynecologist', 'Psychiatrist', 'Gastroenterologist', 'Pulmonologist',
  'Endocrinologist', 'Pediatrician', 'ENT Specialist', 'Ophthalmologist'
]

function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
              <Heart size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">AI Healthcare</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm py-2 px-4">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <Brain size={14} />
            AI-Powered Healthcare Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Your Health, Our
            <span className="text-gradient block">Priority</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Describe your symptoms, get AI-powered health insights, and consult with expert doctors — all from the comfort of your home.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="btn-primary flex items-center gap-2 text-base py-3 px-8"
            >
              Start Free Consultation <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary flex items-center gap-2 text-base py-3 px-8"
            >
              Sign In
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <CheckCircle size={14} className="text-green-500" />
            <span>No subscription required • Pay per consultation</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-blue-600 mb-1">{s.value}</p>
              <p className="text-gray-500 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-gray-600 max-w-xl mx-auto">A complete healthcare platform powered by AI for smarter, faster, and more accessible medical care.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Icon size={22} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specializations */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">All Specializations</h2>
          <p className="text-gray-600 mb-10">Find the right specialist for every health concern</p>
          <div className="flex flex-wrap justify-center gap-3">
            {specializations.map((spec) => (
              <span key={spec} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                {spec}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-blue-200 mb-12 max-w-xl mx-auto">Get a consultation in 3 simple steps</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Describe Symptoms', desc: 'Enter your symptoms in natural language. Our AI analyzes them instantly.' },
              { step: '2', title: 'Get AI Analysis', desc: 'Receive possible conditions, severity assessment, and specialist recommendations.' },
              { step: '3', title: 'Consult Doctor', desc: 'Book an appointment and connect with your doctor via video call.' }
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-blue-200 text-sm">{desc}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/register')}
            className="mt-12 bg-white text-blue-700 hover:bg-blue-50 font-semibold py-3 px-8 rounded-xl transition-colors inline-flex items-center gap-2"
          >
            Get Started Free <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Heart size={16} className="text-blue-400" />
            <span className="text-white font-semibold">AI Healthcare</span>
          </div>
          <p className="text-sm">© 2026 AI Healthcare Platform. All rights reserved.</p>
          <p className="text-xs mt-2 text-gray-500">This platform is not a substitute for professional medical advice, diagnosis, or treatment.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
