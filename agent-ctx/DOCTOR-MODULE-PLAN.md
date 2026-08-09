# Doctor Module — Comprehensive Development Plan (Updated)

> **Last Updated:** Research phase complete — all existing code audited, PHP reference analyzed, gaps identified.

---

## 1. Current Status

### Already Built ✅ (Phase 0 — Previous Sprint)

| # | Page | File | Lines | Status |
|---|------|------|-------|--------|
| 1 | Dashboard | `src/app/dashboard/doctor/page.tsx` | ~350 | ✅ Built (missing emergency toggle, hospital card) |
| 2 | Appointments | `src/app/dashboard/doctor/appointments/page.tsx` | ~600 | ✅ Built (missing detail page, extend action, history search) |
| 3 | Patients | `src/app/dashboard/doctor/patients/page.tsx` | ~200 | ✅ Built |
| 4 | Prescription | `src/app/dashboard/doctor/prescription/page.tsx` | ~500 | ✅ Built (missing C/O section, next visit date, print settings) |
| 5 | Prescription Edit | `src/app/dashboard/doctor/prescription/[id]/page.tsx` | ~700 | ✅ Built (missing nextVisit, status update to Visited) |
| 6 | Gallery | `src/app/dashboard/doctor/gallery/page.tsx` | ~250 | ✅ Built (URL-only, no file upload) |
| 7 | Blog | `src/app/dashboard/doctor/blog/page.tsx` | ~300 | ✅ Built (no image upload, no video link) |
| 8 | Blog Edit | `src/app/dashboard/doctor/blog/[id]/page.tsx` | ~400 | ✅ Built |
| 9 | Profile | `src/app/dashboard/doctor/profile/page.tsx` | ~350 | ✅ Built (no photo upload, no doctor type dropdown, no state/city cascade) |
| 10 | Change Password | `src/app/dashboard/doctor/change-password/page.tsx` | ~150 | ✅ Built |
| 11 | Schedule | `src/app/dashboard/doctor/schedule/page.tsx` | ~200 | ✅ Built |
| 12 | Holidays | `src/app/dashboard/doctor/holidays/page.tsx` | ~180 | ✅ Built |
| 13 | Settings | `src/app/dashboard/doctor/settings/page.tsx` | ~200 | ✅ Built |
| 14 | Medicine Master | `src/app/dashboard/doctor/medicine/page.tsx` | ~300 | ✅ Built |

### API Routes Built ✅

| # | Endpoint | Methods | Auth | Description |
|---|----------|---------|------|-------------|
| 1 | `/api/dashboard/doctor/stats` | GET | `requireRole('doctor')` | Dashboard stats — **may have syntax issue (BUG-1)** |
| 2 | `/api/dashboard/doctor/patients` | GET | `requireRole('doctor')` | Patient list with search |
| 3 | `/api/dashboard/doctor/appointments` | GET, POST, PATCH | `requireRole('doctor')` | CRUD + status filter + date range |
| 4 | `/api/dashboard/doctor/prescriptions` | GET, POST, PUT, DELETE | `requireRole('doctor')` | Prescription CRUD |
| 5 | `/api/dashboard/doctor/gallery` | GET, POST, PUT, DELETE | `requireRole('doctor')` | Gallery CRUD (URL-only — **BUG-4**) |
| 6 | `/api/dashboard/doctor/blogs` | GET, POST, PUT, DELETE | `requireRole('doctor')` | Blog CRUD |
| 7 | `/api/dashboard/doctor/medicines` | GET, POST, PUT, DELETE | `requireRole('doctor')` | Medicine master CRUD |
| 8 | `/api/dashboard/doctor/schedule` | GET | `requireRole('doctor')` | Doctor schedule read |
| 9 | `/api/dashboard/doctor/schedule/[id]` | PUT, DELETE | `requireRole('doctor')` | Schedule update/delete |
| 10 | `/api/dashboard/doctor/holidays` | GET, POST, DELETE | `requireRole('doctor')` | Holiday CRUD |
| 11 | `/api/dashboard/doctor/settings` | GET, PUT | `requireRole('doctor')` | Doctor settings |
| 12 | `/api/doctor/profile` | GET, PUT | `requireRole('doctor')` | Profile CRUD |
| 13 | `/api/doctor/appointments/[id]` | GET | `requireRole('doctor')` | Single appointment fetch |
| 14 | `/api/doctor/prescriptions/[id]` | GET, PUT, DELETE | `requireRole('doctor')` | Single prescription CRUD |
| 15 | `/api/doctor/gallery/[id]` | GET, PUT, DELETE | `requireRole('doctor')` | Single gallery item CRUD |
| 16 | `/api/doctor/blogs/[id]` | GET, PUT, DELETE | `requireRole('doctor')` | Single blog CRUD |
| 17 | `/api/doctor/medicines/[id]` | GET, PUT, DELETE | `requireRole('doctor')` | Single medicine CRUD |
| 18 | `/api/doctor/blogs/[id]/toggle-status` | PATCH | `requireRole('doctor')` | Blog publish/unpublish toggle |

