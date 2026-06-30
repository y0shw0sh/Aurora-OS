'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'
import { Note } from '@/lib/types'

export default function NotesApp() {
  const { session } = useAuth()
  const userId = session?.user.id
  const [tab, setTab] = useState<'note' | 'journal'>('note')
  const [notes, setNotes] = useState<Note[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    fetchNotes()

    const channel = supabase
      .channel('notes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
        fetchNotes()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setNotes(data)
  }

const addNote = async () => {
  if (!content.trim() || !userId) return

  const { error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      type: tab,
      title: title.trim() || null,
      content: content.trim(),
      is_private: tab === 'journal' ? isPrivate : false,
    })

  if (error) {
    console.log(error)
    alert(error.message)
    return
  }

  await fetchNotes()

  setTitle('')
  setContent('')
  setIsPrivate(false)
}

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id)
  }

  const filtered = notes.filter((n) => n.type === tab)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        <TabButton active={tab === 'note'} onClick={() => setTab('note')} label="Notes" />
        <TabButton active={tab === 'journal'} onClick={() => setTab('journal')} label="Journal" />
      </div>

      <div className="flex flex-col gap-2 bg-white/5 border border-white/10 rounded-xl p-4">
        {tab === 'journal' && (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-white/50 text-sm"
          />
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={tab === 'journal' ? 'Write about today...' : 'Quick note...'}
          rows={3}
          className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-white/50 text-sm resize-none"
        />
        <div className="flex items-center justify-between">
          {tab === 'journal' ? (
            <label className="flex items-center gap-2 text-xs text-white/50">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="accent-purple-400"
              />
              Keep private
            </label>
          ) : (
            <span />
          )}
          <button
            onClick={addNote}
            className="px-4 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {filtered.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {note.title && (
                    <p className="text-white/90 font-medium text-sm mb-1">{note.title}</p>
                  )}
                  <p className="text-white/70 text-sm whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-white/30 text-xs">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                    {note.is_private && (
                      <span className="text-white/30 text-xs">🔒 private</span>
                    )}
                  </div>
                </div>
                {note.user_id === userId && (
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-white/20 hover:text-white/60 text-xs transition-colors flex-shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <p className="text-white/30 text-sm italic">Nothing here yet.</p>
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
        active ? 'bg-white/25 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  )
}