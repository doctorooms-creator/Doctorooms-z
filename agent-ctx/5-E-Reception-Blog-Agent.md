# 5-E — Reception Blog Management Agent

## Task ID: 5-E
## Agent: Blog Agent
## Task: Build full CRUD blog/post management for the receptionist module

---

## Work Log
- (to be filled by agent)

---

## Context

The PHP original receptionist had full blog/post CRUD (create, edit, delete, toggle publish, WYSIWYG editor, image upload, video link, SEO permalink). The patient module already has a complete blog implementation that can be used as reference:

**Reference files (patient blog — copy pattern):**
- `src/app/dashboard/patient/blog/page.tsx` — Blog list with stats, card grid, empty state, delete
- `src/app/dashboard/patient/blog/new/page.tsx` — Create post form
- `src/app/dashboard/patient/blog/[id]/edit/page.tsx` — Edit post (child component pattern)
- `src/app/api/patient/posts/route.ts` — Blog list (GET) + create (POST) with slugify
- `src/app/api/patient/posts/[id]/route.ts` — Blog get/update/delete with ownership check

The Prisma schema already has:
```prisma
model Blog {
  id          String   @id @default(cuid())
  userId      String
  title       String
  slug        String   @unique
  content     String
  videoLink   String?
  blogImage   String?
  status      String   @default("draft") // draft, published
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## What to Build

### E1. Blog API Routes

**File:** `src/app/api/receptionist/posts/route.ts` (create)
- **GET:** List blogs for the logged-in receptionist
  - `requireRole(req, 'receptionist')`
  - `db.blog.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })`
  - Return count of published vs draft
- **POST:** Create new blog post
  - Accept: title, content, videoLink?, blogImage?, status?
  - Slugify title → unique slug (check for conflicts, append `-1`, `-2`, etc.)
  - `db.blog.create({ data: { userId: user.id, title, slug, content, videoLink, blogImage, status } })`
  - Return created blog

**File:** `src/app/api/receptionist/posts/[id]/route.ts` (create)
- **GET:** Single blog by id (with ownership check)
- **PUT:** Update blog (with ownership check)
  - Re-slugify if title changed
- **DELETE:** Delete blog (with ownership check)

### E2. Blog List Page

**File:** `src/app/dashboard/receptionist/blog/page.tsx` (create)

Copy the pattern from patient blog list but with receptionist styling:

**Stats row:** 3 cards
- Total Posts (FileText icon)
- Published (Globe icon, emerald)
- Drafts (FilePenLine icon, amber)

**Content:** Card grid (responsive 1/2/3 cols)
- Each card: blog image (or placeholder), title, excerpt (truncated content), status badge, date, edit/delete actions
- Framer Motion stagger animation on mount
- Empty state with PenLine icon: "No blog posts yet. Create your first post!"
- Delete with AlertDialog confirmation

**Floating button:** "+ New Post" button (bottom-right, same pattern as patient)

### E3. Blog Create Page

**File:** `src/app/dashboard/receptionist/blog/new/page.tsx` (create)

**Form fields:**
- Title (text input, required)
- Content (textarea, required, tall — min 8 rows)
- Video Link (url input, optional)
- Blog Image URL (url input, optional)
- Status (toggle: Draft / Published)

**Bottom:** Cancel (link back) + Create Post button

### E4. Blog Edit Page

**File:** `src/app/dashboard/receptionist/blog/[id]/edit/page.tsx` (create)

Use the **child component pattern** (to avoid eslint react-hooks/exhaustive-deps):
- Parent page fetches blog data, passes to `<EditBlogForm post={post} />`
- Child component handles form state and submission
- Same fields as create, pre-filled
- Update button instead of Create

### E5. Sidebar + Header Update

**File:** `src/lib/sidebar-config.ts`
- Add: `{ label: 'My Blog', href: '/dashboard/receptionist/blog', icon: PenLine }`
- Position: after Reports, before Profile

**File:** `src/components/dashboard/dashboard-header.tsx`
- Add route title: `'/dashboard/receptionist/blog' → 'My Blog'`
- Add: `'/dashboard/receptionist/blog/new' → 'New Post'`
- Add: `'/dashboard/receptionist/blog/[id]/edit' → 'Edit Post'`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/receptionist/posts/route.ts` | Create | Blog list + create API |
| `src/app/api/receptionist/posts/[id]/route.ts` | Create | Blog get/update/delete API |
| `src/app/dashboard/receptionist/blog/page.tsx` | Create | Blog list page |
| `src/app/dashboard/receptionist/blog/new/page.tsx` | Create | Create blog page |
| `src/app/dashboard/receptionist/blog/[id]/edit/page.tsx` | Create | Edit blog page |
| `src/lib/sidebar-config.ts` | Modify | Add blog sidebar entry |
| `src/components/dashboard/dashboard-header.tsx` | Modify | Add blog route titles |

## UI Design Notes
- Same teal/emerald/amber theme as rest of reception module
- Blog card image: 200px height, object-cover, rounded-t-lg
- Status badge: Published = emerald, Draft = amber
- Form uses same input styling as patient blog (shadcn Input, Textarea, Button, Switch)

## Verification
- [ ] Blog list shows with stats row
- [ ] Create new post works
- [ ] Edit post works
- [ ] Delete post with confirmation works
- [ ] Toggle publish/draft status
- [ ] Sidebar shows My Blog entry
- [ ] Header shows correct route titles
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Agent-browser verification

## Stage Summary
- (to be filled by agent)