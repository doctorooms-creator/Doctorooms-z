# 🩺 STAFF NURSE ROLE — Comprehensive Architecture Plan
# IPD Hospital Management System
# Doctor's Perspective — Real Hospital Workflow

---

## 📌 WHY NURSE IS THE MOST CRITICAL ROLE

Bhai, doctor ki nazar se samjho:

- **Doctor** hospital mein 10-15 minute aata hai round pe — patient dekhta hai, notes likhta hai, order deta hai, chala jaata hai
- **Nurse** 24/7 rehti hai — **WOHI HAI JO ACTUALLY ILLAJ KARTI HAI**
- Doctor ne likha "Inj. Enoxaparin 60mg SC BD" — par **inject kaun dega?** → Nurse
- Doctor ne likha "Monitor BP hourly" — par **BP kaun measure karega?** → Nurse
- Patient raat 3 baje chillane laga — **kaun pehle pohochega?** → Nurse
- Patient ka urine output kam ho gaya — **kaun notice karega?** → Nurse (monitoring chart dekh ke)

**Nurse is the eyes and hands of the doctor 24/7.** Ye role bilkul alag level ka hai.

---

## 🏗️ NURSE ROLE IN HOSPITAL STRUCTURE

```
Hospital
  ├── Ward 1: General Ward (10 beds)
  │     ├── Nurse A (Morning 7AM-2PM) → Patients: Bed 1,2,3,4,5
  │     ├── Nurse B (Morning 7AM-2PM) → Patients: Bed 6,7,8,9,10
  │     ├── Nurse C (Evening 2PM-9PM)  → Patients: Bed 1,2,3,4,5
  │     └── Nurse D (Evening 2PM-9PM)  → Patients: Bed 6,7,8,9,10
  │
  ├── Ward 2: Private Ward (6 beds)
  │     ├── Nurse E (Morning) → Patients: Bed 1,2,3
  │     └── Nurse F (Morning) → Patients: Bed 4,5,6
  │
  ├── Ward 3: ICU (4 beds)
  │     ├── Nurse G (Morning) → Patient: Bed 1 ONLY (ICU = 1:1 or 1:2 ratio)
  │     ├── Nurse H (Morning) → Patient: Bed 2,3
  │     └── Nurse I (Morning) → Patient: Bed 4
  │
  └── Nursing Incharge (Head Nurse — manages all wards, assigns nurses)
```

### Key Concepts:
1. **Nurse-to-Patient Ratio:** ICU mein 1 nurse per 1-2 patient. General ward mein 1 nurse per 5-8 patients
2. **Shift System:** 3 shifts — Morning (7AM-2PM), Evening (2PM-9PM), Night (9PM-7AM)
3. **Shift Handover:** Jab nurse ki shift khatam hoti hai, usko next shift nurse ko POORA update dena padta hai
4. **Ward-based Assignment:** Nurse ek specific ward mein assigned hoti hai, us ward ke hi patients sambhalti hai
5. **Nursing Incharge:** Head nurse jo sab nurses manage karti hai, bed allocation karti hai

---

## 📋 NURSE'S COMPLETE WORKFLOW (Doctor's Explanation)

### Scenario: Raju (Heart Attack) admitted in ICU Bed 3

```
SHIFT START (7:00 AM) — Nurse Priya logs in
  ↓
① VIEW SHIFT HANDOVER (from Night Shift Nurse)
   "Bed 3 Raju — BP was 100/60 at 6AM, I gave 500ml NS bolus, 
    Urine output improved from 50ml to 150ml/hr. Doctor aware. 
    Next Enoxaparin due at 8AM."
  ↓
② VIEW MY PATIENTS LIST
   Bed 1: Suresh (Post-Op Appendectomy) — Stable
   Bed 2: Meena (Pneumonia) — On Oxygen 4L
   Bed 3: Raju (Heart Attack) — CRITICAL ⚠️
  ↓
③ CHECK PENDING MEDICINES (8:00 AM)
   Raju ke liye due:
   ✅ Tab. Metformin 500mg — Oral — Given at 8:05 AM
   ✅ Inj. Enoxaparin 60mg — SC — Given at 8:10 AM
   ✅ Tab. Aspirin 75mg — Oral — Given at 8:05 AM
   ❌ Inj. Pantoprazole 40mg — IV — Pharmacy se medicine nahi aayi → Notified
  ↓
④ RECORD VITALS (8:00 AM — Every Hour)
   Raju:
   Temp: 98.4°F | Pulse: 82 | SpO2: 97% | BP: 112/74 | RR: 18
   Input: 250ml (IV NS) | Urine: 120ml | Remarks: "Pain reduced, comfortable"
  ↓
⑤ SAMPLE COLLECTION (9:00 AM)
   Doctor ne order kiya: CBC, KFT, LFT, RBS
   Nurse Priya sample collect karti hai → Lab bhejti hai
   ✅ Blood sample collected at 9:15 AM, sent to lab
  ↓
⑥ RECORD VITALS (9:00 AM)
   Temp: 98.6°F | Pulse: 80 | SpO2: 98% | BP: 118/76 | RR: 18
   Input: 200ml (Oral water) | Urine: 100ml | Remarks: "Stable"
  ↓
⑦ DOCTOR ROUNDS (10:00 AM)
   Dr. Patel aate hain:
   Nurse Priya presents: "Sir, Raju — BP stable 112-118/74-76, 
   pain significantly reduced, urine output adequate 100-120ml/hr.
   Blood sample sent at 9:15, reports pending."
   Dr. Patel: "Good. Continue same. Stop ECG monitoring if stable by evening. 
   Add Tab. Atorvastatin 40mg HS."
   Nurse Priya updates order sheet with new medicine
  ↓
⑧ HOURLY VITALS CONTINUE (10AM, 11AM, 12PM, 1PM...)
   Every hour: Temp, Pulse, BP, SpO2, RR, Input, Urine, Remarks
  ↓
⑨ PENDING MEDICINES (2:00 PM)
   Inj. Enoxaparin 60mg — SC — Given at 2:00 PM
   Tab. Metformin 500mg — Oral — Given at 2:05 PM
  ↓
⑩ SHIFT HANDOVER (2:00 PM — Before leaving)
   Nurse Priya writes:
   "Bed 3 Raju — Stable since morning. BP range 110-120/72-78.
   Pain free. Urine output adequate. Reports: CBC normal, 
   KFT pending, LFT pending. New order: Atorvastatin 40mg HS (not yet given, 
   due tonight). Doctor satisfied with progress."
   ↓
   Nurse Sunita (Evening shift) reads this and takes over
```

