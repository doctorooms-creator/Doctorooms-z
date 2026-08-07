# Doctorooms Research Plan

## 🎯 Objective
Doctorooms (PHP/CodeIgniter) project ko 6oti ki 6oti detail mein samajhna, har module ka page-by-page analysis karna, har connection map karna, taaki Next.js migration mein ZERO missing features ho.

---

## 📁 Source Location
`/tmp/Doctorooms/` — Cloned from `https://github.com/Devin041/Doctorooms.git`

## 📄 Research Output
`/home/z/my-project/research/DOCTOROOMS-RESEARCH.md` — Master research document

---

## 🗂️ Research Phases (Module-by-Module)

### Phase 0: Foundation Layer (Pre-requisite)
**Goal:** Project ki neevi samajhna — bina iske koi module samajh nahi aayega

| # | Research Item | Source Files to Read | What to Document |
|---|---|---|---|
| 0.1 | Architecture Overview | `core/MY_Controller.php`, `config/`, `index.php` | MVC flow, base controllers, routing, middleware/guards |
| 0.2 | Constants & Config | `config/constants.php`, `config/config.php`, `config/database.php` | All constants (roles, statuses, email, encryption), DB config |
| 0.3 | Helper Functions | `helpers/`, `core/MY_Controller.php` | Reusable functions (upload, encryption, SMS, email, SEO URL, thumb generation) |
| 0.4 | Database Schema (Full) | `hospital_app_db.sql` | Every table, every column, every relation, every foreign key, every index |
| 0.5 | Authentication Flow | `controllers/Auth.php`, `models/Users_model.php` | Registration, login, OTP verification, forgot password, role-based redirect, session management |
| 0.6 | Role & Permission System | `core/MY_Controller.php` (all *_controller classes) | How 6 roles work, guard logic, shared vs role-specific data loading |
| 0.7 | Layout System | `views/layouts/master_page_*.php` (7 files) | Each layout's navbar, sidebar, footer, CSS/JS includes, notification bar |
| 0.8 | File Upload System | `core/MY_Controller.php` (_upload_*, _generate_thumb) | Upload paths, allowed types, naming convention, thumb sizes, PDF upload |

---

### Phase 1: Frontend (Public-Facing) Module
**Goal:** Jo visitor dekhta hai — Home, Doctors, Hospitals, Blog, Auth, Contact

| # | Research Item | Source Files | What to Document |
|---|---|---|---|
| 1.1 | Homepage | `controllers/Home.php`, `views/front/home.php` | Slider logic, doctor cards (4 per row), hospital cards, blog cards, data queries |
| 1.2 | Doctor Listing | `controllers/Doctors.php`, `views/front/doctor/` | Search/filter, pagination, card layout, profile link |
| 1.3 | Doctor Profile | `views/front/doctor/profile.php`, `controllers/Doctors.php` | Full doctor detail, rating, booking button, hospital info |
| 1.4 | Doctor Search | `controllers/Search.php`, `views/front/doctor/search.php` | Search params (name, specialization, city, state), filters, results |
| 1.5 | Hospital Listing | `controllers/Hospitals.php`, `views/front/hospital/` | Hospital cards, search, pagination |
| 1.6 | Hospital Profile | `views/front/hospital/profile.php`, `controllers/Hospitals.php` | Hospital detail, doctors list, map, contact |
| 1.7 | Blog Listing | `controllers/Blog.php`, `views/front/blog.php` | Blog cards, categories, pagination |
| 1.8 | Blog Detail | `controllers/Blog.php`, `views/front/blog-details.php` | Full article, author info, related posts |
| 1.9 | Appointment Booking | `controllers/Book.php`, `controllers/Appointment.php`, `views/front/doctor/book.php` | Booking form fields, date selection, disease, patient details, validation, success flow |
| 1.10 | Patient Appointment History | `views/front/patient/`, `controllers/Appointment.php` | My appointments list, status tracking, detail view |
| 1.11 | Contact/Inquiry | `controllers/Contactus.php`, `controllers/Inquiry.php`, `views/front/contact-us.php` | Inquiry form, Google Maps, submission |
| 1.12 | Static Pages | `controllers/About.php`, `controllers/Privacy.php`, `controllers/Terms.php` | About, Privacy Policy, Terms & Conditions content |
| 1.13 | Patient Profile | `controllers/Profile.php`, `views/front/profile/` | Patient profile view, edit |
| 1.14 | Patient Notifications | `controllers/Notifications.php`, `views/front/patient/notifications.php` | Notification list, read/unread |
| 1.15 | Patient Posts/Blog | `controllers/Post.php`, `views/front/post/` | Patient can also write blog posts (add/edit/list) |
| 1.16 | Front Layout | `views/layouts/master_page_front.php` | Navbar (login/register/profile), footer, CSS/JS, responsive |

