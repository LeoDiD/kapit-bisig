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
    <div className={`rounded-2xl p-4 border shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] transition-all hover:scale-[1.02] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] ${variantStyles[variant]}`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconVariantStyles[variant]}`}>
          {icon}
        </div>
        <div>
          <p className={`text-2xl font-bold ${isColored ? 'text-white' : 'text-gray-800'}`}>
            {value}
          </p>
          <p className={`text-xs ${isColored ? 'text-white/80' : 'text-gray-500'}`}>
            {title}
          </p>
        </div>
      </div>
    </div>
  )
}
