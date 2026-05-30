'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { AnalysisResult } from '@/hooks/useAIListingAnalyzer'
import { Sparkles, Info, ShieldCheck, TrendingUp } from 'lucide-react'

interface AIQualityMeterProps {
  analysis: AnalysisResult
}

export function AIQualityMeter({ analysis }: AIQualityMeterProps) {
  const { score, level, tips, feedback } = analysis

  const getColor = () => {
    if (level === 'premium') return 'text-emerald-500 bg-emerald-500/10'
    if (level === 'standard') return 'text-amber-500 bg-amber-500/10'
    return 'text-[var(--text-subtle)] bg-slate-400/10'
  }

  const getBorderColor = () => {
    if (level === 'premium') return 'border-emerald-500/30'
    if (level === 'standard') return 'border-amber-500/30'
    return 'border-[var(--border)]'
  }

  return (
    <div className={`p-5 rounded-3xl border ${getBorderColor()} bg-surface-card/60 backdrop-blur-sm sticky top-24 transition-all duration-500`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-xl ${getColor()}`}>
          <Sparkles size={18} className="animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-display font-semibold text-[var(--text)]">Score de Qualité IA</h3>
          <p className="text-[10px] text-muted uppercase tracking-wider">Optimisation en direct</p>
        </div>
      </div>

      <div className="relative h-4 w-full bg-[var(--border)] rounded-full overflow-hidden mb-2">
        <motion.div 
          className={`h-full bg-gradient-to-r ${
            level === 'premium' ? 'from-emerald-400 to-emerald-600' : 
            level === 'standard' ? 'from-amber-300 to-amber-500' : 
            'from-slate-300 to-slate-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ type: 'spring', stiffness: 50, damping: 15 }}
        />
        {/* Shimmer effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="flex justify-between items-center mb-6">
        <span className="text-2xl font-display font-bold text-[var(--text)]">{score}%</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getColor()}`}>
          {level === 'premium' ? 'Premium' : level === 'standard' ? 'Standard' : 'Incomplet'}
        </span>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {feedback.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                <ShieldCheck size={14} />
                Points forts
              </div>
              {feedback.slice(0, 1).map((f, i) => (
                <p key={i} className="text-[11px] text-muted pl-5 border-l border-emerald-500/20">{f}</p>
              ))}
            </motion.div>
          )}

          {tips.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-2 pt-2 border-t border-[var(--border)]"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                <TrendingUp size={14} />
                Conseils Pro
              </div>
              <p className="text-[11px] text-muted pl-5 border-l border-amber-500/20 leading-relaxed italic">
                "{tips[0]}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-start gap-2 bg-[var(--accent-luxury-muted)] p-3 rounded-2xl">
        <Info size={14} className="text-[var(--accent-luxury)] shrink-0 mt-0.5" />
        <p className="text-[10px] text-[var(--text-muted)] leading-tight">
          Un score &gt; 80% débloque le badge <strong>"Top Annonce"</strong> et augmente la visibilité de 45%.
        </p>
      </div>
    </div>
  )
}
