import Link from 'next/link'
import { Building2, MessageCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react'

const TALLY_FORM_URL = 'https://tally.so/r/QKxNNp'

export function PublishChoiceTeaser() {
  return (
    <section className="py-12 md:py-20 bg-[var(--background)]">
      <div className="mx-auto px-4 md:px-6 max-w-7xl">
        <div className="text-center mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-luxury)] mb-3">
            Publier votre bien
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--text)] leading-tight max-w-2xl mx-auto">
            Deux façons de mettre votre bien en ligne
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {/* PRO */}
          <Link
            href="/login?next=/mes-biens/nouveau"
            className="group relative bg-white rounded-3xl p-7 border border-slate-200 hover:border-slate-900 hover:shadow-xl transition-all"
          >
            <div className="absolute top-5 right-5 px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-wider rounded-full">
              Recommandé
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900 mb-2">
              Compte Propriétaire
            </h3>
            <p className="text-slate-500 text-sm mb-5 leading-relaxed">
              Inscrivez-vous, gérez vos annonces, recevez les demandes de visite, signez en ligne. Votre profil affiche le badge <strong>Vérifié</strong>.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 mb-5">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Badge Vérifié + KYC possible
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Tableau de bord complet
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Gestion contrats / quittances
              </li>
            </ul>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 group-hover:gap-2 transition-all">
              Créer un compte
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          {/* WhatsApp Tally */}
          <Link
            href={TALLY_FORM_URL}
            target="_blank"
            rel="noopener"
            className="group relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-7 border border-green-200 hover:border-green-600 hover:shadow-xl transition-all"
          >
            <div className="absolute top-5 right-5 px-2 py-0.5 bg-green-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" />
              1 minute
            </div>
            <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900 mb-2">
              Publier via WhatsApp
            </h3>
            <p className="text-slate-600 text-sm mb-5 leading-relaxed">
              Collez votre annonce WhatsApp, ajoutez des photos. Notre IA extrait les infos automatiquement. Confirmez en 1 clic via WhatsApp.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 mb-5">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-green-700 shrink-0" />
                Aucun compte à créer
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-green-700 shrink-0" />
                Extraction IA des champs
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-green-700 shrink-0" />
                Validation par WhatsApp
              </li>
            </ul>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-green-700 group-hover:gap-2 transition-all">
              Ouvrir le formulaire
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
