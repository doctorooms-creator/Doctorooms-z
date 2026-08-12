# Task ID: 4 - API Routes Agent Work Record

## Task
Create ALL multi-specialty hospital API routes for Department + DoctorHospital models.

## Files Created (6 new)
1. `src/app/api/hospitals/[id]/route.ts` - GET public hospital detail with departments + doctor counts
2. `src/app/api/hospitals/[id]/departments/[departmentId]/doctors/route.ts` - GET doctors in department
3. `src/app/api/dashboard/hospital/departments/route.ts` - GET list + POST create
4. `src/app/api/dashboard/hospital/departments/[id]/route.ts` - PUT update + DELETE
5. `src/app/api/dashboard/hospital/doctor-links/route.ts` - GET list + POST link doctor
6. `src/app/api/dashboard/hospital/doctor-links/[id]/route.ts` - PUT update + DELETE unlink

## Files Updated (2)
7. `src/app/api/hospitals/route.ts` - Added `_count: { departments, doctorLinks }` to select
8. `src/app/api/dashboard/hospital/stats/route.ts` - Rewritten to use DoctorHospital model

## Key Decisions
- Renamed `[hospitalId]` to `[id]` to avoid Next.js conflicting slug name error
- Doctor stats route uses `DoctorHospital` junction table instead of `Doctor.hospitalId`
- Department DELETE blocks if any doctor links exist
- Doctor link POST returns 409 on duplicate (unique constraint)
- Rating calculation uses `db.doctorRating.groupBy` for all doctor listing routes

## Verification
- ESLint: 0 errors
- Prisma schema: already in sync
