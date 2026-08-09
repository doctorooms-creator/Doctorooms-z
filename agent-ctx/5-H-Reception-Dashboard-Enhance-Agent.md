# 5-H — Reception Dashboard Enhancements Agent

## Task ID: 5-H
## Agent: Dashboard Enhancement Agent
## Task: Polish the reception dashboard with missing cards, auto-refresh, and UX improvements

---

## Work Log
- (to be filled by agent)

---

## Context

The PHP original dashboard had:
- 3 stat boxes: Today Pending, Today Visited, My Blogs
- 2 profile cards: My Hospital + My Doctor
- 2 tables: Latest 5 Booked Appointments + Today's Appointments

The current Next.js dashboard has:
- 3 stat boxes: Today's Appointments, Total Patients, Pending Approvals
- 1 doctor info banner (no hospital card)
- 1 table: Today's Appointments

Additionally, there are UX issues: no auto-refresh on appointments, no auto-refresh on print queue, no search debounce on patients.

## What to Build

### H1. Hospital Info Card on Dashboard

**File:** `src/app/dashboard/receptionist/page.tsx`

Add a "My Hospital" card alongside the existing "My Doctor" card.

**Data source:** The Doctor model likely has a `hospitalName` or related Hospital model. Check the Prisma schema.

**Card content:**
- Hospital name (bold)
- Address (full)
- City, State
- Contact number
- BuildingIcon from Lucide

**Layout:** 2-column grid for Doctor + Hospital cards on desktop, stacked on mobile.

**If no Hospital model exists**, use the Doctor's address fields as a fallback "Clinic Info" card:
- Clinic/Doctor name
- Address, City, State
- Contact

### H2. Replace Total Patients Stat with Today Visited

**File:** `src/app/dashboard/receptionist/page.tsx`

Change the 3 stat cards from:
1. Today's Appointments → Keep
2. **Total Patients** → **Today Visited** (teal, UserCheck icon)
3. Pending Approvals → Keep

**API change:** `src/app/api/dashboard/receptionist/stats/route.ts`
- Add `todayVisited` count: `db.booking.count({ where: { doctorId, status: 'Visited', bookingDate: { gte: todayStart, lte: todayEnd } } })`
- Return in stats response

### H3. Auto-Refresh on Appointments

**File:** `src/app/dashboard/receptionist/appointments/page.tsx`

Add `refetchInterval: 10000` (10 seconds) to the appointments `useQuery`:
```typescript
useQuery(['receptionist-appointments', ...], fetchFn, {
  refetchInterval: 10000,
  // ... existing options
})
```

### H4. Auto-Refresh on Print Queue

**File:** `src/app/dashboard/receptionist/print-queue/page.tsx`

Add `refetchInterval: 15000` (15 seconds) to the print queue `useQuery`.

### H5. Search Debounce on Patients

**File:** `src/app/dashboard/receptionist/patients/page.tsx`

Current: Queries on every keystroke (React state change triggers re-render → query).

Fix: Add a debounce timer (300ms):
```typescript
const [search, setSearch] = useState('')
const [debouncedSearch, setDebouncedSearch] = useState('')

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(search), 300)
  return () => clearTimeout(timer)
}, [search])

// Use debouncedSearch in the queryKey
useQuery(['receptionist-patients', debouncedSearch], ...)
```

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/dashboard/receptionist/page.tsx` | Modify | Add hospital card, change stat to Today Visited |
| `src/app/api/dashboard/receptionist/stats/route.ts` | Modify | Add todayVisited count |
| `src/app/dashboard/receptionist/appointments/page.tsx` | Modify | Add refetchInterval 10s |
| `src/app/dashboard/receptionist/print-queue/page.tsx` | Modify | Add refetchInterval 15s |
| `src/app/dashboard/receptionist/patients/page.tsx` | Modify | Add search debounce |

## UI Design Notes
- Hospital card: Same style as Doctor card, use Building2 icon
- Today Visited stat: teal color scheme, UserCheck icon
- Auto-refresh: No visual indicator needed (TanStack Query handles it silently)
- Consider adding a subtle "Live" dot indicator on auto-refreshed pages (optional)

## Verification
- [ ] Hospital/clinic info card shows on dashboard
- [ ] Today Visited stat shows correct count
- [ ] Appointments auto-refresh every 10s
- [ ] Print queue auto-refresh every 15s
- [ ] Patients search has 300ms debounce
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

## Stage Summary
- (to be filled by agent)