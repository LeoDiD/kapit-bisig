'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'

export default function HelpAboutSection() {
  const [showFAQ, setShowFAQ] = useState(false)
  const [showContact, setShowContact] = useState(false)

  return (
    <div>
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Help & Support</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Get assistance and learn more about KapitBisig.</p>

        <div className="mt-6 divide-y divide-gray-100 dark:divide-slate-700">
          {/* FAQs */}
          <button
            onClick={() => setShowFAQ(true)}
            className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl px-3 transition-colors -mx-3"
          >
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">FAQs</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Find answers to commonly asked questions</p>
            </div>
            <InfoCircleIcon className="w-5 h-5 text-gray-400 shrink-0" />
          </button>

          {/* Contact Support */}
          <button
            onClick={() => setShowContact(true)}
            className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl px-3 transition-colors -mx-3"
          >
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Contact Support</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Reach out to our support team</p>
            </div>
            <InfoCircleIcon className="w-5 h-5 text-gray-400 shrink-0" />
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-100 dark:border-slate-700">
          <p className="text-xs text-gray-400">KapitBisig Relief System v1.0.0</p>
          <p className="text-xs text-gray-400">&copy; 2026 LGU Rosario. All rights reserved.</p>
        </div>
      </div>

      {/* FAQ Modal */}
      {showFAQ && typeof document !== 'undefined' && createPortal(
        <ModalBackdrop onClose={() => setShowFAQ(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Frequently Asked Questions</h3>
              <button onClick={() => setShowFAQ(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {FAQS.map((faq, i) => (
                <FAQItem key={i} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </div>
        </ModalBackdrop>,
        document.body
      )}

      {/* Contact Support Modal */}
      {showContact && typeof document !== 'undefined' && createPortal(
        <ModalBackdrop onClose={() => setShowContact(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Contact Support</h3>
              <button onClick={() => setShowContact(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                <MailIcon className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Email Support</p>
                  <a href="mailto:support@kapitbisig.ph" className="text-sm text-green-600 hover:underline">
                    support@kapitbisig.ph
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                <PhoneIcon className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Phone</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">+63 912 345 6789</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-4">
                Support hours: Mon–Fri, 8:00 AM – 5:00 PM PHT
              </p>
            </div>
          </div>
        </ModalBackdrop>,
        document.body
      )}
    </div>
  )
}

/* ── Data ─────────────────────────────────────────────── */

const FAQS = [
  {
    q: 'How do I add a new distribution?',
    a: 'Navigate to the Distribution page from the sidebar, then click "New Distribution" to schedule a relief distribution for a barangay.',
  },
  {
    q: 'How does household registration work?',
    a: 'Households register via the mobile app. A registration token (provided by LGU staff) is required. The app captures ID and face data for verification.',
  },
  {
    q: 'How are relief claims verified?',
    a: 'Claims are verified through QR code scanning or face recognition at distribution sites. Each claim is recorded securely in the central database for transparency.',
  },
  {
    q: "What should I do if I can't log in?",
    a: 'Use the "Forgot Password" link on the login page to reset your password via email OTP. If issues persist, contact your system administrator.',
  },

]

/* ── Components ───────────────────────────────────────── */

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{question}</span>
        <ChevronIcon className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 text-sm text-gray-600 dark:text-gray-400">{answer}</div>
      )}
    </div>
  )
}

function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative">{children}</div>
    </div>
  )
}

/* ── Icons ────────────────────────────────────────────── */

function InfoCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  )
}
