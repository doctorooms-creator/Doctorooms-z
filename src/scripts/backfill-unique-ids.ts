/**
 * Backfill script: Update records where unique fields have empty string values.
 * Run BEFORE pushing schema changes that change @default("") to @default(cuid()).
 *
 * Usage: bun run src/scripts/backfill-unique-ids.ts
 */

import { db } from '../lib/db'

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  const counter = process.pid.toString(36)
  return `${timestamp}${random}${counter}`
}

async function backfill() {
  console.log('Starting backfill of empty unique fields...')

  // 1. IpdAdmission.admissionNo
  const emptyAdmissions = await db.ipdAdmission.count({ where: { admissionNo: '' } })
  if (emptyAdmissions > 0) {
    console.log(`  Found ${emptyAdmissions} IpdAdmission records with empty admissionNo`)
    const admissions = await db.ipdAdmission.findMany({ where: { admissionNo: '' }, select: { id: true } })
    for (const adm of admissions) {
      await db.ipdAdmission.update({
        where: { id: adm.id },
        data: { admissionNo: generateId() },
      })
    }
    console.log(`  Updated ${admissions.length} admissionNo values`)
  } else {
    console.log('  No empty admissionNo values found')
  }

  // 2. Post.permalink (if exists)
  try {
    const emptyPosts = await (db as any).post?.count?.({ where: { permalink: '' } }) ?? 0
    if (emptyPosts > 0) {
      console.log(`  Found ${emptyPosts} Post records with empty permalink`)
      const posts = await (db as any).post?.findMany?.({ where: { permalink: '' }, select: { id: true } }) ?? []
      for (const post of posts) {
        await (db as any).post?.update?.({
          where: { id: post.id },
          data: { permalink: generateId() },
        })
      }
      console.log(`  Updated ${posts.length} permalink values`)
    } else {
      console.log('  No empty permalink values found')
    }
  } catch {
    console.log('  Post model not found, skipping')
  }

  console.log('Backfill complete!')
}

backfill()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Backfill failed:', err)
    process.exit(1)
  })
