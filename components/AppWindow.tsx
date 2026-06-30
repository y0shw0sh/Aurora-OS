'use client'

import { motion, AnimatePresence } from 'motion/react'
import { ReactNode } from 'react'

interface AppWindowProps {
  id: string
  name: string
  color: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export default function AppWindow({ id, name, color, isOpen, onClose, children }: AppWindowProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            layoutId={`app-${id}`}
            className="fixed z-50 top-[8%] left-1/2 -translate-x-1/2 w-[90%] max-w-2xl h-[78%] rounded-3xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-2xl flex flex-col"
            style={{ background: color }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-white font-semibold text-lg">{name}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 text-white/90">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
