'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { motion, AnimatePresence } from 'motion/react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const errMsg = await signIn(email, password)
    setSubmitting(false)
    if (errMsg) {
      setError(errMsg)
    } else {
      router.push('/')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0f0a1a] px-6 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] bg-pink-600/15 rounded-full blur-[120px] pointer-events-none" />

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full max-w-sm bg-white/8 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="text-4xl mb-3">🌌</div>
          <h1 className="text-white text-xl font-semibold">Aurora</h1>
          <p className="text-white/40 text-sm mt-1">Your private space</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col gap-3"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 outline-none focus:border-white/40 transition-colors text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 outline-none focus:border-white/40 transition-colors text-sm"
            required
          />
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-red-300/90 text-xs mt-3"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={submitting}
          whileTap={{ scale: 0.97 }}
          className="w-full mt-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium transition-colors disabled:opacity-40 text-sm"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </motion.button>
      </motion.form>
    </main>
  )
}