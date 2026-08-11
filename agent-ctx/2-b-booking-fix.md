# Task 2-b: Patient Booking Page Fixes

## Changes Applied to `src/app/dashboard/patient/book/[doctorId]/page.tsx`

### Change 1: credentials: 'include' on booking mutation fetch
- Added `credentials: 'include'` to the POST fetch call in `bookMutation` (line 234) to ensure cookies are sent with the booking request.

### Change 2: Allow booking without time slot
- Removed `selectedSlot` from the required field validation in `handleBook`.
- Changed `timeSlot: selectedSlot` to `timeSlot: selectedSlot || ''` so an empty string is sent when no slot is selected.

### Change 3: "Request Without Time Slot" button
- Added a dashed-outline teal button after the time slots grid (visible when `selectedDate` is set and `showBookingForm` is false).
- Button text: "Request Without Time Slot (Join Queue)"
- Clicking it sets `showBookingForm(true)` without requiring a slot selection.

### Change 4: Summary panel updates for no-slot scenario
- Summary title now checks `showBookingForm` (instead of `selectedSlot`) to show "Confirm Booking" header.
- Time row in summary now shows when `showBookingForm` is true; displays `selectedSlot` if set, otherwise "Walk-in / Queue".
- Booking form visibility condition changed from `selectedSlot` to `showBookingForm`.
- Submit button text: shows "Confirm & Book" when slot selected, "Request Appointment" when no slot.
- Bottom hint condition changed from `!selectedSlot` to `!showBookingForm`.

## Lint Status
All changes pass ESLint with no errors.
