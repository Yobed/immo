import Link from 'next/link'
import type { ReactNode } from 'react'
import type { BlogPost } from '@/lib/blog/posts'

/**
 * Rend un paragraphe en transformant la syntaxe [texte](/url) en <Link>.
 * ponytail: mini-parser regex suffisant pour nos liens internes — pas de lib markdown.
 */
function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index))
    parts.push(
      <Link key={m.index} href={m[2]} className="text-[var(--accent-luxury)] font-semibold hover:underline">
        {m[1]}
      </Link>,
    )
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

export function ArticleBody({ post }: { post: BlogPost }) {
  return (
    <div className="space-y-8">
      {post.sections.map((s, i) => (
        <section key={i}>
          {s.h2 && (
            <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--text)] mb-3 tracking-tight">
              {s.h2}
            </h2>
          )}
          {s.paragraphs?.map((p, j) => (
            <p key={j} className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed mb-3">
              {renderInline(p)}
            </p>
          ))}
          {s.list && (
            <ul className="space-y-2 mt-2">
              {s.list.map((item, j) => (
                <li key={j} className="flex gap-2.5 text-sm md:text-base text-[var(--text-muted)] leading-relaxed">
                  <span className="text-[var(--accent-luxury)] shrink-0 mt-0.5" aria-hidden>•</span>
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          )}
          {s.steps && (
            <ol className="space-y-3 mt-2">
              {s.steps.map((item, j) => (
                <li key={j} className="flex gap-3 text-sm md:text-base text-[var(--text-muted)] leading-relaxed">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-accent-luxury/10 border border-accent-luxury/20 text-[var(--accent-luxury)] text-xs font-bold flex items-center justify-center mt-0.5">
                    {j + 1}
                  </span>
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}

      {post.faq && post.faq.length > 0 && (
        <section className="border-t border-[var(--border)] pt-8">
          <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--text)] mb-4 tracking-tight">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {post.faq.map((f, i) => (
              <details
                key={i}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-card)] px-4 py-3 group"
              >
                <summary className="cursor-pointer text-sm md:text-base font-semibold text-[var(--text)] list-none">
                  {f.question}
                </summary>
                <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">{f.reponse}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
