'use client'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, X, Info, AlertTriangle } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
  duration: number
}

interface ToastContextValue {
  toast: (message: string, opts?: { variant?: ToastVariant; duration?: number }) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, opts?: { variant?: ToastVariant; duration?: number }) => {
      const id = Math.random().toString(36).slice(2, 9)
      const item: ToastItem = {
        id,
        message,
        variant: opts?.variant ?? 'info',
        duration: opts?.duration ?? 4000,
      }
      setItems((prev) => [...prev, item])
    },
    [],
  )

  const value: ToastContextValue = {
    toast,
    success: (m, d) => toast(m, { variant: 'success', duration: d }),
    error: (m, d) => toast(m, { variant: 'error', duration: d ?? 5000 }),
    info: (m, d) => toast(m, { variant: 'info', duration: d }),
    warning: (m, d) => toast(m, { variant: 'warning', duration: d }),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer items={items} onClose={remove} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback no-op si jamais le provider manque — évite les crashes
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
    }
  }
  return ctx
}

function ToastContainer({ items, onClose }: { items: ToastItem[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[300] flex flex-col gap-2 max-w-[calc(100vw-2rem)] w-[380px] pointer-events-none">
      <AnimatePresence>
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onClose={() => onClose(item.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  useEffect(() => {
    if (item.duration <= 0) return
    const t = setTimeout(onClose, item.duration)
    return () => clearTimeout(t)
  }, [item.duration, onClose])

  const styles: Record<ToastVariant, { bg: string; icon: ReactNode; border: string }> = {
    success: {
      bg: 'bg-emerald-50 text-emerald-900',
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    error: {
      bg: 'bg-red-50 text-red-900',
      border: 'border-red-200',
      icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50 text-amber-900',
      border: 'border-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    },
    info: {
      bg: 'bg-slate-900 text-white',
      border: 'border-slate-700',
      icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
    },
  }
  const s = styles[item.variant]

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl border ${s.bg} ${s.border}`}
      role={item.variant === 'error' ? 'alert' : 'status'}
      aria-live={item.variant === 'error' ? 'assertive' : 'polite'}
    >
      {s.icon}
      <p className="flex-1 text-sm font-medium leading-relaxed">{item.message}</p>
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/5 transition-colors"
      >
        <X className="w-3.5 h-3.5 opacity-60" />
      </button>
    </motion.div>
  )
}
