import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import useQuoteStore from './store/quoteStore'
import { useQuoteCalculator } from './hooks/useQuoteCalculator'
import StepIndicator from './components/Layout/StepIndicator'
import LanguageToggle from './components/Layout/LanguageToggle'
import ProgressBar from './components/Layout/ProgressBar'
import StickyQuoteSummary from './components/Layout/StickyQuoteSummary'
import Step1_EventDetails from './components/steps/Step1_EventDetails'
import Step3_Services from './components/steps/Step3_Services'
import Step4_Customization from './components/steps/Step4_Customization'
import Step5_Quote from './components/steps/Step5_Quote'
import Step6_Contact from './components/steps/Step6_Contact'
import AdminPanel from './components/AdminPanel'
import QuickContact from './components/QuickContact'
import { trackStepView } from './utils/analytics'
import { initSession, updateSession } from './utils/analyticsTracker'

const STEPS = [
  Step1_EventDetails,
  Step3_Services,
  Step4_Customization,
  Step6_Contact,
  Step5_Quote
]

const SLIDE_VARIANTS = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 })
}

const SPRING = { type: 'spring', stiffness: 300, damping: 30 }

export default function App() {
  const { currentStep, language, restoreState, resetState } = useQuoteStore()
  const quote = useQuoteCalculator()
  const [direction, setDirection] = React.useState(1)
  const prevStepRef = useRef(currentStep)
  const [isAdmin, setIsAdmin] = useState(window.location.hash === '#admin')
  const [isQuick, setIsQuick] = useState(window.location.hash === '#quick')

  // Show resume banner when persisted session has progress, but not on shared-quote loads
  const [showResumeBanner, setShowResumeBanner] = useState(() => {
    const hash = window.location.hash?.slice(1)
    const isSpecialHash = hash === 'admin' || hash === 'quick'
    const isSharedQuote = hash && !isSpecialHash
    return currentStep > 0 && !isSharedQuote
  })

  const lang = language

  const handleReset = () => {
    resetState()
    setShowResumeBanner(false)
  }

  // Listen for hash changes to toggle modes
  useEffect(() => {
    const onHash = () => {
      setIsAdmin(window.location.hash === '#admin')
      setIsQuick(window.location.hash === '#quick')
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Restore state from URL hash (quote sharing) — unicode-safe
  useEffect(() => {
    const hash = window.location.hash?.slice(1)
    if (hash && hash !== 'admin' && hash !== 'quick') {
      try {
        const state = JSON.parse(decodeURIComponent(escape(atob(hash))))
        restoreState({ ...state, currentStep: 5 })
        setShowResumeBanner(false)
      } catch {
        // Invalid hash — ignore
      }
    }
  }, [])

  // Track direction for slide animation + GA step view + analytics
  useEffect(() => {
    setDirection(currentStep > prevStepRef.current ? 1 : -1)
    prevStepRef.current = currentStep
    trackStepView(currentStep)

    const s = useQuoteStore.getState()
    const snapshot = {
      language:         s.language,
      eventType:        s.eventDetails.eventType,
      eventDate:        s.eventDetails.date,
      guestCount:       s.eventDetails.guestCount,
      location:         s.location.address,
      distanceKm:       s.location.distanceKm,
      selectedServices: s.selectedServices,
      quoteTotal:       quote.total,
      quoteId:          s.quoteId,
    }

    if (currentStep === 0) {
      initSession(s.language)
    } else {
      updateSession(currentStep, snapshot)
    }
  }, [currentStep])

  // Auto-resize for Squarespace iframe embed
  useEffect(() => {
    let lastHeight = 0
    const sendHeight = () => {
      const height = document.getElementById('root')?.offsetHeight || document.documentElement.scrollHeight
      if (height !== lastHeight) {
        lastHeight = height
        window.parent?.postMessage({ type: 'resize', height }, '*')
      }
    }
    const observer = new ResizeObserver(sendHeight)
    observer.observe(document.getElementById('root') || document.body)
    return () => observer.disconnect()
  }, [])

  const StepComponent = STEPS[currentStep]

  if (isAdmin) return <AdminPanel />
  if (isQuick) return <QuickContact onBack={() => { window.location.hash = ''; setIsQuick(false) }} />

  return (
    <div style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-[680px] mx-auto">
        {/* Resume session banner */}
        {showResumeBanner && currentStep > 0 && (
          <div
            className="mx-3 mt-3 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-sm"
            style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <span style={{ color: '#6ee7b7' }}>
              {lang === 'fi' ? '👋 Jatketaan siitä mihin jäit' : '👋 Continuing where you left off'}
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleReset}
                className="text-xs underline"
                style={{ color: 'rgba(110,231,183,0.55)' }}
              >
                {lang === 'fi' ? 'Aloita alusta' : 'Start fresh'}
              </button>
              <button
                onClick={() => setShowResumeBanner(false)}
                className="text-xs font-medium px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#6ee7b7' }}
              >
                {lang === 'fi' ? 'Jatka' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 pt-3 pb-1">
          <div className="flex-1">
            <ProgressBar />
          </div>
          <LanguageToggle />
          {currentStep > 0 && (
            <button
              onClick={handleReset}
              title={lang === 'fi' ? 'Aloita alusta' : 'Start fresh'}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={{
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)'
              }}
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>

        <StepIndicator />

        <div className="relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING}
            >
              <StepComponent />
            </motion.div>
          </AnimatePresence>
        </div>

        <StickyQuoteSummary />
      </div>
    </div>
  )
}
