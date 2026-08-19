'use client'

import * as React from 'react'
import { PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type SidebarContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  toggleSidebar: () => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  toggleMobileSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.')
  }
  return context
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const toggleSidebar = React.useCallback(() => setOpen((prev) => !prev), [])
  const toggleMobileSidebar = React.useCallback(() => setMobileOpen((prev) => !prev), [])

  // Close mobile sidebar on window resize to desktop
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <SidebarContext.Provider
      value={{
        open,
        setOpen,
        toggleSidebar,
        mobileOpen,
        setMobileOpen,
        toggleMobileSidebar,
      }}
    >
      <div className="group/sidebar-wrapper flex min-h-screen w-full bg-background relative">{children}</div>
    </SidebarContext.Provider>
  )
}

export function Sidebar({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { open, mobileOpen, setMobileOpen } = useSidebar()

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <aside
        data-mobile-state={mobileOpen ? 'open' : 'closed'}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-72 max-w-[85vw] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sidebar-foreground shadow-2xl transition-transform duration-300 ease-in-out md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        {children}
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside
        data-state={open ? 'expanded' : 'collapsed'}
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden overflow-visible border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out md:flex md:flex-col',
          open ? 'w-56' : 'w-16',
          className
        )}
      >
        {children}
      </aside>
    </>
  )
}

export function SidebarInset({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { open } = useSidebar()
  return (
    <main
      className={cn(
        'flex flex-1 flex-col min-h-screen transition-[margin-left] duration-200 ease-in-out md:ml-16 min-w-0',
        open && 'md:ml-56',
        className
      )}
    >
      {children}
    </main>
  )
}

export function SidebarTrigger({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground',
        className
      )}
      {...props}
    >
      <PanelLeft className="h-4 w-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
}

