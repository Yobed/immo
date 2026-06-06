import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getDictionary } from '@/lib/i18n/server'

export const metadata = { title: 'Legal' }

export default async function MentionsLegalesPage() {
  const t = await getDictionary()
  return (
    <main className="min-h-screen bg-[var(--background)] pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] text-sm mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.common.back}
        </Link>
        <h1 className="font-display text-4xl font-black text-[var(--text)] mb-2 uppercase tracking-tight">{t.legal.legalTitle}</h1>
        <p className="text-[var(--text-muted)] text-sm mb-12">{t.legal.termsLastUpdate}</p>

        <div className="space-y-10 text-[var(--text)] text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">{t.legal.legalEditor}</h2>
            <p>{t.legal.legalEditorBody}<br />
            {t.legal.legalContactBody} <a href="https://wa.me/2250574243752" className="text-[var(--accent-luxury)] hover:underline">+225 05 74 24 37 52</a></p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">{t.legal.legalHosting}</h2>
            <p>{t.legal.legalHostingBody}</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">{t.legal.legalDirector}</h2>
            <p>{t.legal.legalDirectorBody}</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">{t.legal.legalContact}</h2>
            <p><a href="mailto:contact@bogbesgroupe.ci" className="text-[var(--accent-luxury)] hover:underline">contact@bogbesgroupe.ci</a></p>
          </section>
        </div>
      </div>
    </main>
  )
}
