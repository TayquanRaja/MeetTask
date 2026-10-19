import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, errMsg } from '../api'
import { ErrorBox, Loading, inputCls } from '../components/ui'

const COLORS = ['#1f5c99', '#0f766e', '#7c3aed', '#b45309', '#be123c']

export default function MeetingNew() {
  const nav = useNavigate()
  const [employees, setEmployees] = useState(null)
  const [projects, setProjects] = useState([])
  const [f, setF] = useState({ title: '', description: '', scheduled_at: '', is_confidential: false })
  const [sel, setSel] = useState([])
  const [projectMode, setProjectMode] = useState('existing')
  const [projectId, setProjectId] = useState('')
  const [newProject, setNewProject] = useState({ name: '', color: COLORS[0] })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/employees/'), api.get('/projects/', { params: { status: 'ACTIVE' } })])
      .then(([e, p]) => {
        setEmployees(e.data)
        setProjects(p.data)
      })
      .catch((ex) => setErr(errMsg(ex)))
  }, [])

  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!f.title.trim()) return setErr('Title is required.')
    if (!f.scheduled_at) return setErr('Date and time are required.')
    if (sel.length === 0) return setErr('Select at least one participant.')
    if (projectMode === 'existing' && !projectId) return setErr('Select a project, or create a new one.')
    if (projectMode === 'create' && !newProject.name.trim()) return setErr('New project name is required.')
    setBusy(true)
    try {
      let pid = projectId || null
      if (projectMode === 'create') {
        const created = await api.post('/projects/', { name: newProject.name.trim(), color: newProject.color })
        pid = created.data.id
      }
      const { data } = await api.post('/meetings/', {
        ...f,
        title: f.title.trim(),
        scheduled_at: new Date(f.scheduled_at).toISOString(),
        participant_ids: sel,
        project: pid,
      })
      nav(`/meetings/${data.id}`)
    } catch (ex) {
      setErr(errMsg(ex))
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/meetings" className="text-sm text-brand hover:underline">← Back to meetings</Link>
      <h1 className="text-2xl font-semibold text-navy-900">New meeting</h1>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <ErrorBox msg={err} />
        <div>
          <label className="mb-1 block text-sm text-slate-700">Title</label>
          <input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={200} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-700">Agenda / description</label>
          <textarea className={`${inputCls} h-24 py-2`} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-700">Date and time</label>
          <input type="datetime-local" className={inputCls} value={f.scheduled_at} onChange={(e) => setF({ ...f, scheduled_at: e.target.value })} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-2 text-sm font-medium text-navy-900">Project</div>
          <p className="mb-3 text-xs text-slate-500">Meetings live inside a project so tasks and completion stay grouped together.</p>
          <div className="mb-3 flex gap-2">
            <button type="button" onClick={() => setProjectMode('existing')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${projectMode === 'existing' ? 'bg-navy-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Existing project</button>
            <button type="button" onClick={() => setProjectMode('create')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${projectMode === 'create' ? 'bg-navy-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Create new project</button>
          </div>
          {projectMode === 'existing' ? (
            <select className={inputCls} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Select a project…</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          ) : (
            <div className="space-y-3">
              <input className={inputCls} placeholder="Project name" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setNewProject({ ...newProject, color: c })} className={`h-7 w-7 rounded-full ${newProject.color === c ? 'ring-2 ring-navy-900 ring-offset-2' : ''}`} style={{ background: c }} />
                ))}
              </div>
            </div>
          )}
          {projectMode === 'existing' && projects.length === 0 && (
            <p className="mt-2 text-xs text-slate-500">No active projects yet — switch to “Create new project”.</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={f.is_confidential} onChange={(e) => setF({ ...f, is_confidential: e.target.checked })} />
          Confidential (employees cannot view the transcript)
        </label>
        <div>
          <div className="mb-1 text-sm text-slate-700">Participants (registered employees)</div>
          {!employees && !err && <Loading />}
          {employees && employees.length === 0 && <p className="text-sm text-slate-500">No active employees exist yet. Ask an admin to create some.</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {employees?.map((u) => (
              <label key={u.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <input type="checkbox" checked={sel.includes(u.id)} onChange={() => toggle(u.id)} />
                {u.name}
              </label>
            ))}
          </div>
        </div>
        <button disabled={busy} className="rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
          {busy ? 'Creating...' : 'Create meeting'}
        </button>
      </form>
    </div>
  )
}
