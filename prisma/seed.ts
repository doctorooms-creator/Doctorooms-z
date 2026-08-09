import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

// Use a fresh PrismaClient without query logging for faster seed
const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============ CLEAN EXISTING DATA (except sliders) ============
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
    db.user.deleteMany(),
  ]);
  console.log('✅ Existing data cleaned (sliders preserved)');

  // ============ PASSWORD ============
  const password = await hash('123456', 10);

  // ============ HELPER ============
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);
  const daysFromNow = (n: number) => new Date(now.getTime() + n * 86400000);

  // ============================================================
  // 1. DOCTOR TYPE MASTER (5 entries)
  // ============================================================
  await db.doctorTypeMaster.createMany({
    data: [
      { type: 'MD [GENERAL MEDICINE]', status: 'Active' },
      { type: 'DM [CARDIOLOGY]', status: 'Active' },
      { type: 'MD [DERMATOLOGY]', status: 'Active' },
      { type: 'MS (ORTHOPAEDICS)', status: 'Active' },
      { type: 'MD [PEDIATRICS]', status: 'Active' },
    ],
  });
  console.log('✅ 5 Doctor Type Master entries created');

  // ============================================================
  // 2. DISEASE MASTER (10 entries)
  // ============================================================
  await db.diseaseMaster.createMany({
    data: [
      { name: 'Fever', status: 'Active' },
      { name: 'Headache & Migraine', status: 'Active' },
      { name: 'Cough & Cold', status: 'Active' },
      { name: 'Diabetes', status: 'Active' },
      { name: 'Hypertension', status: 'Active' },
      { name: 'Heart Disease', status: 'Active' },
      { name: 'Skin Allergy', status: 'Active' },
      { name: 'Back Pain', status: 'Active' },
      { name: 'Thyroid Disorder', status: 'Active' },
      { name: 'Eye Infection', status: 'Active' },
    ],
  });
  console.log('✅ 10 Disease Master entries created');

  // ============================================================
  // 3. HOSPITALS (2) - create first so doctors can reference them
  // ============================================================
  const hospitalUser1 = await db.user.create({
    data: {
      name: 'City General Hospital',
      email: 'city.hospital@doctorooms.com',
      password,
      role: 'hospital',
      status: 'Active',
      gender: 'Male',
      mobileNo: '7777777701',
      profileImg: 'default.png',
    },
  });

  const hospitalUser2 = await db.user.create({
    data: {
      name: 'Apollo Wellness Center',
      email: 'apollo.wellness@doctorooms.com',
      password,
      role: 'hospital',
      status: 'Active',
      gender: 'Male',
      mobileNo: '7777777702',
      profileImg: 'default.png',
    },
  });

  const hospital1 = await db.hospital.create({
    data: {
      userId: hospitalUser1.id,
      hospitalName: 'City General Hospital',
      address: '100, Marine Drive, Churchgate',
      city: 'Mumbai',
      state: 'Maharashtra',
      contactNo: '7777777701',
      lat: 18.9437,
      longi: 72.8235,
      gallery: '[]',
    },
  });

  const hospital2 = await db.hospital.create({
    data: {
      userId: hospitalUser2.id,
      hospitalName: 'Apollo Wellness Center',
      address: '45, Connaught Place, Central Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      contactNo: '7777777702',
      lat: 28.6315,
      longi: 77.2167,
      gallery: '[]',
    },
  });
  console.log('✅ 2 Hospitals created');

  // ============================================================
  // 4. DOCTORS (8) - with User + Doctor profile
  // ============================================================
  const doctorData = [
    {
      name: 'Dr. Rajesh Sharma',
      email: 'rajesh.sharma@doctorooms.com',
      gender: 'Male',
      mobileNo: '9898989801',
      specialization: 'Cardiology, Interventional Cardiology',
      doctorType: 'DM [CARDIOLOGY]',
      description: 'Senior cardiologist with 18+ years of experience in interventional cardiology and heart failure management.',
      education: 'MBBS, MD, DM (Cardiology) - PGI Chandigarh',
      experience: '18+ Years',
      fees: 800,
      emergencyCharge: 1500,
      isEmergency: true,
      address: '123, Linking Road, Bandra',
      city: 'Mumbai',
      state: 'Maharashtra',
      contactNo: '9898989801',
      phoneNo: '022-26401234',
      lat: 19.0596,
      longi: 72.8295,
      hospitalId: hospital1.id, // linked to hospital
    },
    {
      name: 'Dr. Priya Patel',
      email: 'priya.patel@doctorooms.com',
      gender: 'Female',
      mobileNo: '9898989802',
      specialization: 'Dermatology, Cosmetic Dermatology',
      doctorType: 'MD [DERMATOLOGY]',
      description: 'Expert dermatologist specializing in skin allergies, acne treatment, and cosmetic procedures.',
      education: 'MBBS, MD (Dermatology) - AIIMS Delhi',
      experience: '12+ Years',
      fees: 500,
      emergencyCharge: 0,
      isEmergency: false,
      address: '45, Hauz Khas Village',
      city: 'New Delhi',
      state: 'Delhi',
      contactNo: '9898989802',
      lat: 28.5494,
      longi: 77.2001,
      hospitalId: null,
    },
    {
      name: 'Dr. Amit Kumar',
      email: 'amit.kumar@doctorooms.com',
      gender: 'Male',
      mobileNo: '9898989803',
      specialization: 'Pediatrics, Neonatal Care',
      doctorType: 'MD [PEDIATRICS]',
      description: 'Compassionate pediatrician with expertise in newborn care and childhood vaccinations.',
      education: 'MBBS, MD (Pediatrics) - St. Johns Medical College',
      experience: '10+ Years',
      fees: 400,
      emergencyCharge: 800,
      isEmergency: false,
      address: '78, Koramangala 4th Block',
      city: 'Bangalore',
      state: 'Karnataka',
      contactNo: '9898989803',
      lat: 12.9352,
      longi: 77.6245,
      hospitalId: null,
    },
    {
      name: 'Dr. Sneha Reddy',
      email: 'sneha.reddy@doctorooms.com',
      gender: 'Female',
      mobileNo: '9898989804',
      specialization: 'Orthopedics, Sports Medicine',
      doctorType: 'MS (ORTHOPAEDICS)',
      description: 'Orthopedic specialist with focus on joint replacement, sports injuries, and fracture management.',
      education: 'MBBS, MS (Orthopaedics) - Madras Medical College',
      experience: '15+ Years',
      fees: 600,
      emergencyCharge: 1200,
      isEmergency: false,
      address: '56, Anna Nagar East',
      city: 'Chennai',
      state: 'Tamil Nadu',
      contactNo: '9898989804',
      lat: 13.0867,
      longi: 80.2211,
      hospitalId: null,
    },
    {
      name: 'Dr. Vikram Singh',
      email: 'vikram.singh@doctorooms.com',
      gender: 'Male',
      mobileNo: '9898989805',
      specialization: 'General Medicine, Diabetes, Thyroid',
      doctorType: 'MD [GENERAL MEDICINE]',
      description: 'Experienced general physician with specialization in diabetes and thyroid disorder management.',
      education: 'MBBS, MD (General Medicine) - Osmania Medical College',
      experience: '14+ Years',
      fees: 300,
      emergencyCharge: 600,
      isEmergency: false,
      address: '90, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      contactNo: '9898989805',
      lat: 17.4326,
      longi: 78.4071,
      hospitalId: null,
    },
    {
      name: 'Dr. Anita Desai',
      email: 'anita.desai@doctorooms.com',
      gender: 'Female',
      mobileNo: '9898989806',
      specialization: 'ENT, Head & Neck Surgery',
      doctorType: 'MD [ENT]',
      description: 'ENT specialist known for minimally invasive sinus surgery and voice disorder treatment.',
      education: 'MBBS, MS (ENT) - KEM Hospital Mumbai',
      experience: '11+ Years',
      fees: 450,
      emergencyCharge: 0,
      isEmergency: false,
      address: '23, Salt Lake, Sector V',
      city: 'Kolkata',
      state: 'West Bengal',
      contactNo: '9898989806',
      lat: 22.5726,
      longi: 88.3639,
      hospitalId: null,
    },
    {
      name: 'Dr. Kavita Nair',
      email: 'kavita.nair@doctorooms.com',
      gender: 'Female',
      mobileNo: '9898989807',
      specialization: 'Ophthalmology, Retina Surgery',
      doctorType: 'MS (OPHTHALMOLOGY)',
      description: 'Leading ophthalmologist specializing in cataract surgery, LASIK, and retinal disorders.',
      education: 'MBBS, MS (Ophthalmology) - Aravind Eye Hospital',
      experience: '13+ Years',
      fees: 700,
      emergencyCharge: 0,
      isEmergency: false,
      address: '34, Andheri West, Lokhandwala',
      city: 'Mumbai',
      state: 'Maharashtra',
      contactNo: '9898989807',
      lat: 19.1364,
      longi: 72.8296,
      hospitalId: null,
    },
    {
      name: 'Dr. Suresh Menon',
      email: 'suresh.menon@doctorooms.com',
      gender: 'Male',
      mobileNo: '9898989808',
      specialization: 'Obstetrics, Gynaecology, Laparoscopy',
      doctorType: 'MS (OBSTETRICS & GYNAECOLOGY)',
      description: 'Renowned gynaecologist with expertise in high-risk pregnancies and laparoscopic surgeries.',
      education: 'MBBS, MS (OBG) - Bangalore Medical College',
      experience: '16+ Years',
      fees: 550,
      emergencyCharge: 1000,
      isEmergency: false,
      address: '67, Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      contactNo: '9898989808',
      lat: 12.9784,
      longi: 77.6408,
      hospitalId: hospital2.id, // linked to hospital
    },
  ];

  const doctorUsers: any[] = [];
  const doctors: any[] = [];

  for (const d of doctorData) {
    const user = await db.user.create({
      data: {
        name: d.name,
        email: d.email,
        password,
        role: 'doctor',
        status: 'Active',
        gender: d.gender,
        mobileNo: d.mobileNo,
        profileImg: 'default.png',
      },
    });
    doctorUsers.push(user);

    const doctor = await db.doctor.create({
      data: {
        userId: user.id,
        bookingDays: 180,
        dailyLimit: 50,
        doctorType: d.doctorType,
        specialization: d.specialization,
        description: d.description,
        education: d.education,
        experience: d.experience,
        fees: d.fees,
        emergencyCharge: d.emergencyCharge,
        isEmergency: d.isEmergency,
        address: d.address,
        city: d.city,
        state: d.state,
        contactNo: d.contactNo,
        phoneNo: d.phoneNo || '',
        lat: d.lat,
        longi: d.longi,
        hospitalId: d.hospitalId,
        awardAndRecognition: '',
        registrationDetail: `MCI Reg: ${Math.floor(10000 + Math.random() * 90000)}`,
        photos: '[]',
      },
    });
    doctors.push(doctor);
  }
  console.log('✅ 8 Doctors created (1 emergency, 2 linked to hospitals)');

  // ============================================================
  // 5. RECEPTIONISTS (3) - linked to doctors
  // ============================================================
  const receptionistData = [
    { name: 'Meera Joshi', email: 'meera.joshi@doctorooms.com', mobileNo: '8686868601', doctorIdx: 0 },
    { name: 'Pooja Sharma', email: 'pooja.sharma@doctorooms.com', mobileNo: '8686868602', doctorIdx: 3 },
    { name: 'Ritu Agarwal', email: 'ritu.agarwal@doctorooms.com', mobileNo: '8686868603', doctorIdx: 7 },
  ];

  for (const r of receptionistData) {
    const user = await db.user.create({
      data: {
        name: r.name,
        email: r.email,
        password,
        role: 'receptionist',
        status: 'Active',
        gender: 'Female',
        mobileNo: r.mobileNo,
        profileImg: 'default.png',
      },
    });
    await db.receptionist.create({
      data: {
        userId: user.id,
        doctorId: doctors[r.doctorIdx].id,
        address: '',
      },
    });
  }
  console.log('✅ 3 Receptionists created and linked to doctors');

  // ============================================================
  // 5b. ADMIN (1)
  // ============================================================
  const adminUser = await db.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@doctorooms.com',
      password,
      role: 'admin',
      status: 'Active',
      gender: 'Male',
      mobileNo: '9999999901',
      profileImg: 'default.png',
    },
  });
  console.log('✅ 1 Admin created');

  // ============================================================
  // 5c. ASSISTANTS (2) - linked to first 2 doctors
  // ============================================================
  const assistantData = [
    { name: 'Vikram Patel', email: 'vikram.p@doctorooms.com', gender: 'Male', mobileNo: '8888888801', doctorIdx: 0 },
    { name: 'Sanjay Kumar', email: 'sanjay.k@doctorooms.com', gender: 'Male', mobileNo: '8888888802', doctorIdx: 1 },
  ];
  for (const a of assistantData) {
    const user = await db.user.create({
      data: {
        name: a.name, email: a.email, password,
        role: 'assistant', status: 'Active',
        gender: a.gender, mobileNo: a.mobileNo, profileImg: 'default.png',
      },
    });
    await db.doctorAssistant.create({
      data: {
        userId: user.id,
        doctorId: doctors[a.doctorIdx].id,
        address: '',
      },
    });
  }
  console.log('✅ 2 Assistants created and linked to doctors');

  // ============================================================
  // 5d. PHARMACISTS (2) - linked to first 2 doctors
  // ============================================================
  const pharmacistData = [
    { name: 'Kavitha Devi', email: 'kavitha.d@doctorooms.com', gender: 'Female', mobileNo: '7777777701', doctorIdx: 0 },
    { name: 'Ramesh Gupta', email: 'ramesh.g@doctorooms.com', gender: 'Male', mobileNo: '7777777702', doctorIdx: 1 },
  ];
  for (const p of pharmacistData) {
    const user = await db.user.create({
      data: {
        name: p.name, email: p.email, password,
        role: 'pharmacist', status: 'Active',
        gender: p.gender, mobileNo: p.mobileNo, profileImg: 'default.png',
      },
    });
    await db.doctorPharmacist.create({
      data: {
        userId: user.id,
        doctorId: doctors[p.doctorIdx].id,
        address: '',
        dlNo: 'DL-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      },
    });
  }
  console.log('✅ 2 Pharmacists created and linked to doctors');

  // ============================================================
  // 6. PATIENTS (15)
  // ============================================================
  const patientData = [
    { name: 'Rahul Verma', email: 'rahul.v@doctorooms.com', gender: 'Male', mobileNo: '8787878701', city: 'Mumbai' },
    { name: 'Sneha Gupta', email: 'sneha.g@doctorooms.com', gender: 'Female', mobileNo: '8787878702', city: 'Delhi' },
    { name: 'Arjun Mehta', email: 'arjun.m@doctorooms.com', gender: 'Male', mobileNo: '8787878703', city: 'Bangalore' },
    { name: 'Pooja Iyer', email: 'pooja.i@doctorooms.com', gender: 'Female', mobileNo: '8787878704', city: 'Chennai' },
    { name: 'Vikas Reddy', email: 'vikas.r@doctorooms.com', gender: 'Male', mobileNo: '8787878705', city: 'Hyderabad' },
    { name: 'Ananya Banerjee', email: 'ananya.b@doctorooms.com', gender: 'Female', mobileNo: '8787878706', city: 'Kolkata' },
    { name: 'Rohit Kapoor', email: 'rohit.k@doctorooms.com', gender: 'Male', mobileNo: '8787878707', city: 'Mumbai' },
    { name: 'Divya Nair', email: 'divya.n@doctorooms.com', gender: 'Female', mobileNo: '8787878708', city: 'Bangalore' },
    { name: 'Manish Tiwari', email: 'manish.t@doctorooms.com', gender: 'Male', mobileNo: '8787878709', city: 'Delhi' },
    { name: 'Kavitha Sundaram', email: 'kavitha.s@doctorooms.com', gender: 'Female', mobileNo: '8787878710', city: 'Chennai' },
    { name: 'Siddharth Patel', email: 'siddharth.p@doctorooms.com', gender: 'Male', mobileNo: '8787878711', city: 'Hyderabad' },
    { name: 'Neha Sharma', email: 'neha.s@doctorooms.com', gender: 'Female', mobileNo: '8787878712', city: 'Kolkata' },
    { name: 'Amit Joshi', email: 'amit.j@doctorooms.com', gender: 'Male', mobileNo: '8787878713', city: 'Mumbai' },
    { name: 'Priya Das', email: 'priya.d@doctorooms.com', gender: 'Female', mobileNo: '8787878714', city: 'Bangalore' },
    { name: 'Karan Malhotra', email: 'karan.m@doctorooms.com', gender: 'Male', mobileNo: '8787878715', city: 'Delhi' },
  ];

  const patients: any[] = [];
  for (const p of patientData) {
    const user = await db.user.create({
      data: {
        name: p.name,
        email: p.email,
        password,
        role: 'patient',
        status: 'Active',
        gender: p.gender,
        mobileNo: p.mobileNo,
        profileImg: 'default.png',
      },
    });
    patients.push(user);
  }
  console.log('✅ 15 Patients created');

  // ============================================================
  // 7. DOCTOR SCHEDULES (5-6 days per doctor)
  // ============================================================
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (let i = 0; i < doctors.length; i++) {
    const daysForDoctor = allDays.slice(0, i % 2 === 0 ? 6 : 5);
    const startHour = 9 + (i % 3);
    for (const day of daysForDoctor) {
      await db.doctorSchedule.create({
        data: {
          doctorId: doctors[i].id,
          day,
          startTime: `${String(startHour).padStart(2, '0')}:00`,
          endTime: `${String(startHour + 5).padStart(2, '0')}:00`,
          slotDuration: i === 2 ? 20 : 30,
          timeSlots: '[]',
        },
      });
    }
  }
  console.log('✅ Doctor schedules created (5-6 days per doctor)');

  // ============================================================
  // 8. DOCTOR HOLIDAYS (2-3 per doctor, upcoming dates)
  // ============================================================
  const holidayRemarks = [
    'Personal leave', 'Conference attendance', 'Medical emergency',
    'Family function', 'Vacation', 'Training program',
  ];
  for (let i = 0; i < doctors.length; i++) {
    const numHolidays = 2 + (i % 2); // 2 or 3
    for (let h = 0; h < numHolidays; h++) {
      await db.doctorHoliday.create({
        data: {
          userId: doctors[i].id,
          date: daysFromNow(10 + i * 5 + h * 3),
          remark: holidayRemarks[(i + h) % holidayRemarks.length],
        },
      });
    }
  }
  console.log('✅ Doctor holidays created (2-3 per doctor)');

  // ============================================================
  // 9. DOCTOR MEDICINES (5-8 per doctor)
  // ============================================================
  const medicineNames = [
    'Paracetamol 500mg', 'Amoxicillin 250mg', 'Omeprazole 20mg', 'Metformin 500mg',
    'Amlodipine 5mg', 'Cetirizine 10mg', 'Ibuprofen 400mg', 'Azithromycin 500mg',
    'Pantoprazole 40mg', 'Losartan 50mg', 'Montelukast 10mg', 'Ciprofloxacin 500mg',
    'Diclofenac 50mg', 'Dolo 650', 'Allegra 120mg', 'Cetirizine 5mg',
    'Metoprolol 25mg', 'Aspirin 75mg', 'Atorvastatin 10mg', 'Pantoprazole 20mg',
  'Ranitidine 150mg', 'Domperidone 10mg', 'Cough Syrup', 'Vitamin D3 60K IU',
    'Calcium + Vitamin D3', 'Iron Supplement', 'Multivitamin', 'Antacid Gel',
    'Eye Drops', 'Ear Drops', 'Betadine Solution', 'Hydrogen Peroxide',
  ];

  const doseOptions = ['1-0-1', '1-0-0', '0-0-1', '1-1-1', '2-1-2', '1-1-0', 'After food', 'Before food', 'SOS'];

  for (let i = 0; i < doctors.length; i++) {
    const numMeds = 5 + (i % 4); // 5 to 8
    for (let m = 0; m < numMeds; m++) {
      const dose = doseOptions[(i + m) % doseOptions.length];
      await db.doctorMedicine.create({
        data: {
          name: medicineNames[(i * 4 + m) % medicineNames.length],
          morning: dose.includes('1') && dose[0] !== '0' ? 'After Food' : '',
          afternoon: dose.length >= 3 && dose[2] !== '0' ? 'After Food' : '',
          evening: dose.length >= 5 && dose[4] !== '0' ? 'After Food' : '',
          dose,
          tab: 1 + (m % 2),
          description: '',
          status: 'Active',
          userId: doctors[i].id,
          createdById: doctorUsers[i].id,
        },
      });
    }
  }
  console.log('✅ Doctor medicines created (5-8 per doctor)');

  // ============================================================
  // 10. BOOKINGS (40) - 10 Pending, 8 Approve, 10 Visited, 5 Finish, 4 Canceled, 3 Extend
  // ============================================================
  const diseases = ['Fever', 'Headache & Migraine', 'Cough & Cold', 'Diabetes', 'Hypertension', 'Heart Disease', 'Skin Allergy', 'Back Pain', 'Thyroid Disorder', 'Eye Infection'];
  const descriptions = [
    'Persistent symptoms for the past 3 days', 'Recurring issue, needs follow-up',
    'Routine check-up', 'Acute pain since yesterday', 'Chronic condition management',
    'Second opinion needed', 'Post-surgery follow-up', 'New symptom appeared',
    'Seasonal allergy flare-up', 'Medication review required',
  ];
  const timeSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const bookingStatuses: { status: string; count: number }[] = [
    { status: 'Pending', count: 10 },
    { status: 'Approve', count: 8 },
    { status: 'Visited', count: 10 },
    { status: 'Finish', count: 5 },
    { status: 'Canceled', count: 4 },
    { status: 'Extend', count: 3 },
  ];

  const bookings: any[] = [];
  let aptNo = 1;

  for (const group of bookingStatuses) {
    for (let i = 0; i < group.count; i++) {
      const doctorIdx = (aptNo - 1) % doctors.length;
      const patientIdx = (aptNo - 1) % patients.length;
      const doctor = doctors[doctorIdx];
      const patient = patients[patientIdx];
      const dayOffset = Math.floor((aptNo - 1) * 1.5);
      const bookingMode = aptNo % 3 === 0 ? 'VideoCall' : 'InPerson';

      const booking = await db.booking.create({
        data: {
          appointmentNo: `APT-${String(aptNo).padStart(3, '0')}`,
          doctorId: doctor.id,
          userId: patient.id,
          patientName: patient.name,
          gender: patient.gender,
          age: 20 + (aptNo % 30),
          disease: diseases[aptNo % diseases.length],
          description: descriptions[aptNo % descriptions.length],
          state: doctor.state,
          city: doctor.city,
          bloodGroup: bloodGroups[aptNo % bloodGroups.length],
          weight: 50 + (aptNo % 25),
          height: 150 + (aptNo % 30),
          status: group.status,
          bookingDate: daysAgo(dayOffset),
          timeSlot: timeSlots[aptNo % timeSlots.length],
          bookingMode,
          bookingType: 'By Self',
          appointmentCharge: doctor.fees,
          videoRoomId: bookingMode === 'VideoCall' ? `room-${aptNo}-${Date.now()}` : '',
        },
      });
      bookings.push(booking);
      aptNo++;
    }
  }
  console.log('✅ 40 Bookings created (10 Pending, 8 Approve, 10 Visited, 5 Finish, 4 Canceled, 3 Extend)');

  // ============================================================
  // 11. PRESCRIPTIONS (10) - for Visited/Finished bookings
  // ============================================================
  const visitedAndFinished = bookings.filter(
    (b) => b.status === 'Visited' || b.status === 'Finish'
  );

  const prescriptionData = [
    { bp: '120/80 mmHg', temp: '98.6°F', weight: '68 kg', disease: 'Fever' },
    { bp: '130/85 mmHg', temp: '99.1°F', weight: '55 kg', disease: 'Headache & Migraine' },
    { bp: '110/70 mmHg', temp: '98.4°F', weight: '72 kg', disease: 'Cough & Cold' },
    { bp: '140/90 mmHg', temp: '98.8°F', weight: '80 kg', disease: 'Hypertension' },
    { bp: '125/82 mmHg', temp: '98.5°F', weight: '60 kg', disease: 'Skin Allergy' },
    { bp: '118/76 mmHg', temp: '99.0°F', weight: '65 kg', disease: 'Diabetes' },
    { bp: '135/88 mmHg', temp: '98.7°F', weight: '75 kg', disease: 'Back Pain' },
    { bp: '122/78 mmHg', temp: '98.3°F', weight: '58 kg', disease: 'Thyroid Disorder' },
    { bp: '128/84 mmHg', temp: '98.9°F', weight: '70 kg', disease: 'Heart Disease' },
    { bp: '115/75 mmHg', temp: '98.6°F', weight: '63 kg', disease: 'Eye Infection' },
  ];

  const medSets = [
    [
      { medicine: 'Paracetamol 500mg', morning: true, afternoon: true, evening: true, tab: 1, dose: '1-1-1' },
      { medicine: 'Azithromycin 500mg', morning: true, afternoon: false, evening: false, tab: 1, dose: '1-0-0' },
      { medicine: 'Cetirizine 10mg', morning: true, afternoon: false, evening: true, tab: 1, dose: '1-0-1' },
    ],
    [
      { medicine: 'Ibuprofen 400mg', morning: true, afternoon: false, evening: true, tab: 1, dose: '1-0-1' },
      { medicine: 'Omeprazole 20mg', morning: true, afternoon: false, evening: false, tab: 1, dose: '1-0-0' },
    ],
    [
      { medicine: 'Cetirizine 10mg', morning: true, afternoon: false, evening: true, tab: 1, dose: '1-0-1' },
      { medicine: 'Cough Syrup', morning: true, afternoon: true, evening: true, tab: 2, dose: '2-2-2' },
      { medicine: 'Paracetamol 500mg', morning: true, afternoon: true, evening: false, tab: 1, dose: '1-1-0' },
      { medicine: 'Steam Inhalation', morning: true, afternoon: true, evening: true, tab: 1, dose: 'SOS' },
    ],
    [
      { medicine: 'Amlodipine 5mg', morning: true, afternoon: false, evening: false, tab: 1, dose: '1-0-0' },
      { medicine: 'Losartan 50mg', morning: false, afternoon: false, evening: true, tab: 1, dose: '0-0-1' },
      { medicine: 'Aspirin 75mg', morning: true, afternoon: false, evening: false, tab: 1, dose: '1-0-0' },
    ],
    [
      { medicine: 'Cetirizine 10mg', morning: true, afternoon: false, evening: true, tab: 1, dose: '1-0-1' },
      { medicine: 'Allegra 120mg', morning: true, afternoon: false, evening: false, tab: 1, dose: '1-0-0' },
      { medicine: 'Clobetasol Cream', morning: true, afternoon: true, evening: true, tab: 1, dose: 'Apply locally' },
    ],
    [
      { medicine: 'Metformin 500mg', morning: true, afternoon: true, evening: true, tab: 1, dose: '1-1-1' },
      { medicine: 'Vitamin D3 60K IU', morning: false, afternoon: false, evening: true, tab: 1, dose: '0-0-1 (Weekly)' },
      { medicine: 'Pantoprazole 40mg', morning: true, afternoon: false, evening: false, tab: 1, dose: '1-0-0' },
    ],
    [
      { medicine: 'Diclofenac 50mg', morning: true, afternoon: false, evening: true, tab: 1, dose: '1-0-1' },
      { medicine: 'Muscle Relaxant', morning: true, afternoon: true, evening: true, tab: 1, dose: '1-1-1' },
      { medicine: 'Calcium + Vitamin D3', morning: true, afternoon: false, evening: false, tab: 1, dose: '1-0-0' },
      { medicine: 'Pain Relief Gel', morning: true, afternoon: true, evening: true, tab: 1, dose: 'Apply locally' },
    ],
    [
      { medicine: 'Levothyroxine 50mcg', morning: true, afternoon: false, evening: false, tab: 1, dose: '1-0-0 (Empty stomach)' },
      { medicine: 'Multivitamin', morning: true, afternoon: false, evening: false, tab: 1, dose: '1-0-0' },
    ],
    [
      { medicine: 'Metoprolol 25mg', morning: true, afternoon: false, evening: true, tab: 1, dose: '1-0-1' },
      { medicine: 'Atorvastatin 10mg', morning: false, afternoon: false, evening: true, tab: 1, dose: '0-0-1' },
      { medicine: 'Aspirin 75mg', morning: true, afternoon: false, evening: false, tab: 1, dose: '1-0-0' },
      { medicine: 'Pantoprazole 20mg', morning: true, afternoon: false, evening: false, tab: 1, dose: '1-0-0' },
    ],
    [
      { medicine: 'Eye Drops', morning: true, afternoon: true, evening: true, tab: 2, dose: '2-2-2 drops' },
      { medicine: 'Antibiotic Eye Ointment', morning: false, afternoon: false, evening: true, tab: 1, dose: '0-0-1' },
      { medicine: 'Paracetamol 500mg', morning: true, afternoon: false, evening: true, tab: 1, dose: '1-0-1 SOS' },
    ],
  ];

  const prescriptions: any[] = [];
  for (let i = 0; i < 10; i++) {
    const booking = visitedAndFinished[i];
    if (!booking) continue;

    const pDesc = prescriptionData[i];
    const doctor = doctors.find((d) => d.id === booking.doctorId);

    const prescription = await db.prescription.create({
      data: {
        bookingId: booking.id,
        doctorId: doctor!.id,
        patientName: booking.patientName,
        patientAge: String(booking.age),
        disease: pDesc.disease,
        weight: pDesc.weight,
        bp: pDesc.bp,
        temperature: pDesc.temp,
        description: `Follow-up in 7 days. Report immediately if symptoms worsen.`,
        medicines: {
          create: medSets[i].map((m) => ({
            medicine: m.medicine,
            morning: m.morning,
            afternoon: m.afternoon,
            evening: m.evening,
            tab: m.tab,
            dose: m.dose,
            description: '',
          })),
        },
      },
    });
    prescriptions.push(prescription);

    // Add PLabel entries for some prescriptions
    if (i % 2 === 0) {
      await db.pLabel.createMany({
        data: [
          { prescriptionId: prescription.id, label: 'Blood Sugar (Fasting)', value: '120 mg/dL', labelUnit: 'mg/dL' },
          { prescriptionId: prescription.id, label: 'Blood Sugar (Post Meal)', value: '180 mg/dL', labelUnit: 'mg/dL' },
        ],
      });
    }

    // Add PSuggestion entries for some prescriptions
    if (i % 3 === 0) {
      await db.pSuggestion.createMany({
        data: [
          { prescriptionId: prescription.id, question: 'Diet recommendations?', suggestions: 'Avoid oily and spicy food. Eat more fruits and vegetables.' },
          { prescriptionId: prescription.id, question: 'Exercise advice?', suggestions: 'Walk for 30 minutes daily. Avoid heavy lifting for 2 weeks.' },
        ],
      });
    }
  }
  console.log('✅ 10 Prescriptions created with PMedicine, PLabel, and PSuggestion entries');

  // ============================================================
  // 12. DOCTOR RATINGS (10) - for Finished bookings, stars 3-5
  // ============================================================
  const finishedBookings = bookings.filter((b) => b.status === 'Finish');
  const ratingTexts = [
    'Excellent doctor! Very thorough and caring. Highly recommend.',
    'Good experience. Doctor explained everything clearly.',
    'Satisfied with the treatment. Staff was helpful.',
    'Average experience. Had to wait a bit long.',
    'Great doctor! Very knowledgeable and professional.',
    'Wonderful experience. Would definitely recommend to friends.',
    'Very good consultation. Medicines prescribed worked well.',
    'Doctor is patient and listens carefully. Recommended!',
    'Fantastic service. Quick diagnosis and effective treatment.',
    'Good doctor but the wait time could be improved.',
  ];

  for (let i = 0; i < 10; i++) {
    const bookingIdx = i % finishedBookings.length;
    const patientIdx = (i * 3) % patients.length;
    const doctorBooking = finishedBookings[bookingIdx];
    const doctor = doctors.find((d) => d.id === doctorBooking.doctorId);
    const doctorUser = doctorUsers.find((du: any) => du.id === doctor!.userId);

    await db.doctorRating.create({
      data: {
        patientId: patients[patientIdx].id,
        doctorId: doctorUser!.id,
        bookingId: doctorBooking.id,
        star: 3 + (i % 3), // 3, 4, or 5
        consultationRating: 3 + (i % 3),
        waitTimeRating: 3 + ((i + 1) % 3),
        staffRating: 3 + ((i + 2) % 3),
        review: ratingTexts[i],
        wouldRecommend: i % 4 !== 2,
        isAnonymous: false,
      },
    });
  }
  console.log('✅ 10 Doctor Ratings created (stars 3-5)');

  // ============================================================
  // 13. NOTIFICATIONS (25) - mix of READ/UNREAD
  // ============================================================
  const notificationTemplates = [
    { title: 'Appointment Confirmed', message: 'Your appointment has been confirmed. Please arrive 10 minutes early.' },
    { title: 'New Appointment Booked', message: 'A new appointment has been booked by a patient.' },
    { title: 'Prescription Ready', message: 'Your prescription is ready. Please check your appointments.' },
    { title: 'Appointment Reminder', message: 'Reminder: You have an appointment scheduled for tomorrow.' },
    { title: 'Appointment Cancelled', message: 'An appointment has been cancelled by the patient.' },
    { title: 'New Feature Available', message: 'You can now upload medical documents securely.' },
    { title: 'Payment Received', message: 'Payment for your appointment has been confirmed.' },
    { title: 'Lab Results Ready', message: 'Your lab results are now available for review.' },
    { title: 'Follow-up Reminder', message: 'It\'s time for your follow-up consultation.' },
    { title: 'Profile Updated', message: 'Your profile has been updated successfully.' },
  ];

  const allUsersForNotifications = [...patients.slice(0, 8), ...doctorUsers.slice(0, 5)];
  for (let i = 0; i < 25; i++) {
    const user = allUsersForNotifications[i % allUsersForNotifications.length];
    const tmpl = notificationTemplates[i % notificationTemplates.length];
    await db.notification.create({
      data: {
        userId: user.id,
        title: tmpl.title,
        message: tmpl.message,
        status: i % 3 === 0 ? 'READ' : 'UNREAD',
      },
    });
  }
  console.log('✅ 25 Notifications created (mix of READ/UNREAD)');

  // ============================================================
  // 14. BLOG POSTS (7) - 5 Published, 2 Draft
  // ============================================================
  const authorUser = doctorUsers[0];
  await db.post.createMany({
    data: [
      {
        title: '10 Tips for a Healthy Heart',
        permalink: '10-tips-healthy-heart',
        content: '<p>Maintaining a healthy heart is crucial for overall well-being. Here are 10 essential tips to keep your heart in top shape.</p><h3>1. Exercise Regularly</h3><p>Aim for at least 30 minutes of moderate exercise daily.</p><h3>2. Eat a Balanced Diet</h3><p>Include fruits, vegetables, whole grains, and lean proteins.</p><h3>3. Manage Stress</h3><p>Practice meditation, yoga, or deep breathing exercises.</p>',
        type: 'Blog',
        status: 'Published',
        authorId: authorUser.id,
        blogImg: '',
      },
      {
        title: 'Understanding Diabetes: A Complete Guide',
        permalink: 'understanding-diabetes-guide',
        content: '<p>Diabetes is a chronic condition that affects millions worldwide. Understanding its types, symptoms, and management is key to living a healthy life.</p><p><strong>Type 1 Diabetes:</strong> An autoimmune condition where the body produces no insulin.</p><p><strong>Type 2 Diabetes:</strong> The body becomes resistant to insulin or doesn\'t produce enough.</p>',
        type: 'Blog',
        status: 'Published',
        authorId: authorUser.id,
        blogImg: '',
      },
      {
        title: 'New Advancements in Cardiac Surgery',
        permalink: 'advancements-cardiac-surgery-2025',
        content: '<p>Recent breakthroughs in cardiac surgery have made procedures safer and recovery faster. Minimally invasive techniques are now the standard for many heart conditions.</p><p>Robotic-assisted surgery offers precision and faster recovery times for patients.</p>',
        type: 'News',
        status: 'Published',
        authorId: doctorUsers[3].id,
        blogImg: '',
      },
      {
        title: 'Skin Care in Monsoon Season',
        permalink: 'skin-care-monsoon-season',
        content: '<p>The monsoon season brings humidity that can wreak havoc on your skin. Here are expert tips from dermatologists to keep your skin healthy during the rainy season.</p><p>Keep your skin dry, use antifungal powders, and avoid wearing wet clothes for extended periods.</p>',
        type: 'Blog',
        status: 'Published',
        authorId: doctorUsers[1].id,
        blogImg: '',
      },
      {
        title: 'Pediatric Vaccination Schedule for 2025',
        permalink: 'pediatric-vaccination-schedule-2025',
        content: '<p>Keeping your child\'s vaccinations up to date is one of the most important things you can do as a parent. Here is the latest recommended vaccination schedule.</p><p>BCG, OPV, Hepatitis B, DPT, and MMR are among the essential vaccines for children.</p>',
        type: 'Blog',
        status: 'Published',
        authorId: doctorUsers[2].id,
        blogImg: '',
      },
      {
        title: 'Debunking Common Health Myths',
        permalink: 'debunking-common-health-myths',
        content: '<p>From "cracking knuckles causes arthritis" to "sugar makes children hyper" — there are many health myths that need to be addressed with scientific evidence.</p>',
        type: 'Blog',
        status: 'Draft',
        authorId: doctorUsers[4].id,
        blogImg: '',
      },
      {
        title: 'The Future of Telemedicine in India',
        permalink: 'future-telemedicine-india',
        content: '<p>Telemedicine is transforming healthcare delivery in India. This article explores the current landscape, challenges, and future potential of remote medical consultations.</p>',
        type: 'Blog',
        status: 'Draft',
        authorId: doctorUsers[5].id,
        blogImg: '',
      },
    ],
  });
  console.log('✅ 7 Blog Posts created (5 Published, 2 Draft)');

  // ============================================================
  // 15. CHAT MESSAGES (20) - for 5 bookings, back-and-forth
  // ============================================================
  const chatBookings = [bookings[0], bookings[5], bookings[10], bookings[20], bookings[30]]; // 5 different bookings
  const chatMessages = [
    ['Hello doctor, I have been experiencing chest pain.', 'Hi Rahul, can you describe the pain? Is it sharp or dull?'],
    ['It is a dull ache, mostly in the morning.', 'I see. Have you been under stress lately?'],
    ['Yes, work has been very stressful.', 'I recommend we do an ECG. Please book an in-person visit.'],
    ['Thank you, I will book one right away.', 'Sure, take care in the meantime.'],
  ];

  let msgCount = 0;
  for (let c = 0; c < chatBookings.length; c++) {
    const booking = chatBookings[c];
    if (!booking || !booking.userId) continue;
    const doctor = doctors.find((d) => d.id === booking.doctorId);
    if (!doctor) continue;
    const doctorUser = doctorUsers.find((du: any) => du.id === doctor.userId);
    if (!doctorUser) continue;

    const pairs = chatMessages[c % chatMessages.length];
    // Patient sends first
    await db.bookingChat.create({
      data: {
        bookingId: booking.id,
        fromId: booking.userId,
        toId: doctorUser.id,
        message: pairs[0],
        status: 'READ',
      },
    });
    msgCount++;
    // Doctor replies
    await db.bookingChat.create({
      data: {
        bookingId: booking.id,
        fromId: doctorUser.id,
        toId: booking.userId,
        message: pairs[1],
        status: 'READ',
      },
    });
    msgCount++;
  }
  // Add 10 more messages across other bookings for variety
  for (let i = 0; i < 10; i++) {
    const booking = bookings[1 + (i % 10)];
    if (!booking || !booking.userId) continue;
    const doctor = doctors.find((d) => d.id === booking.doctorId);
    if (!doctor) continue;
    const doctorUser = doctorUsers.find((du: any) => du.id === doctor.userId);
    if (!doctorUser) continue;

    const isFromPatient = i % 2 === 0;
    await db.bookingChat.create({
      data: {
        bookingId: booking.id,
        fromId: isFromPatient ? booking.userId : doctorUser.id,
        toId: isFromPatient ? doctorUser.id : booking.userId,
        message: i % 2 === 0
          ? ['I need to reschedule my appointment.', 'Can I get the test reports early?', 'Is the prescribed medicine available generically?', 'I am feeling better now.', 'Thank you for the consultation!'][i % 5]
          : ['Sure, please let me know your preferred time.', 'I will check and get back to you.', 'Yes, the generic version works the same.', 'That is great to hear. Continue the medication.', 'You are welcome. Take care!'][i % 5],
        status: i < 5 ? 'READ' : 'UNREAD',
      },
    });
    msgCount++;
  }
  console.log(`✅ ${msgCount} Chat Messages created (for 5+ bookings)`);

  // ============================================================
  // 16. MEDICAL DOCUMENTS (5) - for 3 patients
  // ============================================================
  await db.medicalDocument.createMany({
    data: [
      {
        patientId: patients[0].id,
        title: 'Blood Test Report - January 2025',
        category: 'Lab Report',
        fileUrl: '/documents/blood-test-p1.pdf',
        fileName: 'blood-test-p1.pdf',
        fileSize: 245000,
        mimeType: 'application/pdf',
        description: 'Complete blood count and lipid profile report',
      },
      {
        patientId: patients[0].id,
        title: 'ECG Report',
        category: 'Imaging',
        fileUrl: '/documents/ecg-p1.pdf',
        fileName: 'ecg-p1.pdf',
        fileSize: 180000,
        mimeType: 'application/pdf',
        description: 'Electrocardiogram report from City Diagnostics',
      },
      {
        patientId: patients[1].id,
        title: 'X-Ray - Chest',
        category: 'Imaging',
        fileUrl: '/documents/xray-chest-p2.pdf',
        fileName: 'xray-chest-p2.pdf',
        fileSize: 512000,
        mimeType: 'application/pdf',
        description: 'Chest X-ray report from Apollo Diagnostics',
      },
      {
        patientId: patients[2].id,
        title: 'Vaccination Record',
        category: 'Other',
        fileUrl: '/documents/vaccination-p3.pdf',
        fileName: 'vaccination-p3.pdf',
        fileSize: 89000,
        mimeType: 'application/pdf',
        description: 'Child vaccination record up to age 5',
      },
      {
        patientId: patients[2].id,
        title: 'Allergy Test Report',
        category: 'Lab Report',
        fileUrl: '/documents/allergy-test-p3.pdf',
        fileName: 'allergy-test-p3.pdf',
        fileSize: 320000,
        mimeType: 'application/pdf',
        description: 'Comprehensive allergy panel test results',
      },
    ],
  });
  console.log('✅ 5 Medical Documents created (for 3 patients)');

  // ============================================================
  // VERIFICATION
  // ============================================================
  console.log('\n📊 === SEED VERIFICATION ===');
  const counts = {
    doctors: await db.doctor.count(),
    patients: await db.user.count({ where: { role: 'patient' } }),
    hospitals: await db.hospital.count(),
    receptionists: await db.receptionist.count(),
    bookings: await db.booking.count(),
    prescriptions: await db.prescription.count(),
    ratings: await db.doctorRating.count(),
    notifications: await db.notification.count(),
    posts: await db.post.count(),
    doctorTypeMaster: await db.doctorTypeMaster.count(),
    diseaseMaster: await db.diseaseMaster.count(),
    chatMessages: await db.bookingChat.count(),
    medicalDocuments: await db.medicalDocument.count(),
    schedules: await db.doctorSchedule.count(),
    holidays: await db.doctorHoliday.count(),
    doctorMedicines: await db.doctorMedicine.count(),
  };
  console.table(counts);
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
