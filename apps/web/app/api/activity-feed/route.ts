import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API publique : retourne les 8 activités récentes anonymisées pour le live feed.
 *
 * Source : table `contact_requests` (demandes de visite) — c'est la métrique
 * d'engagement la plus visible. On masque visitor_name (juste première lettre +
 * dernière initiale anonyme genre "Mar." ou "K." pour ne pas exposer PII).
 *
 * Cache : revalidate 60s — pas la peine d'être à la seconde, on veut juste
 * "ça vit" pas "real-time chat".
 */

export const revalidate = 60

interface FeedItem {
  /** Prénom court anonymisé (ex: "Mar.") */
  who: string
  /** Action effectuée */
  action: string
  /** Lieu (commune) */
  where: string
  /** Timestamp ISO */
  when: string
}

/**
 * Anonymise un nom complet : "Marie Kouassi" → "Mar." ; "Yobonou" → "Y."
 * On ne garde JAMAIS le nom complet pour respecter la vie privée.
 */
function shortenName(raw: string | null | undefined): string {
  if (!raw) return 'Un visiteur'
  const cleaned = raw.trim()
  if (!cleaned) return 'Un visiteur'
  const first = cleaned.split(/\s+/)[0]
  if (first.length <= 1) return `${first.toUpperCase()}.`
  if (first.length <= 3) return `${first.charAt(0).toUpperCase()}${first.slice(1)}.`
  return `${first.charAt(0).toUpperCase()}${first.slice(1, 3)}.`
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Hier + 7 jours pour avoir des données même en heures creuses
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: contacts } = await (supabase as any)
    .from('contact_requests')
    .select('visitor_name, flash_titre, created_at, bien_id, locaux_id')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20)

  const items: FeedItem[] = []

  for (const row of (contacts ?? []) as Array<{
    visitor_name: string | null
    flash_titre: string | null
    created_at: string
    bien_id: string | null
    locaux_id: number | null
  }>) {
    // Extrait la commune du flash_titre si présent (ex: "Villa · Cocody · à louer")
    let where = 'Côte d\'Ivoire'
    if (row.flash_titre) {
      const parts = row.flash_titre.split(/[·•|,-]/).map((p) => p.trim())
      const commune = parts.find((p) =>
        /cocody|plateau|yopougon|marcory|treichville|adjam[ée]|abobo|koumassi|port[- ]bou[eë]t|bingerville|grand[- ]bassam/i.test(
          p,
        ),
      )
      if (commune) where = commune
    }
    items.push({
      who: shortenName(row.visitor_name),
      action: row.bien_id ? 'a demandé une visite' : 'a contacté pour une offre flash',
      where,
      when: row.created_at,
    })
  }

  // Si aucune data réelle, on ne retourne PAS de fake data — le composant
  // saura qu'il n'a rien à afficher et restera invisible.
  return NextResponse.json({ items: items.slice(0, 8) })
}
