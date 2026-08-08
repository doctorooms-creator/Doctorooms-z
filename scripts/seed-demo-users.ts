import { db } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding demo users...');

  const users = [
    { name: 'Admin', email: 'admin@doctorooms.com', password: 'admin123', role: 'admin', gender: 'Male', mobileNo: '9999990001' },
    { name: 'Dr. Rajesh Kumar', email: 'rajesh@doctorooms.com', password: 'doctor123', role: 'doctor', gender: 'Male', mobileNo: '9999990002' },
    { name: 'Rahul Sharma', email: 'rahul@doctorooms.com', password: 'patient123', role: 'patient', gender: 'Male', mobileNo: '9999990003' },
    { name: 'City Hospital', email: 'city@doctorooms.com', password: 'hospital123', role: 'hospital', gender: 'Male', mobileNo: '9999990004' },
    { name: 'Meera Patel', email: 'meera@doctorooms.com', password: 'receptionist123', role: 'receptionist', gender: 'Female', mobileNo: '9999990005' },
    { name: 'Vikram Singh', email: 'vikram@doctorooms.com', password: 'assistant123', role: 'assistant', gender: 'Male', mobileNo: '9999990006' },
    { name: 'Kavita Desai', email: 'kavita@doctorooms.com', password: 'pharmacist123', role: 'pharmacist', gender: 'Female', mobileNo: '9999990007' },
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await db.user.upsert({
      where: { email: u.email },
      update: { password: hashed },
      create: {
        name: u.name,
        email: u.email,
        password: hashed,
        role: u.role,
        gender: u.gender,
        mobileNo: u.mobileNo,
        status: 'Active',
      },
    });
    console.log(`  ✓ ${u.email} (${u.role})`);
  }

  console.log('✅ Demo users seeded successfully!');
  await db.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
