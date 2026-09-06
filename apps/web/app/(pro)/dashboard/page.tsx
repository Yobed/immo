// app/(pro)/dashboard/page.tsx — Server Component (pas de 'use client')
import { createClient }   from '@/lib/supabase/server'
import { redirect }       from 'next/navigation'
import Link               from 'next/link'
import { RevenueBarChart, PaymentDonut, ConversionFunnel } from '@/components/dashboard/ChartLoaders'
import { KPICard }        from '@/components/dashboard/KPICard'
import { OccupancyGauge } from '@/components/dashboard/OccupancyGauge'
import { AlertesSection } from '@/components/dashboard/AlertesSection'
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist'
import type { Alerte }          from '@/components/dashboard/AlertesSection'
import type { RevenueData }     from '@/components/dashboard/RevenueBarChart'
import type { PaymentMethodData } from '@/components/dashboard/PaymentDonut'
import type { FunnelData }      from '@/components/dashboard/ConversionFunnel'

// Graphiques recharts (client-only) importés via un module client dédié :
// Next 15 interdit `ssr: false` avec next/dynamic dans un Server Component.
// Voir components/dashboard/ChartLoaders.tsx.

export const metadata = { title: "Dashboard — BOGBE'S GROUPE" }

type BienRow       = { id: string; titre: string; statut: string }
type PaiementRow   = { montant_net_fcfa: number; methode: string; created_at: string }
type VisiteRow     = { id: string; created_at: string }
type ContratRow    = { id: string; date_fin: string }
type AnalyticsRow  = { type: string; created_at: string }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // --- Fetch parallele pour minimiser le temps de chargement ---
  const now       = new Date()
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const debutAn12 = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Fetch biens d'abord pour avoir les IDs (necessaire pour filtrer reservations et visites)
  const { data: biens } = await sb
    .from('biens')
    .select('id, titre, statut')
    .eq('proprietaire_id', user.id)
    .in('statut', ['publie', 'loue'])

  const bienIds = (biens ?? []).map((b: BienRow) => b.id)

  // Fetch parallele de toutes les donnees dashboard
  const [
    { data: paiementsMois },
    { data: paiements12 },
    { data: reservationsAttente },
    { data: messagesNonLus },
    { data: visitesSansReponse },
    { data: contratsExpirant },
    { data: analyticsVues },
  ] = await Promise.all([
    sb
      .from('paiements')
      .select('montant_net_fcfa, methode, created_at')
      .eq('statut', 'succes')
      .gte('created_at', debutMois),

    sb
      .from('paiements')
      .select('montant_net_fcfa, methode, created_at')
      .eq('statut', 'succes')
      .gte('created_at', debutAn12),

    bienIds.length > 0
      ? sb
          .from('reservations')
          .select('id')
          .in('bien_id', bienIds)
          .eq('statut', 'en_attente')
      : Promise.resolve({ data: [] }),

    sb
      .from('messages')
      .select('id')
      .neq('expediteur_id', user.id)
      .eq('lu', false),

    bienIds.length > 0
      ? sb
          .from('visites')
          .select('id, created_at')
          .in('bien_id', bienIds)
          .eq('statut', 'demandee')
      : Promise.resolve({ data: [] }),

    sb
      .from('contrats')
      .select('id, date_fin')
      .eq('bailleur_id', user.id)
      .eq('statut', 'signe')
      .lte('date_fin', new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0]),

    sb
      .from('analytics_events')
      .select('type, created_at')
      .eq('user_id', user.id)
      .gte('created_at', debutAn12),
  ])

  // --- KPI DASH-01 ---
  const revenusMois    = (paiementsMois ?? []).reduce((s: number, p: PaiementRow) => s + Number(p.montant_net_fcfa), 0)
  const nbBiensActifs  = (biens ?? []).length
  const nbBiensLoues   = (biens ?? []).filter((b: BienRow) => b.statut === 'loue').length
  const tauxOccupation = nbBiensActifs > 0 ? Math.round(nbBiensLoues / nbBiensActifs * 100) : 0

  // --- Bar chart revenus 12 mois DASH-02 ---
  const moisFr = ['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec']
  const revenueByMonth: Record<string, number> = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    revenueByMonth[`${moisFr[d.getMonth()]} ${d.getFullYear()}`] = 0
  }
  ;(paiements12 ?? []).forEach((p: PaiementRow) => {
    const d   = new Date(p.created_at)
    const key = `${moisFr[d.getMonth()]} ${d.getFullYear()}`
    if (key in revenueByMonth) revenueByMonth[key] += Number(p.montant_net_fcfa)
  })
  const revenueData: RevenueData[] = Object.entries(revenueByMonth).map(([mois, total]) => ({
    mois: mois.split(' ')[0], // Afficher seulement "Jan", "Fev"...
    total,
  }))

  // --- Gauge occupation par bien DASH-03 ---
  const occupancyData = (biens ?? []).map((b: BienRow) => ({
    label:  b.titre,
    taux:   b.statut === 'loue' ? 100 : 0,
    statut: b.statut === 'loue' ? 'Loue' : 'Disponible',
  }))

  // --- Donut paiements par methode DASH-04 ---
  const methodMap: Record<string, { total: number; count: number }> = {}
  ;(paiements12 ?? []).forEach((p: PaiementRow) => {
    if (!methodMap[p.methode]) methodMap[p.methode] = { total: 0, count: 0 }
    methodMap[p.methode].total += Number(p.montant_net_fcfa)
    methodMap[p.methode].count++
  })
  const paymentData: PaymentMethodData[] = Object.entries(methodMap).map(([methode, d]) => ({
    methode,
    total: d.total,
    count: d.count,
  }))

  // --- Funnel conversion DASH-06 ---
  const vues     = (analyticsVues ?? []).filter((e: AnalyticsRow) => e.type === 'vue_bien').length
  const contacts = (analyticsVues ?? []).filter((e: AnalyticsRow) => e.type === 'contact').length
  const funnelData: FunnelData = {
    vues,
    contacts,
    visites:      (visitesSansReponse ?? []).length,
    reservations: (reservationsAttente ?? []).length,
    signatures:   (contratsExpirant ?? []).length,
  }

  // --- Alertes DASH-05 ---
  const alertes: Alerte[] = []

  // Visites sans reponse > 24h
  ;(visitesSansReponse ?? []).forEach((v: VisiteRow) => {
    const heures = (Date.now() - new Date(v.created_at).getTime()) / 3600000
    if (heures > 24) {
      alertes.push({
        id:      `visite-${v.id}`,
        type:    'attention',
        message: 'Demande de visite sans reponse depuis plus de 24h',
        lien:    '/visites',
      })
    }
  })

  // Contrats expirant dans 30 jours
  ;(contratsExpirant ?? []).forEach((c: ContratRow) => {
    alertes.push({
      id:      `contrat-${c.id}`,
      type:    'attention',
      message: `Contrat expirant le ${c.date_fin}`,
      lien:    '/quittances', // Redirige vers quittances à défaut de page contrats
    })
  })

  // Reservations en attente
  if ((reservationsAttente ?? []).length > 0) {
    alertes.push({
      id:      'reservations-attente',
      type:    'urgent',
      message: `${(reservationsAttente ?? []).length} reservation(s) en attente de confirmation`,
      lien:    '/reservations-recues',
    })
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl text-[var(--text)] mb-6">Dashboard</h1>

        {/* Onboarding checklist (auto-disparaît quand 4/4 ou dismissée) */}
        <OnboardingChecklist userId={user.id} />

        {/* KPI Cards — DASH-01 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            titre="Revenus du mois"
            valeur={`${revenusMois.toLocaleString('fr-FR')} FCFA`}
            sous_titre="Net apres commission"
          />
          <KPICard
            titre="Taux d'occupation"
            valeur={`${tauxOccupation}%`}
            sous_titre={`${nbBiensLoues}/${nbBiensActifs} biens loues`}
          />
          <KPICard
            titre="Reservations en attente"
            valeur={String((reservationsAttente ?? []).length)}
            alerte={(reservationsAttente ?? []).length > 0}
            href="/reservations-recues"
          />
          <KPICard
            titre="Messages non lus"
            valeur={String((messagesNonLus ?? []).length)}
            alerte={(messagesNonLus ?? []).length > 0}
            href="/messages"
          />
        </div>

        {/* Alertes DASH-05 */}
        {alertes.length > 0 && (
          <div className="mb-6">
            <AlertesSection alertes={alertes} />
          </div>
        )}

        {/* Graphiques — 2 colonnes sur desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Bar chart revenus DASH-02 */}
          <RevenueBarChart data={revenueData} />

          {/* Gauge occupation DASH-03 */}
          <OccupancyGauge biens={occupancyData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Link href="/mes-biens/nouveau" className="group bg-primary text-white p-6 rounded-card shadow-lg hover:shadow-primary/20 transition-all flex flex-col items-center justify-center gap-3 text-center">
              <div className="p-3 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              </div>
              <span className="font-display text-lg">Nouvelle annonce</span>
            </Link>
            <Link href="/mes-biens" className="group bg-[var(--surface)] border border-[var(--border)] p-6 rounded-card shadow-card hover:border-accent-luxury/40 transition-all flex flex-col items-center justify-center gap-3 text-center">
              <div className="p-3 bg-primary/5 rounded-full group-hover:scale-110 transition-transform text-primary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <span className="font-display text-lg text-[var(--text)]">Mes annonces</span>
            </Link>
            <Link href="/messages" className="group bg-[var(--surface)] border border-[var(--border)] p-6 rounded-card shadow-card hover:border-accent-luxury/40 transition-all flex flex-col items-center justify-center gap-3 text-center">
              <div className="p-3 bg-primary/5 rounded-full group-hover:scale-110 transition-transform text-primary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <span className="font-display text-lg text-[var(--text)]">Messages</span>
            </Link>
            <Link href="/profil" className="group bg-[var(--surface)] border border-[var(--border)] p-6 rounded-card shadow-card hover:border-accent-luxury/40 transition-all flex flex-col items-center justify-center gap-3 text-center">
              <div className="p-3 bg-primary/5 rounded-full group-hover:scale-110 transition-transform text-primary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <span className="font-display text-lg text-[var(--text)]">Profil & KYC</span>
            </Link>
          </div>

          {/* Donut paiements DASH-04 */}
          <PaymentDonut data={paymentData} />

          {/* Funnel conversion DASH-06 */}
          <ConversionFunnel data={funnelData} />
        </div>
      </div>
    </div>
  )
}
