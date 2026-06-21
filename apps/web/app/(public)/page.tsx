import { createClient } from '@/lib/supabase/server'
import { STATUTS_PUBLICS } from '@/lib/catalogue/statuts'
import { HeroEditorial } from '@/components/landing/HeroEditorial'
import { JourneyShortcuts } from '@/components/landing/JourneyShortcuts'
import { GuidedSearchSteps } from '@/components/landing/GuidedSearchSteps'
import { FeaturedProperties } from '@/components/landing/FeaturedProperties'
import { PrestigeCommunes } from '@/components/landing/PrestigeCommunes'
import { FlashOffersSection } from '@/components/landing/FlashOffersSection'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { TrustStrip } from '@/components/landing/TrustStrip'
import { ServicesPillars } from '@/components/landing/ServicesPillars'
import { PublishChoiceTeaser } from '@/components/landing/PublishChoiceTeaser'
import { MapZones } from '@/components/landing/MapZones'
import { StatsRibbon } from '@/components/landing/StatsRibbon'
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
    .in('statut', [...STATUTS_PUBLICS])
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

  // Arrière-plan Hero — image éditoriale curatée : villa de luxe moderne avec
  // grande piscine, ambiance résidence de standing.
  // Fixe et toujours flatteuse : on n'utilise PAS les photos de biens en fond
  // (risque de tomber sur un terrain/chantier peu engageant).
  const HERO_BG =
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=2400&auto=format&fit=crop'

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
      {/* 1. Hero éditorial — search + wizard CTA */}
      <HeroEditorial bgImage={HERO_BG} featuredBiens={premiumProperties} />

      {/* 2. Dernières visites — auto-hidden si pas d'historique (retour visiteur) */}
      <RecentlyViewed />

      {/* 3. 🏠 BIENS RÉELS EN PREMIER — un novice doit voir le produit (photos + prix)
            dès le 1er scroll, sinon il décroche en < 8s. Remonté tout en haut. */}
      <FeaturedProperties initialBiens={biensWithPhoto} />

      {/* 4. Bandeau confiance — gratuit/vérifié/anti-arnaque, juste après les biens */}
      <TrustStrip />

      {/* 5. 🚪 Parcours — les 2 portes « je cherche » / « je publie ». Remonté ici :
            auto-segmentation tôt + sortie immédiate pour le propriétaire (sinon il
            scrolle du contenu locataire et part). Après biens+confiance = on ne force
            pas un choix avant le désir. Sert les inscriptions des 2 publics. */}
      <JourneyShortcuts />

      {/* 6. Déroulé visuel des 3 étapes — montre au « je cherche » que c'est rapide */}
      <GuidedSearchSteps />

      {/* 7. Chiffres clés — preuve sociale par les nombres (consensus) */}
      <StatsRibbon />

      {/* 8. ⚠️ Comment ça marche — mécanisme anti-arnaque (coordonnées masquées, conseiller, KYC) */}
      <HowItWorks />

      {/* 9. Témoignages — preuve sociale humaine (visages/noms) > chiffres, identification */}
      <TestimonialsSection />

      {/* 10. Près de chez moi (carte interactive) — ré-engagement produit */}
      <NearMeSection initialBiens={biensWithPhoto} />

      {/* 11. Marché en direct — rareté/urgence (aversion à la perte), proche de la décision */}
      <FlashOffersSection />

      {/* 12. CTA final propriétaire (2 voies : compte Premium / WhatsApp 1 min).
            Peak-end + répétition de l'action signup pour le 2e public ; catche
            le proprio qui a parcouru toute la page. */}
      <PublishChoiceTeaser />

      {/* 13. Footer */}
      <Footer />
    </main>
  )
}
