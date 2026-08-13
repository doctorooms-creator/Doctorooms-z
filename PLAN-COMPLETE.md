# 🏥 HOSPITAL MANAGEMENT SYSTEM — COMPLETE DEVELOPMENT PLAN
# Architect-Level Blueprint for AI Execution

---

## 📌 DOCUMENT PURPOSE

This is the **single source of truth** for all remaining development. Any AI agent reading this file must be able to execute development without asking questions. Every schema field, every API route, every UI component, every business rule is specified.

**Rules for AI executing this plan:**
- Follow phases in order (P0 → P1 → P2 → P3)
- Within each phase, sub-phases can be parallelized where marked
- Always run `bun run db:push` after schema changes
- Always add dev users to `api-auth.ts` DEV_USERS for new roles
- Always add sidebar entries to `sidebar-config.ts`
- Use existing shadcn/ui components from `src/components/ui/`
- Use `requireRole(req, 'roleName')` for API auth
- Use `getAuthUser(req)` for any-role auth
- Use `import { db } from '@/lib/db'` for database
- Use TanStack Query (`useQuery`, `useMutation`) for data fetching
- All API routes go under `src/app/api/`
- All dashboard pages go under `src/app/dashboard/{role}/`
- Each page = `page.tsx` (server wrapper) + `client.tsx` (client component)
- Use `date-fns` for date formatting
- Use `sonner` for toast notifications
- Use `lucide-react` for icons
- Use Tailwind CSS 4 classes only
- Footer must be sticky to bottom
- No indigo/blue colors unless specified
- Responsive: mobile-first design

---

## 📊 CURRENT STATE INVENTORY

### Existing Roles (8)
`admin`, `doctor`, `patient`, `hospital`, `receptionist`, `assistant`, `pharmacist`, `nurse`

### Existing Prisma Models (40+)
**Foundation:** User, Doctor, Hospital, Department, DoctorHospital, Booking, BookingChat
**Prescription:** Prescription, PMedicine, PLabel, PSuggestion, PDignoTable, PCo, POtherSetting, DoctorMedicine, CategoryMaster, FindingsMaster, FindingsMedicine, TableTemplateMaster, CoMaster, QuestionsMaster, SuggestionsMaster, LabelMaster, PrescriptionAccessRequest
**Roles:** DoctorAssistant, DoctorPharmacist, Receptionist, StaffNurse
**IPD:** Ward, Bed, NursePatientAssignment, IpdAdmission, VitalRecord, DoctorOrder, MedicineAdministration, SampleCollection, InvestigationReport, ShiftHandover, DoctorVisit
**Other:** DoctorRating, DoctorSchedule, DoctorHoliday, DoctorGallery, Post, Notification, Slider, HospitalInquiry, DiseaseMaster, MedicalDocument

### Existing Dashboard Pages (~75+)
**Admin:** Dashboard, Users, Doctors, Hospitals, Wards, Nurses, Blog, Inquiries, Settings
**Doctor:** Dashboard, Appointments, Prescriptions (list/new/[id]), Earnings, Schedule, Patients, Medicines, Rx Settings (8 sub-pages), Profile, Gallery, Posts, IPD (list + patient detail)
**Receptionist:** Dashboard, Appointments, Pending Bookings, Walk-in, Queue, Print Queue, Schedule, Medicines, Patients, Reports, Blog, Profile, Notifications, IPD
**Pharmacist:** Dashboard, Prescriptions, Medicines
**Nurse:** Dashboard, My Patients, Ward View, Shift Handover, Profile, Patient Detail (vitals/medicines/investigations)
**Patient:** Dashboard, Appointments, Health Records, Rx Access, Blog, Feedback, Notifications, Profile, Settings
**Hospital:** Dashboard, Departments, Department-Doctors, Doctors, Appointments, Queue Display
**Assistant:** Dashboard, Appointments, Patients, Rx Queue

### Existing API Routes (~90+)
Full list available via glob `src/app/api/**/*.ts`

### Key Existing Patterns
- **Auth:** `requireRole(req, 'role')` / `requireAuth(req)` from `@/lib/api-auth`
- **DB:** `import { db } from '@/lib/db'`
- **Dev Users:** Hardcoded in `api-auth.ts` DEV_USERS object
- **Sidebar:** `sidebar-config.ts` — `RoleSidebarMap` type
- **IPD Utils:** `ipd-utils.ts` — `getCurrentShift()`, `checkVitalAlerts()`, `VITAL_THRESHOLDS`
- **Token Utils:** `token-utils.ts` — OPD token generation
- **Date Utils:** `date-utils.ts`

---

## 🏗️ NEW MODELS TO ADD (Prisma Schema)

Below are ALL new Prisma models. They must be added to `prisma/schema.prisma` in the order shown. Existing models that need new fields are marked with `[MODIFY EXISTING]`.

---

### MODULE A: BILLING & PAYMENTS

