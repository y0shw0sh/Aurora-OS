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
      className="flex flex-col items-center gap-2 group"
    >
      <motion.div
        layoutId={`app-${id}`}
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg backdrop-blur-xl border border-white/20"
        style={{ background: color }}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {emoji}
      </motion.div>
      <span className="text-xs text-white/80 font-medium">{name}</span>
    </button>
  )
}