---

## 🗄️ DATABASE SCHEMA CHANGES

### New Models Required:

```prisma
// ============ WARD (ICU, General, Private, Semi-Private, etc.) ============

model Ward {
  id          String   @id @default(cuid())
  hospitalId  String
  name        String   @default("")         // "ICU", "General Ward", "Private Room", "Semi-Private", "Post-Op"
  nameHi      String   @default("")         // Hindi name
  wardType    String   @default("General")   // ICU, General, Private, SemiPrivate, PostOp, Emergency, Maternity
  floorNo     String   @default("")         // "Ground Floor", "Floor 1", "Floor 2"
  totalBeds   Int      @default(0)           // Total bed capacity
  occupiedBeds Int     @default(0)           // Currently occupied (denormalized for speed, updated via trigger/logic)
  nurseRatio  Int      @default(6)           // Patients per nurse in this ward (ICU=2, General=6, Private=4)
  status      String   @default("Active")    // Active, Inactive, Maintenance
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  hospital    Hospital  @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  beds        Bed[]
  nurses      StaffNurse[]
  admissions  IpdAdmission[]
}

// ============ BED ============

model Bed {
  id          String   @id @default(cuid())
  wardId      String
  bedNumber   String   @default("")         // "Bed 1", "Bed 2", "ICU-1", "PR-201"
  bedType     String   @default("General")   // General, SemiPrivate, Private, ICU_Ventilator, ICU_NonVentilator, Suite
  dailyRate   Float    @default(0)           // Room rent per day
  status      String   @default("Available") // Available, Occupied, Reserved, Maintenance, Blocked
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  ward        Ward         @relation(fields: [wardId], references: [id], onDelete: Cascade)
  admission   IpdAdmission?
}

// ============ STAFF NURSE (New Role) ============

model StaffNurse {
  id            String   @id @default(cuid())
  userId        String   @unique              // nurse user id (User.role = "nurse")
  hospitalId    String                        // hospital id — required
  wardId        String?                       // assigned ward (null = floating/roaming nurse)
  employeeId    String   @default("")         // Hospital employee ID e.g. "NUR-001"
  qualification String   @default("")         // GNM, BSc Nursing, ANM
  designation   String   @default("Staff Nurse") // Staff Nurse, Sister, Nursing Incharge, Head Nurse
  shift         String   @default("Morning")   // Morning (7AM-2PM), Evening (2PM-9PM), Night (9PM-7AM), Rotating
  phoneNo       String   @default("")
  address       String   @default("")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation("NurseUser", fields: [userId], references: [id], onDelete: Cascade)
  hospital      Hospital @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  ward          Ward?    @relation(fields: [wardId], references: [id], onDelete: SetNull)
  vitalRecords  VitalRecord[]
  medicineAdministrations MedicineAdministration[]
  sampleCollections  SampleCollection[]
  shiftHandoversFrom  ShiftHandover[] @relation("HandoverFrom")
  shiftHandoversTo    ShiftHandover[] @relation("HandoverTo")
  patientAssignments   NursePatientAssignment[]
}

// ============ NURSE-PATIENT ASSIGNMENT ============
// Ye track karta hai ki kaunsi nurse kaunse patient ko sambhal rahi hai
// Har shift change pe naya assignment banta hai

model NursePatientAssignment {
  id            String   @id @default(cuid())
  nurseId       String                       // StaffNurse.id
  admissionId   String                       // IpdAdmission.id
  bedId         String                       // Bed.id — kis bed pe patient hai
  shiftDate     DateTime                      // Kis din ka shift hai
  shiftType     String   @default("Morning") // Morning, Evening, Night
  assignedAt    DateTime @default(now())      // Kab assign kiya
  assignedBy    String?                       // Nursing Incharge ya system ne assign kiya (User.id)
  unassignedAt  DateTime?                     // Jab assignment khatam hua (shift end ya discharge)
  status        String   @default("Active")  // Active, Completed, Transferred
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  nurse         StaffNurse   @relation(fields: [nurseId], references: [id], onDelete: Cascade)
  admission     IpdAdmission @relation(fields: [admissionId], references: [id], onDelete: Cascade)
  bed           Bed          @relation(fields: [bedId], references: [id])
}

// ============ IPD ADMISSION (The Core — Separate from OPD Booking) ============
// OPD Booking = OPD visit (patient aata hai, dekh ke jaata hai)
// IPD Admission = Patient ko bed pe admit karna (rehta hai hospital mein)

model IpdAdmission {
  id                  String    @id @default(cuid())
  admissionNo         String    @unique @default("")  // e.g. "IPD-2026-001847" — hospital unique
  hospitalId          String                              // Hospital.id
  wardId              String                              // Ward.id
  bedId               String                              // Bed.id
  departmentId        String                              // Department.id
  attendingDoctorId   String                              // Doctor.id — primary doctor
  referringDoctorId   String?                             // Doctor.id — kisne refer/admit kiya
  userId              String?                             // Patient User.id (null for walk-in IPD)
  
  // --- Patient Demographics (Admission Sheet - Form 1) ---
  patientName         String    @default("")
  patientAge          Int       @default(0)
  patientGender       String    @default("")
  patientDob          DateTime?
  bloodGroup          String    @default("")
  maritalStatus       String    @default("")
  occupation          String    @default("")
  education           String    @default("")
  religion            String    @default("")
  aadharNo            String    @default("")
  mobileNo            String    @default("")
  idMarks             String    @default("")        // Birth marks, scars
  fatherName          String    @default("")
  motherName          String    @default("")
  husbandWifeName     String    @default("")
  contactPersonName   String    @default("")
  contactPersonMobile String    @default("")
  contactPersonRelation String   @default("")
  address             String    @default("")
  village             String    @default("")
  taluka              String    @default("")
  district            String    @default("")
  state               String    @default("")
  pinCode             String    @default("")
  
  // --- Medical Info (Admission Sheet continued) ---
  mlcCase             Boolean   @default(false)       // Medico-Legal Case
  previousHospitalization String  @default("")     // Previous hospitalization details
  mediClaimDetails    String    @default("")        // Insurance/policy details
  initialDiagnosis    String    @default("")        // Admission time diagnosis
  opdBookingId        String?                        // If admitted from OPD (Booking.id link)
  
  // --- History Sheet Data (Form 2 — Doctor fills) ---
  chiefComplaints     String    @default("")        // Doctor ne kya likha
  informant           String    @default("")        // Patient self / Relative
  pastHistory         String    @default("")        // Previous illnesses, surgeries
  personalHistory     String    @default("{}")        // JSON: {diabetes:false, hypertension:false, asthma:false, thyroid:false}
  habits              String    @default("{}")        // JSON: {alcohol:false, smoking:false, tobacco:false, allergy:""}
  femaleHistory       String    @default("{}")        // JSON: {lmp:"", gravida:0, para:0, living:0, abortion:0}
  drugHistory         String    @default("")        // Current medications
  
  // --- Physical Examination (Form 6 — Doctor fills) ---
  consciousnessLevel   String   @default("Conscious") // Conscious, Semiconscious, Unconscious
  obeyingCommands      Boolean  @default(true)
  respondingToDPS     Boolean  @default(true)
  oriented            Boolean  @default(true)
  speech              String   @default("Normal")    // Normal, Aphasia, Slurred
  examinationNotes    String   @default("")        // RS, CVS, P/A, CNS findings
  generalSigns        String   @default("{}")        // JSON: {pallor:false, clubbing:false, icterus:false, cyanosis:false, lymphnodes:false}
  
  // --- Admission Status ---
  admissionDate       DateTime  @default(now())
  admissionTime       String    @default("")        // "08:30 AM"
  status              String    @default("Admitted")  // Admitted, Discharged, DAMA, Expired, Transferred
  dischargeDate       DateTime?
  dischargeTime       String    @default("")
  dischargeType       String    @default("")        // Normal, DAMA (Against Medical Advice), LAMA, Expired
  finalDiagnosis      String    @default("")        // Updated at discharge
  dischargeSummary    String    @default("")        // Doctor's discharge notes
  
  // --- Billing ---
  roomRentDays        Int       @default(0)
  totalBillAmount     Float     @default(0)
  paymentStatus       String    @default("Pending")  // Pending, Partial, Paid, Insurance
  
  // --- Audit ---
  admittedBy          String?                        // Receptionist User.id who processed admission
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // --- Relations ---
  hospital            Hospital   @relation(fields: [hospitalId], references: [id])
  ward                Ward       @relation(fields: [wardId], references: [id])
  bed                 Bed        @relation(fields: [bedId], references: [id])
  department          Department @relation(fields: [departmentId], references: [id])
  attendingDoctor     Doctor     @relation("AdmittingDoctor", fields: [attendingDoctorId], references: [id])
  referringDoctor     Doctor?    @relation("ReferringDoctor", fields: [referringDoctorId], references: [id])
  patient             User?      @relation(fields: [userId], references: [id])
  opdBooking          Booking?   @relation("IpdFromOpd", fields: [opdBookingId], references: [id])
  
  vitalRecords        VitalRecord[]
  doctorOrders        DoctorOrder[]
  medicineAdministrations MedicineAdministration[]
  sampleCollections   SampleCollection[]
  investigationReports InvestigationReport[]
  nurseAssignments    NursePatientAssignment[]
  doctorVisits        DoctorVisit[]
}

// ============ VITAL RECORD (Monitoring Chart — Form 6 — Nurse fills hourly) ============

model VitalRecord {
  id                  String   @id @default(cuid())
  admissionId         String   // IpdAdmission.id
  nurseId             String   // StaffNurse.id — kis nurse ne measure kiya
  recordedAt          DateTime // Kab measure kiya (important: exact time)
  
  // --- Patient Header Status ---
  patientStatus       String   @default("Conscious") // Conscious, Semiconscious, Unconscious
  ventilatorOn        Boolean  @default(false)
  oxygenLiters        Float    @default(0)          // O2 flow rate
  infusionPump        String   @default("")        // Kaun si dawai drip pe chal rahi hai
  rbs                 Float?                          // Random Blood Sugar (checked intermittently)
  
  // --- Vital Signs ---
  temperature         Float    @default(0)          // °F
  pulse               Int      @default(0)          // per minute
  spo2                Float    @default(0)          // %
  bpSystolic          Int      @default(0)          // mmHg (upper)
  bpDiastolic         Int      @default(0)          // mmHg (lower)
  respiratoryRate     Int      @default(0)          // breaths per minute
  
  // --- Input/Output ---
  inputMl             Float    @default(0)          // Total input this hour (IV + Oral + Blood)
  urineMl             Float    @default(0)          // Urine output
  outputMl            Float    @default(0)          // Other output (vomit, drain, etc.)
  
  // --- Notes ---
  remarks             String   @default("")        // "Pain reduced", "Vomiting once", "Doctor notified"
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  admission           IpdAdmission @relation(fields: [admissionId], references: [id], onDelete: Cascade)
  nurse               StaffNurse   @relation(fields: [nurseId], references: [id], onDelete: Cascade)
}

// ============ DOCTOR ORDER (Order Sheet — Form 5 — Doctor writes, Nurse executes) ============
// Ye doctor ka treatment order hai
// Har order item = ek dawai ka ek time slot

model DoctorOrder {
  id                  String   @id @default(cuid())
  admissionId         String   // IpdAdmission.id
  doctorId            String   // Doctor.id
  
  drugName            String   @default("")        // "Paracetamol 500mg", "Normal Saline 0.9%"
  route               String   @default("")        // Oral, IV, IM, SC, Topical, PR, Nebulization
  dose                String   @default("")        // "1 tab", "500ml", "100mg"
  frequency           String   @default("")        // OD, BD, TDS, QID, STAT, SOS, HS, Q4H, Q6H, Q8H
  scheduledTime       String   @default("")        // "08:00", "14:00", "20:00" ya "STAT"
  startDate           DateTime @default(now())
  endDate             DateTime?                      // NULL = until doctor stops it
  
  instructions        String   @default("")        // "After food", "Empty stomach", "Slow IV push", "Dilute in 100ml NS"
  isPrn               Boolean  @default(false)       // PRN = as needed (SOS)
  isStat              Boolean  @default(false)       // STAT = immediately
  
  status              String   @default("Active")    // Active, Stopped, Completed, Modified
  stoppedBy           String?                        // Doctor User.id who stopped it
  stoppedAt           DateTime?
  stoppedReason       String   @default("")
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  admission           IpdAdmission @relation(fields: [admissionId], references: [id], onDelete: Cascade)
  doctor              Doctor       @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  administrations      MedicineAdministration[]
}

// ============ MEDICINE ADMINISTRATION (Nurse marks ki dawai di ya nahi) ============
// Ye nurse ka record hai — "Maine 8:05 AM ko Paracetamol diya"

model MedicineAdministration {
  id                  String   @id @default(cuid())
  orderId             String   // DoctorOrder.id
  admissionId         String   // IpdAdmission.id
  nurseId             String   // StaffNurse.id
  
  scheduledTime       DateTime                        // Doctor ne kis time diya tha
  administeredTime    DateTime?                       // Nurse ne kab actually diya
  
  status              String   @default("Pending")  // Pending, Given, Missed, Refused, Skipped, NotAvailable
  
  // Refused/Skipped ka reason
  remarks             String   @default("")        // "Patient refused", "Medicine not in stock", "Patient sleeping - will give later"
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  order               DoctorOrder  @relation(fields: [orderId], references: [id], onDelete: Cascade)
  admission           IpdAdmission @relation(fields: [admissionId], references: [id], onDelete: Cascade)
  nurse               StaffNurse  @relation(fields: [nurseId], references: [id], onDelete: Cascade)
}

// ============ SAMPLE COLLECTION (Nurse collects, sends to lab) ============

model SampleCollection {
  id                  String   @id @default(cuid())
  admissionId         String   // IpdAdmission.id
  nurseId             String   // StaffNurse.id
  doctorId            String   // Doctor.id — kis doctor ne order kiya
  
  testName            String   @default("")        // "CBC", "KFT", "LFT", "Blood Sugar", "Urine Routine"
  sampleType          String   @default("")        // Blood, Urine, Sputum, CSF, Swab, Other
  
  collectedAt         DateTime?                       // Kab collect kiya
  sentToLabAt         DateTime?                       // Kab lab bheja
  
  status              String   @default("Ordered")   // Ordered → Collected → SentToLab → Reported → Filed
  
  remarks             String   @default("")        // "Difficult venous access", "Patient uncooperative"
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  admission           IpdAdmission @relation(fields: [admissionId], references: [id], onDelete: Cascade)
  nurse               StaffNurse   @relation(fields: [nurseId], references: [id], onDelete: Cascade)
  doctor              Doctor      @relation(fields: [doctorId], references: [id], onDelete: Cascade)
}

// ============ INVESTIGATION REPORT (Lab results — Lab fills, Doctor reviews) ============

model InvestigationReport {
  id                  String   @id @default(cuid())
  admissionId         String   // IpdAdmission.id
  sampleCollectionId  String?  // SampleCollection.id (link if collected by nurse)
  
  testName            String   @default("")        // "CBC", "KFT", "X-Ray Chest PA View"
  reportDate          DateTime @default(now())
  resultData          String   @default("{}")        // JSON: {"Hb": "12.5", "TC": "8500", "DC": "N70 L25 E3 M2", ...}
  normalRange         String   @default("{}")        // JSON: {"Hb": "12-16", "TC": "4000-11000", ...}
  isAbnormal          Boolean  @default(false)      // Auto-flagged if values outside normal range
  
  reportedBy          String?                        // Lab technician User.id
  reviewedBy          String?                        // Doctor User.id who reviewed
  reviewedAt          DateTime?
  remarks             String   @default("")        // Lab/Doctor remarks
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  admission           IpdAdmission @relation(fields: [admissionId], references: [id], onDelete: Cascade)
}

// ============ SHIFT HANDOVER (End-of-shift → Next shift communication) ============

model ShiftHandover {
  id                  String   @id @default(cuid())
  hospitalId          String
  wardId              String
  shiftDate           DateTime                        // Date of the shift
  shiftType           String                        // Morning, Evening, Night
  
  fromNurseId         String                        // Nurse jaa rahi hai (giving handover)
  toNurseId           String                        // Nurse aa rahi hai (receiving handover)
  
  // --- Summary for each patient ---
  patientSummaries    String   @default("[]")        // JSON array: [
                                                     //   {
                                                     //     "admissionId": "xxx",
                                                     //     "bedNumber": "Bed 3",
                                                     //     "patientName": "Raju",
                                                     //     "summary": "BP stable, pain free, reports pending",
                                                     //     "pendingTasks": ["Atorvastatin 40mg HS due tonight"],
                                                     //     "alerts": ["KFT report expected by 4PM"]
                                                     //   },
                                                     //   ...
                                                     // ]
  
  // --- Ward-level notes ---
  wardNotes           String   @default("")        // "Bed 5 expected discharge today", "ICU bed 4 under maintenance"
  pendingTasks        String   @default("[]")        // JSON: ["Bed 2 O2 cylinder needs refill", "Pharmacy pending 2 medicines"]
  
  acknowledgedAt      DateTime?                       // Receiving nurse ne kab read kiya
  acknowledgedBy      String?                        // Receiving nurse User.id
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  hospital            Hospital    @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  ward                Ward        @relation(fields: [wardId], references: [id], onDelete: Cascade)
  fromNurse           StaffNurse  @relation("HandoverFrom", fields: [fromNurseId], references: [id])
  toNurse             StaffNurse  @relation("HandoverTo", fields: [toNurseId], references: [id])
}

// ============ DOCTOR VISIT (Doctor daily round record) ============

model DoctorVisit {
  id                  String   @id @default(cuid())
  admissionId         String   // IpdAdmission.id
  doctorId            String   // Doctor.id
  visitDate           DateTime @default(now())
  visitTime           String   @default("")        // "10:30 AM"
  
  // --- What doctor found ---
  examinationFindings  String   @default("")       // "Patient comfortable, chest clear, abdomen soft"
  currentDiagnosis    String   @default("")        // Updated diagnosis
  
  // --- What doctor ordered ---
  newOrders           String   @default("[]")        // JSON: [{"type":"medicine","detail":"Add Atorvastatin 40mg HS"},{"type":"investigation","detail":"Repeat KFT tomorrow"}]
  stoppedOrders       String   @default("[]")        // JSON: [{"orderId":"xxx","reason":"No longer needed"}]
  advise              String   @default("")        // "Continue monitoring, plan discharge tomorrow if stable"
  
  // --- Mobile/Phone visit ---
  isMobileVisit       Boolean  @default(false)       // Doctor ne phone pe advise kiya
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  admission           IpdAdmission @relation(fields: [admissionId], references: [id], onDelete: Cascade)
  doctor              Doctor      @relation(fields: [doctorId], references: [id], onDelete: Cascade)
}
```

