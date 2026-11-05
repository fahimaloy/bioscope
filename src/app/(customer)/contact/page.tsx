'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Mail, Phone, MapPin, Clock, Send, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DoodleScatter } from '@/components/decorative/DoodleScatter'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
})

type ContactFormData = z.infer<typeof contactSchema>

const contactInfo = [
  { icon: Mail, title: 'Email Us', value: 'hello@bioscope.com', href: 'mailto:hello@bioscope.com', desc: 'We respond within 24 hours' },
  { icon: Phone, title: 'Call Us', value: '+880 1700 000000', href: 'tel:+8801700000000', desc: 'Mon-Fri 9AM-6PM (GMT+6)' },
  { icon: MapPin, title: 'Visit Us', value: 'Dhaka, Bangladesh', href: '#', desc: 'By appointment only' },
  { icon: Clock, title: 'Business Hours', value: 'Sat-Thu 9AM-6PM', href: '#', desc: 'Friday closed' },
]

const faqs = [
  {
    q: 'How long does delivery take?',
    a: 'Inside Dhaka: 2-3 business days. Outside Dhaka: 3-5 business days. Custom orders may take additional time for production.',
  },
  {
    q: 'What file formats do you accept for custom designs?',
    a: 'We accept PNG, JPG, PDF, AI, and EPS files. For best results, use vector files (AI, EPS, PDF) or high-resolution PNG (300 DPI minimum).',
  },
  {
    q: 'Can I order a sample before placing a large order?',
    a: 'Yes! We offer sample packs for most products. Contact us for details on sample pricing and availability.',
  },
  {
    q: 'What is your return policy?',
    a: 'Custom printed items cannot be returned unless there is a manufacturing defect. Standard products can be returned within 30 days if unused.',
  },
  {
    q: 'Do you offer bulk discounts?',
    a: 'Yes! We offer volume pricing tiers. The more you order, the lower the per-unit cost. Check individual product pages for quantity pricing.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept Cash on Delivery (COD) and Bank Transfer. Payment is collected upon delivery for COD orders.',
  },
]

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

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
      reset()
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] relative pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl text-primary mb-4">Contact Us</h1>
          <p className="text-xl text-[var(--ink)]/60 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            {contactInfo.map((item) => (
              <Card key={item.title} className="p-6 h-full">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-input flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg text-primary mb-2 text-center">{item.title}</h3>
                <a href={item.href} className="block text-[var(--ink)]/70 text-center font-medium mb-2 hover:text-primary">
                  {item.value}
                </a>
                <p className="text-sm text-[var(--ink)]/50 text-center">{item.desc}</p>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="font-display text-2xl text-primary mb-6">Send a Message</h2>

              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-input flex items-center gap-3 text-green-700" role="alert">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Message sent successfully!</p>
                    <p className="text-sm">We'll get back to you within 24 hours.</p>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-input flex items-center gap-3 text-red-700" role="alert">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>Failed to send message. Please try again later.</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    {...register('name')}
                    error={errors.name?.message}
                    disabled={isSubmitting}
                  />
                  <Input
                    label="Email"
                    type="email"
                    {...register('email')}
                    error={errors.email?.message}
                    disabled={isSubmitting}
                  />
                </div>
                <Input
                  label="Phone (Optional)"
                  type="tel"
                  {...register('phone')}
                  disabled={isSubmitting}
                />
                <Input
                  label="Subject"
                  {...register('subject')}
                  error={errors.subject?.message}
                  disabled={isSubmitting}
                />
                <Textarea
                  label="Message"
                  {...register('message')}
                  error={errors.message?.message}
                  disabled={isSubmitting}
                  rows={6}
                />
                <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </Button>
              </form>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-16">
        <DoodleScatter count={3} className="absolute top-0 right-0 w-32 h-32" />
          <div className="text-center mb-12">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="text-[var(--ink)]/60 mt-2">Quick answers to common questions</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="overflow-hidden">
                <button
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-[var(--light)]/50 transition-colors"
                  onClick={() => {}}
                >
                  <span className="font-medium text-body text-[var(--ink)] pr-4">{faq.q}</span>
                  <Sparkles className="w-5 h-5 text-primary" />
                </button>
              </Card>
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <section className="mt-16">
          <Card className="p-8 bg-primary text-white text-center">
            <h2 className="font-display text-2xl md:text-3xl mb-4">Stay Updated</h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Get the latest designs, offers, and sticker inspiration delivered to your inbox.
            </p>
            <form className="flex flex-col md:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-input text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
              <Button variant="secondary" size="lg">
                Subscribe
              </Button>
            </form>
            <p className="text-white/60 text-sm mt-4">No spam, unsubscribe anytime.</p>
          </Card>
        </section>
      </div>
    </div>
  )
}