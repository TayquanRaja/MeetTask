import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, Plus } from 'lucide-react'
import { api, errMsg } from '../api'
import { Badge, Btn, Empty, ErrorBox, Loading, Modal, PageHeader, inputCls } from '../components/ui'
import { fmtDay } from '../utils'

const COLORS = ['#1f5c99', '#0f766e', '#7c3aed', '#b45309', '#be123c', '#334155']

export default function Projects() {
  const [list, setList] = useState(null)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [f, setF] = useState({ name: '', description: '', due_date: '', color: COLORS[0] })

  const load = () => {
    setErr('')
    api
      .get('/projects/', { params: showArchived ? { status: 'ARCHIVED' } : { status: 'ACTIVE' } })
      .then((r) => setList(r.data))
      .catch((e) => setErr(errMsg(e)))
  }

  useEffect(() => { load() }, [showArchived])

  const create = async (e) => {
    e.preventDefault()
    if (!f.name.trim()) return setErr('Project name is required.')
    setBusy(true)
    setErr('')
    try {
      await api.post('/projects/', {
        name: f.name.trim(),
        description: f.description,
        due_date: f.due_date || null,
        color: f.color,
      })
      setOpen(false)
      setF({ name: '', description: '', due_date: '', color: COLORS[0] })
      load()
    } catch (ex) {
      setErr(errMsg(ex))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Group meetings and backlog work the way Jira groups epics — then track completion as tasks land."
      >
        <button
          onClick={() => setShowArchived((v) => !v)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          {showArchived ? 'Show active' : 'Show archived'}
        </button>
        <Btn onClick={() => setOpen(true)}><Plus size={16} /> Create project</Btn>
      </PageHeader>

      <ErrorBox msg={err} />
      {!list && !err && <Loading />}
      {list && list.length === 0 && (
        <Empty text={showArchived ? 'No archived projects.' : 'No projects yet. Create one to attach meetings and a product backlog.'} />
      )}

      {list && list.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => {
            const s = p.stats || {}
            return (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="h-1.5" style={{ background: p.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-navy-900 group-hover:text-brand">{p.name}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.description || 'No description'}</p>
                    </div>
                    <Badge value={p.status} />
                  </div>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>{s.done || 0} of {s.total || 0} done</span>
                      <span className="font-semibold text-navy-900">{s.progress || 0}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${s.progress || 0}%`, background: p.color }} />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{p.meeting_count || 0} meetings</span>
                    <span>{s.backlog || 0} in backlog</span>
                    <span>{s.overdue || 0} overdue</span>
                    {p.due_date && <span>Due {fmtDay(p.due_date)}</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {open && (
        <Modal title="Create a project" onClose={() => setOpen(false)}>
          <form onSubmit={create} className="space-y-3">
            <ErrorBox msg={err} />
            <div>
              <label className="mb-1 block text-sm text-slate-600">Name</label>
              <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={120} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Description</label>
              <textarea className={`${inputCls} h-24 py-2`} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Due date</label>
              <input type="date" className={inputCls} value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Identity color</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setF({ ...f, color: c })}
                    className={`h-8 w-8 rounded-full ring-offset-2 ${f.color === c ? 'ring-2 ring-navy-900' : ''}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <Btn type="submit" className="w-full" disabled={busy}>{busy ? 'Creating…' : 'Create project'}</Btn>
          </form>
        </Modal>
      )}

      {list && list.length === 0 && !showArchived && (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 text-xs text-slate-400">
            <FolderKanban size={14} /> Backlog items become tasks the moment you assign them to an employee.
          </span>
        </div>
      )}
    </div>
  )
}
