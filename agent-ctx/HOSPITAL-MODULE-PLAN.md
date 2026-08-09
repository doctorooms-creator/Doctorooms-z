# Hospital Module — Comprehensive Development Plan (Updated)

> **Last Updated:** Research phase complete — all existing code audited, PHP reference analyzed, gaps identified.

---

## 1. Current Status

### Already Built ✅ (Phase 0 — Previous Sprint)

| # | Page | File | Lines | Status |
|---|------|------|-------|--------|
| 1 | Dashboard | `src/app/dashboard/hospital/page.tsx` | 287 | ✅ Built (gaps found) |
| 2 | Appointments | `src/app/dashboard/hospital/appointments/page.tsx` | 287 | ✅ Built (read-only, no CRUD) |
| 3 | Doctors | `src/app/dashboard/hospital/doctors/page.tsx` | 269 | ✅ Built (read-only, no add/edit) |

### API Routes Built ✅

| # | Endpoint | Methods | Auth | Description |
|---|----------|---------|------|-------------|
| 1 | `/api/dashboard/hospital/stats` | GET | `requireRole('hospital')` | Dashboard stats + doctor list + recent appointments |
| 2 | `/api/dashboard/hospital/doctors` | GET | `requireRole('hospital')` | Doctor list with search + specialization filter |
| 3 | `/api/dashboard/hospital/appointments` | GET | `requireRole('hospital')` | Appointment list with status/doctor/search filters |

### Sidebar Entries (4 items)
Dashboard, Doctors, Appointments, Change Password

---

## 2. Design Standards

- **Color**: Teal primary (`teal-500/600`), Amber for warnings, Emerald for success, Violet for pending, Red for errors/canceled
- **Components**: shadcn/ui (New York style) + Lucide icons + Framer Motion
- **Data**: TanStack Query (`useQuery`/`useMutation`/`useQueryClient`) for all data fetching
- **Toast**: `sonner` library
- **Auth**: `requireRole(req, 'hospital')` for strict, `requireAuth(req) + HOSPITAL_ROLES` for broader
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
| BUG-1 | Header bell empty for hospital | `src/components/dashboard/dashboard-header.tsx` | Line 119: `if (role !== 'patient' && role !== 'receptionist') return` — bell dropdown only loads for patient and receptionist roles. Hospital, doctor, admin, assistant, pharmacist all excluded |
| BUG-2 | No write APIs at all | `src/app/api/dashboard/hospital/*` | All 3 API routes are GET-only. No POST/PUT/PATCH endpoints exist for hospital module — cannot create, update, or delete any data |
| BUG-3 | Header Settings link may 404 | `src/components/dashboard/dashboard-header.tsx` | Line 263: Settings link points to `/dashboard/${role === 'admin' ? 'admin' : role}/settings` — no `/dashboard/hospital/settings` page exists |

### 🟡 Medium

| # | Bug | File | Description |
|---|-----|------|-------------|
| BUG-4 | No error handling in UI | `src/app/dashboard/hospital/*/page.tsx` | All 3 pages use `fetch().then(r => r.json())` without checking `r.ok`. API errors (500, 404) silently produce broken UI instead of error messages |
| BUG-5 | No pagination | Doctors, Appointments | Both pages fetch full dataset — performance issue at scale |
| BUG-6 | Dashboard missing key stats | `src/app/dashboard/hospital/page.tsx` | Missing: Pending appointments count, Today's appointments count, Monthly income chart, Blog post count. PHP original had 4 stat cards |
| BUG-7 | Header route titles incomplete | `src/components/dashboard/dashboard-header.tsx` | Missing route titles for all new hospital pages (profile, income, blog, notifications, add-doctor, etc.) |

---

## 4. Gap Analysis vs Original PHP Doctorooms

### 🔴 HIGH PRIORITY — Core Business Logic Missing

| # | Feature | PHP Original | Current Gap |
|---|---------|-------------|-------------|
| GAP-1 | **Hospital Profile (view/edit)** | `hospital/common/profile_update.php` — name, hospital name, address, state, city, contact, lat/long, avatar upload | Completely absent — no profile page, no profile API, no avatar upload |
| GAP-2 | **Add Doctor** | `hospital/doctor/add_doctor.php` — dual-table insert (users+doctors), 11+ fields, auto-generated credentials | Only list view exists. No add form, no create API |
| GAP-3 | **Edit Doctor** | `hospital/doctor/edit_doctor.php` — pre-filled form, specialization checkboxes, all fields editable | No edit page, no update API |
| GAP-4 | **Doctor Status Toggle** | `hospital/doctor/update_status` — toggle Active/Block on user status | No toggle UI, no PATCH status API |
| GAP-5 | **Create Appointment** | `hospital/appointment_add.php` — 15 fields, mobile lookup, doctor select, patient registration modal, auto-approve | Only list view exists. No create form, no POST API |
| GAP-6 | **Appointment Detail** | `hospital/appointment_show.php` — full detail table, chat module, print button, status actions | No detail page, no single-booking GET API |
| GAP-7 | **Appointment Status Actions** | Pending→Extend→Approve→Visited/Cancel flow, per-status action buttons | No status update API, no action buttons in UI |

