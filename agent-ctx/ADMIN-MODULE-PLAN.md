# Admin Module — Comprehensive Development Plan (Updated)

> **Last Updated:** Research phase complete — all existing code audited, PHP reference analyzed, gaps identified.

---

## 1. Current Status

### Already Built ✅ (Phase 0 — Previous Sprint)

| # | Page | File | Lines | Status |
|---|------|------|-------|--------|
| 1 | Dashboard | `src/app/dashboard/admin/page.tsx` | 319 | ✅ Built (hardcoded trends) |
| 2 | Users | `src/app/dashboard/admin/users/page.tsx` | 487 | ✅ Built (wrong stat values) |
| 3 | Doctors | `src/app/dashboard/admin/doctors/page.tsx` | ~500 | ✅ Built (read-only, no edit) |
| 4 | Hospitals | `src/app/dashboard/admin/hospitals/page.tsx` | ~400 | ✅ Built (list + delete only) |
| 5 | Appointments | `src/app/dashboard/admin/appointments/page.tsx` | ~600 | ✅ Built (read-only, no status actions) |
| 6 | Blog | `src/app/dashboard/admin/blog/page.tsx` | ~500 | ✅ Built |
| 7 | Inquiries | `src/app/dashboard/admin/inquiries/page.tsx` | ~300 | ✅ Built |
| 8 | Settings | `src/app/dashboard/admin/settings/page.tsx` | ~400 | ✅ Built (filesystem JSON, not DB) |

### API Routes Built ✅

| # | Endpoint | Methods | Auth | Description |
|---|----------|---------|------|-------------|
| 1 | `/api/dashboard/admin/stats` | GET | `requireRole('admin')` | Dashboard stats + recent appointments |
| 2 | `/api/dashboard/admin/users` | GET | `requireRole('admin')` | User list with role filter, search, pagination |
| 3 | `/api/dashboard/admin/users/[id]` | DELETE | `requireRole('admin')` | Delete user (self-protection) |
| 4 | `/api/dashboard/admin/users/[id]/status` | PUT | `requireRole('admin')` | Change user status (Active/Block/Pending) |
| 5 | `/api/dashboard/admin/doctors` | GET | `requireRole('admin')` | Doctor list with search, city/specialization filter |
| 6 | `/api/dashboard/admin/hospitals` | GET | `requireRole('admin')` | Hospital list with search, city filter |
| 7 | `/api/dashboard/admin/appointments` | GET | `requireRole('admin')` | All appointments with status filter, search |
| 8 | `/api/dashboard/admin/blog` | GET, POST | `requireRole('admin')` | Blog CRUD |
| 9 | `/api/dashboard/admin/blog/[id]` | PUT, DELETE | `requireRole('admin')` | Blog update/delete |
| 10 | `/api/dashboard/admin/inquiries` | GET, PUT, DELETE | `requireRole('admin')` | Inquiry list, mark read/unread, delete |
| 11 | `/api/admin/settings` | GET, PUT | `requireRole('admin')` | Settings (filesystem JSON) |

### Sidebar Entries (9 items)
Dashboard, Users, Doctors, Hospitals, Appointments, Blog, Inquiries, Settings, Change Password

---

## 2. Design Standards

- **Color**: Teal primary (`teal-500/600`), Amber for warnings, Emerald for success, Violet for pending, Red for errors/canceled, Rose for admin-specific accents
- **Components**: shadcn/ui (New York style) + Lucide icons + Framer Motion
- **Data**: TanStack Query (`useQuery`/`useMutation`/`useQueryClient`) for all data fetching
- **Toast**: `sonner` library
- **Auth**: `requireRole(req, 'admin')` consistently across all endpoints
- **Layout**: Responsive mobile-first with breakpoints sm/md/lg/xl
- **Loading**: Skeleton components with `animate-pulse`
- **Empty states**: Icon + message pattern
- **Status colors**: Pending=amber, Approve=emerald, Visited=teal, Canceled=red, Finish=blue, Extend=violet
- **Role colors**: admin=red, doctor=teal, patient=blue, hospital=amber, receptionist=violet, assistant=pink, pharmacist=emerald
- **Currency**: ₹ (INR) with `toLocaleString('en-IN')`
- **Destructive actions**: Always use `AlertDialog` confirmation before delete/block

