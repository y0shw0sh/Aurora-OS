'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'

function useTime() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return time
}

interface MenuBarProps {
  onUploadWallpaper: (file: File) => Promise<void>
  onResetWallpaper: () => Promise<void>
}

export default function MenuBar({ onUploadWallpaper, onResetWallpaper }: MenuBarProps) {
  const time = useTime()
  const { signOut } = useAuth()
  const [auroraOpen, setAuroraOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const timeStr = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await onUploadWallpaper(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <div
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
        style={{
          height: 28,
          background: 'rgba(255,255,255,0.28)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(255,255,255,0.35)',
        }}
      >
        {/* Left — menus */}
        <div className="flex items-center gap-0">
          <button
            onClick={() => setAuroraOpen((v) => !v)}
            className="flex items-center px-2 h-7 rounded transition-colors hover:bg-black/8"
            style={{ fontSize: 15 }}
          >
            🌌
          </button>
          {['Aurora', 'File', 'Edit', 'View', 'Window', 'Help'].map((item, i) => (
            <span
              key={item}
              className="px-2 h-7 flex items-center rounded cursor-default transition-colors hover:bg-black/8"
              style={{
                fontSize: 13,
                fontWeight: i === 0 ? 600 : 400,
                color: 'rgba(0,0,0,0.85)',
                letterSpacing: '-0.01em',
              }}
            >
              {item}
            </span>
          ))}
        </div>

        {/* Right — status */}
        <div className="flex items-center gap-3">
          {/* Wifi icon */}
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M8 10.5a1 1 0 100-2 1 1 0 000 2z" fill="rgba(0,0,0,0.75)" />
            <path d="M5.2 8.1a4 4 0 015.6 0" stroke="rgba(0,0,0,0.75)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M2.8 5.7a7 7 0 0110.4 0" stroke="rgba(0,0,0,0.75)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M0.5 3.3a10 10 0 0115 0" stroke="rgba(0,0,0,0.75)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </svg>

          {/* Battery */}
          <div className="flex items-center gap-0.5">
            <div
              className="rounded-sm flex items-center px-0.5"
              style={{
                width: 25, height: 12,
                border: '1px solid rgba(0,0,0,0.35)',
              }}
            >
              <div
                className="h-2 rounded-sm"
                style={{ width: '80%', background: 'rgba(0,0,0,0.7)' }}
              />
            </div>
            <div
              className="rounded-r-sm"
              style={{ width: 2, height: 6, background: 'rgba(0,0,0,0.35)' }}
            />
          </div>

          {/* Date + Time */}
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.75)', fontWeight: 400 }}>
            {dateStr}
          </span>
          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.85)', fontWeight: 500 }}>
            {timeStr}
          </span>
        </div>
      </div>

      {/* Aurora dropdown */}
      {auroraOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAuroraOpen(false)}
          />
          <div
            className="absolute top-7 left-1 z-50 w-56 py-1 rounded-xl overflow-hidden"
            style={{
              background: 'rgba(240,240,240,0.88)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <DropdownItem label="About Aurora" onClick={() => setAuroraOpen(false)} />
            <Divider />
            <DropdownItem
              label="Change Wallpaper..."
              onClick={() => { fileRef.current?.click(); setAuroraOpen(false) }}
            />
            <DropdownItem
              label="Reset to Default Wallpaper"
              onClick={() => { onResetWallpaper(); setAuroraOpen(false) }}
            />
            <Divider />
            <DropdownItem
              label="Sign Out"
              onClick={() => { signOut(); setAuroraOpen(false) }}
              danger
            />
          </div>
        </>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  )
}

function DropdownItem({ label, onClick, danger }: {
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1 transition-colors hover:bg-blue-500 hover:text-white group"
      style={{
        fontSize: 13,
        color: danger ? '#d4183d' : 'rgba(0,0,0,0.85)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#0066d6'
        e.currentTarget.style.color = 'white'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = danger ? '#d4183d' : 'rgba(0,0,0,0.85)'
      }}
    >
      {label}
    </button>
  )
}

function Divider() {
  return (
    <div
      className="my-1 mx-3"
      style={{ height: 1, background: 'rgba(0,0,0,0.12)' }}
    />
  )
}