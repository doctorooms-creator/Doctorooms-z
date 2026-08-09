# 5-B — Reception Status Actions Agent

## Task ID: 5-B
## Agent: Status Actions Agent
## Task: Add Extend and Visited status actions on the receptionist appointments page

---

## Work Log
- (to be filled by agent)

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
- [ ] Extend action works from Pending → Extend on appointments page
- [ ] Extend action works from Pending → Extend on pending-bookings page
- [ ] Visited action works from Approve → Visited on appointments page
- [ ] Invalid transitions are blocked
- [ ] Notifications sent on status change
- [ ] Status tabs reflect updated counts
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

## Stage Summary
- (to be filled by agent)