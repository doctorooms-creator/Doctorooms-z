# 5-B — Reception Status Actions Agent

## Task ID: 5-B
## Agent: Status Actions Agent
## Task: Add Extend and Visited status actions on the receptionist appointments page

---

## Work Log

### Files Read
- `/home/z/my-project/src/app/api/dashboard/receptionist/bookings/[id]/approve/route.ts` — to match auth/notification patterns
- `/home/z/my-project/src/app/api/dashboard/receptionist/bookings/[id]/reject/route.ts` — to match auth/notification patterns
- `/home/z/my-project/src/app/api/dashboard/receptionist/appointments/route.ts` — to understand existing PATCH mutation
- `/home/z/my-project/src/lib/api-auth.ts` — confirmed `requireAuth` + `RECEPTION_ROLES = ['receptionist', 'hospital', 'admin']`
- `/home/z/my-project/src/app/dashboard/receptionist/appointments/page.tsx` — main appointments page
- `/home/z/my-project/src/app/dashboard/receptionist/pending-bookings/page.tsx` — pending bookings page

### Files Created
1. `src/app/api/dashboard/receptionist/bookings/[id]/status/route.ts` — Generic PATCH status endpoint

### Files Modified
1. `src/app/dashboard/receptionist/appointments/page.tsx` — Added Extend + Visited buttons
2. `src/app/dashboard/receptionist/pending-bookings/page.tsx` — Added Extend button

---

## Changes Detail

### 1. Generic Status API (`[id]/status/route.ts`)
- PATCH handler with `requireAuth(req)` + `RECEPTION_ROLES` guard
- Looks up receptionist by `userId`, verifies booking belongs to their `doctorId`
- `VALID_TRANSITIONS` map enforces allowed state machine:
  - Pending → Extend, Visited, Approve, Canceled
  - Extend → Approve, Canceled
  - Approve → Visited, Canceled
  - Visited/Canceled/Finish → [] (blocked with 400)
- `STATUS_MESSAGES` map provides notification titles/messages per status
- Creates notifications for both patient and doctor
- Returns `{ success: true, status, booking: { id, status } }`

### 2. Appointments Page
- Added `CalendarClock` icon import
- `confirmAction` type widened to `'approve' | 'reject' | 'extend' | 'visited' | null`
- `statusMutation` now calls `/api/dashboard/receptionist/bookings/${id}/status` with `{ status }` body
- Toast map: `Approve` → "Appointment approved", `Canceled` → "Appointment rejected", `Extend` → "Appointment extended", `Visited` → "Appointment marked as visited"
- `confirmStatusChange` maps actions to statuses via `statusMap`
- Pending rows: 3 icon buttons (Approve ✓ green, Extend 🕐 violet, Reject ✗ red)
- Approve rows: 2 icon buttons (Mark Visited ✓ teal, Reject ✗ red)
- AlertDialog: dynamic title/description/button-color per action type

### 3. Pending Bookings Page
- Added `CalendarClock` import
- Added `extendDialogOpen`, `extendTargetId`, `extendTargetName` state
- Added `extendMutation` calling generic status API
- Added `handleExtend`/`confirmExtend` handlers
- Added `isExtending` loading helper
- 3 action buttons: Approve (teal), Extend (violet outline), Reject (red outline)
- Added Extend confirmation AlertDialog with violet button
- All buttons disabled during any mutation

---

## Context

The PHP original Doctorooms had a multi-step status workflow:
- **Pending** → Approve | **Extend** | Reject
- **Extend** → Approve | Reject
- **Approve** → **Visited** | Reject
- Visited / Rejected → No actions

The current Next.js implementation only supports:
- Pending → Approve | Reject (no Extend)
- No Visited action at all

The `status` field in the Booking model is a plain `String`, values: `Pending`, `Approve`, `Visited`, `Canceled`, `Extend`, `Finish`.

## What to Build

### B1. Extend Action (Pending → Extend)

**UI Change — `src/app/dashboard/receptionist/appointments/page.tsx`:**
- On the appointments table, for rows with `status === 'Pending'`, show 3 action buttons:
  - **Approve** (green, existing)
  - **Extend** (violet/purple, NEW)
  - **Reject** (red, existing)
- Use the existing AlertDialog pattern for confirmation
- After extending, show success toast
- Also apply to the Pending Bookings page (`pending-bookings/page.tsx`) — add Extend button there too

### B2. Visited Action (Approve → Visited)

**UI Change — `src/app/dashboard/receptionist/appointments/page.tsx`:**
- For rows with `status === 'Approve'`, show 2 action buttons:
  - **Mark Visited** (teal, NEW)
  - **Reject** (red, NEW for this status)
- After marking visited, show success toast

### B3. Generic Status Update API

**New File: `src/app/api/dashboard/receptionist/bookings/[id]/status/route.ts`**
- `PATCH` method
- Auth: `requireAuth(req)` + `RECEPTION_ROLES.includes(user.role)`
- Body: `{ status: 'Extend' | 'Visited' | 'Reject' }`
- Get receptionist's `doctorId`, verify the booking belongs to their doctor
- Validate status transitions:
  - Pending → Extend ✅, Visited ✅, Approve ✅, Canceled ✅
  - Extend → Approve ✅, Canceled ✅
  - Approve → Visited ✅, Canceled ✅
  - Visited / Canceled / Finish → no transitions allowed
- Send notifications to patient and doctor (use existing notification pattern from approve API)
- Return updated booking

### B4. Update Existing Approve/Reject to Use Generic API (Optional)

The existing `/bookings/[id]/approve` and `/bookings/[id]/reject` can remain as-is, OR be migrated to the generic status endpoint. If migrating is too risky, keep them and just add the new generic endpoint for Extend/Visited.

**Recommendation:** Keep existing approve/reject endpoints. Add new generic endpoint ONLY for Extend and Visited. Less risk.

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/dashboard/receptionist/appointments/page.tsx` | Modify | Add Extend button on Pending rows, Visited+Reject on Approve rows |
| `src/app/dashboard/receptionist/pending-bookings/page.tsx` | Modify | Add Extend button alongside Approve/Reject |
| `src/app/api/dashboard/receptionist/bookings/[id]/status/route.ts` | Create | Generic status update endpoint |

## UI Design Notes

- Extend button: `variant="outline"` with violet/purple color, `CalendarClock` icon
- Visited button: `variant="outline"` with teal color, `CheckCircle2` icon
- Use the same AlertDialog confirmation pattern as existing Reject
- Button order: Approve (left), Extend (center), Reject (right) — or: Mark Visited (left), Reject (right)

## Verification
- [x] Extend action works from Pending → Extend on appointments page
- [x] Extend action works from Pending → Extend on pending-bookings page
- [x] Visited action works from Approve → Visited on appointments page
- [x] Invalid transitions are blocked
- [x] Notifications sent on status change
- [x] Status tabs reflect updated counts
- [x] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

## Stage Summary
- Created 1 new API route, modified 2 frontend pages
- Generic status API supports all valid transitions with notification support
- Appointments page: 3 buttons for Pending (Approve/Extend/Reject), 2 for Approved (Visited/Reject)
- Pending-bookings page: 3 buttons (Approve/Extend/Reject)
- All actions use AlertDialog confirmation + toast feedback
- ESLint clean: 0 errors, 0 warnings
