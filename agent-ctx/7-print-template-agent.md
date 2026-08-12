# Task 7 - Print Template Agent

## Work Record

### Files Created
1. `src/app/api/prescription/[id]/print/route.ts` - Print data API endpoint

### Files Modified
1. `src/components/prescription/print-view.tsx` - Full rewrite of print template
2. `src/app/dashboard/doctor/prescriptions/[id]/page.tsx` - Updated to use new print API
3. `src/app/dashboard/patient/appointments/[id]/page.tsx` - Updated to use new print API

## Summary

### Print Data API (`/api/prescription/[id]/print`)
- GET endpoint with multi-role authorization (doctor, patient=owner, admin)
- Loads prescription with ALL relations: booking, doctor+user, chiefComplaints, labels, medicines, suggestions, diagnosisTables
- Separate CoMaster lookup via findMany (since PCo has no direct relation to CoMaster in schema)
- Loads POtherSetting for print settings
- Returns structured data: patient, doctor, settings, complaints, vitals, labels, medicines, tables, suggestions, nextVisit, createdAt
- Medicines: dose parsed from JSON array (first item as selectedDose), morning/afternoon/evening as Int
- Labels: conditional unit display (showUnit boolean)
- Diagnosis tables: JSON parsing for headerLabel, colsLabel, footerLabel arrays
- Suggestions: dual-language (questionEn, suggestionsEn)

### Print View Template (full rewrite)
- New `PrintData` interface with nested patient/doctor/settings objects
- Backward-compat type alias: `PrescriptionPrintData = PrintData`
- **Header**: Conditional full header image vs logo+text mode (controlled by `isFullHeader`)
- **Patient Info**: Grid with name, age, gender, bloodGroup
- **C/O Section** (new): Shows English complaints (`coDetailEn` falls back to `coDetail`), controlled by `showCoInPrint`
- **Vitals**: Weight/BP/Temp/Pulse/SpO2 badges
- **Labels**: Conditional unit display (`showUnit` toggle)
- **Medicines Table**: # | Medicine | Dose | M | A | E | Days | Instructions format, numbers with "-" for 0
- **Diagnosis Tables** (new): Renders HTML tables with headerLabel as columns, colsLabel as rows, footerLabel as footer, extraLabel as title
- **Suggestions**: English versions preferred (suggestionsEn falls back to suggestions)
- **Next Visit** (new): Controlled by `showNextVisit`, shows formatted date
- **Footer** (new): Shows footer text from settings above signature
- **Signature**: Maintained existing style
- All inline styles (no Tailwind) for print compatibility
- A4 width (210mm), same font stack
- Print-only CSS (@media print rules) preserved
- Auto-print on mount (150ms delay)
- AnimatePresence animation preserved

### Consumers Updated
- Doctor prescription detail page: Replaced manual `getPrintData()` with `useQuery` fetch from `/api/prescription/[id]/print`
- Patient appointment detail page: Replaced `buildPrintData()` with `useQuery` fetch from same endpoint
