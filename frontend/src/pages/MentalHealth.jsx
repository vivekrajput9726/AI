import { useState } from 'react'
import { Brain, ChevronRight, CheckCircle, RefreshCw, TrendingUp, Heart, AlertTriangle } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

const ASSESSMENTS = {
  depression: {
    label: 'Depression (PHQ-9)',
    color: 'bg-blue-600',
    light: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700',
    questions: [
      'Little interest or pleasure in doing things?',
      'Feeling down, depressed, or hopeless?',
      'Trouble falling or staying asleep, or sleeping too much?',
      'Feeling tired or having little energy?',
      'Poor appetite or overeating?',
      'Feeling bad about yourself — or that you are a failure?',
      'Trouble concentrating on things (reading, watching TV)?',
      'Moving or speaking so slowly that other people noticed? Or the opposite — being fidgety?',
      'Thoughts that you would be better off dead, or of hurting yourself?',
    ],
    levels: [
      { max: 4, level: 'Minimal', color: 'bg-green-100 text-green-700', advice: 'Your mood appears stable. Keep up healthy habits like exercise, sleep, and social connections.' },
      { max: 9, level: 'Mild', color: 'bg-yellow-100 text-yellow-700', advice: 'Mild symptoms detected. Consider talking to someone you trust, regular exercise and mindfulness.' },
      { max: 14, level: 'Moderate', color: 'bg-orange-100 text-orange-700', advice: 'Moderate symptoms. It would help to speak with a mental health professional or counselor.' },
      { max: 19, level: 'Moderately Severe', color: 'bg-red-100 text-red-700', advice: 'Please consult a psychiatrist. Professional help is recommended.' },
      { max: 27, level: 'Severe', color: 'bg-red-200 text-red-800', advice: 'Severe symptoms detected. Please seek professional help immediately. You are not alone.' },
    ]
  },
  anxiety: {
    label: 'Anxiety (GAD-7)',
    color: 'bg-purple-600',
    light: 'bg-purple-50 border-purple-200',
    textColor: 'text-purple-700',
    questions: [
      'Feeling nervous, anxious, or on edge?',
      'Not being able to stop or control worrying?',
      'Worrying too much about different things?',
      'Trouble relaxing?',
      'Being so restless that it is hard to sit still?',
      'Becoming easily annoyed or irritable?',
      'Feeling afraid as if something awful might happen?',
    ],
    levels: [
      { max: 4, level: 'Minimal Anxiety', color: 'bg-green-100 text-green-700', advice: 'Your anxiety levels appear low. Practice regular deep breathing and mindfulness.' },
      { max: 9, level: 'Mild Anxiety', color: 'bg-yellow-100 text-yellow-700', advice: 'Mild anxiety. Try relaxation techniques, reduce caffeine, and maintain sleep schedule.' },
      { max: 14, level: 'Moderate Anxiety', color: 'bg-orange-100 text-orange-700', advice: 'Consider speaking with a counselor. Therapy and relaxation techniques can help significantly.' },
      { max: 21, level: 'Severe Anxiety', color: 'bg-red-100 text-red-700', advice: 'Please consult a mental health professional. Effective treatments are available.' },
    ]
  },
  stress: {
    label: 'Stress Level (PSS-10)',
    color: 'bg-teal-600',
    light: 'bg-teal-50 border-teal-200',
    textColor: 'text-teal-700',
    questions: [
      'Been upset because of something unexpected?',
      'Felt unable to control important things in life?',
      'Felt nervous and stressed?',
      'Felt confident in your ability to handle problems? (Reverse)',
      'Things were going your way? (Reverse)',
      'Found you could not cope with all the things to do?',
      'Been able to control irritations? (Reverse)',
      'Felt on top of things? (Reverse)',
      'Been angered by things outside your control?',
      'Difficulties piling up so high you cannot overcome them?',
    ],
    levels: [
      { max: 13, level: 'Low Stress', color: 'bg-green-100 text-green-700', advice: 'Good stress management! Keep up your current lifestyle and coping strategies.' },
      { max: 26, level: 'Moderate Stress', color: 'bg-yellow-100 text-yellow-700', advice: 'Moderate stress. Take breaks, exercise regularly, and connect with supportive people.' },
      { max: 40, level: 'High Stress', color: 'bg-red-100 text-red-700', advice: 'High stress detected. Consider speaking to a counselor and reviewing your daily routine.' },
    ]
  }
}

const OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
]

