'use client'

import React, { ReactNode, useState, useEffect } from 'react'
import ProtectedRoute from './ProtectedRoute'
import Link from 'next/link'
import { LayoutGrid, Users, Box, AlertTriangle, Settings, LogOut } from 'lucide-react'

// Sub-component: The dark command control rail
const StaffNavigationRail = () => {
  const links = [
    { href: '/dashboard', icon: <LayoutGrid size={22} />, label: 'Dashboard', active: true },
    { href: '/households', icon: <Users size={22} />, label: 'Households' },
    { href: '/distribution', icon: <Box size={22} />, label: 'Distribution' },
    { href: '/target-beneficiaries', icon: <AlertTriangle size={22} />, label: 'Beneficiaries' },
  ]

  return (
    <div className="w-[72px] shrink-0 bg-slate-950 dark:bg-black h-screen flex flex-col items-center py-6 border-r border-slate-800 z-20 sticky top-0 no-bg-transition">
      {/* Brand Icon */}
      <div className="mb-10 w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg cursor-pointer hover:bg-emerald-500 transition-colors">
        KB
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-6 w-full items-center">
        {links.map((link, idx) => (
          <Link
            key={idx}
            href={link.href}
            title={link.label}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-200 ${
              link.active 
              ? 'bg-white/10 text-white border border-white/20' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            {link.icon}
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto flex flex-col gap-6 w-full items-center">
        <button title="Settings" className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-xl transition-all">
          <Settings size={22} />
        </button>
        <button title="Sign Out" className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
          <LogOut size={22} />
        </button>
      </div>
    </div>
  )
}

// Sub-component: Industrial Top Bar
const StaffTopBar = () => {
  const [time, setTime] = useState<string>('--:--:--')

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }))
    }
    updateTime()
    const intv = setInterval(updateTime, 1000)
    return () => clearInterval(intv)
  }, [])

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-10 sticky top-0 w-full text-slate-300 text-sm font-mono tracking-tight">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          SYSTEM.ONLINE
        </span>
        <span className="text-slate-600">|</span>
        <span>AUTH: STAFF_SECURE</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 font-bold text-slate-200">
          <span className="text-slate-500 font-normal">UTC</span>
          {time}
        </div>
      </div>
    </header>
  )
}

interface StaffLayoutProps {
  children: ReactNode
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full flex bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
        {/* Rail on the far left */}
        <StaffNavigationRail />
        
        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <StaffTopBar />
          
          {/* Scrollable Edge-to-Edge Data Canvas */}
          <main className="flex-1 overflow-y-auto w-full no-scrollbar relative debug-screens">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
