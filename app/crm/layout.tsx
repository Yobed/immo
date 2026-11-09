'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Building2, Users, CalendarDays, 
  GitPullRequest, ArrowLeft, Bot, ShieldCheck, CheckCircle, 
  Lightbulb, ChevronLeft, ChevronRight, Menu, X, ExternalLink,
  MessageCircle, Sparkles, Target
} from 'lucide-react';

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { name: 'Tableau de bord', href: '/crm', icon: LayoutDashboard, badge: null, color: '#161412' },
    { name: 'Contacts & WhatsApp', href: '/crm/contacts', icon: Users, badge: '8', color: '#9E7431' },
    { name: 'Ciblage & Réseaux Sociaux', href: '/crm/ciblage', icon: Target, badge: 'ADS', color: '#9E7431' },
    { name: 'Intelligence & Objections', href: '/crm/intelligence', icon: Lightbulb, badge: 'IA', color: '#9E7431' },
    { name: 'Portefeuille Biens', href: '/crm/biens', icon: Building2, badge: '6', color: '#161412' },
    { name: 'Conciergerie & Checks', href: '/crm/conciergerie', icon: Sparkles, badge: 'LIVE', color: '#9E7431' },
    { name: 'Planning Visites', href: '/crm/visites', icon: CalendarDays, badge: '3', color: '#161412' },
    { name: 'Pipeline Kanban', href: '/crm/pipeline', icon: GitPullRequest, badge: null, color: '#9E7431' },
  ];

  const currentNav = navItems.find((item) => item.href === pathname) || navItems[0];

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#161412] flex flex-col md:flex-row antialiased selection:bg-[#947346]/20">
      
      {/* ========================================================================= */}
      {/* 1. MOBILE TOP NAVIGATION BAR (Ultra compact : 52px height)               */}
      {/* ========================================================================= */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e8e4dc] px-4 py-2.5 flex items-center justify-between shadow-2xs font-sans">
        <NextLink href="/crm" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#161412] flex items-center justify-center text-white font-sans text-xs font-bold shadow-xs">
            A
          </div>
          <div>
            <span className="text-sm font-sans font-bold tracking-tight text-[#161412] block">
              CRM <span className="text-[#947346] font-semibold">Immo</span>
            </span>
          </div>
        </NextLink>

        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#161412] font-medium border border-[#EAE5DC] flex items-center gap-1 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9E7431] ring-2 ring-[#9E7431]/20" />
            <span>Aya IA</span>
          </span>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-8 h-8 rounded-lg bg-[#f5f2eb] hover:bg-[#eae5da] flex items-center justify-center text-[#161412] transition-colors"
            aria-label="Menu CRM"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MOBILE OFF-CANVAS DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end font-sans">
          <div className="bg-white rounded-t-3xl border-t border-[#e8e4dc] p-5 space-y-4 shadow-warm-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#f0ede6] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#161412] flex items-center justify-center text-white font-sans text-xs font-bold">
                  A
                </div>
                <span className="font-sans font-bold text-sm">Navigation CRM</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-7 h-7 rounded-full bg-[#f5f2eb] flex items-center justify-center text-[#7a736a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <NextLink
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#161412] text-white font-semibold shadow-xs'
                        : 'text-[#4a453e] hover:bg-[#f5f2eb]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#947346]' : 'text-[#7a736a]'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-sans font-semibold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#f5f2eb] text-[#7a736a]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NextLink>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-[#f0ede6] flex items-center justify-between">
              <NextLink
                href="/"
                className="text-xs text-[#7a736a] hover:text-[#161412] flex items-center gap-1.5 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour au site public</span>
              </NextLink>
              <span className="text-[10px] text-[#6E665B] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9E7431]" />
                Serveur Synchro
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DESKTOP SLIM COMPACT SIDEBAR (Collapsible w-52 <-> w-16)              */}
      {/* ========================================================================= */}
      <aside 
        className={`hidden md:flex flex-col bg-white border-r border-[#e8e4dc] shrink-0 sticky top-0 h-screen transition-all duration-300 z-30 select-none ${
          isCollapsed ? 'w-16' : 'w-52'
        }`}
      >
        {/* Top Brand Bar */}
        <div className={`p-3.5 border-b border-[#f0ede6] flex items-center font-sans ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <NextLink href="/crm" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-[#161412] flex items-center justify-center text-white font-sans text-sm font-bold shrink-0 shadow-xs">
              A
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="text-sm font-sans font-bold tracking-tight text-[#161412] block truncate">
                  CRM <span className="text-[#947346] font-semibold">Immo</span>
                </span>
                <span className="text-[9px] uppercase tracking-wider text-[#7a736a] block -mt-0.5 truncate font-semibold">
                  Abidjan Prestige
                </span>
              </div>
            )}
          </NextLink>

          {/* Collapse / Expand Toggle Button */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="w-6 h-6 rounded-lg hover:bg-[#f5f2eb] text-[#7a736a] hover:text-[#161412] flex items-center justify-center transition-colors"
              title="Réduire le menu"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* If Collapsed: Show expand icon */}
        {isCollapsed && (
          <div className="py-2 flex justify-center border-b border-[#f0ede6]">
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="w-7 h-7 rounded-lg hover:bg-[#f5f2eb] text-[#7a736a] hover:text-[#161412] flex items-center justify-center transition-colors"
              title="Agrandir le menu"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Items (Compact 32px height) */}
        <nav className="p-2 space-y-1 flex-1 overflow-y-auto font-sans">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <NextLink
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`group flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-2.5'} py-2 rounded-xl text-xs transition-all ${
                  isActive
                    ? 'bg-[#161412] text-white font-semibold shadow-xs'
                    : 'text-[#5a544c] hover:text-[#161412] hover:bg-[#f5f2eb]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon 
                    className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" 
                    style={{ color: isActive ? item.color : '#7a736a' }}
                  />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-sans font-semibold shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#f0ede6] text-[#7a736a]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </NextLink>
            );
          })}
        </nav>

        {/* COMPACT WHATSAPP BOT STATUS (Discreet micro-strip) */}
        <div className={`p-2.5 m-2 rounded-xl bg-[#fbfaf7] border border-[#e8e4dc] ${isCollapsed ? 'text-center' : 'space-y-1'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-[#9E7431] shrink-0" />
              {!isCollapsed && <span className="text-[11px] font-semibold text-[#161412]">Aya IA</span>}
            </div>
            <span className="w-2 h-2 rounded-full bg-[#9E7431] ring-2 ring-[#9E7431]/20" title="Agent IA en ligne" />
          </div>
          {!isCollapsed && (
            <span className="text-[9px] text-[#7a736a] block leading-tight">
              Réponses WhatsApp 24/7
            </span>
          )}
        </div>

        {/* Return to website */}
        <div className="p-2.5 border-t border-[#f0ede6]">
          <NextLink
            href="/"
            title="Retour au site public"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2 px-2'} py-1.5 rounded-lg text-xs text-[#7a736a] hover:text-[#161412] hover:bg-[#f5f2eb] transition-colors font-medium`}
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span className="truncate">Site public</span>}
          </NextLink>
        </div>

      </aside>

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE CANVAS                                                  */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* TOP STATUS UTILITY BAR (Breadcrumb + live context) */}
        <div className="hidden md:flex h-12 bg-white/90 backdrop-blur-md border-b border-[#e8e4dc] px-6 sm:px-8 items-center justify-between text-xs sticky top-0 z-20 shadow-2xs">
          
          <div className="flex items-center gap-2 text-[#7a736a]">
            <span className="text-[#a39c92]">Cabinet Immo</span>
            <span>/</span>
            <span className="flex items-center gap-1.5 font-bold text-[#161412]">
              <span className="w-2.5 h-2.5 rounded-full shadow-2xs" style={{ backgroundColor: currentNav.color }} />
              <span>{currentNav.name}</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[11px] text-[#161412] bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#EAE5DC]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9E7431]" />
              <span className="font-medium">Aya IA Active</span>
            </div>

            <NextLink
              href="/"
              target="_blank"
              className="text-[#7a736a] hover:text-[#161412] flex items-center gap-1 font-medium transition-colors"
            >
              <span>Voir la vitrine</span>
              <ExternalLink className="w-3 h-3" />
            </NextLink>
          </div>

        </div>

        {/* Page Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

      </div>

    </div>
  );
}
