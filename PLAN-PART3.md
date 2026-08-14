# PLAN PART 3 — REPORTS / ANALYTICS + IPD COMPLETION + OT + DIET (P1/P2)

## PHASE 4: REPORTS & ANALYTICS

### Phase 4A: REVENUE DASHBOARD

#### API Routes

**1. GET /api/reports/revenue/summary** — Revenue summary
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?period=today|week|month|year&year=2026&month=6`
- Logic:
  - Calculate from BillPayment table for the period
  - Group by paymentMethod for breakdown
  - Compare with previous period for % change
- Return:
```json
{
  "totalRevenue": 450000,
  "previousPeriodRevenue": 380000,
  "percentChange": 18.4,
  "ipdRevenue": 300000,
  "opdRevenue": 150000,
  "advanceCollected": 120000,
  "paymentBreakdown": {"Cash": 200000, "UPI": 150000, "Card": 80000, "NetBanking": 20000},
  "dailyTrend": [{"date":"2026-01-01","amount":15000},{"date":"2026-01-02","amount":12000}]
}
```

**2. GET /api/reports/revenue/department-wise** — Revenue by department
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?fromDate=&toDate=`
- Logic: Join BillPayment → IpdBill → IpdAdmission → Department, and OpdBill → Booking → Department
- Return: `[{departmentName, ipdRevenue, opdRevenue, totalRevenue, patientCount}]`

**3. GET /api/reports/revenue/doctor-wise** — Revenue by doctor
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?fromDate=&toDate=`
- Return: `[{doctorName, department, ipdRevenue, opdRevenue, totalRevenue, patientCount}]`

**4. GET /api/reports/revenue/payment-methods** — Payment method distribution
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?fromDate=&toDate=`
- Return: `[{method, count, totalAmount, percent}]`

**5. GET /api/reports/revenue/outstanding** — Outstanding/unpaid bills
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Return: bills where netPayable > 0 and status != 'Paid'
- `[{billNo, patientName, admissionNo, totalAmount, paidAmount, netPayable, daysOutstanding}]`

**6. GET /api/reports/revenue/daily-collection** — Daily collection for calendar view
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'receptionist')`
- Query: `?month=6&year=2026`
- Return: `[{date, cashAmount, upiAmount, cardAmount, totalAmount}]`

#### Dashboard Pages

**Hospital → Reports → Revenue** (`/dashboard/hospital/reports/revenue`)
- Sidebar add for hospital:
```
{ label: 'Reports', href: '/dashboard/hospital/reports', icon: BarChart3, children: [
  { label: 'Revenue', href: '/dashboard/hospital/reports/revenue', icon: IndianRupee },
  { label: 'IPD Analytics', href: '/dashboard/hospital/reports/ipd', icon: BedDouble },
  { label: 'OPD Analytics', href: '/dashboard/hospital/reports/opd', icon: CalendarDays },
  { label: 'Financial', href: '/dashboard/hospital/reports/financial', icon: TrendingUp },
  { label: 'Inventory', href: '/dashboard/hospital/reports/inventory', icon: Package },
  { label: 'Lab', href: '/dashboard/hospital/reports/lab', icon: FlaskConical },
] },
```
- Add `TrendingUp, Package` to lucide-react imports if not already
- `client.tsx`:
  - Period selector: Today / Week / Month / Year / Custom Date Range
  - Top row: 4 stat cards — Total Revenue (with % change vs last period), IPD Revenue, OPD Revenue, Outstanding Amount
  - Payment Methods: horizontal bar chart (CSS-only, no chart lib) showing Cash/UPI/Card/NetBanking
  - Daily Trend: simple bar chart (CSS divs with height based on amount)
  - Department-wise table
  - Doctor-wise table
  - Outstanding bills table with "days outstanding" column

**Admin → Reports → Revenue** (`/dashboard/admin/reports/revenue`)
- Same as hospital but with hospital filter dropdown (see all hospitals)

### Phase 4B: IPD ANALYTICS

#### API Routes

**1. GET /api/reports/ipd/summary** — IPD summary stats
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?period=month&year=2026&month=6`
- Return:
```json
{
  "totalAdmissions": 45,
  "totalDischarges": 38,
  "currentOccupancy": 30,
  "totalBeds": 100,
  "occupancyRate": 30.0,
  "avgLengthOfStay": 5.2,
  "totalBedDays": 225,
  "bedRevenue": 450000,
  "wardBreakdown": [{"wardName":"ICU","beds":10,"occupied":8,"admissions":12,"revenue":200000}],
  "dischargeBreakdown": [{"type":"Normal","count":32},{"type":"DAMA","count":4},{"type":"LAMA","count":2}]
}
```

