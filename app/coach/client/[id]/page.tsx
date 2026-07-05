import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, Dumbbell } from 'lucide-react'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: client } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (!client) redirect('/coach')

  const { data: workouts } = await supabase
    .from('workouts')
    .select('*, workout_sets(*)')
    .eq('user_id', id)
    .order('date', { ascending: false })

  const totalSets = workouts?.reduce((sum, w) => sum + (w.workout_sets?.length ?? 0), 0) ?? 0
  const totalVolume = workouts?.reduce((sum, w) =>
    sum + (w.workout_sets?.reduce((s: number, set: { sets: number; reps: number; weight: number }) => s + set.sets * set.reps * set.weight, 0) ?? 0), 0) ?? 0

  // PR per exercise
  const allSets = workouts?.flatMap(w => w.workout_sets ?? []) ?? []
  const prMap: Record<string, number> = {}
  allSets.forEach((s: { exercise_name: string; weight: number }) => {
    if (!prMap[s.exercise_name] || s.weight > prMap[s.exercise_name]) {
      prMap[s.exercise_name] = s.weight
    }
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/coach" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">{client.full_name}</h1>
          <p className="text-zinc-400 mt-0.5">{client.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400 text-sm">Total Workouts</p>
          <p className="text-3xl font-bold text-white mt-1">{workouts?.length ?? 0}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400 text-sm">Total Exercises</p>
          <p className="text-3xl font-bold text-white mt-1">{totalSets}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400 text-sm">Total Volume</p>
          <p className="text-3xl font-bold text-white mt-1">{totalVolume.toLocaleString()}</p>
          <p className="text-zinc-500 text-xs">lbs</p>
        </div>
      </div>

      {/* PRs */}
      {Object.keys(prMap).length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800">
            <h2 className="font-semibold text-white">Personal Records</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            {Object.entries(prMap)
              .sort(([, a], [, b]) => b - a)
              .map(([exercise, weight]) => (
                <div key={exercise} className="flex items-center justify-between px-5 py-3">
                  <span className="text-zinc-300 text-sm">{exercise}</span>
                  <span className="text-white font-semibold text-sm">{weight} lbs</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Workout history */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Workout History</h2>
        {workouts && workouts.length > 0 ? (
          <div className="space-y-3">
            {workouts.map(workout => (
              <div key={workout.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white font-medium">
                    {format(new Date(workout.date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-zinc-400 text-sm">
                    {workout.workout_sets?.reduce((s: number, set: { sets: number; reps: number; weight: number }) => s + set.sets * set.reps * set.weight, 0).toLocaleString()} lbs
                  </p>
                </div>
                <div className="space-y-1.5">
                  {workout.workout_sets?.map((s: { id: string; exercise_name: string; sets: number; reps: number; weight: number; unit: string }) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">{s.exercise_name}</span>
                      <span className="text-zinc-500">{s.sets}×{s.reps} @ {s.weight}{s.unit}</span>
                    </div>
                  ))}
                </div>
                {workout.notes && (
                  <p className="text-zinc-400 text-sm mt-3 italic">{workout.notes}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
            <Dumbbell size={32} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No workouts logged yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
