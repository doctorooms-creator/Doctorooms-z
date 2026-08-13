import NursePatientDetailClient from './client'

interface PageProps {
  params: Promise<{ admissionId: string }>
}

export default async function NursePatientDetailPage({ params }: PageProps) {
  return <NursePatientDetailClient admissionId={(await params).admissionId} />
}
