# Reception Module — Comprehensive Development Plan (Updated)

> **Last Updated:** Research phase complete — all existing code audited, PHP reference analyzed, gaps identified.

---

## 1. Current Status

### Already Built ✅ (Phase 0 — Previous Sprint)

| # | Page | File | Lines | Status |
|---|------|------|-------|--------|
| 1 | Dashboard | `src/app/dashboard/receptionist/page.tsx` | 279 | ✅ Built |
| 2 | Appointments | `src/app/dashboard/receptionist/appointments/page.tsx` | 612 | ✅ Built (gaps found) |
| 3 | Pending Bookings | `src/app/dashboard/receptionist/pending-bookings/page.tsx` | 414 | ✅ Built (bug found) |
| 4 | Walk-in Registration | `src/app/dashboard/receptionist/walk-in/page.tsx` | 610 | ✅ Built (fragile slot loading) |
| 5 | Print Queue | `src/app/dashboard/receptionist/print-queue/page.tsx` | 192 | ✅ Built |
| 6 | Schedule (view) | `src/app/dashboard/receptionist/schedule/page.tsx` | 205 | ✅ Built (read-only) |
| 7 | Patients | `src/app/dashboard/receptionist/patients/page.tsx` | 184 | ✅ Built (no pagination) |
| 8 | Reports | `src/app/dashboard/receptionist/reports/page.tsx` | ~200 | ✅ Built |
| 9 | Profile | `src/app/dashboard/receptionist/profile/page.tsx` | 357 | ✅ Built |
| 10 | Notifications | `src/app/dashboard/receptionist/notifications/page.tsx` | 164 | ✅ Built |

### API Routes Built ✅

| # | Endpoint | Methods | Auth | Description |
|---|----------|---------|------|-------------|
| 1 | `/api/dashboard/receptionist/stats` | GET | `requireRole('receptionist')` | Dashboard stats + today's list |
| 2 | `/api/dashboard/receptionist/patients` | GET | `requireRole('receptionist')` | Patient list with search |
| 3 | `/api/dashboard/receptionist/appointments` | GET, POST, PATCH | `requireRole('receptionist')` | CRUD + status filter + date range |
| 4 | `/api/dashboard/receptionist/schedule` | GET | `requireRole('receptionist')` | Doctor schedule + holidays |
| 5 | `/api/dashboard/receptionist/walk-in` | GET, POST | `requireAuth + RECEPTION_ROLES` | Queue + create walk-in |
| 6 | `/api/dashboard/receptionist/pending-bookings` | GET | `requireAuth + RECEPTION_ROLES` | Pending bookings list |
| 7 | `/api/dashboard/receptionist/reports` | GET | `requireRole('receptionist')` | Daily report stats + list |
| 8 | `/api/dashboard/receptionist/bookings/[id]/approve` | PATCH | `requireAuth + RECEPTION_ROLES` | Approve with OPD check |
| 9 | `/api/dashboard/receptionist/bookings/[id]/reject` | PATCH | `requireAuth + RECEPTION_ROLES` | Reject with notification |
| 10 | `/api/receptionist/profile` | GET, PUT | `requireRole('receptionist')` | Profile CRUD |
| 11 | `/api/receptionist/avatar` | POST | `requireRole('receptionist')` | Avatar upload |
| 12 | `/api/receptionist/notifications` | GET, PATCH | `requireRole('receptionist')` | Notifications list + mark read |

### Sidebar Entries (11 items)
Dashboard, Appointments, Pending Bookings, Walk-in, Print Queue, Schedule, Patients, Reports, Profile, Notifications, Change Password

---

## 2. Design Standards

- **Color**: Teal primary (`teal-500/600`), Amber for warnings, Emerald for success, Violet for pending, Red for errors/canceled
- **Components**: shadcn/ui (New York style) + Lucide icons + Framer Motion
- **Data**: TanStack Query (`useQuery`/`useMutation`/`useQueryClient`) for all data fetching
- **Toast**: `sonner` library
- **Auth**: `requireRole(req, 'receptionist')` for strict, `requireAuth(req) + RECEPTION_ROLES` for broader
- **Layout**: Responsive mobile-first with breakpoints sm/md/lg/xl
- **Loading**: Skeleton components with `animate-pulse`
- **Empty states**: Icon + message pattern
- **Status colors**: Pending=amber, Approve=emerald, Visited=teal, Canceled=red, Finish=blue, Extend=violet
- **Currency**: ₹ (INR) with `toLocaleString('en-IN')`

