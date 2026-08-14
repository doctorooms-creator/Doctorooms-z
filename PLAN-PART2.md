# PLAN PART 2 — LAB / PATHOLOGY + INVENTORY MANAGEMENT (P1)

## PHASE 2: LAB / PATHOLOGY

### Phase 2A: LAB TEST MASTER

#### New Models (add to schema.prisma)

**LabTestMaster:**
```
model LabTestMaster {
  id            String   @id @default(cuid())
  hospitalId    String
  name          String              // "Complete Blood Count", "Liver Function Test"
  shortCode     String   @default("")   // "CBC", "LFT"
  category      String   @default("")   // "Hematology", "Biochemistry", "Microbiology", "Radiology"
  description   String   @default("")
  specimenType  String   @default("")   // "Blood", "Urine", "Sputum", "Stool", "CSF", "Swab"
  reportDays    Int      @default(0)      // Expected turnaround: 0 = same day, 1 = next day
  rate          Float    @default(0)
  status        String   @default("Active") // Active, Inactive
  sortOrder     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  hospital      Hospital           @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  parameters    LabTestParameter[]
  labReports    LabReport[]
}
```

**LabTestParameter:**
```
model LabTestParameter {
  id              String   @id @default(cuid())
  testMasterId    String
  paramName       String              // "Hemoglobin", "WBC", "RBC"
  shortCode       String   @default("")   // "Hb", "WBC"
  unit            String   @default("")   // "g/dL", "cells/mm3"
  normalMaleMin   Float    @default(0)
  normalMaleMax   Float    @default(0)
  normalFemaleMin Float    @default(0)
  normalFemaleMax Float    @default(0)
  normalChildMin  Float    @default(0)
  normalChildMax  Float    @default(0)
  sortOrder       Int      @default(0)

  testMaster      LabTestMaster @relation(fields: [testMasterId], references: [id], onDelete: Cascade)
}
```

#### API Routes

**1. POST /api/lab-test-masters** — Create test master
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Body: `{ name, shortCode, category, description, specimenType, reportDays, rate, parameters: [{paramName, shortCode, unit, normalMaleMin, normalMaleMax, normalFemaleMin, normalFemaleMax, normalChildMin, normalChildMax, sortOrder}] }`
- Logic: Create LabTestMaster + all LabTestParameter records in transaction
- Return: created test with parameters

**2. GET /api/lab-test-masters** — List test masters
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')` or `requireRole(req, 'doctor')` or `requireRole(req, 'receptionist')`
- Query: `?category=Hematology&status=Active&search=term`
- Return: array of tests with parameter count

**3. PUT /api/lab-test-masters/[id]** — Update test master
- Auth: `requireRole(req, 'hospital')`
- Body: same as create (full replace of parameters — delete old, create new)
- Return: updated test

**4. DELETE /api/lab-test-masters/[id]** — Soft delete (set status=Inactive)
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Return: success

#### Dashboard Pages

**Hospital → Lab Test Master** (`/dashboard/hospital/lab-test-master`)
- `page.tsx` + `client.tsx`
- List: Table with name, shortCode, category, specimenType, rate, parameterCount, status, actions (Edit/Delete)
- Add/Edit Dialog: Form with test details + dynamic parameter list (add/remove rows)
- Each parameter row: paramName, shortCode, unit, male range (min-max), female range (min-max), sortOrder
- Use `useFieldArray` pattern for dynamic parameters

**Receptionist → Lab Test Master** (read-only view for ordering tests)
- Same table but no Edit/Delete, only View details

### Phase 2B: LAB TECHNICIAN ROLE

#### New Model

**LabTechnician:**
```
model LabTechnician {
  id            String   @id @default(cuid())
  userId        String   @unique
  hospitalId    String
  employeeId    String   @default("")   // "LAB-001"
  qualification String   @default("")   // BSc MLT, DMLT
  specialization String  @default("")   // "Hematology", "Biochemistry"
  phoneNo       String   @default("")
  status        String   @default("Active")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation("LabTechUser", fields: [userId], references: [id], onDelete: Cascade)
  hospital      Hospital @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  verifiedReports LabReport[] @relation("VerifiedByTech")
}
```

#### Setup Changes

**api-auth.ts DEV_USERS** — Add:
```typescript
{ id: 'lab-tech-1', name: 'Lab Tech 1', role: 'lab_technician', email: 'lab@hospital.com', password: '123456' }
```

