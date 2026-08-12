# Task 2-a: TIMEZONE BUG FIX — IST Date Calculations

## Date
2025-06-23

## Summary
Fixed timezone bugs across 8 API route files. All "today" date calculations that were using UTC (server local time) have been replaced with IST-aware helpers from `@/lib/date-utils`. Two files listed in the task (`doctor/appointments/route.ts`, `receptionist/pending-bookings/route.ts`) had no `startOfDay`/`endOfDay` or "today" date calculations to fix and were skipped.

## Changes Per File

### 1. `src/app/api/dashboard/doctor/stats/route.ts`
- **Removed** `import { startOfDay, endOfDay } from 'date-fns'`
- **Added** `import { todayISTRange } from '@/lib/date-utils'`
- **Replaced** `const today = new Date(); const todayStart = startOfDay(today); const todayEnd = endOfDay(today)` with `const { start: todayStart, end: todayEnd } = todayISTRange()`

### 2. `src/app/api/dashboard/doctor/queue/route.ts`
- **Added** `import { todayISTRange, todayISTStr } from '@/lib/date-utils'`
- **Replaced** manual `todayStr`/`startOfDay`/`endOfDay` calculation (3 lines of `new Date()` + string formatting) with `const { start: startOfDay, end: endOfDay } = todayISTRange(); const todayStr = todayISTStr()`

### 3. `src/app/api/dashboard/receptionist/walk-in/route.ts`
- **Added** `import { todayISTRange, todayISTStr, currentTimeIST } from '@/lib/date-utils'`
- **GET handler**: Replaced manual todayStr/startOfDay/endOfDay with `todayISTRange()` + `todayISTStr()`
- **POST handler**: Replaced manual todayStr/startOfDay/endOfDay with same helpers
- **POST handler**: Changed `timeSlot: timeSlot || ''` → `timeSlot: timeSlot || currentTimeIST()` so that when no time slot is selected, the actual booking time in IST is recorded

### 4. `src/app/api/dashboard/receptionist/stats/route.ts`
- **Removed** `import { startOfDay, endOfDay } from 'date-fns'`
- **Added** `import { todayISTRange } from '@/lib/date-utils'`
- **Replaced** `const today = new Date(); const todayStart = startOfDay(today); const todayEnd = endOfDay(today)` with `const { start: todayStart, end: todayEnd } = todayISTRange()`

### 5. `src/app/api/dashboard/receptionist/appointments/route.ts`
- **Added** `import { istDateRange } from '@/lib/date-utils'`
- **Replaced** `if (from) where.bookingDate.gte = new Date(from)` with `if (from) { const range = istDateRange(from); where.bookingDate.gte = range.start }`
- **Replaced** `if (to) where.bookingDate.lte = new Date(to + 'T23:59:59.999Z')` with `if (to) { const range = istDateRange(to); where.bookingDate.lte = range.end }`

### 6. `src/app/api/dashboard/assistant/stats/route.ts`
- **Removed** `import { startOfDay, endOfDay } from 'date-fns'`
- **Added** `import { todayISTRange } from '@/lib/date-utils'`
- **Replaced** `const today = new Date(); const todayStart = startOfDay(today); const todayEnd = endOfDay(today)` with `const { start: todayStart, end: todayEnd } = todayISTRange()`

### 7. `src/app/api/dashboard/receptionist/pending-bookings/route.ts`
- **Skipped**: No `startOfDay`/`endOfDay` or "today" calculations found in this file. The per-booking date calculations use `bookingDate` from the DB record, not "today".

### 8. `src/app/api/dashboard/doctor/earnings/route.ts`
- **Removed** `startOfDay, endOfDay` from the `date-fns` import (kept `startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, eachDayOfInterval` for period-based ranges)
- **Added** `import { todayISTRange } from '@/lib/date-utils'`
- **Replaced** `const todayStart = startOfDay(now); const todayEnd = endOfDay(now)` with `const { start: todayStart, end: todayEnd } = todayISTRange()`

### 9. `src/app/api/dashboard/doctor/appointments/route.ts`
- **Skipped**: No `startOfDay`/`endOfDay` or "today" date calculations found. This file only has status filtering, no date-based queries.

### 10. `src/app/api/patient/bookings/route.ts`
- **Added** `import { istDateRange } from '@/lib/date-utils'`
- **Replaced** manual date extraction (`new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())` + `nextDay.setDate(...)`) with `istDateRange(dateStr)` to get IST-aware start-of-day and end-of-day boundaries
- Computed `nextDay` as `end + 1ms` to maintain the original `lt: nextDay` (exclusive upper bound) semantics

## Verification
- ESLint passed with no errors
- Dev server compiled successfully
