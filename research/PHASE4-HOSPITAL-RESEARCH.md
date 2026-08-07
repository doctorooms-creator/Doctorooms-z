# Phase 4: Hospital Dashboard Module - Complete Research

> Project: Doctorooms (PHP/CodeIgniter Hospital Management System)
> Source: `/tmp/Doctorooms/`
> Module: Hospital Dashboard (Role: `hospital`)

---

## Architecture Overview

### Base Controller: `Hospital_contoller` (MY_Controller.php, line 574)

All hospital controllers extend `Hospital_contoller` (note: typo in class name - "contoller" not "controller").

**Authentication & Authorization:**
- Checks `session('user_login')` exists, redirects to `auth/login` if not
- Validates `session_data['role'] == HOSPITAL`, redirects if not hospital
- Calls `Users_model->check_auth_after_login()` to verify user is not blocked
- Stores `$this->user_data = (object)$session_data` (id, name, email, role, status, mobile_no, profile_img)
- Stores `$this->view_data['user'] = $this->user_data`

**Shared Properties:**
- `$this->view_data` - array passed to all views
- `$this->user_data` - current logged-in hospital user object

**Helper Methods (from MY_Controller):**
- `_alertSuccessResponce($success, $success_msg, $fail_msg, $re_url)` - flash redirect with success/error
- `_alertInfoResponce($success, $success_msg, $fail_msg, $re_url)` - flash redirect with info/error
- `_alertWarningResponce($success, $success_msg, $fail_msg, $re_url)` - flash redirect with warning/error
- `_upload_file($path, $title, $img_control)` - file upload helper
- `_upload_pdf($path, $title, $img_control)` - PDF upload helper
- `_generateSeoURL($str)` - slug generator
- `sendMobileMessage($mobile, $message)` - SMS helper
- `send_mail($to, $subject, $msg)` - email helper

### Constants Used
```
HOSPITAL="hospital"  DOCTOR="doctor"  PATIENT="patient"  RECEPTIONIST="receptionist"
ACTIVE="Active"  BLOCK="Block"  PENDING="Pending"
APPROVE="Approve"  VISITED="Visited"  REJECTED="Canceled"  EXTEND="Extend"
PUBLISHED="Published"  HIDE="Draft"  BLOG="Blog"
BY_HOSPITAL="By Hospital"  BY_RECEPTIONIST="By Receptionist"
UNREAD="UNREAD"
```

### Master Layout: `layouts/master_page_hospital.php`

**CSS Libraries:**
- AdminLTE 2.4.0 (Bootstrap-based admin theme)
- Bootstrap 3.x, Font Awesome, Ionicons
- Morris.js (charts), jVectorMap, DataTables
- Bootstrap Datepicker, Daterangepicker, CKEditor 4.11.1, WysiHTML5
- PNotify (toast notifications), SweetAlert
- Custom `point.css`
- Google Analytics (UA-171698773-1)

**Header:**
- Logo links to `hospital/dashboard`
- User dropdown: profile image, name, role, links to `hospital/profile/update_profile` and `auth/logout`

**Sidebar Navigation:**
1. Dashboard → `hospital/dashboard` (NOTE: sidebar has wrong URL `admin/dashboard`)
2. Upload Schedule → `hospital/doctor/schedule`
3. Doctors → `hospital/doctor`
4. Appointment → `hospital/appoinment` (note typo in URL)
5. Blog → `hospital/blog`
6. Income Summary → `hospital/income`

**Global JavaScript (in layout):**
- CKEditor replaces `#editor1` (used by blog)
- WysiHTML5 on `.textarea`
- Datepicker on `#booking_date`
- PNotify flash message display
- Age auto-calc from DOB (`#date_of_birth` → `#age`)
- Morris.js bar chart (`#bar-chart`) - only renders when `$chartdata` exists
- Chat system: polls `get_all_chat_message` every 5 seconds, renders chat bubbles
- City dropdown: `loadCity()` posts to `hospital/profile/city_by_state`
- `CreateRandomNumber()` called on document ready (intended for add_doctor page but fires globally - BUG)
- Print CSS: hides `.d-n` class elements, links, and FA icons

---

## 4.1 Hospital Dashboard

### Controller: `controllers/hospital/Dashboard.php`

**Models loaded:** Users_model (user), Doctors_model (doctor), Posts_model (post), Booking_model (booking), Hospital_model (hospital)

**Constructor:** Sets `$this->view_data['a']` = current user from `user->get_by_id()`

**Method: `index()`**
| Data Variable | Source | Description |
|---|---|---|
| `countpost` | `post->count_by_hospital($user->id)` | Total blog posts by hospital |
| `countdoc` | `user->count_doctor_by_hospital($user->id)` | Doctor count (queries `doctors` table) |
| `booking` | `booking->get_hospital_appointment_count_pending($user->id)` | Pending appointments across all hospital doctors |
| `bookingtoday` | `booking->get_hospital_appointment_count_today($user->id)` | Today's appointments (by created_at date) |
| `doctors` | `doctor->get_by_hospital($user->id)` | All doctors (active + blocked) with user data |
| `chartdata` | `hospital->get_chart_data_month_wise($u)` | Monthly income data for bar chart (array of 12 months) |

**View:** `hospital/common/dashboard`

### View: `hospital/common/dashboard.php`

**Structure:** AdminLTE `content-wrapper`

**Info Boxes (4 cards, linked):**
1. DOCTORS (aqua, fa-user-md) → `hospital/doctor` | Value: `$countdoc`
2. POST (red, fa-file-o) → `hospital/blog` | Value: `$countpost`
3. Pending Appointment (green, fa-user) → `hospital/appoinment` | Value: `$booking`
4. Today appointment (yellow, fa-hospital-o) → `hospital/appoinment` | Value: `$bookingtoday`

