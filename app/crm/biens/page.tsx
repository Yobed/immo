'use client';

import React, { Suspense, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpRight, MessageCircle, Plus, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Badge } from '@/components/crm/ui';
import { useLiveProperties } from '@/lib/useLiveProperties';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';
import { TYPE_LABELS } from '@/lib/property-search';
import type { Property, PropertyStatus, PropertyType } from '@/lib/types';

const STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: 'available', label: 'Disponible' },
  { value: 'reserved', label: 'Réservé' },
  { value: 'under_offer', label: 'Sous offre' },
  { value: 'rented', label: 'Loué' },
];
const statusLabel = (s: PropertyStatus) => STATUSES.find((x) => x.value === s)?.label ?? s;

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

/* ---------- Panneau latéral ---------- */

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex justify-end bg-ink/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-paper" aria-label="Fermer"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </motion.aside>
    </motion.div>
  );
}

function PropertySheet({ property, onStatus, onClose }: { property: Property; onStatus: (s: PropertyStatus) => void; onClose: () => void }) {
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/biens/${property.id}`;
  return (
    <Sheet title={property.reference} onClose={onClose}>
      <div className="space-y-6">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-paper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={property.images[0]} alt={property.title} className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-sm text-ink-muted">{TYPE_LABELS[property.property_type]} · {property.district}</p>
          <h3 className="text-xl font-semibold leading-snug">{property.title}</h3>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatFCFA(property.price)} <span className="text-sm font-normal text-ink-muted">{property.operation === 'rent' ? '/ mois' : ''}</span></p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-ink-muted">Statut</p>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => onStatus(s.value)}
                aria-pressed={property.status === s.value}
                className={`h-10 rounded-xl text-sm transition-colors ${property.status === s.value ? 'bg-ink text-white' : 'ring-1 ring-line hover:bg-paper'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-px rounded-2xl bg-line ring-1 ring-line overflow-hidden text-sm">
          {[['Surface', `${property.surface} m²`], ['Chambres', String(property.bedrooms)], ['Titre', property.legal_status]].map(([k, v]) => (
            <div key={k} className="bg-white p-3"><dt className="text-xs text-ink-muted">{k}</dt><dd className="font-medium tabular-nums">{v}</dd></div>
          ))}
        </dl>
        <div className="flex gap-2">
          <a href={`/biens/${property.id}`} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-1 justify-center">
            Fiche publique <ArrowUpRight className="h-4 w-4" />
          </a>
          <a
            href={getWhatsAppLink('', `${property.title} à ${property.district}, ${formatFCFA(property.price)}. ${publicUrl}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex-1 justify-center"
          >
            <MessageCircle className="h-4 w-4" /> Partager
          </a>
        </div>
      </div>
    </Sheet>
  );
}

function AddPropertySheet({ onCreate, onClose }: { onCreate: (p: Property) => void; onClose: () => void }) {
  const [form, setForm] = useState({ title: '', district: '', type: 'villa' as PropertyType, price: '', surface: '', bedrooms: '', image: '' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.price);
    if (!form.title.trim() || !form.district.trim() || !(price > 0)) return;
    onCreate({
      id: `prop-${Date.now()}`,
      title: form.title.trim(),
      slug: form.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-'),
      reference: `REF-${Date.now().toString().slice(-4)}`,
      description: '',
      operation: 'rent',
      property_type: form.type,
      status: 'available',
      price,
      currency: 'FCFA',
      city: 'Abidjan',
      district: form.district.trim(),
      surface: Number(form.surface) || 0,
      bedrooms: Number(form.bedrooms) || 0,
      bathrooms: 0,
      has_pool: false,
      has_generator: false,
      has_security: false,
      has_parking: false,
      legal_status: 'En cours',
      featured: false,
      images: [form.image.trim() || DEFAULT_IMAGE],
      created_at: new Date().toISOString(),
    });
  };

  const field = 'w-full h-11 rounded-xl ring-1 ring-line px-3 text-sm outline-none focus:ring-ink';
  return (
    <Sheet title="Nouveau bien" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5"><span className="text-sm font-medium">Titre</span><input required value={form.title} onChange={set('title')} className={field} placeholder="Villa 5 pièces avec piscine" /></label>
        <label className="block space-y-1.5"><span className="text-sm font-medium">Quartier</span><input required value={form.district} onChange={set('district')} className={field} placeholder="Cocody Riviera Golf" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5"><span className="text-sm font-medium">Type</span>
            <select value={form.type} onChange={set('type')} className={field}>
              {(Object.keys(TYPE_LABELS) as PropertyType[]).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5"><span className="text-sm font-medium">Loyer / mois</span><input required type="number" min={1} value={form.price} onChange={set('price')} className={field} placeholder="2500000" /></label>
          <label className="block space-y-1.5"><span className="text-sm font-medium">Surface (m²)</span><input type="number" min={0} value={form.surface} onChange={set('surface')} className={field} /></label>
          <label className="block space-y-1.5"><span className="text-sm font-medium">Chambres</span><input type="number" min={0} value={form.bedrooms} onChange={set('bedrooms')} className={field} /></label>
        </div>
        <label className="block space-y-1.5"><span className="text-sm font-medium">Photo (lien)</span><input type="url" value={form.image} onChange={set('image')} className={field} placeholder="https://…" /></label>
        <button type="submit" className="btn-primary w-full justify-center">Ajouter le bien</button>
      </form>
    </Sheet>
  );
}

/* ---------- Page ---------- */

function PropertiesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { properties, setProperties } = useLiveProperties();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<PropertyStatus | 'all'>('all');
  const [isAdding, setIsAdding] = useState(false);

  const selected = properties.find((p) => p.id === searchParams.get('id')) ?? null;
  const select = (id: string | null) => router.replace(id ? `${pathname}?id=${id}` : pathname, { scroll: false });

  const q = query.trim().toLowerCase();
  const visible = properties.filter(
    (p) => (status === 'all' || p.status === status) && (!q || [p.title, p.district, p.reference].some((f) => f.toLowerCase().includes(q))),
  );
  // ponytail: modifications locales (comme l'ancienne page) ; persister via /api/properties quand l'API acceptera l'écriture
  const updateStatus = (id: string, s: PropertyStatus) => setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status: s } : p)));

  return (
    <div className="px-4 sm:px-8 py-8 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Biens</h1>
          <p className="text-ink-muted">{properties.length} biens sous mandat</p>
        </div>
        <button type="button" onClick={() => setIsAdding(true)} className="btn-primary"><Plus className="h-4 w-4" /> Ajouter un bien</button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex flex-1 min-w-[220px] items-center gap-2 h-10 px-3 rounded-xl bg-white ring-1 ring-line">
          <Search className="h-4 w-4 text-ink-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Titre, quartier, référence" className="flex-1 bg-transparent text-sm outline-none" />
        </label>
        <div className="flex gap-1.5 overflow-x-auto">
          {[{ value: 'all' as const, label: 'Tous' }, ...STATUSES].map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              aria-pressed={status === s.value}
              className={`h-9 px-3 rounded-lg text-sm whitespace-nowrap transition-colors ${status === s.value ? 'bg-ink text-white' : 'text-ink-muted hover:bg-white'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-20 text-center text-ink-muted">Aucun bien ne correspond.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => (
            <motion.li key={p.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <button type="button" onClick={() => select(p.id)} className="group block w-full text-left overflow-hidden rounded-2xl bg-white ring-1 ring-line hover:shadow-md transition-shadow">
                <div className="relative aspect-[4/3] overflow-hidden bg-paper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.images[0]} alt={p.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute left-3 top-3"><Badge tone={p.status === 'available' ? 'dark' : 'neutral'}>{statusLabel(p.status)}</Badge></span>
                </div>
                <div className="p-4 space-y-1">
                  <p className="text-xs text-ink-muted">{p.reference} · {p.district}</p>
                  <p className="font-medium truncate">{p.title}</p>
                  <p className="font-semibold tabular-nums">{formatFCFA(p.price)}</p>
                </div>
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {selected && <PropertySheet key="detail" property={selected} onStatus={(s) => updateStatus(selected.id, s)} onClose={() => select(null)} />}
        {isAdding && (
          <AddPropertySheet
            key="add"
            onClose={() => setIsAdding(false)}
            onCreate={(created) => { setProperties((prev) => [created, ...prev]); setIsAdding(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CrmPropertiesPage() {
  return (
    <Suspense fallback={<p className="p-8 text-ink-muted">Chargement…</p>}>
      <PropertiesView />
    </Suspense>
  );
}
