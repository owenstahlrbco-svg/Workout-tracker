'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, MapPin, CalendarDays, DollarSign, ExternalLink, Filter, X, Loader2, Tent } from 'lucide-react'

interface Camp {
  id: number
  camp_name: string
  school: string
  division: string | null
  sport: string | null
  gender: string | null
  city: string | null
  state: string | null
  date_text: string | null
  start_date: string | null
  cost: string | null
  cost_usd: number | null
  description: string | null
  register_url: string | null
  completed: boolean | null
}

const PAGE_SIZE = 30

// US state codes -> full names, so a player can search "Texas" and not have to know "TX"
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
  MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}

export default function CampFinder() {
  const supabase = createClient()

  const [stateFilter, setStateFilter] = useState('')
  const [sport, setSport] = useState('')
  const [division, setDivision] = useState('')
  const [maxCost, setMaxCost] = useState('')
  const [upcomingOnly, setUpcomingOnly] = useState(true)

  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(0)

  const [states, setStates] = useState<string[]>([])
  const [sports, setSports] = useState<string[]>([])
  const [divisions, setDivisions] = useState<string[]>([])

  const [rows, setRows] = useState<Camp[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const firstLoad = useRef(true)

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const loadOptions = useCallback(async (st: string) => {
    const { data } = await supabase.rpc('camps_filter_options', { p_state: st || null })
    if (data) {
      setStates(data.states ?? [])
      setSports(data.sports ?? [])
      setDivisions(data.divisions ?? [])
    }
  }, [supabase])

  useEffect(() => { loadOptions(stateFilter) }, [stateFilter, loadOptions])
  useEffect(() => { setPage(0) }, [stateFilter, sport, division, maxCost, upcomingOnly])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      let q = supabase
        .from('camps')
        .select('*', { count: 'exact' })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

      if (stateFilter) q = q.eq('state', stateFilter)
      if (sport) q = q.eq('sport', sport)
      if (division) q = q.eq('division', division)
      if (maxCost) q = q.lte('cost_usd', Number(maxCost))
      if (upcomingOnly) {
        // keep camps that are still ahead of us, plus camps whose date we couldn't parse
        const today = new Date().toISOString().slice(0, 10)
        q = q.or(`start_date.gte.${today},start_date.is.null`)
      }
      if (debounced.trim()) {
        const s = debounced.trim().replace(/[%,()]/g, '')
        q = q.or(`camp_name.ilike.%${s}%,school.ilike.%${s}%,city.ilike.%${s}%`)
      }
      // soonest first, undated last
      q = q.order('start_date', { ascending: true, nullsFirst: false }).order('school', { ascending: true })

      const { data, count: c } = await q
      if (cancelled) return
      setRows((data as Camp[]) ?? [])
      setCount(c ?? 0)
      setLoading(false)
      firstLoad.current = false
    }
    run()
    return () => { cancelled = true }
  }, [supabase, stateFilter, sport, division, maxCost, upcomingOnly, debounced, page])

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const anyFilter = stateFilter || sport || division || maxCost || search

  function clearAll() {
    setStateFilter(''); setSport(''); setDivision(''); setMaxCost(''); setSearch(''); setPage(0)
  }

  const selectCls = 'w-full rounded-xl border border-emerald-900/12 bg-white px-3 py-2 text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600/30'

  return (
    <div className="space-y-4">
      {/* search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-950/35" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search camps, schools, or cities…"
            className="w-full rounded-2xl border border-emerald-900/12 bg-white pl-10 pr-4 py-3 text-sm text-emerald-950 placeholder:text-emerald-950/35 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className="rounded-2xl border border-emerald-900/12 bg-white px-4 py-3 text-sm font-medium text-emerald-950 hover:bg-emerald-900/5 flex items-center gap-2"
        >
          <Filter size={15} /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="rounded-2xl border border-emerald-900/12 bg-white p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-emerald-950/60 mb-1.5">State</label>
            <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className={selectCls}>
              <option value="">All states</option>
              {states.map(s => <option key={s} value={s}>{STATE_NAMES[s] ?? s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-emerald-950/60 mb-1.5">Sport</label>
            <select value={sport} onChange={e => setSport(e.target.value)} className={selectCls}>
              <option value="">All sports</option>
              {sports.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-emerald-950/60 mb-1.5">Division</label>
            <select value={division} onChange={e => setDivision(e.target.value)} className={selectCls}>
              <option value="">All divisions</option>
              {divisions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-emerald-950/60 mb-1.5">Max price</label>
            <select value={maxCost} onChange={e => setMaxCost(e.target.value)} className={selectCls}>
              <option value="">Any price</option>
              <option value="75">Under $75</option>
              <option value="150">Under $150</option>
              <option value="300">Under $300</option>
              <option value="600">Under $600</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-emerald-950/70 sm:col-span-2">
            <input type="checkbox" checked={upcomingOnly} onChange={e => setUpcomingOnly(e.target.checked)}
              className="rounded border-emerald-900/20" />
            Upcoming camps only
          </label>
          {anyFilter ? (
            <button onClick={clearAll} className="justify-self-start text-sm text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5">
              <X size={14} /> Clear all
            </button>
          ) : null}
        </div>
      )}

      <p className="text-sm text-emerald-950/50">
        {loading && firstLoad.current ? 'Loading camps…' : `${count.toLocaleString()} camp${count === 1 ? '' : 's'}`}
      </p>

      {loading ? (
        <div className="flex justify-center py-14"><Loader2 className="animate-spin text-emerald-700" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-emerald-900/12 bg-white p-10 text-center">
          <Tent size={26} className="text-emerald-700/50 mx-auto mb-3" />
          <p className="text-emerald-950/60">No camps match those filters yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map(c => (
            <div key={c.id} className="rounded-2xl border border-emerald-900/12 bg-white p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-emerald-950 leading-snug">{c.camp_name}</h3>
                  <p className="text-sm text-emerald-950/60 mt-0.5">{c.school}</p>
                </div>
                {c.sport ? (
                  <span className="shrink-0 rounded-full bg-emerald-900/6 px-2.5 py-1 text-xs font-medium text-emerald-800">
                    {c.sport}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-emerald-950/65">
                {(c.city || c.state) ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-emerald-700/70" />
                    {[c.city, c.state].filter(Boolean).join(', ')}
                  </span>
                ) : null}
                {c.date_text ? (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-emerald-700/70" />{c.date_text}
                  </span>
                ) : null}
                {c.cost ? (
                  <span className="flex items-center gap-1.5">
                    <DollarSign size={14} className="text-emerald-700/70" />{c.cost}
                  </span>
                ) : null}
              </div>

              {c.description ? (
                <p className="text-sm text-emerald-950/55 line-clamp-2">{c.description}</p>
              ) : null}

              <div className="flex items-center gap-3 mt-auto pt-1">
                {c.register_url ? (
                  <a href={c.register_url} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5">
                    Camp details <ExternalLink size={13} />
                  </a>
                ) : null}
                {c.division ? <span className="text-xs text-emerald-950/40">{c.division}</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            className="rounded-xl border border-emerald-900/12 bg-white px-4 py-2 text-sm disabled:opacity-40">
            Previous
          </button>
          <span className="text-sm text-emerald-950/50">Page {page + 1} of {totalPages}</span>
          <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}
            className="rounded-xl border border-emerald-900/12 bg-white px-4 py-2 text-sm disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  )
}
