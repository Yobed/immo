import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getDictionary } from '@/lib/i18n/server'

export const metadata = { title: "Terms" }

export default async function CguPage() {
  const t = await getDictionary()
  return (
    <main className="min-h-screen bg-[var(--background)] pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] text-sm mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.common.back}
        </Link>
        <h1 className="font-display text-4xl font-black text-[var(--text)] mb-2 uppercase tracking-tight">{t.legal.termsTitle}</h1>
        <p className="text-[var(--text-muted)] text-sm mb-12">{t.legal.termsLastUpdate}</p>

        <div className="space-y-10 text-[var(--text)] text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">{t.legal.termsObject}</h2>
            <p>{t.legal.termsObjectBody}</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">{t.legal.termsAccess}</h2>
            <p>{t.legal.termsAccessBody}</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">{t.legal.termsResponsibilities}</h2>
            <p>{t.legal.termsResponsibilitiesBody}</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">{t.legal.termsContact}</h2>
            <p>{t.legal.termsContactBody} <a href="https://wa.me/2250544872051" className="text-[var(--accent-luxury)] hover:underline">+225 05 44 87 20 51</a></p>
          </section>
        </div>
      </div>
    </main>
  )
}
