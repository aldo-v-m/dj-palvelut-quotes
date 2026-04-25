export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  if (!webhookUrl) {
    console.error('[save-lead] Missing GOOGLE_SHEETS_WEBHOOK_URL env var')
    return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfiguration' }) }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const text = await res.text()
    let result
    try { result = JSON.parse(text) } catch { result = { raw: text } }

    if (!result.ok) {
      console.error('[save-lead] Sheets error:', result)
      return { statusCode: 502, body: JSON.stringify({ error: 'Sheets write failed', detail: result }) }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    }
  } catch (err) {
    console.error('[save-lead] fetch error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) }
  }
}
