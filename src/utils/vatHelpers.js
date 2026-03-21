const VAT_RATE = 0.24

export function formatEurRaw(amount) {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount)
}

export function withVat(amount) {
  return Math.round(amount * (1 + VAT_RATE) * 100) / 100
}

export function withoutVat(amount) {
  return Math.round(amount / (1 + VAT_RATE) * 100) / 100
}