### Existing Models — Changes Required:

```prisma
// User model — add nurse relation
model User {
  // ... existing fields ...
  nurseProfile  StaffNurse?  @relation("NurseUser")
}

// Hospital model — add nurse + ward relations
model Hospital {
  // ... existing fields ...
  wards         Ward[]
  nurses        StaffNurse[]
  ipdAdmissions IpdAdmission[]
}

// Doctor model — add IPD relations
model Doctor {
  // ... existing fields ...
  ipdAdmissionsAsAttending IpdAdmission[] @relation("AdmittingDoctor")
  ipdAdmissionsAsReferring IpdAdmission[] @relation("ReferringDoctor")
  doctorOrders  DoctorOrder[]
  doctorVisits  DoctorVisit[]
}

// Department model — add IPD relation
model Department {
  // ... existing fields ...
  ipdAdmissions IpdAdmission[]
}

// Booking model — add IPD link
model Booking {
  // ... existing fields ...
  ipdAdmission  IpdAdmission?  @relation("IpdFromOpd")
}
```

---

## 📱 NURSE DASHBOARD PAGES (Frontend)

### Page Map:

```
/dashboard/nurse
  ├── /                        → Nurse Dashboard (my patients summary, alerts, pending tasks)
  ├── /patients                 → My Assigned Patients List (with bed numbers, status)
  ├── /patients/[admissionId]   → Single Patient View (admission details + tabs)
  │     ├── vitals              → Vital Signs Entry (Monitoring Chart - Form 6)
  │     ├── medicines            → Medicine Administration (Order Sheet execution)
  │     ├── investigations       → Sample Collection & Reports
  │     ├── history              → History Sheet view (read-only, doctor fills)
  │     └── notes                → Nursing Notes (custom notes by nurse)
  ├── /handover                 → Shift Handover (give/take)
  ├── /handover/history         → Past Handover History
  ├── /ward-patients            → All Ward Patients (view only, not assigned to me)
  ├── /profile                  → My Profile
  └── /change-password          → Change Password
```

