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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {format(current, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrent(subMonths(current, 1))}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrent(new Date())}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrent(addMonths(current, 1))}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-zinc-500 py-2">{d}</div>
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
                className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors p-1 ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : todayDay
                    ? 'bg-zinc-700 text-white ring-2 ring-blue-500'
                    : 'hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <span className="font-medium">{format(day, 'd')}</span>
                <div className="flex gap-0.5 mt-0.5">
                  {hasWorkout && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  {hasProgram && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Logged workout
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-orange-400" /> Programmed day
          </div>
        </div>
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-white">{format(selected, 'EEEE, MMMM d')}</h3>

          {selectedWorkout ? (
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
                <Dumbbell size={15} /> Logged Workout
              </div>
              <div className="space-y-1.5">
                {selectedWorkout.workout_sets?.map(s => (
                  <div key={s.id} className="text-zinc-300 text-sm bg-zinc-800 rounded-lg px-3 py-2">
                    {s.exercise_name}
                  </div>
                ))}
                {selectedWorkout.notes && (
                  <p className="text-zinc-400 text-sm mt-2 italic">{selectedWorkout.notes}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">No workout logged for this day.</p>
          )}

          {selectedProgram && (
            <div>
              <div className="flex items-center gap-2 text-orange-400 text-sm font-medium mb-2">
                <FileText size={15} /> Programmed Session
              </div>
              <div className="bg-zinc-800 rounded-lg p-4 text-zinc-300 text-sm whitespace-pre-wrap">
                {selectedProgram.content}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
