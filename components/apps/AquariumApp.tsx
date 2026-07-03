'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Fish as FishIcon } from 'lucide-react'
import { DrawingPad } from '@/components/apps/aquarium/DrawingPad'
import { FishGallery } from '@/components/apps/aquarium/FishGallery'

interface Fish {
  id: string
  imageData: string
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  flipped: boolean
  speed: number
}

interface Bubble {
  id: string; x: number; y: number; size: number; speed: number; age: number
}

const BOUNDS = { minX: 40, maxX: 820, minY: 120, maxY: 480 }

const BUBBLE_SPAWNS = [
  { x: 80, y: 440 }, { x: 200, y: 460 }, { x: 400, y: 450 },
  { x: 600, y: 455 }, { x: 750, y: 440 }, { x: 320, y: 470 },
]

function AquariumBackground() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 860 560" preserveAspectRatio="xMidYMid slice">
      {/* Water gradient */}
      <defs>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7ec8f7" />
          <stop offset="60%" stopColor="#5194ff" />
          <stop offset="100%" stopColor="#2563a8" />
        </linearGradient>
        <radialGradient id="sandGrad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#f5deb3" />
          <stop offset="100%" stopColor="#d4a76a" />
        </radialGradient>
        <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      {/* Water body */}
      <rect width="860" height="560" fill="url(#waterGrad)" />

      {/* Light shimmer rays */}
      <ellipse cx="200" cy="0" rx="80" ry="300" fill="rgba(255,255,255,0.04)" />
      <ellipse cx="500" cy="0" rx="60" ry="250" fill="rgba(255,255,255,0.03)" />
      <ellipse cx="720" cy="0" rx="50" ry="280" fill="rgba(255,255,255,0.04)" />

      {/* Sand bottom */}
      <ellipse cx="430" cy="560" rx="500" ry="100" fill="url(#sandGrad)" />
      <ellipse cx="430" cy="540" rx="480" ry="70" fill="#e8c98a" />

      {/* Rocks */}
      <ellipse cx="100" cy="520" rx="55" ry="35" fill="#8a8a8a" />
      <ellipse cx="80" cy="510" rx="35" ry="25" fill="#9a9a9a" />
      <ellipse cx="130" cy="515" rx="28" ry="20" fill="#7a7a7a" />
      <ellipse cx="720" cy="518" rx="50" ry="32" fill="#8a8a8a" />
      <ellipse cx="750" cy="512" rx="30" ry="22" fill="#9a9a9a" />

      {/* Coral left */}
      <g transform="translate(140,380)">
        <path d="M0,100 C-5,60 -20,40 -15,10 C-10,-15 5,-15 10,10 C15,40 0,60 0,100Z" fill="#ff6b6b" opacity="0.9"/>
        <path d="M-15,90 C-20,55 -35,35 -30,8 C-25,-12 -12,-12 -8,8 C-3,35 -15,55 -15,90Z" fill="#ff8e8e" opacity="0.8"/>
        <path d="M15,95 C10,60 0,42 5,15 C10,-8 22,-8 25,15 C28,42 18,60 15,95Z" fill="#ff5252" opacity="0.85"/>
        {[...Array(5)].map((_, i) => (
          <circle key={i} cx={[-18,-5,8,20,-10][i]} cy={[8,-15,10,-5,-25][i]} r="5"
            fill={['#ff8e8e','#ffb3b3','#ff6b6b','#ff9999','#ffcccc'][i]} />
        ))}
      </g>

      {/* Coral right */}
      <g transform="translate(680,370)">
        <path d="M0,120 C-5,75 -18,50 -12,15 C-7,-12 7,-12 12,15 C18,50 5,75 0,120Z" fill="#ff9f43" opacity="0.9"/>
        <path d="M-18,108 C-22,68 -36,45 -30,12 C-25,-10 -12,-10 -8,12 C-3,45 -18,68 -18,108Z" fill="#ffd32a" opacity="0.8"/>
        <path d="M18,112 C14,72 5,50 10,18 C14,-8 26,-8 28,18 C31,50 20,72 18,112Z" fill="#ff6348" opacity="0.85"/>
      </g>

      {/* Seaweed */}
      {[200, 350, 500, 620].map((x, i) => (
        <g key={i} transform={`translate(${x}, 500)`}>
          <path d={`M0,0 C${-15 + i * 3},-30 ${10 - i * 2},-60 ${-8 + i},-90 C${-20 + i * 2},-120 ${5},-140 0,-160`}
            stroke={['#2ecc71','#27ae60','#1abc9c','#16a085'][i]}
            strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      ))}

      {/* Shimmer overlay */}
      <rect width="860" height="560" fill="url(#shimmer)" />
    </svg>
  )
}

