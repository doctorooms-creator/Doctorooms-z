# 🏥 HOSPITAL MANAGEMENT SYSTEM — COMPLETE DEVELOPMENT PLAN
# Master Index

---

## 📌 DOCUMENT PURPOSE

This is the **master index** linking all 4 plan parts. Any AI agent must read this file FIRST, then read the relevant part file(s) before starting development.

**Execution Order:** Part 1 → Part 2 → Part 3 → Part 4 (strictly sequential, each phase builds on the previous)

---

## 📁 FILE INDEX

| # | File | Contains | Priority |
|---|------|----------|----------|
| 0 | **PLAN-INDEX.md** (this file) | Master index, execution rules, current state inventory | — |
| 1 | **PLAN-PART1.md** | Phase 1: Complete Billing System (P0) | P0 — Critical |
| 2 | **PLAN-PART2.md** | Phase 2: Lab/Pathology + Phase 3: Inventory Management (P1) | P1 — High |
| 3 | **PLAN-PART3.md** | Phase 4: Reports/Analytics + Phase 5: IPD Completion + OT + Diet (P1/P2) | P1/P2 |
| 4 | **PLAN-PART4.md** | Phase 6: Print System + Phase 7: Family Portal + Phase 8: WebSocket + Polish (P2/P3) | P2/P3 |

---

## 📊 CURRENT STATE INVENTORY

### Existing Roles (8)
`admin`, `doctor`, `patient`, `hospital`, `receptionist`, `assistant`, `pharmacist`, `nurse`

### Existing Prisma Models (40+)
User, Doctor, Hospital, Department, DoctorHospital, Booking, BookingChat, Prescription, PMedicine, PLabel, PSuggestion, PDignoTable, PCo, POtherSetting, DoctorRating, DoctorSchedule, DoctorHoliday, DoctorMedicine, CategoryMaster, FindingsMaster, FindingsMedicine, TableTemplateMaster, DoctorAssistant, DoctorPharmacist, Receptionist, DoctorTypeMaster, Post, Notification, Slider, HospitalInquiry, DiseaseMaster, LabelMaster, CoMaster, QuestionsMaster, SuggestionsMaster, DoctorGallery, PrescriptionAccessRequest, MedicalDocument, Ward, Bed, StaffNurse, NursePatientAssignment, IpdAdmission, VitalRecord, DoctorOrder, MedicineAdministration, SampleCollection, InvestigationReport, ShiftHandover, DoctorVisit

