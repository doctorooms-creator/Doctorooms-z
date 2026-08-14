# PLAN — 7 CRITICAL GAPS FIX ARCHITECTURE

> **Status**: Awaiting Development  
> **Priority**: CRITICAL — Security, Data Integrity, and System Functionality  
> **Estimated Effort**: Gap 1 (Large) | Gap 2 (Tiny) | Gap 3 (Large) | Gap 4 (Medium) | Gap 5 (Medium) | Gap 6 (Medium) | Gap 7 (Small)  
> **Dependency Order**: Gap 6 → Gap 4 → Gap 1 → Gap 2 → Gap 3 → Gap 5 → Gap 7

---

## ARCHITECTURE DECISIONS

### A1. Validation Library: Zod
- `zod` v4.0.2 already installed in `package.json`
- `react-hook-form` + `@hookform/resolvers/zod` also installed
- **Decision**: Create centralized zod schemas in `src/lib/validations/`, use in both API routes (server-side) and forms (client-side)

### A2. Emit Helper: Fire-and-Forget
- Create `src/lib/emit-notification.ts` as a single-point helper
- Use `fetch()` with no `await` — fire-and-forget pattern inside `.catch(() => {})`
- Never let notification failures block business logic

### A3. Pagination Pattern: Unified Cursor
- Use existing `ipd-bills` pagination pattern as the standard: `{ page, limit, total, totalPages, data }`
- Query params: `?page=1&limit=20&search=&status=`
- Apply to all unbounded list endpoints

### A4. Session Security: Phased Approach
- Phase 1 (this plan): Add production guards + httpOnly role cookie + deduplicate DEV_USERS
- Phase 2 (future): Replace session=userId with random session tokens in DB
- Phase 3 (future): Add Next.js middleware for route-level auth

### A5. Schema Safety: Restrict > Cascade
- For critical parent records (Hospital, Ward, Bed, IpdAdmission) → use `onDelete: Restrict`
- For child records (BillLineItem, Notification) → use `onDelete: Cascade`
- Never silently delete parent records that have active children

---

## GAP 1: WEBSOCKET NOTIFICATION INTEGRATION
### Problem
Notification service (port 3005) runs, client hooks/components listen, but **zero API routes emit events**. The entire real-time stack is wired but inert.

### Architecture

```
┌─────────────────┐     ┌──────────────────────────┐     ┌──────────────────┐
│  API Route      │────>│ src/lib/emit-notification│────>│ notification-svc │
│  (POST/PUT)     │     │ (fire-and-forget fetch)  │     │ :3005 POST /emit │
└─────────────────┘     └──────────────────────────┘     └──────────────────┘
                                                              │
                                                         ┌────┴────┐
                                                         │Socket.io│
                                                         └────┬────┘
                                                              │
                                                    ┌─────────┴─────────┐
                                                    │ RealtimeNotif.   │
                                                    │ (layout.tsx)     │
                                                    └───────────────────┘
```

### Step 1.1: Create Emit Helper
**File**: `src/lib/emit-notification.ts` (NEW)

```typescript
// Signature:
export function emitNotification(event: EventType, rooms: string[], payload: Record<string, unknown>): void

// Implementation:
// - Validates event against VALID_EVENTS array
// - Does fetch('http://localhost:3005/emit', { method: 'POST', body: JSON.stringify(...) })
// - Wrapped in try/catch — never throws
// - No await — fire and forget

// Event type:
type EventType = 'new-admission' | 'vital-recorded' | 'sample-ordered' | 
  'lab-result-ready' | 'bill-generated' | 'payment-received' | 
  'discharge-advised' | 'ot-scheduled' | 'low-stock-alert'
```

### Step 1.2: Add Emit Calls to 18 API Routes

For each route, add **ONE line** after the successful DB write:
```typescript
emitNotification('event-name', ['role:xxx', 'hospital:{hospitalId}'], { ...data })
```

