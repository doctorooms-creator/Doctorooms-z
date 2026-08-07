# Phase 9: Cross-Cutting Concerns

## 9.1 API Endpoints

### 9.1.1 Api Controller (`/application/controllers/Api.php`)
- **Extends**: `Guest_controller` (public, no auth required)
- **Models loaded**: `Doctor_rating_model` (aliased as `doctor_rating`)
- **Endpoints**:

| Method | URI | Auth | Description |
|--------|-----|------|-------------|
| POST | `api/rate_us` | PATIENT role only | Rate a doctor (1-5 stars). Upserts: if patient already rated this doctor, updates; otherwise creates new. |

### 9.1.2 Inline AJAX Endpoints (within other controllers)

| Controller | Method | URI Pattern | Auth | Description |
|------------|--------|-------------|------|-------------|
| `Appointment` (patient) | `get_all_chat_message()` | `appointment/get_all_chat_message` | Patient | Returns JSON chat messages for a booking |
| `Appointment` (patient) | `send_chat_msg()` | `appointment/send_chat_msg` | Patient | Sends chat message (POST: appointId, msg) |
| `receptionist/Appointment` | `get_all_chat_message()` | `receptionist/appointment/get_all_chat_message` | Receptionist | Returns JSON chat messages |
| `receptionist/Appointment` | `send_chat_msg()` | `receptionist/appointment/send_chat_msg` | Receptionist | Sends chat message |
| `hospital/Appoinment` | `get_all_chat_message()` | `hospital/appoinment/get_all_chat_message` | Hospital | Returns JSON chat messages |
| `hospital/Appoinment` | `send_chat_msg()` | `hospital/appoinment/send_chat_msg` | Hospital | Sends chat message |
| `doctor/Appointment` | `get_branch()` | `doctor/appointment/get_branch` | Doctor | Returns JSON medicine list for autocomplete |
| `doctor/Appointment` | `get_medi_list()` | `doctor/appointment/get_medi_list` | Doctor | Returns all medicine list for doctor |
| `doctor/AjaxPrescription` | `ajax_insert_co()` | `doctor/AjaxPrescription/ajax_insert_co` | Doctor | AJAX insert complaints/observations |
| `doctor/AjaxPrescription` | `ajax_insert_labels()` | `doctor/AjaxPrescription/ajax_insert_labels` | Doctor | AJAX insert labels |
| `doctor/AjaxPrescription` | `ajax_insert_medi_list()` | `doctor/AjaxPrescription/ajax_insert_medi_list` | Doctor | AJAX insert medicine list |
| `doctor/AjaxPrescription` | `ajax_insert_suggestion()` | `doctor/AjaxPrescription/ajax_insert_suggestion` | Doctor | AJAX insert suggestions |
| `doctor/AjaxPrescription` | `get_saggestion()` | `doctor/AjaxPrescription/get_saggestion` | Doctor | AJAX load suggestion tab |
| `assistant/AjaxPrescription` | (same 5 methods) | `assistant/AjaxPrescription/*` | Assistant | Mirrors doctor endpoints |

### 9.1.3 Security Issues in API
- **No CSRF protection** on any AJAX endpoint
- **No rate limiting** on rating endpoint
- **No input sanitization** on chat messages (XSS risk)
- `Api.php` sets `Content-Type: application/json` but other AJAX endpoints in controllers do not consistently set headers
- Patient rating requires POST but no authentication token validation beyond session role check

---

## 9.2 Cron Jobs

### 9.2.1 Crownjob Controller (`/application/controllers/Crownjob.php`)
- **Extends**: `Guest_controller`
- **Model loaded**: `Users_model` (aliased as `user`)

#### `birthReminder()`
- **Purpose**: Sends birthday SMS to patients whose birthday is today
- **Data source**: `Users_model->get_today_birthday()` which joins `users`, `booking`, and `users AS docusers` to find patients who booked with doctors, filtered by `date_of_birth = today`
- **Message format**: "Happy Birthday Dear {name} Stay Healthy... From Dr.{doctor_name} (DOCTOROOMS) (https://doctorooms.com)"
- **SMS Provider**: `sms.soft-techsolutions.com` via HTTP GET with hardcoded API key
- **Issues**:
  - Hardcoded SMS API credentials in source code (security risk)
  - Indian phone prefix `+91` hardcoded (not internationalized)
  - Returns after first birthday (loop has early `return` instead of `continue`)
  - No logging of sent/failed messages
  - URL-encodes spaces but other special chars may break
  - The `date_of_birth` column on `booking` table is used (not on `users`), meaning only patients who have booked appointments are eligible

---

## 9.3 Notification System

### 9.3.1 Notifications_model (`/application/models/Notifications_model.php`)
- **Table**: `notifications`
- **Columns**: id, user_id, title, body, status (READ/UNREAD), created_at, updated_at
- **Methods**:
  - `create($data)` - Creates notification with auto-timestamps
  - `update($user_id, $data)` - Updates ALL notifications for a user (design flaw: should update by notification id)
  - `get_all_by_user($user_id, $limit)` - All notifications ordered by created_at DESC
  - `get_all_by_user_by_status($user_id, $limit)` - Unread notifications only
  - `get_count_by_user($user_id)` - Count of unread notifications

### 9.3.2 Notification Triggers (Cross-Module)

Every appointment status change triggers notifications to both the patient AND the doctor's receptionist (if one exists):

| Trigger Event | Controller | Notify: Patient | Notify: Receptionist |
|---------------|------------|-----------------|---------------------|
| New booking created | `Book.php` | Yes | Yes |
| Booking canceled by patient | `Appointment.php` (patient) | - | Yes (to doctor) |
| Doctor extends appointment | `doctor/Appointment.php` | Yes | Yes |
| Doctor approves appointment | `doctor/Appointment.php` | Yes | Yes |
| Doctor marks visited | `doctor/Appointment.php` | Yes | Yes |
| Doctor cancels/rejects | `doctor/Appointment.php` | Yes | Yes |
| Receptionist approves | `receptionist/Appointment.php` | Yes | Yes |
| Receptionist extends | `receptionist/Appointment.php` | Yes | Yes |
| Receptionist marks visited | `receptionist/Appointment.php` | Yes | Yes |
| Receptionist rejects | `receptionist/Appointment.php` | Yes | Yes |
| Hospital creates booking | `hospital/Appoinment.php` | Yes | Yes |
| Hospital approves | `hospital/Appoinment.php` | Yes | Yes (commented out) |
| Assistant approves | `assistant/Appointment.php` | Yes | Yes |

### 9.3.3 Notification Content Pattern
Every notification contains:
- `title`: Always "Appointment updated"
- `body`: HTML string with clickable link to the appointment detail page (role-specific URL)
- `user_id`: Target user's ID (always a `users.id` reference)
- Notification bodies include `<b>`, `<a href>` tags (stored as HTML, potential XSS)

### 9.3.4 Notification Views
- **Patient**: `views/front/patient/notifications.php` - Uses Tabler UI, Bootstrap table, `format_date_time()` helper, `UNREAD` highlighted with `table-warning`
- **Doctor**: `views/doctor/notifications.php` - Uses AdminLTE UI, `warning` class for unread, `format_date_time()` helper
- **Receptionist, Assistant, Hospital, Pharmacist**: Each has their own Notifications controller under their respective view directories

### 9.3.5 Notification Architecture Issues
- No notification channel system (only in-app, no email/push)
- `update()` method updates ALL notifications for a user instead of a single one
- No bulk mark-as-read
- No notification preferences/settings
- Notifications are never deleted, only marked READ/UNREAD

---

## 9.4 Chat System