**Doctors Grid:**
- 3-column grid of `widget-user` cards
- Filters out blocked doctors (`$doc->status != BLOCK`)
- Shows: profile image (`upload/profile/`), name, doctor_type, contact_no, email

**Bar Chart:**
- Container `#bar-chart` rendered by Morris.js in layout
- Monthly income data (Jan-Dec) from `$chartdata`
- Green bars (`#00a65a`), labeled "Income"
- Only shows VISITED status bookings' appointment_charge sums

### Model Queries Used
- **Users_model::count_doctor_by_hospital($id)** → `SELECT COUNT(*) FROM doctors WHERE hospital_id=$id`
- **Booking_model::get_hospital_appointment_count_pending($hid)** → Joins `booking, users u1, users u2, doctors d` where `d.hospital_id=$hid` and `status='Pending'`
- **Booking_model::get_hospital_appointment_count_today($hid)** → Same joins, filters by `DATE(booking.created_at) = today`
- **Doctors_model::get_by_hospital($hid)** → Raw SQL: `SELECT d.*,u.* FROM doctors as d,users as u WHERE d.user_id=u.id and hospital_id=$hid`
- **Hospital_model::get_chart_data_month_wise($ids)** → 12 queries on `booking` table, `SUM(appointment_charge) as totalcollection` grouped by month, filtered by `status='Visited'` and `doctor_id IN ($ids)`

### Connections
- Links to Doctor management, Blog, Appointment modules
- Chart data depends on VISITED bookings from Booking_model
- Dashboard sidebar has **BUG**: first link goes to `admin/dashboard` instead of `hospital/dashboard`

---

## 4.2 Appointment Management

### Controller: `controllers/hospital/Appoinment.php` (note: typo in filename "Appoinment")

**Models loaded:** Users_model (user), Booking_model (book), Doctors_model (doctor), Config_model (config_model), Notifications_model (notification), Booking_chat_model (chat)

**Constructor:** Sets `$this->view_data['a']` and `$this->view_data['chartdata']=''`

### Method: `index()`
- **GET param:** `status` (default: PENDING)
- Iterates all hospital doctors via `doctor->get_hospital_doctors($user->id)`
- For each doctor, gets their profile via `doctor->get_profile($doc->id)`, then fetches appointments by doctor profile ID and status
- Merges all appointments into one array
- **View:** `hospital/appointment`

### Method: `show($id)`
- Gets single appointment via `book->get_doctor_appointment_one($id)`
- Null check redirects to `hospital/appoinment`
- **View:** `hospital/appointment_show`

### Method: `add()`
- Fetches hospital doctors via `doctor->get_by_hospital($user->id)`
- **View:** `hospital/appointment_add`

### Method: `add_validate()`
- **POST handler** for appointment creation
- Validation rule: `booking_by_hospital`
- **Flow:**
  1. Looks up patient by mobile: `user->get_by_mobile($data['mobile_no'])`
  2. Sets `user_id` from lookup
  3. Sets `status = APPROVE` (auto-approves hospital-created appointments)
  4. Gets `appointment_charge` from `config_model->get_one()->admin_charge`
  5. Sets `booking_type = BY_HOSPITAL`
  6. Generates appointment number via `generateBookingNumber()` (format: `APMT-{N}`)
  7. Creates notification to doctor and patient
  8. Sends SMS with appointment details
  9. Removes `mobile_no` from booking data before insert
  10. Creates booking via `book->create($data)`

### Method: `generateBookingNumber()`
- Gets latest booking record
- Extracts number after "APMT-" prefix, increments by 1
- Returns `APMT-{N}` format

### Method: `extend($id)`
- Only works from PENDING status
- Sets status to EXTEND

### Method: `approve($id)`
- Works from PENDING or EXTEND status
- Sets status to APPROVE

### Method: `visited($id)`
- Only works from APPROVE status (blocks PENDING, EXTEND, REJECTED)
- Sets status to VISITED
- Uses `_alertSuccessResponce` (green flash)

### Method: `cancel($id)` / `reject($id)`
- `cancel()`: blocks only VISITED status
- `reject()`: similar but has commented-out notification code
- Both set status to REJECTED ("Canceled")

### Method: `charges_income()`
- GET params: `fromdate`, `todate`, `doctor`
- Calls `book->get_doctor_wise_charges($doctor, $fromdate, $todate)`
- **View:** `hospital/income_summary`

### Method: `appointment_show_detail($id)`
- Similar to `show($id)` but without doctor_id filter
- **View:** `hospital/appointment_show`

### Method: `get_all_chat_message()`
- **AJAX endpoint** (POST)
- Returns JSON of all chat messages for an appointment
- Calls `chat->getByAppointment($appointmentId)`

### Method: `send_chat_msg()`
- **AJAX endpoint** (POST)
- Sends chat message: `from_id` = hospital user, `to_id` = booking's patient
- Status = UNREAD
- Returns JSON `{status, msg}`

### View: `hospital/appointment.php`

**Structure:** AdminLTE box with DataTable

**Status Filter:** Dropdown with auto-submit on change. Options: Pending, Extend, Approve, Visited, Canceled, All Appointment

**Table Columns:** #, Appointment ID (linked to show), Appointment Date, Who Booked (name+mobile+email, linked), Patient Name, Doctor (Dr. name), Disease, Status (color-coded label), Action

**Action Buttons (status-dependent):**
- PENDING: Approve (blue), Extend (info), Reject (red)
- EXTEND: Approve (blue), Reject (red)
- APPROVE: Visited (green), Reject (red)
- VISITED/REJECTED: no actions (dash)

