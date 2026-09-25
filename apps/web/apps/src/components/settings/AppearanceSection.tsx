'use client'

import React, { useState } from 'react'
import { useTheme, type Theme, type TextSize } from '@/lib/ThemeContext'
import { profileApi } from '@/lib/api'
import { showToast } from '@/lib/toast'
import ConfirmModal from '@/components/ui/ConfirmModal'

export default function AppearanceSection() {
  const { theme, textSize, resolvedTheme, setTheme, setTextSize } = useTheme()
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await profileApi.updatePreferences({ theme, textSize }).catch(() => {})
      showToast.success('Appearance preferences saved')
    } catch {
      showToast.error('Failed to save preferences')
    } finally {
      setSaving(false)
      setConfirmOpen(false)
    }
  }

  const themes: {
    value: Theme
    title: string
    subtitle: string
    variant: 'light' | 'dark' | 'system'
  }[] = [
    {
      value: 'light',
      title: 'Light Mode',
      subtitle: 'Crisp white canvas with emerald accents',
      variant: 'light',
    },
    {
      value: 'dark',
      title: 'Dark Mode',
      subtitle: 'Deep slate surfaces designed for low light',
      variant: 'dark',
    },
    {
      value: 'system',
      title: 'System Default',
      subtitle: 'Syncs automatically with your OS settings',
      variant: 'system',
    },
  ]

  const textSizes: {
    value: TextSize
    label: string
    glyph: string
    desc: string
  }[] = [
    {
      value: 'small',
      label: 'Small',
      glyph: 'A',
      desc: 'Compact layout & denser data',
    },
    {
      value: 'medium',
      label: 'Default',
      glyph: 'Aa',
      desc: 'Standard balanced readability',
    },
    {
      value: 'large',
      label: 'Large',
      glyph: 'AA',
      desc: 'Enhanced legibility and spacing',
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Theme Selection Card ─────────────────────────── */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 shadow-sm p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-700/60 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Interface Theme
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Select how KapitBisig looks to you on this device.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#0F533A] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            Active: {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </div>

        {/* Visual Theme Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((item) => {
            const isSelected = theme === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setTheme(item.value)}
                className={`group relative text-left rounded-2xl border-2 p-3 transition-all duration-200 flex flex-col ${
                  isSelected
                    ? 'border-[#0F533A] dark:border-emerald-500 bg-[#0F533A]/5 dark:bg-emerald-500/10 shadow-sm ring-1 ring-[#0F533A]/20'
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-gray-50/50 dark:bg-slate-800/50'
                }`}
              >
                {/* Mini UI Mockup */}
                <div className="w-full h-24 rounded-xl overflow-hidden mb-3 border border-gray-200/80 dark:border-slate-700/80 relative shadow-inner">
                  {item.variant === 'light' && (
                    <div className="w-full h-full bg-slate-100 p-2 flex flex-col gap-1.5">
                      {/* Mini App Bar */}
                      <div className="h-3 bg-[#0F533A] rounded-md flex items-center px-1.5 gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                        <div className="w-6 h-1 bg-white/60 rounded-full" />
                      </div>
                      {/* Mini Content */}
                      <div className="flex-1 flex gap-1.5">
                        <div className="w-1/3 bg-white rounded-md shadow-xs p-1 flex flex-col gap-1">
                          <div className="w-full h-1 bg-gray-200 rounded" />
                          <div className="w-3/4 h-1 bg-gray-200 rounded" />
                        </div>
                        <div className="flex-1 bg-white rounded-md shadow-xs p-1 flex flex-col gap-1">
                          <div className="w-full h-2 bg-emerald-50 rounded" />
                          <div className="w-1/2 h-1 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </div>
                  )}

                  {item.variant === 'dark' && (
                    <div className="w-full h-full bg-slate-900 p-2 flex flex-col gap-1.5">
                      {/* Mini App Bar */}
                      <div className="h-3 bg-slate-800 rounded-md border border-slate-700 flex items-center px-1.5 gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <div className="w-6 h-1 bg-slate-400 rounded-full" />
                      </div>
                      {/* Mini Content */}
                      <div className="flex-1 flex gap-1.5">
                        <div className="w-1/3 bg-slate-800 rounded-md border border-slate-700/60 p-1 flex flex-col gap-1">
                          <div className="w-full h-1 bg-slate-700 rounded" />
                          <div className="w-3/4 h-1 bg-slate-700 rounded" />
                        </div>
                        <div className="flex-1 bg-slate-800 rounded-md border border-slate-700/60 p-1 flex flex-col gap-1">
                          <div className="w-full h-2 bg-emerald-950/60 rounded" />
                          <div className="w-1/2 h-1 bg-slate-700 rounded" />
                        </div>
                      </div>
                    </div>
                  )}

                  {item.variant === 'system' && (
                    <div className="w-full h-full flex">
                      {/* Left half Light */}
                      <div className="w-1/2 h-full bg-slate-100 p-2 border-r border-gray-300 flex flex-col gap-1.5">
                        <div className="h-3 bg-[#0F533A] rounded-md" />
                        <div className="flex-1 bg-white rounded-md shadow-xs p-1" />
                      </div>
                      {/* Right half Dark */}
                      <div className="w-1/2 h-full bg-slate-900 p-2 flex flex-col gap-1.5">
                        <div className="h-3 bg-slate-800 rounded-md" />
                        <div className="flex-1 bg-slate-800 rounded-md border border-slate-700" />
                      </div>
                    </div>
                  )}

                  {/* Selected Badge */}
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#0F533A] dark:bg-emerald-500 text-white flex items-center justify-center shadow-md">
                      <CheckIcon className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="pt-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    {item.subtitle}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Accessibility & Typography Card ─────────────────────────── */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 shadow-sm p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-700/60 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Typography & Scaling
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Customize text size for visual comfort across dashboards and forms.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
            {textSize.toUpperCase()}
          </span>
        </div>

        {/* Text Size Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {textSizes.map((opt) => {
            const isSelected = textSize === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTextSize(opt.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#0F533A] dark:border-emerald-500 bg-[#0F533A]/5 dark:bg-emerald-500/10 ring-1 ring-[#0F533A]/20'
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-gray-50/50 dark:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 flex items-center justify-center font-bold text-sm">
                    {opt.glyph}
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-[#0F533A] dark:bg-emerald-500 text-white flex items-center justify-center">
                      <CheckIcon className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {opt.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end mt-7 pt-5 border-t border-gray-100 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0F533A] hover:bg-[#0a3f2c] active:bg-[#073021] rounded-xl transition-all shadow-sm shadow-[#0F533A]/25 disabled:opacity-50"
          >
            {saving ? <Spinner /> : <PaletteIcon className="w-4 h-4" />}
            Save Preferences
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Save Appearance Preferences"
        body="Are you sure you want to save these display preferences? They will be applied to your account across your sessions."
        confirmLabel="Yes, Save"
        loading={saving}
        onConfirm={handleSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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

