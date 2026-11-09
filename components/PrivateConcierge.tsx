'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle, Shield, ShieldCheck, Lock, Scale } from 'lucide-react';
import { getWhatsAppLink } from '@/lib/utils';

export default function PrivateConcierge() {
  const directContactUrl = getWhatsAppLink(
    '2250788421920',
    'Bonjour Cabinet Immobilier Abidjan, je souhaite échanger en direct avec la direction au sujet d\'une sélection de résidences d\'exception.'
  );

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-10 max-w-5xl mx-auto text-center space-y-10 select-none">
      
      <div className="space-y-4">
        <h2 className="text-3xl sm:text-5xl font-display font-medium dark:text-white text-[#141210] tracking-tight">
          Une recherche sur-mesure à Abidjan ?
        </h2>
        <p className="text-sm sm:text-base dark:text-[#A39C92] text-[#6B655D] font-light max-w-md mx-auto">
          Échangez en direct et en toute confidentialité avec Liliane &amp; Aya pour une sélection privée ou confier un bien d&apos;exception.
        </p>
      </div>

      {/* Boutons d'Action VIP */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <a
          href={directContactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#191715] hover:bg-[#9E7431] text-white text-xs font-bold shadow-[0_20px_45px_rgba(25,23,21,0.15)] transition-all transform hover:scale-102 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-[#9E7431]" />
          <span>Contacter la Direction via WhatsApp</span>
        </a>

        <Link
          href="/crm"
          className="inline-flex items-center gap-2 px-6 py-4 rounded-full dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/80 dark:hover:text-white dark:border-white/10 bg-black/5 hover:bg-black/10 text-[#141210]/80 hover:text-[#141210] border-black/10 text-xs font-mono transition-all"
        >
          <Shield className="w-3.5 h-3.5 dark:text-[#C8A97E] text-[#947346]" />
          <span>Espace Conseillers &amp; Direction</span>
        </Link>
      </div>

      {/* 3 Garanties Discrètes */}
      <div className="pt-8 border-t dark:border-white/[0.08] border-black/[0.08] flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs dark:text-white/70 text-[#141210]/70 font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#9E7431]" />
          <span>100% Titres ACD Vérifiés</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 dark:text-[#C8A97E] text-[#947346]" />
          <span>Séquestre Notarié Systématique</span>
        </div>
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 dark:text-[#C8A97E] text-[#947346]" />
          <span>Baux Diplomatiques &amp; Corporate</span>
        </div>
      </div>

    </section>
  );
}
