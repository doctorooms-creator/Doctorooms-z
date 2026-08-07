# Phase 3: Doctor Dashboard Module - Complete Research

## Overview
The Doctor Dashboard is the largest module in Doctorooms. It provides doctors with full control over appointments, prescriptions (two systems: legacy and ajax-based), scheduling, profile management, staff management (assistant, receptionist, pharmacist), prescription settings (C/O categories, complaints/questions, suggestions, labels, diagnostic tables, other settings), reporting, gallery, blog posts, and notifications. All controllers extend `Doctor_controller` which enforces authentication.

## Database Tables Used
| Table | Purpose |
|---|---|
| `doctors` | Doctor profiles (user_id, fees, emergency_charge, doctor_type, specialization, address, state, city, lat, longi, hospital_id, photos, booking_days, daily_limit, is_emergency) |
| `users` | User accounts (name, email, mobile_no, password, role, profile_img, status, gender) |
| `booking` | Appointments (appointment_no, user_id, doctor_id, booking_date, petient_name, disease, status, description, booking_type, appointment_charge, physical_handicape, date_of_birth, age, gender, height, weight, relation_with_me) |
| `prescriptions` | Legacy prescriptions (disease_description, medicine_details JSON, remark, booking_id, user_id) |
| `prescription` | Ajax prescriptions (doc_id, patient_id, booking_id, status, next_visit) |
| `p_cos` | Prescription C/O selections (p_id, co, question, question_code) |
| `p_labels` | Prescription label values (p_id, label, l_value, label_unit) |
| `p_medicine` | Prescription medicines (p_id, medicine, morning, after_noon, evning, tab, doz, description) |
| `p_suggestions` | Prescription suggestions (p_id, question, suggestions) |
| `p_digno_table` | Prescription diagnostic tables (p_id, rows, cols, header_label, cols_label, footer_label, extra_label) |
| `p_other_settings` | Prescription print settings (logo, full_header, time, header, is_full_header) |
| `co_master` | C/O categories (co_code, co_detail, doctor_id, status) |
| `questions_master` | Complaints/questions (question, explenations, co_id, question_code, doctor_id) |
| `suggestions_master` | Suggestion templates (suggestions, question_id, doctor_id) |
| `label_master` | Label templates (label_title, label_unit, input_type, doctor_id) |
| `table_master` | Diagnostic table templates (row, table_column, lable_header/footer/row JSON, extra_label, doctor_id) |
| `doctor_holiday_schedule` | Holiday dates (date, remark, user_id) |
| `doctor_assistants` | Assistant staff (user_id, doctor_id, address, description) |
| `doctor_pharmacist` | Pharmacist staff (user_id, doctor_id, address, description, dlno) |
| `receptionists` | Receptionist staff (user_id, doctor_id, address) |
| `doctor_medicine_list` | Doctor's medicine list (name, morning, afternoon, evening, tab, doz, description, user_id, status) |
| `notifications` | User notifications (title, body, user_id, status, created_at) |
| `posts` | Blog posts (title, content, type, blog_img, paramalink, status, user_id, video_link) |
| `booking_chat` | Chat messages for appointments |

---

## Layout: master_page_doctors
**File:** `views/layouts/master_page_doctors.php`

### Navbar
- **Logo/Brand:** Site title
- **Notification Bell:** Dropdown showing notification count badge + latest 5 notifications with links to `doctor/notifications`
- **User Menu Dropdown:** Profile image, name, role label, "Profile Settings" link → `doctor/profile`, "Sign out" → `auth/logout`

### Sidebar Menu
1. **Dashboard** (`doctor/dashboard`) - `fa-dashboard`
2. **Appointments** (`doctor/appointment`) - `fa-check-circle`
3. **Appointment History** (`doctor/appointment/history`) - `fa-file-text`
4. **My Profile** (`doctor/profile`) - `fa-user-md`
5. **Manage Schedule** (`doctor/schedule`) - `fa-clock-o`
6. **Gallery** (`doctor/gallery`) - `fa-photo`
7. **Blog** (`doctor/post`) - `fa-rss`
8. **Receptionist** (`doctor/receptionist`) - `fa-user-o`
9. **Assistant** (`doctor/assistant`) - `fa-user-o`
10. **Pharmacist** (`doctor/pharmacist/`) - `fa-user-o`
11. **Reports** (`doctor/report`) - `fa-file`
12. **Prescription Settings** (treeview, auto-open for co/questions/suggestions/label/table_master/p_other_setting):
    - C/O - Category (`doctor/co`) - `fa-plus-square`
    - Complains (`doctor/questions`) - `fa-question-circle`
    - Suggestions (`doctor/suggestions`) - `fa-check-circle`
    - Labels (`doctor/label`) - `fa-tag`
    - Table (`doctor/table_master`) - `fa-table`
    - Other Settings (`doctor/p_other_setting`) - `fa-cog`

### CSS/JS Libraries Loaded
- AdminLTE 2.4.0, Bootstrap 3, jQuery, jQuery UI, Font Awesome, Ionicons
- DataTables (dataTables.net-bs + buttons: copy, excel, csv, pdf)
- PNotify (flash messages), SweetAlert (delete confirmations)
- Bootstrap WysiHTML5 (rich text editor)
- Ekko-Lightbox (gallery), Select2
- Google Analytics (UA-171698773-1)
- Print CSS: hides `.d-n` elements, links, and icon spans

### Global JS
- `$('.dttable').DataTable()` - Auto-init for tables with class `dttable`
- `$('#example').DataTable({dom:'Bfrtip', buttons:['copyHtml5','excelHtml5','csvHtml5','pdfHtml5']})`
- `conformDel()`, `conformFormDel()`, `conformCancel()` - SweetAlert confirmation dialogs
- Double-submit prevention on all forms
- Auto-init tooltips and Select2

---

## 3.1 Dashboard
#### Controller: `controllers/doctor/Dashboard.php`
**Class:** `Dashboard extends Doctor_controller`

**Models Loaded:** `Booking_model` (book), `posts_model` (post), `Doctor_rating_model` (doctor_rating), `Doctors_model` (doctor), `Hospital_model` (hospital)

**Constructor:** Creates a doctor record if none exists for the logged-in user (with `booking_days=BEFORE_BOOKING_DAYS`, `is_emergency=0`).

| Method | Type | Params | Queries | Data to View | Redirect/Response |
|---|---|---|---|---|---|
| `index()` | GET | - | `doctor->get_active_user()`, `hospital->get_one_by_user()`, `book->get_today_doctor_appointment(id, PENDING)`, `post->get_all_by_user()`, `doctor_rating->get_average_rating()`, `book->get_today_doctor_appointment(id, VISITED)`, `book->get_doctor_appointments_ajax(id, 10, 0)` | `is_emergency`, `hospital`, `today_pending_appointment`, `my_blog`, `myprofile_rating`, `today_visited_appointment`, `appointments`, `today_appointments` | View: `doctor/dashboard` |
| `change_emergency()` | POST | `is_emergency` (0/1) | `doctor->get_one_by_user()`, `book->get_doctor_appointments_today(id, APPROVE)`, `doctor->update()` | - | JSON: `['success','Emergency Status Successfully updated']` or `['error','Something want wrong']`. Sends SMS to all today's approved appointments if emergency=1 |
| `loadmore()` | GET | `limit`, `offset` | `book->get_doctor_appointments_ajax(id, limit, offset)` | JSON: `{view: HTML, offset: offset+10, limit: limit}` | - | Returns partial HTML table rows |
| `sendMobileMessage()` | Internal | `mobile`, `message` | - | - | - | Sends SMS via curl to `sms.soft-techsolutions.com` (hardcoded API key). Used by `change_emergency()` |

#### View: `views/doctor/dashboard.php`

**Structure:** `div.content-wrapper` containing:

**Info Boxes (4 columns):**
1. Today Pending Appointment (yellow, `fa-check-circle-o`) → link to `doctor/appointment`
2. Today Visited Appointment (green, `fa-check-circle`) → link to `doctor/appointment?status=Visited`
3. Profile Rating (aqua, `fa-user-md`) → link to `doctor/profile`, shows `X/5` with star icon
4. My Blogs (red, `fa-rss`) → link to `doctor/post`

**Emergency Toggle:** Custom CSS toggle switch (100x50px, red/blue colors, animated with X→V transition). Checkbox `#check_emergency`. AJAX POST to `dashboard/change_emergency`. PNotify notification on response.

**Latest Booked Appointment Table:**
- Class `table table-bordered table-responsive dttable` with id `#ajaxTable`
- Columns: #, Appointment ID (link to show), Appointment Date, Who has booked (name/email/mobile or "By Receptionist"), Patient Name, Disease, Status (colored label)
- Status colors: Pending=warning, Approve=primary, Extend=info, Visited=success, Rejected=danger
- Dropdown filter `#st` for status (Pending/Extend/Approve/Visited/Rejected/All Appointment)
- "Load more" button → AJAX GET `doctor/dashboard/loadmore` appends rows
- Hidden inputs: `#limit=10`, `#offset=10`
- Client-side filter via `#st` change event (text match on rows)

