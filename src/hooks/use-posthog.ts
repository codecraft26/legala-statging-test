'use client'

import { usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'
import { useAuth } from './use-auth'

/**
 * Custom hook to use PostHog analytics
 * Automatically identifies users when they log in
 */
export function usePostHogAnalytics() {
  const posthog = usePostHog()
  const { user } = useAuth()

  // Identify user when they log in
  useEffect(() => {
    if (posthog && user) {
      // Use email as the distinct_id to show email in PostHog activity
      posthog.identify(user.email || user.id, {
        $email: user.email, // PostHog person property for email
        $name: user.name || user.email, // PostHog person property for name
        email: user.email, // Custom property
        name: user.name, // Custom property
        role: user.role,
      })
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

