import Airtable from 'airtable'

let base = null

function getBase() {
  if (!base) {
    const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID
    if (!apiKey || !baseId) return null
    base = new Airtable({ apiKey }).base(baseId)
  }
  return base
}

export async function saveQuoteToAirtable(quoteData) {
  const b = getBase()
  if (!b) {
    console.warn('Airtable not configured')
    return null
  }
  try {
    return await b('Submissions').create([{ fields: quoteData }])
  } catch (err) {
    console.error('Airtable save failed:', err)
    return null
  }
}

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
