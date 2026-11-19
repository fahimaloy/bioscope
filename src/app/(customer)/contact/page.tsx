'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Mail, Phone, MapPin, Clock, Send, Loader2, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react'
import { DoodleScatter, WashiTape, SketchUnderline } from '@/components/decorative'
import { motion, AnimatePresence } from 'framer-motion'
import { useMotionVariants } from '@/lib/motion'
import { toast } from 'sonner'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
})

type ContactFormData = z.infer<typeof contactSchema>

// TODO: owner copy — real contact details. These are placeholders.
const contactInfo = [
  { icon: Mail, title: 'Email Us', value: 'hello@bioscope.shop', href: 'mailto:hello@bioscope.shop', desc: 'We respond within 24 hours' },
  { icon: Phone, title: 'Call Us', value: '+880 1700 000000', href: 'tel:+880****0000', desc: 'Sat-Thu 9AM-6PM (GMT+6)' },
  { icon: MapPin, title: 'Visit Us', value: 'Dhaka, Bangladesh', href: '#', desc: 'By appointment only' },
  { icon: Clock, title: 'Business Hours', value: 'Sat-Thu 9AM-6PM', href: '#', desc: 'Friday closed' },
]

const faqs = [
  { q: 'How long does delivery take?', a: 'Inside Dhaka: 2-3 business days. Outside Dhaka: 3-5 business days. Custom orders may take additional time for production.' },
  { q: 'What file formats do you accept for custom designs?', a: 'We accept PNG, JPG, PDF, AI, and EPS files. For best results, use vector files (AI, EPS, PDF) or high-resolution PNG (300 DPI minimum).' },
  { q: 'Can I order a sample before placing a large order?', a: 'Yes! We offer sample packs for most products. Contact us for details on sample pricing and availability.' },
  { q: 'What is your return policy?', a: 'Custom printed items cannot be returned unless there is a manufacturing defect. Standard products can be returned within 30 days if unused.' },
  { q: 'Do you offer bulk discounts?', a: 'Yes! We offer volume pricing tiers. The more you order, the lower the per-unit cost. Check individual product pages for quantity pricing.' },
  { q: 'What payment methods do you accept?', a: 'We accept Cash on Delivery (COD) and Bank Transfer. Payment is collected upon delivery for COD orders.' },
]

// Brand-token confetti palette (no legacy --primary/--purple, no emoji).
const CONFETTI_COLORS = ['var(--pink)', 'var(--violet)', 'var(--gold)', 'var(--teal)', 'var(--blue)', 'var(--lime)']

