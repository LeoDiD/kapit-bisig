import React from 'react'

interface LedgerStat {
  label: string
  value: string | number
  subtext?: string
  icon: React.ReactNode
  tone?: 'default' | 'danger' | 'warning'
}

function toneClasses(tone: LedgerStat['tone']) {
  switch (tone) {
    case 'danger':
      return {
        iconWrap: 'bg-red-50 text-red-600',
      }
    case 'warning':
      return {
        iconWrap: 'bg-yellow-50 text-yellow-700',
      }
    default:
      return {
        iconWrap: 'bg-gray-50 text-gray-700',
      }
  }
}

export default function BlockchainLedgerStats() {
  const stats: LedgerStat[] = [
    {
      label: 'Claims Today',
      value: 34,
      subtext: '187 this week',
      icon: <ShieldIcon className="w-4 h-4" />,
      tone: 'default',
    },
    {
      label: 'Unique Households',
      value: 142,
      icon: <UsersIcon className="w-4 h-4" />,
      tone: 'default',
    },
    {
      label: 'Duplicate Blocks',
      value: 3,
      icon: <NoEntryIcon className="w-4 h-4" />,
      tone: 'danger',
    },
    {
      label: 'Pending Writes',
      value: 2,
      subtext: '1 failed',
      icon: <ClockIcon className="w-4 h-4" />,
      tone: 'warning',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
      {stats.map((stat) => {
        const tones = toneClasses(stat.tone)
        return (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${tones.iconWrap}`}
              >
                {stat.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold text-gray-900 leading-tight">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500">{stat.label}</div>
                {stat.subtext && (
                  <div className="text-xs text-gray-400 mt-0.5">{stat.subtext}</div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z"
      />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-1a6 6 0 00-10.5-3.99M9 20H2v-1a6 6 0 0112 0v1M12 7a4 4 0 11-8 0 4 4 0 018 0zm9 1a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

function NoEntryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m12.728 0L5.636 18.364m0-12.728l12.728 12.728"
      />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}
