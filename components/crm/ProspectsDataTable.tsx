'use client';

import React, { useState, useMemo } from 'react';
import { Contact } from '@/lib/types';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';
import { 
  Search, ArrowUpDown, ArrowUp, ArrowDown, Download, 
  FileSpreadsheet, MessageCircle, ShieldCheck, Flame, 
  ExternalLink, Filter, RotateCcw, AlertTriangle, CheckCircle2,
  FileText, Phone, Mail, MapPin, Eye, Check
} from 'lucide-react';

interface ProspectsDataTableProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  onOpenChat: (contact: Contact) => void;
}

type SortField = 'name' | 'date' | 'budget' | 'score' | 'type' | 'kyc';
type SortDirection = 'asc' | 'desc';

export default function ProspectsDataTable({
  contacts,
  onSelectContact,
  onOpenChat,
}: ProspectsDataTableProps) {
  // Filtering States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [kycFilter, setKycFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [budgetFilter, setBudgetFilter] = useState<string>('all');

  // Sorting States
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Export feedback
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Filter Logic
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = c.full_name.toLowerCase().includes(q);
        const matchPhone = c.phone.includes(q);
        const matchEmail = (c.email || '').toLowerCase().includes(q);
        const matchProf = (c.profession || '').toLowerCase().includes(q);
        const matchNotes = (c.notes || '').toLowerCase().includes(q);
        const matchDistricts = c.preferred_districts.some((d) => d.toLowerCase().includes(q));
        if (!matchName && !matchPhone && !matchEmail && !matchProf && !matchNotes && !matchDistricts) {
          return false;
        }
      }

      // Type
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;

      // Score
      if (scoreFilter === 'hot' && c.lead_score !== 'hot') return false;
      if (scoreFilter === 'warm' && c.lead_score !== 'warm') return false;
      if (scoreFilter === 'cold' && c.lead_score !== 'cold') return false;

      // KYC
      if (kycFilter === 'valid' && c.kyc_status !== 'valid') return false;
      if (kycFilter === 'pending' && c.kyc_status === 'valid') return false;

      // District
      if (districtFilter !== 'all') {
        const hasDistrict = c.preferred_districts.some((d) => 
          d.toLowerCase().includes(districtFilter.toLowerCase())
        );
        if (!hasDistrict) return false;
      }

      // Budget Range
      if (budgetFilter !== 'all') {
        const b = c.budget_max || 0;
        if (budgetFilter === 'under2.5m' && b > 2500000) return false;
        if (budgetFilter === '2.5m-4m' && (b < 2500000 || b > 4000000)) return false;
        if (budgetFilter === 'above4m' && b < 4000000) return false;
      }

      return true;
    });
  }, [contacts, search, typeFilter, scoreFilter, kycFilter, districtFilter, budgetFilter]);

  // Sort Logic
  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.full_name.localeCompare(b.full_name);
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'budget':
          comparison = (a.budget_max || 0) - (b.budget_max || 0);
          break;
        case 'score':
          comparison = (a.qualification_score || 0) - (b.qualification_score || 0);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'kyc':
          comparison = (a.kyc_status || '').localeCompare(b.kyc_status || '');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredContacts, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setScoreFilter('all');
    setKycFilter('all');
    setDistrictFilter('all');
    setBudgetFilter('all');
  };

  // EXPORT 1 : NATIVE EXCEL (.xls)
  const handleExportExcel = () => {
    const today = new Date().toISOString().split('T')[0];
    const filename = `Prospects_Clients_Cabinet_Immo_${today}.xls`;

    // Construct styled HTML table that Excel parses as native worksheet
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Base Prospects & Clients</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          th { background-color: #161412; color: #ffffff; font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; padding: 10px; border: 1px solid #333333; }
          td { font-family: Arial, sans-serif; font-size: 10pt; padding: 8px; border: 1px solid #dcd6cb; }
          .money { text-align: right; font-weight: bold; }
          .badge { font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>Cabinet Immobilier Abidjan : Base Complète Historique des Prospects &amp; Clients</h2>
        <p>Généré le ${new Date().toLocaleDateString('fr-FR')} • ${sortedContacts.length} enregistrements</p>
        <table border="1">
          <thead>
            <tr>
              <th>Réf</th>
              <th>Date Entrée</th>
              <th>Nom & Prénoms</th>
              <th>Téléphone / WhatsApp</th>
              <th>Email</th>
              <th>Type</th>
              <th>Score Qualification</th>
              <th>Budget Max (FCFA)</th>
              <th>Quartiers Cibles</th>
              <th>Profession / Profil</th>
              <th>Solvabilité & Financement</th>
              <th>Statut KYC</th>
              <th>Délai Projet</th>
              <th>Échanges WhatsApp</th>
              <th>Objections Documentées</th>
              <th>Notes / Synthèse</th>
            </tr>
          </thead>
          <tbody>
    `;

    sortedContacts.forEach((c) => {
      const dateStr = new Date(c.created_at).toLocaleDateString('fr-FR');
      const wsCount = c.whatsapp_history?.length || 0;
      const objCount = c.objections?.length || 0;
      const budgetFormatted = (c.budget_max || 0).toLocaleString('fr-FR') + ' FCFA';

      html += `
        <tr>
          <td>${c.id}</td>
          <td>${dateStr}</td>
          <td><b>${c.full_name}</b></td>
          <td>${c.phone}</td>
          <td>${c.email || 'N/A'}</td>
          <td class="badge">${c.type.toUpperCase()}</td>
          <td style="text-align:center;">${c.qualification_score || 85}/100 (${c.lead_score.toUpperCase()})</td>
          <td class="money">${budgetFormatted}</td>
          <td>${c.preferred_districts.join(', ')}</td>
          <td>${c.profession || 'N/A'}</td>
          <td>${c.financial_readiness || 'N/A'}</td>
          <td>${c.kyc_status === 'valid' ? 'VALIDÉ CIMA/CENTIF' : 'EN COURS'}</td>
          <td>${c.timeline === 'immediate' ? '< 30 jours' : '1 à 3 mois'}</td>
          <td style="text-align:center;">${wsCount} messages</td>
          <td style="text-align:center;">${objCount} objections</td>
          <td>${(c.notes || '').replace(/"/g, '&quot;')}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess('Fichier Excel (.xls) téléchargé avec succès !');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  // EXPORT 2 : CSV WITH UTF-8 BOM (Compatibilité Excel Francophone)
  const handleExportCsv = () => {
    const today = new Date().toISOString().split('T')[0];
    const filename = `Prospects_Clients_Cabinet_Immo_${today}.csv`;

    const headers = [
      'Réf ID',
      'Date Création',
      'Nom Complet',
      'Téléphone',
      'Email',
      'Type',
      'Score Qualification',
      'Température',
      'Budget Max (FCFA)',
      'Quartiers Cibles',
      'Profession',
      'Solvabilité Financière',
      'Statut KYC',
      'Délai Acquisition',
      'Volume WhatsApp (Messages)',
      'Objections Notariées',
      'Notes'
    ];

    const rows = sortedContacts.map((c) => [
      c.id,
      new Date(c.created_at).toLocaleDateString('fr-FR'),
      `"${c.full_name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${c.email || ''}"`,
      c.type,
      c.qualification_score || 85,
      c.lead_score,
      c.budget_max || 0,
      `"${c.preferred_districts.join(', ')}"`,
      `"${(c.profession || '').replace(/"/g, '""')}"`,
      `"${(c.financial_readiness || '').replace(/"/g, '""')}"`,
      c.kyc_status === 'valid' ? 'Validé' : 'En cours',
      c.timeline || '1_month',
      c.whatsapp_history?.length || 0,
      c.objections?.length || 0,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ]);

    // Use semicolon delimiter for French Excel
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess('Fichier CSV (.csv) téléchargé avec succès !');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  return (
    <div className="space-y-4 font-sans text-[#0f172a]">
      
      {/* SUCCESS NOTIFICATION */}
      {exportSuccess && (
        <div className="p-3 bg-[#f0f5f2] border border-[#d2e3d8] text-[#1d382b] rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#1d382b]" />
            <span>{exportSuccess}</span>
          </div>
          <span className="text-[10px] opacity-75">Ouverture immédiate dans Excel</span>
        </div>
      )}

      {/* COMPACT UNIFIED TOOLBAR (Épuré & Direct) */}
      <div className="bg-white px-4 py-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Quick search & inline filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search box */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher nom, contact, quartier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg pl-8 pr-3 py-1.5 text-xs font-normal focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
            />
          </div>

          {/* Quick Filter: Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-slate-900 cursor-pointer"
          >
            <option value="all">Profil: Tous</option>
            <option value="tenant">Locataires</option>
            <option value="owner">Bailleurs / Propriétaires</option>
            <option value="buyer">Acheteurs</option>
            <option value="investor">Investisseurs</option>
          </select>

          {/* Quick Filter: Loyer / Budget */}
          <select
            value={budgetFilter}
            onChange={(e) => setBudgetFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-slate-900 cursor-pointer"
          >
            <option value="all">Loyer: Tous</option>
            <option value="under2.5m">&lt; 2,5M FCFA/m</option>
            <option value="2.5m-4m">2,5M à 4M FCFA/m</option>
            <option value="above4m">&gt; 4M FCFA/m</option>
          </select>

          {/* Quick Filter: Score */}
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-slate-900 cursor-pointer"
          >
            <option value="all">Score: Tous</option>
            <option value="hot">Chauds (&ge;85%)</option>
            <option value="warm">Tièdes</option>
            <option value="cold">Froids</option>
          </select>

          {/* Quick Filter: KYC */}
          <select
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-slate-900 cursor-pointer"
          >
            <option value="all">KYC: Tous</option>
            <option value="valid">Validé CIMA/CENTIF</option>
            <option value="pending">En attente pièces</option>
          </select>

          {/* Reset button if active */}
          {(search || typeFilter !== 'all' || scoreFilter !== 'all' || kycFilter !== 'all' || districtFilter !== 'all' || budgetFilter !== 'all') && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-slate-500 hover:text-slate-900 text-xs px-2 py-1 rounded-md hover:bg-slate-100 flex items-center gap-1 transition-colors cursor-pointer"
              title="Réinitialiser"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Effacer</span>
            </button>
          )}
        </div>

        {/* Right: Export buttons & count */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-500 mr-1 hidden sm:inline">
            <b>{sortedContacts.length}</b> contact{sortedContacts.length > 1 ? 's' : ''}
          </span>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="Exporter en Excel (.xls)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            title="Exporter en CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>
        </div>

      </div>

      {/* FULL DATA TABLE CONTAINER */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
          
          <table className="w-full text-left border-collapse text-xs">
            
            {/* STICKY TABLE HEADER */}
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                {/* 1. Réf & Date */}
                <th 
                  onClick={() => handleSort('date')}
                  className="py-3 px-3.5 cursor-pointer hover:text-slate-900 transition-colors shrink-0"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date &amp; Réf</span>
                    {sortField === 'date' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-slate-900" /> : <ArrowDown className="w-3 h-3 text-slate-900" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>

                {/* 2. Nom & KYC */}
                <th 
                  onClick={() => handleSort('name')}
                  className="py-3 px-3.5 cursor-pointer hover:text-slate-900 transition-colors min-w-[180px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Contact</span>
                    {sortField === 'name' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-slate-900" /> : <ArrowDown className="w-3 h-3 text-slate-900" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>

                {/* 3. Téléphone & WhatsApp */}
                <th className="py-3 px-3.5 min-w-[130px]">
                  WhatsApp
                </th>

                {/* 4. Type */}
                <th 
                  onClick={() => handleSort('type')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Type</span>
                    {sortField === 'type' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-slate-900" /> : <ArrowDown className="w-3 h-3 text-slate-900" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>

                {/* 5. Score */}
                <th 
                  onClick={() => handleSort('score')}
                  className="py-3 px-3.5 cursor-pointer hover:text-slate-900 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Score</span>
                    {sortField === 'score' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-slate-900" /> : <ArrowDown className="w-3 h-3 text-slate-900" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>

                {/* 6. Budget */}
                <th 
                  onClick={() => handleSort('budget')}
                  className="py-3 px-3.5 cursor-pointer hover:text-slate-900 transition-colors text-right min-w-[140px]"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Budget / Loyer Max</span>
                    {sortField === 'budget' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-slate-900" /> : <ArrowDown className="w-3 h-3 text-slate-900" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>

                {/* 7. Quartiers Cibles */}
                <th className="py-3 px-3.5 min-w-[160px]">
                  Quartiers Cibles
                </th>

                {/* 8. Solvabilité & Financement */}
                <th className="py-3 px-3.5 min-w-[180px]">
                  Garantie
                </th>

                {/* 9. KYC */}
                <th 
                  onClick={() => handleSort('kyc')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>KYC</span>
                    {sortField === 'kyc' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-slate-900" /> : <ArrowDown className="w-3 h-3 text-slate-900" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>

                {/* 10. WhatsApp */}
                <th className="py-3 px-3 text-center">
                  Chat
                </th>

                {/* 11. Actions */}
                <th className="py-3 px-3.5 text-right">
                  Action
                </th>
              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody className="divide-y divide-slate-100">
              {sortedContacts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm text-slate-900">Aucun contact ne correspond aux filtres.</p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-2 text-xs text-slate-900 underline font-medium cursor-pointer"
                    >
                      Effacer les filtres
                    </button>
                  </td>
                </tr>
              ) : (
                sortedContacts.map((contact, idx) => {
                  const wsCount = contact.whatsapp_history?.length || 0;
                  const isHot = contact.lead_score === 'hot';
                  const dateStr = new Date(contact.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });

                  return (
                    <tr
                      key={contact.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* 1. Date & Réf */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 block text-xs">
                          {contact.id}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-normal">
                          {dateStr}
                        </span>
                      </td>

                      {/* 2. Nom & Profil */}
                      <td className="py-3 px-3.5">
                        <div>
                          <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                            <span>{contact.full_name}</span>
                            {contact.kyc_status === 'valid' && (
                              <span title="Conformité KYC validée">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block truncate max-w-[200px] font-normal">
                            {contact.profession || 'Profil vérifié'}
                          </span>
                        </div>
                      </td>

                      {/* 3. Téléphone / WhatsApp */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-[11px]">
                        <a
                          href={getWhatsAppLink(contact.phone, `Bonjour M./Mme ${contact.full_name}, nous revenons vers vous suite à votre dossier immobilier.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-slate-700 hover:text-emerald-700 font-medium"
                          title="Lancer WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                          <span>{contact.phone}</span>
                        </a>
                      </td>

                      {/* 4. Type */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                          contact.type === 'tenant' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          contact.type === 'owner' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          contact.type === 'investor' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {contact.type === 'tenant' ? 'Locataire' :
                           contact.type === 'owner' ? 'Bailleur' :
                           contact.type === 'buyer' ? 'Acheteur' : 'Investisseur'}
                        </span>
                      </td>

                      {/* 5. Score Qualification */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          contact.lead_score === 'hot'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : contact.lead_score === 'warm'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <span>{contact.lead_score === 'hot' ? '🔥 Chaud' : contact.lead_score === 'warm' ? '🌤️ Tiède' : '❄️ Froid'}</span>
                          <span>({contact.qualification_score || 85}%)</span>
                        </span>
                      </td>

                      {/* 6. Budget / Loyer Max */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-bold text-xs text-slate-900">
                        {contact.budget_max 
                          ? (contact.type === 'tenant' || contact.type === 'owner' || contact.budget_max <= 20000000
                              ? `${formatFCFA(contact.budget_max)} / m` 
                              : formatFCFA(contact.budget_max))
                          : 'Non défini'}
                      </td>

                      {/* 7. Quartiers Cibles */}
                      <td className="py-3 px-3.5">
                        <span className="text-[11px] text-slate-600 block truncate max-w-[220px]">
                          {contact.preferred_districts.join(', ')}
                        </span>
                      </td>

                      {/* 8. Solvabilité & Financement */}
                      <td className="py-3 px-3.5">
                        <span className="text-[11px] text-slate-600 block line-clamp-1 font-normal">
                          {contact.financial_readiness || 'Attestation en attente'}
                        </span>
                      </td>

                      {/* 9. KYC */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {contact.kyc_status === 'valid' ? (
                          <span className="text-[11px] font-medium text-emerald-700 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Validé
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-amber-600 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            En cours
                          </span>
                        )}
                      </td>

                      {/* 10. WhatsApp Messages Volume */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenChat(contact)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 hover:text-emerald-700 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          title="Ouvrir WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3 text-[#25D366]" />
                          <span>{wsCount}</span>
                        </button>
                      </td>

                      {/* 11. Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenChat(contact)}
                          className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Consulter
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

        </div>
      </div>

    </div>
  );
}