**Today Appointments Table:** (hidden with class `hidden`)
- Same columns as above, no actions

**Search Appointment History:** Form GET to `doctor/appointment/history`
- Input: `aptid` (text) OR `mobile` (number) + search button

**JS:** Emergency toggle AJAX, loadmore AJAX, client-side status filter

#### View: `views/doctor/get_appointment_ajax_table.php`
Partial view (table rows only) returned by `loadmore()`. Same columns as dashboard table. Uses `$offset` for row numbering.

#### Connections: `doctors`, `booking`, `users`, `posts`, `doctor_ratings`, `hospitals`, `notifications` (SMS)

---

## 3.2 Appointments
#### Controller: `controllers/doctor/Appointment.php`
**Class:** `Appointment extends Doctor_controller`

**Models Loaded:** `Booking_model` (book), `Notifications_model` (notification), `Prescriptions_model` (prescription), `Receptionist_model` (receptionist), `Doctor_medicine_list_model` (medicine), `P_medicine_model` (p_medicine)

| Method | Type | Params | Queries | Data to View | Redirect | Flash Message |
|---|---|---|---|---|---|---|
| `index()` | GET | `?status=` (default: PENDING) | `book->get_doctor_appointment(id, status, 'asc')` | `appointments` | View: `doctor/appointment/index` | - |
| `get_appointment_table()` | GET | `?status=` (default: APPROVE) | `book->get_doctor_appointment(id, status, 'DESC')` | `appointments` | View: partial (table only) | - |
| `show($id)` | GET | `$id` | `book->get_doctor_appointment_one(id, doctor_id)`, `prescription->get_by_booking_id(id, doctor_id)` | `appointment`, `prescription` | Redirect: `doctor/appointment` if null | - |
| `get_branch()` | GET | `?q=` | `medicine->get_by_doctor_id(doctor_id, q)` | JSON array `[{value, text, morning, afternoon, evening, tab, doz, description}]` | - | - | - |
| `get_medi_list()` | GET | - | `medicine->get_all_list_by_doctor_id(doctor_id)` | JSON array of medicine name strings | - | - | - |
| `extend($id)` | GET | `$id` | `book->get_doctor_appointment_one()`, `notification->create()`, `receptionist->get_receptionist_by_doctor()`, `book->update(id, ['status'=>EXTEND])` | - | `doctor/appointment?status=Extend` | success/error |
| `approve($id)` | GET | `$id` | Same pattern, status→APPROVE, notifications to user + receptionist | - | `doctor/appointment?status=Approve` | success/error |
| `visited($id)` | GET | `$id` | Same pattern, status→VISITED | - | `doctor/appointment?status=Visited` | success/error |
| `cancel($id)` | GET | `$id` | Same pattern, status→REJECTED | - | `doctor/appointment?status=Rejected` | success/error |
| `create_prescription($booking_id)` | GET | `$booking_id` | `book->get_doctor_appointment_one()`, `prescription->get_by_booking_id()` | `appointment` | View: `doctor/appointment/create_prescription` or redirect if exists | - |
| `store_prescription($booking_id)` | POST | `$booking_id`, `disease_description` (required) | `book->get_doctor_appointment_one()`, `prescription->get_by_booking_id()`, `prescription->create()` | - | `doctor/appointment/show/$id` | success/error |
| `edit_prescription($booking_id)` | GET | `$booking_id` | Same + prescription data | `appointment`, `prescription` | View: `doctor/appointment/edit_prescription` or redirect | - |
| `update_prescription($booking_id)` | POST | `$booking_id`, `disease_description` (required) | Same + `prescription->update()` | - | `doctor/appointment/show/$id` | success/error |
| `create_medicine($booking_id)` | GET | `$booking_id` | Same + prescription check | `appointment`, `prescription` | View: `doctor/appointment/create_medicine` or redirect | - |
| `store_medicine($booking_id)` | POST | `$booking_id`, `details[]` (medicine_name, tab, description), `remark` | `prescription->update(id, [medicine_details=>JSON, remark])` | - | `doctor/appointment/show/$id` | success/error |
| `edit_medicine($booking_id)` | GET | `$booking_id` | Same + prescription.medicine_details decode | `appointment`, `medicine_details`, `prescription` | View: `doctor/appointment/edit_medicine` or redirect | - |
| `update_medicine($booking_id)` | POST | `$booking_id`, `details[]`, `remark` | Same + `prescription->update()` | - | `doctor/appointment/show/$id` | success/error |
| `history($offset=0)` | GET | `?aptid=`, `?mobile=` | `book->get_doctor_appointment_all_by_doctor_visited(id, mobile, aptid)` | `appointments`, `book`, `p_medicine` | View: `doctor/appointment/history` | - |

**Appointment Status Flow:** PENDING → EXTEND → APPROVE → VISITED (or REJECTED at any point before VISITED)

**Notification Pattern:** Every status change creates notifications for both the patient (`$appointment->user_id`) and the doctor's receptionist (`receptionist->get_receptionist_by_doctor(doctor_id)`). Body contains HTML with link to appointment.

#### View: `views/doctor/appointment/index.php`
- Status filter dropdown (Pending/Extend/Approve/Visited/Rejected/All) → AJAX reloads table every 10 seconds via `setInterval`
- DataTable with class `dttable`
- Columns: #, Appointment ID (link), Date, Booked By, Patient Name, Disease, Status (colored label), Action
- **Actions by status:**
  - Pending: Approve (primary btn, `fa-thumbs-o-up`), Extend (info btn, `fa-arrow-right`), Cancel (commented out)
  - Extend: Approve (primary btn)
  - Approve: Visited (success btn, `fa-check`)
  - Visited/Rejected: -
- JS: `changeStatus()` loads table via AJAX, `visited()`, `approve()`, `extend()` via GET

#### View: `views/doctor/appointment/show.php`
- Back button to appointments list
- **Appointment Detail Table:** 2-column table: Appointment ID, Booking From, Appointment Date, Patient Name, Disease, Physical Handicap, DOB, Age, Gender, Relation, Height (CM), Weight (KG), Book date, Status, Description
- **Prescription Section** (if exists):
  - Disease Description with edit icon (only when APPROVE)
  - Medicine List table (if exists): medicine_name, tab, description
  - Remark
- **Toolbar Buttons** (context-sensitive):
  - If VISITED: Print Prescription, Update Ajax Prescription
  - If no prescription + APPROVE: Create Prescription, Create Ajax Prescription
  - If PENDING: Approve, Extend, Cancel
  - If EXTEND: Approve, Cancel
  - If APPROVE: Visited, Cancel

#### View: `views/doctor/appointment/get_appointment_table.php`
- Same table structure as index, used for AJAX partial reload
- DataTable init: `$('.dttable').DataTable()`
- Action buttons use `onclick` JS functions instead of href links

#### View: `views/doctor/appointment/history.php`
- Search form: aptid (text) + mobile (number) + search button
- Each appointment rendered as a card with full detail table + prescription + medicine table
- Medicine table from `p_medicine->get_prescription_medicine($p_id)`: No, Medicine, Doz, Quantity, Time (morning-afternoon-evening), Description, Remark
- Print CSS hides pagination
- Empty state: exclamation icon + "No History yet"

#### View: `views/doctor/appointment/create_prescription.php`
- 2-column layout: Left = appointment detail table (read-only), Right = form
- Form POST to `doctor/appointment/store_prescription/$appointment->id`
- Fields: `disease_description` (textarea, rows=7, **required**)

#### View: `views/doctor/appointment/edit_prescription.php`
- Same layout, textarea pre-filled with `$prescription->disease_description`
- Form POST to `doctor/appointment/update_prescription/$appointment->id`

#### View: `views/doctor/appointment/create_medicine.php`
- Same 2-column layout + medicine table
- Dynamic table `#mytbl` with columns: Medicine Name (autocomplete via `basicAutoComplete` → `doctor/appointment/get_branch`), Tab, Description, Action (delete, hidden for first row)
- "Add More" button adds rows dynamically (JS template with `__name__` replacement)
- Remark textarea below table
- Form POST to `doctor/appointment/store_medicine/$appointment->id`
- Data sent: `details[]` array with medicine_name, tab, description + `remark`
- Uses bootstrap-autocomplete CDN

#### View: `views/doctor/appointment/edit_medicine.php`
- Same as create but pre-fills from `json_decode($prescription->medicine_details)`
- First row has delete button, added rows have delete too
- Data fields: `details[$i][medicine_name]`, `details[$i][tab]`, `details[$i][description]`

#### Connections: `booking`, `prescriptions`, `users`, `notifications`, `receptionists`, `doctor_medicine_list`, `p_medicine`

---

