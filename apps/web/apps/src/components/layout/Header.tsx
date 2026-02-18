'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/lib/AuthContext'

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
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      {/* Title Section */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h1>
        {subtitle && <p className="hidden md:block text-sm text-gray-500 mt-1">{subtitle}</p>}
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
            className="pl-9 pr-3 py-2 w-56 border border-gray-200 rounded-xl bg-white text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
          />
        </div>

        {/* Search Icon (mobile) */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Open search"
        >
          <SearchIcon className="w-5 h-5" />
        </button>

        {/* User Profile (mobile: initial only) */}
        <div
          className="md:hidden w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-sm"
          aria-label={`Profile: ${displayName}`}
          title={displayName}
        >
          {initial}
        </div>

        {/* User Profile (desktop) */}
        <div className="hidden md:flex items-center gap-3 bg-white rounded-xl px-3 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100">
          <div className="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-sm">
            {initial}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">{displayName}</p>
            <p className="text-[11px] text-gray-500">{user?.role === 'LGU_STAFF' ? 'LGU Staff' : 'Superadmin'}</p>
          </div>
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
