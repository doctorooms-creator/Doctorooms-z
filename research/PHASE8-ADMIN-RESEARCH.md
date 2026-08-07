# Phase 8: Admin Dashboard Module — Complete Research

> Source: `/tmp/Doctorooms/` — PHP/CodeIgniter hospital management system
> 16 Controllers, 45+ Views, 8+ Models, 1 Layout

---

## Architecture Overview

### Base Controller: `Admin_contoller` (MY_Controller.php)
- **Location**: `application/core/MY_Controller.php` (line 605-632)
- **Extends**: `MY_Controller` → `CI_Controller`
- **Auth Guard**: Checks `session->userdata('user_login')` exists and `role == ADMIN`
- **Session Key**: `user_login` (object with `role` field)
- **Blocked User Check**: Calls `$this->user->check_auth_after_login($session_data)` but does **NOT** check if the result is false (unlike Doctor/Patient controllers) — **BUG**: admin can access panel even if blocked
- **Properties Set**: `$this->view_data['user']`, `$this->user_data` (cast to object from session)
- **Helper Methods Inherited from MY_Controller**:
  - `_alertSuccessResponce($success, $success_msg, $fail_msg, $re_url)` — sets flash feedback, redirects
  - `_alertInfoResponce(...)` — same but with 'info' class
  - `_alertWarningResponce(...)` — same but with 'alert' class
  - `_upload_file($path, $title, $img_control_name)` — single file upload, returns `['status'=>'true'|'false', 'file_name'=>..., 'upload_error'=>...]`
  - `_upload_files(...)` — multiple file upload, returns JSON array of filenames
  - `_generateSeoURL($string)` — URL slug generator
  - `_generate_thumb(...)` — creates 300x300 thumbnail
  - `send_mail(...)` — sends email via CI email library
  - `sendMobileMessage(...)` — sends SMS via curl to soft-tech-solutions.com

### Constants (config/constants.php)
| Constant | Value |
|----------|-------|
| ADMIN | "admin" |
| DOCTOR | "doctor" |
| PATIENT | "patient" |
| HOSPITAL | "hospital" |
| RECEPTIONIST | "receptionist" |
| DOCTOR_ASSISTANT | "assistant" |
| PHARMACIST | "pharmacist" |
| PENDING | "Pending" |
| ACTIVE | "Active" |
| BLOCK | "Block" |
| APPROVE | "Approve" |
| VISITED | "Visited" |
| REJECTED | "Canceled" |
| EXTEND | "Extend" |
| PUBLISHED | "Published" |
| HIDE | "Draft" |
| BLOG | "Blog" |
| SITE_TITLE | "Doctorooms" |

---

## Layout: `layouts/master_page_admin.php`

### CSS Assets Loaded
- AdminLTE 2.4.0 (full suite)
- Font Awesome, Ionicons
- Morris.js charts, jVectorMap
- Bootstrap Datepicker, Daterangepicker
- Bootstrap WYSIHTML5
- DataTables (with Buttons: CSV, Excel, PDF, Print)
- PNotify notifications
- CKEditor 4.11.1 (CDN)
- SweetAlert (CDN)
- Google Analytics (UA-171698773-1)
- Custom `assets/css/point.css`

### Header
- Logo: "DR" (mini) / `SITE_TITLE` (full) → links to `admin/dashboard`
- Navbar user menu: Profile image, name, role → dropdown with:
  - "Profile Settings" → `admin/dashboard/update_admin_profile`
  - "Sign out" → `auth/logout`

### Sidebar Navigation
1. **Dashboard** → `admin/dashboard`
2. **Appointment** → `admin/appointment`
3. **Income** → `admin/appointment/charges_income`
4. **User List** (treeview submenu):
   - All Users → `admin/dashboard/user_view`
   - Doctors → `admin/doctor`
   - Assistant → `admin/assistant`
   - Patient → `admin/patient`
   - ~~Receptionist~~ (commented out HTML)
   - Hospital → `admin/hospital`
5. **Blog** → `admin/blog`
6. **Hospital Inquiry** → `admin/inquiry`
7. **Localization** (treeview submenu):
   - Country → `admin/localization/country_view`
   - State → `admin/localization/state_view`
   - City → `admin/localization/city_view`
8. **Masters** (treeview submenu):
   - Doctor Type → `admin/type_master`
   - Disease Type → `admin/disease_master`
9. **Admin Charges** → `admin/config`
10. **Slider** → `admin/slider`
11. **Reports** → `admin/report`

### JavaScript (Bottom)
- jQuery 3.x, jQuery UI, Bootstrap JS
- Morris.js bar charts (initialized with PHP data for `#bar-chart` and `#bar-chart-doc`)
- DataTables initialized on `#example1` with export buttons (CSV, Excel, PDF, Print)
- CKEditor.replace for `editor1` through `editor6`
- WYSIHTML5 on `.textarea`
- PNotify flash message handler (reads `session->flashdata('feedback')` and `feedback_class`)
- SweetAlert loaded (used by some views)
- Google Tag Manager
- Print CSS: hides `.d-n` class elements, links, FontAwesome icons
- **BUG**: Missing closing `});` for the second Morris.Bar chart (doctor income)

### Footer
- "Version 2.4.0" | "Copyright © 2019 Bracesoft Solution"

---

## 8.1 Dashboard
#### Controller: `admin/Dashboard.php`

**Models Loaded**: Posts_model (`post`), Users_model (`user`), Booking_model (`book`)

