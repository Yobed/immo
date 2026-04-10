'use client'
import { useInView } from '@/hooks/useInView'

const IconPublish = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="12" y1="18" x2="12" y2="12"/>
    <line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IconPayment = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
)

export function HowItWorks() {
  const { ref, visible } = useInView(0.1)

  const steps = [
    { icon: <IconPublish />, number: '01', title: 'Publiez', description: 'Créez votre annonce en quelques minutes. Photos, description, prix en FCFA — votre bien est visible immédiatement.' },
    { icon: <IconCalendar />, number: '02', title: 'Réservez', description: 'Les locataires ou acheteurs intéressés vous contactent directement. Planifiez des visites en un clic.' },
    { icon: <IconPayment />, number: '03', title: 'Payez', description: 'Paiement sécurisé via Wave, Orange Money, MTN ou CinetPay. Contrats OHADA générés automatiquement.' },
  ]

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />

      <div className="relative container mx-auto px-4">
        <div className={`text-center mb-16 sr sr-up ${visible ? 'visible' : ''}`}>
          <p className="font-sans text-sm font-semibold text-[var(--secondary)] uppercase tracking-widest mb-3">
            Simple &amp; rapide
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
              className={`sr sr-up ${visible ? 'visible' : ''} relative group`}
              style={{ transitionDelay: visible ? `${100 + i * 140}ms` : '0ms' }}
            >
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(100%+4px)] w-[calc(100%-8px)] h-px bg-gradient-to-r from-[var(--primary)]/20 to-[var(--secondary)]/20 z-0" />
              )}
              <div className="relative bg-[var(--primary)] rounded-[20px] p-7 text-center overflow-hidden card-lift">
                <div className="absolute inset-0 bg-dots opacity-15 pointer-events-none" />
                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

                <div className="relative inline-flex items-center justify-center mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 font-mono text-[10px] font-bold text-[var(--primary)] bg-[var(--secondary)] rounded-pill px-1.5 py-0.5 leading-none">
                    {step.number}
                  </span>
                </div>

                <h3 className="font-display text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="font-sans text-sm text-white/70 leading-relaxed">{step.description}</p>
                <div className="mt-5 mx-auto h-0.5 w-10 bg-gradient-to-r from-[var(--secondary)] to-transparent rounded-full group-hover:w-16 transition-all duration-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
