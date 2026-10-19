import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Plus, Trash2 } from 'lucide-react'
import { api, errMsg } from '../api'
import { Badge, Btn, Card, Empty, ErrorBox, Loading, inputCls } from '../components/ui'
import { fmtDay, isoDate } from '../utils'

const KIND = {
  meeting: 'bg-brand-soft text-brand',
  task: 'bg-amber-50 text-amber-800',
  todo: 'bg-emerald-50 text-emerald-700',
}

function monthBounds(cursor) {
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
  const pad = (start.getDay() + 6) % 7
  const cells = []
  for (let i = 0; i < pad; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() - (pad - i))
    cells.push({ date: d, inMonth: false })
  }
  for (let d = 1; d <= end.getDate(); d++) cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), d), inMonth: true })
  while (cells.length % 7) {
    const last = cells[cells.length - 1].date
    const n = new Date(last)
    n.setDate(n.getDate() + 1)
    cells.push({ date: n, inMonth: false })
  }
  return { start: cells[0].date, end: cells[cells.length - 1].date, cells }
}

export default function Planner() {
  const [cursor, setCursor] = useState(() => new Date())
  const [events, setEvents] = useState([])
  const [todos, setTodos] = useState([])
  const [err, setErr] = useState('')
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [busy, setBusy] = useState(false)
  const [picked, setPicked] = useState(isoDate(new Date()))

  const bounds = useMemo(() => monthBounds(cursor), [cursor])

  const load = useCallback(async () => {
    setErr('')
    try {
      const [cal, td] = await Promise.all([
        api.get('/calendar/', { params: { start: isoDate(bounds.start), end: isoDate(bounds.end) } }),
        api.get('/todos/'),
      ])
      setEvents(cal.data)
      setTodos(td.data)
    } catch (e) {
      setErr(errMsg(e))
    }
  }, [bounds.start, bounds.end])

  useEffect(() => { load() }, [load])

  const byDay = useMemo(() => {
    const m = {}
    for (const e of events) (m[e.date] ||= []).push(e)
    return m
  }, [events])

  const addTodo = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    try {
      await api.post('/todos/', { title: title.trim(), due_date: due || picked || null })
      setTitle('')
      await load()
    } catch (ex) {
      setErr(errMsg(ex))
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (t) => {
    try {
      await api.patch(`/todos/${t.id}/`, { is_done: !t.is_done })
      await load()
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const remove = async (t) => {
    try {
      await api.delete(`/todos/${t.id}/`)
      await load()
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const dayEvents = byDay[picked] || []
  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Planner</h1>
        <p className="mt-1 text-sm text-slate-500">Schedule meetings and deadlines on the calendar. Keep a personal to-do list that only you see.</p>
      </div>
      <ErrorBox msg={err} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title={monthLabel} action={
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>Prev</button>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs" onClick={() => setCursor(new Date())}>Today</button>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>Next</button>
          </div>
        }>
          {!events && <Loading />}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wider text-slate-400">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {bounds.cells.map(({ date, inMonth }) => {
              const key = isoDate(date)
              const items = byDay[key] || []
              const on = key === picked
              return (
                <button
                  key={key}
                  onClick={() => { setPicked(key); setDue(key) }}
                  className={`min-h-24 rounded-xl border p-1.5 text-left transition ${
                    on ? 'border-brand bg-brand-soft' : 'border-slate-100 bg-white hover:border-slate-200'
                  } ${inMonth ? '' : 'opacity-40'}`}
                >
                  <div className={`text-xs font-semibold ${isoDate(new Date()) === key ? 'text-brand' : 'text-navy-900'}`}>{date.getDate()}</div>
                  <div className="mt-1 space-y-0.5">
                    {items.slice(0, 3).map((e, i) => (
                      <div key={`${e.kind}-${e.id}-${i}`} className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${KIND[e.kind]}`}>
                        {e.time ? `${e.time} ` : ''}{e.title}
                      </div>
                    ))}
                    {items.length > 3 && <div className="text-[10px] text-slate-400">+{items.length - 3}</div>}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card title={`On ${fmtDay(picked)}`}>
            {dayEvents.length === 0 ? <Empty text="Nothing scheduled this day." /> : (
              <ul className="space-y-2">
                {dayEvents.map((e, i) => (
                  <li key={`${e.kind}-${e.id}-${i}`} className="rounded-xl border border-slate-200 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${KIND[e.kind]}`}>{e.kind}</span>
                      {e.status && <Badge value={e.status} />}
                    </div>
                    {e.link ? <Link to={e.link} className="mt-1 block font-medium text-navy-900 hover:text-brand">{e.title}</Link> : <div className="mt-1 font-medium">{e.title}</div>}
                    {e.time && <div className="text-xs text-slate-500">{e.time}</div>}
                    {e.assignee && <div className="text-xs text-slate-500">{e.assignee}</div>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="My to-do list">
            <form onSubmit={addTodo} className="mb-4 space-y-2">
              <input className={inputCls} placeholder="Add a personal task…" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="flex gap-2">
                <input type="date" className={inputCls} value={due} onChange={(e) => setDue(e.target.value)} />
                <Btn type="submit" disabled={busy}><Plus size={16} /></Btn>
              </div>
            </form>
            {todos.length === 0 ? <Empty text="Your personal list is empty." /> : (
              <ul className="space-y-2">
                {todos.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2">
                    <button
                      onClick={() => toggle(t)}
                      className={`grid h-7 w-7 place-items-center rounded-lg border ${t.is_done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 text-slate-400'}`}
                    >
                      <Check size={14} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-sm ${t.is_done ? 'text-slate-400 line-through' : 'text-navy-900'}`}>{t.title}</div>
                      {t.due_date && <div className="text-[11px] text-slate-400">{fmtDay(t.due_date)}</div>}
                    </div>
                    <button onClick={() => remove(t)} className="p-1 text-slate-300 hover:text-red-600"><Trash2 size={14} /></button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