| # | File | Line (approx) | Event | Rooms |
|---|------|---------------|-------|-------|
| 1 | `api/dashboard/receptionist/ipd/admit/route.ts` | After `db.ipdAdmission.create` | `new-admission` | `role:receptionist`, `role:nurse`, `hospital:{hId}` |
| 2 | `api/dashboard/nurse/patients/[admissionId]/vitals/route.ts` | After `db.vitalRecord.create` | `vital-recorded` | `role:doctor`, `hospital:{hId}` |
| 3 | `api/lab-reports/route.ts` | After `db.labReport.create` | `sample-ordered` | `role:lab_technician`, `hospital:{hId}` |
| 4 | `api/lab-reports/[id]/collect-sample/route.ts` | After status update | `sample-ordered` | `role:lab_technician` |
| 5 | `api/lab-reports/[id]/enter-result/route.ts` | After result save | `lab-result-ready` | `role:doctor`, `hospital:{hId}` |
| 6 | `api/lab-reports/[id]/verify/route.ts` | After status → Verified | `lab-result-ready` | `role:doctor`, `hospital:{hId}` |
| 7 | `api/ipd-bills/route.ts` | After `db.ipdBill.create` | `bill-generated` | `role:receptionist`, `role:hospital` |
| 8 | `api/ipd-bills/generate/route.ts` | After bill generation | `bill-generated` | `role:receptionist`, `role:hospital` |
| 9 | `api/opd-bills/route.ts` | After `db.opdBill.create` | `bill-generated` | `role:receptionist`, `role:hospital` |
| 10 | `api/bill-payments/route.ts` | After `db.billPayment.create` | `payment-received` | `role:receptionist`, `role:hospital` |
| 11 | `api/patient-advances/route.ts` | After `db.patientAdvance.create` | `payment-received` | `role:receptionist`, `role:hospital` |
| 12 | `api/ipd-admissions/[id]/discharge/route.ts` | After dischargeAdvised=true | `discharge-advised` | `role:receptionist`, `role:nurse`, `role:hospital` |
| 13 | `api/ipd-admissions/[id]/complete-discharge/route.ts` | After status→Discharged | `discharge-advised` | `role:receptionist`, `role:hospital` |
| 14 | `api/ot-schedules/route.ts` | After `db.otSchedule.create` | `ot-scheduled` | `role:doctor`, `role:nurse`, `role:hospital` |
| 15 | `api/stock-movements/route.ts` | After movement, if stock < minStock | `low-stock-alert` | `role:hospital`, `role:pharmacist` |
| 16 | `api/inventory-items/[id]/route.ts` PUT | After stock update, if < minStock | `low-stock-alert` | `role:hospital`, `role:pharmacist` |
| 17 | `api/bed-transfers/route.ts` | After `db.bedTransfer.create` | `new-admission` | `role:nurse`, `hospital:{hId}` |
| 18 | `api/ipd-bills/[id]/finalize/route.ts` | After finalization | `bill-generated` | `role:receptionist`, `role:hospital` |

### Step 1.3: Emit Payload Standard
Each emit payload should include:
```typescript
{
  id: '<record-id>',           // Primary key of the created/updated record
  title: '<human-readable>',    // e.g. "New IPD Admission: John Doe"
  message: '<detail>',           // e.g. "Patient admitted to Ward A, Bed 104"
  timestamp: new Date().toISOString(),
  // Entity-specific fields:
  admissionId?: string,
  patientName?: string,
  doctorId?: string,
  hospitalId?: string,
}
```

### Testing Strategy
- Emit events should NOT block or slow down API responses
- If notification service is down, API routes should still work normally
- Verify via browser: open two tabs with different roles, trigger an action in one, see toast in other

---

## GAP 2: DEV-LOGIN PRODUCTION GUARD
### Problem
`/api/dev-login` is a full backdoor — anyone can become admin. No `NODE_ENV` check exists.

