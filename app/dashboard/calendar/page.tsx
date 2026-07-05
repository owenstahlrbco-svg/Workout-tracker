import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarView from '@/components/CalendarView'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: workouts } = await supabase
    .from('workouts')
    .select('*, workout_sets(*)')
    .eq('user_id', user.id)

  const { data: programDays } = await supabase
    .from('program_days')
    .select('*, programs!inner(user_id)')
    .eq('programs.user_id', user.id)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Calendar</h1>
        <p className="text-zinc-400 mt-1">View your workouts and program schedule.</p>
      </div>
      <CalendarView workouts={workouts ?? []} programDays={programDays ?? []} />
    </div>
  )
}
