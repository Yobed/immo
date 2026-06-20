import { createAdminClient } from '@/lib/supabase/admin'
import { AlertOctagon, AlertTriangle, Info, Clock, User as UserIcon, Code } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface ErrorLog {
  id: string
  level: 'error' | 'warn' | 'info'
  message: string
  stack: string | null
  context: Record<string, unknown> | null
  source: string | null
  route: string | null
  user_id: string | null
  fingerprint: string | null
  status: 'open' | 'investigating' | 'resolved' | 'ignored'
  occurrence_count: number
  last_seen_at: string
  created_at: string
}

interface PageProps {
  searchParams: Promise<{
    status?: string
    level?: string
  }>
}

export default async function AdminErrorsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const statusFilter = sp.status && ['open', 'investigating', 'resolved', 'ignored'].includes(sp.status) ? sp.status : 'open'
  const levelFilter = sp.level && ['error', 'warn', 'info'].includes(sp.level) ? sp.level : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  let q = supabase
    .from('error_logs')
    .select('id, level, message, stack, context, source, route, user_id, fingerprint, status, occurrence_count, last_seen_at, created_at')
    .eq('status', statusFilter)
    .order('last_seen_at', { ascending: false })
    .limit(100)
  if (levelFilter) q = q.eq('level', levelFilter)

  const { data: logs } = await q
  const errorLogs = (logs ?? []) as ErrorLog[]

  // Stats globales pour les compteurs
  const { data: stats } = await supabase.rpc('count_error_logs_by_status').single().then(
    (res: { data: unknown }) => res,
    () => ({ data: null }),
  )
  // Fallback : compte manuel si la RPC n'existe pas
  const counts = await Promise.all([
    supabase.from('error_logs').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('error_logs').select('id', { count: 'exact', head: true }).eq('status', 'investigating'),
    supabase.from('error_logs').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
    supabase.from('error_logs').select('id', { count: 'exact', head: true }).eq('status', 'ignored'),
  ])
  const [open, investigating, resolved, ignored] = counts.map((c: { count: number | null }) => c.count ?? 0)

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 lg:py-10">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 mb-2">
          <AlertOctagon className="w-5 h-5 text-red-500" />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)]">
            Monitoring erreurs runtime
          </h1>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Toutes les erreurs survenues dans les API / server actions / pages, dédupliquées par fingerprint.
        </p>
      </header>

      {/* Filtres status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatusCard label="À investiguer" value={open} href="/admin/errors?status=open" active={statusFilter === 'open'} variant="danger" />
        <StatusCard label="En cours" value={investigating} href="/admin/errors?status=investigating" active={statusFilter === 'investigating'} variant="warning" />
        <StatusCard label="Résolues" value={resolved} href="/admin/errors?status=resolved" active={statusFilter === 'resolved'} variant="success" />
        <StatusCard label="Ignorées" value={ignored} href="/admin/errors?status=ignored" active={statusFilter === 'ignored'} variant="muted" />
      </div>

      {/* Liste */}
      {errorLogs.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-[var(--surface-card)] border border-dashed border-[var(--border)]">
          <AlertOctagon className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
          <p className="text-sm text-[var(--text-muted)]">
            {statusFilter === 'open'
              ? '🎉 Aucune erreur à investiguer. Tout va bien.'
              : `Aucune erreur en statut "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {errorLogs.map((log) => (
            <ErrorRow key={log.id} log={log} />
          ))}
        </ul>
      )}

      {errorLogs.length === 100 && (
        <p className="mt-6 text-center text-xs text-[var(--text-muted)] italic">
          Affichage limité aux 100 plus récentes. Utilise des filtres pour affiner.
        </p>
      )}
    </main>
  )
}

interface StatusCardProps {
  label: string
  value: number
  href: string
  active: boolean
  variant: 'danger' | 'warning' | 'success' | 'muted'
}
function StatusCard({ label, value, href, active, variant }: StatusCardProps) {
  const colors = {
    danger: 'bg-red-500/10 border-red-500/30 text-red-600',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
    muted: 'bg-slate-500/10 border-slate-500/30 text-slate-500',
  }[variant]
  return (
    <Link
      href={href}
      className={`block px-4 py-3 rounded-xl border transition-all ${colors} ${active ? 'ring-2 ring-current' : 'opacity-70 hover:opacity-100'}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      <p className="font-display text-2xl font-black tabular-nums mt-1">{value}</p>
    </Link>
  )
}

function ErrorRow({ log }: { log: ErrorLog }) {
  const LevelIcon = log.level === 'error' ? AlertOctagon : log.level === 'warn' ? AlertTriangle : Info
  const levelColor =
    log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-amber-500' : 'text-blue-500'
  const date = new Date(log.last_seen_at).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface-card)] p-4">
      <div className="flex items-start gap-3">
        <LevelIcon className={`w-5 h-5 ${levelColor} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm text-[var(--text)] break-words mb-1">{log.message}</p>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
            {log.source && <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)]">{log.source}</span>}
            {log.route && <span className="font-mono normal-case tracking-normal text-[var(--text)]">{log.route}</span>}
            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{date}</span>
            {log.occurrence_count > 1 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700">
                ×{log.occurrence_count}
              </span>
            )}
            {log.user_id && (
              <span className="inline-flex items-center gap-1"><UserIcon className="w-3 h-3" />{log.user_id.slice(0, 8)}</span>
            )}
          </div>
          {log.stack && (
            <details className="mt-2 group">
              <summary className="cursor-pointer text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] inline-flex items-center gap-1">
                <Code className="w-3 h-3" /> Stack trace
              </summary>
              <pre className="mt-2 p-3 rounded bg-slate-900 text-slate-200 text-[10px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {log.stack}
              </pre>
            </details>
          )}
          {log.context && Object.keys(log.context).length > 0 && (
            <details className="mt-2 group">
              <summary className="cursor-pointer text-[10px] text-[var(--text-muted)] hover:text-[var(--text)]">
                Contexte JSON
              </summary>
              <pre className="mt-2 p-3 rounded bg-slate-50 text-slate-800 text-[10px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(log.context, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </li>
  )
}
