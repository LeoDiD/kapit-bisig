'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import Header from '@/components/layout/Header'
import {
  AccountProfileSection,
  SecuritySection,
  AppearanceSection,
  HelpAboutSection,
} from '@/components/settings'

type SettingsTab = 'account' | 'security' | 'appearance' | 'help'

const NAV_ITEMS: { key: SettingsTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: 'account', label: 'Account & Profile', icon: UserIcon },
  { key: 'security', label: 'Security', icon: ShieldIcon },
  { key: 'appearance', label: 'Appearance', icon: PaletteIcon },
  { key: 'help', label: 'Help & About', icon: HelpIcon },
]

function SettingsContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<SettingsTab>('account')

  // Support ?tab=security etc. from external navigation
  useEffect(() => {
    const tab = searchParams.get('tab') as SettingsTab | null
    if (tab && NAV_ITEMS.some((n) => n.key === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left nav */}
      <aside className="lg:w-56 shrink-0">
        <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 space-y-0.5 lg:sticky lg:top-24">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.key
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#0F533A] text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Right content */}
      <section className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-h-[500px]">
        {activeTab === 'account' && <AccountProfileSection />}
        {activeTab === 'security' && <SecuritySection />}
        {activeTab === 'appearance' && <AppearanceSection />}
        {activeTab === 'help' && <HelpAboutSection />}
      </section>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <Header title="Settings" subtitle="Manage your account and preferences" />
      <Suspense fallback={<div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />}>
        <SettingsContent />
      </Suspense>
    </DashboardLayout>
  )
}

/* ── Icons ─────────────────────────────────────────────── */

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  )
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
