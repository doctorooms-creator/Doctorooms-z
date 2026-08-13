# Task 5: Doctor IPD Patients Page + Order Sheet

## Status: COMPLETED

## Files Created

### API Routes (8 files)
1. `/src/app/api/dashboard/doctor/ipd/route.ts` — GET list IPD patients with stats
2. `/src/app/api/dashboard/doctor/ipd/patients/[admissionId]/route.ts` — GET full patient detail
3. `/src/app/api/dashboard/doctor/ipd/patients/[admissionId]/orders/route.ts` — GET+POST orders
4. `/src/app/api/dashboard/doctor/ipd/patients/[admissionId]/orders/[orderId]/route.ts` — PUT+DELETE order (update/stop)
5. `/src/app/api/dashboard/doctor/ipd/patients/[admissionId]/history/route.ts` — PUT History Sheet (Form 2)
6. `/src/app/api/dashboard/doctor/ipd/patients/[admissionId]/examination/route.ts` — PUT Physical Exam (Form 6)
7. `/src/app/api/dashboard/doctor/ipd/patients/[admissionId]/investigations/route.ts` — POST order investigation
8. `/src/app/api/dashboard/doctor/ipd/patients/[admissionId]/visits/route.ts` — POST add visit note

### Pages (4 files)
9. `/src/app/dashboard/doctor/ipd/page.tsx` — Server wrapper
10. `/src/app/dashboard/doctor/ipd/client.tsx` — Patient list with stats, filters, table/cards
11. `/src/app/dashboard/doctor/ipd/patients/[admissionId]/page.tsx` — Server wrapper
12. `/src/app/dashboard/doctor/ipd/patients/[admissionId]/client.tsx` — 7-tab detail interface

## Key Patterns Used
- Auth: `requireRole(req, 'doctor')` → `db.doctor.findUnique({ where: { userId: user.id } })`
- Utils: `FREQUENCY_OPTIONS`, `MEDICINE_ROUTES`, `SAMPLE_TYPES`, `checkVitalAlerts` from `@/lib/ipd-utils`
- Colors: Teal=primary/active, Amber=pending, Red=critical/stopped, Emerald=success, Violet=admission numbers
- No indigo/blue used anywhere
