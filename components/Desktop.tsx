'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useDesktopLayout } from '@/lib/useDesktopLayout'
import DesktopBackground from '@/components/desktop/DesktopBackground'
import MenuBar from '@/components/desktop/MenuBar'
import Dock from '@/components/desktop/Dock'
import WindowLayer from '@/components/desktop/WindowLayer'

export default function Desktop() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const { layout, uploadWallpaper, resetWallpaper } = useDesktopLayout()

  useEffect(() => {
    if (!loading && !session) router.push('/login')
  }, [loading, session, router])

  if (loading || !session) {
    return (
      <div
        className="w-screen h-screen flex items-center justify-center"
        style={{
          background: 'radial-gradient(ellipse at 20% 30%, #c9a0dc 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #a8c4e8 0%, transparent 45%), linear-gradient(135deg, #b6c8f0 0%, #d4a8d8 40%, #f0b8cc 70%, #c4d8f4 100%)',
        }}
      >
        <p style={{ color: 'rgba(0,0,0,0.4)', fontSize: 13 }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ cursor: 'default' }}>
      <DesktopBackground wallpaperUrl={layout.wallpaper_url} />
      <MenuBar
        onUploadWallpaper={uploadWallpaper}
        onResetWallpaper={resetWallpaper}
      />
      <div className="absolute inset-0" style={{ top: 28, bottom: 88 }} />
      <WindowLayer />
      <Dock />
    </div>
  )
}