export default function AquariumApp() {
  const [fish, setFish] = useState<Fish[]>([])
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [showDraw, setShowDraw] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load fish from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aurora-aquarium-fish')
      if (saved) {
        const parsed = JSON.parse(saved)
        setFish(parsed.map((f: Fish) => ({
          ...f,
          position: f.position ?? { x: 200 + Math.random() * 400, y: 200 + Math.random() * 200 },
          velocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 1 },
          flipped: Math.random() > 0.5,
          speed: 1,
        })))
      }
    } catch {}
  }, [])

  // Save fish to localStorage when they change
  useEffect(() => {
    if (fish.length > 0) {
      try { localStorage.setItem('aurora-aquarium-fish', JSON.stringify(fish)) } catch {}
    }
  }, [fish])

  // Fish animation
  useEffect(() => {
    const id = setInterval(() => {
      setFish(prev => prev.map(f => {
        let { x, y } = f.position
        let { x: vx, y: vy } = f.velocity
        let { flipped } = f
        x += vx * f.speed; y += vy * f.speed
        if (x <= BOUNDS.minX || x >= BOUNDS.maxX) { vx = -vx; flipped = vx > 0 }
        if (y <= BOUNDS.minY || y >= BOUNDS.maxY) vy = -vy
        x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, x))
        y = Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, y))
        if (Math.random() < 0.01) {
          const a = Math.random() * Math.PI * 2
          vx = Math.cos(a) * 1.5; vy = Math.sin(a) * 0.8
          flipped = vx > 0
        }
        return { ...f, position: { x, y }, velocity: { x: vx, y: vy }, flipped }
      }))
    }, 50)
    return () => clearInterval(id)
  }, [])

  // Bubble system
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.5) {
        const spawn = BUBBLE_SPAWNS[Math.floor(Math.random() * BUBBLE_SPAWNS.length)]
        setBubbles(prev => [...prev, {
          id: String(Date.now() + Math.random()),
          x: spawn.x + (Math.random() - 0.5) * 60,
          y: spawn.y, size: 3 + Math.random() * 5,
          speed: 0.8 + Math.random() * 1.2, age: 0,
        }])
      }
    }, 600)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setBubbles(prev =>
        prev.map(b => ({ ...b, y: b.y - b.speed, x: b.x + Math.sin(b.age * 0.15), age: b.age + 1 }))
          .filter(b => b.y > 0 && b.age < 180)
      )
    }, 50)
    return () => clearInterval(id)
  }, [])

  const handleFishClick = useCallback((id: string) => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
      osc.start(); osc.stop(ctx.currentTime + 0.12)
    } catch {}
    setFish(prev => prev.map(f => f.id === id
      ? { ...f, speed: 5, velocity: { x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 2 } } : f))
    setTimeout(() => setFish(prev => prev.map(f => f.id === id ? { ...f, speed: 1 } : f)), 1000)
  }, [])

  const addFish = (imageData: string) => {
    setFish(prev => [...prev, {
      id: String(Date.now()),
      imageData,
      position: { x: 300 + Math.random() * 200, y: 180 + Math.random() * 150 },
      velocity: { x: 1, y: 0.5 },
      flipped: false, speed: 1,
    }])
    setShowDraw(false)
  }

  const deleteFish = (id: string) => {
    setFish(prev => {
      const next = prev.filter(f => f.id !== id)
      try { localStorage.setItem('aurora-aquarium-fish', JSON.stringify(next)) } catch {}
      return next
    })
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none">
      <AquariumBackground />

      {/* Bubbles */}
      {bubbles.map(b => (
        <div key={b.id} className="absolute rounded-full pointer-events-none"
          style={{
            left: b.x, top: b.y, width: b.size, height: b.size,
            background: 'rgba(255,255,255,0.25)',
            border: '1px solid rgba(255,255,255,0.5)',
          }} />
      ))}

      {/* Fish */}
      {fish.map(f => (
        <img key={f.id} src={f.imageData} alt="fish"
          className="absolute cursor-pointer z-10"
          style={{
            left: f.position.x, top: f.position.y,
            width: 72, height: 72, objectFit: 'contain',
            transform: f.flipped ? 'scaleX(-1)' : 'none',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))',
            transition: 'transform 0.15s ease',
          }}
          onClick={() => handleFishClick(f.id)} />
      ))}

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        <button onClick={() => setShowDraw(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-sm font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ background: '#5194ff', border: '1px solid rgba(255,255,255,0.3)' }}>
          <Plus size={14} /> Draw Fish
        </button>
        <button onClick={() => setShowGallery(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-sm font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ background: '#ff8c51', border: '1px solid rgba(255,255,255,0.3)' }}>
          <FishIcon size={14} /> Tank ({fish.length})
        </button>
      </div>

      {showDraw && <DrawingPad onAddFish={addFish} onClose={() => setShowDraw(false)} />}
      {showGallery && <FishGallery fish={fish} onClose={() => setShowGallery(false)} onDelete={deleteFish} />}
    </div>
  )
}