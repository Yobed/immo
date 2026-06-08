import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, CheckCircle2, XCircle, BedDouble, MapPin, User } from 'lucide-react'
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

  // 1. Récupère les IDs des biens du proprio
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biens } = await (supabase as any)
    .from('biens')
    .select('id, titre, commune, quartier, type_bien, prix_nuit_fcfa, prix_mois_fcfa')
    .eq('proprietaire_id', user.id)

  const bienIds = (biens ?? []).map((b: { id: string }) => b.id)
  const bienMap = new Map(
    (biens ?? []).map((b: { id: string }) => [b.id, b]),
  )

  // 2. Récupère toutes les réservations sur ces biens
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reservationsRaw } = bienIds.length > 0
    ? await (supabase as any)
        .from('reservations')
        .select(`
          id, bien_id, statut, date_debut, date_fin, nb_nuits,
          montant_total_fcfa, client_id, created_at,
          profiles!client_id(full_name, phone, email)
        `)
        .in('bien_id', bienIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const reservations = (reservationsRaw ?? []) as Array<{
    id: string
    bien_id: string
    statut: string
    date_debut: string
    date_fin: string
    nb_nuits: number | null
    montant_total_fcfa: number | null
    client_id: string | null
    created_at: string
    profiles: { full_name: string | null; phone: string | null; email: string | null } | null
  }>

  const enAttente = reservations.filter((r) => r.statut === 'en_attente')
  const confirmees = reservations.filter((r) => r.statut === 'confirmee')
  const refusees = reservations.filter((r) => r.statut === 'refusee' || r.statut === 'annulee')

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
    date_fin: string
    nb_nuits: number | null
    montant_total_fcfa: number | null
    profiles: { full_name: string | null; phone: string | null; email: string | null } | null
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
  const fin = new Date(r.date_fin).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const client = r.profiles?.full_name || 'Client'

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

          {/* Détails resa */}
          <div className="mt-2 text-xs text-[var(--text)] space-y-0.5">
            <p className="inline-flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
              Du <strong>{debut}</strong> au <strong>{fin}</strong>
              {r.nb_nuits ? ` (${r.nb_nuits} nuit${r.nb_nuits > 1 ? 's' : ''})` : ''}
            </p>
            <p className="inline-flex items-center gap-1.5">
              <User className="w-3 h-3 text-[var(--text-muted)]" />
              <strong>{client}</strong>
              {r.profiles?.phone ? ` · ${r.profiles.phone}` : ''}
            </p>
          </div>

          {/* Montant */}
          {r.montant_total_fcfa && (
            <p className="font-display text-base font-black text-[var(--accent-luxury)] mt-2">
              {formatFCFA(r.montant_total_fcfa)}
            </p>
          )}
        </div>

        {!compact && r.statut === 'en_attente' && (
          <Link
            href={`/reservations/${r.id}`}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--accent-luxury)] text-[var(--on-accent)] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Voir & confirmer
          </Link>
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
