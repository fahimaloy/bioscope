import { prisma } from '@/lib/prisma'
import { handleRouteError, ok } from '@/lib/api-utils'
import { contactSchema } from '@/lib/validations/contact'
import { enforceRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const rateLimited = enforceRateLimit(request, 'contact')
    if (rateLimited) return rateLimited

    const body = await request.json()
    const validated = contactSchema.parse(body)

    // Notify admins; never log the visitor's personal data.
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'CONTACT',
            title: `Contact form: ${validated.subject}`,
            message: validated.message.slice(0, 500),
            data: { fromEmail: validated.email, fromName: validated.name, url: '/admin/dashboard' },
          },
        })
      )
    )

    return ok({ message: 'Message received. We will get back to you soon.' })
  } catch (error) {
    return handleRouteError(error)
  }
}
