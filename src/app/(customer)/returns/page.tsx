'use client'

import { ContentPage } from '@/components/content/ContentPage'

export default function ReturnsPage() {
  return (
    <ContentPage
      title="Returns & Refunds"
      eyebrow="Support"
      sections={[
        {
          heading: 'Our returns approach',
          body: [
            'Custom printed items cannot be returned unless there is a manufacturing defect. Standard products can be returned within 30 days if unused.',
            // TODO: owner copy — approved returns/refund policy, process, timelines.
            'Our full returns and refund policy is being finalized. If something arrives damaged or incorrect, contact us and we\'ll make it right.',
          ],
        },
        {
          heading: 'How to start a return',
          body: [
            'Reach out via the contact page with your order number and a description of the issue. We\'ll guide you through the next steps.',
          ],
        },
      ]}
    />
  )
}
