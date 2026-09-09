import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Flame,
  GitMerge,
  Link2,
  ListChecks,
  LockKeyhole,
  MessageCircle,
  Megaphone,
  ScanSearch,
  Send,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type ModuleItem = {
  title: string
  href: string
  description: string
  action: string
  icon: LucideIcon
}

type ModuleGroup = {
  title: string
  description: string
  items: ModuleItem[]
}

const moduleGroups: ModuleGroup[] = [
  {
    title: 'À traiter',
    description: 'Le travail quotidien des conseillers et des administrateurs.',
    items: [
      { title: 'Suivi', href: '/admin/suivi', description: 'La boîte de réception des contacts, visites et réservations.', action: 'Ouvrir une demande, vérifier le bien et la source, puis approuver ou rejeter avec un motif.', icon: ClipboardCheck },
      { title: 'Prospects', href: '/admin/prospects', description: 'Une fiche unique par prospect et son pipeline commercial.', action: 'Assigner un conseiller, changer le statut, noter l’échange, planifier une relance et consulter l’historique.', icon: Users },
      { title: 'Performance', href: '/admin/performance', description: 'Le pilotage par période, conseiller, source, commune et type de bien.', action: 'Lire le tunnel contact → visite → réservation et traiter la file d’actions prioritaires.', icon: BarChart3 },
      { title: 'Qualité', href: '/admin/prospects/qualite', description: 'Le contrôle des fiches incomplètes ou non reliées.', action: 'Corriger les téléphones, responsables, sources, références de bien et dates manquantes.', icon: ScanSearch },
      { title: 'Guide', href: '/admin/guide', description: 'Ce mode d’emploi opérationnel.', action: 'Revenir ici pour les règles métier et la routine de traitement.', icon: BookOpen },
    ],
  },
  {
    title: 'Annonces',
    description: 'Publier et maintenir un catalogue fiable.',
    items: [
      { title: 'Validation', href: '/admin/validation', description: 'La file des biens soumis par un propriétaire ou une agence.', action: 'Vérifier identité, photos, informations et disponibilité avant de publier; toute décision refusée doit être motivée.', icon: ShieldCheck },
      { title: 'Modération', href: '/admin/moderation', description: 'Le contrôle des biens déjà publiés.', action: 'Suspendre ou envoyer à la corbeille un bien problématique, restaurer une erreur et purger seulement si la suppression est définitive.', icon: LockKeyhole },
      { title: 'Offres flash', href: '/admin/flash', description: 'Les offres courtes issues des agences ou de sources web.', action: 'Contrôler les photos, la disponibilité, l’état actif/inactif et restaurer une offre masquée.', icon: Flame },
    ],
  },
  {
    title: 'Équipe',
    description: 'Administrer les accès, les identités et les apporteurs.',
    items: [
      { title: 'Comptes', href: '/admin/comptes', description: 'Les rôles, agences, accès et biens rattachés.', action: 'Accorder uniquement le rôle nécessaire et vérifier l’agence responsable.', icon: UserCog },
      { title: 'KYC', href: '/admin/kyc', description: 'La revue des pièces d’identité et documents.', action: 'Accepter ou rejeter une pièce après contrôle; demander une nouvelle pièce si le dossier est incomplet.', icon: CheckCircle2 },
      { title: 'Démarcheurs', href: '/admin/demarcheurs', description: 'Les apporteurs et leurs contributions.', action: 'Suivre les offres apportées, l’attribution et les conversions associées.', icon: Link2 },
    ],
  },
  {
    title: 'Système',
    description: 'Acquisition et santé technique à surveiller.',
    items: [
      { title: 'Outreach', href: '/admin/outreach', description: 'Les campagnes WhatsApp d’acquisition.', action: 'Suivre envoyé, livré, lu, cliqué, converti, refusé ou bloqué; respecter chaque opt-out.', icon: Megaphone },
      { title: 'Erreurs', href: '/admin/errors', description: 'Les incidents applicatifs et contrôles de santé.', action: 'Prendre en charge une erreur ouverte, documenter l’investigation puis la résoudre ou l’ignorer avec une justification.', icon: AlertTriangle },
    ],
  },
]

const stages = [
  ['Nouveau', 'Demande reçue, personne encore non contactée.'],
  ['Contacté', 'Premier échange effectué et besoin qualifié.'],
  ['Visite planifiée', 'Bien, référence et créneau confirmés.'],
  ['Visite réalisée', 'Visite terminée et compte rendu enregistré.'],
  ['Relance', 'Une action précise et une date sont planifiées.'],
  ['Gagné', 'Réservation approuvée ou conversion confirmée.'],
  ['Perdu', 'Le dossier est fermé avec un motif de perte.'],
] as const

