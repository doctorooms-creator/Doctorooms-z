import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const p = new PrismaClient();

async function main() {
  const output: string[] = [];
  
  // 1. Table counts
  output.push("\n=== TABLE ROW COUNTS ===");
  const tables = [
    ["User", () => p.user.count()],
    ["Doctor", () => p.doctor.count()],
    ["Hospital", () => p.hospital.count()],
    ["Booking", () => p.booking.count()],
    ["Prescription", () => p.prescription.count()],
    ["PMedicine", () => p.pMedicine.count()],
    ["PLabel", () => p.pLabel.count()],
    ["PSuggestion", () => p.pSuggestion.count()],
    ["PDignoTable", () => p.pDignoTable.count()],
    ["PCo", () => p.pCo.count()],
    ["POtherSetting", () => p.pOtherSetting.count()],
    ["DoctorRating", () => p.doctorRating.count()],
    ["DoctorSchedule", () => p.doctorSchedule.count()],
    ["DoctorHoliday", () => p.doctorHoliday.count()],
    ["DoctorMedicine", () => p.doctorMedicine.count()],
    ["DoctorTypeMaster", () => p.doctorTypeMaster.count()],
    ["Post", () => p.post.count()],
    ["Notification", () => p.notification.count()],
    ["BookingChat", () => p.bookingChat.count()],
    ["MedicalDocument", () => p.medicalDocument.count()],
    ["Receptionist", () => p.receptionist.count()],
    ["DoctorAssistant", () => p.doctorAssistant.count()],
    ["DoctorPharmacist", () => p.doctorPharmacist.count()],
    ["DoctorGallery", () => p.doctorGallery.count()],
    ["Slider", () => p.slider.count()],
    ["DiseaseMaster", () => p.diseaseMaster.count()],
    ["LabelMaster", () => p.labelMaster.count()],
    ["CoMaster", () => p.coMaster.count()],
    ["QuestionsMaster", () => p.questionsMaster.count()],
    ["SuggestionsMaster", () => p.suggestionsMaster.count()],
    ["HospitalInquiry", () => p.hospitalInquiry.count()],
  ];

  let total = 0;
  for (const [name, fn] of tables) {
    const cnt = await fn();
    total += cnt;
    output.push(`  ${name.padEnd(25)} : ${String(cnt).padStart(4)}`);
  }
  output.push(`  ${"TOTAL".padEnd(25)} : ${String(total).padStart(4)}`);

  // 2. Users by role
  output.push("\n=== USERS BY ROLE ===");
  const usersByRole = await p.user.groupBy({ by: ["role"], _count: true });
  for (const r of usersByRole) {
    output.push(`  ${r.role.padEnd(20)} : ${String(r._count).padStart(4)}`);
  }

  // 3. Users by status
  output.push("\n=== USERS BY STATUS ===");
  const usersByStatus = await p.user.groupBy({ by: ["status"], _count: true });
  for (const r of usersByStatus) {
    output.push(`  ${r.status.padEnd(20)} : ${String(r._count).padStart(4)}`);
  }

  // 4. Doctors detail
  output.push("\n=== DOCTORS DETAIL ===");
  const doctors = await p.doctor.findMany({
    include: {
      user: { select: { name: true, email: true, mobileNo: true, status: true } },
      schedules: true,
      holidays: true,
      medicines: true,
      assistants: { include: { user: { select: { name: true, email: true } } } },
      pharmacistLinks: { include: { user: { select: { name: true, email: true } } } },
      receptionistLinks: { include: { user: { select: { name: true, email: true } } } },
      _count: { select: { bookings: true, prescriptions: true } },
    },
  });

  for (const d of doctors) {
    output.push(`\n  --- Dr. ${d.user.name} (${d.specialization || 'No Specialization'}) ---`);
    output.push(`    ID           : ${d.id}`);
    output.push(`    UserID       : ${d.userId}`);
    output.push(`    Email        : ${d.user.email}`);
    output.push(`    Mobile       : ${d.user.mobileNo || 'N/A'}`);
    output.push(`    Status       : ${d.user.status}`);
    output.push(`    City         : ${d.city || 'N/A'}`);
    output.push(`    Fees         : ₹${d.fees}`);
    output.push(`    Emergency    : ${d.isEmergency ? 'Yes' : 'No'}`);
    output.push(`    Schedules    : ${d.schedules.length}`);
    output.push(`    Holidays     : ${d.holidays.length}`);
    output.push(`    Medicines    : ${d.medicines.length}`);
    output.push(`    Assistants   : ${d.assistants.length}`);
    output.push(`    Pharmacists  : ${d.pharmacistLinks.length}`);
    output.push(`    Receptionists: ${d.receptionistLinks.length}`);
    output.push(`    Bookings     : ${d._count.bookings}`);
    output.push(`    Prescriptions: ${d._count.prescriptions}`);

    if (d.schedules.length > 0) {
      output.push("    Schedules:");
      for (const s of d.schedules) {
        output.push(`      ${s.day}: ${s.startTime}-${s.endTime} (slot=${s.slotDuration}min, manual=[${s.timeSlots}])`);
      }
    }
    if (d.holidays.length > 0) {
      output.push("    Holidays:");
      for (const h of d.holidays) {
        output.push(`      ${h.date.toISOString().split('T')[0]} - ${h.remark || 'No remark'}`);
      }
    }
    if (d.assistants.length > 0) {
      for (const a of d.assistants) {
        output.push(`    Assistant: ${a.user.name} (${a.user.email})`);
      }
    }
    if (d.pharmacistLinks.length > 0) {
      for (const ph of d.pharmacistLinks) {
        output.push(`    Pharmacist: ${ph.user.name} (${ph.user.email})`);
      }
    }
    if (d.receptionistLinks.length > 0) {
      for (const r of d.receptionistLinks) {
        output.push(`    Receptionist: ${r.user.name} (${r.user.email})`);
      }
    }
  }

  // 5. Bookings detail
  output.push("\n=== BOOKINGS ===");
  const bookings = await p.booking.findMany({
    include: {
      doctor: { select: { id: true, userId: true, user: { select: { name: true } } } },
      user: { select: { id: true, name: true, mobileNo: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  for (const b of bookings) {
    output.push(`  [${b.status.padEnd(10)}] ${b.appointmentNo || 'NO-NUMBER'} | ${b.patientName || b.user?.name || 'Walk-in'} | Dr. ${b.doctor.user.name} | ${b.bookingDate.toISOString().split('T')[0]} ${b.timeSlot} | ${b.bookingMode} | ${b.bookingType} | ₹${b.appointmentCharge}`);
  }

  // 6. Bookings by status
  output.push("\n=== BOOKINGS BY STATUS ===");
  const bookingsByStatus = await p.booking.groupBy({ by: ["status"], _count: true });
  for (const r of bookingsByStatus) {
    output.push(`  ${r.status.padEnd(15)} : ${String(r._count).padStart(4)}`);
  }

  // 7. Prescriptions
  output.push("\n=== PRESCRIPTIONS ===");
  const prescriptions = await p.prescription.findMany({
    include: {
      booking: { select: { appointmentNo: true, patientName: true } },
      doctor: { select: { user: { select: { name: true } } } },
      medicines: true,
      labels: true,
      suggestions: true,
    },
  });
  for (const pr of prescriptions) {
    output.push(`  Rx ${pr.booking.appointmentNo || 'N/A'} for ${pr.patientName || pr.booking.patientName || 'N/A'} by Dr. ${pr.doctor.user.name} | Medicines: ${pr.medicines.length} | Labels: ${pr.labels.length} | Suggestions: ${pr.suggestions.length}`);
  }

  // 8. Posts
  output.push("\n=== POSTS ===");
  const posts = await p.post.findMany({
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  for (const post of posts) {
    output.push(`  [${post.status.padEnd(10)}] ${post.type}: "${post.title}" by ${post.author.name}`);
  }

  // 9. Notifications
  output.push("\n=== NOTIFICATIONS ===");
  const notifByStatus = await p.notification.groupBy({ by: ["status"], _count: true });
  for (const r of notifByStatus) {
    output.push(`  ${r.status.padEnd(10)} : ${r._count}`);
  }

  // 10. Data integrity checks
  output.push("\n=== DATA INTEGRITY CHECKS ===");
  
  // Count bookings with no time slot
  const bookingsNoSlot = await p.booking.count({ where: { timeSlot: "" } });
  output.push(`  Bookings with no time slot: ${bookingsNoSlot}`);
  
  // Count walk-in bookings (no userId)
  const walkIns = await p.booking.count({ where: { userId: null } });
  output.push(`  Walk-in bookings (no userId): ${walkIns}`);
  
  // Role profile counts
  const patients = await p.user.count({ where: { role: "patient" } });
  const doctorsCount = await p.doctor.count();
  const hospitals = await p.hospital.count();
  const receptionists = await p.receptionist.count();
  const assistants = await p.doctorAssistant.count();
  const pharmacists = await p.doctorPharmacist.count();
  output.push(`  User role 'patient'      : ${patients}`);
  output.push(`  Doctor profiles        : ${doctorsCount}`);
  output.push(`  Hospital profiles      : ${hospitals}`);
  output.push(`  Receptionist profiles  : ${receptionists}`);
  output.push(`  Assistant profiles     : ${assistants}`);
  output.push(`  Pharmacist profiles    : ${pharmacists}`);

  // Check DoctorMedicine userId integrity (userId = Doctor.id, not User.id)
  const medicines = await p.doctorMedicine.findMany({ take: 5 });
  for (const m of medicines) {
    const doc = await p.doctor.findFirst({ where: { id: m.userId } });
    output.push(`  DoctorMedicine '${m.name}' userId=${m.userId} -> Doctor exists: ${!!doc}`);
  }

  // 11. Schedule coverage check
  output.push("\n=== SCHEDULE COVERAGE ===");
  const allSchedules = await p.doctorSchedule.findMany({
    include: { doctor: { select: { id: true, user: { select: { name: true } } } } },
  });
  const daysCovered = new Set<string>();
  for (const s of allSchedules) {
    daysCovered.add(s.day);
  }
  const allDays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const missingDays = allDays.filter(d => !daysCovered.has(d));
  output.push(`  Days with schedules : ${allDays.filter(d => daysCovered.has(d)).join(", ")}`);
  output.push(`  Days without schedules: ${missingDays.join(", ") || "None"}`);

  // 12. Holiday check - upcoming
  output.push("\n=== HOLIDAYS ===");
  const today = new Date();
  const upcoming = await p.doctorHoliday.findMany({
    where: { date: { gte: new Date(today.getFullYear(), today.getMonth(), 1) } },
    include: { doctor: { select: { user: { select: { name: true } } } } },
    orderBy: { date: "asc" },
  });
  for (const h of upcoming) {
    output.push(`  ${h.date.toISOString().split('T')[0]} - ${h.doctor.user.name} - ${h.remark || 'No remark'}`);
  }

  console.log(output.join("\n"));
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
