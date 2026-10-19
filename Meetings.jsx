import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errMsg } from '../api'
import { useAuth } from '../auth'
import { Badge, Empty, ErrorBox, Loading } from '../components/ui'

const STATUSES = ['DRAFT', 'PROCESSING', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'FAILED']

export default function Meetings() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [err, setErr] = useState('')

  useEffect(() => {
    setData(null)
    setErr('')
    const t = setTimeout(() => {
      api
        .get('/meetings/', { params: { q: q || undefined, status: status || undefined, page } })
        .then((r) => setData(r.data))
        .catch((e) => setErr(errMsg(e)))
    }, 250)
    return () => clearTimeout(t)
  }, [q, status, page])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-blue-950">Meetings</h1>
        {user.role === 'MANAGER' && (
          <Link to="/meetings/new" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">
            New meeting
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-64"
          placeholder="Search by title"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
        />
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>
          ))}
        </select>
      </div>

      <ErrorBox msg={err} />
      {!data && !err && <Loading />}
      {data && data.results.length === 0 && <Empty text="No meetings found." />}
      {data && data.results.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Project</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Manager</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((m) => (
                <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link to={`/meetings/${m.id}`} className="font-medium text-blue-700 hover:underline">{m.title}</Link>
                    {m.is_confidential && (
                      <span className="ml-2 rounded bg-gray-800 px-1.5 py-0.5 text-xs text-white">Confidential</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{m.project_name || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-2">{new Date(m.scheduled_at).toLocaleString()}</td>
                  <td className="px-4 py-2">{m.manager_name}</td>
                  <td className="px-4 py-2"><Badge value={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && (data.previous || data.next) && (
        <div className="flex items-center justify-between text-sm">
          <button disabled={!data.previous} onClick={() => setPage(page - 1)} className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40">Previous</button>
          <span className="text-gray-500">Page {page} · {data.count} meetings</span>
          <button disabled={!data.next} onClick={() => setPage(page + 1)} className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}