| Method | Logic | View |
|--------|-------|------|
| `index()` | Gets counts (doctors, patients, receptionists, hospitals), latest 5 posts, latest 5 users, appointments by status (default PENDING, filterable via `?status=`). Sets `$view_data['a']` = current admin user. | `admin/dashboard` |
| `user_view()` | `$user->get_all()` — lists all users | `admin/user_view` |
| `update_status()` | GET `?id=&st=` — toggles ACTIVE/BLOCK on users table. Validates status is ACTIVE or BLOCK. | redirects to `user_view` |
| `update_admin_profile()` | Loads admin user detail for profile edit form | `admin/admin_profile_setting` |
| `update_validate()` | POST — updates name, gender, mobile_no. Unsets email and mobile_no (so email is immutable). Sets `updated_at`. | redirects to profile |
| `upload_profile_img()` | File upload to `upload/profile/` with date_userId prefix. Deletes old image if not `default.png`. | redirects to profile |
| `change_password()` | Validates via `change_password` rule set. Hashes new password with SHA256. | redirects to profile |
| `valid_current_password($str)` | Callback validator — checks `$user->checkCurrentPassword()` | — |

#### View: `admin/dashboard.php`
- **4 info boxes** (top row): Doctors count (aqua, fa-user-md), Patients (red, fa-male), Receptionists (green, fa-user), Hospitals (yellow, fa-hospital-o)
- **Latest Appointments table**: Columns: #, Appointment ID, Appointment Date, Who Booked (name+mobile+email), Patient Name, Doctor, Disease, Status (color-coded labels: Pending=warning, Approve=primary, Extend=info, Visited=success, Canceled=danger)
- **Latest Users table** (col-md-8): #, Name, Email, Role, Status
- **Top Posts table** (col-md-4): #, Post title, User email
- **CSS**: Hides DataTable buttons (`.dt-button { display: none !important; }`)

#### View: `admin/user_view.php`
- DataTable with: #, Name, Email, Role, Status (clickable toggle), No delete/action buttons
- SweetAlert `confirm_delete()` function (unused in view)

#### View: `admin/admin_profile_setting.php`
- **Left col (md-3)**: Profile image upload form (POST to `admin/dashboard/upload_profile_img`, multipart)
- **Right col (md-9)**: Tab "Activity" with form POST to `admin/dashboard/update_validate` — fields: Name, Email (disabled), Contact Number, Gender (select)
- **Below**: Change Password box — fields: Current Password, New Password, Confirm Password → POST to `admin/dashboard/change_password`
- Profile image displayed from `upload/profile/{profile_img}`

#### Connections
- `Users_model::get_by_id()`, `count_doctors()`, `count_patient()`, `count_receptionist()`, `count_hospital()`, `get_all()`, `get_user_five()`, `update_status_active()`, `update_status_block()`, `update()`, `checkCurrentPassword()`
- `Posts_model::get_all(5)`
- `Booking_model::get_doctor_appointment_all($status)`

---

## 8.2 Appointments
#### Controller: `admin/Appointment.php`

**Models Loaded**: Users_model (`user`), Booking_model (`book`)

| Method | Logic | View |
|--------|-------|------|
| `index()` | Gets appointments by status (default PENDING). `?status=` filter. | `admin/appointment_view` |
| `show($id)` | Gets single appointment by ID. **BUG**: Uses `$this->user_data->id` (admin ID) which is wrong for doctor appointment lookup. | `admin/appointment_view` |
| `extend($id)` | Changes status to EXTEND. Guards: not if already APPROVE/VISITED/REJECTED. **BUG**: Redirects to `doctor/appointment` instead of `admin/appointment`. | redirect |
| `approve($id)` | Changes status to APPROVE. Guards: not if VISITED/REJECTED. **BUG**: Same wrong redirect to `doctor/appointment`. | redirect |
| `visited($id)` | Changes status to VISITED. Guards: not if REJECTED/PENDING/EXTEND. **BUG**: Same wrong redirect. | redirect |
| `cancel($id)` | Changes status to REJECTED. Guards: not if VISITED. | redirect to `admin/appointment` |
| `charges_income()` | GET `?fromdate=&todate=&doctor=` — gets doctor-wise charges/income report | `admin/view_charges_income` |

#### View: `admin/appointment_view.php`
- Status filter dropdown (auto-submit): PENDING, EXTEND, APPROVE, VISITED, CANCELED, All
- DataTable: #, Appointment ID, Date, Booked By (link to doctor appointment show), Patient Name, Doctor, Disease, Status (colored labels)
- Appointment links point to `doctor/appointment/show/{id}` — **BUG**: wrong route for admin context

#### View: `admin/view_charges_income.php`
- DataTable: #, Image (profile_img), Doctor Name, Email, Mobile, Charges (Rs.)
- Empty tfoot (for potential total calculations)

#### Connections
- `Booking_model::get_doctor_appointment_all($status)`, `get_doctor_appointment_one($id, $user_id)`, `get_doctor_wise_charges($doctor, $fromdate, $todate)`, `update($id, $data)`

---

## 8.3 Doctors Management
#### Controller: `admin/Doctor.php`

**Models Loaded**: Doctors_model (`doctor`), Users_model (`user`), Receptionist_model (`receptionist`), Doctor_type_model (`doc_type`), Disease_model (`disease`), City_model (`city`), State_model (`state`), Doctor_rating_model (`rating`)

| Method | Logic | View |
|--------|-------|------|
| `index()` | GET `?hospital=` filter. Lists hospitals for dropdown, gets doctors filtered by hospital. | `admin/doctor_view` |
| `update_status()` | Toggles ACTIVE/BLOCK. | redirect |
| `profile_view()` | GET `?id=`. Gets doctor profile, receptionist info, average rating. | `admin/profile_view_doctor` |
| `distroy()` | GET `?id=`. Deletes doctor profile then user. **BUG**: Typo in method name. Calls `distroy_profile` first (no null check on result), then `distroy_user`. | redirect |
| `edit($id)` | Loads doctor user + receptionist user for edit form. **BUG**: No null check on `$rec_data` before calling `get_by_id($rec_data->user_id)`. | `admin/doctor_edit` |
| `edit_validate($id)` | POST. Validates with `admin_doctor` rule. Hashes password with SHA256. | redirect |
| `edit_profile($id)` | Loads doctor detail, states, all doctor types, all diseases, receptionist. Uses `error_reporting(0)`. **BUG**: Same null check issue with rec_data. | `admin/profile_edit_doctor` (view file may not exist in admin folder) |
| `edit_profile_validate($id)` | POST. Manually extracts fields: doctor_type, fees, address, hospital_address, phone_no, contact_no, lat, longi, description, specialization (JSON encoded), eduction, experience, award_and_recognition, registration_detail. | redirect |

