import React from 'react'
import useQuoteStore from '../../store/quoteStore'

const STEPS = 7

export default function StepIndicator() {
  const currentStep = useQuoteStore((s) => s.currentStep)

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {Array.from({ length: STEPS }).map((_, i) => {
        const isCompleted = i < currentStep
        const isActive = i === currentStep
        return (
          <div
            key={i}
            className={`transition-all duration-300 rounded-full ${
              isCompleted
                ? 'w-6 h-2 bg-[var(--color-accent)]'
                : isActive
                ? 'w-8 h-2 bg-white'
                : 'w-2 h-2 bg-[var(--color-border)]'
            }`}
          />
        )
      })}
    </div>
  )
}