---

## 3. Identified Issues (Bugs)

### 🔴 Critical

| # | Bug | File | Description |
|---|-----|------|-------------|
| BUG-1 | Unused imports in inquiries API | `src/app/api/dashboard/admin/inquiries/route.ts` | Lines 4-5: `import fs from 'fs'` and `import path from 'path'` are imported but never used. Causes ESLint warnings. |
| BUG-2 | Hardcoded stat card trend values | `src/app/dashboard/admin/page.tsx` | Lines 102, 110, 118, 126: All 4 StatCard components use hardcoded `trend={{ value: 12/8/5/18, label: 'from last month' }}`. These should come from the API with actual month-over-month comparison. |
| BUG-3 | Wrong stat values on Users page | `src/app/dashboard/admin/users/page.tsx` | Lines 174, 188: Uses `data?.roleCounts?.Active` and `data?.roleCounts?.Block` — but `roleCounts` returns counts grouped by **role** (admin, doctor, patient…), not by **status** (Active, Pending, Block). These always show 0 or wrong values. |
| BUG-4 | Inconsistent requireRole return check | `src/app/api/dashboard/admin/inquiries/route.ts` | Lines 9, 51, 79: `await requireRole(request, 'admin')` is called but the return value is not checked for null. If auth fails, execution continues without returning 401. All other admin APIs correctly check `if (!user) return ...` after the call. |

### 🟡 Medium

| # | Bug | File | Description |
|---|-----|------|-------------|
| BUG-5 | Settings stored in filesystem JSON | `src/app/api/admin/settings/route.ts` | Uses `fs.readFileSync/writeFileSync` on `/download/admin-settings.json`. Should be stored in the database for durability, transactions, and multi-instance support. No migration plan exists. |
| BUG-6 | No pagination on inquiries | `src/app/api/dashboard/admin/inquiries/route.ts` | `findMany()` with no `skip`/`take` — returns entire dataset. Performance issue at scale. |
| BUG-7 | No pagination on hospitals | `src/app/api/dashboard/admin/hospitals/route.ts` | Returns all hospitals without pagination. |
| BUG-8 | No pagination on doctors | `src/app/api/dashboard/admin/doctors/route.ts` | Returns all doctors without pagination. |

---

## 4. Gap Analysis vs Original PHP Doctorooms

### 🔴 HIGH PRIORITY — Core Business Logic Missing

| # | Feature | PHP Original | Current Gap |
|---|---------|-------------|-------------|
| GAP-1 | **Appointment Status Management** | Admin could approve/extend/visit/cancel appointments from admin panel | Only a read-only appointment list. No status change buttons or API endpoint. |
| GAP-2 | **Doctor Edit** | Full doctor profile edit: fees, specialization, education, experience, contact, emergency settings | Only list + view dialog. No edit page, no PUT API for doctor data. |
| GAP-3 | **Hospital CRUD** | Full hospital create/edit/delete with name, address, state, city, contact, gallery | Only list + delete. No add/edit pages, no POST/PUT API. |
| GAP-4 | **Slider Management** | Full CRUD for homepage sliders with image upload, title, subtitle, link, position ordering, active/inactive toggle | `Slider` model exists in Prisma schema but zero UI and zero API. |
| GAP-5 | **Doctor Type Master** | CRUD for doctor type categories (e.g. General Physician, Cardiologist, Surgeon) | `DoctorTypeMaster` model exists in Prisma schema but zero UI and zero API. |
| GAP-6 | **Disease Master** | CRUD for disease categories used in appointment booking | `DiseaseMaster` model exists in Prisma schema but zero UI and zero API. |
| GAP-7 | **Reports Module** | User report, appointment report, income report, hospital-wise income report with date range filters | Zero reporting capability. Admin has no visibility into business metrics. |
| GAP-8 | **Admin Charges Config** | Platform commission/charge percentage per booking, configurable by admin | No `Config` model in Prisma, no page, no API. Admin cannot set platform fees. |

