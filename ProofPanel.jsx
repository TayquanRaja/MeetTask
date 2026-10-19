import { useEffect, useRef, useState } from 'react'
import {
  Check, Download, ExternalLink, FileImage, FileSpreadsheet, FileText, Link2, RotateCcw, ShieldCheck, Trash2,
  UploadCloud,
} from 'lucide-react'
import { api, errMsg } from '../api'
import { Badge, Btn, ErrorBox, areaCls, inputCls } from './ui'
import { fmtDateTime, timeAgo } from '../utils'

// Mirrors the backend limits (settings.ALLOWED_PROOF_EXT, MAX_PROOF_MB, MAX_PROOF_FILES). The server is the real check.
const ALLOWED = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'webp']
const MAX_MB = 20
const MAX_FILES = 10
const IMAGES = ['png', 'jpg', 'jpeg', 'gif', 'webp']
const OPENABLE = [...IMAGES, 'pdf', 'txt']

const ext = (name = '') => (name.includes('.') ? name.split('.').pop().toLowerCase() : '')
const fmtSize = (b) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`)

function tone(name) {
  const e = ext(name)
  if (e === 'pdf') return 'bg-red-50 text-red-700'
  if (['xls', 'xlsx', 'csv'].includes(e)) return 'bg-emerald-50 text-emerald-700'
  if (['doc', 'docx', 'ppt', 'pptx', 'txt'].includes(e)) return 'bg-blue-50 text-blue-700'
  if (IMAGES.includes(e)) return 'bg-violet-50 text-violet-700'
  return 'bg-slate-100 text-slate-600'
}

function FileIcon({ name }) {
  const e = ext(name)
  const Icon = IMAGES.includes(e) ? FileImage : ['xls', 'xlsx', 'csv'].includes(e) ? FileSpreadsheet : FileText
  return (
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tone(name)}`}>
      <Icon size={18} />
    </span>
  )
}

/* ---------- authenticated file access (files are private, so a plain link would not carry the login) ---------- */
async function fetchBlob(taskId, file) {
  const { data } = await api.get(`/tasks/${taskId}/proof-files/${file.id}/`, { responseType: 'blob' })
  return data
}

const later = (url) => setTimeout(() => URL.revokeObjectURL(url), 60000)

async function saveFile(taskId, file) {
  const url = URL.createObjectURL(await fetchBlob(taskId, file))
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  later(url)
}

async function viewFile(taskId, file) {
  const win = window.open('', '_blank') // opened while the click is still fresh, so popup blockers allow it
  if (win) win.opener = null
  try {
    const url = URL.createObjectURL(await fetchBlob(taskId, file))
    if (win) win.location.href = url
    else await saveFile(taskId, file)
    later(url)
  } catch (e) {
    if (win) win.close()
    throw e
  }
}

function Thumb({ taskId, file }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let alive = true
    let url = ''
    fetchBlob(taskId, file)
      .then((b) => {
        if (!alive) return
        url = URL.createObjectURL(b)
        setSrc(url)
      })
      .catch(() => {})
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [taskId, file])
  if (!src) return <div className="h-40 w-full animate-pulse rounded-lg bg-slate-100" />
  return <img src={src} alt={file.name} className="max-h-64 rounded-lg border border-slate-200 object-contain" />
}