**2. GET /api/reports/ipd/bed-occupancy** — Bed occupancy trends
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?days=30`
- Return: `[{date, totalBeds, occupied, occupancyPercent}]`

**3. GET /api/reports/ipd/length-of-stay** — Average length of stay by department
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Return: `[{department, avgLOS, minLOS, maxLOS, admissions}]`

**4. GET /api/reports/ipd/disease-wise** — Admissions by diagnosis
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Return: `[{diagnosis, count, avgLOS, avgBill}]` (top 20 by count)

#### Dashboard Pages

**Hospital → Reports → IPD Analytics** (`/dashboard/hospital/reports/ipd`)
- Stat cards: Total Admissions, Current Occupancy (with %), Avg LOS, Bed Revenue
- Ward-wise breakdown table: Ward, Beds, Occupied, Admissions, Revenue
- Bed Occupancy Trend: simple line/bar chart (CSS)
- Discharge Type pie breakdown (CSS circle segments)
- Disease-wise table

### Phase 4C: OPD + FINANCIAL REPORTS

#### API Routes

**1. GET /api/reports/opd/summary** — OPD summary
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?period=month&year=2026&month=6`
- Return: `{ totalAppointments, visitedCount, cancelledCount, noShowCount, revenue, topDepartments, doctorWise: [{doctorName, dept, appointments, revenue}] }`

**2. GET /api/reports/opd/hourly** — Hourly patient flow
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?date=2026-06-15`
- Return: `[{hour: "09:00", newPatients: 5, followUp: 3, total: 8}]`

**3. GET /api/reports/financial/profit-loss** — Simple P&L
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?fromDate=&toDate=`
- Logic: Revenue = bill payments, Expenses = purchase order costs
- Return: `{ revenue: {ipd, opd, lab, pharmacy}, expenses: {inventory, salary(placeholder), utilities(placeholder)}, grossProfit, netProfit, profitMargin }`

**4. GET /api/reports/financial/age-wise-receivable** — Aging analysis
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Return: `[{aging: "0-30 days", count: 5, amount: 75000}, {aging: "31-60 days", count: 3, amount: 120000}, {aging: "60+ days", count: 2, amount: 95000}]`

#### Dashboard Pages

**Hospital → Reports → OPD Analytics** (`/dashboard/hospital/reports/opd`)
- Stat cards: Total Appointments, Visited, Revenue, Cancellation Rate
- Hourly flow bar chart
- Department-wise table
- Doctor-wise performance table

**Hospital → Reports → Financial** (`/dashboard/hospital/reports/financial`)
- Revenue vs Expenses summary cards
- Simple P&L statement table
- Aging receivable table with color coding (green/yellow/red)
- Payment collection efficiency card

### Phase 4D: INVENTORY + LAB REPORTS

#### API Routes

**1. GET /api/reports/inventory/summary** — Inventory value report
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Return: `{ totalItems, totalValue, categoryBreakdown, lowStockCount, expiredCount, topConsumedItems: [{name, qty, value}] }`

**2. GET /api/reports/inventory/consumption** — Item consumption report
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?fromDate=&toDate=&category=Medicine`
- Return: items with total issued/consumed qty in period, sorted by value descending

**3. GET /api/reports/lab/summary** — Lab report stats
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?fromDate=&toDate=`
- Return: `{ totalTests, verified: count, pending: count, revenue, topTests: [{name, count, revenue}], tatl: count }`

**4. GET /api/reports/lab/tatl** — Turnaround time report
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Return: `[{testName, avgTAT_hours, minTAT, maxTAT, count}]` (TAT = time from Ordered to Verified)

