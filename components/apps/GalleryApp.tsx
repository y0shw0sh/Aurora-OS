'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'
import { GalleryEntry } from '@/lib/types'

export default function GalleryApp() {
  const { session } = useAuth()
  const userId = session?.user.id
  const [entries, setEntries] = useState<GalleryEntry[]>([])
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchEntries()

    const channel = supabase
      .channel('gallery-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_entries' }, () => {
        fetchEntries()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('gallery_entries')
      .select('*')
      .order('entry_date', { ascending: false })
    if (data) setEntries(data)
  }

  const handleFileChange = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0]

  if (!file || !userId) return

  try {
    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    console.log('Uploading:', fileName)

    const { data: uploadData, error: uploadError } =
      await supabase.storage
        .from('gallery')
        .upload(fileName, file)

    console.log('UPLOAD RESULT', uploadData, uploadError)

    if (uploadError) {
      alert(uploadError.message)
      return
    }

    const { data: urlData } =
      supabase.storage
        .from('gallery')
        .getPublicUrl(fileName)

    console.log('PUBLIC URL', urlData)

    const { data, error } =
      await supabase
        .from('gallery_entries')
        .insert({
          user_id: userId,
          photo_url: urlData.publicUrl,
          caption: caption.trim() || null,
          entry_date: new Date()
            .toISOString()
            .split('T')[0],
        })
        .select()

    console.log('DB RESULT', data, error)

    if (error) {
      alert(error.message)
      return
    }

    await fetchEntries()

    setCaption('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  } finally {
    setUploading(false)
  }
}

  const deleteEntry = async (entry: GalleryEntry) => {
    await supabase.from('gallery_entries').delete().eq('id', entry.id)
  }

  const grouped = entries.reduce<Record<string, GalleryEntry[]>>((acc, entry) => {
    acc[entry.entry_date] = acc[entry.entry_date] || []
    acc[entry.entry_date].push(entry)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 bg-white/5 border border-white/10 rounded-xl p-4">
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional)"
          className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-white/50 text-sm"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          disabled={uploading}
          className="text-white/70 text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-white/20 file:text-white file:text-sm hover:file:bg-white/30 file:cursor-pointer"
        />
        {uploading && <p className="text-white/40 text-xs">Uploading...</p>}
      </div>

      <div className="flex flex-col gap-5">
        {sortedDates.map((date) => (
          <div key={date}>
            <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-2">
              {new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence>
                {grouped[date].map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative rounded-2xl overflow-hidden border border-white/10 group"
                  >
                    <img
                      src={entry.photo_url}
                      alt={entry.caption || 'gallery photo'}
                      className="w-full aspect-square object-cover"
                    />
                    {entry.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm px-2 py-1.5">
                        <p className="text-white text-xs">{entry.caption}</p>
                      </div>
                    )}
                    {entry.user_id === userId && (
                      <button
                        onClick={() => deleteEntry(entry)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white/80 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ✕
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-white/30 text-sm italic">No photos yet.</p>
        )}
      </div>
    </div>
  )
}