function SavedFile({ taskId, file, preview }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const run = async (fn) => {
    setBusy(true)
    setErr('')
    try {
      await fn(taskId, file)
    } catch {
      setErr('Could not load this file. Try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <li className="space-y-2">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <FileIcon name={file.name} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-navy-900">{file.name}</div>
          <div className="text-xs text-slate-500">{fmtSize(file.size)}</div>
        </div>
        {OPENABLE.includes(ext(file.name)) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(viewFile)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-brand hover:bg-brand-soft disabled:opacity-50"
          >
            <ExternalLink size={14} /> Open
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => run(saveFile)}
          aria-label={`Download ${file.name}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          <Download size={14} /> Download
        </button>
      </div>
      {preview && IMAGES.includes(ext(file.name)) && <Thumb taskId={taskId} file={file} />}
      {err && <p className="text-xs text-red-600">{err}</p>}
    </li>
  )
}

/* ---------- one submission ---------- */
function ProofCard({ taskId, proof, preview }) {
  const files = proof.files || []
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge value={proof.status} />
        <span className="text-slate-600">
          {proof.submitted_by_name} · {timeAgo(proof.created_at)}
        </span>
      </div>

      {proof.note && <p className="whitespace-pre-wrap text-sm text-slate-700">{proof.note}</p>}

      {proof.link && (
        <a
          href={proof.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center gap-2 text-sm font-medium text-brand hover:underline"
        >
          <Link2 size={15} className="shrink-0" />
          <span className="truncate">{proof.link}</span>
        </a>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <SavedFile key={f.id} taskId={taskId} file={f} preview={preview} />
          ))}
        </ul>
      )}

      {proof.reviewed_by_name && (
        <div
          className={`rounded-lg border px-3 py-2.5 text-sm ${
            proof.status === 'APPROVED'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          <div className="font-medium">
            {proof.status === 'APPROVED' ? 'Approved' : 'Changes requested'} by {proof.reviewed_by_name}
            <span className="font-normal opacity-70"> · {fmtDateTime(proof.reviewed_at)}</span>
          </div>
          {proof.review_comment && <p className="mt-1 whitespace-pre-wrap">{proof.review_comment}</p>}
        </div>
      )}
    </div>
  )
}

/* ---------- employee: attach files and send ---------- */
function ProofUpload({ task, onSent }) {
  const [files, setFiles] = useState([])
  const [link, setLink] = useState('')
  const [note, setNote] = useState('')
  const [drag, setDrag] = useState(false)
  const [pct, setPct] = useState(null)
  const [err, setErr] = useState('')
  const pick = useRef(null)

  const add = (list) => {
    const next = [...files]
    const problems = []
    for (const f of Array.from(list)) {
      if (!ALLOWED.includes(ext(f.name))) problems.push(`${f.name}: this file type is not allowed.`)
      else if (f.size === 0) problems.push(`${f.name}: the file is empty.`)
      else if (f.size > MAX_MB * 1024 * 1024) problems.push(`${f.name}: larger than ${MAX_MB} MB.`)
      else if (next.some((x) => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified)) continue
      else if (next.length >= MAX_FILES) problems.push(`You can attach up to ${MAX_FILES} files.`)
      else next.push(f)
    }
    setFiles(next)
    setErr(problems.join(' '))
  }

  const submit = async () => {
    setErr('')
    setPct(0)
    const fd = new FormData()
    files.forEach((f) => fd.append('files', f))
    if (link.trim()) fd.append('link', link.trim())
    if (note.trim()) fd.append('note', note.trim())
    try {
      await api.post(`/tasks/${task.id}/submit-proof/`, fd, {
        onUploadProgress: (e) => e.total && setPct(Math.round((e.loaded / e.total) * 100)),
      })
      setFiles([])
      setLink('')
      setNote('')
      onSent()
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setPct(null)
    }
  }

  const sending = pct !== null
  const empty = files.length === 0 && !link.trim()

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          add(e.dataTransfer.files)
        }}
        className={`flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${
          drag ? 'border-brand bg-brand-soft' : 'border-slate-300 bg-slate-50/60'
        }`}
      >
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
          <UploadCloud size={22} />
        </span>
        <div className="text-sm font-semibold text-navy-900">{drag ? 'Drop to attach' : 'Drag files here'}</div>
        <div className="text-xs text-slate-500">
          PDF, Word, Excel, PowerPoint, text and images. Up to {MAX_MB} MB each, {MAX_FILES} files.
        </div>
        <Btn variant="secondary" disabled={sending} onClick={() => pick.current?.click()}>
          Choose files
        </Btn>
        <input
          ref={pick}
          type="file"
          multiple
          hidden
          accept={ALLOWED.map((e) => `.${e}`).join(',')}
          onChange={(e) => {
            add(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2" aria-label="Files to send">
          {files.map((f, i) => (
            <li key={`${f.name}-${f.size}-${f.lastModified}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <FileIcon name={f.name} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-navy-900">{f.name}</div>
                <div className="text-xs text-slate-500">{fmtSize(f.size)}</div>
              </div>
              <button
                type="button"
                disabled={sending}
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                aria-label={`Remove ${f.name}`}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <label htmlFor="proof-link" className="mb-1 block text-sm font-medium text-slate-700">Link</label>
        <input
          id="proof-link"
          type="url"
          className={inputCls}
          placeholder="Shared folder, sheet or ticket (https://...)"
          value={link}
          disabled={sending}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="proof-note" className="mb-1 block text-sm font-medium text-slate-700">
          Note for your manager <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="proof-note"
          rows={3}
          maxLength={2000}
          className={areaCls}
          placeholder="Say what you did and anything they should check first."
          value={note}
          disabled={sending}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <ErrorBox msg={err} />

      {sending && (
        <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Btn disabled={empty || sending} onClick={submit}>
          <ShieldCheck size={16} /> {sending ? `Sending ${pct}%` : 'Submit for review'}
        </Btn>
        <span className="text-xs text-slate-500">
          {empty ? 'Add at least one file or a link.' : 'Your manager is notified as soon as you submit.'}
        </span>
      </div>
    </div>
  )
}

/* ---------- manager: decide ---------- */
function Decision({ task, onDone, onError }) {
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState('')

  const send = async (path, okMsg) => {
    setBusy(path)
    onError('')
    try {
      await api.post(`/tasks/${task.id}/${path}/`, { comment: comment.trim() })
      setComment('')
      onDone(okMsg)
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="text-sm font-semibold text-amber-900">Your decision</div>
      <div>
        <label htmlFor="proof-comment" className="mb-1 block text-sm text-amber-900">
          Comment for {task.assignee_name} <span className="opacity-70">(needed if you ask for changes)</span>
        </label>
        <textarea
          id="proof-comment"
          rows={3}
          maxLength={2000}
          className={areaCls}
          placeholder="What is missing or unclear?"
          value={comment}
          disabled={!!busy}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn disabled={!!busy} onClick={() => send('approve-proof', 'Approved. The task is closed.')}>
          <Check size={16} /> {busy === 'approve-proof' ? 'Approving...' : 'Approve and close task'}
        </Btn>
        <Btn
          variant="secondary"
          disabled={!!busy || !comment.trim()}
          onClick={() => send('request-changes', 'Changes requested. The employee has been notified.')}
        >
          <RotateCcw size={16} /> {busy === 'request-changes' ? 'Sending...' : 'Ask for changes'}
        </Btn>
      </div>
    </div>
  )
}

/* ---------- the whole section on the task page ---------- */
export default function ProofSection({ task, isMgr, reload, onNotice, onError }) {
  const [busy, setBusy] = useState(false)
  const proofs = task.proofs || []
  const latest = proofs[0]
  const waiting = task.status === 'IN_REVIEW' && latest?.status === 'SUBMITTED'
  const done = task.status === 'DONE'
  const history = waiting ? proofs.slice(1) : proofs

  const finished = async (msg) => {
    await reload()
    onNotice(msg)
  }

  const withdraw = async () => {
    setBusy(true)
    onError('')
    try {
      await api.post(`/tasks/${task.id}/withdraw-proof/`)
      await finished('Proof withdrawn. You can edit it and send it again.')
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {task.proof_required && !done && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          <span>
            {isMgr
              ? 'You asked for proof on this task. It closes when you approve it.'
              : 'Your manager needs proof before this task can close.'}
          </span>
        </div>
      )}

      {/* what needs doing now */}
      {waiting && (
        <>
          <ProofCard taskId={task.id} proof={latest} preview />
          {isMgr ? (
            <Decision task={task} onDone={finished} onError={onError} />
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-600">Waiting for your manager to review this.</span>
              <Btn variant="secondary" disabled={busy} onClick={withdraw}>
                {busy ? 'Working...' : 'Withdraw and edit'}
              </Btn>
            </div>
          )}
        </>
      )}

      {!waiting && !isMgr && !done && (
        <>
          {latest?.status === 'CHANGES_REQUESTED' && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-900">
              <div className="font-medium">Your manager asked for changes</div>
              {latest.review_comment && <p className="mt-1 whitespace-pre-wrap">{latest.review_comment}</p>}
            </div>
          )}
          {!task.proof_required && (
            <p className="text-sm text-slate-500">
              Optional here: send files or a link to your manager for approval instead of marking the task done yourself.
            </p>
          )}
          <ProofUpload task={task} onSent={() => finished('Sent to your manager for review.')} />
        </>
      )}

      {!waiting && isMgr && !done && proofs.length === 0 && (
        <p className="text-sm text-slate-500">
          {task.proof_required
            ? `Waiting for ${task.assignee_name} to submit proof.`
            : `${task.assignee_name} has not submitted any proof.`}
        </p>
      )}

      {history.length > 0 && (
        <div className="space-y-3">
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
            {waiting ? 'Earlier submissions' : 'Submissions'}
          </div>
          {history.map((p) => (
            <ProofCard key={p.id} taskId={task.id} proof={p} preview={isMgr && p.status === 'APPROVED'} />
          ))}
        </div>
      )}
    </div>
  )
}
