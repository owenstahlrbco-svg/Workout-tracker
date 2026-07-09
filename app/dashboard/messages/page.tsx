import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MessageThread from '@/components/MessageThread'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Direct Line</p>
        <h1 className="font-display text-4xl font-semibold text-emerald-950 mt-1">Message Owen</h1>
        <p className="text-emerald-950/55 mt-2">
          Questions about your plan, a lift, or anything else — send it here and Owen will get back to you.
        </p>
      </div>

      <MessageThread clientId={user.id} currentUserId={user.id} />
    </div>
  )
}