#### View: `admin/doctor_view.php`
- Hospital filter dropdown (auto-submit on change)
- DataTable: #, Name (Dr. prefix), Email, Mobile, Role, Status (toggle link), Actions (view, edit profile, delete-hidden)
- Delete button has class `hidden` — **dead feature**
- SweetAlert `confirm_delete()` JS with **BUG**: references undefined `person.fullName()`

#### View: `admin/doctor_edit.php`
- Form POST to `admin/doctor/edit_validate/{id}`
- Fields: Name, Gender (select: Male/Female), Role (disabled select), Email (readonly), Password (readonly, shows hash), Mobile
- Link to "Edit Profile" → `admin/doctor/edit_profile/{id}`
- **SECURITY BUG**: Password field shows hashed password in plain text (readonly but visible in HTML source)

#### View: `admin/profile_view_doctor.php`
- **Left sidebar (md-3)**: Profile image, name (Dr. prefix), doctor type, rating (X/5 stars)
- **Contact box**: Fees, Address, Hospital Location, Phone, Mobile, Email, Registration Date
- **Right content (md-9)** — 2 tabs:
  - **Personal Detail**: Description, Specialization (JSON-decoded label badges), Education, Experience, Award & Recognition, Registration Detail
  - **Receptionist**: Shows receptionist photo, name, email, mobile, gender, status, address. If no receptionist, shows red text "No Receptionist Created"

#### Connections
- `Users_model::get_by_id()`, `get_hospital_user()`, `get_doctor_user_by_hospital($id)`, `update_status_active()`, `update_status_block()`, `update()`
- `Doctors_model::get_profile($id)`, `get_one_by_user($id)`, `update($id, $data)`, `distroy_profile($id)`, `distroy_user($id)`
- `Receptionist_model::get_receptionist_by_doctor($id)`
- `Doctor_rating_model::get_average_rating($id)`
- `Doctor_type_model::get_all()`, `Disease_model::get_all()`, `State_model::get_all()`

---

## 8.4 Hospital Management
#### Controller: `admin/Hospital.php`

**Models Loaded**: Hospital_model (`hospital`), Users_model (`user`), State_model (`state`), City_model (`city`)

| Method | Logic | View |
|--------|-------|------|
| `index()` | Lists all hospitals | `admin/hospital_view` |
| `update_status()` | Toggles ACTIVE/BLOCK | redirect |
| `add()` | Loads all states for dropdown | `admin/hospital_add` |
| `add_validate()` | POST. Validates with `register` rule. Hashes password SHA256. Sets gender='male', role=HOSPITAL, status=ACTIVE. Unsets c_pass, terms, state, city. Calls `$hospital->create($data)`. | redirect |
| `add_profile()` | Lists all hospitals for dropdown | `admin/hospital_detail_add` |
| `add_profile_validate()` | POST. Calls `$hospital->create_detail($data)` | redirect |
| `profile_view()` | GET `?id=`. Gets hospital profile + doctors belonging to hospital | `admin/profile_view_hospital` |
| `edit()` | GET `?id=`. Gets hospital user | `admin/hospital_edit` |
| `edit_validate()` | GET `?id=`. POST. Updates name only (mobile_no unset). Sets `updated_at`. | redirect |
| `edit_profile()` | GET `?id=`. Gets hospital profile for detail editing | `admin/hospital_detail_edit` |
| `edit_profile_validate()` | GET `?id=`. POST. Calls `$hospital->update_profile($id, $data)` | redirect |
| `distroy()` | GET `?id=`. Deletes profile then user. | redirect |
| `resetpass($id)` | Resets password to SHA256 of '123456'. Shows new password in flash message. **SECURITY ISSUE**: Hardcoded password in URL. | redirect |
| `city_by_state()` | AJAX POST. Returns JSON of cities by state name. | JSON response |

#### View: `admin/hospital_view.php`
- ADD button (top right) → `admin/hospital/add`
- DataTable: #, Name, Email, Mobile, Role, Status (toggle), Actions (view, edit, delete-hidden)
- Delete is `class="hidden"` — dead feature

#### View: `admin/hospital_add.php`
- Link to "Add Detail" → `admin/hospital/add_profile`
- Form POST to `admin/hospital/add_validate`
- Fields: Hospital Name, Email, Password, Confirm Password, Contact No, State (select with JS `loadCity()`), City (dynamic dropdown), Terms checkbox
- **JS**: `loadCity()` — AJAX POST to `admin/hospital/city_by_state`, clears city options, appends from JSON response

#### View: `admin/hospital_edit.php`
- Link to "Edit Profile" → `admin/hospital/edit_profile?id=`
- Form POST to `admin/hospital/edit_validate?id=`
- Fields: Hospital Name (editable), Email (display only, no input), Contact Number (disabled), Password (displayed as text with Reset link)
- Reset link → `admin/hospital/resetpass/{id}`

#### View: `admin/hospital_detail_add.php`
- Form POST to `admin/hospital/add_profile_validate`
- 2-column layout: Hospital Name, Address, Contact Number, Hospital (select from existing), Photo Gallery (file input), Latitude, Longitude

#### View: `admin/hospital_detail_edit.php`
- Form POST to `admin/hospital/edit_profile_validate?id={hid}`
- Fields: Hospital Name, Address, Contact Number, Hospital (select, pre-selected), Latitude, Longitude
- No gallery file input in edit (add-only)