### Sidebar Entries (Current — 11 items)
Dashboard, Appointments, Patients, Prescription, Gallery, Blog, Schedule, Holidays, Medicine, Settings, Profile, Change Password

### Sidebar Entries (Required — 20 items)
Dashboard, Appointments, **Appointment History**, **Notifications**, Patients, Prescription, **Prescription Settings** (treeview: C/O Categories, Questions, Suggestions, Labels, Table Master, Print Settings), Gallery, Blog, Schedule, Holidays, Medicine, **Assistant**, **Receptionist**, **Pharmacist**, **Reports**, Settings, Profile, Change Password

---

## 2. Design Standards

- **Color**: Teal primary (`teal-500/600`), Amber for warnings, Emerald for success, Violet for pending, Red for errors/canceled
- **Components**: shadcn/ui (New York style) + Lucide icons + Framer Motion
- **Data**: TanStack Query (`useQuery`/`useMutation`/`useQueryClient`) for all data fetching
- **Toast**: `sonner` library
- **Auth**: `requireRole(req, 'doctor')` for all doctor API routes
- **Layout**: Responsive mobile-first with breakpoints sm/md/lg/xl
- **Loading**: Skeleton components with `animate-pulse`
- **Empty states**: Icon + message pattern
- **Status colors**: Pending=amber, Approve=emerald, Visited=teal, Canceled=red, Finish=blue, Extend=violet
- **Currency**: ₹ (INR) with `toLocaleString('en-IN')`
- **File uploads**: Accept images via `<input type="file">` → server upload to `/public/uploads/` or cloud storage, return URL

---

## 3. Identified Issues (Bugs)

### 🔴 Critical

| # | Bug | File | Description |
|---|-----|------|-------------|
| BUG-1 | Stats API syntax issue | `src/app/api/dashboard/doctor/stats/route.ts` | May have unclosed braces or syntax error — verify and fix |
| BUG-2 | Header bell empty for doctor | `src/components/dashboard/dashboard-header.tsx` | Bell dropdown only loads notifications for `patient` role — `if (role !== 'patient') return` blocks doctor role |
| BUG-3 | "View all notifications" 404 | Header bell dropdown link | Links to `/dashboard/doctor/notifications` which does not exist |
| BUG-4 | Gallery URL-only upload | `src/app/dashboard/doctor/gallery/page.tsx` | Gallery form only accepts image URL string — no file upload input |
| BUG-5 | Prescription doesn't update booking status | `src/app/api/dashboard/doctor/prescriptions/route.ts` | When prescription is created, the linked Booking status should auto-update to `Visited` — currently not happening |
| BUG-6 | No Extend action | `src/app/dashboard/doctor/appointments/page.tsx` | Only Approve/Reject/Visited actions available — missing Extend status action for Pending appointments |
| BUG-7 | No appointment detail page | — | No route at `appointments/[id]` — clicking appointment has nowhere to navigate for full detail view |
| BUG-8 | No appointment history search | `src/app/dashboard/doctor/appointments/page.tsx` | Appointments page has no search-by-patient, no history browsing beyond date filter |

### 🟡 Medium

| # | Bug | File | Description |
|---|-----|------|-------------|
| BUG-9 | Blog no image upload | `src/app/dashboard/doctor/blog/[id]/page.tsx` | Blog form lacks image upload — only text content + optional URL field |
| BUG-10 | Blog no video link | `src/app/dashboard/doctor/blog/[id]/page.tsx` | Video link field missing from blog form |
| BUG-11 | Profile no photo upload | `src/app/dashboard/doctor/profile/page.tsx` | Doctor profile photo cannot be uploaded — only displays existing avatar |
| BUG-12 | Prescription missing nextVisit | `src/app/dashboard/doctor/prescription/[id]/page.tsx` | No next visit date field on prescription form — Prisma model also missing this field |
| BUG-13 | Profile no doctor type dropdown | `src/app/dashboard/doctor/profile/page.tsx` | Doctor type is a text input instead of dropdown from `DoctorTypeMaster` table |
| BUG-14 | Profile no state/city cascade | `src/app/dashboard/doctor/profile/page.tsx` | State and city are free-text — should cascade from master data |
| BUG-15 | No notification on status change | Various API routes | When appointment status changes (Approve, Visited, etc.), no notification is created for the patient |

