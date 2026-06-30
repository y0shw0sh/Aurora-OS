'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apps } from '@/lib/apps'
import AppIcon from '@/components/AppIcon'
import AppWindow from '@/components/AppWindow'
import { useAuth } from '@/components/AuthProvider'
import TodoApp from '@/components/apps/TodoApp'
import NotesApp from '@/components/apps/NotesApp'
import GalleryApp from '@/components/apps/GalleryApp'
import LoungeApp from '@/components/apps/LoungeApp'

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
        <p className="text-white/50">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#1a1230] via-[#241a3d] to-[#0f0a1a]">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />

      <button
        onClick={signOut}
        className="absolute top-6 right-6 z-20 text-white/50 hover:text-white/90 text-sm transition-colors"
      >
        Sign out
      </button>

      <div className="relative z-10 px-6 pt-20">
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-6 max-w-xl mx-auto">
          {apps.map((app) => (
            <AppIcon
              key={app.id}
              id={app.id}
              name={app.name}
              emoji={app.emoji}
              color={app.color}
              onOpen={openApp}
            />
          ))}
        </div>
      </div>

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
{!['todo', 'notes', 'gallery', 'lounge'].includes(openAppConfig.id) && (
  <p className="text-white/60 text-sm">
    {openAppConfig.name} app — coming in a later phase.
  </p>
)}
        </AppWindow>
      )}
    </main>
  )
}