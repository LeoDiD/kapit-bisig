import React from 'react'
import Link from 'next/link'

interface StockItem {
  id: string
  name: string
  quantity: string
  isLow: boolean
}

const stockItems: StockItem[] = [
  { id: '1', name: 'Pending Writes', quantity: '2 pending', isLow: true },
]

export default function LowStockAlert() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800">Ledger Alerts</h3>
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          {stockItems.length} Items
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {stockItems.map((item) => (
          <div 
            key={item.id}
            className="flex items-center justify-between p-2.5 bg-red-50 rounded-xl border border-red-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <ShieldIcon className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-sm font-medium text-gray-800">{item.name}</span>
            </div>
            <span className="text-xs text-red-600 font-medium">{item.quantity}</span>
          </div>
        ))}
      </div>

      <Link
        href="/blockchain-ledger"
        className="block w-full py-2.5 text-center border-2 border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        Open Blockchain Ledger
      </Link>
    </div>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
    </svg>
  )
}
