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
    .select('*, programs!inner(user_id, title)')
    .eq('programs.user_id', user.id)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Schedule</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1">Calendar</h1>
        <p className="text-emerald-950/55 mt-2">Your program and your logged sessions, side by side.</p>
      </div>
      <CalendarView workouts={workouts ?? []} programDays={programDays ?? []} />
    </div>
  )
}
