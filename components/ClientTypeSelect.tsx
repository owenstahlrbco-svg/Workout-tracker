'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CLIENT_TYPES, type ClientType } from '@/lib/clientTypes'

export default function ClientTypeSelect({ clientId, current }: { clientId: string; current: string }) {
  const [value, setValue] = useState(current)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function change(next: ClientType) {
    if (next === value || saving) return
    setSaving(true)
    const previous = value
    setValue(next)
    const { error } = await supabase.from('profiles').update({ client_type: next }).eq('id', clientId)
    if (error) setValue(previous)
    else router.refresh()
    setSaving(false)
  }

  return (
    <div className="flex gap-2">
      {CLIENT_TYPES.map(t => (
        <button
          key={t.value}
          onClick={() => change(t.value)}
          disabled={saving}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            value === t.value
              ? 'bg-emerald-800 text-white'
              : 'bg-emerald-900/5 text-emerald-950/60 hover:bg-emerald-900/10'
          }`}
        >
          {t.short}
        </button>
      ))}
    </div>
  )
}
