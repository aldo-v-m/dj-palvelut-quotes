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
      version: 'weekly',
      libraries: ['places', 'geometry']
    })
  }
  return loaderInstance
}

export function useDistanceCalc() {
  const autocompleteRef = useRef(null)
  const setLocation = useQuoteStore((s) => s.setLocation)

  const initAutocomplete = useCallback(async (inputElement) => {
    if (!inputElement) return
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.warn('Google Maps API key not set — autocomplete disabled')
      return
    }

    try {
      const loader = getLoader()
      await loader.load()

      const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
        fields: ['geometry', 'formatted_address', 'place_id'],
        componentRestrictions: { country: ['fi'] }
      })

      autocomplete.addListener('place_changed', async () => {
        const place = autocomplete.getPlace()
        if (!place.geometry) return

        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()

        setLocation({
          address: place.formatted_address || inputElement.value,
          placeId: place.place_id || '',
          lat,
          lng,
          distanceKm: null,
          durationMinutes: null
        })

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
      })

      autocompleteRef.current = autocomplete
    } catch (err) {
      console.error('Failed to load Google Maps:', err)
    }
  }, [setLocation])

  return { initAutocomplete }
}