## 3.3 Ajax Prescription (Advanced Prescription System)
#### Controller: `controllers/doctor/AjaxPrescription.php`
**Class:** `AjaxPrescription extends Doctor_controller`

**Models Loaded:** `Ajaxprescription_model`, `Co_model`, `P_Co_model`, `Booking_model`, `Questions_model`, `Label_model`, `P_Label_model`, `Table_master_model`, `P_digno_model`, `P_medicine_model`, `P_Suggestion_model`, `Doctor_medicine_list_model` (medicine), `Doctors_model`, `P_other_setting_model`, `Users_model`

| Method | Type | Params | Queries | Response | Flash |
|---|---|---|---|---|---|
| `create()` | GET | `?booking_id=`, `?user_id=` | `check_doctor_booking()`, `check_user_prescription()`, `P_digno_model->check_dgno_table()`, `P_Co_model->get_prescription_co()`, `Co_model->get_all_co_master()`, `P_Label_model->get_prescription_label()`, `Label_model->get_all_label_master()`, `P_medicine_model->get_prescription_medicine()`, `Questions_model->get_co_question()` for each co | View: `doctor/AjaxPrescription/index` | - |
| `get_medi_list()` | Internal | - | `medicine->get_all_list_by_doctor_id()` | JSON string array of medicine names | - |
| `get_branch()` | Internal | - | `medicine->get_by_doctor_id(id, "")` | JSON object: `{"med_name":[morning,afternoon,evening,tab,doz,description]}` | - |
| `ajax_insert_co()` | POST | `cos[]` (arrays of [co, question, question_code]), `pre_id`, `p_id` | `P_Co_model->get_prescription_co()`, delete then `P_Co_model->insert_prescription_co()` (insert_batch) | JSON: `['success','Cos-Category Details successfully inserted']` | - |
| `ajax_insert_suggestion()` | POST | `sug[]` (arrays of [question, suggestions]), `pre_id`, `next_date` | `P_Suggestion_model->get_prescription_suggestion()`, delete then `P_Suggestion_model->insert_prescription_sugg()`, also updates prescription `next_visit` and status→VISITED, updates booking status→VISITED | JSON: `['success','suggestion successfully inserted']` | - |
| `ajax_insert_labels()` | POST | `labels[]` (arrays of [label, l_value, label_unit]), `pre_id` | `P_Label_model->get_prescription_label()`, delete then `P_Label_model->insert_prescription_label()` (insert_batch). Skips entries where l_value is empty. | JSON: `['success','labels Successfully inserted']` | - |
| `ajax_insert_medi_list()` | POST | `lists[]` (arrays of [medicine, morning, afternoon, evening, tab, doz, description]), `pre_id` | `P_medicine_model->get_prescription_medicine()`, delete then `P_medicine_model->insert_prescription_medicine()` (insert_batch). Skips entries where medicine is empty. | JSON: `['success','Medicines Successfully inserted']` or `['warning','No medicine Selected...']` | - |
| `get_saggestion()` | GET | `?id=` (prescription_id) | `P_Co_model->get_prescription_co()`, `Questions_model->get_question_suggestion()` for each co question, `P_Suggestion_model->get_prescription_suggestion()`, `Ajaxprescription_model->get_prescription_by_id()` | Partial view: `doctor/AjaxPrescription/get_saggestion_ajax_view` | - |
| `print_prescription()` | GET | `?booking_id=`, `?user_id=` | `check_doctor_booking()`, `check_user_prescription()`, `P_digno_model->check_dgno_table()`, `Doctors_model->get_profile()`, `Booking_model->get_by_id()`, `Users_model->get_by_id()`, `P_Co_model->get_prescription_co_group_by()`, `P_Label_model->get_prescription_label()`, `P_medicine_model->get_prescription_medicine()`, `P_Suggestion_model->get_prescription_suggestion_by_question()`, `P_Suggestion_model->get_question_suggestion()`, `P_other_setting_model->get_all_p_other_settings()` | View: `doctor/AjaxPrescription/print_prescription` | - |

#### View: `views/doctor/AjaxPrescription/index.php` (~1284 lines)

**Wizard Interface (4 tabs + finish):**

**Tab 1 - Category Details (C/O):**
- Hidden input `#p_id` with prescription ID
- Each CO category rendered as a box (`col-md-6`) with title (`$co['co_code']`)
- Under each CO, questions shown as checkboxes (`input[name='co_question']`) with `data-co`, `data-code`, and `data-question` attributes
- Pre-checked questions from `old_cos`

**Tab 2 - Labels:**
- Dynamic inputs `input[name='p_label']` for each label master entry
- Each with `data-label` and `data-unit` attributes
- Pre-filled from `old_labels`

**Tab 3 - Medicine List:**
- Dynamic table with autocomplete medicine search (jQuery UI autocomplete, not bootstrap-autocomplete)
- Columns per row: Medicine Name (autocomplete), Doz (select), Morning (text), Afternoon (text), Evening (text), Tab/Qty (text), Description (text), Remove button
- "Add More" button appends new rows via JS template
- Autocomplete fills morning, afternoon, evening, tab, doz (JSON-parsed select options), description from saved medicine details
- Pre-filled from `old_medicines`
- `speechToText` integration (commented out)

**Tab 4 - Suggestions / Finish:**
- "Get Suggestion" button loads suggestions via AJAX into `#loading` div
- Extra suggestion textarea for notes
- Next Visit Date input (date)
- "Save and continue" button (commented out) → calls `add_suggestion()` which saves and marks as VISITED
- Finish tab shows success.gif image with "Go Appointment" and "Print Prescription" buttons
- Print opens `print_prescription?booking_id=X&user_id=Y` in new window

**JS:**
- Wizard tab navigation (next/prev step, disabled tab prevention)
- `add_co()`: collects checked CO questions, POSTs to `ajax_insert_co`
- `add_label()`: collects all p_label inputs, POSTs to `ajax_insert_labels`
- `add_medilist()`: collects medicine rows, POSTs to `ajax_insert_medi_list`
- `get_saggestion()`: loads suggestion checkboxes via AJAX
- `add_suggestion()`: collects checked suggestions + extra note + next_date, POSTs to `ajax_insert_suggestion`
- PNotify notifications on all AJAX responses
- Medicine autocomplete: searches `medi_data` array, selects auto-fill all fields

#### View: `views/doctor/AjaxPrescription/get_saggestion_ajax_view.php`
- Loaded via AJAX into `#loading` div
- For each question: checkbox list of suggestions (pre-checked from `old_questions`)
- Extra textarea for notes (pre-filled from `ext`)
- Next Visit Date input (date, pre-filled from `next_date->next_visit`)

#### View: `views/doctor/AjaxPrescription/print_prescription.php`
- **Print-optimized layout** (850px width, inline styles)
- Two header modes based on `is_full_header`:
  - **Logo/Time/Header mode:** Logo image (or text header), doctor name, doctor_type, address, phone_no, time, patient name/gender/age, appointment number
  - **Full Header mode:** Full-width header image (250px x 880px)
- **Content:**
  - C/O section (left): question_code list from `p_cos`
  - Main section (right): Medicine list (name, doz, morning/afternoon/evening, tab, description), Suggestions (grouped by question), Note
  - Diagnostic table (from `check_table`): Dynamic rows/cols with header/row/footer labels
  - Extra label displayed below table
  - Next Visit Date and Day (positioned absolutely for print)
- Footer: Doctorooms ID (patient mobile), website URL
- Color theme: `#993300` (dark orange/brown)

#### Connections: `prescription`, `booking`, `users`, `doctors`, `p_cos`, `p_labels`, `p_medicine`, `p_suggestions`, `p_digno_table`, `co_master`, `questions_master`, `suggestions_master`, `label_master`, `table_master`, `p_other_settings`, `doctor_medicine_list`

---

## 3.4 Schedule
#### Controller: `controllers/doctor/Schedule.php`
**Class:** `Schedule extends Doctor_controller`

**Models:** `Doctor_holiday_schedule_model` (holiday_schedule), `Doctors_model` (doctor)

| Method | Type | Params | Validation | Queries | Data to View | Redirect | Flash |
|---|---|---|---|---|---|---|---|
| `index()` | GET | - | - | `holiday_schedule->get_all_by_user(id)`, `doctor->get_one_by_user(id)` | `schedule`, `doctor` | View: `doctor/schedule/index` | - |
| `update_appointment_day()` | POST | `days` (required, numeric, ≤180), `day_limit` (required, numeric) | CI validation | `doctor->get_one_by_user()`, `doctor->update(id, [booking_days, daily_limit])` | - | `doctor/schedule` | success/error |
| `create()` | GET | - | - | - | - | View: `doctor/schedule/add` (with `doctor/schedule/script` JS) | - |
| `store()` | POST | `schedule[]` (array of [date, remark]) | - | `holiday_schedule->create_many()` | - | `doctor/schedule` | success/error |
| `delete($id)` | GET | `$id` | - | `holiday_schedule->get_one_by_user(id, user_id)` | - | `doctor/schedule` | success/error |
| `delete_multi()` | POST | `selection[]` (array of IDs) | - | `holiday_schedule->destroy()` for each | - | `doctor/schedule` | success/error |

