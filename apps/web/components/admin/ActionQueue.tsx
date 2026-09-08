import Link from 'next/link'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'

export interface ActionQueueItem {
  label: string
  value: number
  href: string
}

export function ActionQueue({ items }: { items: ActionQueueItem[] }) {
  return (
    <section aria-labelledby="action-queue-title" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h2 id="action-queue-title" className="font-bold text-amber-900 text-sm">À traiter maintenant</h2>
          <p className="text-xs text-amber-800 mt-1">Les éléments qui bloquent le suivi commercial ou la qualité des données.</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
        {items.map((item) => (
          <Link key={item.label} href={item.href} className="group flex items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-white/60 px-3 py-2.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700">
            <span className="text-xs text-amber-950">{item.label}</span>
            <span className={`inline-flex items-center gap-1 text-sm font-black tabular-nums ${item.value ? 'text-amber-800' : 'text-emerald-700'}`}>
              {item.value}<ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
