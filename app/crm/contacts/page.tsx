'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { INITIAL_CONTACTS, INITIAL_PROPERTIES } from '@/lib/mock-data';
import { Contact, Property, MatchingResult, WhatsAppMessage, LeaseStatus, LeadScore } from '@/lib/types';
import { calculateMatchScore, formatFCFA, getWhatsAppLink } from '@/lib/utils';
import ProspectsDataTable from '@/components/crm/ProspectsDataTable';
import { 
  Users, Sparkles, MessageCircle, Phone, Mail, 
  MapPin, CheckCircle2, Search, ArrowRight, ShieldCheck, Flame,
  FileText, Send, CheckCheck, Clock, AlertTriangle, Copy, 
  TrendingUp, Award, Layers, Check, Bot, CornerDownRight,
  ExternalLink, Calendar, Briefcase, Plus, Paperclip,
  TableProperties, LayoutList, FileSpreadsheet, LogOut, ChevronDown, UserCheck
} from 'lucide-react';

const ENRICHED_CONTACTS: Contact[] = INITIAL_CONTACTS.map((c) => {
  if (c.id === 'cont-004' || c.id === 'cont-005') {
    return { ...c, lease_status: 'active_tenant', contract_signature_date: '02/11/2026' };
  }
  if (c.id === 'cont-008') {
    return { ...c, lease_status: 'former_tenant', lease_end_date: '31/10/2026', contract_signature_date: '01/10/2025' };
  }
  return { ...c, lease_status: c.type === 'tenant' ? 'candidate' : undefined };
});

