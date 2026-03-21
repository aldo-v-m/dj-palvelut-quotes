import React, { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useQuoteStore from './store/quoteStore'
import StepIndicator from './components/Layout/StepIndicator'
import LanguageToggle from './components/Layout/LanguageToggle'
import ProgressBar from './components/Layout/ProgressBar'
import StickyQuoteSummary from './components/Layout/StickyQuoteSummary'
import Step0_Language from './components/steps/Step0_Language'
import Step1_EventDetails from './components/steps/Step1_EventDetails'
import Step2_Location from './components/steps/Step2_Location'
import Step3_Services from './components/steps/Step3_Services'
import Step4_Customization from './components/steps/Step4_Customization'
import Step5_Quote from './components/steps/Step5_Quote'
import Step6_Contact from './components/steps/Step6_Contact'

const STEPS = [
  Step0_Language,
  Step1_EventDetails,
  Step2_Location,
  Step3_Services,
  Step4_Customization,
  Step5_Quote,
  Step6_Contact
]

const SLIDE_VARIANTS = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 })
}

const SPRING = { type: 'spring', stiffness: 300, damping: 30 }

export default function App() {
  const { currentStep, restoreState } = useQuoteStore()
  const [direction, setDirection] = React.useState(1)
  const prevStepRef = useRef(currentStep)

  // Restore state from URL hash (quote sharing)
  useEffect(() => {
    const hash = window.location.hash?.slice(1)
    if (hash) {
      try {
        const state = JSON.parse(atob(hash))
        restoreState({ ...state, currentStep: 5 })
      } catch {
        // Invalid hash — ignore
      }
    }
  }, [])

  // Track direction for slide animation
  useEffect(() => {
    setDirection(currentStep > prevStepRef.current ? 1 : -1)
    prevStepRef.current = currentStep
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-[780px] mx-auto">
        {currentStep > 0 && (
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <div className="flex-1">
              <ProgressBar />
            </div>
            <LanguageToggle />
          </div>
        )}

        {currentStep > 0 && <StepIndicator />}

        <div className="relative overflow-hidden">
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
