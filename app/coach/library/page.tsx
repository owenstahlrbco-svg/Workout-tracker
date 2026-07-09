import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExerciseLibraryManager from '@/components/ExerciseLibraryManager'

export default async function ExerciseLibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: exercises }, { data: loggedNames }] = await Promise.all([
    supabase.from('exercises').select('id, name, category').order('category').order('name'),
    supabase.from('workout_sets').select('exercise_name'),
  ])

  const libraryNames = new Set((exercises ?? []).map(e => e.name.toLowerCase()))
  const loggedNotInLibrary = [...new Set(
    (loggedNames ?? [])
      .map(s => s.exercise_name?.trim())
      .filter((n): n is string => !!n && !libraryNames.has(n.toLowerCase()))
  )].sort()

  const categoryCount = new Set((exercises ?? []).map(e => e.category)).size

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Coach HQ</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1">Exercise Library</h1>
        <p className="text-emerald-950/55 mt-2">
          {exercises?.length ?? 0} exercises across {categoryCount} categories — this is what your clients
          see when they search while logging a workout.
        </p>
      </div>

      <ExerciseLibraryManager
        exercises={exercises ?? []}
        loggedNotInLibrary={loggedNotInLibrary}
      />
    </div>
  )
}