#### View: `admin/profile_view_hospital.php`
- **Left sidebar**: Static hospital.jpg image, hospital name, hardcoded likes (1,322), hardcoded 5-star rating
- **Contact box**: Location, Phone, Email, Registration Date
- **Right content** — 2 tabs:
  - **Activity**: Gallery (shows same image 3x — **BUG**), Google Maps embed (lat/long), **BUG**: Missing closing `</div>` tags (truncated HTML)
  - **Doctors**: Card widgets showing each doctor's profile image, name, type, status, email, contact

#### Connections
- `Hospital_model::get_all()`, `create($data)`, `create_detail($data)`, `get_profile($id)`, `get_by_id_user($id)`, `update_profile($id, $data)`, `get_doctor_by_hospital($id)`, `distroy_profile($id)`, `distroy_user($id)`
- `Users_model::get_hospital_user()`, `update()`, `update_status_active()`, `update_status_block()`
- `City_model::get_city_by_state_name($state_name)`
- `State_model::get_all()`

---

## 8.5 Patient Management
#### Controller: `admin/Patient.php`

**Models Loaded**: Patient_model (`patient`), Users_model (`user`)

| Method | Logic | View |
|--------|-------|------|
| `index()` | Lists all patients via `$user->get_patient_user()` | `admin/patient_view` |
| `update_status()` | Toggles ACTIVE/BLOCK | redirect |
| `edit()` | GET `?id=`. Gets patient via `$patient->get_by_id_user($id)` | `admin/patient_edit` |
| `edit_validate()` | GET `?id=`. POST. Validates with `admin_doctor` rule (**BUG**: uses doctor validation for patient). Hashes password. Unsets mobile_no. | redirect |
| `resetpass($id)` | Resets password to '123456' SHA256. **SECURITY ISSUE**. | redirect |

#### View: `admin/patient_view.php`
- DataTable: #, Name, Email, Mobile, Role, Status (non-clickable label), Actions (edit-hidden, trash-empty-link)
- Edit button has `class="hidden"` — dead feature
- Trash link has empty `href=""` — dead link

#### View: `admin/patient_edit.php`
- Form POST to `admin/patient/edit_validate?id=`
- Fields: Name, Gender (select), Role (disabled select), Email (readonly), Password (with Reset link), Mobile (disabled)
- Reset → `admin/patient/resetpass/{id}`

#### Connections
- `Patient_model::get_by_id_user($id)`
- `Users_model::get_patient_user()`, `update()`, `update_status_active()`, `update_status_block()`

---

## 8.6 Blog Management
#### Controller: `admin/Blog.php`

**Models Loaded**: Posts_model (`blog`), Users_model (`user`)

| Method | Logic | View |
|--------|-------|------|
| `index()` | Lists all posts | `admin/blog_view` |
| `update_status()` | Toggles PUBLISHED/HIDE | redirect |
| `add()` | Shows add form | `admin/blog_add` |
| `add_validate()` | POST. Validates with `blog` rule. Uploads image to `upload/blog/` (optional). Sets status=PUBLISHED, type=BLOG, generates permalink via `generateUrl()` (recursive unique check), user_id=current admin. | redirect |
| `distroy()` | GET `?id=&uid=`. Deletes post | redirect |
| `update($id)` | Loads single post for editing | `admin/blog_edit` |
| `update_validate($id)` | POST. Validates, optionally uploads new image (deletes old), updates permalink. | redirect |
| `generateUrl($str)` | Recursive function — generates SEO URL, checks uniqueness in `posts` table, appends random number if duplicate | — |
| `post_view($paramalink)` | Shows single blog post + latest 5 posts | `admin/blog_view_single` |

#### View: `admin/blog_view.php`
- ADD button → `admin/blog/add`
- DataTable: #, Title (link to `admin/blog/post_view/{paramalink}`), Type, Date, User (email), Status (toggle), Actions (edit, delete)

#### View: `admin/blog_view_single.php`
- Full blog display: title, optional image, optional video iframe (YouTube embed), content (HTML), date, author name
- AddToAny social sharing buttons (Facebook, Twitter, Google+, WhatsApp, Copy Link)
- Disqus comments thread (`#disqus_thread`) — **external dependency**

#### View: `admin/blog_add.php`
- Form POST to `admin/blog/add_validate` (multipart)
- Fields: Title, Content (textarea id=`editor1` → CKEditor), Video Link (optional), Image (optional file)
- CKEditor initialized on `editor1` from layout

#### View: `admin/blog_edit.php`
- Form POST to `admin/blog/update_validate/{id}` (multipart)
- Same fields as add, pre-populated. Shows current image thumbnail.
- CKEditor on `editor1`

#### Connections
- `Posts_model::get_all()`, `get_by_id($id)`, `create($data)`, `update($id, $data)`, `destroy($id, $uid)`, `get_single_post($paramalink)`, `get_latest_post(5)`

---

## 8.7 Slider Management
#### Controller: `admin/Slider.php`

**Models Loaded**: Slider_model (`slider`), Users_model (`user`)

| Method | Logic | View |
|--------|-------|------|
| `index()` | Lists all sliders | `admin/slider_view` |
| `add()` | Shows add form | `admin/slider_add` |
| `add_slide_validate()` | Upload config: path=`upload/slider`, types=gif/jpg/png/jpeg, max_size=2MB, max_width=1900, max_height=1220. Saves slider_image, position, link, status=ACTIVE, timestamps. | redirect |
| `update_status()` | Toggles ACTIVE/BLOCK via slider model | redirect |
| `distroy()` | GET `?id=`. Deletes slider. **BUG**: Calls `_alertWarningResponce` (correct) but also has a fallback `_alertWarningResponce` (missing 'n' — potential fatal error) | redirect |