**Status Colors:** Pending=warning, Approve=primary, Extend=info, Visited=success, Canceled=danger

### View: `hospital/appointment_add.php`

**Form:** POST to `hospital/appoinment/add_validate`

**Fields (2-row grid layout):**
| Row | Field | Type | Required | Notes |
|---|---|---|---|---|
| 1 | Mobile | number | Yes | Has "+" button for new patient registration modal |
| 1 | Patient Name | text | Yes | |
| 1 | Appointment Date | date | Yes | Default: today |
| 2 | Symptoms | text | Yes | Named `disease` |
| 2 | Physical Handicape | select | No | Yes/No |
| 3 | Gender | select | No | Male/Female/Other |
| 3 | Blood Group | select | No | O+, O-, A+, A-, B+, B-, AB+, AB- |
| 3 | Date Of Birth | date | No | Auto-calculates age via JS |
| 3 | Age | text | No | Auto-filled from DOB |
| 4 | Height (cm) | text | No | |
| 4 | Weight (KG) | text | No | |
| 4 | Relation With Me | text | No | |
| 4 | Doctor | select | Yes | From hospital doctors (excludes BLOCK) |
| 5 | Description | textarea | No | |

**Embedded Modal: New Patient Registration**
- Form: POST to `hospital/registration/submit`
- Fields: Name, Email, Mobile, Gender, Password (readonly="123456"), Confirm Password (readonly="123456")
- **SECURITY ISSUE:** Default password hardcoded as "123456" and readonly
- **JavaScript:** `CreateRandomNumber()` generates 10-digit random number for mobile, creates matching @gmail.com email

**JavaScript:**
- `CreateRandomNumber()` - random 10-digit mobile + matching email

### View: `hospital/appointment_show.php`

**Structure:** Detail table + Chat module

**Detail Table:**
- Appointment ID, Booking From (type), Appointment Date, Patient Name
- Disease, Physical Handicape, Date Of Birth, Age
- Gender, Relation, Height (CM), Weight (KG)
- Book Date, Status (color-coded label)
- Description (spans full width)
- Print button (uses `onclick="print()"`)

**Chat Module:**
- Only shown when status is NOT VISITED and NOT REJECTED
- Only shown when `$appointment->user_id` exists (patient is registered)
- Chat box: 400px height, scrollable, with `#chat` list
- Input: `#text-msg` text field + `#btn-send` button
- **Chat JS (in layout):** polls `get_all_chat_message` every 5 seconds, differentiates sender/receiver with left/right aligned bubbles, auto-scrolls to bottom

### Model Queries Used
- **Booking_model::get_appintment_by_doctor($doctor_id, $status)** → Joins `booking LEFT OUTER users u2` and `LEFT OUTER users u1`, filters by doctor_id and status
- **Booking_model::get_doctor_appointment_one($id, $doctor_id=null)** → Same joins, optional doctor_id filter
- **Booking_model::get_doctor_wise_charges($did, $from, $to)** → `SUM(appointment_charge) as total` from booking, VISITED status, optional date range and doctor filter, grouped by doctor_id
- **Booking_model::get_hospital_appointment_count_pending($hid)** → Count across all hospital doctors' bookings
- **Booking_model::get_hospital_appointment_count_today($hid)** → Count by today's created_at date
- **Booking_model::get_income_by_doc_and_hspital($did, $from, $to)** → `SUM(appointment_charge) as total`, VISITED status, optional date range, grouped by doctor_id
- **Booking_chat_model** (not read, used via `chat->getByAppointment()`, `chat->create()`)
- **Config_model** (not read, used via `config_model->get_one()->admin_charge`)
- **Notifications_model** (not read, used via `notification->create($noti)`)

### Connections
- Creates notifications to doctor and patient on new appointment
- Sends SMS via `sendMobileMessage()`
- Links to Registration module (new patient modal)
- Chat connects to Booking_chat_model
- Income/charges reports share view with Income controller
- Appointment status workflow: PENDING → EXTEND → APPROVE → VISITED / REJECTED

---

## 4.3 Doctor Management

### Controller: `controllers/hospital/Doctor.php`

**Models loaded:** Doctors_model (doctor), Users_model (user), Hospital_model (hospital), Receptionist_model (receptionist), Disease_model (disease), Schedule_pdf_model (schedule), Doctor_type_model (doc_type), Doctor_rating_model (doctor_rating)

### Method: `index()`
- Fetches hospital detail (unused variable `$hosp`)
- Gets doctors: `doctor->get_by_hospital($user_data->id)`
- **View:** `hospital/doctor/view_doctor`

### Method: `add()`
- Loads: `$dis_name` = all diseases, `$doctype` = all doctor types
- **View:** `hospital/doctor/add_doctor`

### Method: `create()`
- **POST handler** - Validation rule: `profile`
- **Dual-table insert strategy:**
  1. Creates user record (`users` table): name, email, gender, mobile_no, status=ACTIVE, role=DOCTOR, password=SHA256
  2. Creates doctor record (`doctors` table): user_id, hospital_id, doctor_type, fees, contact_no, lat, longi, address, description, specialization (JSON), award_and_recognition, eduction, experience, registration_detail
