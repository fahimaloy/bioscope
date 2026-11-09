import { MobileNav } from '@/components/layout/MobileNav'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { PageWrapper } from '@/components/layout/PageWrapper'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Ruling 3: the Navbar is mounted once in the root layout. */}
      <PageWrapper background="doodle">{children}</PageWrapper>
      <MobileNav />
      <CartDrawer />
    </>
  )
}
