# Doctorooms v2 — Complete Rebuild Worklog

## 🔧 Architecture Fix Session (2026-08-08 — Round 2)

### Problem Statement
User reported "web is not working again" — preview panel showing broken/blank page.

### Root Cause Analysis (Architect Diagnosis)

#### Issue #1 — CRITICAL: Import Bug (PublicLayout Export Mismatch) 🔴
- **Symptom**: All public pages except homepage returned HTTP 500
- **Pages affected**: `/doctors`, `/hospitals`, `/blog`, `/blog/[permalink]`, `/about`, `/contact`, `/doctors/[id]`
- **Root cause**: `PublicLayout` is exported as a **named export** (`export function PublicLayout`) but 7 pages imported it as a **default export** (`import PublicLayout from`)
- **Error message**: `Export default doesn't exist in target module`
- **Fix**: Changed all 7 files from `import PublicLayout from` → `import { PublicLayout } from`
- **Why homepage worked**: `page.tsx` imports it correctly as `{ PublicLayout }`

#### Issue #2 — Dev Server Not Running 🔴
- **Symptom**: Connection refused / blank page in preview
- **Root cause**: Dev server process (port 3000) was not running — previous session's processes died when context reset
- **Fix**: Server restarted with `npx next dev --port 3000`
- **Note**: Background processes from bash tool get killed when tool session ends; server must be restarted each session

#### Issue #3 — Cross-Origin Resource Blocking 🟡
- **Symptom**: `⚠ Blocked cross-origin request from 127.0.0.1 to /_next/* resource`
- **Root cause**: `next.config.ts` `allowedDevOrigins` was missing `127.0.0.1`, `localhost`, and the server's network IP
- **Fix**: Added `127.0.0.1`, `localhost`, `21.0.4.19` to `allowedDevOrigins`

#### Issue #4 — Missing Profile Image 🟡
- **Symptom**: 404 for `/default.png` (all users have `profileImg: "default.png"`)
- **Fix**: Created `public/default.png` — teal circular avatar placeholder (200×200 PNG, 6.8KB)

#### Issue #5 — Platform Proxy (port 81) Not Routing to App 📋
- **Observation**: System Caddy on port 81 serves a Z.ai placeholder page, NOT proxying to Next.js
- **Status**: This is platform-level behavior; the preview panel uses its own routing mechanism
- **Impact**: agent-browser cannot verify the app (Chrome runs in isolated network namespace)

### Files Modified
| File | Change |
|------|--------|
| `src/app/doctors/page.tsx` | Named import fix |
| `src/app/doctors/[id]/page.tsx` | Named import fix |
| `src/app/hospitals/page.tsx` | Named import fix |
| `src/app/blog/page.tsx` | Named import fix |
| `src/app/blog/[permalink]/page.tsx` | Named import fix |
| `src/app/about/page.tsx` | Named import fix |
| `src/app/contact/page.tsx` | Named import fix |
| `next.config.ts` | Added allowedDevOrigins entries |
| `public/default.png` | Created teal avatar placeholder |

### Verification Results (post-fix)
```
/              -> 200 ✅
/login         -> 200 ✅
/doctors       -> 200 ✅ (was 500 ❌)
/hospitals     -> 200 ✅ (was 500 ❌)
/blog          -> 200 ✅ (was 500 ❌)
/about         -> 200 ✅ (was 500 ❌)
/contact       -> 200 ✅ (was 500 ❌)
/api/public/stats  -> 200 ✅ (returns real data)
/api/doctors       -> 200 ✅ (returns 3 doctors)
/api/auth/login    -> 200 ✅ (admin login works)
ESLint             -> 0 errors ✅
```

### Database
- **Engine**: SQLite (file: `/home/z/my-project/db/custom.db`, 422KB)
- **Prisma schema**: 30 models, provider = sqlite
- **Seed data**: 10 users, 3 doctors, 1 hospital, 4 bookings, 10 blog posts, 3 ratings
- **Note**: Previous session mentioned Supabase PostgreSQL but schema is actually SQLite (port 5432 blocked in sandbox)

### Environment
- `.env`: `DATABASE_URL=file:/home/z/my-project/db/custom.db`, `NEXTAUTH_SECRET` set
- Next.js 16.1.3 with Turbopack
- Dev server on port 3000

---

## Current Project Status (as of 2026-08-08)

### Assessment
Full rebuild from scratch completed in 4 phases. The project now has a comprehensive medical platform with:
- **30 Prisma models** covering all entities from the original Doctorooms PHP app
- **7 role dashboards** (Admin, Doctor, Patient, Hospital, Receptionist, Assistant, Pharmacist)
- **35+ pages** across public and dashboard areas
- **50+ API routes** with proper auth protection
- **Complete auth flow** (Login, Register, Forgot Password with OTP)
- **Seed data** (10 users, 3 doctors with profiles, 8 hospitals, 12 doctors, 10 blog posts, 4 appointments, 3 ratings)
- **Zero ESLint errors**
- **GitHub repo** with 5 commits, auto-push enabled

### Pages Built

#### Public Pages (8)
| Page | Route | Features |
|------|-------|----------|
| Homepage | `/` | 8 sections, real API data, stats, doctor cards, specializations, testimonials |
| Doctors | `/doctors` | Search, filters (specialization/city/state), cards with ratings, verified badges |
| Doctor Detail | `/doctors/[id]` | Full profile, stats, 7-day calendar, share button, related doctors |
| Hospitals | `/hospitals` | Search, city filter, sort, featured badges, hover effects |
| Blog | `/blog` | Category tabs (All/Blog/News), cards, pagination |
| Blog Detail | `/blog/[permalink]` | Article, sticky TOC, social share, related posts, reading time |
| About | `/about` | Hero, Mission/Vision/Values, team, stats, Why Choose Us |
| Contact | `/contact` | Form, info cards, office hours, map placeholder |

#### Auth Pages (3)
| Page | Route | Features |
|------|-------|----------|
| Login | `/login` | Demo credentials, breathing animation, dot pattern, role cards |
| Register | `/register` | 3-step flow, password strength, role selection, terms |
| Forgot Password | `/forgot-password` | 3-step OTP flow, auto-advance, 45s timer, success state |

#### Dashboard Pages (26)
| Role | Pages |
|------|-------|
| **Admin** (8) | Dashboard, Users, Doctors, Hospitals, Appointments, Blog, Inquiries, Settings |
| **Doctor** (10) | Dashboard, Appointments, Prescriptions (list/new/[id]), Schedule, Patients, Profile, Gallery, Posts |
| **Patient** (6) | Dashboard, Appointments (list/[id]), Health Records, Feedback, Profile |
| **Hospital** (3) | Dashboard, Doctors, Appointments |
| **Receptionist** (3) | Dashboard, Appointments, Patients |
| **Assistant** (3) | Dashboard, Appointments, Patients |
| **Pharmacist** (3) | Dashboard, Prescriptions, Medicines |

