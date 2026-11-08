'use client';

import React, { useState } from 'react';
import { X, FileText, CheckCircle2, ShieldCheck, Download, Loader2 } from 'lucide-react';

interface DossierRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyReference?: string;
  propertyTitle?: string;
}

export default function DossierRequestModal({
  isOpen,
  onClose,
  propertyReference = 'VIL-RG-2026',
  propertyTitle = 'Villa Duplex Cocody Riviera Golf',
}: DossierRequestModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profile, setProfile] = useState<'resident' | 'diaspora' | 'corporate'>('resident');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (typeof window !== 'undefined') {
        const existingLeads = JSON.parse(localStorage.getItem('crm_leads') || '[]');
        const newLead = {
          id: `lead-${Date.now()}`,
          full_name: name,
          phone: phone || '+225 -- -- -- --',
          email: email,
          type: 'buyer',
          lead_score: 'hot',
          preferred_districts: [propertyTitle],
          preferred_types: ['villa'],
          notes: `Demande de synthèse foncière pour le mandat [${propertyReference}] ${propertyTitle}. Profil: ${profile}.`,
          source: 'website',
          created_at: new Date().toISOString(),
        };
        existingLeads.unshift(newLead);
        localStorage.setItem('crm_leads', JSON.stringify(existingLeads));
        window.dispatchEvent(new Event('crm_leads_updated'));
      }
    } catch {
      // LocalStorage fallback
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="dark:bg-[#121110] bg-white rounded-3xl border dark:border-white/10 border-[#e8e4dc] max-w-lg w-full p-6 sm:p-8 dark:shadow-[0_25px_60px_rgba(0,0,0,0.9)] shadow-2xl space-y-6 relative animate-fadeIn dark:text-[#F5F2EB] text-[#161412]">
        
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10 text-[#7a736a] hover:text-[#161412] hover:bg-[#f5f2eb] transition-colors cursor-pointer"
          aria-label="Fermer la fenêtre"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSent ? (
          <>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full dark:bg-emerald-950/70 bg-[#f0f5f2] text-xs font-semibold dark:text-emerald-300 text-[#1d382b] border dark:border-emerald-500/30 border-[#d2e3d8]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Dossier Technique & Foncier Confidentiel</span>
              </div>
              <h3 className="text-xl font-display font-medium dark:text-white text-[#161412]">
                Recevoir la synthèse foncière
              </h3>
              <p className="text-xs dark:text-[#A39C92] text-[#68625c] font-light leading-relaxed">
                Mandat [{propertyReference}] • {propertyTitle}. Vous recevrez par courriel l&apos;extrait de réquisition cadastrale, le plan coté et la grille des charges sans démarchage téléphonique intempestif.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold dark:text-white text-[#161412] block">
                  Votre nom complet
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Alexandre Kouassi"
                  className="w-full px-4 py-2.5 rounded-xl border dark:border-white/10 border-[#e8e4dc] text-xs focus:outline-none focus:border-[#C8A97E] dark:bg-white/5 bg-[#fbfaf7] dark:text-white text-[#161412]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold dark:text-white text-[#161412] block">
                  Adresse email de réception
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@entreprise.com"
                  className="w-full px-4 py-2.5 rounded-xl border dark:border-white/10 border-[#e8e4dc] text-xs focus:outline-none focus:border-[#C8A97E] dark:bg-white/5 bg-[#fbfaf7] dark:text-white text-[#161412]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold dark:text-white text-[#161412] block">
                  Numéro de téléphone (optionnel)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+225 ... ou +33 ..."
                  className="w-full px-4 py-2.5 rounded-xl border dark:border-white/10 border-[#e8e4dc] text-xs focus:outline-none focus:border-[#C8A97E] dark:bg-white/5 bg-[#fbfaf7] dark:text-white text-[#161412]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold dark:text-white text-[#161412] block">
                  Votre profil d&apos;acquéreur
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'resident', label: 'Résident CI' },
                    { id: 'diaspora', label: 'Diaspora' },
                    { id: 'corporate', label: 'Entreprise' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProfile(p.id as any)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                        profile === p.id 
                          ? 'dark:bg-white dark:text-[#0A0908] bg-[#161412] text-white border-transparent font-bold' 
                          : 'dark:bg-white/5 dark:text-white/70 dark:border-white/10 bg-[#fbfaf7] text-[#68625c] border-[#e8e4dc] hover:border-[#947346]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-full dark:bg-white dark:hover:bg-[#C8A97E] dark:text-[#0A0908] bg-[#161412] hover:bg-[#947346] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Génération du dossier sécurisé...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Télécharger la synthèse d&apos;audit foncier</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] dark:text-white/40 text-[#7a736a] text-center font-light">
                Vos données sont strictement confidentielles. Conformité Loi N° 2013-450 sur la protection des données en Côte d&apos;Ivoire.
              </p>
            </form>
          </>
        ) : (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full dark:bg-emerald-950/70 bg-[#f0f5f2] border dark:border-emerald-500/30 border-[#d2e3d8] flex items-center justify-center dark:text-emerald-400 text-[#1d382b] mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-medium dark:text-white text-[#161412]">
              Dossier Foncier Transmis
            </h3>
            <p className="text-xs dark:text-[#A39C92] text-[#68625c] leading-relaxed max-w-sm mx-auto font-light">
              La synthèse documentaire pour le mandat <strong>{propertyReference}</strong> a été adressée à <strong className="dark:text-white text-[#161412]">{email}</strong>. Vous pouvez également consulter le PDF A4 officiel dès maintenant.
            </p>
            <div className="pt-3 flex flex-col gap-2">
              <a
                href="/brochures/CATALOGUE-PRESTIGE-ABIDJAN-2026.pdf"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-full dark:bg-white dark:hover:bg-[#C8A97E] dark:text-[#0A0908] bg-[#161412] hover:bg-[#947346] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ouvrir la fiche de synthèse PDF</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="text-xs dark:text-white/50 dark:hover:text-white text-[#7a736a] hover:text-[#161412] py-2 cursor-pointer transition-colors"
              >
                Fermer cette fenêtre
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