### 🟢 Low

| # | Bug | File | Description |
|---|-----|------|-------------|
| BUG-16 | No emergency toggle on dashboard | `src/app/dashboard/doctor/page.tsx` | Dashboard has no emergency mode toggle |
| BUG-17 | Prescription print missing C/O | Prescription print template | Print template does not include Chief Complaints section |

---

## 4. Gap Analysis vs Original PHP Doctorooms

### 🔴 HIGH PRIORITY — Pages Completely Missing

| # | Page | Route | Description |
|---|------|-------|-------------|
| GAP-1 | **Notification List** | `/dashboard/doctor/notifications` | Full notification center with mark-read, delete, filter by read/unread |
| GAP-2 | **Appointment Detail** | `/dashboard/doctor/appointments/[id]` | Full appointment view with patient info, prescription history, status timeline |
| GAP-3 | **Appointment History** | `/dashboard/doctor/appointments/history` | Searchable appointment history with patient name, date range, status filters |
| GAP-4 | **Assistant Management** | `/dashboard/doctor/assistant` | CRUD for assistant staff (create, edit, toggle active, delete) |
| GAP-5 | **Receptionist Management** | `/dashboard/doctor/receptionist` | CRUD for receptionist staff (create, edit, toggle active, delete) |
| GAP-6 | **Pharmacist Management** | `/dashboard/doctor/pharmacist` | CRUD for pharmacist staff (create, edit, toggle active, delete) |
| GAP-7 | **C/O Categories** | `/dashboard/doctor/prescription-settings/co-categories` | Chief Complaints category master management |
| GAP-8 | **Questions Master** | `/dashboard/doctor/prescription-settings/questions` | Prescription questions master management |
| GAP-9 | **Suggestions Master** | `/dashboard/doctor/prescription-settings/suggestions` | Prescription suggestions master management |
| GAP-10 | **Labels Master** | `/dashboard/doctor/prescription-settings/labels` | Prescription labels master management |
| GAP-11 | **Table Master** | `/dashboard/doctor/prescription-settings/table-master` | Prescription table layout master management |
| GAP-12 | **Print Settings** | `/dashboard/doctor/prescription-settings/print-settings` | Prescription print configuration (header, footer, layout, C/O toggle) |
| GAP-13 | **Reports Page** | `/dashboard/doctor/reports` | Daily/weekly/monthly reports with stats cards, charts, export |

### 🟡 MEDIUM PRIORITY — Features Missing from Existing Pages

| # | Feature | Current Gap |
|---|---------|-------------|
| GAP-14 | **Notification on status change** | No notification created when doctor changes appointment status |
| GAP-15 | **Extend status action** | Missing Extend button on Pending appointments |
| GAP-16 | **Appointment detail prescription section** | No prescription history shown in appointment detail |
| GAP-17 | **Rich blog with image upload** | Blog only has text — needs image upload + video link fields |
| GAP-18 | **Gallery file upload** | Gallery only accepts URL — needs file drag-and-drop upload |
| GAP-19 | **Profile photo upload** | Doctor cannot upload/change profile photo |
| GAP-20 | **Next visit date on prescriptions** | Prescription form missing nextVisit field |
| GAP-21 | **Doctor type dropdown** | Profile doctor type is free text instead of dropdown |
| GAP-22 | **State/City cascading dropdowns** | Profile location is free text instead of cascading selects |
| GAP-23 | **Prescription print settings** | No print configuration UI |
| GAP-24 | **C/O section in prescription print** | Print template omits Chief Complaints |
| GAP-25 | **Emergency toggle on dashboard** | Dashboard has no emergency mode indicator |

### 🟢 LOW PRIORITY — Nice-to-Have

| # | Feature | Current Gap |
|---|---------|-------------|
| GAP-26 | Appointment auto-refresh | No `refetchInterval` on appointments query |
| GAP-27 | Prescription print preview | No preview before printing |
| GAP-28 | Blog SEO permalink auto-generation | Slug generation from title |
| GAP-29 | Gallery drag-and-drop reorder | No drag reorder capability |

