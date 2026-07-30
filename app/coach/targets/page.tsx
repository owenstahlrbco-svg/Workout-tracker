import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Target, GraduationCap, Trophy, Mail, MapPin } from 'lucide-react'

export const metadata = { title: 'Player Targets · Pitch HQ' }

// One favorite row, with the player and the school it points at joined in.
interface FavRow {
  user_id: string
  created_at: string
  profiles: { full_name: string | null; email: string | null } | null
  coach_contacts: {
    id: number
    school: string | null
    coach: string | null
    role: string | null
    email: string | null
    division: string | null
    conference: string | null
    sport: string | null
    gender: string | null
    state: string | null
    country: string | null
    category: string | null
  } | null
}

export default async function PlayerTargetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // RLS on coach_favorites lets the coach read everyone's list.
  const { data } = await supabase
    .from('coach_favorites')
    .select('user_id, created_at, profiles(full_name, email), coach_contacts(id, school, coach, role, email, division, conference, sport, gender, state, country, category)')
    .order('created_at', { ascending: false })

  const rows = (data ?? []) as unknown as FavRow[]

  // Group targets by player.
  const byPlayer = new Map<string, { name: string; email: string | null; targets: FavRow['coach_contacts'][] }>()
  for (const r of rows) {
    if (!r.coach_contacts) continue
    const existing = byPlayer.get(r.user_id)
    if (existing) {
      existing.targets.push(r.coach_contacts)
    } else {
      byPlayer.set(r.user_id, {
        name: r.profiles?.full_name ?? 'Unknown player',
        email: r.profiles?.email ?? null,
        targets: [r.coach_contacts],
      })
    }
  }
  const players = Array.from(byPlayer.values()).sort((a, b) => a.name.localeCompare(b.name))
  const totalTargets = rows.filter(r => r.coach_contacts).length

  return (
    <div className="max-w-4xl mx-auto space-y-8 stagger">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Coach HQ · Recruiting</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1 flex items-center gap-2.5">
          <Target size={28} className="text-emerald-700" /> Player Targets
        </h1>
        <p className="text-emerald-950/55 mt-2">
          Every school your players have starred in the Coach Directory — their target lists, so you can see who
          they&apos;re chasing and help them close.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-950 text-white rounded-2xl p-5 hover:shadow-[0_10px_32px_rgba(6,78,59,0.30)] lift">
          <p className="text-emerald-100/60 text-sm">Players Building Lists</p>
          <p className="font-display text-4xl font-semibold mt-1">{players.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 hover:border-emerald-700/30 hover:shadow-[0_6px_24px_rgba(6,78,59,0.08)] lift">
          <p className="text-emerald-950/55 text-sm">Total Target Schools</p>
          <p className="font-display text-4xl font-semibold text-emerald-950 mt-1">{totalTargets}</p>
        </div>
      </div>

      {players.length > 0 ? (
        <div className="space-y-5">
          {players.map((p, i) => (
            <div key={i} className="bg-white border border-emerald-900/10 rounded-3xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-900/10 bg-emerald-900/[0.02]">
                <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {p.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-emerald-950 font-semibold truncate">{p.name}</p>
                  {p.email && <p className="text-emerald-950/50 text-xs truncate">{p.email}</p>}
                </div>
                <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-700/10 px-2.5 py-1 rounded-full flex-shrink-0">
                  <Target size={12} /> {p.targets.length} target{p.targets.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="divide-y divide-emerald-900/[0.06]">
                {p.targets.map((t, j) => {
                  if (!t) return null
                  const isPro = t.category === 'pro'
                  return (
                    <div key={j} className="flex items-center gap-3 px-5 py-3">
                      {isPro
                        ? <Trophy size={15} className="text-emerald-700/70 flex-shrink-0" />
                        : <GraduationCap size={15} className="text-emerald-700/70 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-emerald-950 font-medium text-sm truncate">{t.school || t.coach || '—'}</p>
                        <p className="text-emerald-950/45 text-[11px] truncate">
                          {[
                            t.coach && `${t.coach}${t.role ? ` · ${t.role}` : ''}`,
                            !isPro
                              ? [t.sport && `${t.gender ?? ''} ${t.sport}`.trim(), t.division, t.conference, t.state].filter(Boolean).join(' · ')
                              : [t.division, t.country].filter(Boolean).join(' · '),
                          ].filter(Boolean).join('  ·  ')}
                        </p>
                      </div>
                      {t.email && (
                        <a href={`mailto:${t.email}`} title={`Email ${t.email}`}
                           className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/5 text-emerald-800 press text-xs font-semibold hover:bg-emerald-900/10 transition-colors">
                          <Mail size={13} /> <span className="hidden sm:inline">Email</span>
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-emerald-900/10 rounded-3xl p-12 text-center">
          <MapPin size={38} className="text-emerald-900/25 mx-auto mb-4" />
          <p className="text-emerald-950/55">No target schools yet. When players star schools in the Coach Directory, their lists show up here.</p>
        </div>
      )}
    </div>
  )
}
