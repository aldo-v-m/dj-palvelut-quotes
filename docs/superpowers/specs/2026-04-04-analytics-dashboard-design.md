# Analytics Dashboard — Design Spec
**Date:** 2026-04-04  
**Project:** event-quote-app (DJ Palvelut embedded quote widget)  
**Status:** Approved

---

## Overview

Add a funnel analytics dashboard to the existing admin panel (`#admin`) to track user behavior across the 7-step quote funnel. The goal is to identify drop-off points and steps of highest resistance, enabling conversion optimization.

The widget is embedded as an iframe in a Squarespace website and used as a lead generation tool. Each step is a funnel stage.

---

## Operational Prerequisites

Before deploying, manually create an **`Analytics`** table in the same Airtable base as the existing `Submissions` table (identified by `VITE_AIRTABLE_BASE_ID`). Add each field listed in the Data Model section below with the specified types. No additional environment variables are required.

---

## Data Storage: Airtable `Analytics` Table

One row per user session. Created when the user enters Step 1 for the first time, updated progressively as the user advances, marked `converted: true` when the contact form is successfully submitted (Step 6).

### Fields

| Field | Airtable Type | Description |
|---|---|---|
| `sessionId` | Single line text | UUID generated on session init |
| `startedAt` | Date/time | Timestamp of session init (= timestamp[0]) |
| `updatedAt` | Date/time | Timestamp of most recent update |
| `language` | Single line text | `en` or `fi` |
| `furthestStep` | Number | Highest step index *entered* (0–6) |
| `converted` | Checkbox | True only when contact form submit succeeds |
| `eventType` | Single line text | e.g. `wedding`, `corporate`, `birthday` |
| `eventDate` | Single line text | Selected event date (ISO string) |
| `guestCount` | Number | Number of guests |
| `location` | Single line text | Venue address or city |
| `distanceKm` | Number | Calculated distance from origin |
| `selectedServices` | Single line text | Comma-separated service IDs |
| `quoteTotal` | Number | Quote amount in EUR (excl. VAT); absent until Step 5 is entered |
| `quoteId` | Single line text | Generated quote identifier |
| `stepTimestamps` | Long text | JSON `{"0":"ISO","1":"ISO",...}` — one entry per step *entered*, recorded at entry time |
| `backNavigations` | Number | Total count of backward step navigations |

**`furthestStep` semantics:** records the highest step index the user has *entered*, regardless of whether they completed it. A user who reached Step 6 but did not submit has `furthestStep: 6, converted: false`. A user who submitted has `furthestStep: 6, converted: true`. The funnel chart uses `furthestStep` counts to show how many sessions entered each step.

**`stepTimestamps` semantics:** each entry records the moment the user *entered* that step (i.e. when it became the active step). `timestamp["0"]` equals `startedAt`. Time spent at step N is calculated as `timestamp[N+1] − timestamp[N]`; this is only defined for steps the user passed through to N+1.

**`quoteTotal` null rule:** field is absent (null) if the user has not yet reached Step 5. In the session table, display `—` when `quoteTotal` is null or 0.

---

## Session Identity & Lifecycle

### Storage
`sessionId` (UUID), `airtableRecordId`, and `previousStep` are stored in **`sessionStorage`** under the keys `djp_session_id`, `djp_record_id`, and `djp_prev_step`. `sessionStorage` is used (not `localStorage`) so each browser tab has an independent session.

### Known limitation: iframe page reloads
When the Squarespace parent page reloads, the iframe's `sessionStorage` is cleared. The in-progress Airtable record is not deleted — it remains as an orphaned partial session with whatever data was captured up to that point. This is acceptable: orphaned sessions are filtered out of the conversion rate by the `converted` flag, and their partial funnel data still contributes to drop-off counts. No recovery strategy is needed.

---

## Tracking Layer: `src/utils/analyticsTracker.js`

### `initSession(language)`
- Guard: if `sessionStorage.getItem('djp_session_id')` already exists, do nothing (prevents duplicate records on back-navigation to Step 0 → re-enter Step 1).
- Generates a UUID `sessionId`.
- Calls `createAnalyticsSession` with `{ sessionId, startedAt: now, language, furthestStep: 1, stepTimestamps: JSON.stringify({"0": now, "1": now}), backNavigations: 0 }`.
- Stores `sessionId`, `airtableRecordId` (from Airtable response), and `previousStep: 1` in `sessionStorage`.

### `updateSession(currentStep, quoteStoreSnapshot)`
- If no `djp_record_id` in `sessionStorage`, do nothing (session not initialized — no Airtable record to update).
- Determine `previousStep` from `sessionStorage.getItem('djp_prev_step')`.
- If `currentStep < previousStep`, increment `backNavigations` by 1.
- Build timestamp patch: read existing `stepTimestamps` from sessionStorage cache, add entry for `currentStep` if not already present.
- Patch fields: `updatedAt`, `furthestStep` (only if `currentStep > current furthestStep`), `backNavigations`, `stepTimestamps`, and any newly available quote store fields (`eventType`, `eventDate`, `guestCount`, `location`, `distanceKm`, `selectedServices`, `quoteTotal`, `quoteId`).
- Calls `updateAnalyticsSession(recordId, patchFields)`.
- Updates `djp_prev_step` in `sessionStorage` to `currentStep`.
- Cache `stepTimestamps` string in `sessionStorage` under `djp_step_ts` to avoid re-fetching.