**sidebar-config.ts** — Add lab_technician role:
```typescript
lab_technician: [
  { label: 'Dashboard', href: '/dashboard/lab-technician', icon: LayoutDashboard },
  { label: 'Worklist', href: '/dashboard/lab-technician/worklist', icon: ClipboardList },
  { label: 'Result Entry', href: '/dashboard/lab-technician/result-entry', icon: PenLine },
  { label: 'Reports', href: '/dashboard/lab-technician/reports', icon: FileText },
  { label: 'Profile', href: '/dashboard/lab-technician/profile', icon: UserCircle },
  { label: 'Change Password', href: '/dashboard/change-password', icon: KeyRound },
],
```

Also add to hospital sidebar:
```
{ label: 'Lab', href: '/dashboard/hospital/lab', icon: FlaskConical, children: [
  { label: 'Test Master', href: '/dashboard/hospital/lab/test-master', icon: ListOrdered },
  { label: 'Lab Reports', href: '/dashboard/hospital/lab/reports', icon: FileText },
] },
```

#### API Routes

**1. GET /api/lab-technician/dashboard** — Lab tech dashboard stats
- Auth: `requireRole(req, 'lab_technician')`
- Return: `{ pendingSamples: count, reportedToday: count, verifiedToday: count, urgentPending: count }`

**2. GET /api/lab-technician/profile** — Get own profile
- Auth: `requireRole(req, 'lab_technician')`
- Return: lab technician profile with user info

**3. PUT /api/lab-technician/profile** — Update profile
- Auth: `requireRole(req, 'lab_technician')`
- Body: `{ phoneNo, qualification, specialization }`

#### Dashboard Pages

**Lab Technician → Dashboard** (`/dashboard/lab-technician`)
- 4 stat cards: Pending Samples, Reported Today, Verified Today, Urgent
- Recent reports table

**Lab Technician → Profile** (`/dashboard/lab-technician/profile`)
- Form with name, email (read-only), phone, qualification, specialization, employee ID

### Phase 2C: LAB WORKLIST + RESULT ENTRY

#### New Models

**LabReport:**
```
model LabReport {
  id                String    @id @default(cuid())
  reportNo          String    @default("")  // "LAB-2026-000001"
  hospitalId        String
  testMasterId      String
  admissionId       String?           // null for OPD
  bookingId         String?           // for OPD
  patientId         String?
  patientName       String    @default("")
  patientAge        Int       @default(0)
  patientGender     String    @default("")
  doctorId          String?
  orderedById       String             // who ordered (doctor or receptionist user id)

  sampleCollectedAt DateTime?
  sampleCollectedBy String?
  resultEnteredAt   DateTime?
  resultEnteredBy   String?
  verifiedAt        DateTime?
  verifiedById      String?

  status            String    @default("Ordered") // Ordered, SampleCollected, Processing, ResultEntered, Verified, Printed
  urgency           String    @default("Normal")   // Normal, Urgent, STAT
  notes             String    @default("")

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  hospital          Hospital       @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  testMaster        LabTestMaster @relation(fields: [testMasterId], references: [id])
  parameterValues   LabParameterValue[]
  verifiedBy        LabTechnician? @relation("VerifiedByTech", fields: [verifiedById], references: [id])
}
```

**LabParameterValue:**
```
model LabParameterValue {
  id              String   @id @default(cuid())
  labReportId     String
  testParameterId String
  value           String   @default("")    // actual result value as string ("14.5", "Positive", "Negative")
  isAbnormal      Boolean  @default(false)  // auto-calculated: compare value against normal range based on patient gender
  remarks         String   @default("")    // technician notes on this parameter

  labReport       LabReport       @relation(fields: [labReportId], references: [id], onDelete: Cascade)
  testParameter   LabTestParameter @relation(fields: [testParameterId], references: [id])
}
```

#### API Routes

**1. POST /api/lab-reports/order** — Order a lab test
- Auth: `requireRole(req, 'doctor')` or `requireRole(req, 'receptionist')`
- Body: `{ testMasterId, admissionId?, bookingId?, patientId, patientName, patientAge, patientGender, doctorId, urgency }`
- Logic:
  1. Create LabReport with status="Ordered"
  2. Auto-generate reportNo: `LAB-{YEAR}-{000001}`
  3. Create LabParameterValue records for each parameter in testMaster (with empty values)
  4. Create Notification for lab technician
- Return: created report

**2. GET /api/lab-reports/worklist** — Get worklist for lab
- Auth: `requireRole(req, 'lab_technician')` or `requireRole(req, 'hospital')`
- Query: `?status=Ordered,SampleCollected&urgency=STAT`
- Return: array with patientName, testName, orderedAt, status, urgency

