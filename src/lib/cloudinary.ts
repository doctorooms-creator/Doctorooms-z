import { v2 as cloudinary } from 'cloudinary'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

/** Whether Cloudinary is fully configured */
export const isCloudinaryReady = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

/** Local uploads directory (fallback) */
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

/** Ensure the local upload directory exists */
async function ensureLocalDir(subdir: string) {
  const dir = path.join(UPLOAD_DIR, subdir)
  await mkdir(dir, { recursive: true })
  return dir
}

/**
 * Upload a file to Cloudinary (or local fallback).
 * For images: uses Cloudinary image upload with transformations.
 * For non-images (PDF, DOC): uses Cloudinary raw upload.
 *
 * Returns the public URL of the uploaded file.
 */
export async function uploadToStorage(
  folder: string,
  filePath: string,
  buffer: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  // Try Cloudinary first
  if (isCloudinaryReady) {
    try {
      const isImage = contentType.startsWith('image/')
      const publicId = `${folder}/${path.parse(filePath).name}`

      const result = await new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader
          .upload_stream(
            {
              public_id: publicId,
              folder,
              resource_type: isImage ? 'image' : 'raw',
              ...(isImage && {
                transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
              }),
              // Overwrite if same public_id
              overwrite: true,
              // Use original filename as display name
              use_filename: true,
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result!)
            }
          )

        // Write buffer to the upload stream
        uploadStream.end(Buffer.from(buffer))
      })

      if (result?.secure_url) {
        console.log(`[Cloudinary] Uploaded: ${publicId} → ${result.secure_url}`)
        return result.secure_url
      }
    } catch (err: any) {
      console.warn(`[Cloudinary] Upload failed, falling back to local:`, err.message)
    }
  }

  // Local fallback
  const localDir = await ensureLocalDir(folder)
  const localPath = path.join(localDir, filePath)
  const localDirOfFile = path.dirname(localPath)
  await mkdir(localDirOfFile, { recursive: true })
  await writeFile(localPath, Buffer.from(buffer))
  console.log(`[Storage] Uploaded to local: ${localPath}`)
  return `/uploads/${folder}/${filePath}`
}

/**
 * Delete a file from Cloudinary (or local fallback).
 */
export async function deleteFromStorage(
  folder: string,
  filePath: string
): Promise<void> {
  // Extract public_id from Cloudinary URL if it's a full URL
  const isCloudinaryUrl = filePath.includes('res.cloudinary.com')

  if (isCloudinaryUrl && isCloudinaryReady) {
    try {
      // Parse public_id from Cloudinary URL
      // URL format: https://res.cloudinary.com/{cloud}/image/upload/v1234/{folder}/{public_id}.ext
      const urlParts = filePath.split('/')
      const uploadIndex = urlParts.indexOf('upload')
      if (uploadIndex !== -1) {
        // Get everything after upload/v{version}/
        const afterUpload = urlParts.slice(uploadIndex + 1)
        // Remove version prefix if present (v1234567890)
        const withoutVersion = afterUpload[0]?.match(/^v\d+$/) ? afterUpload.slice(1) : afterUpload
        const publicId = withoutVersion.join('/')
        // Remove extension for image resources
        const ext = path.extname(publicId)
        const resourceType = ext ? 'image' : 'raw'
        const cleanId = ext ? publicId.replace(ext, '') : publicId

        await cloudinary.uploader.destroy(cleanId, {
          resource_type: resourceType as 'image' | 'raw',
        })
        console.log(`[Cloudinary] Deleted: ${cleanId}`)
        return
      }
    } catch (err: any) {
      console.warn(`[Cloudinary] Delete error:`, err.message)
    }
  }

  // Local fallback
  try {
    let localPath: string
    if (filePath.startsWith('/uploads/')) {
      localPath = path.join(process.cwd(), 'public', filePath)
    } else if (filePath.startsWith('/')) {
      localPath = path.join(process.cwd(), filePath)
    } else {
      localPath = path.join(UPLOAD_DIR, filePath)
    }
    await unlink(localPath)
    console.log(`[Storage] Deleted from local: ${localPath}`)
  } catch {
    // File may not exist locally — ignore
  }
}

/**
 * Get a public URL for a file (useful for constructing URLs from stored paths).
 */
export function getStoragePublicUrl(folder: string, filePath: string): string {
  if (isCloudinaryReady) {
    const publicId = `${folder}/${path.parse(filePath).name}`
    return cloudinary.url(publicId, {
      secure: true,
      transformation: filePath.match(/\.(png|jpe?g|webp|gif)$/i)
        ? [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
        : [],
    })
  }
  return `/uploads/${folder}/${filePath}`
}

/**
 * Check if a URL is a Cloudinary URL.
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com')
}

/**
 * Extract public_id from a Cloudinary URL for deletion.
 */
export function extractPublicId(cloudinaryUrl: string): string | null {
  try {
    const urlParts = cloudinaryUrl.split('/')
    const uploadIndex = urlParts.indexOf('upload')
    if (uploadIndex === -1) return null

    const afterUpload = urlParts.slice(uploadIndex + 1)
    const withoutVersion = afterUpload[0]?.match(/^v\d+$/) ? afterUpload.slice(1) : afterUpload
    const joined = withoutVersion.join('/')
    const ext = path.extname(joined)
    return ext ? joined.replace(ext, '') : joined
  } catch {
    return null
  }
}