const rules = [
  { title: 'Un prospect = une fiche', text: 'Le téléphone normalisé est la clé de rapprochement. Avant de créer une fiche, rechercher le numéro ou l’e-mail. Un doublon se fusionne depuis Doublons; son historique reste conservé.', icon: GitMerge },
  { title: 'La demande garde son contexte', text: 'Chaque contact, visite ou réservation doit conserver la référence du bien et la source exacte (site, WhatsApp, agence ou campagne). Une statistique sans lien avec un bien ou une source est écartée du tunnel.', icon: Link2 },
  { title: 'Le conseiller reste l’intermédiaire', text: 'Le prospect ne reçoit pas le contact direct du propriétaire. Le conseiller confirme la disponibilité, organise la visite et partage uniquement les informations autorisées.', icon: MessageCircle },
  { title: 'Chaque changement est traçable', text: 'Les actions enregistrent l’acteur, la date, le statut et la version de la fiche. Une fiche devenue obsolète doit être rechargée avant d’être modifiée.', icon: Clock3 },
]

const alerts = [
  'Demande sans réponse depuis 24 heures',
  'Relance dont la date est dépassée',
  'Prospect actif sans conseiller',
  'Visite terminée sans compte rendu',
  'Réservation approuvée sans visite reliée',
  'Refus ou perte sans motif',
  'Événement CRM sans bien ou sans source',
  'Téléphone présent sur plusieurs fiches',
]

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-luxury)]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black text-[var(--text)] sm:text-2xl">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">{text}</p>
    </div>
  )
}

function ModuleCard({ item }: { item: ModuleItem }) {
  const Icon = item.icon
  return (
    <Link href={item.href} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent-luxury)] hover:shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-hover)] text-[var(--accent-luxury)]"><Icon className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2"><h3 className="font-bold text-[var(--text)]">{item.title}</h3><ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent-luxury)]" /></div>
          <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{item.description}</p>
          <p className="mt-3 text-xs font-medium leading-relaxed text-[var(--text)]">{item.action}</p>
        </div>
      </div>
    </Link>
  )
}

