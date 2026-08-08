# Task R4: Layout Components, Constants & Public API Routes

## Status: Completed

## Files Created

### Library
- `src/lib/constants.ts` — APP_NAME, SPECIALIZATIONS, GENDERS, BLOOD_GROUPS

### Layout Components
- `src/components/layout/public-navbar.tsx` — Responsive sticky navbar with theme toggle, mobile sheet menu
- `src/components/layout/public-footer.tsx` — 4-col dark footer with brand, quick links, doctor links, legal
- `src/components/layout/public-layout.tsx` — Wrapper combining Navbar + children + Footer
- `src/components/layout/back-to-top.tsx` — Animated back-to-top button (framer-motion)

### API Routes
- `src/app/api/public/stats/route.ts` — GET platform stats (doctors, hospitals, patients, bookings)
- `src/app/api/doctors/route.ts` — GET doctors list with search/specialization filters
- `src/app/api/doctors/[id]/route.ts` — GET single doctor with ratings and hospital info
- `src/app/api/contact/route.ts` — POST contact form submission
- `src/app/api/hospitals/route.ts` — GET hospitals list
- `src/app/api/blog/route.ts` — GET blog posts list

## Lint: PASSED (no errors)
