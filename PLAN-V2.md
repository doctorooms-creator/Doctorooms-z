# 🏥 Hospital Management System — Architecture Plan V2
# Based on Full Codebase Analysis (Post-Implementation Audit)
# Generated: 2025

---

## 📌 EXECUTIVE SUMMARY

Original PLAN.md had 7 phases. Deep codebase audit reveals:
- **Phases 1-3 are ~80% built** (core hospital mode works)
- **Phase 4 is ~60% built** (pharmacist has critical gaps)
- **Phases 5-6 are ~60% built** (doctor/patient have gaps)
- **Phase 7 is ~10% built** (only polling works)
- **8 CRITICAL BUGS** found that break hospital mode in production
- **1 BROKEN END-TO-END FLOW** (public hospital booking)

This plan reorganizes work into **fix-first, then complete** order.

---

## 🔴 CRITICAL BUGS (Fix First — Hospital Mode is Broken Without These)

### BUG-1: Receptionist Status Changes Blocked [CRITICAL]
**File:** `src/app/api/dashboard/receptionist/bookings/[id]/status/route.ts`
**Line:** 79
**Problem:** `if (booking.doctorId !== receptionist.doctorId)` — In hospital mode, `receptionist.doctorId` is `null`, so **ALL status transitions (Extend, Visited, Approve, Canceled) fail with 404**.
**Impact:** Receptionist cannot extend, approve, or mark any patient as visited in hospital mode.
**Fix:**
```ts
// BEFORE (line 79):
if (booking.doctorId !== receptionist.doctorId) {
  return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
}

// AFTER:
if (receptionist.hospitalId && !receptionist.doctorId) {
  // Hospital mode: verify booking belongs to this hospital
  if (booking.hospitalId !== receptionist.hospitalId) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }
} else {
  // Clinic mode: verify booking belongs to the receptionist's doctor
  if (booking.doctorId !== receptionist.doctorId) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }
}
```
---

### BUG-2: Receptionist Reject Blocked [CRITICAL]
**File:** `src/app/api/dashboard/receptionist/bookings/[id]/reject/route.ts`
**Line:** 34, 36
**Problem:** Same `receptionist.doctorId` null issue. `select: { doctorId: true }` doesn't fetch `hospitalId`. **ALL reject operations fail in hospital mode.**
**Impact:** Receptionist cannot reject any pending online booking.
**Fix:**
```ts
// BEFORE (line 34):
select: { doctorId: true }
// AFTER:
select: { doctorId: true, hospitalId: true }

// BEFORE (line 36):
if (booking.doctorId !== receptionist.doctorId) {
// AFTER:
if (receptionist.hospitalId && !receptionist.doctorId) {
  if (booking.hospitalId !== receptionist.hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
} else {
  if (booking.doctorId !== receptionist.doctorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
}
```
---

### BUG-3: Receptionist Patients Returns Empty [HIGH]
**File:** `src/app/api/dashboard/receptionist/patients/route.ts`
**Lines:** 23, 29, 57, 68
**Problem:** 4 places use `doctorId: receptionist.doctorId` which is `null` in hospital mode → **returns 0 patients**.
**Impact:** Hospital receptionist sees no patient directory.
**Fix:** Add `isHospitalMode` pattern (same as `stats/route.ts`):
```ts
// After fetching receptionist (line 11):
const isHospitalMode = !!receptionist.hospitalId && !receptionist.doctorId

// If hospital mode, fetch doctor IDs:
let doctorIds: string[] = []
if (isHospitalMode) {
  const dhLinks = await db.doctorHospital.findMany({
    where: { hospitalId: receptionist.hospitalId, status: 'Active' },
    select: { doctorId: true }
  })
  doctorIds = dhLinks.map(d => d.doctorId)
}

// Replace ALL 4 occurrences of:
//   doctorId: receptionist.doctorId
// With:
//   doctorId: isHospitalMode ? { in: doctorIds } : receptionist.doctorId,
//   ...(isHospitalMode ? { hospitalId: receptionist.hospitalId } : {})
```
---

