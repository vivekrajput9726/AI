import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import DoctorCard from '../components/common/DoctorCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { fetchDoctors, fetchSpecializations } from '../redux/slices/doctorSlice'

function DoctorListing() {
  const dispatch = useDispatch()
  const { list: doctors, total, specializations, loading } = useSelector(s => s.doctors)
  const [search, setSearch] = useState('')
  const [selectedSpec, setSelectedSpec] = useState('')
  const [minRating, setMinRating] = useState('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const limit = 12

  useEffect(() => {
    dispatch(fetchSpecializations())
  }, [dispatch])

  useEffect(() => {
    const params = { page, limit }
    if (search) params.search = search
    if (selectedSpec) params.specialization = selectedSpec
    if (minRating) params.min_rating = minRating
    dispatch(fetchDoctors(params))
  }, [dispatch, page, search, selectedSpec, minRating])

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedSpec('')
    setMinRating('')
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)
  const hasFilters = search || selectedSpec || minRating

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find Doctors</h1>
          <p className="text-gray-500 mt-1 text-sm">Browse and connect with {total} verified medical specialists</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search by name, specialization, or hospital..."
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
          >
            <SlidersHorizontal size={16} />
            Filters
            {hasFilters && <span className="w-2 h-2 bg-blue-600 rounded-full" />}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary flex items-center gap-2 text-red-600 border-red-200">
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="card animate-slide-up">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2"><Filter size={16} /> Filter Options</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Specialization</label>
                <select
                  value={selectedSpec}
                  onChange={e => { setSelectedSpec(e.target.value); setPage(1) }}
                  className="input-field"
                >
                  <option value="">All Specializations</option>
                  {specializations.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Minimum Rating</label>
                <select
                  value={minRating}
                  onChange={e => { setMinRating(e.target.value); setPage(1) }}
                  className="input-field"
                >
                  <option value="">Any Rating</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.7">4.7+ Stars</option>
                  <option value="4.9">4.9 Stars</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Specialization Quick Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setSelectedSpec(''); setPage(1) }}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${!selectedSpec ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
          >
            All
          </button>
          {specializations.slice(0, 8).map(spec => (
            <button
              key={spec}
              onClick={() => { setSelectedSpec(spec === selectedSpec ? '' : spec); setPage(1) }}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${selectedSpec === spec ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
            >
              {spec}
            </button>
          ))}
        </div>

        {/* Doctor Grid */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner text="Loading doctors..." />
          </div>
        ) : doctors.length === 0 ? (
          <div className="card text-center py-16">
            <Search size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500">No doctors found matching your criteria.</p>
            <button onClick={clearFilters} className="mt-3 text-blue-600 text-sm hover:underline">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {doctors.map(doc => <DoctorCard key={doc.id} doctor={doc} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary py-2 px-4 disabled:opacity-40"
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = page <= 3 ? i + 1 : page - 2 + i
                    if (pageNum > totalPages) return null
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${pageNum === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary py-2 px-4 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DoctorListing
