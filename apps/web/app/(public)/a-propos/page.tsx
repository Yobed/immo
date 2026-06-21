import Link from 'next/link'
import {
  ShieldCheck, Eye, MessageSquare, Map, Building2,
  Users, ArrowRight, Sparkles, MapPin, Mail,
} from 'lucide-react'

export const metadata = {
  title: "À propos — La plateforme immobilière sans arnaque de Côte d'Ivoire",
  description: "Notre mission : sécuriser le marché immobilier ivoirien. Découvrez notre méthode d'intermédiation totale, nos engagements et comment nous rejoindre.",
  keywords: ['bogbes groupe à propos', 'agence immobilière abidjan', 'plateforme immobilière côte d\'ivoire', 'mission immobilier ci'],
  alternates: { canonical: '/a-propos' },
  openGraph: {
    title: "À propos de BOGBE'S GROUPE — Sécuriser l'immobilier ivoirien",
    description: "Une équipe, une méthode anti-arnaque, une promesse : que chaque transaction immobilière en Côte d'Ivoire se déroule sans accroc.",
    type: 'website' as const,
  },
}

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Vérification KYC systématique',
    body: "Chaque propriétaire qui publie chez nous est identifié. Pièce d'identité, titre de propriété ou bail, RIB. Pas de zone grise.",
  },
  {
    icon: Eye,
    title: 'Coordonnées masquées par défaut',
    body: "Les visiteurs n'ont jamais le numéro direct du propriétaire. Toute mise en relation passe par notre équipe — c'est notre garantie anti-arnaque.",
  },
  {
    icon: MessageSquare,
    title: 'Intermédiation totale',
    body: "Notre conseiller centralise les demandes, vérifie la disponibilité, organise la visite. Vous n'êtes jamais seul face à un inconnu.",
  },
  {
    icon: Map,
    title: 'Veille marché temps réel',
    body: "Plus de 9 000 annonces captées en continu sur les groupes WhatsApp publics. Vous voyez le marché tel qu'il est, validation conseiller incluse.",
  },
]

const COMMITMENTS = [
  'Aucune publication d\'annonce sans vérification de l\'identité du propriétaire.',
  'Aucun paiement avant signature d\'un contrat validé par notre équipe.',
  'Remboursement intégral en cas de problème détecté avant la remise des clés.',
  'Réponse sous 1 heure ouvrée à chaque demande, par WhatsApp ou e-mail.',
]

const STATS = [
  { value: '9 000+', label: 'Annonces actives' },
  { value: '54', label: 'Communes couvertes' },
  { value: '< 1h', label: 'Délai de réponse' },
  { value: '0', label: 'Arnaque tolérée' },
]

