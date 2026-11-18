import { handleRouteError, ok, requireAdmin, AppError } from '@/lib/api-utils'
import { uploadImage } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

// Admin-only upload of a brand logo / favicon data URL.
// Folder is fixed server-side to 'branding'.
export async function POST(request: Request) {
  try {
    await requireAdmin()

    const url = new URL(request.url)
    const kind = url.searchParams.get('type')
    if (kind !== 'logo' && kind !== 'favicon') {
      throw new AppError(400, "Query param 'type' must be 'logo' or 'favicon'", 'INVALID_TYPE')
    }

    const body = await request.json()
    const { dataUrl } = body ?? {}
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      throw new AppError(400, 'A valid image data URL is required', 'INVALID_IMAGE')
    }
    if (dataUrl.length > 10 * 1024 * 1024) {
      throw new AppError(413, 'Image is too large (max 10MB)', 'TOO_LARGE')
    }

    const result = await uploadImage(dataUrl, {
      folder: 'branding',
      publicId: `${kind}_${Date.now()}`,
      transformation: [{ width: 512, height: 512, crop: 'fit' }],
    })
    if (!result) {
      throw new AppError(502, 'Upload failed, please try again', 'UPLOAD_FAILED')
    }

    return ok({ url: result.url, type: kind })
  } catch (error) {
    return handleRouteError(error)
  }
}
