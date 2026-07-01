'use client'

import { useEffect, useState } from 'react'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react'
import { useAuth } from '@/components/AuthProvider'
import { motion } from 'motion/react'

interface VideoCallProps {
  onEnd: () => void
}

export default function VideoCall({ onEnd }: VideoCallProps) {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const userEmail = session?.user.email ?? 'User'
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!

  useEffect(() => {
    if (!userId) return

    const getToken = async () => {
      try {
        const res = await fetch('/api/livekit-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            userName: userEmail,
          }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setToken(data.token)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to get token')
      } finally {
        setLoading(false)
      }
    }

    getToken()
  }, [userId, userEmail])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/50 text-sm">Connecting...</p>
      </div>
    )
  }

  if (error || !token) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-red-300 text-sm">{error ?? 'Could not connect'}</p>
        <button
          onClick={onEnd}
          className="px-4 py-2 rounded-xl bg-white/20 text-white text-sm"
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col h-full w-full rounded-2xl overflow-hidden"
    >
      <LiveKitRoom
        serverUrl={livekitUrl}
        token={token}
        connect={true}
        video={true}
        audio={true}
        onDisconnected={onEnd}
        style={{ height: '100%', background: 'transparent' }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </motion.div>
  )
}