import FamilyPortalClient from './client'

export const metadata = {
  title: 'Patient Status — Family Portal',
  robots: 'noindex, nofollow',
}

export default function FamilyPortalPage({
  params,
}: {
  params: Promise<{ accessCode: string }>
}) {
  return <FamilyPortalClient accessCode={params.then(p => p.accessCode)} />
}
