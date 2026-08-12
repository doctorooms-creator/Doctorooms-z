# Task 3 — Medicine Master Agent

## Task
Phase 3 - Rewrite Medicine Master with dose=JSON tags, timing=Int

## Files Modified
1. `src/app/api/dashboard/doctor/medicines/route.ts` — GET/POST API
2. `src/app/api/dashboard/doctor/medicines/[id]/route.ts` — PUT/DELETE API
3. `src/app/dashboard/doctor/medicines/page.tsx` — Full page rewrite

## Key Changes

### API (route.ts)
- **GET**: Parses `dose` JSON string → `doseArray: string[]` for frontend. Handles legacy single-string dose by wrapping in array.
- **POST**: Accepts `doseArray[]` from frontend, stores as `JSON.stringify(doseArray)`. morning/afternoon/evening are Int (clamped to ≥0). tab is Int (clamped to ≥1). description is instructions (AF/BF etc.).

### API ([id]/route.ts)
- **PUT**: Same doseArray/dose conversion. Int fields clamped. Returns parsed doseArray.
- **DELETE**: Unchanged (soft delete → status='Inactive').

### Page (page.tsx)
- **DoseTagInput** custom inline component: type + Enter/comma adds tag, X removes, Backspace removes last, first tag is teal-highlighted as 'default'.
- **Morning/Afternoon/Evening**: Number inputs (min 0) with Sun/CloudSun/Moon icons. Labels: 'Morning Tablets' / 'Afternoon Tablets' / 'Evening Tablets'. '0 = skip' hint.
- **Duration (Days)**: Replaces old 'Tablets' label for `tab` field.
- **Instructions**: Replaces old 'Notes / Description'. Short input with AF/BF/AC/PC hints.
- **Card display**: Dose shown as small badges (first highlighted), timing as '1-0-1' format badge, duration as '5 days' badge, instructions as amber badge.
- Preserved: teal color scheme, card grid layout, Dialog form, search/filter/delete, framer-motion animations, optimistic TanStack Query updates.

## Status
✅ Complete