export function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: '📋',
      title: 'Publiez',
      description:
        'Créez votre annonce en quelques minutes. Photos, description, prix en FCFA — votre bien est visible immédiatement.',
    },
    {
      number: '02',
      icon: '📅',
      title: 'Réservez',
      description:
        'Les locataires ou acheteurs intéressés vous contactent directement. Planifiez des visites en un clic.',
    },
    {
      number: '03',
      icon: '💳',
      title: 'Payez',
      description:
        'Paiement sécurisé via Wave, Orange Money, MTN ou CinetPay. Contrats OHADA générés automatiquement.',
    },
  ]

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Fond décoratif subtil */}
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />

      <div className="relative container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="font-sans text-sm font-semibold text-[var(--secondary)] uppercase tracking-widest mb-3">
            Simple & rapide
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--primary)] mb-4">
            Comment ça marche
          </h2>
          <p className="font-sans text-[var(--text-muted)] text-base max-w-xl mx-auto leading-relaxed">
            Trouver ou louer un bien immobilier en Côte d&apos;Ivoire n&apos;a jamais été aussi simple.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="relative group"
            >
              {/* Connecteur entre étapes */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(100%+4px)] w-[calc(100%-8px)] h-px bg-gradient-to-r from-[var(--primary)]/30 to-[var(--secondary)]/30 z-0" />
              )}

              <div className="relative bg-[var(--primary)] rounded-[20px] p-7 text-center overflow-hidden card-lift">
                {/* Pattern */}
                <div className="absolute inset-0 bg-dots opacity-15 pointer-events-none" />
                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

                {/* Numéro */}
                <div className="relative inline-flex items-center justify-center mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 font-mono text-[10px] font-bold text-[var(--primary)] bg-[var(--secondary)] rounded-pill px-1.5 py-0.5 leading-none">
                    {step.number}
                  </span>
                </div>

                <h3 className="font-display text-xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="font-sans text-sm text-white/70 leading-relaxed">
                  {step.description}
                </p>

                {/* Barre or bas */}
                <div className="mt-5 mx-auto h-0.5 w-10 bg-gradient-to-r from-[var(--secondary)] to-transparent rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