### 9.4.1 Booking_chat_model
- **Table**: `booking_chat`
- **Schema**: id, booking_id, from_id (users.id), to_id (users.id), message (text), status (READ/UNREAD), created_at
- **Methods**:
  - `create($data)` - Creates chat message with auto-timestamp
  - `update($id, $data)` - Updates a chat message
  - `getByAppointment($booking_id)` - Returns all messages for a booking with JOINs to `users` (as `fuser` and `tuser`) for `from_name` and `to_name`

### 9.4.2 Chat Flow Architecture
```
Patient ----AJAX POST----> appointment/send_chat_msg
                               |
                               v
                    Booking_chat_model->create()
                    (from_id=patient, to_id=receptionist_user_id)
                               |
                               v
                    DB: booking_chat table
                               ^
                               | (5-second polling)
                    get_all_chat_message() <-----AJAX POST---- Patient UI
                    get_all_chat_message() <-----AJAX POST---- Receptionist UI
```

### 9.4.3 Chat Participants
- **Patient <-> Receptionist**: Chat is enabled between patient and the doctor's assigned receptionist
- Chat is conditionally enabled: only if `$isCheckBoxEnable` is true (i.e., the doctor has a receptionist)
- Chat is disabled when appointment status is `VISITED` or `REJECTED`/`Canceled`
- **Doctor does NOT have chat** - The doctor appointment show view has no chat UI
- **Hospital can also chat** via `hospital/Appoinment` controller
- **Assistant does NOT have chat endpoints** (no `Booking_chat_model` loaded)

### 9.4.4 Chat UI Implementation
All three chat UIs (patient, receptionist, hospital) are nearly identical:
- jQuery `$.post()` for sending and receiving
- 5-second `setInterval` polling loop
- Renders messages as left/right-aligned bubbles with placeholder avatars from `placehold.it`
- Auto-scrolls to bottom on new messages
- No typing indicator, no read receipts, no file attachments
- No WebSocket/Server-Sent Events (pure polling)

### 9.4.5 Chat Security Issues
- Messages stored in plain text
- No message length limits
- No spam protection
- Status field exists but is never updated (all messages stay UNREAD)
- Bug in `receptionist/Appointment.php` show view: there's a stray `DGKPM4300J` text on line 229

---

## 9.5 Rating System

### 9.5.1 Doctor_rating_model
- **Table**: `doctor_rating`
- **Schema**: id (bigint), patient_id (int), doctor_id (int), star (int 1-5)
- **Methods**:
  - `create($data)` - Insert new rating
  - `update($id, $data)` - Update existing rating
  - `get_by_doctor_total_count($doctor_id)` - Total number of ratings
  - `get_average_rating($doctor_id)` - Calculates weighted average (5 separate COUNT queries, one per star level)
  - `get_by_patient_doctor($doctor_id, $patient_id)` - Check if patient already rated this doctor

### 9.5.2 Rating Consumers (controllers using Doctor_rating_model)
| Controller | Alias | Usage |
|-----------|-------|-------|
| `Api.php` | `doctor_rating` | POST endpoint for patient rating |
| `Doctors.php` | `doctor_rating` | Display doctor profile with rating |
| `Book.php` | `doctor_rating` | Show doctor rating on booking page |
| `doctor/Dashboard.php` | `doctor_rating` | Show own rating on dashboard |
| `assistant/Dashboard.php` | `doctor_rating` | Show doctor's rating on assistant dashboard |
| `receptionist/Dashboard.php` | `doctor_rating` | Show doctor's rating on receptionist dashboard |
| `hospital/Doctor.php` | `doctor_rating` | Show doctor rating in hospital doctor list |
| `pharmacist/Pharmacist.php` | `doctor_rating` | Show doctor rating in pharmacist view |
| `admin/Doctor.php` | `rating` | Show doctor rating in admin panel |

### 9.5.3 Rating Issues
- `get_average_rating()` uses 5 separate COUNT queries instead of a single GROUP BY
- No decimal precision handling in the star field (no half-star support)
- No review text field, only numeric star rating
- `Api.php` rate_us endpoint: no validation that star value is 1-5
- Rating is per patient-doctor pair (one rating per patient per doctor, updatable)

---

## 9.6 Search System

### 9.6.1 Search Controller (`/application/controllers/Search.php`)
- **Extends**: `Guest_controller` (public access)
- **Models loaded**: `Doctors_model`, `Hospital_model`, `City_model`, `Doctor_type_model`
- **Parameters**: `q` (query string), `city` (filter), `type` (specialization filter)
- **Methods**:
  - `get_search_users($q, $city, $type)` - Full-text-like search on doctors
  - `get_search_hospital($q, $city)` - Search hospitals by name
- Searches both doctors AND hospitals simultaneously
- Results rendered in `views/front/doctor/search.php`

---

## 9.7 Prescription System (Shared Across Roles)

### 9.7.1 Two Prescription Subsystems

The system has **two separate prescription mechanisms** that coexist:

#### A. Legacy Prescription (`Prescriptions_model`)
- **Table**: `prescriptions`
- **Schema**: id, booking_id, disease_description (text), medicine_details (JSON text: `[{Name, Description, Tab}]`), remark (text), created_by, user_id (doctor_id)
- **Used by**: `doctor/Appointment` (create_prescription, store_prescription, edit_prescription, update_prescription)
- **Simple structure**: One record per booking with JSON-encoded medicine list

#### B. Ajax Prescription System (`Ajaxprescription_model` + 6 sub-models)
- **Table**: `prescription` (singular)
- **Schema**: id, doc_id, patient_id, booking_id, next_visit (date), status, created_by, created_at, updated_at
- **Sub-tables** (all linked via `p_id` → `prescription.id`):
  - `p_cos` - Complaints/Observations (category, question, question_code)
  - `p_labels` - Custom labels with values and units
  - `p_medicine` - Individual medicine records (morning, afternoon, evening, tab, doz, description)
  - `p_suggestions` - Suggestions per question
  - `p_digno_table` - Diagnostic table configurations (rows, cols, header/footer labels)
  - `p_other_settings` - Per-doctor prescription print settings (logo, time, header)

### 9.7.2 Prescription Wizard (6-Step Flow)

The Ajax Prescription UI is a 6-step wizard:

```
Step 1: Category Details (CO)     [Stethoscope icon]
  → Select checkboxes from complaints/observations grouped by CO code
  → POST: ajax_insert_co {cos: [[co_code, question, question_code]], pre_id}

Step 2: Diagnosis Table           [File icon]
  → Table master configuration (dynamic rows/cols)

Step 3: Medicine Details          [Table icon]
  → Add medicines with autocomplete from doctor_medicine_list
  → Fields: name, doz, morning, afternoon, evening, tab, description
  → POST: ajax_insert_medi_list {lists: [[name,morning,afternoon,evening,tab,doz,desc]], pre_id}

Step 4: Suggestion Details        [List icon]
  → Checkboxes for predefined suggestions per question
  → Extra text field for custom suggestions
  → Next visit date picker
  → POST: ajax_insert_suggestion {sug: [[question, suggestion]], pre_id, next_date}

Step 5: Finish                    [Check icon]
  → Success animation
  → "Go Appointment" / "Print Prescription" buttons
```

### 9.7.3 Prescription Role Access

| Role | Legacy Prescription | Ajax Prescription | Print |
|------|--------------------|--------------------|-------|
| Doctor | Create/Edit/Store | Full 6-step wizard | Yes |
| Assistant | No | Full 6-step wizard (mirrored) | Yes |
| Patient | View only | View only (print_prescription via Appointment) | Yes |
| Pharmacist | View list | View detail per prescription | No (via controller) |
| Receptionist | No | No | No |
| Hospital | No | No | No |
| Admin | No | No | No |

