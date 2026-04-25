export async function saveLeadToSheets(data) {
  try {
    const res = await fetch('/.netlify/functions/save-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!result.ok) console.error('[googleSheets] save failed:', result)
    return result
  } catch (err) {
    console.error('[googleSheets] fetch error:', err)
    return null
  }
}
