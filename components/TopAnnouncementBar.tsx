'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function TopAnnouncementBar() {
  const scrollToSelection = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const elem = document.getElementById('selection');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/#selection';
    }
  };

  return (
    <div className="bg-[#161412] text-[#fbfaf7] border-b border-white/10 px-4 py-2 text-xs relative z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
        
        {/* Pulsation en direct & Message d'urgence déontologique */}
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <p className="text-[11px] sm:text-xs font-light text-[#dcd6cb]">
            <strong className="font-semibold text-white">Direct Cabinet :</strong> 3 nouveaux mandats audités cette semaine (Cocody Riviera Golf, Bingerville, Assinie PK 9) • <span className="text-[#947346] font-medium">8 visites privées qualifiées</span>
          </p>
        </div>

        {/* Action rapide vers la collection */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#selection"
            onClick={scrollToSelection}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#fbfaf7] hover:text-[#947346] transition-colors group cursor-pointer"
          >
            <span>Découvrir les mandats disponibles</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </a>
          <span className="text-white/20 hidden sm:inline">|</span>
          <Link
            href="/protocole"
            className="hidden sm:inline-block text-[11px] text-[#a39c92] hover:text-white transition-colors"
          >
            Protocole foncier
          </Link>
        </div>

      </div>
    </div>
  );
}
