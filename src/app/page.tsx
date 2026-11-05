import Link from 'next/link'
import { DoodleScatter } from '@/components/decorative/DoodleScatter'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-color)] overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-28 pb-16 px-4 text-center">
        <DoodleScatter count={6} />
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="font-[var(--font-display)] text-[clamp(3.5rem,12vw,8rem)] leading-[0.9] text-[var(--ink)] mb-6">
            Make Awesome<br />Fun Things Stick
          </h1>
          <p className="font-[var(--font-hand)] text-xl md:text-2xl text-[var(--ink)]/80 mb-8">
            Design doodles. Print stickers. Spread nostalgia.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/shop"><Button variant="primary" size="lg">Browse Stickers</Button></Link>
            <Link href="/custom-sticker"><Button variant="secondary" size="lg">Design Custom</Button></Link>
          </div>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <Badge size="lg">Free Delivery over 2000 BDT</Badge>
            <Badge variant="secondary" size="lg">Weatherproof</Badge>
            <Badge variant="accent" size="lg">Custom Welcome</Badge>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="marquee py-3 mb-16">
        <div className="marquee-inner">
          <span>✦ VINYL ✦ PAPER ✦ HOLOGRAPHIC ✦ KRAFT ✦ CUSTOM ✦ BIODIVERSITY ✦</span>
          <span>✦ VINYL ✦ PAPER ✦ HOLOGRAPHIC ✦ KRAFT ✦ CUSTOM ✦ BIODIVERSITY ✦</span>
        </div>
      </div>

      {/* Featured */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <h2 className="font-[var(--font-display)] text-4xl md:text-6xl text-[var(--ink)] mb-10 text-center">Featured Stickers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Vintage Doodle Pack', tag: 'vinyl', price: '350 BDT' },
            { title: 'Retro Space Cat', tag: 'holographic', price: '420 BDT' },
            { title: 'Kraft Flower Kit', tag: 'kraft', price: '280 BDT' },
          ].map((item, i) => (
            <Link key={i} href="/shop" className="block relative bg-[var(--paper)] border-3 border-[var(--ink)] rounded-[20px_4px_20px_4px] shadow-[8px_8px_0_var(--accent)] hover:shadow-[12px_12px_0_var(--primary)] transition-all p-5 rotate-[-0.5deg] hover:rotate-[0.5deg]">
              <span className="absolute top-[-8px] left-6 w-24 h-7 bg-[var(--pink)] border-2 border-[var(--ink)] -rotate-[2deg] shadow-[2px_2px_0_var(--ink)] text-[10px] font-[var(--font-display)] uppercase tracking-wider text-[var(--ink)] flex items-center justify-center">{item.tag}</span>
              <h3 className="font-[var(--font-display)] text-2xl text-[var(--primary)] mb-2">{item.title}</h3>
              <p className="font-[var(--font-hand)] text-xl text-[var(--ink)]">{item.price}</p>
              <div className="mt-4 h-32 bg-[var(--paper-deep)] rounded-xl border-2 border-[var(--ink)] flex items-center justify-center text-[var(--ink)]/30 font-[var(--font-display)] text-5xl">✦</div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 max-w-5xl mx-auto text-center">
        <h2 className="font-[var(--font-display)] text-4xl md:text-5xl text-[var(--ink)] mb-12">How It Works</h2>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {[
            { num: '01', title: 'Design', desc: 'Pick or doodle your own sticker art.' },
            { num: '02', title: 'Print', desc: 'We cut, print, and finish with craft.' },
            { num: '03', title: 'Stick', desc: 'Add to journals, laptops, or life.' },
          ].map((s) => (
            <div key={s.num} className="relative">
              <span className="font-[var(--font-display)] text-7xl text-[var(--accent)] opacity-40">{s.num}</span>
              <h3 className="font-[var(--font-display)] text-2xl text-[var(--ink)] mt-2">{s.title}</h3>
              <p className="font-[var(--font-hand)] text-lg text-[var(--ink)]/70 max-w-xs">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 max-w-3xl mx-auto text-center">
        <div className="bg-[var(--ink)] text-[var(--paper)] rounded-[30px_8px] p-10 shadow-[12px_12px_0_var(--accent)]">
          <h2 className="font-[var(--font-display)] text-3xl md:text-5xl mb-4">Can&apos;t Find It?</h2>
          <p className="font-[var(--font-hand)] text-xl mb-6">Design your own custom sticker with our easy builder.</p>
          <Link href="/custom-sticker"><Button variant="accent" size="lg">Design Custom Stickers</Button></Link>
        </div>
      </section>
    </main>
  )
}
