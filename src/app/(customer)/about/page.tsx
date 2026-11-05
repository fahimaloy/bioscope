import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DoodleScatter } from '@/components/decorative/DoodleScatter'
import { StaggeredText } from '@/components/animations/StaggeredText'
import { CounterAnimation } from '@/components/animations/CounterAnimation'
import { Truck, Shield, RotateCcw, Award, Users, Heart, Sparkles, Palette, Zap, Leaf, Globe, MessageCircle } from 'lucide-react'

const stats = [
  { value: 500, label: 'Happy Customers' },
  { value: 150, label: 'Projects Done' },
  { value: 50, label: 'Awards Won' },
]

const features = [
  { icon: Sparkles, title: 'Custom Designs', description: 'Create unique stickers with our intuitive design tool' },
  { icon: Leaf, title: 'Eco-Friendly Materials', description: 'Choose from vinyl, paper, kraft, and holographic options' },
  { icon: Truck, title: 'Fast Delivery', description: '2-3 days inside Dhaka, 3-5 days outside Dhaka' },
  { icon: Shield, title: 'Quality Guaranteed', description: 'Premium materials with vibrant, long-lasting prints' },
  { icon: Palette, title: 'Endless Customization', description: 'Any shape, size, finish, and quantity you need' },
  { icon: Zap, title: 'Easy Ordering', description: 'Simple checkout with COD and bank transfer options' },
]

const team = [
  { name: 'Sarah Ahmed', role: 'Founder & CEO', bio: 'Passionate about design and entrepreneurship', avatar: 'SA' },
  { name: 'Rahman Khan', role: 'Creative Director', bio: 'Turns ideas into stunning visual designs', avatar: 'RK' },
  { name: 'Fatima Begum', role: 'Operations Manager', bio: 'Ensures smooth production and delivery', avatar: 'FB' },
  { name: 'Karim Hassan', role: 'Lead Developer', bio: 'Builds the tech that powers our platform', avatar: 'KH' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      {/* Floating Background */}
      <DoodleScatter count={5} />

      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="relative py-20 text-center">
          <div className="relative z-10">
            <StaggeredText as="h1" className="mb-6" style={{ fontSize: 'clamp(4rem, 10vw, 8rem)' }}>
              ABOUT US
            </StaggeredText>
            <p className="subtitle text-2xl md:text-3xl mb-8 max-w-2xl mx-auto">
              Making Awesome Fun Things Happen with Custom Stickers
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="primary" size="lg">Since 2020</Badge>
              <Badge variant="secondary" size="lg">500+ Clients</Badge>
              <Badge variant="accent" size="lg">Bangladesh Made</Badge>
            </div>
          </div>

          {/* Floating Emojis */}
        </section>

        {/* Stats */}
        <section className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <CounterAnimation
                key={stat.label}
                target={stat.value}
                duration={2000}
                className="text-4xl font-display text-primary"
              >
                <p className="font-black text-uppercase text-sm mt-1 text-[var(--ink)]/60">{stat.label}</p>
              </CounterAnimation>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 bg-white rounded-card border-3 border-[var(--ink)] mx-4 shadow-card">
          <div className="max-w-4xl mx-auto px-6 py-12 text-center">
            <h2 className="font-display text-3xl text-primary mb-6">Our Mission</h2>
            <p className="text-xl text-[var(--ink)]/70 leading-relaxed mb-6">
              We believe that everyone deserves to express themselves through custom designs.
              Whether you're a small business owner, an artist, or just someone who loves stickers,
              we're here to make your vision stick.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {[
                { icon: Heart, title: 'Passion', desc: 'We love what we do and it shows in every sticker' },
                { icon: Users, title: 'Community', desc: 'Building relationships with every customer' },
                { icon: Award, title: 'Excellence', desc: 'Premium quality in every detail' },
              ].map((item, index) => (
                <div key={index} className="p-6 bg-[var(--light)] rounded-input">
                  <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-input flex items-center justify-center">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display text-xl text-primary mb-2">{item.title}</h3>
                  <p className="text-[var(--ink)]/70">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="section-title">Why Choose Us?</h2>
            <p className="text-[var(--ink)]/60 mt-2">Everything you need for perfect custom stickers</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 h-full hover:shadow-card-hover transition-shadow">
                <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-input flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-xl text-primary mb-2 text-center">{feature.title}</h3>
                <p className="text-[var(--ink)]/70 text-center">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="section-title">Meet Our Team</h2>
            <p className="text-[var(--ink)]/60 mt-2">The people behind the stickers</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-display text-primary">{member.avatar}</span>
                </div>
                <h3 className="font-display text-lg text-[var(--ink)] mb-1">{member.name}</h3>
                <p className="text-primary text-sm mb-2">{member.role}</p>
                <p className="text-[var(--ink)]/60 text-sm">{member.bio}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-dark text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="section-title text-white mb-8">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'Creativity First', desc: 'Every design is a chance to create something amazing' },
                { title: 'Customer Obsessed', desc: 'Your satisfaction is our top priority' },
                { title: 'Sustainable Practices', desc: 'Eco-friendly materials and responsible production' },
              ].map((value, index) => (
                <div key={index} className="p-6">
                  <div className="w-12 h-12 mx-auto mb-4 bg-accent/20 rounded-input flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-display text-xl text-white mb-2">{value.title}</h3>
                  <p className="text-white/70">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-primary mb-6">Ready to Create?</h2>
          <p className="text-xl text-[var(--ink)]/60 mb-8 max-w-xl mx-auto">
            Join thousands of happy customers who trust us for their custom sticker needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/shop">
              <Button variant="primary" size="lg">
                <Sparkles className="w-5 h-5 mr-2" />
                Shop Now
              </Button>
            </a>
            <a href="/custom-sticker">
              <Button variant="secondary" size="lg">
                <Palette className="w-5 h-5 mr-2" />
                Design Custom
              </Button>
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
