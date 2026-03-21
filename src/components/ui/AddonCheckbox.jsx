import React from 'react'
import { Check, Plus, Minus } from 'lucide-react'

export default function AddonCheckbox({ addonId, label, description, price, per, checked, onToggle, quantity, onQuantityChange, showQuantity }) {
  const perLabel = per === 'unit' ? '/unit' : per === 'shot' ? '/shot' : '/event'

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl transition-all duration-150 cursor-pointer"
      style={{
        backgroundColor: checked ? 'rgba(232,201,126,0.05)' : 'transparent',
        border: checked ? '1px solid rgba(232,201,126,0.3)' : '1px solid transparent'
      }}
      onClick={() => onToggle(addonId)}
    >
      <div
        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all"
        style={{
          backgroundColor: checked ? 'var(--color-accent)' : 'transparent',
          border: checked ? '2px solid var(--color-accent)' : '2px solid var(--color-border)'
        }}
      >
        {checked && <Check size={12} className="text-black" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
          <span className="text-sm font-semibold text-[var(--color-accent)] whitespace-nowrap">
            +€{price}{perLabel}
          </span>
        </div>
        {description && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{description}</p>
        )}
        {checked && showQuantity && (
          <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
            <button
              className="w-6 h-6 rounded-full border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-accent)] text-[var(--color-text-muted)]"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            >
              <Minus size={12} />
            </button>
            <span className="text-sm font-medium w-6 text-center text-[var(--color-text)]">{quantity}</span>
            <button
              className="w-6 h-6 rounded-full border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-accent)] text-[var(--color-text-muted)]"
              onClick={() => onQuantityChange(quantity + 1)}
            >
              <Plus size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
