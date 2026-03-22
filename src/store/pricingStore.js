import { create } from 'zustand'
import defaultPricing from '../config/pricing.json'

const STORAGE_KEY = 'dj_pricing_override'

function loadPricing() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return defaultPricing
}

const usePricingStore = create((set, get) => ({
  pricing: loadPricing(),

  setPricing: (pricing) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pricing))
    set({ pricing })
  },

  resetPricing: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ pricing: defaultPricing })
  },

  isOverridden: () => !!localStorage.getItem(STORAGE_KEY)
}))

export default usePricingStore
