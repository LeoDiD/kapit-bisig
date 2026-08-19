'use client'

import React from 'react'
import { Menu } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useSidebar } from '@/components/ui/sidebar'
import { NotificationBell, ProfileDropdown } from './HeaderWidgets'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  useAuth()
  const { toggleMobileSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-4 -mt-4 -mx-4 px-4 pt-4 sm:-mt-6 sm:-mx-6 sm:px-8 sm:pt-6 sm:pb-5 mb-6 sm:mb-8 border-b border-gray-200/75 dark:border-slate-800 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Left Section with Mobile Hamburger & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Hamburger Menu Button (Mobile only) */}
          <button
            type="button"
            onClick={toggleMobileSidebar}
            aria-label="Open navigation menu"
            className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden md:block text-[12px] font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-end gap-2.5 sm:gap-3 shrink-0">
          {/* Notification Bell */}
          <NotificationBell />

          {/* Profile Dropdown */}
          <ProfileDropdown />
        </div>
      </div>
    </header>
  )
}