### Fix (5 lines)
**File**: `src/app/api/dev-login/route.ts`

**Change**: Add guard at the TOP of the POST handler (before line 48):
```typescript
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Not available' }, { status: 404 })
}
```

**Also update**:
- `.env.example` — Add `NODE_ENV=development` 
- `src/lib/api-auth.ts` — Wrap `DEV_USERS` fallback in `if (process.env.NODE_ENV !== 'production')`
- `src/app/api/auth/me/route.ts` — Same DEV_USERS guard

### Files Modified (3)
| File | Change |
|------|--------|
| `src/app/api/dev-login/route.ts` | Add NODE_ENV guard at line 48 |
| `src/lib/api-auth.ts` | Wrap DEV_USERS in production guard |
| `src/app/api/auth/me/route.ts` | Wrap DEV_USERS in production guard |

---

## GAP 3: AUTH SYSTEM SECURITY
### Problem
1. Session cookie = raw user ID (guessable cuid)
2. `doctorooms_role` cookie NOT httpOnly (client-side manipulable)
3. `getAuthUser()` falls back to ANY user with matching role
4. Admin bypasses ALL role checks
5. No session revocation mechanism
6. DEV_USERS duplicated in 3 files

### Step 3.1: Make Role Cookie httpOnly
**File**: `src/app/api/dev-login/route.ts` (line 90-96)
**File**: `src/app/api/auth/login/route.ts` (line 65-77)

**Change**: In both files, add `httpOnly: true` to the `doctorooms_role` cookie:
```typescript
// Before:
{ name: 'doctorooms_role', value: role, httpOnly: false, ... }
// After:
{ name: 'doctorooms_role', value: role, httpOnly: true, ... }
```

**Impact**: Client-side JS can no longer read or modify the role cookie. The role is now server-only.

### Step 3.2: Remove Admin Universal Bypass
**File**: `src/lib/api-auth.ts` (line 84)

**Change**: Remove the admin bypass line:
```typescript
// REMOVE this line:
if (user.role === 'admin') return user
```

**Rationale**: Admin should only access admin routes. If admin needs to access other role views, create explicit admin proxy routes.

### Step 3.3: Deduplicate DEV_USERS
**Current state**: DEV_USERS defined in 3 places:
1. `src/lib/api-auth.ts` (lines 99-181) — 9 users
2. `src/app/api/dev-login/route.ts` (lines 5-42) — 9 users  
3. `src/app/api/auth/me/route.ts` (lines 4-68) — 9 users

**Fix**: 
- Keep single source of truth in `src/lib/api-auth.ts`
- Export `DEV_USERS` and `getDevUser(role)`
- Import in `dev-login/route.ts` and `auth/me/route.ts`
- Delete duplicates

**Files Modified (3)**:
| File | Change |
|------|--------|
| `src/lib/api-auth.ts` | Export `DEV_USERS`, `getDevUser`. Wrap in `!production` guard |
| `src/app/api/dev-login/route.ts` | Import from `api-auth.ts`, delete local copy |
| `src/app/api/auth/me/route.ts` | Import from `api-auth.ts`, delete local copy |

### Step 3.4: Add Session Expiry Check
**File**: `src/lib/api-auth.ts`

**Change**: In `getAuthUser()`, after finding user by session ID, verify the user is still `Active`:
```typescript
if (user && user.status === 'Active') {
  return user
}
```
(Already partially done at line 37, but add explicit check in the fallback path too at line 56)

### Future Phase (NOT in this plan):
- Replace session=userId with random session tokens in a `Session` model
- Add Next.js `middleware.ts` for route-level auth
- Add session revocation on password change
- Add idle timeout tracking

---

## GAP 4: INPUT VALIDATION
### Problem
Zero zod usage across 250 API routes. Ad-hoc `if (!field)` checks are inconsistent and unsafe.

### Architecture

