'use client'

import { ContentPage } from '@/components/content/ContentPage'

export default function AccessibilityPage() {
  return (
    <ContentPage
      title="Accessibility"
      eyebrow="Legal"
      sections={[
        {
          heading: 'Our commitment',
          body: [
            // TODO: owner copy — approved accessibility statement (WCAG target,
            // known limitations, feedback channel).
            'We want BioScope to be usable by everyone. We aim for WCAG 2.1 AA contrast, keyboard navigability, and reduced-motion support across the shop.',
            'Our full accessibility statement is being finalized. If you hit a barrier, contact us and we\'ll help and fix it.',
          ],
        },
      ]}
    />
  )
}