**3. PUT /api/lab-reports/[id]/collect-sample** — Mark sample collected
- Auth: `requireRole(req, 'lab_technician')` or `requireRole(req, 'nurse')`
- Body: `{ notes }`
- Logic: Set status="SampleCollected", sampleCollectedAt=now(), sampleCollectedBy=userId

**4. PUT /api/lab-reports/[id]/enter-result** — Enter test results
- Auth: `requireRole(req, 'lab_technician')`
- Body: `{ values: [{parameterId, value, remarks}] }`
- Logic:
  1. Update each LabParameterValue
  2. Auto-calculate isAbnormal: parse value as float, check against normal range based on patient gender (male→maleMin/MaleMax, female→femaleMin/FemaleMax)
  3. Set status="ResultEntered", resultEnteredAt=now(), resultEnteredBy=userId
- Return: updated report with all parameter values

**5. PUT /api/lab-reports/[id]/verify** — Verify/approve report
- Auth: `requireRole(req, 'lab_technician')` (should be senior tech or pathologist — for now same role)
- Logic: Set status="Verified", verifiedAt=now(), verifiedById=userId
- Return: verified report

### Phase 2D: LAB REPORT VIEW + PRINT

#### API Routes

**1. GET /api/lab-reports/[id]** — Get full report with values
- Auth: `getAuthUser(req)` (any authenticated)
- Return: report with testMaster (name, category), all parameterValues (paramName, unit, value, normalRange for patient gender, isAbnormal), patient info, hospital info

**2. GET /api/lab-reports** — List lab reports
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')` or `requireRole(req, 'doctor')`
- Query: `?fromDate=&toDate=&status=Verified&patientName=&testName=`
- Return: paginated list

#### Dashboard Pages

**Lab Technician → Worklist** (`/dashboard/lab-technician/worklist`)
- Filter tabs: All, Ordered, Sample Collected, Processing, Result Entered
- Table: Report No, Patient Name, Test Name, Urgency (badge: STAT=red, Urgent=orange), Status, Ordered At, Action buttons
- Actions: Collect Sample, Enter Result, Verify (based on current status)

**Lab Technician → Result Entry** (`/dashboard/lab-technician/result-entry/[id]`)
- Header: Report No, Patient Name, Age, Gender, Test Name
- Form: For each parameter — Label (paramName + unit), Input field (value), Normal Range displayed, Auto-highlight if abnormal
- Buttons: Save Draft, Submit & Verify

**Lab Technician → Reports** (`/dashboard/lab-technician/reports`)
- Verified reports list with View/Print button

**Hospital → Lab → Lab Reports** (`/dashboard/hospital/lab/reports`)
- All lab reports with filters, can view/verify

**Doctor → Lab Results** (add to doctor sidebar and pages)
- Sidebar add: `{ label: 'Lab Results', href: '/dashboard/doctor/lab-results', icon: FlaskConical }`
- Page: List of verified reports for this doctor's patients, click to view detail

---

## PHASE 3: INVENTORY MANAGEMENT

### Phase 3A: INVENTORY ITEM MASTER

#### New Model

**InventoryItem:**
```
model InventoryItem {
  id              String   @id @default(cuid())
  hospitalId      String
  name            String              // "Paracetamol 500mg", "IV Set", "Surgical Gloves"
  category        String   @default("")   // "Medicine", "Consumable", "Equipment", "PPE", " disinfectant"
  genericName     String   @default("")   // "Paracetamol"
  manufacturer    String   @default("")
  batchNo         String   @default("")
  expiryDate      DateTime?
  unit            String   @default("")   // "Tablet", "Bottle", "Box", "Pair", "Piece", "Pack"
  unitPrice       Float    @default(0)
  sellingPrice    Float    @default(0)
  currentStock    Float    @default(0)
  minStockLevel   Float    @default(10)   // alert threshold
  maxStockLevel   Float    @default(1000)
  reorderQty      Float    @default(100)  // suggested reorder quantity
  hsnCode         String   @default("")   // for GST
  gstPercent      Float    @default(0)
  storeLocation   String   @default("")   // "Store Room A", "Pharmacy Shelf 3"
  status          String   @default("Active") // Active, Inactive, Expired
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  hospital        Hospital        @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  stockMovements  StockMovement[]
  purchaseItems   PurchaseOrderItem[]
}
```

#### API Routes

**1. POST /api/inventory-items** — Create item
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Body: `{ name, category, genericName, manufacturer, batchNo, expiryDate, unit, unitPrice, sellingPrice, minStockLevel, maxStockLevel, reorderQty, hsnCode, gstPercent, storeLocation }`
- Auto-set hospitalId, currentStock=0
- Return: created item

