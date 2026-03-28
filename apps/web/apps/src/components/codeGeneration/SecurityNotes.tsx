'use client'

import React, { useState } from 'react'

export default function SecurityNotes() {
  const [open, setOpen] = useState(false)

  return (
    <section className="rounded-3xl border border-white/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 lg:p-8 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] mb-8 transition-colors">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-left group"
        aria-expanded={open}
        aria-controls="security-notes-panel"
      >
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide uppercase transition-colors group-hover:text-gray-600 dark:group-hover:text-gray-300">Security Notes</span>
        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors uppercase tracking-wider">{open ? 'Hide Details' : 'View Details'}</span>
      </button>

      <div 
        id="security-notes-panel" 
        className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] mt-6 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400 font-medium">
            <li className="flex items-start gap-3">
              <span className="text-gray-300 dark:text-gray-600 xl:mt-[2px] mt-[1px]">•</span>
               Codes are cryptographically generated and highly secure.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-gray-300 dark:text-gray-600 xl:mt-[2px] mt-[1px]">•</span>
               All code values are stored hashed on the server.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-gray-300 dark:text-gray-600 xl:mt-[2px] mt-[1px]">•</span>
               Codes are strict one-time use authorizations.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-gray-300 dark:text-gray-600 xl:mt-[2px] mt-[1px]">•</span>
               Expiring permanently 30 days after generation.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-gray-300 dark:text-gray-600 xl:mt-[2px] mt-[1px]">•</span>
               Requests are protected by CSRF validation, strict session auth, and per-ip rate limiting.
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

