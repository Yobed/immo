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
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Comment ça marche
          </h2>
          <p className="font-sans text-muted text-lg max-w-xl mx-auto">
            Trouver ou louer un bien immobilier en Côte d&apos;Ivoire n&apos;a jamais été aussi simple.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center p-6">
              <div className="relative mb-6">
                <span className="absolute -top-3 -right-3 font-mono text-xs font-bold text-secondary bg-secondary/10 rounded-pill px-2 py-0.5">
                  {step.number}
                </span>
                <div className="w-16 h-16 rounded-card bg-primary/10 flex items-center justify-center text-3xl">
                  {step.icon}
                </div>
              </div>
              <h3 className="font-display text-xl font-semibold text-primary mb-3">
                {step.title}
              </h3>
              <p className="font-sans text-muted text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
