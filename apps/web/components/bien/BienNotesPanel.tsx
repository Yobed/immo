'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StickyNote, Lock, Briefcase, Trash2, Loader2, Edit3 } from 'lucide-react'

interface BienNotesPanelProps {
  bienId: string
  userId: string
  isAdmin: boolean
}

interface Note {
  id: string
  audience: 'client_private' | 'admin_internal'
  content: string
  created_at: string
  author_id: string
}

/**
 * Panneau de notes sur un bien immobilier.
 *
 * Côté client :
 *   - Notes privées (seul l'auteur les voit) — équivalent post-it perso
 *   - Idéal pour : "j'aime le quartier", "à comparer avec X", "appeler ma femme"
 *
 * Côté admin :
 *   - Notes internes commerciales (visibles par tout admin)
 *   - Idéal pour : "proprio négociable -10%", "zone hot 2026", "contrat
 *     bientôt à échéance", "ancien locataire à problèmes"
 *
 * Toutes les notes sont sécurisées par RLS (cf migration 024).
 */
export function BienNotesPanel({ bienId, userId, isAdmin }: BienNotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [audience, setAudience] = useState<'client_private' | 'admin_internal'>(
    isAdmin ? 'admin_internal' : 'client_private',
  )

  const supabase = createClient()

  const loadNotes = useCallback(async () => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: err } = await (supabase as any)
      .from('bien_notes')
      .select('id, audience, content, created_at, author_id')
      .eq('bien_id', bienId)
      .order('created_at', { ascending: false })

    if (err) {
      setError(`Impossible de charger les notes : ${err.message}`)
    } else {
      setNotes((data ?? []) as Note[])
    }
    setLoading(false)
  }, [bienId, supabase])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  async function handleAdd() {
    const content = newNote.trim()
    if (!content) return
    setSubmitting(true)
    setError(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from('bien_notes')
      .insert({
        bien_id: bienId,
        author_id: userId,
        audience,
        content,
      })
    if (err) {
      setError(`Erreur : ${err.message}`)
    } else {
      setNewNote('')
      await loadNotes()
    }
    setSubmitting(false)
  }

  async function handleDelete(noteId: string) {
    if (!confirm('Supprimer cette note ?')) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from('bien_notes')
      .delete()
      .eq('id', noteId)
    if (err) {
      setError(`Erreur : ${err.message}`)
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
    }
  }

  const myNotes = notes.filter((n) => n.audience === 'client_private')
  const internalNotes = notes.filter((n) => n.audience === 'admin_internal')

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5">
      <header className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold text-[var(--text)] inline-flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-[var(--accent-luxury)]" />
          {isAdmin ? 'Notes & commentaires' : 'Mes notes sur ce bien'}
        </h3>
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">
          {notes.length} note{notes.length > 1 ? 's' : ''}
        </span>
      </header>

      {/* Formulaire d'ajout */}
      <div className="mb-5">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={
            isAdmin
              ? 'Ajouter une note (visible par les admins uniquement)…'
              : 'Ajouter une note privée (visible uniquement par vous)…'
          }
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-luxury)] resize-none"
        />
        {isAdmin && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={audience === 'admin_internal'}
                onChange={() => setAudience('admin_internal')}
                className="w-3.5 h-3.5"
              />
              <Briefcase className="w-3 h-3 text-amber-600" />
              Interne (admins)
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={audience === 'client_private'}
                onChange={() => setAudience('client_private')}
                className="w-3.5 h-3.5"
              />
              <Lock className="w-3 h-3 text-slate-500" />
              Personnelle
            </label>
          </div>
        )}
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newNote.trim() || submitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-luxury)] text-[var(--on-accent)] text-xs font-bold uppercase tracking-wider disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit3 className="w-3.5 h-3.5" />}
            Ajouter
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)] inline-flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement…
        </p>
      ) : (
        <div className="space-y-4">
          {/* Notes admin (si admin) */}
          {isAdmin && internalNotes.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-2 inline-flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                Notes internes ({internalNotes.length})
              </p>
              <ul className="space-y-2">
                {internalNotes.map((n) => (
                  <NoteCard
                    key={n.id}
                    note={n}
                    canDelete={n.author_id === userId}
                    onDelete={() => handleDelete(n.id)}
                    variant="admin"
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Notes personnelles */}
          {myNotes.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 inline-flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {isAdmin ? 'Mes notes personnelles' : 'Mes notes'}
                {' '}({myNotes.length})
              </p>
              <ul className="space-y-2">
                {myNotes.map((n) => (
                  <NoteCard
                    key={n.id}
                    note={n}
                    canDelete={n.author_id === userId}
                    onDelete={() => handleDelete(n.id)}
                    variant="client"
                  />
                ))}
              </ul>
            </div>
          )}

          {notes.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] italic">
              Aucune note pour le moment. Ajoutez-en une ci-dessus.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

interface NoteCardProps {
  note: Note
  canDelete: boolean
  onDelete: () => void
  variant: 'client' | 'admin'
}

function NoteCard({ note, canDelete, onDelete, variant }: NoteCardProps) {
  const date = new Date(note.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  return (
    <li
      className={`group relative px-3 py-2.5 rounded-lg border text-sm leading-relaxed ${
        variant === 'admin'
          ? 'bg-amber-50/50 border-amber-200/60 text-amber-950'
          : 'bg-slate-50/50 border-slate-200/60 text-slate-900'
      }`}
    >
      <p className="whitespace-pre-wrap pr-8">{note.content}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider opacity-60">{date}</p>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Supprimer la note"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </li>
  )
}