### 🟡 MEDIUM PRIORITY — Module Features Missing

| # | Feature | PHP Original | Current Gap |
|---|---------|-------------|-------------|
| GAP-8 | **Income Summary** | `hospital/income_summary.php` — date range filter, doctor-wise VISITED charges, total per doctor | Completely absent — no page, no API |
| GAP-9 | **Blog Management** | `hospital/post/blog_view.php` + `blog_add.php` + `blog_edit.php` — full CRUD, CKEditor, image upload, status toggle (Published/Draft) | Completely absent — no pages, no API |
| GAP-10 | **Notifications** | Notifications created on appointment actions (PHP original created them but had no dedicated list view) | No notification page, no API. Header bell also broken (BUG-1) |
| GAP-11 | **Doctor Profile View** | `hospital/doctor/view_profile.php` — 2-column layout with rating, specialization labels, personal details | No doctor detail/profile page |
| GAP-12 | **Chat with Patient** | Per-appointment real-time chat (5s polling) in appointment detail | `BookingChat` model exists, but NO chat UI or API for hospital |

### 🟢 LOW PRIORITY — Nice-to-Have

| # | Feature | PHP Original | Current Gap |
|---|---------|-------------|-------------|
| GAP-13 | Monthly income bar chart | Morris.js chart on dashboard (Jan-Dec, VISITED bookings) | No chart on dashboard |
| GAP-14 | Schedule PDF upload | Upload schedule documents, list, view, delete | No schedule upload feature |
| GAP-15 | Patient registration modal | New patient creation embedded in appointment form | Not needed — can be deferred |
| GAP-16 | Auto-refresh appointments | Polling for new appointments | No `refetchInterval` on queries |
| GAP-17 | Print appointment | Print button on appointment detail | No print support |

### ➕ New Features (Not in PHP Original)

| # | Feature | Description |
|---|---------|-------------|
| NEW-1 | Pagination on all list pages | Cursor or offset-based pagination for doctors, appointments, blog, notifications |
| NEW-2 | Search debounce | Debounced search on doctors and appointments pages |
| NEW-3 | Error boundary / error states | Proper error handling with retry buttons on all pages |
| NEW-4 | Mobile number lookup | When creating appointment, lookup existing patient by mobile |

---

## 5. Development Phases

### Phase A — Bug Fixes (Critical)
> Fix existing bugs before adding new features.

- [**A1**](./6-A-Hospital-Bug-Fixes-Agent.md) — Fix header bell for hospital role (BUG-1): add `'hospital'` to the bell notification fetch condition in `dashboard-header.tsx`
- [**A2**](./6-A-Hospital-Bug-Fixes-Agent.md) — Fix header Settings link for hospital (BUG-3): remove Settings menu item or route to a safe page
- [**A3**](./6-A-Hospital-Bug-Fixes-Agent.md) — Add error handling to all 3 existing hospital pages (BUG-4): check `r.ok`, show error toast on failure, add error states
- [**A4**](./6-A-Hospital-Bug-Fixes-Agent.md) — Add header route titles for all planned hospital pages (BUG-7)

### Phase B — Hospital Profile (High Priority)
> Hospital profile view/edit page with avatar upload.

- [**B1**](./6-B-Hospital-Profile-Agent.md) — Profile API: `GET /api/hospital/profile` (fetch hospital + user data), `PUT /api/hospital/profile` (update name, hospitalName, address, state, city, contactNo, lat, longi)
- [**B2**](./6-B-Hospital-Profile-Agent.md) — Avatar upload API: `POST /api/hospital/avatar` (multipart upload, delete old image, update User.profileImg)
- [**B3**](./6-B-Hospital-Profile-Agent.md) — Profile page: `src/app/dashboard/hospital/profile/page.tsx` — 2-column layout (avatar left, form right), all fields editable except email/mobile
- [**B4**](./6-B-Hospital-Profile-Agent.md) — Sidebar entry + header route title for Profile

### Phase C — Doctor Management (High Priority)
> Add, edit, and toggle status for hospital doctors.

