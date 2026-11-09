import React from 'react';
import Link from 'next/link';
import { AGENCY_NAME, AGENCY_PHONE, AGENCY_PHONE_DISPLAY } from '@/lib/property-search';
import { getWhatsAppLink } from '@/lib/utils';

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper mt-auto">
      <div className="site-container py-12 grid gap-10 sm:grid-cols-3 text-sm">
        <div className="space-y-2">
          <p className="font-semibold text-ink">{AGENCY_NAME}</p>
          <p className="text-ink-muted max-w-xs">Location de villas, appartements et bureaux à Abidjan et Assinie.</p>
        </div>
        <div className="space-y-2">
          <p className="font-medium text-ink">Explorer</p>
          <ul className="space-y-1.5 text-ink-muted">
            <li><Link href="/biens" className="hover:text-ink">Tous les biens</Link></li>
            <li><Link href="/catalogue" className="hover:text-ink">Catalogue</Link></li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="font-medium text-ink">Contact</p>
          <ul className="space-y-1.5 text-ink-muted">
            <li><a href={`tel:+${AGENCY_PHONE}`} className="hover:text-ink tabular-nums">{AGENCY_PHONE_DISPLAY}</a></li>
            <li>
              <a href={getWhatsAppLink(AGENCY_PHONE, 'Bonjour,')} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="site-container py-6 border-t border-line text-xs text-ink-muted">
        © {new Date().getFullYear()} {AGENCY_NAME}, Abidjan
      </div>
    </footer>
  );
}
