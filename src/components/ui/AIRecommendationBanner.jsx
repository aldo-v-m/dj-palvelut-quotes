import React from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Loader } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useQuoteStore from '../../store/quoteStore'

export default function AIRecommendationBanner({ onApply }) {
  const { t, i18n } = useTranslation()
  const aiRecommendation = useQuoteStore((s) => s.aiRecommendation)
  const aiLoading = useQuoteStore((s) => s.aiLoading)

  if (!aiLoading && !aiRecommendation) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-xl p-4 mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(232,201,126,0.1), rgba(126,184,232,0.1))',
          border: '1px solid rgba(232,201,126,0.3)'
        }}
      >
        <div className="flex items-start gap-3">
          {aiLoading ? (
            <>
              <Loader size={18} className="mt-0.5 animate-spin text-[var(--color-accent)]" />
              <div className="flex-1">
                <div className="h-4 w-32 rounded animate-pulse bg-white/10 mb-2" />
                <div className="h-3 w-full rounded animate-pulse bg-white/10" />
              </div>
            </>
          ) : (
            <>
              <Sparkles size={18} className="mt-0.5 text-[var(--color-accent)]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-accent)] mb-1">
                  {t('ai.title')}
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mb-3">
                  {i18n.language === 'fi' ? aiRecommendation.message_fi : aiRecommendation.message_en}
                </p>
                <button
                  onClick={onApply}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--color-accent)', color: '#0f0f11' }}
                >
                  {t('services.apply_recommendation')}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
