# Task 6-a: Shared Prescriptions Tab - Frontend

## Status: Completed

## Changes Made
- Modified `/home/z/my-project/src/app/dashboard/doctor/prescriptions/page.tsx`
- Added `Tabs` component with two tabs: "My Prescriptions" (default, value `own`) and "Shared With Me" (value `shared`)
- Updated `queryKey` to include `activeTab`: `['doctor-prescriptions', debouncedSearch, activeTab]`
- Updated fetch URL to include `&type=${activeTab}` query parameter
- Added `SharedPrescription` interface extending `Prescription` with `originalDoctorName`, `originalDoctorSpecialization`, `accessGrantedAt`
- New Prescription button only renders when `activeTab === 'own'`
- Shared prescription cards have:
  - Teal left border (`border-l-4 border-l-teal-500 dark:border-l-teal-600`)
  - Teal "Shared" badge with Share2 icon instead of disease badge
  - Doctor attribution line: "By Dr. {name} ({specialization})"
  - Date shown as "Access granted {date}" with Share2 icon
- Extracted reusable components: `SkeletonGrid`, `EmptyState`, `PrescriptionCard`, `SharedPrescriptionCard`
- Search input works for both tabs
- Added imports: `Tabs, TabsContent, TabsList, TabsTrigger`, `Share2`, `Lock`
- Lint passes cleanly
