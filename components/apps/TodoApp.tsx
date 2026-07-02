'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Search, Plus, ChevronLeft, Trash2, X, Pin,
  Bold, Italic, List, StickyNote, CheckSquare, Check,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'

// ─── Constants ────────────────────────────────────────────────────────────────

const YELLOW = '#FFD60A'
const BLUE   = '#007AFF'
const RED    = '#FF3B30'

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskRow = { id: string; text: string; done: boolean }

interface TodoRow {
  id: string
  user_id: string
  type: 'todo' | 'note'
  title: string | null
  content: string
  tasks: TaskRow[]
  pinned: boolean
  is_private: boolean
  created_at: string
  updated_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now  = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (diff === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff === 1) return 'Yesterday'
  if (diff < 7)  return date.toLocaleDateString([], { weekday: 'long' })
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function uid() { return Math.random().toString(36).slice(2, 9) }

// ─── Kind badge ───────────────────────────────────────────────────────────────

function KindBadge({ kind }: { kind: 'todo' | 'note' }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full shrink-0"
      style={{
        background: kind === 'todo' ? 'rgba(255,214,10,0.15)' : 'rgba(0,122,255,0.12)',
        color:      kind === 'todo' ? '#c49e00' : BLUE,
      }}
    >
      {kind === 'todo' ? <CheckSquare size={8} /> : <StickyNote size={8} />}
      {kind === 'todo' ? 'To Do' : 'Note'}
    </span>
  )
}

