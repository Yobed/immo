/**
 * Honeypot anti-bot — champ invisible aux humains, rempli automatiquement par les bots.
 *
 * Usage form:
 * ```tsx
 * <form onSubmit={handleSubmit}>
 *   <Honeypot />
 *   ...
 * </form>
 *
 * function handleSubmit(e: FormEvent) {
 *   const fd = new FormData(e.currentTarget)
 *   if (isHoneypotFilled(fd)) return // bot détecté, silent fail
 *   ...
 * }
 * ```
 */
import { HONEYPOT_NAME } from '@/lib/honeypot'

export function Honeypot() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none',
      }}
    >
      <label htmlFor={HONEYPOT_NAME}>Ne remplissez pas ce champ</label>
      <input
        type="text"
        id={HONEYPOT_NAME}
        name={HONEYPOT_NAME}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  )
}
