import { MobileNav } from '@/components/layout/MobileNav'
import { PageWrapper } from '@/components/layout/PageWrapper'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Ruling 3: the Navbar is mounted once in the root layout; the CartDrawer
          moved there too (ruling 3), so it is no longer mounted twice. */}
      <PageWrapper background="default">{children}</PageWrapper>
      <MobileNav />
    </>
  )
}
