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
    <section className="py-20 bg-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Fonctionnalités premium
          </h2>
          <p className="font-sans text-muted text-lg max-w-xl mx-auto">
            Tout ce dont vous avez besoin pour louer, vendre ou gérer vos biens en Côte d&apos;Ivoire.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-card p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-btn bg-primary/10 flex items-center justify-center text-2xl mb-4">
                {feature.icon}
              </div>
              <h3 className="font-display text-lg font-semibold text-primary mb-2">
                {feature.title}
              </h3>
              <p className="font-sans text-sm text-muted leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
