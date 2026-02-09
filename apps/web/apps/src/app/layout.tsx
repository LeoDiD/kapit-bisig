import React from 'react'
import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { AuthProvider } from '@/lib/AuthContext'
import './globals.css'

// 2. Configure the font with necessary weights
const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'], 
})

export const metadata: Metadata = {
  title: 'Kapit-Bisig',
  description: 'Kapit-Bisig Web Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}