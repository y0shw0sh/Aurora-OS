'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Song } from '@/lib/types/Song'
import { getAllAlbums, searchAlbums, AlbumData } from '@/lib/music/albumsDatabase'
import { useFastAlbumCovers } from '@/lib/music/useFastAlbumCovers'

// ─── Helpers ────────────────────────────────────────────────────────────────

function toSong(a: AlbumData): Song {
  return { id: a.id, title: a.title, artist: a.artist, albumCover: a.albumCover, youtubeId: a.youtubeId, albumName: a.albumName, year: a.year }
}

// ─── YouTube Player ──────────────────────────────────────────────────────────

function YoutubePlayer({ youtubeId, onReady, playerRef }: {
  youtubeId: string
  onReady: () => void
  playerRef: React.MutableRefObject<any>
}) {
  useEffect(() => {
    const init = () => {
      if (playerRef.current) playerRef.current.destroy?.()
      playerRef.current = new (window as any).YT.Player('yt-player-aurora', {
        height: '0', width: '0',
        videoId: youtubeId,
        playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => onReady(),
        }
      })
    }

    if (!(window as any).YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
      ;(window as any).onYouTubeIframeAPIReady = init
    } else {
      init()
    }
    return () => { playerRef.current?.destroy?.() }
  }, [youtubeId])

  return <div id="yt-player-aurora" style={{ display: 'none' }} />
}

// ─── CoverFlow ───────────────────────────────────────────────────────────────

