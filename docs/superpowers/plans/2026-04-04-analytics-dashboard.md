# Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a funnel analytics dashboard to the existing `#admin` panel that tracks user behavior across the 7-step quote widget, stores sessions in Airtable, and visualizes drop-off and friction in an Analytics tab.

**Architecture:** A new `analyticsTracker.js` utility creates/updates one Airtable `Analytics` row per browser session (tracked via `sessionStorage`), capturing step timestamps and back-navigation counts. The existing `AdminPanel.jsx` gains a tab bar; the new `AnalyticsTab.jsx` reads all sessions from Airtable and renders summary cards, a funnel chart, a resistance chart, service/event-type breakdowns, and a paginated session table.

**Tech Stack:** React 19, Zustand, Airtable SDK (already installed), Tailwind CSS, Lucide icons, Vitest + jsdom for tests.

---

## Prerequisites (manual, before coding)

1. In your Airtable base (`VITE_AIRTABLE_BASE_ID`), create a table named exactly **`Analytics`**.
2. Add these fields with the specified types:

| Field name | Type |
|---|---|
| `sessionId` | Single line text |
| `startedAt` | Date and time (ISO format) |
| `updatedAt` | Date and time (ISO format) |
| `language` | Single line text |
| `furthestStep` | Number (integer) |
| `converted` | Checkbox |
| `eventType` | Single line text |
| `eventDate` | Single line text |
| `guestCount` | Number |
| `location` | Single line text |
| `distanceKm` | Number |
| `selectedServices` | Single line text |
| `quoteTotal` | Number |
| `quoteId` | Single line text |
| `stepTimestamps` | Long text |
| `backNavigations` | Number (integer) |

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/utils/airtable.js` | Modify | Add `createAnalyticsSession`, `updateAnalyticsSession`, `fetchAnalyticsSessions` |
| `src/utils/analyticsTracker.js` | Create | Session lifecycle: `initSession`, `updateSession`, `completeSession` |
| `src/App.jsx` | Modify | Call tracker on every step change |
| `src/components/steps/Step6_Contact.jsx` | Modify | Call `completeSession` on successful submit |
| `src/components/AdminPanel.jsx` | Modify | Add Pricing/Analytics tab bar |
| `src/components/AnalyticsTab.jsx` | Create | Full analytics dashboard UI |
| `tests/utils/analyticsTracker.test.js` | Create | Unit tests for tracker logic |
| `tests/utils/airtable.analytics.test.js` | Create | Unit tests for new airtable functions |

---

## Task 1: Airtable analytics functions

**Files:**
- Modify: `src/utils/airtable.js`
- Create: `tests/utils/airtable.analytics.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/utils/airtable.analytics.test.js`:

```js
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- tests/utils/airtable.analytics.test.js
```
Expected: FAIL — `createAnalyticsSession is not a function` (or similar)

- [ ] **Step 3: Add three functions to `src/utils/airtable.js`**

Append after the existing `saveQuoteToAirtable` function:

```js
export async function createAnalyticsSession(fields) {
  const b = getBase()
  if (!b) return null
  try {
    const records = await b('Analytics').create([{ fields }])
    return { id: records[0].id }
  } catch (err) {
    console.warn('Analytics create failed:', err)
    return null
  }
}

export async function updateAnalyticsSession(recordId, fields) {
  const b = getBase()
  if (!b) return
  try {
    await b('Analytics').update(recordId, fields)
  } catch (err) {
    console.warn('Analytics update failed:', err)
  }
}

