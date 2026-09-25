'use client'

import React from 'react'

export type StatusDotColor = 'emerald' | 'amber' | 'blue' | 'rose'

export interface SectionHeaderProps {
  /** Uppercase category or context label displayed at the top */
  eyebrow?: string
  /** Primary title heading */
  title: string
  /** Subtitle or descriptive helper text */
  subtitle?: string
  /** Status indicator dot color (defaults to emerald if true) */
  statusDot?: boolean | StatusDotColor
  /** Right-side accessory (e.g. meta badges, date range pills, action buttons) */
  rightAccessory?: React.ReactNode
  /** Optional border-bottom divider */
  borderBottom?: boolean
  /** Optional additional container class names */
  className?: string
}

const DOT_COLOR_CLASSES: Record<StatusDotColor, { dot: string; ring: string }> = {
  emerald: {
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/20',
  },
  amber: {
    dot: 'bg-amber-500',
    ring: 'ring-amber-500/20',
  },
  blue: {
    dot: 'bg-blue-500',
    ring: 'ring-blue-500/20',
  },
  rose: {
    dot: 'bg-rose-500',
    ring: 'ring-rose-500/20',
  },
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  statusDot,
  rightAccessory,
  borderBottom = false,
  className = '',
}: SectionHeaderProps) {
  const dotColor: StatusDotColor =
    typeof statusDot === 'string' ? statusDot : 'emerald'

  const showDot = Boolean(statusDot)
  const dotConfig = DOT_COLOR_CLASSES[dotColor] || DOT_COLOR_CLASSES.emerald

  return (
    <div
      className={`flex flex-col gap-3.5 sm:flex-row sm:items-start sm:justify-between ${
        borderBottom
          ? 'border-b border-slate-100 dark:border-slate-800/80 pb-4 sm:pb-5 mb-5'
          : ''
      } ${className}`}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div className="flex items-center gap-2 mb-1.5">
            {showDot && (
              <span
                className={`flex h-2.5 w-2.5 rounded-full ${dotConfig.dot} ring-4 ${dotConfig.ring} animate-pulse shrink-0`}
                aria-hidden="true"
              />
            )}
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {eyebrow}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          {!eyebrow && showDot && (
            <span
              className={`flex h-2.5 w-2.5 rounded-full ${dotConfig.dot} ring-4 ${dotConfig.ring} animate-pulse shrink-0`}
              aria-hidden="true"
            />
          )}
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h2>
        </div>

        {subtitle && (
          <p className="mt-1.5 max-w-3xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {rightAccessory && (
        <div className="flex flex-wrap items-center gap-2.5 sm:self-center shrink-0">
          {rightAccessory}
        </div>
      )}
    </div>
  )
}