### 🟡 MEDIUM PRIORITY — Module Features Missing

| # | Feature | PHP Original | Current Gap |
|---|---------|-------------|-------------|
| GAP-9 | **Admin Profile** | Admin can edit own name, email, mobile, profile image | No profile page. Admin cannot update own information. |
| GAP-10 | **Doctor Detail Page** | Dedicated doctor detail page with full profile, schedule, stats, linked hospital | Only inline dialog. No dedicated `doctors/[id]` page. |
| GAP-11 | **Hospital Detail/Edit Pages** | Dedicated hospital detail page with edit capability | Only inline dialog on list page. No dedicated pages. |
| GAP-12 | **Income Dashboard** | Total income, monthly breakdown, hospital-wise income distribution | Admin dashboard shows total revenue but no income-specific page with breakdowns. |

### 🟢 LOW PRIORITY — Nice-to-Have

| # | Feature | PHP Original | Current Gap |
|---|---------|-------------|-------------|
| GAP-13 | Blog image upload | Image upload for blog posts | Blog create/edit uses plain textarea, no image upload |
| GAP-14 | Hospital gallery management | Upload/manage hospital gallery images | Hospital has `gallery` JSON field but no gallery UI |
| GAP-15 | Bulk user actions | Select multiple users, bulk activate/block/delete | All actions are single-user only |

---

## 5. Development Phases

### Phase A — Bug Fixes (Critical)
> Fix existing bugs before adding new features.

- [**A1**](./9-A-Admin-Bug-Fixes-Agent.md) — Remove unused `fs` and `path` imports from inquiries API (BUG-1)
- [**A2**](./9-A-Admin-Bug-Fixes-Agent.md) — Fix inconsistent `requireRole` return value checks in inquiries API (BUG-4)
- [**A3**](./9-A-Admin-Bug-Fixes-Agent.md) — Replace hardcoded trend values on admin dashboard with real month-over-month data from API (BUG-2)
- [**A4**](./9-A-Admin-Bug-Fixes-Agent.md) — Fix Users page stat cards: add `statusCounts` to users API and use status-based counts instead of roleCounts (BUG-3)

### Phase B — Doctor Management (High Priority)
> Add doctor edit capability and dedicated detail page.

- [**B1**](./9-B-Admin-Doctor-Edit-Agent.md) — Doctor edit API: `PUT /api/dashboard/admin/doctors/[id]` to update Doctor profile (fees, specialization, education, experience, contact, address, emergency, description)
- [**B2**](./9-B-Admin-Doctor-Edit-Agent.md) — Doctor edit page: `doctors/[id]/edit` with full form, all Doctor fields, save/cancel
- [**B3**](./9-B-Admin-Doctor-Edit-Agent.md) — Doctor detail page: `doctors/[id]` with full profile card, stats, schedule view, appointments list
- [**B4**](./9-B-Admin-Doctor-Edit-Agent.md) — Add Edit button to doctor list row actions and view dialog

### Phase C — Hospital Management (High Priority)
> Full hospital CRUD with create/edit pages.

- [**C1**](./9-C-Admin-Hospital-CRUD-Agent.md) — Hospital API: `POST /api/dashboard/admin/hospitals`, `PUT /api/dashboard/admin/hospitals/[id]`, `PATCH /api/dashboard/admin/hospitals/[id]/status`
- [**C2**](./9-C-Admin-Hospital-CRUD-Agent.md) — Hospital add page: `hospitals/add` with form (name, address, state, city, contact)
- [**C3**](./9-C-Admin-Hospital-CRUD-Agent.md) — Hospital detail page: `hospitals/[id]` with full info, linked doctors, stats
- [**C4**](./9-C-Admin-Hospital-CRUD-Agent.md) — Hospital edit page: `hospitals/[id]/edit` with pre-filled form
- [**C5**](./9-C-Admin-Hospital-CRUD-Agent.md) — Update hospital list page: add Create button, edit/view actions in dropdown, activate/block toggle

### Phase D — Appointment Actions (High Priority)
> Enable admin to manage appointment statuses.