#### Dashboard Pages

**Hospital → Reports → Inventory** (`/dashboard/hospital/reports/inventory`)
- Total inventory value card
- Category breakdown table
- Top consumed items table
- Expiring items alert section

**Hospital → Reports → Lab** (`/dashboard/hospital/reports/lab`)
- Test volume cards (total, verified, pending)
- Top tests by volume table
- Turnaround time table
- Revenue from lab

---

## PHASE 5: IPD COMPLETION + OPERATION THEATER + BED TRANSFER + DIET (P2)

### Phase 5A: IPD N-2→N-8 COMPLETION

This phase completes the remaining IPD nurse/doctor forms that exist in schema but don't have full API + UI.

#### Existing Schema Models (already exist, need APIs + UI)

Models: DoctorVisit, InvestigationReport, SampleCollection, ShiftHandover, MedicineAdministration

These models exist in schema but many lack complete API routes and UI pages.

#### New Fields to Add to IpdAdmission
```
  dischargeAdvised     Boolean  @default(false)
  followUpDate         DateTime?
  followUpNotes        String   @default("")
```

#### API Routes

**1. POST /api/ipd-doctor-visits** — Doctor creates daily visit note
- Auth: `requireRole(req, 'doctor')`
- Body: `{ admissionId, visitTime, examinationFindings, currentDiagnosis, newOrders (JSON), stoppedOrders (JSON), advise, isMobileVisit }`
- Logic: Create DoctorVisit, auto-set visitDate=now()
- Return: created visit

**2. GET /api/ipd-doctor-visits** — List visits for admission
- Auth: `getAuthUser(req)`
- Query: `?admissionId=xxx`
- Return: array with doctorName, visitDate, visitTime, diagnosis, advise

**3. PUT /api/ipd-doctor-visits/[id]** — Update visit note
- Auth: `requireRole(req, 'doctor')` (only own visits)
- Body: same as create
- Return: updated visit

**4. POST /api/investigation-reports** — Doctor orders investigation
- Auth: `requireRole(req, 'doctor')`
- Body: `{ admissionId, sampleCollectionId?, testName, resultData (JSON), normalRange (JSON), isAbnormal, remarks }`
- Logic: Create InvestigationReport
- Return: created report

**5. GET /api/investigation-reports** — List investigations for admission
- Auth: `getAuthUser(req)`
- Query: `?admissionId=xxx`
- Return: array

**6. POST /api/ipd-sample-collections** — Doctor orders sample collection
- Auth: `requireRole(req, 'doctor')`
- Body: `{ admissionId, testName, sampleType, remarks }`
- Logic: Create SampleCollection with status="Ordered"
- Return: created

**7. PUT /api/ipd-sample-collections/[id]/collect** — Nurse collects sample
- Auth: `requireRole(req, 'nurse')`
- Body: `{ notes }`
- Logic: Set status="Collected", collectedAt=now(), nurseId
- Return: updated

**8. PUT /api/ipd-sample-collections/[id]/send-to-lab** — Nurse sends to lab
- Auth: `requireRole(req, 'nurse')`
- Logic: Set status="SentToLab", sentToLabAt=now()
- Return: updated

**9. GET /api/ipd-sample-collections** — List samples for admission
- Auth: `getAuthUser(req)`
- Query: `?admissionId=xxx&status=Ordered`
- Return: array

**10. POST /api/shift-handovers** — Nurse creates shift handover
- Auth: `requireRole(req, 'nurse')`
- Body: `{ wardId, shiftDate, shiftType, toNurseId, patientSummaries (JSON), wardNotes, pendingTasks (JSON) }`
- Logic: Create ShiftHandover with fromNurseId=logged in nurse
- Return: created

**11. GET /api/shift-handovers** — List handovers for ward
- Auth: `getAuthUser(req)`
- Query: `?wardId=xxx&shiftDate=2026-06-15`
- Return: array with fromNurseName, toNurseName, patientSummaries, acknowledged status

