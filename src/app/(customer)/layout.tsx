import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
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
      <Navbar />
      <PageWrapper background="doodle">{children}</PageWrapper>
      <Footer />
      <MobileNav />
      <CartDrawer />
    </>
  )
}