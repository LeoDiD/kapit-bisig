import { DashboardLayout, Header } from '@/components/layout'
import ResidentVerificationTable from '@/components/verifyResidents/ResidentVerificationTable'

export default function VerifyResidentsPage() {
  return (
    <DashboardLayout>
      <Header
        title="Verify Residents"
        subtitle="Verify and approve resident applications"
      />
      <ResidentVerificationTable />
    </DashboardLayout>
  )
}