export default function MentalHealth() {
  const [selected, setSelected] = useState(null)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)

  const assessment = selected ? ASSESSMENTS[selected] : null

  const start = (key) => {
    setSelected(key)
    setStep(0)
    setAnswers([])
    setResult(null)
  }

  const answer = (val) => {
    const newAnswers = [...answers, val]
    setAnswers(newAnswers)
    if (newAnswers.length < assessment.questions.length) {
      setStep(s => s + 1)
    } else {
      const score = newAnswers.reduce((a, b) => a + b, 0)
      const level = assessment.levels.find(l => score <= l.max) || assessment.levels[assessment.levels.length - 1]
      const res = { score, ...level }
      setResult(res)
      saveResult(score, level.level, newAnswers)
    }
  }

  const saveResult = async (score, level, ans) => {
    setSaving(true)
    try {
      await api.post('/wellness/mental-assessment', {
        assessment_type: selected,
        score,
        level,
        answers: ans.map((v, i) => ({ question: assessment.questions[i], answer: v }))
      })
    } catch { } finally { setSaving(false) }
  }

  const reset = () => { setSelected(null); setStep(0); setAnswers([]); setResult(null) }

  const progress = assessment ? Math.round((answers.length / assessment.questions.length) * 100) : 0

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-5 animate-fade-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold">Mental Health Assessment</h1>
              <p className="text-purple-200 text-xs">Clinically validated mental health screening tools</p>
            </div>
          </div>
        </div>

        {/* Select Assessment */}
        {!selected && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 font-medium">Choose an assessment to begin:</p>
            {Object.entries(ASSESSMENTS).map(([key, a]) => (
              <button key={key} onClick={() => start(key)}
                className={`w-full card flex items-center gap-4 hover:shadow-md transition-all text-left border-2 border-transparent hover:border-purple-200`}>
                <div className={`w-12 h-12 ${a.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <Brain size={22} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{a.label}</p>
                  <p className="text-xs text-gray-400">{a.questions.length} questions · 2-3 minutes</p>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            ))}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <Heart size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">These are screening tools, not diagnoses. Results are confidential and stored securely. If you are in crisis, please call <strong>iCall: 9152987821</strong></p>
            </div>
          </div>
        )}

        {/* Quiz */}
        {selected && !result && (
          <div className="card space-y-5">
            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{assessment.label}</span>
                <span>Question {step + 1} of {assessment.questions.length}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-purple-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Question */}
            <div className="bg-purple-50 rounded-2xl p-5">
              <p className="text-xs text-purple-500 font-medium mb-2">Over the last 2 weeks, how often have you been bothered by:</p>
              <p className="text-base font-bold text-gray-900">{assessment.questions[step]}</p>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => answer(opt.value)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left group">
                  <div className="w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-purple-500 flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-400 group-hover:text-purple-600">
                    {opt.value}
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">{opt.label}</span>
                </button>
              ))}
            </div>

            <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← Start over</button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="card space-y-5 animate-fade-in">
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain size={36} className="text-purple-600" />
              </div>
              <p className="text-sm text-gray-500">Your {assessment.label} Score</p>
              <p className="text-5xl font-extrabold text-gray-900 mt-1">{result.score}</p>
            </div>

            <div className={`rounded-2xl p-4 text-center ${result.color}`}>
              <p className="text-lg font-extrabold">{result.level}</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-700 mb-1">What this means:</p>
              <p className="text-sm text-blue-800">{result.advice}</p>
            </div>

            {/* Score breakdown */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">Score Range Guide:</p>
              <div className="space-y-1.5">
                {assessment.levels.map((l, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${l.level === result.level ? l.color + ' font-bold border' : 'text-gray-400'}`}>
                    <span className="w-2 h-2 rounded-full bg-current flex-shrink-0" />
                    {l.level}
                    {l.level === result.level && <CheckCircle size={13} className="ml-auto" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={reset} className="btn-secondary flex-1 flex items-center justify-center gap-2"><RefreshCw size={15}/> Take Another</button>
              <button onClick={() => start(selected)} className="btn-primary flex-1">Retake Test</button>
            </div>

            {(result.level.includes('Severe') || result.level.includes('Moderate')) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-700">
                  <p className="font-bold">Consider seeking help:</p>
                  <p className="mt-0.5">iCall Helpline: <strong>9152987821</strong></p>
                  <p>Vandrevala Foundation: <strong>1860-2662-345</strong></p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
