import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Share2, Check } from 'lucide-react'
import useQuoteStore from '../../store/quoteStore'
import { useQuoteCalculator } from '../../hooks/useQuoteCalculator'
import QuoteLineItem from '../ui/QuoteLineItem'
import QuoteExpiry from '../ui/QuoteExpiry'
import { generateQuoteId, getQuoteExpiry } from '../../utils/quoteId'
import { exportQuotePDF } from '../../utils/pdfExport'
import services from '../../config/services.json'

export default function Step5_Quote() {
  const { t, i18n } = useTranslation()
  const store = useQuoteStore()
  const quote = useQuoteCalculator()
  const [copied, setCopied] = useState(false)
  const lang = i18n.language

  useEffect(() => {
    if (!store.quoteId) {
      store.setQuoteId(generateQuoteId())
      store.setQuoteExpiry(getQuoteExpiry().toISOString())
    }
  }, [])

  const handleShare = () => {
    const state = store.getSerializableState()
    const encoded = btoa(JSON.stringify(state))
    const url = `${window.location.href.split('#')[0]}#${encoded}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const fmt = (amount) => {
    const val = store.showVatIncluded ? amount : amount / (1 + 0.135)
    return `€${val.toFixed(2)}`
  }

  return (
    <div className="px-4 py-6 space-y-5 pb-24">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">
            {t('quote.title')}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">{t('steps.5.desc')}</p>
        </div>
        <QuoteExpiry expiryDate={store.quoteExpiry} />
      </div>

      <div
        id="quote-print"
        className="rounded-2xl p-5 space-y-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="text-lg font-bold text-[var(--color-accent)]">
              {import.meta.env.VITE_COMPANY_NAME || t('quote.company_placeholder')}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">
              {t('quote.id_label')}: <span className="text-[var(--color-accent)] font-mono">{store.quoteId}</span>
            </div>
          </div>
          <div className="text-right text-xs text-[var(--color-text-muted)]">
            <div>{new Date().toLocaleDateString(lang === 'fi' ? 'fi-FI' : 'en-GB')}</div>
            {store.quoteExpiry && (
              <div>{t('quote.valid_until')}: {new Date(store.quoteExpiry).toLocaleDateString(lang === 'fi' ? 'fi-FI' : 'en-GB')}</div>
            )}
          </div>
        </div>

        {/* Event summary */}
        <div className="rounded-xl p-3 space-y-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <div className="text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
            {t('quote.event_summary')}
          </div>
          {store.eventDetails.date && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">Date</span>
              <span className="text-[var(--color-text)]">{new Date(store.eventDetails.date).toLocaleDateString(lang === 'fi' ? 'fi-FI' : 'en-GB')}</span>
            </div>
          )}
          {store.eventDetails.eventType && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">Type</span>
              <span className="text-[var(--color-text)] capitalize">{store.eventDetails.eventType}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">Duration</span>
            <span className="text-[var(--color-text)]">{store.eventDetails.durationHours}h</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">Guests</span>
            <span className="text-[var(--color-text)]">{store.eventDetails.guestCount}</span>
          </div>
          {store.location.address && (
            <div className="flex justify-between text-sm gap-4">
              <span className="text-[var(--color-text-muted)] flex-shrink-0">Venue</span>
              <span className="text-[var(--color-text)] text-right truncate">{store.location.address}</span>
            </div>
          )}
        </div>

        {/* Line items */}
        <div>
          <div className="text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
            {t('quote.line_items')}
          </div>
          {quote.lineItems.map((li) => {
            const svcDef = services.find((s) => s.id === li.serviceId)
            const name = lang === 'fi' ? svcDef?.name_fi : svcDef?.name_en
            return (
              <div key={li.serviceId} className="mb-3">
                <QuoteLineItem label={`${name} (${li.effectiveHours}h)`} amount={fmt(li.subtotal)} bold />
                {li.basePrice > 0 && <QuoteLineItem label={t('quote.base')} amount={fmt(li.basePrice)} muted indent />}
                {li.durationCost > 0 && <QuoteLineItem label={t('quote.duration_cost', { hours: li.effectiveHours })} amount={fmt(li.durationCost)} muted indent />}
                {li.addonsCost > 0 && <QuoteLineItem label={t('quote.addons_cost')} amount={fmt(li.addonsCost)} muted indent />}
              </div>
            )
          })}
        </div>

        <div className="border-t border-[var(--color-border)]" />


        {quote.packageDiscount < 0 && (
          <QuoteLineItem label={t('quote.package_discount')} amount={fmt(quote.packageDiscount)} green />
        )}
        {quote.travelFee > 0 && <QuoteLineItem label={t('quote.travel_fee')} amount={fmt(quote.travelFee)} />}
        {quote.overnightFee > 0 && <QuoteLineItem label={t('quote.overnight_fee')} amount={fmt(quote.overnightFee)} />}

        <div className="border-t border-[var(--color-border)]" />

        <QuoteLineItem label={t('quote.subtotal_ex_vat')} amount={`€${quote.subtotalBeforeVat.toFixed(2)}`} muted />
        <QuoteLineItem label={t('quote.vat')} amount={`€${quote.vatAmount.toFixed(2)}`} muted />

        <div className="border-t border-[var(--color-border)]" />

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-[var(--color-text)]">{t('quote.total')}</span>
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--color-accent)]">
              {store.showVatIncluded ? `€${quote.totalWithVat.toFixed(2)}` : `€${quote.subtotalBeforeVat.toFixed(2)}`}
            </div>
            <button
              onClick={store.toggleVat}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
            >
              {store.showVatIncluded ? `→ ${t('quote.excl_vat')}` : `→ ${t('quote.incl_vat')}`}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => exportQuotePDF('quote-print', `${store.quoteId || 'quote'}.pdf`)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)] transition-all"
        >
          <Download size={16} />
          {t('common.download_pdf')}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)] transition-all"
        >
          {copied ? <Check size={16} className="text-[var(--color-success)]" /> : <Share2 size={16} />}
          {copied ? t('common.copied') : t('common.share_quote')}
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={store.prevStep}
          className="flex-1 py-4 rounded-xl font-semibold text-sm border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          {t('common.back')}
        </button>
        <button
          onClick={store.nextStep}
          className="flex-[2] py-4 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: 'var(--color-accent)', color: '#0f0f11' }}
        >
          {t('contact.submit')} →
        </button>
      </div>
    </div>
  )
}
