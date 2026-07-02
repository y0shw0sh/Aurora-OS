'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'
import { JournalEntry } from '@/lib/types'
import CaptureModal from '@/components/apps/journal/CaptureModal'
import Polaroid from '@/components/apps/journal/Polaroid'

export default function JournalApp() {
  const { session } = useAuth()
  const userId = session?.user.id

  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [showCapture, setShowCapture] = useState(false)

  useEffect(() => {
    fetchEntries()

    const channel = supabase
      .channel('journal-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journal_entries',
        },
        () => fetchEntries()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setEntries(data)
  }

  const handleSubmit = async (file: File, caption: string) => {
    if (!userId) return

    const ext = file.name.split('.').pop()
    const path = `journal/${userId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(path, file)

    if (uploadError) {
      console.error(uploadError)
      alert('Upload failed')
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('gallery').getPublicUrl(path)

    const { data: inserted } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        photo_url: publicUrl,
        entry_text: caption || null,
      })
      .select()
      .single()

    if (inserted) {
      setEntries((prev) => [inserted, ...prev])
    }

    setShowCapture(false)
  }

  const deleteEntry = async (id: string) => {
    await supabase.from('journal_entries').delete().eq('id', id)

    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div
      className="relative h-full flex flex-col overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, rgba(245,236,220,0.96), rgba(233,223,202,0.96))',
      }}
    >
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-8 py-5"
        style={{
          backdropFilter: 'blur(18px)',
          background: 'rgba(255,255,255,0.18)',
          borderBottom: '1px solid rgba(255,255,255,0.22)',
        }}
      >
        <div>
          <p
            className="text-[24px]"
            style={{
              fontFamily: "'Patrick Hand', cursive",
              color: '#5d4636',
            }}
          >
            Our Memories
          </p>

          <p className="text-xs text-[#7d6858] tracking-wide">
            every moment worth keeping ✨
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowCapture(true)}
          className="px-5 py-2 rounded-full text-white text-sm font-medium"
          style={{
            background: 'linear-gradient(135deg,#e07a5f,#c65c5c)',
            boxShadow: '0 8px 24px rgba(198,92,92,0.35)',
          }}
        >
          + New memory
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-12 py-12">
        <div className="columns-1 md:columns-2 xl:columns-3 gap-16 space-y-20">
          {entries.map((entry, index) => (
            <Polaroid
              key={entry.id}
              entry={entry}
              index={index}
              isMine={entry.user_id === userId}
              onDelete={deleteEntry}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showCapture && (
          <CaptureModal
            onSubmit={handleSubmit}
            onClose={() => setShowCapture(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}