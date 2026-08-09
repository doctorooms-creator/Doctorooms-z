# Assistant & Pharmacist Modules — Comprehensive Development Plan

> **Last Updated:** Research phase complete — all existing code audited, PHP reference analyzed, gaps identified.

---

## 1. Current Status

### ASSISTANT MODULE

#### Already Built ✅ (Phase 0 — Previous Sprint)

| # | Page | File | Lines | Status |
|---|------|------|-------|--------|
| 1 | Dashboard | `src/app/dashboard/assistant/page.tsx` | 267 | ✅ Built |
| 2 | Appointments | `src/app/dashboard/assistant/appointments/page.tsx` | 333 | ✅ Built (no detail view, no prescription link) |
| 3 | Patients | `src/app/dashboard/assistant/patients/page.tsx` | 183 | ✅ Built (read-only list) |

#### API Routes Built ✅

| # | Endpoint | Methods | Auth | Description |
|---|----------|---------|------|-------------|
| 1 | `/api/dashboard/assistant/stats` | GET | `requireRole('assistant')` | Dashboard stats + today's list |
| 2 | `/api/dashboard/assistant/appointments` | GET | `requireRole('assistant')` | Appointment list with search + status filter |
| 3 | `/api/dashboard/assistant/patients` | GET | `requireRole('assistant')` | Patient list with search |

#### Sidebar Entries (4 items)
Dashboard, Appointments, Patients, Change Password

#### PHP Coverage: ~15%
**Biggest Gap:** Entire prescription system missing (6-step Ajax wizard with CO categories, labels, diagnostic tables, medicines, suggestions, finalize)

---

### PHARMACIST MODULE

#### Already Built ✅ (Phase 0 — Previous Sprint)

| # | Page | File | Lines | Status |
|---|------|------|-------|--------|
| 1 | Dashboard | `src/app/dashboard/pharmacist/page.tsx` | 239 | ✅ Built |
| 2 | Prescriptions | `src/app/dashboard/pharmacist/prescriptions/page.tsx` | 323 | ✅ Built (list only, no print, no detail) |
| 3 | Medicine List | `src/app/dashboard/pharmacist/medicines/page.tsx` | 488 | ✅ Built |

#### API Routes Built ✅

| # | Endpoint | Methods | Auth | Description |
|---|----------|---------|------|-------------|
| 1 | `/api/dashboard/pharmacist/stats` | GET | `requireRole('pharmacist')` | Dashboard stats + today's list |
| 2 | `/api/dashboard/pharmacist/prescriptions` | GET | `requireRole('pharmacist')` | Prescription list with search |
| 3 | `/api/dashboard/pharmacist/medicines` | GET | `requireRole('pharmacist')` | Medicine master list with CRUD |

#### Sidebar Entries (4 items)
Dashboard, Prescriptions, Medicine List, Change Password

#### PHP Coverage: ~30%
**Biggest Gap:** Print Prescription page entirely missing — THE primary pharmacist feature

---

## 2. Design Standards

- **Color**: Teal primary (`teal-500/600`), Amber for warnings, Emerald for success, Violet for pending, Red for errors/canceled
- **Components**: shadcn/ui (New York style) + Lucide icons + Framer Motion
- **Data**: TanStack Query (`useQuery`/`useMutation`/`useQueryClient`) for all data fetching
- **Toast**: `sonner` library
- **Auth**: `requireRole(req, 'assistant')` or `requireRole(req, 'pharmacist')` for strict, `requireAuth(req) + ASSISTANT_ROLES`/`PHARMACIST_ROLES` for broader
- **Layout**: Responsive mobile-first with breakpoints sm/md/lg/xl
- **Loading**: Skeleton components with `animate-pulse`
- **Empty states**: Icon + message pattern
- **Status colors**: Pending=amber, Approve=emerald, Visited=teal, Canceled=red, Finish=blue, Extend=violet
- **Currency**: ₹ (INR) with `toLocaleString('en-IN')`
- **Print Layout**: 850px fixed-width centered layout for pharmacist print page (matches PHP original)

---

## 3. Identified Issues (Bugs)

### Assistant Module

#### 🔴 Critical