```prisma
// ============ BILLING: CHARGE CATEGORY (Master) ============

model ChargeCategory {
  id            String   @id @default(cuid())
  hospitalId    String
  name          String   @default("")        // "Room Rent", "Doctor Fee", "Medicine", "Investigation", "OT Charges", "Consumables"
  nameHi        String   @default("")
  code          String   @default("")        // "ROOM", "DOCFEE", "MED", "INV", "OT", "CONS"
  isEditable    Boolean  @default(true)       // Can receptionist add custom items under this?
  isActive      Boolean  @default(true)
  sortOrder     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  hospital      Hospital  @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  chargeItems   ChargeItem[]
}

// ============ BILLING: CHARGE ITEM (Master — rate cards) ============

model ChargeItem {
  id              String   @id @default(cuid())
  categoryId      String
  hospitalId      String
  name            String   @default("")        // "General Ward Bed", "CT Scan", "Blood CBC", "Appendectomy"
  nameHi          String   @default("")
  code            String   @default("")        // "GW-BED", "CT-SCAN", "BLOOD-CBC"
  defaultRate     Float    @default(0)          // Default price
  unit            String   @default("Per Day")  // "Per Day", "Per Test", "Per Unit", "Per Surgery", "One Time"
  isInsuranceApplicable Boolean @default(true)  // Can be claimed under insurance?
  status          String   @default("Active")   // Active, Inactive
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  category        ChargeCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  hospital        Hospital      @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  billLineItems   BillLineItem[]
}

// ============ BILLING: IPD BILL ============

model IpdBill {
  id              String   @id @default(cuid())
  billNo          String   @unique @default("")   // "BILL-2026-000001"
  admissionId     String   @unique                 // One bill per admission
  hospitalId      String

  // --- Amounts ---
  subtotal        Float    @default(0)              // Sum of all line items
  discountAmount  Float    @default(0)
  discountReason  String   @default("")
  taxAmount       Float    @default(0)
  taxPercent      Float    @default(0)              // e.g. 5, 12, 18
  roundOff        Float    @default(0)              // Rounding to nearest rupee
  netAmount       Float    @default(0)              // Final payable = subtotal - discount + tax + roundOff

  // --- Payment Status ---
  totalPaid       Float    @default(0)              // Sum of all payments
  balanceDue      Float    @default(0)              // netAmount - totalPaid
  paymentStatus   String   @default("Unpaid")       // Unpaid, Partial, Paid, WrittenOff

  // --- Insurance/TPA ---
  insuranceProvider String  @default("")           // "Star Health", "ICICI Lombard", "CGHS", "ESI"
  policyNumber    String   @default("")
  insuredName     String   @default("")
  insuredRelation String   @default("")           // Self, Spouse, Child, Parent
  tpaApprovalNo   String   @default("")
  tpaApprovedAmount Float  @default(0)
  isInsuranceCase Boolean  @default(false)
  insuranceStatus String   @default("")           // "", "Submitted", "Approved", "Rejected", "Settled"

  // --- Audit ---
  createdById     String                           // Receptionist User.id who created
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // --- Relations ---
  admission       IpdAdmission @relation(fields: [admissionId], references: [id])
  hospital        Hospital     @relation(fields: [hospitalId], references: [id])
  createdBy       User         @relation("BillCreator", fields: [createdById], references: [id])
  lineItems       BillLineItem[]
  payments        BillPayment[]
  advances        PatientAdvance[]
}

// ============ BILLING: BILL LINE ITEM ============

model BillLineItem {
  id              String   @id @default(cuid())
  billId          String
  chargeItemId    String?                         // Link to master rate card (null for custom items)
  categoryId      String?                         // Link to category

  description     String   @default("")           // "Room Rent - General Ward (5 days)", "Tab. Paracetamol 500mg x 30"
  quantity        Float    @default(1)
  rate            Float    @default(0)              // Per unit rate
  amount          Float    @default(0)              // quantity * rate
  discount        Float    @default(0)              // Per-line discount
  netAmount       Float    @default(0)              // amount - discount

  // --- Dates for duration-based charges ---
  startDate       DateTime?
  endDate         DateTime?
  days            Int      @default(0)              // Auto-calculated for room rent

  // --- Source tracking ---
  sourceType      String   @default("Manual")      // "Manual", "RoomRent", "DoctorVisit", "Investigation", "Medicine", "OT", "Consumable"
  sourceId        String   @default("")           // Reference to source record ID

  status          String   @default("Active")      // Active, Cancelled
  cancelledBy     String?
  cancelledAt     DateTime?
  cancelReason    String   @default("")

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  bill            IpdBill      @relation(fields: [billId], references: [id], onDelete: Cascade)
  chargeItem      ChargeItem?  @relation(fields: [chargeItemId], references: [id])
}

// ============ BILLING: PAYMENT RECEIPT ============

model BillPayment {
  id              String   @id @default(cuid())
  billId          String
  receiptNo       String   @unique @default("")   // "REC-2026-000001"
  hospitalId      String

  amount          Float    @default(0)
  paymentMethod   String   @default("Cash")         // Cash, UPI, Card, NetBanking, Cheque, Insurance, WrittenOff
  paymentRef      String   @default("")           // UPI txn ID, Cheque number, etc.
  receivedById    String                          // User.id of receptionist who collected
  receivedAt      DateTime @default(now())
  remarks         String   @default("")

  bill            IpdBill @relation(fields: [billId], references: [id], onDelete: Cascade)
  hospital        Hospital @relation(fields: [hospitalId], references: [id])
  receivedBy      User     @relation("PaymentReceiver", fields: [receivedById], references: [id])
}

// ============ BILLING: PATIENT ADVANCE DEPOSIT ============

model PatientAdvance {
  id              String   @id @default(cuid())
  admissionId     String
  billId          String?                         // Linked to bill once created
  hospitalId      String

  amount          Float    @default(0)
  receiptNo       String   @default("")           // "ADV-2026-000001"
  paymentMethod   String   @default("Cash")
  paymentRef      String   @default("")
  receivedById    String
  receivedAt      DateTime @default(now())
  remarks         String   @default("")
  status          String   @default("Active")      // Active, Adjusted, Refunded

  admission       IpdAdmission @relation(fields: [admissionId], references: [id])
  hospital        Hospital     @relation(fields: [hospitalId], references: [id])
  receivedBy      User         @relation("AdvanceReceiver", fields: [receivedById], references: [id])
  bill            IpdBill?     @relation(fields: [billId], references: [id])
}

// ============ BILLING: OPD BILL (simple, for OPD consultations) ============

model OpdBill {
  id              String   @id @default(cuid())
  billNo          String   @unique @default("")   // "OPD-BILL-2026-000001"
  bookingId       String?
  hospitalId      String?
  doctorId        String

  patientName     String   @default("")
  consultationFee Float    @default(0)
  otherCharges    Float    @default(0)              // Sum of additional line items
  totalAmount     Float    @default(0)              // consultationFee + otherCharges
  discount        Float    @default(0)
  netAmount       Float    @default(0)
  paymentMethod   String   @default("Cash")
  paymentStatus   String   @default("Unpaid")       // Unpaid, Paid
  receivedById    String?
  receivedAt      DateTime?
  remarks         String   @default("")

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  doctor          Doctor @relation(fields: [doctorId], references: [id])
  booking         Booking? @relation("OpdBillBooking", fields: [bookingId], references: [id])
}
```

