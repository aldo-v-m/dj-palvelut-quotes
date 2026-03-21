import React from 'react'
import { getWeekNumber } from '../../config/holidays'

export default function DatePicker({ value, onChange, label }) {
  const today = new Date().toISOString().split('T')[0]
  const weekNum = value ? getWeekNumber(new Date(value)) : null

  return (
    <div className="space-y-1">
      {label && <label className="text-sm text-[var(--color-text-muted)]">{label}</label>}
      <div className="relative">
        <input
          type="date"
          value={value || ''}
          min={today}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-[var(--color-text)] text-sm appearance-none"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            colorScheme: 'dark'
          }}
        />
        {weekNum && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]">
            Wk {weekNum}
          </span>
        )}
      </div>
    </div>
  )
}
