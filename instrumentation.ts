export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { prisma } = await import('@/lib/prisma')
    const bcrypt = await import('bcryptjs')
    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD
    const name = process.env.ADMIN_NAME || 'Admin User'
    if (email && password) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (!existing) {
        await prisma.user.create({
          data: { email, passwordHash: await bcrypt.hash(password, 12), name, role: 'ADMIN', emailVerified: new Date() }
        })
      }
    }
  }
}