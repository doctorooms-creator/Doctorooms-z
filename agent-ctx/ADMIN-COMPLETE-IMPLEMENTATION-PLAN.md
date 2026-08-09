# Admin Module — Complete Implementation Plan

> **Module Selected**: Admin (least complete at 31%)
> **Purpose**: Comprehensive development blueprint — every missing page, API, feature, bug fix documented
> **PHP Reference**: Original Doctorooms PHP/CodeIgniter admin (16 Controllers, 45+ Views, 8+ Models)
> **Created**: After full codebase audit + PHP reference analysis

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Audit](#2-current-state-audit)
3. [Design System & Standards](#3-design-system--standards)
4. [Bug Registry](#4-bug-registry)
5. [Gap Analysis vs PHP Original](#5-gap-analysis-vs-php-original)
6. [Prisma Schema — Admin-Relevant Models](#6-prisma-schema--admin-relevant-models)
7. [Development Phases — Detailed Specifications](#7-development-phases--detailed-specifications)
8. [API Specification — All Endpoints](#8-api-specification--all-endpoints)
9. [Page Specification — All Pages](#9-page-specification--all-pages)
10. [Sidebar Configuration Update](#10-sidebar-configuration-update)
11. [Completion Metrics & Checklist](#11-completion-metrics--checklist)
12. [Risk Assessment](#12-risk-assessment)

---

## 1. Executive Summary

### What is this?
The Admin module is the **central control panel** for the entire Doctorooms platform. It manages all users, monitors appointments, configures platform settings, manages content, defines master data, tracks revenue, and generates reports.

### Why Admin Module?

| Factor | Details |
|--------|--------|
| Completion Gap | Lowest at **31%** — most room for impact |
| Business Criticality | Controls ALL platform data and configuration |
| PHP Feature Parity | Most complex PHP features (reports, masters, charges, sliders) |
| Blocking Others | Doctor Type Master blocks doctor dropdowns; Disease Master blocks appointment disease fields |

### Metrics

| Metric | Current | Target | Delta |
|--------|---------|--------|-------|
| Pages | 8 | 26 | +18 |
| API Routes | 11 | 23+ | +12 |
| Sidebar Entries | 9 | 17 | +8 |
| Feature Coverage | 31% | 95%+ | +64% |

---

## 2. Current State Audit

### 2.1 Pages Built (8)

| # | Route | Lines | Status | Key Issues |
|---|-------|-------|--------|------------|
| 1 | `/dashboard/admin` | 319 | ⚠️ | Hardcoded trends (BUG-2) |
| 2 | `/dashboard/admin/users` | 487 | ⚠️ | Wrong stat values (BUG-3) |
| 3 | `/dashboard/admin/doctors` | ~500 | ⚠️ | Read-only, no edit |
| 4 | `/dashboard/admin/hospitals` | ~400 | ⚠️ | List + delete only |
| 5 | `/dashboard/admin/appointments` | ~600 | ⚠️ | Read-only, no actions |
| 6 | `/dashboard/admin/blog` | ~500 | ✅ | Working CRUD |
| 7 | `/dashboard/admin/inquiries` | ~300 | ⚠️ | Auth bug (BUG-4) |
| 8 | `/dashboard/admin/settings` | ~400 | ⚠️ | Filesystem JSON (BUG-5) |

### 2.2 APIs Built (11)

| # | Endpoint | Methods | Description |
|---|----------|---------|-------------|
| 1 | `/api/dashboard/admin/stats` | GET | Dashboard stats + recent appointments |
| 2 | `/api/dashboard/admin/users` | GET | User list with role filter, search, pagination |
| 3 | `/api/dashboard/admin/users/[id]` | DELETE | Delete user |
| 4 | `/api/dashboard/admin/users/[id]/status` | PUT | Change user status |
| 5 | `/api/dashboard/admin/doctors` | GET | Doctor list with filters |
| 6 | `/api/dashboard/admin/hospitals` | GET | Hospital list with filters |
| 7 | `/api/dashboard/admin/appointments` | GET | All appointments with filters |
| 8 | `/api/dashboard/admin/blog` | GET, POST | Blog list + create |
| 9 | `/api/dashboard/admin/blog/[id]` | PUT, DELETE | Blog update + delete |
| 10 | `/api/dashboard/admin/inquiries` | GET, PUT, DELETE | Inquiry CRUD |
| 11 | `/api/admin/settings` | GET, PUT | Settings (filesystem JSON) |

### 2.3 Current Sidebar (9 entries)

```
Dashboard, Users, Doctors, Hospitals, Appointments, Blog, Inquiries, Settings, Change Password
```

### 2.4 PHP Original Sidebar (11 groups, 20+ items)

```
1. Dashboard
2. Appointment
3. Income (Charges & Income report)
4. User List (submenu): All Users, Doctors, Assistant, Patient, Hospital
5. Blog
6. Hospital Inquiry
7. Localization (submenu): Country, State, City
8. Masters (submenu): Doctor Type, Disease Type
9. Admin Charges
10. Slider
11. Reports
```

### 2.5 Unused Prisma Models (Zero UI/API)

| Model | Purpose | Priority |
|-------|---------|----------|
| `Slider` | Homepage slider images with ordering | HIGH |
| `DoctorTypeMaster` | Doctor type categories (General Physician, etc.) | HIGH |
| `DiseaseMaster` | Disease categories | HIGH |

---

## 3. Design System & Standards

### 3.1 Color System

| Usage | Color | Tailwind |
|-------|-------|----------|
| Primary | Teal | `teal-500/600` |
| Warnings | Amber | `amber-500` |
| Success | Emerald | `emerald-500` |
| Pending | Violet | `violet-500` |
| Error/Canceled | Red | `red-500/600` |
| Admin Accent | Rose | `rose-500` |

### 3.2 Role Badge Colors

| Role | Class |
|------|-------|
| admin | `bg-red-100 text-red-700` |
| doctor | `bg-teal-100 text-teal-700` |
| patient | `bg-blue-100 text-blue-700` |
| hospital | `bg-amber-100 text-amber-700` |
| receptionist | `bg-violet-100 text-violet-700` |
| assistant | `bg-pink-100 text-pink-700` |
| pharmacist | `bg-emerald-100 text-emerald-700` |

### 3.3 Status Badge Colors

| Status | Class |
|--------|-------|
| Pending | `bg-amber-100 text-amber-700` |
| Approve | `bg-emerald-100 text-emerald-700` |
| Visited | `bg-teal-100 text-teal-700` |
| Canceled | `bg-red-100 text-red-700` |
| Finish | `bg-blue-100 text-blue-700` |
| Extend | `bg-violet-100 text-violet-700` |
| Active | `bg-emerald-100 text-emerald-700` |
| Block | `bg-red-100 text-red-700` |
| Published | `bg-emerald-100 text-emerald-700` |
| Draft | `bg-slate-100 text-slate-700` |

### 3.4 Component & Pattern Standards

- **UI**: shadcn/ui (New York style) + Lucide icons + Framer Motion
- **Data**: TanStack Query (`useQuery`/`useMutation`/`useQueryClient`)
- **Toast**: `sonner` library
- **Charts**: Recharts (bar, line, pie)
- **Auth**: `requireRole(req, 'admin')` with null check on every API
- **Loading**: Skeleton + `animate-pulse`
- **Empty**: Icon + message pattern
- **Destructive**: `AlertDialog` confirmation always
- **Currency**: `₹` with `toLocaleString('en-IN')`
- **Responsive**: Mobile-first `sm:`/`md:`/`lg:`/`xl:`
- **Forms**: Controlled state (useState), Zod validation optional

---

## 4. Bug Registry

### Critical (Must Fix First)

| ID | Bug | File | Fix |
|----|-----|------|-----|
| BUG-1 | Unused `fs`/`path` imports | `api/dashboard/admin/inquiries/route.ts` | Remove dead imports |
| BUG-2 | Hardcoded trend values on dashboard | `dashboard/admin/page.tsx` L102-126 | API returns real month-over-month % |
| BUG-3 | Wrong stat values on Users page | `dashboard/admin/users/page.tsx` L174,188 | Use `statusCounts` not `roleCounts` |
| BUG-4 | requireRole return not checked | `api/dashboard/admin/inquiries/route.ts` L9,51,79 | Add `if (!user) return 401` |

### Medium

| ID | Bug | Fix |
|----|-----|-----|
| BUG-5 | Settings in filesystem JSON | Create `AdminConfig` model, migrate to DB |
| BUG-6 | No pagination on inquiries | Add `?page=&limit=` + `skip/take` |
| BUG-7 | No pagination on hospitals | Add pagination |
| BUG-8 | No pagination on doctors | Add pagination |

---

## 5. Gap Analysis vs PHP Original

### HIGH Priority

| ID | Feature | PHP Controller | Current Gap |
|----|---------|---------------|-------------|
| GAP-1 | Appointment Status Management | `admin/Appointment` → approve/extend/visited/cancel | Read-only list, no actions |
| GAP-2 | Doctor Edit | `admin/Doctor` → edit_profile/edit_validate | View dialog only, no edit |
| GAP-3 | Hospital CRUD | `admin/Hospital` → add/edit/edit_profile | List + delete only |
| GAP-4 | Slider Management | `admin/Slider` → full CRUD + image upload | Model exists, zero UI/API |
| GAP-5 | Doctor Type Master | `admin/Type_master` → CRUD | Model exists, zero UI/API |
| GAP-6 | Disease Master | `admin/Disease_master` → CRUD | Model exists, zero UI/API |
| GAP-7 | Reports Module | `admin/Report` → 4 report types | Zero reporting |
| GAP-8 | Admin Charges Config | `admin/Config` → platform fees | No model, no page |

### MEDIUM Priority

| ID | Feature | Current Gap |
|----|---------|-------------|
| GAP-9 | Admin Profile | No profile page |
| GAP-10 | Doctor Detail Page | Only inline dialog |
| GAP-11 | Hospital Detail/Edit | Only inline dialog |
| GAP-12 | Income Dashboard | No dedicated page |

### LOW Priority

| ID | Feature |
|----|---------|
| GAP-13 | Blog image upload |
| GAP-14 | Hospital gallery management |
| GAP-15 | Bulk user actions |

---

## 6. Prisma Schema — Admin-Relevant Models

### Existing Models

```prisma
model User {
  id, name, gender, role, status, email, password, profileImg, mobileNo,
  settingsJson, createdAt, updatedAt
  // + relations to doctor, hospital, bookings, posts, etc.
}

model Doctor {
  id, userId, bookingDays, dailyLimit, doctorType, description, photos,
  address, state, city, hospitalAddress, fees, emergencyCharge,
  specialization, awardAndRecognition, education, lat, longi, hospitalId,
  experience, registrationDetail, contactNo, phoneNo, isEmergency
}

model Hospital {
  id, userId, hospitalName, address, state, city, contactNo, gallery, lat, longi
}

model Booking {
  id, appointmentNo, doctorId, userId?, state, city, bookingDate, patientName,
  disease, description, gender, status, timeSlot, bookingMode, bookingType,
  appointmentCharge
  // status: Pending, Approve, Visited, Canceled, Extend, Finish
}

model Slider { id, sliderImage, position, status, link, title, subtitle }
model DoctorTypeMaster { id, type, status }
model DiseaseMaster { id, name, status }
model Post { id, title, permalink, content, blogImg, type, status, authorId }
model DoctorRating { id, patientId, doctorId, star, review, ... }
model Notification { id, userId, title, message, status }
model HospitalInquiry { id, name, email, phone, subject, message, status }
```

### New Model Needed (Phase H)

```prisma
model AdminConfig {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   @default("")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 7. Development Phases — Detailed Specifications

### Phase A: Bug Fixes (Critical) — 0 new pages, 2 APIs modified

#### A1: Remove unused imports (BUG-1)
- **File**: `src/app/api/dashboard/admin/inquiries/route.ts`
- **Action**: Remove `import fs from 'fs'` and `import path from 'path'`

#### A2: Fix requireRole null check (BUG-4)
- **File**: `src/app/api/dashboard/admin/inquiries/route.ts`
- **Action**: After each `requireRole()` call (L9 GET, L51 PUT, L79 DELETE), add null check

#### A3: Fix dashboard trends (BUG-2)
- **API Change** (`/api/dashboard/admin/stats`): Add trend calculations
  - For each metric, compute: `(thisMonth - lastMonth) / lastMonth * 100`
  - Return `totalUsersTrend: { value: number, label: string }` etc.
- **Page Change** (`dashboard/admin/page.tsx`): Use `data?.totalUsersTrend` instead of hardcoded

#### A4: Fix Users page stats (BUG-3)
- **API Change** (`/api/dashboard/admin/users`): Add `statusCounts` via `groupBy('status')`
- **Page Change** (`dashboard/admin/users/page.tsx`): Use `data?.statusCounts?.Active`

---

### Phase B: Doctor Management — 2 new pages, 1 new API

#### B1: Doctor Detail API
- **New Endpoint**: `GET /api/dashboard/admin/doctors/[id]`
- **Auth**: `requireRole('admin')`
- **Query**: Include `user`, `schedules`, `holidays`, rating aggregate (`_avg.star`), booking count (`_count.bookings`)
- **Response**: Full doctor profile with stats

#### B2: Doctor Edit API
- **New Endpoint**: `PUT /api/dashboard/admin/doctors/[id]`
- **Body**: `{ fees, emergencyCharge, specialization, education, experience, awardAndRecognition, registrationDetail, description, doctorType, address, hospitalAddress, contactNo, phoneNo, city, state, lat, longi, isEmergency, dailyLimit, bookingDays }`

#### B3: Doctor Detail Page
- **Route**: `/dashboard/admin/doctors/[id]`
- **Sections**:
  1. Profile card (avatar, name with Dr. prefix, specialization badges, rating stars)
  2. Contact card (phone, email, address, fees, emergency charge)
  3. Stats cards (total appointments, patients, revenue, rating)
  4. Tabs: Personal Details | Weekly Schedule | Recent Appointments
  5. "Edit Profile" button → navigates to edit page

#### B4: Doctor Edit Page
- **Route**: `/dashboard/admin/doctors/[id]/edit`
- **Form Sections**:
  1. Basic Info (doctor type dropdown, specialization, fees, emergency charge, emergency toggle)
  2. Contact Info (contact, phone, address, city, state, hospital address)
  3. Professional (education, experience, awards, registration detail, bio)
  4. Limits (booking days, daily patient limit)
- **Actions**: Save Changes (PUT), Cancel (navigate back)

#### B5: Update Doctor List Page
- Add "View" link → navigates to `/dashboard/admin/doctors/[id]`
- Add "Edit" action in dropdown → navigates to `/dashboard/admin/doctors/[id]/edit`

---

### Phase C: Hospital Management — 3 new pages, 3 new APIs

#### C1: Hospital Create API
- **New Endpoint**: `POST /api/dashboard/admin/hospitals`
- **Body**: `{ name, email, password, contactNo, state, city }`
- **Logic**: Create User (role=hospital, status=Active) → Create Hospital → Return both

#### C2: Hospital Update API
- **New Endpoint**: `PUT /api/dashboard/admin/hospitals/[id]`
- **Body**: `{ hospitalName, address, state, city, contactNo, lat, longi }`

#### C3: Hospital Detail API
- **New Endpoint**: `GET /api/dashboard/admin/hospitals/[id]`
- **Query**: Include `user`, `doctors` (linked via `hospitalId`)

#### C4: Hospital List Page Update
- Add "Add Hospital" button (top right) → navigates to `/dashboard/admin/hospitals/add`
- Add "View" action → `/dashboard/admin/hospitals/[id]`
- Add "Edit" action → `/dashboard/admin/hospitals/[id]/edit`

#### C5: Hospital Add Page
- **Route**: `/dashboard/admin/hospitals/add`
- **Form**: Hospital Name, Email, Password, Confirm Password, Contact No, State (text), City (text), Terms checkbox
- **On Submit**: POST API → redirect to hospital list with success toast

#### C6: Hospital Detail Page
- **Route**: `/dashboard/admin/hospitals/[id]`
- **Sections**:
  1. Hospital card (name, address, contact, registration date)
  2. Stats (total doctors, total appointments, total revenue)
  3. Linked Doctors table (name, specialization, status, fees)
  4. "Edit" button → edit page

#### C7: Hospital Edit Page
- **Route**: `/dashboard/admin/hospitals/[id]/edit`
- **Form**: Pre-filled (hospitalName, address, state, city, contactNo, lat, longi)
- **Actions**: Save (PUT), Cancel

---

### Phase D: Appointment Status Actions — 0 new pages, 1 new API

#### D1: Appointment Status API
- **New Endpoint**: `PUT /api/dashboard/admin/appointments/[id]/status`
- **Body**: `{ status: "Approve" | "Visited" | "Extend" | "Canceled" | "Finish" }`
- **State Machine Validation**:
  ```
  Pending → Approve, Canceled
  Approve → Visited, Canceled, Extend
  Extend → Approve, Canceled
  Visited → Finish, Canceled
  Finish → (terminal)
  Canceled → (terminal)
  ```
- **Side Effects**: Create Notification for patient AND doctor on status change

#### D2: Update Appointments Page
- **File**: `src/app/dashboard/admin/appointments/page.tsx`
- **Add**: Status action buttons in each row's actions dropdown
  - Pending: [Approve] [Cancel]
  - Approve: [Mark Visited] [Extend] [Cancel]
  - Extend: [Approve] [Cancel]
  - Visited: [Mark Finish] [Cancel]
  - Finish/Canceled: (no actions)
- **Add**: AlertDialog confirmation for Cancel action
- **Add**: Refresh list after status change (queryClient invalidateQueries)

---

### Phase E: Master Data Management — 2 new pages, 2 new APIs

#### E1: Doctor Type CRUD API
- **New Endpoint**: `GET/POST/PUT/DELETE /api/dashboard/admin/doctor-types`
- **GET**: List all with search, optional `?status=` filter. Return `{ items, total }`
- **POST**: `{ type: string, status: "Active" | "Inactive" }`
- **PUT**: Update type and status by ID
- **DELETE**: Hard delete (simple master table)

#### E2: Disease Type CRUD API
- **New Endpoint**: `GET/POST/PUT/DELETE /api/dashboard/admin/disease-types`
- **Same pattern as Doctor Type but field is `name` instead of `type`

#### E3: Doctor Types Page
- **Route**: `/dashboard/admin/doctor-types`
- **Layout**:
  1. Page title + "Add Doctor Type" button
  2. Search input
  3. Table: #, Type Name, Status (badge), Created Date, Actions (Edit, Toggle Status, Delete)
  4. Add/Edit Dialog with fields: Type Name (text), Status (Active/Inactive toggle)

#### E4: Disease Types Page
- **Route**: `/dashboard/admin/disease-types`
- **Same pattern** as Doctor Types but field label is "Disease Name"

#### E5: Sidebar Update
- Add "Masters" group with sub-items: Doctor Types, Disease Types

---

### Phase F: Slider Management — 1 new page, 1 new API

#### F1: Slider CRUD API
- **New Endpoint**: `GET/POST/PUT/DELETE /api/dashboard/admin/sliders`
- **GET**: List all ordered by `position ASC`
- **POST**: `{ title, subtitle, link, sliderImage, position, status }`
- **PUT**: Update all fields by ID
- **DELETE**: Hard delete + file cleanup
- **Note**: `sliderImage` is a URL string. For MVP, accept URL input. File upload is a future enhancement.

#### F2: Sliders Page
- **Route**: `/dashboard/admin/sliders`
- **Layout**:
  1. Page title + "Add Slider" button
  2. Grid of slider cards (not table — visual cards because sliders are visual)
  3. Each card shows:
     - Image preview (thumbnail)
     - Title + subtitle
     - Position badge
     - Status toggle (Active/Inactive)
     - Edit / Delete actions
  4. Add/Edit Dialog:
     - Image URL input
     - Title (text)
     - Subtitle (text)
     - Link URL (text)
     - Position (number)
     - Status (Active/Inactive)

---

### Phase G: Reports & Analytics — 5 new pages, 4 new APIs

#### G1: Income API
- **Endpoint**: `GET /api/dashboard/admin/income?from=YYYY-MM-DD&to=YYYY-MM-DD`
- **Response**:
  ```json
  {
    "totalIncome": 125000,
    "thisMonthIncome": 45000,
    "lastMonthIncome": 38000,
    "growthPercent": 18.4,
    "dailyBreakdown": [
      { "date": "2025-01-15", "income": 5000, "count": 10 },
      ...
    ],
    "recentTransactions": [
      { "id", "appointmentNo", "patientName", "doctorName", "amount", "date", "status" },
      ...
    ]
  }
  ```
- **Logic**: Sum `appointmentCharge` from Booking where status in (Visited, Finish), filtered by date range

#### G2: Income Page
- **Route**: `/dashboard/admin/income`
- **Sections**:
  1. Date range picker (from/to)
  2. Stat cards: Total Income, This Month, Last Month, Growth %
  3. Bar chart: Daily income (Recharts)
  4. Recent transactions table

#### G3: User Report API
- **Endpoint**: `GET /api/dashboard/admin/reports/users?from=&to=`
- **Response**:
  ```json
  {
    "totalUsers": 500,
    "newUsersThisPeriod": 45,
    "roleBreakdown": { "doctor": 45, "patient": 300, ... },
    "registrationTrends": [
      { "date": "2025-01", "count": 25 },
      ...
    ]
  }
  ```

#### G4: User Report Page
- **Route**: `/dashboard/admin/reports/users`
- **Sections**:
  1. Date range filter
  2. Stat cards: Total Users, New This Period
  3. Role distribution pie chart (Recharts)
  4. Registration trend line chart

#### G5: Appointment Report API
- **Endpoint**: `GET /api/dashboard/admin/reports/appointments?from=&to=`
- **Response**:
  ```json
  {
    "totalAppointments": 500,
    "statusBreakdown": { "Pending": 50, "Approve": 100, ... },
    "modeBreakdown": { "InPerson": 400, "VideoCall": 100 },
    "dailyTrends": [...],
    "topDoctors": [
      { "doctorName", "totalAppointments", "completed", "revenue" },
      ...
    ]
  }
  ```

#### G6: Appointment Report Page
- **Route**: `/dashboard/admin/reports/appointments`
- **Sections**:
  1. Date range filter
  2. Stat cards: Total, Completed, Pending, Canceled
  3. Status distribution pie chart
  4. Daily trend bar chart
  5. Top Doctors table (name, appointments, revenue, rating)

#### G7: Hospital-wise Income API
- **Endpoint**: `GET /api/dashboard/admin/reports/income-hospital?from=&to=`
- **Response**:
  ```json
  {
    "totalIncome": 125000,
    "hospitalBreakdown": [
      { "hospitalName", "doctorCount", "appointmentCount", "income", "percentage" },
      ...
    ]
  }
  ```

#### G8: Hospital-wise Income Page
- **Route**: `/dashboard/admin/reports/income-hospital`
- **Sections**:
  1. Date range filter
  2. Total income card
  3. Hospital comparison bar chart
  4. Table: Hospital Name, Doctors, Appointments, Income, % Share

#### G9: Reports Hub Page
- **Route**: `/dashboard/admin/reports`
- **Layout**: Card grid with 4 report type cards, each with icon, title, description, "View Report" link
  - Income Report → `/dashboard/admin/income`
  - User Report → `/dashboard/admin/reports/users`
  - Appointment Report → `/dashboard/admin/reports/appointments`
  - Hospital-wise Income → `/dashboard/admin/reports/income-hospital`

#### G10: Sidebar Update
- Add "Income" entry (link to `/dashboard/admin/income`)
- Add "Reports" group with sub-items: Users, Appointments, Hospital Income

---

### Phase H: Admin Profile, Charges & Settings Migration — 3 new pages, 4 new APIs

#### H1: Admin Profile API
- **New Endpoint**: `GET/PUT /api/dashboard/admin/profile`
- **GET**: Return current admin user (name, email, mobileNo, gender, profileImg)
- **PUT**: Update `{ name, mobileNo, gender }`

#### H2: Admin Profile Page
- **Route**: `/dashboard/admin/profile`
- **Layout** (reuse pattern from receptionist/doctor profile):
  1. Profile image section (upload capability)
  2. Form: Name, Email (disabled), Mobile, Gender (select)
  3. Change Password section (integrated)
  4. Save button

#### H3: AdminConfig Schema Addition
- **Add to Prisma**: `AdminConfig` model (key-value store)
- **Run**: `bun run db:push`
- **Seed default values**: siteName, siteEmail, sitePhone, etc.

#### H4: Admin Charges API
- **New Endpoint**: `GET/PUT /api/dashboard/admin/charges`
- **GET**: Return charge config from AdminConfig
- **PUT**: Update charge config
- **Config Keys**: `platformChargePercent`, `minCharge`, `perBookingCharge`, `effectiveDate`

#### H5: Admin Charges Page
- **Route**: `/dashboard/admin/charges`
- **Form**: Platform Commission %, Minimum Charge (₹), Per-booking Charge (₹), Effective Date (date picker)
- **Display**: Current configuration, preview of charge calculation

#### H6: Settings Migration (BUG-5 resolution)
- **Migrate** existing filesystem settings to AdminConfig table
- **Rewrite** `/api/admin/settings` to use DB instead of filesystem
- **Update** settings page to work with new API response format

#### H7: Sidebar Update
- Add "Profile" entry
- Add "Charges" entry

---

## 8. API Specification — All Endpoints

### Existing APIs (11) — No Changes Required Except Bug Fixes

(See Section 2.2 for full list)

### New APIs (12+)

| # | Endpoint | Methods | Phase | Request Body | Response Summary |
|---|----------|---------|-------|--------------|-----------------|
| 1 | `/api/dashboard/admin/doctors/[id]` | GET | B | — | Doctor + User + Schedules + Stats |
| 2 | `/api/dashboard/admin/doctors/[id]` | PUT | B | Doctor fields | Updated doctor |
| 3 | `/api/dashboard/admin/hospitals` | POST | C | name, email, password, contactNo, state, city | User + Hospital |
| 4 | `/api/dashboard/admin/hospitals/[id]` | GET | C | — | Hospital + User + Doctors |
| 5 | `/api/dashboard/admin/hospitals/[id]` | PUT | C | hospitalName, address, state, city, contactNo, lat, longi | Updated hospital |
| 6 | `/api/dashboard/admin/appointments/[id]/status` | PUT | D | `{ status }` | Updated booking + notifications |
| 7 | `/api/dashboard/admin/doctor-types` | GET/POST | E | `{ type, status }` | List / Created |
| 8 | `/api/dashboard/admin/doctor-types/[id]` | PUT/DELETE | E | `{ type, status }` | Updated / Deleted |
| 9 | `/api/dashboard/admin/disease-types` | GET/POST | E | `{ name, status }` | List / Created |
| 10 | `/api/dashboard/admin/disease-types/[id]` | PUT/DELETE | E | `{ name, status }` | Updated / Deleted |
| 11 | `/api/dashboard/admin/sliders` | GET/POST | F | `{ title, subtitle, link, sliderImage, position, status }` | List / Created |
| 12 | `/api/dashboard/admin/sliders/[id]` | PUT/DELETE | F | Same as POST | Updated / Deleted |
| 13 | `/api/dashboard/admin/income` | GET | G | `?from=&to=` | Income stats + daily breakdown + transactions |
| 14 | `/api/dashboard/admin/reports/users` | GET | G | `?from=&to=` | User stats + role breakdown + trends |
| 15 | `/api/dashboard/admin/reports/appointments` | GET | G | `?from=&to=` | Appointment stats + status breakdown + top doctors |
| 16 | `/api/dashboard/admin/reports/income-hospital` | GET | G | `?from=&to=` | Hospital-wise income breakdown |
| 17 | `/api/dashboard/admin/profile` | GET/PUT | H | `{ name, mobileNo, gender }` | Admin profile data |
| 18 | `/api/dashboard/admin/charges` | GET/PUT | H | `{ platformChargePercent, minCharge, perBookingCharge, effectiveDate }` | Charge config |

### API File Structure

```
src/app/api/dashboard/admin/
├── stats/route.ts              (existing, modify)
├── users/
│   ├── route.ts                (existing, modify)
│   ├── [id]/route.ts           (existing)
│   └── [id]/status/route.ts    (existing)
├── doctors/
│   ├── route.ts                (existing)
│   └── [id]/route.ts           (NEW - GET doctor detail + PUT doctor edit)
├── hospitals/
│   ├── route.ts                (existing GET, add POST)
│   └── [id]/route.ts           (NEW - GET detail + PUT edit)
├── appointments/
│   ├── route.ts                (existing GET)
│   └── [id]/status/route.ts    (NEW - PUT status change)
├── blog/
│   ├── route.ts                (existing)
│   └── [id]/route.ts           (existing)
├── inquiries/route.ts          (existing, fix bugs)
├── doctor-types/
│   ├── route.ts                (NEW - GET list + POST create)
│   └── [id]/route.ts           (NEW - PUT update + DELETE)
├── disease-types/
│   ├── route.ts                (NEW - GET list + POST create)
│   └── [id]/route.ts           (NEW - PUT update + DELETE)
├── sliders/
│   ├── route.ts                (NEW - GET list + POST create)
│   └── [id]/route.ts           (NEW - PUT update + DELETE)
├── income/route.ts             (NEW - GET income report)
├── reports/
│   ├── users/route.ts          (NEW)
│   ├── appointments/route.ts   (NEW)
│   └── income-hospital/route.ts (NEW)
├── profile/route.ts            (NEW - GET + PUT)
└── charges/route.ts            (NEW - GET + PUT)
```

---

## 9. Page Specification — All Pages

### Existing Pages (8) — No New Pages, Only Bug Fixes

(See Section 2.1 for details)

### New Pages (18)

| # | Route | Phase | Type | Key Components |
|---|-------|-------|------|---------------|
| 1 | `/dashboard/admin/doctors/[id]` | B | Detail | Avatar, Badge, Tabs, Card, Table |
| 2 | `/dashboard/admin/doctors/[id]/edit` | B | Form | Input, Select, Textarea, Button |
| 3 | `/dashboard/admin/hospitals/add` | C | Form | Input, Button |
| 4 | `/dashboard/admin/hospitals/[id]` | C | Detail | Card, Badge, Table |
| 5 | `/dashboard/admin/hospitals/[id]/edit` | C | Form | Input, Textarea, Button |
| 6 | `/dashboard/admin/doctor-types` | E | List+CRUD | Table, Dialog, Badge, Input |
| 7 | `/dashboard/admin/disease-types` | E | List+CRUD | Table, Dialog, Badge, Input |
| 8 | `/dashboard/admin/sliders` | F | Visual List | Card, Dialog, Badge, Input |
| 9 | `/dashboard/admin/income` | G | Dashboard+Table | DatePicker, StatCard, BarChart, Table |
| 10 | `/dashboard/admin/reports` | G | Hub | Card grid with navigation links |
| 11 | `/dashboard/admin/reports/users` | G | Dashboard | DatePicker, StatCard, PieChart, LineChart |
| 12 | `/dashboard/admin/reports/appointments` | G | Dashboard | DatePicker, StatCard, PieChart, BarChart, Table |
| 13 | `/dashboard/admin/reports/income-hospital` | G | Dashboard | DatePicker, StatCard, BarChart, Table |
| 14 | `/dashboard/admin/profile` | H | Form+Profile | Avatar, Input, Select, Button |
| 15 | `/dashboard/admin/charges` | H | Form | Input, DatePicker, Button |

### Page File Structure

```
src/app/dashboard/admin/
├── page.tsx                     (existing, fix bugs)
├── users/page.tsx               (existing, fix bugs)
├── doctors/
│   ├── page.tsx                 (existing, update actions)
│   ├── [id]/
│   │   ├── page.tsx             (NEW - doctor detail)
│   │   └── edit/page.tsx        (NEW - doctor edit)
├── hospitals/
│   ├── page.tsx                 (existing, update actions)
│   ├── add/page.tsx             (NEW - hospital add)
│   └── [id]/
│       ├── page.tsx             (NEW - hospital detail)
│       └── edit/page.tsx        (NEW - hospital edit)
├── appointments/page.tsx        (existing, add status actions)
├── blog/page.tsx                (existing)
├── inquiries/page.tsx           (existing, API fixes only)
├── settings/page.tsx            (existing, migrate to DB in Phase H)
├── doctor-types/page.tsx        (NEW)
├── disease-types/page.tsx       (NEW)
├── sliders/page.tsx             (NEW)
├── income/page.tsx              (NEW)
├── reports/
│   ├── page.tsx                 (NEW - hub)
│   ├── users/page.tsx           (NEW)
│   ├── appointments/page.tsx    (NEW)
│   └── income-hospital/page.tsx (NEW)
├── profile/page.tsx             (NEW)
└── charges/page.tsx             (NEW)
```

---

## 10. Sidebar Configuration Update

### Current Sidebar (9 items)

```typescript
admin: [
  Dashboard, Users, Doctors, Hospitals, Appointments, Blog, Inquiries, Settings, Change Password
]
```

### Target Sidebar (17 items with groups)

```typescript
admin: [
  { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/dashboard/admin/users', icon: Users },
  { label: 'Doctors', href: '/dashboard/admin/doctors', icon: Stethoscope },
  { label: 'Hospitals', href: '/dashboard/admin/hospitals', icon: Building2 },
  { label: 'Appointments', href: '/dashboard/admin/appointments', icon: CalendarDays },
  { label: 'Income', href: '/dashboard/admin/income', icon: IndianRupee },
  // Reports Group (expandable in future, flat for now)
  { label: 'Reports', href: '/dashboard/admin/reports', icon: BarChart3 },
  { label: 'Blog', href: '/dashboard/admin/blog', icon: FileText },
  { label: 'Inquiries', href: '/dashboard/admin/inquiries', icon: MessageSquare },
  { label: 'Sliders', href: '/dashboard/admin/sliders', icon: Image },
  // Masters Group
  { label: 'Doctor Types', href: '/dashboard/admin/doctor-types', icon: Tag },
  { label: 'Disease Types', href: '/dashboard/admin/disease-types', icon: FlaskConical },
  { label: 'Admin Charges', href: '/dashboard/admin/charges', icon: CreditCard },
  { label: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
  { label: 'Profile', href: '/dashboard/admin/profile', icon: UserCircle },
  { label: 'Change Password', href: '/dashboard/change-password', icon: KeyRound },
]
```

### Required Lucide Icon Imports

```typescript
import { Image, Tag, CreditCard } from 'lucide-react'
// Image — for Sliders
// Tag — for Doctor Types
// CreditCard — for Admin Charges
```

---

## 11. Completion Metrics & Checklist

### Phase A — Bug Fixes
- [ ] BUG-1: Unused imports removed from inquiries API
- [ ] BUG-2: Dashboard trends use real API data
- [ ] BUG-3: Users stats use statusCounts
- [ ] BUG-4: requireRole null checks in inquiries API
- [ ] ESLint clean

### Phase B — Doctor Management
- [ ] `GET /api/dashboard/admin/doctors/[id]` — returns full doctor with stats
- [ ] `PUT /api/dashboard/admin/doctors/[id]` — updates doctor fields
- [ ] `/dashboard/admin/doctors/[id]` page — detail with tabs
- [ ] `/dashboard/admin/doctors/[id]/edit` page — edit form
- [ ] Doctor list updated with View/Edit actions
- [ ] ESLint clean

### Phase C — Hospital Management
- [ ] `POST /api/dashboard/admin/hospitals` — creates user + hospital
- [ ] `GET /api/dashboard/admin/hospitals/[id]` — hospital with linked doctors
- [ ] `PUT /api/dashboard/admin/hospitals/[id]` — updates hospital
- [ ] `/dashboard/admin/hospitals/add` page
- [ ] `/dashboard/admin/hospitals/[id]` page — detail view
- [ ] `/dashboard/admin/hospitals/[id]/edit` page
- [ ] Hospital list updated with Add/View/Edit actions
- [ ] ESLint clean

### Phase D — Appointment Actions
- [ ] `PUT /api/dashboard/admin/appointments/[id]/status` — with state machine
- [ ] Notifications created on status change
- [ ] Status action buttons on appointments page
- [ ] AlertDialog for Cancel
- [ ] ESLint clean

### Phase E — Masters
- [ ] Doctor Type CRUD API (GET/POST/PUT/DELETE)
- [ ] Doctor Types page with list, add, edit, toggle, delete
- [ ] Disease Type CRUD API (GET/POST/PUT/DELETE)
- [ ] Disease Types page with list, add, edit, toggle, delete
- [ ] Sidebar updated with Masters entries
- [ ] ESLint clean

### Phase F — Sliders
- [ ] Slider CRUD API (GET/POST/PUT/DELETE)
- [ ] Sliders page with visual card grid
- [ ] Add/Edit dialog with all fields
- [ ] Sidebar updated with Sliders entry
- [ ] ESLint clean

### Phase G — Reports
- [ ] Income API with date range and daily breakdown
- [ ] Income page with chart and table
- [ ] User Report API with role breakdown and trends
- [ ] User Report page with charts
- [ ] Appointment Report API with status breakdown and top doctors
- [ ] Appointment Report page with charts and table
- [ ] Hospital-wise Income API
- [ ] Hospital-wise Income page
- [ ] Reports hub page
- [ ] Sidebar updated with Income and Reports entries
- [ ] ESLint clean

### Phase H — Profile, Charges, Settings
- [ ] AdminConfig model added to Prisma schema
- [ ] `db:push` successful
- [ ] Default config values seeded
- [ ] Admin Profile API (GET/PUT)
- [ ] Admin Profile page
- [ ] Charges API (GET/PUT)
- [ ] Charges page
- [ ] Settings migrated from filesystem to DB
- [ ] Sidebar updated with Profile and Charges entries
- [ ] ESLint clean

---

## 12. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AdminConfig migration breaks settings page | Medium | High | Keep filesystem as fallback during migration, test thoroughly |
| Hospital creation requires User creation (2-step) | High | Medium | Use Prisma transaction (`$transaction`) for atomic user+hospital creation |
| Appointment status state machine has edge cases | Medium | Medium | Strict validation on server, frontend only shows valid transitions |
| Report queries are slow at scale | Low | Medium | Add date range limits (max 1 year), use indexing on Booking.bookingDate and Booking.status |
| Slider image upload (future) needs storage | Low | Low | MVP uses URL input, file upload can be added later with cloud storage |
| Recharts bundle size | Low | Low | Already available in project, lazy-load chart components if needed |

---

## Appendix A: PHP Original → Next.js Mapping

| PHP Controller | PHP Methods | Next.js Pages | Next.js APIs |
|---------------|-------------|---------------|-------------|
| `admin/Dashboard` | index, user_view, update_status, update_admin_profile, upload_profile_img | `/dashboard/admin`, `/dashboard/admin/users`, `/dashboard/admin/profile` | stats, users, users/[id]/status, profile |
| `admin/Appointment` | index, extend, approve, visited, cancel, charges_income | `/dashboard/admin/appointments`, `/dashboard/admin/income` | appointments, appointments/[id]/status, income |
| `admin/Doctor` | index, update_status, profile_view, edit, edit_profile, edit_profile_validate | `/dashboard/admin/doctors`, `/dashboard/admin/doctors/[id]`, `/dashboard/admin/doctors/[id]/edit` | doctors, doctors/[id] |
| `admin/Hospital` | index, add, edit, profile_view, edit_profile, distroy, city_by_state | `/dashboard/admin/hospitals`, `/dashboard/admin/hospitals/add`, `/dashboard/admin/hospitals/[id]`, `/dashboard/admin/hospitals/[id]/edit` | hospitals, hospitals/[id] |
| `admin/Blog` | index, update_status, add, distroy, update | `/dashboard/admin/blog` | blog, blog/[id] |
| `admin/Inquiry` | index, update_status, show, reply, distroy | `/dashboard/admin/inquiries` | inquiries |
| `admin/Type_master` | index, add, edit, update_status, distroy | `/dashboard/admin/doctor-types` | doctor-types, doctor-types/[id] |
| `admin/Disease_master` | index, add, edit, update_status, distroy | `/dashboard/admin/disease-types` | disease-types, disease-types/[id] |
| `admin/Slider` | index, add, edit, update_status, distroy | `/dashboard/admin/sliders` | sliders, sliders/[id] |
| `admin/Config` | index, update | `/dashboard/admin/charges` | charges |
| `admin/Report` | index, user_report, appointment_report, income_report, hospital_income_report | `/dashboard/admin/reports`, `/dashboard/admin/income`, `/dashboard/admin/reports/users`, `/dashboard/admin/reports/appointments`, `/dashboard/admin/reports/income-hospital` | income, reports/* |

---

## Appendix B: Appointment Status State Machine

```
                    ┌──────────┐
                    │ Pending  │ (initial)
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
        ┌──────────┐ ┌────────┐ ┌──────────┐
        │ Approve  │ │Canceled│ │  Extend  │
        └────┬─────┘ └────────┘ └────┬─────┘
             │                        │
      ┌──────┼──────┐               │
      ▼      ▼      ▼               ▼
┌──────────┐ ┌────┐ ┌────────┐ ┌────────┐
│ Visited  │ │Fin.│ │Canceled│ │Approve │
└────┬─────┘ └────┘ └────────┘ └────────┘
     │
     ▼
┌──────────┐
│  Finish  │ (terminal)
└──────────┘

Terminal states: Finish, Canceled (no further transitions)
```

**Valid Transitions Table**:

| From \ To | Approve | Visited | Extend | Canceled | Finish |
|-----------|---------|---------|--------|----------|--------|
| Pending   | ✅      | ❌      | ❌     | ✅       | ❌     |
| Approve   | ❌      | ✅      | ✅     | ✅       | ❌     |
| Visited   | ❌      | ❌      | ❌     | ✅       | ✅     |
| Extend    | ✅      | ❌      | ❌     | ✅       | ❌     |
| Finish    | ❌      | ❌      | ❌     | ❌       | ❌     |
| Canceled  | ❌      | ❌      | ❌     | ❌       | ❌     |

---

## Appendix C: Notification Messages on Status Change

When admin changes appointment status, create notifications:

| Action | Patient Notification | Doctor Notification |
|--------|---------------------|-------------------|
| Approve | "Your appointment #{no} with Dr. {name} has been approved" | "New appointment #{no} approved for {patient}" |
| Cancel | "Your appointment #{no} has been canceled by admin" | "Appointment #{no} for {patient} has been canceled" |
| Extend | "Your appointment #{no} has been extended" | "Appointment #{no} for {patient} has been extended" |
| Visited | "Appointment #{no} marked as visited" | — |
| Finish | "Appointment #{no} completed successfully" | — |

---

*End of Admin Module Complete Implementation Plan*
