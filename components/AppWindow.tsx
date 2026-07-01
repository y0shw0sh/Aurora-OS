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

export default function AppWindow({
  id,
  name,
  color,
  isOpen,
  onClose,
  children,
}: AppWindowProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            layoutId={`app-${id}`}
            className="fixed z-50 bottom-0 left-0 right-0 sm:top-[5%] sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[92%] sm:max-w-lg w-full rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/15 backdrop-blur-2xl flex flex-col"
            style={{
              background: `linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)`,
              backdropFilter: 'blur(40px)',
              maxHeight: '88vh',
            }}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Handle bar for mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-white/10"
              style={{ background: color, opacity: 0.9 }}
            >
              <h2 className="text-white font-semibold text-base">{name}</h2>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 text-white/90 min-h-0">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}