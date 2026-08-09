'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Menu, Stethoscope, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Find Doctors', href: '/doctors' },
  { label: 'Hospitals', href: '/hospitals' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

export function PublicNavbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Stethoscope className="h-6 w-6 text-teal-600" />
          <span className="font-bold text-xl text-foreground">Doctorooms</span>
        </Link>

        {/* Center Nav Links - Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors hover:text-teal-600 ${
                  isActive ? 'text-teal-600 font-medium' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right Actions - Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white" asChild>
            <Link href="/book">Book Appointment</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-6 mt-8">
                <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                  <Stethoscope className="h-6 w-6 text-teal-600" />
                  <span className="font-bold text-xl">Doctorooms</span>
                </Link>
                <nav className="flex flex-col gap-3">
                  {NAV_LINKS.map((link) => {
                    const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={`text-sm transition-colors px-3 py-2 rounded-md ${
                          isActive
                            ? 'text-teal-600 font-medium bg-teal-50 dark:bg-teal-950'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        {link.label}
                      </Link>
                    )
                  })}
                </nav>
                <div className="flex flex-col gap-3 pt-4 border-t">
                  <Button variant="outline" asChild>
                    <Link href="/login" onClick={() => setOpen(false)}>Login</Link>
                  </Button>
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white" asChild>
                    <Link href="/book" onClick={() => setOpen(false)}>Book Appointment</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
