'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DoodleBackground } from '@/components/decorative/DoodleBackground'
import { WashiTape, StickerPeel, DoodleShape, DoodleScribble } from '@/components/decorative/DoodleElements'
import { StaggeredText } from '@/components/animations/StaggeredText'
import { CounterAnimation } from '@/components/animations/CounterAnimation'
import { Shield, RotateCcw, Heart, Sparkles, Palette, Leaf } from 'lucide-react'
import { motion } from 'framer-motion'

const stats = [
  { value: 500, label: 'Happy Customers' },
  { value: 150, label: 'Projects Done' },
  { value: 50, label: 'Awards Won' },
]

const team = [
  { name: 'Sarah Ahmed', role: 'Founder & CEO', bio: 'Passionate about design and entrepreneurship', avatar: 'SA' },
  { name: 'Rahman Khan', role: 'Creative Director', bio: 'Turns ideas into stunning visual designs', avatar: 'RK' },
  { name: 'Fatima Begum', role: 'Operations Manager', bio: 'Ensures smooth production and delivery', avatar: 'FB' },
  { name: 'Karim Hassan', role: 'Lead Developer', bio: 'Builds the tech that powers our platform', avatar: 'KH' },
]

const values = [
  { title: 'Creativity First', desc: 'Every design is a chance to create something amazing', icon: Sparkles },
  { title: 'Customer Obsessed', desc: 'Your satisfaction is our top priority', icon: Heart },
  { title: 'Sustainable Practices', desc: 'Eco-friendly materials and responsible production', icon: Leaf },
]

const sectionContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const sectionItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      duration: 0.6,
    },
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4 relative overflow-hidden">
      {/* Global Doodle Background */}
      <DoodleBackground shapeCount={12} />
      
      {/* Floating decorative elements */}
      <DoodleShape size="xl" color="primary" animation="float" className="absolute top-20 left-10 opacity-20" style={{ filter: 'blur(60px)' }} />
      <DoodleShape size="lg" color="secondary" animation="float" className="absolute bottom-20 right-10 opacity-20" style={{ filter: 'blur(60px)', animationDelay: '2s' }} />
      <DoodleShape size="md" color="accent" animation="wobble" className="absolute top-1/2 left-5 opacity-15" style={{ animationDelay: '1s' }} />
      <DoodleShape size="md" color="primary" animation="wobble" className="absolute top-1/2 right-5 opacity-15" style={{ animationDelay: '3s' }} />
      <DoodleScribble color="accent" width={120} height={60} className="absolute top-40 right-20 opacity-30" />
      <div className="absolute bottom-40 left-20 opacity-30" style={{ transform: 'rotate(180deg)' }}>
        <DoodleScribble color="secondary" width={100} height={50} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Hero Section */}
        <section className="relative py-20 text-center">
          {/* Washi tape accents */}
          <WashiTape rotation={-3} width={180} height={32} className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4" />
          <WashiTape rotation={2} width={140} height={28} className="absolute top-20 right-10 opacity-60" />
          <WashiTape rotation={-5} width={120} height={24} className="absolute top-32 left-10 opacity-60" />
          
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.175, 0.885, 0.32, 1.275] }}
            >
              <StaggeredText as="h1" className="mb-6" style={{ fontSize: 'clamp(4rem, 10vw, 8rem)' }}>
                ABOUT US
              </StaggeredText>
              <p className="subtitle text-2xl md:text-3xl mb-8 max-w-2xl mx-auto text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
                Making Awesome Fun Things Happen with Custom Stickers
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge variant="primary" size="lg">Since 2020</Badge>
                <Badge variant="secondary" size="lg">500+ Clients</Badge>
                <Badge variant="accent" size="lg">Bangladesh Made</Badge>
              </div>
            </motion.div>

            {/* Floating decorative shapes around hero */}
            <DoodleShape size="sm" color="primary" animation="float" className="absolute -top-10 -left-10 opacity-30" />
            <DoodleShape size="sm" color="accent" animation="wobble" className="absolute -top-10 -right-10 opacity-30" style={{ animationDelay: '1s' }} />
            <DoodleShape size="sm" color="secondary" animation="float" className="absolute bottom-20 -left-10 opacity-30" style={{ animationDelay: '2s' }} />
            <DoodleShape size="sm" color="primary" animation="wobble" className="absolute bottom-20 -right-10 opacity-30" style={{ animationDelay: '3s' }} />
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 relative">
          <WashiTape rotation={-2} width={200} height={32} className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4" />
          
          <motion.div
            variants={sectionContainerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {stats.map((stat) => (
                <motion.div key={stat.label} variants={sectionItemVariants}>
                  <Card variant="doodle" padding="lg" className="text-center relative">
                    <StickerPeel />
                    <CounterAnimation
                      target={stat.value}
                      duration={2000}
                      className="text-4xl font-display text-primary mb-2"
                    >
                      <p className="font-black text-uppercase text-sm mt-1 text-[var(--text-subtle)]">{stat.label}</p>
                    </CounterAnimation>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Our Story */}
        <section className="py-16 relative" id="story">
          <WashiTape rotation={3} width={180} height={32} className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4" />
          <WashiTape rotation={-4} width={140} height={28} className="absolute top-24 right-16 opacity-60" />
          <div className="absolute top-1/2 left-0 opacity-20" style={{ transform: 'rotate(-90deg)' }}>
        <DoodleScribble color="primary" width={160} height={80} />
      </div>
          
          <motion.div
            variants={sectionContainerVariants}
            initial="hidden"
            animate="visible"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="relative z-10"
          >
            <div className="max-w-4xl mx-auto px-6">
              <motion.div
                variants={sectionItemVariants}
                className="text-center mb-12"
              >
                <span className="sketch-underline font-display text-3xl md:text-4xl text-primary">
                  Our Story
                </span>
              </motion.div>
              
              <motion.div
                variants={sectionItemVariants}
                className="space-y-8 text-lg text-[color-mix(in_srgb,var(--ink)_70%,transparent)] leading-relaxed"
              >
                <p>
                  BioScope started with a simple idea: everyone deserves to express themselves through custom designs. 
                  What began as a small home-based sticker printing operation in Dhaka has grown into Bangladesh's 
                  most trusted custom sticker platform, serving thousands of creators, businesses, and dreamers.
                </p>
                <p>
                  We believe that stickers are more than just adhesive paper — they're tiny canvases for big ideas. 
                  Whether you're a small business owner branding your packages, an artist sharing your illustrations, 
                  or someone who just wants to decorate their laptop, we're here to make your vision stick.
                </p>
                <p className="font-semibold text-primary">
                  Every sticker we print carries a piece of someone's story. That's a responsibility we take seriously.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Materials Section */}
        <section className="py-16 relative" id="materials">
          <WashiTape rotation={-3} width={200} height={32} className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4" />
          <DoodleShape size="lg" color="secondary" animation="float" className="absolute top-1/2 right-0 opacity-15" />
          
          <motion.div
            variants={sectionContainerVariants}
            initial="hidden"
            animate="visible"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="relative z-10"
          >
            <motion.div
              variants={sectionItemVariants}
              className="text-center mb-12"
            >
              <span className="sketch-underline font-display text-3xl md:text-4xl text-primary">
                Our Materials
              </span>
            </motion.div>

            <motion.div
              variants={sectionItemVariants}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
            >
              {[
                { name: 'Vinyl', desc: 'Durable, weatherproof, perfect for outdoor use', icon: Shield },
                { name: 'Paper', desc: 'Eco-friendly, matte finish, great for indoor', icon: Leaf },
                { name: 'Kraft', desc: 'Natural brown texture, rustic & sustainable', icon: RotateCcw },
                { name: 'Holographic', desc: 'Iridescent shine that changes with light', icon: Sparkles },
              ].map((material, index) => (
                <Card key={index} variant="doodle" padding="lg" className="text-center relative">
                  <StickerPeel />
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-input flex items-center justify-center">
                    <material.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl text-primary mb-2">{material.name}</h3>
                  <p className="text-[color-mix(in_srgb,var(--ink)_70%,transparent)] text-sm">{material.desc}</p>
                </Card>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Team Section */}
        <section className="py-16 relative" id="team">
          <WashiTape rotation={2} width={180} height={32} className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4" />
          <WashiTape rotation={-3} width={120} height={24} className="absolute top-32 left-20 opacity-60" />
          <div className="absolute top-1/2 right-0 opacity-20" style={{ transform: 'rotate(-90deg)' }}>
        <DoodleScribble color="secondary" width={140} height={70} />
      </div>
          
          <motion.div
            variants={sectionContainerVariants}
            initial="hidden"
            animate="visible"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="relative z-10"
          >
            <motion.div
              variants={sectionItemVariants}
              className="text-center mb-12"
            >
              <span className="sketch-underline font-display text-3xl md:text-4xl text-primary">
                Meet Our Team
              </span>
              <p className="text-[var(--text-subtle)] mt-2">The people behind the stickers</p>
            </motion.div>

            <motion.div
              variants={sectionItemVariants}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
            >
              {team.map((member, index) => (
                <motion.div key={index} variants={sectionItemVariants}>
                  <Card variant="doodle" padding="lg" className="text-center relative group">
                    <StickerPeel />
                    <div className="relative mb-4">
                      <div className="w-28 h-28 mx-auto bg-primary/10 rounded-full flex items-center justify-center border-3 border-[var(--primary)] relative overflow-hidden">
                        <span className="text-3xl font-display text-primary relative z-10">{member.avatar}</span>
                        {/* Peel effect on avatar */}
                        <div className="absolute top-[-4px] right-[-4px] w-5 h-5 bg-[var(--accent)] border-2 border-[var(--ink)] rounded-tr-full shadow-[2px_2px_0_var(--ink)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                    <h3 className="font-display text-lg text-[var(--ink)] mb-1">{member.name}</h3>
                    <p className="text-primary text-sm mb-2">{member.role}</p>
                    <p className="text-[var(--text-subtle)] text-sm">{member.bio}</p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Values Section */}
        <section className="py-16 relative bg-[var(--dark)] text-white" id="values">
          <WashiTape rotation={-2} width={200} height={32} className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4" />
          <DoodleShape size="xl" color="accent" animation="float" className="absolute top-0 left-0 opacity-10" style={{ filter: 'blur(80px)' }} />
          <DoodleShape size="lg" color="primary" animation="wobble" className="absolute bottom-0 right-0 opacity-10" style={{ filter: 'blur(80px)' }} />
          <DoodleScribble color="accent" width={180} height={90} className="absolute top-20 right-20 opacity-20" />
          
          <motion.div
            variants={sectionContainerVariants}
            initial="hidden"
            animate="visible"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="relative z-10 max-w-4xl mx-auto"
          >
            <motion.div
              variants={sectionItemVariants}
              className="text-center mb-12"
            >
              <span className="sketch-underline font-display text-3xl md:text-4xl text-white">
                Our Values
              </span>
            </motion.div>

            <motion.div
              variants={sectionItemVariants}
              className="grid md:grid-cols-3 gap-8"
            >
              {values.map((value, index) => (
                <Card key={index} variant="doodle" padding="lg" className="text-center relative bg-[var(--dark)] border-primary">
                  <StickerPeel />
                  <div className="w-14 h-14 mx-auto mb-4 bg-primary/20 rounded-input flex items-center justify-center border-2 border-[var(--primary)]">
                    <value.icon className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="font-display text-xl text-white mb-2">{value.title}</h3>
                  <p className="text-white/70">{value.desc}</p>
                </Card>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="py-16 relative text-center">
          <WashiTape rotation={3} width={180} height={32} className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4" />
          <WashiTape rotation={-4} width={140} height={28} className="absolute bottom-10 right-10 opacity-60" />
          <DoodleShape size="md" color="primary" animation="float" className="absolute top-20 left-10 opacity-20" />
          <DoodleShape size="md" color="accent" animation="wobble" className="absolute bottom-20 right-10 opacity-20" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10"
          >
            <h2 className="font-display text-3xl md:text-4xl text-primary mb-6">Ready to Create?</h2>
            <p className="text-xl text-[var(--text-subtle)] mb-8 max-w-xl mx-auto">
              Join thousands of happy customers who trust us for their custom sticker needs.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/shop">
                <Button variant="doodle" size="lg">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Shop Now
                </Button>
              </a>
              <a href="/custom-sticker">
                <Button variant="doodle-secondary" size="lg">
                  <Palette className="w-5 h-5 mr-2" />
                  Design Custom
                </Button>
              </a>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  )
}