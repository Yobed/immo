'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Share2, Volume2, VolumeX } from 'lucide-react';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import { useLiveProperties } from '@/lib/useLiveProperties';
import type { Property } from '@/lib/types';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';
import { AGENCY_NAME, AGENCY_PHONE, AGENCY_PHONE_DISPLAY, STATUS_LABELS, TYPE_LABELS, priceSuffix } from '@/lib/property-search';

/** Bruit de page synthétisé (Web Audio, aucun fichier). */
function playPageTurnSound() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const length = ctx.sampleRate * 0.18;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.35));
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.17);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
  } catch {
    // ponytail: son purement décoratif, on ignore un contexte audio refusé
  }
}

type PageFlipLike = {
  flipNext: () => void;
  flipPrev: () => void;
  flip: (page: number) => void;
  destroy: () => void;
};

const YEAR = new Date().getFullYear();

/* ---------- Pages du livre ---------- */

function CoverPage({ count }: { count: number }) {
  return (
    <div className="book-page" data-density="hard">
      <div className="h-full flex flex-col justify-between p-10 bg-ink text-white">
        <p className="text-sm font-medium">{AGENCY_NAME}</p>
        <div className="space-y-3">
          <p className="text-sm text-white/60 tabular-nums">Catalogue {YEAR}</p>
          <h2 className="text-4xl font-semibold tracking-tight leading-tight">Biens à louer à Abidjan</h2>
          <p className="text-white/70">{count} biens sélectionnés</p>
        </div>
        <p className="text-xs text-white/50">Tournez la page →</p>
      </div>
    </div>
  );
}

