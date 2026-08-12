import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { writeFile, mkdir, unlink, readFile } from 'fs/promises'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Whether Supabase Storage is fully configured (URL + service role key present).
 * If false, all storage operations fall back to local filesystem.
 */
export const isSupabaseStorageReady = !!(supabaseUrl && supabaseServiceKey)

/**
 * Lazy-initialized Supabase client. Only created if credentials are available.
 */
let _supabase: SupabaseClient | null = null
function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase
  if (!isSupabaseStorageReady) return null
  _supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
  return _supabase
}

/** Local uploads directory */
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

/** Ensure the local upload directory exists */
async function ensureLocalDir(subdir: string) {
  const dir = path.join(UPLOAD_DIR, subdir)
  await mkdir(dir, { recursive: true })
  return dir
}

/**
 * Upload a file — tries Supabase Storage first, falls back to local filesystem.
 * Returns the public URL or local path.
 */
export async function uploadToStorage(
  bucket: string,
  filePath: string,
  buffer: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  // Try Supabase first
  const sb = getSupabase()
  if (sb) {
    try {
      const { error } = await sb.storage.from(bucket).upload(filePath, buffer, {
        contentType,
        upsert: true,
      })
      if (!error) {
        const { data } = sb.storage.from(bucket).getPublicUrl(filePath)
        console.log(`[Storage] Uploaded to Supabase: ${bucket}/${filePath}`)
        return data.publicUrl
      }
      console.warn(`[Storage] Supabase upload failed (${error.message}), falling back to local`)
    } catch (err: any) {
      console.warn(`[Storage] Supabase error, falling back to local:`, err.message)
    }
  }

  // Local fallback
  const localDir = await ensureLocalDir(bucket)
  const localPath = path.join(localDir, filePath)
  const localDirOfFile = path.dirname(localPath)
  await mkdir(localDirOfFile, { recursive: true })
  await writeFile(localPath, Buffer.from(buffer))
  console.log(`[Storage] Uploaded to local: ${localPath}`)
  return `/uploads/${bucket}/${filePath}`
}

/**
 * Delete a file — tries Supabase first, falls back to local.
 */
export async function deleteFromStorage(
  bucket: string,
  filePath: string
): Promise<void> {
  // Extract bare path if it's a full URL
  const cleaned = filePath.includes('/storage/v1/object/public/')
    ? filePath.split('/storage/v1/object/public/')[1]
    : filePath.startsWith('/uploads/')
      ? filePath.replace('/uploads/', '')
      : filePath

  const sb = getSupabase()
  if (sb) {
    try {
      const { error } = await sb.storage.from(bucket).remove([cleaned])
      if (!error) {
        console.log(`[Storage] Deleted from Supabase: ${bucket}/${cleaned}`)
        return
      }
      console.warn(`[Storage] Supabase delete warning: ${error.message}`)
    } catch (err: any) {
      console.warn(`[Storage] Supabase delete error:`, err.message)
    }
  }

  // Local fallback
  try {
    const localPath = path.join(UPLOAD_DIR, cleaned)
    await unlink(localPath)
    console.log(`[Storage] Deleted from local: ${localPath}`)
  } catch {
    // File may not exist locally — ignore
  }
}

/**
 * Get a public URL for a file.
 */
export function getStoragePublicUrl(bucket: string, filePath: string): string {
  const sb = getSupabase()
  if (sb) {
    const { data } = sb.storage.from(bucket).getPublicUrl(filePath)
    return data.publicUrl
  }
  // Local fallback
  return `/uploads/${bucket}/${filePath}`
}

/**
 * Ensure a storage bucket exists on Supabase.
 * No-op if Supabase is not configured.
 */
export async function ensureBucket(bucket: string, isPublic = true): Promise<void> {
  const sb = getSupabase()
  if (!sb) return

  try {
    const { data: existing } = await sb.storage.getBucket(bucket)
    if (existing) return

    const { error } = await sb.storage.createBucket(bucket, {
      public: isPublic,
      fileSizeLimit: 5242880, // 5MB per file
    })
    if (error) {
      console.warn(`[Storage] Bucket creation warning (${bucket}): ${error.message}`)
    }
  } catch (err: any) {
    console.warn(`[Storage] Bucket check error:`, err.message)
  }
}
