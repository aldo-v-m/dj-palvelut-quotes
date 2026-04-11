/**
 * Meta pixel + CAPI dual-tracking helper.
 *
 * Browser pixel (fbq) fires for real-time signals.
 * CAPI serverless call fires in parallel for reliability/iOS/ad-blocker resilience.
 * Both share the same eventId for deduplication on Meta's side.
 */

function generateEventId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function getCookie(name) {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : undefined
}

/**
 * Fire a Meta event via both browser pixel and server-side CAPI.
 *
 * @param {string} eventName  e.g. 'Lead', 'ViewContent'
 * @param {object} options
 * @param {string} [options.email]
 * @param {string} [options.phone]
 * @param {object} [options.customData]  { value, currency, content_name, ... }
 */
export async function trackMetaEvent(eventName, { email, phone, customData = {} } = {}) {
  const eventId = generateEventId()
  const eventTime = Math.floor(Date.now() / 1000)
  const sourceUrl = typeof window !== 'undefined' ? window.location.href : ''

  // 1. Browser pixel — fires immediately (catches users not blocking)
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', eventName, customData, { eventID: eventId })
  }

  // 2. Server-side CAPI — fire and forget (don't block form submission)
  try {
    fetch('/.netlify/functions/meta-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        eventId,
        eventTime,
        sourceUrl,
        email: email || undefined,
        phone: phone || undefined,
        userAgent: navigator?.userAgent || undefined,
        fbp: getCookie('_fbp'),
        fbc: getCookie('_fbc'),
        customData: Object.keys(customData).length > 0 ? customData : undefined,
      }),
    }).catch((err) => console.warn('[metaPixel] CAPI call failed silently:', err))
  } catch (err) {
    // Never throw — tracking must never break the form
    console.warn('[metaPixel] CAPI setup error:', err)
  }
}
