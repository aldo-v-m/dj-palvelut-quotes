import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Heart, Briefcase, PartyPopper, Music, HelpCircle, Plus, Minus, Clock } from 'lucide-react'
import useQuoteStore from '../../store/quoteStore'
import { useAIRecommendation } from '../../hooks/useAIRecommendation'
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
  const { t } = useTranslation()
  const { eventDetails, setEventDetails, nextStep } = useQuoteStore()
  const { fetchRecommendation } = useAIRecommendation()

  const hours = calcHours(eventDetails.startTime, eventDetails.endTime) || eventDetails.durationHours

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

  const handleNext = () => {
    fetchRecommendation({
      eventType: eventDetails.eventType,
      guestCount: eventDetails.guestCount,
      durationHours: hours
    })
    nextStep()
  }

  const isValid = eventDetails.eventType && eventDetails.date

  return (
    <div className="px-3 py-5 space-y-5 pb-24">
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
        {hours > 0 && (
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm"
            style={{ backgroundColor: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)' }}
          >
            <span className="text-[var(--color-text-muted)]">{t('event.duration_calculated')}</span>
            <span className="font-semibold text-[var(--color-accent)]">{hours}h</span>
          </div>
        )}
      </div>

      {/* Guest count */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text-muted)]">
          {t('event.guests_label')}
        </label>
        <div className="flex items-center gap-3">
          <button
            className="w-10 h-10 rounded-xl border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-accent)] text-[var(--color-text-muted)]"
            onClick={() => setEventDetails({ guestCount: Math.max(1, eventDetails.guestCount - 10) })}
          >
            <Minus size={16} />
          </button>
          <input
            type="number"
            min={1}
            max={2000}
            value={eventDetails.guestCount}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              if (!isNaN(val) && val > 0) setEventDetails({ guestCount: Math.min(2000, val) })
            }}
            onBlur={(e) => {
              const val = parseInt(e.target.value)
              if (isNaN(val) || val < 1) setEventDetails({ guestCount: 1 })
            }}
            className="flex-1 px-4 py-3 rounded-xl text-center text-[var(--color-text)] font-semibold"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          />
          <button
            className="w-10 h-10 rounded-xl border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-accent)] text-[var(--color-text-muted)]"
            onClick={() => setEventDetails({ guestCount: Math.min(2000, eventDetails.guestCount + 10) })}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Venue name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text-muted)]">
          {t('event.venue_label')} <span className="text-xs">({t('common.optional')})</span>
        </label>
        <input
          type="text"
          value={eventDetails.venueName}
          onChange={(e) => setEventDetails({ venueName: e.target.value })}
          placeholder={t('event.venue_placeholder')}
          className="w-full px-4 py-3 rounded-xl text-[var(--color-text)] text-sm placeholder-[var(--color-text-muted)]"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        />
      </div>

      <button
        onClick={handleNext}
        disabled={!isValid}
        className="w-full py-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
        style={{ backgroundColor: isValid ? 'var(--color-accent)' : 'var(--color-border)', color: '#0a130c' }}
      >
        {t('common.next')}
      </button>
    </div>
  )
}
