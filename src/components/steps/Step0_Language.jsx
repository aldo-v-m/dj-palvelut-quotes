import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import useQuoteStore from '../../store/quoteStore'

export default function Step0_Language() {
  const { t, i18n } = useTranslation()
  const { setLanguage, nextStep } = useQuoteStore()
  const [countdown, setCountdown] = useState(null)
  const [detected, setDetected] = useState(null)

  useEffect(() => {
    const lang = navigator.language?.startsWith('fi') ? 'fi' : 'en'
    setDetected(lang)
    let count = 2
    setCountdown(count)
    const interval = setInterval(() => {
      count--
      setCountdown(count)
      if (count <= 0) {
        clearInterval(interval)
        setLanguage(lang)
        i18n.changeLanguage(lang)
        nextStep()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const selectLanguage = (lang) => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
    nextStep()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-[var(--color-text)] mb-3">
          {t('language.select_title')}
        </h1>
        <p className="text-[var(--color-text-muted)]">{t('language.select_subtitle')}</p>
        {detected && countdown !== null && countdown > 0 && (
          <p className="text-xs text-[var(--color-text-muted)] mt-3">
            {t('language.auto_advance', { seconds: countdown })}
          </p>
        )}
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        {[
          { code: 'en', label: t('language.english'), flag: '🇬🇧' },
          { code: 'fi', label: t('language.finnish'), flag: '🇫🇮' }
        ].map(({ code, label, flag }) => (
          <motion.button
            key={code}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => selectLanguage(code)}
            className="flex-1 flex flex-col items-center gap-3 p-8 rounded-2xl transition-all"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: detected === code ? '2px solid var(--color-accent)' : '1px solid var(--color-border)'
            }}
          >
            <span className="text-4xl">{flag}</span>
            <span className="font-semibold text-[var(--color-text)]">{label}</span>
            {detected === code && countdown !== null && countdown > 0 && (
              <span className="text-xs text-[var(--color-accent)]">{countdown}s</span>
            )}
          </motion.button>
        ))}
      </div>

      <button
        onClick={nextStep}
        className="mt-8 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        {t('common.skip')} →
      </button>
    </div>
  )
}
