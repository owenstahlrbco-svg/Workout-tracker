export type Role = 'client' | 'coach'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  created_at: string
}

export interface Workout {
  id: string
  user_id: string
  date: string
  notes: string
  created_at: string
  workout_sets?: WorkoutSet[]
}

export interface WorkoutSet {
  id: string
  workout_id: string
  exercise_name: string
  sets: number
  reps: number
  weight: number
  unit: string
  notes: string
  created_at: string
}

export interface Program {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  program_days?: ProgramDay[]
}

export interface ProgramDay {
  id: string
  program_id: string
  date: string
  content: string
  created_at: string
}
