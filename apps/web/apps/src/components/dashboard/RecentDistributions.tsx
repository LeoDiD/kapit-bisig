'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import type { DistributionData } from '@/lib/api'

export default function RecentDistributions() {
  const [distributions, setDistributions] = useState<DistributionData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await api.getDistributions()
        const data = Array.isArray(res.data) ? res.data : []
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        if (mounted) setDistributions(sorted.slice(0, 4))
      } catch {
        // silently fail
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="h-full flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Recent Distributions</h3>
          <Link
            href="/distribution"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            View all →
          </Link>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Latest relief batches deployed</p>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-1">
                    <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-700/60 rounded" />
                  </div>
                </div>
                <div className="h-5 w-14 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>
            ))}
          </div>
        ) : distributions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
            <BoxIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-1" />
            <p className="text-xs">No distributions recorded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {distributions.map((dist) => {
              const status = dist.status || 'Unclaimed'
              const isClaimed = status === 'Claimed'
              const dateStr = new Date(dist.scheduled || dist.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })

              return (
                <Link
                  key={dist._id || dist.id}
                  href="/distribution"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800/40 dark:border-slate-700/70 dark:hover:bg-slate-800 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                      <DistIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                        {dist.barangay}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {dist.households} households • {dateStr}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isClaimed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                          : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isClaimed ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                        }`}
                      />
                      {status}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Verified claims log</span>
        <Link href="/distribution" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
          Manage Batch →
        </Link>
      </div>
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