### BUG-4: Receptionist Reports Crashes [HIGH]
**File:** `src/app/api/dashboard/receptionist/reports/route.ts`
**Lines:** 12, 28, 37
**Problem:** `select: { doctorId: true }` doesn't fetch `hospitalId`. Queries use null `doctorId`.
**Impact:** Reports page returns empty data or crashes for hospital receptionists.
**Fix:** Same `isHospitalMode` pattern. Add `hospitalId` to select. When hospital mode, fetch `doctorIds` and query with `{ doctorId: { in: doctorIds }, hospitalId }`.
---

### BUG-5: Pharmacist Medicines Crashes [HIGH]
**File:** `src/app/api/dashboard/pharmacist/medicines/route.ts`
**Lines:** 9-10, 20, 59, 101-103, 150-152
**Problem:** ALL CRUD operations use `pharmacist.doctorId` which is `null` for hospital pharmacists.
**Impact:** Hospital pharmacist cannot view, add, edit, or delete any medicines.
**Fix:**
```ts
// Add hospital mode detection:
const isHospitalMode = !!pharmacist.hospitalId && !pharmacist.doctorId

// For hospital mode, medicines should be hospital-scoped (not doctor-scoped)
// Option A: Use hospitalId as the scope
//   where: { hospitalId: pharmacist.hospitalId }
// Option B: If medicines must stay doctor-scoped, fetch all hospital doctorIds
//   where: { userId: { in: doctorIds } }
// RECOMMENDED: Option A — hospital pharmacist manages hospital-level medicine inventory
```
**Note:** This requires deciding whether medicines are doctor-level or hospital-level. In a real hospital, pharmacy inventory is hospital-level, not per-doctor. May need schema consideration.
---

### BUG-6: Public Hospital Booking Flow Broken [CRITICAL]
**Files:**
- `src/app/hospitals/[id]/departments/[departmentId]/page.tsx` (line 391)
- `src/app/book/page.tsx` (line 12-13)
- `src/app/dashboard/patient/book/[doctorId]/page.tsx`
- `src/app/api/patient/bookings/route.ts`

**Problem Chain:**
1. Public department page links to `/book?doctorId=X&hospitalId=Y&departmentId=Z`
2. `/book/page.tsx` **ignores ALL query params** and redirects to `/doctors`
3. Even if fixed, `/dashboard/patient/book/[doctorId]` **doesn't accept hospitalId/departmentId**
4. Even if frontend sends them, `POST /api/patient/bookings` **doesn't store hospitalId/departmentId**
5. Even if stored, notification goes to wrong receptionist (queries by `doctorId` only, line 149-155)

**Impact:** Patients browsing hospital → department → doctor CANNOT book. The entire public hospital booking funnel is dead.

**Fix (3 files):**

**File A: `/app/book/page.tsx`** — Read query params and redirect properly:
```ts
// BEFORE:
useEffect(() => {
  toast.info('Please select a doctor first')
  router.replace('/doctors')
}, [router])

// AFTER:
useEffect(() => {
  const doctorId = searchParams.get('doctorId')
  if (doctorId) {
    router.replace(`/dashboard/patient/book/${doctorId}`)
  } else {
    toast.info('Please select a doctor first')
    router.replace('/doctors')
  }
}, [router, searchParams])
```

**File B: `/dashboard/patient/book/[doctorId]/page.tsx`** — Read `hospitalId`/`departmentId` from `searchParams`, pass to booking API.

**File C: `/api/patient/bookings/route.ts`** — Accept and store `hospitalId`, `departmentId`:
```ts
// Add to destructured body (line ~18):
const { ..., hospitalId, departmentId } = body

// Validate hospitalId + departmentId combo if provided
if (hospitalId) {
  const dhLink = await db.doctorHospital.findFirst({
    where: { doctorId, hospitalId, departmentId: departmentId || undefined, status: 'Active' }
  })
  if (!dhLink) {
    return NextResponse.json({ error: 'Doctor is not available at this hospital/department' }, { status: 400 })
  }
}

// Add to db.booking.create data:
hospitalId: hospitalId || undefined,
departmentId: departmentId || undefined,

// Fix notification: send to hospital receptionists instead of clinic receptionist (line 149):
if (hospitalId) {
  const hospitalReceptionists = await db.receptionist.findMany({
    where: { hospitalId }
  })
  for (const rec of hospitalReceptionists) {
    await db.notification.create({ ... })
  }
} else {
  // existing clinic notification logic
}
```
---

