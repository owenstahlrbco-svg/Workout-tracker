'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Mail, Phone, ChevronLeft, ChevronRight, Filter, X, Loader2, GraduationCap, Trophy, Languages, Star } from 'lucide-react'
import TranslatorModal from './TranslatorModal'

interface Contact {
  id: number
  coach: string | null
  school: string | null
  role: string | null
  email: string | null
  phone: string | null
  sport: string | null
  gender: string | null
  division: string | null
  conference: string | null
  state: string | null
  country: string | null
  language: string | null
  category: string | null
}

const PAGE_SIZE = 40
const GENDERS = ['Men', 'Women']

export default function CoachDirectory() {
  const supabase = createClient()

  const [mode, setMode] = useState<'college' | 'pro'>('college')

  // college filters
  const [division, setDivision] = useState('')
  const [conference, setConference] = useState('')
  const [sport, setSport] = useState('')
  const [gender, setGender] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  // pro filters
  const [country, setCountry] = useState('')
  const [league, setLeague] = useState('')

  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(0)

  // college option lists
  const [divisions, setDivisions] = useState<string[]>([])
  const [sports, setSports] = useState<string[]>([])
  const [conferences, setConferences] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  // pro option lists
  const [countries, setCountries] = useState<string[]>([])
  const [leagues, setLeagues] = useState<string[]>([])

  const [rows, setRows] = useState<Contact[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [translateFor, setTranslateFor] = useState<Contact | null>(null)

  // ── Target list (favorites) ──
  const [uid, setUid] = useState<string | null>(null)
  const [favs, setFavs] = useState<Set<number>>(new Set())
  const [viewFavs, setViewFavs] = useState(false)
  const favsRef = useRef<Set<number>>(favs)
  favsRef.current = favs

  // load the signed-in player + their saved target list once
  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      const id = data.user?.id ?? null
      setUid(id)
      if (id) {
        supabase.from('coach_favorites').select('contact_id').then(({ data }) => {
          if (active && data) setFavs(new Set(data.map((r: { contact_id: number }) => Number(r.contact_id))))
        })
      }
    })
    return () => { active = false }
  }, [supabase])

  // add / remove a school from the target list (optimistic)
  async function toggleFav(id: number) {
    if (!uid) return
    const has = favs.has(id)
    const next = new Set(favs)
    if (has) next.delete(id); else next.add(id)
    setFavs(next)
    if (viewFavs && has) setRows(rs => rs.filter(r => r.id !== id)) // drop it from the target-list view
    try {
      if (has) await supabase.from('coach_favorites').delete().eq('user_id', uid).eq('contact_id', id)
      else await supabase.from('coach_favorites').insert({ user_id: uid, contact_id: id })
    } catch {
      // on error, reload the true state
      const { data } = await supabase.from('coach_favorites').select('contact_id')
      if (data) setFavs(new Set(data.map((r: { contact_id: number }) => Number(r.contact_id))))
    }
  }

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [search])

  // reset when switching College <-> Pro (also leaves the target-list view)
  function switchMode(next: 'college' | 'pro') {
    setViewFavs(false)
    if (next === mode) return
    setMode(next)
    setDivision(''); setConference(''); setSport(''); setGender(''); setStateFilter('')
    setCountry(''); setLeague(''); setSearch(''); setPage(0)
  }

  const loadCollegeOptions = useCallback(async (div: string) => {
    const { data } = await supabase.rpc('cc_filter_options', { p_division: div || null })
    if (data) { setDivisions(data.divisions ?? []); setSports(data.sports ?? []); setConferences(data.conferences ?? []); setStates(data.states ?? []) }
  }, [supabase])

  const loadProOptions = useCallback(async (ctry: string) => {
    const { data } = await supabase.rpc('cc_pro_filter_options', { p_country: ctry || null })
    if (data) { setCountries(data.countries ?? []); setLeagues(data.leagues ?? []) }
  }, [supabase])

  useEffect(() => {
    if (mode === 'college') loadCollegeOptions(division)
    else loadProOptions(country)
  }, [mode, division, country, loadCollegeOptions, loadProOptions])

  useEffect(() => { setPage(0) }, [division, conference, sport, gender, stateFilter, country, league])

  const SELECT_COLS = 'id,coach,school,role,email,phone,sport,gender,division,conference,state,country,language,category'

  const firstLoad = useRef(true)
  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)

      // ── Target-list view: show only the player's favorited schools (across college + pro) ──
      if (viewFavs) {
        const ids = Array.from(favsRef.current)
        if (ids.length === 0) { setRows([]); setCount(0); setLoading(false); firstLoad.current = false; return }
        let q = supabase
          .from('coach_contacts')
          .select(SELECT_COLS, { count: 'exact' })
          .in('id', ids)
          .order('school', { ascending: true })
          .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
        if (debounced.trim()) {
          const s = debounced.trim().replace(/[%,()]/g, '')
          q = q.or(`coach.ilike.%${s}%,school.ilike.%${s}%`)
        }
        const { data, count: c } = await q
        if (cancelled) return
        setRows((data as Contact[]) ?? []); setCount(c ?? 0); setLoading(false); firstLoad.current = false
        return
      }

      // ── Normal directory view ──
      // Only ever surface contacts a player can actually email.
      let q = supabase
        .from('coach_contacts')
        .select(SELECT_COLS, { count: 'exact' })
        .eq('category', mode)
        .not('email', 'is', null)
        .order('school', { ascending: true })
        .order('role', { ascending: true })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

      if (mode === 'college') {
        if (division) q = q.eq('division', division)
        if (conference) q = q.eq('conference', conference)
        if (sport) q = q.eq('sport', sport)
        if (gender) q = q.eq('gender', gender)
        if (stateFilter) q = q.eq('state', stateFilter)
      } else {
        if (country) q = q.eq('country', country)
        if (league) q = q.eq('division', league)
      }
      if (debounced.trim()) {
        const s = debounced.trim().replace(/[%,()]/g, '')
        q = q.or(`coach.ilike.%${s}%,school.ilike.%${s}%`)
      }

      const { data, count: c } = await q
      if (cancelled) return
      setRows((data as Contact[]) ?? [])
      setCount(c ?? 0)
      setLoading(false)
      firstLoad.current = false
    }
    run()
    return () => { cancelled = true }
  }, [supabase, mode, division, conference, sport, gender, stateFilter, country, league, debounced, page, viewFavs])

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const anyFilter = division || conference || sport || gender || stateFilter || country || league || search

  function clearAll() {
    setDivision(''); setConference(''); setSport(''); setGender(''); setStateFilter('')
    setCountry(''); setLeague(''); setSearch('')
  }

  const selectCls =
    'w-full rounded-xl border border-emerald-900/15 bg-white px-3 py-2.5 text-sm text-emerald-950 ' +
    'focus:outline-none focus:ring-2 focus:ring-emerald-600/40'

  const collegeFilters = (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <Field label="Division">
        <select className={selectCls} value={division} onChange={e => { setDivision(e.target.value); setConference('') }}>
          <option value="">All divisions</option>
          {divisions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </Field>
      <Field label="Conference">
        <select className={selectCls} value={conference} onChange={e => setConference(e.target.value)}>
          <option value="">All conferences</option>
          {conferences.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Sport">
        <select className={selectCls} value={sport} onChange={e => setSport(e.target.value)}>
          <option value="">All sports</option>
          {sports.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Gender">
        <select className={selectCls} value={gender} onChange={e => setGender(e.target.value)}>
          <option value="">All</option>
          {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </Field>
      <Field label="State">
        <select className={selectCls} value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
          <option value="">All states</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
    </div>
  )

  const proFilters = (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Country">
        <select className={selectCls} value={country} onChange={e => { setCountry(e.target.value); setLeague('') }}>
          <option value="">All countries</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="League">
        <select className={selectCls} value={league} onChange={e => setLeague(e.target.value)}>
          <option value="">All leagues</option>
          {leagues.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </Field>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* College / Pro toggle + My Target List */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-xl bg-emerald-900/5 p-1">
          <ToggleBtn active={!viewFavs && mode === 'college'} onClick={() => switchMode('college')} icon={GraduationCap} label="College" />
          <ToggleBtn active={!viewFavs && mode === 'pro'} onClick={() => switchMode('pro')} icon={Trophy} label="Pro" />
        </div>
        <button
          onClick={() => { setViewFavs(v => !v); setPage(0) }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold press border ${
            viewFavs
              ? 'bg-emerald-800 text-white border-emerald-800'
              : 'bg-white text-emerald-900 border-emerald-900/15 hover:border-emerald-700/40'
          }`}>
          <Star size={15} className={viewFavs ? 'fill-white' : 'fill-emerald-500 text-emerald-500'} />
          My Target List{favs.size > 0 ? ` (${favs.size})` : ''}
        </button>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-950/35" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={viewFavs ? 'Search your target list…' : (mode === 'college' ? 'Search coach or school…' : 'Search club or contact…')}
            className="w-full rounded-xl border border-emerald-900/15 bg-white pl-11 pr-4 py-3 text-sm text-emerald-950 placeholder:text-emerald-950/40 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
          />
        </div>
        {!viewFavs && (
          <button onClick={() => setShowFilters(s => !s)} className="lg:hidden flex items-center gap-2 px-4 rounded-xl bg-emerald-900/5 text-emerald-950 text-sm font-semibold">
            <Filter size={16} /> Filters
          </button>
        )}
      </div>

      {/* Filters (hidden in target-list view) */}
      {!viewFavs && (
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block bg-white border border-emerald-900/10 rounded-2xl p-4`}>
          {mode === 'college' ? collegeFilters : proFilters}
          {anyFilter && (
            <button onClick={clearAll} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900">
              <X size={13} /> Clear filters
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <p className="text-emerald-950/55">
          {loading && firstLoad.current
            ? 'Loading…'
            : viewFavs
              ? <><span className="font-semibold text-emerald-950">{count.toLocaleString()}</span> in your target list</>
              : <><span className="font-semibold text-emerald-950">{count.toLocaleString()}</span> {mode === 'college' ? 'coaches' : 'contacts'}</>}
        </p>
        {loading && !firstLoad.current && <Loader2 size={15} className="animate-spin text-emerald-700" />}
      </div>

      <div className="space-y-2">
        {rows.map(c => {
          const isFav = favs.has(c.id)
          const isPro = c.category === 'pro'
          return (
            <div key={c.id} className="flex items-center gap-3 bg-white border border-emerald-900/10 rounded-2xl px-4 py-3 hover:border-emerald-700/30 hover:shadow-[0_6px_22px_rgba(6,78,59,0.07)] lift animate-rise-in">
              {/* Star / target toggle */}
              <button
                onClick={() => toggleFav(c.id)}
                title={isFav ? 'Remove from target list' : 'Add to target list'}
                aria-pressed={isFav}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-emerald-900/5 press">
                <Star size={18} className={isFav ? 'fill-emerald-500 text-emerald-500' : 'text-emerald-900/30 hover:text-emerald-700'} />
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-emerald-950 font-semibold text-sm truncate">{c.coach || '—'}</p>
                <p className="text-emerald-950/55 text-xs truncate">
                  {c.role}{c.role && (c.school ? ' · ' : '')}{c.school}
                </p>
                <p className="text-emerald-950/40 text-[11px] mt-0.5 truncate">
                  {!isPro
                    ? [c.sport && `${c.gender ?? ''} ${c.sport}`.trim(), c.division, c.conference, c.state].filter(Boolean).join('  ·  ')
                    : [c.division, c.country].filter(Boolean).join('  ·  ')}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {c.phone && (
                  <a href={`tel:${c.phone.replace(/\s/g, '')}`} title={`Call ${c.phone}`}
                     className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-900/5 text-emerald-800 text-xs font-semibold hover:bg-emerald-900/10 press">
                    <Phone size={14} /> <span className="hidden md:inline">Call</span>
                  </a>
                )}
                {isPro && (
                  <span title="Message translator — coming soon"
                     className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-900/5 text-emerald-950/40 text-xs font-semibold cursor-not-allowed select-none">
                    <Languages size={14} /> <span className="hidden md:inline">Translate</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-700 text-[10px] font-bold uppercase tracking-wide">Soon</span>
                  </span>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} title={`Email ${c.email}`}
                     className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-900/20 press">
                    <Mail size={14} /> <span className="hidden sm:inline">Email</span>
                  </a>
                )}
              </div>
            </div>
          )
        })}

        {!loading && rows.length === 0 && (
          <div className="bg-white border border-emerald-900/10 rounded-3xl p-12 text-center">
            {viewFavs ? (
              <>
                <Star size={36} className="text-emerald-900/20 mx-auto mb-3" />
                <p className="text-emerald-950/55">Your target list is empty. Tap the <span className="font-semibold text-emerald-700">★</span> on any school to add it to your list.</p>
              </>
            ) : (
              <>
                <Search size={36} className="text-emerald-900/20 mx-auto mb-3" />
                <p className="text-emerald-950/55">No {mode === 'college' ? 'coaches' : 'contacts'} match those filters. Try widening your search.</p>
              </>
            )}
          </div>
        )}
      </div>

      {count > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-2">
          <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white border border-emerald-900/10 text-sm font-semibold text-emerald-950 disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-700/40 press">
            <ChevronLeft size={16} /> Prev
          </button>
          <p className="text-xs text-emerald-950/55">Page {page + 1} of {totalPages.toLocaleString()}</p>
          <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white border border-emerald-900/10 text-sm font-semibold text-emerald-950 disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-700/40 press">
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {translateFor && (
        <TranslatorModal
          contact={{
            coach: translateFor.coach,
            school: translateFor.school,
            email: translateFor.email,
            language: translateFor.language,
            country: translateFor.country,
          }}
          onClose={() => setTranslateFor(null)}
        />
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-emerald-950/50 mb-1">{label}</label>
      {children}
    </div>
  )
}

function ToggleBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ size?: number }>; label: string }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold press ${
        active ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-950/55 hover:text-emerald-950'
      }`}>
      <Icon size={15} /> {label}
    </button>
  )
}