function CoverFlow({ songs, currentIndex, setCurrentIndex, getCover, isLoading }: {
  songs: Song[]
  currentIndex: number
  setCurrentIndex: (i: number) => void
  getCover: (s: Song) => string | null
  isLoading: (id: string) => boolean
}) {
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)

  const getTransform = (i: number) => {
    const off = i - currentIndex + (dragging ? drag / 120 : 0)
    const SPACING = 150, ROT = 55
    if (Math.abs(off) < 0.1) return `translateX(0) translateZ(260px) rotateY(0deg) scale(1.25)`
    const d = Math.abs(off)
    const x = Math.sign(off) * SPACING * d
    const z = -80 * d
    const scale = Math.max(0.78, 1.1 - d * 0.04)
    return `translateX(${x}px) translateZ(${z}px) rotateY(${Math.sign(off) * -ROT}deg) scale(${scale})`
  }

  const getZ = (i: number) => Math.max(1, 100 - Math.abs(i - currentIndex) * 10)

  const onDown = (x: number) => { setDragging(true); startX.current = x; setDrag(0) }
  const onMove = (x: number) => { if (dragging) setDrag(x - startX.current) }
  const onUp = () => {
    setDragging(false)
    if (Math.abs(drag) > 50) {
      const next = drag < 0
        ? Math.min(songs.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1)
      setCurrentIndex(next)
    }
    setDrag(0)
  }

  return (
    <div
      className="relative flex items-center justify-center overflow-visible select-none"
      style={{ height: 220, perspective: 1400, cursor: dragging ? 'grabbing' : 'grab' }}
      onMouseDown={(e) => onDown(e.clientX)}
      onMouseMove={(e) => onMove(e.clientX)}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchStart={(e) => onDown(e.touches[0].clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
      onTouchEnd={onUp}
    >
      {songs.map((song, i) => {
        const cover = getCover(song)
        const loading = isLoading(song.id)
        const SIZE = 160

        return (
          <div
            key={song.id}
            className="absolute"
            style={{
              transform: getTransform(i),
              zIndex: getZ(i),
              transformStyle: 'preserve-3d',
              transition: dragging ? 'none' : 'all 380ms cubic-bezier(0.23,1,0.32,1)',
              opacity: Math.max(0.7, 1 - Math.abs(i - currentIndex) * 0.06),
            }}
            onClick={() => !dragging && setCurrentIndex(i)}
          >
            <div style={{ width: SIZE, height: SIZE, position: 'relative' }}>
              {cover ? (
                <img
                  src={cover}
                  alt={song.title}
                  draggable={false}
                  className="w-full h-full object-cover rounded-lg"
                  style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)' }}
                />
              ) : (
                <div
                  className="w-full h-full rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1a1a2e, #0d0d1a)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}
                >
                  {loading
                    ? <div className="w-5 h-5 border-b-2 border-white/50 rounded-full animate-spin" />
                    : <span className="text-3xl">🎵</span>
                  }
                </div>
              )}

              {/* Glass sheen */}
              <div className="absolute inset-0 rounded-lg pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)' }} />

              {/* Reflection */}
              {cover && (
                <div className="absolute top-full left-0 w-full rounded-lg pointer-events-none"
                  style={{
                    height: SIZE * 0.5,
                    backgroundImage: `url(${cover})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: 'scaleY(-1)',
                    maskImage: 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, transparent 60%)',
                    WebkitMaskImage: 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, transparent 60%)',
                    filter: 'blur(0.5px) brightness(0.5)',
                  }}
                />
              )}

              {/* Center indicator */}
              {i === currentIndex && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse shadow-lg" />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── MusicApp ────────────────────────────────────────────────────────────────

export default function MusicApp() {
  const [songs, setSongs] = useState<Song[]>(() => getAllAlbums().map(toSong))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [search, setSearch] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const playerRef = useRef<any>(null)

  const { getCover, isLoading } = useFastAlbumCovers({ songs, centerIndex: currentIndex, preloadRadius: 4 })

  const currentSong = songs[currentIndex] ?? null

  useEffect(() => {
    if (search.trim()) {
      const results = searchAlbums(search)
      setSongs(results.length ? results.map(toSong) : getAllAlbums().map(toSong))
      setCurrentIndex(0)
    } else {
      setSongs(getAllAlbums().map(toSong))
      setCurrentIndex(0)
    }
  }, [search])

  const handleReady = () => {
    setPlayerReady(true)
    setTimeout(() => {
      playerRef.current?.playVideo?.()
      setIsPlaying(true)
    }, 300)
  }

  const togglePlay = () => {
    if (!playerReady) return
    if (isPlaying) {
      playerRef.current?.pauseVideo?.()
      setIsPlaying(false)
    } else {
      playerRef.current?.playVideo?.()
      setIsPlaying(true)
    }
  }

  const selectSong = (i: number) => {
    setCurrentIndex(i)
    setPlayerReady(false)
    setIsPlaying(false)
    setShowPlayer(true)
  }

  const handlePlay = () => {
    setShowPlayer(true)
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #000 0%, #111 100%)', color: 'white' }}
    >
      {/* Hidden YouTube player */}
      {showPlayer && currentSong && (
        <YoutubePlayer
          youtubeId={currentSong.youtubeId}
          onReady={handleReady}
          playerRef={playerRef}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
          <span className="text-xs font-medium text-gray-300 tracking-wide">Vynora</span>
        </div>
        <span className="text-xs text-gray-400">{songs.length} songs</span>
        <div className="w-5 h-2.5 bg-gradient-to-r from-green-400 to-green-500 rounded-sm" />
      </div>

      {/* Search */}
      <div className="px-4 py-2 flex-shrink-0">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artists, songs..."
            className="w-full pl-9 pr-8 py-2 rounded-full text-xs text-white placeholder-gray-500 outline-none transition-all"
            style={{
              background: 'linear-gradient(145deg, rgba(0,0,0,0.5), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* CoverFlow */}
      <div className="flex-shrink-0 px-4 py-2">
        <CoverFlow
          songs={songs}
          currentIndex={currentIndex}
          setCurrentIndex={selectSong}
          getCover={getCover}
          isLoading={isLoading}
        />
      </div>

      {/* Song info */}
      <div className="flex-shrink-0 text-center px-6 pb-2">
        <AnimatePresence mode="wait">
          {currentSong && (
            <motion.div
              key={currentSong.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-lg font-light text-white">{currentSong.title}</h2>
              <p className="text-sm text-gray-400 font-light">{currentSong.artist}</p>
              {currentSong.albumName && (
                <p className="text-xs text-gray-600 mt-0.5">
                  {currentSong.albumName}{currentSong.year ? ` (${currentSong.year})` : ''}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 flex flex-col items-center gap-3 pb-5">
        <div className="flex items-center gap-8">
          {/* Prev */}
          <button
            className="text-white/60 hover:text-white transition-colors"
            onClick={() => selectSong(Math.max(0, currentIndex - 1))}
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => { handlePlay(); togglePlay() }}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95"
            style={{ boxShadow: '0 8px 32px rgba(255,255,255,0.25), 0 4px 16px rgba(0,0,0,0.2)' }}
          >
            {!playerReady && showPlayer ? (
              <div className="w-5 h-5 border-b-2 border-black rounded-full animate-spin" />
            ) : isPlaying ? (
              <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            className="text-white/60 hover:text-white transition-colors"
            onClick={() => selectSong(Math.min(songs.length - 1, currentIndex + 1))}
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-gray-500">
          {!showPlayer ? 'Click play to start' : !playerReady ? 'Loading...' : isPlaying ? 'Now Playing' : 'Paused'}
        </p>
      </div>
    </div>
  )
}