- [**D1**](./9-D-Admin-Appointment-Actions-Agent.md) — Appointment status API: `PUT /api/dashboard/admin/appointments/[id]/status` with valid transition validation
- [**D2**](./9-D-Admin-Appointment-Actions-Agent.md) — Status action buttons on appointments page: Approve, Extend, Visit, Cancel, Finish (contextual per current status)
- [**D3**](./9-D-Admin-Appointment-Actions-Agent.md) — Confirmation dialogs for destructive status changes (Cancel)
- [**D4**](./9-D-Admin-Appointment-Actions-Agent.md) — Notification creation on status change (to patient and doctor)

### Phase E — Masters (Medium Priority)
> Doctor Type and Disease Type master data management.

- [**E1**](./9-E-Admin-Masters-Agent.md) — Doctor Type API: `GET/POST/PUT/DELETE /api/dashboard/admin/doctor-types` with Active/Inactive toggle
- [**E2**](./9-E-Admin-Masters-Agent.md) — Doctor Type page: list with add/edit/toggle status/delete, used in doctor specialization dropdown
- [**E3**](./9-E-Admin-Masters-Agent.md) — Disease Type API: `GET/POST/PUT/DELETE /api/dashboard/admin/disease-types` with Active/Inactive toggle
- [**E4**](./9-E-Admin-Masters-Agent.md) — Disease Type page: list with add/edit/toggle status/delete, used in appointment disease dropdown
- [**E5**](./9-E-Admin-Masters-Agent.md) — Sidebar entries: Masters group with Doctor Types and Disease Types sub-items

### Phase F — Slider Management (Medium Priority)
> Homepage slider CRUD with image upload and ordering.

- [**F1**](./9-F-Admin-Slider-Agent.md) — Slider API: `GET/POST/PUT/DELETE /api/dashboard/admin/sliders` with image upload, position ordering, status toggle
- [**F2**](./9-F-Admin-Slider-Agent.md) — Slider list page: cards showing image preview, title, subtitle, position number, status badge, drag-to-reorder, edit/delete actions
- [**F3**](./9-F-Admin-Slider-Agent.md) — Slider create/edit dialog: image upload (drag-drop), title, subtitle, link, position number, status toggle
- [**F4**](./9-F-Admin-Slider-Agent.md) — Sidebar entry: Sliders

### Phase G — Reports Module (Medium Priority)
> Business intelligence and reporting for admin.

- [**G1**](./9-G-Admin-Reports-Agent.md) — Income API: `GET /api/dashboard/admin/income` with date range, monthly breakdown, total, comparison
- [**G2**](./9-G-Admin-Reports-Agent.md) — Income page: stat cards (total, this month, last month, growth %), monthly bar chart, recent transactions table
- [**G3**](./9-G-Admin-Reports-Agent.md) — User report API: `GET /api/dashboard/admin/reports/users` with date range, role breakdown, registration trends
- [**G4**](./9-G-Admin-Reports-Agent.md) — User report page: registration trends, role distribution pie chart, date range filter
- [**G5**](./9-G-Admin-Reports-Agent.md) — Appointment report API: `GET /api/dashboard/admin/reports/appointments` with date range, status breakdown, doctor-wise summary
- [**G6**](./9-G-Admin-Reports-Agent.md) — Appointment report page: status distribution, daily/weekly trends, top doctors table
- [**G7**](./9-G-Admin-Reports-Agent.md) — Hospital-wise income API: `GET /api/dashboard/admin/reports/income-hospital` with per-hospital revenue breakdown
- [**G8**](./9-G-Admin-Reports-Agent.md) — Hospital-wise income page: hospital comparison table, bar chart, percentage share
- [**G9**](./9-G-Admin-Reports-Agent.md) — Reports hub page with links to all 4 report types
- [**G10**](./9-G-Admin-Reports-Agent.md) — Sidebar entries: Income, Reports group

### Phase H — Admin Profile + Charges (Medium Priority)
> Admin self-management and platform charges configuration.

