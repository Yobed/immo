import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  ArrowLeft, ShieldCheck, Phone, Calendar, MapPin, User,
  CheckCircle2, XCircle, MessageCircle, Home, Wallet,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatFCFA } from '@/lib/format'
import { validateReservationAction } from '../../actions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

interface NotifLog {
  id: string
  to_phone: string
  recipient_role: string
  template: string
  status: string
  error_message: string | null
  sent_at: string | null
  created_at: string
}

function formatDateFR(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function adminBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  }
  const labels: Record<string, string> = {
    pending: 'En attente de validation',
    approved: 'Validée',
    rejected: 'Refusée',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${map[status] ?? map.pending}`}>
      {labels[status] ?? status}
    </span>
  )
}

function whatsappLink(phone: string | null | undefined) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}`
}

function diffDays(d1: string, d2: string): number {
  return Math.ceil((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000)
}

export default async function ReservationDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/admin/suivi/reservations/${id}`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') notFound()

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reservation } = await (admin as any)
    .from('reservations')
    .select(`
      id, date_debut, date_fin, statut, notes,
      montant_loyer_fcfa, montant_total_fcfa, charges_fcfa, depot_garantie_fcfa, commission_fcfa,
      admin_validation_status, admin_validated_at, admin_note,
      admin_notified_at, owner_notified_at, visitor_notified_at,
      created_at, bien_id,
      biens ( id, titre, commune, quartier ),
      locataire:profiles!reservations_locataire_id_fkey ( id, full_name, phone, email ),
      proprietaire:profiles!reservations_proprietaire_id_fkey ( id, full_name, phone, email )
    `)
    .eq('id', id)
    .single()

  if (!reservation) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: notifs } = await (admin as any)
    .from('whatsapp_notifications')
    .select('id, to_phone, recipient_role, template, status, error_message, sent_at, created_at')
    .eq('related_type', 'reservation')
    .eq('related_id', id)
    .order('created_at', { ascending: true })

  const notifLogs = (notifs ?? []) as NotifLog[]

  const visitorName = reservation.locataire?.full_name || 'Visiteur'
  const visitorPhone = reservation.locataire?.phone || null
  const ownerName = reservation.proprietaire?.full_name || '—'
  const ownerPhone = reservation.proprietaire?.phone || null

  const isPending = reservation.admin_validation_status === 'pending'
  const nbJours = diffDays(reservation.date_debut, reservation.date_fin)

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/admin/suivi?tab=reservations" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Retour suivi
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-700" />
            <span className="font-bold text-slate-900 text-sm">Réservation #{id.slice(0, 8)}</span>
            {adminBadge(reservation.admin_validation_status)}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Bien */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-2">
              <Home className="w-4 h-4" /> Bien concerné
            </h2>
            <h3 className="font-bold text-slate-900 text-lg">{reservation.biens?.titre || 'Bien sans titre'}</h3>
            <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {reservation.biens?.commune || '—'}
              {reservation.biens?.quartier && ` · ${reservation.biens.quartier}`}
            </p>
            {reservation.bien_id && (
              <Link href={`/biens/${reservation.bien_id}`} target="_blank" className="mt-3 inline-block text-sm font-bold text-slate-700 hover:text-slate-900 underline">
                Voir la fiche →
              </Link>
            )}
          </section>

          {/* Visiteur */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Visiteur
            </h2>
            <p className="font-bold text-slate-900 text-lg">{visitorName}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" />
                {visitorPhone || '—'}
              </span>
              {visitorPhone && (
                <a href={whatsappLink(visitorPhone)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
            </div>
          </section>

          {/* Propriétaire */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Propriétaire
            </h2>
            <p className="font-bold text-slate-900 text-lg">{ownerName}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" />
                {ownerPhone || '—'}
              </span>
              {ownerPhone && (
                <a href={whatsappLink(ownerPhone)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
            </div>
            {!reservation.owner_notified_at && isPending && (
              <p className="mt-3 text-xs text-amber-600 italic">⚠️ Le propriétaire n'a PAS encore été averti (validation requise).</p>
            )}
            {reservation.owner_notified_at && (
              <p className="mt-3 text-xs text-emerald-600 italic">✅ Propriétaire averti le {formatDateTime(reservation.owner_notified_at)}</p>
            )}
          </section>

          {/* Période + montants */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Période
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-900 font-semibold">
              <span>{formatDateFR(reservation.date_debut)}</span>
              <span className="text-slate-400">→</span>
              <span>{formatDateFR(reservation.date_fin)}</span>
            </div>
            <p className="text-slate-500 text-xs mt-1">{nbJours} jour{nbJours > 1 ? 's' : ''}</p>

            <div className="mt-5 pt-5 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Montants
              </h3>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-slate-500">Loyer</dt>
                <dd className="text-right font-medium text-slate-900">{formatFCFA(reservation.montant_loyer_fcfa ?? 0)}</dd>
                <dt className="text-slate-500">Charges</dt>
                <dd className="text-right font-medium text-slate-900">{formatFCFA(reservation.charges_fcfa ?? 0)}</dd>
                <dt className="text-slate-500">Dépôt de garantie</dt>
                <dd className="text-right font-medium text-slate-900">{formatFCFA(reservation.depot_garantie_fcfa ?? 0)}</dd>
                <dt className="text-slate-500">Commission plateforme</dt>
                <dd className="text-right font-medium text-slate-900">{formatFCFA(reservation.commission_fcfa ?? 0)}</dd>
                <dt className="font-bold text-slate-900 pt-2 border-t border-slate-100 mt-2">Total</dt>
                <dd className="text-right font-bold text-slate-900 pt-2 border-t border-slate-100 mt-2">{formatFCFA(reservation.montant_total_fcfa ?? 0)}</dd>
              </dl>
            </div>

            {reservation.notes && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Note du visiteur</p>
                <p className="text-slate-700 text-sm whitespace-pre-wrap">{reservation.notes}</p>
              </div>
            )}
          </section>

          {reservation.admin_note && (
            <section className="bg-slate-100 rounded-2xl border border-slate-200 p-6">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Note admin</h2>
              <p className="text-slate-700 text-sm whitespace-pre-wrap">{reservation.admin_note}</p>
              {reservation.admin_validated_at && (
                <p className="text-xs text-slate-500 mt-2">
                  {reservation.admin_validation_status === 'approved' ? 'Validée' : 'Refusée'} le {formatDateTime(reservation.admin_validated_at)}
                </p>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {isPending ? (
            <section className="bg-white rounded-2xl border-2 border-amber-300 p-6 sticky top-6">
              <h2 className="font-bold text-slate-900 mb-1">Action requise</h2>
              <p className="text-slate-500 text-xs mb-4">
                Le propriétaire et le visiteur attendent votre validation.
              </p>
              <form action={validateReservationAction} className="space-y-3">
                <input type="hidden" name="reservationId" value={id} />
                <textarea
                  name="note"
                  rows={2}
                  placeholder="Note interne (optionnelle)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                />
                <button type="submit" name="action" value="approve" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors">
                  <CheckCircle2 className="w-4 h-4" /> Valider et notifier
                </button>
                <button type="submit" name="action" value="reject" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold transition-colors">
                  <XCircle className="w-4 h-4" /> Refuser
                </button>
              </form>
              <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <p>✅ Validation → notif WhatsApp au proprio + visiteur</p>
                <p>❌ Refus → notif WhatsApp au visiteur uniquement</p>
              </div>
            </section>
          ) : (
            <section className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6">
              <h2 className="font-bold text-slate-900 mb-2">Statut</h2>
              {adminBadge(reservation.admin_validation_status)}
              <p className="text-slate-500 text-xs mt-3">Cette demande a déjà été traitée.</p>
            </section>
          )}

          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-4">Journal WhatsApp</h2>
            {notifLogs.length === 0 ? (
              <p className="text-slate-400 text-xs italic">Aucune notification envoyée.</p>
            ) : (
              <ol className="space-y-3">
                {notifLogs.map((n) => (
                  <li key={n.id} className="flex gap-3 text-xs">
                    <span
                      className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        n.status === 'sent' || n.status === 'delivered' || n.status === 'read'
                          ? 'bg-emerald-500'
                          : n.status === 'failed'
                          ? 'bg-red-500'
                          : 'bg-amber-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-700 capitalize">{n.recipient_role}</p>
                      <p className="text-slate-500 truncate">{n.to_phone}</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">
                        {n.template} · {n.status}
                        {n.sent_at && ` · ${formatDateTime(n.sent_at)}`}
                      </p>
                      {n.error_message && (
                        <p className="text-red-500 text-[10px] mt-1">{n.error_message}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </main>
  )
}