#### View: `views/doctor/schedule/index.php`
- **Booking Days Form:** `days` text input (pre-filled with `$doctor->booking_days`), `day_limit` text input (pre-filled with `$doctor->daily_limit`), Update button
- **Holiday List Table:** DataTable with columns: checkbox, #, Date (red if past, green if future), Remark, Action (delete)
- Select All checkbox + Delete Selected button
- Form wraps table for multi-delete (`form_open("doctor/schedule/delete_multi")`)

#### View: `views/doctor/schedule/add.php`
- Dynamic table with columns: Date (input type=date, `onchange="checkDate(this)"`), Remark (text), Remove button
- "Add More" button adds rows dynamically
- Save button
- Form POST to `doctor/schedule/store`
- Data: `schedule[N][date]`, `schedule[N][remark]`

#### View: `views/doctor/schedule/script.php`
- `addMore` click: appends new date+remark row with `__name__` replacement
- `checkDate()`: prevents selecting past dates (clears input if selected date < today)
- `removeItem()`: removes row

#### Connections: `doctor_holiday_schedule`, `doctors`

---

## 3.5 Profile
#### Controller: `controllers/doctor/Profile.php`
**Class:** `Profile extends Doctor_controller`

**Models:** `Doctors_model` (doctor), `Users_model` (user), `Disease_model` (disease), `State_model` (state), `City_model` (city), `Doctor_type_model` (doctor_type)

| Method | Type | Params | Validation | Queries | Data to View | Redirect | Flash |
|---|---|---|---|---|---|---|---|---|
| `index()` | GET | - | - | `doctor->get_one_by_user()`, `user->get_by_id()`, merged into single object | `profile` (merged user+doctor data) | View: `doctor/profile/show` | - |
| `edit()` | GET | - | - | `doctor->get_one_by_user()`, `user->get_by_id()`, `disease->get_all()`, `state->get_all()`, `doctor_type->get_all()` | `profile`, `dis_name`, `state`, `doctor_type` | View: `doctor/profile/edit` | - |
| `update()` | POST | `name` (from user), `gender` (from user), `doctor_type`, `fees`, `emergency_charge`, `contact_no`, `address`, `state`, `city`, `lat`, `longi`, `description`, `specialization[]` (checkboxes), `award_and_recognition`, `eduction`, `experience`, `registration_detail` | CI validation rule `doctor_profile` | `doctor->update(id, forDoc)`, `user->update(id, forUser)`. `specialization` JSON-encoded. `name` and `gender` go to users table; rest goes to doctors table. | - | `doctor/profile` | success/error |
| `change_pass()` | POST | `current_pass`, `new_pass`, `conform_pass` | CI validation rule `change_password` (includes `valid_current_password` callback) | `user->update(id, [password=>sha256(new_pass)])` | On fail: profile show | `doctor/profile` | success/error |
| `update_profile_photo()` | POST | `profile` (file upload) | - | `user->get_by_id()`, `user->update(id, [profile_img])`. Deletes old photo. Upload to `upload/profile/` | - | `doctor/profile` | success/error |
| `valid_current_password($str)` | Callback | `$str` | - | `user->checkCurrentPassword(id, str)` | - | - | - |
| `city_by_state()` | POST | `state_name` | - | `city->get_city_by_state_name(state)` | JSON city array | - | - | - |

#### View: `views/doctor/profile/show.php`
- **Left Column (col-md-4):** Profile photo (img-circle, 100x100) with upload form (`profile` file input) + Submit button
- **Right Column (col-md-8):** Tab interface:
  - **Info tab:** Display-only form-horizontal showing: Full Name, Email, Gender, Phone, Status (Active=green label, else=danger), Doctor Type, Description, Address, State, City, Hospital Address, Fees, Emergency Charge, Specialization (JSON→labels), Award And Recognition, Education, Experience, Registration Details, Contact No., Hospital Phone. Edit link at top.
  - **Change Password tab:** Form: current_pass (password), new_pass (password), conform_pass (password), Submit button

#### View: `views/doctor/profile/edit.php`
- Cancel button (red) → `doctor/profile`
- Form POST to `doctor/profile/update`
- **Fields:**
  - `name` (text, required)
  - `gender` (select: Male/Female/Other)
  - `doctor_type` (select from `doctor_type` model, required)
  - `fees` (text, required)
  - `emergency_charge` (text)
  - `contact_no` (text, Hospital Contact Number)
  - `address` (textarea, rows=3, required)
  - `state` (select from `state` model, required)
  - `city` (select, populated via AJAX on state change)
  - `lat` (text, Latitude)
  - `longi` (text, Longitude)
  - `description` (textarea, rows=5, required)
  - `specialization[]` (checkboxes from `disease` model, flat-red checkboxes)
  - `award_and_recognition` (textarea, rows=5)
  - `eduction` (textarea, rows=5, required)
  - `experience` (textarea, rows=5)
  - `registration_detail` (textarea, rows=5)
- **JS:** `loadCity()` function - POSTs `state_name` to `doctor/profile/city_by_state`, clears city dropdown, populates from JSON response, auto-selects current city

#### Connections: `doctors`, `users`, `diseases`, `states`, `cities`, `doctor_types`

---

## 3.6 Assistant
#### Controller: `controllers/doctor/Assistant.php`
**Class:** `Assistant extends Doctor_controller`

**Models:** `Users_model` (user), `Doctor_assistants_model` (assistants)

| Method | Type | Params | Validation | Queries | Redirect | Flash |
|---|---|---|---|---|---|---|---|
| `index()` | GET | - | - | `assistants->get_assistant_by_doctor(id)`, `user->get_by_id()` → merged | `assistant` (or empty array) | View: `doctor/assistant/index` | - |
| `create()` | GET | - | - | - | - | View: `doctor/assistant/add` | - |
| `store()` | POST | `name` (required), `email` (required), `mobile_no` (required, max 10), `gender` (required), `password` (required), `c_pass` (required), `address` (required), `description` (required) | CI rule `register_assistant` | Creates user (role=DOCTOR_ASSISTANT, status=ACTIVE, password=sha256) → creates assistant (user_id, doctor_id, address, description) | `doctor/assistant` | success/error |
| `edit($id)` | GET | `$id` | - | `assistants->get_assistant_by_doctor()`, `user->get_by_id()` → merged | `assistant` | View: `doctor/assistant/edit` | - |
| `update($id)` | POST | Same fields except email/mobile disabled | CI rule `register_assistant_update` | Updates user + assistant. Password only updated if non-empty. | `doctor/assistant` | success/error |

#### View: `views/doctor/assistant/index.php`
- If assistant exists: dl-horizontal showing photo (150x150 circle), Name, Gender, Email, Mobile, Address, Description, Edit button
- If not: exclamation icon + "No Assistant yet" + Create button → `doctor/assistant/create`

#### View: `views/doctor/assistant/add.php`
- Cancel button → `doctor/assistant`
- Form POST to `doctor/assistant/store`
- Fields: name (text), email (email), mobile_no (text, maxlength=10), gender (select: Male/Female/Other), password (password), c_pass (password), address (text), description (text)

#### View: `views/doctor/assistant/edit.php`
- Cancel button → `doctor/assistant`
- Same fields, email and mobile_no **disabled** (cannot be changed)
- Pre-filled with current data
- Password fields are optional on update

#### Connections: `users` (role=DOCTOR_ASSISTANT), `doctor_assistants`

---

## 3.7 Receptionist
#### Controller: `controllers/doctor/Receptionist.php`
**Class:** `Receptionist extends Doctor_controller`

**Models:** `Users_model` (user), `Receptionist_model` (receptionist)

Identical pattern to Assistant controller. Key differences:
- Role constant: `RECEPTIONIST`
- No `description` field in receptionist table
- Form validation rule: `register_receptionist` / `register_receptionist_update`
- Views: `doctor/receptionist/index|add|edit` - same structure as assistant but no description field

#### Connections: `users` (role=RECEPTIONIST), `receptionists`

---

## 3.8 Pharmacist
#### Controller: `controllers/doctor/doctor/Pharmacist.php`
**Class:** `Pharmacist extends Doctor_controller`

**Models:** `Users_model` (user), `Doctor_pharmacist_model` (pharmacist)

Similar to Assistant/Receptionist with additions:
- Role constant: `PHARMACIST`
- Additional field: `dlno` (Drug Licence Number)
- Stores: `address`, `description`, `dlno`, `doctor_id`, `created_at`
- Edit sets `created_by = date('Y-m-d H:i:s')` (bug: should be `updated_at`)
- `store()` redirects to `doctor/pharmacist/create` (not index)
- Extra `else` clause in `update()` redirecting with error
- Form validation: `register_pharmacist` / `register_pharmacist_update`
- Views: `doctor/pharmacist/index|add|edit` - shows DL No additionally