---

## 3. Identified Issues (Bugs)

### 🔴 Critical

| # | Bug | File | Description |
|---|-----|------|-------------|
| BUG-1 | Pending bookings not scoped to doctor | `src/app/api/dashboard/receptionist/pending-bookings/route.ts` | Fetches ALL Pending bookings across ALL doctors. Must filter by receptionist's linked `doctorId` |
| BUG-2 | Walk-in slot loading fragile | `src/app/dashboard/receptionist/walk-in/page.tsx` | Uses `useEffect` with 3 sequential fetches. Slot loading depends on finding `doctorId` from pending-bookings response — fails when no pending bookings exist. Should use receptionist's own doctorId from profile/stats API |

### 🟡 Medium

| # | Bug | File | Description |
|---|-----|------|-------------|
| BUG-3 | Header bell empty for receptionist | `src/components/dashboard/dashboard-header.tsx` | Line ~115: `if (role !== 'patient') return` — bell dropdown only loads for patients |
| BUG-4 | No pagination | Patients, Appointments, Notifications | Returns full dataset — performance issue at scale |
| BUG-5 | No search debounce | `src/app/dashboard/receptionist/patients/page.tsx` | Queries on every keystroke |
| BUG-6 | Print queue no auto-refresh | `src/app/dashboard/receptionist/print-queue/page.tsx` | Walk-in has 15s refresh, but print queue is static |

---

## 4. Gap Analysis vs Original PHP Doctorooms

### 🔴 HIGH PRIORITY — Core Business Logic Missing

| # | Feature | PHP Original | Current Gap |
|---|---------|-------------|-------------|
| GAP-1 | **Extend status action** | Pending→Extend→(Approve\|Reject) flow | Only Approve/Reject from Pending. No UI to set Extend |
| GAP-2 | **Visited status action** | Approve→Visited flow | No Visited action button on receptionist side |
| GAP-3 | **Rich booking form** | ~15 fields: mobile lookup, DOB, blood group, height, weight, gender, physical handicap, relation | Only 5 fields: name, disease, date, time, description |
| GAP-4 | **New Patient Registration** | Modal in booking form to create User record with auto credentials | Walk-in creates bookings but no User records from appointments page |
| GAP-5 | **Chat with Patient** | Per-appointment real-time chat (5s polling) | `BookingChat` model exists in Prisma, chat API exists, but NO chat UI in receptionist |

### 🟡 MEDIUM PRIORITY — Module Features Missing

| # | Feature | PHP Original | Current Gap |
|---|---------|-------------|-------------|
| GAP-6 | **Blog/Post Management** | Full CRUD with WYSIWYG, image upload, video, SEO permalink | Completely absent from receptionist |
| GAP-7 | **Medicine Master** | Full CRUD for doctor's medicine list | Completely absent |
| GAP-8 | **Schedule Write Access** | Add/delete holidays, update booking days | Schedule page is read-only only |
| GAP-9 | **Hospital Info Card** | Dashboard showed My Hospital card (name, address, city, state, contact) | Only doctor card shown |
| GAP-10 | **Today Visited stat** | 3rd dashboard stat box was "Today Visited" | Dashboard has Patients count instead |

### 🟢 LOW PRIORITY — Nice-to-Have

| # | Feature | PHP Original | Current Gap |
|---|---------|-------------|-------------|
| GAP-11 | Auto-refresh appointments | 10s AJAX refresh | No `refetchInterval` on appointments query |
| GAP-12 | Print on appointment detail | Print button in show view | Only Print Queue page has print |
| GAP-13 | Already-booked count | Show count when date selected | Not in booking dialog |
| GAP-14 | Emergency mode indicator | `check_emergency` partial view | No equivalent |
| GAP-15 | SMS notifications | Every status change | No SMS integration (infra limitation) |

### ➕ New Features (Not in PHP Original)

