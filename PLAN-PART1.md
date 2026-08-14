# 🏥 PLAN PART 1 — COMPLETE BILLING SYSTEM (P0)

## Phase 1A: DATABASE SCHEMA — ALL NEW MODELS

Add these models to `prisma/schema.prisma`. Also modify existing models as listed.

### NEW MODEL 1: ChargeCategory
```
model ChargeCategory {
  id          String   @id @default(cuid())
  hospitalId  String
  name        String              // "Room Rent", "Doctor Fee", "Lab Test", "Medicine", "OT Charges", "Nursing", "Consumables"
  description String   @default("")
  isTaxable   Boolean  @default(true)
  taxPercent  Float    @default(0)       // GST % for this category
  status      String   @default("Active") // Active, Inactive
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  hospital    Hospital    @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  chargeItems ChargeItem[]
}
```

### NEW MODEL 2: ChargeItem
```
model ChargeItem {
  id              String   @id @default(cuid())
  categoryId      String
  hospitalId      String
  name            String              // "General Ward Bed", "X-Ray Chest PA", "Appendectomy"
  shortCode       String   @default("")  // "GW-BED", "XRAY-CPA"
  unitType        String   @default("Per Day") // Per Day, Per Unit, Per Service, Per Hour, Flat
  rate            Float    @default(0)
  isTaxable       Boolean  @default(true)
  taxPercent      Float    @default(0)
  status          String   @default("Active")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  category        ChargeCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  hospital        Hospital       @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  billLineItems   BillLineItem[]
}
```

### NEW MODEL 3: IpdBill
```
model IpdBill {
  id                String    @id @default(cuid())
  billNo            String    @unique @default("")  // "IPD-BILL-2026-000001"
  admissionId       String    @unique
  hospitalId        String

  roomRentAmount    Float     @default(0)
  serviceAmount     Float     @default(0)
  labAmount         Float     @default(0)
  medicineAmount    Float     @default(0)
  otAmount          Float     @default(0)
  otherAmount       Float     @default(0)
  subtotal          Float     @default(0)
  taxAmount         Float     @default(0)
  discountAmount    Float     @default(0)
  totalAmount       Float     @default(0)
  advanceAdjusted   Float     @default(0)
  netPayable        Float     @default(0)

  status            String    @default("Draft") // Draft, Final, Paid, PartiallyPaid
  generatedAt       DateTime?
  finalizedAt       DateTime?
  generatedBy       String?           // User.id who generated

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  admission         IpdAdmission  @relation(fields: [admissionId], references: [id])
  hospital          Hospital      @relation(fields: [hospitalId], references: [id])
  lineItems         BillLineItem[]
  payments          BillPayment[]
  advances          PatientAdvance[]
}
```

### NEW MODEL 4: BillLineItem
```
model BillLineItem {
  id            String   @id @default(cuid())
  billId        String
  chargeItemId  String?
  categoryId    String

  itemName      String   @default("")
  description   String   @default("")
  quantity      Float    @default(1)
  unitType      String   @default("Per Service")
  rate          Float    @default(0)
  amount        Float    @default(0)
  taxPercent    Float    @default(0)
  taxAmount     Float    @default(0)
  totalAmount   Float    @default(0)
  date          DateTime @default(now())

  bill          IpdBill     @relation(fields: [billId], references: [id], onDelete: Cascade)
  chargeItem    ChargeItem? @relation(fields: [chargeItemId], references: [id])
}
```

### NEW MODEL 5: BillPayment
```
model BillPayment {
  id              String    @id @default(cuid())
  receiptNo       String    @default("")  // "REC-2026-000001"
  billId          String
  admissionId     String
  hospitalId      String

  amount          Float     @default(0)
  paymentMethod   String    @default("Cash") // Cash, UPI, Card, NetBanking, Cheque, Insurance
  paymentRef      String    @default("")  // UPI txn ID, card last 4, cheque no
  paymentDate     DateTime  @default(now())
  receivedBy      String    // User.id
  notes           String    @default("")

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  bill            IpdBill    @relation(fields: [billId], references: [id], onDelete: Cascade)
}
```

### NEW MODEL 6: PatientAdvance
```
model PatientAdvance {
  id              String    @id @default(cuid())
  receiptNo       String    @default("")  // "ADV-2026-000001"
  admissionId     String
  hospitalId      String
  patientId       String?   // User.id (null for walk-in)

  amount          Float     @default(0)
  paymentMethod   String    @default("Cash")
  paymentRef      String    @default("")
  receivedBy      String    // User.id
  notes           String    @default("")

  billId          String?   // linked when adjusted at discharge

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  bill            IpdBill?  @relation(fields: [billId], references: [id])
}
```