**[MODIFY EXISTING] IpdAdmission — add these fields:**
```prisma
  // Add inside IpdAdmission model:
  advanceAmount    Float    @default(0)              // Total advance collected
  estimatedBill    Float    @default(0)              // Estimated total bill (for display)
```

**[MODIFY EXISTING] User — add these relations:**
```prisma
  // Add inside User model:
  createdBills     IpdBill[]       @relation("BillCreator")
  receivedPayments BillPayment[]   @relation("PaymentReceiver")
  receivedAdvances PatientAdvance[] @relation("AdvanceReceiver")
```

**[MODIFY EXISTING] Hospital — add these relations:**
```prisma
  // Add inside Hospital model:
  chargeCategories ChargeCategory[]
  chargeItems      ChargeItem[]
  ipdBills         IpdBill[]
  billPayments     BillPayment[]
  patientAdvances  PatientAdvance[]
  operationTheaters OperationTheater[]
  otSchedules      OtSchedule[]
  labTechnicianProfiles LabTechnician[]
  dietOrders       DietOrder[]
  inventoryItems   InventoryItem[]
  purchaseOrders   PurchaseOrder[]
  stockMovements   StockMovement[]
```

**[MODIFY EXISTING] IpdAdmission — add these relations:**
```prisma
  // Add inside IpdAdmission model:
  bill             IpdBill?
  patientAdvances  PatientAdvance[]
  otSchedules      OtSchedule[]
  dietOrders       DietOrder[]
  bedTransfers     BedTransfer[]
```

---

### MODULE B: LAB / PATHOLOGY

```prisma
// ============ LAB: LAB TECHNICIAN ============

model LabTechnician {
  id            String   @id @default(cuid())
  userId        String   @unique
  hospitalId    String
  employeeId    String   @default("")         // "LAB-001"
  qualification String   @default("")         // DMLT, BSc MLT, MSc MLT
  specialization String   @default("")        // "Pathology", "Biochemistry", "Microbiology"
  phoneNo       String   @default("")
  status        String   @default("Active")    // Active, Inactive
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation("LabTechUser", fields: [userId], references: [id], onDelete: Cascade)
  hospital      Hospital @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  labReports    LabReport[]
}

// ============ LAB: TEST MASTER (Master — all tests hospital can do) ============

model LabTestMaster {
  id              String   @id @default(cuid())
  hospitalId      String
  name            String   @default("")          // "Complete Blood Count (CBC)", "Liver Function Test (LFT)"
  shortName       String   @default("")          // "CBC", "LFT"
  category        String   @default("")          // "Haematology", "Biochemistry", "Microbiology", "Serology", "Urine", "Radiology"
  sampleType      String   @default("Blood")      // "Blood", "Urine", "Sputum", "CSF", "Swab", "Stool"
  containerType   String   @default("")          // "EDTA Tube", "Plain Tube", "Urine Container"
  fastingRequired Boolean  @default(false)
  reportType      String   @default("Tabular")    // "Tabular", "Qualitative", "Microbiology", "Single Value"
  turnAroundHours Int      @default(4)            // Expected TAT in hours
  defaultRate     Float    @default(0)
  status          String   @default("Active")
  sortOrder       Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  hospital        Hospital          @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  testParameters   LabTestParameter[]
  labReports      LabReport[]
}

// ============ LAB: TEST PARAMETER (Normal ranges per parameter) ============

model LabTestParameter {
  id              String   @id @default(cuid())
  testId          String
  name            String   @default("")          // "Hemoglobin", "WBC", "RBC", "Platelet", "Blood Sugar"
  shortName       String   @default("")          // "Hb", "WBC", "RBC", "PLT", "BS"
  unit            String   @default("")          // "g/dL", "cells/cu.mm", "mg/dL"
  normalMaleMin   Float    @default(0)
  normalMaleMax   Float    @default(0)
  normalFemaleMin Float    @default(0)
  normalFemaleMax Float    @default(0)
  normalChildMin  Float    @default(0)
  normalChildMax  Float    @default(0)
  criticalLow     Float?
  criticalHigh    Float?
  sortOrder       Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  test            LabTestMaster @relation(fields: [testId], references: [id], onDelete: Cascade)
  reportValues    LabParameterValue[]
}

// ============ LAB: LAB REPORT (The actual report for a patient) ============

model LabReport {
  id              String   @id @default(cuid())
  reportNo        String   @unique @default("")   // "LAB-2026-000001"
  hospitalId      String
  admissionId     String?                         // IPD patient (null for OPD)
  bookingId       String?                         // OPD booking (null for IPD)
  patientName     String   @default("")
  patientAge      Int      @default(0)
  patientGender   String   @default("")
  testId          String                         // LabTestMaster.id

  sampleCollectionId String?                      // Link to existing SampleCollection
  sampleCollectedAt  DateTime?
  sampleReceivedAt   DateTime?

  status          String   @default("Ordered")    // Ordered, SampleCollected, Processing, Ready, Verified, Printed, Filed
  isUrgent        Boolean  @default(false)
  remarks         String   @default("")

  reportedById    String?                         // Lab Tech User.id
  reportedAt      DateTime?
  verifiedById    String?                         // Pathologist / Senior Doctor User.id
  verifiedAt      DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  hospital        Hospital         @relation(fields: [hospitalId], references: [id])
  admission       IpdAdmission?    @relation("LabReportAdmission", fields: [admissionId], references: [id])
  booking         Booking?         @relation("LabReportBooking", fields: [bookingId], references: [id])
  test            LabTestMaster    @relation(fields: [testId], references: [id])
  reportedBy      User?            @relation("LabReportedBy", fields: [reportedById], references: [id])
  verifiedBy      User?            @relation("LabVerifiedBy", fields: [verifiedById], references: [id])
  parameterValues LabParameterValue[]
}

// ============ LAB: LAB PARAMETER VALUE (Actual result values) ============

model LabParameterValue {
  id              String   @id @default(cuid())
  reportId        String
  parameterId     String
  value           String   @default("")          // "12.5" — String because some are text like "Positive", "Negative"
  isAbnormal      Boolean  @default(false)         // Auto-set: value outside normal range
  isCritical      Boolean  @default(false)         // Auto-set: value exceeds critical range
  remarks         String   @default("")
  enteredById     String?                         // Lab Tech User.id
  enteredAt       DateTime @default(now())

  report          LabReport        @relation(fields: [reportId], references: [id], onDelete: Cascade)
  parameter       LabTestParameter @relation(fields: [parameterId], references: [id])
}
```

