'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/lib/AuthContext'
import { NotificationBell, ProfileDropdown } from './HeaderWidgets'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth()
  const displayName = user?.fullName || user?.username || 'User'
  const initial = useMemo(() => {
    const ch = displayName.trim()[0]
    return (ch ? ch.toUpperCase() : 'U')
  }, [displayName])

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!mobileSearchOpen) return
    // Focus after render
    const t = window.setTimeout(() => mobileSearchInputRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [mobileSearchOpen])

  useEffect(() => {
    if (!mobileSearchOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileSearchOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileSearchOpen])

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
          {/* Search Bar (desktop) */}
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-3 py-2 w-56 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            />
          </div>

          {/* Search Icon (mobile) */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            aria-label="Open search"
          >
            <SearchIcon className="w-5 h-5" />
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Profile Dropdown */}
          <ProfileDropdown />
        </div>
      </div>

      {/* Mobile Search Modal */}
      {mobileSearchOpen && typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileSearchOpen(false)}
            />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 p-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-white text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(false)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label="Close search"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">Press Esc to close</p>
            </div>
          </div>,
          document.body
        )}
    </header>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
