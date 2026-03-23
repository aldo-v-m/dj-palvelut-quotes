import { describe, it, expect, beforeEach } from 'vitest'
import useQuoteStore from '../../src/store/quoteStore'

describe('quoteStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useQuoteStore.getState().resetState()
  })

  describe('navigation', () => {
    it('starts at step 0', () => {
      expect(useQuoteStore.getState().currentStep).toBe(0)
    })

    it('nextStep increments current step', () => {
      useQuoteStore.getState().nextStep()
      expect(useQuoteStore.getState().currentStep).toBe(1)
    })

    it('nextStep clamps at step 6', () => {
      for (let i = 0; i < 10; i++) useQuoteStore.getState().nextStep()
      expect(useQuoteStore.getState().currentStep).toBe(6)
    })

    it('prevStep clamps at step 0', () => {
      useQuoteStore.getState().prevStep()
      expect(useQuoteStore.getState().currentStep).toBe(0)
    })

    it('goToStep sets step directly', () => {
      useQuoteStore.getState().goToStep(4)
      expect(useQuoteStore.getState().currentStep).toBe(4)
    })
  })

  describe('eventDetails', () => {
    it('setEventDetails merges fields', () => {
      useQuoteStore.getState().setEventDetails({ eventType: 'wedding', guestCount: 200 })
      const { eventType, guestCount, durationHours } = useQuoteStore.getState().eventDetails
      expect(eventType).toBe('wedding')
      expect(guestCount).toBe(200)
      expect(durationHours).toBe(4) // default preserved
    })

    it('setEventDetails does not overwrite unset fields', () => {
      useQuoteStore.getState().setEventDetails({ eventType: 'corporate' })
      useQuoteStore.getState().setEventDetails({ guestCount: 50 })
      expect(useQuoteStore.getState().eventDetails.eventType).toBe('corporate')
      expect(useQuoteStore.getState().eventDetails.guestCount).toBe(50)
    })
  })

  describe('services', () => {
    it('toggleService adds a service', () => {
      useQuoteStore.getState().toggleService('dj')
      expect(useQuoteStore.getState().selectedServices).toContain('dj')
    })

    it('toggleService removes an already-selected service', () => {
      useQuoteStore.getState().toggleService('dj')
      useQuoteStore.getState().toggleService('dj')
      expect(useQuoteStore.getState().selectedServices).not.toContain('dj')
    })

    it('toggleService can select multiple services', () => {
      useQuoteStore.getState().toggleService('dj')
      useQuoteStore.getState().toggleService('audio')
      useQuoteStore.getState().toggleService('lighting')
      expect(useQuoteStore.getState().selectedServices).toHaveLength(3)
    })

    it('setSelectedServices replaces entire selection', () => {
      useQuoteStore.getState().toggleService('dj')
      useQuoteStore.getState().setSelectedServices(['audio', 'lighting'])
      expect(useQuoteStore.getState().selectedServices).toEqual(['audio', 'lighting'])
    })
  })

  describe('addons', () => {
    it('toggleAddon adds an addon', () => {
      useQuoteStore.getState().toggleAddon('lighting', 'smoke_machine')
      expect(useQuoteStore.getState().addons['lighting']).toContain('smoke_machine')
    })

    it('toggleAddon removes an already-toggled addon', () => {
      useQuoteStore.getState().toggleAddon('lighting', 'smoke_machine')
      useQuoteStore.getState().toggleAddon('lighting', 'smoke_machine')
      expect(useQuoteStore.getState().addons['lighting']).not.toContain('smoke_machine')
    })

    it('setAddonQuantity stores quantity by key', () => {
      useQuoteStore.getState().setAddonQuantity('extras', 'titis_magic', 3)
      expect(useQuoteStore.getState().addonQuantities['extras_titis_magic']).toBe(3)
    })
  })

  describe('resetState', () => {
    it('resets to initial state', () => {
      useQuoteStore.getState().nextStep()
      useQuoteStore.getState().nextStep()
      useQuoteStore.getState().toggleService('dj')
      useQuoteStore.getState().setEventDetails({ eventType: 'wedding', guestCount: 300 })
      useQuoteStore.getState().resetState()

      const s = useQuoteStore.getState()
      expect(s.currentStep).toBe(0)
      expect(s.selectedServices).toHaveLength(0)
      expect(s.eventDetails.eventType).toBe('')
      expect(s.eventDetails.guestCount).toBe(100)
    })

    it('resets quoteId and contact', () => {
      useQuoteStore.getState().setQuoteId('Q-123')
      useQuoteStore.getState().setContact({ name: 'Test', email: 'test@test.com' })
      useQuoteStore.getState().resetState()

      expect(useQuoteStore.getState().quoteId).toBeNull()
      expect(useQuoteStore.getState().contact.name).toBe('')
    })
  })

  describe('getSerializableState', () => {
    it('returns key fields for sharing', () => {
      useQuoteStore.getState().setEventDetails({ eventType: 'festival' })
      useQuoteStore.getState().toggleService('dj')
      const state = useQuoteStore.getState().getSerializableState()

      expect(state).toHaveProperty('eventDetails')
      expect(state).toHaveProperty('selectedServices')
      expect(state).toHaveProperty('location')
      expect(state.eventDetails.eventType).toBe('festival')
      expect(state.selectedServices).toContain('dj')
    })

    it('does not include sensitive fields', () => {
      const state = useQuoteStore.getState().getSerializableState()
      expect(state).not.toHaveProperty('contact')
      expect(state).not.toHaveProperty('submitted')
    })
  })
})
