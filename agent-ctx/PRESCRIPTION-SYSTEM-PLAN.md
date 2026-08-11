# PRESCRIPTION SYSTEM — Complete Architecture & Development Plan

> **Version**: 1.0  
> **Last Updated**: 2025-06-24  
> **Status**: PLANNING — No development yet  
> **Scope**: Full prescription settings + 6-step stepper wizard + assistant pre-fill + print overhaul  

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Current State Audit](#2-current-state-audit)
3. [Data Model Changes](#3-data-model-changes)
4. [API Routes Plan](#4-api-routes-plan)
5. [UI Pages Plan](#5-ui-pages-plan)
6. [Shared Components](#6-shared-components)
7. [6-Step Stepper Wizard — Detailed Spec](#7-6-step-stepper-wizard--detailed-spec)
8. [Assistant Pre-Fill Workflow](#8-assistant-pre-fill-workflow)
9. [Print Template Overhaul](#9-print-template-overhaul)
10. [Sidebar Changes](#10-sidebar-changes)
11. [Development Phases](#11-development-phases)
12. [Migration & Backward Compatibility](#12-migration--backward-compatibility)
13. [Risk Register](#13-risk-register)

---

## 1. EXECUTIVE SUMMARY

### The Problem
The current prescription system is a **flat single-page form**. The old legacy PHP system ("Doctorooms") had a sophisticated **6-step AJAX stepper wizard** where:
- **Assistant** pre-fills complaints & vitals OUTSIDE the cabin
- **Doctor** opens prescription → sees pre-filled data → adds medicines → clicks suggestions → prints
- Everything is **pre-configured** in Prescription Settings — doctor CLICKS, never types
- **Multi-language** support (Gujarati/English) throughout
- **Medicine dose** is a **TAG INPUT** with multiple dose options per medicine
- **Morning/Afternoon/Evening** are **NUMBERS** (tablet count), not checkboxes
- **Findings Master** allows one-click auto-fill of entire medicine list

### The Goal
Rebuild the entire prescription subsystem to match the legacy system's workflow while maintaining the modern Next.js/React/Tailwind/Supabase stack.

### Key Numbers
- **6 new Prisma models** to add
- **3 existing models** to modify
- **8 new API route files** to create
- **4 existing API routes** to modify
- **9 new UI pages** to create
- **2 existing pages** to completely rewrite
- **1 existing component** to rewrite (print-view)
- **1 new shared component** (stepper)
- **1 sidebar config update** (treeview for prescription settings)

---

## 2. CURRENT STATE AUDIT

### 2.1 Existing Prisma Models (Related to Prescription)

| Model | Purpose | Status | Issues |
|-------|---------|--------|--------|
| `Prescription` | Main prescription record | ✅ Exists | Missing `nextVisit`, `status` fields |
| `PMedicine` | Medicine rows in Rx | ✅ Exists | `morning/afternoon/evening` = **Boolean** (should be **Int**), no dose options |
| `PLabel` | Label/vital rows in Rx | ✅ Exists | OK — has `labelUnit` |
| `PSuggestion` | Suggestion rows in Rx | ✅ Exists | OK — has `question` + `suggestions` |
| `PDignoTable` | Custom table data in Rx | ✅ Exists | OK — has `headerLabel`, `colsLabel`, `footerLabel` as JSON |
| `PCo` | Chief complaints selected in Rx | ✅ Exists | OK — links to `CoMaster` |
| `POtherSetting` | Print header/settings | ✅ Exists | Has `fullHeader`, `header`, `isFullHeader` |
| `CoMaster` | Complaints master | ✅ Exists | Missing `coDetailEn`, no `categoryId` for category grouping |
| `LabelMaster` | Labels/vitals master | ✅ Exists | Missing `labelEn`, `unit`, `showUnit` |
| `QuestionsMaster` | Questions bank | ✅ Exists | Missing `questionEn`, `explanationEn` |
| `SuggestionsMaster` | Suggestions bank | ✅ Exists | Missing `suggestionsEn`, no `category` field |
| `DoctorMedicine` | Medicine master list | ✅ Exists | `morning/afternoon/evening` = **String** (should be **Int**), `dose` = single String (should be JSON array `[]`) |
| `Doctor` | Doctor profile | ✅ Exists | Has relations to all master tables |

### 2.2 Existing Pages

| Page | Route | Status | What's Wrong |
|------|-------|--------|--------------|
| Prescription List | `/dashboard/doctor/prescriptions` | ✅ Exists | OK — listing works |
| New Prescription | `/dashboard/doctor/prescriptions/new` | ⚠️ Flat form | Must become 6-step stepper wizard |
| View/Edit Prescription | `/dashboard/doctor/prescriptions/[id]` | ⚠️ Flat view | Must support stepper-style edit, morning/afternoon/evening shown as checkboxes (should be numbers) |
| Medicine Master | `/dashboard/doctor/medicines` | ⚠️ Wrong field types | Dose = text input (should be tag input), morning/afternoon/evening = text (should be numbers) |
| CO Categories | — | ❌ Missing | No page exists |
| Complaints | — | ❌ Missing | No page exists |
| Questions | — | ❌ Missing | No page exists |
| Suggestions | — | ❌ Missing | No page exists |
| Labels | — | ❌ Missing | No page exists |
| Table Master | — | ❌ Missing | No page exists |
| Print Settings | — | ❌ Missing | No page exists |
| Findings Master | — | ❌ Missing | No page + no model |
| Assistant Pre-Fill | — | ❌ Missing | No page for assistant to pre-fill complaints/vitals |

### 2.3 Existing API Routes

| Route | Methods | Status | Issues |
|-------|---------|--------|--------|
| `/api/dashboard/doctor/prescriptions` | GET, POST | ⚠️ Exists | POST: `morning/afternoon/evening` stored as boolean, no `complaints`, no `suggestions`, no `nextVisit` |
| `/api/dashboard/doctor/prescriptions/[id]` | GET, PUT, DELETE | ⚠️ Exists | Same boolean issue, no stepper data support |
| `/api/dashboard/doctor/medicines` | GET, POST | ⚠️ Exists | `morning/afternoon/evening` = String, `dose` = String (single) |
| `/api/dashboard/doctor/medicines/[id]` | GET, PUT, DELETE | ⚠️ Exists | Same issues |

### 2.4 Existing Components

| Component | Path | Status |
|-----------|------|--------|
| `PrescriptionPrintView` | `src/components/prescription/print-view.tsx` | ⚠️ Exists but missing C/O section, custom header, table details, next visit date, suggestions as checkboxes |

### 2.5 Sidebar Config (Current Doctor Menu)

```
Dashboard, Appointments, Prescriptions, Earnings, Schedule, Patients, 
Medicine Master, Profile, Gallery, Posts, Change Password
```

**Missing:** Prescription Settings (treeview), Findings, Notifications, Assistant/Receptionist/Pharmacist management, Reports

---

## 3. DATA MODEL CHANGES

### 3.1 New Models to Add

#### 3.1.1 CoCategory (Complaint Category)

```prisma
model CoCategory {
  id          String   @id @default(cuid())
  name        String                   // "Infertility" (local language)
  nameEn      String   @default("")  // "Infertility" (English/secondary)
  status      String   @default("Active")
  sort_order  Int      @default(0)    // Display order
  createdById String?
  doctorId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  doctor      Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  complaints  CoMaster[]               // One category has many complaints
}
```

#### 3.1.2 FindingsMaster (Disease/Finding Templates)

```prisma
model FindingsMaster {
  id          String   @id @default(cuid())
  name        String                   // "વાયરલ ફિવર" (local language)
  nameEn      String   @default("")  // "Viral Fever" (English/secondary)
  status      String   @default("Active")
  createdById String?
  doctorId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  doctor      Doctor              @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  medicines   FindingsMedicine[]  // Linked medicines
}
```

#### 3.1.3 FindingsMedicine (Findings ↔ Medicine Link)

```prisma
model FindingsMedicine {
  id          String   @id @default(cuid())
  findingId   String
  medicineId  String                   // References DoctorMedicine.id
  doctorId    String
  createdAt   DateTime @default(now())

  finding     FindingsMaster  @relation(fields: [findingId], references: [id], onDelete: Cascade)
  medicine    DoctorMedicine  @relation(fields: [medicineId], references: [id], onDelete: Cascade)

  @@unique([findingId, medicineId])   // Prevent duplicate links
}
```

#### 3.1.4 PrescriptionPreFill (Assistant's Pre-Fill Data)

```prisma
model PrescriptionPreFill {
  id              String   @id @default(cuid())
  bookingId       String   @unique  // One pre-fill per booking
  doctorId        String
  filledById      String             // Assistant's User.id
  complaints      String   @default("[]")  // JSON array of CoMaster IDs
  labels          String   @default("[]")  // JSON array of {labelMasterId, value}
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  booking         Booking  @relation(fields: [bookingId], references: [id])
}
```

### 3.2 Existing Models to Modify

#### 3.2.1 DoctorMedicine

```diff
 model DoctorMedicine {
   id          String   @id @default(cuid())
   name        String   @default("")
-  morning     String   @default("")
-  afternoon   String   @default("")
-  evening     String   @default("")
-  dose        String   @default("")
+  morning     Int      @default(0)        // NUMBER: tablet count for morning
+  afternoon   Int      @default(0)        // NUMBER: tablet count for afternoon
+  evening     Int      @default(0)        // NUMBER: tablet count for evening
+  doses       String   @default("[]")    // JSON array: ["500mg", "650mg", "1000mg"]
   tab         Int      @default(1)
   description String   @default("")
   status      String   @default("Active")
   createdById String?
   userId      String
   createdAt   DateTime @default(now())
   updatedAt   DateTime @updatedAt

   doctor      Doctor   @relation(fields: [userId], references: [id], onDelete: Cascade)
+  findings    FindingsMedicine[]    // Linked to findings
 }
```

**Migration note:** `morning/afternoon/evening` changes from String→Int. Existing data like "after food" will be lost. Need data migration script:
- Parse existing string values, extract numbers if possible
- Default to 0 if non-numeric
- Move description-like strings to `description` field

#### 3.2.2 PMedicine (Prescription Medicine Row)

```diff
 model PMedicine {
   id             String   @id @default(cuid())
   prescriptionId String
   medicine       String   @default("")
-  morning        Boolean  @default(false)
-  afternoon      Boolean  @default(false)
-  evening        Boolean  @default(false)
+  morning        Int      @default(0)    // NUMBER: tablet count
+  afternoon      Int      @default(0)    // NUMBER: tablet count
+  evening        Int      @default(0)    // NUMBER: tablet count
   tab            Int      @default(1)
   dose           String   @default("")  // Selected dose (one from master's doses array)
   description    String   @default("")
   createdById    String?
   createdAt      DateTime @default(now())
   updatedAt      DateTime @updatedAt

   prescription   Prescription @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
 }
```

#### 3.2.3 Prescription

```diff
 model Prescription {
   id           String   @id @default(cuid())
   bookingId    String
   patientName  String   @default("")
   patientAge   String   @default("")
   disease      String   @default("")
   weight       String   @default("")
   bp           String   @default("")
   temperature  String   @default("")
   description  String   @default("")
   createdAt    DateTime @default(now())
   updatedAt    DateTime @updatedAt

+  nextVisit    DateTime?                // Next visit date
+  status       String   @default("active") // active, archived, deleted
+  note         String   @default("")   // Doctor's free-text note (separate from description)

   booking      Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
   doctor       Doctor   @relation(fields: [doctorId], references: [id])
   doctorId     String
   medicines    PMedicine[]
   labels       PLabel[]
   suggestions  PSuggestion[]
   diagnosisTables PDignoTable[]
   chiefComplaints PCo[]
   accessRequests    PrescriptionAccessRequest[]
 }
```

#### 3.2.4 CoMaster (Add category + English fields)

```diff
 model CoMaster {
   id          String   @id @default(cuid())
   coCode      String   @default("")
   coDetail    String   @default("")
+  coDetailEn  String   @default("")   // English/secondary language
+  categoryId  String                   // References CoCategory.id
   status      String   @default("Active")
   createdById String?
   doctorId    String
   createdAt   DateTime @default(now())
   updatedAt   DateTime @updatedAt

   doctor      Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
+  category    CoCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
 }
```

#### 3.2.5 LabelMaster (Add unit + English)

```diff
 model LabelMaster {
   id          String   @id @default(cuid())
   label       String   @default("")
+  labelEn     String   @default("")   // English/secondary language
+  unit        String   @default("")   // "Kg", "mmHg", "°F", "bpm"
+  showUnit    Boolean  @default(true) // Whether to show unit after value on print
   status      String   @default("Active")
   createdById String?
   doctorId    String
   createdAt   DateTime @default(now())
   updatedAt   DateTime @updatedAt

   doctor      Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
 }
```

#### 3.2.6 QuestionsMaster (Add English)

```diff
 model QuestionsMaster {
   id           String   @id @default(cuid())
   question     String   @default("")
+  questionEn   String   @default("")
   explanation  String   @default("")
+  explanationEn String  @default("")
   status       String   @default("Active")
   createdById  String?
   doctorId     String
   createdAt    DateTime @default(now())
   updatedAt    DateTime @updatedAt

   doctor       Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
   suggestions  SuggestionsMaster[]
 }
```

#### 3.2.7 SuggestionsMaster (Add English + category)

```diff
 model SuggestionsMaster {
   id           String   @id @default(cuid())
   questionId   String
   suggestions  String   @default("")
+  suggestionsEn String  @default("")  // English/secondary
+  category     String   @default("")  // "ઔષધ" / "ચકાસણી" — used for grouping on Step 5
+  categoryEn   String   @default("")  // "Medicine" / "Test"
   status       String   @default("Active")
   createdById  String?
   doctorId     String
   createdAt    DateTime @default(now())
   updatedAt    DateTime @updatedAt

   question     QuestionsMaster @relation(fields: [questionId], references: [id], onDelete: Cascade)
 }
```

#### 3.2.8 Doctor Model — Add New Relations

```diff
 model Doctor {
   // ... existing fields ...

   coMaster            CoMaster[]
   labelMaster         LabelMaster[]
   questionMaster      QuestionsMaster[]
   otherSettings       POtherSetting?
+  coCategories        CoCategory[]
+  findingsMaster      FindingsMaster[]
+  findingsMedicines   FindingsMedicine[]
   accessRequestsMade   PrescriptionAccessRequest[] @relation("RequestingDoctor")
   accessRequestsReceived PrescriptionAccessRequest[] @relation("OriginalDoctor")
 }
```

### 3.3 Booking Model — Add PreFill Relation

```diff
 model Booking {
   // ... existing fields ...
+  preFills    PrescriptionPreFill[]
 }
```

### 3.4 Complete Model Relationship Diagram

```
CoCategory (NEW)
  └── 1:N ──→ CoMaster (MODIFIED: +coDetailEn, +categoryId)
                 ├── 1:N ──→ QuestionsMaster (MODIFIED: +questionEn)
                 │              └── 1:N ──→ SuggestionsMaster (MODIFIED: +suggestionsEn, +category)
                 └── 1:N ──→ PCo (existing - links complaint to prescription)

LabelMaster (MODIFIED: +labelEn, +unit, +showUnit)
  └── Used in prescription to auto-generate vital input fields

DoctorMedicine (MODIFIED: morning/afternoon/evening → Int, dose → doses JSON[])
  └── 1:N ──→ FindingsMedicine (NEW - link table)
                  └── N:1 ──→ FindingsMaster (NEW)

Prescription (MODIFIED: +nextVisit, +status, +note)
  ├── 1:N ──→ PMedicine (MODIFIED: morning/afternoon/evening → Int)
  ├── 1:N ──→ PLabel
  ├── 1:N ──→ PSuggestion
  ├── 1:N ──→ PDignoTable
  └── 1:N ──→ PCo

PrescriptionPreFill (NEW)
  └── Belongs to Booking (1:1)
      Stores: selected complaint IDs + filled label values
      Created by: Assistant
      Consumed by: Doctor when opening prescription

POtherSetting (existing)
  └── Doctor's print settings (header, fullHeader, isFullHeader, logo, timing)
```

---

## 4. API ROUTES PLAN

### 4.1 New API Routes

| # | Route | Methods | Auth | Purpose |
|---|-------|---------|------|--------|
| 1 | `/api/dashboard/doctor/rx-settings/co-categories` | GET, POST, PUT, DELETE | doctor | CoCategory CRUD |
| 2 | `/api/dashboard/doctor/rx-settings/complaints` | GET, POST, PUT, DELETE | doctor | CoMaster CRUD (with category filter) |
| 3 | `/api/dashboard/doctor/rx-settings/questions` | GET, POST, PUT, DELETE | doctor | QuestionsMaster CRUD |
| 4 | `/api/dashboard/doctor/rx-settings/suggestions` | GET, POST, PUT, DELETE | doctor | SuggestionsMaster CRUD |
| 5 | `/api/dashboard/doctor/rx-settings/labels` | GET, POST, PUT, DELETE | doctor | LabelMaster CRUD |
| 6 | `/api/dashboard/doctor/rx-settings/table-master` | GET, POST, PUT, DELETE | doctor | PDignoTable template CRUD |
| 7 | `/api/dashboard/doctor/rx-settings/print-settings` | GET, PUT | doctor | POtherSetting CRUD |
| 8 | `/api/dashboard/doctor/findings` | GET, POST, PUT, DELETE | doctor | FindingsMaster + link/unlink medicines |
| 9 | `/api/dashboard/assistant/pre-fill` | GET, POST, PUT | assistant | Create/update/read pre-fill data for a booking |
| 10 | `/api/dashboard/doctor/pre-fill/[bookingId]` | GET | doctor | Read pre-fill data when opening prescription |

### 4.2 Existing API Routes to Modify

| # | Route | Change |
|---|-------|--------|
| 1 | `/api/dashboard/doctor/prescriptions` POST | Accept new fields: `complaints[]`, `suggestions[]`, `diagnosisTables[]`, `nextVisit`, `note`. Change medicine morning/afternoon/evening from boolean to int. |
| 2 | `/api/dashboard/doctor/prescriptions/[id]` GET | Include `preFill` data, `complaints` (with CoMaster data), `diagnosisTables`, `nextVisit`, `note`. |
| 3 | `/api/dashboard/doctor/prescriptions/[id]` PUT | Accept same new fields as POST. |
| 4 | `/api/dashboard/doctor/medicines` POST/PUT | Change `morning/afternoon/evening` to Int, `dose` → `doses` (JSON array). |

### 4.3 Detailed API Specifications

#### 4.3.1 CoCategory API

```
GET /api/dashboard/doctor/rx-settings/co-categories
  Query: ?search=infert
  Response: { categories: [{ id, name, nameEn, status, sort_order, _count: { complaints: N } }] }

POST /api/dashboard/doctor/rx-settings/co-categories
  Body: { name, nameEn, sortOrder? }
  Response: { category: { ... } }

PUT /api/dashboard/doctor/rx-settings/co-categories/[id]
  Body: { name?, nameEn?, sortOrder?, status? }
  Response: { category: { ... } }

DELETE /api/dashboard/doctor/rx-settings/co-categories/[id]
  Response: { success: true }
  Note: Soft delete (status → 'Inactive') OR hard delete if no complaints linked
```

#### 4.3.2 Complaints (CoMaster) API

```
GET /api/dashboard/doctor/rx-settings/complaints?categoryId=xxx
  Response: { complaints: [{ id, coCode, coDetail, coDetailEn, categoryId, status, 
             category: { id, name }, 
             _count: { suggestions: N } }] }

POST /api/dashboard/doctor/rx-settings/complaints
  Body: { coCode, coDetail, coDetailEn, categoryId }
  Response: { complaint: { ... } }
```

#### 4.3.3 Suggestions API

```
GET /api/dashboard/doctor/rx-settings/suggestions?complaintId=xxx
  Response: { suggestions: [{ id, questionId, suggestions, suggestionsEn, category, categoryEn, 
             question: { question, questionEn } }] }

POST /api/dashboard/doctor/rx-settings/suggestions
  Body: { questionId, suggestions, suggestionsEn, category, categoryEn }
  Response: { suggestion: { ... } }
```

#### 4.3.4 Findings API

```
GET /api/dashboard/doctor/findings
  Response: { findings: [{ id, name, nameEn, status, 
            _count: { medicines: N },
            medicines: [{ id, name, doses, morning, afternoon, evening, tab, description, dose }] }] }

POST /api/dashboard/doctor/findings
  Body: { name, nameEn, medicineIds: string[] }
  Response: { finding: { ... } }

PUT /api/dashboard/doctor/findings/[id]
  Body: { name?, nameEn?, medicineIds?: string[] }
  Response: { finding: { ... } }
  Note: If medicineIds provided, REPLACE all links (delete old, create new)
```

#### 4.3.5 Assistant Pre-Fill API

```
POST /api/dashboard/assistant/pre-fill
  Body: { bookingId, complaints: string[] (CoMaster IDs), labels: { labelMasterId, value }[] }
  Response: { preFill: { ... } }

GET /api/dashboard/assistant/pre-fill?bookingId=xxx
  Response: { preFill: { id, complaints (parsed), labels (parsed) } }

GET /api/dashboard/doctor/pre-fill/[bookingId]
  Response: Same as above (for doctor to read)
```

#### 4.3.6 Updated Prescription POST API

```
POST /api/dashboard/doctor/prescriptions
Body: {
  bookingId: string,
  // Patient info (auto from booking, but editable)
  patientName?: string,
  patientAge?: string,
  disease?: string,
  // Step 2: Labels/Vitals (from pre-fill or manually filled)
  labels: { label: string, value: string, labelUnit: string }[],
  // Step 3: Diagnosis tables (optional)
  diagnosisTables: { rows, cols, headerLabel, colsLabel, footerLabel, extraLabel }[],
  // Step 4: Medicines
  medicines: { medicine: string, morning: number, afternoon: number, evening: number, 
               dose: string, tab: number, description: string }[],
  // Step 5: Suggestions
  suggestions: { question: string, suggestions: string }[],
  // Step 1: Chief Complaints
  complaintIds: string[],
  // Step 6: Meta
  nextVisit?: string (ISO date),
  note?: string,
  description?: string,
}

Response: { prescription: { id, ... } }
Side effect: Update Booking status to 'Visited'
```

---

## 5. UI PAGES PLAN

### 5.1 New Pages

| # | Page | Route | Role | Description |
|---|------|-------|------|-------------|
| 1 | CO Categories | `/dashboard/doctor/rx-settings/co-categories` | Doctor | CRUD for complaint categories with drag-reorder |
| 2 | Complaints | `/dashboard/doctor/rx-settings/complaints` | Doctor | CRUD under categories, multi-language |
| 3 | Questions | `/dashboard/doctor/rx-settings/questions` | Doctor | Questions bank, link to complaints, multi-language |
| 4 | Suggestions | `/dashboard/doctor/rx-settings/suggestions` | Doctor | Suggestions per question/complaint, categories, multi-language |
| 5 | Labels | `/dashboard/doctor/rx-settings/labels` | Doctor | Vital labels with unit, showUnit toggle |
| 6 | Table Master | `/dashboard/doctor/rx-settings/table-master` | Doctor | Table template builder with live preview |
| 7 | Print Settings | `/dashboard/doctor/rx-settings/print-settings` | Doctor | Header, logo upload, full header toggle, timing |
| 8 | Findings Master | `/dashboard/doctor/findings` | Doctor | Findings CRUD + multi-select medicines from master |
| 9 | Assistant Pre-Fill | `/dashboard/assistant/pre-fill/[bookingId]` | Assistant | Complaint selection + vitals for a booking |

### 5.2 Pages to Rewrite

| # | Page | Current State | Target State |
|---|------|--------------|--------------|
| 1 | New Prescription (`/dashboard/doctor/prescriptions/new`) | Flat form | 6-step stepper wizard |
| 2 | Medicine Master (`/dashboard/doctor/medicines`) | Dose=text, Morning/Afternoon/Evening=text | Dose=tag input, Morning/Afternoon/Evening=number |

### 5.3 Page Design Specifications

#### 5.3.1 CO Categories Page

```
┌─────────────────────────────────────────────────────────────┐
│  Prescription Settings > CO Categories        [+ New]       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Infertility              12 complaints    [Edit][Del] │  │
│  │ ફર્ટિલિટી (Fertility)     8 complaints     [Edit][Del] │  │
│  │ Skin Issues             5 complaints     [Edit][Del] │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Dialog (Add/Edit):                                        │
│  ┌─────────────────────────────────────┐                    │
│  │ Category Name (Local) *              │                    │
│  │ [________________________]           │                    │
│  │ Category Name (English)              │                    │
│  │ [________________________]           │                    │
│  │                                      │                    │
│  │         [Cancel]  [Save]            │                    │
│  └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

#### 5.3.2 Complaints Page

```
┌─────────────────────────────────────────────────────────────┐
│  Prescription Settings > Complaints                          │
│                                                             │
│  Category: [▼ Infertility          ]  [+ New Complaint]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Code  │ Complaint (Local)      │ English      │Actions│  │
│  │ CO-01 │ ખંજવાળ                  │ Itching     │[E] [D]│  │
│  │ CO-02 │ મૂળાવયવ                │ Mulavayav   │[E] [D]│  │
│  │ CO-03 │ પુરુષરત                │ Purushrat   │[E] [D]│  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Dialog (Add/Edit):                                        │
│  ┌─────────────────────────────────────┐                    │
│  │ Complaint Code *                     │                    │
│  │ [________________________]           │                    │
│  │ Complaint (Local Language) *         │                    │
│  │ [________________________]           │                    │
│  │ Complaint (Secondary Language)       │                    │
│  │ [________________________]           │                    │
│  │         [Cancel]  [Save]            │                    │
│  └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

#### 5.3.3 Labels Page

```
┌─────────────────────────────────────────────────────────────┐
│  Prescription Settings > Labels (Vitals)     [+ New Label]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Label    │ English  │ Unit  │ Show Unit │ Actions     │  │
│  │ Weight   │ Weight   │ Kg    │ ☑ Yes    │ [E] [D]     │  │
│  │ BP       │ BP       │ mmHg  │ ☐ No     │ [E] [D]     │  │
│  │ Pulse    │ Pulse    │ bpm   │ ☑ Yes    │ [E] [D]     │  │
│  │ Temp     │ Temp     │ °F    │ ☑ Yes    │ [E] [D]     │  │
│  │ P/A      │ P/A      │       │ ☐ No     │ [E] [D]     │  │
│  │ RS       │ RS       │       │ ☐ No     │ [E] [D]     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Dialog: Name (Local), Name (En), Unit, Show Unit toggle   │
└─────────────────────────────────────────────────────────────┘
```

#### 5.3.4 Table Master Page

```
┌─────────────────────────────────────────────────────────────┐
│  Prescription Settings > Table Master          [+ New Table] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Table Name: [Ultrasound Details        ]                   │
│  Columns: [4]  Rows: [10]  [+Col] [-Col] [+Row] [-Row]      │
│                                                             │
│  Column Headers: [Rt] [Lt] [RtF1] [LtF1]                    │
│  Row Labels (per row): [AFC] [Weeks] [AFI] [EFW] ...        │
│  Footer: [av/rv | CX:Length | ET:____mm Triple Line]        │
│                                                             │
│  ┌─── LIVE PREVIEW ────────────────────────────────────┐   │
│  │  #  │ Rt    │ Lt    │ RtF1  │ LtF1                │   │
│  │  1  │ AFC   │       │       │                     │   │
│  │  2  │ Weeks │       │       │                     │   │
│  │  3  │ AFI   │       │       │                     │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  [Cancel]  [Save Table]                                   │
└─────────────────────────────────────────────────────────────┘
```

#### 5.3.5 Findings Master Page

```
┌─────────────────────────────────────────────────────────────┐
│  Findings Master                           [+ New Finding]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Dialog (Create Finding):                                   │
│  ┌─────────────────────────────────────┐                    │
│  │ Finding Name (Local) *               │                    │
│  │ [________________________]           │                    │
│  │ Finding Name (English)               │                    │
│  │ [________________________]           │                    │
│  │                                      │                    │
│  │ Select Medicines:                    │                    │
│  │ ☑ Paracetamol  500mg  M1 A1 E1  10T  │                    │
│  │ ☑ Azithromycin 500mg  M1 A0 E1   3T  │                    │
│  │ ☐ Cetirizine   10mg   M0 A0 E1   5T  │                    │
│  │ [Search medicines...]               │                    │
│  │                                      │                    │
│  │         [Cancel]  [Save Finding]    │                    │
│  └─────────────────────────────────────┘                    │
│                                                             │
│  List View:                                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Viral Fever / વાયરલ ફિવર    4 medicines  [Edit][Del]  │  │
│  │ Itching / ખંજવાળ         2 medicines  [Edit][Del]  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### 5.3.6 Medicine Master Page (Updated)

```
┌─────────────────────────────────────────────────────────────┐
│  Medicine Master                            [+ Add Medicine] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Dialog (Add/Edit Medicine):                               │
│  ┌─────────────────────────────────────┐                    │
│  │ Medicine Name *                      │                    │
│  │ [Paracetamol____________]            │                    │
│  │                                      │                    │
│  │ Morning *    Afternoon *    Evening *│                    │
│  │ [  1  ]      [  1  ]        [  1  ] │  ← NUMBER inputs   │
│  │                                      │                    │
│  │ Dose *                               │                    │
│  │ [500mg ×] [650mg ×] [1000mg    ▼]   │  ← TAG INPUT       │
│  │ [Type to add custom dose...]        │                    │
│  │                                      │                    │
│  │ Tab *       Description *             │                    │
│  │ [ 10 ]      [After food_________]   │                    │
│  │                                      │                    │
│  │         [Cancel]  [Save Medicine]   │                    │
│  └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. SHARED COMPONENTS

### 6.1 PrescriptionStepper Component

**Path:** `src/components/prescription/stepper.tsx`

**Purpose:** Reusable 6-step stepper navigation bar used in prescription creation.

```
Props:
  currentStep: number (1-6)
  onStepClick: (step: number) => void
  completedSteps: Set<number>
  steps: {
    number: number
    title: string
    icon: LucideIcon
  }[]
```

**Visual:** Horizontal stepper bar with circles connected by lines. Completed steps = teal filled circle with check. Current step = teal ring. Future steps = gray circle.

**Behavior:** 
- AJAX-style step switching (NO page reload — same route, different content rendered)
- All form state lives in ONE parent component (zustand store or React state)
- Clicking a completed step navigates back (data preserved)
- Clicking a future step only works if all previous steps are valid

### 6.2 DoseTagInput Component

**Path:** `src/components/prescription/dose-tag-input.tsx`

**Purpose:** Tag/chip input for multiple dose values (e.g., `500mg`, `650mg`, `1000mg`).

```
Props:
  value: string[]           // Current doses array
  onChange: (doses: string[]) => void
  placeholder?: string
```

**Visual:** 
- Each dose shown as a teal chip/badge with × remove button
- Input field at the end for typing new dose
- Dropdown shows existing doses as suggestions when typing
- First dose is the DEFAULT (highlighted with subtle indicator)

### 6.3 MultiLanguageInput Component

**Path:** `src/components/prescription/multi-lang-input.tsx`

**Purpose:** Paired input for local language + English/secondary language.

```
Props:
  localValue: string
  localOnChange: (v: string) => void
  localPlaceholder?: string      // e.g., "શું લખો (Write in Gujarati)"
  secondaryValue: string
  secondaryOnChange: (v: string) => void
  secondaryPlaceholder?: string  // e.g., "English name"
  localLabel?: string
  secondaryLabel?: string
```

### 6.4 MedicineAutocomplete Component

**Path:** `src/components/prescription/medicine-autocomplete.tsx`

**Purpose:** Search + select from medicine master with full auto-fill.

```
Props:
  onSelect: (medicine: DoctorMedicine) => void
```

**Visual:** Side panel or dropdown with search input. Type "par" → shows "Paracetamol" with details (dose, timing, tab, description). Click → fires onSelect.

---

## 7. 6-STEP STEPPER WIZARD — DETAILED SPEC

### 7.1 Architecture

```
Route: /dashboard/doctor/prescriptions/new?bookingId=xxx

Single page, client-side state management.
All 6 steps render in the same page (AJAX-style, no navigation).
State managed by React useState or zustand store.

Step navigation handled by PrescriptionStepper component.
Final submission sends ALL step data in ONE API call.
```

### 7.2 Step-by-Step Specification

---
#### STEP 1: CO / Chief Complaints

**Who fills:** Assistant (outside cabin) OR Doctor

**Data source:** CoCategory + CoMaster

**UI:**
```
┌──────────────────────────────────────────────────────────┐
│  ① Complaints  ② Labels  ③ Tables  ④ Medicines  ⑤ Suggestions  ⑥ Finish │
│  ══════════                                                         │
│                                                                    │
│  ▼ Infertility (3)                                                 │
│    ☑ ખંજવાળ (Itching)                                             │
│    ☐ મૂળાવયવ (Mulavayav)                                          │
│    ☑ પુરુષરત (Purushrat)                                          │
│                                                                    │
│  ▼ Fertility (2)                                                   │
│    ☐ અવયવ (Avyav)                                                 │
│    ☐ અન્યુ (Anyu)                                                 │
│                                                                    │
│  ▼ Skin Issues (1)                                                 │
│    ☑ ત્વચા લાલ (Skin Redness) (Rash)                               │
│                                                                    │
│  Selected: 3 complaints                                           │
│                               [Next →]                            │
└──────────────────────────────────────────────────────────┘
```

**Pre-fill behavior:** If `PrescriptionPreFill` exists for this booking, complaints are **pre-checked**.

**State stored:** `selectedComplaintIds: string[]`

**Validation:** At least 0 complaints required (optional step).

---

#### STEP 2: Labels / Vitals

**Who fills:** Assistant (outside cabin) OR Doctor

**Data source:** LabelMaster

**UI:**
```
┌──────────────────────────────────────────────────────────┐
│  ① Complaints  ② Labels  ③ Tables  ④ Medicines  ⑤ Suggestions  ⑥ Finish │
│                   ══════                                         │
│                                                                    │
│  Weight:  [ 70    ] Kg                                             │
│  BP:      [ 120/80  ]                                               │
│  Pulse:   [ 72    ] bpm                                            │
│  Temp:    [ 98.6  ] °F                                              │
│  P/A:     [ Normal                                         ]       │
│  RS:      [ Clear                                          ]       │
│                                                                    │
│                    [← Back]  [Next →]                            │
└──────────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Form fields **auto-generated** from LabelMaster
- Label name comes from LabelMaster (local language)
- Unit comes from LabelMaster.unit
- Unit displayed AFTER the input (if showUnit = true)
- No unit input field shown if showUnit = false

**Pre-fill behavior:** If `PrescriptionPreFill` exists, label values are **pre-filled**.

**State stored:** `labels: { labelMasterId, label, value, labelUnit, showUnit }[]`

---

#### STEP 3: Table Details (Optional)

**Who fills:** Doctor only

**Data source:** PDignoTable templates

**UI:**
```
┌──────────────────────────────────────────────────────────┐
│  Select Table Template: [▼ Ultrasound Details    ]  or [Skip]  │
│                                                                    │
│  ┌─────┬──────────┬──────────┬──────────┬──────────┐            │
│  │ #   │ Rt       │ Lt       │ RtF1     │ LtF1     │            │
│  ├─────┼──────────┼──────────┼──────────┼──────────┤            │
│  │ AFC │ [______] │ [______] │ [______] │ [______] │            │
│  │ Wks │ [______] │ [______] │ [______] │ [______] │            │
│  │ AFI │ [______] │ [______] │ [______] │ [______] │            │
│  │ EFW │ [______] │ [______] │ [______] │ [______] │            │
│  └─────┴──────────┴──────────┴──────────┴──────────┘            │
│  Footer: [av/rv | CX:Length | ET:____mm Triple Line | CX:mucus] │
│                                                                    │
│                    [← Back]  [Next →]                            │
└──────────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Table templates loaded from PDignoTable (where they were created in settings)
- Dropdown to select which table template to use
- "Skip" button to skip this step entirely (many doctors don't use tables)
- Doctor fills empty cells
- Can add multiple tables (e.g., one ultrasound + one eye report)

**State stored:** `diagnosisTables: PDignoTable data[]`

---

#### STEP 4: Medicines

**Who fills:** Doctor only

**Data source:** DoctorMedicine (master) + FindingsMaster

**UI:**
```
┌──────────────────────────────────────────────────────────┐
│  ① Complaints  ② Labels  ③ Tables  ④ Medicines  ⑤ Suggestions  ⑥ Finish │
│                                     ════════                     │
│                                                                    │
│  ┌─── SIDE PANEL ────┐  ┌─── MAIN AREA ─────────────────────┐  │
│  │ Quick Fill:        │  │                                    │  │
│  │ Finding: [▼       ]│  │  # │ Med       │Dose ▼│M│A│E│Tab│D│  │
│  │ Viral Fever       │  │  1 │ Paracet.  │500mg▼│1│1│1│ 10│AF│  │
│  │                   │  │  2 │ Azithro.  │500mg▼│1│-│1│  3│ES│  │
│  │ Or Search:        │  │  3 │ Cetiriz.  │10mg ▼│-│-│1│  5│AN│  │
│  │ [par__________]   │  │                                    │  │
│  │ • Paracetamol     │  │  [+ Add Blank Row]                │  │
│  │   Azithromycin    │  │                                    │  │
│  └───────────────────┘  └────────────────────────────────────┘  │
│                                                                    │
│                    [← Back]  [Next →]                            │
└──────────────────────────────────────────────────────────┘
```

**Key behaviors:**

**Side Panel — TWO modes:**
1. **Findings Dropdown:** Select a finding → ALL linked medicines auto-fill in main area
   - Dose for each medicine = **first dose** from the medicine's `doses[]` array
   - Doctor can change dose via per-row dropdown (shows all doses + custom input)
2. **Search:** Type medicine name → autocomplete → click → one medicine fills

**Main Area — Medicine Table:**
- Each row: `# | Medicine Name | Dose (dropdown) | Morning (number) | Afternoon (number) | Evening (number) | Tab (number) | Description`
- Dose column: `Select` dropdown showing all doses from master + option to type custom
- Morning/Afternoon/Evening: **Number input** (0 = not taken, 1 = one tablet, 2 = two tablets)
- Can remove individual rows
- `+ Add Blank Row` for manual entry

**Auto-fill detail:**
```
Finding "Viral Fever" selected →
  Fetch FindingsMedicine where findingId = X →
    For each linked DoctorMedicine:
      Add row with:
        medicine: med.name
        dose: med.doses[0]     // First dose as default
        morning: med.morning    // Number from master
        afternoon: med.afternoon
        evening: med.evening
        tab: med.tab
        description: med.description
```

**State stored:** `medicines: { medicine, dose, morning, afternoon, evening, tab, description, _masterId? }[]`

**Validation:** At least 1 medicine required.

---

#### STEP 5: Suggestions

**Who fills:** Doctor only

**Data source:** SuggestionsMaster (filtered by selected complaints from Step 1)

**UI:**
```
┌──────────────────────────────────────────────────────────┐
│  ① Complaints  ② Labels  ③ Tables  ④ Medicines  ⑤ Suggestions  ⑥ Finish │
│                                                  ══════════     │
│                                                                    │
│  ┌── ઔષધ (Medicine) ──────────────────────────────────────┐  │
│  │ ☑ શોધપ વીરેલી દવા લેવી (Take this medicine...)      │  │
│  │ ☐ ઉડુવીણામાઉર લગાવો (Apply ointment...)           │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌── ચકાસણી (Test) ──────────────────────────────────────┐  │
│  │ ☑ જોલપાઈ વીરાવી (Blood test if...)                   │  │
│  │ ☐ તાપવીં ટેસ્ટ કરાવો (Fever test...)                   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Note: [________________________________________]                 │
│                                                                    │
│  Next Visit: [📅 15/01/2025                          ] 🎤        │
│                                                                    │
│                    [← Back]  [Finish →]                          │
└──────────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Suggestions **auto-filtered** from Step 1's selected complaints
- Grouped by suggestion category (Medicine / Test / Custom)
- All checkboxes — zero typing
- **Note field:** Free text for doctor
- **Next Visit Date:** Date picker
- **🎤 Microphone:** Voice input (TTS reverse — use ASR skill for speech-to-text)

**Auto-filter logic:**
```
1. Get selectedComplaintIds from Step 1
2. Get all QuestionsMaster IDs linked to those complaints (via CoMaster.id → QuestionsMaster)
3. Get all SuggestionsMaster where questionId IN those question IDs
4. Group by SuggestionsMaster.category
5. Display as checkboxes
```

**State stored:** `selectedSuggestionIds: string[], note: string, nextVisit: string`

---

#### STEP 6: Finish

**UI:**
```
┌──────────────────────────────────────────────────────────┐
│                                                                    │
│               ⏳ Saving Prescription...                         │
│                                                                    │
│               (or after save:)                                    │
│                                                                    │
│          ✅ Prescription Saved Successfully!                     │
│                                                                    │
│     [📋 Go to Appointments]    [🖨️ Print Prescription]           │
│                                                                    │
└──────────────────────────────────────────────────────────┘
```

**Behavior:**
1. Submit ALL step data in ONE POST call to `/api/dashboard/doctor/prescriptions`
2. API creates Prescription + PMedicine[] + PLabel[] + PSuggestion[] + PDignoTable[] + PCo[]
3. API updates Booking status to `Visited`
4. On success: show two buttons
5. "Print Prescription" opens the print view overlay

---

## 8. ASSISTANT PRE-FILL WORKFLOW

### 8.1 How It Works

```
1. Assistant sees today's appointment queue
2. Assistant clicks "Pre-Fill" button on a patient's appointment card
3. Assistant is taken to /dashboard/assistant/pre-fill/[bookingId]
4. Assistant sees:
   - Step 1: Complaints (checkboxes, same as doctor's Step 1)
   - Step 2: Vitals/Labels (auto-generated from LabelMaster)
5. Assistant fills and clicks "Save Pre-Fill"
6. Data saved to PrescriptionPreFill table
7. Later, when DOCTOR opens prescription for that booking:
   - System checks for existing PrescriptionPreFill
   - If found: Step 1 complaints pre-checked, Step 2 vitals pre-filled
   - Doctor sees everything assistant filled, can modify
```

### 8.2 Assistant Pre-Fill Page

```
Route: /dashboard/assistant/pre-fill/[bookingId]

Simple 2-section page (NOT a stepper — just two card sections):

┌──────────────────────────────────────────────────────────┐
│  ← Back to Appointments                                    │
│  Pre-Fill for: Ramesh Kumar  |  Appt #APT-001             │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌── Select Complaints ──────────────────────────────┐   │
│  │ ▼ Infertility                                      │   │
│  │   ☑ ખંજવાળ (Itching)                               │   │
│  │   ☐ મૂળાવયવ (Mulavayav)                            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                            │
│  ┌── Fill Vitals ────────────────────────────────────┐   │
│  │ Weight: [ 70    ] Kg                                │   │
│  │ BP:     [ 120/80  ]                                 │   │
│  │ Pulse:  [ 72    ] bpm                               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                            │
│                    [Save Pre-Fill]                       │
└──────────────────────────────────────────────────────────┘
```

### 8.3 Doctor Queue Page Enhancement

On the doctor's dashboard/queue page, each appointment card should show:
- **"Pre-Filled"** badge if PrescriptionPreFill exists for that booking
- This tells the doctor: "Assistant has already done the initial work"

### 8.4 Assistant Sidebar Update

Add to assistant sidebar:
```
{ label: 'Pre-Fill Rx', href: '/dashboard/assistant/pre-fill', icon: ClipboardList }
```

This page shows a list of today's appointments with "Pre-Fill" buttons.

---

## 9. PRINT TEMPLATE OVERHAUL

### 9.1 Current Print View Issues

- Missing C/O (Chief Complaints) section
- Missing custom header from POtherSetting (fullHeader image)
- Missing diagnosis tables
- Missing next visit date
- Morning/Afternoon/Evening shown as M/A/E badges (should be numbers)
- No multi-language support
- Suggestions shown as `question: suggestion` (should be grouped by category)

### 9.2 Target Print Layout

```
┌──────────────────────────────────────────────────────┐
│  [Full Header Image — if isFullHeader=true]          │  ← POtherSetting.fullHeader
│  OR                                                   │
│  Dr. Rajesh Sharma                                   │  ← POtherSetting.header
│  | MD | Gynecologist                                 │  ← Doctor.specialization
│  | Reg: GMC-12345                                    │  ← Doctor.registrationDetail
│  | 📍 123 Hospital Road, Rajkot, Gujarat             │  ← Doctor.hospitalAddress
│  | 📞 9876543210                                    │  ← Doctor.phoneNo
│  | ⏰ Mon-Sat 10:00 AM - 1:00 PM                    │  ← POtherSetting.time
├──────────────────────────────────────────────────────┤
│  Patient: Ramesh  |  Age: 35  |  Gender: Male        │
│  Weight: 70 Kg  |  Blood Group: B+                  │
├──────────────────────────────────────────────────────┤
│  C/O: Itching, Purushrat, Skin Redness               │  ← English (coDetailEn)
├──────────────────────────────────────────────────────┤
│  BP: 120/80  |  Weight: 70 Kg  |  Pulse: 72 bpm     │  ← Labels with units
│  Temp: 98.6°F  |  P/A: Normal                      │  ← Only showUnit=true get unit
├──────────────────────────────────────────────────────┤
│  [Diagnosis Table — if any]                           │  ← From PDignoTable
│  AFC | 12 | 8 | 6 | 10                               │
│  Wks | 8  | 8 | — | —                               │
├──────────────────────────────────────────────────────┤
│  Rx:                                                   │
│  # │ Medicine     │ Dose   │ M │ A │ E │ Tab │ Notes  │  ← M/A/E = NUMBERS
│  1 │ Paracetamol  │ 500mg  │ 1 │ 1 │ 1 │ 10  │ AF     │
│  2 │ Azithromycin │ 500mg  │ 1 │ - │ 1 │  3  │ ES     │
│  3 │ Cetirizine   │ 10mg   │ - │ - │ 1 │  5  | AN     │
├──────────────────────────────────────────────────────┤
│  Advice:                                               │
│  Medicine:                                            │  ← Suggestion category
│  • Take this medicine after food.                      │  ← English (suggestionsEn)
│  Test:                                                │
│  • Blood test if fever persists for 3 days.           │
├──────────────────────────────────────────────────────┤
│  Note: Patient advised to revisit if symptoms persist │
│  Next Visit: 15/01/2025                               │
├──────────────────────────────────────────────────────┤
│  Generated on: 24 Jun 2025 at 11:30 AM               │
│                                                    Dr. Rajesh Sharma │
│                                                    MD Gynecologist   │
└──────────────────────────────────────────────────────┘
```

### 9.3 Language Rules for Print

| Field on Print | Source | Language Used |
|----------------|--------|---------------|
| C/O complaints | CoMaster.coDetailEn | English (secondary) |
| Suggestions text | SuggestionsMaster.suggestionsEn | English (secondary) |
| Suggestion categories | SuggestionsMaster.categoryEn | English (secondary) |
| Label names | LabelMaster.labelEn | English (secondary) if available, else local |
| Medicine names | DoctorMedicine.name | As-is (whatever doctor entered) |
| Description | PMedicine.description | As-is (whatever doctor entered) |
| Doctor info | Doctor model | As-is |

---

## 10. SIDEBAR CHANGES

### 10.1 Doctor Sidebar — Add Prescription Settings Tree

Current sidebar is flat. Need to add a collapsible "Prescription Settings" group:

```typescript
// New sidebar structure for doctor:
[
  { label: 'Dashboard', href: '/dashboard/doctor', icon: LayoutDashboard },
  { label: 'Appointments', href: '/dashboard/doctor/appointments', icon: CalendarDays },
  { label: 'Prescriptions', href: '/dashboard/doctor/prescriptions', icon: FileText },
  { 
    label: 'Rx Settings', 
    icon: Settings, 
    children: [      // ← Treeview/sub-items
      { label: 'CO Categories', href: '/dashboard/doctor/rx-settings/co-categories', icon: FolderTree },
      { label: 'Complaints', href: '/dashboard/doctor/rx-settings/complaints', icon: MessageSquare },
      { label: 'Suggestions', href: '/dashboard/doctor/rx-settings/suggestions', icon: Lightbulb },
      { label: 'Labels', href: '/dashboard/doctor/rx-settings/labels', icon: Tag },
      { label: 'Table Master', href: '/dashboard/doctor/rx-settings/table-master', icon: Table },
      { label: 'Print Settings', href: '/dashboard/doctor/rx-settings/print-settings', icon: Printer },
    ]
  },
  { label: 'Findings', href: '/dashboard/doctor/findings', icon: Search },
  { label: 'Medicine Master', href: '/dashboard/doctor/medicines', icon: FlaskConical },
  { label: 'Patients', href: '/dashboard/doctor/patients', icon: Users },
  { label: 'Earnings', href: '/dashboard/doctor/earnings', icon: IndianRupee },
  { label: 'Schedule', href: '/dashboard/doctor/schedule', icon: Clock },
  { label: 'Gallery', href: '/dashboard/doctor/gallery', icon: Images },
  { label: 'Posts', href: '/dashboard/doctor/posts', icon: PenSquare },
  { label: 'Profile', href: '/dashboard/doctor/profile', icon: UserCircle },
  { label: 'Change Password', href: '/dashboard/change-password', icon: KeyRound },
]
```

**Implementation note:** The current `sidebar-config.ts` uses a flat `SidebarItem[]` structure. For treeview, either:
- **Option A:** Extend `SidebarItem` with optional `children` array (recommended)
- **Option B:** Keep flat but add indentation via a `level` or `indent` field

### 10.2 Assistant Sidebar — Add Pre-Fill

```typescript
assistant: [
  { label: 'Dashboard', href: '/dashboard/assistant', icon: LayoutDashboard },
  { label: 'Appointments', href: '/dashboard/assistant/appointments', icon: CalendarDays },
  { label: 'Pre-Fill Rx', href: '/dashboard/assistant/pre-fill', icon: ClipboardList },  // NEW
  { label: 'Patients', href: '/dashboard/assistant/patients', icon: Users },
  { label: 'Change Password', href: '/dashboard/change-password', icon: KeyRound },
]
```

---

## 11. DEVELOPMENT PHASES

### Phase 0: Database Migration (Prerequisite)
**Effort: ~2 hours**

| # | Task | Detail |
|---|------|--------|
| 0.1 | Add new fields to existing models | CoMaster, LabelMaster, QuestionsMaster, SuggestionsMaster, DoctorMedicine, PMedicine, Prescription |
| 0.2 | Create new models | CoCategory, FindingsMaster, FindingsMedicine, PrescriptionPreFill |
| 0.3 | Update Doctor model relations | Add new relation fields |
| 0.4 | Update Booking model | Add preFills relation |
| 0.5 | Run `bun run db:push` | Push schema to Supabase |
| 0.6 | Data migration script | Convert existing DoctorMedicine.morning/afternoon/evening from String→Int, dose from String→JSON[] |

### Phase 1: Prescription Settings Pages (Foundation)
**Effort: ~1 day**

| # | Task | Files |
|---|------|-------|
| 1.1 | Update sidebar config for treeview | `src/lib/sidebar-config.ts`, `src/components/dashboard/sidebar.tsx` |
| 1.2 | CO Categories page + API | `/dashboard/doctor/rx-settings/co-categories`, `/api/dashboard/doctor/rx-settings/co-categories` |
| 1.3 | Complaints page + API | `/dashboard/doctor/rx-settings/complaints`, `/api/dashboard/doctor/rx-settings/complaints` |
| 1.4 | Suggestions page + API | `/dashboard/doctor/rx-settings/suggestions`, `/api/dashboard/doctor/rx-settings/suggestions` |
| 1.5 | Labels page + API | `/dashboard/doctor/rx-settings/labels`, `/api/dashboard/doctor/rx-settings/labels` |
| 1.6 | Table Master page + API | `/dashboard/doctor/rx-settings/table-master`, `/api/dashboard/doctor/rx-settings/table-master` |
| 1.7 | Print Settings page + API | `/dashboard/doctor/rx-settings/print-settings`, `/api/dashboard/doctor/rx-settings/print-settings` |
| 1.8 | Shared MultiLanguageInput component | `src/components/prescription/multi-lang-input.tsx` |

### Phase 2: Medicine Master Overhaul + Findings
**Effort: ~0.5 day**

| # | Task | Files |
|---|------|-------|
| 2.1 | Update Medicine Master page (dose=tag, timing=numbers) | `/dashboard/doctor/medicines/page.tsx` |
| 2.2 | Update Medicine API (new field types) | `/api/dashboard/doctor/medicines/route.ts`, `[id]/route.ts` |
| 2.3 | Build DoseTagInput component | `src/components/prescription/dose-tag-input.tsx` |
| 2.4 | Findings Master page + API | `/dashboard/doctor/findings`, `/api/dashboard/doctor/findings` |

### Phase 3: Shared Prescription Components
**Effort: ~0.5 day**

| # | Task | Files |
|---|------|-------|
| 3.1 | Build PrescriptionStepper component | `src/components/prescription/stepper.tsx` |
| 3.2 | Build MedicineAutocomplete component | `src/components/prescription/medicine-autocomplete.tsx` |
| 3.3 | Build usePrescriptionStore (zustand) | `src/lib/prescription-store.ts` |

### Phase 4: 6-Step Stepper Wizard (Prescription Creation)
**Effort: ~1.5 days**

| # | Task | Files |
|---|------|-------|
| 4.1 | Rewrite `/dashboard/doctor/prescriptions/new` | Complete rewrite as stepper wizard |
| 4.2 | Step 1: Complaints component | Category accordion + checkboxes + pre-fill support |
| 4.3 | Step 2: Labels/Vitals component | Dynamic form from LabelMaster + pre-fill |
| 4.4 | Step 3: Table Details component | Template selector + editable table |
| 4.5 | Step 4: Medicines component | Findings dropdown + autocomplete + dose selector + number inputs |
| 4.6 | Step 5: Suggestions component | Auto-filtered checkboxes + note + next visit + mic |
| 4.7 | Step 6: Finish component | Submit + success state |
| 4.8 | Update Prescription POST API | Accept all new fields, create all child records |

### Phase 5: Assistant Pre-Fill
**Effort: ~0.5 day**

| # | Task | Files |
|---|------|-------|
| 5.1 | Assistant pre-fill API | `/api/dashboard/assistant/pre-fill` |
| 5.2 | Doctor pre-fill read API | `/api/dashboard/doctor/pre-fill/[bookingId]` |
| 5.3 | Assistant pre-fill page | `/dashboard/assistant/pre-fill/[bookingId]` |
| 5.4 | Assistant pre-fill list page | `/dashboard/assistant/pre-fill` (today's appointments) |
| 5.5 | Update assistant sidebar | `src/lib/sidebar-config.ts` |
| 5.6 | Doctor queue: show "Pre-Filled" badge | `/dashboard/doctor/page.tsx` |

### Phase 6: Print Template Overhaul
**Effort: ~0.5 day**

| # | Task | Files |
|---|------|-------|
| 6.1 | Rewrite `PrescriptionPrintView` | Add C/O, tables, next visit, fullHeader, number M/A/E, grouped suggestions |
| 6.2 | Load POtherSetting in print | Fetch doctor's print settings |
| 6.3 | Multi-language support in print | Use `coDetailEn`, `suggestionsEn`, `labelEn` |

### Phase 7: Prescription Edit + View Overhaul
**Effort: ~0.5 day**

| # | Task | Files |
|---|------|-------|
| 7.1 | Update view page to show new data | `/dashboard/doctor/prescriptions/[id]` — show C/O, tables, suggestions, next visit |
| 7.2 | Update print data mapping | Include all new fields in getPrintData() |

### Phase 8: Testing & QA
**Effort: ~0.5 day**

- Test full flow: Settings → Assistant Pre-Fill → Doctor Rx → Print
- Test multi-language (Gujarati + English)
- Test dose tag input
- Test findings auto-fill
- Test print output

---

## 12. MIGRATION & BACKWARD COMPATIBILITY

### 12.1 Data Migration Script

For `DoctorMedicine` table:

```typescript
// Migration logic for DoctorMedicine
// OLD: morning = "after food" (String)
// NEW: morning = 1 (Int — tablet count)
// OLD: dose = "500mg" (String)
// NEW: doses = '["500mg"]' (JSON array)

// Strategy:
// 1. If morning/afternoon/evening is a number string ("1", "2") → parse to Int
// 2. If it contains text ("after food") → extract number if present, else default to 1
//    and move the text to description field
// 3. For dose: wrap existing value in array: doses = `["${oldDose}"]`
// 4. If dose is empty → doses = "[]"
```

For `PMedicine` table:

```typescript
// Migration logic for PMedicine
// OLD: morning = true (Boolean)
// NEW: morning = 1 (Int)
// Strategy: true → 1, false → 0
```

### 12.2 Backward Compatibility

- Existing prescriptions (with boolean morning/afternoon/evening) will display correctly:
  - Old `true` → display as "1"
  - Old `false` → display as "0" or "—"
- Print view handles both old and new data gracefully
- No data deletion — all existing prescriptions remain accessible

---

## 13. RISK REGISTER

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 1 | **Schema migration breaks existing data** | High | Write migration script, test on backup first. DoctorMedicine String→Int conversion needs careful parsing. |
| 2 | **Sidebar treeview not supported** | Medium | shadcn/ui Sidebar supports collapsible groups. If not, use simple indentation. |
| 3 | **DoseTagInput UX complexity** | Medium | Start with simple comma-separated input, upgrade to tag UI later if time permits. |
| 4 | **6-step state management** | High | Use zustand store — single source of truth, easy to persist, debug, and reset. |
| 5 | **Assistant pre-fill timing** | Low | Pre-fill data is saved independently. Doctor reads it when opening Rx. No real-time sync needed. |
| 6 | **Print layout varies by doctor** | Medium | POtherSetting.fullHeader flag controls header type. Always fallback to text header if no image. |
| 7 | **Multi-language content in DB** | Low | No translation engine needed — doctor enters both languages manually. Just store and display. |
| 8 | **Table Master is complex** | Medium | Keep it simple: JSON storage for structure, render as HTML table. No complex grid library needed. |
| 9 | **Voice input (mic) not working** | Low | Mark as Phase 2 enhancement. Hide mic button if ASR not configured. |
| 10 | **Existing prescriptions break after schema change** | High | Migration script converts boolean→int. Old prescriptions with morning=true show as morning=1 on print. |

---

## APPENDIX A: FILE STRUCTURE AFTER DEVELOPMENT

```
src/
├── app/
│   ├── api/
│   │   └── dashboard/
│   │       ├── doctor/
│   │       │   ├── rx-settings/
│   │       │   │   ├── co-categories/route.ts      [NEW]
│   │       │   │   ├── complaints/route.ts         [NEW]
│   │       │   │   ├── suggestions/route.ts        [NEW]
│   │       │   │   ├── labels/route.ts             [NEW]
│   │       │   │   ├── table-master/route.ts       [NEW]
│   │       │   │   └── print-settings/route.ts     [NEW]
│   │       │   ├── findings/route.ts              [NEW]
│   │       │   ├── pre-fill/[bookingId]/route.ts   [NEW]
│   │       │   ├── prescriptions/route.ts          [MODIFIED]
│   │       │   ├── prescriptions/[id]/route.ts     [MODIFIED]
│   │       │   └── medicines/route.ts              [MODIFIED]
│   │       │   └── medicines/[id]/route.ts         [MODIFIED]
│   │       └── assistant/
│   │           └── pre-fill/route.ts               [NEW]
│   └── dashboard/
│       ├── doctor/
│       │   ├── rx-settings/
│       │   │   ├── co-categories/page.tsx           [NEW]
│       │   │   ├── complaints/page.tsx              [NEW]
│       │   │   ├── suggestions/page.tsx             [NEW]
│       │   │   ├── labels/page.tsx                  [NEW]
│       │   │   ├── table-master/page.tsx            [NEW]
│       │   │   └── print-settings/page.tsx          [NEW]
│       │   ├── findings/page.tsx                   [NEW]
│       │   ├── prescriptions/new/page.tsx          [REWRITTEN]
│       │   ├── prescriptions/[id]/page.tsx         [MODIFIED]
│       │   └── medicines/page.tsx                  [MODIFIED]
│       └── assistant/
│           ├── pre-fill/page.tsx                   [NEW]
│           └── pre-fill/[bookingId]/page.tsx        [NEW]
├── components/
│   │   ├── prescription/
│   │   │   ├── stepper.tsx                         [NEW]
│   │   │   ├── dose-tag-input.tsx                   [NEW]
│   │   │   ├── multi-lang-input.tsx                [NEW]
│   │   │   ├── medicine-autocomplete.tsx           [NEW]
│   │   │   └── print-view.tsx                      [REWRITTEN]
│   │   └── dashboard/
│   │       └── sidebar.tsx                         [MODIFIED — treeview support]
└── lib/
      ├── sidebar-config.ts                        [MODIFIED]
      └── prescription-store.ts                     [NEW]

prisma/
└── schema.prisma                                   [MODIFIED]
```

---

## APPENDIX B: COMPLETE API ENDPOINT SUMMARY

| # | Endpoint | Method | Auth | Phase |
|---|----------|--------|------|-------|
| 1 | `/api/dashboard/doctor/rx-settings/co-categories` | GET | doctor | 1 |
| 2 | `/api/dashboard/doctor/rx-settings/co-categories` | POST | doctor | 1 |
| 3 | `/api/dashboard/doctor/rx-settings/co-categories/[id]` | PUT | doctor | 1 |
| 4 | `/api/dashboard/doctor/rx-settings/co-categories/[id]` | DELETE | doctor | 1 |
| 5 | `/api/dashboard/doctor/rx-settings/complaints` | GET | doctor | 1 |
| 6 | `/api/dashboard/doctor/rx-settings/complaints` | POST | doctor | 1 |
| 7 | `/api/dashboard/doctor/rx-settings/complaints/[id]` | PUT | doctor | 1 |
| 8 | `/api/dashboard/doctor/rx-settings/complaints/[id]` | DELETE | doctor | 1 |
| 9 | `/api/dashboard/doctor/rx-settings/suggestions` | GET | doctor | 1 |
| 10 | `/api/dashboard/doctor/rx-settings/suggestions` | POST | doctor | 1 |
| 11 | `/api/dashboard/doctor/rx-settings/suggestions/[id]` | PUT | doctor | 1 |
| 12 | `/api/dashboard/doctor/rx-settings/suggestions/[id]` | DELETE | doctor | 1 |
| 13 | `/api/dashboard/doctor/rx-settings/labels` | GET | doctor | 1 |
| 14 | `/api/dashboard/doctor/rx-settings/labels` | POST | doctor | 1 |
| 15 | `/api/dashboard/doctor/rx-settings/labels/[id]` | PUT | doctor | 1 |
| 16 | `/api/dashboard/doctor/rx-settings/labels/[id]` | DELETE | doctor | 1 |
| 17 | `/api/dashboard/doctor/rx-settings/table-master` | GET | doctor | 1 |
| 18 | `/api/dashboard/doctor/rx-settings/table-master` | POST | doctor | 1 |
| 19 | `/api/dashboard/doctor/rx-settings/table-master/[id]` | PUT | doctor | 1 |
| 20 | `/api/dashboard/doctor/rx-settings/table-master/[id]` | DELETE | doctor | 1 |
| 21 | `/api/dashboard/doctor/rx-settings/print-settings` | GET | doctor | 1 |
| 22 | `/api/dashboard/doctor/rx-settings/print-settings` | PUT | doctor | 1 |
| 23 | `/api/dashboard/doctor/findings` | GET | doctor | 2 |
| 24 | `/api/dashboard/doctor/findings` | POST | doctor | 2 |
| 25 | `/api/dashboard/doctor/findings/[id]` | PUT | doctor | 2 |
| 26 | `/api/dashboard/doctor/findings/[id]` | DELETE | doctor | 2 |
| 27 | `/api/dashboard/assistant/pre-fill` | GET | assistant | 5 |
| 28 | `/api/dashboard/assistant/pre-fill` | POST | assistant | 5 |
| 29 | `/api/dashboard/assistant/pre-fill` | PUT | assistant | 5 |
| 30 | `/api/dashboard/doctor/pre-fill/[bookingId]` | GET | doctor | 5 |
| 31 | `/api/dashboard/doctor/prescriptions` | POST (modified) | doctor | 4 |
| 32 | `/api/dashboard/doctor/prescriptions/[id]` | GET (modified) | doctor | 7 |
| 33 | `/api/dashboard/doctor/prescriptions/[id]` | PUT (modified) | doctor | 7 |
| 34 | `/api/dashboard/doctor/medicines` | POST (modified) | doctor | 2 |
| 35 | `/api/dashboard/doctor/medicines/[id]` | PUT (modified) | doctor | 2 |

**Total: 35 API endpoints (30 new + 5 modified)**

---

## APPENDIX C: ESTIMATED EFFORT

| Phase | Description | New Files | Modified Files | Estimated Time |
|-------|-------------|-----------|----------------|-----------------|
| 0 | Database Migration | 0 | 1 (schema) | 2 hours |
| 1 | Prescription Settings Pages | 14 (7 pages + 7 APIs) | 2 (sidebar, sidebar-config) | 1 day |
| 2 | Medicine Overhaul + Findings | 3 (findings page + API, dose-tag-input) | 3 (medicines page, 2 APIs) | 0.5 day |
| 3 | Shared Components | 3 (stepper, autocomplete, store) | 0 | 0.5 day |
| 4 | 6-Step Stepper Wizard | 1 (new rx page) | 1 (prescriptions API) | 1.5 days |
| 5 | Assistant Pre-Fill | 5 (2 pages + 2 APIs + 1 list) | 2 (sidebar, doctor queue) | 0.5 day |
| 6 | Print Template Overhaul | 0 | 1 (print-view) | 0.5 day |
| 7 | Rx Edit/View Update | 0 | 1 (rx [id] page) | 0.5 day |
| 8 | Testing & QA | 0 | 0 | 0.5 day |
| | **TOTAL** | **~26 new files** | **~11 modified files** | **~6 days** |

---

*End of Plan Document*