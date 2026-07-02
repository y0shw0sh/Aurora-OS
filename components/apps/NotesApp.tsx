'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Trash2, X, Check } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'
import { Note } from '@/lib/types'

const NOTE_COLORS = [
  '#fffde7',
  '#fff8e1',
  '#fce4ec',
  '#e8f5e9',
  '#e3f2fd',
  '#f3e5f5',
  '#fff3e0',
]

const CAVEAT = "'Caveat', cursive"

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Note Card ───────────────────────────────────────────────────────────────

function NoteCard({
  note,
  onClick,
  onDelete,
}: {
  note: Note
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const preview = (note.content ?? '').trim().split('\n')[0] ?? ''
  const charCount = note.content?.length ?? 0
  const lineCount = note.content?.split('\n').length ?? 0
  const cardHeight = charCount < 60 ? 'h-28' : charCount < 180 ? 'h-40' : 'h-52'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(100,80,30,0.18)' }}
      whileTap={{ scale: 0.97 }}
      className={`relative cursor-pointer rounded-2xl p-4 overflow-hidden ${cardHeight} group`}
      style={{
        backgroundColor: note.color ?? '#fffde7',
        boxShadow: '0 2px 12px rgba(100,80,30,0.10), 0 1px 3px rgba(100,80,30,0.08)',
        fontFamily: CAVEAT,
      }}
      onClick={onClick}
    >
      {/* Ruled lines */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full border-b border-amber-400"
            style={{ top: `${28 + i * 22}px` }}
          />
        ))}
      </div>

      {/* Red margin line */}
      <div className="absolute left-10 top-0 bottom-0 w-px bg-red-300 opacity-40 pointer-events-none" />

      <div className="relative z-10 h-full flex flex-col">
        {note.title && (
          <h3 className="text-lg font-semibold text-amber-900 leading-tight mb-1 line-clamp-1">
            {note.title}
          </h3>
        )}
        <p className="text-base text-stone-700 leading-snug line-clamp-3 flex-1">
          {preview || <span className="text-stone-400 italic">Empty note…</span>}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-amber-700 opacity-70">
            {formatDate(note.updated_at)}
          </span>
          {lineCount > 1 && (
            <span className="text-xs text-amber-700 opacity-50">{lineCount} lines</span>
          )}
        </div>
      </div>

      {/* Delete on hover */}
      <button
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-400 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500"
        onClick={onDelete}
      >
        <Trash2 size={11} />
      </button>
    </motion.div>
  )
}

// ─── Note Editor ─────────────────────────────────────────────────────────────