### Sidebar Config for Nurse:

```typescript
nurse: [
  { label: 'Dashboard', href: '/dashboard/nurse', icon: LayoutDashboard },
  { label: 'My Patients', href: '/dashboard/nurse/patients', icon: Users },
  { label: 'Ward View', href: '/dashboard/nurse/ward-patients', icon: BedDouble },
  { label: 'Shift Handover', href: '/dashboard/nurse/handover', icon: ArrowRightLeft },
  { label: 'Profile', href: '/dashboard/nurse/profile', icon: UserCircle },
  { label: 'Change Password', href: '/dashboard/change-password', icon: KeyRound },
],
```

---

## 🔌 NURSE API ROUTES (Backend)

### API Map:

```
/api/dashboard/nurse/
  ├── GET  /stats                      → Dashboard stats (my patients count, pending medicines, alerts)
  ├── GET  /patients                   → My assigned patients (current shift)
  ├── GET  /patients/[admissionId]     → Single patient full detail
  ├── GET  /patients/[admissionId]/vitals      → Vital history (monitoring chart)
  ├── POST /patients/[admissionId]/vitals      → Record new vital signs
  ├── GET  /patients/[admissionId]/medicines   → Doctor's orders + administration status
  ├── POST /patients/[admissionId]/medicines/administer → Mark medicine as given/missed/refused
  ├── GET  /patients/[admissionId]/investigations → Investigation orders + collection status
  ├── POST /patients/[admissionId]/investigations/collect → Mark sample as collected/sent
  ├── GET  /patients/[admissionId]/history      → Patient history (read-only)
  ├── POST /handover/give              → Create shift handover (giving)
  ├── GET  /handover/receive           → Get incoming handover for my shift
  ├── POST /handover/[id]/acknowledge  → Acknowledge received handover
  ├── GET  /handover/history           → Past handovers
  ├── GET  /ward-patients              → All patients in my ward (view only)
  └── GET  /alerts                     → Abnormal vitals, missed medicines, pending tasks
```

