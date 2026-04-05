import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock airtable utilities
vi.mock('../../src/utils/airtable.js', () => ({
  createAnalyticsSession: vi.fn().mockResolvedValue({ id: 'rec_abc123' }),
  updateAnalyticsSession: vi.fn().mockResolvedValue(undefined),
}))

// Reset sessionStorage between tests
beforeEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('initSession', () => {
  it('creates an Airtable record and stores IDs in sessionStorage', async () => {
    const { initSession } = await import('../../src/utils/analyticsTracker.js')
    const { createAnalyticsSession } = await import('../../src/utils/airtable.js')

    await initSession('en')

    expect(createAnalyticsSession).toHaveBeenCalledOnce()
    const call = createAnalyticsSession.mock.calls[0][0]
    expect(call.sessionId).toBeTruthy()
    expect(call.language).toBe('en')
    expect(call.furthestStep).toBe(1)
    expect(call.backNavigations).toBe(0)

    expect(sessionStorage.getItem('djp_session_id')).toBeTruthy()
    expect(sessionStorage.getItem('djp_record_id')).toBe('rec_abc123')
    expect(sessionStorage.getItem('djp_prev_step')).toBe('1')
  })

  it('does not create a second record if session already exists', async () => {
    sessionStorage.setItem('djp_session_id', 'existing-id')
    const { initSession } = await import('../../src/utils/analyticsTracker.js')
    const { createAnalyticsSession } = await import('../../src/utils/airtable.js')

    await initSession('fi')

    expect(createAnalyticsSession).not.toHaveBeenCalled()
  })
})

describe('updateSession', () => {
  it('does nothing when no record ID is in sessionStorage', async () => {
    const { updateSession } = await import('../../src/utils/analyticsTracker.js')
    const { updateAnalyticsSession } = await import('../../src/utils/airtable.js')

    await updateSession(2, {})

    expect(updateAnalyticsSession).not.toHaveBeenCalled()
  })

  it('increments backNavigations when step decreases', async () => {
    sessionStorage.setItem('djp_record_id', 'rec_abc123')
    sessionStorage.setItem('djp_prev_step', '3')
    sessionStorage.setItem('djp_back_nav', '0')
    sessionStorage.setItem('djp_step_ts', '{}')

    const { updateSession } = await import('../../src/utils/analyticsTracker.js')
    const { updateAnalyticsSession } = await import('../../src/utils/airtable.js')

    await updateSession(2, {})

    const patch = updateAnalyticsSession.mock.calls[0][1]
    expect(patch.backNavigations).toBe(1)
  })

  it('does not increment backNavigations when step advances', async () => {
    sessionStorage.setItem('djp_record_id', 'rec_abc123')
    sessionStorage.setItem('djp_prev_step', '2')
    sessionStorage.setItem('djp_back_nav', '1')
    sessionStorage.setItem('djp_step_ts', '{}')

    const { updateSession } = await import('../../src/utils/analyticsTracker.js')
    const { updateAnalyticsSession } = await import('../../src/utils/airtable.js')

    await updateSession(3, {})

    const patch = updateAnalyticsSession.mock.calls[0][1]
    expect(patch.backNavigations).toBe(1) // unchanged
  })

  it('does not overwrite an existing step timestamp', async () => {
    const existingTs = { '2': '2026-01-01T10:00:00.000Z' }
    sessionStorage.setItem('djp_record_id', 'rec_abc123')
    sessionStorage.setItem('djp_prev_step', '2')
    sessionStorage.setItem('djp_back_nav', '0')
    sessionStorage.setItem('djp_step_ts', JSON.stringify(existingTs))

    const { updateSession } = await import('../../src/utils/analyticsTracker.js')
    const { updateAnalyticsSession } = await import('../../src/utils/airtable.js')

    await updateSession(2, {})

    const patch = updateAnalyticsSession.mock.calls[0][1]
    const ts = JSON.parse(patch.stepTimestamps)
    expect(ts['2']).toBe('2026-01-01T10:00:00.000Z') // preserved
  })
})

describe('completeSession', () => {
  it('does nothing when no record ID exists', async () => {
    const { completeSession } = await import('../../src/utils/analyticsTracker.js')
    const { updateAnalyticsSession } = await import('../../src/utils/airtable.js')

    await completeSession()

    expect(updateAnalyticsSession).not.toHaveBeenCalled()
  })

  it('sets converted: true on the Airtable record', async () => {
    sessionStorage.setItem('djp_record_id', 'rec_abc123')

    const { completeSession } = await import('../../src/utils/analyticsTracker.js')
    const { updateAnalyticsSession } = await import('../../src/utils/airtable.js')

    await completeSession()

    expect(updateAnalyticsSession).toHaveBeenCalledWith('rec_abc123', expect.objectContaining({ converted: true }))
  })
})
