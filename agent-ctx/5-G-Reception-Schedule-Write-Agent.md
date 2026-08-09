# 5-G — Reception Schedule Write Access Agent

## Task ID: 5-G
## Agent: Schedule Write Agent
## Task: Add holiday CRUD and booking days update to the receptionist schedule page

---

## Work Log
- (to be filled by agent)

---

## Context

The PHP original allowed receptionists to:
1. **Add/Edit/Delete holidays** for their doctor (batch add with dynamic rows)
2. **Update booking days** — how far in advance patients can book (max 180)

The current Next.js schedule page is **read-only** — it only displays the weekly schedule and upcoming holidays.

The Prisma schema has:
```prisma
model DoctorSchedule {
  id           String   @id @default(cuid())
  doctorId     String
  day          String   // Monday-Sunday
  startTime    String
  endTime      String
  slotDuration Int
  timeSlots    String   // JSON string array
}

model DoctorHoliday {
  id        String   @id @default(cuid())
  userId    String   // doctor user id
  date      DateTime
  remark    String?
}

model Doctor {
  // ...
  bookingDays Int @default(30) // how far ahead patients can book
  // ...
}
```

## What to Build

### G1. Holiday CRUD

**API — `src/app/api/receptionist/holidays/route.ts`** (create)
- **GET:** List holidays for the receptionist's linked doctor
  - Return sorted by date, include past and future
  - Support `?from=&to=` date range filtering
- **POST:** Add a single holiday
  - Body: `{ date: '2025-01-15', remark: 'Republic Day' }`
  - Validate: date is not in the past, not a duplicate
  - Use the doctor's `userId` (not doctorId) for the `DoctorHoliday.userId` field
  - First get doctor info: `db.doctor.findUnique({ where: { id: receptionist.doctorId }, select: { userId: true } })`

**API — `src/app/api/receptionist/holidays/[id]/route.ts`** (create)
- **DELETE:** Delete a holiday
  - Verify holiday belongs to receptionist's doctor

**UI — Modify `src/app/dashboard/receptionist/schedule/page.tsx`:**

Add a new section below the weekly schedule grid:

**"Holidays" section:**
- Header: "Holidays" + "Add Holiday" button
- Holiday list: Cards or table rows
  - Date (formatted), Remark, Past/Future badge (past=red, future=emerald)
  - Delete button (red, only for future holidays — can't delete past ones)
- "Add Holiday" opens a Dialog with:
  - Date picker (min = today)
  - Remark (text input, optional)
  - Save button
- Empty state: CalendarX icon + "No holidays scheduled"

### G2. Booking Days Update

**API — `src/app/api/receptionist/booking-days/route.ts`** (create)
- **GET:** Get current booking days for linked doctor
  - `db.doctor.findUnique({ where: { id: receptionist.doctorId }, select: { bookingDays: true } })`
- **PUT:** Update booking days
  - Body: `{ bookingDays: number }`
  - Validate: 1-365, integer
  - `db.doctor.update({ where: { id: receptionist.doctorId }, data: { bookingDays } })`

**UI — Modify `src/app/dashboard/receptionist/schedule/page.tsx`:**

Add a new card at the top of the page (or in the header area):

**"Booking Settings" card:**
- Current value: "Patients can book appointments up to **X days** in advance"
- Edit button → Inline edit or small Dialog
  - Number input (1-365)
  - Save button
  - Toast: "Booking days updated to X"

### G3. Batch Holiday Add (Optional Enhancement)

If time permits, add a "Batch Add" feature:
- Dialog with multiple date+remark rows
- "Add Row" button to add more
- "Save All" button
- This matches the PHP original's batch add functionality

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/receptionist/holidays/route.ts` | Create | Holiday list + add API |
| `src/app/api/receptionist/holidays/[id]/route.ts` | Create | Holiday delete API |
| `src/app/api/receptionist/booking-days/route.ts` | Create | Booking days get/update API |
| `src/app/dashboard/receptionist/schedule/page.tsx` | Modify | Add holiday CRUD + booking days UI |

## UI Design Notes
- Holiday section uses the same card style as the weekly schedule
- Past holidays: red-ish text/badge, dimmed
- Future holidays: emerald badge, full opacity
- Booking days card: CalendarRange icon, prominent number display
- Use shadcn DatePicker for holiday date selection

## Verification
- [ ] Add holiday works (date + remark)
- [ ] Delete future holiday works
- [ ] Cannot delete past holidays
- [ ] Cannot add past dates as holidays
- [ ] Booking days displays current value
- [ ] Update booking days works with validation
- [ ] Holiday list shows past/future distinction
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

## Stage Summary
- (to be filled by agent)