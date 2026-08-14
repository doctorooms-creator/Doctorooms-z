# 🏗️ LOGIN REDESIGN + MODULE-WISE REAL-LIFE FLOW DOCUMENT

> **Role**: Architecture Plan — NO DEVELOPMENT
> **Purpose**: Login page 2-panel design + Every module's real-life test flow
> **Status**: Awaiting Approval

---

## PART 1: LOGIN PAGE REDESIGN

### Current State
- Single page with 7 role cards in a responsive grid
- All roles mixed together — no visual distinction between clinic vs hospital
- Missing 2 roles: Nurse, Lab Technician

### New Design: LEFT = CLINIC | RIGHT = HOSPITAL

```
┌─────────────────────────────────────────────────────────────────────────┐
│
│              🩺 Doctorooms                              🔒 Admin Login  │
│        Smart Hospital & Clinic Management System

│
├────────────────────────────────┬────────────────────────────────────────┤
│                                │                                        │
│   🏥 CLINIC ACCESS              │   🏢 HOSPITAL ACCESS                  │
│   "Doctor ke Clinic ke liye"    │   "Hospital Owner/Admin ke liye"      │
│                                │                                        │
│   ┌──────────────────────┐     │   ┌──────────────────────┐           │
│   │ 👨‍⚕️ Doctor            │     │   │ 🏢 Hospital           │           │
│   │ Consultations, Rx,    │     │   │ Revenue, Doctors,      │           │
│   │ Earnings              │     │   │ Inventory, Reports     │           │
│   └──────────────────────┘     │   └──────────────────────┘           │
│                                │                                        │
│   ┌──────────┐ ┌──────────┐   │   ┌──────────────────────┐           │
│   │ 🎧Recep-  │ │ 👤Assist- │   │   │ 🛡️ Admin             │           │
│   │ tionist  │ │ ant      │   │   │ Users, Settings,      │           │
│   │ Walk-ins,│ │ Queue,   │   │   │ Platform Analytics    │           │
│   │ Queue   │ │ Follow-up│   │   └──────────────────────┘           │
│   └──────────┘ └──────────┘   │                                        │
│                                │   ┌──────────────────────┐           │
│   ┌──────────┐ ┌──────────┐   │   │ ❤️ Patient            │           │
│   │ 💊Pharma-│ │ 🔬Lab     │   │   │ Book Appt, View Rx,   │           │
│   │ cist    │ │ Tech     │   │   │ Reports, Bills        │           │
│   │ Dispense│ │ Reports  │   │   └──────────────────────┘           │
│   └──────────┘ └──────────┘   │                                        │
│                                │                                        │
│   ┌──────────────────────┐     │                                        │
│   │ 👩‍⚕️ Nurse              │     │                                        │
│   │ Vitals, Medicines,    │     │                                        │
│   │ Diet, Sample          │     │                                        │
│   └──────────────────────┘     │                                        │
│                                │                                        │
├────────────────────────────────┴────────────────────────────────────────┤
│  ⚙️ Dev Mode — Click any role to explore        v2.0 | 9 Roles        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Design Specifications

| Aspect | LEFT PANEL (Clinic) | RIGHT PANEL (Hospital) |
|--------|---------------------|------------------------|
| **Header** | 🏥 CLINIC ACCESS | 🏢 HOSPITAL ACCESS |
| **Subtitle** | "Doctor ke Clinic ke liye" | "Hospital Owner/Admin ke liye" |
| **Background** | Teal gradient (from-teal-50 to-emerald-50) | Amber gradient (from-amber-50 to-orange-50) |
| **Roles** | Doctor (hero/large card), Receptionist, Assistant, Pharmacist, Lab Tech, Nurse | Hospital (hero/large card), Admin, Patient |
| **Layout** | Doctor = full-width hero card, rest = 2x2 grid below | Hospital = full-width hero card, Admin + Patient = 2 stacked below |
| **Border** | Left side has teal accent border | Right side has amber accent border |

### Role Card Details

#### LEFT — CLINIC ROLES (6 roles)

| Role | Icon | Description | Color | Key Modules |
|------|------|-------------|-------|-------------|
| **Doctor** | Stethoscope | "Manage consultations, prescriptions, patient records & earnings" | Teal gradient | OPD Queue, Prescription, Lab Orders, Earnings |
| **Receptionist** | Headphones | "Handle walk-ins, manage bookings, patient queue & billing" | Pink gradient | Bookings, Queue, IPD Admit, Bills, Discharge |
| **Assistant** | UserCheck | "Help doctor manage queue, follow-ups & coordination" | Violet gradient | Appointments, Patients, Rx Queue |
| **Pharmacist** | Pill | "Manage medicines, view prescriptions & dispensing" | Orange gradient | Inventory, Prescriptions |
| **Lab Technician** | FlaskConical | "Process samples, enter results & verify reports" | Cyan gradient | Lab Reports, Results, Verification |
| **Nurse** | Activity | "Record vitals, administer medicines & manage patient care" | Rose gradient | Vitals, Medicines, Diet, Samples |

#### RIGHT — HOSPITAL ROLES (3 roles)

| Role | Icon | Description | Color | Key Modules |
|------|------|-------------|-------|-------------|
| **Hospital** | Building2 | "Manage doctors, revenue, inventory & hospital operations" | Amber gradient | Dashboard, Doctors, Billing, IPD, Reports, OT, Inventory |
| **Admin** | Shield | "Full platform control — users, settings & analytics" | Red gradient | Users, Appointments, Settings |
| **Patient** | Heart | "Book appointments, view prescriptions, reports & bills" | Emerald gradient | Appointments, Prescriptions, Lab Reports, Bills |

### Responsive Behavior
- **Desktop (lg+)**: Side-by-side 50/50 split
- **Tablet (md)**: Stacked — Clinic on top, Hospital below
- **Mobile**: Stacked with horizontal scroll tabs (Clinic | Hospital)

---

## PART 2: MODULE-WISE REAL-LIFE TEST FLOWS

> Har module ka real-life flow — kaha se entry hoti hai, kya hota hai, kaha kaha data jata hai.

---

### 📋 FLOW 1: APPOINTMENT BOOKING (3 Entry Points)

#### Scenario A: Patient Books Online (Patient → Doctor)
```
Patient Website
│
├─ 1. Patient opens homepage → Sees doctor cards
│     API: GET /api/doctors?limit=3
│
├─ 2. Patient clicks "Book Appointment" → Selects date/time slot
│     API: GET /api/doctors/[id]/slots?date=2025-01-15
│
├─ 3. Patient fills form (name, phone, disease, relation)
│     API: POST /api/patient/bookings
│     DB: Booking created (status: "Pending")
│     EMIT: — (no emit yet, could add)
│
├─ 4. Patient sees confirmation in dashboard
│     Page: /dashboard/patient/appointments
│     API: GET /api/dashboard/patient/appointments
│
├─ 5. Receptionist sees new booking in dashboard
│     Page: /dashboard/receptionist/appointments
│     API: GET /api/bookings?status=Pending
│
└─ 6. Receptionist confirms → Status changes to "Confirmed"
      API: PUT /api/bookings/[id] → { status: "Confirmed" }
      Patient gets notified (future: WhatsApp/SMS)