### ➕ Prisma Models Available but No UI

| # | Model | Purpose | Status |
|---|-------|---------|--------|
| M-1 | `CoMaster` | Chief Complaints categories | ❌ No page |
| M-2 | `QuestionsMaster` | Prescription questions bank | ❌ No page |
| M-3 | `SuggestionsMaster` | Prescription suggestions bank | ❌ No page |
| M-4 | `LabelMaster` | Prescription labels | ❌ No page |
| M-5 | `PDignoTable` | Prescription diagnosis table | ❌ No page |
| M-6 | `POtherSetting` | Prescription other settings | ❌ No page |
| M-7 | `DoctorTypeMaster` | Doctor type reference | ❌ Not used in dropdown |
| M-8 | `DiseaseMaster` | Disease reference list | ❌ Not used in dropdown |

### ➕ Prisma Schema Additions Needed

| # | Model | Field to Add | Type | Purpose |
|---|-------|-------------|------|---------|
| S-1 | `Prescription` | `status` | `String @default("active")` | Active/archived/deleted status |
| S-2 | `Prescription` | `nextVisit` | `DateTime?` | Next visit date for patient |
| S-3 | `Prescription` | `chiefComplaints` | `String?` | C/O text for prescription |

---

## 5. Development Phases

### Phase A — Bug Fixes (Critical)
> Fix existing bugs before adding new features. No new pages — stabilize what's built.

- [**A1**](./6-A-Doctor-Bug-Fixes-Agent.md) — Verify and fix stats API syntax issue (BUG-1)
- [**A2**](./6-A-Doctor-Bug-Fixes-Agent.md) — Fix header bell to load notifications for doctor role (BUG-2)
- [**A3**](./6-A-Doctor-Bug-Fixes-Agent.md) — Fix "View all notifications" link 404 by creating redirect/fallback (BUG-3)
- [**A4**](./6-A-Doctor-Bug-Fixes-Agent.md) — Convert gallery upload from URL-only to file-based upload (BUG-4)
- [**A5**](./6-A-Doctor-Bug-Fixes-Agent.md) — Auto-update booking status to Visited when prescription is created (BUG-5)

### Phase B — Notifications (Page + API)
> Build the full notification system for the doctor module.

- [**B1**](./6-B-Doctor-Notifications-Agent.md) — Create notifications API route (`GET /api/doctor/notifications`, `PATCH /api/doctor/notifications/[id]`, `DELETE /api/doctor/notifications/[id]`)
- [**B2**](./6-B-Doctor-Notifications-Agent.md) — Create notification list page (`/dashboard/doctor/notifications`) with mark-read, delete, filter by read/unread
- [**B3**](./6-B-Doctor-Notifications-Agent.md) — Create notification on appointment status change (Approve, Visited, Extend, Cancel)
- [**B4**](./6-B-Doctor-Notifications-Agent.md) — Add sidebar entry + header route title for Notifications
- [**B5**](./6-B-Doctor-Notifications-Agent.md) — Fix "View all notifications" link to point to new page

### Phase C — Appointment Enhancements
> Add detail page, history search, extend action, and notification triggers.

- [**C1**](./6-C-Doctor-Appointments-Agent.md) — Create appointment detail page (`/dashboard/doctor/appointments/[id]`) with patient info, status timeline, prescription history
- [**C2**](./6-C-Doctor-Appointments-Agent.md) — Create appointment history page (`/dashboard/doctor/appointments/history`) with search by patient name, date range, status filters, pagination
- [**C3**](./6-C-Doctor-Appointments-Agent.md) — Add Extend action button on Pending appointments (status change to Extend)
- [**C4**](./6-C-Doctor-Appointments-Agent.md) — Add generic status update API (`PATCH /api/doctor/appointments/[id]/status`)
- [**C5**](./6-C-Doctor-Appointments-Agent.md) — Add sidebar entries for Appointment History
- [**C6**](./6-C-Doctor-Appointments-Agent.md) — Wire appointment detail link from appointments list page

### Phase D — Staff Management (Assistant, Receptionist, Pharmacist)
> CRUD pages for managing doctor's support staff.

