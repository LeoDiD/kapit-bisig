import React from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  variant?: 'default' | 'yellow' | 'green' | 'red' | 'blue' | 'orange'
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}

const iconVariantStyles = {
  default: 'bg-gray-100 text-gray-600',
  yellow: 'bg-amber-50 text-amber-600',
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-500',
  blue: 'bg-blue-50 text-blue-600',
  orange: 'bg-orange-50 text-orange-600',
}

const borderAccent = {
  default: 'border-gray-100',
  yellow: 'border-amber-100',
  green: 'border-emerald-100',
  red: 'border-red-100',
  blue: 'border-blue-100',
  orange: 'border-orange-100',
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  variant = 'default',
  subtitle,
  trend,
}: StatsCardProps) {
  return (
    <div className={`rounded-2xl p-4 border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] transition-all hover:scale-[1.02] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] ${borderAccent[variant]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconVariantStyles[variant]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            trend === 'up' ? 'text-emerald-700 bg-emerald-50' :
            trend === 'down' ? 'text-red-600 bg-red-50' :
            'text-gray-500 bg-gray-100'
          }`}>
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800 leading-tight">
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">
        {title}
      </p>
      {subtitle && (
        <p className="text-[10px] text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  )
}
