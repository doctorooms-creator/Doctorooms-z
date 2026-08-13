'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  Clock,
  Users,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
} from 'lucide-react'

// ============ Types ============
interface QueueItem {
  tokenNumber: string | null
  tokenOrder: number
  status: string
  timeSlot: string
}

interface DoctorQueue {
  doctorId: string
  doctorName: string
  specialization: string
  queue: QueueItem[]
  stats: {
    total: number
    waiting: number
    inConsultation: number
    completed: number
  }
  currentServing: { tokenNumber: string } | null
}

interface Department {
  id: string
  name: string
  shortCode: string
  icon: string
  floorNo: string
  opdRoom: string
  doctors: DoctorQueue[]
}

interface QueueData {
  hospital: { id: string; hospitalName: string }
  departments: Department[]
  date: string
}

// ============ Helper: Format date ============
function formatDisplayDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// ============ Live Clock Component ============
function LiveClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    function updateClock() {
      setTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      )
    }
    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  return <span className="font-mono text-3xl md:text-4xl lg:text-5xl font-bold text-teal-400 tracking-wider">{time}</span>
}

// ============ Status Color Helper ============
function getStatusColor(status: string): string {
  switch (status) {
    case 'Approve':
      return 'text-amber-400'
    case 'Visited':
      return 'text-teal-400'
    case 'Finish':
      return 'text-emerald-400'
    default:
      return 'text-slate-400'
  }
}

function getStatusBg(status: string): string {
  switch (status) {
    case 'Approve':
      return 'bg-amber-400/10 border-amber-400/30'
    case 'Visited':
      return 'bg-teal-400/10 border-teal-400/30'
    case 'Finish':
      return 'bg-emerald-400/10 border-emerald-400/30'
    default:
      return 'bg-slate-400/10 border-slate-400/30'
  }
}

// ============ Marquee Component ============
function Marquee({ items }: { items: string }) {
  const marqueeRef = useRef<HTMLDivElement>(null)

  return (
    <div className="relative w-full overflow-hidden bg-slate-800/80 border-t border-slate-700/50">
      <div
        ref={marqueeRef}
        className="flex whitespace-nowrap py-3 animate-marquee"
      >
        <span className="mx-8 text-slate-300 text-base md:text-lg font-medium">{items}</span>
        <span className="mx-8 text-slate-300 text-base md:text-lg font-medium">{items}</span>
      </div>
    </div>
  )
}