- [**D1**](./6-D-Doctor-Staff-Management-Agent.md) — Create staff management API routes (`GET/POST/PUT/DELETE /api/doctor/staff/assistant`, `/api/doctor/staff/receptionist`, `/api/doctor/staff/pharmacist`)
- [**D2**](./6-D-Doctor-Staff-Management-Agent.md) — Create Assistant management page (`/dashboard/doctor/assistant`) with create dialog, edit dialog, toggle active, delete
- [**D3**](./6-D-Doctor-Staff-Management-Agent.md) — Create Receptionist management page (`/dashboard/doctor/receptionist`) with same CRUD pattern
- [**D4**](./6-D-Doctor-Staff-Management-Agent.md) — Create Pharmacist management page (`/dashboard/doctor/pharmacist`) with same CRUD pattern
- [**D5**](./6-D-Doctor-Staff-Management-Agent.md) — Add sidebar entries + header route titles for all three staff pages
- [**D6**](./6-D-Doctor-Staff-Management-Agent.md) — Consistent empty state, loading skeleton, and optimistic delete pattern across all three pages

### Phase E — Prescription Settings (6 Sub-Pages)
> Build the Prescription Settings treeview section with 6 sub-pages backed by existing Prisma models.

- [**E1**](./6-E-Doctor-Prescription-Settings-Agent.md) — Create Prescription Settings API routes for all 6 masters (CoMaster, QuestionsMaster, SuggestionsMaster, LabelMaster, PDignoTable, POtherSetting)
- [**E2**](./6-E-Doctor-Prescription-Settings-Agent.md) — Create C/O Categories page (`/dashboard/doctor/prescription-settings/co-categories`) — CRUD for `CoMaster`
- [**E3**](./6-E-Doctor-Prescription-Settings-Agent.md) — Create Questions Master page (`/dashboard/doctor/prescription-settings/questions`) — CRUD for `QuestionsMaster`
- [**E4**](./6-E-Doctor-Prescription-Settings-Agent.md) — Create Suggestions Master page (`/dashboard/doctor/prescription-settings/suggestions`) — CRUD for `SuggestionsMaster`
- [**E5**](./6-E-Doctor-Prescription-Settings-Agent.md) — Create Labels Master page (`/dashboard/doctor/prescription-settings/labels`) — CRUD for `LabelMaster`
- [**E6**](./6-E-Doctor-Prescription-Settings-Agent.md) — Create Table Master page (`/dashboard/doctor/prescription-settings/table-master`) — CRUD for `PDignoTable`
- [**E7**](./6-E-Doctor-Prescription-Settings-Agent.md) — Create Print Settings page (`/dashboard/doctor/prescription-settings/print-settings`) — Configure header, footer, layout, C/O toggle in print, store in `POtherSetting`
- [**E8**](./6-E-Doctor-Prescription-Settings-Agent.md) — Add Prescription Settings treeview sidebar entry with 6 sub-items
- [**E9**](./6-E-Doctor-Prescription-Settings-Agent.md) — Add header route titles for all 6 sub-pages

### Phase F — Profile & Blog Enhancements
> Add missing upload features and enrich existing pages.

- [**F1**](./6-F-Doctor-Profile-Blog-Agent.md) — Add profile photo upload to profile page (file input → upload API → update avatar URL)
- [**F2**](./6-F-Doctor-Profile-Blog-Agent.md) — Convert gallery from URL-only to file-based upload with drag-and-drop
- [**F3**](./6-F-Doctor-Profile-Blog-Agent.md) — Add image upload field to blog create/edit form
- [**F4**](./6-F-Doctor-Profile-Blog-Agent.md) — Add video link field to blog create/edit form
- [**F5**](./6-F-Doctor-Profile-Blog-Agent.md) — Create file upload API endpoint (`POST /api/doctor/upload`) supporting images

### Phase G — Reports & Dashboard
> Build reports page and enhance dashboard with missing features.

- [**G1**](./6-G-Doctor-Reports-Dashboard-Agent.md) — Create Reports page (`/dashboard/doctor/reports`) with date range picker, summary stat cards, appointment breakdown table, daily/weekly/monthly toggle
- [**G2**](./6-G-Doctor-Reports-Dashboard-Agent.md) — Create Reports API route (`GET /api/doctor/reports`) with aggregation queries
- [**G3**](./6-G-Doctor-Reports-Dashboard-Agent.md) — Add emergency toggle to dashboard (visual indicator + persists to `POtherSetting`)
- [**G4**](./6-G-Doctor-Reports-Dashboard-Agent.md) — Add auto-refresh to dashboard stats (30s refetchInterval)
- [**G5**](./6-G-Doctor-Reports-Dashboard-Agent.md) — Add sidebar entry + header route title for Reports

