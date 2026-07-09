import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProgressCharts from '@/components/ProgressCharts'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: sets } = await supabase
    .from('workout_sets')
    .select('*, workouts!inner(user_id, date)')
    .eq('workouts.user_id', user.id)
    .order('workouts(date)', { ascending: true })

  const exercises = [...new Set(sets?.map(s => s.exercise_name) ?? [])]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Tracker</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1">Progress</h1>
        <p className="text-emerald-950/55 mt-2">Your lift history and personal records — watch the line go up.</p>
      </div>
      <ProgressCharts sets={sets ?? []} exercises={exercises} />
    </div>
  )
}
