'use client';

import React from 'react';
import Link from 'next/link';
import { Scale, MessageCircle, ArrowUpRight } from 'lucide-react';
import { getWhatsAppLink } from '@/lib/utils';

export default function Footer() {
  const whatsappUrl = getWhatsAppLink(
    '2250788421920',
    'Bonjour Cabinet Immobilier Abidjan, je souhaite échanger avec la direction.'
  );

  return (
    <footer className="border-t dark:border-white/[0.08] border-black/[0.08] dark:bg-[#070605] bg-[#F5F2EB] dark:text-white/60 text-[#141210]/70 font-sans select-none transition-colors duration-300">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14">
          
          {/* Brand & Statut (6 cols) */}
          <div className="md:col-span-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl dark:bg-white dark:text-[#0A0908] bg-[#141210] text-white flex items-center justify-center font-display font-bold text-lg shadow-md">
                A
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-display font-medium dark:text-white text-[#141210] tracking-tight leading-none">
                  Agence Immo
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase font-mono dark:text-[#C8A97E] text-[#947346] mt-1">
                  Abidjan • Prestige
                </span>
              </div>
            </div>
            
            <p className="text-xs leading-relaxed max-w-md dark:text-white/50 text-[#6B655D] font-light">
              Cabinet d&apos;intermédiation et de gestion patrimoniale d&apos;exception en Côte d&apos;Ivoire. Transactions sécurisées sous séquestre notarié et audit foncier systématique.
            </p>

            <div className="p-4 rounded-2xl dark:bg-white/[0.03] dark:border-white/[0.06] bg-black/[0.03] border-black/[0.06] text-xs font-light space-y-1 max-w-md">
              <div className="font-medium dark:text-white text-[#141210] flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 dark:text-[#C8A97E] text-[#947346]" />
                <span>Études Notariales Partenaires :</span>
              </div>
              <p className="text-[11px] dark:text-white/40 text-[#6B655D]">
                Plateau &amp; Cocody • Conservation de la Propriété Foncière d&apos;Abidjan.
              </p>
            </div>
          </div>

          {/* Navigation Mandats (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-widest dark:text-white/80 text-[#141210] font-semibold">
              Portefeuille
            </h4>
            <ul className="space-y-2.5 text-xs dark:text-white/60 text-[#141210]/70">
              <li>
                <Link href="/biens?operation=rent&type=villa" className="dark:hover:text-white hover:text-black transition-colors">
                  Villas à Cocody Riviera
                </Link>
              </li>
              <li>
                <Link href="/biens?operation=rent&type=penthouse" className="dark:hover:text-white hover:text-black transition-colors">
                  Penthouses Zone 4
                </Link>
              </li>
              <li>
                <Link href="/biens?operation=rent" className="dark:hover:text-white hover:text-black transition-colors">
                  Résidences Balnéaires Assinie
                </Link>
              </li>
              <li>
                <Link href="/biens" className="dark:hover:text-white hover:text-black transition-colors">
                  Tous les Mandats Disponibles
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Direct & Conciergerie (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-widest dark:text-white/80 text-[#141210] font-semibold">
              Conciergerie Privée
            </h4>
            <div className="space-y-3 text-xs dark:text-white/60 text-[#141210]/70">
              <p>Abidjan, Côte d&apos;Ivoire</p>
              <p className="dark:text-white text-[#141210] font-mono font-medium">+225 07 88 42 19 20</p>
              
              <div className="pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full dark:bg-white/10 dark:text-white bg-black/5 text-[#141210] hover:bg-[#25D366] hover:text-white text-xs font-semibold transition-all shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Direction sur WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Ligne de Copyright Épurée */}
        <div className="mt-14 pt-8 border-t dark:border-white/[0.06] border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] dark:text-white/40 text-[#6B655D] font-mono">
          <p>© {new Date().getFullYear()} Agence Immo Abidjan. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <Link href="/protocole" className="dark:hover:text-white hover:text-black transition-colors">
              Garanties Foncières
            </Link>
            <Link href="/crm" className="dark:hover:text-white hover:text-black transition-colors">
              Espace Direction
            </Link>
            <Link href="/concierge" className="dark:hover:text-white hover:text-black transition-colors text-[#C8A97E] font-medium">
              Check Conciergerie
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
