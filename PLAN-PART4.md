# PLAN PART 4 — PRINT SYSTEM + FAMILY PORTAL + WEBSOCKET + POLISH (P2/P3)

## PHASE 6: PRINT SYSTEM (P2)

### Phase 6A: PRINT TEMPLATES

All print views use a shared CSS class system. No external print library needed — use `window.print()` with `@media print` CSS.

#### Print CSS System (`src/styles/print.css`)
```css
@media print {
  body * { visibility: hidden; }
  .print-area, .print-area * { visibility: visible; }
  .print-area { position: absolute; left: 0; top: 0; width: 210mm; min-height: 297mm; padding: 15mm 20mm; }
  .no-print { display: none !important; }
  @page { size: A4; margin: 5mm; }
}
```

#### Print Layout Component (`src/components/shared/PrintLayout.tsx`)
- Props: `{ children, title, showPrintButton?: boolean }`
- Wrapper with `print-area` class
- Hospital header: logo, name, address, phone (fetched from hospital context)
- Line separator
- Children content
- Footer: "Generated on {date} | Hospital Management System"
- Print button (hidden in print via `no-print` class)
- Uses `onBeforePrint` / `onAfterPrint` for loading states

### All Print Templates (8 total)

**1. IPD Bill Print** (`src/components/print/IpdBillPrint.tsx`)
- Route: Opened from IPD Bill Detail page
- Data: Full IpdBill with lineItems, payments, admission, patient, hospital
- Layout:
  - Header: Hospital name, address, logo, phone
  - Title: "IPD BILL"
  - Patient info row: Name, Age/Gender, Admission No, Ward-Bed, Admit Date
  - Attending Doctor, Referring Doctor
  - Line Items Table: S.No, Item, Category, Qty, Rate, Amount, Tax%, Tax, Total
  - Summary section: Subtotal, Tax, Discount, Total, Advance Adjusted, Net Payable
  - Payment History: Receipt No, Date, Amount, Method
  - Footer: Authorized Signatory, Patient Signature

**2. OPD Bill Print** (`src/components/print/OpdBillPrint.tsx`)
- Route: From OPD Bill detail
- Data: OpdBill with booking, patient, doctor, hospital
- Layout:
  - Hospital header
  - Title: "OPD BILL / RECEIPT"
  - Receipt No, Date
  - Patient: Name, Age/Gender
  - Doctor: Name, Department
  - Charges table: Consultation Fee, Lab Charges, Medicine, Other, Tax, Discount, Total
  - Payment: Method, Reference
  - Footer

**3. Advance Deposit Receipt** (`src/components/print/AdvanceReceiptPrint.tsx`)
- Data: PatientAdvance with admission, patient, hospital
- Layout: Hospital header, "ADVANCE DEPOSIT RECEIPT", Receipt No, Date, Patient Name, Admission No, Amount (in words + figures), Payment Method, Reference, Received By signature

**4. Payment Receipt** (`src/components/print/PaymentReceiptPrint.tsx`)
- Data: BillPayment with bill, admission, patient, hospital
- Layout: Hospital header, "PAYMENT RECEIPT", Receipt No, Date, Patient, Bill No, Total Bill, Previously Paid, This Payment, Balance, Payment Method

**5. Discharge Summary** (`src/components/print/DischargeSummaryPrint.tsx`)
- Data: IpdAdmission with all details — demographics, diagnosis, treatment, vitals summary, doctor orders, medications on discharge, follow-up
- Layout (this is a medical document, detailed):
  - Hospital header
  - Title: "DISCHARGE SUMMARY"
  - Patient demographics block
  - Admission: Date, Ward/Bed, Attending Doctor
  - Chief Complaints
  - History
  - Examination Findings
  - Investigations (summary table)
  - Treatment Given
  - Surgery (if any): OT date, surgery name, findings
  - Condition at Discharge
  - Final Diagnosis
  - Medications at Discharge (table)
  - Follow-up: Date, Doctor, Instructions
  - Diet Advice
  - Emergency Instructions
  - Signature: Attending Doctor, Resident, Patient/Relative

**6. Prescription Print** (already exists but enhance)
- Enhance existing `POtherSetting` print layout
- Add: Hospital header option, QR code placeholder, footer