### BUG-7: Patient Appointment Detail API Missing Token Fields [MEDIUM]
**File:** `src/app/api/dashboard/patient/appointments/[id]/route.ts`
**Problem:** Doesn't return `tokenNumber`, `hospitalId`, `departmentId`.
**Impact:** Patient detail page can't show token info without a separate API call.
**Fix:** Add `tokenNumber`, `hospitalId`, `departmentId`, `receptionistId` to the select/query.
---

### BUG-8: Receptionist Notification Wrong Scoping [MEDIUM]
**File:** `src/app/api/patient/bookings/route.ts`
**Line:** 149-155
**Problem:** `receptionist = db.receptionist.findFirst({ where: { doctorId: booking.doctorId } })` — only finds clinic receptionists, not hospital receptionists.
**Impact:** When a patient books a hospital doctor online, NO receptionist gets notified.
**Fix:** If booking has `hospitalId`, find ALL receptionists with that `hospitalId`.
---

---

## 🟡 INCOMPLETE FEATURES (Build After Bugs Fixed)

### INCOMPLETE-1: Pharmacist Prescriptions Page Missing Hospital Mode
**File:** `src/app/dashboard/pharmacist/prescriptions/page.tsx`
**Current State:** Shows prescription cards but NO hospital mode awareness.
**Missing:**
- `doctorName`, `departmentName`, `hospitalName` in TypeScript interface (lines 48-60)
- Doctor name/department column in card display
- Fulfillment status badges (Pending/Packed/Dispensed)
- "Mark as Packed" / "Mark as Dispensed" action buttons
- Filter by doctor, department, fulfillment status
- Search is patient-name-only

**What API Already Returns:** The `GET /api/dashboard/pharmacist/prescriptions` API already returns `isHospitalMode`, `doctorName`, `departmentName`, `fulfillmentStatus`, `packedBy` — the frontend just ignores it.

**Work Needed:**
1. Update `Prescription` interface to include: `doctorName`, `departmentName`, `hospitalName`, `fulfillmentStatus`, `packedBy`, `packedAt`
2. Add filter bar: Doctor dropdown, Department dropdown, Fulfillment status tabs
3. Add doctor name badge on each prescription card
4. Add fulfillment status badge (color-coded)
5. Add "Mark as Packed" / "Mark as Dispensed" dropdown/button
6. Pass `doctorId`, `departmentId`, `fulfillmentStatus` query params to API
---

