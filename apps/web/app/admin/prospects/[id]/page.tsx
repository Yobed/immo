import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, Phone, MessageCircle, Home, Wallet, Calendar, Clock, MapPin,
  CalendarClock, UserCheck, StickyNote, ExternalLink, Flame, ShieldCheck, FileText,
  Briefcase, User, Check, AlertCircle, ChevronRight, CheckCircle2,
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

const STATUT_META: Record<Statut, { label: string; cls: string; dot: string; bgTone: string }> = {
  nouveau: {
    label: 'Nouveau',
    cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
    bgTone: 'bg-amber-500/10',
  },
  contacte: {
    label: 'Contacté',
    cls: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    dot: 'bg-sky-400',
    bgTone: 'bg-sky-500/10',
  },
  visite_planifiee: {
    label: 'Visite planifiée',
    cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    dot: 'bg-purple-400',
    bgTone: 'bg-purple-500/10',
  },
  visite_realisee: {
    label: 'Visite réalisée',
    cls: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    dot: 'bg-indigo-400',
    bgTone: 'bg-indigo-500/10',
  },
  relance: {
    label: 'Relance',
    cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    dot: 'bg-orange-400',
    bgTone: 'bg-orange-500/10',
  },
  gagne: {
    label: 'Gagné (Signé)',
    cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
    bgTone: 'bg-emerald-500/10',
  },
  perdu: {
    label: 'Perdu (Sans suite)',
    cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
    bgTone: 'bg-rose-500/10',
  },
  en_cours: {
    label: 'Contacté (Historique)',
    cls: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    dot: 'bg-sky-400',
    bgTone: 'bg-sky-500/10',
  },
  rdv: {
    label: 'Visite planifiée (Historique)',
    cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    dot: 'bg-purple-400',
    bgTone: 'bg-purple-500/10',
  },
  traite: {
    label: 'Traité — à qualifier',
    cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    dot: 'bg-slate-400',
    bgTone: 'bg-slate-500/10',
  },
}

const FLOW: Statut[] = ['nouveau', 'contacte', 'visite_planifiee', 'visite_realisee', 'relance', 'gagne', 'perdu']