### `completeSession()`
- If no `djp_record_id`, do nothing.
- Calls `updateAnalyticsSession(recordId, { converted: true, updatedAt: now })`.

### Integration Points

| Location | When | Call |
|---|---|---|
| `App.jsx` — `useEffect([currentStep])` | Every step change | `updateSession(currentStep, quoteStoreSnapshot)` |
| `App.jsx` — `useEffect([currentStep])`, when `currentStep === 1` and no existing session | Step 1 first entry | `initSession(language)` — guarded by sessionStorage check inside function |
| `Step6_Contact.jsx` | On successful form submit | `completeSession()` |

All calls are fire-and-forget. Failures log a console warning but do not surface to the user.

---

## Airtable Client: `src/utils/airtable.js` additions

Three new exported functions added to the existing file (same `VITE_AIRTABLE_BASE_ID`, same no-op guard when not configured):

- **`createAnalyticsSession(fields)`** — creates a record in the `Analytics` table, returns `{ id: string }`.
- **`updateAnalyticsSession(recordId, fields)`** — patches an existing record in the `Analytics` table.
- **`fetchAnalyticsSessions()`** — reads all records from the `Analytics` table using Airtable's paginate API (handles multi-page responses), returns a flat array of record field objects. Fetches up to 500 records. At scale beyond 500 sessions the oldest records are excluded — acceptable for the current usage level.

---

## Admin UI

### Tab Bar in `AdminPanel.jsx`

A two-tab bar ("Pricing" | "Analytics") replaces the current single header once authenticated. Existing Pricing content is unchanged. New `AnalyticsTab` component is imported and rendered when the Analytics tab is active.

### `src/components/AnalyticsTab.jsx`

#### Loading & Error States
- On mount, calls `fetchAnalyticsSessions()`.
- While loading: show a spinner/skeleton.
- On Airtable error: show an error message with a retry button.

#### Date Range Filter
Four buttons: **Last 7d / 30d / 90d / All**. Filters applied client-side against `startedAt`. Default: Last 30d.

#### Summary Cards (4)
- **Total Sessions** — count of records in filtered date range
- **Conversion Rate** — `converted === true` count / total, as percentage
- **Avg Quote** — mean `quoteTotal` of sessions where `converted === true` (excludes non-converters and null values)
- **Highest Friction Step** — step with highest friction score (see formula below)

**Friction score formula:**  
For each step N (0–5, since step 6 is the terminal step):
```
dropOffRate(N) = sessions where furthestStep === N / total sessions
normalizedDropOff(N) = dropOffRate(N) / max(dropOffRate across all steps)

avgTime(N) = mean(timestamp[N+1] - timestamp[N]) across sessions that passed through both N and N+1
normalizedTime(N) = avgTime(N) / max(avgTime across all steps)

frictionScore(N) = normalizedDropOff(N) × 0.6 + normalizedTime(N) × 0.4
```
The step with the highest `frictionScore` is shown in the card. If `avgTime` data is insufficient (fewer than 5 sessions), fall back to drop-off rate only.

#### Funnel Drop-off Chart
One row per step (0–6), labeled with the step name. Each row shows:
- Step name
- CSS horizontal bar (width proportional to % of total sessions that entered this step)
- Session count and percentage
- ⚠ icon on the step with the highest friction score

#### Resistance Chart (avg time per step)
One bar per step 0–5 (step 6 has no meaningful "time to complete" since it's the terminal step). Bar width proportional to avg time spent. Color-coded: longest step gets the accent color. Steps with fewer than 3 data points show "insufficient data."

#### Service & Event Type Breakdowns
Two side-by-side sections:
- **Top Services**: list of service IDs, bar width = % of all sessions that selected each (denominator = sessions that reached Step 3)
- **Event Types**: list of event types, bar width = % of sessions that answered Step 1

#### Session Table
- Client-side paginated: 20 rows per page, newest first by `startedAt`
- Columns: Date | Event Type | Services | Quote | Furthest Step | Converted
- `quoteTotal` shown as `€X,XXX` or `—` if null/0
- `converted` shown as a green "Lead" badge or empty
- `furthestStep` shown as the step name (e.g. "Services") not the index

---

## Files Changed

| File | Change |
|---|---|
| `src/utils/analyticsTracker.js` | **NEW** — `initSession`, `updateSession`, `completeSession` |
| `src/components/AnalyticsTab.jsx` | **NEW** — full analytics UI |
| `src/utils/airtable.js` | **EDIT** — add `createAnalyticsSession`, `updateAnalyticsSession`, `fetchAnalyticsSessions` |
| `src/components/AdminPanel.jsx` | **EDIT** — add tab bar, import `AnalyticsTab` |
| `src/App.jsx` | **EDIT** — call `initSession`/`updateSession` on step change |
| `src/components/steps/Step6_Contact.jsx` | **EDIT** — call `completeSession` on submit |

---

## Constraints

- No new npm dependencies — CSS bars via Tailwind, no charting library.
- Airtable API rate limit: 5 req/s — safe since step changes are human-paced.
- All analytics writes are fire-and-forget; failures are non-blocking and silent to the user (console.warn only).
- Admin password unchanged (`VITE_ADMIN_PASSWORD` env var).
- Date range filtering is client-side (all records fetched on tab open, filtered in-browser).
- `sessionStorage` used for per-tab session isolation; orphaned records from iframe reloads are accepted behavior.
