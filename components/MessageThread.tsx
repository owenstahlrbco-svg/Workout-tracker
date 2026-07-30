'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Send } from 'lucide-react'

interface Message {
  id: string
  client_id: string
  sender_id: string
  content: string
  created_at: string
}

interface Props {
  clientId: string
  currentUserId: string
}

export default function MessageThread({ clientId, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
    setLoaded(true)
  }, [clientId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim() || sending) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      client_id: clientId,
      sender_id: currentUserId,
      content: draft.trim(),
    })
    if (!error) {
      setDraft('')
      await load()
    }
    setSending(false)
  }

  return (
    <div className="bg-white border border-emerald-900/10 rounded-3xl flex flex-col h-[65vh] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {!loaded ? (
          <p className="text-emerald-950/40 text-sm text-center mt-8">Loading conversation...</p>
        ) : messages.length === 0 ? (
          <p className="text-emerald-950/40 text-sm text-center mt-8">
            No messages yet. Say hello — this goes straight to the other side.
          </p>
        ) : (
          messages.map(m => {
            const mine = m.sender_id === currentUserId
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 animate-rise-in ${
                  mine
                    ? 'bg-emerald-800 text-white rounded-br-md'
                    : 'bg-emerald-50 text-emerald-950 rounded-bl-md'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  <p className={`text-[10px] mt-1 ${mine ? 'text-emerald-100/60' : 'text-emerald-950/40'}`}>
                    {format(new Date(m.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="border-t border-emerald-900/10 p-4 flex gap-3">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 bg-[#f5f8f5] border border-emerald-900/15 rounded-xl px-4 py-2.5 text-emerald-950 placeholder-emerald-950/35 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm transition-shadow duration-200 focus:shadow-md"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="bg-emerald-800 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/20 disabled:opacity-40 text-white rounded-xl px-5 press group flex items-center gap-2 text-sm font-semibold"
        >
          <Send size={15} className="nudge-x" /> Send
        </button>
      </form>
    </div>
  )
}
