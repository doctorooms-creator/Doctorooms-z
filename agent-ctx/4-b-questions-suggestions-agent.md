# Task 4-b: Questions + Suggestions Master Pages + APIs

## Status: COMPLETED

## Files Created/Modified

### API Routes (4 files)
- `src/app/api/dashboard/doctor/prescription-settings/questions/route.ts` — GET (list with search/coId/status filters, includes co relation) + POST (create with validation)
- `src/app/api/dashboard/doctor/prescription-settings/questions/[id]/route.ts` — PUT (partial update) + DELETE (soft delete)
- `src/app/api/dashboard/doctor/prescription-settings/suggestions/route.ts` — GET (list with search/questionId/status filters, includes question relation) + POST (create with validation)
- `src/app/api/dashboard/doctor/prescription-settings/suggestions/[id]/route.ts` — PUT (partial update) + DELETE (soft delete)

### Page Components (2 files overwritten)
- `src/app/dashboard/doctor/prescription-settings/questions/page.tsx` — Full CRUD page with table, search, complaint filter, status toggle, dialog form, mobile card view
- `src/app/dashboard/doctor/prescription-settings/suggestions/page.tsx` — Full CRUD page with table, search, question filter, status toggle, dialog form, mobile card view

## Patterns Followed
- Auth: `requireRole(req, 'doctor')` + doctor ownership check
- API response shapes match existing complaints API: `{ questions: [...] }`, `{ suggestion: {...} }`
- Page components match complaints page pattern: TanStack Query, optimistic mutations, framer-motion, teal theme, shadcn/ui

## Notes
- Lint has pre-existing error in `prescription-settings/layout.tsx` (not from this task)
- Questions → linked to CoMaster (complaints) via `coId`
- Suggestions → linked to QuestionsMaster via `questionId`
