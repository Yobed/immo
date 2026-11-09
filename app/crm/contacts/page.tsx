'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MessageCircle, Phone, Plus, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Badge, LEAD_SCORE_LABELS } from '@/components/crm/ui';
import { useCrmContacts } from '@/lib/useCrmContacts';
import { INITIAL_PROPERTIES } from '@/lib/mock-data';
import { calculateMatchScore, formatFCFA, getWhatsAppLink } from '@/lib/utils';
import type { Contact, LeadScore } from '@/lib/types';

const SCORES: LeadScore[] = ['hot', 'warm', 'cold'];
const TYPE_LABELS: Record<Contact['type'], string> = { buyer: 'Acheteur', tenant: 'Locataire', owner: 'Propriétaire', investor: 'Investisseur' };
const SOURCE_LABELS: Record<Contact['source'], string> = { whatsapp: 'WhatsApp', website: 'Site web', call: 'Appel', referral: 'Recommandation' };
const TIMELINE_LABELS: Record<NonNullable<Contact['timeline']>, string> = { immediate: 'Immédiat', '1_month': 'Sous 1 mois', '3_months': 'Sous 3 mois', undecided: 'Indéfini' };

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/* ---------- Fiche contact ---------- */

function ContactDetail({ contact, onScore, onBack }: { contact: Contact; onScore: (s: LeadScore) => void; onBack: () => void }) {
  const matches = INITIAL_PROPERTIES.map((p) => ({ property: p, ...calculateMatchScore(contact, p) }))
    .filter((m) => m.score > 25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const facts = [
    ['Profil', TYPE_LABELS[contact.type]],
    ['Budget', contact.budget_max ? `${contact.budget_min ? `${formatFCFA(contact.budget_min)} à ` : 'jusqu’à '}${formatFCFA(contact.budget_max)}` : 'Non précisé'],
    ['Quartiers', contact.preferred_districts.join(', ') || 'Indifférent'],
    ['Échéance', contact.timeline ? TIMELINE_LABELS[contact.timeline] : 'Non précisée'],
    ['Source', SOURCE_LABELS[contact.source]],
    ['Profession', contact.profession ?? 'Non précisée'],
  ];

  return (
    <motion.div
      key={contact.id}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      <button type="button" onClick={onBack} className="lg:hidden inline-flex items-center gap-1.5 text-sm text-ink-muted">
        <ArrowLeft className="h-4 w-4" /> Contacts
      </button>

      <header className="flex flex-wrap items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink text-lg font-semibold text-white">{initials(contact.full_name)}</span>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight">{contact.full_name}</h2>
          <p className="text-ink-muted tabular-nums">{contact.phone}{contact.email ? ` · ${contact.email}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <a href={getWhatsAppLink(contact.phone, `Bonjour ${contact.full_name},`)} target="_blank" rel="noopener noreferrer" className="btn-primary h-10">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="btn-secondary h-10 px-3" aria-label="Appeler">
            <Phone className="h-4 w-4" />
          </a>
        </div>
      </header>

      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-muted">Température</p>
        <div role="radiogroup" aria-label="Température du prospect" className="inline-flex rounded-xl bg-paper p-1 ring-1 ring-line">
          {SCORES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={contact.lead_score === s}
              onClick={() => onScore(s)}
              className={`relative h-9 px-4 rounded-lg text-sm transition-colors ${contact.lead_score === s ? 'text-white' : 'text-ink-muted hover:text-ink'}`}
            >
              {contact.lead_score === s && <motion.span layoutId="score-pill" className="absolute inset-0 rounded-lg bg-ink" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative">{LEAD_SCORE_LABELS[s]}</span>
            </button>
          ))}
        </div>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-px rounded-2xl bg-line ring-1 ring-line overflow-hidden">
        {facts.map(([label, value]) => (
          <div key={label} className="bg-white p-4">
            <dt className="text-xs text-ink-muted">{label}</dt>
            <dd className="mt-1 text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      {contact.notes && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Notes</h3>
          <p className="text-sm text-ink-muted leading-relaxed">{contact.notes}</p>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Biens qui correspondent</h3>
        {matches.length === 0 ? (
          <p className="text-sm text-ink-muted">Aucun bien ne correspond encore à ses critères.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-3">
            {matches.map(({ property, score }) => (
              <li key={property.id}>
                <Link href={`/crm/biens?id=${property.id}`} className="group block overflow-hidden rounded-xl bg-white ring-1 ring-line">
                  <div className="relative aspect-[4/3] overflow-hidden bg-paper">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={property.images[0]} alt={property.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute right-2 top-2"><Badge tone="dark">{score}%</Badge></span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{property.title}</p>
                    <p className="text-xs text-ink-muted tabular-nums">{formatFCFA(property.price)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {contact.whatsapp_history && contact.whatsapp_history.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Conversation WhatsApp</h3>
          <ol className="space-y-2 rounded-2xl bg-paper p-4 ring-1 ring-line max-h-[420px] overflow-y-auto">
            {contact.whatsapp_history.map((m) => {
              const isClient = m.sender === 'client';
              return (
                <li key={m.id} className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${isClient ? 'bg-white ring-1 ring-line' : 'bg-ink text-white'}`}>
                    <p className="whitespace-pre-line">{m.text}</p>
                    <p className={`mt-1 text-[11px] ${isClient ? 'text-ink-light' : 'text-white/50'}`}>{m.sender_name} · {m.timestamp}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </motion.div>
  );
}

/* ---------- Simulateur de message entrant ---------- */

function IncomingSimulator({ onClose, onReceived }: { onClose: () => void; onReceived: (c: Contact) => void }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !text.trim()) return;
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch('/api/crm/whatsapp/incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          senderName: name,
          text,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.contact) throw new Error(data.error ?? 'Réponse inattendue du serveur');
      onReceived(data.contact as Contact);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="space-y-2 rounded-2xl bg-white p-4 ring-1 ring-line">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Simuler un message WhatsApp entrant</p>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-paper" aria-label="Fermer"><X className="h-4 w-4" /></button>
        </div>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone (+225…)" required className="w-full h-10 rounded-lg ring-1 ring-line px-3 text-sm outline-none focus:ring-ink" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom (facultatif)" className="w-full h-10 rounded-lg ring-1 ring-line px-3 text-sm outline-none focus:ring-ink" />
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Message du client" required rows={3} className="w-full rounded-lg ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-ink" />
        {error && <p className="text-sm text-accent" role="alert">{error}</p>}
        <button type="submit" disabled={isSending} className="btn-primary w-full justify-center h-10 disabled:opacity-50">
          {isSending ? 'Analyse en cours…' : 'Envoyer'}
        </button>
      </div>
    </motion.form>
  );
}

