import React from 'react'
import useQuoteStore from '../../store/quoteStore'

export default function ProgressBar() {
  const currentStep = useQuoteStore((s) => s.currentStep)
  const progress = Math.round((currentStep / 6) * 100)

  return (
    <div className="w-full h-0.5 bg-[var(--color-border)]">
      <div
        className="h-full bg-[var(--color-accent)] transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