### Phase H — Polish (Dropdowns, Next Visit, Print)
> Final polish pass: cascading dropdowns, prescription enhancements, print improvements.

- [**H1**](./6-H-Doctor-Polish-Agent.md) — Replace doctor type text input with dropdown from `DoctorTypeMaster` table
- [**H2**](./6-H-Doctor-Polish-Agent.md) — Replace state/city free text with cascading dropdown selects on profile page
- [**H3**](./6-H-Doctor-Polish-Agent.md) — Add `nextVisit` date field to prescription form (add Prisma field `nextVisit DateTime?`)
- [**H4**](./6-H-Doctor-Polish-Agent.md) — Add `status` and `chiefComplaints` fields to Prescription Prisma model
- [**H5**](./6-H-Doctor-Polish-Agent.md) — Include C/O section in prescription print template
- [**H6**](./6-H-Doctor-Polish-Agent.md) — Add prescription print preview before printing
- [**H7**](./6-H-Doctor-Polish-Agent.md) — Use `DiseaseMaster` dropdown in appointment/prescription disease field
- [**H8**](./6-H-Doctor-Polish-Agent.md) — Add appointment auto-refresh (10s refetchInterval)

---

## 6. Prisma Schema — Relevant Models

```prisma
// Doctor — main entity
model Doctor {
  id          String   @id @default(cuid())
  userId      String   @unique  // → User table
  name        String
  email       String
  phone       String?
  gender      String?
  dob         DateTime?
  bloodGroup  String?
  address     String?
  state       String?
  city        String?
  degree      String?
  specialization String?
  doctorType  String?           // → DoctorTypeMaster reference
  clinicName  String?
  clinicAddress String?
  appointmentCharge Int        @default(0)
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id])
}

// Booking — appointment records
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
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  doctor           Doctor   @relation(fields: [doctorId], references: [id])
}

// Prescription — **needs new fields: status, nextVisit, chiefComplaints**
model Prescription {
  id               String   @id @default(cuid())
  doctorId         String
  bookingId        String
  patientName      String
  disease          String?
  bp               String?
  pulse            String?
  temperature      String?
  weight           String?
  height           String?
  medicineJson     String?  // JSON array of medicines
  advice           String?
  note             String?
  followUpDate     DateTime?
  status           String?  @default("active")  // ← TO ADD
  nextVisit        DateTime?                     // ← TO ADD
  chiefComplaints  String?                       // ← TO ADD
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  doctor           Doctor   @relation(fields: [doctorId], references: [id])
  booking          Booking  @relation(fields: [bookingId], references: [id])
}

// Notification
model Notification {
  id        String   @id @default(cuid())
  userId    String
  title     String
  message   String
  type      String?  // appointment, prescription, system
  status    String   // UNREAD, READ
  createdAt DateTime @default(now())
}

// C/O Master — Chief Complaints categories
model CoMaster {
  id        String   @id @default(cuid())
  doctorId  String
  name      String
  status    String   @default("active")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Questions Master
model QuestionsMaster {
  id        String   @id @default(cuid())
  doctorId  String
  question  String
  status    String   @default("active")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Suggestions Master
model SuggestionsMaster {
  id          String   @id @default(cuid())
  doctorId    String
  suggestion  String
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Label Master
model LabelMaster {
  id        String   @id @default(cuid())
  doctorId  String
  name      String
  status    String   @default("active")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Prescription Diagnosis Table
model PDignoTable {
  id          String   @id @default(cuid())
  doctorId    String
  name        String
  description String?
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Prescription Other Settings (print config)
model POtherSetting {
  id          String   @id @default(cuid())
  doctorId    String
  key         String
  value       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Doctor Type Master
model DoctorTypeMaster {
  id        String   @id @default(cuid())
  name      String   @unique
  status    String   @default("active")
  createdAt DateTime @default(now())
}

// Disease Master
model DiseaseMaster {
  id        String   @id @default(cuid())
  name      String
  status    String   @default("active")
  createdAt DateTime @default(now())
}

// Gallery
model Gallery {
  id        String   @id @default(cuid())
  doctorId  String
  title     String
  imageUrl  String
  status    String   @default("active")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Blog
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

// Medicine
model Medicine {
  id            String   @id @default(cuid())
  doctorId      String
  name          String
  morningDose   String?
  afternoonDose String?
  eveningDose   String?
  dosage        String?
  tabCount      Int?
  description   String?
  status        String   @default("active")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## 7. File Structure Overview (After All Phases)

```
src/app/dashboard/doctor/
├── page.tsx                          ✅ Dashboard (enhanced in G3/G4)
├── appointments/
│   ├── page.tsx                      ✅ Appointments list (enhanced in C3/C4)
│   ├── [id]/
│   │   └── page.tsx                  🆕 C1 — Appointment detail
│   └── history/
│       └── page.tsx                  🆕 C2 — Appointment history search
├── notifications/
│   └── page.tsx                      🆕 B2 — Notification list
├── patients/
│   └── page.tsx                      ✅ Patients
├── prescription/
│   ├── page.tsx                      ✅ Prescription list (enhanced in H3/H5)
│   └── [id]/
│       └── page.tsx                  ✅ Prescription edit (enhanced in H3/H4)
├── prescription-settings/
│   ├── co-categories/
│   │   └── page.tsx                  🆕 E2 — C/O Categories
│   ├── questions/
│   │   └── page.tsx                  🆕 E3 — Questions Master
│   ├── suggestions/
│   │   └── page.tsx                  🆕 E4 — Suggestions Master
│   ├── labels/
│   │   └── page.tsx                  🆕 E5 — Labels Master
│   ├── table-master/
│   │   └── page.tsx                  🆕 E6 — Table Master
│   └── print-settings/
│       └── page.tsx                  🆕 E7 — Print Settings
├── gallery/
│   └── page.tsx                      ✅ Gallery (enhanced in F2)
├── blog/
│   ├── page.tsx                      ✅ Blog list (enhanced in F3/F4)
│   └── [id]/
│       └── page.tsx                  ✅ Blog edit (enhanced in F3/F4)
├── schedule/
│   └── page.tsx                      ✅ Schedule
├── holidays/
│   └── page.tsx                      ✅ Holidays
├── medicine/
│   └── page.tsx                      ✅ Medicine Master
├── assistant/
│   └── page.tsx                      🆕 D2 — Assistant management
├── receptionist/
│   └── page.tsx                      🆕 D3 — Receptionist management
├── pharmacist/
│   └── page.tsx                      🆕 D4 — Pharmacist management
├── reports/
│   └── page.tsx                      🆕 G1 — Reports
├── settings/
│   └── page.tsx                      ✅ Settings
├── profile/
│   └── page.tsx                      ✅ Profile (enhanced in F1/H1/H2)
└── change-password/
    └── page.tsx                      ✅ Change Password