### NEW MODEL 7: OpdBill
```
model OpdBill {
  id              String    @id @default(cuid())
  receiptNo       String    @default("")  // "OPD-BILL-2026-000001"
  bookingId       String    @unique
  hospitalId      String
  patientId       String?

  consultationFee Float     @default(0)
  labAmount       Float     @default(0)
  medicineAmount  Float     @default(0)
  otherAmount     Float     @default(0)
  subtotal        Float     @default(0)
  taxAmount       Float     @default(0)
  discountAmount  Float     @default(0)
  totalAmount     Float     @default(0)

  paymentMethod   String    @default("Cash")
  paymentRef      String    @default("")
  paymentDate     DateTime  @default(now())
  receivedBy      String?
  status          String    @default("Paid") // Paid, Pending, Refunded

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  booking         Booking  @relation(fields: [bookingId], references: [id])
}
```

### EXISTING MODEL MODIFICATIONS

**IpdAdmission — ADD these fields and relations:**
```
  // Add to IpdAdmission model:
  advanceAmount      Float           @default(0)
  estimatedBill      Float           @default(0)

  // Add these relations:
  bill               IpdBill?
  advances           PatientAdvance[]
  otSchedules        OtSchedule[]
  dietOrders         DietOrder[]
  bedTransfers       BedTransfer[]
```

**Hospital — ADD these relations:**
```
  // Add to Hospital model:
  chargeCategories    ChargeCategory[]
  chargeItems         ChargeItem[]
  ipdBills            IpdBill[]
  opdBills            OpdBill[]
  labTechnicians      LabTechnician[]
  labTestMasters      LabTestMaster[]
  labReports          LabReport[]
  inventoryItems      InventoryItem[]
  purchaseOrders      PurchaseOrder[]
  operationTheaters   OperationTheater[]
```

**User — ADD these relations:**
```
  // Add to User model:
  labTechnicianProfile LabTechnician? @relation("LabTechUser")
```

**Bed — ADD this relation:**
```
  // Add to Bed model:
  bedTransfers          BedTransfer[]
```

**Doctor — ADD this relation:**
```
  // Add to Doctor model:
  otSurgeries           OtSchedule[]
```

---

## Phase 1B: CHARGE MASTER [PARALLEL with 1C after 1A]

### API Routes

**1. `POST /api/charge-categories`** — Create category
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Body: `{ name, description, isTaxable, taxPercent, sortOrder }`
- Auto-set `hospitalId` from logged-in hospital user
- Return: created category

**2. `GET /api/charge-categories`** — List categories
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?status=Active`
- Return: array of categories with chargeItems count

**3. `POST /api/charge-items`** — Create charge item
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Body: `{ categoryId, name, shortCode, unitType, rate, isTaxable, taxPercent }`
- Auto-set `hospitalId`
- Return: created item with category name

**4. `GET /api/charge-items`** — List charge items
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?categoryId=xxx&status=Active&search=term`
- Return: array grouped by category

### Dashboard Pages

**Hospital Dashboard → Charge Master** (`/dashboard/hospital/charge-master`)
- `page.tsx`: server component, fetch categories + items count
- `client.tsx`: Two-tab layout
  - Tab 1: Categories list (Card grid) with Add/Edit dialog (Dialog + Form from shadcn)
  - Tab 2: Charge Items table (DataTable) with filters by category, search
  - Add Item dialog: category dropdown, name, shortcode, unit type (Select), rate (Input number), taxable toggle, tax %
- Use `useQuery` for data, `useMutation` for create/update/delete
- Toast on success/error via `sonner`

**Receptionist Dashboard → Charge Master** (`/dashboard/receptionist/charge-master`)
- Same UI as hospital (read + write access for receptionist)

**Admin Dashboard → Charge Categories** (`/dashboard/admin/charge-categories`)
- Global view: all hospitals' categories (with hospital name column)
- Admin can see but NOT edit (each hospital manages their own)

### Sidebar Changes
Add to hospital role:
```
{ label: 'Charge Master', href: '/dashboard/hospital/charge-master', icon: Tags },
{ label: 'Billing', href: '/dashboard/hospital/billing', icon: IndianRupee, children: [
  { label: 'IPD Bills', href: '/dashboard/hospital/billing/ipd', icon: FileText },
  { label: 'OPD Bills', href: '/dashboard/hospital/billing/opd', icon: Receipt },
  { label: 'Payments', href: '/dashboard/hospital/billing/payments', icon: CreditCard },
  { label: 'Advance Deposits', href: '/dashboard/hospital/billing/advances', icon: Wallet },
] },
```

