import DoctorIpdPatientClient from './client'

interface PageProps {
  params: Promise<{ admissionId: string }>
}

export default async function DoctorIpdPatientPage({ params }: PageProps) {
  return <DoctorIpdPatientClient admissionId={(await params).admissionId} />
}
