import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import { BLOG_POSTS } from '@/lib/blog/posts'

export const metadata = {
  title: "Blog immobilier — conseils et guides pour la Côte d'Ivoire",
  description:
    "Prix des loyers à Abidjan, arnaques à éviter, achat de terrain, guides de location : les conseils immobiliers BOGBE'S pour bien se loger et investir en Côte d'Ivoire.",
  alternates: { canonical: '/blog' },
}

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export default function BlogPage() {
  const posts = [...BLOG_POSTS].sort(
    (a, b) => new Date(b.datePublication).getTime() - new Date(a.datePublication).getTime(),
  )
  return (
    <main className="bg-[var(--background)] min-h-screen pt-6 sm:pt-10 lg:pt-16 pb-16">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <div className="mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-luxury)] mb-2">
            Le blog BOGBE&rsquo;S
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-[var(--text)] mb-4 tracking-tight">
            Conseils <span className="italic font-serif text-[var(--accent-luxury)]">immobiliers</span>
          </h1>
          <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed max-w-2xl">
            Guides pratiques, prix du marché et conseils pour louer, acheter et investir en
            Côte d&rsquo;Ivoire — sans mauvaise surprise.
          </p>
        </div>

        <div className="space-y-4">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="block rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5 md:p-6 hover:border-[var(--accent-luxury)] transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2 text-[11px] text-[var(--text-muted)]">
                <span className="rounded-full bg-accent-luxury/10 border border-accent-luxury/20 px-2.5 py-0.5 font-bold text-[var(--accent-luxury)] uppercase tracking-wider">
                  {p.categorie}
                </span>
                <time dateTime={p.datePublication}>{DATE_FMT.format(new Date(p.datePublication))}</time>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" aria-hidden /> {p.minutesLecture} min
                </span>
              </div>
              <h2 className="font-display text-lg md:text-2xl font-bold text-[var(--text)] mb-2 tracking-tight group-hover:text-[var(--accent-luxury)] transition-colors">
                {p.titre}
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-3">{p.description}</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-luxury)]">
                Lire l&rsquo;article <ArrowRight className="w-4 h-4" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
