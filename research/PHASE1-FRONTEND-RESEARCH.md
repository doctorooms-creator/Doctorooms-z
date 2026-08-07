# Phase 1: Frontend (Public-Facing) Module — Complete Research Document

> Source: `/tmp/Doctorooms/` (PHP/CodeIgniter)
> Date: Research completed for Next.js migration

---

## Architecture Overview

- **Base Controller**: Public pages extend `Guest_controller` (no auth required). Patient-only pages extend `Patient_contoller` (requires login, role=PATIENT).
- **Layout**: All front-end pages use `layouts/master_page_front.php` (except login, register, forgot-password, OTP views which are standalone full HTML pages).
- **Session**: `$this->user_data` = logged-in user object; `$this->user` = same, passed to views; `$this->notification` = Notifications_model loaded in MY_Controller.
- **Constants**: `PENDING`, `APPROVE`, `REJECTED`, `EXTEND`, `VISITED`, `ACTIVE`, `BLOCK`, `DOCTOR`, `PATIENT`, `HOSPITAL`, `RECEPTIONIST`, `ADMIN`, `BLOG`, `PUBLISHED`, `HIDE`, `READ`, `UNREAD`, `BY_SELF`, `SITE_TITLE`, `DOCTOR_ASSISTANT` — all defined in `config/constants.php`.

---

## LAYOUT: `views/layouts/master_page_front.php`

### Header
- **Logo**: `<img>` from `assets/brand/LOGO-CIRCLE.png`, links to `base_url()`, 8rem × 4rem
- **Search Bar**: `<form method="GET" action="search">` with `<input name="q" class="form-control header-search" placeholder="Search…">`
- **Notification Bell** (only if logged in as DOCTOR/RECEPTIONIST/PATIENT):
  - Links to role-specific notification page
  - Shows `nav-unread` dot if `$notificationsCount > 0`
  - Dropdown shows latest notifications + "Read All" link
- **User Dropdown** (if logged in):
  - Shows avatar (`upload/profile/{profile_img}`), name, role badge
  - Menu items vary by role:
    - **ADMIN**: Dashboard, Profile → `admin/dashboard`, `admin/dashboard/update_admin_profile`
    - **HOSPITAL**: Dashboard, Profile → `hospital/dashboard`, `hospital/profile/update_profile`
    - **DOCTOR**: Dashboard, Profile → `doctor/dashboard`, `doctor/profile`
    - **PATIENT**: My Appointment (`appointment`), My Blog (`post`), Profile (`profile`)
    - **RECEPTIONIST**: Dashboard, Profile → `receptionist/dashboard`, `receptionist/profile`
    - **All**: Sign out → `auth/logout`

### Navigation Bar (collapsible, `#headerMenuCollapse`)
- Home → `home`
- Blog → `blog`
- Find Doctor → `doctors`
- Find Hospital → `hospitals`
- About Us → `about`
- Contact Us → `contactus`
- Register → `auth/register_for` (only if NOT logged in)
- Login → `auth/login` (only if NOT logged in)

### Footer
- Links: About us, Contact Us, Terms & Conditions, Privacy Policy, Hospital Inquiry
- Social icons: Facebook, Twitter, Phone, Skype (all `javascript:void(0)` — placeholder)
- Copyright: "© 2018 Bracesoft Solution"

### CSS/JS Loaded
- `sweetalert.min.js` (CDN unpkg) — for confirm dialogs
- `ckeditor.js` v4.11.1 standard (CDN) — rich text editor
- `bootstrap-datepicker3.standalone.min.css`
- `dashboard.css`, `dashboard.js` (core Tabler UI framework)
- `datatables.net`, `datatables` (DataTables for `.dttable` class)
- `datepicker` module (require.js)
- `charts-c3` plugin (c3.js D3 charts)
- `maps-google` plugin
- `input-mask` plugin
- `font-awesome/4.7.0` (CDN)
- Google Analytics: `UA-171698773-1`

### Global JS Functions
- `conformDel(aa, event)` — SweetAlert confirm before delete
- `conformCancel(aa, event)` — SweetAlert confirm before cancel
- `.dttable` auto-initialized as DataTable
- Star rating CSS (`.rating` with radio inputs)
- Chat UI CSS (`.chat li.left`, `.chat li.right`)

### Custom CSS
- Star rating system (pure CSS, no JS library)
- `.avatar-thumb` — 4rem × 3rem thumbnail
- `.disabled-date.day` — red background for disabled datepicker dates
- Print media: `#pos { display:none; }`

---

## 1.1 Homepage

### Controller: `Home.php`
- **Class**: `Home extends Guest_controller`
- **Models loaded**: `Posts_model` (as `$this->post`), `Slider_model` (as `$this->slider`), `Doctors_model` (as `$this->doctor`), `Hospital_model` (as `$this->hospital`)
- **Method**: `index()` — GET
  - Queries:
    - `$this->post->get_latest_post(4)` → 4 latest published blog posts
    - `$this->slider->get_slider_active()` → all active sliders
    - `$this->doctor->get_active_users(8)` → 8 active doctors (no hospital, active status, doctor role)
    - `$this->hospital->get_active_hospitals(8)` → 8 active hospitals
  - Data passed: `$posts`, `$slide`, `$doc`, `$hospitals`
  - View: `front/home` in `layouts/master_page_front`

