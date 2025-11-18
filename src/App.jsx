import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import Spline from '@splinetool/react-spline'
import { Play, Pause, Square, Timer, LogIn, UserPlus, Calendar, Rocket, MessageCircle, Settings, Gauge, FolderUp, Sun, Moon } from 'lucide-react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useToken() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const save = (t) => { localStorage.setItem('token', t); setToken(t) }
  const clear = () => { localStorage.removeItem('token'); setToken('') }
  return { token, save, clear }
}

function Layout({ children }){
  const [dark, setDark] = useState(true)
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-slate-900/50 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="font-bold tracking-tight text-xl">FocusFlow</Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/focus">Focus Modes</Link>
            <Link to="/tasks">Tasks</Link>
            <Link to="/groups">Groups</Link>
            <Link to="/ai">AI Tools</Link>
            <Link to="/settings">Settings</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={()=>setDark(d=>!d)} className="p-2 rounded-md hover:bg-white/10" aria-label="toggle theme">{dark? <Sun size={16}/> : <Moon size={16}/>}</button>
            <Link to="/auth" className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500">Login</Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}

function Hero(){
  return (
    <section className="relative h-[60vh] overflow-hidden">
      <Spline scene="https://prod.spline.design/4cHQr84zOGAHOehh/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      <div className="absolute inset-0 grid place-content-center text-center">
        <h1 className="text-4xl md:text-6xl font-semibold drop-shadow">Find your flow</h1>
        <p className="mt-3 text-slate-300">Immersive timers, AI scheduling, study groups and real‑time focus — all in one place.</p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link to="/focus" className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 inline-flex items-center gap-2"><Rocket size={16}/> Start Focusing</Link>
          <Link to="/dashboard" className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">View Dashboard</Link>
        </div>
      </div>
    </section>
  )
}

function Auth(){
  const nav = useNavigate()
  const { save } = useToken()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const submit = async (e)=>{
    e.preventDefault()
    const url = mode==='login'? '/api/auth/login' : '/api/auth/signup'
    const res = await fetch(`${API_BASE}${url}`,{ method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if(data.access_token){ save(data.access_token); nav('/dashboard') }
    else alert(data.detail || 'Error')
  }
  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">{mode==='login'? 'Welcome back' : 'Create account'}</h2>
      <form onSubmit={submit} className="space-y-3">
        {mode==='signup' && (
          <input className="w-full px-3 py-2 rounded bg-white/10" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
        )}
        <input className="w-full px-3 py-2 rounded bg-white/10" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
        <input type="password" className="w-full px-3 py-2 rounded bg-white/10" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
        <button className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-500">{mode==='login'? 'Login' : 'Sign up'}</button>
      </form>
      <div className="mt-3 text-sm">
        {mode==='login'? (
          <button className="text-indigo-400" onClick={()=>setMode('signup')}>Need an account? Sign up</button>
        ): (
          <button className="text-indigo-400" onClick={()=>setMode('login')}>Have an account? Login</button>
        )}
      </div>
    </div>
  )
}

function Dashboard(){
  const { token } = useToken()
  const [summary, setSummary] = useState(null)
  useEffect(()=>{ if(token){ fetch(`${API_BASE}/api/stats/summary`,{ headers:{ Authorization: `Bearer ${token}`}}).then(r=>r.json()).then(setSummary)} },[token])
  return (
    <div className="max-w-6xl mx-auto p-6">
      <Hero/>
      <h2 className="mt-6 text-2xl font-semibold">Today</h2>
      {summary && (
        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          <Card title="Hours Focused" value={summary.hours_focused_today} />
          <Card title="Tasks Done" value={summary.tasks_completed_today} />
          <Card title="Streak Days" value={summary.streak_days} />
        </div>
      )}
    </div>
  )
}

function Card({ title, value }){
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="text-sm text-slate-400">{title}</div>
      <div className="text-3xl font-semibold">{value}</div>
    </div>
  )
}

function FocusModes(){
  const { token } = useToken()
  const [mode, setMode] = useState('Ice Melting')
  const [seconds, setSeconds] = useState(25*60)
  const [running, setRunning] = useState(false)
  const [sessionId, setSessionId] = useState(null)

  useEffect(()=>{ if(!running) return; const id = setInterval(()=> setSeconds(s=> s>0? s-1: 0), 1000); return ()=>clearInterval(id)},[running])

  const start = async ()=>{
    setRunning(true)
    const res = await fetch(`${API_BASE}/api/sessions/start`,{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ mode, estimated_minutes: Math.ceil(seconds/60) }) })
    const data = await res.json(); setSessionId(data.session_id)
  }
  const end = async ()=>{
    setRunning(false)
    if(sessionId){ await fetch(`${API_BASE}/api/sessions/${sessionId}/end`,{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ interruptions: 0 }) }) }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Immersive Focus</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {['Ice Melting','Flight','Orbit','Water Ripple','Growth','Drift'].map(m=> (
          <button key={m} className={`px-3 py-1.5 rounded-md border ${mode===m? 'bg-indigo-600 border-indigo-500':'border-white/10 bg-white/5'}`} onClick={()=>setMode(m)}>{m}</button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 grid place-content-center">
          <AnimatedCanvas mode={mode} progress={1 - (seconds/(25*60))} />
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-sm text-slate-400 mb-2">Timer</div>
          <div className="text-5xl font-mono">{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</div>
          <div className="mt-4 flex gap-2">
            {!running? <button onClick={start} className="px-3 py-2 rounded-md bg-green-600 inline-flex items-center gap-2"><Play size={16}/> Start</button> : <button onClick={()=>setRunning(false)} className="px-3 py-2 rounded-md bg-yellow-600 inline-flex items-center gap-2"><Pause size={16}/> Pause</button>}
            <button onClick={end} className="px-3 py-2 rounded-md bg-red-600 inline-flex items-center gap-2"><Square size={16}/> End</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnimatedCanvas({ mode, progress }){
  // Placeholder animations using CSS / simple SVG
  const style = 'w-full h-full grid place-content-center text-2xl text-slate-200'
  return (
    <div className={style}>
      <div className="opacity-70">{mode} Animation</div>
      <div className="w-64 h-2 bg-white/20 rounded overflow-hidden mt-3"><div className="h-full bg-indigo-500" style={{ width: `${Math.floor(progress*100)}%` }} /></div>
    </div>
  )
}

function Tasks(){
  const { token } = useToken()
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState({ title:'', subject:'', priority:'medium', estimated_minutes:25 })
  const load = ()=> fetch(`${API_BASE}/api/tasks`,{ headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setTasks)
  useEffect(()=>{ if(token) load() },[token])
  const add = async ()=>{ await fetch(`${API_BASE}/api/tasks`,{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify(form) }); setForm({ title:'', subject:'', priority:'medium', estimated_minutes:25 }); load() }
  const remove = async (id)=>{ await fetch(`${API_BASE}/api/tasks/${id}`,{ method:'DELETE', headers:{ Authorization:`Bearer ${token}` } }); load() }
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Tasks</h2>
      <div className="flex gap-2 mb-4">
        <input className="flex-1 px-3 py-2 rounded bg-white/10" placeholder="Task title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
        <button onClick={add} className="px-3 rounded bg-indigo-600">Add</button>
      </div>
      <ul className="space-y-2">
        {tasks.map(t=> (
          <li key={t.id} className="p-3 rounded bg-white/5 flex items-center justify-between">
            <div>
              <div className="font-medium">{t.title}</div>
              <div className="text-xs text-slate-400">{t.subject || 'General'} · {t.priority}</div>
            </div>
            <button onClick={()=>remove(t.id)} className="text-red-400">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Groups(){
  const [groups, setGroups] = useState([])
  useEffect(()=>{ fetch(`${API_BASE}/api/groups`).then(r=>r.json()).then(setGroups)},[])
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Study Groups</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {groups.map(g=> (
          <div key={g.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="font-semibold">{g.name}</div>
            <div className="text-sm text-slate-400">{g.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AITools(){
  const { token } = useToken()
  const [result, setResult] = useState('')
  const call = async (path)=>{ const r = await fetch(`${API_BASE}${path}`,{ method:'POST', headers:{ Authorization:`Bearer ${token}` } }); const d = await r.json(); setResult(JSON.stringify(d,null,2)) }
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">AI Tools</h2>
      <div className="flex gap-2 flex-wrap">
        <button onClick={()=>call('/api/ai/scheduler/plan')} className="px-3 py-1.5 rounded bg-indigo-600">Plan</button>
        <button onClick={()=>call('/api/ai/scheduler/rebalance')} className="px-3 py-1.5 rounded bg-indigo-600">Rebalance</button>
        <button onClick={()=>call('/api/ai/notes/summarize')} className="px-3 py-1.5 rounded bg-indigo-600">Summarize</button>
        <button onClick={()=>call('/api/ai/notes/flashcards')} className="px-3 py-1.5 rounded bg-indigo-600">Flashcards</button>
        <button onClick={()=>call('/api/ai/notes/quizzes')} className="px-3 py-1.5 rounded bg-indigo-600">Quizzes</button>
        <button onClick={()=>call('/api/ai/notes/formulas')} className="px-3 py-1.5 rounded bg-indigo-600">Formulas</button>
      </div>
      <pre className="mt-4 p-4 rounded bg-black/50 border border-white/10 text-xs overflow-auto">{result}</pre>
    </div>
  )
}

function SettingsPage(){
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">Theme, notifications and preferences.</div>
    </div>
  )
}

function RouterApp(){
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<>
          <Hero/>
          <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-3 gap-4">
            <Card title="Immersive Focus" value={<Link to="/focus" className="text-indigo-400">Start a session →</Link>} />
            <Card title="AI Scheduler" value={<Link to="/ai" className="text-indigo-400">Plan your week →</Link>} />
            <Card title="Groups" value={<Link to="/groups" className="text-indigo-400">Find peers →</Link>} />
          </div>
        </>} />
        <Route path="/auth" element={<Auth/>} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/focus" element={<FocusModes/>} />
        <Route path="/tasks" element={<Tasks/>} />
        <Route path="/groups" element={<Groups/>} />
        <Route path="/ai" element={<AITools/>} />
        <Route path="/settings" element={<SettingsPage/>} />
      </Routes>
    </Layout>
  )
}

export default RouterApp
