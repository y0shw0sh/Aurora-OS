'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'

export interface DesktopLayout {
  wallpaper_url: string | null
  wallpaper_type: 'gradient' | 'image'
  dock_apps: string[]
}

const DEFAULT_LAYOUT: DesktopLayout = {
  wallpaper_url: null,
  wallpaper_type: 'gradient',
  dock_apps: ['todo', 'notes', 'gallery', 'lounge'],
}

export function useDesktopLayout() {
  const { session } = useAuth()
  const userId = session?.user.id
  const [layout, setLayout] = useState<DesktopLayout>(DEFAULT_LAYOUT)
  const [layoutLoading, setLayoutLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchLayout()
  }, [userId])

  const fetchLayout = async () => {
    const { data } = await supabase
      .from('desktop_layout')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (data) {
      setLayout({
        wallpaper_url: data.wallpaper_url,
        wallpaper_type: data.wallpaper_url ? 'image' : 'gradient',
        dock_apps: data.dock_apps ?? DEFAULT_LAYOUT.dock_apps,
      })
    }
    setLayoutLoading(false)
  }

  const uploadWallpaper = async (file: File) => {
    if (!userId) return
    const ext = file.name.split('.').pop()
    const path = `${userId}/wallpaper.${ext}`
    const { error } = await supabase.storage
      .from('gallery')
      .upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('gallery').getPublicUrl(path)
    const updated: DesktopLayout = {
      ...layout,
      wallpaper_url: data.publicUrl,
      wallpaper_type: 'image',
    }
    setLayout(updated)
    await supabase.from('desktop_layout').upsert({
      user_id: userId,
      wallpaper_url: data.publicUrl,
      dock_apps: layout.dock_apps,
      updated_at: new Date().toISOString(),
    })
  }

  const resetWallpaper = async () => {
    const updated: DesktopLayout = {
      ...layout,
      wallpaper_url: null,
      wallpaper_type: 'gradient',
    }
    setLayout(updated)
    await supabase.from('desktop_layout').upsert({
      user_id: userId,
      wallpaper_url: null,
      dock_apps: layout.dock_apps,
      updated_at: new Date().toISOString(),
    })
  }

  return { layout, layoutLoading, uploadWallpaper, resetWallpaper }
}