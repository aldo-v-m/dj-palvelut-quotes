import { create } from 'zustand'

const useQuoteStore = create((set, get) => ({
  language: 'en',
  currentStep: 0,
  eventDetails: {
    date: null,
    eventType: '',
    durationHours: 4,
    startTime: '',
    endTime: '',
    guestCount: 100,
    venueName: ''
  },
  location: {
    address: '',
    placeId: '',
    lat: null,
    lng: null,
    distanceKm: null,
    durationMinutes: null
  },
  selectedServices: [],
  addons: {},
  addonQuantities: {},
  showVatIncluded: true,
  aiRecommendation: null,
  aiLoading: false,
  quoteId: null,
  quoteExpiry: null,
  contact: {
    name: '',
    email: '',
    phone: '',
    message: ''
  },
  submitted: false,

  setLanguage: (language) => set({ language }),
  setCurrentStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 6) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),

  setEventDetails: (details) => set((s) => ({
    eventDetails: { ...s.eventDetails, ...details }
  })),
  setLocation: (location) => set((s) => ({
    location: { ...s.location, ...location }
  })),

  toggleService: (serviceId) => set((s) => {
    const selected = s.selectedServices.includes(serviceId)
      ? s.selectedServices.filter((id) => id !== serviceId)
      : [...s.selectedServices, serviceId]
    return { selectedServices: selected }
  }),

  setSelectedServices: (services) => set({ selectedServices: services }),

  toggleAddon: (serviceId, addonId) => set((s) => {
    const current = s.addons[serviceId] || []
    const next = current.includes(addonId)
      ? current.filter((a) => a !== addonId)
      : [...current, addonId]
    return { addons: { ...s.addons, [serviceId]: next } }
  }),

  setAddonQuantity: (serviceId, addonId, qty) => set((s) => ({
    addonQuantities: {
      ...s.addonQuantities,
      [`${serviceId}_${addonId}`]: qty
    }
  })),

  toggleVat: () => set((s) => ({ showVatIncluded: !s.showVatIncluded })),

  setAiRecommendation: (rec) => set({ aiRecommendation: rec }),
  setAiLoading: (loading) => set({ aiLoading: loading }),

  setQuoteId: (id) => set({ quoteId: id }),
  setQuoteExpiry: (date) => set({ quoteExpiry: date }),

  setContact: (contact) => set((s) => ({
    contact: { ...s.contact, ...contact }
  })),
  setSubmitted: (v) => set({ submitted: v }),

  restoreState: (state) => set(state),

  getSerializableState: () => {
    const s = get()
    return {
      language: s.language,
      eventDetails: s.eventDetails,
      location: s.location,
      selectedServices: s.selectedServices,
      addons: s.addons,
      addonQuantities: s.addonQuantities,
      aiRecommendation: s.aiRecommendation,
      quoteId: s.quoteId,
      quoteExpiry: s.quoteExpiry
    }
  }
}))

export default useQuoteStore
