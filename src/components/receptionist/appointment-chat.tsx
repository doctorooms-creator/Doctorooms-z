'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { SendHorizontal, MessageCircleOff, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  bookingId: string
  fromId: string
  toId: string
  message: string
  status: string
  createdAt: string
  sender: {
    id: string
    name: string
    profileImg: string
  }
}

interface AppointmentChatProps {
  bookingId: string
  bookingStatus: string
  otherPartyName: string
  hasLinkedPatient: boolean
  isOpen: boolean
}

const DISABLED_STATUSES = ['Visited', 'Canceled', 'Rejected']

export default function AppointmentChat({
  bookingId,
  bookingStatus,
  otherPartyName,
  hasLinkedPatient,
  isOpen,
}: AppointmentChatProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)

  const isChatDisabled = DISABLED_STATUSES.includes(bookingStatus)
  const isWalkIn = !hasLinkedPatient

  const { data: chatData, isLoading } = useQuery<{ messages: ChatMessage[] }>({
    queryKey: ['booking-chat', bookingId],
    queryFn: () =>
      fetch(`/api/bookings/${bookingId}/chat`).then((r) => r.json()),
    refetchInterval: isOpen && !isChatDisabled ? 5000 : false,
    enabled: isOpen,
  })

  const messages = chatData?.messages ?? []

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) =>
      fetch(`/api/bookings/${bookingId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      }).then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(d))
        return r.json()
      }),
    onSuccess: () => {
      setInput('')
      queryClient.invalidateQueries({ queryKey: ['booking-chat', bookingId] })
    },
    onError: (err: { error?: string }) => {
      toast.error(err.error || 'Failed to send message')
    },
  })

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || sendMessageMutation.isPending) return
    sendMessageMutation.mutate(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Walk-in with no linked patient
  if (isWalkIn) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <MessageCircleOff className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">
          No linked patient for this walk-in booking.
        </p>
      </div>
    )
  }

  // Chat is disabled (closed status)
  const disabledMessage =
    bookingStatus === 'Visited'
      ? 'Appointment completed. Chat is closed.'
      : 'Appointment was canceled. Chat is closed.'

  // Group consecutive messages from the same sender
  const groupedMessages: { senderId: string; senderName: string; senderImg: string; isMine: boolean; msgs: ChatMessage[] }[] = []
  for (const msg of messages) {
    const isMine = msg.fromId === currentUser?.id
    const lastGroup = groupedMessages[groupedMessages.length - 1]
    if (lastGroup && lastGroup.senderId === msg.fromId) {
      lastGroup.msgs.push(msg)
    } else {
      groupedMessages.push({
        senderId: msg.fromId,
        senderName: msg.sender.name,
        senderImg: msg.sender.profileImg,
        isMine,
        msgs: [msg],
      })
    }
  }

  return (
    <div className="flex flex-col h-80 border rounded-lg overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
            {!isChatDisabled && (
              <p className="text-xs text-muted-foreground mt-1">
                with {otherPartyName}
              </p>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-3">
            <AnimatePresence initial={false}>
              {groupedMessages.map((group) => (
                <motion.div
                  key={group.senderId + '-' + group.msgs[0].id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'flex flex-col',
                    group.isMine ? 'items-end' : 'items-start'
                  )}
                >
                  {/* Sender name */}
                  <p
                    className={cn(
                      'text-[10px] font-medium text-muted-foreground mb-1 px-1',
                      group.isMine ? 'text-right' : 'text-left'
                    )}
                  >
                    {group.senderName}
                  </p>
                  {/* Bubbles */}
                  <div className="flex flex-col gap-1 max-w-[75%]">
                    {group.msgs.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          'rounded-2xl px-3 py-2 text-sm',
                          group.isMine
                            ? 'bg-teal-600 text-white rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        )}
                      >
                        {msg.message}
                      </div>
                    ))}
                  </div>
                  {/* Timestamp of last message in group */}
                  <p
                    className={cn(
                      'text-[10px] text-muted-foreground mt-0.5 px-1',
                      group.isMine ? 'text-right' : 'text-left'
                    )}
                  >
                    {formatDistanceToNow(new Date(group.msgs[group.msgs.length - 1].createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Disabled notice */}
      {isChatDisabled && messages.length > 0 && (
        <div className="border-t bg-muted/50 px-4 py-2.5 text-center">
          <p className="text-xs text-muted-foreground">{disabledMessage}</p>
        </div>
      )}

      {/* Input area (only when chat is enabled) */}
      {!isChatDisabled && (
        <div className="border-t p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${otherPartyName}...`}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-colors"
              disabled={sendMessageMutation.isPending}
              maxLength={2000}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || sendMessageMutation.isPending}
              className="shrink-0 h-9 w-9 bg-teal-600 text-white hover:bg-teal-700"
            >
              {sendMessageMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