function SummaryPage({ properties }: { properties: Property[] }) {
  return (
    <div className="book-page">
      <div className="h-full p-10 flex flex-col bg-white">
        <h2 className="text-2xl font-semibold tracking-tight mb-6">Sommaire</h2>
        <ol className="space-y-3 text-sm">
          {properties.map((p, idx) => (
            <li key={p.id} className="flex items-baseline gap-3 border-b border-line pb-3">
              <span className="text-accent font-medium tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
              <span className="flex-1 min-w-0">
                <span className="block font-medium truncate">{p.title}</span>
                <span className="text-ink-muted">{p.district}</span>
              </span>
              <span className="text-ink-muted tabular-nums">p. {idx + 3}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function PropertyPage({ property, index }: { property: Property; index: number }) {
  const status = STATUS_LABELS[property.status];
  const specs = [
    ['Surface', `${property.surface} m²`],
    ['Chambres', property.bedrooms > 0 ? String(property.bedrooms) : 'n/a'],
    ['Titre', property.legal_status],
  ];
  const visitUrl = getWhatsAppLink(
    AGENCY_PHONE,
    `Bonjour, j'ai vu « ${property.title} » (réf. ${property.reference}) dans votre catalogue.`,
  );

  return (
    <div className="book-page">
      <div className="h-full flex flex-col bg-white">
        <div className="relative h-[46%] shrink-0 bg-paper">
          {/* ponytail: <img> natif, next/image ne survit pas au clonage DOM de page-flip */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={property.images[0]} alt={property.title} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          {status && (
            <span className="absolute top-4 left-4 rounded-md bg-white px-2 py-1 text-xs font-medium">{status}</span>
          )}
        </div>
        <div className="flex-1 p-7 flex flex-col gap-4 min-h-0">
          <div className="space-y-1">
            <p className="text-xs text-ink-muted">
              <span className="text-accent font-medium tabular-nums mr-2">{String(index + 1).padStart(2, '0')}</span>
              {TYPE_LABELS[property.property_type]} · {property.district}
            </p>
            <h3 className="text-xl font-semibold leading-snug line-clamp-2">{property.title}</h3>
          </div>
          <dl className="grid grid-cols-3 gap-px rounded-lg bg-line ring-1 ring-line overflow-hidden text-sm">
            {specs.map(([label, value]) => (
              <div key={label} className="bg-white px-3 py-2">
                <dt className="text-[11px] text-ink-muted">{label}</dt>
                <dd className="font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-ink-muted leading-relaxed line-clamp-4">{property.description}</p>
          <div className="mt-auto flex items-end justify-between gap-3 pt-3 border-t border-line">
            <p className="text-lg font-semibold tabular-nums">
              {formatFCFA(property.price)} <span className="text-sm font-normal text-ink-muted">{priceSuffix(property)}</span>
            </p>
            <a
              href={visitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-accent hover:underline underline-offset-4"
              onPointerDown={(e) => e.stopPropagation()}
            >
              Demander une visite
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackCover() {
  return (
    <div className="book-page" data-density="hard">
      <div className="h-full flex flex-col justify-end gap-3 p-10 bg-ink text-white">
        <p className="text-2xl font-semibold tracking-tight">Une visite vous intéresse ?</p>
        <p className="text-white/70">Contactez-nous sur WhatsApp ou par téléphone.</p>
        <p className="text-lg font-medium tabular-nums">{AGENCY_PHONE_DISPLAY}</p>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

export default function CataloguePage() {
  const { properties } = useLiveProperties();
  const bookRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlipLike | null>(null);
  const soundRef = useRef(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareLabel, setShareLabel] = useState('Partager');

  // Le livre se reconstruit si la liste des biens change (synchro live)
  const bookKey = properties.map((p) => p.id).join('|');

  useEffect(() => {
    soundRef.current = isSoundOn;
  }, [isSoundOn]);

  useEffect(() => {
    let instance: PageFlipLike | null = null;
    let isCancelled = false;

    (async () => {
      const container = bookRef.current;
      if (!container) return;
      const { PageFlip } = await import('page-flip');
      if (isCancelled) return;
      const flip = new PageFlip(container, {
        width: 520,
        height: 720,
        size: 'stretch',
        minWidth: 300,
        maxWidth: 640,
        minHeight: 420,
        maxHeight: 880,
        maxShadowOpacity: 0.35,
        showCover: true,
        mobileScrollSupport: false,
        flippingTime: 800,
      });
      const pages = container.querySelectorAll<HTMLElement>('.book-page');
      flip.loadFromHTML(pages);
      flip.on('flip', (e: { data: unknown }) => {
        setCurrentPage(Number(e.data));
        if (soundRef.current) playPageTurnSound();
      });
      setTotalPages(pages.length);
      setCurrentPage(0);
      instance = flip as unknown as PageFlipLike;
      flipRef.current = instance;
    })().catch(() => setTotalPages(0));

    return () => {
      isCancelled = true;
      try { instance?.destroy(); } catch { /* déjà détruit */ }
      flipRef.current = null;
    };
  }, [bookKey]);

  // Flèches du clavier
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') flipRef.current?.flipNext();
      if (e.key === 'ArrowLeft') flipRef.current?.flipPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Catalogue ${AGENCY_NAME}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareLabel('Lien copié');
    } catch {
      setShareLabel('Copie impossible');
    }
    setTimeout(() => setShareLabel('Partager'), 2000);
  };

  const isFirst = currentPage <= 0;
  const isLast = totalPages > 0 && currentPage >= totalPages - 1;

  return (
    <>
      <SiteHeader />

      <main className="bg-paper text-ink">
        <section className="site-container pt-10 pb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Catalogue {YEAR}</h1>
            <p className="text-ink-muted">
              Feuilletez la sélection, ou parcourez la{' '}
              <Link href="/biens" className="underline underline-offset-4 hover:text-ink">liste des biens</Link>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setIsSoundOn((v) => !v)} className="btn-secondary px-3" aria-pressed={isSoundOn} aria-label={isSoundOn ? 'Couper le son' : 'Activer le son'}>
              {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button type="button" onClick={toggleFullscreen} className="btn-secondary px-3 hidden sm:inline-flex" aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button type="button" onClick={handleShare} className="btn-secondary">
              <Share2 className="w-4 h-4" /> {shareLabel}
            </button>
          </div>
        </section>

        <section className="site-container pb-16">
          <div className="mx-auto max-w-5xl">
            <div key={bookKey} ref={bookRef} className="flipbook-root mx-auto">
              <CoverPage count={properties.length} />
              <SummaryPage properties={properties} />
              {properties.map((p, idx) => <PropertyPage key={p.id} property={p} index={idx} />)}
              {/* couverture + sommaire + biens + dos : on complète à un nombre pair pour que le dos tombe à droite */}
              {(properties.length + 3) % 2 === 1 && <div className="book-page"><div className="h-full bg-white" /></div>}
              <BackCover />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button type="button" onClick={() => flipRef.current?.flipPrev()} disabled={isFirst} className="btn-secondary px-3 disabled:opacity-40" aria-label="Page précédente">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-sm text-ink-muted tabular-nums min-w-[90px] text-center" aria-live="polite">
              {totalPages > 0 ? `Page ${currentPage + 1} / ${totalPages}` : 'Chargement…'}
            </p>
            <button type="button" onClick={() => flipRef.current?.flipNext()} disabled={isLast} className="btn-secondary px-3 disabled:opacity-40" aria-label="Page suivante">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-ink-muted">Flèches du clavier, ou faites glisser le coin d&apos;une page.</p>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