```

#### Scenario B: Walk-in Patient (Receptionist)
```
Receptionist Dashboard
│
├─ 1. Patient walks in → Receptionist clicks "New Booking"
│     Page: /dashboard/receptionist/appointments/new
│
├─ 2. Receptionist selects doctor → Date → Time slot
│     API: GET /api/doctors (dropdown)
│     API: GET /api/doctors/[id]/slots?date=...
│
├─ 3. Fills patient details (name, age, gender, phone, disease)
│     API: POST /api/bookings
│     DB: Booking created + User created (if new patient)
│     EMIT: —
│
├─ 4. Token number generated (e.g., "CARD-015")
│     DB: Booking.tokenNumber = "CARD-015"
│
├─ 5. Patient goes to waiting hall
│     Page: /dashboard/receptionist/queue-display (shows on TV)
│     API: GET /api/bookings?status=Confirmed&date=today
│
└─ 6. Doctor sees patient in OPD Queue
      Page: /dashboard/doctor/queue
      API: GET /api/dashboard/doctor/queue?date=today
```

#### Scenario C: Assistant Books for Doctor
```
Assistant Dashboard
│
├─ 1. Doctor says "2PM ko XYZ patient aayega"
│     Page: /dashboard/assistant/appointments
│
├─ 2. Assistant clicks "New Appointment"
│     API: GET /api/doctors (filtered to their doctor)
│
├─ 3. Fills details → Books appointment
│     API: POST /api/bookings
│     DB: Booking created
│
└─ 4. Shows in Prescription Queue
      Page: /dashboard/assistant/prescription-queue
```

---

### 🩺 FLOW 2: DOCTOR CONSULTATION & PRESCRIPTION

#### Complete OPD Consultation Flow
```
Doctor Dashboard
│
├─ 1. Doctor opens OPD Queue
│     Page: /dashboard/doctor/queue
│     API: GET /api/dashboard/doctor/queue?date=today
│     Shows: Token, Patient Name, Disease, Waiting Time
│
├─ 2. Doctor clicks "Start Consultation" on a patient
│     Page: /dashboard/doctor/prescription/new?bookingId=xxx
│
├─ 3. 6-STEP PRESCRIPTION STEPPER:
│     │
│     ├─ STEP 1: Chief Complaints
│     │   - Patient tells problem (Hindi + English)
│     │   - Doctor types: "Sir head dard hai 3 din se, nausea bhi"
│     │   - History: Past illness, drug history, allergies
│     │   API: (all saved together at step 6)
│     │
│     ├─ STEP 2: Vitals (from Nurse or entered now)
│     │   - BP, Pulse, Temperature, SpO2, Weight, Height
│     │   - If IPD patient → auto-fetched from last vitals
│     │   API: GET /api/vital-records/[admissionId]?latest=true
│     │
│     ├─ STEP 3: Examination Tables
│     │   - General, Systemic, Local examination
│     │   - Customizable table rows
│     │
│     ├─ STEP 4: Medicines (RX)
│     │   - Search medicine from master
│     │   - Select: Dose, Frequency (OD/BD/TDS), Duration, Instructions
│     │   - Example: Tab. Paracetamol 500mg BD x 3 days after food
│     │   API: GET /api/medicine-masters?search=paracetamol
│     │
│     ├─ STEP 5: Suggestions / Investigations
│     │   - Lab tests: CBC, LFT, KFT, X-Ray Chest
│     │   - Advice: Rest, cold sponging, follow-up after 3 days
│     │   API: GET /api/lab-test-masters?search=cbc
│     │
│     └─ STEP 6: Finalize
│         - Review everything → Click "Save Prescription"
│         API: POST /api/prescriptions
│         DB: Prescription + PrescriptionMedicine + LabReport (ordered) created
│         EMIT: —
│
├─ 4. Patient gets prescription
│     Page: /dashboard/patient/prescriptions
│     API: GET /api/dashboard/patient/prescriptions
│     Can download/print
│
├─ 5. If lab tests ordered → Goes to Lab module
│     (See Flow 3 below)
│
└─ 6. Booking status → "Consulted"
      API: PUT /api/bookings/[id] → { status: "Consulted" }
