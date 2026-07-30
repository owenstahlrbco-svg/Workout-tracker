'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dumbbell, LayoutDashboard, TrendingUp, CalendarDays, FileText,
  Users, LogOut, MessageCircle, Inbox, Library, Menu, X,
  GraduationCap, KeyRound, Target, Tent,
} from 'lucide-react'

interface NavbarProps {
  role: 'client' | 'coach'
  name: string
  pathwayAccess?: boolean
}

// Matches the exit animation duration in globals.css (--dur-fast).
const EXIT_MS = 150

export default function Navbar({ role, name, pathwayAccess = false }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  // `open` keeps the drawer mounted; `closing` plays the slide-out before unmount.
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  const closeDrawer = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, EXIT_MS)
  }, [])

  // Escape closes the drawer, and the page behind it shouldn't scroll.
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

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const clientSections = [
    {
      title: 'Train',
      links: [
        { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
        { href: '/dashboard/log', label: 'Log Workout', icon: Dumbbell },
        { href: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays },
      ],
    },
    {
      title: 'Plan & Progress',
      links: [
        { href: '/dashboard/import', label: 'My Plans', icon: FileText },
        { href: '/dashboard/progress', label: 'Progress', icon: TrendingUp },
      ],
    },
    ...(pathwayAccess
      ? [{
          title: 'Recruiting',
          links: [
            { href: '/dashboard/coaches', label: 'Coach Directory', icon: GraduationCap },
            { href: '/dashboard/camps', label: 'Camp Finder', icon: Tent },
          ],
        }]
      : []),
    {
      title: 'Coach',
      links: [
        { href: '/dashboard/messages', label: 'Message Owen', icon: MessageCircle },
      ],
    },
  ]

  const coachSections = [
    {
      title: 'Coaching',
      links: [
        { href: '/coach', label: 'Clients', icon: Users },
        { href: '/coach/members', label: 'Members & Access', icon: KeyRound },
        { href: '/coach/messages', label: 'Messages', icon: Inbox },
        { href: '/coach/library', label: 'Exercise Library', icon: Library },
      ],
    },
    {
      title: 'Recruiting',
      links: [
        { href: '/dashboard/coaches', label: 'Coach Directory', icon: GraduationCap },
        { href: '/dashboard/camps', label: 'Camp Finder', icon: Tent },
        { href: '/coach/targets', label: 'Player Targets', icon: Target },
      ],
    },
    {
      title: 'Personal',
      links: [
        { href: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/import', label: 'My Plans', icon: FileText },
        { href: '/dashboard/progress', label: 'Progress', icon: TrendingUp },
      ],
    },
  ]

  const sections = role === 'coach' ? coachSections : clientSections

  // `animated` staggers the drawer's own contents in behind the slide; the
  // desktop sidebar is always present, so it renders static.
  const navBody = (animated: boolean) => (
    <>
      <div className="px-6 pt-7 pb-6 border-b border-white/10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">Pitch HQ</p>
        <p className="font-display text-2xl font-semibold text-white mt-0.5">Dashboard</p>
        <p className="text-emerald-100/60 text-sm mt-2 truncate">{name}</p>
        {role === 'coach' && (
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-400/15 text-emerald-300 px-2.5 py-1 rounded-full mt-2 inline-block">
            Coach
          </span>
        )}
      </div>

      <nav className={`flex-1 px-4 py-5 space-y-6 overflow-y-auto ${animated ? 'stagger' : ''}`}>
        {sections.map(section => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100/40">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => open && closeDrawer()}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium lift ${
                      active
                        ? 'bg-white text-emerald-950 shadow-sm'
                        : 'text-emerald-100/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {/* Hover marker grows out from the left edge (active rows already read as filled) */}
                    {!active && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 opacity-0 rounded-r-full bg-emerald-400 transition-all duration-300 ease-out group-hover:h-4 group-hover:opacity-100"
                        aria-hidden
                      />
                    )}
                    <Icon
                      size={17}
                      className="transition-transform duration-200 ease-out group-hover:scale-110 group-active:scale-95"
                    />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="group flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-emerald-100/60 hover:text-white hover:bg-white/10 press"
        >
          <LogOut size={17} className="nudge-x" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar — only below md */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between bg-emerald-950 text-white h-14 px-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-emerald-400">Pitch HQ</span>
          <span className="font-display text-lg font-semibold">Dashboard</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="p-2 -mr-2 rounded-lg hover:bg-white/10 press"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile drawer + backdrop */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className={`absolute inset-0 bg-emerald-950/50 backdrop-blur-[2px] ${
              closing ? 'animate-fade-out' : 'animate-fade-in'
            }`}
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

      {/* Desktop sidebar — md and up */}
      <aside className="hidden md:flex w-64 bg-emerald-950 text-white flex-col h-screen sticky top-0 flex-shrink-0">
        {navBody(false)}
      </aside>
    </>
  )
}
