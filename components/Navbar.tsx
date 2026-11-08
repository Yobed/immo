'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, MessageCircle, Shield, BookOpen } from 'lucide-react';
import { getWhatsAppLink } from '@/lib/utils';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const whatsappUrl = getWhatsAppLink(
    '2250788421920',
    'Bonjour Cabinet Immobilier Abidjan, je souhaite échanger directement avec la direction au sujet d\'une résidence d\'exception.'
  );

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 h-20 transition-all duration-500 font-sans ${
      isScrolled 
        ? (theme === 'dark' 
            ? 'bg-[#0A0908]/85 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-[#F5F2EB]' 
            : 'bg-white/85 backdrop-blur-2xl border-b border-black/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.06)] text-[#141210]')
        : (theme === 'dark'
            ? 'bg-gradient-to-b from-[#0A0908]/90 via-[#0A0908]/40 to-transparent text-[#F5F2EB]'
            : 'bg-gradient-to-b from-white/95 via-white/50 to-transparent text-[#141210]')
    }`}>
      <div className="max-w-[1440px] mx-auto h-full px-6 sm:px-10 lg:px-14 flex items-center justify-between">
        
        {/* Brand Logo : Monogramme & Typographie Architecturale */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-lg transition-colors duration-300 shadow-md ${
            theme === 'dark' 
              ? 'bg-white text-[#0A0908] group-hover:bg-[#C8A97E]' 
              : 'bg-[#141210] text-white group-hover:bg-[#947346]'
          }`}>
            A
          </div>
          <div className="flex flex-col">
            <span className={`text-base font-display font-medium tracking-tight leading-none transition-colors ${
              theme === 'dark' ? 'text-white group-hover:text-[#C8A97E]' : 'text-[#141210] group-hover:text-[#947346]'
            }`}>
              Agence Immo
            </span>
            <span className={`text-[10px] tracking-[0.2em] uppercase font-mono mt-1 ${
              theme === 'dark' ? 'text-white/50' : 'text-black/50'
            }`}>
              Abidjan • Prestige
            </span>
          </div>
        </Link>

        {/* Navigation Centrale Épurée */}
        <nav className={`hidden lg:flex items-center gap-7 text-xs font-medium ${
          theme === 'dark' ? 'text-white/70' : 'text-black/70'
        }`}>
          <Link 
            href="/#collection" 
            className={`transition-colors ${theme === 'dark' ? 'hover:text-white' : 'hover:text-black'}`}
          >
            La Sélection
          </Link>

          <Link 
            href="/#maquette3d" 
            className={`transition-colors ${theme === 'dark' ? 'hover:text-white' : 'hover:text-black'}`}
          >
            Maquette 3D
          </Link>

          <Link 
            href="/catalogue" 
            className={`transition-colors flex items-center gap-1.5 ${
              pathname === '/catalogue' 
                ? (theme === 'dark' ? 'text-white font-bold' : 'text-black font-bold') 
                : (theme === 'dark' ? 'hover:text-white' : 'hover:text-black')
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#C8A97E]" />
            <span>Catalogue Numérique</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#C8A97E]/20 text-[#C8A97E] text-[9px] font-mono font-bold">
              2026
            </span>
          </Link>

          <Link 
            href="/#cinema" 
            className={`transition-colors ${theme === 'dark' ? 'hover:text-white' : 'hover:text-black'}`}
          >
            Cinéma Drone
          </Link>

          <Link 
            href="/biens" 
            className={`transition-colors ${
              pathname === '/biens' 
                ? (theme === 'dark' ? 'text-white font-semibold' : 'text-black font-semibold') 
                : (theme === 'dark' ? 'hover:text-white' : 'hover:text-black')
            }`}
          >
            Toutes les Demeures
          </Link>
        </nav>

        {/* Actions Droite : Theme Toggle + Direction + WhatsApp VIP */}
        <div className="flex items-center gap-3">
          
          {/* Bouton Switch Dark / Light Mode */}
          <ThemeToggle />

          <Link
            href="/crm"
            className={`hidden sm:flex text-xs transition-colors items-center gap-1.5 px-3 py-1.5 rounded-full ${
              theme === 'dark' ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-black/60 hover:text-black hover:bg-black/5'
            }`}
            title="Espace Conseiller & Direction"
          >
            <Shield className="w-3.5 h-3.5 text-[#C8A97E]" />
            <span>Direction</span>
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden sm:flex px-5 py-2.5 rounded-full text-xs font-bold items-center gap-2 transition-all duration-300 shadow-md transform hover:scale-102 cursor-pointer ${
              theme === 'dark'
                ? 'bg-white hover:bg-[#C8A97E] text-[#0A0908]'
                : 'bg-[#141210] hover:bg-[#947346] text-white'
            }`}
          >
            <MessageCircle className="w-4 h-4 fill-[#25D366] text-[#25D366]" />
            <span>Conciergerie WhatsApp</span>
          </a>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2 rounded-xl transition-colors cursor-pointer ${
              theme === 'dark' ? 'text-white/80 hover:text-white' : 'text-black/80 hover:text-black'
            }`}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className={`lg:hidden backdrop-blur-2xl border-b px-6 py-6 space-y-4 ${
          theme === 'dark'
            ? 'bg-[#0A0908]/95 border-white/10 text-white'
            : 'bg-white/95 border-black/10 text-[#141210]'
        }`}>
          <nav className="flex flex-col space-y-3 text-sm">
            <Link 
              href="/#collection" 
              onClick={() => setMobileOpen(false)}
              className="hover:text-[#C8A97E]"
            >
              La Sélection
            </Link>
            <Link 
              href="/#maquette3d" 
              onClick={() => setMobileOpen(false)}
              className="hover:text-[#C8A97E]"
            >
              Maquette 3D
            </Link>
            <Link 
              href="/catalogue" 
              onClick={() => setMobileOpen(false)}
              className="text-[#C8A97E] flex items-center gap-2 font-medium"
            >
              <BookOpen className="w-4 h-4" />
              <span>Catalogue Numérique 2026</span>
            </Link>
            <Link 
              href="/#cinema" 
              onClick={() => setMobileOpen(false)}
              className="hover:text-[#C8A97E]"
            >
              Cinéma Drone
            </Link>
            <Link 
              href="/biens" 
              onClick={() => setMobileOpen(false)}
              className="hover:text-[#C8A97E]"
            >
              Toutes les Demeures
            </Link>
          </nav>
          
          <div className="pt-4 border-t dark:border-white/10 border-black/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <span className={`text-xs font-mono uppercase tracking-wider ${theme === 'dark' ? 'text-white/60' : 'text-black/60'}`}>
                {theme === 'dark' ? 'Nuit' : 'Jour'}
              </span>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-full bg-[#25D366] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Conciergerie</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