#### View: `admin/slider_view.php`
- NEW button → `admin/slider/add`
- DataTable: #, Photo (thumbnail 100px), Position, Date, Status (toggle), Action (delete)
- Images from `upload/slider/`

#### View: `admin/slider_add.php`
- Form POST to `admin/slider/add_slide_validate` (multipart)
- Fields: Image (file), Position (text), Link (text)

#### Connections
- `Slider_model::get_slider()`, `create_slider($data)`, `update_status_active($id)`, `update_status_block($id)`, `destroy($id)`

---

## 8.8 Assistant Management
#### Controller: `admin/Assistant.php`

**Models Loaded**: Doctor_assistants_model (`assistant`), Users_model (`users`)

| Method | Logic | View |
|--------|-------|------|
| `index()` | Lists assistants via `$users->get_assistant_user()` | `admin/assistant_list` |
| `hide_unhide($id)` | Toggles ACTIVE/BLOCK | redirect |
| `profile_view()` | GET `?id=`. Gets assistant details. **BUG**: Uses `$this->user` (not loaded — alias is `users`). Will crash. | `admin/profile_view_assistant` |
| `edit()` | GET `?id=`. Loads assistant user | `admin/assistant_edit` |
| `edit_validate()` | GET `?id=`. POST. Inline rules: name (required), gender (required), mobile (required, is_unique). Unsets mobile_no. **BUG**: Uses `$this->user` (not loaded). | redirect |

#### View: `admin/assistant_list.php`
- DataTable: #, Name, Email, Mobile, Status (toggle link), Actions (view, edit)

#### View: `admin/assistant_edit.php`
- Form POST to `admin/assistant/edit_validate?id=`
- Fields: Name, Gender (select), Role (disabled select — includes ASSISTANT option but with duplicate PATIENT value), Email (readonly), Mobile (disabled)

#### View: `admin/profile_view_assistant.php`
- **Left sidebar**: Profile image (`ass_profile_img`), name, link to parent doctor
- **Contact box**: Address, Mobile, Email, Registration Date
- **Right content** — "Personal Detail" tab: Description
- Uses `$profile->ass_name`, `$profile->ass_profile_img`, `$profile->ass_mobile_no`, `$profile->ass_email` — fields from `doctor_assistants` table

#### Connections
- `Doctor_assistants_model::get_assistant_details($id)`
- `Users_model::get_assistant_user()`, `get_by_id()`, `update()`

---

## 8.9 Receptionist Management
#### Controller: `admin/Receptionist.php`

**Models Loaded**: Receptionist_model (`receptionist`), Users_model (`user`)

| Method | Logic | View |
|--------|-------|------|
| `index()` | Lists receptionists via `$user->get_receptionist_user()` | `admin/receptionist_view` |
| `update_status()` | Toggles ACTIVE/BLOCK | redirect |
| `edit()` | GET `?id=`. Gets receptionist via `$receptionist->get_by_id_user($id)` | `admin/receptionist_edit` |
| `edit_validate()` | GET `?id=`. POST. Validates with `admin_doctor` rule. Hashes password. | redirect |

#### View: `admin/receptionist_view.php`
- DataTable: #, Name, Email, Mobile, Role, Status (toggle), Actions (edit, trash-empty)
- Trash link has empty `href=""`
- Note: Receptionist link is **commented out** in sidebar navigation

#### View: `admin/receptionist_edit.php`
- Form POST to `admin/receptionist/edit_validate?id=`
- Fields: Name, Gender (select), Role (select — **not disabled**, can change role!), Email (editable, not readonly), Password (editable, shows hash), Mobile (editable)
- **SECURITY BUG**: Password shown as plain text hash in editable field. Role is changeable.

#### Connections
- `Receptionist_model::get_by_id_user($id)`
- `Users_model::get_receptionist_user()`, `update()`, `update_status_active()`, `update_status_block()`

---

## 8.10 Reports
#### Controller: `admin/Report.php`

**Models Loaded**: Users_model (`user`), Booking_model (`booking`), Hospital_model (`hospital`), Doctors_model (`doctor`)

| Method | Logic | View |
|--------|-------|------|
| `index()` | Shows report links page | `admin/report_list` |
| `view_user()` | Pagination (20/page). Filters: fromdate, todate, usertype. | `admin/report_user` |
| `view_appointment()` | Filters: fromdate, todate, status, patientmobile. | `admin/report_appoinment` |
| `view_doctor()` | Filters: fromdate, todate. | `admin/report_doctor` |
| `view_hospital()` | Filters: fromdate, todate. | `admin/report_hospital` |
| `view_patient()` | Filters: fromdate, todate. | `admin/report_patient` |
| `view_income()` | Filters: fromdate, todate, doctor. Shows all doctors + hospitals for dropdowns. | `admin/report_income` |
| `site_statistics()` | Same 4 count boxes as dashboard | `admin/site_statestics` |
| `view_income_hospital()` | Filters: hospital, fromdate, todate. Gets doctors by hospital, calculates income per doctor. **BUG**: Assignment `$doc->total = $income` is always truthy, then overwrites with `$income[0]->total`. Will crash if `$income` is empty. | `admin/report_income_hospital` |
| `income_chart_hospital()` | Gets hospital doctors, monthly chart data. Renders charts. | `admin/charts` |
| `income_chart_doctor()` | Gets doctor monthly chart data. Renders charts. | `admin/charts` |

#### View: `admin/report_list.php`
- 4-column link grid:
  - General Report: User Report, Site Statistics (empty link)
  - Doctor Report: User Report (wrong label)
  - Hospital Report: User Report (wrong label)
  - Patient Report: User Report (wrong label)
  - Appointment Report
  - Income Report: Admin Income, Hospital Wise Income
  - Chart Report: chart link

#### View: `admin/report_user.php`
- Filter form: From Date, To Date, User Type (select: HOSPITAL/RECEPTIONIST/DOCTOR/PATIENT)
- DataTable with pagination: #, Image, Name, Email, Role, Status (toggle), Date
- Custom DataTable init (paging disabled, searching enabled)
- SweetAlert confirm_delete (unused)

