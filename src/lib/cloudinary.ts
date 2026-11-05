import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }

// Image transformation helpers
export const getOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number
    height?: number
    quality?: number | 'auto'
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
    crop?: 'fill' | 'scale' | 'fit' | 'thumb'
    gravity?: 'auto' | 'face' | 'center'
  } = {}
): string => {
  const { width, height, quality = 'auto', format = 'auto', crop = 'fill', gravity = 'auto' } = options

  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop, gravity, quality, format },
      { fetch_format: 'auto' },
    ],
    secure: true,
  })
}

export const getThumbnailUrl = (publicId: string, size: number = 200): string => {
  return getOptimizedImageUrl(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    gravity: 'auto',
    quality: 80,
  })
}

export const getProductImageUrls = (publicId: string) => {
  return {
    thumbnail: getThumbnailUrl(publicId, 150),
    small: getOptimizedImageUrl(publicId, { width: 400, height: 400 }),
    medium: getOptimizedImageUrl(publicId, { width: 800, height: 800 }),
    large: getOptimizedImageUrl(publicId, { width: 1200, height: 1200 }),
    original: cloudinary.url(publicId, { secure: true }),
  }
}

export const deleteImage = async (publicId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === 'ok'
  } catch (error) {
    console.error('Failed to delete image:', error)
    return false
  }
}

export const uploadImage = async (
  file: Buffer | string,
  options: {
    folder?: string
    publicId?: string
    transformation?: any[]
  } = {}
): Promise<{ publicId: string; url: string; width: number; height: number } | null> => {
  try {
    const result = await cloudinary.uploader.upload(file as string, {
      folder: options.folder || 'stickers',
      public_id: options.publicId,
      transformation: options.transformation,
      resource_type: 'image',
    })
    return {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
    }
  } catch (error) {
    console.error('Failed to upload image:', error)
    return null
  }
}

// Generate signed upload parameters for client-side uploads
const ALLOWED_UPLOAD_FOLDERS = ['stickers', 'products', 'custom-requests', 'reviews', 'avatars'] as const

export const getSignedUploadParams = (folder: string = 'stickers') => {
  if (!(ALLOWED_UPLOAD_FOLDERS as readonly string[]).includes(folder)) {
    throw new Error(`Upload folder "${folder}" is not allowed`)
  }
  const timestamp = Math.round(Date.now() / 1000)
  const params = {
    timestamp,
    folder,
    eager: [
      { width: 400, height: 400, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' },
      { width: 800, height: 800, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' },
    ],
  }

  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!)

  return {
    ...params,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  }
}