// ─── Progress ring ────────────────────────────────────────────────────────────

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r    = 10
  const circ = 2 * Math.PI * r
  const pct  = total === 0 ? 0 : done / total
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" className="shrink-0">
      <circle cx={12} cy={12} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={2.5} />
      <circle
        cx={12} cy={12} r={r} fill="none"
        stroke={YELLOW} strokeWidth={2.5}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform="rotate(-90 12 12)"
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
      {pct === 1 && (
        <path d="M7.5 12 L10.5 15 L16.5 9" stroke={YELLOW} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

// ─── Item row ─────────────────────────────────────────────────────────────────

function ItemRow({ item, onClick, onDelete }: {
  item: TodoRow
  onClick: () => void
  onDelete: () => void
}) {
  const [revealed, setRevealed] = useState(false)
  const dragRef = useRef(0)
  const tasks     = item.tasks ?? []
  const doneTasks = tasks.filter(t => t.done).length
  const preview   = item.type === 'note'
    ? item.content
    : tasks.slice(0, 3).map(t => (t.done ? '✓ ' : '○ ') + t.text).join('  ·  ')

  return (
    <div className="relative overflow-hidden border-b last:border-0" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
      {/* Delete action */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-stretch z-0"
        animate={{ width: revealed ? 72 : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      >
        <button
          onClick={onDelete}
          className="w-full flex flex-col items-center justify-center gap-0.5 text-white text-[10px] font-medium"
          style={{ background: RED }}
        >
          <Trash2 size={14} />
          Delete
        </button>
      </motion.div>

      <motion.div
        className="relative z-10 px-4 py-3 cursor-pointer select-none flex items-start gap-3"
        style={{ background: '#fffef9' }}
        drag="x"
        dragConstraints={{ left: -72, right: 0 }}
        dragElastic={{ left: 0.05, right: 0 }}
        onDrag={(_, info) => { dragRef.current = info.offset.x }}
        onDragEnd={(_, info) => { setRevealed(info.offset.x < -36) }}
        animate={{ x: revealed ? -72 : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onClick={() => {
          if (Math.abs(dragRef.current) < 5) {
            if (revealed) setRevealed(false)
            else onClick()
          }
        }}
      >
        {item.type === 'todo'
          ? <ProgressRing done={doneTasks} total={tasks.length} />
          : <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <StickyNote size={14} style={{ color: BLUE, opacity: 0.7 }} />
            </div>
        }

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            {item.pinned && <Pin size={9} style={{ color: YELLOW, fill: YELLOW }} className="shrink-0" />}
            <span className="text-[13px] font-semibold truncate leading-snug" style={{ color: '#1c1c1e' }}>
              {item.title || 'Untitled'}
            </span>
            <KindBadge kind={item.type} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] shrink-0" style={{ color: '#8e8e93' }}>{formatDate(item.updated_at)}</span>
            <p className="text-[11px] truncate" style={{ color: '#8e8e93' }}>{preview}</p>
          </div>
          {item.type === 'todo' && (
            <p className="text-[10px] mt-0.5" style={{ color: '#8e8e93' }}>
              {doneTasks}/{tasks.length} completed
            </p>
          )}
        </div>

        <ChevronLeft size={12} className="shrink-0 mt-1 rotate-180 opacity-25" />
      </motion.div>
    </div>
  )
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({ done, onChange }: { done: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all active:scale-90"
      style={{ borderColor: done ? YELLOW : 'rgba(0,0,0,0.25)', background: done ? YELLOW : 'transparent' }}
    >
      {done && <Check size={10} color="#1c1c1e" strokeWidth={3} />}
    </button>
  )
}

// ─── Item editor ──────────────────────────────────────────────────────────────

function ItemEditor({ item, onSave, onClose, readOnly }: {
  item: Partial<TodoRow> & { type: 'todo' | 'note' }
  onSave: (updated: Partial<TodoRow>) => Promise<void>
  onClose: () => void
  readOnly?: boolean
}) {
  const [title,   setTitle]   = useState(item.title ?? '')
  const [content, setContent] = useState(item.content ?? '')
  const [tasks,   setTasks]   = useState<TaskRow[]>(item.tasks ?? [])
  const [newTask, setNewTask] = useState('')
  const [saving,  setSaving]  = useState(false)
  const newTaskRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    setSaving(true)
    await onSave({ title: title || (item.type === 'todo' ? 'New To Do' : 'New Note'), content, tasks })
    setSaving(false)
    onClose()
  }

  const toggleTask = (id: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const addTask = () => {
    if (!newTask.trim()) return
    setTasks(prev => [...prev, { id: uid(), text: newTask.trim(), done: false }])
    setNewTask('')
    newTaskRef.current?.focus()
  }

  const deleteTask = (id: string) =>
    setTasks(prev => prev.filter(t => t.id !== id))

  const done = tasks.filter(t => t.done).length

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      className="absolute inset-0 z-30 flex flex-col"
      style={{ background: '#fffef9' }}
    >
      {/* Toolbar */}
      <div
        className="shrink-0 flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'rgba(255,254,249,0.9)', backdropFilter: 'blur(16px)' }}
      >
        <button
          onClick={handleSave}
          className="flex items-center gap-0.5 px-1 py-1 rounded active:opacity-50 transition-opacity text-[13px] font-medium"
          style={{ color: YELLOW }}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
          Back
        </button>
        <KindBadge kind={item.type} />
        {!readOnly && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-2 py-1 rounded text-[13px] font-semibold active:opacity-50"
            style={{ color: YELLOW, opacity: saving ? 0.5 : 1 }}
          >
            Done
          </button>
        )}
        {readOnly && <div className="w-12" />}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-4">
        <p className="text-[10px] text-center mb-3 font-medium" style={{ color: '#8e8e93' }}>
          {item.updated_at ? formatDate(item.updated_at) : formatDate(new Date().toISOString())}
        </p>

        {/* Title */}
        {readOnly
          ? <h2 className="text-[18px] font-bold mb-3 leading-tight" style={{ color: '#1c1c1e' }}>{title}</h2>
          : <input
              autoFocus
              className="w-full bg-transparent text-[18px] font-bold placeholder:opacity-40 outline-none mb-3 leading-tight"
              style={{ color: '#1c1c1e', caretColor: YELLOW }}
              placeholder={item.type === 'todo' ? 'To Do Title' : 'Note Title'}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
        }

        {/* Note body */}
        {item.type === 'note' && (
          readOnly
            ? <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: '#1c1c1e' }}>{content}</p>
            : <textarea
                className="w-full bg-transparent text-[14px] placeholder:opacity-40 outline-none leading-relaxed resize-none"
                style={{ color: '#1c1c1e', caretColor: YELLOW, minHeight: '50vh' }}
                placeholder="Start writing…"
                value={content}
                onChange={e => setContent(e.target.value)}
              />
        )}

        {/* Todo tasks */}
        {item.type === 'todo' && (
          <div>
            {!readOnly && (
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#8e8e93' }}>
                {done}/{tasks.length} completed
              </p>
            )}

            <div className="space-y-1">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 py-2 group">
                  <Checkbox done={task.done} onChange={() => !readOnly && toggleTask(task.id)} />
                  <span
                    className="flex-1 text-[14px] leading-snug transition-all"
                    style={{ color: task.done ? '#8e8e93' : '#1c1c1e', textDecoration: task.done ? 'line-through' : 'none' }}
                  >
                    {task.text}
                  </span>
                  {!readOnly && (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                      style={{ color: RED }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!readOnly && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: 'rgba(0,0,0,0.18)' }}>
                  <Plus size={10} style={{ color: '#8e8e93' }} />
                </div>
                <input
                  ref={newTaskRef}
                  className="flex-1 bg-transparent text-[14px] placeholder:opacity-40 outline-none"
                  style={{ color: '#1c1c1e', caretColor: YELLOW }}
                  placeholder="New item…"
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTask() }}
                />
                {newTask && (
                  <button onClick={addTask} className="text-[12px] font-semibold px-2 py-0.5 rounded" style={{ color: YELLOW }}>
                    Add
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Format bar for notes */}
      {item.type === 'note' && !readOnly && (
        <div
          className="shrink-0 border-t px-4 py-2 flex items-center justify-around"
          style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'rgba(255,254,249,0.9)', backdropFilter: 'blur(16px)' }}
        >
          {[Bold, Italic, List].map((Icon, i) => (
            <button key={i} className="p-2 rounded active:opacity-50 transition-opacity" style={{ color: YELLOW }}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─── New item picker ──────────────────────────────────────────────────────────

function NewItemPicker({ onPick, onClose }: {
  onPick: (kind: 'todo' | 'note') => void
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-end"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        className="w-full rounded-t-2xl overflow-hidden"
        style={{ background: '#fffef9' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: 'rgba(0,0,0,0.15)' }} />
        <p className="text-center text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: '#8e8e93' }}>
          Create new
        </p>

        <div className="grid grid-cols-2 gap-3 px-4 pb-6">
          {([
            { kind: 'todo' as const, icon: CheckSquare, label: 'To Do', desc: 'Tasks with checkboxes', color: YELLOW },
            { kind: 'note' as const, icon: StickyNote,  label: 'Note',  desc: 'Free-form writing',    color: BLUE  },
          ]).map(({ kind, icon: Icon, label, desc, color }) => (
            <button
              key={kind}
              onClick={() => onPick(kind)}
              className="flex flex-col items-center gap-2 py-5 rounded-2xl border active:scale-95 transition-transform"
              style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.06)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: kind === 'todo' ? 'rgba(255,214,10,0.15)' : 'rgba(0,122,255,0.1)' }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: '#1c1c1e' }}>{label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#8e8e93' }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main TodoApp ─────────────────────────────────────────────────────────────

export default function TodoApp() {
  const { session } = useAuth()
  const userId = session?.user.id

  const [allItems, setAllItems]       = useState<TodoRow[]>([])
  const [section, setSection]         = useState<'mine' | 'theirs'>('mine')
  const [search, setSearch]           = useState('')
  const [activeItem, setActiveItem]   = useState<TodoRow | null>(null)
  const [picking, setPicking]         = useState(false)
  const [composingKind, setComposingKind] = useState<'todo' | 'note' | null>(null)

  useEffect(() => {
    fetchItems()
    const channel = supabase
      .channel('todos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, fetchItems)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchItems = async () => {
    const { data } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setAllItems(data as TodoRow[])
  }

  const saveItem = async (updated: Partial<TodoRow>) => {
    if (activeItem) {
      await supabase.from('todos').update({
        title:      updated.title ?? null,
        content:    updated.content ?? '',
        tasks:      updated.tasks ?? [],
        updated_at: new Date().toISOString(),
      }).eq('id', activeItem.id)
    } else if (composingKind) {
      await supabase.from('todos').insert({
        user_id:  userId,
        type:     composingKind,
        title:    updated.title ?? null,
        content:  updated.content ?? '',
        tasks:    updated.tasks ?? [],
        pinned:   false,
        is_private: false,
      })
    }
    await fetchItems()
  }

  const deleteItem = async (id: string) => {
    await supabase.from('todos').delete().eq('id', id)
    await fetchItems()
  }

  const myItems    = allItems.filter(i => i.user_id === userId)
  const theirItems = allItems.filter(i => i.user_id !== userId)
  const items      = section === 'mine' ? myItems : theirItems
  const readOnly   = section === 'theirs'

  const filtered = items.filter(n => {
    const q = search.toLowerCase()
    return (n.title ?? '').toLowerCase().includes(q)
      || n.content.toLowerCase().includes(q)
      || (n.tasks ?? []).some(t => t.text.toLowerCase().includes(q))
  })

  const pinned = filtered.filter(n => n.pinned)
  const rest   = filtered.filter(n => !n.pinned)

  const editorItem = activeItem ?? (composingKind ? { type: composingKind, tasks: [] } as Partial<TodoRow> & { type: 'todo' | 'note' } : null)

  function SectionLabel({ label }: { label: string }) {
    return (
      <div className="px-4 pt-3 pb-1.5 flex items-center gap-1.5">
        {label === 'Pinned' && <Pin size={8} style={{ color: YELLOW, fill: YELLOW }} />}
        <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#8e8e93' }}>{label}</span>
      </div>
    )
  }

  return (
    <div
      className="w-full h-full flex flex-col relative overflow-hidden"
      style={{ background: '#f2f1ec', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}
    >
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-end justify-between mb-3">
          <h1 className="text-[24px] font-bold tracking-tight leading-none" style={{ color: '#1c1c1e' }}>
            To-Do
          </h1>
          {!readOnly && (
            <button
              onClick={() => setPicking(true)}
              className="w-7 h-7 rounded-full flex items-center justify-center active:opacity-60 transition-opacity"
              style={{ background: YELLOW, color: '#1c1c1e' }}
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Mine / Theirs segmented control */}
        <div className="flex rounded-[9px] p-[3px] relative mb-3" style={{ background: '#e5e4df' }}>
          <motion.div
            className="absolute rounded-[7px] shadow-sm"
            style={{ background: '#fffef9', top: 3, bottom: 3 }}
            animate={{ left: section === 'mine' ? 3 : '50%', right: section === 'mine' ? '50%' : 3 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          />
          {(['mine', 'theirs'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className="flex-1 relative z-10 py-[5px] text-[11px] font-semibold text-center transition-colors"
              style={{ color: section === s ? '#1c1c1e' : '#8e8e93' }}
            >
              {s === 'mine' ? `Mine (${myItems.length})` : `Theirs (${theirItems.length})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-[10px] px-3 py-2" style={{ background: '#e5e4df' }}>
          <Search size={13} style={{ color: '#8e8e93' }} className="shrink-0" />
          <input
            className="flex-1 bg-transparent text-[13px] placeholder:opacity-50 outline-none"
            style={{ color: '#1c1c1e', caretColor: YELLOW }}
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')}><X size={12} style={{ color: '#8e8e93' }} /></button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto rounded-t-xl" style={{ background: '#fffef9' }}>
        {pinned.length > 0 && (
          <>
            <SectionLabel label="Pinned" />
            {pinned.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                onClick={() => setActiveItem(item)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </>
        )}
        {rest.length > 0 && (
          <>
            <SectionLabel label={pinned.length > 0 ? 'Other' : 'All'} />
            {rest.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                onClick={() => setActiveItem(item)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </>
        )}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-16 gap-1 px-8 text-center">
            <p className="text-[13px] font-medium" style={{ color: '#8e8e93' }}>
              {search ? 'No results' : section === 'mine' ? 'Nothing here yet' : 'Nothing shared'}
            </p>
            {!search && section === 'mine' && (
              <p className="text-[11px]" style={{ color: '#aeaeb2' }}>Tap + to create a to-do or note</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        className="shrink-0 border-t px-4 py-2.5 flex items-center justify-between"
        style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'rgba(255,254,249,0.9)', backdropFilter: 'blur(16px)' }}
      >
        <span className="text-[11px]" style={{ color: '#8e8e93' }}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,214,10,0.15)', color: '#c49e00' }}>
            {items.filter(i => i.type === 'todo').length} to-dos
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,122,255,0.1)', color: BLUE }}>
            {items.filter(i => i.type === 'note').length} notes
          </span>
        </div>
      </div>

      {/* Editor overlay */}
      <AnimatePresence>
        {editorItem && (
          <ItemEditor
            key={activeItem?.id ?? 'new'}
            item={editorItem as Partial<TodoRow> & { type: 'todo' | 'note' }}
            onSave={saveItem}
            onClose={() => { setActiveItem(null); setComposingKind(null) }}
            readOnly={readOnly && !!activeItem}
          />
        )}
      </AnimatePresence>

      {/* New item picker */}
      <AnimatePresence>
        {picking && (
          <NewItemPicker
            onPick={kind => { setPicking(false); setComposingKind(kind); setActiveItem(null) }}
            onClose={() => setPicking(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}