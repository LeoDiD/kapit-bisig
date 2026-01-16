import React from 'react'
import Link from 'next/link'

interface StockItem {
  id: string
  name: string
  quantity: string
  isLow: boolean
}

const stockItems: StockItem[] = [
  { id: '1', name: 'Medicine Kit', quantity: '<50 kits', isLow: true },
]

export default function LowStockAlert() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Low Stock Alert</h3>
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          {stockItems.length} Items
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {stockItems.map((item) => (
          <div 
            key={item.id}
            className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <PackageIcon className="w-4 h-4 text-red-500" />
              </div>
              <span className="font-medium text-gray-800">{item.name}</span>
            </div>
            <span className="text-sm text-red-600 font-medium">{item.quantity}</span>
          </div>
        ))}
      </div>

      <Link
        href="/inventory"
        className="block w-full py-3 text-center border-2 border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        Manage Inventory
      </Link>
    </div>
  )
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}
