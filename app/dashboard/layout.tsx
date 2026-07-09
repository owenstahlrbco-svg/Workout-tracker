import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? user.user_metadata?.role ?? 'client'
  const name = profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? ''

  return (
    <div className="md:flex md:h-screen bg-[#f5f8f5]">
      <Navbar role={role} name={name} />
      <main className="flex-1 overflow-y-auto pt-20 px-4 pb-10 md:p-8">
        {children}
      </main>
    </div>
  )
}
