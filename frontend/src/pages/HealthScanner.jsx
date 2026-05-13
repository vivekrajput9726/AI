import { useState, useRef, useCallback } from 'react'
import { Camera, RefreshCw, Scan, AlertCircle, CheckCircle, Bot, X, ZoomIn } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

const SCAN_TIPS = [
  'Ensure good lighting on your face',
  'Remove glasses if possible',
  'Keep the camera steady',
  'Look directly at the camera',
]

const STATUS_COLORS = {
  high: 'text-red-600 bg-red-50 border-red-200',
  low: 'text-blue-600 bg-blue-50 border-blue-200',
  normal: 'text-green-600 bg-green-50 border-green-200',
  unknown: 'text-gray-600 bg-gray-50 border-gray-200',
}

export default function HealthScanner() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [cameraActive, setCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(0)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraActive(true)
      setCapturedImage(null)
      setResult(null)
    } catch {
      toast.error('Camera access denied. Please allow camera permission.')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCapturedImage(dataUrl)
    stopCamera()
  }, [])

  const handleScan = async () => {
    if (!capturedImage) return
    setScanning(true)
    setResult(null)
    setProgress(0)

    // Animate progress bar
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(interval); return 90 }
        return p + Math.random() * 12
      })
    }, 200)

    try {
      const res = await api.post('/ai/analyze-report', { image_base64: capturedImage })
      clearInterval(interval)
      setProgress(100)
      if (res.data.success) {
        setResult(res.data.data)
      } else {
        toast.error(res.data.error || 'Scan failed')
      }
    } catch {
      clearInterval(interval)
      toast.error('AI scan failed. Please try again.')
    } finally {
      setScanning(false)
    }
  }

  const reset = () => {
    setCapturedImage(null)
    setResult(null)
    setProgress(0)
    stopCamera()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-1">
            <Scan size={22} />
            <p className="text-blue-200 text-sm">AI-Powered</p>
          </div>
          <h1 className="text-2xl font-bold">AI Health Scanner</h1>
          <p className="text-blue-200 text-sm mt-1">Use your camera to scan and get an AI health assessment. Point at a visible body area or report.</p>
        </div>

        {/* Tips */}
        {!cameraActive && !capturedImage && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><AlertCircle size={16} className="text-blue-500" /> Before You Scan</h3>
            <ul className="space-y-2">
              {SCAN_TIPS.map((tip, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Camera / Preview */}
        <div className="card">
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden" style={{ minHeight: 300 }}>
            {/* Live camera */}
            <video
              ref={videoRef}
              className={`w-full rounded-2xl object-cover ${cameraActive ? 'block' : 'hidden'}`}
              style={{ maxHeight: 360 }}
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Captured image */}
            {capturedImage && !cameraActive && (
              <img src={capturedImage} alt="Captured" className="w-full rounded-2xl object-cover" style={{ maxHeight: 360 }} />
            )}

            {/* Scanning overlay */}
            {scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-2xl">
                <div className="relative w-32 h-32 mb-4">
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping opacity-40" />
                  <div className="absolute inset-2 border-4 border-blue-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '0.3s' }} />
                  <div className="w-full h-full flex items-center justify-center">
                    <Bot size={40} className="text-blue-400 animate-pulse" />
                  </div>
                </div>
                <p className="text-white font-semibold text-lg">AI Scanning...</p>
                <p className="text-blue-300 text-sm mt-1">{Math.round(progress)}% complete</p>
                <div className="w-48 bg-gray-700 rounded-full h-2 mt-3">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Idle state */}
            {!cameraActive && !capturedImage && !scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <Camera size={48} className="mb-3 opacity-40" />
                <p className="text-sm">Camera preview will appear here</p>
              </div>
            )}

            {/* Scan frame overlay on live camera */}
            {cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 border-2 border-blue-400 rounded-2xl opacity-60" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-1 bg-blue-400 opacity-50 animate-bounce" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3 mt-4">
            {!cameraActive && !capturedImage && (
              <button onClick={startCamera} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Camera size={16} /> Start Camera
              </button>
            )}
            {cameraActive && (
              <>
                <button onClick={stopCamera} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <X size={16} /> Cancel
                </button>
                <button onClick={captureFrame} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Scan size={16} /> Capture
                </button>
              </>
            )}
            {capturedImage && !scanning && !result && (
              <>
                <button onClick={reset} className="btn-secondary flex items-center gap-2 px-4">
                  <RefreshCw size={15} /> Retake
                </button>
                <button onClick={handleScan} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Bot size={16} /> Analyze with AI
                </button>
              </>
            )}
            {result && (
              <button onClick={reset} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <RefreshCw size={15} /> New Scan
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="card space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle size={18} className="text-blue-600" /> AI Scan Results
              </h2>
              {result.severity && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  result.severity === 'Normal' ? 'bg-green-100 text-green-700' :
                  result.severity === 'Mild Concern' ? 'bg-yellow-100 text-yellow-700' :
                  result.severity === 'Moderate Concern' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'}`}>
                  {result.severity}
                </span>
              )}
            </div>

            {result.report_type && (
              <div className="bg-blue-50 rounded-xl px-4 py-2.5">
                <p className="text-xs text-blue-600 font-medium">Detection Type</p>
                <p className="text-sm font-semibold text-blue-800">{result.report_type}</p>
              </div>
            )}

            {result.overall_summary && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Summary</p>
                <p className="text-sm text-gray-700 leading-relaxed">{result.overall_summary}</p>
              </div>
            )}

            {result.parameters?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Indicators</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {result.parameters.map((p, i) => (
                    <div key={i} className={`border rounded-xl p-3 ${STATUS_COLORS[p.status] || STATUS_COLORS.unknown}`}>
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-medium text-sm">{p.name}</p>
                        <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-white/60 font-semibold flex-shrink-0">{p.status}</span>
                      </div>
                      {p.value && <p className="text-base font-bold mt-0.5">{p.value} <span className="text-xs font-normal opacity-70">{p.unit}</span></p>}
                      {p.interpretation && <p className="text-xs mt-1.5 opacity-80 border-t border-current/20 pt-1.5">{p.interpretation}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.concerns?.length > 0 && (
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-700 mb-1.5">Concerns</p>
                <ul className="space-y-1">{result.concerns.map((c, i) => <li key={i} className="text-xs text-red-600 flex gap-1.5"><span>•</span>{c}</li>)}</ul>
              </div>
            )}

            {result.recommendations?.length > 0 && (
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-green-700 mb-1.5">Recommendations</p>
                <ul className="space-y-1">{result.recommendations.map((r, i) => <li key={i} className="text-xs text-green-600 flex gap-1.5"><span>✓</span>{r}</li>)}</ul>
              </div>
            )}

            {result.doctor_to_consult && (
              <div className="bg-indigo-50 rounded-xl px-4 py-2.5">
                <p className="text-xs text-indigo-600 font-medium">Recommended Specialist</p>
                <p className="text-sm font-semibold text-indigo-800">{result.doctor_to_consult}</p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2.5">
              <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">This AI scan is for educational awareness only and is not a medical diagnosis. Always consult a qualified healthcare professional.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
