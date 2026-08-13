# Task ID: 5 — Department Management Frontend

## Files Created
1. `src/app/dashboard/hospital/departments/page.tsx` — Department Management Page (CRUD)
2. `src/app/dashboard/hospital/department-doctors/page.tsx` — Doctor-Department Link Management
3. `src/app/api/dashboard/hospital/search-doctors/route.ts` — Doctor Search API (returns Doctor.id)

## Files Updated
4. `src/app/dashboard/hospital/page.tsx` — Added Departments stat card + departments section
5. `src/lib/sidebar-config.ts` — Added Departments + Manage Doctors menu items for hospital role

## Key Decisions
- Created `/api/dashboard/hospital/search-doctors` because the public `/api/doctors` returns User.id, but DoctorHospital.doctorId requires Doctor.id
- Used `renderIcon()` helper function (declared outside component) to satisfy ESLint react-hooks/static-components rule
- Departments dashboard section shows departmentName (from DoctorHospital link) on each doctor

## API Endpoints Used
- `GET/POST /api/dashboard/hospital/departments`
- `PUT/DELETE /api/dashboard/hospital/departments/[id]`
- `GET/POST /api/dashboard/hospital/doctor-links?departmentId=xxx`
- `PUT/DELETE /api/dashboard/hospital/doctor-links/[id]`
- `GET /api/dashboard/hospital/search-doctors?search=xxx` (NEW)
- `GET /api/dashboard/hospital/stats` (updated to return departmentCount, doctorsByDepartment)

## Status
- ESLint: 0 errors
- All files compile successfully
