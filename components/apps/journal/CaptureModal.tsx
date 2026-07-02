'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface CaptureModalProps {
  onSubmit: (file: File, caption: string) => Promise<void>
  onClose: () => void
}

type Mode = 'choose' | 'camera' | 'preview'

export default function CaptureModal({ onSubmit, onClose }: CaptureModalProps) {
  const [mode, setMode] = useState<Mode>('choose')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    return () => stopStream()
  }, [stopStream])

  const startCamera = async () => {
    setCameraError(null)
    setMode('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setCameraError('Camera access denied. Try uploading instead.')
    }
  }

  const takeShot = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' })
      setCapturedFile(file)
      setPreviewUrl(URL.createObjectURL(blob))
      stopStream()
      setMode('preview')
    }, 'image/jpeg', 0.92)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCapturedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setMode('preview')
  }

  const retake = () => {
    setPreviewUrl(null)
    setCapturedFile(null)
    setMode('choose')
  }

  const handleSubmit = async () => {
    if (!capturedFile) return
    setSubmitting(true)
    await onSubmit(capturedFile, caption.trim())
    setSubmitting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(10,7,16,0.6)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) { stopStream(); onClose() } }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(30,24,40,0.85)',
          border: '1px solid rgba(255,255,255,0.14)',
          backdropFilter: 'blur(40px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <p className="text-white/80 text-sm font-medium">New memory</p>
          <button onClick={() => { stopStream(); onClose() }} className="text-white/40 hover:text-white/80 text-xs">
            ✕
          </button>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {mode === 'choose' && (
              <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={startCamera}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg,#e07a5f,#c65c5c)' }}>
                    📷
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Take a photo</p>
                    <p className="text-white/40 text-xs">Use your camera</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg,#5f8ce0,#7a5fe0)' }}>
                    🖼️
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Upload a photo</p>
                    <p className="text-white/40 text-xs">Choose from your files</p>
                  </div>
                </motion.button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </motion.div>
            )}

            {mode === 'camera' && (
              <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                {cameraError ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <p className="text-red-300 text-xs text-center">{cameraError}</p>
                    <button onClick={() => setMode('choose')} className="text-white/60 text-xs underline">Go back</button>
                  </div>
                ) : (
                  <>
                    <div className="w-full aspect-square rounded-xl overflow-hidden relative" style={{ background: '#000' }}>
                      <video ref={videoRef} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} playsInline muted />
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={takeShot}
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: 'white', boxShadow: '0 0 0 3px rgba(255,255,255,0.25), 0 4px 16px rgba(0,0,0,0.4)' }}
                    >
                      <div className="w-12 h-12 rounded-full" style={{ background: 'white', border: '2px solid rgba(0,0,0,0.15)' }} />
                    </motion.button>
                  </>
                )}
              </motion.div>
            )}

            {mode === 'preview' && previewUrl && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
                <div
                  className="w-full aspect-square rounded-xl overflow-hidden"
                  style={{ backgroundImage: `url(${previewUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a little something..."
                  rows={2}
                  className="w-full bg-white/8 rounded-lg px-3 py-2 text-white text-sm outline-none placeholder-white/35 resize-none border border-white/10"
                />
                <div className="flex gap-2">
                  <button
                    onClick={retake}
                    className="flex-1 py-2.5 rounded-xl text-white/60 hover:text-white/90 text-sm transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    Retake
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#e07a5f,#c65c5c)' }}
                  >
                    {submitting ? 'Pinning...' : 'Pin to journal'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}