```
src/lib/validations/
  ├── index.ts              ← Re-exports all schemas
  ├── common.ts             ← Shared schemas (pagination, id, dates)
  ├── ipd-admission.ts      ← IPD admission create/update schemas
  ├── billing.ts            ← IPD bill, OPD bill, payment, advance schemas
  ├── lab.ts                ← Lab report, result entry, verify schemas
  ├── inventory.ts          ← Inventory item, stock movement, PO schemas
  ├── ot.ts                 ← OT schedule schema
  ├── bed.ts                ← Bed transfer schema
  └── user.ts               ← User create/update schemas
```

### Step 4.1: Create Common Schemas
**File**: `src/lib/validations/common.ts`

```typescript
// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(200).optional(),
})

// CUID validation
export const cuidSchema = z.string().cuid2()

// Date validation
export const dateSchema = z.string().datetime({ offset: true }).or(z.string().date())

// Pagination return type helper
export function parsePagination(searchParams: URLSearchParams) {
  return paginationSchema.parse(Object.fromEntries(searchParams))
}
```

### Step 4.2: Create Entity Schemas (12 files)

Each entity schema file exports:
- `createXxxSchema` — for POST routes
- `updateXxxSchema` — for PUT routes (all fields optional via `.partial()`) 
- Type exports: `CreateXxxInput`, `UpdateXxxInput`

#### Priority Schemas (by API traffic):

| # | File | Schemas | Used By |
|---|------|---------|--------|
| 1 | `billing.ts` | `createIpdBillSchema`, `createOpdBillSchema`, `createPaymentSchema`, `createAdvanceSchema` | ipd-bills, opd-bills, bill-payments, patient-advances |
| 2 | `ipd-admission.ts` | `createAdmissionSchema`, `dischargeSchema`, `completeDischargeSchema` | ipd-admissions, discharge |
| 3 | `lab.ts` | `createLabReportSchema`, `enterResultSchema`, `verifySchema` | lab-reports |
| 4 | `bed.ts` | `createBedTransferSchema` | bed-transfers |
| 5 | `ot.ts` | `createOtScheduleSchema` | ot-schedules |
| 6 | `inventory.ts` | `createItemSchema`, `createMovementSchema`, `createPurchaseOrderSchema` | inventory-items, stock-movements, purchase-orders |

#### Example: `billing.ts`
```typescript
export const createIpdBillSchema = z.object({
  admissionId: z.string().cuid2('Invalid admission ID'),
  notes: z.string().max(2000).optional(),
})

export const createPaymentSchema = z.object({
  billId: z.string().cuid2('Invalid bill ID'),
  amount: z.number().positive('Amount must be positive').max(99999999),
  paymentMethod: z.enum(['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Online']),
  paymentRef: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
})

export const createAdvanceSchema = z.object({
  admissionId: z.string().cuid2('Invalid admission ID'),
  amount: z.number().positive('Amount must be positive').max(99999999),
  paymentMethod: z.enum(['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Online']).default('Cash'),
  paymentRef: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
})
```

### Step 4.3: Create Validation Helper
**File**: `src/lib/validations/index.ts`

```typescript
// Helper to parse and return errors in NextResponse format
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): 
  | { success: true; data: T }
  | { success: false; error: NextResponse }
```

Usage in API routes:
```typescript
const parsed = validateBody(createPaymentSchema, await req.json())
if (!parsed.success) return parsed.error
const { billId, amount, paymentMethod } = parsed.data
```

### Step 4.4: Apply to POST/PUT Routes (25 routes)

Apply zod validation to the highest-traffic POST/PUT routes:

| Route File | Schema to Use |
|------------|---------------|
| `api/ipd-bills/route.ts` POST | `createIpdBillSchema` |
| `api/ipd-bills/generate/route.ts` POST | `createIpdBillSchema` |
| `api/ipd-bills/[id]/finalize/route.ts` PUT | `finalizeBillSchema` |
| `api/opd-bills/route.ts` POST | `createOpdBillSchema` |
| `api/bill-payments/route.ts` POST | `createPaymentSchema` |
| `api/patient-advances/route.ts` POST | `createAdvanceSchema` |
| `api/ipd-admissions/[id]/discharge/route.ts` POST | `dischargeSchema` |
| `api/ipd-admissions/[id]/complete-discharge/route.ts` POST | `completeDischargeSchema` |
| `api/lab-reports/route.ts` POST | `createLabReportSchema` |
| `api/lab-reports/[id]/enter-result/route.ts` PUT | `enterResultSchema` |
| `api/lab-reports/[id]/verify/route.ts` PUT | `verifySchema` |
| `api/lab-reports/[id]/collect-sample/route.ts` PUT | `collectSampleSchema` |
| `api/bed-transfers/route.ts` POST | `createBedTransferSchema` |
| `api/ot-schedules/route.ts` POST | `createOtScheduleSchema` |
| `api/stock-movements/route.ts` POST | `createMovementSchema` |
| `api/inventory-items/route.ts` POST | `createItemSchema` |
| `api/inventory-items/[id]/route.ts` PUT | `updateItemSchema` |
| `api/purchase-orders/route.ts` POST | `createPurchaseOrderSchema` |
| `api/purchase-orders/[id]/route.ts` PUT | `updatePurchaseOrderSchema` |
| `api/charge-categories/route.ts` POST | `createCategorySchema` |
| `api/charge-items/route.ts` POST | `createChargeItemSchema` |
| `api/diet-orders/route.ts` POST | `createDietOrderSchema` |
| `api/notifications/read-all/route.ts` PUT | (none — no body) |
| `api/ipd-sample-collections/route.ts` POST | `createSampleCollectionSchema` |

### Error Response Format
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "amount", "message": "Amount must be positive" },
    { "field": "paymentMethod", "message": "Invalid enum value. Expected 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Online'" }
  ]
}
```
HTTP Status: 422 (Unprocessable Entity)

---

## GAP 5: PAGINATION STANDARDIZATION
### Problem
6 list endpoints return ALL records unbounded. Some have pagination, some have hard `take: 100`, some have nothing.

### Standard Pattern (from existing `ipd-bills/route.ts`)
```typescript
// Query params
const page = parseInt(searchParams.get('page') || '1')
const limit = parseInt(searchParams.get('limit') || '20')

// Query
const [data, total] = await Promise.all([
  db.model.findMany({ where, skip: (page - 1) * limit, take: limit, ...includes }),
  db.model.count({ where }),
])

