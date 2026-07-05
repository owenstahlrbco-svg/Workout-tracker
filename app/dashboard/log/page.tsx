'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

interface ExerciseRow {
  id: string
  exercise_name: string
  sets: string
  reps: string
  weight: string
  unit: string
  notes: string
}

const COMMON_EXERCISES = [
  'Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Barbell Row',
  'Pull Up', 'Dip', 'Incline Bench Press', 'Romanian Deadlift', 'Leg Press',
  'Lat Pulldown', 'Cable Row', 'Dumbbell Curl', 'Tricep Pushdown',
  'Leg Curl', 'Leg Extension', 'Hip Thrust', 'Face Pull', 'Lateral Raise',
]

function newRow(): ExerciseRow {
  return { id: crypto.randomUUID(), exercise_name: '', sets: '', reps: '', weight: '', unit: 'lbs', notes: '' }
}

export default function LogWorkoutPage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<ExerciseRow[]>([newRow()])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function updateRow(id: string, field: keyof ExerciseRow, value: string) {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  function removeRow(id: string) {
    if (rows.length === 1) return
    setRows(rows.filter(r => r.id !== id))
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setSaving(false); return }

    const validRows = rows.filter(r => r.exercise_name.trim())
    if (validRows.length === 0) { setError('Add at least one exercise.'); setSaving(false); return }

    const { data: workout, error: wErr } = await supabase
      .from('workouts')
      .insert({ user_id: user.id, date, notes })
      .select()
      .single()

    if (wErr || !workout) { setError(wErr?.message ?? 'Failed to save workout'); setSaving(false); return }

    const sets = validRows.map(r => ({
      workout_id: workout.id,
      exercise_name: r.exercise_name,
      sets: parseInt(r.sets) || 0,
      reps: parseInt(r.reps) || 0,
      weight: parseFloat(r.weight) || 0,
      unit: r.unit,
      notes: r.notes,
    }))

    const { error: sErr } = await supabase.from('workout_sets').insert(sets)
    if (sErr) { setError(sErr.message); setSaving(false); return }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Log Workout</h1>
        <p className="text-zinc-400 mt-1">Record your exercises, sets, reps, and weight.</p>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400">
          Workout saved! Redirecting...
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Session Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. felt strong today"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-semibold text-white">Exercises</h2>
          <button
            onClick={() => setRows([...rows, newRow()])}
            className="flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 transition-colors"
          >
            <Plus size={16} /> Add Exercise
          </button>
        </div>

        <div className="divide-y divide-zinc-800">
          {rows.map((row, i) => (
            <div key={row.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm font-medium">Exercise {i + 1}</span>
                <button
                  onClick={() => removeRow(row.id)}
                  className="text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    list={`exercises-${row.id}`}
                    value={row.exercise_name}
                    onChange={(e) => updateRow(row.id, 'exercise_name', e.target.value)}
                    placeholder="Exercise name"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <datalist id={`exercises-${row.id}`}>
                    {COMMON_EXERCISES.map(ex => <option key={ex} value={ex} />)}
                  </datalist>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="number"
                    value={row.sets}
                    onChange={(e) => updateRow(row.id, 'sets', e.target.value)}
                    placeholder="Sets"
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <input
                    type="number"
                    value={row.reps}
                    onChange={(e) => updateRow(row.id, 'reps', e.target.value)}
                    placeholder="Reps"
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <input
                    type="number"
                    value={row.weight}
                    onChange={(e) => updateRow(row.id, 'weight', e.target.value)}
                    placeholder="Weight"
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <div className="relative">
                    <select
                      value={row.unit}
                      onChange={(e) => updateRow(row.id, 'unit', e.target.value)}
                      className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    >
                      <option value="lbs">lbs</option>
                      <option value="kg">kg</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-3.5 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <input
                type="text"
                value={row.notes}
                onChange={(e) => updateRow(row.id, 'notes', e.target.value)}
                placeholder="Notes (optional, e.g. paused reps, tempo)"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg px-6 py-2.5 transition-colors"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Workout'}
        </button>
        <button
          onClick={() => setRows([...rows, newRow()])}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg px-4 py-2.5 transition-colors"
        >
          <Plus size={16} /> Add Exercise
        </button>
      </div>
    </div>
  )
}