#### Connections: `users` (role=PHARMACIST), `doctor_pharmacist`

---

## 3.9 C/O Categories (Complaints/Comorbidity)
#### Controller: `controllers/doctor/Co.php`
**Class:** `Co extends Doctor_controller`

**Model:** `Co_model`

Generated by CRUDigniter v3.2. CRUD pattern.

| Method | Type | Params | Validation | Redirect | Flash |
|---|---|---|---|---|---|
| `index()` | GET | - | - | - | View: `doctor/co/index` | - |
| `add()` | GET/POST | `co_code` (required), `co_detail` (required) | CI rule `co` | View (fail) or `doctor/co/index` | success/error |
| `edit($id)` | GET/POST | Same fields | Same | View (fail) or `doctor/co/index` | success/error |
| `remove($id)` | GET | `$id` | Ownership check | `doctor/co/index` | success/error |

**DB Table:** `co_master` - fields: co_code, co_detail, doctor_id, status ("Active"), created_at, updated_at, created_by

#### View: `views/doctor/co/index.php`
- DataTable: #No, C/O Category, C/O Detail, Actions (edit btn, delete btn with confirm)
- Add button

#### View: `views/doctor/co/add.php`
- Form: co_code (text, required), co_detail (textarea, required), Save button

#### View: `views/doctor/co/edit.php`
- Same form, pre-filled, targets `doctor/co/edit/$id`

#### Connections: `co_master`, `questions_master` (via co_id FK)

---

## 3.10 Questions (Complains)
#### Controller: `controllers/doctor/Questions.php`
**Class:** `Questions extends Doctor_Controller`

**Models:** `Questions_model`, `Co_model`

Generated by CRUDigniter. CRUD pattern.

| Method | Type | Params | Validation | Redirect | Flash |
|---|---|---|---|---|---|
| `index()` | GET | - | - | - | View: `doctor/questions/index` | - |
| `add()` | GET/POST | `question_code` (required), `co_id` (required, select from co_masters), `question` (required), `explenations` (optional) | CI rule `questions` | View (fail, with `co_masters` data) or `doctor/questions/index` | success/error |
| `edit($id)` | GET/POST | Same + `$id` | Same | View (fail, with `co_masters`) or `doctor/questions/index` | success/error |
| `remove($id)` | GET | `$id` | Ownership check | `doctor/questions/index` | success/error |

**DB Table:** `questions_master` - fields: question, explenations, co_id (FK→co_master), question_code, doctor_id, status, created_at, updated_at, created_by

#### View: `views/doctor/questions/index.php`
- DataTable: #No, Complain code, Category (co_code from JOIN), Complain, Explanations, Actions
- Note: Edit link uses `$q['q_id']` (alias from JOIN)

#### View: `views/doctor/questions/add.php`
- Form: question_code (text, required), Category (select from `co_masters`), question (text, required), explenations (textarea)

#### View: `views/doctor/questions/edit.php`
- Same form pre-filled, co_id pre-selected

#### Connections: `questions_master`, `co_master` (JOIN), `suggestions_master` (via question_id FK)

---

## 3.11 Suggestions
#### Controller: `controllers/doctor/Suggestions.php`
**Class:** `Suggestions extends Doctor_controller`

**Models:** `Suggestions_model`, `Questions_model`, `Co_model`

| Method | Type | Params | Queries | Redirect | Flash |
|---|---|---|---|---|---|
| `index()` | GET | `?id=` (question_id) | `Suggestions_model->get_all(id)`, `Co_model->get_all_co_master(id)`, `Questions_model->get_co_question(co_id)` for each, `Questions_model->get_all_questions_master(id)` | `suggestions`, `cos` (with nested questions), `questions` | View: `doctor/suggestions/index` | - |
| `add($question_id)` | POST | `suggestions[][suggestions]` (textarea, required) | `Questions_model->get_questions_master(qid, doctor_id)`, `Suggestions_model->remove_old_suggestions(qid)`, `Suggestions_model->add_suggestions(suggestions)` | `doctor/suggestions?id=$question_id` | success/error |

**DB Table:** `suggestions_master` - fields: suggestions, question_id (FK→questions_master), doctor_id, status, created_at, updated_at, created_by

#### View: `views/doctor/suggestions/index.php`
- **Left panel:** List group of CO categories (active button) with nested question links (URL: `?id=question_id`). Active question highlighted with `background: aquamarine`
- **Right panel:** Dynamic form with existing suggestions pre-filled (textarea per suggestion), "Add New" button appends more textarea rows, "Save" button
- If no question selected: alert warning "Please select question first to add suggestion"
- Form POST to `doctor/suggestions/add/$question_id`
- JS: `#addNew` click appends new suggestion row, `removeItem()` removes rows

#### Connections: `suggestions_master`, `questions_master`, `co_master`

---

## 3.12 Labels
#### Controller: `controllers/doctor/Label.php`
**Class:** `Label extends Doctor_Controller`

**Model:** `Label_model`

Generated by CRUDigniter. CRUD pattern.

| Method | Type | Params | Validation | Redirect | Flash |
|---|---|---|---|---|---|
| `index()` | GET | - | - | - | View: `doctor/label/index` | - |
| `add()` | GET/POST | `label_title` (required), `label_unit` (required) | CI rule `label` | View (fail) or `doctor/label/index` | success/error |
| `edit($id)` | GET/POST | Same fields | Same | View (fail) or `doctor/label/index` | success/error |
| `remove($id)` | GET | `$id` | Ownership check | `doctor/label/index` | success/error |

**DB Table:** `label_master` - fields: label_title, label_unit, input_type ("text_box"), doctor_id, status, created_at, updated_at, created_by

#### View: `views/doctor/label/index.php`
- DataTable: #No, Label Title, Label Unit, Actions (edit, delete)

#### View: `views/doctor/label/add.php`
- Form: label_title (text, required), label_unit (text, required), Save button

#### View: `views/doctor/label/edit.php`
- Same form pre-filled

#### Connections: `label_master`, `p_labels` (via label_master IDs used in prescriptions)

---

## 3.13 Table Master (Diagnostic Tables)
#### Controller: `controllers/doctor/Table_master.php`
**Class:** `Table_master extends Doctor_Controller`

**Model:** `Table_master_model`

| Method | Type | Params | Validation | Redirect | Flash |
|---|---|---|---|---|---|
| `index()` | GET | - | - | - | View: `doctor/table_master/index` | - |
| `add()` | GET/POST | `row` (required, numeric), `column` (required, numeric), `lable_header` (hidden, tagsinput), `lable_footer` (hidden, tagsinput), `lable_row` (hidden, tagsinput), `extra_label` (text) | Manual validation: row/column numeric | View (fail) or redirect `doctor/table_master/index` | Note: `redirect()` called before `_alertSuccessResponce` (bug - success message never shown) |
| `edit($id)` | GET/POST | Same fields + existing data | Same | View (fail) or `doctor/table_master/index` | success/error |
| `remove($id)` | GET | `$id` | Ownership check | `doctor/table_master/index` | success/error |
| `get_table()` | POST | `label_row`, `label_header`, `label_footer`, `extra_label` | - | View: `doctor/table_master/get_table_preview` | - | - |

**DB Table:** `table_master` - fields: row, table_column, lable_header (JSON), lable_footer (JSON), lable_row (JSON), extra_label, doctor_id, status, created_at, updated_at

**Labels parsed:** Comma-separated → array, empty strings replaced with "-"

#### View: `views/doctor/table_master/index.php`
- Table listing (not DataTable): #No, Row, Column, Label Header (JSON decoded), Label Footer, Label Row, Extra Label, Actions (edit, delete)
- Add button only shown if `count($table_master) <= 0`

#### View: `views/doctor/master/add.php`
- Form: row (number), column (number)
- lable_header: `<select data-role="tagsinput" multiple>` (bootstrap-tagsinput plugin)
- lable_footer: same tagsinput
- lable_row: same tagsinput
- extra_label: text input
- Hidden inputs for JSON serialization
- **Client-side validation:** header count must equal column count, row label count must equal row count
- **Preview button:** AJAX POST to `doctor/Table_master/get_table` → loads table preview
- **Save button:** validates then submits form
- Uses `bootstrap-tagsinput` CSS and JS

#### View: `views/doctor/table_master/edit.php`
- Same as add but pre-filled with existing data (tagsinput options populated from JSON)
- Auto-triggers preview on load

#### View: `views/doctor/table_master/get_table_preview.php`
- Dynamic table generation based on JSON arrays: label_row (left column headers), label_header (top column headers), label_footer (bottom), extra_label (bottom-right)
- Table class: `table table-responsive table-bordered`
- Rows from label_row count, columns from label_header count

#### Connections: `table_master`, `p_digno_table` (auto-created from table_master when prescription is created)

