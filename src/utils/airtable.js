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
