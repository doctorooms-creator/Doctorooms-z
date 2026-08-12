'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth-store'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getSidebarItems, type SidebarItem } from '@/lib/sidebar-config'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Stethoscope, LogOut, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react'

interface DashboardSidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/** Check if any child of a parent item matches the current pathname */
function isChildActive(item: SidebarItem, pathname: string): boolean {
  if (!item.children) return false
  return item.children.some((child) => pathname.startsWith(child.href))
}

/** Check if a flat item (no children) is active */
function isItemActive(item: SidebarItem, pathname: string, role: string): boolean {
  if (item.children) return false
  return item.href === `/dashboard/${role}`
    ? pathname === item.href
    : pathname.startsWith(item.href)
}

function SidebarNavItem({
  item,
  collapsed,
  pathname,
  role,
  onMobileClose,
}: {
  item: SidebarItem
  collapsed: boolean
  pathname: string
  role: string
  onMobileClose: () => void
}) {
  const hasChildren = !!item.children && item.children.length > 0
  const isActive = hasChildren ? isChildActive(item, pathname) : isItemActive(item, pathname, role)

  if (hasChildren && item.children) {
    // Collapsible sub-menu item
    return (
      <Collapsible
        defaultOpen={isActive}
        className="group/collapsible"
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              collapsed && 'justify-center px-2'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-teal-500"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <item.icon
              className={cn(
                'h-5 w-5 shrink-0 transition-colors',
                isActive ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground group-hover:text-foreground'
              )}
            />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 overflow-hidden text-left whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                </motion.span>
              )}
            </AnimatePresence>
            <span className="sr-only">Toggle {item.label}</span>
          </button>
        </CollapsibleTrigger>
        <AnimatePresence>
          {!collapsed && (
            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
                  {item.children.map((child) => {
                    const childActive = pathname.startsWith(child.href)
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onMobileClose}
                        className={cn(
                          'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-200',
                          childActive
                            ? 'bg-teal-50 font-medium text-teal-700 dark:bg-teal-950/50 dark:text-teal-400'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )}
                      >
                        <child.icon
                          className={cn(
                            'h-4 w-4 shrink-0',
                            childActive ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground'
                          )}
                        />
                        <span className="truncate">{child.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </motion.div>
            </CollapsibleContent>
          )}
        </AnimatePresence>
      </Collapsible>
    )
  }

  // Regular flat item
  const linkContent = (
    <Link
      href={item.href}
      onClick={onMobileClose}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-teal-500"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <item.icon
        className={cn(
          'h-5 w-5 shrink-0 transition-colors',
          isActive ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground group-hover:text-foreground'
        )}
      />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {!collapsed && item.badge !== undefined && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-100 px-1.5 text-xs font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
          {item.badge}
        </span>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return linkContent
}

export function DashboardSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const role = user?.role || 'patient'
  const items = getSidebarItems(role)

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-4">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onMobileClose}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap text-lg font-bold tracking-tight"
              >
                Doctorooms
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {items.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              pathname={pathname}
              role={role}
              onMobileClose={onMobileClose}
            />
          ))}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User info + Logout */}
      <div className="p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg p-2',
            collapsed && 'justify-center p-2'
          )}
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={user?.profileImg || ''} alt={user?.name || ''} />
            <AvatarFallback className="bg-teal-100 text-sm font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
              {getInitials(user?.name || 'U')}
            </AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col overflow-hidden"
              >
                <span className="truncate text-sm font-medium">{user?.name || 'User'}</span>
                <span className="truncate text-xs capitalize text-muted-foreground">{role}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500"
                onClick={() => { window.location.href = '/login' }}
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Collapse toggle - desktop only */}
      <div className="hidden border-t border-border p-2 md:block">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-muted-foreground hover:text-foreground"
          onClick={onToggle}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        className="hidden h-screen border-r border-border bg-card md:block"
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 md:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
