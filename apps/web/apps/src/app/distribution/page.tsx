import React from 'react'
import { DashboardLayout, Header } from '@/components/layout'
import { DistributionPageClient } from '@/components/distribution'

export default function DistributionPage() {
  return (
    <DashboardLayout>
      <Header
        title="Distribution"
        subtitle="Manage and track relief distributions"
      />
      <DistributionPageClient />
    </DashboardLayout>
  )
}
