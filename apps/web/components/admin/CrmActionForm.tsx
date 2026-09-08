'use client'

import { useActionState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import type { CrmActionResult } from '@/lib/crm/input'

function PendingFields({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus()
  return <fieldset disabled={pending} className="min-w-0 w-full space-y-2 disabled:opacity-60">
    {children}
    {pending && <p role="status" className="text-sm text-[var(--text-muted)]">Enregistrement…</p>}
  </fieldset>
}

/** Keeps the entered values and explains errors instead of displaying a false success. */
export function CrmActionForm({ action, children, className }: {
  action: (form: FormData) => Promise<CrmActionResult>
  children: ReactNode
  className?: string
}) {
  const [result, submit] = useActionState(async (_previous: CrmActionResult, form: FormData) => {
    try { return await action(form) } catch { return { error: 'Impossible d’enregistrer. Réessayez après actualisation.' } }
  }, {})
  return <form action={submit} className={className}>
    <PendingFields>{children}</PendingFields>
    {result.error && <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">{result.error}</p>}
    {result.message && <p role="status" className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">{result.message}</p>}
  </form>
}
