import Link from 'next/link'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'

export interface ActionQueueItem {
  label: string
  value: number
  href: string
}

export function ActionQueue({ items }: { items: ActionQueueItem[] }) {
  return (
    <section aria-labelledby="action-queue-title" className="mt-6 rounded-2xl border border-amber-500/30 bg-[var(--surface-card)] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4" aria-hidden="true" />
        </div>
        <div>
          <h2 id="action-queue-title" className="font-bold text-[var(--text)] text-sm">À traiter maintenant</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Les éléments qui bloquent le suivi commercial ou la qualité des données.</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 hover:border-amber-400/50 hover:bg-[var(--surface-hover)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-luxury)]"
          >
            <span className="text-xs font-medium text-[var(--text)] group-hover:text-[var(--accent-luxury)] transition-colors">
              {item.label}
            </span>
            <span className={`inline-flex items-center gap-1 text-sm font-black tabular-nums ${item.value ? 'text-amber-400' : 'text-emerald-400'}`}>
              {item.value}
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
