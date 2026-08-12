import { db } from '../src/lib/db';

async function main() {
  const allUsers = await db.user.findMany({ take: 20 });
  console.log('=== ALL USERS ===');
  allUsers.forEach((u: any) => console.log(u.id, u.name, u.email, u.role));
  await db.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
