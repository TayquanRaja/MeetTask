import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { api, errMsg } from '../api'
import { Badge, Btn, Card, Empty, ErrorBox, Loading, inputCls } from '../components/ui'
import { fmtDay } from '../utils'

const PRI = ['LOW', 'MEDIUM', 'HIGH']

export default function ProjectDetail() {
  const { id } = useParams()
  const [p, setP] = useState(null)
  const [employees, setEmployees] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [f, setF] = useState({ title: '', description: '', priority: 'MEDIUM', deadline: '', assignee_id: '' })

  const load = useCallback(async () => {
    try {
      const [{ data }, emp] = await Promise.all([api.get(`/projects/${id}/`), api.get('/employees/')])
      setP(data)
      setEmployees(emp.data)
    } catch (e) {
      setErr(errMsg(e))
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const addItem = async (e) => {
    e.preventDefault()
    if (!f.title.trim()) return setErr('Backlog title is required.')
    setBusy(true)
    setErr('')
    try {
      await api.post(`/projects/${id}/backlog/`, {
        title: f.title.trim(),
        description: f.description,
        priority: f.priority,
        deadline: f.deadline || null,
        assignee_id: f.assignee_id || null,
      })
      setF({ title: '', description: '', priority: 'MEDIUM', deadline: '', assignee_id: '' })
      await load()
    } catch (ex) {
      setErr(errMsg(ex))
    } finally {
      setBusy(false)
    }
  }

  const assign = async (item, assignee_id) => {
    setErr('')
    try {
      await api.patch(`/backlog/${item.id}/`, { assignee_id })
      await load()
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const remove = async (item) => {
    setErr('')
    try {
      await api.delete(`/backlog/${item.id}/`)
      await load()
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const archive = async () => {
    setErr('')
    try {
      await api.patch(`/projects/${id}/`, { status: p.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED' })
      await load()
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  if (!p) return err ? <ErrorBox msg={err} /> : <Loading />
  const s = p.stats || {}

  return (
    <div className="space-y-6">
      <Link to="/projects" className="text-sm text-brand hover:underline">← All projects</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 rounded-full" style={{ background: p.color }} />
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{p.name}</h1>
            <Badge value={p.status} />
          </div>
          {p.description && <p className="mt-2 max-w-2xl text-sm text-slate-500">{p.description}</p>}
        </div>
        <Btn variant="secondary" onClick={archive}>{p.status === 'ARCHIVED' ? 'Restore' : 'Archive'}</Btn>
      </div>

      <ErrorBox msg={err} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          ['Progress', `${s.progress || 0}%`],
          ['Done', s.done],
          ['In progress', s.in_progress],
          ['Backlog', s.backlog],
          ['Overdue', s.overdue],
        ].map(([label, v]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-slate-400">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-navy-900">{v ?? 0}</div>
          </div>
        ))}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all" style={{ width: `${s.progress || 0}%`, background: p.color }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Product backlog" className="lg:col-span-3">
          <form onSubmit={addItem} className="mb-5 grid gap-3 rounded-xl border border-dashed border-slate-200 p-4">
            <input className={inputCls} placeholder="New functionality / story" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <textarea className={`${inputCls} h-20 py-2`} placeholder="Acceptance notes (optional)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-3">
              <select className={inputCls} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>
                {PRI.map((x) => <option key={x} value={x}>{x[0] + x.slice(1).toLowerCase()}</option>)}
              </select>
              <input type="date" className={inputCls} value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} />
              <select className={inputCls} value={f.assignee_id} onChange={(e) => setF({ ...f, assignee_id: e.target.value })}>
                <option value="">Unassigned (backlog)</option>
                {employees.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <Btn type="submit" disabled={busy} className="w-full sm:w-auto"><Plus size={16} /> {f.assignee_id ? 'Add & assign' : 'Add to backlog'}</Btn>
          </form>

          {p.backlog?.length === 0 ? (
            <Empty text="Empty backlog. Add stories, then assign them to employees to create tasks." />
          ) : (
            <ul className="space-y-2">
              {p.backlog.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-navy-900">{item.title}</div>
                    <div className="text-xs text-slate-500">{item.description || 'No notes'} · {fmtDay(item.deadline)}</div>
                  </div>
                  <Badge value={item.priority} />
                  <select
                    className="h-9 rounded-lg border border-slate-200 px-2 text-xs"
                    defaultValue=""
                    onChange={(e) => e.target.value && assign(item, e.target.value)}
                  >
                    <option value="">Assign to…</option>
                    {employees.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <button onClick={() => remove(item)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Team on this project">
            {!p.members?.length ? <Empty text="Assign backlog items to see contributors." /> : (
              <ul className="space-y-3">
                {p.members.map((m) => (
                  <li key={m.id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-navy-900">{m.name}</span>
                      <span className="text-slate-500">{m.done}/{m.total}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${m.total ? Math.round((m.done / m.total) * 100) : 0}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Meetings in this project" action={<Link to="/meetings/new" className="text-xs font-medium text-brand hover:underline">New meeting →</Link>}>
            {!p.meetings?.length ? <Empty text="No meetings grouped here yet." /> : (
              <ul className="space-y-2">
                {p.meetings.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                    <Link to={`/meetings/${m.id}`} className="truncate font-medium text-navy-900 hover:text-brand">{m.title}</Link>
                    <Badge value={m.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card title="Assigned work">
        {!p.tasks?.length ? <Empty text="Assigned backlog items become tasks here." /> : (
          <ul className="divide-y divide-slate-100">
            {p.tasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 py-3">
                <Link to={`/tasks/${t.id}`} className="min-w-0 flex-1 font-medium text-navy-900 hover:text-brand">{t.title}</Link>
                <span className="text-xs text-slate-500">{t.assignee_name}</span>
                <span className={`text-xs ${t.is_overdue ? 'font-medium text-red-600' : 'text-slate-500'}`}>{fmtDay(t.deadline)}</span>
                <Badge value={t.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
