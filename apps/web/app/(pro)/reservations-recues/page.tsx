import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar, Clock, CheckCircle2, XCircle, BedDouble, MapPin, ShieldCheck, Hourglass } from 'lucide-react'
import { formatFCFA } from '@/lib/format'

export const dynamic = 'force-dynamic'

/**
 * Page des réservations REÇUES par le propriétaire (réservations effectuées
 * par des clients sur SES biens). Différent de /(client)/reservations qui
 * liste les réservations FAITES par un client locataire.
 *
 * Permet au proprio de voir et gérer les demandes de réservation.
 */
export default async function ReservationsPropPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/reservations-recues')

  // 1. Récupère TOUTES les réservations du proprio directement.
  // ⚠ INTERMEDIATION TOTALE : on ne SELECT PAS les infos client (profiles).
  // Le RLS de `reservations` filtre déjà sur proprietaire_id = auth.uid()
  // (cf migration 004) — donc le filtre .eq() est de la défense en profondeur.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reservationsRaw, error: resErr } = await (supabase as any)
    .from('reservations')
    .select(`
      id, bien_id, statut, date_debut, date_fin, duree_mois,
      montant_total_fcfa, montant_loyer_fcfa, created_at
    `)
    .eq('proprietaire_id', user.id)
    .order('created_at', { ascending: false })

  if (resErr) {
    console.error('[reservations-recues] fetch error:', resErr.message)
  }

  const reservations = (reservationsRaw ?? []) as Array<{
    id: string
    bien_id: string
    statut: string
    date_debut: string
    date_fin: string | null
    duree_mois: number | null
    montant_total_fcfa: number | null
    montant_loyer_fcfa: number | null
    created_at: string
  }>

  // 2. Récupère les biens concernés (uniquement les fields utiles à l'affichage)
  const uniqueBienIds = Array.from(new Set(reservations.map((r) => r.bien_id)))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biens } = uniqueBienIds.length > 0
    ? await (supabase as any)
        .from('biens')
        .select('id, titre, commune, quartier, type_bien, prix_nuit_fcfa, prix_mois_fcfa')
        .in('id', uniqueBienIds)
    : { data: [] }

  const bienMap = new Map(
    (biens ?? []).map((b: { id: string }) => [b.id, b]),
  )

  const enAttente = reservations.filter((r) => r.statut === 'en_attente')
  const confirmees = reservations.filter((r) => r.statut === 'confirmee' || r.statut === 'terminee')
  const refusees = reservations.filter((r) => r.statut === 'annulee')

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
      <header className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)] mb-2">
          Réservations reçues
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Demandes de réservation sur vos biens en location à la nuitée ou au mois.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard label="En attente" value={enAttente.length} variant="warn" />
        <StatCard label="Confirmées" value={confirmees.length} variant="success" />
        <StatCard label="Refusées" value={refusees.length} variant="muted" />
      </div>

      {/* En attente (priorité) */}
      <section className="mb-10">
        <h2 className="font-display text-lg font-bold text-[var(--text)] mb-3 inline-flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          En attente de confirmation
        </h2>
        {enAttente.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] italic px-4 py-6 rounded-xl bg-[var(--surface-card)] border border-dashed border-[var(--border)]">
            Aucune réservation en attente. Tout est à jour.
          </p>
        ) : (
          <ul className="space-y-3">
            {enAttente.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                bien={bienMap.get(r.bien_id) as Bien | undefined}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Confirmées récentes */}
      {confirmees.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-lg font-bold text-[var(--text)] mb-3 inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Confirmées
          </h2>
          <ul className="space-y-2">
            {confirmees.slice(0, 10).map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                bien={bienMap.get(r.bien_id) as Bien | undefined}
                compact
              />
            ))}
          </ul>
        </section>
      )}

      {refusees.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold text-[var(--text)] mb-3 inline-flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            Refusées ou annulées
          </h2>
          <ul className="space-y-2">
            {refusees.slice(0, 5).map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                bien={bienMap.get(r.bien_id) as Bien | undefined}
                compact
              />
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

interface Bien {
  id: string
  titre: string
  commune: string
  quartier: string | null
  type_bien: string
  prix_nuit_fcfa: number | null
  prix_mois_fcfa: number | null
}

interface ReservationCardProps {
  reservation: {
    id: string
    statut: string
    date_debut: string
    date_fin: string | null
    duree_mois: number | null
    montant_total_fcfa: number | null
  }
  bien: Bien | undefined
  compact?: boolean
}

function ReservationCard({ reservation: r, bien, compact = false }: ReservationCardProps) {
  const debut = new Date(r.date_debut).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const fin = r.date_fin
    ? new Date(r.date_fin).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null

  // Calcule la durée selon le contexte (meublé = nuits, classique = mois)
  const isMeuble = bien?.type_bien === 'residence_meublee'
  const nbNuits = isMeuble && r.date_fin
    ? Math.max(1, Math.ceil((new Date(r.date_fin).getTime() - new Date(r.date_debut).getTime()) / 86400000))
    : null
  const dureeLabel = isMeuble && nbNuits
    ? `${nbNuits} nuit${nbNuits > 1 ? 's' : ''}`
    : r.duree_mois
      ? `${r.duree_mois} mois`
      : null

  return (
    <li
      className={`rounded-xl border ${
        compact
          ? 'bg-[var(--surface-card)]/60 border-[var(--border)] px-4 py-3'
          : 'bg-[var(--surface-card)] border-amber-200/40 p-4'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Bien */}
          <p className="font-display font-bold text-[var(--text)] truncate inline-flex items-center gap-1.5">
            <BedDouble className="w-3.5 h-3.5 text-[var(--accent-luxury)] shrink-0" />
            {bien?.titre || '—'}
          </p>
          {bien && (
            <p className="text-xs text-[var(--text-muted)] inline-flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {bien.commune}
              {bien.quartier ? ` · ${bien.quartier}` : ''}
            </p>
          )}

          {/* Détails resa — uniquement infos non personnelles du client */}
          <div className="mt-2 text-xs text-[var(--text)] space-y-0.5">
            <p className="inline-flex items-center gap-1.5 flex-wrap">
              <Calendar className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
              {fin ? (
                <>
                  Du <strong>{debut}</strong> au <strong>{fin}</strong>
                  {dureeLabel && ` (${dureeLabel})`}
                </>
              ) : (
                <>
                  À partir du <strong>{debut}</strong>
                  {dureeLabel && ` · ${dureeLabel}`}
                </>
              )}
            </p>
          </div>

          {/* Montant */}
          {r.montant_total_fcfa && (
            <p className="font-display text-base font-black text-[var(--accent-luxury)] mt-2">
              {formatFCFA(r.montant_total_fcfa)}
            </p>
          )}
        </div>

        {/* Statut en attente — pas d'action proprio (admin valide) */}
        {!compact && r.statut === 'en_attente' && (
          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
            <Hourglass className="w-3 h-3" />
            Validation équipe
          </span>
        )}
        {compact && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
              r.statut === 'confirmee'
                ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-700 border border-red-500/20'
            }`}
          >
            {r.statut}
          </span>
        )}
      </div>

      {/* Info workflow en bas — uniquement sur la carte détaillée */}
      {!compact && r.statut === 'en_attente' && (
        <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-start gap-2 text-[11px] text-[var(--text-muted)]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Notre équipe vérifie la demande et organise la suite (acompte, contrat, remise des clés).
            Vous serez recontacté(e) dès que la réservation est validée.
            Pour des raisons de confidentialité, les coordonnées du locataire ne sont pas affichées ici.
          </p>
        </div>
      )}
    </li>
  )
}

interface StatCardProps {
  label: string
  value: number
  variant: 'warn' | 'success' | 'muted'
}

function StatCard({ label, value, variant }: StatCardProps) {
  const palette = {
    warn: 'bg-amber-500/10 border-amber-500/20 text-amber-700',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700',
    muted: 'bg-slate-500/10 border-slate-500/20 text-slate-600',
  }[variant]
  return (
    <div className={`px-4 py-3 rounded-xl border ${palette}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      <p className="font-display text-2xl font-black tabular-nums mt-1">{value}</p>
    </div>
  )
}
