'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, TrendingUp, Calculator, PieChart, Sparkles, ArrowRight } from 'lucide-react';

export default function YieldCalculator() {
  const [propertyType, setPropertyType] = useState('studio');
  const [valuation, setValuation] = useState(50000000); // 50M CFA
  const [rentDay, setRentDay] = useState(45000); // 45k CFA/jour meublé
  const [occupancy, setOccupancy] = useState(70); // 70% occupancy
  
  // Results
  const monthlyRevenue = (rentDay * (occupancy / 100)) * 30;
  const annualRevenue = monthlyRevenue * 12;
  const grossYield = (annualRevenue / valuation) * 100;
  
  // Comparative traditional rent (unfurnished)
  const traditionalRent = propertyType === 'studio' ? 250000 : propertyType === 'apartment' ? 600000 : 1500000;
  const traditionalAnnual = traditionalRent * 12;
  const sapphireBonus = annualRevenue - traditionalAnnual;

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-2xl">
      <div className="grid lg:grid-cols-2">
        {/* Controls */}
        <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-[var(--border)]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-luxury)]/10 flex items-center justify-center text-[var(--accent-luxury)]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-[var(--text)]">Simulateur de Rendement</h3>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold">Spécial Résidences Meublées</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Type selection */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)] mb-4 block">Type de Bien</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'studio', label: 'Studio VIP' },
                  { id: 'apartment', label: 'Appartement' },
                  { id: 'villa', label: 'Villa Prestige' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setPropertyType(type.id)}
                    className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${
                      propertyType === type.id 
                        ? 'bg-[var(--text)] text-[var(--background)] shadow-lg' 
                        : 'bg-[var(--background)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-luxury)]'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Valuation Slider */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">Valeur Estimée du Bien</label>
                <span className="text-lg font-display font-bold text-[var(--accent-luxury)]">
                  {valuation.toLocaleString()} <small className="text-[10px]">CFA</small>
                </span>
              </div>
              <input 
                type="range" 
                min="20000000" 
                max="500000000" 
                step="5000000"
                value={valuation}
                onChange={(e) => setValuation(Number(e.target.value))}
                className="w-full accent-[var(--accent-luxury)] h-1 bg-[var(--border)] rounded-full appearance-none cursor-pointer"
              />
            </div>

            {/* Occupancy Slider */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">Taux d'occupation cible</label>
                <span className="text-lg font-display font-bold text-[var(--accent-luxury)]">
                  {occupancy}%
                </span>
              </div>
              <input 
                type="range" 
                min="30" 
                max="100" 
                step="5"
                value={occupancy}
                onChange={(e) => setOccupancy(Number(e.target.value))}
                className="w-full accent-[var(--accent-luxury)] h-1 bg-[var(--border)] rounded-full appearance-none cursor-pointer"
              />
            </div>

            {/* Daily Rent */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">Tarif Nuitée (Meublé)</label>
                <span className="text-lg font-display font-bold text-[var(--accent-luxury)]">
                   {rentDay.toLocaleString()} <small className="text-[10px]">CFA / nuit</small>
                </span>
              </div>
              <input 
                type="range" 
                min="25000" 
                max="250000" 
                step="5000"
                value={rentDay}
                onChange={(e) => setRentDay(Number(e.target.value))}
                className="w-full accent-[var(--accent-luxury)] h-1 bg-[var(--border)] rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-[var(--background)] p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-luxury)]/5 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10 space-y-10">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-luxury)] mb-2 block">Rendement Brut Annuel</span>
              <div className="text-6xl md:text-7xl font-display font-bold text-[var(--text)] tracking-tighter">
                {grossYield.toFixed(1)}%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-[var(--border)]">
              <div>
                <p className="text-[9px] uppercase tracking-widest font-bold text-[var(--text-muted)] mb-1">Revenu Mensuel</p>
                <p className="text-xl font-display font-bold text-[var(--text)]">
                  {Math.round(monthlyRevenue).toLocaleString()} <span className="text-[10px] opacity-40">CFA</span>
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest font-bold text-[var(--text-muted)] mb-1">Plus-value / an*</p>
                <p className="text-xl font-display font-bold text-emerald-500">
                  +{Math.round(sapphireBonus).toLocaleString()} <span className="text-[10px] opacity-40">CFA</span>
                </p>
              </div>
            </div>

            <div className="p-6 bg-[var(--surface-card)] rounded-2xl border border-[var(--border)]">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                    En optant pour la <strong>gestion meublée Sapphire</strong>, vous générez un excédent de <span className="text-[var(--text)] font-semibold">{Math.round(sapphireBonus).toLocaleString()} CFA</span> par an par rapport à une location classique.
                  </p>
                </div>
              </div>
            </div>

            <button className="w-full py-5 bg-[var(--text)] text-[var(--background)] rounded-xl font-bold text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[var(--accent-luxury)] hover:text-white transition-all group">
              Confier mon bien en gestion
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[8px] text-center text-[var(--text-muted)] uppercase tracking-widest">
              *Comparé à une location nue moyenne sur le marché d'Abidjan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
