'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, GitCompare, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CompareBien } from '@/hooks/useComparator'

interface Props {
  selected: CompareBien[]
  onRemove: (id: string) => void
  onClear: () => void
}

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-CI', { maximumFractionDigits: 0 }).format(n)
}

export function ComparatorBar({ selected, onRemove, onClear }: Props) {
  const [open, setOpen] = useState(false)

  if (selected.length === 0) return null

  return (
    <>
      {/* Floating bar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-xl"
      >
        <div className="bg-[var(--midnight)]/95 backdrop-blur-xl border border-[var(--accent-luxury)]/30 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
          <GitCompare className="w-4 h-4 text-[var(--accent-luxury)] shrink-0" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selected.map(b => (
              <div key={b.id} className="flex items-center gap-1.5 bg-white/10 rounded-xl px-2 py-1 shrink-0">
                <span className="text-white text-[10px] font-bold truncate max-w-[80px]">{b.titre}</span>
                <button onClick={() => onRemove(b.id)} className="text-white/50 hover:text-white transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {selected.length < 3 && (
              <span className="text-white/30 text-[10px] italic shrink-0">
                +{3 - selected.length} bien{3 - selected.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onClear} className="text-white/40 hover:text-white text-[10px] font-bold transition-colors">
              Vider
            </button>
            {selected.length >= 2 && (
              <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 bg-[var(--accent-luxury)] text-black px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
              >
                Comparer <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Comparison overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="w-full max-w-4xl bg-[var(--background)] rounded-3xl overflow-hidden border border-[var(--border)] shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--background)] z-10">
                <h2 className="font-display font-bold text-lg text-[var(--text)] uppercase tracking-tight">Comparaison</h2>
                <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-xl bg-[var(--surface)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Comparison table */}
              <div className={`grid gap-px bg-[var(--border)] ${selected.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {selected.map(b => (
                  <div key={b.id} className="bg-[var(--background)] p-5 space-y-4">
                    {/* Photo */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-[var(--surface)]">
                      {b.photo_url ? (
                        <Image src={b.photo_url} alt={b.titre} fill sizes="400px" className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)] text-xs">Pas de photo</div>
                      )}
                    </div>

                    {/* Infos */}
                    <div>
                      <p className="font-bold text-[var(--text)] text-sm leading-tight mb-1">{b.titre}</p>
                      <p className="text-[var(--text-muted)] text-xs">{b.commune}</p>
                    </div>

                    <div className="space-y-2">
                      {[
                        { label: 'Prix', value: b.prix },
                        { label: 'Surface', value: b.surface_m2 ? `${b.surface_m2} m²` : '—' },
                        { label: 'Pièces', value: b.nb_pieces ? `${b.nb_pieces} pièces` : '—' },
                        { label: 'Type', value: b.type_bien.replace(/_/g, ' ') },
                        { label: 'Vérifié', value: b.is_verifie ? '✅ Oui' : '—' },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-[var(--border)] last:border-0">
                          <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider font-bold">{row.label}</span>
                          <span className="text-[var(--text)] text-xs font-bold">{row.value}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      href={`/biens/${b.id}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--accent-luxury)] text-black text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                    >
                      Voir la fiche <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
