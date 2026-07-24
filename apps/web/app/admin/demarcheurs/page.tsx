import { Megaphone, MapPin, Calendar, CheckCircle2, MessageCircle, Building2 } from 'lucide-react'
import { getTopDemarcheurs, normalizePhone } from '@/lib/locaux/demarcheurs'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * Page admin Démarcheurs — classe les numéros ayant publié le plus d'offres
 * flash scrapées, pour les contacter et les convertir en comptes plateforme.
 */

const ONBOARDING_MSG =
  "Bonjour, ici l'équipe BOGBE'S GROUPE. Nous remarquons que vous proposez régulièrement des biens immobiliers. " +
  'Créez votre compte gratuit et publiez vos biens directement sur notre plateforme pour plus de visibilité et un meilleur suivi : ' +
  'https://www.bogbesgroup.com/register'

function fmtPhone(p: string): string {
  // Affichage lisible : groupes de 2
  return p.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
}

export default async function AdminDemarcheursPage() {
  const top = await getTopDemarcheurs(60)

  // Marquer ceux qui ont DÉJÀ un compte (ne pas les recontacter)
  const registered = new Set<string>()
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profs } = await (admin as any).from('profiles').select('phone').not('phone', 'is', null)
    for (const p of (profs ?? []) as { phone: string | null }[]) {
      const n = normalizePhone(p.phone)
      if (n) registered.add(n)
    }
  } catch {
    /* best-effort */
  }

  const totalOffres = top.reduce((s, d) => s + d.count, 0)
  const dejaInscrits = top.filter((d) => registered.has(d.phone)).length

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <Megaphone className="w-5 h-5 text-[var(--accent-luxury)]" />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)]">
            Démarcheurs à recruter
          </h1>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Numéros ayant publié le plus d&apos;offres flash. Contactez-les pour qu&apos;ils créent un compte
          et publient directement sur la plateforme. Classement rafraîchi toutes les 30 min.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="px-4 py-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border)]">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">Top affichés</p>
          <p className="font-display text-3xl font-black text-[var(--text)] tabular-nums mt-1">{top.length}</p>
        </div>
        <div className="px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Offres cumulées</p>
          <p className="font-display text-3xl font-black text-orange-600 tabular-nums mt-1">{totalOffres.toLocaleString('fr-FR')}</p>
        </div>
        <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Déjà inscrits</p>
          <p className="font-display text-3xl font-black text-emerald-600 tabular-nums mt-1">{dejaInscrits}</p>
        </div>
      </div>

      {top.length === 0 ? (
        <div className="bg-[var(--surface-card)] rounded-2xl p-12 border border-[var(--border)] text-center">
          <p className="text-[var(--text-muted)] text-sm">Aucune donnée démarcheur disponible.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {top.map((d, i) => {
            const inscrit = registered.has(d.phone)
            const waLink = `https://wa.me/225${d.phone}?text=${encodeURIComponent(ONBOARDING_MSG)}`
            const last = d.lastDate
              ? new Date(d.lastDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
              : '—'
            return (
              <div
                key={d.phone}
                className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2"
              >
                <span className="w-7 h-7 shrink-0 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-xs font-black text-[var(--text-muted)] tabular-nums">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[var(--text)] text-sm truncate">{d.name || 'Démarcheur'}</span>
                    {inscrit && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Déjà inscrit
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">+225 {fmtPhone(d.phone)}</p>
                  <p className="text-[11px] text-[var(--text-subtle)] flex items-center gap-3 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{d.communes.slice(0, 3).join(', ') || '—'}</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />Dernière : {last}</span>
                  </p>
                </div>
                <div className="text-center shrink-0">
                  <p className="font-display text-2xl font-black text-orange-600 tabular-nums leading-none">{d.count}</p>
                  <p className="text-[10px] text-[var(--text-subtle)] uppercase tracking-wide">offres</p>
                </div>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                    inscrit
                      ? 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:bg-[var(--border)]'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Contacter
                </a>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[11px] text-[var(--text-subtle)] mt-6 flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5" />
        Classé par numéro de contact de l&apos;offre. Un même démarcheur peut apparaître sous 2 numéros (ancien
        format 8 chiffres / nouveau 10 chiffres).
      </p>
    </main>
  )
}
