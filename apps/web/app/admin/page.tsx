import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Calendar, Clock, User, Phone, MapPin, CheckCircle2, AlertTriangle,
  ArrowRight, ShieldCheck, Flame, Users, CheckSquare, MessageCircle,
  Sparkles, ExternalLink, Inbox, ChevronRight, Activity, BellRing
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatFCFA } from '@/lib/format'
import { whatsappLink } from '@/lib/whatsapp'
import { WhatsAppContactButton } from '@/components/admin/WhatsAppContactButton'
import { InlineVisiteActions } from '@/components/admin/InlineVisiteActions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function formatDateFR(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function relativeTime(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    if (diffMin < 2) return "À l'instant"
    if (diffMin < 60) return `Il y a ${diffMin} min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `Il y a ${diffH} h`
    const diffJ = Math.floor(diffH / 24)
    return `Il y a ${diffJ} j`
  } catch {
    return ''
  }
}

export default async function AdminCockpitPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/admin')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // 1. Compteurs globaux
  const [
    visitesPendingRes,
    prospectsNouveauRes,
    biensPendingRes,
    reservationsPendingRes,
    contactsPendingRes,
    prospectsTotalRes,
    biensActifsRes,
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from('visites') as any).select('id', { count: 'exact', head: true }).eq('admin_validation_status', 'pending'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from('prospects') as any).select('id', { count: 'exact', head: true }).eq('statut', 'nouveau').is('merged_into', null),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from('biens') as any).select('id', { count: 'exact', head: true }).eq('statut', 'en_attente'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from('reservations') as any).select('id', { count: 'exact', head: true }).eq('admin_validation_status', 'pending'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from('contact_requests') as any).select('id', { count: 'exact', head: true }).eq('admin_validation_status', 'pending'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from('prospects') as any).select('id', { count: 'exact', head: true }).is('merged_into', null),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from('biens') as any).select('id', { count: 'exact', head: true }).eq('statut', 'disponible'),
  ])

  const countVisitesPending = visitesPendingRes?.count ?? 0
  const countProspectsNouveau = prospectsNouveauRes?.count ?? 0
  const countBiensPending = biensPendingRes?.count ?? 0
  const countReservationsPending = reservationsPendingRes?.count ?? 0
  const countContactsPending = contactsPendingRes?.count ?? 0
  const countProspectsTotal = prospectsTotalRes?.count ?? 0
  const countBiensActifs = biensActifsRes?.count ?? 0

  const totalActionsUrgentes = countVisitesPending + countProspectsNouveau + countBiensPending + countReservationsPending + countContactsPending

  // 2. Visites urgentes / à traiter (focus prioritaire)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: urgentVisitesRaw } = await (admin.from('visites') as any)
    .select(`
      id, date_souhaitee, heure_debut, heure_fin, statut, admin_validation_status,
      client_name, client_phone, created_at,
      biens ( id, titre, commune ),
      locataire:profiles!visites_locataire_id_fkey ( full_name, phone ),
      proprietaire:profiles!visites_proprietaire_id_fkey ( full_name, phone )
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  // 3. Nouveaux prospects chauds (WhatsApp)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hotProspectsRaw } = await (admin.from('prospects') as any)
    .select('id, nom, phone, type_bien, commune, quartier, budget, statut, last_seen, dernier_message, version')
    .eq('statut', 'nouveau')
    .is('merged_into', null)
    .order('last_seen', { ascending: false })
    .limit(5)

  // 4. Dernières alertes & escalades Sapphire (IA WhatsApp)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sapphireAlertsRaw } = await (admin.from('whatsapp_messages') as any)
    .select('id, jid, body, created_at, metadata')
    .eq('direction', 'system')
    .in('body', ['QUALIF_SILENCE_ALERTED', 'COUNSELOR_HANDOFF', 'LISTING_PROVIDER'])
    .order('created_at', { ascending: false })
    .limit(4)

  // 5. Annonces immobilières en attente de validation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pendingBiensRaw } = await (admin.from('biens') as any)
    .select('id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_vente_fcfa, created_at')
    .eq('statut', 'en_attente')
    .order('created_at', { ascending: false })
    .limit(4)

  const urgentVisites = urgentVisitesRaw ?? []
  const hotProspects = hotProspectsRaw ?? []
  const sapphireAlerts = sapphireAlertsRaw ?? []
  const pendingBiens = pendingBiensRaw ?? []

  // Date du jour formatée
  const todayFormatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="min-h-screen bg-[var(--surface-hover)] pb-12">
      {/* 1. Header Cockpit */}
      <div className="bg-[var(--surface-card)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-1.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-luxury)]">
                Console de Commandement
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-black text-[var(--text)] tracking-tight">
              Cockpit BOGBE&apos;S
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-muted)] capitalize mt-0.5">
              {todayFormatted} · Sapphire IA en veille 24/7 sur WhatsApp
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/admin/prospects"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)] rounded-xl text-xs font-bold transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-[var(--accent-luxury)]" />
              <span>Ouvrir Pipeline CRM</span>
            </Link>
            <Link
              href="/admin/suivi"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--text)] hover:opacity-90 text-[var(--surface-card)] rounded-xl text-xs font-bold transition-opacity shadow-sm"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>File de Suivi ({countVisitesPending + countReservationsPending})</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* 2. Bandeau des 4 KPIs d'Urgence */}
        <section aria-label="Indicateurs prioritaires" className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Link
            href="/admin/suivi?tab=visites&status=pending"
            className="group rounded-2xl border border-amber-200 bg-amber-50/70 hover:bg-amber-50 p-4 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Visites à valider
              </span>
              <span className="text-xs text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </div>
            <p className="mt-2 text-3xl font-black text-amber-950 tabular-nums">
              {countVisitesPending}
            </p>
            <p className="mt-1 text-[11px] text-amber-800/80">
              Notification automatique au proprio & visiteur
            </p>
          </Link>

          <Link
            href="/admin/prospects?statut=nouveau"
            className="group rounded-2xl border border-blue-200 bg-blue-50/70 hover:bg-blue-50 p-4 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                Prospects à contacter
              </span>
              <span className="text-xs text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </div>
            <p className="mt-2 text-3xl font-black text-blue-950 tabular-nums">
              {countProspectsNouveau}
            </p>
            <p className="mt-1 text-[11px] text-blue-800/80">
              Leads chauds WhatsApp non traités
            </p>
          </Link>

          <Link
            href="/admin/validation"
            className="group rounded-2xl border border-purple-200 bg-purple-50/70 hover:bg-purple-50 p-4 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                Annonces à valider
              </span>
              <span className="text-xs text-purple-700 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </div>
            <p className="mt-2 text-3xl font-black text-purple-950 tabular-nums">
              {countBiensPending}
            </p>
            <p className="mt-1 text-[11px] text-purple-800/80">
              Biens soumis en attente de mise en ligne
            </p>
          </Link>

          <Link
            href="/admin/suivi?tab=reservations"
            className="group rounded-2xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50 p-4 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Demandes d&apos;intermédiation
              </span>
              <span className="text-xs text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </div>
            <p className="mt-2 text-3xl font-black text-emerald-950 tabular-nums">
              {countReservationsPending + countContactsPending}
            </p>
            <p className="mt-1 text-[11px] text-emerald-800/80">
              {countReservationsPending} réservations · {countContactsPending} contacts
            </p>
          </Link>
        </section>

        {/* 3. Corps principal : 2 grandes colonnes d'action */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Colonne Gauche (7 cols) : Les Visites & Les Alertes Sapphire */}
          <div className="lg:col-span-7 space-y-6">
            {/* Bloc Visites récentes avec validation 1 clic */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[var(--text)] text-sm md:text-base">
                      Demandes de visites récentes
                    </h2>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Validation en 1 clic avec SMS/WhatsApp auto
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/suivi?tab=visites"
                  className="text-xs font-bold text-[var(--accent-luxury)] hover:underline inline-flex items-center gap-1"
                >
                  Tout voir ({countVisitesPending}) <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {urgentVisites.length === 0 ? (
                <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                  Aucune visite en attente pour le moment. 🎉
                </div>
              ) : (
                <div className="space-y-3">
                  {urgentVisites.map((v: any) => {
                    const visitorName = v.locataire?.full_name || v.client_name || 'Visiteur'
                    const visitorPhone = v.locataire?.phone || v.client_phone || '—'
                    const isPending = v.admin_validation_status === 'pending'
                    return (
                      <div
                        key={v.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-3.5 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-[var(--text)] truncate">
                                {v.biens?.titre || 'Bien immobilier'}
                              </span>
                              {v.biens?.commune && (
                                <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {v.biens.commune}
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  isPending
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : v.admin_validation_status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-red-100 text-red-800 border-red-300'
                                }`}
                              >
                                {isPending ? 'En attente' : v.admin_validation_status === 'approved' ? 'Validée' : 'Refusée'}
                              </span>
                            </div>

                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-[var(--text-muted)]">
                              <p className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-[var(--text-subtle)] shrink-0" />
                                <span className="font-semibold text-[var(--text)]">{visitorName}</span>
                                <span className="text-[11px] font-mono">{visitorPhone}</span>
                              </p>
                              <p className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-[var(--text-subtle)] shrink-0" />
                                <span className="font-medium text-[var(--text)]">{formatDateFR(v.date_souhaitee)}</span>
                                {v.heure_debut && (
                                  <span className="text-[11px]">
                                    ({v.heure_debut} - {v.heure_fin || '?'})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            {visitorPhone && visitorPhone !== '—' && (
                              <a
                                href={whatsappLink(visitorPhone) ?? '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                                title="Contacter le client sur WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Inline Quick Action pour valider la visite en 1 clic */}
                        <InlineVisiteActions visiteId={v.id} status={v.admin_validation_status} />
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Bloc Alertes & Relais Sapphire en direct */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[var(--text)] text-sm md:text-base">
                      Alertes Sapphire & Prises de main
                    </h2>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Cas où Sapphire a alerté les administrateurs
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  Temps réel
                </span>
              </div>

              {sapphireAlerts.length === 0 ? (
                <div className="py-6 text-center text-sm text-[var(--text-muted)]">
                  Aucune alerte d&apos;escalade récente. Sapphire tourne sans accroc ! 💎
                </div>
              ) : (
                <div className="space-y-3">
                  {sapphireAlerts.map((msg: any) => {
                    const isSilence = msg.body === 'QUALIF_SILENCE_ALERTED'
                    const isHandoff = msg.body === 'COUNSELOR_HANDOFF'
                    const isPartner = msg.body === 'LISTING_PROVIDER'

                    const meta = msg.metadata || {}
                    const phone = meta.senderPn || (msg.jid ? msg.jid.replace(/@.+$/, '') : '')

                    return (
                      <div
                        key={msg.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-3.5 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                isSilence
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : isHandoff
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : 'bg-purple-100 text-purple-900 border-purple-300'
                              }`}
                            >
                              {isSilence
                                ? '⚠️ Silence Qualification'
                                : isHandoff
                                ? '🔔 0 Bien Catalogue'
                                : '📥 Offre Démarcheur'}
                            </span>
                            <span className="text-[11px] font-mono text-[var(--text-muted)]">
                              +225 {phone.replace(/^225/, '')}
                            </span>
                            <span className="text-[10px] text-[var(--text-subtle)] ml-auto">
                              {relativeTime(msg.created_at)}
                            </span>
                          </div>

                          <p className="mt-1.5 text-xs text-[var(--text)] line-clamp-2 italic">
                            {isSilence && meta.userMessage
                              ? `« ${meta.userMessage} » (Manque : ${(meta.missing || []).join(', ')})`
                              : isHandoff && meta.qual
                              ? `Recherche ${meta.qual.propertyType || 'bien'} à ${meta.qual.zone || 'Abidjan'} (${meta.qual.budget ? formatFCFA(meta.qual.budget) : 'budget n/a'})`
                              : 'Proposition de bien reçue en direct par WhatsApp.'}
                          </p>
                        </div>

                        {phone && (
                          <a
                            href={whatsappLink(phone) ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-sm"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Prendre la main</span>
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Colonne Droite (5 cols) : Nouveaux Prospects & Annonces à Valider */}
          <div className="lg:col-span-5 space-y-6">
            {/* Bloc Nouveaux Prospects (Leads chauds avec auto-contact) */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[var(--text)] text-sm md:text-base">
                      Leads chauds à contacter
                    </h2>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Nouveaux prospects qualifiés par Sapphire
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/prospects?statut=nouveau"
                  className="text-xs font-bold text-[var(--accent-luxury)] hover:underline inline-flex items-center gap-1"
                >
                  CRM ({countProspectsNouveau}) <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {hotProspects.length === 0 ? (
                <div className="py-6 text-center text-sm text-[var(--text-muted)]">
                  Tous les prospects sont contactés. Beau travail ! 👏
                </div>
              ) : (
                <div className="space-y-3">
                  {hotProspects.map((p: any) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-3 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/admin/prospects/${p.id}`}
                            className="font-bold text-sm text-[var(--text)] hover:text-[var(--accent-luxury)] truncate block"
                          >
                            {p.nom || 'Prospect WhatsApp'}
                          </Link>
                          <p className="text-[11px] font-mono text-[var(--text-muted)]">
                            +225 {p.phone.replace(/^225/, '')}
                          </p>
                        </div>
                        <span className="text-[10px] text-[var(--text-subtle)] shrink-0">
                          {relativeTime(p.last_seen)}
                        </span>
                      </div>

                      {/* Critères qualifiés */}
                      {(p.type_bien || p.commune || p.budget) && (
                        <div className="text-[11px] text-[var(--text-subtle)] bg-[var(--surface-card)] rounded-lg px-2.5 py-1.5 border border-[var(--border)] flex items-center gap-2 flex-wrap">
                          {p.type_bien && <span>🏠 {p.type_bien}</span>}
                          {p.commune && <span>📍 {p.commune}</span>}
                          {p.budget && <span className="font-bold text-[var(--text)]">💰 {formatFCFA(p.budget)}</span>}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <Link
                          href={`/admin/prospects/${p.id}`}
                          className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
                        >
                          Détails fiche →
                        </Link>
                        {/* Auto-passe à "contacté" dès le clic WhatsApp */}
                        <WhatsAppContactButton
                          phone={p.phone}
                          prospectId={p.id}
                          prospectVersion={p.version}
                          currentStatus={p.statut}
                          variant="compact"
                          label="Contacter"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Bloc Annonces en attente de mise en ligne */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[var(--text)] text-sm md:text-base">
                      Annonces à valider
                    </h2>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {countBiensPending} bien{countBiensPending > 1 ? 's' : ''} en attente de revue
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/validation"
                  className="text-xs font-bold text-[var(--accent-luxury)] hover:underline inline-flex items-center gap-1"
                >
                  File ({countBiensPending}) <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {pendingBiens.length === 0 ? (
                <div className="py-6 text-center text-sm text-[var(--text-muted)]">
                  Aucune annonce en attente de validation. 🌟
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingBiens.map((b: any) => (
                    <Link
                      key={b.id}
                      href="/admin/validation"
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] hover:bg-[var(--border)]/40 p-3 flex items-center justify-between gap-3 transition-colors block"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-[var(--text)] truncate">
                          {b.titre || 'Bien sans titre'}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          {b.commune || 'Abidjan'} · {b.type_bien || 'Bien'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-[var(--accent-luxury)] block">
                          {b.prix_mois_fcfa
                            ? `${formatFCFA(b.prix_mois_fcfa)} /m`
                            : b.prix_vente_fcfa
                            ? `${formatFCFA(b.prix_vente_fcfa)}`
                            : 'Prix sur demande'}
                        </span>
                        <span className="text-[10px] text-[var(--text-subtle)]">
                          {relativeTime(b.created_at)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Raccourcis utiles */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/admin/flash"
                className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2"
              >
                <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text)] truncate">Offres Flash</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">Créer / Gérer</p>
                </div>
              </Link>
              <Link
                href="/admin/performance"
                className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2"
              >
                <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text)] truncate">Performance</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">Taux & Conversions</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
