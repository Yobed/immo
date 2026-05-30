'use client'
import { useState, useEffect } from 'react'
import { StickyNote, Check } from 'lucide-react'

interface Props {
  bienId: string
  isFavori: boolean
}

const noteKey = (id: string) => `bgp_note_${id}`

export function FavorisNote({ bienId, isFavori }: Props) {
  const [note, setNote] = useState('')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(noteKey(bienId))
      if (stored) setNote(stored)
    } catch {}
  }, [bienId])

  const save = () => {
    try { localStorage.setItem(noteKey(bienId), note) } catch {}
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!isFavori) return null

  return (
    <div className="mt-2">
      {!editing ? (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent-luxury)] transition-colors font-bold"
        >
          <StickyNote className="w-3.5 h-3.5" />
          {note ? `"${note.slice(0, 30)}${note.length > 30 ? '…' : ''}"` : 'Ajouter une note personnelle'}
          {saved && <Check className="w-3 h-3 text-emerald-500" />}
        </button>
      ) : (
        <div className="flex flex-col gap-1.5">
          <textarea
            autoFocus
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder='Ex: "Demander réduction", "Voir le samedi"...'
            rows={2}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)] resize-none"
          />
          <div className="flex gap-2">
            <button onClick={save} className="px-3 py-1.5 bg-[var(--accent-luxury)] text-[var(--text)] rounded-lg text-[10px] font-black">Enregistrer</button>
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-[var(--text-muted)] rounded-lg text-[10px] font-bold">Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}
