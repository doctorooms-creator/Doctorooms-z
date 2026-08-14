import BillDetailClient from './client'

export default function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <BillDetailClient />
}
