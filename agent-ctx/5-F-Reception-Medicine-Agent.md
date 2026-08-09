# 5-F — Reception Medicine Master Agent

## Task ID: 5-F
## Agent: Medicine Master Agent
## Task: Build medicine list management for the receptionist (doctor's personal medicine list)

---

## Work Log
- (to be filled by agent)

---

## Context

The PHP original allowed the receptionist to manage the doctor's personal medicine list (used by assistants for prescription autocomplete). Fields: Medicine Name, Morning/Afternoon/Evening doses, Dosage (multi-select tags), Tab count, Description.

The Prisma schema already has:
```prisma
model Medicine {
  id            String   @id @default(cuid())
  doctorId      String
  name          String
  morningDose   String?
  afternoonDose String?
  eveningDose   String?
  dosage        String?
  tabCount      Int?
  description   String?
  status        String   @default("active") // active, inactive
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**Important:** The receptionist is linked to ONE doctor via `Receptionist.doctorId`. All medicine operations should be scoped to this doctor.

Check if the doctor module already has medicine APIs — if so, reuse or extend them.

## What to Build

### F1. Medicine API Routes

**File:** `src/app/api/receptionist/medicines/route.ts` (create)
- **GET:** List medicines for the receptionist's linked doctor
  - `requireRole(req, 'receptionist')`
  - Get `doctorId` from `db.receptionist.findUnique({ where: { userId: user.id } })`
  - `db.medicine.findMany({ where: { doctorId }, orderBy: { createdAt: 'desc' } })`
  - Support `?search=` query for filtering by name
- **POST:** Create new medicine
  - Accept: name (required), morningDose?, afternoonDose?, eveningDose?, dosage?, tabCount?, description?
  - Validate name is not empty
  - `db.medicine.create({ data: { doctorId: receptionist.doctorId, ...fields, status: 'active' } })`

**File:** `src/app/api/receptionist/medicines/[id]/route.ts` (create)
- **GET:** Single medicine (with ownership check — verify medicine.doctorId === receptionist.doctorId)
- **PUT:** Update medicine fields
- **DELETE:** Delete medicine

**File:** `src/app/api/receptionist/medicines/[id]/toggle/route.ts` (create)
- **PATCH:** Toggle status between 'active' and 'inactive'

### F2. Medicine List Page

**File:** `src/app/dashboard/receptionist/medicines/page.tsx` (create)

**Layout:**
- Header: "Medicine List" + "Add Medicine" button (top-right)
- Search input (filter by name)
- Count text: "Showing X medicines"
- Responsive table or card list

**Table columns (desktop):**
| Name | Morning | Afternoon | Evening | Dosage | Tabs | Status | Actions |

**Card layout (mobile):**
- Medicine name (bold) + status badge
- Dose info: M: 1 tab, A: 0.5 tab, E: 1 tab
- Dosage + tab count
- Edit / Toggle / Delete actions

**Features:**
- Framer Motion stagger animation
- Skeleton loading
- Empty state: Pill icon + "No medicines added yet"
- Toggle active/inactive with one click (switch or button)
- Delete with AlertDialog confirmation
- Edit opens a Dialog (not a separate page — simpler for this)

### F3. Add/Edit Medicine Dialog

**Within the same page file or as a child component:**

**Form fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Medicine Name | text input | Yes | |
| Morning Dose | text input | No | e.g., "1 tab", "0.5 tab", "2 ml" |
| Afternoon Dose | text input | No | |
| Evening Dose | text input | No | |
| Dosage | text input | No | e.g., "After food", "Before food", "With water" |
| Tab Count | number input | No | |
| Description | textarea | No | |

**Actions:** Cancel + Save

### F4. Sidebar + Header Update

**File:** `src/lib/sidebar-config.ts`
- Add: `{ label: 'Medicines', href: '/dashboard/receptionist/medicines', icon: Pill }`
- Position: after Schedule, before Patients

**File:** `src/components/dashboard/dashboard-header.tsx`
- Add: `'/dashboard/receptionist/medicines' → 'Medicine List'`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/receptionist/medicines/route.ts` | Create | Medicine list + create API |
| `src/app/api/receptionist/medicines/[id]/route.ts` | Create | Medicine get/update/delete API |
| `src/app/api/receptionist/medicines/[id]/toggle/route.ts` | Create | Toggle status API |
| `src/app/dashboard/receptionist/medicines/page.tsx` | Create | Medicine list + add/edit dialog |
| `src/lib/sidebar-config.ts` | Modify | Add medicines sidebar entry |
| `src/components/dashboard/dashboard-header.tsx` | Modify | Add medicines route title |

## UI Design Notes
- Pill icon from Lucide for sidebar and empty state
- Status badge: active = emerald, inactive = gray/muted
- Toggle: use a small Button with `variant="outline"` — "Active" in emerald, "Inactive" in gray
- Table uses shadcn Table component on desktop, switches to cards on mobile
- Responsive: `hidden md:table-cell` for dose columns on mobile

## Verification
- [ ] Medicine list renders with search
- [ ] Add medicine dialog works
- [ ] Edit medicine dialog works (pre-filled)
- [ ] Toggle active/inactive works
- [ ] Delete with confirmation works
- [ ] Only shows medicines for linked doctor
- [ ] Sidebar shows Medicines entry
- [ ] Header shows correct route title
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

## Stage Summary
- (to be filled by agent)