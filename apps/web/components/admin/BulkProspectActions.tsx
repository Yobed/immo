'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import type { CrmActionResult } from '@/lib/crm/input'

interface ProspectSelection {
  id: string
  version: number
  label: string
}

function SubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || count === 0}
      className="rounded-xl bg-[var(--accent-luxury)] px-3 py-2 text-xs font-bold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Mise à jour…' : `Mettre à jour (${count})`}
    </button>
  )
}

export function BulkProspectActions({ rows, action }: {
  rows: ProspectSelection[]
  action: (form: FormData) => Promise<CrmActionResult>
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [result, submit] = useActionState(async (_previous: CrmActionResult, form: FormData) => action(form), {})
  const allSelected = rows.length > 0 && selected.size === rows.length

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-3" aria-label="Actions groupées">
      <form
        action={submit}
        onSubmit={(event) => {
          if (!window.confirm(`Appliquer ce statut à ${selected.size} prospect(s) ?`)) event.preventDefault()
        }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="flex items-center gap-2">
          <input
            id="select-all-prospects"
            type="checkbox"
            checked={allSelected}
            onChange={(event) => setSelected(event.target.checked ? new Set(rows.map((row) => row.id)) : new Set())}
            className="h-4 w-4 rounded border-slate-300 accent-[var(--accent-luxury)]"
          />
          <label htmlFor="select-all-prospects" className="text-xs font-semibold text-[var(--text)]">Sélectionner la page</label>
        </div>
        <select name="statut" defaultValue="contacte" className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)]">
          <option value="nouveau">Nouveau</option>
          <option value="contacte">Contacté</option>
          <option value="visite_planifiee">Visite planifiée</option>
          <option value="visite_realisee">Visite réalisée</option>
          <option value="relance">Relance</option>
          <option value="gagne">Gagné</option>
          <option value="perdu">Perdu</option>
        </select>
        <div className="basis-full flex max-h-28 flex-wrap gap-2 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2">
          {rows.map((row) => (
            <label key={row.id} className="inline-flex min-w-[10rem] items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-[var(--text)] hover:bg-[var(--surface-hover)]">
              <input type="checkbox" name="selection" value={`${row.id}|${row.version}`} checked={selected.has(row.id)} onChange={(event) => {
                setSelected((current) => {
                  const next = new Set(current)
                  if (event.target.checked) next.add(row.id)
                  else next.delete(row.id)
                  return next
                })
              }} className="h-3.5 w-3.5 rounded accent-[var(--accent-luxury)]" />
              <span className="truncate">{row.label}</span>
            </label>
          ))}
        </div>
        <SubmitButton count={selected.size} />
        {result.error && <p role="alert" className="basis-full text-xs font-semibold text-red-700">{result.error}</p>}
        {result.message && <p role="status" className="basis-full text-xs font-semibold text-emerald-700">{result.message}</p>}
      </form>
      <p className="mt-2 text-[11px] text-[var(--text-muted)]">Maximum 50 dossiers par opération. Les changements respectent la version de chaque dossier et demandent une confirmation.</p>
    </section>
  )
}