### API Routes (50+)
- Auth: login, register, forgot-password, verify-otp, reset-password, NextAuth
- Public: stats, doctors (list/detail), hospitals, blog (list/detail), contact
- Admin: users (list/status/delete), doctors, hospitals, appointments, blog CRUD, inquiries, settings
- Doctor: stats, appointments (list/status), prescriptions (list/create/[id]), schedule, holidays, patients, profile, gallery, posts
- Patient: stats, appointments (list/[id]), medical-documents (list/create/[id]), feedback, profile
- Hospital: stats, doctors, appointments
- Receptionist: stats, appointments (list/create/status), patients
- Assistant: stats, appointments, patients
- Pharmacist: stats, prescriptions, medicines (CRUD)

### Database Schema (30 models)
User, Doctor, Hospital, Booking, BookingChat, Prescription, PMedicine, PLabel, PSuggestion, PDignoTable, PCo, POtherSetting, DoctorRating, DoctorSchedule, DoctorHoliday, DoctorMedicine, DoctorAssistant, DoctorPharmacist, Receptionist, DoctorTypeMaster, Post, Notification, Slider, HospitalInquiry, DiseaseMaster, LabelMaster, CoMaster, QuestionsMaster, SuggestionsMaster, DoctorGallery, MedicalDocument

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@doctorooms.com | admin123 |
| Doctor | rajesh@doctorooms.com | doctor123 |
| Patient | rahul@doctorooms.com | patient123 |
| Hospital | city@doctorooms.com | hospital123 |
| Receptionist | meera@doctorooms.com | receptionist123 |
| Assistant | vikram@doctorooms.com | assistant123 |
| Pharmacist | kavita@doctorooms.com | pharmacist123 |

### Git History
1. `2587718` — Phase 1: Complete Prisma schema (30 models) + seed data
2. `98fbad1` — Phase 2: Auth + Public pages + Dashboard infrastructure
3. `e8319a7` — Phase 3: Patient + Doctor + Admin dashboards
4. `002790c` — Phase 4: Hospital + Receptionist + Assistant + Pharmacist dashboards
5. `6297528` — Phase 5: CSS enhancements + polish

### Unresolved / Next Phase Priorities
1. **Doctor time slot booking flow** — Patient books specific time slot from doctor's schedule
2. **Payment integration** — Appointment payment flow
3. **Real-time chat** — WebSocket chat between patient and doctor (chat-service exists on port 3004)
4. **Prescription print template** — Professional print layout with doctor logo/settings
5. **Email/SMS notifications** — Integration with real email/SMS gateways
6. **File upload handling** — Profile photos, medical documents, gallery images
7. **OTP verification for registration** — Mobile verification flow
8. **More seed data** — More doctors, hospitals, blog posts with images
9. **Homepage slider** — Image slider using Slider model data
10. **Accessibility audit** — ARIA labels, keyboard navigation improvements
11. **Performance optimization** — Image optimization, code splitting, caching
12. **Hospital profile page** — /hospitals/[id] detail page
13. **Admin appointment booking** — Book on behalf of patient (By Hospital type)

---

## Deep Audit: Pages (Task 2)

### Methodology
Every `page.tsx` file under `src/app/` was read in full (48 files). Each was evaluated for:
- **Rendering type**: Client ('use client') or Server component
- **Data sources**: Real API calls, useQuery hooks, or hardcoded/mock data
- **Forms**: Presence of interactive forms with submit handlers
- **Key features**: Main UI/UX capabilities
- **Status**: COMPLETE (real API, working CRUD/interactions), PARTIAL (real API reads but missing features or mock data mixed in), SKELETON (shell only, no real logic)
- **Issues**: Bugs, hardcoded values, dead links, missing features

### Full Page Audit Table