- [**C1**](./6-C-Hospital-Doctor-Mgmt-Agent.md) — Add Doctor API: `POST /api/dashboard/hospital/doctors` — dual-table insert (User + Doctor), auto-generate credentials, link to hospital
- [**C2**](./6-C-Hospital-Doctor-Mgmt-Agent.md) — Edit Doctor API: `PUT /api/dashboard/hospital/doctors/[id]` — update doctor fields + user name
- [**C3**](./6-C-Hospital-Doctor-Mgmt-Agent.md) — Toggle Doctor Status API: `PATCH /api/dashboard/hospital/doctors/[id]/status` — toggle Active/Block on User.status
- [**C4**](./6-C-Hospital-Doctor-Mgmt-Agent.md) — Add Doctor page: `src/app/dashboard/hospital/doctors/add/page.tsx` — full form (name, gender, email, password, doctorType, fees, contactNo, address, description, specialization, education, experience, registrationDetail)
- [**C5**](./6-C-Hospital-Doctor-Mgmt-Agent.md) — Edit Doctor page: `src/app/dashboard/hospital/doctors/[id]/edit/page.tsx` — pre-filled form, same fields as add
- [**C6**](./6-C-Hospital-Doctor-Mgmt-Agent.md) — Doctor status toggle UI: toggle switch on doctors list page with optimistic update
- [**C7**](./6-C-Hospital-Doctor-Mgmt-Agent.md) — Header route titles for add/edit doctor pages

### Phase D — Appointment Management (High Priority)
> Create appointment, detail page, and status actions.

- [**D1**](./6-D-Hospital-Appointment-Mgmt-Agent.md) — Create Appointment API: `POST /api/dashboard/hospital/appointments` — mobile lookup, auto-approve (status=Approve), bookingType="By Hospital", generate appointment number, create notification
- [**D2**](./6-D-Hospital-Appointment-Mgmt-Agent.md) — Single Appointment API: `GET /api/dashboard/hospital/appointments/[id]` — full booking detail with doctor + patient info
- [**D3**](./6-D-Hospital-Appointment-Mgmt-Agent.md) — Appointment Status API: `PATCH /api/dashboard/hospital/appointments/[id]/status` — status transition with validation (Pending→Extend, Pending/Extend→Approve, Approve→Visited, any→Canceled)
- [**D4**](./6-D-Hospital-Appointment-Mgmt-Agent.md) — Create Appointment page: `src/app/dashboard/hospital/appointments/add/page.tsx` — rich form with doctor select, mobile lookup, patient fields (name, gender, DOB, age, bloodGroup, height, weight, physicallyChallenged, relation), disease, description, date/time
- [**D5**](./6-D-Hospital-Appointment-Mgmt-Agent.md) — Appointment Detail page: `src/app/dashboard/hospital/appointments/[id]/page.tsx` — full detail view with all fields, status actions (contextual buttons), print button
- [**D6**](./6-D-Hospital-Appointment-Mgmt-Agent.md) — Status action buttons on appointments list page (inline approve/extend/visited/cancel)
- [**D7**](./6-D-Hospital-Appointment-Mgmt-Agent.md) — Header route titles for add/detail appointment pages

### Phase E — Income Summary (Medium Priority)
> Income/charges report with date range and doctor filter.

- [**E1**](./6-E-Hospital-Income-Agent.md) — Income API: `GET /api/dashboard/hospital/income` — query params: `fromDate`, `toDate`, `doctorId`; returns doctor-wise SUM of appointment_charge for VISITED bookings
- [**E2**](./6-E-Hospital-Income-Agent.md) — Income page: `src/app/dashboard/hospital/income/page.tsx` — date range picker, doctor dropdown filter, summary table (image, name, email, mobile, total charges), total income card
- [**E3**](./6-E-Hospital-Income-Agent.md) — Sidebar entry (IndianRupee icon) + header route title for Income

### Phase F — Blog Management (Medium Priority)
> Full CRUD blog/post management, same pattern as receptionist blog.

