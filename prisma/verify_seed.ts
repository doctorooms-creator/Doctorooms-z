import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  console.log('===== DATABASE VERIFICATION =====\n');

  // 1. Users by role
  const usersByRole = await db.user.groupBy({ by: ['role'], _count: { id: true } });
  console.log('--- USERS BY ROLE ---');
  usersByRole.forEach(r => console.log(`  ${r.role}: ${r._count.id}`));
  console.log(`  TOTAL: ${usersByRole.reduce((s, r) => s + r._count.id, 0)}\n`);

  // 2. Doctors with teams (now using user relation!)
  const doctors = await db.doctor.findMany({
    include: {
      user: { select: { name: true, email: true, status: true } },
      receptionistLinks: { include: { user: { select: { name: true } } } },
      assistants: { include: { user: { select: { name: true } } } },
      pharmacistLinks: { include: { user: { select: { name: true } } } },
    },
  });
  console.log('--- DOCTORS & THEIR TEAMS ---');
  for (const d of doctors) {
    const bCount = await db.booking.count({ where: { doctorId: d.id } });
    const mCount = await db.doctorMedicine.count({ where: { userId: d.id } });
    const sCount = await db.doctorSchedule.count({ where: { doctorId: d.id } });
    console.log(`  Dr. ${d.user.name} (${d.specialization}) | ${d.city} | Rs.${d.fees}`);
    console.log(`     Bookings: ${bCount} | Schedules: ${sCount} | Medicines: ${mCount}`);
    d.receptionistLinks.forEach(r => console.log(`     Receptionist: ${r.user.name}`));
    d.assistants.forEach(a => console.log(`     Assistant: ${a.user.name}`));
    d.pharmacistLinks.forEach(p => console.log(`     Pharmacist: ${p.user.name}`));
    console.log();
  }

  // 3. Bookings by status
  const bookings = await db.booking.findMany({
    include: {
      doctor: { select: { user: { select: { name: true } } } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`--- BOOKINGS (${bookings.length} total) ---`);
  const byStatus: Record<string, number> = {};
  for (const b of bookings) {
    byStatus[b.status] = (byStatus[b.status] || 0) + 1;
    const pName = b.user?.name || b.patientName || 'Walk-in';
    const dName = b.doctor?.user?.name || '?';
    const rxCount = await db.prescription.count({ where: { bookingId: b.id } });
    console.log(`  [${b.status.padEnd(9)}] ${pName.padEnd(20)} -> ${dName} | Rx:${rxCount} | ${b.bookingDate.toISOString().slice(0,10)} ${b.timeSlot}`);
  }
  console.log(`  Summary:`, byStatus, '\n');

  // 4. All table counts
  const tables = ['User','Doctor','Hospital','Booking','Prescription','PMedicine','PLabel','PSuggestion','PDignoTable','DoctorRating','DoctorSchedule','DoctorHoliday','DoctorMedicine','DoctorAssistant','DoctorPharmacist','Receptionist','DoctorTypeMaster','Post','Notification','Slider','HospitalInquiry','DiseaseMaster','LabelMaster','CoMaster','QuestionsMaster','SuggestionsMaster','DoctorGallery','MedicalDocument','BookingChat','POtherSetting'];
  console.log('--- ALL TABLE COUNTS ---');
  let total = 0;
  for (const t of tables) {
    try {
      // @ts-ignore
      const count: number = await db[t].count();
      total += count;
      console.log(`  ${t.padEnd(25)}: ${String(count).padEnd(4)} ${count > 0 ? 'OK' : 'EMPTY'}`);
    } catch(e: any) {
      console.log(`  ${t.padEnd(25)}: ERROR`);
    }
  }
  console.log(`  ${'TOTAL'.padEnd(25)}: ${total}\n`);

  // 5. Verify User relations work on previously broken models
  console.log('--- USER RELATION VERIFICATION ---');
  try {
    const rec = await db.receptionist.findFirst({ include: { user: true, doctor: { include: { user: true } } } });
    console.log(`  Receptionist -> User: ${rec?.user?.name} | -> Doctor: Dr.${rec?.doctor?.user?.name}`);
  } catch(e: any) { console.log(`  Receptionist FAILED: ${e.message.slice(0,80)}`); }

  try {
    const asst = await db.doctorAssistant.findFirst({ include: { user: true, doctor: { include: { user: true } } } });
    console.log(`  Assistant -> User: ${asst?.user?.name} | -> Doctor: Dr.${asst?.doctor?.user?.name}`);
  } catch(e: any) { console.log(`  Assistant FAILED: ${e.message.slice(0,80)}`); }

  try {
    const pharm = await db.doctorPharmacist.findFirst({ include: { user: true, doctor: { include: { user: true } } } });
    console.log(`  Pharmacist -> User: ${pharm?.user?.name} | -> Doctor: Dr.${pharm?.doctor?.user?.name}`);
  } catch(e: any) { console.log(`  Pharmacist FAILED: ${e.message.slice(0,80)}`); }

  console.log('\n===== VERIFICATION COMPLETE =====');
  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
