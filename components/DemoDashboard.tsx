'use client'

/* =====================================================================
   DEMO DASHBOARD — a public, read-only preview of the Pitch HQ Dashboard.
   Built to MIRROR the real dashboard (same sidebar groups, daily quote,
   Today's Session, stats, "Where to go", recent workouts) with sample data.
   No auth, no real data. Every "Get full access" button → Skool.
   ===================================================================== */

import { useCallback, useEffect, useState } from 'react'
import {
  LayoutDashboard, CalendarDays, FileText, GraduationCap, Dumbbell, TrendingUp,
  Flame, Check, Mail, Phone, Star, Lock, ArrowRight, Sparkles, Trophy,
  MessageCircle, ChevronRight, Send, Plus, Languages, Menu, X,
} from 'lucide-react'
import { quoteForToday } from '@/lib/quotes'

// ✏️ EDIT: where every "Get full access" / join button points
const SKOOL_URL = 'https://www.skool.com/owens-group-9656/about'

type View = 'home' | 'log' | 'calendar' | 'plans' | 'progress' | 'coaches' | 'message'

const NAV_GROUPS: { title: string; items: { key: View; label: string; icon: React.ComponentType<{ size?: number }> }[] }[] = [
  { title: 'Train', items: [
    { key: 'home', label: 'Home', icon: LayoutDashboard },
    { key: 'log', label: 'Log Workout', icon: Dumbbell },
    { key: 'calendar', label: 'Calendar', icon: CalendarDays },
  ] },
  { title: 'Plan & Progress', items: [
    { key: 'plans', label: 'My Plans', icon: FileText },
    { key: 'progress', label: 'Progress', icon: TrendingUp },
  ] },
  { title: 'Recruiting', items: [
    { key: 'coaches', label: 'Coach Directory', icon: GraduationCap },
  ] },
  { title: 'Coach', items: [
    { key: 'message', label: 'Message Owen', icon: MessageCircle },
  ] },
]
// Matches the exit animation duration in globals.css (--dur-fast).
const EXIT_MS = 150

