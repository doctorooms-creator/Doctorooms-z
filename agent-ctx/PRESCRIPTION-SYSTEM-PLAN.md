# 🏗️ Prescription System — Architecture Plan

> **Version:** 1.0  
> **Author:** System Architect  
> **Scope:** Complete rebuild of the prescription creation workflow to match legacy PHP system's 6-step stepper wizard  
> **Status:** PENDING APPROVAL — Do NOT begin development until this plan is reviewed

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Core Concepts & Mental Model](#2-core-concepts--mental-model)
3. [Database Schema Changes](#3-database-schema-changes)
4. [New Models & Relations](#4-new-models--relations)
5. [The 6-Step Stepper Wizard](#5-the-6-step-stepper-wizard)
6. [Two-Phase Workflow (Assistant + Doctor)](#6-two-phase-workflow-assistant--doctor)
7. [Multi-Language System](#7-multi-language-system)
8. [Master Data Pages (Prescription Settings)](#8-master-data-pages-prescription-settings)
9. [Findings Master System](#9-findings-master-system)
10. [Medicine Master Updates](#10-medicine-master-updates)
11. [Print Template System](#11-print-template-system)
12. [API Endpoints](#12-api-endpoints)
13. [File Structure & Routing](#13-file-structure--routing)
14. [Sidebar Configuration](#14-sidebar-configuration)
15. [Component Architecture](#15-component-architecture)
16. [State Management](#16-state-management)
17. [Development Phases & Order](#17-development-phases--order)
18. [Migration Strategy for Existing Data](#18-migration-strategy-for-existing-data)
19. [Edge Cases & Gotchas](#19-edge-cases--gotchas)
20. [Quick Reference: Before vs After](#20-quick-reference-before-vs-after)

---

## 1. Executive Summary

The current prescription system is a **flat single-page form** that creates a prescription in one shot. The legacy PHP system uses a **6-step AJAX stepper wizard** where two different roles (Assistant and Doctor) complete different steps. This plan rebuilds the entire prescription workflow to match the legacy system's UX while leveraging the modern Next.js stack.

### Key Changes at a Glance

| Aspect | Current (Broken) | Planned (Legacy Match) |
|--------|------------------|------------------------|
| Prescription creation | Single flat form | 6-step stepper wizard (AJAX, no page reload) |
| Roles | Doctor only | Assistant (Steps 1-2) + Doctor (Steps 3-6) |
| Complaints | None | C/O with multi-language (local + English) |
| Vitals | Flat fields in prescription | Step 2 — separate entry by assistant |
| Medicine timing | Booleans (morning/afternoon/evening) | Numbers (tablet count per time slot) |
| Medicine dose | Single string | JSON array of options (tag input) |
| Findings | None | NEW — auto-fill medicines by finding |
| Suggestions | Free text | Auto-linked from Category → Complaint → Suggestion hierarchy |
| Labels | No units, no showUnit toggle | Units + `showUnit` boolean per label |
| Tables | No custom templates | Doctor-built table templates with preview |
| Print | Basic template | Custom header OR full header image, C/O section, tables, next visit |

---

## 2. Core Concepts & Mental Model

### 2.1 The Two-Phase Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PATIENT FLOW                                  │
│                                                                  │
│  Patient arrives → Sits OUTSIDE cabin → Goes INSIDE cabin       │
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────────────────┐     │
│  │   ASSISTANT      │     │         DOCTOR               │     │
│  │   (Outside)      │     │         (Inside)             │     │
│  │                  │     │                              │     │
│  │ Step 1: Complaints│     │ Step 3: Diagnosis Tables    │     │
│  │ Step 2: Vitals    │     │ Step 4: Medicines           │     │
│  │                  │     │ Step 5: Suggestions          │     │
│  │                  │     │ Step 6: Finish & Print       │     │
│  └──────────────────┘     └──────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Multi-Language Dual-Field Pattern

**Every user-facing text entity uses TWO fields:**

```
┌─────────────────────────┬──────────────────────────┐
│  Field (Primary)        │  FieldEn (English)        │
├─────────────────────────┼──────────────────────────┤
│  "તાવો આવે છે" (Gujarati)  │  "Fever" (English)        │
│  "સરદી લાગે છે"          │  "Cold"                   │
│  "પેટમાં દુખાવો"          │  "Stomach Pain"           │
└─────────────────────────┴──────────────────────────┘

Usage:
  - SELECTOR UI (stepper, dropdowns, tags) → Shows PRIMARY (local language)
  - PRINT OUTPUT (prescription PDF/print)  → Shows ENGLISH version
```

### 2.3 Suggestion Auto-Linking Hierarchy

```
Category (શરીર / Body)
  └── Complaint (તાવો / Fever)  ← Selected in Step 1
        ├── Suggestion 1: "Drink plenty of water"
        ├── Suggestion 2: "Take rest for 3 days"
        └── Suggestion 3: "Avoid cold food"

  └── Complaint (સરદી / Cold)  ← Also selected in Step 1
        ├── Suggestion 1: "Steam inhalation 2x daily"
        └── Suggestion 2: "Warm water gargling"

In Step 5: Only suggestions linked to SELECTED complaints appear.
```

### 2.4 Findings → Medicine Auto-Fill

```
Doctor creates Finding: "Viral Fever"
  └── Links 5 medicines to it:
        ├── Paracetamol 500mg — 1-0-1
        ├── Azithromycin 500mg — 1-0-0 (3 days)
        ├── Cetirizine 10mg — 0-0-1
        ├── Pan D — 1-0-0
        └── Multivitamin — 1-0-1

During Rx Step 4: Doctor selects "Viral Fever" from dropdown
  → All 5 medicines auto-fill with their doses and timings
  → Doctor can modify any individual medicine before saving
```

---

## 3. Database Schema Changes

### 3.1 Modified Existing Models

#### CoMaster (Chief Complaints)
```diff
  model CoMaster {
    id          String   @id @default(cuid())
    coCode      String   @default("")
    coDetail    String   @default("")        // PRIMARY language (e.g., Gujarati) — shown in stepper
+   coDetailEn  String   @default("")        // ENGLISH — used in print output
+   categoryId  String?                     // Links to CategoryMaster
    status      String   @default("Active")
    createdById String?
    doctorId    String
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    doctor      Doctor   @relation(...)
+   category    CategoryMaster? @relation(fields: [categoryId], references: [id])
  }
```

#### LabelMaster
```diff
  model LabelMaster {
    id          String   @id @default(cuid())
    label       String   @default("")
+   labelEn     String   @default("")        // English version for print
+   unit        String   @default("")        // e.g., "mg/dL", "%", "mmHg"
+   showUnit    Boolean @default(true)       // Whether to show unit after value in print
    status      String   @default("Active")
    createdById String?
    doctorId    String
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    doctor      Doctor   @relation(...)
  }
```

#### QuestionsMaster (renamed conceptually — these are the "questions" for suggestions)
```diff
  model QuestionsMaster {
    id          String   @id @default(cuid())
    question    String   @default("")
+   questionEn  String   @default("")        // English for print
    explanation String   @default("")
+   coId        String?                     // Link to CoMaster (complaint)
    status      String   @default("Active")
    createdById String?
    doctorId    String
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    doctor      Doctor   @relation(...)
+   co          CoMaster? @relation("QuestionCo", fields: [coId], references: [id])
    suggestions SuggestionsMaster[]
  }
```

#### SuggestionsMaster
```diff
  model SuggestionsMaster {
    id           String   @id @default(cuid())
    questionId   String
    suggestions  String   @default("")
+   suggestionsEn String   @default("")     // English for print
    status       String   @default("Active")
    createdById  String?
    doctorId     String
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt

    question     QuestionsMaster @relation(...)
  }
```

#### DoctorMedicine
```diff
  model DoctorMedicine {
    id          String   @id @default(cuid())
    name        String   @default("")
-   morning     String   @default("")        // Was: free text
-   afternoon   String   @default("")        // Was: free text
-   evening     String   @default("")        // Was: free text
-   dose        String   @default("")        // Was: single string
+   morning     Int      @default(0)          // NOW: tablet count (0 = not taken)
+   afternoon   Int      @default(0)          // NOW: tablet count
+   evening     Int      @default(0)          // NOW: tablet count
+   dose        String   @default("[]")       // NOW: JSON array ["500mg","650mg","1000mg"]
    tab         Int      @default(1)          // Total days/quantity
    description String   @default("")
    status      String   @default("Active")
    createdById String?
    userId      String
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    doctor      Doctor   @relation(...)
+   findings    FindingsMedicine[]
  }
```

#### PMedicine (Prescription Medicine — snapshot at time of Rx)
```diff
  model PMedicine {
    id          String   @id @default(cuid())
    prescriptionId String
    medicine    String   @default("")
-   morning     Boolean  @default(false)     // Was: boolean
-   afternoon   Boolean  @default(false)     // Was: boolean
-   evening     Boolean  @default(false)     // Was: boolean
+   morning     Int      @default(0)          // NOW: tablet count
+   afternoon   Int      @default(0)          // NOW: tablet count
+   evening     Int      @default(0)          // NOW: tablet count
    tab         Int      @default(1)          // Total days
-   dose        String   @default("")        // Was: single string
+   dose        String   @default("")        // Selected dose value (one from the array)
    description String   @default("")
    createdById String?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    prescription Prescription @relation(...)
  }
```

#### PLabel (Prescription Label — snapshot)
```diff
  model PLabel {
    id             String   @id @default(cuid())
    prescriptionId String
    label          String   @default("")
+   labelEn        String   @default("")        // English label for print
    value          String   @default("")
    labelUnit      String   @default("")        // The unit text
+   showUnit       Boolean @default(true)       // Whether to show unit in print
    createdById    String?
    createdAt      DateTime @default(now())
    updatedAt      DateTime @updatedAt

    prescription   Prescription @relation(...)
  }
```

#### PSuggestion (Prescription Suggestion — snapshot)
```diff
  model PSuggestion {
    id             String   @id @default(cuid())
    prescriptionId String
    question       String   @default("")        // Question text (local lang)
+   questionEn     String   @default("")        // English question for print
    suggestions    String   @default("")        // Suggestion text (local lang)
+   suggestionsEn  String   @default("")        // English suggestion for print
    createdById    String?
    createdAt      DateTime @default(now())
    updatedAt      DateTime @updatedAt

    prescription   Prescription @relation(...)
  }
```

#### Prescription
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
+   status       String   @default("Draft")    // Draft, Active, Archived
+   nextVisit    DateTime?                      // Next visit date
+   assistantId  String?                       // User.id of assistant who did Steps 1-2
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt

    booking      Booking  @relation(...)
    doctor       Doctor   @relation(...)
    doctorId     String
+   assistant    User?    @relation("PrescriptionAssistant", fields: [assistantId], references: [id])
    medicines    PMedicine[]
    labels       PLabel[]
    suggestions  PSuggestion[]
    diagnosisTables PDignoTable[]
    chiefComplaints PCo[]
    accessRequests    PrescriptionAccessRequest[]
  }
```

#### PDignoTable (enhanced for template support)
```diff
  model PDignoTable {
    id             String   @id @default(cuid())
    prescriptionId String
+   templateId     String?                     // Link to TableTemplateMaster (if from template)
    rows           Int      @default(3)
    cols           Int      @default(2)
    headerLabel    String   @default("[]")     // JSON: column headers
    colsLabel      String   @default("[]")     // JSON: row labels
    footerLabel    String   @default("[]")     // JSON: footer text
    extraLabel     String   @default("")
    createdById    String?
    createdAt      DateTime @default(now())
    updatedAt      DateTime @updatedAt

    prescription   Prescription @relation(...)
  }
```

#### POtherSetting (Print Settings)
```diff
  model POtherSetting {
    id            String   @id @default(cuid())
    doctorId      String   @unique
    logo          String   @default("")        // Small logo image
    time          String   @default("{}")       // JSON: timing config
    header        String   @default("")        // Custom header text
    fullHeader    String   @default("")        // Full header image URL
    isFullHeader  Boolean  @default(false)      // true = use fullHeader image, false = use header text + logo
+   footer        String   @default("")        // Custom footer text
+   showCoInPrint Boolean @default(true)        // Show C/O section in print
+   showNextVisit Boolean @default(true)        // Show next visit date in print
+   printLayout   String   @default("standard")  // standard, compact, detailed
    createdById   String?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    doctor        Doctor   @relation(...)
  }
```

### 3.2 New Models

#### CategoryMaster
```prisma
  model CategoryMaster {
    id          String   @id @default(cuid())
    name        String   @default("")          // e.g., "શરીર" (Body), "માથું" (Head)
    nameEn      String   @default("")          // English: "Body", "Head"
    status      String   @default("Active")
    createdById String?
    doctorId    String
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    doctor      Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
    complaints  CoMaster[]                      // CoMaster has categoryId
  }
```

#### FindingsMaster
```prisma
  model FindingsMaster {
    id          String   @id @default(cuid())
    name        String   @default("")          // Finding name (local lang)
    nameEn      String   @default("")          // English name
    status      String   @default("Active")
    createdById String?
    doctorId    String
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    doctor      Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
    medicines   FindingsMedicine[]
  }
```

#### FindingsMedicine (Join table — which medicines are linked to which finding)
```prisma
  model FindingsMedicine {
    id              String   @id @default(cuid())
    findingId       String
    medicineId      String   // DoctorMedicine.id
    dose            String   @default("")     // Pre-selected dose override (if different from master default)
    morning         Int      @default(0)      // Override morning count
    afternoon       Int      @default(0)      // Override afternoon count
    evening         Int      @default(0)      // Override evening count
    tab             Int      @default(1)      // Override total days
    description     String   @default("")     // Override description
    createdAt       DateTime @default(now())

    finding         FindingsMaster  @relation(fields: [findingId], references: [id], onDelete: Cascade)
    medicine        DoctorMedicine  @relation(fields: [medicineId], references: [id], onDelete: Cascade)

    @@unique([findingId, medicineId])  // Prevent duplicate links
  }
```

#### TableTemplateMaster (Custom table structures for Step 3)
```prisma
  model TableTemplateMaster {
    id          String   @id @default(cuid())
    name        String   @default("")          // Template name, e.g., "Ultrasound Abdomen"
    rows        Int      @default(3)
    cols        Int      @default(2)
    headerLabel String   @default("[]")       // JSON: ["Parameter", "Value", "Unit"]
    colsLabel   String   @default("[]")       // JSON: row labels
    footerLabel String   @default("[]")       // JSON: footer rows
    extraLabel  String   @default("")
    status      String   @default("Active")
    createdById String?
    doctorId    String
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    doctor      Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  }
```

---

## 4. New Models & Relations

### Relation Map (New + Modified)

```
CategoryMaster 1────* CoMaster
  (categoryId)       (complaints)

CoMaster 1────* QuestionsMaster
  (coId via "QuestionCo")    (suggestions via SuggestionsMaster)

QuestionsMaster 1────* SuggestionsMaster

FindingsMaster 1────* FindingsMedicine *────1 DoctorMedicine

TableTemplateMaster (standalone per doctor)

Prescription
  ├── assistantId → User (who did Steps 1-2)
  ├── nextVisit: DateTime?
  ├── status: Draft/Active/Archived
  └── PMedicine.morning/afternoon/evening: Int (count, not boolean)
```

### Doctor Model Additions

```diff
  model Doctor {
    // ... existing fields ...

+   categories        CategoryMaster[]
+   findings          FindingsMaster[]
+   tableTemplates    TableTemplateMaster[]
    coMaster          CoMaster[]
    labelMaster       LabelMaster[]
    questionMaster    QuestionsMaster[]
    otherSettings     POtherSetting?
  }
```

---

## 5. The 6-Step Stepper Wizard

### 5.1 Step Overview

| Step | Title | Actor | Description |
|------|-------|-------|-------------|
| 1 | **Chief Complaints (C/O)** | Assistant | Select complaints from master (shown in primary/local language). Multi-select with search. |
| 2 | **Vitals & Labels** | Assistant | Enter patient vitals using Label Master. Weight, BP, Temperature + any custom labels. |
| 3 | **Diagnosis Tables** | Doctor | Add custom tables (ultrasound reports, lab data). Can use pre-built templates or create ad-hoc. |
| 4 | **Medicines (Rx)** | Doctor | Add medicines manually OR auto-fill via Findings dropdown. Edit any field. |
| 5 | **Suggestions / Advice** | Doctor | Suggestions auto-populated based on selected complaints (from Step 1). Click to select. |
| 6 | **Finish & Print** | Doctor | Review all data. Set next visit date. Save & Print. |

### 5.2 Stepper UI Behavior

```
┌─────────────────────────────────────────────────────────────┐
│  ① Complaints  →  ② Vitals  →  ③ Tables  →  ④ Rx  →  ⑤ Advice  →  ⑥ Finish  │
│  ═══════════     ────────    ────────   ───────   ────────    ────────  │
│  (completed)     (current)  (pending)  (pending)  (pending)   (pending)  │
└─────────────────────────────────────────────────────────────┘

RULES:
- Steps 1-2: Visible & editable by ASSISTANT role
- Steps 3-6: Visible & editable by DOCTOR role
- All 6 steps visible as a progress bar at the top
- Current step content swaps below WITHOUT page reload (React state)
- Each step has a "Save & Continue" button that persists to DB via API
- Steps 1-2 are auto-saved when assistant submits
- Doctor sees read-only summary of Steps 1-2 at the top when entering Step 3
- Back navigation allowed (go back to previous step, data preserved)
- Steps are NOT strictly sequential for doctor — can jump to any step 3-6
```

### 5.3 Step Detail Specifications

#### Step 1: Chief Complaints (C/O)
```
┌─────────────────────────────────────────────┐
│  Step 1: Chief Complaints                   │
├─────────────────────────────────────────────┤
│                                              │
│  [Search complaints...          ]            │
│                                              │
│  Category: શરીર (Body)                       │
│  ┌─────────────────────────────────────┐    │
│  │ ☑ તાવો આવે છે  (Fever)             │    │
│  │ ☑ સરદી લાગે છે  (Cold)             │    │
│  │ ☐ પેટમાં દુખાવો  (Stomach Pain)   │    │
│  │ ☐ માથાનો દુખાવો  (Headache)       │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  Category: માથું (Head)                      │
│  ┌─────────────────────────────────────┐    │
│  │ ☐ માથાનો દુખાવો  (Headache)       │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  [Save & Continue →]                         │
└─────────────────────────────────────────────┘

BEHAVIOR:
- Complaints grouped by CategoryMaster
- Each complaint shows: PRIMARY language text + (English in parentheses)
- Click to toggle selection (checkbox or click-highlight)
- Search filters across all categories
- Selected complaints saved to PCo table (link to CoMaster)
- API: POST /api/prescription/[id]/complaints
```

#### Step 2: Vitals & Labels
```
┌─────────────────────────────────────────────┐
│  Step 2: Vitals & Labels                     │
├─────────────────────────────────────────────┤
│                                              │
│  Weight:  [  70  ] kg                        │
│  BP:      [ 120/80 ] mmHg                    │
│  Temp:    [  98.6 ] °F                       │
│  Pulse:   [  72  ] bpm                       │
│  SpO2:    [  98  ] %                         │
│                                              │
│  ─── Custom Labels ───                       │
│  [+ Add Label]                               │
│                                              │
│  [ Hemoglobin  ] [ 12.5 ] [ g/dL  ]          │
│  [ Blood Sugar ] [ 110  ] [ mg/dL ] [×]      │
│                                              │
│  [← Back]  [Save & Continue →]               │
└─────────────────────────────────────────────┘

BEHAVIOR:
- Top section: Common vitals (weight, BP, temp, pulse, SpO2) — always shown
- Bottom section: Dynamic labels from LabelMaster
  - Label name shown (local lang), input for value
  - If LabelMaster has `unit`, show it as a suffix/label
  - If `showUnit = false`, don't display the unit
- Data saved to: Prescription.weight/bp/temperature + PLabel records
- API: POST /api/prescription/[id]/vitals
```

#### Step 3: Diagnosis Tables
```
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Diagnosis Tables                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [+ Add Table]   [From Template ▼]                           │
│                                                              │
│  Table 1: Ultrasound Abdomen (from template)                 │
│  ┌──────────────┬──────────┬──────────┐                      │
│  │ Parameter    │ Value    │ Unit     │                      │
│  ├──────────────┼──────────┼──────────┤                      │
│  │ Liver        │ Normal   │ —        │                      │
│  │ Gall Bladder │ Clear    │ —        │                      │
│  │ Kidney       │ Normal   │ —        │                      │
│  └──────────────┴──────────┴──────────┘                      │
│  [Edit] [Delete]                                            │
│                                                              │
│  Table 2: Custom Table                                       │
│  ┌──────────────┬──────────┐                                │
│  │ Lab Test     │ Result   │                                │
│  ├──────────────┼──────────┤                                │
│  │              │          │                                │
│  └──────────────┴──────────┘                                │
│  [+ Row] [+ Column]  [Edit] [Delete]                        │
│                                                              │
│  [← Back]  [Save & Continue →]                               │
└─────────────────────────────────────────────────────────────┘

BEHAVIOR:
- Doctor can add blank tables or use pre-built templates
- Template selection: dropdown of TableTemplateMaster entries
- Each table is editable: add/remove rows & columns
- Inline editing of cell values
- Tables saved to PDignoTable records
- API: POST /api/prescription/[id]/tables
```

#### Step 4: Medicines (Rx)
```
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Medicines (Rx)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Auto-Fill from Findings ─────────────────────────────┐  │
│  │ Select Finding: [Viral Fever ▼]  [Load →]             │  │
│  │ (selecting a finding auto-fills all linked medicines)  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  [+ Add Medicine Manually]                                   │
│                                                              │
│  # │ Medicine          │ Dose     │ M │ A │ E │ Days │ Notes │
│  ───┼───────────────────┼──────────┼───┼───┼───┼──────┼───────│
│  1 │ Paracetamol       │ [500mg▼] │ 1 │ 0 │ 1 │  5   │ AF    │
│  2 │ Azithromycin      │ [500mg▼] │ 1 │ 0 │ 0 │  3   │ —     │
│  3 │ Cetirizine        │ [10mg ▼] │ 0 │ 0 │ 1 │  5   │ —     │
│  4 │ [Type to search.. │          │   │   │   │      │       │
│    │  + new entry]     │          │   │   │   │      │       │
│                                                              │
│  [← Back]  [Save & Continue →]                               │
└─────────────────────────────────────────────────────────────┘

BEHAVIOR:
- "Select Finding" dropdown at the top — selecting fills all linked medicines below
- Can select MULTIPLE findings (each adds its medicines, avoids duplicates)
- Each medicine row:
  - Medicine name: autocomplete/typeahead from DoctorMedicine master
  - Dose: dropdown from the medicine's dose array (JSON), first option is default, can also type custom
  - M/A/E: number inputs (0 = skip, 1+ = that many tablets)
  - Days: number input (total duration)
  - Notes: free text (e.g., "AF" = after food, "BF" = before food)
- Can add medicines manually (not from findings)
- All medicines saved to PMedicine records
- API: POST /api/prescription/[id]/medicines
```

#### Step 5: Suggestions / Advice
```
┌─────────────────────────────────────────────┐
│  Step 5: Suggestions / Advice               │
├─────────────────────────────────────────────┤
│                                              │
│  Based on your complaints:                   │
│  • Fever → 3 suggestions available           │
│  • Cold → 2 suggestions available            │
│                                              │
│  From: Fever (તાવો)                         │
│  ☑ Drink plenty of water                    │
│  ☑ Take rest for 3 days                     │
│  ☐ Avoid cold food                          │
│                                              │
│  From: Cold (સરદી)                         │
│  ☑ Steam inhalation 2x daily                │
│  ☑ Warm water gargling                      │
│                                              │
│  ─── Custom Advice ───                       │
│  [+ Add Custom Suggestion]                  │
│                                              │
│  [← Back]  [Save & Continue →]               │
└─────────────────────────────────────────────┘

BEHAVIOR:
- Suggestions are AUTO-POPULATED based on Step 1 selected complaints
- Hierarchy: Category → Complaint (CoMaster) → QuestionsMaster → SuggestionsMaster
- Only suggestions for SELECTED complaints appear
- Each suggestion shows as a clickable toggle
- Doctor can also add custom free-text suggestions
- Saved to PSuggestion records (with both local + English text)
- API: POST /api/prescription/[id]/suggestions
```

#### Step 6: Finish & Print
```
┌─────────────────────────────────────────────┐
│  Step 6: Finish & Print                     │
├─────────────────────────────────────────────┤
│                                              │
│  ┌─ Summary ────────────────────────────┐   │
│  │ Patient: Rahul Sharma, 32y, Male     │   │
│  │ Complaints: Fever, Cold              │   │
│  │ Vitals: Wt 70kg, BP 120/80, T 98.6°F │   │
│  │ Medicines: 3 items                   │   │
│  │ Suggestions: 4 selected              │   │
│  │ Tables: 1 (Ultrasound)               │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Next Visit Date: [ 15 Feb 2025  📅 ]       │
│                                              │
│  [← Back]  [🖨️ Save & Print]                 │
│                                              │
└─────────────────────────────────────────────┘

BEHAVIOR:
- Read-only summary of everything entered in Steps 1-5
- Next visit date picker (optional)
- "Save & Print" finalizes the prescription:
  1. Saves all data
  2. Updates Prescription status to "Active"
  3. Updates Booking status to "Visited"
  4. Opens print preview modal
- API: POST /api/prescription/[id]/finalize
```

---

## 6. Two-Phase Workflow (Assistant + Doctor)

### 6.1 How It Works

```
ASSISTANT FLOW:
1. Assistant opens their dashboard → sees "Pending Prescriptions" queue
2. Clicks on an approved/visited appointment
3. Lands on Step 1 (Complaints) of the stepper
4. Selects complaints, enters vitals (Steps 1-2)
5. Clicks "Submit to Doctor" → prescription saved with status "Draft"
6. Prescription appears in Doctor's queue

DOCTOR FLOW:
1. Doctor opens their dashboard → sees prescriptions ready for completion
2. Clicks on a prescription → lands on Step 3 (Tables)
3. Steps 1-2 shown as READ-ONLY summary at top
4. Doctor completes Steps 3-6
5. On Step 6, clicks "Save & Print" → prescription finalized
```

### 6.2 Assistant Queue Page

- **Route:** `/dashboard/assistant/prescription-queue`
- **Lists:** All appointments with status `Approve` or `Visited` that don't have a prescription yet, OR prescriptions with status `Draft` (assistant completed Steps 1-2, waiting for doctor)
- **Sidebar entry:** Added to `assistant` role in sidebar-config.ts

### 6.3 Doctor's Prescription Entry Point

- **Route:** `/dashboard/doctor/prescriptions/new?bookingId=xxx`
- If booking already has a Draft prescription (assistant completed Steps 1-2), load that prescription and start at Step 3
- If no draft exists, create a new prescription and start at Step 1 (doctor does everything manually)
- Doctor can also start from appointment list: click appointment → "Create Prescription" → opens stepper

---

## 7. Multi-Language System

### 7.1 Where Dual-Language Applies

| Entity | Primary Field (Local) | English Field | Used In |
|--------|----------------------|---------------|---------|
| CoMaster | `coDetail` | `coDetailEn` | Stepper UI / Print |
| CategoryMaster | `name` | `nameEn` | Stepper UI / Print |
| QuestionsMaster | `question` | `questionEn` | Stepper Step 5 / Print |
| SuggestionsMaster | `suggestions` | `suggestionsEn` | Stepper Step 5 / Print |
| LabelMaster | `label` | `labelEn` | Stepper Step 2 / Print |
| FindingsMaster | `name` | `nameEn` | Stepper Step 4 dropdown / Print |

### 7.2 Rules

1. **Master entry forms**: Always show BOTH fields. Primary language field is required, English field is optional (but recommended).
2. **Stepper selection UIs**: Show PRIMARY language text. English shown in small text below/beside for reference.
3. **Print output**: Always use ENGLISH fields. If English is empty, fall back to primary field.
4. **Snapshot records** (PMedicine, PLabel, PSuggestion, etc.): Store both versions at the time of prescription creation.

---

## 8. Master Data Pages (Prescription Settings)

All master data pages live under `/dashboard/doctor/prescription-settings/` as a sub-section in the sidebar.

### 8.1 Pages List

| # | Page | Route | CRUD Operations |
|---|------|-------|----------------|
| 1 | **C/O Categories** | `/dashboard/doctor/prescription-settings/categories` | Create, Edit, Delete (soft), Toggle Active |
| 2 | **Chief Complaints** | `/dashboard/doctor/prescription-settings/complaints` | Create, Edit, Delete (soft), Toggle Active, Assign to Category |
| 3 | **Questions** | `/dashboard/doctor/prescription-settings/questions` | Create, Edit, Delete (soft), Toggle Active, Link to Complaint (CoMaster) |
| 4 | **Suggestions** | `/dashboard/doctor/prescription-settings/suggestions` | Create, Edit, Delete (soft), Toggle Active, Link to Question |
| 5 | **Labels** | `/dashboard/doctor/prescription-settings/labels` | Create, Edit, Delete (soft), Toggle Active, Set Unit, Set showUnit |
| 6 | **Findings** | `/dashboard/doctor/prescription-settings/findings` | Create, Edit, Delete (soft), Toggle Active, Link Medicines |
| 7 | **Table Templates** | `/dashboard/doctor/prescription-settings/table-templates` | Create, Edit, Delete (soft), Visual table builder with preview |
| 8 | **Print Settings** | `/dashboard/doctor/prescription-settings/print-settings` | Edit only (singleton), Upload header image/logo, Set header text, Toggle isFullHeader, Set footer, Toggle showCo, Toggle showNextVisit |

### 8.2 Sidebar Structure

```
Doctor Sidebar:
  📋 Dashboard
  📅 Appointments
  📝 Prescriptions
  💰 Earnings
  ⏰ Schedule
  👥 Patients
  💊 Medicine Master
  ⚙️ Prescription Settings  ← NEW (collapsible sub-menu)
      ├─ 📂 Categories
      ├─ 🤒 Complaints
      ├─ ❓ Questions
      ├─ 💡 Suggestions
      ├─ 🏷️ Labels
      ├─ 🔬 Findings
      ├─ 📊 Table Templates
      └─ 🖨️ Print Settings
  🖼️ Profile
  🖼️ Gallery
  📝 Posts
  🔑 Change Password
```

### 8.3 Key Master Page Details

#### Categories Page
- Simple CRUD list
- Fields: Name (local lang, required), Name English (optional), Status
- Grid or table layout
- Used to group complaints in the stepper

#### Complaints Page
- CRUD list
- Fields: Code (optional), Detail (local lang, required), Detail English (optional), Category (dropdown from CategoryMaster), Status
- Can be filtered by category
- Search by name

#### Questions Page
- CRUD list
- Fields: Question (local lang, required), Question English (optional), Explanation, Linked Complaint (dropdown from CoMaster), Status
- Each question can be linked to ONE complaint
- Suggestions are nested: each question has multiple suggestions

#### Suggestions Page
- CRUD list
- Fields: Parent Question (dropdown from QuestionsMaster), Suggestion (local lang, required), Suggestion English (optional), Status
- Can also be managed inline from the Questions page (nested CRUD)

#### Labels Page
- CRUD list
- Fields: Label (local lang, required), Label English (optional), Unit (e.g., "mg/dL"), Show Unit (toggle), Status
- Used in Step 2 to show dynamic input fields

#### Findings Page
- CRUD list with sub-section for linking medicines
- Fields: Name (local lang, required), Name English (optional), Status
- Sub-section: Multi-select medicines from DoctorMedicine master
- For each linked medicine, can override: dose, morning/afternoon/evening counts, days, description
- This is the KEY page for the auto-fill feature

#### Table Templates Page
- CRUD list with visual table builder
- Fields: Template Name, Rows, Cols, Column Headers (JSON editor), Row Labels (JSON editor)
- **Visual Preview**: Shows a live preview of the table as it's being built
- Doctor can define column headers, then row labels
- Used in Step 3 to quickly add structured data tables

#### Print Settings Page
- **Singleton** — only one record per doctor (POtherSetting)
- Fields:
  - Logo: Image upload (small, shown beside header text)
  - Header Text: Text input (shown at top of printout)
  - Full Header Image: Image upload (replaces header text + logo if isFullHeader=true)
  - Is Full Header: Toggle switch
  - Footer Text: Text input (shown at bottom of printout)
  - Show C/O in Print: Toggle
  - Show Next Visit in Print: Toggle
  - Print Layout: Dropdown (standard, compact, detailed)

---

## 9. Findings Master System

### 9.1 Architecture

```
FindingsMaster (the finding name)
  │
  ├── FindingsMedicine (join records)
  │     ├── medicineId → DoctorMedicine (which medicine)
  │     ├── dose → override dose (blank = use master default)
  │     ├── morning → override morning count (0 = use master default)
  │     ├── afternoon → override afternoon count
  │     ├── evening → override evening count
  │     ├── tab → override days (0 = use master default)
  │     └── description → override description
  │
  └── Used in Step 4 of stepper
```

### 9.2 Auto-Fill Flow in Step 4

```
1. Doctor opens Step 4 (Medicines)
2. Sees dropdown: "Select Finding"
3. Selects "Viral Fever"
4. System fetches FindingsMedicine records for this finding
5. For each linked medicine:
   a. Look up DoctorMedicine by medicineId
   b. Get name, dose array from DoctorMedicine
   c. Use FindingsMedicine overrides for morning/afternoon/evening/tab/dose/description
   d. If override is 0 or blank, fall back to DoctorMedicine defaults
   e. Pre-populate medicine row in the stepper
6. Doctor can:
   - Select ANOTHER finding (adds more medicines, skips duplicates by medicineId)
   - Edit any pre-populated value
   - Remove any pre-populated medicine
   - Add medicines manually
```

### 9.3 Findings Master Page UI

```
┌─────────────────────────────────────────────────────────────┐
│  Findings Master                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Search...                    ] [Filter: All ▼] [+ Add]    │
│                                                              │
│  ┌─ Viral Fever ──────────────────────────────────────┐    │
│  │  [Edit] [Delete]                                    │    │
│  │  Linked Medicines (5):                              │    │
│  │  ┌────────────┬───────┬───┬───┬───┬──────┐         │    │
│  │  │ Medicine   │ Dose  │ M │ A │ E │ Days │         │    │
│  │  ├────────────┼───────┼───┼───┼───┼──────┤         │    │
│  │  │ Paracetamol│ 500mg │ 1 │ 0 │ 1 │  5   │         │    │
│  │  │ Azithro.   │ 500mg │ 1 │ 0 │ 0 │  3   │         │    │
│  │  │ Cetirizine │ 10mg  │ 0 │ 0 │ 1 │  5   │         │    │
│  │  │ Pan D      │ —     │ 1 │ 0 │ 0 │  5   │         │    │
│  │  │ Multivitamin│ —    │ 1 │ 0 │ 1 │  10  │         │    │
│  │  └────────────┴───────┴───┴───┴───┴──────┘         │    │
│  │  [+ Link Medicine]                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─ Diabetes Type 2 ──────────────────────────────────┐    │
│  │  [Edit] [Delete]                                    │    │
│  │  Linked Medicines (3): ...                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Medicine Master Updates

### 10.1 Current vs Planned

| Field | Current Type | Planned Type | UI Change |
|-------|-------------|-------------|-----------|
| `name` | String | String | No change |
| `dose` | String (single) | String (JSON array `[]`) | **TAG INPUT** — add multiple dose options as tags |
| `morning` | String (free text) | Int (number) | **NUMBER INPUT** — tablet count (0 = not taken) |
| `afternoon` | String (free text) | Int (number) | **NUMBER INPUT** — tablet count |
| `evening` | String (free text) | Int (number) | **NUMBER INPUT** — tablet count |
| `tab` | Int (default 1) | Int (default 1) | No change — now represents total days |
| `description` | String | String | No change — now represents instructions (AF, BF, etc.) |

### 10.2 Updated Medicine Master Form

```
┌─────────────────────────────────────────────┐
│  Add / Edit Medicine                         │
├─────────────────────────────────────────────┤
│                                              │
│  Medicine Name *                              │
│  [ Paracetamol                       ]       │
│                                              │
│  Dose Options (multiple)                     │
│  [ 500mg × ] [ 650mg × ] [ 1000mg × ]       │
│  [ + Add dose option              ]          │
│  (first option is the default)               │
│                                              │
│  Morning Tablets   [ 1 ]  (0 = skip)         │
│  Afternoon Tablets [ 0 ]  (0 = skip)         │
│  Evening Tablets   [ 1 ]  (0 = skip)         │
│                                              │
│  Duration (Days)  [ 5 ]                      │
│                                              │
│  Instructions                               │
│  [ After Food                       ]       │
│                                              │
│  [Cancel]                     [Save Medicine] │
└─────────────────────────────────────────────┘
```

### 10.3 Medicine Card Display (Updated)

Each medicine card in the list should show:
- Medicine name
- Dose options as tags/badges (first one highlighted as default)
- Timing as: `1-0-1` format (morning-afternoon-evening counts)
- Duration: `5 days`
- Instructions badge if present

---

## 11. Print Template System

### 11.1 Print Template Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [FULL HEADER IMAGE]  OR  [LOGO] Dr. Name, Specialization   │
│                       Address, Phone, Reg No                 │
│  ──────────────────────────────────────────────────────────  │
│  PRESCRIPTION                    Date: 15 Jan 2025          │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  Patient: Rahul Sharma    Age: 32    Gender: Male           │
│  Blood Group: B+          Weight: 70 kg                     │
│                                                              │
│  C/O: Fever, Cold  (English from coDetailEn)                 │
│                                                              │
│  Vitals: BP 120/80 mmHg | Temp 98.6°F | Pulse 72 bpm       │
│                                                              │
│  Labels: Hemoglobin 12.5 g/dL | Blood Sugar 110 mg/dL      │
│                                                              │
│  ─── Rx ─────────────────────────────────────────────────   │
│  # │ Medicine     │ Dose  │ M │ A │ E │ Days │ Instr.      │
│  1 │ Paracetamol  │ 500mg │ 1 │ - │ 1 │  5   │ After Food  │
│  2 │ Azithromycin │ 500mg │ 1 │ - │ - │  3   │ —           │
│  3 │ Cetirizine   │ 10mg  │ - │ - │ 1 │  5   │ —           │
│                                                              │
│  ─── Diagnosis Tables ────────────────────────────────────  │
│  Table: Ultrasound Abdomen                                  │
│  ┌──────────────┬──────────┬──────────┐                     │
│  │ Parameter    │ Value    │ Unit     │                     │
│  │ Liver        │ Normal   │ —        │                     │
│  │ Gall Bladder │ Clear    │ —        │                     │
│  └──────────────┴──────────┴──────────┘                     │
│                                                              │
│  ─── Advice ──────────────────────────────────────────────  │
│  • Drink plenty of water                                     │
│  • Take rest for 3 days                                      │
│  • Steam inhalation 2x daily                                 │
│  • Warm water gargling                                       │
│                                                              │
│  Next Visit: 15 Feb 2025                                     │
│  ──────────────────────────────────────────────────────────  │
│  [FOOTER TEXT]                                               │
│                                        Dr. Signature        │
│  Computer-generated prescription. Generated at 10:30 AM      │
└─────────────────────────────────────────────────────────────┘

CONDITIONAL SECTIONS (controlled by POtherSetting):
- If isFullHeader=true → show fullHeader image, hide text header + logo
- If isFullHeader=false → show logo (if set) + header text + doctor info
- If showCoInPrint=false → hide C/O section
- If showNextVisit=false → hide next visit date
- If no tables → hide Diagnosis Tables section
- If no suggestions → hide Advice section
```

### 11.2 Print Component Updates

The existing `src/components/prescription/print-view.tsx` needs significant updates:
- Add full header image support
- Add C/O section (from coDetailEn of selected complaints)
- Add diagnosis tables rendering
- Add next visit date
- Add footer text
- Add showUnit logic for labels
- Use morning/afternoon/evening as numbers (show as `1-0-1` format)
- Show `-` when count is 0 instead of empty

---

## 12. API Endpoints

### 12.1 Prescription Stepper APIs

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/prescription/init` | Create new Draft prescription for a booking | Doctor/Assistant |
| GET | `/api/prescription/[id]` | Get full prescription with all relations | Doctor/Assistant |
| POST | `/api/prescription/[id]/complaints` | Save Step 1 — Chief Complaints | Assistant/Doctor |
| POST | `/api/prescription/[id]/vitals` | Save Step 2 — Vitals & Labels | Assistant/Doctor |
| POST | `/api/prescription/[id]/tables` | Save Step 3 — Diagnosis Tables | Doctor |
| POST | `/api/prescription/[id]/medicines` | Save Step 4 — Medicines | Doctor |
| POST | `/api/prescription/[id]/suggestions` | Save Step 5 — Suggestions | Doctor |
| POST | `/api/prescription/[id]/finalize` | Save Step 6 — Finalize & Print | Doctor |
| GET | `/api/prescription/[id]/print` | Get print-ready data with doctor info | Doctor |

### 12.2 Master Data APIs

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| GET/POST | `/api/dashboard/doctor/prescription-settings/categories` | Categories CRUD | Doctor |
| GET/POST | `/api/dashboard/doctor/prescription-settings/complaints` | Complaints CRUD | Doctor |
| GET/POST/PUT/DELETE | `/api/dashboard/doctor/prescription-settings/complaints/[id]` | Single complaint | Doctor |
| GET/POST | `/api/dashboard/doctor/prescription-settings/questions` | Questions CRUD | Doctor |
| GET/POST/PUT/DELETE | `/api/dashboard/doctor/prescription-settings/questions/[id]` | Single question | Doctor |
| GET/POST | `/api/dashboard/doctor/prescription-settings/suggestions` | Suggestions CRUD | Doctor |
| GET/POST/PUT/DELETE | `/api/dashboard/doctor/prescription-settings/suggestions/[id]` | Single suggestion | Doctor |
| GET/POST | `/api/dashboard/doctor/prescription-settings/labels` | Labels CRUD | Doctor |
| GET/POST/PUT/DELETE | `/api/dashboard/doctor/prescription-settings/labels/[id]` | Single label | Doctor |
| GET/POST | `/api/dashboard/doctor/prescription-settings/findings` | Findings CRUD | Doctor |
| GET/POST/PUT/DELETE | `/api/dashboard/doctor/prescription-settings/findings/[id]` | Single finding | Doctor |
| POST/DELETE | `/api/dashboard/doctor/prescription-settings/findings/[id]/medicines` | Link/unlink medicine to finding | Doctor |
| GET/POST | `/api/dashboard/doctor/prescription-settings/table-templates` | Table templates CRUD | Doctor |
| GET/POST/PUT/DELETE | `/api/dashboard/doctor/prescription-settings/table-templates/[id]` | Single template | Doctor |
| GET/PUT | `/api/dashboard/doctor/prescription-settings/print-settings` | Print settings (singleton) | Doctor |
| POST | `/api/dashboard/doctor/prescription-settings/print-settings/upload` | Upload header image/logo | Doctor |

### 12.3 Existing APIs to Update

| API | Change Required |
|-----|----------------|
| `GET/POST /api/dashboard/doctor/medicines` | Update dose field handling (JSON array), morning/afternoon/evening as Int |
| `PUT/DELETE /api/dashboard/doctor/medicines/[id]` | Same as above |
| `GET/POST /api/dashboard/doctor/prescriptions` | Add status filter, include complaints/tables in response |

### 12.4 Assistant APIs

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| GET | `/api/dashboard/assistant/prescription-queue` | Get pending appointments for prescription | Assistant |

---

## 13. File Structure & Routing

### 13.1 New Files

```
src/
├── app/
│   ├── api/
│   │   ├── prescription/
│   │   │   ├── init/route.ts                          # POST: Create draft Rx
│   │   │   └── [id] /
│   │   │       ├── route.ts                           # GET: Full Rx data
│   │   │       ├── complaints/route.ts                # POST: Save complaints
│   │   │       ├── vitals/route.ts                    # POST: Save vitals
│   │   │       ├── tables/route.ts                    # POST: Save tables
│   │   │       ├── medicines/route.ts                 # POST: Save medicines
│   │   │       ├── suggestions/route.ts               # POST: Save suggestions
│   │   │       ├── finalize/route.ts                  # POST: Finalize Rx
│   │   │       └── print/route.ts                     # GET: Print data
│   │   └── dashboard/
│   │       ├── doctor/
│   │       │   └── prescription-settings/
│   │       │       ├── categories/route.ts            # Categories CRUD
│   │       │       ├── complaints/route.ts            # Complaints CRUD
│   │       │       ├── complaints/[id]/route.ts       # Single complaint
│   │       │       ├── questions/route.ts             # Questions CRUD
│   │       │       ├── questions/[id]/route.ts        # Single question
│   │       │       ├── suggestions/route.ts           # Suggestions CRUD
│   │       │       ├── suggestions/[id]/route.ts      # Single suggestion
│   │       │       ├── labels/route.ts                # Labels CRUD
│   │       │       ├── labels/[id]/route.ts           # Single label
│   │       │       ├── findings/route.ts              # Findings CRUD
│   │       │       ├── findings/[id]/route.ts         # Single finding
│   │       │       ├── findings/[id]/medicines/route.ts # Link/unlink med
│   │       │       ├── table-templates/route.ts       # Table templates CRUD
│   │       │       ├── table-templates/[id]/route.ts  # Single template
│   │       │       ├── print-settings/route.ts       # Print settings GET/PUT
│   │       │       └── print-settings/upload/route.ts # Image upload
│   │       └── assistant/
│   │           └── prescription-queue/route.ts        # Assistant queue
│   └── dashboard/
│       ├── doctor/
│       │   ├── prescriptions/
│       │   │   ├── new/page.tsx                        # REWRITE: 6-step stepper wizard
│       │   │   └── [id]/page.tsx                       # UPDATE: Show stepper data
│       │   └── prescription-settings/
│       │       ├── layout.tsx                          # Shared layout with sub-nav
│       │       ├── categories/page.tsx                 # Categories master
│       │       ├── complaints/page.tsx                 # Complaints master
│       │       ├── questions/page.tsx                  # Questions master
│       │       ├── suggestions/page.tsx                # Suggestions master
│       │       ├── labels/page.tsx                     # Labels master
│       │       ├── findings/page.tsx                   # Findings master
│       │       ├── table-templates/page.tsx            # Table templates master
│       │       └── print-settings/page.tsx             # Print settings
│       └── assistant/
│           └── prescription-queue/page.tsx             # Assistant queue page
├── components/
│   └── prescription/
│       ├── print-view.tsx                              # UPDATE: Enhanced print template
│       ├── stepper/
│       │   ├── prescription-stepper.tsx                # Main stepper container
│       │   ├── step-indicator.tsx                      # Top step progress bar
│       │   ├── step-1-complaints.tsx                   # C/O selection step
│       │   ├── step-2-vitals.tsx                       # Vitals & labels step
│       │   ├── step-3-tables.tsx                       # Diagnosis tables step
│       │   ├── step-4-medicines.tsx                    # Medicines with findings
│       │   ├── step-5-suggestions.tsx                  # Suggestions step
│       │   └── step-6-finish.tsx                       # Finish & print step
│       ├── medicine-search.tsx                         # Medicine autocomplete/typeahead
│       ├── dose-tag-input.tsx                          # Tag input for dose options
│       ├── findings-selector.tsx                       # Findings dropdown + auto-fill
│       ├── table-builder.tsx                           # Dynamic table editor
│       ├── table-preview.tsx                           # Table preview (read-only)
│       └── vitals-form.tsx                             # Vitals input section
└── lib/
    └── prescription-store.ts                          # Zustand store for stepper state
```

### 13.2 Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add new models, modify existing models (see Section 3) |
| `src/lib/sidebar-config.ts` | Add Prescription Settings sub-menu, Assistant Queue |
| `src/app/api/dashboard/doctor/medicines/route.ts` | Update for dose=JSON, timing=Int |
| `src/app/api/dashboard/doctor/medicines/[id]/route.ts` | Same as above |
| `src/app/dashboard/doctor/medicines/page.tsx` | REWRITE: dose tag input, timing number inputs |
| `src/app/dashboard/doctor/prescriptions/new/page.tsx` | REWRITE: 6-step stepper wizard |
| `src/app/dashboard/doctor/prescriptions/[id]/page.tsx` | UPDATE: Show stepper data, add print with new template |
| `src/components/prescription/print-view.tsx` | UPDATE: Full template with all sections |

---

## 14. Sidebar Configuration

### 14.1 Doctor Sidebar (Updated)

```typescript
// In sidebar-config.ts, doctor section:
{
  label: 'Prescription Settings',
  href: '/dashboard/doctor/prescription-settings',
  icon: Settings,
  children: [
    { label: 'Categories', href: '/dashboard/doctor/prescription-settings/categories', icon: FolderOpen },
    { label: 'Complaints', href: '/dashboard/doctor/prescription-settings/complaints', icon: Thermometer },
    { label: 'Questions', href: '/dashboard/doctor/prescription-settings/questions', icon: HelpCircle },
    { label: 'Suggestions', href: '/dashboard/doctor/prescription-settings/suggestions', icon: Lightbulb },
    { label: 'Labels', href: '/dashboard/doctor/prescription-settings/labels', icon: Tag },
    { label: 'Findings', href: '/dashboard/doctor/prescription-settings/findings', icon: Search },
    { label: 'Table Templates', href: '/dashboard/doctor/prescription-settings/table-templates', icon: Table },
    { label: 'Print Settings', href: '/dashboard/doctor/prescription-settings/print-settings', icon: Printer },
  ]
}
```

### 14.2 Assistant Sidebar (Updated)

```typescript
// In sidebar-config.ts, assistant section — add:
{ label: 'Prescription Queue', href: '/dashboard/assistant/prescription-queue', icon: ClipboardList },
```

### 14.3 Sidebar Infrastructure Change

The current `SidebarItem` interface is flat. For the collapsible sub-menu, we need:

```typescript
export interface SidebarItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string | number
  children?: SidebarItem[]  // NEW: for collapsible sub-menus
}
```

The sidebar component needs to support expanding/collapsing parent items with children.

---

## 15. Component Architecture

### 15.1 Prescription Stepper (Main Component)

```
PrescriptionStepper (prescription-stepper.tsx)
├── StepIndicator (step-indicator.tsx)
│     └── Shows 6 steps with current/complete/pending states
├── Step1Complaints (step-1-complaints.tsx)
│     └── Fetches CoMaster grouped by CategoryMaster
│     └── Multi-select with search
├── Step2Vitals (step-2-vitals.tsx)
│     └── VitalsForm component (weight, BP, temp, pulse, SpO2)
│     └── Dynamic label inputs from LabelMaster
├── Step3Tables (step-3-tables.tsx)
│     └── TableBuilder component (editable table)
│     └── Template selector dropdown
│     └── TablePreview (read-only preview)
├── Step4Medicines (step-4-medicines.tsx)
│     └── FindingsSelector (dropdown + auto-fill trigger)
│     └── MedicineSearch (autocomplete for manual add)
│     └── DoseTagInput (for each medicine's dose field)
│     └── Medicine row with timing number inputs
├── Step5Suggestions (step-5-suggestions.tsx)
│     └── Auto-populated from selected complaints
│     └── Custom suggestion input
└── Step6Finish (step-6-finish.tsx)
      └── Summary of all data
      └── Next visit date picker
      └── Save & Print button
```

### 15.2 Shared Components

| Component | Purpose | Used In |
|-----------|---------|---------|
| `MedicineSearch` | Typeahead/autocomplete for medicine name | Step 4, Findings page |
| `DoseTagInput` | Tag input for adding multiple dose options | Medicine Master, Step 4 |
| `FindingsSelector` | Dropdown to select finding + auto-fill | Step 4 |
| `TableBuilder` | Dynamic editable table (add/remove rows/cols, edit cells) | Step 3, Table Templates page |
| `TablePreview` | Read-only table display | Step 3 preview, Print template |
| `VitalsForm` | Common vitals input section | Step 2 |
| `LanguageFieldPair` | Two-field input (local + English) | All master pages |

---

## 16. State Management

### 16.1 Zustand Store for Stepper

```typescript
// src/lib/prescription-store.ts

interface PrescriptionStore {
  // Navigation
  currentStep: number
  setCurrentStep: (step: number) => void
  goToNext: () => void
  goToPrev: () => void

  // Prescription ID (created on init)
  prescriptionId: string | null
  setPrescriptionId: (id: string) => void

  // Booking info (passed as prop or from URL)
  bookingId: string
  setBookingId: (id: string) => void

  // Step 1: Complaints
  selectedComplaintIds: string[]
  setSelectedComplaintIds: (ids: string[]) => void
  toggleComplaint: (id: string) => void

  // Step 2: Vitals
  vitals: { weight: string; bp: string; temperature: string; pulse: string; spo2: string }
  setVitals: (vitals: Partial<Vitals>) => void
  labelValues: { labelId: string; value: string }[]
  setLabelValue: (labelId: string, value: string) => void

  // Step 3: Tables
  tables: TableData[]
  setTables: (tables: TableData[]) => void
  addTable: (table: TableData) => void
  removeTable: (index: number) => void
  updateTable: (index: number, table: TableData) => void

  // Step 4: Medicines
  medicines: MedicineRow[]
  setMedicines: (medicines: MedicineRow[]) => void
  addMedicine: (medicine: MedicineRow) => void
  removeMedicine: (index: number) => void
  updateMedicine: (index: number, medicine: Partial<MedicineRow>) => void
  autoFillFromFinding: (findingId: string, medicines: MedicineRow[]) => void

  // Step 5: Suggestions
  selectedSuggestionIds: string[]
  setSelectedSuggestionIds: (ids: string[]) => void
  toggleSuggestion: (id: string) => void
  customSuggestions: { question: string; suggestions: string }[]
  addCustomSuggestion: (s: { question: string; suggestions: string }) => void

  // Step 6
  nextVisit: Date | null
  setNextVisit: (date: Date | null) => void

  // Loading states
  isSaving: boolean
  setIsSaving: (saving: boolean) => void

  // Reset
  reset: () => void
}
```

### 16.2 Data Flow

```
1. Component mounts → Read prescriptionId from URL or create new via /api/prescription/init
2. Load existing data from /api/prescription/[id] → populate store
3. User interacts with step components → store updates
4. "Save & Continue" → POST to step-specific API → store persists
5. "Save & Print" (Step 6) → POST /api/prescription/[id]/finalize → open print preview
```

---

## 17. Development Phases & Order

### Phase 1: Database Foundation
> **Priority: CRITICAL** — Everything depends on this.

| # | Task | File | Details |
|---|------|------|---------|
| 1.1 | Update Prisma schema | `prisma/schema.prisma` | All model changes from Section 3 + new models from Section 3.2 |
| 1.2 | Run DB migration | CLI | `bun run db:push` |
| 1.3 | Update Doctor model relations | `prisma/schema.prisma` | Add categories, findings, tableTemplates relations |

**Deliverable:** Schema updated, DB migrated, Prisma client regenerated.

---

### Phase 2: Sidebar Infrastructure
> **Priority: HIGH** — Navigation to new pages.

| # | Task | File | Details |
|---|------|------|---------|
| 2.1 | Update SidebarItem type | `src/lib/sidebar-config.ts` | Add `children?: SidebarItem[]` |
| 2.2 | Update sidebar component | Sidebar rendering component | Support collapsible sub-menus |
| 2.3 | Add doctor prescription settings entries | `src/lib/sidebar-config.ts` | 8 sub-items under Prescription Settings |
| 2.4 | Add assistant queue entry | `src/lib/sidebar-config.ts` | Prescription Queue for assistant role |
| 2.5 | Create prescription settings layout | `src/app/dashboard/doctor/prescription-settings/layout.tsx` | Shared layout with sub-navigation tabs |

**Deliverable:** Sidebar shows new menu items, sub-pages are navigable.

---

### Phase 3: Medicine Master Update
> **Priority: HIGH** — Findings system depends on medicines being correct.

| # | Task | File | Details |
|---|------|------|---------|
| 3.1 | Update medicines API | `src/app/api/dashboard/doctor/medicines/route.ts` | dose=JSON, timing=Int |
| 3.2 | Update medicine [id] API | `src/app/api/dashboard/doctor/medicines/[id]/route.ts` | Same changes |
| 3.3 | Create DoseTagInput component | `src/components/prescription/dose-tag-input.tsx` | Tag input for dose options |
| 3.4 | Rewrite medicines page | `src/app/dashboard/doctor/medicines/page.tsx` | New form with tag input, number inputs for timing |

**Deliverable:** Medicine master fully updated with new field types.

---

### Phase 4: Master Data Pages (Prescription Settings)
> **Priority: HIGH** — Required before stepper can work.

| # | Task | File | Details |
|---|------|------|---------|
| 4.1 | Categories page + API | Pages + API | CRUD for CategoryMaster |
| 4.2 | Complaints page + API | Pages + API | CRUD for CoMaster with category link |
| 4.3 | Questions page + API | Pages + API | CRUD for QuestionsMaster with complaint link |
| 4.4 | Suggestions page + API | Pages + API | CRUD for SuggestionsMaster with question link |
| 4.5 | Labels page + API | Pages + API | CRUD for LabelMaster with unit + showUnit |
| 4.6 | Findings page + API | Pages + API | CRUD for FindingsMaster + medicine linking |
| 4.7 | Table Templates page + API | Pages + API | CRUD with visual table builder + preview |
| 4.8 | Print Settings page + API | Pages + API | Singleton edit with image upload |

**NOTE:** Tasks 4.1-4.8 can be parallelized — they are independent of each other.

**Deliverable:** All 8 master pages functional with CRUD operations.

---

### Phase 5: Prescription Stepper Core
> **Priority: CRITICAL** — This is the main feature.

| # | Task | File | Details |
|---|------|------|---------|
| 5.1 | Create Zustand store | `src/lib/prescription-store.ts` | Full stepper state management |
| 5.2 | Create StepIndicator component | `src/components/prescription/stepper/step-indicator.tsx` | 6-step progress bar |
| 5.3 | Create PrescriptionStepper container | `src/components/prescription/stepper/prescription-stepper.tsx` | Main stepper with step switching |
| 5.4 | Create Prescription Init API | `src/app/api/prescription/init/route.ts` | Create draft prescription |
| 5.5 | Create Prescription Get API | `src/app/api/prescription/[id]/route.ts` | Load full prescription data |
| 5.6 | Rewrite prescriptions/new/page.tsx | `src/app/dashboard/doctor/prescriptions/new/page.tsx` | Full 6-step stepper wizard |

**Deliverable:** Stepper skeleton working with step navigation.

---

### Phase 6: Stepper Steps Implementation
> **Priority: CRITICAL** — Building each step's functionality.

| # | Task | File | Details |
|---|------|------|---------|
| 6.1 | Step 1: Complaints | `step-1-complaints.tsx` + API | Multi-select from CoMaster grouped by Category |
| 6.2 | Step 2: Vitals | `step-2-vitals.tsx` + API + `vitals-form.tsx` | Common vitals + dynamic labels |
| 6.3 | Step 3: Tables | `step-3-tables.tsx` + API + `table-builder.tsx` | Table templates + ad-hoc tables |
| 6.4 | Step 4: Medicines | `step-4-medicines.tsx` + API + `findings-selector.tsx` + `medicine-search.tsx` | Findings auto-fill + manual add |
| 6.5 | Step 5: Suggestions | `step-5-suggestions.tsx` + API | Auto-populated from complaints |
| 6.6 | Step 6: Finish | `step-6-finish.tsx` + API | Summary + next visit + finalize |

**Deliverable:** All 6 steps fully functional with API persistence.

---

### Phase 7: Print Template
> **Priority: HIGH** — Doctor needs to print prescriptions.

| # | Task | File | Details |
|---|------|------|---------|
| 7.1 | Update print-view component | `src/components/prescription/print-view.tsx` | Full template with all sections |
| 7.2 | Print data API | `src/app/api/prescription/[id]/print/route.ts` | Aggregate print data with doctor info + settings |
| 7.3 | Table rendering in print | Print component | Render PDignoTable data as HTML tables |
| 7.4 | C/O section in print | Print component | Show complaints from coDetailEn |
| 7.5 | Full header image support | Print component | Conditional rendering based on isFullHeader |
| 7.6 | Label unit logic | Print component | showUnit boolean controls unit display |

**Deliverable:** Professional print output matching legacy system.

---

### Phase 8: Assistant Workflow
> **Priority: MEDIUM** — Enables assistant to pre-fill Steps 1-2.

| # | Task | File | Details |
|---|------|------|---------|
| 8.1 | Assistant queue API | `src/app/api/dashboard/assistant/prescription-queue/route.ts` | Get pending appointments |
| 8.2 | Assistant queue page | `src/app/dashboard/assistant/prescription-queue/page.tsx` | List of pending prescriptions |
| 8.3 | Role-based step access | Stepper component | Assistant sees only Steps 1-2, Doctor sees 3-6 |
| 8.4 | Prescription detail updates | `src/app/dashboard/doctor/prescriptions/[id]/page.tsx` | Show full stepper data |

**Deliverable:** Full assistant workflow functional.

---

### Phase 9: Polish & Edge Cases
> **Priority: MEDIUM** — Production readiness.

| # | Task | Details |
|---|------|---------|
| 9.1 | Data migration script | Migrate existing prescriptions' morning/afternoon/evening from boolean to Int |
| 9.2 | Data migration script | Migrate existing DoctorMedicine dose from string to JSON array |
| 9.3 | Empty state handling | All steps show proper empty states with helpful messages |
| 9.4 | Loading skeletons | Each step has loading skeleton while data fetches |
| 9.5 | Error handling | API errors show toast, step data preserved on error |
| 9.6 | Responsive design | Stepper works on mobile (steps as icons, tables scrollable) |
| 9.7 | Keyboard shortcuts | Tab navigation between fields, Enter to save & continue |

**Deliverable:** Production-ready prescription system.

---

## 18. Migration Strategy for Existing Data

### 18.1 Morning/Afternoon/Evening: Boolean → Int

```sql
-- Migrate PMedicine
UPDATE "PMedicine" SET "morning" = CASE WHEN "morning" = true THEN 1 ELSE 0 END;
UPDATE "PMedicine" SET "afternoon" = CASE WHEN "afternoon" = true THEN 1 ELSE 0 END;
UPDATE "PMedicine" SET "evening" = CASE WHEN "evening" = true THEN 1 ELSE 0 END;

-- Migrate DoctorMedicine (was String type, values like "after food" or empty)
-- This is trickier — need to set reasonable defaults
UPDATE "DoctorMedicine" SET "morning" = 1 WHERE "morning" != '';
UPDATE "DoctorMedicine" SET "afternoon" = 1 WHERE "afternoon" != '';
UPDATE "DoctorMedicine" SET "evening" = 1 WHERE "evening" != '';
UPDATE "DoctorMedicine" SET "morning" = 0 WHERE "morning" = '';
UPDATE "DoctorMedicine" SET "afternoon" = 0 WHERE "afternoon" = '';
UPDATE "DoctorMedicine" SET "evening" = 0 WHERE "evening" = '';
```

### 18.2 DoctorMedicine Dose: String → JSON Array

```sql
-- Wrap existing dose string into a JSON array
UPDATE "DoctorMedicine" 
SET "dose" = '[' || '"' || REPLACE("dose", '"', '\"') || '"]' 
WHERE "dose" != '' AND "dose" != '[]';

-- Set empty to empty array
UPDATE "DoctorMedicine" SET "dose" = '[]' WHERE "dose" = '' OR "dose" IS NULL;
```

### 18.3 New Fields with Defaults

All new fields have default values (`@default("")`, `@default(0)`, `@default(false)`), so existing rows will migrate cleanly with `db:push`.

---

## 19. Edge Cases & Gotchas

### 19.1 Critical

| # | Edge Case | Handling |
|---|-----------|----------|
| E1 | **Duplicate medicines from multiple findings** | When auto-filling from 2nd finding, skip medicines already in the list (match by `medicineId` from DoctorMedicine) |
| E2 | **Complaint deleted after being used in Rx** | Never hard-delete master data. Use soft delete (status=Inactive). PCo records keep the `coId` reference — snapshot the text at Rx creation time |
| E3 | **DoctorMedicine dose array empty** | If dose array is `[]`, show a plain text input instead of dropdown in Step 4 |
| E4 | **Prescription init when draft already exists** | Check for existing Draft prescription for the bookingId. If found, load it instead of creating new |
| E5 | **Concurrent editing** | Assistant and Doctor shouldn't edit same prescription simultaneously. Lock prescription when doctor opens it (or at minimum, show warning) |
| E6 | **Print with no data** | Each section in print is conditional — only shown if data exists |
| E7 | **Category deleted but complaints exist** | Complaints can exist without a category (categoryId nullable). Show them under "Uncategorized" in stepper |

### 19.2 UX

| # | Edge Case | Handling |
|---|-----------|----------|
| E8 | **Mobile stepper** | On mobile, step indicator shows icons only (numbers). Step content is full-width scrollable |
| E9 | **Large findings list** | Findings dropdown should be searchable (typeahead) |
| E10 | **Many complaints** | Step 1 complaints should be searchable and grouped with collapsible categories |
| E11 | **Table with many rows/cols** | Tables should be horizontally scrollable on mobile |
| E12 | **Medicine name not found in master** | Allow free-text medicine name in Step 4 (not all medicines need to be in master) |

---

## 20. Quick Reference: Before vs After

### Database Models

| Model | Before | After |
|-------|--------|-------|
| CategoryMaster | ❌ Doesn't exist | ✅ New — groups complaints |
| FindingsMaster | ❌ Doesn't exist | ✅ New — auto-fill medicines |
| FindingsMedicine | ❌ Doesn't exist | ✅ New — join table |
| TableTemplateMaster | ❌ Doesn't exist | ✅ New — reusable table layouts |
| CoMaster | Missing `coDetailEn`, `categoryId` | ✅ Added dual-language + category link |
| LabelMaster | Missing `labelEn`, `unit`, `showUnit` | ✅ Added dual-language + unit config |
| QuestionsMaster | Missing `questionEn`, `coId` | ✅ Added dual-language + complaint link |
| SuggestionsMaster | Missing `suggestionsEn` | ✅ Added dual-language |
| DoctorMedicine | `dose`=String, timing=String | ✅ `dose`=JSON array, timing=Int |
| PMedicine | timing=Boolean | ✅ timing=Int (tablet count) |
| PLabel | Missing `labelEn`, `showUnit` | ✅ Added |
| PSuggestion | Missing `questionEn`, `suggestionsEn` | ✅ Added dual-language |
| Prescription | Missing `status`, `nextVisit`, `assistantId` | ✅ Added |
| PDignoTable | Missing `templateId` | ✅ Added template link |
| POtherSetting | Missing `footer`, `showCoInPrint`, etc. | ✅ Added print controls |

### UI Pages

| Page | Before | After |
|------|--------|-------|
| Prescription New | Flat form | 6-step stepper wizard |
| Medicine Master | String dose, text timing | Tag input dose, number timing |
| Categories | ❌ Missing | ✅ CRUD page |
| Complaints (C/O) | ❌ Missing | ✅ CRUD page with category link |
| Questions | ❌ Missing | ✅ CRUD page with complaint link |
| Suggestions | ❌ Missing | ✅ CRUD page with question link |
| Labels | ❌ Missing | ✅ CRUD page with unit + showUnit |
| Findings | ❌ Missing | ✅ CRUD page with medicine linking |
| Table Templates | ❌ Missing | ✅ CRUD page with visual builder |
| Print Settings | ❌ Missing | ✅ Singleton edit page with image upload |
| Assistant Queue | ❌ Missing | ✅ Pending prescriptions list |
| Print Template | Basic, missing sections | ✅ Full template with all sections |

### API Endpoints

| Count | Description |
|-------|-------------|
| 9 new | Prescription stepper APIs (init, get, 6 steps, finalize, print) |
| ~16 new | Master data CRUD APIs (8 pages × ~2 routes each) |
| 3 updated | Existing medicines + prescriptions APIs |
| 1 new | Assistant queue API |
| **~29 total** | New + updated API endpoints |

---

## Appendix A: Development Effort Estimate

| Phase | Effort | Parallelizable? |
|-------|--------|-----------------|
| Phase 1: DB Foundation | Small | No (blocking) |
| Phase 2: Sidebar | Small | No (needed for navigation) |
| Phase 3: Medicine Master Update | Medium | Partially (with Phase 4) |
| Phase 4: Master Data Pages (8 pages) | Large | ✅ YES — all 8 pages independent |
| Phase 5: Stepper Core | Medium | No (needed before Phase 6) |
| Phase 6: Step Implementation (6 steps) | Large | Partially (Steps 1-2 vs 3-6) |
| Phase 7: Print Template | Medium | Can start after Phase 6.4 |
| Phase 8: Assistant Workflow | Medium | After Phase 6 |
| Phase 9: Polish | Medium | After all phases |

**Critical Path:** Phase 1 → Phase 2 → Phase 3 → Phase 5 → Phase 6 → Phase 7 → Phase 8

**Maximum Parallelism:** Phase 4 (8 master pages) can be done in parallel with Phase 3, and can start as soon as Phase 1 is complete.

---

## Appendix B: File Count Summary

| Category | New Files | Modified Files |
|----------|-----------|----------------|
| Prisma Schema | 0 | 1 |
| API Routes | ~25 | ~3 |
| Page Components | ~10 | ~3 |
| Shared Components | ~10 | 1 (print-view) |
| Store | 1 | 0 |
| Sidebar Config | 0 | 2 |
| **Total** | **~46** | **~10** |

---

*End of Architecture Plan. Awaiting approval before development begins.*
