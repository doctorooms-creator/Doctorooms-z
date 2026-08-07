# Doctorooms — Complete Research Document

> Source: `https://github.com/Devin041/Doctorooms.git` (cloned at `/tmp/Doctorooms/`)
> Original Tech: PHP + CodeIgniter MVC + MySQL + Bootstrap + jQuery + Tabler Admin Theme
> Total Files: 527 PHP files | 7 Layouts | 37 Models | ~60 Controllers | ~160 Views | 35 DB Tables

---

# Phase 0: Foundation Layer

## 0.1 Architecture Overview

### Framework: CodeIgniter (Custom MVC)
- **Entry Point**: `index.php` → loads `system/` core → routes to `application/controllers/`
- **Routing**: `config/routes.php` — default_controller = `home`, no custom routes (all URL-based: `controller/method/param`)
- **Base Controller Hierarchy**:

```
CI_Controller (CodeIgniter System)
  └── MY_Controller (application/core/MY_Controller.php)
        ├── Guest_controller   → Public pages (login, register, home, etc.) — optional auth
        ├── Patient_contoller  → Patient-only pages
        ├── Doctor_controller  → Doctor-only pages
        ├── Hospital_contoller → Hospital-only pages
        ├── Reception_contoller→ Receptionist-only pages
        ├── Assistant_controller→ Assistant-only pages
        ├── Admin_contoller    → Admin-only pages
        └── Pharmacist_contoller→ Pharmacist-only pages
```

### Guard Logic (in each role controller's `__construct`):
1. Check `session->userdata('user_login')` exists → if not, redirect to `auth/login`
2. Check `role` matches the controller's role → if not, redirect to `auth/login`
3. Re-verify user not blocked via `user->check_auth_after_login()` → if blocked, logout with flash message
4. Load common data: `$view_data['user']`, `$view_data['notifications']` (last 7), `$view_data['notificationsCount']`

### Special Case — Receptionist Controller:
- Loads additional: `receptionist` model, `doctor` model
- Sets `$this->user_data->doctor_id` from `receptionist->get_by_user_id()` — receptionist is ALWAYS linked to a doctor
- Sets `$this->doctor_data` = doctor's full profile (used in views)

### Special Case — Guest Controller:
- Auth is OPTIONAL — loads user data if session exists, empty array if not
- Used by: Home, Doctors, Hospitals, Blog, About, Contact, Privacy, Terms, Auth, Search, etc.

### MVC Flow Per Request:
```
URL → Router → Controller::method()
  → Load Model(s)
  → Query Database
  → Set $view_data
  → Load View (wrapped in Layout)
    → Layout includes: navbar, sidebar, content area, footer
    → Content area = specific view file
```

---

## 0.2 Constants & Configuration

### All Constants (config/constants.php):

```php
// 6 User Roles
ADMIN           = "admin"
HOSPITAL        = "hospital"
RECEPTIONIST    = "receptionist"
DOCTOR          = "doctor"
DOCTOR_ASSISTANT= "assistant"
PATIENT         = "patient"
PHARMACIST      = "pharmacist"

// User Statuses
PENDING = "Pending"     // New user, needs mobile verification
BLOCK   = "Block"        // Blocked by admin
ACTIVE  = "Active"       // Verified and active
FINISH  = "Finish"       // Appointment finished

// Booking Statuses
APPROVE  = "Approve"
VISITED  = "Visited"
REJECTED = "Canceled"    // Note: typo in original ("Canceled" not "Cancelled")
EXTEND   = "Extend"      // Appointment extended

// Post/Blog Statuses
PUBLISHED = "Published"
HIDE      = "Draft"

// Post Types
BLOG = "Blog"
NEWS = "news"

// Booking Types (who created the appointment)
BY_SELF         = "By Self"           // Patient booked themselves
BY_RECEPTIONIST = "By Receptionist"   // Receptionist booked for patient
BY_HOSPITAL     = "By Hospital"       // Hospital booked for patient

// Notification Statuses
READ   = "READ"
UNREAD = "UNREAD"

// Site Config
SITE_TITLE = "Doctorooms"
BEFORE_BOOKING_DAYS = 180    // Max days in advance for booking

// Email
EMAIL_FROM = "xyz@gmail.com"
EMAIL_NAME = "Doctorooms"

// Encryption
ENCPT_KEY = "24e383a2026333f93739b66f5397ffde"  // AES-128-CBC key
```

