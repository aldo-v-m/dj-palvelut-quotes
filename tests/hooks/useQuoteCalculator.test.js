import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useQuoteCalculator } from '../../src/hooks/useQuoteCalculator'
import useQuoteStore from '../../src/store/quoteStore'
import usePricingStore from '../../src/store/pricingStore'
import defaultPricing from '../../src/config/pricing.json'

function setup({ services = [], durationHours = 4, distanceKm = null, addons = {}, addonQuantities = {} } = {}) {
  localStorage.clear()
  useQuoteStore.getState().resetState()
  usePricingStore.setState({ pricing: defaultPricing })
  useQuoteStore.setState((s) => ({
    eventDetails: { ...s.eventDetails, durationHours },
    selectedServices: services,
    location: { ...s.location, distanceKm },
    addons,
    addonQuantities
  }))
}

describe('useQuoteCalculator', () => {
  beforeEach(() => setup())

  describe('no services', () => {
    it('returns zero total', () => {
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.total).toBe(0)
    })
  })

  describe('DJ service pricing', () => {
    it('charges base price when duration ≤ min hours (5h)', () => {
      setup({ services: ['dj'], durationHours: 4 })
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.total).toBe(450)
    })

    it('charges base price at exactly min hours (5h)', () => {
      setup({ services: ['dj'], durationHours: 5 })
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.total).toBe(450)
    })

    it('adds €50/h for each hour beyond 5h', () => {
      setup({ services: ['dj'], durationHours: 7 })
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.total).toBe(550) // 450 + 2 × 50
    })

    it('handles fractional extra hours correctly', () => {
      setup({ services: ['dj'], durationHours: 5.5 })
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.total).toBe(475) // 450 + 0.5 × 50
    })
  })

  describe('flat-fee services', () => {
    it('Audio is flat fee regardless of duration', () => {
      setup({ services: ['audio'], durationHours: 12 })
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.total).toBe(200)
    })

    it('Lighting is flat fee', () => {
      setup({ services: ['lighting'], durationHours: 10 })
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.total).toBe(100)
    })

    it('Karaoke (special_fx) is flat fee', () => {
      setup({ services: ['special_fx'], durationHours: 8 })
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.total).toBe(150)
    })
  })

  describe('package discounts', () => {
    it('single service has no discount', () => {
      setup({ services: ['dj'], durationHours: 4 })
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.packageDiscountRate).toBe(0)
      expect(Math.abs(result.current.packageDiscount)).toBe(0) // avoid -0 vs 0 comparison
    })

    it('2 services get 5% discount', () => {
      setup({ services: ['dj', 'audio'], durationHours: 4 })
      const { result } = renderHook(() => useQuoteCalculator())
      const base = 450 + 200 // 650
      expect(result.current.packageDiscountRate).toBe(0.05)
      expect(result.current.packageDiscount).toBe(-Math.round(base * 0.05 * 100) / 100)
      expect(result.current.total).toBe(Math.round(base * 0.95 * 100) / 100)
    })

    it('3 services get 10% discount', () => {
      setup({ services: ['dj', 'audio', 'lighting'], durationHours: 4 })
      const { result } = renderHook(() => useQuoteCalculator())
      const base = 450 + 200 + 100 // 750
      expect(result.current.packageDiscountRate).toBe(0.10)
      expect(result.current.total).toBe(Math.round(base * 0.90 * 100) / 100)
    })

    it('4 services get 15% discount', () => {
      setup({ services: ['dj', 'audio', 'lighting', 'special_fx'], durationHours: 4 })
      const { result } = renderHook(() => useQuoteCalculator())
      const base = 450 + 200 + 100 + 150 // 900
      expect(result.current.packageDiscountRate).toBe(0.15)
      expect(result.current.total).toBe(Math.round(base * 0.85 * 100) / 100)
    })

    it('discount applies to core services only, not extras', () => {
      setup({
        services: ['dj', 'audio'],
        durationHours: 4,
        addons: { extras: ['titis_magic'] },
        addonQuantities: { extras_titis_magic: 1 }
      })
      const { result } = renderHook(() => useQuoteCalculator())
      const coreBase = 450 + 200 // 650
      const discountedCore = Math.round(coreBase * 0.95 * 100) / 100
      const extrasTotal = 300
      expect(result.current.total).toBe(discountedCore + extrasTotal)
    })
  })

  describe('travel fee', () => {
    it('no travel fee within free zone (≤30km)', () => {
      setup({ services: ['dj'], distanceKm: 25 })
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.travelFee).toBe(0)
    })

    it('no travel fee at exactly 30km boundary', () => {
      setup({ services: ['dj'], distanceKm: 30 })
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.travelFee).toBe(0)
    })

    it('charges travel fee beyond free zone', () => {
      setup({ services: ['dj'], distanceKm: 50 })
      const { result } = renderHook(() => useQuoteCalculator())
      // (50 - 30) × 0.46 × 2 = 18.40
      expect(result.current.travelFee).toBe(18.40)
    })

    it('travel fee is added to total', () => {
      setup({ services: ['dj'], durationHours: 4, distanceKm: 50 })
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.total).toBe(450 + 18.40)
    })

    it('marks outOfRange for >250km', () => {
      setup({ services: ['dj'], distanceKm: 300 })
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.outOfRange).toBe(true)
      expect(result.current.travelFee).toBe(0) // no charge — partner referral
    })

    it('no travel fee when distanceKm is null', () => {
      setup({ services: ['dj'], distanceKm: null })
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.travelFee).toBe(0)
    })
  })

  describe('addons', () => {
    it('adds smoke machine cost to lighting', () => {
      setup({
        services: ['lighting'],
        addons: { lighting: ['smoke_machine'] }
      })
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.total).toBe(150) // 100 + 50
    })

    it('adds ambient lighting addon', () => {
      setup({
        services: ['lighting'],
        addons: { lighting: ['ambient_lighting'] }
      })
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.total).toBe(250) // 100 + 150
    })

    it('respects addon quantity for dancers', () => {
      setup({
        services: [],
        addons: { extras: ['titis_magic'] },
        addonQuantities: { extras_titis_magic: 2 }
      })
      const { result } = renderHook(() => useQuoteCalculator())
      expect(result.current.total).toBe(600) // 2 × 300
    })
  })

  describe('combined scenarios', () => {
    it('3 services + travel + extra DJ hours', () => {
      setup({ services: ['dj', 'audio', 'lighting'], durationHours: 7, distanceKm: 80 })
      const { result } = renderHook(() => useQuoteCalculator())
      // DJ: 450 + 2×50 = 550, Audio: 200, Lighting: 100 → base = 850
      // 10% discount: 850 × 0.90 = 765
      // Travel: (80-30) × 0.46 × 2 = 46
      // Total: 765 + 46 = 811
      expect(result.current.total).toBe(811)
    })
  })
})
