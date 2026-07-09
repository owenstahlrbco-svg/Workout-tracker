import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Dumbbell, TrendingUp, CalendarDays, FileText, ChevronRight, MessageCircle, Flame } from 'lucide-react'
import { parseDate } from '@/lib/dates'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const name = profile?.full_name ?? user.user_metadata?.full_name ?? 'Athlete'

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const [{ data: recentWorkouts }, { count: totalWorkouts }, { data: allSets }, { data: todayProgram }] = await Promise.all([
    supabase
      .from('workouts')
      .select('*, workout_sets(*)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(5),
    supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('workout_sets')
      .select('*, workouts!inner(user_id, date)')
      .eq('workouts.user_id', user.id),
    supabase
      .from('program_days')
      .select('*, programs!inner(user_id, title)')
      .eq('programs.user_id', user.id)
      .eq('date', todayStr),
  ])

  const totalVolume = allSets?.reduce((sum, s) => sum + (s.sets * s.reps * s.weight), 0) ?? 0
  const todaySession = todayProgram?.[0]
  const loggedToday = recentWorkouts?.some(w => w.date === todayStr) ?? false

  const today = format(new Date(), 'EEEE, MMMM d')

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">{today}</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1">
          Welcome back, {name.split(' ')[0]}
        </h1>
      </div>

      {/* Today's session */}
      <div className="bg-emerald-950 text-white rounded-3xl p-7 shadow-[0_10px_40px_rgba(6,78,59,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-400">Today&apos;s Session</p>
            {todaySession ? (
              <>
                <p className="font-display text-2xl font-semibold mt-2">{todaySession.programs?.title}</p>
                <p className="text-emerald-100/70 text-sm mt-3 whitespace-pre-wrap line-clamp-6">{todaySession.content}</p>
              </>
            ) : (
              <p className="font-display text-2xl font-semibold mt-2">
                {loggedToday ? 'Session logged — well done.' : 'No session programmed today'}
              </p>
            )}
          </div>
          {loggedToday && (
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-400/15 text-emerald-300 px-3 py-1.5 rounded-full flex-shrink-0">
              <Flame size={13} /> Completed
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link href="/dashboard/log" className="bg-white text-emerald-950 hover:bg-emerald-50 font-semibold text-sm rounded-xl px-5 py-2.5 transition-colors">
            {loggedToday ? 'Log Another Workout' : 'Log This Workout'}
          </Link>
          <Link href="/dashboard/calendar" className="border border-white/25 hover:bg-white/10 text-white font-medium text-sm rounded-xl px-5 py-2.5 transition-colors">
            View Calendar
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-emerald-900/10">
          <p className="text-emerald-950/55 text-sm">Total Workouts</p>
          <p className="font-display text-4xl font-semibold text-emerald-950 mt-1">{totalWorkouts ?? 0}</p>
          <p className="text-emerald-950/40 text-xs mt-1">all time</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-emerald-900/10">
          <p className="text-emerald-950/55 text-sm">Total Volume</p>
          <p className="font-display text-4xl font-semibold text-emerald-950 mt-1">{totalVolume.toLocaleString()}</p>
          <p className="text-emerald-950/40 text-xs mt-1">lbs lifted (all time)</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-emerald-900/10">
          <p className="text-emerald-950/55 text-sm">Last Workout</p>
          <p className="font-display text-2xl font-semibold text-emerald-950 mt-1">
            {recentWorkouts?.[0] ? format(parseDate(recentWorkouts[0].date), 'MMM d') : '—'}
          </p>
          <p className="text-emerald-950/40 text-xs mt-1">
            {recentWorkouts?.[0]?.workout_sets?.length ?? 0} exercises
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-display text-xl font-semibold text-emerald-950 mb-4">Where to go</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { href: '/dashboard/log', icon: Dumbbell, label: 'Log a Workout', desc: 'Record today\'s session — sets, reps, weight' },
            { href: '/dashboard/progress', icon: TrendingUp, label: 'View Progress', desc: 'PRs and lift history over time' },
            { href: '/dashboard/calendar', icon: CalendarDays, label: 'View Calendar', desc: 'Your program and logged sessions, day by day' },
            { href: '/dashboard/import', icon: FileText, label: 'Import a Plan', desc: 'Paste a Google Doc from Owen or Skool' },
            { href: '/dashboard/messages', icon: MessageCircle, label: 'Message Owen', desc: 'A direct line to your coach' },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 bg-white border border-emerald-900/10 hover:border-emerald-700/40 hover:shadow-[0_4px_20px_rgba(6,78,59,0.08)] rounded-2xl p-4 transition-all group"
            >
              <div className="text-emerald-700 bg-emerald-50 rounded-xl p-2.5">
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <p className="text-emerald-950 font-semibold text-sm">{label}</p>
                <p className="text-emerald-950/50 text-xs mt-0.5">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-emerald-950/30 group-hover:text-emerald-700 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent workouts */}
      <div>
        <h2 className="font-display text-xl font-semibold text-emerald-950 mb-4">Recent Workouts</h2>
        {recentWorkouts && recentWorkouts.length > 0 ? (
          <div className="space-y-3">
            {recentWorkouts.map((workout) => (
              <div key={workout.id} className="bg-white border border-emerald-900/10 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-950 font-semibold">
                      {format(parseDate(workout.date), 'EEEE, MMMM d')}
                    </p>
                    <p className="text-emerald-950/55 text-sm mt-0.5">
                      {workout.workout_sets?.length ?? 0} exercises
                      {workout.notes && ` · ${workout.notes}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-950/45 text-xs">
                      {workout.workout_sets?.reduce((sum: number, s: { sets: number; reps: number; weight: number }) => sum + s.sets * s.reps * s.weight, 0).toLocaleString()} lbs
                    </p>
                  </div>
                </div>
                {workout.workout_sets && workout.workout_sets.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {workout.workout_sets.slice(0, 4).map((s: { id: string; exercise_name: string }) => (
                      <span key={s.id} className="text-xs bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-lg">
                        {s.exercise_name}
                      </span>
                    ))}
                    {workout.workout_sets.length > 4 && (
                      <span className="text-xs text-emerald-950/45 px-2 py-1">
                        +{workout.workout_sets.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-emerald-900/10 rounded-2xl p-8 text-center">
            <Dumbbell size={32} className="text-emerald-900/25 mx-auto mb-3" />
            <p className="text-emerald-950/55">No workouts logged yet.</p>
            <Link href="/dashboard/log" className="text-emerald-700 font-medium text-sm hover:text-emerald-600 mt-1 inline-block">
              Log your first workout →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
