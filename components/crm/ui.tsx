'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { DealStage, LeadScore } from '@/lib/types';

/** Événement qu'une page du CRM émet pour ouvrir la barre de recherche (écouté par le layout). */
export const OPEN_PALETTE_EVENT = 'crm:open-palette';
export const openPalette = () => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));

/* ---------- Libellés partagés ---------- */

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  new_lead: 'Nouvelle demande',
  qualified: 'Dossier qualifié',
  visit_scheduled: 'Visite planifiée',
  offer_made: 'Offre faite',
  under_contract: 'Bail en signature',
  closed_won: 'Signé',
  closed_lost: 'Perdu',
};

export const LEAD_SCORE_LABELS: Record<LeadScore, string> = {
  hot: 'Chaud',
  warm: 'Tiède',
  cold: 'Froid',
};

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

/* ---------- Mise en page ---------- */

type PageHeaderProps = { title: string; subtitle?: string; actions?: React.ReactNode };

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-line">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

type CardProps = { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; delay?: number };

/** Panneau blanc à bord fin, qui apparaît en glissant. */
export function Card({ title, action, children, className, delay = 0 }: CardProps) {
  const isReduced = useReducedMotion();
  return (
    <motion.section
      className={`rounded-2xl bg-white ring-1 ring-line ${className ?? ''}`}
      initial={isReduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {title && (
        <div className="flex items-center justify-between gap-3 px-5 pt-5">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </motion.section>
  );
}

/* ---------- Données ---------- */

type BadgeTone = 'neutral' | 'accent' | 'dark';
const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-paper text-ink-muted ring-line',
  accent: 'bg-accent/10 text-accent ring-accent/20',
  dark: 'bg-ink text-white ring-ink',
};

/** Pastille de statut : trois tons seulement (charte à 3 couleurs). */
export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

/** Barre de progression animée (0-100). */
export function Bar({ value, tone = 'ink', delay = 0 }: { value: number; tone?: 'ink' | 'accent'; delay?: number }) {
  const isReduced = useReducedMotion();
  const width = `${Math.max(0, Math.min(100, value))}%`;
  return (
    <div className="h-1.5 w-full rounded-full bg-paper overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${tone === 'accent' ? 'bg-accent' : 'bg-ink'}`}
        initial={isReduced ? false : { width: '0%' }}
        animate={{ width }}
        transition={{ delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-ink-muted">{children}</p>;
}
