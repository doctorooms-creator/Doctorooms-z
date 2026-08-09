import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.$transaction([
    prisma.bookingChat.deleteMany(),
    prisma.pCo.deleteMany(),
    prisma.pDignoTable.deleteMany(),
    prisma.pSuggestion.deleteMany(),
    prisma.pLabel.deleteMany(),
    prisma.pMedicine.deleteMany(),
    prisma.prescription.deleteMany(),
    prisma.medicalDocument.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.doctorHoliday.deleteMany(),
    prisma.doctorSchedule.deleteMany(),
    prisma.doctorMedicine.deleteMany(),
    prisma.doctorGallery.deleteMany(),
    prisma.doctorAssistant.deleteMany(),
    prisma.doctorPharmacist.deleteMany(),
    prisma.receptionist.deleteMany(),
    prisma.pOtherSetting.deleteMany(),
    prisma.coMaster.deleteMany(),
    prisma.labelMaster.deleteMany(),
    prisma.questionsMaster.deleteMany(),
    prisma.suggestionsMaster.deleteMany(),
    prisma.doctorRating.deleteMany(),
    prisma.doctor.deleteMany(),
    prisma.hospital.deleteMany(),
    prisma.post.deleteMany(),
    prisma.hospitalInquiry.deleteMany(),
    prisma.diseaseMaster.deleteMany(),
    prisma.doctorTypeMaster.deleteMany(),
    prisma.slider.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const adminPass = await hash('admin123', 10);
  const doctorPass = await hash('doctor123', 10);
  const patientPass = await hash('patient123', 10);
  const hospitalPass = await hash('hospital123', 10);
  const receptionistPass = await hash('receptionist123', 10);
  const assistantPass = await hash('assistant123', 10);
  const pharmacistPass = await hash('pharmacist123', 10);

  // Create Users
  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@doctorooms.com', password: adminPass, role: 'admin', status: 'Active', gender: 'Male', mobileNo: '9999999991', profileImg: 'default.png' },
  });

  const doctor1 = await prisma.user.create({
    data: { name: 'Dr. Rajesh Sharma', email: 'rajesh@doctorooms.com', password: doctorPass, role: 'doctor', status: 'Active', gender: 'Male', mobileNo: '9999999992', profileImg: 'default.png' },
  });

  const doctor2 = await prisma.user.create({
    data: { name: 'Dr. Priya Patel', email: 'priya@doctorooms.com', password: doctorPass, role: 'doctor', status: 'Active', gender: 'Female', mobileNo: '9999999993', profileImg: 'default.png' },
  });

  const doctor3 = await prisma.user.create({
    data: { name: 'Dr. Amit Kumar', email: 'amit@doctorooms.com', password: doctorPass, role: 'doctor', status: 'Active', gender: 'Male', mobileNo: '9999999994', profileImg: 'default.png' },
  });

  const patient1 = await prisma.user.create({
    data: { name: 'Rahul Verma', email: 'rahul@doctorooms.com', password: patientPass, role: 'patient', status: 'Active', gender: 'Male', mobileNo: '8888888881', profileImg: 'default.png' },
  });

  const patient2 = await prisma.user.create({
    data: { name: 'Sneha Gupta', email: 'sneha@doctorooms.com', password: patientPass, role: 'patient', status: 'Active', gender: 'Female', mobileNo: '8888888882', profileImg: 'default.png' },
  });

  const hospital1 = await prisma.user.create({
    data: { name: 'City Hospital', email: 'city@doctorooms.com', password: hospitalPass, role: 'hospital', status: 'Active', gender: 'Male', mobileNo: '7777777771', profileImg: 'default.png' },
  });

  const receptionist1 = await prisma.user.create({
    data: { name: 'Meera Joshi', email: 'meera@doctorooms.com', password: receptionistPass, role: 'receptionist', status: 'Active', gender: 'Female', mobileNo: '6666666661', profileImg: 'default.png' },
  });

  const assistant1 = await prisma.user.create({
    data: { name: 'Vikram Singh', email: 'vikram@doctorooms.com', password: assistantPass, role: 'assistant', status: 'Active', gender: 'Male', mobileNo: '6666666662', profileImg: 'default.png' },
  });

  const pharmacist1 = await prisma.user.create({
    data: { name: 'Dr. Kavita Reddy', email: 'kavita@doctorooms.com', password: pharmacistPass, role: 'pharmacist', status: 'Active', gender: 'Female', mobileNo: '6666666663', profileImg: 'default.png' },
  });

  // Create Doctor Profiles
  await prisma.doctor.create({
    data: {
      userId: doctor1.id, bookingDays: 180, dailyLimit: 50,
      doctorType: 'MD [GENERAL MEDICINE]', specialization: 'General Medicine, Diabetes, Thyroid',
      description: 'Dr. Rajesh Sharma is a senior general physician with over 15 years of experience. Specialized in diabetes management and thyroid disorders. Known for his patient-first approach and thorough diagnosis.',
      education: 'MBBS, MD (General Medicine) - AIIMS Delhi', experience: '15+ Years',
      fees: 500, emergencyCharge: 1000, isEmergency: true,
      address: '123, MG Road, Connaught Place', city: 'New Delhi', state: 'Delhi',
      contactNo: '9999999992', phoneNo: '011-23456789',
      lat: 28.6315, longi: 77.2167,
      awardAndRecognition: 'Best Doctor Award 2020, Medical Excellence Award 2018',
      registrationDetail: 'MCI Reg: 12345',
    },
  });

  await prisma.doctor.create({
    data: {
      userId: doctor2.id, bookingDays: 180, dailyLimit: 40,
      doctorType: 'MS (OBSTETRICS & GYNAECOLOGY)', specialization: 'Obstetrics, Gynaecology, Laparoscopy',
      description: 'Dr. Priya Patel is a renowned gynaecologist with expertise in high-risk pregnancies and minimally invasive surgical procedures. She has delivered over 5000 babies successfully.',
      education: 'MBBS, MS (OBG) - Lady Hardinge Medical College', experience: '12+ Years',
      fees: 700, emergencyCharge: 1500, isEmergency: true,
      address: '45, Park Street, Salt Lake', city: 'Kolkata', state: 'West Bengal',
      contactNo: '9999999993',
      lat: 22.5726, longi: 88.3639,
      awardAndRecognition: 'Felicitation by IMA 2021',
      registrationDetail: 'MCI Reg: 23456',
    },
  });

  await prisma.doctor.create({
    data: {
      userId: doctor3.id, bookingDays: 90, dailyLimit: 30,
      doctorType: 'DM [CARDIOLOGY]', specialization: 'Cardiology, Interventional Cardiology',
      description: 'Dr. Amit Kumar is a leading cardiologist specializing in interventional cardiology and heart failure management. Pioneer in minimally invasive cardiac procedures in the region.',
      education: 'MBBS, MD, DM (Cardiology) - PGI Chandigarh', experience: '18+ Years',
      fees: 1000, emergencyCharge: 2000, isEmergency: true,
      address: '78, FC Road, Shivajinagar', city: 'Pune', state: 'Maharashtra',
      contactNo: '9999999994', phoneNo: '020-25531234',
      lat: 18.5196, longi: 73.8553,
      awardAndRecognition: 'Cardiology Excellence Award 2022',
      registrationDetail: 'MCI Reg: 34567',
    },
  });

  // Create Hospital
  await prisma.hospital.create({
    data: {
      userId: hospital1.id, hospitalName: 'City General Hospital',
      address: '100, Nehru Nagar, Sector 18', city: 'Noida', state: 'Uttar Pradesh',
      contactNo: '7777777771', lat: 28.5355, longi: 77.3910,
      gallery: '[]',
    },
  });

  // Doctor Schedules
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (const day of days) {
    await prisma.doctorSchedule.create({
      data: { doctorId: (await prisma.doctor.findUnique({ where: { userId: doctor1.id } }))!.id, day, startTime: '09:00', endTime: '13:00', slotDuration: 30 },
    });
    await prisma.doctorSchedule.create({
      data: { doctorId: (await prisma.doctor.findUnique({ where: { userId: doctor2.id } }))!.id, day, startTime: '10:00', endTime: '16:00', slotDuration: 30 },
    });
    await prisma.doctorSchedule.create({
      data: { doctorId: (await prisma.doctor.findUnique({ where: { userId: doctor3.id } }))!.id, day, startTime: '11:00', endTime: '17:00', slotDuration: 20 },
    });
  }

  // Create Blog Posts
  await prisma.post.createMany({
    data: [
      { title: '10 Tips for a Healthy Heart', permalink: '10-tips-healthy-heart', content: '<p>Maintaining a healthy heart is crucial for overall well-being. Here are 10 essential tips...</p><p>1. Exercise regularly for at least 30 minutes a day...</p><p>2. Eat a balanced diet rich in fruits and vegetables...</p>', type: 'Blog', status: 'Published', authorId: admin.id, blogImg: '' },
      { title: 'Understanding Diabetes: A Complete Guide', permalink: 'understanding-diabetes', content: '<p>Diabetes is a chronic condition that affects millions worldwide. Understanding its types, symptoms, and management is key...</p>', type: 'Blog', status: 'Published', authorId: doctor1.id, blogImg: '' },
      { title: 'New Advancements in Cardiac Surgery', permalink: 'advancements-cardiac-surgery', content: '<p>Recent breakthroughs in cardiac surgery have made procedures safer and recovery faster...</p>', type: 'News', status: 'Published', authorId: doctor3.id, blogImg: '' },
      { title: 'Women\'s Health: Common Myths Debunked', permalink: 'womens-health-myths', content: '<p>There are many misconceptions about women\'s health. Let\'s separate fact from fiction...</p>', type: 'Blog', status: 'Published', authorId: doctor2.id, blogImg: '' },
    ],
  });

  // Create Disease Master
  await prisma.diseaseMaster.createMany({
    data: [
      { name: 'Fever', status: 'Active' },
      { name: 'Headache', status: 'Active' },
      { name: 'Cough & Cold', status: 'Active' },
      { name: 'Stomach Pain', status: 'Active' },
      { name: 'Diabetes', status: 'Active' },
      { name: 'Hypertension', status: 'Active' },
      { name: 'Heart Disease', status: 'Active' },
      { name: 'Skin Allergy', status: 'Active' },
      { name: 'Back Pain', status: 'Active' },
      { name: 'Thyroid Disorder', status: 'Active' },
    ],
  });

  // Doctor Type Master
  await prisma.doctorTypeMaster.createMany({
    data: [
      { type: 'MD [GENERAL MEDICINE]', status: 'Active' },
      { type: 'MS (GENERAL SURGERY)', status: 'Active' },
      { type: 'DM [CARDIOLOGY]', status: 'Active' },
      { type: 'MS (OBSTETRICS & GYNAECOLOGY)', status: 'Active' },
      { type: 'MD [PEDIATRICS]', status: 'Active' },
      { type: 'MD [DERMATOLOGY]', status: 'Active' },
      { type: 'MS (ORTHOPAEDICS)', status: 'Active' },
      { type: 'MD [PSYCHIATRY]', status: 'Active' },
      { type: 'MD [ENT]', status: 'Active' },
      { type: 'MS (OPHTHALMOLOGY)', status: 'Active' },
    ],
  });

  // Sliders
  await prisma.slider.createMany({
    data: [
      { title: 'Your Health, Our Priority', subtitle: 'Book appointments with top doctors instantly', position: 1, status: 'Active', link: '/doctors', sliderImage: '' },
      { title: 'Expert Specialized Care', subtitle: 'Find doctors across 20+ specializations', position: 2, status: 'Active', link: '/doctors', sliderImage: '' },
      { title: '24/7 Emergency Services', subtitle: 'Round-the-clock medical assistance', position: 3, status: 'Active', link: '/doctors', sliderImage: '' },
    ],
  });

  // Sample Appointments
  const d1 = (await prisma.doctor.findUnique({ where: { userId: doctor1.id } }))!;
  await prisma.booking.createMany({
    data: [
      { appointmentNo: 'APT-001', doctorId: d1.id, userId: patient1.id, patientName: 'Rahul Verma', disease: 'Fever', description: 'High fever for 3 days', gender: 'Male', age: 28, status: 'Pending', bookingType: 'By Self', bookingDate: new Date(), state: 'Delhi', city: 'New Delhi', bloodGroup: 'B+', weight: 70, height: 175 },
      { appointmentNo: 'APT-002', doctorId: d1.id, userId: patient2.id, patientName: 'Sneha Gupta', disease: 'Headache', description: 'Recurring migraines', gender: 'Female', age: 25, status: 'Approve', bookingType: 'By Self', bookingDate: new Date(Date.now() - 86400000), state: 'West Bengal', city: 'Kolkata', bloodGroup: 'O+', weight: 55, height: 162 },
      { appointmentNo: 'APT-003', doctorId: d1.id, userId: patient1.id, patientName: 'Rahul Verma', disease: 'Diabetes Follow-up', description: 'Routine checkup', gender: 'Male', age: 28, status: 'Visited', bookingType: 'By Self', bookingDate: new Date(Date.now() - 7 * 86400000), state: 'Delhi', city: 'New Delhi', bloodGroup: 'B+', weight: 70, height: 175 },
      { appointmentNo: 'APT-004', doctorId: d1.id, userId: patient2.id, patientName: 'Sneha Gupta', disease: 'Thyroid Check', description: 'TSH levels review', gender: 'Female', age: 25, status: 'Finish', bookingType: 'By Self', bookingDate: new Date(Date.now() - 14 * 86400000), state: 'West Bengal', city: 'Kolkata', bloodGroup: 'O+', weight: 55, height: 162 },
    ],
  });

  // Sample Ratings
  await prisma.doctorRating.createMany({
    data: [
      { patientId: patient1.id, doctorId: doctor1.id, star: 5, consultationRating: 5, waitTimeRating: 4, staffRating: 5, review: 'Excellent doctor! Very thorough and caring.', wouldRecommend: true },
      { patientId: patient2.id, doctorId: doctor2.id, star: 4, consultationRating: 4, waitTimeRating: 3, staffRating: 4, review: 'Good experience. Dr. Patel is very knowledgeable.', wouldRecommend: true },
      { patientId: patient1.id, doctorId: doctor3.id, star: 5, consultationRating: 5, waitTimeRating: 5, staffRating: 4, review: 'Dr. Kumar saved my life! Best cardiologist in the city.', wouldRecommend: true },
    ],
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      { userId: patient1.id, title: 'Appointment Confirmed', message: 'Your appointment with Dr. Rajesh Sharma has been confirmed.', status: 'READ' },
      { userId: patient1.id, title: 'New Feature', message: 'You can now upload your medical documents securely.', status: 'UNREAD' },
      { userId: doctor1.id, title: 'New Appointment', message: 'Rahul Verma has booked an appointment.', status: 'UNREAD' },
    ],
  });

  console.log('Seed data created successfully!');
  console.log({ admin, doctor1, doctor2, doctor3, patient1, patient2, hospital1 });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