- [**F1**](./6-F-Hospital-Blog-Agent.md) — Blog API: `GET /api/hospital/posts`, `POST /api/hospital/posts`, `GET /api/hospital/posts/[id]`, `PUT /api/hospital/posts/[id]`, `DELETE /api/hospital/posts/[id]`, `PATCH /api/hospital/posts/[id]/status` — CRUD with slugify + unique permalink, image upload
- [**F2**](./6-F-Hospital-Blog-Agent.md) — Blog list page: `src/app/dashboard/hospital/blog/page.tsx` — table with title, type, date, status toggle, edit/delete actions
- [**F3**](./6-F-Hospital-Blog-Agent.md) — Blog create page: `src/app/dashboard/hospital/blog/new/page.tsx` — title, content (textarea/ckeditor), video link, image upload
- [**F4**](./6-F-Hospital-Blog-Agent.md) — Blog edit page: `src/app/dashboard/hospital/blog/[id]/edit/page.tsx` — pre-filled form, same as create
- [**F5**](./6-F-Hospital-Blog-Agent.md) — Sidebar entry (PenLine icon) + header route titles for blog pages

### Phase G — Notifications (Medium Priority)
> Notification list and mark-read functionality.

- [**G1**](./6-G-Hospital-Notifications-Agent.md) — Notifications API: `GET /api/hospital/notifications` (list with pagination + unread count), `PATCH /api/hospital/notifications` (mark all read), `PATCH /api/hospital/notifications/[id]` (mark single read)
- [**G2**](./6-G-Hospital-Notifications-Agent.md) — Notifications page: `src/app/dashboard/hospital/notifications/page.tsx` — list with unread indicators, mark-all-read button, click to view detail
- [**G3**](./6-G-Hospital-Notifications-Agent.md) — Wire header bell to hospital notification API (complements BUG-1 fix in Phase A)
- [**G4**](./6-G-Hospital-Notifications-Agent.md) — Sidebar entry (Bell icon) + header route title for Notifications

### Phase H — Dashboard Enhancements (Medium Priority)
> Polish the dashboard with missing stats, chart, and sidebar/header updates.

- [**H1**](./6-H-Hospital-Dashboard-Enhance-Agent.md) — Add Pending Appointments stat card (4th card) with Stethoscope/Calendar icon
- [**H2**](./6-H-Hospital-Dashboard-Enhance-Agent.md) — Add Today's Appointments stat card (replaces or supplements Patient Visits)
- [**H3**](./6-H-Hospital-Dashboard-Enhance-Agent.md) — Add monthly income bar chart (Jan-Dec, VISITED bookings) — use Recharts or simple CSS bar chart
- [**H4**](./6-H-Hospital-Dashboard-Enhance-Agent.md) — Update sidebar to full set: Dashboard, Doctors, Appointments, Income, Blog, Profile, Notifications, Change Password (8 items)
- [**H5**](./6-H-Hospital-Dashboard-Enhance-Agent.md) — Add auto-refresh on dashboard stats (30s `refetchInterval`)

---

## 6. Prisma Schema — Relevant Models

