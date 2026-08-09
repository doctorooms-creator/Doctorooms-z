# 5-A — Reception Bug Fixes Agent

## Task ID: 5-A
## Agent: Bug Fix Agent
## Task: Fix 3 critical/medium bugs in the reception module

---

## Work Log
- (to be filled by agent)

---

## Bugs to Fix

### BUG-1: Pending Bookings API Not Scoped to Doctor 🔴

**File:** `src/app/api/dashboard/receptionist/pending-bookings/route.ts`

**Problem:** The GET endpoint fetches ALL `status: 'Pending', bookingType: 'By Self'` bookings across ALL doctors. A receptionist linked to Doctor A can see Doctor B's pending bookings.

**Current Code (approx line 12-14):**
```typescript
const pendingBookings = await db.booking.findMany({
  where: {
    status: 'Pending',
    bookingType: 'By Self',
  },
  // ...
})
```

**Fix:** First get the receptionist's linked doctorId, then filter bookings by that doctorId.
```typescript
// Step 1: Get receptionist's doctorId
const receptionist = await db.receptionist.findUnique({
  where: { userId: user.id },
  select: { doctorId: true },
})
if (!receptionist) return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 })

// Step 2: Filter bookings by doctorId
const pendingBookings = await db.booking.findMany({
  where: {
    status: 'Pending',
    bookingType: 'By Self',
    doctorId: receptionist.doctorId,
  },
  // ...
})
```

**Verify:** After fix, a receptionist should ONLY see pending bookings for their linked doctor.

---

### BUG-2: Walk-in Slot Loading Fragility 🔴

**File:** `src/app/dashboard/receptionist/walk-in/page.tsx`

**Problem:** The available time slots logic (lines 94-169) uses a `useEffect` that makes 3 sequential fetches:
1. Fetch walk-in queue
2. Fetch pending-bookings → extract `doctorId` from first booking
3. Fetch doctor schedule using that `doctorId`

If there are NO pending bookings, step 2 fails to get a `doctorId` and step 3 is skipped, leaving the time slot dropdown empty.

**Fix Strategy:** Use the receptionist's own profile/stats API to get the linked doctorId, then fetch the doctor schedule directly. This removes the dependency on pending-bookings.

**Steps:**
1. Add a new query `useQuery(['receptionist-doctor-id'])` that calls `/api/receptionist/profile` and extracts `doctorId`
2. Use that `doctorId` to fetch the doctor schedule (reuse existing `useQuery` or call the schedule API)
3. Remove the fragile `useEffect` chain and the disabled pending-bookings query

**Alternative simpler fix:** The stats API (`/api/dashboard/receptionist/stats`) already returns doctor info with `id`. Use that query (which is likely already fetching) to get the doctorId, then trigger a schedule fetch.

---

### BUG-3: Header Bell Empty for Receptionist 🟡

**File:** `src/components/dashboard/dashboard-header.tsx`

**Problem:** Around line 115, there's a condition like:
```typescript
if (role !== 'patient') return
```
This prevents the notification bell dropdown from loading data for any role other than patient. Receptionists see an empty bell icon.

**Fix:** Change the condition to include receptionist role:
```typescript
if (role !== 'patient' && role !== 'receptionist') return
```

Also ensure the notification API call uses the correct endpoint. Patient uses `/api/patient/notifications`, receptionist uses `/api/receptionist/notifications`. The header may need to conditionally call the right API based on role.

---

## Verification
- [ ] BUG-1: Pending bookings only show for linked doctor
- [ ] BUG-2: Walk-in time slots load even when no pending bookings exist
- [ ] BUG-3: Header bell shows notifications for receptionist
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

## Stage Summary
- (to be filled by agent)