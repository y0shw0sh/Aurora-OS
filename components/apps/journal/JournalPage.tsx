'use client'

import Polaroid from '@/components/apps/journal/Polaroid'
import { JournalEntry } from '@/lib/types'

interface JournalPageProps {
  entries: JournalEntry[]
  pageNumber: number
  userId?: string
  onDelete: (id: string) => void
  side: 'left' | 'right'
}

export default function JournalPage({ entries, pageNumber, userId, onDelete, side }: JournalPageProps) {
  return (
    <div
      className="relative flex-1 min-w-0 h-full rounded-md p-8 flex flex-col overflow-hidden"
      style={{
  backgroundColor: '#f8f1df',
  backgroundImage: `
    repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 31px,
      rgba(80,120,255,0.16) 32px
    ),
    linear-gradient(
      to right,
      rgba(220,60,60,0.22) 0px,
      rgba(220,60,60,0.22) 2px,
      transparent 2px
    )
  `,
  backgroundSize: '100% 32px, 100% 100%',
  backgroundPosition: '0 18px, 52px 0',
  boxShadow:
    side === 'left'
      ? 'inset -8px 0 16px -12px rgba(0,0,0,0.35)'
      : 'inset 8px 0 16px -12px rgba(0,0,0,0.35)',
}}
    >
      <div className="flex-1 grid grid-cols-1 grid-rows-2 gap-10 content-start px-6 py-4 overflow-hidden">
        {entries.map((entry, i) => (
          <Polaroid key={entry.id} entry={entry} index={i} isMine={entry.user_id === userId} onDelete={onDelete} />
        ))}
        {entries.length === 0 && (
          <div className="col-span-2 row-span-2 flex items-center justify-center">
            <p className="text-sm italic" style={{ fontFamily: "'Patrick Hand', cursive", color: '#3a322640' }}>
              Empty page
            </p>
          </div>
        )}
      </div>

      <p className="text-center text-[10px] mt-2" style={{ fontFamily: "'Patrick Hand', cursive", color: '#3a322640' }}>
        {pageNumber}
      </p>
    </div>
  )
}