'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'
import { TrendingUp } from 'lucide-react'

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
      date: format(new Date(date), 'MMM d'),
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
        <TrendingUp size={40} className="text-zinc-600 mx-auto mb-4" />
        <p className="text-zinc-400">No workout data yet. Log a workout to see your progress here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* PR Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800">
          <h2 className="font-semibold text-white">Personal Records</h2>
        </div>
        <div className="divide-y divide-zinc-800">
          {prs.map(({ exercise, max, unit }) => (
            <div key={exercise} className="flex items-center justify-between px-5 py-3">
              <span className="text-zinc-300 text-sm">{exercise}</span>
              <span className="text-white font-semibold text-sm">{max} {unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-white">Weight Over Time</h2>
            {chartData.length > 0 && (
              <p className="text-zinc-400 text-sm mt-0.5">
                Current: <span className="text-white font-medium">{latestWeight} lbs</span>
                {' · '}PR: <span className="text-green-400 font-medium">{maxWeight} lbs</span>
              </p>
            )}
          </div>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {exercises.map(ex => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
        </div>

        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                labelStyle={{ color: '#a1a1aa' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-zinc-500">
            Log {selected} at least twice to see a chart.
          </div>
        )}
      </div>
    </div>
  )
}