**7. Lab Report Print** (`src/components/print/LabReportPrint.tsx`)
- Data: LabReport with testMaster, parameterValues, patient, hospital
- Layout:
  - Hospital header + Lab name section
  - Title: "LABORATORY REPORT"
  - Patient: Name, Age, Gender, Sample Type
  - Doctor: Name
  - Test Name, Report No, Date
  - Parameters table: S.No, Test Name, Result, Unit, Normal Range, Flag (H/L/—)
  - Abnormal values highlighted in bold/red
  - Footer: Collected At, Reported At, Verified By, Signature

**8. Lab Report Consolidated** (multiple tests on one page)
- Accept array of LabReport objects
- Print all verified reports for a patient on one A4 sheet (if they fit)
- Separate sections per test

### Phase 6B: A4 CSS PRINT ENGINE

#### Shared Print Utilities (`src/lib/print-utils.ts`)
```typescript
export function triggerPrint() {
  window.print()
}

export function numberToWords(amount: number): string {
  // Convert number to Indian currency words (e.g., "Fifteen Thousand Four Hundred Fifty Rupees Only")
  // Implement using a standard number-to-words function
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
}

export function formatDate(date: Date | string): string {
  return dateFns.format(new Date(date), 'dd/MM/yyyy')
}
```

#### Print Page Route Pattern
- No separate routes needed for print views
- Each print component is used as a dialog/page content triggered from the parent page
- Pattern: Parent page has "Print" button → opens a fullscreen dialog (or new tab) with print component → auto-triggers `window.print()` or shows print button

#### Sidebar Changes
Add to hospital and receptionist:
```
{ label: 'Discharge Summary', href: '/dashboard/hospital/discharge-summaries', icon: FileText },
```

#### API for Discharge Summaries
**GET /api/discharge-summaries** — List discharged patients with summaries
- Auth: `requireRole(req, 'hospital')` or `requireRole(req, 'admin')`
- Query: `?fromDate=&toDate=&doctorId=`
- Return: discharged admissions with patientName, admissionNo, dischargeDate, dischargeType, finalDiagnosis, doctorName

**Dashboard Page:**
**Hospital → Discharge Summaries** (`/dashboard/hospital/discharge-summaries`)
- Table: Admission No, Patient, Admit Date, Discharge Date, Days Stayed, Diagnosis, Doctor, Discharge Type, Actions (View/Print)
- View opens DischargeSummaryPrint component

---

## PHASE 7: FAMILY / ATTENDANT PORTAL (P3)

### Phase 7A: FAMILY PORTAL ACCESS

#### New Model

**FamilyAccess:**
```
model FamilyAccess {
  id              String   @id @default(cuid())
  admissionId     String   @unique  // one access code per admission
  hospitalId      String
  accessCode      String   @unique           // 6-digit alphanumeric code, e.g., "AB3K7M"
  patientName     String   @default("")
  relationName    String   @default("")      // "Father of patient", "Wife"
  relationMobile  String   @default("")
  isActive        Boolean  @default(true)
  canViewVitals   Boolean  @default(true)
  canViewDiet     Boolean  @default(true)
  canViewBill     Boolean  @default(true)
  allowedPages    String   @default("[\"status\",\"vitals\",\"diet\"]") // JSON array of allowed page slugs
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  admission       IpdAdmission @relation(fields: [admissionId], references: [id])
  hospital        Hospital      @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
}
```

#### IpdAdmission modification
```
  familyAccess     FamilyAccess?
```

#### API Routes

**1. POST /api/family-access/generate** — Generate access code for family
- Auth: `requireRole(req, 'receptionist')` or `requireRole(req, 'hospital')`
- Body: `{ admissionId, relationName, relationMobile, canViewVitals, canViewDiet, canViewBill }`
- Logic:
  1. Generate random 6-char alphanumeric code (ensure unique)
  2. Create FamilyAccess record
  3. Auto-fill patientName from admission
- Return: `{ accessCode, shareableLink: "/family/{accessCode}" }`

**2. GET /api/family-access/[accessCode]** — Public endpoint (no auth!) for family portal
- Auth: NONE (public route)
- Logic:
  1. Find FamilyAccess by accessCode
  2. Validate isActive = true
  3. Return: admission info (patientName, ward, bed, admitDate, attendingDoctor, status) + allowedPages + vitals data (if canViewVitals) + diet orders (if canViewDiet) + bill summary (if canViewBill)
  4. DO NOT return: full diagnosis, investigation details, doctor notes, contact info, other patients
