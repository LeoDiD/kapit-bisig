'use client'

import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import ProtectedRoute from './ProtectedRoute'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <Sidebar />
        {/* Keep content stable; sidebar expansion overlays content on hover. */}
        <main className="transition-all duration-300 p-6 ml-16">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
