'use client'

import type { ReactNode } from 'react'
import ProtectedRoute from './ProtectedRoute'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
