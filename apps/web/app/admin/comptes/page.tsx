import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { KycInlineActions } from './KycInlineActions'
import {
  Users, Building2, KeyRound, Home, ShieldCheck, Search, Phone, Mail,
  MessageCircle, Gift, Fingerprint, Calendar, BadgeCheck,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

/**
 * Page admin Comptes — liste TOUS les comptes (propriétaires, agences,
 * locataires, admins) avec le DÉTAIL COMPLET et les PRIVILÈGES de chacun
 * (rôle global + rôle agence, KYC + pièces, parrainage, WhatsApp, dates).
 * Chaque compte est dépliable pour voir toutes ses infos.
 *
 * Accès limité par AdminLayout (role='admin' → accès complet aux 9 modules).
 */

const ROLE_LABELS: Record<string, string> = {
  proprietaire: 'Propriétaire',
  agence: 'Agence',
  locataire: 'Locataire',
  admin: 'Admin',
}

const ROLE_BADGE: Record<string, string> = {
  proprietaire: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  agence: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  locataire: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  admin: 'bg-red-500/10 text-red-700 border-red-500/20',
}

const KYC_BADGE: Record<string, { label: string; cls: string }> = {
  verifie: { label: 'KYC vérifié', cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  en_cours: { label: 'KYC à valider', cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  rejete: { label: 'KYC rejeté', cls: 'bg-red-500/10 text-red-700 border-red-500/20' },
}

/** Description en clair des privilèges d'un compte. */
function privilegesText(role: string | null, agenceRole: string | null): string {
  if (role === 'admin') return 'Admin — accès complet à tous les modules de la console'
  if (role === 'agence') return `Agence${agenceRole ? ` · rôle « ${agenceRole} »` : ''} — publie et gère les biens de son agence`
  if (role === 'proprietaire') return 'Propriétaire — publie et gère ses propres biens'
  if (role === 'locataire') return 'Locataire — recherche, réservations, favoris'
  return role || '—'
}

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: string | null
  kyc_statut: string | null
  kyc_cni_url: string | null
  kyc_selfie_url: string | null
  created_at: string
  updated_at: string | null
  fcm_token: string | null
  code_parrainage: string | null
  parrain_id: string | null
  whatsapp_jid: string | null
  agence_id: string | null
  agence_role: string | null
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

/** Une ligne clé/valeur dans la fiche dépliée. */
function Field({ icon: Icon, label, children }: { icon?: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] inline-flex items-center gap-1">
        {Icon ? <Icon className="w-3 h-3" /> : null} {label}
      </p>
      <div className="text-sm text-[var(--text)] break-words mt-0.5">{children || '—'}</div>
    </div>
  )
}

interface PageProps {
  searchParams: Promise<{ role?: string; q?: string }>
}

export default async function AdminComptesPage({ searchParams }: PageProps) {
  const { role: roleFilter, q } = await searchParams
  const query = (q ?? '').trim()
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sel = (supabase as any)
    .from('profiles')
    .select('id, email, full_name, phone, avatar_url, role, kyc_statut, kyc_cni_url, kyc_selfie_url, created_at, updated_at, fcm_token, code_parrainage, parrain_id, whatsapp_jid, agence_id, agence_role')
    .order('created_at', { ascending: false })
    .limit(300)
  if (roleFilter && ROLE_LABELS[roleFilter]) sel = sel.eq('role', roleFilter)
  if (query) sel = sel.or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
  const { data: rows } = await sel
  const profiles = (rows ?? []) as Profile[]

  // Détail des biens par compte
  interface UserBienSummary {
    id: string
    proprietaire_id: string | null
    titre: string
    type_bien: string | null
    statut: string
    commune: string | null
    quartier: string | null
    prix_mois_fcfa: number | null
    prix_vente_fcfa: number | null
    created_at: string
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biensRaw } = await (supabase as any)
    .from('biens')
    .select('id, proprietaire_id, titre, type_bien, statut, commune, quartier, prix_mois_fcfa, prix_vente_fcfa, created_at')
    .order('created_at', { ascending: false })

  const biensByUser = new Map<string, UserBienSummary[]>()
  for (const b of (biensRaw ?? []) as UserBienSummary[]) {
    if (b.proprietaire_id) {
      const list = biensByUser.get(b.proprietaire_id) || []
      list.push(b)
      biensByUser.set(b.proprietaire_id, list)
    }
  }

  // Noms des agences rattachées
  const agenceIds = Array.from(new Set(profiles.map((p) => p.agence_id).filter(Boolean))) as string[]
  const agenceName = new Map<string, string>()
  if (agenceIds.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ags } = await (supabase as any).from('agences').select('id, nom_commercial').in('id', agenceIds)
    for (const a of (ags ?? []) as { id: string; nom_commercial: string | null }[]) agenceName.set(a.id, a.nom_commercial || a.id)
  }

  // Noms des parrains
  const parrainIds = Array.from(new Set(profiles.map((p) => p.parrain_id).filter(Boolean))) as string[]
  const parrainName = new Map<string, string>()
  if (parrainIds.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ps } = await (supabase as any).from('profiles').select('id, full_name').in('id', parrainIds)
    for (const pp of (ps ?? []) as { id: string; full_name: string | null }[]) parrainName.set(pp.id, pp.full_name || pp.id)
  }

  const now = Date.now()
  const isNew = (iso: string) => now - new Date(iso).getTime() < 7 * 24 * 3_600_000

  const stats = {
    total: profiles.length,
    proprietaires: profiles.filter((p) => p.role === 'proprietaire').length,
    agences: profiles.filter((p) => p.role === 'agence').length,
    admins: profiles.filter((p) => p.role === 'admin').length,
    nouveaux7j: profiles.filter((p) => isNew(p.created_at)).length,
  }

  const filters: Array<{ key: string | null; label: string }> = [
    { key: null, label: 'Tous' },
    { key: 'proprietaire', label: 'Propriétaires' },
    { key: 'agence', label: 'Agences' },
    { key: 'locataire', label: 'Locataires' },
    { key: 'admin', label: 'Admins' },
  ]
  const filterHref = (key: string | null) => {
    const p = new URLSearchParams()
    if (key) p.set('role', key)
    if (query) p.set('q', query)
    const s = p.toString()
    return s ? `/admin/comptes?${s}` : '/admin/comptes'
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 lg:py-10">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-[var(--accent-luxury)]" />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)]">Comptes</h1>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Tous les comptes avec le détail complet et les privilèges. Cliquez un compte pour tout voir.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="px-4 py-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border)]">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Affichés</p>
          <p className="font-display text-3xl font-black text-[var(--text)] tabular-nums mt-1">{stats.total}</p>
        </div>
        <div className="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 inline-flex items-center gap-1.5"><Home className="w-3.5 h-3.5" /> Propriétaires</p>
          <p className="font-display text-3xl font-black text-blue-600 tabular-nums mt-1">{stats.proprietaires}</p>
        </div>
        <div className="px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-700 inline-flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Agences</p>
          <p className="font-display text-3xl font-black text-purple-600 tabular-nums mt-1">{stats.agences}</p>
        </div>
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-xs font-bold uppercase tracking-wider text-red-700 inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Admins</p>
          <p className="font-display text-3xl font-black text-red-600 tabular-nums mt-1">{stats.admins}</p>
        </div>
        <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 inline-flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> Nouveaux (7 j)</p>
          <p className="font-display text-3xl font-black text-emerald-600 tabular-nums mt-1">{stats.nouveaux7j}</p>
        </div>
      </div>

      {/* Recherche */}
      <form className="mb-4">
        {roleFilter ? <input type="hidden" name="role" value={roleFilter} /> : null}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
          <input
            type="text" name="q" defaultValue={query}
            placeholder="Rechercher : nom, email ou téléphone…"
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-card)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-slate-400"
          />
        </div>
      </form>

      {/* Filtres par rôle */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {filters.map((f) => {
          const active = (roleFilter ?? null) === f.key || (!roleFilter && f.key === null)
          return (
            <Link key={f.label} href={filterHref(f.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                active ? 'bg-[var(--text)] text-[var(--surface-card)] border-[var(--text)]'
                       : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
              }`}>
              {f.label}
            </Link>
          )
        })}
      </div>

      {/* Liste */}
      {profiles.length === 0 ? (
        <div className="bg-[var(--surface-card)] rounded-2xl p-12 border border-[var(--border)] text-center">
          <p className="text-[var(--text-muted)] text-sm">Aucun compte pour ce filtre/recherche.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => {
            const kyc = p.kyc_statut ? KYC_BADGE[p.kyc_statut] : null
            const userBiens = biensByUser.get(p.id) ?? []
            const nBiens = userBiens.length
            const nPublies = userBiens.filter((b) => b.statut === 'publie').length
            const nEnAttente = userBiens.filter((b) => b.statut === 'en_attente').length
            const nBrouillons = userBiens.filter((b) => b.statut === 'brouillon').length
            const nRefuses = userBiens.filter((b) => b.statut === 'refuse').length

            const agence = p.agence_id ? agenceName.get(p.agence_id) : null
            const parrain = p.parrain_id ? parrainName.get(p.parrain_id) : null
            return (
              <details key={p.id} className="group bg-[var(--surface-card)] rounded-xl border border-[var(--border)] overflow-hidden">
                <summary className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 cursor-pointer list-none hover:bg-[var(--surface-hover)] transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[var(--text)] text-sm truncate">{p.full_name || '(sans nom)'}</span>
                      {isNew(p.created_at) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500 text-white">Nouveau</span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${ROLE_BADGE[p.role ?? ''] ?? ROLE_BADGE.locataire}`}>
                        {ROLE_LABELS[p.role ?? ''] ?? p.role ?? '—'}
                      </span>
                      {p.agence_role && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-purple-500/10 text-purple-700 border-purple-500/20 inline-flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" /> {p.agence_role}
                        </span>
                      )}
                      {kyc && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border inline-flex items-center gap-1 ${kyc.cls}`}>
                          <ShieldCheck className="w-3 h-3" /> {kyc.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{[p.email, p.phone].filter(Boolean).join(' · ') || '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {nBiens === 0 ? (
                      <p className="text-xs font-semibold text-[var(--text-subtle)]">0 bien</p>
                    ) : (
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {nPublies > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                            {nPublies} publié{nPublies > 1 ? 's' : ''}
                          </span>
                        )}
                        {nEnAttente > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                            {nEnAttente} à valider
                          </span>
                        )}
                        {nBrouillons > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-600 border border-slate-500/20">
                            {nBrouillons} brouillon{nBrouillons > 1 ? 's' : ''}
                          </span>
                        )}
                        {nRefuses > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-700 border border-red-500/20">
                            {nRefuses} refusé{nRefuses > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-[11px] text-[var(--text-subtle)] mt-0.5">Inscrit le {fmtDate(p.created_at)}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] group-open:hidden">Détails ▾</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] hidden group-open:inline">Réduire ▴</span>
                </summary>

                {/* Fiche complète */}
                <div className="px-4 pb-4 pt-1 border-t border-[var(--border)]">
                  {/* Privilèges — mis en avant */}
                  <div className="mt-3 mb-4 p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] inline-flex items-center gap-1 mb-1">
                      <Fingerprint className="w-3 h-3" /> Privilèges
                    </p>
                    <p className="text-sm font-semibold text-[var(--text)]">{privilegesText(p.role, p.agence_role)}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                    <Field icon={Mail} label="Email">{p.email}</Field>
                    <Field icon={Phone} label="Téléphone">{p.phone}</Field>
                    <Field icon={MessageCircle} label="WhatsApp (JID)">{p.whatsapp_jid}</Field>

                    <Field icon={ShieldCheck} label="Statut KYC">
                      {p.kyc_statut ? (KYC_BADGE[p.kyc_statut]?.label ?? p.kyc_statut) : 'Non soumis'}
                    </Field>
                    <Field icon={Building2} label="Agence">{agence || (p.agence_id ? p.agence_id : '—')}</Field>
                    <Field icon={BadgeCheck} label="Rôle dans l'agence">{p.agence_role}</Field>
                    <Field icon={Home} label="Biens enregistrés">
                      {nBiens > 0 ? (
                        <span>
                          <strong className="font-semibold">{nBiens}</strong> au total
                          {nPublies > 0 ? ` · ${nPublies} pub.` : ''}
                          {nEnAttente > 0 ? ` · ${nEnAttente} à valider` : ''}
                          {nBrouillons > 0 ? ` · ${nBrouillons} brouillon` : ''}
                        </span>
                      ) : (
                        '0 bien'
                      )}
                    </Field>

                    <Field icon={Gift} label="Code parrainage">{p.code_parrainage}</Field>
                    <Field icon={Gift} label="Parrainé par">{parrain || (p.parrain_id ? p.parrain_id : '—')}</Field>
                    <Field icon={BadgeCheck} label="Notifications push">{p.fcm_token ? 'Activées' : 'Non'}</Field>

                    <Field icon={Calendar} label="Inscrit le">{fmtDate(p.created_at)}</Field>
                    <Field icon={Calendar} label="Mis à jour le">{fmtDate(p.updated_at)}</Field>
                    <Field icon={Fingerprint} label="ID compte"><span className="font-mono text-xs">{p.id}</span></Field>
                  </div>

                  {/* Section Biens du compte avec statut et raccourcis */}
                  {userBiens.length > 0 && (
                    <div className="mt-4 p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]">
                      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text)] inline-flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-[var(--accent-luxury)]" /> Biens de ce compte ({userBiens.length})
                        </p>
                        {nEnAttente > 0 && (
                          <Link
                            href="/admin/validation"
                            className="text-xs font-bold text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-md transition-colors inline-flex items-center gap-1"
                          >
                            ⚡ {nEnAttente} en attente → Aller valider
                          </Link>
                        )}
                      </div>
                      <div className="space-y-2">
                        {userBiens.map((b) => {
                          const prix = b.prix_mois_fcfa
                            ? `${b.prix_mois_fcfa.toLocaleString('fr-FR')} FCFA/mois`
                            : b.prix_vente_fcfa
                              ? `${b.prix_vente_fcfa.toLocaleString('fr-FR')} FCFA (vente)`
                              : 'Prix non renseigné'
                          const loc = [b.commune, b.quartier].filter(Boolean).join(' · ') || 'Localisation non précisée'

                          const statutConfig: Record<string, { label: string; badge: string; hint?: string }> = {
                            publie: {
                              label: 'Publié en ligne',
                              badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
                            },
                            en_attente: {
                              label: 'En attente de validation',
                              badge: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
                              hint: 'Le propriétaire a soumis l\'annonce. Elle attend votre validation pour être visible sur le catalogue.',
                            },
                            brouillon: {
                              label: 'Brouillon non soumis',
                              badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
                              hint: 'L\'utilisateur a démarré la création mais n\'a pas encore cliqué sur « Publier l\'annonce » (Step 5 Médias). L\'annonce reste privée tant qu\'elle n\'est pas soumise.',
                            },
                            refuse: {
                              label: 'Refusé',
                              badge: 'bg-red-500/10 text-red-700 border-red-500/20',
                            },
                            archive: {
                              label: 'Archivé',
                              badge: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
                            },
                          }
                          const cfg = statutConfig[b.statut] || { label: b.statut, badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20' }

                          return (
                            <div
                              key={b.id}
                              className="p-3 bg-[var(--surface-card)] rounded-lg border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-[var(--text)] text-sm">{b.titre || 'Sans titre'}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${cfg.badge}`}>
                                    {cfg.label}
                                  </span>
                                  {b.type_bien && (
                                    <span className="text-[10px] text-[var(--text-subtle)] uppercase">({b.type_bien})</span>
                                  )}
                                </div>
                                <p className="text-[var(--text-muted)] mt-1">
                                  📍 {loc} • 💰 <span className="font-semibold text-[var(--text)]">{prix}</span>
                                </p>
                                {cfg.hint && (
                                  <p className="text-[11px] text-amber-700/90 italic mt-1.5 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
                                    ℹ️ {cfg.hint}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                {b.statut === 'publie' ? (
                                  <Link
                                    href={`/biens/${b.id}`}
                                    target="_blank"
                                    className="px-2.5 py-1.5 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                                  >
                                    Voir l&apos;annonce ↗
                                  </Link>
                                ) : b.statut === 'en_attente' ? (
                                  <Link
                                    href="/admin/validation"
                                    className="px-2.5 py-1.5 rounded-md bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors"
                                  >
                                    Valider le bien
                                  </Link>
                                ) : (
                                  <Link
                                    href="/admin/moderation"
                                    className="px-2.5 py-1.5 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
                                  >
                                    Modération
                                  </Link>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Vérification KYC — valider/rejeter directement (pièces via liens signés) */}
                  {(p.kyc_cni_url || p.kyc_selfie_url || p.kyc_statut === 'en_cours') && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 inline-flex items-center gap-1 mb-2">
                        <ShieldCheck className="w-3 h-3" /> Vérification KYC
                      </p>
                      <KycInlineActions userId={p.id} cniPath={p.kyc_cni_url} selfiePath={p.kyc_selfie_url} statut={p.kyc_statut} />
                    </div>
                  )}
                </div>
              </details>
            )
          })}
        </div>
      )}
    </main>
  )
}
