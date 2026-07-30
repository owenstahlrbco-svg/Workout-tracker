'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Lock, Unlock, Loader2 } from 'lucide-react'

export default function PathwayAccessToggle({ clientId, current }: { clientId: string; current: boolean }) {
  const [on, setOn] = useState(current)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function toggle() {
    if (saving) return
    setSaving(true)
    const next = !on
    setOn(next)
    const { error } = await supabase.from('profiles').update({ pathway_access: next }).eq('id', clientId)
    if (error) setOn(!next)
    else router.refresh()
    setSaving(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      title={on ? 'Top tier — Coach Directory unlocked. Click to revoke.' : 'Locked. Click to grant top-tier / Coach Directory access.'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold press disabled:opacity-60 ${
        on
          ? 'bg-emerald-800 text-white hover:bg-emerald-700'
          : 'bg-emerald-900/5 text-emerald-950/55 hover:bg-emerald-900/10'
      }`}
    >
      {saving ? <Loader2 size={13} className="animate-spin" /> : on ? <Unlock size={13} className="animate-pop-in" /> : <Lock size={13} className="animate-pop-in" />}
      {on ? 'Top tier' : 'Locked'}
    </button>
  )
}
