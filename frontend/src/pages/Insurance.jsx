import { useState, useEffect, useRef } from 'react'
import { Shield, Plus, Trash2, FileText, Upload, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, X, Eye } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import toast from 'react-hot-toast'

const TABS = ['Policies', 'Documents', 'Claims']

const POLICY_TYPES = ['Health', 'Life', 'Dental', 'Vision', 'Accident', 'Critical Illness', 'Other']
const CLAIM_STATUSES = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', processing: 'Processing' }

const statusColor = {
  pending:    'bg-yellow-100 text-yellow-700',
  approved:   'bg-green-100 text-green-700',
  rejected:   'bg-red-100 text-red-700',
  processing: 'bg-blue-100 text-blue-700',
}

export default function Insurance() {
  const [activeTab, setActiveTab] = useState('Policies')
  const [policies, setPolicies] = useState([])
  const [claims, setClaims] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(null)

  // Policy form
  const [showPolicyForm, setShowPolicyForm] = useState(false)
  const [policyForm, setPolicyForm] = useState({
    provider: '', policy_number: '', type: 'Health',
    coverage_amount: '', premium: '', valid_from: '', valid_to: '', notes: ''
  })

  // Claim form
  const [showClaimForm, setShowClaimForm] = useState(false)
  const [claimForm, setClaimForm] = useState({
    policy_id: '', hospital: '', treatment: '', bill_amount: '', claim_date: '', notes: ''
  })

  // Document upload
  const [selectedPolicyForDoc, setSelectedPolicyForDoc] = useState('')
  const [docName, setDocName] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [p, c] = await Promise.all([
        api.get('/insurance/policies'),
        api.get('/insurance/claims'),
      ])
      setPolicies(p.data || [])
      setClaims(c.data || [])
    } catch {
      toast.error('Failed to load insurance data')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async (policyId) => {
    try {
      const res = await api.get(`/insurance/documents/${policyId}`)
      setDocuments(prev => {
        const filtered = prev.filter(d => d.policy_id !== policyId)
        return [...filtered, ...(res.data || []).map(d => ({ ...d, policy_id: policyId }))]
      })
    } catch {}
  }

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    if (activeTab === 'Documents' && policies.length) {
      policies.forEach(p => fetchDocuments(p._id || p.id))
    }
  }, [activeTab, policies.length])

  // Stats
  const activePolicies = policies.filter(p => {
    if (!p.valid_to) return true
    return new Date(p.valid_to) >= new Date()
  }).length
  const totalCoverage = policies.reduce((s, p) => s + (Number(p.coverage_amount) || 0), 0)
  const pendingClaims = claims.filter(c => c.status === 'pending' || c.status === 'processing').length
  const approvedClaims = claims.filter(c => c.status === 'approved').length

  const addPolicy = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/insurance/policies', policyForm)
      setPolicies(prev => [...prev, res.data])
      setShowPolicyForm(false)
      setPolicyForm({ provider: '', policy_number: '', type: 'Health', coverage_amount: '', premium: '', valid_from: '', valid_to: '', notes: '' })
      toast.success('Policy added!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add policy')
    }
  }

  const deletePolicy = async (id) => {
    if (!window.confirm('Delete this policy?')) return
    try {
      await api.delete(`/insurance/policies/${id}`)
      setPolicies(prev => prev.filter(p => (p._id || p.id) !== id))
      toast.success('Policy deleted')
    } catch {
      toast.error('Failed to delete policy')
    }
  }

  const addClaim = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/insurance/claims', claimForm)
      setClaims(prev => [...prev, res.data])
      setShowClaimForm(false)
      setClaimForm({ policy_id: '', hospital: '', treatment: '', bill_amount: '', claim_date: '', notes: '' })
      toast.success('Claim submitted!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit claim')
    }
  }

  const uploadDocument = async () => {
    if (!fileRef.current?.files[0]) { toast.error('Select a file first'); return }
    if (!selectedPolicyForDoc) { toast.error('Select a policy first'); return }
    const file = fileRef.current.files[0]
    if (file.size > 2 * 1024 * 1024) { toast.error('File must be under 2MB'); return }

    const reader = new FileReader()
    reader.onload = async () => {
      setUploading(true)
      try {
        const res = await api.post(`/insurance/documents/${selectedPolicyForDoc}`, {
          name: docName || file.name,
          file_data: reader.result,
          file_type: file.type,
        })
        setDocuments(prev => [...prev, { ...res.data, policy_id: selectedPolicyForDoc }])
        setDocName('')
        fileRef.current.value = ''
        toast.success('Document uploaded!')
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Upload failed')
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const deleteDocument = async (docId, policyId) => {
    try {
      await api.delete(`/insurance/documents/${policyId}/${docId}`)
      setDocuments(prev => prev.filter(d => (d._id || d.id) !== docId))
      toast.success('Document deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const getPolicyName = (id) => {
    const p = policies.find(p => (p._id || p.id) === id)
    return p ? `${p.provider} - ${p.policy_number}` : id
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-500 rounded-2xl p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold">Insurance Manager</h1>
              <p className="text-indigo-100 text-xs">Policies, Documents & Claims in one place</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Policies', value: activePolicies, icon: <Shield size={16}/>, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Total Coverage', value: `₹${totalCoverage.toLocaleString('en-IN')}`, icon: <CheckCircle size={16}/>, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Pending Claims', value: pendingClaims, icon: <Clock size={16}/>, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Approved Claims', value: approvedClaims, icon: <CheckCircle size={16}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map(s => (
            <div key={s.label} className="card flex items-center gap-3 py-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="font-bold text-gray-900 text-sm">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-100">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-5 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                activeTab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── POLICIES TAB ── */}
        {activeTab === 'Policies' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Your Policies ({policies.length})</h2>
              <button onClick={() => setShowPolicyForm(!showPolicyForm)}
                className="btn-primary text-sm flex items-center gap-2 px-4 py-2">
                <Plus size={15}/> Add Policy
              </button>
            </div>

            {/* Add Policy Form */}
            {showPolicyForm && (
              <div className="card border-2 border-indigo-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">New Insurance Policy</h3>
                  <button onClick={() => setShowPolicyForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
                </div>
                <form onSubmit={addPolicy} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Insurance Provider</label>
                      <input type="text" required placeholder="e.g. HDFC Ergo" className="input-field"
                        value={policyForm.provider} onChange={e => setPolicyForm({...policyForm, provider: e.target.value})}/>
                    </div>
                    <div>
                      <label className="label">Policy Number</label>
                      <input type="text" required placeholder="e.g. HDFC-2024-001" className="input-field"
                        value={policyForm.policy_number} onChange={e => setPolicyForm({...policyForm, policy_number: e.target.value})}/>
                    </div>
                    <div>
                      <label className="label">Policy Type</label>
                      <select className="input-field" value={policyForm.type} onChange={e => setPolicyForm({...policyForm, type: e.target.value})}>
                        {POLICY_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Coverage Amount (₹)</label>
                      <input type="number" placeholder="e.g. 500000" className="input-field"
                        value={policyForm.coverage_amount} onChange={e => setPolicyForm({...policyForm, coverage_amount: e.target.value})}/>
                    </div>
                    <div>
                      <label className="label">Annual Premium (₹)</label>
                      <input type="number" placeholder="e.g. 12000" className="input-field"
                        value={policyForm.premium} onChange={e => setPolicyForm({...policyForm, premium: e.target.value})}/>
                    </div>
                    <div>
                      <label className="label">Valid From</label>
                      <input type="date" className="input-field"
                        value={policyForm.valid_from} onChange={e => setPolicyForm({...policyForm, valid_from: e.target.value})}/>
                    </div>
                    <div>
                      <label className="label">Valid To</label>
                      <input type="date" className="input-field"
                        value={policyForm.valid_to} onChange={e => setPolicyForm({...policyForm, valid_to: e.target.value})}/>
                    </div>
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <textarea placeholder="Additional details..." className="input-field h-16 resize-none"
                      value={policyForm.notes} onChange={e => setPolicyForm({...policyForm, notes: e.target.value})}/>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setShowPolicyForm(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                    <button type="submit" className="btn-primary flex-1 text-sm">Save Policy</button>
                  </div>
                </form>
              </div>
            )}

            {loading && <div className="text-center py-8 text-gray-400 text-sm">Loading policies...</div>}

            {!loading && policies.length === 0 && (
              <div className="card text-center py-12">
                <Shield size={48} className="mx-auto text-gray-200 mb-3"/>
                <p className="text-gray-500 font-medium">No policies added yet</p>
                <p className="text-gray-400 text-sm mt-1">Add your health insurance policies to track them here</p>
              </div>
            )}

            {policies.map(policy => {
              const id = policy._id || policy.id
              const isExpired = policy.valid_to && new Date(policy.valid_to) < new Date()
              return (
                <div key={id} className="card hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-gray-900">{policy.provider}</span>
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{policy.type}</span>
                        {isExpired
                          ? <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle size={10}/> Expired</span>
                          : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                        }
                      </div>
                      <p className="text-sm text-gray-500">Policy No: <span className="font-medium text-gray-700">{policy.policy_number}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setExpanded(expanded === id ? null : id)}
                        className="text-gray-400 hover:text-gray-600 p-1">
                        {expanded === id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      </button>
                      <button onClick={() => deletePolicy(id)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>

                  {expanded === id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      {policy.coverage_amount && (
                        <div><p className="text-gray-400 text-xs">Coverage</p><p className="font-semibold text-gray-800">₹{Number(policy.coverage_amount).toLocaleString('en-IN')}</p></div>
                      )}
                      {policy.premium && (
                        <div><p className="text-gray-400 text-xs">Annual Premium</p><p className="font-semibold text-gray-800">₹{Number(policy.premium).toLocaleString('en-IN')}</p></div>
                      )}
                      {policy.valid_from && (
                        <div><p className="text-gray-400 text-xs">Valid From</p><p className="font-semibold text-gray-800">{new Date(policy.valid_from).toLocaleDateString('en-IN')}</p></div>
                      )}
                      {policy.valid_to && (
                        <div><p className="text-gray-400 text-xs">Valid To</p><p className={`font-semibold ${isExpired ? 'text-red-600' : 'text-gray-800'}`}>{new Date(policy.valid_to).toLocaleDateString('en-IN')}</p></div>
                      )}
                      {policy.notes && (
                        <div className="col-span-2 sm:col-span-3"><p className="text-gray-400 text-xs">Notes</p><p className="text-gray-700">{policy.notes}</p></div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── DOCUMENTS TAB ── */}
        {activeTab === 'Documents' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Policy Documents</h2>

            {/* Upload Section */}
            <div className="card border-2 border-dashed border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Upload size={16}/> Upload Document</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="label">Select Policy</label>
                  <select className="input-field" value={selectedPolicyForDoc} onChange={e => setSelectedPolicyForDoc(e.target.value)}>
                    <option value="">-- Choose Policy --</option>
                    {policies.map(p => (
                      <option key={p._id || p.id} value={p._id || p.id}>{p.provider} - {p.policy_number}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Document Name</label>
                  <input type="text" placeholder="e.g. Policy Card" className="input-field"
                    value={docName} onChange={e => setDocName(e.target.value)}/>
                </div>
                <div>
                  <label className="label">File (PDF/Image, max 2MB)</label>
                  <input type="file" accept="image/*,.pdf" ref={fileRef} className="input-field text-sm py-2"/>
                </div>
              </div>
              <button onClick={uploadDocument} disabled={uploading}
                className="btn-primary mt-3 text-sm flex items-center gap-2 disabled:opacity-50">
                {uploading ? 'Uploading...' : <><Upload size={14}/> Upload Document</>}
              </button>
            </div>

            {policies.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">Add a policy first to upload documents</div>
            )}

            {/* Documents grouped by policy */}
            {policies.map(policy => {
              const pId = policy._id || policy.id
              const policyDocs = documents.filter(d => d.policy_id === pId)
              return (
                <div key={pId} className="card">
                  <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText size={15} className="text-indigo-500"/>
                    {policy.provider} — {policy.policy_number}
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-auto">{policyDocs.length} docs</span>
                  </p>
                  {policyDocs.length === 0 ? (
                    <p className="text-gray-400 text-xs">No documents uploaded for this policy</p>
                  ) : (
                    <div className="space-y-2">
                      {policyDocs.map(doc => {
                        const dId = doc._id || doc.id
                        return (
                          <div key={dId} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <FileText size={14} className="text-indigo-400"/>
                              <span className="text-sm font-medium text-gray-800">{doc.name || 'Document'}</span>
                              {doc.file_type && (
                                <span className="text-xs text-gray-400">{doc.file_type.includes('pdf') ? 'PDF' : 'Image'}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.file_data && (
                                <a href={doc.file_data} target="_blank" rel="noreferrer"
                                  className="text-blue-500 hover:text-blue-700 p-1"><Eye size={14}/></a>
                              )}
                              <button onClick={() => deleteDocument(dId, pId)} className="text-red-400 hover:text-red-600 p-1">
                                <Trash2 size={14}/>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── CLAIMS TAB ── */}
        {activeTab === 'Claims' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Claims ({claims.length})</h2>
              <button onClick={() => setShowClaimForm(!showClaimForm)}
                className="btn-primary text-sm flex items-center gap-2 px-4 py-2">
                <Plus size={15}/> Submit Claim
              </button>
            </div>

            {/* Submit Claim Form */}
            {showClaimForm && (
              <div className="card border-2 border-indigo-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">New Claim Request</h3>
                  <button onClick={() => setShowClaimForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
                </div>
                <form onSubmit={addClaim} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Policy</label>
                      <select required className="input-field" value={claimForm.policy_id} onChange={e => setClaimForm({...claimForm, policy_id: e.target.value})}>
                        <option value="">-- Select Policy --</option>
                        {policies.map(p => <option key={p._id||p.id} value={p._id||p.id}>{p.provider} - {p.policy_number}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Hospital / Clinic</label>
                      <input type="text" required placeholder="Hospital name" className="input-field"
                        value={claimForm.hospital} onChange={e => setClaimForm({...claimForm, hospital: e.target.value})}/>
                    </div>
                    <div>
                      <label className="label">Treatment / Diagnosis</label>
                      <input type="text" required placeholder="e.g. Appendectomy" className="input-field"
                        value={claimForm.treatment} onChange={e => setClaimForm({...claimForm, treatment: e.target.value})}/>
                    </div>
                    <div>
                      <label className="label">Bill Amount (₹)</label>
                      <input type="number" required placeholder="e.g. 45000" className="input-field"
                        value={claimForm.bill_amount} onChange={e => setClaimForm({...claimForm, bill_amount: e.target.value})}/>
                    </div>
                    <div>
                      <label className="label">Claim Date</label>
                      <input type="date" className="input-field"
                        value={claimForm.claim_date} onChange={e => setClaimForm({...claimForm, claim_date: e.target.value})}/>
                    </div>
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <textarea placeholder="Additional details about the claim..." className="input-field h-16 resize-none"
                      value={claimForm.notes} onChange={e => setClaimForm({...claimForm, notes: e.target.value})}/>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setShowClaimForm(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                    <button type="submit" className="btn-primary flex-1 text-sm">Submit Claim</button>
                  </div>
                </form>
              </div>
            )}

            {loading && <div className="text-center py-8 text-gray-400 text-sm">Loading claims...</div>}

            {!loading && claims.length === 0 && (
              <div className="card text-center py-12">
                <FileText size={48} className="mx-auto text-gray-200 mb-3"/>
                <p className="text-gray-500 font-medium">No claims submitted yet</p>
                <p className="text-gray-400 text-sm mt-1">Submit a reimbursement or cashless claim request</p>
              </div>
            )}

            {claims.map(claim => {
              const id = claim._id || claim.id
              const status = (claim.status || 'pending').toLowerCase()
              return (
                <div key={id} className="card hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-gray-900">{claim.treatment}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[status] || 'bg-gray-100 text-gray-600'}`}>
                          {CLAIM_STATUSES[status] || status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{claim.hospital}</p>
                      {claim.policy_id && (
                        <p className="text-xs text-gray-400 mt-0.5">{getPolicyName(claim.policy_id)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-700 text-sm">₹{Number(claim.bill_amount || 0).toLocaleString('en-IN')}</p>
                      {claim.claim_date && (
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(claim.claim_date).toLocaleDateString('en-IN')}</p>
                      )}
                    </div>
                  </div>
                  {claim.notes && (
                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-50">{claim.notes}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
