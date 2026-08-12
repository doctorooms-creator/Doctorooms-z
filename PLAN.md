# 🏥 Hospital Management System — Comprehensive Development Plan

## 📌 Current State Summary

### What's Built (Working Modules):
- ✅ **Admin Dashboard** — User management, hospital/doctor listing, settings
- ✅ **Doctor Dashboard** — Full prescription system (6-step stepper), appointments, schedule, patients, medicines
- ✅ **Receptionist Dashboard** — Appointments, walk-in, pending bookings, print queue (CLINIC MODE)
- ✅ **Assistant Dashboard** — Appointments, patients, Rx queue (linked to 1 doctor)
- ✅ **Pharmacist Dashboard** — Prescriptions, medicines (linked to 1 doctor)
- ✅ **Patient Dashboard** — Booking, health records, feedback, notifications
- ✅ **Hospital Dashboard** — Departments CRUD, doctor-department linking, stats
- ✅ **Public Pages** — Hospital listing, department browsing, doctor selection, booking
- ✅ **Auth System** — Login, register, role-based session
- ✅ **Schema** — Hospital, Department, DoctorHospital junction, Receptionist (with hospitalId), Booking (with hospitalId/departmentId/tokenNumber)

### What's Missing (For Hospital Mode):
- ❌ Admin CANNOT create staff with hospital association (only lists users)
- ❌ Receptionist works in CLINIC mode only (filtered by doctorId), not HOSPITAL mode
- ❌ Pharmacist works in CLINIC mode only (filtered by doctorId), not HOSPITAL mode
- ❌ No OPD Token/Queue system (tokenNumber field exists but never generated)
- ❌ No shared online booking pool for multiple receptionists
- ❌ No doctor-specific queue display
- ❌ No hospital-level prescription routing to pharmacy

### Key Architecture Insight:
```
CLINIC MODE (Current - Working):           HOSPITAL MODE (Needed):
1 Doctor ← 1 Receptionist                  Hospital
     ↓                                        ├── Doctor X ← Reception B1, B2
     ↓                                        ├── Doctor Y ← Reception B1, B2
1 Assistant                                 ├── Pharmacist (hospital-level)
     ↓                                        └── Assistant Z1 → Doctor X
1 Pharmacist                                  

Same modules, different data scope!
```

---

## 🗺️ Development Phases

---

## PHASE 1: Schema Changes & Admin Staff Management
**Goal:** Admin creates staff (Doctor/Receptionist/Pharmacist) and associates them with hospital

### 1A. Schema Changes

#### Change 1: DoctorPharmacist — Add hospitalId
```
Current: DoctorPharmacist { doctorId (required), userId }
New:    DoctorPharmacist { doctorId (optional), hospitalId (optional), userId }
```
- `doctorId` becomes optional (for hospital pharmacists, no single doctor)
- `hospitalId` added (for hospital pharmacists)
- At least one of doctorId/hospitalId must be set
- If `hospitalId` is set → pharmacist sees ALL prescriptions from ALL doctors in that hospital

