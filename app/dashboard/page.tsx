import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Dumbbell, TrendingUp, CalendarDays, FileText, ChevronRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const name = profile?.full_name ?? user.user_metadata?.full_name ?? 'Athlete'

  const { data: recentWorkouts } = await supabase
    .from('workouts')
    .select('*, workout_sets(*)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(5)

  const { data: allSets } = await supabase
    .from('workout_sets')
    .select('*, workouts!inner(user_id, date)')
    .eq('workouts.user_id', user.id)

  const totalWorkouts = recentWorkouts?.length ?? 0
  const totalVolume = allSets?.reduce((sum, s) => sum + (s.sets * s.reps * s.weight), 0) ?? 0

  const today = format(new Date(), 'EEEE, MMMM d')

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Welcome back, {name.split(' ')[0]} 👋</h1>
        <p className="text-zinc-400 mt-1">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <p className="text-zinc-400 text-sm">Recent Workouts</p>
          <p className="text-4xl font-bold text-white mt-1">{totalWorkouts}</p>
          <p className="text-zinc-500 text-xs mt-1">last 5 logged</p>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <p className="text-zinc-400 text-sm">Total Volume</p>
          <p className="text-4xl font-bold text-white mt-1">{totalVolume.toLocaleString()}</p>
          <p className="text-zinc-500 text-xs mt-1">lbs lifted (all time)</p>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <p className="text-zinc-400 text-sm">Last Workout</p>
          <p className="text-xl font-bold text-white mt-1">
            {recentWorkouts?.[0] ? format(new Date(recentWorkouts[0].date), 'MMM d') : '—'}
          </p>
          <p className="text-zinc-500 text-xs mt-1">
            {recentWorkouts?.[0]?.workout_sets?.length ?? 0} exercises
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { href: '/dashboard/log', icon: Dumbbell, label: 'Log a Workout', desc: 'Record today\'s session', color: 'text-blue-400' },
            { href: '/dashboard/progress', icon: TrendingUp, label: 'View Progress', desc: 'See your lift history', color: 'text-green-400' },
            { href: '/dashboard/calendar', icon: CalendarDays, label: 'View Calendar', desc: 'See your program', color: 'text-purple-400' },
            { href: '/dashboard/import', icon: FileText, label: 'Import Program', desc: 'Paste from Google Docs', color: 'text-orange-400' },
          ].map(({ href, icon: Icon, label, desc, color }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-colors group"
            >
              <div className={`${color} bg-zinc-800 rounded-lg p-2.5`}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{label}</p>
                <p className="text-zinc-500 text-xs">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent workouts */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Workouts</h2>
        {recentWorkouts && recentWorkouts.length > 0 ? (
          <div className="space-y-3">
            {recentWorkouts.map((workout) => (
              <div key={workout.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">
                      {format(new Date(workout.date), 'EEEE, MMMM d')}
                    </p>
                    <p className="text-zinc-400 text-sm mt-0.5">
                      {workout.workout_sets?.length ?? 0} exercises
                      {workout.notes && ` · ${workout.notes}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-500 text-xs">
                      {workout.workout_sets?.reduce((sum: number, s: { sets: number; reps: number; weight: number }) => sum + s.sets * s.reps * s.weight, 0).toLocaleString()} lbs
                    </p>
                  </div>
                </div>
                {workout.workout_sets && workout.workout_sets.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {workout.workout_sets.slice(0, 4).map((s: { id: string; exercise_name: string }) => (
                      <span key={s.id} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md">
                        {s.exercise_name}
                      </span>
                    ))}
                    {workout.workout_sets.length > 4 && (
                      <span className="text-xs text-zinc-500 px-2 py-1">
                        +{workout.workout_sets.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <Dumbbell size={32} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No workouts logged yet.</p>
            <Link href="/dashboard/log" className="text-blue-400 text-sm hover:text-blue-300 mt-1 inline-block">
              Log your first workout →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
