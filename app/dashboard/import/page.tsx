'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, Plus, Trash2, Save } from 'lucide-react'
import { format } from 'date-fns'

interface ProgramDay {
  date: string
  content: string
}

interface SavedProgram {
  id: string
  title: string
  created_at: string
}

const inputClass = "w-full bg-white border border-emerald-900/15 rounded-xl px-4 py-2.5 text-emerald-950 placeholder-emerald-950/35 focus:outline-none focus:ring-2 focus:ring-emerald-600"

export default function ImportPage() {
  const [title, setTitle] = useState('')
  const [rawText, setRawText] = useState('')
  const [days, setDays] = useState<ProgramDay[]>([])
  const [step, setStep] = useState<'input' | 'assign'>('input')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [programs, setPrograms] = useState<SavedProgram[]>([])
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('programs')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setPrograms(data ?? [])
    }
    load()
  }, [success]) // eslint-disable-line react-hooks/exhaustive-deps

  function parseIntoWeek() {
    if (!rawText.trim()) return
    const lines = rawText.split('\n').filter(l => l.trim())
    const chunkSize = Math.ceil(lines.length / 5)
    const parsed: ProgramDay[] = []
    const today = new Date()

    for (let i = 0; i < 5; i++) {
      const chunk = lines.slice(i * chunkSize, (i + 1) * chunkSize)
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      parsed.push({
        date: format(d, 'yyyy-MM-dd'),
        content: chunk.join('\n'),
      })
    }
    setDays(parsed)
    setStep('assign')
  }

  function updateDay(index: number, field: 'date' | 'content', value: string) {
    setDays(days.map((d, i) => i === index ? { ...d, [field]: value } : d))
  }

  function removeDay(index: number) {
    setDays(days.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setSaving(false); return }
    if (!title.trim()) { setError('Give your plan a title.'); setSaving(false); return }

    const { data: program, error: pErr } = await supabase
      .from('programs')
      .insert({ user_id: user.id, title, content: rawText })
      .select()
      .single()

    if (pErr || !program) { setError(pErr?.message ?? 'Failed to save'); setSaving(false); return }

    if (days.length > 0) {
      const { error: dErr } = await supabase.from('program_days').insert(
        days.filter(d => d.content.trim()).map(d => ({
          program_id: program.id,
          date: d.date,
          content: d.content,
        }))
      )
      if (dErr) { setError(dErr.message); setSaving(false); return }
    }

    // Show the result where it matters — on the calendar
    router.push('/dashboard/calendar')
  }

  async function deleteProgram(id: string) {
    await supabase.from('programs').delete().eq('id', id)
    setPrograms(programs.filter(p => p.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Your Plans</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1">Import a Plan</h1>
        <p className="text-emerald-950/55 mt-2">
          Got a Google Doc from Owen or the Skool community? Paste it here, place each workout on the
          day you want, and it shows up on your calendar automatically.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800">
          Plan saved to your Saved Plans below. To get workouts onto your calendar, use &ldquo;Place on Calendar Days&rdquo;.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}

      {step === 'input' && (
        <div className="bg-white border border-emerald-900/10 rounded-3xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-emerald-950 mb-1.5">Plan Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 4 — Strength Block"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-950 mb-1.5">
              Paste Plan Content
            </label>
            <p className="text-emerald-950/45 text-xs mb-2">
              Open your Google Doc → Select All → Copy → Paste here. Works with any plan from Owen or Skool.
            </p>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={12}
              placeholder="Paste your plan here..."
              className={`${inputClass} py-3 font-mono text-sm resize-none`}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={parseIntoWeek}
              disabled={!rawText.trim()}
              className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold rounded-xl px-5 py-2.5 transition-colors"
            >
              <FileText size={16} /> Place on Calendar Days
            </button>
            <button
              onClick={async () => {
                if (!title.trim() || !rawText.trim()) { setError('Add a title and content first.'); return }
                setSaving(true)
                setError('')
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) { setError('Not signed in'); setSaving(false); return }
                const { error: sErr } = await supabase.from('programs').insert({ user_id: user.id, title, content: rawText })
                setSaving(false)
                if (sErr) { setError(sErr.message); return }
                setSuccess(true)
                setTitle('')
                setRawText('')
                setTimeout(() => setSuccess(false), 3000)
              }}
              disabled={saving || !rawText.trim()}
              className="flex items-center gap-2 bg-white border border-emerald-900/15 hover:border-emerald-700/40 disabled:opacity-40 text-emerald-950 font-medium rounded-xl px-5 py-2.5 transition-colors"
            >
              <Save size={16} /> Save as-is
            </button>
          </div>
        </div>
      )}

      {step === 'assign' && (
        <div className="space-y-4">
          <div className="bg-white border border-emerald-900/10 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-emerald-950">Place Workouts on Days</h2>
              <button
                onClick={() => setStep('input')}
                className="text-sm text-emerald-950/55 hover:text-emerald-950 transition-colors"
              >
                ← Back
              </button>
            </div>
            <p className="text-emerald-950/55 text-sm">
              We split your plan into {days.length} days. Pick the exact date for each workout —
              they&apos;ll pop up on your calendar on those days.
            </p>
          </div>

          {days.map((day, i) => (
            <div key={i} className="bg-white border border-emerald-900/10 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-emerald-950/75 font-semibold text-sm">Day {i + 1}</span>
                <button onClick={() => removeDay(i)} className="text-emerald-950/30 hover:text-red-500 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
              <input
                type="date"
                value={day.date}
                onChange={(e) => updateDay(i, 'date', e.target.value)}
                className="bg-white border border-emerald-900/15 rounded-xl px-4 py-2 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              />
              <textarea
                value={day.content}
                onChange={(e) => updateDay(i, 'content', e.target.value)}
                rows={4}
                className={`${inputClass} py-3 font-mono text-sm resize-none`}
              />
            </div>
          ))}

          <div className="flex gap-3">
            <button
              onClick={() => setDays([...days, { date: format(new Date(), 'yyyy-MM-dd'), content: '' }])}
              className="flex items-center gap-2 bg-white border border-emerald-900/15 hover:border-emerald-700/40 text-emerald-950 rounded-xl px-4 py-2.5 text-sm transition-colors"
            >
              <Plus size={15} /> Add Another Day
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl px-6 py-2.5 transition-colors"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save to Calendar'}
            </button>
          </div>
          <p className="text-emerald-950/45 text-xs">
            Nothing is on your calendar until you press <span className="font-semibold text-emerald-950/70">Save to Calendar</span>.
          </p>
        </div>
      )}

      {/* Saved programs */}
      {programs.length > 0 && (
        <div className="bg-white border border-emerald-900/10 rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-emerald-900/10">
            <h2 className="font-display text-lg font-semibold text-emerald-950">Saved Plans</h2>
          </div>
          <div className="divide-y divide-emerald-900/10">
            {programs.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-emerald-950 text-sm font-semibold">{p.title}</p>
                  <p className="text-emerald-950/45 text-xs">{format(new Date(p.created_at), 'MMM d, yyyy')}</p>
                </div>
                <button
                  onClick={() => deleteProgram(p.id)}
                  className="text-emerald-950/30 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
