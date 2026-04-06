import React from 'react'
import useQuoteStore from '../../store/quoteStore'

const STEPS = 5

export default function StepIndicator() {
  const currentStep = useQuoteStore((s) => s.currentStep)
  const goToStep = useQuoteStore((s) => s.goToStep)

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {Array.from({ length: STEPS }).map((_, i) => {
        const isCompleted = i < currentStep
        const isActive = i === currentStep
        const isClickable = i < currentStep
        return (
          <button
            key={i}
            onClick={() => isClickable && goToStep(i)}
            className={`transition-all duration-300 rounded-full ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'} ${
              isCompleted
                ? 'w-6 h-2 bg-[var(--color-accent)]'
                : isActive
                ? 'w-8 h-2 bg-white'
                : 'w-2 h-2 bg-[var(--color-border)]'
            }`}
            title={isClickable ? `Go to step ${i}` : undefined}
          />
        )
      })}
    </div>
  )
}
