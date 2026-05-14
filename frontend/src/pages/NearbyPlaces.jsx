import { useState, useEffect } from 'react'
import { MapPin, Navigation, Loader, RefreshCw, Phone, Star } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import toast from 'react-hot-toast'

const PLACE_TYPES = [
  { value: 'pharmacy', label: 'Medical Stores', icon: '💊', query: 'medical+store+pharmacy+chemist' },
  { value: 'hospital', label: 'Hospitals', icon: '🏥', query: 'hospital' },
  { value: 'clinic', label: 'Clinics', icon: '🩺', query: 'clinic+doctor' },
]

function NearbyPlaces() {
  const [userLocation, setUserLocation] = useState(null)
  const [places, setPlaces] = useState([])
  const [activeType, setActiveType] = useState('pharmacy')
  const [loading, setLoading] = useState(false)
  const [locationError, setLocationError] = useState(false)
  const [mapUrl, setMapUrl] = useState('')

  const getUserLocation = () => {
    setLocationError(false)
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported')
      return
    }
    toast('Getting your location...', { icon: '📍' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        updateMap(loc, activeType)
        searchNearby(loc, activeType)
      },
      () => {
        setLocationError(true)
        toast.error('Please allow location access')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const updateMap = (loc, type) => {
    const typeData = PLACE_TYPES.find(t => t.value === type)
    const query = typeData?.query || 'pharmacy'
    setMapUrl(`https://www.google.com/maps/embed/v1/search?key=AIzaSyDbJYEZtAxICSETR249CQVF0s-0HcCtriQ&q=${query}+near+${loc.lat},${loc.lng}&zoom=13`)
  }

  const searchNearby = async (location, type) => {
    setLoading(true)
    setPlaces([])

    const amenityMap = {
      pharmacy: 'pharmacy',
      hospital: 'hospital',
      clinic:   'clinic'
    }
    const amenity = amenityMap[type] || 'pharmacy'

    // Try multiple Overpass API mirrors
    const MIRRORS = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    ]

    // Build a clean query
    const query = `[out:json][timeout:20];(node["amenity"="${amenity}"](around:5000,${location.lat},${location.lng});way["amenity"="${amenity}"](around:5000,${location.lat},${location.lng}););out center 20;`

    let success = false

    for (const mirror of MIRRORS) {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 15000)

        const res = await fetch(`${mirror}?data=${encodeURIComponent(query)}`, {
          signal: controller.signal
        })
        clearTimeout(timer)

        if (!res.ok) continue

        const data = await res.json()
        const elements = data.elements || []

        if (elements.length > 0) {
          const results = elements.map(el => {
            const lat = el.lat || el.center?.lat
            const lng = el.lon || el.center?.lon
            if (!lat || !lng) return null
            return {
              id: el.id,
              name: el.tags?.name || el.tags?.['name:en'] || 'Medical Facility',
              address: [
                el.tags?.['addr:full'],
                el.tags?.['addr:street'],
                el.tags?.['addr:suburb'],
                el.tags?.['addr:city']
              ].filter(Boolean).join(', ') || 'Nearby location',
              phone: el.tags?.phone || el.tags?.['contact:phone'] || el.tags?.['contact:mobile'] || null,
              website: el.tags?.website || el.tags?.['contact:website'] || null,
              lat,
              lng,
            }
          }).filter(Boolean)

          setPlaces(results)
          toast.success(`Found ${results.length} ${PLACE_TYPES.find(t=>t.value===type)?.label || 'places'} nearby`)
          success = true
          break
        } else {
          // No results — try increasing radius to 10km
          const query2 = `[out:json][timeout:20];(node["amenity"="${amenity}"](around:10000,${location.lat},${location.lng});way["amenity"="${amenity}"](around:10000,${location.lat},${location.lng}););out center 15;`
          const res2 = await fetch(`${mirror}?data=${encodeURIComponent(query2)}`)
          const data2 = await res2.json()
          const elements2 = data2.elements || []

          if (elements2.length > 0) {
            const results2 = elements2.map(el => {
              const lat = el.lat || el.center?.lat
              const lng = el.lon || el.center?.lon
              if (!lat || !lng) return null
              return {
                id: el.id,
                name: el.tags?.name || 'Medical Facility',
                address: [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', ') || 'Nearby',
                phone: el.tags?.phone || null,
                lat, lng,
              }
            }).filter(Boolean)
            setPlaces(results2)
            toast.success(`Found ${results2.length} places within 10km`)
            success = true
          } else {
            toast('No places found nearby. Try the map view.', { icon: '🗺️' })
          }
          break
        }
      } catch (err) {
        // Try next mirror
        continue
      }
    }

    if (!success && !places.length) {
      toast('Could not load list. Use the map above to find places.', { icon: '🗺️' })
    }

    setLoading(false)
  }

  useEffect(() => { getUserLocation() }, [])

  useEffect(() => {
    if (userLocation) {
      updateMap(userLocation, activeType)
      searchNearby(userLocation, activeType)
    }
  }, [activeType])

  const getDistance = (lat, lng) => {
    if (!userLocation) return null
    const R = 6371
    const dLat = (lat - userLocation.lat) * Math.PI / 180
    const dLng = (lng - userLocation.lng) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`
  }

  const openDirections = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
  }

  const activeTypeData = PLACE_TYPES.find(t => t.value === activeType)

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MapPin size={20} className="text-white"/>
            </div>
            <div>
              <h1 className="text-lg font-extrabold">Nearby Hospitals</h1>
              <p className="text-blue-100 text-xs">Hospitals, Clinics & Pharmacies near you</p>
            </div>
          </div>
          <button onClick={getUserLocation} className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
            <RefreshCw size={14}/> Refresh
          </button>
        </div>

        {/* Type Selector */}
        <div className="flex gap-3 flex-wrap">
          {PLACE_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setActiveType(type.value)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium text-sm transition-all ${
                activeType === type.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              <span>{type.icon}</span> {type.label}
            </button>
          ))}
        </div>

        {/* Location Error */}
        {locationError && (
          <div className="card py-12 text-center">
            <MapPin size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-700 font-semibold">Location Access Required</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">Please allow location access to find nearby places</p>
            <button onClick={getUserLocation} className="btn-primary text-sm inline-flex items-center gap-2">
              <Navigation size={14} /> Allow Location
            </button>
          </div>
        )}

        {/* Google Maps Embed */}
        {mapUrl && (
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <iframe
              src={mapUrl}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Nearby Places Map"
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader size={28} className="text-blue-600 animate-spin" />
            <p className="text-gray-500 text-sm">Searching nearby {activeTypeData?.label}... (up to 10km)</p>
            <p className="text-xs text-gray-400">Using OpenStreetMap data</p>
          </div>
        )}

        {/* Places List */}
        {!loading && places.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">
              {places.length} {activeTypeData?.label} found nearby
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {places.map(place => (
                <div key={place.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-blue-200 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{place.name}</p>
                      <p className="text-gray-400 text-xs mt-1">{place.address}</p>
                      {place.phone && (
                        <p className="text-blue-600 text-xs mt-1 flex items-center gap-1">
                          <Phone size={10} /> {place.phone}
                        </p>
                      )}
                    </div>
                    <span className="text-2xl">{activeTypeData?.icon}</span>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-3">
                    <MapPin size={10} /> {getDistance(place.lat, place.lng)}
                  </span>
                  <button
                    onClick={() => openDirections(place.lat, place.lng)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium py-2 rounded-xl transition-colors"
                  >
                    <Navigation size={12} /> Get Directions
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default NearbyPlaces
