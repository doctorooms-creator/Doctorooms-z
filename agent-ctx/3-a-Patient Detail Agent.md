# Task 3-a: Build Doctor Patient Detail Page

## Files Created
1. `/src/app/api/dashboard/doctor/patients/[id]/route.ts` — GET API endpoint
2. `/src/app/dashboard/doctor/patients/[id]/page.tsx` — Patient detail frontend page

## Files Modified
1. `/src/app/dashboard/doctor/patients/page.tsx` — Added Link navigation to patient detail

## Key Decisions
- API uses `requireRole(req, 'doctor')` from `@/lib/api-auth` for auth
- Age calculated from `dateOfBirth` on latest booking using `date-fns differenceInYears`
- Vitals timeline uses colored gradient bars instead of chart library
- BP bars: green (<120), amber (120-140), red (>140) based on systolic value
- Temperature bars: green (<98), amber (98-99), red (>99)
- Patient cards on list page wrapped with Link for navigation
- Prescription "View" buttons navigate to existing `/dashboard/doctor/prescriptions/[id]` page

## Lint Result
- 0 errors, 1 pre-existing warning (unrelated)
