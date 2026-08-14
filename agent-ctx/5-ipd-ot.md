# Task 5-ipd-ot: Phase 5 — IPD Completion + OT + Bed Transfer + Diet Orders

## Agent: Main
## Status: COMPLETE

### Files Created (22)

#### Phase 5A: IPD Completion APIs (8 files)
1. `src/app/api/ipd-doctor-visits/route.ts` — POST + GET
2. `src/app/api/ipd-doctor-visits/[id]/route.ts` — PUT
3. `src/app/api/investigation-reports/route.ts` — POST + GET
4. `src/app/api/ipd-sample-collections/route.ts` — POST + GET
5. `src/app/api/ipd-sample-collections/[id]/collect/route.ts` — PUT
6. `src/app/api/ipd-sample-collections/[id]/send-to-lab/route.ts` — PUT
7. `src/app/api/shift-handovers/route.ts` — POST + GET
8. `src/app/api/shift-handovers/[id]/acknowledge/route.ts` — PUT

#### Phase 5B: Operation Theater (6 API + 4 UI = 10 files)
9. `src/app/api/operation-theaters/route.ts` — POST + GET
10. `src/app/api/operation-theaters/[id]/route.ts` — PUT + DELETE
11. `src/app/api/ot-schedules/route.ts` — POST + GET
12. `src/app/api/ot-schedules/today/route.ts` — GET
13. `src/app/api/ot-schedules/[id]/route.ts` — GET + PUT
14. `src/app/dashboard/hospital/ot/page.tsx` — Server wrapper
15. `src/app/dashboard/hospital/ot/client.tsx` — OT Board UI
16. `src/app/dashboard/doctor/ot-surgeries/page.tsx` — Server wrapper
17. `src/app/dashboard/doctor/ot-surgeries/client.tsx` — Doctor surgeries UI

#### Phase 5C: Bed Transfer (1 API + 2 UI = 3 files)
18. `src/app/api/bed-transfers/route.ts` — POST + GET
19. `src/app/dashboard/hospital/bed-transfer/page.tsx` — Server wrapper
20. `src/app/dashboard/hospital/bed-transfer/client.tsx` — Transfer UI

#### Phase 5D: Diet Order (2 API files)
21. `src/app/api/diet-orders/route.ts` — POST + GET
22. `src/app/api/diet-orders/[id]/stop/route.ts` — PUT

### Key Design Decisions
- OT schedule auto-generates scheduleNo: OT-YYYY-NNNN
- OT availability auto-managed on schedule create/status change
- Bed transfer runs in Prisma transaction (free old, occupy new, update admission, create record)
- Sample collection auto-resolves nurse from NursePatientAssignment or ward fallback
- All UI: shadcn/ui, TanStack Query, sonner, lucide-react, responsive, no indigo/blue
