import { describe, it, expect, vi, beforeEach } from 'vitest'

// We test the null-guard behavior (Airtable not configured) synchronously.
// Full integration requires a real Airtable base — unit tests cover guard + shape.

describe('createAnalyticsSession', () => {
  it('returns null when Airtable is not configured', async () => {
    // Import after clearing env so getBase() returns null
    vi.stubEnv('VITE_AIRTABLE_API_KEY', '')
    vi.stubEnv('VITE_AIRTABLE_BASE_ID', '')
    // Reset module cache so getBase re-evaluates
    vi.resetModules()
    const { createAnalyticsSession } = await import('../../src/utils/airtable.js')
    const result = await createAnalyticsSession({ sessionId: 'test' })
    expect(result).toBeNull()
  })
})

describe('updateAnalyticsSession', () => {
  it('returns undefined without throwing when Airtable is not configured', async () => {
    vi.stubEnv('VITE_AIRTABLE_API_KEY', '')
    vi.stubEnv('VITE_AIRTABLE_BASE_ID', '')
    vi.resetModules()
    const { updateAnalyticsSession } = await import('../../src/utils/airtable.js')
    await expect(updateAnalyticsSession('rec123', { converted: true })).resolves.toBeUndefined()
  })
})

describe('fetchAnalyticsSessions', () => {
  it('returns empty array when Airtable is not configured', async () => {
    vi.stubEnv('VITE_AIRTABLE_API_KEY', '')
    vi.stubEnv('VITE_AIRTABLE_BASE_ID', '')
    vi.resetModules()
    const { fetchAnalyticsSessions } = await import('../../src/utils/airtable.js')
    const result = await fetchAnalyticsSessions()
    expect(result).toEqual([])
  })
})
