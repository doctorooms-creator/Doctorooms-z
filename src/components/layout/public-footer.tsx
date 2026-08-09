import Link from 'next/link'
import { Stethoscope } from 'lucide-react'

const QUICK_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Find Doctors', href: '/doctors' },
  { label: 'Hospitals', href: '/hospitals' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const DOCTOR_LINKS = [
  { label: 'Find Doctors', href: '/doctors' },
  { label: 'Hospitals', href: '/hospitals' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact Us', href: '/contact' },
]

const LEGAL_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Find Doctors', href: '/doctors' },
]

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://facebook.com', icon: 'fb' },
  { label: 'Twitter', href: 'https://twitter.com', icon: 'tw' },
  { label: 'Instagram', href: 'https://instagram.com', icon: 'ig' },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: 'li' },
]

export function PublicFooter() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-teal-400" />
              <span className="font-bold text-xl text-white">Doctorooms</span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              India&apos;s trusted healthcare platform connecting patients with
              top doctors and hospitals. Book appointments, consult online,
              and manage your health journey effortlessly.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.icon}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-teal-600 hover:text-white transition-colors"
                >
                  <span className="text-xs font-bold uppercase">
                    {social.icon}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-teal-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {DOCTOR_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-teal-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Company */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-teal-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-500">
            &copy; 2025 Doctorooms. All rights reserved. Made with{' '}
            <span className="text-red-500">❤️</span> in India
          </p>
        </div>
      </div>
    </footer>
  )
}