### Model: `Slider_model`
- `get_slider_active()`: `SELECT * FROM slider WHERE status=ACTIVE ORDER BY position DESC`
  - Returns: array of objects with `slider_image`, `position`, `status`

### Model: `Doctors_model`
- `get_active_users($limit=8, $start=0)`: `SELECT doctors.doctor_type, doctors.city, doctors.state, users.* FROM doctors, users WHERE doctors.user_id=users.id AND doctors.hospital_id IS NULL AND users.status=ACTIVE AND users.role=DOCTOR LIMIT 8`
  - Returns: array of objects (id, name, profile_img, doctor_type, city, state, etc.)

### Model: `Hospital_model`
- `get_active_hospitals($limit=8, $start=0)`: `SELECT hospital.hospital_name, hospital.address, hospital.state, hospital.city, hospital.contact_no, hospital.gallary, hospital.lat, hospital.longi, users.* FROM hospital, users WHERE hospital.user_id=users.id AND users.status=ACTIVE AND users.role=HOSPITAL LIMIT 8`
  - Returns: array of objects

### Model: `Posts_model`
- `get_latest_post($limit=4)`: `SELECT p.*, users.email, users.name, users.profile_img FROM posts AS p, users WHERE users.id=p.user_id AND p.status=PUBLISHED AND p.type=BLOG ORDER BY id DESC LIMIT 4`
  - Returns: array with title, content, blog_img, paramalink, name, profile_img, created_at

### View: `front/home.php`
- **Image Carousel**: Bootstrap 4 carousel (`#carousel-captions`) with prev/next arrows
  - Images: `upload/slider/{slider_image}`
  - First item has class `active`
- **Doctors Section**: "Doctors" heading + "VIEW ALL" button (→ `doctors`)
  - Grid: `row row-cards row-deck`, 4 per row (`col-sm-6 col-xl-3`)
  - Card: `card card-profile` with background image (`assets/images/doctor_backgraound.jpeg`)
  - Each card: profile image (`upload/profile/{profile_img}`), "Dr. {name}", "{doctor_type} | {city}, {state}", Profile button → `doctors/view/{id}`
  - Empty state: "Oops! No data"
- **Hospitals Section**: Same card layout, background `hospital_background.jpg`
  - Shows: hospital_name, city, Profile button → `hospitals/view/{id}`
- **Recent Blog Section**: Same 4-column grid
  - Blog card: image (`upload/blog/{blog_img}` or `assets/images/no_img.png`), title (→ `blog/view/{paramalink}`), content excerpt (200 chars), author avatar + name + date, Read link
  - Empty state: "Oops! No data"

### Connections
- Tables: `slider`, `users`, `doctors`, `hospital`, `posts`

---

## 1.2 Doctor Listing

### Controller: `Doctors.php`
- **Class**: `Doctors extends Guest_controller`
- **Models**: `Doctors_model` (doctor), `Hospital_model` (hospital), `Doctor_rating_model` (doctor_rating)
- **Method**: `index($page=0)` — GET
  - Gets all active doctors (no limit) for count
  - Pagination: base_url `doctors/index/`, per_page=12, Bootstrap 4 styled (`<li>` tags, `page-link` class)
  - Gets paginated doctors: `get_active_users(12, $page)`
  - Data: `$doctors`, `$links`, `_title="Doctors"`
  - View: `front/doctor/index`