- **BUG:** `if ($user_id = $this->user->create($forUser)) ;` - semicolon after if renders the block unconditional
- `$forDoc['hospital_id']` set to `$this->view_data['user']->id` (hospital's user ID)

### Method: `edit($id)`
- Gets doctor by user_id: `doctor->get_one_by_user($id)`
- Merges user data and doctor data into single object
- Loads diseases and doctor types
- **View:** `hospital/doctor/edit_doctor`

### Method: `update($id)`
- **POST handler** - Validation rule: `profile`
- Updates `doctors` table: all doctor fields + specialization as JSON
- Updates `users` table: name, gender only
- **BUG:** `$id` parameter is the user_id but `user->update($id, ...)` updates by users.id, and `doctor->update($doc_data->id, ...)` uses the doctors table id - this is correct

### Method: `distroy()`
- **STUB:** Only loads the view, no delete logic

### Method: `update_status()`
- **GET params:** `id` (user ID), `st` (status)
- Toggles between ACTIVE and BLOCK
- **BUG:** `update_status_active()` actually sets status to BLOCK, and `update_status_block()` sets status to ACTIVE (logic reversed in Users_model)

### Method: `profile_view()`
- **GET param:** `id` (user ID)
- Loads: doctor profile, doctor average rating, receptionist data
- **View:** `hospital/doctor/view_profile`

### Method: `schedule()`
- Gets schedule files: `schedule->get_by_hospital($user_data->id)`
- **View:** `hospital/upload_schedule`

### Method: `schedule_upload()`
- **FILE POST handler**
- Uploads PDF to `upload/schedule_docs/` with naming: `{date}_{hospital_name}`
- Creates record in `schedule_pdf` table with hospital_id and file_name

### Method: `remove_file($id)`
- **BUG:** References `$scheduleData['upload_error']` which is undefined (should be a string message)
- Deletes file from disk via `unlink()`
- Deletes DB record via `schedule->remove_by_id($id)`

### View: `hospital/doctor/view_doctor.php`

**Structure:** DataTable with columns: No, Name, Email, Mobile, Role, Status, Action

**Action Buttons:**
- View (eye icon) → `hospital/doctor/profile_view?id=$key->id`
- Edit (edit icon) → `hospital/doctor/edit/$key->id`
- Delete (trash icon) → `admin/doctor/distroy?id=$key->id` (HIDDEN, and wrong URL - points to admin)

**Status Toggle:** Clickable label → `hospital/doctor/update_status?id=$key->id&st=$key->status` (toggles ACTIVE/BLOCK)

**JavaScript:** `confirm_delete()` function using SweetAlert - references `admin/doctor/distroy` (wrong URL for hospital context)

### View: `hospital/doctor/add_doctor.php`

**Form:** POST (multipart) to `hospital/doctor/create`

**Fields:**
| Row | Field | Type | Required | Notes |
|---|---|---|---|---|
| 1 | Name | text | Yes | |
| 1 | Gender | select | No | Male/female (lowercase "female" - inconsistent) |
| 1 | User Id | number | No | Auto-generated 4-digit random, READONLY |
| 2 | Email | text | Yes | |
| 2 | Password | text | Yes | |
| 3 | Doctor Type | select | Yes | From `$doctype` |
| 3 | Fees | text | Yes | |
| 3 | Hospital Contact Number | text | No | |
| 4 | Latitude | text | No | |
| 4 | Longitude | text | No | |
| 5 | Address | textarea | Yes | |
| 6 | Description | textarea | Yes | |
| 7 | Disease Specialization | checkboxes | No | From `$dis_name`, multi-select |
| 8 | Award And Recognition | textarea | No | |
| 9 | Eduction | textarea | Yes | (typo: should be "Education") |
| 10 | Experience | textarea | No | |
| 11 | Registration Detail | textarea | No | |

**JavaScript:** `CreateRandomNumber()` auto-generates 4-digit random number on document ready, sets as mobile_no

**SECURITY ISSUES:**
- Auto-generated 4-digit "User Id" used as mobile_no - too short for real mobile numbers
- Password in plain text input

### View: `hospital/doctor/edit_doctor.php`

**Form:** POST to `hospital/doctor/update/$profile->user_id`

**Same fields as add, pre-filled from `$profile`**
- Mobile field: DISABLED (cannot change)
- Specialization checkboxes: decoded from JSON, pre-checked
- Doctor type select: pre-selected by matching `$profile->doctor_type == $type->type`

### View: `hospital/doctor/view_profile.php`

**Layout:** 2-column (3+9)

**Left Column (col-md-3):**
- Profile image, name (Dr. prefix), doctor type
- Rating: `$doctor_average_rating/5`
- Contact details: Fees (Rs.), Address, Hospital Location, Phone, Mobile (+91 prefix), Email, Registration Date

**Right Column (col-md-9):**
- Tabbed interface (tabs: Personal Detail, Receptionist - hidden)
- **Personal Detail tab:** About Me (description), Specialization (labels from JSON), Eduction, Experience, Award & Recognition, Registration Detail
- **Receptionist tab:** Hidden via inline style, shows receptionist profile if assigned

### Model Queries Used
- **Doctors_model::get_by_hospital($hid)** → Raw SQL join `doctors + users` where `hospital_id=$hid`
- **Doctors_model::get_one_by_user($user_id)** → `SELECT * FROM doctors WHERE user_id=$id`
- **Doctors_model::get_profile($id)** → Join `doctors + users` where `doctors.user_id = users.id` and `doctors.user_id = $id`
- **Users_model::count_doctor_by_hospital($id)** → `SELECT COUNT(*) FROM doctors WHERE hospital_id=$id`
- **Schedule_pdf_model::get_by_hospital($id)** → `SELECT * FROM schedule_pdf WHERE hospital_id=$id`
- **Schedule_pdf_model::get_by_id($id)** → `SELECT * FROM schedule_pdf WHERE id=$id`
- **Schedule_pdf_model::remove_by_id($id)** → `DELETE FROM schedule_pdf WHERE id=$id`
- **Doctor_rating_model::get_average_rating($id)** (not read, returns average rating)
- **Receptionist_model::get_receptionist_by_doctor($id)** (not read, returns receptionist data)
- **Disease_model::get_all()** (not read, returns all diseases for checkboxes)
- **Doctor_type_model::get_all()** (not read, returns all doctor types for dropdown)

### Connections
- Connects to Disease, Doctor_type, Doctor_rating, Receptionist models
- Schedule upload connects to Schedule_pdf_model
- Profile view links to receptionist data
- Hospital can create doctors directly (dual-table insert to users + doctors)

---

## 4.4 Income Summary

### Controller: `controllers/hospital/Income.php`

**Models loaded:** Doctors_model (doctor), Users_model (user), Hospital_model (hospital), Receptionist_model (receptionist), Disease_model (disease), Booking_model (booking)

### Method: `index()`
- **GET params:** `doctor`, `fromdate`, `todate` (all optional)
- Gets hospital doctors: `hospital->get_doctor_by_hospital($user->id)` (joins doctors+users)
- For each doctor, gets income: `booking->get_income_by_doc_and_hspital($doc->user_id, $fromdate, $todate)`
- **BUG:** `if ($doc->total=$income)` uses assignment (=) instead of comparison (==)
- **View:** `hospital/income_summary`

### View: `hospital/income_summary.php`

**Filter Form (GET):**
- From Date (date input)
- To Date (date input, label says "From Date" - BUG)
- Doctor (select dropdown from `$doctorcharge`)
- Filter button

**Table Columns:** No, Image (40px), Doctor Name, Email, Mobile, Charges (Rs.)
- Shows `0 Rs.` if total is empty

**DataTable:** Uses `#example1` with DataTables plugin

### Model Queries Used
- **Hospital_model::get_doctor_by_hospital($id)** → `SELECT doctors.*, users.name, users.email, users.mobile_no, users.status, users.profile_img, users.id as did FROM doctors, users WHERE doctors.user_id=users.id AND doctors.hospital_id=$id`
- **Booking_model::get_income_by_doc_and_hspital($did, $from, $to)** → `SUM(appointment_charge) as total` from booking, VISITED status, optional date range, grouped by doctor_id

### Connections
- Also accessible from `Appoinment::charges_income()` which uses different query (`get_doctor_wise_charges`)
- Depends on VISITED status bookings only

---

## 4.5 Hospital Profile

### Controller: `controllers/hospital/Profile.php`

**Models loaded:** Posts_model (blog - unused), Users_model (user), Hospital_model (hospital), State_model (state), City_model (city)

### Method: `index()`
- **View:** `hospital/common/profile_update`
- **BUG:** Does not load `userdetail` or `hospitaldetil` which the view expects - will cause errors

### Method: `update_profile()`
- Loads: user detail, all states, hospital detail
- **View:** `hospital/common/profile_update`

### Method: `update_validate()`
- **POST handler** - Validation rule: `hospital_profile`
- Updates `users` table: name, gender, updated_at (email unset/disabled)
- Updates `hospital` table: hospital_name, address, state, city, contact_no, lat, longi, user_id

### Method: `upload_profile_img()`
- **FILE POST handler**
- Uploads to `upload/profile/` with naming: `{date}_{user_id}`
- Deletes old profile image if not `default.png`
- Updates `users.profile_img`

### Method: `change_password()`
- **POST handler** - Validation rule: `change_password`
- Custom validation callback: `valid_current_password()` - hashes input with SHA256 and checks against DB
- Updates password: `hash("sha256", $new_pass)`

### Method: `valid_current_password($str)`
- Custom validation callback for change_password form
- Hashes input and checks against DB via `user->checkCurrentPassword()`

### Method: `city_by_state()`
- **AJAX endpoint** (POST)
- Returns JSON of cities for a given state name
- Calls `city->get_city_by_state_name($state)`

### View: `hospital/common/profile_update.php`

**Layout:** 2-column (3+9)

**Left Column (col-md-3): Profile Image Upload**
- Shows current profile image (`100x100`, circular)
- File input + Change button
- Form: POST (multipart) to `hospital/profile/upload_profile_img`

**Right Column (col-md-9): Profile Tab**
- **Form:** POST to `hospital/profile/update_validate`
- **Fields:**
  | Field | Type | Editable | Notes |
  |---|---|---|---|
  | Name | text | Yes | |
  | Email | text | No (disabled) | |
  | Contact Number | text | No (disabled) | Maxlength 10 |
  | Gender | select | Yes | Male/Female only |
  | hospital_id | hidden | - | For update reference |
  | Hospital Name | text | Yes | |
  | Address | textarea | Yes | |
  | State | select | Yes | From `$state`, triggers `loadCity()` |
  | City | select | Yes | Populated via AJAX |
  | Latitude | text | Yes | |
  | Longitude | text | Yes | |
  | Hospital Contact | text | Yes | |

**Change Password Section (below, full width):**
- Form: POST to `hospital/profile/change_password`
- Fields: Current Password, New Password, Confirm Password
- Submit button inline with current password field

**JavaScript (in layout):**
- `loadCity()` posts state to `hospital/profile/city_by_state`, populates city dropdown
- Auto-selects current city on page load

### Model Queries Used
- **Users_model::get_by_id($id)** → `SELECT * FROM users WHERE id=$id`
- **Users_model::update($id, $data)** → `UPDATE users SET ... WHERE id=$id`
- **Users_model::checkCurrentPassword($id, $str)** → `SELECT * FROM users WHERE id=$id AND password=SHA256($str)`
- **Hospital_model::get_one_by_user($user_id)** → `SELECT * FROM hospital WHERE user_id=$id`
- **Hospital_model::update_profile($id, $data)** → `UPDATE hospital SET ... WHERE id=$id`
- **State_model::get_all()** (not read, returns all states)
- **City_model::get_city_by_state_name($state)** (not read, returns cities by state)

### Connections
- City dropdown depends on State/City models via AJAX
- Profile image stored in `upload/profile/` directory
- Password hashing: SHA256 (weak by modern standards)

---

## 4.6 Blog Management

### Controller: `controllers/hospital/Blog.php`

**Models loaded:** Posts_model (blog), Users_model (user)

### Method: `index()`
- Gets all posts: `blog->get_all_by_user($user_data->id)`
- **View:** `hospital/post/blog_view`

### Method: `add()`
- **View:** `hospital/post/blog_add`

### Method: `add_validate()`
- **POST handler** - Validation rule: `blog`
- Handles optional image upload to `upload/blog/`
- Sets: status=PUBLISHED, type=BLOG, user_id, paramalink (slug)
- Removes `_wysihtml5_mode` from post data
- If no image: still creates post without image

### Method: `update_status()`
- **GET params:** `id`, `st`
- Toggles between PUBLISHED and HIDE (Draft)

### Method: `update()`
- **GET params:** `id`, `uid`
- Loads post: `blog->get_one_by_user($id, $user_id)`
- **View:** `hospital/post/blog_edit`

### Method: `update_validate($id)`
- **POST handler** - Validation rule: `blog`
- Optional image upload (deletes old image if replaced)
- Sets: type=BLOG, paramalink (regenerated)
- **BUG on error:** References `hospital/blog_edit` instead of `hospital/post/blog_edit`

### Method: `distroy()`
- **GET params:** `id`, `uid`
- Calls `blog->destroy($id, $uid)`
- **BUG:** Method name `_alertwarningResponce` (lowercase 'w') - should be `_alertWarningResponce`

### Method: `generateUrl($str)`
- Recursive slug generator
- Uses `_generateSeoURL($str)` from parent
- Checks uniqueness in `posts` table via `paramalink`
- Appends random number (1-99) if duplicate

### View: `hospital/post/blog_view.php`

**Table Columns:** No, Title (unlinked), Type, Date, User (email), Status (toggleable label), Action

**Status Toggle:** Clickable label → `hospital/blog/update_status?id=&st=` (toggles Published/Draft)
- Green = Published, Red = Draft

**Actions:**
- Edit (warning icon) → `hospital/blog/update?id=&uid=`
- Delete (danger icon) → `hospital/blog/distroy?id=&uid=` with confirm dialog

### View: `hospital/post/blog_add.php`

**Form:** POST (multipart) to `hospital/blog/add_validate`

**Fields:**
| Field | Type | Required | Notes |
|---|---|---|---|
| Title | text | Yes | |
| Post/Content | textarea (CKEditor `#editor1`) | Yes | |
| Video Link | text | No | Optional, placeholder shows YouTube embed example |
| Image | file | No | Optional, error shown if upload fails |

### View: `hospital/post/blog_edit.php`

**Same as add, pre-filled:**
- Title: pre-filled from `$post->title`
- Content: pre-filled from `$post->content`
- Video Link: pre-filled from `$post->video_link`
- Image: shows current image (200x200), optional replacement
- Submit button text: "UPDATE"

### Model Queries Used
- **Posts_model::get_all_by_user($user_id)** (not read, returns posts by user)
- **Posts_model::get_one_by_user($id, $user_id)** (not read, returns single post)
- **Posts_model::get_by_id($id)** (not read, returns post by ID)
- **Posts_model::create($data)** (not read, inserts to `posts` table)
- **Posts_model::update($id, $data)** (not read, updates `posts` table)
- **Posts_model::destroy($id, $uid)** (not read, deletes from `posts` table)

### Connections
- CKEditor 4.11.1 loaded in master layout for `#editor1`
- WysiHTML5 as fallback
- Images stored in `upload/blog/`
- Slug uniqueness checked against `posts` table

---

## 4.7 Patient Registration

### Controller: `controllers/hospital/Registration.php`

**Models loaded:** None in constructor (uses `$this->user` which is NOT loaded - **BUG**: relies on parent/base not loading it)
- Actually, looking more closely: the parent `Hospital_contoller` does NOT load user model. But `Registration` uses `$this->user->create()` in `submit()` - this will fail unless loaded elsewhere. **However**, since the Registration controller is typically called after the appointment_add page (which loads Users_model), this might work if CodeIgniter's model registry persists across requests in the same session. **This is a potential runtime bug.**

### Method: `index()`
- **View:** `hospital/registration/index`

### Method: `submit()`
- **POST handler** - Validation rule: `receptionist_patient_registration`
- Sets: `role=PATIENT`, `status=ACTIVE`, `password=SHA256`
- Removes `c_pass`
- Sends SMS welcome message with mobile as account ID and plaintext password
- Sets flash: `mobileno` (for pre-filling appointment form), `alert_msg`, `alert_class`
- Redirects to `hospital/appoinment/add`

**SECURITY ISSUES:**
- Password sent in plaintext SMS
- No email verification (commented out)
- Uses same validation rule as receptionist registration

### View: `hospital/registration/index.php`

**Form:** POST (multipart) to `hospital/registration/submit`

**Fields:**
| Row | Field | Type | Required |
|---|---|---|---|
| 1 | Name | text | Yes |
| 1 | Email | email | Yes |
| 2 | Mobile | text | Yes | Maxlength 10 |
| 2 | Gender | select | Yes | Male/Female/Other |
| 3 | Password | password | Yes | |
| 3 | Confirm Password | password | Yes | |

### Connections
- Registration redirect to appointment add (flash mobile number)
- Embedded in appointment_add.php as modal
- Also accessible standalone at `hospital/registration`

---

## 4.8 Upload Schedule

**NOTE:** No dedicated `Upload_schedule.php` controller exists. Schedule functionality is handled within `Doctor.php` controller.

### Controller Methods (in `Doctor.php`):

**`schedule()`** - Lists schedule files
- Gets: `schedule->get_by_hospital($user_data->id)`
- **View:** `hospital/upload_schedule`

**`schedule_upload()`** - Uploads new schedule PDF
- Upload path: `upload/schedule_docs/`
- File naming: `{Y-m-d}_{hospital_name}`
- Creates record: `schedule_pdf` table (hospital_id, file_name)

**`remove_file($id)`** - Deletes schedule file
- Deletes from disk: `unlink('./upload/schedule_docs/' . $file_name)`
- Deletes from DB: `schedule->remove_by_id($id)`

### View: `hospital/upload_schedule.php`

**Two sections:**

**Section 1: Upload Form**
- File input for PDF upload
- Form: POST (multipart) to `hospital/doctor/schedule_upload`
- Submit button with double-click prevention
- Back link to `hospital/appoinment`

**Section 2: File List Table**
- Columns: No, Date (created_at), Action
- View button: opens PDF in new tab (`upload/schedule_docs/{file_name}`)
- Delete button: `hospital/doctor/remove_file/{id}`

### Model Queries Used
- **Schedule_pdf_model::create($data)** → `INSERT INTO schedule_pdf (hospital_id, file_name, created_at)`
- **Schedule_pdf_model::get_by_hospital($id)** → `SELECT * FROM schedule_pdf WHERE hospital_id=$id`
- **Schedule_pdf_model::get_by_id($id)** → `SELECT * FROM schedule_pdf WHERE id=$id`
- **Schedule_pdf_model::remove_by_id($id)** → `DELETE FROM schedule_pdf WHERE id=$id`

### Connections
- Sidebar link: `hospital/doctor/schedule`
- Files stored in `upload/schedule_docs/`

---

## Database Tables Used

| Table | Used By | Operations |
|---|---|---|
| `users` | All controllers | CRUD, auth, status toggle |
| `doctors` | Doctor, Dashboard, Income | CRUD, joins with users |
| `hospital` | Profile, Doctor, Dashboard, Income | Read, update profile |
| `booking` | Appointment, Dashboard, Income | CRUD, status updates, aggregations |
| `posts` | Blog | CRUD, status toggle |
| `schedule_pdf` | Doctor (schedule) | Create, read, delete |
| `notifications` | Appointment | Create |
| `booking_chat` | Appointment (chat) | Create, read |
| `config` | Appointment | Read (admin_charge) |
| `doctor_rating` | Doctor | Read (average) |
| `disease` | Doctor | Read (all) |
| `doctor_type` | Doctor | Read (all) |
| `receptionist` | Doctor (profile view) | Read |
| `states` | Profile | Read (all) |
| `cities` | Profile | Read (by state) |

---

## Complete Bug & Issue Registry

### Critical Bugs
1. **`Doctor::create()` line 81**: Semicolon after `if` makes doctor creation always execute regardless of user creation result
2. **`Registration` controller**: Does not load `Users_model` but uses `$this->user->create()` - likely runtime error
3. **`Doctor::remove_file()`**: References undefined `$scheduleData['upload_error']`
4. **`Users_model::update_status_active()`**: Sets status to BLOCK (logic reversed with `update_status_block()`)
5. **`Booking_model::get_hospital_appointment_all()`**: Contains `var_dump($this->db->last_query()); exit();` - debug code left in
6. **`Profile::index()`**: Does not load `$userdetail` or `$hospitaldetil` which the view requires

### Security Issues
1. **Hardcoded default password "123456"** in patient registration modal
2. **SHA256 password hashing** (no salt, weak by modern standards)
3. **Plaintext password sent via SMS** after registration
4. **SQL injection risk**: `Doctors_model::get_by_hospital()` uses raw SQL with unsanitized `$hid`
5. **No CSRF protection** on forms
6. **No XSS protection** visible on chat messages
7. **`createRandomNumber()`** generates credentials (mobile/email) - potential for impersonation
8. **`Hospital_model::get_search_hospital()`**: Raw `$keyword` and `$city` in LIKE clauses - SQL injection

### UI/UX Bugs
1. **Sidebar Dashboard link** points to `admin/dashboard` instead of `hospital/dashboard`
2. **Income summary form**: "From Date" label used twice (second should be "To Date")
3. **Delete button in view_doctor** links to `admin/doctor/distroy` (wrong module)
4. **`Blog::update_validate()` error view** references `hospital/blog_edit` instead of `hospital/post/blog_edit`
5. **`Blog::distroy()`** calls `_alertwarningResponce` (lowercase 'w') - likely fatal error
6. **`CreateRandomNumber()`** in global layout fires on every page load, may cause JS errors when `#mobile_no` doesn't exist
7. **Gender select in add_doctor**: "female" lowercase while other options are capitalized
8. **Typo**: "Eduction" throughout (should be "Education")
9. **Typo**: "Appoinment" in controller name and URLs
10. **Typo**: "Hospital_contoller" class name
11. **Chat system**: `placehold.it` images used for avatars (external dependency)

### Logic Issues
1. **`Income::index()`**: Assignment `=` instead of comparison `==` in `if ($doc->total=$income)`
2. **Appointment `add_validate()`**: SMS message references `$this->view_data['doctors'][0]->name` (first doctor, not selected doctor)
3. **`Doctor::update_status()`**: Status toggle logic relies on reversed Users_model methods
4. **`Booking_model::get_today_doctor_appointment()`**: Uses `date('Y-m-d 00:00:00')` which includes time portion unnecessarily

---

## Module Dependency Map

```
Hospital Dashboard
├── Dashboard (overview + chart)
│   ├── Posts_model (post count)
│   ├── Users_model (doctor count, user data)
│   ├── Booking_model (pending/today counts)
│   ├── Doctors_model (doctor list for cards)
│   └── Hospital_model (chart data)
├── Appointment
│   ├── Booking_model (CRUD, status, chat)
│   ├── Doctors_model (doctor list/lookup)
│   ├── Users_model (patient lookup, user data)
│   ├── Config_model (admin charge)
│   ├── Notifications_model (create notifications)
│   ├── Booking_chat_model (chat messages)
│   └── Registration (patient creation)
├── Doctor Management
│   ├── Doctors_model (CRUD)
│   ├── Users_model (CRUD, auth)
│   ├── Hospital_model (hospital lookup)
│   ├── Disease_model (specialization list)
│   ├── Doctor_type_model (type list)
│   ├── Doctor_rating_model (average rating)
│   ├── Receptionist_model (receptionist data)
│   └── Schedule_pdf_model (schedule files)
├── Income Summary
│   ├── Hospital_model (doctor list)
│   └── Booking_model (income aggregation)
├── Profile
│   ├── Users_model (CRUD, password check)
│   ├── Hospital_model (profile CRUD)
│   ├── State_model (state list)
│   └── City_model (city list by state)
└── Blog
    └── Posts_model (CRUD, status toggle)
```

---

## File Inventory

### Controllers (7 files, 1 missing)
| File | Class | Methods | Status |
|---|---|---|---|
| `hospital/Dashboard.php` | Dashboard | index | Complete |
| `hospital/Appoinment.php` | Appoinment | index, show, add, add_validate, generateBookingNumber, extend, approve, visited, cancel, reject, charges_income, appointment_show_detail, get_all_chat_message, send_chat_msg | Complete |
| `hospital/Doctor.php` | Doctor | index, add, create, edit, update, distroy, update_status, profile_view, schedule, schedule_upload, remove_file | Complete (schedule methods) |
| `hospital/Income.php` | Income | index | Complete |
| `hospital/Profile.php` | Profile | index, update_profile, update_validate, upload_profile_img, change_password, valid_current_password, city_by_state | Complete |
| `hospital/Blog.php` | Blog | index, add, add_validate, update_status, update, update_validate, distroy, generateUrl | Complete |
| `hospital/Registration.php` | Registration | index, submit | Complete |
| `hospital/Upload_schedule.php` | - | - | **MISSING** (functionality in Doctor.php) |

### Views (15 files)
| File | Used By | Purpose |
|---|---|---|
| `layouts/master_page_hospital.php` | All | Master layout with sidebar, header, global JS |
| `hospital/common/dashboard.php` | Dashboard | Dashboard overview |
| `hospital/appointment.php` | Appoinment | Appointment list |
| `hospital/appointment_add.php` | Appoinment | New appointment form + registration modal |
| `hospital/appointment_show.php` | Appoinment | Appointment detail + chat |
| `hospital/doctor/view_doctor.php` | Doctor | Doctor list table |
| `hospital/doctor/add_doctor.php` | Doctor | Doctor creation form |
| `hospital/doctor/edit_doctor.php` | Doctor | Doctor edit form |
| `hospital/doctor/view_profile.php` | Doctor | Doctor profile display |
| `hospital/income_summary.php` | Income | Income/charges report |
| `hospital/common/profile_update.php` | Profile | Hospital profile + password change |
| `hospital/post/blog_view.php` | Blog | Blog list |
| `hospital/post/blog_add.php` | Blog | Blog creation form |
| `hospital/post/blog_edit.php` | Blog | Blog edit form |
| `hospital/registration/index.php` | Registration | Patient registration form |
| `hospital/upload_schedule.php` | Doctor | Schedule PDF upload/list |

### Models (5 files reviewed)
| File | Table(s) | Hospital-specific Methods |
|---|---|---|
| `Hospital_model.php` | hospital, users | get_chart_data_month_wise, get_doctor_by_hospital, get_one_by_user, update_profile, get_search_hospital |
| `Booking_model.php` | booking | get_hospital_appointment_count_pending, get_hospital_appointment_count_today, get_appintment_by_doctor, get_doctor_wise_charges, get_income_by_doc_and_hspital |
| `Doctors_model.php` | doctors | get_by_hospital, get_hospital_doctors, get_profile |
| `Schedule_pdf_model.php` | schedule_pdf | get_by_hospital, get_by_id, remove_by_id |
| `Users_model.php` | users | count_doctor_by_hospital, get_by_mobile, checkCurrentPassword, update_status_active/block |

### Models Referenced But Not Read
| Model | Used By | Purpose |
|---|---|---|
| Posts_model | Dashboard, Blog | Blog CRUD |
| Config_model | Appoinment | Get admin_charge setting |
| Notifications_model | Appoinment | Create notifications |
| Booking_chat_model | Appoinment | Chat messages |
| Disease_model | Doctor | Disease list |
| Doctor_type_model | Doctor | Doctor type list |
| Doctor_rating_model | Doctor | Average rating |
| Receptionist_model | Doctor | Receptionist data |
| State_model | Profile | State list |
| City_model | Profile | City list by state |