**12. PUT /api/shift-handovers/[id]/acknowledge** — Receiving nurse acknowledges
- Auth: `requireRole(req, 'nurse')`
- Logic: Set acknowledgedAt=now(), acknowledgedBy=userId
- Return: updated

#### Dashboard Pages

**Doctor → IPD Patient Detail → Visits Tab** (`/dashboard/doctor/ipd/[id]`)
- Add tab: "Visit Notes" — list of DoctorVisit records, Add New Visit form
- Add tab: "Investigations" — list of InvestigationReport records, Order New Investigation form
- Add tab: "Sample Collection" — list of SampleCollection records with status badges

**Nurse → My Patient Detail** (`/dashboard/nurse/patients/[id]`)
- Add: Sample Collection section — ordered by doctor, collect/send actions
- Add: Investigation Results section — view results reported
- Add: Doctor Visit Notes section — read-only view of doctor's visit notes

**Nurse → Ward View Enhancement** (`/dashboard/nurse/ward-patients`)
- Add filter: Show patients with pending samples
- Add filter: Show patients with abnormal investigations

### Phase 5B: OPERATION THEATER

#### New Models (add to schema.prisma)

**OperationTheater:**
```
model OperationTheater {
  id            String   @id @default(cuid())
  hospitalId    String
  name          String              // "OT-1", "OT-2 (Major)", "Minor OT"
  otType        String   @default("Major")   // Major, Minor, Emergency, Cardiac, Ortho
  floorNo       String   @default("")
  status        String   @default("Available") // Available, Occupied, Maintenance
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  hospital      Hospital      @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  schedules     OtSchedule[]
}
```

**OtSchedule:**
```
model OtSchedule {
  id                String    @id @default(cuid())
  scheduleNo        String    @default("")  // "OT-2026-000001"
  otId              String
  hospitalId        String
  admissionId       String
  patientName       String    @default("")
  patientAge        Int       @default(0)
  patientGender     String    @default("")
  surgeonId         String              // Doctor.id
  assistantSurgeons String    @default("[]")   // JSON: array of Doctor.id
  anesthetistId     String?             // Doctor.id
  otTechnician      String    @default("")
  nurseId           String?             // StaffNurse.id

  surgeryName       String    @default("")
  surgeryCategory   String    @default("")   // General, Orthopedic, Cardiac, Gynecology, ENT, Urology
  surgeryType       String    @default("Elective") // Elective, Emergency, Scheduled

  scheduledDate     DateTime
  scheduledStartTime String    @default("")     // "09:00"
  estimatedDuration Int       @default(60)      // minutes
  actualStartTime   String    @default("")
  actualEndTime     String    @default("")

  status            String    @default("Scheduled") // Scheduled, InProgress, Completed, Cancelled, Postponed
  notes             String    @default("")
  cancellationReason String   @default("")

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  ot                OperationTheater @relation(fields: [otId], references: [id], onDelete: Cascade)
  hospital          Hospital        @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  admission         IpdAdmission    @relation(fields: [admissionId], references: [id])
  surgeon           Doctor          @relation(fields: [surgeonId], references: [id])
}
```

#### API Routes

**1. POST /api/operation-theaters** — Create OT
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Body: `{ name, otType, floorNo }`
- Return: created OT

**2. GET /api/operation-theaters** — List OTs
- Auth: `getAuthUser(req)`
- Return: array with current status, today's schedule count

**3. POST /api/ot-schedules** — Schedule surgery
- Auth: `requireRole(req, 'doctor')` or `requireRole(req, 'hospital')`
- Body: `{ otId, admissionId, surgeryName, surgeryCategory, surgeryType, scheduledDate, scheduledStartTime, estimatedDuration, assistantSurgeons, anesthetistId, nurseId, otTechnician, notes }`
- Logic:
  1. Validate OT is available for that time slot (no overlapping schedules)
  2. Auto-generate scheduleNo: `OT-{YEAR}-{000001}`
  3. Auto-fill patientName/age/gender from admission
  4. Create OtSchedule
  5. Set OT status to "Occupied" during scheduled time
- Return: created schedule

**4. GET /api/ot-schedules** — List schedules
- Auth: `getAuthUser(req)`
- Query: `?otId=&date=2026-06-15&status=Scheduled&surgeonId=`
- Return: array with OT name, patient, surgeon, surgery, time, status