---

## 🔄 NURSE'S INTERACTION WITH OTHER ROLES

### Nurse ↔ Doctor:

| Scenario | Flow |
|----------|------|
| **Doctor writes order** | Doctor → DoctorOrder table → Nurse sees pending medicines → Nurse administers → MedicineAdministration table |
| **Nurse reports abnormal vitals** | Nurse records vital → System auto-checks thresholds → Alert sent to Doctor → Doctor reviews → May write new order |
| **Doctor comes for round** | Doctor sees VitalRecord + MedicineAdministration history → Doctor writes DoctorVisit notes → May add/stop DoctorOrders |
| **Doctor orders investigation** | Doctor → DoctorOrder (type=investigation) OR separate investigation order → Nurse sees → Nurse collects sample → SampleCollection table |

### Nurse ↔ Pharmacist:

| Scenario | Flow |
|----------|------|
| **Medicine not available** | Nurse tries to administer → Marks "NotAvailable" → Pharmacist sees alert → Pharmacy arranges medicine → Nurse notified |
| **New medicine needed** | Doctor writes new order → Pharmacist sees order → Prepares/dispenses to ward → Nurse receives → Administers |

### Nurse ↔ Receptionist:

| Scenario | Flow |
|----------|------|
| **New patient admitted** | Receptionist creates IpdAdmission → Bed allocated → Nurse assigned → Nurse sees new patient in "My Patients" |
| **Patient discharge** | Doctor says discharge → Nurse does final vitals, removes IV lines → Receptionist processes billing → Bed freed |

### Nurse ↔ Lab:

| Scenario | Flow |
|----------|------|
| **Sample collection** | Doctor orders investigation → Nurse collects sample → Sends to lab → Lab enters results → InvestigationReport → Doctor reviews |

### Nurse ↔ Nursing Incharge (Head Nurse):

| Scenario | Flow |
|----------|------|
| **Shift assignment** | Nursing Incharge assigns nurses to patients for each shift → NursePatientAssignment |
| **Re-assignment** | If nurse sick/emergency → Incharge re-assigns patients to another nurse |
| **Ward management** | Incharge manages bed availability, nurse schedules, leave management |

---

## 🚨 SMART ALERTS — Nurse's Early Warning System

Ye system automatically detect karega abnormal situations aur nurse + doctor ko alert karega:

### Vital Sign Alerts (Auto-generated from VitalRecord):

