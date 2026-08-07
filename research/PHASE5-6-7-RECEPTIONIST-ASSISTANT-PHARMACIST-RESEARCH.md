# Phase 5: Receptionist Dashboard
## Overview
The Receptionist module is tied to a specific **doctor** via the `receptionist` table (`user_id` → `doctor_id`). Every receptionist operates **within the scope of their assigned doctor**. The base controller is `Reception_contoller` (note: typo in original code). Layout: `master_page_receptionist.php`. AdminLTE 2.4.0 skin-black-light theme.

**Sidebar Navigation:**
1. Dashboard
2. Blog
3. Appointments
4. Manage Schedule
5. Medicine List

**Shared Models Loaded:** Receptionist_model, Booking_model, posts_model, Doctor_rating_model, Doctors_model, Hospital_model, Users_model, Notifications_model, Config_model, Doctor_holiday_schedule_model, Doctor_assistants_model, Booking_chat_model, Doctor_medicine_list_model.

---

### 5.1 Dashboard (Main Overview)
#### Controller: `receptionist/Dashboard.php`
- **Class:** `Dashboard extends Reception_contoller`
- **Constructor:** Loads Receptionist_model, Booking_model, posts_model, Doctor_rating_model, Doctors_model, Hospital_model. Sets `$this->user_data->doctor_id` from `Receptionist_model->get_by_user_id($this->user_data->id)->doctor_id`.
- **Method `index()`:** GET. Queries:
  - `$doctor->get_active_user(doctor_id)` — doctor profile
  - `$hospital->get_one_by_user(doctor->hospital_id)` — hospital info
  - `$book->get_today_doctor_appointment(doctor_id, PENDING)` — count, then `count()`
  - `$post->get_all_by_user(user_id)` — count for "My Blogs"
  - `$book->get_today_doctor_appointment(doctor_id, VISITED)` — count
  - `$book->get_doctor_appointments_latest(doctor_id)` — latest 5 bookings
  - `$book->get_doctor_appointments_today(doctor_id)` — today's appointments
- **View data:** `$hospital`, `$doctor`, `$today_pending_appointment`, `$my_blog`, `$today_visited_appointment`, `$appointments`, `$today_appointments`
- **Renders:** `layouts/master_page_receptionist` → `receptionist/dashboard`

#### Model Queries
- **Receptionist_model::get_by_user_id($user_id)** — `SELECT * FROM receptionist WHERE user_id = $user_id` (returns single row)
- **Booking_model** — various appointment query methods (shared across all modules)

#### View: `receptionist/dashboard.php`
- **3 info boxes** (top row):
  - Today Pending Appointment (yellow) → links to `receptionist/appointment`
  - Today Visited Appointment (green) → links to `receptionist/appointment?status=Visited`
  - My Blogs (red) → links to `receptionist/post`
- **2 profile cards** (middle row):
  - My Hospital: shows `hospital_name`, `address`, `city`, `state`, `contact_no` (conditional on `$hospital` existence)
  - My Doctor: shows `doctor->profile_img`, `Dr. name`, `address`, `city`, `state`, `contact_no`
- **2 tables** (bottom row):
  - "Latest booked 5 appointment" — columns: #, Appointment ID (link to show), Date, Who booked (name/mobile/email or BY_SELF), Patient Name, Disease, Status (color-coded labels)
  - "Today Appointments" — same columns, shows "No data" if empty
- **No JS/AJAX** on this page. No DataTables.

#### Connections
- Links to: `receptionist/appointment`, `receptionist/post`, individual appointment show pages
- Depends on: Doctors_model, Hospital_model, Booking_model, posts_model

---

### 5.2 Appointment Management
#### Controller: `receptionist/Appointment.php`
- **Class:** `Appointment extends Reception_contoller`
- **Constructor loads:** Booking_model, Notifications_model, Receptionist_model, Doctor_assistants_model, Doctors_model, Doctor_holiday_schedule_model, Users_model, Config_model, Booking_chat_model

#### Method `index()` — List Appointments
- **GET.** Params: `?status=` (defaults to `PENDING`)
- Query: `$book->get_doctor_appointment(doctor_id, $status)`
- View: `receptionist/appointment/index`

#### Method `create()` — New Appointment Form
- **GET.** Loads doctor info, next holidays (JSON for datepicker)
- View: `receptionist/appointment/book`

#### Method `book()` — Submit New Appointment
- **POST.** Validation rule: `booking_by_receptionist`
- Logic:
  1. Gets doctor info, checks daily limit (commented out but code present)
  2. Looks up user by mobile via `$user->get_by_mobile($data['mobile'])`
  3. Sets `doctor_id`, `user_id` (or null), `status=APPROVE`, `appointment_charge` from Config_model, `booking_type=BY_RECEPTIONIST`
  4. Generates booking number: `APMT-{increment}` via `generateBookingNumber()`
  5. Creates booking record
  6. Sends notification to doctor AND patient (if user_id exists)
  7. Sends SMS via `sendMobileMessage()`
- **Flash/Redirect:** `_alertInfoResponce()` → `receptionist/appointment`
- On validation failure: reloads book form with holidays

#### Method `get_appointment_table()` — AJAX Table Refresh
- **GET.** Params: `?status=` (defaults to `PENDING`)
- Query: `$book->get_doctor_appointment(doctor_id, $status, DESC)`
- Returns: `receptionist/appointment/get_appointment_table` (partial HTML)

#### Method `show($id)` — View Single Appointment
- **GET.** Params: URL segment `$id`
- Query: `$book->get_doctor_appointment_one($id, doctor_id)`
- Null check → redirect `doctor/appointment` (BUG: should be `receptionist/appointment`)
- View: `receptionist/appointment/show`

