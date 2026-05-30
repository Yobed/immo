import { createClient } from '@/lib/supabase/server'
import { createLocauxClient } from '@/lib/supabase/locaux'
import { Clock, MapPin, ShieldCheck, Flame } from 'lucide-react'

/**
 * Formate une durée en minutes pour affichage humain :
 *   < 60   → "X min"
 *   < 1440 → "Xh" ou "Xh30"
 *   sinon  → "Xj"
 */
function formatDelay(minutes: number): string {
  if (minutes < 1) return '< 1 min'
  if (minutes < 60) return `${Math.round(minutes)} min`
  const hours = minutes / 60
  if (hours < 24) {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return m >= 30 ? `${h}h${m}` : `${h}h`
  }
  const days = Math.round(hours / 24)
  return `${days}j`
}

/**
 * Délai moyen de réponse conseiller = AVG(admin_validated_at - created_at)
 * sur les 30 derniers jours, toutes demandes confondues
 * (contact_requests + visites + reservations).
 *
 * Retourne { label, hint } :
 *   - hint = 'live' si calculé sur ≥3 demandes réelles
 *   - hint = 'goal' si fallback hardcodé (pas assez de données)
 */
async function computeAdvisorResponseDelay(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<{ label: string; hint: 'live' | 'goal' }> {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()

  const select = 'created_at, admin_validated_at'
  const [contacts, visites, reservations] = await Promise.all([
    supabase
      .from('contact_requests')
      .select(select)
      .not('admin_validated_at', 'is', null)
      .gte('created_at', since)
      .limit(200),
    supabase
      .from('visites')
      .select(select)
      .not('admin_validated_at', 'is', null)
      .gte('created_at', since)
      .limit(200),
    supabase
      .from('reservations')
      .select(select)
      .not('admin_validated_at', 'is', null)
      .gte('created_at', since)
      .limit(200),
  ])

  const all = [
    ...((contacts.data as { created_at: string; admin_validated_at: string }[] | null) ?? []),
    ...((visites.data as { created_at: string; admin_validated_at: string }[] | null) ?? []),
    ...((reservations.data as { created_at: string; admin_validated_at: string }[] | null) ?? []),
  ]

  if (all.length < 3) {
    // Pas assez de données pour une moyenne fiable → affiche l'objectif
    return { label: '< 1h', hint: 'goal' }
  }

  const deltas = all
    .map((r) => {
      const a = new Date(r.created_at).getTime()
      const b = new Date(r.admin_validated_at).getTime()
      return isNaN(a) || isNaN(b) ? null : (b - a) / 60000 // minutes
    })
    .filter((v): v is number => v !== null && v > 0)

  if (deltas.length < 3) return { label: '< 1h', hint: 'goal' }

  const avg = deltas.reduce((s, x) => s + x, 0) / deltas.length
  return { label: formatDelay(avg), hint: 'live' }
}

/**
 * Bandeau de chiffres clés — preuves de valeur tangibles.
 * Server component qui fetch les vraies métriques temps réel.
 *
 * Quatre stats visibles :
 *   • Biens vérifiés (table biens)
 *   • Offres flash actives (table locaux)
 *   • Communes couvertes
 *   • Délai moyen de réponse (statique pour l'instant — 1h)
 */
export async function StatsRibbon() {
  const supabase = await createClient()
  const locaux = createLocauxClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const biensQ = (supabase as any)
    .from('biens')
    .select('id, commune', { count: 'exact' })
    .eq('statut', 'publie')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flashQ = (locaux as any)
    .from('locaux')
    .select('id, commune', { count: 'exact' })
    .eq('status', 'active')
    .eq('is_duplicate', false)

  const [biensRes, flashRes, delay] = await Promise.all([
    biensQ,
    flashQ,
    computeAdvisorResponseDelay(supabase),
  ])

  const biensCount = biensRes?.count ?? 0
  const flashCount = flashRes?.count ?? 0

  // Communes uniques (union des deux sources)
  const communes = new Set<string>()
  for (const row of (biensRes?.data ?? []) as { commune?: string | null }[]) {
    if (row.commune) communes.add(row.commune.trim().toLowerCase())
  }
  for (const row of (flashRes?.data ?? []) as { commune?: string | null }[]) {
    if (row.commune) communes.add(row.commune.trim().toLowerCase())
  }
  const communesCount = communes.size

  const stats = [
    {
      icon: ShieldCheck,
      value: biensCount,
      label: 'Biens vérifiés',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: Flame,
      value: flashCount,
      label: 'Offres flash actives',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      icon: MapPin,
      value: communesCount,
      label: 'Communes couvertes',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: Clock,
      value: delay.label,
      label: delay.hint === 'live' ? 'Réponse moyenne (30j)' : 'Objectif réponse',
      color: 'text-[var(--accent-luxury)]',
      bg: 'bg-accent-luxury/10',
      isLiteral: true,
    },
  ] as const

  return (
    <section className="relative py-10 md:py-14 bg-[var(--background)] overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border)] hover:border-accent-luxury/30 transition-colors"
            >
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
                <s.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="font-display text-2xl md:text-3xl font-black text-[var(--text)] tabular-nums leading-none mb-1">
                  {'isLiteral' in s && s.isLiteral
                    ? s.value
                    : typeof s.value === 'number'
                      ? s.value.toLocaleString('fr-FR')
                      : s.value}
                </p>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