### 9.7.4 Prescription Cross-Role Sharing
- The `doctor/AjaxPrescription/print_prescription` view is shared by Patient for printing (patient `Appointment.php` line 146 loads `doctor/AjaxPrescription/print_prescription`)
- Doctor and Assistant have near-identical AjaxPrescription views with only the URL prefix differing (`/doctor/` vs `/assistant/`)
- The AjaxPrescription controllers for doctor and assistant are functionally identical
- Pharmacist accesses via `pharmacist/Pharmacist.php` which loads all P_* models

### 9.7.5 Prescription Voice Input
- The Ajax Prescription views include **Web Speech API** integration
- Voice recognition activates on focus of medicine name input fields
- Uses `webkitSpeechRecognition` / `SpeechRecognition` API
- Animated GIF indicators (voice_on.gif / voice_off.gif)
- Recognition stops on input blur
- **Browser support**: Chrome only (no fallback)

### 9.7.6 Prescription Medicine Autocomplete
- Medicine data pre-loaded as PHP JSON into JavaScript (`<?= $list ?>` and `<?= $list_detail ?>`)
- Uses jQuery UI Autocomplete
- On selection, auto-fills: morning, afternoon, evening, tab, doz, description
- Source: `doctor_medicine_list` table (per-doctor medicine master)

---

## 9.8 Form Validation Rules

### 9.8.1 Config File: `/application/config/form_validation.php`

**22 validation rule groups defined:**

| Group Name | Fields Validated | Key Rules |
|-----------|-----------------|-----------|
| `register` | name, email, password, c_pass, mobile_no, terms | email unique in users, mobile unique, password min 6, terms required |
| `receptionist_patient_registration` | name, email, password, c_pass, mobile_no | Same as register but no terms field |
| `login` | email, password | Required only |
| `contry` | country_name | Required |
| `state` | state_name, county_id | Required |
| `city` | state_id, city_name | Required |
| `type` | type | Required |
| `disease` | dis_name | Required |
| `blog` | title, content, video_link | Required title/content, valid_url for video |
| `profile` | name, email, mobile_no, password, doctor_type, fees, address, description, eduction | Email/mobile unique, fees >= 2 and numeric |
| `doctor_profile` | name, doctor_type, fees, address, description, eduction | Same as profile minus email/mobile/password |
| `change_password` | current_pass, new_pass, conform_pass | Callback for current password verification, new matches conform |
| `patient_profile` | name, gender, mobile_no | Mobile unique |
| `register_receptionist` | name, email, password, c_pass, mobile_no | Same pattern as register |
| `register_receptionist_update` | name, password, c_pass | Password min 6, optional |
| `register_assistant` | name, email, password, c_pass, mobile_no | Same as register |
| `register_assistant_update` | name, password, c_pass | Same as receptionist_update |
| `admin_doctor` | name, password, mobile_no | Mobile unique |
| `receptionist_profile` | name | Required only |
| `assistant_profile` | name | Required only |
| `booking_by_patient` | petient_name, booking_date, age, description | Age numeric, description max 300 |
| `booking_by_receptionist` | mobile, petient_name, booking_date, age, description | Mobile optional, age numeric, description max 300 |
| `booking_by_hospital` | petient_name, booking_date, age, doctor_id, description | Doctor_id required, age numeric |
| `hospital_profile` | name | Required |
| `hospital_inquiry` | hospital_name, hospital_cotanct_no, email, contact_person_name, contact_person_mobile, address, city, state | All required, various max_length |
| `contact_us` | name, email, subject, message | All required, valid_email, various length ranges |
| `medicine` | name, morning, afternoon, evening, tab, doz[] | All required, doz is array |
| `co` | co_code | Required |
| `questions` | question, co_id, question_code | All required |
| `label` | label_title | Required |
| `register_pharmacist` | name, email, password, c_pass, mobile_no | Same as register |
| `register_pharmacist_update` | name, password, c_pass | Same as receptionist_update |
| `pharmacist_profile` | name | Required only |

### 9.8.2 Validation Issues
- **Typo**: `county_id` instead of `country_id` in state validation
- **Typo**: `contry` instead of `country` as group name
- **Typo**: `petient_name` instead of `patient_name` (throughout entire codebase)
- **Typo**: `eduction` instead of `education` (throughout entire codebase)
- **Typo**: `conform_pass` instead of `confirm_pass` (throughout entire codebase)
- **Typo**: `cotanct_no` instead of `contact_no` (in hospital_inquiry)
- No CSRF token validation in any form
- `is_unique[users.email]` and `is_unique[users.mobile_no]` will fail on profile update (no exclusion for current user ID)

---

## 9.9 Helper Functions

### 9.9.1 date_formater_helper.php

| Function | Signature | Output Format | Usage |
|----------|-----------|---------------|-------|
| `format_date()` | `format_date($date)` | `d-m-Y` | Used in all appointment views, notification views |
| `format_date_time()` | `format_date_time($date_time)` | `d-m-Y H:i:s` | Used in all notification views |

### 9.9.2 Helpers Used
- `base_url()` - CodeIgniter built-in
- `format_date()` / `format_date_time()` - Custom date formatting
- `form_error()` - CodeIgniter form validation error display
- `set_value()` - CodeIgniter form repopulation

---

## 9.10 Common UI Patterns

### 9.10.1 JavaScript Libraries
| Library | Usage | Files |
|---------|-------|-------|
| jQuery 2.1.3 | Core DOM manipulation, AJAX | All views with chat, AjaxPrescription |
| jQuery UI | Autocomplete (medicine search) | AjaxPrescription views |
| PNotify | Notification popups (success/error) | AjaxPrescription views |
| Web Speech API | Voice input for medicine names | AjaxPrescription views |
| SweetAlert (implied) | Alert dialogs via `_alertInfoResponce()` | All AdminLTE-based controllers |

### 9.10.2 UI Framework Usage

| UI Framework | Used By |
|-------------|---------|
| **Tabler** (Bootstrap 4 based) | Patient front-end views |
| **AdminLTE 2** (Bootstrap 3 based) | Doctor, Receptionist, Assistant, Hospital, Pharmacist, Admin |
| **Plain Bootstrap** | Some guest/public pages |

### 9.10.3 CSS Icon Libraries
| Library | Used By |
|---------|---------|
| **Feather Icons** (`fe fe-*`) | Patient front-end (Tabler) |
| **Font Awesome** (`fa fa-*`) | AdminLTE panels (Doctor, Receptionist, etc.) |
| **Glyphicons** (`glyphicon glyphicon-*`) | Chat UI, AdminLTE panels |

### 9.10.4 Common UI Components
- **DataTables**: Referenced via `dttable` CSS class but not explicitly initialized in the files read
- **Wizard/Stepper**: Custom CSS wizard in AjaxPrescription (6-step tab navigation)
- **Accordion**: Custom CSS accordion for CO categories in prescription
- **Chat bubbles**: Custom CSS left/right aligned chat messages
- **Status badges**: `tag-*` (Tabler) and `label-*` (AdminLTE) for appointment status
- **Autocomplete**: jQuery UI autocomplete for medicine names

---

# Phase 10: Module Connection Map

## 10.1 Database ER Diagram (Text-Based)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CENTRAL TABLE: users                            │
│  id(PK), name, gender, role, status, email, password, mobile_no,       │
│  profile_img, created_at, updated_at, mobile_verified_at,               │
│  email_verified_at                                                     │
└──────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┘
       │          │          │          │          │          │
       │ 1:1      │ 1:1      │ 1:N      │ 1:1      │ 1:1      │ 1:N
       ▼          ▼          ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ doctors  │ │hospital  │ │receptionist│ │doctor_   │ │doctor_   │ │doctor_   │
