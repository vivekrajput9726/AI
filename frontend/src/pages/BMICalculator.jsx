import { useState } from 'react'
import { Activity, TrendingUp, Heart, Zap, Target, Info } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'

const BMI_RANGES = [
  { max: 18.5, label: 'Underweight',    color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',   advice: 'You may need to gain weight. Consult a dietitian for a healthy meal plan.' },
  { max: 24.9, label: 'Normal Weight',  color: 'text-green-600',  bg: 'bg-green-50 border-green-200', advice: 'Great! Maintain your weight with balanced diet and regular exercise.' },
  { max: 29.9, label: 'Overweight',     color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', advice: 'Consider a balanced diet and 150 minutes of exercise per week.' },
  { max: 34.9, label: 'Obese Class I',  color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', advice: 'Health risks are increased. Consult a doctor for a weight management plan.' },
  { max: 999,  label: 'Obese Class II', color: 'text-red-600',    bg: 'bg-red-50 border-red-200',       advice: 'Significant health risks. Please consult a doctor immediately.' },
]

function ResultCard({ icon: Icon, label, value, unit, color, sub }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-3`}>
        <Icon size={17} className="text-white" />
      </div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-xl font-extrabold text-gray-900 mt-0.5">{value} <span className="text-sm font-normal text-gray-400">{unit}</span></p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function BMICalculator() {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge]       = useState('')
  const [gender, setGender] = useState('male')
  const [unit, setUnit]     = useState('metric')
  const [result, setResult] = useState(null)

  const calculate = () => {
    if (!weight || !height) return
    let w = parseFloat(weight), h = parseFloat(height)
    if (unit === 'imperial') { w = w * 0.453592; h = h * 0.0254 }
    else { h = h / 100 }

    const bmi    = w / (h * h)
    const range  = BMI_RANGES.find(r => bmi <= r.max)
    const ibw    = 22 * (h * h)
    const a      = parseInt(age) || 25
    const bmr    = gender === 'male'
      ? 88.36 + 13.4 * w + 4.8 * (h * 100) - 5.7 * a
      : 447.6 + 9.2  * w + 3.1 * (h * 100) - 4.3 * a
    const maxHR  = 220 - a
    const fatBurn= Math.round(maxHR * 0.6) + '–' + Math.round(maxHR * 0.7)
    const cardio = Math.round(maxHR * 0.7) + '–' + Math.round(maxHR * 0.85)
    const whr    = Math.round(ibw * 0.95) + '–' + Math.round(ibw * 1.05)

    setResult({ bmi: bmi.toFixed(1), range, ibw: ibw.toFixed(1), bmr: Math.round(bmr), maxHR, fatBurn, cardio, whr })
  }

  const bmiPercent = result ? Math.min(100, Math.max(0, ((parseFloat(result.bmi) - 10) / (40 - 10)) * 100)) : 0

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-5 animate-fade-in">

        <div className="bg-gradient-to-r from-green-600 to-teal-500 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold">BMI & Health Calculator</h1>
              <p className="text-green-100 text-xs">BMI · Ideal Weight · Calories · Heart Rate Zones</p>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          {/* Unit Toggle */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {['metric','imperial'].map(u => (
              <button key={u} onClick={() => setUnit(u)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${unit===u?'bg-white text-green-700 shadow-sm':'text-gray-500'}`}>
                {u} {u==='metric'?'(kg/cm)':'(lbs/in)'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Weight ({unit==='metric'?'kg':'lbs'}) *</label>
              <input type="number" value={weight} onChange={e=>setWeight(e.target.value)} placeholder={unit==='metric'?'70':'154'} className="input-field" />
            </div>
            <div>
              <label className="label">Height ({unit==='metric'?'cm':'inches'}) *</label>
              <input type="number" value={height} onChange={e=>setHeight(e.target.value)} placeholder={unit==='metric'?'170':'67'} className="input-field" />
            </div>
            <div>
              <label className="label">Age</label>
              <input type="number" value={age} onChange={e=>setAge(e.target.value)} placeholder="25" className="input-field" />
            </div>
            <div>
              <label className="label">Gender</label>
              <select value={gender} onChange={e=>setGender(e.target.value)} className="input-field">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <button onClick={calculate} disabled={!weight||!height}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-40">
            Calculate
          </button>
        </div>

        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* BMI Gauge */}
            <div className={`card border-2 ${result.range.bg} space-y-3`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Your BMI</p>
                  <p className="text-4xl font-extrabold text-gray-900">{result.bmi}</p>
                </div>
                <span className={`text-sm font-extrabold px-3 py-1.5 rounded-xl border ${result.range.bg} ${result.range.color}`}>
                  {result.range.label}
                </span>
              </div>

              {/* BMI Bar */}
              <div className="relative">
                <div className="w-full h-3 rounded-full overflow-hidden flex">
                  <div className="flex-1 bg-blue-400" />
                  <div className="flex-1 bg-green-400" />
                  <div className="flex-1 bg-yellow-400" />
                  <div className="flex-1 bg-orange-400" />
                  <div className="flex-1 bg-red-500" />
                </div>
                <div className="absolute top-0 h-3 flex items-center transition-all"
                  style={{ left: `calc(${bmiPercent}% - 6px)` }}>
                  <div className="w-4 h-4 bg-white border-2 border-gray-700 rounded-full shadow -mt-0.5" />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>10</span><span>18.5</span><span>25</span><span>30</span><span>35</span><span>40+</span>
                </div>
              </div>

              <p className="text-sm text-gray-600">{result.range.advice}</p>
            </div>

            {/* Result Cards */}
            <div className="grid grid-cols-2 gap-3">
              <ResultCard icon={Target}    label="Ideal Weight Range"   value={result.whr}         unit="kg"       color="bg-blue-500"   sub="Healthy BMI range" />
              <ResultCard icon={Zap}       label="Basal Metabolic Rate" value={result.bmr}         unit="kcal/day" color="bg-purple-500"  sub="Calories at rest" />
              <ResultCard icon={Heart}     label="Max Heart Rate"       value={result.maxHR}       unit="bpm"      color="bg-red-500"    sub={`Age: ${age||25}`} />
              <ResultCard icon={TrendingUp} label="Fat Burn Zone"       value={result.fatBurn}     unit="bpm"      color="bg-orange-500" sub="60–70% max HR" />
            </div>

            {/* Calorie Needs */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Zap size={15} className="text-purple-500"/> Daily Calorie Needs</h3>
              <div className="space-y-2">
                {[
                  { label: 'Sedentary (desk job, no exercise)', multiplier: 1.2 },
                  { label: 'Lightly active (1-3 days/week)',    multiplier: 1.375 },
                  { label: 'Moderately active (3-5 days/week)',multiplier: 1.55 },
                  { label: 'Very active (6-7 days/week)',       multiplier: 1.725 },
                ].map(({ label, multiplier }) => (
                  <div key={label} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-600">{label}</p>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0 ml-2">{Math.round(result.bmr * multiplier)} kcal</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <Info size={13} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">BMI is a screening tool, not a diagnostic measure. Consult a doctor for personalized health advice.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
