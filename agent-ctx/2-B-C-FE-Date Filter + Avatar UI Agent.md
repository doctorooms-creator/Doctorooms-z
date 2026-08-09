# Task 2-B-C-FE: Date Range Filter + Avatar Upload

## Agent: Date Filter + Avatar UI Agent

## Work Completed

### Task 1: Date Range Filter on Appointments Page
**File**: `src/app/dashboard/patient/appointments/page.tsx`

Changes:
- Added `CalendarIcon` import (aliased from `Calendar`) from lucide-react
- Added `Label` component import from shadcn/ui
- Added `dateFrom` and `dateTo` state variables (`Date | undefined`)
- Added date range filter Card above the status tabs containing:
  - CalendarIcon + "From:" label + date input
  - "To:" label + date input
  - "Clear" ghost button (X icon) to reset both dates
  - Results count text ("Showing X appointments" or "Filter by date range")
- Updated `useQuery` queryKey to include `dateFrom?.toISOString()` and `dateTo?.toISOString()`
- Updated `useQuery` queryFn to build URLSearchParams with `from`, `to`, and `status` params

### Task 2: Avatar Upload on Profile Page
**File**: `src/app/dashboard/patient/profile/page.tsx`

Changes:
- Added `useRef` to React imports
- Added `Loader2` to lucide-react imports
- Added `fileInputRef = useRef<HTMLInputElement>(null)`
- Added `avatarMutation` (useMutation) that POSTs FormData to `/api/patient/avatar`
- Added `handleFileChange` function with validation (2MB max, JPEG/PNG/WebP only)
- Replaced the avatar click handler (was `toast.info('coming soon')`) with `fileInputRef.current?.click()`
- Wrapped avatar in `relative group cursor-pointer` div with hover overlay showing Camera icon
- Overlay shows Loader2 spinner when `avatarMutation.isPending`
- Added hidden `<input type="file">` element with accept constraints

## Verification
- Dev server compiled successfully (✓ Compiled entries in dev.log)
- No compilation errors