│          │ │          │ │          │ │assistants│ │pharmacist│ │rating   │
│user_id→ │ │user_id→ │ │user_id→ │ │user_id→ │ │user_id→ │ │patient_id│
│users.id  │ │users.id  │ │users.id  │ │users.id  │ │users.id  │ │doctor_id │
│          │ │          │ │doctor_id→│ │doctor_id→│ │doctor_id→│ │→users.id│
│hospital_ │ │          │ │users.id  │ │users.id  │ │users.id  │ └──────────┘
│id→users  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘
│.id       │
│doctor_   │       ┌──────────────────────────────────────────────────┐
│type→     │       │              BOOKING: booking                     │
│doctor_   │       │ id, appointment_no, doctor_id→users.id,          │
│type_mstr │       │ user_id→users.id, booking_date, petient_name,    │
│          │       │ disease, description, gender, date_of_birth,     │
└──────────┘       │ age, relation_with_me, blood_group, weight,      │
       │          │ height, physical_handicape, status, booking_type,  │
       │          │ appointment_charge, created_at, updated_at        │
       │          └──────┬───────────────────┬────────────────────────┘
       │                 │                   │
       │                 │ 1:N               │ 1:1
       │                 ▼                   ▼
       │    ┌──────────────────┐  ┌──────────────────────┐
       │    │   booking_chat   │  │ prescriptions         │
       │    │ booking_id→      │  │ booking_id→booking.id │
       │    │ booking.id       │  │ user_id→users.id     │
       │    │ from_id→users.id │  │ (doctor_id)          │
       │    │ to_id→users.id   │  │ disease_description  │
       │    │ message, status  │  │ medicine_details     │
       │    │ created_at       │  │ (JSON), remark       │
       │    └──────────────────┘  └──────────────────────┘
       │
       │          AJAX PRESCRIPTION SYSTEM
       │                 │
       │                 ▼
       │    ┌──────────────────────────────────────────┐
       │    │        prescription (singular)           │
       │    │ id, doc_id→users.id, patient_id→users.id,  │
       │    │ booking_id→booking.id, next_visit, status, │
       │    │ created_by, created_at, updated_at        │
       │    └────┬──────┬──────┬──────┬──────┬──────────┘
       │         │      │      │      │      │
       │         │1:N   │1:N   │1:N   │1:N   │1:N
       │         ▼      ▼      ▼      ▼      ▼
       │    ┌────────┐┌────────┐┌────────┐┌────────┐┌────────────┐
       │    │ p_cos  ││p_labels││p_medi- ││p_sugges││p_digno_   │
       │    │ p_id→  ││ p_id→  ││cine    ││tions   ││table      │
       │    │presc.  ││presc.  ││ p_id→  ││ p_id→  ││ p_id→     │
       │    │id      ││id      ││presc.id││presc.id││presc.id   │
       │    │co,ques-││label,  ││medi-   ││question,││rows,cols, │
       │    │tion,   ││l_value,││cine,   ││sugges- ││header/    │
       │    │code    ││unit    ││morning,││tions   ││footer_lbl │
       │    └────────┘│        ││after_  │└────────┘└────────────┘
       │             └────────┘│noon,   │
       │                        │evening,│
       │                        │tab,doz │
       │                        └────────┘
       │
       │    DOCTOR MASTER DATA (per doctor)
       │    ┌─────────────────────────────────────────────────────┐
       │    │ co_master (created_by→users.id, doctor_id→users.id) │
       │    │ questions_master (co_id→co_master.id)              │
       │    │ suggestions_master (question_id→questions_master.id)│
       │    │ label_master (created_by→users.id, doctor_id→users.id)│
       │    │ doctor_medicine_list (user_id→users.id)            │
       │    │ table_master (doctor_id→users.id)                  │
       │    │ doctor_holiday_schedule (user_id→users.id)          │
       │    │ p_other_settings (doctor_id→users.id)               │
       │    └─────────────────────────────────────────────────────┘
       │
       │    OTHER TABLES
       │    ┌──────────────────┐ ┌──────────────────┐
       │    │  notifications   │ │  reset_password  │
       │    │ user_id→users.id │ │  email, token    │
       │    │ title, body,     │ │  created_at      │
       │    │ status(READ/     │ └──────────────────┘
       │    │ UNREAD)          │ ┌──────────────────┐
       │    └──────────────────┘ │ hospital_inquiry │
       │                        │ (standalone, no  │
       │    ┌──────────────────┐ │  FK to users)    │
       │    │  posts          │ └──────────────────┘
       │    │ user_id→users.id │ ┌──────────────────┐
       │    │ title, content, │ │  config          │
       │    │ type(Blog/news), │ │  admin_charge    │
       │    │ status          │ │  (single row)    │
       │    └──────────────────┘ └──────────────────┘
       │
       │    LOCALIZATION
       │    ┌──────────┐     ┌──────────┐
       │    │country_  │1:N │state_   │1:N │city_  │
       │    │mstr      │────→│mstr     │────→│mstr   │
       │    └──────────┘     │county_id│    │state_id│
       │                      └──────────┘    └────────┘
       │
       │    LOOKUP TABLES
       │    ┌──────────────────┐ ┌──────────────────┐
       │    │ doctor_type_mstr │ │  disease_master   │
       │    │ type, status     │ │  dis_name, status │
       │    └──────────────────┘ └──────────────────┘
       │    ┌──────────────────┐ ┌──────────────────┐
       │    │     slider        │ │  schedule_pdf     │
       │    │ slider_image,    │ │  hospital_id,     │
       │    │ position, status │ │  file_name        │
       │    └──────────────────┘ └──────────────────┘
