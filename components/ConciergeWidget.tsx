'use client';

import React, { useState } from 'react';
import { MessageCircle, X, ArrowUpRight } from 'lucide-react';
import { getWhatsAppLink } from '@/lib/utils';

export default function ConciergeWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  const sendToWhatsApp = (text: string) => {
    const link = getWhatsAppLink('2250788421920', text);
    window.open(link, '_blank');
  };

  return (
    <aside aria-label="Conciergerie WhatsApp" className="fixed bottom-6 right-6 z-50">
      
      {/* Fenêtre de dialogue Conciergerie */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl border border-[#e8e4dc] rounded-3xl p-6 shadow-warm-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#f0ede6] pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#161412] flex items-center justify-center text-white font-display text-xs font-semibold">
                A
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#161412]">Aya • Conciergerie Privée</h3>
                <span className="text-[11px] text-[#1d382b] flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1d382b]" />
                  En ligne à Abidjan
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 text-[#7a736a] hover:text-[#161412] rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#68625c] leading-relaxed font-light">
            Bienvenue chez Agence Immo. Quel projet d&apos;acquisition ou d&apos;investissement foncier souhaitez-vous étudier ?
          </p>

          <div className="space-y-2">
            <button
              onClick={() => sendToWhatsApp('Bonjour Aya, je recherche une villa contemporaine avec piscine à Cocody.')}
              className="w-full text-left p-2.5 rounded-xl bg-[#fbfaf7] hover:bg-[#f5f2eb] border border-[#e8e4dc] text-xs text-[#4a453e] hover:text-[#161412] transition-colors flex items-center justify-between group"
            >
              <span>Villa contemporaine à Cocody</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#947346] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <button
              onClick={() => sendToWhatsApp('Bonjour Aya, je cherche un terrain titré avec ACD vérifié à Bingerville.')}
              className="w-full text-left p-2.5 rounded-xl bg-[#fbfaf7] hover:bg-[#f5f2eb] border border-[#e8e4dc] text-xs text-[#4a453e] hover:text-[#161412] transition-colors flex items-center justify-between group"
            >
              <span>Terrain titré avec ACD vérifié</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#947346] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <button
              onClick={() => sendToWhatsApp('Bonjour Aya, je souhaite faire estimer ma propriété en toute discrétion.')}
              className="w-full text-left p-2.5 rounded-xl bg-[#fbfaf7] hover:bg-[#f5f2eb] border border-[#e8e4dc] text-xs text-[#4a453e] hover:text-[#161412] transition-colors flex items-center justify-between group"
            >
              <span>Estimation confidentielle de ma propriété</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#947346] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          <div className="pt-2 border-t border-[#f0ede6] flex gap-2">
            <input
              type="text"
              placeholder="Votre message..."
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && customMsg && sendToWhatsApp(customMsg)}
              className="flex-1 bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#947346]"
            />
            <button
              onClick={() => customMsg && sendToWhatsApp(customMsg)}
              className="px-3.5 py-2 rounded-xl bg-[#161412] text-white hover:bg-[#947346] transition-colors text-xs flex items-center justify-center"
              aria-label="Envoyer"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Capsule flottante déclencheur */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-3 rounded-full bg-white/95 hover:bg-white backdrop-blur-xl border border-[#e8e4dc] hover:border-[#947346] text-[#161412] shadow-warm-lg flex items-center gap-3 transition-all duration-300 hover:scale-102 group"
      >
        <span className="w-2 h-2 rounded-full bg-[#1d382b]" />
        <span className="text-xs font-semibold tracking-normal text-[#161412]">
          Aya • Conciergerie
        </span>
        <MessageCircle className="w-4 h-4 text-[#947346] group-hover:scale-110 transition-transform" />
      </button>

    </aside>
  );
}
