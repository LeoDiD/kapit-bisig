'use client'

import React, { useState } from 'react'
import Sidebar from './Sidebar'
import ProtectedRoute from './ProtectedRoute'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
        <main className={`transition-all duration-300 p-6 ${isSidebarCollapsed ? 'ml-16' : 'ml-48'}`}>
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