---

### Phase 2: Authentication & User Management Module
**Goal:** Poora auth flow — 6 roles ka registration, login, OTP, forgot password

| # | Research Item | Source Files | What to Document |
|---|---|---|---|
| 2.1 | Registration Form | `Auth.php (register/signup)`, `views/front/register.php` | Form fields per role (doctor/patient), validation rules, password hashing (SHA256) |
| 2.2 | Mobile OTP Verification | `Auth.php (verify_mobile/sendotp)`, `views/front/register_mobile_verify.php` | OTP generation, expiry (180 sec), session storage, verification flow |
| 2.3 | Email Verification | `Auth.php (verify_email)`, email template | Token generation (AES-128-CBC), encrypted link, verification endpoint |
| 2.4 | Login Flow | `Auth.php (login/auth_login)`, `views/front/login.php` | Credentials check, role-based redirect, Remember Me (cookie), status check (Active/Pending/Block) |
| 2.5 | Forgot Password | `Auth.php (forgot_*)`, `views/front/forgot_password/` | Mobile-based forgot (3 steps: mobile → OTP → new password), expiry times |
| 2.6 | Session Management | `core/MY_Controller.php`, all controllers | Session keys, user data stored, logout logic |
| 2.7 | User Model | `models/Users_model.php` | All queries, CRUD, auth checks, status checks |
| 2.8 | SMS Integration | `core/MY_Controller.php (sendMobileMessage)` | SMS gateway URL, parameters, message templates |
| 2.9 | Email Integration | `core/MY_Controller.php (send_mail)` | SMTP config, email templates (verify, forgot password) |

---

### Phase 3: Doctor Dashboard Module
**Goal:** Doctor ka poora dashboard — sabse bada module

| # | Research Item | Source Files | What to Document |
|---|---|---|---|
| 3.1 | Doctor Dashboard Home | `controllers/doctor/Dashboard.php`, `views/doctor/dashboard.php` | Stats (today appointments, total, pending, completed), charts |
| 3.2 | Doctor Appointments | `controllers/doctor/Appointment.php`, `views/doctor/appointment/` | Appointment list (DataTable), status change, detail view, patient info |
| 3.3 | Appointment History | `views/doctor/appointment/history.php` | Past appointments filter |
| 3.4 | Prescription System (AJAX) | `controllers/doctor/AjaxPrescription.php`, `views/doctor/AjaxPrescription/` | Dynamic prescription builder — medicines, diagnosis table, labels, suggestions, print |
| 3.5 | Prescription Print | `views/doctor/AjaxPrescription/print_prescription.php` | Print layout, logo, header, footer, styling |
| 3.6 | Doctor Schedule | `controllers/doctor/Schedule.php`, `views/doctor/schedule/` | Weekly schedule (day/time slots), add/edit/delete, holiday schedule |
| 3.7 | Doctor Profile | `controllers/doctor/Profile.php`, `views/doctor/profile/` | Profile edit (name, specialization, education, fees, etc.), photo upload |
| 3.8 | Doctor Assistants | `controllers/doctor/Assistant.php`, `views/doctor/assistant/` | CRUD assistants, assign to doctor |
| 3.9 | Doctor Receptionists | `controllers/doctor/Receptionist.php`, `views/doctor/receptionist/` | CRUD receptionists, assign to doctor |
| 3.10 | Doctor Pharmacists | `controllers/doctor/Pharmacist.php`, `views/doctor/pharmacist/` | CRUD pharmacists, assign to doctor, DL number |
| 3.11 | Doctor Medicine List | `controllers/doctor/Table_master.php` (indirect) | Personal medicine inventory (name, morning/afternoon/evening, dosage) |
| 3.12 | Doctor CO (Chief Complaints) | `controllers/doctor/Co.php`, `views/doctor/co/` | Chief complaints master — code, detail, status |
| 3.13 | Doctor Questions/Q&A | `controllers/doctor/Questions.php`, `views/doctor/questions/` | Health Q&A — create questions with explanations, link to CO |
| 3.14 | Doctor Suggestions | `controllers/doctor/Suggestions.php`, `views/doctor/suggestions/` | Suggestion master for prescriptions |
| 3.15 | Doctor Labels | `controllers/doctor/Label.php`, `views/doctor/label/` | Label master for prescription printing |
| 3.16 | Doctor Table Master | `controllers/doctor/Table_master.php`, `views/doctor/table_master/` | Custom table templates for diagnosis (rows, cols, headers, footers) |
| 3.17 | Doctor P_Other_Settings | `controllers/doctor/P_other_setting.php`, `views/doctor/p_other_setting/` | Prescription template settings (logo, timing, header, full header image) |
| 3.18 | Doctor Reports | `controllers/doctor/Report.php`, `views/doctor/report/` | Appointment charges report, appointment list report |
| 3.19 | Doctor Gallery | `controllers/doctor/Gallery.php`, `views/doctor/gallery.php` | Photo gallery upload |
| 3.20 | Doctor Posts/Blog | `controllers/doctor/Post.php`, `views/doctor/post/` | Write/edit blog posts |
| 3.21 | Doctor Notifications | `controllers/doctor/Notifications.php`, `views/doctor/notifications.php` | Notification bell, list, mark read |
| 3.22 | Doctor Chat | `models/Booking_chat_model.php`, `Api.php` | Real-time chat with patient per appointment |
| 3.23 | Doctor Layout | `views/layouts/master_page_doctors.php` | Sidebar menu items, navbar, notification bell, profile dropdown |

