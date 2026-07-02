'use client'

import { motion, AnimatePresence } from 'motion/react'
import { Todo } from '@/lib/types'

interface NotepadColumnProps {
  title: string
  todos: Todo[]
  tilt: number
  accent: string
  canEdit: boolean
  onToggle: (t: Todo) => void
  onDelete: (id: string) => void
}

export default function NotepadColumn({
  title,
  todos,
  tilt,
  accent,
  canEdit,
  onToggle,
  onDelete,
}: NotepadColumnProps) {
  const done = todos.filter((t) => t.completed).length
  const paperHeight = Math.max(280, 90 + todos.length * 52)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className="flex-1 min-w-0"
      style={{ transformOrigin: 'top center' }}
    >
      <div
        className="relative rounded-sm overflow-hidden"
        style={{
          background: '#faf6ec',
          boxShadow:
            '0 14px 30px rgba(0,0,0,0.35), 0 3px 8px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(0,0,0,0.04)',
        }}
      >
        {/* spiral binding */}
        <div className="absolute top-0 left-0 right-0 h-4 flex items-center justify-evenly px-4 z-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-black/15" />
          ))}
        </div>

        {/* header */}
        <div className="pt-6 px-5 pb-2 flex items-center justify-between" style={{ borderBottom: `2px solid ${accent}30` }}>
          <h3
            className="text-xl"
            style={{ fontFamily: "'Caveat', cursive", color: '#3a3226', fontWeight: 700 }}
          >
            {title}
          </h3>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full"
            style={{ background: `${accent}22`, color: accent, fontFamily: "'Patrick Hand', cursive" }}
          >
            {done}/{todos.length}
          </span>
        </div>

        {/* paper body */}
        <div
          className="relative overflow-y-auto transition-[height] duration-300 ease-out"
          style={{
            height: Math.min(paperHeight, 420),
            backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 33px, rgba(58,50,38,0.09) 34px)`,
            backgroundPosition: '0 4px',
          }}
        >
          {/* red margin line */}
          <div className="absolute top-0 bottom-0 left-8 w-px" style={{ background: 'rgba(220,90,90,0.25)' }} />

          <div className="pl-12 pr-4 pt-1">
            <AnimatePresence>
              {todos.map((todo) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                  className="flex items-center gap-3 group"
                  style={{ height: '34px' }}
                >
                  <button
                    onClick={() => canEdit && onToggle(todo)}
                    disabled={!canEdit}
                    className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{
                      border: `2px solid ${todo.completed ? accent : '#3a322666'}`,
                      background: todo.completed ? accent : 'transparent',
                    }}
                  >
                    {todo.completed && (
                      <motion.svg
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        width="9" height="7" viewBox="0 0 9 7"
                      >
                        <motion.path
                          d="M1 3.5L3.2 5.7L8 1"
                          stroke="white" strokeWidth="1.5" fill="none"
                          strokeLinecap="round" strokeLinejoin="round"
                        />
                      </motion.svg>
                    )}
                  </button>

                  <span
                    className="flex-1 text-[15px] truncate"
                    style={{
                      fontFamily: "'Patrick Hand', cursive",
                      color: todo.completed ? '#3a322655' : '#3a3226',
                      textDecoration: todo.completed ? 'line-through wavy' : 'none',
                      textDecorationColor: '#c65c5c88',
                    }}
                  >
                    {todo.text}
                  </span>

                  {canEdit && (
                    <button
                      onClick={() => onDelete(todo.id)}
                      className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-xs transition-opacity flex-shrink-0"
                      style={{ color: '#c65c5c' }}
                    >
                      ✕
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {todos.length === 0 && (
              <p
                className="text-sm italic pt-1"
                style={{ fontFamily: "'Patrick Hand', cursive", color: '#3a322644' }}
              >
                Nothing written yet...
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
