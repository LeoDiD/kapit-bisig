'use client'

import React from 'react'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