**[MODIFY EXISTING] User — add:**
```prisma
  labTechProfile   LabTechnician?  @relation("LabTechUser")
  labReportsEntered LabReport[]    @relation("LabReportedBy")
  labReportsVerified LabReport[]   @relation("LabVerifiedBy")
```

---

### MODULE C: INVENTORY MANAGEMENT

```prisma
// ============ INVENTORY: ITEM ============

model InventoryItem {
  id              String   @id @default(cuid())
  hospitalId      String
  name            String   @default("")          // "Paracetamol 500mg Tab", "Normal Saline 500ml", "Syringe 5ml"
  genericName     String   @default("")          // "Paracetamol"
  category        String   @default("")          // "Tablet", "Injection", "IV Fluid", "Consumable", "Surgical"
  unit            String   @default("")          // "Tab", "Vial", "Bottle", "Piece", "Box"
  manufacturer    String   @default("")
  batchNo         String   @default("")
  expiryDate      DateTime?
  mrp             Float    @default(0)
  purchaseRate    Float    @default(0)
  sellingRate     Float    @default(0)
  currentStock    Float    @default(0)             // Current quantity in hand
  minStockLevel   Float    @default(10)            // Alert threshold
  maxStockLevel   Float    @default(500)
  reorderQty      Float    @default(100)           // Suggested reorder quantity
  storeLocation   String   @default("")          // "Main Store", "Ward Store - ICU", "Pharmacy"
  hsnCode         String   @default("")          // For GST
  gstPercent      Float    @default(0)
  status          String   @default("Active")      // Active, Inactive, Expired
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  hospital        Hospital       @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  stockMovements  StockMovement[]
  purchaseOrderItems PurchaseOrderItem[]
}

// ============ INVENTORY: STOCK MOVEMENT ============

model StockMovement {
  id              String   @id @default(cuid())
  hospitalId      String
  itemId          String
  movementType    String   @default("In")          // "In", "Out", "Adjustment", "Return", "Expired", "Damaged"
  quantity        Float    @default(0)
  previousStock   Float    @default(0)
  newStock        Float    @default(0)
  referenceType   String   @default("")          // "PurchaseOrder", "IssueToWard", "PatientUse", "ManualAdjustment"
  referenceId     String   @default("")
  fromLocation    String   @default("")
  toLocation      String   @default("")
  remarks         String   @default("")
  performedById   String                          // User.id
  performedAt     DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  hospital        Hospital       @relation(fields: [hospitalId], references: [id])
  item            InventoryItem @relation(fields: [itemId], references: [id])
  performedBy     User           @relation("StockPerformer", fields: [performedById], references: [id])
}

// ============ INVENTORY: PURCHASE ORDER ============

model PurchaseOrder {
  id              String   @id @default(cuid())
  poNumber        String   @unique @default("")   // "PO-2026-000001"
  hospitalId      String
  supplierName    String   @default("")
  supplierContact String   @default("")
  supplierAddress String   @default("")
  expectedDate    DateTime?
  status          String   @default("Draft")      // Draft, Submitted, Approved, PartiallyReceived, Received, Cancelled
  totalAmount     Float    @default(0)
  approvedById    String?
  approvedAt      DateTime?
  remarks         String   @default("")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  hospital        Hospital           @relation(fields: [hospitalId], references: [id])
  items           PurchaseOrderItem[]
}

// ============ INVENTORY: PURCHASE ORDER ITEM ============

model PurchaseOrderItem {
  id              String   @id @default(cuid())
  poId            String
  itemId          String
  quantity        Float    @default(0)
  rate            Float    @default(0)
  amount          Float    @default(0)
  receivedQty     Float    @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  po              PurchaseOrder  @relation(fields: [poId], references: [id], onDelete: Cascade)
  item            InventoryItem  @relation(fields: [itemId], references: [id])
}
```

**[MODIFY EXISTING] User — add:**
```prisma
  stockMovements   StockMovement[]  @relation("StockPerformer")
```

---

### MODULE D: OPERATION THEATER

```prisma
// ============ OT: OPERATION THEATER ============

model OperationTheater {
  id              String   @id @default(cuid())
  hospitalId      String
  name            String   @default("")          // "OT-1", "OT-2 (Major)", "Minor OT"
  otType          String   @default("Major")       // "Major", "Minor", "Emergency", "C-Section"
  floorNo         String   @default("")
  status          String   @default("Active")      // Active, Inactive, Maintenance
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  hospital        Hospital    @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  schedules       OtSchedule[]
}

// ============ OT: OT SCHEDULE ============

model OtSchedule {
  id              String   @id @default(cuid())
  hospitalId      String
  otId            String
  admissionId     String

  surgeryName     String   @default("")          // "Appendectomy", "Laparoscopic Cholecystectomy"
  surgeryType     String   @default("Elective")    // "Elective", "Emergency", "Scheduled"
  anesthesiaType  String   @default("")          // "General", "Spinal", "Local", "Sedation"

  scheduledDate   DateTime
  scheduledStart  String   @default("")          // "09:00"
  scheduledEnd    String   @default("")          // "11:00"
  estimatedDurationMinutes Int @default(60)

  surgeonId       String                          // Primary surgeon Doctor.id
  assistantSurgeonIds String @default("[]")      // JSON array of Doctor.id
  anesthetistId   String?                         // Doctor.id
  scrubNurseId    String?                         // StaffNurse id (User.id)

  status          String   @default("Scheduled")  // Scheduled, InProgress, Completed, Cancelled, Postponed
  actualStart     DateTime?
  actualEnd       DateTime?

  // --- Post-Op ---
  postOpNotes     String   @default("")
  complications   String   @default("")

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  hospital        Hospital       @relation(fields: [hospitalId], references: [id])
  ot              OperationTheater @relation(fields: [otId], references: [id])
  admission       IpdAdmission   @relation(fields: [admissionId], references: [id])
  surgeon         Doctor        @relation("OtSurgeon", fields: [surgeonId], references: [id])
}

// ============ IPD: BED TRANSFER ============

model BedTransfer {
  id              String   @id @default(cuid())
  admissionId     String
  fromBedId       String
  toBedId         String
  fromWardId      String
  toWardId        String
  reason          String   @default("")          // "Upgraded to Private", "Shifted to ICU", "Step-down to General"
  transferDate    DateTime @default(now())
  transferredBy   String                          // User.id (nurse or receptionist)
  createdAt       DateTime @default(now())

  admission       IpdAdmission @relation(fields: [admissionId], references: [id])
}
```