**2. GET /api/inventory-items** — List items
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')` or `requireRole(req, 'pharmacist')`
- Query: `?category=Medicine&status=Active&search=term&lowStock=true`
- Return: paginated array with lowStock flag (currentStock < minStockLevel)

**3. PUT /api/inventory-items/[id]** — Update item
- Auth: `requireRole(req, 'hospital')`
- Body: same as create fields
- Return: updated item

**4. DELETE /api/inventory-items/[id]** — Soft delete (status=Inactive)
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`

#### Dashboard Pages

**Hospital → Inventory → Item Master** (`/dashboard/hospital/inventory/items`)
- Sidebar add for hospital:
```
{ label: 'Inventory', href: '/dashboard/hospital/inventory', icon: Package, children: [
  { label: 'Item Master', href: '/dashboard/hospital/inventory/items', icon: ListOrdered },
  { label: 'Stock Movements', href: '/dashboard/hospital/inventory/stock', icon: ArrowRightLeft },
  { label: 'Purchase Orders', href: '/dashboard/hospital/inventory/purchase-orders', icon: ShoppingCart },
  { label: 'Low Stock Alerts', href: '/dashboard/hospital/inventory/low-stock', icon: AlertTriangle },
] },
```
- Add import for `Package, ShoppingCart, AlertTriangle` from lucide-react in sidebar-config.ts
- `client.tsx`:
  - Filter bar: category (Select), status, search
  - Table: Name, Category, Batch, Unit, Unit Price, Current Stock, Min Stock (red if below), Actions
  - Add Item dialog: full form
  - Low stock items highlighted with red badge

### Phase 3B: STOCK MOVEMENTS

#### New Model

**StockMovement:**
```
model StockMovement {
  id              String   @id @default(cuid())
  hospitalId      String
  itemId          String
  movementType    String              // "Purchase", "Sale", "Issue", "Return", "Transfer", "Adjustment", "Expired", "Damaged"
  quantity        Float    @default(0)    // positive for in, negative for out
  referenceNo     String   @default("")   // PO number, bill number, etc.
  fromLocation    String   @default("")
  toLocation      String   @default("")
  notes           String   @default("")
  movedBy         String              // User.id
  createdAt       DateTime @default(now())

  hospital        Hospital      @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  item            InventoryItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
}
```

#### API Routes

**1. POST /api/stock-movements** — Record stock movement
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'pharmacist')`
- Body: `{ itemId, movementType, quantity, referenceNo, fromLocation, toLocation, notes }`
- Logic:
  1. Create StockMovement
  2. Update InventoryItem.currentStock += quantity (for purchase/return) or -= Math.abs(quantity) (for sale/issue/transfer/damage)
  3. If movementType === "Expired": also set item status = "Expired"
- Return: created movement with updated stock

**2. GET /api/stock-movements** — List movements
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?itemId=&movementType=Purchase&fromDate=&toDate=`
- Return: paginated list with itemName, movementType, quantity, stockBefore, stockAfter, date

**3. GET /api/stock-movements/item/[itemId]** — Stock history for an item
- Auth: `getAuthUser(req)`
- Return: all movements for this item with running balance

**4. GET /api/stock-movements/summary** — Stock summary
- Auth: `requireRole(req, 'hospital')`
- Query: `?category=Medicine`
- Return: `{ totalItems, totalValue, lowStockCount, expiredCount, categoryBreakdown: [{category, count, value}] }`

#### Dashboard Pages

**Hospital → Inventory → Stock Movements** (`/dashboard/hospital/inventory/stock`)
- Filter: Item search, movement type (Select), date range
- Table: Date, Item Name, Type (badge with color), Qty, Reference, Location, Notes, By
- Stock card at top: Total Items, Total Value, Low Stock (red), Expired (red)

### Phase 3C: PURCHASE ORDERS

#### New Models

**PurchaseOrder:**
```
model PurchaseOrder {
  id              String   @id @default(cuid())
  poNumber        String   @default("")  // "PO-2026-000001"
  hospitalId      String
  supplierName    String   @default("")
  supplierContact String   @default("")
  supplierAddress String   @default("")
  expectedDate    DateTime?
  totalAmount     Float    @default(0)
  status          String   @default("Draft") // Draft, Sent, PartiallyReceived, Received, Cancelled
  notes           String   @default("")
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  hospital        Hospital            @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  items           PurchaseOrderItem[]
}
```

**PurchaseOrderItem:**
```
model PurchaseOrderItem {
  id              String   @id @default(cuid())
  poId            String
  inventoryItemId String
  quantity        Float    @default(0)
  unitPrice       Float    @default(0)
  total           Float    @default(0)  // quantity × unitPrice
  receivedQty     Float    @default(0)  // for partial receiving

  po              PurchaseOrder @relation(fields: [poId], references: [id], onDelete: Cascade)
  item            InventoryItem  @relation(fields: [inventoryItemId], references: [id])
}
```

#### API Routes

**1. POST /api/purchase-orders** — Create PO
- Auth: `requireRole(req, 'hospital')`
- Body: `{ supplierName, supplierContact, supplierAddress, expectedDate, notes, items: [{inventoryItemId, quantity, unitPrice}] }`
- Logic: Create PO + items, auto-generate poNumber, calculate totals
- Return: created PO with items

**2. GET /api/purchase-orders** — List POs
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?status=&supplier=&fromDate=&toDate=`
- Return: paginated list

