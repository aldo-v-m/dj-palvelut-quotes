import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp } from 'lucide-react'
import useQuoteStore from '../../store/quoteStore'
import AddonCheckbox from '../ui/AddonCheckbox'
import pricing from '../../config/pricing.json'
import services from '../../config/services.json'

const ACCORDION_COLORS = { dj: '#a855f7', audio: '#3b82f6', lighting: '#f59e0b', special_fx: '#f97316' }
const QUANTITY_ADDONS = ['wireless_mics', 'monitor_speakers', 'confetti_cannon']

export default function Step4_Customization() {
  const { t, i18n } = useTranslation()
  const { selectedServices, addons, addonQuantities, toggleAddon, setAddonQuantity, nextStep, prevStep } = useQuoteStore()
  const [open, setOpen] = useState(selectedServices[0] || null)
  const lang = i18n.language

  return (
    <div className="px-4 py-6 space-y-4 pb-24">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-1">
          {t('steps.4.title')}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">{t('steps.4.desc')}</p>
      </div>

      {selectedServices.map((serviceId) => {
        const svcDef = services.find((s) => s.id === serviceId)
        const svcPricing = pricing.services[serviceId]
        const color = ACCORDION_COLORS[serviceId] || '#e8c97e'
        const isOpen = open === serviceId
        const svcAddons = Object.keys(svcPricing?.addons || {})

        return (
          <div
            key={serviceId}
            className="rounded-2xl overflow-hidden"
            style={{
              border: `1px solid ${isOpen ? color + '66' : 'var(--color-border)'}`,
              backgroundColor: 'var(--color-surface)'
            }}
          >
            <button
              className="w-full flex items-center justify-between p-4"
              onClick={() => setOpen(isOpen ? null : serviceId)}
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-semibold text-[var(--color-text)]">
                  {lang === 'fi' ? svcDef?.name_fi : svcDef?.name_en}
                </span>
                {(addons[serviceId] || []).length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}22`, color }}>
                    +{(addons[serviceId] || []).length}
                  </span>
                )}
              </div>
              {isOpen
                ? <ChevronUp size={16} className="text-[var(--color-text-muted)]" />
                : <ChevronDown size={16} className="text-[var(--color-text-muted)]" />}
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-1 border-t border-[var(--color-border)]">
                <div className="pt-3" />
                {svcAddons.map((addonId) => {
                  const def = svcPricing.addons[addonId]
                  const checked = (addons[serviceId] || []).includes(addonId)
                  const qty = addonQuantities[`${serviceId}_${addonId}`] || 1
                  const showQty = QUANTITY_ADDONS.includes(addonId)
                  return (
                    <AddonCheckbox
                      key={addonId}
                      addonId={addonId}
                      label={t(`addons.${serviceId}.${addonId}`)}
                      description={t(`addons.${serviceId}.${addonId}_desc`)}
                      price={def.price}
                      per={def.per}
                      checked={checked}
                      onToggle={() => toggleAddon(serviceId, addonId)}
                      quantity={qty}
                      onQuantityChange={(q) => setAddonQuantity(serviceId, addonId, q)}
                      showQuantity={showQty}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <div className="flex gap-3">
        <button
          onClick={prevStep}
          className="flex-1 py-4 rounded-xl font-semibold text-sm border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          {t('common.back')}
        </button>
        <button
          onClick={nextStep}
          className="flex-[2] py-4 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: 'var(--color-accent)', color: '#0f0f11' }}
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  )
}
