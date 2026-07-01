'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { apps } from '@/lib/apps'
import AppIcon from '@/components/AppIcon'
import AppWindow from '@/components/AppWindow'
import { useAuth } from '@/components/AuthProvider'
import TodoApp from '@/components/apps/TodoApp'
import NotesApp from '@/components/apps/NotesApp'
import GalleryApp from '@/components/apps/GalleryApp'
import LoungeApp from '@/components/apps/LoungeApp'

function Clock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center select-none">
      <p className="text-white/90 text-6xl font-thin tracking-tight">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
      <p className="text-white/50 text-sm mt-1">
        {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
    </div>
  )
}

export default function Desktop() {
  const [openAppId, setOpenAppId] = useState<string | null>(null)
  const { session, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login')
    }
  }, [loading, session, router])

  const openApp = (id: string) => setOpenAppId(id)
  const closeApp = () => setOpenAppId(null)
  const openAppConfig = apps.find((a) => a.id === openAppId)

  if (loading || !session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0f0a1a]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/30 text-sm"
        >
          Loading...
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen w-full relative overflow-hidden bg-[#0f0a1a] flex flex-col">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] bg-pink-600/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[120px]" />
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="absolute top-5 right-5 z-20 text-white/30 hover:text-white/70 text-xs transition-colors"
      >
        Sign out
      </button>

      {/* Clock */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 pb-32">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
          className="mb-16"
        >
          <Clock />
        </motion.div>

        {/* App grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
          className="grid grid-cols-4 gap-5 px-8 max-w-xs w-full mx-auto"
        >
          {apps.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                delay: 0.15 + i * 0.05,
              }}
            >
              <AppIcon
                id={app.id}
                name={app.name}
                emoji={app.emoji}
                color={app.color}
                onOpen={openApp}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Dock */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.4 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => openApp(app.id)}
              className="flex flex-col items-center gap-1 group"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.15, y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                style={{ background: app.color }}
              >
                {app.emoji}
              </motion.div>
              <span className="text-[9px] text-white/40 group-hover:text-white/70 transition-colors">
                {app.name}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* App window */}
      {openAppConfig && (
        <AppWindow
          id={openAppConfig.id}
          name={openAppConfig.name}
          color={openAppConfig.color}
          isOpen={!!openAppId}
          onClose={closeApp}
        >
          {openAppConfig.id === 'todo' && <TodoApp />}
          {openAppConfig.id === 'notes' && <NotesApp />}
          {openAppConfig.id === 'gallery' && <GalleryApp />}
          {openAppConfig.id === 'lounge' && <LoungeApp />}
        </AppWindow>
      )}
    </main>
  )
}