### Database Config (config/database.php):
- MySQL/MariaDB
- Host: 127.0.0.1
- DB: hospital_app_db
- Driver: mysqli

### Form Validation (config/form_validation.php):
- Contains validation rules for: `login`, `register` forms
- Login: email (required, valid_email), password (required, min_length[6])
- Register: name, email, password (min 6), confirm_password (matches), mobile_no, gender, terms (required)

---

## 0.3 Helper & Utility Functions

### Located in: `core/MY_Controller.php`

### Alert/Response Helpers:
| Method | Purpose | Flash Keys |
|---|---|---|
| `_alertSuccessResponce($success, $msg, $fail_msg, $url)` | Success/error redirect | feedback, feedback_class (success/error) |
| `_alertInfoResponce(...)` | Info/error redirect | feedback, feedback_class (info/error) |
| `_alertWarningResponce(...)` | Warning/error redirect | feedback, feedback_class (alert/error) |

### Encryption Helpers:
| Method | Purpose |
|---|---|
| `encrypted_text($plain)` | AES-128-CBC encrypt, URL-safe base64 (`.`, `-`, `~` replacing `+`, `=`, `/`) |
| `decrypted_text($encrypted)` | Reverse of above |
| Used for: Email verification tokens, forgot password tokens |

### Email Helper:
| Method | Purpose |
|---|---|
| `send_mail($to, $subject, $msg)` | Send HTML email via SMTP. From: EMAIL_FROM/EMAIL_NAME. Returns true/false. |
| Email templates: Built as inline HTML strings in Auth controller |

### File Upload Helpers:
| Method | Purpose |
|---|---|
| `_upload_files($path, $title, $control_name)` | Upload multiple images. Allowed: jpg, jpeg, gif, png. Max: 2000KB. Returns JSON array of filenames. |
| `_upload_file($path, $title, $control_name)` | Upload single image. Same restrictions. Returns `{status, file_name}` or `{status, upload_error}`. |
| `_upload_pdf($path, $title, $control_name)` | Upload PDF/XLSX/XLS. Max 2000KB. Returns same format. |
| `_generate_thumb($source_path, $target_path, $file)` | Generate 300x300 thumbnail. Returns `filename_thumb.ext`. Uses GD2 library. |
| `_generate_multiple_thumb(...)` | Loop of above for array of files. |
| File naming: `{title}_{timestamp}_{uniqid}.{ext}` |

### Other Helpers:
| Method | Purpose |
|---|---|
| `logout()` | Unset `user_login` session, redirect to `auth/login` |
| `next_available_booking_days($days, $holidays)` | Generate array of next N available dates, excluding holidays. Used for booking date selection. |
| `sendMobileMessage($mobile, $message)` | HTTP GET to SMS gateway. URL: `sms.soft-techsolutions.com`. Sender ID: NTFSMS. |
| `_generateSeoURL($string, $wordLimit)` | Generate URL-safe slug from string. Used for blog permalinks. |
| `dump($var)` | var_dump with `<pre>` wrapper (debug) |

### Standalone Helper: `helpers/date_formater_helper.php`
- Custom date formatting function

---

## 0.4 Database Schema — Complete

### 35 Tables — Detailed Column Analysis:

#### 1. `users` — Core user table for ALL roles
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK AUTO_INCREMENT | |
| name | varchar(255) NOT NULL | |
| gender | varchar(50) NOT NULL | Male/Female |
| role | varchar(50) NOT NULL | admin/doctor/patient/hospital/receptionist/assistant/pharmacist |
| status | varchar(50) NOT NULL | Pending/Active/Block |
| email | varchar(255) NOT NULL | Unique |
| password | text NOT NULL | SHA256 hash |
| created_at | datetime | |
| updated_at | datetime | |
| profile_img | varchar(255) DEFAULT 'default.png' | Stored as filename only |
| mobile_no | varchar(50) NOT NULL | |
| mobile_verified_at | datetime DEFAULT NULL | |
| email_verified_at | datetime DEFAULT NULL | |
| **Relations** | | → doctors(user_id), hospital(user_id), receptionist(user_id), doctor_assistants(user_id), doctor_pharmacist(user_id), booking(user_id), posts(author_id), doctor_rating(patient_id) |

#### 2. `doctors` — Doctor extended profile (1:1 with users)
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| user_id | int(11) NOT NULL UNIQUE | FK → users.id |
| booking_days | int(11) | How many days in advance patients can book |
| daily_limit | int(11) | Max appointments per day |
| doctor_type | varchar(255) | FK → doctor_type_mstr.type (qualification/specialization) |
| description | text | Bio/description |
| photos | text | JSON array of photo filenames |
| address | varchar(300) | Clinic address |
| state | varchar(255) | |
| city | varchar(255) | |
| hospital_address | varchar(300) | Separate hospital address |
| fees | decimal(18,2) | Consultation fee |
| emergency_charge | decimal(18,2) | Emergency consultation fee |
| specialization | text | Specialization text |
| award_and_recognition | text | |
| eduction | text | Education details (note: typo "eduction") |
| lat | decimal(18,9) | Latitude for Google Maps |
| longi | decimal(18,9) | Longitude for Google Maps |
| hospital_id | int(11) | FK → hospital.user_id (if doctor belongs to hospital) |
| experience | text | Experience details |
| registration_detail | text | Medical registration details |
| contact_no | varchar(100) | Primary contact |
| phone_no | varchar(100) | Secondary phone |
| is_emergency | int(1) DEFAULT 0 | 0=no emergency, 1=emergency available |

#### 3. `hospital` — Hospital profiles
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| hospital_name | varchar(255) | |
| address | varchar(300) | |
| state | varchar(255) | |
| city | varchar(255) | |
| contact_no | varchar(100) | |
| gallary | text | JSON array of gallery image filenames (note: typo "gallary") |
| lat | decimal(18,9) | |
| longi | decimal(18,9) | |
| user_id | int(11) NOT NULL | FK → users.id |

#### 4. `booking` — Appointments (core transaction table)
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| appointment_no | varchar(255) UNIQUE | Auto-generated appointment number |
| doctor_id | int(11) NOT NULL | FK → doctors.id |
| user_id | int(11) | FK → users.id (patient, can be null for walk-ins) |
| state | varchar(255) | Patient's state (from form) |
| city | varchar(255) | Patient's city (from form) |
| booking_date | datetime NOT NULL | When appointment is booked |
| petient_name | varchar(255) NOT NULL | (note: typo "petient") |
| disease | varchar(255) NOT NULL | Reason for visit |
| description | text | Detailed description |
| gender | varchar(50) | Patient gender |
| date_of_birth | date | Patient DOB |
| age | int(11) | Patient age |
| relation_with_me | varchar(255) | If booking for someone else |
| blood_group | varchar(50) | |
| weight | decimal(18,3) | kg |
| height | decimal(18,3) | cm |
| physical_handicape | varchar(50) NOT NULL | (note: typo "handicape") |
| created_at | datetime | |
| updated_at | datetime | |
| status | varchar(50) NOT NULL | Pending/Approve/Visited/Canceled/Extend/Finish |
| booking_type | varchar(255) | By Self / By Receptionist / By Hospital |
| appointment_charge | decimal(18,2) | Admin commission charge |

#### 5. `booking_chat` — Chat messages per appointment
| Column | Type | Notes |
|---|---| ---|
| id | int(11) PK | |
| booking_id | int(11) NOT NULL | FK → booking.id |
| from_id | int(11) NOT NULL | FK → users.id (sender) |
| to_id | int(11) NOT NULL | FK → users.id (receiver) |
| message | text NOT NULL | |
| status | varchar(50) NOT NULL | READ/UNREAD |
| created_at | datetime | |

