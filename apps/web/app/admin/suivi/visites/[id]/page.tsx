import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  ArrowLeft, ShieldCheck, Phone, Calendar, Clock, MapPin, User,
  CheckCircle2, XCircle, MessageCircle, Home, FileText, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatFCFA } from '@/lib/format'
import { validateVisiteAction, setVisiteOutcomeAction } from '../../actions'
import { CrmActionForm } from '@/components/admin/CrmActionForm'
import { whatsappLink } from '@/lib/whatsapp'

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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isAgentProspect(p: { source_detail?: string | null; dernier_message?: string | null }): boolean {
  if (p.source_detail === 'agent') return true
  if (p.source_detail === 'prospect') return false
  return /mon client|mes clients|notre client|mandant|confr[èe]re|cabinet|d[ée]marcheur|demarcheur|interm[ée]diaire|apporteur|pour un client|pour mon client|cherche pour client/i.test(
    p.dernier_message || '',
  )
}

function adminBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
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

export default async function VisiteDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/admin/suivi/visites/${id}`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') notFound()

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: visite } = await (admin as any)
    .from('visites')
    .select(`
      id, date_souhaitee, heure_debut, heure_fin, notes, statut, source,
      admin_validation_status, admin_validated_at, admin_note, outcome, loss_reason, outcome_note, outcome_at, version,
      admin_notified_at, owner_notified_at, visitor_notified_at,
      client_name, client_phone, created_at, bien_id,
      biens ( id, titre, commune, quartier ),
      locataire:profiles!visites_locataire_id_fkey ( id, full_name, phone, email ),
      proprietaire:profiles!visites_proprietaire_id_fkey ( id, full_name, phone, email )
    `)
    .eq('id', id)
    .single()

  if (!visite) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: notifs } = await (admin as any)
    .from('whatsapp_notifications')
    .select('id, to_phone, recipient_role, template, status, error_message, sent_at, created_at')
    .eq('related_type', 'visite')
    .eq('related_id', id)
    .order('created_at', { ascending: true })

  const notifLogs = (notifs ?? []) as NotifLog[]

  const visitorName = visite.locataire?.full_name || visite.client_name || 'Visiteur'
  const visitorPhone = visite.locataire?.phone || visite.client_phone || null
  const ownerName = visite.proprietaire?.full_name || '—'
  const ownerPhone = visite.proprietaire?.phone || null

  // Recherche du prospect CRM associé par numéro de téléphone
  let prospect: {
    id: string
    nom: string | null
    phone: string
    type_bien: string | null
    commune: string | null
    quartier: string | null
    budget: number | null
    statut: string
    dernier_message: string | null
    source_detail?: string | null
  } | null = null

  if (visitorPhone) {
    const rawDigits = visitorPhone.replace(/[^0-9]/g, '')
    const cleanDigits = rawDigits.startsWith('225') ? rawDigits.slice(3) : rawDigits
    if (cleanDigits.length >= 8) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: prospectData } = await (admin as any)
        .from('prospects')
        .select('id, nom, phone, type_bien, commune, quartier, budget, statut, dernier_message, source_detail')
        .or(`phone.ilike.%${cleanDigits}%,phone.eq.${rawDigits},phone.eq.225${cleanDigits}`)
        .is('merged_into', null)
        .order('last_seen', { ascending: false })
        .limit(1)
        .maybeSingle()
      prospect = prospectData
    }
  }

  const isPending = visite.admin_validation_status === 'pending'

  return (
    <main className="min-h-screen bg-[var(--surface-hover)]">
      {/* Header */}
      <div className="bg-[var(--surface-card)] border-b border-[var(--border)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link href="/admin/suivi?tab=visites" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Retour suivi
          </Link>
          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href={`/api/admin/visites/${id}/fiche`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--text)] text-[var(--surface-card)] hover:opacity-90 shadow-sm transition-opacity"
            >
              <FileText className="w-3.5 h-3.5" /> Fiche de visite (PDF)
            </a>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--text)]" />
              <span className="font-bold text-[var(--text)] text-sm">Visite #{id.slice(0, 8)}</span>
              {adminBadge(visite.admin_validation_status)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bien */}
          <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--text-subtle)] mb-3 flex items-center gap-2">
              <Home className="w-4 h-4" /> Bien concerné
            </h2>
            <h3 className="font-bold text-[var(--text)] text-lg">{visite.biens?.titre || 'Bien sans titre'}</h3>
            <p className="text-[var(--text-muted)] text-sm flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {visite.biens?.commune || '—'}
              {visite.biens?.quartier && ` · ${visite.biens.quartier}`}
            </p>
            {visite.bien_id && (
              <Link
                href={`/biens/${visite.bien_id}`}
                target="_blank"
                className="mt-3 inline-block text-sm font-bold text-[var(--text)] hover:text-[var(--text)] underline"
              >
                Voir la fiche →
              </Link>
            )}
          </section>

          {/* Visiteur */}
          <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--text-subtle)] mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Visiteur
            </h2>
            <p className="font-bold text-[var(--text)] text-lg">{visitorName}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 text-sm text-[var(--text)]">
                <Phone className="w-4 h-4 text-[var(--text-subtle)]" />
                {visitorPhone || '—'}
              </span>
              {visitorPhone && (
                <a
                  href={whatsappLink(visitorPhone) ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
              {visite.source === 'whatsapp' && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">via WhatsApp</span>
              )}
            </div>
          </section>

          {/* Qualification CRM & Sapphire */}
          {prospect && (
            <section className="bg-gradient-to-br from-amber-500/10 via-[var(--surface-card)] to-purple-500/10 rounded-2xl border border-[var(--border)] p-6 shadow-sm">
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
                      isAgentProspect(prospect) ? 'bg-purple-100 text-purple-900 border-purple-200' : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                    }`}>
                      {isAgentProspect(prospect) ? 'Agent démarcheur' : 'Client direct'}
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
          <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--text-subtle)] mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Propriétaire
            </h2>
            <p className="font-bold text-[var(--text)] text-lg">{ownerName}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 text-sm text-[var(--text)]">
                <Phone className="w-4 h-4 text-[var(--text-subtle)]" />
                {ownerPhone || '—'}
              </span>
              {ownerPhone && (
                <a
                  href={whatsappLink(ownerPhone) ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-sm font-black shadow-sm transition-all active:scale-95"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
            </div>
            {!visite.owner_notified_at && isPending && (
              <p className="mt-3 text-xs text-amber-400 font-medium italic">⚠️ Le propriétaire n'a PAS encore été averti (validation requise).</p>
            )}
            {visite.owner_notified_at && (
              <p className="mt-3 text-xs text-emerald-400 font-medium italic">✅ Propriétaire averti le {formatDateTime(visite.owner_notified_at)}</p>
            )}
          </section>

          {/* Détails visite */}
          <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--text-subtle)] mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Créneau souhaité
            </h2>
            <p className="text-[var(--text)] font-semibold">{formatDateFR(visite.date_souhaitee)}</p>
            {visite.heure_debut && visite.heure_fin && (
              <p className="text-[var(--text-muted)] text-sm flex items-center gap-1 mt-1">
                <Clock className="w-4 h-4" />
                {visite.heure_debut} - {visite.heure_fin}
              </p>
            )}
            {visite.notes && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-subtle)] mb-2 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Note du visiteur
                </p>
                <p className="text-[var(--text)] text-sm whitespace-pre-wrap">{visite.notes}</p>
              </div>
            )}
          </section>

          {/* Note admin si déjà validée */}
          {visite.admin_note && (
            <section className="bg-[var(--surface-hover)] rounded-2xl border border-[var(--border)] p-6">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">Note admin</h2>
              <p className="text-[var(--text)] text-sm whitespace-pre-wrap">{visite.admin_note}</p>
              {visite.admin_validated_at && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  {visite.admin_validation_status === 'approved' ? 'Validée' : 'Refusée'} le {formatDateTime(visite.admin_validated_at)}
                </p>
              )}
            </section>
          )}

          {/* Bon de visite officiel (PDF) */}
          <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--text-subtle)] mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Bon de visite officiel (PDF)
            </h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Document à faire émarger par le prospect lors de la visite sur le terrain (inclut la clause de non-contournement de 12 mois).
            </p>
            <div className="flex flex-wrap gap-2.5">
              <a
                href={`/api/admin/visites/${id}/fiche`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--text)] text-[var(--surface-card)] text-xs font-black hover:opacity-90 transition-opacity"
              >
                <FileText className="w-4 h-4" /> Ouvrir &amp; Imprimer le PDF
              </a>
              <a
                href={`/api/admin/visites/${id}/fiche?download=1`}
                className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                Télécharger le fichier PDF
              </a>
            </div>
          </section>

          <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--text-subtle)] mb-3">Compte rendu de visite</h2>
            <CrmActionForm action={setVisiteOutcomeAction} className="space-y-3">
                <input type="hidden" name="visiteId" value={id} />
                <input type="hidden" name="version" value={visite.version} />
              <select name="outcome" defaultValue={visite.outcome ?? ''} required className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-sm bg-[var(--surface)] text-[var(--text)]">
                <option value="">Résultat de la visite</option><option value="realisee">Visite réalisée</option><option value="annulee">Annulée</option><option value="no_show">Prospect absent</option><option value="non_conclue">Visite sans suite</option>
              </select>
              <select name="lossReason" defaultValue={visite.loss_reason ?? ''} className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-sm bg-[var(--surface)] text-[var(--text)]">
                  <option value="">Motif si la visite n&apos;a pas abouti</option><option value="prix">Prix</option><option value="bien_indisponible">Bien indisponible</option><option value="proprietaire_injoignable">Propriétaire injoignable</option><option value="prospect_absent">Prospect absent</option><option value="documents_incomplets">Documents incomplets</option><option value="autre">Autre</option>
              </select>
              <textarea name="outcomeNote" defaultValue={visite.outcome_note ?? ''} rows={3} placeholder="Ce qui s&apos;est passé, prochaine étape…" className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-sm bg-[var(--surface)] text-[var(--text)] resize-none" />
              <button type="submit" className="w-full min-h-[40px] px-4 py-2.5 rounded-xl bg-[var(--accent-luxury)] text-[#0b1530] text-sm font-black hover:brightness-110 shadow-sm transition-all active:scale-[0.99]">Enregistrer le compte rendu</button>
            </CrmActionForm>
          </section>
        </div>

        {/* Sidebar : actions + timeline */}
        <aside className="space-y-6">
          {/* Actions */}
          {isPending ? (
            <section className="bg-[var(--surface-card)] rounded-2xl border-2 border-amber-500/40 p-6 sticky top-6 shadow-xl">
              <h2 className="font-black text-amber-400 mb-1 flex items-center gap-2 text-base">Action requise</h2>
              <p className="text-[var(--text-muted)] text-xs mb-4">
                Le propriétaire et le visiteur attendent votre validation.
              </p>

              <form action={validateVisiteAction} className="space-y-3">
                <input type="hidden" name="visiteId" value={id} />
                <textarea
                  name="note"
                  rows={2}
                  placeholder="Note interne (optionnelle)"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]/60 transition-colors"
                />
                <button
                  type="submit"
                  name="action"
                  value="approve"
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black shadow-md hover:shadow-emerald-900/30 transition-all active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" /> Valider et notifier
                </button>
                <button
                  type="submit"
                  name="action"
                  value="reject"
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                >
                  <XCircle className="w-4 h-4" /> Refuser
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)] space-y-1">
                <p>✅ Validation → notif WhatsApp au proprio + visiteur</p>
                <p>❌ Refus → notif WhatsApp au visiteur uniquement</p>
              </div>
            </section>
          ) : (
            <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-6 sticky top-6">
              <h2 className="font-bold text-[var(--text)] mb-2">Statut</h2>
              {adminBadge(visite.admin_validation_status)}
              <p className="text-[var(--text-muted)] text-xs mt-3">Cette demande a déjà été traitée.</p>
            </section>
          )}

          {/* Timeline notifs */}
          <section className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--text-subtle)] mb-4">Journal WhatsApp</h2>
            {notifLogs.length === 0 ? (
              <p className="text-[var(--text-subtle)] text-xs italic">Aucune notification envoyée.</p>
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
                      <p className="font-semibold text-[var(--text)] capitalize">{n.recipient_role}</p>
                      <p className="text-[var(--text-muted)] truncate">{n.to_phone}</p>
                      <p className="text-[var(--text-subtle)] text-[10px] mt-0.5">
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