Add to receptionist role (same billing children).
Add to admin role:
```
{ label: 'Billing', href: '/dashboard/admin/billing', icon: IndianRupee, children: [
  { label: 'All IPD Bills', href: '/dashboard/admin/billing/ipd', icon: FileText },
  { label: 'All OPD Bills', href: '/dashboard/admin/billing/opd', icon: Receipt },
] },
```

---

## Phase 1C: IPD BILL CREATION

### API Routes

**1. `POST /api/ipd-bills/generate`** — Generate draft bill for an admission
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'receptionist')`
- Body: `{ admissionId }`
- Logic:
  1. Fetch admission with ward, bed, doctor, doctorOrders, sampleCollections, investigationReports
  2. Calculate room rent: `bed.dailyRate × daysAdmitted` (use `date-fns` differenceInDays)
  3. Calculate service charges from doctor visits (doctor fees per visit)
  4. Calculate lab charges from investigation reports
  5. Calculate medicine charges from doctor orders
  6. Sum subtotal, calculate tax, apply any discount
  7. Create IpdBill with status "Draft" + BillLineItem records
  8. Auto-generate billNo: `IPD-BILL-{YEAR}-{000001}` (query max existing billNo for year, increment)
- Return: generated bill with all line items

**2. `GET /api/ipd-bills/[id]`** — Get single bill detail
- Auth: `getAuthUser(req)` (any authenticated user)
- Return: bill with all lineItems, payments, admission.patientName, admission.admissionNo

**3. `PUT /api/ipd-bills/[id]`** — Update draft bill (add/remove line items, adjust)
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'receptionist')`
- Body: `{ addItems: [{chargeItemId, quantity, description}], removeItemIds: [], discountAmount }`
- Only allow if bill.status === "Draft"
- Recalculate totals after changes
- Return: updated bill

**4. `POST /api/ipd-bills/[id]/finalize`** — Finalize bill (lock it)
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'receptionist')`
- Logic: Set status="Final", set finalizedAt=now(), recalculate all totals, set netPayable = totalAmount - advanceAdjusted
- Return: finalized bill

**5. `GET /api/ipd-bills`** — List bills
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?status=Draft&fromDate=2026-01-01&toDate=2026-12-31&search=patientName`
- Return: paginated list with patientName, admissionNo, billNo, totalAmount, netPayable, status

### Dashboard Pages

**Hospital → Billing → IPD Bills** (`/dashboard/hospital/billing/ipd`)
- `client.tsx`:
  - Top: Search bar + status filter tabs (All, Draft, Final, Paid)
  - Table: billNo, patientName, admissionNo, totalAmount, advanceAdjusted, netPayable, status, actions
  - Actions: View Detail, Generate Bill (for admissions without bill), Finalize
  - Click row → Bill Detail dialog/page

**Bill Detail Page** (`/dashboard/hospital/billing/ipd/[id]`)
- `client.tsx`:
  - Header: Bill No, Patient Name, Admission No, Admission Date, Ward-Bed, Attending Doctor
  - Line Items Table: S.No, Item Name, Category, Qty, Rate, Amount, Tax, Total
  - Summary Card: Subtotal, Tax, Discount, Total, Advance Adjusted, Net Payable
  - Add Item button (only if Draft status): Dialog with charge item search/select, quantity input
  - Remove item button per row (only if Draft)
  - Finalize button (only if Draft): confirmation dialog
  - Payment History section: list of BillPayment records
  - Print Bill button (opens print view — detailed in Phase 6)

---

## Phase 1D: ADVANCE DEPOSIT

### API Routes

