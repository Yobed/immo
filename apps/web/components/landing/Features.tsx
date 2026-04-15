'use client'
import { useInView } from '@/hooks/useInView'

const features = [
  {
    id: 'visite',
    title: 'Visite 360°',
    description: 'Explorez chaque pièce à distance avec notre technologie de visite immersive. Gagnez du temps avant de vous déplacer.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    accent: '#F97316',
    span: 'col-span-1 md:col-span-2',
    featured: true,
  },
  {
    id: 'paiement',
    title: 'Wave & Orange Money',
    description: 'Paiements sécurisés 100% mobile.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    ),
    accent: '#0D9F6E',
    span: 'col-span-1',
  },
  {
    id: 'contrat',
    title: 'Contrats OHADA',
    description: 'Baux conformes générés et signés électroniquement.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
    ),
    accent: '#1A4D8F',
    span: 'col-span-1',
  },
  {
    id: 'ia',
    title: 'Assistant IA',
    description: 'Réponses instantanées 24h/24, recommandations personnalisées et planification de visites automatique.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
    ),
    accent: '#F97316',
    span: 'col-span-1 md:col-span-2',
    featured: true,
  },
  {
    id: 'analytics',
    title: 'Analytics Pro',
    description: 'Taux d\'occupation, revenus, leads en temps réel.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    ),
    accent: '#0D9F6E',
    span: 'col-span-1',
  },
  {
    id: 'notif',
    title: 'Notifications WhatsApp',
    description: 'Alertes instantanées pour chaque demande, visite ou paiement — directement sur WhatsApp.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 0112 19a19.5 19.5 0 01-6-6 19.79 19.79 0 01-2-8.72A2 2 0 015.09 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.91 9.09a16 16 0 006 6l1.45-1.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
    ),
    accent: '#1A4D8F',
    span: 'col-span-1',
  },
]

export function Features() {
  const { ref, visible } = useInView(0.06)

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-20 sm:py-28 bg-primary relative overflow-hidden">
      {/* Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] anim-orb-1 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }}/>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] anim-orb-2 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(26,77,143,0.4) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)' }}/>
      <div className="absolute inset-0 bg-dots opacity-10 pointer-events-none"/>

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <div className={`text-center mb-14 sr sr-up ${visible ? 'visible' : ''}`}>
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full border border-secondary/30 bg-secondary/10 text-secondary text-xs font-sans font-bold uppercase tracking-wider">
            Fonctionnalités
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5">
            Tout pour votre immobilier
          </h2>
          <p className="font-sans text-white/60 text-base max-w-xl mx-auto leading-relaxed">
            Une plateforme complète pour louer, vendre ou gérer vos biens en Côte d&apos;Ivoire.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <div
              key={f.id}
              className={`${f.span} sr sr-up ${visible ? 'visible' : ''} group relative card-glass rounded-[22px] p-7 overflow-hidden transition-all duration-500 hover:bg-white/10 hover:-translate-y-1 cursor-default`}
              style={{ transitionDelay: visible ? `${60 + i * 70}ms` : '0ms' }}
            >
              {/* Background glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[22px]"
                style={{ background: `radial-gradient(circle at 30% 40%, ${f.accent}18 0%, transparent 60%)` }}
              />
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none" style={{ background: `radial-gradient(circle, ${f.accent}12 0%, transparent 70%)` }}/>

              <div className="relative">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                  style={{ background: `${f.accent}18`, color: f.accent }}
                >
                  {f.icon}
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-2.5">{f.title}</h3>
                <p className="font-sans text-sm text-white/65 leading-relaxed">{f.description}</p>

                {/* Bottom accent */}
                <div
                  className="mt-6 h-px rounded-full w-10 group-hover:w-16 transition-all duration-500"
                  style={{ background: `linear-gradient(90deg, ${f.accent}, transparent)` }}
                />
              </div>

              {/* Featured badge */}
              {f.featured && (
                <div
                  className="absolute top-4 right-4 text-[10px] font-sans font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${f.accent}30`, color: f.accent, border: `1px solid ${f.accent}40` }}
                >
                  Populaire
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
