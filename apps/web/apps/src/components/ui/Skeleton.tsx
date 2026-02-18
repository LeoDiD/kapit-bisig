'use client'

import React from 'react'

/* ------------------------------------------------------------------ */
/*  TableSkeleton — shimmer rows for any table/list loading state      */
/* ------------------------------------------------------------------ */

interface TableSkeletonProps {
  /** Number of skeleton rows to show (default: 6) */
  rows?: number
  /** Number of columns / blocks per row (default: 5) */
  columns?: number
}

/**
 * Renders animated pulse rows that mimic a data table while loading.
 * Wrap it in the same container you use for the real table.
 */
export function TableSkeleton({ rows = 6, columns = 5 }: TableSkeletonProps) {
  // Vary widths per column so the shimmer looks natural
  const widthClasses = ['w-32', 'w-24', 'w-16', 'w-20', 'w-28', 'w-12']

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
        {Array.from({ length: columns }).map((_, c) => (
          <div
            key={`hdr-${c}`}
            className={`h-3 ${widthClasses[c % widthClasses.length]} bg-gray-200 rounded animate-pulse`}
          />
        ))}
        <div className="flex-1" />
      </div>

      {/* Row skeletons */}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-4 animate-pulse">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={`${r}-${c}`}
                className={`h-4 ${widthClasses[(r + c) % widthClasses.length]} bg-gray-200 rounded`}
              />
            ))}
            <div className="flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  CardSkeleton — shimmer placeholder for stat cards                  */
/* ------------------------------------------------------------------ */

export function CardSkeleton() {
  return (
    <div className="rounded-2xl p-4 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] bg-white animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gray-200" />
        <div className="space-y-2">
          <div className="h-5 w-16 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}

export default TableSkeleton
