import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with comprehensive mock data...');

  // ============ CLEAN ============
  console.log('Cleaning existing data...');
  await db.$transaction([
    db.bookingChat.deleteMany(),
    db.pCo.deleteMany(),
    db.pDignoTable.deleteMany(),
    db.pSuggestion.deleteMany(),
    db.pLabel.deleteMany(),
    db.pMedicine.deleteMany(),
    db.prescription.deleteMany(),
    db.medicalDocument.deleteMany(),
    db.notification.deleteMany(),
    db.doctorRating.deleteMany(),
    db.booking.deleteMany(),
    db.doctorHoliday.deleteMany(),
    db.doctorSchedule.deleteMany(),
    db.doctorMedicine.deleteMany(),
    db.doctorGallery.deleteMany(),
    db.doctorAssistant.deleteMany(),
    db.doctorPharmacist.deleteMany(),
    db.receptionist.deleteMany(),
    db.pOtherSetting.deleteMany(),
    db.coMaster.deleteMany(),
    db.labelMaster.deleteMany(),
    db.questionsMaster.deleteMany(),
    db.suggestionsMaster.deleteMany(),
    db.post.deleteMany(),
    db.hospitalInquiry.deleteMany(),
    db.diseaseMaster.deleteMany(),
    db.doctorTypeMaster.deleteMany(),
    db.hospital.deleteMany(),
    db.doctor.deleteMany(),
    db.slider.deleteMany(),
    db.user.deleteMany(),
  ]);
  console.log('✅ Cleaned');

  const password = await hash('123456', 10);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Helper: date N days from now
  const d = (days: number, hour = 10, min = 0) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + days);
    dt.setHours(hour, min, 0, 0);
    return dt;
  };

  // =============================================
  // 1. USERS (33 total across 7 roles)
  // =============================================
  console.log('\n📋 Creating Users...');

  const users = await db.$transaction(
    [
      // --- ADMIN (1) ---
      { name: 'Admin User', role: 'admin', status: 'Active', email: 'admin@doctorooms.com', mobileNo: '9999999999', gender: 'Male' },

      // --- HOSPITALS (2) ---
      { name: 'City General Hospital', role: 'hospital', status: 'Active', email: 'cityhospital@doctorooms.com', mobileNo: '9812345001', gender: 'Male' },
      { name: 'Sunrise Medical Center', role: 'hospital', status: 'Active', email: 'sunrise@doctorooms.com', mobileNo: '9812345002', gender: 'Female' },

      // --- DOCTORS (3) ---
      { name: 'Dr. Rajesh Sharma', role: 'doctor', status: 'Active', email: 'rajesh@doctorooms.com', mobileNo: '9812345003', gender: 'Male' },
      { name: 'Dr. Priya Singh', role: 'doctor', status: 'Active', email: 'priya@doctorooms.com', mobileNo: '9812345004', gender: 'Female' },
      { name: 'Dr. Amit Patel', role: 'doctor', status: 'Active', email: 'amit@doctorooms.com', mobileNo: '9812345005', gender: 'Male' },

      // --- RECEPTIONISTS (3 - one per doctor) ---
      { name: 'Meera Joshi', role: 'receptionist', status: 'Active', email: 'meera@doctorooms.com', mobileNo: '9812345006', gender: 'Female' },
      { name: 'Pooja Sharma', role: 'receptionist', status: 'Active', email: 'pooja@doctorooms.com', mobileNo: '9812345007', gender: 'Female' },
      { name: 'Ritu Agarwal', role: 'receptionist', status: 'Active', email: 'ritu@doctorooms.com', mobileNo: '9812345008', gender: 'Female' },

      // --- ASSISTANTS (3 - one per doctor) ---
      { name: 'Vikram Patel', role: 'assistant', status: 'Active', email: 'vikram@doctorooms.com', mobileNo: '9812345009', gender: 'Male' },
      { name: 'Sanjay Kumar', role: 'assistant', status: 'Active', email: 'sanjay@doctorooms.com', mobileNo: '9812345010', gender: 'Male' },
      { name: 'Anita Desai', role: 'assistant', status: 'Active', email: 'anita@doctorooms.com', mobileNo: '9812345011', gender: 'Female' },

      // --- PHARMACISTS (3 - one per doctor) ---
      { name: 'Kavitha Devi', role: 'pharmacist', status: 'Active', email: 'kavitha@doctorooms.com', mobileNo: '9812345012', gender: 'Female' },
      { name: 'Ramesh Gupta', role: 'pharmacist', status: 'Active', email: 'ramesh@doctorooms.com', mobileNo: '9812345013', gender: 'Male' },
      { name: 'Suresh Menon', role: 'pharmacist', status: 'Active', email: 'suresh@doctorooms.com', mobileNo: '9812345014', gender: 'Male' },

      // --- PATIENTS (8) ---
      { name: 'Rahul Verma', role: 'patient', status: 'Active', email: 'rahul@patient.com', mobileNo: '9800000001', gender: 'Male' },
      { name: 'Sneha Reddy', role: 'patient', status: 'Active', email: 'sneha@patient.com', mobileNo: '9800000002', gender: 'Female' },
      { name: 'Arjun Mehta', role: 'patient', status: 'Active', email: 'arjun@patient.com', mobileNo: '9800000003', gender: 'Male' },
      { name: 'Priyanka Iyer', role: 'patient', status: 'Active', email: 'priyanka@patient.com', mobileNo: '9800000004', gender: 'Female' },
      { name: 'Mohammed Ali', role: 'patient', status: 'Active', email: 'mohammed@patient.com', mobileNo: '9800000005', gender: 'Male' },
      { name: 'Lakshmi Nair', role: 'patient', status: 'Active', email: 'lakshmi@patient.com', mobileNo: '9800000006', gender: 'Female' },
      { name: 'Rohan Kulkarni', role: 'patient', status: 'Active', email: 'rohan@patient.com', mobileNo: '9800000007', gender: 'Male' },
      { name: 'Ananya Bose', role: 'patient', status: 'Active', email: 'ananya@patient.com', mobileNo: '9800000008', gender: 'Female' },

      // --- PENDING PATIENTS (2) ---
      { name: 'Deepak Rawat', role: 'patient', status: 'Pending', email: 'deepak@patient.com', mobileNo: '9800000009', gender: 'Male' },
      { name: 'Neha Kapoor', role: 'patient', status: 'Pending', email: 'neha@patient.com', mobileNo: '9800000010', gender: 'Female' },

      // --- BLOCKED USER (1) ---
      { name: 'Blocked Test User', role: 'patient', status: 'Block', email: 'blocked@patient.com', mobileNo: '9800000011', gender: 'Male' },

      // --- EXTRA DOCTOR (Pending) ---
      { name: 'Dr. Kavita Joshi', role: 'doctor', status: 'Pending', email: 'kavita.doc@doctorooms.com', mobileNo: '9812345015', gender: 'Female' },
    ].map(u => db.user.create({
      data: { ...u, password, settingsJson: JSON.stringify({ emailNotifications: true, bookingReminders: true, marketingEmails: false }) },
    }))
  );
  console.log(`✅ Created ${users.length} users`);

  // Quick refs by email
  const byEmail = (email: string) => users.find(u => u.email === email)!;

  // =============================================
  // 2. DOCTOR PROFILES
  // =============================================
  console.log('\n🩺 Creating Doctor profiles...');

  const doctors = await db.$transaction([
    db.doctor.create({
      data: {
        userId: byEmail('rajesh@doctorooms.com').id,
        specialization: 'Cardiologist',
        doctorType: 'Cardiology',
        description: 'Senior Cardiologist with 18+ years of experience in interventional cardiology and heart failure management.',
        education: 'MBBS, MD (Cardiology), FACC',
        experience: '18 years',
        fees: 800,
        emergencyCharge: 1500,
        city: 'Mumbai',
        state: 'Maharashtra',
        address: '302, Heart Care Center, Andheri West',
        hospitalAddress: 'City General Hospital, Mumbai',
        hospitalId: byEmail('cityhospital@doctorooms.com').id,
        contactNo: '9812345003',
        phoneNo: '022-26789012',
        isEmergency: true,
        registrationDetail: 'MMC-12345',
        lat: 19.1197,
        longi: 72.8464,
        bookingDays: 180,
        dailyLimit: 40,
      },
    }),
    db.doctor.create({
      data: {
        userId: byEmail('priya@doctorooms.com').id,
        specialization: 'Dermatologist',
        doctorType: 'Dermatology',
        description: 'Expert Dermatologist specializing in cosmetic dermatology, acne treatment, and skin cancer screening.',
        education: 'MBBS, MD (Dermatology), IADVL',
        experience: '12 years',
        fees: 600,
        emergencyCharge: 1000,
        city: 'Delhi',
        state: 'Delhi',
        address: '501, Skin & Beauty Clinic, Connaught Place',
        hospitalAddress: 'Sunrise Medical Center, Delhi',
        hospitalId: byEmail('sunrise@doctorooms.com').id,
        contactNo: '9812345004',
        phoneNo: '011-23456789',
        isEmergency: false,
        registrationDetail: 'DMC-67890',
        lat: 28.6139,
        longi: 77.2090,
        bookingDays: 180,
        dailyLimit: 50,
      },
    }),
    db.doctor.create({
      data: {
        userId: byEmail('amit@doctorooms.com').id,
        specialization: 'Orthopedic Surgeon',
        doctorType: 'Orthopedics',
        description: 'Orthopedic Surgeon with expertise in joint replacement, sports injuries, and spinal surgery.',
        education: 'MBBS, MS (Orthopedics), FRCS',
        experience: '15 years',
        fees: 1000,
        emergencyCharge: 2000,
        city: 'Pune',
        state: 'Maharashtra',
        address: '104, Ortho Care Hospital, Koregaon Park',
        hospitalAddress: '',
        hospitalId: null,
        contactNo: '9812345005',
        phoneNo: '020-25678901',
        isEmergency: true,
        registrationDetail: 'MMC-11111',
        lat: 18.5204,
        longi: 73.8567,
        bookingDays: 180,
        dailyLimit: 30,
      },
    }),
  ]);
  console.log(`✅ Created ${doctors.length} doctor profiles`);

  const docRajesh = doctors[0];   // Cardiologist, Mumbai
  const docPriya = doctors[1];    // Dermatologist, Delhi
  const docAmit = doctors[2];     // Orthopedic, Pune

  // =============================================
  // 3. HOSPITAL PROFILES
  // =============================================
  console.log('\n🏥 Creating Hospital profiles...');

  await db.$transaction([
    db.hospital.create({
      data: {
        userId: byEmail('cityhospital@doctorooms.com').id,
        hospitalName: 'City General Hospital',
        address: 'Plot 45, Sector 12, Andheri West',
        city: 'Mumbai',
        state: 'Maharashtra',
        contactNo: '022-26789000',
        lat: 19.1197,
        longi: 72.8464,
        gallery: JSON.stringify(['/img/hospital1.jpg', '/img/hospital2.jpg']),
      },
    }),
    db.hospital.create({
      data: {
        userId: byEmail('sunrise@doctorooms.com').id,
        hospitalName: 'Sunrise Medical Center',
        address: '23, Connaught Place, Inner Circle',
        city: 'Delhi',
        state: 'Delhi',
        contactNo: '011-23456780',
        lat: 28.6139,
        longi: 77.2090,
        gallery: JSON.stringify(['/img/sunrise1.jpg', '/img/sunrise2.jpg', '/img/sunrise3.jpg']),
      },
    }),
  ]);
  console.log('✅ Created 2 hospital profiles');

  // =============================================
  // 4. DOCTOR TEAMS (Receptionist + Assistant + Pharmacist per doctor)
  // =============================================
  console.log('\n👥 Creating Doctor teams...');

  await db.$transaction([
    // Dr. Rajesh's team
    db.receptionist.create({ data: { userId: byEmail('meera@doctorooms.com').id, doctorId: docRajesh.id, address: 'Andheri West, Mumbai' } }),
    db.doctorAssistant.create({ data: { userId: byEmail('vikram@doctorooms.com').id, doctorId: docRajesh.id, address: 'Andheri West, Mumbai', description: 'Senior clinical assistant' } }),
    db.doctorPharmacist.create({ data: { userId: byEmail('kavitha@doctorooms.com').id, doctorId: docRajesh.id, address: 'Andheri West, Mumbai', dlNo: 'DL-MH-2024-001' } }),

    // Dr. Priya's team
    db.receptionist.create({ data: { userId: byEmail('pooja@doctorooms.com').id, doctorId: docPriya.id, address: 'Connaught Place, Delhi' } }),
    db.doctorAssistant.create({ data: { userId: byEmail('sanjay@doctorooms.com').id, doctorId: docPriya.id, address: 'Connaught Place, Delhi', description: 'Dermatology assistant' } }),
    db.doctorPharmacist.create({ data: { userId: byEmail('ramesh@doctorooms.com').id, doctorId: docPriya.id, address: 'Connaught Place, Delhi', dlNo: 'DL-DL-2024-002' } }),

    // Dr. Amit's team
    db.receptionist.create({ data: { userId: byEmail('ritu@doctorooms.com').id, doctorId: docAmit.id, address: 'Koregaon Park, Pune' } }),
    db.doctorAssistant.create({ data: { userId: byEmail('anita@doctorooms.com').id, doctorId: docAmit.id, address: 'Koregaon Park, Pune', description: 'Orthopedic assistant' } }),
    db.doctorPharmacist.create({ data: { userId: byEmail('suresh@doctorooms.com').id, doctorId: docAmit.id, address: 'Koregaon Park, Pune', dlNo: 'DL-MH-2024-003' } }),
  ]);
  console.log('✅ Created 9 team members (3 per doctor)');

  // =============================================
  // 5. DOCTOR SCHEDULES
  // =============================================
  console.log('\n📅 Creating Doctor schedules...');

  await db.$transaction([
    // Dr. Rajesh - Mon/Wed/Fri morning, Tue/Thu evening
    db.doctorSchedule.create({ data: { doctorId: docRajesh.id, day: 'Monday', startTime: '09:00', endTime: '13:00', slotDuration: 30, timeSlots: JSON.stringify(['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30']) } }),
    db.doctorSchedule.create({ data: { doctorId: docRajesh.id, day: 'Tuesday', startTime: '16:00', endTime: '20:00', slotDuration: 30, timeSlots: JSON.stringify(['16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30']) } }),
    db.doctorSchedule.create({ data: { doctorId: docRajesh.id, day: 'Wednesday', startTime: '09:00', endTime: '13:00', slotDuration: 30, timeSlots: JSON.stringify(['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30']) } }),
    db.doctorSchedule.create({ data: { doctorId: docRajesh.id, day: 'Thursday', startTime: '16:00', endTime: '20:00', slotDuration: 30, timeSlots: JSON.stringify(['16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30']) } }),
    db.doctorSchedule.create({ data: { doctorId: docRajesh.id, day: 'Friday', startTime: '09:00', endTime: '13:00', slotDuration: 30, timeSlots: JSON.stringify(['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30']) } }),

    // Dr. Priya - Mon-Sat all day
    db.doctorSchedule.create({ data: { doctorId: docPriya.id, day: 'Monday', startTime: '10:00', endTime: '17:00', slotDuration: 20, timeSlots: JSON.stringify(['10:00','10:20','10:40','11:00','11:20','11:40','12:00','12:20','14:00','14:20','14:40','15:00','15:20','15:40','16:00','16:20','16:40']) } }),
    db.doctorSchedule.create({ data: { doctorId: docPriya.id, day: 'Tuesday', startTime: '10:00', endTime: '17:00', slotDuration: 20, timeSlots: JSON.stringify(['10:00','10:20','10:40','11:00','11:20','11:40','12:00','12:20','14:00','14:20','14:40','15:00','15:20','15:40','16:00','16:20','16:40']) } }),
    db.doctorSchedule.create({ data: { doctorId: docPriya.id, day: 'Wednesday', startTime: '10:00', endTime: '17:00', slotDuration: 20, timeSlots: JSON.stringify(['10:00','10:20','10:40','11:00','11:20','11:40','12:00','12:20','14:00','14:20','14:40','15:00','15:20','15:40','16:00','16:20','16:40']) } }),
    db.doctorSchedule.create({ data: { doctorId: docPriya.id, day: 'Thursday', startTime: '10:00', endTime: '17:00', slotDuration: 20, timeSlots: JSON.stringify(['10:00','10:20','10:40','11:00','11:20','11:40','12:00','12:20','14:00','14:20','14:40','15:00','15:20','15:40','16:00','16:20','16:40']) } }),
    db.doctorSchedule.create({ data: { doctorId: docPriya.id, day: 'Friday', startTime: '10:00', endTime: '17:00', slotDuration: 20, timeSlots: JSON.stringify(['10:00','10:20','10:40','11:00','11:20','11:40','12:00','12:20','14:00','14:20','14:40','15:00','15:20','15:40','16:00','16:20','16:40']) } }),
    db.doctorSchedule.create({ data: { doctorId: docPriya.id, day: 'Saturday', startTime: '10:00', endTime: '14:00', slotDuration: 20, timeSlots: JSON.stringify(['10:00','10:20','10:40','11:00','11:20','11:40','12:00','12:20','13:00','13:20','13:40']) } }),

    // Dr. Amit - Tue/Thu/Sat
    db.doctorSchedule.create({ data: { doctorId: docAmit.id, day: 'Tuesday', startTime: '09:00', endTime: '15:00', slotDuration: 30, timeSlots: JSON.stringify(['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30']) } }),
    db.doctorSchedule.create({ data: { doctorId: docAmit.id, day: 'Thursday', startTime: '09:00', endTime: '15:00', slotDuration: 30, timeSlots: JSON.stringify(['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30']) } }),
    db.doctorSchedule.create({ data: { doctorId: docAmit.id, day: 'Saturday', startTime: '09:00', endTime: '13:00', slotDuration: 30, timeSlots: JSON.stringify(['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30']) } }),
  ]);
  console.log('✅ Created 20 doctor schedules');

  // =============================================
  // 6. DOCTOR HOLIDAYS
  // =============================================
  console.log('\n🏖️ Creating Doctor holidays...');

  await db.$transaction([
    db.doctorHoliday.create({ data: { userId: docRajesh.id, date: d(7, 0, 0), remark: 'Personal leave' } }),
    db.doctorHoliday.create({ data: { userId: docRajesh.id, date: d(14, 0, 0), remark: 'Conference - Cardiology Summit 2025' } }),
    db.doctorHoliday.create({ data: { userId: docPriya.id, date: d(10, 0, 0), remark: 'Medical workshop' } }),
    db.doctorHoliday.create({ data: { userId: docAmit.id, date: d(5, 0, 0), remark: 'Surgery day - no OPD' } }),
  ]);
  console.log('✅ Created 4 doctor holidays');

  // =============================================
  // 7. DOCTOR MEDICINES (per doctor)
  // =============================================
  console.log('\n💊 Creating Doctor medicine lists...');

  await db.$transaction([
    // Dr. Rajesh's medicines (Cardiology)
    ...[
      { name: 'Aspirin 75mg', dose: 'Once daily', tab: 1, description: 'Blood thinner', morning: '1', afternoon: '', evening: '' },
      { name: 'Atorvastatin 40mg', dose: 'Once daily at bedtime', tab: 1, description: 'Cholesterol lowering', morning: '', afternoon: '', evening: '1' },
      { name: 'Metoprolol 50mg', dose: 'Twice daily', tab: 1, description: 'Beta blocker for BP & heart rate', morning: '1', afternoon: '1', evening: '' },
      { name: 'Amlodipine 5mg', dose: 'Once daily', tab: 1, description: 'Calcium channel blocker', morning: '1', afternoon: '', evening: '' },
      { name: 'Clopidogrel 75mg', dose: 'Once daily', tab: 1, description: 'Antiplatelet', morning: '1', afternoon: '', evening: '' },
      { name: 'Ramipril 5mg', dose: 'Once daily', tab: 1, description: 'ACE inhibitor', morning: '1', afternoon: '', evening: '' },
      { name: 'Nitroglycerin 0.4mg', dose: 'SOS sublingual', tab: 1, description: 'For chest pain emergency', morning: '', afternoon: '', evening: 'SOS' },
      { name: 'Furosemide 40mg', dose: 'Once daily morning', tab: 1, description: 'Diuretic for fluid retention', morning: '1', afternoon: '', evening: '' },
    ].map(m => db.doctorMedicine.create({
      data: { ...m, userId: docRajesh.id, status: 'Active', createdById: byEmail('rajesh@doctorooms.com').id },
    })),

    // Dr. Priya's medicines (Dermatology)
    ...[
      { name: 'Betamethasone Cream', dose: 'Apply twice daily', tab: 1, description: 'Topical steroid for inflammation', morning: 'Apply', afternoon: 'Apply', evening: '' },
      { name: 'Clotrimazole 1%', dose: 'Apply twice daily', tab: 1, description: 'Antifungal cream', morning: 'Apply', afternoon: 'Apply', evening: '' },
      { name: 'Isotretinoin 20mg', dose: 'Once daily with food', tab: 1, description: 'For severe acne', morning: '1', afternoon: '', evening: '' },
      { name: 'Cetirizine 10mg', dose: 'Once daily', tab: 1, description: 'Antihistamine for allergies', morning: '1', afternoon: '', evening: '' },
      { name: 'Mupirocin Ointment', dose: 'Apply 3 times daily', tab: 1, description: 'Antibiotic for skin infections', morning: 'Apply', afternoon: 'Apply', evening: 'Apply' },
      { name: 'Ketoconazole Shampoo', dose: 'Twice weekly', tab: 1, description: 'Anti-dandruff / antifungal', morning: '', afternoon: '', evening: 'Use' },
    ].map(m => db.doctorMedicine.create({
      data: { ...m, userId: docPriya.id, status: 'Active', createdById: byEmail('priya@doctorooms.com').id },
    })),

    // Dr. Amit's medicines (Orthopedics)
    ...[
      { name: 'Ibuprofen 400mg', dose: 'Three times daily with food', tab: 1, description: 'NSAID for pain & inflammation', morning: '1', afternoon: '1', evening: '1' },
      { name: 'Tramadol 50mg', dose: 'SOS for severe pain', tab: 1, description: 'Opioid analgesic', morning: '', afternoon: '', evening: 'SOS' },
      { name: 'Calcium + Vitamin D3', dose: 'Once daily', tab: 1, description: 'Bone health supplement', morning: '1', afternoon: '', evening: '' },
      { name: 'Diclofenac Gel', dose: 'Apply 3-4 times daily', tab: 1, description: 'Topical pain relief', morning: 'Apply', afternoon: 'Apply', evening: 'Apply' },
      { name: 'Pantoprazole 40mg', dose: 'Once daily before breakfast', tab: 1, description: 'Gastroprotection with NSAIDs', morning: '1', afternoon: '', evening: '' },
      { name: 'Muscle Relaxant (Thiocolchicoside)', dose: 'Twice daily', tab: 1, description: 'For muscle spasms', morning: '1', afternoon: '1', evening: '' },
      { name: 'Collagen Peptides', dose: 'Once daily', tab: 1, description: 'Joint support supplement', morning: '1', afternoon: '', evening: '' },
    ].map(m => db.doctorMedicine.create({
      data: { ...m, userId: docAmit.id, status: 'Active', createdById: byEmail('amit@doctorooms.com').id },
    })),
  ]);
  console.log('✅ Created 21 doctor medicines (8 + 6 + 7)');

  // =============================================
  // 8. DOCTOR GALLERY
  // =============================================
  console.log('\n🖼️ Creating Doctor gallery...');

  await db.$transaction([
    db.doctorGallery.create({ data: { doctorId: docRajesh.id, image: '/img/doc_rajesh_1.jpg' } }),
    db.doctorGallery.create({ data: { doctorId: docRajesh.id, image: '/img/doc_rajesh_2.jpg' } }),
    db.doctorGallery.create({ data: { doctorId: docPriya.id, image: '/img/doc_priya_1.jpg' } }),
    db.doctorGallery.create({ data: { doctorId: docPriya.id, image: '/img/doc_priya_2.jpg' } }),
    db.doctorGallery.create({ data: { doctorId: docPriya.id, image: '/img/doc_priya_3.jpg' } }),
    db.doctorGallery.create({ data: { doctorId: docAmit.id, image: '/img/doc_amit_1.jpg' } }),
  ]);
  console.log('✅ Created 6 gallery images');

  // =============================================
  // 9. DOCTOR PRESCRIPTION SETTINGS (POtherSetting)
  // =============================================
  console.log('\n📝 Creating Prescription settings...');

  await db.$transaction([
    db.pOtherSetting.create({
      data: {
        doctorId: docRajesh.id,
        header: 'Heart Care Center',
        fullHeader: 'Heart Care Center\nDr. Rajesh Sharma (Cardiologist)\nMBBS, MD (Cardiology), FACC\nAndheri West, Mumbai | Ph: 022-26789012',
        isFullHeader: true,
        time: JSON.stringify({ showTime: true, format: '12h' }),
        createdById: byEmail('rajesh@doctorooms.com').id,
      },
    }),
    db.pOtherSetting.create({
      data: {
        doctorId: docPriya.id,
        header: 'Skin & Beauty Clinic',
        fullHeader: 'Skin & Beauty Clinic\nDr. Priya Singh (Dermatologist)\nMBBS, MD (Dermatology), IADVL\nConnaught Place, Delhi | Ph: 011-23456789',
        isFullHeader: true,
        time: JSON.stringify({ showTime: true, format: '12h' }),
        createdById: byEmail('priya@doctorooms.com').id,
      },
    }),
    db.pOtherSetting.create({
      data: {
        doctorId: docAmit.id,
        header: 'Ortho Care Hospital',
        fullHeader: 'Ortho Care Hospital\nDr. Amit Patel (Orthopedic Surgeon)\nMBBS, MS (Orthopedics), FRCS\nKoregaon Park, Pune | Ph: 020-25678901',
        isFullHeader: true,
        time: JSON.stringify({ showTime: true, format: '12h' }),
        createdById: byEmail('amit@doctorooms.com').id,
      },
    }),
  ]);
  console.log('✅ Created 3 prescription settings');

  // =============================================
  // 10. LABEL MASTER, CO MASTER, QUESTIONS MASTER per doctor
  // =============================================
  console.log('\n🏷️ Creating Prescription templates...');

  await db.$transaction([
    // Dr. Rajesh labels
    ...['BP (mmHg)', 'Pulse (/min)', 'Temperature (°F)', 'SpO2 (%)', 'Weight (kg)', 'Blood Sugar (mg/dL)'].map(label =>
      db.labelMaster.create({ data: { doctorId: docRajesh.id, label, status: 'Active', createdById: byEmail('rajesh@doctorooms.com').id } })
    ),
    // Dr. Priya labels
    ...['Skin Type', 'Allergy History', 'UV Exposure', 'Hydration Level', 'Previous Treatment'].map(label =>
      db.labelMaster.create({ data: { doctorId: docPriya.id, label, status: 'Active', createdById: byEmail('priya@doctorooms.com').id } })
    ),
    // Dr. Amit labels
    ...['Pain Scale (1-10)', 'Range of Motion', 'Swelling', 'Tenderness', 'X-Ray Findings', 'MRI Findings'].map(label =>
      db.labelMaster.create({ data: { doctorId: docAmit.id, label, status: 'Active', createdById: byEmail('amit@doctorooms.com').id } })
    ),
  ]);

  await db.$transaction([
    // Dr. Rajesh chief complaints
    ...[
      { coCode: 'CC01', coDetail: 'Chest Pain' },
      { coCode: 'CC02', coDetail: 'Shortness of Breath' },
      { coCode: 'CC03', coDetail: 'Palpitations' },
      { coCode: 'CC04', coDetail: 'Dizziness' },
      { coCode: 'CC05', coDetail: 'Swelling in Legs' },
    ].map(c => db.coMaster.create({ data: { ...c, doctorId: docRajesh.id, status: 'Active', createdById: byEmail('rajesh@doctorooms.com').id } })),

    // Dr. Priya chief complaints
    ...[
      { coCode: 'DS01', coDetail: 'Skin Rash' },
      { coCode: 'DS02', coDetail: 'Acne' },
      { coCode: 'DS03', coDetail: 'Hair Loss' },
      { coCode: 'DS04', coDetail: 'Itching' },
      { coCode: 'DS05', coDetail: 'Pigmentation' },
    ].map(c => db.coMaster.create({ data: { ...c, doctorId: docPriya.id, status: 'Active', createdById: byEmail('priya@doctorooms.com').id } })),

    // Dr. Amit chief complaints
    ...[
      { coCode: 'OR01', coDetail: 'Knee Pain' },
      { coCode: 'OR02', coDetail: 'Back Pain' },
      { coCode: 'OR03', coDetail: 'Shoulder Pain' },
      { coCode: 'OR04', coDetail: 'Fracture' },
      { coCode: 'OR05', coDetail: 'Joint Stiffness' },
    ].map(c => db.coMaster.create({ data: { ...c, doctorId: docAmit.id, status: 'Active', createdById: byEmail('amit@doctorooms.com').id } })),
  ]);

  await db.$transaction([
    // Dr. Rajesh questions
    ...[
      { question: 'Do you smoke or use tobacco?', explanation: 'Smoking is a major risk factor for heart disease' },
      { question: 'Any family history of heart disease?', explanation: 'Genetic predisposition to cardiac conditions' },
      { question: 'Do you experience chest pain during exercise?', explanation: 'Exertional angina assessment' },
    ].map(q => db.questionsMaster.create({ data: { ...q, doctorId: docRajesh.id, status: 'Active', createdById: byEmail('rajesh@doctorooms.com').id } })),

    // Dr. Priya questions
    ...[
      { question: 'Have you used any new skincare products recently?', explanation: 'Contact dermatitis screening' },
      { question: 'Is the rash itchy or painful?', explanation: 'Symptom characterization' },
      { question: 'Any previous skin treatments or procedures?', explanation: 'Treatment history' },
    ].map(q => db.questionsMaster.create({ data: { ...q, doctorId: docPriya.id, status: 'Active', createdById: byEmail('priya@doctorooms.com').id } })),

    // Dr. Amit questions
    ...[
      { question: 'When did the pain start? Was there any injury?', explanation: 'Onset and trauma history' },
      { question: 'Does the pain worsen with movement?', explanation: 'Mechanical vs inflammatory pain' },
      { question: 'Have you had any previous surgeries on this joint?', explanation: 'Surgical history' },
    ].map(q => db.questionsMaster.create({ data: { ...q, doctorId: docAmit.id, status: 'Active', createdById: byEmail('amit@doctorooms.com').id } })),
  ]);

  // Suggestions for questions
  const questionsRajesh = await db.questionsMaster.findMany({ where: { doctorId: docRajesh.id } });
  const questionsPriya = await db.questionsMaster.findMany({ where: { doctorId: docPriya.id } });
  const questionsAmit = await db.questionsMaster.findMany({ where: { doctorId: docAmit.id } });

  await db.$transaction([
    ...questionsRajesh.flatMap((q, i) =>
      [['Yes', 'No', 'Occasionally'], ['No', 'Yes - Father', 'Yes - Mother'], ['Yes, during running', 'No', 'Sometimes during climbing stairs']][i].map(s =>
        db.suggestionsMaster.create({
          data: { questionId: q.id, suggestions: s, status: 'Active', doctorId: docRajesh.id, createdById: byEmail('rajesh@doctorooms.com').id },
        })
      )
    ),
    ...questionsPriya.flatMap((q, i) =>
      [['Yes, a new cream', 'No', 'Yes, new soap'], ['Very itchy', 'Mildly itchy', 'Painful, not itchy'], ['Yes, laser treatment', 'No', 'Yes, chemical peel']][i].map(s =>
        db.suggestionsMaster.create({
          data: { questionId: q.id, suggestions: s, status: 'Active', doctorId: docPriya.id, createdById: byEmail('priya@doctorooms.com').id },
        })
      )
    ),
    ...questionsAmit.flatMap((q, i) =>
      [['2 weeks ago, no injury', '1 month ago, after fall', '3 days ago, sudden'], ['Yes, much worse', 'Slightly worse', 'No difference'], ['Yes, arthroscopy', 'No', 'Yes, ACL reconstruction']][i].map(s =>
        db.suggestionsMaster.create({
          data: { questionId: q.id, suggestions: s, status: 'Active', doctorId: docAmit.id, createdById: byEmail('amit@doctorooms.com').id },
        })
      )
    ),
  ]);
  console.log('✅ Created labels (17), chief complaints (15), questions (9), suggestions (27)');

  // =============================================
  // 11. DISEASE MASTER
  // =============================================
  console.log('\n🦠 Creating Disease master...');

  await db.$transaction([
    'Hypertension', 'Diabetes', 'Coronary Artery Disease', 'Asthma', 'Acne Vulgaris',
    'Eczema', 'Psoriasis', 'Osteoarthritis', 'Rheumatoid Arthritis', 'Lower Back Pain',
    'Migraine', 'Thyroid Disorder', 'Anemia', 'Allergic Rhinitis', 'Gastritis',
    'Urinary Tract Infection', 'Common Cold', 'Fever', 'Conjunctivitis', 'Dengue Fever',
  ].map(name => db.diseaseMaster.create({ data: { name, status: 'Active' } })),
  );
  console.log('✅ Created 20 diseases');

  // =============================================
  // 12. DOCTOR TYPE MASTER
  // =============================================
  console.log('\n📋 Creating Doctor type master...');

  await db.$transaction([
    'Cardiology', 'Dermatology', 'Orthopedics', 'General Medicine', 'Pediatrics',
    'Gynecology', 'ENT', 'Ophthalmology', 'Neurology', 'Psychiatry',
    'Gastroenterology', 'Urology', 'Pulmonology', 'Endocrinology', 'Oncology',
  ].map(type => db.doctorTypeMaster.create({ data: { type, status: 'Active' } })),
  );
  console.log('✅ Created 15 doctor types');

  // =============================================
  // 13. BOOKINGS (various statuses for testing)
  // =============================================
  console.log('\n📅 Creating Bookings...');

  const patientRahul = byEmail('rahul@patient.com');
  const patientSneha = byEmail('sneha@patient.com');
  const patientArjun = byEmail('arjun@patient.com');
  const patientPriyanka = byEmail('priyanka@patient.com');
  const patientMohammed = byEmail('mohammed@patient.com');
  const patientLakshmi = byEmail('lakshmi@patient.com');
  const patientRohan = byEmail('rohan@patient.com');
  const patientAnanya = byEmail('ananya@patient.com');

  const bookings = await db.$transaction([
    // === PENDING bookings (for receptionist approval testing) ===
    db.booking.create({
      data: {
        appointmentNo: 'APT-001',
        doctorId: docRajesh.id,
        userId: patientRahul.id,
        patientName: patientRahul.name,
        state: 'Maharashtra',
        city: 'Mumbai',
        bookingDate: d(1, 9, 30),
        disease: 'Chest Pain',
        description: 'Experiencing mild chest discomfort during morning walks since 3 days',
        gender: 'Male',
        age: 35,
        bloodGroup: 'B+',
        weight: 72,
        height: 170,
        status: 'Pending',
        timeSlot: '09:30',
        bookingMode: 'InPerson',
        bookingType: 'By Self',
        appointmentCharge: 800,
      },
    }),
    db.booking.create({
      data: {
        appointmentNo: 'APT-002',
        doctorId: docPriya.id,
        userId: patientSneha.id,
        patientName: patientSneha.name,
        state: 'Delhi',
        city: 'Delhi',
        bookingDate: d(1, 10, 20),
        disease: 'Skin Rash',
        description: 'Red itchy rash on arms and neck for 1 week',
        gender: 'Female',
        age: 28,
        bloodGroup: 'O+',
        weight: 58,
        height: 162,
        status: 'Pending',
        timeSlot: '10:20',
        bookingMode: 'InPerson',
        bookingType: 'By Self',
        appointmentCharge: 600,
      },
    }),
    db.booking.create({
      data: {
        appointmentNo: 'APT-003',
        doctorId: docAmit.id,
        userId: patientArjun.id,
        patientName: patientArjun.name,
        state: 'Maharashtra',
        city: 'Pune',
        bookingDate: d(2, 9, 0),
        disease: 'Knee Pain',
        description: 'Right knee pain for 2 months, worse after climbing stairs',
        gender: 'Male',
        age: 45,
        bloodGroup: 'A+',
        weight: 82,
        height: 175,
        status: 'Pending',
        timeSlot: '09:00',
        bookingMode: 'InPerson',
        bookingType: 'By Self',
        appointmentCharge: 1000,
      },
    }),

    // === APPROVED bookings (in doctor queue) ===
    db.booking.create({
      data: {
        appointmentNo: 'APT-004',
        doctorId: docRajesh.id,
        userId: patientPriyanka.id,
        patientName: patientPriyanka.name,
        state: 'Maharashtra',
        city: 'Mumbai',
        bookingDate: d(0, 10, 0),
        disease: 'Shortness of Breath',
        description: 'Difficulty breathing during exertion for 2 weeks',
        gender: 'Female',
        age: 50,
        bloodGroup: 'AB+',
        weight: 65,
        height: 158,
        status: 'Approve',
        timeSlot: '10:00',
        bookingMode: 'InPerson',
        bookingType: 'By Self',
        appointmentCharge: 800,
      },
    }),
    db.booking.create({
      data: {
        appointmentNo: 'APT-005',
        doctorId: docPriya.id,
        userId: patientMohammed.id,
        patientName: patientMohammed.name,
        state: 'Delhi',
        city: 'Delhi',
        bookingDate: d(0, 14, 0),
        disease: 'Acne',
        description: 'Persistent acne on face and back for 6 months',
        gender: 'Male',
        age: 22,
        bloodGroup: 'B-',
        weight: 70,
        height: 178,
        status: 'Approve',
        timeSlot: '14:00',
        bookingMode: 'VideoCall',
        videoRoomId: 'room-mohammed-priya-001',
        bookingType: 'By Self',
        appointmentCharge: 600,
      },
    }),

    // === VISITED bookings (completed with prescriptions) ===
    db.booking.create({
      data: {
        appointmentNo: 'APT-006',
        doctorId: docRajesh.id,
        userId: patientLakshmi.id,
        patientName: patientLakshmi.name,
        state: 'Maharashtra',
        city: 'Mumbai',
        bookingDate: d(-2, 9, 0),
        disease: 'Hypertension',
        description: 'High BP detected during routine checkup, headache and dizziness',
        gender: 'Female',
        age: 55,
        bloodGroup: 'O+',
        weight: 68,
        height: 155,
        status: 'Visited',
        timeSlot: '09:00',
        bookingMode: 'InPerson',
        bookingType: 'By Self',
        appointmentCharge: 800,
      },
    }),
    db.booking.create({
      data: {
        appointmentNo: 'APT-007',
        doctorId: docPriya.id,
        userId: patientRohan.id,
        patientName: patientRohan.name,
        state: 'Delhi',
        city: 'Delhi',
        bookingDate: d(-3, 11, 0),
        disease: 'Eczema',
        description: 'Dry, itchy, red patches on elbows and knees for 3 months',
        gender: 'Male',
        age: 30,
        bloodGroup: 'A-',
        weight: 75,
        height: 180,
        status: 'Visited',
        timeSlot: '11:00',
        bookingMode: 'InPerson',
        bookingType: 'By Self',
        appointmentCharge: 600,
      },
    }),
    db.booking.create({
      data: {
        appointmentNo: 'APT-008',
        doctorId: docAmit.id,
        userId: patientAnanya.id,
        patientName: patientAnanya.name,
        state: 'Maharashtra',
        city: 'Pune',
        bookingDate: d(-1, 10, 30),
        disease: 'Lower Back Pain',
        description: 'Chronic lower back pain for 6 months, radiating to left leg',
        gender: 'Female',
        age: 40,
        bloodGroup: 'B+',
        weight: 62,
        height: 165,
        status: 'Visited',
        timeSlot: '10:30',
        bookingMode: 'InPerson',
        bookingType: 'By Self',
        appointmentCharge: 1000,
      },
    }),

    // === FINISHED bookings ===
    db.booking.create({
      data: {
        appointmentNo: 'APT-009',
        doctorId: docRajesh.id,
        userId: patientRahul.id,
        patientName: patientRahul.name,
        state: 'Maharashtra',
        city: 'Mumbai',
        bookingDate: d(-7, 10, 0),
        disease: 'Palpitations',
        description: 'Irregular heartbeat sensation, especially at night',
        gender: 'Male',
        age: 35,
        bloodGroup: 'B+',
        weight: 72,
        height: 170,
        status: 'Finish',
        timeSlot: '10:00',
        bookingMode: 'InPerson',
        bookingType: 'By Self',
        appointmentCharge: 800,
      },
    }),

    // === CANCELED bookings ===
    db.booking.create({
      data: {
        appointmentNo: 'APT-010',
        doctorId: docRajesh.id,
        userId: patientSneha.id,
        patientName: patientSneha.name,
        state: 'Delhi',
        city: 'Delhi',
        bookingDate: d(-5, 9, 30),
        disease: 'Dizziness',
        description: 'Frequent dizzy spells in the morning',
        gender: 'Female',
        age: 28,
        bloodGroup: 'O+',
        status: 'Canceled',
        timeSlot: '09:30',
        bookingMode: 'InPerson',
        bookingType: 'By Self',
        appointmentCharge: 800,
      },
    }),

    // === WALK-IN booking (no userId) ===
    db.booking.create({
      data: {
        appointmentNo: 'APT-011',
        doctorId: docRajesh.id,
        userId: null,
        patientName: 'Suresh Pandey',
        state: 'Maharashtra',
        city: 'Mumbai',
        bookingDate: d(0, 11, 0),
        disease: 'Fever',
        description: 'High fever since yesterday evening, body ache',
        gender: 'Male',
        age: 42,
        bloodGroup: 'AB-',
        weight: 78,
        height: 172,
        status: 'Approve',
        timeSlot: '11:00',
        bookingMode: 'InPerson',
        bookingType: 'By Receptionist',
        appointmentCharge: 800,
      },
    }),
  ]);
  console.log(`✅ Created ${bookings.length} bookings (3 Pending, 3 Approved, 3 Visited, 1 Finish, 1 Canceled, 1 Walk-in)`);

  // =============================================
  // 14. PRESCRIPTIONS (for Visited bookings)
  // =============================================
  console.log('\n📝 Creating Prescriptions...');

  const bookingLakshmi = bookings[5]; // APT-006 Visited
  const bookingRohan = bookings[6];   // APT-007 Visited
  const bookingAnanya = bookings[7];  // APT-008 Visited
  const bookingRahulFinish = bookings[8]; // APT-009 Finish

  const prescriptions = await db.$transaction([
    // Prescription for Lakshmi (Dr. Rajesh - Hypertension)
    db.prescription.create({
      data: {
        bookingId: bookingLakshmi.id,
        doctorId: docRajesh.id,
        patientName: 'Lakshmi Nair',
        patientAge: '55',
        disease: 'Hypertension',
        weight: '68 kg',
        bp: '160/100 mmHg',
        temperature: '98.6°F',
        description: 'Essential hypertension. Start with combination therapy. Monitor BP at home daily. Follow-up after 2 weeks.',
      },
    }),
    // Prescription for Rohan (Dr. Priya - Eczema)
    db.prescription.create({
      data: {
        bookingId: bookingRohan.id,
        doctorId: docPriya.id,
        patientName: 'Rohan Kulkarni',
        patientAge: '30',
        disease: 'Eczema',
        weight: '75 kg',
        bp: '120/80 mmHg',
        temperature: '98.4°F',
        description: 'Chronic eczema with flare-up. Avoid hot water baths. Use moisturizer frequently. Follow-up in 3 weeks.',
      },
    }),
    // Prescription for Ananya (Dr. Amit - Lower Back Pain)
    db.prescription.create({
      data: {
        bookingId: bookingAnanya.id,
        doctorId: docAmit.id,
        patientName: 'Ananya Bose',
        patientAge: '40',
        disease: 'Lower Back Pain with Sciatica',
        weight: '62 kg',
        bp: '118/76 mmHg',
        temperature: '98.6°F',
        description: 'L4-L5 disc herniation suspected. MRI recommended. Physiotherapy for 4 weeks. Avoid heavy lifting. Review with MRI report.',
      },
    }),
    // Prescription for Rahul (Dr. Rajesh - Palpitations, Finished)
    db.prescription.create({
      data: {
        bookingId: bookingRahulFinish.id,
        doctorId: docRajesh.id,
        patientName: 'Rahul Verma',
        patientAge: '35',
        disease: 'Palpitations - Anxiety related',
        weight: '72 kg',
        bp: '130/85 mmHg',
        temperature: '98.4°F',
        description: 'Sinus tachycardia, likely anxiety-related. ECG normal. Reduce caffeine. Practice breathing exercises. Follow-up in 1 month.',
      },
    }),
  ]);
  console.log(`✅ Created ${prescriptions.length} prescriptions`);

  // Prescription medicines
  console.log('\n💊 Adding Prescription medicines...');

  await db.$transaction([
    // For Lakshmi (Hypertension)
    ...[
      { prescriptionId: prescriptions[0].id, medicine: 'Amlodipine 5mg', morning: true, afternoon: false, evening: false, tab: 1, dose: 'Once daily morning', description: 'Take after breakfast' },
      { prescriptionId: prescriptions[0].id, medicine: 'Metoprolol 25mg', morning: true, afternoon: true, evening: false, tab: 1, dose: 'Twice daily', description: 'Monitor heart rate' },
      { prescriptionId: prescriptions[0].id, medicine: 'Aspirin 75mg', morning: true, afternoon: false, evening: false, tab: 1, dose: 'Once daily', description: 'Blood thinner' },
    ].map(m => db.pMedicine.create({ data: { ...m, createdById: byEmail('rajesh@doctorooms.com').id } })),

    // For Rohan (Eczema)
    ...[
      { prescriptionId: prescriptions[1].id, medicine: 'Betamethasone 0.1% Cream', morning: true, afternoon: true, evening: true, tab: 1, dose: 'Apply twice daily on affected areas', description: 'Thin layer only, for 2 weeks max' },
      { prescriptionId: prescriptions[1].id, medicine: 'Cetirizine 10mg', morning: true, afternoon: false, evening: false, tab: 1, dose: 'Once daily at night', description: 'For itching relief' },
      { prescriptionId: prescriptions[1].id, medicine: 'Moisturizer (Ceramide-based)', morning: true, afternoon: true, evening: true, tab: 1, dose: 'Apply liberally 3-4 times daily', description: 'CeraVe or equivalent' },
    ].map(m => db.pMedicine.create({ data: { ...m, createdById: byEmail('priya@doctorooms.com').id } })),

    // For Ananya (Lower Back Pain)
    ...[
      { prescriptionId: prescriptions[2].id, medicine: 'Ibuprofen 400mg', morning: true, afternoon: true, evening: true, tab: 1, dose: '3 times daily with food', description: 'For 5 days only' },
      { prescriptionId: prescriptions[2].id, medicine: 'Pantoprazole 40mg', morning: true, afternoon: false, evening: false, tab: 1, dose: 'Once daily before breakfast', description: 'Gastroprotection' },
      { prescriptionId: prescriptions[2].id, medicine: 'Thiocolchicoside 8mg', morning: true, afternoon: true, evening: false, tab: 1, dose: 'Twice daily for muscle spasm', description: 'For 7 days' },
      { prescriptionId: prescriptions[2].id, medicine: 'Calcium + D3 Tablet', morning: true, afternoon: false, evening: false, tab: 1, dose: 'Once daily', description: 'Long term supplement' },
    ].map(m => db.pMedicine.create({ data: { ...m, createdById: byEmail('amit@doctorooms.com').id } })),

    // For Rahul (Palpitations)
    ...[
      { prescriptionId: prescriptions[3].id, medicine: 'Propranolol 20mg', morning: true, afternoon: false, evening: false, tab: 1, dose: 'Once daily morning', description: 'Beta blocker for palpitations' },
    ].map(m => db.pMedicine.create({ data: { ...m, createdById: byEmail('rajesh@doctorooms.com').id } })),
  ]);

  // Prescription labels
  const labelData = [
    // Lakshmi labels
    { prescriptionId: prescriptions[0].id, label: 'BP (mmHg)', value: '160/100', labelUnit: 'mmHg', createdById: byEmail('rajesh@doctorooms.com').id },
    { prescriptionId: prescriptions[0].id, label: 'Pulse (/min)', value: '88', labelUnit: '/min', createdById: byEmail('rajesh@doctorooms.com').id },
    { prescriptionId: prescriptions[0].id, label: 'Weight (kg)', value: '68', labelUnit: 'kg', createdById: byEmail('rajesh@doctorooms.com').id },
    { prescriptionId: prescriptions[0].id, label: 'Blood Sugar (mg/dL)', value: '125', labelUnit: 'mg/dL', createdById: byEmail('rajesh@doctorooms.com').id },
    // Rohan labels
    { prescriptionId: prescriptions[1].id, label: 'Skin Type', value: 'Dry-Sensitive', labelUnit: '', createdById: byEmail('priya@doctorooms.com').id },
    { prescriptionId: prescriptions[1].id, label: 'Allergy History', value: 'Dust mite allergy', labelUnit: '', createdById: byEmail('priya@doctorooms.com').id },
    // Ananya labels
    { prescriptionId: prescriptions[2].id, label: 'Pain Scale (1-10)', value: '7', labelUnit: '/10', createdById: byEmail('amit@doctorooms.com').id },
    { prescriptionId: prescriptions[2].id, label: 'Range of Motion', value: 'Limited flexion', labelUnit: '', createdById: byEmail('amit@doctorooms.com').id },
    { prescriptionId: prescriptions[2].id, label: 'Tenderness', value: 'L4-L5 positive', labelUnit: '', createdById: byEmail('amit@doctorooms.com').id },
    // Rahul labels
    { prescriptionId: prescriptions[3].id, label: 'BP (mmHg)', value: '130/85', labelUnit: 'mmHg', createdById: byEmail('rajesh@doctorooms.com').id },
    { prescriptionId: prescriptions[3].id, label: 'Pulse (/min)', value: '92', labelUnit: '/min', createdById: byEmail('rajesh@doctorooms.com').id },
  ];

  await db.$transaction(labelData.map((item) => db.pLabel.create({ data: item })));

  // Prescription suggestions
  const suggestionData = [
    { prescriptionId: prescriptions[0].id, question: 'Reduce salt intake to <5g/day', suggestions: 'Avoid processed foods, pickles, papad', createdById: byEmail('rajesh@doctorooms.com').id },
    { prescriptionId: prescriptions[0].id, question: 'Exercise regularly', suggestions: '30 min brisk walk daily, avoid heavy weights', createdById: byEmail('rajesh@doctorooms.com').id },
    { prescriptionId: prescriptions[1].id, question: 'Skincare routine', suggestions: 'Lukewarm baths, pat dry, apply moisturizer within 3 min', createdById: byEmail('priya@doctorooms.com').id },
    { prescriptionId: prescriptions[1].id, question: 'Avoid triggers', suggestions: 'Avoid woolen clothes, harsh soaps, extreme temperatures', createdById: byEmail('priya@doctorooms.com').id },
    { prescriptionId: prescriptions[2].id, question: 'Physiotherapy', suggestions: 'Core strengthening, hamstring stretches, hot fomentation', createdById: byEmail('amit@doctorooms.com').id },
    { prescriptionId: prescriptions[2].id, question: 'Posture correction', suggestions: 'Ergonomic chair, avoid sitting >30 min, use lumbar support', createdById: byEmail('amit@doctorooms.com').id },
    { prescriptionId: prescriptions[3].id, question: 'Lifestyle changes', suggestions: 'Reduce caffeine to 1 cup/day, practice 4-7-8 breathing, sleep 7-8 hrs', createdById: byEmail('rajesh@doctorooms.com').id },
  ];
  await db.$transaction(suggestionData.map((item) => db.pSuggestion.create({ data: item })));

  // Diagnosis tables
  await db.$transaction([
    db.pDignoTable.create({
      data: {
        prescriptionId: prescriptions[0].id,
        rows: 3, cols: 2,
        headerLabel: JSON.stringify(['Test', 'Result']),
        colsLabel: JSON.stringify(['ECG', 'Normal sinus rhythm']),
        footerLabel: JSON.stringify(['Chest X-Ray', 'Normal']),
        extraLabel: 'Blood report awaited',
        createdById: byEmail('rajesh@doctorooms.com').id,
      },
    }),
    db.pDignoTable.create({
      data: {
        prescriptionId: prescriptions[2].id,
        rows: 3, cols: 2,
        headerLabel: JSON.stringify(['Investigation', 'Finding']),
        colsLabel: JSON.stringify(['X-Ray LS Spine', 'Reduced L4-L5 disc space']),
        footerLabel: JSON.stringify(['MRI LS Spine', 'Recommended']),
        extraLabel: 'MRI to confirm disc herniation',
        createdById: byEmail('amit@doctorooms.com').id,
      },
    }),
  ]);
  console.log('✅ Created prescription items (11 medicines, 11 labels, 7 suggestions, 2 diagnosis tables)');

  // =============================================
  // 15. RATINGS
  // =============================================
  console.log('\n⭐ Creating Doctor ratings...');

  await db.$transaction([
    db.doctorRating.create({
      data: {
        patientId: patientRahul.id,
        doctorId: byEmail('rajesh@doctorooms.com').id,
        bookingId: bookingRahulFinish.id,
        star: 5,
        consultationRating: 5,
        waitTimeRating: 4,
        staffRating: 5,
        review: 'Excellent doctor! Very thorough and patient. Explained everything clearly.',
        wouldRecommend: true,
        isAnonymous: false,
      },
    }),
    db.doctorRating.create({
      data: {
        patientId: patientLakshmi.id,
        doctorId: byEmail('rajesh@doctorooms.com').id,
        bookingId: bookingLakshmi.id,
        star: 4,
        consultationRating: 5,
        waitTimeRating: 3,
        staffRating: 4,
        review: 'Very knowledgeable. Slightly long wait but worth it.',
        wouldRecommend: true,
        isAnonymous: false,
      },
    }),
    db.doctorRating.create({
      data: {
        patientId: patientRohan.id,
        doctorId: byEmail('priya@doctorooms.com').id,
        bookingId: bookingRohan.id,
        star: 4,
        consultationRating: 4,
        waitTimeRating: 5,
        staffRating: 4,
        review: 'Good treatment. Skin is already improving.',
        wouldRecommend: true,
        isAnonymous: false,
      },
    }),
    db.doctorRating.create({
      data: {
        patientId: patientAnanya.id,
        doctorId: byEmail('amit@doctorooms.com').id,
        bookingId: bookingAnanya.id,
        star: 5,
        consultationRating: 5,
        waitTimeRating: 4,
        staffRating: 5,
        review: 'Dr. Amit is amazing! Very caring and explained the MRI need clearly.',
        wouldRecommend: true,
        isAnonymous: false,
      },
    }),
  ]);
  console.log('✅ Created 4 doctor ratings');

  // =============================================
  // 16. NOTIFICATIONS
  // =============================================
  console.log('\n🔔 Creating Notifications...');

  await db.$transaction([
    // For Rahul - booking pending
    db.notification.create({ data: { userId: patientRahul.id, title: 'Appointment Booked', message: 'Your appointment with Dr. Rajesh Sharma is pending approval. You will be notified once confirmed.', status: 'UNREAD' } }),
    // For Sneha - booking pending
    db.notification.create({ data: { userId: patientSneha.id, title: 'Appointment Booked', message: 'Your appointment with Dr. Priya Singh is pending approval.', status: 'UNREAD' } }),
    // For Arjun - booking pending
    db.notification.create({ data: { userId: patientArjun.id, title: 'Appointment Booked', message: 'Your appointment with Dr. Amit Patel is pending approval.', status: 'UNREAD' } }),
    // For Priyanka - booking approved
    db.notification.create({ data: { userId: patientPriyanka.id, title: 'Appointment Approved', message: 'Your appointment with Dr. Rajesh Sharma has been approved. Please arrive 15 minutes early.', status: 'UNREAD' } }),
    // For Mohammed - booking approved
    db.notification.create({ data: { userId: patientMohammed.id, title: 'Appointment Approved', message: 'Your video consultation with Dr. Priya Singh is approved. Link will be shared before the appointment.', status: 'UNREAD' } }),
    // For Lakshmi - prescription ready
    db.notification.create({ data: { userId: patientLakshmi.id, title: 'Prescription Ready', message: 'Your prescription from Dr. Rajesh Sharma is ready. Please collect your medicines from the pharmacy.', status: 'READ' } }),
    // For Rohan - prescription ready
    db.notification.create({ data: { userId: patientRohan.id, title: 'Prescription Ready', message: 'Your prescription from Dr. Priya Singh is ready.', status: 'READ' } }),
    // For Ananya - prescription ready
    db.notification.create({ data: { userId: patientAnanya.id, title: 'Prescription Ready', message: 'Your prescription from Dr. Amit Patel is ready. MRI has been recommended.', status: 'READ' } }),
    // For Dr. Rajesh - new pending bookings
    db.notification.create({ data: { userId: byEmail('rajesh@doctorooms.com').id, title: 'New Booking Request', message: 'Rahul Verma has booked an appointment for tomorrow 9:30 AM. Awaiting receptionist approval.', status: 'UNREAD' } }),
    db.notification.create({ data: { userId: byEmail('rajesh@doctorooms.com').id, title: 'Walk-in Patient', message: 'Suresh Pandey (walk-in) has been added to your queue for today 11:00 AM.', status: 'UNREAD' } }),
    // For receptionist Meera - pending approvals
    db.notification.create({ data: { userId: byEmail('meera@doctorooms.com').id, title: 'Pending Approvals', message: 'You have 1 pending appointment request from Rahul Verma. Please review and approve.', status: 'UNREAD' } }),
    // For receptionist Pooja - pending approvals
    db.notification.create({ data: { userId: byEmail('pooja@doctorooms.com').id, title: 'Pending Approvals', message: 'You have 1 pending appointment request from Sneha Reddy. Please review.', status: 'UNREAD' } }),
    // For receptionist Ritu - pending approvals
    db.notification.create({ data: { userId: byEmail('ritu@doctorooms.com').id, title: 'Pending Approvals', message: 'You have 1 pending appointment request from Arjun Mehta. Please review.', status: 'UNREAD' } }),
  ]);
  console.log('✅ Created 13 notifications');

  // =============================================
  // 17. BLOG POSTS
  // =============================================
  console.log('\n📰 Creating Blog posts...');

  await db.$transaction([
    db.post.create({
      data: {
        title: '10 Tips for a Healthy Heart',
        permalink: '10-tips-healthy-heart',
        content: 'Heart disease is the leading cause of death globally. Here are 10 practical tips to keep your heart healthy: 1. Exercise regularly, 2. Eat a balanced diet, 3. Quit smoking, 4. Manage stress, 5. Get enough sleep, 6. Monitor blood pressure, 7. Control cholesterol, 8. Maintain healthy weight, 9. Limit alcohol, 10. Get regular checkups.',
        blogImg: '/img/blog-heart-health.jpg',
        type: 'Blog',
        status: 'Published',
        authorId: byEmail('rajesh@doctorooms.com').id,
      },
    }),
    db.post.create({
      data: {
        title: 'Understanding Eczema: Causes and Treatment',
        permalink: 'understanding-eczema',
        content: 'Eczema is a chronic skin condition that affects millions. Learn about the causes, triggers, and latest treatment options including topical steroids, immunomodulators, and biologics.',
        blogImg: '/img/blog-eczema.jpg',
        type: 'Blog',
        status: 'Published',
        authorId: byEmail('priya@doctorooms.com').id,
      },
    }),
    db.post.create({
      data: {
        title: 'When to See an Orthopedic Doctor',
        permalink: 'when-to-see-orthopedic',
        content: 'Many people ignore joint pain until it becomes severe. Learn the warning signs that indicate you should consult an orthopedic specialist: persistent pain, swelling, reduced mobility, joint instability, and pain that interferes with daily activities.',
        blogImg: '/img/blog-ortho.jpg',
        type: 'Blog',
        status: 'Draft',
        authorId: byEmail('amit@doctorooms.com').id,
      },
    }),
    db.post.create({
      data: {
        title: 'New Cardiac Treatment Guidelines Released',
        permalink: 'new-cardiac-guidelines-2025',
        content: 'The American Heart Association has released updated guidelines for cardiac treatment. Key changes include new blood pressure targets and revised recommendations for statin therapy.',
        type: 'News',
        status: 'Published',
        authorId: byEmail('rajesh@doctorooms.com').id,
      },
    }),
  ]);
  console.log('✅ Created 4 blog posts');

  // =============================================
  // 18. SLIDERS
  // =============================================
  console.log('\n🖼️ Creating Sliders...');

  await db.$transaction([
    db.slider.create({ data: { sliderImage: '/img/slider1.jpg', position: 1, status: 'Active', title: 'Book Doctor Appointments Online', subtitle: 'Skip the queue, book from home', link: '/dashboard/patient' } }),
    db.slider.create({ data: { sliderImage: '/img/slider2.jpg', position: 2, status: 'Active', title: 'Expert Doctors Near You', subtitle: 'Find specialists in your city', link: '/search' } }),
    db.slider.create({ data: { sliderImage: '/img/slider3.jpg', position: 3, status: 'Active', title: 'Video Consultations Available', subtitle: 'Consult doctors from the comfort of your home', link: '/dashboard/patient' } }),
  ]);
  console.log('✅ Created 3 sliders');

  // =============================================
  // 19. HOSPITAL INQUIRIES
  // =============================================
  console.log('\n📬 Creating Hospital inquiries...');

  await db.$transaction([
    db.hospitalInquiry.create({
      data: {
        name: 'Vikram Singh',
        email: 'vikram.singh@email.com',
        phone: '9800000100',
        subject: 'Cardiology Department Timing',
        message: 'What are the OPD timings for the cardiology department? I want to visit for my father\'s follow-up.',
        status: 'Pending',
        userId: null,
      },
    }),
    db.hospitalInquiry.create({
      data: {
        name: 'Rahul Verma',
        email: 'rahul@patient.com',
        phone: '9800000001',
        subject: 'Insurance Empanelment',
        message: 'Do you accept Star Health Insurance for cardiac procedures?',
        status: 'Pending',
        userId: patientRahul.id,
      },
    }),
  ]);
  console.log('✅ Created 2 hospital inquiries');

  // =============================================
  // 20. MEDICAL DOCUMENTS (for patients)
  // =============================================
  console.log('\n📁 Creating Medical documents...');

  await db.$transaction([
    db.medicalDocument.create({ data: { patientId: patientLakshmi.id, title: 'Blood Report - June 2025', category: 'Lab Report', fileUrl: '/docs/lakshmi_blood_june2025.pdf', fileName: 'blood_report_june2025.pdf', fileSize: 245000, mimeType: 'application/pdf', description: 'Complete blood count and lipid profile' } }),
    db.medicalDocument.create({ data: { patientId: patientLakshmi.id, title: 'ECG Report', category: 'Test Report', fileUrl: '/docs/lakshmi_ecg.pdf', fileName: 'ecg_report.pdf', fileSize: 180000, mimeType: 'application/pdf', description: '12-lead ECG, normal sinus rhythm' } }),
    db.medicalDocument.create({ data: { patientId: patientAnanya.id, title: 'X-Ray LS Spine', category: 'Imaging', fileUrl: '/docs/ananya_xray_ls.pdf', fileName: 'xray_ls_spine.pdf', fileSize: 520000, mimeType: 'application/pdf', description: 'X-ray showing reduced L4-L5 disc space' } }),
    db.medicalDocument.create({ data: { patientId: patientRahul.id, title: 'Previous Prescription', category: 'Prescription', fileUrl: '/docs/rahul_prev_rx.pdf', fileName: 'prev_prescription.pdf', fileSize: 120000, mimeType: 'application/pdf', description: 'Prescription from last visit' } }),
    db.medicalDocument.create({ data: { patientId: patientRohan.id, title: 'Skin Allergy Test', category: 'Lab Report', fileUrl: '/docs/rohan_allergy_test.pdf', fileName: 'allergy_test.pdf', fileSize: 310000, mimeType: 'application/pdf', description: 'Patch test results showing dust mite allergy' } }),
  ]);
  console.log('✅ Created 5 medical documents');

  // =============================================
  // 21. CHAT MESSAGES (for active bookings)
  // =============================================
  console.log('\n💬 Creating Chat messages...');

  await db.$transaction([
    // Chat between Priyanka and Dr. Rajesh receptionist for approved booking
    db.bookingChat.create({ data: { bookingId: bookings[3].id, fromId: patientPriyanka.id, toId: byEmail('meera@doctorooms.com').id, message: 'Hi, I have uploaded my previous reports. Can you confirm my appointment?', status: 'READ' } }),
    db.bookingChat.create({ data: { bookingId: bookings[3].id, fromId: byEmail('meera@doctorooms.com').id, toId: patientPriyanka.id, message: 'Yes, your appointment is confirmed for today at 10:00 AM. Please bring your ID and insurance card.', status: 'READ' } }),
    db.bookingChat.create({ data: { bookingId: bookings[3].id, fromId: patientPriyanka.id, toId: byEmail('meera@doctorooms.com').id, message: 'Thank you! I will be there on time.', status: 'READ' } }),
  ]);
  console.log('✅ Created 3 chat messages');

  // =============================================
  // DONE!
  // =============================================
  console.log('\n🎉 ============================================');
  console.log('   SEEDING COMPLETE!');
  console.log('   ============================================');
  console.log(`   Users:            25 (1 admin + 2 hospitals + 4 doctors + 3 receptionists + 3 assistants + 3 pharmacists + 8 patients + 2 pending patients + 1 blocked)`);
  console.log(`   Doctors:          3 (with full profiles)`);
  console.log(`   Doctor Teams:     9 (receptionist + assistant + pharmacist per doctor)`);
  console.log(`   Schedules:        20 (across all doctors)`);
  console.log(`   Medicines:        21 (doctor-specific)`);
  console.log(`   Bookings:         11 (3 Pending, 3 Approved, 3 Visited, 1 Finish, 1 Canceled, 1 Walk-in)`);
  console.log(`   Prescriptions:    4 (with medicines, labels, suggestions, diagnosis tables)`);
  console.log(`   Ratings:          4`);
  console.log(`   Notifications:    13`);
  console.log(`   Blog Posts:       4`);
  console.log(`   Disease Masters:  20`);
  console.log(`   Doctor Types:     15`);
  console.log(`   Medical Docs:     5`);
  console.log(`   Chat Messages:    3`);
  console.log('   ============================================\n');
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => db.$disconnect());
