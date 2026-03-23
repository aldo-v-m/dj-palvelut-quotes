import React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuoteCalculator } from '../../hooks/useQuoteCalculator'
import useQuoteStore from '../../store/quoteStore'

export default function StickyQuoteSummary() {
  const { t } = useTranslation()
  const currentStep = useQuoteStore((s) => s.currentStep)
  const selectedServices = useQuoteStore((s) => s.selectedServices)
  const quote = useQuoteCalculator()

  if (currentStep < 3 || currentStep === 6) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)]"
      style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(15,15,17,0.85)' }}
    >
      <div className="max-w-[680px] mx-auto px-3 py-2.5 flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-muted)]">
          {selectedServices.length > 0
            ? t('services.running_total', { count: selectedServices.length, price: quote.total.toFixed(2) })
            : t('services.title')}
        </span>
        <div className="text-right">
          <div className="text-lg font-bold text-[var(--color-accent)]">
            €{quote.total.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}
