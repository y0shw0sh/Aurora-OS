import { useState, useEffect, useRef, useCallback } from 'react'
import { Song } from '@/lib/types/Song'
import { fastItunesService } from '@/lib/music/fastItunesService'

interface Props {
  songs: Song[]
  centerIndex: number
  preloadRadius?: number
}

export function useFastAlbumCovers({ songs, centerIndex, preloadRadius = 4 }: Props) {
  const [loadedCovers, setLoadedCovers] = useState<Map<string, string>>(new Map())
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set())
  const [attempted, setAttempted] = useState<Set<string>>(new Set())
  const queue = useRef<Set<string>>(new Set())

  const key = useCallback((song: Song) =>
    `${song.artist.toLowerCase()}-${song.title.toLowerCase()}`, [])

  const loadCover = useCallback(async (song: Song) => {
    const k = key(song)
    if (attempted.has(k) || loadedCovers.has(k) || queue.current.has(k)) return
    queue.current.add(k)
    setLoadingItems((p) => new Set([...p, song.id]))
    try {
      const cover = await fastItunesService.getAlbumCover(song.artist, song.title)
      if (cover) setLoadedCovers((p) => new Map([...p, [k, cover]]))
    } finally {
      setAttempted((p) => new Set([...p, k]))
      queue.current.delete(k)
      setLoadingItems((p) => { const s = new Set(p); s.delete(song.id); return s })
    }
  }, [key, loadedCovers, attempted])

  useEffect(() => {
    if (!songs.length) return
    const toLoad: Song[] = []
    if (songs[centerIndex]) toLoad.push(songs[centerIndex])
    for (let r = 1; r <= preloadRadius; r++) {
      if (songs[centerIndex - r]) toLoad.push(songs[centerIndex - r])
      if (songs[centerIndex + r]) toLoad.push(songs[centerIndex + r])
    }
    const run = async () => {
      for (let i = 0; i < toLoad.length; i++) {
        await loadCover(toLoad[i])
        if (i < toLoad.length - 1) await new Promise((r) => setTimeout(r, 50))
      }
    }
    run()
  }, [songs, centerIndex, preloadRadius, loadCover])

  const getCover = useCallback((song: Song) => loadedCovers.get(key(song)) ?? null, [key, loadedCovers])
  const isLoading = useCallback((id: string) => loadingItems.has(id), [loadingItems])

  return { getCover, isLoading, loadedCount: loadedCovers.size, totalSongs: songs.length }
}