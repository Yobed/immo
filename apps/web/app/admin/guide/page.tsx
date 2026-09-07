import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

const steps = [
  ['1. Recevoir', 'Admin → Suivi : ouvrir la demande, vérifier le bien et la source, puis assigner un conseiller.'],
  ['2. Contacter', 'Passer à Contacté après le premier échange et renseigner la prochaine action avec une date.'],
  ['3. Planifier', 'Confirmer le bien, la référence et la date. Passer à Visite planifiée.'],
  ['4. Compte rendu', 'Après la visite, choisir Réalisée, Annulée, Absent ou Non conclue et écrire une note.'],
  ['5. Relancer', 'Passer à Relance, fixer une date et traiter chaque matin les retards dans Performance.'],
  ['6. Clôturer', 'Passer à Gagné pour une réservation confirmée ou Perdu avec un motif obligatoire.'],
]

export default function AdminGuidePage() {
  return <main className="min-h-screen bg-[var(--surface-hover)]"><div className="max-w-4xl mx-auto px-4 sm:px-6 py-8"><Link href="/admin/performance" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-5"><ArrowLeft className="w-4 h-4" /> Retour à Performance</Link><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-luxury)] mb-2">Mode d’emploi commercial</p><h1 className="text-2xl sm:text-3xl font-black text-[var(--text)]">Suivre un prospect de bout en bout</h1><p className="text-sm text-[var(--text-muted)] mt-2 mb-7">Une fiche à jour signifie toujours : un statut, un responsable, une prochaine action et une date.</p><div className="grid md:grid-cols-2 gap-4">{steps.map(([title, text]) => <section key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5"><div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /><div><h2 className="font-bold text-[var(--text)]">{title}</h2><p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">{text}</p></div></div></section>)}</div><section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-bold text-amber-900">Routine quotidienne</h2><p className="text-sm text-amber-800 mt-2 leading-relaxed">Chaque matin : demandes en attente, relances en retard, visites sans compte rendu, prospects non assignés. Chaque soir : mettre à jour les statuts et comptes rendus.</p></section><div className="mt-6 flex flex-wrap gap-3"><Link href="/admin/performance" className="rounded-xl bg-[var(--text)] px-4 py-3 text-sm font-bold text-[var(--surface-card)]">Voir Performance</Link><Link href="/admin/prospects/qualite" className="rounded-xl border border-[var(--border)] bg-[var(--surface-card)] px-4 py-3 text-sm font-bold text-[var(--text)]">Contrôler la qualité</Link><Link href="/admin/prospects/doublons" className="rounded-xl border border-[var(--border)] bg-[var(--surface-card)] px-4 py-3 text-sm font-bold text-[var(--text)]">Traiter les doublons</Link></div></div></main>
}
