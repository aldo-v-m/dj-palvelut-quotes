import { create } from 'zustand'
import defaultPricing from '../config/pricing.json'

const STORAGE_KEY = 'dj_pricing_override'
const SETTINGS_KEY = 'dj_app_settings'

function loadPricing() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return defaultPricing
}

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } catch { return {} }
}

const usePricingStore = create((set, get) => ({
  pricing: loadPricing(),
  showSpecialExtras: loadSettings().showSpecialExtras ?? false,
  hidePricingDuringForm: loadSettings().hidePricingDuringForm ?? true,
  requirePhone: loadSettings().requirePhone ?? false,

  setPricing: (pricing) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pricing))
    set({ pricing })
  },

  resetPricing: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ pricing: defaultPricing })
  },

  isOverridden: () => !!localStorage.getItem(STORAGE_KEY),

  setShowSpecialExtras: (val) => {
    const s = loadSettings()
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...s, showSpecialExtras: val }))
    set({ showSpecialExtras: val })
  },

  setHidePricingDuringForm: (val) => {
    const s = loadSettings()
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...s, hidePricingDuringForm: val }))
    set({ hidePricingDuringForm: val })
  },

  setRequirePhone: (val) => {
    const s = loadSettings()
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...s, requirePhone: val }))
    set({ requirePhone: val })
  }
}))

export default usePricingStore