**3. PUT /api/purchase-orders/[id]/receive** — Receive PO items (full or partial)
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'pharmacist')`
- Body: `{ items: [{poItemId, receivedQty}] }`
- Logic:
  1. Update each PurchaseOrderItem.receivedQty
  2. Create StockMovement (type="Purchase") for each received item
  3. Update InventoryItem.currentStock += receivedQty for each
  4. If all items fully received: PO status = "Received", else "PartiallyReceived"
- Return: updated PO

**4. DELETE /api/purchase-orders/[id]** — Cancel PO
- Auth: `requireRole(req, 'hospital')`
- Logic: Set status="Cancelled" (only if Draft or Sent)

#### Dashboard Pages

**Hospital → Inventory → Purchase Orders** (`/dashboard/hospital/inventory/purchase-orders`)
- Table: PO No, Supplier, Items Count, Total, Status (badge), Expected Date, Actions
- Create PO: Dialog with supplier details + item rows (search inventory items, add qty + price)
- Receive PO: Dialog showing items with received qty inputs

### Phase 3D: LOW STOCK ALERTS

#### API Routes

**1. GET /api/inventory/low-stock** — Get low stock items
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Return: items where currentStock <= minStockLevel, sorted by (currentStock/minStockLevel) ascending
- Each item: name, currentStock, minStockLevel, reorderQty, lastPurchaseDate

**2. GET /api/inventory/expiring-soon** — Items expiring in next 30 days
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'pharmacist')`
- Return: items where expiryDate is within 30 days and currentStock > 0

#### Dashboard Pages

**Hospital → Inventory → Low Stock Alerts** (`/dashboard/hospital/inventory/low-stock`)
- Table: Item Name, Category, Current Stock, Min Stock, Reorder Qty, Status (Critical/Warning/OK)
- Color coding: Critical (red, stock < 25% of min), Warning (orange, stock < 75% of min)
- Quick "Create PO" button that pre-fills low stock items
- Expiring Soon section: items expiring within 30/60/90 days

**Hospital Dashboard** — Add low stock alert count badge on Inventory sidebar item

---

## PHASE 2 + 3 COMPLETE CHECKLIST

- [ ] LabTestMaster + LabTestParameter models added
- [ ] LabTechnician model added
- [ ] LabReport + LabParameterValue models added
- [ ] InventoryItem model added
- [ ] StockMovement model added
- [ ] PurchaseOrder + PurchaseOrderItem models added
- [ ] IpdAdmission model modified (labReports relation not needed — use hospital relation)
- [ ] Hospital model modified (all new relations)
- [ ] User model modified (labTechnicianProfile)
- [ ] `bun run db:push` successful
- [ ] Lab tech role added to api-auth.ts DEV_USERS
- [ ] Lab tech sidebar added
- [ ] Hospital sidebar updated (Lab + Inventory sections)
- [ ] Doctor sidebar updated (Lab Results)
- [ ] Lab Test Master CRUD (4 APIs + 2 pages)
- [ ] Lab Tech role setup (3 APIs + 2 pages)
- [ ] Lab Worklist + Result Entry (5 APIs + 3 pages)
- [ ] Lab Report View + Print (2 APIs + 3 pages)
- [ ] Inventory Item Master (4 APIs + 1 page)
- [ ] Stock Movements (4 APIs + 1 page)
- [ ] Purchase Orders (4 APIs + 1 page)
- [ ] Low Stock Alerts (2 APIs + 1 page)
- [ ] No TypeScript errors
- [ ] `bun run lint` passes