- **Method**: `view($id)` — GET
  - Gets single active doctor by user ID
  - If not found → redirect `doctors`
  - Gets: `doctor_total_rate_user` (count of ratings), `doctor_average_rating` (avg)
  - If logged in (`$this->user_data`): gets `my_rating` (patient's existing rating)
  - Gets hospital info via `$this->hospital->get_one_by_user($doctor->hospital_id)`
  - Data: `$doctor`, `$doctor_total_rate_user`, `$doctor_average_rating`, `$my_rating`, `$hospital`
  - View: `front/doctor/profile`

### View: `front/doctor/index.php`
- Page title: "Doctors"
- Grid: `col-sm-6 col-xl-3` (4 per row)
- Same card layout as homepage doctor cards but WITHOUT city/state
- Pagination: `<ul class="pagination">{{links}}</ul>`
- Empty state: "Oops! No data"

### Connections
- Tables: `users`, `doctors`

---

## 1.3 Doctor Profile

### View: `front/doctor/profile.php`
- **Layout**: 2-column (col-lg-4 sidebar + col-lg-8 main)
- **Left Sidebar**:
  - Doctor card: avatar (avatar-xxl), name ("Dr. {name}"), doctor_type, star rating (X/5), total raters
  - **Rating Widget** (only if logged in AND role==PATIENT):
    - 5 radio inputs (star1-5), value 1-5
    - Pre-checks existing rating
    - CSS-only star rating system
  - Google Maps iframe: `https://maps.google.com/maps?q={lat},{longi}&hl=es;z=13&output=embed` (200px height)
    - If hospital exists: uses hospital lat/longi; else uses doctor's lat/longi
  - Hospital info (if exists): hospital_name (link → `hospitals/view/{hospital_id}`), address, city, state
  - Info grid: Fees (Rs. X), Emergency charge (Rs. X or "-"), Email, Phone, Description
- **Right Column**:
  - Card with "Appoint Now" button → `book/doctor/{doctor.id}`
  - List group items:
    1. Overview & Description — `$doctor->description`
    2. Specialization — `json_decode($doctor->specialization)` → tags (`tag-gray`)
    3. Award & Recognition — `$doctor->award_and_recognition`
    4. Education — `$doctor->eduction` (sic — typo in DB column)
    5. Registration Detail — `$doctor->registration_detail`
    6. Gallery — `json_decode($doctor->photos)` → thumbnails (150px, link opens full in new tab, from `upload/gallery/`)
- **JavaScript**:
  - On rating radio click: `$.post('api/rate_us', {patient, doctor, star})` → SweetAlert success/error

### Connections
- Tables: `users`, `doctors`, `hospital`, `doctor_rating`
- API: `api/rate_us` (POST, params: patient, doctor, star)

---

## 1.4 Doctor Search

### Controller: `Search.php`
- **Class**: `Search extends Guest_controller`
- **Models**: `Doctors_model` (doctor), `Hospital_model` (hospital), `City_model` (city), `Doctor_type_model` (type)
- **Method**: `index()` — GET
  - Params: `q` (query string, required — redirects to home if missing), `city`, `type`
  - Queries:
    - `$this->doctor->get_search_users($q, $city, $type)` — searches doctors
    - `$this->hospital->get_search_hospital($q, $city)` — searches hospitals
    - `$this->city->get_all_city()` — all cities for filter dropdown
    - `$this->type->get_all()` — all doctor types for filter dropdown
  - Data: `$doctors`, `$hospitals`, `$city`, `$type`, `_title={q} - Search`
  - View: `front/doctor/search`

### Model: `Doctors_model`
- `get_search_users($keyword, $city, $doctor_type)`: Searches `users.name`, `doctors.state`, `doctors.specialization`, `doctors.eduction`, `doctors.experience` with LIKE `%keyword%`. Optional filters: city, doctor_type. Only active doctors with `hospital_id IS NULL`.
  - Returns: array of matching doctors

### Model: `Hospital_model`
- `get_search_hospital($keyword, $city)`: Searches `hospital.hospital_name`, `hospital.state` with LIKE. Optional city filter. Only active hospitals.
  - Returns: array of matching hospitals

### View: `front/doctor/search.php`
- Page title: "Search Results for: {q}"
- **Filter form** (GET, inline):
  - Hidden input: `name="q" value={q}`
  - City dropdown: `name="city"` — all cities from DB with state_name suffix
  - Doctor type dropdown: `name="type"` — all types from DB
  - Filter button with icon
- **Results**: Two sections — Doctors and Hospitals (same card layouts as listing pages)
- Empty state: "Oops! did not match any result."

### Connections
- Tables: `users`, `doctors`, `hospital`, `city` (assumed), `doctor_type` (assumed)

---

## 1.5 Hospital Listing

### Controller: `Hospitals.php`
- **Class**: `Hospitals extends Guest_controller`
- **Models**: `Doctors_model` (doctor), `Hospital_model` (hospital), `Schedule_pdf_model` (schedule)
- **Method**: `index($page=0)` — GET
  - Pagination: per_page=12, same config as doctors
  - Data: `$hospitals`, `$links`, `_title="Hospitals"`
  - View: `front/hospital/index`

### View: `front/hospital/index.php`
- Same card grid as doctor listing (col-xl-3, 4 per row)
- Shows: hospital profile_img, hospital_name, city, Profile button
- Pagination links
- Empty state

### Connections
- Tables: `users`, `hospital`

---

## 1.6 Hospital Profile

### Controller: `Hospitals.php`
- **Method**: `view($id)` — GET
  - Gets hospital by user ID; if not found → redirect `doctors` (note: bug — should redirect to `hospitals`)
  - Gets: `$this->doctor->get_hospital_doctors($id)` — doctors belonging to this hospital
  - Gets: `$this->schedule->get_last_by_hospital($id)` — latest schedule PDF
  - Data: `$doctors`, `$schedule`, `$hospital`
  - View: `front/hospital/profile`

### View: `front/hospital/profile.php`
- **2-column layout** (col-lg-4 + col-lg-8)
- **Left sidebar**:
  - Hospital avatar + name + city/state
  - Google Maps (using hospital lat/longi)
  - Hospital details: hospital_name, address, city, state, email, phone
- **Right column**:
  - **Doctors list**: Grid of doctor cards (col-sm-4, 3 per row) with profile images, "Dr. {name}", doctor_type, Profile button
  - If schedule exists: "Get Doctor Schedule" download button (→ `upload/schedule_docs/{file_name}`)
  - **Gallery**: `json_decode($hospital->gallary)` → thumbnail images (150px) from `upload/gallery/`
  - Empty gallery: "No images"

### Connections
- Tables: `users`, `hospital`, `doctors`, `schedule_docs` (assumed)

---

## 1.7 Blog Listing

### Controller: `Blog.php`
- **Class**: `Blog extends Guest_controller`
- **Model**: `Posts_model` (post)
- **Method**: `index($page=0)` — GET
  - Pagination: per_page=9
  - Gets: `get_all_front(9, $page)` — published blog posts
  - Gets: `get_latest_post(5)` — sidebar latest posts
  - Data: `$posts`, `$links`, `$latest_post`
  - View: `front/blog`

- **Method**: `view($paramalink)` — GET
  - Gets: `get_single_post($paramalink)` — single post by permalink
  - Gets: `get_latest_post(5)` — sidebar
  - Data: `$single_blog`, `$latest_post`, `_title={paramalink}`
  - View: `front/blog-details`

### Model: `Posts_model`
- `get_all_front($limit, $start)`: `SELECT p.*, users.email, users.name, users.profile_img FROM posts AS p, users WHERE users.id=p.user_id AND p.status=PUBLISHED AND p.type=BLOG ORDER BY id DESC LIMIT {limit} OFFSET {start}`
  - Returns: array
- `get_single_post($paramalink)`: Same join + `WHERE p.paramalink=$paramalink`
  - Returns: single row
- `get_latest_post($limit)`: Same as get_all_front but just with limit

### View: `front/blog.php`
- **2-column layout** (col-lg-8 main + col-md-4 sidebar)
- **Main**: Blog cards in `col-md-4` (3 per row)
  - Image (150px height), title (link), content excerpt (100 chars), author avatar + name + date, Read More button
  - Pagination links
- **Sidebar**: "Read more" → table of latest 5 posts with thumbnail, title (32 chars), content excerpt (35 chars)

### View: `front/blog-details.php`
- **2-column layout** (col-md-8 + col-md-4)
- **Main article**:
  - Title (h1)
  - Blog image (full width, from `upload/blog/`)
  - Video iframe (if `video_link` exists)
  - Content (raw HTML)
  - Share buttons: AddToAny (Facebook, Twitter, Google Plus, WhatsApp, Copy Link)
  - Footer: date, author name
  - Disqus comments: `https://https-doctorooms-com.disqus.com/embed.js`
- **Sidebar**: Same latest posts table

### Connections
- Tables: `posts`, `users`
- External: Disqus, AddToAny

---

## 1.8 Appointment Booking

### Controller: `Book.php`
- **Class**: `Book extends Patient_contoller` (requires login, role=PATIENT)
- **Models loaded**: Booking_model, Doctors_model, Doctor_holiday_schedule_model, Hospital_model, State_model, City_model, Config_model, Doctor_rating_model, Notifications_model, Receptionist_model

- **Method**: `doctor($id)` — GET
  - Validates doctor exists (active)
  - Gets: doctor_total_rate_user, doctor_average_rating, all states, hospital info
  - Gets holiday dates: `$this->holiday_schedule->get_next_holidays($doctor->user_id)` → JSON array for datepicker
  - Data: `$doctor_total_rate_user`, `$doctor_average_rating`, `$state`, `$hospital`, `$doctor`, `$getHolidays`
  - View: `front/doctor/book`

- **Method**: `doctor_book($id)` — POST
  - Validates doctor exists
  - Runs form validation rule: `booking_by_patient`
  - Checks daily limit: `$doctor->daily_limit` vs `$this->book->get_booking_count_by_date_by_doctor($id, $data['booking_date'])`
    - If limit reached: `_alertSuccessResponce(1, "limit over message", "not created", "book/doctor/$id")`
  - Creates booking with:
    - `doctor_id` = $id
    - `user_id` = current user
    - `status` = PENDING
    - `appointment_charge` = from config (`config_model->get_one()->admin_charge`)
    - `booking_type` = BY_SELF
    - `appointment_no` = auto-generated (APMT-{increment})
  - Sends notification to doctor + receptionist (if exists)
  - Sends SMS to patient: `sendMobileMessage(mobile_no, message)`
  - On success: redirect to `appointment`
  - On validation fail: re-loads book form with errors

- **Method**: `generateBookingNumber()` — Internal
  - Gets latest booking record, increments APMT-{N}
  - If no records: APMT-1

- **Method**: `city_by_state()` — POST (AJAX)
  - Params: `state_name`
  - Returns: JSON array of cities for given state

- **Method**: `date_booked()` — POST (AJAX)
  - Params: `doctor`, `date`
  - Returns: `json_encode(["booked" => count])`

### View: `front/doctor/book.php`
- **Custom CSS**: `.disabled-date.day` — red background
- **Flash message**: Shows `$this->session->flashdata('feedback')` if exists
- **2-column** (col-lg-4 sidebar + col-lg-8 form)
- **Left sidebar**:
  - Doctor card: avatar, name, type, rating, hospital map, hospital name/address, fees, time, email, phone, description
- **Booking Form** (`form_open("book/doctor_book/{doctor.user_id})`):
  - **Form Fields**:
    | Field | Type | Name | Validation | Notes |
    |-------|------|------|------------|-------|
    | Patient Name | text | `petient_name` | required | |
    | Appointment Date | text (datepicker) | `booking_date` | required | `onkeydown="return false"`, autocomplete off |
    | Physical Handicap | select | `physical_handicape` | optional | No/Yes |
    | Symptoms | text | `disease` | optional | |
    | State | select | `state` | optional | Populated from `$state` array |
    | City | select | `city` | optional | AJAX populated on state change |
    | Gender | select | `gender` | optional | Male/Female/Other |
    | Blood Group | select | `blood_group` | optional | O+/-, A+/-, B+/-, AB+/- |
    | Date Of Birth | date | `date_of_birth` | optional | readonly, triggers age calculation |
    | Age | text | `age` | optional | Auto-calculated from DOB |
    | Height (cm) | text | `height` | optional | |
    | Weight (KG) | text | `weight` | optional | |
    | Relation With Me | text | `relation_with_me` | optional | |
    | Description | textarea | `description` | optional | 5 rows |
  - **Submit**: "Appoint" button, disables after click (`onclick="this.form.submit();this.disabled=true;"`)
- **JavaScript** (require.js):
  1. **State → City AJAX**: `$.post('book/city_by_state', {state_name}, ...)` → populates city dropdown
  2. **DOB → Age**: Calculates age in years from date_of_birth
  3. **Datepicker**: Bootstrap datepicker on `#booking_date`
     - Format: `yyyy-mm-dd`
     - Disabled dates: holiday dates from PHP (red)
     - Start date: today
     - End date: today + `doctor.booking_days`
     - On date change: checks `book/date_booked` → if daily limit reached, disables that date dynamically

### Connections
- Tables: `users`, `doctors`, `hospital`, `booking`, `doctor_holiday_schedule`, `states`, `cities`, `config`, `notifications`, `receptionist`
- External: SMS gateway (via `sendMobileMessage`)

---

## 1.9 Patient Appointment History

### Controller: `Appointment.php`
- **Class**: `Appointment extends Patient_contoller`
- **Models**: Booking_model, Notifications_model, Receptionist_model, Booking_chat_model, Prescriptions_model, Ajaxprescription_model, P_Co_model, P_Label_model, P_digno_model, P_medicine_model, P_Suggestion_model, P_other_setting_model, Doctors_model, Users_model

- **Method**: `index()` — GET
  - Params: `from` (date), `to` (date), `status` (default: PENDING)
  - Query: `get_patient_appointment(user_id, from, to, status)`
  - Data: `$appointments`
  - View: `front/patient/my-appointment`

- **Method**: `show($id)` — GET
  - Gets single appointment by ID + user_id (ownership check)
  - If null → redirect `appointment`
  - Gets prescription data, chat availability, appointment position
  - Data: `$prescription`, `$isCheckBoxEnable`, `$appointment_position`, `$appointment`
  - View: `front/patient/my-appointment-show`

- **Method**: `cancel($id)` — GET
  - Ownership check + status must be PENDING
  - Sends notification to doctor + receptionist about cancellation
  - Updates status to REJECTED via `$this->book->update($id, ['status' => REJECTED])`
  - Redirect: `appointment`

- **Method**: `get_all_chat_message()` — POST (AJAX)
  - Params: `appointid`
  - Returns: JSON of all chat messages for appointment

- **Method**: `send_chat_msg()` — POST (AJAX)
  - Params: `appointId`, `msg`
  - Sends to receptionist (if exists) — NOT to doctor directly
  - Creates chat with status=UNREAD
  - Returns: `{status: true/false, msg: "..."}`

- **Method**: `print_prescription($appointment_id)` — GET
  - Full prescription data loading (for print view)
  - View: `doctor/AjaxPrescription/print_prescription` (shared with doctor module)

### Model: `Booking_model`
- `get_patient_appointment($user_id, $from, $to, $status)`: `SELECT booking.*, users.name, users.email, users.profile_img, users.mobile_no FROM booking, users WHERE booking.doctor_id=users.id AND booking.user_id=$user_id [AND status=$status] [AND date filters] ORDER BY created_at DESC`
- `get_patient_appointment_one($id, $user_id)`: Same join + `WHERE booking.id=$id AND booking.user_id=$user_id`
- `get_today_appointment_position($doctor_id)`: Today's APPROVED appointments ordered by created_at ASC
- `get_booking_count_by_date_by_doctor($doctor_id, $date)`: COUNT of bookings for doctor on date
- `get_by_id($id)`: Single booking row
- `get_latest_record()`: Latest booking by created_at DESC

### View: `front/patient/my-appointment.php`
- **Filter bar** (form inline):
  - From date, To date (date inputs)
  - Status dropdown: Pending, Extend, Approve, Rejected, Visited, All
  - Filter button
- **DataTable** (class `dttable`):
  - Columns: Avatar, Appointment ID (link → `appointment/show/{id}`), Doctor (name, booked at, booking on), Patient Name, Disease, Status (color-coded tags), Actions
  - Status colors: Pending=tag-warning, Approve=tag-primary, Extend=tag-info, Visited=tag-green, Rejected=tag-danger
  - Actions: Dropdown with "Cancel" (only if PENDING or EXTEND) → `appointment/cancel/{id}` with `conformCancel()` confirm

### View: `front/patient/my-appointment-show.php`
- **Appointment Detail Table**: appointment_no, booking_type, booking_date, petient_name, disease, physical_handicape, date_of_birth, age, gender, relation_with_me, height, weight, book_date, status, description
- **Print button**: → `Appointment/print_prescription/{id}`
- **My Position** (if `$appointment_position`):
  - DataTable showing today's approved appointments with position number
  - Current appointment row highlighted (`table-warning`)
- **Chat** (if `$isCheckBoxEnable` AND status != VISITED/REJECTED):
  - Chat box (400px height, scrollable)
  - Input + Send button
  - **JS**: Loads chat every 5 seconds via `$.post('appointment/get_all_chat_message')`
  - Send: `$.post('appointment/send_chat_msg', {appointId, msg})`
  - Chat bubbles: left (other) and right (self) with avatar placeholders
- **Prescription** (if exists and has medicine_details):
  - Disease description
  - Medicine list (JSON decoded): medicine_name, description, tab
  - Remark
  - Print button

### Connections
- Tables: `booking`, `users`, `prescription`, `booking_chat`, `receptionist`, `p_co`, `p_labels`, `p_medicine`, `p_suggestions`, `p_digno_table`, `p_other_settings`, `notifications`

---

## 1.10 Contact Us

### Controller: `Contactus.php`
- **Class**: `Contactus extends Guest_controller`
- **Method**: `index()` — GET: loads `front/contact-us`
- **Method**: `send()` — POST
  - Validation: `contact_us` rule group
  - NOTE: Email sending is **commented out** (`$this->send_mail` is commented)
  - Success: redirect `contactus` with flash message
  - Fail: reload form

### View: `front/contact-us.php`
- **2-column**: col-md-4 (office info) + col-md-8 (form)
- **Office info card** (HARDCODED, not dynamic):
  - Name: "Axa Global Group"
  - Address: "1290 Avenua of The Americas, New York, NY 101040105"
  - Business Type: "Insurance Company"
  - Website: "http://www.axa.com"
  - Phone: "+123456789"
  - Description: Lorem ipsum
- **Contact Form** (`form_open("contactus/send")`):
  - Fields: name (text, required), email (email, required), subject (text, required), message (textarea, required)
  - Submit: "Send" button
- Flash message support

### Connections
- Tables: None (email is commented out)

---

## 1.11 Hospital Inquiry

### Controller: `Inquiry.php`
- **Class**: `Inquiry extends Guest_controller`
- **Model**: `Hospital_inquiry_model` (inquiry)
- **Method**: `index()` — GET: loads `front/inquiry`
- **Method**: `send()` — POST
  - Validation: `hospital_inquiry` rule group
  - Creates inquiry via `$this->inquiry->create($data)`
  - Success/error redirect to `inquiry`

### Model: `Hospital_inquiry_model`
- `create($data)`: Inserts into `hospital_inquiry` with created_at, updated_at. Returns insert_id.

### View: `front/inquiry.php`
- **Form** (`form_open("inquiry/send")`):
  - Fields:
    | Field | Type | Name | Required |
    |-------|------|------|----------|
    | Hospital Name | text | `hospital_name` | Yes |
    | Hospital Contact | text | `hospital_cotanct_no` | Yes (note typo: cotanct) |
    | Email | email | `email` | Yes |
    | Contact Person Name | text | `contact_person_name` | Yes |
    | Contact Person Mobile | text | `contact_person_mobile` | Yes |
    | Address | text | `address` | Yes |
    | City | text | `city` | Yes |
    | State | text | `state` | Yes |
    | Description | textarea | `description` | No |
  - Submit: "Submit" button

### Connections
- Tables: `hospital_inquiry`

---

## 1.12 Static Pages

### Controller: `About.php` — `index()` → `front/about`
- Static lorem ipsum content in card

### Controller: `Privacy.php` — `index()` → `front/privacy`
- Full Privacy Policy text (hardcoded HTML):
  - Sections: Overview, Collection of Information, Use and Sharing, Cookies, Links, Legal Requests, User Competency, Security, Changes, Grievance Officer (Aditya Joshi, +91 9106096745, ksv1619aditya@gmail.com)

### Controller: `Terms.php` — `index()` → `front/terms-condition`
- Full Terms & Conditions (hardcoded HTML):
  - Sections: User Eligibility (1.1 Service Provider, 1.2 Service Recipient), Amendments, Account Obligations, Electronic Communications, Fees and Services (5.1 Taxes, 5.2 Non-payment), Use of Website, Platform for Communication (7.1-7.7), Privacy, Consent, Breach (10.1-10.5), Limitation of Liability (11.1-11.2), Indemnity, General, Arbitration (Palanpur), Governing Law (India)

### Connections
- Tables: None

---

## 1.13 Patient Profile

### Controller: `Profile.php`
- **Class**: `Profile extends Patient_contoller`
- **Model**: `User_model` (user)

- **Method**: `index()` — GET
  - Gets: `$this->user->get_by_id($this->user_data->id)`
  - Data: `$profile`
  - View: `front/profile/show`

- **Method**: `upload_profile_img()` — POST (multipart)
  - Uploads to `upload/profile/` with naming: `{Y-m-d}_{user_id}`
  - Deletes old image (if not `default.png`)
  - Updates `profile_img` in users table
  - Redirect: `profile`

- **Method**: `update_profile_basic()` — POST
  - Validation: `patient_profile` rule group
  - Updates: `name`, `gender` only (email and mobile are disabled/not updated)
  - Redirect: `profile`

- **Method**: `chnage_password()` — POST (note: typo `chnage`)
  - Validation: `change_password` rule group
  - Custom validator: `valid_current_password($str)` — checks SHA256 hash
  - Updates: `password` = `hash("sha256", $new_pass)`
  - Redirect: `profile`

### Model: `Users_model`
- `get_by_id($id)`: `SELECT * FROM users WHERE id=$id` → single row
- `update($id, $data)`: Updates users table, returns affected_rows boolean
- `checkCurrentPassword($id, $str)`: SHA256 hash comparison

### View: `front/profile/show.php`
- **2-column** (col-lg-4 + col-sm-8)
- **Left**: Profile card with avatar, name, file upload form (`form_open_multipart('profile/upload_profile_img')`), Upload button
- **Right top**: Update Profile form (`form_open('profile/update_profile_basic')`)
  - Fields: Name (text, editable), Email (text, **disabled**), Gender (select: Male/Female/Other), Mobile (text, **disabled**, maxlength=10)
  - Update button
- **Right bottom**: Change Password form (`form_open('profile/chnage_password')`)
  - Fields: Old Password, New Password, Confirm Password (all password type)
  - Change button
- Flash message support

### Connections
- Tables: `users`
- File uploads: `upload/profile/`

---

## 1.14 Patient Notifications

### Controller: `Notifications.php`
- **Class**: `Notifications extends Patient_contoller`
- **Method**: `index()` — GET
  - Gets: `$this->notification->get_all_by_user($this->user_data->id, 100)` — last 100 notifications
  - **After loading view**: marks all as READ: `$this->notification->update($this->user_data->id, ["status" => READ])`
  - Data: `$all_notifications`
  - View: `front/patient/notifications`

### View: `front/patient/notifications.php`
- Table (not DataTable): columns — bell icon, title+body, datetime
- Unread rows: class `table-warning`
- Empty state: Large bell icon + "You have no notifications"

### Connections
- Tables: `notifications`

---

## 1.15 Patient Posts/Blog

### Controller: `Post.php`
- **Class**: `Post extends Patient_contoller`
- **Model**: `Posts_model` (post)

- **Method**: `index()` — GET
  - Gets: `$this->post->get_all_by_user($this->user_data->id)`
  - View: `front/post/index`

- **Method**: `create()` — GET: loads `front/post/add`

- **Method**: `store()` — POST
  - Validation: `blog` rule group
  - Image upload: optional, to `upload/blog/{Y-m-d}`
  - Data: title, content, status=PUBLISHED, type=BLOG, paramalink (SEO URL, recursive uniqueness check), user_id, blog_img
  - Removes `_wysihtml5_mode` from POST data
  - Redirect: `post`

- **Method**: `edit($id)` — GET
  - Ownership check: `get_one_by_user($id, user_id)` → null redirects to `users/blog`
  - View: `front/post/edit`

- **Method**: `update($id)` — POST
  - Same as store but updates. Deletes old image if new uploaded.
  - Redirect: `post`

- **Method**: `delete($id)` — GET
  - Ownership check
  - Deletes post
  - Warning redirect: `post`

- **Method**: `generateUrl($str)` — Internal
  - Uses `$this->_generateSeoURL($str)` (from MY_Controller)
  - Checks uniqueness in `posts` table by `paramalink`
  - If duplicate: appends random number (1-99) and recurses

### Model: `Posts_model`
- `get_all_by_user($user_id)`: `SELECT p.*, users.email FROM posts AS p, users WHERE users.id=p.user_id AND p.user_id=$user_id ORDER BY id DESC`
- `get_one_by_user($id, $user_id)`: `SELECT * FROM posts WHERE id=$id AND user_id=$user_id`
- `create($data)`: INSERT with created_at, updated_at
- `update($id, $data)`: UPDATE with updated_at
- `destroy($id, $user_id)`: DELETE where id AND user_id

### View: `front/post/index.php`
- DataTable (class `dttable`): No, Title (link to blog view), Date Time, Status (PUBLISHED=green badge, HIDE=default, BLOCK=danger), Actions (Edit + Delete buttons)
- "New" button → `post/create`
- Delete uses `conformDel()` confirm

### View: `front/post/add.php`
- Form: `form_open_multipart('post/store')`
- Fields: Title (text), Content (textarea with CKEditor `id="editor1"`), Video Link (text, optional, YouTube embed), Image (file, optional)
- Buttons: Publish, Cancel (→ `post`)
- JS: `validateYouTubeUrl()` — YouTube URL regex validator (non-functional, references wrong element ID)

### View: `front/post/edit.php`
- Same as add but:
  - Form action: `post/update/{id}`
  - Pre-populated with existing data
  - Shows current blog image (200×200)
- No Cancel button

### Connections
- Tables: `posts`, `users`
- File uploads: `upload/blog/`

---

## 1.16 Login Page (standalone)

### View: `front/login.php`
- **Standalone HTML** (no layout wrapper)
- Same CSS/JS as layout (duplicated head section)
- Centered card on page (`page-single`, `col-login mx-auto`)
- Logo: `assets/brand/LOGO-CIRCLE.png`
- Flash alert support
- **Form** (`form_open('auth/auth_login')`):
  - Email or Mobile (text, name=`email`)
  - Password (password, name=`password`)
  - Remember me (checkbox, name=`remember`, value=1)
  - Forgot password link → `auth/forgot_password`
  - Login error flash: `log_error`
  - Submit: "Log in" button
- Footer links: "Sign up as Doctor" → `auth/register?type=dr`, "Sign up as Patient" → `auth/register?type=patient`

---

## 1.17 Register Page (standalone)

### View: `front/register.php`
- **Standalone HTML** (same head section as login)
- **Form** (`form_open('auth/signup?type={type from GET}')`):
  - Name (text, name=`name`)
  - Email (email, name=`email`)
  - Mobile (text, name=`mobile_no`, maxlength=10)
  - Gender (select: Male/Female/Other, name=`gender`)
  - Password (password, name=`password`)
  - Confirm Password (password, name=`c_pass`)
  - Terms checkbox (name=`terms`) — links to Terms & Privacy Policy
  - Submit: "Create new account" button
- Footer: "Already have account? Log in"

---

## 1.18 Forgot Password (3-step flow)

### View: `front/forgot_password/forgot_password.php`
- Standalone HTML
- Form: `form_open('auth/forgot_submit')`
- Field: Mobile (text, name=`mobile`, maxlength=10)
- Button: "Find Account"
- Footer: Login link

### View: `front/forgot_password/otp_verify_form.php`
- Standalone HTML
- Shows: "Verify your mobile {mobile} to forgot your password"
- Form: `form_open('auth/forgot_password_mobile_verification_submit')`
- Field: OTP (number, name=`otp`, disabled until OTP sent)
- Buttons: "Send OTP" / "Resend OTP" (disabled for 60 seconds with countdown JS), "Submit" (disabled until OTP sent)
- JS: 60-second countdown timer, after which "Resend OTP" link becomes clickable
- Footer: Login link

### View: `front/forgot_password/generate_password.php`
- Standalone HTML
- Form: `form_open('auth/generate_new_password_submit')`
- Fields: New Password (password, name=`new_password`), Confirm Password (password, name=`conform_password`)
- Button: "Submit"

---

## 1.19 Mobile Verification (Registration)

### View: `front/register_mobile_verify.php`
- Standalone HTML
- Same OTP flow UI as forgot password
- Form: `form_open('auth/verify_mobile_submit')`
- OTP field, Send/Resend OTP button (60s countdown), Submit button
- Links: `auth/sendotp_mobile_verify` for OTP
- Footer: Login link

---

## 1.20 Registration Choice Page

### View: `front/reg_for.php`
- **2-column** layout (col-lg-6 each)
- **Doctor card**: Background image `assets/photos/doctor-Placements.png`, text "Are You a Doctor? Come online with us.", "Register Now" button → `auth/register?type=dr`
- **Patient card**: Background image `assets/photos/1491426154_medical_icon_1-e1491408177492.png`, text "You looking for a good doctor? Register Now.", "Register Now" button → `auth/register?type=patient`

---

## DATABASE TABLES TOUCHED (Summary)

| Table | Used By |
|-------|---------|
| `users` | All modules (auth, profiles, doctor/hospital listings, search) |
| `doctors` | Doctor listing, profile, search, hospital doctors |
| `hospital` | Hospital listing, profile, search |
| `booking` | Appointment booking, history, cancel, position, daily limit |
| `posts` | Blog listing, detail, patient post CRUD |
| `slider` | Homepage carousel |
| `doctor_rating` | Doctor profile rating, average calculation |
| `hospital_inquiry` | Inquiry form |
| `notifications` | Patient notifications, booking/receptionist alerts |
| `booking_chat` | Patient-doctor/receptionist chat per appointment |
| `prescription` | Appointment show (prescription display) |
| `states` | Booking form state dropdown |
| `cities` | Booking form city dropdown (AJAX) |
| `config` | Admin charge for appointment |
| `receptionist` | Chat routing, notification routing |
| `doctor_holiday_schedule` | Datepicker disabled dates |
| `schedule_docs` | Hospital schedule PDF download |
| `p_co`, `p_labels`, `p_medicine`, `p_suggestions`, `p_digno_table`, `p_other_settings` | Prescription print (shared with doctor module) |

---

## KEY MIGRATION NOTES

1. **Password hashing**: SHA256 (not bcrypt) — `hash("sha256", $password)`
2. **Image uploads**: Stored in `upload/profile/`, `upload/blog/`, `upload/slider/`, `upload/gallery/`, `upload/schedule_docs/`
3. **SEO URLs**: Blog posts use `paramalink` field (auto-generated from title, uniqueness enforced)
4. **Rating system**: Pure CSS stars (5-point), AJAX post to `api/rate_us`, stored in `doctor_rating` table
5. **Chat system**: Per-appointment, between patient and receptionist (NOT doctor), polling every 5 seconds
6. **Notifications**: Created on booking/cancel, stored per user, mark-as-read on viewing notification page
7. **SMS**: Sent on booking confirmation via `sendMobileMessage()`
8. **Appointment number**: Auto-incrementing format `APMT-{N}`
9. **Daily limit**: Doctor has `daily_limit` and `booking_days` fields that constrain booking
10. **Holiday blocking**: Dates from `doctor_holiday_schedule` are disabled in datepicker
11. **DataTables**: Used on appointment list (`.dttable` class), post list
12. **CKEditor**: Used for blog post content (wysiwyg)
13. **SweetAlert**: Used for delete/cancel confirmations
14. **Disqus**: Comments on blog detail pages (hardcoded shortname)
15. **AddToAny**: Social sharing on blog detail pages
16. **Google Analytics**: UA-171698773-1
17. **Search**: Searches across doctor name, state, specialization, education, experience AND hospital name, state
18. **Pagination**: CI Pagination library, Bootstrap 4 styled, 12 per page (doctors/hospitals), 9 per page (blog)