```

---

## 10.2 Table Relationships

### Explicit Foreign Keys (column naming convention `*_id`)

| Child Table | Column | Parent Table | Relationship |
|------------|--------|-------------|--------------|
| `doctors` | `user_id` | `users` | 1:1 (doctor profile) |
| `doctors` | `hospital_id` | `users` | N:1 (doctor belongs to hospital) |
| `doctors` | `doctor_type` | `doctor_type_mstr.type` | N:1 (implicit, string match) |
| `hospital` | `user_id` | `users` | 1:1 (hospital profile) |
| `receptionist` | `user_id` | `users` | 1:1 (receptionist profile) |
| `receptionist` | `doctor_id` | `users` | N:1 (receptionist works for doctor) |
| `doctor_assistants` | `user_id` | `users` | 1:1 (assistant profile) |
| `doctor_assistants` | `doctor_id` | `users` | N:1 (assistant works for doctor) |
| `doctor_pharmacist` | `user_id` | `users` | 1:1 (pharmacist profile) |
| `doctor_pharmacist` | `doctor_id` | `users` | N:1 (pharmacist works for doctor) |
| `doctor_rating` | `patient_id` | `users` | N:1 (rater) |
| `doctor_rating` | `doctor_id` | `users` | N:1 (rated doctor) |
| `booking` | `doctor_id` | `users` | N:1 (booking with doctor) |
| `booking` | `user_id` | `users` | N:1 (patient who booked, nullable) |
| `booking_chat` | `booking_id` | `booking` | N:1 (chat belongs to booking) |
| `booking_chat` | `from_id` | `users` | N:1 (message sender) |
| `booking_chat` | `to_id` | `users` | N:1 (message receiver) |
| `notifications` | `user_id` | `users` | N:1 (notification target) |
| `prescription` | `doc_id` | `users` | N:1 (prescribing doctor) |
| `prescription` | `patient_id` | `users` | N:1 (patient) |
| `prescription` | `booking_id` | `booking` | 1:1 (one prescription per booking) |
| `prescriptions` | `booking_id` | `booking` | 1:1 (legacy prescription per booking) |
| `prescriptions` | `user_id` | `users` | N:1 (prescribing doctor) |
| `p_cos` | `p_id` | `prescription` | N:1 (COs for prescription) |
| `p_labels` | `p_id` | `prescription` | N:1 (labels for prescription) |
| `p_medicine` | `p_id` | `prescription` | N:1 (medicines for prescription) |
| `p_suggestions` | `p_id` | `prescription` | N:1 (suggestions for prescription) |
| `p_digno_table` | `p_id` | `prescription` | N:1 (diag table for prescription) |
| `p_other_settings` | `doctor_id` | `users` | N:1 (per-doctor settings) |
| `co_master` | `created_by` | `users` | N:1 (creator) |
| `co_master` | `doctor_id` | `users` | N:1 (owner doctor) |
| `questions_master` | `co_id` | `co_master` | N:1 (question belongs to CO) |
| `questions_master` | `doctor_id` | `users` | N:1 (owner doctor) |
| `suggestions_master` | `question_id` | `questions_master` | N:1 (suggestion for question) |
| `suggestions_master` | `doctor_id` | `users` | N:1 (owner doctor) |
| `label_master` | `doctor_id` | `users` | N:1 (owner doctor) |
| `doctor_medicine_list` | `user_id` | `users` | N:1 (owner doctor) |
| `doctor_holiday_schedule` | `user_id` | `users` | N:1 (doctor's holidays) |
| `table_master` | `doctor_id` | `users` | N:1 (owner doctor) |
| `posts` | `user_id` | `users` | N:1 (post author) |
| `state_mstr` | `county_id` | `country_mstr` | N:1 |
| `city_mstr` | `state_id` | `state_mstr` | N:1 |
| `schedule_pdf` | `hospital_id` | `users` | N:1 |

### No Foreign Key Constraints in Database
**CRITICAL**: The SQL schema has ZERO `FOREIGN KEY` constraints. All relationships are implicit via column naming conventions only. No referential integrity at the database level.

---

## 10.3 Controller-Model Dependencies

### Complete Dependency Map

```
Guest_controller (public)
├── Api.php → Doctor_rating_model
├── Auth.php → Users_model, Reset_password_model
├── Book.php → Booking_model, Doctors_model, Users_model, Notifications_model,
│              Doctor_rating_model, Receptionist_model, Config_model,
│              City_model, State_model, Hospital_model, Doctor_holiday_schedule_model
├── Blog.php → Posts_model
├── Contactus.php → (unknown)
├── Doctors.php → Doctors_model, Hospital_model, Doctor_rating_model
├── Home.php → Doctors_model, Hospital_model, Posts_model, Slider_model
├── Hospitals.php → Hospital_model, Doctors_model, Schedule_pdf_model
├── Inquiry.php → Hospital_inquiry_model
├── Post.php → Posts_model
├── Profile.php → User_model (patient profile)
├── Search.php → Doctors_model, Hospital_model, City_model, Doctor_type_model
└── Crownjob.php → Users_model

Patient_contoller (patient role)
├── Appointment.php → Booking_model, Notifications_model, Receptionist_model,
│                     Booking_chat_model, Prescriptions_model, Ajaxprescription_model,
│                     P_Co_model, P_Label_model, P_digno_model, P_medicine_model,
│                     P_Suggestion_model, P_other_setting_model, Doctors_model, Users_model
└── Notifications.php → (inherited from MY_Controller)

Doctor_controller (doctor role)
├── Appointment.php → Booking_model, Notifications_model, Prescriptions_model,
│                     Receptionist_model, Doctor_medicine_list_model, P_medicine_model
├── AjaxPrescription.php → Ajaxprescription_model, Booking_model, Users_model,
│                          Co_model, Questions_model, Suggestions_model,
│                          Label_model, Doctor_medicine_list_model,
│                          P_Co_model, P_Label_model, P_digno_model,
│                          P_medicine_model, P_Suggestion_model, P_other_setting_model
├── Assistant.php → Doctor_assistants_model
├── Co.php → Co_model, Questions_model
├── Dashboard.php → Booking_model, Doctors_model, Doctor_rating_model, Posts_model
├── Gallery.php → (unknown)
├── Notifications.php → (inherited)
├── Pharmacist.php → Doctor_pharmacist_model
├── Post.php → Posts_model
├── Profile.php → Doctors_model, City_model, State_model
├── Questions.php → Questions_model
├── Receptionist.php → Receptionist_model, Users_model
├── Report.php → Booking_model, Disease_model
├── Schedule.php → Doctor_holiday_schedule_model
├── Suggestions.php → Questions_model, Suggestions_model
├── Table_master.php → Table_master_model
└── P_other_setting.php → P_other_setting_model

Assistant_controller
├── Appointment.php → Booking_model, Notifications_model, Receptionist_model,
│                     Booking_chat_model (not loaded - BUG), Prescriptions_model,
│                     Doctor_assistants_model, Doctor_holiday_schedule_model,
│                     Doctors_model, Config_model, Users_model
├── AjaxPrescription.php → (mirrors doctor/AjaxPrescription.php models)
├── Dashboard.php → Booking_model, Doctors_model, Doctor_rating_model
├── Notifications.php → (inherited)
├── Post.php → Posts_model
└── Profile.php → Users_model

Reception_contoller (receptionist role)
├── Appointment.php → Booking_model, Notifications_model, Booking_chat_model,
│                     Doctor_assistants_model, Doctor_holiday_schedule_model,
│                     Doctors_model, Receptionist_model, Config_model, Users_model
├── Dashboard.php → Booking_model, Doctors_model, Hospital_model,
│                     Doctor_rating_model, Receptionist_model, Posts_model
├── Medicinemaster.php → Receptionist_model, Doctor_medicine_list_model
├── Notifications.php → (inherited)
├── Post.php → Posts_model
├── Profile.php → Receptionist_model, Users_model
├── Registration.php → (unknown)
└── Schedule.php → Doctor_holiday_schedule_model, Doctors_model, Receptionist_model

Hospital_contoller
├── Appoinment.php → Booking_model, Doctors_model, Notifications_model,
│                    Booking_chat_model, Config_model, Users_model
├── Blog.php → Posts_model, Users_model
├── Dashboard.php → Booking_model, Doctors_model, Hospital_model,
│                    Posts_model, Users_model
├── Doctor.php → Doctors_model, Doctor_rating_model, Disease_model,
│               Doctor_type_model, Hospital_model, Receptionist_model,
│               Schedule_pdf_model, Users_model
├── Income.php → Booking_model, Doctors_model, Disease_model,
│               Hospital_model, Receptionist_model, Users_model
├── Profile.php → City_model, Hospital_model, Posts_model, State_model, Users_model
└── Registration.php → (unknown)

Admin_contoller
├── Appointment.php → Booking_model, Users_model
├── Assistant.php → Doctor_assistants_model, Users_model
├── Blog.php → Posts_model, Users_model
├── Config.php → Config_model, Users_model
├── Dashboard.php → Posts_model, Booking_model, Users_model
├── Disease_master.php → Disease_model, Users_model
├── Doctor.php → Doctors_model, City_model, Disease_model, Doctor_type_model,
│               Doctor_rating_model, Receptionist_model, State_model, Users_model
├── Hospital.php → Hospital_model, City_model, State_model, Users_model
├── Inquiry.php → Hospital_inquiry_model
├── Localization.php → Country_model, State_model, City_model, Users_model
├── Patient.php → Patient_model, Users_model
├── Post.php → Posts_model, Users_model
├── Receptionist.php → Receptionist_model, Users_model
├── Report.php → Booking_model, Users_model
├── Slider.php → Slider_model, Users_model
└── Type_master.php → Doctor_type_model, Users_model