| Parameter | Danger Threshold | Alert Level | Action |
|-----------|-----------------|-------------|--------|
| **SpO2 < 90%** | Oxygen critical | 🔴 CRITICAL | Immediate doctor notification |
| **BP Systolic < 90 or > 180** | Shock / Hypertensive crisis | 🔴 CRITICAL | Immediate doctor notification |
| **BP Diastolic > 120** | Hypertensive emergency | 🔴 CRITICAL | Immediate doctor notification |
| **Pulse < 50 or > 130** | Bradycardia / Tachycardia | 🟠 HIGH | Alert nurse + doctor |
| **Temperature > 103°F** | High fever / Sepsis | 🟠 HIGH | Alert nurse + doctor |
| **Respiratory Rate < 10 or > 30** | Respiratory distress | 🟠 HIGH | Alert nurse + doctor |
| **Urine output < 30ml/hr** (3 consecutive hours) | Kidney concern | 🟡 MEDIUM | Alert nurse |

### Medicine Alerts:

| Situation | Alert |
|-----------|-------|
| Medicine due for > 30 minutes | ⏰ Overdue medicine |
| Medicine due for > 1 hour | 🔴 Critical overdue |
| Medicine marked "NotAvailable" | 💊 Pharmacy alert |
| PRN (SOS) medicine given 3 times in 6 hours | ⚠️ Frequency alert |

### Investigation Alerts:

| Situation | Alert |
|-----------|-------|
| Sample collected > 4 hours ago, no report | 📋 Lab follow-up needed |
| Report is abnormal | 🔴 Doctor review needed |

---

## 📊 NURSE DASHBOARD — What Nurse Sees When She Logs In

```
┌─────────────────────────────────────────────────────────────────┐
│  🩺  Nurse Dashboard — Priya Sharma (Morning Shift)             │
│  Ward: ICU  |  Patients: 3  |  Time: 10:30 AM                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─── ALERTS (3) ──────────────────────────────────────────┐    │
│  │ 🔴 Bed 3 Raju — SpO2 dropped to 88% at 10:00 AM        │    │
│  │ ⏰ Bed 2 Meena — Enoxaparin 60mg overdue by 45 min      │    │
│  │ 📋 Bed 1 Suresh — KFT report ready, doctor review needed │   │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─── MY PATIENTS (3) ──────────────────────────────────────┐   │
│  │ Bed | Patient    | Diagnosis        | Status   | Next Task│   │
│  │  1  | Suresh     | Post-Op Appendix  | Stable   | Meds 11AM│  │
│  │  2  | Meena      | Pneumonia         | On O2    | ⚠️ Meds! │  │
│  │  3  | Raju       | Heart Attack      | ⚠️ Critical| Vitals due│  │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─── QUICK ACTIONS ────────────────────────────────────────┐   │
│  │ [📝 Record Vitals]  [💊 Give Medicine]  [🧪 Collect Sample]│   │
│  │ [🔄 Shift Handover]  [📋 View All Ward Patients]         │   │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─── PENDING MEDICINES (Next 2 Hours) ────────────────────┐   │
│  │ Time   | Patient | Medicine               | Route | Status│  │
│  │ 10:30  | Raju    | Inj. Enoxaparin 60mg   | SC    | ⏰ Due │  │
│  │ 11:00  | Meena   | Tab. Azithromycin 500mg| Oral  | Pending│  │
│  │ 11:00  | Suresh  | Tab. Amoxicillin 500mg | Oral  | Pending│  │
│  │ 12:00  | Raju    | Tab. Metformin 500mg   | Oral  | Pending│  │
│  │ 12:00  | Meena   | Tab. Paracetamol 500mg | Oral  | Pending│  │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─── INPUT/OUTPUT SUMMARY (Today) ────────────────────────┐   │
│  │ Patient | Total Input | Total Urine | Balance | Status  │   │
│  │ Raju    | 1,250 ml    | 980 ml      | +270 ml  | ✅ OK   │   │
│  │ Meena   | 800 ml      | 600 ml      | +200 ml  | ✅ OK   │   │
│  │ Suresh  | 1,500 ml    | 1,200 ml    | +300 ml  | ✅ OK   │   │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 COMPLETE DATA FLOW DIAGRAM

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ RECEPTIONIST │     │    DOCTOR    │     │    NURSE     │
│ (Admission)  │     │ (Orders)     │     │ (Execution)  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ 1. Create          │                    │
       │ IpdAdmission       │                    │
       │ (Form 1)           │                    │
       ▼                    │                    │
  ┌─────────────────────────────────────────────────────┐
  │              IPD ADMISSION (Central Table)           │
  │  - Patient details, bed, doctor, status              │
  └───────┬──────────┬──────────┬──────────┬────────────┘
          │          │          │          │
          │ 2. Fill  │ 4. Write │ 6. Record│ 7. Collect
          │ History  │ Orders   │ Vitals   │ Samples
          │ (Form 2) │ (Form 5) │ (Form 6) │ (Form 4)
          ▼          ▼          ▼          ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ History  │ │ Doctor   │ │  Vital   │ │  Sample  │
  │ (in      │ │  Order   │ │  Record  │ │Collection│
  │ Admission│ │          │ │          │ │          │
  │ table)   │ │          │ │          │ │          │
  └──────────┘ └────┬─────┘ └──────────┘ └────┬─────┘
                    │                         │
                    │ 5. Nurse executes       │ 8. Lab reports
                    │    order                 │
                    ▼                         ▼
               ┌──────────┐           ┌──────────────┐
               │ Medicine │           │ Investigation│
               │ Admin    │           │   Report     │
               │ Record   │           │ (Lab fills)  │
               └──────────┘           └──────┬───────┘
                                            │
                    3. Doctor reviews        │
                    examination &            │
                    investigation           │
                    (Form 3,6)               │
                         │                   │
                         └───────────────────┘
                              │
                              ▼
                    9. Doctor writes visit notes
                       (DoctorVisit table)
                              │
                              ▼
                    10. May add new orders
                        or stop old ones
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
              New Orders          Stop Orders
              (back to step 4)    (mark as Stopped)


  ┌─── SHIFT HANDOVER FLOW ────────────────────────────────────┐
  │                                                            │
  │  Nurse A (Morning) ──writes──▶ ShiftHandover ──reads──▶ Nurse B (Evening) │
  │                                                            │
  │  Contains: patient summaries, pending tasks, alerts,      │
  │  ward notes, pending investigations, medicine status       │
  └────────────────────────────────────────────────────────────┘
```

---

## 👤 AUTH & ROLE CHANGES

### 1. User.role new value: `nurse`

Current roles in system: `admin, doctor, patient, hospital, receptionist, assistant, pharmacist`

Add: **`nurse`** — sab jagah jahan role check hota hai, nurse bhi handle hoga.

### 2. api-auth.ts — DEV_USERS mein add karo:

