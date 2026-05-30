import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AgenceCreateForm } from '@/components/agences/AgenceCreateForm'
import { AgenceEditForm } from '@/components/agences/AgenceEditForm'
import type { Agence, AgenceKycStatut, AgenceRole } from '@/lib/agences/types'

function KycBadge({ statut }: { statut: AgenceKycStatut }) {
  const config = {
    en_attente: { label: 'En attente de validation', cls: 'bg-warning/10 text-warning border-warning/30' },
    verifie: { label: 'Agence vérifiée', cls: 'bg-accent/10 text-accent border-accent/30' },
    rejete: { label: 'Validation refusée', cls: 'bg-danger/10 text-danger border-danger/30' },
  }
  const cfg = config[statut] ?? config.en_attente
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill border text-xs font-sans font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export default async function AgencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('agence_id, agence_role')
    .eq('id', user.id)
    .single()

  const agenceId: string | null = profile?.agence_id ?? null
  const agenceRole: AgenceRole | null = profile?.agence_role ?? null

  // Cas 1 : pas encore d'agence → formulaire de création
  if (!agenceId) {
    return (
      <main className="bg-surface min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <header>
            <h1 className="font-display text-3xl text-[var(--text)]">Créer mon agence</h1>
            <p className="text-sm text-muted font-sans mt-2">
              Donne une identité à ton agence : nom commercial, description, coordonnées publiques.
              Après création, notre équipe valide ton dossier (RCCM) pour activer la vitrine publique.
            </p>
          </header>

          <section className="bg-[var(--surface-card)] rounded-card shadow-card p-6">
            <AgenceCreateForm />
          </section>

          <aside className="bg-[var(--surface-card)] border border-[var(--border)] rounded-card p-4 text-sm font-sans text-muted">
            <strong className="text-[var(--text)]">À savoir</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Tu deviens automatiquement administrateur de ton agence</li>
              <li>Tu peux inviter d&apos;autres agents plus tard</li>
              <li>Tes biens existants ne sont pas rattachés automatiquement — tu choisis lesquels associer</li>
              <li>La vitrine publique <span className="font-mono text-xs">/agences/&lt;slug&gt;</span> s&apos;active après validation KYC</li>
            </ul>
          </aside>
        </div>
      </main>
    )
  }

  // Cas 2 : agence existante → settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agence } = await (supabase as any)
    .from('agences')
    .select('*')
    .eq('id', agenceId)
    .single()

  if (!agence) {
    redirect('/dashboard')
  }

  const a = agence as Agence

  // Compteurs de biens et membres
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ count: biensCount }, { count: membresCount }] = await Promise.all([
    (supabase as any).from('biens').select('id', { count: 'exact', head: true }).eq('agence_id', a.id),
    (supabase as any).from('profiles').select('id', { count: 'exact', head: true }).eq('agence_id', a.id),
  ])

  return (
    <main className="bg-surface min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl text-[var(--text)]">{a.nom_commercial}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <KycBadge statut={a.kyc_statut} />
              {a.kyc_statut === 'verifie' && (
                <Link
                  href={`/agences/${a.slug}`}
                  className="text-xs font-sans text-[var(--accent-luxury)] hover:underline"
                >
                  Voir la vitrine publique →
                </Link>
              )}
            </div>
          </div>
          {agenceRole && (
            <span className="text-xs font-sans uppercase tracking-wide text-muted">
              Ton rôle : <strong className="text-[var(--text)]">{agenceRole}</strong>
            </span>
          )}
        </header>

        {a.kyc_statut === 'en_attente' && (
          <div className="bg-warning/5 border border-warning/30 rounded-card p-4 text-sm font-sans text-warning">
            ⏳ Ton agence est créée mais pas encore visible publiquement. Notre équipe vérifie ton RCCM —
            réponse sous 2-3 jours ouvrés. Tu peux dès maintenant ajouter tes biens et préparer ton profil.
          </div>
        )}

        {a.kyc_statut === 'rejete' && (
          <div className="bg-danger/5 border border-danger/30 rounded-card p-4 text-sm font-sans text-danger">
            ❌ Validation refusée. Contacte le support pour comprendre les motifs et resoumettre ton dossier.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Biens rattachés" value={biensCount ?? 0} />
          <StatCard label="Membres" value={membresCount ?? 0} />
        </div>

        <section className="bg-[var(--surface-card)] rounded-card shadow-card p-6 space-y-4">
          <h2 className="font-display text-xl text-[var(--text)]">Profil de l&apos;agence</h2>
          {agenceRole === 'admin' ? (
            <AgenceEditForm agence={a} />
          ) : (
            <p className="text-sm text-muted font-sans">
              Seul l&apos;administrateur de l&apos;agence peut modifier le profil.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[var(--surface-card)] rounded-card border border-[var(--border)] p-4">
      <p className="text-xs font-sans text-muted uppercase tracking-wide">{label}</p>
      <p className="font-display text-2xl text-[var(--text)] mt-1">{value}</p>
    </div>
  )
}
