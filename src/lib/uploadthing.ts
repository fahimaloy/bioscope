import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { auth } from '@/lib/auth'

const f = createUploadthing()

export const uploadRouter = {
  // Product images - admin only
  productImage: f({
    image: {
      maxFileSize: '8MB',
      maxFileCount: 10,
    },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user || session.user.role !== 'ADMIN') {
        throw new UploadThingError('Unauthorized: Admin access required')
      }
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Product image uploaded:', file.url)
      return { uploadedBy: metadata.userId, url: file.url }
    }),

  // Custom sticker uploads - authenticated customers
  customSticker: f({
    image: {
      maxFileSize: '16MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) {
        throw new UploadThingError('Unauthorized: Please log in')
      }
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Custom sticker uploaded:', file.url)
      return { uploadedBy: metadata.userId, url: file.url }
    }),

  // Review images - authenticated customers
  reviewImage: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 5,
    },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) {
        throw new UploadThingError('Unauthorized: Please log in')
      }
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Review image uploaded:', file.url)
      return { uploadedBy: metadata.userId, url: file.url }
    }),

  // Avatar uploads
  avatar: f({
    image: {
      maxFileSize: '2MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) {
        throw new UploadThingError('Unauthorized: Please log in')
      }
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Avatar uploaded:', file.url)
      return { uploadedBy: metadata.userId, url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof uploadRouter