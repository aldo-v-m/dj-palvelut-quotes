import React from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Users, Layers } from 'lucide-react'
import { motion } from 'framer-motion'
import useQuoteStore from '../../store/quoteStore'
import usePricingStore from '../../store/pricingStore'
import pricing from '../../config/pricing.json'

const LIGHTING_ADDONS = [
  { id: 'ambient_lighting', emoji: '🌅', price: 150 },
  { id: 'smoke_machine', emoji: '💨', price: 50 }
]
const AUDIO_ADDONS = [
  { id: 'extra_sub', emoji: '🔊', price: 100 },
  { id: 'extra_speakers', emoji: '📢', price: 75 }
]

function AddonCard({ serviceId, addonId, emoji, price, per, label, desc, checked, onToggle, quantity, onQtyChange, showQty, maxQty, hidePrice }) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${checked ? 'var(--color-accent)' : 'var(--color-border)'}`
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base mt-0.5"
        style={{ backgroundColor: checked ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.05)' }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
          <div className="flex items-center gap-2 shrink-0">
            {!hidePrice && <span className="text-sm font-semibold text-[var(--color-accent)]">€{price}</span>}
            <div
              className="w-5 h-5 rounded flex items-center justify-center shrink-0"
              style={{ backgroundColor: checked ? 'var(--color-accent)' : 'var(--color-border)' }}
            >
              {checked && <Check size={12} style={{ color: '#0a130c' }} />}
            </div>
          </div>
        </div>
        {desc && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{desc}</p>}
        {checked && showQty && (
          <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs text-[var(--color-text-muted)]">Qty:</span>
            <button
              className="w-6 h-6 rounded text-xs border border-[var(--color-border)] text-[var(--color-text-muted)]"
              onClick={() => onQtyChange(Math.max(1, quantity - 1))}
            >-</button>
            <span className="text-sm font-semibold text-[var(--color-text)] w-4 text-center">{quantity}</span>
            <button
              className="w-6 h-6 rounded text-xs border border-[var(--color-border)] text-[var(--color-text-muted)]"
              onClick={() => onQtyChange(Math.min(maxQty || 99, quantity + 1))}
            >+</button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function Step4_Customization() {
  const { t, i18n } = useTranslation()
  const { selectedServices, addons, addonQuantities, toggleAddon, setAddonQuantity, nextStep, prevStep } = useQuoteStore()
  const showSpecialExtras = usePricingStore((s) => s.showSpecialExtras)
  const hidePricingDuringForm = usePricingStore((s) => s.hidePricingDuringForm)
  const lang = i18n.language

  const isChecked = (svcId, addonId) => (addons[svcId] || []).includes(addonId)
  const qty = (svcId, addonId) => addonQuantities[`${svcId}_${addonId}`] || 1

  const hasLighting = selectedServices.includes('lighting')
  const hasAudio = selectedServices.includes('audio')
  const hasDJ = selectedServices.includes('dj')

  const Section = ({ title, children }) => (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-1">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )

  return (
    <div className="px-3 py-5 space-y-5 pb-24">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-1">
          {t('steps.4.title')}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">{t('steps.4.desc')}</p>
      </div>

      {hasLighting && (
        <Section title={lang === 'fi' ? 'Valaistus' : 'Lighting Options'}>
          {LIGHTING_ADDONS.map(({ id, emoji, price }) => (
            <AddonCard
              key={id}
              serviceId="lighting"
              addonId={id}
              emoji={emoji}
              price={price}
              label={t(`addons.lighting.${id}`)}
              desc={t(`addons.lighting.${id}_desc`)}
              checked={isChecked('lighting', id)}
              onToggle={() => toggleAddon('lighting', id)}
              quantity={qty('lighting', id)}
              onQtyChange={(q) => setAddonQuantity('lighting', id, q)}
              showQty={false}
              hidePrice={hidePricingDuringForm}
            />
          ))}
        </Section>
      )}

      {hasAudio && (
        <Section title={lang === 'fi' ? 'Äänentoisto-lisät' : 'Audio Extras'}>
          <AddonCard
            serviceId="audio"
            addonId="extra_sub"
            emoji="🔊"
            price={100}
            label={lang === 'fi' ? 'Lisäsubwoofer' : 'Extra Subwoofer'}
            desc={lang === 'fi' ? 'Suositellaan yli 150 hengen tapahtumiin — €100/kpl' : 'Recommended for events with 150+ guests — €100 each'}
            checked={isChecked('audio', 'extra_sub')}
            onToggle={() => toggleAddon('audio', 'extra_sub')}
            quantity={qty('audio', 'extra_sub')}
            onQtyChange={(q) => setAddonQuantity('audio', 'extra_sub', q)}
            showQty={true}
            maxQty={4}
            hidePrice={hidePricingDuringForm}
          />
          <AddonCard
            serviceId="audio"
            addonId="extra_speakers"
            emoji="📢"
            price={75}
            label={lang === 'fi' ? 'Lisäkaiuttimet' : 'Extra Speakers'}
            desc={lang === 'fi'
              ? 'Suositellaan yli 150 hengen tai isoon tilaan — taustamusiikki terassille tai muihin tiloihin. €75/kpl, max 8 kpl'
              : 'Recommended for 150+ guests or large venues — background music on terrace or other areas. €75 each, up to 8'}
            checked={isChecked('audio', 'extra_speakers')}
            onToggle={() => toggleAddon('audio', 'extra_speakers')}
            quantity={qty('audio', 'extra_speakers')}
            onQtyChange={(q) => setAddonQuantity('audio', 'extra_speakers', q)}
            showQty={true}
            maxQty={8}
            hidePrice={hidePricingDuringForm}
          />
        </Section>
      )}

      {showSpecialExtras && <Section title={lang === 'fi' ? 'Erikoispalvelut' : 'Special Extras'}>
        <AddonCard
          serviceId="extras"
          addonId="titis_magic"
          emoji="💃"
          price={300}
          label="Titis Magic"
          desc={lang === 'fi'
            ? '€300 per tanssija — Ammattitaitoiset tanssijat räätälöidyissä asuissa, jotka tuovat juhliisi lisää energiaa ja viihdettä.'
            : '€300 per dancer — Professional dancers with custom outfits, bringing extra energy and entertainment to your event.'}
          checked={isChecked('extras', 'titis_magic')}
          onToggle={() => toggleAddon('extras', 'titis_magic')}
          quantity={qty('extras', 'titis_magic')}
          onQtyChange={(q) => setAddonQuantity('extras', 'titis_magic', q)}
          showQty={true}
          maxQty={5}
          hidePrice={hidePricingDuringForm}
        />
        <AddonCard
          serviceId="extras"
          addonId="custom_stage"
          emoji="👑"
          price={2500}
          label={lang === 'fi' ? 'Baller Stage' : 'Baller Stage'}
          desc={lang === 'fi'
            ? 'Alkaen €2500+ — Korkealaatuinen lavarakenne: LED-näytöt, moving heads, savukoneet & strobot. Täydellinen premium-tapahtumiin.'
            : 'From €2500+ — High quality custom stage design: LED screens, moving heads, smoke machines & strobes. The ultimate premium setup.'}
          checked={isChecked('extras', 'custom_stage')}
          onToggle={() => toggleAddon('extras', 'custom_stage')}
          quantity={qty('extras', 'custom_stage')}
          onQtyChange={(q) => setAddonQuantity('extras', 'custom_stage', q)}
          showQty={false}
          hidePrice={hidePricingDuringForm}
        />
      </Section>}

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
          style={{ backgroundColor: 'var(--color-accent)', color: '#0a130c' }}
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  )
}
