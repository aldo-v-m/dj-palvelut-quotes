import React from 'react'

const MARKS = [2, 4, 6, 8, 10, 12]

export default function DurationSlider({ value, onChange, label }) {
  return (
    <div className="space-y-3">
      {label && <label className="text-sm text-[var(--color-text-muted)]">{label}</label>}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={2}
          max={12}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: 'var(--color-accent)' }}
        />
        <span className="text-[var(--color-accent)] font-semibold text-sm w-16 text-right">
          {value}h
        </span>
      </div>
      <div className="flex justify-between px-0.5">
        {MARKS.map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`text-xs transition-colors ${
              value === m
                ? 'text-[var(--color-accent)] font-semibold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {m}h
          </button>
        ))}
      </div>
    </div>
  )
}
