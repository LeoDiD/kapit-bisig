'use client'

import React, { useEffect, useRef, useState } from 'react'

export type FilterDropdownOption = {
  value: string
  label: string
}

type FilterDropdownProps = {
  value: string
  options: FilterDropdownOption[]
  onChange: (value: string) => void
  className?: string
  buttonClassName?: string
  menuClassName?: string
}

export default function FilterDropdown({
  value,
  options,
  onChange,
  className = '',
  buttonClassName = '',
  menuClassName = '',
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      const target = event.target as Node
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          'w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700',
          buttonClassName,
        ].join(' ')}
      >
        <span className="text-sm truncate">{value}</span>
        <ChevronDownIcon />
      </button>

      {open && (
        <div
          ref={menuRef}
          className={[
            'absolute left-0 top-full mt-2 w-full rounded-2xl border border-[#DCDCDC] bg-[#ECECEC] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.14)] z-50 max-h-64 overflow-y-auto',
            menuClassName,
          ].join(' ')}
        >
          {options.map((opt) => {
            const selected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={[
                  'w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-left transition-colors',
                  selected ? 'bg-[#EAB308] text-gray-900' : 'text-slate-700 hover:bg-white/70',
                ].join(' ')}
              >
                <span className="w-5 flex items-center justify-center">
                  {selected ? <CheckIcon /> : null}
                </span>
                <span className="truncate">{opt.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ChevronDownIcon() {
  return (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}