// Response
return NextResponse.json({
  data,
  page, limit, total,
  totalPages: Math.ceil(total / limit),
})
```

### Routes to Fix (6)

| # | File | Current State | Fix |
|---|------|---------------|-----|
| 1 | `api/doctors/route.ts` | No pagination, returns all | Add page/limit/count. Keep filter dropdown queries separate |
| 2 | `api/hospitals/route.ts` | No pagination, no count | Add page/limit/count |
| 3 | `api/lab-reports/route.ts` | Hard `take: 100`, no skip/count | Add full pagination |
| 4 | `api/stock-movements/route.ts` | Returns all | Add page/limit/count |
| 5 | `api/inventory-items/route.ts` | Returns all | Add page/limit/count |
| 6 | `api/ot-schedules/route.ts` | Hard `take: 100`, no skip | Add full pagination |

### Response Shape Standard
All paginated GET endpoints MUST return:
```typescript
{
  data: T[],              // Array of records
  page: number,           // Current page (1-based)
  limit: number,          // Items per page
  total: number,          // Total matching records
  totalPages: number,     // Math.ceil(total / limit)
}
```

### Client-Side Impact
- Dashboard pages using TanStack Query will need to pass `page` param
- Most pages already have pagination state — just need to wire it to the new API params
- No UI changes needed if response shape matches existing pattern

---

## GAP 6: SCHEMA FK & DATA INTEGRITY
### Problem
24 FK relations missing `onDelete`, 4 `@unique` fields with `@default("")` causing SQLite constraint violations.

### Step 6.1: Add onDelete to All FK Relations

#### Strategy:
- **`Restrict`** — When parent has active children that should NOT be auto-deleted
- **`Cascade`** — When children are meaningless without parent (line items, notifications)
- **`SetNull`** — When the reference is optional and should survive parent deletion

#### Critical Relations (Must Fix):

| Model | Field | References | onDelete | Reason |
|-------|-------|------------|----------|--------|
| IpdAdmission | hospitalId | Hospital | **Restrict** | Never delete hospital with active admissions |
| IpdAdmission | wardId | Ward | **Restrict** | Never delete ward with active patients |
| IpdAdmission | bedId | Bed | **Restrict** | Never delete bed with active admission |
| IpdAdmission | departmentId | Department | **Restrict** | Preserve referential integrity |
| IpdAdmission | attendingDoctorId | Doctor | **Restrict** | Doctor deletion shouldn't cascade to admissions |
| NursePatientAssignment | bedId | Bed | **Restrict** | Active assignment locks the bed |
| NursePatientAssignment | admissionId | IpdAdmission | **Cascade** | Assignment belongs to admission |
| IpdBill | admissionId | IpdAdmission | **Restrict** | Bill survives admission for records |
| IpdBill | hospitalId | Hospital | **Restrict** | Bill is financial record |
| BillLineItem | billId | IpdBill | **Cascade** | Line items belong to bill |
| BillPayment | billId | IpdBill | **Restrict** | Payment is financial record |
| PatientAdvance | admissionId | IpdAdmission | **Restrict** | Advance is financial record |
| PatientAdvance | billId | IpdBill | **SetNull** | Bill deletion nulls the reference |
| OpdBill | bookingId | Booking | **Restrict** | OPD bill references booking |
| OpdBill | hospitalId | Hospital | **Restrict** | Bill is financial record |
| LabReport | hospitalId | Hospital | **Restrict** | Lab report is medical record |
| LabReport | testMasterId | LabTestMaster | **Restrict** | Report references the test definition |
| LabReport | orderedById | User | **SetNull** | User deletion shouldn't break reports |
| LabReportParameter | reportId | LabReport | **Cascade** | Parameters belong to report |
| OtSchedule | admissionId | IpdAdmission | **Restrict** | OT record is medical record |
| OtSchedule | otId | OperationTheater | **Restrict** | OT schedule references the theater |
| OtSchedule | surgeonId | Doctor | **SetNull** | Doctor deletion nulls reference |
| StockMovement | itemId | InventoryItem | **Restrict** | Movement is audit trail |
| FamilyAccess | admissionId | IpdAdmission | **Cascade** | Access code belongs to admission |
| Notification | userId | User | **Cascade** | User deletion cleans up notifications |
| Booking | doctorId | Doctor | **SetNull** | Doctor deletion shouldn't break bookings |
| Booking | userId | User | **SetNull** | Patient deletion shouldn't break bookings |
| DietOrder | admissionId | IpdAdmission | **Cascade** | Diet order belongs to admission |

### Step 6.2: Fix Empty String Unique Defaults

#### Problem:
`@default("")` + `@unique` = only ONE record can have empty string. Second insert fails.

#### Affected Fields:
| Model | Field | Current | Fix |
|-------|-------|---------|-----|
| Booking | appointmentNo | `@unique @default("")` | `@unique @default(cuid())` — generate unique ID first |
| IpdBill | billNo | `@unique @default("")` | `@unique @default(cuid())` |
| OpdBill | receiptNo | `@unique @default("")` | `@unique @default(cuid())` |
| BillPayment | receiptNo | `@default("")` (not unique) | `@default(cuid())` |
| PatientAdvance | receiptNo | `@default("")` (not unique) | `@default(cuid())` |

#### Migration Impact:
- `bun run db:push` will detect the changes
- Existing records with `""` values need to be backfilled BEFORE changing the default
- **Script needed**: Update all records where `appointmentNo = ""` to `cuid()` before schema push

### Step 6.3: Add Missing Indexes

#### High-Traffic Query Fields:
```prisma
// Booking queries
@@index([hospitalId, status])
@@index([doctorId, status])
@@index([userId, status])

