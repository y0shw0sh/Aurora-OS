'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { useAuth } from '@/components/AuthProvider'

const SONOMA_GRADIENT = `
  radial-gradient(ellipse at 20% 30%, #c9a0dc 0%, transparent 50%),
  radial-gradient(ellipse at 80% 20%, #a8c4e8 0%, transparent 45%),
  radial-gradient(ellipse at 60% 80%, #f4b8d1 0%, transparent 50%),
  radial-gradient(ellipse at 10% 80%, #9ec8e8 0%, transparent 45%),
  linear-gradient(135deg, #b6c8f0 0%, #d4a8d8 40%, #f0b8cc 70%, #c4d8f4 100%)
`

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
    if (errMsg) setError(errMsg)
    else router.push('/')
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: SONOMA_GRADIENT }}
    >
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        className="flex flex-col w-full max-w-xs"
        style={{
          background: 'rgba(255,255,255,0.38)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.6)',
          borderRadius: 14,
          padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        <div className="text-center mb-6">
          <div style={{ fontSize: 36, marginBottom: 8 }}>🌌</div>
          <h1 style={{ fontSize: 17, fontWeight: 600, color: 'rgba(0,0,0,0.82)', letterSpacing: '-0.02em' }}>
            Aurora
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>
            Sign in to continue
          </p>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-2 outline-none transition-all"
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.12)',
            background: 'rgba(255,255,255,0.55)',
            fontSize: 13,
            color: 'rgba(0,0,0,0.85)',
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-4 outline-none transition-all"
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.12)',
            background: 'rgba(255,255,255,0.55)',
            fontSize: 13,
            color: 'rgba(0,0,0,0.85)',
          }}
        />

        {error && (
          <p className="mb-3 text-center" style={{ fontSize: 12, color: '#d4183d' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '8px 0',
            borderRadius: 8,
            background: 'rgba(0,122,255,0.85)',
            color: 'white',
            fontSize: 13,
            fontWeight: 500,
            border: 'none',
            cursor: submitting ? 'default' : 'pointer',
            opacity: submitting ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </motion.form>
    </main>
  )
}