```

#### Real-Life Example:
```
Patient: "Doctor sahab, 3 din se bukhar hai, body pain bhi"
Doctor: (Step 1) Chief Complaint: Fever x 3 days, body aches
        (Step 2) Vitals: Temp 101°F, BP 120/80, Pulse 90
        (Step 4) Rx:
          - Tab. Dolo 650mg BD x 3 days (after food)
          - Tab. Azithromycin 500mg OD x 3 days (empty stomach)
          - Syp. Crocin SOS if fever > 100°F
        (Step 5) Tests: CBC, Widal, Dengue NS1
        (Step 5) Advice: Rest, plenty of fluids, review after 3 days
```

---

### 🔬 FLOW 3: LAB TEST ORDERING → RESULTS

#### Complete Lab Flow
```
Doctor Orders Tests (from Prescription Step 5)
│
├─ 1. Lab reports auto-created when prescription saved
│     DB: LabReport created (status: "Ordered")
│     EMIT: 'sample-ordered' → Nurse, Lab Tech
│
├─ 2. NURSE collects sample
│     Page: /dashboard/nurse/sample-collection
│     API: PUT /api/lab-reports/[id]/collect-sample
│     DB: LabReport.status → "Collected"
│     EMIT: 'sample-ordered' → Lab Tech
│
├─ 3. LAB TECHNICIAN processes sample
│     Page: /dashboard/lab-technician/reports
│     API: GET /api/lab-reports?status=Collected
│
├─ 4. Lab Tech enters results
│     Page: /dashboard/lab-technician/reports/[id]/enter-result
│     API: PUT /api/lab-reports/[id]/enter-result
│     Body: { parameters: [{ name: "WBC", value: "12000", unit: "cells/cu.mm", refRange: "4000-11000" }] }
│     DB: LabReportParameter records created, LabReport.status → "Result Entered"
│     EMIT: 'lab-result-ready' → Doctor
│
├─ 5. DOCTOR verifies results
│     Page: /dashboard/doctor/lab-reports
│     API: GET /api/lab-reports?patientId=xxx
│     Doctor reviews → Clicks "Verify"
│     API: PUT /api/lab-reports/[id]/verify
│     DB: LabReport.status → "Verified"
│     EMIT: 'lab-result-ready' → Patient
│
├─ 6. PATIENT views report
│     Page: /dashboard/patient/lab-reports
│     API: GET /api/dashboard/patient/lab-reports
│     Can download/print
│
└─ 7. HOSPITAL views all lab reports
      Page: /dashboard/hospital/lab-reports
      API: GET /api/lab-reports (with filters)