#### Method `approve($id)` — Approve Appointment
- **GET.** Status guards: not VISITED, not REJECTED
- Updates status to `APPROVE`
- Sends notifications to: doctor, patient, AND assistant (if exists via `Doctor_assistants_model->get_assistant_by_doctor()`)
- Sends SMS to patient
- Redirect: `receptionist/appointment?status=Approve`

#### Method `visited($id)` — Mark as Visited
- **GET.** Status guards: not REJECTED, not PENDING, not EXTEND
- Updates status to `VISITED`
- Sends notifications to: doctor, patient
- Sends SMS to patient
- Redirect: `receptionist/appointment?status=Visited`

#### Method `reject($id)` — Reject Appointment
- **GET.** Status guard: not VISITED
- Updates status to `REJECTED`
- Sends notifications to: doctor, patient
- Redirect: `receptionist/appointment?status=Rejected`

#### Method `extend($id)` — Extend Appointment
- **GET.** Status guards: not APPROVE, not VISITED, not REJECTED
- Updates status to `EXTEND`
- Sends notifications to: doctor, patient
- Redirect: `receptionist/appointment?status=Extend`

#### Method `date_booked()` — AJAX Count Booked
- **POST.** Params: `doctor`, `date`
- Returns JSON: `{"booked": count}`
- Query: `$book->get_booking_count_by_date_by_doctor()`

#### Method `check_emergency()` — Emergency Check
- **GET.** Returns `receptionist/appointment/check_emergency` partial

#### Method `get_all_chat_message()` — Chat Messages
- **POST.** Params: `appointid`
- Returns JSON of chat messages via `Booking_chat_model->getByAppointment()`

#### Method `send_chat_msg()` — Send Chat Message
- **POST.** Params: `appointId`, `msg`
- Sets `from_id = user_data->id`, `to_id = booking->user_id`, `status = UNREAD`

#### Method `email_exist_check($email)` — Custom Validation
- Checks if email exists in users table

#### Method `generateBookingNumber()`
- Format: `APMT-{N}` where N is incremented from last record

#### View: `receptionist/appointment/index.php`
- **Status filter dropdown** (top right): PENDING, EXTEND, APPROVE, VISITED, REJECTED, All
- **DataTable** (`dttable` class) with columns: #, Appointment ID (link), Date, Booked By, Patient Name, Disease, Status, Action
- **Action buttons by status:**
  - PENDING: Approve (blue thumbs-up), Extend (info arrow-right), Reject (danger close)
  - EXTEND: Approve, Reject
  - APPROVE: Visited (green check), Reject
  - VISITED/REJECTED: "-" (no actions)
- **AJAX auto-refresh:** `setInterval` every 10 seconds loads `get_appointment_table?status=X` into `#ajaxTable`
- **JS functions:** `changeStatus()`, `visited()`, `approve()`, `extend()` — all trigger AJAX table reload

#### View: `receptionist/appointment/book.php`
- **Form:** POST to `receptionist/appointment/book`
- **Fields:**
  - Mobile (text, required) with "+" button → opens modal for new patient registration
  - Patient Name (text, required)
  - Appointment Date (datepicker, required, default today)
  - Symptoms / Disease (text)
  - Physical Handicap (select: No/Yes, required)
  - Gender (select: Male/Female/Other)
  - Blood Group (select: O+/-, A+/-, B+/-, AB+/-)
  - Date of Birth (date input)
  - Age (text, auto-calculated from DOB via JS)
  - Height cm, Weight KG (text)
  - Relation With Me (text)
  - Description (textarea)
- **Modal** (id `modal-default`): "New Patient" registration form
  - Fields: Name, Email, Mobile (auto-generated random 10-digit + @doctorooms.com), Gender, Password (readonly "123456"), Confirm Password (readonly)
  - Form action: `receptionist/registration/submit`
- **JS:**
  - DOB change → auto-calculates age
  - Datepicker with holiday dates disabled, start=today, end=today+booking_days
  - Booking date change → AJAX `date_booked` shows count
  - `CreateRandomNumber()` generates 10-digit random mobile for new patient

#### View: `receptionist/appointment/show.php`
- **Appointment details table:** Appointment ID, Booking From, Date, Patient Name, Disease, Physical Handicap, DOB, Age, Gender, Relation, Height, Weight, Book Date, Status, Description
- **Action buttons** (same status-based logic as index)
- **Print button** (top right)
- **Chat Box** (only shown if status != VISITED && != REJECTED && user_id exists):
  - 400px scrollable div, loads chat via AJAX every 5 seconds
  - Input + Send button
  - Messages rendered as left/right chat bubbles with timestamps
  - **BUG on line 229:** Stray text `DGKPM4300J` after chat send JS

#### View: `receptionist/appointment/get_appointment_table.php`
- Partial HTML table (same structure as index, loaded via AJAX)
- **BUG:** Links point to `doctor/appointment/show/` instead of `receptionist/appointment/show/`
- **BUG:** Shows `BY_RECEPTIONIST` constant for non-user bookings (inconsistency)
- Initializes DataTable on load

#### View: `receptionist/appointment/check_emergency.php`
- Simple partial: shows warning "Doctor is in Emergency" or "New" button
- Uses `$is_emergency` variable (not passed from controller — **BUG: undefined variable**)

#### Connections
- **Notifications_model:** Creates notifications on approve/extend/visited/reject/book
- **Doctor_assistants_model:** Notifies assistant on approve
- **Booking_chat_model:** Real-time chat between receptionist and patient
- **Users_model:** Patient lookup by mobile
- **Config_model:** Admin charge for appointment
- **Doctor_holiday_schedule_model:** Holiday dates for datepicker

---