// IpdAdmission queries
@@index([hospitalId, status])
@@index([wardId, status])
@@index([bedId])
@@index([attendingDoctorId])

// LabReport queries
@@index([hospitalId, status])
@@index([orderedById])
@@index([testMasterId])

// Notification queries
@@index([userId, status])
@@index([hospitalId])

// Billing queries
@@index([hospitalId, paymentStatus])
@@index([admissionId])

// Inventory queries
@@index([hospitalId, category])
@@index([itemId])  // on StockMovement

// OT queries  
@@index([hospitalId, scheduledDate])
@@index([surgeonId])
```

### Step 6.4: Add Missing updatedAt

| Model | Fix |
|-------|-----|
| DoctorHoliday | Add `updatedAt DateTime @updatedAt` |
| DoctorAssistant | Add `updatedAt DateTime @updatedAt` |
| DoctorGallery | Add `updatedAt DateTime @updatedAt` |
| StockMovement | Add `updatedAt DateTime @updatedAt` |
| BedTransfer | Add `updatedAt DateTime @updatedAt` |

### Step 6.5: Run Migration
```bash
# 1. Backfill empty unique fields
bun run src/scripts/backfill-unique-ids.ts

# 2. Push schema changes
bun run db:push

# 3. Verify
bun run db:push  # Should say "Everything is in sync"
```

---

## GAP 7: RECEPTIONIST SIDEBAR WRONG DISCHARGE LINK
### Problem
`src/lib/sidebar-config.ts` line 171 — Receptionist's "Discharge" menu points to `/dashboard/hospital/billing/discharge` (hospital's page).

### Two-Part Fix:

#### Part A: Create Receptionist Discharge Page
**Files**:
- `src/app/dashboard/receptionist/billing/discharge/page.tsx` (NEW — server wrapper)
- `src/app/dashboard/receptionist/billing/discharge/client.tsx` (NEW — clone from hospital discharge with receptionist auth)

#### Part B: Fix Sidebar Link
**File**: `src/lib/sidebar-config.ts` line 171

**Change**:
```typescript
// Before:
{ label: 'Discharge', href: '/dashboard/hospital/billing/discharge', icon: LogOut },
// After:
{ label: 'Discharge', href: '/dashboard/receptionist/billing/discharge', icon: LogOut },
```

### Implementation Notes:
- The receptionist discharge page should be a simplified version of the hospital one
- Same API: `GET /api/ipd-admissions/discharge-pending` (already supports receptionist auth)
- Same actions: Initiate Discharge → Complete Discharge
- Can reuse most of the hospital discharge client component with minor auth adjustments

---

## IMPLEMENTATION ORDER & DEPENDENCIES

```
Phase 1 (Foundation — No Breaking Changes)
├── GAP 2: Dev-Login Guard (5 min) ← No dependencies
├── GAP 7: Sidebar Fix (15 min) ← No dependencies  
└── GAP 6.4: Add updatedAt (5 min) ← Schema only

Phase 2 (Schema Changes)
├── GAP 6.1: Add onDelete to all FKs ← Requires GAP 6.2 first
├── GAP 6.2: Fix empty string defaults ← Requires backfill script
├── GAP 6.3: Add indexes ← Schema only
├── GAP 6.5: Run db:push ← After all schema changes
└── GAP 7 Part A: Create receptionist discharge page

Phase 3 (Validation Layer)
├── GAP 4.1: Create validation schemas ← No dependencies
├── GAP 4.2: Create validation helper ← No dependencies
├── GAP 4.3: Apply to 25 POST/PUT routes ← After schemas ready
└── GAP 3.3: Deduplicate DEV_USERS ← Code cleanup

