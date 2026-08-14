import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: { origin: '*' },
  path: '/',
})

const VALID_EVENTS = [
  'new-admission',
  'vital-recorded',
  'sample-ordered',
  'lab-result-ready',
  'bill-generated',
  'payment-received',
  'discharge-advised',
  'ot-scheduled',
  'low-stock-alert',
] as const

type ValidEvent = (typeof VALID_EVENTS)[number]

// Track connected clients
const connectedClients = new Map<string, { userId: string; role: string; name: string; hospitalId?: string }>()

io.use((socket, next) => {
  const { userId, role, name, hospitalId } = socket.handshake.auth as {
    userId?: string
    role?: string
    name?: string
    hospitalId?: string
  }
  if (!userId || !role) {
    return next(new Error('Authentication required'))
  }
  socket.data = { userId, role, name: name || 'User', hospitalId }
  next()
})

io.on('connection', (socket) => {
  const { userId, role, name, hospitalId } = socket.data
  console.log(`[Notification] Connected: ${name} (${role}) - ${socket.id}`)
  connectedClients.set(socket.id, { userId, role, name, hospitalId })

  // Join rooms: user-specific, role-specific, hospital-specific
  socket.join(`user:${userId}`)
  socket.join(`role:${role}`)
  if (hospitalId) {
    socket.join(`hospital:${hospitalId}`)
  }

  // Leave rooms on disconnect
  socket.on('disconnect', () => {
    connectedClients.delete(socket.id)
    console.log(`[Notification] Disconnected: ${name} - ${socket.id}`)
  })
})

// ── HTTP endpoint for API routes to emit events ──────────────────────

httpServer.on('request', async (req, res) => {
  // Only accept POST /emit
  if (req.method !== 'POST' || req.url !== '/emit') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found. Use POST /emit' }))
    return
  }

  let body = ''
  for await (const chunk of req) {
    body += chunk
  }

  try {
    const data = JSON.parse(body)
    const { event, rooms, payload } = data as {
      event: string
      rooms?: string[]
      payload: Record<string, unknown>
    }

    if (!event || !VALID_EVENTS.includes(event as ValidEvent)) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: `Invalid event. Valid: ${VALID_EVENTS.join(', ')}` }))
      return
    }

    if (!payload) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'payload is required' }))
      return
    }

    // Emit to specific rooms or broadcast
    if (rooms && rooms.length > 0) {
 for (const room of rooms) {
        io.to(room).emit(event, payload)
        console.log(`[Notification] Emitted '${event}' to room '${room}'`)
      }
    } else {
      io.emit(event, payload)
      console.log(`[Notification] Broadcast '${event}' to all clients`)
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: true, event, rooms: rooms || ['broadcast'] }))
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid JSON body' }))
  }
})

const PORT = 3005
httpServer.listen(PORT, () => {
  console.log(`[Notification Service] Socket.io + HTTP on port ${PORT}`)
  console.log(`[Notification Service] HTTP emit endpoint: POST http://localhost:${PORT}/emit`)
  console.log(`[Notification Service] Valid events: ${VALID_EVENTS.join(', ')}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Notification Service] SIGTERM, shutting down...')
  io.close()
  httpServer.close()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('[Notification Service] SIGINT, shutting down...')
  io.close()
  httpServer.close()
  process.exit(0)
})
