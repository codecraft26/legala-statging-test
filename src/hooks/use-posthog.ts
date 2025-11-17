'use client'

import { usePostHog } from 'posthog-js/react'
import { useEffect, useRef } from 'react'
import { useAuth } from './use-auth'

/**
 * Custom hook to use PostHog analytics
 * Automatically identifies users when they log in
 */
export function usePostHogAnalytics() {
  const posthog = usePostHog()
  const { user } = useAuth()
  const hasIdentifiedRef = useRef<string | null>(null)

  // Identify user when they log in
  useEffect(() => {
    if (!posthog) return

    if (user && user.email) {
      // Only re-identify if the email has changed or not yet identified
      if (hasIdentifiedRef.current !== user.email) {
        // Reset PostHog to clear any previous identity
        posthog.reset()
        
        // Identify with email as the distinct_id
        posthog.identify(user.email, {
          $email: user.email, // PostHog person property for email
          $name: user.name || user.email, // PostHog person property for name
          email: user.email, // Custom property
          name: user.name, // Custom property
          role: user.role,
          id: user.id, // Store the actual ID as a property
        })
        
        hasIdentifiedRef.current = user.email
      }
    } else if (!user && hasIdentifiedRef.current) {
      // User logged out, reset PostHog
      posthog.reset()
      hasIdentifiedRef.current = null
    }
  }, [posthog, user])

  return posthog
}

/**
 * Hook to track custom events
 */
export function useTrackEvent() {
  const posthog = usePostHog()

  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.capture(eventName, properties)
    }
  }

  return trackEvent
}

