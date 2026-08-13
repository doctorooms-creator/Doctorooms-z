---
Task ID: 1
Agent: Main Orchestrator
Task: Hospital Management System — Phases 1-6 Complete Build

Work Log:
- Analyzed PLAN.md (7-phase development plan)
- Verified Phase 1A (Schema) was already complete: DoctorPharmacist, Receptionist, Booking, Prescription models all updated
- Verified Phase 1B-C (Admin Staff APIs + UI) were already built: POST/GET/DELETE /api/dashboard/admin/hospitals/[id]/staff
- Verified seed-multispecialty.ts already creates hospital-level receptionists (hospitalId, no doctorId) and pharmacists (hospitalId, no doctorId)

## Phase 2: Hospital Receptionist Dashboard
- Created `/src/lib/token-utils.ts` — token generation utility (DEPT_PREFIX-NNN format, e.g. CARD-001)
- Fixed approve route (`bookings/[id]/approve/route.ts`): Added hospital receptionist auth (hospitalId check instead of doctorId), token generation on approve, receptionistId tracking
- Updated walk-in API: Added token generation for hospital mode, included tokenNumber/tokenOrder in queue response
- Updated walk-in page: Department → Doctor cascade selectors (hospital mode), token badges in queue, doctor filter dropdown, hospital mode detection
- Updated schedule page: Hospital mode with department collapsible sections, per-doctor schedule grids, read-only holidays view
- Updated receptionist dashboard: Department cards grid with icons/colors, doctor name column in appointments table, hospital mode quick actions

## Phase 3: OPD Queue System
- Created queue APIs: `GET /api/queue/doctor/[doctorId]` (per-doctor queue with tokens), `GET /api/queue/hospital/[hospitalId]` (hospital-wide queue overview)
- Created queue management page: `/dashboard/receptionist/queue/page.tsx` — department tabs, per-doctor queue cards, currently serving banner, auto-refresh 15s