**1. `POST /api/patient-advances`** — Record advance deposit
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'receptionist')`
- Body: `{ admissionId, amount, paymentMethod, paymentRef, notes }`
- Logic:
  1. Create PatientAdvance record
  2. Auto-generate receiptNo: `ADV-{YEAR}-{000001}`
  3. Update IpdAdmission.advanceAmount += amount
  4. Create Notification for patient (if userId exists)
- Return: created advance with receipt

**2. `GET /api/patient-advances`** — List advances for an admission
- Auth: `getAuthUser(req)`
- Query: `?admissionId=xxx`
- Return: array with receiptNo, amount, paymentMethod, date, receivedByName

**3. `GET /api/patient-advances/summary`** — Advance summary for admission
- Auth: `getAuthUser(req)`
- Query: `?admissionId=xxx`
- Return: `{ totalAdvance, lastAdvanceDate, lastAdvanceAmount }`

### Dashboard Pages

**Hospital → Billing → Advance Deposits** (`/dashboard/hospital/billing/advances`)
- `client.tsx`:
  - Table: receiptNo, patientName, admissionNo, amount, paymentMethod, date, receivedBy
  - Filter by date range, search by patient name
  - Add Advance button: Dialog with admission search (by admissionNo), amount, payment method (Select: Cash/UPI/Card/NetBanking/Cheque), payment ref, notes

**Admission Detail → Advances Tab** (add to existing IPD admission detail page)
- Sub-tab showing: total advance, list of advances, remaining balance estimate

---

## Phase 1E: PAYMENT COLLECTION

### API Routes

**1. `POST /api/bill-payments`** — Record payment against bill
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'receptionist')`
- Body: `{ billId, amount, paymentMethod, paymentRef, notes }`
- Logic:
  1. Validate bill exists and status is "Final" or "PartiallyPaid"
  2. Calculate: totalPaidSoFar + new amount
  3. If totalPaid >= bill.totalAmount: set bill.status = "Paid", else "PartiallyPaid"
  4. Create BillPayment with auto receiptNo: `REC-{YEAR}-{000001}`
  5. Update bill.netPayable = bill.totalAmount - totalPaid - bill.advanceAdjusted
- Return: payment receipt

**2. `GET /api/bill-payments`** — List all payments
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?fromDate=&toDate=&paymentMethod=&hospitalId=`
- Return: paginated list with receiptNo, billNo, patientName, amount, method, date

**3. `GET /api/bill-payments/[id]`** — Payment receipt detail
- Auth: `getAuthUser(req)`
- Return: payment with bill details, patient info, hospital info

**4. `GET /api/bill-payments/daily-summary`** — Today's payment summary
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'receptionist')`
- Return: `{ totalCash, totalUPI, totalCard, totalNetBanking, totalCheque, grandTotal, count }`

### Dashboard Pages

**Hospital → Billing → Payments** (`/dashboard/hospital/billing/payments`)
- `client.tsx`:
  - Top: Today's Summary Cards (Cash, UPI, Card, Total) with icons
  - Filter: Date range, Payment method
  - Table: Receipt No, Bill No, Patient, Amount, Method, Date, Received By
  - Record Payment button: Dialog to select bill (from Final/PartiallyPaid bills), enter amount, method, ref

**Payment Receipt View** (dialog or page)
- Hospital name, address, logo
- Receipt No, Date
- Patient Name, Admission No
- Bill No, Total Bill Amount
- Amount Paid This Time
- Payment Method, Reference
- Received By name
- Signature line

---

## Phase 1F: DISCHARGE FLOW

### API Routes

**1. `POST /api/ipd-admissions/[id]/discharge`** — Initiate discharge
- Auth: `requireRole(req, 'receptionist')` or `requireRole(req, 'hospital')`
- Body: `{ dischargeType: 'Normal'|'DAMA'|'LAMA', dischargeTime }`
- Logic:
  1. Check: all active doctor orders should be stopped (warning, not blocking)
  2. Generate bill if not exists (auto-call bill generate logic)
  3. Finalize bill if Draft
  4. Set admission.status = "Discharged", dischargeDate = now(), dischargeType
  5. Free the bed: `db.bed.update({ where: {id}, data: { status: 'Available', admissionId: null }})` — NOTE: need to make admissionId optional on Bed model for this
  6. Set admission.totalBillAmount = bill.totalAmount, paymentStatus = "Pending" (or "Paid" if fully paid)
- Return: updated admission with bill summary

**2. `POST /api/ipd-admissions/[id]/complete-discharge`** — Complete discharge (after payment)
- Auth: `requireRole(req, 'receptionist')` or `requireRole(req, 'hospital')`
- Body: `{ finalDiagnosis, dischargeSummary, prescriptionIds: [] }`
- Logic:
  1. Update admission with finalDiagnosis, dischargeSummary
  2. Link any OPD prescriptions created at discharge
  3. If bill.netPayable <= 0: set paymentStatus = "Paid"
  4. Return: final admission record

**3. `GET /api/ipd-admissions/discharge-pending`** — Admissions ready for discharge
- Auth: `requireRole(req, 'receptionist')` or `requireRole(req, 'hospital')`
- Return: admissions where doctor has advised discharge (add `dischargeAdvised` Boolean field to IpdAdmission) or status is still "Admitted" but bill is finalized

### Dashboard Pages

**Receptionist → Discharge** (add button on IPD patients page or new route `/dashboard/receptionist/ipd/discharge`)
- `client.tsx`:
  - List of admitted patients with "Discharge" button
  - Discharge Dialog: Step 1 - Select discharge type (Normal/DAMA/LAMA), Step 2 - Show bill summary (total, advance, payable), Step 3 - Record payment if due, Step 4 - Enter final diagnosis + discharge summary, Step 5 - Confirm and discharge
  - Multi-step form using shadcn Stepper pattern

