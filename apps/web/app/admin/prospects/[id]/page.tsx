import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  ArrowLeft, Phone, MessageCircle, Home, Wallet, Calendar, Clock, MapPin,
  CalendarClock, UserCheck, StickyNote, ExternalLink, Flame, ShieldCheck, FileText,
  Briefcase, User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatFCFA } from '@/lib/format'
import { getConsolidatedCatalogue } from '@/lib/catalogue/consolidated'
import { whatsappLink } from '@/lib/whatsapp'
import {
  setProspectStatutAction, setProspectNoteAction, setProspectAssignAction, setProspectRelanceAction,
  setProspectOutcomeAction, setProspectTypeAction,
} from '../actions'
import { CrmActionForm } from '@/components/admin/CrmActionForm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Statut = 'nouveau' | 'contacte' | 'visite_planifiee' | 'visite_realisee' | 'relance' | 'gagne' | 'perdu' | 'en_cours' | 'rdv' | 'traite'
type WhatsAppMetadata = {
  actor_type?: string
  trace_source?: string
  property_ref?: string | null
  property_url?: string | null
}

const STATUT_META: Record<Statut, { label: string; cls: string }> = {
  nouveau: { label: 'Nouveau', cls: 'bg-[var(--surface-hover)] text-[var(--text)] border-amber-300' },
  contacte: { label: 'Contacté', cls: 'bg-[var(--surface-hover)] text-[var(--text)] border-blue-300' },
  visite_planifiee: { label: 'Visite planifiée', cls: 'bg-[var(--surface-hover)] text-[var(--text)] border-purple-300' },
  visite_realisee: { label: 'Visite réalisée', cls: 'bg-[var(--surface-hover)] text-[var(--text)] border-indigo-300' },
  relance: { label: 'Relance', cls: 'bg-[var(--surface-hover)] text-[var(--text)] border-orange-300' },
  gagne: { label: 'Gagné', cls: 'bg-[var(--surface-hover)] text-[var(--text)] border-emerald-300' },
  perdu: { label: 'Perdu', cls: 'bg-[var(--surface-hover)] text-[var(--text)] border-slate-300' },
  en_cours: { label: 'En cours (historique)', cls: 'bg-[var(--surface-hover)] text-[var(--text)] border-blue-300' },
  rdv: { label: 'Rendez-vous (historique)', cls: 'bg-[var(--surface-hover)] text-[var(--text)] border-purple-300' },
  traite: { label: 'Traité — résultat à qualifier', cls: 'bg-[var(--surface-hover)] text-[var(--text)] border-slate-300' },
}
const FLOW: Statut[] = ['nouveau', 'contacte', 'visite_planifiee', 'visite_realisee', 'relance', 'gagne', 'perdu']

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProspectDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  // AdminLayout vérifie déjà l'authentification et le rôle admin ; on lance
  // toutes les lectures de la fiche prospect en parallèle dès le 1er aller-retour.
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

  const st = (p.statut in STATUT_META ? p.statut : 'nouveau') as Statut

  const admins = (adminsRaw ?? []) as { id: string; full_name: string | null }[]
  const assignedName = admins.find((a) => a.id === p.assigned_to)?.full_name ?? null

  // Conversation WhatsApp (par jid, repli sur le numéro dans le jid)
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

  // Détection de la qualité du visiteur : Prospect (Client direct) vs Agent immobilier / Démarcheur
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

  // Biens du catalogue correspondant aux critères
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
      matches = items.slice(0, 6)
    } catch {
      /* catalogue indisponible */
    }
  }

  const critereLine = [p.type_bien, p.commune, p.quartier].filter(Boolean).join(' · ')

  return (
    <main className="min-h-screen bg-[var(--surface-hover)]">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <Link href="/admin/prospects" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour aux prospects
        </Link>

        {/* En-tête avec distinction Prospect direct vs Agent Immobilier */}
        <div className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-display font-bold text-[var(--text)]">{p.nom || 'Prospect'}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${STATUT_META[st].cls}`}>
                {STATUT_META[st].label}
              </span>

              {/* Badge Distinction : Client Direct vs Agent Immobilier */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  currentType === 'agent'
                    ? 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
                }`}
              >
                {currentType === 'agent' ? <Briefcase className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                {currentType === 'agent' ? 'Agent immobilier / Démarcheur' : 'Prospect (Client direct)'}
              </span>

              {/* Action rapide pour basculer le statut */}
              <CrmActionForm action={setProspectTypeAction} className="inline-block">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="type_contact" value={currentType === 'agent' ? 'prospect' : 'agent'} />
                <button
                  type="submit"
                  title="Modifier la qualification du contact"
                  className="text-[11px] text-[var(--accent-luxury)] hover:underline ml-1 font-semibold"
                >
                  (Basculer en {currentType === 'agent' ? 'Client direct' : 'Agent démarcheur'})
                </button>
              </CrmActionForm>
            </div>

            <p className="text-sm text-[var(--text-muted)] font-mono mt-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> +225 {String(p.phone).replace(/^225/, '')}
            </p>
            <p className="text-xs text-[var(--text-subtle)] mt-1 flex items-center gap-3 flex-wrap">
              {critereLine && <span className="inline-flex items-center gap-1"><Home className="w-3 h-3" />{critereLine}</span>}
              {p.budget != null && <span className="inline-flex items-center gap-1"><Wallet className="w-3 h-3" />{formatFCFA(p.budget)}</span>}
              {p.date_souhaitee && <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{p.date_souhaitee}</span>}
              <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{p.message_count} msg</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <a
              href={`/api/admin/prospects/${p.id}/fiche-visite?typeContact=${currentType}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--text)] hover:opacity-90 text-[var(--surface-card)] rounded-xl text-sm font-bold shadow-sm transition-opacity"
            >
              <FileText className="w-4 h-4" /> Bon de visite PDF {confirmedVisites.length > 0 ? `(${confirmedVisites.length} confirmé${confirmedVisites.length > 1 ? 's' : ''})` : ''}
            </a>
            <a
              href={whatsappLink(p.phone) ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold"
            >
              <MessageCircle className="w-4 h-4" /> Contacter
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-5">
          {/* Colonne principale : parcours + visites confirmées + conversation + catalogue */}
          <div className="space-y-5">
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3">Parcours CRM</h2>
              <div className="grid grid-cols-3 gap-2">
                <JourneyStat label="Contacts" value={contactCount ?? 0} />
                <JourneyStat label="Visites confirmées" value={confirmedVisites.length} />
                <JourneyStat label="Réservations" value={reservationCount ?? 0} />
              </div>
            </section>

            {/* Section Visites confirmées pour ce visiteur */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" /> Visites confirmées ({confirmedVisites.length})
                </h2>
                {confirmedVisites.length > 0 && (
                  <span className="text-[11px] font-semibold text-emerald-600">
                    Inscrites sur le Bon de Visite
                  </span>
                )}
              </div>

              {confirmedVisites.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center">
                  <p className="text-xs text-[var(--text-muted)] font-medium">
                    Aucune visite n&apos;est actuellement enregistrée pour ce contact.
                  </p>
                  <p className="text-[11px] text-[var(--text-subtle)] mt-1">
                    Pour éditer un bon de visite avec un bien précis, cliquez sur « Bon de visite » à côté d&apos;un des biens correspondants ci-dessous, ou éditez un bon vierge avec le bouton supérieur.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {confirmedVisites.map((v) => (
                    <div
                      key={v.id}
                      className="rounded-xl border border-[var(--border)] p-3.5 bg-[var(--surface-hover)] flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold text-sm text-[var(--text)]">
                          {v.biens?.titre || 'Bien sans titre'}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {v.biens?.commune} {v.biens?.quartier ? `· ${v.biens?.quartier}` : ''}
                          {v.biens?.prix_mois_fcfa ? ` — ${Number(v.biens.prix_mois_fcfa).toLocaleString('fr-FR')} FCFA/mois` : v.biens?.prix_vente_fcfa ? ` — ${Number(v.biens.prix_vente_fcfa).toLocaleString('fr-FR')} FCFA` : ''}
                        </p>
                        <p className="text-[11px] text-[var(--accent-luxury)] font-semibold mt-1">
                          📅 {v.date_souhaitee} {v.heure_debut ? `à ${v.heure_debut}` : ''} {v.heure_fin ? `(fin ${v.heure_fin})` : ''}
                        </p>
                      </div>
                      <a
                        href={`/api/admin/prospects/${p.id}/fiche-visite?bienId=${v.biens?.id}&date=${encodeURIComponent(v.date_souhaitee || '')}&heure=${encodeURIComponent(v.heure_debut || '')}&typeContact=${currentType}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--text)] hover:opacity-90 text-[var(--surface-card)] rounded-lg text-xs font-bold transition-opacity shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5" /> Bon de visite pour ce bien
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3">Historique des actions</h2>
              {crmEvents === null ? <p role="alert" className="text-sm text-amber-700">Historique indisponible. Vérifiez que la migration CRM est appliquée.</p> : crmEvents.length === 0 ? <p className="text-sm text-[var(--text-muted)] italic">Aucun événement enregistré.</p> : <ol className="space-y-3">{crmEvents.map((event) => {
                const eventLabel = event.event_type === 'human_reply'
                  ? 'Réponse commerciale'
                  : event.to_status ? `Statut : ${event.to_status}` : event.event_type.replaceAll('_', ' ')
                const eventAuthor = event.event_type === 'human_reply'
                  ? 'Commercial · WhatsApp'
                  : event.actor_name || (event.origin === 'legacy_unknown' ? 'Auteur historique non renseigné' : 'Système')
                return <li key={event.id} className="flex gap-3 text-xs"><span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${event.event_type === 'human_reply' ? 'bg-amber-500' : 'bg-[var(--accent-luxury)]'}`} /><div><p className="text-[var(--text)] font-semibold">{eventLabel}</p>{event.note && <p className="text-[var(--text-muted)] mt-0.5 whitespace-pre-wrap break-words">{event.note}</p>}<p className="text-[var(--text-subtle)] mt-0.5">{eventAuthor} · {new Date(event.created_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</p></div></li>
              })}</ol>}
            </section>

            {/* Conversation */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3 flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5" /> Conversation WhatsApp
              </h2>
              {msgs.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] italic">Aucun message archivé.</p>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {msgs.map((m, i) => {
                    const inbound = m.direction === 'inbound'
                    const commercial = !inbound && (m.metadata?.actor_type === 'commercial' || m.metadata?.trace_source === 'human_takeover')
                    const senderLabel = inbound ? (currentType === 'agent' ? 'Agent / Démarcheur' : 'Client') : commercial ? 'Commercial' : 'Sapphire'
                    return (
                      <div key={i} className={`flex ${inbound ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          inbound ? 'bg-[var(--surface-hover)] text-[var(--text)]' : commercial ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'
                        }`}>
                          <p className="whitespace-pre-wrap break-words leading-snug">{m.body}</p>
                          <p className={`text-[10px] mt-1 ${inbound ? 'text-[var(--text-subtle)]' : commercial ? 'text-slate-800/75' : 'text-white/70'}`}>
                            {senderLabel} · {new Date(m.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Biens correspondants */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3 flex items-center gap-2">
                <Home className="w-3.5 h-3.5" /> Biens correspondant à sa recherche
              </h2>
              {matches.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] italic">Aucun bien ne correspond actuellement à ses critères.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matches.map((b) => (
                    <div key={b.id}
                      className="block rounded-xl border border-[var(--border)] p-3 hover:border-[var(--accent-luxury)] transition-colors">
                      <div className="flex items-center gap-1.5 mb-1">
                        {b.source === 'flash'
                          ? <Flame className="w-3 h-3 text-orange-500" />
                          : <ShieldCheck className="w-3 h-3 text-blue-500" />}
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-subtle)]">
                          {b.source === 'flash' ? 'Offre flash' : "BOGBE'S"}
                        </span>
                      </div>
                      <p className="font-bold text-[var(--text)] text-sm line-clamp-1">{b.titre}</p>
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{b.commune}{b.quartier ? ` · ${b.quartier}` : ''}
                      </p>
                      <p className="text-sm font-bold text-[var(--accent-luxury)] mt-1">{b.prix_label}</p>
                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[var(--border)]">
                        <Link
                          href={b.url}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[10px] text-[var(--text-subtle)] hover:text-[var(--text)]"
                        >
                          <ExternalLink className="w-2.5 h-2.5" /> Voir l&apos;annonce
                        </Link>
                        <a
                          href={`/api/admin/prospects/${p.id}/fiche-visite?${b.source === 'flash' ? `localId=${b.sourceId}` : `bienId=${b.sourceId}`}&typeContact=${currentType}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--text)] hover:opacity-90 text-[var(--surface-card)] rounded text-[10px] font-bold transition-opacity"
                        >
                          <FileText className="w-2.5 h-2.5" /> Bon de visite
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar : suivi */}
          <aside className="space-y-4">
            {/* Statut */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3">Statut de suivi</h2>
              <div className="grid grid-cols-2 gap-2">
                {FLOW.map((s) => (
                  <CrmActionForm key={s} action={setProspectStatutAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="version" value={p.version} />
                    <input type="hidden" name="statut" value={s} />
                    <button type="submit"
                      className={`w-full px-2 py-2 rounded-lg text-xs font-bold border transition-colors ${
                        st === s ? STATUT_META[s].cls : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-transparent hover:text-[var(--text)]'
                      }`}>
                      {STATUT_META[s].label}
                    </button>
                  </CrmActionForm>
                ))}
              </div>
            </section>

            {/* Assignation */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3 flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5" /> Commercial assigné
              </h2>
              <CrmActionForm action={setProspectAssignAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="version" value={p.version} />
                <select name="assigned_to" defaultValue={p.assigned_to ?? ''}
                  className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)]">
                  <option value="">— Non assigné —</option>
                  {admins.map((a) => <option key={a.id} value={a.id}>{a.full_name || a.id.slice(0, 8)}</option>)}
                </select>
                <button type="submit" className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold">OK</button>
              </CrmActionForm>
              {assignedName && <p className="text-[11px] text-emerald-700 mt-2">Suivi par <strong>{assignedName}</strong></p>}
            </section>

            {/* Relance */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3 flex items-center gap-2">
                <CalendarClock className="w-3.5 h-3.5" /> Date de relance
              </h2>
              <CrmActionForm action={setProspectRelanceAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="version" value={p.version} />
                <input type="date" name="relance_le" defaultValue={p.relance_le ?? ''}
                  className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)]" />
                <button type="submit" className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold">OK</button>
              </CrmActionForm>
            </section>

            {/* Note */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3 flex items-center gap-2">
                <StickyNote className="w-3.5 h-3.5" /> Note de suivi
              </h2>
              <CrmActionForm action={setProspectNoteAction} className="space-y-2">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="version" value={p.version} />
                <textarea name="note" rows={4} defaultValue={p.note ?? ''} maxLength={500}
                  placeholder="Historique des échanges, prochaines étapes…"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] resize-none" />
                <button type="submit" className="w-full px-3 py-2 bg-[var(--accent-luxury)] text-[var(--on-accent)] rounded-lg text-xs font-bold">
                  Enregistrer la note
                </button>
              </CrmActionForm>
            </section>

            {/* Résultat et prochaine action */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3">Résultat & prochaine action</h2>
              <CrmActionForm action={setProspectOutcomeAction} className="space-y-2">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="version" value={p.version} />
                <select name="perte_motif" defaultValue={p.perte_motif ?? ''} className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)]">
                  <option value="">Motif de perte (si applicable)</option>
                  <option value="prix">Prix trop élevé</option>
                  <option value="bien_indisponible">Bien indisponible</option>
                  <option value="proprietaire_injoignable">Propriétaire injoignable</option>
                  <option value="prospect_absent">Prospect absent</option>
                  <option value="documents_incomplets">Documents incomplets</option>
                  <option value="autre">Autre</option>
                </select>
                <textarea name="loss_note" defaultValue={p.loss_note ?? ''} rows={2} maxLength={2000} placeholder="Précision obligatoire si le motif est « Autre »" className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] resize-none" />
                <input name="prochaine_action" defaultValue={p.prochaine_action ?? ''} placeholder="Prochaine action à effectuer" className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)]" />
                <p className="text-[11px] text-[var(--text-muted)]">Heure d’Abidjan (UTC)</p>
                <input type="datetime-local" name="prochaine_action_at" defaultValue={p.prochaine_action_at ? new Date(p.prochaine_action_at).toISOString().slice(0, 16) : ''} className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)]" />
                <button type="submit" className="w-full px-3 py-2 bg-[var(--text)] text-[var(--surface-card)] rounded-lg text-xs font-bold">Enregistrer le suivi</button>
              </CrmActionForm>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}

function JourneyStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-3 text-center"><p className="text-xl font-black text-[var(--text)]">{value}</p><p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mt-0.5">{label}</p></div>
}
