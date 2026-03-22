import { useCallback } from 'react'
import useQuoteStore from '../store/quoteStore'

// HQ: Saunarinne 3, 02230 Espoo
const HQ_LAT = parseFloat(import.meta.env.VITE_HQ_LAT || 60.1810)
const HQ_LNG = parseFloat(import.meta.env.VITE_HQ_LNG || 24.7780)

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function useDistanceCalc() {
  const setLocation = useQuoteStore((s) => s.setLocation)

  const getSuggestions = useCallback(async (input) => {
    if (!input || input.length < 2) return []
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&countrycodes=fi&format=json&addressdetails=1&limit=6`
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'fi,en', 'User-Agent': 'EventQuoteApp/1.0' }
      })
      if (!res.ok) return []
      const data = await res.json()
      return data
    } catch {
      return []
    }
  }, [])

  const selectPlace = useCallback(async (place) => {
    const lat = parseFloat(place.lat)
    const lng = parseFloat(place.lon)
    const address = place.display_name
    const distanceKm = Math.round(haversineKm(HQ_LAT, HQ_LNG, lat, lng) * 1.3)
    setLocation({ address, lat, lng, distanceKm, durationMinutes: null })
  }, [setLocation])

  return { getSuggestions, selectPlace }
}
