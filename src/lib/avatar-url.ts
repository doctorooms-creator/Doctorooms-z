/**
 * Normalize an avatar image reference to a displayable URL.
 * 
 * Handles four cases:
 * 1. Cloudinary URL (res.cloudinary.com) — returned as-is
 * 2. Full URL (Supabase Storage / other) — returned as-is
 * 3. Relative path starting with '/' — returned as-is (local dev fallback)
 * 4. Bare filename (e.g. 'default.png', 'abc_123.jpg') — returns local fallback
 * 
 * For the 'default.png' fallback, returns empty string so the UI can show initials.
 */
export function resolveAvatarUrl(img: string | null | undefined): string {
  if (!img || img === 'default.png') return ''
  if (img.startsWith('http://') || img.startsWith('https://')) return img
  if (img.startsWith('/')) return img

  // Bare filename — local fallback
  return `/uploads/profile/${img}`
}
