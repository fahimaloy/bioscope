import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/).optional(),
  subject: z.string().min(3).max(150),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
})

export type ContactInput = z.infer<typeof contactSchema>
