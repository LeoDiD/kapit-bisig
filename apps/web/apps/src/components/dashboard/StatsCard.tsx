import React from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  variant?: 'default' | 'yellow' | 'green' | 'red'
}

const variantStyles = {
  default: 'bg-white border-gray-100',
  yellow: 'bg-yellow-500 border-yellow-400 text-white',
  green: 'bg-green-600 border-green-500 text-white',
  red: 'bg-white border-gray-100',
}

const iconVariantStyles = {
  default: 'bg-gray-100 text-gray-600',
  yellow: 'bg-yellow-400/30 text-white',
  green: 'bg-green-500/30 text-white',
  red: 'bg-red-100 text-red-600',
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  variant = 'default' 
}: StatsCardProps) {
  const isColored = variant === 'yellow' || variant === 'green'

  return (
    <div className={`rounded-2xl p-5 border shadow-sm transition-transform hover:scale-105 ${variantStyles[variant]}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconVariantStyles[variant]}`}>
          {icon}
        </div>
        <div>
          <p className={`text-3xl font-bold ${isColored ? 'text-white' : 'text-gray-800'}`}>
            {value}
          </p>
          <p className={`text-sm ${isColored ? 'text-white/80' : 'text-gray-500'}`}>
            {title}
          </p>
        </div>
      </div>
    </div>
  )
}