export default function ContactPage() {
  const variants = useMotionVariants()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showConfetti, setShowConfetti] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({ resolver: zodResolver(contactSchema) })

  // FROZEN behaviour: posts the real /api/contact route (rate-limited, B3).
  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to send message')
      setSubmitStatus('success')
      setShowConfetti(true)
      reset()
      toast.success("Message sent successfully! We'll get back to you within 24 hours.", {
        className: 'bg-[var(--surface-raised)] border-2 border-[var(--ink)] shadow-ink-2',
        style: { borderRadius: 'var(--radius-lg)' },
      })
    } catch {
      setSubmitStatus('error')
      toast.error('Failed to send message. Please try again later.', {
        className: 'bg-[var(--surface-raised)] border-2 border-[var(--ink)] shadow-ink-2',
        style: { borderRadius: 'var(--radius-lg)' },
      })
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-12 pt-24">
      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Hero */}
        <motion.div variants={variants.fadeInUp} initial="initial" animate="animate" className="relative mb-12 text-center">
          <DoodleScatter count={6} seed="contact-hero" />
          <WashiTape rotation={-2} width={200} height={32} className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-4" />
          <h1 className="relative mb-4 font-display text-4xl text-[var(--text)] md:text-5xl">
            <SketchUnderline>Contact Us</SketchUnderline>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-[var(--text-muted)]">
            Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact info */}
          <div className="space-y-6 lg:col-span-1">
            {contactInfo.map((item) => (
              <Card key={item.title} variant="doodle" padding="lg" className="relative h-full">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border-2 border-[var(--ink)] bg-[color-mix(in_srgb,var(--brand)_10%,transparent)]">
                  <item.icon className="h-6 w-6 text-[var(--ink)]" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-center font-display text-lg text-[var(--text)]">{item.title}</h3>
                <a href={item.href} className="mb-2 block text-center font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]">
                  {item.value}
                </a>
                <p className="text-center text-sm text-[var(--text-subtle)]">{item.desc}</p>
              </Card>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <Card variant="doodle" padding="xl" className="relative">
              <WashiTape rotation={-2} width={160} height={30} className="absolute -top-6 left-6" />
              <div className="relative z-10">
                <h2 className="relative mb-8 inline-block font-display text-2xl text-[var(--text)]">
                  <SketchUnderline>Send a Message</SketchUnderline>
                </h2>

                <AnimatePresence>
                  {submitStatus === 'success' && (
                    <motion.div
                      key="success"
                      variants={variants.fadeInUp}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="relative mb-8 flex items-start gap-4 rounded-md border-2 border-[var(--green-strong)] bg-[color-mix(in_srgb,var(--green-strong)_12%,transparent)] p-6"
                      role="alert"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--green-strong)]">
                        <CheckCircle className="h-5 w-5 text-[var(--on-green-strong)]" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="mb-1 font-display text-lg text-[var(--text)]">Message Sent!</p>
                        <p className="text-[var(--text-muted)]">We&apos;ll get back to you within 24 hours.</p>
                      </div>
                    </motion.div>
                  )}
                  {submitStatus === 'error' && (
                    <motion.div
                      key="error"
                      variants={variants.fadeInUp}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="mb-8 flex items-start gap-4 rounded-md border-2 border-[var(--error)] bg-[color-mix(in_srgb,var(--error)_10%,transparent)] p-6"
                      role="alert"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--error)]">
                        <AlertCircle className="h-5 w-5 text-[var(--on-red)]" aria-hidden="true" />
                      </div>
                      <p className="text-[var(--text)]">Failed to send message. Please try again later.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Input label="Full Name" placeholder="Your name" {...register('name')} error={errors.name?.message} disabled={isSubmitting} />
                    <Input label="Email" type="email" placeholder="your@email.com" {...register('email')} error={errors.email?.message} disabled={isSubmitting} />
                  </div>
                  <Input label="Phone (Optional)" type="tel" placeholder="+880 1XXX XXXXXXX" {...register('phone')} disabled={isSubmitting} />
                  <Input label="Subject" placeholder="What's this about?" {...register('subject')} error={errors.subject?.message} disabled={isSubmitting} />
                  <Textarea label="Message" placeholder="Tell us more..." {...register('message')} error={errors.message?.message} disabled={isSubmitting} rows={6} />
                  <Button type="submit" variant="primary" size="xl" className="w-full" loading={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />Sending...</>
                    ) : (
                      <><Send className="mr-2 h-5 w-5" aria-hidden="true" />Send Message</>
                    )}
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>

        {/* FAQ — working accordion (was a dead onClick={() => {}}) */}
        <section className="relative mt-16">
          <WashiTape rotation={-3} width={220} height={32} className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-4" />
          <div className="relative z-10">
            <div className="mb-12 text-center">
              <span className="font-display text-3xl text-[var(--text)] md:text-4xl">
                <SketchUnderline>Frequently Asked Questions</SketchUnderline>
              </span>
              <p className="mt-2 text-[var(--text-subtle)]">Quick answers to common questions</p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              {faqs.map((faq, index) => {
                const open = openFaq === index
                return (
                  <Card key={index} variant="doodle" padding="md" className="relative">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 p-4 text-left"
                      onClick={() => setOpenFaq(open ? null : index)}
                      aria-expanded={open}
                      aria-controls={`faq-panel-${index}`}
                    >
                      <span className="pr-4 font-medium text-[var(--text)]">{faq.q}</span>
                      <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
                        <ChevronDown className="h-5 w-5 text-[var(--ink)]" aria-hidden="true" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          id={`faq-panel-${index}`}
                          key="panel"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-4 pb-4 text-[var(--text-muted)]"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Newsletter section REMOVED — it faked a subscription with no backend
            (toast "Subscribed!" but nothing persisted). Matches the T1.3 ruling
            that dropped the footer newsletter. TODO: owner — wire a real
            newsletter backend before reintroducing a signup form. */}
      </div>

      {/* Confetti celebration — brand tokens, no emoji, no deprecated doodles */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            key="confetti"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
            aria-hidden="true"
          >
            {Array.from({ length: 60 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, scale: 1, y: 0, x: 0, rotate: 0 }}
                animate={{ opacity: 0, scale: 0, y: 300 + Math.random() * 200, x: (Math.random() - 0.5) * 500, rotate: Math.random() * 720 }}
                transition={{ duration: 1 + Math.random() * 1.5, ease: [0.175, 0.885, 0.32, 1.275], delay: Math.random() * 0.3 }}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '30%',
                  width: `${4 + Math.random() * 10}px`,
                  height: `${4 + Math.random() * 10}px`,
                  backgroundColor: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  transformOrigin: 'center',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
