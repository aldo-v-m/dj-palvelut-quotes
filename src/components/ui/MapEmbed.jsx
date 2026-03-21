import React from 'react'

export default function MapEmbed({ lat, lng, address }) {
  if (!lat || !lng) return null

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return (
      <div
        className="w-full h-40 rounded-xl flex items-center justify-center text-sm text-[var(--color-text-muted)]"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        Map preview unavailable
      </div>
    )
  }

  const src = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=13&size=600x200&scale=2&markers=color:0xe8c97e|${lat},${lng}&style=element:geometry|color:0x1a1a1f&style=element:labels.text.fill|color:0x8a8a96&key=${apiKey}`

  return (
    <div className="w-full rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
      <img src={src} alt={address || 'Map'} className="w-full h-40 object-cover" />
    </div>
  )
}