### 5.3 Patient Registration
#### Controller: `receptionist/Registration.php`
- **Class:** `Registration extends Reception_contoller`
- **Method `index()`:** GET. Renders `receptionist/appointment/book` (same view as appointment booking — **BUG: should be `receptionist/registration/index`**)
- **Method `submit()`:** POST
  - Validation: `receptionist_patient_registration`
  - Sets `role=PATIENT`, `status=ACTIVE`
  - Password: `hash("sha256", password)`
  - Creates user via `$this->user->create()`
  - Sends SMS: "Welcome, {name}. You are successfully registered to {SITE_TITLE}. Your account id is your mobile number and your password is: {password}"
  - Sets flash: `alert_msg`, `alert_class`, `mobileno`, `uname`
  - Redirects: `receptionist/appointment/create`
  - On validation failure: reloads book view

#### View: `receptionist/registration/index.php`
- Standalone registration form (not used due to controller redirect bug)
- Fields: Name, Email, Mobile (with random generator button), Gender, Password, Confirm Password
- JS: `CreateRandomNumber()` generates 10-digit random number

#### Connections
- Used from modal in `book.php` view
- Creates records in `users` table with PATIENT role

---

### 5.4 Schedule Management (Holiday Management)
#### Controller: `receptionist/Schedule.php`
- **Class:** `Schedule extends Reception_contoller`
- **Constructor loads:** Doctor_holiday_schedule_model, Doctors_model, Receptionist_model

#### Method `index()` — List Holidays
- **GET.** Queries:
  - `$holiday_schedule->get_all_by_user(doctor_id)` — all holidays
  - `$doctor->get_one_by_user(doctor_id)` — doctor with booking_days
- View: `receptionist/schedule/index`

#### Method `update_appointment_day()` — Update Booking Days
- **POST.** Validation: `days` required, natural_no_zero, max 180
- Updates `doctors` table `booking_days` field
- Redirect: `receptionist/schedule`

#### Method `create()` — Add Holiday Form
- **GET.** View: `receptionist/schedule/add` with extra JS: `receptionist/schedule/script`

#### Method `store()` — Save Holidays
- **POST.** Params: `schedule[]` (array of [date, remark])
- Appends `user_id = doctor_id` to each entry
- Batch insert via `$holiday_schedule->create_many()`
- Redirect: `receptionist/schedule`

#### Method `delete($id)` — Delete Single Holiday
- **GET.** Ownership check, then `$holiday_schedule->destroy($id, doctor_id)`

#### Method `delete_multi()` — Delete Selected Holidays
- **POST.** Params: `selection[]` (checkbox IDs)
- Loops and deletes each

#### View: `receptionist/schedule/index.php`
- **Booking Days form:** text input with current `doctor->booking_days`, Update button
- **Holiday list table** (DataTable `dttable`):
  - Columns: checkbox, #, Date, Remark, Action (delete button)
  - Past dates highlighted with `danger` class, future with `success`
  - Select All checkbox, Delete Selected button
- **JS:** `$("#selectAll").click()` checks all checkboxes

#### View: `receptionist/schedule/add.php`
- Dynamic table with Add More button
- Each row: date input (type=date, onchange=checkDate), remark text input, delete button
- Form POST to `receptionist/schedule/store`

#### View: `receptionist/schedule/script.php`
- JS for add-more row generation (heredoc PHP → htmlspecialchars)
- `checkDate()`: prevents selecting past dates
- `removeItem()`: removes table row

#### Connections
- Updates `doctors.booking_days` for appointment booking range
- Manages `doctor_holiday_schedule` table for the assigned doctor

---

### 5.5 Medicine Master
#### Controller: `receptionist/Medicinemaster.php`
- **Class:** `Medicinemaster extends Reception_contoller`
- **Constructor loads:** Doctor_medicine_list_model, Receptionist_model

#### Method `index()` — List Medicines
- **GET.** Query: `$medicine->get_all_by_doctor(doctor_id)`
- View: `receptionist/medicine/index`

#### Method `add()` — Add Form
- **GET.** View: `receptionist/medicine/add`

#### Method `add_validate()` — Save New Medicine
- **POST.** Validation: `medicine` rule
- Data: name, morning, afternoon, evening, doz (JSON encoded array), tab, description, user_id=doctor_id, status=ACTIVE, timestamps, created_by
- Redirect: `receptionist/medicinemaster`

#### Method `edit($id)` — Edit Form
- **GET.** Query: `$medicine->get_by_id($id)`
- View: `receptionist/medicine/edit`

#### Method `edit_validate($id)` — Update Medicine
- **POST.** Same as add but calls `$medicine->update($id, $data)`

#### Method `hide_unhide($id)` — Toggle Status
- **GET.** Toggles ACTIVE ↔ BLOCK
- Redirect: `receptionist/medicinemaster`

#### Method `distroy($id)` — Delete
- **EMPTY** — no implementation (dead code)

#### View: `receptionist/medicine/index.php`
- DataTable with columns: #No, Medicine Name, Time (morning-afternoon-evening), Doz (JSON decoded, comma-separated), Tab, Description, Status (Active/Block labels), Action (Edit + Toggle)
- Empty state: exclamation icon with "No data yet"

#### View: `receptionist/medicine/add.php`
- Fields: Medicine Name, Morning, Afternoon, Evening, Doz (select2 tags, multiple), Tab (number), Description
- Submit button with disable-on-click
- **BUG:** Contains leftover JS from book.php (datepicker, booking_date, date_of_birth) — broken references to undefined `$getHolidays`, `$doctor`

#### View: `receptionist/medicine/edit.php`
- Same fields as add, pre-populated from `$medicine`
- Doz: JSON decoded, each value as selected option
- **BUG:** Same leftover JS from book.php as add.php

#### Connections
- Stores in `doctor_medicine_list` table scoped to `doctor_id`
- Used by Assistant's medicine autocomplete

---

### 5.6 Profile
#### Controller: `receptionist/Profile.php`
- **Class:** `Profile extends Reception_contoller`
- **Constructor loads:** Users_model, Receptionist_model

