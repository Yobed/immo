import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import { getDictionary } from '@/lib/i18n/server'

export const metadata = { title: 'Presse' }

export default async function PressePage() {
  const t = await getDictionary()
  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent-luxury)]/10 border border-[var(--accent-luxury)]/20 mb-6">
          <Clock className="w-7 h-7 text-[var(--accent-luxury)]" />
        </div>
        <h1 className="font-display text-3xl font-black text-[var(--text)] mb-3 uppercase tracking-tight">{t.press.title}</h1>
        <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
          {t.press.subtitle}
        </p>
        <a href="https://wa.me/2250544872051" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[var(--accent-luxury)] font-bold text-sm hover:underline mb-4 block">
          {t.press.contact} →
        </a>
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-muted)] font-bold text-sm hover:underline">
          <ArrowLeft className="w-4 h-4" /> {t.partners.back}
        </Link>
      </div>
    </main>
  )
}
