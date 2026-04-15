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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biens } = await (supabase as any)
    .from('biens')
    .select('id, titre, commune, quartier, type_bien, latitude, longitude, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa')
    .eq('statut', 'publie')

  const biensList = (biens ?? []) as {
    id: string; titre: string; commune: string; quartier: string | null
    type_bien: string; latitude: number | null; longitude: number | null
    prix_mois_fcfa: number | null; prix_nuit_fcfa: number | null; prix_vente_fcfa: number | null
  }[]

  // Fetch cover photos for all biens
  let photoMap: Record<string, string> = {}
  if (biensList.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: medias } = await (supabase as any)
      .from('biens_medias')
      .select('bien_id, url, est_couverture')
      .in('bien_id', biensList.map((b) => b.id))
      .eq('type', 'photo')
      .order('ordre', { ascending: true })

    if (medias) {
      for (const m of medias as { bien_id: string; url: string; est_couverture: boolean }[]) {
        if (!photoMap[m.bien_id] || m.est_couverture) photoMap[m.bien_id] = m.url
      }
    }
  }

  const biensWithPhoto = biensList.map((b) => ({
    ...b,
    photo_url: photoMap[b.id] ?? null,
  }))

  // Extraire les meilleures photos de biens pour le diaporama Hero (max 8)
  const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600607687920-4e2a09be1587?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1613490900233-08145a3b2b8b?q=80&w=2000&auto=format&fit=crop',
  ]
  const heroBgImages = Object.values(photoMap)
    .filter(Boolean)
    .slice(0, 8)
  const bgImages = heroBgImages.length >= 2 ? heroBgImages : FALLBACK_IMAGES

  return (
    <main>
      <Hero bgImages={bgImages} />
      <HowItWorks />
      <FeaturedProperties />
      <Features />
      <MapZones biens={biensWithPhoto} />
      <Testimonials />
      <Stats />
      <Partners />
      <CTAFinal />
      <Footer />
    </main>
  )
}