**[MODIFY EXISTING] Doctor — add:**
```prisma
  otSurgeries     OtSchedule[]  @relation("OtSurgeon")
```

---

### MODULE E: DIET / KITCHEN

```prisma
// ============ DIET: DIET ORDER ============

model DietOrder {
  id              String   @id @default(cuid())
  admissionId     String
  hospitalId      String

  dietType        String   @default("Normal")      // "Normal", "Diabetic", "Renal", "Cardiac", "Liquid", "Semi-Solid", "NPO (Nothing by mouth)"
  mealType        String   @default("")          // "Breakfast", "Lunch", "Snacks", "Dinner"
  specialInstructions String @default("")       // "No salt", "High protein", "Low fat"
  orderedBy       String                          // Doctor.id
  orderedAt       DateTime @default(now())
  status          String   @default("Active")      // Active, Modified, Stopped

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  admission       IpdAdmission @relation(fields: [admissionId], references: [id], onDelete: Cascade)
  hospital        Hospital     @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
}
```

---

### MODULE F: NOTIFICATION ENHANCEMENT (WebSocket Infrastructure)

No new Prisma model. Uses existing `Notification` model.

**New mini-service:** `mini-services/notification-service/index.ts`
- Socket.io server on port 3005
- Rooms: `hospital:{hospitalId}`, `nurse:{nurseId}`, `doctor:{doctorId}`
- Events: `new-order`, `vital-alert`, `lab-ready`, `bill-update`, `ot-status`, `admission`
- API: POST to emit event (called by other API routes)

---

## 🗺️ PHASE MAP — DEVELOPMENT ORDER

```
PHASE 1 (P0): BILLING & DISCHARGE — Makes it a BUSINESS tool
├── 1A: Schema (all billing models + IpdAdmission modifications)
├── 1B: Charge Master (Admin CRUD for categories + items)
├── 1C: IPD Bill Creation & Line Items
├── 1D: Advance Deposit Management
├── 1E: Payment Collection & Receipts
├── 1F: Discharge Flow (discharge summary + final bill + clearance checklist)
├── 1G: OPD Billing
└── 1H: Bill Printing

PHASE 2 (P1): LAB / PATHOLOGY — Every hospital needs a lab
├── 2A: Schema (LabTech, LabTestMaster, LabTestParameter, LabReport, LabParameterValue)
├── 2B: Lab Test Master (Admin CRUD)
├── 2C: Lab Technician Role (new role, sidebar, dev user)
├── 2D: Lab Technician Dashboard (worklist, sample management)
├── 2E: Result Entry & Verification
├── 2F: Report Viewing (Doctor, Nurse, Patient portals)
└── 2G: Lab Report Printing

PHASE 3 (P1): INVENTORY MANAGEMENT — Operational efficiency
├── 3A: Schema (InventoryItem, StockMovement, PurchaseOrder, PurchaseOrderItem)
├── 3B: Inventory Master (Admin CRUD)
├── 3C: Stock Movement Tracking
├── 3D: Low Stock Alerts
├── 3E: Purchase Order Management
└── 3F: Issue to Ward / Patient Consumption

PHASE 4 (P1): REPORTS & ANALYTICS — Owner visibility
├── 4A: Admin Revenue Dashboard (daily/weekly/monthly collections)
├── 4B: IPD Analytics (bed occupancy, ALOS, department-wise stats)
├── 4C: OPD Analytics (patient flow, doctor-wise, department-wise)
├── 4D: Financial Reports (P&L, outstanding bills, insurance summary)
├── 4E: Inventory Reports (consumption, expiry, low stock)
└── 4F: Lab Reports (tests done, TAT compliance, revenue)

PHASE 5 (P2): COMPLETE IPD (N-2 to N-8) + OT + BED TRANSFER
├── 5A: IPD Admission Enhancement (insurance fields, TPA)
├── 5B: Doctor Orders with WebSocket notification
├── 5C: Nurse Medicine Administration (scheduled view, give/skip/refuse)
├── 5D: Vital Monitoring Enhancement (trend charts, smart alerts)
├── 5E: Investigation Integration with Lab module
├── 5F: Shift Handover Enhancement (auto-populate pending tasks)
├── 5G: Doctor Visit & Round Notes
├── 5H: Bed Transfer Workflow
├── 5I: OT Module (scheduling, status tracking, post-op)
├── 5J: Diet Order Module
└── 5K: Discharge Summary Generation (auto-compile all data)

PHASE 6 (P2): PRINT SYSTEM — Indian hospitals are paper-heavy
├── 6A: IPD Admission Sheet Print
├── 6B: Discharge Summary Print (comprehensive)
├── 6C: Bill Print (IPD + OPD)
├── 6D: Receipt Print (Payment + Advance)
├── 6E: Lab Report Print (with hospital header, normal ranges, abnormal flags)
├── 6F: Prescription Print (enhance existing)
├── 6G: Vital Monitoring Chart Print
└── 6H: Consent Forms Print (surgery, anesthesia, blood transfusion)

PHASE 7 (P3): FAMILY / ATTENDANT PORTAL
├── 7A: Admission Access Code (6-digit, generated at admission)
├── 7B: Public patient status page (no login required, just access code)
├── 7C: Live vitals display (last 24h)
├── 7D: Current medicines display
├── 7E: Doctor visit notes (selective)
├── 7F: Lab reports view
└── 7G: Running bill amount

PHASE 8 (P3): POLISH & ADVANCED
├── 8A: WebSocket Notification Service (mini-service on port 3005)
├── 8B: Real-time order notification (Doctor → Nurse)
├── 8C: Real-time vital alerts (Nurse → Doctor)
├── 8D: Mobile/tablet responsive optimization
├── 8E: PWA manifest for offline capability
└── 8F: Admin Settings Enhancement (hospital profile, billing config, print config)
```

