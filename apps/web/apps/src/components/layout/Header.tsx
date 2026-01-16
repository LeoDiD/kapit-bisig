'use client'

import React from 'react'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-8">
      {/* Title Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2.5 w-64 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
          />
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">
            EP
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">Emmanuel Pogi</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
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