| # | Bug | File | Description |
|---|-----|------|-------------|
| BUG-A1 | No appointment detail page | — | Appointments page has no clickable row / detail view. Cannot view a single appointment or its prescriptions |
| BUG-A2 | No prescription system | — | Assistant cannot create, view, or edit prescriptions at all |

#### 🟡 Medium

| # | Bug | File | Description |
|---|-----|------|-------------|
| BUG-A3 | Header bell empty for assistant | `src/components/dashboard/dashboard-header.tsx` | Bell dropdown only loads for patient role |
| BUG-A4 | No auto-refresh on appointments | `src/app/dashboard/assistant/appointments/page.tsx` | No `refetchInterval` — misses real-time updates |
| BUG-A5 | Dashboard quick action points to appointments | `src/app/dashboard/assistant/page.tsx` | Lines 137-144: two buttons both navigate to appointments, should link to different features |

### Pharmacist Module

#### 🔴 Critical

| # | Bug | File | Description |
|---|-----|------|-------------|
| BUG-P1 | No print prescription page | — | THE core pharmacist feature. In PHP, clicking a prescription goes to a print-optimized 850px layout page |
| BUG-P2 | Prescriptions not filtered to VISITED | `src/app/api/dashboard/pharmacist/prescriptions/route.ts` | Returns ALL prescriptions. PHP only shows prescriptions for bookings with `Visited` status |
| BUG-P3 | No appointment number shown | `src/app/dashboard/pharmacist/prescriptions/page.tsx` | Prescription list missing `appointmentNo` column — essential for pharmacist workflow |
| BUG-P4 | No next visit date shown | `src/app/dashboard/pharmacist/prescriptions/page.tsx` | PHP shows `nextVisit` date on each prescription row |

#### 🟡 Medium

| # | Bug | File | Description |
|---|-----|------|-------------|
| BUG-P5 | Header bell empty for pharmacist | `src/components/dashboard/dashboard-header.tsx` | Bell dropdown only loads for patient role |
| BUG-P6 | No prescription detail API | — | Cannot fetch single prescription with full data (doctor info, labels, suggestions, diagnosis tables) needed for print |

### Both Modules

#### 🔴 Schema Gaps

| # | Gap | Model | Description |
|---|-----|-------|-------------|
| SCH-1 | Missing `status` field | `Prescription` | No status field. PHP has PENDING→VISITED flow. Pharmacist needs to filter by VISITED prescriptions only |
| SCH-2 | Missing `nextVisit` field | `Prescription` | No next visit date. PHP stores this on prescription and displays it in pharmacist's prescription list |

---

## 4. Gap Analysis vs Original PHP Doctorooms

### ASSISTANT MODULE

#### 🔴 HIGH PRIORITY — Core Business Logic Missing

| # | Feature | PHP Original | Current Gap |
|---|---------|-------------|-------------|
| GAP-A1 | **Appointment detail page** | Click appointment → show full details + existing prescriptions + create/edit prescription actions | Only a list page exists. No detail view at all |
| GAP-A2 | **Simple prescription CRUD** | Disease description + medicine list (basic create/edit/view) | Zero prescription functionality exists |
| GAP-A3 | **Ajax Prescription Wizard (6-step)** | 6-step wizard: (1) CO Categories selection → (2) Labels with values → (3) Diagnostic Table (dynamic rows/cols) → (4) Medicines with timing → (5) Suggestions from Questions Master → (6) Finalize/Review | Completely absent. Doctor's current `new/page.tsx` is a simple form, not the 6-step wizard |
| GAP-A4 | **Wizard API: Init** | `POST /prescription-wizard/init` — fetches booking + pre-fills patient data | No wizard init endpoint |
| GAP-A5 | **Wizard API: CO** | `GET /prescription-wizard/co` — returns doctor's CoMaster list for selection | No CO endpoint |
| GAP-A6 | **Wizard API: Labels** | `GET /prescription-wizard/labels` — returns doctor's LabelMaster list | No labels endpoint |
| GAP-A7 | **Wizard API: Medicines** | `GET /doctor/medicines` — returns doctor's medicine master for autocomplete | No medicine autocomplete from doctor's list |
| GAP-A8 | **Wizard API: Suggestions** | `GET /prescription-wizard/suggestions` — returns QuestionsMaster + linked SuggestionsMaster | No suggestions endpoint |

