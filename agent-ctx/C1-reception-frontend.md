# Task C1 — reception-frontend

## Task: Create Receptionist Pending Bookings Page

### Status: ✅ Completed

### Files created
- `src/app/dashboard/receptionist/pending-bookings/page.tsx` — Pending Bookings page

### Files modified
- `src/lib/sidebar-config.ts` — Added Pending Bookings entry (Clock icon after Appointments)
- `src/components/dashboard/dashboard-header.tsx` — Added route title mapping
- `src/app/dashboard/receptionist/page.tsx` — Added "Pending Bookings" quick action button with pending count badge

### Implementation details
- TanStack Query for data fetching with 30s auto-refetch
- useMutation for approve/reject with optimistic updates
- Approve: optimistic green flash → PATCH API → toast with queue # → card removal
- Reject: AlertDialog confirmation → PATCH API → toast → card removal
- Error handling with query rollback on failure
- Framer Motion stagger + AnimatePresence exit animations
- Loading skeletons + empty state with CalendarCheck icon
- Teal accent theme, responsive mobile-first layout
