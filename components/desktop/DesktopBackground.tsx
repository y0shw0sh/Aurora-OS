'use client'

const SONOMA_GRADIENT = `
  radial-gradient(ellipse at 20% 30%, #c9a0dc 0%, transparent 50%),
  radial-gradient(ellipse at 80% 20%, #a8c4e8 0%, transparent 45%),
  radial-gradient(ellipse at 60% 80%, #f4b8d1 0%, transparent 50%),
  radial-gradient(ellipse at 10% 80%, #9ec8e8 0%, transparent 45%),
  linear-gradient(135deg, #b6c8f0 0%, #d4a8d8 40%, #f0b8cc 70%, #c4d8f4 100%)
`

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov']

interface DesktopBackgroundProps {
  wallpaperUrl: string | null
}

function isVideoUrl(url: string) {
  // strip query params before checking extension (Supabase Storage URLs often have ?token=... etc.)
  const path = url.split('?')[0].toLowerCase()
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext))
}

export default function DesktopBackground({ wallpaperUrl }: DesktopBackgroundProps) {
  const isVideo = wallpaperUrl ? isVideoUrl(wallpaperUrl) : false

  return (
    <div className="absolute inset-0 overflow-hidden">
      {wallpaperUrl && isVideo && (
        <video
          key={wallpaperUrl} // remounts + reloads if the wallpaper URL changes
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={wallpaperUrl} />
        </video>
      )}

      {wallpaperUrl && !isVideo && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${wallpaperUrl})` }}
        />
      )}

      {!wallpaperUrl && (
        <div
          className="absolute inset-0"
          style={{ background: SONOMA_GRADIENT }}
        />
      )}

      {/* Subtle top shine like macOS */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.18) 0%, transparent 60%)',
        }}
      />
    </div>
  )
}