'use client'

import { ContentPage } from '@/components/content/ContentPage'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/Accordion'
import { faqs } from '@/lib/content/faqs'

export default function FaqPage() {
  return (
    <ContentPage title="Frequently Asked Questions" eyebrow="Support">
      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger>{faq.q}</AccordionTrigger>
            <AccordionContent>
              <p className="px-4 text-[var(--text-muted)]">{faq.a}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ContentPage>
  )
}