### Existing Dashboard Pages (~75+)
- admin: dashboard, users, doctors, hospitals, appointments, wards, nurses, blog, inquiries, settings
- doctor: dashboard, appointments, prescriptions, earnings, schedule, patients, medicines, prescription-settings/*, profile, gallery, posts, ipd
- patient: dashboard, appointments, health-records, prescription-access, blog, feedback, notifications, profile, settings
- hospital: dashboard, departments, department-doctors, doctors, appointments, queue-display, ipd (reuses receptionist)
- receptionist: dashboard, appointments, pending-bookings, walk-in, queue, print-queue, schedule, medicines, patients, reports, blog, profile, notifications
- assistant: dashboard, appointments, patients, prescription-queue
- pharmacist: dashboard, prescriptions, medicines
- nurse: dashboard, patients, ward-patients, handover, profile

### Existing API Routes (~90+)
All under `src/app/api/` — auth, users, doctors, hospitals, departments, bookings, prescriptions, medicines, wards, beds, nurses, ipd, vitals, doctor-orders, medicine-administration, sample-collection, investigation, shift-handover, doctor-visits, blog, notifications, inquiries, etc.

---

## 🔧 DEVELOPMENT RULES (AI MUST FOLLOW)

1. Follow phases in order (P0 → P1 → P2 → P3)
2. Within each phase, sub-phases can be parallelized where marked `[PARALLEL]`
3. Always run `bun run db:push` after schema changes
4. Always add dev users to `api-auth.ts` DEV_USERS for new roles
5. Always add sidebar entries to `sidebar-config.ts`
6. Use existing shadcn/ui components from `src/components/ui/`
7. Use `requireRole(req, 'roleName')` for API auth
8. Use `getAuthUser(req)` for any-role auth
9. Use `import { db } from '@/lib/db'` for database
10. Use TanStack Query (`useQuery`, `useMutation`) for data fetching
11. All API routes go under `src/app/api/`
12. All dashboard pages go under `src/app/dashboard/{role}/`
13. Each page = `page.tsx` (server wrapper) + `client.tsx` (client component)
14. Use `date-fns` for date formatting
15. Use `sonner` for toast notifications
16. Use `lucide-react` for icons
17. Use Tailwind CSS 4 classes only
18. Footer must be sticky to bottom
19. No indigo/blue colors unless specified
20. Responsive: mobile-first design
21. Tech: Next.js 16, App Router, TypeScript 5, Tailwind CSS 4, shadcn/ui, Prisma SQLite, TanStack Query, Framer Motion, Socket.io
22. For WebSocket/real-time: create mini-service in `mini-services/` with its own port
23. Gateway: all cross-service requests use `?XTransformPort={Port}` query param
24. Never write absolute URLs with port numbers in frontend code

---

## 🗺️ PHASE MAP OVERVIEW

| Phase | Module | Priority | New Models | New APIs | New Pages | Part File |
|-------|--------|----------|------------|----------|-----------|-----------|
| 1A | Schema (All new models) | P0 | 20+ | 0 | 0 | PART1 |
| 1B | Charge Master | P0 | 2 | 4 | 3 | PART1 |
| 1C | IPD Bill Creation | P0 | 3 | 5 | 2 | PART1 |
| 1D | Advance Deposit | P0 | 1 | 3 | 2 | PART1 |
| 1E | Payment Collection | P0 | 1 | 4 | 3 | PART1 |
| 1F | Discharge Flow | P0 | 0 | 3 | 2 | PART1 |
| 1G | OPD Billing | P0 | 1 | 3 | 2 | PART1 |
| 1H | Bill Dashboard + Receipt | P0 | 0 | 2 | 2 | PART1 |
| 2A | Lab Test Master | P1 | 2 | 4 | 2 | PART2 |
| 2B | Lab Technician Role | P1 | 1 | 3 | 3 | PART2 |
| 2C | Lab Worklist + Result Entry | P1 | 2 | 5 | 3 | PART2 |
| 2D | Lab Report View + Print | P1 | 0 | 2 | 2 | PART2 |
| 3A | Inventory Item Master | P1 | 1 | 4 | 2 | PART2 |
| 3B | Stock Movements | P1 | 1 | 4 | 2 | PART2 |
| 3C | Purchase Orders | P1 | 1 | 4 | 2 | PART2 |
| 3D | Low Stock Alerts | P1 | 0 | 2 | 2 | PART2 |
| 4A | Revenue Dashboard | P1 | 0 | 6 | 4 | PART3 |
| 4B | IPD Analytics | P1 | 0 | 4 | 2 | PART3 |
| 4C | OPD + Financial Reports | P1 | 0 | 4 | 2 | PART3 |
| 4D | Inventory + Lab Reports | P1 | 0 | 4 | 2 | PART3 |
| 5A | IPD N-2→N-8 Completion | P2 | 4 | 12 | 8 | PART3 |
| 5B | Operation Theater | P2 | 3 | 6 | 4 | PART3 |
| 5C | Bed Transfer | P2 | 1 | 3 | 2 | PART3 |
| 5D | Diet Order | P2 | 1 | 3 | 2 | PART3 |
| 6A | Print Templates | P2 | 0 | 0 | 8 | PART4 |
| 6B | A4 CSS Print Engine | P2 | 0 | 0 | 1 | PART4 |
| 7A | Family Portal Access | P3 | 1 | 3 | 3 | PART4 |
| 7B | Public Status Page | P3 | 0 | 2 | 2 | PART4 |
| 8A | WebSocket Service | P3 | 0 | 0 | 0 | PART4 |
| 8B | Real-time Notifications | P3 | 0 | 3 | 0 | PART4 |
| 8C | Mobile Optimization + PWA | P3 | 0 | 0 | 0 | PART4 |
| 8D | Admin Settings Polish | P3 | 0 | 2 | 2 | PART4 |
