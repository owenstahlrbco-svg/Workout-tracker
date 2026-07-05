import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Users, ChevronRight, Dumbbell } from 'lucide-react'

export default async function CoachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: clients } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('full_name')

  const clientIds = clients?.map(c => c.id) ?? []

  const { data: recentWorkouts } = clientIds.length > 0
    ? await supabase
        .from('workouts')
        .select('*, workout_sets(*)')
        .in('user_id', clientIds)
        .order('date', { ascending: false })
        .limit(50)
    : { data: [] }

  function lastWorkoutFor(clientId: string) {
    return recentWorkouts?.find(w => w.user_id === clientId)
  }

  function workoutCountFor(clientId: string) {
    return recentWorkouts?.filter(w => w.user_id === clientId).length ?? 0
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">All Clients</h1>
        <p className="text-zinc-400 mt-1">{clients?.length ?? 0} clients total</p>
      </div>

      {clients && clients.length > 0 ? (
        <div className="space-y-3">
          {clients.map(client => {
            const last = lastWorkoutFor(client.id)
            const count = workoutCountFor(client.id)
            return (
              <Link
                key={client.id}
                href={`/coach/client/${client.id}`}
                className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {client.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{client.full_name ?? 'Unknown'}</p>
                  <p className="text-zinc-400 text-sm truncate">{client.email}</p>
                </div>
                <div className="text-right text-sm flex-shrink-0">
                  <p className="text-zinc-300">{count} workouts</p>
                  <p className="text-zinc-500 text-xs">
                    {last ? `Last: ${format(new Date(last.date), 'MMM d')}` : 'No workouts yet'}
                  </p>
                </div>
                <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <Users size={40} className="text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">No clients yet. When clients sign up, they'll appear here.</p>
        </div>
      )}

      {/* Recent activity across all clients */}
      {recentWorkouts && recentWorkouts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {recentWorkouts.slice(0, 10).map(workout => {
              const client = clients?.find(c => c.id === workout.user_id)
              return (
                <div key={workout.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                  <Dumbbell size={16} className="text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-white text-sm font-medium">{client?.full_name ?? 'Unknown'}</span>
                    <span className="text-zinc-500 text-sm"> logged a workout</span>
                  </div>
                  <span className="text-zinc-400 text-xs flex-shrink-0">
                    {format(new Date(workout.date), 'MMM d')}
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
