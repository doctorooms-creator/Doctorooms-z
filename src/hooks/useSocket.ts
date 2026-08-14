'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

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

/** Helper to read auth from cookies (client-side) */
function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : ''
}

/** Hook that auto-resolves auth from cookies */
export function useAuthSocket() {
  const [auth, setAuth] = useState({ userId: '', role: '', name: '' })

  useEffect(() => {
    const sessionId = getCookie('doctorooms_session')
    const roleCookie = getCookie('doctorooms_role')
    if (sessionId && roleCookie) {
      // In dev mode, sessionId is the userId; in production it's a session token
      setAuth({
        userId: sessionId,
        role: roleCookie,
        name: roleCookie.charAt(0).toUpperCase() + roleCookie.slice(1),
      })
    }
  }, [])

  return useSocket({
    userId: auth.userId,
    role: auth.role,
    name: auth.name,
    enabled: !!auth.userId,
  })
}
