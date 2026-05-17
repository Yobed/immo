import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[var(--background)] flex flex-col selection:bg-[var(--accent-luxury)]/30">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--accent-luxury)]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      {/* Header compact pour l'auth */}
      <header className="h-16 flex items-center justify-between px-6 bg-[var(--glass-surface)] backdrop-blur-xl border-b border-[var(--border)] z-10 sticky top-0">
        <Link href="/" className="flex items-center gap-2.5 active:scale-95 transition-transform min-w-0">
          <Image
            src="/bogbes-logo.png"
            alt="BOGBE'S GROUPE"
            width={40}
            height={40}
            className="w-10 h-10 object-contain shrink-0"
            priority
          />
          <span className="font-black text-base sm:text-xl text-[var(--text)] tracking-tighter font-display uppercase italic truncate">BOGBE&apos;S GROUPE</span>
        </Link>
        <Link href="/" className="text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--accent-luxury)] transition-colors flex items-center gap-2 uppercase tracking-[0.2em] bg-[var(--surface)] px-4 py-2 rounded-full border border-[var(--border)]">
          <ArrowLeft className="w-3.5 h-3.5" />
          Quitter
        </Link>
      </header>

      {/* Content centré verticalement sur toutes les tailles */}
      <main className="flex-1 flex items-center justify-center relative z-0 py-12 px-6">
        <div className="w-full max-w-md animate-fade-in bg-[var(--surface-card)] p-8 md:p-10 rounded-[2rem] border border-[var(--border)] shadow-2xl shadow-black/[0.03]">
          {children}
        </div>
      </main>
    </div>
  )
}