### INCOMPLETE-2: Print Queue Page Missing Hospital Mode
**File:** `src/app/dashboard/receptionist/print-queue/page.tsx`
**Current State:** Print table with columns: #, Patient, Disease, Time Slot, Mode, Status, Type.
**Missing:**
- `tokenNumber` column (the most important field for OPD!)
- `doctorName` column (which doctor's queue is this patient in?)
- Hospital name in print header
- `isHospitalMode` branching

**Work Needed:**
1. Add `tokenNumber`, `tokenOrder`, `doctorName` to `QueueItem` interface
2. Add `isHospitalMode`, `hospital` to `QueueData` interface
3. Add Token # column (after # column)
4. Add Doctor column (conditionally, only in hospital mode)
5. Show hospital name in print header
---

### INCOMPLETE-3: Patient Dashboard Home Missing Queue Info
**File:** `src/app/dashboard/patient/page.tsx`
**Current State:** Upcoming appointments show: doctor name, disease, date, status. No queue/token info.
**Missing:**
- Token number badge on upcoming appointments
- Queue position indicator
- Hospital name/department for hospital bookings

**What Already Works:** The appointments LIST page (`/dashboard/patient/appointments`) already shows `Queue #N` badges. The DETAIL page shows full queue section. Only the main dashboard home is missing it.

**Work Needed:**
1. Add `tokenNumber`, `hospitalId`, `departmentId` to `upcomingList` interface
2. Fetch queue positions for approved hospital bookings (parallel calls to `/api/patient/bookings/queue`)
3. Show token badge (violet) and queue position on each upcoming appointment card
---

### INCOMPLETE-4: Hospital Appointments Page Missing Token Info
**File:** `src/app/dashboard/hospital/appointments/page.tsx`
**Current State:** Table with: Patient, Doctor, Date, Type, Status, Fee.
**Missing:**
- `tokenNumber` column
- Department name column
- Department filter

**Work Needed:**
1. Add `tokenNumber`, `departmentId`, `departmentName` to `HospitalAppointment` interface
2. Add Token # column in table
3. Add Department column in table
4. Add Department filter dropdown
---

### INCOMPLETE-5: Doctor Prescription Print Missing Hospital Context
**File:** `src/app/dashboard/doctor/prescriptions/` (print view)
**Current State:** Print view shows doctor's `hospitalAddress` (free-text field) but no hospital name, no department.
**Missing:**
- Hospital name on printed prescription
- Department name + floor/OPD room
- This is what patients carry to the pharmacy — they need to know where to go

**Work Needed:**
1. When doctor has hospital link, include hospital name, department, floor, OPD room in print data
2. Render hospital header on prescription print
---

### INCOMPLETE-6: Doctor Dashboard — Receptionist Name Not Rendered
**File:** `src/app/dashboard/doctor/page.tsx` (OPDQueueSection)
**Current State:** API returns `receptionistName` per queue item. Frontend declares it in interface but **never renders it**.
**Impact:** Doctor can't see which receptionist registered which patient.
**Work Needed:** Add small text showing `via R. {receptionistName}` under each queue item.
---

---

## ❌ NOT YET BUILT (New Development)

### NEW-1: Queue Display Board (TV/Monitor)
**Planned Route:** `/hospital/[id]/queue-display` (public, no login)
**Purpose:** Full-screen display for hospital waiting areas showing live OPD queue.
**Features:**
- Auto-cycle through departments (every 10 seconds)
- Per department: Doctor name, Currently Serving token, Next 5 tokens
- Large font, high contrast (dark bg + bright text for TV screens)
- Date/time display
- Hospital name + logo header
- Data source: `GET /api/queue/hospital/[hospitalId]` (already exists!)
- Auto-refresh every 15 seconds

**API Needed:** Public version of hospital queue API (no auth required)
**Route:** `GET /api/public/hospital/[hospitalId]/queue`
---

### NEW-2: Token Call Notifications
**Purpose:** Push notifications when patient's token is approaching.
**Triggers:**
- Patient is 2 tokens away from being called
- Patient's token is now being served
- Patient's consultation is finished

**Implementation Options:**
- Option A: In-app notifications (Notification table) — checked on patient queue API poll
- Option B: Sound alert on queue display board
- Option C: SMS (requires third-party service)
**Recommendation:** Option A (in-app) for now, Option B (sound) in Phase 7.

---

## 📊 REVISED PHASE PLAN

### 🔴 PHASE A: Critical Bug Fixes (Must Do First)
> **Goal:** Make hospital mode actually functional. Without these, hospital receptionists are locked out.

| # | Task | File(s) | Effort | Priority |
|---|------|---------|--------|----------|
| A1 | Fix receptionist status change auth | `bookings/[id]/status/route.ts` | 10 min | 🔴 P0 |
| A2 | Fix receptionist reject auth | `bookings/[id]/reject/route.ts` | 10 min | 🔴 P0 |
| A3 | Fix receptionist patients query | `patients/route.ts` | 20 min | 🔴 P0 |
| A4 | Fix receptionist reports query | `reports/route.ts` | 15 min | 🔴 P0 |
| A5 | Fix pharmacist medicines CRUD | `medicines/route.ts` | 25 min | 🔴 P0 |
| A6 | Fix public booking flow (3 files) | `book/page.tsx`, `book/[doctorId]`, `bookings/route.ts` | 45 min | 🔴 P0 |
| A7 | Fix patient appointment detail API | `appointments/[id]/route.ts` | 10 min | 🟡 P1 |
| A8 | Fix booking notification scoping | `bookings/route.ts` | 10 min | 🟡 P1 |

**Total Phase A: ~2.5 hours**

---

### 🟡 PHASE B: Complete Incomplete Features
> **Goal:** Make all existing pages fully hospital-aware.

| # | Task | File(s) | Effort | Priority |
|---|------|---------|--------|----------|
| B1 | Pharmacist prescriptions page — hospital mode | `prescriptions/page.tsx` | 60 min | 🟡 P1 |
| B2 | Print queue page — hospital mode | `print-queue/page.tsx` | 30 min | 🟡 P1 |
| B3 | Patient dashboard — queue badges | `patient/page.tsx` | 30 min | 🟡 P1 |
| B4 | Hospital appointments — token/department columns | `hospital/appointments/page.tsx` | 25 min | 🟡 P1 |
| B5 | Doctor prescription print — hospital context | `prescriptions/print-view.tsx` | 20 min | 🟢 P2 |
| B6 | Doctor dashboard — show receptionist name | `doctor/page.tsx` | 10 min | 🟢 P2 |

**Total Phase B: ~3 hours**

---

### 🟢 PHASE C: New Features
> **Goal:** Add features that don't exist yet.

| # | Task | Description | Effort | Priority |
|---|------|-------------|--------|----------|
| C1 | Queue Display Board (TV) | Public `/hospital/[id]/queue-display` + public API | 90 min | 🟢 P2 |
| C2 | Token Call Notifications | In-app notifications on queue events | 45 min | 🔵 P3 |
| C3 | Seed Data Update | Hospital receptionists + pharmacists for all hospitals | 15 min | 🟢 P2 |

**Total Phase C: ~2.5 hours**

---

## 📋 COMPLETE FILE CHANGE MATRIX

### Files to MODIFY (with exact changes):

| File | Phase | Change Type | Lines Affected |
|------|-------|-------------|----------------|
| `src/app/api/dashboard/receptionist/bookings/[id]/status/route.ts` | A1 | Bug Fix — hospital auth | ~Line 79 |
| `src/app/api/dashboard/receptionist/bookings/[id]/reject/route.ts` | A2 | Bug Fix — hospital auth | Lines 34, 36 |
| `src/app/api/dashboard/receptionist/patients/route.ts` | A3 | Bug Fix — isHospitalMode | Lines 11-68 (4 locations) |
| `src/app/api/dashboard/receptionist/reports/route.ts` | A4 | Bug Fix — isHospitalMode | Lines 12, 28, 37 |
| `src/app/api/dashboard/pharmacist/medicines/route.ts` | A5 | Bug Fix — hospital scope | Lines 9-152 (5 locations) |
| `src/app/book/page.tsx` | A6 | Bug Fix — read query params | Lines 12-13 |
| `src/app/dashboard/patient/book/[doctorId]/page.tsx` | A6 | Feature — accept hospital params | State + handleBook |
| `src/app/api/patient/bookings/route.ts` | A6+A8 | Bug Fix — store hospitalId + notification | Lines 18, 122, 149-155 |
| `src/app/api/dashboard/patient/appointments/[id]/route.ts` | A7 | Bug Fix — add token fields | Select/query |
| `src/app/dashboard/pharmacist/prescriptions/page.tsx` | B1 | Feature — hospital mode UI | Interface + UI + filters |
| `src/app/dashboard/receptionist/print-queue/page.tsx` | B2 | Feature — hospital mode UI | Interface + columns + header |
| `src/app/dashboard/patient/page.tsx` | B3 | Feature — queue badges | Interface + card UI |
| `src/app/dashboard/hospital/appointments/page.tsx` | B4 | Feature — token/dept columns | Interface + table |
| `src/app/dashboard/doctor/prescriptions/*/print-view.tsx` | B5 | Feature — hospital header | Print layout |
| `src/app/dashboard/doctor/page.tsx` | B6 | Feature — receptionist name | OPDQueueSection |

### Files to CREATE:

| File | Phase | Description |
|------|-------|-------------|
| `src/app/hospital/[id]/queue-display/page.tsx` | C1 | TV display board (public) |
| `src/app/api/public/hospital/[hospitalId]/queue/route.ts` | C1 | Public queue API (no auth) |

---

## 🏗️ ARCHITECTURE REFERENCE

### Dual-Mode Pattern (Canonical Implementation)
Every API that needs hospital support should follow this pattern from `stats/route.ts`:

```typescript
// 1. Fetch receptionist/pharmacist with BOTH fields
const receptionist = await db.receptionist.findUnique({
  where: { userId: user.id },
  select: { doctorId: true, hospitalId: true }
})

// 2. Determine mode
const isHospitalMode = !!receptionist.hospitalId && !receptionist.doctorId

// 3. Hospital mode: resolve doctor IDs
if (isHospitalMode) {
  const dhLinks = await db.doctorHospital.findMany({
    where: { hospitalId: receptionist.hospitalId, status: 'Active' },
    select: { doctorId: true }
  })
  const doctorIds = dhLinks.map(d => d.doctorId)
  // Query with: { doctorId: { in: doctorIds }, hospitalId: receptionist.hospitalId }
}

// 4. Clinic mode: same as before
else {
  // Query with: { doctorId: receptionist.doctorId }
}
```

### Auth Pattern for Receptionist APIs
For authorization checks on bookings:
```typescript
// HOSPITAL: scope by hospitalId
if (receptionist.hospitalId && !receptionist.doctorId) {
  if (booking.hospitalId !== receptionist.hospitalId) {
    return 403/404
  }
}
// CLINIC: scope by doctorId
else {
  if (booking.doctorId !== receptionist.doctorId) {
    return 403/404
  }
}
```

### Token Generation
Already implemented in `src/lib/token-utils.ts`:
- `generateTokenNumber(doctorId, departmentId)` → `CARD-001` format
- `getQueuePosition(doctorId, bookingId, bookingCreatedAt)` → position count
- Called from: walk-in POST (hospital mode) and approve PATCH (hospital mode)
- NOT a standalone API — generation is inline within existing flows

### Queue APIs (All Working)
| API | Auth | Returns | Used By |
|-----|------|---------|----------|
| `GET /api/queue/doctor/[doctorId]` | doctor, reception, admin | Single doctor's queue + stats + currentServing | Doctor dashboard (15s poll) |
| `GET /api/queue/hospital/[hospitalId]` | reception, admin | All depts → doctors → queues hierarchy | Receptionist queue page (15s poll) |
| `GET /api/patient/bookings/queue?bookingId=X` | patient | My token, position, patients ahead, wait time | Patient appointment detail (30s poll) |

---

## 📐 DATA FLOW DIAGRAMS

### Hospital Booking Flow (Current — BROKEN)
```
Patient visits /hospitals/[id]
  → Clicks department
  → /hospitals/[id]/departments/[deptId]
  → Clicks "Book" on doctor card
  → /book?doctorId=X&hospitalId=Y&departmentId=Z  ❌ IGNORES PARAMS
  → Redirects to /doctors  ❌ WRONG DESTINATION
```

### Hospital Booking Flow (Fixed)
```
Patient visits /hospitals/[id]
  → Clicks department
  → /hospitals/[id]/departments/[deptId]
  → Clicks "Book" on doctor card
  → /book?doctorId=X&hospitalId=Y&departmentId=Z  ✅ READS PARAMS
  → Redirects to /dashboard/patient/book/X  ✅ CORRECT
  → Patient fills form (disease, description, date, slot)
  → POST /api/patient/bookings { doctorId, hospitalId, departmentId, ... }  ✅ STORES
  → Booking created with status "Pending"
  → Notification sent to ALL hospital receptionists  ✅ CORRECT
  → Receptionist sees in pending pool (shared)
  → Receptionist clicks Approve
  → Token generated (CARD-003)  ✅ AUTO
  → Patient sees token on appointment detail page  ✅ WORKS
```

### Hospital OPD Walk-in Flow (Already Working)
```
Receptionist clicks "OPD Walk-in"
  → Selects Department (dropdown)
  → Selects Doctor (dropdown, filtered by dept)
  → Fills patient form
  → POST /api/dashboard/receptionist/walk-in
  → Token generated (CARD-003)  ✅ AUTO
  → Booking created: status="Approve", tokenNumber, tokenOrder, receptionistId
  → Appears in doctor's queue (15s poll)
  → Appears on queue display board (if built)
  → Doctor sees in OPD Queue section
```

### Prescription → Pharmacy Flow (Already Working)
```
Doctor creates prescription (6-step stepper)
  → Finalizes prescription
  → Prescription stored with status="Active", fulfillmentStatus="Pending"
  → Hospital pharmacist sees it (queries all hospital doctors)  ✅ AUTO
  → Pharmacist clicks "Mark as Packed"  ✅ API EXISTS
  → fulfillmentStatus="Packed", packedBy=pharmacistId, packedAt=now()
  → Pharmacist clicks "Mark as Dispensed"
  → fulfillmentStatus="Dispensed"
```

---

## 🎯 BUILD ORDER (Recommended Execution Sequence)

```
STEP 1: BUG-1 + BUG-2 (Receptionist status/reject)     ← 20 min, unblocks hospital OPD
STEP 2: BUG-3 + BUG-4 (Receptionist patients/reports)  ← 35 min, unblocks patient directory
STEP 3: BUG-5 (Pharmacist medicines)                    ← 25 min, unblocks pharmacy
STEP 4: BUG-6 (Public booking flow - 3 files)           ← 45 min, unblocks patient funnel
STEP 5: BUG-7 + BUG-8 (Patient detail + notifications)  ← 20 min, complete patient flow
STEP 6: INCOMPLETE-1 (Pharmacist prescriptions page)    ← 60 min, complete pharmacy UX
STEP 7: INCOMPLETE-2 (Print queue page)                  ← 30 min, complete receptionist UX
STEP 8: INCOMPLETE-3 + 4 (Patient dashboard + Hospital appointments) ← 55 min
STEP 9: INCOMPLETE-5 + 6 (Doctor print + receptionist name)  ← 30 min
STEP 10: NEW-1 (Queue Display Board)                   ← 90 min, new feature
STEP 11: NEW-2 + NEW-3 (Notifications + Seed data)      ← 60 min, polish
```

**Total Estimated: ~8 hours of development**

---

## ⚠️ ARCHITECTURAL DECISIONS NEEDED

### Decision 1: Hospital Medicine Inventory Scope
**Question:** Should medicines be doctor-level or hospital-level?
- **Current:** Medicines are stored per-doctor (`doctorMedicine.userId = doctor's userId`)
- **Hospital pharmacist:** `doctorId` is null → no scope to query
- **Options:**
  - A) Hospital pharmacists see medicines from ALL hospital doctors (union query)
  - B) Medicines get a `hospitalId` field for hospital-level inventory
  - C) Medicines stay doctor-scoped, pharmacist just sees combined view

**Recommendation:** Option A for now (simplest, no schema change). Hospital pharmacist queries `userId: { in: doctorIds }`.

### Decision 2: Queue Display Board — Public or Auth-Required?
**Question:** Should the TV display board require login?
- **Real hospitals:** TV displays are public (in waiting halls)
- **Security:** Queue shows patient names — privacy concern
- **Options:**
  - A) Public, show only token numbers (no names) — like real hospital displays
  - B) Auth-required, show full details
  - C) Public with minimal info (token + department, no names)

**Recommendation:** Option A — public, token numbers only. This matches real hospital behavior.

### Decision 3: Patient Booking — Hospital vs Direct Doctor
**Question:** When patient books from public pages, should `hospitalId`/`departmentId` be mandatory?
- If patient goes through hospital → department → doctor flow: YES (auto-filled)
- If patient goes through `/doctors` listing (direct): NO (doctor may be in multiple hospitals)

**Recommendation:** Auto-fill when available, optional otherwise. The booking API should accept but not require `hospitalId`/`departmentId`.
