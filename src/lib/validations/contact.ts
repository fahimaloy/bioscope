import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }).max(100, { message: 'Name must be at most 100 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, { message: 'Please enter a valid phone number (10-15 digits, optional +)' }).optional(),
  subject: z.string().min(3, { message: 'Subject must be at least 3 characters' }).max(150, { message: 'Subject must be at most 150 characters' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }).max(5000, { message: 'Message must be at most 5000 characters' }),
})

export type ContactInput = z.infer<typeof contactSchema>
