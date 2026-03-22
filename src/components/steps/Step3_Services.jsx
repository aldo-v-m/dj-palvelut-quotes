import React from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Tag } from 'lucide-react'
import useQuoteStore from '../../store/quoteStore'
import ServiceCard from '../ui/ServiceCard'
import AIRecommendationBanner from '../ui/AIRecommendationBanner'
import services from '../../config/services.json'
import usePricingStore from '../../store/pricingStore'

export default function Step3_Services() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { selectedServices, toggleService, setSelectedServices, nextStep, prevStep } = useQuoteStore()
  const aiRecommendation = useQuoteStore((s) => s.aiRecommendation)
  const pricing = usePricingStore((s) => s.pricing)

  const baseTotal = selectedServices.reduce((sum, id) => {
    const svc = services.find((s) => s.id === id)
    return sum + (svc?.from_price || pricing.services[id]?.base_price || 0)
  }, 0)

  const count = selectedServices.length
  const pd = pricing.package_discounts

  // Current discount
  let discountRate = 0
  if (count >= 4) discountRate = pd.four_services
  else if (count === 3) discountRate = pd.three_services
  else if (count === 2) discountRate = pd.two_services
  const discountAmount = Math.round(baseTotal * discountRate * 100) / 100

  // Max possible savings (all 4 packages at 20%)
  const allServicesTotal = services.reduce((sum, svc) => sum + (svc.from_price || pricing.services[svc.id]?.base_price || 0), 0)
  const maxSaving = Math.round(allServicesTotal * pd.four_services * 100) / 100

  // Next tier upsell — project savings using current total + cheapest unselected service
  const unselected = services.filter((s) => !selectedServices.includes(s.id))
  const cheapestUnselected = unselected.length > 0 ? Math.min(...unselected.map((s) => s.from_price || 0)) : 0

  let nextRate = 0
  let nextLabel = ''
  if (count === 1) { nextRate = pd.two_services; nextLabel = lang === 'fi' ? '2. palvelu' : 'a 2nd package' }
  else if (count === 2) { nextRate = pd.three_services; nextLabel = lang === 'fi' ? '3. palvelu' : 'a 3rd package' }
  else if (count === 3) { nextRate = pd.four_services; nextLabel = lang === 'fi' ? '4. palvelu' : 'a 4th package' }
  const projectedTotal = baseTotal + cheapestUnselected
  const nextSaving = nextRate > 0 ? Math.round(projectedTotal * nextRate * 100) / 100 : 0
  const extraSaving = Math.round((nextSaving - discountAmount) * 100) / 100

  const handleApplyRecommendation = () => {
    if (aiRecommendation?.services) setSelectedServices(aiRecommendation.services)
  }

  return (
    <div className="px-3 py-5 space-y-4 pb-24">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text)] mb-1">{t('steps.3.title')}</h2>
        <p className="text-sm text-[var(--color-text-muted)]">{t('steps.3.desc')}</p>
      </div>

      <AIRecommendationBanner onApply={handleApplyRecommendation} />

      <div className="grid grid-cols-2 gap-2">
        {services.map((svc) => (
          <ServiceCard
            key={svc.id}
            service={svc}
            selected={selectedServices.includes(svc.id)}
            onToggle={() => toggleService(svc.id)}
          />
        ))}
      </div>

      {/* Active discount banner — gold for partial, green for max */}
      {discountRate > 0 && (
        <div
          className="rounded-xl p-4 space-y-1"
          style={{
            backgroundColor: count >= 4 ? '#22c55e' : '#e8b84b',
            border: `2px solid ${count >= 4 ? '#16a34a' : '#c9963a'}`
          }}
        >
          <div className="flex items-center gap-2">
            <Tag size={15} style={{ color: '#0f1f10' }} className="shrink-0" />
            <span className="font-bold text-sm" style={{ color: '#0f1f10' }}>
              {count >= 4
                ? (lang === 'fi' ? '🎉 Maksimialennus 15% — erinomainen valinta!' : '🎉 Maximum 15% discount — excellent choice!')
                : count === 3
                ? (lang === 'fi' ? '10% pakettialennus aktiivinen' : '10% package discount active')
                : (lang === 'fi' ? '5% pakettialennus aktiivinen' : '5% package discount active')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm pl-5">
            <span style={{ color: '#0f1f10', fontWeight: 600 }}>
              {lang === 'fi' ? 'Säästät' : 'You save'}
            </span>
            <span className="font-bold text-base" style={{ color: '#0f1f10' }}>
              −€{discountAmount.toFixed(0)}
            </span>
          </div>
        </div>
      )}

      {/* Upsell — green highlight to drive upgrades */}
      {count >= 1 && count < 4 && (
        <div
          className="flex items-start gap-2.5 p-3 rounded-xl text-sm"
          style={{ backgroundColor: 'rgba(110,231,183,0.12)', border: '1.5px solid rgba(110,231,183,0.5)' }}
        >
          <Sparkles size={15} style={{ color: '#6ee7b7' }} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold" style={{ color: '#6ee7b7' }}>
              {lang === 'fi'
                ? `💚 Lisää ${nextLabel} ja säästä €${nextSaving.toFixed(0)}${extraSaving > 0 ? ` (€${extraSaving.toFixed(0)} enemmän)` : ''}!`
                : `💚 Add ${nextLabel} and save €${nextSaving.toFixed(0)}${extraSaving > 0 ? ` (€${extraSaving.toFixed(0)} more)` : ''}!`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(110,231,183,0.75)' }}>
              {lang === 'fi'
                ? `Kaikki 4 palvelua → säästä jopa €${maxSaving.toFixed(0)} (15% alennus)`
                : `All 4 packages → save up to €${maxSaving.toFixed(0)} (15% off)`}
            </p>
          </div>
        </div>
      )}

      {/* Running total */}
      {count > 0 && (
        <div
          className="p-3 rounded-xl text-sm space-y-1.5"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-text-muted)]">
              {t('services.running_total', { count, price: baseTotal })}
            </span>
            <span className={`font-semibold ${discountRate > 0 ? 'line-through opacity-50 text-[var(--color-text-muted)]' : 'text-[var(--color-accent)]'}`}>
              €{baseTotal}
            </span>
          </div>
          {discountRate > 0 && (
            <div className="flex items-center justify-between font-bold">
              <span style={{ color: 'var(--color-accent)' }}>{lang === 'fi' ? 'Alennettu hinta' : 'After discount'}</span>
              <span style={{ color: 'var(--color-accent)' }}>€{(baseTotal - discountAmount).toFixed(0)}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={prevStep}
          className="flex-1 py-3.5 rounded-xl font-semibold text-sm border border-[var(--color-border)] text-[var(--color-text-muted)]"
        >
          {t('common.back')}
        </button>
        <button
          onClick={nextStep}
          disabled={count === 0}
          className="flex-[2] py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
          style={{ backgroundColor: 'var(--color-accent)', color: '#0f0f11' }}
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  )
}