#### Method `index()` — View Profile
- **GET.** Merges user data + receptionist data (removes password)
- View: `receptionist/profile`

#### Method `update()` — Update Profile
- **POST.** Validation: `receptionist_profile`
- Updates: receptionist.address; user.name, user.gender
- Redirect: `receptionist/profile`

#### Method `change_pass()` — Change Password
- **POST.** Validation: `change_password` + custom `valid_current_password`
- Hashes with SHA-256
- Redirect: `receptionist/profile`

#### Method `update_profile_photo()` — Upload Photo
- **POST (multipart).** Uploads to `upload/profile/`, deletes old (if not default.png)
- Redirect: `receptionist/profile`

#### View: `receptionist/profile.php`
- Left panel: Profile photo with upload form
- Right panel (tabbed):
  - **Info tab:** Name (editable), Email (disabled), Gender (select), Mobile (disabled), Address (textarea), Submit
  - **Change Password tab:** Current Password, New Password, Confirm Password, Submit

#### Connections
- Updates `users` and `receptionist` tables

---

### 5.7 Notifications
#### Controller: `receptionist/Notifications.php`
- **Method `index()`:** GET
  - Query: `$notification->get_all_by_user(user_id, 100)` — last 100
  - Marks all as READ: `$notification->update(user_id, ["status" => READ])`
  - View: `receptionist/notifications`

#### View: `receptionist/notifications.php`
- Table with bell icon, title (bold), body, timestamp (right-aligned)
- Unread rows highlighted with `warning` class
- Empty state: bell icon + "You have no notifications"

---

### 5.8 Blog/Post Management
#### Controller: `receptionist/Post.php`
- **Class:** `Post extends Reception_contoller`
- **Constructor loads:** posts_model

#### Methods:
- `index()` — List posts (GET)
- `create()` — New post form (GET)
- `store()` — Save post (POST, validation: `blog`)
- `edit($id)` — Edit form (GET, ownership check)
- `update($id)` — Update post (POST, validation: `blog`)
- `delete($id)` — Delete post (GET, deletes image file, ownership check)
- `hide_unhide($id)` — Toggle PUBLISHED ↔ HIDE
- `generateUrl($str)` — Recursive SEO URL generator (checks `posts` table for uniqueness)

#### Post data: title, content, video_link (optional), blog_img (optional upload to `upload/blog/`), status=PUBLISHED, type=BLOG, paramalink, user_id

#### Views:
- **index:** DataTable with #No, Title (links to `blog/view/{paramalink}`), DateTime, Status (Published/Hide/Block labels), Actions (Edit, Hide/Show, Delete)
- **add:** Title, Content (wysihtml5 textarea), Video Link (optional), Image (optional), Publish button
- **edit:** Same as add, pre-populated, shows current image thumbnail

#### Connections
- Stores in `posts` table
- Blog images in `upload/blog/`

---

### 5.9 Layout: `master_page_receptionist.php`
- **CSS:** AdminLTE 2.4.0, Bootstrap, Font-Awesome, Ionicons, Morris.js, jVectormap, bootstrap-datepicker, daterangepicker, wysihtml5, DataTables, PNotify, Ekko-lightbox, Select2, Google Fonts (Lato, Source Sans Pro)
- **JS:** jQuery, jQuery-UI, Bootstrap, Raphael, Morris.js, Sparkline, jVectormap, jQuery-knob, Moment.js, daterangepicker, datepicker, wysihtml5, FastClick, AdminLTE, DataTables, PNotify, image-preview, ekko-lightbox, SweetAlert, Google Analytics (UA-171698773-1)
- **Top navbar:** Logo (DR), notification bell with count + dropdown, user profile dropdown (photo, name, role, Profile Settings, Sign out)
- **Sidebar:** Dashboard, Blog, Appointments, Manage Schedule, Medicine List
- **Global JS:** Double-submit prevention, tooltip init, Select2 tag init, DataTable init, `conformDel()`, `conformFormDel()`, `conformCancel()` (SweetAlert confirmations), PNotify flash messages
- **Print CSS:** Hides `.d-n` elements, links, icons
- **Custom CSS:** Chat styling, datepicker disabled-date styling, scrollbar customization

---

# Phase 6: Assistant Dashboard
## Overview
The Assistant module is also tied to a **specific doctor** via the `doctor_assistants` table (`user_id` → `doctor_id`). The base controller is `Assistant_controller`. Layout: `master_page_assistant.php`. AdminLTE 2.4.0 skin-black-light theme.

**Sidebar Navigation:**
1. Dashboard
2. Blog
3. Appointments

**Key difference from Receptionist:** The Assistant has **prescription creation capabilities** — both a simple prescription system and a complex **Ajax Prescription** wizard (6-step) with CO categories, labels, diagnostic tables, medicine lists, and AI-powered suggestion system.

---

### 6.1 Dashboard (Main Overview)
#### Controller: `assistant/Dashboard.php`
- **Class:** `Dashboard extends Assistant_controller`
- **Constructor loads:** Doctor_assistants_model, Booking_model, posts_model, Doctor_rating_model, Doctors_model, Hospital_model
- Sets `$user_data->doctor_id` from `assistants->get_by_user_id(user_id)->doctor_id`

#### Method `index()`: GET
- Queries:
  - `$doctor->get_active_user(doctor_id)` → hospital via `$hospital->get_one_by_user()`
  - `today_approved_appointment` (count of APPROVE)
  - `my_blog` (count)
  - `today_visited_appointment` (count)
  - `$book->get_doctor_appointments_latest(doctor_id, APPROVE)` — latest 5 APPROVED
  - `$book->get_doctor_appointments_today(user_id)` — **BUG: passes `user_id` instead of `doctor_id`**