#### 6. `prescription` — Doctor prescriptions (header level)
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| booking_id | int(11) NOT NULL | FK → booking.id (one prescription per appointment) |
| petient_name | varchar(255) | (note: typo) |
| petient_age | varchar(255) | (note: typo) |
| disease | varchar(255) | |
| weight | varchar(255) | |
| bp | varchar(255) | Blood pressure |
| temperature | varchar(255) | |
| description | text | Doctor's notes |
| created_at | datetime | |
| updated_at | datetime | |

#### 7. `prescriptions` — Second prescription table (possibly alternative/legacy)
| Column | Type | Notes |
|---|---| ---|
| id | int(11) PK | |
| booking_id | int(11) NOT NULL | FK → booking.id |
| petient_name | varchar(255) | |
| petient_age | varchar(255) | |
| weight | varchar(255) | |
| bp | varchar(255) | |
| temperature | varchar(255) | |
| description | text | |
| created_at | datetime | |
| updated_at | datetime | |

#### 8. `p_medicine` — Prescription medicines (child of prescription)
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| p_id | int(11) NOT NULL | FK → prescriptions.id |
| medicine | varchar(255) | Medicine name |
| morning | int(11) | 0/1 — take in morning |
| after_noon | int(11) | 0/1 — take in afternoon |
| evning | int(11) | 0/1 — take in evening (note: typo "evning") |
| tab | int(11) | Number of tablets |
| doz | varchar(255) | Dosage (e.g., "200mg") |
| description | text | Additional instructions |
| created_by | int(11) | FK → users.id (who added) |
| created_at | datetime | |
| updated_at | datetime | |

#### 9. `p_labels` — Prescription labels (vitals/measurements)
| Column | Type | Notes |
|---|---| ---|
| id | int(11) PK | |
| p_id | int(11) NOT NULL | FK → prescriptions.id |
| label | varchar(255) | Label name (e.g., "PULSE", "BP", "SUGER") |
| l_value | varchar(255) | Label value (e.g., "70", "100") |
| label_unit | varchar(255) | Unit (optional) |
| created_by | int(11) | |
| created_at | datetime | |
| updated_at | datetime | |

#### 10. `p_suggestions` — Prescription suggestions (Q&A in prescription)
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| p_id | int(11) NOT NULL | FK → prescriptions.id |
| question | varchar(255) | Question text |
| suggestions | varchar(255) | Doctor's suggestion/answer |
| created_by | int(11) | |
| created_at | datetime | |
| updated_at | datetime | |

#### 11. `p_digno_table` — Custom diagnosis table in prescription
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| p_id | int(11) NOT NULL | FK → prescriptions.id |
| rows | int(11) | Number of rows |
| cols | int(11) | Number of columns |
| header_label | varchar(255) | JSON array of column headers (e.g., ["Rt","Lt"]) |
| cols_label | varchar(255) | JSON array of column sub-headers |
| footer_label | varchar(255) | JSON array of footer labels |
| extra_label | varchar(255) | Extra label text |
| created_by | int(11) | |
| created_at | datetime | |
| updated_at | datetime | |

#### 12. `p_cos` — Prescription chief complaints
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| p_id | int(11) NOT NULL | FK → prescriptions.id |
| co_id | int(11) NOT NULL | FK → co_master.id |
| created_by | int(11) | |
| created_at | datetime | |
| updated_at | datetime | |

#### 13. `p_other_settings` — Prescription print template settings (per doctor)
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| doctor_id | int(11) NOT NULL | FK → users.id |
| logo | varchar(255) | Doctor's clinic logo for prescription |
| time | text | JSON: `{"morning_from":"10:15","morning_to":"12:50","evening_from":"3:15","evening_to":"4:50"}` |
| header | varchar(255) | Header text on prescription |
| full_header | text | Full header image path (when is_full_header=1) |
| is_full_header | int(1) DEFAULT 0 | 1=use full_header image, 0=use text header |
| created_by | int(11) | |
| created_at | datetime | |
| updated_at | datetime | |

