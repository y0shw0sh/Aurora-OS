'use client'

import { useRef, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useWindowManager, WindowState } from '@/lib/windowManager'

interface AppWindowProps {
  win: WindowState
  children: ReactNode
  transparent?: boolean
}

export default function AppWindow({ win, children, transparent }: AppWindowProps) {
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, moveWindow, resizeWindow } =
    useWindowManager()
  const dragRef = useRef<{ mx: number; my: number; wx: number; wy: number } | null>(null)
  const resizeRef = useRef<{ mx: number; my: number; ww: number; wh: number } | null>(null)

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  focusWindow(win.id)
  resizeRef.current = {
    mx: e.clientX,
    my: e.clientY,
    ww: win.width,
    wh: win.height,
  }

  const onMove = (e: MouseEvent) => {
    if (!resizeRef.current) return
    const newW = Math.max(320, resizeRef.current.ww + e.clientX - resizeRef.current.mx)
    const newH = Math.max(240, resizeRef.current.wh + e.clientY - resizeRef.current.my)
    resizeWindow(win.id, newW, newH)
  }

  const onUp = () => {
    resizeRef.current = null
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}, [win, focusWindow, resizeWindow])

  const onTitleBarMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.traffic-btn')) return
    e.preventDefault()
    focusWindow(win.id)
    dragRef.current = { mx: e.clientX, my: e.clientY, wx: win.x, wy: win.y }

    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      moveWindow(
        win.id,
        Math.max(0, dragRef.current.wx + e.clientX - dragRef.current.mx),
        Math.max(28, dragRef.current.wy + e.clientY - dragRef.current.my)
      )
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [win, focusWindow, moveWindow])

  return (
    <AnimatePresence>
      {!win.minimized && (
        <motion.div
          key={win.id}
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          style={{
  position: 'fixed',
  left: win.x,
  top: win.y,
  width: win.width,
  height: win.height,
  zIndex: win.zIndex,
  borderRadius: 12,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: transparent
    ? '0 32px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(255,255,255,0.25)'
    : '0 32px 80px rgba(0,0,0,0.32), 0 8px 24px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.4)',
  background: transparent
    ? 'rgba(255,255,255,0.04)'
    : 'rgba(28,28,32,0.82)',
  backdropFilter: transparent ? 'blur(60px) saturate(180%)' : 'blur(40px) saturate(200%)',
  WebkitBackdropFilter: transparent ? 'blur(60px) saturate(180%)' : 'blur(40px) saturate(200%)',
  border: transparent
    ? '1px solid rgba(255,255,255,0.18)'
    : '1px solid rgba(255,255,255,0.50)',
}}
          onMouseDown={() => focusWindow(win.id)}
        >
          {/* Title bar — pink glass gradient exactly from design */}
          <div
            onMouseDown={onTitleBarMouseDown}
            className="flex items-center px-3 gap-2 flex-shrink-0"
            style={{
              height: 38,
              cursor: 'default',
              background: 'linear-gradient(135deg, rgba(255,150,185,0.72) 0%, rgba(240,100,160,0.58) 50%, rgba(255,180,210,0.65) 100%)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderBottom: '1px solid rgba(255,255,255,0.35)',
            }}
          >
            {/* Traffic lights */}
            <div className="traffic-btn flex items-center gap-1.5">
              <button
                className="traffic-btn w-3 h-3 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 40% 35%, #ff8080, #ff5f57)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
                onClick={() => closeWindow(win.id)}
                title="Close"
              />
              <button
                className="traffic-btn w-3 h-3 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 40% 35%, #ffdb6b, #ffbd2e)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
                onClick={() => minimizeWindow(win.id)}
                title="Minimize"
              />
              <button
                className="traffic-btn w-3 h-3 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 40% 35%, #64e060, #28c840)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
                onClick={() => maximizeWindow(win.id)}
                title="Maximize"
              />
            </div>

            {/* Title centered */}
            <div className="flex-1 flex items-center justify-center">
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'rgba(100,20,50,0.85)',
                  letterSpacing: '-0.01em',
                  textShadow: '0 1px 2px rgba(255,255,255,0.4)',
                }}
              >
                {win.title}
              </span>
            </div>

            {/* Balance spacer */}
            <div style={{ width: 54 }} />
          </div>

          {/* App content */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
          {/* Resize handle */}
<div
  onMouseDown={onResizeMouseDown}
  style={{
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    cursor: 'nwse-resize',
    zIndex: 10,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 4,
  }}
>
  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
    <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}