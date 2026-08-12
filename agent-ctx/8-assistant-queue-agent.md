# Task 8 - Assistant Queue Agent

## Task
Phase 8 - Assistant prescription queue page + API

## Files Created
1. `src/app/api/dashboard/assistant/prescription-queue/route.ts` - GET API
2. `src/app/dashboard/assistant/prescription-queue/page.tsx` - Frontend page

## API Details
- Auth: `requireRole('assistant')` → DoctorAssistant lookup for doctorId
- Queries: Bookings where doctorId matches AND status in ['Approve', 'Visited']
- Includes prescriptions with chiefComplaints count
- Filters out bookings with Active/Archived prescriptions
- Supports `?search=` for patient name filtering
- Returns: `{ queue: [{ id, patientName, age, gender, bloodGroup, timeSlot, bookingDate, status, prescription: null | { id, status, chiefComplaintsCount } }] }`

## Page Details
- 'use client' with TanStack Query
- Desktop: Table view (Patient, Age, Gender, Time Slot, Status, Action)
- Mobile: Card view (hidden on md+)
- Status badges: Approve=amber, Visited=green, Draft Rx=teal
- Actions: 'Start Rx' / 'Continue Rx' → navigates to `/dashboard/doctor/prescriptions/new?bookingId=xxx`
- Search by patient name
- Empty state, skeleton loading, framer-motion animations
- Teal color scheme, shadcn/ui components

## Notes
- Sidebar entry already existed (no changes needed)
- ESLint: 0 errors, 0 warnings
