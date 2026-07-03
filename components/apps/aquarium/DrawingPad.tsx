'use client'
import { useRef, useState, useEffect } from 'react'
import { Undo, Trash2, Plus, X } from 'lucide-react'

const COLORS = [
  '#FFFFBA','#FFB3BA','#FFDFBA','#BAFFC9',
  '#BAE1FF','#E0BBE4','#6B9BD9','#000000',
]

interface Point { x: number; y: number }

interface Props {
  onAddFish: (data: string) => void
  onClose: () => void
}

export function DrawingPad({ onAddFish, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState(COLORS[0])
  const [history, setHistory] = useState<string[]>([])
  const [path, setPath] = useState<Point[]>([])
  const [pathStart, setPathStart] = useState<Point | null>(null)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, 280, 280)
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent, rect: DOMRect) => {
    if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    setHistory(h => [...h, canvas.toDataURL()])
    const rect = canvas.getBoundingClientRect()
    const pos = getPos(e, rect)
    setIsDrawing(true); setPath([pos]); setPathStart(pos)
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const pos = getPos(e, rect)
    setPath(p => [...p, pos])
    ctx.lineTo(pos.x, pos.y); ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing || !pathStart || path.length === 0) { setIsDrawing(false); return }
    const end = path[path.length - 1]
    const dist = Math.hypot(end.x - pathStart.x, end.y - pathStart.y)
    if (dist < 30) {
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) { ctx.closePath(); ctx.fillStyle = color; ctx.fill() }
    }
    setPath([]); setPathStart(null); setIsDrawing(false)
  }

  const undo = () => {
    if (!history.length) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const img = new Image()
    img.onload = () => { ctx.clearRect(0, 0, 280, 280); ctx.drawImage(img, 0, 0) }
    img.src = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
  }

  const clear = () => {
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, 280, 280)
    setHistory([])
  }

  const addToTank = () => {
    const canvas = canvasRef.current; if (!canvas) return
    const small = document.createElement('canvas')
    small.width = 120; small.height = 120
    small.getContext('2d')?.drawImage(canvas, 0, 0, 280, 280, 0, 0, 120, 120)
    onAddFish(small.toDataURL('image/png'))
    clear()
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-3 w-72">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Draw Your Fish</h3>
          <button onClick={onClose}><X size={18} className="text-gray-500" /></button>
        </div>
        <canvas ref={canvasRef} width={280} height={280}
          className="border-2 border-gray-200 rounded-xl cursor-crosshair bg-white w-full"
          style={{ touchAction: 'none' }}
          onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
          onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
        <div className="flex gap-2 flex-wrap justify-center">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-blue-500 scale-110' : 'border-gray-200'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={undo} disabled={!history.length}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded-xl text-xs font-medium">
            <Undo size={12} /> Undo
          </button>
          <button onClick={clear}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-medium text-red-600">
            <Trash2 size={12} /> Clear
          </button>
          <button onClick={addToTank}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-medium">
            <Plus size={12} /> Add
          </button>
        </div>
      </div>
    </div>
  )
}