Pharmacist_contoller
├── Pharmacist.php → Booking_model, Doctors_model, Doctor_rating_model,
│                    Ajaxprescription_model, Prescriptions_model, Co_model,
│                    Questions_model, Suggestions_model, Label_model,
│                    Doctor_medicine_list_model, Doctor_pharmacist_model,
│                    Hospital_model, P_Co_model, P_Label_model, P_digno_model,
│                    P_medicine_model, P_Suggestion_model, P_other_setting_model,
│                    Users_model, Table_master_model
└── Profile.php → Doctor_pharmacist_model, Users_model
```

### Most-Used Models (by number of controllers)

| Rank | Model | Used By Count | Controllers |
|------|-------|--------------|-------------|
| 1 | `Users_model` | 20+ | Almost every controller |
| 2 | `Booking_model` | 10+ | Appointment, Dashboard, Report, Admin |
| 3 | `Notifications_model` | 6 | All Appointment controllers, Book |
| 4 | `Doctors_model` | 10+ | Dashboard, Search, Doctor management |
| 5 | `Doctor_rating_model` | 7 | Dashboard controllers, API, Search |
| 6 | `Receptionist_model` | 7 | Doctor/Receptionist/Hospital Appointment, Profile |
| 7 | `Posts_model` | 6 | Blog, Dashboard, Post controllers |
| 8 | `Prescriptions_model` | 4 | Doctor/Assistant/Patient/Pharmacist Appointment |
| 9 | `Booking_chat_model` | 3 | Patient/Receptionist/Hospital Appointment |
| 10 | `Hospital_model` | 5 | Dashboard, Search, Profile, Doctor |

---

## 10.4 Cross-Module Data Flows

### 10.4.1 Booking Lifecycle Data Flow

```
[Patient/Guest/Hospital/Receptionist]
         │
         ▼
    ┌─────────────┐
    │  Book.php   │──→ Booking_model->create()  ──→ DB: booking (status: Pending)
    │  (or others)│──→ Notifications_model->create() ──→ DB: notifications
    └─────────────┘         │                                    (to doctor + receptionist)
                            │
                   ┌────────┴────────┐
                   ▼                 ▼
            [Doctor]          [Receptionist]
                │                   │
                ▼                   ▼
        approve/extend/     approve/extend/
        visited/cancel      visited/reject
                │                   │
                ▼                   ▼
        Booking_model->    Booking_model->
        update(status)      update(status)
                │                   │
                ▼                   ▼
        Notifications_      Notifications_
        model->create()      model->create()
        (to patient +       (to patient +
         receptionist)        doctor)
                │                   │
                ▼                   │
        [If VISITED]              │
            │                     │
            ▼                     │
    ┌───────────────────┐        │
    │ Create Prescription│        │
    │ (Legacy or Ajax)  │        │
    └───────┬───────────┘        │
            │                     │
            ▼                     │
    prescription/prescriptions   │
    + p_cos, p_medicine, etc.    │
            │                     │
            ▼                     │
    [Patient views prescription]│
    [Pharmacist views prescription]
```

### 10.4.2 Chat Data Flow

```
[Patient]                    [Receptionist/Hospital]
    │                              │
    │  $.post(send_chat_msg)       │
    │  {appointId, msg}            │
    ▼                              │
Appointment.php                   │
send_chat_msg()                   │
    │                              │
    ├─→ Look up receptionist       │
    │   for this doctor            │
    │                              │
    ├─→ Booking_chat_model->       │
    │   create({                   │
    │     booking_id,              │
    │     from_id: patient,        │
    │     to_id: receptionist,     │
    │     message,                 │
    │     status: UNREAD           │
    │   })                         │
    │                              │
    ▼                              ▼
                DB: booking_chat
                     │
       ┌─────────┴─────────┐
       │ (5-sec polling)   │
       ▼                   ▼
  get_all_chat_msg() get_all_chat_msg()
  (patient)            (receptionist)
       │                   │
       ▼                   ▼
  [Patient UI]        [Receptionist UI]
  (chat bubbles)      (chat bubbles)
```

### 10.4.3 Rating Data Flow

```
[Patient on Doctor Profile]
         │
         ▼
    Api.php::rate_us() POST {patient, doctor, star}
         │
         ├─→ Check if existing: Doctor_rating_model->get_by_patient_doctor()
         │
         ├─→ [EXISTS] → Doctor_rating_model->update(star)
         │
         └─→ [NEW] → Doctor_rating_model->create({patient_id, doctor_id, star})
                      │
                      ▼
              DB: doctor_rating
                      │
                      ▼
    Doctor_rating_model->get_average_rating() ← Used by 7+ dashboard/detail views
    Doctor_rating_model->get_by_doctor_total_count() ← Used by profile views
```

### 10.4.4 Prescription Data Flow

```
[Doctor or Assistant]
         │
         ▼
    AjaxPrescription::create?booking_id=X&user_id=Y
         │
         ├─→ Ajaxprescription_model->check_doctor_booking()
         │
         ├─→ Ajaxprescription_model->check_user_prescription()
         │   │
         │   ├─→ [EXISTS] → Load existing prescription
         │   │
         │   └─→ [NEW] → Ajaxprescription_model->create_prescription()
         │                  → Booking_model->update(status: VISITED)
         │
         ▼
    [6-Step Wizard UI]
         │
         ├─ Step 1: ajax_insert_co → P_Co_model (delete old + insert_batch)
         ├─ Step 2: p_digno_table → P_digno_model (create or check)
         ├─ Step 3: ajax_insert_medi_list → P_medicine_model (delete old + insert_batch)
         ├─ Step 4: ajax_insert_suggestion → P_Suggestion_model (delete old + insert_batch)
         └─ Step 5: ajax_insert_labels → P_Label_model (delete old + insert_batch)
                    │
                    ▼
    print_prescription → Aggregates ALL sub-tables into print view
                    │
                    ▼
    [Patient prints via Appointment::print_prescription]
    → Reuses doctor/AjaxPrescription/print_prescription view
```

### 10.4.5 Notification Cascade Pattern

Every status change follows this pattern:

```
Action (approve/extend/visited/cancel)
         │
         ├─ 1. Lookup appointment
         ├─ 2. Check status transition is valid
         ├─ 3. Update booking status
         ├─ 4. Build notification for USER A (with HTML link)
         ├─ 5. Notifications_model->create() for USER A
         ├─ 6. Lookup receptionist for this doctor
         ├─ 7. If receptionist exists:
         │      Build notification for receptionist
         │      Notifications_model->create() for receptionist
         └─ 8. Redirect with flash message
```

### 10.4.6 Authentication & Password Reset Flow

```
[User Login]
    │
    ▼
Auth.php::login()
    │
    ├─→ Users_model->check_auth() [supports email OR mobile login]
    │   │
    │   ├─→ [is_numeric] → match mobile_no + password
    │   └─→ [else] → match email + password
    │
    ├─→ Set session: id, name, email, role, status, mobile_no, profile_img
    └─→ Redirect by role

[Forgot Password]
    │
    ▼
Auth.php::forgot()
    │
    ├─→ Users_model->get_by_email_for_forgot_password() or
    │   Users_model->get_by_mobile_for_forgot_password()
    │
    ├─→ Generate token
    │
    ├─→ Reset_password_model->create({email, token})
    │
    ├─→ Send email with reset link
    │
    └─→ [User clicks link]
         │
         ▼
    Auth.php::reset_password()
         │
         ├─→ Reset_password_model->get_by_email_token()
         │
         ├─→ Users_model->update(new_password)
         │
         └─→ Reset_password_model->destroy(email)
