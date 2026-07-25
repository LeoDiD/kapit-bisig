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
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-5 -mt-6 -mx-6 px-6 pt-10 sm:px-10 mb-8 border-b border-gray-200/75 dark:border-slate-800 transition-all">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Title Section */}
        <div className="pl-2 md:pl-5">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{title}</h1>
          {subtitle && <p className="hidden md:block text-[13px] font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase mt-1.5">{subtitle}</p>}
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