---

## 3.14 P Other Settings (Prescription Print Settings)
#### Controller: `controllers/doctor/P_other_setting.php`
**Class:** `P_other_setting extends Doctor_controller`

**Model:** `P_other_setting_model`

| Method | Type | Params | Validation | Redirect | Flash |
|---|---|---|---|---|---|---|
| `index()` | GET | - | - | - | View: `doctor/p_other_setting/index` | - |
| `add()` | GET/POST | `time` (required), `logo` (file, optional), `header` (text, optional), `full_header` (file, optional), `is_full_header` (radio: 0 or 1) | Manual: `time` required | View (fail) or redirect `doctor/p_other_setting/index` | Note: redirect() called before alert (bug) |
| `edit($id)` | GET/POST | Same + existing data | Manual: `time` required | View (fail) or redirect `doctor/p_other_setting/index` | - |
| `remove($id)` | GET | `$id` | Ownership check (id + doctor_id) | `doctor/p_other_setting/index` | - |

**DB Table:** `p_other_settings` - fields: logo (file path), full_header (file path), time, header, is_full_header (0=Logo/Time/Header, 1=Full Header), doctor_id, created_at, updated_at

**File Uploads:** Logo → `upload/p_logo/`, Full Header → `upload/p_logo/`. Old files deleted on update.

#### View: `views/doctor/p_other_setting/index.php`
- Table: ID, Logo (image preview), Time, Header, Full Header (image preview), Actions (edit only; delete hidden)
- Add button only shown if `count($p_other_settings)==0`

#### View: `views/doctor/p_other_setting/add.php`
- Form (multipart): logo (file), header (text), time (text, required), full_header (file), is_full_header (radio: 1=Full Header, 0=Logo/Time/header), Note about dimensions (250px x 880px)

#### View: `views/doctor/p_other_setting/edit.php`
- Same form pre-filled. Radio pre-checked based on `is_full_header` value.

#### Connections: `p_other_settings` (used by `AjaxPrescription/print_prescription` view)

---

## 3.15 Report
#### Controller: `controllers/doctor/Report.php`
**Class:** `Report extends Doctor_controller`

**Model:** `Booking_model` (booking)

| Method | Type | Params | Queries | Data to View | Redirect |
|---|---|---|---|---|---|
| `index()` | GET | - | - | - | View: `doctor/report/index` | - |
| `appointment_charges()` | GET | `?fromdate`, `?todate` | `booking->get_doctor_wise_charges(doctor_id, fromdate, todate)` | `appointment_charge` | View: `doctor/report/appointment_charges` | - |
| `appointment_list()` | GET | `?status`, `?fromdate`, `?todate`, `?patientmobile` | `booking->get_doctor_appointment_all_report(status, fromdate, todate, mobile, doctor_id)` | `appointments` | View: `doctor/report/appointment_list` | - |

#### View: `views/doctor/report/index.php`
- Two report links: "Appointment Charges" and "Appointment History"

#### View: `views/doctor/report/appointment_charges.php`
- Date range filter form: fromdate, todate (date inputs), Filter button
- Displays: **Total charges: Rs. {total}** (SUM of appointment_charge for Visited bookings in date range)

#### View: `views/doctor/report/appointment_list.php`
- Filter form: fromdate, todate, status (select with all statuses), patientmobile (number input), Filter button
- DataTable (`#example`) with export buttons (copy, excel, csv, pdf)
- Columns: #, Appointment ID, Appointment Date, Who has booked (link), Patient Name, Doctor, Disease, Status
- Extra column: `dname` (doctor name from JOIN)

#### Connections: `booking` (charges + history reports)

---

## 3.16 Gallery
#### Controller: `controllers/doctor/Gallery.php`
**Class:** `Gallery extends Doctor_controller`

**Model:** `Doctors_model` (doctor)

| Method | Type | Params | Redirect | Flash |
|---|---|---|---|---|
| `index()` | GET | - | View: `doctor/gallery` | - |
| `upload()` | POST | `gal_img` (file, max 5 images) | `doctor/gallery` (max 5 check) | success/error |
| `delete($one_img)` | GET | `$one_img` (filename) | `doctor/gallery` (unlinks file, removes from JSON array in `doctors.photos`) | success/error |

**Storage:** Images in `upload/gallery/`, filenames as `YYYY-MM-DD_{user_id}_hash.{ext}`. Stored as JSON array in `doctors.photos` column.

#### View: `views/doctor/gallery.php`
- Upload form: file input (max 2MB noted), error display, Submit button
- Gallery grid: 3-column images with thumbnail (`img-thumbnail`), ekko-lightbox on click, delete button per image
- Empty state: exclamation icon + "No image yet"

#### Connections: `doctors` (photos JSON column)

---

## 3.17 Blog Posts
#### Controller: `controllers/doctor/Post.php`
**Class:** `Post extends Doctor_controller`

**Model:** `posts_model` (post)

| Method | Type | Params | Validation | Redirect | Flash |
|---|---|---|---|---|---|---|
| `index()` | GET | - | - | View: `doctor/post/index` | - |
| `create()` | GET | - | - | View: `doctor/post/add` | - |
| `store()` | POST | `title` (required), `content` (required, WYSIWYG), `image` (file, optional), `video_link` (optional) | CI rule `blog` | Creates post with status=PUBLISHED, type=BLOG, paramalink=SEO URL, user_id, blog_img (if uploaded), content stripped of `_wysihtml5_mode` | `doctor/post` | success/error |
| `edit($id)` | GET | `$id` | Ownership check | View: `doctor/post/edit` or redirect `users/blog` | - |
| `update($id)` | POST | Same as store + `$id` | Same | Same | `doctor/post` | success/error |
| `delete($id)` | GET | `$id` | Ownership check, unlink blog_img | `doctor/post` | success/error |
| `generateUrl($str)` | Internal | `$str` | Checks `posts` table for duplicate paramalink | Unique SEO URL string | - | - |
| `hide_unhide($id)` | GET | `$id` | Ownership check. Toggles PUBLISHED↔HIDE | `doctor/post` | success/error |

**DB Table:** `posts` - fields: title, content, type, blog_img, paramalink, status (PUBLISHED/HIDE/BLOCK), user_id, video_link, created_at, updated_at

#### View: `views/doctor/post/index.php`
- DataTable: #No, Title (link to `blog/view/$paramalink`, Date Time, Status (Published=green, Hide=default, Block=danger), Actions (edit, hide/show eye toggle, delete)
- Add New button

#### View: `views/doctor/post/add.php`
- Form: title (text), content (textarea, WYSIWYG editor), video_link (text, optional), image (file, optional), Publish button

- Error: `imgError` displayed if image upload fails


#### View: `views/doctor/post/edit.php`
- Same form pre-filled. Shows current image thumbnail (200x200). Error display.

#### Connections: `posts` table

---

## 3.18 Notifications
#### Controller: `controllers/doctor/Notifications.php`
**Class:** `Notifications extends Doctor_controller`

| Method | Type | Params | Queries | Redirect |
|---|---|---|---|---|
| `index()` | GET | - | `notification->get_all_by_user(id, 100)` | View: `doctor/notifications` | - |

After rendering, updates all notifications to READ status: `notification->update(user_id, ["status"=>READ])`

#### View: `views/doctor/notifications.php`
- Table (`table-hover`): Title (bold, bell icon), body (HTML), timestamp (right-aligned, muted)
- Unread notifications have `warning` background class
- Empty state: bell icon + "You have no notifications"

#### Connections: `notifications` table

---

## Model Details

### `Doctors_model`
**Table:** `doctors`
| Method | SQL Pattern | Return Type |
|---|---|---|
| `create($data)` | INSERT `doctors` | insert_id or false |
| `update($id, $data)` | UPDATE `doctors` WHERE id= | bool |
| `get_all()` | SELECT * FROM `doctors` | result() |
| `get_by_hospital($hid)` | SELECT d.*,u.* FROM doctors d, users u WHERE d.user_id=u.id AND hospital_id=$hid | result() |
| `get_one_by_user($user_id)` | SELECT * FROM `doctors` WHERE user_id= | row() |
| `get_by_id($id)` | SELECT * FROM `doctors` WHERE id= | result() |
| `get_profile($id)` | SELECT doctors.*,users.* FROM doctors,users WHERE doctors.user_id=users.id AND doctors.user_id=$id | row() |
| `get_active_users($limit, $start)` | SELECT doctors.doctor_type,city,state,users.* FROM doctors,users WHERE doctors.user_id=users.id AND hospital_id IS NULL AND status=ACTIVE AND role=DOCTOR | result() |
| `get_active_user($doctor_id)` | Same with WHERE users.id=$doctor_id | row() |
| `get_hospital_doctors($hospital_id)` | Same with WHERE doctors.hospital_id=$hospital_id | result() |
| `get_search_users($keyword, $city, $doctor_type, $limit, $start)` | Same as active_users + LIKE on name, state, specialization, education, experience | result() |
| `get_chart_data_month_wise($id)` | 12 queries of SUM(appointment_charge) from booking WHERE doctor_id IN ($id) AND month()=$i AND status=VISITED | array |

