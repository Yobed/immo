'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { INITIAL_PROPERTIES } from '@/lib/mock-data';
import { useLiveProperties } from '@/lib/useLiveProperties';
import { Property, PropertyOperation, PropertyType, LegalStatus } from '@/lib/types';
import { formatFCFA } from '@/lib/utils';
import { Building2, Plus, Search, Filter, ShieldCheck, CheckCircle2, X, BookOpen, Download, FileText, Smartphone, RefreshCw } from 'lucide-react';
import LocalFlipbookModal from '@/components/LocalFlipbookModal';

export default function CrmBiensPage() {
  const { properties, setProperties, isLoading } = useLiveProperties();
  const [filterOp, setFilterOp] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFlipbookProperty, setSelectedFlipbookProperty] = useState<Property | null>(null);

  // New property form state
  const [newProp, setNewProp] = useState({
    title: '',
    operation: 'rent' as PropertyOperation,
    property_type: 'villa' as PropertyType,
    price: '',
    district: 'Cocody Riviera Golf',
    surface: '',
    bedrooms: '4',
    bathrooms: '4',
    legal_status: 'ACD' as LegalStatus,
    description: '',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  });

  const filtered = properties.filter((p) => {
    if (filterOp !== 'all' && p.operation !== filterOp) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q) || p.district.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Property = {
      id: `prop-${Date.now()}`,
      title: newProp.title,
      slug: newProp.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      reference: `REF-${Math.floor(100 + Math.random() * 900)}`,
      description: newProp.description,
      operation: newProp.operation,
      property_type: newProp.property_type,
      status: 'available',
      price: Number(newProp.price) || 100000000,
      currency: 'FCFA',
      city: 'Abidjan',
      district: newProp.district,
      surface: Number(newProp.surface) || 200,
      bedrooms: Number(newProp.bedrooms) || 0,
      bathrooms: Number(newProp.bathrooms) || 0,
      has_pool: false,
      has_generator: true,
      has_security: true,
      has_parking: true,
      legal_status: newProp.legal_status,
      featured: false,
      images: [newProp.image],
      created_at: new Date().toISOString(),
    };

    setProperties([created, ...properties]);
    setIsAddModalOpen(false);
    // Reset form
    setNewProp({
      title: '',
      operation: 'sale',
      property_type: 'villa',
      price: '',
      district: 'Cocody Riviera Golf',
      surface: '',
      bedrooms: '4',
      bathrooms: '4',
      legal_status: 'ACD',
      description: '',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    });
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5 font-sans bg-[#fbfaf7] text-[#161412]">
      
      {/* Top Header (Charbon Architectural #191715 & Or Champagne #C8A97E) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#191715] text-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#2D2926] shadow-warm-xs relative overflow-hidden">
        
        {/* Voile décoratif subtil */}
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-[#C8A97E]/10 to-transparent pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#C8A97E] bg-[#C8A97E]/10 border border-[#C8A97E]/30 px-2.5 py-0.5 rounded-full">
              Inventaire Foncier &amp; Bâti Prestige
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#161412] shadow-xs">
              {properties.length} mandats actifs
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Portefeuille de Biens &amp; Résidences de Luxe
          </h1>
          <p className="text-xs text-[#FAF8F5]/70 font-normal max-w-2xl">
            Gestion des mandats de location meublée, villas diplomatiques et parcelles foncières titrées à Abidjan.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-[#9E7431] hover:bg-[#866226] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-transform hover:-translate-y-0.5 cursor-pointer z-10 shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Ajouter un Mandat</span>
        </button>

      </div>

      {/* FILTERS BAR */}
      <div className="bg-white border border-[#e8e4dc] rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-warm-sm">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7a736a]" />
          <input
            type="text"
            placeholder="Rechercher par titre, réf, zone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl pl-10 pr-3 py-2 text-xs focus:outline-none focus:border-[#947346]"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={filterOp}
            onChange={(e) => setFilterOp(e.target.value)}
            className="bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#947346]"
          >
            <option value="all">Toutes opérations</option>
            <option value="sale">Vente</option>
            <option value="rent">Location</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#947346]"
          >
            <option value="all">Tous statuts</option>
            <option value="available">Disponible</option>
            <option value="under_offer">Sous offre</option>
            <option value="under_contract">Compromis</option>
            <option value="sold">Vendu</option>
          </select>
        </div>

      </div>

      {/* TABLE */}
      <div className="bg-white border border-[#e8e4dc] rounded-3xl overflow-hidden shadow-warm-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#4a453e]">
            <thead className="bg-[#f5f2eb] text-[#161412] uppercase text-[11px] tracking-wider border-b border-[#e8e4dc] font-semibold">
              <tr>
                <th className="py-3.5 px-5">Bien & Référence</th>
                <th className="py-3.5 px-5">Opération</th>
                <th className="py-3.5 px-5">Prix</th>
                <th className="py-3.5 px-5">Localisation</th>
                <th className="py-3.5 px-5">Titre Juridique</th>
                <th className="py-3.5 px-5">Statut</th>
                <th className="py-3.5 px-5 text-right">Plaquette & Partage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ede6]">
              {filtered.map((prop) => (
                <tr key={prop.id} className="hover:bg-[#fbfaf7] transition-colors">
                  <td className="py-3.5 px-5 flex items-center gap-3">
                    <div className="relative w-12 h-10 rounded-xl overflow-hidden shrink-0 bg-[#f5f2eb]">
                      <Image src={prop.images[0]} alt={prop.title} fill className="object-cover" />
                    </div>
                    <div>
                      <span className="font-semibold text-[#161412] block max-w-xs truncate">
                        {prop.title}
                      </span>
                      <span className="text-[10px] text-[#7a736a]">
                        {prop.reference} • {prop.property_type}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase bg-[#f5f2eb] text-[#161412]">
                      {prop.operation === 'sale' ? 'Vente' : 'Location'}
                    </span>
                  </td>

                  <td className="py-3.5 px-5 font-semibold text-[#161412] whitespace-nowrap">
                    {formatFCFA(prop.price)}
                  </td>

                  <td className="py-3.5 px-5 text-[#68625c] whitespace-nowrap">
                    {prop.district}
                  </td>

                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#1d382b] bg-[#f0f5f2] border border-[#d2e3d8] px-2.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-[#1d382b]" />
                      {prop.legal_status}
                    </span>
                  </td>

                  <td className="py-3.5 px-5">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        prop.status === 'cleaning' || prop.concierge_status === 'cleaning'
                          ? 'bg-[#FAF8F5] text-[#161412] border-[#9E7431]/40'
                          : prop.status === 'reserved' || prop.concierge_status === 'reserved'
                          ? 'bg-[#FAF8F5] text-[#161412] border-[#EAE5DC]'
                          : prop.status === 'available'
                          ? 'bg-[#FAF8F5] text-[#161412] border-[#EAE5DC]'
                          : prop.status === 'under_offer'
                          ? 'bg-[#FAF8F5] text-[#9E7431] border-[#9E7431]/30'
                          : 'bg-[#f5f2eb] text-[#7a736a] border-[#e8e4dc]'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>
                          {prop.status === 'cleaning' ? 'En Nettoyage' :
                           prop.status === 'reserved' ? 'Réservé VIP' :
                           prop.status === 'available' ? 'Disponible' :
                           prop.status === 'under_offer' ? 'Sous offre' : prop.status}
                        </span>
                      </span>
                      {prop.last_inspector_name && (
                        <span className="text-[9px] text-[#7a736a] block font-mono">
                          Check: {prop.last_inspector_name.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedFlipbookProperty(prop)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5f2eb] hover:bg-[#ece7de] text-[#161412] text-[11px] font-medium transition-colors border border-[#e8e4dc]"
                        title="Ouvrir le Flipbook 3D autonome"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#947346]" />
                        <span>Flipbook 3D</span>
                      </button>

                      <a
                        href={`/brochures/${prop.reference}.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        download={`${prop.reference}-plaquette.pdf`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161412] hover:bg-[#947346] text-white text-[11px] font-medium transition-colors shadow-sm"
                        title="Télécharger la plaquette vectorielle A4 PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF A4</span>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL AJOUT BIEN */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#e8e4dc] rounded-3xl max-w-2xl w-full p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-warm-lg">
            <div className="flex items-center justify-between border-b border-[#f0ede6] pb-3">
              <h2 className="text-base font-sans font-bold text-[#161412] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#947346]" />
                <span>Nouveau Mandat de Bien Immobilier</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#7a736a] hover:text-[#161412]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#161412] mb-1">Titre de l&apos;annonce *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Villa Triplex d'architecte avec piscine..."
                  value={newProp.title}
                  onChange={(e) => setNewProp({ ...newProp, title: e.target.value })}
                  className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#947346]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#161412] mb-1">Opération</label>
                  <select
                    value={newProp.operation}
                    onChange={(e) => setNewProp({ ...newProp, operation: e.target.value as PropertyOperation })}
                    className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl p-2.5 text-xs"
                  >
                    <option value="sale">Vente</option>
                    <option value="rent">Location</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#161412] mb-1">Typologie</label>
                  <select
                    value={newProp.property_type}
                    onChange={(e) => setNewProp({ ...newProp, property_type: e.target.value as PropertyType })}
                    className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl p-2.5 text-xs"
                  >
                    <option value="villa">Villa</option>
                    <option value="appartement">Appartement</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="terrain">Terrain nu</option>
                    <option value="bureau">Bureaux</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#161412] mb-1">Prix (en FCFA) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 350000000"
                    value={newProp.price}
                    onChange={(e) => setNewProp({ ...newProp, price: e.target.value })}
                    className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#947346]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#161412] mb-1">Quartier (Abidjan / CI)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Cocody Riviera 4, Zone 4..."
                    value={newProp.district}
                    onChange={(e) => setNewProp({ ...newProp, district: e.target.value })}
                    className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#947346]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#161412] mb-1">Surface (m²)</label>
                  <input
                    type="number"
                    placeholder="400"
                    value={newProp.surface}
                    onChange={(e) => setNewProp({ ...newProp, surface: e.target.value })}
                    className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#161412] mb-1">Chambres</label>
                  <input
                    type="number"
                    value={newProp.bedrooms}
                    onChange={(e) => setNewProp({ ...newProp, bedrooms: e.target.value })}
                    className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#161412] mb-1">Titre Juridique</label>
                  <select
                    value={newProp.legal_status}
                    onChange={(e) => setNewProp({ ...newProp, legal_status: e.target.value as LegalStatus })}
                    className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl p-2.5 text-xs"
                  >
                    <option value="ACD">ACD</option>
                    <option value="TF">Titre Foncier (TF)</option>
                    <option value="CMP">CMP</option>
                    <option value="Approbation">Approbation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#161412] mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Détails des prestations, standing, groupe électrogène..."
                  value={newProp.description}
                  onChange={(e) => setNewProp({ ...newProp, description: e.target.value })}
                  className="w-full bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#947346]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#f0ede6]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-[#f5f2eb] text-[#4a453e] text-xs font-semibold hover:bg-[#e8e4dc] transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#161412] hover:bg-[#947346] text-white text-xs font-semibold transition-colors"
                >
                  Enregistrer et Publier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Local Flipbook Modal */}
      {selectedFlipbookProperty && (
        <LocalFlipbookModal
          property={selectedFlipbookProperty}
          isOpen={!!selectedFlipbookProperty}
          onClose={() => setSelectedFlipbookProperty(null)}
        />
      )}

    </div>
  );
}
