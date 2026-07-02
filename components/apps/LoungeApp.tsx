'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Mic, MicOff, Video, VideoOff, Phone, MessageCircle, Send, X, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'
import { Message } from '@/lib/types'
import { createPresenceChannel, PresenceState } from '@/lib/presence'
import type { RealtimeChannel } from '@supabase/supabase-js'
import VideoCall from '@/components/apps/VideoCall'

const NUNITO = "'Nunito', sans-serif"

// ─── Waiting screen ───────────────────────────────────────────────────────────

function WaitingScreen({ othersOnline }: { othersOnline: number }) {
  return (
    <div className="flex-1 flex items-center justify-center relative">
      <style>{`
        @keyframes float-ring {
          0%,100% { transform:scale(1); opacity:.18; }
          50%      { transform:scale(1.07); opacity:.28; }
        }
        @keyframes float-ring2 {
          0%,100% { transform:scale(1); opacity:.10; }
          50%      { transform:scale(1.12); opacity:.20; }
        }
        @keyframes pulse-av {
          0%,100% { box-shadow:0 0 0 0 rgba(236,72,153,.3); }
          50%      { box-shadow:0 0 0 18px rgba(236,72,153,0); }
        }
        @keyframes wdot {
          0%,20%  { opacity:.2; transform:translateY(0); }
          50%     { opacity:1;  transform:translateY(-4px); }
          100%    { opacity:.2; transform:translateY(0); }
        }
        .ring1   { animation:float-ring  3.4s ease-in-out infinite; }
        .ring2   { animation:float-ring2 3.4s ease-in-out infinite .4s; }
        .pulse-av{ animation:pulse-avatar 2.4s ease-in-out infinite; }
        .wd1 { animation:wdot 1.6s ease-in-out infinite 0s; }
        .wd2 { animation:wdot 1.6s ease-in-out infinite .25s; }
        .wd3 { animation:wdot 1.6s ease-in-out infinite .5s; }
      `}</style>

      {/* Concentric rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="ring1 rounded-full absolute"
          style={{ width: 280, height: 280, border: '1.5px solid rgba(236,72,153,0.22)' }} />
        <div className="ring2 rounded-full absolute"
          style={{ width: 200, height: 200, border: '1px solid rgba(236,72,153,0.14)' }} />
      </div>

      <div className="flex flex-col items-center gap-5 z-10">
        <div
          className="pulse-av rounded-full flex items-center justify-center"
          style={{
            width: 88, height: 88,
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(24px)',
            border: '1.5px solid rgba(255,255,255,0.4)',
          }}
        >
          <span style={{ fontSize: 38 }}>🌸</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="font-bold tracking-wide"
            style={{ fontFamily: NUNITO, color: 'rgba(190,24,93,0.75)', fontSize: 14 }}>
            {othersOnline > 0 ? "She's here 💕" : "They'll be here soon"}
          </p>
          <div className="flex gap-1.5 items-center">
            <span className="wd1 w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'rgba(236,72,153,0.55)' }} />
            <span className="wd2 w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'rgba(236,72,153,0.55)' }} />
            <span className="wd3 w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'rgba(236,72,153,0.55)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Control button ────────────────────────────────────────────────────────────

function ControlBtn({ onClick, active, danger, children, label }: {
  onClick: () => void
  active?: boolean
  danger?: boolean
  children: React.ReactNode
  label: string
}) {
  const style = danger
    ? { background: 'rgba(244,63,94,0.55)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(20px)' }
    : active
    ? { background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(20px)' }
    : { background: 'rgba(236,72,153,0.35)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(20px)' }

  return (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center justify-center rounded-2xl transition-all duration-200 active:scale-95"
      style={{ width: 44, height: 44, ...style }}
    >
      <span className="text-white">{children}</span>
    </button>
  )
}

// ─── LoungeApp ─────────────────────────────────────────────────────────────────

export default function LoungeApp() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''

  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [chatOpen, setChatOpen] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [inCall, setInCall] = useState(false)
  const [presence, setPresence] = useState<PresenceState[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)
  const presenceRef = useRef<RealtimeChannel | null>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const othersOnline = presence.filter((p) => p.userId !== userId)
  const othersTyping = presence.filter((p) => p.userId !== userId && p.typing)

  useEffect(() => {
    fetchMessages()

    const msgChannel = supabase
      .channel('messages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchMessages)
      .subscribe()

    const presenceChannel = createPresenceChannel('lounge', userId, setPresence)
    presenceRef.current = presenceChannel

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(presenceChannel)
    }
  }, [userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatOpen])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100)
    if (data) setMessages(data)
  }

  const sendMessage = async () => {
    const text = draft.trim()
    if (!text || !userId || sending) return
    setSending(true)
    await supabase.from('messages').insert({ user_id: userId, content: text })
    setDraft('')
    setSending(false)
    stopTyping()
  }

  const startTyping = async () => {
    if (!presenceRef.current) return
    await presenceRef.current.track({ userId, typing: true })
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(stopTyping, 2000)
  }

  const stopTyping = async () => {
    if (!presenceRef.current) return
    await presenceRef.current.track({ userId, typing: false })
  }

  // ── If in call, render LiveKit video ──────────────────────────────────────
  if (inCall) {
    return (
      <div
        className="w-full h-full relative"
        style={{ background: 'linear-gradient(140deg, #f9d3e8 0%, #f3b8d9 30%, #e8a0cc 60%, #f0bfdc 100%)' }}
      >
        <VideoCall onEnd={() => setInCall(false)} />
      </div>
    )
  }

  // ── Main lounge UI ────────────────────────────────────────────────────────
  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden relative"
      style={{ background: 'linear-gradient(140deg, #f9d3e8 0%, #f3b8d9 30%, #e8a0cc 60%, #f0bfdc 100%)' }}
    >
      {/* Background orbs */}
      <div className="absolute pointer-events-none"
        style={{ width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,182,218,0.7) 0%, transparent 70%)', top: -100, left: -80 }} />
      <div className="absolute pointer-events-none"
        style={{ width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,120,200,0.45) 0%, transparent 70%)', bottom: -60, right: -40 }} />

      {/* Header */}
      <div
        className="flex items-center px-4 shrink-0 relative z-10"
        style={{
          height: 44,
          background: 'rgba(255,240,250,0.2)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.25)',
        }}
      >
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          <Heart size={11} fill="rgba(236,72,153,0.7)" className="text-pink-400/70" />
          <span className="font-bold text-sm" style={{ fontFamily: NUNITO, color: 'rgba(190,24,93,0.65)' }}>
            Lounge
          </span>
          <Heart size={11} fill="rgba(236,72,153,0.7)" className="text-pink-400/70" />
        </div>

        {/* Presence pill */}
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)' }}>
          <div className={`w-1.5 h-1.5 rounded-full ${othersOnline.length > 0 ? 'bg-pink-400' : 'bg-pink-300/40'}`} />
          <span className="text-[10px] font-bold" style={{ fontFamily: NUNITO, color: 'rgba(190,24,93,0.7)' }}>
            {othersOnline.length > 0 ? "She's here 💕" : 'Just you'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex min-h-0 relative z-10">

        {/* Left: video area */}
        <div className="flex-1 flex flex-col min-w-0 p-3 gap-3">
          <WaitingScreen othersOnline={othersOnline.length} />

          {/* Controls */}
          <div
            className="shrink-0 flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-2xl mx-auto"
            style={{
              background: 'rgba(255,240,250,0.22)',
              backdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.35)',
              boxShadow: '0 4px 24px rgba(190,24,93,0.08), inset 0 1px 0 rgba(255,255,255,0.4)',
            }}
          >
            <ControlBtn onClick={() => setMicOn((v) => !v)} active={micOn} label={micOn ? 'Mute' : 'Unmute'}>
              {micOn ? <Mic size={16} /> : <MicOff size={16} />}
            </ControlBtn>

            <ControlBtn onClick={() => setInCall(true)} active label="Start video call">
              <Video size={16} />
            </ControlBtn>

            <ControlBtn onClick={() => {}} danger label="End call">
              <Phone size={16} className="rotate-[135deg]" />
            </ControlBtn>

            <ControlBtn onClick={() => setChatOpen((v) => !v)} active={chatOpen} label="Chat">
              <MessageCircle size={16} />
            </ControlBtn>
          </div>
        </div>

        {/* Right: chat panel */}
        <div
          className="flex flex-col shrink-0 overflow-hidden transition-all duration-300"
          style={{
            width: chatOpen ? 256 : 0,
            opacity: chatOpen ? 1 : 0,
            background: 'rgba(255,240,250,0.18)',
            backdropFilter: 'blur(40px)',
            borderLeft: chatOpen ? '1px solid rgba(255,255,255,0.28)' : 'none',
          }}
        >
          {chatOpen && (
            <>
              {/* Chat header */}
              <div
                className="flex items-center justify-between px-4 py-3 shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}
              >
                <span className="font-bold text-sm" style={{ fontFamily: NUNITO, color: 'rgba(190,24,93,0.7)' }}>
                  Messages 💬
                </span>
                <button
                  onClick={() => setChatOpen(false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <X size={11} style={{ color: 'rgba(190,24,93,0.6)' }} />
                </button>
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 min-h-0"
                style={{ scrollbarWidth: 'none' }}
              >
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isMe = msg.user_id === userId
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className="max-w-[190px] px-3 py-2 text-xs leading-snug"
                          style={{
                            background: isMe ? 'rgba(236,72,153,0.55)' : 'rgba(255,255,255,0.3)',
                            backdropFilter: 'blur(20px)',
                            color: isMe ? 'white' : 'rgba(74,25,66,0.85)',
                            borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            border: isMe ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.4)',
                            boxShadow: '0 2px 12px rgba(160,40,100,0.08)',
                            fontFamily: NUNITO,
                            fontWeight: 500,
                          }}
                        >
                          {msg.content}
                        </div>
                        <span className="mt-0.5 px-1"
                          style={{ fontSize: 9, fontFamily: NUNITO, color: 'rgba(190,24,93,0.4)' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {/* Typing indicator */}
                {othersTyping.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start"
                  >
                    <div
                      className="px-3 py-2 rounded-2xl rounded-bl-sm flex gap-1 items-center"
                      style={{ background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.4)' }}
                    >
                      <span className="w-1.5 h-1.5 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div
                className="px-3 py-3 shrink-0 flex gap-2 items-center"
                style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}
              >
                <input
                  value={draft}
                  onChange={(e) => { setDraft(e.target.value); startTyping() }}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Message..."
                  className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.22)',
                    border: '1px solid rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(16px)',
                    fontFamily: NUNITO,
                    fontWeight: 500,
                    color: 'rgba(74,25,66,0.85)',
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!draft.trim() || sending}
                  className="rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90"
                  style={{
                    width: 32, height: 32,
                    background: draft.trim() ? 'rgba(236,72,153,0.6)' : 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  <Send size={12} style={{ color: draft.trim() ? 'white' : 'rgba(236,72,153,0.5)' }} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}