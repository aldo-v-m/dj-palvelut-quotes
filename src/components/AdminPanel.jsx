import React, { useState } from 'react'
import { Lock, Save, RotateCcw, Eye, EyeOff, CheckCircle } from 'lucide-react'
import usePricingStore from '../store/pricingStore'
import defaultPricing from '../config/pricing.json'
import AnalyticsTab from './AnalyticsTab'

function Toggle({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--color-border)] last:border-0">
      <div>
        <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
        {desc && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-all shrink-0"
        style={{ backgroundColor: checked ? 'var(--color-accent)' : 'var(--color-border)' }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
          style={{ left: checked ? '22px' : '2px' }}
        />
      </button>
    </div>
  )
}

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'djadmin2024'

function Field({ label, value, onChange, type = 'number', min, step = '0.01' }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-[var(--color-text-muted)]">{label}</label>
      <input
        type={type}
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm text-[var(--color-text)]"
        style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
      />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <h3 className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

export default function AdminPanel() {
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [pwError, setPwError] = useState(false)
  const [saved, setSaved] = useState(false)
  const { pricing, setPricing, resetPricing, isOverridden, showSpecialExtras, setShowSpecialExtras, hidePricingDuringForm, setHidePricingDuringForm, requirePhone, setRequirePhone } = usePricingStore()
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(pricing)))
  const [activeTab, setActiveTab] = useState('pricing')

  const login = () => {
    if (password === ADMIN_PASSWORD) { setAuthed(true); setPwError(false) }
    else setPwError(true)
  }

  const update = (path, value) => {
    setDraft((prev) => {
      const next = JSON.parse(JSON.stringify(prev))
      const keys = path.split('.')
      let obj = next
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return next
    })
  }

  const updateTierPrice = (index, value) => {
    setDraft((prev) => {
      const next = JSON.parse(JSON.stringify(prev))
      next.services.dj.tier_prices[index] = parseFloat(value) || 0
      return next
    })
  }

  const handleSave = () => {
    setPricing(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    if (!confirm('Reset all pricing to defaults?')) return
    resetPricing()
    setDraft(JSON.parse(JSON.stringify(defaultPricing)))
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: 'rgba(212,168,67,0.15)' }}>
              <Lock size={24} style={{ color: 'var(--color-accent)' }} />
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">Admin Panel</h1>
            <p className="text-sm text-[var(--color-text-muted)]">DJ Palvelut — Pricing Management</p>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 rounded-xl text-sm text-[var(--color-text)] pr-10"
                style={{ backgroundColor: 'var(--color-surface)', border: `1px solid ${pwError ? '#f87171' : 'var(--color-border)'}` }}
              />
              <button
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwError && <p className="text-xs text-red-400 text-center">Incorrect password</p>}
            <button
              onClick={login}
              className="w-full py-3 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: 'var(--color-accent)', color: '#0a130c' }}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  const d = draft
  const tierLabels = ['1h extra', '2h extra', '3h extra', '4h extra', '5h extra', '6h extra']

  return (
    <div className="min-h-screen px-4 py-6 space-y-5" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        {['pricing', 'analytics', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
            style={activeTab === tab
              ? { backgroundColor: 'var(--color-accent)', color: '#0a130c' }
              : { color: 'var(--color-text-muted)' }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'pricing' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">Pricing Admin</h1>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {isOverridden() ? '⚡ Using custom pricing (localStorage)' : '📋 Using default pricing'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <RotateCcw size={13} /> Reset
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: saved ? 'var(--color-success)' : 'var(--color-accent)', color: '#0a130c' }}
              >
                {saved ? <><CheckCircle size={13} /> Saved!</> : <><Save size={13} /> Save</>}
              </button>
            </div>
          </div>

          <Section title="General">
            <div className="grid grid-cols-2 gap-3">
              <Field label="VAT Rate (e.g. 0.135 = 13.5%)" value={d.vat_rate} onChange={(v) => update('vat_rate', v)} step="0.001" />
            </div>
          </Section>

          <Section title="Travel">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Free zone (km)" value={d.travel.free_km} onChange={(v) => update('travel.free_km', v)} step="1" />
              <Field label="Rate per km one way (€)" value={d.travel.rate_per_km_one_way} onChange={(v) => update('travel.rate_per_km_one_way', v)} />
              <Field label="Out of range limit (km)" value={d.travel.out_of_range_km} onChange={(v) => update('travel.out_of_range_km', v)} step="1" />
            </div>
          </Section>

          <Section title="Package Discounts">
            <div className="grid grid-cols-3 gap-3">
              <Field label="2 services (e.g. 0.05 = 5%)" value={d.package_discounts.two_services} onChange={(v) => update('package_discounts.two_services', v)} step="0.01" />
              <Field label="3 services" value={d.package_discounts.three_services} onChange={(v) => update('package_discounts.three_services', v)} step="0.01" />
              <Field label="4 services" value={d.package_discounts.four_services} onChange={(v) => update('package_discounts.four_services', v)} step="0.01" />
            </div>
          </Section>

          <Section title="Surcharges">
            <div className="grid grid-cols-2 gap-3">
              <Field label="High season rate (e.g. 0.15)" value={d.surcharges.high_season} onChange={(v) => update('surcharges.high_season', v)} step="0.01" />
              <Field label="Last-minute rate (e.g. 0.15)" value={d.surcharges.last_minute} onChange={(v) => update('surcharges.last_minute', v)} step="0.01" />
              <Field label="Last-minute window (days)" value={d.surcharges.last_minute_days} onChange={(v) => update('surcharges.last_minute_days', v)} step="1" />
            </div>
          </Section>

          <Section title="DJ Service">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Base price (€) — includes min hours" value={d.services.dj.base_price} onChange={(v) => update('services.dj.base_price', v)} step="1" />
              <Field label="Included hours (free)" value={d.services.dj.min_hours} onChange={(v) => update('services.dj.min_hours', v)} step="1" />
              <Field label="Overflow rate per hour (€)" value={d.services.dj.hourly_rate} onChange={(v) => update('services.dj.hourly_rate', v)} step="1" />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] pt-1">Extra hours pricing (on top of base, after included hours)</p>
            <div className="grid grid-cols-3 gap-3">
              {d.services.dj.tier_prices.map((price, i) => (
                <Field key={i} label={tierLabels[i]} value={price} onChange={(v) => updateTierPrice(i, v)} step="1" />
              ))}
            </div>
          </Section>

          <Section title="Audio Service">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Base price (€)" value={d.services.audio.base_price} onChange={(v) => update('services.audio.base_price', v)} step="1" />
              <Field label="Hourly rate (€)" value={d.services.audio.hourly_rate} onChange={(v) => update('services.audio.hourly_rate', v)} step="1" />
              <Field label="Min hours" value={d.services.audio.min_hours} onChange={(v) => update('services.audio.min_hours', v)} step="1" />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] pt-1">Audio Add-ons</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="2x Subwoofers (€)" value={d.services.audio.addons.extra_sub.price} onChange={(v) => update('services.audio.addons.extra_sub.price', v)} step="1" />
              <Field label="Extra Speakers (€ each)" value={d.services.audio.addons.extra_speakers.price} onChange={(v) => update('services.audio.addons.extra_speakers.price', v)} step="1" />
            </div>
          </Section>

          <Section title="Lighting Service">
            <p className="text-xs text-[var(--color-text-muted)]">Add-ons</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="LED Lights (€)" value={d.services.lighting.addons.led_lights.price} onChange={(v) => update('services.lighting.addons.led_lights.price', v)} step="1" />
              <Field label="Ambient Lighting (€)" value={d.services.lighting.addons.ambient_lighting.price} onChange={(v) => update('services.lighting.addons.ambient_lighting.price', v)} step="1" />
              <Field label="Smoke Machine (€)" value={d.services.lighting.addons.smoke_machine.price} onChange={(v) => update('services.lighting.addons.smoke_machine.price', v)} step="1" />
            </div>
          </Section>

          <Section title="Karaoke (Special FX)">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Base price (€)" value={d.services.special_fx.base_price} onChange={(v) => update('services.special_fx.base_price', v)} step="1" />
            </div>
          </Section>

          <Section title="Special Extras">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Titis Magic (€/dancer)" value={d.services.extras.addons.titis_magic.price} onChange={(v) => update('services.extras.addons.titis_magic.price', v)} step="1" />
              <Field label="Custom Stage (€)" value={d.services.extras.addons.custom_stage.price} onChange={(v) => update('services.extras.addons.custom_stage.price', v)} step="1" />
            </div>
          </Section>

          <div className="pb-8">
            <button
              onClick={handleSave}
              className="w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: saved ? 'var(--color-success)' : 'var(--color-accent)', color: '#0a130c' }}
            >
              {saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save All Changes</>}
            </button>
            <p className="text-xs text-center text-[var(--color-text-muted)] mt-2">Changes apply immediately — no redeploy needed</p>
          </div>
        </>
      )}

      {activeTab === 'analytics' && <AnalyticsTab />}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">App Settings</h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Feature toggles and display options</p>
          </div>
          <Section title="Customization Step">
            <Toggle
              label="Special Extras"
              desc="Show Titis Magic dancers and Baller Stage in the customization step"
              checked={showSpecialExtras}
              onChange={setShowSpecialExtras}
            />
          </Section>
          <Section title="Pricing Visibility">
            <Toggle
              label="Hide pricing during form"
              desc="Hides running totals, prices, and discounts while the customer fills out the form. Pricing is revealed on the quote page."
              checked={hidePricingDuringForm}
              onChange={setHidePricingDuringForm}
            />
          </Section>
          <Section title="Contact Form">
            <Toggle
              label="Require phone number"
              desc="When enabled, customers must provide a phone number before proceeding to the quote."
              checked={requirePhone}
              onChange={setRequirePhone}
            />
          </Section>
        </div>
      )}
    </div>
  )
}
