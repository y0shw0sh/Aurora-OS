import { create } from 'zustand'

export interface WindowState {
  id: string
  appId: string
  title: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  minimized: boolean
  maximized: boolean
  prevBounds?: { x: number; y: number; width: number; height: number }
}

interface WindowManagerStore {
  windows: WindowState[]
  topZ: number
  openWindow: (appId: string, title: string) => void
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  moveWindow: (id: string, x: number, y: number) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  resizeWindow: (id: string, width: number, height: number) => void
}

const DEFAULT_SIZES: Record<string, { width: number; height: number }> = {
  todo:    { width: 350, height: 540 },
  notes:   { width: 400, height: 580 },
  gallery: { width: 640, height: 580 },
  lounge:  { width: 520, height: 620 },
  default: { width: 520, height: 540 },
  music: { width: 700, height: 700 },
  legacy: { width: 1200, height: 800 },
}

export const useWindowManager = create<WindowManagerStore>((set, get) => ({
  windows: [],
  topZ: 10,

openWindow: (appId, title) => {
  const existing = get().windows.find((w) => w.appId === appId)
  if (existing) {
    if (existing.minimized) get().restoreWindow(existing.id)
    get().focusWindow(existing.id)
    return
  }

  const size = DEFAULT_SIZES[appId] ?? DEFAULT_SIZES.default
  const offset = (get().windows.length % 6) * 30
  const topZ = get().topZ + 1
  const id = `${appId}-${Date.now()}`

  set((s) => ({
    topZ,
    windows: [
      ...s.windows,
      {
        id,
        appId,
        title,
        x: 100 + offset,
        y: 44 + offset,
        width: size.width,
        height: size.height,
        zIndex: topZ,
        minimized: false,
        maximized: false,
      },
    ],
  }))

  if (appId === 'legacy') {
    setTimeout(() => get().maximizeWindow(id), 0)
  }
},


  closeWindow: (id) =>
    set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

  focusWindow: (id) => {
    const topZ = get().topZ + 1
    set((s) => ({
      topZ,
      windows: s.windows.map((w) => w.id === id ? { ...w, zIndex: topZ } : w),
    }))
  },

  moveWindow: (id, x, y) =>
    set((s) => ({
      windows: s.windows.map((w) => w.id === id ? { ...w, x, y } : w),
    })),

  minimizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => w.id === id ? { ...w, minimized: true } : w),
    })),

    resizeWindow: (id, width, height) =>
  set((s) => ({
    windows: s.windows.map((w) =>
      w.id === id ? { ...w, width, height } : w
    ),
  })),

  maximizeWindow: (id) => {
    const win = get().windows.find((w) => w.id === id)
    if (!win) return
    if (win.maximized) {
      get().restoreWindow(id)
      return
    }
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? {
          ...w,
          maximized: true,
          prevBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
          x: 0, y: 28,
          width: typeof window !== 'undefined' ? window.innerWidth : 1440,
          height: typeof window !== 'undefined' ? window.innerHeight - 28 : 900,
        } : w
      ),
    }))
  },

  restoreWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? {
          ...w,
          minimized: false,
          maximized: false,
          ...(w.prevBounds ?? {}),
        } : w
      ),
    })),
}))