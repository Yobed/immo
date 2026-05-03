'use client'
import { motion, Variants } from 'framer-motion'

const features = [
  {
    id: 'visite',
    title: 'Immersion 360°',
    description: 'Explorez chaque volume à distance avec notre technologie de visite immersive. Une expérience spatiale avant même le premier pas.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    accent: '#F97316',
    span: 'col-span-1 md:col-span-2',
    featured: true,
  },
  {
    id: 'paiement',
    title: 'Paiements Instantanés',
    description: 'Règlements sécurisés via Wave & Orange Money. Payez votre réservation en un clic, sans stress.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" fill="none"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    ),
    accent: '#0D9F6E',
    span: 'col-span-1',
  },
  {
    id: 'contrat',
    title: 'Sécurité Juridique',
    description: 'Baux certifiés conformes au droit ivoirien. Signez numériquement et dormez l\'esprit tranquille.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
    ),
    accent: '#1A4D8F',
    span: 'col-span-1',
  },
  {
    id: 'ia',
    title: 'Sapphire Intelligence',
    description: 'Un assistant IA dédié pour orchestrer vos visites et répondre à vos exigences 24h/24.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
    ),
    accent: '#F97316',
    span: 'col-span-1 md:col-span-2',
    featured: true,
  },
  {
    id: 'analytics',
    title: 'Vision Stratégique',
    description: 'Leads, performances et rendements analysés en temps réel.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" fill="none"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    ),
    accent: '#0D9F6E',
    span: 'col-span-1',
  },
  {
    id: 'notif',
    title: 'Sapphire WhatsApp',
    description: 'Une communication directe et instantanée pour ne jamais manquer l\'exceptionnel.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 0112 19a19.5 19.5 0 01-6-6 19.79 19.79 0 01-2-8.72A2 2 0 015.09 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.91 9.09a16 16 0 006 6l1.45-1.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
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
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
  },
}

export function Features() {
  return (
    <section className="py-[var(--section-py)] bg-[var(--background)] relative overflow-hidden -mt-10 rounded-t-[3rem] z-50">
      {/* Editorial Orbs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] pointer-events-none opacity-5" style={{ background: 'radial-gradient(circle, var(--accent-luxury) 0%, transparent 70%)', filter: 'blur(100px)' }}/>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] pointer-events-none opacity-10" style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', filter: 'blur(100px)' }}/>
      
      <div className="relative container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <div className="grid lg:grid-cols-2 gap-12 items-end mb-20">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[var(--text-muted)] font-sans tracking-[0.35em] uppercase text-xs mb-6 block">
              L'Écosystème BOGBE'S GROUPE
            </span>
            <h2 className="font-display text-4xl md:text-7xl font-light text-[var(--text)] leading-[1.1] tracking-tighter">
              Une Technologie du <br/>
              <span className="italic font-serif opacity-70">Sur-Mesure.</span>
            </h2>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="font-sans text-xl text-[var(--text-muted)] max-w-md leading-relaxed"
          >
            Chaque fonctionnalité est pensée pour sublimer l'immobilier et simplifier le prestige.
          </motion.p>
        </div>

        {/* Bento Grid with Luxury Styling */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.id}
              variants={itemVariants}
              className={`${f.span} group relative rounded-2xl overflow-hidden`}
            >
              <div className="h-full bg-[var(--surface-card)] border border-[var(--border)] p-8 backdrop-blur-3xl transition-all duration-700 ease-expo group-hover:bg-[var(--primary-light)] group-hover:border-[var(--border-hover)]">
                {/* Visual Accent */}
                <div 
                  className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
                  style={{ background: `radial-gradient(circle at top right, ${f.accent}20, transparent 70%)` }}
                />

                <div className="relative z-10">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-10 transition-transform duration-700 group-hover:scale-110"
                    style={{ background: 'var(--primary-light)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  >
                    {f.icon}
                  </div>
                  
                  <h3 className="font-display text-2xl font-light text-[var(--text)] mb-6 tracking-tight">
                    {f.title}
                  </h3>
                  <p className="font-sans text-base text-[var(--text-muted)] leading-loose">
                    {f.description}
                  </p>

                  <div className="mt-10 flex items-center gap-4">
                    <div className="h-[1px] flex-1 bg-[var(--border)]" />
                    {f.featured && (
                      <span className="text-xs font-sans tracking-[0.18em] uppercase text-[var(--text)] opacity-55">
                        Signature Item
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

