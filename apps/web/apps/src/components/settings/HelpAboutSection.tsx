'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { showToast } from '@/lib/toast'

export default function HelpAboutSection() {
  const [showContact, setShowContact] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [searchQuery, setSearchQuery] = useState('')

  const handleCopyEmail = (email: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email)
      showToast.success('Email copied to clipboard')
    }
  }

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* ── Top Resource Cards ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Resource 1: Knowledge Hub */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#0F533A]/10 dark:bg-emerald-500/20 text-[#0F533A] dark:text-emerald-400 flex items-center justify-center mb-3">
              <QuestionMarkIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Knowledge Base & FAQs
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Find instant answers to common relief distributions, resident registration, and barcode verification.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-[#0F533A] dark:text-emerald-400">
              {FAQS.length} Articles Available Below
            </span>
          </div>
        </div>

        {/* Resource 2: Direct Support */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <ChatBubbleIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              IT & Operations Helpdesk
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Have technical issues or token mismatches? Contact the Rosario LGU technical response team.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setShowContact(true)}
              className="text-xs font-semibold text-[#0F533A] dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Contact Support Channel &rarr;
            </button>
          </div>
        </div>

        {/* Resource 3: System Status */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <SignalIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              System Operations
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Real-time database sync, distributed token validation, and claim auditing are operational.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700/60 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              All Systems Operational
            </span>
          </div>
        </div>
      </div>

      {/* ── Inline Expandable FAQ Accordion ─────────────────────────── */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 shadow-sm p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-700/60 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Quick answers about relief scheduling, registration tokens, and verification.
            </p>
          </div>

          {/* Search Filter */}
          <div className="relative sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-700/60 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F533A]/20 focus:border-[#0F533A]"
            />
            <SearchIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx
              return (
                <div
                  key={idx}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-[#0F533A]/30 dark:border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-gray-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/50 rounded-md">
                        {faq.category}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {faq.q}
                      </span>
                    </div>
                    <ChevronIcon
                      className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#0F533A] dark:text-emerald-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-slate-700/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center text-gray-400 text-xs">
              No matching help articles found for "{searchQuery}".
            </div>
          )}
        </div>
      </div>

      {/* ── System Details & Compliance Footer ─────────────────────────── */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 flex items-center justify-center font-mono font-bold text-sm">
              KB
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                KapitBisig Relief Management System
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                v1.0.0 (Production Release) &bull; Municipality of Rosario, Batangas
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700/80 rounded-lg">
              Data Privacy & COA Audit Compliant
            </span>
            <p className="text-[10px] text-gray-400 mt-1">
              &copy; {new Date().getFullYear()} LGU Rosario. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* ── Contact Support Modal ─────────────────────────── */}
      {showContact && typeof document !== 'undefined' && createPortal(
        <ModalBackdrop onClose={() => setShowContact(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 relative border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#0F533A]/10 text-[#0F533A] dark:text-emerald-400">
                  <PhoneIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Contact Support
                </h3>
              </div>
              <button
                onClick={() => setShowContact(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Email Support Card */}
              <div className="p-3.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MailIcon className="w-5 h-5 text-[#0F533A] dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      Official Email
                    </p>
                    <a
                      href="mailto:support@kapitbisig.ph"
                      className="text-xs text-[#0F533A] dark:text-emerald-400 hover:underline font-medium"
                    >
                      support@kapitbisig.ph
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyEmail('support@kapitbisig.ph')}
                  className="px-2.5 py-1 text-[11px] font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded-lg hover:bg-gray-100 transition-colors shadow-xs"
                >
                  Copy
                </button>
              </div>

              {/* Phone Hotline Card */}
              <div className="p-3.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-5 h-5 text-[#0F533A] dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      LGU Rosario Hotline
                    </p>
                    <a
                      href="tel:+639123456789"
                      className="text-xs text-gray-700 dark:text-gray-300 font-mono"
                    >
                      +63 912 345 6789
                    </a>
                  </div>
                </div>
                <a
                  href="tel:+639123456789"
                  className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#0F533A] hover:bg-[#0a3f2c] rounded-lg transition-colors shadow-xs"
                >
                  Call
                </a>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl">
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  <span className="font-semibold">Support Desk Hours:</span> Mon–Fri, 8:00 AM – 5:00 PM PHT. During active disaster declarations, dispatch lines operate 24/7.
                </p>
              </div>
            </div>
          </div>
        </ModalBackdrop>,
        document.body
      )}
    </div>
  )
}

/* ── FAQ Data with Categories ─────────────────────────── */

const FAQS = [
  {
    category: 'Distribution',
    q: 'How do I add and schedule a new relief distribution?',
    a: 'Navigate to the Distribution page from the main navigation sidebar, then click "New Distribution". Select the target barangay, set the package allocation, and specify the scheduled release date and distribution center site.',
  },
  {
    category: 'Households',
    q: 'How does resident and household token registration work?',
    a: 'Households register directly via the KapitBisig mobile app. An authorized registration token (issued by Rosario LGU staff) is required. During registration, government IDs and biometric face features are verified for duplicate prevention.',
  },
  {
    category: 'Verification',
    q: 'How are relief claims validated at distribution sites?',
    a: 'Claims are authenticated either via QR code scanning from the mobile app or on-site face verification matching the central database. Each claim transaction timestamp is permanently archived in audit logs.',
  },
  {
    category: 'Account & Security',
    q: 'What should I do if staff cannot log in or forget passwords?',
    a: 'Use the "Forgot Password" flow on the login page or update your credentials under Settings > Security. Password updates require a 6-digit email confirmation code. If an email is inaccessible, contact the Superadmin.',
  },
  {
    category: 'System',
    q: 'Are offline distribution claims supported?',
    a: 'Yes. In areas with intermittent connectivity, distribution scanning caches verified tokens locally and synchronizes transparently with the central database once network connection is restored.',
  },
]

/* ── Components & Icons ───────────────────────────────────────── */

function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}

function QuestionMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function SignalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  )
}
