// apps/web/app/api/admin/prospects/[id]/fiche-visite/route.ts
// Génération de la Fiche de Visite Prospect (Tournée de visites) en PDF pour un prospect

import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FicheVisiteDocument, type FicheVisiteProps, type BienVisiteItem } from '@/lib/fiche-visite-pdf'
import { getConsolidatedCatalogue } from '@/lib/catalogue/consolidated'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function formatDisplayName(name?: string | null): string {
  if (!name) return 'Prospect Client'
  const trimmed = name.trim()
  if (trimmed.toLowerCase() === 'broudaviddjaha') return 'Brou David Djaha'
  if (/^[a-z]+$/.test(trimmed)) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
  }
  return trimmed
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function formatPhone(phone?: string | null): string {
  if (!phone) return ''
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('33') && clean.length === 11) {
    return `+33 ${clean[2]} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)} ${clean.slice(9, 11)}`
  }
  if (clean.startsWith('225')) {
    const rest = clean.slice(3)
    if (rest.length === 10) {
      return `+225 ${rest.slice(0, 2)} ${rest.slice(2, 4)} ${rest.slice(4, 6)} ${rest.slice(6, 8)} ${rest.slice(8, 10)}`
    }
    if (rest.length === 8) {
      return `+225 ${rest.slice(0, 2)} ${rest.slice(2, 4)} ${rest.slice(4, 6)} ${rest.slice(6, 8)}`
    }
  }
  if (clean.length === 8) {
    return `+225 ${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 8)}`
  }
  if (clean.length === 10 && clean.startsWith('0')) {
    return `+225 ${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 8)} ${clean.slice(8, 10)}`
  }
  return phone.startsWith('+') ? phone : `+${phone}`
}

function buildSearchCriteriaSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prospect: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  msgs: any[],
): string {
  const inboundText = msgs
    .filter((m) => m.direction === 'inbound')
    .map((m) => m.body || '')
    .join(' ')

  const isLocation = /louer|location|loyer/i.test(inboundText)
  const isAchat = /achat|acheter|vente/i.test(inboundText)
  const transaction = isLocation
    ? 'Location'
    : isAchat
      ? 'Achat'
      : prospect.budget && prospect.budget <= 5_000_000 && prospect.type_bien !== 'terrain'
        ? 'Location'
        : 'Achat'

  const parts = [transaction]
  if (prospect.type_bien) {
    const typeLabel =
      prospect.type_bien.charAt(0).toUpperCase() + prospect.type_bien.slice(1).replace('_', ' ')
    const piecesMatch =
      inboundText.match(/(\d+\s*(?:à|a|-)?\s*\d*\s*pi[eè]ces?)/i) ||
      inboundText.match(/(\d+\s*hectares?)/i) ||
      inboundText.match(/(\d+\s*m[²2])/i)
    if (piecesMatch) {
      parts.push(`${typeLabel} (${piecesMatch[1]})`)
    } else {
      parts.push(typeLabel)
    }
  }

  const zone =
    prospect.commune ||
    inboundText.match(
      /\b(taabo|abidjan|angr[ée]|cocody|yopougon|bassam|bingerville|marcory|plateau|songon|anyama)\b/i,
    )?.[1]
  if (zone) {
    parts.push(zone.charAt(0).toUpperCase() + zone.slice(1))
  }
  if (prospect.quartier && !parts.includes(prospect.quartier)) {
    parts.push(prospect.quartier)
  }

  return parts.join(' · ')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractProposedBiensFromMessages(msgs: any[]): BienVisiteItem[] {
  const items: BienVisiteItem[] = []
  for (const m of msgs) {
    if (m.direction !== 'outbound') continue
    const body = (m.body || '').trim()
    if (!body) continue

    // Ignorer les messages automatiques de relance / accueil
    if (
      body.includes('Bienvenue chez Bogbe') ||
      body.includes('Pour que je puisse vous proposer') ||
      body.includes('Pour une prise en charge')
    ) {
      continue
    }
    if (/^(ok|d['’]accord|merci|bonjour|bonsoir)\b/i.test(body) && body.length < 30) {
      continue
    }

    // Vérifier si c'est une description de bien ou une offre commerciale
    const isOffer =
      /loyer|prix|fcfa|\d+\s*(?:m²|m2|hectares?|ha|pi[eè]ces?)|parcelle|villa|appartement|terrain|chambre/i.test(
        body,
      )
    if (!isOffer) continue

    let typeBien = 'Immobilier'
    if (/terrain|parcelle|hectare/i.test(body)) typeBien = 'Terrain'
    else if (/villa|duplex|triplex|maison/i.test(body)) typeBien = 'Villa'
    else if (/appartement/i.test(body)) typeBien = 'Appartement'
    else if (/studio/i.test(body)) typeBien = 'Studio'

    const lines = body
      .split('\n')
      .map((l: string) => l.replace(/^[*_~#\s]+|[*_~#\s]+$/g, '').trim())
      .filter(Boolean)
    let titre = lines[0] || 'Proposition commerciale'
    if (titre.length < 20 && lines[1]) {
      titre += ` — ${lines[1]}`
    }

    const priceMatch =
      body.match(
        /(?:loyer|prix)\s*[:=]?\s*([0-9\s.]+)(?:\s*(?:fcfa|f|francs|f\s*cfa))?(?:\s*(?:\/|\s*x\s*\d+\s*)mois)?/i,
      ) || body.match(/([0-9\s.]+)\s*(?:fcfa|f\s*cfa|f\/m²|fcfa\/m²)/i)
    let prixLabel = 'Sur proposition'
    if (priceMatch) {
      prixLabel = priceMatch[0].replace(/^[*_~#\s]+|[*_~#\s]+$/g, '').trim()
      if (!/fcfa/i.test(prixLabel) && !/f\//i.test(prixLabel)) prixLabel += ' FCFA'
    }

    const locMatch = body.match(
      /(?:à|a|situé\s*à|située\s*à|dans\s*la\s*zone\s*de)\s+([A-Za-z0-9\s'-]+?)(?=[,\n\r.]|$)/i,
    )
    const localisation = locMatch ? locMatch[1].trim() : "Côte d'Ivoire"

    items.push({
      ref:
        'WA-' +
        (m.metadata?.message_id
          ? String(m.metadata.message_id).slice(-6).toUpperCase()
          : String(Math.floor(100000 + Math.random() * 900000))),
      titre: titre.slice(0, 75),
      typeBien,
      localisation: localisation.slice(0, 50),
      prixLabel: prixLabel.slice(0, 30),
      observations: `Proposé le ${new Date(m.created_at).toLocaleDateString('fr-FR')}`,
    })
  }
  return items
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // 1. Authentification Admin
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, phone')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
  }

  // 2. Récupération du prospect
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prospect, error: pErr } = await (admin as any)
    .from('prospects')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (pErr || !prospect) {
    return NextResponse.json({ error: 'Prospect non trouvé' }, { status: 404 })
  }

  // Commercial assigné
  let commercialNom = profile.full_name || "Conseiller BOGBE'S"
  let commercialTel = formatPhone(profile.phone) || '+225 07 48 48 37 37'
  if (prospect.assigned_to) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: assignedProfile } = await (admin as any)
      .from('profiles')
      .select('full_name, phone')
      .eq('id', prospect.assigned_to)
      .maybeSingle()
    if (assignedProfile?.full_name) {
      commercialNom = assignedProfile.full_name
      commercialTel = formatPhone(assignedProfile.phone) || commercialTel
    }
  }

  // Messages WhatsApp du prospect
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let msgQuery = (admin as any)
    .from('whatsapp_messages')
    .select('direction, body, created_at, metadata')
    .order('created_at', { ascending: true })
  if (prospect.jid) msgQuery = msgQuery.eq('jid', prospect.jid)
  else msgQuery = msgQuery.ilike('jid', `%${prospect.phone}%`)
  const { data: msgsRaw } = await msgQuery
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msgs = (msgsRaw ?? []) as any[]

  // Paramètres URL
  const searchParams = req.nextUrl.searchParams
  const qBienId = searchParams.get('bienId')
  const qLocalId = searchParams.get('localId')
  const qDate = searchParams.get('date')
  const qHeure = searchParams.get('heure')
  const qTypeContact = searchParams.get('typeContact')

  // Détection de la qualité du visiteur : Prospect (Client direct) vs Agent immobilier / Démarcheur
  const fullConversation = [
    prospect.dernier_message,
    ...msgs.map((m: any) => m.body),
  ]
    .filter(Boolean)
    .join(' ')

  const isDetectedAgent =
    /mon client|mes clients|notre client|mandant|confr[èe]re|cabinet|d[ée]marcheur|demarcheur|interm[ée]diaire|apporteur|pour un client|pour mon client|cherche pour client/i.test(
      fullConversation,
    )

  const typeContact: 'agent' | 'prospect' =
    qTypeContact === 'agent'
      ? 'agent'
      : qTypeContact === 'prospect'
        ? 'prospect'
        : prospect.source_detail === 'agent'
          ? 'agent'
          : prospect.source_detail === 'prospect'
            ? 'prospect'
            : isDetectedAgent
              ? 'agent'
              : 'prospect'

  // 3. Biens RÉELLEMENT CONFIRMÉS pour la visite
  // RÈGLE : La fiche de visite ne doit garder STRICTEMENT que le ou les biens confirmés.
  // Cas A : Bien confirmé et sélectionné explicitement via l'interface (paramètre bienId ou localId)
  // Cas B : Visite(s) confirmée(s) ou programmée(s) dans la table `visites` pour ce prospect
  // Si aucune visite n'est encore confirmée, la liste reste VIDE (lignes vierges d'écriture manuscrite sur le terrain).
  const biensList: BienVisiteItem[] = []

  // Cas A : Bien spécifique confirmé passé en paramètre d'URL
  if (qBienId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: b } = await (admin as any)
      .from('biens')
      .select('id, titre, type_bien, commune, quartier, prix_mois_fcfa, prix_vente_fcfa')
      .eq('id', qBienId)
      .maybeSingle()
    if (b) {
      biensList.push({
        ref: String(b.id).slice(0, 8).toUpperCase(),
        titre: b.titre || 'Bien sans titre',
        typeBien: b.type_bien || 'Immobilier',
        localisation: [b.commune, b.quartier].filter(Boolean).join(' · ') || 'Abidjan',
        prixLabel: b.prix_mois_fcfa
          ? `${Number(b.prix_mois_fcfa).toLocaleString('fr-FR')} FCFA/mois`
          : b.prix_vente_fcfa
            ? `${Number(b.prix_vente_fcfa).toLocaleString('fr-FR')} FCFA`
            : 'Prix sur demande',
        observations: 'Visite confirmée',
      })
    }
  } else if (qLocalId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: loc } = await (admin as any)
      .from('locaux')
      .select('id, ref_bien, type_de_bien, commune, quartier, prix_normalise, caracteristiques')
      .eq('id', qLocalId)
      .maybeSingle()
    if (loc) {
      biensList.push({
        ref: String(loc.ref_bien || loc.id).slice(0, 8).toUpperCase(),
        titre: loc.caracteristiques?.slice(0, 70) || `${loc.type_de_bien || 'Bien'} à ${loc.commune || 'Abidjan'}`,
        typeBien: loc.type_de_bien || 'Immobilier',
        localisation: [loc.commune, loc.quartier].filter(Boolean).join(' · ') || 'Abidjan',
        prixLabel: loc.prix_normalise ? `${Number(loc.prix_normalise).toLocaleString('fr-FR')} FCFA` : 'Prix sur demande',
        observations: 'Visite confirmée',
      })
    }
  }

  // Cas B : Visites programmées / confirmées dans la table `visites` pour ce prospect
  let dateVisite = qDate || '____ / ____ / 2026'
  let creneauHoraire = qHeure || '____h____ à ____h____'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scheduledVisites } = await (admin as any)
    .from('visites')
    .select(`
      id, date_souhaitee, heure_debut, heure_fin, notes, statut,
      biens ( id, titre, type_bien, commune, quartier, adresse_complete, prix_mois_fcfa, prix_vente_fcfa )
    `)
    .eq('prospect_id', id)
    .order('date_souhaitee', { ascending: false })
    .limit(4)

  if (scheduledVisites && scheduledVisites.length > 0) {
    const validVisites = scheduledVisites.filter((v: any) => v.statut !== 'annulee' && v.statut !== 'refusee')
    if (validVisites.length > 0) {
      const firstVisite = validVisites[0]
      if (firstVisite.date_souhaitee && !qDate) {
        try {
          dateVisite = new Date(firstVisite.date_souhaitee).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        } catch {
          dateVisite = firstVisite.date_souhaitee
        }
      }
      if (!qHeure) {
        if (firstVisite.heure_debut && firstVisite.heure_fin) {
          creneauHoraire = `${firstVisite.heure_debut} - ${firstVisite.heure_fin}`
        } else if (firstVisite.heure_debut) {
          creneauHoraire = firstVisite.heure_debut
        }
      }

      // Si aucun bien spécifique n'a été forcé en URL, on inclut les biens confirmés de la table visites
      if (biensList.length === 0) {
        for (const v of validVisites) {
          const b = v.biens
          if (b && !biensList.some((item) => item.ref === String(b.id).slice(0, 8).toUpperCase())) {
            biensList.push({
              ref: String(b.id).slice(0, 8).toUpperCase(),
              titre: b.titre || 'Bien sans titre',
              typeBien: b.type_bien || 'Immobilier',
              localisation: [b.commune, b.quartier].filter(Boolean).join(' · ') || 'Abidjan',
              prixLabel: b.prix_mois_fcfa
                ? `${Number(b.prix_mois_fcfa).toLocaleString('fr-FR')} FCFA/mois`
                : b.prix_vente_fcfa
                  ? `${Number(b.prix_vente_fcfa).toLocaleString('fr-FR')} FCFA`
                  : 'Prix sur demande',
              observations: v.notes || 'Visite confirmée',
            })
          }
        }
      }
    }
  }

  // Synthèse de recherche du visiteur
  const rechercheCritere = buildSearchCriteriaSummary(prospect, msgs)

  const props: FicheVisiteProps = {
    ficheNum: `BV-P${prospect.id.slice(0, 7).toUpperCase()}`,
    dateEdition: new Date().toLocaleDateString('fr-FR'),
    prospectNom: formatDisplayName(prospect.nom),
    prospectTel: formatPhone(prospect.phone),
    prospectEmail: prospect.email || undefined,
    prospectCritere: rechercheCritere,
    prospectBudget: prospect.budget
      ? `${Number(prospect.budget).toLocaleString('fr-FR')} FCFA`
      : undefined,
    typeContact,
    agenceOuStructure: searchParams.get('agence') || undefined,
    nomClientRepresente: searchParams.get('client') || undefined,
    dateVisite,
    creneauHoraire,
    commercialNom,
    commercialTel,
    biens: biensList,
  }

  // 4. Rendu du PDF en mémoire
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(FicheVisiteDocument, props) as any)
    const isDownload = searchParams.get('download') === '1'

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="fiche-visite-${prospect.id.slice(0, 8)}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (err) {
    console.error('[pdf] Erreur génération fiche de visite prospect:', err)
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 })
  }
}
