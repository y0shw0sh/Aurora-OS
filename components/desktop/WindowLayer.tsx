'use client'

import { useWindowManager, WindowState } from '@/lib/windowManager'
import AppWindow from '@/components/desktop/AppWindow'
import TodoApp from '@/components/apps/TodoApp'
import NotesApp from '@/components/apps/NotesApp'
import GalleryApp from '@/components/apps/GalleryApp'
import LoungeApp from '@/components/apps/LoungeApp'
import MusicApp from '@/components/apps/MusicApp'

function AppContent({ appId }: { appId: string }) {
  switch (appId) {
    case 'todo':    return <TodoApp />
    case 'notes':   return <NotesApp />
    case 'gallery': return <GalleryApp />
    case 'lounge':  return <LoungeApp />
    case 'music': return <MusicApp />
    default:
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm" style={{ color: 'rgba(0,0,0,0.4)' }}>Coming soon</p>
        </div>
      )
  }
}

export default function WindowLayer() {
  const { windows } = useWindowManager()
  return (
    <>
      {windows.map((win: WindowState) => (
  <AppWindow
    key={win.id}
    win={win}
    transparent={win.appId === 'gallery' || win.appId === 'lounge'}
  >
    <AppContent appId={win.appId} />
  </AppWindow>
))}
    </>
  )
}