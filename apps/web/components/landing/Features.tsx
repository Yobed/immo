const features = [
  {
    icon: '🔭',
    title: 'Vue 360°',
    description:
      'Visitez les biens virtuellement avec notre technologie de visite immersive 360°. Gagnez du temps avant la visite physique.',
  },
  {
    icon: '💸',
    title: 'Paiement Wave & Orange Money',
    description:
      'Payez votre loyer ou acompte en toute sécurité via Wave, Orange Money, MTN ou CinetPay. 100% mobile.',
  },
  {
    icon: '📜',
    title: 'Contrats OHADA',
    description:
      'Générez des contrats de bail conformes au droit OHADA en quelques clics. Signatures électroniques incluses.',
  },
  {
    icon: '🤖',
    title: 'Chatbot IA',
    description:
      'Notre assistant intelligent répond à vos questions 24h/24, vous aide à trouver le bien idéal et planifie vos visites.',
  },
  {
    icon: '📊',
    title: 'Dashboard Analytics',
    description:
      'Propriétaires et agences : suivez vos performances en temps réel. Taux d\'occupation, revenus, leads qualifiés.',
  },
  {
    icon: '📱',
    title: 'Notifications WhatsApp',
    description:
      'Recevez des alertes instantanées sur WhatsApp pour chaque nouvelle demande, visite ou paiement reçu.',
  },
]

export function Features() {
  return (
    <section className="py-24 bg-[var(--surface)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="font-sans text-sm font-semibold text-[var(--secondary)] uppercase tracking-widest mb-3">
            Fonctionnalités
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--primary)] mb-4">
            Tout pour votre immobilier
          </h2>
          <p className="font-sans text-[var(--text-muted)] text-base max-w-xl mx-auto leading-relaxed">
            Tout ce dont vous avez besoin pour louer, vendre ou gérer vos biens en Côte d&apos;Ivoire.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group relative bg-[var(--primary)] rounded-[20px] p-7 overflow-hidden card-lift"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Dot pattern décoration */}
              <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />
              {/* Cercle décoratif */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-[var(--secondary)]/10 pointer-events-none" />

              <div className="relative">
                {/* Icône */}
                <div className="w-13 h-13 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-2xl mb-5 w-12 h-12">
                  {feature.icon}
                </div>

                {/* Titre */}
                <h3 className="font-display text-lg font-semibold text-white mb-2.5">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="font-sans text-sm text-white/70 leading-relaxed">
                  {feature.description}
                </p>

                {/* Ligne décorative dorée */}
                <div className="mt-5 h-px w-12 bg-gradient-to-r from-[var(--secondary)] to-transparent opacity-70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