---

### Phase 4: Hospital Dashboard Module
**Goal:** Hospital admin ka dashboard

| # | Research Item | Source Files | What to Document |
|---|---|---|---|
| 4.1 | Hospital Dashboard | `controllers/hospital/Dashboard.php`, `views/hospital/common/dashboard.php` | Stats, charts |
| 4.2 | Hospital Appointments | `controllers/hospital/Appoinment.php`, `views/hospital/appointment*` | View appointments, add appointment, show detail |
| 4.3 | Hospital Doctors | `controllers/hospital/Doctor.php`, `views/hospital/doctor/` | Add/edit/view doctors under hospital, view doctor profiles |
| 4.4 | Hospital Income | `controllers/hospital/Income.php`, `views/hospital/income_summary.php` | Income reports, charts |
| 4.5 | Hospital Profile | `controllers/hospital/Profile.php`, `views/hospital/common/profile_update.php` | Hospital profile edit |
| 4.6 | Hospital Blog/Posts | `controllers/hospital/Blog.php`, `views/hospital/post/` | Blog management |
| 4.7 | Hospital Registration | `controllers/hospital/Registration.php`, `views/hospital/registration/` | Patient registration by hospital |
| 4.8 | Hospital Schedule Upload | `controllers/hospital/Upload_schedule.php`, `views/hospital/upload_schedule.php` | Upload doctor schedule PDF |
| 4.9 | Hospital Layout | `views/layouts/master_page_hospital.php` | Sidebar, navbar, permissions |

---

### Phase 5: Receptionist Dashboard Module
**Goal:** Receptionist jo doctor ke under kaam karta hai

