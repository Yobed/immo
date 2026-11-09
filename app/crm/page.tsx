'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CalendarClock, Check, ClipboardList, MessageCircle, PhoneCall, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Badge, DEAL_STAGE_LABELS, formatDateTime, openPalette } from '@/components/crm/ui';
import { INITIAL_DEALS, INITIAL_PROPERTIES, INITIAL_VISITS } from '@/lib/mock-data';
import { useCrmContacts } from '@/lib/useCrmContacts';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';

type FeedItem = {
  id: string;
  icon: LucideIcon;
  kind: string;
  title: string;
  detail: string;
  actionLabel: string;
  actionHref: string;
  isExternal: boolean;
};

// ponytail: tâches administratives en dur (comme avant) ; à brancher sur une vraie table de tâches plus tard
const TASKS = [
  { id: 'task-bail-z4', title: 'Envoyer le projet de bail, Penthouse Zone 4', detail: 'Mme Doumbia attend l’inventaire et le protocole de séquestre.', phone: '+2250555123456', message: 'Bonjour Mme Doumbia, voici le projet de bail pour le Penthouse Zone 4.' },
  { id: 'task-edl-bh', title: 'Valider l’état des lieux, Villa Beverly Hills', detail: 'Contrôler le rapport du commissaire de justice.', phone: '+2250788990011', message: 'Bonjour, le commissaire de justice a validé l’état des lieux.' },
];

const SIGNING_STAGES = ['offer_made', 'under_contract'];

