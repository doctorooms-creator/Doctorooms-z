'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/lib/auth-store'

interface UseSocketOptions {
  userId?: string
  role?: string
  name?: string
  hospitalId?: string
  enabled?: boolean
}

export function useSocket(options: UseSocketOptions = {}): Socket | null {
  const { userId, role, name, hospitalId, enabled = true } = options
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!enabled || !userId || !role) return

    const socket = io('/?XTransformPort=3005', {
      auth: { userId, role, name, hospitalId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      setConnected(true)
      console.log('[useSocket] Connected')
    })

    socket.on('disconnect', () => {
      setConnected(false)
      console.log('[useSocket] Disconnected')
    })

    socket.on('connect_error', (err) => {
      console.warn('[useSocket] Connection error:', err.message)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [userId, role, name, hospitalId, enabled])

  return socketRef.current
}

/** Hook that auto-resolves auth from Zustand store (works with httpOnly cookies) */
export function useAuthSocket() {
  const user = useAuthStore((s) => s.user)

  return useSocket({
    userId: user?.id ?? '',
    role: user?.role ?? '',
    name: user?.name ?? '',
    enabled: !!user?.id,
  })
}
