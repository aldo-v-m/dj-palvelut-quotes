import React from 'react'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'
import { getDaysUntilExpiry } from '../../utils/quoteId'

export default function QuoteExpiry({ expiryDate }) {
  const { t } = useTranslation()
  const days = getDaysUntilExpiry(expiryDate)

  if (!expiryDate) return null

  const color = days <= 1 ? 'text-red-400' : days <= 3 ? 'text-amber-400' : 'text-[var(--color-text-muted)]'

  return (
    <div className={`flex items-center gap-1.5 text-xs ${color}`}>
      <Clock size={12} />
      <span>
        {days === 0 ? t('quote.expired') : t('quote.expires_in', { days })}
      </span>
    </div>
  )
}
