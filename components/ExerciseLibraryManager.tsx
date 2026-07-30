'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Search, AlertCircle } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  category: string
}

interface Props {
  exercises: Exercise[]
  loggedNotInLibrary: string[]
}

const inputClass = "bg-white border border-emerald-900/15 rounded-xl px-4 py-2.5 text-emerald-950 placeholder-emerald-950/35 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-shadow duration-200 focus:shadow-md"

export default function ExerciseLibraryManager({ exercises: initial, loggedNotInLibrary }: Props) {
  const [exercises, setExercises] = useState(initial)
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const addFormRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const categories = [...new Set(exercises.map(e => e.category))].sort()

  const q = search.trim().toLowerCase()
  const filtered = q
    ? exercises.filter(e => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
    : exercises

  const grouped = [...new Set(filtered.map(e => e.category))].sort().map(cat => ({
    category: cat,
    items: filtered.filter(e => e.category === cat).sort((a, b) => a.name.localeCompare(b.name)),
  }))

  const missing = loggedNotInLibrary.filter(
    name => !exercises.some(e => e.name.toLowerCase() === name.toLowerCase())
  )

  async function addExercise() {
    const name = newName.trim()
    const category = (newCategory === '__custom__' ? customCategory : newCategory).trim()
    if (!name) { setError('Enter an exercise name.'); return }
    if (!category) { setError('Pick or create a category.'); return }
    if (exercises.some(e => e.name.toLowerCase() === name.toLowerCase())) {
      setError(`“${name}” is already in the library.`)
      return
    }
    setSaving(true)
    setError('')
    const { data, error: iErr } = await supabase
      .from('exercises')
      .insert({ name, category })
      .select()
      .single()
    setSaving(false)
    if (iErr || !data) { setError(iErr?.message ?? 'Failed to add'); return }
    setExercises([...exercises, data])
    setNewName('')
    router.refresh()
  }

  async function deleteExercise(ex: Exercise) {
    if (!window.confirm(`Remove “${ex.name}” from the library? Past logged workouts keep it — it just won’t appear in search anymore.`)) return
    const { error: dErr } = await supabase.from('exercises').delete().eq('id', ex.id)
    if (dErr) { setError(dErr.message); return }
    setExercises(exercises.filter(e => e.id !== ex.id))
    router.refresh()
  }

  function quickAdd(name: string) {
    setNewName(name)
    setError('')
    addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm animate-rise-in">{error}</div>
      )}

      {/* Logged by clients but missing from the library */}
      {missing.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 animate-rise-in">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={16} className="text-amber-600" />
            <h2 className="font-display text-lg font-semibold text-emerald-950">
              Logged by clients, but not in your library
            </h2>
          </div>
          <p className="text-emerald-950/55 text-xs mb-3">
            Clients typed these as custom exercises. Tap one to fill the add form below — pick a category and it&apos;s in.
          </p>
          <div className="flex flex-wrap gap-2">
            {missing.map(name => (
              <button
                key={name}
                onClick={() => quickAdd(name)}
                className="flex items-center gap-1.5 bg-white border border-amber-300 hover:border-emerald-700/50 text-emerald-950 text-sm rounded-full px-3.5 py-1.5 press"
              >
                <Plus size={13} className="text-emerald-700" /> {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add exercise */}
      <div ref={addFormRef} className="bg-white border border-emerald-900/10 rounded-3xl p-5">
        <h2 className="font-display text-lg font-semibold text-emerald-950 mb-3">Add an Exercise</h2>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Exercise name, e.g. Zercher Squat"
            className={`${inputClass} flex-1 min-w-[220px]`}
          />
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className={`${inputClass} min-w-[180px]`}
          >
            <option value="">Category...</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="__custom__">+ New category</option>
          </select>
          {newCategory === '__custom__' && (
            <input
              type="text"
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
              placeholder="New category name"
              className={`${inputClass} min-w-[180px] animate-rise-in`}
            />
          )}
          <button
            onClick={addExercise}
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 hover:shadow-lg hover:shadow-emerald-900/20 text-white font-semibold rounded-xl px-5 py-2.5 press"
          >
            <Plus size={16} /> {saving ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-3.5 text-emerald-950/35" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${exercises.length} exercises...`}
          className={`${inputClass} w-full pl-11`}
        />
      </div>

      {/* Grouped list */}
      {grouped.map(({ category, items }) => (
        <div key={category} className="bg-white border border-emerald-900/10 rounded-3xl overflow-hidden animate-rise-in">
          <div className="px-5 py-3 border-b border-emerald-900/10 bg-emerald-50/60 flex items-center justify-between">
            <h3 className="font-semibold text-emerald-950 text-sm">{category}</h3>
            <span className="text-emerald-950/45 text-xs font-medium">{items.length}</span>
          </div>
          <div className="divide-y divide-emerald-900/10">
            {items.map(ex => (
              <div key={ex.id} className="flex items-center justify-between px-5 py-2.5 group transition-colors duration-200 hover:bg-emerald-50/60">
                <span className="text-emerald-950/80 text-sm">{ex.name}</span>
                <button
                  onClick={() => deleteExercise(ex)}
                  className="text-emerald-950/0 group-hover:text-emerald-950/30 hover:!text-red-500 press"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="bg-white border border-emerald-900/10 rounded-3xl p-10 text-center text-emerald-950/50 text-sm animate-rise-in">
          No exercises match &ldquo;{search}&rdquo; — add it above.
        </div>
      )}
    </div>
  )
}
