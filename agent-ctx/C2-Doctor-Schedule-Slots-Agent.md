# Task C2 — Doctor Schedule Slots Agent

## Work Completed

### 1. Fixed doctor schedule API auth (`/src/app/api/dashboard/doctor/schedule/route.ts`)
- Replaced `getServerSession` with `requireRole` from `@/lib/api-auth`
- Both GET and POST now use `const user = await requireRole(req, 'doctor')`
- Return 401 if user is null
- POST also accepts optional `timeSlots` array per schedule and saves as JSON.stringify

### 2. Created slots API (`/src/app/api/dashboard/doctor/schedule/slots/route.ts`)
- GET: Returns all schedules with parsed `manualSlots` array
- PUT: Accepts `{ day, timeSlots }` — updates or creates schedule with manual slots

### 3. Updated public schedule API (`/src/app/api/doctors/[id]/schedule/route.ts`)
- Parses `timeSlots` JSON field from each schedule
- If manual slots are non-empty array, returns those instead of auto-generated
- Falls back to auto-generated slots when manual is empty/missing

### 4. Updated doctor schedule page UI (`/src/app/dashboard/doctor/schedule/page.tsx`)
- Added slots data query to `/api/dashboard/doctor/schedule/slots`
- Each day card now shows a Switch toggle: "Manual slots" vs "Auto-generate"
- When manual mode is on: shows removable Badge chips + input + Add button
- Validates slot format with regex (HH:MM AM/PM)
- Auto-generated slots shown as small outline badges when in auto mode
- Uses framer-motion for chip animations (AnimatePresence, layout)
- All components from shadcn/ui (Switch, Badge, Input, Button, Label)

### 5. Lint passes with 0 errors (1 pre-existing warning in unrelated file)
