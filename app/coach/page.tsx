import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, subDays, differenceInDays } from 'date-fns'
import { Users, ChevronRight, Dumbbell, MapPin, Wifi, GraduationCap } from 'lucide-react'
import { parseDate } from '@/lib/dates'

interface Workout {
  id: string
  user_id: string
  date: string
}

interface ProgramDay {
  id: string
  date: string
  programs: { user_id: string }
}

export default async function CoachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')

  const [{ data: clients }, { data: workouts }, { data: weekProgramDays }] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'client').order('full_name'),
    supabase.from('workouts').select('id, user_id, date').order('date', { ascending: false }),
    supabase.from('program_days').select('id, date, programs!inner(user_id)').gte('date', weekAgo),
  ])

  const allWorkouts = (workouts ?? []) as Workout[]
  const programDays = (weekProgramDays ?? []) as unknown as ProgramDay[]

  function clientWorkouts(clientId: string) {
    return allWorkouts.filter(w => w.user_id === clientId)
  }

  function weekStats(clientId: string) {
    const done = clientWorkouts(clientId).filter(w => w.date >= weekAgo)
    const programmed = programDays.filter(p => p.programs.user_id === clientId)
    const completed = programmed.filter(p => done.some(w => w.date === p.date))
    return { doneCount: done.length, programmedCount: programmed.length, completedCount: completed.length }
  }

  function activityStatus(clientId: string): { color: string; label: string } {
    const last = clientWorkouts(clientId)[0]
    if (!last) return { color: 'bg-red-400', label: 'Never logged' }
    const days = differenceInDays(new Date(), parseDate(last.date))
    if (days <= 7) return { color: 'bg-emerald-500', label: 'Active this week' }
    if (days <= 14) return { color: 'bg-amber-400', label: `Quiet ${days} days` }
    return { color: 'bg-red-400', label: `Inactive ${days} days` }
  }

  // Business metrics
  const clientList = clients ?? []
  const activeThisWeek = clientList.filter(c => clientWorkouts(c.id).some(w => w.date >= weekAgo)).length
  const sessionsThisWeek = allWorkouts.filter(w => w.date >= weekAgo).length
  const totalProgrammed = programDays.length
  const totalCompleted = programDays.filter(p =>
    allWorkouts.some(w => w.user_id === p.programs.user_id && w.date === p.date)
  ).length
  const adherence = totalProgrammed > 0 ? Math.round((totalCompleted / totalProgrammed) * 100) : null

  const groups = [
    { type: 'in_person', title: 'In-Person Clients', icon: MapPin },
    { type: 'online', title: 'Online Clients', icon: Wifi },
    { type: 'community', title: 'Skool Community', icon: GraduationCap },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Coach HQ</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1">Your Clients</h1>
        <p className="text-emerald-950/55 mt-2">Everyone you coach — who&apos;s training, who&apos;s slipping, and what got done.</p>
      </div>

      {/* Business metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-950 text-white rounded-2xl p-5">
          <p className="text-emerald-100/60 text-sm">Total Clients</p>
          <p className="font-display text-4xl font-semibold mt-1">{clientList.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-emerald-900/10">
          <p className="text-emerald-950/55 text-sm">Active This Week</p>
          <p className="font-display text-4xl font-semibold text-emerald-950 mt-1">{activeThisWeek}</p>
          <p className="text-emerald-950/40 text-xs mt-1">logged ≥1 workout</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-emerald-900/10">
          <p className="text-emerald-950/55 text-sm">Sessions This Week</p>
          <p className="font-display text-4xl font-semibold text-emerald-950 mt-1">{sessionsThisWeek}</p>
          <p className="text-emerald-950/40 text-xs mt-1">across all clients</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-emerald-900/10">
          <p className="text-emerald-950/55 text-sm">Plan Adherence</p>
          <p className="font-display text-4xl font-semibold text-emerald-950 mt-1">
            {adherence !== null ? `${adherence}%` : '—'}
          </p>
          <p className="text-emerald-950/40 text-xs mt-1">
            {totalProgrammed > 0 ? `${totalCompleted} of ${totalProgrammed} programmed days done` : 'no programmed days this week'}
          </p>
        </div>
      </div>

      {/* Client groups */}
      {clientList.length > 0 ? (
        groups.map(({ type, title, icon: GroupIcon }) => {
          const members = clientList.filter(c => (c.client_type ?? 'online') === type)
          if (members.length === 0) return null
          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                <GroupIcon size={16} className="text-emerald-700" />
                <h2 className="font-display text-xl font-semibold text-emerald-950">{title}</h2>
                <span className="text-xs text-emerald-950/45 font-medium">{members.length}</span>
              </div>
              <div className="space-y-2">
                {members.map(client => {
                  const all = clientWorkouts(client.id)
                  const last = all[0]
                  const status = activityStatus(client.id)
                  const week = weekStats(client.id)
                  return (
                    <Link
                      key={client.id}
                      href={`/coach/client/${client.id}`}
                      className="flex items-center gap-4 bg-white border border-emerald-900/10 hover:border-emerald-700/40 hover:shadow-[0_4px_20px_rgba(6,78,59,0.08)] rounded-2xl p-4 transition-all group"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-full bg-emerald-800 flex items-center justify-center text-white font-semibold">
                          {client.full_name?.charAt(0) ?? '?'}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${status.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-emerald-950 font-semibold text-sm">{client.full_name ?? 'Unknown'}</p>
                        <p className="text-emerald-950/50 text-xs truncate">{status.label} · {client.email}</p>
                      </div>
                      <div className="hidden sm:block text-right text-xs flex-shrink-0">
                        <p className="text-emerald-950 font-semibold">
                          {week.programmedCount > 0
                            ? `${week.completedCount}/${week.programmedCount} programmed done`
                            : `${week.doneCount} this week`}
                        </p>
                        <p className="text-emerald-950/45 mt-0.5">
                          {all.length} total · {last ? `last ${format(parseDate(last.date), 'MMM d')}` : 'no workouts'}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-emerald-950/30 group-hover:text-emerald-700 transition-colors flex-shrink-0" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })
      ) : (
        <div className="bg-white border border-emerald-900/10 rounded-3xl p-12 text-center">
          <Users size={40} className="text-emerald-900/25 mx-auto mb-4" />
          <p className="text-emerald-950/55">No clients yet. When clients sign up, they&apos;ll appear here.</p>
        </div>
      )}

      {/* Recent activity */}
      {allWorkouts.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-semibold text-emerald-950 mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {allWorkouts.slice(0, 10).map(workout => {
              const client = clientList.find(c => c.id === workout.user_id)
              return (
                <div key={workout.id} className="flex items-center gap-3 bg-white border border-emerald-900/10 rounded-2xl px-4 py-3">
                  <Dumbbell size={16} className="text-emerald-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-emerald-950 text-sm font-semibold">{client?.full_name ?? 'Unknown'}</span>
                    <span className="text-emerald-950/50 text-sm"> logged a workout</span>
                  </div>
                  <span className="text-emerald-950/45 text-xs flex-shrink-0">
                    {format(parseDate(workout.date), 'MMM d')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