---

## 📋 DETAILED PHASE 1: BILLING & DISCHARGE

### Phase 1A: Schema Changes

**File:** `prisma/schema.prisma`

Add ALL models from Module A above (ChargeCategory, ChargeItem, IpdBill, BillLineItem, BillPayment, PatientAdvance, OpdBill).

Add relations to existing models:
- `User`: `createdBills`, `receivedPayments`, `receivedAdvances`
- `Hospital`: `chargeCategories`, `chargeItems`, `ipdBills`, `billPayments`, `patientAdvances`
- `IpdAdmission`: `bill`, `patientAdvances`, `advanceAmount`, `estimatedBill`

After editing schema:
```bash
bun run db:push
bun run db:generate
```

---

### Phase 1B: Charge Master (Admin)

**Purpose:** Admin sets up charge categories and items (rate card). Receptionist uses these when creating bills.

#### API Routes

**1. Charge Category CRUD**
`POST/GET /api/dashboard/admin/charge-categories`
```
POST: Create category
Auth: requireRole(req, 'admin')
Body: { hospitalId, name, nameHi?, code, isEditable?, isActive?, sortOrder? }
Response: { success: true, category: ChargeCategory }

GET: List categories
Auth: requireRole(req, 'admin')
Query: ?hospitalId=xxx
Response: { success: true, categories: ChargeCategory[] }
```

`PATCH/DELETE /api/dashboard/admin/charge-categories/[id]`
```
PATCH: Update category
Auth: requireRole(req, 'admin')
Body: { name?, nameHi?, code?, isEditable?, isActive?, sortOrder? }
Response: { success: true, category: ChargeCategory }

DELETE: Delete category (only if no items linked)
Auth: requireRole(req, 'admin')
Response: { success: true }
```

**2. Charge Item CRUD**
`POST/GET /api/dashboard/admin/charge-items`
```
POST: Create item
Auth: requireRole(req, 'admin')
Body: { categoryId, hospitalId, name, nameHi?, code?, defaultRate, unit?, isInsuranceApplicable? }
Response: { success: true, item: ChargeItem }

GET: List items
Auth: requireRole(req, 'admin')
Query: ?hospitalId=xxx&categoryId=xxx&search=xxx
Response: { success: true, items: ChargeItem[] (with category) }
```

`PATCH/DELETE /api/dashboard/admin/charge-items/[id]`
```
PATCH: Update item
Auth: requireRole(req, 'admin')
Body: { name?, defaultRate?, unit?, status? ... }
Response: { success: true }

DELETE: Delete item
Auth: requireRole(req, 'admin')
Response: { success: true }
```

#### UI Pages

**Admin Charge Master Page**
- Route: `/dashboard/admin/charge-master`
- File: `page.tsx` (server) + `client.tsx` (client)
- Layout:
  - Top: Two tabs — "Categories" and "Items"
  - Categories Tab:
    - Table: Name, Code, Editable, Active, Actions (Edit/Delete)
    - "Add Category" button → Dialog with form
  - Items Tab:
    - Filter row: Category dropdown, Search input
    - Table: Name, Category, Default Rate, Unit, Status, Actions
    - "Add Item" button → Dialog with form (category dropdown auto-fills from categories)

#### Sidebar Change
Add to `admin` array in `sidebar-config.ts`:
```ts
{ label: 'Charge Master', href: '/dashboard/admin/charge-master', icon: IndianRupee },
```

---

### Phase 1C: IPD Bill Creation & Line Items

**Purpose:** Receptionist creates bill for admitted patient, adds charge line items.

#### API Routes

**1. Create/Get IPD Bill**
`POST /api/dashboard/receptionist/ipd-bills`
```
POST: Create bill for admission
Auth: requireRole(req, 'receptionist')
Body: { admissionId, hospitalId, taxPercent?, insuranceProvider?, policyNumber?, insuredName?, insuredRelation?, isInsuranceCase? }
Logic:
  1. Check admission exists and status is 'Admitted'
  2. Check no existing bill for this admission (unique constraint)
  3. Generate billNo: "BILL-" + year + "-" + 6-digit sequential
  4. Auto-add room rent line item: calculate days from admissionDate to now, multiply by Bed.dailyRate
  5. Create IpdBill record
  6. Return bill with line items
Response: { success: true, bill: IpdBill (with lineItems, payments, advances) }
```

`GET /api/dashboard/receptionist/ipd-bills/[admissionId]`
```
GET: Get bill for admission
Auth: requireRole(req, 'receptionist')
Response: { success: true, bill: IpdBill (include lineItems, payments, advances, admission, bed, ward) }

GET returns 404 if no bill created yet (frontend shows "Create Bill" button)
```

**2. Bill Line Items**
`POST /api/dashboard/receptionist/ipd-bills/[admissionId]/line-items`
```
POST: Add line item
Auth: requireRole(req, 'receptionist')
Body: { chargeItemId?, description, quantity, rate?, discount?, sourceType?, sourceId?, startDate?, endDate? }
Logic:
  1. If chargeItemId provided, fetch ChargeItem to get default rate
  2. Calculate: amount = quantity * rate, netAmount = amount - discount
  3. Create BillLineItem
  4. Recalculate bill totals: subtotal = SUM(netAmount), netAmount = subtotal - discount + tax + roundOff
  5. Update balanceDue = netAmount - totalPaid
  6. Return updated bill
Response: { success: true, bill: IpdBill (updated with new line item) }
```

