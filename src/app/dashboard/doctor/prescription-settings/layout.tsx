'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  FolderOpen,
  Thermometer,
  CircleHelp,
  Lightbulb,
  Tag,
  Search,
  Table,
  Printer,
  type LucideIcon,
} from 'lucide-react'

const settingsTabs: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Categories', href: '/dashboard/doctor/prescription-settings/categories', icon: FolderOpen },
  { label: 'Complaints', href: '/dashboard/doctor/prescription-settings/complaints', icon: Thermometer },
  { label: 'Questions', href: '/dashboard/doctor/prescription-settings/questions', icon: CircleHelp },
  { label: 'Suggestions', href: '/dashboard/doctor/prescription-settings/suggestions', icon: Lightbulb },
  { label: 'Labels', href: '/dashboard/doctor/prescription-settings/labels', icon: Tag },
  { label: 'Findings', href: '/dashboard/doctor/prescription-settings/findings', icon: Search },
  { label: 'Table Templates', href: '/dashboard/doctor/prescription-settings/table-templates', icon: Table },
  { label: 'Print Settings', href: '/dashboard/doctor/prescription-settings/print-settings', icon: Printer },
]

export default function PrescriptionSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Prescription Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage master data used in prescriptions — categories, complaints, suggestions, labels, findings, and print configuration.
        </p>
      </div>

      {/* Sub-navigation tab bar */}
      <nav className="overflow-x-auto">
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
          {settingsTabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] data-[state=active]:shadow-sm',
                  isActive
                    ? 'bg-background text-foreground shadow-sm dark:bg-input/30 dark:border-input'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
