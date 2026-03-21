import React, { useRef } from 'react'
import { CalendarDays } from 'lucide-react'
import { getWeekNumber } from '../../config/holidays'

export default function DatePicker({ value, onChange, label }) {
  const inputRef = useRef(null)
  const today = new Date().toISOString().split('T')[0]
  const weekNum = value ? getWeekNumber(new Date(value)) : null

  const openPicker = () => {
    try { inputRef.current?.showPicker() } catch { inputRef.current?.click() }
  }

  return (
    <div className="space-y-1">
      {label && <label className="text-sm text-[var(--color-text-muted)]">{label}</label>}
      <div
        className="relative flex items-center rounded-xl cursor-pointer"
        style={{ backgroundColor: 'var(--color-surface)', border: `1px solid ${value ? 'var(--color-accent)' : 'var(--color-border)'}` }}
        onClick={openPicker}
      >
        <CalendarDays size={16} className="absolute left-4 pointer-events-none" style={{ color: value ? 'var(--color-accent)' : 'var(--color-text-muted)' }} />
        <input
          ref={inputRef}
          type="date"
          value={value || ''}
          min={today}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm cursor-pointer"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: value ? 'var(--color-text)' : 'var(--color-text-muted)',
            colorScheme: 'dark'
          }}
        />
        {weekNum && (
          <span className="absolute right-3 text-xs text-[var(--color-text-muted)] pointer-events-none">
            Wk {weekNum}
          </span>
        )}
      </div>
      {!value && (
        <p className="text-xs text-[var(--color-text-muted)] pl-1">Tap to open calendar</p>
      )}
    </div>
  )
}
