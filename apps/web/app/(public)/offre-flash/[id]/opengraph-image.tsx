/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og'
import { locauxClientForId } from '@/lib/supabase/locaux'
import { mapLocauxRow, type LocauxRow } from '@/lib/locaux/mapper'
import { getStaticMapUrl } from '@/lib/mapbox-static'
import { getCommuneCoords, hasKnownCoords } from '@/lib/commune-coords'
import { fetchOgImage } from '@/lib/og/safe-image'

export const runtime = 'edge'
export const alt = "Offre flash immobilière - BOGBE'S GROUPE"
// 800x420 (pas 1200x630) : le PNG map/photo plein cadre pèse sinon ~1Mo et
// WhatsApp abandonne la vignette au-delà de ~600Ko.
export const size = { width: 800, height: 420 }
export const contentType = 'image/png'

function formatFCFA(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

/**
 * OG dynamique pour fiche offre flash — preview WhatsApp avec map du
 * quartier en arrière-plan + overlay type + prix + badge "À valider".
 * Compense l'absence quasi-systématique de photo sur les flash scrapées.
 */
export default async function FlashOg({ params }: { params: { id: string } }) {
  const numId = parseInt(params.id, 10)
  if (isNaN(numId)) return fallbackOg()

  const locaux = locauxClientForId(numId)
  const { data: row } = await locaux
    .from('locaux')
    .select('id,ref_bien,type_de_bien,type_offre,commune,quartier,prix,prix_normalise,caracteristiques,meubles,chambre,disponible,surface,date_publication,lien_image,message_initial,status,is_duplicate,date_expiration,created_at,zone_geographique')
    .eq('id', numId)
    .single()

  if (!row) return fallbackOg()

  const bien = mapLocauxRow(row as LocauxRow)
  const lieu = [bien.quartier, bien.commune].filter(Boolean).join(' · ')
  const typeLabel = bien.type_bien.replace(/_/g, ' ')

  const prix = bien.prix_value
    ? formatFCFA(bien.prix_value) +
      (bien.prix_unit === 'fcfa_par_mois' ? ' / mois' :
       bien.prix_unit === 'fcfa_par_m2' ? ' / m²' : '')
    : (bien.prix_label ?? 'Prix sur demande')

  // Fond : photo scrapée si dispo, sinon map du quartier.
  // Data URI (fetch contrôlé) — une URL distante brute fait planter Satori en silence.
  const coords = getCommuneCoords(bien.commune, bien.quartier)
  const knownLoc = hasKnownCoords(bien.commune, bien.quartier)
  const rawMapUrl = getStaticMapUrl({
    lat: coords.lat,
    lng: coords.lng,
    zoom: knownLoc ? 14 : 11,
    width: 1200,
    height: 630,
    pin: knownLoc ? { color: 'f97316', size: 'l' } : false,
  })
  const mapUrl = (await fetchOgImage(bien.image_url)) ?? (await fetchOgImage(rawMapUrl))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          position: 'relative',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Map du quartier en arrière-plan (img tag - Satori-compatible) */}
        {mapUrl && (
          <img
            src={mapUrl}
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

        {/* Overlay sombre */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 100%)',
          }}
        />

        {/* Badge flash en haut à gauche */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            background: 'rgba(220, 38, 38, 0.95)',
            borderRadius: '999px',
            color: 'white',
            fontSize: '20px',
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          {/* pas d'emoji : Satori crashe sur les glyphes hors police (🔥/⚠) */}
          OFFRE FLASH
        </div>

        {/* Logo marque en haut à droite */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: '40px',
            padding: '10px 16px',
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '18px',
            fontWeight: 700,
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
            gap: '14px',
            color: 'white',
          }}
        >
          {/* Prix */}
          <div
            style={{
              fontSize: '64px',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: '#f97316',
              textShadow: '0 4px 20px rgba(0,0,0,0.6)',
            }}
          >
            {prix}
          </div>

          {/* Type + lieu — Satori exige display:flex explicite dès qu'un élément
              a plusieurs enfants (texte brut + span = crash silencieux sinon) */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              fontSize: '36px',
              fontWeight: 600,
              textTransform: 'capitalize',
              textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            }}
          >
            <span>{typeLabel}</span>
            {lieu && (
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>· {lieu}</span>
            )}
          </div>

          {/* Disclaimer "à valider" */}
          <div
            style={{
              marginTop: '12px',
              // Satori ne supporte pas inline-flex (flex/block/none uniquement)
              display: 'flex',
              alignItems: 'center',
              alignSelf: 'flex-start',
              padding: '10px 16px',
              background: 'rgba(245, 158, 11, 0.95)',
              color: '#451a03',
              fontSize: '18px',
              fontWeight: 700,
              borderRadius: '10px',
            }}
          >
            À valider par notre conseiller avant visite
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}

function fallbackOg() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', background: '#020617',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: 64, fontFamily: 'system-ui'
      }}>
        BOGBE&apos;S GROUPE
      </div>
    ),
    { ...size }
  )
}
