'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Menu,
  Search,
  Bell,
  User,
  Settings,
  LogOut,
} from 'lucide-react'

interface DashboardHeaderProps {
  onMenuClick: () => void
}

const routeTitles: Record<string, string> = {
  '/dashboard/admin': 'Admin Dashboard',
  '/dashboard/admin/users': 'Users',
  '/dashboard/admin/doctors': 'Doctors',
  '/dashboard/admin/hospitals': 'Hospitals',
  '/dashboard/admin/appointments': 'Appointments',
  '/dashboard/admin/blog': 'Blog',
  '/dashboard/admin/inquiries': 'Inquiries',
  '/dashboard/admin/settings': 'Settings',
  '/dashboard/doctor': 'Doctor Dashboard',
  '/dashboard/doctor/appointments': 'Appointments',
  '/dashboard/doctor/prescriptions': 'Prescriptions',
  '/dashboard/doctor/prescriptions/new': 'New Prescription',
  '/dashboard/doctor/schedule': 'Schedule',
  '/dashboard/doctor/patients': 'Patients',
  '/dashboard/doctor/profile': 'Profile',
  '/dashboard/doctor/gallery': 'Gallery',
  '/dashboard/doctor/posts': 'Posts',
  '/dashboard/patient': 'Patient Dashboard',
  '/dashboard/patient/appointments': 'My Appointments',
  '/dashboard/patient/health-records': 'Health Records',
  '/dashboard/patient/feedback': 'Feedback',
  '/dashboard/patient/profile': 'Profile',
  '/dashboard/hospital': 'Hospital Dashboard',
  '/dashboard/hospital/doctors': 'Doctors',
  '/dashboard/hospital/appointments': 'Appointments',
  '/dashboard/receptionist': 'Receptionist Dashboard',
  '/dashboard/receptionist/appointments': 'Appointments',
  '/dashboard/receptionist/patients': 'Patients',
  '/dashboard/assistant': 'Assistant Dashboard',
  '/dashboard/assistant/appointments': 'Appointments',
  '/dashboard/assistant/patients': 'Patients',
  '/dashboard/pharmacist': 'Pharmacist Dashboard',
  '/dashboard/pharmacist/prescriptions': 'Prescriptions',
  '/dashboard/pharmacist/medicines': 'Medicine List',
}

function getPageTitle(pathname: string): string {
  return routeTitles[pathname] || 'Dashboard'
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [searchOpen, setSearchOpen] = useState(false)
  const [unreadCount] = useState(3)

  const pageTitle = getPageTitle(pathname)
  const role = session?.user?.role || 'patient'

  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
    },
    []
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      {/* Hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Page title */}
      <h1 className="text-lg font-semibold tracking-tight hidden sm:block">
        {pageTitle}
      </h1>

      {/* Search */}
      <div className="flex-1 flex justify-center">
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 pr-20 h-9 bg-muted/50"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </form>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
                <AvatarFallback className="bg-teal-100 text-xs font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                  {getInitials(session?.user?.name || 'U')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">{session?.user?.email || ''}</p>
                <p className="text-xs capitalize text-teal-600 dark:text-teal-400">{role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/dashboard/${role}/profile`)}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/${role === 'admin' ? 'admin' : role}/settings`)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
