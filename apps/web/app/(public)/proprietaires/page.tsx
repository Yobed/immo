import { Metadata } from 'next';
import { ShieldCheck, TrendingUp, Users, Zap, Layout, Banknote, Sparkles, Award, ArrowRight } from 'lucide-react';
import * as motionClient from 'framer-motion/client';
import YieldCalculator from '@/components/owners/YieldCalculator';

export const metadata: Metadata = {
  title: 'Confiez-nous votre bien immobilier | Immo CI Prestige',
  description: 'Vous êtes propriétaire à Abidjan ? Vendez ou louez votre bien avec Immo CI Prestige. Gestion locative, estimation gratuite et marketing de luxe pour vos villas et appartements.',
  keywords: ['vendre bien immobilier abidjan', 'gestion locative abidjan', 'mettre en location appartement abidjan', 'estimation immobilière côte d\'ivoire', 'agence immobilière de luxe abidjan'],
  openGraph: {
    title: 'Propriétaires : Maximisez la valeur de votre patrimoine | Immo CI Prestige',
    description: 'Expertise, discrétion et résultats. Découvrez comment Immo CI transforme la gestion de vos propriétés d\'exception.',
  }
};

const valueProps = [
  {
    icon: <ShieldCheck className="w-8 h-8" />,
    title: "Sérénité Totale",
    description: "Nous filtrons rigoureusement chaque locataire et gérons l'intégralité des aspects juridiques et financiers sous le cadre OHADA."
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "Rendement Optimisé",
    description: "Grâce à notre expertise en résidences meublées, nous maximisons votre taux d'occupation et vos revenus locatifs."
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Cercle Privé",
    description: "Accès immédiat à notre base de données d'ambassadeurs et de clients internationaux à haut potentiel (expatriés, diplomates)."
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Marketing Immersif",
    description: "Visites 3D, drones et reportages photos ultra-haute définition pour sublimer votre bien dès le premier clic."
  }
];

