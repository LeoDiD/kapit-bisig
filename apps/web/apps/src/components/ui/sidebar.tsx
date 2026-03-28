'use client'

import * as React from 'react'
import { PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type SidebarContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  toggleSidebar: () => void
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
  const toggleSidebar = React.useCallback(() => setOpen((prev) => !prev), [])

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggleSidebar }}>
      <div className="group/sidebar-wrapper flex min-h-screen w-full bg-background">{children}</div>
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
  const { open } = useSidebar()

  return (
    <aside
      data-state={open ? 'expanded' : 'collapsed'}
      className={cn(
        'fixed inset-y-0 left-0 z-50 hidden overflow-visible border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out md:flex md:flex-col',
        open ? 'w-56' : 'w-16',
        className
      )}
    >
      {children}
    </aside>
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

