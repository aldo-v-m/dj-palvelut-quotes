import React from 'react'
import { useTranslation } from 'react-i18next'
import useQuoteStore from '../../store/quoteStore'

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const setLanguage = useQuoteStore((s) => s.setLanguage)
  const language = useQuoteStore((s) => s.language)

  const toggle = () => {
    const next = language === 'en' ? 'fi' : 'en'
    setLanguage(next)
    i18n.changeLanguage(next)
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
      style={{ backgroundColor: 'var(--color-accent)', color: '#0a130c' }}
      aria-label="Toggle language"
    >
      <span>{language === 'en' ? '🇬🇧' : '🇫🇮'}</span>
      <span>{language === 'en' ? 'EN' : 'FI'}</span>
    </button>
  )
}
