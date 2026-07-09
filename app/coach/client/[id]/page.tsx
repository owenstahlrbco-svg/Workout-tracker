import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, subDays } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, Dumbbell, MessageCircle, CheckCircle2, XCircle } from 'lucide-react'
import ClientTypeSelect from '@/components/ClientTypeSelect'
import { parseDate } from '@/lib/dates'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: client } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (!client) redirect('/coach')

  const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')

  const [{ data: workouts }, { data: programDays }] = await Promise.all([
    supabase
      .from('workouts')
      .select('*, workout_sets(*)')
      .eq('user_id', id)
      .order('date', { ascending: false }),
    supabase
      .from('program_days')
      .select('*, programs!inner(user_id, title)')
      .eq('programs.user_id', id)
      .gte('date', weekAgo)
      .order('date'),
  ])

  const totalSets = workouts?.reduce((sum, w) => sum + (w.workout_sets?.length ?? 0), 0) ?? 0
  const totalVolume = workouts?.reduce((sum, w) =>
    sum + (w.workout_sets?.reduce((s: number, set: { sets: number; reps: number; weight: number }) => s + set.sets * set.reps * set.weight, 0) ?? 0), 0) ?? 0

  const allSets = workouts?.flatMap(w => w.workout_sets ?? []) ?? []
  const prMap: Record<string, number> = {}
  allSets.forEach((s: { exercise_name: string; weight: number }) => {
    if (!prMap[s.exercise_name] || s.weight > prMap[s.exercise_name]) {
      prMap[s.exercise_name] = s.weight
    }
  })

  const workoutDates = new Set(workouts?.map(w => w.date) ?? [])

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/coach" className="text-emerald-950/50 hover:text-emerald-950 transition-colors mt-1.5">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display text-4xl font-semibold text-emerald-950">{client.full_name}</h1>
            <p className="text-emerald-950/55 mt-0.5">{client.email}</p>
            <div className="mt-3">
              <ClientTypeSelect clientId={client.id} current={client.client_type ?? 'online'} />
            </div>
          </div>
        </div>
        <Link
          href={`/coach/messages/${client.id}`}
          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl px-5 py-2.5 transition-colors"
        >
          <MessageCircle size={16} /> Message
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-emerald-900/10 rounded-2xl p-5">
          <p className="text-emerald-950/55 text-sm">Total Workouts</p>
          <p className="font-display text-3xl font-semibold text-emerald-950 mt-1">{workouts?.length ?? 0}</p>
        </div>
        <div className="bg-white border border-emerald-900/10 rounded-2xl p-5">
          <p className="text-emerald-950/55 text-sm">Total Exercises</p>
          <p className="font-display text-3xl font-semibold text-emerald-950 mt-1">{totalSets}</p>
        </div>
        <div className="bg-white border border-emerald-900/10 rounded-2xl p-5">
          <p className="text-emerald-950/55 text-sm">Total Volume</p>
          <p className="font-display text-3xl font-semibold text-emerald-950 mt-1">{totalVolume.toLocaleString()}</p>
          <p className="text-emerald-950/40 text-xs">lbs</p>
        </div>
      </div>

      {/* This week's programmed days */}
      {programDays && programDays.length > 0 && (
        <div className="bg-white border border-emerald-900/10 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-emerald-900/10">
            <h2 className="font-display text-lg font-semibold text-emerald-950">This Week&apos;s Program</h2>
            <p className="text-emerald-950/50 text-xs mt-0.5">Programmed days in the last 7 days — did they get done?</p>
          </div>
          <div className="divide-y divide-emerald-900/10">
            {programDays.map(day => {
              const done = workoutDates.has(day.date)
              return (
                <div key={day.id} className="flex items-center gap-3 px-5 py-3">
                  {done
                    ? <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                    : <XCircle size={18} className="text-red-400 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-emerald-950 text-sm font-medium">
                      {format(parseDate(day.date), 'EEEE, MMM d')} · {day.programs?.title}
                    </p>
                    <p className="text-emerald-950/50 text-xs truncate">{day.content?.split('\n')[0]}</p>
                  </div>
                  <span className={`text-xs font-semibold flex-shrink-0 ${done ? 'text-emerald-600' : 'text-red-400'}`}>
                    {done ? 'Completed' : 'Not logged'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* PRs */}
      {Object.keys(prMap).length > 0 && (
        <div className="bg-white border border-emerald-900/10 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-emerald-900/10">
            <h2 className="font-display text-lg font-semibold text-emerald-950">Personal Records</h2>
          </div>
          <div className="divide-y divide-emerald-900/10">
            {Object.entries(prMap)
              .sort(([, a], [, b]) => b - a)
              .map(([exercise, weight]) => (
                <div key={exercise} className="flex items-center justify-between px-5 py-3">
                  <span className="text-emerald-950/75 text-sm">{exercise}</span>
                  <span className="text-emerald-950 font-semibold text-sm">{weight} lbs</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Workout history */}
      <div>
        <h2 className="font-display text-xl font-semibold text-emerald-950 mb-4">Workout History</h2>
        {workouts && workouts.length > 0 ? (
          <div className="space-y-3">
            {workouts.map(workout => (
              <div key={workout.id} className="bg-white border border-emerald-900/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-emerald-950 font-semibold">
                    {format(parseDate(workout.date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-emerald-950/50 text-sm">
                    {workout.workout_sets?.reduce((s: number, set: { sets: number; reps: number; weight: number }) => s + set.sets * set.reps * set.weight, 0).toLocaleString()} lbs
                  </p>
                </div>
                <div className="space-y-1.5">
                  {workout.workout_sets?.map((s: { id: string; exercise_name: string; sets: number; reps: number; weight: number; unit: string }) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <span className="text-emerald-950/75">{s.exercise_name}</span>
                      <span className="text-emerald-950/45">{s.sets}×{s.reps} @ {s.weight}{s.unit}</span>
                    </div>
                  ))}
                </div>
                {workout.notes && (
                  <p className="text-emerald-950/55 text-sm mt-3 italic">{workout.notes}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-emerald-900/10 rounded-2xl p-10 text-center">
            <Dumbbell size={32} className="text-emerald-900/25 mx-auto mb-3" />
            <p className="text-emerald-950/55">No workouts logged yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