| # | Feature | Description |
|---|---------|-------------|
| NEW-1 | Walk-in Registration with Queue | OPD progress bar, live queue with position numbers, 15s auto-refresh |
| NEW-2 | Print Queue Page | Print-optimized today's queue with CSS `print:hidden/block` |
| NEW-3 | Daily Reports Page | Date picker, summary cards, appointment table |
| NEW-4 | Pending Bookings Dedicated Page | Card-based approve/reject with optimistic updates, 30s refresh |

---

## 5. Development Phases

### Phase A — Bug Fixes (Critical)
> Fix existing bugs before adding new features.

- [**A1**](./5-A-Reception-Bug-Fixes-Agent.md) — Fix pending-bookings API doctor scope (BUG-1)
- [**A2**](./5-A-Reception-Bug-Fixes-Agent.md) — Fix walk-in slot loading fragility (BUG-2)
- [**A3**](./5-A-Reception-Bug-Fixes-Agent.md) — Fix header bell for receptionist role (BUG-3)

### Phase B — Core Status Actions (High Priority)
> Add missing Extend/Visited status transitions on the appointments page.

- [**B1**](./5-B-Reception-Status-Actions-Agent.md) — Add Extend action (Pending → Extend)
- [**B2**](./5-B-Reception-Status-Actions-Agent.md) — Add Visited action (Approve → Visited)
- [**B3**](./5-B-Reception-Status-Actions-Agent.md) — Add new API endpoint `PATCH /bookings/[id]/status` for generic status transitions

### Phase C — Rich Booking Form + Patient Registration (High Priority)
> Expand the appointment creation form and add in-form patient registration.

- [**C1**](./5-C-Reception-Booking-Form-Agent.md) — Expand booking form fields (mobile, gender, DOB, age, blood group, height, weight, description, physical handicap, relation)
- [**C2**](./5-C-Reception-Booking-Form-Agent.md) — Mobile number lookup (auto-fill existing patient data)
- [**C3**](./5-C-Reception-Booking-Form-Agent.md) — New Patient Registration dialog within booking form
- [**C4**](./5-C-Reception-Booking-Form-Agent.md) — Already-booked count on date change

### Phase D — Chat System (High Priority)
> Real-time chat between receptionist and patient per appointment.

- [**D1**](./5-D-Reception-Chat-Agent.md) — Chat UI component in appointment detail dialog
- [**D2**](./5-D-Reception-Chat-Agent.md) — Message sending/receiving with TanStack Query + WebSocket or polling
- [**D3**](./5-D-Reception-Chat-Agent.md) — Disable chat for Visited/Rejected appointments

### Phase E — Blog Management (Medium Priority)
> Full CRUD blog/post management for receptionist.

- [**E1**](./5-E-Reception-Blog-Agent.md) — Blog list page with stats, create, edit, delete, toggle publish
- [**E2**](./5-E-Reception-Blog-Agent.md) — Blog API routes (CRUD with slugify + unique permalink)
- [**E3**](./5-E-Reception-Blog-Agent.md) — Sidebar entry + header route title

### Phase F — Medicine Master (Medium Priority)
> Doctor's medicine list management by receptionist.

- [**F1**](./5-F-Reception-Medicine-Agent.md) — Medicine list page with add/edit/toggle status
- [**F2**](./5-F-Reception-Medicine-Agent.md) — Medicine API routes (CRUD)
- [**F3**](./5-F-Reception-Medicine-Agent.md) — Sidebar entry + header route title

### Phase G — Schedule Management Write Access (Medium Priority)
> Holiday CRUD and booking days update.

- [**G1**](./5-G-Reception-Schedule-Write-Agent.md) — Add/Delete holidays on schedule page
- [**G2**](./5-G-Reception-Schedule-Write-Agent.md) — Update booking days setting
- [**G3**](./5-G-Reception-Schedule-Write-Agent.md) — Schedule write API routes

### Phase H — Dashboard Enhancements (Medium Priority)
> Polish the dashboard with missing cards and auto-refresh.

