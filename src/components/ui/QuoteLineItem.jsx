import React from 'react'

export default function QuoteLineItem({ label, amount, muted, green, bold, indent }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${indent ? 'pl-4' : ''}`}>
      <span className={`text-sm ${muted ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'} ${bold ? 'font-semibold' : ''}`}>
        {label}
      </span>
      <span className={`text-sm font-medium ${green ? 'text-[var(--color-success)]' : muted ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'} ${bold ? 'font-bold' : ''}`}>
        {amount}
      </span>
    </div>
  )
}