```

---

## 10.5 State Machines

### 10.5.1 Booking Status State Machine

```
                    ┌──────────────────────┐
                    │                      │
         ┌─────────│      PENDING          │
         │         │   (Initial State)     │
         │         │                      │
         │         └──────────┬───────────┘
         │                    │
         │         ┌─────────┼──────────┐
         │         │         │          │
         │         ▼         │          ▼
         │  ┌─────────────┐  │   ┌─────────────┐
         │  │   EXTEND    │  │   │  APPROVE    │
         │  │             │  │   │             │
         │  └──────┬──────┘  │   └──────┬──────┘
         │         │         │          │
         │         │         │   ┌──────┼──────┐
         │         │         │   │      │      │
         │         │         │   ▼      │      ▼
         │         │         │┌────────┐ │ ┌─────────┐
         │         │         ││VISITED │ │ │CANCELED │
         │         │         ││(Final) │ │ │(Final)  │
         │         │         │└────────┘ │ └─────────┘
         │         │         │           │
         │         └─────────┤           │
         │                   │           │
    ┌────┴────┐              │           │
    │ CANCELED │◄─────────────┘           │
    │ (Final)  │◄─────────────────────────┘
    └──────────┘

TERMINAL STATES: VISITED, CANCELED

Valid Transitions:
  PENDING  → APPROVE   (by doctor, receptionist, hospital, assistant)
  PENDING  → EXTEND    (by doctor, receptionist)
  PENDING  → CANCELED  (by patient [cancel], doctor [cancel], receptionist [reject])
  EXTEND   → APPROVE   (by doctor, receptionist)
  EXTEND   → CANCELED  (by doctor [cancel], receptionist [reject])
  APPROVE  → VISITED   (by doctor, receptionist)
  APPROVE  → CANCELED  (by doctor [cancel], receptionist [reject])

Invalid Transitions (blocked in code):
  VISITED → * (any further change blocked)
  CANCELED → * (any further change blocked)
  APPROVE → EXTEND (not allowed)
  APPROVE → PENDING (not allowed)

Special: Prescription creation sets status to VISITED (via AjaxPrescription controller)
```

### 10.5.2 User Status State Machine

```
    ┌─────────────┐
    │   PENDING   │  ← New registration (except admin)
    │  (Initial)  │
    └──────┬──────┘
           │
           │ (admin activates via admin/Doctor or admin/Patient)
           ▼
    ┌─────────────┐
    │   ACTIVE    │◄─────┐
    │             │      │
    └──────┬──────┘      │
           │             │
           │ (admin blocks)│
           ▼             │
    ┌─────────────┐      │
    │    BLOCK    │──────┘
    │             │  (admin unblocks)
    └─────────────┘

NOTE: Users_model has confusing method names:
  - update_status_active($id) actually sets status to BLOCK
  - update_status_block($id) actually sets status to ACTIVE
  (This is a BUG - method names are swapped)

Special Cases:
  - Admin user is created with ACTIVE status (no approval needed)
  - Patient email check: forgot_email_exits() checks for PENDING status
  - Patient login: check_auth_after_login() blocks login if status = BLOCK
```

### 10.5.3 Notification Status Machine

```
    ┌─────────────┐
    │   UNREAD    │  ← All new notifications
    └──────┬──────┘
           │
           │ (user views notifications page - implicitly read via display)
           ▼
    ┌─────────────┐
    │    READ     │
    └─────────────┘

NOTE: No explicit mark-as-read action exists in the code.
The Notifications_model->update() method takes user_id (not notification_id),
which would update ALL notifications for a user at once.
```

### 10.5.4 Post/Blog Status Machine

```
    ┌─────────────┐
    │  Published   │  ← Created as published
    └──────┬──────┘
           │
           │ (toggle)
           ▼
    ┌─────────────┐
    │    Draft     │
    └─────────────┘
```

---

## 10.6 Shared Components

### 10.6.1 Models Used by Multiple Controllers

| Model | Controllers Using It |
|-------|----------------------|
| `Users_model` | Auth, Crownjob, Profile (all roles), Dashboard (all), Admin (all), Search, Book, Appointment (all), Doctor management, Pharmacist |
| `Booking_model` | Appointment (patient/doctor/receptionist/hospital/assistant), Dashboard (admin/doctor/receptionist/hospital), Report (admin/doctor), Book |
| `Notifications_model` | Appointment (patient/doctor/receptionist/hospital/assistant), Book |
| `Doctor_rating_model` | Api, Doctors, Book, Dashboard (doctor/assistant/receptionist), Hospital/Doctor, Pharmacist, admin/Doctor |
| `Receptionist_model` | Appointment (patient/doctor/receptionist/hospital), Doctor/Receptionist management, admin/Doctor, Medicinemaster |
| `Doctors_model` | Search, Doctors, Home, Hospitals, Dashboard (doctor/receptionist/hospital), Appointment (receptionist/hospital/assistant), Income, Pharmacist |
| `Prescriptions_model` | Appointment (patient/doctor/assistant), Pharmacist |
| `Ajaxprescription_model` | Appointment (patient for print), AjaxPrescription (doctor/assistant), Pharmacist |
| `P_Co_model` | AjaxPrescription (doctor/assistant), Appointment (patient for print), Pharmacist |
| `P_Label_model` | AjaxPrescription (doctor/assistant), Appointment (patient for print), Pharmacist |
| `P_medicine_model` | AjaxPrescription (doctor/assistant), Appointment (patient for print), Pharmacist, doctor/Appointment |
| `P_Suggestion_model` | AjaxPrescription (doctor/assistant), Appointment (patient for print), Pharmacist |
| `P_digno_model` | AjaxPrescription (doctor/assistant), Appointment (patient for print), Pharmacist |
| `P_other_setting_model` | AjaxPrescription (doctor/assistant), Appointment (patient for print), Pharmacist, doctor/P_other_setting |
| `Posts_model` | Blog, Dashboard (admin/doctor/receptionist/hospital), Post (all), Home |
| `Hospital_model` | Search, Doctors, Home, Hospitals, Dashboard (receptionist/hospital), Doctor/Income/Profile (hospital), admin/Hospital |
| `Config_model` | Book, Appointment (receptionist/hospital/assistant), admin/Config |
| `City_model` | Search, Book, admin/Doctor, admin/Hospital, doctor/Profile, hospital/Profile |
| `State_model` | Search, Book, admin/Doctor, admin/Hospital, doctor/Profile, hospital/Profile |
| `Booking_chat_model` | Appointment (patient/receptionist/hospital) |
| `Doctor_medicine_list_model` | doctor/Appointment, doctor/AjaxPrescription, receptionist/Medicinemaster, Pharmacist |

### 10.6.2 Views Shared Between Roles

| View Path | Used By |
|-----------|---------|
| `doctor/AjaxPrescription/print_prescription.php` | Patient (Appointment::print_prescription), Doctor, Assistant (implied) |
| `doctor/AjaxPrescription/index.php` | Doctor (near-identical copy at `assistant/AjaxPrescription/index.php`) |
| `layouts/master_page_doctors.php` | All doctor sub-controllers |
| `layouts/master_page_front.php` | All patient/guest controllers |

### 10.6.3 Layout Files

| Layout | Base Controller | Used By Roles |
|--------|----------------|--------------|
| `layouts/master_page_front.php` | Guest_controller, Patient_contoller | Public, Patient |
| `layouts/master_page_doctors.php` | Doctor_controller | Doctor |
| AdminLTE layout | Reception_contoller, Assistant_controller, Hospital_contoller, Admin_contoller, Pharmacist_contoller | Receptionist, Assistant, Hospital, Admin, Pharmacist |

### 10.6.4 Controller Inheritance Hierarchy

```
CI_Controller
└── MY_Controller
    ├── Guest_controller         → Public pages (Home, Search, Doctors, Hospitals, Blog, Auth, API, Crownjob)
    ├── Patient_contoller       → Patient dashboard (Appointment, Profile, Notifications, Post)
    ├── Doctor_controller       → Doctor dashboard (Appointment, AjaxPrescription, Co, Questions, etc.)
    ├── Reception_contoller     → Receptionist dashboard (Appointment, Dashboard, Schedule, etc.)
    ├── Assistant_controller    → Assistant dashboard (Appointment, AjaxPrescription, Dashboard, etc.)
    ├── Hospital_contoller      → Hospital dashboard (Doctor, Appoinment, Income, Blog, etc.)
    ├── Admin_contoller         → Admin panel (Doctor, Hospital, Patient, Dashboard, Config, etc.)
    └── Pharmacist_contoller    → Pharmacist panel (Pharmacist, Profile)
