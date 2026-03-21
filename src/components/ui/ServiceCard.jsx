import React from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Music, Speaker, Zap, Sparkles, Check } from 'lucide-react'
import pricing from '../../config/pricing.json'

const ICONS = { Music, Speaker, Zap, Sparkles }

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
  const basePrice = service.from_price || pricing.services[service.id]?.base_price || 0

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      className="relative w-full text-left rounded-2xl p-5 transition-all duration-200 cursor-pointer"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: selected ? `2px solid ${colors.border}` : '1px solid var(--color-border)',
        boxShadow: selected ? `0 0 20px ${colors.glow}` : 'none'
      }}
    >
      {service.popular && (
        <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-medium">
          {t('services.popular')}
        </span>
      )}
      {selected && (
        <div
          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: colors.border }}
        >
          <Check size={14} className="text-white" />
        </div>
      )}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${colors.border}22` }}
      >
        <Icon size={20} style={{ color: colors.border }} />
      </div>
      <h3 className="font-semibold text-[var(--color-text)] mb-1">
        {lang === 'fi' ? service.name_fi : service.name_en}
      </h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-3 leading-relaxed">
        {lang === 'fi' ? service.desc_fi : service.desc_en}
      </p>
      <div className="text-sm font-medium" style={{ color: colors.border }}>
        {t('services.from_price', { price: basePrice })}
      </div>
    </motion.button>
  )
}
