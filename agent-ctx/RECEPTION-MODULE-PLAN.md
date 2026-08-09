# Reception Module — Development Plan

## Current Status
- **5 pages** built: Dashboard, Appointments, Pending Bookings, Walk-in, Patients
- **7 API routes** working
- Sidebar: Dashboard, Appointments, Pending Bookings, Walk-in, Patients, Change Password

## Design Standards
- **Color**: Teal primary (`teal-500/600`), Amber for warnings, Emerald for success, Violet for pending, Red for errors
- **Components**: shadcn/ui (New York style) + Lucide icons + Framer Motion
- **Data**: TanStack Query for fetching, useMutation for mutations, sonner for toasts
- **Auth**: `requireRole(req, 'receptionist')` or `requireAuth(req)` + `RECEPTION_ROLES`
- **Layout**: Responsive mobile-first, skeleton loading, empty states with icons
- **Typography**: Font hierarchy, proper spacing (gap-4/gap-6)

---

## Phase A — Core Enhancements

### A1. Date Range Filter + Appointment Detail Dialog
**File: `src/app/dashboard/receptionist/appointments/page.tsx`** (modify)
- Add From/To date input fields above status tabs (same pattern as patient appointments)
- Add date params to API queryKey
- Add click-to-view detail dialog showing: patient info, doctor info, booking details, status timeline

**File: `src/app/api/dashboard/receptionist/appointments/route.ts`** (modify)
- Accept `from`/`to` query params with date filtering using Prisma

### A2. Notifications Page
**File: `src/app/dashboard/receptionist/notifications/page.tsx`** (create)
- Notification list with unread/read styling
- Mark individual as read, mark all as read
- Empty state with Bell icon
- Relative timestamps via date-fns

**File: `src/app/api/receptionist/notifications/route.ts`** (create)
- GET: List notifications for logged-in receptionist
- PATCH /read-all: Mark all as read

### A3. Profile Page
**File: `src/app/dashboard/receptionist/profile/page.tsx`** (create)
- Display user info (name, email, mobile, gender, status, joined date)
- Doctor info card (name, specialization, fees)
- Edit profile dialog (name, mobile, gender)
- Avatar upload

**File: `src/app/api/receptionist/profile/route.ts`** (create)
- GET: Fetch receptionist profile with linked doctor info
- PUT: Update profile fields

---

## Phase B — Advanced Features

### B1. Doctor Schedule View
**File: `src/app/dashboard/receptionist/schedule/page.tsx`** (create)
- View doctor's weekly schedule (Mon-Sun) with time slots
- Show today's schedule highlighted
- Holiday list
- Use existing doctor schedule API pattern

**File: `src/app/api/dashboard/receptionist/schedule/route.ts`** (create)
- GET: Fetch linked doctor's schedule + holidays

### B2. End-of-Day Summary Report
**File: `src/app/dashboard/receptionist/reports/page.tsx`** (create)
- Date picker for report date
- Summary cards: Total appointments, Approved, Visited, Finished, Canceled, Revenue
- Appointment list for the selected date
- Export/Print button

**File: `src/app/api/dashboard/receptionist/reports/route.ts`** (create)
- GET: Daily summary stats + appointment list for a given date

### B3. Print Queue List
**File: `src/app/dashboard/receptionist/print-queue/page.tsx`** (create)
- Today's queue in a print-friendly format
- Print button that triggers window.print()
- Print-optimized CSS

---

## Completion Checklist
- [ ] A1: Date range filter on appointments
- [ ] A1: Appointment detail dialog
- [ ] A2: Notifications page + API
- [ ] A3: Profile page + API
- [ ] B1: Doctor schedule view + API
- [ ] B2: End-of-day report + API
- [ ] B3: Print queue list
- [ ] Sidebar updated with new entries
- [ ] Dashboard header route titles updated
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification
