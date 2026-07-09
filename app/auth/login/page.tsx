'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f8f5] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Pitch HQ</p>
          <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1">Dashboard</h1>
          <p className="text-emerald-950/55 mt-3">Welcome back. Sign in to your training headquarters.</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white border border-emerald-900/10 rounded-3xl p-8 space-y-5 shadow-[0_8px_30px_rgba(6,78,59,0.08)]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-emerald-950 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white border border-emerald-900/15 rounded-xl px-4 py-2.5 text-emerald-950 placeholder-emerald-950/35 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-950 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white border border-emerald-900/15 rounded-xl px-4 py-2.5 text-emerald-950 placeholder-emerald-950/35 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-emerald-950/55 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-emerald-700 font-medium hover:text-emerald-600">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