```

**API Routes (New):**
```
src/app/api/doctor/
├── notifications/
│   ├── route.ts                      🆕 B1 — GET (list), DELETE (bulk)
│   └── [id]/
│       └── route.ts                  🆕 B1 — PATCH (mark read), DELETE
├── appointments/
│   └── [id]/
│       └── status/
│           └── route.ts              🆕 C4 — PATCH (generic status update)
├── staff/
│   ├── assistant/
│   │   ├── route.ts                  🆕 D1 — GET (list), POST (create)
│   │   └── [id]/
│   │       └── route.ts              🆕 D1 — PUT (update), DELETE
│   ├── receptionist/
│   │   ├── route.ts                  🆕 D1 — GET (list), POST (create)
│   │   └── [id]/
│   │       └── route.ts              🆕 D1 — PUT (update), DELETE
│   └── pharmacist/
│       ├── route.ts                  🆕 D1 — GET (list), POST (create)
│       └── [id]/
│           └── route.ts              🆕 D1 — PUT (update), DELETE
├── prescription-settings/
│   ├── co-categories/
│   │   ├── route.ts                  🆕 E1 — GET, POST
│   │   └── [id]/
│   │       └── route.ts              🆕 E1 — PUT, DELETE
│   ├── questions/
│   │   ├── route.ts                  🆕 E1 — GET, POST
│   │   └── [id]/
│   │       └── route.ts              🆕 E1 — PUT, DELETE
│   ├── suggestions/
│   │   ├── route.ts                  🆕 E1 — GET, POST
│   │   └── [id]/
│   │       └── route.ts              🆕 E1 — PUT, DELETE
│   ├── labels/
│   │   ├── route.ts                  🆕 E1 — GET, POST
│   │   └── [id]/
│   │       └── route.ts              🆕 E1 — PUT, DELETE
│   ├── table-master/
│   │   ├── route.ts                  🆕 E1 — GET, POST
│   │   └── [id]/
│   │       └── route.ts              🆕 E1 — PUT, DELETE
│   └── print-settings/
│       └── route.ts                  🆕 E1 — GET, PUT
├── reports/
│   └── route.ts                      🆕 G2 — GET (aggregated stats)
└── upload/
    └── route.ts                      🆕 F5 — POST (file upload)
