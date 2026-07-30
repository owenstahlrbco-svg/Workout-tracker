import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KeyRound, MapPin, Wifi, GraduationCap } from 'lucide-react'
import PathwayAccessToggle from '@/components/PathwayAccessToggle'

export const metadata = { title: 'Members & Access · Pitch HQ' }

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  client_type: string | null
  pathway_access: boolean | null
}

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: clients } = await supabase
    .from('profiles')
    .select('id, full_name, email, client_type, pathway_access')
    .eq('role', 'client')
    .order('full_name')

  const list = (clients ?? []) as Profile[]
  const topTierCount = list.filter(c => c.pathway_access).length

  const groups = [
    { type: 'in_person', title: 'In-Person Clients', icon: MapPin },
    { type: 'online', title: 'Online Clients', icon: Wifi },
    { type: 'community', title: 'Skool Community', icon: GraduationCap },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8 stagger">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Coach HQ</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1 flex items-center gap-2.5">
          <KeyRound size={28} className="text-emerald-700" /> Members &amp; Access
        </h1>
        <p className="text-emerald-950/55 mt-2">
          Flip a member to <span className="font-semibold text-emerald-950">Top tier</span> to unlock the Coach Directory for them.
          Revoke instantly if they stop paying — the recruiting database locks the moment you toggle it off.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-950 text-white rounded-2xl p-5 hover:shadow-[0_10px_32px_rgba(6,78,59,0.30)] lift">
          <p className="text-emerald-100/60 text-sm">Top-Tier Members</p>
          <p className="font-display text-4xl font-semibold mt-1">{topTierCount}</p>
          <p className="text-emerald-100/40 text-xs mt-1">have Coach Directory access</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 hover:border-emerald-700/30 hover:shadow-[0_6px_24px_rgba(6,78,59,0.08)] lift">
          <p className="text-emerald-950/55 text-sm">Total Members</p>
          <p className="font-display text-4xl font-semibold text-emerald-950 mt-1">{list.length}</p>
        </div>
      </div>

      {list.length > 0 ? (
        groups.map(({ type, title, icon: Icon }) => {
          const members = list.filter(c => (c.client_type ?? 'online') === type)
          if (members.length === 0) return null
          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={16} className="text-emerald-700" />
                <h2 className="font-display text-xl font-semibold text-emerald-950">{title}</h2>
                <span className="text-xs text-emerald-950/45 font-medium">{members.length}</span>
              </div>
              <div className="space-y-2">
                {members.map(c => (
                  <div key={c.id} className="flex items-center gap-4 bg-white border border-emerald-900/10 rounded-2xl px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {c.full_name?.charAt(0) ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-emerald-950 font-semibold text-sm truncate">{c.full_name ?? 'Unknown'}</p>
                      <p className="text-emerald-950/50 text-xs truncate">{c.email}</p>
                    </div>
                    <PathwayAccessToggle clientId={c.id} current={!!c.pathway_access} />
                  </div>
                ))}
              </div>
            </div>
          )
        })
      ) : (
        <div className="bg-white border border-emerald-900/10 rounded-3xl p-12 text-center">
          <KeyRound size={38} className="text-emerald-900/25 mx-auto mb-4" />
          <p className="text-emerald-950/55">No members yet. When clients sign up, you can grant top-tier access here.</p>
        </div>
      )}
    </div>
  )
}