export async function fetchAnalyticsSessions() {
  const b = getBase()
  if (!b) return []
  const records = []
  try {
    await b('Analytics')
      .select({ sort: [{ field: 'startedAt', direction: 'desc' }] })
      .eachPage((page, fetchNext) => {
        page.forEach((r) => records.push({ id: r.id, ...r.fields }))
        if (records.length < 500) fetchNext()
      })
  } catch (err) {
    console.warn('Analytics fetch failed:', err)
  }
  return records
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- tests/utils/airtable.analytics.test.js
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/airtable.js tests/utils/airtable.analytics.test.js
git commit -m "feat: add Airtable analytics CRUD functions"
```

---

## Task 2: Analytics tracker module

**Files:**
- Create: `src/utils/analyticsTracker.js`
- Create: `tests/utils/analyticsTracker.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/utils/analyticsTracker.test.js`:

```js
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- tests/utils/analyticsTracker.test.js
```
Expected: FAIL — module not found

- [ ] **Step 3: Create `src/utils/analyticsTracker.js`**

```js
import { createAnalyticsSession, updateAnalyticsSession } from './airtable.js'

const KEYS = {
  SESSION_ID: 'djp_session_id',
  RECORD_ID:  'djp_record_id',
  PREV_STEP:  'djp_prev_step',
  STEP_TS:    'djp_step_ts',
  BACK_NAV:   'djp_back_nav',
}

function ss(key, value) {
  if (typeof sessionStorage === 'undefined') return null
  if (value !== undefined) { sessionStorage.setItem(key, value); return value }
  return sessionStorage.getItem(key)
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function readTs() {
  try { return JSON.parse(ss(KEYS.STEP_TS) || '{}') } catch { return {} }
}

export async function initSession(language) {
  if (ss(KEYS.SESSION_ID)) return // guard: already initialized this tab
  const now = new Date().toISOString()
  const sessionId = generateId()
  const stepTimestamps = JSON.stringify({ '0': now, '1': now })
  const result = await createAnalyticsSession({
    sessionId,
    startedAt: now,
    updatedAt: now,
    language,
    furthestStep: 1,
    stepTimestamps,
    backNavigations: 0,
  })
  if (result?.id) {
    ss(KEYS.SESSION_ID, sessionId)
    ss(KEYS.RECORD_ID,  result.id)
    ss(KEYS.PREV_STEP,  '1')
    ss(KEYS.STEP_TS,    stepTimestamps)
    ss(KEYS.BACK_NAV,   '0')
  }
}

export async function updateSession(currentStep, snapshot = {}) {
  const recordId = ss(KEYS.RECORD_ID)
  if (!recordId) return

  const prevStep  = parseInt(ss(KEYS.PREV_STEP) || '0', 10)
  const backNav   = parseInt(ss(KEYS.BACK_NAV)  || '0', 10)
  const isBack    = currentStep < prevStep
  const newBackNav = isBack ? backNav + 1 : backNav

  const ts = readTs()
  if (!ts[String(currentStep)]) ts[String(currentStep)] = new Date().toISOString()
  const stepTimestamps = JSON.stringify(ts)

  const furthestStep = Math.max(currentStep, prevStep)

  const patch = {
    updatedAt: new Date().toISOString(),
    furthestStep,
    backNavigations: newBackNav,
    stepTimestamps,
    ...(snapshot.language                                      && { language:         snapshot.language }),
    ...(snapshot.eventType                                     && { eventType:         snapshot.eventType }),
    ...(snapshot.eventDate                                     && { eventDate:         snapshot.eventDate }),
    ...(snapshot.guestCount                                    && { guestCount:        snapshot.guestCount }),
    ...(snapshot.location                                      && { location:          snapshot.location }),
    ...(snapshot.distanceKm != null                            && { distanceKm:        snapshot.distanceKm }),
    ...(snapshot.selectedServices?.length                      && { selectedServices:  snapshot.selectedServices.join(', ') }),
    ...(snapshot.quoteTotal   != null && snapshot.quoteTotal > 0 && { quoteTotal:     snapshot.quoteTotal }),
    ...(snapshot.quoteId                                       && { quoteId:           snapshot.quoteId }),
  }

  await updateAnalyticsSession(recordId, patch)

  ss(KEYS.PREV_STEP, String(currentStep))
  ss(KEYS.STEP_TS,   stepTimestamps)
  ss(KEYS.BACK_NAV,  String(newBackNav))
}

export async function completeSession() {
  const recordId = ss(KEYS.RECORD_ID)
  if (!recordId) return
  await updateAnalyticsSession(recordId, {
    converted:  true,
    updatedAt: new Date().toISOString(),
  })
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- tests/utils/analyticsTracker.test.js
```
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/analyticsTracker.js tests/utils/analyticsTracker.test.js
git commit -m "feat: add analytics session tracker"
```

---

## Task 3: Integrate tracker into App.jsx

**Files:**
- Modify: `src/App.jsx` (lines 1–4 imports, lines 85–89 useEffect)

- [ ] **Step 1: Add import at top of `src/App.jsx`**

After the `trackStepView` import on line 18, add:

```js
import { initSession, updateSession } from './utils/analyticsTracker'
```

Also add the `useQuoteCalculator` import after the store imports:

```js
import { useQuoteCalculator } from './hooks/useQuoteCalculator'
```

- [ ] **Step 2: Call `useQuoteCalculator` inside the `App` component**

After the existing destructuring on line 39:
```js
const { currentStep, language, restoreState, resetState } = useQuoteStore()
```

Add on the next line:
```js
const quote = useQuoteCalculator()
```

- [ ] **Step 3: Extend the step-change `useEffect` (lines 85–89)**

Replace:
```js
useEffect(() => {
  setDirection(currentStep > prevStepRef.current ? 1 : -1)
  prevStepRef.current = currentStep
  trackStepView(currentStep)
}, [currentStep])
```

With:
```js
useEffect(() => {
  setDirection(currentStep > prevStepRef.current ? 1 : -1)
  prevStepRef.current = currentStep
  trackStepView(currentStep)

  const s = useQuoteStore.getState()
  const snapshot = {
    language:         s.language,
    eventType:        s.eventDetails.eventType,
    eventDate:        s.eventDetails.date,
    guestCount:       s.eventDetails.guestCount,
    location:         s.location.address,
    distanceKm:       s.location.distanceKm,
    selectedServices: s.selectedServices,
    quoteTotal:       quote.total,
    quoteId:          s.quoteId,
  }

  if (currentStep === 1) {
    initSession(s.language)
  } else {
    updateSession(currentStep, snapshot)
  }
}, [currentStep])
```

Note: `useQuoteStore.getState()` reads the store synchronously outside React rendering — this is the Zustand-idiomatic way to read state in a side effect without adding it to dependencies.

- [ ] **Step 4: Build to verify no import errors**

```bash
npm run build
```
Expected: build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: trigger analytics tracking on step change"
```

---

## Task 4: Complete session on contact form submit

**Files:**
- Modify: `src/components/steps/Step6_Contact.jsx`

- [ ] **Step 1: Add import**

After the existing `trackLeadSubmitted` import on line 11, add:

```js
import { completeSession } from '../../utils/analyticsTracker'
```

- [ ] **Step 2: Call `completeSession` in the `onSubmit` handler**

In the `try` block (around line 119), after `trackLeadSubmitted(...)` and before `await saveQuoteToAirtable(...)`, add:

```js
completeSession() // fire-and-forget, non-blocking
```

The full try block order should be:
1. EmailJS send
2. `trackLeadSubmitted(...)` ← already there
3. `completeSession()` ← add here
4. `await saveQuoteToAirtable(...)`
5. `sendWhatsApp()`
6. `store.setSubmitted(true)`
7. `setSuccess(true)`

- [ ] **Step 3: Run all tests**

```bash
npm test
```
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/steps/Step6_Contact.jsx
git commit -m "feat: mark analytics session as converted on lead submit"
```

---

## Task 5: AdminPanel tab bar

**Files:**
- Modify: `src/components/AdminPanel.jsx`

- [ ] **Step 1: Add AnalyticsTab import and tab state**

At the top of `AdminPanel.jsx`, add after the existing imports:

```js
import AnalyticsTab from './AnalyticsTab'
```

Inside the `AdminPanel` component function, after the `useState` declarations (around line 38), add:

```js
const [activeTab, setActiveTab] = useState('pricing')
```

- [ ] **Step 2: Replace the authenticated header with a tab bar**

Find the header block inside the authenticated return (around line 126–149):
```jsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold text-[var(--color-text)]">Pricing Admin</h1>
    ...
  </div>
  <div className="flex gap-2">
    ...Save/Reset buttons...
  </div>
</div>
```

Replace it with:
```jsx
{/* Tab bar */}
<div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
  {['pricing', 'analytics'].map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
      style={activeTab === tab
        ? { backgroundColor: 'var(--color-accent)', color: '#0a130c' }
        : { color: 'var(--color-text-muted)' }
      }
    >
      {tab}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Wrap existing pricing content + add analytics tab**

The entire block after the tab bar (from the "Pricing Admin" `<div>` through to the final Save button) should be conditionally shown. Wrap the existing pricing header + sections in:

```jsx
{activeTab === 'pricing' && (
  <>
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Pricing Admin</h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          {isOverridden() ? '⚡ Using custom pricing (localStorage)' : '📋 Using default pricing'}
        </p>
      </div>
      <div className="flex gap-2">
        {/* Reset + Save buttons — unchanged */}
      </div>
    </div>
    {/* All Section components — unchanged */}
    {/* Bottom Save button — unchanged */}
  </>
)}

{activeTab === 'analytics' && <AnalyticsTab />}
```

- [ ] **Step 4: Build to verify**

```bash
npm run build
```
Expected: succeeds. `AnalyticsTab` import will cause an error until the next task — that's expected. Create a placeholder first if needed:

```js
// src/components/AnalyticsTab.jsx (temporary placeholder)
export default function AnalyticsTab() {
  return <div className="p-4 text-[var(--color-text-muted)]">Analytics coming soon</div>
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/AdminPanel.jsx src/components/AnalyticsTab.jsx
git commit -m "feat: add Pricing/Analytics tab bar to AdminPanel"
```

---

## Task 6: AnalyticsTab — data fetching, date filter, summary cards

**Files:**
- Modify: `src/components/AnalyticsTab.jsx` (replace placeholder)

This task builds the data layer and summary cards. The funnel/resistance charts come in Task 7.

- [ ] **Step 1: Write analytics computation tests**

Create `tests/components/analyticsTab.utils.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { filterByDateRange, computeStepData, computeHighestFriction, computeAvgQuote, computeConversionRate } from '../../src/components/AnalyticsTab.jsx'

const makeSessions = (overrides = []) => overrides

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
```

- [ ] **Step 2: Run tests — verify they fail (exports not found)**

```bash
npm test -- tests/components/analyticsTab.utils.test.js
```

- [ ] **Step 3: Write `AnalyticsTab.jsx` with exported computation helpers + full component**

```jsx
import React, { useState, useEffect, useMemo } from 'react'
import { RefreshCw, TrendingUp, Users, DollarSign, AlertTriangle } from 'lucide-react'
import { fetchAnalyticsSessions } from '../utils/airtable'

const STEP_NAMES = ['Language', 'Event Details', 'Location', 'Services', 'Customization', 'Quote', 'Contact']

// ── Pure computation helpers (exported for tests) ────────────────────────────

export function filterByDateRange(sessions, days) {
  if (!days) return sessions
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return sessions.filter((s) => new Date(s.startedAt) >= cutoff)
}

export function computeConversionRate(sessions) {
  if (!sessions.length) return 0
  return Math.round((sessions.filter((s) => s.converted).length / sessions.length) * 100)
}

export function computeAvgQuote(sessions) {
  const converted = sessions.filter((s) => s.converted && s.quoteTotal > 0)
  if (!converted.length) return null
  return Math.round(converted.reduce((sum, s) => sum + s.quoteTotal, 0) / converted.length)
}

export function computeStepData(sessions) {
  const total = sessions.length
  return STEP_NAMES.map((name, i) => {
    const reached     = sessions.filter((s) => (s.furthestStep ?? 0) >= i).length
    const droppedHere = sessions.filter((s) => (s.furthestStep ?? 0) === i).length
    const dropOffRate = total > 0 ? droppedHere / total : 0
    const reachedPct  = total > 0 ? reached / total : 0

    const timings = sessions.flatMap((s) => {
      try {
        const ts = JSON.parse(s.stepTimestamps || '{}')
        if (ts[String(i)] && ts[String(i + 1)]) {
          return [new Date(ts[String(i + 1)]) - new Date(ts[String(i)])]
        }
      } catch { /* ignore */ }
      return []
    })
    const avgTime = timings.length >= 3
      ? timings.reduce((a, b) => a + b, 0) / timings.length
      : null

    return { index: i, name, reached, reachedPct, droppedHere, dropOffRate, avgTime, timings }
  })
}

export function computeHighestFriction(stepData) {
  const withDrop = stepData.filter((s) => s.index < 6) // skip terminal step
  const maxDrop  = Math.max(...withDrop.map((s) => s.dropOffRate))
  const maxTime  = Math.max(...withDrop.filter((s) => s.avgTime).map((s) => s.avgTime), 1)

  return withDrop.reduce((best, s) => {
    const normDrop = maxDrop > 0 ? s.dropOffRate / maxDrop : 0
    const normTime = s.avgTime ? s.avgTime / maxTime : 0
    const score    = normDrop * 0.6 + normTime * 0.4
    return score > (best._score ?? -1) ? { ...s, _score: score } : best
  }, {})
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function Card({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl p-4 space-y-1" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color: 'var(--color-text-muted)' }} />
        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--color-text)]">{value ?? '—'}</p>
      {sub && <p className="text-xs text-[var(--color-text-muted)]">{sub}</p>}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AnalyticsTab() {
  const [allSessions, setAllSessions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [dateRange, setDateRange]     = useState(30)
  const [page, setPage]               = useState(0)
  const PAGE_SIZE = 20

  const load = () => {
    setLoading(true)
    setError(null)
    fetchAnalyticsSessions()
      .then(setAllSessions)
      .catch((e) => setError(e.message || 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const sessions  = useMemo(() => filterByDateRange(allSessions, dateRange), [allSessions, dateRange])
  const stepData  = useMemo(() => computeStepData(sessions), [sessions])
  const friction  = useMemo(() => computeHighestFriction(stepData), [stepData])
  const convRate  = computeConversionRate(sessions)
  const avgQuote  = computeAvgQuote(sessions)

  const DATE_OPTIONS = [
    { label: '7d',  value: 7  },
    { label: '30d', value: 30 },
    { label: '90d', value: 90 },
    { label: 'All', value: 0  },
  ]

  if (loading) return (
    <div className="py-16 flex items-center justify-center">
      <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
    </div>
  )

  if (error) return (
    <div className="py-12 text-center space-y-3">
      <p className="text-sm text-red-400">{error}</p>
      <button onClick={load} className="text-xs underline" style={{ color: 'var(--color-accent)' }}>Retry</button>
    </div>
  )

  return (
    <div className="space-y-5 pb-8">
      {/* Date range filter */}
      <div className="flex gap-1">
        {DATE_OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => { setDateRange(value); setPage(0) }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={dateRange === value
              ? { backgroundColor: 'var(--color-accent)', color: '#0a130c' }
              : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }
            }
          >
            {label}
          </button>
        ))}
        <button onClick={load} className="ml-auto p-1.5 rounded-lg" style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }} title="Refresh">
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card icon={Users}         label="Sessions"    value={sessions.length} />
        <Card icon={TrendingUp}    label="Conv. Rate"  value={`${convRate}%`} sub={`${sessions.filter(s=>s.converted).length} leads`} />
        <Card icon={DollarSign}    label="Avg Quote"   value={avgQuote ? `€${avgQuote.toLocaleString()}` : '—'} sub="converted only" />
        <Card icon={AlertTriangle} label="Top Friction" value={friction.name ?? '—'} sub={friction.index != null ? `Step ${friction.index}` : ''} />
      </div>

      {/* Funnel chart */}
      <FunnelChart stepData={stepData} frictionIndex={friction.index} total={sessions.length} />

      {/* Resistance chart */}
      <ResistanceChart stepData={stepData} />

      {/* Breakdowns */}
      <Breakdowns sessions={sessions} />

      {/* Session table */}
      <SessionTable sessions={sessions} page={page} setPage={setPage} pageSize={PAGE_SIZE} />
    </div>
  )
}
```

Note: `FunnelChart`, `ResistanceChart`, `Breakdowns`, and `SessionTable` subcomponents are added in Tasks 7–9. Leave them as stubs for now:

```jsx
function FunnelChart() { return null }
function ResistanceChart() { return null }
function Breakdowns() { return null }
function SessionTable() { return null }
```

- [ ] **Step 4: Run utility tests — verify they pass**

```bash
npm test -- tests/components/analyticsTab.utils.test.js
```
Expected: PASS (all tests)

- [ ] **Step 5: Build to verify component renders**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/AnalyticsTab.jsx tests/components/analyticsTab.utils.test.js
git commit -m "feat: AnalyticsTab data layer and summary cards"
```

---

## Task 7: Funnel chart + resistance chart

**Files:**
- Modify: `src/components/AnalyticsTab.jsx` — replace `FunnelChart` and `ResistanceChart` stubs

- [ ] **Step 1: Replace `FunnelChart` stub**

```jsx
function FunnelChart({ stepData, frictionIndex, total }) {
  if (!total) return null
  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>
        Funnel Drop-off
      </h3>
      <div className="space-y-2">
        {stepData.map(({ index, name, reached, reachedPct, droppedHere }) => (
          <div key={index}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                {index === frictionIndex && <AlertTriangle size={11} style={{ color: 'var(--color-accent)' }} />}
                <span className="text-[var(--color-text-muted)]">Step {index}</span> {name}
              </span>
              <span style={{ color: 'var(--color-text-muted)' }}>
                {reached} <span className="opacity-60">({Math.round(reachedPct * 100)}%)</span>
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round(reachedPct * 100)}%`,
                  backgroundColor: index === frictionIndex ? 'var(--color-accent)' : 'var(--color-accent-2)',
                }}
              />
            </div>
            {droppedHere > 0 && (
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,100,100,0.7)' }}>
                ↗ {droppedHere} left here
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace `ResistanceChart` stub**

```jsx
function formatMs(ms) {
  if (ms == null) return null
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function ResistanceChart({ stepData }) {
  const withTime = stepData.filter((s) => s.avgTime != null)
  if (!withTime.length) return null
  const maxTime = Math.max(...withTime.map((s) => s.avgTime))

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>
        Avg Time per Step
      </h3>
      <div className="space-y-2">
        {stepData.slice(0, 6).map(({ index, name, avgTime, timings }) => (
          <div key={index}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: 'var(--color-text)' }}>{name}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>
                {timings.length < 3 ? 'insufficient data' : formatMs(avgTime)}
              </span>
            </div>
            {timings.length >= 3 && (
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((avgTime / maxTime) * 100)}%`,
                    backgroundColor: avgTime === maxTime ? 'var(--color-accent)' : 'var(--color-accent-2)',
                    opacity: 0.8,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build to verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/AnalyticsTab.jsx
git commit -m "feat: funnel drop-off chart and resistance chart"
```

---

## Task 8: Service/event breakdowns + session table

**Files:**
- Modify: `src/components/AnalyticsTab.jsx` — replace `Breakdowns` and `SessionTable` stubs

- [ ] **Step 1: Replace `Breakdowns` stub**

```jsx
function BarList({ title, items }) {
  const max = Math.max(...items.map((i) => i.count), 1)
  return (
    <div className="rounded-xl p-4 space-y-3 flex-1" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>{title}</h3>
      <div className="space-y-2">
        {items.map(({ label, count, pct }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: 'var(--color-text)' }}>{label}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{Math.round(pct * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.round((count / max) * 100)}%`, backgroundColor: 'var(--color-accent-2)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Breakdowns({ sessions }) {
  const serviceSessions = sessions.filter((s) => s.selectedServices)
  const allServices = serviceSessions.flatMap((s) => s.selectedServices.split(', ').map((x) => x.trim()).filter(Boolean))
  const serviceCounts = Object.entries(
    allServices.reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {})
  ).map(([label, count]) => ({ label, count, pct: serviceSessions.length > 0 ? count / serviceSessions.length : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const eventSessions = sessions.filter((s) => s.eventType)
  const eventCounts = Object.entries(
    eventSessions.reduce((acc, s) => ({ ...acc, [s.eventType]: (acc[s.eventType] || 0) + 1 }), {})
  ).map(([label, count]) => ({ label, count, pct: eventSessions.length > 0 ? count / eventSessions.length : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  if (!serviceCounts.length && !eventCounts.length) return null

  return (
    <div className="flex gap-3">
      {serviceCounts.length > 0 && <BarList title="Top Services" items={serviceCounts} />}
      {eventCounts.length   > 0 && <BarList title="Event Types"  items={eventCounts}  />}
    </div>
  )
}
```

- [ ] **Step 2: Replace `SessionTable` stub**

```jsx
function SessionTable({ sessions, page, setPage, pageSize }) {
  const total  = sessions.length
  const pages  = Math.ceil(total / pageSize)
  const slice  = sessions.slice(page * pageSize, (page + 1) * pageSize)

  if (!total) return (
    <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>No sessions recorded yet.</div>
  )

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ backgroundColor: 'var(--color-surface)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>Sessions</h3>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{total} total</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border)' }}>
              {['Date', 'Event', 'Services', 'Quote', 'Step', '✓'].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((s, i) => (
              <tr
                key={s.id || i}
                style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
              >
                <td className="px-3 py-2" style={{ color: 'var(--color-text-muted)' }}>
                  {s.startedAt ? new Date(s.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                </td>
                <td className="px-3 py-2 capitalize" style={{ color: 'var(--color-text)' }}>{s.eventType || '—'}</td>
                <td className="px-3 py-2" style={{ color: 'var(--color-text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.selectedServices || '—'}
                </td>
                <td className="px-3 py-2" style={{ color: 'var(--color-text)' }}>
                  {s.quoteTotal > 0 ? `€${s.quoteTotal.toLocaleString()}` : '—'}
                </td>
                <td className="px-3 py-2" style={{ color: 'var(--color-text-muted)' }}>
                  {STEP_NAMES[s.furthestStep] ?? `Step ${s.furthestStep}`}
                </td>
                <td className="px-3 py-2">
                  {s.converted && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: 'rgba(110,231,183,0.15)', color: 'var(--color-success)' }}>
                      Lead
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs disabled:opacity-40"
            style={{ color: 'var(--color-accent)' }}
          >
            ← Prev
          </button>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {page + 1} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            disabled={page === pages - 1}
            className="text-xs disabled:opacity-40"
            style={{ color: 'var(--color-accent)' }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```
Expected: all pass.

- [ ] **Step 4: Build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/AnalyticsTab.jsx
git commit -m "feat: service/event breakdowns and paginated session table"
```

---

## Task 9: Final verification

- [ ] **Step 1: Run the dev server and smoke test the full flow**

```bash
npm run dev
```

1. Open `http://localhost:5173` — step through the funnel from Step 0 to Step 6 and submit the contact form.
2. Open Airtable — verify the `Analytics` table has a new record with `converted: true`, all step timestamps filled, and the correct quote total.
3. Open `http://localhost:5173/#admin` — log in, click **Analytics** tab — verify sessions appear, funnel bars render, and the Lead badge shows on the submitted session.

- [ ] **Step 2: Run full test suite**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: analytics dashboard complete — funnel tracking, admin tab, session table"
```
