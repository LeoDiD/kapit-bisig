'use client'

import React, { useState } from 'react'
import { useTheme, type Theme, type TextSize } from '@/lib/ThemeContext'
import { profileApi } from '@/lib/api'
import { showToast } from '@/lib/toast'
import ConfirmModal from '@/components/ui/ConfirmModal'
import SelectDropdown from '@/components/ui/SelectDropdown'

export default function AppearanceSection() {
  const { theme, textSize, resolvedTheme, setTheme, setTextSize } = useTheme()
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isDark = resolvedTheme === 'dark'

  const handleSave = async () => {
    setSaving(true)
    try {
      // Persist to server (best-effort)
      await profileApi.updatePreferences({ theme, textSize }).catch(() => {})
      showToast.success('Preferences saved')
    } catch {
      showToast.error('Failed to save preferences')
    } finally {
      setSaving(false)
      setConfirmOpen(false)
    }
  }

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: 'Light',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
    },
    {
      value: 'system',
      label: 'System',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  const textSizeOptions = [
    { value: 'medium', label: 'Medium (Default)' },
    { value: 'small', label: 'Small' },
    { value: 'large', label: 'Large' },
  ]

  const textSizePreview: Record<TextSize, string> = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  }

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div className={`rounded-2xl border shadow-sm p-6 ${
        isDark
          ? 'bg-slate-800/50 border-slate-700/50'
          : 'bg-white border-gray-100'
      }`}>
        <h2 className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Theme</h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Choose your preferred color scheme.
        </p>

        <div className="grid grid-cols-3 gap-3 mt-6">
          {themeOptions.map((opt) => {
            const isSelected = theme === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex flex-col items-center gap-2 py-4 px-3 text-sm font-medium rounded-xl border-2 transition-all ${
                  isSelected
                    ? isDark
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-[#0F533A] bg-[#0F533A]/5 text-[#0F533A]'
                    : isDark
                      ? 'border-slate-600 bg-slate-700/30 text-gray-300 hover:border-slate-500 hover:bg-slate-700/60'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className={isSelected ? (isDark ? 'text-emerald-400' : 'text-[#0F533A]') : (isDark ? 'text-gray-400' : 'text-gray-400')}>
                  {opt.icon}
                </span>
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Accessibility / Text Size */}
      <div className={`rounded-2xl border shadow-sm p-6 ${
        isDark
          ? 'bg-slate-800/50 border-slate-700/50'
          : 'bg-white border-gray-100'
      }`}>
        <h2 className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
          Accessibility
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Adjust display preferences for comfort.
        </p>

        <div className="mt-4">
          <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Text Size
          </label>
          <SelectDropdown
            value={textSize}
            onChange={(val: string) => setTextSize(val as TextSize)}
            options={textSizeOptions}
            ariaLabel="Select text size"
            className="w-full max-w-xs"
            buttonClassName="py-2.5"
          />
        </div>

        {/* Preview */}
        <div className={`mt-4 rounded-xl p-4 ${isDark ? 'bg-slate-700/50 border border-slate-600/50' : 'bg-gray-50 border border-gray-100'}`}>
          <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Preview
          </p>
          <p className={`${textSizePreview[textSize]} ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            The quick brown fox jumps over the lazy dog. This is how your text will appear across the application.
          </p>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={saving}
          className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 ${
            isDark
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-[#0F533A] text-white hover:bg-[#0a3f2c]'
          }`}
        >
          {saving && <Spinner />}
          Save Preferences
        </button>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Confirm Preferences"
        body="Save these appearance preferences?"
        confirmLabel="Yes, Save"
        loading={saving}
        onConfirm={handleSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
