import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Heart, Briefcase, PartyPopper, Music, HelpCircle, Plus, Minus } from 'lucide-react'
import useQuoteStore from '../../store/quoteStore'
import { useAIRecommendation } from '../../hooks/useAIRecommendation'
import DatePicker from '../ui/DatePicker'
import DurationSlider from '../ui/DurationSlider'

const EVENT_TYPES = [
  { id: 'wedding', Icon: Heart, color: '#f43f5e' },
  { id: 'corporate', Icon: Briefcase, color: '#3b82f6' },
  { id: 'private', Icon: PartyPopper, color: '#a855f7' },
  { id: 'festival', Icon: Music, color: '#f59e0b' },
  { id: 'other', Icon: HelpCircle, color: '#6ee7b7' }
]

export default function Step1_EventDetails() {
  const { t } = useTranslation()
  const { eventDetails, setEventDetails, nextStep } = useQuoteStore()
  const { fetchRecommendation } = useAIRecommendation()

  const handleNext = () => {
    fetchRecommendation({
      eventType: eventDetails.eventType,
      guestCount: eventDetails.guestCount,
      durationHours: eventDetails.durationHours
    })
    nextStep()
  }

  const isValid = eventDetails.eventType && eventDetails.date

  return (
    <div className="px-4 py-6 space-y-7 pb-24">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-1">
          {t('steps.1.title')}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">{t('steps.1.desc')}</p>
      </div>

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

      <DatePicker
        label={t('event.date_label')}
        value={eventDetails.date || ''}
        onChange={(val) => setEventDetails({ date: val })}
      />

      <DurationSlider
        label={t('event.duration_label')}
        value={eventDetails.durationHours}
        onChange={(val) => setEventDetails({ durationHours: val })}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text-muted)]">
          {t('event.guests_label')}
        </label>
        <div className="flex items-center gap-3">
          <button
            className="w-10 h-10 rounded-xl border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-accent)] text-[var(--color-text-muted)]"
            onClick={() => setEventDetails({ guestCount: Math.max(10, eventDetails.guestCount - 10) })}
          >
            <Minus size={16} />
          </button>
          <input
            type="number"
            min={10}
            max={2000}
            value={eventDetails.guestCount}
            onChange={(e) => setEventDetails({ guestCount: Math.max(10, Math.min(2000, parseInt(e.target.value) || 10)) })}
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
        style={{ backgroundColor: isValid ? 'var(--color-accent)' : 'var(--color-border)', color: '#0f0f11' }}
      >
        {t('common.next')}
      </button>
    </div>
  )
}
