import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errMsg } from '../api'
import { Card, Empty, ErrorBox, Loading, PageHeader } from '../components/ui'

function Bar({ value, max, color = '#1f5c99' }) {
  const w = max ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-8 overflow-hidden rounded-lg bg-slate-100">
      <div className="flex h-full items-center px-2 text-xs font-semibold text-white transition-all" style={{ width: `${Math.max(w, value ? 8 : 0)}%`, background: color }}>
        {value}
      </div>
    </div>
  )
}

export default function Analytics() {
  const [d, setD] = useState(null)
  const [weeks, setWeeks] = useState(8)
  const [err, setErr] = useState('')

  useEffect(() => {
    setErr('')
    api.get('/analytics/', { params: { weeks } }).then((r) => setD(r.data)).catch((e) => setErr(errMsg(e)))
  }, [weeks])

  if (err && !d) return <ErrorBox msg={err} />
  if (!d) return <Loading />

  const maxWeek = Math.max(...d.weeks.map((w) => w.total), 1)
  const t = d.totals

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Weekly completion of work you created, plus who delivers on time."
      >
        <select
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
          value={weeks}
          onChange={(e) => setWeeks(Number(e.target.value))}
        >
          {[4, 8, 12, 16].map((n) => <option key={n} value={n}>Last {n} weeks</option>)}
        </select>
      </PageHeader>
      <ErrorBox msg={err} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['All tasks', t.total],
          ['Completed', t.done],
          ['Currently overdue', t.overdue],
          ['On-time rate', t.on_time_rate == null ? '—' : `${t.on_time_rate}%`],
        ].map(([label, v]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums text-navy-900">{v}</div>
          </div>
        ))}
      </div>

      <Card title="Weekly analysis">
        <p className="mb-4 text-sm text-slate-500">
          Each bar is tasks created that week. Green is how many of those are now done.
        </p>
        {d.weeks.every((w) => !w.total) ? <Empty text="No tasks in this window yet." /> : (
          <div className="space-y-3">
            {d.weeks.map((w) => {
              const label = new Date(w.week_start + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              const pct = w.total ? Math.round((w.done / w.total) * 100) : 0
              return (
                <div key={w.week_start} className="grid items-center gap-3 sm:grid-cols-[110px_1fr_80px]">
                  <div className="text-xs font-medium text-slate-500">Week of {label}</div>
                  <div className="relative h-9 overflow-hidden rounded-lg bg-slate-100">
                    <div className="absolute inset-y-0 left-0 bg-brand/25" style={{ width: `${(w.total / maxWeek) * 100}%` }} />
                    <div className="absolute inset-y-0 left-0 bg-emerald-500" style={{ width: `${(w.done / maxWeek) * 100}%` }} />
                    <div className="relative flex h-full items-center px-3 text-xs font-medium text-navy-900">
                      {w.done}/{w.total} done · {w.completed_in_week} completed this week
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold tabular-nums text-navy-900">{pct}%</div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card title="Employee performance" action={<Link to="/tasks" className="text-xs font-medium text-brand hover:underline">Open tasks →</Link>}>
        {!d.employees.length ? <Empty text="No assigned work to score yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Employee</th>
                  <th className="pb-3">Assigned</th>
                  <th className="pb-3">Done</th>
                  <th className="pb-3">On time</th>
                  <th className="pb-3">Late</th>
                  <th className="pb-3">Overdue now</th>
                  <th className="pb-3">On-time rate</th>
                </tr>
              </thead>
              <tbody>
                {d.employees.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100">
                    <td className="py-3 font-medium text-navy-900">{e.name}</td>
                    <td className="py-3">{e.assigned}</td>
                    <td className="py-3">{e.done}</td>
                    <td className="py-3 text-emerald-700">{e.on_time}</td>
                    <td className="py-3 text-amber-700">{e.late}</td>
                    <td className="py-3 text-red-600">{e.overdue}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24"><Bar value={e.on_time_rate || 0} max={100} color={e.on_time_rate >= 80 ? '#10b981' : e.on_time_rate >= 50 ? '#1f5c99' : '#dc2626'} /></div>
                        <span className="tabular-nums">{e.on_time_rate == null ? '—' : `${e.on_time_rate}%`}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
