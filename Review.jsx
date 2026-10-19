import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { api, errMsg } from '../api'
import { Badge, Btn, Card, Confirm, Empty, ErrorBox, Loading, Modal, Notice, PageHeader, areaCls, inputCls } from '../components/ui'

const lines = (t) => t.split('\n').map((s) => s.trim()).filter(Boolean)
const toDraft = (o) => ({
  summary: o.summary,
  mom: o.mom,
  points: o.discussion_points.join('\n'),
  decisions: o.decisions.join('\n'),
  items: o.action_items.map((a) => ({ ...a })),
})

const L = ({ children }) => <label className="mb-1 block text-sm font-medium text-slate-700">{children}</label>

export default function Review() {
  const { id } = useParams()
  const nav = useNavigate()
  const [m, setM] = useState(null)
  const [out, setOut] = useState(null)
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [dlg, setDlg] = useState(null)
  const [reason, setReason] = useState('')

  const load = useCallback(async () => {
    try {
      const [mm, oo] = await Promise.all([api.get(`/meetings/${id}/`), api.get(`/meetings/${id}/output/`)])
      setM(mm.data)
      setOut(oo.data || null)
      setD(oo.data ? toDraft(oo.data) : null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (!m) return err ? <ErrorBox msg={err} /> : <Loading />
  if (!out || !d) {
    return (
      <>
        <Link to={`/meetings/${id}`} className="text-sm text-brand hover:underline">← Back to meeting</Link>
        <Empty text="There is no AI output to review yet. Upload a recording first." />
      </>
    )
  }

  const editable = out.status === 'PENDING_REVIEW'
  const setItem = (i, patch) => setD((x) => ({ ...x, items: x.items.map((a, k) => (k === i ? { ...a, ...patch } : a)) }))
  const active = d.items.filter((a) => !a.discard)

  const payload = () => ({
    summary: d.summary,
    mom: d.mom,
    discussion_points: lines(d.points),
    decisions: lines(d.decisions),
    action_items: d.items,
  })

  const run = async (fn) => {
    setBusy(true)
    setErr('')
    setMsg('')
    try {
      await fn()
    } catch (e) {
      setErr(errMsg(e))
      setDlg(null)
    } finally {
      setBusy(false)
    }
  }

  const save = () =>
    run(async () => {
      const { data } = await api.patch(`/outputs/${out.id}/`, payload())
      setOut(data)
      setD(toDraft(data))
      setMsg('Draft saved.')
    })

  const approve = () =>
    run(async () => {
      await api.patch(`/outputs/${out.id}/`, payload())
      await api.post(`/outputs/${out.id}/approve/`)
      nav('/tasks')
    })

  const reject = () =>
    run(async () => {
      if (!reason.trim()) throw { message: 'Please enter a reason.' }
      await api.post(`/outputs/${out.id}/reject/`, { reason })
      setDlg(null)
      setReason('')
      await load()
      setMsg('Output rejected.')
    })

  const resubmit = () =>
    run(async () => {
      await api.post(`/outputs/${out.id}/resubmit/`)
      await load()
      setMsg('Output is back in review. You can edit it now.')
    })

  const askApprove = () => {
    const i = d.items.findIndex((a) => !a.discard && !a.assignee_id)
    if (i >= 0) return setErr(`Action item ${i + 1} needs an assignee (or discard it).`)
    setErr('')
    setDlg('approve')
  }

  return (
    <>
      <Link to={`/meetings/${id}`} className="text-sm text-brand hover:underline">← Back to meeting</Link>
      <PageHeader title={`Review: ${m.title}`} subtitle="Edit the AI draft, then approve or reject it.">
        <Badge value={out.status} />
      </PageHeader>

      {out.generated_by === 'mock' && (
        <Notice tone="amber" msg="MOCK output from the development adapter. This was NOT produced by Gemini." />
      )}
      <Notice tone="amber" msg="AI output stays a draft. No task becomes active until you approve." />
      {out.status === 'APPROVED' && (
        <Notice msg={<>Approved. Tasks were created. <Link to="/tasks" className="font-medium underline">View tasks</Link></>} />
      )}
      {out.status === 'REJECTED' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          This output was rejected. Revise and resubmit it to edit again.
          <Btn onClick={resubmit} disabled={busy}>Revise and resubmit</Btn>
        </div>
      )}
      <ErrorBox msg={err} />
      <Notice msg={msg} />

      <Card title="Summary">
        <textarea className={areaCls} rows={3} disabled={!editable} value={d.summary} onChange={(e) => setD({ ...d, summary: e.target.value })} />
      </Card>
      <Card title="Minutes of meeting (draft)">
        <textarea className={areaCls} rows={7} disabled={!editable} value={d.mom} onChange={(e) => setD({ ...d, mom: e.target.value })} />
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Key discussion points (one per line)">
          <textarea className={areaCls} rows={5} disabled={!editable} value={d.points} onChange={(e) => setD({ ...d, points: e.target.value })} />
        </Card>
        <Card title="Key decisions (one per line)">
          <textarea className={areaCls} rows={5} disabled={!editable} value={d.decisions} onChange={(e) => setD({ ...d, decisions: e.target.value })} />
        </Card>
      </div>

      <Card title={`Action items (${active.length} active)`}>
        {d.items.length === 0 && <Empty text="No action items were extracted." />}
        <div className="space-y-4">
          {d.items.map((a, i) => {
            const flag = !a.discard && (!a.assignee_id || !a.deadline || a.confidence === 'LOW')
            return (
              <div
                key={i}
                className={`rounded-xl border p-4 ${a.discard ? 'border-slate-200 bg-slate-50 opacity-60' : flag ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200'}`}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400">#{i + 1}</span>
                    <span className="text-slate-500">Confidence: {String(a.confidence).toLowerCase()}</span>
                    {flag && <span className="font-medium text-amber-700">Needs review</span>}
                  </div>
                  <label className="flex items-center gap-2 text-slate-600">
                    <input type="checkbox" disabled={!editable} checked={!!a.discard} onChange={(e) => setItem(i, { discard: e.target.checked })} />
                    Discard
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <L>Title</L>
                    <input className={inputCls} disabled={!editable} value={a.title} onChange={(e) => setItem(i, { title: e.target.value })} />
                  </div>
                  <div>
                    <L>Assignee</L>
                    <select
                      className={inputCls}
                      disabled={!editable}
                      value={a.assignee_id ?? ''}
                      onChange={(e) => setItem(i, { assignee_id: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Unresolved</option>
                      {m.participants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <L>Deadline</L>
                      <input type="date" className={inputCls} disabled={!editable} value={a.deadline || ''} onChange={(e) => setItem(i, { deadline: e.target.value || null })} />
                    </div>
                    <div>
                      <L>Priority</L>
                      <select className={inputCls} disabled={!editable} value={a.priority} onChange={(e) => setItem(i, { priority: e.target.value })}>
                        {['HIGH', 'MEDIUM', 'LOW'].map((p) => <option key={p} value={p}>{p[0] + p.slice(1).toLowerCase()}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <L>Description</L>
                    <textarea className={areaCls} rows={2} disabled={!editable} value={a.description || ''} onChange={(e) => setItem(i, { description: e.target.value })} />
                  </div>
                </div>
                {a.uncertainty_note && <p className="mt-3 text-sm text-amber-700">Note: {a.uncertainty_note}</p>}
                {a.source_context && <p className="mt-1 text-xs italic text-slate-500">Source: {a.source_context}</p>}
              </div>
            )
          })}
        </div>
      </Card>

      {editable && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur">
          <Btn variant="secondary" onClick={save} disabled={busy}>Save draft</Btn>
          <Btn variant="danger" onClick={() => setDlg('reject')} disabled={busy}><X size={16} /> Reject</Btn>
          <Btn onClick={askApprove} disabled={busy}><Check size={16} /> Approve and create tasks</Btn>
        </div>
      )}

      {dlg === 'approve' && (
        <Confirm
          title="Approve and create tasks?"
          text={`This creates ${active.length} active ${active.length === 1 ? 'task' : 'tasks'} and notifies the assignees. Discarded items are skipped. Clicking twice will not create duplicates.`}
          confirmLabel="Approve"
          busy={busy}
          onConfirm={approve}
          onClose={() => setDlg(null)}
        />
      )}
      {dlg === 'reject' && (
        <Modal title="Reject this output" onClose={() => setDlg(null)}>
          <label className="mb-1 block text-sm text-slate-700">Reason (required)</label>
          <textarea className={areaCls} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="mt-4 flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setDlg(null)} disabled={busy}>Cancel</Btn>
            <Btn variant="danger" onClick={reject} disabled={busy}>{busy ? 'Working...' : 'Reject'}</Btn>
          </div>
        </Modal>
      )}
    </>
  )
}