export default function CrmContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(ENRICHED_CONTACTS);
  const [selectedContact, setSelectedContact] = useState<Contact>(ENRICHED_CONTACTS[0]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'matching' | 'objections'>('whatsapp');
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  // WhatsApp interactive simulation
  const [newMessageText, setNewMessageText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Remontées WhatsApp en temps réel
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isSubmittingSimulator, setIsSubmittingSimulator] = useState(false);
  const [simulatorPhone, setSimulatorPhone] = useState('+225 07 48 22 11 00');
  const [simulatorName, setSimulatorName] = useState('Jean-Philippe Konan');
  const [simulatorMessage, setSimulatorMessage] = useState('Bonjour Aya, notre DRH confirme le budget de 4 500 000 FCFA/mois pour la Villa Riviera Golf. Nous prévoyons 2 mois de caution sous séquestre notarié. Pouvons-nous visiter ce samedi à 15h30 ?');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Presets de simulation représentatifs de l'immobilier d'Abidjan
  const SIMULATOR_PRESETS = [
    {
      id: 'pre-1',
      title: 'Bail Corporate Multinational',
      phone: '+225 07 48 22 11 00',
      name: 'Jean-Philippe Konan',
      message: 'Bonjour Aya, notre DRH confirme le budget de 4 500 000 FCFA/mois pour la Villa Riviera Golf. Nous prévoyons 2 mois de caution sous séquestre notarié. Pouvons-nous visiter ce samedi à 15h30 ?',
      badge: 'Villa Cocody • 4,5M'
    },
    {
      id: 'pre-2',
      title: 'Bail Diplomatique Chancellerie',
      phone: '+225 01 44 33 22 11',
      name: 'Claire Vance (Ambassade)',
      message: 'Bonjour, notre chancellerie valide l\'appartement 4P au Plateau (Réf. APP-PL-04). Budget 2 500 000 FCFA. Pouvez-vous insérer la clause diplomatique officielle de préavis à 1 mois en cas de rappel de mission ?',
      badge: 'Appt Plateau • 2,5M'
    },
    {
      id: 'pre-3',
      title: 'Nouveau Prospect (Médecin Relocation)',
      phone: '+225 07 99 88 77 66',
      name: 'Dr. Stéphane Brou',
      message: 'Bonjour, je suis le Dr. Brou, chirurgien à la PISAM. Je recherche d\'urgence une villa contemporaine avec piscine et groupe insonorisé à Cocody Danga ou Ambassades. Budget max 3 500 000 FCFA. Pouvons-nous visiter demain à 16h ?',
      badge: 'Nouveau Lead • 3,5M'
    },
    {
      id: 'pre-4',
      title: 'Propriétaire Bailleur (Mandat Exclusif)',
      phone: '+225 05 11 22 33 44',
      name: 'Dr. Christian Aké',
      message: 'Bonjour, je possède un Penthouse meublé de 280 m² en Zone 4 avec vue lagune. Je souhaite vous confier la gestion locative exclusive avec séquestre notarié. Loyer souhaité : 3 500 000 FCFA.',
      badge: 'Bailleur • Zone 4'
    }
  ];

  const handleApplyPreset = (preset: typeof SIMULATOR_PRESETS[0]) => {
    setSimulatorPhone(preset.phone);
    setSimulatorName(preset.name);
    setSimulatorMessage(preset.message);
  };

  const handleTriggerWhatsAppIncoming = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!simulatorMessage.trim() || !simulatorPhone.trim()) return;

    setIsSubmittingSimulator(true);
    try {
      const res = await fetch('/api/crm/whatsapp/incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: simulatorPhone,
          senderName: simulatorName,
          text: simulatorMessage,
          botReply: 'Message bien reçu par Aya IA. Votre dossier est analysé et transmis immédiatement au négociateur référent.',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        })
      });

      const data = await res.json();
      if (data.success && data.contact) {
        // Mettre à jour l'état local des contacts
        setContacts((prev) => {
          const cleanP = data.contact.phone.replace(/\s+/g, '');
          const idx = prev.findIndex(c => c.phone.replace(/\s+/g, '') === cleanP);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = data.contact;
            return next;
          }
          return [data.contact, ...prev];
        });

        setSelectedContact(data.contact);
        setViewMode('cards');
        setActiveTab('whatsapp');
        setIsSimulatorOpen(false);
        setSyncNotice(`Remontée WhatsApp enregistrée : ${data.contact.full_name} (${data.extracted_entities.summary})`);
        setTimeout(() => setSyncNotice(null), 6000);
      }
    } catch (err: any) {
      alert(`Erreur lors de la remontée : ${err.message}`);
    } finally {
      setIsSubmittingSimulator(false);
    }
  };

  const handleUpdateLeaseStatus = (contactId: string, status: LeaseStatus) => {
    const updated = contacts.map((c) => {
      if (c.id === contactId) {
        return {
          ...c,
          lease_status: status,
          lease_end_date: status === 'former_tenant' ? (c.lease_end_date || new Date().toLocaleDateString('fr-FR')) : c.lease_end_date
        };
      }
      return c;
    });
    setContacts(updated);
    if (selectedContact.id === contactId) {
      setSelectedContact({
        ...selectedContact,
        lease_status: status,
        lease_end_date: status === 'former_tenant' ? (selectedContact.lease_end_date || new Date().toLocaleDateString('fr-FR')) : selectedContact.lease_end_date
      });
    }
  };

  const handleUpdateLeadScore = (contactId: string, score: LeadScore) => {
    const updated = contacts.map((c) => c.id === contactId ? { ...c, lead_score: score } : c);
    setContacts(updated);
    if (selectedContact.id === contactId) {
      setSelectedContact({ ...selectedContact, lead_score: score });
    }
  };

  useEffect(() => {
    const loadStoredContacts = () => {
      try {
        const stored = localStorage.getItem('crm_leads');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setContacts([...parsed, ...INITIAL_CONTACTS]);
          }
        }
      } catch {
        // Fallback
      }
    };

    loadStoredContacts();
    window.addEventListener('crm_leads_updated', loadStoredContacts);
    return () => window.removeEventListener('crm_leads_updated', loadStoredContacts);
  }, []);

  // Calculate matching properties for currently selected contact
  const matchedProperties = INITIAL_PROPERTIES.map((prop) => {
    const match = calculateMatchScore(selectedContact, prop);
    return {
      property: prop,
      score: match.score,
      reasons: match.reasons,
    };
  })
  .filter((item) => item.score > 25)
  .sort((a, b) => b.score - a.score);

  // Filtered contacts
  const filteredContacts = contacts.filter((c) => {
    if (filterType === 'hot' && c.lead_score !== 'hot') return false;
    if (filterType === 'warm' && c.lead_score !== 'warm') return false;
    if (filterType === 'cold' && c.lead_score !== 'cold') return false;
    if (filterType === 'former_tenant' && c.lease_status !== 'former_tenant') return false;
    if (filterType === 'active_tenant' && c.lease_status !== 'active_tenant') return false;
    if (filterType !== 'all' && !['hot', 'warm', 'cold', 'former_tenant', 'active_tenant'].includes(filterType) && c.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.full_name.toLowerCase().includes(q) || 
        c.phone.includes(q) || 
        (c.notes && c.notes.toLowerCase().includes(q)) ||
        (c.profession && c.profession.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Calculate stats
  const totalBudgetAccumulated = contacts.reduce((acc, c) => acc + (c.budget_max || 0), 0);
  const hotLeads = contacts.filter((c) => c.lead_score === 'hot').length;
  const avgQualification = Math.round(
    contacts.reduce((acc, c) => acc + (c.qualification_score || 85), 0) / contacts.length
  );

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessageText.trim()) return;

    const newMsg: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      sender: 'agent',
      sender_name: 'Cabinet Immo (Conseiller)',
      timestamp: 'À l\'instant',
      text: newMessageText.trim(),
      status: 'sent',
    };

    const updatedContact = {
      ...selectedContact,
      whatsapp_history: [...(selectedContact.whatsapp_history || []), newMsg],
      last_interaction: 'À l\'instant via WhatsApp'
    };

    setSelectedContact(updatedContact);
    setContacts(contacts.map(c => c.id === updatedContact.id ? updatedContact : c));
    setNewMessageText('');

    // Simulate Aya IA / Client acknowledging after 1.5s
    setTimeout(() => {
      const simulatedReply: WhatsAppMessage = {
        id: `msg-reply-${Date.now()}`,
        sender: 'client',
        sender_name: selectedContact.full_name,
        timestamp: 'À l\'instant',
        text: 'Bien reçu. Pouvez-vous me confirmer que la réquisition foncière MCLU est bien annexée au dossier ? Merci pour votre réactivité.',
        status: 'delivered'
      };

      setSelectedContact(prev => {
        if (prev.id !== updatedContact.id) return prev;
        const withReply = {
          ...prev,
          whatsapp_history: [...(prev.whatsapp_history || []), simulatedReply]
        };
        setContacts(all => all.map(c => c.id === withReply.id ? withReply : c));
        return withReply;
      });
    }, 1500);
  };

  const handleCopyArgument = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendQuickReply = (text: string) => {
    setNewMessageText(text);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-4 font-sans text-[#0f172a]">
      
      {/* 1. TOP HEADER & VIEW SWITCHER (Harmonisé Menthe #86E0BC - Tuile Candidats & Contacts) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#86E0BC] text-[#15161A] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#6fcca8] shadow-warm-xs relative overflow-hidden">
        
        {/* Voile décoratif subtil */}
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-white/20 to-transparent pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#15161A]/80 bg-white/40 px-2.5 py-0.5 rounded-full">
              Base Prospects &amp; Candidats Chauds
            </span>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#15161A] text-white shadow-xs">
              {contacts.length} qualifiés
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#15161A] tracking-tight">
            Base Historique Prospects, Candidats &amp; Échanges WhatsApp
          </h1>
          <p className="text-xs text-[#15161A]/85 font-medium max-w-2xl">
            Historique exhaustif des interactions WhatsApp, solvabilité bancaire certifiée et réquisitions foncières à Abidjan.
          </p>
        </div>

        {/* Actions d'entête : Simuler Remontée WhatsApp & Sélecteur de Vue */}
        <div className="flex flex-wrap items-center gap-2.5 z-10 shrink-0">
          <button
            type="button"
            onClick={() => setIsSimulatorOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#17181D] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-transform hover:-translate-y-0.5 cursor-pointer"
            title="Tester l'injection d'un message WhatsApp et son extraction IA"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] ring-2 ring-emerald-900/60" />
            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
            <span>Simuler Remontée WhatsApp</span>
          </button>

          <div className="flex items-center p-1 bg-white/85 backdrop-blur-xs rounded-xl shadow-2xs border border-white/40 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#15161A] text-white shadow-xs'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>Tableau</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#15161A] text-white shadow-xs'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#17915F]" />
              <span>Fiches &amp; Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bannière de notification temps réel lors d'une remontée WhatsApp */}
      {syncNotice && (
        <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-center justify-between text-xs text-emerald-950 shadow-xs animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-emerald-200" />
            <span className="font-extrabold text-emerald-900">Remontée WhatsApp &amp; Aya IA :</span>
            <span className="font-medium">{syncNotice}</span>
          </div>
          <button
            onClick={() => setSyncNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-2 py-0.5 text-xs cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CONDITIONAL VIEW RENDERING : TABLEAU OU FICHES WHATSAPP               */}
      {/* ========================================================================= */}

      {viewMode === 'table' ? (
        /* VUE TABLEAU HISTORIQUE COMPLET AVEC FILTRE, TRI ET EXPORT EXCEL */
        <div className="w-full">
          <ProspectsDataTable
            contacts={contacts}
            onSelectContact={(c) => setSelectedContact(c)}
            onOpenChat={(c) => {
              setSelectedContact(c);
              setActiveTab('whatsapp');
              setViewMode('cards');
            }}
          />
        </div>
      ) : (
        /* VUE MASTER-DETAIL : FICHES ET FIL WHATSAPP IMMERSIF (Plein écran) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full">
          
          {/* LEFT COLUMN : RECHERCHE, FILTRES & LISTE (4 cols) */}
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 space-y-3.5">
            
            {/* Search bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Rechercher nom, téléphone, profession..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-lg pl-9 pr-3 py-2 text-xs font-normal focus:outline-none focus:border-neutral-900 transition-colors"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-1 p-1 bg-white rounded-xl border border-slate-200 text-[11px] shadow-2xs">
              {[
                { id: 'all', label: `Tous (${contacts.length})`, activeCls: 'bg-[#15161A] text-white font-bold' },
                { id: 'hot', label: `Chauds (${contacts.filter(c => c.lead_score === 'hot').length})`, activeCls: 'bg-[#FF7633] text-white font-bold' },
                { id: 'warm', label: `Tièdes (${contacts.filter(c => c.lead_score === 'warm').length})`, activeCls: 'bg-[#FFD84D] text-[#15161A] font-bold' },
                { id: 'cold', label: `Froids (${contacts.filter(c => c.lead_score === 'cold').length})`, activeCls: 'bg-sky-600 text-white font-bold' },
                { id: 'tenant', label: 'Locataires', activeCls: 'bg-[#2E5BFF] text-white font-bold' },
                { id: 'owner', label: 'Bailleurs', activeCls: 'bg-purple-700 text-white font-bold' },
                { id: 'active_tenant', label: 'Baux actifs', activeCls: 'bg-[#0F5E3E] text-white font-bold' },
                { id: 'former_tenant', label: 'Baux clos', activeCls: 'bg-rose-700 text-white font-bold' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                    filterType === f.id
                      ? f.activeCls + ' shadow-2xs'
                      : 'text-slate-600 hover:text-black hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Contact Cards Stream */}
            <div className="space-y-2 max-h-[740px] overflow-y-auto pr-1">
              {filteredContacts.map((contact) => {
                const isSelected = selectedContact.id === contact.id;
                const hasHistory = (contact.whatsapp_history?.length || 0) > 0;
                const qualScore = contact.qualification_score || 85;

                return (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white border-2 border-[#17915F] ring-2 ring-[#86E0BC]/30 shadow-warm-xs'
                        : 'bg-white border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 truncate">
                          <span className="truncate">{contact.full_name}</span>
                          {contact.kyc_status === 'valid' && (
                            <span title="Dossier vérifié" className="shrink-0">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#17915F]" />
                            </span>
                          )}
                        </div>
                        {contact.profession && (
                          <span className="text-[11px] text-slate-500 block truncate font-normal mt-0.5">
                            {contact.profession}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          qualScore >= 95 
                            ? 'bg-[#D7F4E8] text-[#0F5E3E]' 
                            : qualScore >= 85 
                            ? 'bg-[#FEF3C7] text-[#92400E]' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {qualScore}%
                        </span>

                        {contact.lease_status === 'former_tenant' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                            Bail clos
                          </span>
                        )}
                        {contact.lease_status === 'active_tenant' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#15161A] text-[#FFD84D]">
                            Bail actif
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 mt-2 border-t border-neutral-100">
                      <span className="font-semibold text-neutral-900 font-mono">
                        {contact.budget_max 
                          ? (contact.type === 'tenant' || contact.type === 'owner' || contact.budget_max <= 20000000
                              ? `${formatFCFA(contact.budget_max)} / m` 
                              : formatFCFA(contact.budget_max))
                          : 'Indéfini'}
                      </span>

                      <div className="flex items-center gap-2 text-[11px]">
                        {hasHistory && (
                          <span className="flex items-center gap-1 text-emerald-700 font-medium">
                            <MessageCircle className="w-3 h-3 text-[#008069]" />
                            {contact.whatsapp_history?.length}
                          </span>
                        )}
                        <span className="capitalize text-slate-500 font-medium">{contact.type}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          {/* RIGHT COLUMN : FICHE PROSPECT & CHAT WHATSAPP (8-9 cols, Pleine Largeur) */}
          <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-4">
            
            {/* Header Profile Card */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3.5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-extrabold text-slate-900">
                      {selectedContact.full_name}
                    </h2>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      selectedContact.type === 'owner' 
                        ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                        : 'bg-blue-100 text-blue-900 border border-blue-200'
                    }`}>
                      {selectedContact.type === 'tenant' ? 'Locataire' : selectedContact.type === 'owner' ? 'Bailleur' : selectedContact.type}
                    </span>
                    {selectedContact.qualification_score && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#D7F4E8] text-[#0F5E3E] font-bold border border-[#A7F3D0] shadow-2xs">
                        Score {selectedContact.qualification_score}%
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5 font-normal">
                    <span className="flex items-center gap-1 font-bold text-slate-900 font-mono">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      {selectedContact.phone}
                    </span>
                    {selectedContact.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {selectedContact.email}
                      </span>
                    )}
                    {selectedContact.residence_country && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {selectedContact.residence_country}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start">
                  <a
                    href={getWhatsAppLink(selectedContact.phone, `Bonjour M./Mme ${selectedContact.full_name}, suite à votre échange avec notre cabinet immobilier, voici les précisions relatives à votre dossier.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center gap-2 transition-transform hover:-translate-y-0.5 shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                    <span>Lancer WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* INTERACTIVE CONTROLS: PRIORITÉ DU DOSSIER & STATUT DU BAIL */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs text-xs">
                {/* 1. Priorité du Lead */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-700">
                    Priorité dossier :
                  </span>
                  <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 gap-1">
                    {[
                      { key: 'hot', label: 'Chaud (Prioritaire)', activeCls: 'bg-[#FF7633] text-white font-bold' },
                      { key: 'warm', label: 'Tiède (Standard)', activeCls: 'bg-[#FFD84D] text-[#15161A] font-bold' },
                      { key: 'cold', label: 'Froid (Veille)', activeCls: 'bg-sky-600 text-white font-bold' }
                    ].map(({ key, label, activeCls }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleUpdateLeadScore(selectedContact.id, key as LeadScore)}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                          selectedContact.lead_score === key
                            ? activeCls + ' shadow-2xs'
                            : 'text-slate-600 hover:text-black hover:bg-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Statut Locatif & Départ */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-700">
                    Cycle contrat :
                  </span>
                  <select
                    value={selectedContact.lease_status || 'candidate'}
                    onChange={(e) => handleUpdateLeaseStatus(selectedContact.id, e.target.value as LeaseStatus)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#fbfaf7] text-slate-900 border border-slate-300 cursor-pointer focus:outline-none focus:border-[#15161A] shadow-2xs"
                  >
                    <option value="candidate">🟡 Candidat en recherche</option>
                    <option value="active_tenant">🟢 Locataire en place (Bail actif)</option>
                    <option value="former_tenant">🔴 A quitté les lieux (Bail résilié)</option>
                    <option value="archived">⚪ Dossier archivé</option>
                  </select>
                </div>
              </div>

              {/* Profile Metrics Strip avec Accents de Couleur */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 bg-[#FFFBEB] rounded-xl border border-amber-200 shadow-2xs">
                  <span className="text-[10px] text-amber-800 uppercase font-bold block">Budget / Loyer</span>
                  <span className="font-bold text-amber-950 text-xs font-mono mt-0.5 block">
                    {selectedContact.budget_max 
                      ? (selectedContact.type === 'tenant' || selectedContact.type === 'owner' || selectedContact.budget_max <= 20000000
                          ? `${formatFCFA(selectedContact.budget_max)} / mois` 
                          : formatFCFA(selectedContact.budget_max))
                      : 'Non plafonné'}
                  </span>
                </div>
                <div className="p-3 bg-[#F0FDF4] rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">Secteurs cibles</span>
                  <span className="font-bold text-emerald-950 text-xs truncate mt-0.5 block">
                    {selectedContact.preferred_districts.join(', ') || 'Tout Abidjan'}
                  </span>
                </div>
                <div className="p-3 bg-[#EFF6FF] rounded-xl border border-blue-200 shadow-2xs">
                  <span className="text-[10px] text-blue-800 uppercase font-bold block">Garantie financière</span>
                  <span className="font-semibold text-blue-950 text-xs truncate mt-0.5 block">
                    {selectedContact.financial_readiness || 'En attente attestation'}
                  </span>
                </div>
                <div className="p-3 bg-[#FAF5FF] rounded-xl border border-purple-200 shadow-2xs">
                  <span className="text-[10px] text-purple-800 uppercase font-bold block">
                    {selectedContact.contract_signature_date ? 'Signature contrat' : selectedContact.lease_end_date ? 'Bail résilié' : 'Délai projet'}
                  </span>
                  <span className="font-bold text-purple-950 text-xs truncate mt-0.5 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="truncate">
                      {selectedContact.contract_signature_date 
                        ? selectedContact.contract_signature_date 
                        : selectedContact.lease_end_date 
                        ? selectedContact.lease_end_date 
                        : selectedContact.timeline === 'immediate' ? '< 30 jours' : '1 à 3 mois'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Interest Tags (Épuré) */}
              {selectedContact.key_interests && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedContact.key_interests.map((tag, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

            </div>

            {/* PANNEAU REMONTÉES WHATSAPP & EXTRACTION SÉMANTIQUE IA */}
            <div className="bg-gradient-to-r from-emerald-50/90 via-white to-amber-50/60 rounded-2xl p-4 border border-emerald-200/90 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>Remontée WhatsApp &amp; Analyse Sémantique Aya IA</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.2 rounded-full uppercase">
                        Sync Directe
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Entités et intentions réelles extraites de l&apos;échange WhatsApp
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    selectedContact.lead_score === 'hot'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : selectedContact.lead_score === 'warm'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}>
                    Lead {selectedContact.lead_score || 'hot'}
                  </span>
                  <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                    {selectedContact.qualification_score || 95}% score
                  </span>
                </div>
              </div>

              {/* Grille des critères clés remontés */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Budget Détecté</span>
                  <span className="font-extrabold text-slate-900 text-xs mt-0.5 block text-emerald-700">
                    {formatFCFA(selectedContact.budget_max || 0)} / mois
                  </span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Secteur Cible</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block truncate">
                    {selectedContact.preferred_districts?.[0] || 'Riviera Golf / Cocody'}
                  </span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Profil du Bail</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block truncate">
                    {selectedContact.profession?.includes('Directeur') || selectedContact.profession?.includes('Ambassade') ? 'Bail Corporate / Diplomatique' : 'Location Meublée Standing'}
                  </span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Séquestre Notarié</span>
                  <span className="font-bold text-emerald-800 text-xs mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Conforme CMP/ACD</span>
                  </span>
                </div>
              </div>

              {/* Raccourci vers l'agenda pour toute visite demandée */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50/90 p-2.5 px-3 rounded-xl border border-amber-200 text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-extrabold text-amber-950">Demande de visite formulée : </span>
                    <span className="text-amber-900 font-medium">Créneau détecté dans l&apos;échange WhatsApp</span>
                  </div>
                </div>

                <Link
                  href={`/crm/visites?contact=${selectedContact.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#15161A] text-white font-bold text-[11px] hover:bg-black transition-colors shrink-0 shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Programmer sur l&apos;agenda des visites</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Navigation Tabs (Avec Badges & Couleurs dynamiques) */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('whatsapp')}
                className={`py-2 px-4 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs group ${
                  activeTab === 'whatsapp'
                    ? 'bg-[#15161A] text-white ring-2 ring-emerald-500/40'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366] transition-transform group-hover:scale-110" />
                <span>WhatsApp ({selectedContact.whatsapp_history?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('matching')}
                className={`py-2 px-4 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs group ${
                  activeTab === 'matching'
                    ? 'bg-[#15161A] text-white ring-2 ring-amber-500/40'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF7633] transition-transform group-hover:scale-110" />
                <span>Biens ({matchedProperties.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('objections')}
                className={`py-2 px-4 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs group ${
                  activeTab === 'objections'
                    ? 'bg-[#15161A] text-white ring-2 ring-emerald-600/40'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F5E3E] transition-transform group-hover:scale-110" />
                <span>Objections ({selectedContact.objections?.length || 0})</span>
              </button>
            </div>

            {/* TAB 1: WHATSAPP CHAT THREAD (Authentic WhatsApp Web Design) */}
            {activeTab === 'whatsapp' && (
              <div className="relative rounded-lg border border-[#d1d7db] overflow-hidden flex flex-col h-[580px] bg-[#efeae2] shadow-sm">
                
                {/* WHATSAPP SVG DOODLE BACKGROUND PATTERN (Authentic WhatsApp Texture) */}
                <div className="absolute inset-0 pointer-events-none z-0 opacity-45 overflow-hidden">
                  <svg className="w-full h-full text-[#9c9388]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="wa-doodles" width="360" height="360" patternUnits="userSpaceOnUse">
                        <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                          {/* Chat bubble */}
                          <path d="M35 45h35a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H48l-8 8v-8h-5a8 8 0 0 1-8-8V53a8 8 0 0 1 8-8z" />
                          <circle cx="45" cy="61" r="1.5" fill="currentColor" />
                          <circle cx="53" cy="61" r="1.5" fill="currentColor" />
                          <circle cx="61" cy="61" r="1.5" fill="currentColor" />

                          {/* Coffee cup */}
                          <path d="M165 45v20a10 10 0 0 0 10 10h10a10 10 0 0 0 10-10V45h-30zm30 5h6a5 5 0 0 1 5 5v3a5 5 0 0 1-5 5h-6" />

                          {/* Heart */}
                          <path d="M285 55c-5-8-16-8-21 0-5-8-16-8-21 0-5 10 5 20 21 30 16-10 26-20 21-30z" />

                          {/* Paper plane */}
                          <path d="M100 115l45-18-18 45-7-16-20-11zm20 11l-9 13 13-7" />

                          {/* Headphones */}
                          <path d="M210 120a14 14 0 0 1 28 0v10h-3v-8h-22v8h-3z" />
                          <rect x="207" y="128" width="5" height="10" rx="2" />
                          <rect x="236" y="128" width="5" height="10" rx="2" />

                          {/* Star */}
                          <polygon points="320,110 323,118 332,118 325,124 327,132 320,127 313,132 315,124 308,118 317,118" />

                          {/* Phone */}
                          <path d="M50 170a4 4 0 0 1 4-4h6a3 3 0 0 1 3 2l2 6a3 3 0 0 1-1 3l-3 3a20 20 0 0 0 10 10l3-3a3 3 0 0 1 3-1l6 2a3 3 0 0 1 2 3v6a4 4 0 0 1-4 4c-16 0-31-15-31-31z" />

                          {/* Clock */}
                          <circle cx="180" cy="180" r="14" />
                          <path d="M180 172v8l6 4" />

                          {/* Key */}
                          <circle cx="280" cy="180" r="6" />
                          <path d="M286 180h16v4h-3v3h-3v-7" />

                          {/* Music note */}
                          <circle cx="45" cy="275" r="5" />
                          <path d="M50 275v-18a3 3 0 0 1 3-3h12v5H53v16" />
                          <circle cx="65" cy="264" r="4" />

                          {/* Camera */}
                          <rect x="155" y="255" width="28" height="20" rx="4" />
                          <circle cx="169" cy="265" r="5" />
                          <path d="M162 255l2-3h8l2 3" />

                          {/* Real estate House */}
                          <path d="M270 265l13-10 13 10v16h-26z" />
                          <rect x="279" y="271" width="8" height="10" />

                          {/* Smiley */}
                          <circle cx="60" cy="330" r="13" />
                          <circle cx="56" cy="326" r="1" fill="currentColor" />
                          <circle cx="64" cy="326" r="1" fill="currentColor" />
                          <path d="M55 333a5 5 0 0 0 10 0" />

                          {/* Glasses */}
                          <circle cx="170" cy="335" r="7" />
                          <circle cx="192" cy="335" r="7" />
                          <path d="M177 335h8" />

                          {/* Lightbulb */}
                          <path d="M280 330a8 8 0 1 1 13 0c-1 2-2 4-2 6h-9c0-2-1-4-2-6z" />
                          <path d="M286 339h3" />

                          {/* Tiny decorative sparkles and crosses */}
                          <path d="M110 50v6m-3-3h6" />
                          <path d="M330 40v6m-3-3h6" />
                          <circle cx="130" cy="220" r="2" fill="currentColor" />
                          <circle cx="230" cy="210" r="2" fill="currentColor" />
                          <circle cx="340" cy="230" r="2" fill="currentColor" />
                          <path d="M110 300v6m-3-3h6" />
                          <circle cx="230" cy="310" r="2" fill="currentColor" />
                        </g>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#wa-doodles)" />
                  </svg>
                </div>

                {/* HEADER STRIP - AUTHENTIC WHATSAPP WEB STYLE */}
                <div className="relative z-10 bg-[#f0f2f5] px-4 py-2.5 border-b border-[#d1d7db] flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-[#00a884] text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                        {selectedContact.full_name.substring(0, 2)}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#25d366] border-2 border-[#f0f2f5]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-[#111b21] truncate">
                          {selectedContact.full_name}
                        </span>
                        <span className="text-[11px] text-[#00a884] font-medium hidden sm:inline-flex items-center gap-0.5">
                          <CheckCheck className="w-3 h-3 text-[#00a884]" />
                          Vérifié
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#667781] truncate">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#25d366]" />
                        <span>En ligne · {selectedContact.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-[#54656f]">
                    <a
                      href={`tel:${selectedContact.phone.replace(/\s+/g, '')}`}
                      className="p-2 hover:bg-[#e9edef] hover:text-[#111b21] rounded-full transition-colors"
                      title="Appeler"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      className="p-2 hover:bg-[#e9edef] hover:text-[#111b21] rounded-full transition-colors cursor-pointer"
                      title="Rechercher dans la discussion"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    <a
                      href={getWhatsAppLink(selectedContact.phone, `Bonjour M./Mme ${selectedContact.full_name}, suite à votre échange avec notre cabinet immobilier, voici les précisions relatives à votre dossier.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center gap-1.5 transition-transform hover:-translate-y-0.5 shadow-2xs ml-1"
                      title="Ouvrir dans l'application WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-white" />
                      <span>Ouvrir WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* MESSAGES BODY */}
                <div className="relative z-10 flex-1 p-4 overflow-y-auto space-y-3">
                  
                  {/* Subtle WhatsApp security notice pill */}
                  <div className="flex justify-center my-2">
                    <div className="bg-[#ffeecd] text-[#54656f] border border-[#ffecb3] text-[11px] rounded-md px-3 py-1 flex items-center gap-1.5 shadow-2xs max-w-[85%] text-center">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#54656f] shrink-0" />
                      <span>Les messages sont chiffrés de bout en bout · Cabinet Notarial Agréé</span>
                    </div>
                  </div>

                  {/* Date Separator */}
                  <div className="flex items-center justify-center my-3">
                    <span className="bg-white/90 text-[#54656f] shadow-2xs text-[11px] font-medium px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      Aujourd&apos;hui
                    </span>
                  </div>

                  {(selectedContact.whatsapp_history || []).map((msg) => {
                    const isAgent = msg.sender === 'agent';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[10px] text-[#667781] mb-0.5 px-1 font-medium">
                          {msg.sender_name}
                        </div>

                        {/* WhatsApp Bubble (Agent: #d9fdd3 / Client: #ffffff) */}
                        <div
                          className={`max-w-[82%] sm:max-w-[75%] px-3 py-2 text-xs leading-relaxed shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
                            isAgent
                              ? 'bg-[#d9fdd3] text-[#111b21] rounded-lg rounded-tr-xs'
                              : 'bg-white text-[#111b21] rounded-lg rounded-tl-xs'
                          }`}
                        >
                          <p className="font-normal text-[12.5px] select-text">{msg.text}</p>

                          {/* Document Attachment Box */}
                          {msg.media_type === 'document' && (
                            <div className={`mt-2 p-2 rounded-md flex items-center gap-2 border ${
                              isAgent 
                                ? 'bg-[#c8f7bf] border-[#b8edae] text-[#111b21]' 
                                : 'bg-[#f0f2f5] border-[#e9edef] text-[#111b21]'
                            }`}>
                              <FileText className="w-4 h-4 shrink-0 text-[#54656f]" />
                              <div className="truncate flex-1">
                                <span className="font-semibold block text-[11px] truncate">
                                  {msg.media_label || 'Document_Officiel.pdf'}
                                </span>
                                <span className="text-[10px] text-[#667781]">Titre Vérifié au Livre Foncier</span>
                              </div>
                            </div>
                          )}

                          {/* Property Card Link */}
                          {msg.media_type === 'property_card' && (
                            <div className={`mt-2 p-2 rounded-md flex items-center gap-2 border ${
                              isAgent 
                                ? 'bg-[#c8f7bf] border-[#b8edae] text-[#111b21]' 
                                : 'bg-[#f0f2f5] border-[#e9edef] text-[#111b21]'
                            }`}>
                              <ShieldCheck className="w-4 h-4 shrink-0 text-[#00a884]" />
                              <div className="truncate flex-1">
                                <span className="font-semibold block text-[11px] truncate">
                                  {msg.media_label || 'Fiche_Visite.pdf'}
                                </span>
                                <span className="text-[10px] text-[#667781]">Protocole de visite sous 48h</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#667781]">
                            <span>{msg.timestamp}</span>
                            {isAgent && (
                              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Actions Suggestions Bar */}
                <div className="relative z-10 px-3 py-1.5 bg-[#f0f2f5] border-t border-[#e9edef] flex items-center gap-1.5 overflow-x-auto text-xs">
                  <span className="text-[10px] uppercase font-semibold text-[#667781] shrink-0 pl-1">
                    Réponses types :
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSendQuickReply('Voici la réquisition cadastrale officielle délivrée par le Livre Foncier sous 72h.')}
                    className="px-2.5 py-1 rounded bg-white hover:bg-[#e9edef] border border-[#d1d7db] text-[#111b21] text-xs font-normal shrink-0 transition-colors cursor-pointer"
                  >
                    État Foncier MCLU (72h)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendQuickReply('Les fonds sont consignés sur le compte séquestre notarié avec clause de restitution sous 15 jours.')}
                    className="px-2.5 py-1 rounded bg-white hover:bg-[#e9edef] border border-[#d1d7db] text-[#111b21] text-xs font-normal shrink-0 transition-colors cursor-pointer"
                  >
                    Séquestre notarié (15j)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendQuickReply('Nous vous confirmons le créneau de visite privée sous 48h avec notre juriste référent.')}
                    className="px-2.5 py-1 rounded bg-white hover:bg-[#e9edef] border border-[#d1d7db] text-[#111b21] text-xs font-normal shrink-0 transition-colors cursor-pointer"
                  >
                    Visite accompagnée (48h)
                  </button>
                </div>

                {/* Interactive Message Input Box */}
                <form onSubmit={handleSendMessage} className="relative z-10 p-2.5 bg-[#f0f2f5] border-t border-[#d1d7db] flex items-center gap-2">
                  <button
                    type="button"
                    className="p-2 text-[#54656f] hover:text-[#111b21] hover:bg-[#e9edef] rounded-full transition-colors cursor-pointer"
                    title="Joindre un document ou titre"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    placeholder="Tapez un message..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    className="flex-1 bg-white border border-transparent focus:border-[#00a884] text-[#111b21] placeholder-[#667781] rounded-lg px-3.5 py-2 text-xs font-normal focus:outline-none shadow-2xs"
                  />

                  <button
                    type="submit"
                    disabled={!newMessageText.trim()}
                    className="px-3.5 py-2 rounded-lg bg-[#00a884] hover:bg-[#008069] disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="Envoyer"
                  >
                    <span>Envoyer</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

              </div>
            )}

            {/* TAB 2: MATCHING PROPERTIES */}
            {activeTab === 'matching' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Mandats compatibles ({matchedProperties.length})</span>
                  </h3>
                  <span className="text-xs text-neutral-500 font-mono">Classés par pertinence</span>
                </div>

                <div className="space-y-3">
                  {matchedProperties.map(({ property, score, reasons }) => {
                    const shareMessage = `Bonjour ${selectedContact.full_name}, suite à nos échanges, voici une opportunité qui correspond exactement à vos critères :
"${property.title}" située à ${property.district} au prix de ${formatFCFA(property.price)}.
Réf. ${property.reference}. Titre ACD vérifié. Souhaitez-vous que nous organisions une visite privée ?`;

                    const sendUrl = getWhatsAppLink(selectedContact.phone, shareMessage);

                    return (
                      <div key={property.id} className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start justify-between">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
                              {score}% adéquation
                            </span>
                            <span className="text-[11px] text-neutral-500 font-mono">
                              Réf. {property.reference}
                            </span>
                            <span className="text-[11px] text-neutral-700 font-medium flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-neutral-600" />
                              {property.legal_status}
                            </span>
                          </div>

                          <h4 className="text-sm font-semibold text-neutral-900 truncate">
                            {property.title}
                          </h4>

                          <div className="text-xs font-mono font-semibold text-neutral-900">
                            {formatFCFA(property.price)} • <span className="font-sans font-normal text-neutral-500">{property.district} ({property.surface} m²)</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {reasons.map((r, i) => (
                              <span key={i} className="text-[11px] bg-neutral-50 text-neutral-600 px-2 py-0.5 rounded border border-neutral-200 flex items-center gap-1 font-normal">
                                <CheckCircle2 className="w-2.5 h-2.5 text-neutral-500" />
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="shrink-0 w-full md:w-auto pt-1 md:pt-0">
                          <a
                            href={sendUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full md:w-auto px-3.5 py-2 rounded-md bg-neutral-900 hover:bg-black text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Proposer sur WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: OBJECTIONS & PARADES */}
            {activeTab === 'objections' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-neutral-200">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-neutral-700" />
                      <span>Objections &amp; Freins juridiques : {selectedContact.full_name}</span>
                    </h3>
                    <p className="text-xs text-neutral-500 font-normal">
                      Craintes formulées, réponses validées par le juriste et justificatifs officiels.
                    </p>
                  </div>
                  <Link
                    href="/crm/intelligence"
                    className="text-xs font-medium text-neutral-900 hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0"
                  >
                    <span>Matrice globale des objections</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {(!selectedContact.objections || selectedContact.objections.length === 0) ? (
                  <div className="p-8 text-center bg-white rounded-lg border border-neutral-200 text-xs text-neutral-500 space-y-2">
                    <CheckCircle2 className="w-6 h-6 text-neutral-700 mx-auto" />
                    <p className="font-semibold text-neutral-900">Aucune objection bloquante identifiée.</p>
                    <p className="text-neutral-500">Le dossier a validé l&apos;ensemble des critères juridiques et financiers.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedContact.objections.map((obj) => {
                      const isCopied = copiedId === obj.id;
                      return (
                        <div
                          key={obj.id}
                          className="p-4 rounded-lg bg-white border border-neutral-200 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                              Catégorie : {obj.category}
                            </span>
                            <span className="text-xs font-medium text-neutral-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-neutral-700" />
                              {obj.status === 'resolved' ? 'Validée' : 'En cours'}
                            </span>
                          </div>

                          {/* Client statement */}
                          <div className="p-3 rounded-md bg-neutral-50 border border-neutral-200 space-y-1">
                            <span className="text-[11px] uppercase tracking-wide font-medium text-neutral-500 block">
                              Verbatim client :
                            </span>
                            <p className="text-xs text-neutral-800 italic font-normal">
                              &quot;{obj.client_statement}&quot;
                            </p>
                          </div>

                          {/* Recommended Response */}
                          <div className="space-y-1">
                            <span className="text-[11px] uppercase tracking-wide font-medium text-neutral-700 block">
                              Réponse du cabinet :
                            </span>
                            <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                              {obj.recommended_response}
                            </p>
                          </div>

                          {/* Proof document & copy action */}
                          <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-neutral-600">
                              <FileText className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                              <span className="font-medium text-neutral-900 text-xs truncate">{obj.proof_document}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyArgument(obj.recommended_response, obj.id)}
                              className="px-3 py-1 rounded border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-medium flex items-center gap-1.5 self-start transition-colors shrink-0 cursor-pointer"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-neutral-900" />
                                  <span className="text-neutral-900 font-semibold">Copié</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-neutral-500" />
                                  <span>Copier la réponse</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* MODAL SIMULATEUR DE REMONTÉE WHATSAPP EN DIRECT */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Simulateur de Remontée WhatsApp &amp; Aya IA
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Injection d&apos;un message entrant, parsing d&apos;entités et mise à jour du CRM
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSimulatorOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Presets rapides de simulation */}
            <div className="space-y-2">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Cas d&apos;usage Abidjan (Raccourcis 1-clic) :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SIMULATOR_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-900">
                        {p.title}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                        {p.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                      {p.name} · {p.phone}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Formulaire de message personnalisé */}
            <form onSubmit={handleTriggerWhatsAppIncoming} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Numéro WhatsApp :</label>
                  <input
                    type="text"
                    value={simulatorPhone}
                    onChange={(e) => setSimulatorPhone(e.target.value)}
                    required
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="+225 07 00 00 00 00"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Nom du contact / Expéditeur :</label>
                  <input
                    type="text"
                    value={simulatorName}
                    onChange={(e) => setSimulatorName(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Nom complet ou Titre"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Message WhatsApp brut envoyé à Aya IA :</label>
                <textarea
                  rows={3}
                  value={simulatorMessage}
                  onChange={(e) => setSimulatorMessage(e.target.value)}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: Bonjour, je recherche une villa à Riviera Golf avec piscine..."
                />
              </div>

              {/* Bouton de soumission */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSimulatorOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingSimulator}
                  className="px-6 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-500/25 transition-transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingSimulator ? (
                    <span>Traitement IA en cours...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmettre &amp; Parser dans le CRM</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
