'use client'
import { motion, Variants } from 'framer-motion'

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

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  },
}

export function Features() {
  return (
    <section className="py-20 sm:py-24 bg-primary relative overflow-hidden -mt-10 rounded-t-[3rem] z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
      {/* Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] anim-orb-1 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }}/>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] anim-orb-2 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(26,77,143,0.4) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)' }}/>
      <div className="absolute inset-0 bg-dots opacity-10 pointer-events-none"/>

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full border border-secondary/30 bg-secondary/10 text-secondary text-sm font-sans font-bold uppercase tracking-wider">
            Fonctionnalités
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5">
            Tout pour votre immobilier
          </h2>
          <p className="font-sans text-white/60 text-lg max-w-xl mx-auto leading-relaxed">
            Une plateforme complète pour louer, vendre ou gérer vos biens en Côte d&apos;Ivoire.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto"
        >
          {features.map((f) => (
            <motion.div
              key={f.id}
              variants={itemVariants}
              className={`${f.span} group rounded-[2.5rem] p-2 bg-white/[0.03] border border-white/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-2 hover:shadow-2xl active:scale-[0.98]`}
            >
              <div className="relative h-full bg-white rounded-[calc(2.5rem-0.5rem)] p-8 overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                {/* Background glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] pointer-events-none rounded-[calc(2.5rem-0.5rem)]"
                  style={{ background: `radial-gradient(circle at 30% 40%, ${f.accent}08 0%, transparent 60%)` }}
                />
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none" style={{ background: `radial-gradient(circle, ${f.accent}05 0%, transparent 70%)` }}/>

                <div className="relative">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:-translate-y-1"
                  style={{ background: `${f.accent}15`, color: f.accent }}
                >
                  {f.icon}
                </div>
                <h3 className="font-display text-2xl font-bold text-[#0C2D5E] mb-3">{f.title}</h3>
                <p className="font-sans text-base text-[#1A4D8F]/70 leading-relaxed">{f.description}</p>

                {/* Bottom accent */}
                <div
                  className="mt-8 h-1 rounded-full w-10 group-hover:w-20 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-sm"
                  style={{ background: `linear-gradient(90deg, ${f.accent}, transparent)` }}
                />
              </div>

              {/* Featured badge */}
              {f.featured && (
                <div
                  className="absolute top-6 right-6 text-[10px] font-sans font-bold px-3 py-1.5 rounded-full shadow-sm"
                  style={{ background: `${f.accent}15`, color: f.accent, border: `1px solid ${f.accent}30` }}
                >
                  ⭐ Populaire
                </div>
              )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

