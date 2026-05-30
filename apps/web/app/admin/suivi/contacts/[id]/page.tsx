import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  ArrowLeft, Phone, MessageCircle, Mail, Home, Flame, CheckCircle2,
  XCircle, Clock, User, AlertTriangle, MapPin, ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateContactAction } from '@/app/admin/suivi/actions'

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
      cls: 'bg-amber-100 text-amber-700 border-amber-200',
      Icon: Clock,
    },
    approved: {
      label: 'Approuvée',
      cls: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      Icon: CheckCircle2,
    },
    rejected: {
      label: 'Refusée',
      cls: 'bg-red-100 text-red-700 border-red-200',
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

function waLink(phone: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}`
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
  const ownerPhone = isFlash ? req.flash_owner_phone : null
  // For web source, owner phone is on profiles (loaded separately if needed by actions)

  const visitorWa = waLink(req.visitor_phone)
  const ownerWa = waLink(ownerPhone)

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
            <StatusBadge status={req.admin_validation_status} />
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
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <a href={`tel:${req.visitor_phone}`} className="text-[var(--text)] font-mono hover:underline">
                      {req.visitor_phone}
                    </a>
                    {visitorWa && (
                      <a
                        href={visitorWa}
                        target="_blank" rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                )}
                {req.visitor_email && (
                  <div className="flex items-center gap-2 text-sm">
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

            {/* Propriétaire */}
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-3 flex items-center gap-2">
                <Home className="w-3.5 h-3.5" />
                Propriétaire {isFlash && <span className="text-orange-500">(scrapé WhatsApp)</span>}
              </h2>
              {isFlash ? (
                ownerPhone ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Ce propriétaire n&apos;est pas inscrit sur la plateforme. Contacte-le directement
                        pour confirmer la disponibilité et organiser une visite.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-orange-600" />
                      <a href={`tel:${ownerPhone}`} className="text-[var(--text)] font-mono hover:underline">
                        {ownerPhone}
                      </a>
                      {ownerWa && (
                        <a
                          href={ownerWa}
                          target="_blank" rel="noopener noreferrer"
                          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp proprio
                        </a>
                      )}
                    </div>
                    {req.locaux_id != null && (
                      <Link
                        href={`/offre-flash/${req.locaux_id}`}
                        className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Voir l&apos;offre flash
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)] italic">
                    Aucun numéro propriétaire enregistré pour cette offre.
                  </p>
                )
              ) : req.biens?.id ? (
                <Link
                  href={`/biens/${req.biens.id}`}
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--text)] hover:text-[var(--text)]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Voir le bien
                </Link>
              ) : (
                <p className="text-sm text-[var(--text-muted)] italic">Bien introuvable</p>
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
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface-card)] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      name="action"
                      value="approve"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approuver
                    </button>
                    <button
                      type="submit"
                      name="action"
                      value="reject"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition"
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
