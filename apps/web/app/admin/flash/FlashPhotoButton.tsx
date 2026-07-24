'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/**
 * Bouton d'ajout de photo sur une offre flash. Upload direct vers la route
 * /api/locaux/[id]/photo (Cloudinary + repli Supabase), puis rafraîchit la
 * liste. Route handler (pas server action) → pas de limite 1 Mo.
 */
export function FlashPhotoButton({ locauxId, hasPhoto }: { locauxId: number; hasPhoto: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const router = useRouter()

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setErr(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/locaux/${locauxId}/photo`, {
        method: 'POST',
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: fd,
      })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new Error(t.slice(0, 140) || `HTTP ${res.status}`)
      }
      router.refresh()
    } catch (e) {
      setErr((e as Error).message || String(e))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
      >
        <ImagePlus className="w-3.5 h-3.5" /> {busy ? 'Envoi…' : hasPhoto ? 'Remplacer' : 'Photo'}
      </button>
      {err && <p className="w-full text-[10px] text-red-500 mt-1 basis-full">{err}</p>}
    </>
  )
}