**5. PUT /api/ot-schedules/[id]** — Update schedule
- Auth: `requireRole(req, 'doctor')` or `requireRole(req, 'hospital')`
- Body: `{ status, actualStartTime, actualEndTime, notes, cancellationReason }`
- Logic:
  - If status="Completed": set actualEndTime, free the OT
  - If status="Cancelled"/"Postponed": free the OT
  - If status="InProgress": set actualStartTime, mark OT as Occupied
- Return: updated

**6. GET /api/ot-schedules/today** — Today's OT board
- Auth: `getAuthUser(req)`
- Return: all OTs with today's schedules, grouped by OT, with current status

#### Dashboard Pages

**Hospital → Operation Theaters** (add sidebar entry)
```
{ label: 'Operation Theater', href: '/dashboard/hospital/ot', icon: Cross },
```
Add `Cross` to lucide-react imports.

**Hospital → OT Management** (`/dashboard/hospital/ot`)
- `client.tsx`:
  - OT Board View: Grid layout showing each OT as a card
  - Each OT card: OT Name, Type, Current Status (Available/Occupied/Maintenance), Today's Surgeries list
  - Schedule Surgery button: Dialog with form (select OT, admission, surgery details, date/time, team)
  - Schedule List: Table of all schedules with filters

**Doctor → OT Surgeries** (`/dashboard/doctor/ot-surgeries`)
- Sidebar add: `{ label: 'OT Surgeries', href: '/dashboard/doctor/ot-surgeries', icon: Cross }`
- List of surgeries where this doctor is surgeon or assistant
- Can update status (start surgery, complete surgery)

### Phase 5C: BED TRANSFER

#### New Model

**BedTransfer:**
```
model BedTransfer {
  id              String   @id @default(cuid())
  admissionId     String
  fromBedId       String
  toBedId         String
  fromWardId      String
  toWardId        String
  transferDate    DateTime  @default(now())
  transferReason  String   @default("")   // "Clinical upgrade", "Doctor advice", "Patient request", "Bed unavailability"
  transferredBy   String              // User.id
  createdAt       DateTime  @default(now())

  admission       IpdAdmission @relation(fields: [admissionId], references: [id], onDelete: Cascade)
  fromBed         Bed          @relation("BedTransfersFrom", fields: [fromBedId], references: [id])
  toBed           Bed          @relation("BedTransfersTo", fields: [toBedId], references: [id])
}
```

#### Modify Bed Model — Add relations
```
  bedTransfersFrom    BedTransfer[] @relation("BedTransfersFrom")
  bedTransfersTo      BedTransfer[] @relation("BedTransfersTo")
```

#### API Routes

**1. POST /api/bed-transfers** — Transfer patient to new bed
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'receptionist')`
- Body: `{ admissionId, toBedId, transferReason }`
- Logic:
  1. Fetch current admission (get fromBedId, fromWardId)
  2. Validate toBed is Available
  3. In transaction:
     a. Free old bed: `db.bed.update({where:{id:fromBedId}, data:{status:'Available', admissionId:null}})`  — NOTE: admissionId must be optional on Bed (make it `String?` and remove `@@unique([bedId])` on IpdAdmission, instead use a nullable field)
     b. Actually, keep it simple: just track transfers, don't change IpdAdmission.bedId (the current bed). Update IpdAdmission.bedId = toBedId
     c. Mark toBed as Occupied, link admission
     d. Create BedTransfer record
  4. Update IpdAdmission.wardId = toWardId
  5. Create NursePatientAssignment for new bed
- Return: transfer record with new bed info

**2. GET /api/bed-transfers** — List transfers for admission
- Auth: `getAuthUser(req)`
- Query: `?admissionId=xxx`
- Return: array with fromBed/ward info, toBed/ward info, date, reason, by

**3. GET /api/bed-transfers/history** — All transfers today
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?date=2026-06-15`
- Return: array

#### Dashboard Pages