#### 14. `doctor_rating` — Doctor ratings by patients
| Column | Type | Notes |
|---|---|---|
| id | bigint(20) PK | |
| patient_id | int(11) | FK → users.id |
| doctor_id | int(11) | FK → users.id |
| star | int(11) | 1-5 stars |

#### 15. `doctor_type_mstr` — Doctor qualification/specialization types
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| type | varchar(255) NOT NULL | e.g., "DM [CARDIOLOGY]", "MS (GENERAL SURGERY)" |
| status | varchar(255) | |
| created_at | datetime | |

#### 16. `doctor_assistants` — Doctor-Assistant mapping
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| user_id | int(11) NOT NULL | FK → users.id (assistant user) |
| doctor_id | int(11) NOT NULL | FK → users.id (doctor user) |
| description | text | |
| address | varchar(1000) | |

#### 17. `doctor_holiday_schedule` — Doctor unavailability
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| user_id | int(11) NOT NULL | FK → users.id (doctor) |
| date | date NOT NULL | Holiday date |
| remark | text | Reason |

#### 18. `doctor_medicine_list` — Doctor's personal medicine inventory
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| name | varchar(2000) | Medicine name |
| morning | varchar(255) | Default morning dose |
| afternoon | varchar(255) | Default afternoon dose |
| evening | varchar(255) | Default evening dose |
| doz | varchar(255) | Default dosage |
| tab | int(255) | Default tablet count |
| description | text | |
| status | varchar(255) | Active/Block |
| created_at | datetime | |
| updated_at | datetime | |
| created_by | int(11) | |
| user_id | int(11) | FK → users.id (doctor) |

#### 19. `doctor_pharmacist` — Doctor-Pharmacist mapping
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| user_id | int(11) NOT NULL | FK → users.id (pharmacist user) |
| doctor_id | int(11) NOT NULL | FK → users.id (doctor user) |
| description | text | |
| address | varchar(500) | |
| dlno | varchar(500) | Drug license number |
| created_by | int(11) | |
| created_at | datetime | |
| updated_at | datetime | |

#### 20. `receptionist` — Doctor-Receptionist mapping
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| doctor_id | int(11) NOT NULL | FK → users.id (doctor user) |
| user_id | int(11) NOT NULL | FK → users.id (receptionist user) |
| address | varchar(255) | |

#### 21. `posts` — Blog posts / News
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| title | varchar(255) NOT NULL | |
| paramalink | varchar(255) UNIQUE | SEO-friendly URL slug |
| content | text | HTML content |
| blog_img | varchar(255) | Featured image filename |
| type | varchar(255) | Blog/News |
| status | varchar(255) | Published/Draft |
| author_id | int(11) | FK → users.id |
| created_at | datetime | |
| updated_at | datetime | |

#### 22. `notifications` — System notifications
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| user_id | int(11) NOT NULL | FK → users.id (recipient) |
| title | varchar(255) | Notification title |
| message | text | Notification body |
| status | varchar(255) | READ/UNREAD |
| created_at | datetime | |
| updated_at | datetime | |

#### 23. `slider` — Homepage image slider
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| slider_image | varchar(255) | Image filename |
| position | int(11) | Display order |
| status | varchar(50) | Active/Block |
| created_at | datetime | |
| updated_at | datetime | |
| link | varchar(1024) | Optional click-through URL |

#### 24. `hospital_inquiry` — Contact form submissions
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| name | varchar(255) | |
| email | varchar(255) | |
| phone | varchar(255) | |
| subject | varchar(255) | |
| message | text | |
| status | varchar(255) | |
| created_at | datetime | |
| updated_at | datetime | |

#### 25. `disease_master` — Disease lookup table
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| dis_name | varchar(500) NOT NULL | Disease name |
| status | varchar(255) | |
| created_at | datetime | |

