import React from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import useQuoteStore from '../../store/quoteStore'
import usePricingStore from '../../store/pricingStore'

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
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const store = useQuoteStore()
  const showSpecialExtras = usePricingStore((s) => s.showSpecialExtras)

  const hasCustomizationOptions =
    store.selectedServices.includes('lighting') ||
    store.selectedServices.includes('audio') ||
    showSpecialExtras

  const handleBack = () => hasCustomizationOptions ? store.prevStep() : store.goToStep(1)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: store.contact.name,
      email: store.contact.email,
      phone: store.contact.phone,
      message: store.contact.message
    }
  })

  const onSubmit = (data) => {
    store.setContact(data)
    store.nextStep()
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
    <div className="px-3 py-5 space-y-4">
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

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 py-4 rounded-xl font-semibold text-sm border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            {t('common.back')}
          </button>
          <button
            type="submit"
            className="flex-[2] py-4 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: 'var(--color-accent)', color: '#0f0f11' }}
          >
            {lang === 'fi' ? 'Katso tarjous →' : 'See Your Quote →'}
          </button>
        </div>
      </form>
    </div>
  )
}
