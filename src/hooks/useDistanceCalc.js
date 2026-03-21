import { useRef, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import useQuoteStore from '../store/quoteStore'

const HQ_LAT = parseFloat(import.meta.env.VITE_HQ_LAT || 60.1699)
const HQ_LNG = parseFloat(import.meta.env.VITE_HQ_LNG || 24.9384)

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

let loaderInstance = null
function getLoader() {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly'
    })
  }
  return loaderInstance
}

async function resolveDistance(lat, lng, setLocation) {
  try {
    const service = new window.google.maps.DistanceMatrixService()
    const response = await new Promise((resolve, reject) => {
      service.getDistanceMatrix({
        origins: [{ lat: HQ_LAT, lng: HQ_LNG }],
        destinations: [{ lat, lng }],
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (res, status) => {
        if (status === 'OK') resolve(res)
        else reject(status)
      })
    })
    const element = response.rows[0]?.elements[0]
    if (element && element.status === 'OK') {
      setLocation({
        distanceKm: Math.round(element.distance.value / 1000),
        durationMinutes: Math.round(element.duration.value / 60)
      })
    } else {
      throw new Error('No result')
    }
  } catch {
    const km = haversineKm(HQ_LAT, HQ_LNG, lat, lng) * 1.3
    setLocation({ distanceKm: Math.round(km) })
  }
}

export function useDistanceCalc() {
  const sessionTokenRef = useRef(null)
  const placesLibRef = useRef(null)
  const setLocation = useQuoteStore((s) => s.setLocation)

  const loadPlaces = useCallback(async () => {
    if (placesLibRef.current) return placesLibRef.current
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) return null
    try {
      const places = await getLoader().importLibrary('places')
      placesLibRef.current = places
      return places
    } catch (err) {
      console.error('Failed to load Places library:', err)
      return null
    }
  }, [])

  const getSuggestions = useCallback(async (input) => {
    if (!input || input.length < 2) return []
    const places = await loadPlaces()
    if (!places) return []
    try {
      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new places.AutocompleteSessionToken()
      }
      const svc = new places.AutocompleteService()
      const result = await new Promise((resolve) => {
        svc.getPlacePredictions(
          { input, sessionToken: sessionTokenRef.current, componentRestrictions: { country: 'fi' } },
          (predictions, status) => resolve(status === 'OK' ? (predictions || []) : [])
        )
      })
      return result
    } catch {
      return []
    }
  }, [loadPlaces])

  const selectPlace = useCallback(async (placeId, description) => {
    const places = await loadPlaces()
    if (!places) return
    try {
      const mapDiv = document.createElement('div')
      const svc = new places.PlacesService(mapDiv)
      const place = await new Promise((resolve, reject) => {
        svc.getDetails(
          { placeId, fields: ['geometry', 'formatted_address'], sessionToken: sessionTokenRef.current },
          (result, status) => status === 'OK' ? resolve(result) : reject(status)
        )
      })
      sessionTokenRef.current = null
      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      setLocation({ address: place.formatted_address || description, placeId, lat, lng, distanceKm: null, durationMinutes: null })
      resolveDistance(lat, lng, setLocation)
    } catch (err) {
      console.error('Place details failed:', err)
    }
  }, [loadPlaces, setLocation])

  return { getSuggestions, selectPlace }
}
