'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'
import { Message } from '@/lib/types'
import { createPresenceChannel, PresenceState } from '@/lib/presence'
import type { RealtimeChannel } from '@supabase/supabase-js'

export default function LoungeApp() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [presence, setPresence] = useState<PresenceState[]>([])
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const presenceChannelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchMessages()

    const msgChannel = supabase
      .channel('messages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchMessages()
      })
      .subscribe()

    const presenceChannel = createPresenceChannel('lounge', userId, setPresence)
    presenceChannelRef.current = presenceChannel

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(presenceChannel)
    }
  }, [userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100)
    if (data) setMessages(data)
  }

  const sendMessage = async () => {
  if (!input.trim() || !userId || sending) return

  setSending(true)

  const { error } = await supabase
    .from('messages')
    .insert({
      user_id: userId,
      content: input.trim(),
    })

  console.log('MESSAGE ERROR', error)

  if (error) {
    alert(error.message)
    setSending(false)
    return
  }

  await fetchMessages()

  setInput('')
  setSending(false)

  stopTyping()
}

  const startTyping = async () => {
    if (!presenceChannelRef.current) return
    await presenceChannelRef.current.track({ userId, typing: true })
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(stopTyping, 2000)
  }

  const stopTyping = async () => {
    if (!presenceChannelRef.current) return
    await presenceChannelRef.current.track({ userId, typing: false })
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    startTyping()
  }

  const othersTyping = presence.filter((p) => p.userId !== userId && p.typing)
  const othersOnline = presence.filter((p) => p.userId !== userId)

  return (
    <div className="flex flex-col h-full gap-0">
      <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-3">
        <div className={`w-2 h-2 rounded-full ${othersOnline.length > 0 ? 'bg-emerald-400' : 'bg-white/20'}`} />
        <span className="text-white/50 text-xs">
          {othersOnline.length > 0 ? 'She\'s here' : 'Just you'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.user_id === userId
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-white/25 text-white rounded-br-sm'
                      : 'bg-white/10 text-white/90 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                  <p className="text-white/30 text-[10px] mt-0.5">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {othersTyping.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-start"
          >
            <div className="px-4 py-2 rounded-2xl rounded-bl-sm bg-white/10 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 pt-3 border-t border-white/10 mt-3">
        <input
          value={input}
          onChange={handleInput}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Say something..."
          className="flex-1 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-white/50 text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm transition-colors disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  )
}