#### View: `assistant/dashboard.php`
- Same structure as receptionist dashboard
- **3 info boxes:** Today Approved (blue), Today Visited (green), My Blogs (red)
- **2 profile cards:** My Hospital (conditional), My Doctor (always)
- **2 tables:** Latest 5 approved appointments, Today Appointments
- **BUG on line 203:** Today appointments table links to `receptionist/appointment/show/` instead of `assistant/appointment/show/`
- **BUG on line 6:** Subtitle says "Receptionist" instead of "Assistant"

#### Connections
- Same model dependencies as receptionist dashboard

---

### 6.2 Appointment Management
#### Controller: `assistant/Appointment.php`
- **Class:** `Appointment extends Assistant_controller`
- **Constructor loads:** Booking_model, Doctor_assistants_model, Prescriptions_model, Notifications_model, Doctor_medicine_list_model

#### Method `index()` — List Appointments
- **GET.** Default status: `APPROVE` (not PENDING like receptionist)
- Status options in view: APPROVE, VISITED, REJECTED

#### Method `show($id)` — View Appointment + Prescription
- **GET.** Also loads prescription: `$prescription->get_by_booking_id($id, doctor_id)`

#### Method `create_prescription($booking_id)` — Create Prescription Form
- **GET.** Guards: redirects if prescription already exists
- View: `receptionist/appointment/create_prescription`

#### Method `store_prescription($booking_id)` — Save Prescription
- **POST.** Required field: `disease_description`
- Sets: `user_id=doctor_id`, `booking_id`, `created_by=assistant_user_id`
- Sends notification to doctor
- Redirect: `assistant/appointment/show/{appointment_id}`

#### Method `edit_prescription($booking_id)` — Edit Prescription
- **GET.** Guards: redirects if no prescription

#### Method `update_prescription($booking_id)` — Update Prescription
- **POST.** Same as store but updates existing

#### Method `create_medicine($booking_id)` — Add Medicine to Prescription
- **GET.** Guards: redirects if no prescription

#### Method `store_medicine($booking_id)` — Save Medicine
- **POST.** Params: `details[]` (array of [medicine_name, tab, description]), `remark`
- Stores `medicine_details` as JSON, plus `remark`

#### Method `edit_medicine($booking_id)` — Edit Medicine
- **GET.** Decodes `medicine_details` JSON for editing

#### Method `update_medicine($booking_id)` — Update Medicine
- **POST.** Re-encodes `details[]` as JSON

#### Method `get_branch()` — Medicine Autocomplete
- **GET.** Params: `?q=` (search query)
- Returns JSON from `Doctor_medicine_list_model->get_by_doctor_id()`

#### Method `get_appointment_table()` — AJAX Table Refresh
- **GET.** Returns partial HTML table

#### View: `assistant/appointment/index.php`
- Status filter: APPROVE, VISITED, REJECTED (no PENDING, no EXTEND)
- No Action column (read-only for assistant)
- Auto-refresh every 10 seconds via `setInterval`
- **Dead JS functions:** `visited()`, `approve()`, `extend()` are defined but not used (no action buttons)

#### View: `assistant/appointment/show.php`
- Appointment details table (same as receptionist)
- **Prescription section** (if exists):
  - Disease description with edit link (if APPROVE)
  - Medicine list (if `medicine_details` JSON exists) with edit link
  - Remark field
- **Action buttons:**
  - Create Description (if no prescription and APPROVE)
  - Create Ajax Prescription (if APPROVE) → `assistant/AjaxPrescription/create?booking_id=X&user_id=Y`
  - Update Ajax Prescription (if VISITED)
  - Print (if VISITED) → `assistant/AjaxPrescription/print_prescription?...`
  - Add Medicine List (if no medicine_details and APPROVE)

#### View: `assistant/appointment/create_prescription.php`
- Left panel: Appointment details summary
- Right panel: Wysihtml5 textarea for `disease_description`
- Submit button

#### View: `assistant/appointment/edit_prescription.php`
- Same layout as create, pre-populated with `$prescription->disease_description`

#### View: `assistant/appointment/create_medicine.php`
- Left panel: Appointment details
- Right panel:
  - Dynamic medicine table with autocomplete (bootstrap-autocomplete CDN)
  - Columns: Medicine Name (autocomplete), Tab (text), Description (text), Action (delete)
  - Add More button (dynamically adds rows)
  - Remark textarea
  - Submit button
- **External JS:** `bootstrap-autocomplete.min.js` from jsDelivr

#### View: `assistant/appointment/edit_medicine.php`
- Same as create_medicine, pre-populated from decoded JSON
- Each row has delete button

#### Connections
- **Prescriptions_model** (table: `prescriptions`): Simple prescription system with disease_description + JSON medicine_details
- **Doctor_medicine_list_model**: Autocomplete source for medicine names
- Links to AjaxPrescription system (complex prescription wizard)

---

### 6.3 Ajax Prescription (Complex Prescription Wizard)
#### Controller: `assistant/AjaxPrescription.php`
- **Class:** `AjaxPrescription extends Assistant_controller`
- **Massive constructor** loads 15+ models: Ajaxprescription_model, Co_model, P_Co_model, Booking_model, Questions_model, Label_model, P_Label_model, Table_master_model, P_digno_model, P_medicine_model, P_Suggestion_model, Doctor_medicine_list_model, Doctors_model, P_other_setting_model, Users_model, Doctor_assistants_model

#### Method `create()` — Load Wizard
- **GET.** Params: `?booking_id=X&user_id=Y`
- Logic:
  1. Verifies booking belongs to doctor + user
  2. Checks/creates prescription record in `prescription` table
  3. If new prescription: creates record with status=PENDING, also creates diagnostic table from `Table_master_model` if configured
  4. Loads all wizard data: medicine list (JSON), CO categories with questions, labels, old prescription data (COs, labels, medicines)
- **Tables involved:** `prescription`, `p_digno` (diagnostic table), `p_co`, `p_label`, `p_medicine`, `co_master`, `questions`, `label_master`, `table_master`

