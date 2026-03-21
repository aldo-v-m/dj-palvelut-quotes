import React from 'react'
import { useTranslation } from 'react-i18next'
import useQuoteStore from '../../store/quoteStore'
import ServiceCard from '../ui/ServiceCard'
import AIRecommendationBanner from '../ui/AIRecommendationBanner'
import services from '../../config/services.json'
import pricing from '../../config/pricing.json'

export default function Step3_Services() {
  const { t } = useTranslation()
  const { selectedServices, toggleService, setSelectedServices, nextStep, prevStep } = useQuoteStore()
  const aiRecommendation = useQuoteStore((s) => s.aiRecommendation)

  const baseTotal = selectedServices.reduce((sum, id) => {
    return sum + (pricing.services[id]?.base_price || 0)
  }, 0)

  const handleApplyRecommendation = () => {
    if (aiRecommendation?.services) {
      setSelectedServices(aiRecommendation.services)
    }
  }

  return (
    <div className="px-4 py-6 space-y-5 pb-24">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-1">
          {t('steps.3.title')}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">{t('steps.3.desc')}</p>
      </div>

      <AIRecommendationBanner onApply={handleApplyRecommendation} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {services.map((svc) => (
          <ServiceCard
            key={svc.id}
            service={svc}
            selected={selectedServices.includes(svc.id)}
            onToggle={() => toggleService(svc.id)}
          />
        ))}
      </div>

      {selectedServices.length > 0 && (
        <div
          className="flex items-center justify-between p-3 rounded-xl text-sm"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <span className="text-[var(--color-text-muted)]">
            {t('services.running_total', { count: selectedServices.length, price: baseTotal })}
          </span>
          <span className="font-semibold text-[var(--color-accent)]">€{baseTotal}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={prevStep}
          className="flex-1 py-4 rounded-xl font-semibold text-sm border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          {t('common.back')}
        </button>
        <button
          onClick={nextStep}
          disabled={selectedServices.length === 0}
          className="flex-[2] py-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
          style={{ backgroundColor: 'var(--color-accent)', color: '#0f0f11' }}
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  )
}