#### 🟡 MEDIUM PRIORITY — Module Features Missing

| # | Feature | PHP Original | Current Gap |
|---|---------|-------------|-------------|
| GAP-A9 | **Profile page** | Full profile view/edit with avatar upload | No profile page exists |
| GAP-A10 | **Notifications page** | List with mark-read, same as receptionist/patient pattern | No notifications page exists |
| GAP-A11 | **Blog management (CRUD)** | Full CRUD with WYSIWYG, image upload, video link, SEO permalink | No blog management. Receptionist already has this pattern built |
| GAP-A12 | **Medicine autocomplete** | When typing medicine name in prescription, shows autocomplete from doctor's `DoctorMedicine` master list | No autocomplete. Doctor's page has a "Quick Add from Master" popover but no inline autocomplete |

#### 🟢 LOW PRIORITY — Nice-to-Have

| # | Feature | PHP Original | Current Gap |
|---|---------|-------------|-------------|
| GAP-A13 | Auto-refresh appointments | 10s AJAX refresh on appointments page | No `refetchInterval` |
| GAP-A14 | Appointment detail → prescription count badge | Show how many prescriptions exist for an appointment | Not in list view |
| GAP-A15 | Prescriptions list in appointment detail | Show all prescriptions for one booking in appointment detail page | Not available |

---

### PHARMACIST MODULE

#### 🔴 HIGH PRIORITY — Core Business Logic Missing

| # | Feature | PHP Original | Current Gap |
|---|---------|-------------|-------------|
| GAP-P1 | **Print Prescription page (850px layout)** | THE primary pharmacist feature. Click prescription → 850px centered print-optimized page with doctor header, patient info, vitals, labels, diagnosis tables, medicines table, suggestions, footer with next visit. `window.print()` to print | Completely missing. Only a list page exists |
| GAP-P2 | **Prescription detail API (full print data)** | `GET /prescriptions/[id]` returns prescription + booking + doctor (full profile: specialization, education, registration, address, city, state, phone, fees, experience, logo) + medicines + labels + suggestions + diagnosis tables + chief complaints + other settings | Only a list API exists. No single-prescription detail endpoint |
| GAP-P3 | **Filter prescriptions to VISITED-only** | PHP: `WHERE prescriptions.status = 'VISITED'` — pharmacist only sees finalized prescriptions | Current API returns ALL prescriptions with no status filter |
| GAP-P4 | **Appointment number in list** | Prescription list shows `appointmentNo` column (e.g. "APT-2025-001") | Not included in current list |
| GAP-P5 | **Next visit date in list** | Prescription list shows `nextVisit` date column | Not included in current list |

#### 🟡 MEDIUM PRIORITY — Module Features Missing

| # | Feature | PHP Original | Current Gap |
|---|---------|-------------|-------------|
| GAP-P6 | **Profile page** | Full profile view/edit with avatar upload, drug license number display | No profile page exists |
| GAP-P7 | **Prescription date filter** | Date range filter on prescription list | Only text search exists |

#### 🟢 LOW PRIORITY — Nice-to-Have

| # | Feature | PHP Original | Current Gap |
|---|---------|-------------|-------------|
| GAP-P8 | Print queue auto-refresh | 15s refresh on prescription list | No `refetchInterval` |
| GAP-P9 | Prescription count badge on sidebar | Show total prescription count on sidebar Prescriptions item | Not implemented |

---

## 5. Development Phases

### Phase A — Schema Migration
> Add `status` and `nextVisit` fields to Prescription model, run `db push`.

- [**A1**](./A-Schema-Migration-Agent.md) — Add `status String @default("PENDING")` to Prescription model (PENDING, VISITED)
- [**A2**](./A-Schema-Migration-Agent.md) — Add `nextVisit DateTime?` to Prescription model
- [**A3**](./A-Schema-Migration-Agent.md) — Run `bun run db:push` to apply migration
- [**A4**](./A-Schema-Migration-Agent.md) — Update doctor prescription create API to accept `nextVisit`
- [**A5**](./A-Schema-Migration-Agent.md) — Update doctor prescription update API to accept `status` and `nextVisit`

