import { createAnalyticsSession, updateAnalyticsSession } from './airtable.js'

const KEYS = {
  SESSION_ID: 'djp_session_id',
  RECORD_ID:  'djp_record_id',
  PREV_STEP:  'djp_prev_step',
  STEP_TS:    'djp_step_ts',
  BACK_NAV:   'djp_back_nav',
  VISITOR_GEO: 'djp_visitor_geo',
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

async function getVisitorGeo() {
  const cached = ss(KEYS.VISITOR_GEO)
  if (cached) { try { return JSON.parse(cached) } catch {} }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return null
    const data = await res.json()
    const geo = {
      visitorCity:        data.city        || null,
      visitorCountry:     data.country_name || null,
      visitorCountryCode: data.country_code || null,
    }
    ss(KEYS.VISITOR_GEO, JSON.stringify(geo))
    return geo
  } catch {
    return null
  }
}

export async function initSession(language) {
  if (ss(KEYS.SESSION_ID)) return // guard: already initialized this tab
  const now = new Date().toISOString()
  const sessionId = generateId()
  const stepTimestamps = JSON.stringify({ '0': now, '1': now })

  // Fire geo lookup and session creation in parallel
  const [result, geo] = await Promise.all([
    createAnalyticsSession({
      sessionId,
      startedAt: now,
      updatedAt: now,
      language,
      furthestStep: 1,
      stepTimestamps,
      backNavigations: 0,
    }),
    getVisitorGeo(),
  ])

  if (result?.id) {
    ss(KEYS.SESSION_ID, sessionId)
    ss(KEYS.RECORD_ID,  result.id)
    ss(KEYS.PREV_STEP,  '1')
    ss(KEYS.STEP_TS,    stepTimestamps)
    ss(KEYS.BACK_NAV,   '0')

    // Patch geo data onto the record if available
    if (geo?.visitorCity || geo?.visitorCountry) {
      updateAnalyticsSession(result.id, {
        visitorCity:    geo.visitorCity    || '',
        visitorCountry: geo.visitorCountry || '',
      })
    }
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

  const furthestStep = Math.max(currentStep, ...Object.keys(ts).map(Number))

  const patch = {
    updatedAt: new Date().toISOString(),
    furthestStep,
    backNavigations: newBackNav,
    stepTimestamps,
    ...(snapshot.language                                      && { language:         snapshot.language }),
    ...(snapshot.eventType                                     && { eventType:         snapshot.eventType }),
    ...(snapshot.eventDate                                     && { eventDate:         snapshot.eventDate }),
    ...(snapshot.guestCount != null                            && { guestCount:        snapshot.guestCount }),
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
