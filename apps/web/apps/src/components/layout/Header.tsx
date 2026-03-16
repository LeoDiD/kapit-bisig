'use client'

import React from 'react'
import { useAuth } from '@/lib/AuthContext'
import { NotificationBell, ProfileDropdown } from './HeaderWidgets'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  useAuth()

  return (
    <header className="sticky top-0 z-40 bg-gray-100/80 dark:bg-slate-900/80 backdrop-blur-md pb-4 -mx-6 px-6 pt-2 mb-4 border-b border-gray-200/60 dark:border-slate-700/60">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Title Section */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
          {subtitle && <p className="hidden md:block text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
          {/* Notification Bell */}
          <NotificationBell />

          {/* Profile Dropdown */}
          <ProfileDropdown />
        </div>
      </div>

    </header>
  )
}
