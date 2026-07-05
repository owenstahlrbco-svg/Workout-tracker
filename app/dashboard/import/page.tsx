'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Plus, Trash2, Save, ChevronDown } from 'lucide-react'
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
  }, [success])

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
    if (!title.trim()) { setError('Give your program a title.'); setSaving(false); return }

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

    setSuccess(true)
    setTitle('')
    setRawText('')
    setDays([])
    setStep('input')
    setSaving(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  async function deleteProgram(id: string) {
    await supabase.from('programs').delete().eq('id', id)
    setPrograms(programs.filter(p => p.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Import Program</h1>
        <p className="text-zinc-400 mt-1">Paste your program from Google Docs or anywhere else.</p>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400">
          Program saved! It will appear on your calendar.
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {step === 'input' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Program Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 4 — Strength Block"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Paste Program Content
            </label>
            <p className="text-zinc-500 text-xs mb-2">
              Open your Google Doc → Select All → Copy → Paste here.
            </p>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={12}
              placeholder="Paste your program here..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={parseIntoWeek}
              disabled={!rawText.trim()}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-semibold rounded-lg px-5 py-2.5 transition-colors"
            >
              <FileText size={16} /> Parse into Days
            </button>
            <button
              onClick={async () => {
                if (!title.trim() || !rawText.trim()) { setError('Add a title and content first.'); return }
                setSaving(true)
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                await supabase.from('programs').insert({ user_id: user.id, title, content: rawText })
                setSuccess(true)
                setTitle('')
                setRawText('')
                setSaving(false)
                setTimeout(() => setSuccess(false), 3000)
              }}
              disabled={saving || !rawText.trim()}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 font-medium rounded-lg px-5 py-2.5 transition-colors"
            >
              <Save size={16} /> Save as-is
            </button>
          </div>
        </div>
      )}

      {step === 'assign' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Assign Days to Calendar</h2>
              <button
                onClick={() => setStep('input')}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
            <p className="text-zinc-400 text-sm">
              We split your program into {days.length} days. Adjust dates and content as needed.
            </p>
          </div>

          {days.map((day, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 font-medium text-sm">Day {i + 1}</span>
                <button onClick={() => removeDay(i)} className="text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
              <input
                type="date"
                value={day.date}
                onChange={(e) => updateDay(i, 'date', e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
              <textarea
                value={day.content}
                onChange={(e) => updateDay(i, 'content', e.target.value)}
                rows={4}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm resize-none"
              />
            </div>
          ))}

          <div className="flex gap-3">
            <button
              onClick={() => setDays([...days, { date: format(new Date(), 'yyyy-MM-dd'), content: '' }])}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg px-4 py-2.5 text-sm transition-colors"
            >
              <Plus size={15} /> Add Day
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg px-6 py-2.5 transition-colors"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save to Calendar'}
            </button>
          </div>
        </div>
      )}

      {/* Saved programs */}
      {programs.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800">
            <h2 className="font-semibold text-white">Saved Programs</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            {programs.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-white text-sm font-medium">{p.title}</p>
                  <p className="text-zinc-500 text-xs">{format(new Date(p.created_at), 'MMM d, yyyy')}</p>
                </div>
                <button
                  onClick={() => deleteProgram(p.id)}
                  className="text-zinc-600 hover:text-red-400 transition-colors"
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
