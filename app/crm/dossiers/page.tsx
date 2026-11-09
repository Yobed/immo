'use client';

import React, { useState } from 'react';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Badge, DEAL_STAGE_LABELS } from '@/components/crm/ui';
import { useCrmContacts } from '@/lib/useCrmContacts';
import { INITIAL_DEALS, INITIAL_PROPERTIES, INITIAL_VISITS } from '@/lib/mock-data';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';
import type { Deal, DealStage, VisitStatus } from '@/lib/types';

const FLOW: DealStage[] = ['new_lead', 'qualified', 'visit_scheduled', 'offer_made', 'under_contract', 'closed_won'];
const VISIT_LABELS: Record<VisitStatus, string> = { scheduled: 'Prévue', completed: 'Faite', cancelled: 'Annulée', no_show: 'Absent' };

type Tab = 'baux' | 'visites';

/* ---------- Baux ---------- */

function LeaseBoard() {
  // ponytail: avancement local à la session ; persister quand une table des baux existera
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS.filter((d) => d.stage !== 'closed_lost'));
  const advance = (id: string) =>
    setDeals((prev) => prev.map((d) => {
      const next = FLOW[FLOW.indexOf(d.stage) + 1];
      return d.id === id && next ? { ...d, stage: next } : d;
    }));

  return (
    <LayoutGroup>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {FLOW.map((stage) => {
          const column = deals.filter((d) => d.stage === stage);
          return (
            <section key={stage} className="w-72 shrink-0 snap-start space-y-3">
              <header className="flex items-baseline justify-between px-1">
                <h2 className="text-sm font-semibold">{DEAL_STAGE_LABELS[stage]}</h2>
                <span className="text-xs text-ink-muted tabular-nums">{column.length}</span>
              </header>
              <ul className="space-y-2 min-h-[80px] rounded-2xl bg-white/50 p-1.5 ring-1 ring-line">
                <AnimatePresence>
                  {column.map((d) => {
                    const property = INITIAL_PROPERTIES.find((p) => p.id === d.property_id);
                    const isLast = stage === 'closed_won';
                    return (
                      <motion.li
                        key={d.id}
                        layoutId={d.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="rounded-xl bg-white p-3 ring-1 ring-line shadow-sm space-y-2"
                      >
                        <p className="text-sm font-medium leading-snug">{d.title}</p>
                        {property && <p className="text-xs text-ink-muted">{property.district}</p>}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold tabular-nums">{formatFCFA(d.deal_value)}</span>
                          {isLast ? (
                            <Badge tone="accent">Signé</Badge>
                          ) : (
                            <button
                              type="button"
                              onClick={() => advance(d.id)}
                              className="inline-flex items-center gap-0.5 h-8 pl-2.5 pr-1.5 rounded-lg text-xs text-ink-muted ring-1 ring-line hover:bg-ink hover:text-white hover:ring-ink transition-colors"
                              aria-label={`Passer « ${d.title} » à l'étape suivante`}
                            >
                              Avancer <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
                {column.length === 0 && <li className="py-6 text-center text-xs text-ink-light">Vide</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/* ---------- Visites ---------- */

function VisitAgenda() {
  const { contacts } = useCrmContacts();
  const visits = [...INITIAL_VISITS].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const days = [...new Set(visits.map((v) => v.scheduled_at.slice(0, 10)))];
  const dayLabel = (iso: string) => new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso));
  const time = (iso: string) => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

  return (
    <div className="space-y-8 max-w-3xl">
      {days.map((day) => (
        <section key={day} className="space-y-3">
          <h2 className="text-sm font-semibold first-letter:uppercase">{dayLabel(day)}</h2>
          <ul className="rounded-2xl bg-white ring-1 ring-line divide-y divide-line">
            {visits.filter((v) => v.scheduled_at.startsWith(day)).map((v) => {
              const property = INITIAL_PROPERTIES.find((p) => p.id === v.property_id);
              const contact = contacts.find((c) => c.id === v.contact_id);
              return (
                <li key={v.id} className="flex items-center gap-4 p-4">
                  <span className="w-14 shrink-0 text-lg font-semibold tabular-nums">{time(v.scheduled_at)}</span>
                  {property && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={property.images[0]} alt="" className="hidden sm:block h-12 w-16 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{property?.title ?? 'Bien'}</p>
                    <p className="text-sm text-ink-muted truncate">{contact?.full_name ?? 'Client'} · {v.agent_name.split(' (')[0]}</p>
                  </div>
                  <Badge tone={v.status === 'scheduled' ? 'dark' : 'neutral'}>{VISIT_LABELS[v.status]}</Badge>
                  {contact && v.status === 'scheduled' && (
                    <a
                      href={getWhatsAppLink(contact.phone, `Bonjour, nous vous confirmons la visite de ${property?.title ?? 'votre bien'} à ${time(v.scheduled_at)}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-paper"
                      aria-label={`Confirmer à ${contact.full_name}`}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* ---------- Page ---------- */

export default function DossiersPage() {
  const [tab, setTab] = useState<Tab>('baux');
  const tabs: { id: Tab; label: string }[] = [{ id: 'baux', label: 'Baux en cours' }, { id: 'visites', label: 'Visites' }];

  return (
    <div className="px-4 sm:px-8 py-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Dossiers</h1>
        <div role="tablist" aria-label="Type de dossier" className="inline-flex rounded-xl bg-white p-1 ring-1 ring-line">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`relative h-9 px-4 rounded-lg text-sm transition-colors ${tab === t.id ? 'text-white' : 'text-ink-muted hover:text-ink'}`}
            >
              {tab === t.id && <motion.span layoutId="dossier-tab" className="absolute inset-0 rounded-lg bg-ink" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          {tab === 'baux' ? <LeaseBoard /> : <VisitAgenda />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