### `Booking_model`
**Table:** `booking`
| Method | SQL Pattern | Return Type |
|---|---|---|
| `create($data)` | INSERT booking (adds created_at, updated_at) | insert_id or false |
| `update($id, $data)` | UPDATE booking WHERE id= (adds updated_at) | bool |
| `get_all()` | SELECT * FROM booking | result() |
| `get_all_by_patient($patient_id)` | SELECT * FROM booking WHERE user_id= | result() |
| `get_all_by_doctor($doctor_id)` | SELECT * FROM booking WHERE user_id= | result() |
| `get_one_by_user($user_id)` | SELECT * FROM booking WHERE user_id= | row() |
| `get_one_by_doctor($doctor_id)` | SELECT * FROM booking WHERE doctor_id= | row() |
| `get_by_id($id)` | SELECT * FROM booking WHERE id= | row() |
| `get_patient_appointment($user_id, $from, $to, $status)` | booking JOIN users u2 ON booking.doctor_id=u2.id, WHERE booking.user_id= + date/status filters, ORDER BY created_at DESC | result() |
| `get_patient_appointment_one($id, $user_id)` | Same JOIN WHERE booking.id=$id AND booking.user_id= | row() |
| `get_doctor_appointment($doctor_id, $status, $order)` | booking LEFT JOIN users u2 ON booking.user_id=u2.id LEFT JOIN users u1 ON booking.doctor_id=u1.id WHERE doctor_id= + status filter, ORDER BY created_at | result() |
| `get_doctor_appointments_latest($doctor_id, $status)` | Same JOIN WHERE booking_date=today AND (PENDING or APPROVE), LIMIT 10 | result() |
| `get_doctor_appointments_today($doctor_id)` | Same JOIN WHERE status=APPROVE AND booking_date=today 00:00:00 | result() |
| `get_doctor_appointments_ajax($doctor_id, $limit, $offset)` | Same JOIN, ORDER BY status ASC, created_at ASC, LIMIT/OFFSET | result() |
| `get_doctor_appointment_all($status)` | JOIN with alias `dname` for doctor name | result() |
| `get_doctor_appointment_all_report($status, $fromdate, $todate, $mobile, $doctor_id)` | Same JOIN + date range + mobile filter + doctor_id filter | result() |
| `get_doctor_appointment_one($id, $doctor_id)` | Same JOIN WHERE booking.id= | row() |
| `get_latest_record()` | SELECT * FROM booking ORDER BY created_at DESC | row() |
| `get_doctor_wise_charges($did, $fromdate, $todate)` | SELECT SUM(appointment_charge) as total FROM booking WHERE status=VISITED + date range + doctor_id, GROUP BY doctor_id | result() |
| `get_today_doctor_appointment($doctor_id, $status)` | Same JOIN WHERE booking_date=today, status filter | result() |
| `check_already_book($doctor_id, $booking_date, $patient_id)` | SELECT count FROM booking WHERE doctor_id= AND user_id= AND booking_date= | num_rows() |
| `get_booking_count_by_date_by_doctor($doctor_id, $date)` | SELECT count FROM booking WHERE doctor_id= AND booking_date= | num_rows() |
| `get_hospital_appointment_count_pending($hid)` | Count with 4-table JOIN (booking, users x2, doctors) WHERE d.hospital_id=$hid AND status=PENDING | count_all_results() |
| `get_hospital_appointment_count_today($hid)` | Same but WHERE DATE(created_at)=today | count_all_results() |
| `get_income_by_doc_and_hspital($did, $fromdate, $todate)` | SUM(appointment_charge) FROM booking WHERE doctor_id= AND status=VISITED + date range, GROUP BY doctor_id | result() |
| `get_today_appointment_position($doctor_id)` | 4-table JOIN WHERE booking_date=today AND status=Approve | result() |
| `get_appintment_by_doctor($doctor_id, $status)` | Same JOIN with alias `dname`, optional status | result() |
| `get_doctor_appointment_all_by_doctor_visited($did, $mobile, $aptid)` | 4-table JOIN (booking, users x2, prescription) WHERE booking.doctor_id=$did AND status=VISITED + mobile/aptid filter, JOIN prescription.booking_id=booking.id AND prescription.doc_id=$did, ORDER BY created_at DESC | result() |
| `count_visited_by_doctor($did)` | SELECT count(*) FROM booking WHERE doctor_id= AND status=VISITED | count |
| `charges_count_for_admin_report($fromdate, $todate, $did)` | SUM + JOIN users ON booking.doctor_id=users.id WHERE status=VISITED + date range + doctor_id filter, GROUP BY doctor_id | result() |
| `get_prescription_data_by_booking_id($bookingid)` | SELECT * FROM prescription WHERE booking_id= | result() |

### `Prescriptions_model`
**Table:** `prescriptions` (note: different from `prescription`)
| Method | SQL Pattern | Return Type |
|---|---|---|
| `create($data)` | INSERT prescriptions | insert_id or false |
| `update($id, $data)` | UPDATE prescriptions WHERE id= | bool |
| `get_by_booking_id($booking_id, $doctor_id)` | SELECT * FROM prescriptions WHERE booking_id= AND user_id= | row() |
| `get_doctor($doctorid)` | SELECT user_id FROM doctors,doctor_pharmacist WHERE doctors.user_id= | result() |
| `get_prescription_for_pharmacist($docotor_id)` | prescription JOIN users ON patient_id=users.id JOIN booking ON booking_id=booking.id WHERE status=VISITED, GROUP BY patient_id | result() |

### `Ajaxprescription_model`
**Table:** `prescription`
| Method | SQL Pattern | Return Type |
|---|---|---|
| `check_doctor_booking($doctor_id, $booking_id, $user_id)` | SELECT * FROM booking WHERE user_id= AND id= AND doctor_id= | result() |
| `check_user_prescription($doctor_id, $booking_id, $user_id)` | SELECT * FROM prescription WHERE patient_id= AND booking_id= AND doc_id= | row() |
| `create_prescription($data)` | INSERT prescription, return row | row() |
| `update_prescription($id, $data)` | UPDATE prescription WHERE id= | void |
| `get_prescription_by_id($id)` | SELECT * FROM prescription WHERE id= | row() |

### `P_Co_model`
**Table:** `p_cos`
| Method | SQL | Return |
|---|---|---|
| `get_prescription_co($prescription_id)` | SELECT * FROM p_cos WHERE p_id= | result() |
| `delete_prescription($prescription_id)` | DELETE FROM p_cos WHERE p_id= | void |
| `insert_prescription_co($cos)` | INSERT_BATCH p_cos | insert_id |
| `get_prescription_co_group_by($prescription_id)` | SELECT * FROM p_cos WHERE p_id= | result() |

### `P_Label_model`
**Table:** `p_labels`
| Method | SQL | Return |
|---|---|---|
| `get_prescription_label($prescription_id)` | SELECT * FROM p_labels WHERE p_id= | result() |
| `delete_prescription_label($prescription_id)` | DELETE FROM p_labels WHERE p_id= | void |
| `insert_prescription_label($labels)` | INSERT_BATCH p_labels | insert_id |

### `P_Suggestion_model`
**Table:** `p_suggestions`
| Method | SQL | Return |
|---|---|---|
| `get_prescription_suggestion($id)` | SELECT * FROM p_suggestions WHERE p_id= | result() |
| `delete_prescription_sug($id)` | DELETE FROM p_suggestions WHERE p_id= | void |
| `insert_prescription_sugg($list)` | INSERT_BATCH p_suggestions | insert_id |
| `get_prescription_suggestion_by_question($id)` | SELECT * FROM p_suggestions WHERE p_id= GROUP BY question | result_array() |
| `get_question_suggestion($question, $prescription_id)` | SELECT suggestions FROM p_suggestions WHERE p_id= AND question= | result_array() |

### `P_digno_model`
**Table:** `p_digno_table`
| Method | SQL | Return |
|---|---|---|
| `create_dgno_table($data)` | INSERT p_digno_table, return row | row() |
| `check_dgno_table($prescription_id)` | SELECT * FROM p_digno_table WHERE p_id= | result() |

### `P_medicine_model`
**Table:** `p_medicine`
| Method | SQL | Return |
|---|---|---|
| `get_prescription_medicine($prescription_id)` | SELECT * FROM p_medicine WHERE p_id= | result() |
| `delete_prescription_medicine($prescription_id)` | DELETE FROM p_medicine WHERE p_id= | void |
| `insert_prescription_medicine($lists)` | INSERT_BATCH p_medicine | insert_id |