const PIPELINE_STEPS: Array<{ key: Statut; label: string }> = [
  { key: 'nouveau', label: 'Nouveau lead' },
  { key: 'contacte', label: 'Contacté' },
  { key: 'visite_planifiee', label: 'Visite planifiée' },
  { key: 'visite_realisee', label: 'Visite réalisée' },
  { key: 'relance', label: 'Relance active' },
  { key: 'gagne', label: 'Signé / Gagné' },
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

  const st = (p.statut in STATUT_META ? p.statut : 'nouveau') as Statut
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
      matches = items.slice(0, 6)
    } catch {
      /* catalogue indisponible */
    }
  }

  const critereLine = [p.type_bien, p.commune, p.quartier].filter(Boolean).join(' · ')

  return (
    <main className="min-h-screen bg-[var(--surface-hover)] pb-12">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        {/* 1. Fil d'Ariane & Retour */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/admin/prospects"
            className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Retour au pipeline des prospects</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-[var(--text-subtle)]">
            <span>Réf :</span>
            <code className="font-mono bg-[var(--surface-card)] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--text)]">
              {p.id.slice(0, 8)}
            </code>
          </div>
        </div>

        {/* 2. Hero Card Prospect avec Statut & Qualification */}
        <div className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 md:p-6 shadow-sm flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-display font-black text-[var(--text)] tracking-tight">
                {p.nom || 'Prospect sans nom'}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border flex items-center gap-1.5 ${STATUT_META[st].cls}`}>
                <span className={`w-2 h-2 rounded-full ${STATUT_META[st].dot}`} />
                {STATUT_META[st].label}
              </span>

              {/* Badge Qualification : Client Direct vs Démarcheur */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  currentType === 'agent'
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {currentType === 'agent' ? <Briefcase className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                {currentType === 'agent' ? 'Démarcheur / Agent' : 'Client direct'}
              </span>

              {/* Toggle rapide Client / Démarcheur */}
              <CrmActionForm action={setProspectTypeAction} className="inline-block">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="type_contact" value={currentType === 'agent' ? 'prospect' : 'agent'} />
                <button
                  type="submit"
                  title="Modifier la qualification du contact"
                  className="text-xs text-[var(--accent-luxury)] hover:underline font-semibold transition-colors"
                >
                  (Basculer en {currentType === 'agent' ? 'Client direct' : 'Démarcheur'})
                </button>
              </CrmActionForm>
            </div>

            <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] flex-wrap">
              <span className="font-mono font-bold text-[var(--text)] flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[var(--accent-luxury)]" />
                +225 {String(p.phone).replace(/^225/, '')}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
                {p.message_count} échange(s)
              </span>
              {assignedName && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <UserCheck className="w-3.5 h-3.5" />
                    Assigné à {assignedName}
                  </span>
                </>
              )}
            </div>

            {critereLine && (
              <div className="pt-1 flex items-center gap-3 text-xs text-[var(--text-subtle)] flex-wrap">
                <span className="inline-flex items-center gap-1 text-[var(--text)] font-semibold">
                  <Home className="w-3.5 h-3.5 text-[var(--accent-luxury)]" />
                  {critereLine}
                </span>
                {p.budget != null && (
                  <span className="inline-flex items-center gap-1 text-[var(--accent-luxury)] font-bold">
                    <Wallet className="w-3.5 h-3.5" />
                    {formatFCFA(p.budget)}
                  </span>
                )}
                {p.date_souhaitee && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Souhaité : {p.date_souhaitee}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quick CTAs Header */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <a
              href={`/api/admin/prospects/${p.id}/fiche-visite?typeContact=${currentType}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)] rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <FileText className="w-4 h-4 text-[var(--accent-luxury)]" />
              <span>Bon de visite (PDF) {confirmedVisites.length > 0 ? `(${confirmedVisites.length})` : ''}</span>
            </a>
            <WhatsAppContactButton
              phone={p.phone}
              prospectId={p.id}
              prospectVersion={p.version}
              currentStatus={p.statut}
            />
          </div>
        </div>

        {/* 3. Stepper Visuel de Progression CRM */}
        <div className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)]">
              Tunnel de conversion commercial
            </p>
            {st === 'perdu' ? (
              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                Opportunité sans suite (Perdu)
              </span>
            ) : st === 'gagne' ? (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Transaction signée avec succès !
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {PIPELINE_STEPS.map((step, idx) => {
              const isPast = currentStepIdx >= 0 && idx < currentStepIdx && st !== 'perdu'
              const isCurrent = idx === currentStepIdx && st !== 'perdu'
              const isFuture = idx > currentStepIdx || st === 'perdu'

              return (
                <div
                  key={step.key}
                  className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                    isCurrent
                      ? 'bg-[var(--accent-luxury)]/15 border-[var(--accent-luxury)] text-[var(--text)] ring-2 ring-[var(--accent-luxury)]/40 shadow-sm'
                      : isPast
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-muted)] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase">Étape {idx + 1}</span>
                    {isPast ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-[var(--accent-luxury)] animate-ping" />
                    ) : null}
                  </div>
                  <p className="text-xs font-bold line-clamp-1">{step.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* 4. Layout en 2 colonnes : Détail principal vs Cockpit d'action */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-6 items-start">
          {/* Colonne Principale (Gauche) */}
          <div className="space-y-6">
            {/* Statistiques de parcours */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3">
                Parcours & Engagements
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <JourneyStat label="Demandes contact" value={contactCount ?? 0} icon={MessageCircle} />
                <JourneyStat label="Visites confirmées" value={confirmedVisites.length} icon={Calendar} tone="purple" />
                <JourneyStat label="Réservations" value={reservationCount ?? 0} icon={CheckCircle2} tone="emerald" />
                <JourneyStat label="Échanges WhatsApp" value={p.message_count} icon={Phone} tone="blue" />
              </div>
            </section>

            {/* Critères et préférences de recherche */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3 flex items-center gap-2">
                <Home className="w-4 h-4 text-[var(--accent-luxury)]" />
                Critères & Projet immobilier
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--surface-hover)] rounded-xl border border-[var(--border)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Type de bien</p>
                  <p className="text-sm font-bold text-[var(--text)] mt-0.5">{p.type_bien || 'Non renseigné'}</p>
                </div>
                <div className="p-3 bg-[var(--surface-hover)] rounded-xl border border-[var(--border)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Budget indicatif</p>
                  <p className="text-sm font-black text-[var(--accent-luxury)] mt-0.5">
                    {p.budget != null ? formatFCFA(p.budget) : 'Non précisé'}
                  </p>
                </div>
                <div className="p-3 bg-[var(--surface-hover)] rounded-xl border border-[var(--border)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Commune & Quartier</p>
                  <p className="text-sm font-bold text-[var(--text)] mt-0.5">
                    {[p.commune, p.quartier].filter(Boolean).join(' · ') || 'Toutes zones'}
                  </p>
                </div>
                <div className="p-3 bg-[var(--surface-hover)] rounded-xl border border-[var(--border)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Date souhaitée</p>
                  <p className="text-sm font-bold text-[var(--text)] mt-0.5">{p.date_souhaitee || 'Dès que possible'}</p>
                </div>
              </div>
            </section>

            {/* Visites confirmées pour ce visiteur */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  Visites confirmées ({confirmedVisites.length})
                </h2>
                {confirmedVisites.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Prêtes pour Bon de Visite
                  </span>
                )}
              </div>

              {confirmedVisites.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-5 text-center">
                  <p className="text-xs text-[var(--text-muted)] font-medium">
                    Aucune visite confirmée pour ce prospect.
                  </p>
                  <p className="text-[11px] text-[var(--text-subtle)] mt-1">
                    Générez une fiche vierge avec le bouton supérieur ou associez un bien correspondant ci-dessous.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {confirmedVisites.map((v) => (
                    <div
                      key={v.id}
                      className="rounded-xl border border-[var(--border)] p-4 bg-[var(--surface-hover)] flex flex-wrap items-center justify-between gap-3 hover:border-[var(--accent-luxury)]/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[var(--text)] truncate">
                          {v.biens?.titre || 'Bien sans titre'}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {v.biens?.commune} {v.biens?.quartier ? `· ${v.biens?.quartier}` : ''}
                          {v.biens?.prix_mois_fcfa
                            ? ` — ${Number(v.biens.prix_mois_fcfa).toLocaleString('fr-FR')} FCFA/mois`
                            : v.biens?.prix_vente_fcfa
                              ? ` — ${Number(v.biens.prix_vente_fcfa).toLocaleString('fr-FR')} FCFA`
                              : ''}
                        </p>
                        <p className="text-xs text-[var(--accent-luxury)] font-bold mt-1 inline-flex items-center gap-1.5">
                          <CalendarClock className="w-3.5 h-3.5" />
                          {v.date_souhaitee} {v.heure_debut ? `à ${v.heure_debut}` : ''} {v.heure_fin ? `(fin ${v.heure_fin})` : ''}
                        </p>
                      </div>
                      <a
                        href={`/api/admin/prospects/${p.id}/fiche-visite?bienId=${v.biens?.id}&date=${encodeURIComponent(v.date_souhaitee || '')}&heure=${encodeURIComponent(v.heure_debut || '')}&typeContact=${currentType}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--surface-card)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)] rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                      >
                        <FileText className="w-3.5 h-3.5 text-[var(--accent-luxury)]" />
                        <span>Bon de visite pour ce bien</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Conversation WhatsApp en bulles */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  Conversation WhatsApp archivée
                </h2>
                <span className="text-xs text-[var(--text-muted)] font-mono">{msgs.length} messages</span>
              </div>

              {msgs.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] italic text-center py-6">Aucun message archivé.</p>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {msgs.map((m, i) => {
                    const inbound = m.direction === 'inbound'
                    const commercial = !inbound && (m.metadata?.actor_type === 'commercial' || m.metadata?.trace_source === 'human_takeover')
                    const senderLabel = inbound
                      ? (currentType === 'agent' ? 'Démarcheur' : 'Client')
                      : commercial
                        ? 'Commercial · Prise en main'
                        : 'Sapphire IA'
                    return (
                      <div key={i} className={`flex ${inbound ? 'justify-start' : 'justify-end'}`}>
                        <div
                          className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                            inbound
                              ? 'bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]'
                              : commercial
                                ? 'bg-amber-500 text-slate-950 font-medium'
                                : 'bg-emerald-600 text-white font-medium'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                          <p
                            className={`text-[10px] mt-1.5 font-bold ${
                              inbound ? 'text-[var(--text-subtle)]' : commercial ? 'text-slate-800' : 'text-emerald-100'
                            }`}
                          >
                            {senderLabel} · {new Date(m.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Biens correspondants du catalogue */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3.5 flex items-center gap-2">
                <Home className="w-4 h-4 text-[var(--accent-luxury)]" />
                Biens correspondants à son besoin ({matches.length})
              </h2>
              {matches.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] italic text-center py-6">
                  Aucun bien ne correspond actuellement à ses critères.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {matches.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-xl border border-[var(--border)] p-3.5 bg-[var(--surface)] hover:border-[var(--accent-luxury)] transition-all shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {b.source === 'flash' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                              <Flame className="w-3 h-3 text-orange-400" />
                              Offre Flash
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                              <ShieldCheck className="w-3 h-3 text-sky-400" />
                              BOGBE&apos;S
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-[var(--text)] text-sm line-clamp-1">{b.titre}</p>
                        <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[var(--text-subtle)]" />
                          {b.commune}{b.quartier ? ` · ${b.quartier}` : ''}
                        </p>
                        <p className="text-sm font-black text-[var(--accent-luxury)] mt-1.5">{b.prix_label}</p>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[var(--border)]">
                        <Link
                          href={b.url}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Voir
                        </Link>
                        <a
                          href={`/api/admin/prospects/${p.id}/fiche-visite?${b.source === 'flash' ? `localId=${b.sourceId}` : `bienId=${b.sourceId}`}&typeContact=${currentType}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] rounded-lg text-xs font-bold transition-all border border-[var(--border)]"
                        >
                          <FileText className="w-3 h-3 text-[var(--accent-luxury)]" /> Bon de visite
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Historique des actions CRM */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3.5">
                Historique des actions & Évolutions
              </h2>
              {crmEvents === null ? (
                <p role="alert" className="text-sm text-amber-500">
                  Historique indisponible. Vérifiez que la migration CRM est appliquée.
                </p>
              ) : crmEvents.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] italic text-center py-6">Aucun événement enregistré.</p>
              ) : (
                <ol className="space-y-3">
                  {crmEvents.map((event) => {
                    const eventLabel =
                      event.event_type === 'human_reply'
                        ? 'Réponse commerciale'
                        : event.to_status
                          ? `Statut : ${event.to_status}`
                          : event.event_type.replaceAll('_', ' ')
                    const eventAuthor =
                      event.event_type === 'human_reply'
                        ? 'Commercial · WhatsApp'
                        : event.actor_name || (event.origin === 'legacy_unknown' ? 'Auteur historique non renseigné' : 'Système')
                    return (
                      <li key={event.id} className="flex gap-3 text-xs">
                        <span
                          className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                            event.event_type === 'human_reply' ? 'bg-amber-500' : 'bg-[var(--accent-luxury)]'
                          }`}
                        />
                        <div>
                          <p className="text-[var(--text)] font-bold">{eventLabel}</p>
                          {event.note && (
                            <p className="text-[var(--text-muted)] mt-0.5 whitespace-pre-wrap break-words">{event.note}</p>
                          )}
                          <p className="text-[var(--text-subtle)] mt-0.5">
                            {eventAuthor} · {new Date(event.created_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </section>
          </div>

          {/* Colonne Latérale Droite (Cockpit d'action CRM Sticky) */}
          <aside className="space-y-5 lg:sticky lg:top-6">
            {/* Statut de suivi */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3">
                Statut commercial
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {FLOW.map((s) => (
                  <CrmActionForm key={s} action={setProspectStatutAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="version" value={p.version} />
                    <input type="hidden" name="statut" value={s} />
                    <button
                      type="submit"
                      className={`min-h-[38px] w-full px-2.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                        st === s
                          ? `${STATUT_META[s].cls} ring-2 ring-[var(--accent-luxury)]/40 shadow-sm font-black`
                          : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-transparent hover:text-[var(--text)]'
                      }`}
                    >
                      {st === s && <span className={`w-1.5 h-1.5 rounded-full ${STATUT_META[s].dot}`} />}
                      <span>{STATUT_META[s].label.split(' ')[0]}</span>
                    </button>
                  </CrmActionForm>
                ))}
              </div>
            </section>

            {/* Assignation commercial */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3 flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Conseiller assigné
              </h2>
              <CrmActionForm action={setProspectAssignAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="version" value={p.version} />
                <select
                  name="assigned_to"
                  defaultValue={p.assigned_to ?? ''}
                  aria-label="Sélectionner le conseiller"
                  className="flex-1 min-h-[38px] px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
                >
                  <option value="">— Non assigné —</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name || a.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="min-h-[38px] px-4 py-2 bg-[var(--accent-luxury)] hover:brightness-110 text-[#0b1530] rounded-xl text-xs font-black shadow-sm transition-all active:scale-95"
                >
                  OK
                </button>
              </CrmActionForm>
              {assignedName && (
                <p className="text-[11px] text-emerald-400 font-semibold mt-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Dossier géré par <strong>{assignedName}</strong>
                </p>
              )}
            </section>

            {/* Date de relance avec raccourcis */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3 flex items-center gap-2">
                <CalendarClock className="w-3.5 h-3.5 text-orange-400" />
                Planifier une relance
              </h2>
              <CrmActionForm action={setProspectRelanceAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="version" value={p.version} />
                <input
                  type="date"
                  name="relance_le"
                  defaultValue={p.relance_le ?? ''}
                  aria-label="Date de relance"
                  className="flex-1 min-h-[38px] px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
                />
                <button
                  type="submit"
                  className="min-h-[38px] px-4 py-2 bg-[var(--accent-luxury)] hover:brightness-110 text-[#0b1530] rounded-xl text-xs font-black shadow-sm transition-all active:scale-95"
                >
                  OK
                </button>
              </CrmActionForm>

              {/* Raccourcis rapides */}
              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                <span className="text-[10px] text-[var(--text-subtle)] font-medium">Raccourcis :</span>
                <CrmActionForm action={setProspectRelanceAction} className="inline">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="version" value={p.version} />
                  <input type="hidden" name="relance_le" value={tomorrowDateStr} />
                  <button
                    type="submit"
                    className="px-2 py-0.5 rounded-md bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[10px] font-bold text-[var(--text)] border border-[var(--border)] transition-colors"
                  >
                    +1 jour
                  </button>
                </CrmActionForm>
                <CrmActionForm action={setProspectRelanceAction} className="inline">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="version" value={p.version} />
                  <input type="hidden" name="relance_le" value={in3DaysDateStr} />
                  <button
                    type="submit"
                    className="px-2 py-0.5 rounded-md bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[10px] font-bold text-[var(--text)] border border-[var(--border)] transition-colors"
                  >
                    +3 jours
                  </button>
                </CrmActionForm>
                <CrmActionForm action={setProspectRelanceAction} className="inline">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="version" value={p.version} />
                  <input type="hidden" name="relance_le" value={in7DaysDateStr} />
                  <button
                    type="submit"
                    className="px-2 py-0.5 rounded-md bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[10px] font-bold text-[var(--text)] border border-[var(--border)] transition-colors"
                  >
                    +1 semaine
                  </button>
                </CrmActionForm>
              </div>
            </section>

            {/* Note de suivi */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3 flex items-center gap-2">
                <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                Note interne de suivi
              </h2>
              <CrmActionForm action={setProspectNoteAction} className="space-y-2.5">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="version" value={p.version} />
                <textarea
                  name="note"
                  rows={4}
                  defaultValue={p.note ?? ''}
                  maxLength={500}
                  placeholder="Historique des échanges, objections, prochaines étapes…"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] resize-none focus:outline-none focus:border-[var(--accent-luxury)] transition-colors leading-relaxed"
                />
                <button
                  type="submit"
                  className="w-full min-h-[40px] px-3 py-2 bg-[var(--accent-luxury)] hover:brightness-110 text-[#0b1530] rounded-xl text-xs font-black shadow-sm transition-all active:scale-[0.99]"
                >
                  Enregistrer la note
                </button>
              </CrmActionForm>
            </section>

            {/* Résultat & Prochaine action */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3">
                Issue ou Prochaine action
              </h2>
              <CrmActionForm action={setProspectOutcomeAction} className="space-y-2.5">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="version" value={p.version} />
                <select
                  name="perte_motif"
                  defaultValue={p.perte_motif ?? ''}
                  aria-label="Motif de perte"
                  className="w-full min-h-[38px] px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
                >
                  <option value="">Motif de perte (si classé sans suite)</option>
                  <option value="prix">Prix trop élevé</option>
                  <option value="bien_indisponible">Bien indisponible</option>
                  <option value="proprietaire_injoignable">Propriétaire injoignable</option>
                  <option value="prospect_absent">Prospect absent au RDV</option>
                  <option value="documents_incomplets">Documents incomplets</option>
                  <option value="autre">Autre motif</option>
                </select>
                <textarea
                  name="loss_note"
                  defaultValue={p.loss_note ?? ''}
                  rows={2}
                  maxLength={2000}
                  placeholder="Précision sur le motif de perte…"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] resize-none focus:outline-none focus:border-[var(--accent-luxury)] transition-colors"
                />
                <input
                  name="prochaine_action"
                  defaultValue={p.prochaine_action ?? ''}
                  placeholder="Prochaine action à effectuer"
                  className="w-full min-h-[38px] px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
                />
                <div className="space-y-1">
                  <p className="text-[10px] text-[var(--text-muted)] font-medium">Date & heure d’échéance (UTC/Abidjan)</p>
                  <input
                    type="datetime-local"
                    name="prochaine_action_at"
                    defaultValue={p.prochaine_action_at ? new Date(p.prochaine_action_at).toISOString().slice(0, 16) : ''}
                    aria-label="Date et heure de la prochaine action"
                    className="w-full min-h-[38px] px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full min-h-[40px] px-3 py-2 bg-[var(--text)] text-[var(--surface-card)] rounded-xl text-xs font-black shadow-sm hover:opacity-90 transition-opacity active:scale-[0.99]"
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

function JourneyStat({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: number
  icon: typeof MessageCircle
  tone?: 'default' | 'purple' | 'emerald' | 'blue'
}) {
  const tones = {
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    default: 'text-[var(--text)] bg-[var(--surface-hover)] border-[var(--border)]',
  }
  return (
    <div className={`rounded-xl border p-3 text-center transition-all ${tones[tone]}`}>
      <div className="inline-flex items-center justify-center mb-1">
        <Icon className="w-3.5 h-3.5 opacity-80" />
      </div>
      <p className="text-xl font-black tabular-nums">{value}</p>
      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
}
