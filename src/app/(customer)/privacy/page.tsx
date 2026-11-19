'use client'

import { ContentPage } from '@/components/content/ContentPage'

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy Policy"
      eyebrow="Legal"
      sections={[
        {
          heading: 'Your privacy',
          body: [
            // TODO: owner copy — approved privacy policy (data collected, usage,
            // retention, rights, cookies). No invented legal text is shipped.
            'Our privacy policy is being finalized. We collect only the information needed to fulfil your orders and improve your experience, and we do not sell your personal data.',
            'For any privacy question or request about your data, contact us and we\'ll respond directly.',
          ],
        },
      ]}
    />
  )
}
