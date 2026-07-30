import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import MessageThread from '@/components/MessageThread'
import { clientTypeLabel } from '@/lib/clientTypes'

export default async function CoachThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: client } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (!client) redirect('/coach/messages')

  return (
    <div className="max-w-3xl mx-auto space-y-6 stagger">
      <div className="flex items-center gap-4">
        <Link href="/coach/messages" className="text-emerald-950/50 hover:text-emerald-950 press inline-block">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-semibold text-emerald-950">{client.full_name}</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
              {clientTypeLabel(client.client_type)}
            </span>
          </div>
          <Link href={`/coach/client/${client.id}`} className="text-emerald-700 text-sm hover:text-emerald-600 press inline-block">
            View full profile →
          </Link>
        </div>
      </div>

      <MessageThread clientId={client.id} currentUserId={user.id} />
    </div>
  )
}
