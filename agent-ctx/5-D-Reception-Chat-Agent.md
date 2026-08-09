# 5-D — Reception Chat System Agent

## Task ID: 5-D
## Agent: Chat System Agent
## Task: Build real-time chat UI between receptionist and patient per appointment

---

## Work Log
- (to be filled by agent)

---

## Context

The PHP original had a per-appointment chat system (patient ↔ receptionist) with 5-second jQuery polling. Chat was disabled for Visited/Rejected appointments.

The Prisma schema already has:
```prisma
model BookingChat {
  id         String   @id @default(cuid())
  bookingId  String
  senderId   String
  message    String
  createdAt  DateTime @default(now())
  booking    Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  sender     User     @relation(fields: [senderId], references: [id])
}
```

There may already be a chat API at `/api/bookings/[bookingId]/chat/route.ts` — read it first and reuse if available.

## What to Build

### D1. Chat API (if not exists)

**File:** `src/app/api/bookings/[bookingId]/chat/route.ts`

**GET** — Fetch messages for a booking
- Auth: `requireAuth(req)`
- Verify: user is the patient (booking.userId), receptionist (linked to booking.doctorId), or doctor
- Return messages ordered by createdAt ASC with sender name and role
- Query: `db.bookingChat.findMany({ where: { bookingId }, include: { sender: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } })`

**POST** — Send a message
- Auth: `requireAuth(req)`
- Body: `{ message: string }`
- Validate message is not empty, max 1000 chars
- Verify user has access to this booking
- Create: `db.bookingChat.create({ data: { bookingId, senderId: user.id, message } })`
- Return the created message with sender info

### D2. Chat UI Component

**File:** `src/components/receptionist/appointment-chat.tsx` (new shared component)

**Props:** `{ bookingId: string; bookingStatus: string; otherPartyName: string }`

**Layout (within the appointment detail dialog or as a collapsible section):**
- Fixed-height message area (max-h-80 overflow-y-auto)
- Messages styled as chat bubbles:
  - **My messages (receptionist):** Right-aligned, teal background, white text
  - **Patient messages:** Left-aligned, gray/muted background, dark text
  - Each message shows: text + timestamp (relative via date-fns `formatDistanceToNow`)
  - Sender name label above each message group
- Input area at bottom: text input + send button (SendHorizontal icon)
- Empty state: "No messages yet. Start the conversation!"

**Auto-refresh:** Use TanStack Query with `refetchInterval: 5000` (5 seconds, matching PHP original)
- Only poll when the dialog is open (use `enabled: isOpen`)
- Auto-scroll to bottom on new messages (use `useRef` + `scrollIntoView`)

### D3. Integration into Appointment Detail

**File:** `src/app/dashboard/receptionist/appointments/page.tsx`

**Option A (Preferred):** Add a "Chat" tab or collapsible section within the existing appointment detail Dialog.
- The detail Dialog currently shows: patient info, doctor info, booking details
- Add a tabbed interface: "Details" | "Chat"
- Or add a "💬 Chat" button that opens a Sheet/drawer from the right

**Option B:** Add a chat icon button on each appointment row that opens a separate chat Dialog.

**Option C (Simplest):** Add a chat section at the bottom of the existing detail Dialog, separated by a Divider.

**Recommendation:** Use **Option A** with Tabs. Use shadcn `Tabs` component with two tabs: "Details" and "Chat (3)" showing unread count.

### D4. Chat Disable Logic

**Rule:** Chat is disabled (read-only or hidden) for:
- `status === 'Visited'` — show "Appointment completed. Chat is closed." message
- `status === 'Canceled'` or `status === 'Rejected'` — show "Appointment was canceled. Chat is closed." message
- Walk-in bookings with no linked userId (null) — show "No linked patient for this walk-in booking."

When chat is disabled, still show message history (read-only) but hide the input area.

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/receptionist/appointment-chat.tsx` | Create | Chat UI component |
| `src/app/api/bookings/[bookingId]/chat/route.ts` | Create/Modify | Chat GET + POST API |
| `src/app/dashboard/receptionist/appointments/page.tsx` | Modify | Integrate chat into detail dialog |

## UI Design Notes

- Chat bubbles: rounded-2xl, max-w-[75%], with proper padding (px-3 py-2)
- Use `AnimatePresence` + `motion.div` for new message entrance animation (slide up + fade in)
- Send button disabled when input is empty
- Show typing indicator? (optional — skip for v1)
- Message timestamps: `text-[10px] text-muted-foreground` below each bubble
- Group consecutive messages from same sender (show name only on first message of group)

## Verification
- [ ] Chat messages render correctly (my messages right, patient messages left)
- [ ] Send message works and appears immediately (optimistic or refetch)
- [ ] Auto-refresh polls every 5 seconds when dialog is open
- [ ] Auto-scroll to bottom on new messages
- [ ] Chat disabled for Visited/Canceled/Rejected appointments (read-only history)
- [ ] Chat disabled for walk-ins with no linked patient
- [ ] Empty state shows when no messages
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

## Stage Summary
- (to be filled by agent)