export default function TodayPage() {
  const { contacts } = useCrmContacts();
  const [doneIds, setDoneIds] = useState<string[]>([]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  // seules les visites à venir (à partir d'aujourd'hui) sont à confirmer
  const visits = INITIAL_VISITS
    .filter((v) => v.status === 'scheduled' && new Date(v.scheduled_at) >= startOfToday)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const hotLeads = contacts.filter((c) => c.lead_score === 'hot').slice(0, 3);
  const signing = INITIAL_DEALS.filter((d) => SIGNING_STAGES.includes(d.stage));

  const feed: FeedItem[] = [
    ...visits.map((v) => {
      const property = INITIAL_PROPERTIES.find((p) => p.id === v.property_id);
      const contact = contacts.find((c) => c.id === v.contact_id);
      return {
        id: v.id,
        icon: CalendarClock,
        kind: 'Visite',
        title: `${formatDateTime(v.scheduled_at)} · ${property?.title ?? 'Bien'}`,
        detail: contact ? `Avec ${contact.full_name}` : v.agent_name,
        actionLabel: 'Confirmer',
        actionHref: getWhatsAppLink(contact?.phone ?? '', `Bonjour, nous vous confirmons la visite de ${property?.title ?? 'votre bien'}.`),
        isExternal: true,
      };
    }),
    ...TASKS.map((t) => ({
      id: t.id,
      icon: ClipboardList,
      kind: 'Dossier',
      title: t.title,
      detail: t.detail,
      actionLabel: 'Écrire',
      actionHref: getWhatsAppLink(t.phone, t.message),
      isExternal: true,
    })),
    ...hotLeads.map((c) => ({
      id: `lead-${c.id}`,
      icon: PhoneCall,
      kind: 'Prospect',
      title: `Rappeler ${c.full_name}`,
      detail: [c.budget_max && `jusqu'à ${formatFCFA(c.budget_max)}`, c.preferred_districts[0]].filter(Boolean).join(' · ') || c.phone,
      actionLabel: 'Fiche',
      actionHref: `/crm/contacts?id=${c.id}`,
      isExternal: false,
    })),
  ];

  const pending = feed.filter((item) => !doneIds.includes(item.id));
  const markDone = (id: string) => setDoneIds((prev) => [...prev, id]);

  const nextVisit = visits[0];
  const nextProperty = nextVisit && INITIAL_PROPERTIES.find((p) => p.id === nextVisit.property_id);
  const hour = new Date().getHours();
  const greeting = hour < 18 ? 'Bonjour' : 'Bonsoir';
  const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-12 max-w-6xl mx-auto space-y-10">
      {/* Accueil + recherche */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-ink-muted first-letter:uppercase">{today}</p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">{greeting}.</h1>
          <p className="text-lg text-ink-muted">
            {pending.length === 0
              ? 'Tout est fait pour aujourd’hui.'
              : `${pending.length} chose${pending.length > 1 ? 's' : ''} à faire, dont ${visits.length} visite${visits.length > 1 ? 's' : ''}.`}
          </p>
        </div>
        <button
          type="button"
          onClick={openPalette}
          className="w-full flex items-center gap-3 h-14 px-5 rounded-2xl bg-white ring-1 ring-line shadow-sm text-left text-ink-muted hover:ring-ink/25 hover:shadow-md transition-all"
        >
          <Search className="w-5 h-5" />
          <span className="flex-1">Chercher un contact, un bien, un quartier…</span>
          <kbd className="hidden sm:inline text-xs text-ink-light">Ctrl K</kbd>
        </button>
      </motion.section>

      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        {/* Fil d'actions */}
        <section aria-label="À faire" className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">À faire</h2>
            <span className="text-sm text-ink-muted tabular-nums">{doneIds.length} / {feed.length} faits</span>
          </div>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {pending.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                    exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
                    className="group flex items-center gap-4 rounded-2xl bg-white ring-1 ring-line p-4 hover:shadow-sm transition-shadow"
                  >
                    <button
                      type="button"
                      onClick={() => markDone(item.id)}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full ring-1 ring-line text-transparent hover:ring-ink hover:text-ink transition-colors"
                      aria-label={`Marquer « ${item.title} » comme fait`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink-muted">{item.kind}</p>
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-sm text-ink-muted truncate">{item.detail}</p>
                    </div>
                    {item.isExternal ? (
                      <a href={item.actionHref} target="_blank" rel="noopener noreferrer" className="btn-secondary h-9 px-3 shrink-0">
                        <MessageCircle className="h-4 w-4" /> <span className="hidden sm:inline">{item.actionLabel}</span>
                      </a>
                    ) : (
                      <Link href={item.actionHref} className="btn-secondary h-9 px-3 shrink-0">
                        <ArrowUpRight className="h-4 w-4" /> <span className="hidden sm:inline">{item.actionLabel}</span>
                      </Link>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          {pending.length === 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white ring-1 ring-line p-8 text-center text-ink-muted">
              Journée terminée. Bon travail.
            </motion.p>
          )}
        </section>

        {/* Colonne contexte */}
        <aside className="space-y-6">
          {nextVisit && nextProperty && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Prochaine visite</h2>
              <Link href={`/crm/dossiers`} className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-line">
                <div className="relative aspect-[16/10] overflow-hidden bg-paper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={nextProperty.images[0]} alt={nextProperty.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute left-3 top-3"><Badge tone="dark">{formatDateTime(nextVisit.scheduled_at)}</Badge></span>
                </div>
                <div className="p-4">
                  <p className="text-xs text-ink-muted">{nextProperty.district}</p>
                  <p className="font-medium leading-snug">{nextProperty.title}</p>
                </div>
              </Link>
            </section>
          )}

          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">Baux à signer</h2>
              <Link href="/crm/dossiers" className="text-sm text-ink-muted hover:text-ink">Tous</Link>
            </div>
            <ul className="rounded-2xl bg-white ring-1 ring-line divide-y divide-line">
              {signing.length === 0 && <li className="p-4 text-sm text-ink-muted">Aucun bail en signature.</li>}
              {signing.map((d) => (
                <li key={d.id} className="p-4 space-y-1">
                  <p className="text-sm font-medium leading-snug">{d.title}</p>
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={d.stage === 'under_contract' ? 'accent' : 'neutral'}>{DEAL_STAGE_LABELS[d.stage]}</Badge>
                    <span className="text-sm tabular-nums">{formatFCFA(d.deal_value)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