/* ---------- Page ---------- */

function ContactsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { contacts, upsertContact, updateContact } = useCrmContacts();
  const [query, setQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState<LeadScore | 'all'>('all');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const selectedId = searchParams.get('id');
  const selected = contacts.find((c) => c.id === selectedId) ?? null;
  const select = (id: string | null) => router.replace(id ? `${pathname}?id=${id}` : pathname, { scroll: false });

  const q = normalize(query);
  const visible = contacts.filter(
    (c) =>
      (scoreFilter === 'all' || c.lead_score === scoreFilter) &&
      (!q || [c.full_name, c.phone, ...c.preferred_districts].some((f) => normalize(f).includes(q))),
  );
  // Sur ordinateur, on affiche le premier contact tant qu'aucun n'est choisi
  const shown = selected ?? (selectedId ? null : visible[0] ?? null);

  return (
    <div className="lg:grid lg:grid-cols-[380px_1fr] lg:h-screen">
      {/* Liste */}
      <section className={`${selectedId ? 'hidden lg:flex' : 'flex'} flex-col border-r border-line bg-white lg:h-screen`}>
        <div className="space-y-3 p-4 border-b border-line">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
            <button type="button" onClick={() => setIsSimulatorOpen((v) => !v)} className="btn-secondary h-9 px-3" aria-expanded={isSimulatorOpen}>
              <Plus className="h-4 w-4" /> Message entrant
            </button>
          </div>
          <AnimatePresence>
            {isSimulatorOpen && (
              <IncomingSimulator
                onClose={() => setIsSimulatorOpen(false)}
                onReceived={(c) => { upsertContact(c); setIsSimulatorOpen(false); select(c.id); }}
              />
            )}
          </AnimatePresence>
          <label className="flex items-center gap-2 h-10 px-3 rounded-xl bg-paper ring-1 ring-line">
            <Search className="h-4 w-4 text-ink-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, téléphone, quartier" className="flex-1 bg-transparent text-sm outline-none" />
          </label>
          <div className="flex gap-1.5">
            {(['all', ...SCORES] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScoreFilter(s)}
                aria-pressed={scoreFilter === s}
                className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${scoreFilter === s ? 'bg-ink text-white' : 'text-ink-muted hover:bg-paper'}`}
              >
                {s === 'all' ? `Tous (${contacts.length})` : LEAD_SCORE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto divide-y divide-line">
          {visible.length === 0 && <li className="p-8 text-center text-sm text-ink-muted">Aucun contact.</li>}
          {visible.map((c) => {
            const isActive = shown?.id === c.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => select(c.id)}
                  className={`relative w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? 'bg-paper' : 'hover:bg-paper/60'}`}
                >
                  {isActive && <motion.span layoutId="contact-active" className="absolute left-0 inset-y-2 w-0.5 rounded-full bg-accent" />}
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper ring-1 ring-line text-xs font-semibold">{initials(c.full_name)}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">{c.full_name}</span>
                    <span className="block text-xs text-ink-muted truncate">
                      {c.budget_max ? formatFCFA(c.budget_max) : c.phone}{c.preferred_districts[0] ? ` · ${c.preferred_districts[0]}` : ''}
                    </span>
                  </span>
                  {c.lead_score === 'hot' && <Badge tone="accent">Chaud</Badge>}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Fiche */}
      <section className={`${selectedId ? 'block' : 'hidden lg:block'} p-4 sm:p-8 lg:overflow-y-auto lg:h-screen`}>
        <AnimatePresence mode="wait">
          {shown ? (
            <ContactDetail
              key={shown.id}
              contact={shown}
              onScore={(s) => updateContact(shown.id, { lead_score: s })}
              onBack={() => select(null)}
            />
          ) : (
            <p className="py-24 text-center text-ink-muted">Choisissez un contact.</p>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<p className="p-8 text-ink-muted">Chargement…</p>}>
      <ContactsView />
    </Suspense>
  );
}
