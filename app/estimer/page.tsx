'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, CheckCircle2, MessageCircle, Building2, MapPin } from 'lucide-react';
import { getWhatsAppLink } from '@/lib/utils';

export default function EstimerPage() {
  const [formData, setFormData] = useState({
    operation: 'sale',
    propertyType: 'villa',
    district: 'Cocody Riviera Golf',
    surface: '',
    bedrooms: '',
    legalStatus: 'ACD',
    estimatedPrice: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    notes: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const whatsappMessage = `Bonjour Cabinet Immobilier Abidjan, je souhaite faire estimer et confier un bien sous mandat :
- Opération : ${formData.operation === 'sale' ? 'Vente' : 'Location'}
- Type : ${formData.propertyType}
- Secteur : ${formData.district}
- Surface approx : ${formData.surface} m²
- Titre : ${formData.legalStatus}
- Propriétaire : ${formData.ownerName} (${formData.ownerPhone})`;

  const whatsappUrl = getWhatsAppLink('2250788421920', whatsappMessage);

  return (
    <>
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-6 sm:px-10 lg:px-12 pt-28 pb-20 w-full space-y-10 bg-[#fbfaf7] text-[#161412]">
        
        {/* Header Épuré */}
        <div className="bg-white rounded-3xl border border-[#e8e4dc] p-8 sm:p-12 text-center space-y-4 shadow-warm-sm">
          <span className="text-xs uppercase tracking-widest text-[#947346] font-semibold block">
            Valorisation Patrimoniale & Mandat Exclusif
          </span>
          <h1 className="text-3xl sm:text-5xl font-display font-medium text-[#161412] tracking-tight">
            Estimation de Votre Propriété à Abidjan
          </h1>
          <p className="text-[#68625c] text-sm max-w-xl mx-auto font-light leading-relaxed">
            Profitez de notre analyse fine des transactions notariales réelles et de notre réseau d&apos;acquéreurs pré-qualifiés au comptant en Côte d&apos;Ivoire et dans la diaspora.
          </p>
        </div>

        {submitted ? (
          <div className="bg-[#f0f5f2] rounded-3xl border border-[#d2e3d8] p-8 sm:p-12 text-center space-y-6 shadow-warm-md">
            <div className="w-14 h-14 rounded-full bg-white border border-[#d2e3d8] flex items-center justify-center text-[#1d382b] mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-[#161412]">
              Demande de valorisation transmise
            </h2>
            <p className="text-[#2a503e] text-sm max-w-md mx-auto font-light leading-relaxed">
              Merci M./Mme <strong className="font-semibold text-[#161412]">{formData.ownerName}</strong>. Notre directeur des transactions vous contactera au <strong className="font-semibold text-[#161412]">{formData.ownerPhone}</strong> sous 24h ouvrées.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-full bg-[#161412] hover:bg-[#947346] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirmer sur WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-6 py-3.5 rounded-full bg-white text-[#161412] text-xs font-semibold hover:bg-[#fbfaf7] border border-[#e8e4dc] transition-colors"
              >
                Nouvelle estimation
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#e8e4dc] p-8 sm:p-12 space-y-8 shadow-warm-sm">
            
            {/* Section 1: Bien */}
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-[#161412] uppercase tracking-wider border-b border-[#f0ede6] pb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#947346]" />
                <span>1. Caractéristiques de votre bien</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-[#161412] block mb-1.5">
                    Projet envisagé
                  </label>
                  <select
                    value={formData.operation}
                    onChange={(e) => setFormData({ ...formData, operation: e.target.value })}
                    className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#947346]"
                  >
                    <option value="sale">Mise en vente</option>
                    <option value="rent">Mise en location</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#161412] block mb-1.5">
                    Type de bien
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#947346]"
                  >
                    <option value="villa">Villa individuelle</option>
                    <option value="penthouse">Penthouse / Duplex</option>
                    <option value="appartement">Appartement</option>
                    <option value="terrain">Terrain nu avec ACD</option>
                    <option value="immeuble">Immeuble de rapport</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#161412] block mb-1.5">
                    Quartier / Emplacement
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#947346]"
                  >
                    <option value="Cocody Riviera Golf">Cocody Riviera Golf</option>
                    <option value="Cocody Ambassades">Cocody Ambassades</option>
                    <option value="Cocody Danga">Cocody Danga</option>
                    <option value="Marcory Zone 4">Marcory Zone 4</option>
                    <option value="Plateau">Le Plateau</option>
                    <option value="Bingerville">Bingerville</option>
                    <option value="Assinie">Assinie-Mafia</option>
                    <option value="Autre">Autre commune</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#161412] block mb-1.5">
                    Statut foncier du titre
                  </label>
                  <select
                    value={formData.legalStatus}
                    onChange={(e) => setFormData({ ...formData, legalStatus: e.target.value })}
                    className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#947346]"
                  >
                    <option value="ACD">ACD (Arrêté de Concession Définitive)</option>
                    <option value="TF">Titre Foncier (TF)</option>
                    <option value="CP">Certificat de Propriété</option>
                    <option value="En cours">ACD en cours d&apos;instruction</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#161412] block mb-1.5">
                    Superficie approximative (m²)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex : 500"
                    required
                    value={formData.surface}
                    onChange={(e) => setFormData({ ...formData, surface: e.target.value })}
                    className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#947346]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#161412] block mb-1.5">
                    Nombre de pièces / chambres
                  </label>
                  <input
                    type="number"
                    placeholder="Ex : 5"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#947346]"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Coordonnées Propriétaire */}
            <div className="space-y-5 pt-4">
              <h2 className="text-sm font-semibold text-[#161412] uppercase tracking-wider border-b border-[#f0ede6] pb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#947346]" />
                <span>2. Vos Coordonnées (Confidentielles)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-[#161412] block mb-1.5">
                    Nom & Prénoms
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : Kouadio Jean"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#947346]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#161412] block mb-1.5">
                    Numéro de Téléphone (WhatsApp privilégié)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+225 07..."
                    value={formData.ownerPhone}
                    onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                    className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#947346]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#161412] block mb-1.5">
                    Précisions ou attentes particulières
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex : Vente urgente souhaitée, présence d'une piscine, groupe électrogène..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#947346]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#1d382b]">
                <ShieldCheck className="w-4 h-4 text-[#1d382b]" />
                <span>Engagement de confidentialité et discrétion absolue</span>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#161412] hover:bg-[#947346] text-white font-semibold text-xs transition-colors shadow-warm-sm"
              >
                Envoyer ma demande d&apos;estimation
              </button>
            </div>

          </form>
        )}

      </main>

      <Footer />
    </>
  );
}