### Phase B — Assistant: Appointment Detail + Simple Prescription
> Appointment detail page with prescription display and simple CRUD.

- [**B1**](./B-Assistant-Appointment-Detail-Agent.md) — Appointment detail page (`/dashboard/assistant/appointments/[id]/page.tsx`)
- [**B2**](./B-Assistant-Appointment-Detail-Agent.md) — Appointment detail API (`GET /api/dashboard/assistant/appointments/[id]`)
- [**B3**](./B-Assistant-Appointment-Detail-Agent.md) — Display existing prescriptions for the booking in appointment detail
- [**B4**](./B-Assistant-Appointment-Detail-Agent.md) — Simple prescription create/edit inline (disease + medicines, like doctor's current form)
- [**B5**](./B-Assistant-Appointment-Detail-Agent.md) — Prescription create API (`POST /api/dashboard/assistant/prescriptions`)
- [**B6**](./B-Assistant-Appointment-Detail-Agent.md) — Prescription update API (`PUT /api/dashboard/assistant/prescriptions/[id]`)
- [**B7**](./B-Assistant-Appointment-Detail-Agent.md) — Medicine autocomplete from doctor's `DoctorMedicine` master list

### Phase C — Assistant: Ajax Prescription Wizard (6-Step)
> Full 6-step prescription wizard matching PHP original.

- [**C1**](./C-Assistant-Prescription-Wizard-Agent.md) — Step 1: CO Categories — fetch and display `CoMaster` list, multi-select checkboxes
- [**C2**](./C-Assistant-Prescription-Wizard-Agent.md) — Step 2: Labels — fetch `LabelMaster` list, input fields for each label's value
- [**C3**](./C-Assistant-Prescription-Wizard-Agent.md) — Step 3: Diagnostic Table — dynamic rows/cols table with header/col/footer labels (`PDignoTable`)
- [**C4**](./C-Assistant-Prescription-Wizard-Agent.md) — Step 4: Medicines — medicine builder with autocomplete from `DoctorMedicine`, timing checkboxes (M/A/E), tab count, dose
- [**C5**](./C-Assistant-Prescription-Wizard-Agent.md) — Step 5: Suggestions — fetch `QuestionsMaster` + linked `SuggestionsMaster`, select suggestions per question
- [**C6**](./C-Assistant-Prescription-Wizard-Agent.md) — Step 6: Finalize — review all steps, add patient vitals, doctor notes, next visit date, submit
- [**C7**](./C-Assistant-Prescription-Wizard-Agent.md) — Wizard init API (`GET /api/dashboard/assistant/prescription-wizard/init?bookingId=xxx`)
- [**C8**](./C-Assistant-Prescription-Wizard-Agent.md) — Wizard CO API (`GET /api/dashboard/assistant/prescription-wizard/co`)
- [**C9**](./C-Assistant-Prescription-Wizard-Agent.md) — Wizard labels API (`GET /api/dashboard/assistant/prescription-wizard/labels`)
- [**C10**](./C-Assistant-Prescription-Wizard-Agent.md) — Wizard suggestions API (`GET /api/dashboard/assistant/prescription-wizard/suggestions`)
- [**C11**](./C-Assistant-Prescription-Wizard-Agent.md) — Wizard save API (`POST /api/dashboard/assistant/prescription-wizard/save`) — creates full prescription with all 6 step data
- [**C12**](./C-Assistant-Prescription-Wizard-Agent.md) — Step navigation UI (progress bar, back/next buttons, step validation)

### Phase D — Pharmacist: Print Prescription
> The primary pharmacist feature — 850px print-optimized layout page.

- [**D1**](./D-Pharmacist-Print-Prescription-Agent.md) — Print prescription page (`/dashboard/pharmacist/prescriptions/[id]/print/page.tsx`) — 850px fixed-width centered layout
- [**D2**](./D-Pharmacist-Print-Prescription-Agent.md) — Print prescription API (`GET /api/dashboard/pharmacist/prescriptions/[id]`) — full data: prescription + booking + doctor (full profile) + medicines + labels + suggestions + diagnosis tables + chief complaints + `POtherSetting`
- [**D3**](./D-Pharmacist-Print-Prescription-Agent.md) — Doctor header section: logo (`POtherSetting`), doctor name, specialization, education, registration detail, address, city, state, phone, mobile, fees
- [**D4**](./D-Pharmacist-Print-Prescription-Agent.md) — Patient section: name, age, weight, BP, temperature, disease, description
- [**D5**](./D-Pharmacist-Print-Prescription-Agent.md) — Labels section: all `PLabel` items displayed as key-value badges
- [**D6**](./D-Pharmacist-Print-Prescription-Agent.md) — Diagnosis table section: `PDignoTable` rendered as HTML table with dynamic rows/cols/headers
- [**D7**](./D-Pharmacist-Print-Prescription-Agent.md) — Chief complaints section: `PCo` items displayed as badges
- [**D8**](./D-Pharmacist-Print-Prescription-Agent.md) — Medicines section: table with columns — #, Medicine, M, A, E, Tab, Dose, Notes
- [**D9**](./D-Pharmacist-Print-Prescription-Agent.md) — Suggestions section: `PSuggestion` items displayed as question → answer pairs
- [**D10**](./D-Pharmacist-Print-Prescription-Agent.md) — Footer section: next visit date, created date, doctor signature area
- [**D11**](./D-Pharmacist-Print-Prescription-Agent.md) — Print button with `window.print()`, CSS `print:hidden`/`print:block` rules
- [**D12**](./D-Pharmacist-Print-Prescription-Agent.md) — Click prescription in list navigates to print page

### Phase E — Pharmacist: Prescriptions Enhancement
> Improve prescription list with VISITED filter, appointment number, next visit date.

- [**E1**](./E-Pharmacist-Prescription-Enhance-Agent.md) — Filter prescriptions to VISITED-only in API (`WHERE prescription.status = 'VISITED'`)
- [**E2**](./E-Pharmacist-Prescription-Enhance-Agent.md) — Add `appointmentNo` from booking relation to prescription list response
- [**E3**](./E-Pharmacist-Prescription-Enhance-Agent.md) — Add `nextVisit` field to prescription list response
- [**E4**](./E-Pharmacist-Prescription-Enhance-Agent.md) — Update prescription list UI: add Appointment # column, Next Visit column
- [**E5**](./E-Pharmacist-Prescription-Enhance-Agent.md) — Make prescription rows clickable → navigate to print page
- [**E6**](./E-Pharmacist-Prescription-Enhance-Agent.md) — Date filter (optional, if time permits)

### Phase F — Both: Profile Pages
> Profile view/edit for assistant and pharmacist, following receptionist pattern.

- [**F1**](./F-Profile-Pages-Agent.md) — Assistant profile page (`/dashboard/assistant/profile/page.tsx`)
- [**F2**](./F-Profile-Pages-Agent.md) — Assistant profile API (`GET/PUT /api/assistant/profile`)
- [**F3**](./F-Profile-Pages-Agent.md) — Assistant avatar upload API (`POST /api/assistant/avatar`)
- [**F4**](./F-Profile-Pages-Agent.md) — Pharmacist profile page (`/dashboard/pharmacist/profile/page.tsx`) — include drug license number field
- [**F5**](./F-Profile-Pages-Agent.md) — Pharmacist profile API (`GET/PUT /api/pharmacist/profile`)
- [**F6**](./F-Profile-Pages-Agent.md) — Pharmacist avatar upload API (`POST /api/pharmacist/avatar`)

### Phase G — Assistant: Blog + Notifications
> Blog CRUD and notifications, following receptionist pattern exactly.

- [**G1**](./G-Assistant-Blog-Notifications-Agent.md) — Blog list page (`/dashboard/assistant/blog/page.tsx`) with stats, create, edit, delete, toggle publish
- [**G2**](./G-Assistant-Blog-Notifications-Agent.md) — Blog API routes (`GET/POST /api/assistant/posts`, `GET/PUT/DELETE /api/assistant/posts/[id]`)
- [**G3**](./G-Assistant-Blog-Notifications-Agent.md) — Notifications page (`/dashboard/assistant/notifications/page.tsx`)
- [**G4**](./G-Assistant-Blog-Notifications-Agent.md) — Notifications API (`GET/PATCH /api/assistant/notifications`)

### Phase H — Polish
> Sidebar/header updates, auto-refresh, dashboard improvements.

- [**H1**](./H-Polish-Agent.md) — Update assistant sidebar: add Profile, Blog, Notifications entries (total 7 items)
- [**H2**](./H-Polish-Agent.md) — Update pharmacist sidebar: add Profile entry (total 5 items)
- [**H3**](./H-Polish-Agent.md) — Update header route title config for new pages (assistant + pharmacist)
- [**H4**](./H-Polish-Agent.md) — Fix header bell for assistant and pharmacist roles
- [**H5**](./H-Polish-Agent.md) — Add `refetchInterval: 15000` on assistant appointments query
- [**H6**](./H-Polish-Agent.md) — Fix assistant dashboard quick actions to link to distinct features
- [**H7**](./H-Polish-Agent.md) — Pharmacist dashboard improvement: add prescription count stat card

---

## 6. Prisma Schema — Relevant Models

### Schema Changes Required (Phase A)

```prisma
// PRESCRIPTION MODEL — ADD THESE TWO FIELDS:
model Prescription {
  id           String   @id @default(cuid())
  bookingId    String
  patientName  String   @default("")
  patientAge   String   @default("")
  disease      String   @default("")
  weight       String   @default("")
  bp           String   @default("")
  temperature  String   @default("")
  description  String   @default("")
  status       String   @default("PENDING")  // ← NEW: PENDING, VISITED
  nextVisit    DateTime?                   // ← NEW: next visit date
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  booking      Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  doctor       Doctor   @relation(fields: [doctorId], references: [id])
  doctorId     String
  medicines    PMedicine[]
  labels       PLabel[]
  suggestions  PSuggestion[]
  diagnosisTables PDignoTable[]
  chiefComplaints PCo[]
}
```

### Existing Models (No Changes)

```prisma
// DoctorAssistant — links assistant to one doctor
model DoctorAssistant {
  id          String   @id @default(cuid())
  userId      String   // assistant user id
  doctorId    String   // doctor id (Doctor model)
  description String   @default("")
  address     String   @default("")
  createdAt   DateTime @default(now())

  doctor      Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
}

// DoctorPharmacist — links pharmacist to one doctor
model DoctorPharmacist {
  id          String   @id @default(cuid())
  userId      String   // pharmacist user id
  doctorId    String   // doctor id (Doctor model)
  description String   @default("")
  address     String   @default("")
  dlNo        String   @default("") // Drug license number
  createdById String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  doctor      Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
}

// Doctor — relevant relations for assistant/pharmacist
model Doctor {
  id                  String   @id @default(cuid())
  userId              String   @unique
  specialization     String   @default("")
  education           String   @default("")
  registrationDetail  String   @default("")
  address             String   @default("")
  city                String   @default("")
  state               String   @default("")
  hospitalAddress     String   @default("")
  phoneNo             String   @default("")
  fees                Float    @default(0)
  experience          String   @default("")
  // ... other fields

  assistants          DoctorAssistant[]
  pharmacistLinks     DoctorPharmacist[]
  medicines           DoctorMedicine[]
  prescriptions       Prescription[]
  coMaster            CoMaster[]
  labelMaster         LabelMaster[]
  questionMaster      QuestionsMaster[]
  otherSettings       POtherSetting?
}

// DoctorMedicine — doctor's medicine master list (for autocomplete)
model DoctorMedicine {
  id          String   @id @default(cuid())
  name        String   @default("")
  morning     String   @default("")
  afternoon   String   @default("")
  evening     String   @default("")
  dose        String   @default("")
  tab         Int      @default(1)
  description String   @default("")
  status      String   @default("Active")
  userId      String   // doctor user id
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  doctor      Doctor   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// CoMaster — Chief Complaints categories (wizard step 1)
model CoMaster {
  id          String   @id @default(cuid())
  coCode      String   @default("")
  coDetail    String   @default("")
  status      String   @default("Active")
  createdById String?
  doctorId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  doctor      Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
}

// LabelMaster — Lab label templates (wizard step 2)
model LabelMaster {
  id          String   @id @default(cuid())
  label       String   @default("")
  status      String   @default("Active")
  createdById String?
  doctorId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  doctor      Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
}

// QuestionsMaster + SuggestionsMaster — (wizard step 5)
model QuestionsMaster {
  id          String   @id @default(cuid())
  question    String   @default("")
  explanation String   @default("")
  status      String   @default("Active")
  createdById String?
  doctorId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  doctor      Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  suggestions SuggestionsMaster[]
}

model SuggestionsMaster {
  id           String   @id @default(cuid())
  questionId   String
  suggestions  String   @default("")
  status       String   @default("Active")
  createdById  String?
  doctorId     String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  question     QuestionsMaster @relation(fields: [questionId], references: [id], onDelete: Cascade)
}

// POtherSetting — doctor's print settings (logo, header, timing)
model POtherSetting {
  id            String   @id @default(cuid())
  doctorId      String   @unique
  logo          String   @default("")
  time          String   @default("{}") // JSON: timing config
  header        String   @default("")
  fullHeader    String   @default("")
  isFullHeader  Boolean  @default(false)
  createdById   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  doctor        Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
}

// PMedicine, PLabel, PSuggestion, PDignoTable, PCo — prescription sub-models
// (already in schema, no changes needed — see Reception Module Plan for full definitions)

// Post — for blog management (already in schema)
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

// Notification — for notifications page (already in schema)
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
```

---

## 7. File Structure — New Files to Create

### Assistant Module

```
src/app/dashboard/assistant/
├── appointments/
│   └── [id]/
│       └── page.tsx                          # NEW — Appointment detail + prescription display
├── prescriptions/
│   └── new/
│       └── page.tsx                          # NEW — 6-step prescription wizard
├── blog/
│   └── page.tsx                              # NEW — Blog management
├── notifications/
│   └── page.tsx                              # NEW — Notifications list
└── profile/
    └── page.tsx                              # NEW — Profile view/edit

src/app/api/dashboard/assistant/
├── appointments/
│   └── [id] /
│       └── route.ts                          # NEW — Appointment detail API
├── prescriptions/
│   ├── route.ts                              # NEW — Simple prescription list/create
│   └── [id] /
│       └── route.ts                          # NEW — Prescription detail/update/delete
├── prescription-wizard/
│   ├── init/
│   │   └── route.ts                          # NEW — Wizard init API
│   ├── co/
│   │   └── route.ts                          # NEW — CO categories API
│   ├── labels/
│   │   └── route.ts                          # NEW — Labels API
│   ├── suggestions/
│   │   └── route.ts                          # NEW — Suggestions API
│   └── save/
│       └── route.ts                          # NEW — Wizard save API

src/app/api/assistant/
├── profile/
│   └── route.ts                              # NEW — Profile CRUD
├── avatar/
│   └── route.ts                              # NEW — Avatar upload
├── posts/
│   ├── route.ts                              # NEW — Blog list/create
│   └── [id] /
│       └── route.ts                          # NEW — Blog detail/update/delete
└── notifications/
    └── route.ts                              # NEW — Notifications list + mark read
```

### Pharmacist Module

```
src/app/dashboard/pharmacist/
├── prescriptions/
│   └── [id] /
│       └── print/
│           └── page.tsx                      # NEW — Print prescription page (850px layout)
└── profile/
    └── page.tsx                              # NEW — Profile view/edit

src/app/api/dashboard/pharmacist/
└── prescriptions/
    └── [id] /
        └── route.ts                          # NEW — Full prescription detail API (print data)

src/app/api/pharmacist/
├── profile/
│   └── route.ts                              # NEW — Profile CRUD
└── avatar/
    └── route.ts                              # NEW — Avatar upload
```

---

## 8. Completion Checklist

### Phase A — Schema Migration
- [ ] SCH-1: `status` field added to Prescription model (PENDING, VISITED)
- [ ] SCH-2: `nextVisit` DateTime? field added to Prescription model
- [ ] `bun run db:push` succeeds without errors
- [ ] Doctor prescription create API accepts `nextVisit`
- [ ] Doctor prescription update API accepts `status` and `nextVisit`
- [ ] ESLint: 0 errors, 0 warnings

### Phase B — Assistant: Appointment Detail + Simple Prescription
- [ ] Appointment detail page renders with booking info
- [ ] Appointment detail API returns booking + prescriptions
- [ ] Existing prescriptions displayed in appointment detail
- [ ] Simple prescription create form works (disease + medicines)
- [ ] Simple prescription edit works
- [ ] Medicine autocomplete from doctor's `DoctorMedicine` master list
- [ ] Prescription create API works for assistant role
- [ ] Prescription update API works for assistant role
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase C — Assistant: Ajax Prescription Wizard (6-Step)
- [ ] Step 1: CO categories loaded and selectable
- [ ] Step 2: Labels loaded with value inputs
- [ ] Step 3: Diagnostic table with dynamic rows/cols
- [ ] Step 4: Medicine builder with autocomplete + timing
- [ ] Step 5: Questions + suggestions loaded and selectable
- [ ] Step 6: Review page shows all data, submit creates full prescription
- [ ] Wizard init API returns booking + patient data
- [ ] Wizard CO API returns CoMaster list
- [ ] Wizard labels API returns LabelMaster list
- [ ] Wizard suggestions API returns Questions + Suggestions
- [ ] Wizard save API creates prescription with all sub-models (CO, labels, diagnosis table, medicines, suggestions)
- [ ] Step navigation (back/next) with progress bar
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase D — Pharmacist: Print Prescription
- [ ] Print prescription page renders with 850px fixed-width centered layout
- [ ] Prescription detail API returns full data (doctor, booking, medicines, labels, suggestions, diagnosis tables, CO, settings)
- [ ] Doctor header section displays (logo, name, specialization, education, registration, address, phone)
- [ ] Patient info section displays (name, age, weight, BP, temperature, disease)
- [ ] Labels section displays as key-value badges
- [ ] Diagnosis table section renders correctly
- [ ] Chief complaints section displays
- [ ] Medicines table renders (M/A/E checkboxes, tab, dose, notes)
- [ ] Suggestions section displays (question → answer)
- [ ] Footer shows next visit date, created date, signature area
- [ ] Print button triggers `window.print()`
- [ ] CSS `print:hidden`/`print:block` rules work correctly
- [ ] Prescription list rows click → navigate to print page
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase E — Pharmacist: Prescriptions Enhancement
- [ ] Prescription API filters to VISITED-only
- [ ] `appointmentNo` from booking included in response
- [ ] `nextVisit` field included in response
- [ ] Prescription list UI shows Appointment # column
- [ ] Prescription list UI shows Next Visit column
- [ ] Prescription rows are clickable
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase F — Both: Profile Pages
- [ ] Assistant profile page renders with user + assistant data
- [ ] Assistant profile API (GET/PUT) works
- [ ] Assistant avatar upload works
- [ ] Pharmacist profile page renders with user + pharmacist data + drug license number
- [ ] Pharmacist profile API (GET/PUT) works
- [ ] Pharmacist avatar upload works
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase G — Assistant: Blog + Notifications
- [ ] Blog list page renders with create, edit, delete, toggle publish
- [ ] Blog API (list, create, update, delete) works
- [ ] Notifications page renders with mark-read
- [ ] Notifications API (list, mark-read) works
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

### Phase H — Polish
- [ ] Assistant sidebar has 7 entries (Dashboard, Appointments, Patients, Prescriptions, Blog, Notifications, Profile, Change Password)
- [ ] Pharmacist sidebar has 5 entries (Dashboard, Prescriptions, Medicine List, Profile, Change Password)
- [ ] Header route title config updated for all new pages
- [ ] Header bell works for assistant and pharmacist roles
- [ ] Assistant appointments query has `refetchInterval: 15000`
- [ ] Assistant dashboard quick actions link to distinct features
- [ ] Pharmacist dashboard has prescription count stat
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification
