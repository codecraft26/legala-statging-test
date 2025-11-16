'use client'

import React from 'react'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

export function PostHogProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  if (!posthogKey) {
    return <>{children}</>
  }

  return (
    <PHProvider
      apiKey={posthogKey}
      options={{
        api_host: posthogHost,
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            posthog.debug()
          }
        },
      }}
    >
      {children}
    </PHProvider>
  )
}
