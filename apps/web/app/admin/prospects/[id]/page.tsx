import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, Phone, MessageCircle, Home, Calendar, Clock, MapPin,
  CalendarClock, UserCheck, StickyNote, ExternalLink, FileText,
  Briefcase, User, Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatFCFA } from '@/lib/format'
import { getConsolidatedCatalogue } from '@/lib/catalogue/consolidated'
import {
  setProspectStatutAction, setProspectNoteAction, setProspectAssignAction, setProspectRelanceAction,
  setProspectOutcomeAction, setProspectTypeAction,
} from '../actions'
import { CrmActionForm } from '@/components/admin/CrmActionForm'
import { WhatsAppContactButton } from '@/components/admin/WhatsAppContactButton'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Statut = 'nouveau' | 'contacte' | 'visite_planifiee' | 'visite_realisee' | 'relance' | 'gagne' | 'perdu' | 'en_cours' | 'rdv' | 'traite'
type WhatsAppMetadata = {
  actor_type?: string
  trace_source?: string
  property_ref?: string | null
  property_url?: string | null
}

const STATUT_CONFIG: Record<Statut, { label: string; dot: string }> = {
  nouveau: { label: 'Nouveau', dot: 'bg-amber-400' },
  contacte: { label: 'Contacté', dot: 'bg-sky-400' },
  visite_planifiee: { label: 'Visite planifiée', dot: 'bg-purple-400' },
  visite_realisee: { label: 'Visite réalisée', dot: 'bg-indigo-400' },
  relance: { label: 'Relance', dot: 'bg-orange-400' },
  gagne: { label: 'Gagné', dot: 'bg-emerald-400' },
  perdu: { label: 'Perdu', dot: 'bg-rose-400' },
  en_cours: { label: 'Contacté', dot: 'bg-sky-400' },
  rdv: { label: 'Visite planifiée', dot: 'bg-purple-400' },
  traite: { label: 'À qualifier', dot: 'bg-zinc-400' },
}

const FLOW: Statut[] = ['nouveau', 'contacte', 'visite_planifiee', 'visite_realisee', 'relance', 'gagne', 'perdu']

