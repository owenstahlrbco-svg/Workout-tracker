import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Inbox, ChevronRight } from 'lucide-react'
import { clientTypeLabel } from '@/lib/clientTypes'

export default async function CoachMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: clients }, { data: messages }] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'client').order('full_name'),
    supabase.from('messages').select('*').order('created_at', { ascending: false }),
  ])

  const latestByClient = new Map<string, { content: string; created_at: string; fromClient: boolean }>()
  for (const m of messages ?? []) {
    if (!latestByClient.has(m.client_id)) {
      latestByClient.set(m.client_id, {
        content: m.content,
        created_at: m.created_at,
        fromClient: m.sender_id === m.client_id,
      })
    }
  }

  const sorted = [...(clients ?? [])].sort((a, b) => {
    const la = latestByClient.get(a.id)?.created_at ?? ''
    const lb = latestByClient.get(b.id)?.created_at ?? ''
    return lb.localeCompare(la)
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Direct Line</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1">Messages</h1>
        <p className="text-emerald-950/55 mt-2">Every client conversation in one place.</p>
      </div>

      {sorted.length > 0 ? (
        <div className="space-y-2">
          {sorted.map(client => {
            const latest = latestByClient.get(client.id)
            return (
              <Link
                key={client.id}
                href={`/coach/messages/${client.id}`}
                className="flex items-center gap-4 bg-white border border-emerald-900/10 hover:border-emerald-700/40 hover:shadow-[0_4px_20px_rgba(6,78,59,0.08)] rounded-2xl p-4 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {client.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-emerald-950 font-semibold text-sm">{client.full_name ?? 'Unknown'}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                      {clientTypeLabel(client.client_type)}
                    </span>
                  </div>
                  <p className="text-emerald-950/50 text-xs truncate mt-0.5">
                    {latest
                      ? `${latest.fromClient ? '' : 'You: '}${latest.content}`
                      : 'No messages yet'}
                  </p>
                </div>
                {latest && (
                  <span className="text-emerald-950/40 text-xs flex-shrink-0">
                    {format(new Date(latest.created_at), 'MMM d')}
                  </span>
                )}
                <ChevronRight size={16} className="text-emerald-950/30 group-hover:text-emerald-700 transition-colors flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-white border border-emerald-900/10 rounded-3xl p-12 text-center">
          <Inbox size={40} className="text-emerald-900/25 mx-auto mb-4" />
          <p className="text-emerald-950/55">No clients yet — conversations will appear here.</p>
        </div>
      )}
    </div>
  )
}
