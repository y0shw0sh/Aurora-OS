'use client'

import { motion } from 'motion/react'

interface AppIconProps {
  id: string
  name: string
  emoji: string
  color: string
  onOpen: (id: string) => void
}

export default function AppIcon({ id, name, emoji, color, onOpen }: AppIconProps) {
  return (
    <button
      onClick={() => onOpen(id)}
      className="flex flex-col items-center gap-1.5 group"
    >
      <motion.div
        layoutId={`app-${id}`}
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-white/10"
        style={{ background: color }}
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.08, y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        {emoji}
      </motion.div>
      <span className="text-[11px] text-white/60 group-hover:text-white/90 transition-colors font-medium">
        {name}
      </span>
    </button>
  )
}