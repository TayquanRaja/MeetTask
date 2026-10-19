import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { api, errMsg } from '../api'
import { Empty, ErrorBox, Loading, PageHeader, Pager, TABLE, TH, inputCls } from '../components/ui'
import { fmtDateTime } from '../utils'

export default function Audit() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    setData(null)
    api.get('/audit/', { params: { page } }).then((r) => setData(r.data)).catch((e) => setErr(errMsg(e)))
  }, [page])

  const rows = data?.results.filter((a) =>
    `${a.action} ${a.actor_name || ''} ${a.target_type}`.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <>
      <PageHeader title="Audit logs" subtitle="Important actions across the system, newest first." />
      <div className="relative w-full sm:w-72">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${inputCls} pl-9`} placeholder="Filter this page" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <ErrorBox msg={err} />
      {!data && !err && <Loading />}
      {rows && rows.length === 0 && <Empty text="No audit events found." />}
      {rows && rows.length > 0 && (
        <div className={TABLE}>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className={TH}>When</th>
                <th className={TH}>Who</th>
                <th className={TH}>Action</th>
                <th className={TH}>Target</th>
                <th className={TH}>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtDateTime(a.created_at)}</td>
                  <td className="px-4 py-3">{a.actor_name || 'system'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{a.action}</td>
                  <td className="px-4 py-3 text-slate-500">{a.target_type} {a.target_id}</td>
                  <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-slate-500" title={JSON.stringify(a.detail)}>
                    {Object.keys(a.detail).length ? JSON.stringify(a.detail) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager data={data} page={page} setPage={setPage} noun="events" />
    </>
  )
}