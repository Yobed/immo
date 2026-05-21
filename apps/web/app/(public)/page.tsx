import { createClient } from '@/lib/supabase/server'
import { HeroEditorial } from '@/components/landing/HeroEditorial'
import { JourneyShortcuts } from '@/components/landing/JourneyShortcuts'
import { FeaturedProperties } from '@/components/landing/FeaturedProperties'
import { PrestigeCommunes } from '@/components/landing/PrestigeCommunes'
import { FlashOffersSection } from '@/components/landing/FlashOffersSection'
import { ServicesPillars } from '@/components/landing/ServicesPillars'
import { PublishChoiceTeaser } from '@/components/landing/PublishChoiceTeaser'
import { MapZones } from '@/components/landing/MapZones'
import { NearMeSection } from '@/components/landing/NearMeSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { Footer } from '@/components/landing/Footer'
import { RecentlyViewed } from '@/components/landing/RecentlyViewed'
import { formatFCFA } from '@/lib/format'

export const revalidate = 300 // ISR: revalide toutes les 5 min

export default async function HomePage() {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biens } = await (supabase as any)
    .from('biens')
    .select('id, titre, commune, quartier, type_bien, latitude, longitude, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces, est_disponible, is_verifie, score_ia, statut')
    .eq('statut', 'publie')
    // Cap homepage to last 80 biens — used by NearMe/Featured/Hero sections
    // (top 8 photos for Hero, top 3 premium, NearMe filters client-side).
    .order('is_verifie', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(80)

  const biensList = (biens ?? []).map((b: any) => ({
    ...b,
    latitude: b.latitude ? Number(String(b.latitude).replace(',', '.')) : null,
    longitude: b.longitude ? Number(String(b.longitude).replace(',', '.')) : null,
    prix_mois_fcfa: b.prix_mois_fcfa ? Number(b.prix_mois_fcfa) : null,
    prix_nuit_fcfa: b.prix_nuit_fcfa ? Number(b.prix_nuit_fcfa) : null,
    prix_vente_fcfa: b.prix_vente_fcfa ? Number(b.prix_vente_fcfa) : null,
  }))

  // Fetch cover photos for all biens
  let photoMap: Record<string, string> = {}
  if (biensList.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: medias } = await (supabase as any)
      .from('biens_medias')
      .select('bien_id, url, est_couverture')
      .in('bien_id', biensList.map((b: any) => b.id))
      .eq('type', 'photo')
      .order('ordre', { ascending: true })

    if (medias) {
      for (const m of medias as { bien_id: string; url: string; est_couverture: boolean }[]) {
        if (!photoMap[m.bien_id] || m.est_couverture) photoMap[m.bien_id] = m.url
      }
    }
  }

  const biensWithPhoto = biensList.map((b: any) => ({
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

  // Bien vedettes pour la carte flottante du Hero (plusieurs pour le cycle)
  const featuredBiens = biensWithPhoto.filter((b: any) => b.photo_url).slice(0, 8)

  // Sélectionner les 3 biens les plus prestigieux (prix le plus élevé) pour le PremiumShowcase
  const premiumProperties = [...biensWithPhoto]
    .filter((b: any) => b.photo_url)
    .sort((a: any, b: any) => {
      const priceA = a.prix_vente_fcfa || a.prix_mois_fcfa || 0;
      const priceB = b.prix_vente_fcfa || b.prix_mois_fcfa || 0;
      return priceB - priceA;
    })
    .slice(0, 3)
    .map(b => ({
      id: b.id,
      title: b.titre,
      location: b.commune + (b.quartier ? `, ${b.quartier}` : ''),
      price: b.prix_vente_fcfa
        ? formatFCFA(b.prix_vente_fcfa)
        : b.prix_mois_fcfa
          ? `${formatFCFA(b.prix_mois_fcfa)} / mois`
          : 'Prix sur demande',
      tags: [b.type_bien.replace('_', ' '), b.commune],
      image: b.photo_url!
    }))

  return (
    <main className="bg-[var(--background)]">
      {/* 1. Hero éditorial — image fixe, typo serif, recherche minimaliste */}
      <HeroEditorial bgImage={bgImages[0]} featuredBiens={premiumProperties} />

      {/* 2. Dernières visites (si l'utilisateur a déjà consulté des biens) */}
      <RecentlyViewed />

      {/* 3. Parcours utilisateurs — 5 personas explicites */}
      <JourneyShortcuts />

      {/* 3. Près de chez moi (Coup de coeur de l'utilisateur) */}
      <NearMeSection initialBiens={biensWithPhoto} />

      {/* 4. Sélection éditoriale */}
      <FeaturedProperties initialBiens={biensWithPhoto} />

      {/* 5. Veille en direct (réseau WhatsApp) */}
      <FlashOffersSection />

      {/* 6. Témoignages clients (proof social) */}
      <TestimonialsSection />

      {/* 7. Footer */}
      <Footer />
    </main>
  )
}
