'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PhoneOff,
  Video,
  Shield,
  Timer,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  profileImg: string | null
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function VideoCallPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [iframeReady, setIframeReady] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Verify auth on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user)
        } else {
          router.replace('/login')
        }
      })
      .catch(() => {
        router.replace('/login')
      })
      .finally(() => setLoading(false))
  }, [router])

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleEndCall = useCallback(() => {
    setShowEndDialog(true)
  }, [])

  const confirmEndCall = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setShowEndDialog(false)
    // Redirect based on role
    if (user?.role === 'doctor' || user?.role === 'receptionist' || user?.role === 'admin') {
      router.replace('/dashboard/doctor/appointments')
    } else {
      router.replace('/dashboard/patient/appointments')
    }
  }, [router, user])

  const jitsiUrl = `https://meet.jit.si/${roomId}?config.startWithAudioMuted=false&config.startWithVideoMuted=true&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false&config.prejoinPageEnabled=false`

  // Loading state
  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Connecting...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 sm:-m-6 overflow-hidden">
      {/* Header Bar */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between px-4 py-2.5 bg-gray-900 text-white shrink-0 z-10"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-teal-600 shrink-0">
            <Video className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">Video Consultation</p>
            <p className="text-[11px] text-gray-400 truncate">
              {user.role === 'doctor' ? 'Doctor' : 'Patient'} · {user.name}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700">
          <Timer className="h-3.5 w-3.5 text-teal-400" />
          <span className="text-sm font-mono font-medium text-teal-400">
            {formatTimer(elapsed)}
          </span>
        </div>

        {/* Room info + End Call */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-400">
            <Shield className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{roomId}</span>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleEndCall}
              className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg shadow-red-600/30"
              size="sm"
            >
              <PhoneOff className="h-4 w-4" />
              <span className="hidden sm:inline">End Call</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Jitsi iframe */}
      <div className="flex-1 relative bg-black">
        {!iframeReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 animate-pulse rounded-full bg-teal-600/20 flex items-center justify-center">
                <Video className="h-6 w-6 text-teal-400" />
              </div>
              <p className="text-sm text-gray-400">Loading video call...</p>
            </div>
          </div>
        )}
        <iframe
          src={jitsiUrl}
          className={cn(
            'w-full h-full border-0 transition-opacity duration-500',
            iframeReady ? 'opacity-100' : 'opacity-0'
          )}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          allowFullScreen
          onLoad={() => setIframeReady(true)}
        />
      </div>

      {/* End Call Confirmation Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this consultation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end the video call for both you and the patient. The consultation
              will remain in your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEndCall}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              End Call
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
