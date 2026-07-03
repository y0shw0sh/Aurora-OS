'use client'
import { X } from 'lucide-react'

interface Fish { id: string; imageData: string }

export function FishGallery({ fish, onClose, onDelete }: {
  fish: Fish[]; onClose: () => void; onDelete: (id: string) => void
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-white rounded-2xl p-5 shadow-2xl w-80 max-h-80 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Fish in Tank ({fish.length})</h2>
          <button onClick={onClose}><X size={16} className="text-gray-500" /></button>
        </div>
        {fish.length === 0
          ? <p className="text-gray-400 text-sm text-center py-6">No fish yet!</p>
          : <div className="grid grid-cols-5 gap-2">
              {fish.map(f => (
                <div key={f.id} className="relative aspect-square bg-blue-50 rounded-lg flex items-center justify-center group border border-blue-100">
                  <img src={f.imageData} alt="" className="w-10 h-10 object-contain" />
                  <button onClick={() => onDelete(f.id)}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={8} />
                  </button>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}