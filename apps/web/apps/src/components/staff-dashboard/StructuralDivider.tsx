'use client'

import React from 'react'

interface StructuralDividerProps {
  children?: React.ReactNode
  label?: string
  className?: string
}

export function StructuralDivider({ children, label, className = '' }: StructuralDividerProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 mr-4">
            {label}
          </h3>
          <div className="flex-grow h-px bg-slate-300 dark:bg-slate-700 w-full" />
        </div>
      )}
      
      <div className="w-full relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-slate-300 dark:bg-slate-700" />
        <div className="absolute top-0 left-0 bottom-0 w-px bg-slate-300 dark:bg-slate-700" />
        <div className="absolute top-0 right-0 bottom-0 w-px bg-slate-300 dark:bg-slate-700" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-300 dark:bg-slate-700" />
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
          {children}
        </div>
      </div>
    </div>
  )
}