export default function DemoDashboard() {
  const [view, setView] = useState<View>('home')
  // Mirrors the real Navbar: `open` keeps the drawer mounted, `closing`
  // plays the slide-out before unmount.
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  const closeDrawer = useCallback(() => {
    setClosing(true)
    setTimeout(() => { setOpen(false); setClosing(false) }, EXIT_MS)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, closeDrawer])

  function pick(next: View) {
    setView(next)
    if (open) closeDrawer()
  }

  const navBtnCls = (active: boolean) =>
    `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium lift w-full text-left ${
      active ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100/70 hover:text-white hover:bg-white/10'
    }`

  // Shared by the desktop sidebar and the mobile drawer so the two can't drift.
  const navBody = (animated: boolean) => (
    <>
      <div className="px-6 pt-7 pb-6 border-b border-white/10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">Pitch HQ</p>
        <p className="font-display text-2xl font-semibold text-white mt-0.5">Dashboard</p>
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-400/15 text-emerald-300 px-2.5 py-1 rounded-full mt-3 inline-flex items-center gap-1.5">
          <Sparkles size={11} /> Demo preview
        </span>
      </div>

      <nav className={`flex-1 px-4 py-5 space-y-6 overflow-y-auto ${animated ? 'stagger' : ''}`}>
        {NAV_GROUPS.map(group => (
          <div key={group.title}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100/40">{group.title}</p>
            <div className="space-y-1">
              {group.items.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => pick(key)} className={navBtnCls(view === key)}>
                  {view !== key && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 opacity-0 rounded-r-full bg-emerald-400 transition-all duration-300 ease-out group-hover:h-4 group-hover:opacity-100"
                      aria-hidden
                    />
                  )}
                  <Icon size={17} /> {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        <p className="text-emerald-100/60 text-xs leading-relaxed px-1">
          This is a live preview. Unlock your own dashboard, plans, and the recruiting database inside The Pitch.
        </p>
        <a href={SKOOL_URL} target="_blank" rel="noopener noreferrer"
           className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-emerald-950 font-semibold px-4 py-3 text-sm press hover:bg-emerald-300">
          Get full access <ArrowRight size={15} />
        </a>
      </div>
    </>
  )

  return (
    <div className="md:flex md:h-screen bg-[#f5f8f5]">
      {/* ===== Desktop sidebar (mirrors the real dashboard chrome) ===== */}
      <aside className="hidden md:flex w-64 bg-emerald-950 text-white flex-col h-screen sticky top-0 flex-shrink-0">
        {navBody(false)}
      </aside>

      {/* ===== Mobile top bar — hamburger opens the drawer, as in the real app ===== */}
      <div className="md:hidden sticky top-0 z-30 bg-emerald-950 text-white">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="p-2 -ml-2 rounded-lg hover:bg-white/10 press"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-baseline gap-2">
              <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-emerald-400">Pitch HQ</span>
              <span className="font-display text-lg font-semibold">Dashboard</span>
            </div>
          </div>
          <a href={SKOOL_URL} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 text-emerald-950 font-semibold px-3 py-1.5 text-xs press">
            Get full access
          </a>
        </div>
      </div>

      {/* ===== Mobile drawer + backdrop ===== */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className={`absolute inset-0 bg-emerald-950/50 backdrop-blur-[2px] ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
            onClick={closeDrawer}
            aria-hidden
          />
          <aside
            className={`relative w-72 max-w-[82%] bg-emerald-950 text-white flex flex-col h-full shadow-2xl will-change-transform ${
              closing ? 'animate-slide-out-left' : 'animate-slide-in-left'
            }`}
          >
            <button
              onClick={closeDrawer}
              aria-label="Close menu"
              className="absolute top-4 right-4 z-10 p-2 rounded-lg text-emerald-100/70 hover:text-white hover:bg-white/10 press hover:rotate-90"
            >
              <X size={20} />
            </button>
            {navBody(!closing)}
          </aside>
        </div>
      )}

      {/* ===== Main ===== */}
      <main className="flex-1 overflow-y-auto pb-16">
        {/* Demo banner */}
        <div className="bg-emerald-900 text-white px-4 md:px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-emerald-50/90 flex items-center gap-2">
            <Sparkles size={15} className="text-emerald-300 flex-shrink-0" />
            You&apos;re exploring a <span className="font-semibold">live demo</span> — sample data only.
          </p>
          <a href={SKOOL_URL} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 text-emerald-950 font-semibold px-4 py-2 text-sm hover:bg-emerald-300 hover:shadow-lg press">
            Get full access <ArrowRight size={15} />
          </a>
        </div>

        {/* Re-keyed on the view so switching sections eases in, matching real navigation */}
        <div key={view} className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto animate-rise-in">
          {view === 'home' && <HomeView go={setView} />}
          {view === 'log' && <LogView />}
          {view === 'calendar' && <CalendarView />}
          {view === 'plans' && <PlansView />}
          {view === 'progress' && <ProgressView />}
          {view === 'coaches' && <CoachesView />}
          {view === 'message' && <MessageView />}
        </div>
      </main>
    </div>
  )
}

/* ---------------- Home (mirrors the real dashboard home) ---------------- */
function HomeView({ go }: { go: (v: View) => void }) {
  const quote = quoteForToday()
  const quick: { view: View; icon: React.ComponentType<{ size?: number; className?: string }>; label: string; desc: string }[] = [
    { view: 'log', icon: Dumbbell, label: 'Log a Workout', desc: "Record today's session — sets, reps, weight" },
    { view: 'progress', icon: TrendingUp, label: 'View Progress', desc: 'PRs and lift history over time' },
    { view: 'calendar', icon: CalendarDays, label: 'View Calendar', desc: 'Your program and logged sessions, day by day' },
    { view: 'plans', icon: FileText, label: 'Import a Plan', desc: 'Paste a Google Doc from Owen or Skool' },
    { view: 'message', icon: MessageCircle, label: 'Message Owen', desc: 'A direct line to your coach' },
  ]
  const recent: [string, number, string, string[]][] = [
    ['Monday, July 14', 6, '12,400 lbs', ['Back Squat', 'Romanian Deadlift', 'Walking Lunges', 'Leg Curl', 'Calf Raise']],
    ['Sunday, July 13', 5, '9,850 lbs', ['Overhead Press', 'Dips', 'Lateral Raises', 'Sprints']],
    ['Friday, July 11', 6, '13,120 lbs', ['Bench Press', 'Incline DB Press', 'Pull-ups', 'Cable Row']],
  ]
  return (
    <div className="space-y-8">
      {/* Quote of the day — identical to the real dashboard */}
      <div className="border-l-2 border-emerald-600/70 pl-5 py-1">
        <p className="font-display text-xl italic text-emerald-950/85 leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 mt-2">
          {quote.author}
          <span className="text-emerald-950/40 normal-case tracking-normal font-normal"> — {quote.title}</span>
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Wednesday, July 15</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1">Welcome back, Alex</h1>
      </div>

      {/* Today's session */}
      <div className="bg-emerald-950 text-white rounded-3xl p-7 shadow-[0_10px_40px_rgba(6,78,59,0.25)] hover:shadow-[0_16px_50px_rgba(6,78,59,0.32)] transition-shadow duration-300">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-400">Today&apos;s Session</p>
            <p className="font-display text-2xl font-semibold mt-2">Day A — Upper Body</p>
            <p className="text-emerald-100/70 text-sm mt-3">Barbell Bench Press · 4×8 &nbsp;·&nbsp; Incline DB Press · 3×10 &nbsp;·&nbsp; Weighted Pull-ups · 3×8 &nbsp;·&nbsp; Seated Row · 3×12 &nbsp;·&nbsp; Face Pulls · 3×15</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          <button onClick={() => go('log')} className="bg-white text-emerald-950 hover:bg-emerald-50 hover:shadow-lg font-semibold text-sm rounded-xl px-5 py-2.5 press">Log This Workout</button>
          <button onClick={() => go('calendar')} className="border border-white/25 hover:bg-white/10 hover:border-white/50 text-white font-medium text-sm rounded-xl px-5 py-2.5 press transition-colors">View Calendar</button>
        </div>
      </div>

      {/* Stats (mirror real: Total Workouts / Total Volume / Last Workout) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 hover:border-emerald-700/30 hover:shadow-[0_6px_24px_rgba(6,78,59,0.08)] lift">
          <p className="text-emerald-950/55 text-sm">Total Workouts</p>
          <p className="font-display text-4xl font-semibold text-emerald-950 mt-1">84</p>
          <p className="text-emerald-950/40 text-xs mt-1">all time</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 hover:border-emerald-700/30 hover:shadow-[0_6px_24px_rgba(6,78,59,0.08)] lift">
          <p className="text-emerald-950/55 text-sm">Total Volume</p>
          <p className="font-display text-4xl font-semibold text-emerald-950 mt-1">486,200</p>
          <p className="text-emerald-950/40 text-xs mt-1">lbs lifted (all time)</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 hover:border-emerald-700/30 hover:shadow-[0_6px_24px_rgba(6,78,59,0.08)] lift">
          <p className="text-emerald-950/55 text-sm">Last Workout</p>
          <p className="font-display text-2xl font-semibold text-emerald-950 mt-1">Jul 14</p>
          <p className="text-emerald-950/40 text-xs mt-1">6 exercises</p>
        </div>
      </div>

      {/* Where to go */}
      <div>
        <h2 className="font-display text-xl font-semibold text-emerald-950 mb-4">Where to go</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quick.map(({ view, icon: Icon, label, desc }) => (
            <button key={label} onClick={() => go(view)}
              className="flex items-center gap-4 bg-white border border-emerald-900/10 hover:border-emerald-700/40 hover:shadow-[0_8px_28px_rgba(6,78,59,0.10)] lift rounded-2xl p-4 transition-all group text-left">
              <div className="text-emerald-700 bg-emerald-50 rounded-xl p-2.5"><Icon size={20} /></div>
              <div className="flex-1">
                <p className="text-emerald-950 font-semibold text-sm">{label}</p>
                <p className="text-emerald-950/50 text-xs mt-0.5">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-emerald-950/30 group-hover:text-emerald-700 nudge-x" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent workouts */}
      <div>
        <h2 className="font-display text-xl font-semibold text-emerald-950 mb-4">Recent Workouts</h2>
        <div className="space-y-3">
          {recent.map(([date, count, vol, chips]) => (
            <div key={date} className="bg-white border border-emerald-900/10 hover:border-emerald-700/25 hover:shadow-[0_6px_22px_rgba(6,78,59,0.07)] rounded-2xl p-4 lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-950 font-semibold">{date}</p>
                  <p className="text-emerald-950/55 text-sm mt-0.5">{count} exercises</p>
                </div>
                <p className="text-emerald-950/45 text-xs">{vol}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {chips.slice(0, 4).map(c => (
                  <span key={c} className="text-xs bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-lg">{c}</span>
                ))}
                {chips.length > 4 && <span className="text-xs text-emerald-950/45 px-2 py-1">+{chips.length - 4} more</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Log Workout ---------------- */
function LogView() {
  const rows = [
    ['Barbell Bench Press', '4', '8', '135'],
    ['Incline DB Press', '3', '10', '50'],
    ['Weighted Pull-ups', '3', '8', '25'],
  ]
  const cell = 'rounded-lg border border-emerald-900/10 bg-emerald-900/[0.02] px-3 py-2 text-sm text-emerald-950'
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Train</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1 flex items-center gap-2.5">
          <Dumbbell size={28} className="text-emerald-700" /> Log Workout
        </h1>
      </div>
      <div className="bg-white border border-emerald-900/10 rounded-3xl p-5 md:p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-emerald-950/50 mb-1">Date</label><div className={cell}>Jul 15, 2026</div></div>
          <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-emerald-950/50 mb-1">Session</label><div className={cell}>Day A — Upper Body</div></div>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_56px_56px_64px] gap-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-950/45 px-1">
            <span>Exercise</span><span>Sets</span><span>Reps</span><span>Weight</span>
          </div>
          {rows.map(([name, sets, reps, wt]) => (
            <div key={name} className="grid grid-cols-[1fr_56px_56px_64px] gap-2">
              <div className={cell}>{name}</div><div className={cell}>{sets}</div><div className={cell}>{reps}</div><div className={cell}>{wt}</div>
            </div>
          ))}
          <button className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 mt-1 hover:text-emerald-600 press"><Plus size={15} /> Add exercise</button>
        </div>
        <button className="w-full rounded-xl bg-emerald-800 text-white font-semibold py-3 text-sm hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/20 press">Save workout</button>
      </div>
      <GetAccessNote label="Logging saves to your account" />
    </div>
  )
}

/* ---------------- Calendar ---------------- */
function CalendarView() {
  const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const plan: Record<number, [string, string]> = {
    1: ['Legs', 'strength'], 2: ['Run 5k', 'run'], 4: ['Upper', 'strength'], 6: ['Match', 'match'], 7: ['Rest', 'rest'],
    8: ['Push', 'strength'], 10: ['Run 5k', 'run'], 11: ['Pull', 'strength'], 13: ['Legs', 'strength'], 15: ['Upper Body', 'strength'],
    16: ['Recovery', 'rest'], 18: ['Match', 'match'], 20: ['Run 6k', 'run'], 21: ['Push', 'strength'], 22: ['Legs', 'strength'],
    24: ['Upper', 'strength'], 25: ['Rest', 'rest'], 27: ['Run 5k', 'run'], 28: ['Full Body', 'strength'], 29: ['Match', 'match'], 31: ['Legs', 'strength'],
  }
  const tagCls: Record<string, string> = {
    strength: 'bg-emerald-500/15 text-emerald-700',
    run: 'bg-blue-500/15 text-blue-700',
    rest: 'bg-emerald-950/[0.06] text-emerald-950/50',
    match: 'bg-orange-500/15 text-orange-700',
  }
  const first = new Date(2026, 6, 1).getDay()
  const days = 31, today = 15
  const cells: (number | null)[] = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Your program</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1 flex items-center gap-2.5">
          <CalendarDays size={28} className="text-emerald-700" /> Calendar
        </h1>
      </div>
      <div className="bg-white border border-emerald-900/10 rounded-3xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-semibold text-emerald-950">July 2026</h2>
          <div className="flex gap-2 text-emerald-950/40">
            <span className="w-8 h-8 rounded-lg border border-emerald-900/10 grid place-items-center">‹</span>
            <span className="w-8 h-8 rounded-lg border border-emerald-900/10 grid place-items-center">›</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {dows.map(d => (
            <div key={d} className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-emerald-950/35 text-center pb-1">{d}</div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />
            const w = plan[d]
            return (
              <div key={i} className={`min-h-[58px] md:min-h-[68px] rounded-xl border p-1.5 md:p-2 flex flex-col gap-1 ${
                d === today ? 'border-emerald-500 ring-1 ring-emerald-500/40' : 'border-emerald-900/[0.07]'
              }`}>
                <span className={`text-[11px] font-bold ${d === today ? 'text-emerald-700' : 'text-emerald-950/45'}`}>{d}</span>
                {w && <span className={`text-[9px] md:text-[10px] font-bold rounded px-1.5 py-0.5 truncate ${tagCls[w[1]]}`}>{w[0]}</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------------- My Plans (import + current program) ---------------- */
function PlansView() {
  const days = [
    { day: 'Day A — Upper Body', done: true, ex: ['Barbell Bench Press · 4×8', 'Incline DB Press · 3×10', 'Weighted Pull-ups · 3×8', 'Seated Cable Row · 3×12', 'Face Pulls · 3×15'] },
    { day: 'Day B — Lower Body', done: false, ex: ['Back Squat · 4×6', 'Romanian Deadlift · 3×8', 'Walking Lunges · 3×12', 'Leg Curl · 3×12', 'Standing Calf Raise · 4×15'] },
    { day: 'Day C — Push / Conditioning', done: false, ex: ['Overhead Press · 4×8', 'Dips · 3×10', 'Lateral Raises · 3×15', 'Sprint Intervals · 8×100m'] },
  ]
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Plan &amp; Progress</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1 flex items-center gap-2.5">
          <FileText size={28} className="text-emerald-700" /> My Plans
        </h1>
      </div>

      {/* Import a plan */}
      <div className="bg-white border border-emerald-900/10 rounded-3xl p-5 md:p-6">
        <h2 className="font-display text-lg font-semibold text-emerald-950">Import a Plan</h2>
        <p className="text-emerald-950/55 text-sm mt-1">Paste a program from Owen or the Skool community — the dashboard builds your calendar automatically.</p>
        <div className="mt-3 rounded-xl border border-emerald-900/10 bg-emerald-900/[0.02] px-4 py-3 text-sm text-emerald-950/40 min-h-[72px]">Paste your Google Doc plan here…</div>
        <button className="mt-3 rounded-xl bg-emerald-800 text-white font-semibold px-5 py-2.5 text-sm hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/20 press">Import plan</button>
      </div>

      {/* Current program */}
      <div className="bg-white border border-emerald-900/10 rounded-3xl p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Summer Strength Block</p>
            <h2 className="font-display text-2xl font-semibold text-emerald-950 mt-0.5">Week 3 of 8</h2>
          </div>
          <span className="text-sm font-semibold text-emerald-950/55">60% complete</span>
        </div>
        <div className="h-2 rounded-full bg-emerald-900/10 mt-4 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: '60%' }} />
        </div>
      </div>

      <div className="space-y-3">
        {days.map(({ day, done, ex }) => (
          <div key={day} className="bg-white border border-emerald-900/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-500' : 'border border-emerald-900/15'}`}>
                {done && <Check size={14} className="text-emerald-950" strokeWidth={3} />}
              </div>
              <h3 className="font-display text-lg font-semibold text-emerald-950">{day}</h3>
              {done && <span className="ml-auto text-xs font-semibold text-emerald-700">Completed</span>}
            </div>
            <div className="grid sm:grid-cols-2 gap-2 pl-9">
              {ex.map(e => (
                <p key={e} className="text-sm text-emerald-950/70 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 flex-shrink-0" />{e}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Progress ---------------- */
function ProgressView() {
  const prs: [string, string, string][] = [
    ['Barbell Bench Press', '155 lb', '+20 lb this block'],
    ['Back Squat', '245 lb', '+35 lb this block'],
    ['Romanian Deadlift', '225 lb', '+15 lb this block'],
    ['Overhead Press', '110 lb', '+10 lb this block'],
  ]
  const bars = [60, 68, 72, 80, 86, 92, 100] // bench progression %
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Plan &amp; Progress</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1 flex items-center gap-2.5">
          <TrendingUp size={28} className="text-emerald-700" /> Progress
        </h1>
      </div>

      {/* Simple progression chart */}
      <div className="bg-white border border-emerald-900/10 rounded-3xl p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-emerald-950">Bench Press · 8-week trend</h2>
          <span className="text-sm font-semibold text-emerald-700">155 lb PR</span>
        </div>
        <div className="flex items-end gap-2 h-40 mt-5">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between text-[11px] text-emerald-950/40 mt-2">
          {bars.map((_, i) => <span key={i}>W{i + 1}</span>)}
        </div>
      </div>

      {/* PR table */}
      <div className="bg-white border border-emerald-900/10 rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-emerald-900/10"><h2 className="font-display text-lg font-semibold text-emerald-950">Personal Records</h2></div>
        <div className="divide-y divide-emerald-900/[0.06]">
          {prs.map(([name, best, delta]) => (
            <div key={name} className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex-1 min-w-0"><p className="text-emerald-950 font-semibold text-sm">{name}</p><p className="text-emerald-700 text-xs">{delta}</p></div>
              <span className="font-display text-xl font-semibold text-emerald-950">{best}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Coach Directory ---------------- */
function CoachesView() {
  const [mode, setMode] = useState<'college' | 'pro'>('college')

  const college: [string, string, string, boolean][] = [
    ['Head Coach', 'University of Portland', 'D1 · WCC', true],
    ['Recruiting Coordinator', 'Grand Canyon University', 'D1 · WAC', false],
    ['Assistant Coach', 'Marshall University', 'D1 · Sun Belt', true],
    ['Assistant Coach', 'UC Santa Barbara', 'D1 · Big West', false],
    ['Head Coach', 'Seattle University', 'D1 · WCC', false],
  ]
  const pro: [string, string, string, boolean][] = [
    ['Sporting Director', 'IFK Göteborg', 'Sweden · Allsvenskan', true],
    ['Head of Recruitment', 'Lech Poznań', 'Poland · Ekstraklasa', false],
    ['Technical Director', 'Odds BK', 'Norway · Eliteserien', true],
    ['First-Team Scout', 'FC Lahti', 'Finland · Veikkausliiga', false],
  ]
  const rows = mode === 'college' ? college : pro
  const chips = mode === 'college' ? ['Division I', 'ACC', "Men's Soccer"] : ['Sweden', 'Top division', 'First team']
  const seg = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold press ${
      active ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-950/55 hover:text-emerald-950'
    }`

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Pathway · Recruiting</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1 flex items-center gap-2.5">
          <GraduationCap size={30} className="text-emerald-700" /> Coach Directory
        </h1>
        <p className="text-emerald-950/55 mt-2">40,000+ college coaches and pro clubs — filter, favorite your targets, and email direct.</p>
      </div>

      {/* College / Pro toggle */}
      <div className="inline-flex rounded-xl bg-emerald-900/5 p-1">
        <button onClick={() => setMode('college')} className={seg(mode === 'college')}><GraduationCap size={15} /> College</button>
        <button onClick={() => setMode('pro')} className={seg(mode === 'pro')}><Trophy size={15} /> Pro</button>
      </div>

      {/* search + filters */}
      <div className="bg-white border border-emerald-900/10 rounded-2xl p-4 space-y-3">
        <div className="rounded-xl border border-emerald-900/10 bg-emerald-900/[0.02] px-4 py-2.5 text-sm text-emerald-950/40">
          {mode === 'college' ? 'Search coach or school…' : 'Search club or contact…'}
        </div>
        <div className="flex gap-2 flex-wrap">
          {chips.map((c, i) => (
            <span key={c} className={`text-xs font-semibold rounded-full px-3 py-1.5 ${i === 0 ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30' : 'bg-emerald-900/5 text-emerald-950/60'}`}>{c}</span>
          ))}
          <span className="text-xs font-semibold rounded-full px-3 py-1.5 bg-emerald-900/5 text-emerald-950/60 inline-flex items-center gap-1.5">
            <Star size={12} className="fill-emerald-500 text-emerald-500" /> My Target List
          </span>
        </div>
      </div>

      <p className="text-sm text-emerald-950/55">
        <span className="font-semibold text-emerald-950">40,000+</span> {mode === 'college' ? 'coaches' : 'club contacts'}
      </p>

      {/* rows */}
      <div className="space-y-2">
        {rows.map(([role, org, meta, starred], i) => (
          <div key={i} className="flex items-center gap-3 bg-white border border-emerald-900/10 rounded-2xl px-4 py-3">
            <Star size={18} className={`flex-shrink-0 ${starred ? 'fill-emerald-500 text-emerald-500' : 'text-emerald-900/25'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-emerald-950 font-semibold text-sm truncate">{org}</p>
              <p className="text-emerald-950/55 text-xs truncate">{role} · {meta}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="w-8 h-8 rounded-xl bg-emerald-900/5 grid place-items-center"><Phone size={14} className="text-emerald-700" /></span>
              {mode === 'pro' && (
                <span title="Message translator — coming soon"
                   className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-900/5 text-emerald-950/40 text-xs font-semibold cursor-not-allowed select-none">
                  <Languages size={14} /> <span className="hidden md:inline">Translate</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-700 text-[10px] font-bold uppercase tracking-wide">Soon</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold"><Mail size={14} /> <span className="hidden sm:inline">Email</span></span>
            </div>
          </div>
        ))}
      </div>

      {/* locked overlay CTA */}
      <div className="relative bg-white border border-emerald-900/10 rounded-3xl p-8 text-center overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-emerald-900/5 flex items-center justify-center mx-auto mb-4">
          <Lock size={22} className="text-emerald-800" />
        </div>
        <h3 className="font-display text-2xl font-semibold text-emerald-950">39,995 more behind this</h3>
        <p className="text-emerald-950/55 mt-2 max-w-md mx-auto">The full recruiting database, target lists, and one-click email tools unlock inside The Pitch.</p>
        <a href={SKOOL_URL} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-2 mt-5 rounded-xl bg-emerald-800 text-white font-semibold px-5 py-3 text-sm hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/20 press">
          Get full access <ArrowRight size={16} />
        </a>
      </div>
    </div>
  )
}

/* ---------------- Message Owen ---------------- */
function MessageView() {
  const thread: [boolean, string][] = [
    [true, "Hey Alex — nice work on the bench PR this week. How'd the legs session feel?"],
    [false, 'Felt strong! Squat moved way better. Ready to push the volume next week.'],
    [true, "Love it. I'll bump Day B and add a sprint finisher. Keep sending me your highlight clips too."],
    [false, 'Will do. Also emailed two of the coaches from my target list 🔥'],
  ]
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Coach</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1 flex items-center gap-2.5">
          <MessageCircle size={28} className="text-emerald-700" /> Message Owen
        </h1>
      </div>
      <div className="bg-white border border-emerald-900/10 rounded-3xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-900/10">
          <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-white font-semibold">O</div>
          <div><p className="text-emerald-950 font-semibold text-sm">Owen Stahl</p><p className="text-emerald-700 text-xs">Your coach · usually replies within a day</p></div>
        </div>
        <div className="p-5 space-y-3 bg-[#f8faf8]">
          {thread.map(([fromCoach, msg], i) => (
            <div key={i} className={`flex ${fromCoach ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${fromCoach ? 'bg-white border border-emerald-900/10 text-emerald-950' : 'bg-emerald-800 text-white'}`}>{msg}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 border-t border-emerald-900/10">
          <div className="flex-1 rounded-xl border border-emerald-900/10 bg-emerald-900/[0.02] px-4 py-2.5 text-sm text-emerald-950/40">Message Owen…</div>
          <span className="w-10 h-10 rounded-xl bg-emerald-800 grid place-items-center flex-shrink-0"><Send size={16} className="text-white" /></span>
        </div>
      </div>
      <GetAccessNote label="Get a direct line to Owen" />
    </div>
  )
}

/* ---------------- shared ---------------- */
function GetAccessNote({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap bg-emerald-950 text-white rounded-2xl px-5 py-4">
      <p className="text-sm text-emerald-50/90 flex items-center gap-2"><Lock size={15} className="text-emerald-300" /> {label} — unlock it inside The Pitch.</p>
      <a href={SKOOL_URL} target="_blank" rel="noopener noreferrer"
         className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 text-emerald-950 font-semibold px-4 py-2 text-sm hover:bg-emerald-300 hover:shadow-lg press">
        Get full access <ArrowRight size={15} />
      </a>
    </div>
  )
}