### `Doctor_assistants_model`
**Table:** `doctor_assistants`
| Method | SQL | Return |
|---|---|---|
| `create($data)` | INSERT doctor_assistants | insert_id or false |
| `update($id, $data)` | UPDATE doctor_assistants WHERE user_id= | bool |
| `get_assistant_by_doctor($doctor_id)` | SELECT * FROM doctor_assistants WHERE doctor_id= | row() |
| `get_assistant_details($id)` | Complex 4-table JOIN (doctor_assistants, doctors, users x2) | row() |

### `Doctor_pharmacist_model`
**Table:** `doctor_pharmacist`
| Method | SQL | Return |
|---|---|---|
| `create($data)` | INSERT doctor_pharmacist | insert_id or false |
| `update($id, $data)` | UPDATE doctor_pharmacist WHERE user_id= | bool |
| `get_pharmacist_by_doctor($doctor_id)` | SELECT * FROM doctor_pharmacist WHERE doctor_id= | row() |
| `get_assistant_details($id)` | Complex 4-table JOIN (same pattern) | row() |

### `Doctor_holiday_schedule_model`
**Table:** `doctor_holiday_schedule`
| Method | SQL | Return |
|---|---|---|
| `create($data)` | INSERT doctor_holiday_schedule | insert_id or false |
| `create_many($data)` | INSERT_BATCH doctor_holiday_schedule | bool |
| `update($id, $data)` | UPDATE doctor_holiday_schedule WHERE id= | bool |
| `destroy($id, $user_id)` | DELETE doctor_holiday_schedule WHERE id= AND user_id= | bool |
| `get_one_by_user($id, $user_id)` | SELECT * FROM doctor_holiday_schedule WHERE id= AND user_id= | row() |
| `get_all_by_user($user_id)` | SELECT * FROM doctor_holiday_schedule WHERE user_id= ORDER BY date DESC | result() |
| `get_next_holidays($user_id)` | SELECT date FROM doctor_holiday_schedule WHERE user_id= AND date>today ORDER BY date ASC | result_array() |

### `Doctor_medicine_list_model`
**Table:** `doctor_medicine_list`
| Method | SQL | Return |
|---|---|---|
| `create($data)` | INSERT doctor_medicine_list | insert_id or false |
| `update($id, $data)` | UPDATE doctor_medicine_list WHERE id= | bool |
| `get_all()` | SELECT * FROM doctor_medicine_list ORDER BY id DESC | result() |
| `get_all_by_doctor($id)` | SELECT * FROM doctor_medicine_list WHERE user_id= ORDER BY id DESC | result() |
| `get_by_id($id)` | SELECT * FROM doctor_medicine_list WHERE id= | row() |
| `get_by_doctor_id($doctor_id, $keyword)` | SELECT id AS value, name AS text, morning, afternoon, evening, tab, doz, description FROM doctor_medicine_list WHERE user_id= AND name LIKE '%$keyword%' | result() |
| `get_all_list_by_doctor_id($doctor_id)` | SELECT name FROM doctor_medicine_list WHERE user_id= AND status=ACTIVE | result_array() → array_column(name) |
| `get_by_doctor_id_detail($doctor_id, $keyword)` | Same as get_by_doctor_id but with WHERE name= (exact) AND status=ACTIVE | result() |

### `Co_model`
**Table:** `co_master`
| Method | SQL | Return |
|---|---|---|
| `get_co_master($id, $doctor_id)` | SELECT * FROM co_master WHERE id= AND doctor_id= | row_array() |
| `get_all_co_master($doctor_id)` | SELECT * FROM co_master WHERE doctor_id= ORDER BY id DESC | result_array() |
| `add_co_master($params)` | INSERT co_master | insert_id |
| `update_co_master($id, $params)` | UPDATE co_master WHERE id= | void |
| `delete_co_master($id)` | DELETE FROM co_master WHERE id= | void |

### `Questions_model`
**Table:** `questions_master`
| Method | SQL | Return |
|---|---|---|
| `get_questions_master($id, $doctor_id)` | SELECT * FROM questions_master WHERE id= AND doctor_id= | row_array() |
| `get_all_questions_master($doctor_id)` | SELECT questions_master.*, co_master.*, questions_master.id as q_id FROM questions_master JOIN co_master ON co_master.id=questions_master.co_id WHERE doctor_id= ORDER BY questions_master.id DESC | result_array() |
| `add_questions_master($params)` | INSERT questions_master | insert_id |
| `update_questions_master($id, $params)` | UPDATE questions_master WHERE id= | void |
| `delete_questions_master($id)` | DELETE FROM questions_master WHERE id= | void |
| `get_co_question($co_id)` | SELECT * FROM questions_master WHERE co_id= ORDER BY id DESC | result_array() |
| `get_question_suggestion($question)` | SELECT suggestions FROM suggestions_master JOIN questions_master ON suggestions_master.question_id=questions_master.id WHERE questions_master.question= | result_array() |

### `Suggestions_model`
**Table:** `suggestions_master`
| Method | SQL | Return |
|---|---|---|
| `remove_old_suggestions($question_id)` | DELETE FROM suggestions_master WHERE question_id= | void |
| `add_suggestions($suggestions)` | INSERT_BATCH suggestions_master | void |
| `get_all($question_id)` | SELECT * FROM suggestions_master WHERE question_id= | result_array() |

### `Label_model`
**Table:** `label_master`
| Method | SQL | Return |
|---|---|---|
| `get_label_master($id, $doctor_id)` | SELECT * FROM label_master WHERE id= AND doctor_id= | row_array() |
| `get_all_label_master($doctor_id)` | SELECT * FROM label_master WHERE doctor_id= ORDER BY id DESC | result_array() |
| `add_label_master($params)` | INSERT label_master | insert_id |
| `update_label_master($id, $params)` | UPDATE label_master WHERE id= | void |
| `delete_label_master($id)` | DELETE FROM label_master WHERE id= | void |

### `Table_master_model`
**Table:** `table_master`
| Method | SQL | Return |
|---|---|---|
| `get_table_master($id, $doctor_id)` | SELECT * FROM table_master WHERE id= AND doctor_id= | row_array() |
| `get_all_table_master($doctor_id)` | SELECT * FROM table_master WHERE doctor_id= ORDER BY id DESC | result_array() |
| `add_table_master($params)` | INSERT table_master | insert_id |
| `update_table_master($id, $params)` | UPDATE table_master WHERE id= | void |
| `delete_table_master($id)` | DELETE FROM table_master WHERE id= | void |

### `P_other_setting_model`
**Table:** `p_other_settings`
| Method | SQL | Return |
|---|---|---|
| `get_p_other_setting($id, $doctor_id)` | SELECT * FROM p_other_settings WHERE id= AND doctor_id= | row_array() |
| `get_all_p_other_settings($doctor_id)` | SELECT * FROM p_other_settings WHERE doctor_id= ORDER BY id DESC | result_array() |
| `add_p_other_setting($params)` | INSERT p_other_settings | insert_id |
| `update_p_other_setting($id, $params)` | UPDATE p_other_settings WHERE id= | void |
| `delete_p_other_setting($id, $doctor_id)` | DELETE FROM p_other_settings WHERE id= AND doctor_id= | void |

### `Booking_chat_model`
**Table:** `booking_chat`
| Method | SQL | Return |
|---|---|---|
| `create($data)` | INSERT booking_chat (adds created_at) | insert_id or false |
| `update($id, $data)` | UPDATE booking_chat WHERE id= | bool |
| `getByAppointment($booking_id)` | SELECT booking_chat.*, fuser.name as from_name, tuser.name as to_name FROM booking_chat, users fuser, users tuser WHERE from_id=fuser.id AND to_id=tuser.id AND booking_id= | result() |

---

## Security Notes
1. **SMS API key hardcoded** in `Dashboard::sendMobileMessage()` (line 75) - `d44b9e34dbXX` (partially masked)
2. **SQL injection risk** in `Doctors_model::get_search_users()` - user input directly interpolated into LIKE clauses (lines 129-135)
3. **SQL injection risk** in `Booking_model::get_patient_appointment()` - user input in status and date values (lines 89-96)
4. **Password hashing:** SHA-256 without salt (weak by modern standards)
5. **File upload** path traversal potential in `_upload_file()` helper (not shown but used throughout)
6. **Extra_field bug** in `Table_master::add()` - `redirect()` called before `_alertSuccessResponce()`, so success flash message is never shown
7. **Pharmacist update** has `created_by = date()` instead of `updated_at = date()` (line 111)
8. **P_other_setting edit** has syntax error: missing closing parenthesis before brace on line 162: `if(isset($p_other_setting['id'])` {`
9. **Cancel buttons commented out** in appointment index/show views - cancel functionality intentionally disabled
10. **Inconsistent casing:** Some controllers extend `Doctor_controller`, others `Doctor_Controller`
11. **Duplicate update call** in `Appointment::update_prescription()` (line 260 called twice)
12. **Hardcoded Google Analytics ID:** UA-171698773-1
