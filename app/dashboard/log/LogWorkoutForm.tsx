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

interface Exercise {
  name: string
  category: string
}

const inputClass = "w-full bg-white border border-emerald-900/15 rounded-xl px-4 py-2.5 text-emerald-950 placeholder-emerald-950/35 focus:outline-none focus:ring-2 focus:ring-emerald-600"

function newRow(): ExerciseRow {
  return { id: crypto.randomUUID(), exercise_name: '', sets: '', reps: '', weight: '', unit: 'lbs', notes: '' }
}

function ExerciseInput({ value, onChange, exercises }: {
  value: string
  onChange: (val: string) => void
  exercises: Exercise[]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)

  const filtered = query.trim().length === 0
    ? exercises
    : exercises.filter(e => e.name.toLowerCase().includes(query.toLowerCase()))

  const categories = [...new Set(filtered.map(e => e.category))]

  function select(name: string) {
    setQuery(name)
    onChange(name)
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        placeholder="Tap to search exercises..."
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onChange={e => {
          setQuery(e.target.value)
          onChange(e.target.value)
          setOpen(true)
        }}
        className={inputClass}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-emerald-900/15 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {categories.map(cat => (
            <div key={cat}>
              <div className="px-3 py-1.5 text-xs font-semibold text-emerald-700 uppercase tracking-wide bg-emerald-50 sticky top-0">
                {cat}
              </div>
              {filtered.filter(e => e.category === cat).map(e => (
                <button
                  key={e.name}
                  type="button"
                  onMouseDown={ev => { ev.preventDefault(); select(e.name) }}
                  onTouchEnd={ev => { ev.preventDefault(); select(e.name) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-emerald-950 hover:bg-emerald-50 active:bg-emerald-100 transition-colors"
                >
                  {e.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LogWorkoutForm({ exercises }: { exercises: Exercise[] }) {
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
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Tracker</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1">Log Workout</h1>
        <p className="text-emerald-950/55 mt-2">Record your exercises, sets, reps, and weight.</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800">
          Workout saved! Redirecting...
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border border-emerald-900/10 rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-emerald-950 mb-1.5">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-emerald-950 mb-1.5">Session Notes (optional)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. felt strong today" className={inputClass} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-emerald-900/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-emerald-900/10 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-emerald-950">Exercises</h2>
          <p className="text-emerald-950/45 text-xs">{exercises.length} exercises available</p>
        </div>

        <div className="divide-y divide-emerald-900/10">
          {rows.map((row, i) => (
            <div key={row.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-emerald-950/55 text-sm font-medium">Exercise {i + 1}</span>
                <button onClick={() => removeRow(row.id)} className="text-emerald-950/30 hover:text-red-500 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ExerciseInput
                  value={row.exercise_name}
                  onChange={(val) => updateRow(row.id, 'exercise_name', val)}
                  exercises={exercises}
                />

                <div className="grid grid-cols-4 gap-2">
                  <input type="number" value={row.sets} onChange={(e) => updateRow(row.id, 'sets', e.target.value)}
                    placeholder="Sets" className={`${inputClass} px-3 text-sm`} />
                  <input type="number" value={row.reps} onChange={(e) => updateRow(row.id, 'reps', e.target.value)}
                    placeholder="Reps" className={`${inputClass} px-3 text-sm`} />
                  <input type="number" value={row.weight} onChange={(e) => updateRow(row.id, 'weight', e.target.value)}
                    placeholder="Weight" className={`${inputClass} px-3 text-sm`} />
                  <div className="relative">
                    <select
                      value={row.unit}
                      onChange={(e) => updateRow(row.id, 'unit', e.target.value)}
                      className={`${inputClass} appearance-none px-3 text-sm`}
                    >
                      <option value="lbs">lbs</option>
                      <option value="kg">kg</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-3.5 text-emerald-950/40 pointer-events-none" />
                  </div>
                </div>
              </div>

              <input
                type="text"
                value={row.notes}
                onChange={(e) => updateRow(row.id, 'notes', e.target.value)}
                placeholder="Notes (optional, e.g. paused reps, tempo)"
                className={`${inputClass} py-2 text-sm`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl px-6 py-2.5 transition-colors"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Workout'}
        </button>
        <button
          onClick={() => setRows([...rows, newRow()])}
          className="flex items-center gap-2 bg-white border border-emerald-900/15 hover:border-emerald-700/40 text-emerald-950 font-medium rounded-xl px-4 py-2.5 transition-colors"
        >
          <Plus size={16} /> Add Exercise
        </button>
      </div>
    </div>
  )
}
