import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Users, Send, MousePointerClick, CheckCircle2, Ban, Clock } from 'lucide-react'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ProspectRow {
  id: string
  phone: string
  display_name: string | null
  source_group_jid: string | null
  source_group_name: string | null
  first_seen_at: string
  last_seen_at: string
  last_invited_at: string | null
  invite_count: number
  ad_count: number
  status: string
  opt_out: boolean
  last_extraction: { commune?: string; type_bien?: string } | null
}

interface OutreachStats {
  total: number
  invited: number
  clicked: number
  converted: number
  opted_out: number
  pending: number
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-slate-100 text-slate-700 border-slate-200',
  queued: 'bg-amber-50 text-amber-700 border-amber-200',
  invited: 'bg-blue-50 text-blue-700 border-blue-200',
  responded: 'bg-violet-50 text-violet-700 border-violet-200',
  converted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  opted_out: 'bg-red-50 text-red-700 border-red-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminOutreachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/outreach')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') notFound()

  // Cast service client en any : les tables outreach (017) ne sont pas dans le type généré.
  const admin = createAdminClient() as unknown as {
    from: (table: string) => any
  }

  // Prospects (last 100)
  const { data: prospectsRaw } = await admin
    .from('agent_prospects')
    .select('*')
    .order('last_seen_at', { ascending: false })
    .limit(100)

  const prospects = (prospectsRaw ?? []) as ProspectRow[]

  // Stats globales (counts par status)
  const { data: countsRaw } = await admin
    .from('agent_prospects')
    .select('status, opt_out')

  const counts = (countsRaw ?? []) as { status: string; opt_out: boolean }[]
  const stats: OutreachStats = {
    total: counts.length,
    invited: counts.filter(c => c.status === 'invited').length,
    clicked: 0,
    converted: counts.filter(c => c.status === 'converted').length,
    opted_out: counts.filter(c => c.opt_out).length,
    pending: counts.filter(c => c.status === 'new' || c.status === 'queued').length,
  }

  // Compteur de clicks via outreach_log
  const { count: clickedCount } = await admin
    .from('agent_outreach_log')
    .select('*', { count: 'exact', head: true })
    .in('delivery_status', ['clicked', 'converted'])
  stats.clicked = clickedCount ?? 0

  const conversionRate = stats.invited > 0
    ? ((stats.converted / stats.invited) * 100).toFixed(1)
    : '0.0'
  const clickRate = stats.invited > 0
    ? ((stats.clicked / stats.invited) * 100).toFixed(1)
    : '0.0'

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Outreach agents WhatsApp</h1>
          <p className="text-sm text-slate-500">Agents identifiés dans les groupes publics et statut de leurs invitations.</p>
        </header>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard icon={Users} label="Prospects" value={stats.total} color="slate" />
          <StatCard icon={Clock} label="En attente" value={stats.pending} color="amber" />
          <StatCard icon={Send} label="Invités" value={stats.invited} color="blue" />
          <StatCard icon={MousePointerClick} label="Clicks" value={stats.clicked} color="violet" hint={`${clickRate}%`} />
          <StatCard icon={CheckCircle2} label="Convertis" value={stats.converted} color="emerald" hint={`${conversionRate}%`} />
          <StatCard icon={Ban} label="Opt-out" value={stats.opted_out} color="red" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Prospects récents (100 derniers)</h2>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Trié par dernière activité</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Téléphone</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Nom</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Dernière annonce</th>
                  <th className="text-center px-4 py-2.5 font-semibold">Annonces</th>
                  <th className="text-center px-4 py-2.5 font-semibold">Invites</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Statut</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Vu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prospects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">+{p.phone}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{p.display_name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {p.last_extraction
                        ? `${p.last_extraction.type_bien ?? '?'} · ${p.last_extraction.commune ?? '?'}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700 font-bold">{p.ad_count}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{p.invite_count}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${STATUS_COLORS[p.status] ?? STATUS_COLORS.new}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">{formatDate(p.last_seen_at)}</td>
                  </tr>
                ))}
                {prospects.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                      Aucun prospect détecté pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: 'slate' | 'amber' | 'blue' | 'violet' | 'emerald' | 'red'
  hint?: string
}

const COLOR_MAP: Record<StatCardProps['color'], string> = {
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
}

function StatCard({ icon: Icon, label, value, color, hint }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${COLOR_MAP[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4 opacity-70" />
        {hint && <span className="text-[10px] font-bold opacity-70">{hint}</span>}
      </div>
      <div className="text-2xl font-bold leading-none mb-1">{value}</div>
      <div className="text-[10px] uppercase tracking-widest font-semibold opacity-80">{label}</div>
    </div>
  )
}