// ============ Doctor Card ============
function DoctorCard({ doctor }: { doctor: DoctorQueue }) {
  const nextUp = useMemo(
    () =>
      doctor.queue
        .filter((q) => q.status === 'Approve')
        .slice(0, 5)
        .map((q) => q.tokenNumber),
    [doctor.queue]
  )

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5 md:p-6">
      {/* Doctor Info */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
          <Stethoscope className="w-5 h-5 md:w-6 md:h-6 text-teal-400" />
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-white">
            {doctor.doctorName}
          </h3>
          <p className="text-sm md:text-base text-slate-400">
            {doctor.specialization}
          </p>
        </div>
      </div>

      {/* NOW SERVING Banner */}
      <div className="mb-5">
        {doctor.currentServing ? (
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-teal-500/20 animate-pulse-glow" />
            <div className="relative bg-teal-500/10 border-2 border-teal-400/50 rounded-xl px-6 py-4 md:py-5 text-center">
              <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-teal-300 mb-1">
                Now Serving
              </p>
              <p className="text-4xl md:text-5xl lg:text-6xl font-black text-teal-400 tracking-wider">
                {doctor.currentServing.tokenNumber}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-700/30 border border-slate-600/30 rounded-xl px-6 py-4 md:py-5 text-center">
            <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">
              Now Serving
            </p>
            <p className="text-2xl md:text-3xl font-bold text-slate-600">---</p>
          </div>
        )}
      </div>

      {/* NEXT UP Section */}
      {nextUp.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 mb-3">
            Next Up
          </p>
          <div className="flex flex-wrap gap-2">
            {nextUp.map((token, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border font-mono text-lg md:text-xl font-bold ${getStatusBg('Approve')} ${getStatusColor('Approve')}`}
              >
                {token}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="flex items-center gap-4 md:gap-6 pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 font-bold text-lg md:text-xl">{doctor.stats.waiting}</span>
          <span className="text-xs md:text-sm text-slate-500 uppercase">Waiting</span>
        </div>
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-teal-400" />
          <span className="text-teal-400 font-bold text-lg md:text-xl">{doctor.stats.inConsultation}</span>
          <span className="text-xs md:text-sm text-slate-500 uppercase">Consulting</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-bold text-lg md:text-xl">{doctor.stats.completed}</span>
          <span className="text-xs md:text-sm text-slate-500 uppercase">Done</span>
        </div>
      </div>
    </div>
  )
}

// ============ Department View ============
function DepartmentView({
  department,
  isPinned,
  onPin,
}: {
  department: Department
  isPinned: boolean
  onPin: () => void
}) {
  return (
    <motion.div
      key={department.id}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex-1 flex flex-col"
      onClick={onPin}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onPin()
      }}
      aria-label={`Pin ${department.name}`}
    >
      {/* Department Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center text-2xl md:text-3xl">
            {department.icon || '🏥'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white">
                {department.name}
              </h2>
              <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-base md:text-lg px-3 py-1">
                {department.shortCode}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-slate-400">
              {department.floorNo && (
                <span className="flex items-center gap-1.5 text-sm md:text-base">
                  <MapPin className="w-4 h-4" />
                  Floor {department.floorNo}
                </span>
              )}
              {department.opdRoom && (
                <span className="flex items-center gap-1.5 text-sm md:text-base">
                  Room {department.opdRoom}
                </span>
              )}
            </div>
          </div>
        </div>
        {isPinned && (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs self-start sm:ml-auto">
            📌 PINNED — Click to unpin
          </Badge>
        )}
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
        {department.doctors.map((doc) => (
          <DoctorCard key={doc.doctorId} doctor={doc} />
        ))}
      </div>

      {department.doctors.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-xl">
          No doctors available in this department
        </div>
      )}
    </motion.div>
  )
}

// ============ Loading Skeleton ============
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header skeleton */}
      <header className="bg-slate-800/80 border-b border-slate-700/50 px-6 md:px-10 py-4 md:py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <Skeleton className="h-10 md:h-12 w-72 bg-slate-700" />
          <div className="flex items-center gap-6">
            <Skeleton className="h-8 w-56 bg-slate-700" />
            <Skeleton className="h-10 w-40 bg-slate-700" />
          </div>
        </div>
      </header>

      {/* Department nav skeleton */}
      <div className="px-6 md:px-10 py-4">
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 bg-slate-700 rounded-full" />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <main className="flex-1 px-6 md:px-10 pb-6">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-16 w-16 bg-slate-700 rounded-2xl" />
            <div>
              <Skeleton className="h-8 w-56 bg-slate-700 mb-2" />
              <Skeleton className="h-5 w-40 bg-slate-700" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-800/60 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <Skeleton className="h-12 w-12 bg-slate-700 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-36 bg-slate-700 mb-1" />
                  <Skeleton className="h-4 w-28 bg-slate-700" />
                </div>
              </div>
              <Skeleton className="h-24 w-full bg-slate-700 rounded-xl mb-5" />
              <div className="flex gap-2 mb-5">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-9 w-20 bg-slate-700 rounded-lg" />
                ))}
              </div>
              <div className="flex gap-6 pt-4 border-t border-slate-700/50">
                <Skeleton className="h-6 w-20 bg-slate-700" />
                <Skeleton className="h-6 w-24 bg-slate-700" />
                <Skeleton className="h-6 w-16 bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

// ============ Error State ============
function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Unable to Load Queue</h1>
        <p className="text-slate-400 text-lg">{message}</p>
      </div>
    </div>
  )
}

// ============ Main Page Component ============
export default function QueueDisplayPage() {
  const params = useParams<{ hospitalId: string }>()
  const hospitalId = params.hospitalId

  const [data, setData] = useState<QueueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDeptIndex, setCurrentDeptIndex] = useState(0)
  const [pinnedDeptId, setPinnedDeptId] = useState<string | null>(null)
  const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/hospital/${hospitalId}/queue`)
      if (!res.ok) {
        if (res.status === 404) {
          setError('Hospital not found. Please check the URL.')
        } else {
          setError('Failed to load queue data. Please try again.')
        }
        return
      }
      const json = await res.json()
      setData(json)
      setError(null)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [hospitalId])

  // Initial fetch + 15s auto-refresh
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Auto-cycle departments every 8s (unless pinned)
  useEffect(() => {
    if (cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current)
      cycleTimerRef.current = null
    }

    if (pinnedDeptId || !data || data.departments.length <= 1) return

    cycleTimerRef.current = setInterval(() => {
      setCurrentDeptIndex((prev) => (prev + 1) % data.departments.length)
    }, 8000)

    return () => {
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current)
    }
  }, [data, pinnedDeptId])

  // Reset dept index when data changes
  useEffect(() => {
    if (data && data.departments.length > 0 && !pinnedDeptId) {
      setCurrentDeptIndex((prev) => Math.min(prev, data.departments.length - 1))
    }
  }, [data, pinnedDeptId])

  // Pin/unpin handler
  const handlePin = useCallback(
    (deptId: string) => {
      setPinnedDeptId((prev) => (prev === deptId ? null : deptId))
    },
    []
  )

  // Build marquee text
  const marqueeText = useMemo(() => {
    if (!data) return ''
    const parts: string[] = []
    for (const dept of data.departments) {
      for (const doc of dept.doctors) {
        if (doc.currentServing) {
          parts.push(`${doc.doctorName} → ${doc.currentServing.tokenNumber}`)
        }
      }
    }
    if (parts.length === 0) return 'No tokens being served currently'
    return parts.join('      ·      ')
  }, [data])

  // Current department to display
  const activeDepartment = useMemo(() => {
    if (!data || data.departments.length === 0) return null
    if (pinnedDeptId) {
      return data.departments.find((d) => d.id === pinnedDeptId) || data.departments[0]
    }
    return data.departments[currentDeptIndex] || data.departments[0]
  }, [data, currentDeptIndex, pinnedDeptId])

  // Total stats across all departments
  const totalStats = useMemo(() => {
    if (!data) return { waiting: 0, inConsultation: 0, completed: 0 }
    return data.departments.reduce(
      (acc, dept) => {
        for (const doc of dept.doctors) {
          acc.waiting += doc.stats.waiting
          acc.inConsultation += doc.stats.inConsultation
          acc.completed += doc.stats.completed
        }
        return acc
      },
      { waiting: 0, inConsultation: 0, completed: 0 }
    )
  }, [data])

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorState message={error} />
  if (!data || data.departments.length === 0) {
    return <ErrorState message="No departments or queue data available for today." />
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/30 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.08),transparent_50%)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 bg-slate-800/60 backdrop-blur-md border-b border-slate-700/50 px-6 md:px-10 py-4 md:py-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-2xl md:text-3xl font-black shadow-lg shadow-teal-500/20">
              {data.hospital.hospitalName.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight">
                {data.hospital.hospitalName}
              </h1>
              <p className="text-sm md:text-base text-slate-400 mt-0.5">
                {formatDisplayDate(data.date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {/* Global stats */}
            <div className="hidden md:flex items-center gap-5">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 font-bold text-lg">{totalStats.waiting}</span>
                <span className="text-xs text-slate-500 uppercase">Waiting</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-400" />
                <span className="text-teal-400 font-bold text-lg">{totalStats.inConsultation}</span>
                <span className="text-xs text-slate-500 uppercase">Consulting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-bold text-lg">{totalStats.completed}</span>
                <span className="text-xs text-slate-500 uppercase">Done</span>
              </div>
            </div>
            {/* Live Clock */}
            <LiveClock />
          </div>
        </div>
      </header>

      {/* Department Navigation Tabs */}
      <nav className="relative z-10 px-6 md:px-10 py-3 bg-slate-800/30 border-b border-slate-700/30">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {data.departments.map((dept, idx) => {
            const isActive =
              pinnedDeptId === dept.id || (!pinnedDeptId && idx === currentDeptIndex)
            return (
              <button
                key={dept.id}
                onClick={() => {
                  setPinnedDeptId((prev) => (prev === dept.id ? null : dept.id))
                  if (!pinnedDeptId || pinnedDeptId !== dept.id) {
                    setCurrentDeptIndex(idx)
                  }
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm md:text-base font-semibold transition-all duration-300 border cursor-pointer ${
                  isActive
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-lg shadow-teal-500/10'
                    : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-300'
                }`}
              >
                <span className="mr-1.5">{dept.icon}</span>
                {dept.shortCode}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Main Content — Department Display */}
      <main className="relative z-10 flex-1 px-6 md:px-10 py-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeDepartment && (
            <DepartmentView
              key={activeDepartment.id}
              department={activeDepartment}
              isPinned={pinnedDeptId === activeDepartment.id}
              onPin={() => handlePin(activeDepartment.id)}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Marquee */}
      <div className="relative z-10">
        <Marquee items={marqueeText} />
      </div>

      {/* Global styles for marquee animation and glow */}
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.02);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}