```typescript
nurse: {
  id: 'dev-nurse',
  name: 'Priya Sharma',
  email: 'priya.sharma@doctorooms.com',
  role: 'nurse',
  gender: 'Female',
  profileImg: null,
  mobileNo: '+91 9876543217',
},
```

### 3. sidebar-config.ts — nurse entries add karo (shown above)

### 4. Admin creates nurse — like receptionist/pharmacist

Admin dashboard mein "Manage Staff" section mein:
- Create Doctor ✓ (exists)
- Create Receptionist ✓ (exists)
- Create Pharmacist ✓ (exists)
- **Create Staff Nurse** ← NEW
- **Manage Wards** ← NEW
- **Manage Beds** ← NEW
- **Nurse-Patient Assignment** ← NEW (by Nursing Incharge)

---

## 🏗️ BUILD PHASES (Recommended Order)

### Phase N-1: Foundation (Schema + Auth + Admin CRUD)
- Add `nurse` role to User, api-auth, sidebar
- Create Ward, Bed, StaffNurse models
- Create NursePatientAssignment model
- Admin pages: Create Wards, Create Beds, Create Nurses, Assign Nurses to Wards
- Seed data: 3 wards, 15 beds, 3 nurses

### Phase N-2: IPD Admission (Receptionist + Doctor)
- Create IpdAdmission model
- Receptionist: Admission form page (Form 1 — Admission Sheet)
- Doctor: History Sheet page (Form 2)
- Doctor: Physical Examination page (Form 6)
- IPD No. generation: `IPD-{YEAR}-{SEQ}` (e.g., IPD-2026-000001)
- Bed status auto-update (Available → Occupied on admit, Occupied → Available on discharge)

### Phase N-3: Doctor Orders + Nurse Execution (THE CORE)
- Create DoctorOrder model
- Create MedicineAdministration model
- Doctor: Order Sheet page (Form 5) — write orders
- Nurse: My Patients page — see assigned patients
- Nurse: Medicine Administration page — see orders, mark as given/missed/refused
- Nurse: Pending medicines widget on dashboard

### Phase N-4: Vital Monitoring (THE BIGGEST TASK)
- Create VitalRecord model
- Nurse: Vital Signs Entry page (Form 6 — Monitoring Chart)
- Nurse: Record hourly vitals
- Auto-calculate Input/Output totals
- **Smart Alerts**: Auto-detect abnormal vitals, create alerts
- Doctor: View monitoring chart during rounds
- Trend charts (BP over 24 hours, etc.)

### Phase N-5: Investigation & Lab
- Create SampleCollection, InvestigationReport models
- Doctor: Order investigation
- Nurse: Sample collection workflow
- Lab: Enter results (or simplified version)
- Doctor: Review reports
- Abnormal value auto-flagging

### Phase N-6: Shift Handover
- Create ShiftHandover model
- Nurse: Give Handover page (end of shift)
- Nurse: Receive Handover page (start of shift)
- Auto-populate patient summaries from today's vitals + medicine status
- Handover acknowledgment
- Handover history

### Phase N-7: Doctor Visits & Discharge
- Create DoctorVisit model
- Doctor: Visit notes page (daily round documentation)
- Doctor: Discharge workflow
  - Write discharge summary
  - Mark final diagnosis
  - Stop all active orders
  - Bed freed
  - Bill generated
- Nurse: Post-discharge bed preparation

### Phase N-8: Advanced Features
- Nurse: Ward View (all ward patients, not just mine)
- Input/Output trend analysis
- Vital sign trend charts (BP, Pulse, Temp over time)
- Printable Monitoring Chart (Form 6 print)
- Printable Admission Sheet (Form 1 print)
- Patient transfer between wards/beds
- DAMA (Discharge Against Medical Advice) workflow
- Death documentation
- Mobile responsive for nurse's tablet/phone use

---

## 🔑 KEY ARCHITECTURAL DECISIONS

### Decision 1: IPD Admission = Separate from OPD Booking

```
OPD Booking (existing Booking model)
  → Patient comes, sees doctor, goes home
  → Token system, queue, prescription

IPD Admission (new IpdAdmission model)
  → Patient stays in hospital on a bed
  → No tokens, no queue
  → Continuous monitoring, orders, vitals
  → Separate billing, separate flow
```

**Why separate?** Because IPD is fundamentally different from OPD:
- OPD = transactional (one visit, done)
- IPD = continuous (days/weeks of care)
- OPD has one doctor visit → IPD has daily doctor visits + 24/7 nurse care
- OPD prescription = one time → IPD orders = continuous, can be added/stopped/modified
- OPD has no vitals → IPD has hourly vitals

**Link:** A patient CAN be admitted from OPD. If doctor says "admit karo" during OPD visit, then:
- OPD Booking exists (the visit)
- IpdAdmission created with `opdBookingId` linking to that Booking
- This link helps: patient demographics auto-fill from OPD data

### Decision 2: Nurse-Patient Assignment is Shift-Based

```
Shift 1 (Morning 7AM-2PM):
  Nurse Priya → [Bed 1, Bed 2, Bed 3]
  Nurse Sunita → [Bed 4, Bed 5, Bed 6]

Shift 2 (Evening 2PM-9PM):
  Nurse Anita → [Bed 1, Bed 2, Bed 3]  ← Different nurse!
  Nurse Priya → [Bed 4, Bed 5, Bed 6]  ← Can swap
```

**Why shift-based?** Because in real hospitals, different nurses work different shifts. Patient ko SAME NURSE 24/7 nahi milti. Har shift change pe naya nurse aati hai, handover hota hai.

**Assignment logic:**
- Nursing Incharge (or Admin) assigns nurses to shifts
- At shift start, system shows "My Patients for this shift"
- At shift end, nurse MUST complete handover before leaving

### Decision 3: Doctor Orders are NOT one-time prescriptions

```
OPD Prescription (existing PMedicine model):
  → Tab. Paracetamol 500mg: Morning 1, Evening 1, Days 5
  → Fixed duration, one-time prescription

IPD Doctor Order (new DoctorOrder model):
  → Inj. Enoxaparin 60mg SC BD
  → Start: Today | End: NULL (runs until doctor stops it)
  → Every instance = one MedicineAdministration record
  → Doctor can STOP the order anytime
  → Nurse marks each instance as Given/Missed/Refused
```

**Why?** IPD mein dawaiyaan continuously chalti hain. Doctor ne likh diya, nurse Roz Roz de rahi hai, jab tak doctor na bole "band karo". Ye OPD prescription se fundamentally alag hai.

