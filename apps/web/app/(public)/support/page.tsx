import Link from 'next/link'
import { ArrowLeft, MessageCircle, Phone, Mail, MapPin } from 'lucide-react'
import Image from 'next/image'
import { getDictionary } from '@/lib/i18n/server'

export const metadata = { title: 'Support' }

export default async function SupportPage() {
  const t = await getDictionary()
  return (
    <main className="min-h-screen bg-[var(--background)] pt-8 sm:pt-14 lg:pt-20 pb-16 px-6">
      <div className="max-w-lg mx-auto text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] text-sm mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.common.back}
        </Link>
        <Image src="/bogbes-logo.png" alt="BOGBE'S GROUPE" width={60} height={60} className="mx-auto mb-6 object-contain" />
        <h1 className="font-display text-4xl font-black text-[var(--text)] mb-3 uppercase tracking-tight">{t.support.title}</h1>
        <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-12">
          {t.support.subtitle}
        </p>

        <div className="space-y-4">
          <a
            href="https://wa.me/2250574243752"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-emerald-500/40 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="font-bold text-[var(--text)] text-sm">{t.support.whatsappPrimary}</p>
              <p className="text-[var(--text-muted)] text-xs">+225 05 74 24 37 52</p>
            </div>
          </a>

          <a
            href="https://wa.me/2250778311541"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-emerald-500/40 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="font-bold text-[var(--text)] text-sm">{t.support.whatsappSupport}</p>
              <p className="text-[var(--text-muted)] text-xs">+225 07 78 31 15 41</p>
            </div>
          </a>

          <a
            href="tel:+2250778311541"
            className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-orange-500/40 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-left">
              <p className="font-bold text-[var(--text)] text-sm">{t.support.phone}</p>
              <p className="text-[var(--text-muted)] text-xs">+225 07 78 31 15 41</p>
            </div>
          </a>

          <a
            href="mailto:commercial@bogbesgroup.com"
            className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-blue-500/40 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-bold text-[var(--text)] text-sm">{t.support.emailCommercial}</p>
              <p className="text-[var(--text-muted)] text-xs">commercial@bogbesgroup.com</p>
            </div>
          </a>

          <a
            href="mailto:info@bogbesgroup.com"
            className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-blue-500/40 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-bold text-[var(--text)] text-sm">{t.support.emailInfo}</p>
              <p className="text-[var(--text-muted)] text-xs">info@bogbesgroup.com</p>
            </div>
          </a>

          <div className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-left">
              <p className="font-bold text-[var(--text)] text-sm">{t.support.office}</p>
              <p className="text-[var(--text-muted)] text-xs">Abidjan, Cocody</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