```prisma
// Hospital — linked to ONE user
model Hospital {
  id           String   @id @default(cuid())
  userId       String   @unique
  hospitalName String   @default("")
  address      String   @default("")
  state        String   @default("")
  city         String   @default("")
  contactNo    String   @default("")
  gallery      String   @default("[]") // JSON array
  lat          Float    @default(0)
  longi        Float    @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// User — contains auth + profile data shared across roles
model User {
  id              String   @id @default(cuid())
  name            String
  gender          String   @default("Male")
  role            String   @default("patient") // admin, doctor, patient, hospital, receptionist, assistant, pharmacist
  status          String   @default("Pending") // Pending, Active, Block
  email           String   @unique
  password        String   @default("")
  profileImg      String   @default("default.png")
  mobileNo        String   @default("")
  // ... more fields

  hospital        Hospital?
  doctor          Doctor?
  bookings        Booking[]
  posts           Post[]
  notifications   Notification[]
}

// Doctor — linked to hospital (optional), user, schedules, bookings
model Doctor {
  id                  String   @id @default(cuid())
  userId              String   @unique
  bookingDays         Int      @default(180)
  dailyLimit          Int      @default(50)
  doctorType          String   @default("")
  description         String   @default("")
  address             String   @default("")
  state               String   @default("")
  city                String   @default("")
  hospitalAddress     String   @default("")
  fees                Float    @default(0)
  emergencyCharge     Float    @default(0)
  specialization     String   @default("")
  awardAndRecognition String   @default("")
  education           String   @default("")
  lat                 Float    @default(0)
  longi               Float    @default(0)
  hospitalId          String?  // → Hospital table
  experience          String   @default("")
  registrationDetail  String   @default("")
  contactNo           String   @default("")
  phoneNo             String   @default("")
  isEmergency         Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  bookings            Booking[]
  // ... more relations
}

// Booking — central to all appointment workflows
model Booking {
  id               String   @id @default(cuid())
  appointmentNo    String   @unique @default("")
  doctorId         String
  userId           String?  // null for walk-ins
  bookingDate      DateTime @default(now())
  patientName      String   @default("")
  disease          String   @default("")
  description      String   @default("")
  gender           String   @default("")
  dateOfBirth      DateTime?
  age              Int?
  relationWithMe   String   @default("")
  bloodGroup       String   @default("")
  weight           Float    @default(0)
  height           Float    @default(0)
  physicallyChallenged String @default("No")
  status           String   @default("Pending") // Pending, Approve, Visited, Canceled, Extend, Finish
  timeSlot         String   @default("")
  bookingMode      String   @default("InPerson") // InPerson, VideoCall
  bookingType      String   @default("By Self") // By Self, By Receptionist, By Hospital
  appointmentCharge Float   @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  doctor           Doctor   @relation(fields: [doctorId], references: [id])
  user             User?    @relation(fields: [userId], references: [id])
  // ... more relations
}

// Post (Blog) — shared model for blog/news across roles
model Post {
  id        String   @id @default(cuid())
  title     String   @default("")
  permalink String   @unique @default("")
  content   String   @default("")
  blogImg   String   @default("")
  type      String   @default("Blog") // Blog, News
  status    String   @default("Draft") // Published, Draft
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  author    User     @relation(fields: [authorId], references: [id])
}

// Notification — per-user notifications
model Notification {
  id        String   @id @default(cuid())
  userId    String
  title     String   @default("")
  message   String   @default("")
  status    String   @default("UNREAD") // READ, UNREAD
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// BookingChat (exists in schema — for chat feature, deferred)
model BookingChat {
  id        String   @id @default(cuid())
  bookingId String
  fromId    String
  toId      String
  message   String
  status    String   @default("UNREAD") // READ, UNREAD
  createdAt DateTime @default(now())

  booking   Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  sender    User     @relation("ChatSender", fields: [fromId], references: [id])
  receiver  User     @relation("ChatReceiver", fields: [toId], references: [id])
}

// DoctorRating (for doctor avg rating display)
model DoctorRating {
  id        String   @id @default(cuid())
  patientId String
  doctorId  String
  bookingId String?
  star      Int      @default(5)
  // ... more fields
}
```

---

## 7. Completion Checklist

### Phase A — Bug Fixes
- [ ] BUG-1: Header bell works for hospital role
- [ ] BUG-2: (Addressed by adding write APIs in Phases B–G)
- [ ] BUG-3: Header Settings link safe for hospital (removed or rerouted)
- [ ] BUG-4: Error handling on all 3 existing pages
- [ ] BUG-7: Header route titles for all planned hospital pages
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase B — Hospital Profile
- [ ] Profile GET API returns hospital + user data
- [ ] Profile PUT API updates hospital fields
- [ ] Avatar POST API uploads and updates profile image
- [ ] Profile page renders with 2-column layout
- [ ] Profile edit form works end-to-end
- [ ] Avatar upload works end-to-end
- [ ] Sidebar + header updated
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase C — Doctor Management
- [ ] Add Doctor POST API (dual-table insert)
- [ ] Edit Doctor PUT API
- [ ] Toggle Status PATCH API
- [ ] Add Doctor page with full form
- [ ] Edit Doctor page with pre-filled form
- [ ] Status toggle on doctors list page
- [ ] Header route titles for add/edit
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase D — Appointment Management
- [ ] Create Appointment POST API (auto-approve, generate number)
- [ ] Single Appointment GET API
- [ ] Status transition PATCH API with validation
- [ ] Create Appointment page with rich form + doctor select
- [ ] Appointment Detail page with status actions
- [ ] Status action buttons on appointments list
- [ ] Header route titles for add/detail
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase E — Income Summary
- [ ] Income GET API with date range + doctor filter
- [ ] Income page with filters + summary table
- [ ] Total income summary card
- [ ] Sidebar + header updated
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase F — Blog Management
- [ ] Blog CRUD API routes
- [ ] Blog list page
- [ ] Blog create page
- [ ] Blog edit page
- [ ] Blog delete with confirmation
- [ ] Blog status toggle (Published/Draft)
- [ ] Sidebar + header updated
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase G — Notifications
- [ ] Notifications GET API (list + unread count)
- [ ] Notifications PATCH API (mark read/all read)
- [ ] Notifications list page
- [ ] Header bell wired to hospital notification API
- [ ] Sidebar + header updated
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase H — Dashboard Enhancements
- [ ] Pending Appointments stat card
- [ ] Today's Appointments stat card
- [ ] Monthly income bar chart
- [ ] Sidebar expanded to 8 items
- [ ] Auto-refresh on dashboard stats
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification