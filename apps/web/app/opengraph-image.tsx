/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = "BOGBE'S GROUPE — Immobilier en Côte d'Ivoire"
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Image Open Graph globale du site — sert à toutes les pages qui n'ont
 * pas leur propre `opengraph-image.tsx` (fallback Next.js convention).
 *
 * Affichée dans les previews WhatsApp / Facebook / Twitter / LinkedIn /
 * iMessage / Slack quand on partage la home ou une page sans OG custom.
 */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 60%, #1e293b 100%)',
          position: 'relative',
          padding: '80px',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Glow accent orange en haut à droite (BOGBE'S accent-luxury) */}
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-200px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.35) 0%, transparent 70%)',
          }}
        />

        {/* Logo + nom marque */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'rgba(249,115,22,0.15)',
              border: '2px solid rgba(249,115,22,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              fontWeight: 700,
              color: '#f97316',
            }}
          >
            B
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              BOGBE&apos;S GROUPE
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Sapphire Edition
            </div>
          </div>
        </div>

        {/* Tagline principale */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              maxWidth: '900px',
            }}
          >
            L&apos;immobilier ivoirien sans arnaque.
          </div>
          <div
            style={{
              fontSize: '28px',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.4,
              maxWidth: '850px',
            }}
          >
            9 000+ biens vérifiés et offres flash WhatsApp à Abidjan. Vérification
            KYC systématique, coordonnées masquées, conseiller terrain.
          </div>
        </div>

        {/* Footer URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '60px',
            fontSize: '20px',
            color: 'rgba(255,255,255,0.4)',
            fontWeight: 500,
          }}
        >
          www.bogbesgroup.com
        </div>
      </div>
    ),
    { ...size }
  )
}