**Doctor → IPD Patient → Discharge Advice** (on existing doctor IPD patient detail page)
- Button: "Advise Discharge"
- Form: finalDiagnosis (Textarea), dischargeSummary (Textarea), followUpInstructions, prescription
- API: `PUT /api/ipd-admissions/[id]/discharge-advice` — sets `dischargeAdvised = true`, saves diagnosis + summary

---

## Phase 1G: OPD BILLING

### API Routes

**1. `POST /api/opd-bills`** — Create OPD bill
- Auth: `requireRole(req, 'receptionist')` or `requireRole(req, 'hospital')`
- Body: `{ bookingId, consultationFee, labAmount, medicineAmount, otherAmount, paymentMethod, paymentRef }`
- Logic:
  1. Fetch booking, validate status is "Visited"
  2. Auto-generate receiptNo: `OPD-BILL-{YEAR}-{000001}`
  3. Calculate subtotal, tax, total
  4. Create OpdBill record
  5. Update booking with billing reference
- Return: OPD bill receipt

**2. `GET /api/opd-bills`** — List OPD bills
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?fromDate=&toDate=&doctorId=&paymentMethod=`
- Return: paginated list with receiptNo, patientName, doctorName, amount, method, date

**3. `GET /api/opd-bills/[id]`** — OPD bill detail
- Auth: `getAuthUser(req)`
- Return: bill with booking details, patient info, doctor info, hospital info

### Dashboard Pages

**Hospital → Billing → OPD Bills** (`/dashboard/hospital/billing/opd`)
- `client.tsx`:
  - Filter: Date range, Doctor, Payment Method
  - Table: Receipt No, Date, Patient, Doctor, Consultation Fee, Lab, Medicine, Total, Method
  - Create Bill button: Select visited booking, auto-fill consultation fee from doctor's fees, add lab/medicine charges, select payment method

---

## Phase 1H: BILLING DASHBOARD + RECEIPT

### API Routes

**1. `GET /api/billing/dashboard`** — Billing dashboard stats
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?period=today|week|month|year`
- Return:
```json
{
  "todayCollection": 45000,
  "monthCollection": 1250000,
  "pendingBills": 12,
  "pendingAmount": 340000,
  "ipdOccupancy": { "total": 100, "occupied": 67 },
  "avgBillAmount": 15000,
  "topRevenueDepartments": [{"name":"Cardiology","amount":350000}],
  "recentPayments": [{"id":"...","amount":5000,"patientName":"...","method":"UPI","date":"..."}]
}
```

**2. `GET /api/billing/receipt/[type]/[id]`** — Get receipt data for printing
- Auth: `getAuthUser(req)`
- type: `ipd-bill` | `opd-bill` | `advance` | `payment`
- Return: full receipt data with hospital info, patient info, line items, totals

### Dashboard Pages

**Hospital → Billing Dashboard** (`/dashboard/hospital/billing` — parent route)
- `client.tsx`:
  - Top row: 4 stat cards — Today's Collection, Monthly Collection, Pending Bills (count), Pending Amount
  - Second row: IPD Bed Occupancy donut (use simple CSS, no chart lib needed), Average Bill Amount
  - Third row: Recent Payments table (last 10), Top Revenue Departments bar (simple horizontal bars)
  - Quick Actions: Generate IPD Bill, Record Payment, Record Advance

---

## Phase 1 COMPLETE CHECKLIST

- [ ] All 7 new Prisma models added to schema.prisma
- [ ] All existing model modifications done
- [ ] `bun run db:push` successful
- [ ] ChargeCategory CRUD (2 APIs + UI)
- [ ] ChargeItem CRUD (2 APIs + UI)
- [ ] IPD Bill Generate (1 API + UI)
- [ ] IPD Bill Detail (1 API + UI)
- [ ] IPD Bill Update (1 API + UI)
- [ ] IPD Bill Finalize (1 API + UI)
- [ ] IPD Bills List (1 API + UI)
- [ ] Advance Deposit CRUD (3 APIs + UI)
- [ ] Payment Collection (4 APIs + UI)
- [ ] Discharge Flow (3 APIs + UI)
- [ ] OPD Billing (3 APIs + UI)
- [ ] Billing Dashboard (2 APIs + UI)
- [ ] Sidebar entries added for hospital, receptionist, admin
- [ ] Receipt print views (basic, enhanced in Phase 6)
- [ ] No TypeScript errors
- [ ] `bun run lint` passes
