# Task 8 — Admin Dashboard Pages & API Routes

## Task ID
`8`

## Context
Built all 7 admin dashboard sub-pages and 11 API routes to complete the admin management suite. The admin home page already existed from Task 5.

## What was done

### Frontend Pages (7):

1. **User Management** (`/dashboard/admin/users`): Role filter tabs (All/Admin/Doctor/Patient/Hospital/Receptionist/Assistant/Pharmacist) with counts, search by name/email, users table with avatar/name/email/role badge/status badge/created date/actions dropdown (View/Activate/Block/Delete), pagination, view user detail dialog, delete confirmation dialog.
2. **Doctor Management** (`/dashboard/admin/doctors`): Search, city/specialization dropdown filters, doctors table with avatar/name/specialization/city/fees/status/rating, view profile dialog with full details (specialization, education, experience, location, fee, contact, description), activate/block with confirmation.
3. **Hospital Management** (`/dashboard/admin/hospitals`): Search, city filter dropdown, hospitals table with icon/name/address/city/contact, view dialog with full details, stat cards for total/cities covered/monthly/avg per city.
4. **All Appointments** (`/dashboard/admin/appointments`): Status filter tabs with counts (All/Pending/Approve/Visited/Canceled/Extend/Finish), search by patient/doctor, table with patient+avatar/doctor+avatar+spec/date/disease/status badge with icon/type, appointment detail dialog with patient info, doctor info, date, fee, disease, description.
5. **Blog Management** (`/dashboard/admin/blog`): Search, table with title/author/type badge (Blog=teal/News=amber)/status badge (Published/Draft)/date, create dialog (title/content textarea/type select/status select), edit dialog, delete confirmation, stat cards for total/published/drafts/news.
6. **Contact Inquiries** (`/dashboard/admin/inquiries`): Search, table with mail icon/name/email/subject/status badge (Pending=unread/Read)/date, view full inquiry dialog with name/email/phone/subject/date/message, mark as Read/Unread, delete confirmation.
7. **Settings** (`/dashboard/admin/settings`): 4 tabs — General (site name, email, phone, timezone select, currency select), Appointments (default duration, daily limit, auto-approve toggle), Notifications (email/SMS/push toggles, reminder time select), Appearance (color swatches 6 presets, dark mode Light/Dark/System, sidebar position Left/Right).

### API Routes (11):

1. `GET /api/dashboard/admin/users` — List users with role filter, search, pagination, role/status counts
2. `PUT /api/dashboard/admin/users/[id]/status` — Change user status (Active/Block/Pending), prevents self-block
3. `DELETE /api/dashboard/admin/users/[id]` — Delete user, prevents self-delete
4. `GET /api/dashboard/admin/doctors` — List doctors with search, city/specialization filter, rating averages, cities/specializations dropdowns
5. `GET /api/dashboard/admin/hospitals` — List hospitals with search, city filter, cities dropdown
6. `GET /api/dashboard/admin/appointments` — List all appointments with status filter, search, status counts
7. `GET /api/dashboard/admin/blog` — List blog posts with search, published/drafts counts
8. `POST /api/dashboard/admin/blog` — Create post (title, content, type, status, auto-permalink)
9. `PUT /api/dashboard/admin/blog/[id]` — Update post fields
10. `DELETE /api/dashboard/admin/blog/[id]` — Delete post
11. `GET /api/dashboard/admin/inquiries` — List inquiries with search, unread/read counts
12. `PUT /api/dashboard/admin/inquiries` — Mark inquiry Read/Unread
13. `DELETE /api/dashboard/admin/inquiries` — Delete inquiry
14. `GET /api/admin/settings` — Read settings from JSON file (defaults if missing)
15. `PUT /api/admin/settings` — Write settings to `/download/admin-settings.json`

### Files Created (18):
- src/app/dashboard/admin/users/page.tsx
- src/app/dashboard/admin/doctors/page.tsx
- src/app/dashboard/admin/hospitals/page.tsx
- src/app/dashboard/admin/appointments/page.tsx
- src/app/dashboard/admin/blog/page.tsx
- src/app/dashboard/admin/inquiries/page.tsx
- src/app/dashboard/admin/settings/page.tsx
- src/app/api/dashboard/admin/users/route.ts
- src/app/api/dashboard/admin/users/[id]/status/route.ts
- src/app/api/dashboard/admin/users/[id]/route.ts
- src/app/api/dashboard/admin/doctors/route.ts
- src/app/api/dashboard/admin/hospitals/route.ts
- src/app/api/dashboard/admin/appointments/route.ts
- src/app/api/dashboard/admin/blog/route.ts
- src/app/api/dashboard/admin/blog/[id]/route.ts
- src/app/api/dashboard/admin/inquiries/route.ts
- src/app/api/admin/settings/route.ts

### QA Results
- 0 ESLint errors ✓
- All 7 pages compile successfully ✓
- All 11 API routes created with proper auth guards ✓
- TanStack Query for data fetching with loading states ✓
- Framer Motion animations on all pages ✓
- shadcn/ui components throughout ✓
- Responsive, mobile-first design ✓
- Teal color scheme consistent ✓
- Skeleton loading states on all pages ✓
- Empty states with icons ✓
- Role-colored badges (admin=red, doctor=teal, patient=blue, hospital=amber, receptionist=violet, assistant=pink, pharmacist=emerald) ✓
- Status-colored badges (Active=emerald, Pending=amber, Block=red) ✓
- Confirmation dialogs for destructive actions (delete user, delete post, delete inquiry, block/activate) ✓
- Self-protection: admin cannot block or delete themselves ✓
- JSON file-based settings storage ✓
- Settings with default fallbacks ✓
