# 5-C — Reception Rich Booking Form Agent

## Task ID: 5-C
## Agent: Booking Form Agent
## Task: Expand the appointment creation form with rich fields, mobile lookup, and new patient registration

---

## Work Log
- (to be filled by agent)

---

## Context

The PHP original had a comprehensive booking form with ~15 fields. The current Next.js "New Appointment" dialog only has: Patient Name, Disease, Date, Time, Description.

## What to Build

### C1. Expanded Booking Form Fields

**File:** `src/app/dashboard/receptionist/appointments/page.tsx` (modify the New Appointment dialog)

**Current fields:** Patient Name, Disease, Date, Time Slot, Description

**New fields to add:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Mobile Number | text input | Yes | With lookup button — searches existing patients |
| Gender | select (Male/Female/Other) | No | Default empty |
| Date of Birth | date input | No | Auto-calculates Age when set |
| Age | text input | No | Auto-filled from DOB, but manually editable |
| Blood Group | select (A+/A-/B+/B-/AB+/AB-/O+/O-) | No | Full ABO+Rh options |
| Height (cm) | number input | No | |
| Weight (kg) | number input | No | |
| Physical Handicap | select (Yes/No) | No | Default No |
| Relation With Me | text input | No | Self, Father, Mother, Son, Daughter, Wife, Husband, etc. |

**Form Layout:**
- Split into sections with section headers
- **Patient Info section:** Mobile (with lookup), Patient Name, Gender, DOB, Age, Blood Group
- **Appointment section:** Date, Time Slot, Disease/Reason, Description
- **Additional Info section:** Height, Weight, Physical Handicap, Relation With Me
- Use a 2-column grid on desktop, single column on mobile

**API Change:** `src/app/api/dashboard/receptionist/appointments/route.ts` POST handler
- Accept all new fields in request body
- Map them to the Booking model fields (age, gender, bloodGroup, weight already exist in schema)
- Height, physicalHandicap, relationWithMe, dateOfBirth may need to be stored in `description` or added to schema if missing

### C2. Mobile Number Lookup

**Behavior:**
- Add a "Lookup" button (or auto-lookup on blur) next to the Mobile field
- When triggered, call `GET /api/dashboard/receptionist/patients?search=<mobile>` 
- If patient found: auto-fill Patient Name, Gender, Age, Blood Group, Weight
- Show a small green badge: "Patient found — auto-filled"
- If not found: show a link/button: "Register new patient"

### C3. New Patient Registration Dialog

**Trigger:** Click "Register new patient" link when mobile lookup returns no result.

**File:** `src/app/dashboard/receptionist/appointments/page.tsx` (new dialog component within the same file, or extract to a separate component)

**Dialog fields:**
| Field | Type | Required |
|-------|------|----------|
| Name | text | Yes |
| Email | email | No | Auto-generate if empty: `patient{timestamp}@doctorooms.com` |
| Mobile | text (pre-filled from booking form) | Yes |
| Gender | select | Yes |
| Password | (auto-generated, hidden) | | Generate random 8-char password |

**API:** `POST /api/dashboard/receptionist/patients/register`
- Auth: `requireRole('receptionist')`
- Create a new User with `role: 'patient'`, `status: 'ACTIVE'`
- Create Patient record linked to the User and the receptionist's doctor
- Return the new patient data so the form can auto-fill

**After registration:**
- Close the registration dialog
- Auto-fill the booking form with new patient's data
- Show success toast: "New patient registered successfully"

### C4. Already-Booked Count on Date Change

**Behavior:** When the user changes the appointment date in the booking form, show a small text below the date picker:
> "📅 8 appointments already booked for this date"

**Implementation:**
- Add `useEffect` or `watch` on the date field
- Call a lightweight count query: `GET /api/dashboard/receptionist/appointments?date=2025-01-15&countOnly=true`
- Or compute from the existing appointments query data
- Display with a CalendarDays icon

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `src/app/dashboard/receptionist/appointments/page.tsx` | Modify | Expand dialog with new fields, sections, mobile lookup, registration dialog |
| `src/app/api/dashboard/receptionist/appointments/route.ts` | Modify | Accept new fields in POST |
| `src/app/api/dashboard/receptionist/patients/register/route.ts` | Create | New patient registration endpoint |

## UI Design Notes

- Dialog should be scrollable if content exceeds viewport (`max-h-[90vh] overflow-y-auto`)
- Section headers use `text-sm font-semibold text-muted-foreground uppercase tracking-wider`
- Mobile lookup: Phone icon button, or auto-lookup on blur with 500ms debounce
- Registration dialog is a SECOND dialog (Dialog within Dialog — use shadcn's nested dialog pattern or a Sheet)
- Use `Separator` component between sections
- New fields use the same styling as existing (shadcn Input, Select, etc.)

## Verification
- [ ] All new fields render correctly in the booking dialog
- [ ] Mobile lookup finds existing patients and auto-fills
- [ ] Mobile lookup shows "Register new patient" when not found
- [ ] New patient registration creates User + Patient records
- [ ] After registration, booking form auto-fills
- [ ] DOB auto-calculates Age
- [ ] Already-booked count shows on date change
- [ ] Form validation works (required fields)
- [ ] Created booking includes all new fields in database
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

## Stage Summary
- (to be filled by agent)