import { handleRouteError, ok, requireAdmin, AppError } from '@/lib/api-utils'
import { uploadImage } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

// Admin-only upload of a category image data URL.
// Folder is fixed server-side to 'categories' (whitelisted in cloudinary.ts).
export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { dataUrl, name } = body ?? {}

    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      throw new AppError(400, 'A valid image data URL is required', 'INVALID_IMAGE')
    }
    if (dataUrl.length > 10 * 1024 * 1024) {
      throw new AppError(413, 'Image is too large (max 10MB)', 'TOO_LARGE')
    }

    const result = await uploadImage(dataUrl, {
      folder: 'categories',
      publicId: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    })
    if (!result) {
      throw new AppError(502, 'Upload failed, please try again', 'UPLOAD_FAILED')
    }

    return ok({ url: result.url, publicId: result.publicId, originalName: typeof name === 'string' ? name : 'category.png' })
  } catch (error) {
    return handleRouteError(error)
  }
}
