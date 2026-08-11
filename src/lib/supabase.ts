import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
})

/**
 * Upload a file to Supabase Storage and return the public URL.
 * Uses service role key (bypasses RLS) — server-side only.
 */
export async function uploadToStorage(
  bucket: string,
  filePath: string,
  buffer: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    })

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFromStorage(
  bucket: string,
  filePath: string
): Promise<void> {
  // filePath may be a full URL — extract just the path
  const cleaned = filePath.includes('/storage/v1/object/public/')
    ? filePath.split('/storage/v1/object/public/')[1]
    : filePath

  const { error } = await supabase.storage.from(bucket).remove([cleaned])
  if (error) {
    console.error(`Storage delete warning: ${error.message}`)
  }
}

/**
 * Get a public URL for a file in Supabase Storage.
 */
export function getStoragePublicUrl(bucket: string, filePath: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}

/**
 * Ensure a storage bucket exists (idempotent — does nothing if it already exists).
 */
export async function ensureBucket(bucket: string, isPublic = true): Promise<void> {
  // Try to get the bucket first
  const { data: existing } = await supabase.storage.getBucket(bucket)
  if (existing) return

  // Create if not found
  const { error } = await supabase.storage.createBucket(bucket, {
    public: isPublic,
    fileSizeLimit: 5242880, // 5MB per file
  })
  if (error) {
    console.error(`Bucket creation warning (${bucket}): ${error.message}`)
  }
}