```

#### Real-Life Example:
```
Doctor: "CBC aur Dengue NS1 lagao"
→ Prescription saved → LabReport #1 (CBC) created, LabReport #2 (Dengue) created
→ Nurse: Collects 2 blood samples, marks both as "Collected"
→ Lab Tech: Processes CBC → Enters: Hb 12.5, WBC 12000↑, Platelet 1.8L↓
→ Lab Tech: Processes Dengue → Enters: NS1 Positive
→ Doctor: Verifies both reports
→ Patient: Sees reports in app, "Doctor sahab dengue hai kya?"
```

---

### 🏥 FLOW 4: IPD ADMISSION → DISCHARGE

#### Complete IPD Lifecycle
```
Receptionist/Hospital Admits Patient
│
├─ 1. DECISION: Doctor advises admission
│     "Patient ko admit karna padega, Ward A mein bed dein"
│
├─ 2. RECEPTIONIST initiates admission
│     Page: /dashboard/receptionist/ipd/admit
│     API: POST /api/dashboard/receptionist/ipd/admit
│     Body: { patientId, hospitalId, wardId, bedId, departmentId, doctorId, ...
│            patientName, age, gender, bloodGroup, address, ... }
│     DB: IpdAdmission created (status: "Admitted")
│     DB: Bed.status → "Occupied"
│     EMIT: 'new-admission' → Nurse, Receptionist, Hospital
│
├─ 3. BED ASSIGNED → Patient shifts to room
│     Page: /dashboard/hospital/beds (bed map shows occupied)
│
├─ 4. MULTI-DISCIPLINARY CARE BEGINS:
│     │
│     ├─ NURSE records vitals (every 4 hours for ICU, 8 hours for general)
│     │   Page: /dashboard/nurse/vitals/[admissionId]
│     │   API: POST /api/dashboard/nurse/patients/[admissionId]/vitals
│     │   EMIT: 'vital-recorded' → Doctor
│     │
│     ├─ DOCTOR visits, writes prescriptions
│     │   Page: /dashboard/doctor/ipd-patients
│     │   API: POST /api/prescriptions (with admissionId)
│     │
│     ├─ NURSE administers medicines (from prescription)
│     │   Page: /dashboard/nurse/medicines/[admissionId]
│     │   API: POST /api/ipd-medicine-administrations
│     │   DB: IpMedicineAdministration created
│     │
│     ├─ LAB TESTS ordered and processed (Flow 3)
│     │
│     ├─ DIET ORDERS placed
│     │   Page: /dashboard/nurse/diet/[admissionId]
│     │   API: POST /api/diet-orders
│     │   DB: DietOrder created
│     │
│     ├─ OT SURGERY if needed (Flow 6)
│     │
│     └─ BED TRANSFER if needed (Flow 7)
│
├─ 5. DOCTOR ADVISES DISCHARGE
│     Page: /dashboard/doctor/ipd-patients
│     API: POST /api/ipd-admissions/[id]/discharge
│     Body: { dischargeType: "Normal", dischargeTime: "2025-01-18 11:00" }
│     DB: IpdAdmission.dischargeAdvised = true, dischargeType = "Normal"
│     EMIT: 'discharge-advised' → Receptionist
│
├─ 6. RECEPTIONIST processes discharge
│     Page: /dashboard/receptionist/billing/discharge
│     (or /dashboard/hospital/billing/discharge)
│     a. Generates final bill
│        API: POST /api/ipd-bills/generate
│        DB: IpdBill + BillLineItem created
│     b. Records payments
│        API: POST /api/bill-payments
│        DB: BillPayment created
│     c. Completes discharge
│        API: POST /api/ipd-admissions/[id]/complete-discharge
│        DB: IpdAdmission.status → "Discharged", Bed.status → "Available"
│        EMIT: 'discharge-advised' → Hospital
│
├─ 7. BILL PRINTED
│     Page: /dashboard/hospital/billing/ipd/[billId]
│     Print Component: IpdBillPrint
│
└─ 8. PATIENT goes home with discharge summary + bill
```

#### Real-Life Example:
```
Patient: "Doctor sahab, bukhar bahut high hai, 3 din se nahi utar raha"
Doctor: "Admit karna padega. Ward A, Bed 104 pe rakho. CBC, LFT, KFT, Blood Culture lagao,
         IV fluids start karo, Tab. Augmentin 1.2g IV TDS"
→ Receptionist: Admits patient to Ward A, Bed 104
→ Nurse: Records vitals Q4H, starts IV fluids, gives Augmentin IV
→ Lab: Collects samples, processes, reports ready in 4 hours
→ 3 days later...
Doctor: "Patient better hai, discharge karo. Normal discharge."
→ Receptionist: Generates bill (Room: 3 days × ₹2000 = ₹6000, Medicines: ₹3500,
           Tests: ₹2800, Doctor fees: ₹3000 → Total: ₹15,300)
→ Patient pays ₹15,300 → Discharge complete → Bed 104 available again
```

---

### 💰 FLOW 5: BILLING & PAYMENTS

#### OPD Billing Flow
```
After Doctor Consultation (OPD)
│
├─ 1. Receptionist/Hospital generates OPD bill
│     Page: /dashboard/receptionist/billing/opd/new
│     (or /dashboard/hospital/billing/opd)
│     API: POST /api/opd-bills
│     Body: { bookingId, consultationFee: 500, ... }
│     DB: OpdBill created (receiptNo auto-generated)
│     EMIT: 'bill-generated' → Receptionist, Hospital
│
├─ 2. Patient pays
│     API: POST /api/bill-payments
│     Body: { billId, amount: 500, paymentMethod: "Cash" }
│     DB: BillPayment created
│     EMIT: 'payment-received' → Receptionist, Hospital
│
├─ 3. Receipt printed
│     Print Component: OpdBillPrint
│
└─ 4. Bill shows in hospital billing list
      Page: /dashboard/hospital/billing/opd
```

#### IPD Billing Flow
```
During/After IPD Stay
│
├─ 1. Patient advance deposited (at admission time)
│     API: POST /api/patient-advances
│     Body: { admissionId, amount: 10000, paymentMethod: "UPI" }
│     DB: PatientAdvance created
│     EMIT: 'payment-received'
│
├─ 2. Bill generated (at discharge or during stay)
│     API: POST /api/ipd-bills/generate
│     Body: { admissionId }
│     DB: IpdBill + BillLineItem[] auto-generated from:
│       - Room rent (calculated from admission date)
│       - Medicines administered
│       - Lab tests done
│       - OT charges (if surgery)
│       - Doctor consultation fees
│
├─ 3. Additional payments during stay
│     API: POST /api/bill-payments
│
├─ 4. Final bill finalized
│     API: PUT /api/ipd-bills/[id]/finalize
│     DB: IpdBill.status → "Finalized"
│     EMIT: 'bill-generated'
│
└─ 5. Settlement
      Total Bill: ₹25,000
      - Advance: ₹10,000
      - Payments: ₹12,000
      - Balance: ₹3,000 (pay at discharge)
