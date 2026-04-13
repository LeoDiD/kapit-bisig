'use client'

import React, { useState } from 'react'

interface ActionTask {
  id: string
  title: string
  description: string
  priority: 'high' | 'normal' | 'low'
  timestamp: string
}

interface ActionQueueProps {
  tasks: ActionTask[]
  onAction: (id: string) => Promise<void>
  loading?: boolean
}

export function ActionQueue({ tasks, onAction, loading = false }: ActionQueueProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [errorId, setErrorId] = useState<string | null>(null)

  const handleAction = async (id: string) => {
    setProcessingId(id)
    setErrorId(null)
    try {
      await onAction(id)
    } catch (err) {
      setErrorId(id)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="flex flex-col border border-slate-300 dark:border-slate-700 divide-y divide-slate-300 dark:divide-slate-700">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 animate-pulse flex justify-between items-center bg-white dark:bg-slate-900">
            <div className="space-y-2">
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-bold uppercase tracking-widest text-slate-500">Queue Clear</span>
        <p className="text-slate-500 mt-2 text-sm text-center">There are no pending actions requiring your attention.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col border border-slate-300 dark:border-slate-700 divide-y divide-slate-300 dark:divide-slate-700 bg-white dark:bg-slate-900">
      {tasks.map(task => {
        const isProcessing = processingId === task.id
        const isError = errorId === task.id

        return (
          <div key={task.id} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex-1 flex gap-4">
              <div className="pt-1">
                <span className={`block w-2 h-2 rounded-full mt-1.5 ${
                  task.priority === 'high' ? 'bg-red-500' :
                  task.priority === 'normal' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between sm:justify-start sm:gap-4 mb-1">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{task.title}</h4>
                  <span className="text-xs text-slate-500 font-mono">{task.timestamp}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{task.description}</p>
                {isError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-semibold">
                    Action failed. Please try again or check logs.
                  </p>
                )}
              </div>
            </div>
            <div className="sm:shrink-0 flex justify-end">
              <button
                onClick={() => handleAction(task.id)}
                disabled={isProcessing}
                className={`
                  px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors
                  border min-w-[120px] flex items-center justify-center
                  ${isProcessing 
                    ? 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white dark:bg-emerald-500/20 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500/30'
                  }
                `}
              >
                {isProcessing ? 'Processing' : 'Resolve'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
