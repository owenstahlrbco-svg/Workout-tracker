import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tent, Lock } from 'lucide-react'
import CampFinder from '@/components/CampFinder'

export const metadata = { title: 'Camp Finder · Pitch HQ' }

export default async function CampFinderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, pathway_access')
    .eq('id', user.id)
    .single()

  const hasAccess = profile?.role === 'coach' || profile?.pathway_access === true

  if (!hasAccess) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <div className="bg-white border border-emerald-900/10 rounded-3xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-900/5 flex items-center justify-center mx-auto mb-5">
            <Lock size={24} className="text-emerald-800" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-emerald-950">Camp Finder</h1>
          <p className="text-emerald-950/55 mt-2">
            College camps are part of the <span className="font-semibold text-emerald-950">top tier</span>.
            Message Owen to upgrade and find camps near you.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Pathway · Recruiting</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1 flex items-center gap-2.5">
          <Tent size={30} className="text-emerald-700" /> Camp Finder
        </h1>
        <p className="text-emerald-950/55 mt-2">
          College camps and prospect days, with dates, prices and the school running them.
          Filter by <span className="font-semibold text-emerald-950">state</span> and{' '}
          <span className="font-semibold text-emerald-950">sport</span> to find one near you, then open the
          camp page to register.
        </p>
      </div>
      <CampFinder />
    </div>
  )
}
