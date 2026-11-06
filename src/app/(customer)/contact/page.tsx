'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Mail, Phone, MapPin, Clock, Send, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { DoodleBackground } from '@/components/decorative/DoodleBackground'
import { WashiTape, TornEdge, StickerPeel, DoodleShape, DoodleScribble } from '@/components/decorative/DoodleElements'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

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

const floatingEmojis = ['✨', '🎨', '📧', '💌', '✉️', '🎁', '🌈', '⭐']

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

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
      setShowConfetti(true)
      reset()
      toast.success('Message sent successfully! We\'ll get back to you within 24 hours.', {
        className: 'bg-white border-3 border-[var(--ink)] shadow-card',
        style: { borderRadius: '20px' },
      })
    } catch (error) {
      setSubmitStatus('error')
      toast.error('Failed to send message. Please try again later.', {
        className: 'bg-white border-3 border-[var(--ink)] shadow-card',
        style: { borderRadius: '20px' },
      })
    } finally {
      setIsSubmitting(false)
      // Hide confetti after animation
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] relative pt-24 pb-12 px-4 overflow-hidden">
      {/* Global Doodle Background */}
      <DoodleBackground shapeCount={10} />
      
      {/* Floating decorative elements */}
      <DoodleShape size="xl" color="primary" animation="float" className="absolute top-20 left-10 opacity-20" style={{ filter: 'blur(60px)' }} />
      <DoodleShape size="lg" color="secondary" animation="float" className="absolute bottom-20 right-10 opacity-20" style={{ filter: 'blur(60px)', animationDelay: '2s' }} />
      <DoodleShape size="md" color="accent" animation="wobble" className="absolute top-1/3 left-5 opacity-15" />
      <DoodleShape size="md" color="primary" animation="wobble" className="absolute top-2/3 right-5 opacity-15" style={{ animationDelay: '1s' }} />
      <DoodleScribble color="accent" width={120} height={60} className="absolute top-40 right-20 opacity-30" />
      <div className="absolute bottom-40 left-20 opacity-30" style={{ transform: 'rotate(180deg)' }}>
        <DoodleScribble color="secondary" width={100} height={50} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 relative"
        >
          <WashiTape rotation={-2} width={200} height={32} className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4" />
          <WashiTape rotation={3} width={140} height={28} className="absolute top-20 right-10 opacity-60" />
          <WashiTape rotation={-4} width={120} height={24} className="absolute top-32 left-10 opacity-60" />
          
          <h1 className="font-display text-4xl md:text-5xl text-primary mb-4 relative">
            <span className="sketch-underline">Contact Us</span>
          </h1>
          <p className="text-xl text-[var(--ink)]/60 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            {contactInfo.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              >
                <Card variant="doodle" padding="lg" className="h-full relative group">
                  <StickerPeel />
                  <WashiTape rotation={-3} width={120} height={24} className="absolute -top-4 left-4 opacity-80" />
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-input flex items-center justify-center border-3 border-[var(--primary)] relative">
                    <item.icon className="w-6 h-6 text-primary" />
                    <div className="absolute top-[-4px] right-[-4px] w-4 h-4 bg-[var(--accent)] border-2 border-[var(--ink)] rounded-tr-full shadow-[2px_2px_0_var(--ink)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <h3 className="font-display text-lg text-primary mb-2 text-center">{item.title}</h3>
                  <a href={item.href} className="block text-[var(--ink)]/70 text-center font-medium mb-2 hover:text-primary transition-colors">
                    {item.value}
                  </a>
                  <p className="text-sm text-[var(--ink)]/50 text-center">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Contact Form Column */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card variant="doodle" padding="xl" className="relative">
              {/* Torn edge top effect */}
              <TornEdge position="top" className="absolute top-0 left-0 right-0 h-4 bg-[var(--surface-card)] border-3 border-[var(--ink)] border-b-0" />
              
              <StickerPeel />
              <WashiTape rotation={-2} width={160} height={30} className="absolute -top-6 left-6 opacity-90" />
              <WashiTape rotation={4} width={100} height={24} className="absolute -top-4 right-6 opacity-60" />
              
              <div className="relative z-10">
                <h2 className="font-display text-2xl text-primary mb-8 relative inline-block">
                  <span className="sketch-underline">Send a Message</span>
                </h2>

                <AnimatePresence mode="wait">
                  {submitStatus === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
                      className="mb-8 p-6 bg-green-50 border-3 border-green-400 rounded-card flex items-start gap-4 relative"
                      role="alert"
                    >
                      <div className="w-10 h-10 flex-shrink-0 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-display text-lg text-green-700 mb-1">Message Sent!</p>
                        <p className="text-green-600">We'll get back to you within 24 hours.</p>
                      </div>
                      <div className="absolute top-4 right-4">
                        <DoodleShape size="sm" color="secondary" animation="float" className="opacity-30" />
                        <DoodleShape size="sm" color="accent" animation="wobble" className="opacity-30" style={{ top: '30px', left: '30px' }} />
                      </div>
                    </motion.div>
                  )}

                  {submitStatus === 'error' && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
                      className="mb-8 p-6 bg-red-50 border-3 border-red-400 rounded-card flex items-start gap-4 relative"
                      role="alert"
                    >
                      <div className="w-10 h-10 flex-shrink-0 bg-red-500 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-red-700">Failed to send message. Please try again later.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative">
                      <Input
                        label="Full Name"
                        placeholder="Your name"
                        {...register('name')}
                        error={errors.name?.message}
                        disabled={isSubmitting}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                      />
                      {/* Floating emoji on focus */}
                      <AnimatePresence>
                        {focusedField === 'name' && (
                          <motion.span
                            key="name-emoji"
                            initial={{ opacity: 0, scale: 0, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl pointer-events-none"
                            aria-hidden="true"
                          >
                            ✨
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="relative">
                      <Input
                        label="Email"
                        type="email"
                        placeholder="your@email.com"
                        {...register('email')}
                        error={errors.email?.message}
                        disabled={isSubmitting}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                      />
                      <AnimatePresence>
                        {focusedField === 'email' && (
                          <motion.span
                            key="email-emoji"
                            initial={{ opacity: 0, scale: 0, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl pointer-events-none"
                            aria-hidden="true"
                          >
                            📧
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      label="Phone (Optional)"
                      type="tel"
                      placeholder="+880 1XXX XXXXXXX"
                      {...register('phone')}
                      disabled={isSubmitting}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <AnimatePresence>
                      {focusedField === 'phone' && (
                        <motion.span
                          key="phone-emoji"
                          initial={{ opacity: 0, scale: 0, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0, y: -10 }}
                          transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl pointer-events-none"
                          aria-hidden="true"
                        >
                          📞
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative">
                    <Input
                      label="Subject"
                      placeholder="What's this about?"
                      {...register('subject')}
                      error={errors.subject?.message}
                      disabled={isSubmitting}
                      onFocus={() => setFocusedField('subject')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <AnimatePresence>
                      {focusedField === 'subject' && (
                        <motion.span
                          key="subject-emoji"
                          initial={{ opacity: 0, scale: 0, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0, y: -10 }}
                          transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl pointer-events-none"
                          aria-hidden="true"
                        >
                          💌
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative">
                    <Textarea
                      label="Message"
                      placeholder="Tell us more..."
                      {...register('message')}
                      error={errors.message?.message}
                      disabled={isSubmitting}
                      rows={6}
                      onFocus={() => setFocusedField('message')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <AnimatePresence>
                      {focusedField === 'message' && (
                        <motion.span
                          key="message-emoji"
                          initial={{ opacity: 0, scale: 0, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0, y: -10 }}
                          transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
                          className="absolute right-4 top-4 text-2xl pointer-events-none"
                          aria-hidden="true"
                        >
                          ✍️
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <Button type="submit" variant="doodle" size="xl" className="w-full" loading={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 relative"
        >
          <WashiTape rotation={-3} width={220} height={32} className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4" />
          <div className="absolute top-0 right-0 opacity-20">
            <DoodleScribble color="primary" width={180} height={90} />
          </div>
          <div className="absolute bottom-0 left-0 opacity-20" style={{ transform: 'rotate(180deg)' }}>
            <DoodleScribble color="secondary" width={140} height={70} />
          </div>
          
          <div className="relative z-10">
            <div className="text-center mb-12">
              <span className="sketch-underline font-display text-3xl md:text-4xl text-primary">
                Frequently Asked Questions
              </span>
              <p className="text-[var(--ink)]/60 mt-2">Quick answers to common questions</p>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card variant="doodle" padding="md" className="relative group">
                    <StickerPeel />
                    <WashiTape rotation={-1} width={80} height={18} className="absolute -top-3 right-4 opacity-70 text-xs" />
                    <button
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-[var(--light)]/50 transition-colors"
                      onClick={() => {}}
                    >
                      <span className="font-medium text-body text-[var(--ink)] pr-4">{faq.q}</span>
                      <motion.div
                        initial={{ rotate: 0 }}
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
                      >
                        <Sparkles className="w-5 h-5 text-primary" />
                      </motion.div>
                    </button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Newsletter Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 relative"
        >
          <WashiTape rotation={2} width={180} height={32} className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4" />
          <DoodleShape size="lg" color="accent" animation="float" className="absolute top-0 right-0 opacity-15" />
          
          <Card variant="doodle" padding="xl" className="bg-primary text-white text-center relative overflow-hidden">
            <StickerPeel />
            <TornEdge position="top" className="absolute top-0 left-0 right-0 h-4 bg-primary border-3 border-[var(--ink)] border-b-0" />
            
            <div className="relative z-10">
              <h2 className="font-display text-2xl md:text-3xl mb-4">Stay Updated</h2>
              <p className="text-white/80 mb-6 max-w-xl mx-auto">
                Get the latest designs, offers, and sticker inspiration delivered to your inbox.
              </p>
              <form 
                className="flex flex-col md:flex-row gap-3 max-w-md mx-auto" 
                onSubmit={(e) => {
                  e.preventDefault()
                  toast.success('Subscribed! Check your inbox for confirmation.', {
                    className: 'bg-white border-3 border-[var(--ink)] shadow-card',
                    style: { borderRadius: '20px' },
                  })
                }}
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-white text-[var(--ink)] focus:border-primary focus:shadow-input"
                  required
                  label=""
                />
                <Button variant="doodle-secondary" size="lg" type="submit">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Subscribe
                </Button>
              </form>
              <p className="text-white/60 text-sm mt-4">No spam, unsubscribe anytime.</p>
            </div>
            
            {/* Decorative floating shapes */}
            <DoodleShape size="sm" color="accent" animation="float" className="absolute top-10 left-10 opacity-30" />
            <DoodleShape size="sm" color="secondary" animation="wobble" className="absolute bottom-10 right-10 opacity-30" />
            <DoodleScribble color="accent" width={100} height={50} className="absolute top-20 right-20 opacity-20" />
          </Card>
        </motion.section>
      </div>

      {/* Confetti Celebration Overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            key="confetti"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
            aria-hidden="true"
          >
            {/* Confetti burst */}
            {Array.from({ length: 60 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1, 
                  scale: 1,
                  y: 0,
                  x: 0,
                  rotate: 0
                }}
                animate={{ 
                  opacity: 0, 
                  scale: 0,
                  y: 300 + Math.random() * 200,
                  x: (Math.random() - 0.5) * 500,
                  rotate: Math.random() * 720
                }}
                transition={{ 
                  duration: 1 + Math.random() * 1.5, 
                  ease: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  delay: Math.random() * 0.3
                }}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '30%',
                  width: `${4 + Math.random() * 10}px`,
                  height: `${4 + Math.random() * 10}px`,
                  backgroundColor: [
                    'var(--primary)', 
                    'var(--secondary)', 
                    'var(--accent)', 
                    'var(--pink)', 
                    'var(--purple)',
                    'var(--info)'
                  ][Math.floor(Math.random() * 6)],
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  transformOrigin: 'center',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
            
            {/* Floating doodle shapes */}
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={`shape-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 0.2, 0], 
                  scale: [0, 1, 0],
                  y: [0, -250],
                  x: [-150, 150],
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 2.5 + Math.random() * 2, 
                  delay: Math.random() * 0.5,
                  ease: 'easeOut'
                }}
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: '80%',
                  position: 'absolute',
                }}
              >
                <DoodleShape 
                  size={['sm', 'md', 'lg'][Math.floor(Math.random() * 3)] as 'sm' | 'md' | 'lg'} 
                  color={['primary', 'secondary', 'accent', 'ink'][Math.floor(Math.random() * 4)] as 'primary' | 'secondary' | 'accent' | 'ink'}
                  animation="none"
                />
              </motion.div>
            ))}
            
            {/* Floating emojis */}
            {floatingEmojis.map((emoji, i) => (
              <motion.span
                key={`emoji-${i}`}
                initial={{ opacity: 0, scale: 0, y: 0 }}
                animate={{ 
                  opacity: [0, 1, 0], 
                  scale: [0, 1.5, 0],
                  y: [0, -300],
                  x: [-100, 100],
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 2 + Math.random() * 1.5, 
                  delay: Math.random() * 0.4,
                  ease: 'easeOut'
                }}
                style={{
                  position: 'absolute',
                  left: `${15 + Math.random() * 70}%`,
                  top: '70%',
                  fontSize: `${2 + Math.random() * 2}rem`,
                  pointerEvents: 'none',
                }}
              >
                {emoji}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}