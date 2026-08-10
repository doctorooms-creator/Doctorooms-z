import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  console.log('===== DATABASE ANALYSIS =====\n');

  // 1. Users by role
  const usersByRole = await db.user.groupBy({
    by: ['role'],
    _count: { id: true },
  });
  console.log('--- USERS BY ROLE ---');
  usersByRole.forEach(r => console.log(`  ${r.role}: ${r._count.id}`));
  const totalUsers = usersByRole.reduce((s, r) => s + r._count.id, 0);
  console.log(`  TOTAL: ${totalUsers}\n`);

  // 2. All users with basic info
  const allUsers = await db.user.findMany({
    select: { id: true, name: true, role: true, status: true, email: true },
    orderBy: { role: 'asc' },
  });
  console.log('--- ALL USERS ---');
  allUsers.forEach(u => console.log(`  [${u.role.padEnd(12)}] ${u.name.padEnd(25)} status=${u.status.padEnd(7)} email=${u.email}`));
  console.log();

  // 3. Doctors with relations
  const doctors = await db.doctor.findMany({
    include: {
      user: { select: { name: true, email: true, status: true } },
      receptionistLinks: { include: { user: { select: { name: true, email: true } } } },
      assistants: { include: { user: { select: { name: true, email: true } } } },
      pharmacistLinks: { include: { user: { select: { name: true, email: true } } } },
      _count: { bookings: true, schedules: true, medicines: true, prescriptions: true, holidays: true, gallery: true },
    },
  });
  console.log('--- DOCTORS & THEIR TEAMS ---');
  doctors.forEach(d => {
    console.log(`  🩺 Dr. ${d.user.name} (id=${d.id}, userId=${d.userId})`);
    console.log(`     Spec: ${d.specialization || 'N/A'} | City: ${d.city || 'N/A'} | Fees: ₹${d.fees}`);
    console.log(`     Schedules: ${d._count.schedules} | Bookings: ${d._count.bookings} | Medicines: ${d._count.medicines} | Prescriptions: ${d._count.prescriptions} | Holidays: ${d._count.holidays} | Gallery: ${d._count.gallery}`);
    if (d.receptionistLinks.length > 0) {
      d.receptionistLinks.forEach(r => console.log(`     📋 Receptionist: ${r.user.name} (userId=${r.userId})`));
    } else {
      console.log(`     📋 Receptionist: NONE`);
    }
    if (d.assistants.length > 0) {
      d.assistants.forEach(a => console.log(`     🤝 Assistant: ${a.user.name} (userId=${a.userId})`));
    } else {
      console.log(`     🤝 Assistant: NONE`);
    }
    if (d.pharmacistLinks.length > 0) {
      d.pharmacistLinks.forEach(p => console.log(`     💊 Pharmacist: ${p.user.name} (userId=${p.userId})`));
    } else {
      console.log(`     💊 Pharmacist: NONE`);
    }
    console.log();
  });

  // 4. Bookings
  const bookings = await db.booking.findMany({
    include: {
      doctor: { select: { user: { select: { name: true } } } },
      user: { select: { name: true } },
      _count: { prescriptions: true, chatMessages: true },
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`--- BOOKINGS (Total: ${bookings.length}) ---`);
  const bookingsByStatus = {} as Record<string, number>;
  bookings.forEach(b => {
    bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1;
    const patientName = b.user?.name || b.patientName || 'Walk-in';
    const doctorName = b.doctor?.user?.name || 'Unknown';
    console.log(`  [${b.status.padEnd(9)}] ${patientName.padEnd(20)} → Dr.${doctorName} | Date: ${b.bookingDate.toISOString().slice(0,10)} | Slot: ${b.timeSlot || 'N/A'} | Mode: ${b.bookingMode} | Type: ${b.bookingType} | Rx: ${b._count.prescriptions}`);
  });
  console.log(`  Status summary:`, bookingsByStatus);
  console.log();

  // 5. Prescriptions
  const prescriptions = await db.prescription.findMany({
    include: {
      doctor: { select: { user: { select: { name: true } } } },
      booking: { select: { patientName: true, user: { select: { name: true } } } },
      _count: { medicines: true, labels: true, suggestions: true, diagnosisTables: true, chiefComplaints: true },
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`--- PRESCRIPTIONS (Total: ${prescriptions.length}) ---`);
  prescriptions.forEach(p => {
    const patientName = p.booking?.user?.name || p.patientName || 'N/A';
    const doctorName = p.doctor?.user?.name || 'N/A';
    console.log(`  Rx ${p.id.slice(0,8)}... | Patient: ${patientName} | Dr.${doctorName} | Disease: ${p.disease || 'N/A'}`);
    console.log(`    Medicines: ${p._count.medicines} | Labels: ${p._count.labels} | Suggestions: ${p._count.suggestions} | DiagTables: ${p._count.diagnosisTables} | ChiefComplaints: ${p._count.chiefComplaints}`);
  });
  console.log();

  // 6. Doctor Schedules
  const schedules = await db.doctorSchedule.findMany({
    include: { doctor: { select: { user: { select: { name: true } } } } },
    orderBy: { doctorId: 'asc' },
  });
  console.log(`--- DOCTOR SCHEDULES (Total: ${schedules.length}) ---`);
  schedules.forEach(s => {
    const docName = s.doctor?.user?.name || 'N/A';
    console.log(`  Dr.${docName} | ${s.day} | ${s.startTime}-${s.endTime} | Slot: ${s.slotDuration}min | ManualSlots: ${s.timeSlots}`);
  });
  console.log();

  // 7. Doctor Medicines
  const medicines = await db.doctorMedicine.findMany({
    include: { doctor: { select: { user: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`--- DOCTOR MEDICINES (Total: ${medicines.length}) ---`);
  medicines.forEach(m => {
    const docName = m.doctor?.user?.name || 'N/A';
    console.log(`  [${m.status}] ${m.name.padEnd(25)} → Dr.${docName} | Dose: ${m.dose || 'N/A'} | Tab: ${m.tab}`);
  });
  console.log();

  // 8. Hospitals
  const hospitals = await db.hospital.findMany({
    include: { user: { select: { name: true, email: true, status: true } } },
  });
  console.log(`--- HOSPITALS (Total: ${hospitals.length}) ---`);
  hospitals.forEach(h => {
    console.log(`  🏥 ${h.user.name} (userId=${h.userId}) | ${h.hospitalName || 'N/A'} | ${h.city || 'N/A'} | ${h.address || 'N/A'}`);
  });
  console.log();

  // 9. Other counts
  const [notifications, posts, sliders, diseases, docTypes, medicalDocs, ratings, chats, holidays, galleries] = await Promise.all([
    db.notification.count(),
    db.post.count(),
    db.slider.count(),
    db.diseaseMaster.count(),
    db.doctorTypeMaster.count(),
    db.medicalDocument.count(),
    db.doctorRating.count(),
    db.bookingChat.count(),
    db.doctorHoliday.count(),
    db.doctorGallery.count(),
  ]);
  console.log('--- OTHER TABLE COUNTS ---');
  console.log(`  Notifications:    ${notifications}`);
  console.log(`  Posts/Blog:       ${posts}`);
  console.log(`  Sliders:          ${sliders}`);
  console.log(`  Disease Masters:  ${diseases}`);
  console.log(`  Doctor Types:     ${docTypes}`);
  console.log(`  Medical Docs:     ${medicalDocs}`);
  console.log(`  Ratings:          ${ratings}`);
  console.log(`  Chat Messages:    ${chats}`);
  console.log(`  Doctor Holidays:  ${holidays}`);
  console.log(`  Doctor Gallery:   ${galleries}`);
  console.log();

  // 10. DoctorMedicine.userId analysis (the known quirk)
  console.log('--- DOCTORMEDICINE.USERID vs DOCTOR.ID CHECK ---');
  const medChecks = await db.doctorMedicine.findMany({
    select: { id: true, userId: true, name: true },
  });
  for (const m of medChecks) {
    const doc = await db.doctor.findUnique({ where: { id: m.userId }, select: { id: true } });
    const userDoc = await db.doctor.findUnique({ where: { userId: m.userId }, select: { id: true } });
    console.log(`  Med: ${m.name.padEnd(20)} | userId=${m.userId.slice(0,8)}... | is Doctor.id? ${!!doc} | is Doctor.userId? ${!!userDoc}`);
  }

  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