```

---

### 💊 FLOW 6: PHARMACY & INVENTORY

#### Medicine Dispensing Flow
```
Doctor Prescribes (from Prescription Step 4)
│
├─ 1. Prescription saved with medicines
│     DB: PrescriptionMedicine records created
│
├─ 2. PHARMACIST sees pending prescriptions
│     Page: /dashboard/pharmacist/prescriptions
│     API: GET /api/prescriptions?status=Active
│
├─ 3. Pharmacist checks stock
│     Page: /dashboard/pharmacist/inventory
│     API: GET /api/inventory-items?category=Medicine
│     Shows: Stock available, expiry dates, batch numbers
│
├─ 4. Dispenses medicines
│     If stock available → Hand over to patient/nurse
│     If stock low → Alert triggered
│     EMIT: 'low-stock-alert' → Hospital, Pharmacist
│
└─ 5. Stock tracking
      API: POST /api/stock-movements
      Body: { itemId, movementType: "Out", quantity: 10, reason: "Dispensed" }
      DB: StockMovement created, InventoryItem.stock reduced
```

#### Inventory Management Flow
```
Hospital/Pharmacist manages stock
│
├─ 1. Add new item
│     API: POST /api/inventory-items
│     Body: { name, category, unit, hsnCode, minStock: 50, ... }
│
├─ 2. Stock comes in (purchase)
│     API: POST /api/stock-movements
│     Body: { itemId, movementType: "In", quantity: 500, referenceNo: "PO-001" }
│
├─ 3. Create Purchase Order when stock low
│     Page: /dashboard/pharmacist/purchase-orders
│     API: POST /api/purchase-orders
│     Body: { supplierName, items: [{ itemId, quantity, unitPrice }] }
│
├─ 4. Receive PO → Stock comes in
│     API: PUT /api/purchase-orders/[id]
│     Body: { status: "Received" }
│
└─ 5. Reports: Stock value, expiry tracking, consumption trends
      Page: /dashboard/hospital/reports/inventory
```

---

### 🔪 FLOW 7: OT (OPERATION THEATER) SCHEDULING

#### Surgery Scheduling Flow
```
Doctor/Hospital schedules surgery
│
├─ 1. Doctor advises surgery
│     "Appendectomy karni hai, kal 10 baje OT-1 mein"
│
├─ 2. Hospital/Receptionist creates OT schedule
│     Page: /dashboard/hospital/ot-schedules
│     API: POST /api/ot-schedules
│     Body: {
│       admissionId, otId: "OT-1",
│       surgeonId, assistantSurgeonId, anesthetistId,
│       scheduledDate: "2025-01-16", scheduledStartTime: "10:00",
│       surgeryName: "Appendectomy", surgeryCategory: "General",
│       patientName, patientGender, estimatedDuration: 120
│     }
│     DB: OtSchedule created (status: "Scheduled")
│     EMIT: 'ot-scheduled' → Doctor, Nurse, Hospital
│
├─ 3. Kanban board shows surgery status
│     Columns: Scheduled → In Progress → Completed → Cancelled
│     Page: /dashboard/hospital/ot-schedules (kanban view)
│
├─ 4. Surgery day:
│     a. Mark "In Progress" when patient enters OT
│     b. Mark "Completed" after surgery
│     c. Record actual start/end time
│     API: PUT /api/ot-schedules/[id]
│
└─ 5. Post-surgery: IPD care continues (vitals, medicines, diet)
```

---

### 🛏️ FLOW 8: BED TRANSFER

```
Doctor advises bed change (e.g., ICU → General Ward)
│
├─ 1. Nurse/Receptionist initiates transfer
│     Page: /dashboard/receptionist/bed-transfer
│     API: POST /api/bed-transfers
│     Body: { admissionId, fromBedId, toBedId, transferReason: "Shifted from ICU" }
│     DB: BedTransfer created
│     DB: fromBed.status → "Available"
│     DB: toBed.status → "Occupied"
│     DB: IpdAdmission.bedId → toBedId
│     EMIT: 'new-admission' → Nurse (updated room info)
│
└─ 2. Bed map updates automatically
      Page: /dashboard/hospital/beds