- Return: public-safe data

**3. PUT /api/family-access/[id]/revoke** — Revoke access
- Auth: `requireRole(req, 'receptionist')` or `requireRole(req, 'hospital')`
- Logic: Set isActive = false
- Return: success

#### Dashboard Pages

**Receptionist → Family Access** (add to sidebar)
```
{ label: 'Family Access', href: '/dashboard/receptionist/family-access', icon: Users },
```

**Receptionist → Family Access** (`/dashboard/receptionist/family-access`)
- Table: Patient Name, Admission No, Access Code (copyable), Relation, Mobile, Status, Actions
- Generate button: Dialog — select admission, enter relation details, toggle permissions
- Revoke button per row (confirmation dialog)
- Share button: copies shareable link to clipboard

### Phase 7B: PUBLIC STATUS PAGE

This is a PUBLIC page (no login required) where family members enter the access code to see patient status.

#### Route: `/family/[accessCode]` (PUBLIC — NOT under /dashboard)

**`src/app/family/[accessCode]/page.tsx`** — Server component
- Fetch family access data using public API
- If invalid/expired: show "Invalid or expired access code" message
- If valid: render FamilyStatusClient

**`src/app/family/[accessCode]/client.tsx`** — Client component
- Clean, simple, mobile-friendly design (family may be on mobile)
- Header: Hospital name, "Patient Status Portal"
- Patient info card: Name, Ward, Bed, Admission Date, Attending Doctor
- Tab/section: Current Status (Admitted/Discharged)
- If canViewVitals: Latest vitals (BP, Pulse, Temp, SpO2) — last recorded
- If canViewDiet: Current diet orders
- If canViewBill: Bill summary (Total, Advance, Payable) — no detailed line items
- Footer: "For updates, contact reception: {hospital phone}"
- Refresh button (pulls latest data)
- NO sidebar, NO dashboard layout — this is a standalone page
- Auto-refresh every 30 seconds using TanStack Query refetchInterval

---

## PHASE 8: WEBSOCKET + REAL-TIME + MOBILE POLISH (P3)

### Phase 8A: WEBSOCKET SERVICE (Mini Service)

Create `mini-services/notification-service/index.ts`

#### Tech
- Socket.io server on port 3005
- Bun project with own package.json
- Hot reload with `bun --hot`

#### Architecture
```
mini-services/notification-service/
  index.ts          // Socket.io server
  package.json      // { dependencies: { socket.io } }
```

#### Server Logic
```typescript
import { Server } from 'socket.io'

const io = new Server({
  cors: { origin: '*' }
})

io.on('connection', (socket) => {
  // Join room by userId
  socket.on('join', (userId: string) => {
    socket.join(`user:${userId}`)
  })

  // Join room by role
  socket.on('join-role', (role: string) => {
    socket.join(`role:${role}`)
  })

  // Join room by hospital
  socket.on('join-hospital', (hospitalId: string) => {
    socket.join(`hospital:${hospitalId}`)
  })
})

// Export function to send notifications
export function sendToUser(userId: string, event: string, data: any) {
  io.to(`user:${userId}`).emit(event, data)
}

export function sendToRole(role: string, event: string, data: any) {
  io.to(`role:${role}`).emit(event, data)
}

export function sendToHospital(hospitalId: string, event: string, data: any) {
  io.to(`hospital:${hospitalId}`).emit(event, data)
}

io.listen(3005)
console.log('Notification service running on port 3005')
```

#### Client Hook (`src/hooks/useSocket.ts`)
```typescript
'use client'
import { io, Socket } from 'socket.io-client'
import { useEffect, useRef } from 'react'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    socketRef.current = io('/?XTransformPort=3005')
    return () => { socketRef.current?.disconnect() }
  }, [])

  return socketRef.current
}
```

