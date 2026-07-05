'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dumbbell, LayoutDashboard, TrendingUp, CalendarDays, FileText, Users, LogOut } from 'lucide-react'

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

  const clientLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/log', label: 'Log Workout', icon: Dumbbell },
    { href: '/dashboard/progress', label: 'Progress', icon: TrendingUp },
    { href: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays },
    { href: '/dashboard/import', label: 'Import Program', icon: FileText },
  ]

  const coachLinks = [
    { href: '/coach', label: 'All Clients', icon: Users },
    { href: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  ]

  const links = role === 'coach' ? coachLinks : clientLinks

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Dumbbell className="text-green-500" size={22} />
          <span className="text-xl font-bold text-white">Pitch HQ Dashboard</span>
        </div>
        <p className="text-zinc-400 text-sm mt-1 truncate">{name}</p>
        {role === 'coach' && (
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full mt-1 inline-block">
            Coach
          </span>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-green-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
