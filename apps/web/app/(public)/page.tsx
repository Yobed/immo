import { createClient } from '@/lib/supabase/server'
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

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch properties globally for the interactive map
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biens } = await (supabase as any)
    .from('biens')
    .select('id, titre, commune, latitude, longitude, prix_mois_fcfa, prix_vente_fcfa')
    .eq('statut', 'publie')

  return (
    <main>
      <Hero />
      <HowItWorks />
      <FeaturedProperties />
      <Features />
      <MapZones biens={biens ?? []} />
      <Testimonials />
      <Stats />
      <Partners />
      <CTAFinal />
      <Footer />
    </main>
  )
}
