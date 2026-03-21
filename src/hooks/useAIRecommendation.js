import { useCallback } from 'react'
import useQuoteStore from '../store/quoteStore'

export function useAIRecommendation() {
  const { setAiRecommendation, setAiLoading, aiRecommendation } = useQuoteStore()

  const fetchRecommendation = useCallback(async ({ eventType, guestCount, durationHours }) => {
    if (aiRecommendation) return
    if (!eventType || !guestCount || !durationHours) return

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) return

    setAiLoading(true)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-calls': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: `You are an expert event technical services advisor for a Finnish DJ and AV company.
Based on the event details provided, recommend the best service combination from: dj, audio, lighting, special_fx.

Respond ONLY with valid JSON in this exact shape:
{
  "services": ["dj", "audio"],
  "message_en": "For a wedding with 150 guests, we recommend DJ + full audio...",
  "message_fi": "150 hengen häille suosittelemme DJ + täysi äänijärjestelmä..."
}

Keep messages under 60 words. Be specific about why these services fit this event.
Always recommend at least 2 services. Never recommend all 4 unless guest count > 300.`,
          messages: [{
            role: 'user',
            content: `Event type: ${eventType}\nGuest count: ${guestCount}\nDuration: ${durationHours} hours`
          }]
        })
      })

      if (!response.ok) throw new Error('API error')
      const data = await response.json()
      const text = data.content[0]?.text || ''
      const json = JSON.parse(text)
      setAiRecommendation(json)
    } catch (err) {
      console.warn('AI recommendation failed silently:', err)
      setAiRecommendation(null)
    } finally {
      setAiLoading(false)
    }
  }, [aiRecommendation, setAiRecommendation, setAiLoading])

  return { fetchRecommendation }
}
