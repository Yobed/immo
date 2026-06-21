import Link from 'next/link'
import { Search, MessageCircle, Home, ShieldCheck, Flame, ArrowRight } from 'lucide-react'

export const metadata = {
  title: "Comment ça marche — Le parcours en 3 étapes",
  description: "Trouvez, contactez, visitez : 3 étapes simples pour louer ou acheter sereinement votre bien immobilier en Côte d'Ivoire. Coordonnées masquées, intermédiation totale, zéro arnaque.",
  keywords: ['comment louer abidjan', 'parcours achat immobilier ci', 'sécurité location appartement', 'bogbes groupe méthode'],
  alternates: { canonical: '/comment-ca-marche' },
  openGraph: {
    title: "Comment trouver un bien à Abidjan sans se faire arnaquer — BOGBE'S GROUPE",
    description: "3 étapes simples : trouver, contacter (coordonnées masquées), visiter avec un conseiller. La méthode anti-arnaque qui fait nos résultats.",
    type: 'article',
  },
}

export default function CommentCaMarchePage() {
  return (
    <main className="bg-[var(--background)] min-h-screen pt-12 pb-20">
      <div className="max-w-5xl mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-[var(--accent-luxury)] opacity-75" />
              <span className="relative rounded-full w-2 h-2 bg-[var(--accent-luxury)]" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-luxury)]">
              Comment ça marche
            </p>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-[var(--text)] mb-4 tracking-tight">
            Trouvez votre bien en <span className="italic font-serif text-[var(--accent-luxury)]">3 étapes</span>
          </h1>
          <p className="text-[var(--text-muted)] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            BOGBE&apos;S GROUPE accompagne chaque demande personnellement — pas de contact direct entre client
            et propriétaire, notre conseiller coordonne tout.
          </p>
        </div>

        {/* 3 steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <StepCard
            num={1}
            icon={Search}
            title="Tu cherches"
            desc="Parcours notre catalogue (biens vérifiés + offres flash WhatsApp) ou écris à Sapphire sur WhatsApp pour qu'elle te propose 5 biens correspondant à tes critères."
            cta={{ label: 'Voir le catalogue', href: '/catalogue' }}
          />
          <StepCard
            num={2}
            icon={MessageCircle}
            title="BOGBE'S coordonne"
            desc="Tu cliques 'Demander une visite', tu laisses ton nom + téléphone. Notre conseiller vérifie la disponibilité avec le propriétaire et organise le créneau."
            cta={{ label: 'Parler à Sapphire', href: 'https://wa.me/2250544872051', external: true }}
          />
          <StepCard
            num={3}
            icon={Home}
            title="Tu visites"
            desc="Le conseiller t'envoie l'adresse et l'horaire confirmé. Il t'accompagne à la visite et reste disponible jusqu'à la signature."
            cta={{ label: 'Découvrir', href: '/catalogue' }}
          />
        </div>

        {/* 2 sources expliquées */}
        <section className="mb-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)] mb-6 text-center">
            Deux sources, un seul service
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SourceCard
              icon={ShieldCheck}
              color="blue"
              tag="✓ Vérifié"
              title="Biens BOGBE'S"
              desc="Annonces publiées directement par les propriétaires ou agences inscrits sur la plateforme. Visites garanties, contrats sécurisés, paiements tracés."
            />
            <SourceCard
              icon={Flame}
              color="orange"
              tag="⚡ Offre flash"
              title="Opportunités WhatsApp"
              desc="Annonces sourcées en temps réel depuis les groupes WhatsApp publics. Notre conseiller valide la disponibilité avec le propriétaire avant tout engagement."
            />
          </div>
        </section>

        {/* CTA final */}
        <div className="text-center bg-surface-raised/50 border border-[var(--border)] rounded-3xl p-8 md:p-12">
          <h3 className="font-display text-2xl font-bold text-[var(--text)] mb-3">
            Prêt à commencer ?
          </h3>
          <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
            Pas besoin de créer un compte pour parcourir le catalogue ou demander une visite.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/catalogue"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent-luxury)] text-[var(--on-accent)] rounded-xl font-bold text-sm hover:opacity-90 transition-all"
            >
              Voir le catalogue
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/2250544872051?text=Bonjour%20BOGBE%27S%2C%20je%20cherche%20un%20bien"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Écrire à Sapphire
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

interface StepCardProps {
  num: number
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  cta: { label: string; href: string; external?: boolean }
}

function StepCard({ num, icon: Icon, title, desc, cta }: StepCardProps) {
  return (
    <div className="relative bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl p-6 hover:border-accent-luxury/40 transition-colors">
      <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-[var(--accent-luxury)] text-[var(--on-accent)] flex items-center justify-center font-display font-black text-lg shadow-md">
        {num}
      </div>
      <Icon className="w-8 h-8 text-[var(--accent-luxury)] mb-4 ml-2" />
      <h3 className="font-display text-xl font-bold text-[var(--text)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">{desc}</p>
      {cta.external ? (
        <a
          href={cta.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent-luxury)] hover:underline"
        >
          {cta.label} <ArrowRight className="w-3.5 h-3.5" />
        </a>
      ) : (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent-luxury)] hover:underline"
        >
          {cta.label} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  )
}

interface SourceCardProps {
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'orange'
  tag: string
  title: string
  desc: string
}

function SourceCard({ icon: Icon, color, tag, title, desc }: SourceCardProps) {
  const accent = color === 'blue' ? 'text-blue-500 bg-blue-500/10 border-blue-500/30' : 'text-orange-500 bg-orange-500/10 border-orange-500/30'
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${accent}`}>
          <Icon className="w-3 h-3" /> {tag}
        </span>
      </div>
      <h3 className="font-display text-lg font-bold text-[var(--text)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
    </div>
  )
}