#### View: `admin/report_appoinment.php`
- Filter: From Date, To Date, Status (select), Patient Mobile (number input), Filter button
- Same appointment table as appointment_view

#### View: `admin/report_doctor.php`
- Filter: From Date, To Date
- DataTable: #, Name (Dr.), Email, Mobile, Role, Status, Date
- SweetAlert with same buggy `person.fullName()` reference

#### View: `admin/report_hospital.php`
- Filter: From Date, To Date
- DataTable: #, Name, Email, Mobile, Role, Status, Date

#### View: `admin/report_patient.php`
- Filter: From Date, To Date
- DataTable: #, Name, Email, Mobile, Role, Status, Date

#### View: `admin/report_income.php`
- Filter: From Date, To Date, Doctor (select from all doctors)
- DataTable: #, Image, Doctor Name, Email, Mobile, Charges (Rs.)
- **BUG**: To Date input pre-fills with fromdate value

#### View: `admin/report_income_hospital.php`
- Filter: From Date, To Date, Hospital (select)
- Same table as report_income
- **JS**: DataTable footerCallback for column 4 totals (page total + grand total)
- **BUG**: Column index 4 is Mobile, not Charges (should be 5)

#### View: `admin/site_statestics.php`
- 4 info boxes: Doctors, Patients, Receptionists, Hospitals (dynamic counts)
- **8 more info boxes** with **HARDCODED** values: Messages (1,410), Bookmarks (410), Uploads (13,648), Likes (93,139) — duplicated twice (16 boxes total, 8 are fake data)
- **BUG**: All statistics below the first row are hardcoded placebo data

#### View: `admin/charts.php`
- Two bar charts: Hospital Income Growth + Doctor Income Growth
- Each has a filter form (hospital/doctor select + filter button)
- Charts rendered by Morris.Bar in layout (PHP `$chartdata` and `$chartdatadoctor`)

#### Connections
- `Users_model::get_all_user_report()`, `get_doctor_user_report()`, `get_hospital_user_report()`, `get_patient_user_report()`, `get_doctor_user()`, `get_hospital_user()`, `count_users()`, `count_doctors()`, `count_patient()`, `count_receptionist()`, `count_hospital()`
- `Booking_model::get_doctor_appointment_all_report()`, `charges_count_for_admin_report()`, `get_income_by_doc_and_hspital()`
- `Hospital_model::get_doctor_by_hospital()`, `get_chart_data_month_wise()`
- `Doctors_model::get_by_hospital()`, `get_chart_data_month_wise()`

---

## 8.11 Config (Admin Charges)
#### Controller: `admin/Config.php`

**Models Loaded**: Config_model (`configcharge`), Users_model (`user`)

| Method | Logic | View |
|--------|-------|------|
| `index()` | Gets single config record | `admin/charges` |
| `update($id)` | POST. Updates config record | redirect |

#### View: `admin/charges.php`
- Single field form: Admin Charge (text input) → POST to `admin/config/update/{id}`
- Update button

#### Model: `Config_model`
- Table: `config`
- `get_one()` → single row
- `update($id, $data)` → where id, update, returns affected_rows

---

## 8.12 Doctor Type Master
#### Controller: `admin/Type_master.php`

**Models Loaded**: Doctor_type_model (`type`), Users_model (`user`)

| Method | Logic | View |
|--------|-------|------|
| `index()` | Lists all types | `admin/type_master_add` |
| `add_validate()` | Validates with `type` rule. On fail: flash 'fail', reload. On success: insert, flash 'success', reload. | `admin/type_master_add` |
| `destroy($id)` | POST. Deletes type | redirect |

#### View: `admin/type_master_add.php`
- Add form: Doctor Type (text input) → POST to `admin/type_master/add_validate`
- Flash message alerts (success/fail)
- Table: #, Name (type), Action (delete with confirm)
- Table header says "View Country" — **BUG**: wrong header text

#### Model: `Doctor_type_model`
- Table: `doctor_type_mstr`
- `create($data)` → insert
- `get_all()` → all rows
- `destroy($id)` → delete by id
- `get_by_id()`, `get_active()` — empty stubs

---

## 8.13 Disease Master
#### Controller: `admin/Disease_master.php`

**Models Loaded**: Disease_model (`disease`), Users_model (`user`)

| Method | Logic | View |
|--------|-------|------|
| `index()` | Lists all diseases | `admin/disease_master_add` |
| `add_validate()` | Validates with `disease` rule. Same flash pattern. On fail **BUG**: view set to `admin/Disease_master` (wrong case). | `admin/disease_master_add` |
| `destroy($id)` | POST. Deletes disease | redirect |

#### View: `admin/disease_master_add.php`
- Add form: Disease Type (text input `dis_name`) → POST to `admin/disease_master/add_validate`
- Table: #, Name (dis_name), Action (delete with confirm)
- Table header says "View Country" — **BUG**: copy-paste error

#### Model: `Disease_model`
- Table: `disease_master`
- `create($data)` → insert
- `get_all()` → ordered by id desc
- `destroy($id)` → delete by id
- `get_by_id()`, `get_active()` — empty stubs

---

## 8.14 Localization (Country/State/City)
#### Controller: `admin/Localization.php`

**Models Loaded**: Users_model (`user`), City_model (`city`), State_model (`state`), Country_model (`country`)

