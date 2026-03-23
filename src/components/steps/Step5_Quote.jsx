import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Share2, Check } from 'lucide-react'
import useQuoteStore from '../../store/quoteStore'
import { useQuoteCalculator } from '../../hooks/useQuoteCalculator'
import QuoteLineItem from '../ui/QuoteLineItem'
import QuoteExpiry from '../ui/QuoteExpiry'
import { generateQuoteId, getQuoteExpiry } from '../../utils/quoteId'
import { exportQuotePDF } from '../../utils/pdfExport'
import { trackQuoteViewed } from '../../utils/analytics'
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
    trackQuoteViewed({
      total: quote.totalWithVat,
      services: store.selectedServices,
      eventType: store.eventDetails.eventType
    })
  }, [])

  const handleShare = () => {
    const state = store.getSerializableState()
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(state))))
    const url = `${window.location.href.split('#')[0]}#${encoded}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const fmt = (amount) => `€${Math.abs(amount).toFixed(2)}`

  const SERVICE_DETAILS = {
    dj: {
      en: [
        '✓ Professional DJ Controller (Pioneer / Denon grade)',
        '✓ Setup & teardown included',
        '✓ 5 hours of DJ playing (extra hours €50/h)',
        '✓ Wireless microphone',
        '✓ Full music library + custom requests'
      ],
      fi: [
        '✓ Ammattitason DJ-kontrolleri (Pioneer / Denon)',
        '✓ Pystytys ja purku sisältyy hintaan',
        '✓ 5 tuntia DJ-soittoa (lisätunnit €50/h)',
        '✓ Langaton mikrofoni',
        '✓ Laaja musiikkikirjasto + toivemusiikki'
      ]
    },
    audio: {
      en: [
        '✓ 2 × Pro Monitor Speakers (DB Technologies / JBL)',
        '✓ 1 × High Quality Subwoofer',
        '✓ Professional live mixing',
        '✓ Flat fee — any event length'
      ],
      fi: [
        '✓ 2 × Pro Monitor -kaiutin (DB Technologies / JBL)',
        '✓ 1 × Korkealaatuinen subwoofer',
        '✓ Ammattitason livemiksaus',
        '✓ Kiinteä hinta — tapahtuman pituudesta riippumatta'
      ]
    },
    lighting: {
      en: [
        '✓ LED lights included (static & strobe modes)',
        '+ Atmosphere lighting add-on available',
        '+ Fog machine add-on available'
      ],
      fi: [
        '✓ LED-valot sisältyy (staattiset & strobo)',
        '+ Tunnelmavalaistus lisäpalveluna saatavilla',
        '+ Savukone lisäpalveluna saatavilla'
      ]
    },
    special_fx: {
      en: [
        '✓ 24" screen with Finland\'s largest song selection',
        '✓ 2 wireless microphones',
        '✓ Professional Karaoke software'
      ],
      fi: [
        '✓ 24" näyttö Suomen isoimman biisivaraston kanssa',
        '✓ 2 langatonta mikrofonia',
        '✓ Ammattilaistason Karaoke-ohjelmisto'
      ]
    }
  }

  const ADDON_LABELS = {
    ambient_lighting: { en: '+ Atmosphere lighting', fi: '+ Tunnelmavalaistus' },
    smoke_machine: { en: '+ Fog machine', fi: '+ Savukone' },
    extra_sub: { en: '+ Extra subwoofer(s)', fi: '+ Lisäsubwoofer(it)' },
    extra_speakers: { en: '+ Extra speakers', fi: '+ Lisäkaiuttimet' },
    titis_magic: { en: '+ Titis Magic — professional dancers with custom outfits', fi: '+ Titis Magic — ammattitanssijat räätälöidyissä asuissa' },
    custom_stage: { en: '+ Baller Stage — LED screens, moving heads, smoke & strobes', fi: '+ Baller Stage — LED-näytöt, moving heads, savu & strobot' }
  }

  return (
    <div className="px-3 py-5 space-y-4 pb-24">
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
              <span className="text-[var(--color-text-muted)]">{lang === 'fi' ? 'Päivämäärä' : 'Date'}</span>
              <span className="text-[var(--color-text)]">{new Date(store.eventDetails.date).toLocaleDateString(lang === 'fi' ? 'fi-FI' : 'en-GB')}</span>
            </div>
          )}
          {store.eventDetails.eventType && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">{lang === 'fi' ? 'Tapahtuma' : 'Type'}</span>
              <span className="text-[var(--color-text)] capitalize">{store.eventDetails.eventType}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">{lang === 'fi' ? 'Kesto' : 'Duration'}</span>
            <span className="text-[var(--color-text)]">{store.eventDetails.durationHours}h</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">{lang === 'fi' ? 'Vieraat' : 'Guests'}</span>
            <span className="text-[var(--color-text)]">{store.eventDetails.guestCount}</span>
          </div>
          {store.location.address && (
            <div className="flex justify-between text-sm gap-4">
              <span className="text-[var(--color-text-muted)] flex-shrink-0">{lang === 'fi' ? 'Paikka' : 'Venue'}</span>
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
            const EXTRAS_NAME = { fi: 'Erikoispalvelut', en: 'Special Extras' }
            const name = (lang === 'fi' ? svcDef?.name_fi : svcDef?.name_en) || EXTRAS_NAME[lang] || EXTRAS_NAME.en
            const label = li.durationCost > 0 ? `${name} (${li.effectiveHours}h)` : name
            const details = SERVICE_DETAILS[li.serviceId]?.[lang] || []
            const addonLines = li.addonLines || []
            return (
              <div key={li.serviceId} className="mb-4 rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-[var(--color-text)]">{label}</span>
                  <span className="font-bold text-sm text-[var(--color-accent)]">{fmt(li.subtotal)}</span>
                </div>
                {details.length > 0 && (
                  <ul className="space-y-0.5 mb-2">
                    {details.map((line, i) => (
                      <li key={i} className="text-xs" style={{ color: line.startsWith('✓') ? 'var(--color-text-muted)' : 'rgba(110,231,183,0.6)' }}>{line}</li>
                    ))}
                  </ul>
                )}
                {addonLines.map((a) => {
                  const aLabel = ADDON_LABELS[a.addonId]?.[lang] || a.addonId
                  return (
                    <div key={a.addonId} className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      <span>{aLabel}{a.qty > 1 ? ` ×${a.qty}` : ''}</span>
                      <span>+€{a.cost.toFixed(2)}</span>
                    </div>
                  )
                })}
                {li.durationCost > 0 && (
                  <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    <span>{lang === 'fi' ? `Lisätunnit (${li.effectiveHours - li.minHours}h × €${li.hourlyRate})` : `Extra hours (${li.effectiveHours - li.minHours}h × €${li.hourlyRate})`}</span>
                    <span>+€{li.durationCost.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="border-t border-[var(--color-border)]" />

        {quote.packageDiscount < 0 && (
          <div className="space-y-1.5">
            {/* Red — original price */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">
                {lang === 'fi' ? 'Hinta ilman alennusta' : 'Price before discount'}
              </span>
              <span className="line-through font-medium" style={{ color: '#f87171' }}>
                €{quote.servicesSubtotal.toFixed(2)}
              </span>
            </div>
            {/* Yellow — discount */}
            <div className="flex items-center justify-between text-sm font-semibold">
              <span style={{ color: '#e8b84b' }}>
                {lang === 'fi'
                  ? `Pakettialennus (${Math.round(quote.packageDiscountRate * 100)}%)`
                  : `Package discount (${Math.round(quote.packageDiscountRate * 100)}%)`}
              </span>
              <span style={{ color: '#e8b84b' }}>−€{Math.abs(quote.packageDiscount).toFixed(2)}</span>
            </div>
          </div>
        )}

        {quote.outOfRange && (
          <div className="flex items-start gap-2 p-3 rounded-xl text-sm"
            style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
            🤝 {lang === 'fi'
              ? `Sijainti on yli 250 km — ohjaamme sinut lähimmälle kumppanillemme alueellasi.`
              : `Location is over 250 km — we will connect you with our nearest partner in your area.`}
          </div>
        )}

        {!quote.outOfRange && quote.distanceKm !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">
              {lang === 'fi' ? 'Matka-alue' : 'Travel zone'}
            </span>
            <span style={{ color: quote.travelFee > 0 ? 'var(--color-accent)' : 'var(--color-success)' }}>
              {quote.distanceKm} km — {quote.travelFee > 0
                ? (lang === 'fi' ? 'Maksullinen matka-alue' : 'Chargeable zone')
                : (lang === 'fi' ? 'Maksuton alue' : 'Free zone')}
            </span>
          </div>
        )}
        {quote.travelFee > 0 && <QuoteLineItem label={t('quote.travel_fee')} amount={fmt(quote.travelFee)} />}

        <div className="border-t border-[var(--color-border)]" />

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-[var(--color-text)]">{t('quote.total')}</span>
          <div className="text-right">
            {quote.packageDiscount < 0 && (
              <div className="text-sm line-through mb-0.5" style={{ color: '#f87171' }}>
                €{(quote.servicesSubtotal + quote.extrasSubtotal + quote.travelFee).toFixed(2)}
              </div>
            )}
            {/* Green — new discounted price */}
            <div className="text-2xl font-bold" style={{ color: quote.packageDiscount < 0 ? '#22c55e' : 'var(--color-accent)' }}>
              €{quote.total.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Satisfaction guarantee */}
      <div
        className="rounded-2xl p-5 text-center space-y-3"
        style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(110,231,183,0.1) 100%)',
          border: '2px solid rgba(34,197,94,0.5)'
        }}
      >
        <div className="text-4xl">🛡️</div>
        <div>
          <p className="text-lg font-bold" style={{ color: '#6ee7b7' }}>
            {lang === 'fi' ? '100% tyytyväisyystakuu' : '100% Satisfaction Guarantee'}
          </p>
          <p className="text-2xl font-extrabold mt-1" style={{ color: '#22c55e' }}>
            {lang === 'fi' ? 'Tai maksat €0' : 'Or you pay €0'}
          </p>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(110,231,183,0.85)' }}>
          {lang === 'fi'
            ? 'Jos et ole täysin tyytyväinen, et maksa mitään. Ei kysymyksiä, ei selittelyjä — takuumme on ehdoton.'
            : 'If you are not 100% satisfied with our service, you pay absolutely nothing. No questions asked, no explanations needed — our guarantee is unconditional.'}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(110,231,183,0.85)' }}>
          {lang === 'fi'
            ? '🔄 Jos DJ sairastuu tai estyy, järjestämme korvaavan DJ:n veloituksetta — tapahtumasi ei peruunnu koskaan.'
            : '🔄 If your DJ is sick or unavailable, we will find a replacement at no extra cost — your event will never be cancelled.'}
        </p>
        <div className="flex justify-center flex-wrap gap-4 pt-1 text-xs font-medium" style={{ color: 'rgba(110,231,183,0.7)' }}>
          <span>✓ {lang === 'fi' ? 'Ei riskiä' : 'Zero risk'}</span>
          <span>✓ {lang === 'fi' ? 'Ei piilomaksuja' : 'No hidden fees'}</span>
          <span>✓ {lang === 'fi' ? 'Ehdoton takuu' : 'Unconditional'}</span>
          <span>✓ {lang === 'fi' ? 'Varamies-DJ tarvittaessa' : 'Free DJ replacement if needed'}</span>
        </div>
      </div>

      {/* Disclaimer — small, subtle */}
      <p className="text-xs text-center px-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {lang === 'fi'
          ? 'Hinta on arvio. Puhelussa varmistamme, että paketti vastaa tarpeitasi — et maksa turhista.'
          : 'Price is an estimate. On the call we will make sure the package suits your needs and you don\'t pay for things you don\'t need.'}
      </p>

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
