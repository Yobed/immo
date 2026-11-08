import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#161412] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="text-5xl font-display font-medium text-[#947346]">404</div>
      <h1 className="text-2xl font-display font-medium text-[#161412]">Page introuvable</h1>
      <p className="text-xs text-[#68625c] max-w-sm font-light">
        La page ou le mandat que vous recherchez n&apos;existe pas ou a été déplacé dans notre inventaire.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-full bg-[#161412] hover:bg-[#947346] text-white text-xs font-semibold transition-colors shadow-warm-sm"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