#### Method `ajax_insert_co()` — Save CO Categories
- **POST (AJAX).** Params: `cos[]`, `p_id`, `pre_id`
- Deletes old COs, inserts new (co, question, question_code)
- Returns JSON: `['success', message]` or `['error', message]`

#### Method `ajax_insert_labels()` — Save Labels
- **POST (AJAX).** Params: `labels[]`, `pre_id`
- Deletes old labels, inserts new (label, l_value, label_unit)
- Skips empty values

#### Method `ajax_insert_medi_list()` — Save Medicines
- **POST (AJAX).** Params: `lists[]`, `pre_id`
- Each: medicine, morning, after_noon, evning, tab, doz, description
- Skips empty medicine names

#### Method `ajax_insert_suggestion()` — Save Suggestions & Finish
- **POST (AJAX).** Params: `sug[]`, `pre_id`, `next_date`
- **Critical:** Also updates prescription `status=VISITED` and booking `status=VISITED`
- Sets `next_visit` date on prescription

#### Method `get_saggestion()` — Load Suggestion View
- **GET.** Params: `?id=prescription_id`
- For each CO's question, loads associated suggestions from `Questions_model`
- Returns: `assistant/AjaxPrescription/get_saggestion_ajax_view`

#### Method `print_prescription()` — Print Prescription
- **GET.** Params: `?booking_id=X&doctor_id=Y&user_id=Z`
- Loads: doctor profile, booking, patient user, diagnostic table, prescription, COs (grouped), labels, medicines, suggestions (grouped by question), settings
- View: `assistant/AjaxPrescription/print_prescription` (styled print layout)
- **NOTE:** Also accessed by pharmacist via `doctor/AjaxPrescription/print_prescription` view

#### View: `assistant/AjaxPrescription/index.php` (~84KB, very large)
- **6-step wizard UI** with circular tab navigation:
  1. **Step 1 (Stethoscope):** Cos-Category Details — checkboxes organized by CO code, each with question text
  2. **Step 2 (File):** Labels Details — dynamic input fields for each configured label (title, unit)
  3. **Step 3 (Table):** Diagnostic Table — dynamically generated table from Table_master config (rows, cols, header/row/footer labels)
  4. **Complete (List):** Medicine Details — dynamic table with autocomplete medicine name, doz select, morning/afternoon/evening inputs, tab, description. Has voice recognition icon/button.
  5. **Complete2:** Suggestions — loaded via AJAX (`get_saggestion`), checkboxes for each suggestion, note textarea with speech-to-text, next visit date picker
  6. **Complete3 (Check):** Final step — saves suggestions, marks as VISITED
- **AJAX endpoints:** `ajax_insert_co`, `ajax_insert_labels`, `ajax_insert_medi_list`, `ajax_insert_suggestion`, `get_saggestion`, `get_branch` (medicine autocomplete)
- **Custom CSS:** ~300 lines of wizard styling (rounded tabs, connecting line, accordion menus)
- **Medicine autocomplete** uses doctor's medicine list
- **Voice-to-text** integration via `speechToText/script.js`

#### View: `assistant/AjaxPrescription/print_prescription.php`
- **Print-optimized layout** (850px wide table)
- **Header:** Doctor's logo or clinic name, doctor name + type, address, phone
- **Patient info row:** Name, Gender, Age, Appointment No.
- **Left column:** CO categories (question codes), labels (with units), diagnostic table
- **Right column:** Rx header, Date/Time, Medicine list (name, doz, morning-afternoon-evening, tab, description), Suggestions (grouped by question), Note (from "extra" question), Next Visit Date + Day
- **Footer:** Doctorooms ID (= patient mobile)
- **Color scheme:** #993300 (brown/maroon) throughout
- **Settings-driven:** logo, header text, time display from `p_other_setting` table

#### View: `assistant/AjaxPrescription/get_saggestion_ajax_view.php`
- Loaded via AJAX into wizard step 5
- For each question: box with checkboxes for each suggestion
- Extra note textarea
- Next visit date input
- **Speech-to-text buttons:** Start/Pause Recognition
- External script: `assets/lte/bower_components/speechToText/script.js`

#### Model: `Ajaxprescription_model.php`
- **Table:** `prescription`
- `check_doctor_booking(doctor_id, booking_id, user_id)` → verifies booking ownership
- `check_user_prescription(doctor_id, booking_id, user_id)` → finds prescription
- `create_prescription(data)` → insert into `prescription`, return row
- `update_prescription(id, data)` → update prescription
- `get_prescription_by_id(id)` → get single prescription

#### Model: `Prescriptions_model.php`
- **Table:** `prescriptions` (simple prescription — DIFFERENT from `prescription` table used by Ajax)
- `create(data)` → insert, return ID
- `update(id, data)` → update
- `get_by_booking_id(booking_id, doctor_id)` → single row
- `get_doctor(doctor_id)` → joins `doctors` + `doctor_pharmacist` (used by pharmacist)
- `get_prescription_for_pharmacist(doctor_id)` → joins `prescription` + `users` + `booking`, WHERE status=VISITED, GROUP BY patient_id, ORDER BY id DESC

#### Connections
- **Two prescription systems:** Simple (`prescriptions` table via Prescriptions_model) and Complex (`prescription` table via Ajaxprescription_model + 7+ related tables)
- Updates booking status to VISITED when suggestions are saved
- Prints use doctor's `p_other_setting` for branding
- Voice-to-text for suggestions

---

### 6.4 Profile
#### Controller: `assistant/Profile.php`
- Identical structure to Receptionist Profile
- Uses `Doctor_assistants_model` instead of `Receptionist_model`
- Validation rule: `assistant_profile`
- Same methods: `index()`, `update()`, `change_pass()`, `update_profile_photo()`, `valid_current_password()`

#### View: `assistant/profile.php`
- Identical to receptionist profile view, different form action URLs

