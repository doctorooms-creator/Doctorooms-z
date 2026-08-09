# 📋 Patient Module — Detailed Development Plan

> Reference: `research/PHASE1-FRONTEND-RESEARCH.md` (Sections 1.8, 1.9, 1.13, 1.14, 1.15)
> Date: 2025-06-23
> Status: **Plan Created — Ready for Development**

---

## 📊 Current Status Audit

### ✅ Already Built (8 pages, 14 API routes)

| # | Page | Route | API Routes | Status |
|---|------|-------|------------|--------|
| 1 | Dashboard Home | `/dashboard/patient` | `/api/dashboard/patient/stats` | ✅ Complete |
| 2 | Appointments List | `/dashboard/patient/appointments` | `/api/dashboard/patient/appointments` | ✅ Complete |
| 3 | Appointment Detail | `/dashboard/patient/appointments/[id]` | `/api/dashboard/patient/appointments/[id]` | ✅ Complete |
| 4 | Book Appointment | `/dashboard/patient/book/[doctorId]` | `/api/patient/bookings` + `/check-slot` + `/queue` | ✅ Complete |
| 5 | Health Records | `/dashboard/patient/health-records` | `/api/dashboard/patient/prescriptions` + `/api/patient/medical-documents` | ✅ Complete |
| 6 | Profile | `/dashboard/patient/profile` | `/api/patient/profile` | ✅ Complete |
| 7 | Feedback & Ratings | `/dashboard/patient/feedback` | `/api/patient/feedback` + `/check` | ✅ Complete |
| 8 | Notifications | `/dashboard/patient/notifications` | `/api/patient/notifications` + `/[id]/read` + `/read-all` | ✅ Complete |

### ❌ Missing vs Original PHP (Research Sections 1.8, 1.9, 1.13, 1.14, 1.15)

| # | Feature | Research Ref | Current State | Priority |
|---|---------|-------------|---------------|----------|
| 1 | **Patient Blog/Posts CRUD** | 1.15 | ❌ Not built at all | 🔴 HIGH |
| 2 | **Date Range Filter on Appointments** | 1.9 | ⚠️ Only status tabs, no from/to date | 🔴 HIGH |
| 3 | **Avatar Upload (Profile)** | 1.13 | ⚠️ Shows "coming soon" toast | 🔴 HIGH |
| 4 | **State/City in Booking Form** | 1.8 | ⚠️ Fields not in booking form | 🟡 MEDIUM |
| 5 | **Doctor/Receptionist Notification on Booking** | 1.8 | ⚠️ Only patient notified | 🟡 MEDIUM |
| 6 | **SMS on Booking** | 1.8 | ❌ No SMS gateway (skip) | ⬜ SKIP |

### 🆕 New Enhancements (Not in Original — Value Add)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Notification Bell Dropdown** | Bell icon in dashboard header with live dropdown + unread count | 🟡 MEDIUM |
| 2 | **Patient Settings Page** | Theme toggle, notification preferences, language | 🟡 MEDIUM |
| 3 | **Appointment Export** | Download appointment history as PDF/CSV | 🟢 LOW |
| 4 | **Quick Re-book** | "Book Again" button on completed appointment details | 🟢 LOW |

---

## 🗂️ Development Plan — File-by-File

### Phase A: Patient Blog/Posts Module (NEW PAGE)
**Reference:** Research 1.15 — Original had full CRUD with CKEditor

#### Files to Create:

```
src/app/dashboard/patient/blog/
├── page.tsx                          # Blog list page (DataTable-style)
├── new/
│   └── page.tsx                      # Create new blog post
└── [id]/
    └── edit/
        └── page.tsx                  # Edit existing blog post

src/app/api/patient/posts/
├── route.ts                          # GET (list), POST (create)
└── [id]/
    └── route.ts                      # GET (single), PUT (update), DELETE (delete)
```

#### API Specs:

**GET `/api/patient/posts`** — List patient's blog posts
- Auth: `requireRole(req, 'patient')`
- Returns: `{ posts: [{id, title, permalink, status, blogImg, createdAt, updatedAt}] }`
- Query: `SELECT * FROM Post WHERE authorId = user.id ORDER BY createdAt DESC`

**POST `/api/patient/posts`** — Create blog post
- Auth: `requireRole(req, 'patient')`
- Body: `{ title, content, blogImg?, videoLink?, status: 'Published'|'Draft' }`
- Auto-generate `permalink` from title (slugify + uniqueness check)
- Type: `Blog`, Author: logged-in user

**GET `/api/patient/posts/[id]`** — Get single post (ownership check)
- Returns: Full post data

**PUT `/api/patient/posts/[id]`** — Update post (ownership check)
- Body: Same as create
- Regenerate permalink if title changed

**DELETE `/api/patient/posts/[id]`** — Delete post (ownership check)
- Returns: `{ success: true }`

#### Frontend Specs:

**Blog List Page (`/dashboard/patient/blog`):**
- Page header: "My Blog Posts" + "New Post" button (teal gradient)
- Stats row: Total Posts, Published, Drafts
- Card grid (responsive 1/2/3 cols) or table view toggle
- Each card: Blog image (or placeholder), title, status badge (Published=green, Draft=gray), date, actions (Edit/Delete)
- Empty state: PenLine icon + "You haven't written any posts yet" + "Write Your First Post" CTA
- Framer Motion stagger animation on cards
- Delete confirmation via AlertDialog

