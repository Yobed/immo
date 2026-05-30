'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Wallet, 
  Share2, 
  Copy, 
  CheckCircle, 
  TrendingUp,
  Award,
  ArrowRight,
  Zap,
  Gem,
  Gift,
  Target
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export default function AmbassadeurPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [commissions, setCommissions] = useState<any[]>([])
  const [filleuls, setFilleuls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(prof)

      // Get Commissions
      const { data: comms } = await (supabase as any)
        .from('commissions')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
      
      setCommissions(comms || [])

      // Get Filleuls
      const { data: fils } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, created_at, avatar_url')
        .eq('parrain_id', user.id)
      
      setFilleuls(fils || [])

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    const link = `${window.location.origin}/register?ref=${profile?.code_parrainage}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const totalGaine = commissions
    .filter(c => c.statut === 'paye' || c.statut === 'valide')
    .reduce((acc, curr) => acc + Number(curr.montant), 0)

  const enAttente = commissions
    .filter(c => c.statut === 'en_attente')
    .reduce((acc, curr) => acc + Number(curr.montant), 0)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[var(--accent-luxury)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--text-muted)] font-light">Accès au portail ambassadeur...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-12">
        
        {/* Header Hero Section: Premium Sapphire Design */}
        <ScrollReveal>
          <section className="relative overflow-hidden rounded-[2.5rem] bg-[var(--midnight-muted)] border border-[var(--border)] p-8 md:p-16 text-[var(--text)]">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-luxury/10 blur-[130px] rounded-full -mr-80 -mt-80" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full -ml-40 -mb-40" />

            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center px-4 py-1.5 rounded-full bg-accent-luxury/10 text-[var(--accent-luxury)] text-[10px] font-bold tracking-[0.2em] uppercase border border-accent-luxury/20"
                >
                  <Gem className="w-3 h-3 mr-2" />
                  Programme Ambassadeur Elite
                </motion.div>
                
                <h1 className="text-5xl md:text-7xl font-display font-light leading-tight">
                  Construisez votre <br/>
                  <span className="italic font-serif text-[var(--accent-luxury)]">Réseau Immobilier.</span>
                </h1>
                
                <p className="text-lg text-[var(--text-muted)] font-light max-w-md leading-relaxed">
                  Devenez le partenaire stratégique de Deep Estate. Partagez l&apos;excellence et recevez des récompenses à la hauteur de votre influence.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="flex items-center gap-3 bg-background/50 border border-[var(--border)] px-4 py-3 rounded-2xl backdrop-blur-sm">
                    <Target className="w-5 h-5 text-[var(--accent-luxury)]" />
                    <span className="text-sm font-medium">2% de commission</span>
                  </div>
                  <div className="flex items-center gap-3 bg-background/50 border border-[var(--border)] px-4 py-3 rounded-2xl backdrop-blur-sm">
                    <Zap className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-medium">Validation 24h</span>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <Card className="bg-white/5 backdrop-blur-3xl border-white/10 shadow-2xl rounded-[2rem] overflow-hidden">
                  <CardContent className="p-8 md:p-12 text-center space-y-8">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.3em]">Votre Code de Parrainage</p>
                      <div className="text-4xl md:text-5xl font-mono font-bold tracking-[0.15em] text-[var(--accent-luxury)] py-4">
                        {profile?.code_parrainage || '---'}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Button 
                        onClick={copyToClipboard}
                        className="w-full h-16 bg-[var(--accent-luxury)] hover:bg-accent-luxury/90 text-[var(--midnight)] font-bold rounded-2xl transition-all shadow-xl shadow-accent-luxury/20 text-xs uppercase tracking-widest relative overflow-hidden group"
                      >
                        <AnimatePresence mode="wait">
                          {copied ? (
                            <motion.span 
                              key="copied"
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -20, opacity: 0 }}
                              className="flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-5 h-5" />
                              Lien Copié
                            </motion.span>
                          ) : (
                            <motion.span 
                              key="copy"
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -20, opacity: 0 }}
                              className="flex items-center justify-center gap-3"
                            >
                              <Share2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                              Partager mon lien
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Button>
                      <p className="text-[10px] text-[var(--text-muted)] font-light italic">
                        Le lien redirige vers l&apos;inscription et lie automatiquement vos comptes.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Dynamic Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              label: "Gains Validés", 
              value: `${totalGaine.toLocaleString()} FCFA`, 
              icon: <Wallet className="w-6 h-6" />, 
              color: "text-emerald-400",
              sub: "+12% vs mois dernier"
            },
            { 
              label: "En cours de validation", 
              value: `${enAttente.toLocaleString()} FCFA`, 
              icon: <Gift className="w-6 h-6" />, 
              color: "text-[var(--accent-luxury)]",
              sub: "Prochain versement le 05"
            },
            { 
              label: "Réseau Actif", 
              value: `${filleuls.length} Filleuls`, 
              icon: <Users className="w-6 h-6" />, 
              color: "text-indigo-400",
              sub: `${filleuls.filter(f => true).length} actifs cette semaine`
            }
          ].map((stat, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <Card className="bg-surface-raised/50 border-[var(--border)] hover:border-accent-luxury/30 transition-all rounded-3xl group">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] group-hover:scale-110 transition-transform ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <div className="text-xs font-medium text-[var(--accent-luxury)] flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Live
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-[var(--text)] tracking-tight">{stat.value}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-3 font-light">{stat.sub}</p>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        {/* Filleuls & Earnings Grid */}
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* History / Earnings */}
          <div className="lg:col-span-12">
            <ScrollReveal>
              <Card className="bg-surface-raised/30 border-[var(--border)] rounded-[2rem] overflow-hidden">
                <CardHeader className="p-8 border-b border-[var(--border)] bg-surface-raised/50">
                  <CardTitle className="text-xl font-display font-light flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-[var(--accent-luxury)]" />
                    Historique des Commissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest border-b border-[var(--border)]">
                          <th className="px-8 py-6 font-bold text-left">Date</th>
                          <th className="px-8 py-6 font-bold text-left">Source</th>
                          <th className="px-8 py-6 font-bold text-right">Montant</th>
                          <th className="px-8 py-6 font-bold text-right">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {commissions.length > 0 ? commissions.map((c) => (
                          <tr key={c.id} className="hover:bg-accent-luxury/5 transition-colors group">
                            <td className="px-8 py-6 text-sm font-light text-[var(--text-muted)]">
                              {new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--accent-luxury)] transition-colors">{c.description}</div>
                              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-tighter mt-1">{c.type_source.replace('_', ' ')}</div>
                            </td>
                            <td className="px-8 py-6 text-right font-bold text-[var(--text)] tabular-nums">
                              {Number(c.montant).toLocaleString()} <span className="text-[10px] text-[var(--text-muted)]">FCFA</span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                c.statut === 'paye' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                c.statut === 'en_attente' ? 'bg-accent-luxury/10 text-[var(--accent-luxury)] border border-accent-luxury/20' :
                                'bg-muted/10 text-[var(--text-muted)] border border-[var(--border)]'
                              }`}>
                                {c.statut}
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={4} className="px-8 py-24 text-center">
                              <div className="flex flex-col items-center gap-4">
                                <Gift className="w-12 h-12 text-[var(--border)]" />
                                <p className="text-[var(--text-muted)] font-light italic">Aucun gain enregistré. Votre réseau commence ici.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>

          {/* Filleuls Network Visualization could go here */}

        </div>

        {/* Resources & Guide */}
        <ScrollReveal>
          <section className="bg-gradient-to-r from-indigo-950 to-[var(--midnight)] rounded-[2.5rem] border border-[var(--border)] p-12 flex flex-col md:flex-row items-center justify-between gap-12 group">
            <div className="space-y-4 text-center md:text-left">
              <h3 className="text-3xl font-display font-light text-[var(--text)]">Besoin d&apos;aide pour <span className="italic font-serif text-[var(--accent-luxury)]">prospérer ?</span></h3>
              <p className="text-[var(--text-muted)] font-light max-w-lg">
                Consultez notre guide de l&apos;apporteur d&apos;affaires Elite pour maximiser vos gains et apprendre les meilleures techniques de parrainage digital.
              </p>
            </div>
            <Button className="h-16 px-10 bg-[var(--surface-card)] text-[var(--midnight)] hover:bg-[var(--accent-luxury)] hover:text-white font-bold rounded-2xl transition-all shadow-xl text-xs uppercase tracking-widest shrink-0">
              Ouvrir le guide PRO <ArrowRight className="ml-3 w-4 h-4" />
            </Button>
          </section>
        </ScrollReveal>

      </div>
    </div>
  )
}
