# DOCTOROOMS — ARCHITECT MASTER PLAN

> **Document Type**: Architectural Master Plan (Strategic + Tactical)
> **Role**: System Architect
> **Date**: 2025-06-24
> **Version**: 1.0
> **Scope**: Entire Doctorooms platform — all 7 modules, 61 pages, 101 API routes, 30 DB models
> **Philosophy**: "Pehle patient, phir workflow, last mein admin" — Revenue-generating flows first

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Assessment](#2-current-architecture-assessment)
3. [Target Architecture Vision](#3-target-architecture-vision)
4. [Architecture Decision Records (ADRs)](#4-architecture-decision-records-adrs)
5. [Technical Debt Register](#5-technical-debt-register)
6. [Module Completion Matrix](#6-module-completion-matrix)
7. [Development Roadmap — 6 Phases](#7-development-roadmap--6-phases)
8. [Phase 0: Foundation — Critical Blockers](#8-phase-0-foundation--critical-blockers)
9. [Phase 1: Patient Journey End-to-End](#9-phase-1-patient-journey-end-to-end)
10. [Phase 2: Workflow Engine (Doctor + Reception)](#10-phase-2-workflow-engine-doctor--reception)
11. [Phase 3: Supporting Modules (Hospital + Assistant + Pharmacist)](#11-phase-3-supporting-modules-hospital--assistant--pharmacist)
12. [Phase 4: Admin & Governance](#12-phase-4-admin--governance)
13. [Phase 5: Architecture Hardening & Modernization](#13-phase-5-architecture-hardening--modernization)
14. [API Architecture Standards](#14-api-architecture-standards)
15. [Component Architecture Standards](#15-component-architecture-standards)
16. [Database Evolution Plan](#16-database-evolution-plan)
17. [File Upload & Storage Architecture](#17-file-upload--storage-architecture)
18. [Real-Time Architecture](#18-real-time-architecture)
19. [Deployment Architecture](#19-deployment-architecture)
20. [Risk Register & Mitigation](#20-risk-register--mitigation)

---

## 1. EXECUTIVE SUMMARY

### 1.1 The Project

Doctorooms is a multi-role healthcare appointment management platform being rebuilt from a PHP/CodeIgniter monolith to Next.js 16. It serves 7 user roles: Patient, Doctor, Receptionist, Hospital, Assistant, Pharmacist, and Admin.

### 1.2 Current State — By The Numbers

```
Pages:           61 dashboard + 11 public = 72 total
API Routes:      101 files, ~150 endpoints
DB Models:       30 (Prisma)
Dependencies:    47 production, 8 dev
Components:      40+ shadcn/ui + 9 custom
Total LOC:       ~30,000+ (estimated)
```

### 1.3 Module Completion

| Module | Pages | APIs | Bugs | Completion | Priority |
|--------|-------|------|------|------------|----------|
| **Patient** | 12 | 30 | 34 | **62%** | 🔴 #1 FIRST |
| **Receptionist** | 14 | 23 | ~12 | **55%** | 🔴 #2 |
| **Doctor** | 13 | 18 | ~15 | **46%** | 🟡 #3 |
| **Hospital** | 3 | 3 | ~5 | **20%** | 🟡 #4 |
| **Assistant** | 3 | 3 | ~3 | **30%** | 🟢 #5 |
| **Pharmacist** | 3 | 3 | ~2 | **25%** | 🟢 #5 |
| **Admin** | 8 | 10 | ~8 | **31%** | 🟢 #6 (LAST) |

### 1.4 The Core Problem

> **85% of code is written but only ~45% works end-to-end.**

The platform suffers from three systemic issues:

1. **Empty database** — zero seed data, app appears dead to any visitor
2. **5 critical bugs in Patient module** — the money-making flow is broken
3. **No cross-module integration testing** — modules built in isolation, don't connect

### 1.5 The Architect's Verdict

```
IF we fix Phase 0 (critical blockers) → Patient module goes from 40% → 80% E2E
IF we complete Phase 1 (patient journey) → Platform has ONE working user flow
IF we complete Phase 2 (workflow)  → Doctor + Reception can process bookings
IF we complete Phase 3 (supporting)  → All roles have functional dashboards
IF we complete Phase 4 (admin)       → Platform is self-service
IF we complete Phase 5 (hardening)  → Production-ready
```

**Estimated total effort**: 6 development phases × 2-3 sessions each = **12-18 focused sessions**

---

## 2. CURRENT ARCHITECTURE ASSESSMENT

### 2.1 Technology Stack (Non-Negotiable)

| Layer | Technology | Version | Status |
|-------|-----------|---------|--------|
| Framework | Next.js (App Router) | 16.1.1 | ✅ Locked |
| Language | TypeScript | 5 | ✅ Locked |
| UI Library | shadcn/ui (New York) | Latest | ✅ Locked |
| Styling | Tailwind CSS | v4 | ✅ Locked |
| Database ORM | Prisma | 6.11.1 | ✅ Locked |
| Database | SQLite (dev) / PostgreSQL (prod) | — | ✅ Locked |
| State | Zustand | 5.0.6 | ✅ Locked |
| Server State | TanStack Query | 5.82.0 | ✅ Locked |
| Forms | react-hook-form + zod | 7.60 / 4.0.2 | ✅ Locked |
| Animations | Framer Motion | 12.23.2 | ✅ Locked |
| Toasts | Sonner | 2.0.6 | ✅ Locked |
| Icons | Lucide React | 0.525.0 | ✅ Locked |
| Charts | Recharts | 2.15.4 | ✅ Locked |
| Date | date-fns | 4.1.0 | ✅ Locked |
| Runtime | Bun | — | ✅ Locked |

### 2.2 Architecture Patterns (Current)

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                        │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Zustand  │  │ TanStack     │  │ Framer Motion      │    │
│  │ (auth)   │  │ Query        │  │ (animations)       │    │
│  └────┬─────┘  └──────┬───────┘  └────────────────────┘    │
│       │               │                                     │
│  ┌────┴───────────────┴──────────────────────────────┐     │
│  │           shadcn/ui Components                     │     │
│  │  (40+ components, all 'use client')                │     │
│  └────────────────────┬──────────────────────────────┘     │
│                       │ fetch()                            │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS SERVER                             │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │           Route Handlers (101 files)               │     │
│  │  requireRole(req, 'role') → user | null           │     │
│  │  try/catch → { data } | { error }                  │     │
│  └────────────────────┬─────────────────────────────┘     │
│                       │                                     │
│  ┌────────────────────┴─────────────────────────────┐     │
│  │              Prisma Client                        │     │
│  │  findMany, findUnique, create, update, delete      │     │
│  └────────────────────┬─────────────────────────────┘     │
│                       │                                     │
│  ┌────────────────────┴─────────────────────────────┐     │
│  │           SQLite Database                          │     │
│  │  30 models, ~20 tables with data                   │     │
│  └──────────────────────────────────────────────────┘     │
│                                                             │
│  Mini-Services:                                             │
│  └── chat-service (port 3003, socket.io) — exists but unused │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 What's RIGHT With Current Architecture

| Decision | Why It's Good |
|----------|--------------|
| Custom cookie-based auth (`api-auth.ts`) | Simple, works, no NextAuth dependency for APIs |
| Zustand for auth state | Fast, no provider nesting, clean API |
| TanStack Query everywhere | Consistent caching, refetching, loading states |
| shadcn/ui (New York) | Consistent, accessible, composable |
| Framer Motion animations | Smooth, professional feel |
| `sonner` for toasts | Lightweight, modern, zero-config |
| Each API = separate file | Easy to find, test, modify independently |
| `doctorooms_session` + `doctorooms_role` cookies | Explicit, debuggable, works across services |

### 2.4 What's WRONG With Current Architecture

| Problem | Severity | Impact |
|---------|----------|--------|
| No middleware.ts — all route protection is client-side | HIGH | Pages flash before redirect, no server-side guard |
| 100% client components (zero server components) | MEDIUM | No SSR/SSG benefits, larger JS bundles |
| No Zod validation on API requests | HIGH | Inconsistent validation, security gaps |
| No shared types directory | MEDIUM | Duplicated type definitions, drift risk |
| 5+ pieces of duplicated code | MEDIUM | Maintenance burden, inconsistency risk |
| Session cookie = raw user ID | CRITICAL | Knowing a CUID = full account access |
| Chat WebSocket service exists but unused | MEDIUM | Wasted infrastructure, HTTP polling instead |
| No file upload infrastructure (except avatar) | HIGH | Medical documents upload is fake |
| 3 monolith page files (700-800 lines) | MEDIUM | Hard to maintain, test, reuse |
| No error boundaries | MEDIUM | Uncaught errors crash the UI |
| No NextAuth integration (dead code in auth.ts) | LOW | Confusion, wasted imports |
| No environment variable validation | LOW | Missing NEXTAUTH_SECRET, etc. |

---

## 3. TARGET ARCHITECTURE VISION

### 3.1 The Target State

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                        │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Zustand  │  │ TanStack     │  │ Framer Motion      │    │
│  │ (auth +  │  │ Query +      │  │ + View Transitions  │    │
│  │  UI)     │  │ InfiniteQuery│  │                     │    │
│  └────┬─────┘  └──────┬───────┘  └────────────────────┘    │
│       │               │                                     │
│  ┌────┴───────────────┴──────────────────────────────┐     │
│  │  Shared Components (extracted from monoliths)      │     │
│  │  + Custom Hooks (usePatientAppointments, etc.)     │     │
│  │  + Shared Types (src/types/)                      │     │
│  └────────────────────┬──────────────────────────────┘     │
│                       │ fetch() + WebSocket                 │
└───────────────────────┼─────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│  Next.js   │  │  Socket.io │  │  File      │
│  API Routes│  │  Service   │  │  Upload    │
│  (validated│  │  (chat +   │  │  Service   │
│   w/ Zod)  │  │   notifs)  │  │  (multer)  │
└──────┬─────┘  └──────┬─────┘  └──────┬─────┘
       │               │               │
       └───────────────┼───────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   Prisma + DB    │
              │   (validated)    │
              └─────────────────┘
```

### 3.2 Architecture Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Patient First** | Every decision prioritizes the patient journey. Revenue comes from bookings. |
| 2 | **Validate Everything** | All API inputs validated with Zod. All outputs typed. No exceptions. |
| 3 | **Extract, Don't Duplicate** | Shared logic in `lib/`, `hooks/`, `types/`, `components/`. DRY at all levels. |
| 4 | **Fail Gracefully** | Error boundaries, loading states, empty states, error toasts — always. |
| 5 | **Secure by Default** | httpOnly cookies, ownership checks, input sanitization, no raw IDs in responses. |
| 6 | **Server When Possible** | Use server components for data-heavy pages. Client only for interactivity. |
| 7 | **Batch Over N+1** | Never make N API calls when 1 batch call will do. |
| 8 | **Real-Time Over Polling** | Use WebSocket for chat, notifications, queue positions. |

---

## 4. ARCHITECTURE DECISION RECORDS (ADRs)

### ADR-001: Authentication — Custom Cookie (Keep)

- **Status**: ACCEPTED
- **Context**: System uses custom `doctorooms_session` cookie (raw user ID) instead of NextAuth JWT
- **Decision**: Keep custom cookie auth for API routes. Fix security (add random token, make httpOnly)
- **Rationale**: Works reliably, simple to debug, no NextAuth dependency. NextAuth config exists but is unused dead code.
- **Consequences**: Must add session token rotation and httpOnly flag. Must remove dead `auth.ts` NextAuth config.

### ADR-002: Validation — Adopt Zod for All APIs

- **Status**: PROPOSED
- **Context**: Currently all API validation is manual (`if (!body.name) return error`). Inconsistent, missing checks.
- **Decision**: Create Zod schemas for every API request body. Validate at route handler entry point.
- **Rationale**: Zod v4 is already a dependency. Provides type inference, auto-parsing, consistent error messages.
- **Consequences**: ~101 route files need Zod schemas. Schemas go in `src/lib/validations/`.

### ADR-003: File Upload — Local Disk (Current Phase)

- **Status**: ACCEPTED
- **Context**: Medical document upload is fake (metadata only). Avatar upload works but writes to `public/`.
- **Decision**: Phase 1-3: Local disk (`uploads/` with Bun file API). Phase 4+: Abstract to storage interface for S3/GCS.
- **Rationale**: SQLite + local disk is sufficient for dev/MVP. Production needs cloud storage.
- **Consequences**: Need `src/lib/storage.ts` abstraction layer. File serving via Next.js API route (not public/).

### ADR-004: Real-Time — Socket.io (Existing Service)

- **Status**: PROPOSED
- **Context**: Chat service exists at `mini-services/chat-service/` (port 3003) but is unused. All real-time is HTTP polling (10s).
- **Decision**: Activate Socket.io for: (1) Chat messages, (2) Notification push, (3) Queue position updates, (4) Booking status changes.
- **Rationale**: Service exists, just needs wiring. Eliminates 10s polling. Better UX for chat.
- **Consequences**: Frontend needs Socket.io client. Auth needs to pass through gateway.

### ADR-005: Component Architecture — Extract From Monoliths

- **Status**: PROPOSED
- **Context**: 3 page files are 700-800 lines. `StarRating` duplicated. `statusColors` in 4+ files.
- **Decision**: Decompose monolith pages into focused components. Extract shared pieces to `src/components/` and `src/hooks/`.
- **Rationale**: Maintainability, testability, reusability. Pages should be orchestrators, not implementations.
- **Consequences**: Each 800-line file becomes 1 page (200 lines) + 4-5 components (100-150 lines each).

### ADR-006: Types — Centralize in `src/types/`

- **Status**: PROPOSED
- **Context**: All types are inline in page files. `AuthUser` duplicated. `statusColors` in 4 files.
- **Decision**: Create `src/types/` with domain-specific type files. Import from there.
- **Rationale**: Single source of truth. Auto-completion. Prevents drift.
- **Consequences**: Need to create type files, then update all imports across 61+ pages.

### ADR-007: Database — Stay SQLite for Dev, Prepare PostgreSQL Migration

- **Status**: ACCEPTED
- **Context**: Current DB is SQLite. `.env.example` shows Supabase PostgreSQL config (commented out).
- **Decision**: Keep SQLite for all development. Schema must be PostgreSQL-compatible (no SQLite-specific features). Migration script exists at `scripts/switch-to-supabase.sh`.
- **Rationale**: SQLite is zero-config for dev. Prisma abstracts the DB layer. Switch is one config change.
- **Consequences**: No raw SQL queries. No SQLite-specific functions. Test migration before production.

### ADR-008: Middleware — Add `middleware.ts` for Route Protection

- **Status**: PROPOSED
- **Context**: Currently all dashboard route protection is client-side (useEffect in layout). Pages flash before redirect.
- **Decision**: Add Next.js `middleware.ts` that checks `doctorooms_session` cookie and redirects unauthenticated users to `/login`.
- **Rationale**: Server-side protection prevents flash. Faster redirect (no JS execution needed). More secure.
- **Consequences**: Middleware can't do DB lookups (edge runtime). Cookie-only check is sufficient for redirect — API routes still do full auth.

---

## 5. TECHNICAL DEBT REGISTER

### Critical Debt (Must Fix in Phase 0)

| ID | Debt | Location | Effort | Impact if Unfixed |
|----|------|----------|--------|-----------------|
| TD-001 | Empty database — no seed data | `prisma/` | Medium | App is invisible and unusable |
| TD-002 | Session cookie = raw user ID | `api/auth/login/route.ts:62` | Small | Account takeover vulnerability |
| TD-003 | No Zod validation on any API | All 101 route files | Large | Data integrity, security gaps |
| TD-004 | Dead NextAuth code | `lib/auth.ts`, `providers.tsx` | Tiny | Confusion, wasted dependency |

### High Debt (Fix in Phase 1-2)

| ID | Debt | Location | Effort |
|----|------|----------|--------|
| TD-005 | Chat GET endpoint has no authorization | `bookings/[bookingId]/chat/route.ts` | Small |
| TD-006 | No middleware.ts for route protection | `src/middleware.ts` (missing) | Medium |
| TD-007 | File upload is fake (metadata only) | `health-records/page.tsx` | Medium |
| TD-008 | 3 monolith page files (700-800 lines) | Appointments detail, Booking, Health records | Large |
| TD-009 | No shared types directory | `src/types/` (missing) | Medium |
| TD-010 | 5+ pieces of duplicated code | Multiple files | Medium |
| TD-011 | Session cookie not httpOnly | `api/auth/login/route.ts:63` | Tiny |

### Medium Debt (Fix in Phase 3-4)

| ID | Debt | Location | Effort |
|----|------|----------|--------|
| TD-012 | No error boundaries | All pages | Small |
| TD-013 | All pages are 'use client' | All 61 dashboard pages | Large |
| TD-014 | No custom data hooks | `src/hooks/` | Medium |
| TD-015 | Unused hooks (use-mobile, use-toast) | `src/hooks/` | Tiny |
| TD-016 | No environment variable validation | `.env` | Small |
| TD-017 | WebSocket service exists but unused | `mini-services/chat-service/` | Medium |
| TD-018 | Files written to `public/` (directly servable) | `patient/avatar/route.ts` | Small |

---

## 6. MODULE COMPLETION MATRIX

### 6.1 Feature-by-Feature Matrix

```
Key: ✅ Working | ⚠️ Partial | ❌ Broken/Missing | — N/A
```

| Feature | Patient | Doctor | Reception | Hospital | Assistant | Pharmacist | Admin |
|---------|---------|--------|-----------|----------|----------|------------|-------|
| **Dashboard (stats + summary)** | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| **Profile (view/edit)** | ⚠️ | ⚠️ | ⚠️ | — | — | — | — |
| **Avatar Upload** | ✅ | — | ✅ | — | — | — | — |
| **Appointments List** | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | — | ⚠️ |
| **Appointment Detail** | ⚠️ | ❌ | — | — | — | — | — |
| **Create Booking** | ❌ | — | ⚠️ | — | — | — | — |
| **Cancel Booking** | ✅ | — | — | — | — | — | — |
| **Status Changes** | — | ⚠️ | ⚠️ | — | — | — | — |
| **Queue Management** | ✅ | ⚠️ | — | — | — | — | — |
| **Prescriptions (list/view)** | ⚠️ | ⚠️ | — | — | — | ⚠️ | — |
| **Create Prescription** | — | ⚠️ | — | — | — | — | — |
| **Print Prescription** | ✅ | — | ⚠️ | — | — | — | — |
| **Medicine Master** | — | ⚠️ | ⚠️ | — | — | ⚠️ | — |
| **Schedule (view)** | ✅ | ⚠️ | ⚠️ | — | — | — | — |
| **Schedule (write)** | — | ⚠️ | ⚠️ | — | — | — | — |
| **Patient List** | — | ⚠️ | ⚠️ | — | ⚠️ | — | — |
| **Patient Detail** | — | ⚠️ | — | — | ⚠️ | — | — |
| **Chat** | ⚠️ | ⚠️ | ⚠️ | — | — | — | — |
| **Video Call** | ✅ | ⚠️ | — | — | — | — | — |
| **Feedback/Ratings** | ✅ | — | — | — | — | — | — |
| **Notifications** | ⚠️ | — | ⚠️ | — | — | — | — |
| **Blog (CRUD)** | ⚠️ | ⚠️ | ⚠️ | — | — | — | ⚠️ |
| **Health Records** | ❌ | — | — | — | — | — | — |
| **Medical Documents** | ❌ | — | — | — | — | — | — |
| **Earnings/Income** | — | ⚠️ | — | — | — | — | — |
| **Gallery** | — | ⚠️ | — | — | — | — | — |
| **Walk-in Registration** | — | — | ⚠️ | — | — | — | — |
| **Reports** | — | — | ⚠️ | — | — | — | — |
| **Settings** | ❌ | ⚠️ | — | — | — | — | ⚠️ |
| **Change Password** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **User Management** | — | — | — | — | — | — | ⚠️ |
| **Hospital Mgmt** | — | — | — | — | — | — | ⚠️ |
| **Inquiries** | — | — | — | — | — | — | ⚠️ |

### 6.2 Module Development Order (Architect's Decision)

```
Phase 0: Foundation          → Seed DB + Fix 5 critical bugs + Fix auth security
Phase 1: Patient Journey      → Patient module 62% → 95%
Phase 2: Workflow Engine      → Doctor 46% → 80%, Reception 55% → 80%
Phase 3: Supporting Roles     → Hospital 20% → 70%, Assistant 30% → 70%, Pharmacist 25% → 70%
Phase 4: Admin & Governance   → Admin 31% → 85%
Phase 5: Hardening            → All modules → 95%+
```

**Rationale for this order:**
- Patient FIRST: Revenue comes from patient bookings. No patients = no platform.
- Doctor + Reception SECOND: They process the bookings patients create. Without them, bookings sit in "Pending" forever.
- Supporting roles THIRD: Assistant and Pharmacist support doctors. Hospital is a separate entity.
- Admin LAST: Admin is governance/maintenance. Not revenue-generating. Can wait.

---

## 7. DEVELOPMENT ROADMAP — 6 PHASES

### Visual Roadmap

```
Week 1:  ██████████ Phase 0 (Foundation) — Seed DB, fix critical bugs, secure auth
Week 2:  ██████████████████ Phase 1 (Patient) — End-to-end patient journey
Week 3:  ██████████████████████ Phase 2 (Workflow) — Doctor + Reception integration
Week 4:  ██████████████████ Phase 3 (Supporting) — Hospital, Assistant, Pharmacist
Week 5:  ██████████ Phase 4 (Admin) — User management, governance
Week 6:  ████████████████ Phase 5 (Hardening) — Architecture, security, performance
```

### Phase Dependency Graph

```
Phase 0 (Foundation)
    │
    ├──→ Phase 1 (Patient Journey)
    │       │
    │       ├──→ Phase 2 (Doctor + Reception Workflow)
    │       │       │
    │       │       └──→ Phase 3 (Supporting Roles)
    │       │               │
    │       │               └──→ Phase 4 (Admin)
    │       │
    │       └──→ Phase 5 (Architecture Hardening) [can run parallel after Phase 1]
    │
    └──→ Phase 5 (Security fixes can start immediately)
```

---

## 8. PHASE 0: FOUNDATION — CRITICAL BLOCKERS

> **Goal**: Make the app visible and the patient login→book flow technically possible
> **Effort**: 1-2 sessions
> **Success Criteria**: (1) Landing page shows real data, (2) Patient can register+login, (3) Patient can book an appointment

### 8.1 Task 0.1: Database Seed Script

**Priority**: 🔴 CRITICAL (Nothing works without this)
**File**: `prisma/seed.ts` (already exists, needs enhancement)
**Effort**: Medium

**Specification**:
```
Seed Data Requirements:

1. DOCTORS (8 users + 8 doctor profiles)
   - Specializations: Cardiologist, Dermatologist, Pediatrician, Orthopedic,
     General Physician, ENT, Ophthalmologist, Gynecologist
   - Each with: User (role=doctor, status=Active) + Doctor profile
   - Each with: 5-6 day schedule (DoctorSchedule entries)
   - 2 linked to Hospital records
   - 1 with isEmergency=true
   - Fees: ₹200-₹1000
   - Cities: Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Kolkata
   - Each with 5-8 DoctorMedicine entries
   - Each with 2-3 DoctorHoliday entries (upcoming dates)

2. HOSPITALS (2 users + 2 hospital profiles)
   - Cities: Mumbai, Delhi
   - With addresses

3. RECEPTIONISTS (3 users + 3 receptionist profiles)
   - Each linked to a doctor

4. PATIENTS (15 users, role=patient, status=Active)
   - Mix of genders, cities
   - All with bcrypt-hashed password: "123456"

5. BOOKINGS (40 bookings)
   - Distribution: 10 Pending, 8 Approve, 10 Visited, 5 Finish, 4 Canceled, 3 Extend
   - Spread across doctors and dates (last 60 days)
   - Mix of InPerson and VideoCall
   - All with appointmentNo like "APT-{timestamp}"

6. PRESCRIPTIONS (10 for Visited/Finished bookings)
   - Each with 2-4 PMedicine entries
   - Some with PLabel entries
   - Some with PSuggestion entries
   - Include vitals (bp, temperature, weight)

7. RATINGS (10 for Finished bookings)
   - Stars 3-5, some with reviews

8. NOTIFICATIONS (25)
   - Mix of READ/UNREAD
   - Different types: booking created, approved, prescription ready

9. BLOG POSTS (7)
   - 5 Published, 2 Draft
   - Mix of Blog and News types

10. MASTER DATA
    - 5 DoctorTypeMaster entries
    - 10 DiseaseMaster entries
    - 5 DoctorGallery entries per doctor

11. CHAT MESSAGES (20)
    - For 5 approved/visited bookings
    - Back-and-forth between patient and doctor

12. MEDICAL DOCUMENTS (5)
    - For 3 patients, different categories
```

### 8.2 Task 0.2: Fix Booking Form — Add Gender Field

**Priority**: 🔴 CRITICAL
**File**: `src/app/dashboard/patient/book/[doctorId]/page.tsx`
**Effort**: Small (30 min)

**Specification**:
- Auto-populate gender from `useAuthStore` user data
- Show a `<Select>` with Male/Female/Other options (use `GENDERS` from `@/lib/constants`)
- Default to user's current gender
- Include in booking mutation body

### 8.3 Task 0.3: Fix Settings Page Broken JSX

**Priority**: 🔴 CRITICAL
**File**: `src/app/dashboard/patient/settings/page.tsx` (lines 183-188)
**Effort**: Tiny (10 min)

**Specification**:
- The outer `Array.from({ length: 3 }).map()` is missing its closing `)}` before `</Card>`
- Fix the JSX nesting in the loading skeleton section

### 8.4 Task 0.4: Fix Register Page Step 3 Crash

**Priority**: 🔴 CRITICAL
**File**: `src/app/register/page.tsx`
**Effort**: Small (30 min)

**Specification**:
- Audit Step 3 JSX for block elements inside inline elements
- Likely a `<p>` containing a `<div>` (skeleton) or similar nesting violation
- Fix the nesting to be valid JSX

### 8.5 Task 0.5: Fix Login Error Feedback

**Priority**: 🔴 CRITICAL
**File**: `src/app/login/page.tsx`
**Effort**: Tiny (15 min)

**Specification**:
- On API response `!response.ok`, show error toast: `toast.error('Invalid email or password')`
- Currently fails silently on 401

### 8.6 Task 0.6: Secure Session Cookie

**Priority**: 🔴 CRITICAL (Security)
**File**: `src/app/api/auth/login/route.ts`
**Effort**: Small (45 min)

**Specification**:
- Generate random session token: `crypto.randomUUID()`
- Store mapping in a new `Session` model or in-memory map (for now)
- Set cookie value to session token (not user ID)
- Set `httpOnly: true` on cookie
- Update `api-auth.ts` to look up user from session token
- **Alternative (simpler for Phase 0)**: Just make httpOnly=true, add sameSite:'lax', secure in production. Keep user ID in cookie for now. Full token migration in Phase 5.

### 8.7 Task 0.7: Fix /book 404

**Priority**: 🔴 HIGH
**File**: `src/app/book/page.tsx` (new file)
**Effort**: Tiny (15 min)

**Specification**:
- Create a simple redirect page: `router.replace('/doctors')`
- Show a toast: "Please select a doctor first to book an appointment"

---

## 9. PHASE 1: PATIENT JOURNEY END-TO-END

> **Goal**: Complete patient journey from discovery → booking → consultation → rating
> **Effort**: 2-3 sessions
> **Success Criteria**: Patient can: discover doctors, book, chat, view prescription, rate
> **Depends on**: Phase 0 complete

### 9.1 Task 1.1: Fix Landing Page Interactivity

**Files**:
- `src/app/page.tsx` (landing page)
**Effort**: Medium (1-2 hrs)

**Specification**:
- **Search bar**: Add `onSubmit` handler → `router.push(\`/doctors?search=${encodeURIComponent(query)}\`)`
- **Specialization cards**: Wrap each card in `<Link href={\`/doctors?specialization=${name}\`}>`
- **"Book Appointment" CTAs**: Change `/book` links to `/doctors` (2-3 instances)
- **Stats fallback**: When `data.doctorCount === 0`, show fallback numbers (15, 8, 2400, 5800)
- **Featured doctors**: When 0 doctors, show "No doctors available yet" or hide section
- **Math.random()**: Wrap specialization counts in `useMemo` or remove when 0
- **Doctor card buttons**: Wrap "Book Appointment" and "View Profile" in proper `<Link>`

### 9.2 Task 1.2: Fix Doctor Profile CTA for Unauthenticated Users

**File**: `src/app/doctors/[id]/page.tsx`
**Effort**: Small (30 min)

**Specification**:
- Import `useAuthStore` and `isAuthenticated`
- On "Book Appointment" click: if not authenticated → `router.push(\`/login?redirect=/doctors/${id}\`)`
- If authenticated → navigate to booking page as before

### 9.3 Task 1.3: Fix Chat fromId Bug

**File**: `src/app/dashboard/patient/appointments/[id]/page.tsx`
**Effort**: Tiny (15 min)

**Specification**:
- Replace `msg.fromId === 'me'` with `msg.fromId === user.id`
- Get `user` from `useAuthStore()`
- Messages will now appear on the correct side

### 9.4 Task 1.4: Real File Upload for Medical Documents

**Files**:
- `src/app/api/patient/medical-documents/route.ts` (modify POST to handle FormData)
- `src/app/dashboard/patient/health-records/page.tsx` (add file input, send FormData)
**Effort**: Medium (1-2 hrs)

**Specification**:
- **Frontend**: Add `<Input type="file">` to upload dialog. Accept: PDF, JPG, PNG, DOC, DOCX. Max 5MB.
- **Frontend**: On submit, create `FormData` with file + metadata (title, category, description)
- **API**: Parse FormData. Read file buffer. Generate unique filename.
- **API**: Write to `uploads/documents/{userId}_{timestamp}_{filename}`
- **API**: Store `fileUrl`, `fileName`, `fileSize`, `mimeType` in MedicalDocument
- **Download**: Create a new API route `GET /api/patient/medical-documents/[id]/download` that streams the file

### 9.5 Task 1.5: Fix Blog VideoLink

**Files**:
- `src/app/api/patient/posts/route.ts` (add videoLink to create)
- `src/app/api/patient/posts/[id]/route.ts` (add videoLink to update)
- `src/app/dashboard/patient/blog/[id]/edit/page.tsx` (load videoLink from post)
**Effort**: Small (30 min)

**Specification**:
- Add `videoLink` to Prisma `create` and `update` calls in both route files
- In edit page, initialize `videoLink` state from `post.videoLink` instead of empty string

### 1.6 Task 1.6: Fix Profile Save → Header Name Update

**File**: `src/app/dashboard/patient/profile/page.tsx`
**Effort**: Tiny (10 min)

**Specification**:
- After successful profile PUT, add: `useAuthStore.getState().setUser({ ...useAuthStore.getState().user, name: updatedName })`

### 9.7 Task 1.7: Add Error States to Patient Pages

**Files**: All 12 patient pages
**Effort**: Medium (1 hr)

**Specification**:
- For each `useQuery`, add `isError` check with user-friendly error message and retry button
- Pattern:
  ```tsx
  if (isError) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">Failed to load data</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-2">Retry</Button>
      </Card>
    )
  }
  ```

### 9.8 Task 1.8: Fix Footer Broken Links

**File**: `src/components/layout/public-footer.tsx`
**Effort**: Small (30 min)

**Specification**:
- Remove dead dashboard links (Doctor Dashboard, Prescriptions, Schedule)
- Change "Join as Doctor" → `/register` (with pre-selected doctor role)
- Change Privacy/Terms/Cookies to `#` with title="Coming soon" or create simple placeholder pages

---

## 10. PHASE 2: WORKFLOW ENGINE (DOCTOR + RECEPTION)

> **Goal**: Doctor and Receptionist can process bookings end-to-end
> **Effort**: 3-4 sessions
> **Success Criteria**: Complete booking lifecycle works (Pending → Approved → Visited → Finished)
> **Depends on**: Phase 0 + Phase 1

### 10.1 Doctor Module Gaps (from DOCTOR-MODULE-PLAN.md)

| Priority | Task | File | Effort |
|----------|------|------|--------|
| HIGH | Fix stats API syntax issue | `dashboard/doctor/stats/route.ts` | Tiny |
| HIGH | Add appointment detail page | `dashboard/doctor/appointments/[id]/page.tsx` | Large |
| HIGH | Emergency toggle in profile | `dashboard/doctor/profile/page.tsx` | Small |
| MEDIUM | Gallery file upload (currently URL-only) | `dashboard/doctor/gallery/page.tsx` | Medium |
| MEDIUM | Prescription C/O section + next visit | `prescription/` pages | Medium |
| MEDIUM | Complete schedule slot write API | `schedule/slots/route.ts` | Medium |
| LOW | Blog image upload | `posts/` pages | Small |
| LOW | Photo upload in profile | `profile/page.tsx` | Small |

### 10.2 Receptionist Module Gaps (from RECEPTION-MODULE-PLAN.md)

| Priority | Task | File | Effort |
|----------|------|------|--------|
| HIGH | Scope pending bookings to linked doctor | `pending-bookings/page.tsx` | Small |
| HIGH | Add Extend/Visited status actions | `appointments/page.tsx` | Medium |
| HIGH | Rich booking form (15 fields vs 5) | `walk-in/page.tsx` | Large |
| MEDIUM | Add chat UI for receptionist | New component | Medium |
| MEDIUM | Blog write access | `blog/` pages | Small |
| MEDIUM | Medicine master write access | `medicines/` pages | Small |
| MEDIUM | Schedule write access | `schedule/` pages | Small |
| LOW | Dashboard enhancements | `page.tsx` | Medium |

### 10.3 Cross-Module Integration Tests

After Phase 2, verify this complete flow works:

```
1. Patient registers → logs in
2. Patient discovers doctor → views profile
3. Patient books appointment → status: Pending
4. Receptionist sees pending booking → Approves → status: Approve
5. Patient sees queue position → waits
6. Doctor sees approved booking → Starts consultation → status: Visited
7. Doctor creates prescription with medicines
8. Patient views prescription → prints it
9. Doctor marks as Finished → status: Finish
10. Patient rates the visit → submits feedback
11. Rating appears on doctor's public profile
```

---

## 11. PHASE 3: SUPPORTING MODULES (HOSPITAL + ASSISTANT + PHARMACIST)

> **Goal**: All supporting roles have functional dashboards
> **Effort**: 3-4 sessions
> **Depends on**: Phase 2

### 11.1 Hospital Module (20% → 70%)

Currently has 3 pages + 3 GET-only APIs. Needs:

| Priority | Task | Type |
|----------|------|------|
| HIGH | Hospital profile page (view/edit) | Page + API |
| HIGH | Add doctor to hospital (link existing) | API + UI |
| HIGH | Appointment detail page | Page |
| MEDIUM | Appointment create (receptionist-like booking) | Page + API |
| MEDIUM | Income/earnings summary | Page + API |
| MEDIUM | Blog management | Page + API |
| MEDIUM | Notifications | Page + API |
| LOW | Dashboard enhancements | Page |

### 11.2 Assistant Module (30% → 70%)

Currently has 3 pages + 3 APIs. Needs:

| Priority | Task | Type |
|----------|------|------|
| HIGH | Patient detail view (linked to doctor) | Page + API |
| HIGH | Appointment detail view | Page |
| MEDIUM | Dashboard enhancements | Page |
| LOW | Notifications | Page + API |

### 11.3 Pharmacist Module (25% → 70%)

Currently has 3 pages + 3 APIs. Needs:

| Priority | Task | Type |
|----------|------|------|
| HIGH | Prescription detail view | Page |
| HIGH | Medicine management (view linked doctor's) | Enhancement |
| MEDIUM | Dashboard enhancements | Page |
| LOW | Notifications | Page + API |

---

## 12. PHASE 4: ADMIN & GOVERNANCE

> **Goal**: Self-service platform administration
> **Effort**: 2-3 sessions
> **Depends on**: Phase 3
> **Note**: Admin is LAST per user's explicit instruction

### 12.1 Admin Module (31% → 85%)

From `ADMIN-COMPLETE-IMPLEMENTATION-PLAN.md`:

| Priority | Task | Type |
|----------|------|------|
| HIGH | User management (CRUD, status, role) | Already exists, needs fixes |
| HIGH | Doctor approval workflow | Page + API |
| HIGH | Hospital approval workflow | Page + API |
| MEDIUM | System settings (fees, commission, limits) | Page + API |
| MEDIUM | Blog moderation (approve/reject patient posts) | Enhancement |
| MEDIUM | Advanced reports/analytics | Page + API |
| LOW | Slider management | Page + API |
| LOW | Disease/Doctor type masters | Page + API |
| LOW | Full audit log | Page + API |

---

## 13. PHASE 5: ARCHITECTURE HARDENING & MODERNIZATION

> **Goal**: Production-ready codebase
> **Effort**: 3-4 sessions (can run parallel after Phase 1)

### 13.1 Security Hardening

| Task | Effort | Phase When to Start |
|------|--------|-------------------|
| Session token (replace raw user ID) | Medium | Phase 5 |
| Add `middleware.ts` for route protection | Medium | Phase 5 |
| Zod validation on all 101 API routes | Large | Phase 5 (start with patient APIs) |
| Chat GET authorization check | Tiny | Immediate |
| File serving via API (not public/) | Small | Phase 5 |
| Rate limiting on auth routes | Small | Phase 5 |
| Remove demo credentials from source | Tiny | Phase 5 |
| Remove OTP from toast message | Tiny | Immediate |

### 13.2 Code Quality

| Task | Effort |
|------|--------|
| Create `src/types/` directory with shared types | Medium |
| Extract `StarRating` to `src/components/ui/star-rating.tsx` | Small |
| Extract `statusColors` to `src/lib/constants.ts` | Small |
| Extract `getInitials()` to `src/lib/utils.ts` | Tiny |
| Create custom hooks (`usePatientProfile`, etc.) | Medium |
| Decompose 3 monolith pages (800+ lines each) | Large |
| Remove dead `auth.ts` NextAuth config | Tiny |
| Remove unused `use-toast.ts` hook | Tiny |

### 13.3 Performance

| Task | Effort |
|------|--------|
| Batch queue position API | Small |
| Batch slot availability API | Medium |
| Doctors listing pagination | Small |
| Notification auto-refresh (30s polling) | Tiny |
| Activate WebSocket for chat (replace 10s polling) | Medium |
| Activate WebSocket for notifications | Medium |

### 13.4 UX Enhancements

| Task | Effort |
|------|--------|
| Rich text editor for blog (use @mdxeditor/editor, already installed) | Medium |
| Blog image upload | Small |
| Image upload for public pages | Small |
| Hospital detail page (`/hospitals/[id]`) | Medium |
| Legal pages (Privacy, Terms, Cookies) | Small |
| Landing page blog preview section | Small |

---

## 14. API ARCHITECTURE STANDARDS

### 14.1 Route Handler Template

Every API route MUST follow this pattern:

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// 1. Validation schemas (at top of file)
const CreateBodySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  status: z.enum(['Active', 'Inactive']).optional(),
});

// 2. Type inference from schema
type CreateBody = z.infer<typeof CreateBodySchema>;

// 3. Route handler
export async function POST(req: NextRequest) {
  // 3a. Auth check
  const user = await requireRole(req, 'patient');
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3b. Parse + validate body
  let body: CreateBody;
  try {
    const raw = await req.json();
    body = CreateBodySchema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // 3c. Business logic
  try {
    const record = await db.example.create({
      data: { ...body, userId: user.id },
    });
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error('POST /api/example:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 14.2 Response Standards

```typescript
// Success
{ data: T }                    // Single item
{ items: T[], total: number }  // List with total
{ success: true, ... }         // Mutation acknowledgment

// Error
{ error: string }              // Human-readable message
{ error: string, details: ZodError[] }  // Validation errors
```

### 14.3 Auth Patterns

```typescript
// Role-required (most common)
const user = await requireRole(req, 'patient');
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// Any authenticated user
const user = await requireAuth(req);
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// Ownership check (after auth)
if (record.userId !== user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### 14.4 New Batch APIs Needed

| Endpoint | Method | Purpose | Replaces |
|----------|--------|---------|----------|
| `/api/patient/bookings/queue/batch` | POST | Batch queue positions | N× GET /queue?bookingId=X |
| `/api/patient/bookings/check-slots` | POST | Batch slot availability | N× GET /check-slot?slot=X |
| `/api/dashboard/patient/notifications/stream` | GET (SSE) | Real-time notification push | 30s polling |
| `/api/bookings/[id]/chat/stream` | GET (SSE) | Real-time chat messages | 10s polling |

---

## 15. COMPONENT ARCHITECTURE STANDARDS

### 15.1 Component Decomposition Rule

> **No page file should exceed 400 lines.**
> If it does, extract components until it fits.

### 15.2 Shared Components to Extract

| Component | Current Location | Target | Lines Saved |
|-----------|-----------------|--------|-------------|
| `StarRating` | Inline in `feedback/page.tsx` + `page.tsx` | `src/components/ui/star-rating.tsx` | ~40 per usage |
| `StatusBadge` | Inline in 6+ pages | `src/components/shared/status-badge.tsx` | ~30 per usage |
| `EmptyState` | Inline in 10+ pages | `src/components/shared/empty-state.tsx` | ~20 per usage |
| `ErrorState` | Missing | `src/components/shared/error-state.tsx` | New |
| `PageHeader` | Inline in 10+ pages | `src/components/shared/page-header.tsx` | ~15 per usage |
| `ConfirmDialog` | Various AlertDialog usages | `src/components/shared/confirm-dialog.tsx` | ~25 per usage |

### 15.3 Custom Hooks to Create

| Hook | Purpose | Used By |
|------|---------|----------|
| `usePatientProfile()` | Fetch + cache patient profile | Profile, Booking form |
| `usePatientAppointments(filters?)` | Fetch + filter appointments | Dashboard, Appointments list |
| `usePatientNotifications()` | Fetch + auto-refresh notifications | Notifications, Header bell |
| `useBookingChat(bookingId)` | Fetch + send chat messages | Appointment detail |
| `useDoctorSchedule(doctorId)` | Fetch doctor's schedule | Booking page |
| `useSlotAvailability(doctorId, date, slots)` | Batch check slot availability | Booking page |

### 15.4 Types Directory Structure

```
src/types/
├── auth.ts          # AuthUser, LoginRequest, RegisterRequest
├── booking.ts       # Booking, BookingStatus, BookingMode, QueuePosition
├── doctor.ts        # Doctor, DoctorSchedule, DoctorProfile
├── prescription.ts  # Prescription, PMedicine, PLabel, PSuggestion
├── notification.ts  # Notification, NotificationSettings
├── post.ts          # Post, PostStatus
├── medical-doc.ts   # MedicalDocument, DocumentCategory
├── rating.ts        # DoctorRating, FeedbackItem
├── common.ts        # PaginatedResponse, ApiError, StatusColors
└── index.ts         # Re-exports everything
```

---

## 16. DATABASE EVOLUTION PLAN

### 16.1 Models to Add

| Model | Purpose | Phase |
|-------|---------|-------|
| `Session` | Secure session token storage | Phase 5 |
| `AdminConfig` | Platform settings (fees, commission, limits) | Phase 4 |
| `AuditLog` | Track admin/user actions | Phase 5 |

### 16.2 Models to Modify

| Model | Change | Phase |
|-------|--------|-------|
| `Post` | Add `videoLink` field (String, default '') | Phase 1 |
| `User` | Add `lastLoginAt` (DateTime?) | Phase 5 |
| `Booking` | Consider adding `rescheduledFrom` for re-booking tracking | Phase 2 |

### 16.3 Schema Design Principles

1. **No SQLite-specific features** — use only Prisma-compatible types
2. **All strings have `@default('')`** — never null strings
3. **All numbers have `@default(0)`** — never null numbers
4. **Optional fields use `?` type** — explicit nullability
5. **JSON fields use `String` type** — Prisma SQLite doesn't support Json type natively
6. **Cascade deletes** — use `onDelete: Cascade` for owned relationships

---

## 17. FILE UPLOAD & STORAGE ARCHITECTURE

### 17.1 Current State

| Upload Type | Working? | Storage | Max Size | Types |
|-------------|----------|---------|----------|-------|
| Patient avatar | ✅ | `public/uploads/profile/` | 2MB | JPEG, PNG, WebP |
| Receptionist avatar | ✅ | `public/uploads/profile/` | 2MB | JPEG, PNG, WebP |
| Medical documents | ❌ | N/A | N/A | N/A |
| Blog images | ❌ | N/A | N/A | N/A |
| Doctor gallery | ❌ | N/A | N/A | N/A |

### 17.2 Target Architecture

```
src/lib/storage.ts (abstraction layer)
├── uploadFile(file: File, folder: string): Promise<FileInfo>
├── deleteFile(path: string): Promise<void>
├── getFilePath(path: string): string
└── getFileUrl(path: string): string

Upload directories:
├── uploads/profiles/     # Avatar images
├── uploads/documents/    # Medical documents (PDF, DOC, images)
├── uploads/blog/         # Blog post images
├── uploads/gallery/      # Doctor gallery images
└── uploads/prescriptions/# Prescription attachments (future)

File serving:
├── Development: Next.js API route (GET /api/files/[...path])
└── Production: CDN / S3 signed URLs (future)
```

### 17.3 File Validation Standards

```typescript
const ALLOWED_TYPES: Record<string, string[]> = {
  avatar: ['image/jpeg', 'image/png', 'image/webp'],
  document: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword',
             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  blog: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  gallery: ['image/jpeg', 'image/png', 'image/webp'],
};

const MAX_SIZES: Record<string, number> = {
  avatar: 2 * 1024 * 1024,    // 2MB
  document: 5 * 1024 * 1024,  // 5MB
  blog: 2 * 1024 * 1024,      // 2MB
  gallery: 5 * 1024 * 1024,   // 5MB
};
```

---

## 18. REAL-TIME ARCHITECTURE

### 18.1 Current State

| Feature | Current Implementation | Latency | Issues |
|---------|----------------------|---------|--------|
| Chat | HTTP polling (10s interval) | 0-10s | Wasted requests, stale data |
| Notifications | No auto-refresh | ∞ | Must manually refresh |
| Queue position | On-demand fetch | Manual | No live updates |
| Booking status | On page visit | Manual | No push notifications |

### 18.2 Target Architecture (Socket.io)

```
┌──────────┐     Socket.io      ┌──────────────┐     ┌──────────┐
│  Client  │ ◄════════════════► │ Chat Service │ ◄──► │  Prisma  │
│ (Browser)│  ws:///?XTransform  │  (port 3003) │     │   (DB)   │
└──────────┘      Port=3003     └──────────────┘     └──────────┘

Events:
├── chat:message          (send + receive)
├── chat:read             (mark as read)
├── notification:new      (push to user)
├── notification:read     (mark as read)
├── booking:status-change (push to patient + doctor)
├── queue:update          (push to waiting patients)
└── doctor:online-status  (push to patients viewing profile)

Rooms (per booking):
├── booking:{bookingId}   (patient + doctor + receptionist)
└── user:{userId}         (personal notifications)
```

### 18.3 Migration Path

1. **Phase 2**: Wire chat through Socket.io (replace 10s polling)
2. **Phase 3**: Add notification push events
3. **Phase 4**: Add booking status change events
4. **Phase 5**: Add queue position and online status events

---

## 19. DEPLOYMENT ARCHITECTURE

### 19.1 Current (Development)

```
Caddy (:81) → Next.js (:3000) → SQLite (file)
                                       → Socket.io (:3003, unused)
```

### 19.2 Target (Production)

```
                    ┌─────────────┐
                    │   CDN/Proxy  │
                    │  (Caddy/NGINX)│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Next.js  │ │ Socket.io│ │ File     │
        │ (Node)   │ │ Service  │ │ Storage  │
        └────┬─────┘ └────┬─────┘ │ (S3/GCS) │
             │            │        └──────────┘
             │            │
             ▼            ▼
        ┌─────────────────────┐
        │  PostgreSQL (Supabase)│
        └─────────────────────┘
```

### 19.3 Environment Variables

```env
# Required
DATABASE_URL=postgresql://...          # Prisma connection
NEXTAUTH_SECRET=...                      # Session encryption
SESSION_SECRET=...                       # Session token signing

# Optional
NEXT_PUBLIC_APP_URL=https://...         # Public app URL
STORAGE_TYPE=local                       # local | s3
S3_BUCKET=...                           # If S3 storage
S3_REGION=...                           # If S3 storage
S3_ACCESS_KEY=...                       # If S3 storage
S3_SECRET_KEY=...                       # If S3 storage

# Email (future)
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

---

## 20. RISK REGISTER & MITIGATION

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| R-1 | **Seed data becomes stale** | Medium | Medium | Create idempotent seed script that can be re-run. Add `--force` flag to reset. |
| R-2 | **SQLite limits hit in production** | Low | High | Keep schema PostgreSQL-compatible. Test migration before production. |
| R-3 | **Session security breach** | Medium | Critical | Phase 0: httpOnly. Phase 5: Random tokens. Phase 5+: Refresh rotation. |
| R-4 | **Monolith pages become unmaintainable** | High | Medium | Phase 5 decomposition. Keep new pages under 400 lines. |
| R-5 | **N+1 queries cause performance issues** | High | Medium | Phase 2: Batch APIs. Phase 5: DataLoader pattern if needed. |
| R-6 | **Module integration breaks existing flows** | Medium | High | Phase 2: End-to-end integration test. Browser verification after each phase. |
| R-7 | **Scope creep in Phase 3-4** | High | Medium | Strict phase boundaries. No new features in hardening phase. |
| R-8 | **File uploads fill disk** | Low | Medium | Add file size limits. Phase 5: Add storage quotas per user. |
| R-9 | **Chat service crashes** | Low | Medium | Graceful fallback to HTTP polling if WebSocket fails. |
| R-10 | **Doctor schedule conflicts** | Medium | Medium | Already handled by check-slot API. Add database-level unique constraint for same doctor/date/slot. |

---

## APPENDIX A: DECISION LOG

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-06-24 | Patient module FIRST | Revenue comes from patient bookings |
| 2025-06-24 | Admin module LAST | Not revenue-generating, can wait |
| 2025-06-24 | Keep custom cookie auth (not NextAuth) | Works, simple, no dependency |
| 2025-06-24 | Adopt Zod for API validation | Already installed, consistent, type-safe |
| 2025-06-24 | Activate Socket.io for real-time | Service exists, better than polling |
| 2025-06-24 | Local disk storage for Phase 1-3 | Simple, no external dependency |
| 2025-06-24 | No new external dependencies | 47 production deps already, enough |

## APPENDIX B: QUICK REFERENCE — FILES TO KNOW

```
Core Infrastructure:
├── src/lib/api-auth.ts          ← Auth middleware (requireRole, requireAuth)
├── src/lib/auth-store.ts        ← Zustand auth state
├── src/lib/db.ts                ← Prisma client
├── src/lib/sidebar-config.ts    ← Navigation per role
├── src/lib/constants.ts         ← App constants (GENDERS, SPECIALIZATIONS)
├── src/lib/utils.ts             ← cn() utility
├── src/components/providers.tsx  ← QueryClient + ThemeProvider
├── src/app/dashboard/layout.tsx ← Dashboard shell + auth check
└── prisma/schema.prisma         ← 30 DB models

Patient Module:
├── src/app/dashboard/patient/   ← 12 pages, 4,943 lines
├── src/app/api/patient/          ← 16 route files, patient-specific
├── src/app/api/dashboard/patient/ ← 4 route files, dashboard data
└── src/app/api/bookings/         ← Chat route (shared)

Public Pages:
├── src/app/page.tsx              ← Landing page (~740 lines)
├── src/app/doctors/              ← Listing + profile
├── src/app/login/                ← Login
├── src/app/register/             ← Registration (crashes Step 3)
└── src/components/layout/        ← Navbar, Footer, PublicLayout
```

---

*End of Architect Master Plan v1.0*
*Created by: System Architect*
*Date: 2025-06-24*