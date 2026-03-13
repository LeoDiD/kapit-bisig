'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import type { DistributionData } from '@/lib/api'

const statusStyles: Record<string, string> = {
  Unclaimed: 'bg-yellow-500 text-white',
  Claimed: 'bg-emerald-600 text-white',
}

const statusLabels: Record<string, string> = {
  Unclaimed: 'Unclaimed',
  Claimed: 'Claimed',
}

export default function RecentDistributions() {
  const [distributions, setDistributions] = useState<DistributionData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await api.getDistributions()
        const data = Array.isArray(res.data) ? res.data : []
        // Sort by most recent first, take top 5
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        if (mounted) setDistributions(sorted.slice(0, 3))
      } catch {
        // silently fail — dashboard shouldn't break
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800">Recent Distributions</h3>
        <Link href="/distribution" className="text-xs text-green-600 hover:text-green-700 font-medium">
          View all
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-2.5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200" />
                <div>
                  <div className="h-3.5 w-28 bg-gray-200 rounded mb-1.5" />
                  <div className="h-2.5 w-20 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      ) : distributions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BoxIcon className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No distributions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {distributions.map((dist) => {
            const status = dist.status || 'Unclaimed'
            const barangays = dist.assignedBarangays?.join(', ') || dist.barangay
            const dateStr = new Date(dist.scheduled || dist.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })

            return (
              <div
                key={dist._id || dist.id}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                    <DistIcon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{dist.barangay}</p>
                    <p className="text-xs text-gray-500">
                      {dist.households} household{dist.households !== 1 ? 's' : ''} • {barangays}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      statusStyles[status] || 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {statusLabels[status] || status}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1">{dateStr}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DistIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  )
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}
