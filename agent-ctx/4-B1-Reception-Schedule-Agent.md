---
Task ID: 4-B1
Agent: Reception Schedule Agent
Task: Create doctor schedule view page for receptionist

Files Created:
- src/app/api/dashboard/receptionist/schedule/route.ts — GET API endpoint
- src/app/dashboard/receptionist/schedule/page.tsx — Weekly schedule view page

Files Modified:
- src/lib/sidebar-config.ts — Added Schedule entry for receptionist
- src/components/dashboard/dashboard-header.tsx — Added route title mapping

Details:
- API uses requireRole('receptionist') auth, queries DoctorSchedule and DoctorHoliday models
- Page shows 7-day weekly grid with active/inactive states, today highlight, time slots
- Holidays section with empty state, red-themed cards
- Framer Motion animations, TanStack Query, shadcn/ui components
- ESLint: 0 errors, 0 warnings
