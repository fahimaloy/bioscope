'use client'

import { ContentPage } from '@/components/content/ContentPage'

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms of Service"
      eyebrow="Legal"
      sections={[
        {
          heading: 'Using BioScope',
          body: [
            // TODO: owner copy — approved terms of service (orders, payment,
            // IP of uploaded designs, liability, governing law). No invented
            // legal text is shipped.
            'Our terms of service are being finalized. By placing an order you agree to provide accurate delivery information and to pay the agreed amount on delivery (COD) or via the agreed method.',
            'You retain ownership of the designs you upload; you grant us the licence needed to print and fulfil your order. For full terms, contact us.',
          ],
        },
      ]}
    />
  )
}