```

---

### 🩸 FLOW 9: NURSE WORKFLOW (Shift-wise)

```
Nurse starts shift
│
├─ 1. Views assigned patients
│     Page: /dashboard/nurse
│     API: GET /api/nurse-patient-assignments?nurseId=xxx
│     Shows: Bed, Patient, Ward, Doctor, Assigned Time
│
├─ 2. Records vitals (rounds)
│     Page: /dashboard/nurse/vitals/[admissionId]
│     For each patient: BP, Temp, Pulse, SpO2, RR, Pain Scale
│     API: POST /api/dashboard/nurse/patients/[admissionId]/vitals
│     EMIT: 'vital-recorded' → Doctor
│
├─ 3. Administers medicines (from prescription)
│     Page: /dashboard/nurse/medicines/[admissionId]
│     Shows: Due medicines with time, dose, route
│     API: POST /api/ipd-medicine-administrations
│     Marks: Given, Not Given (with reason), Stopped
│
├─ 4. Collects lab samples
│     Page: /dashboard/nurse/sample-collection
│     API: PUT /api/lab-reports/[id]/collect-sample
│     EMIT: 'sample-ordered' → Lab Tech
│
├─ 5. Places diet orders
│     Page: /dashboard/nurse/diet/[admissionId]
│     API: POST /api/diet-orders
│     Body: { admissionId, dietType: "Normal", mealType: "Lunch", instructions: "Low salt" }
│
├─ 6. Shift handover notes
│     Page: /dashboard/nurse/shift-handover
│     API: POST /api/ward-rounds (with notes)
│
└─ 7. Views doctor's instructions from ward rounds
      Page: /dashboard/nurse/ward-rounds/[admissionId]
```

---

### 🏢 FLOW 10: HOSPITAL OWNER DASHBOARD

```
Hospital Owner logs in
│
├─ 1. MAIN DASHBOARD
│     Page: /dashboard/hospital
│     Shows:
│     - Today's OPD count, IPD admissions, Revenue
│     - Bed occupancy (occupied/total)
│     - Revenue chart (7-day/30-day)
│     - Recent appointments
│     - Department-wise stats
│     API: GET /api/dashboard/hospital/stats
│
├─ 2. DOCTOR MANAGEMENT
│     Page: /dashboard/hospital/doctors
│     - Add/edit doctor profiles
│     - View schedules, holidays
│     - Doctor performance (patients seen, revenue generated)
│
├─ 3. REVENUE & BILLING
│     Page: /dashboard/hospital/billing/ipd
│     Page: /dashboard/hospital/billing/opd
│     Page: /dashboard/hospital/billing/payments
│     Page: /dashboard/hospital/billing/advances
│     - View all bills, payments, advances
│     - Filter by date, doctor, status
│
├─ 4. REPORTS
│     Page: /dashboard/hospital/reports/revenue
│     Page: /dashboard/hospital/reports/ipd
│     Page: /dashboard/hospital/reports/opd
│     Page: /dashboard/hospital/reports/inventory
│     Page: /dashboard/hospital/reports/doctor-performance
│     Page: /dashboard/hospital/reports/bed-occupancy
│     - Revenue trends, collection reports
│     - IPD/OPD statistics
│     - Doctor-wise performance
│     - Bed occupancy analytics
│
└─ 5. SETTINGS
      Page: /dashboard/hospital/settings
      - Hospital profile, departments, OT rooms, charge master
```

---

### 👤 FLOW 11: PATIENT END-TO-END JOURNEY

```
Patient's Complete Journey Through The System
│
├─ 1. LANDS ON WEBSITE (Homepage)
│     → Sees hero section, search doctors, featured hospitals
│     → Browses doctor profiles, specializations
│
├─ 2. REGISTERS / LOGS IN
│     → Signs up with name, email, phone
│     API: POST /api/auth/register
│
├─ 3. BOOKS APPOINTMENT
│     → Selects doctor → Date → Time slot
│     API: POST /api/patient/bookings
│     → Gets confirmation
│
├─ 4. VISITS HOSPITAL ON APPOINTMENT DAY
│     → Checks in at reception
│     → Waits in queue (sees token on display TV)
│
├─ 5. DOCTOR CONSULTATION
│     → Doctor examines, prescribes medicines
│     → Orders lab tests if needed
│
├─ 6. GIVES SAMPLES (if lab tests)
│     → Nurse collects blood/urine sample
│
├─ 7. GETS MEDICINES FROM PHARMACY
│     → Shows prescription → Gets medicines
│
├─ 8. PAYS BILL
│     → Receptionist generates OPD bill
│     → Pays cash/UPI/card
│
├─ 9. VIEWS PRESCRIPTION ONLINE
│     Page: /dashboard/patient/prescriptions
│     → Downloads/print if needed
│
├─ 10. VIEWS LAB REPORTS
│      Page: /dashboard/patient/lab-reports
│      → Doctor verified reports visible
│      → Downloads PDF if needed
│
├─ 11. FOLLOWS UP
│      → Books next appointment
│      → Gives feedback/rating
│      API: POST /api/patient/feedback
│
└─ 12. IF ADMITTED (IPD)
       → Family members get access code
       → Can view patient vitals, reports remotely
       Page: /dashboard/patient/ipd