**Hospital → Bed Transfer** (add to hospital sidebar under IPD or as standalone)
```
{ label: 'Bed Transfer', href: '/dashboard/hospital/bed-transfer', icon: ArrowRightLeft },
```

**Hospital → Bed Transfer** (`/dashboard/hospital/bed-transfer`)
- Form: Select admission (from admitted patients), Select new bed (show available beds filtered by ward), Transfer Reason (Select + Textarea)
- Transfer History table: Date, Patient, From (Ward-Bed), To (Ward-Bed), Reason, By

**Receptionist → Bed Transfer** (same page accessible from receptionist sidebar)

### Phase 5D: DIET ORDER

#### New Model

**DietOrder:**
```
model DietOrder {
  id              String   @id @default(cuid())
  admissionId     String
  hospitalId      String
  orderedById     String              // Doctor.id who ordered
  dietType        String   @default("")   // "Normal", "Soft", "Liquid", "NPO", "Diabetic", "Low Salt", "Renal", "Post-Operative"
  mealType        String   @default("")   // "Breakfast", "Lunch", "Dinner", "Snacks"
  instructions    String   @default("")   // "Avoid milk", "High protein", "No salt"
  startDate       DateTime  @default(now())
  endDate         DateTime?
  status          String   @default("Active") // Active, Stopped, Completed
  stoppedBy       String?
  stoppedAt       DateTime?
  stoppedReason   String   @default("")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  admission       IpdAdmission @relation(fields: [admissionId], references: [id], onDelete: Cascade)
  hospital        Hospital      @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
}
```

#### API Routes

**1. POST /api/diet-orders** — Doctor orders diet
- Auth: `requireRole(req, 'doctor')`
- Body: `{ admissionId, dietType, mealType, instructions, startDate, endDate }`
- Return: created diet order

**2. GET /api/diet-orders** — List diet orders for admission
- Auth: `getAuthUser(req)`
- Query: `?admissionId=xxx&status=Active`
- Return: array

**3. PUT /api/diet-orders/[id]/stop** — Stop diet order
- Auth: `requireRole(req, 'doctor')` or `requireRole(req, 'nurse')`
- Body: `{ reason }`
- Logic: Set status="Stopped", stoppedAt=now(), stoppedBy=userId
- Return: updated

#### Dashboard Pages

**Doctor → IPD Patient Detail → Diet Tab**
- Active diet orders list
- Order New Diet form: dietType (Select), mealType (multi-Select or checkbox for each), instructions, date range
- Stop button on active orders

**Nurse → My Patient → Diet Section**
- View current active diet orders
- View diet instructions
- Mark meals as served (optional, can add servedAt field later)

---

## PHASE 4 + 5 COMPLETE CHECKLIST

- [ ] All 4 new Prisma models (OperationTheater, OtSchedule, BedTransfer, DietOrder)
- [ ] IpdAdmission modified (dischargeAdvised, followUpDate, followUpNotes, otSchedules, dietOrders, bedTransfers)
- [ ] Bed model modified (bedTransfersFrom, bedTransfersTo)
- [ ] Hospital model modified (operationTheaters)
- [ ] Doctor model modified (otSurgeries)
- [ ] `bun run db:push` successful
- [ ] Revenue Dashboard (6 APIs + 2 pages)
- [ ] IPD Analytics (4 APIs + 1 page)
- [ ] OPD + Financial Reports (4 APIs + 2 pages)
- [ ] Inventory + Lab Reports (4 APIs + 2 pages)
- [ ] IPD Doctor Visits (3 APIs + UI tab)
- [ ] Investigation Reports (2 APIs + UI tab)
- [ ] Sample Collections (4 APIs + UI tabs)
- [ ] Shift Handovers (3 APIs + UI)
- [ ] Operation Theater CRUD (2 APIs + 1 page)
- [ ] OT Schedules (4 APIs + 2 pages)
- [ ] Bed Transfer (3 APIs + 2 pages)
- [ ] Diet Orders (3 APIs + 2 UI sections)
- [ ] Sidebar entries: hospital (Reports, OT, Bed Transfer, Lab), doctor (OT Surgeries, Lab Results)
- [ ] No TypeScript errors
- [ ] `bun run lint` passes
