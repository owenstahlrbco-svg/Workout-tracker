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
        <h1 className="text-3xl font-bold text-white">Progress</h1>
        <p className="text-zinc-400 mt-1">Track your lift history and personal records.</p>
      </div>
      <ProgressCharts sets={sets ?? []} exercises={exercises} />
    </div>
  )
}
