'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'

interface RouteLoadingContextValue {
  isRouteLoading: boolean
  startRouteLoading: () => void
  finishRouteLoading: () => void
}

const RouteLoadingContext = createContext<RouteLoadingContextValue>({
  isRouteLoading: false,
  startRouteLoading: () => {},
  finishRouteLoading: () => {},
})

export function RouteLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isRouteLoading, setIsRouteLoading] = useState(false)

  const startRouteLoading = useCallback(() => setIsRouteLoading(true), [])
  const finishRouteLoading = useCallback(() => setIsRouteLoading(false), [])

  return (
    <RouteLoadingContext.Provider value={{ isRouteLoading, startRouteLoading, finishRouteLoading }}>
      {children}
    </RouteLoadingContext.Provider>
  )
}

export function useRouteLoading() {
  return useContext(RouteLoadingContext)
}