#### Change 2: Receptionist — Make doctorId optional for hospital mode
```
Current: Receptionist { doctorId (required), hospitalId (optional), departmentId (optional) }
New:    Receptionist { doctorId (optional), hospitalId, departmentId (optional) }
```
- `doctorId` becomes optional (hospital receptionists don't link to 1 doctor)
- `hospitalId` becomes required (every receptionist must belong to somewhere)
- If `hospitalId` set + `doctorId` null → Hospital receptionist (sees multiple doctors)
- If `hospitalId` set + `doctorId` set → Department-specific receptionist
- If `hospitalId` null + `doctorId` set → Clinic receptionist (backward compatible)

#### Change 3: Booking — Add token tracking fields
```
Current: Booking { tokenNumber (string, unused) }
New:    Booking { tokenNumber, tokenOrder (Int), receptionistId (String?) }
```
- `tokenNumber`: e.g. "CARD-015" (Department prefix + sequence)
- `tokenOrder`: Integer for queue position sorting (auto-increment per doctor per day)
- `receptionistId`: Which receptionist processed this booking

#### Change 4: New model — HospitalPharmacist (or extend DoctorPharmacist)
- Simpler approach: Just add `hospitalId` to `DoctorPharmacist` (no new model needed)

### 1B. Admin API — Create Staff for Hospital

#### New API: `POST /api/dashboard/admin/hospitals/[hospitalId]/staff`
- Admin selects hospital, then creates staff:
  - Role: doctor / receptionist / assistant / pharmacist
  - Name, email, password, phone, gender
  - For doctor: also select department, designation, fees, OPD timings
  - For receptionist: also select department (optional)
  - For pharmacist: no extra fields
  - For assistant: also select which doctor to associate with
- Creates User (with role) + Role-specific profile (Doctor/Receptionist/etc.) + Hospital link

#### New API: `GET /api/dashboard/admin/hospitals/[hospitalId]/staff`
- List all staff members of a hospital (grouped by role)
- Support filter by role, search by name

#### New API: `DELETE /api/dashboard/admin/hospitals/[hospitalId]/staff/[staffUserId]`
- Remove staff member from hospital (deactivate user + remove links)

### 1C. Admin UI — Staff Management Page

#### New Page: `/dashboard/admin/hospitals/[id]/staff`
- Or enhance existing `/dashboard/admin/hospitals/page.tsx` with a "Manage Staff" action per hospital
- Staff list grouped by role: Doctors, Receptionists, Assistants, Pharmacists
- "Add Staff" button → Dialog with:
  - Role selector (Doctor/Receptionist/Assistant/Pharmacist)
  - Form fields based on selected role
  - For Doctor: Department dropdown, designation, fees
  - For Assistant: Doctor dropdown (to associate)
- Staff cards with: name, email, role badge, status, department, actions

### 1D. Seed Data Update
- Update seed script to create hospital-level receptionists (2-3 per hospital)
- Update seed script to create hospital-level pharmacists (1 per hospital)
- Ensure all hospital staff have proper hospitalId links

---

## PHASE 2: Hospital Receptionist Dashboard (Multi-Doctor Mode)
**Goal:** Receptionist works for HOSPITAL (not 1 doctor) — sees multiple doctors, shared queue

### 2A. Receptionist Stats API — Hospital Mode

#### Update: `GET /api/dashboard/receptionist/stats`
```
IF receptionist.hospitalId is set:
  - Show hospital info (instead of single doctor info)
  - todayAppointments = count of bookings WHERE hospitalId = X AND today
  - todayVisited = count WHERE hospitalId = X AND status=Visited AND today
  - pendingApprovals = count WHERE hospitalId = X AND status=Pending
  - todayAppointmentsList = bookings for ALL doctors in hospital
  - departments = list of hospital's departments with today's patient count
  
ELSE (clinic mode - backward compatible):
  - Same as current (filter by doctorId)
```

### 2B. Receptionist Appointments — Hospital Mode

#### Update: `GET /api/dashboard/receptionist/appointments`
```
IF hospitalId:
  - Show appointments for ALL doctors in hospital
  - Filter by: doctor, department, status, date
  - Group by doctor or department view
ELSE:
  - Same as current (filter by doctorId)
```

### 2C. Walk-in Registration — Hospital Mode

#### Update: `POST /api/dashboard/receptionist/walk-in`
```
IF hospitalId:
  - Step 1: Select Department (dropdown of hospital's active departments)
  - Step 2: Select Doctor (dropdown of doctors in selected department)
  - Step 3: Patient details (name, phone, age, gender, etc.)
  - Step 4: Generate Token Number (auto: DEPT_PREFIX-TODAY_SEQUENCE)
  - Step 5: Create Booking with:
    - doctorId, hospitalId, departmentId
    - tokenNumber, tokenOrder (auto-calculated)
    - bookingType: "By Receptionist"
    - status: "Approve" (auto-approved since receptionist created it)
    - receptionistId: current receptionist
ELSE:
  - Same as current (single doctor)
```

### 2D. Pending Bookings — Shared Pool

#### Update: `GET /api/dashboard/receptionist/pending-bookings`
```
IF hospitalId:
  - Show ALL pending online bookings for the hospital
  - NOT filtered by single doctor
  - Group by department for easy scanning
  - Any receptionist can accept/process any pending booking
ELSE:
  - Same as current (filter by doctorId)
```

### 2E. Online Booking — Shared to All Hospital Receptionists

#### Update: Public booking API
```
When a patient books online for a hospital doctor:
  - Booking created with status "Pending"
  - ALL hospital receptionists (with matching hospitalId) can see it
  - First receptionist to click "Approve" processes it
  - On approve: generate token, set status to "Approve", set receptionistId
```

### 2F. Receptionist Dashboard UI Updates

#### Update: `/dashboard/receptionist/page.tsx`
- Hospital mode: Show hospital banner + department cards with today's count
- Show multiple doctors' queues (not just 1 doctor)
- Quick actions: Walk-in, View All Doctors, Pending Bookings

#### Update: `/dashboard/receptionist/walk-in/page.tsx`
- Hospital mode: Add Department selector → Doctor selector flow
- Auto token generation display

#### Update: `/dashboard/receptionist/pending-bookings/page.tsx`
- Hospital mode: Show all hospital pending bookings
- Group/filter by department

#### Update: `/dashboard/receptionist/schedule/page.tsx`
- Hospital mode: Show ALL hospital doctors' schedules (not just 1)
- Filter by department

#### Update: `/dashboard/receptionist/appointments/page.tsx`
- Hospital mode: Add department/doctor filter dropdowns
- Show doctor name column

---

## PHASE 3: OPD Token / Queue System
**Goal:** Doctor-specific queue with token numbers, first-come-first-serve

### 3A. Token Generation Logic

#### New API: `POST /api/queue/generate-token`
```
Input: { doctorId, hospitalId, departmentId, date? }

Logic:
1. Get department short code (e.g., "CARD" for Cardiology, "ORTH" for Orthopedics)
2. Count today's approved bookings for this doctor: tokenOrder = count + 1
3. Generate tokenNumber = "DEPT_PREFIX-03d".format(tokenOrder)
   e.g., "CARD-001", "CARD-002", "ORTH-001"
4. Return: { tokenNumber, tokenOrder, position: tokenOrder }

Edge cases:
- Walk-in after online booking: both get sequential numbers
- Multiple receptionists: database handles concurrency (count before insert)
```

### 3B. Queue Display APIs

#### API: `GET /api/queue/doctor/[doctorId]?date=YYYY-MM-DD`
```
Returns:
- Doctor info, department, hospital
- Queue list (ordered by tokenOrder):
  - tokenNumber, tokenOrder, patientName, status, bookingTime, receptionistName
- Stats: total in queue, waiting, consulted, remaining
- Current token being served (status = 'Visited' with latest timestamp)
```

#### API: `GET /api/queue/patient/[bookingId]`
```
Returns (PATIENT VIEW - doctor-specific only):
- My token: { tokenNumber, position: tokenOrder }
- Queue ahead of me: list of patients with tokenOrder < my tokenOrder AND same doctor AND same date
  - Show ONLY tokenNumber and estimated wait
  - DO NOT show other patients' names/details
- My doctor info
- Estimated wait time
```

#### API: `GET /api/queue/hospital/[hospitalId]?departmentId=XXX`
```
Returns (RECEPTIONIST VIEW):
- All departments with queue counts
- Per department: list of doctors with their queue status
- Per doctor: total queue, currently serving, waiting
```

### 3C. Queue Display UI

#### New Page: `/dashboard/receptionist/queue/page.tsx`
- Hospital-wide queue overview
- Department tabs or cards
- Per doctor: live queue with current token, waiting count
- "Call Next" button (updates current serving token)
- Color coding: waiting (amber), being served (teal), done (green)

#### Update: `/dashboard/doctor/page.tsx`
- Add "Today's Queue" section with token list
- Show current token being served
- Patient cards with token number, name, status

#### New Component: `QueueDisplay.tsx` (reusable)
- Props: doctorId, date, viewMode ('receptionist' | 'doctor' | 'patient')
- Shows queue list with token numbers
- Auto-refresh (polling every 30 seconds or WebSocket)
- Current serving highlight

#### Update: Patient booking confirmation
- After booking approved, show: "Your token: CARD-005, Position: #5"
- Link to "View Queue" page

### 3D. Queue Status Transitions
```
Token States:
Waiting → Called → Being Served → Consulted (Visited) → Done (Finish)

When doctor clicks "Start Consultation" on a patient:
  - Patient's token status → "Being Served"
  - Queue display updates for everyone

When doctor finishes consultation:
  - Patient's token status → "Consulted"
  - Next patient auto-called (or manual)
```

---

## PHASE 4: Hospital Pharmacist Dashboard
**Goal:** Pharmacist sees ALL prescriptions from hospital's doctors, can pack medicines

### 4A. Pharmacist API — Hospital Mode

#### Update: `GET /api/dashboard/pharmacist/stats`
```
IF pharmacist.hospitalId:
  - totalPrescriptions = count WHERE doctor is in this hospital's DoctorHospital links
  - todayPrescriptions = same + today's date
  - pendingFulfillments = today's prescriptions not yet marked as "fulfilled"
  - hospital info (instead of single doctor info)
  - recentPrescriptions from ALL hospital doctors
ELSE:
  - Same as current (filter by doctorId) - clinic mode
```

#### Update: `GET /api/dashboard/pharmacist/prescriptions`
```
IF hospitalId:
  - Show prescriptions from ALL hospital doctors
  - Filter by: doctor, department, date, fulfillment status
  - Group by doctor for easy scanning
ELSE:
  - Same as current
```

### 4B. Prescription Fulfillment Tracking

#### Schema Change: Add `fulfillmentStatus` to Prescription
```
Prescription {
  ...existing fields...
  fulfillmentStatus  String   @default("Pending") // Pending, Packed, Dispensed
  packedBy           String?  // pharmacist user id
  packedAt           DateTime?
}
```

#### New API: `PUT /api/dashboard/pharmacist/prescriptions/[id]/fulfill`
```
- Mark prescription as "Packed" or "Dispensed"
- Set packedBy = current pharmacist user id
- Set packedAt = now()
```

### 4C. Pharmacist Dashboard UI Updates

#### Update: `/dashboard/pharmacist/page.tsx`
- Hospital mode: Show hospital banner instead of single doctor
- Show prescription count per department/doctor
- Recent prescriptions from all doctors

#### Update: `/dashboard/pharmacist/prescriptions/page.tsx`
- Hospital mode: Filter by doctor/department
- Doctor name column
- "Mark as Packed" / "Mark as Dispensed" action buttons
- Fulfillment status badges

---

## PHASE 5: Doctor Dashboard — Hospital Context
**Goal:** Doctor sees hospital-linked queue, works seamlessly in hospital mode

### 5A. Doctor Queue API

#### Update: `GET /api/dashboard/doctor/queue`
```
Current: Returns today's bookings ordered by time
New:    Returns today's bookings with:
  - tokenNumber, tokenOrder (if hospital booking)
  - receptionistName (who registered)
  - departmentName
  - hospitalName
  - Queue position
  - Current being-served indicator
```

### 5B. Doctor Dashboard UI Updates

#### Update: `/dashboard/doctor/page.tsx`
- If doctor has hospital links (DoctorHospital records):
  - Show hospital name + department badge
  - Show OPD queue with token numbers
  - "Currently Serving" highlight on active patient
  - "Next Patient" action button
  - Department info (floor, OPD room)
- If no hospital links (clinic mode):
  - Same as current

### 5C. Doctor Prescription — Hospital Pharmacy Routing

#### Update: Prescription finalize API
```
When doctor finalizes prescription:
  IF booking has hospitalId:
    - Prescription automatically visible to hospital pharmacist(s)
    - No action needed from doctor (automatic routing)
  ELSE (clinic mode):
    - Same as current (visible to doctor's personal pharmacist)
```

---

## PHASE 6: Patient Queue View
**Goal:** Patient sees their position in doctor-specific queue

### 6A. Patient Queue API

#### API: `GET /api/patient/bookings/queue?bookingId=XXX`
```
Returns:
- My booking: tokenNumber, tokenOrder, status
- Queue info:
  - Total patients ahead of me (same doctor, same date, earlier tokenOrder)
  - Estimated wait (patients ahead × avg consultation time)
  - Currently serving token number
- Doctor info: name, department, OPD room
- Hospital info: name, floor, directions
```

### 6B. Patient Queue UI

#### Update: `/dashboard/patient/appointments/[id]/page.tsx`
- If booking has tokenNumber:
  - Show "Your Token: CARD-005" prominently
  - Show "Position: #3 in queue"
  - Show patients ahead (just count, not names): "2 patients ahead"
  - Show currently serving: "Now Serving: CARD-002"
  - Auto-refresh every 30 seconds
  - Visual queue progress bar

---

## PHASE 7: Polish & Real-time Features
**Goal:** Real-time queue updates, notifications, display board

### 7A. Real-time Queue Updates
- Option 1: Polling (simpler) — Auto-refresh queue every 15-30 seconds
- Option 2: WebSocket (better UX) — Push queue updates via socket.io
- Recommended: Start with polling, add WebSocket later

### 7B. Queue Display Board (TV/Monitor)
- New public page: `/hospital/[id]/queue-display`
- Full-screen TV-friendly display
- Shows: Department → Doctor → Current Token → Next 5 tokens
- Auto-cycles through departments
- Large font, high contrast
- No login required (public display)

### 7C. Notifications
- Patient notified when: token is about to come (e.g., 2 ahead), token called
- Doctor notified when: new patient in queue, patient waiting too long
- Receptionist notified when: new online booking arrives

---

## 📊 Dependency Graph

```
Phase 1 (Schema + Admin Staff)           Phase 2 (Receptionist Hospital Mode)
    │                                          │
    ├── 1A: Schema changes                      ├── 2A-F: Reception APIs + UI
    ├── 1B: Admin Staff APIs                    │
    ├── 1C: Admin Staff UI                      │
    └── 1D: Seed data update                    │
         │                                     │
         ▼                                     ▼
    Phase 3 (Queue System) ────────────────→ Phase 4 (Pharmacist Hospital Mode)
         │                                          │
         ├── 3A: Token generation                   ├── 4A-C: Pharmacist APIs + UI
         ├── 3B: Queue APIs                        │
         ├── 3C: Queue UI                          │
         └── 3D: Status transitions                 │
                                                      │
         ┌────────────────────────────────────────────┘
         ▼
    Phase 5 (Doctor Hospital Context) ──→ Phase 6 (Patient Queue View)
         │                                      │
         ├── 5A-C: Doctor APIs + UI             ├── 6A-B: Patient queue APIs + UI
         │                                      │
         ▼                                      ▼
    Phase 7 (Polish & Real-time)
         ├── 7A: Polling / WebSocket
         ├── 7B: Display Board
         └── 7C: Notifications
```

---

## 📋 File Changes Summary

### Schema Changes (prisma/schema.prisma)
| Model | Change | Type |
|-------|--------|------|
| DoctorPharmacist | Add `hospitalId?` | Modify |
| DoctorPharmacist | Make `doctorId` optional | Modify |
| Receptionist | Make `doctorId` optional | Modify |
| Receptionist | Make `hospitalId` required (remove ?) | Modify |
| Booking | Add `tokenOrder Int`, `receptionistId String?` | Modify |
| Prescription | Add `fulfillmentStatus`, `packedBy`, `packedAt` | Modify |

### New API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/dashboard/admin/hospitals/[id]/staff` | GET/POST | List/create hospital staff |
| `/api/dashboard/admin/hospitals/[id]/staff/[userId]` | DELETE | Remove staff |
| `/api/queue/generate-token` | POST | Generate OPD token |
| `/api/queue/doctor/[doctorId]` | GET | Doctor's queue for a date |
| `/api/queue/patient/[bookingId]` | GET | Patient's queue position |
| `/api/queue/hospital/[hospitalId]` | GET | Hospital-wide queue overview |
| `/api/dashboard/pharmacist/prescriptions/[id]/fulfill` | PUT | Mark prescription packed/dispensed |

### Updated API Routes
| Route | Change |
|-------|--------|
| `/api/dashboard/receptionist/stats` | Add hospital mode (multi-doctor) |
| `/api/dashboard/receptionist/appointments` | Add hospital filters |
| `/api/dashboard/receptionist/pending-bookings` | Add hospital mode |
| `/api/dashboard/receptionist/walk-in` | Add hospital mode (dept → doctor flow) |
| `/api/dashboard/receptionist/schedule` | Add hospital mode (all doctors) |
| `/api/dashboard/pharmacist/stats` | Add hospital mode |
| `/api/dashboard/pharmacist/prescriptions` | Add hospital mode |
| `/api/dashboard/doctor/queue` | Add token/hospital info |
| `/api/patient/bookings/queue` | Add queue position info |

### New/Updated Pages
| Page | Change |
|------|--------|
| `/dashboard/admin/hospitals/[id]/staff` | NEW: Staff management |
| `/dashboard/receptionist/page.tsx` | UPDATE: Hospital mode |
| `/dashboard/receptionist/walk-in/page.tsx` | UPDATE: Hospital mode flow |
| `/dashboard/receptionist/pending-bookings/page.tsx` | UPDATE: Hospital shared pool |
| `/dashboard/receptionist/schedule/page.tsx` | UPDATE: Hospital all doctors |
| `/dashboard/receptionist/appointments/page.tsx` | UPDATE: Hospital filters |
| `/dashboard/receptionist/queue/page.tsx` | NEW: Queue management |
| `/dashboard/pharmacist/page.tsx` | UPDATE: Hospital mode |
| `/dashboard/pharmacist/prescriptions/page.tsx` | UPDATE: Hospital mode + fulfillment |
| `/dashboard/doctor/page.tsx` | UPDATE: Queue with tokens |
| `/dashboard/patient/appointments/[id]/page.tsx` | UPDATE: Queue position display |
| `/hospital/[id]/queue-display` | NEW: TV display board (Phase 7) |

### New Components
| Component | Purpose |
|-----------|---------|
| `QueueDisplay.tsx` | Reusable queue list with tokens |
| `TokenBadge.tsx` | Token number display badge |
| `DepartmentDoctorSelector.tsx` | Department → Doctor cascading dropdown |

---

## 🎯 Recommended Build Order

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 P0 | Phase 1: Schema + Admin Staff | Medium | Foundation for everything |
| 🔴 P0 | Phase 2: Receptionist Hospital Mode | Large | Core hospital workflow |
| 🟡 P1 | Phase 3: Queue System | Large | OPD token system |
| 🟡 P1 | Phase 4: Pharmacist Hospital Mode | Medium | Prescription routing |
| 🟢 P2 | Phase 5: Doctor Hospital Context | Small | Doctor UX in hospital |
| 🟢 P2 | Phase 6: Patient Queue View | Small | Patient UX |
| 🔵 P3 | Phase 7: Polish & Real-time | Medium | Production readiness |

---

## ⚠️ Key Decisions Needed

1. **Token Format:** `CARD-001` (dept prefix + 3-digit) or `OPD-001` (global per hospital)?
   → Recommendation: Department prefix (more organized for multi-specialty)

2. **Queue Real-time:** Polling (15s) vs WebSocket?
   → Recommendation: Polling first (Phase 1-6), WebSocket in Phase 7

3. **Clinic Mode Backward Compatibility:** All existing clinic-mode staff should continue working
   → All changes use `IF hospitalId` checks, clinic mode stays as-is

4. **Admin creates staff OR Hospital Admin creates staff?**
   → As discussed: Platform Admin creates hospital + staff
   → Hospital Admin manages departments + doctor links (already built)

5. **Receptionist-doctor association in hospital:**
   → Hospital receptionist can serve ALL hospital doctors (no per-doctor restriction)
   → Optional: Department assignment for OPD counter allocation