#### 26. `label_master` — Custom label templates for prescriptions
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| label | varchar(255) | |
| status | varchar(255) | |
| created_by | int(11) | |
| doctor_id | int(11) | |
| created_at | datetime | |
| updated_at | datetime | |

#### 27. `co_master` — Chief Complaints (doctor's custom list)
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| co_code | varchar(255) | Short code |
| co_detail | text | Full description |
| created_by | int(11) | |
| doctor_id | int(11) | |
| status | varchar(255) | Active/Block |
| created_at | datetime | |
| updated_at | datetime | |

#### 28. `suggestions_master` — Pre-defined suggestions for Q&A
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| question_id | int(11) NOT NULL | FK → questions_master.id |
| suggestions | text | |
| created_by | int(11) | |
| doctor_id | int(11) | |
| status | varchar(255) | Active/Block |
| created_at | datetime | |
| updated_at | datetime | |

#### 29. `questions_master` — Health Q&A questions (doctor's knowledge base)
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| question | varchar(1000) NOT NULL | |
| question_code | varchar(255) | Short code |
| co_id | int(11) NOT NULL | FK → co_master.id (0 = no CO link) |
| explenations | text | Detailed explanation (note: typo "explenations") |
| created_by | int(11) | |
| doctor_id | int(11) | |
| status | varchar(255) | Active/Block |
| created_at | datetime | |
| updated_at | datetime | |

#### 30. `table_master` — Custom table templates for diagnosis
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| row | int(11) | Number of rows |
| table_column | int(11) | Number of columns |
| lable_header | text | JSON array of column headers |
| lable_footer | text | JSON array of footer labels |
| lable_row | text | JSON array of row labels |
| extra_label | varchar(255) | |
| created_by | int(11) | |
| doctor_id | int(11) | |
| status | varchar(255) | |
| created_at | datetime | |
| updated_at | datetime | |

#### 31. `config` — Site configuration
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| admin_charge | decimal(18,2) | Per-appointment commission |

#### 32. `country_mstr` — Countries
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| country_name | varchar(255) NOT NULL | |

#### 33. `state_mstr` — States (per country)
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| state_name | varchar(255) NOT NULL | |
| county_id | int(11) NOT NULL | FK → country_mstr.id |

#### 34. `city_mstr` — Cities (per state)
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| city_name | varchar(255) NOT NULL | |
| state_id | int(11) NOT NULL | FK → state_mstr.id |

#### 35. `reset_password` — Password reset tokens
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| email | varchar(255) NOT NULL | |
| token | text NOT NULL | |
| created_at | datetime | |

### Additional: `schedule_pdf` — Hospital schedule PDF uploads
| Column | Type | Notes |
|---|---|---|
| id | int(11) PK | |
| hospital_id | int(11) NOT NULL | FK → hospital.id |
| file_name | varchar(500) | |
| created_at | datetime | |

---

## 0.5 Authentication Flow — Complete

### Registration Flow:
```
1. GET /auth/register?type=dr OR ?type=patient
   → Loads register.php view
   → Only doctor and patient can self-register (other roles created by admin)

2. POST /auth/signup?type=dr OR ?type=patient
   → Validates: name, email(unique), password(min 6), confirm_password(match), mobile_no, gender, terms
   → role = 'doctor' or 'patient' based on ?type
   → status = 'Pending' (needs mobile verification)
   → password = SHA256(password)
   → Creates user in DB
   → Sends welcome SMS with credentials
   → Redirects to /auth/login with flash message
   → NOTE: Email verification code exists but is COMMENTED OUT
```

