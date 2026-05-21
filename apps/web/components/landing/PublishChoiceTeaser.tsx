import Link from 'next/link'
import { Building2, MessageCircle, ArrowUpRight, ShieldCheck, Zap, Crown } from 'lucide-react'

const TALLY_FORM_URL = 'https://tally.so/r/QKxNNp'

export function PublishChoiceTeaser() {
  return (
    <section className="relative py-16 md:py-24 bg-[var(--background)] overflow-hidden">
      {/* Decorative top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-luxury)]/30 to-transparent" />

      <div className="relative z-10 mx-auto px-4 md:px-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[var(--accent-luxury)] mb-4">
            Vous êtes propriétaire
          </p>
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.05] tracking-tight">
            Mettez votre bien<br />
            <span className="italic font-light text-[var(--accent-luxury)]">en lumière</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base mt-5 leading-relaxed">
            Deux parcours adaptés à votre profil. Vous choisissez la voie qui vous correspond.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto">
          {/* PRO - Premium card */}
          <Link
            href="/login?next=/mes-biens/nouveau"
            className="group relative bg-gradient-to-br from-[#1a1f2e] via-[#0f172a] to-[#020617] rounded-3xl p-7 md:p-9 border border-white/10 hover:border-[var(--accent-luxury)]/50 transition-all duration-500 overflow-hidden"
          >
            {/* Glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-[var(--accent-luxury)]/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10">
              {/* Crown badge */}
              <div className="absolute top-0 right-0 flex items-center gap-1 px-2.5 py-1 bg-[var(--accent-luxury)]/20 border border-[var(--accent-luxury)]/40 rounded-full">
                <Crown className="w-3 h-3 text-[var(--accent-luxury)]" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--accent-luxury)]">Premium</span>
              </div>

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-luxury)]/10 border border-[var(--accent-luxury)]/30 flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6 text-[var(--accent-luxury)]" strokeWidth={1.5} />
              </div>

              <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                Compte Propriétaire
              </h3>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-6">
                Inscrivez-vous, gérez vos annonces, suivez les visites, signez les baux en ligne. Affichez le badge <span className="text-[var(--accent-luxury)] font-semibold">Vérifié</span>.
              </p>

              <ul className="space-y-2.5 mb-8">
                {[
                  'Badge Vérifié + KYC',
                  'Tableau de bord complet',
                  'Bail électronique sécurisé',
                  'Quittances automatiques',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <span className="inline-flex items-center gap-2 text-sm font-bold text-white group-hover:gap-3 transition-all">
                Créer mon compte
                <ArrowUpRight className="w-4 h-4 text-[var(--accent-luxury)]" />
              </span>
            </div>
          </Link>

          {/* WhatsApp - Quick card */}
          <Link
            href={TALLY_FORM_URL}
            target="_blank"
            rel="noopener"
            className="group relative bg-gradient-to-br from-emerald-950/40 via-[#0f172a] to-[#020617] rounded-3xl p-7 md:p-9 border border-emerald-700/30 hover:border-emerald-500/50 transition-all duration-500 overflow-hidden"
          >
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10">
              <div className="absolute top-0 right-0 flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400">1 minute</span>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
              </div>

              <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                Publier via WhatsApp
              </h3>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-6">
                Collez votre annonce, ajoutez des photos. Notre IA extrait les infos. Vous validez en 1 clic via WhatsApp.
              </p>

              <ul className="space-y-2.5 mb-8">
                {[
                  'Aucun compte à créer',
                  'Extraction IA des champs',
                  'Validation par WhatsApp',
                  'Publication immédiate',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <span className="inline-flex items-center gap-2 text-sm font-bold text-white group-hover:gap-3 transition-all">
                Ouvrir le formulaire
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
