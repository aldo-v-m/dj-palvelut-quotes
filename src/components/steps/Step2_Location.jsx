import React, { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import useQuoteStore from '../../store/quoteStore'
import { useDistanceCalc } from '../../hooks/useDistanceCalc'
import usePricingStore from '../../store/pricingStore'

export default function Step2_Location() {
  const { t } = useTranslation()
  const { location, nextStep, prevStep, setLocation } = useQuoteStore()
  const { getSuggestions, selectPlace } = useDistanceCalc()
  const pricing = usePricingStore((s) => s.pricing)
  const [inputValue, setInputValue] = useState(location.address || '')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)

  const travelFee = location.distanceKm > pricing.travel.free_km
    ? Math.round((location.distanceKm - pricing.travel.free_km) * pricing.travel.rate_per_km_one_way * 2 * 100) / 100
    : 0

  const handleInput = useCallback((e) => {
    const val = e.target.value
    setInputValue(val)
    clearTimeout(debounceRef.current)
    if (val.length < 2) {
      setSuggestions([])
      setOpen(false)
      if (val.length === 0) setLocation({ address: '', lat: null, lng: null, distanceKm: null, durationMinutes: null })
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const results = await getSuggestions(val)
      setSuggestions(results)
      setOpen(results.length > 0)
      setLoading(false)
    }, 300)
  }, [getSuggestions])

  const handleSelect = useCallback(async (suggestion) => {
    setInputValue(suggestion.display_name)
    setSuggestions([])
    setOpen(false)
    await selectPlace(suggestion)
  }, [selectPlace])

  return (
    <div className="px-3 py-5 space-y-4 pb-24">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-1">
          {t('steps.2.title')}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">{t('steps.2.desc')}</p>
      </div>

      <div className="relative">
        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" style={{ zIndex: 1 }} />
        {loading && (
          <Loader2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[var(--color-text-muted)]" />
        )}
        <input
          type="text"
          value={inputValue}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={t('location.placeholder')}
          autoComplete="off"
          className="w-full pl-10 pr-4 py-3 rounded-xl text-[var(--color-text)] text-sm placeholder-[var(--color-text-muted)]"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        />
        {open && suggestions.length > 0 && (
          <ul
            className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-xl"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', zIndex: 9999 }}
          >
            {suggestions.map((s, i) => {
              const parts = s.display_name.split(',')
              const mainText = parts[0]
              const secondaryText = parts.slice(1, 3).join(',').trim()
              return (
                <li
                  key={s.place_id || i}
                  onMouseDown={() => handleSelect(s)}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 text-sm"
                >
                  <MapPin size={14} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
                  <div>
                    <span className="text-[var(--color-text)]">{mainText}</span>
                    <span className="block text-xs text-[var(--color-text-muted)]">{secondaryText}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {location.address && (
        <div className="space-y-3">
          {location.distanceKm !== null && (
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <Navigation size={13} className="text-[var(--color-accent)]" />
                <span className="text-[var(--color-text-muted)]">
                  {t('location.distance_chip', { km: location.distanceKm })}
                </span>
              </div>
              <div
                className="px-3 py-1.5 rounded-full text-sm"
                style={{
                  backgroundColor: travelFee > 0 ? 'rgba(232,201,126,0.1)' : 'rgba(110,231,183,0.1)',
                  border: `1px solid ${travelFee > 0 ? 'rgba(232,201,126,0.3)' : 'rgba(110,231,183,0.3)'}`,
                  color: travelFee > 0 ? 'var(--color-accent)' : 'var(--color-success)'
                }}
              >
                {travelFee > 0
                  ? t('location.travel_fee', { fee: travelFee.toFixed(2) })
                  : t('location.free_travel')}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={prevStep}
          className="flex-1 py-4 rounded-xl font-semibold text-sm border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          {t('common.back')}
        </button>
        <button
          onClick={nextStep}
          className="flex-[2] py-4 rounded-xl font-semibold text-sm transition-all"
          style={{ backgroundColor: 'var(--color-accent)', color: '#0f0f11' }}
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  )
}
