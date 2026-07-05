import { createClient } from '@/lib/supabase/server'
import LogWorkoutForm from './LogWorkoutForm'

export default async function LogWorkoutPage() {
  const supabase = await createClient()
  const { data: exercises } = await supabase
    .from('exercises')
    .select('name, category')
    .order('category')
    .order('name')

  return <LogWorkoutForm exercises={exercises ?? []} />
}
