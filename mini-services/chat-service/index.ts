import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({
  datasources: { db: { url: 'file:/home/z/my-project/db/custom.db' } },
})

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: { origin: '*' },
  path: '/',
})

// Track connected users
const connectedUsers = new Map<string, { userId: string; role: string; name: string }>()

io.use((socket, next) => {
  const { userId, role, name } = socket.handshake.auth as {
    userId?: string
    role?: string
    name?: string
  }
  if (!userId || !role) {
    return next(new Error('Authentication required'))
  }
  socket.data = { userId, role, name: name || 'User' }
  next()
})

io.on('connection', (socket) => {
  const { userId, role, name } = socket.data
  console.log(`[Chat] Connected: ${name} (${role}) - ${socket.id}`)
  connectedUsers.set(socket.id, { userId, role, name })

  // Join a booking-specific chat room
  socket.on('join-room', async (data: { bookingId: string }) => {
    const { bookingId } = data
    const roomName = `chat:${bookingId}`

    // Verify user belongs to this booking
    try {
      const booking = await db.booking.findFirst({
        where: {
          id: bookingId,
          OR: [{ doctorId: userId }, { patientId: userId }],
        },
      })
      if (!booking) {
        socket.emit('error', { message: 'Not authorized for this chat' })
        return
      }

      await socket.join(roomName)
      const sockets = await io.in(roomName).fetchSockets()
      io.to(roomName).emit('room-joined', {
        onlineCount: sockets.length,
        userId,
        name,
      })
      console.log(`[Chat] ${name} joined room ${roomName} (${sockets.length} online)`)
    } catch (err) {
      console.error('[Chat] Error joining room:', err)
    }
  })

  // Leave room
  socket.on('leave-room', async (data: { bookingId: string }) => {
    const roomName = `chat:${data.bookingId}`
    await socket.leave(roomName)
    const sockets = await io.in(roomName).fetchSockets()
    io.to(roomName).emit('user-left', {
      onlineCount: sockets.length,
      userId,
      name,
    })
    console.log(`[Chat] ${name} left room ${roomName} (${sockets.length} online)`)
  })

  // Send message
  socket.on('send-message', async (data: { bookingId: string; message: string }) => {
    const { bookingId, message } = data
    const roomName = `chat:${bookingId}`

    if (!message?.trim()) return

    try {
      // Verify booking access
      const booking = await db.booking.findFirst({
        where: {
          id: bookingId,
          OR: [{ doctorId: userId }, { patientId: userId }],
        },
      })
      if (!booking) return

      // Persist to DB
      const chatMsg = await db.bookingChat.create({
        data: {
          bookingId,
          fromId: userId,
          message: message.trim(),
        },
        include: {
          from: { select: { name: true, role: true, profileImg: true } },
        },
      })

      // Broadcast to room
      io.to(roomName).emit('new-message', {
        id: chatMsg.id,
        bookingId,
        fromId: userId,
      })

      console.log(`[Chat] Message in ${roomName} from ${name}`)
    } catch (err) {
      console.error('[Chat] Error sending message:', err)
    }
  })

  // Typing indicators
  socket.on('typing', (data: { bookingId: string }) => {
    const roomName = `chat:${data.bookingId}`
    socket.to(roomName).emit('user-typing', { name })
  })

  socket.on('stop-typing', (data: { bookingId: string }) => {
    const roomName = `chat:${data.bookingId}`
    socket.to(roomName).emit('user-stop-typing', { name })
  })

  // Mark messages as read
  socket.on('mark-read', async (data: { bookingId: string }) => {
    const roomName = `chat:${data.bookingId}`
    try {
      await db.bookingChat.updateMany({
        where: {
          bookingId: data.bookingId,
          fromId: { not: userId },
          status: 'SENT',
        },
        data: { status: 'READ' },
      })
      socket.to(roomName).emit('messages-read', { userId, name })
    } catch (err) {
      console.error('[Chat] Error marking read:', err)
    }
  })

  // Disconnect
  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id)
    console.log(`[Chat] Disconnected: ${name} - ${socket.id}`)
  })
})

const PORT = 3004
httpServer.listen(PORT, () => {
  console.log(`[Chat Service] Socket.io running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Chat Service] SIGTERM received, shutting down...')
  io.close()
  await db.$disconnect()
  httpServer.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('[Chat Service] SIGINT received, shutting down...')
  io.close()
  await db.$disconnect()
  httpServer.close()
  process.exit(0)
})
