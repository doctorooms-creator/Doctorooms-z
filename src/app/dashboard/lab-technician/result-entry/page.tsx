import { redirect } from 'next/navigation'
import { FlaskConical } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Result Entry',
}

export default function ResultEntryPage() {
  // This page acts as a redirect - actual entry is done via /[id]
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <FlaskConical className="mb-4 h-16 w-16 text-muted-foreground/30" />
      <h2 className="text-lg font-semibold">Result Entry</h2>
      <p className="mb-4 text-sm text-muted-foreground">Select a report from the worklist to enter results</p>
      <Link
        href="/dashboard/lab-technician/worklist"
        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
      >
        Go to Worklist
      </Link>
    </div>
  )
}
