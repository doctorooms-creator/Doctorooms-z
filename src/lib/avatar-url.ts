/**
 * Normalize an avatar image reference to a displayable URL.
 * 
 * Handles three cases:
 * 1. Full URL (Supabase Storage) — returned as-is
 * 2. Relative path starting with '/' — returned as-is (local dev fallback)
 * 3. Bare filename (e.g. 'default.png', 'abc_123.jpg') — returns Supabase Storage public URL
 * 
 * For the 'default.png' fallback, returns empty string so the UI can show initials.
 */
export function resolveAvatarUrl(img: string | null | undefined): string {
  if (!img || img === 'default.png') return ''
  if (img.startsWith('http://') || img.startsWith('https://')) return img
  if (img.startsWith('/')) return img

  // Bare filename → Supabase Storage public URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/avatars/${img}`
  }
  // Fallback for local dev without Supabase
  return `/uploads/profile/${img}`
}