```

---

## PART 3: COMPLETE MODULE × API × PAGE MAPPING

### LEFT — CLINIC MODULES

| Module | Role | Pages | Key APIs | Data Models |
|--------|------|-------|----------|-------------|
| **OPD Queue** | Doctor | /doctor/queue, /doctor/prescription/new | GET /dashboard/doctor/queue, POST /prescriptions | Booking, Prescription, PrescriptionMedicine |
| **Prescription** | Doctor | /doctor/prescriptions | GET /prescriptions, GET /medicine-masters | Prescription, PrescriptionMedicine, MedicineMaster |
| **Lab Results** | Doctor | /doctor/lab-reports | GET /lab-reports | LabReport, LabReportParameter |
| **IPD Patients** | Doctor | /doctor/ipd-patients | GET /ipd-admissions?doctorId=xxx | IpdAdmission, VitalRecord |
| **Earnings** | Doctor | /doctor/earnings | GET /dashboard/doctor/earnings | Booking, BillPayment |
| **Bookings** | Receptionist | /receptionist/appointments | GET /bookings, POST /bookings | Booking, User |
| **Queue Display** | Receptionist | /receptionist/queue-display | GET /bookings?status=Confirmed | Booking |
| **IPD Admit** | Receptionist | /receptionist/ipd/admit | POST /dashboard/receptionist/ipd/admit | IpdAdmission, Bed |
| **Billing** | Receptionist | /receptionist/billing/* | POST /ipd-bills, POST /opd-bills, POST /bill-payments | IpdBill, OpdBill, BillPayment |
| **Discharge** | Receptionist | /receptionist/billing/discharge | POST /ipd-admissions/[id]/discharge | IpdAdmission |
| **Bed Transfer** | Receptionist | /receptionist/bed-transfer | POST /bed-transfers | BedTransfer, Bed |
| **Appointments** | Assistant | /assistant/appointments | GET /bookings | Booking |
| **Patients** | Assistant | /assistant/patients | GET /patients | User, Booking |
| **Rx Queue** | Assistant | /assistant/prescription-queue | GET /prescriptions | Prescription |
| **Inventory** | Pharmacist | /pharmacist/inventory | GET /inventory-items | InventoryItem |
| **Medicines** | Pharmacist | /pharmacist/medicines | GET /prescriptions | Prescription, PrescriptionMedicine |
| **Purchase Orders** | Pharmacist | /pharmacist/purchase-orders | GET /purchase-orders | PurchaseOrder |
| **Lab Reports** | Lab Tech | /lab-technician/reports | GET /lab-reports | LabReport, LabReportParameter |
| **Enter Result** | Lab Tech | /lab-technician/reports/[id]/enter-result | PUT /lab-reports/[id]/enter-result | LabReportParameter |
| **Vitals** | Nurse | /nurse/vitals/[id] | POST /dashboard/nurse/patients/[id]/vitals | VitalRecord |
| **Medicines** | Nurse | /nurse/medicines/[id] | POST /ipd-medicine-administrations | IpMedicineAdministration |
| **Diet** | Nurse | /nurse/diet/[id] | POST /diet-orders | DietOrder |
| **Samples** | Nurse | /nurse/sample-collection | PUT /lab-reports/[id]/collect-sample | LabReport |

### RIGHT — HOSPITAL MODULES

| Module | Role | Pages | Key APIs | Data Models |
|--------|------|-------|----------|-------------|
| **Dashboard** | Hospital | /hospital | GET /dashboard/hospital/stats | User, Booking, IpdAdmission, IpdBill |
| **Doctors** | Hospital | /hospital/doctors | GET /doctors, PUT /doctors/[id] | User, Doctor, DoctorAvailability |
| **Appointments** | Hospital | /hospital/appointments | GET /bookings | Booking |
| **Departments** | Hospital | /hospital/departments | GET /departments, POST /departments | Department |
| **Wards & Beds** | Hospital | /hospital/beds | GET /wards, GET /beds | Ward, Bed |
| **OT** | Hospital | /hospital/ot | GET /operation-theaters, GET /ot-schedules | OperationTheater, OtSchedule |
| **IPD Admissions** | Hospital | /hospital/ipd | GET /ipd-admissions | IpdAdmission |
| **Billing** | Hospital | /hospital/billing/* | GET /ipd-bills, GET /opd-bills, GET /bill-payments | IpdBill, OpdBill, BillPayment |
| **Discharge** | Hospital | /hospital/billing/discharge | POST /ipd-admissions/[id]/discharge | IpdAdmission |
| **Lab Reports** | Hospital | /hospital/lab-reports | GET /lab-reports | LabReport |
| **Inventory** | Hospital | /hospital/inventory/* | GET /inventory-items, GET /stock-movements | InventoryItem, StockMovement |
| **Reports** | Hospital | /hospital/reports/* | GET /api/dashboard/hospital/reports/* | Various |
| **Settings** | Hospital | /hospital/settings | PUT /hospitals/[id] | Hospital |
| **Users** | Admin | /admin/users | GET /users, POST /users | User |
| **Appointments** | Admin | /admin/appointments | GET /bookings | Booking |
| **Billing** | Admin | /admin/billing/* | GET /ipd-bills, GET /opd-bills | IpdBill, OpdBill |
| **Doctors** | Admin | /admin/doctors | GET /doctors | User, Doctor |
| **Hospitals** | Admin | /admin/hospitals | GET /hospitals | Hospital |
| **Appointments** | Patient | /patient/appointments | GET /dashboard/patient/appointments | Booking |
| **Prescriptions** | Patient | /patient/prescriptions | GET /dashboard/patient/prescriptions | Prescription |
| **Lab Reports** | Patient | /patient/lab-reports | GET /dashboard/patient/lab-reports | LabReport |
| **Bills** | Patient | /patient/bills | GET /dashboard/patient/bills | OpdBill, IpdBill, BillPayment |
| **Feedback** | Patient | /patient/feedback | POST /api/patient/feedback | Feedback |

---

## PART 4: TESTING CHECKLIST (Module-wise)

### ✅ Clinic Testing (Left Side Login)

| # | Test Case | Login As | Steps | Expected Result |
|---|-----------|----------|-------|----------------|
| 1 | Walk-in Booking | Receptionist | New Booking → Select Doctor → Fill Patient → Save | Token generated, shows in Queue |
| 2 | Queue Display | Receptionist | Open Queue Display page | Today's confirmed patients with token numbers |
| 3 | Start Consultation | Doctor | Open Queue → Click "Start" on patient | 6-step prescription stepper opens |
| 4 | Write Prescription | Doctor | Fill all 6 steps → Finalize | Prescription saved, medicines listed |
| 5 | Order Lab Tests | Doctor | In Step 5, add CBC, Widal | LabReport records created |
| 6 | Collect Sample | Nurse | Open Sample Collection → Mark collected | LabReport status → Collected |
| 7 | Enter Lab Result | Lab Tech | Open report → Enter values | Parameters saved, status → Result Entered |
| 8 | Verify Lab Report | Doctor | Open report → Click Verify | Status → Verified |
| 9 | View Prescription | Patient | Open Prescriptions page | Sees prescription with medicines |
| 10 | View Lab Report | Patient | Open Lab Reports page | Sees verified report with values |
| 11 | Dispense Medicine | Pharmacist | Open Prescriptions → Check stock | Prescription visible, stock checked |
| 12 | Stock Movement | Pharmacist | New Stock Movement → Type: Out | Stock quantity reduced |
| 13 | Low Stock Alert | Pharmacist | Reduce stock below minStock | Alert emitted to hospital |
| 14 | IPD Admit | Receptionist | New Admission → Fill form → Select bed | Admission created, bed occupied |
| 15 | Record Vitals | Nurse | Open Vitals → Enter BP, Temp, Pulse | VitalRecord saved |
| 16 | Administer Medicine | Nurse | Open Medicines → Mark as Given | IpMedicineAdministration saved |
| 17 | Diet Order | Nurse | Open Diet → Add lunch order | DietOrder created |
| 18 | Generate OPD Bill | Receptionist | New Bill → Select booking → Save | OpdBill with receipt created |
| 19 | Record Payment | Receptionist | New Payment → Amount → Method | BillPayment created |
| 20 | Print Receipt | Receptionist | Click Print on bill | Print view opens |
| 21 | Bed Transfer | Receptionist | New Transfer → From/To bed | Both beds updated |
| 22 | Discharge Advise | Doctor | IPD Patient → Advise Discharge | dischargeAdvised = true |
| 23 | Complete Discharge | Receptionist | Discharge page → Generate bill → Complete | Bill + discharge done, bed freed |
| 24 | OT Schedule | Hospital | New OT → Fill surgery details | OtSchedule created |
| 25 | Prescription Queue | Assistant | Open Rx Queue | Sees pending prescriptions |

### ✅ Hospital Testing (Right Side Login)

| # | Test Case | Login As | Steps | Expected Result |
|---|-----------|----------|-------|----------------|
| 1 | Dashboard Stats | Hospital | Open dashboard | Revenue, patients, occupancy shown |
| 2 | Doctor List | Hospital | Open Doctors | All doctors with profiles |
| 3 | Department Mgmt | Hospital | Add/Edit department | Department saved |
| 4 | Ward & Bed Map | Hospital | Open Beds | Visual bed map with status |
| 5 | Inventory Reports | Hospital | Open Inventory Reports | Stock value, movements shown |
| 6 | Revenue Report | Hospital | Open Revenue Report | Daily/monthly revenue chart |
| 7 | Doctor Performance | Hospital | Open Doctor Report | Patients per doctor, revenue |
| 8 | Admin User List | Admin | Open Users | All users with roles |
| 9 | Admin Manage Users | Admin | Edit user role/status | User updated |
| 10 | Patient History | Patient | Open Appointments → Prescriptions | Full history visible |

---

## PART 5: IMPLEMENTATION PRIORITY

### Phase 1: Login Page Redesign (Est: 2-3 hours)
1. Split login page into LEFT (Clinic) + RIGHT (Hospital) panels
2. Add Nurse + Lab Technician role cards (currently missing from login)
3. Responsive design for mobile
4. Smooth animations with Framer Motion

### Phase 2: Flow Testing & Bug Fixes (Est: 4-6 hours)
1. Walk through each flow from the testing checklist above
2. Fix any broken flows
3. Ensure all APIs return correct data
4. Verify all EMIT notifications fire correctly

### Phase 3: Missing Features from Flows (Future)
1. Queue Display TV mode (full screen for waiting hall)
2. Prescription print with hospital letterhead
3. Lab report print with doctor signature
4. Discharge summary generation
5. WhatsApp/SMS notifications
6. Online payment integration

---

*Document prepared by: Architecture Agent*
*System: Doctorooms HMS v2.0*
*Total: 9 Roles | 145 Pages | 207 APIs | 72 Models*