**New Post Page (`/dashboard/patient/blog/new`):**
- Breadcrumb: Dashboard > Blog > New Post
- Form fields:
  - Title (Input, required)
  - Content (Textarea — tall, 8+ rows, with basic toolbar hint)
  - Video Link (Input, optional, YouTube URL validation)
  - Blog Image (file input — placeholder with "coming soon" or simple URL input)
  - Status toggle: Published / Draft
- Actions: Publish, Save Draft, Cancel
- useMutation with toast notifications

**Edit Post Page (`/dashboard/patient/blog/[id]/edit`):**
- Same form as New, pre-populated
- Shows current blog image thumbnail
- Actions: Update, Cancel

#### Sidebar Update:
- Add "My Blog" item to patient sidebar in `src/lib/sidebar-config.ts`
- Icon: `FileText` from lucide-react
- Route: `/dashboard/patient/blog`

---

### Phase B: Date Range Filter on Appointments
**Reference:** Research 1.9 — Original had from/to date inputs above the DataTable

#### Files to Modify:

```
src/app/dashboard/patient/appointments/page.tsx    # Add date filter UI
src/app/api/dashboard/patient/appointments/route.ts # Add from/to query params
```

#### API Changes:
- Add optional query params: `from` (YYYY-MM-DD), `to` (YYYY-MM-DD)
- Filter bookings: `bookingDate >= from AND bookingDate <= to` (if provided)
- Existing `status` filter works in combination with date range

#### Frontend Changes:
- Above the status tabs, add a date range row:
  - From date (DatePicker/Calendar component)
  - To date (DatePicker/Calendar component)
  - Clear Filters button
  - Results count indicator
- Update TanStack Query to include date params
- Reset pagination when filters change
- Show "No appointments found" when filters yield no results

---

### Phase C: Avatar Upload Implementation
**Reference:** Research 1.13 — Original had working multipart upload to `upload/profile/`

#### Files to Create/Modify:

```
src/app/api/patient/avatar/route.ts           # NEW — Avatar upload endpoint
src/app/dashboard/patient/profile/page.tsx     # MODIFY — Real upload UI
```

#### API Spec:

**POST `/api/patient/avatar`** — Upload profile image
- Auth: `requireRole(req, 'patient')`
- Body: `FormData` with `avatar` file
- Validation: file type (image/jpeg, image/png, image/webp), max 2MB
- Save to: `public/uploads/profile/{userId}_{timestamp}.{ext}`
- Update `User.profileImg` in DB
- Return: `{ profileImg: 'path' }`

#### Frontend Changes:
- Replace "coming soon" toast with real file input
- Avatar circle (96px) with camera overlay icon on hover
- Click opens file picker
- Preview new avatar before upload
- Upload with progress indicator
- useMutation with toast on success/error
- Fallback to default avatar if none set

---

### Phase D: Booking Form — State/City Fields
**Reference:** Research 1.8 — Original had cascading state→city dropdowns

#### Files to Modify:

```
src/app/dashboard/patient/book/[doctorId]/page.tsx  # Add state/city fields
src/app/api/patient/bookings/route.ts                # Accept state/city in booking
```

#### Note:
- The original used a `states` + `cities` table with AJAX cascading
- Current Prisma schema does NOT have `State` or `City` models
- **Approach:** Add simple text Input fields for State and City in the booking form (no dropdown for now — can enhance later when admin adds State/City master data)
- These are optional fields in the original too

---

### Phase E: Notification Bell in Dashboard Header
**Reference:** Research — Layout had notification bell with unread count + dropdown

#### Files to Modify:

```
src/components/dashboard/dashboard-header.tsx       # Add bell icon + dropdown
src/app/api/patient/notifications/route.ts          # Add ?limit=5 for dropdown
```

#### Specs:
- Bell icon with red unread count badge in header
- On click: dropdown showing latest 5 notifications
- Each: icon + title (truncated) + relative time
- "View All" link → `/dashboard/patient/notifications`
- "Mark All Read" button in dropdown
- Close on outside click
- Animated dropdown (framer-motion)

---

## 📐 Development Priority Order

| Step | Task | Est. Files | Depends On |
|------|------|-----------|------------|
| **A** | Patient Blog/Posts CRUD | 5 new files + 1 modify | None |
| **B** | Date Range Filter | 2 modify | None |
| **C** | Avatar Upload | 1 new + 1 modify | None |
| **D** | Booking State/City | 2 modify | None |
| **E** | Notification Bell | 2 modify | None |

**Recommended execution order:** A → B → C → D → E (parallel where possible)

---

## 🎨 Design Standards (Consistent Across All Pages)

- **Color:** Teal primary (`teal-500/600`), Amber for ratings, Emerald for success
- **Components:** shadcn/ui (New York style) + Lucide icons
- **Animations:** Framer Motion — fade-in sections, stagger cards, hover effects
- **Data Fetching:** TanStack Query (useQuery, useMutation)
- **Loading:** Skeleton components for all async data
- **Empty States:** Icon + message + CTA button
- **Toast:** Sonner for success/error notifications
- **Responsive:** Mobile-first, breakpoints sm/md/lg/xl
- **Footer:** Sticky to bottom (min-h-screen flex flex-col + mt-auto)

---

## ✅ Completion Checklist

- [ ] Phase A: Blog/Posts CRUD (list + create + edit + delete)
- [ ] Phase B: Date range filter on appointments
- [ ] Phase C: Avatar upload on profile
- [ ] Phase D: State/City in booking form
- [ ] Phase E: Notification bell in header
- [ ] Sidebar updated with Blog link
- [ ] All API routes use `requireRole(req, 'patient')`
- [ ] `bun run lint` passes with 0 errors
- [ ] Agent Browser verification on all pages
- [ ] Worklog updated
