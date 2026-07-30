'use client'

import { useState } from 'react'
import { X, Languages, Loader2, Copy, Check, Mail, ArrowRight } from 'lucide-react'

interface ProContact {
  coach: string | null
  school: string | null
  email: string | null
  language: string | null
  country: string | null
}

// Composer that translates an English recruiting message into the club's
// language via Claude, then hands off to the user's email client (mailto).
export default function TranslatorModal({ contact, onClose }: { contact: ProContact; onClose: () => void }) {
  const target = contact.language || 'the club’s language'
  const [subject, setSubject] = useState('')
  const [english, setEnglish] = useState('')
  const [translated, setTranslated] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function translate() {
    const text = english.trim()
    if (!text) { setError('Write your message first.'); return }
    setLoading(true); setError(''); setCopied(false)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: contact.language || 'the local language' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Translation failed.'); return }
      setTranslated(data.translated)
    } catch {
      setError('Could not reach the translator. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function copyOut() {
    if (!translated) return
    try {
      await navigator.clipboard.writeText(translated)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* ignore */ }
  }

  const mailto = contact.email
    ? `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(translated)}`
    : undefined

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-emerald-950/50 backdrop-blur-[2px] animate-fade-in" onClick={onClose} aria-hidden />
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto animate-sheet-in">
        <div className="sticky top-0 bg-white border-b border-emerald-900/10 px-5 py-4 flex items-start justify-between rounded-t-3xl">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 flex items-center gap-1.5">
              <Languages size={13} /> Translate & send
            </p>
            <h2 className="font-display text-lg font-semibold text-emerald-950 mt-0.5 truncate">
              {contact.school || contact.coach || 'Club contact'}
            </h2>
            <p className="text-emerald-950/50 text-xs mt-0.5 truncate">
              Writes to <span className="font-medium text-emerald-950/70">{contact.email || 'no email on file'}</span>
              {' · '}translating to <span className="font-medium text-emerald-950/70">{target}</span>
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex-shrink-0 p-2 -mr-1 rounded-lg text-emerald-950/40 hover:text-emerald-950 hover:bg-emerald-900/5 press hover:rotate-90">
            <X size={19} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-emerald-950/50 mb-1.5">Subject (optional)</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Trial request — attacking midfielder, 2026"
              className="w-full rounded-xl border border-emerald-900/15 bg-white px-3.5 py-2.5 text-sm text-emerald-950 placeholder:text-emerald-950/35 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
            />
            <p className="text-[11px] text-emerald-950/40 mt-1">Kept in English — most club inboxes filter on it.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-emerald-950/50 mb-1.5">Your message (English)</label>
              <textarea
                value={english}
                onChange={e => setEnglish(e.target.value)}
                rows={9}
                placeholder="Write your message the way you normally would. Introduce the player, key stats, highlight link, and what you’re asking for."
                className="w-full rounded-xl border border-emerald-900/15 bg-white px-3.5 py-3 text-sm text-emerald-950 placeholder:text-emerald-950/35 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 resize-y"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-emerald-950/50 mb-1.5 flex items-center gap-1.5">
                {target} <span className="text-emerald-950/30 normal-case tracking-normal font-normal">· editable</span>
              </label>
              <textarea
                value={translated}
                onChange={e => setTranslated(e.target.value)}
                rows={9}
                placeholder={loading ? 'Translating…' : 'Your translated message appears here. Review it before sending.'}
                className="w-full rounded-xl border border-emerald-900/15 bg-emerald-900/[0.03] px-3.5 py-3 text-sm text-emerald-950 placeholder:text-emerald-950/35 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 resize-y"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={translate}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 text-white text-sm font-semibold hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/20 disabled:opacity-60 press"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Languages size={16} />}
              {translated ? 'Re-translate' : `Translate to ${target}`}
            </button>

            {translated && (
              <>
                <button
                  onClick={copyOut}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-900/5 text-emerald-800 text-sm font-semibold hover:bg-emerald-900/10 press"
                >
                  {copied ? <Check size={16} className="animate-pop-in" /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy'}
                </button>
                {mailto && (
                  <a
                    href={mailto}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950 text-white text-sm font-semibold hover:bg-emerald-900 hover:shadow-lg press ml-auto group"
                  >
                    <Mail size={16} /> Open in email <ArrowRight size={15} className="nudge-x" />
                  </a>
                )}
              </>
            )}
          </div>

          <p className="text-[11px] text-emerald-950/40 leading-relaxed">
            Machine translation — give it a quick read before sending. “Open in email” drops the translated text straight into your mail app, already addressed.
          </p>
        </div>
      </div>
    </div>
  )
}
