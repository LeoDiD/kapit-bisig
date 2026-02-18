'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import NProgress from 'nprogress'
import { useRouteLoading } from '@/lib/RouteLoadingContext'

// Configure NProgress once
NProgress.configure({
  showSpinner: false,
  minimum: 0.15,
  trickleSpeed: 120,
  easing: 'ease',
  speed: 350,
})

export default function TopLoadingBar() {
  const pathname = usePathname()
  const prevPathRef = useRef(pathname)
  const { startRouteLoading, finishRouteLoading } = useRouteLoading()

  useEffect(() => {
    // Skip on first mount (no transition)
    if (prevPathRef.current === pathname) return

    prevPathRef.current = pathname

    // Start immediately on route change
    NProgress.start()
    startRouteLoading()

    // Progress quickly then finish
    const t1 = setTimeout(() => NProgress.set(0.6), 60)
    const t2 = setTimeout(() => NProgress.set(0.85), 150)
    const t3 = setTimeout(() => {
      NProgress.done()
      finishRouteLoading()
    }, 300)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      NProgress.done()
      finishRouteLoading()
    }
  }, [pathname, startRouteLoading, finishRouteLoading])

  return null
}