| # | Research Item | Source Files | What to Document |
|---|---|---|---|
| 5.1 | Receptionist Dashboard | `controllers/receptionist/Dashboard.php`, `views/receptionist/dashboard.php` | Stats, today's appointments |
| 5.2 | Receptionist Appointments | `controllers/receptionist/Appointment.php`, `views/receptionist/appointment/` | Book appointment (for patients), list, show, emergency check |
| 5.3 | Receptionist Schedule | `controllers/receptionist/Schedule.php`, `views/receptionist/schedule/` | Manage doctor schedule (same as doctor's but via receptionist) |
| 5.4 | Receptionist Registration | `controllers/receptionist/Registration.php`, `views/receptionist/registration/` | Register new patients |
| 5.5 | Receptionist Medicine Master | `controllers/receptionist/Medicinemaster.php`, `views/receptionist/medicine/` | Medicine CRUD (for prescription reference) |
| 5.6 | Receptionist Profile | `controllers/receptionist/Profile.php`, `views/receptionist/profile.php` | Profile edit |
| 5.7 | Receptionist Notifications | `controllers/receptionist/Notifications.php`, `views/receptionist/notifications.php` | Notifications |
| 5.8 | Receptionist Posts | `controllers/receptionist/Post.php`, `views/receptionist/post/` | Blog posts |
| 5.9 | Receptionist Layout | `views/layouts/master_page_receptionist.php` | Sidebar (limited menu), navbar |

---

### Phase 6: Assistant Dashboard Module
**Goal:** Doctor Assistant (junior doctor staff)

| # | Research Item | Source Files | What to Document |
|---|---|---|---|
| 6.1 | Assistant Dashboard | `controllers/assistant/Dashboard.php`, `views/assistant/dashboard.php` | Stats |
| 6.2 | Assistant Appointments | `controllers/assistant/Appointment.php`, `views/assistant/appointment/` | View/manage appointments, create prescription (same as doctor) |
| 6.3 | Assistant Prescriptions | `controllers/assistant/AjaxPrescription.php`, `views/assistant/AjaxPrescription/` | Full prescription system (same as doctor) |
| 6.4 | Assistant Profile | `controllers/assistant/Profile.php`, `views/assistant/profile.php` | Profile edit |
| 6.5 | Assistant Notifications | `controllers/assistant/Notifications.php`, `views/assistant/notifications.php` | Notifications |
| 6.6 | Assistant Posts | `controllers/assistant/Post.php`, `views/assistant/post/` | Blog posts |
| 6.7 | Assistant Layout | `views/layouts/master_page_assistant.php` | Sidebar, navbar |

---

### Phase 7: Pharmacist Dashboard Module
**Goal:** Pharmacist — prescriptions dekhne ka access

| # | Research Item | Source Files | What to Document |
|---|---|---|---|
| 7.1 | Pharmacist Dashboard | `controllers/pharmacist/Pharmacist.php`, `views/pharmacist/dashboard.php` | Stats |
| 7.2 | Pharmacist Prescriptions | `controllers/pharmacist/Pharmacist.php`, `views/pharmacist/prescription.php` | View prescriptions (read-only), medicines list |
| 7.3 | Pharmacist Profile | `controllers/pharmacist/Profile.php`, `views/pharmacist/profile.php` | Profile edit |
| 7.4 | Pharmacist Layout | `views/layouts/master_page_pharmacist.php` | Minimal sidebar |

---

### Phase 8: Admin Dashboard Module
**Goal:** Super admin — sab kuch control karta hai

| # | Research Item | Source Files | What to Document |
|---|---|---|---|
| 8.1 | Admin Dashboard | `controllers/admin/Dashboard.php`, `views/admin/dashboard.php` | Global stats, charts, overview |
| 8.2 | Admin User Management | `controllers/admin/Dashboard.php (user section)`, `views/admin/user_view.php` | All users list, status toggle, role management |
| 8.3 | Admin Doctor Management | `controllers/admin/Doctor.php`, `views/admin/doctor_view.php`, `views/admin/doctor_edit.php` | All doctors, edit, approve/block, profile view |
| 8.4 | Admin Hospital Management | `controllers/admin/Hospital.php`, `views/admin/hospital_*.php` | All hospitals, CRUD, hospital details |
| 8.5 | Admin Patient Management | `controllers/admin/Patient.php`, `views/admin/patient_*.php` | All patients, view, edit |
| 8.6 | Admin Appointment Management | `controllers/admin/Appointment.php`, `views/admin/appointment_view.php` | All appointments, status management |
| 8.7 | Admin Blog Management | `controllers/admin/Blog.php`, `views/admin/blog_*.php` | CRUD blog posts, categories |
| 8.8 | Admin Slider Management | `controllers/admin/Slider.php`, `views/admin/slider_*.php` | Homepage slider CRUD, position, status |
| 8.9 | Admin Assistant Management | `controllers/admin/Assistant.php`, `views/admin/assistant_*.php` | All assistants, CRUD |
| 8.10 | Admin Receptionist Management | `controllers/admin/Receptionist.php`, `views/admin/receptionist_*.php` | All receptionists, CRUD |
| 8.11 | Admin Reports | `controllers/admin/Report.php`, `views/admin/report_*.php` | Income, doctor, hospital, patient, appointment reports + charts |
| 8.12 | Admin Charges | `controllers/admin/Config.php`, `views/admin/charges.php`, `views/admin/view_charges_income.php` | Admin charge (commission) per appointment |
| 8.13 | Admin Master Data | `controllers/admin/Type_master.php`, `Disease_master.php`, `Localization.php` | Doctor types, diseases, countries, states, cities |
| 8.14 | Admin Site Statistics | `views/admin/site_statestics.php` | Charts, analytics |
| 8.15 | Admin Profile | `views/admin/admin_profile_setting.php` | Admin profile settings |
| 8.16 | Admin Inquiry Management | `controllers/admin/Inquiry.php`, `views/admin/hospital_inquiry.php` | View/respond to inquiries |
| 8.17 | Admin Layout | `views/layouts/master_page_admin.php` | Full sidebar with all admin sections |

---

### Phase 9: Cross-Cutting Concerns
**Goal:** Jo multiple modules mein use hota hai

| # | Research Item | Source Files | What to Document |
|---|---|---|---|
| 9.1 | API Endpoints | `controllers/Api.php` | All AJAX/API endpoints, request/response format |
| 9.2 | Cron Job | `controllers/Crownjob.php` | Scheduled tasks, what runs periodically |
| 9.3 | Notification System | `models/Notifications_model.php`, all notification views | How notifications are created, stored, displayed |
| 9.4 | Booking Chat System | `models/Booking_chat_model.php` | Chat per appointment, message format, participants |
| 9.5 | Rating System | `models/Doctor_rating_model.php` | How ratings work, star system, where shown |
| 9.6 | Search System | `controllers/Search.php` | Full-text search across doctors/hospitals |
| 9.7 | File/Upload System | `upload/` directory structure | Where images/PDFs stored, naming convention |
| 9.8 | Form Validation | `config/form_validation.php` | All validation rules, custom validators |

---

### Phase 10: Module Connection Map
**Goal:** Har module kaise dusre se connected hai

| # | Connection | Direction | Data Flow |
|---|---|---|---|
| 10.1 | Auth → All Dashboards | After login, role-based redirect | Session data (user id, role, name) |
| 10.2 | Doctor → Booking | Doctor creates availability → Patient books | doctor_holiday_schedule, booking |
| 10.3 | Patient → Booking → Prescription | Patient books → Doctor prescribes | booking → prescription → p_medicine, p_labels, etc. |
| 10.4 | Hospital → Doctor | Hospital registers doctors under it | hospital.user_id → doctors.hospital_id |
| 10.5 | Doctor → Assistant | Doctor creates assistants | doctor_assistants.doctor_id |
| 10.6 | Doctor → Receptionist | Doctor creates receptionists | receptionist.doctor_id |
| 10.7 | Doctor → Pharmacist | Doctor assigns pharmacists | doctor_pharmacist.doctor_id |
| 10.8 | Admin → Everything | Admin manages all entities | All CRUD operations |
| 10.9 | Receptionist → Appointment | Books on behalf of patients | booking.booking_type = 'By Receptionist' |
| 10.10 | Booking → Chat | Per appointment chat | booking_chat.booking_id |
| 10.11 | Blog → Users | Multiple roles can write posts | posts.author_id → users.id |
| 10.12 | Doctor → Schedule → Booking | Schedule limits available dates | doctor_holiday_schedule → available dates for booking |
| 10.13 | Prescription → Print | Prescription with custom template | p_other_settings → prescription layout |
| 10.14 | Doctor → Questions → Suggestions → Prescription | Q&A linked to prescription | questions_master → suggestions_master → p_suggestions |
| 10.15 | Doctor → Table Master → Diagnosis Table | Custom tables in prescription | table_master → p_digno_table |
| 10.16 | Doctor → Labels → Prescription Labels | Labels in prescription | label_master → p_labels |
| 10.17 | Doctor → Medicine List → Prescription | Pre-saved medicines | doctor_medicine_list → p_medicine |
| 10.18 | Doctor → CO → Questions | Chief complaints → Q&A | co_master → questions_master.co_id |
| 10.19 | Slider → Homepage | Admin manages → Frontend shows | slider → home.php carousel |
| 10.20 | Config → Booking Charge | Admin charge applied to booking | config.admin_charge → booking.appointment_charge |

---

## 📋 Research Method (Per Item)

Har research item ke liye ye steps follow karenge:

1. **Controller Read** — Har method ka logic, request params, response, redirect
2. **Model Read** — Har query, joins, where conditions, data format returned
3. **View Read** — HTML structure, form fields, data displayed, JavaScript/AJAX calls
4. **Layout Read** — Which layout wraps this view, what's in navbar/sidebar
5. **Connection Map** — Which other modules this touches (DB tables, session data, redirects)
6. **Edge Cases** — Error handling, validation, empty states, permissions
7. **Document** — Write in DOCTOROOMS-RESEARCH.md with full detail

---

## ✅ Progress Tracking

- [ ] Phase 0: Foundation Layer
- [ ] Phase 1: Frontend (Public)
- [ ] Phase 2: Authentication & User Management
- [ ] Phase 3: Doctor Dashboard
- [ ] Phase 4: Hospital Dashboard
- [ ] Phase 5: Receptionist Dashboard
- [ ] Phase 6: Assistant Dashboard
- [ ] Phase 7: Pharmacist Dashboard
- [ ] Phase 8: Admin Dashboard
- [ ] Phase 9: Cross-Cutting Concerns
- [ ] Phase 10: Module Connection Map
