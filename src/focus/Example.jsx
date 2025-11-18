import { useState } from 'react'
import { useFocusTimer } from './index'
import { FocusAnimationWrapper } from './index'

export default function FocusAnimationsExample() {
  const { timeLeft, duration, progress, isRunning, start, pause, reset } = useFocusTimer(5 * 60)
  const [mode, setMode] = useState('ice')
  const [isBreak, setIsBreak] = useState(false)
  const [allowInteraction, setAllowInteraction] = useState(true)
  const [streakLevel, setStreakLevel] = useState(1)
  const [interruptionDetected, setInterruptionDetected] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6">
        <div className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/40">
          <FocusAnimationWrapper
            mode={mode}
            progress={progress}
            isBreak={isBreak}
            allowInteraction={allowInteraction}
            streakLevel={streakLevel}
            interruptionDetected={interruptionDetected}
          />
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <h2 className="text-xl font-semibold mb-3">Controls</h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {['ice','flight','orbit','water ripple','growth','drift'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-2 rounded border ${mode===m? 'bg-indigo-600 border-indigo-500':'bg-white/10 border-white/10'}`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-slate-300">Break</span>
            <input type="checkbox" checked={isBreak} onChange={(e)=>setIsBreak(e.target.checked)} />
            <span className="ml-4 text-sm text-slate-300">Allow Interaction</span>
            <input type="checkbox" checked={allowInteraction} onChange={(e)=>setAllowInteraction(e.target.checked)} />
          </div>

          {mode === 'growth' && (
            <div className="mb-3">
              <label className="text-sm text-slate-300">Streak Level: {streakLevel}</label>
              <input type="range" min="1" max="5" value={streakLevel} onChange={(e)=>setStreakLevel(parseInt(e.target.value))} className="w-full" />
            </div>
          )}

          {mode === 'drift' && (
            <div className="mb-3">
              <label className="text-sm text-slate-300">Interruption Detected</label>
              <input type="checkbox" className="ml-2" checked={interruptionDetected} onChange={(e)=>setInterruptionDetected(e.target.checked)} />
            </div>
          )}

          <div className="mt-4">
            <div className="text-sm text-slate-400">Timer</div>
            <div className="text-4xl font-mono">{String(Math.floor(timeLeft/60)).padStart(2,'0')}:{String(timeLeft%60).padStart(2,'0')}</div>
            <div className="w-full h-2 bg-white/10 rounded mt-2 overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${progress*100}%` }} />
            </div>
            <div className="flex gap-2 mt-3">
              {!isRunning ? (
                <button onClick={start} className="px-3 py-2 rounded bg-green-600">Start</button>
              ) : (
                <button onClick={pause} className="px-3 py-2 rounded bg-yellow-600">Pause</button>
              )}
              <button onClick={() => reset(duration)} className="px-3 py-2 rounded bg-red-600">Reset</button>
              <button onClick={() => reset(10 * 60)} className="px-3 py-2 rounded bg-slate-700">10:00</button>
              <button onClick={() => reset(25 * 60)} className="px-3 py-2 rounded bg-slate-700">25:00</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
