'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dumbbell, LayoutDashboard, TrendingUp, CalendarDays, FileText,
  Users, LogOut, MessageCircle, Inbox, Library,
} from 'lucide-react'

interface NavbarProps {
  role: 'client' | 'coach'
  name: string
}

export default function Navbar({ role, name }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

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
        { href: '/coach/messages', label: 'Messages', icon: Inbox },
        { href: '/coach/library', label: 'Exercise Library', icon: Library },
      ],
    },
    {
      title: 'Personal',
      links: [
        { href: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
      ],
    },
  ]

  const sections = role === 'coach' ? coachSections : clientSections

  return (
    <aside className="w-64 bg-emerald-950 text-white flex flex-col h-screen sticky top-0 flex-shrink-0">
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

      <nav className="flex-1 px-4 py-5 space-y-6 overflow-y-auto">
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-white text-emerald-950 shadow-sm'
                        : 'text-emerald-100/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon size={17} />
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
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-emerald-100/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
