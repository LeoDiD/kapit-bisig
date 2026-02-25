import React from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  variant?: 'default' | 'yellow' | 'green' | 'red' | 'blue' | 'orange'
}

const iconVariantStyles = {
  default: 'bg-gray-100 text-gray-600',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-600',
  blue: 'bg-blue-100 text-blue-600',
  orange: 'bg-orange-100 text-orange-600',
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  variant = 'default' 
}: StatsCardProps) {
  return (
    <div className="rounded-2xl p-4 border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] transition-all hover:scale-[1.02] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconVariantStyles[variant]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">
            {value}
          </p>
          <p className="text-xs text-gray-500">
            {title}
          </p>
        </div>
      </div>
    </div>
  )
}