`PATCH /api/dashboard/receptionist/ipd-bills/[admissionId]/line-items/[lineItemId]`
```
PATCH: Update line item (change qty, rate, discount, or cancel)
Auth: requireRole(req, 'receptionist')
Body: { quantity?, rate?, discount?, status? ("Cancelled"), cancelReason? }
Logic:
  1. If status === 'Cancelled', set cancelledBy, cancelledAt
  2. Recalculate bill totals
Response: { success: true, bill: IpdBill }
```

`DELETE /api/dashboard/receptionist/ipd-bills/[admissionId]/line-items/[lineItemId]`
```
DELETE: Remove line item
Auth: requireRole(req, 'receptionist')
Logic: Soft delete (set status='Cancelled'), recalculate totals
Response: { success: true, bill: IpdBill }
```

**3. Auto-add Room Rent (called when bill is created and daily)**
`POST /api/dashboard/receptionist/ipd-bills/[admissionId]/auto-room-rent`
```
POST: Recalculate/update room rent line item
Auth: requireRole(req, 'receptionist')
Logic:
  1. Find or create room rent line item (sourceType='RoomRent')
  2. Calculate days: floor((now - admissionDate) / 86400000) — but account for bed transfers
  3. Rate = current Bed.dailyRate
  4. Update quantity=days, rate=bedRate, amount=days*rate
  5. Recalculate bill totals
Response: { success: true, bill: IpdBill }
```

**4. Bill Summary (Recalculate)**
`POST /api/dashboard/receptionist/ipd-bills/[admissionId]/recalculate`
```
POST: Recalculate entire bill
Auth: requireRole(req, 'receptionist')
Logic:
  1. subtotal = SUM of all Active line items' netAmount
  2. discountAmount = from bill record
  3. taxAmount = (subtotal - discountAmount) * (taxPercent / 100)
  4. roundOff = Math.round(netAmount) - netAmount (where netAmount = subtotal - discount + tax)
  5. netAmount = Math.round(subtotal - discountAmount + taxAmount)
  6. balanceDue = netAmount - totalPaid
  7. Update bill
Response: { success: true, bill: IpdBill }
```

#### UI Pages

**Receptionist IPD Billing Page**
- Route: `/dashboard/receptionist/ipd-billing`
- File: `page.tsx` + `client.tsx`
- This is the BILL LIST view — shows all admitted patients with their bill status
- Layout:
  - Header: "IPD Billing" with search bar
  - Table/Cards: Patient Name, Admission No, Ward/Bed, Days Admitted, Bill Amount, Paid, Balance, Status (Unpaid/Partial/Paid), Actions ("View Bill")
  - Click "View Bill" → navigates to `/dashboard/receptionist/ipd-billing/[admissionId]`

**Receptionist IPD Bill Detail Page**
- Route: `/dashboard/receptionist/ipd-billing/[admissionId]/page.tsx` + `client.tsx`
- Layout:
  - Top: Patient info card (Name, Age, Admission No, Ward/Bed, Attending Doctor, Days Admitted)
  - If no bill exists: Big "Create Bill" button
  - Bill Header: Bill No, Created Date, Payment Status badge
   - Insurance Section (if applicable): Provider, Policy No, TPA Approval
   - **Line Items Table:**
    - Columns: #, Description, Qty, Rate, Amount, Discount, Net, Source, Actions (Edit/Cancel)
    - Bottom row: Subtotal, Discount, Tax, Round Off, **NET AMOUNT** (bold, large)
  - "Add Charge" button → Dialog with:
    - Search/Select from ChargeItem master (grouped by category)
    - OR manual entry (description, qty, rate)
    - Source type dropdown
  - **Payments Section:**
    - Table of past payments (Receipt No, Date, Amount, Method, Received By)
    - "Record Payment" button → Dialog (amount, method, reference, remarks)
  - **Advance Section:**
    - Table of advances collected
     - "Collect Advance" button → Dialog (amount, method, reference)
  - **Summary Card:**
    - Total Billed | Total Paid | Total Advance | Balance Due
  - "Update Room Rent" button (recalculates)
  - "Recalculate Bill" button
  - **"Discharge" button** (only if balance is 0 or admin override) → Goes to discharge flow

#### Sidebar Change
Add to `receptionist` array in `sidebar-config.ts`:
```ts
{ label: 'IPD Billing', href: '/dashboard/receptionist/ipd-billing', icon: IndianRupee },
```

---

### Phase 1D: Advance Deposit Management

#### API Routes

`POST/GET /api/dashboard/receptionist/ipd-bills/[admissionId]/advances`
```
POST: Collect advance
Auth: requireRole(req, 'receptionist')
Body: { amount, paymentMethod, paymentRef?, remarks? }
Logic:
  1. Create PatientAdvance record
  2. Generate receiptNo: "ADV-" + year + "-" + 6-digit
  3. Update IpdAdmission.advanceAmount += amount
  4. If bill exists, also link advance to bill
Response: { success: true, advance: PatientAdvance, updatedBill?: IpdBill }

GET: List advances for admission
Auth: requireRole(req, 'receptionist')
Response: { success: true, advances: PatientAdvance[] }
```

---

### Phase 1E: Payment Collection & Receipts

#### API Routes

`POST /api/dashboard/receptionist/ipd-bills/[admissionId]/payments`
```
POST: Record payment
Auth: requireRole(req, 'receptionist')
Body: { amount, paymentMethod, paymentRef?, remarks? }
Logic:
  1. Validate amount > 0
  2. Create BillPayment record
  3. Generate receiptNo: "REC-" + year + "-" + 6-digit
  4. Update bill: totalPaid += amount, recalculate balanceDue, update paymentStatus
  5. paymentStatus logic: balanceDue <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid'
Response: { success: true, payment: BillPayment, bill: IpdBill }
```

`GET /api/dashboard/receptionist/ipd-bills/[admissionId]/payments`
```
GET: List payments
Auth: requireRole(req, 'receptionist')
Response: { success: true, payments: BillPayment[] }
```

---

### Phase 1F: Discharge Flow

**Purpose:** Complete discharge process — clearance checklist → discharge summary generation → final bill → bed release.