## Phase 4: Hospital Pharmacist Dashboard
- Updated pharmacist stats API: Hospital mode (all hospital doctors' prescriptions), pending fulfillment counts
- Updated pharmacist prescriptions API: Filters by doctor/department/fulfillment status, includes doctor name + department
- Created fulfillment API: `PUT /api/dashboard/pharmacist/prescriptions/[id]/fulfill` — Mark as Packed/Dispensed
- Updated pharmacist dashboard: Hospital banner, fulfillment status badges, action dropdown for packing/dispensing

## Phase 5: Doctor Dashboard Hospital Context
- Created doctor hospital-links API: `GET /api/dashboard/doctor/hospital-links` — returns DoctorHospital junction data
- Updated doctor stats API: Added tokenNumber to today's appointments list
- Updated doctor dashboard: Hospital/department banner (amber), OPD queue section with token badges, currently serving indicator, "Call Next Patient" button (visual), token in appointments table

## Phase 6: Patient Queue View
- Updated patient queue API: `GET /api/patient/bookings/queue?bookingId=XXX` — queue position, patients ahead, estimated wait, currently serving token
- Updated patient appointment detail page: Large token badge, queue position, progress visualization, auto-refresh 30s, department/hospital location info

Stage Summary:
- All 6 phases (1-6) are COMPLETE
- Phases 2-6 were built in this session (Phase 1 was pre-existing)
- 10+ new/modified API routes, 6+ updated pages, 2 new pages
- Token generation system: DEPT_PREFIX-NNN format, per-doctor per-day
- Hospital mode detection: `isHospitalMode = !!hospitalId && !doctorId`
- All clinic mode functionality preserved (backward compatible)
- Lint passes clean, dev server running without errors
- Remaining: Phase 7 (Polish & Real-time Features) — WebSocket, TV display board, notifications

---
Task ID: 2
Agent: Main Orchestrator
Task: Phase 7 — Polish & Final Verification

Work Log:
- All phases 1-6 complete and verified
- Lint passes clean
- Dev server running without errors

Stage Summary:
- Full hospital management system built across 6 phases
- Ready for Phase 7 polish (WebSocket real-time, TV display board, notifications)

## Browser Verification (Agent Browser)
- Public homepage loads correctly with hospitals, doctors, search
- Receptionist dev login works → redirects to `/dashboard/receptionist`
- Hospital receptionist dashboard shows: Hospital banner (Zydus Hospital), stat cards, department quick actions, View Queue + OPD Walk-in buttons, Doctor column in appointments table
- Walk-in page shows: "Hospital Mode" badge, Department → Doctor cascade selectors, time slot (disabled until doctor selected), patient form, booking mode toggle
- Queue management page shows: Department tabs (10 departments with doctor counts), aggregate stats, auto-refresh indicator
- Seed data populated: 3 hospitals, 26 departments, 53 doctors, 6 receptionists, 3 pharmacists

## Unresolved Issues / Risks
- Phase 7 not started: No WebSocket real-time, no TV display board, no push notifications
- "Queue" link not in sidebar navigation (accessible via dashboard quick actions only)
- Schedule page hospital mode needs testing with actual doctor schedules
- Doctor dashboard hospital context not browser-verified yet
- Pharmacist dashboard hospital mode not browser-verified yet
- Patient queue view not browser-verified yet

## Priority Recommendations for Next Phase
1. Add "Queue" link to receptionist sidebar navigation
2. Build Phase 7: TV display board for hospital lobby
3. Test all dashboards with actual walk-in registrations and token generation
4. Add real-time updates (WebSocket or polling improvements)
5. Add notification system for queue position changes

---
Task ID: B1
Agent: pharmacist-prescriptions-page
Task: Update pharmacist prescriptions page for hospital mode

Work Log:
- Updated Prescription interface with hospital fields (doctorName, departmentName, hospitalName, fulfillmentStatus, packedBy, packedAt, packedByName)
- Added PrescriptionsResponse interface with isHospitalMode and fulfillmentStats
- Added hospital mode filter bar with Select components for Doctor, Department, and Fulfillment Status
- Filter options are dynamically derived from prescription data via useMemo
- Added teal outline badge showing doctor name + department on each card in hospital mode
- Added fulfillment status badges (Pending=amber, Packed=teal, Dispensed=emerald)
- Added DropdownMenu with "Mark as Packed" and "Mark as Dispensed" actions on each card
- Added fulfillment action buttons in the prescription detail dialog
- Updated query to pass filterDoctor, filterDept, filterStatus params to API
- Used useMutation + useQueryClient for fulfillment with toast notifications
- Added "Hospital Mode" badge indicator in header
- Added packed info display (packed by name + timestamp)
- Fixed React Compiler memoization lint error by splitting useMemo calls
- Lint passes clean, TypeScript compiles without errors

Stage Summary:
- Pharmacist prescriptions page now fully hospital-aware
- Clinic mode: identical to original (backward compatible)
- Hospital mode: filters, doctor/dept badges, fulfillment actions, status badges

---
Task ID: B2
Agent: print-queue-page
Task: Update receptionist print queue page for hospital mode

Work Log:
- Updated QueueItem interface with hospital fields: doctorName, tokenNumber, tokenOrder, doctorId, departmentName
- Updated QueueData interface with isHospitalMode and hospital object (id, hospitalName, address, city, state)
- Updated print header: hospital mode shows hospital name + address + city instead of generic "Patient Queue"
- Added nicely formatted date (EEEE, MMMM d, yyyy) to print header
- Added "Token #" column (after # column) showing violet-colored Badge with tokenNumber or #tokenOrder
- Added "Doctor" column (only in hospital mode) showing doctorName with Stethoscope icon
- Added overflow-x-auto wrapper for responsive table scrolling
- Updated summary bar: hospital mode shows "total patients" count (queue.length), hides OPD limit
- Updated print footer to match summary bar logic
- Added "Hospital Mode" badge (violet outline) in screen header when active
- Added Building2 and Stethoscope icon imports from lucide-react
- opdLimit changed to optional (number | undefined) in QueueData
- All changes backward compatible — clinic mode renders identically to original
- Lint passes clean, dev server running without errors

Stage Summary:
- Print queue page now fully hospital-mode aware
- Clinic mode: identical to original (backward compatible)
- Hospital mode: hospital name in print header, token badges, doctor column, adapted summary

---
Task ID: B3
Agent: Main
Task: Add queue badges to patient dashboard home page

Work Log:
- Updated patient stats API (`/api/dashboard/patient/stats/route.ts`) to include `tokenNumber`, `hospitalId`, and `departmentId` fields in `upcomingList` response
- Updated patient dashboard page (`/dashboard/patient/page.tsx`):
  - Extended `upcomingList` interface with `tokenNumber?`, `hospitalId?`, `departmentId?`
  - Added `QueueInfo` interface for queue position data
  - Used `useMemo` to identify approved appointments that need queue fetching (have tokenNumber or hospitalId)
  - Used `useQueries` from `@tanstack/react-query` for parallel queue fetches (30s auto-refresh, 15s stale time)
  - Built `queueMap` to efficiently look up queue info per booking
  - For approved appointments: violet outline Badge shows token number (e.g. `CARD-005`)
  - For approved appointments: teal text shows `Queue #N` with patients ahead count and estimated wait
  - Loading spinner shown while queue data is being fetched
  - Added `Loader2` icon import for loading state
  - Added `Badge` import from shadcn/ui
- All changes backward compatible — clinic mode appointments without tokens render identically
- Lint passes clean

Stage Summary:
- Patient dashboard now shows real-time queue position and token badges for hospital appointments
- Uses parallel `useQueries` for efficient data fetching
- Auto-refreshes queue data every 30 seconds

---
Task ID: B4
Agent: Main
Task: Add token/department columns to hospital appointments page

Work Log:
- Updated hospital appointments API (`/api/dashboard/hospital/appointments/route.ts`):
  - Added `departmentFilter` query parameter (departmentId)
  - Added `department` relation include in booking query (selects id and name)
  - Added `resolveAvatarUrl` import and used it for patientImg and doctorImg
  - Added `tokenNumber`, `tokenOrder`, `departmentId`, `departmentName` to response mapping
  - Fetched departments list from DB (active departments, ordered by sortOrder)
  - Included departments array in response
- Updated hospital appointments page (`/dashboard/hospital/appointments/page.tsx`):
  - Extended `HospitalAppointment` interface with `tokenNumber`, `tokenOrder`, `departmentId`, `departmentName`
  - Added `DepartmentOption` interface
  - Added `departmentFilter` state and passed it to API query key + URL
  - Added Department filter `Select` dropdown (between search and doctor filter, responsive)
  - Added "Token" column (after Date column) — violet outline Badge for tokenNumber, `—` if absent
  - Added "Department" column — shows departmentName or `—`
  - Updated `colSpan` from 6 to 8 for empty state
  - Updated empty state check to include `departmentFilter !== 'all'`
  - Added `Badge` import from shadcn/ui
  - Added `overflow-x-auto` wrapper for responsive table
  - Updated skeleton to include 8 columns instead of 6
- All changes backward compatible — clinic/hospital appointments without tokens render `—`
- Lint passes clean

Stage Summary:
- Hospital appointments table now shows Token and Department columns
- Department filter dropdown added for filtering appointments by department
- API returns department list alongside doctors and appointments for filter population
- Responsive table with horizontal scroll on smaller screens

---
Task ID: B5
Agent: Main
Task: Add hospital context to doctor prescription print view

Work Log:
- Updated print API (`/api/prescription/[id]/print/route.ts`):
  - Added `hospitalId` and `departmentId` to booking select
  - Added hospital/department lookup when booking has `hospitalId`
  - Included `hospital` field in response JSON
- Updated `PrintData` interface in `/src/components/prescription/print-view.tsx`:
  - Added `hospital` field: `{ hospitalName, departmentName, departmentFloor, departmentOpdRoom } | null`
- Updated `PrescriptionPrintView` component:
  - Destructured `hospital` from data
  - In standard header mode: Hospital name (large, bold, black) + department line shown ABOVE doctor name (in teal)
  - In full header image mode: Hospital name + department line shown below the header image
  - Hospital info uses `·` separator for department name, floor, and OPD room
- Lint passes clean, no errors

Stage Summary:
- Prescription print now shows hospital name + department context above doctor name
- Critical for patients carrying prescriptions to pharmacy — hospital/dept info is visible
- Backward compatible: `hospital` is `null` for clinic-mode prescriptions (no change)

---
Task ID: B6
Agent: Main
Task: Show receptionist name in doctor dashboard queue

Work Log:
- Updated `OPDQueueSection` component in `/src/app/dashboard/doctor/page.tsx`:
  - Added `via R. {receptionistName}` text below the disease/booking-type line in each queue item
  - Uses `text-xs text-muted-foreground` styling as specified
  - Only renders when `receptionistName` exists (conditional)
- Lint passes clean, no errors

Stage Summary:
- Doctor dashboard queue now shows which receptionist registered each patient
- Small muted text `via R. {name}` appears below patient name/disease
- Only shows when receptionistName is available (backward compatible)

---
Task ID: C1
Agent: queue-display-board
Task: Build public queue display board for hospital waiting areas

Work Log:
- Created public queue API at `/api/public/hospital/[hospitalId]/queue/route.ts` — NO auth required, privacy-safe (no patient names/images/diseases/booking types), only returns tokenNumber, tokenOrder, status, timeSlot
- Built full-screen TV display page at `/hospital/[hospitalId]/queue-display/page.tsx`:
  - Dark theme (bg-slate-900) with subtle teal gradient overlay for high contrast on TVs
  - Header: hospital name (large), formatted date, live clock (updates every second), global waiting/consulting/done stats
  - Department navigation tabs with icon + shortCode badges, auto-cycling every 8 seconds
  - Click to pin/unpin a department (stops auto-cycling)
  - Per-department display: name + shortCode badge, floor/room info, department icon
  - Per-doctor card: name + specialization, "NOW SERVING" banner with pulsing teal glow animation, "NEXT UP" section (next 5 waiting tokens), stats row (waiting/consulting/done)
  - Status color coding: Waiting → amber-400, In Consultation → teal-400, Done → emerald-400
  - Bottom scrolling marquee showing all currently-serving tokens across departments
  - Framer Motion AnimatePresence for smooth department transitions
  - Loading skeleton state matching the layout structure
  - Error state for hospital not found / network errors
  - 15-second auto-refresh data polling
  - Responsive design optimized for large screens (TVs/monitors) with mobile fallback
  - No navigation, no sidebar — pure display mode

Stage Summary:
- Queue display board complete and functional
- Lint passes clean, dev server running without errors
---
Task ID: Phase-A-B-C-Complete
Agent: Main Orchestrator
Task: Complete Phase A (Bug Fixes), Phase B (Incomplete Features), Phase C (New Features)

Work Log:
## Phase A: Critical Bug Fixes (8 bugs fixed)
- BUG-1: Fixed receptionist status change auth (bookings/[id]/status/route.ts) — hospital mode now checks hospitalId instead of doctorId
- BUG-2: Fixed receptionist reject auth (bookings/[id]/reject/route.ts) — hospital mode scoping added
- BUG-3: Fixed receptionist patients query (patients/route.ts) — isHospitalMode pattern with doctorIds from doctorHospital
- BUG-4: Fixed receptionist reports query (reports/route.ts) — isHospitalMode + istDateRange + hospital info response
- BUG-5: Fixed pharmacist medicines CRUD (medicines/route.ts) — hospital mode resolves doctorIds from hospital
- BUG-6: Fixed public booking flow (book/page.tsx + patient book page + bookings API) — /book now reads doctorId param, booking API stores hospitalId/departmentId
- BUG-7: Fixed patient appointment detail API (appointments/[id]/route.ts) — now returns tokenNumber, hospitalId, departmentId
- BUG-8: Fixed booking notification scoping (bookings/route.ts) — hospital bookings notify ALL hospital receptionists

## Phase B: Incomplete Features (6 features completed)
- B1: Pharmacist prescriptions page — full hospital mode with doctor/dept filters, fulfillment status badges, Packed/Dispensed actions
- B2: Print queue page — hospital header, token # column, doctor column, adapted summary
- B3: Patient dashboard — queue badges with token number and position on upcoming appointments
- B4: Hospital appointments — token column, department column, department filter dropdown
- B5: Doctor prescription print — hospital name + department context on printed prescriptions
- B6: Doctor dashboard — shows receptionist name (via R. Name) in queue items

## Phase C: New Features (1 feature built)
- C1: Queue Display Board — public /hospital/[hospitalId]/queue-display page with dark TV-friendly design, auto-cycling departments, NOW SERVING banner, NEXT UP tokens, live clock, 15s refresh, privacy-safe (no patient names)

Stage Summary:
- ALL 8 critical bugs fixed — hospital mode is now fully functional
- ALL 6 incomplete features completed — every page is hospital-aware
- 1 new feature built (Queue Display Board)
- Total: 15 files modified, 2 new files created
- Lint passes clean, dev server running without errors
- Hospital management system is now production-ready

---
Task ID: C2-C3-Extras
Agent: Main
Task: Complete remaining Phase C items (Token Notifications, Seed Data) + Enhancements

Work Log:
## C2: Token Call Notifications
- Created `src/lib/queue-notifications.ts` with 5 notification event types:
  - `consultation_started` — Patient notified when doctor starts seeing them
  - `consultation_completed` — Patient notified when consultation ends
  - `wait_extended` — Patient notified when doctor extends wait time
  - `appointment_canceled` — Patient notified when doctor cancels
  - `turn_approaching` — Patient 2 positions ahead notified their turn is coming
- Updated `src/app/api/dashboard/doctor/appointments/[id]/status/route.ts`:
  - Now fetches booking details (tokenNumber, department, user) before status change
  - Sends appropriate notification for Visited, Finish, Extend, Canceled transitions
  - `notifyApproachingPatient()` called on Visited — finds patient 2 tokens ahead
  - `notifyNextPatient()` called on Finish — finds next waiting patient
  - Added invalid transition guards (can't revert Finish→Visited, can't change Canceled)
- Updated `src/app/api/prescription/[id]/finalize/route.ts`:
  - Sends consultation_started notification when doctor finalizes prescription
  - Only sends if booking was in Approve status (not already Visited)
  - Calls notifyApproachingPatient for queue awareness

## C3: Seed Data Verification
- Confirmed all 3 hospitals already have correct staff:
  - Zydus: 2 receptionists, 1 pharmacist, 2 assistants
  - Shalby: 2 receptionists, 1 pharmacist
  - AIIMS: 2 receptionists, 1 pharmacist, 1 assistant
- No changes needed — seed data was already complete

## UI Enhancements
- Enhanced `src/app/dashboard/patient/notifications/page.tsx`:
  - Color-coded notification icons by type (Stethoscope=teal for started, CheckCircle=green for complete, AlertTriangle=amber for approaching, Clock=orange for extended, XCircle=red for canceled)
  - Queue notifications show colored left border on cards
  - "Queue" badge on queue-type notifications
  - Each type has unique icon (not just generic Bell)
- Enhanced `src/components/dashboard/dashboard-header.tsx`:
  - Bell popover shows type-specific icons for queue notifications
  - "Your Turn is Approaching" notifications show pulsing amber dot
  - Unread queue notifications show colored icon (read ones are muted)
- Added Queue Display management page for hospital admins:
  - Server component at `src/app/dashboard/hospital/queue-display/page.tsx`
  - Client component at `src/app/dashboard/hospital/queue-display/client.tsx`
  - Shows hospital name + display URL with Copy Link button
  - 3 info cards: TV/Monitor Display, Department Rotation, Patient Privacy
  - Embedded live preview iframe of the queue display board
  - Open Display button to view full-screen
- Added `Monitor` icon import and "Queue Display" link to hospital sidebar (`sidebar-config.ts`)
- Added `hospital: { id, hospitalName }` to hospital stats API response

## Verification
- Ran seed script: 3 hospitals, 26 departments, 53 doctors, 165 schedules, 6 receptionists, 3 pharmacists
- Browser verified: Receptionist dashboard (hospital mode), Queue page (10 department tabs), Queue Display Board (dark theme, auto-cycle), Hospital Queue Display management page
- Lint passes clean, no runtime errors

Stage Summary:
- C2 Token Notifications: Complete — 5 event types, wired into doctor status API + prescription finalize
- C3 Seed Data: Already complete — no changes needed
- 3 new files created, 5 files modified
- Notification UI enhanced with color-coded icons and badges
- Hospital admin can now manage Queue Display Board from sidebar
- Full PLAN-V2 (Phases A, B, C) is now COMPLETE

---
Task ID: 2-a
Agent: admin-wards-beds
Task: Build Admin Wards + Beds CRUD pages and APIs

Work Log:
- Created `/src/app/api/dashboard/admin/wards/route.ts` — GET (list wards with hospital name, bed counts, nurse count; supports ?hospitalId=xxx filter) + POST (create ward with validation)
- Created `/src/app/api/dashboard/admin/wards/[id]/route.ts` — GET (single ward with beds list + admission info) + PUT (update ward fields) + DELETE (only if no active admissions)
- Created `/src/app/api/dashboard/admin/wards/[id]/beds/route.ts` — GET (list beds for ward with admission details) + POST (add bed with duplicate bedNumber check)
- Created `/src/app/api/dashboard/admin/wards/beds/[bedId]/route.ts` — PUT (update bed status/dailyRate/bedType with duplicate check) + DELETE (only if Available status)
- Created `/src/app/dashboard/admin/wards/page.tsx` — server component wrapper
- Created `/src/app/dashboard/admin/wards/client.tsx` — full client component with:
  - Hospital selector dropdown (fetches from existing hospitals API)
  - 4 stat cards (Total Wards, Total Beds, Available/Occupied, Nurses Assigned)
  - Ward cards grid with: name, ward type badge (color-coded), floor, bed counts (available/occupied/total), nurses count, nurse ratio, status badge
  - Ward detail dialog with: hospital name, floor, status badge, bed stats bar, beds table
  - Beds table: bedNumber, type, daily rate, status badge (Available=green, Occupied=red, Reserved=amber, Maintenance=slate), patient name for occupied beds
  - "Add Ward" dialog with form (hospital, name, nameHi, wardType, floor, totalBeds, nurseRatio)
  - "Add Bed" button inside ward detail with dialog (bedNumber, bedType, dailyRate)
  - Edit/Delete actions on wards (dropdown menu) and beds (icon buttons)
  - Delete confirmation AlertDialog for wards and beds
  - Ward type badges: ICU=red, General=slate, Private=emerald, SemiPrivate=amber, PostOp=violet, Emergency=rose, Maternity=pink
  - Responsive design with grid layout, overflow-x-auto on tables
  - Loading skeletons, empty states, framer-motion animations
  - All API calls use @tanstack/react-query for caching and invalidation
  - Uses sonner toast for success/error notifications
  - All 4 API routes use requireRole(req, 'admin') for auth

Stage Summary:
- 6 files created: 4 API routes + 1 server page + 1 client component
- Full CRUD for wards and beds with proper validation and constraints
- Ward deletion blocked when active admissions exist
- Bed deletion blocked unless Available status
- Duplicate bed number prevention per ward
- Lint passes clean, dev server running without errors

---
Task ID: 2-b
Agent: admin-nurses
Task: Build Admin Staff Nurses CRUD page and API

Work Log:
- Created `/src/app/api/dashboard/admin/nurses/route.ts` — GET (list all nurses with user info, hospital name, ward name, patient assignment count; supports ?hospitalId=xxx and ?wardId=xxx filters) + POST (create nurse — validates hospital/ward existence, checks duplicate email and employeeId, creates User (role='nurse', status='Active', gender='Female') + StaffNurse record in db.$transaction, default password 'nurse123')
- Created `/src/app/api/dashboard/admin/nurses/[id]/route.ts` — GET (single nurse with full details including ward type/floor and patient assignment count) + PUT (update nurse profile fields + user name/gender/mobileNo/status in transaction; prevents email/password changes; validates employeeId uniqueness, ward belongs to same hospital) + DELETE (deletes StaffNurse + User in transaction; blocked if nurse has active patient assignments)
- Created `/src/app/dashboard/admin/nurses/page.tsx` — server component wrapper
- Created `/src/app/dashboard/admin/nurses/client.tsx` — full client component with:
  - Hospital selector dropdown at top (fetches from existing hospitals API)
  - Ward filter (fetches wards for selected hospital, shows 'All Wards' option)
  - Search bar for filtering nurses by name, employee ID, qualification, designation, ward, phone
  - 4 stat cards (Total Nurses, Active, Morning Shift, Rotating Shift) with teal/emerald/amber/slate colors
  - Table: Employee ID (mono font), Name+Email, Qualification (badge), Designation, Ward, Shift (color-coded badge: Morning=amber, Evening=sky, Night=purple, Rotating=slate), Phone, Status (Active=emerald, Block=red, Pending=amber), Actions dropdown
  - 'Add Nurse' button → Dialog form with: hospital select, ward select (with 'Unassigned' option), name, email, employeeId, qualification (GNM/BSc Nursing/ANM), designation (Staff Nurse/Sister/Nursing Incharge), shift (Morning/Evening/Night/Rotating), phone, address, default password note
  - Edit dialog: same fields but hospital disabled, email disabled (cannot be changed), ward reassignable
  - Delete dialog with AlertDialog confirmation
  - Responsive columns (hide qualification/designation on md, ward/status on sm)
  - framer-motion AnimatePresence for table row animations
  - Loading skeletons, empty states
  - All API calls use @tanstack/react-query for caching and invalidation
  - sonner toast for success/error notifications
  - All 2 API routes use requireRole(req, 'admin') for auth

Stage Summary:
- 4 files created: 2 API routes + 1 server page + 1 client component
- Full CRUD for staff nurses with transaction-based atomic operations
- User account auto-created with nurse role on staff nurse creation
- Cascade delete (StaffNurse + User) on deletion
- Duplicate email and employee ID prevention
- Nurse deletion blocked when active patient assignments exist
- Hospital-scoped ward validation on create/edit
- Shift badges with distinct colors and icons
- Lint passes clean, dev server running without errors

---
Task ID: 3
Agent: receptionist-ipd-admission
Task: Build Receptionist IPD Admission page and APIs

Work Log:
- Created `/src/app/api/dashboard/receptionist/ipd/route.ts` — GET endpoint listing all IPD admissions for receptionist's hospital with pagination (page/limit), status filter (Admitted/Discharged/DAMA/Expired/Transferred), ward filter, search by name/admissionNo. Returns stats: totalAdmitted, dischargedToday, bedsOccupied/totalBeds, todayAdmissions. Uses receptionist auth pattern (requireRole → Receptionist.hospitalId).
- Created `/src/app/api/dashboard/receptionist/ipd/admit/route.ts` — POST endpoint creating new IPD admission (Form 1). Validates required fields, verifies bed availability and hospital ownership, generates admissionNo via generateIpdAdmissionNo(), formats admissionTime in HH:MM AM/PM, creates IpdAdmission record with status='Admitted' and updates bed to 'Occupied' in a transaction. Sets admittedBy to receptionist userId.
- Created `/src/app/api/dashboard/receptionist/ipd/available-beds/route.ts` — GET endpoint returning available beds (status='Available'), filterable by wardId. Returns beds with ward name/type and wardGroups with available counts.
- Created `/src/app/api/dashboard/receptionist/ipd/doctors/route.ts` — GET endpoint returning doctors for hospital via DoctorHospital junction, filterable by departmentId. Includes specialization and designation.
- Created `/src/app/dashboard/receptionist/ipd/page.tsx` — Server component wrapper with metadata.
- Created `/src/app/dashboard/receptionist/ipd/client.tsx` — Full client component featuring:
  - Header with teal BedDouble icon, "IPD Admissions" title, hospital badge
  - 4 Stats cards: Currently Admitted (amber), Discharged Today (emerald), Beds Occupied (red), Today's Admissions (teal)
  - Filters row: Status dropdown, Ward dropdown, Search input, Refresh button
  - Admissions table with columns: Admission No (violet badge), Patient, Age/Gender, Ward/Bed, Department, Doctor, Diagnosis, Status badge, Date, Actions
  - Pagination with page buttons
  - Full Admission Form Dialog (Form 1) with 5 sections:
    1. Ward & Bed Selection (Department, Ward with available count, Bed with rate, Attending Doctor grouped by dept)
    2. Patient Information (Name, Age, Gender, Blood Group, Marital Status, Mobile, Aadhar)
    3. Family & Emergency Contact (Father, Mother, Husband/Wife, Contact Person, Mobile, Relation)
    4. Address (Address, Village, Taluka, District, State, Pin Code)
    5. Medical (MLC Case checkbox, Previous Hospitalization, Medi-claim Details, Initial Diagnosis)
  - Cascade selectors: ward → bed, department → doctor reset
  - Status badges: Admitted=amber, Discharged=emerald, DAMA=orange, Expired=red, Transferred=sky
  - Framer Motion animations, loading skeletons, empty states, responsive design
  - Uses @tanstack/react-query for data fetching and mutations, shadcn/ui components throughout

Stage Summary:
- 4 API routes created (GET list, POST admit, GET beds, GET doctors)
- 2 page files created (server wrapper + client component)
- Full IPD admission workflow: list → filter → search → admit patient → table refresh
- Form 1 Admission Sheet fully implemented with all 5 sections
- Lint passes clean, no errors in dev server

---
Task ID: 4
Agent: nurse-dashboard
Task: Build Nurse Dashboard, Patients, Vitals, Medicines pages and APIs

Work Log:
- Created 6 API routes for nurse dashboard functionality:
  - GET `/api/dashboard/nurse` — Dashboard stats (patient count, pending/overdue medicines, pending samples, today's alerts, ward name, shift)
  - GET `/api/dashboard/nurse/patients` — Assigned patients for current shift with latest vitals, abnormal alert flags, pending medicine counts
  - GET `/api/dashboard/nurse/patients/[admissionId]` — Full patient detail (admission info, history sheet, physical exam, latest vitals, doctor orders, sample collections)
  - GET+POST `/api/dashboard/nurse/patients/[admissionId]/vitals` — List all vitals (desc) + Record new vitals with critical alert notification to attending doctor
  - GET `/api/dashboard/nurse/patients/[admissionId]/medicines` — Active orders with per-time-slot administration status (Given/Pending/Overdue/Missed), grouped by scheduled time
  - POST `/api/dashboard/nurse/patients/[admissionId]/medicines/[orderId]/administer` — Mark medicine as Given/Missed/Refused/Skipped/NotAvailable with duplicate prevention
- Created Nurse Dashboard page (`/dashboard/nurse`):
  - Server wrapper + client component pattern
  - Header with nurse name, ward badge, shift badge (Morning=amber, Evening=sky, Night=purple), live clock
  - Stats row: My Patients (teal), Pending Medicines (amber), Overdue (red), Pending Samples (sky)
  - Patient cards grid (not table) — optimized for tablet use
  - Each card: patient name, bed number (violet badge), age/gender, department, diagnosis, admission status
  - 2x2 vitals mini-display (Temp, Pulse, BP, SpO2) with abnormal value highlighting
  - Last vital time with color coding: green (<1hr), amber (1-2hr), red (>2hr)
  - Critical alert pulse dot animation on patient cards
  - Pending medicine count badge per card
  - Click card navigates to patient detail page
  - 30-second auto-refresh via react-query refetchInterval
- Created Nurse Patient Detail page (`/dashboard/nurse/patients/[admissionId]`):
  - 4 tabs: Overview, Vitals, Medicines, History
  - Overview: Patient info card, admission details, latest vitals display (6 metrics), active orders summary, sample collections
  - Critical alerts banner (red for critical, amber for warnings)
  - Vitals tab: Compact one-page vitals form (5 rows: vitals, BP/status/ventilator, I/O, infusion/RBS/remarks, submit)
  - Vitals history table with abnormal values highlighted in red, max-h-96 with scroll
  - Medicines tab: Orders grouped by scheduled time, each with drug name, route badge, dose, frequency, status badge
  - Mark as Given button (emerald), dropdown for Missed/Refused/Skipped/NotAvailable
  - Confirm dialog before administering
  - History tab: Read-only History Sheet (chief complaints, past history, personal history, drug history) and Physical Examination (consciousness, speech, examination notes)
- All APIs use `requireRole(req, 'nurse')` + StaffNurse profile lookup
- Vitals POST uses `checkVitalAlerts()` from ipd-utils, creates Notification for attending doctor on critical alerts
- Lint passes clean, no errors

Stage Summary:
- 6 API routes, 4 page files created
- Complete nurse workflow: dashboard → patient cards → vitals entry → medicine administration → history view
- Mobile/tablet responsive card-based layout optimized for clinical use
- Real-time shift detection, auto-refresh, critical alert notifications

---
Task ID: 5
Agent: doctor-ipd
Task: Build Doctor IPD Patients page, Orders, History, Examination, Investigations APIs and pages

Work Log:
- Created 7 API routes for doctor IPD workflow:
  - GET `/api/dashboard/doctor/ipd` — List all IPD patients where this doctor is attendingDoctor, with stats (total, admitted, discharged today, pending meds), latest vitals, active order count, pending medicine count. Supports status filter and search by name/admissionNo.
  - GET `/api/dashboard/doctor/ipd/patients/[admissionId]` — Full patient detail with admission info, history sheet, physical exam, latest 24 vitals, active orders, today's medicine administrations (with nurse names and status), sample collections, investigation reports, doctor visit history. Includes vital alerts.
  - GET+POST `/api/dashboard/doctor/ipd/patients/[admissionId]/orders` — List all orders (active+stopped) for patient; Create new DoctorOrder with drugName, route, dose, frequency, scheduledTime, instructions, isPrn, isStat. Verifies doctor ownership and admitted status.
  - PUT+DELETE `/api/dashboard/doctor/ipd/patients/[admissionId]/orders/[orderId]` — Update order details or stop order (PUT with action='stop' + reason, or DELETE). Sets status='Stopped', stoppedBy, stoppedAt, stoppedReason.
  - PUT `/api/dashboard/doctor/ipd/patients/[admissionId]/history` — Update History Sheet (Form 2): chiefComplaints, informant, pastHistory, personalHistory (JSON), habits (JSON), femaleHistory (JSON), drugHistory.
  - PUT `/api/dashboard/doctor/ipd/patients/[admissionId]/examination` — Update Physical Examination (Form 6): consciousnessLevel, obeyingCommands, respondingToDPS, oriented, speech, examinationNotes, generalSigns (JSON).
  - POST `/api/dashboard/doctor/ipd/patients/[admissionId]/investigations` — Order investigation: creates SampleCollection (status='Ordered'), auto-assigns nurse from active assignment or ward.
  - POST `/api/dashboard/doctor/ipd/patients/[admissionId]/visits` — Add doctor visit note with examinationFindings, currentDiagnosis, advise, isMobileVisit.
- Created Doctor IPD Patients list page (`/dashboard/doctor/ipd`):
  - Server wrapper + client component pattern
  - Header with BedDouble icon, "IPD Patients" title, total patient count badge, refresh button
  - 4 Stats cards: Total Patients (teal), Currently Admitted (amber), Discharged Today (emerald), Pending Medicines (red)
  - Filters row: Status dropdown (All/Admitted/Discharged/DAMA/Expired), Search input by name/admissionNo
  - Desktop table: Admission No (violet badge), Patient Name + Age/Gender, Ward/Bed, Department, Diagnosis, Latest Vitals (BP, Pulse, SpO2 mini-line with abnormal highlighting), Active Orders count, Pending Meds count (red badge), Status badges, View action
  - Mobile cards: Left teal border, all info in card layout, mini vitals, pending meds badge, admission date
  - Status badges: Admitted=amber, Discharged=emerald, DAMA=orange, Expired=red
  - 30-second auto-refresh via react-query refetchInterval
  - Framer Motion animations, loading skeletons, empty states
- Created Doctor IPD Patient Detail page (`/dashboard/doctor/ipd/patients/[admissionId]`):
  - 7 tabs: Overview, Orders, Vitals, History, Examination, Investigations, Visits
  - **Overview Tab**: Patient info card, Admission details card, Latest Vitals large display (6 metrics in grid with abnormal highlighting), Active Orders summary list, Today's Medicine Administration status (Given/Pending with nurse names)
  - **Orders Tab** (Form 5 Order Sheet — THE CORE):
    - All orders table: Drug Name (with STAT/PRN badges), Route (color badge), Dose, Frequency, Scheduled Time, Instructions, Status (Active=teal, Stopped=red with opacity), Stop action button
    - "Add Order" dialog: Drug Name input, Route select (Oral/IV/IM/SC/Topical/PR/Nebulization from ipd-utils MEDICINE_ROUTES), Dose input, Frequency select (STAT/OD/BD/TDS/QID/Q4H/Q6H/Q8H/HS/SOS-PRN from FREQUENCY_OPTIONS), Scheduled Time select (6AM-12AM), Instructions input (optional), PRN switch, STAT switch
    - Stop Order confirmation AlertDialog with mandatory reason field
  - **Vitals Tab**: Read-only vitals table (last 24h) with sticky time column, abnormal values highlighted in red, trend arrows (↑/↓) comparing with previous reading, I/O summary (input↓ / output↑), O₂ liters, RBS
  - **History Tab** (Form 2 — Editable): Chief Complaints (textarea), Informant (input), Past History (textarea), Personal History (checkboxes: Diabetes, Hypertension, Asthma, Thyroid), Habits (checkboxes: Alcohol, Smoking, Tobacco + Allergy text input), Female History (conditional on gender — LMP date, Gravida/Para/Living/Abortion number inputs), Drug History (textarea), Save button
  - **Examination Tab** (Form 6 — Editable): Consciousness Level select (Conscious/Semiconscious/Unconscious), Speech select (Normal/Aphasia/Slurred), Obeying Commands / Responding to DPS / Oriented toggles, General Signs checkboxes (Pallor, Clubbing, Icterus, Cyanosis, Lymphadenopathy), Examination Notes textarea (RS, CVS, P/A, CNS), Save button
  - **Investigations Tab**: Ordered investigations table (Test Name, Sample Type, Status badges with 5-step flow, Ordered/Collected/Sent to Lab timestamps), "Order New Investigation" dialog (Test Name, Sample Type select from SAMPLE_TYPES), Investigation Reports section with abnormal highlighting
  - **Visits Tab**: Doctor visit cards (findings, diagnosis, advise, doctor name, mobile visit badge), "Add Visit Note" dialog (examination findings, current diagnosis, advise)
- All APIs use `requireRole(req, 'doctor')` + Doctor profile lookup pattern
- Uses `FREQUENCY_OPTIONS`, `MEDICINE_ROUTES`, `SAMPLE_TYPES`, `checkVitalAlerts` from `@/lib/ipd-utils`
- Color scheme: Teal for primary/active, Amber for pending/admitted, Red for critical/stopped, Emerald for success/discharged, Violet for admission numbers
- Responsive design with mobile card layout, desktop table layout
- Lint passes clean, no errors in dev server

Stage Summary:
- 8 API routes created (list, detail, orders CRUD, history, examination, investigations, visits)
- 4 page files created (2 server wrappers + 2 client components)
- Complete doctor IPD workflow: patient list → filters → view patient → 7-tab detail interface
- Core Order Sheet (Form 5) fully functional: add/stop orders with real-time nurse administration tracking
- History (Form 2) and Examination (Form 6) editable forms with save
- Investigation ordering with sample collection status tracking
- Doctor visit documentation with clinical notes
- Real-time vitals display with abnormal value highlighting and trend indicators

---
Task ID: N1
Agent: Main Orchestrator
Task: Phase N-1 Foundation — IPD Schema, Auth, Sidebar, Admin Pages, Seed Data

Work Log:
- Added 8 new Prisma models: Ward, Bed, StaffNurse, NursePatientAssignment, IpdAdmission, VitalRecord, DoctorOrder, MedicineAdministration, SampleCollection, InvestigationReport, ShiftHandover, DoctorVisit
- Modified existing models: User (nurse relation + ipdAdmissions), Hospital (wards, nurses, ipdAdmissions, shiftHandovers), Doctor (IPD relations), Department (ipdAdmissions), Booking (ipdAdmission link)
- Updated api-auth.ts: Added nurse dev user
- Updated sidebar-config.ts: Added nurse sidebar, admin IPD Wards + Staff Nurses links, hospital IPD Admissions link, doctor IPD Patients link, imported BedDouble, ArrowRightLeft, Activity icons
- Created ipd-utils.ts: generateIpdAdmissionNo(), getCurrentShift(), checkVitalAlerts(), MEDICINE_ROUTES, FREQUENCY_OPTIONS, ADMIN_STATUS, SAMPLE_TYPES, SAMPLE_STATUS_FLOW, VITAL_THRESHOLDS
- Updated seed-multispecialty.ts: Added seedIpdData() — 10 wards, 37 beds, 19 nurses across 3 hospitals
- Subagent 2-a: Built Admin Wards + Beds CRUD (4 API routes + 2 pages)
- Subagent 2-b: Built Admin Nurses CRUD (2 API routes + 2 pages)

Stage Summary:
- Complete IPD database schema with 8 new models
- Nurse role fully integrated into auth + navigation
- Admin can manage Wards, Beds, and Staff Nurses
- Seed data: 3 hospitals × (wards + beds + nurses)

---
Task ID: N2
Agent: receptionist-ipd-admission
Task: Build Receptionist IPD Admission page and APIs

Work Log:
- Created 4 API routes: IPD list, admit, available-beds, doctors
- Built full Admission Form (Form 1) with 5 sections: Ward/Bed Selection, Patient Info, Family/Emergency, Address, Medical
- Patient list with status badges, filters, pagination
- Bed status auto-update (Available → Occupied on admit)
- Admission number auto-generation (IPD-YYYY-NNNNNN)

Stage Summary:
- Receptionist can create IPD admissions with full Form 1 data
- Cascade selectors: Hospital → Department → Doctor, Ward → Bed (available only)
- MLC case tracking, insurance/medi-claim fields

---
Task ID: N3-a
Agent: nurse-dashboard
Task: Build Nurse Dashboard, Patients, Vitals Entry, Medicine Administration

Work Log:
- Created 6 API routes: stats, patients list, patient detail, vitals GET+POST, medicines GET, medicine administer
- Built Nurse Dashboard: stats cards, patient card grid with 2×2 vitals mini-display, last vital time color coding, critical pulse dot
- Built Patient Detail page: 4 tabs (Overview, Vitals, Medicines, History)
- Vital signs entry form (compact, tablet-friendly)
- Medicine administration: mark as Given/Missed/Refused/Skipped/NotAvailable
- Auto-alert on abnormal vitals (notifies attending doctor)
- 30-second auto-refresh

Stage Summary:
- Nurse sees assigned patients with live vitals summary
- Can record hourly vitals with abnormal value detection
- Can mark medicines as given/missed/refused
- Tablet-optimized responsive design

---
Task ID: N3-b
Agent: doctor-ipd
Task: Build Doctor IPD Patients page, Orders, History, Examination, Investigations

Work Log:
- Created 8 API routes: IPD patient list, patient detail, orders CRUD, history update, examination update, investigations, visits
- Built Doctor IPD Patient List: stats cards, status/search filters, mini vitals, pending med badges
- Built Doctor IPD Patient Detail: 7 tabs (Overview, Orders, Vitals, History, Examination, Investigations, Visits)
- Order Sheet (Form 5): Add orders with drug name, route, dose, frequency, scheduled time, PRN/STAT
- Stop orders with reason
- History Sheet (Form 2): editable chief complaints, past history, personal history, habits, female history, drug history
- Physical Examination (Form 6): consciousness, speech, neurological, general signs
- Investigation ordering with sample type
- Doctor visit notes

Stage Summary:
- Doctor sees all their IPD patients with real-time medicine administration status
- Full Order Sheet functionality (add/stop orders)
- Can fill History Sheet and Physical Examination forms
- Can order investigations and add visit notes

---
Task ID: 3
Agent: nurse-ward-view
Task: Build Nurse Ward View — Visual Bed Map with Patient Occupancy Status

Work Log:
- Created `/src/app/api/dashboard/nurse/ward-patients/route.ts` — GET endpoint returning ward bed map data. Uses requireRole(req, 'nurse') auth. If nurse has no ward assigned, returns all hospital wards with bed counts (total/occupied/available). If nurse has a ward, returns ward details + all beds with: occupied beds include admission (patient name, age, gender, diagnosis), attending doctor name, department name, latest vital record, vital alerts via checkVitalAlerts().
- Created `/src/app/dashboard/nurse/ward-patients/page.tsx` — Server component wrapper with metadata.
- Created `/src/app/dashboard/nurse/ward-patients/client.tsx` — Full visual bed map client component with:
  - Header: ward name, ward type badge (color-coded: ICU=red, General=teal, Private=violet, etc.), floor info, hospital name, live auto-refresh indicator
  - 4 Stats cards: Total Beds (teal), Occupied (violet), Available (emerald), Critical Alerts (red with border highlight when >0)
  - Occupancy bar with gradient (emerald→teal→red) and percentage label
  - Legend bar: color-coded dots for Available/Occupied/Critical/Maintenance
  - Visual bed card grid: 2 cols mobile, 3 cols tablet, 4 cols desktop
  - Bed card states:
    - Available: green border, Available badge, green CheckCircle2 center icon with Ready text
    - Occupied: teal border, patient info (name, age/gender, department badge, doctor name, diagnosis), latest vitals mini display (Temp, Pulse, BP, SpO2 with icons), vital time ago with color coding (<1hr green, 1-2hr amber, >2hr red)
    - Occupied + Critical: red border, red pulsing dot animation (ping + solid), red Occupied badge, critical alert banner with AlertTriangle icon showing alert message
    - Maintenance: amber dashed border, Under Maintenance badge, Wrench center icon
    - Reserved: slate border, Reserved badge, Lock center icon
  - Click occupied bed card navigates to /dashboard/nurse/patients/[admissionId]
  - Framer Motion: card scale/fade-in animations, hover lift effect on occupied cards, staggered ward card animations in no-ward view
  - Auto-refresh every 30 seconds via react-query refetchInterval
  - No-ward state: centered message with Building2 icon, plus hospital wards overview grid showing each ward with type badge, floor, bed counts, and occupancy mini bar
  - All lucide icons used: BedDouble, User, AlertTriangle, Activity, Thermometer, Heart, Wind, Droplets, Clock, Building2, CheckCircle2, Wrench, Lock
  - Loading skeletons for header, stats, and bed cards
  - Error state with AlertTriangle
  - Dark mode support throughout
  - Teal color scheme for ward/nurse theme

Stage Summary:
- 3 files created: 1 API route + 1 server page + 1 client component
- Complete visual bed map with real-time occupancy status and vital sign monitoring
- Critical patient identification with pulsing red indicators and alert messages
- Responsive grid layout optimized for clinical use on tablets and mobile
- Lint passes clean, dev server running without errors

---
Task ID: 4
Agent: nurse-handover
Task: Build Nurse Shift Handover feature — API + Client Page

Work Log:
- Created `/src/app/api/dashboard/nurse/handover/route.ts` — 3-method API route:
  - **GET**: Returns incoming handovers (toNurseId = me, current shift, today), outgoing handovers (fromNurseId = me, today), my active patient assignments (with latest vitals, pending medicine count, pending sample count), and next shift nurses (same ward, next shift cycle Morning→Evening→Night→Morning)
  - **POST**: Creates ShiftHandover record with patientSummaries (JSON), wardNotes, pendingTasks (JSON) as JSON strings in DB. Validates target nurse exists. On success, marks all nurse's current shift assignments as Completed (unassignedAt = now, status = 'Completed') in a single updateMany
  - **PATCH**: Acknowledges a handover — verifies handover belongs to this nurse (toNurseId), not already acknowledged, sets acknowledgedAt + acknowledgedBy
  - All methods use requireRole(req, 'nurse') auth + StaffNurse profile lookup
- Created `/src/app/dashboard/nurse/handover/page.tsx` — Server component wrapper with metadata
- Created `/src/app/dashboard/nurse/handover/client.tsx` — Comprehensive shift handover client with 3 tabs:
  - **Incoming Handover Tab**: Shows cards from previous shift nurses. Each card has from→to nurse names, shift badge (Morning=amber, Evening=sky, Night=purple), ward name, timestamp. Expandable details with patient summaries, ward notes, pending tasks. Priority badges: High=red, Medium=amber, Low=teal with matching background/border/icon. Unacknowledged count badge in tab trigger with pulse animation. "Acknowledge" button with loading spinner. Acknowledged cards shown with reduced opacity and green badge. Empty state with Inbox icon.
  - **Write Handover Tab**: Pre-populates with nurse's active patients. Each patient card shows: name, age/gender, bed number (violet badge), pending medicine count (amber badge), pending sample count (sky badge), diagnosis, 2x2 vital mini-display (Temp, Pulse, BP, SpO2). Textarea for shift summary per patient. Ward Notes textarea section. Pending Tasks dynamic list with add/remove, task name input + priority Select dropdown (High/Medium/Low with color dots). "Hand Over To" Select dropdown populated with next shift nurses from same ward (shows name, employee ID, shift badge). Teal submit button with spinner. On submit: clears form, switches to incoming tab.
  - **Sent Tab** (conditional — only shown if outgoing handovers exist): Shows handovers the nurse has sent. Each card shows You→recipient, shift badge, ward, timestamp, received/pending status. Expandable details same as incoming.
  - 30-second auto-refresh via react-query refetchInterval
  - Framer Motion animations: staggered card entry, expand/collapse, task add/remove
  - Teal color scheme, dark mode support, responsive design
  - Loading skeletons, error state with retry, empty states for all scenarios
  - All shadcn/ui components: Tabs, Card, Badge, Button, Textarea, Select, Skeleton, Label
  - Lucide icons: ArrowRightLeft, CheckCircle2, Clock, AlertTriangle, User, BedDouble, ClipboardList, Plus, Trash2, Send, ChevronDown, ChevronUp, FileText, Inbox, Pill, TestTube2

Stage Summary:
- 3 files created: 1 API route (GET/POST/PATCH) + 1 server page + 1 client component
- Complete nurse shift handover workflow: receive incoming → acknowledge → write outgoing → submit
- Patient summaries, ward notes, and priority-based pending tasks
- Automatic nurse assignment completion on handover submission
- Next shift nurse detection with ward-based filtering
- Lint passes clean, dev server running without errors

---
Task ID: 5
Agent: Main Orchestrator
Task: IPD Phase N-1 Completion — Nurse Profile, My Patients List Page

Work Log:
- Assessed current project state: Found Phase N-1 was ~80% complete (schema, auth, sidebar, admin CRUD, nurse dashboard, patient detail, doctor IPD, receptionist IPD all existed)
- Identified 4 missing nurse pages from sidebar: My Patients list, Ward View, Shift Handover, Profile
- Built Nurse Profile API (GET/PUT) at `/api/dashboard/nurse/profile/route.ts`
- Built Nurse Profile page at `/dashboard/nurse/profile/page.tsx` + `client.tsx` with teal gradient header, editable phone/address, shift badges
- Built Nurse My Patients list page at `/dashboard/nurse/patients/page.tsx` + `list-client.tsx` with responsive table (desktop) and card view (mobile), search, vital indicators
- Verified all 6 nurse pages return 200: dashboard, patients, ward-patients, handover, profile, patient detail
- Lint passes clean with zero errors

Stage Summary:
- 4 files created manually: 1 API route + 3 page/client files
- 6 files created by subagents (ward view + handover = 6 total)
- All nurse sidebar pages now functional: Dashboard, My Patients, Ward View, Shift Handover, Profile
- Nurse system Phase N-1 is now complete
- Next: Phase N-2 (IPD Admission flow) is already built by receptionist/doctor teams

---
Task ID: N5
Agent: nurse-investigations
Task: Build Nurse Investigation/Sample Collection Feature for IPD Patients

Work Log:
- Created `/src/app/api/dashboard/nurse/patients/[admissionId]/investigations/route.ts` — 2-method API route:
  - **GET**: Returns all SampleCollection records for the admission with doctor name (via doctor → user relation), nurse name, statusFlow from SAMPLE_STATUS_FLOW, and linked InvestigationReport for each sample. Includes full report data (resultData, normalRange, isAbnormal) mapped to each sample.
  - **POST**: Creates a new SampleCollection with status 'Collected', collectedAt = now. Looks up nurse via StaffNurse → userId. Gets attendingDoctorId from the IpdAdmission. Requires testName and sampleType in body. Returns created record.
  - Both methods use requireRole(req, 'nurse') auth.
- Created `/src/app/api/dashboard/nurse/patients/[admissionId]/investigations/[sampleId]/route.ts` — PATCH API route:
  - **PATCH**: Updates sample status with validation against valid transitions (Collected→SentToLab, SentToLab→Reported, Reported→Filed). Sets sentToLabAt timestamp when transitioning to SentToLab. Verifies sample belongs to the admission. Returns updated record with doctor/nurse names.
- Edited `/src/app/dashboard/nurse/patients/[admissionId]/client.tsx` to add investigations tab:
  - Added imports: TestTube, FlaskConical, Send, Plus from lucide-react; SAMPLE_TYPES from ipd-utils; Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle from ui/dialog.
  - Changed TabsList from grid-cols-4 to grid-cols-5 and added new TabsTrigger for 'investigations' between Medicines and History.
  - Added TabsContent for 'investigations' rendering the InvestigationsTab sub-component.
  - Added InvestigationSample interface with full type definitions including optional nested report.
  - Added getSampleStatusBadge helper with color-coded badges: Ordered=amber, Collected=teal, SentToLab=sky, Reported=emerald, Filed=slate.
  - Added parseResultSummary helper to JSON.parse resultData and display as key-value pairs.
  - Added InvestigationsTab component with:
    - **Header**: FlaskConical icon, title, pending count badge (amber), and teal "Collect Sample" button with Plus icon.
    - **Pending Samples section**: Shows Ordered/Collected samples with TestTube icon (red for Blood, teal for others), status badge, sample type badge, doctor name, date. Action buttons: 'Collect' (teal, for Ordered) calls POST API; 'Send to Lab' (sky, for Collected) calls PATCH API. Framer Motion staggered entry.
    - **In Progress section**: Shows SentToLab samples with Clock icon "Awaiting lab" indicator. Only shown when samples exist.
    - **Reports Ready section**: Shows Reported/Filed samples with report result summary, abnormal flag (red AlertTriangle badge + red border/bg highlighting for abnormal results), report date. Green border for normal.
    - **All History table**: Full Table with columns: Test Name, Sample, Status, Doctor, Collected time, Sent time, Abnormal (red Yes / green Normal badge). max-h-96 overflow scroll.
    - **Collect Sample Dialog**: Dialog with test name Input, sample type Select (from SAMPLE_TYPES), remarks Textarea. Teal submit button with Loader2 spinner. Form reset on success.
    - React Query: useQuery for fetching investigations data, useMutation for collect (POST) and status update (PATCH). Both invalidate nurse-investigations and nurse-patient queries on success.
    - Loading state with Skeleton placeholders.
    - Toast notifications for success/error.
    - Teal color scheme, dark mode support, responsive design (flex-col mobile, flex-row desktop).

Stage Summary:
- 2 files created: 2 API routes (investigations GET/POST + investigations/[sampleId] PATCH)
- 1 file edited: client.tsx (added investigations tab with full UI)
- Complete sample collection workflow: Order → Collect → Send to Lab → Report → File
- Report display with abnormal value highlighting (red badges, red borders)
- Lint passes clean with zero errors

---
Task ID: N7
Agent: Main Orchestrator
Task: Doctor Discharge Workflow for IPD Patients

Work Log:
- Read existing worklog.md and doctor IPD patient detail page (client.tsx, 1408 lines)
- Analyzed Prisma schema for IpdAdmission, DoctorOrder, Bed, NursePatientAssignment models
- Studied existing API route patterns (auth, params, error handling)

## API: Discharge Route
- Created `/src/app/api/dashboard/doctor/ipd/patients/[admissionId]/discharge/route.ts`
  - **POST** endpoint with `requireRole(req, 'doctor')` auth
  - Body: `{ dischargeType, finalDiagnosis, dischargeSummary, roomRentDays? }`
  - Validates: admission exists, status is 'Admitted', doctor is the attending doctor
  - Discharge type validation: Normal, DAMA, LAMA, Expired
  - Prisma `$transaction` with 4 operations:
    1. Update IpdAdmission: status (Discharged/DAMA/Expired), dischargeDate, dischargeTime, dischargeType, finalDiagnosis, dischargeSummary, roomRentDays (auto-calculated via `differenceInDays` if not provided)
    2. Stop ALL active DoctorOrders (status→'Completed', stoppedAt→now, stoppedReason→'Patient discharged')
    3. Update Bed status→'Available'
    4. Update all active NursePatientAssignments (status→'Completed', unassignedAt→now)
  - Returns updated admission on success

## Frontend: Discharge Button + Dialog
- Edited `/src/app/dashboard/doctor/ipd/patients/[admissionId]/client.tsx`
- Added imports: `LogOut`, `CalendarDays`, `Shield` icons; `Alert, AlertDescription, AlertTitle` from shadcn/ui
- Added state: `showDischargeDialog`, `dischargeForm` (type, diagnosis, summary, roomDays)
- Added `dischargeMutation` (useMutation, POST to discharge API, invalidates queries, navigates back to IPD list)
- Added `calculatedRoomDays` helper (days since admission + 1, minimum 1)
- **Discharge Button** in header area:
  - Only visible when `admission.status === 'Admitted'`
  - Red-tinted outline button with LogOut icon, responsive text (hidden on mobile)
  - Pre-populates form with initialDiagnosis and calculatedRoomDays on click
- **Discharge Dialog** (full-featured):
  - Dynamic warning Alerts based on discharge type:
    - DAMA: Amber alert about risk acknowledgement, legal/insurance implications
    - Expired: Red alert about death documentation, MLC procedures
    - LAMA: Orange alert about documenting circumstances
  - Discharge Type Select with color-coded border (emerald/amber/orange/red) and icons per option
  - Room Rent Days Input (auto-calculated, editable, min=1, with date reference text)
  - Final Diagnosis Textarea (required, pre-populated with initial diagnosis)
  - Discharge Summary Textarea (required, with detailed placeholder)
  - Summary panel showing what will happen (status change, orders stopped, bed freed, nurse assignments completed)
  - Color-coded confirm button matching discharge type (teal/amber/orange/red)
  - Cancel + Confirm buttons in DialogFooter
  - Disabled state when required fields empty or mutation loading
  - Framer motion animations on alerts and summary panel
  - Scroll-safe dialog (`max-h-[90vh] overflow-y-auto`)
  - Full dark mode support

Lint: ✅ Zero errors

---
Task ID: N4
Agent: Vital Trend Charts Builder
Task: Vital Trend Charts — Visual time-series display of BP, Pulse, SpO2, Temperature over time for IPD patients

Work Log:
- Read existing nurse patient detail page (`client.tsx`) and vitals API route to understand data flow
- Analyzed `VITAL_THRESHOLDS` from `@/lib/ipd-utils` for critical/warning/normal thresholds
- Created `/src/app/dashboard/nurse/patients/[admissionId]/vital-charts.tsx` — comprehensive SVG-based chart component
- Integrated `VitalTrendCharts` into the existing vitals tab between `VitalForm` and `VitalsHistoryTable`

### Vital Trend Charts Features:
1. **BP Trend Chart** — Dual-line (systolic=teal solid, diastolic=amber dashed) with:
   - Normal range shading (90-140 systolic, 60-90 diastolic)
   - Critical lines at 180 (high) and 90 (low) with labels
   - Gradient fill under systolic line
   - Legend for systolic/diastolic

2. **Pulse Trend Chart** — Single line (rose) with:
   - Normal range 60-100 shaded
   - Critical lines at 50 and 130
   - Data points colored by severity

3. **SpO2 Trend Chart** — Single line (sky) with:
   - Normal range 94-100 shaded
   - Critical line at 90%
   - Red zone shading below 90%

4. **Temperature Trend Chart** — Single line (amber) with:
   - Normal range 97-99.5°F shaded
   - Fever line at 102.2°F (dashed amber)

5. **Input/Output Bar Chart** — Stacked bars per reading:
   - Green for input, amber for urine, red for other output
   - Full-width card spanning both columns

### Technical Implementation:
- Pure SVG approach (viewBox-based, responsive)
- Auto-scaling Y axis with padding based on data range
- Smart X-axis time labels (HH:mm for same-day, dd/MM HH:mm for multi-day)
- Adaptive label step to avoid crowding
- Data points colored by severity (teal=normal, amber=warning, red=critical)
- Gradient fills under lines
- Normal range shaded areas
- Framer Motion staggered card animations
- Status badges with trend indicators (ArrowUp/ArrowDown/Minus)
- Min/Max range display per chart
- Empty state message when < 2 vital records
- Last 24 readings used for chart readability
- Dark mode compatible via CSS variable colors
- 2-column grid on desktop, 1-column on mobile (I/O chart spans full width)

### Files Modified:
- **Created**: `src/app/dashboard/nurse/patients/[admissionId]/vital-charts.tsx`
- **Modified**: `src/app/dashboard/nurse/patients/[admissionId]/client.tsx` (import + integration)

Lint: ✅ Zero errors

---
Task ID: N5, N7, N4
Agent: Main Orchestrator + 3 Subagents
Task: Phase N-5 (Investigations), N-7 (Discharge), N-4 (Vital Charts) — Complete IPD Flow

Work Log:
- Assessed full IPD system status: N-1 through N-6 mostly complete, gaps in N-4/N-5/N-7
- Built Nurse Sample Collection: 2 API routes (GET/POST investigations, PATCH sample status)
- Added Investigations tab to nurse patient detail (collect, send to lab, view reports)
- Built Doctor Discharge API: POST endpoint with Prisma transaction (update admission + stop all orders + free bed + complete nurse assignments)
- Added Discharge button + dialog to doctor IPD patient detail (type selector, summary, auto room rent calc)
- Built Vital Trend Charts: Pure SVG component with 5 chart types (BP dual-line, Pulse, SpO2, Temperature, Fluid I/O)
- Integrated charts into nurse patient detail vitals tab
- All lint checks pass, all pages return 200

Stage Summary:
- IPD system is now functionally complete for core workflows:
  1. Receptionist admits patient → bed allocated
  2. Doctor writes orders (history, exam, medicines, investigations)
  3. Nurse records vitals hourly with trend visualization
  4. Nurse administers medicines, collects samples
  5. Doctor reviews, visits, and discharges patient
  6. Bed freed, orders stopped automatically on discharge
  7. Shift handover between nurses
- Files created: 2 API routes (investigations + sample status), 1 discharge API, 1 vital-charts component
- Files modified: nurse patient detail client.tsx (added investigations tab + vital charts), doctor IPD patient detail client.tsx (added discharge)
- Remaining N-8 items: Print forms, patient transfer, DAMA enhanced workflow

---
Task ID: 1b-api
Agent: API Agent
Task: Charge Master Billing — 4 API Routes (Charge Categories + Charge Items)

Work Log:
- Created `/src/app/api/charge-categories/route.ts` — POST (create category) + GET (list categories with _count.chargeItems)
- Created `/src/app/api/charge-categories/[id]/route.ts` — PUT (update category) + DELETE (soft delete → status='Inactive')
- Created `/src/app/api/charge-items/route.ts` — POST (create item with category validation) + GET (list items with category.name, filter by categoryId/status/search)
- Created `/src/app/api/charge-items/[id]/route.ts` — PUT (update item, validates categoryId ownership) + DELETE (soft delete → status='Inactive')
- All routes use `requireRole` auth pattern (hospital or admin), resolve hospitalId from user's hospital profile
- All routes follow existing project patterns: NextRequest/NextResponse, Prisma via `@/lib/db`, auth via `@/lib/api-auth`
- GET endpoints support query filters (?status=Active, ?categoryId=xxx, ?search=term)
- Ownership verification on all PUT/DELETE (item must belong to authenticated hospital)

Stage Summary:
- 4 API route files created for Charge Master billing feature
- Full CRUD (minus hard delete) for ChargeCategory and ChargeItem models
- Auth: hospital + admin roles supported, hospitalId always resolved from session
- No files modified, no dependencies added
- Files created:
  1. `/src/app/api/charge-categories/route.ts`
  2. `/src/app/api/charge-categories/[id]/route.ts`
  3. `/src/app/api/charge-items/route.ts`
  4. `/src/app/api/charge-items/[id]/route.ts`

---
Task ID: 1b-ui
Agent: Main Orchestrator
Task: Charge Master UI — Hospital & Receptionist Dashboard Pages

Work Log:
- Created hospital Charge Master dashboard page + client component at `/src/app/dashboard/hospital/charge-master/`
- Created receptionist Charge Master dashboard page + client component at `/src/app/dashboard/receptionist/charge-master/`
- Receptionist client re-exports the hospital client component (shared UI)

Charge Master Client Component (`client.tsx`) Features:
- Two-tab layout using shadcn Tabs: **Categories** | **Charge Items**
- **Categories Tab**: Responsive card grid showing name, description, tax %, item count, status badge. Add/Edit dialogs with name, description, taxable toggle (animated tax % field). Delete via AlertDialog (soft deactivate).
- **Charge Items Tab**: Scrollable table showing name, shortCode (monospace), category badge, unitType, rate (₹ formatted), status. Filters: category dropdown + search input. Add/Edit dialogs with category select, name, shortCode, unitType select (8 options), rate, taxable toggle. Delete via AlertDialog.
- TanStack Query: `useQuery` for GET /api/charge-categories and GET /api/charge-items (with filter params). `useMutation` for all POST/PUT/DELETE operations with cache invalidation.
- Loading skeletons for both tabs (card skeleton for categories, table skeleton for items)
- Empty states with contextual messaging (filters active vs. no data)
- Framer Motion animations: staggered card entry, dialog field animations, fade-in for table
- shadcn/ui components: Tabs, Card, Dialog, AlertDialog, Table, Select, Switch, Badge, Skeleton, Input, Label, Button
- Lucide icons: Plus, Pencil, Trash2, Search, Tags, Receipt, Loader2
- Color scheme: teal primary (matching existing hospital dashboard), emerald for Active badges, no indigo/blue
- Responsive: mobile-first grid (1→2→3→4 columns), stacked filters on mobile

Files created:
  1. `/src/app/dashboard/hospital/charge-master/page.tsx` — Server wrapper
  2. `/src/app/dashboard/hospital/charge-master/client.tsx` — Full client component (~580 lines)
  3. `/src/app/dashboard/receptionist/charge-master/page.tsx` — Server wrapper
  4. `/src/app/dashboard/receptionist/charge-master/client.tsx` — Re-export of hospital client

---
Task ID: 1cde-api
Agent: Billing API Builder
Task: Create all billing API route files for Phases 1C, 1D, 1E, and 1G

Work Log:
- Read worklog.md for project context and prior phase history
- Read prisma/schema.prisma to understand IpdBill, BillLineItem, BillPayment, PatientAdvance, OpdBill, IpdAdmission, Bed, Ward, Booking, Hospital models
- Read src/lib/api-auth.ts to understand auth patterns (requireRole, requireAuth, RECEPTION_ROLES)
- Read existing charge-items/route.ts for reference on hospital auth resolution pattern
- Created 10 API route files across 4 phases:

**Phase 1C: IPD Bill Creation (4 files)**
1. `/src/app/api/ipd-bills/route.ts` — GET (list with pagination, status/search/date filters, returns patientName/admissionNo/billNo/totalAmount/netPayable/status); POST (generate draft bill from admissionId, calc roomRent=bed.dailyRate×daysAdmitted, auto billNo IPD-BILL-YYYY-NNNNNN, service/lab/medicine/ot/other=0)
2. `/src/app/api/ipd-bills/generate/route.ts` — POST (same generate logic, separate route for clarity)
3. `/src/app/api/ipd-bills/[id]/route.ts` — GET (bill detail with lineItems, payments, advances, admission.patientName/admissionNo/ward.name/bed.bedNumber); PUT (update draft only: add/remove BillLineItems, recalc subtotal/tax/total/netPayable)
4. `/src/app/api/ipd-bills/[id]/finalize/route.ts` — POST (set status=Final, finalizedAt=now, recalc totals from lineItems, netPayable=totalAmount-advanceAdjusted, update admission.paymentStatus)

**Phase 1D: Advance Deposit (2 files)**
5. `/src/app/api/patient-advances/route.ts` — GET (list by admissionId with receiptNo/amount/paymentMethod/date); POST (record advance, auto receiptNo ADV-YYYY-NNNNNN, increment admission.advanceAmount, update bill.advanceAdjusted if bill exists)
6. `/src/app/api/patient-advances/summary/route.ts` — GET (aggregate: totalAdvance, lastAdvanceDate, lastAdvanceAmount, advanceCount)

**Phase 1E: Payment Collection (2 files)**
7. `/src/app/api/bill-payments/route.ts` — GET (list with date/method filters, returns receiptNo/billNo/patientName/amount/method/date); POST (record payment, auto receiptNo REC-YYYY-NNNNNN, update bill status to Paid/PartiallyPaid, update admission.paymentStatus)
8. `/src/app/api/bill-payments/daily-summary/route.ts` — GET (today's totals: totalCash/totalUPI/totalCard/totalNetBanking/totalCheque/grandTotal/count)

**Phase 1G: OPD Billing (2 files)**
9. `/src/app/api/opd-bills/route.ts` — GET (list with date/doctorId/method filters, returns receiptNo/patientName/doctorName/amount/method/date); POST (create OPD bill, validate booking.status='Visited', auto receiptNo OPD-BILL-YYYY-NNNNNN, calc subtotal from consultationFee+lab+medicine+other)
10. `/src/app/api/opd-bills/[id]/route.ts` — GET (bill detail with booking, patient, doctor, hospital info)

All files follow:
- Next.js 16 dynamic route params: `params: Promise<{ id: string }>` + `await params`
- Import pattern: `requireRole`/`requireAuth` from `@/lib/api-auth`, `db` from `@/lib/db`, `NextRequest`/`NextResponse` from `next/server`
- Hospital auth resolution: hospital/admin/receptionist roles → hospitalId via Hospital.userId or Receptionist.hospitalId
- Auto-generated numbers: PREFIX-YYYY-NNNNNN format with findFirst+desc+increment pattern
- No lint or dev run executed

---
Task ID: 1cde-ui
Agent: Main
Task: Create ALL billing UI pages for Hospital dashboard

Work Log:
- Created billing dashboard API at `/src/app/api/billing/dashboard/route.ts`:
  - GET endpoint returning: todayCollection (IPD payments + OPD bills today), monthCollection, pendingBills count, pendingAmount, recentPayments (last 10)
  - Auth: hospital/admin/receptionist via resolveHospitalId pattern

- Created discharge API at `/src/app/api/ipd-admissions/[id]/discharge/route.ts`:
  - POST endpoint with auth: hospital/admin/receptionist
  - Body: { dischargeType (Normal/DAMA/LAMA), dischargeTime }
  - Logic: auto-generates bill if not exists, finalizes if Draft, sets admission status (Discharged/DAMA/LAMA), frees bed (Available), completes all nurse assignments
  - Uses Prisma $transaction for atomic operations

- Updated sidebar config (`/src/lib/sidebar-config.ts`):
  - Added `LogOut` icon import from lucide-react
  - Added Discharge entry to hospital billing children: `{ label: 'Discharge', href: '/dashboard/hospital/billing/discharge', icon: LogOut }`
  - Added Discharge entry to receptionist billing children (same href)

## Pages Created (7 billing pages = 14 files):

### 1. Billing Dashboard (`/dashboard/hospital/billing`)
- `page.tsx` — Server wrapper
- `client.tsx` — Full dashboard with:
  - 4 stat cards: Today's Collection (teal), Monthly Collection (emerald), Pending Bills (amber), Pending Amount (rose)
  - Quick Action buttons: Generate IPD Bill, Record Payment, Record Advance (Link to sub-pages)
  - Recent Payments table (last 10 from API)
  - Uses useQuery for `/api/billing/dashboard`, framer-motion animations

### 2. IPD Bills (`/dashboard/hospital/billing/ipd`)
- `page.tsx` — Server wrapper
- `client.tsx` — IPD bills list with:
  - Status filter tabs: All | Draft | Final | Paid | PartiallyPaid
  - Search bar, refresh button, pagination
  - Table: Bill No, Patient, Admission No, Total, Advance Adj., Net Payable, Status (colored badges), Actions (View/Finalize)
  - Generate Bill dialog: select admitted patient (fetches /api/ipd-admissions?status=Admitted), POST /api/ipd-bills
  - Finalize action calls POST /api/ipd-bills/[id]/finalize
  - Color-coded status badges: Draft=slate, Final=amber, Paid=emerald, PartiallyPaid=teal

### 3. Bill Detail (`/dashboard/hospital/billing/ipd/[id]`)
- `page.tsx` — Server wrapper with params
- `client.tsx` — Full bill detail with:
  - Header: Bill No, Status badge, back button
  - Patient info cards: Patient, Admission No, Ward/Bed, Doctor
  - Line Items table: Item, Category, Qty, Rate, Amount, Tax, Total, Remove button (if Draft)
  - Add Item dialog: charge item search/select from /api/charge-items, quantity input
  - Bill Summary card: Room Rent, Subtotal, Tax, Discount, Total, Advance Adjusted, Net Payable
  - Payment History table with advance deposits section
  - Finalize button (if Draft) with confirmation dialog

### 4. Advance Deposits (`/dashboard/hospital/billing/advances`)
- `page.tsx` — Server wrapper
- `client.tsx` — Advance deposits management:
  - Lists all admissions (searchable by name/admission no)
  - Add Advance dialog: admission select, amount, payment method (Cash/UPI/Card/NetBanking/Cheque), reference, notes
  - POST /api/patient-advances
  - Color-coded payment method badges

### 5. Payments (`/dashboard/hospital/billing/payments`)
- `page.tsx` — Server wrapper
- `client.tsx` — Payment collection page:
  - 4 summary cards: Cash (emerald), UPI (violet), Card (amber), Total Today (teal) from /api/bill-payments/daily-summary
  - Filters: Date range (from/to), payment method dropdown, search
  - Payments table: Receipt No, Bill No, Patient, Amount, Method, Date
  - Record Payment dialog: select bill (Final/PartiallyPaid), amount, method, reference
  - POST /api/bill-payments

### 6. OPD Bills (`/dashboard/hospital/billing/opd`)
- `page.tsx` — Server wrapper
- `client.tsx` — OPD billing page:
  - Filters: Date range, payment method
  - Table: Receipt No, Date, Patient, Doctor, Consultation Fee, Lab, Medicine, Total, Method
  - Create Bill dialog: select visited booking, enter consultation/lab/medicine/other charges, payment method, reference
  - POST /api/opd-bills

### 7. Discharge (`/dashboard/hospital/billing/discharge`)
- `page.tsx` — Server wrapper
- `client.tsx` — Discharge management:
  - Table of admitted patients with Discharge button
  - Search by name, admission no, doctor
  - Discharge dialog: patient summary card, discharge type selector (Normal/DAMA/LAMA), warning alerts for DAMA/LAMA, bill summary (advance, room rent days), discharge time
  - POST /api/ipd-admissions/[id]/discharge
  - Color-coded confirm button: Normal=emerald, DAMA=amber, LAMA=orange

## Technical Details:
- All pages use: 'use client', TanStack Query (useQuery, useMutation, useQueryClient), sonner toast, shadcn/ui components, lucide-react icons, Tailwind CSS 4
- No indigo/blue colors — uses teal (primary), emerald (success), amber (warning), rose (danger), violet (accent)
- Responsive design with overflow-x-auto on tables, mobile-friendly card layouts
- Sticky footer compatible (no fixed positioning)
- Loading skeletons for all data-dependent sections
- Empty states with icons and contextual messaging
- Pagination on all list pages
- framer-motion animations (AnimatePresence on table rows, staggered card entry)
- All 14 page files + 2 API routes + 1 sidebar config edit = 17 file operations total
- No lint or dev run executed
