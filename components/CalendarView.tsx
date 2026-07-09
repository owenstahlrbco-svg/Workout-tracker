'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight, Dumbbell, FileText } from 'lucide-react'

interface Workout {
  id: string
  date: string
  notes: string
  workout_sets: { id: string; exercise_name: string }[]
}

interface ProgramDay {
  id: string
  date: string
  content: string
}

interface Props {
  workouts: Workout[]
  programDays: ProgramDay[]
}

export default function CalendarView({ workouts, programDays }: Props) {
  const [current, setCurrent] = useState(new Date())
  const [selected, setSelected] = useState<Date | null>(null)

  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) })
  const startDow = startOfMonth(current).getDay()

  const selectedWorkout = selected ? workouts.find(w => isSameDay(new Date(w.date), selected)) : null
  const selectedProgram = selected ? programDays.find(p => isSameDay(new Date(p.date), selected)) : null

  return (
    <div className="space-y-4">
      <div className="bg-white border border-emerald-900/10 rounded-3xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold text-emerald-950">
            {format(current, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrent(subMonths(current, 1))}
              className="p-2 rounded-xl bg-emerald-900/5 hover:bg-emerald-900/10 text-emerald-950/60 hover:text-emerald-950 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrent(new Date())}
              className="px-3 py-1.5 rounded-xl bg-emerald-900/5 hover:bg-emerald-900/10 text-emerald-950/60 hover:text-emerald-950 text-sm transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrent(addMonths(current, 1))}
              className="p-2 rounded-xl bg-emerald-900/5 hover:bg-emerald-900/10 text-emerald-950/60 hover:text-emerald-950 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-semibold uppercase tracking-wider text-emerald-950/40 py-2">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for start offset */}
          {Array.from({ length: startDow }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map(day => {
            const hasWorkout = workouts.some(w => isSameDay(new Date(w.date), day))
            const hasProgram = programDays.some(p => isSameDay(new Date(p.date), day))
            const isSelected = selected ? isSameDay(day, selected) : false
            const todayDay = isToday(day)

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelected(isSelected ? null : day)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-colors p-1 ${
                  isSelected
                    ? 'bg-emerald-800 text-white'
                    : todayDay
                    ? 'bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600'
                    : 'hover:bg-emerald-900/5 text-emerald-950/75'
                }`}
              >
                <span className="font-medium">{format(day, 'd')}</span>
                <div className="flex gap-0.5 mt-0.5">
                  {hasWorkout && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-600'}`} />}
                  {hasProgram && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-emerald-900/10">
          <div className="flex items-center gap-1.5 text-xs text-emerald-950/55">
            <span className="w-2 h-2 rounded-full bg-emerald-600" /> Logged workout
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-950/55">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Programmed day
          </div>
        </div>
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="bg-white border border-emerald-900/10 rounded-3xl p-6 space-y-4">
          <h3 className="font-display text-lg font-semibold text-emerald-950">{format(selected, 'EEEE, MMMM d')}</h3>

          {selectedWorkout ? (
            <div>
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold mb-2">
                <Dumbbell size={15} /> Logged Workout
              </div>
              <div className="space-y-1.5">
                {selectedWorkout.workout_sets?.map(s => (
                  <div key={s.id} className="text-emerald-950/80 text-sm bg-emerald-50 rounded-xl px-3 py-2">
                    {s.exercise_name}
                  </div>
                ))}
                {selectedWorkout.notes && (
                  <p className="text-emerald-950/55 text-sm mt-2 italic">{selectedWorkout.notes}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-emerald-950/45 text-sm">No workout logged for this day.</p>
          )}

          {selectedProgram && (
            <div>
              <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold mb-2">
                <FileText size={15} /> Programmed Session
              </div>
              <div className="bg-emerald-900/5 rounded-xl p-4 text-emerald-950/80 text-sm whitespace-pre-wrap">
                {selectedProgram.content}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
