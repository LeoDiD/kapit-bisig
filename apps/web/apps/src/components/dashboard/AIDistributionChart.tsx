'use client'

import React from 'react'

interface PriorityData {
  label: string
  value: number
  color: string
}

const priorityData: PriorityData[] = [
  { label: 'High Priority', value: 35, color: '#dc2626' },
  { label: 'Medium Priority', value: 45, color: '#eab308' },
  { label: 'Low Priority', value: 20, color: '#22c55e' },
]

export default function AIDistributionChart() {
  const total = priorityData.reduce((sum, item) => sum + item.value, 0)
  
  // Calculate stroke dash array for donut chart
  const radius = 60
  const circumference = 2 * Math.PI * radius
  let cumulativePercent = 0

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-6">AI Priority Distribution</h3>
      
      <div className="flex items-center justify-between">
        {/* Donut Chart */}
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {priorityData.map((item, index) => {
              const percent = item.value / total
              const dashArray = circumference * percent
              const dashOffset = circumference * cumulativePercent
              cumulativePercent += percent

              return (
                <circle
                  key={index}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={`${dashArray} ${circumference}`}
                  strokeDashoffset={-dashOffset}
                  className="transition-all duration-500"
                />
              )
            })}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{total}%</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {priorityData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