### Login Flow:
```
1. GET /auth/login
   → If already logged in → redirect to role-specific dashboard
   → Loads login.php view

2. POST /auth/auth_login
   → Validates: email, password(min 6)
   → password = SHA256(password)
   → Check: user->check_auth($logData)
   → If status = 'Active':
      → Set session 'user_login' with: {id, name, email, role, status, mobile_no, profile_img}
      → Redirect by role:
         doctor → /doctor/dashboard
         patient → /home (NOTE: inconsistent — register says /home, login says /appointment)
         receptionist → /receptionist/dashboard
         hospital → /hospital/dashboard
         admin → /admin/dashboard
         assistant → /assistant/dashboard
         pharmacist → /pharmacist/pharmacist/listPrescriptions
   → If status = 'Pending':
      → Set session 'verify_data' with user data
      → Redirect to /auth/verify_mobile
   → If status = 'Block':
      → Flash error "You are Blocked"
      → Redirect to /auth/login
   → If credentials invalid:
      → Flash error "Email or Password is invalid"
      → Redirect back to login
   → Remember Me: extends session cookie to 7 days
```

### Mobile OTP Verification Flow:
```
1. GET /auth/verify_mobile (only if session 'verify_data' exists)
   → Shows OTP input form

2. POST /auth/sendotp_mobile_verify
   → Generates 6-digit random OTP
   → Sends SMS: "Dear User, {otp} is your Doctorooms OTP code for verification."
   → Stores in session 'mobile_verification_data': {mobile_no, otp, date}

3. POST /auth/verify_mobile_submit
   → Checks OTP expiry: 180 seconds (3 minutes)
   → Compares OTP
   → If match:
      → Updates user: status='Active', mobile_verified_at=now()
      → Creates full session
      → Redirects to /auth/login (which then redirects to dashboard)
   → If mismatch: flash error, redirect back
   → If expired: unset sessions, flash error, redirect to login
```

### Forgot Password Flow:
```
1. GET /auth/forgot_password → Shows mobile number form

2. POST /auth/forgot_submit
   → Validates mobile number exists in DB
   → Stores 'forgot_data' session: {mobile, created_at}
   → Redirects to OTP verification

3. POST /auth/forgot_password_send_otp
   → Generates OTP, sends SMS
   → Stores 'forgot_password_verification_data': {mobile_no, otp, date}

4. POST /auth/forgot_password_mobile_verification_submit
   → Checks OTP expiry: 180 seconds
   → If match: stores 'generate_password_data', redirects to new password form

5. GET /auth/generate_new_password → Shows new password form

6. POST /auth/generate_new_password_submit
   → Validates: new_password(min 6), confirm_password(match)
   → Hashes new password, updates user
   → Unsets sessions, redirects to login
   → OTP valid for 300 seconds (5 minutes) at this stage
```

---

## 0.6 Role & Permission System

### Role Hierarchy & Access:
| Role | Self-Register | Created By | Dashboard URL | Guard Class |
|---|---|---|---|---|
| Admin | No | Pre-seeded | /admin/dashboard | Admin_contoller |
| Doctor | Yes (?type=dr) | Self/Admin | /doctor/dashboard | Doctor_controller |
| Patient | Yes (?type=patient) | Self | /home or /appointment | Patient_contoller |
| Hospital | No | Admin | /hospital/dashboard | Hospital_contoller |
| Receptionist | No | Doctor/Admin | /receptionist/dashboard | Reception_contoller |
| Assistant | No | Doctor/Admin | /assistant/dashboard | Assistant_controller |
| Pharmacist | No | Doctor/Admin | /pharmacist/pharmacist/listPrescriptions | Pharmacist_contoller |

### Guard Logic (per role controller):
1. Session must exist with 'user_login'
2. Role must match controller's expected role
3. User must not be blocked (re-checks DB on every request)
4. Loads notifications (last 7 days) and count

### Shared Data in $view_data (set in constructor):
- `$view_data['user']` — Full user object from DB
- `$view_data['notifications']` — Array of recent notifications
- `$view_data['notificationsCount']` — Count of notifications
- (Receptionist only) `$view_data['doctor_data']` — Associated doctor's profile

---

## 0.7 Layout System (7 Layouts)