#### Usage Pattern in API routes
When an event happens (new admission, bill generated, sample collected, etc.), the API route should call the notification service:
```typescript
// In API route after creating a record:
try {
  await fetch(`http://localhost:3005/emit`, {
    method: 'POST',
    body: JSON.stringify({ target: 'user', id: userId, event: 'new-notification', data: { title: '...', message: '...' } })
  })
} catch { /* non-blocking */ }
```

Add an HTTP endpoint on the notification service for API routes to trigger emits:
```typescript
// In notification-service/index.ts, add:
import { createServer } from 'http'
const httpServer = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/emit') {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      const { target, id, event, data } = JSON.parse(body)
      if (target === 'user') sendToUser(id, event, data)
      else if (target === 'role') sendToRole(id, event, data)
      else if (target === 'hospital') sendToHospital(id, event, data)
      res.writeHead(200)
      res.end('ok')
    })
  }
})
```

### Phase 8B: REAL-TIME NOTIFICATIONS

#### Events to emit via WebSocket

| Event | Target | Trigger |
|-------|--------|--------|
| `new-admission` | hospital, role:nurse | IPD admission created |
| `vital-recorded` | role:doctor, user:attendingDoctorId | New vital record for their patient |
| `sample-ordered` | role:lab_technician | New sample collection ordered |
| `lab-result-ready` | user:doctorId | Lab report verified for their patient |
| `bill-generated` | user:receptionist, role:hospital | IPD bill generated/finalized |
| `payment-received` | role:hospital | Payment collected |
| `discharge-advised` | user:receptionist, role:hospital | Doctor advises discharge |
| `ot-scheduled` | role:hospital, user:surgeonId | New OT schedule |
| `low-stock-alert` | role:hospital | Inventory item below min stock |
| `new-notification` | specific userId | Generic notification (maps to Notification model) |

#### Client Notification Component (`src/components/shared/RealtimeNotification.tsx`)
- Uses `useSocket` hook
- Listens for events relevant to logged-in user's role
- Shows toast notifications (sonner) for each event
- Updates notification badge count
- Sound notification option (optional, can use Web Audio API beep)

#### Notification Bell Enhancement
- Existing Notification model and page exists
- Add: real-time badge count via WebSocket
- Add: mark-as-read API if not exists: `PUT /api/notifications/[id]/read`
- Add: mark-all-read: `PUT /api/notifications/read-all`

### Phase 8C: MOBILE OPTIMIZATION + PWA

#### PWA Setup
- Create `public/manifest.json` with app name, icons, theme color
- Add `<link rel="manifest">` to layout
- Create `src/app/sw.ts` (service worker) — basic caching
- Use `next-pwa` or manual service worker registration

#### Mobile Optimizations
1. **Touch targets**: All interactive elements minimum 44px
2. **Bottom navigation**: For nurse and pharmacist roles, add optional bottom tab bar for most-used actions (replaces sidebar on mobile)
3. **Swipe gestures**: Framer Motion drag for dismissing notifications, cards
4. **Responsive tables**: All DataTable components use horizontal scroll on mobile or convert to card layout
5. **Large fonts**: Increase base font size on mobile (`text-base` minimum for body text)
6. **Quick actions**: Floating Action Button (FAB) for common actions (add new record)
7. **Offline indicator**: Show "You are offline" banner when no network
8. **Optimistic updates**: TanStack Query `onMutate` for immediate UI feedback

#### Mobile-Specific Components
- `MobileCard.tsx` — Replaces table rows on mobile with card layout
- `BottomNav.tsx` — Bottom tab navigation for mobile (nurse, pharmacist, lab tech)
- `SwipeableItem.tsx` — Swipe to reveal actions (delete, edit)
- `PullToRefresh.tsx` — Pull down to refresh data

### Phase 8D: ADMIN SETTINGS POLISH

#### API Routes

**1. GET /api/admin/settings** — Get all admin settings
- Auth: `requireRole(req, 'admin')`
- Return: `{ hospitalName, hospitalAddress, hospitalPhone, hospitalEmail, hospitalLogo, hospitalGstNo, hospitalRegNo, currency, dateFormat, timezone }`
- Store in a simple settings table or JSON file

**2. PUT /api/admin/settings** — Update admin settings
- Auth: `requireRole(req, 'admin')`
- Body: same fields as above
- Logic: Store settings (can use a simple Settings model or a JSON file)

#### New Model (optional, or use file-based)
```
model SystemSettings {
  id    String @id @default("main")
  key   String @unique
  value String @default("")
}
```

Or simpler: use a single row approach:
```
model SystemSettings {
  id                String @id @default("singleton")
  hospitalName      String @default("")
  hospitalAddress   String @default("")
  hospitalPhone     String @default("")
  hospitalEmail     String @default("")
  hospitalLogo      String @default("")
  hospitalGstNo     String @default("")
  hospitalRegNo     String @default("")
  currency          String @default("INR")
  dateFormat        String @default("DD/MM/YYYY")
  timezone          String @default("Asia/Kolkata")
  updatedAt         DateTime @updatedAt
}
```

#### Dashboard Pages

**Admin → Settings** (enhance existing)
- Sections:
  1. **Hospital Info**: Name, Address, Phone, Email, Logo upload, GST No, Registration No
  2. **Regional**: Currency, Date Format, Timezone
  3. **Billing**: Default tax %, Auto-bill on discharge toggle, Receipt footer text
  4. **Lab**: Default TAT hours, Auto-verify threshold, Report header text
  5. **Inventory**: Low stock alert %, Auto-reorder toggle, Default GST %
  6. **Notifications**: Enable/disable notification types, Sound toggle
  7. **Appearance**: Theme (light/dark), Primary color picker
- All settings saved via PUT /api/admin/settings

---

## PHASE 6 + 7 + 8 COMPLETE CHECKLIST

- [ ] print.css created with @media print rules
- [ ] PrintLayout component created
- [ ] print-utils.ts created (numberToWords, formatCurrency, formatDate)
- [ ] IpdBillPrint component
- [ ] OpdBillPrint component
- [ ] AdvanceReceiptPrint component
- [ ] PaymentReceiptPrint component
- [ ] DischargeSummaryPrint component
- [ ] Prescription print enhanced
- [ ] LabReportPrint component
- [ ] LabReportConsolidatedPrint component
- [ ] FamilyAccess model added to schema
- [ ] IpdAdmission modified (familyAccess)
- [ ] `bun run db:push` successful
- [ ] Family access generate API
- [ ] Family access public API (no auth)
- [ ] Family access revoke API
- [ ] Family Access management page (receptionist)
- [ ] Public family portal page (`/family/[accessCode]`)
- [ ] Family portal auto-refresh every 30s
- [ ] Notification service mini-service created (port 3005)
- [ ] notification-service started via `bun run dev`
- [ ] useSocket hook created
- [ ] Real-time notification component created
- [ ] WebSocket events integrated in key API routes
- [ ] Notification bell real-time badge
- [ ] mark-as-read APIs created
- [ ] PWA manifest.json created
- [ ] Service worker basic setup
- [ ] Mobile touch targets verified (min 44px)
- [ ] Responsive tables / mobile card layouts
- [ ] Bottom nav for mobile (nurse, pharmacist, lab tech)
- [ ] SystemSettings model added
- [ ] Admin Settings API (GET + PUT)
- [ ] Admin Settings page enhanced with all sections
- [ ] Sidebar entries updated (Family Access, Discharge Summaries)
- [ ] No TypeScript errors
- [ ] `bun run lint` passes

---

## 🏁 FINAL PROJECT CHECKLIST (ALL PHASES)

### Schema Summary
- Total existing models: 50+
- New models added: ~25
- Total models after completion: ~75+

### API Routes Summary
- Existing: ~90+
- New: ~80+
- Total: ~170+

### Pages Summary
- Existing: ~75+
- New: ~40+
- Total: ~115+

### Roles
- Existing 8: admin, doctor, patient, hospital, receptionist, assistant, pharmacist, nurse
- New 1: lab_technician
- Total: 9 roles

### Key Integration Points
1. Billing connects to IPD Admissions, Bookings
2. Lab connects to IPD (admissions) and OPD (bookings)
3. Inventory connects to Billing (purchase costs) and IPD (consumables)
4. OT connects to IPD Admissions and Doctors
5. Reports aggregate data from all modules
6. Print System renders data from all modules
7. Family Portal reads selective IPD data
8. WebSocket broadcasts events from all modules
9. Admin Settings configures defaults for all modules

### Architecture Decisions
- All new roles added to `api-auth.ts` DEV_USERS
- All sidebar entries added to `sidebar-config.ts`
- WebSocket as mini-service on port 3005
- Print system uses native CSS @media print + window.print()
- Family portal is a public route (no auth)
- Reports use Prisma aggregations (no separate analytics DB)
- Number-to-words utility for Indian currency format
- PWA for mobile install capability
