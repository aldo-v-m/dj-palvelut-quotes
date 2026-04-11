import { createHash } from 'crypto'

const CAPI_URL = 'https://graph.facebook.com/v19.0'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const pixelId = process.env.META_PIXEL_ID
  const accessToken = process.env.META_CAPI_TOKEN

  if (!pixelId || !accessToken) {
    console.error('[meta-event] Missing META_PIXEL_ID or META_CAPI_TOKEN env vars')
    return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfiguration' }) }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const {
    eventName,
    eventId,
    eventTime,
    sourceUrl,
    email,
    phone,
    userAgent,
    fbp,
    fbc,
    customData = {},
  } = body

  if (!eventName) {
    return { statusCode: 400, body: JSON.stringify({ error: 'eventName required' }) }
  }

  // Hash PII server-side with SHA-256
  const hash = (val) =>
    val ? createHash('sha256').update(val.trim().toLowerCase()).digest('hex') : undefined

  const userData = {
    ...(email && { em: [hash(email)] }),
    ...(phone && { ph: [hash(phone.replace(/\D/g, ''))] }),
    ...(userAgent && { client_user_agent: userAgent }),
    ...(fbp && { fbp }),
    ...(fbc && { fbc }),
    // Use the real client IP from Netlify headers (more accurate than browser-sent)
    client_ip_address: event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                       event.headers['x-nf-client-connection-ip'] || undefined,
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: eventTime || Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: sourceUrl,
        action_source: 'website',
        user_data: userData,
        ...(Object.keys(customData).length > 0 && { custom_data: customData }),
      },
    ],
  }

  try {
    const res = await fetch(
      `${CAPI_URL}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    const result = await res.json()

    if (!res.ok) {
      console.error('[meta-event] CAPI error:', JSON.stringify(result))
      return { statusCode: 502, body: JSON.stringify({ error: 'CAPI request failed', detail: result }) }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, events_received: result.events_received }),
    }
  } catch (err) {
    console.error('[meta-event] fetch error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) }
  }
}
