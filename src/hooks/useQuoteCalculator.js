import { useMemo } from 'react'
import useQuoteStore from '../store/quoteStore'
import usePricingStore from '../store/pricingStore'

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
  const pricing = usePricingStore((s) => s.pricing)

  return useMemo(() => {
    const { date, durationHours } = eventDetails
    const hours = durationHours || 4

    // All service IDs to process: selected services + extras (always if has addons)
    const allServiceIds = [...new Set([
      ...selectedServices,
      ...(Object.keys(addons.extras || {}).length > 0 || (addons['extras'] || []).length > 0 ? ['extras'] : [])
    ])]

    const lineItems = allServiceIds.map((serviceId) => {
      const svcPricing = pricing.services[serviceId]
      if (!svcPricing) return null

      let basePrice, durationCost, effectiveHours
      if (svcPricing.tier_prices && svcPricing.tier_prices.length > 0) {
        const tiers = svcPricing.tier_prices
        basePrice = svcPricing.base_price
        effectiveHours = Math.max(Math.ceil(hours), 1)
        const extraHours = Math.max(0, effectiveHours - svcPricing.min_hours)
        if (extraHours === 0) {
          durationCost = 0
        } else if (extraHours <= tiers.length) {
          durationCost = tiers[extraHours - 1]
        } else {
          durationCost = tiers[tiers.length - 1] + (extraHours - tiers.length) * svcPricing.hourly_rate
        }
      } else {
        basePrice = svcPricing.base_price
        effectiveHours = svcPricing.hourly_rate > 0
          ? Math.max(hours, svcPricing.min_hours)
          : 0
        durationCost = svcPricing.hourly_rate > 0
          ? Math.max(0, effectiveHours - svcPricing.min_hours) * svcPricing.hourly_rate
          : 0
      }

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
      if (subtotal === 0) return null

      return { serviceId, basePrice, durationCost, addonsCost, addonLines, subtotal, effectiveHours: effectiveHours || hours }
    }).filter(Boolean)

    // Discount applies only to core services, NOT extras (dancers, stage etc.)
    const discountableSubtotal = lineItems
      .filter(li => li.serviceId !== 'extras')
      .reduce((sum, li) => sum + li.subtotal, 0)
    const extrasSubtotal = lineItems
      .filter(li => li.serviceId === 'extras')
      .reduce((sum, li) => sum + li.subtotal, 0)
    const servicesSubtotal = discountableSubtotal  // used for strikethrough display

    // Travel fee — new zone rules
    let distanceKm = location.distanceKm
    if (distanceKm === null && location.lat && location.lng) {
      // HQ: Saunarinne 3, 02230 Espoo
      const hqLat = parseFloat(import.meta.env.VITE_HQ_LAT || 60.1810)
      const hqLng = parseFloat(import.meta.env.VITE_HQ_LNG || 24.7780)
      distanceKm = haversineKm(hqLat, hqLng, location.lat, location.lng) * 1.3
    }
    const outOfRange = distanceKm !== null && distanceKm > pricing.travel.out_of_range_km
    const travelFee = (!outOfRange && distanceKm > pricing.travel.free_km)
      ? Math.round((distanceKm - pricing.travel.free_km) * pricing.travel.rate_per_km_one_way * 2 * 100) / 100
      : 0
    const overnightFee = 0

    // Package discount (on selected services only, not extras)
    const count = selectedServices.length
    let packageDiscountRate = 0
    if (count >= 4) packageDiscountRate = pricing.package_discounts.four_services
    else if (count === 3) packageDiscountRate = pricing.package_discounts.three_services
    else if (count === 2) packageDiscountRate = pricing.package_discounts.two_services
    const packageDiscount = -Math.round(discountableSubtotal * packageDiscountRate * 100) / 100

    const discountedServices = discountableSubtotal + packageDiscount + extrasSubtotal

    // Surcharges tracked internally but NOT added to customer total
    // (transparent pricing — customer sees discounted + travel only)
    const surchargesTotal = 0
    const total = Math.round((discountedServices + travelFee) * 100) / 100

    return {
      lineItems,
      servicesSubtotal,
      extrasSubtotal,
      travelFee,
      overnightFee,
      packageDiscount,
      packageDiscountRate,
      surcharges: { total: surchargesTotal },
      total,
      totalWithVat: total,
      subtotalBeforeVat: total,
      vatAmount: 0,
      distanceKm,
      outOfRange
    }
  }, [eventDetails, location, selectedServices, addons, addonQuantities, pricing])
}
