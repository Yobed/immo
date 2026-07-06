/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { STATUTS_PUBLICS } from '@/lib/catalogue/statuts'
import { fetchOgImage } from '@/lib/og/safe-image'

export const runtime = 'edge'
export const alt = "Bien immobilier - BOGBE'S GROUPE"
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface BienOgData {
  titre: string
  commune: string | null
  quartier: string | null
  type_bien: string | null
  prix_vente_fcfa: number | null
  prix_mois_fcfa: number | null
  prix_nuit_fcfa: number | null
  is_verifie: boolean | null
  photo_url: string | null
}

function formatPrix(b: BienOgData): { value: string; suffix: string } {
  if (b.prix_vente_fcfa) {
    return { value: formatFCFA(b.prix_vente_fcfa), suffix: '' }
  }
  if (b.prix_nuit_fcfa) {
    return { value: formatFCFA(b.prix_nuit_fcfa), suffix: ' / nuit' }
  }
  if (b.prix_mois_fcfa) {
    return { value: formatFCFA(b.prix_mois_fcfa), suffix: ' / mois' }
  }
  return { value: 'Prix sur demande', suffix: '' }
}

function formatFCFA(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

/**
 * OG dynamique pour la fiche bien — preview WhatsApp/Facebook avec
 * photo plein cadre + overlay prix + commune + badge "BOGBE'S Vérifié"
 * si is_verifie. Maximise le click-rate des partages.
 */
export default async function BienOg({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bien } = await (supabase as any)
    .from('biens')
    .select(`
      titre, commune, quartier, type_bien, statut,
      prix_vente_fcfa, prix_mois_fcfa, prix_nuit_fcfa, is_verifie,
      biens_medias(url, est_couverture, ordre)
    `)
    .eq('id', params.id)
    .in('statut', [...STATUTS_PUBLICS])
    .limit(1)
    .single()

  // Bien introuvable : fallback à l'OG du site
  if (!bien) {
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 64 }}>
          BOGBE&apos;S GROUPE
        </div>
      ),
      { ...size }
    )
  }

  const medias = (bien.biens_medias as { url: string; est_couverture: boolean; ordre: number }[] | null) ?? []
  const photoUrl = medias.sort((a, b) => (b.est_couverture ? 1 : 0) - (a.est_couverture ? 1 : 0))[0]?.url ?? null
  // Data URI (fetch contrôlé) — une URL distante brute fait planter Satori en silence
  const photo = await fetchOgImage(photoUrl)

  const data: BienOgData = {
    titre: bien.titre,
    commune: bien.commune,
    quartier: bien.quartier,
    type_bien: bien.type_bien,
    prix_vente_fcfa: bien.prix_vente_fcfa,
    prix_mois_fcfa: bien.prix_mois_fcfa,
    prix_nuit_fcfa: bien.prix_nuit_fcfa,
    is_verifie: bien.is_verifie,
    photo_url: photo,
  }

  const prix = formatPrix(data)
  const lieu = [data.quartier, data.commune].filter(Boolean).join(' · ')
  const typeLabel = (data.type_bien ?? '').replace(/_/g, ' ')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
          position: 'relative',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Photo en arrière-plan (img tag - Satori-compatible vs background:url) */}
        {data.photo_url && (
          <img
            src={data.photo_url}
            alt=""
            width={1200}
            height={630}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Overlay sombre pour lisibilité du texte */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)',
          }}
        />

        {/* Badge verified en haut */}
        {data.is_verifie && (
          <div
            style={{
              position: 'absolute',
              top: '40px',
              left: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              background: 'rgba(37, 99, 235, 0.95)',
              borderRadius: '999px',
              color: 'white',
              fontSize: '20px',
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}
          >
            ✓ BOGBE&apos;S Vérifié
          </div>
        )}

        {/* Logo marque en haut à droite */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: '40px',
            padding: '10px 16px',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          BOGBE&apos;S GROUPE
        </div>

        {/* Contenu principal en bas */}
        <div
          style={{
            position: 'absolute',
            bottom: '50px',
            left: '50px',
            right: '50px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            color: 'white',
          }}
        >
          {/* Prix énorme */}
          <div
            style={{
              fontSize: '76px',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: '#f97316',
              textShadow: '0 4px 20px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'baseline',
              gap: '12px',
            }}
          >
            <span>{prix.value}</span>
            {prix.suffix && (
              <span style={{ fontSize: '32px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                {prix.suffix}
              </span>
            )}
          </div>

          {/* Type + lieu — Satori exige display:flex explicite dès qu'un élément
              a plusieurs enfants (texte brut + span = crash silencieux sinon) */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              fontSize: '34px',
              fontWeight: 600,
              textTransform: 'capitalize',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            <span>{typeLabel}</span>
            {lieu && (
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>· {lieu}</span>
            )}
          </div>

          {/* Titre du bien (tronqué si trop long) */}
          {data.titre && (
            <div
              style={{
                fontSize: '22px',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 400,
                maxWidth: '1000px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {data.titre}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  )
}
