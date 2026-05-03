import Link from 'next/link'
import { ArrowLeft, MessageCircle, Phone } from 'lucide-react'
import Image from 'next/image'

export const metadata = { title: 'Support' }

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] pt-32 pb-24 px-6">
      <div className="max-w-lg mx-auto text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] text-sm mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <Image src="/bogbes-logo.png" alt="BOGBE'S GROUPE" width={60} height={60} className="mx-auto mb-6 object-contain" />
        <h1 className="font-display text-4xl font-black text-[var(--text)] mb-3 uppercase tracking-tight">Support</h1>
        <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-12">
          Notre équipe est disponible 7j/7 pour vous accompagner dans votre recherche immobilière.
        </p>

        <div className="space-y-4">
          <a
            href="https://wa.me/2250574243752?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-emerald-500/40 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="font-bold text-[var(--text)] text-sm">WhatsApp Principal</p>
              <p className="text-[var(--text-muted)] text-xs">+225 05 74 24 37 52</p>
            </div>
          </a>

          <a
            href="https://wa.me/225078311541?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-emerald-500/40 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="font-bold text-[var(--text)] text-sm">WhatsApp Support</p>
              <p className="text-[var(--text-muted)] text-xs">+225 07 83 11 54 1</p>
            </div>
          </a>
        </div>
      </div>
    </main>
  )
}