- [**H1**](./5-H-Reception-Dashboard-Enhance-Agent.md) — Hospital info card on dashboard
- [**H2**](./5-H-Reception-Dashboard-Enhance-Agent.md) — Replace Total Patients stat with Today Visited
- [**H3**](./5-H-Reception-Dashboard-Enhance-Agent.md) — Auto-refresh on appointments (10s refetchInterval)
- [**H4**](./5-H-Reception-Dashboard-Enhance-Agent.md) — Auto-refresh on print queue (15s refetchInterval)
- [**H5**](./5-H-Reception-Dashboard-Enhance-Agent.md) — Search debounce on patients page

---

## 6. Prisma Schema — Relevant Models

```prisma
// Receptionist — linked to ONE doctor
model Receptionist {
  id        String   @id @default(cuid())
  userId    String              // → User table
  doctorId  String              // → Doctor table
  address   String   @default("")
  createdAt DateTime @default(now())
  doctor    Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
}

// Booking — central to all reception workflows
model Booking {
  id               String   @id @default(cuid())
  appointmentNo    String   @unique
  doctorId         String
  userId           String?  // null for walk-ins
  patientName      String
  disease          String
  bookingDate      DateTime
  status           String   // Pending, Approve, Visited, Canceled, Extend, Finish
  timeSlot         String
  bookingMode      String   // InPerson, VideoCall
  bookingType      String   // By Self, By Receptionist, By Hospital
  appointmentCharge Int
  age              String?
  gender           String?
  bloodGroup       String?
  weight           String?
  description      String?
  // ... more fields
}

// DoctorSchedule
model DoctorSchedule {
  id            String   @id @default(cuid())
  doctorId      String
  day           String   // Monday-Sunday
  startTime     String
  endTime       String
  slotDuration  Int
  timeSlots     String   // JSON string array
}

// DoctorHoliday
model DoctorHoliday {
  id        String   @id @default(cuid())
  userId    String   // doctor user id
  date      DateTime
  remark    String?
}

// Notification
model Notification {
  id        String   @id @default(cuid())
  userId    String
  title     String
  message   String
  status    String   // UNREAD, READ
  createdAt DateTime @default(now())
}

// BookingChat (exists in schema — for chat feature)
model BookingChat {
  id         String   @id @default(cuid())
  bookingId  String
  senderId   String
  message    String
  createdAt  DateTime @default(now())
}

// Blog (exists — for blog feature)
model Blog {
  id          String   @id @default(cuid())
  userId      String
  title       String
  slug        String   @unique
  content     String
  videoLink   String?
  blogImage   String?
  status      String   @default("draft")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Medicine (exists — for medicine master)
model Medicine {
  id          String   @id @default(cuid())
  doctorId    String
  name        String
  morningDose String?
  afternoonDose String?
  eveningDose  String?
  dosage      String?
  tabCount    Int?
  description String?
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 7. Completion Checklist

### Phase A — Bug Fixes
- [ ] BUG-1: Pending bookings API scoped to linked doctor
- [ ] BUG-2: Walk-in slot loading uses receptionist's own doctorId
- [ ] BUG-3: Header bell works for receptionist role
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase B — Status Actions
- [ ] Extend action available on Pending bookings
- [ ] Visited action available on Approved bookings
- [ ] Generic status update API endpoint
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase C — Rich Booking Form
- [ ] Booking form expanded with all fields
- [ ] Mobile number lookup works
- [ ] New Patient Registration dialog
- [ ] Already-booked count on date change
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase D — Chat System
- [ ] Chat UI in appointment detail dialog
- [ ] Messages send/receive work
- [ ] Chat disabled for Visited/Rejected
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase E — Blog Management
- [ ] Blog list page
- [ ] Blog create/edit pages
- [ ] Blog API routes
- [ ] Sidebar + header updated
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase F — Medicine Master
- [ ] Medicine list page
- [ ] Medicine add/edit/toggle
- [ ] Medicine API routes
- [ ] Sidebar + header updated
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase G — Schedule Write
- [ ] Holiday CRUD on schedule page
- [ ] Booking days update
- [ ] Schedule write API routes
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase H — Dashboard Enhancements
- [ ] Hospital info card
- [ ] Today Visited stat
- [ ] Auto-refresh on appointments
- [ ] Auto-refresh on print queue
- [ ] Search debounce on patients
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification