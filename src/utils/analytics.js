// Safe gtag wrapper — buffers calls until the async gtag script is ready.
// This is important for iframe embeds where the parent page may delay script loading.
function gtag(...args) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag === 'function') {
    window.gtag(...args)
  } else {
    // Push directly to dataLayer as a fallback — gtag will process on load
    window.dataLayer.push(args)
  }
}

export function trackStepView(stepIndex) {
  const stepNames = ['language', 'event_details', 'location', 'services', 'customization', 'quote', 'contact']
  gtag('event', 'step_view', {
    step_index: stepIndex,
    step_name: stepNames[stepIndex] || `step_${stepIndex}`
  })
}

export function trackQuoteViewed({ total, services, eventType }) {
  gtag('event', 'view_item', {
    currency: 'EUR',
    value: total,
    items: services.map((id) => ({ item_id: id, item_name: id })),
    event_type: eventType
  })
}

export function trackLeadSubmitted({ total, services, eventType, quoteId }) {
  // GA4 lead event
  gtag('event', 'generate_lead', {
    currency: 'EUR',
    value: total,
    quote_id: quoteId,
    event_type: eventType,
    services: services.join(', ')
  })
  // Google Ads conversion (fires when app is accessed directly, not in iframe)
  gtag('event', 'conversion', {
    send_to: 'AW-16566656752/gMnCCNPpsI0cEPC9zNs9',
    value: total,
    currency: 'EUR',
    transaction_id: quoteId
  })
  // Notify parent page when running inside an iframe.
  // The parent (Squarespace) holds the gclid from the Google Ad click,
  // so the conversion must also fire there for proper attribution.
  if (typeof window !== 'undefined' && window.parent !== window) {
    window.parent.postMessage({
      type: 'djp_conversion',
      value: total,
      currency: 'EUR',
      quoteId,
      eventType,
      services: services.join(', ')
    }, '*')
  }
}

export function trackServiceSelected(serviceId, selected) {
  gtag('event', selected ? 'select_item' : 'deselect_item', {
    item_id: serviceId,
    item_name: serviceId
  })
}