### Decision 4: Vitals are Time-Series Data

```
VitalRecord is NOT a snapshot — it's a TIME SERIES:
  8:00 AM → Temp 98.4, Pulse 82, BP 112/74
  9:00 AM → Temp 98.6, Pulse 80, BP 118/76
  10:00 AM → Temp 98.4, Pulse 78, BP 120/78
  ...every hour...
```

**Why?** Because trends matter more than single readings:
- BP 120/80 once = normal
- BP 120/80 → 115/75 → 108/70 → 95/60 over 4 hours = **SHOCK** (trend is falling!)
- Doctor needs to see the TREND, not just the latest value

---

## 📋 COMPLETE FILE/FOLDER STRUCTURE (New Files Only)

```
src/
├── app/
│   ├── dashboard/
│   │   ├── nurse/
│   │   │   ├── page.tsx                              → Nurse Dashboard
│   │   │   ├── patients/
│   │   │   │   ├── page.tsx                          → My Patients List
│   │   │   │   └── [admissionId]/
│   │   │   │       ├── page.tsx                      → Patient Detail (tabbed view)
│   │   │   │       ├── vitals/page.tsx               → Vital Signs Entry
│   │   │   │       ├── medicines/page.tsx            → Medicine Administration
│   │   │   │       ├── investigations/page.tsx       → Sample Collection
│   │   │   │       ├── history/page.tsx              → History View (read-only)
│   │   │   │       └── notes/page.tsx                → Nursing Notes
│   │   │   ├── handover/
│   │   │   │   ├── page.tsx                          → Give/Receive Handover
│   │   │   │   └── history/page.tsx                  → Past Handovers
│   │   │   ├── ward-patients/page.tsx                → All Ward Patients
│   │   │   └── profile/page.tsx                      → Nurse Profile
│   │   ├── receptionist/
│   │   │   └── ipd/
│   │   │       ├── admit/page.tsx                    → IPD Admission Form (Form 1)
│   │   │       ├── patients/page.tsx                 → All IPD Patients
│   │   │       └── [admissionId]/page.tsx             → Patient Detail
│   │   ├── doctor/
│   │   │   └── ipd/
│   │   │       ├── patients/page.tsx                 → My IPD Patients
│   │   │       └── patients/[admissionId]/
│   │   │           ├── page.tsx                      → Patient Overview
│   │   │           ├── history/page.tsx              → History Sheet (Form 2)
│   │   │           ├── examination/page.tsx          → Physical Exam (Form 6)
│   │   │           ├── orders/page.tsx               → Order Sheet (Form 5)
│   │   │           ├── investigations/page.tsx       → Order Investigations
│   │   │           ├── vitals/page.tsx               → View Monitoring Chart
│   │   │           ├── visits/page.tsx               → Doctor Visit Notes
│   │   │           └── discharge/page.tsx            → Discharge Summary
│   │   └── admin/
│   │       ├── wards/page.tsx                       → Manage Wards
│   │       ├── wards/[wardId]/beds/page.tsx          → Manage Beds in Ward
│   │       └── nurses/page.tsx                       → Manage Staff Nurses
│   └── api/
│       └── dashboard/
│           ├── nurse/                                  → All nurse APIs
│           │   ├── stats/route.ts
│           │   ├── patients/route.ts
│           │   ├── patients/[admissionId]/route.ts
│           │   ├── patients/[admissionId]/vitals/route.ts
│           │   ├── patients/[admissionId]/medicines/route.ts
│           │   ├── patients/[admissionId]/medicines/administer/route.ts
│           │   ├── patients/[admissionId]/investigations/route.ts
│           │   ├── handover/route.ts
│           │   ├── handover/[id]/acknowledge/route.ts
│           │   ├── alerts/route.ts
│           │   └── ward-patients/route.ts
│           ├── receptionist/
│           │   └── ipd/                                → IPD admission APIs
│           │       ├── admit/route.ts
│           │       ├── patients/route.ts
│           │       └── patients/[admissionId]/route.ts
│           ├── doctor/
│           │   └── ipd/                                → Doctor IPD APIs
│           │       ├── patients/route.ts
│           │       ├── patients/[admissionId]/route.ts
│           │       ├── patients/[admissionId]/history/route.ts
│           │       ├── patients/[admissionId]/examination/route.ts
│           │       ├── patients/[admissionId]/orders/route.ts
│           │       ├── patients/[admissionId]/investigations/route.ts
│           │       ├── patients/[admissionId]/vitals/route.ts
│           │       ├── patients/[admissionId]/visits/route.ts
│           │       └── patients/[admissionId]/discharge/route.ts
│           └── admin/
│               ├── wards/route.ts
│               ├── wards/[wardId]/beds/route.ts
│               └── nurses/route.ts
└── lib/
    ├── ipd-utils.ts                               → IPD number generation, bed status helpers
    ├── vital-alerts.ts                            → Vital threshold checking, alert generation
    └── shift-utils.ts                             → Shift timing, assignment logic
```

---

## 🎯 SUMMARY — WHAT THIS PLAN COVERS

| # | Entity | Purpose | Created By | Used By |
|---|--------|---------|------------|---------|
| 1 | **Ward** | ICU, General, Private | Admin | Nurse, Doctor, Receptionist |
| 2 | **Bed** | Physical bed in ward | Admin | Nurse, Receptionist |
| 3 | **StaffNurse** | Nurse profile + assignment | Admin | Nurse, Admin |
| 4 | **NursePatientAssignment** | Which nurse handles which patient | Admin/Nursing Incharge | Nurse |
| 5 | **IpdAdmission** | Core IPD record (all 6 forms data) | Receptionist | Everyone |
| 6 | **VitalRecord** | Hourly monitoring (Form 6) | Nurse | Nurse, Doctor |
| 7 | **DoctorOrder** | Treatment orders (Form 5) | Doctor | Nurse, Doctor |
| 8 | **MedicineAdministration** | Medicine given record | Nurse | Nurse, Doctor |
| 9 | **SampleCollection** | Lab sample tracking | Nurse | Nurse, Lab, Doctor |
| 10 | **InvestigationReport** | Lab results | Lab | Doctor |
| 11 | **ShiftHandover** | Shift change communication | Nurse | Nurse |
| 12 | **DoctorVisit** | Daily round documentation | Doctor | Doctor, Nurse |

**Total: 8 new database models + 4 existing models modified**
**Total: ~40 new pages + ~25 new API routes**

---

*Plan created by acting as Hospital Doctor — based on real IPD workflow*
*Ready for review before development begins*