export default function AProposPage() {
  return (
    <main className="bg-[var(--background)] min-h-screen pb-24">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-luxury/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 lg:px-8 pt-16 md:pt-24 pb-12">
          <div className="inline-flex items-center gap-2 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-luxury)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-luxury)]">
              Notre mission
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-black text-[var(--text)] leading-[1.05] tracking-tight mb-6">
            Sécuriser chaque transaction immobilière en Côte d&apos;Ivoire.
          </h1>
          <p className="font-sans text-base md:text-lg text-[var(--text-muted)] leading-relaxed max-w-2xl">
            Le marché immobilier ivoirien est riche, dynamique — et truffé d&apos;intermédiaires
            qui prennent des commissions sans jamais avoir vu le bien. BOGBE&apos;S GROUPE existe
            pour remettre de la transparence et de la responsabilité dans chaque visite, chaque
            paiement, chaque remise de clés.
          </p>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="max-w-5xl mx-auto px-4 lg:px-8 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl p-4 md:p-5 text-center"
            >
              <p className="font-display text-2xl md:text-3xl font-black text-[var(--text)] mb-1 tracking-tight">
                {s.value}
              </p>
              <p className="text-[10px] md:text-xs uppercase tracking-widest text-[var(--text-muted)] font-semibold">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PROBLEME ─── */}
      <section className="max-w-4xl mx-auto px-4 lg:px-8 mb-16">
        <div className="bg-[var(--surface-card)] border border-[var(--border)] rounded-3xl p-6 md:p-10">
          <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--text)] mb-4 tracking-tight">
            Le problème qu&apos;on résout
          </h2>
          <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed mb-3">
            En Côte d&apos;Ivoire, chercher un bien immobilier est trop souvent une épreuve :
            annonces fantômes, démarcheurs qui demandent une caution pour « visiter », photos
            volées d&apos;autres pays, propriétaires qui disparaissent après le premier acompte.
          </p>
          <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed">
            BOGBE&apos;S GROUPE remplace ce chaos par une chaîne simple et vérifiée :
            <strong className="text-[var(--text)]"> vous parlez à un conseiller identifié, qui
            parle au propriétaire identifié, et qui vous accompagne jusqu&apos;à la remise des
            clés.</strong>
          </p>
        </div>
      </section>

      {/* ─── METHODE / 4 PILIERS ─── */}
      <section className="max-w-5xl mx-auto px-4 lg:px-8 mb-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)] tracking-tight mb-2">
            Notre méthode
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            4 piliers qui rendent l&apos;arnaque structurellement impossible.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PILLARS.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.title}
                className="bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl p-5 md:p-6 hover:border-accent-luxury/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-accent-luxury/10 border border-accent-luxury/20 flex items-center justify-center text-[var(--accent-luxury)]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold text-[var(--text)] mb-1.5 tracking-tight">
                      {p.title}
                    </h3>
                    <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                      {p.body}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── ENGAGEMENTS ─── */}
      <section className="max-w-4xl mx-auto px-4 lg:px-8 mb-16">
        <div className="bg-gradient-to-br from-accent-luxury/10 to-transparent border border-accent-luxury/30 rounded-3xl p-6 md:p-10">
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck className="w-5 h-5 text-[var(--accent-luxury)]" />
            <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--text)] tracking-tight">
              Nos engagements
            </h2>
          </div>
          <ul className="space-y-3">
            {COMMITMENTS.map((c) => (
              <li key={c} className="flex items-start gap-3 text-sm md:text-base text-[var(--text)] leading-relaxed">
                <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent-luxury)]" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── EQUIPE ─── */}
      <section className="max-w-4xl mx-auto px-4 lg:px-8 mb-16">
        <div className="bg-[var(--surface-card)] border border-[var(--border)] rounded-3xl p-6 md:p-10">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--text)] tracking-tight mb-3">
                Une équipe basée à Abidjan
              </h2>
              <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed mb-4">
                Conseillers immobiliers terrain, modérateurs d&apos;annonces, équipe technique :
                une équipe ivoirienne qui connaît le marché, ses codes, ses quartiers. Notre
                conseiller principal &laquo; Sapphire &raquo; est joignable directement sur WhatsApp,
                7j/7.
              </p>
              <a
                href="https://wa.me/2250544872051?text=Bonjour%2C%20je%20souhaite%20en%20savoir%20plus%20sur%20BOGBE%27S%20GROUPE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700"
              >
                <MessageSquare className="w-4 h-4" />
                Parler à Sapphire sur WhatsApp
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="max-w-4xl mx-auto px-4 lg:px-8">
        <div className="bg-[#0a0e1a] text-white rounded-3xl p-6 md:p-10 text-center overflow-hidden relative">
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(249,115,22,0.3) 0%, transparent 50%)',
          }} />
          <div className="relative">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 tracking-tight">
              Prêt à chercher sereinement ?
            </h2>
            <p className="text-white/70 text-sm md:text-base mb-6 max-w-xl mx-auto">
              Plus de 9 000 biens vérifiés ou contrôlés par nos conseillers vous attendent.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/catalogue"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent-luxury)] text-white font-display font-bold text-[11px] uppercase tracking-[0.2em] hover:opacity-90 transition-opacity"
              >
                <Building2 className="w-4 h-4" />
                Voir le catalogue
              </Link>
              <Link
                href="/proprietaires"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-white/85 hover:text-white hover:border-white/30 font-sans text-[11px] uppercase tracking-[0.2em] transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Je suis propriétaire
              </Link>
            </div>
            <p className="text-white/40 text-[11px] mt-6 flex items-center justify-center gap-2">
              <Mail className="w-3 h-3" />
              Contact presse / partenariats : info@yobed-group.com
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
