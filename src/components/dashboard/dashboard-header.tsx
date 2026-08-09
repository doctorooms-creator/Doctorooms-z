'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
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
  CheckCheck,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DashboardHeaderProps {
  onMenuClick: () => void
  onLogout?: () => void
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
  '/dashboard/patient/blog': 'My Blog',
  '/dashboard/patient/blog/new': 'New Post',
  '/dashboard/patient/feedback': 'Feedback',
  '/dashboard/patient/notifications': 'Notifications',
  '/dashboard/patient/profile': 'Profile',
  '/dashboard/patient/settings': 'Settings',
  '/dashboard/hospital': 'Hospital Dashboard',
  '/dashboard/hospital/doctors': 'Doctors',
  '/dashboard/hospital/appointments': 'Appointments',
  '/dashboard/receptionist': 'Receptionist Dashboard',
  '/dashboard/receptionist/appointments': 'Appointments',
  '/dashboard/receptionist/pending-bookings': 'Pending Bookings',
  '/dashboard/receptionist/patients': 'Patients',
  '/dashboard/receptionist/walk-in': 'Walk-in Registration',
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

export function DashboardHeader({ onMenuClick, onLogout }: DashboardHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuthStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<{id: string, title: string, message: string, status: string, createdAt: string}[]>([])
  const [bellOpen, setBellOpen] = useState(false)

  const role = user?.role || 'patient'
  const pageTitle = getPageTitle(pathname)
  const userName = user?.name || 'User'
  const userEmail = user?.email || ''
  const userImg = user?.profileImg || ''

  useEffect(() => {
    if (role !== 'patient') return
    fetch('/api/patient/notifications?limit=5')
      .then((r) => r.json())
      .then((data) => {
        setUnreadCount(data?.unreadCount || 0)
        setNotifications(data?.notifications || [])
      })
      .catch(() => {})
  }, [role])

  const markAllRead = async () => {
    try {
      await fetch('/api/patient/notifications/read-all', { method: 'PATCH' })
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ' })))
    } catch {}
  }

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
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <h1 className="text-lg font-semibold tracking-tight hidden sm:block">{pageTitle}</h1>

      <div className="flex-1 flex justify-center">
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9 pr-20 h-9 bg-muted/50" />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </form>
      </div>

      <div className="flex items-center gap-2">
        <Popover open={bellOpen} onOpenChange={setBellOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400">
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>
            {/* List */}
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0 ${n.status === 'UNREAD' ? 'bg-teal-50/50 dark:bg-teal-950/20' : ''}`}>
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${n.status === 'UNREAD' ? 'bg-teal-500' : 'bg-transparent'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight line-clamp-2">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Footer */}
            <div className="border-t px-4 py-2">
              <button onClick={() => { setBellOpen(false); router.push(`/dashboard/${role}/notifications`) }} className="w-full text-center text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 py-1">
                View all notifications
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={userImg} alt={userName} />
                <AvatarFallback className="bg-teal-100 text-xs font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
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
              onClick={onLogout}
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
