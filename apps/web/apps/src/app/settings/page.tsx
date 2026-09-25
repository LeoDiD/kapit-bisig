'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import Header from '@/components/layout/Header'
import {
  AccountProfileSection,
  SecuritySection,
  OperationsAlertsSection,
  AppearanceSection,
  HelpAboutSection,
} from '@/components/settings'

export type SettingsTab = 'account' | 'security' | 'preferences' | 'appearance' | 'help'

interface NavItem {
  key: SettingsTab
  label: string
  description: string
  icon: React.FC<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'account',
    label: 'Account & Profile',
    description: 'Personal details and avatar',
    icon: UserIcon,
  },
  {
    key: 'security',
    label: 'Security & Access',
    description: 'Password and session governance',
    icon: ShieldIcon,
  },
  {
    key: 'preferences',
    label: 'Operations & Alerts',
    description: 'Default barangay and relief alerts',
    icon: SlidersIcon,
  },
  {
    key: 'appearance',
    label: 'Appearance',
    description: 'Theme and display scaling',
    icon: PaletteIcon,
  },
  {
    key: 'help',
    label: 'Help & Support',
    description: 'FAQs, guides, and system info',
    icon: HelpIcon,
  },
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


  const currentItem = NAV_ITEMS.find((n) => n.key === activeTab) || NAV_ITEMS[0]

  return (
    <div className="space-y-6">
      {/* Mobile/Tablet Horizontal Tabs Bar */}
      <div className="lg:hidden">
        <nav
          aria-label="Settings navigation"
          className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200/80 dark:border-slate-800"
        >
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.key
            const Icon = item.icon
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  active
                    ? 'bg-[#0F533A] text-white shadow-sm shadow-[#0F533A]/25'
                    : 'bg-white dark:bg-slate-800/80 text-gray-600 dark:text-gray-300 border border-gray-200/70 dark:border-slate-700/70 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400 dark:text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Settings Grid */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Navigation Sidebar (Desktop) */}
        <aside className="hidden lg:block w-72 shrink-0 lg:sticky lg:top-24">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 shadow-sm p-3 backdrop-blur-sm">
            <div className="px-3 pt-2 pb-3 border-b border-gray-100 dark:border-slate-700/60 mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">
                Preferences & Settings
              </span>
            </div>

            <nav className="space-y-1.5" aria-label="Settings categories">
              {NAV_ITEMS.map((item) => {
                const active = activeTab === item.key
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full group flex items-start gap-3.5 p-3 rounded-xl text-left transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-[#0F533A] to-[#146c4c] text-white shadow-md shadow-[#0F533A]/20'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 transition-colors ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 dark:bg-slate-700/70 text-gray-500 dark:text-gray-400 group-hover:bg-[#0F533A]/10 group-hover:text-[#0F533A] dark:group-hover:text-emerald-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold truncate ${active ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                          {item.label}
                        </p>
                      </div>
                      <p
                        className={`text-xs mt-0.5 leading-snug truncate ${
                          active ? 'text-white/80' : 'text-gray-400 dark:text-gray-400'
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Right Content Area */}
        <section className="flex-1 w-full min-w-0 min-h-[540px]">
          {activeTab === 'account' && <AccountProfileSection />}
          {activeTab === 'security' && <SecuritySection />}
          {activeTab === 'preferences' && <OperationsAlertsSection />}
          {activeTab === 'appearance' && <AppearanceSection />}
          {activeTab === 'help' && <HelpAboutSection />}
        </section>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <Header
        title="Settings"
        subtitle="Manage your KapitBisig profile, security credentials, and display preferences"
      />
      <Suspense
        fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-100 dark:bg-slate-800 rounded-2xl w-full" />
            <div className="h-96 bg-gray-100 dark:bg-slate-800 rounded-2xl w-full" />
          </div>
        }
      >
        <SettingsContent />
      </Suspense>
    </DashboardLayout>
  )
}

/* ── Modern Icons ─────────────────────────────────────────────── */

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function SlidersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  )
}

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  )
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}