Phase 4 (Feature Integration)
├── GAP 1.1: Create emit helper ← No dependencies
├── GAP 1.2: Add emit to 18 routes ← After helper ready
├── GAP 5: Add pagination to 6 routes ← Independent
├── GAP 3.1: Make role cookie httpOnly ← Test auth still works
└── GAP 3.2: Remove admin bypass ← Test all role pages

Phase 5 (Verification)
├── Run `bun run lint`
├── Run `bun run db:push`
├── Browser QA: Login as each role, verify access
├── Browser QA: Trigger real-time events, verify toasts
└── Browser QA: Test pagination on all 6 fixed endpoints
```

---

## RISK ASSESSMENT

| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema changes break existing data | High | Backfill script before db:push; test on copy of DB |
| httpOnly role cookie breaks client-side role reads | Medium | Audit all client code that reads `doctorooms_role` cookie — move to `/api/auth/me` API |
| Zod validation rejects previously-accepted data | Medium | Make schemas permissive initially; add strict mode later |
| Emit calls slow down API responses | Low | Fire-and-forget pattern; no await |
| Removing admin bypass breaks admin workflow | Medium | Verify admin has all needed routes in sidebar; add proxy routes if needed |

---

## FILES TO CREATE (NEW)

| File | Purpose |
|------|---------|
| `src/lib/emit-notification.ts` | WebSocket emit helper |
| `src/lib/validations/index.ts` | Validation barrel export + helper |
| `src/lib/validations/common.ts` | Shared pagination, CUID, date schemas |
| `src/lib/validations/billing.ts` | Bill, payment, advance schemas |
| `src/lib/validations/ipd-admission.ts` | Admission, discharge schemas |
| `src/lib/validations/lab.ts` | Lab report, result, verify schemas |
| `src/lib/validations/bed.ts` | Bed transfer schema |
| `src/lib/validations/ot.ts` | OT schedule schema |
| `src/lib/validations/inventory.ts` | Item, movement, PO schemas |
| `src/app/dashboard/receptionist/billing/discharge/page.tsx` | Receptionist discharge page |
| `src/app/dashboard/receptionist/billing/discharge/client.tsx` | Receptionist discharge client |
| `src/scripts/backfill-unique-ids.ts` | Backfill empty unique fields |

## FILES TO MODIFY (EXISTING)

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | onDelete, indexes, updatedAt, default values |
| `src/lib/api-auth.ts` | httpOnly role, dedupe DEV_USERS, production guard, remove admin bypass |
| `src/app/api/dev-login/route.ts` | NODE_ENV guard, import DEV_USERS |
| `src/app/api/auth/login/route.ts` | httpOnly role cookie |
| `src/app/api/auth/me/route.ts` | Import DEV_USERS, production guard |
| `src/lib/sidebar-config.ts` | Fix discharge href |
| 18 API route files | Add `emitNotification()` calls |
| 25 API route files | Add zod `validateBody()` calls |
| 6 API route files | Add pagination |

---

## SUCCESS CRITERIA

- [ ] `POST /api/dev-login` returns 404 in production mode
- [ ] `doctorooms_role` cookie is httpOnly
- [ ] No hardcoded DEV_USERS outside `api-auth.ts`
- [ ] Admin cannot access doctor/nurse/patient routes
- [ ] All 25 POST/PUT routes reject invalid input with 422 + details
- [ ] All 6 unbounded list endpoints support page/limit/count
- [ ] All FK relations have explicit onDelete behavior
- [ ] No `@default("")` on `@unique` fields
- [ ] 20+ database indexes on high-traffic query fields
- [ ] Triggering admission/bill/lab/OT actions shows real-time toasts on other tabs
- [ ] Receptionist discharge page accessible and functional
- [ ] `bun run lint` passes
- [ ] `bun run db:push` succeeds
