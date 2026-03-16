'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { DashboardLayout, Header } from '@/components/layout'
import CodeGenerationTable from '@/components/codeGeneration/CodeGenerationTable'

export default function CodeGenerationPage() {
  const { user, loading, isSuperadmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
    } else if (!isSuperadmin) {
      router.replace('/dashboard')
    }
  }, [user, loading, isSuperadmin, router])

  if (loading || !user || !isSuperadmin) return null

  return (
    <DashboardLayout>
      <Header
        title="Code Generation"
        subtitle="Generate unique barangay codes"
      />
      <CodeGenerationTable />
    </DashboardLayout>
  )
}