- [**H1**](./9-H-Admin-Profile-Charges-Agent.md) — Admin profile API: `GET/PUT /api/dashboard/admin/profile` for name, email, mobile, profile image
- [**H2**](./9-H-Admin-Profile-Charges-Agent.md) — Admin profile page: edit form with avatar upload (reuse pattern from receptionist/doctor profile pages)
- [**H3**](./9-H-Admin-Profile-Charges-Agent.md) — Admin charges Config model: add to Prisma schema (`AdminConfig` with key-value pairs for platformChargePercent, minCharge, etc.)
- [**H4**](./9-H-Admin-Profile-Charges-Agent.md) — Charges API: `GET/PUT /api/dashboard/admin/charges` to read/write platform charge configuration
- [**H5**](./9-H-Admin-Profile-Charges-Agent.md) — Charges page: form to configure platform commission %, minimum charge, per-booking charges, effective date
- [**H6**](./9-H-Admin-Profile-Charges-Agent.md) — Migrate settings from filesystem JSON to database (BUG-5 resolution)
- [**H7**](./9-H-Admin-Profile-Charges-Agent.md) — Sidebar entries: Profile, Admin Charges

---

## 6. Prisma Schema — Relevant Models

```prisma
// ============ ADMIN-RELEVANT MODELS ============

// User (admin is a role on User model — no separate Admin model)
model User {
  id              String   @id @default(cuid())
  name            String
  gender          String   @default("Male")
  role            String   @default("patient")
  status          String   @default("Pending")
  email           String   @unique
  password        String   @default("")
  profileImg      String   @default("default.png")
  mobileNo        String   @default("")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  // ... relations
}

// Doctor — admin manages all doctor records
model Doctor {
  id                  String   @id @default(cuid())
  userId              String   @unique
  bookingDays         Int      @default(180)
  dailyLimit          Int      @default(50)
  doctorType          String   @default("")
  description         String   @default("")
  photos              String   @default("[]")
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
  hospitalId          String?
  experience          String   @default("")
  registrationDetail  String   @default("")
  contactNo           String   @default("")
  phoneNo             String   @default("")
  isEmergency         Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  // ... relations
}

// Hospital — admin creates/edits hospitals
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
}

// Booking — admin manages all appointments
model Booking {
  id               String   @id @default(cuid())
  appointmentNo    String   @unique @default("")
  doctorId         String
  userId           String?
  patientName      String   @default("")
  disease          String   @default("")
  bookingDate      DateTime @default(now())
  status           String   @default("Pending")
  timeSlot         String   @default("")
  bookingMode      String   @default("InPerson")
  bookingType      String   @default("By Self")
  appointmentCharge Float   @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  // ... more fields + relations
}

// Slider — exists in schema, no UI/API yet
model Slider {
  id           String   @id @default(cuid())
  sliderImage  String   @default("")
  position     Int      @default(0)
  status       String   @default("Active")
  link         String   @default("")
  title        String   @default("")
  subtitle     String   @default("")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// DoctorTypeMaster — exists in schema, no UI/API yet
model DoctorTypeMaster {
  id        String   @id @default(cuid())
  type      String   @default("")
  status    String   @default("Active")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// DiseaseMaster — exists in schema, no UI/API yet
model DiseaseMaster {
  id        String   @id @default(cuid())
  name      String   @default("")
  status    String   @default("Active")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// HospitalInquiry — managed by admin
model HospitalInquiry {
  id        String   @id @default(cuid())
  name      String   @default("")
  email     String   @default("")
  phone     String   @default("")
  subject   String   @default("")
  message   String   @default("")
  status    String   @default("Pending")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Post (Blog) — managed by admin
model Post {
  id        String   @id @default(cuid())
  title     String   @default("")
  permalink String   @unique @default("")
  content   String   @default("")
  blogImg   String   @default("")
  type      String   @default("Blog")
  status    String   @default("Draft")
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ============ NEW MODEL NEEDED (Phase H) ============

// AdminConfig — platform-wide configuration (replace filesystem settings)
// model AdminConfig {
//   id        String   @id @default(cuid())
//   key       String   @unique   // e.g. "platformChargePercent", "minCharge", "siteName"
//   value     String   @default("")
//   updatedAt DateTime @updatedAt
// }
```

---