| Layout File | Used By | Key Characteristics |
|---|---|---|
| `master_page_front.php` | Guest_controller | Public navbar (logo, Home, Doctors, Hospitals, Blog, About, Contact, Login/Register or Profile), footer, white background |
| `master_page_doctors.php` | Doctor_controller | Sidebar with: Dashboard, Appointments, Schedule, Profile, Assistants, Receptionists, Pharmacists, Posts, Gallery, Reports, Labels, CO, Questions, Suggestions, Table Master, P Other Settings, Notifications. Navbar: notifications bell, profile dropdown |
| `master_page_hospital.php` | Hospital_contoller | Sidebar: Dashboard, Appointments, Doctors, Income, Profile, Posts, Registration, Upload Schedule. Navbar with profile |
| `master_page_receptionist.php` | Reception_contoller | Sidebar: Dashboard, Appointments, Registration, Schedule, Medicine, Notifications, Posts, Profile |
| `master_page_assistant.php` | Assistant_controller | Sidebar: Dashboard, Appointments, Notifications, Posts, Profile |
| `master_page_pharmacist.php` | Pharmacist_contoller | Sidebar: Dashboard, Prescriptions, Profile |
| `master_page_admin.php` | Admin_contoller | Full sidebar: Dashboard, Users, Doctors, Hospitals, Patients, Appointments, Blog, Sliders, Assistants, Receptionists, Reports (submenu), Charges, Site Statistics, Inquiries, Profile, Master Data (submenu) |

### Layout Structure (typical dashboard):
```
<!DOCTYPE html>
<html>
<head>
  <!-- CSS: Tabler theme, Bootstrap, plugins -->
</head>
<body>
  <div class="page">
    <!-- Navbar (top bar) -->
    <div class="page-main">
      <!-- Sidebar -->
      <div class="my-3 my-md-5">
        <div class="container">
          <!-- Page Content ($this->load->view($view, $view_data)) -->
        </div>
      </div>
    </div>
    <!-- Footer -->
  </div>
  <!-- JS: jQuery, Bootstrap, plugins -->
</body>
</html>
```

---

## 0.8 File Upload System

### Upload Paths (from controllers and views):
| Type | Path | Used By |
|---|---|---|
| Profile images | `upload/profile/` | All roles |
| Blog images | `upload/blog/` | All roles with blog access |
| Slider images | `upload/slider/` | Admin |
| Gallery images | `upload/gallery/` | Doctor |
| Prescription logo | `upload/prescription_logo/` | Doctor |
| Schedule PDF | `upload/schedule/` | Hospital |

### File Naming Convention:
- Single: `{title}_{timestamp}_{uniqid()}.{ext}`
- Multiple: Same pattern per file, returned as JSON array
- Thumbnails: `{original_name}_thumb.{ext}` (300x300)

### Allowed File Types:
- Images: jpg, jpeg, gif, png (max 2000KB)
- Documents: pdf, xlsx, xls (max 2000KB)

---

---

# Phase 1: Frontend (Public-Facing) Module

> STATUS: ⏳ PENDING RESEARCH

---

# Phase 2: Authentication & User Management Module

> STATUS: ⏳ PENDING RESEARCH (Phase 0.5 covers auth flow; this phase will cover User Model queries, session data, admin user management)

---

# Phase 3: Doctor Dashboard Module

> STATUS: ⏳ PENDING RESEARCH

---

# Phase 4: Hospital Dashboard Module

> STATUS: ⏳ PENDING RESEARCH

---

# Phase 5: Receptionist Dashboard Module

> STATUS: ⏳ PENDING RESEARCH

---

# Phase 6: Assistant Dashboard Module

> STATUS: ⏳ PENDING RESEARCH

---

# Phase 7: Pharmacist Dashboard Module

> STATUS: ⏳ PENDING RESEARCH

---

# Phase 8: Admin Dashboard Module

> STATUS: ⏳ PENDING RESEARCH

---

# Phase 9: Cross-Cutting Concerns

> STATUS: ⏳ PENDING RESEARCH

---

# Phase 10: Module Connection Map

> STATUS: ⏳ PENDING RESEARCH (Initial map in RESEARCH-PLAN.md Phase 10)
