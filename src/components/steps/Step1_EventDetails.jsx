import React, { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Heart, Briefcase, PartyPopper, Music, HelpCircle, Clock, MapPin, Navigation, Loader2 } from 'lucide-react'
import useQuoteStore from '../../store/quoteStore'
import { useAIRecommendation } from '../../hooks/useAIRecommendation'
import { useDistanceCalc } from '../../hooks/useDistanceCalc'
import usePricingStore from '../../store/pricingStore'
import DatePicker from '../ui/DatePicker'

const EVENT_TYPES = [
  { id: 'wedding', Icon: Heart, color: '#f43f5e' },
  { id: 'corporate', Icon: Briefcase, color: '#3b82f6' },
  { id: 'private', Icon: PartyPopper, color: '#a855f7' },
  { id: 'festival', Icon: Music, color: '#f59e0b' },
  { id: 'other', Icon: HelpCircle, color: '#6ee7b7' }
]

function calcHours(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let startMins = sh * 60 + sm
  let endMins = eh * 60 + em
  if (endMins <= startMins) endMins += 24 * 60
  return Math.round((endMins - startMins) / 60 * 4) / 4  // round to nearest 0.25h
}

export default function Step1_EventDetails() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { eventDetails, setEventDetails, location, setLocation, nextStep } = useQuoteStore()
  const { fetchRecommendation } = useAIRecommendation()
  const { getSuggestions, selectPlace } = useDistanceCalc()
  const pricing = usePricingStore((s) => s.pricing)
  const hidePricingDuringForm = usePricingStore((s) => s.hidePricingDuringForm)

  const [inputValue, setInputValue] = useState(location.address || '')
  const [suggestions, setSuggestions] = useState([])
  const [locLoading, setLocLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)

  const travelFee = location.distanceKm > pricing.travel.free_km
    ? Math.round((location.distanceKm - pricing.travel.free_km) * pricing.travel.rate_per_km_one_way * 2 * 100) / 100
    : 0

  const calculatedHours = calcHours(eventDetails.startTime, eventDetails.endTime)
  const hours = calculatedHours || eventDetails.durationHours

  const handleTimeChange = (field, value) => {
    const newDetails = { ...eventDetails, [field]: value }
    const calculated = calcHours(
      field === 'startTime' ? value : newDetails.startTime,
      field === 'endTime' ? value : newDetails.endTime
    )
    if (calculated > 0) {
      setEventDetails({ [field]: value, durationHours: calculated })
    } else {
      setEventDetails({ [field]: value })
    }
  }

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
    setLocLoading(true)
    debounceRef.current = setTimeout(async () => {
      const results = await getSuggestions(val)
      setSuggestions(results)
      setOpen(results.length > 0)
      setLocLoading(false)
    }, 300)
  }, [getSuggestions])

  const handleSelect = useCallback(async (suggestion) => {
    setInputValue(suggestion.display_name)
    setSuggestions([])
    setOpen(false)
    await selectPlace(suggestion)
  }, [selectPlace])

  const handleNext = () => {
    fetchRecommendation({
      eventType: eventDetails.eventType,
      durationHours: hours
    })
    nextStep()
  }

  const isValid = eventDetails.eventType && eventDetails.date && location.address

  return (
    <div className="px-3 py-5 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-1">
          {t('steps.1.title')}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">{t('steps.1.desc')}</p>
      </div>

      {/* Event type */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[var(--color-text-muted)]">
          {t('event.type_label')}
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {EVENT_TYPES.map(({ id, Icon, color }) => {
            const selected = eventDetails.eventType === id
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEventDetails({ eventType: id })}
                className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                style={{
                  backgroundColor: selected ? `${color}20` : 'var(--color-surface)',
                  border: selected ? `2px solid ${color}` : '1px solid var(--color-border)'
                }}
              >
                <Icon size={20} style={{ color: selected ? color : 'var(--color-text-muted)' }} />
                <span className="text-xs text-center leading-tight" style={{ color: selected ? color : 'var(--color-text-muted)' }}>
                  {t(`event.types.${id}`)}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Date */}
      <DatePicker
        label={t('event.date_label')}
        value={eventDetails.date || ''}
        onChange={(val) => setEventDetails({ date: val })}
      />

      {/* Start & End time */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[var(--color-text-muted)] flex items-center gap-2">
          <Clock size={14} />
          {t('event.time_label')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { field: 'startTime', label: t('event.start_time'), value: eventDetails.startTime },
            { field: 'endTime', label: t('event.end_time'), value: eventDetails.endTime }
          ].map(({ field, label, value }) => (
            <div key={field} className="space-y-1">
              <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
              <input
                type="time"
                value={value}
                onChange={(e) => handleTimeChange(field, e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-[var(--color-text)]"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: `1px solid ${value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  colorScheme: 'dark'
                }}
              />
            </div>
          ))}
        </div>
        {calculatedHours > 0 && (
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm"
            style={{ backgroundColor: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)' }}
          >
            <span className="text-[var(--color-text-muted)]">{t('event.duration_calculated')}</span>
            <span className="font-semibold text-[var(--color-accent)]">{calculatedHours}h</span>
          </div>
        )}
      </div>

      {/* Venue address */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text-muted)] flex items-center gap-2">
          <MapPin size={14} />
          {t('location.title')}
        </label>
        <div className="relative">
          <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" style={{ zIndex: 1 }} />
          {locLoading && (
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
        {location.address && location.distanceKm !== null && (
          <div className="flex flex-col gap-2">
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
              {!hidePricingDuringForm && location.distanceKm <= pricing.travel.out_of_range_km && (
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
              )}
            </div>
            {location.distanceKm > pricing.travel.out_of_range_km && (
              <div
                className="flex items-start gap-2 px-3 py-2 rounded-xl text-sm"
                style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}
              >
                🤝 {lang === 'fi'
                  ? 'Sijainti on yli 250 km — ohjaamme sinut lähimmälle kumppanillemme alueellasi.'
                  : 'Location is over 250 km — we will connect you with our nearest partner in your area.'}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleNext}
        disabled={!isValid}
        className="w-full py-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
        style={{ backgroundColor: isValid ? 'var(--color-accent)' : 'var(--color-border)', color: '#0a130c' }}
      >
        {t('common.next')}
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => { window.location.hash = 'quick' }}
          className="py-3.5 rounded-xl font-semibold text-sm transition-all"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          📞 {t('language.just_call_me')}
        </button>
        <a
          href={`https://wa.me/${import.meta.env.VITE_COMPANY_WHATSAPP || '358458844121'}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center py-3.5 rounded-xl font-semibold text-sm transition-all"
          style={{ backgroundColor: '#25D36620', border: '1px solid #25D36650', color: '#25D366' }}
        >
          💬 WhatsApp
        </a>
      </div>
    </div>
  )
}
