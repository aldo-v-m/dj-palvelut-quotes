import { describe, it, expect } from 'vitest'
import { filterByDateRange, computeStepData, computeHighestFriction, computeAvgQuote, computeConversionRate } from '../../src/components/AnalyticsTab.jsx'

describe('filterByDateRange', () => {
  const now = Date.now()
  const recent  = { startedAt: new Date(now - 1 * 86400000).toISOString() }   // 1 day ago
  const old     = { startedAt: new Date(now - 40 * 86400000).toISOString() }  // 40 days ago

  it('returns all sessions when range is 0 (All)', () => {
    expect(filterByDateRange([recent, old], 0)).toHaveLength(2)
  })

  it('filters to last 30 days', () => {
    const result = filterByDateRange([recent, old], 30)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(recent)
  })
})

describe('computeConversionRate', () => {
  it('returns 0 for empty sessions', () => {
    expect(computeConversionRate([])).toBe(0)
  })

  it('calculates percentage of converted sessions', () => {
    const sessions = [
      { converted: true },
      { converted: true },
      { converted: false },
      { converted: false },
    ]
    expect(computeConversionRate(sessions)).toBe(50)
  })
})

describe('computeAvgQuote', () => {
  it('returns null for no converted sessions', () => {
    expect(computeAvgQuote([])).toBeNull()
  })

  it('averages quoteTotal of converted sessions only', () => {
    const sessions = [
      { converted: true,  quoteTotal: 1000 },
      { converted: true,  quoteTotal: 2000 },
      { converted: false, quoteTotal: 500  },
    ]
    expect(computeAvgQuote(sessions)).toBe(1500)
  })
})

describe('computeStepData', () => {
  it('returns 7 entries', () => {
    expect(computeStepData([])).toHaveLength(7)
  })

  it('counts sessions at each furthest step', () => {
    const sessions = [
      { furthestStep: 1 },
      { furthestStep: 3 },
      { furthestStep: 3 },
    ]
    const data = computeStepData(sessions)
    // All 3 reached step 1 (furthestStep >= 1)
    expect(data[1].reached).toBe(3)
    // Only 2 reached step 3
    expect(data[3].reached).toBe(2)
    // 1 session dropped at step 1 (furthestStep === 1)
    expect(data[1].droppedHere).toBe(1)
  })
})

describe('computeHighestFriction', () => {
  it('returns step with highest dropOff when no timing data', () => {
    const stepData = [
      { index: 0, dropOffRate: 0.05, avgTime: null },
      { index: 1, dropOffRate: 0.40, avgTime: null }, // highest drop-off
      { index: 2, dropOffRate: 0.10, avgTime: null },
    ]
    const result = computeHighestFriction(stepData)
    expect(result.index).toBe(1)
  })
})