## 7. Completion Checklist

### Phase A — Bug Fixes
- [ ] BUG-1: Unused `fs` and `path` imports removed from inquiries API
- [ ] BUG-2: Dashboard stat card trends use real month-over-month data from API
- [ ] BUG-3: Users page stat cards show status-based counts (Active/Pending/Block) from new `statusCounts` API field
- [ ] BUG-4: All `requireRole` calls in inquiries API check return value for null
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase B — Doctor Management
- [ ] Doctor edit API (`PUT /doctors/[id]`) updates all Doctor fields
- [ ] Doctor edit page with full form
- [ ] Doctor detail page with profile card, stats, schedule, appointments
- [ ] Edit button in doctor list and view dialog
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase C — Hospital Management
- [ ] Hospital create API (`POST /hospitals`)
- [ ] Hospital update API (`PUT /hospitals/[id]`)
- [ ] Hospital status toggle API (`PATCH /hospitals/[id]/status`)
- [ ] Hospital add page with form
- [ ] Hospital detail page with linked doctors
- [ ] Hospital edit page with pre-filled form
- [ ] Hospital list updated with Create button and edit/view actions
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase D — Appointment Actions
- [ ] Appointment status API (`PUT /appointments/[id]/status`)
- [ ] Status transition validation (valid state machine)
- [ ] Action buttons on appointments page (contextual per status)
- [ ] Confirmation dialogs for destructive changes
- [ ] Notifications created on status change
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase E — Masters
- [ ] Doctor Type CRUD API
- [ ] Doctor Type page with list, add, edit, toggle, delete
- [ ] Disease Type CRUD API
- [ ] Disease Type page with list, add, edit, toggle, delete
- [ ] Sidebar entries for Masters group
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase F — Slider Management
- [ ] Slider CRUD API with image upload
- [ ] Slider list page with image preview and position ordering
- [ ] Slider create/edit dialog with drag-drop image upload
- [ ] Sidebar entry for Sliders
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase G — Reports Module
- [ ] Income API with date range and monthly breakdown
- [ ] Income page with stat cards and chart
- [ ] User report API with registration trends
- [ ] User report page with role distribution and trends
- [ ] Appointment report API with status breakdown
- [ ] Appointment report page with trends and top doctors
- [ ] Hospital-wise income API with per-hospital breakdown
- [ ] Hospital-wise income page with comparison table
- [ ] Reports hub page linking to all 4 report types
- [ ] Sidebar entries for Income and Reports group
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase H — Admin Profile + Charges
- [ ] Admin profile API (GET/PUT)
- [ ] Admin profile page with avatar upload
- [ ] AdminConfig model added to Prisma schema
- [ ] Charges API (GET/PUT)
- [ ] Charges configuration page
- [ ] Settings migrated from filesystem JSON to database
- [ ] Sidebar entries for Profile and Admin Charges
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

---

## 8. Feature Coverage Summary

| Metric | Before | After All Phases |
|--------|--------|-------------------|
| Pages | 8 | ~26 |
| API Routes | 11 | ~23 |
| Sidebar Entries | 9 | ~17 |
| Feature Coverage | ~31% | ~95% |

### New Pages (18)
`doctors/[id]`, `doctors/[id]/edit`, `hospitals/add`, `hospitals/[id]`, `hospitals/[id]/edit`, `income`, `reports`, `reports/users`, `reports/appointments`, `reports/income`, `reports/income-hospital`, `sliders`, `doctor-types`, `disease-types`, `profile`, `charges`

### New APIs (12+)
`appointments/[id]/status` PUT, `doctors/[id]` PUT, `hospitals` POST, `hospitals/[id]` PUT/DELETE/PATCH, `income` GET, `reports/*` GET (4 endpoints), `sliders` GET/POST/PUT/DELETE, `doctor-types` GET/POST/PUT/DELETE, `disease-types` GET/POST/PUT/DELETE, `charges` GET/PUT, `profile` GET/PUT

### New Sidebar Entries (8)
Income, Reports (group with 4 sub-items), Sliders, Masters (group with 2 sub-items), Admin Charges, Profile
