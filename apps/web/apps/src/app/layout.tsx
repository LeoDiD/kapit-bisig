import React from 'react'
import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/AuthContext'
import { RouteLoadingProvider } from '@/lib/RouteLoadingContext'
import TopLoadingBar from '@/components/layout/TopLoadingBar'
import './globals.css'

// 2. Configure the font with necessary weights
const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'], 
})

export const metadata: Metadata = {
  title: 'Kapit-Bisig',
  description: 'Kapit-Bisig Web Application',
  icons: {
    icon: '/images/Logo1.png',
    shortcut: '/images/Logo1.png',
    apple: '/images/Logo1.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <AuthProvider>
          <RouteLoadingProvider>
          <TopLoadingBar />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: 'inherit',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
              },
            }}
            richColors
            closeButton
          />
          </RouteLoadingProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