| Method | Logic | View |
|--------|-------|------|
| `index()` | Duplicate of Dashboard::index — loads same 4 counts, renders `admin/dashboard` | `admin/dashboard` |
| `user_view()` | Duplicate of Dashboard::user_view | `admin/user_view` |
| `country()` | Shows empty country form | `admin/country_add` |
| `country_add()` | Validates with `contry` rule. Creates country. Redirects to HTTP_REFERER. | redirect |
| `country_view()` | Lists all countries | `admin/country_add` |
| `delete_country($id)` | Deletes country | redirect |
| `state_view()` | Lists countries + states | `admin/state_add` |
| `state_add()` | Validates with `state` rule. Creates state. Redirects to state_view. | redirect |
| `delete_state($id)` | Deletes state | redirect |
| `city_view()` | Lists states + cities | `admin/city_add` |
| `city_add()` | Validates with `city` rule. Creates city. **BUG**: Redirects to `admin/dashboard/city_view` (wrong, should be `admin/localization/city_view`). | redirect |
| `update_status()` | Duplicate of Dashboard::update_status | redirect |
| `update_admin_profile()` | Duplicate of Dashboard::update_admin_profile | `admin/admin_profile_setting` |
| `update_validate()` | Duplicate of Dashboard::update_validate (but doesn't unset email/mobile_no — **inconsistency**) | redirect |
| `upload_profile_img()` | Upload profile image. **BUG**: No empty check on file, always tries to unlink even if upload fails. | redirect |
| `change_password()` | Duplicate of Dashboard::change_password | redirect |
| `valid_current_password()` | Duplicate of Dashboard validator | — |

#### View: `admin/country_add.php`
- Add form: Country Name → POST to `admin/localization/country_add`
- Table: #, Name (country_name), Action (delete)

#### View: `admin/state_add.php`
- Add form: Country (select from all countries), State Name → POST to `admin/localization/state_add`
- Table: #, Country, State, Action (delete)

#### View: `admin/city_add.php`
- Add form: State (select from all states), City Name → POST to `admin/localization/city_add`
- Table: #, State (state_name), City (city_name), Action (delete)

#### Connections
- `Country_model::get_all_country()`, `create_country($data)`, `destroy_country($id)`
- `State_model::get_all_state()`, `create_state($data)`, `destroy_state($id)`, `get_all()`
- `City_model::get_all_city()`, `create_city($data)`, `destroy_city($id)`, `get_city_by_state_name($state_name)`

---

## 8.15 Hospital Inquiry
#### Controller: `admin/Inquiry.php`

**Models Loaded**: Hospital_inquiry_model (`inquiry`)

| Method | Logic | View |
|--------|-------|------|
| `index()` | Lists all inquiries | `admin/hospital_inquiry` |
| `destroy()` | GET `?id=`. Deletes inquiry | redirect |

#### View: `admin/hospital_inquiry.php`
- DataTable: #, Hospital Name, Contact No, Email, Contact Person, Mobile No., Address, Detail, Date, Action (delete with confirm)

#### Model: `Hospital_inquiry_model`
- Table: `hospital_inquiry`
- `create($data)` — auto-sets timestamps
- `getall()` — ordered by id desc
- `destroy($id, $user_id)` — deletes by id (and optionally user_id)
- `update($id, $data)` — updates with auto timestamp

---

## 8.16 Post (Duplicate/Alternative Blog)
#### Controller: `admin/Post.php`

**Models Loaded**: Posts_model (`post`), Users_model (`user`)

| Method | Logic | View |
|--------|-------|------|
| `index()` | Lists all posts | `post/index` (**missing view file**) |
| `hide_unhide($id)` | Toggles PUBLISHED/HIDE. Checks ownership via `get_one_by_user()`. | redirect |
| `create()` | Shows add form | `post/add` (**missing view file**) |
| `store()` | POST. Validates with `blog` rule. Creates post. No image upload. | redirect |
| `delete($id)` | Ownership check, then destroy | redirect |
| `edit($id)` | Loads post for editing | `post/edit` (**missing view file**) |
| `update($id)` | POST. **BUG**: Uses `$this->user_data->id` instead of `$id` for the update where clause. | redirect |

**NOTE**: This controller references `post/index`, `post/add`, `post/edit` views which do NOT exist in the views directory. This entire controller appears to be a dead/unused duplicate of Blog.php.

---

## Shared Models Detail

### Config_model → Table: `config`
- `get_one()` — `SELECT * FROM config` (single row)
- `update($id, $data)` — update by id

### City_model → Table: `city_mstr`
- `create_city($data)` — insert
- `get_all_city()` — raw SQL join with state_mstr, order by id desc
- `destroy_city($id)` — delete by id
- `get_city_by_state_name($state_name)` — 2-step: find state by name, then get cities by state_id

### State_model → Table: `state_mstr`
- `create_state($data)` — insert
- `get_all()` — all states
- `get_all_state()` — raw SQL join with country_mstr, order by id desc
- `destroy_state($id)` — delete by id

### Country_model → Table: `country_mstr`
- `create_country($data)` — insert
- `get_all_country()` — all countries
- `destroy_country($id)` — delete by id
- `get_all()` — **BUG**: Returns all `users` instead of countries
- `update()`, `get_by_id()`, `destroy()` — empty stubs

### Disease_model → Table: `disease_master`
- `create($data)` — insert
- `get_all()` — ordered by id desc
- `destroy($id)` — delete by id
- `get_by_id()`, `get_active()` — empty stubs

### Doctor_type_model → Table: `doctor_type_mstr`
- `create($data)` — insert
- `get_all()` — all types
- `destroy($id)` — delete by id
- `get_by_id()`, `get_active()` — empty stubs

### Slider_model → Table: `slider`
- `create_slider($data)` — insert
- `get_slider()` — ordered by position desc
- `get_slider_active()` — where status=ACTIVE, ordered by position desc
- `update($id, $data)` — update by id
- `update_status_active($id)` — sets to BLOCK (**names swapped**)
- `update_status_block($id)` — sets to ACTIVE (**names swapped**)
- `destroy($id)` — delete by id

### Receptionist_model → Table: `receptionist`
- `create($data)` — insert, returns insert_id
- `update($user_id, $data)` — update where user_id
- `get_by_user_id($user_id)` — single row by user_id
- `get_receptionist_by_doctor($doctor_id)` — single row by doctor_id

### Hospital_inquiry_model → Table: `hospital_inquiry`
- `create($data)` — auto timestamps
- `getall()` — ordered by id desc
- `destroy($id, $user_id)` — conditional delete
- `update($id, $data)` — update with auto timestamp

---

## Database Tables Referenced

| Table | Used By |
|-------|---------|
| `users` | All controllers (central auth/user table) |
| `posts` | Blog, Post, Dashboard |
| `booking` | Appointment, Report |
| `config` | Config |
| `doctor_type_mstr` | Type_master, Doctor |
| `disease_master` | Disease_master, Doctor |
| `slider` | Slider |
| `receptionist` | Receptionist, Doctor, Assistant |
| `hospital_inquiry` | Inquiry |
| `country_mstr` | Localization, Country_model |
| `state_mstr` | Localization, State_model |
| `city_mstr` | Localization, City_model |
| `doctors` | Doctor (profile data) |
| `hospital` (profiles) | Hospital |
| `doctor_assistants` | Assistant |
| `doctor_ratings` | Doctor (rating) |

---

## Critical Bugs Summary

| # | Severity | Location | Description |
|---|----------|----------|-------------|
| 1 | **CRITICAL** | `Admin_contoller::__construct()` | Admin blocked-user check result is ignored; blocked admin can still access panel |
| 2 | **CRITICAL** | `admin/Hospital.php::resetpass()` | Hardcoded password '123456' — accessible via URL, no auth confirmation |
| 3 | **CRITICAL** | `admin/Patient.php::resetpass()` | Same hardcoded password issue |
| 4 | **HIGH** | `admin/Doctor.php::distroy()` | No null check before deleting user; calls distroy_profile result ignored |
| 5 | **HIGH** | `admin/Doctor.php::edit()` | No null check on $rec_data before using ->user_id |
| 6 | **HIGH** | `admin/Assistant.php` | Uses `$this->user` (not loaded — alias is `users`) — will crash on profile_view and edit_validate |
| 7 | **HIGH** | `admin/Receptionist.php::edit_validate()` | Password shown as hash in editable field; role is changeable |
| 8 | **HIGH** | `admin/Doctor.php::edit_validate()` | Password shown as hash in readonly but visible HTML |
| 9 | **HIGH** | `admin/Post.php` | All views (post/index, post/add, post/edit) are missing — entire controller is dead |
| 10 | **HIGH** | `admin/Report.php::view_income_hospital()` | `$doc->total = $income` is always truthy; crashes if $income is empty |
| 11 | **MEDIUM** | `Slider_model` | `update_status_active()` sets BLOCK, `update_status_block()` sets ACTIVE — names swapped |
| 12 | **MEDIUM** | `Country_model::get_all()` | Returns `users` table instead of `country_mstr` |
| 13 | **MEDIUM** | `admin/Appointment.php` | extend/approve/visited redirect to `doctor/appointment` instead of `admin/appointment` |
| 14 | **MEDIUM** | `admin/Localization.php` | Duplicates most Dashboard methods with inconsistencies; city_add redirects to wrong URL |
| 15 | **MEDIUM** | `admin/Localization.php::upload_profile_img()` | No empty file check before unlink — crashes if no file uploaded |
| 16 | **MEDIUM** | `admin/site_statestics.php` | 8 of 12 info boxes have hardcoded fake data |
| 17 | **MEDIUM** | `admin/profile_view_hospital.php` | Gallery shows same image 3x; HTML is truncated (missing closing divs) |
| 18 | **MEDIUM** | `admin/report_income.php` | To Date input pre-fills with From Date value |
| 19 | **MEDIUM** | `admin/report_income_hospital.php` JS | DataTable footer total references wrong column index (4 instead of 5) |
| 20 | **LOW** | `admin/doctor_view.php` JS | SweetAlert references undefined `person.fullName()` |
| 21 | **LOW** | `admin/Dashboard.php::valid_current_password()` | Missing closing parenthesis in `if` condition — syntax error |
| 22 | **LOW** | `master_page_admin.php` | Missing `});` for second Morris.Bar chart (doctor income) |
| 23 | **LOW** | Type/Disease master views | Table header says "View Country" — copy-paste error |
| 24 | **LOW** | `admin/Slider.php::distroy()` | Calls non-existent `_alertWarningResponce` (typo) in fallback |
| 25 | **LOW** | `admin/Blog.php::update_validate()` | Always sets status=PUBLISHED on update (overwrites any Draft status) |
| 26 | **LOW** | Password hashing | Uses SHA256 (weak) instead of bcrypt/password_hash |

---

## Feature Inventory

- Dashboard with real-time counts
- Full CRUD for Hospitals (including detail/profile)
- Doctor listing, profile view, edit (user + profile separately)
- Patient listing and edit (limited — no add, no delete)
- Receptionist listing and edit (limited)
- Assistant listing, profile view, edit (limited)
- Appointment management (view, status changes)
- Blog/Post management (add, edit, delete, status toggle, SEO permalinks)
- Slider management (add, delete, status toggle)
- Hospital Inquiry (view, delete only)
- Localization (Country/State/City CRUD)
- Master data (Doctor Types, Disease Types)
- Admin Charges configuration
- Reports: User, Doctor, Hospital, Patient, Appointment, Income, Hospital-wise Income, Charts
- Site Statistics
- Admin Profile settings (name, gender, mobile, profile image, password change)
- User status management (Active/Block toggle)
- DataTables with export (CSV, Excel, PDF, Print)
- CKEditor for rich text
- Morris.js bar charts for income visualization
- PNotify for flash notifications
- SweetAlert for confirmations (partially implemented)
- Google Analytics tracking
- Disqus comments on blog posts
- AddToAny social sharing
