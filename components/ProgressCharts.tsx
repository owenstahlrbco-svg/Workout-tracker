'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'
import { TrendingUp } from 'lucide-react'
import { parseDate } from '@/lib/dates'

interface Set {
  id: string
  exercise_name: string
  sets: number
  reps: number
  weight: number
  unit: string
  workouts: { date: string }
}

interface Props {
  sets: Set[]
  exercises: string[]
}

export default function ProgressCharts({ sets, exercises }: Props) {
  const [selected, setSelected] = useState(exercises[0] ?? '')

  const filtered = sets.filter(s => s.exercise_name === selected)

  // Group by date — take the max weight per day
  const byDate: Record<string, number> = {}
  filtered.forEach(s => {
    const d = s.workouts.date
    if (!byDate[d] || s.weight > byDate[d]) byDate[d] = s.weight
  })

  const chartData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, weight]) => ({
      date: format(parseDate(date), 'MMM d'),
      weight,
    }))

  const maxWeight = chartData.length > 0 ? Math.max(...chartData.map(d => d.weight)) : 0
  const latestWeight = chartData[chartData.length - 1]?.weight ?? 0

  // PRs per exercise
  const prs = exercises.map(ex => {
    const exSets = sets.filter(s => s.exercise_name === ex)
    const max = exSets.length > 0 ? Math.max(...exSets.map(s => s.weight)) : 0
    const unit = exSets[0]?.unit ?? 'lbs'
    return { exercise: ex, max, unit }
  }).sort((a, b) => b.max - a.max)

  if (exercises.length === 0) {
    return (
      <div className="bg-white border border-emerald-900/10 rounded-3xl p-12 text-center">
        <TrendingUp size={40} className="text-emerald-900/25 mx-auto mb-4" />
        <p className="text-emerald-950/55">No workout data yet. Log a workout to see your progress here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Line Chart */}
      <div className="bg-white border border-emerald-900/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-emerald-950">Weight Over Time</h2>
            {chartData.length > 0 && (
              <p className="text-emerald-950/55 text-sm mt-0.5">
                Current: <span className="text-emerald-950 font-semibold">{latestWeight} lbs</span>
                {' · '}PR: <span className="text-emerald-700 font-semibold">{maxWeight} lbs</span>
              </p>
            )}
          </div>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="bg-white border border-emerald-900/15 rounded-xl px-3 py-1.5 text-emerald-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            {exercises.map(ex => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
        </div>

        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e8df" />
              <XAxis dataKey="date" tick={{ fill: '#5d7268', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5d7268', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #d9e8df', borderRadius: '12px', boxShadow: '0 4px 20px rgba(6,78,59,0.1)' }}
                labelStyle={{ color: '#5d7268' }}
                itemStyle={{ color: '#047857' }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#047857"
                strokeWidth={2.5}
                dot={{ fill: '#047857', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-emerald-950/45">
            Log {selected} at least twice to see a chart.
          </div>
        )}
      </div>

      {/* PR Table */}
      <div className="bg-white border border-emerald-900/10 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-emerald-900/10">
          <h2 className="font-display text-lg font-semibold text-emerald-950">Personal Records</h2>
        </div>
        <div className="divide-y divide-emerald-900/10">
          {prs.map(({ exercise, max, unit }) => (
            <div key={exercise} className="flex items-center justify-between px-5 py-3">
              <span className="text-emerald-950/75 text-sm">{exercise}</span>
              <span className="text-emerald-950 font-semibold text-sm">{max} {unit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
