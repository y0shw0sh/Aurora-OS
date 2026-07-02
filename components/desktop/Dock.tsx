'use client'

import { useState } from 'react'
import { apps } from '@/lib/apps'
import { useWindowManager } from '@/lib/windowManager'

export default function Dock() {
  const { openWindow, windows } = useWindowManager()
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50">
      <div
        className="flex items-end px-3 py-2 gap-2"
        style={{
          background: 'rgba(255,255,255,0.22)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.55)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}
      >
        {apps.map((app) => {
          const isHovered = hovered === app.id
          const isOpen = windows.some((w) => w.appId === app.id && !w.minimized)
          const isMinimized = windows.some((w) => w.appId === app.id && w.minimized)

          return (
            <div
              key={app.id}
              className="flex flex-col items-center relative"
              onMouseEnter={() => setHovered(app.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => openWindow(app.id, app.name)}
            >
              {/* Tooltip */}
              <div
                className="absolute -top-9 left-1/2 pointer-events-none px-2 py-0.5 rounded-md whitespace-nowrap transition-all duration-150"
                style={{
                  transform: 'translateX(-50%)',
                  background: 'rgba(30,30,30,0.75)',
                  backdropFilter: 'blur(8px)',
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 500,
                  opacity: isHovered ? 1 : 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                {app.name}
              </div>

              {/* Icon */}
              <div
                className="transition-all duration-200 cursor-pointer flex items-center justify-center rounded-2xl text-2xl"
                style={{
                  width: isHovered ? 60 : 52,
                  height: isHovered ? 60 : 52,
                  transform: `translateY(${isHovered ? -8 : 0}px)`,
                  background: app.color,
                  filter: isHovered
                    ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.28))'
                    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
              >
                {app.emoji}
              </div>

              {/* Running dot */}
              <div
                className="mt-0.5 rounded-full transition-all duration-200"
                style={{
                  width: (isOpen || isMinimized) ? 4 : 0,
                  height: 4,
                  background: 'rgba(0,0,0,0.55)',
                  marginTop: 2,
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}