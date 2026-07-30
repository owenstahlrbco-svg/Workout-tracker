'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { CLIENT_TYPES, type ClientType } from '@/lib/clientTypes'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'client' | 'coach'>('client')
  const [clientType, setClientType] = useState<ClientType>('online')
  const [coachCode, setCoachCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (role === 'coach' && coachCode !== 'COACH2024') {
      setError('Invalid coach access code.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, client_type: role === 'client' ? clientType : 'online' },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const inputClass = "w-full bg-white border border-emerald-900/15 rounded-xl px-4 py-2.5 text-emerald-950 placeholder-emerald-950/35 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-shadow duration-200 focus:shadow-md"

  return (
    <div className="min-h-screen bg-[#f5f8f5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Pitch HQ</p>
          <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1">Dashboard</h1>
          <p className="text-emerald-950/55 mt-3">Create your account and start training with intention.</p>
        </div>

        <form onSubmit={handleSignup} className="bg-white border border-emerald-900/10 rounded-3xl p-8 space-y-5 shadow-[0_8px_30px_rgba(6,78,59,0.08)]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm animate-rise-in">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-emerald-950 mb-1.5">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
              className={inputClass} placeholder="John Smith" />
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-950 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className={inputClass} placeholder="you@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-950 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className={`${inputClass} pr-11`} placeholder={showPassword ? 'Your password' : '••••••••'} />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-950/40 hover:text-emerald-700 transition-colors duration-200 hover:scale-110 active:scale-95"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-950 mb-1.5">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              {(['client', 'coach'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2.5 rounded-xl font-medium text-sm capitalize press ${
                    role === r
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-900/5 text-emerald-950/60 hover:bg-emerald-900/10'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {role === 'client' && (
            <div>
              <label className="block text-sm font-medium text-emerald-950 mb-1.5">How do you train?</label>
              <div className="space-y-2">
                {CLIENT_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setClientType(t.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border press ${
                      clientType === t.value
                        ? 'border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700'
                        : 'border-emerald-900/15 hover:border-emerald-700/40'
                    }`}
                  >
                    <p className="text-sm font-medium text-emerald-950">{t.label}</p>
                    <p className="text-xs text-emerald-950/55 mt-0.5">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {role === 'coach' && (
            <div>
              <label className="block text-sm font-medium text-emerald-950 mb-1.5">Coach Access Code</label>
              <input type="text" value={coachCode} onChange={(e) => setCoachCode(e.target.value)}
                className={inputClass} placeholder="Enter code" />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-800 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/20 disabled:opacity-50 text-white font-semibold rounded-xl py-3 press"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-emerald-950/55 text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-emerald-700 font-medium hover:text-emerald-600 press inline-block">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
