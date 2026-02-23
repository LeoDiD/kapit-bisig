'use client'

import React, { useState } from 'react'

export default function SecurityNotes() {
  const [open, setOpen] = useState(false)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
        aria-controls="security-notes-panel"
      >
        <span className="text-lg font-semibold text-slate-900">Security Notes</span>
        <span className="text-sm text-slate-500">{open ? 'Hide' : 'Show'}</span>
      </button>

      {open ? (
        <div id="security-notes-panel" className="mt-4">
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Codes are cryptographically generated</li>
            <li>Stored hashed on the server</li>
            <li>One-time use</li>
            <li>Expire after 30 days</li>
            <li>Protected by CSRF, auth, and rate limiting</li>
          </ul>
        </div>
      ) : null}
    </section>
  )
}

