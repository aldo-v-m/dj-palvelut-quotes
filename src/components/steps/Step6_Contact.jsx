import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import emailjs from 'emailjs-com'
import { MessageCircle, CheckCircle } from 'lucide-react'
import useQuoteStore from '../../store/quoteStore'
import { useQuoteCalculator } from '../../hooks/useQuoteCalculator'
import { saveQuoteToAirtable } from '../../utils/airtable'
import { trackLeadSubmitted } from '../../utils/analytics'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional().refine(
    (v) => !v || /^\+?[\d\s\-().]{7,20}$/.test(v),
    'Invalid phone number'
  ),
  message: z.string().optional()
})

export default function Step6_Contact() {
  const { t } = useTranslation()
  const store = useQuoteStore()
  const quote = useQuoteCalculator()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: store.contact.name,
      email: store.contact.email,
      phone: store.contact.phone,
      message: store.contact.message || (store.quoteId ? `I'm interested in quote ${store.quoteId}` : '')
    }
  })

  const onSubmit = async (data) => {
    setSubmitting(true)
    setError('')
    store.setContact(data)

    const templateParams = {
      quote_id: store.quoteId,
      name: data.name,
      email: data.email,
      phone: data.phone || '-',
      event_type: store.eventDetails.eventType,
      event_date: store.eventDetails.date,
      duration: store.eventDetails.durationHours,
      guest_count: store.eventDetails.guestCount,
      venue_name: store.eventDetails.venueName || '-',
      address: store.location.address || '-',
      distance_km: store.location.distanceKm || '-',
      services: store.selectedServices.join(', '),
      total: quote.totalWithVat.toFixed(2)
    }

    const airtableRecord = {
      QuoteID: store.quoteId,
      Name: data.name,
      Email: data.email,
      Phone: data.phone || '',
      EventDate: store.eventDetails.date,
      EventType: store.eventDetails.eventType,
      Duration: store.eventDetails.durationHours,
      GuestCount: store.eventDetails.guestCount,
      Venue: store.eventDetails.venueName || '',
      Address: store.location.address || '',
      DistanceKm: store.location.distanceKm || 0,
      Services: store.selectedServices.join(', '),
      Addons: JSON.stringify(store.addons),
      TravelFee: quote.travelFee,
      Subtotal: quote.subtotalBeforeVat,
      VAT: quote.vatAmount,
      Total: quote.totalWithVat,
      Language: store.language,
      AIRecommendation: store.aiRecommendation ? JSON.stringify(store.aiRecommendation) : '',
      SubmittedAt: new Date().toISOString()
    }

    const sendWhatsApp = async () => {
      const phone = import.meta.env.VITE_CALLMEBOT_PHONE
      const apikey = import.meta.env.VITE_CALLMEBOT_APIKEY
      if (!phone || !apikey) return
      const msg = `New lead: ${data.name} | ${data.email} | ${store.eventDetails.eventType} | ${store.eventDetails.date} | Quote: €${quote.totalWithVat.toFixed(2)} | ID: ${store.quoteId}`
      const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(msg)}&apikey=${apikey}`
      try { await fetch(url) } catch { /* non-blocking */ }
    }

    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_ytzdmr4'
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      if (serviceId && templateId && publicKey) {
        try {
          await emailjs.send(serviceId, templateId, templateParams, publicKey)
        } catch (emailErr) {
          console.error('EmailJS error:', emailErr)
        }
      }
      // Fire tracking immediately — before Airtable, so it always runs
      trackLeadSubmitted({
        total: quote.totalWithVat,
        services: store.selectedServices,
        eventType: store.eventDetails.eventType,
        quoteId: store.quoteId
      })
      await saveQuoteToAirtable(airtableRecord)
      sendWhatsApp()
      store.setSubmitted(true)
      setSuccess(true)
    } catch (err) {
      console.error('Submission error:', err)
      setError(t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    const whatsappNum = import.meta.env.VITE_COMPANY_WHATSAPP || '358401234567'
    const waText = encodeURIComponent(`Hi, I'm interested in quote ${store.quoteId}`)
    const waUrl = `https://wa.me/${whatsappNum}?text=${waText}`

    return (
      <div className="px-4 py-12 flex flex-col items-center text-center space-y-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(110,231,183,0.15)' }}>
          <CheckCircle size={40} style={{ color: 'var(--color-success)' }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            {t('contact.success_title')}
          </h2>
          <p className="text-[var(--color-text-muted)] text-sm max-w-xs mx-auto">
            {t('contact.success_desc', { quoteId: store.quoteId })}
          </p>
        </div>
        <div
          className="w-full max-w-xs p-4 rounded-xl"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm text-[var(--color-text-muted)] mb-3">{t('contact.whatsapp_cta')}</p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium text-sm"
            style={{ backgroundColor: '#25D366', color: 'white' }}
          >
            <MessageCircle size={16} />
            {t('common.whatsapp')}
          </a>
        </div>
        <div
          className="w-full max-w-xs p-4 rounded-xl"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm text-[var(--color-text-muted)] mb-3">{t('contact.call_cta')}</p>
          <a
            href={`tel:${import.meta.env.VITE_COMPANY_PHONE || '+358458844121'}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium text-sm"
            style={{ backgroundColor: 'var(--color-accent)', color: '#0a130c' }}
          >
            📞 Benjamin — {import.meta.env.VITE_COMPANY_PHONE || '+358 45 884 4121'}
          </a>
        </div>
      </div>
    )
  }

  const Field = ({ name, label, placeholder, type = 'text', required, rows }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[var(--color-text-muted)]">
        {label}{!required && <span className="text-xs ml-1">({t('common.optional')})</span>}
      </label>
      {rows ? (
        <textarea
          {...register(name)}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl text-[var(--color-text)] text-sm placeholder-[var(--color-text-muted)] resize-none"
          style={{ backgroundColor: 'var(--color-surface)', border: `1px solid ${errors[name] ? '#f87171' : 'var(--color-border)'}` }}
        />
      ) : (
        <input
          {...register(name)}
          type={type}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl text-[var(--color-text)] text-sm placeholder-[var(--color-text-muted)]"
          style={{ backgroundColor: 'var(--color-surface)', border: `1px solid ${errors[name] ? '#f87171' : 'var(--color-border)'}` }}
        />
      )}
      {errors[name] && <p className="text-xs text-red-400">{errors[name].message}</p>}
    </div>
  )

  return (
    <div className="px-3 py-5 space-y-4 pb-24">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-1">
          {t('steps.6.title')}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">{t('steps.6.desc')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field name="name" label={t('contact.name_label')} placeholder={t('contact.name_placeholder')} required />
        <Field name="email" label={t('contact.email_label')} placeholder={t('contact.email_placeholder')} type="email" required />
        <Field name="phone" label={t('contact.phone_label')} placeholder={t('contact.phone_placeholder')} type="tel" />
        <Field name="message" label={t('contact.message_label')} placeholder={t('contact.message_placeholder')} rows={3} />

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={store.prevStep}
            className="flex-1 py-4 rounded-xl font-semibold text-sm border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            {t('common.back')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-[2] py-4 rounded-xl font-semibold text-sm disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-accent)', color: '#0f0f11' }}
          >
            {submitting ? t('contact.submitting') : t('contact.submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