#### API Routes

**1. Discharge Checklist**
`GET /api/dashboard/doctor/ipd/patients/[admissionId]/discharge-checklist`
```
GET: Get discharge readiness status
Auth: requireAuth(req) — doctor or receptionist
Response: {
  success: true,
  checklist: {
    allMedicinesCompleted: boolean,  // No active DoctorOrders without completed administrations
    pendingInvestigations: number,  // Count of SampleCollection with status != 'Reported'
    pendingLabReports: number,       // Count of LabReport with status != 'Verified'
    pendingMedicines: number,        // Count of MedicineAdministration with status 'Pending'
    billPaid: boolean,               // IpdBill.paymentStatus === 'Paid'
    hasDischargeSummary: boolean,    // IpdAdmission.dischargeSummary !== ''
    vitalAlerts: boolean,            // Any critical vital in last 24h
    otPending: boolean,              // Any OtSchedule with status 'Scheduled' or 'InProgress'
  },
  canDischarge: boolean  // true if billPaid && !otPending && !vitalAlerts
}
```

**2. Generate Discharge Summary**
`POST /api/dashboard/doctor/ipd/patients/[admissionId]/discharge-summary`
```
POST: Auto-generate discharge summary from all IPD data
Auth: requireRole(req, 'doctor')
Body: { finalDiagnosis, dischargeType, advise, followUpDays?, followUpDoctorId? }
Logic:
  1. Compile from DB:
     - Admission details (date, diagnosis, ward, bed)
     - History (chief complaints, past history, personal history)
     - Physical examination notes
     - All doctor visit notes (chronological)
     - All active/completed doctor orders (medicines)
     - All investigation reports (with abnormal flags)
     - All vitals summary (latest + any critical events)
     - OT records if any
  2. Format as structured text/markdown
  3. Save to IpdAdmission.dischargeSummary
Response: { success: true, summary: string }
```

**3. Process Discharge**
`POST /api/dashboard/receptionist/ipd/[admissionId]/discharge`
```
POST: Execute discharge
Auth: requireRole(req, 'receptionist')
Body: { dischargeType: "Normal"|"DAMA"|"LAMA"|"Expired", dischargeTime, finalDiagnosis? }
Logic:
  1. Update IpdAdmission:
     - status = 'Discharged' (or 'DAMA'/'LAMA'/'Expired' based on dischargeType)
     - dischargeDate = now
     - dischargeTime = provided
     - dischargeType = provided
  2. Release bed: Bed.status = 'Available', Bed.admissionId = null
  3. Deactivate nurse assignments: NursePatientAssignment.status = 'Completed', unassignedAt = now
  4. Stop all active DoctorOrders: status = 'Completed', stoppedAt = now
  5. If dischargeType === 'Normal' && bill exists && balanceDue > 0:
     - Return warning: "Balance due exists. Confirm discharge anyway?"
     - Frontend must show confirmation dialog
Response: { success: true, admission: IpdAdmission }
```

#### UI Pages

**Doctor Discharge Page** (add tab to existing doctor IPD patient detail)
- In `/dashboard/doctor/ipd/patients/[admissionId]/client.tsx` add a "Discharge" tab
- Contents:
  - **Discharge Checklist Card:** Green checkmarks / Red warnings for each item
  - **Final Diagnosis** input
  - **Discharge Type** select: Normal, DAMA, LAMA, Expired
  - **Advice** textarea
  - **Follow-up** section: days + doctor select
  - **"Generate Summary" button** → calls generate discharge summary API
  - **Preview** of generated summary (markdown rendered)
  - **"Save & Ready for Discharge" button**

**Receptionist Discharge Page**
- Route: `/dashboard/receptionist/ipd-billing/[admissionId]/discharge/page.tsx` + `client.tsx`
- Or: Add discharge section to the bill detail page as a dialog/sheet
- Contents:
  - **Checklist Status** (read-only, from doctor's checklist)
  - **Bill Status Card:** Total, Paid, Balance
  - **If balance > 0:** "Collect Payment" button OR "Discharge with Due" toggle (admin override)
  - **Discharge Type** select
  - **Confirmation Dialog:** "Are you sure you want to discharge [patient name]? Bed [bed] will be released."
  - **After discharge:** Show success with option to print discharge summary + final bill

---

### Phase 1G: OPD Billing

#### API Routes

`POST/GET /api/dashboard/receptionist/opd-bills`
```
POST: Create OPD bill
Auth: requireRole(req, 'receptionist')
Body: { bookingId?, doctorId, patientName, consultationFee, otherCharges?, discount?, paymentMethod, remarks? }
Logic:
  1. Generate billNo: "OPD-BILL-" + year + "-" + 6-digit
  2. Calculate: totalAmount = consultationFee + otherCharges, netAmount = totalAmount - discount
  3. If paymentMethod !== 'Unpaid': paymentStatus = 'Paid', receivedAt = now
  4. Create OpdBill
  5. If bookingId, link to booking
Response: { success: true, bill: OpdBill }

GET: List OPD bills
Auth: requireRole(req, 'receptionist')
Query: ?hospitalId=xxx&fromDate=xxx&toDate=xxx&paymentStatus=xxx
Response: { success: true, bills: OpdBill[] }
```

**UI:** Add OPD billing section to existing Receptionist dashboard or create `/dashboard/receptionist/opd-billing` page with table of bills.

---

### Phase 1H: Bill Printing

**Approach:** Use `window.print()` with a hidden print-only div that has proper A4 CSS styling.

**Bill Print Component:** `src/components/billing/ipd-bill-print.tsx`
```tsx
// Props: { bill: IpdBillWithAll, hospital: Hospital, patient: IpdAdmission }
// Rendered in a div with className="print-only" (hidden on screen, shown in print)
// CSS: @media print { .print-only { display: block !important; } .no-print { display: none !important; } }
// Content:
//   - Hospital header (name, address, phone, logo)
//   - "CASH BILL" / "INSURANCE BILL" header
//   - Bill No, Date, Patient Details
//   - Line Items table
//   - Totals section
//   - Payment history
//   - Footer: 