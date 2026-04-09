import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-[var(--border)] bg-white px-4 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-display font-bold text-xs">IC</div>
          <span className="font-display text-lg text-primary">Immo CI</span>
        </Link>
      </header>
      <main className="flex items-center justify-center py-12 px-4">
        {children}
      </main>
    </div>
  )
}
