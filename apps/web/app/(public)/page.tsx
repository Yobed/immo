import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { FeaturedProperties } from '@/components/landing/FeaturedProperties'
import { Features } from '@/components/landing/Features'
import { MapZones } from '@/components/landing/MapZones'
import { Testimonials } from '@/components/landing/Testimonials'
import { Stats } from '@/components/landing/Stats'
import { Partners } from '@/components/landing/Partners'
import { CTAFinal } from '@/components/landing/CTAFinal'
import { Footer } from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <FeaturedProperties />
      <Features />
      <MapZones />
      <Testimonials />
      <Stats />
      <Partners />
      <CTAFinal />
      <Footer />
    </main>
  )
}