---

### 6.5 Notifications
#### Controller: `assistant/Notifications.php`
- Identical to Receptionist Notifications
- View: `assistant/notifications.php` (identical HTML)

---

### 6.6 Blog/Post Management
#### Controller: `assistant/Post.php`
- Identical to Receptionist Post controller
- Same CRUD operations, SEO URL generation, image upload/delete
- Views: `assistant/post/index.php`, `add.php`, `edit.php` (identical HTML to receptionist versions)

---

### 6.7 Layout: `master_page_assistant.php`
- Same AdminLTE base as receptionist
- **Logo:** "CH" (Clinic Helper?)
- **Sidebar:** Dashboard, Blog, Appointments (no Schedule or Medicine — those are receptionist-only)
- **Additional CSS:** Bootstrap-autocomplete dropdown styling
- No Select2 tag init in global JS (unlike receptionist)
- Same SweetAlert, PNotify, DataTable init
- Same Google Analytics

---

# Phase 7: Pharmacist Dashboard
## Overview
The Pharmacist module is the **smallest** of the three. Tied to a doctor via `doctor_pharmacist` table. Base controller: `Pharmacist_contoller`. Layout: `master_page_pharmacist.php`. AdminLTE 2.4.0 skin-black-light theme.

**Sidebar Navigation:**
1. Dashboard
2. Prescriptions

**Primary purpose:** View prescriptions and print them. No create/edit capabilities — the pharmacist is **read-only** for prescriptions.

---

### 7.1 Dashboard (Main Overview)
#### Controller: `pharmacist/Pharmacist.php`
- **Class:** `Pharmacist extends Pharmacist_contoller`
- **Constructor loads 15+ models:** Users_model, Doctor_pharmacist_model, Booking_model, Doctor_rating_model, Doctors_model, Hospital_model, Prescriptions_model, Ajaxprescription_model, Co_model, P_Co_model, Questions_model, Label_model, P_Label_model, Table_master_model, P_digno_model, P_medicine_model, P_Suggestion_model, Doctor_medicine_list_model, P_other_setting_model
- Sets `$user_data->doctor_id` from `pharmacist->get_by_user_id(user_id)->doctor_id`
- Also sets `$view_data['a']` = current user (appears unused in views)

#### Method `index()` — Empty Dashboard
- **GET.** Simply loads `pharmacist/dashboard` view (no data!) — appears to be a leftover/dead route

#### Method `dashboard()` — Actual Dashboard
- **GET.** Queries:
  - `today_approved_appointment` (count of APPROVE)
  - `today_visited_appointment` (count of VISITED)
  - `$book->get_doctor_appointments_latest(doctor_id, APPROVE)` — latest approved
  - `$book->get_doctor_appointments_today(user_id)` — **BUG: same as assistant, passes user_id instead of doctor_id**

#### View: `pharmacist/dashboard.php`
- **3 columns:**
  - Today Approved Appointment info box (blue) → links to `assistant/appointment` (**BUG: wrong URL**)
  - My Doctor profile card
  - My Hospital profile card (conditional)
- **Full-width table:** "Todays Prescription list" — shows latest approved appointments (NOT actual prescriptions)
  - Columns: #, Appointment ID, Date, Booked By, Patient Name, Disease, Status
  - **BUG:** Links point to `assistant/appointment/show/` instead of pharmacist route
  - No DataTable initialization on this table

---

### 7.2 Prescription List
#### Controller: `pharmacist/Pharmacist.php`

#### Method `listPrescriptions()` — List All Prescriptions
- **GET.** Logic:
  1. `$prescription->get_doctor(doctor_id)` — gets doctor's user_id from `doctors` + `doctor_pharmacist` join
  2. `$prescription->get_prescription_for_pharmacist(doctor_user_id)` — gets all VISITED prescriptions
- View: `pharmacist/prescription`

#### Model Query: `Prescriptions_model::get_prescription_for_pharmacist()`
- **Tables:** `prescription`, `users`, `booking`
- **SQL (CI Active Record):**
  ```sql
  SELECT prescription.*, users.name as patient, booking.appointment_no
  FROM prescription, users, booking
  WHERE prescription.status = 'Visited'
    AND prescription.patient_id = users.id
    AND prescription.doc_id = {doctor_id}
    AND prescription.booking_id = booking.id
  GROUP BY prescription.patient_id
  ORDER BY prescription.id DESC
  ```

#### View: `pharmacist/prescription.php`
- Table (striped, responsive): Appointment ID, Patient Name, Next Visit Date, Print button
- Print button links to: `pharmacist/pharmacist/print_prescription?booking_id=X&doctor_id=Y&user_id=Z` (opens in new tab)
- Empty state: exclamation icon + "No Prescriptions yet"
- **No DataTable** on this view
- **BUG:** HTML typo `tootltip` attribute (misspelled)

---

### 7.3 Print Prescription
#### Controller: `pharmacist/Pharmacist.php`

#### Method `print_prescription()` — Print View
- **GET.** Params: `?booking_id=X&doctor_id=Y&user_id=Z`
- Logic: Same data loading as assistant's `print_prescription()` but **loads `doctor/AjaxPrescription/print_prescription` view** (shared with doctor module)
- Loads: doctor profile, booking, diagnostic table, prescription, COs, labels, medicines, suggestions, settings
- **Difference from assistant print:** Uses `doctor` layout's print_prescription view, does NOT load patient user

#### View: `doctor/AjaxPrescription/print_prescription` (shared with doctor module)
- Same 850px print layout as described in Phase 6.3

---

### 7.4 Profile
#### Controller: `pharmacist/Profile.php`
- **Class:** `Profile extends Pharmacist_contoller`
- Uses `Doctor_pharmacist_model` instead of Receptionist/Assistant models
- Validation rule: `pharmacist_profile`
- Same methods: `index()`, `update()`, `change_pass()`, `update_profile_photo()`, `valid_current_password()`
- Identical structure to receptionist/assistant profile controllers

