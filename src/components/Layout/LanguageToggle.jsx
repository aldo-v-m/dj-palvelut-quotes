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
      className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors px-2 py-1 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)]"
      aria-label="Toggle language"
    >
      <span>{language === 'en' ? '🇬🇧' : '🇫🇮'}</span>
      <span>{language === 'en' ? 'EN' : 'FI'}</span>
    </button>
  )
}
