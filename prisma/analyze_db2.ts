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
  if (usersByRole.length === 0) {
    console.log('  ⚠️  NO USERS FOUND - DATABASE IS EMPTY!');
  }
  usersByRole.forEach(r => console.log(`  ${r.role}: ${r._count.id}`));
  const totalUsers = usersByRole.reduce((s, r) => s + r._count.id, 0);
  console.log(`  TOTAL: ${totalUsers}\n`);

  // Check all table row counts
  const tables = ['User','Doctor','Hospital','Booking','Prescription','PMedicine','PLabel','PSuggestion','PDignoTable','PCo','POtherSetting','DoctorRating','DoctorSchedule','DoctorHoliday','DoctorMedicine','DoctorAssistant','DoctorPharmacist','Receptionist','DoctorTypeMaster','Post','Notification','Slider','HospitalInquiry','DiseaseMaster','LabelMaster','CoMaster','QuestionsMaster','SuggestionsMaster','DoctorGallery','MedicalDocument','BookingChat'];
  
  console.log('--- ALL TABLE ROW COUNTS ---');
  for (const t of tables) {
    try {
      // @ts-ignore
      const count = await db[t].count();
      if (count > 0) {
        console.log(`  ${t.padEnd(25)}: ${count}`);
      } else {
        console.log(`  ${t.padEnd(25)}: 0 (EMPTY)`);
      }
    } catch(e: any) {
      console.log(`  ${t.padEnd(25)}: ERROR - ${e.message.slice(0,60)}`);
    }
  }
  console.log();

  // Check if Receptionist/DoctorAssistant/DoctorPharmacist have User relation
  console.log('--- SCHEMA RELATION CHECK ---');
  console.log('  Receptionist model has User relation: Checking...');
  try {
    await db.receptionist.findFirst({ include: { user: true } });
    console.log('  ✅ Receptionist → User relation EXISTS');
  } catch(e: any) {
    console.log(`  ❌ Receptionist → User relation MISSING: ${e.message.slice(0,80)}`);
  }
  
  try {
    await db.doctorAssistant.findFirst({ include: { user: true } });
    console.log('  ✅ DoctorAssistant → User relation EXISTS');
  } catch(e: any) {
    console.log(`  ❌ DoctorAssistant → User relation MISSING: ${e.message.slice(0,80)}`);
  }
  
  try {
    await db.doctorPharmacist.findFirst({ include: { user: true } });
    console.log('  ✅ DoctorPharmacist → User relation EXISTS');
  } catch(e: any) {
    console.log(`  ❌ DoctorPharmacist → User relation MISSING: ${e.message.slice(0,80)}`);
  }

  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
