'use client'

import React from 'react'

interface QuickAction {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  primary?: boolean
}

interface QuickActionsTerminalProps {
  actions: QuickAction[]
}

export function QuickActionsTerminal({ actions }: QuickActionsTerminalProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={action.onClick}
          className={`
            group flex items-center justify-center gap-3 p-4 border transition-all duration-150
            ${action.primary 
              ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500/30' 
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            }
          `}
        >
          {action.icon && (
            <span className={`opacity-70 group-hover:opacity-100 transition-opacity ${action.primary ? 'text-current' : 'text-slate-500 dark:text-slate-400'}`}>
              {action.icon}
            </span>
          )}
          <span className="text-sm font-bold tracking-wide uppercase">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  )
}
