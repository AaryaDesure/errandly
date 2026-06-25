import { useState, useEffect, useRef } from 'react'

function LocationInput({ value, onChange }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [show, setShow] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=in`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        setSuggestions(data)
        setShow(true)
      } catch (err) {
        setSuggestions([])
      }
    }, 500)
  }, [query])

  const handleSelect = (place) => {
    const label = place.display_name.split(',').slice(0, 3).join(',').trim()
    setQuery(label)
    onChange(label)
    setSuggestions([])
    setShow(false)
  }

  const handleChange = (e) => {
    setQuery(e.target.value)
    onChange(e.target.value)
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Location (e.g. Bandra, Mumbai)"
        value={query}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        required
        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {show && suggestions.length > 0 && (
        <ul className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-md w-full mt-1 max-h-48 overflow-y-auto">
          {suggestions.map((place) => (
            <li
              key={place.place_id}
              onMouseDown={() => handleSelect(place)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer flex items-start gap-2">
              <span className="mt-0.5">📍</span>
              <span>{place.display_name.split(',').slice(0, 3).join(',')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default LocationInput