export default function ProprietairesPage() {
  return (
    <main className="bg-[var(--background)] min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2000')] bg-cover bg-center grayscale opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--background)]/80 to-[var(--background)]" />
        
        <div className="relative z-10 container mx-auto px-6 text-center">
            <motionClient.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
                <span className="text-[var(--accent-luxury)] font-sans tracking-[0.5em] uppercase text-[10px] font-bold mb-8 block">Services aux Propriétaires</span>
                <h1 className="font-display text-5xl md:text-8xl font-bold text-[var(--text)] mb-8 leading-[0.9] tracking-tighter">
                    Donnez à votre bien<br/>
                    <span className="italic font-serif opacity-60">l&apos;Audience qu&apos;il mérite.</span>
                </h1>
                <p className="max-w-2xl mx-auto text-xl text-[var(--text-muted)] font-light leading-relaxed mb-12">
                    De la gestion locative premium à la vente confidentielle, Immo CI Prestige est le partenaire stratégique des propriétaires exigeants en Côte d&apos;Ivoire.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <button className="px-12 py-5 bg-[var(--text)] text-[var(--background)] rounded-sm font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-[var(--accent-luxury)] hover:text-off-white transition-all">
                        Estimer mon bien
                    </button>
                    <button className="px-12 py-5 border border-[var(--border)] text-[var(--text)] rounded-sm font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-[var(--surface-card)] transition-all">
                        Nous contacter
                    </button>
                </div>
            </motionClient.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-32 container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {valueProps.map((prop, idx) => (
            <motionClient.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 1 }}
                className="group p-10 bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl hover:border-[var(--accent-luxury)]/30 transition-all duration-700"
            >
              <div className="w-16 h-16 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center mb-8 text-[var(--accent-luxury)] group-hover:scale-110 transition-transform duration-700">
                {prop.icon}
              </div>
              <h3 className="font-display text-2xl font-bold text-[var(--text)] mb-4 tracking-tight">{prop.title}</h3>
              <p className="text-[var(--text-muted)] leading-relaxed font-light">{prop.description}</p>
            </motionClient.div>
          ))}
        </div>
      </section>

      {/* Calculator Section */}
      <section id="calculator" className="py-32 bg-[var(--background)] relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <h2 className="text-[var(--accent-luxury)] font-sans tracking-[0.5em] uppercase text-[10px] font-bold mb-8 block">Rentabilité</h2>
            <h3 className="font-display text-4xl md:text-6xl font-bold text-[var(--text)] mb-8 leading-[1] tracking-tight">
              Calculez votre <span className="italic font-serif opacity-60">Potentiel.</span>
            </h3>
            <p className="text-xl text-[var(--text-muted)] font-light leading-relaxed">
              Découvrez combien votre bien pourrait vous rapporter en passant au modèle de résidence meublée avec Sapphire.
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <YieldCalculator />
          </div>
        </div>
      </section>

      {/* Focused Content: Gestion Locative */}
      <section className="py-32 bg-[var(--surface-card)] border-y border-[var(--border)]">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-24 items-center">
            <motionClient.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5 }}
                className="relative aspect-square md:aspect-[4/5] rounded-[3rem] overflow-hidden border border-[var(--border)]"
            >
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?q=80&w=1500')] bg-cover bg-center grayscale hover:grayscale-0 transition-all duration-[3s]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] to-transparent opacity-60" />
                <div className="absolute bottom-12 left-12 right-12 p-8 bg-off-white/5 backdrop-blur-2xl rounded-2xl border border-off-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-luxury)] mb-4">Succès Client</p>
                    <p className="text-2xl font-display font-medium text-off-white tracking-tight italic">
                        &quot;Grâce à leur gestion, mon duplex à Cocody génère 40% de revenus supplémentaires en location meublée.&quot;
                    </p>
                    <p className="mt-4 text-off-white/40 text-[9px] uppercase tracking-[0.2em]">— Dr. Koffi, Propriétaire</p>
                </div>
            </motionClient.div>

            <motionClient.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5 }}
            >
                <h2 className="text-[var(--accent-luxury)] font-sans tracking-[0.5em] uppercase text-[10px] font-bold mb-8 block">Gestion Locative</h2>
                <h3 className="font-display text-4xl md:text-6xl font-bold text-[var(--text)] mb-8 leading-[1] tracking-tight">
                    Optimisation et <br/>
                    Rentabilité <span className="italic font-serif opacity-60">Garantie.</span>
                </h3>
                <div className="space-y-8">
                    {[
                        "Recouvrement automatique des loyers via Mobile Money",
                        "Maintenance préventive et curative de votre bien",
                        "Reporting mensuel digital détaillé sur votre espace",
                        "Assurance loyers impayés et protection juridique"
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-6">
                            <div className="w-6 h-6 rounded-full bg-[var(--accent-luxury)]/10 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-3 h-3 text-[var(--accent-luxury)]" />
                            </div>
                            <span className="text-lg text-[var(--text-muted)] font-light">{item}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-12 p-8 bg-[var(--background)] rounded-3xl border border-[var(--border)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-luxury)]/5 rounded-full blur-3xl group-hover:bg-[var(--accent-luxury)]/10 transition-all duration-700" />
                  <h4 className="font-display text-xl font-bold mb-4">Demander une étude personnalisée</h4>
                  <p className="text-sm text-[var(--text-muted)] mb-8 font-light">Laissez vos coordonnées, un expert Sapphire vous rappellera sous 24h pour une estimation gratuite.</p>
                  
                  <form className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Nom complet" 
                      className="w-full px-6 py-4 bg-transparent border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent-luxury)] transition-all outline-none"
                    />
                    <input 
                      type="email" 
                      placeholder="Email" 
                      className="w-full px-6 py-4 bg-transparent border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent-luxury)] transition-all outline-none"
                    />
                    <input 
                      type="tel" 
                      placeholder="Téléphone (WhatsApp)" 
                      className="w-full px-6 py-4 bg-transparent border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent-luxury)] transition-all outline-none"
                    />
                    <button className="w-full py-5 bg-[var(--text)] text-[var(--background)] rounded-xl font-bold text-[10px] uppercase tracking-[0.4em] hover:bg-[var(--accent-luxury)] hover:text-off-white transition-all">
                      Envoyer ma demande
                    </button>
                  </form>
                </div>
            </motionClient.div>
        </div>
      </section>

      {/* SEO rich text for owners */}
      <section className="py-32 container mx-auto px-6 max-w-4xl text-center">
        <h2 className="font-display text-4xl font-bold text-[var(--text)] mb-12 tracking-tight">Pourquoi choisir Immo CI pour votre bien à Abidjan ?</h2>
        <div className="space-y-8 text-[var(--text-muted)] font-light leading-relaxed text-lg">
            <p>
                Le marché immobilier à <strong>Abidjan</strong>, notamment dans les zones de <strong>Cocody (Riviera Golf, Ambassades), Zone 4, et Assinie</strong>, demande une expertise pointue. Immo CI Prestige ne se contente pas de lister votre propriété. Nous créons une véritable <strong>stratégie marketing immobilière de luxe</strong>.
            </p>
            <p>
                Nos outils de <strong>visite virtuelle 3D</strong> permettent aux investisseurs internationaux et à la diaspora de visiter votre appartement ou villa comme s&apos;ils y étaient, accélérant la prise de décision. Que vous souhaitiez <strong>vendre une villa à Abidjan</strong> ou <strong>mettre en location une résidence meublée de haut standing</strong>, notre équipe d&apos;experts vous accompagne de l&apos;estimation à la signature de l&apos;acte final.
            </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 border-t border-[var(--border)] bg-[var(--background)]">
        <div className="container mx-auto px-6 text-center">
            <div className="mb-12">
                <Award className="w-12 h-12 text-[var(--accent-luxury)] mx-auto mb-6" />
                <h3 className="font-display text-5xl font-bold text-[var(--text)] tracking-tight">Rejoignez l&apos;Excellence Immobilère</h3>
                <p className="mt-6 text-[var(--text-muted)] font-light">Prêt à maximiser le rendement de votre patrimoine ?</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a href="/register" className="inline-block px-14 py-6 bg-[var(--text)] text-[var(--background)] rounded-sm font-bold text-[12px] uppercase tracking-[0.5em] hover:bg-[var(--accent-luxury)] hover:text-off-white transition-all shadow-2xl">
                  Créer mon compte Propriétaire
              </a>
              <button className="px-14 py-6 border border-[var(--border)] text-[var(--text)] rounded-sm font-bold text-[12px] uppercase tracking-[0.5em] hover:bg-[var(--surface-card)] transition-all">
                  Prendre Rendez-vous
              </button>
            </div>
        </div>
      </section>
    </main>
  );
}
