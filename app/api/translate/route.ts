import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Simple recruiting-message translator, powered by Claude.
// Gated to the same audience as the Coach Directory (top-tier / coach) so the
// LLM endpoint can't be called by anonymous or middle-tier users.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not signed in.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, pathway_access')
    .eq('id', user.id)
    .single()

  const hasAccess = profile?.role === 'coach' || profile?.pathway_access === true
  if (!hasAccess) return Response.json({ error: 'No access.' }, { status: 403 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return Response.json({ error: 'Translator is not configured yet.' }, { status: 503 })

  let body: { text?: string; targetLanguage?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Bad request.' }, { status: 400 })
  }

  const text = (body.text ?? '').trim()
  const targetLanguage = (body.targetLanguage ?? '').trim()
  if (!text) return Response.json({ error: 'Nothing to translate.' }, { status: 400 })
  if (!targetLanguage) return Response.json({ error: 'Missing target language.' }, { status: 400 })
  if (text.length > 6000) return Response.json({ error: 'Message is too long (6,000 characters max).' }, { status: 400 })

  const system =
    `You are a professional translator for a sports recruiting platform. ` +
    `Translate the user's message into ${targetLanguage}. ` +
    `Keep the tone warm, professional, and natural for a soccer/football club contact. ` +
    `Preserve names, clubs, dates, numbers, and email addresses exactly. ` +
    `Return ONLY the translated text — no preamble, no notes, no quotation marks.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system,
        messages: [{ role: 'user', content: text }],
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('[translate] anthropic error', res.status, detail.slice(0, 300))
      return Response.json({ error: 'Translation service failed. Try again.' }, { status: 502 })
    }

    const data = await res.json()
    const translated = (data?.content?.[0]?.text ?? '').trim()
    if (!translated) return Response.json({ error: 'Empty translation. Try again.' }, { status: 502 })

    return Response.json({ translated })
  } catch (err) {
    console.error('[translate] fetch failed', err)
    return Response.json({ error: 'Translation service unreachable.' }, { status: 502 })
  }
}