export default function AdminGuidePage() {
  return (
    <main className="min-h-screen bg-[var(--surface-hover)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/admin/performance" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"><ArrowLeft className="h-4 w-4" /> Retour à Performance</Link>

        <header className="rounded-3xl border border-[var(--border)] bg-[var(--surface-card)] p-6 sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-luxury)]">Mode d’emploi administrateur</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-[var(--text)] sm:text-4xl">Piloter une demande jusqu’à sa conclusion</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">Chaque dossier doit permettre de répondre en quelques secondes à quatre questions : qui s’en occupe, quel bien est concerné, quelle est la prochaine action et quand doit-elle être faite.</p>
          <nav aria-label="Sections du guide" className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
            <a href="#modules" className="rounded-full border border-[var(--border)] px-3 py-2 text-[var(--text)] hover:border-[var(--accent-luxury)]">Onglets</a>
            <a href="#parcours" className="rounded-full border border-[var(--border)] px-3 py-2 text-[var(--text)] hover:border-[var(--accent-luxury)]">Parcours</a>
            <a href="#regles" className="rounded-full border border-[var(--border)] px-3 py-2 text-[var(--text)] hover:border-[var(--accent-luxury)]">Règles métier</a>
            <a href="#routine" className="rounded-full border border-[var(--border)] px-3 py-2 text-[var(--text)] hover:border-[var(--accent-luxury)]">Routine</a>
          </nav>
        </header>

        <section id="modules" className="mt-10 scroll-mt-6">
          <SectionHeading eyebrow="Navigation" title="À quoi servent les onglets et sous-modules ?" text="Ouvrez d’abord À traiter pour les prospects en cours. Les trois autres groupes servent à sécuriser le catalogue, administrer l’équipe et surveiller le système." />
          <div className="space-y-8">
            {moduleGroups.map((group) => <div key={group.title}><div className="mb-3 flex items-baseline justify-between gap-3"><h3 className="text-base font-black text-[var(--text)]">{group.title}</h3><p className="text-right text-xs text-[var(--text-muted)]">{group.description}</p></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{group.items.map((item) => <ModuleCard key={item.href} item={item} />)}</div></div>)}
          </div>
        </section>

        <section id="parcours" className="mt-12 scroll-mt-6">
          <SectionHeading eyebrow="Pipeline CRM" title="Le parcours d’un prospect" text="Le statut décrit la situation actuelle. Il ne remplace jamais la note, le responsable et la prochaine action." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map(([title, text], index) => <div key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-4"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-hover)] text-xs font-black text-[var(--accent-luxury)]">{index + 1}</span><h3 className="font-bold text-[var(--text)]">{title}</h3></div><p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{text}</p></div>)}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5"><div className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-[var(--accent-luxury)]" /><h3 className="font-bold text-[var(--text)]">Transitions autorisées</h3></div><p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">Nouveau → Contacté → Visite planifiée → Visite réalisée → Relance. Gagné et Perdu ferment le dossier. Un dossier fermé ne revient en Relance que si une action et une date sont saisies.</p></div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5"><div className="flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-[var(--accent-luxury)]" /><h3 className="font-bold text-[var(--text)]">Du contact à la réservation</h3></div><p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">Un contact WhatsApp ou site est validé dans Suivi, rattaché au prospect, puis traité par le conseiller. Une visite possède un résultat et un compte rendu. Une réservation doit être reliée au bien et à la visite quand il y en a une.</p></div>
          </div>
        </section>

        <section id="regles" className="mt-12 scroll-mt-6">
          <SectionHeading eyebrow="Contrôles obligatoires" title="Règles métier à respecter" text="Ces règles protègent le prospect, évitent les faux indicateurs et garantissent une trace exploitable par toute l’équipe." />
          <div className="grid gap-3 md:grid-cols-2">{rules.map((rule) => { const Icon = rule.icon; return <div key={rule.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5"><div className="flex items-start gap-3"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-luxury)]" /><div><h3 className="font-bold text-[var(--text)]">{rule.title}</h3><p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{rule.text}</p></div></div></div> })}</div>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h3 className="font-bold text-amber-950">Champs qui rendent une action valide</h3><ul className="mt-3 grid gap-2 text-sm leading-relaxed text-amber-900 sm:grid-cols-2"><li>• Relance : prochaine action + date obligatoires.</li><li>• Perdu : motif obligatoire; si « autre », une note explique le cas.</li><li>• Visite non réalisée : résultat + raison + compte rendu.</li><li>• Refus d’une demande : motif écrit, compréhensible par le prospect.</li><li>• Gagné : réservation approuvée reliée au bien.</li><li>• Toute modification : version actuelle de la fiche.</li></ul></div>
        </section>

        <section id="routine" className="mt-12 scroll-mt-6">
          <SectionHeading eyebrow="Organisation" title="Routine de traitement et alertes" text="La priorité est déterminée par l’échéance et le risque client, pas par l’ordre d’arrivée dans l’écran." />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5"><div className="flex items-center gap-2"><Send className="h-5 w-5 text-[var(--accent-luxury)]" /><h3 className="font-bold text-[var(--text)]">Chaque matin</h3></div><ol className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--text-muted)]"><li><strong className="text-[var(--text)]">1.</strong> Traiter les demandes sans réponse depuis 24 h.</li><li><strong className="text-[var(--text)]">2.</strong> Faire les relances échues et renseigner le résultat.</li><li><strong className="text-[var(--text)]">3.</strong> Compléter les visites passées sans compte rendu.</li><li><strong className="text-[var(--text)]">4.</strong> Assigner les prospects actifs non attribués.</li></ol></div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-[var(--accent-luxury)]" /><h3 className="font-bold text-[var(--text)]">File d’alertes à vider</h3></div><ul className="mt-3 grid gap-2 text-sm leading-relaxed text-[var(--text-muted)] sm:grid-cols-2">{alerts.map((alert) => <li key={alert} className="flex gap-2"><span className="text-[var(--accent-luxury)]">•</span><span>{alert}</span></li>)}</ul></div>
          </div>
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5"><div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-[var(--accent-luxury)]" /><h3 className="font-bold text-[var(--text)]">Quand un prospect écrit sur WhatsApp</h3></div><p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">Ouvrir Suivi, retrouver ou créer la fiche par téléphone, vérifier la référence du bien, assigner un conseiller puis répondre depuis le parcours prévu. Si WhatsApp ne trouve pas le numéro, conserver la demande dans Suivi, vérifier le format international et utiliser la notification interne; ne jamais contourner le suivi en partageant le contact du propriétaire.</p></div>
        </section>

        <footer className="mt-10 flex flex-wrap gap-3 border-t border-[var(--border)] pt-6"><Link href="/admin/suivi" className="inline-flex items-center gap-2 rounded-xl bg-[var(--text)] px-4 py-3 text-sm font-bold text-[var(--surface-card)]">Ouvrir Suivi <ArrowRight className="h-4 w-4" /></Link><Link href="/admin/performance" className="rounded-xl border border-[var(--border)] bg-[var(--surface-card)] px-4 py-3 text-sm font-bold text-[var(--text)]">Voir Performance</Link><Link href="/admin/prospects/qualite" className="rounded-xl border border-[var(--border)] bg-[var(--surface-card)] px-4 py-3 text-sm font-bold text-[var(--text)]">Contrôler la qualité</Link><Link href="/admin/prospects/doublons" className="rounded-xl border border-[var(--border)] bg-[var(--surface-card)] px-4 py-3 text-sm font-bold text-[var(--text)]">Traiter les doublons</Link></footer>
      </div>
    </main>
  )
}
