import React from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Music, Speaker, Zap, Sparkles, Check } from 'lucide-react'
import usePricingStore from '../../store/pricingStore'
import useQuoteStore from '../../store/quoteStore'

const ICONS = { Music, Speaker, Zap, Sparkles }

function formatExtraHours(hours) {
  if (hours <= 0) return ''
  const h = Math.floor(hours)
  const mins = Math.round((hours - h) * 60)
  if (h === 0) return `${mins} min`
  if (mins === 0) return `${h}h`
  return `${h}h ${mins}min`
}

const COLOR_MAP = {
  purple: { border: '#a855f7', glow: 'rgba(168,85,247,0.15)' },
  blue: { border: '#3b82f6', glow: 'rgba(59,130,246,0.15)' },
  amber: { border: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
  coral: { border: '#f97316', glow: 'rgba(249,115,22,0.15)' }
}

export default function ServiceCard({ service, selected, onToggle }) {
  const { i18n, t } = useTranslation()
  const lang = i18n.language
  const Icon = ICONS[service.icon] || Music
  const colors = COLOR_MAP[service.color] || COLOR_MAP.purple
  const pricing = usePricingStore((s) => s.pricing)
  const basePrice = service.from_price || pricing.services[service.id]?.base_price || 0
  const durationHours = useQuoteStore((s) => s.eventDetails.durationHours) || 4

  // For DJ: show flat base + extra hours cost if duration exceeds included hours
  const djPricing = service.id === 'dj' ? pricing.services['dj'] : null
  const djExtraHours = djPricing ? Math.max(0, durationHours - djPricing.min_hours) : 0
  const djExtraCost = djExtraHours * (djPricing?.hourly_rate || 50)
  const djTotal = basePrice + djExtraCost

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onToggle}
      className="relative w-full text-left rounded-xl p-3.5 transition-all duration-200 cursor-pointer"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: selected ? `2px solid ${colors.border}` : '1px solid var(--color-border)',
        boxShadow: selected ? `0 0 16px ${colors.glow}` : 'none'
      }}
    >
      {selected && (
        <div
          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: colors.border }}
        >
          <Check size={11} className="text-white" />
        </div>
      )}
      {!selected && service.popular && (
        <span className="absolute top-2.5 right-2.5 text-xs px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-medium leading-none">
          {t('services.popular')}
        </span>
      )}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
        style={{ backgroundColor: `${colors.border}22` }}
      >
        <Icon size={16} style={{ color: colors.border }} />
      </div>
      <h3 className="font-semibold text-[var(--color-text)] text-sm mb-1 leading-tight pr-6">
        {lang === 'fi' ? service.name_fi : service.name_en}
      </h3>
      <p className={`text-xs text-[var(--color-text-muted)] mb-2 leading-relaxed ${selected ? '' : 'line-clamp-2'}`}>
        {lang === 'fi' ? service.desc_fi : service.desc_en}
      </p>
      <div className="text-xs font-semibold" style={{ color: colors.border }}>
        {service.id === 'dj' && djExtraHours > 0
          ? (lang === 'fi'
              ? `Alkaen €${basePrice} + €${Math.round(djExtraCost)} (${formatExtraHours(djExtraHours)}) = €${Math.round(djTotal)}`
              : `From €${basePrice} + €${Math.round(djExtraCost)} (${formatExtraHours(djExtraHours)}) = €${Math.round(djTotal)}`)
          : t('services.from_price', { price: basePrice })}
      </div>
    </motion.button>
  )
}