#### View: `pharmacist/profile.php`
- Identical to receptionist/assistant profile views

---

### 7.5 Layout: `master_page_pharmacist.php`
- Same AdminLTE base
- **Logo:** "DR" (Doctor Rooms)
- **Sidebar:** Dashboard, Prescriptions (minimal navigation)
- **Notification links** point to `pharmacist/notifications` — **BUG: no Notifications controller exists for pharmacist**
- Same SweetAlert, PNotify, DataTable init
- Same Google Analytics (UA-171698773-1)
- No Select2 init, no chat CSS

---

# Shared Model Details

## Receptionist_model
- **Table:** `receptionist`
- Methods:
  - `create($data)` → INSERT, returns insert_id
  - `update($user_id, $data)` → UPDATE WHERE user_id
  - `get_by_user_id($user_id)` → SELECT * WHERE user_id (single row)
  - `get_receptionist_by_doctor($doctor_id)` → SELECT * WHERE doctor_id (single row)

## Prescriptions_model
- **Table:** `prescriptions` (simple prescription — used by assistant's basic prescription feature)
- Methods:
  - `create($data)` → INSERT, returns insert_id
  - `update($id, $data)` → UPDATE WHERE id
  - `get_by_booking_id($booking_id, $doctor_id)` → SELECT WHERE booking_id AND user_id
  - `get_doctor($doctor_id)` → SELECT from `doctors,doctor_pharmacist` WHERE user_id (for pharmacist linkage)
  - `get_prescription_for_pharmacist($doctor_id)` → Complex 3-table join (prescription+users+booking), WHERE VISITED, GROUP BY patient_id

## Ajaxprescription_model
- **Table:** `prescription` (complex prescription — different from `prescriptions`!)
- Methods:
  - `check_doctor_booking($doctor_id, $booking_id, $user_id)` → SELECT from `booking` (3 WHERE clauses)
  - `check_user_prescription($doctor_id, $booking_id, $user_id)` → SELECT from `prescription` (3 WHERE clauses)
  - `create_prescription($data)` → INSERT into `prescription`, returns new row
  - `update_prescription($id, $data)` → UPDATE prescription
  - `get_prescription_by_id($id)` → SELECT from prescription WHERE id

---

# Cross-Module Bug Summary

## Critical Bugs
| # | Module | File | Bug |
|---|--------|------|-----|
| 1 | Receptionist | Appointment.php:157 | `show()` redirects to `doctor/appointment` instead of `receptionist/appointment` |
| 2 | Receptionist | get_appointment_table.php | All links point to `doctor/appointment/show/` instead of `receptionist/` |
| 3 | Receptionist | book.php:229 | Stray text `DGKPM4300J` in JS (keyboard artifact) |
| 4 | Receptionist | medicine/add.php, edit.php | Leftover datepicker JS from book.php referencing undefined `$getHolidays`, `$doctor` |
| 5 | Receptionist | Medicinemaster.php:74-77 | `distroy()` method is empty — delete not implemented |
| 6 | Receptionist | check_emergency.php | `$is_emergency` variable never passed from controller |
| 7 | Receptionist | Registration.php:17 | `index()` loads `receptionist/appointment/book` instead of `receptionist/registration/index` |
| 8 | Assistant | Dashboard.php:26 | `get_doctor_appointments_today(user_id)` should be `doctor_id` |
| 9 | Assistant | dashboard.php:203 | Today appointments link to `receptionist/appointment/show/` instead of `assistant/` |
| 10 | Assistant | dashboard.php:6 | Subtitle says "Receptionist" instead of "Assistant" |
| 11 | Pharmacist | Pharmacist.php:34 | `index()` loads dashboard with NO data (dead route) |
| 12 | Pharmacist | dashboard.php:18 | Info box links to `assistant/appointment` (wrong module) |
| 13 | Pharmacist | dashboard.php:107 | Appointment links to `assistant/appointment/show/` (wrong module) |
| 14 | Pharmacist | Pharmacist.php:46 | `get_doctor_appointments_today(user_id)` should be `doctor_id` |
| 15 | Pharmacist | prescription.php:34 | HTML typo `tootltip` (misspelled attribute) |
| 16 | Pharmacist | master_page_pharmacist.php | Notification links to `pharmacist/notifications` — no such controller exists |
| 17 | All | Appointment controllers | `get_appointment_table()` AJAX URL is relative — may break on nested routes |
| 18 | All | Post controllers | `delete()` redirects to `doctor/post` on null check instead of own module |

## Security Concerns
| # | Issue | Location |
|---|-------|----------|
| 1 | SHA-256 without salt for passwords | All Profile controllers |
| 2 | Default password "123456" for new patient registration | Registration controller + book.php modal |
| 3 | Random mobile number generation (potential collision) | book.php, registration/index.php |
| 4 | Google Analytics tracking ID hardcoded (UA-171698773-1) | All master layouts |
| 5 | `unlink()` without existence check | Profile photo update (could throw error) |
| 6 | No CSRF token visible in forms | Various forms (may be handled by CI globally) |
| 7 | Chat messages have no sanitization shown | send_chat_msg() |

## Architecture Notes
- **Two separate prescription systems:** Simple (`prescriptions` table) and Complex (`prescription` table + 7 related tables). The Ajax Prescription wizard is the primary/active system.
- **All three roles** are scoped to a single doctor via their respective linkage tables
- **Code duplication:** Profile, Notifications, and Post controllers are near-identical across all three modules (only model names and URLs differ)
- **Inconsistent URL routing:** Some controllers use `$this->input->get('status')` while AJAX endpoints use relative URLs that may not resolve correctly
- **Hardcoded Google Analytics** appears in all three master layouts
