import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  ArrowLeft, Phone, MessageCircle, Mail, Home, Flame, CheckCircle2,
  XCircle, Clock, User, AlertTriangle, MapPin, ExternalLink, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateContactAction } from '@/app/admin/suivi/actions'
import { whatsappLink } from '@/lib/whatsapp'
import { formatFCFA } from '@/lib/format'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

interface ContactRow {
  id: string
  source: 'web' | 'whatsapp' | 'flash'
  admin_validation_status: 'pending' | 'approved' | 'rejected'
  admin_validated_at: string | null
  admin_note: string | null
  admin_notified_at: string | null
  visitor_notified_at: string | null
  owner_notified_at: string | null
  visitor_name: string | null
  visitor_phone: string | null
  visitor_email: string | null
  reason: string | null
  created_at: string
  // Source 'web' : bien interne
  bien_id: string | null
  proprietaire_id: string | null
  biens: { id: string; titre: string; commune: string | null; quartier: string | null } | null
  // Source 'flash' : offre scrapée
  locaux_id: number | null
  flash_owner_phone: string | null
  flash_titre: string | null
}

function StatusBadge({ status }: { status: ContactRow['admin_validation_status'] }) {
  const map = {
    pending: {
      label: 'En attente',
      cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      Icon: Clock,
    },
    approved: {
      label: 'Approuvée',
      cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      Icon: CheckCircle2,
    },
    rejected: {
      label: 'Refusée',
      cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      Icon: XCircle,
    },
  }
  const s = map[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${s.cls}`}>
      <s.Icon className="w-3.5 h-3.5" />
      {s.label}
    </span>
  )
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params

  // Auth + admin guard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/admin/suivi/contacts/${id}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') notFound()

  // Fetch contact request via service role
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (admin as any)
    .from('contact_requests')
    .select(`
      id, source, admin_validation_status, admin_validated_at, admin_note,
      admin_notified_at, visitor_notified_at, owner_notified_at,
      visitor_name, visitor_phone, visitor_email, reason, created_at,
      bien_id, proprietaire_id,
      locaux_id, flash_owner_phone, flash_titre,
      biens ( id, titre, commune, quartier )
    `)
    .eq('id', id)
    .maybeSingle()

  if (!row) notFound()
  const req = row as ContactRow

  const isFlash = req.source === 'flash'
  const titre = isFlash ? (req.flash_titre ?? 'Offre flash') : (req.biens?.titre ?? 'Bien')
  const lieu = req.biens?.commune
    ? [req.biens.quartier, req.biens.commune].filter(Boolean).join(' · ')
    : null

  // Propriétaire : flash → numéro scrapé ; web → profil du proprio inscrit
  // (chargé ici pour que l'admin voie le numéro et le joigne en 1 tap).
  let ownerName: string | null = null
  let ownerPhone: string | null = null
  if (isFlash) {
    ownerPhone = req.flash_owner_phone
  } else if (req.proprietaire_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: owner } = await (admin as any)
      .from('profiles')
      .select('full_name, phone')
      .eq('id', req.proprietaire_id)
      .single()
    ownerName = owner?.full_name ?? null
    ownerPhone = owner?.phone ?? null
  }

  const visitorWa = whatsappLink(req.visitor_phone)
  const ownerWa = whatsappLink(ownerPhone)

  // CRM Prospect lookup (enrichissement automatique si prospect connu)
  let prospect: {
    id: string
    nom: string | null
    statut: string
    contact_type?: string | null
    budget?: number | null
    commune?: string | null
    quartier?: string | null
    type_bien?: string | null
    dernier_message?: string | null
  } | null = null

  if (req.visitor_phone) {
    const rawDigits = req.visitor_phone.replace(/\D/g, '')
    const digits = rawDigits.startsWith('225') ? rawDigits.slice(3) : rawDigits
    const { data: foundProspect } = await (admin as any)
      .from('prospects')
      .select('id, nom, statut, contact_type, budget, commune, quartier, type_bien, dernier_message')
      .or(`phone.ilike.%${digits}%,phone.ilike.%${rawDigits}%`)
      .limit(1)
      .maybeSingle()

    if (foundProspect) {
      prospect = foundProspect
    }
  }

  // Ancienneté (respect du prospect : ne pas laisser traîner une demande)
  const pending = req.admin_validation_status === 'pending'
  const ageH = Math.floor((Date.now() - new Date(req.created_at).getTime()) / 3_600_000)

  return (
    <main className="min-h-screen bg-[var(--surface-hover)]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/suivi?tab=contacts"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au suivi
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-subtle)] font-bold mb-1">
                Demande de contact · {isFlash ? '⚡ Offre flash' : '✓ Bien vérifié'}
              </p>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-[var(--text)]">
                {titre}
              </h1>
              {lieu && (
                <p className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {lieu}
                </p>
              )}
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <StatusBadge status={req.admin_validation_status} />
              {pending && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    ageH >= 6
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : ageH >= 2
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {ageH < 1 ? "Reçue à l'instant" : `En attente depuis ${ageH} h`}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-5">
            {/* Visiteur */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3 flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                Visiteur
              </h2>
              <div className="space-y-2">
                <p className="text-lg font-bold text-[var(--text)]">{req.visitor_name || '—'}</p>
                {req.visitor_phone && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <a href={`tel:${req.visitor_phone}`} className="text-[var(--text)] font-mono hover:underline">
                      {req.visitor_phone}
                    </a>
                    {visitorWa && (
                      <a
                        href={visitorWa}
                        target="_blank" rel="noopener noreferrer"
                        className="ml-0 sm:ml-auto min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-sm font-black rounded-xl shadow-sm transition-all active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                )}
                {req.visitor_email && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-[var(--text-subtle)]" />
                    <a href={`mailto:${req.visitor_email}`} className="text-[var(--text)] hover:underline">
                      {req.visitor_email}
                    </a>
                  </div>
                )}
                {req.reason && (
                  <div className="pt-3 mt-3 border-t border-[var(--border)]">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--text-subtle)] font-bold mb-1.5">
                      Message
                    </p>
                    <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                      {req.reason}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Qualification CRM & Sapphire */}
            {prospect && (
              <section className="bg-gradient-to-br from-amber-500/10 via-[var(--surface-card)] to-purple-500/10 rounded-2xl border border-[var(--border)] p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                      Qualification CRM &amp; Sapphire AI
                    </h2>
                  </div>
                  <Link
                    href={`/admin/prospects/${prospect.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] transition-colors shadow-sm"
                  >
                    Voir fiche CRM complète →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div className="bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)]">
                    <p className="text-[10px] font-bold text-[var(--text-subtle)] uppercase">Budget exprimé</p>
                    <p className="text-sm font-bold text-[var(--text)] mt-0.5">
                      {prospect.budget ? formatFCFA(prospect.budget) : 'Non précisé'}
                    </p>
                  </div>
                  <div className="bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)]">
                    <p className="text-[10px] font-bold text-[var(--text-subtle)] uppercase">Recherche ciblée</p>
                    <p className="text-sm font-bold text-[var(--text)] mt-0.5 truncate">
                      {[prospect.type_bien, prospect.commune, prospect.quartier].filter(Boolean).join(' · ') || 'Critères libres'}
                    </p>
                  </div>
                  <div className="bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)]">
                    <p className="text-[10px] font-bold text-[var(--text-subtle)] uppercase">Nature &amp; Statut</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        prospect.contact_type === 'agent' ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {prospect.contact_type === 'agent' ? 'Agent démarcheur' : 'Client direct'}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-medium capitalize">
                        · {prospect.statut.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {prospect.dernier_message && (
                  <div className="bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)] text-xs text-[var(--text-muted)]">
                    <p className="font-bold text-[var(--text)] mb-1 flex items-center gap-1 text-[11px]">
                      <MessageCircle className="w-3 h-3 text-emerald-600" /> Dernier échange Sapphire :
                    </p>
                    <p className="italic line-clamp-3">« {prospect.dernier_message} »</p>
                  </div>
                )}
              </section>
            )}

            {/* Propriétaire */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3 flex items-center gap-2">
                <Home className="w-3.5 h-3.5" />
                Propriétaire {isFlash && <span className="text-amber-400">(scrapé WhatsApp)</span>}
              </h2>
              {ownerPhone ? (
                <div className="space-y-3">
                  {isFlash && (
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-300 leading-relaxed font-medium">
                        Ce propriétaire n&apos;est pas inscrit sur la plateforme. Contactez-le directement
                        pour confirmer la disponibilité et organiser une visite.
                      </p>
                    </div>
                  )}
                  {ownerName && <p className="text-lg font-bold text-[var(--text)]">{ownerName}</p>}
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className={`w-4 h-4 ${isFlash ? 'text-amber-400' : 'text-emerald-400'}`} />
                    <a href={`tel:${ownerPhone}`} className="text-[var(--text)] font-mono hover:underline">
                      {ownerPhone}
                    </a>
                    {ownerWa && (
                      <a
                        href={ownerWa}
                        target="_blank" rel="noopener noreferrer"
                        className="ml-0 sm:ml-auto min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-sm font-black rounded-xl shadow-sm transition-all active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp proprio
                      </a>
                    )}
                  </div>
                  {isFlash && req.locaux_id != null && (
                    <Link
                      href={`/offre-flash/${req.locaux_id}`}
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Voir l&apos;offre flash
                    </Link>
                  )}
                  {!isFlash && req.biens?.id && (
                    <Link
                      href={`/biens/${req.biens.id}`}
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Voir le bien
                    </Link>
                  )}
                </div>
              ) : !isFlash && req.biens?.id ? (
                <Link
                  href={`/biens/${req.biens.id}`}
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--text)] hover:text-[var(--text)]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Voir le bien (numéro proprio non renseigné)
                </Link>
              ) : (
                <p className="text-sm text-[var(--text-muted)] italic">
                  Aucun numéro propriétaire enregistré.
                </p>
              )}
            </section>

            {/* Actions admin (uniquement si pending) */}
            {req.admin_validation_status === 'pending' && (
              <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3">
                  Décision admin
                </h2>
                <p className="text-sm text-[var(--text-muted)] mb-4 leading-relaxed">
                  {isFlash
                    ? 'En approuvant, le visiteur recevra une confirmation. (Le proprio scrapé n&apos;est pas notifié automatiquement — contacte-le à la main.)'
                    : 'En approuvant, le visiteur recevra les coordonnées du propriétaire et celui-ci sera informé.'}
                </p>
                <form action={validateContactAction} className="space-y-3">
                  <input type="hidden" name="contactId" value={req.id} />
                  <textarea
                    name="note"
                    rows={2}
                    maxLength={500}
                    placeholder="Note interne (optionnelle)"
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent-luxury)]/60 resize-none transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      name="action"
                      value="approve"
                      className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black shadow-md transition-all active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approuver
                    </button>
                    <button
                      type="submit"
                      name="action"
                      value="reject"
                      className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                    >
                      <XCircle className="w-4 h-4" />
                      Refuser
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* Notes admin (si déjà validé) */}
            {req.admin_validation_status !== 'pending' && req.admin_note && (
              <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-2">
                  Note admin
                </h2>
                <p className="text-sm text-[var(--text)] italic whitespace-pre-wrap">{req.admin_note}</p>
              </section>
            )}
          </div>

          {/* Sidebar : métadonnées */}
          <aside className="space-y-4">
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3">
                Métadonnées
              </h2>
              <dl className="space-y-2.5 text-xs">
                <div>
                  <dt className="text-[var(--text-subtle)]">Référence</dt>
                  <dd className="font-mono text-[var(--text)] mt-0.5">#{req.id.slice(0, 8)}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-subtle)]">Source</dt>
                  <dd className="text-[var(--text)] mt-0.5 flex items-center gap-1.5">
                    {isFlash && <Flame className="w-3 h-3 text-orange-500" />}
                    {req.source}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--text-subtle)]">Créée le</dt>
                  <dd className="text-[var(--text)] mt-0.5">{formatDateTime(req.created_at)}</dd>
                </div>
                {req.admin_validated_at && (
                  <div>
                    <dt className="text-[var(--text-subtle)]">Validée le</dt>
                    <dd className="text-[var(--text)] mt-0.5">{formatDateTime(req.admin_validated_at)}</dd>
                  </div>
                )}
                {req.admin_notified_at && (
                  <div>
                    <dt className="text-[var(--text-subtle)]">Admin notifié</dt>
                    <dd className="text-[var(--text)] mt-0.5">{formatDateTime(req.admin_notified_at)}</dd>
                  </div>
                )}
                {req.visitor_notified_at && (
                  <div>
                    <dt className="text-[var(--text-subtle)]">Visiteur notifié</dt>
                    <dd className="text-[var(--text)] mt-0.5">{formatDateTime(req.visitor_notified_at)}</dd>
                  </div>
                )}
                {req.owner_notified_at && (
                  <div>
                    <dt className="text-[var(--text-subtle)]">Proprio notifié</dt>
                    <dd className="text-[var(--text)] mt-0.5">{formatDateTime(req.owner_notified_at)}</dd>
                  </div>
                )}
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
