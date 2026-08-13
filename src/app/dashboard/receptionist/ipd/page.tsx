import IpdAdmissionClient from './client'

export const metadata = {
  title: 'IPD Admissions',
  description: 'Manage IPD patient admissions for your hospital',
}

export default function IpdAdmissionPage() {
  return <IpdAdmissionClient />
}
