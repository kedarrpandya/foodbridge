import { useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface LocationSelectorProps {
  lat: number | null
  lng: number | null
  onAddressChange: (address: string) => void
  onLocationChange: (lat: number, lng: number) => void
  onFieldsChange?: (fields: AddressFields) => void
}

interface AddressFields {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface AddressSuggestion {
  display_name: string
  lat: number
  lng: number
  address: {
    house_number?: string
    road?: string
    suburb?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
  }
}



// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function LocationSelector({ 
  lat, 
  lng, 
  onAddressChange, 
  onLocationChange,
  onFieldsChange
}: LocationSelectorProps) {

  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [mapKey, setMapKey] = useState(0) // For forcing map re-render
  const [streetSuggestions, setStreetSuggestions] = useState<AddressSuggestion[]>([])
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false)
  const debounceRef = useRef<number | undefined>(undefined)
  
  // Address fields state
  const [addressFields, setAddressFields] = useState<AddressFields>({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  })

  // Default location (San Francisco)
  const defaultLat = lat || 37.7749
  const defaultLng = lng || -122.4194

  // Update address when fields change
  const updateFullAddress = (fields: AddressFields) => {
    const fullAddress = [fields.street, fields.city, fields.state, fields.postalCode, fields.country]
      .filter(Boolean)
      .join(', ')
    onAddressChange(fullAddress)
    if (onFieldsChange) {
      onFieldsChange(fields)
    }
    
    // Geocode the address if we have enough information
    if (fields.street && fields.city) {
      geocodeAddress(fullAddress)
    }
  }

  // Search for street address suggestions with location bias
  const searchStreetSuggestions = async (streetInput: string, cityContext: string) => {
    if (streetInput.length < 3) {
      setStreetSuggestions([])
      setShowStreetSuggestions(false)
      return
    }

    try {
      // Build query with context for better relevance
      let query = streetInput
      if (cityContext) {
        query += `, ${cityContext}`
      }
      if (addressFields.state) {
        query += `, ${addressFields.state}`
      }
      if (addressFields.country) {
        query += `, ${addressFields.country}`
      }

      // Use viewbox to bias results to current location or user's area
      let viewboxParam = ''
      if (lat && lng) {
        // Create a bounding box around current location (roughly 20km radius)
        const offset = 0.2 // roughly 20km
        const left = lng - offset
        const top = lat + offset
        const right = lng + offset
        const bottom = lat - offset
        viewboxParam = `&viewbox=${left},${top},${right},${bottom}&bounded=1`
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}${viewboxParam}`
      )
      const data = await response.json()
      
      const suggestions: AddressSuggestion[] = data.map((item: any) => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        address: item.address || {}
      }))
      
      setStreetSuggestions(suggestions)
      setShowStreetSuggestions(true)
    } catch (error) {
      console.error('Street suggestions error:', error)
    }
  }

  // Handle individual field changes
  const handleFieldChange = (field: keyof AddressFields, value: string) => {
    const newFields = { ...addressFields, [field]: value }
    setAddressFields(newFields)
    updateFullAddress(newFields)

    // For street address, search for suggestions
    if (field === 'street') {
      // Debounce the search
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = window.setTimeout(() => {
        searchStreetSuggestions(value, newFields.city)
      }, 300)
    } else {
      // Hide suggestions when typing in other fields
      setShowStreetSuggestions(false)
    }
  }

  // Handle street suggestion selection
  const handleStreetSuggestionSelect = (suggestion: AddressSuggestion) => {
    const newFields: AddressFields = {
      street: suggestion.address.road || suggestion.address.house_number 
        ? `${suggestion.address.house_number || ''} ${suggestion.address.road || ''}`.trim()
        : addressFields.street,
      city: suggestion.address.city || suggestion.address.suburb || addressFields.city,
      state: suggestion.address.state || addressFields.state,
      postalCode: suggestion.address.postcode || addressFields.postalCode,
      country: suggestion.address.country || addressFields.country
    }

    setAddressFields(newFields)
    updateFullAddress(newFields)
    onLocationChange(suggestion.lat, suggestion.lng)
    setMapKey(prev => prev + 1)
    setShowStreetSuggestions(false)
  }

  // Geocoding function using OpenStreetMap Nominatim
  const geocodeAddress = async (query: string) => {
    if (query.length < 3) {
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`
      )
      const data = await response.json()
      
      if (data.length > 0) {
        const item = data[0]
        const newLat = parseFloat(item.lat)
        const newLng = parseFloat(item.lon)
        onLocationChange(newLat, newLng)
        setMapKey(prev => prev + 1) // Force map re-render
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
  }



  // Parse address description into fields
  const parseAddressFromDescription = (description: string) => {
    // This is a basic parser - could be improved
    const parts = description.split(', ')
    const newFields: AddressFields = {
      street: parts[0] || '',
      city: parts[1] || '',
      state: parts[2] || '',
      postalCode: parts[3] || '',
      country: parts[parts.length - 1] || ''
    }
    setAddressFields(newFields)
    if (onFieldsChange) {
      onFieldsChange(newFields)
    }
  }

  // Get current location
  const handleLocateMe = () => {
    setIsLoadingLocation(true)
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          onLocationChange(latitude, longitude)
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            )
            const data = await response.json()
            if (data.display_name) {
              onAddressChange(data.display_name)
              parseAddressFromDescription(data.display_name)
              setMapKey(prev => prev + 1) // Force map re-render
            }
          } catch (error) {
            console.error('Reverse geocoding error:', error)
          }
          
          setIsLoadingLocation(false)
        },
        (error) => {
          console.error('Geolocation error:', error)
          alert('Could not get your location. Please check your browser settings.')
          setIsLoadingLocation(false)
        }
      )
    } else {
      alert('Geolocation is not supported by this browser.')
      setIsLoadingLocation(false)
    }
  }

  // Handle map location selection
  const handleMapLocationSelect = async (selectedLat: number, selectedLng: number) => {
    onLocationChange(selectedLat, selectedLng)
    
    // Reverse geocode to get address
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedLat}&lon=${selectedLng}`
      )
      const data = await response.json()
      if (data.display_name) {
        onAddressChange(data.display_name)
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Location</label>
        {/* Locate Me Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLoadingLocation}
          className="bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800 disabled:bg-gray-400"
        >
          {isLoadingLocation ? 'Locating…' : '📍 Use My Location'}
        </button>
      </div>

      {/* Address Fields */}
      <div className="space-y-2">
        <div className="relative">
          <label className="block text-sm font-medium mb-0.5">Street Address *</label>
          <input
            type="text"
            value={addressFields.street}
            onChange={(e) => handleFieldChange('street', e.target.value)}
            onFocus={() => {
              if (streetSuggestions.length > 0) {
                setShowStreetSuggestions(true)
              }
            }}
            onBlur={() => {
              // Delay hiding to allow click on suggestions
              setTimeout(() => setShowStreetSuggestions(false), 200)
            }}
            placeholder="123 Main Street"
            className="border p-1.5 w-full text-sm"
          />
          
          {/* Street Address Suggestions */}
          {showStreetSuggestions && streetSuggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg max-h-32 overflow-y-auto mt-0.5">
              {streetSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleStreetSuggestionSelect(suggestion)}
                  className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-xs text-gray-800">
                    {suggestion.address.house_number && suggestion.address.road 
                      ? `${suggestion.address.house_number} ${suggestion.address.road}`
                      : suggestion.address.road || 'Street'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {[suggestion.address.city || suggestion.address.suburb, 
                      suggestion.address.state, 
                      suggestion.address.country].filter(Boolean).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-0.5">City *</label>
            <input
              type="text"
              value={addressFields.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              placeholder="San Francisco"
              className="border p-1.5 w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-0.5">Province/State</label>
            <input
              type="text"
              value={addressFields.state}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              placeholder="CA"
              className="border p-1.5 w-full text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-0.5">Postal Code</label>
            <input
              type="text"
              value={addressFields.postalCode}
              onChange={(e) => handleFieldChange('postalCode', e.target.value)}
              placeholder="94102"
              className="border p-1.5 w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-0.5">Country</label>
            <input
              type="text"
              value={addressFields.country}
              onChange={(e) => handleFieldChange('country', e.target.value)}
              placeholder="United States"
              className="border p-1.5 w-full text-sm"
            />
          </div>
        </div>
      </div>

      {/* Coordinates Display */}
      {lat && lng && (
        <div className="text-xs text-gray-500">
          📍 {lat.toFixed(4)}, {lng.toFixed(4)}
        </div>
      )}

      {/* Compact Interactive Map */}
      <div className="border rounded-lg overflow-hidden" style={{ height: '150px' }}>
        <MapContainer
          key={mapKey} // Force re-render when location changes
          center={[lat || defaultLat, lng || defaultLng]}
          zoom={lat && lng ? 15 : 13} // Zoom in more when we have a specific location
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {lat && lng && <Marker position={[lat, lng]} />}
          <MapClickHandler onLocationSelect={handleMapLocationSelect} />
        </MapContainer>
        <div className="text-xs text-gray-500 p-1 bg-gray-50">
          💡 Updates as you type • Click to select location
        </div>
      </div>
    </div>
  )
}
