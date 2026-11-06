import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(72, { message: 'Password must be at most 72 characters' })
  .regex(/[A-Za-z]/, { message: 'Password must contain a letter' })
  .regex(/[0-9]/, { message: 'Password must contain a number' })

export const updateProfileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }).max(50, { message: 'Name must be at most 50 characters' }).optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, { message: 'Please enter a valid phone number (10-15 digits, optional +)' }).nullish(),
  avatar: z.string().url({ message: 'Please enter a valid URL' }).nullish(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: passwordSchema,
})

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  password: passwordSchema,
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
