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
    const lang = 'fi'  // Finnish is always the default
    setDetected(lang)
    let count = 30
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
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-[var(--color-text)] mb-3">
          {t('language.select_title')}
        </h1>
        <p className="text-base text-[var(--color-text-muted)] max-w-xs mx-auto leading-relaxed">
          {t('language.select_subtitle')}
        </p>
        <p className="text-sm font-medium mt-3" style={{ color: 'var(--color-accent)' }}>
          {t('language.cta_tagline')}
        </p>
        {detected && countdown !== null && countdown > 0 && (
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            {t('language.auto_advance', { seconds: countdown })}
          </p>
        )}
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        {[
          { code: 'fi', label: t('language.finnish'), flag: '🇫🇮' },
          { code: 'en', label: t('language.english'), flag: '🇬🇧' }
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

      {/* Just call me — opens quick lead capture */}
      <button
        onClick={() => { window.location.hash = 'quick' }}
        className="mt-4 flex items-center justify-center gap-2 w-full max-w-sm py-3.5 rounded-2xl font-semibold text-sm transition-all"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
      >
        📞 {t('language.just_call_me')}
      </button>

      <button
        onClick={nextStep}
        className="mt-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        {t('common.skip')} →
      </button>
    </div>
  )
}
