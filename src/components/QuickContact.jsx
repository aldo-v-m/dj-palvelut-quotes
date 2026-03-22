import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, MessageCircle, ChevronLeft } from 'lucide-react'
import { saveQuoteToAirtable } from '../utils/airtable'
import { generateQuoteId } from '../utils/quoteId'
import { trackLeadSubmitted } from '../utils/analytics'

const EVENT_TYPES = [
  { id: 'wedding', emoji: '💍', en: 'Wedding', fi: 'Häät' },
  { id: 'corporate', emoji: '💼', en: 'Corporate', fi: 'Yritys' },
  { id: 'private', emoji: '🎉', en: 'Party', fi: 'Juhlat' },
  { id: 'festival', emoji: '🎵', en: 'Festival', fi: 'Festivaali' },
  { id: 'other', emoji: '✨', en: 'Other', fi: 'Muu' }
]

export default function QuickContact({ onBack }) {
  const [lang] = useState(() => navigator.language?.startsWith('fi') ? 'fi' : 'en')
  const [step, setStep] = useState('form') // 'form' | 'success'
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    eventType: '',
    message: ''
  })

  const t = (en, fi) => lang === 'fi' ? fi : en

  const isValid = form.name.trim().length >= 2 && (form.phone.trim() || form.email.trim())

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return
    setSubmitting(true)
    setError('')

    const quoteId = generateQuoteId()
    const record = {
      QuoteID: quoteId,
      Name: form.name,
      Email: form.email || '',
      Phone: form.phone || '',
      EventType: form.eventType || 'unknown',
      Duration: 0,
      GuestCount: 0,
      Venue: '',
      Address: '',
      DistanceKm: 0,
      Services: 'quick-contact',
      Addons: '{}',
      TravelFee: 0,
      Subtotal: 0,
      VAT: 0,
      Total: 0,
      Language: lang,
      AIRecommendation: '',
      SubmittedAt: new Date().toISOString()
    }

    const sendWhatsApp = async () => {
      const phone = import.meta.env.VITE_CALLMEBOT_PHONE
      const apikey = import.meta.env.VITE_CALLMEBOT_APIKEY
      if (!phone || !apikey) return
      const msg = `📞 Quick lead: ${form.name} | ${form.phone || form.email} | ${form.eventType || 'no type'} | ${form.message || 'no message'} | ID: ${quoteId}`
      const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(msg)}&apikey=${apikey}`
      try { await fetch(url) } catch { /* non-blocking */ }
    }

    try {
      await saveQuoteToAirtable(record)
      sendWhatsApp()
      trackLeadSubmitted({ total: 0, services: ['quick-contact'], eventType: form.eventType, quoteId })
      setStep('success')
    } catch (err) {
      console.error(err)
      setError(t('Something went wrong. Please try again.', 'Jokin meni pieleen. Yritä uudelleen.'))
    } finally {
      setSubmitting(false)
    }
  }

  const waNum = import.meta.env.VITE_COMPANY_WHATSAPP || '358458844121'
  const waText = encodeURIComponent(t("Hi! I'd like to get a quote for my event.", 'Hei! Haluaisin tarjouksen tapahtumastani.'))
  const waUrl = `https://wa.me/${waNum}?text=${waText}`
  const phone = import.meta.env.VITE_COMPANY_PHONE || '+358458844121'

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8 text-center space-y-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(110,231,183,0.15)' }}>
          <CheckCircle size={40} style={{ color: 'var(--color-success)' }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            {t("We'll be in touch!", 'Olemme pian yhteydessä!')}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-xs mx-auto">
            {t('Benjamin will call you shortly to help plan your event.', 'Benjamin soittaa sinulle pian auttaakseen tapahtumasi suunnittelussa.')}
          </p>
        </div>
        <div className="w-full max-w-xs space-y-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: '#25D366', color: 'white' }}
          >
            <MessageCircle size={16} />
            {t('Chat on WhatsApp', 'Lähetä WhatsApp-viesti')}
          </a>
          <a
            href={`tel:${phone}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: 'var(--color-accent)', color: '#0a130c' }}
          >
            📞 {t('Call now', 'Soita nyt')} — Benjamin
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-5 pb-24 max-w-[480px] mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">
            {t('Get a callback', 'Pyydä soitto')}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {t("Leave your details — we'll call you within the hour.", 'Jätä yhteystietosi — soitamme tunnin sisällä.')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--color-text-muted)]">
            {t('Your name', 'Nimesi')} *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t('Full name', 'Koko nimi')}
            className="w-full px-4 py-3 rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)]"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--color-text-muted)]">
            {t('Phone number', 'Puhelinnumero')} *
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+358 40 123 4567"
            className="w-full px-4 py-3 rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)]"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          />
        </div>

        {/* Email optional */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--color-text-muted)]">
            {t('Email', 'Sähköposti')} <span className="text-xs opacity-60">({t('optional', 'valinnainen')})</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="email@example.com"
            className="w-full px-4 py-3 rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)]"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          />
        </div>

        {/* Event type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text-muted)]">
            {t('Event type', 'Tapahtuman tyyppi')} <span className="text-xs opacity-60">({t('optional', 'valinnainen')})</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {EVENT_TYPES.map(({ id, emoji, en, fi }) => (
              <motion.button
                key={id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setForm((f) => ({ ...f, eventType: id }))}
                className="flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all"
                style={{
                  backgroundColor: form.eventType === id ? 'rgba(232,184,75,0.15)' : 'var(--color-surface)',
                  border: form.eventType === id ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                  color: form.eventType === id ? 'var(--color-accent)' : 'var(--color-text-muted)'
                }}
              >
                <span className="text-lg">{emoji}</span>
                <span>{lang === 'fi' ? fi : en}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Message optional */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--color-text-muted)]">
            {t('Anything else?', 'Jotain muuta?')} <span className="text-xs opacity-60">({t('optional', 'valinnainen')})</span>
          </label>
          <textarea
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            rows={2}
            placeholder={t('Event date, venue, guest count...', 'Päivämäärä, paikka, vierasmäärä...')}
            className="w-full px-4 py-3 rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] resize-none"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          />
        </div>

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        <button
          type="submit"
          disabled={!isValid || submitting}
          className="w-full py-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
          style={{ backgroundColor: 'var(--color-accent)', color: '#0a130c' }}
        >
          {submitting
            ? t('Sending…', 'Lähetetään…')
            : t('Request callback', 'Pyydä soittoa')}
        </button>

        <div className="flex gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#25D366', color: 'white' }}
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>
          <a
            href={`tel:${phone}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          >
            📞 {t('Call now', 'Soita nyt')}
          </a>
        </div>
      </form>
    </div>
  )
}