```

### 10.6.5 Auto-Loaded Models in Base Controllers

| Base Controller | Auto-loaded Models |
|----------------|-------------------|
| `MY_Controller` | None (common helper methods) |
| `Doctor_controller` | `Users_model` (as `user`), `Notifications_model` (as `notification`), `Receptionist_model` (as `receptionist`), `Doctors_model` (as `doctor`) |
| `Patient_contoller` | `Users_model` (as `user`), `Notifications_model` (as `notification`) |
| `Reception_contoller` | `Users_model` (as `user`), `Notifications_model` (as `notification`) |
| `Assistant_controller` | `Users_model` (as `user`), `Notifications_model` (as `notification`) |
| `Hospital_contoller` | `Users_model` (as `user`), `Notifications_model` (as `notification`) |
| `Admin_contoller` | `Users_model` (as `user`), `Notifications_model` (as `notification`) |
| `Pharmacist_contoller` | `Users_model` (as `user`), `Notifications_model` (as `notification`) |

---

## 10.7 Complete Feature Dependency Graph

```
╔══════════════════════════════════════════════════════════════════════╗
║                    DOCTOROOMS FEATURE DEPENDENCY GRAPH              ║
╚══════════════════════════════════════════════════════════════════════╝

                    ┌─────────────────┐
                    │  users (TABLE)   │ ◄── CORE: Everything depends on this
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │   doctors    │  │   hospital   │  │  role-based  │
   │   profile    │  │   profile    │  │  sub-tables  │
   └──────┬───────┘  └──────┬───────┘  │ (receptionist│
          │                 │          │  assistants,  │
          │                 │          │  pharmacist) │
          │                 │          └──────┬───────┘
          │                 │                 │
          └────────┬────────┘                 │
                   │                          │
                   ▼                          │
          ┌─────────────────┐                 │
          │    BOOKING      │◄────────────────┘
          │  (appointment)  │  All sub-tables depend on booking
          └───┬────┬────┬───┘
              │    │    │
     ┌────────┘    │    └────────┐
     ▼             ▼             ▼
┌──────────┐ ┌──────────┐ ┌──────────────┐
│ CHAT     │ │ NOTIFICA-│ │  PRESCRIPTION │
│(booking_ │ │ TIONS    │ │  (2 systems)  │
│ chat)    │ │          │ │              │
│          │ │          │ ├─ prescriptions │
│ Depends  │ │ Depends  │ │  (legacy)     │
│ on:      │ │ on:      │ │              │
│ booking  │ │ booking  │ ├─ prescription  │
│ users x2 │ │ users    │ │  (ajax)       │
│          │ │          │ │              │
│ Used by:│ │ Used by:│ │ Depends on:   │
│ Patient  │ │ ALL      │ │  booking      │
│ Recept.  │ │ appoint- │ │  users (doc+  │
│ Hospital │ │ ment     │ │  patient)     │
│          │ │ control- │ │              │
│ NOT used:│ │ lers     │ │ Sub-tables:   │
│ Doctor   │ │          │ │  p_cos        │
│ Assistant│ │          │ │  p_labels     │
│ Pharmacist│ │          │ │  p_medicine   │
│          │ │          │ │  p_suggestions│
└──────────┘ │          │ │  p_digno_table│
             │          │ │              │
             │          │ │ Master data:  │
             │          │ │  co_master    │
             │          │ │  questions_m  │
             │          │ │  suggestions_m│
             │          │ │  label_master │
             │          │ │  table_master │
             │          │ │  doctor_medi- │
             │          │ │  cine_list    │
             │          │ │              │
             │          │ │ Used by:     │
             │          │ │  Doctor       │
             │          │ │  Assistant    │
             │          │ │  Patient(view)│
             │          │ │  Pharmacist   │
             │          │ └──────────────┘
             │          │
             │          │ ┌──────────────┐
             │          │ │  RATING      │
             │          │ │(doctor_rating)│
             │          │ │              │
             │          │ │ Depends on:  │
             │          │ │  users (pat+  │
             │          │ │  doctor)     │
             │          │ │              │
             │          │ │ Used by:     │
             │          │ │  API          │
             │          │ │  7 Dashboard  │
             │          │ │  controllers  │
             │          │ │  Search       │
             │          │ └──────────────┘
             │          │
             │          │ ┌──────────────┐
             │          │ │  SEARCH      │
             │          │ │              │
             │          │ │ Depends on:  │
             │          │ │  doctors      │
             │          │ │  hospital     │
             │          │ │  city, type   │
             │          │ └──────────────┘
             │          │
             │          │ ┌──────────────┐
             │          │ │  CMS/CONTENT │
             │          │ │              │
             │          │ │ Depends on:  │
             │          │ │  users        │
             │          │ │  posts        │
             │          │ │  slider       │
             │          │ │  blog/news    │
             │          │ └──────────────┘
             │          │
             │          │ ┌──────────────┐
             │          │ │  LOCALIZATION│
             │          │ │              │
             │          │ │ Depends on:  │
             │          │ │  country_mstr │
             │          │ │  state_mstr   │
             │          │ │  city_mstr    │
             │          │ └──────────────┘
             │          │
             │          │ ┌──────────────┐
             │          │ │  AUTH/PASSWD │
             │          │ │              │
             │          │ │ Depends on:  │
             │          │ │  users        │
             │          │ │  reset_password│
             │          │ └──────────────┘
             │          │
             │          │ ┌──────────────┐
             │          │ │  CRON/JOBS   │
             │          │ │              │
             │          │ │ Depends on:  │
             │          │ │  users        │
             │          │ │  booking      │
             │          │ │  (birthday)   │
             │          │ │  External SMS │
             │          │ │  API          │
             │          │ └──────────────┘
             │          │
             └──────────┘

=== KEY OBSERVATIONS ===

1. SINGLE TABLE INHERITANCE: The `users` table uses role-based single table inheritance.
   All 7 roles (admin, hospital, doctor, assistant, receptionist, patient, pharmacist)
   share one table differentiated by the `role` column.

2. BOOKING IS THE HUB: The `booking` table is the central junction connecting:
   - Users (doctor_id, user_id/patient)
   - Chat (booking_chat.booking_id)
   - Notifications (triggered by booking status changes)
   - Legacy Prescription (prescriptions.booking_id)
   - Ajax Prescription (prescription.booking_id)

3. NO DATABASE-LEVEL FK CONSTRAINTS: All relationships are application-enforced only.

4. TWO PARALLEL PRESCRIPTION SYSTEMS: `prescriptions` (legacy, JSON blob) and
   `prescription` + 6 sub-tables (ajax, normalized) coexist without migration path.

5. MASSIVE CODE DUPLICATION:
   - doctor/AjaxPrescription/index.php ≈ assistant/AjaxPrescription/index.php (1279 vs 1279 lines)
   - doctor/AjaxPrescription controller ≈ assistant/AjaxPrescription controller
   - Chat UI duplicated across patient/receptionist/hospital views
   - Notification creation pattern duplicated in 4+ Appointment controllers

6. NOTIFICATION BROADCAST: Every booking status change creates 2 notifications
   (one for patient, one for receptionist if assigned).
