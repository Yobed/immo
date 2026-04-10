'use client'
import { useInView } from '@/hooks/useInView'

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
      </svg>
    ),
    title: 'Vue 360°',
    description: 'Visitez les biens virtuellement avec notre technologie de visite immersive 360°. Gagnez du temps avant la visite physique.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    title: 'Paiement Wave & Orange Money',
    description: 'Payez votre loyer ou acompte en toute sécurité via Wave, Orange Money, MTN ou CinetPay. 100% mobile.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title: 'Contrats OHADA',
    description: 'Générez des contrats de bail conformes au droit OHADA en quelques clics. Signatures électroniques incluses.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
    title: 'Assistant IA',
    description: 'Notre assistant intelligent répond à vos questions 24h/24, vous aide à trouver le bien idéal et planifie vos visites.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: 'Dashboard Analytics',
    description: 'Propriétaires et agences : suivez vos performances en temps réel. Taux d\'occupation, revenus, leads qualifiés.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.21 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l1.45-1.45a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
      </svg>
    ),
    title: 'Notifications WhatsApp',
    description: 'Recevez des alertes instantanées sur WhatsApp pour chaque nouvelle demande, visite ou paiement reçu.',
  },
]

export function Features() {
  const { ref, visible } = useInView(0.08)

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-24 bg-[var(--primary)]">
      <div className="container mx-auto px-4">
        <div className={`text-center mb-16 sr sr-up ${visible ? 'visible' : ''}`}>
          <p className="font-sans text-sm font-semibold text-[var(--secondary)] uppercase tracking-widest mb-3">
            Fonctionnalités
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Tout pour votre immobilier
          </h2>
          <p className="font-sans text-white/65 text-base max-w-xl mx-auto leading-relaxed">
            Tout ce dont vous avez besoin pour louer, vendre ou gérer vos biens en Côte d&apos;Ivoire.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`sr sr-up ${visible ? 'visible' : ''} group relative bg-white/8 border border-white/15 rounded-[20px] p-7 overflow-hidden card-lift hover:bg-white/12 transition-all duration-700`}
              style={{ transitionDelay: visible ? `${80 + i * 80}ms` : '0ms' }}
            >
              <div className="absolute inset-0 bg-dots opacity-15 pointer-events-none" />
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-[var(--secondary)]/10 pointer-events-none" />

              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white mb-5 group-hover:bg-white/15 group-hover:scale-110 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-2.5">{feature.title}</h3>
                <p className="font-sans text-sm text-white/70 leading-relaxed">{feature.description}</p>
                <div className="mt-5 h-px w-12 bg-gradient-to-r from-[var(--secondary)] to-transparent opacity-70 group-hover:w-20 transition-all duration-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
