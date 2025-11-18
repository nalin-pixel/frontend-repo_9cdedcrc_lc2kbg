import IceMode from './IceMode'
import FlightMode from './FlightMode'
import OrbitMode from './OrbitMode'
import RippleMode from './RippleMode'
import GrowthMode from './GrowthMode'
import DriftMode from './DriftMode'

export default function FocusAnimationWrapper({ mode = 'ice', progress = 0, isBreak = false, allowInteraction = true, streakLevel = 1, interruptionDetected = false }) {
  const key = mode.toLowerCase()
  switch (key) {
    case 'ice':
    case 'ice melting':
      return <IceMode progress={progress} isBreak={isBreak} />
    case 'flight':
      return <FlightMode progress={progress} isBreak={isBreak} />
    case 'orbit':
      return <OrbitMode progress={progress} isBreak={isBreak} />
    case 'ripple':
    case 'water ripple':
      return <RippleMode progress={progress} allowInteraction={allowInteraction} />
    case 'growth':
      return <GrowthMode progress={progress} streakLevel={streakLevel} />
    case 'drift':
      return <DriftMode progress={progress} interruptionDetected={interruptionDetected} />
    default:
      return <div className="w-full h-full grid place-content-center text-slate-300">Unknown mode: {mode}</div>
  }
}
