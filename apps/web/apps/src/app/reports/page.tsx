import React from 'react'
import { DashboardLayout, Header } from '@/components/layout'
import { ReportsPageClient } from '@/components/reports'

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <Header title="Reports" subtitle="Generate and export distribution reports" />
      <ReportsPageClient />
    </DashboardLayout>
  )
}