function NoteEditor({
  note,
  onClose,
  onSave,
  onDelete,
}: {
  note: Note | null
  onClose: () => void
  onSave: (title: string, content: string, color: string, isPrivate: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [color, setColor] = useState(note?.color ?? NOTE_COLORS[0])
  const [isPrivate, setIsPrivate] = useState(note?.is_private ?? false)
  const [saving, setSaving] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTimeout(() => bodyRef.current?.focus(), 200)
  }, [])

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) { onClose(); return }
    setSaving(true)
    await onSave(title.trim(), content.trim(), color, isPrivate)
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!note) return
    await onDelete(note.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(44,36,22,0.35)' }}
      onClick={(e) => e.target === e.currentTarget && handleSave()}
    >
      <motion.div
        initial={{ scale: 0.82, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.88, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative w-full rounded-3xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: color,
          boxShadow: '0 32px 80px rgba(60,40,10,0.32), 0 4px 16px rgba(60,40,10,0.14)',
          minHeight: 380,
          maxHeight: '80%',
          fontFamily: CAVEAT,
        }}
      >
        {/* Ruled lines */}
        <div className="absolute inset-0 overflow-hidden opacity-15 pointer-events-none">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full border-b border-amber-500"
              style={{ top: `${80 + i * 28}px` }}
            />
          ))}
        </div>
        <div className="absolute left-14 top-0 bottom-0 w-px bg-red-300 opacity-35 pointer-events-none" />

        {/* Toolbar */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-amber-200/60">
          <div className="flex items-center gap-2">
            {NOTE_COLORS.map((c) => (
              <button
                key={c}
                className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? '#c87020' : 'transparent',
                  boxShadow: color === c ? '0 0 0 1px #c87020' : 'none',
                }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs text-amber-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="accent-amber-600"
              />
              Private
            </label>
            {note && (
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-100/60 transition-colors"
                onClick={handleDelete}
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center text-amber-800 hover:bg-amber-200/60 transition-colors"
              onClick={handleSave}
              disabled={saving}
            >
              <Check size={18} />
            </button>
          </div>
        </div>

        {/* Title */}
        <input
          className="relative z-10 w-full bg-transparent px-5 pt-4 pb-1 text-2xl font-bold text-amber-900 placeholder-amber-400/60 outline-none"
          style={{ fontFamily: CAVEAT }}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && bodyRef.current?.focus()}
        />

        {/* Body */}
        <textarea
          ref={bodyRef}
          className="relative z-10 flex-1 w-full bg-transparent px-5 py-2 text-lg text-stone-700 placeholder-amber-400/50 outline-none resize-none"
          style={{ fontFamily: CAVEAT, lineHeight: '28px', minHeight: 240 }}
          placeholder="Start writing…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* Footer */}
        <div className="relative z-10 px-5 py-3 border-t border-amber-200/50 flex items-center justify-between">
          <span className="text-sm text-amber-700/60">
            {note ? `Edited ${formatDate(note.updated_at)}` : 'New note'}
          </span>
          <span className="text-sm text-amber-700/50">{content.length} chars</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main NotesApp ────────────────────────────────────────────────────────────

export default function NotesApp() {
  const { session } = useAuth()
  const userId = session?.user.id
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'note' | 'journal'>('note')

  useEffect(() => {
    fetchNotes()

    const channel = supabase
      .channel('notes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
        fetchNotes()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false })
    if (data) setNotes(data)
  }

const saveNote = async (
  title: string,
  content: string,
  color: string,
  isPrivate: boolean
) => {
  if (activeNote) {
    const { error } = await supabase.from('notes').update({
      title: title || null,
      content,
      color,
      is_private: isPrivate,
      updated_at: new Date().toISOString(),
    }).eq('id', activeNote.id)
    if (error) { console.error('Update error:', error); return }
  } else {
    const { error } = await supabase.from('notes').insert({
      user_id: userId,
      type: tab,
      title: title || null,
      content,
      color,
      is_private: isPrivate,
      updated_at: new Date().toISOString(),
    })
    if (error) { console.error('Insert error:', error); return }
  }
  setActiveNote(null)
  setIsCreating(false)
  await fetchNotes()
}

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id)
    setActiveNote(null)
    setIsCreating(false)
  }

  const filtered = notes.filter((n) => {
    const matchesTab = n.type === tab
    const matchesSearch =
      (n.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  const showEditor = activeNote !== null || isCreating

  return (
    <div
      className="relative flex flex-col h-full overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #faf6ee 0%, #f5edda 100%)',
        fontFamily: CAVEAT,
      }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 px-5 pt-5 pb-3 z-10"
        style={{ background: 'linear-gradient(to bottom, #faf6ee 80%, transparent)' }}
      >
        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          {(['note', 'journal'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1 rounded-xl text-base capitalize transition-all"
              style={{
                fontFamily: CAVEAT,
                background: tab === t
                  ? 'linear-gradient(135deg, #f0b429, #e8841a)'
                  : 'rgba(255,255,255,0.5)',
                color: tab === t ? 'white' : 'rgba(120,80,20,0.7)',
                fontWeight: tab === t ? 600 : 400,
                boxShadow: tab === t ? '0 2px 8px rgba(232,160,32,0.35)' : 'none',
              }}
            >
              {t === 'note' ? '📝 Notes' : '📖 Journal'}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-amber-700/60">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </p>
            <h1
              className="text-3xl font-bold text-amber-900"
              style={{ fontFamily: CAVEAT }}
            >
              {tab === 'note' ? 'Notes' : 'Journal'}
            </h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-2xl text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #f0b429 0%, #e8841a 100%)',
              boxShadow: '0 4px 14px rgba(232,160,32,0.4)',
              fontFamily: CAVEAT,
            }}
            onClick={() => setIsCreating(true)}
          >
            <Plus size={15} strokeWidth={2.5} />
            New
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl px-4 py-2 text-base outline-none text-stone-700 placeholder-amber-400/70"
            style={{
              backgroundColor: 'rgba(255,255,255,0.65)',
              border: '1.5px solid rgba(200,160,60,0.2)',
              fontFamily: CAVEAT,
              boxShadow: 'inset 0 1px 3px rgba(100,80,30,0.06)',
            }}
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500"
              onClick={() => setSearch('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <p className="text-xs text-amber-700/50 mt-2 ml-1">
          {filtered.length} {filtered.length === 1 ? 'note' : 'notes'}
        </p>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <span className="text-5xl mb-3">📝</span>
              <p
                className="text-xl text-amber-700/60"
                style={{ fontFamily: CAVEAT }}
              >
                {search ? 'No notes found' : 'Nothing here yet'}
              </p>
            </motion.div>
          ) : (
            <div className="columns-2 gap-3">
              {filtered.map((note) => (
                <div key={note.id} className="mb-3 break-inside-avoid">
                  <NoteCard
                    note={note}
                    onClick={() => setActiveNote(note)}
                    onDelete={(e) => {
                      e.stopPropagation()
                      deleteNote(note.id)
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Editor overlay — sits inside the window */}
      <AnimatePresence>
        {showEditor && (
          <NoteEditor
            note={isCreating ? null : activeNote}
            onClose={() => { setActiveNote(null); setIsCreating(false) }}
            onSave={saveNote}
            onDelete={deleteNote}
          />
        )}
      </AnimatePresence>
    </div>
  )
}