```

---

## 8. Completion Checklist

### Phase A — Bug Fixes
- [ ] BUG-1: Stats API syntax verified and fixed
- [ ] BUG-2: Header bell loads notifications for doctor role
- [ ] BUG-3: "View all notifications" link points to valid page (redirect pending until B2)
- [ ] BUG-4: Gallery supports file-based upload (drag-and-drop)
- [ ] BUG-5: Prescription creation auto-updates booking status to Visited
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase B — Notifications
- [ ] Notifications API routes (GET, PATCH, DELETE)
- [ ] Notifications list page with filters and actions
- [ ] Notification created on appointment status change
- [ ] Sidebar entry + header route title added
- [ ] "View all notifications" link fixed
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase C — Appointment Enhancements
- [ ] Appointment detail page (`/appointments/[id]`) with patient info + prescription section
- [ ] Appointment history page with search, date range, status filter
- [ ] Extend action button on Pending appointments
- [ ] Generic status update API endpoint
- [ ] Sidebar entry for Appointment History
- [ ] Appointment list links to detail page
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase D — Staff Management
- [ ] Staff API routes (assistant, receptionist, pharmacist — full CRUD)
- [ ] Assistant management page with create/edit/toggle/delete
- [ ] Receptionist management page with create/edit/toggle/delete
- [ ] Pharmacist management page with create/edit/toggle/delete
- [ ] Sidebar entries + header route titles for all three
- [ ] Consistent empty states, loading skeletons, optimistic deletes
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase E — Prescription Settings
- [ ] Prescription Settings API routes (6 masters + print settings)
- [ ] C/O Categories page with CRUD
- [ ] Questions Master page with CRUD
- [ ] Suggestions Master page with CRUD
- [ ] Labels Master page with CRUD
- [ ] Table Master page with CRUD
- [ ] Print Settings page with configuration UI
- [ ] Prescription Settings treeview in sidebar with 6 sub-items
- [ ] Header route titles for all 6 sub-pages
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase F — Profile & Blog Enhancements
- [ ] Profile photo upload works end-to-end
- [ ] Gallery file upload replaces URL input
- [ ] Blog form has image upload field
- [ ] Blog form has video link field
- [ ] File upload API endpoint created
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase G — Reports & Dashboard
- [ ] Reports page with date picker, stats cards, table, period toggle
- [ ] Reports API with aggregation queries
- [ ] Emergency toggle on dashboard
- [ ] Dashboard auto-refresh (30s)
- [ ] Sidebar entry + header route title for Reports
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase H — Polish
- [ ] Doctor type dropdown from DoctorTypeMaster
- [ ] State/City cascading dropdowns on profile
- [ ] Next visit date field on prescription form
- [ ] Prescription Prisma model updated (status, nextVisit, chiefComplaints)
- [ ] C/O section included in prescription print
- [ ] Prescription print preview before printing
- [ ] DiseaseMaster dropdown in disease fields
- [ ] Appointment auto-refresh (10s)
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

---

## 9. Total Scope Summary

| Category | Count |
|----------|-------|
| Existing pages | 14 |
| New pages to build | 13 (notifications, appointment detail, history, assistant, receptionist, pharmacist, 6 prescription settings, reports) |
| Existing APIs | 18 |
| New APIs to build | ~22 (notifications, status, 3 staff × 4, 6 prescription settings × 4, print settings × 2, reports, upload) |
| Prisma schema additions | 3 fields (Prescription.status, Prescription.nextVisit, Prescription.chiefComplaints) |
| Sidebar entries to add | 9 (history, notifications, assistant, receptionist, pharmacist, reports, prescription settings treeview + 6 sub-items counted as 1) |
| Critical bugs to fix | 8 |
| Medium bugs to fix | 7 |
| Low bugs to fix | 2 |
| **Total phases** | **8 (A through H)** |
| **Estimated new files** | **~45 page + API files** |
