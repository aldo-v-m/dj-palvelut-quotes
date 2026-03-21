export function generateQuoteId() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let rand = ''
  for (let i = 0; i < 4; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)]
  }
  return `QT-${y}${m}${d}-${rand}`
}

export function getQuoteExpiry(fromDate = new Date()) {
  const expiry = new Date(fromDate)
  expiry.setDate(expiry.getDate() + 7)
  return expiry
}

export function getDaysUntilExpiry(expiryDate) {
  if (!expiryDate) return 0
  const now = new Date()
  const expiry = new Date(expiryDate)
  return Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)))
}
