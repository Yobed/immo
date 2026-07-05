import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { BLOG_POSTS, getBlogPost } from '@/lib/blog/posts'
import { ArticleBody } from '@/components/blog/ArticleBody'
import { SITE_URL } from '@/lib/env'

interface Props {
  params: Promise<{ slug: string }>
}

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  // Slugs inconnus interceptés en amont par le middleware (vrai 404) — ceinture ici.
  if (!post) notFound()
  return {
    title: post.titre,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.titre,
      description: post.description,
      type: 'article',
      url: `/blog/${post.slug}`,
      publishedTime: post.datePublication,
    },
  }
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()

  const autres = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3)

  const jsonLd: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.titre,
      description: post.description,
      datePublished: post.datePublication,
      inLanguage: 'fr-CI',
      mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
      author: { '@type': 'Organization', name: "BOGBE'S GROUPE", url: SITE_URL },
      publisher: {
        '@type': 'Organization',
        name: "BOGBE'S GROUPE",
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/bogbes-logo.png` },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.titre, item: `${SITE_URL}/blog/${post.slug}` },
      ],
    },
  ]
  if (post.faq && post.faq.length > 0) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.reponse },
      })),
    })
  }

  return (
    <main className="bg-[var(--background)] min-h-screen pt-6 sm:pt-10 lg:pt-16 pb-16">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="max-w-3xl mx-auto px-4 lg:px-8">
        <nav aria-label="Fil d'Ariane" className="mb-6 text-xs text-[var(--text-muted)]">
          <Link href="/blog" className="inline-flex items-center gap-1.5 hover:text-[var(--text)]">
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden /> Tous les articles
          </Link>
        </nav>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3 text-[11px] text-[var(--text-muted)]">
            <span className="rounded-full bg-accent-luxury/10 border border-accent-luxury/20 px-2.5 py-0.5 font-bold text-[var(--accent-luxury)] uppercase tracking-wider">
              {post.categorie}
            </span>
            <time dateTime={post.datePublication}>{DATE_FMT.format(new Date(post.datePublication))}</time>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden /> {post.minutesLecture} min de lecture
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-4xl font-bold text-[var(--text)] tracking-tight leading-tight">
            {post.titre}
          </h1>
        </header>

        <ArticleBody post={post} />

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-accent-luxury/20 bg-accent-luxury/5 p-6 text-center">
          <p className="font-display text-lg font-bold text-[var(--text)] mb-2">
            Vous cherchez un bien en Côte d&rsquo;Ivoire ?
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Annonces vérifiées, visites sur réservation, paiement sécurisé par mobile money.
          </p>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-luxury)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Parcourir le catalogue <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>

        {/* Autres articles */}
        {autres.length > 0 && (
          <section className="mt-12 border-t border-[var(--border)] pt-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-4">
              À lire aussi
            </h2>
            <ul className="space-y-3">
              {autres.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="text-sm font-semibold text-[var(--accent-luxury)] hover:underline"
                  >
                    {p.titre}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  )
}
