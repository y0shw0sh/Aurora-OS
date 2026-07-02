'use client'

import { motion } from 'motion/react'
import { JournalEntry } from '@/lib/types'
import { useState } from 'react'

const TILTS = [-4, 3, -2, 5, -5, 2, 1, -3]

interface PolaroidProps {
  entry: JournalEntry
  index: number
  isMine: boolean
  onDelete: (id: string) => void
}

export default function Polaroid({
  entry,
  index,
  isMine,
  onDelete,
}: PolaroidProps) {
  const tilt = TILTS[index % TILTS.length]

  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 40,
        rotate: tilt,
        scale: 0.92,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: tilt,
        scale: 1,
      }}
      whileHover={{
        scale: 1.04,
        rotate: tilt * 0.35,
        y: -10,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 180,
        damping: 18,
      }}
      className="relative break-inside-avoid mb-16 w-full max-w-[340px] mx-auto group overflow-visible"
    >
      <div
        className="absolute top-[-12px] left-1/2 -translate-x-1/2 w-20 h-6 rotate-[-3deg] opacity-80 z-20"
        style={{
          background:
            'linear-gradient(to bottom, rgba(255,192,203,0.65), rgba(255,182,193,0.45))',
          backdropFilter: 'blur(1px)',
        }}
      />

      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-30"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #ff9a9a, #c65c5c)',
          boxShadow: '0 3px 4px rgba(0,0,0,0.45)',
        }}
      />

      <div
        className="relative p-4 pb-6 rounded-[4px] overflow-hidden"
        style={{
          background: '#fffdf8',
          boxShadow:
            '0 18px 30px rgba(0,0,0,0.22), 0 6px 10px rgba(0,0,0,0.12)',
        }}
      >
        <div
          className="w-full aspect-[4/5.2] rounded-[2px] overflow-hidden"
          style={{
            background: '#ece7de',
          }}
        >
          <img
            src={entry.photo_url}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {entry.entry_text && (
          <p
            onClick={() => setExpanded((p) => !p)}
            className={`text-[15px] mt-4 px-1 leading-snug cursor-pointer transition-all ${
              expanded ? '' : 'line-clamp-2'
            }`}
            style={{
              fontFamily: "'Patrick Hand', cursive",
              color: '#3a3226dd',
            }}
          >
            {entry.entry_text}
          </p>
        )}

        <div className="flex items-center justify-between mt-4 px-1">
          <p
            className="text-[12px]"
            style={{
              fontFamily: "'Patrick Hand', cursive",
              color: '#7d6a59',
            }}
          >
            {new Date(entry.created_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>

          {isMine && (
            <button
              onClick={() => onDelete(entry.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-[#8c6f5c] hover:text-red-500"
            >
              delete
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}