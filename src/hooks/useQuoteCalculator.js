import { useMemo } from 'react'
import useQuoteStore from '../store/quoteStore'
import pricing from '../config/pricing.json'

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function useQuoteCalculator() {
  const { eventDetails, location, selectedServices, addons, addonQuantities } = useQuoteStore()

  return useMemo(() => {
    const { date, durationHours } = eventDetails
    const hours = durationHours || 4

    const lineItems = selectedServices.map((serviceId) => {
      const svcPricing = pricing.services[serviceId]
      if (!svcPricing) return null

      const basePrice = svcPricing.base_price
      const effectiveHours = Math.max(hours, svcPricing.min_hours)
      const durationCost = Math.max(0, effectiveHours - svcPricing.min_hours) * svcPricing.hourly_rate

      const serviceAddons = addons[serviceId] || []
      let addonsCost = 0
      const addonLines = serviceAddons.map((addonId) => {
        const addonDef = svcPricing.addons[addonId]
        if (!addonDef) return null
        const qty = addonQuantities[`${serviceId}_${addonId}`] || 1
        const cost = addonDef.price * qty
        addonsCost += cost
        return { addonId, cost, qty }
      }).filter(Boolean)

      const subtotal = basePrice + durationCost + addonsCost

      return { serviceId, basePrice, durationCost, addonsCost, addonLines, subtotal, effectiveHours }
    }).filter(Boolean)

    const servicesSubtotal = lineItems.reduce((sum, li) => sum + li.subtotal, 0)

    // Travel fee
    let distanceKm = location.distanceKm
    if (distanceKm === null && location.lat && location.lng) {
      const hqLat = parseFloat(import.meta.env.VITE_HQ_LAT || 60.1699)
      const hqLng = parseFloat(import.meta.env.VITE_HQ_LNG || 24.9384)
      distanceKm = haversineKm(hqLat, hqLng, location.lat, location.lng) * 1.3
    }
    const travelFee = distanceKm > pricing.travel.free_km
      ? Math.round((distanceKm - pricing.travel.free_km) * pricing.travel.rate_per_km * 100) / 100
      : 0
    const overnightFee = distanceKm > pricing.travel.overnight_threshold_km
      ? pricing.travel.overnight_allowance
      : 0

    // Package discount
    const count = selectedServices.length
    let packageDiscountRate = 0
    if (count >= 4) packageDiscountRate = pricing.package_discounts.four_services
    else if (count === 3) packageDiscountRate = pricing.package_discounts.three_services
    else if (count === 2) packageDiscountRate = pricing.package_discounts.two_services
    const packageDiscount = -Math.round(servicesSubtotal * packageDiscountRate * 100) / 100

    const discountedServices = servicesSubtotal + packageDiscount

    // Surcharges (multiplicative)
    let surchargeMultiplier = 1
    let weekendAmount = 0
    let highSeasonAmount = 0
    let lastMinuteAmount = 0

    if (date) {
      const d = new Date(date)
      const day = d.getDay()
      const month = d.getMonth() + 1
      const today = new Date()
      const daysUntil = Math.floor((d - today) / (1000 * 60 * 60 * 24))

      if (day === 0 || day === 6) {
        surchargeMultiplier *= (1 + pricing.surcharges.weekend)
        weekendAmount = Math.round(discountedServices * pricing.surcharges.weekend * 100) / 100
      }
      if (pricing.surcharges.high_season_months.includes(month)) {
        surchargeMultiplier *= (1 + pricing.surcharges.high_season)
        highSeasonAmount = Math.round(discountedServices * pricing.surcharges.high_season * 100) / 100
      }
      if (daysUntil >= 0 && daysUntil < pricing.surcharges.last_minute_days) {
        surchargeMultiplier *= (1 + pricing.surcharges.last_minute)
        lastMinuteAmount = Math.round(discountedServices * pricing.surcharges.last_minute * 100) / 100
      }
    }

    const surchargesTotal = Math.round((discountedServices * surchargeMultiplier - discountedServices) * 100) / 100
    const subtotalBeforeVat = Math.round((discountedServices * surchargeMultiplier + travelFee + overnightFee) * 100) / 100
    const vatAmount = Math.round(subtotalBeforeVat * pricing.vat_rate * 100) / 100
    const totalWithVat = Math.round((subtotalBeforeVat + vatAmount) * 100) / 100

    return {
      lineItems,
      travelFee,
      overnightFee,
      packageDiscount,
      packageDiscountRate,
      surcharges: { weekend: weekendAmount, highSeason: highSeasonAmount, lastMinute: lastMinuteAmount, total: surchargesTotal },
      subtotalBeforeVat,
      vatAmount,
      total: totalWithVat,
      totalWithVat,
      distanceKm
    }
  }, [eventDetails, location, selectedServices, addons, addonQuantities])
}
