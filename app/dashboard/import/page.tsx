'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, Plus, Trash2, Save, Lightbulb, Repeat, CalendarDays, Check } from 'lucide-react'
import { format, addDays, addWeeks, differenceInCalendarDays } from 'date-fns'
import { parseDate } from '@/lib/dates'

interface ProgramDay {
  date: string
  label: string
  content: string
  weekdays: number[]
}

interface SavedProgram {
  id: string
  title: string
  created_at: string
}

interface PlanDayRow {
  program_id: string
  date: string
  content: string
}

const inputClass = "w-full bg-white border border-emerald-900/15 rounded-xl px-4 py-2.5 text-emerald-950 placeholder-emerald-950/35 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-shadow duration-200 focus:shadow-md"

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// A line counts as a day heading when it starts with "Day X" or a weekday
// name (after stripping bullets/markdown), and isn't a long sentence.
function isDayHeading(line: string): boolean {
  const l = line.trim().replace(/^[#*\-•>\s]+/, '')
  if (l.length === 0 || l.length > 60) return false
  return /^(day\s*[a-z0-9]+|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(l)
}

function firstOnOrAfter(start: Date, weekday: number): Date {
  const d = new Date(start)
  d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7))
  return d
}

export default function ImportPage() {
  const [title, setTitle] = useState('')
  const [rawText, setRawText] = useState('')
  const [days, setDays] = useState<ProgramDay[]>([])
  const [intro, setIntro] = useState('')
  const [usedFallback, setUsedFallback] = useState(false)
  const [step, setStep] = useState<'input' | 'assign'>('input')
  const [mode, setMode] = useState<'weekly' | 'exact'>('weekly')
  const [weeks, setWeeks] = useState(8)
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [programs, setPrograms] = useState<SavedProgram[]>([])
  const [planDays, setPlanDays] = useState<PlanDayRow[]>([])
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set())
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data }, { data: dayRows }, { data: workoutRows }] = await Promise.all([
        supabase
          .from('programs')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('program_days')
          .select('program_id, date, content, programs!inner(user_id)')
          .eq('programs.user_id', user.id)
          .order('date', { ascending: true }),
        supabase
          .from('workouts')
          .select('date')
          .eq('user_id', user.id),
      ])
      setPrograms(data ?? [])
      setPlanDays((dayRows ?? []).map(d => ({ program_id: d.program_id, date: d.date, content: d.content })))
      setWorkoutDates(new Set((workoutRows ?? []).map(w => w.date)))
    }
    load()
  }, [success]) // eslint-disable-line react-hooks/exhaustive-deps

  function parseIntoDays() {
    if (!rawText.trim()) return
    const lines = rawText.split('\n').map(l => l.replace(/\s+$/, '')).filter(l => l.trim())

    // Split on day headings: everything before the first heading is intro,
    // each heading starts a new day block.
    const blocks: { label: string; lines: string[] }[] = []
    const introLines: string[] = []
    for (const line of lines) {
      if (isDayHeading(line)) {
        blocks.push({ label: line.trim().replace(/^[#*\-•>\s]+/, ''), lines: [line.trim()] })
      } else if (blocks.length === 0) {
        introLines.push(line)
      } else {
        blocks[blocks.length - 1].lines.push(line)
      }
    }

    const today = new Date()

    if (blocks.length > 0) {
      setUsedFallback(false)
      setIntro(introLines.join('\n'))
      setDays(blocks.map((b, i) => ({
        date: format(addDays(today, i), 'yyyy-MM-dd'),
        label: b.label,
        content: b.lines.join('\n'),
        weekdays: [],
      })))
    } else {
      // No "Day A" / weekday headings found — fall back to an even split.
      setUsedFallback(true)
      setIntro('')
      const chunkSize = Math.ceil(lines.length / 5)
      setDays(Array.from({ length: 5 }, (_, i) => ({
        date: format(addDays(today, i), 'yyyy-MM-dd'),
        label: `Day ${i + 1}`,
        content: lines.slice(i * chunkSize, (i + 1) * chunkSize).join('\n'),
        weekdays: [],
      })).filter(d => d.content.trim()))
    }
    setStep('assign')
  }

  function updateDay(index: number, field: 'date' | 'content', value: string) {
    setDays(days.map((d, i) => i === index ? { ...d, [field]: value } : d))
  }

  function toggleWeekday(index: number, weekday: number) {
    setDays(days.map((d, i) => {
      if (i !== index) return d
      const has = d.weekdays.includes(weekday)
      return { ...d, weekdays: has ? d.weekdays.filter(w => w !== weekday) : [...d.weekdays, weekday].sort() }
    }))
  }

  function removeDay(index: number) {
    setDays(days.filter((_, i) => i !== index))
  }

  // Expand the weekly schedule into concrete calendar entries.
  function weeklyEntries(): { date: string; content: string }[] {
    const entries: { date: string; content: string }[] = []
    const start = parseDate(startDate)
    for (const day of days) {
      if (!day.content.trim()) continue
      for (const wd of day.weekdays) {
        const first = firstOnOrAfter(start, wd)
        for (let w = 0; w < weeks; w++) {
          entries.push({ date: format(addWeeks(first, w), 'yyyy-MM-dd'), content: day.content })
        }
      }
    }
    return entries.sort((a, b) => a.date.localeCompare(b.date))
  }

  const preview = mode === 'weekly' ? weeklyEntries() : []
  const anyWeekdaySelected = days.some(d => d.weekdays.length > 0)

  // Plans in Progress — the current-block card + day checklist from the demo,
  // driven by this athlete's real programs, scheduled days, and logged workouts.
  const plansInProgress = programs
    .map(p => {
      const scheduled = planDays.filter(d => d.program_id === p.id)
      if (scheduled.length === 0) return null
      const first = parseDate(scheduled[0].date)
      const last = parseDate(scheduled[scheduled.length - 1].date)
      const today = new Date()
      if (differenceInCalendarDays(today, last) > 0) return null // block already finished
      const totalWeeks = Math.max(1, Math.ceil((differenceInCalendarDays(last, first) + 1) / 7))
      const currentWeek = Math.min(totalWeeks, Math.max(1, Math.floor(differenceInCalendarDays(today, first) / 7) + 1))
      const completed = scheduled.filter(d => workoutDates.has(d.date)).length
      const pct = Math.round((completed / scheduled.length) * 100)
      const weekStart = addDays(first, (currentWeek - 1) * 7)
      const weekEnd = addDays(weekStart, 6)

      // One card per unique training day (Day A / Day B / Monday…); a day is
      // checked off when a workout was logged on its date this program week.
      const templates: { label: string; exercises: string[]; done: boolean }[] = []
      const seen = new Map<string, number>()
      for (const d of scheduled) {
        const lines = d.content.split('\n').map(l => l.trim()).filter(Boolean)
        const hasHeading = lines.length > 0 && isDayHeading(lines[0])
        const label = hasHeading ? lines[0] : 'Session'
        const exercises = hasHeading ? lines.slice(1) : lines
        const dDate = parseDate(d.date)
        const inWeek = differenceInCalendarDays(dDate, weekStart) >= 0 && differenceInCalendarDays(weekEnd, dDate) >= 0
        const done = inWeek && workoutDates.has(d.date)
        const idx = seen.get(label)
        if (idx === undefined) {
          seen.set(label, templates.length)
          templates.push({ label, exercises, done })
        } else if (done) {
          templates[idx].done = true
        }
      }
      return { id: p.id, title: p.title, totalWeeks, currentWeek, pct, templates }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)

  async function handleSave() {
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setSaving(false); return }
    if (!title.trim()) { setError('Give your plan a title.'); setSaving(false); return }

    const entries = mode === 'weekly'
      ? weeklyEntries()
      : days.filter(d => d.content.trim()).map(d => ({ date: d.date, content: d.content }))

    if (mode === 'weekly' && entries.length === 0) {
      setError('Pick at least one weekday for one of your training days.')
      setSaving(false)
      return
    }

    const { data: program, error: pErr } = await supabase
      .from('programs')
      .insert({ user_id: user.id, title, content: rawText })
      .select()
      .single()

    if (pErr || !program) { setError(pErr?.message ?? 'Failed to save'); setSaving(false); return }

    if (entries.length > 0) {
      const { error: dErr } = await supabase.from('program_days').insert(
        entries.map(d => ({ program_id: program.id, date: d.date, content: d.content }))
      )
      if (dErr) { setError(dErr.message); setSaving(false); return }
    }

    // Show the result where it matters — on the calendar
    router.push('/dashboard/calendar')
  }

  async function deleteProgram(id: string, programTitle: string) {
    if (!window.confirm(`Delete “${programTitle}”? This also removes all of its workout days from your calendar.`)) return
    const { error: dErr } = await supabase.from('programs').delete().eq('id', id)
    if (dErr) { setError(dErr.message); return }
    setPrograms(programs.filter(p => p.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Plan &amp; Progress</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1 flex items-center gap-2.5">
          <FileText size={28} className="text-emerald-700" /> My Plans
        </h1>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800">
          Plan saved to your Saved Plans below. To get workouts onto your calendar, use &ldquo;Split into Days&rdquo;.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}

      {step === 'input' && (
        <>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex gap-3">
            <Lightbulb size={18} className="text-emerald-700 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-900">
              <p className="font-semibold">How to format your doc so days split perfectly</p>
              <p className="mt-1 text-emerald-900/80">
                Start each training day on its own line: <span className="font-semibold">Day A</span>,{' '}
                <span className="font-semibold">Day B</span>, <span className="font-semibold">Day 1</span>, or a weekday
                like <span className="font-semibold">Monday</span>. Everything under that line belongs to that day.
                Intro text before your first day is set aside automatically — it won&apos;t be scheduled as a workout.
              </p>
            </div>
          </div>

          <div className="bg-white border border-emerald-900/10 rounded-3xl p-6 space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-emerald-950">Import a Plan</h2>
              <p className="text-emerald-950/55 text-sm mt-1">
                Paste a program from Owen or the Skool community — choose which days you train and the
                dashboard builds your calendar automatically.
              </p>
            </div>
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
                Open your Google Doc → Select All → Copy → Paste here.
              </p>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={12}
                placeholder={"My 3-Day Strength Plan\nWelcome! Here's how the block works...\n\nDay A\nBack Squat 5x5\nBench Press 3x8\n\nDay B\nDeadlift 5x3\nPull-ups 4x8\n\nDay C\nOverhead Press 5x5\nRows 4x10"}
                className={`${inputClass} py-3 font-mono text-sm resize-none`}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={parseIntoDays}
                disabled={!rawText.trim()}
                className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/20 disabled:opacity-40 text-white font-semibold rounded-xl px-5 py-2.5 press"
              >
                <FileText size={16} /> Split into Days
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
                className="flex items-center gap-2 bg-white border border-emerald-900/15 hover:border-emerald-700/40 hover:shadow-md disabled:opacity-40 text-emerald-950 font-medium rounded-xl px-5 py-2.5 transition-colors"
              >
                <Save size={16} /> Save as-is
              </button>
            </div>
          </div>
        </>
      )}

      {step === 'assign' && (
        <div className="space-y-4">
          <div className="bg-white border border-emerald-900/10 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-emerald-950">Build Your Schedule</h2>
              <button
                onClick={() => setStep('input')}
                className="text-sm text-emerald-950/55 hover:text-emerald-950 press inline-block"
              >
                ← Back
              </button>
            </div>
            <p className="text-emerald-950/55 text-sm">
              {usedFallback
                ? <>We couldn&apos;t find day headings like &ldquo;Day A&rdquo; in your doc, so we split it evenly — check each day and fix anything that landed wrong, or go back and add headings.</>
                : <>We found {days.length} training {days.length === 1 ? 'day' : 'days'} in your plan.</>}
            </p>

            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('weekly')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold press ${
                  mode === 'weekly' ? 'bg-emerald-800 text-white' : 'bg-emerald-900/5 text-emerald-950/60 hover:bg-emerald-900/10'
                }`}
              >
                <Repeat size={15} /> Repeat Weekly
              </button>
              <button
                onClick={() => setMode('exact')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold press ${
                  mode === 'exact' ? 'bg-emerald-800 text-white' : 'bg-emerald-900/5 text-emerald-950/60 hover:bg-emerald-900/10'
                }`}
              >
                <CalendarDays size={15} /> Pick Exact Dates
              </button>
            </div>

            {mode === 'weekly' && (
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-xs font-medium text-emerald-950/60 mb-1">Starting from</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="bg-white border border-emerald-900/15 rounded-xl px-4 py-2 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-emerald-950/60 mb-1">Repeat for</label>
                  <select
                    value={weeks}
                    onChange={e => setWeeks(Number(e.target.value))}
                    className="bg-white border border-emerald-900/15 rounded-xl px-4 py-2 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'week' : 'weeks'}</option>
                    ))}
                  </select>
                </div>
                <p className="text-emerald-950/55 text-sm pb-2">
                  {anyWeekdaySelected
                    ? <><span className="font-semibold text-emerald-950">{preview.length} workouts</span> will be placed on your calendar
                        {preview.length > 0 && <> — {format(parseDate(preview[0].date), 'MMM d')} through {format(parseDate(preview[preview.length - 1].date), 'MMM d, yyyy')}</>}</>
                    : 'Tap the weekdays you train under each day below.'}
                </p>
              </div>
            )}
          </div>

          {intro && (
            <div className="bg-emerald-900/5 border border-emerald-900/10 rounded-3xl p-5">
              <p className="text-emerald-950/60 text-xs font-semibold uppercase tracking-wider mb-2">
                Set aside — intro / notes (won&apos;t be scheduled)
              </p>
              <p className="text-emerald-950/60 text-sm whitespace-pre-wrap line-clamp-4">{intro}</p>
            </div>
          )}

          {days.map((day, i) => (
            <div key={i} className="bg-white border border-emerald-900/10 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-emerald-950 font-semibold text-sm">{day.label || `Day ${i + 1}`}</span>
                <button onClick={() => removeDay(i)} className="text-emerald-950/30 hover:text-red-500 press">
                  <Trash2 size={15} />
                </button>
              </div>

              {mode === 'weekly' ? (
                <div>
                  <p className="text-xs font-medium text-emerald-950/60 mb-1.5">Train this on:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map((label, wd) => (
                      <button
                        key={wd}
                        onClick={() => toggleWeekday(i, wd)}
                        className={`w-11 py-2 rounded-xl text-xs font-semibold press ${
                          day.weekdays.includes(wd)
                            ? 'bg-emerald-800 text-white'
                            : 'bg-emerald-900/5 text-emerald-950/60 hover:bg-emerald-900/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {day.weekdays.length === 0 && (
                    <p className="text-emerald-950/40 text-xs mt-1.5">No weekday picked — this day won&apos;t be scheduled.</p>
                  )}
                </div>
              ) : (
                <input
                  type="date"
                  value={day.date}
                  onChange={(e) => updateDay(i, 'date', e.target.value)}
                  className="bg-white border border-emerald-900/15 rounded-xl px-4 py-2 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
              )}

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
              onClick={() => setDays([...days, { date: format(new Date(), 'yyyy-MM-dd'), label: `Day ${days.length + 1}`, content: '', weekdays: [] }])}
              className="flex items-center gap-2 bg-white border border-emerald-900/15 hover:border-emerald-700/40 hover:shadow-md text-emerald-950 rounded-xl px-4 py-2.5 text-sm transition-colors"
            >
              <Plus size={15} /> Add Another Day
            </button>
            <button
              onClick={handleSave}
              disabled={saving || (mode === 'weekly' && !anyWeekdaySelected)}
              className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/20 disabled:opacity-50 text-white font-semibold rounded-xl px-6 py-2.5 transition-colors"
            >
              <Save size={16} />
              {saving
                ? 'Saving...'
                : mode === 'weekly' && preview.length > 0
                ? `Save ${preview.length} Workouts to Calendar`
                : 'Save to Calendar'}
            </button>
          </div>
          <p className="text-emerald-950/45 text-xs">
            Nothing is on your calendar until you press <span className="font-semibold text-emerald-950/70">Save to Calendar</span>.
          </p>
        </div>
      )}

      {/* Plans in Progress — mirrors the demo dashboard's My Plans view */}
      {step === 'input' && plansInProgress.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-emerald-950">Plans in Progress</h2>
          {plansInProgress.map(plan => (
            <div key={plan.id} className="space-y-3">
              <div className="bg-white border border-emerald-900/10 rounded-3xl p-5 md:p-6">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">{plan.title}</p>
                    <h3 className="font-display text-2xl font-semibold text-emerald-950 mt-0.5">
                      Week {plan.currentWeek} of {plan.totalWeeks}
                    </h3>
                  </div>
                  <span className="text-sm font-semibold text-emerald-950/55">{plan.pct}% complete</span>
                </div>
                <div className="h-2 rounded-full bg-emerald-900/10 mt-4 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${plan.pct}%` }} />
                </div>
              </div>

              {plan.templates.map(({ label, exercises, done }) => (
                <div key={label} className="bg-white border border-emerald-900/10 hover:border-emerald-700/25 hover:shadow-[0_6px_22px_rgba(6,78,59,0.07)] rounded-2xl p-5 lift">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-500' : 'border border-emerald-900/15'}`}>
                      {done && <Check size={14} className="text-emerald-950" strokeWidth={3} />}
                    </div>
                    <h3 className="font-display text-lg font-semibold text-emerald-950">{label}</h3>
                    {done && <span className="ml-auto text-xs font-semibold text-emerald-700">Completed</span>}
                  </div>
                  {exercises.length > 0 && (
                    <div className="grid sm:grid-cols-2 gap-2 pl-9">
                      {exercises.slice(0, 8).map((e, i) => (
                        <p key={i} className="text-sm text-emerald-950/70 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 flex-shrink-0" />{e}
                        </p>
                      ))}
                      {exercises.length > 8 && (
                        <p className="text-sm text-emerald-950/45 pl-3.5">+{exercises.length - 8} more</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Saved programs */}
      {programs.length > 0 && (
        <div className="bg-white border border-emerald-900/10 rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-emerald-900/10">
            <h2 className="font-display text-lg font-semibold text-emerald-950">Saved Plans</h2>
            <p className="text-emerald-950/45 text-xs mt-0.5">
              Deleting a plan also removes its workout days from your calendar — the clean way to swap in a new program.
            </p>
          </div>
          <div className="divide-y divide-emerald-900/10">
            {programs.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-emerald-950 text-sm font-semibold">{p.title}</p>
                  <p className="text-emerald-950/45 text-xs">{format(new Date(p.created_at), 'MMM d, yyyy')}</p>
                </div>
                <button
                  onClick={() => deleteProgram(p.id, p.title)}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-950/40 hover:text-red-500 press"
                >
                  <Trash2 size={14} /> Delete plan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