const PIPELINE_STEPS: Array<{ key: Statut; label: string }> = [
  { key: 'nouveau', label: 'Nouveau' },
  { key: 'contacte', label: 'Contacté' },
  { key: 'visite_planifiee', label: 'Visite planifiée' },
  { key: 'visite_realisee', label: 'Visite réalisée' },
  { key: 'relance', label: 'Relance' },
  { key: 'gagne', label: 'Conclu' },
]

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProspectDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const [
    { data: p },
    { count: contactCount },
    { count: visiteCount },
    { count: reservationCount },
    timelineResult,
    visitesResult,
    { data: adminsRaw },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('prospects').select('*').eq('id', id).maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('contact_requests').select('id', { count: 'exact', head: true }).eq('prospect_id', id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('visites').select('id', { count: 'exact', head: true }).eq('prospect_id', id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('reservations').select('id', { count: 'exact', head: true }).eq('prospect_id', id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc('crm_prospect_timeline', { p_id: id, p_limit: 50 }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('visites')
      .select(`
        id, date_souhaitee, heure_debut, heure_fin, statut, notes,
        biens ( id, titre, type_bien, commune, quartier, prix_mois_fcfa, prix_vente_fcfa )
      `)
      .eq('prospect_id', id)
      .order('date_souhaitee', { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('profiles').select('id, full_name').eq('role', 'admin').order('full_name'),
  ])
  if (!p) notFound()

  const crmEvents = timelineResult.error ? null : timelineResult.data as Array<{ id: string; event_type: string; from_status: string | null; to_status: string | null; note: string | null; created_at: string; actor_name?: string | null; origin?: string }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const confirmedVisites = ((visitesResult.data ?? []) as any[]).filter(
    (v) => v.statut !== 'annulee' && v.statut !== 'refusee',
  )

  const st = (p.statut in STATUT_CONFIG ? p.statut : 'nouveau') as Statut
  const normalizedSt = st === 'en_cours' ? 'contacte' : st === 'rdv' ? 'visite_planifiee' : st
  const currentStepIdx = PIPELINE_STEPS.findIndex((s) => s.key === normalizedSt)

  const admins = (adminsRaw ?? []) as { id: string; full_name: string | null }[]
  const assignedName = admins.find((a) => a.id === p.assigned_to)?.full_name ?? null

  // Date shortcuts for relance
  const now = new Date()
  const toIsoDate = (d: Date) => d.toISOString().slice(0, 10)
  const tomorrowDateStr = toIsoDate(new Date(now.getTime() + 24 * 60 * 60 * 1000))
  const in3DaysDateStr = toIsoDate(new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000))
  const in7DaysDateStr = toIsoDate(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000))

  // Conversation WhatsApp
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let msgQuery = (admin as any)
    .from('whatsapp_messages')
    .select('direction, body, created_at, metadata')
    .order('created_at', { ascending: true })
    .limit(60)
  if (p.jid) msgQuery = msgQuery.eq('jid', p.jid)
  else msgQuery = msgQuery.ilike('jid', `%${p.phone}%`)
  const { data: msgsRaw } = await msgQuery
  const msgs = (msgsRaw ?? []).filter((m: { direction: string }) => m.direction === 'inbound' || m.direction === 'outbound') as
    { direction: string; body: string; created_at: string; metadata?: WhatsAppMetadata | null }[]

  const fullConversation = [
    p.dernier_message,
    ...msgs.map((m) => m.body),
  ]
    .filter(Boolean)
    .join(' ')

  const isDetectedAgent =
    /mon client|mes clients|notre client|mandant|confr[èe]re|cabinet|d[ée]marcheur|demarcheur|interm[ée]diaire|apporteur|pour un client|pour mon client|cherche pour client/i.test(
      fullConversation,
    )

  const currentType: 'agent' | 'prospect' =
    p.source_detail === 'agent'
      ? 'agent'
      : p.source_detail === 'prospect'
        ? 'prospect'
        : isDetectedAgent
          ? 'agent'
          : 'prospect'

  // Biens catalogue correspondants
  let matches: Awaited<ReturnType<typeof getConsolidatedCatalogue>>['items'] = []
  if (p.commune || p.type_bien) {
    try {
      const inboundText = msgs
        .filter((m) => m.direction === 'inbound')
        .map((m) => m.body || '')
        .join(' ')
      const isLocation = /louer|location|loyer/i.test(inboundText)
      const inferredOffre = isLocation
        ? 'location'
        : p.budget && p.budget <= 5_000_000 && p.type_bien !== 'terrain'
          ? 'location'
          : undefined
      const targetCommune =
        p.commune ||
        inboundText.match(
          /\b(taabo|abidjan|angr[ée]|cocody|yopougon|bassam|bingerville|marcory|plateau|songon|anyama)\b/i,
        )?.[1]
      const { items } = await getConsolidatedCatalogue({
        commune: targetCommune ?? undefined,
        type_bien: p.type_bien ?? undefined,
        type_offre: inferredOffre,
        prix_max: p.budget ? Math.round(p.budget * 1.15) : undefined,
        sort: 'verified_first',
        limitPerSource: 4,
      })
      matches = items.slice(0, 4)
    } catch {
      /* catalogue indisponible */
    }
  }

  const critereParts = [p.type_bien, p.commune, p.quartier].filter(Boolean)

  return (
    <main className="min-h-screen bg-[var(--surface-hover)] pb-12">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">
        {/* 1. Fil d'Ariane épuré */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/admin/prospects"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Prospects</span>
          </Link>

          <span className="text-xs text-[var(--text-subtle)] font-mono">
            ID: {p.id.slice(0, 8)}
          </span>
        </div>

        {/* 2. En-tête Prospect sobre */}
        <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text)] tracking-tight">
                {p.nom || 'Prospect sans nom'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]">
                <span className={`w-1.5 h-1.5 rounded-full ${STATUT_CONFIG[st].dot}`} />
                <span>{STATUT_CONFIG[st].label}</span>
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)]">
                {currentType === 'agent' ? 'Démarcheur' : 'Client direct'}
              </span>
              <CrmActionForm action={setProspectTypeAction} className="inline-block">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="type_contact" value={currentType === 'agent' ? 'prospect' : 'agent'} />
                <button
                  type="submit"
                  className="text-xs text-[var(--text-subtle)] hover:text-[var(--text)] underline font-medium transition-colors ml-1"
                >
                  (Basculer en {currentType === 'agent' ? 'client direct' : 'démarcheur'})
                </button>
              </CrmActionForm>
            </div>

            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] flex-wrap">
              <span className="font-mono text-[var(--text)]">+225 {String(p.phone).replace(/^225/, '')}</span>
              <span>·</span>
              <span>{p.message_count} message(s)</span>
              {assignedName && (
                <>
                  <span>·</span>
                  <span>Assigné à {assignedName}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/api/admin/prospects/${p.id}/fiche-visite?typeContact=${currentType}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 rounded-lg text-xs font-medium text-[var(--text)] border border-[var(--border)] bg-[var(--surface-hover)] hover:bg-[var(--border)] flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
              <span>Bon de visite (PDF)</span>
            </a>
            <WhatsAppContactButton
              phone={p.phone}
              prospectId={p.id}
              prospectVersion={p.version}
              currentStatus={p.statut}
              className="h-8 min-h-0 text-xs py-1"
            />
          </div>
        </div>

        {/* 3. Stepper de progression sobre (Style Linear) */}
        <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] px-4 py-3">
          <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
            {PIPELINE_STEPS.map((step, idx) => {
              const isPast = currentStepIdx >= 0 && idx < currentStepIdx && st !== 'perdu'
              const isCurrent = idx === currentStepIdx && st !== 'perdu'
              return (
                <div key={step.key} className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-medium transition-colors ${
                        isPast
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isCurrent
                            ? 'bg-[var(--text)] text-[var(--background)] font-bold'
                            : 'bg-[var(--surface-hover)] text-[var(--text-subtle)] border border-[var(--border)]'
                      }`}
                    >
                      {isPast ? '✓' : idx + 1}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        isCurrent
                          ? 'text-[var(--text)] font-semibold'
                          : isPast
                            ? 'text-[var(--text-muted)]'
                            : 'text-[var(--text-subtle)]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < PIPELINE_STEPS.length - 1 && (
                    <span className="text-[var(--border)] text-xs px-1 select-none">→</span>
                  )}
                </div>
              )
            })}
            {st === 'perdu' && (
              <span className="ml-auto text-xs font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                Classé sans suite
              </span>
            )}
          </div>
        </div>

        {/* 4. Layout 2 colonnes : Dossier vs Cockpit */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-5 items-start">
          {/* Colonne Principale */}
          <div className="space-y-5">
            {/* Projet et Critères immobiliers */}
            <section className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 space-y-3">
              <h2 className="text-xs font-semibold text-[var(--text)]">Projet immobilier</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[var(--surface-hover)] rounded-lg border border-[var(--border)]/60">
                  <span className="text-[10px] uppercase text-[var(--text-subtle)] block">Type</span>
                  <span className="font-medium text-[var(--text)] mt-0.5 block">{p.type_bien || 'Non renseigné'}</span>
                </div>
                <div className="p-3 bg-[var(--surface-hover)] rounded-lg border border-[var(--border)]/60">
                  <span className="text-[10px] uppercase text-[var(--text-subtle)] block">Budget</span>
                  <span className="font-semibold text-[var(--text)] mt-0.5 block">
                    {p.budget != null ? formatFCFA(p.budget) : 'Non précisé'}
                  </span>
                </div>
                <div className="p-3 bg-[var(--surface-hover)] rounded-lg border border-[var(--border)]/60">
                  <span className="text-[10px] uppercase text-[var(--text-subtle)] block">Commune</span>
                  <span className="font-medium text-[var(--text)] mt-0.5 block truncate">
                    {critereParts.join(', ') || 'Toutes zones'}
                  </span>
                </div>
                <div className="p-3 bg-[var(--surface-hover)] rounded-lg border border-[var(--border)]/60">
                  <span className="text-[10px] uppercase text-[var(--text-subtle)] block">Date souhaitée</span>
                  <span className="font-medium text-[var(--text)] mt-0.5 block">{p.date_souhaitee || 'Dès que possible'}</span>
                </div>
              </div>
            </section>

            {/* Visites confirmées */}
            <section className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-[var(--text)]">
                  Visites confirmées ({confirmedVisites.length})
                </h2>
              </div>

              {confirmedVisites.length === 0 ? (
                <p className="text-xs text-[var(--text-subtle)] italic py-2">
                  Aucune visite planifiée pour ce prospect.
                </p>
              ) : (
                <div className="space-y-2">
                  {confirmedVisites.map((v) => (
                    <div
                      key={v.id}
                      className="rounded-lg border border-[var(--border)] p-3 bg-[var(--surface-hover)] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--text)] truncate">{v.biens?.titre || 'Bien'}</p>
                        <p className="text-[11px] text-[var(--text-subtle)] mt-0.5">
                          {v.date_souhaitee} {v.heure_debut ? `à ${v.heure_debut}` : ''}
                        </p>
                      </div>
                      <a
                        href={`/api/admin/prospects/${p.id}/fiche-visite?bienId=${v.biens?.id}&date=${encodeURIComponent(v.date_souhaitee || '')}&heure=${encodeURIComponent(v.heure_debut || '')}&typeContact=${currentType}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-7 px-2.5 rounded text-xs font-medium text-[var(--text)] border border-[var(--border)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] flex items-center gap-1 transition-colors"
                      >
                        <FileText className="w-3 h-3 text-[var(--text-subtle)]" />
                        <span>Bon visite</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Conversation WhatsApp */}
            <section className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-[var(--text)]">Conversation WhatsApp</h2>
                <span className="text-xs text-[var(--text-subtle)] font-mono">{msgs.length} messages</span>
              </div>

              {msgs.length === 0 ? (
                <p className="text-xs text-[var(--text-subtle)] italic py-4 text-center">Aucun message archivé.</p>
              ) : (
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {msgs.map((m, i) => {
                    const inbound = m.direction === 'inbound'
                    const commercial = !inbound && (m.metadata?.actor_type === 'commercial' || m.metadata?.trace_source === 'human_takeover')
                    return (
                      <div key={i} className={`flex ${inbound ? 'justify-start' : 'justify-end'}`}>
                        <div
                          className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                            inbound
                              ? 'bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]'
                              : commercial
                                ? 'bg-[var(--surface-hover)] border border-[var(--accent-luxury)]/40 text-[var(--text)]'
                                : 'bg-[var(--surface-card)] border border-[var(--border)] text-[var(--text)]'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                          <p className="text-[10px] text-[var(--text-subtle)] mt-1">
                            {inbound ? (currentType === 'agent' ? 'Démarcheur' : 'Client') : commercial ? 'Commercial' : 'Sapphire IA'} · {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Biens correspondants du catalogue */}
            {matches.length > 0 && (
              <section className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 space-y-3">
                <h2 className="text-xs font-semibold text-[var(--text)]">Biens correspondants</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {matches.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-lg border border-[var(--border)] p-3 bg-[var(--surface)] text-xs flex flex-col justify-between"
                    >
                      <div>
                        <p className="font-semibold text-[var(--text)] truncate">{b.titre}</p>
                        <p className="text-[11px] text-[var(--text-subtle)] mt-0.5">{b.commune} · {b.prix_label}</p>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[var(--border)]/60">
                        <Link href={b.url} target="_blank" className="text-[11px] text-[var(--text-subtle)] hover:text-[var(--text)]">
                          Voir l&apos;annonce →
                        </Link>
                        <a
                          href={`/api/admin/prospects/${p.id}/fiche-visite?${b.source === 'flash' ? `localId=${b.sourceId}` : `bienId=${b.sourceId}`}&typeContact=${currentType}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-6 px-2 rounded text-[11px] font-medium text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-hover)] flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3 text-[var(--text-subtle)]" />
                          <span>Bon visite</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Historique CRM */}
            <section className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 space-y-3">
              <h2 className="text-xs font-semibold text-[var(--text)]">Historique des actions</h2>
              {crmEvents === null ? (
                <p className="text-xs text-[var(--text-subtle)]">Historique non disponible.</p>
              ) : crmEvents.length === 0 ? (
                <p className="text-xs text-[var(--text-subtle)] italic py-2">Aucun événement enregistré.</p>
              ) : (
                <ol className="space-y-2.5 border-l border-[var(--border)] ml-1 pl-3 text-xs">
                  {crmEvents.map((event) => {
                    const eventLabel =
                      event.event_type === 'human_reply'
                        ? 'Réponse commerciale'
                        : event.to_status
                          ? `Statut : ${event.to_status}`
                          : event.event_type.replaceAll('_', ' ')
                    return (
                      <li key={event.id} className="relative space-y-0.5">
                        <span className="absolute -left-[17px] top-1.5 w-1.5 h-1.5 rounded-full bg-[var(--text-subtle)]" />
                        <p className="font-medium text-[var(--text)]">{eventLabel}</p>
                        {event.note && <p className="text-[11px] text-[var(--text-muted)]">{event.note}</p>}
                        <p className="text-[10px] text-[var(--text-subtle)]">
                          {event.actor_name || 'Système'} · {new Date(event.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </li>
                    )
                  })}
                </ol>
              )}
            </section>
          </div>

          {/* Colonne Droite (Cockpit Sticky sobre) */}
          <aside className="space-y-4 lg:sticky lg:top-6">
            {/* Statut */}
            <section className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-4 space-y-2.5">
              <h2 className="text-xs font-semibold text-[var(--text)]">Statut de suivi</h2>
              <div className="grid grid-cols-2 gap-1.5">
                {FLOW.map((s) => (
                  <CrmActionForm key={s} action={setProspectStatutAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="version" value={p.version} />
                    <input type="hidden" name="statut" value={s} />
                    <button
                      type="submit"
                      className={`h-8 w-full px-2 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                        st === s
                          ? 'bg-[var(--text)] text-[var(--background)] border-transparent font-semibold shadow-xs'
                          : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUT_CONFIG[s].dot}`} />
                      <span>{STATUT_CONFIG[s].label}</span>
                    </button>
                  </CrmActionForm>
                ))}
              </div>
            </section>

            {/* Conseiller */}
            <section className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-4 space-y-2">
              <h2 className="text-xs font-semibold text-[var(--text)]">Conseiller assigné</h2>
              <CrmActionForm action={setProspectAssignAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="version" value={p.version} />
                <select
                  name="assigned_to"
                  defaultValue={p.assigned_to ?? ''}
                  aria-label="Conseiller"
                  className="flex-1 h-8 px-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
                >
                  <option value="">Non assigné</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name || a.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="h-8 px-3 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)] rounded-lg text-xs font-semibold transition-colors"
                >
                  OK
                </button>
              </CrmActionForm>
            </section>

            {/* Date de relance */}
            <section className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-4 space-y-2">
              <h2 className="text-xs font-semibold text-[var(--text)]">Date de relance</h2>
              <CrmActionForm action={setProspectRelanceAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="version" value={p.version} />
                <input
                  type="date"
                  name="relance_le"
                  defaultValue={p.relance_le ?? ''}
                  aria-label="Date de relance"
                  className="flex-1 h-8 px-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
                />
                <button
                  type="submit"
                  className="h-8 px-3 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)] rounded-lg text-xs font-semibold transition-colors"
                >
                  OK
                </button>
              </CrmActionForm>

              <div className="flex items-center gap-2 text-[11px] text-[var(--text-subtle)] pt-1">
                <span>Raccourcis :</span>
                <CrmActionForm action={setProspectRelanceAction} className="inline">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="version" value={p.version} />
                  <input type="hidden" name="relance_le" value={tomorrowDateStr} />
                  <button type="submit" className="hover:text-[var(--text)] underline">
                    Demain
                  </button>
                </CrmActionForm>
                <span>·</span>
                <CrmActionForm action={setProspectRelanceAction} className="inline">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="version" value={p.version} />
                  <input type="hidden" name="relance_le" value={in3DaysDateStr} />
                  <button type="submit" className="hover:text-[var(--text)] underline">
                    +3j
                  </button>
                </CrmActionForm>
                <span>·</span>
                <CrmActionForm action={setProspectRelanceAction} className="inline">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="version" value={p.version} />
                  <input type="hidden" name="relance_le" value={in7DaysDateStr} />
                  <button type="submit" className="hover:text-[var(--text)] underline">
                    +7j
                  </button>
                </CrmActionForm>
              </div>
            </section>

            {/* Note de suivi */}
            <section className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-4 space-y-2">
              <h2 className="text-xs font-semibold text-[var(--text)]">Note de suivi</h2>
              <CrmActionForm action={setProspectNoteAction} className="space-y-2">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="version" value={p.version} />
                <textarea
                  name="note"
                  rows={3}
                  defaultValue={p.note ?? ''}
                  maxLength={500}
                  placeholder="Échanges, objections, statut..."
                  className="w-full p-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] resize-none focus:outline-none focus:border-[var(--accent-luxury)] transition-colors leading-relaxed"
                />
                <button
                  type="submit"
                  className="w-full h-8 px-3 bg-[var(--text)] text-[var(--surface-card)] rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Enregistrer
                </button>
              </CrmActionForm>
            </section>

            {/* Issue ou Prochaine action */}
            <section className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-4 space-y-2">
              <h2 className="text-xs font-semibold text-[var(--text)]">Prochaine action / Motif perte</h2>
              <CrmActionForm action={setProspectOutcomeAction} className="space-y-2">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="version" value={p.version} />
                <select
                  name="perte_motif"
                  defaultValue={p.perte_motif ?? ''}
                  aria-label="Motif de perte"
                  className="w-full h-8 px-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
                >
                  <option value="">Motif si classé sans suite</option>
                  <option value="prix">Prix trop élevé</option>
                  <option value="bien_indisponible">Bien indisponible</option>
                  <option value="proprietaire_injoignable">Propriétaire injoignable</option>
                  <option value="prospect_absent">Prospect absent</option>
                  <option value="autre">Autre motif</option>
                </select>
                <input
                  name="prochaine_action"
                  defaultValue={p.prochaine_action ?? ''}
                  placeholder="Action à réaliser"
                  className="w-full h-8 px-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
                />
                <input
                  type="datetime-local"
                  name="prochaine_action_at"
                  defaultValue={p.prochaine_action_at ? new Date(p.prochaine_action_at).toISOString().slice(0, 16) : ''}
                  aria-label="Date échéance"
                  className="w-full h-8 px-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
                />
                <button
                  type="submit"
                  className="w-full h-8 px-3 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)] rounded-lg text-xs font-semibold transition-colors"
                >
                  Enregistrer l&apos;action
                </button>
              </CrmActionForm>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