| # | Route | Client/Server | Data Sources | Forms | Key Features | Status | Issues |
|---|-------|---------------|-------------|-------|-------------|--------|--------|
| 1 | `/` (Homepage) | Client | `/api/public/stats`, `/api/doctors?limit=3` + hardcoded fallbacks | None (search bar is non-functional — no navigation) | 8 sections: Hero with animated stethoscope, Stats with count-up, How It Works, Featured Doctors, Specializations (random doctor counts), Why Choose Us, Testimonials (hardcoded), CTA | **PARTIAL** | Fallback data has wrong interface shape (`doctorProfile` vs `doctor`); specialization doctor counts use `Math.random()` so they change on every render; hero search bar has no submit/action; `/book` CTA link goes to non-existent page |
| 2 | `/login` | Client | `/api/auth/login` | Login form (email, password, remember me) | Animated login with demo credential auto-fill for 7 roles, password show/hide, toast notifications | **COMPLETE** | Hardcoded branding stats (500+ Doctors, 50K+ Patients); `rememberMe` checkbox value is captured but never sent to API |
| 3 | `/register` | Client | `/api/auth/register` | 3-step form: Role selection, Personal details (name/email/mobile/gender), Password with strength meter + terms | Animated step wizard with slide transitions, password strength indicator, role cards with icons, shimmer effect on submit button | **COMPLETE** | Terms/Privacy links have no `href`; no mobile OTP verification (mentioned as TODO); no role-specific fields (e.g., hospital name, specialization) |
| 4 | `/forgot-password` | Client | `/api/auth/forgot-password`, `/api/auth/verify-otp`, `/api/auth/reset-password` | 3-step form: Email input, 6-digit OTP with auto-advance, New password with requirements checklist | OTP timer (45s), resend capability, password requirement checks (length, uppercase, number, special char), success animation | **COMPLETE** | OTP is shown in toast as `(Demo: ${data.otp})` — acceptable for demo but must be removed for production; no session management between steps (page refresh loses state) |
| 5 | `/doctors` | Client | `/api/doctors?search&specialization&city&state` (returns doctors, cities, states) | None (search + filter controls only) | Hero banner, debounced search, expandable filter panel (specialization, city, state), skeleton loading, staggered card animations, verified badge on all doctors, star ratings, fee display, empty state | **PARTIAL** | `isVerified` is hardcoded to `true` for all doctors; no pagination (returns all results); missing sort option; card says "Book Appointment" but links to doctor detail page |
| 6 | `/doctors/[id]` | Client | `/api/doctors/${id}` (returns doctor with schedules and related doctors) | None (time slot selection only — no booking submit) | Full profile card, 7-day availability calendar with time slot generation, related doctors sidebar, share profile (clipboard), fee display, emergency badge, loading/error states | **PARTIAL** | `avgRating` (4.5), `ratingCount` (128), `patientCount` (1250) are hardcoded — not from API; Book button has no `onClick` handler — selecting a slot enables the button but it does nothing; time slots don't check existing bookings |
| 7 | `/hospitals` | Client | `/api/hospitals?search&city&sort` (returns hospitals, cities) | None (search + filter controls only) | Hero banner, search with debounce, city + sort filters, colored top borders, featured badges (first 2 hospitals), skeleton loading, empty state | **PARTIAL** | Featured badge logic is `idx < 2` (positional, not data-driven); no pagination; no hospital detail page link (clicking cards does nothing); missing rating/hospital type info; no click-to-view detail |
| 8 | `/blog` | Client | `/api/blog?page&limit&type` (returns posts, totalPages) | None (category tabs + pagination controls) | Hero banner, category tabs (All/Blog/News), paginated card grid, excerpt generation, reading time estimation, image or icon fallback, skeleton loading, empty state | **COMPLETE** | No search functionality; `blogImg` uses raw `<img>` tag (should use Next.js `Image`); `PAGE_SIZE=9` but no grid size options |
| 9 | `/blog/[permalink]` | Client | `/api/blog/${permalink}` (returns post + relatedPosts) | None | Sticky table of contents with IntersectionObserver scroll tracking, social share (Twitter/Facebook/LinkedIn/WhatsApp/Copy Link), reading time estimate, related articles, heading IDs auto-generated, prose styling | **COMPLETE** | `shareUrl` computed at render time (SSR warning: `window` not available during SSR — the ternary handles this but it's fragile); `dangerouslySetInnerHTML` for content (XSS risk if admin content is not sanitized); no comment section |
| 10 | `/about` | Client | None (all hardcoded) | None | Hero section, Mission/Vision/Values cards, stats counter (hardcoded 500+/150+/50K+/100K+), team section (6 members), Why Choose Us grid | **PARTIAL** | `AnimatedCounter` receives parsed number but the suffix handling is reversed (it shows parsed number + non-numeric suffix which works but the naming is confusing); all data is hardcoded — no API integration for real stats or team data; team members are fictional |
| 11 | `/contact` | Client | `/api/contact` (POST) | Contact form (name*, email*, phone, subject, message*) | Hero banner, form with validation, success state with animation, contact info cards (email/phone/address), office hours, map placeholder | **COMPLETE** | Map is a placeholder (just a colored div); contact info (phone, address) is hardcoded; no file attachment support; `submitted` state doesn't reset when navigating away and back |
| 12 | `/dashboard` | Client | `next-auth` session only | None | Role-based redirect — checks `session.user.role` and redirects to `/dashboard/${role}`; unauthenticated users go to `/login` | **COMPLETE** | Returns `null` while redirecting (brief flash of empty page); no loading indicator |
| 13 | `/dashboard/admin` | Client | `/api/dashboard/admin/stats` | None | 4 stat cards (users, doctors, appointments, revenue), recent appointments table, user role distribution with animated bars, quick action links | **COMPLETE** | Revenue trend value (18%) is hardcoded; "View All" buttons on recent appointments don't link anywhere (no `href`); StatCard trend values are all hardcoded |
| 14 | `/dashboard/admin/users` | Client | `/api/dashboard/admin/users?role&search&page`, `/api/dashboard/admin/users/${id}/status`, `/api/dashboard/admin/users/${id}` (DELETE) | None (uses inline dialogs, not a form) | Paginated user table with role tabs, search, role count badges, view detail dialog, activate/block toggle, delete with confirmation alert, avatar display | **COMPLETE** | No create user form; view dialog shows user details but has no edit capability; delete uses `confirm()`-style alert dialog but no undo; pagination is client-side from API response |
| 15 | `/dashboard/admin/doctors` | Client | `/api/dashboard/admin/doctors?search&city&specialization`, `/api/dashboard/admin/users/${id}/status` | None | Doctor table with search, city/specialization filters, status badges, activate/block toggle | **PARTIAL** | No create/edit doctor; no view doctor detail; no delete; no pagination; fewer features compared to users page; no way to manage doctor profiles from admin |
| 16 | `/dashboard/admin/hospitals` | Client | `/api/dashboard/admin/hospitals?search&city` | None | Hospital table with search, city filter, status toggle | **PARTIAL** | No create/edit/delete hospital; no view detail; no pagination; very basic compared to users page; no doctor-to-hospital assignment management |
| 17 | `/dashboard/admin/appointments` | Client | `/api/dashboard/admin/appointments?status&search` | None | Appointment table with status filter tabs, search, status badges, date formatting | **PARTIAL** | No create appointment; no status change actions; no detail view; no pagination; read-only list with no management capabilities |
| 18 | `/dashboard/admin/blog` | Client | `/api/dashboard/admin/blog?search`, `/api/dashboard/admin/blog` (POST), `/api/dashboard/admin/blog/${id}` (PUT, DELETE) | Create/Edit post dialog (title, permalink, content, type, blogImg) | Full CRUD: list with search, create dialog with all fields, edit pre-fills dialog, delete with confirmation, content textarea for HTML | **COMPLETE** | Content is edited as raw HTML (no rich text editor); `blogImg` is a URL input (no file upload); no image preview in form; permalink must be manually entered |
| 19 | `/dashboard/admin/inquiries` | Client | `/api/dashboard/admin/inquiries?search`, `/api/dashboard/admin/inquiries` (POST reply) | Reply dialog (message textarea) | Inquiry list with search, detail dialog showing message + reply, reply form with toast feedback | **COMPLETE** | No delete inquiry; no status management (open/closed); no pagination; reply creates a new entry but doesn't update inquiry status |
| 20 | `/dashboard/admin/settings` | Client | `/api/admin/settings` (GET, PUT) | Settings form (site name, tagline, email, phone, address, meta title, meta description) | Tabbed settings: General, Social Links, Theme Preferences (dark mode toggle, accent color), save with loading state | **PARTIAL** | Social links and theme preference tabs likely save to the same settings record (may overwrite each other); no separate API for theme; dark mode/accent color settings save but may not apply in real-time |
| 21 | `/dashboard/doctor` | Client | `/api/dashboard/doctor/stats` | None | 4 stat cards, today's appointment list with status badges, recent reviews with star ratings, quick action links | **COMPLETE** | Trend percentages are hardcoded; StatCard trend data not from API; reviews show `patientImg` but avatar may not load for default.png |
| 22 | `/dashboard/doctor/appointments` | Client | `/api/dashboard/doctor/appointments?status`, `/api/dashboard/doctor/appointments/${id}/status` (PATCH) | None (status change via dropdown/buttons) | Status tab filter, appointment list/table, status update action (Approve/Visited/Finish/Cancel) | **COMPLETE** | No search; no pagination; status update is optimistic (no confirmation); no appointment detail view |
| 23 | `/dashboard/doctor/prescriptions` | Client | `/api/dashboard/doctor/prescriptions?search` | None | Searchable prescription list with disease, patient name, date, medicine count | **PARTIAL** | No pagination; very simple list view (no table); no filters; no print/view detail from this page; only shows summary data |
| 24 | `/dashboard/doctor/prescriptions/new` | Client | `/api/dashboard/doctor/appointments?status=Approve`, `/api/dashboard/doctor/appointments?status=Visited`, `/api/dashboard/doctor/prescriptions` (POST) | Complex form: appointment select, patient vitals (age, weight, BP, temperature, disease), dynamic medicine rows (name, tabs, dose, morning/afternoon/evening, description), dynamic labels (key-value), doctor notes | Full prescription builder with appointment auto-fill, add/remove medicines, add/remove labels, validation, redirects to prescription detail after save | **COMPLETE** | No diagnosis code/disease dropdown (free text); no allergy field; no co-morbidity section; no print preview before save; no drug interaction checks |
| 25 | `/dashboard/doctor/prescriptions/[id]` | Client | `/api/dashboard/doctor/prescriptions/${id}` (GET, PUT) | Edit form: patient vitals, medicines (dynamic add/remove), labels, suggestions, other settings, description | Full prescription view/edit, add/remove medicines and labels inline, suggestion builder (question + suggestions), other settings (co-morbidities, follow-up), save with mutation | **COMPLETE** | Very long file (483 lines) doing a lot; no print button; no prescription history/versions; complex nested state management |
| 26 | `/dashboard/doctor/schedule` | Client | `/api/dashboard/doctor/schedule` (GET, PUT), `/api/dashboard/doctor/holidays` (GET, POST, DELETE) | Schedule form: day checkboxes, start/end time, slot duration; Holiday form: date, reason | Weekly schedule builder (set days + time + slot duration), holiday list with add/delete, schedule save | **COMPLETE** | No per-day schedule (one schedule for all selected days); no break times; no override dates; slot duration is global for all days |
| 27 | `/dashboard/doctor/patients` | Client | `/api/dashboard/doctor/patients?search` | None | Patient card grid with search, avatar, gender, mobile, total visits, last visit date | **PARTIAL** | No pagination; no patient detail view; no click action; cards are display-only; search debounce uses `setTimeout` directly instead of `useCallback` with cleanup |
| 28 | `/dashboard/doctor/profile` | Client | `/api/dashboard/doctor/profile` (GET, PUT) | Profile edit form: name, email, mobile, gender, specialization, education, experience, city, state, address, fees, emergency charge, emergency toggle, description, contact | Complete profile editor with all fields, pre-populated from API, save with toast | **COMPLETE** | No profile image upload (only URL field possibly); no password change; no delete account; no preview |
| 29 | `/dashboard/doctor/gallery` | Client | `/api/dashboard/doctor/gallery` (GET, POST, DELETE) | Upload dialog (image URL input) | Photo grid with hover delete button, upload by URL dialog, delete confirmation, image preview overlay (full-screen) | **PARTIAL** | Upload is URL-only (no file upload); no drag-and-drop; no image cropping; no alt text; preview is a raw overlay div (not a proper modal); no reorder |
| 30 | `/dashboard/doctor/posts` | Client | `/api/dashboard/doctor/posts` (GET, POST, DELETE) | Create/edit dialog (title, content, type) | Blog post list with create dialog, content as HTML textarea, delete with confirmation | **COMPLETE** | No rich text editor (raw HTML); no image upload; no permalink management; no draft/published toggle |
| 31 | `/dashboard/patient` | Client | `/api/dashboard/patient/stats` | None | 4 stat cards, upcoming appointments list, quick actions (book, upload, appointments, feedback), recent activity timeline | **COMPLETE** | Trend values hardcoded; "Upload Document" quick action links to health-records; all links are properly routed |
| 32 | `/dashboard/patient/appointments` | Client | `/api/dashboard/patient/appointments?status&page` | None | Paginated appointment list with status tabs, doctor avatar, specialization, date, status badges, "View" link per appointment | **PARTIAL** | No search; page-based pagination from API; no cancel appointment action; status tabs use string matching |
| 33 | `/dashboard/patient/appointments/[id]` | Client | `/api/dashboard/patient/appointments/${id}` | Chat form (message textarea + send button) | Appointment detail: doctor card, patient card, appointment info, chat messages with sender bubbles, status timeline, embedded prescription view (vitals, medicines, labels, suggestions) | **PARTIAL** | Chat `handleSendMessage` only shows toast "Chat messages require WebSocket connection — coming soon!" — non-functional; no cancel appointment action; chat input exists but does nothing |
| 34 | `/dashboard/patient/health-records` | Client | `/api/patient/medical-documents?page&limit`, `/api/patient/medical-documents` (POST), `/api/patient/medical-documents/${id}` (DELETE) | Upload dialog (title, description, document type select, file URL) | Tabbed view (All, Prescriptions, Lab Reports, Other), document cards with type badges, create dialog with type selection, delete with confirmation | **PARTIAL** | File upload is URL-only (no real file upload); no file preview; no download link; document type filtering depends on API |
| 35 | `/dashboard/patient/feedback` | Client | `/api/patient/feedback` (GET, POST) | Rating dialog (star selector, review textarea, recommend toggle) | Feedback list with star ratings, review text, doctor info, date; create feedback dialog with interactive star picker, recommend switch | **COMPLETE** | No edit feedback; no delete; one feedback per appointment (API should enforce); no anonymous option; star picker uses onClick with number |
| 36 | `/dashboard/patient/profile` | Client | `/api/patient/profile` (GET, PUT) | Profile edit form (name, email, mobile, gender, blood group, age, weight, address) | Profile viewer/editor with all fields, save with mutation and toast | **COMPLETE** | No profile image upload; no password change; no account deletion; no medical history summary |
| 37 | `/dashboard/hospital` | Client | `/api/dashboard/hospital/stats` | None | 3 stat cards, doctor list with ratings/appointment counts, recent appointments table, quick action links | **COMPLETE** | Hardcoded trend values; no add-doctor action from dashboard |
| 38 | `/dashboard/hospital/doctors` | Client | `/api/dashboard/hospital/doctors?search&specialization` | None | Doctor table/grid with search, specialization filter, status badge, rating, appointment count | **PARTIAL** | No add/remove doctor; no edit; no detail view; no pagination; read-only display |
| 39 | `/dashboard/hospital/appointments` | Client | `/api/dashboard/hospital/appointments?status&doctorId&search` | None | Status tab filter, doctor filter dropdown, search, appointment table with all details | **PARTIAL** | No create appointment; no status change; no detail view; no pagination; read-only display |
| 40 | `/dashboard/receptionist` | Client | `/api/dashboard/receptionist/stats` | None | 3 stat cards, today's appointment table, doctor info card, quick action links (create appointment, manage patients) | **COMPLETE** | Quick action for "Create Appointment" links to appointments page (should link to create dialog) |
| 41 | `/dashboard/receptionist/appointments` | Client | `/api/dashboard/receptionist/appointments` (GET, POST), `/api/dashboard/receptionist/appointments` (status change) | Create appointment dialog (patient, doctor, date, time, disease, description, charge) | Full appointment list with status tabs, search, create dialog with doctor/patient selects, status update (Approve/Visited/Finish/Cancel), delete confirmation | **COMPLETE** | No time slot validation against doctor schedule; no duplicate booking check; no payment integration; status update is immediate with no confirmation |
| 42 | `/dashboard/receptionist/patients` | Client | `/api/dashboard/receptionist/patients?search` | None | Patient table/grid with search, avatar, mobile, gender, total appointments, last visit | **PARTIAL** | No pagination; no patient detail view; no add patient; no click action; read-only display |
| 43 | `/dashboard/assistant` | Client | `/api/dashboard/assistant/stats` | None | 3 stat cards, today's appointment table, doctor info card with link, quick action links | **COMPLETE** | Similar structure to receptionist; trend values hardcoded |
| 44 | `/dashboard/assistant/appointments` | Client | `/api/dashboard/assistant/appointments?status&search` | None | Status tab filter, search, appointment table with doctor/patient info | **PARTIAL** | No create appointment; no status change; no detail view; no pagination; read-only list |
| 45 | `/dashboard/assistant/patients` | Client | `/api/dashboard/assistant/patients?search` | None | Patient search with card display (name, mobile, visits) | **PARTIAL** | Very minimal (183 lines); no pagination; no detail view; no actions; read-only |
| 46 | `/dashboard/pharmacist` | Client | `/api/dashboard/pharmacist/stats` | None | 3 stat cards, recent prescriptions table, doctor info card, quick action links | **COMPLETE** | Proper stat display with prescription and patient data |
| 47 | `/dashboard/pharmacist/prescriptions` | Client | `/api/dashboard/pharmacist/prescriptions?search` | None | Searchable prescription list with patient, disease, date, medicine count | **PARTIAL** | No pagination; no detail view; no fulfillment status update; no print; read-only list |
| 48 | `/dashboard/pharmacist/medicines` | Client | `/api/dashboard/pharmacist/medicines?search`, `/api/dashboard/pharmacist/medicines` (POST, PUT, DELETE) | Create/Edit dialog (name, description, category, manufacturer, price, stock, in-stock toggle) | Full CRUD: searchable medicine table, create/edit dialog with all fields, stock toggle, delete with confirmation | **COMPLETE** | No batch import; no low-stock alerts; no expiration tracking; no category management |

### Summary Statistics

| Category | Count |
|----------|-------|
| **COMPLETE** | 22 pages |
| **PARTIAL** | 25 pages |
| **SKELETON** | 0 pages (excluding `/dashboard` redirect which is a pure router) |
| **All client-side** | 48/48 (100% 'use client') |

### Status Breakdown by Section

| Section | Complete | Partial | Total |
|---------|----------|---------|-------|
| Public Pages (8) | 5 | 3 | 8 |
| Auth Pages (3) | 3 | 0 | 3 |
| Admin Dashboard (8) | 4 | 4 | 8 |
| Doctor Dashboard (10) | 7 | 3 | 10 |
| Patient Dashboard (6) | 3 | 3 | 6 |
| Hospital Dashboard (3) | 1 | 2 | 3 |
| Receptionist Dashboard (3) | 1 | 2 | 3 |
| Assistant Dashboard (3) | 1 | 2 | 3 |
| Pharmacist Dashboard (3) | 2 | 1 | 3 |
| Router/Redirect (1) | 1 | 0 | 1 |

### Critical Issues Found

1. **Dead link**: Homepage CTA "Book Appointment" → `/book` (route does not exist)
2. **Non-functional booking**: `/doctors/[id]` Book button enables on slot selection but has no `onClick` — patients cannot actually book
3. **Hardcoded ratings**: `/doctors/[id]` uses `avgRating = 4.5`, `ratingCount = 128`, `patientCount = 1250` instead of API data
4. **Broken fallback interface**: Homepage fallback doctors use `doctorProfile` key but actual API returns `doctor` key
5. **Random on render**: Homepage specialization badges show `Math.floor(Math.random() * 10) + 3` doctors — changes every re-render
6. **Non-functional chat**: Patient appointment detail chat shows toast "coming soon" — send button does nothing
7. **No server components**: 100% of pages are client-side — no SSR/SSG benefits, all data fetched on client
8. **URL-only file uploads**: Gallery, health records, and blog images all accept URLs only — no real file upload
9. **Missing `/hospitals/[id]`**: Hospital cards on `/hospitals` page have no click handler or link
10. **`dangerouslySetInnerHTML`**: Blog detail renders user content as raw HTML — potential XSS
11. **Remember me unused**: Login form captures `rememberMe` checkbox but doesn't send it to API
12. **Search debounce leak**: Doctor patients page uses raw `setTimeout` without cleanup on unmount
13. **All trends hardcoded**: Every StatCard across all dashboards uses hardcoded trend percentages

### Top Priority Fixes
1. Implement actual booking flow (doctor detail → appointment creation)
2. Fix homepage fallback data interface mismatch
3. Add hospital detail page `/hospitals/[id]`
4. Connect real rating/patient count data to doctor detail page
5. Implement real file upload for gallery, documents, blog images
6. Replace `Math.random()` in homepage specializations with real counts
7. Wire up chat functionality (WebSocket integration)
8. Sanitize HTML content in blog posts
9. Fix dead `/book` link on homepage
10. Remove or implement `rememberMe` in login

---

## Deep Audit: API Routes (Task 3)

Audited all 55 `route.ts` files under `src/app/api/`. Each route evaluated on: Prisma DB usage, input validation, error handling, authentication/authorization.

### Master Route Table

| # | Method+Path | Auth? | DB Ops | What It Does | Status | Issues |
|---|-------------|-------|--------|--------------|--------|--------|
| 1 | `GET /api` | No | None | Returns `{ message: "Hello, world!" }` | **STUB** | No purpose; should be removed or return API info |
| 2 | `POST /api/auth/login` | No | `user.findUnique` | Validates email/password, sets custom session cookie + role cookie | **WORKING** | Dual auth system (custom cookie + NextAuth JWT) may conflict; no rate limiting |
| 3 | `POST /api/auth/register` | No | `user.findUnique`, `user.create` | Creates user with bcrypt hash, checks duplicate email, min 6-char password | **WORKING** | No email verification; any role can be self-registered; no rate limiting |
| 4 | `POST /api/auth/forgot-password` | No | `user.findUnique` | Generates in-memory OTP, returns it in response body | **WORKING** | ⚠️ Returns OTP in plaintext (demo only, security risk in prod); no rate limiting |
| 5 | `POST /api/auth/verify-otp` | No | None (in-memory) | Validates OTP from in-memory store | **WORKING** | No DB involvement; OTP lost on server restart |
| 6 | `POST /api/auth/reset-password` | No | `user.update` | Updates password after OTP verification, clears OTP | **WORKING** | No rate limiting; OTP is in-memory only |
| 7 | `GET+POST /api/auth/[...nextauth]` | N/A | `user.findUnique` (via authorize) | NextAuth credentials provider with JWT strategy | **WORKING** | Only checks `status !== 'Active'` in NextAuth but login checks `Block`/`Pending` separately — inconsistent |
| 8 | `GET /api/doctors` | No | `user.findMany`, `user.count`, `doctorRating.groupBy` (3 queries + rating) | Lists active doctors with search/specialization/city/state filters, rating averages, unique cities/states | **WORKING** | ⚠️ No pagination — loads ALL doctors; spread-operator merge for `where.doctor` is fragile/non-idiomatic Prisma |
| 9 | `GET /api/doctors/[id]` | No | `user.findUnique`, `doctorSchedule.findMany`, `doctorRating.aggregate`, `booking.count`, related doctors | Full doctor profile with schedules, ratings, patient count, related doctors | **WORKING** | N/A — well structured |
| 10 | `GET /api/hospitals` | No | `user.findMany`, `hospital.findMany` (distinct cities) | Lists active hospitals with search/city/sort filters | **WORKING** | ⚠️ No pagination; spread-operator merge for `where.hospital` is fragile |
| 11 | `GET /api/blog` | No | `post.findMany`, `post.count` | Paginated published blog posts with type filter | **WORKING** | N/A — properly paginated |
| 12 | `GET /api/blog/[permalink]` | No | `post.findUnique`, `post.findMany` (related) | Single blog post by permalink with related posts | **WORKING** | N/A — well structured |
| 13 | `POST /api/contact` | No | `hospitalInquiry.create` | Creates contact inquiry from public form | **WORKING** | No spam protection / rate limiting; no honeypot |
| 14 | `GET /api/public/stats` | No | `user.count` (×3), `booking.count` | Platform-wide stats (doctors, hospitals, patients, bookings) | **WORKING** | Falls back to hardcoded data on DB error — masks real failures |
| 15 | `GET /api/patient/profile` | ✅ Patient | `user.findUnique` | Returns patient profile fields | **WORKING** | N/A |
| 16 | `PUT /api/patient/profile` | ✅ Patient | `user.update` | Updates name, mobileNo, gender | **WORKING** | Minimal fields updated (no email, no password, no blood group, no age, no weight, no address) despite page having those fields |
| 17 | `GET /api/patient/medical-documents` | ✅ Patient | `medicalDocument.findMany`, `medicalDocument.groupBy` | Lists documents with category counts | **WORKING** | ⚠️ No pagination despite page sending `page&limit` params; loads all documents |
| 18 | `POST /api/patient/medical-documents` | ✅ Patient | `medicalDocument.create` | Creates medical document record | **WORKING** | ⚠️ Always sets `fileUrl: ''` — no actual file upload; no file storage integration |
| 19 | `PUT /api/patient/medical-documents/[id]` | ✅ Patient (owner) | `medicalDocument.findUnique`, `medicalDocument.update` | Updates document title/category/description | **WORKING** | N/A — has ownership check |
| 20 | `DELETE /api/patient/medical-documents/[id]` | ✅ Patient (owner) | `medicalDocument.findUnique`, `medicalDocument.delete` | Deletes document with ownership check | **WORKING** | N/A — has ownership check |
| 21 | `GET /api/patient/feedback` | ✅ Patient | `booking.findMany`, `doctorRating.findMany` | Lists completed bookings with already-rated flag | **WORKING** | N/A |
| 22 | `POST /api/patient/feedback` | ✅ Patient | `doctorRating.findFirst`, `doctorRating.create` | Submits doctor rating with duplicate check | **WORKING** | N/A — has duplicate prevention |
| 23 | `GET /api/dashboard/admin/stats` | ❌ **NONE** | `user.count`, `doctor.count`, `booking.count/aggregate`, `booking.findMany`, `user.groupBy` | Admin dashboard stats (users, doctors, appointments, revenue, recent) | **WORKING** | 🔴 **CRITICAL: NO AUTH CHECK** — any unauthenticated user can access admin stats |
| 24 | `GET /api/dashboard/admin/users` | ✅ Admin | `user.findMany`, `user.count`, `user.groupBy` (×2) | Paginated user list with role/search filters, role+status counts | **WORKING** | N/A — properly paginated |
| 25 | `DELETE /api/dashboard/admin/users/[id]` | ✅ Admin | `user.findUnique`, `user.delete` | Deletes user, prevents self-delete | **WORKING** | ⚠️ Cascade delete may fail if user has related records (bookings, doctor profile, etc.) — no cleanup |
| 26 | `PUT /api/dashboard/admin/users/[id]/status` | ✅ Admin | `user.findUnique`, `user.update` | Changes user status (Active/Block/Pending), prevents self-block | **WORKING** | N/A — validates status values |
| 27 | `GET /api/dashboard/admin/doctors` | ✅ Admin | `doctor.findMany` (×3), `doctorRating.groupBy` | Doctor list with search/city/specialization filters, ratings | **WORKING** | No pagination — loads all doctors |
| 28 | `GET /api/dashboard/admin/hospitals` | ✅ Admin | `hospital.findMany` (×2) | Hospital list with search/city filters | **WORKING** | No pagination |
| 29 | `GET /api/dashboard/admin/appointments` | ✅ Admin | `booking.findMany`, `booking.groupBy` | Appointment list with status/search filters | **WORKING** | Hard-coded `take: 50` — no proper pagination; no total count returned |
| 30 | `GET /api/dashboard/admin/blog` | ✅ Admin | `post.findMany` | Blog post list with search | **WORKING** | No pagination; returns `blogImg` field in DB but not in response mapping |
| 31 | `POST /api/dashboard/admin/blog` | ✅ Any auth | `post.create` | Creates blog post with auto-permalink | **WORKING** | ⚠️ Auth check only verifies `session.user` exists (any role), not specifically admin — inconsistent with GET/DELETE which require admin |
| 32 | `PUT /api/dashboard/admin/blog/[id]` | ✅ Any auth | `post.findUnique`, `post.update` | Updates blog post fields | **WORKING** | ⚠️ Same auth issue — any authenticated user can edit posts; doesn't check admin role |
| 33 | `DELETE /api/dashboard/admin/blog/[id]` | ✅ Admin | `post.findUnique`, `post.delete` | Deletes blog post | **WORKING** | N/A |
| 34 | `GET /api/dashboard/admin/inquiries` | ✅ Admin | `hospitalInquiry.findMany` | Lists contact inquiries with search | **WORKING** | No pagination; has unused imports (`fs`, `path`) |
| 35 | `PUT /api/dashboard/admin/inquiries` | ✅ Admin | `hospitalInquiry.findUnique`, `hospitalInquiry.update` | Updates inquiry status | **WORKING** | ⚠️ Frontend page sends POST for reply but this only handles status update — no reply creation |
| 36 | `DELETE /api/dashboard/admin/inquiries` | ✅ Admin | `hospitalInquiry.findUnique`, `hospitalInquiry.delete` | Deletes inquiry | **WORKING** | N/A |
| 37 | `GET /api/dashboard/doctor/stats` | ✅ Doctor | `doctor.findUnique`, 5× `booking.*`, `doctorRating.*` | Doctor dashboard stats: today's appts, patients, pending Rx, reviews | **WORKING** | N/A — comprehensive |
| 38 | `GET /api/dashboard/doctor/profile` | ✅ Doctor | `doctor.findUnique` (incl user) | Returns doctor profile with all fields | **WORKING** | N/A |
| 39 | `PUT /api/dashboard/doctor/profile` | ✅ Doctor | `user.update` (×2), `doctor.update` | Updates doctor profile and user name/image | **WORKING** | ⚠️ Two separate `user.update` calls for name and profileImg — should be one atomic update |
| 40 | `GET /api/dashboard/doctor/appointments` | ✅ Doctor | `doctor.findUnique`, `booking.findMany`, `booking.groupBy` | Doctor's appointments with status filter and counts | **WORKING** | No pagination |
| 41 | `PUT /api/dashboard/doctor/appointments/[id]/status` | ✅ Doctor (owner) | `doctor.findUnique`, `booking.findFirst`, `booking.update` | Updates appointment status with valid status check and ownership | **WORKING** | N/A — properly scoped |
| 42 | `GET /api/dashboard/doctor/prescriptions` | ✅ Doctor | `doctor.findUnique`, `prescription.findMany` (incl medicines/labels/suggestions) | Lists doctor's prescriptions with search | **WORKING** | No pagination |
| 43 | `POST /api/dashboard/doctor/prescriptions` | ✅ Doctor | `doctor.findUnique`, `prescription.create` (with nested medicines+labels) | Creates prescription linked to booking | **WORKING** | N/A — well structured with nested creates |
| 44 | `GET /api/dashboard/doctor/prescriptions/[id]` | ✅ Doctor (owner) | `doctor.findUnique`, `prescription.findFirst` (incl all relations) | Full prescription detail with patient, doctor, medicines, labels, suggestions | **WORKING** | N/A — comprehensive |
| 45 | `PUT /api/dashboard/doctor/prescriptions/[id]` | ✅ Doctor (owner) | `prescription.findFirst`, `pMedicine.deleteMany`, `pLabel.deleteMany`, `prescription.update` | Updates prescription (delete-recreate pattern for medicines/labels) | **WORKING** | ⚠️ Delete-recreate pattern is not atomic — if update fails, medicines/labels are already deleted |
| 46 | `GET /api/dashboard/doctor/schedule` | ✅ Doctor | `doctor.findUnique`, `doctorSchedule.findMany` | Returns doctor's weekly schedule | **WORKING** | N/A |
| 47 | `POST /api/dashboard/doctor/schedule` | ✅ Doctor | `doctor.findUnique`, `doctorSchedule.upsert` (×N) | Saves weekly schedule via upsert per day | **WORKING** | ⚠️ No validation of time format or day values; no removal of old schedule entries not in the new set |
| 48 | `GET /api/dashboard/doctor/holidays` | ✅ Doctor | `doctor.findUnique`, `doctorHoliday.findMany` | Lists doctor holidays | **WORKING** | N/A |
| 49 | `POST /api/dashboard/doctor/holidays` | ✅ Doctor | `doctorHoliday.create` | Creates holiday entry | **WORKING** | ⚠️ No duplicate date check — can create multiple holidays for same date |
| 50 | `DELETE /api/dashboard/doctor/holidays` | ✅ Doctor | `doctorHoliday.deleteMany` (scoped) | Deletes holiday by query param `id` | **WORKING** | ⚠️ Uses query param for DELETE instead of URL path param — non-RESTful |
| 51 | `GET /api/dashboard/doctor/gallery` | ✅ Doctor | `doctor.findUnique`, `doctorGallery.findMany` | Lists doctor gallery photos | **WORKING** | N/A |
| 52 | `POST /api/dashboard/doctor/gallery` | ✅ Doctor | `doctor.findUnique`, `doctorGallery.create` | Adds gallery photo (URL-only) | **WORKING** | ⚠️ No URL validation — accepts any string as image URL |
| 53 | `DELETE /api/dashboard/doctor/gallery` | ✅ Doctor | `doctor.findUnique`, `doctorGallery.deleteMany` (scoped) | Deletes gallery photo by query param `id` | **WORKING** | ⚠️ Uses query param for DELETE — non-RESTful |
| 54 | `GET /api/dashboard/doctor/patients` | ✅ Doctor | `doctor.findUnique`, `booking.findMany` (distinct), `booking.groupBy` (×2) | Lists unique patients with visit counts and last visit | **WORKING** | ⚠️ Search only filters `patientName` (walk-in), not registered user names; no pagination |
| 55 | `GET /api/dashboard/doctor/posts` | ✅ Doctor | `post.findMany` | Lists doctor's blog posts | **WORKING** | N/A |
| 56 | `POST /api/dashboard/doctor/posts` | ✅ Doctor | `post.create` | Creates blog post for doctor | **WORKING** | N/A |
| 57 | `PUT /api/dashboard/doctor/posts` | ✅ Doctor (owner) | `post.update` (scoped by authorId) | Updates blog post | **WORKING** | N/A — scoped correctly |
| 58 | `DELETE /api/dashboard/doctor/posts` | ✅ Doctor (owner) | `post.deleteMany` (scoped by authorId) | Deletes blog post by query param `id` | **WORKING** | ⚠️ Uses query param for DELETE — non-RESTful |
| 59 | `GET /api/dashboard/patient/stats` | ✅ Patient | 6× `booking.*`, `medicalDocument.count` | Patient dashboard: upcoming/completed appts, doctors, documents, recent activity | **WORKING** | N/A — comprehensive |
| 60 | `GET /api/dashboard/patient/appointments` | ✅ Patient | `booking.findMany`, `booking.groupBy` | Patient's appointments with status filter and counts | **WORKING** | No pagination despite page sending `page` param; loads all appointments |
| 61 | `GET /api/dashboard/patient/appointments/[id]` | ✅ Patient (owner) | `booking.findUnique` (with deep includes) | Full appointment detail: doctor, patient, chat, prescriptions, status timeline | **WORKING** | N/A — very comprehensive |
| 62 | `GET /api/dashboard/hospital/stats` | ✅ Hospital | `hospital.findUnique`, `doctor.count/findMany`, `booking.count/findMany`, `doctorRating.groupBy` | Hospital dashboard: doctors, appointments, ratings, recent activity | **WORKING** | N/A |
| 63 | `GET /api/dashboard/hospital/doctors` | ✅ Hospital | `hospital.findUnique`, `doctor.findMany` (×2), `doctorRating.groupBy` | Hospital's doctors with search/specialization filter, ratings | **WORKING** | No pagination |
| 64 | `GET /api/dashboard/hospital/appointments` | ✅ Hospital | `hospital.findUnique`, `booking.findMany`, `booking.groupBy`, `doctor.findMany` | Hospital's appointments with status/doctor/search filters | **WORKING** | No pagination; loads all appointments for hospital |
| 65 | `GET /api/dashboard/receptionist/stats` | ✅ Receptionist | `receptionist.findUnique`, 3× `booking.*`, `user.count`, `booking.findMany`, `doctor.findUnique` | Receptionist dashboard: today's appts, patients, pending, doctor info | **WORKING** | N/A |
| 66 | `GET /api/dashboard/receptionist/appointments` | ✅ Receptionist | `receptionist.findUnique`, `booking.findMany`, `booking.groupBy`, `doctor.findUnique` | Appointment list with status/search filter | **WORKING** | No pagination |
| 67 | `POST /api/dashboard/receptionist/appointments` | ✅ Receptionist | `receptionist.findUnique`, `doctor.findUnique`, `booking.count`, `booking.create` | Creates walk-in appointment with auto-generated appointment number | **WORKING** | ⚠️ Race condition in appointment number generation (count+1); no time slot validation against doctor schedule; no duplicate booking check |
| 68 | `PATCH /api/dashboard/receptionist/appointments` | ✅ Receptionist | `receptionist.findUnique`, `booking.findFirst`, `booking.update` | Updates appointment status (Approve/Canceled only) | **WORKING** | N/A |
| 69 | `GET /api/dashboard/receptionist/patients` | ✅ Receptionist | `receptionist.findUnique`, `user.findMany`, `booking.groupBy` | Patient list with search, visit count, last visit | **WORKING** | No pagination |
| 70 | `GET /api/dashboard/assistant/stats` | ✅ Assistant | `doctorAssistant.findUnique`, 3× `booking.*`, `user.count`, `booking.findMany`, `doctor.findUnique` | Assistant dashboard: today's appts, patients, pending, doctor info | **WORKING** | N/A — nearly identical to receptionist stats |
| 71 | `GET /api/dashboard/assistant/appointments` | ✅ Assistant | `doctorAssistant.findUnique`, `booking.findMany`, `booking.groupBy`, `doctor.findUnique` | Appointment list with status/search filter | **WORKING** | No pagination; read-only (no status change unlike receptionist) |
| 72 | `GET /api/dashboard/assistant/patients` | ✅ Assistant | `doctorAssistant.findUnique`, `user.findMany`, `booking.groupBy` | Patient list with search, visit count, last visit | **WORKING** | No pagination; identical logic to receptionist patients |
| 73 | `GET /api/dashboard/pharmacist/stats` | ✅ Pharmacist | `doctorPharmacist.findUnique`, 2× `prescription.count`, `prescription.findMany`, `doctor.findUnique` | Pharmacist dashboard: total/today prescriptions, pending fulfillments, doctor info | **WORKING** | ⚠️ `pendingFulfillments` = `todayPrescriptions` — no actual fulfillment tracking field exists in DB |
| 74 | `GET /api/dashboard/pharmacist/prescriptions` | ✅ Pharmacist | `doctorPharmacist.findUnique`, `prescription.findMany` (incl medicines/labels) | Lists prescriptions with search | **WORKING** | No pagination; no fulfillment status update capability |
| 75 | `GET /api/dashboard/pharmacist/medicines` | ✅ Pharmacist | `doctorPharmacist.findUnique`, `doctorMedicine.findMany` | Lists medicines with search | **WORKING** | ⚠️ `where: { userId: pharmacist.doctorId }` — filters by `userId` using doctor's ID; may be schema-correct but semantically confusing |
| 76 | `POST /api/dashboard/pharmacist/medicines` | ✅ Pharmacist | `doctorPharmacist.findUnique`, `doctorMedicine.create` | Creates medicine record | **WORKING** | N/A |
| 77 | `PUT /api/dashboard/pharmacist/medicines` | ✅ Pharmacist | `doctorPharmacist.findUnique`, `doctorMedicine.findFirst`, `doctorMedicine.update` | Updates medicine with ownership check | **WORKING** | N/A |
| 78 | `DELETE /api/dashboard/pharmacist/medicines` | ✅ Pharmacist | `doctorPharmacist.findUnique`, `doctorMedicine.findFirst`, `doctorMedicine.delete` | Deletes medicine with ownership check | **WORKING** | ⚠️ Uses request body for `id` in DELETE — non-RESTful; should use URL path param |
| 79 | `GET /api/admin/settings` | ✅ Admin | None (file system) | Reads admin settings from JSON file | **WORKING** | ⚠️ Uses filesystem instead of DB; `download/admin-settings.json` path may not exist in production deployments |
| 80 | `PUT /api/admin/settings` | ✅ Admin | None (file system) | Writes entire request body to JSON file | **WORKING** | 🔴 **No validation** — entire body is written as-is; could overwrite/corrupt settings; no schema enforcement |

### Summary Statistics

| Category | Count |
|----------|-------|
| **WORKING** | 78 handlers across 55 files |
| **STUB** | 1 (`GET /api`) |
| **BROKEN** | 0 (no runtime crashes found) |
| **With Auth** | 48 route files |
| **Without Auth (public)** | 7 route files |
| **MISSING Auth** | 1 route file (`admin/stats`) |

### Status Breakdown by Section

| Section | Routes | Auth Issues | DB Issues | Other Issues |
|---------|--------|-------------|-----------|-------------|
| Auth (6) | 6 | 0 | 0 | OTP in response body; dual auth (cookie+JWT); no rate limiting |
| Public (8) | 8 | 0 | 0 | No pagination on doctors/hospitals; hardcoded fallback on stats error |
| Patient (5) | 5 | 0 | 0 | Profile PUT missing fields; medical documents no pagination; fileUrl always empty |
| Admin Dashboard (10) | 10 | 🔴 1 missing + 2 inconsistent | 0 | Unused imports; no pagination on most; cascade delete risk |
| Doctor Dashboard (12) | 12 | 0 | 0 | No pagination on most; delete-recreate not atomic; non-RESTful DELETE by query param |
| Patient Dashboard (3) | 3 | 0 | 0 | No pagination |
| Hospital Dashboard (3) | 3 | 0 | 0 | No pagination |
| Receptionist (3) | 3 | 0 | 0 | Race condition in apt number; no slot validation; no pagination |
| Assistant (3) | 3 | 0 | 0 | No pagination; read-only |
| Pharmacist (3) | 3 | 0 | 0 | No fulfillment tracking; confusing userId field |
| Admin Settings (1) | 1 | 0 | Uses filesystem | No validation on PUT |

### Critical Security Issues

1. 🔴 **`GET /api/dashboard/admin/stats` — NO AUTHENTICATION CHECK**: This is the only protected route that forgot to add `getServerSession`. Anyone on the internet can read total users, revenue, recent appointments.
2. 🟡 **`POST/PUT /api/dashboard/admin/blog` — Weak Auth**: POST and PUT only check `session.user` exists, not that user is admin. Any authenticated user (patient, doctor) can create/edit blog posts.
3. 🟡 **`PUT /api/admin/settings` — No Input Validation**: Entire request body is written to filesystem as-is. Malicious or corrupted data could break the settings system.
4. 🟡 **`POST /api/auth/forgot-password` — OTP in Response**: Returns generated OTP in plaintext in the JSON response. Must be removed before production.
5. 🟡 **`POST /api/auth/register` — Open Role Registration**: Any role (admin, doctor, hospital, etc.) can be self-registered. No role restriction.
6. 🟡 **Dual Auth Systems**: Custom cookie-based auth in `/api/auth/login` + NextAuth JWT in `[...nextauth]`. Session cookie `doctorooms_session` is set by login but dashboard routes use `getServerSession` (NextAuth). The custom cookie is never validated by protected routes.

### Missing Functionality

1. **No `POST /api/dashboard/admin/inquiries`**: Frontend page sends POST to create reply messages, but the route only has GET/PUT/DELETE. Admin replies to inquiries silently fail.
2. **No booking creation for patients**: No `POST /api/patient/appointments` or `POST /api/bookings` exists. Patients cannot book appointments via API.
3. **No chat message endpoint**: Patient appointment detail includes `chatMessages` but no POST endpoint exists to send messages.
4. **No real file upload**: All file/document/image uploads use URL strings, not multipart uploads.
5. **No hospital detail API**: No `/api/hospitals/[id]` route exists.

### Top Priority Fixes

1. Add auth check to `GET /api/dashboard/admin/stats`
2. Fix blog POST/PUT auth to require admin role
3. Add input validation to `PUT /api/admin/settings`
4. Remove OTP from forgot-password response body
5. Restrict registration roles (or add admin approval flow)
6. Add `POST /api/dashboard/admin/inquiries` for reply creation
7. Create patient booking endpoint
8. Add pagination to all list endpoints that lack it
9. Remove unused `fs`/`path` imports from inquiries route
10. Consolidate dual auth to single system (NextAuth only)
